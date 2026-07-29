// AI 路由：求解 + 评估 + 贡献
import { Router } from 'express';
import { solveProblem, evaluateSolution } from '../ai/solver.js';
import { getProblemById } from '../data/problems.js';
import { requireAuth } from './users.js';

const router = Router();

// 求解（无需登录，但记录使用）
router.post('/solve', requireAuth, async (req, res) => {
  const { problem_id, user_input = '' } = req.body || {};
  if (!problem_id) return res.status(400).json({ error: 'problem_id required' });
  const p = getProblemById(problem_id);
  if (!p) return res.status(404).json({ error: 'problem not found' });

  try {
    const result = await solveProblem({ problemId: problem_id, userInput: user_input });
    res.json({
      problemId: problem_id,
      problemTitle: p.title,
      prompt: p.aiPrompt,
      userInput: user_input,
      solution: result.text,
      model: result.model,
      source: result.source
    });
  } catch (e) {
    res.status(500).json({ error: 'AI solve failed: ' + e.message });
  }
});

// 评估解答（无需登录）
router.post('/evaluate', async (req, res) => {
  const { problem_id, content } = req.body || {};
  if (!problem_id || !content) return res.status(400).json({ error: 'problem_id and content required' });
  const p = getProblemById(problem_id);
  if (!p) return res.status(404).json({ error: 'problem not found' });

  try {
    const result = await evaluateSolution({ problemId: problem_id, content });
    res.json({
      problemId: problem_id,
      ...result
    });
  } catch (e) {
    res.status(500).json({ error: 'AI evaluate failed: ' + e.message });
  }
});

// 用户贡献问题：把粗略想法扩展成完整问题（需要登录）
router.post('/contribute', requireAuth, async (req, res) => {
  const { rough_idea, category, extra_hints } = req.body || {};
  if (!rough_idea || !rough_idea.trim()) return res.status(400).json({ error: 'rough_idea required' });
  if (!category) return res.status(400).json({ error: 'category required' });

  try {
    // 用 LLM 扩展（如果有）
    const prompt = `你是一位跨学科问题设计专家。请把用户提交的一个粗略想法，扩展成一个完整、有结构、值得挑战的"硬问题"记录。

用户想法：${rough_idea}

学科：${category}
附加要求：${extra_hints || '无'}

请按以下 JSON 格式返回（不要加额外文字）：
{
  "title": "中文标题（20字内）",
  "titleEn": "English Title",
  "summary": "一句话简介",
  "kid": "8-12岁能懂的解释（3-5句，用比喻）",
  "formal": "严格陈述（如适用）",
  "whyHard": "为什么难（1-2句）",
  "aiPrompt": "给 AI 解题用的 prompt",
  "tags": ["标签1", "标签2"],
  "participate": [
    {"type": "discuss", "label": "想法/讨论", "desc": "..."},
    {"type": "essay", "label": "写文章", "desc": "..."},
    {"type": "code", "label": "写代码", "desc": "..."}
  ]
}

participate 中 type 必须是以下之一：solve, code, experiment, data, survey, discuss, prototype, community, citizen-science, kid-project, visualize, model, analyze, essay, team, translate, teach, fund
请选 2-4 个最相关的参与方式。
请直接返回 JSON。`;

    let problem;
    let source = 'llm', model = 'unknown';
    try {
      // 调用 LLM
      const { callLLM } = await import('../ai/solver.js');
      // Note: solveProblem returns {text, model, source}; we'll use a custom approach
      // 实际上复用 LLM call：
      const { default: solver } = await import('../ai/solver.js');
      const result = await solver.expandProblem ? await solver.expandProblem(prompt) : null;
      if (result?.text) {
        // 解析 LLM 返回的 JSON
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          problem = JSON.parse(jsonMatch[0]);
          model = result.model;
        }
      }
    } catch (e) {
      console.warn('[ai/contribute] LLM failed, using heuristic:', e.message);
    }

    // Fallback: 启发式
    if (!problem) {
      const idea = rough_idea.trim();
      problem = {
        title: idea.length > 50 ? idea.slice(0, 50) + '…' : idea,
        titleEn: 'User-submitted: ' + (idea.slice(0, 50) || category),
        summary: idea,
        kid: `想象你在问："${idea.slice(0, 30)}"——这是一个真问题吗？科学家们真的在思考它吗？小朋友可以从身边开始：观察、动手、提问、讨论。`,
        formal: `对"${idea}"做严格的 ${category} 形式化。`,
        whyHard: '这是一个用户提交的问题，暂无公认解答路径。需要跨学科协作。',
        aiPrompt: `你是一位 ${category} 专家。详细分析"${idea}"，列出 3 个可尝试的研究方向。`,
        tags: [category, '用户提交', 'AI生成'],
        participate: [
          { type: 'discuss', label: '想法/讨论', desc: '在社区分享你的思路' },
          { type: 'essay', label: '写文章', desc: '写一篇思考笔记' }
        ]
      };
      source = 'fallback';
      model = 'heuristic';
    }

    // 强制补全必要字段
    problem.year = problem.year || new Date().getFullYear();
    problem.proposer = problem.proposer || req.user?.username || '—';
    problem.difficulty = problem.difficulty || 3;
    problem.reward = problem.reward || 500;
    problem.status = problem.status || 'open';
    problem.videoUrl = problem.videoUrl || '';
    problem.videoTitle = problem.videoTitle || '';
    problem.videoChannel = problem.videoChannel || '';

    res.json({ problem, source, model });
  } catch (e) {
    res.status(500).json({ error: 'AI contribute failed: ' + e.message });
  }
});

export { router };
