// 排行榜
import { Router } from 'express';
import { Users, Solutions, Txs, Blocks } from '../db.js';
import { PROBLEMS, CATEGORIES, BADGES, getBadgesForUser } from '../data/problems.js';

const router = Router();

router.get('/', (req, res) => {
  const { limit = 100, category } = req.query;
  let userIds = null;
  if (category && category !== 'all') {
    const ids = new Set(PROBLEMS.filter(p => p.category === category).map(p => p.id));
    userIds = new Set(Solutions.all().filter(s => ids.has(s.problem_id)).map(s => s.user_id));
  }

  let rows = Users.all();
  if (userIds) rows = rows.filter(u => userIds.has(u.id));

  const enriched = rows.map(u => {
    const sols = Solutions.byUser(u.id);
    const solCount = sols.length;
    const netVotes = sols.reduce((s, x) => s + (x.votes_up - x.votes_down), 0);
    return { ...u, solutionCount: solCount, netVotes };
  });
  enriched.sort((a, b) => (b.total_score || 0) - (a.total_score || 0) || a.created_at - b.created_at);

  res.json({
    leaderboard: enriched.slice(0, Number(limit)).map((r, i) => ({
      rank: i + 1,
      id: r.id, username: r.username, wallet: r.wallet_address,
      avatar: r.avatar, bio: r.bio,
      totalScore: r.total_score || 0,
      solutionCount: r.solutionCount,
      netVotes: r.netVotes,
      badges: getBadgesForUser({ totalScore: r.total_score || 0, solutionCount: r.solutionCount }),
      createdAt: r.created_at
    }))
  });
});

router.get('/stats', (req, res) => {
  const userCount = Users.all().length;
  const solCount = Solutions.all().length;
  const txCount = Txs.all().length;
  const blockCount = Blocks.count();
  const problemCount = PROBLEMS.length;
  const totalReward = Txs.all().filter(t => t.type === 'reward').reduce((s, t) => s + t.amount, 0);

  const catDist = CATEGORIES.map(c => {
    const ps = PROBLEMS.filter(p => p.category === c.id);
    const solvedCount = new Set(Solutions.all().filter(s => ps.some(p => p.id === s.problem_id)).map(s => s.problem_id)).size;
    return { id: c.id, name: c.name, count: ps.length, solved: solvedCount };
  });

  res.json({
    users: userCount, problems: problemCount, solutions: solCount, transactions: txCount,
    blocks: blockCount, totalReward, categories: catDist, badges: BADGES
  });
});

export { router };
