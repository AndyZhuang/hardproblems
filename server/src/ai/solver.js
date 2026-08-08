// AI 求解器 v2：多轮对话 + RAG 上下文 + 严格 rubric 评估
// 通过子进程调用 llm_call.py（需要真实 LLM API key）
// 失败时回退到增强的启发式

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getProblemById, PROBLEMS } from '../data/problems.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LLM_CALL_PY = join(__dirname, '..', '..', '..', '..', '.minimax', '.builtin-skills', 'llm-call', 'scripts', 'llm_call.py');
const DEFAULT_MODEL = 'minimax/MiniMax-M2.7-highspeed';

// =============== 底层 LLM 调用 ===============

function callLLM({ system, messages, prompt, model = DEFAULT_MODEL, maxTokens = 4000, temperature = 0.7, responseFormat }) {
  return new Promise((resolve, reject) => {
    let py = 'python';
    const args = [
      LLM_CALL_PY,
      '--model', model,
      '--max-tokens', String(maxTokens),
      '--temperature', String(temperature)
    ];
    // 优先用 messages（多轮），否则用 prompt（单轮）
    if (messages && Array.isArray(messages) && messages.length > 0) {
      // 转为 llm_call.py 期望的 JSON 字符串
      args.push('--messages', JSON.stringify(messages));
      if (system) args.push('--system', system);
    } else if (prompt) {
      args.push('--prompt', prompt);
      if (system) args.push('--system', system);
    } else {
      return reject(new Error('callLLM: messages or prompt required'));
    }
    if (responseFormat) args.push('--response-format', responseFormat);

    const proc = spawn(py, args, { windowsHide: true });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', d => stdout += d.toString('utf-8'));
    proc.stderr.on('data', d => stderr += d.toString('utf-8'));
    proc.on('error', err => reject(err));
    proc.on('close', code => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`LLM call failed (code ${code}): ${stderr.slice(0, 300)}`));
      }
    });
    setTimeout(() => {
      proc.kill();
      reject(new Error('LLM call timeout after 90s'));
    }, 90000);
  });
}

function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }

// =============== RAG：构建上下文 ===============

/**
 * 给定一个问题，构建 RAG 上下文：
 * - 当前问题的 kid/formal/whyHard/aiPrompt
 * - 2-3 个相关问题（同 category 或共享 tag）
 * - 同 category 的学科参考资源
 */
export function buildRAGContext(problemId) {
  const p = getProblemById(problemId);
  if (!p) return null;

  // 找 3 个相关问题：同 category，优先级 = tag 重合度
  const sameCategory = PROBLEMS.filter(x => x.id !== p.id && x.category === p.category);
  const scored = sameCategory.map(x => {
    const overlap = (x.tags || []).filter(t => (p.tags || []).includes(t)).length;
    return { x, overlap };
  }).sort((a, b) => b.overlap - a.overlap);
  const related = scored.slice(0, 3).map(s => s.x);

  return {
    problem: {
      id: p.id, title: p.title, titleEn: p.titleEn,
      category: p.category, year: p.year, status: p.status,
      tags: p.tags || [], reward: p.reward,
      // 默认用中文；en-US 时用英文版（如果存在）
      kid: p.kid, kidEn: p.kidEn,
      formal: p.formal, formalEn: p.formalEn,
      whyHard: p.whyHard, whyHardEn: p.whyHardEn,
      aiPrompt: p.aiPrompt, aiPromptEn: p.aiPromptEn,
      summary: p.summary, summaryEn: p.summaryEn
    },
    related: related.map(r => ({
      id: r.id, title: r.title, titleEn: r.titleEn,
      category: r.category, status: r.status,
      formal: r.formal, whyHard: r.whyHard, summary: r.summary
    }))
  };
}

// =============== 多轮对话 (chatProblem) ===============

// 语言 → 答案语言指令
const LANG_INSTRUCTIONS = {
  'zh-CN': '请用中文回答。',
  'en-US': 'Please respond in English.',
  'es-ES': 'Por favor responde en español.',
  'ja-JP': '日本語で回答してください。',
};

function langInstruction(lang) {
  if (!lang) return '';
  return LANG_INSTRUCTIONS[lang] || LANG_INSTRUCTIONS['en-US'];
}

/**
 * 多轮对话 AI 求解。
 * @param {string} problemId
 * @param {Array<{role: 'user'|'assistant', content: string}>} messages 完整对话历史
 * @param {string} model
 * @param {string} lang 输出语言 (zh-CN / en-US / es-ES / ja-JP)
 * @returns {Promise<{reply: string, model: string, source: string, context: object}>}
 */
