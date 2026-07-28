// 问题管理
import { Router } from 'express';
import { PROBLEMS, CATEGORIES, getProblemById } from '../data/problems.js';
import { Solutions } from '../db.js';

const router = Router();

router.get('/categories', (req, res) => {
  res.json({ categories: CATEGORIES });
});

router.get('/', (req, res) => {
  const { category, search, status, limit = 100 } = req.query;
  let list = [...PROBLEMS];
  if (category && category !== 'all') list = list.filter(p => p.category === category);
  if (status) list = list.filter(p => p.status === status);
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.titleEn.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q) ||
      p.kid.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  const countMap = Solutions.countByProblem();

  res.json({
    total: list.length,
    problems: list.slice(0, Number(limit)).map(p => ({
      id: p.id,
      category: p.category,
      title: p.title,
      titleEn: p.titleEn,
      summary: p.summary,
      difficulty: p.difficulty,
      reward: p.reward,
      status: p.status,
      year: p.year,
      proposer: p.proposer,
      tags: p.tags,
      solutionCount: countMap[p.id]?.c || 0,
      netVotes: countMap[p.id]?.net || 0
    }))
  });
});

router.get('/:id', (req, res) => {
  const p = getProblemById(req.params.id);
  if (!p) return res.status(404).json({ error: 'not found' });
  res.json({ problem: p });
});

export { router };
