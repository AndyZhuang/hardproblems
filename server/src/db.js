// 极简 JSON 文件存储 + 显式查询函数
// 避开 SQL 解析的复杂度。所有查询都通过明确的函数实现。

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { config } from './config.js';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = config.dataDir;
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const TABLES = ['users', 'sessions', 'solutions', 'votes', 'transactions', 'blocks', 'chain_meta', 'discussions', 'roadmaps', 'teams', 'team_members', 'discussion_votes', 'roadmap_reactions'];
const stores = {};
for (const name of TABLES) {
  const path = join(DATA_DIR, `${name}.json`);
  if (!existsSync(path)) writeFileSync(path, '[]', 'utf-8');
  const rows = JSON.parse(readFileSync(path, 'utf-8'));
  logger.info(`loaded ${name}: ${rows.length} rows`);
  stores[name] = { path, rows };
}

const dirty = new Set();
let writing = false;
let flushTimer = null;

function markDirty(name) {
  dirty.add(name);
  if (flushTimer) return;
  flushTimer = setTimeout(flush, 50);
}

function flush() {
  flushTimer = null;
  if (writing) return;
  writing = true;
  try {
    for (const name of dirty) {
      writeFileSync(stores[name].path, JSON.stringify(stores[name].rows, null, 2), 'utf-8');
    }
    dirty.clear();
  } catch (e) {
    logger.error('flush error', { err: e.message });
  } finally {
    writing = false;
    if (dirty.size > 0) setTimeout(flush, 20);
  }
}

// 立即刷盘
export function flushSync() {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  for (const name of dirty) {
    writeFileSync(stores[name].path, JSON.stringify(stores[name].rows, null, 2), 'utf-8');
  }
  dirty.clear();
}

// =============== 通用工具 ===============
function all(name) { return stores[name].rows; }
function findBy(name, key, value) { return stores[name].rows.find(r => r[key] === value); }
function findAllBy(name, key, value) { return stores[name].rows.filter(r => r[key] === value); }
function insert(name, row) {
  stores[name].rows.push(row);
  markDirty(name);
}
function update(name, key, value, patch) {
  const r = findBy(name, key, value);
  if (r) Object.assign(r, patch);
  markDirty(name);
  return r;
}
function remove(name, key, value) {
  stores[name].rows = stores[name].rows.filter(r => r[key] !== value);
  markDirty(name);
}

// =============== Users ===============
export const Users = {
  all: () => all('users'),
  byId: (id) => findBy('users', 'id', id),
  byUsername: (u) => findBy('users', 'username', u),
  byWallet: (w) => findBy('users', 'wallet_address', w),
  create: (u) => { insert('users', u); return u; },
  update: (id, patch) => update('users', 'id', id, patch),
  incrementScore: (id, delta) => {
    const u = findBy('users', 'id', id);
    if (u) { u.total_score = (u.total_score || 0) + delta; markDirty('users'); }
  }
};

// =============== Sessions ===============
export const Sessions = {
  create: (s) => { insert('sessions', s); return s; },
  byToken: (t) => {
    const s = findBy('sessions', 'token', t);
    if (!s || s.expires_at <= Date.now()) return null;
    return s;
  },
  delete: (t) => remove('sessions', 'token', t)
};

// =============== Solutions ===============
export const Solutions = {
  all: () => all('solutions'),
  byId: (id) => findBy('solutions', 'id', id),
  byProblem: (pid) => findAllBy('solutions', 'problem_id', pid),
  byUser: (uid) => findAllBy('solutions', 'user_id', uid),
  create: (s) => { insert('solutions', s); return s; },
  update: (id, patch) => update('solutions', 'id', id, patch),
  countByProblem: () => {
    const map = {};
    for (const s of all('solutions')) {
      if (!map[s.problem_id]) map[s.problem_id] = { c: 0, net: 0 };
      map[s.problem_id].c++;
      map[s.problem_id].net += (s.votes_up - s.votes_down);
    }
    return map;
  },
  withUser: (rows) => rows.map(s => {
    const u = findBy('users', 'id', s.user_id) || {};
    return { ...s, username: u.username, wallet_address: u.wallet_address, avatar: u.avatar, bio: u.bio };
  })
};

// =============== Votes ===============
export const Votes = {
  bySolutionAndUser: (sid, uid) => findAllBy('votes', 'solution_id', sid).find(v => v.user_id === uid),
  create: (v) => { insert('votes', v); return v; },
  update: (id, patch) => update('votes', 'id', id, patch),
  remove: (id) => remove('votes', 'id', id)
};

// =============== Transactions ===============
export const Txs = {
  all: () => all('transactions'),
  byId: (id) => findBy('transactions', 'id', id),
  byBlock: (bid) => findAllBy('transactions', 'block_id', bid),
  byAddress: (addr) => all('transactions').filter(t => t.to_address === addr || t.from_address === addr),
  create: (t) => { insert('transactions', t); return t; },
  update: (id, patch) => update('transactions', 'id', id, patch)
};

// =============== Blocks ===============
export const Blocks = {
  all: () => all('blocks'),
  count: () => all('blocks').length,
  byId: (id) => findBy('blocks', 'id', id),
  byIndex: (i) => all('blocks').find(b => b.index_num === i),
  latest: () => {
    const rows = all('blocks');
    return rows.length ? rows.reduce((a, b) => a.index_num > b.index_num ? a : b) : null;
  },
  create: (b) => { insert('blocks', b); return b; }
};