export async function chatProblem({ problemId, messages = [], model = DEFAULT_MODEL, lang }) {
  const ctx = buildRAGContext(problemId);
  if (!ctx) throw new Error('Problem not found: ' + problemId);
  const p = ctx.problem;

  const system = buildChatSystemPrompt(ctx, lang);

  // 转换 messages 为 llm_call.py 期望的格式
  // messages 必须是 [{role, content}, ...] 形式
  const apiMessages = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content
  }));

  try {
    const text = await callLLM({
      system,
      messages: apiMessages,
      model,
      maxTokens: 4000,
      temperature: 0.7
    });
    return {
      reply: text,
      model,
      source: 'llm',
      context: { problemId: p.id, category: p.category, relatedCount: ctx.related.length, lang }
    };
  } catch (err) {
    return {
      reply: heuristicChat(ctx, messages, lang),
      model: 'heuristic',
      source: 'fallback',
      note: err.message,
      context: { problemId: p.id, category: p.category, relatedCount: ctx.related.length, lang }
    };
  }
}

function buildChatSystemPrompt(ctx, lang) {
  const p = ctx.problem;
  // 按语言选择内容（en-US 优先用 *En 字段）
  const useEn = lang === 'en-US';
  const title = useEn ? p.titleEn : p.title;
  const summary = (useEn && p.summaryEn) || p.summary;
  const kid = (useEn && p.kidEn) || p.kid;
  const formal = (useEn && p.formalEn) || p.formal;
  const whyHard = (useEn && p.whyHardEn) || p.whyHard;
  const aiPrompt = (useEn && p.aiPromptEn) || p.aiPrompt || 'Please analyze this problem in depth.';

  const relatedList = ctx.related.length
    ? ctx.related.map((r, i) => `  ${i + 1}. ${r.title} (${r.titleEn}) — ${r.formal.slice(0, 100)}`).join('\n')
    : '  (none)';

  const langInstr = langInstruction(lang);

  return `You are a world-class research mentor and popular-science author. Your task is to help users understand hard problems through multi-turn dialogue.

# Current problem
- Title: ${title}
- Category: ${p.category} | Year: ${p.year} | Status: ${p.status}
- One-liner: ${summary}
- Kid-friendly: ${kid}
- Formal: ${formal}
- Why hard: ${whyHard}
- AI prompt: ${aiPrompt}

# Related problems (for reference)
${relatedList}

# Response style
1. Be concise and direct. Prioritize actionable ideas, formulas, references
2. For math/physics/chem/bio, use rigorous notation and units
3. Be honest if the question is beyond your knowledge or open
4. Aim for 200-600 words unless user asks for more/less
5. Use Markdown (**bold**, lists, formulas \`$...$\`, code blocks)
${langInstr ? '6. ' + langInstr : ''}

# Multi-turn dialogue
- This is a continuous conversation. Reference previous turns
- If the user follows up, pushes back, asks for examples, or asks for simplification, respond specifically
- Keep depth and style consistent across turns`;
}

// =============== 严格 Rubric 评估 (evaluateSolution) ===============

const RUBRIC = {
  accuracy: '准确性：陈述和推理是否在事实层面正确？是否引用了正确的定理/数据/实验？',
  depth: '深度：是否超越了表面理解？是否触及了问题的核心困难？',
  originality: '原创性：是否提出了新角度、新类比、新假设？还是只是复述已知？',
  rigor: '严谨性：是否有清晰定义、严格推理、可验证的论述？是否承认了不确定的地方？',
  clarity: '表达：结构是否清晰？语言是否精确？是否易于理解？'
};

/**
 * 严格 5 维度 rubric 评估。
 * @returns {Promise<{score: number, dimensions: {accuracy, depth, originality, rigor, clarity}, reasoning, strengths, weaknesses, model, source}>}
 */
