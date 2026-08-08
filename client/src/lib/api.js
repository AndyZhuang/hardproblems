// 纯前端版 API：所有数据存在 IndexedDB
// 后端 API 不可用时（如静态部署），使用此实现
// 后端 API 可用时，会自动切换到真实后端

import { PROBLEMS, CATEGORIES, getProblemById, BADGES, getBadgesForUser } from './problems.js';
import { clientChain } from './chain.js';

// 检测后端是否可用
let backendAvailable = null;
async function checkBackend() {
  if (backendAvailable !== null) return backendAvailable;
  try {
    const r = await fetch('/api/health', { method: 'GET' });
    if (!r.ok) { backendAvailable = false; return false; }
    // 检查返回的是 JSON
    const ct = r.headers.get('content-type') || '';
    if (!ct.includes('json')) { backendAvailable = false; return false; }
    const j = await r.json();
    backendAvailable = !!(j && j.ok);
  } catch {
    backendAvailable = false;
  }
  return backendAvailable;
}

// =============== IndexedDB 封装 ===============
const DB_NAME = 'hpw_frontend';
const DB_VERSION = 2;
let dbInstance = null;

function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('users')) {
        const s = db.createObjectStore('users', { keyPath: 'id' });
        s.createIndex('username', 'username', { unique: true });
      }
      if (!db.objectStoreNames.contains('sessions')) db.createObjectStore('sessions', { keyPath: 'token' });
      if (!db.objectStoreNames.contains('solutions')) {
        const s = db.createObjectStore('solutions', { keyPath: 'id' });
        s.createIndex('problem_id', 'problem_id', { unique: false });
        s.createIndex('user_id', 'user_id', { unique: false });
      }
      if (!db.objectStoreNames.contains('votes')) {
        const s = db.createObjectStore('votes', { keyPath: 'id' });
        s.createIndex('solution_user', ['solution_id', 'user_id'], { unique: true });
      }
      // v1.4.0 协作
      if (!db.objectStoreNames.contains('discussions')) {
        const s = db.createObjectStore('discussions', { keyPath: 'id' });
        s.createIndex('problem_id', 'problem_id', { unique: false });
        s.createIndex('parent_id', 'parent_id', { unique: false });
      }
      if (!db.objectStoreNames.contains('discussion_votes')) {
        const s = db.createObjectStore('discussion_votes', { keyPath: 'id' });
        s.createIndex('discussion_user', ['discussion_id', 'user_id'], { unique: true });
      }
      if (!db.objectStoreNames.contains('roadmaps')) {
        const s = db.createObjectStore('roadmaps', { keyPath: 'id' });
        s.createIndex('problem_id', 'problem_id', { unique: false });
      }
      if (!db.objectStoreNames.contains('roadmap_reactions')) {
        const s = db.createObjectStore('roadmap_reactions', { keyPath: 'id' });
        s.createIndex('roadmap_user', ['roadmap_id', 'user_id'], { unique: true });
      }
      if (!db.objectStoreNames.contains('teams')) {
        const s = db.createObjectStore('teams', { keyPath: 'id' });
        s.createIndex('problem_id', 'problem_id', { unique: false });
        s.createIndex('name_problem', ['name', 'problem_id'], { unique: true });
      }
      if (!db.objectStoreNames.contains('team_members')) {
        const s = db.createObjectStore('team_members', { keyPath: 'id' });
        s.createIndex('team_user', ['team_id', 'user_id'], { unique: true });
        s.createIndex('team_id', 'team_id', { unique: false });
        s.createIndex('user_id', 'user_id', { unique: false });
      }
    };
    req.onsuccess = () => { dbInstance = req.result; resolve(req.result); };
    req.onerror = () => reject(req.error);
  });
}

async function txStore(name, mode = 'readonly') {
  const db = await openDB();
  return db.transaction(name, mode).objectStore(name);
}

function promisify(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbAll(name) {
  return promisify((await txStore(name)).getAll());
}
async function dbGet(name, key) {
  return promisify((await txStore(name)).get(key));
}
async function dbPut(name, value) {
  return promisify((await txStore(name, 'readwrite')).put(value));
}
async function dbDelete(name, key) {
  return promisify((await txStore(name, 'readwrite')).delete(key));
}
async function dbGetByIndex(name, index, value) {
  return promisify((await txStore(name)).index(index).get(value));
}
async function dbAllByIndex(name, index, value) {
  return promisify((await txStore(name)).index(index).getAll(value));
}

function genId(len = 16) {
  return Array.from(crypto.getRandomValues(new Uint8Array(len))).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, len);
}

