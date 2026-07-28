// 区块链浏览器
import { Router } from 'express';
import { Users, Blocks, Txs } from '../db.js';
import { getBlocks, getBlockById, getBlockTransactions, getTransactions, getTransactionById, getBalance, validateChain, getSystemAddress } from '../blockchain.js';
import { requireAuth } from './users.js';

const router = Router();

// 链信息
router.get('/info', (req, res) => {
  const validation = validateChain();
  const blockCount = Blocks.count();
  const txCount = Txs.all().length;
  const totalSupply = Txs.all().filter(t => !t.from_address).reduce((s, t) => s + t.amount, 0);
  res.json({
    blockCount, txCount, totalSupply,
    systemAddress: getSystemAddress(),
    valid: validation.valid,
    validation
  });
});

// 区块列表
router.get('/blocks', (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  const blocks = getBlocks(Number(limit), Number(offset));
  res.json({ blocks });
});

// 区块详情
router.get('/blocks/:id', (req, res) => {
  const b = getBlockById(req.params.id);
  if (!b) return res.status(404).json({ error: 'not found' });
  const txs = getBlockTransactions(b.id);
  res.json({ block: b, transactions: txs });
});

// 交易列表
router.get('/transactions', (req, res) => {
  const { limit = 30, offset = 0, address } = req.query;
  const txs = getTransactions(Number(limit), Number(offset), address || null);
  res.json({ transactions: txs });
});

// 交易详情
router.get('/transactions/:id', (req, res) => {
  const tx = getTransactionById(req.params.id);
  if (!tx) return res.status(404).json({ error: 'not found' });
  res.json({ transaction: tx });
});

// 地址余额
router.get('/balance/:address', (req, res) => {
  const balance = getBalance(req.params.address);
  const user = Users.byWallet(req.params.address);
  res.json({ address: req.params.address, balance, user: user ? { id: user.id, username: user.username, avatar: user.avatar, bio: user.bio } : null });
});

// 地址交易历史
router.get('/address/:address', (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  const txs = getTransactions(Number(limit), Number(offset), req.params.address);
  const balance = getBalance(req.params.address);
  res.json({ address: req.params.address, balance, transactions: txs });
});

// 验证链
router.get('/validate', (req, res) => {
  res.json(validateChain());
});

export { router };
