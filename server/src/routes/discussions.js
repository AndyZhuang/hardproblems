// 讨论路由：问题讨论、回复、点赞
import { Router } from 'express';
import { nanoid } from 'nanoid';
import { Discussions, DiscussionVotes, Users } from '../db.js';
import { requireAuth, optionalAuth } from './users.js';
import { logger } from '../logger.js';

const router = Router();

function sanitizeContent(s) {
  if (typeof s !== 'string') return null;
  const t = s.trim();
  if (t.length === 0) return null;
  if (t.length > 4000) return t.slice(0, 4000);
  return t;
}

function withMeta(rows, viewerId) {
  return Discussions.withUser(rows).map(d => {
    const votes = DiscussionVotes.countFor(d.id);
    let myVote = 0;
    if (viewerId) {
      const v = DiscussionVotes.byDiscussionAndUser(d.id, viewerId);
      if (v) myVote = v.value;
    }
    return {
      id: d.id,
      problemId: d.problem_id,
      parentId: d.parent_id,
      userId: d.user_id,
      content: d.content,
      createdAt: d.created_at,
      edited: !!d.edited_at,
      username: d.username,
      walletAddress: d.wallet_address,
      avatar: d.avatar,
      votesUp: votes.up,
      votesDown: votes.down,
      myVote
    };
  });
}

// GET /api/discussions?problem=xxx
router.get('/', optionalAuth, (req, res) => {
  const problemId = String(req.query.problem || '').trim();
  if (!problemId) return res.status(400).json({ error: '缺少 problem 参数' });

  const top = Discussions.topLevelByProblem(problemId);
  const viewerId = req.user?.id;
  const enriched = withMeta(top, viewerId);
  // 附带回复
  const withReplies = enriched.map(t => {
    const replies = withMeta(Discussions.repliesOf(t.id), viewerId);
    return { ...t, replyCount: replies.length, replies };
  });
  res.json({ discussions: withReplies, total: Discussions.countByProblem(problemId) });
});

// POST /api/discussions { problemId, content, parentId? }
router.post('/', requireAuth, (req, res) => {
  const { problemId, parentId, content } = req.body || {};
  if (!problemId) return res.status(400).json({ error: '缺少 problemId' });
  const c = sanitizeContent(content);
  if (!c) return res.status(400).json({ error: '内容不能为空' });

  if (parentId) {
    const parent = Discussions.byId(parentId);
    if (!parent) return res.status(404).json({ error: '父帖不存在' });
    if (parent.problem_id !== problemId) return res.status(400).json({ error: '父帖不属于此问题' });
    if (parent.parent_id) return res.status(400).json({ error: '不支持多层嵌套' });
  }

  const row = {
    id: nanoid(12),
    problem_id: String(problemId),
    user_id: req.user.id,
    parent_id: parentId || null,
    content: c,
    created_at: Date.now()
  };
  Discussions.create(row);
  logger.info(`discussion created: ${row.id} problem=${problemId} user=${req.user.username}`);
  res.json({ ok: true, discussion: withMeta([row], req.user.id)[0] });
});

// PATCH /api/discussions/:id { content }
router.patch('/:id', requireAuth, (req, res) => {
  const d = Discussions.byId(req.params.id);
  if (!d) return res.status(404).json({ error: '讨论不存在' });
  if (d.user_id !== req.user.id) return res.status(403).json({ error: '只能编辑自己的讨论' });
  const c = sanitizeContent(req.body?.content);
  if (!c) return res.status(400).json({ error: '内容不能为空' });
  Discussions.update(req.params.id, { content: c, edited_at: Date.now() });
  res.json({ ok: true });
});

// DELETE /api/discussions/:id
router.delete('/:id', requireAuth, (req, res) => {
  const d = Discussions.byId(req.params.id);
  if (!d) return res.status(404).json({ error: '讨论不存在' });
  if (d.user_id !== req.user.id) return res.status(403).json({ error: '只能删除自己的讨论' });
  // 顶层帖删除会同时删除回复
  if (!d.parent_id) {
    for (const r of Discussions.repliesOf(d.id)) {
      Discussions.remove(r.id);
    }
  }
  Discussions.remove(req.params.id);
  res.json({ ok: true });
});

// POST /api/discussions/:id/vote { value: 1 | -1 | 0 }
router.post('/:id/vote', requireAuth, (req, res) => {
  const d = Discussions.byId(req.params.id);
  if (!d) return res.status(404).json({ error: '讨论不存在' });
  if (d.user_id === req.user.id) return res.status(400).json({ error: '不能给自己的讨论投票' });
  const raw = req.body?.value;
  let value;
  if (raw === 1 || raw === '1' || raw === 'up') value = 1;
  else if (raw === -1 || raw === '-1' || raw === 'down') value = -1;
  else if (raw === 0 || raw === '0' || raw === null || raw === undefined || raw === '') value = 0;
  else return res.status(400).json({ error: 'value 必须是 1 / -1 / 0' });

  const existing = DiscussionVotes.byDiscussionAndUser(d.id, req.user.id);
  if (value === 0) {
    if (existing) DiscussionVotes.remove(existing.id);
  } else {
    if (existing) DiscussionVotes.update(existing.id, { value, updated_at: Date.now() });
    else DiscussionVotes.create({
      id: nanoid(10),
      discussion_id: d.id,
      user_id: req.user.id,
      value,
      created_at: Date.now()
    });
  }
  const c = DiscussionVotes.countFor(d.id);
  res.json({ ok: true, votesUp: c.up, votesDown: c.down, myVote: value });
});

export { router };