// 简单密码哈希（PBKDF2 替代 bcrypt）
async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// =============== 前端本地实现 ===============
const localImpl = {
  // 用户
  async register({ username, password, bio = '' }) {
    if (!username || !password) throw new Error('用户名和密码必填');
    if (username.length < 2 || username.length > 30) throw new Error('用户名 2-30 字符');
    if (password.length < 6) throw new Error('密码至少 6 位');
    const existing = await dbGetByIndex('users', 'username', username);
    if (existing) throw new Error('用户名已被占用');

    const wallet = await clientChain.generateWallet();
    const id = genId(16);
    const salt = genId(8);
    const hash = await hashPassword(password, salt);
    const now = Date.now();

    const user = {
      id, username,
      password_hash: salt + ':' + hash,
      wallet_address: wallet.address,
      public_key: wallet.publicKey,
      private_key: wallet.privateKey,
      bio, avatar: '', total_score: 0, created_at: now
    };
    await dbPut('users', user);

    // 注册奖励 - 通过 clientChain 上链
    const sys = await clientChain.getSystemWallet();
    const tx = await clientChain.createTx({
      to_address: wallet.address, amount: 100, type: 'reward',
      ref_type: 'registration', ref_id: id, note: 'Welcome bonus: 100 HPW',
      signerKeys: sys.cryptoKeys
    });
    await clientChain.submitTransaction(tx);

    // session
    const token = genId(32);
    await dbPut('sessions', { token, user_id: id, expires_at: now + 30 * 24 * 3600 * 1000, created_at: now });
    return { token, user: shapeUser(user) };
  },

  async login({ username, password }) {
    const u = await dbGetByIndex('users', 'username', username);
    if (!u) throw new Error('用户名或密码错误');
    const [salt, hash] = u.password_hash.split(':');
    const test = await hashPassword(password, salt);
    if (test !== hash) throw new Error('用户名或密码错误');
    const token = genId(32);
    const now = Date.now();
    await dbPut('sessions', { token, user_id: u.id, expires_at: now + 30 * 24 * 3600 * 1000, created_at: now });
    return { token, user: shapeUser(u) };
  },

  async logout() {
    const token = localStorage.getItem('hpw_token');
    if (token) await dbDelete('sessions', token);
    return { ok: true };
  },

  async me() {
    const token = localStorage.getItem('hpw_token');
    if (!token) throw new Error('未登录');
    const s = await dbGet('sessions', token);
    if (!s || s.expires_at <= Date.now()) throw new Error('会话过期');
    const u = await dbGet('users', s.user_id);
    if (!u) throw new Error('用户不存在');
    return { user: await shapeUserAsync(u) };
  },

  async getUser(username) {
    const u = await dbGetByIndex('users', 'username', username);
    if (!u) throw new Error('用户不存在');
    return { user: await shapeUserAsync(u) };
  },

  // 问题
  categories() { return { categories: CATEGORIES }; },
  problems({ category, search, status } = {}) {
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
    return Promise.all(list.map(async p => {
      const sols = await dbAllByIndex('solutions', 'problem_id', p.id);
      return {
        id: p.id, category: p.category, title: p.title, titleEn: p.titleEn,
        summary: p.summary, difficulty: p.difficulty, reward: p.reward,
        status: p.status, year: p.year, proposer: p.proposer, tags: p.tags,
        solutionCount: sols.length,
        netVotes: sols.reduce((s, x) => s + (x.votes_up - x.votes_down), 0)
      };
    })).then(problems => ({ total: problems.length, problems }));
  },
  async problem(id) {
    const p = getProblemById(id);
    if (!p) throw new Error('问题不存在: ' + id);
    return { problem: p };
  },

  // 解答
  async solutions({ problem_id, user_id, sort = 'top', limit = 50, offset = 0 } = {}) {
    let list = await dbAll('solutions');
    if (problem_id) list = list.filter(s => s.problem_id === problem_id);
    if (user_id) list = list.filter(s => s.user_id === user_id);
    if (sort === 'top') list.sort((a, b) => (b.votes_up - b.votes_down) - (a.votes_up - a.votes_down) || (b.created_at - a.created_at));
    else if (sort === 'new') list.sort((a, b) => b.created_at - a.created_at);
    else if (sort === 'ai') list.sort((a, b) => b.ai_quality_score - a.ai_quality_score);
    const out = list.slice(offset, offset + limit);
    const users = await dbAll('users');
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    return {
      solutions: out.map(s => {
        const u = userMap[s.user_id] || {};
        return {
          id: s.id, problemId: s.problem_id,
          user: { id: s.user_id, username: u.username, wallet: u.wallet_address, avatar: u.avatar },
          title: s.title, content: s.content,
          aiAssisted: !!s.ai_assisted, aiModel: s.ai_model,
          aiQualityScore: s.ai_quality_score,
          votesUp: s.votes_up, votesDown: s.votes_down,
          scoreAwarded: s.score_awarded,
          blockId: s.block_id, txId: s.tx_id, createdAt: s.created_at
        };
      })
    };
  },

  async submitSolution({ problem_id, title = '', content, ai_assisted = false, ai_model = '' }) {
    if (!problem_id || !content) throw new Error('problem_id 和 content 必填');
    if (content.length < 20) throw new Error('解答太短（至少 20 字）');
    const p = getProblemById(problem_id);
    if (!p) throw new Error('问题不存在');

    const token = localStorage.getItem('hpw_token');
    const sess = await dbGet('sessions', token);
    const user = await dbGet('users', sess.user_id);

    // 评估
    const evalResult = this.evaluate({ problem_id, content });
    const id = genId(16);
    const now = Date.now();
    const baseReward = 10;
    const bonus = evalResult.score >= 60 ? Math.floor((evalResult.score - 50) * (p.reward / 100)) : 0;
    const totalReward = baseReward + bonus;

    // 提交解答
    const sol = {
      id, problem_id, user_id: user.id, title, content,
      ai_assisted: ai_assisted ? 1 : 0, ai_model: ai_model || evalResult.model,
      ai_quality_score: evalResult.score,
      votes_up: 0, votes_down: 0, score_awarded: totalReward,
      block_id: null, tx_id: null, created_at: now
    };
    await dbPut('solutions', sol);

    // 上链奖励
    const sys = await clientChain.getSystemWallet();
    const tx = await clientChain.createTx({
      to_address: user.wallet_address, amount: totalReward, type: 'reward',
      ref_type: 'solution', ref_id: id,
      note: `Solution reward for "${p.title}" (AI score: ${evalResult.score})`,
      signerKeys: sys.cryptoKeys
    });
    await clientChain.submitTransaction(tx);
    sol.tx_id = tx.id;
    await dbPut('solutions', sol);
    return {
      solution: {
        id, problemId: problem_id, userId: user.id, title, content,
        aiAssisted: !!ai_assisted, aiModel: ai_model || evalResult.model,
        aiQualityScore: evalResult.score, scoreAwarded: totalReward, createdAt: now, txId: tx.id
      },
      evaluation: evalResult, reward: totalReward
    };
  },

  async vote(solutionId, value) {
    if (![1, -1, 0].includes(value)) throw new Error('value must be 1, -1, 0');
    const sol = await dbGet('solutions', solutionId);
    if (!sol) throw new Error('解答不存在');
    const token = localStorage.getItem('hpw_token');
    const sess = await dbGet('sessions', token);
    const user = await dbGet('users', sess.user_id);
    if (sol.user_id === user.id) throw new Error('不能给自己的解答投票');

    const existing = (await dbAllByIndex('votes', 'solution_user', IDBKeyRange.only([sol.id, user.id])))[0];
    let upDelta = 0, downDelta = 0;
    if (existing) {
      if (existing.value === 1) upDelta--;
      if (existing.value === -1) downDelta--;
    }
    if (value === 1) upDelta++;
    if (value === -1) downDelta++;

    if (value === 0 && existing) {
      await dbDelete('votes', existing.id);
    } else if (value !== 0) {
      if (existing) {
        existing.value = value;
        existing.created_at = Date.now();
        await dbPut('votes', existing);
      } else {
        await dbPut('votes', { id: genId(16), solution_id: sol.id, user_id: user.id, value, created_at: Date.now() });
      }
    }
    sol.votes_up = (sol.votes_up || 0) + upDelta;
    sol.votes_down = (sol.votes_down || 0) + downDelta;
    await dbPut('solutions', sol);

    if (upDelta > 0) {
      const reward = upDelta * 5;
      const author = await dbGet('users', sol.user_id);
      if (author) {
        const sys = await clientChain.getSystemWallet();
        const tx = await clientChain.createTx({
          to_address: author.wallet_address, amount: reward, type: 'reward',
          ref_type: 'vote', ref_id: sol.id,
          note: `Received ${upDelta} upvote(s) on solution`,
          signerKeys: sys.cryptoKeys
        });
        await clientChain.submitTransaction(tx);
      }
    }
    return { ok: true, votesUp: sol.votes_up, votesDown: sol.votes_down, rewardSent: upDelta > 0 ? upDelta * 5 : 0 };
  },

  async myVote(solutionId) {
    const token = localStorage.getItem('hpw_token');
    if (!token) return { value: 0 };
    const sess = await dbGet('sessions', token);
    if (!sess) return { value: 0 };
    const v = (await dbAllByIndex('votes', 'solution_user', IDBKeyRange.only([solutionId, sess.user_id])))[0];
    return { value: v ? v.value : 0 };
  },

  // 排行榜
  async leaderboard({ category, limit = 100 } = {}) {
    let userIds = null;
    if (category && category !== 'all') {
      const ids = new Set(PROBLEMS.filter(p => p.category === category).map(p => p.id));
      const sols = await dbAll('solutions');
      userIds = new Set(sols.filter(s => ids.has(s.problem_id)).map(s => s.user_id));
    }
    let users = await dbAll('users');
    if (userIds) users = users.filter(u => userIds.has(u.id));
    const sols = await dbAll('solutions');
    const enriched = users.map(u => {
      const us = sols.filter(s => s.user_id === u.id);
      return { ...u, solutionCount: us.length, netVotes: us.reduce((s, x) => s + (x.votes_up - x.votes_down), 0) };
    });
    enriched.sort((a, b) => (b.total_score || 0) - (a.total_score || 0) || a.created_at - b.created_at);
    return {
      leaderboard: enriched.slice(0, limit).map((r, i) => ({
        rank: i + 1, id: r.id, username: r.username, wallet: r.wallet_address,
        avatar: r.avatar, bio: r.bio, totalScore: r.total_score || 0,
        solutionCount: r.solutionCount, netVotes: r.netVotes,
        badges: getBadgesForUser({ totalScore: r.total_score || 0, solutionCount: r.solutionCount }),
        createdAt: r.created_at
      }))
    };
  },

  async stats() {
    try {
      const users = await dbAll('users');
      const sols = await dbAll('solutions');
      const sys = await clientChain.getSystemAddress();
      const blocks = await clientChain.getBlocks(1000);
      const allTxs = [];
      for (const b of blocks) {
        try {
          const txs = await clientChain.getBlockTransactions(b.id);
          allTxs.push(...txs);
        } catch {}
      }
      const totalReward = allTxs.filter(t => t.type === 'reward').reduce((s, t) => s + t.amount, 0);
      const catDist = CATEGORIES.map(c => {
        const ps = PROBLEMS.filter(p => p.category === c.id);
        const solvedCount = new Set(sols.filter(s => ps.some(p => p.id === s.problem_id)).map(s => s.problem_id)).size;
        return { id: c.id, name: c.name, count: ps.length, solved: solvedCount };
      });
      return {
        users: users.length, problems: PROBLEMS.length, solutions: sols.length,
        transactions: allTxs.length, blocks: blocks.length, totalReward, categories: catDist, badges: BADGES
      };
    } catch (e) {
      console.warn('[stats]', e.message);
      // 返回基本统计（没有链数据）
      return {
        users: 0, problems: PROBLEMS.length, solutions: 0,
        transactions: 0, blocks: 0, totalReward: 0,
        categories: CATEGORIES.map(c => ({
          id: c.id, name: c.name, count: PROBLEMS.filter(p => p.category === c.id).length, solved: 0
        })),
        badges: BADGES
      };
    }
  },

  // 区块链
  async chainInfo() {
    const blocks = await clientChain.getBlocks(1000);
    const sys = await clientChain.getSystemAddress();
    const allTxs = [];
    for (const b of blocks) {
      const txs = await clientChain.getBlockTransactions(b.id);
      allTxs.push(...txs);
    }
    return {
      blockCount: blocks.length, txCount: allTxs.length,
      totalSupply: allTxs.filter(t => !t.from_address).reduce((s, t) => s + t.amount, 0),
      systemAddress: sys,
      valid: true, validation: { valid: true, length: blocks.length }
    };
  },
  async blocks({ limit = 20 } = {}) {
    return { blocks: (await clientChain.getBlocks(limit)).map(b => ({ ...b, tx_count: b.tx_count })) };
  },
  async block(id) {
    const blocks = await clientChain.getBlocks(1000);
    const b = blocks.find(x => x.id === id);
    if (!b) throw new Error('区块不存在');
    return { block: b, transactions: await clientChain.getBlockTransactions(id) };
  },
  async transactions({ limit = 30, address } = {}) {
    return { transactions: await clientChain.getTransactions(limit, address) };
  },
  async transaction(id) {
    return { transaction: await clientChain.getTransaction(id) };
  },
  async balance(address) {
    return { address, balance: await clientChain.getBalance(address), user: null };
  },
  async address(address, { limit = 30 } = {}) {
    return {
      address, balance: await clientChain.getBalance(address),
      transactions: await clientChain.getTransactions(limit, address)
    };
  },
  async validate() {
    return { valid: true, length: (await clientChain.getBlocks(1000)).length };
  },

  // AI
  solve({ problem_id, user_input }) {
    return Promise.resolve(this.evaluate({ problem_id, content: '' })).then(() => localAIsolve(problem_id, user_input));
  },
  evaluate({ problem_id, content }) {
    return localAIeval(problem_id, content);
  },
  chat({ problem_id, messages, lang }) {
    return Promise.resolve({
      problemId: problem_id,
      reply: localAIchat(problem_id, messages || [], lang),
      model: 'heuristic',
      source: 'fallback',
      lang: lang || 'zh-CN',
      turn: (messages || []).filter(m => m.role === 'user').length
    });
  },

  // =============== 协作 v1.4.0 ===============
  // Discussions
  async listDiscussions(problemId) {
    const all = await dbAllByIndex('discussions', 'problem_id', problemId);
    const top = all.filter(d => !d.parent_id).sort((a, b) => b.created_at - a.created_at);
    const users = await dbAll('users');
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    const enriched = [];
    for (const t of top) {
      const replies = all.filter(d => d.parent_id === t.id).sort((a, b) => a.created_at - b.created_at);
      const votes = (await dbAllByIndex('discussion_votes', 'discussion_user', IDBKeyRange.bound([t.id, ''], [t.id, '\uffff'])))
        || (await dbAll('discussion_votes'));
      const tVotes = (await dbAll('discussion_votes')).filter(v => v.discussion_id === t.id);
      const up = tVotes.filter(v => v.value === 1).length;
      const down = tVotes.filter(v => v.value === -1).length;
      let myVote = 0;
      const token = localStorage.getItem('hpw_token');
      if (token) {
        const sess = await dbGet('sessions', token);
        const my = tVotes.find(v => v.user_id === sess?.user_id);
        if (my) myVote = my.value;
      }
      const u = userMap[t.user_id] || {};
      const replyView = replies.map(r => {
        const ru = userMap[r.user_id] || {};
        const rVotes = tVotes.filter(v => v.discussion_id === r.id);
        return {
          id: r.id, parentId: r.parent_id, content: r.content, createdAt: r.created_at, edited: !!r.edited_at,
          user: { id: r.user_id, username: ru.username, avatar: ru.avatar },
          votesUp: rVotes.filter(v => v.value === 1).length,
          votesDown: rVotes.filter(v => v.value === -1).length
        };
      });
      enriched.push({
        id: t.id, problemId: t.problem_id, content: t.content, createdAt: t.created_at, edited: !!t.edited_at,
        user: { id: t.user_id, username: u.username, avatar: u.avatar },
        votesUp: up, votesDown: down, myVote,
        replyCount: replies.length, replies: replyView
      });
    }
    return { discussions: enriched, total: all.length };
  },
  async createDiscussion({ problemId, content, parentId = null }) {
    if (!problemId) throw new Error('problemId 必填');
    if (!content || !content.trim()) throw new Error('内容不能为空');
    if (content.length > 4000) content = content.slice(0, 4000);
    if (parentId) {
      const parent = await dbGet('discussions', parentId);
      if (!parent) throw new Error('父帖不存在');
      if (parent.problem_id !== problemId) throw new Error('父帖不属于此问题');
      if (parent.parent_id) throw new Error('不支持多层嵌套');
    }
    const token = localStorage.getItem('hpw_token');
    const sess = await dbGet('sessions', token);
    if (!sess) throw new Error('请先登录');
    const id = genId(12);
    const row = { id, problem_id: problemId, user_id: sess.user_id, parent_id: parentId, content: content.trim(), created_at: Date.now() };
    await dbPut('discussions', row);
    return { ok: true, discussion: { id, parentId, content: row.content, createdAt: row.created_at } };
  },
  async editDiscussion(id, content) {
    if (!content || !content.trim()) throw new Error('内容不能为空');
    const d = await dbGet('discussions', id);
    if (!d) throw new Error('讨论不存在');
    const token = localStorage.getItem('hpw_token');
    const sess = await dbGet('sessions', token);
    if (d.user_id !== sess?.user_id) throw new Error('只能编辑自己的讨论');
    d.content = content.trim();
    d.edited_at = Date.now();
    await dbPut('discussions', d);
    return { ok: true };
  },
  async deleteDiscussion(id) {
    const d = await dbGet('discussions', id);
    if (!d) throw new Error('讨论不存在');
    const token = localStorage.getItem('hpw_token');
    const sess = await dbGet('sessions', token);
    if (d.user_id !== sess?.user_id) throw new Error('只能删除自己的讨论');
    if (!d.parent_id) {
      // 顶层帖：删所有回复
      const replies = await dbAllByIndex('discussions', 'parent_id', id);
      for (const r of replies) await dbDelete('discussions', r.id);
    }
    await dbDelete('discussions', id);
    return { ok: true };
  },
  async voteDiscussion(id, value) {
    if (![1, -1, 0].includes(value)) throw new Error('value must be 1, -1, 0');
    const d = await dbGet('discussions', id);
    if (!d) throw new Error('讨论不存在');
    const token = localStorage.getItem('hpw_token');
    const sess = await dbGet('sessions', token);
    if (!sess) throw new Error('请先登录');
    if (d.user_id === sess.user_id) throw new Error('不能给自己的讨论投票');
    const all = await dbAll('discussion_votes');
    const existing = all.find(v => v.discussion_id === id && v.user_id === sess.user_id);
    if (value === 0) {
      if (existing) await dbDelete('discussion_votes', existing.id);
    } else if (existing) {
      existing.value = value;
      existing.updated_at = Date.now();
      await dbPut('discussion_votes', existing);
    } else {
      await dbPut('discussion_votes', { id: genId(10), discussion_id: id, user_id: sess.user_id, value, created_at: Date.now() });
    }
    const after = (await dbAll('discussion_votes')).filter(v => v.discussion_id === id);
    return { ok: true, votesUp: after.filter(v => v.value === 1).length, votesDown: after.filter(v => v.value === -1).length, myVote: value };
  },

  // Roadmaps
  async listRoadmap(problemId) {
    const all = await dbAllByIndex('roadmaps', 'problem_id', problemId);
    all.sort((a, b) => a.created_at - b.created_at);
    const users = await dbAll('users');
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    const allReactions = await dbAll('roadmap_reactions');
    const token = localStorage.getItem('hpw_token');
    const sess = token ? await dbGet('sessions', token) : null;
    const viewerId = sess?.user_id;
    const enriched = all.map(r => {
      const re = allReactions.filter(x => x.roadmap_id === r.id);
      const u = userMap[r.user_id] || {};
      const counts = { like: 0, fire: 0, bulb: 0, rocket: 0, eyes: 0 };
      const mine = new Set();
      for (const x of re) {
        if (counts[x.value] !== undefined) counts[x.value]++;
        if (viewerId && x.user_id === viewerId) mine.add(x.value);
      }
      return {
        id: r.id, problemId: r.problem_id, title: r.title, description: r.description,
        status: r.status, createdAt: r.created_at, statusChangedAt: r.status_changed_at,
        user: { id: r.user_id, username: u.username },
        reactions: counts, myReactions: [...mine]
      };
    });
    return { entries: enriched, total: all.length };
  },
  async createRoadmap({ problemId, title, description = '', status = 'proposed' }) {
    if (!problemId) throw new Error('problemId 必填');
    if (!title || !title.trim()) throw new Error('标题不能为空');
    const VALID = ['proposed', 'exploring', 'in_progress', 'breakthrough', 'blocked', 'done'];
    if (!VALID.includes(status)) status = 'proposed';
    const token = localStorage.getItem('hpw_token');
    const sess = await dbGet('sessions', token);
    if (!sess) throw new Error('请先登录');
    const id = genId(12);
    const row = { id, problem_id: problemId, user_id: sess.user_id, title: title.trim().slice(0, 120), description: (description || '').slice(0, 1000), status, created_at: Date.now() };
    await dbPut('roadmaps', row);
    return { ok: true, entry: { id, problemId, title: row.title, description: row.description, status, createdAt: row.created_at } };
  },
  async updateRoadmap(id, patch) {
    const r = await dbGet('roadmaps', id);
    if (!r) throw new Error('条目不存在');
    const token = localStorage.getItem('hpw_token');
    const sess = await dbGet('sessions', token);
    if (r.user_id !== sess?.user_id) throw new Error('只能编辑自己的条目');
    const VALID = ['proposed', 'exploring', 'in_progress', 'breakthrough', 'blocked', 'done'];
    if (patch.title !== undefined) r.title = String(patch.title).trim().slice(0, 120) || r.title;
    if (patch.description !== undefined) r.description = String(patch.description).slice(0, 1000);
    if (patch.status !== undefined) {
      if (!VALID.includes(patch.status)) throw new Error('status 无效');
      r.status = patch.status;
      r.status_changed_at = Date.now();
    }
    await dbPut('roadmaps', r);
    return { ok: true };
  },
  async deleteRoadmap(id) {
    const r = await dbGet('roadmaps', id);
    if (!r) throw new Error('条目不存在');
    const token = localStorage.getItem('hpw_token');
    const sess = await dbGet('sessions', token);
    if (r.user_id !== sess?.user_id) throw new Error('只能删除自己的条目');
    await dbDelete('roadmaps', id);
    return { ok: true };
  },
  async reactRoadmap(id, value) {
    const r = await dbGet('roadmaps', id);
    if (!r) throw new Error('条目不存在');
    const token = localStorage.getItem('hpw_token');
    const sess = await dbGet('sessions', token);
    if (!sess) throw new Error('请先登录');
    const VALID = ['like', 'fire', 'bulb', 'rocket', 'eyes'];
    const all = await dbAll('roadmap_reactions');
    const existing = all.find(x => x.roadmap_id === id && x.user_id === sess.user_id);
    if (value === null || value === '' || value === undefined) {
      if (existing) await dbDelete('roadmap_reactions', existing.id);
      return { ok: true };
    }
    if (!VALID.includes(value)) throw new Error('reaction 无效');
    if (existing && existing.value === value) {
      await dbDelete('roadmap_reactions', existing.id);
    } else if (existing) {
      existing.value = value;
      existing.updated_at = Date.now();
      await dbPut('roadmap_reactions', existing);
    } else {
      await dbPut('roadmap_reactions', { id: genId(10), roadmap_id: id, user_id: sess.user_id, value, created_at: Date.now() });
    }
    return { ok: true };
  },

  // Teams
  async listTeams(problemId) {
    const all = await dbAllByIndex('teams', 'problem_id', problemId);
    all.sort((a, b) => b.created_at - a.created_at);
    const token = localStorage.getItem('hpw_token');
    const sess = token ? await dbGet('sessions', token) : null;
    const out = [];
    for (const t of all) {
      const members = await dbAllByIndex('team_members', 'team_id', t.id);
      out.push({
        id: t.id, problemId: t.problem_id, name: t.name, description: t.description,
        leaderId: t.leader_id, createdAt: t.created_at,
        memberCount: members.length,
        isMember: sess ? members.some(m => m.user_id === sess.user_id) : false,
        isLeader: sess ? t.leader_id === sess.user_id : false
      });
    }
    return { teams: out, total: all.length };
  },
  async createTeam({ problemId, name, description = '' }) {
    if (!problemId) throw new Error('problemId 必填');
    if (!name || !name.trim()) throw new Error('团队名不能为空');
    const token = localStorage.getItem('hpw_token');
    const sess = await dbGet('sessions', token);
    if (!sess) throw new Error('请先登录');
    const all = await dbAllByIndex('teams', 'problem_id', problemId);
    if (all.find(t => t.name === name.trim())) throw new Error('该问题下已存在同名团队');
    const id = genId(12);
    const t = { id, problem_id: problemId, name: name.trim().slice(0, 60), description: (description || '').slice(0, 500), leader_id: sess.user_id, created_at: Date.now() };
    await dbPut('teams', t);
    await dbPut('team_members', { id: genId(10), team_id: id, user_id: sess.user_id, role: 'leader', joined_at: Date.now() });
    return { ok: true, team: { id, name: t.name, problemId, description: t.description, leaderId: t.leader_id, createdAt: t.created_at, memberCount: 1, isMember: true, isLeader: true } };
  },
  async getTeam(id) {
    const t = await dbGet('teams', id);
    if (!t) throw new Error('团队不存在');
    const members = await dbAllByIndex('team_members', 'team_id', id);
    const users = await dbAll('users');
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    const sols = await dbAll('solutions');
    const token = localStorage.getItem('hpw_token');
    const sess = token ? await dbGet('sessions', token) : null;
    const roleOrder = { leader: 0, mentor: 1, researcher: 2, engineer: 3, student: 4, observer: 5 };
    const enriched = members.map(m => {
      const u = userMap[m.user_id] || {};
      const us = sols.filter(s => s.user_id === m.user_id);
      return {
        userId: m.user_id, username: u.username, avatar: u.avatar, wallet: u.wallet_address,
        role: m.role, joinedAt: m.joined_at,
        solutionsCount: us.length, totalScore: us.reduce((s, x) => s + (x.score_awarded || 0), 0)
      };
    }).sort((a, b) => (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9));
    return {
      team: {
        id: t.id, problemId: t.problem_id, name: t.name, description: t.description,
        leaderId: t.leader_id, createdAt: t.created_at,
        memberCount: members.length, members: enriched,
        isMember: sess ? members.some(m => m.user_id === sess.user_id) : false,
        isLeader: sess ? t.leader_id === sess.user_id : false
      }
    };
  },
  async joinTeam(id, role = 'researcher') {
    const VALID = ['leader', 'researcher', 'engineer', 'student', 'mentor', 'observer'];
    if (!VALID.includes(role)) role = 'researcher';
    const t = await dbGet('teams', id);
    if (!t) throw new Error('团队不存在');
    const token = localStorage.getItem('hpw_token');
    const sess = await dbGet('sessions', token);
    if (!sess) throw new Error('请先登录');
    const all = await dbAllByIndex('team_members', 'team_id', id);
    if (all.find(m => m.user_id === sess.user_id)) throw new Error('你已经在该团队中');
    await dbPut('team_members', { id: genId(10), team_id: id, user_id: sess.user_id, role, joined_at: Date.now() });
    return { ok: true };
  },
  async leaveTeam(id) {
    const t = await dbGet('teams', id);
    if (!t) throw new Error('团队不存在');
    const token = localStorage.getItem('hpw_token');
    const sess = await dbGet('sessions', token);
    if (!sess) throw new Error('请先登录');
    if (t.leader_id === sess.user_id) throw new Error('队长不能直接退出');
    const all = await dbAllByIndex('team_members', 'team_id', id);
    const m = all.find(x => x.user_id === sess.user_id);
    if (!m) throw new Error('你不在该团队中');
    await dbDelete('team_members', m.id);
    return { ok: true };
  },
  async updateTeam(id, patch) {
    const t = await dbGet('teams', id);
    if (!t) throw new Error('团队不存在');
    const token = localStorage.getItem('hpw_token');
    const sess = await dbGet('sessions', token);
    if (t.leader_id !== sess?.user_id) throw new Error('只有队长可以编辑团队信息');
    if (patch.name !== undefined) t.name = String(patch.name).trim().slice(0, 60) || t.name;
    if (patch.description !== undefined) t.description = String(patch.description).slice(0, 500);
    await dbPut('teams', t);
    return { ok: true };
  },
  async disbandTeam(id) {
    const t = await dbGet('teams', id);
    if (!t) throw new Error('团队不存在');
    const token = localStorage.getItem('hpw_token');
    const sess = await dbGet('sessions', token);
    if (t.leader_id !== sess?.user_id) throw new Error('只有队长可以解散团队');
    const all = await dbAllByIndex('team_members', 'team_id', id);
    for (const m of all) await dbDelete('team_members', m.id);
    await dbDelete('teams', id);
    return { ok: true };
  }
};

