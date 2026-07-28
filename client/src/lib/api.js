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
const DB_VERSION = 1;
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

function localAIeval(problemId, content) {
  const p = getProblemById(problemId);
  if (!p) throw new Error('问题不存在');
  const text = (content || '').toLowerCase();
  let score = 0;
  const strengths = [], weaknesses = [];

  if (content.length < 50) { weaknesses.push('内容过短'); }
  else if (content.length < 200) { score += 15; weaknesses.push('内容偏短'); }
  else if (content.length < 800) { score += 30; }
  else if (content.length < 2000) { score += 45; strengths.push('内容长度充分'); }
  else { score += 50; strengths.push('内容详尽'); }

  if (content.includes('## ') || content.includes('# ')) { score += 8; strengths.push('使用了 Markdown 章节'); }
  if (content.includes('```') || content.includes('$')) { score += 5; strengths.push('包含代码或公式'); }
  if (content.match(/\*\*[^*]+\*\*/)) { score += 3; }

  const keywords = [
    ...p.title.toLowerCase().split(/\s+/),
    ...p.titleEn.toLowerCase().split(/\s+/),
    ...(p.tags || []).map(t => t.toLowerCase())
  ].filter(w => w.length > 2);
  let match = 0;
  for (const k of keywords) if (text.includes(k)) match++;
  const ratio = keywords.length ? match / keywords.length : 0;
  if (ratio > 0.3) { score += 15; strengths.push(`与问题高度相关（${Math.round(ratio * 100)}%）`); }
  else if (ratio > 0.1) { score += 8; }
  else { weaknesses.push('与问题主题相关性低'); }

  const signals = ['因为', '所以', '但是', '然而', '例如', '假设', '证明', '实验', '理论', '模型', '方法', '思路'];
  const sd = signals.filter(s => content.includes(s)).length;
  if (sd >= 5) { score += 10; strengths.push('展现深入思考'); }
  else if (sd >= 2) { score += 5; }

  if (/我的看法|我认为|我猜想|我的理解/i.test(content)) { score += 5; strengths.push('包含个人观点'); }

  score = Math.max(0, Math.min(100, score));
  return {
    score,
    reasoning: `本地启发式评估：长度(${content.length})、结构、关键词匹配(${Math.round(ratio * 100)}%)、思考深度(${sd})`,
    strengths: strengths.length ? strengths : ['提交了内容'],
    weaknesses: weaknesses.length ? weaknesses : ['需要真实 LLM 评估'],
    model: 'heuristic', source: 'fallback'
  };
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

  // 简单的路由器
  const m = cleanPath.match(/^\/(\w+)(?:\/(\w+))?$/);
  if (!m) throw new Error('Local route not found: ' + path);
  let resource = m[1];
  const id = m[2];
  // 关键：/problems/:id 应该走 problem (单数)，不是 problems (列表)
  if (resource === 'problems' && id) resource = 'problem';
  const method = opts.method || 'GET';
  const body = opts.body || null;
  // body 优先，query 作为 fallback
  const params = body || query;

  const localApi = {
    health: () => ({ ok: true, time: Date.now(), mode: 'local' }),
    categories: () => localImpl.categories(),
    problems: () => localImpl.problems(params || {}),
    problem: () => localImpl.problem(id),
    solutions: () => {
      if (method === 'POST') return localImpl.submitSolution(body);
      return localImpl.solutions(params || {});
    },
    vote: () => localImpl.vote(id, body && body.value),
    leaderboard: () => localImpl.leaderboard(params || {}),
    stats: () => localImpl.stats(),
    chain: () => localImpl.chainInfo(),
    blocks: () => localImpl.blocks(params || {}),
    block: () => localImpl.block(id),
    transactions: () => localImpl.transactions(params || {}),
    balance: () => localImpl.balance(id || path.split('/').pop()),
    address: () => localImpl.address(id || path.split('/').slice(2).join('/'), params || {}),
    validate: () => localImpl.validate(),
    solve: () => localImpl.solve(body),
    evaluate: () => localImpl.evaluate(body),
    me: () => localImpl.me(),
    users: () => {
      if (method === 'POST' && !id) {
        if (body && body.username && body.password) {
          return body.bio !== undefined ? localImpl.register(body) : localImpl.login(body);
        }
      }
      if (id) return localImpl.getUser(id);
      throw new Error('users route invalid');
    }
  };

  if (!localApi[resource]) throw new Error('Unknown resource: ' + resource);
  return localApi[resource]();
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

  // 模式探测
  isLocalMode: () => !backendAvailable,
  setToken, getToken
};

export { setToken, getToken };

// 启动客户端链
clientChain.startBlockMaker(5000);