export async function evaluateSolution({ problemId, content, model = DEFAULT_MODEL }) {
  const ctx = buildRAGContext(problemId);
  if (!ctx) throw new Error('Problem not found');
  const p = ctx.problem;

  const dimList = Object.entries(RUBRIC).map(([k, desc]) => `- **${k}** (0-20): ${desc}`).join('\n');

  const system = `你是一位严格的学术评审。评估一个用户对"硬问题"的解答。

# 评分 Rubric (5 维度 × 20 分 = 总分 100)
${dimList}

# 评分标准
- 0-4: 完全缺失或错误
- 5-9: 有提及但浅薄或有明显错误
- 10-14: 基本合格，有一定理解
- 15-17: 良好，超越平均
- 18-20: 卓越，达到研究水平

# 输出格式（严格 JSON）
{
  "dimensions": {
    "accuracy": <0-20>,
    "depth": <0-20>,
    "originality": <0-20>,
    "rigor": <0-20>,
    "clarity": <0-20>
  },
  "score": <dimensions 总和 0-100>,
  "reasoning": "<为什么这样评分>",
  "strengths": ["<具体优势 1>", "<具体优势 2>", ...],
  "weaknesses": ["<具体不足 1>", "<具体不足 2>", ...],
  "verdict": "<一句话总结>"
}

只返回 JSON，不要其他文字。`;

  const userPrompt = `# 问题：${p.title} (${p.titleEn})
学科：${p.category} | 状态：${p.status}

## 严格陈述
${p.formal}

## 为什么难
${p.whyHard}

## 用户提交的解答
${content.slice(0, 8000)}

请按 rubric 严格评估。`;

  try {
    const text = await callLLM({
      system,
      prompt: userPrompt,
      model,
      maxTokens: 2000,
      temperature: 0.3
    });
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const parsed = JSON.parse(jsonMatch[0]);
    return normalizeEval(parsed, model, 'llm');
  } catch (err) {
    return { ...heuristicEval(ctx, content), model: 'heuristic', source: 'fallback', note: err.message };
  }
}

function normalizeEval(parsed, model, source) {
  const dims = parsed.dimensions || {};
  const accuracy = clamp(parseInt(dims.accuracy) || 0, 0, 20);
  const depth = clamp(parseInt(dims.depth) || 0, 0, 20);
  const originality = clamp(parseInt(dims.originality) || 0, 0, 20);
  const rigor = clamp(parseInt(dims.rigor) || 0, 20);
  const clarity = clamp(parseInt(dims.clarity) || 0, 0, 20);
  const total = accuracy + depth + originality + rigor + clarity;
  return {
    score: total,
    dimensions: { accuracy, depth, originality, rigor, clarity },
    reasoning: parsed.reasoning || '',
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
    verdict: parsed.verdict || '',
    model, source
  };
}

// =============== 启发式回退 ===============

