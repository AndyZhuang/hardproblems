// AI 求解器 + 评估器
// 通过子进程调用 llm_call.py（需要真实 LLM API key）
// 失败时回退到增强的启发式评估

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getProblemById } from '../data/problems.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LLM_CALL_PY = join(__dirname, '..', '..', '..', '..', '.minimax', '.builtin-skills', 'llm-call', 'scripts', 'llm_call.py');
const DEFAULT_MODEL = 'minimax/MiniMax-M2.7-highspeed';

// 调 LLM 的底层函数
function callLLM({ system, prompt, model = DEFAULT_MODEL, maxTokens = 4000, temperature = 0.7 }) {
  return new Promise((resolve, reject) => {
    let py = 'python';
    const args = [
      LLM_CALL_PY,
      '--model', model,
      '--prompt', prompt,
      '--max-tokens', String(maxTokens),
      '--temperature', String(temperature)
    ];
    if (system) args.push('--system', system);

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

// =============== 公开 API ===============

export async function solveProblem({ problemId, userInput = '', model = DEFAULT_MODEL }) {
  const p = getProblemById(problemId);
  if (!p) throw new Error('Problem not found: ' + problemId);

  const system = `你是一位世界级的科研导师和科普作者，擅长用 12 岁小朋友都能懂的方式讲解世界上最难的科学问题。` +
    `\n回答要求：\n1. 先用日常生活中的类比让小朋友理解核心问题\n2. 给出严格的学术陈述\n3. 总结截至 2026 年的最新研究进展\n4. 列出 3-5 个可能的研究方向\n5. 给出关键参考文献\n6. 诚实指出真正的难点\n\n格式：Markdown，分章节。`;

  const userPrompt = `# 硬问题：${p.title} (${p.titleEn})\n` +
    `学科：${p.category} | 年份：${p.year} | 状态：${p.status}\n\n` +
    `## 简述\n${p.summary}\n\n` +
    `## 小朋友版\n${p.kid}\n\n` +
    `## 严格陈述\n${p.formal}\n\n` +
    `## 为什么难\n${p.whyHard}\n\n` +
    (userInput ? `## 用户附加要求\n${userInput}\n\n` : '') +
    `## AI 任务\n${p.aiPrompt || '请深入分析这个问题。'}\n\n请提供你的解答。`;

  try {
    const text = await callLLM({ system, prompt: userPrompt, model, maxTokens: 6000 });
    return { text, model, source: 'llm' };
  } catch (err) {
    return { text: enhancedHeuristicSolve(p, userInput), model: 'heuristic', source: 'fallback', note: err.message };
  }
}

export async function evaluateSolution({ problemId, content, model = DEFAULT_MODEL }) {
  const p = getProblemById(problemId);
  if (!p) throw new Error('Problem not found');

  const system = `你是一位严格的学术评审。评估一个用户提交的硬问题解答。\n` +
    `评分标准（0-100）：\n` +
    `- 0-20: 答非所问或完全不正确\n` +
    `- 21-40: 涉及相关内容但有严重错误\n` +
    `- 41-60: 基本正确但缺乏深度\n` +
    `- 61-80: 准确、有洞见、有逻辑\n` +
    `- 81-100: 原创、严谨、有突破性想法\n\n` +
    `严格 JSON 输出：{"score": <0-100>, "reasoning": "<why>", "strengths": ["..."], "weaknesses": ["..."]}`;

  const userPrompt = `# 问题：${p.title}\n\n${p.formal}\n\n# 用户提交\n${content.slice(0, 6000)}\n\n请评估。`;

  try {
    const text = await callLLM({ system, prompt: userPrompt, model, maxTokens: 1500, temperature: 0.3 });
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return { score: clamp(parsed.score || 0, 0, 100), reasoning: parsed.reasoning || '', strengths: parsed.strengths || [], weaknesses: parsed.weaknesses || [], model, source: 'llm' };
    }
    throw new Error('No JSON in response');
  } catch (err) {
    return { ...enhancedHeuristicEval(p, content), source: 'fallback' };
  }
}

function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }

// =============== 增强的启发式回退 ===============

function enhancedHeuristicSolve(p, userInput) {
  return `# ${p.title} (${p.titleEn})

> *当前 LLM 不可用，以下是基于公开资料的深度整理。配置 LLM API key 后将获得 AI 原创解答。*

## 🧒 给小朋友的核心比喻

${p.kid}

## 📐 严格数学/科学陈述

${p.formal}

## 🔥 为什么是"硬"问题

${p.whyHard}

## 🧭 可能的解题方向

1. **核心文献梳理**：先把近 5 年的关键论文读透，特别是引用数最高、被讨论最多的几篇
2. **跨学科类比**：很多 hard problem 的突破来自跨学科借鉴。比如代数几何在数论中的应用
3. **计算实验**：即使是纯数学问题，也可以做大量的数值实验找规律
4. **AI 辅助**：用大模型做文献综述、找模式、提出假说
5. **小而具体的子问题**：把大问题拆成可以验证的小问题

## 📚 进一步阅读

- 维基百科：[${p.titleEn}](https://en.wikipedia.org/wiki/${encodeURIComponent(p.titleEn.replace(/\s+/g, '_'))})
- 搜索关键词：\`${p.titleEn} survey 2024 2025 2026\`
- Google Scholar 最新引用

## 🧠 你的下一步

${userInput ? `基于你提到的"${userInput.slice(0, 100)}"，建议先尝试方向 1 和 2。` : '建议先从核心文献和最新的 survey 入手，建立全景认知。'}

> 提示：把这个 prompt 复制到你常用的 AI 工具（ChatGPT、Claude、Gemini…），它会基于具体的问题给出更个性化的解答。`;
}

function enhancedHeuristicEval(p, content) {
  const text = content.toLowerCase();
  let score = 0;
  const strengths = [];
  const weaknesses = [];

  // 长度分
  if (content.length < 50) {
    weaknesses.push('内容过短，难以评估深度');
  } else if (content.length < 200) {
    score += 15;
    weaknesses.push('内容偏短，建议展开论述');
  } else if (content.length < 800) {
    score += 30;
  } else if (content.length < 2000) {
    score += 45;
    strengths.push('内容长度充分');
  } else {
    score += 50;
    strengths.push('内容详尽');
  }

  // 结构分
  if (content.includes('## ') || content.includes('# ')) {
    score += 8;
    strengths.push('使用了 Markdown 章节结构');
  }
  if (content.includes('```') || content.includes('$')) {
    score += 5;
    strengths.push('包含代码或公式');
  }
  if (content.match(/\*\*[^*]+\*\*/)) {
    score += 3;
    strengths.push('使用了强调格式');
  }

  // 与问题的相关性
  const keywords = [
    ...p.title.toLowerCase().split(/\s+/),
    ...p.titleEn.toLowerCase().split(/\s+/),
    ...(p.tags || []).map(t => t.toLowerCase())
  ].filter(w => w.length > 2);
  let matchCount = 0;
  for (const k of keywords) {
    if (text.includes(k)) matchCount++;
  }
  const matchRatio = keywords.length ? matchCount / keywords.length : 0;
  if (matchRatio > 0.3) {
    score += 15;
    strengths.push(`与问题关键词高度相关（${Math.round(matchRatio * 100)}%）`);
  } else if (matchRatio > 0.1) {
    score += 8;
  } else {
    weaknesses.push('与问题主题相关性较低');
  }

  // 思考深度信号
  const depthSignals = ['因为', '所以', '因此', '但是', '然而', '例如', '比如', '假设', '证明', '实验', '观察', '理论', '模型', '方法', '思路'];
  const depthMatches = depthSignals.filter(s => content.includes(s)).length;
  if (depthMatches >= 5) {
    score += 10;
    strengths.push('展现深入思考过程');
  } else if (depthMatches >= 2) {
    score += 5;
  } else if (depthMatches === 0) {
    weaknesses.push('缺少逻辑连接词，思考深度不够明显');
  }

  // 原创性
  if (content.includes('我的看法') || content.includes('我认为') || content.includes('我猜想') || content.includes('我的理解') || content.includes('I think') || content.includes('my view')) {
    score += 5;
    strengths.push('包含个人观点');
  }

  score = clamp(score, 0, 100);
  return {
    score,
    reasoning: `启发式评估：基于长度(${content.length})、结构、关键词匹配(${Math.round(matchRatio * 100)}%)、思考深度信号(${depthMatches})等维度。`,
    strengths: strengths.length ? strengths : ['提交了内容'],
    weaknesses: weaknesses.length ? weaknesses : ['需要真实 LLM 评估来获得更准确的质量判断'],
    model: 'heuristic'
  };
}
