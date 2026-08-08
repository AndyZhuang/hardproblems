// 解答管理
import { Router } from 'express';
import { nanoid } from 'nanoid';
import { Solutions, Votes, Users } from '../db.js';
import { getProblemById } from '../data/problems.js';
import { createTransaction, submitTransaction, forceMakeBlock } from '../blockchain.js';
import { evaluateSolution } from '../ai/solver.js';
import { rewardOnChain } from '../hpw.js';
import { logger } from '../logger.js';
import { requireAuth } from './users.js';

const router = Router();

function shapeSolution(s, user) {
  return {
    id: s.id,
    problemId: s.problem_id,
    user: user ? { id: user.id, username: user.username, wallet: user.wallet_address, avatar: user.avatar } : null,
    title: s.title,
    content: s.content,
    aiAssisted: !!s.ai_assisted,
    aiModel: s.ai_model,
    aiQualityScore: s.ai_quality_score,
    votesUp: s.votes_up,
    votesDown: s.votes_down,
    scoreAwarded: s.score_awarded,
    blockId: s.block_id,
    txId: s.tx_id,
    createdAt: s.created_at
  };
}

router.get('/', (req, res) => {
  const { problem_id, user_id, sort = 'top', limit = 50, offset = 0 } = req.query;
  let rows = Solutions.all();
  if (problem_id) rows = rows.filter(s => s.problem_id === problem_id);
  if (user_id) rows = rows.filter(s => s.user_id === user_id);

  if (sort === 'top') rows.sort((a, b) => (b.votes_up - b.votes_down) - (a.votes_up - a.votes_down) || (b.created_at - a.created_at));
  else if (sort === 'new') rows.sort((a, b) => b.created_at - a.created_at);
  else if (sort === 'ai') rows.sort((a, b) => b.ai_quality_score - a.ai_quality_score);

  const start = Number(offset);
  const end = start + Number(limit);
  rows = rows.slice(start, end);

  res.json({
    solutions: rows.map(s => {
      const u = Users.byId(s.user_id);
      return shapeSolution(s, u);
    })
  });
});

router.get('/:id', (req, res) => {
  const s = Solutions.byId(req.params.id);
  if (!s) return res.status(404).json({ error: 'not found' });
  const u = Users.byId(s.user_id);
  res.json({ solution: shapeSolution(s, u) });
});

router.post('/', requireAuth, async (req, res) => {
  const { problem_id, title = '', content, ai_assisted = false, ai_model = '' } = req.body || {};
  if (!problem_id || !content) return res.status(400).json({ error: 'problem_id and content required' });
  if (content.length < 20) return res.status(400).json({ error: 'content too short (min 20 chars)' });
  const p = getProblemById(problem_id);
  if (!p) return res.status(404).json({ error: 'problem not found' });

  let evalResult;
  try {
    evalResult = await evaluateSolution({ problemId: problem_id, content });
  } catch (e) {
    console.error('[solutions] eval failed', e);
    evalResult = { score: 50, reasoning: 'auto-eval failed', strengths: [], weaknesses: [], model: 'none' };
  }

  const id = nanoid(16);
  const now = Date.now();
  const baseReward = 10;
  const bonusReward = evalResult.score >= 60 ? Math.floor((evalResult.score - 50) * (p.reward / 100)) : 0;
  const totalReward = baseReward + bonusReward;

  Solutions.create({
    id, problem_id, user_id: req.user.id, title, content,
    ai_assisted: ai_assisted ? 1 : 0,
    ai_model: ai_model || evalResult.model || '',
    ai_quality_score: evalResult.score,
    votes_up: 0, votes_down: 0,
    score_awarded: totalReward,
    block_id: null, tx_id: null, created_at: now
  });

  const tx = createTransaction({
    to_address: req.user.wallet_address, amount: totalReward, type: 'reward',
    ref_type: 'solution', ref_id: id,
    note: `Solution reward for "${p.title}" (AI score: ${evalResult.score})`
  });
  await submitTransaction(tx);

  // 更新 solution 的 tx_id（异步）
  Solutions.update(id, { tx_id: tx.id });

  setTimeout(() => forceMakeBlock().catch(() => {}), 100);

  // 🚀 链上 HPW 奖励：用户必须连过 MetaMask 才有 wallet_address
  let onchainReward = null;
  if (req.user.wallet_address && /^0x[0-9a-fA-F]{40}$/.test(req.user.wallet_address)) {
    try {
      onchainReward = await rewardOnChain(
        req.user.wallet_address,
        totalReward.toString(),
        `solution:${problem_id}:${id.slice(0, 8)}`
      );
    } catch (e) {
      logger.warn('[solutions] on-chain reward failed', { err: e.message, userId: req.user.id });
    }
  }

  res.json({
    solution: { id, problemId: problem_id, userId: req.user.id, title, content, aiAssisted: !!ai_assisted, aiModel: ai_model || evalResult.model, aiQualityScore: evalResult.score, scoreAwarded: totalReward, createdAt: now, txId: tx.id },
    evaluation: evalResult,
    reward: totalReward,
    onchainReward  // { success, txHash, source, error? }
  });
});

router.post('/:id/vote', requireAuth, async (req, res) => {
  const { value } = req.body || {};
  if (![1, -1, 0].includes(value)) return res.status(400).json({ error: 'value must be 1, -1, or 0' });
  const sol = Solutions.byId(req.params.id);
  if (!sol) return res.status(404).json({ error: 'solution not found' });
  if (sol.user_id === req.user.id) return res.status(400).json({ error: 'cannot vote on own solution' });

  const existing = Votes.bySolutionAndUser(sol.id, req.user.id);
  let upDelta = 0, downDelta = 0;
  if (existing) {
    if (existing.value === 1) upDelta--;
    if (existing.value === -1) downDelta--;
  }
  if (value === 1) upDelta++;
  if (value === -1) downDelta++;

  if (value === 0 && existing) {
    Votes.remove(existing.id);
  } else if (value !== 0) {
    if (existing) {
      Votes.update(existing.id, { value, created_at: Date.now() });
    } else {
      Votes.create({ id: nanoid(16), solution_id: sol.id, user_id: req.user.id, value, created_at: Date.now() });
    }
  }

  Solutions.update(sol.id, {
    votes_up: (sol.votes_up || 0) + upDelta,
    votes_down: (sol.votes_down || 0) + downDelta
  });

  if (upDelta > 0) {
    const reward = upDelta * 5;
    const author = Users.byId(sol.user_id);
    if (author) {
      const tx = createTransaction({
        to_address: author.wallet_address, amount: reward, type: 'reward',
        ref_type: 'vote', ref_id: sol.id,
        note: `Received ${upDelta} upvote(s) on solution`
      });
      await submitTransaction(tx);
      setTimeout(() => forceMakeBlock().catch(() => {}), 100);
    }
  }

  const updated = Solutions.byId(sol.id);
  res.json({ ok: true, votesUp: updated.votes_up, votesDown: updated.votes_down, rewardSent: upDelta > 0 ? upDelta * 5 : 0 });
});

router.get('/:id/my-vote', requireAuth, (req, res) => {
  const v = Votes.bySolutionAndUser(req.params.id, req.user.id);
  res.json({ value: v ? v.value : 0 });
});

export { router };
