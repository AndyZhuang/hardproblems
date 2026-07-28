// 用户管理
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import rateLimit from 'express-rate-limit';
import { Users, Sessions } from '../db.js';
import { generateWallet, getBalance, createTransaction, submitTransaction } from '../blockchain.js';
import { signToken, verifyToken } from '../auth.js';
import { logger } from '../logger.js';
import { isProd } from '../config.js';

const router = Router();

// 限流
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
});

function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    username: u.username,
    walletAddress: u.wallet_address,
    bio: u.bio || '',
    avatar: u.avatar || '',
    totalScore: u.total_score || 0,
    balance: getBalance(u.wallet_address),
    createdAt: u.created_at
  };
}

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
  if (!token) return res.status(401).json({ error: '未登录' });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'token 无效或已过期' });
  const user = Users.byId(payload.uid);
  if (!user) return res.status(401).json({ error: '用户不存在' });
  req.user = user;
  req.tokenPayload = payload;
  next();
}

// 输入验证
function validateUsername(s) {
  if (typeof s !== 'string') return '用户名必须是字符串';
  if (s.length < 2 || s.length > 30) return '用户名长度需在 2-30 之间';
  if (!/^[a-zA-Z0-9_\u4e00-\u9fa5\-]+$/.test(s)) return '用户名只能包含字母、数字、下划线、中文和横线';
  return null;
}
function validatePassword(s) {
  if (typeof s !== 'string') return '密码必须是字符串';
  if (s.length < 6 || s.length > 200) return '密码长度需在 6-200 之间';
  return null;
}
function validateBio(s) {
  if (s === undefined || s === '') return null;
  if (typeof s !== 'string') return '简介必须是字符串';
  if (s.length > 200) return '简介最多 200 字符';
  return null;
}

router.post('/register', authLimiter, async (req, res) => {
  const { username, password, bio = '' } = req.body || {};
  const err1 = validateUsername(username);
  if (err1) return res.status(400).json({ error: err1 });
  const err2 = validatePassword(password);
  if (err2) return res.status(400).json({ error: err2 });
  const err3 = validateBio(bio);
  if (err3) return res.status(400).json({ error: err3 });

  if (Users.byUsername(username)) return res.status(409).json({ error: '用户名已被占用' });

  try {
    const wallet = generateWallet();
    const id = nanoid(16);
    const hash = await bcrypt.hash(password, isProd ? 12 : 8);
    const now = Date.now();

    const user = Users.create({
      id, username, password_hash: hash, wallet_address: wallet.address,
      public_key: wallet.publicKey, private_key: wallet.privateKey,
      bio, avatar: '', total_score: 0, created_at: now
    });

    // 注册奖励
    const tx = createTransaction({
      to_address: wallet.address, amount: 100, type: 'reward',
      ref_type: 'registration', ref_id: id, note: 'Welcome bonus: 100 HPW'
    });
    await submitTransaction(tx);

    const token = signToken({ uid: id, username });
    logger.info('user registered', { username, id });
    res.json({ token, user: publicUser(user) });
  } catch (e) {
    logger.error('register failed', { err: e.message, username });
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: '用户名和密码必填' });
  }
  const u = Users.byUsername(username);
  if (!u) return res.status(401).json({ error: '用户名或密码错误' });
  const ok = await bcrypt.compare(password, u.password_hash);
  if (!ok) return res.status(401).json({ error: '用户名或密码错误' });

  const token = signToken({ uid: u.id, username });
  logger.info('user login', { username, id: u.id });
  res.json({ token, user: publicUser(u) });
});

router.post('/logout', requireAuth, (req, res) => {
  logger.info('user logout', { id: req.user.id });
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.get('/:username', (req, res) => {
  const u = Users.byUsername(req.params.username);
  if (!u) return res.status(404).json({ error: '用户不存在' });
  res.json({ user: publicUser(u) });
});

router.patch('/me', requireAuth, (req, res) => {
  const { bio, avatar } = req.body || {};
  if (bio !== undefined) {
    const e = validateBio(bio);
    if (e) return res.status(400).json({ error: e });
  }
  if (avatar !== undefined) {
    if (typeof avatar !== 'string' || avatar.length > 500) {
      return res.status(400).json({ error: '头像 URL 不合法' });
    }
  }
  const patch = {};
  if (bio !== undefined) patch.bio = bio;
  if (avatar !== undefined) patch.avatar = avatar;
  Users.update(req.user.id, patch);
  res.json({ user: publicUser(Users.byId(req.user.id)) });
});

export { router, publicUser };