// =============== ChainMeta ===============
export const ChainMeta = {
  get: (k) => {
    const r = findBy('chain_meta', 'key', k);
    return r ? r.value : null;
  },
  set: (k, v) => {
    const existing = findBy('chain_meta', 'key', k);
    if (existing) { existing.value = v; markDirty('chain_meta'); }
    else insert('chain_meta', { key: k, value: v });
  }
};

// =============== Discussions (问题讨论) ===============
// 每条讨论是顶层帖（parent_id=null）或回复（parent_id=某帖 id）
export const Discussions = {
  all: () => all('discussions'),
  byId: (id) => findBy('discussions', 'id', id),
  byProblem: (pid) => findAllBy('discussions', 'problem_id', pid)
    .sort((a, b) => a.created_at - b.created_at),
  topLevelByProblem: (pid) => findAllBy('discussions', 'problem_id', pid)
    .filter(d => !d.parent_id)
    .sort((a, b) => b.created_at - a.created_at),
  repliesOf: (parentId) => findAllBy('discussions', 'parent_id', parentId)
    .sort((a, b) => a.created_at - b.created_at),
  countByProblem: (pid) => findAllBy('discussions', 'problem_id', pid).length,
  create: (d) => { insert('discussions', d); return d; },
  update: (id, patch) => update('discussions', 'id', id, patch),
  remove: (id) => remove('discussions', 'id', id),
  withUser: (rows) => rows.map(d => {
    const u = findBy('users', 'id', d.user_id) || {};
    return {
      ...d,
      username: u.username,
      wallet_address: u.wallet_address,
      avatar: u.avatar
    };
  })
};

// =============== DiscussionVotes (讨论点赞) ===============
export const DiscussionVotes = {
  byDiscussion: (did) => findAllBy('discussion_votes', 'discussion_id', did),
  byDiscussionAndUser: (did, uid) => findAllBy('discussion_votes', 'discussion_id', did).find(v => v.user_id === uid),
  create: (v) => { insert('discussion_votes', v); return v; },
  update: (id, patch) => update('discussion_votes', 'id', id, patch),
  remove: (id) => remove('discussion_votes', 'id', id),
  countFor: (did) => {
    const all = findAllBy('discussion_votes', 'discussion_id', did);
    return { up: all.filter(v => v.value === 1).length, down: all.filter(v => v.value === -1).length };
  }
};

// =============== Roadmaps (路线图 / 进展条目) ===============
// 每个问题有一个时间线上的进展条目列表
export const Roadmaps = {
  all: () => all('roadmaps'),
  byId: (id) => findBy('roadmaps', 'id', id),
  byProblem: (pid) => findAllBy('roadmaps', 'problem_id', pid)
    .sort((a, b) => a.created_at - b.created_at),
  byStatus: (pid, status) => findAllBy('roadmaps', 'problem_id', pid)
    .filter(r => r.status === status)
    .sort((a, b) => a.created_at - b.created_at),
  countByProblem: (pid) => findAllBy('roadmaps', 'problem_id', pid).length,
  create: (r) => { insert('roadmaps', r); return r; },
  update: (id, patch) => update('roadmaps', 'id', id, patch),
  remove: (id) => remove('roadmaps', 'id', id),
  withUser: (rows) => rows.map(r => {
    const u = findBy('users', 'id', r.user_id) || {};
    return {
      ...r,
      username: u.username,
      wallet_address: u.wallet_address
    };
  })
};

// =============== RoadmapReactions (路线图条目反应) ===============
export const RoadmapReactions = {
  byRoadmap: (rid) => findAllBy('roadmap_reactions', 'roadmap_id', rid),
  byRoadmapAndUser: (rid, uid) => findAllBy('roadmap_reactions', 'roadmap_id', rid).find(r => r.user_id === uid),
  create: (r) => { insert('roadmap_reactions', r); return r; },
  update: (id, patch) => update('roadmap_reactions', 'id', id, patch),
  remove: (id) => remove('roadmap_reactions', 'id', id),
  countFor: (rid) => findAllBy('roadmap_reactions', 'roadmap_id', rid).length
};

// =============== Teams (协作团队) ===============
export const Teams = {
  all: () => all('teams'),
  byId: (id) => findBy('teams', 'id', id),
  byProblem: (pid) => findAllBy('teams', 'problem_id', pid)
    .sort((a, b) => b.created_at - a.created_at),
  byUser: (uid) => findAllBy('team_members', 'user_id', uid)
    .map(tm => findBy('teams', 'id', tm.team_id))
    .filter(Boolean),
  create: (t) => { insert('teams', t); return t; },
  update: (id, patch) => update('teams', 'id', id, patch),
  remove: (id) => remove('teams', 'id', id)
};

// =============== TeamMembers (团队成员) ===============
export const TeamMembers = {
  byTeam: (tid) => findAllBy('team_members', 'team_id', tid),
  byUser: (uid) => findAllBy('team_members', 'user_id', uid),
  byTeamAndUser: (tid, uid) => findAllBy('team_members', 'team_id', tid).find(tm => tm.user_id === uid),
  add: (tm) => { insert('team_members', tm); return tm; },
  update: (id, patch) => update('team_members', 'id', id, patch),
  remove: (tid, uid) => {
    stores['team_members'].rows = stores['team_members'].rows.filter(
      r => !(r.team_id === tid && r.user_id === uid)
    );
    markDirty('team_members');
  },
  countByTeam: (tid) => findAllBy('team_members', 'team_id', tid).length
};

logger.info(`ready at ${DATA_DIR}`);
