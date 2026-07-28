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

const TABLES = ['users', 'sessions', 'solutions', 'votes', 'transactions', 'blocks', 'chain_meta'];
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

logger.info(`ready at ${DATA_DIR}`);
