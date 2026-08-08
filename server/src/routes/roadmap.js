// 路线图路由：每个问题的时间线条目 + emoji 反应
import { Router } from 'express';
import { nanoid } from 'nanoid';
import { Roadmaps, RoadmapReactions } from '../db.js';
import { requireAuth, optionalAuth } from './users.js';
import { logger } from '../logger.js';

const router = Router();

const STATUSES = ['proposed', 'exploring', 'in_progress', 'breakthrough', 'blocked', 'done'];
const REACTIONS = ['like', 'fire', 'bulb', 'rocket', 'eyes'];

function sanitize(s, max) {
  if (typeof s !== 'string') return null;
  const t = s.trim();
  if (t.length === 0) return null;
  if (t.length > max) return t.slice(0, max);
  return t;
}

function withReactions(rows, viewerId) {
  return Roadmaps.withUser(rows).map(r => {
    const all = RoadmapReactions.byRoadmap(r.id);
    const counts = { like: 0, fire: 0, bulb: 0, rocket: 0, eyes: 0 };
    const mySet = new Set();
    for (const re of all) {
      if (counts[re.value] !== undefined) counts[re.value]++;
      if (viewerId && re.user_id === viewerId) mySet.add(re.value);
    }
    return {
      id: r.id,
      problemId: r.problem_id,
      userId: r.user_id,
      title: r.title,
      description: r.description,
      status: r.status,
      createdAt: r.created_at,
      statusChangedAt: r.status_changed_at,
      username: r.username,
      walletAddress: r.wallet_address,
      reactions: counts,
      myReactions: [...mySet]
    };
  });
}

// GET /api/roadmap?problem=xxx  (匿名可读)
router.get('/', optionalAuth, (req, res) => {
  const problemId = String(req.query.problem || '').trim();
  if (!problemId) return res.status(400).json({ error: '缺少 problem 参数' });
  const list = Roadmaps.byProblem(problemId);
  const viewerId = req.user?.id;
  res.json({
    entries: withReactions(list, viewerId),
    total: Roadmaps.countByProblem(problemId)
  });
});

// POST /api/roadmap  { problemId, title, description?, status? }
router.post('/', requireAuth, (req, res) => {
  const { problemId, title, description, status } = req.body || {};
  if (!problemId) return res.status(400).json({ error: '缺少 problemId' });
  const t = sanitize(title, 120);
  if (!t) return res.status(400).json({ error: '标题不能为空' });
  const d = sanitize(description, 1000) || '';
  let st = String(status || 'proposed');
  if (!STATUSES.includes(st)) st = 'proposed';
  const row = {
    id: nanoid(12),
    problem_id: String(problemId),
    user_id: req.user.id,
    title: t,
    description: d,
    status: st,
    created_at: Date.now()
  };
  Roadmaps.create(row);
  logger.info(`roadmap entry created: ${row.id} problem=${problemId} user=${req.user.username}`);
  res.json({ ok: true, entry: withReactions([row], req.user.id)[0] });
});

// PATCH /api/roadmap/:id  { title?, description?, status? }
router.patch('/:id', requireAuth, (req, res) => {
  const r = Roadmaps.byId(req.params.id);
  if (!r) return res.status(404).json({ error: '条目不存在' });
  if (r.user_id !== req.user.id) return res.status(403).json({ error: '只能编辑自己的条目' });
  const patch = {};
  if (req.body?.title !== undefined) {
    const t = sanitize(req.body.title, 120);
    if (!t) return res.status(400).json({ error: '标题不能为空' });
    patch.title = t;
  }
  if (req.body?.description !== undefined) {
    patch.description = sanitize(req.body.description, 1000) || '';
  }
  if (req.body?.status !== undefined) {
    const st = String(req.body.status);
    if (!STATUSES.includes(st)) return res.status(400).json({ error: 'status 无效' });
    patch.status = st;
    patch.status_changed_at = Date.now();
  }
  Roadmaps.update(req.params.id, patch);
  res.json({ ok: true });
});

// DELETE /api/roadmap/:id
router.delete('/:id', requireAuth, (req, res) => {
  const r = Roadmaps.byId(req.params.id);
  if (!r) return res.status(404).json({ error: '条目不存在' });
  if (r.user_id !== req.user.id) return res.status(403).json({ error: '只能删除自己的条目' });
  Roadmaps.remove(req.params.id);
  res.json({ ok: true });
});

// POST /api/roadmap/:id/react  { value: 'like' | null }
router.post('/:id/react', requireAuth, (req, res) => {
  const r = Roadmaps.byId(req.params.id);
  if (!r) return res.status(404).json({ error: '条目不存在' });
  const raw = req.body?.value;
  if (raw === null || raw === '' || raw === undefined) {
    const existing = RoadmapReactions.byRoadmapAndUser(r.id, req.user.id);
    if (existing) RoadmapReactions.remove(existing.id);
    return res.json({ ok: true, removed: true });
  }
  const value = String(raw);
  if (!REACTIONS.includes(value)) return res.status(400).json({ error: 'reaction 无效' });
  const existing = RoadmapReactions.byRoadmapAndUser(r.id, req.user.id);
  if (existing && existing.value === value) {
    // 再次点同一表情 → 取消
    RoadmapReactions.remove(existing.id);
    return res.json({ ok: true, removed: true });
  }
  if (existing) {
    RoadmapReactions.update(existing.id, { value, updated_at: Date.now() });
  } else {
    RoadmapReactions.create({
      id: nanoid(10),
      roadmap_id: r.id,
      user_id: req.user.id,
      value,
      created_at: Date.now()
    });
  }
  res.json({ ok: true });
});

export { router, STATUSES, REACTIONS };
