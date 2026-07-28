// AI 路由：求解 + 评估
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

export { router };