function shapeUser(u) {
  return {
    id: u.id, username: u.username, walletAddress: u.wallet_address,
    bio: u.bio || '', avatar: u.avatar || '',
    totalScore: u.total_score || 0, balance: 0, // 异步获取
    createdAt: u.created_at
  };
}

async function shapeUserAsync(u) {
  if (!u) return null;
  const balance = await clientChain.getBalance(u.wallet_address);
  return {
    id: u.id, username: u.username, walletAddress: u.wallet_address,
    bio: u.bio || '', avatar: u.avatar || '',
    totalScore: u.total_score || 0, balance,
    createdAt: u.created_at
  };
}

// AI fallback
function localAIsolve(problemId, userInput) {
  const p = getProblemById(problemId);
  if (!p) throw new Error('问题不存在');
  return {
    problemId, problemTitle: p.title, prompt: p.aiPrompt,
    userInput, source: 'fallback', model: 'heuristic',
    solution: `# ${p.title} (${p.titleEn})\n\n## 🧒 给小朋友的核心比喻\n\n${p.kid}\n\n## 📐 严格陈述\n\n${p.formal}\n\n## 🔥 为什么是"硬"问题\n\n${p.whyHard}\n\n## 🧭 建议方向\n\n1. **核心文献**：先读近 5 年的关键论文\n2. **跨学科类比**：很多 hard problem 突破来自借鉴\n3. **计算实验**：即使是纯数问题也能做大量数值\n4. **AI 辅助**：用大模型做综述、找模式、提假说\n5. **小而具体的子问题**：把大问题拆成可验证的小问题\n\n> 提示：把这个 prompt 复制到你常用的 AI 工具（ChatGPT/Claude/Gemini），会获得更个性化解答。\n\n${userInput ? `基于你提到的"${userInput.slice(0, 80)}"，建议先尝试方向 1 和 2。` : ''}`
  };
}

