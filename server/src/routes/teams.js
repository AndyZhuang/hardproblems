// 团队路由：每个问题可以组建协作团队，队员可以标记贡献
import { Router } from 'express';
import { nanoid } from 'nanoid';
import { Teams, TeamMembers, Solutions, Users } from '../db.js';
import { requireAuth, optionalAuth } from './users.js';
import { logger } from '../logger.js';

const router = Router();

const ROLES = ['leader', 'researcher', 'engineer', 'student', 'mentor', 'observer'];

function sanitize(s, max) {
  if (typeof s !== 'string') return null;
  const t = s.trim();
  if (t.length === 0) return null;
  if (t.length > max) return t.slice(0, max);
  return t;
}

function enrichTeam(team, viewerId) {
  const members = TeamMembers.byTeam(team.id).map(tm => {
    const u = Users.byId(tm.user_id) || {};
    return {
      userId: tm.user_id,
      username: u.username || 'unknown',
      avatar: u.avatar || '',
      walletAddress: u.wallet_address || '',
      role: tm.role,
      joinedAt: tm.joined_at
    };
  });
  // 按角色排序
  const roleOrder = { leader: 0, mentor: 1, researcher: 2, engineer: 3, student: 4, observer: 5 };
  members.sort((a, b) => (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9));
  const isMember = viewerId ? members.some(m => m.userId === viewerId) : false;
  const isLeader = viewerId === team.leader_id;
  return {
    id: team.id,
    problemId: team.problem_id,
    name: team.name,
    description: team.description,
    leaderId: team.leader_id,
    createdAt: team.created_at,
    memberCount: members.length,
    members,
    isMember,
    isLeader
  };
}

function contributionSummary(teamId) {
  const members = TeamMembers.byTeam(teamId);
  const out = [];
  for (const tm of members) {
    const sols = Solutions.byUser(tm.user_id).filter(s => s.team_id === teamId);
    let totalScore = 0;
    let votesUp = 0;
    let votesDown = 0;
    for (const s of sols) {
      totalScore += s.score || 0;
      votesUp += s.votes_up || 0;
      votesDown += s.votes_down || 0;
    }
    const u = Users.byId(tm.user_id) || {};
    out.push({
      userId: tm.user_id,
      username: u.username,
      role: tm.role,
      solutionsCount: sols.length,
      totalScore,
      votesUp,
      votesDown
    });
  }
  return out;
}

// GET /api/teams?problem=xxx
router.get('/', optionalAuth, (req, res) => {
  const problemId = String(req.query.problem || '').trim();
  if (!problemId) return res.status(400).json({ error: '缺少 problem 参数' });
  const list = Teams.byProblem(problemId);
  const viewerId = req.user?.id;
  const enriched = list.map(t => {
    const e = enrichTeam(t, viewerId);
    return { ...e, members: undefined }; // 列表里只给摘要
  });
  res.json({ teams: enriched, total: list.length });
});

// POST /api/teams  { problemId, name, description? }
router.post('/', requireAuth, (req, res) => {
  const { problemId, name, description } = req.body || {};
  if (!problemId) return res.status(400).json({ error: '缺少 problemId' });
  const n = sanitize(name, 60);
  if (!n) return res.status(400).json({ error: '团队名不能为空' });
  // 同一问题下同名人不能重名
  const exists = Teams.byProblem(problemId).find(t => t.name === n);
  if (exists) return res.status(409).json({ error: '该问题下已存在同名团队' });
  const desc = sanitize(description, 500) || '';
  const team = {
    id: nanoid(12),
    problem_id: String(problemId),
    name: n,
    description: desc,
    leader_id: req.user.id,
    created_at: Date.now()
  };
  Teams.create(team);
  // 队长自动加入
  TeamMembers.add({
    id: nanoid(10),
    team_id: team.id,
    user_id: req.user.id,
    role: 'leader',
    joined_at: Date.now()
  });
  logger.info(`team created: ${team.id} problem=${problemId} leader=${req.user.username}`);
  res.json({ ok: true, team: enrichTeam(team, req.user.id) });
});

