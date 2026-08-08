// AI 路由：多轮对话 + 严格 rubric 评估
import { Router } from 'express';
import { chatProblem, evaluateSolution, solveProblem, buildRAGContext } from '../ai/solver.js';
import { getProblemById } from '../data/problems.js';
import { requireAuth } from './users.js';

const router = Router();

// 多轮对话（推荐）
router.post('/chat', requireAuth, async (req, res) => {
  const { problem_id, messages = [], model, lang } = req.body || {};
  if (!problem_id) return res.status(400).json({ error: 'problem_id required' });
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }
  if (messages.length > 50) return res.status(400).json({ error: 'too many messages (max 50)' });

  const p = getProblemById(problem_id);
  if (!p) return res.status(404).json({ error: 'problem not found' });

  try {
    const result = await chatProblem({ problemId: problem_id, messages, model, lang });
    res.json({
      problemId: problem_id,
      problemTitle: p.title,
      problemCategory: p.category,
      reply: result.reply,
      model: result.model,
      source: result.source,
      note: result.note,
      context: result.context,
      lang: result.context?.lang || lang || 'zh-CN',
      turn: messages.filter(m => m.role === 'user').length
    });
  } catch (e) {
    res.status(500).json({ error: 'AI chat failed: ' + e.message });
  }
});

// 单轮求解（向后兼容，已弃用但保留）
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

// 严格 Rubric 评估（多维度）
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

// RAG 上下文（前端可用来显示 "相关问题"）
router.get('/context/:problem_id', (req, res) => {
  const ctx = buildRAGContext(req.params.problem_id);
  if (!ctx) return res.status(404).json({ error: 'problem not found' });
  res.json(ctx);
});

export { router };