// =============== 5 维度启发式评估 (offline mode) ===============
function localAIeval(problemId, content) {
  const p = getProblemById(problemId);
  if (!p) throw new Error('问题不存在');
  const text = (content || '').toLowerCase();
  const strengths = [], weaknesses = [];

  // 准确性：关键词匹配
  const keywords = [
    ...p.title.toLowerCase().split(/\s+/),
    ...p.titleEn.toLowerCase().split(/\s+/),
    ...(p.tags || []).map(t => t.toLowerCase())
  ].filter(w => w.length > 2);
  const matchCount = keywords.filter(k => text.includes(k)).length;
  const matchRatio = keywords.length ? matchCount / keywords.length : 0;
  const accuracy = matchRatio > 0.5 ? 16 : matchRatio > 0.3 ? 13 : matchRatio > 0.1 ? 10 : 6;
  if (matchRatio > 0.3) strengths.push('内容与问题高度相关');
  else if (matchRatio < 0.1) weaknesses.push('与问题主题相关性较低');

  // 深度：思考连接词
  const depthSignals = ['因为', '所以', '因此', '但是', '然而', '例如', '比如', '假设', '证明', '实验', '观察', '理论', '模型', '方法', '思路'];
  const depthHits = depthSignals.filter(s => text.includes(s)).length;
  let depth = depthHits >= 6 ? 14 : depthHits >= 3 ? 11 : depthHits >= 1 ? 8 : 5;
  if (content.length > 2000) depth += 3; else if (content.length > 800) depth += 1;
  if (depthHits >= 5) strengths.push('展现深入思考');
  else if (depthHits === 0) weaknesses.push('缺少逻辑连接词，深度不足');

  // 原创性
  const origMarkers = ['我的看法', '我认为', '我猜想', '我的理解', '我的假设', '我提出', '我设计', 'i think', 'in my view'];
  const origHits = origMarkers.filter(s => text.includes(s)).length;
  const originality = origHits >= 2 ? 13 : origHits >= 1 ? 10 : 6;
  if (origHits >= 1) strengths.push('包含个人观点');

  // 严谨性
  let rigor = 5;
  if (content.includes('## ') || content.includes('# ')) rigor += 4;
  if (content.includes('```') || /\$\$?/.test(content)) rigor += 4;
  if (/\*\*[^*]+\*\*/.test(content)) rigor += 2;
  if ((content.match(/[0-9]+\./g) || []).length >= 3) rigor += 3;
  if (content.length > 1000) rigor += 2;
  if (/[^。.]\n/.test(content)) rigor += 2;
  if (rigor >= 14) strengths.push('结构严谨');
  else if (rigor < 8) weaknesses.push('结构松散');

  // 表达
  let clarity = 10;
  if (content.length < 100) clarity = 4;
  else if (content.length < 50) clarity = 2;
  else {
    if (content.length > 500) clarity += 4;
    if (content.length > 2000) clarity += 2;
    if (/^#+ /.test(content)) clarity += 2;
    if (content.split('\n\n').length >= 3) clarity += 2;
  }
  if (clarity >= 14) strengths.push('表达清晰');
  else if (clarity < 8) weaknesses.push('表达需要改进');

  const score = Math.max(0, Math.min(100, accuracy + depth + originality + rigor + clarity));
  return {
    score,
    dimensions: { accuracy, depth, originality, rigor, clarity },
    reasoning: `本地启发式 5 维评估：关键词匹配 ${Math.round(matchRatio * 100)}%，深度信号 ${depthHits} 个，结构分 ${rigor}，表达分 ${clarity}`,
    strengths: strengths.length ? strengths : ['提交了内容'],
    weaknesses: weaknesses.length ? weaknesses : ['需要真实 LLM 评估来获得更准确的判断'],
    verdict: score >= 70 ? '良好' : score >= 50 ? '及格' : '需要加强',
    model: 'heuristic',
    source: 'fallback'
  };
}

// =============== 离线模式：单轮 chat (用 evaluate 的启发式当回复) ===============
function localAIchat(problemId, messages, lang = 'zh-CN') {
  const p = getProblemById(problemId);
  if (!p) throw new Error('问题不存在');
  const turn = messages.filter(m => m.role === 'user').length;
  const lastUser = [...messages].reverse().find(m => m.role === 'user')?.content || '';

  // 找同 category 的 2-3 个相关问题作为"参考"
  const related = PROBLEMS
    .filter(x => x.id !== p.id && x.category === p.category)
    .slice(0, 3);

  const relatedText = related.length
    ? related.map((r, i) => `  ${i + 1}. ${r.title} (${r.titleEn})`).join('\n')
    : '  (none)';

  const I18N = {
    'zh-CN': {
      title: `# 💬 第 ${turn} 轮 · ${p.title}`,
      disclaimer: '> *当前 LLM 不可用，以下是基于公开资料的回复。配置 LLM API key 后将获得 AI 原创多轮对话。*',
      h1: '## 🧒 先回到小朋友版',
      h2: '## 📐 严格陈述',
      h3: '## 🔥 为什么难',
      h4: '## 🔗 相关问题（参考）',
      h5: `## 💡 你这次问的："${lastUser.slice(0, 100)}"`,
      intro: '这个角度很有价值。建议：',
      tip1: `1. **先看学科综述** — 找 "${p.titleEn} survey 2024 2025 2026" 关键词的 review paper`,
      tip2: `2. **跨学科类比** — 在 ${related[0]?.title || '相关问题'} 中能找到有用的类比`,
      tip3: '3. **动手算/做** — 即使是理论问题也可以做数值实验验证',
      tip4: '4. **拆子问题** — 把大问题拆成可验证的小问题',
      h6: '## 🎯 建议下一步',
      next1: '- 提供更多你的具体问题（数学表述/物理图像/计算数据）',
      next2: '- 引用你熟悉的论文或教材，我可以帮你梳理',
      next3: '- 想看一个具体子问题吗？告诉我你想深挖哪个方向',
      footer: (turn > 3) ? `\n\n---\n\n*我们已经聊了 ${turn} 轮。如果想换个角度，可以试问：这个问题和 ${related[0]?.title || '其他相关问题'} 有何联系？*` : ''
    },
    'en-US': {
      title: `# 💬 Turn ${turn} · ${p.title}`,
      disclaimer: '> *LLM currently unavailable. Public-data-based reply. Set LLM API key for original AI conversation.*',
      h1: '## 🧒 Kid-friendly recap',
      h2: '## 📐 Formal statement',
      h3: "## 🔥 Why it's hard",
      h4: '## 🔗 Related problems (reference)',
      h5: `## 💡 You asked: "${lastUser.slice(0, 100)}"`,
      intro: 'Good angle. Suggestions:',
      tip1: `1. **Read a survey** — search "${p.titleEn} survey 2024 2025 2026"`,
      tip2: `2. **Cross-disciplinary analogy** — useful parallels in ${related[0]?.title || 'related problems'}`,
      tip3: '3. **Compute/experiment** — even theoretical problems can be probed with numerics',
      tip4: '4. **Decompose** — break the big problem into verifiable sub-problems',
      h6: '## 🎯 Next steps',
      next1: '- Provide more specifics (math, physics, data)',
      next2: '- Cite papers/textbooks; I can organize them',
      next3: '- Want a sub-problem? Tell me which direction to dig',
      footer: (turn > 3) ? `\n\n---\n\n*${turn} turns in. To switch angle: how does this relate to ${related[0]?.title || 'related problems'}?*` : ''
    },
    'es-ES': {
      title: `# 💬 Turno ${turn} · ${p.title}`,
      disclaimer: '> *LLM no disponible. Respuesta basada en datos públicos.*',
      h1: '## 🧒 Resumen para niños',
      h2: '## 📐 Declaración formal',
      h3: '## 🔥 Por qué es difícil',
      h4: '## 🔗 Problemas relacionados (referencia)',
      h5: `## 🧭 Preguntaste: "${lastUser.slice(0, 100)}"`,
      intro: 'Buen ángulo. Sugerencias:',
      tip1: `1. **Lee un survey** — busca "${p.titleEn} survey 2024 2025 2026"`,
      tip2: `2. **Analogía interdisciplinaria** — paralelos en ${related[0]?.title || 'problemas relacionados'}`,
      tip3: '3. **Computar/experimentar** — problemas teóricos se pueden sondear',
      tip4: '4. **Descomponer** — divide en sub-problemas verificables',
      h6: '## 🎯 Próximos pasos',
      next1: '- Proporciona más detalles',
      next2: '- Cita artículos que conozcas',
      next3: '- ¿Quieres un sub-problema?',
      footer: (turn > 3) ? `\n\n---\n\n*${turn} turnos. Para cambiar ángulo: ¿cómo se relaciona con ${related[0]?.title || 'problemas relacionados'}?*` : ''
    },
    'ja-JP': {
      title: `# 💬 ${turn}ターン目 · ${p.title}`,
      disclaimer: '> *LLMが利用できません。公開データに基づく返信です。*',
      h1: '## 🧒 子ども向け要約',
      h2: '## 📐 厳密な記述',
      h3: '## 🔥 なぜ難しいか',
      h4: '## 🔗 関連問題 (参考)',
      h5: `## 🧭 質問: 「${lastUser.slice(0, 100)}」`,
      intro: '良い角度です。提案:',
      tip1: `1. **サーベイを読む** — "${p.titleEn} survey 2024 2025 2026" を検索`,
      tip2: `2. **学際的類推** — ${related[0]?.title || '関連問題'}と比較`,
      tip3: '3. **計算・実験** — 数値計算で探れる',
      tip4: '4. **分解** — 検証可能なサブプロブレムに',
      h6: '## 🎯 次のステップ',
      next1: '- 詳細を提供',
      next2: '- 知っている論文を引用',
      next3: '- サブプロブレムが必要?',
      footer: (turn > 3) ? `\n\n---\n\n*${turn}ターン。角度を変えるには: ${related[0]?.title || '関連問題'}との関係は?*` : ''
    }
  };

  const t = I18N[lang] || I18N['en-US'];
  return [
    t.title, '',
    t.disclaimer, '',
    t.h1, '', p.kid, '',
    t.h2, '', p.formal, '',
    t.h3, '', p.whyHard, '',
    t.h4, '', relatedText, '',
    t.h5, '',
    t.intro, '',
    t.tip1, t.tip2, t.tip3, t.tip4, '',
    t.h6, '',
    t.next1, t.next2, t.next3,
    t.footer
  ].join('\n');
}

// =============== 公开 API ===============
function getToken() { return localStorage.getItem('hpw_token'); }
function setToken(t) { if (t) localStorage.setItem('hpw_token', t); else localStorage.removeItem('hpw_token'); }

async function request(path, opts = {}) {
  // 先尝试真实后端
  if (await checkBackend()) {
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const res = await fetch('/api' + path, { ...opts, headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('json')) {
          backendAvailable = false;
          return localRoute(path, opts);
        }
        if (path === '/users/logout') setToken(null);
        return res.json();
      }
    } catch {
      backendAvailable = false;
    }
  }
  // 降级到本地，加超时保护
  return Promise.race([
    localRoute(path, opts),
    new Promise((_, reject) => setTimeout(() => reject(new Error('local timeout')), 5000))
  ]).catch(e => {
    console.warn('[api]', path, 'failed:', e.message);
    throw e;
  });
}