function heuristicChat(ctx, messages, lang) {
  const p = ctx.problem;
  const lastUser = [...messages].reverse().find(m => m.role === 'user')?.content || '';
  const turn = messages.filter(m => m.role === 'user').length;

  // 按语言选择模板
  const templates = {
    'zh-CN': {
      title: `# 💬 第 ${turn} 轮 · ${p.title}`,
      disclaimer: '> *当前 LLM 不可用，以下是基于公开资料的回复。配置 LLM API key 后将获得 AI 原创多轮对话。*',
      kidHeader: '## 🧒 先回到小朋友版',
      formalHeader: '## 📐 严格陈述',
      whyHeader: '## 🔥 为什么难',
      asking: `## 🧭 你这次问的："${lastUser.slice(0, 100)}"`,
      approach: '这个问题可以从以下几个角度切入：',
      tip1: `1. **先定义核心概念** — ${p.summary}`,
      tip2: '2. **看历史进展** — 关键节点：2000 年前后有重要突破（参见学科综述）',
      tip3: `3. **跨学科类比** — 在 ${ctx.related[0]?.title || '其他相关问题'} 中能找到有用的类比`,
      tip4: '4. **动手算/做** — 即使是理论问题也可以做数值实验验证',
      nextHeader: '## 💡 建议下一步',
      next1: '- 提供更多你的具体问题（数学表述/物理图像/计算数据）',
      next2: '- 引用你熟悉的论文或教材，我可以帮你梳理',
      next3: `- 想看一个具体子问题吗？我可以从 ${p.title} 里拆出 2-3 个小问题`,
      footer: (turn > 3) ? `\n\n---\n\n*我们已经聊了 ${turn} 轮。如果想换个角度，可以试问：这个问题和 ${ctx.related[0]?.title || '其他相关问题'} 有何联系？*` : ''
    },
    'en-US': {
      title: `# 💬 Turn ${turn} · ${p.title}`,
      disclaimer: '> *LLM currently unavailable. This is a public-data-based reply. Set LLM API key for original AI conversation.*',
      kidHeader: '## 🧒 Kid-friendly recap',
      formalHeader: '## 📐 Formal statement',
      whyHeader: '## 🔥 Why it\'s hard',
      asking: `## 🧭 You asked: "${lastUser.slice(0, 100)}"`,
      approach: 'You can approach this from several angles:',
      tip1: `1. **Define core concepts** — ${p.summary}`,
      tip2: '2. **Review history** — Key milestones: important breakthroughs around 2000 (see surveys)',
      tip3: `3. **Cross-disciplinary analogy** — useful parallels in ${ctx.related[0]?.title || 'related problems'}`,
      tip4: '4. **Compute/experiment** — even theoretical problems can be probed with numerics',
      nextHeader: '## 💡 Next steps',
      next1: '- Provide more specifics (math, physics, data)',
      next2: '- Cite papers/textbooks you know; I can organize them',
      next3: `- Want a sub-problem? I can break down ${p.title} into 2-3 smaller ones`,
      footer: (turn > 3) ? `\n\n---\n\n*We've talked for ${turn} turns. To switch angle, try: how does this relate to ${ctx.related[0]?.title || 'related problems'}?*` : ''
    },
    'es-ES': {
      title: `# 💬 Turno ${turn} · ${p.title}`,
      disclaimer: '> *LLM no disponible. Esta es una respuesta basada en datos públicos.*',
      kidHeader: '## 🧒 Resumen para niños',
      formalHeader: '## 📐 Declaración formal',
      whyHeader: '## 🔥 Por qué es difícil',
      asking: `## 🧭 Preguntaste: "${lastUser.slice(0, 100)}"`,
      approach: 'Puedes abordar esto desde varios ángulos:',
      tip1: `1. **Definir conceptos** — ${p.summary}`,
      tip2: '2. **Revisar historia** — Hitos: avances importantes alrededor de 2000',
      tip3: `3. **Analogía interdisciplinaria** — paralelos en ${ctx.related[0]?.title || 'problemas relacionados'}`,
      tip4: '4. **Computar/experimentar** — incluso problemas teóricos se pueden sondear con numéricos',
      nextHeader: '## 💡 Próximos pasos',
      next1: '- Proporciona más detalles (matemáticas, física, datos)',
      next2: '- Cita artículos que conozcas',
      next3: `- ¿Quieres un sub-problema? Puedo descomponer ${p.title} en 2-3 más pequeños`,
      footer: (turn > 3) ? `\n\n---\n\n*Hemos hablado ${turn} turnos. Para cambiar ángulo: ¿cómo se relaciona con ${ctx.related[0]?.title || 'problemas relacionados'}?*` : ''
    },
    'ja-JP': {
      title: `# 💬 ${turn}ターン目 · ${p.title}`,
      disclaimer: '> *LLMが利用できません。公開データに基づく返信です。*',
      kidHeader: '## 🧒 子ども向け要約',
      formalHeader: '## 📐 厳密な記述',
      whyHeader: '## 🔥 なぜ難しいか',
      asking: `## 🧭 質問: 「${lastUser.slice(0, 100)}」`,
      approach: 'いくつかのアプローチがあります:',
      tip1: `1. **基本概念を定義** — ${p.summary}`,
      tip2: '2. **歴史を確認** — 2000年前後に重要な進展',
      tip3: `3. **学際的類推** — ${ctx.related[0]?.title || '関連問題'}と比較`,
      tip4: '4. **計算・実験** — 理論問題も数値計算で探れる',
      nextHeader: '## 💡 次のステップ',
      next1: '- 詳細を提供 (数学、物理学、データ)',
      next2: '- 知っている論文を引用',
      next3: `- サブプロブレム? ${p.title}を2-3個に分解可能`,
      footer: (turn > 3) ? `\n\n---\n\n*${turn}ターン話しました。角度を変えるには: ${ctx.related[0]?.title || '関連問題'}との関係は?*` : ''
    }
  };

  const t = templates[lang] || templates['en-US'];
  return [
    t.title, '',
    t.disclaimer, '',
    t.kidHeader, '',
    p.kid, '',
    t.formalHeader, '',
    p.formal, '',
    t.whyHeader, '',
    p.whyHard, '',
    t.asking, '',
    t.approach, '',
    t.tip1, t.tip2, t.tip3, t.tip4, '',
    t.nextHeader, '',
    t.next1, t.next2, t.next3,
    t.footer
  ].join('\n');
}