// GET /api/teams/:id
router.get('/:id', optionalAuth, (req, res) => {
  const team = Teams.byId(req.params.id);
  if (!team) return res.status(404).json({ error: '团队不存在' });
  const viewerId = req.user?.id;
  const e = enrichTeam(team, viewerId);
  res.json({ team: e, contributions: contributionSummary(team.id) });
});

// POST /api/teams/:id/join  { role? }
router.post('/:id/join', requireAuth, (req, res) => {
  const team = Teams.byId(req.params.id);
  if (!team) return res.status(404).json({ error: '团队不存在' });
  if (TeamMembers.byTeamAndUser(team.id, req.user.id)) {
    return res.status(409).json({ error: '你已经在该团队中' });
  }
  let role = String(req.body?.role || 'researcher');
  if (!ROLES.includes(role)) role = 'researcher';
  TeamMembers.add({
    id: nanoid(10),
    team_id: team.id,
    user_id: req.user.id,
    role,
    joined_at: Date.now()
  });
  logger.info(`team join: ${team.id} user=${req.user.username} role=${role}`);
  res.json({ ok: true, team: enrichTeam(team, req.user.id) });
});

// POST /api/teams/:id/leave
router.post('/:id/leave', requireAuth, (req, res) => {
  const team = Teams.byId(req.params.id);
  if (!team) return res.status(404).json({ error: '团队不存在' });
  if (team.leader_id === req.user.id) {
    return res.status(400).json({ error: '队长不能直接退出，请先转让队长或解散团队' });
  }
  if (!TeamMembers.byTeamAndUser(team.id, req.user.id)) {
    return res.status(404).json({ error: '你不在该团队中' });
  }
  TeamMembers.remove(team.id, req.user.id);
  res.json({ ok: true });
});

// PATCH /api/teams/:id  (队长可改名、改描述)
router.patch('/:id', requireAuth, (req, res) => {
  const team = Teams.byId(req.params.id);
  if (!team) return res.status(404).json({ error: '团队不存在' });
  if (team.leader_id !== req.user.id) return res.status(403).json({ error: '只有队长可以编辑团队信息' });
  const patch = {};
  if (req.body?.name !== undefined) {
    const n = sanitize(req.body.name, 60);
    if (!n) return res.status(400).json({ error: '团队名不能为空' });
    patch.name = n;
  }
  if (req.body?.description !== undefined) {
    patch.description = sanitize(req.body.description, 500) || '';
  }
  Teams.update(req.params.id, patch);
  res.json({ ok: true, team: enrichTeam({ ...team, ...patch }, req.user.id) });
});

// DELETE /api/teams/:id  (队长解散)
router.delete('/:id', requireAuth, (req, res) => {
  const team = Teams.byId(req.params.id);
  if (!team) return res.status(404).json({ error: '团队不存在' });
  if (team.leader_id !== req.user.id) return res.status(403).json({ error: '只有队长可以解散团队' });
  for (const m of TeamMembers.byTeam(team.id)) {
    TeamMembers.remove(team.id, m.user_id);
  }
  Teams.remove(req.params.id);
  res.json({ ok: true });
});

// PATCH /api/teams/:id/members/:userId  (队长改某人角色)
router.patch('/:id/members/:userId', requireAuth, (req, res) => {
  const team = Teams.byId(req.params.id);
  if (!team) return res.status(404).json({ error: '团队不存在' });
  if (team.leader_id !== req.user.id) return res.status(403).json({ error: '只有队长可以调整成员角色' });
  const tm = TeamMembers.byTeamAndUser(team.id, req.params.userId);
  if (!tm) return res.status(404).json({ error: '该用户不在团队中' });
  const role = String(req.body?.role || '');
  if (!ROLES.includes(role)) return res.status(400).json({ error: 'role 无效' });
  TeamMembers.update(tm.id, { role, updated_at: Date.now() });
  res.json({ ok: true });
});

export { router, ROLES };