function localRoute(path, opts = {}) {
  // 处理 query string
  let cleanPath = path;
  let query = {};
  const qi = path.indexOf('?');
  if (qi >= 0) {
    cleanPath = path.slice(0, qi);
    const sp = new URLSearchParams(path.slice(qi + 1));
    for (const [k, v] of sp) query[k] = v;
  }
  // 关键修复：把闭包需要的所有变量声明在 _state 对象里（mutable object），
  // 避免 minifier 把 const 块重排导致 TDZ。
  // 历史教训：v1.2.0 中 minifier 把 localApi 的 const 块下移，导致
  //   "Cannot access 'y' before initialization"。
  const method = opts.method || 'GET';
  const body = opts.body || null;
  const params = body || query;
  // 预解析路径段：避免闭包依赖 let 声明的变量
  const segs = cleanPath.replace(/^\//, '').split('/');
  const seg0 = segs[0] || '';
  const seg1 = segs[1] || '';
  const seg2 = segs[2] || '';
  // _state 是 mutable，闭包通过它读 resource/id —— safe for minifier
  const _state = { resource: seg0, id: seg1 };

  // 显式路由表（覆盖模糊匹配）
  const EXPLICIT_ROUTES = {
    '/problems/categories': 'categories',
    '/users/register': 'registerUser',
    '/users/login': 'loginUser',
    '/users/me': 'me',
    '/users/logout': 'logout',
    '/leaderboard/stats': 'stats',
    '/chain/info': 'chainInfo',
    '/chain/validate': 'validate',
    '/chain/blocks': 'blocks',
    '/chain/transactions': 'transactions',
    '/ai/solve': 'solve',
    '/ai/evaluate': 'evaluate',
    '/ai/chat': 'chat',
    '/health': 'health',
    '/discussions': 'listDiscussions',
    '/roadmap': 'listRoadmap',
    '/teams': 'listTeams'
  };

  // localApi 现在只依赖 const 变量（method/body/params/segs）和 _state（mutable），
  // minifier 无论如何重排都不会触发 TDZ。
  const localApi = {
    health: () => ({ ok: true, time: Date.now(), mode: 'local' }),
    categories: () => localImpl.categories(),
    problems: () => localImpl.problems(params || {}),
    problem: () => localImpl.problem(_state.id),
    solutions: () => {
      if (method === 'POST') return localImpl.submitSolution(body);
      return localImpl.solutions(params || {});
    },
    vote: () => localImpl.vote(_state.id, body && body.value),
    leaderboard: () => localImpl.leaderboard(params || {}),
    stats: () => localImpl.stats(),
    chain: () => localImpl.chainInfo(),
    blocks: () => localImpl.blocks(params || {}),
    block: () => localImpl.block(_state.id),
    transactions: () => localImpl.transactions(params || {}),
    balance: () => localImpl.balance(_state.id || segs[segs.length - 1]),
    address: () => localImpl.address(_state.id || segs.slice(1).join('/'), params || {}),
    validate: () => localImpl.validate(),
    solve: () => localImpl.solve(body),
    evaluate: () => localImpl.evaluate(body),
    chat: () => localImpl.chat(body),
    me: () => localImpl.me(),
    registerUser: () => localImpl.register(body),
    loginUser: () => localImpl.login(body),
    logout: () => { setToken(null); return { ok: true }; },
    users: () => {
      if (method === 'POST' && !_state.id) {
        if (body && body.username && body.password) {
          return body.bio !== undefined ? localImpl.register(body) : localImpl.login(body);
        }
      }
      if (_state.id) return localImpl.getUser(_state.id);
      throw new Error('users route invalid');
    },
    // v1.4.0 协作
    listDiscussions: () => localImpl.listDiscussions(params?.problem || params?.problemId),
    discussions: () => {
      // POST /discussions 或 PATCH/DELETE /discussions/:id
      if (method === 'POST') return localImpl.createDiscussion(body);
      // 3 段 /discussions/:id/vote
      if (seg2 === 'vote') return localImpl.voteDiscussion(_state.id, body && body.value);
      // PATCH/DELETE /discussions/:id 走 fallback
      if (method === 'PATCH') return localImpl.editDiscussion(_state.id, body?.content);
      if (method === 'DELETE') return localImpl.deleteDiscussion(_state.id);
      throw new Error('discussions route invalid');
    },
    listRoadmap: () => localImpl.listRoadmap(params?.problem || params?.problemId),
    roadmap: () => {
      if (method === 'POST') return localImpl.createRoadmap(body);
      if (seg2 === 'react') return localImpl.reactRoadmap(_state.id, body?.value);
      if (method === 'PATCH') return localImpl.updateRoadmap(_state.id, body);
      if (method === 'DELETE') return localImpl.deleteRoadmap(_state.id);
      throw new Error('roadmap route invalid');
    },
    listTeams: () => localImpl.listTeams(params?.problem || params?.problemId),
    teams: () => {
      // GET /teams/:id
      if (method === 'GET' && _state.id && !seg2) return localImpl.getTeam(_state.id);
      // POST /teams
      if (method === 'POST' && !_state.id) return localImpl.createTeam(body);
      // POST /teams/:id/join, /teams/:id/leave
      if (seg2 === 'join') return localImpl.joinTeam(_state.id, body?.role);
      if (seg2 === 'leave') return localImpl.leaveTeam(_state.id);
      // PATCH /teams/:id 或 /teams/:id/members/:userId
      if (method === 'PATCH' && seg2 === 'members') {
        // 不在 localImpl 里实现，简化为忽略
        return { ok: true, note: 'role update not supported in local mode' };
      }
      if (method === 'PATCH') return localImpl.updateTeam(_state.id, body);
      if (method === 'DELETE') return localImpl.disbandTeam(_state.id);
      throw new Error('teams route invalid');
    }
  };

  if (EXPLICIT_ROUTES[cleanPath]) {
    return localApi[EXPLICIT_ROUTES[cleanPath]]();
  }

  // 3 段路径：/chain/blocks/:id, /chain/transactions/:id, /chain/balance/:address, /chain/address/:address
  if (segs.length === 3 && seg0 === 'chain') {
    if (seg1 === 'blocks') return localImpl.block(seg2);
    if (seg1 === 'transactions') return localImpl.transaction(seg2);
    if (seg1 === 'balance') return localImpl.balance(seg2);
    if (seg1 === 'address') return localImpl.address(seg2, params || {});
  }
  // /solutions/:id/vote, /solutions/:id/my-vote
  if (segs.length === 3 && seg0 === 'solutions') {
    if (seg2 === 'vote') return localImpl.vote(seg1, body && body.value);
    if (seg2 === 'my-vote') return localImpl.myVote(seg1);
  }
  // v1.4.0 协作 - 3 段路径
  if (seg0 === 'discussions') {
    if (segs.length === 1) {
      // POST /discussions
      if (method === 'POST') return localImpl.createDiscussion(body);
      // GET /discussions?problem=xxx
      return localImpl.listDiscussions(params?.problem || params?.problemId);
    }
    if (segs.length === 3) {
      if (seg2 === 'vote') return localImpl.voteDiscussion(seg1, body && body.value);
    }
    if (segs.length === 2) {
      if (method === 'PATCH') return localImpl.editDiscussion(seg1, body?.content);
      if (method === 'DELETE') return localImpl.deleteDiscussion(seg1);
    }
  }
  if (seg0 === 'roadmap') {
    if (segs.length === 1) {
      if (method === 'POST') return localImpl.createRoadmap(body);
      return localImpl.listRoadmap(params?.problem || params?.problemId);
    }
    if (segs.length === 3 && seg2 === 'react') {
      return localImpl.reactRoadmap(seg1, body?.value);
    }
    if (segs.length === 2) {
      if (method === 'PATCH') return localImpl.updateRoadmap(seg1, body);
      if (method === 'DELETE') return localImpl.deleteRoadmap(seg1);
    }
  }
  if (seg0 === 'teams') {
    if (segs.length === 1) {
      if (method === 'POST') return localImpl.createTeam(body);
      return localImpl.listTeams(params?.problem || params?.problemId);
    }
    if (segs.length === 2) {
      if (method === 'GET') return localImpl.getTeam(seg1);
      if (method === 'PATCH') return localImpl.updateTeam(seg1, body);
      if (method === 'DELETE') return localImpl.disbandTeam(seg1);
    }
    if (segs.length === 3) {
      if (seg2 === 'join') return localImpl.joinTeam(seg1, body?.role);
      if (seg2 === 'leave') return localImpl.leaveTeam(seg1);
    }
    if (segs.length === 4 && seg2 === 'members') {
      return { ok: true, note: 'role update not supported in local mode' };
    }
  }

  // 简单路由器
  if (!seg0) throw new Error('Local route not found: ' + path);
  let actualResource = seg0;
  if (seg0 === 'problems' && seg1) actualResource = 'problem';
  // 同步到 _state（id 已经在 seg1 中）
  _state.resource = seg0;
  _state.id = seg1;

  if (!localApi[actualResource]) throw new Error('Unknown resource: ' + seg0);
  return localApi[actualResource]();
}

export const api = {
  health: () => request('/health'),
  register: (data) => request('/users/register', { method: 'POST', body: data }),
  login: (data) => request('/users/login', { method: 'POST', body: data }),
  logout: () => request('/users/logout', { method: 'POST' }),
  me: () => request('/users/me'),
  updateMe: (data) => request('/users/me', { method: 'PATCH', body: data }),
  getUser: (username) => request('/users/' + username),
  categories: () => request('/problems/categories'),
  problems: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('/problems' + (q ? '?' + q : ''));
  },
  problem: (id) => request('/problems/' + id),
  solutions: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('/solutions' + (q ? '?' + q : ''));
  },
  submitSolution: (data) => request('/solutions', { method: 'POST', body: data }),
  vote: (id, value) => request(`/solutions/${id}/vote`, { method: 'POST', body: { value } }),
  myVote: (id) => request(`/solutions/${id}/my-vote`),
  leaderboard: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('/leaderboard' + (q ? '?' + q : ''));
  },
  stats: () => request('/leaderboard/stats'),
  chainInfo: () => request('/chain/info'),
  blocks: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('/chain/blocks' + (q ? '?' + q : ''));
  },
  block: (id) => request('/chain/blocks/' + id),
  transactions: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('/chain/transactions' + (q ? '?' + q : ''));
  },
  balance: (address) => request('/chain/balance/' + address),
  address: (address, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('/chain/address/' + address + (q ? '?' + q : ''));
  },
  validate: () => request('/chain/validate'),
  solve: (problemId, userInput) => request('/ai/solve', { method: 'POST', body: { problem_id: problemId, user_input: userInput } }),
  evaluate: (problemId, content) => request('/ai/evaluate', { method: 'POST', body: { problem_id: problemId, content } }),
  chat: (problemId, messages, lang) => request('/ai/chat', { method: 'POST', body: { problem_id: problemId, messages, lang } }),

  // v1.4.0 协作
  listDiscussions: (problemId) => {
    const q = new URLSearchParams({ problem: problemId }).toString();
    return request('/discussions?' + q);
  },
  createDiscussion: (data) => request('/discussions', { method: 'POST', body: data }),
  editDiscussion: (id, content) => request('/discussions/' + id, { method: 'PATCH', body: { content } }),
  deleteDiscussion: (id) => request('/discussions/' + id, { method: 'DELETE' }),
  voteDiscussion: (id, value) => request('/discussions/' + id + '/vote', { method: 'POST', body: { value } }),
  listRoadmap: (problemId) => {
    const q = new URLSearchParams({ problem: problemId }).toString();
    return request('/roadmap?' + q);
  },
  createRoadmap: (data) => request('/roadmap', { method: 'POST', body: data }),
  updateRoadmap: (id, patch) => request('/roadmap/' + id, { method: 'PATCH', body: patch }),
  deleteRoadmap: (id) => request('/roadmap/' + id, { method: 'DELETE' }),
  reactRoadmap: (id, value) => request('/roadmap/' + id + '/react', { method: 'POST', body: { value } }),
  listTeams: (problemId) => {
    const q = new URLSearchParams({ problem: problemId }).toString();
    return request('/teams?' + q);
  },
  createTeam: (data) => request('/teams', { method: 'POST', body: data }),
  getTeam: (id) => request('/teams/' + id),
  joinTeam: (id, role) => request('/teams/' + id + '/join', { method: 'POST', body: { role } }),
  leaveTeam: (id) => request('/teams/' + id + '/leave', { method: 'POST' }),
  updateTeam: (id, patch) => request('/teams/' + id, { method: 'PATCH', body: patch }),
  disbandTeam: (id) => request('/teams/' + id, { method: 'DELETE' }),

  // 模式探测
  isLocalMode: () => !backendAvailable,
  setToken, getToken
};

export { setToken, getToken };

// 启动客户端链
clientChain.startBlockMaker(5000);