function heuristicEval(ctx, content) {
  const p = ctx.problem;
  const text = content.toLowerCase();
  const len = content.length;

  // 各维度启发式打分
  const accuracy = computeAccuracy(p, content, text);
  const depth = computeDepth(p, content, text);
  const originality = computeOriginality(content, text);
  const rigor = computeRigor(content);
  const clarity = computeClarity(content);
  const total = accuracy + depth + originality + rigor + clarity;

  const strengths = [];
  const weaknesses = [];
  if (accuracy >= 12) strengths.push('事实陈述较准确'); else if (accuracy < 8) weaknesses.push('可能存在事实错误或缺乏引用');
  if (depth >= 12) strengths.push('论述有深度'); else if (depth < 8) weaknesses.push('论述偏浅');
  if (originality >= 10) strengths.push('有一定原创思考'); else if (originality < 6) weaknesses.push('主要是复述已有内容');
  if (rigor >= 12) strengths.push('逻辑结构严谨'); else if (rigor < 8) weaknesses.push('逻辑松散或跳跃');
  if (clarity >= 12) strengths.push('表达清晰'); else if (clarity < 8) weaknesses.push('表达需要改进');

  return {
    score: total,
    dimensions: { accuracy, depth, originality, rigor, clarity },
    reasoning: `启发式评估（无 LLM）：长度 ${len} 字，关键词匹配度见下。`,
    strengths: strengths.length ? strengths : ['提交了内容'],
    weaknesses: weaknesses.length ? weaknesses : ['需要真实 LLM 评估来获得更准确的质量判断'],
    verdict: total >= 70 ? '良好' : total >= 50 ? '及格' : '需要加强',
    model: 'heuristic',
    source: 'heuristic'
  };
}

function computeAccuracy(p, content, text) {
  // 关键词匹配
  const keywords = [
    ...p.title.toLowerCase().split(/\s+/),
    ...p.titleEn.toLowerCase().split(/\s+/),
    ...(p.tags || []).map(t => t.toLowerCase())
  ].filter(w => w.length > 2);
  const matchCount = keywords.filter(k => text.includes(k)).length;
  const ratio = keywords.length ? matchCount / keywords.length : 0;
  if (ratio > 0.5) return 16;
  if (ratio > 0.3) return 13;
  if (ratio > 0.1) return 10;
  return 6;
}

function computeDepth(p, content, text) {
  const depthSignals = ['因为', '所以', '因此', '但是', '然而', '例如', '比如', '假设', '证明', '实验', '观察', '理论', '模型', '方法', '思路', 'because', 'therefore', 'however', 'thus', 'hence', 'since', 'proof', 'theorem', 'experiment'];
  const matches = depthSignals.filter(s => text.includes(s)).length;
  // 长度加分
  let s = 0;
  if (matches >= 6) s = 14; else if (matches >= 3) s = 11; else if (matches >= 1) s = 8; else s = 5;
  if (content.length > 2000) s += 3; else if (content.length > 800) s += 1;
  return clamp(s, 0, 20);
}

function computeOriginality(content, text) {
  const markers = ['我的看法', '我认为', '我猜想', '我的理解', '我的假设', 'I think', 'my view', 'I believe', 'in my opinion', '我提出', '我的思路', '我设计'];
  const matches = markers.filter(s => text.includes(s)).length;
  let s = 0;
  if (matches >= 2) s = 13; else if (matches >= 1) s = 10; else s = 6;
  return clamp(s, 0, 20);
}

function computeRigor(content) {
  let s = 0;
  if (content.includes('## ') || content.includes('# ')) s += 4;  // Markdown 结构
  if (content.includes('```') || /\$\$?/.test(content)) s += 4;  // 代码/公式
  if (/\*\*[^*]+\*\*/.test(content)) s += 2;
  if (content.match(/[0-9]+\./g)?.length >= 3) s += 3;  // 列举
  if (content.length > 1000) s += 2;
  if (/[^。.]\n/.test(content)) s += 2;  // 多段落
  return clamp(s + 5, 0, 20);  // 基础分 5
}

function computeClarity(content) {
  let s = 10;  // 基础分
  if (content.length < 100) s = 4;  // 太短
  if (content.length < 50) s = 2;
  if (content.length > 500) s += 4;
  if (content.length > 2000) s += 2;
  if (/^#+ /.test(content)) s += 2;
  if (content.split('\n\n').length >= 3) s += 2;  // 段落分明
  return clamp(s, 0, 20);
}

// =============== 向后兼容：solveProblem 单轮 ===============

/**
 * 单轮 AI 求解（保留旧接口，内部用 chat 实现）
 */
export async function solveProblem({ problemId, userInput = '', model = DEFAULT_MODEL }) {
  const r = await chatProblem({
    problemId,
    messages: [{ role: 'user', content: userInput || '请详细分析这个问题。' }],
    model
  });
  return { text: r.reply, model: r.model, source: r.source, note: r.note };
}
