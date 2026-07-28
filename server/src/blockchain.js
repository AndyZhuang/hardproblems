// 轻量级区块链实现
// - Ed25519 钱包（每个用户有独立地址）
// - 交易用私钥签名
// - 区块用 SHA-256 哈希链
// - Merkle tree 整合交易
// - 每 5 秒自动出块

import crypto from 'node:crypto';
import { nanoid } from 'nanoid';
import { Users, Sessions, Solutions, Votes, Txs, Blocks, ChainMeta } from './db.js';
import { logger } from './logger.js';
import { config } from './config.js';

const log = logger.child('chain');

const HASH_256_ZERO = '0'.repeat(64);

// =============== 钱包 ===============
export function generateWallet() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });
  const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  const pubHash = crypto.createHash('sha256').update(publicKeyPem).digest('hex');
  const address = 'HPW1' + pubHash.slice(0, 40);
  return { address, publicKey: publicKeyPem, privateKey: privateKeyPem };
}

export function signMessage(privateKeyPem, message) {
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  return crypto.sign(null, Buffer.from(message), privateKey).toString('base64');
}

export function verifySignature(publicKeyPem, message, signatureB64) {
  try {
    const publicKey = crypto.createPublicKey(publicKeyPem);
    return crypto.verify(null, Buffer.from(message), publicKey, Buffer.from(signatureB64, 'base64'));
  } catch {
    return false;
  }
}

// =============== 哈希 ===============
export function sha256Hex(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function merkleRoot(hashes) {
  if (hashes.length === 0) return HASH_256_ZERO;
  let level = [...hashes];
  if (level.length % 2 === 1) level.push(level[level.length - 1]);
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      next.push(sha256Hex(level[i] + level[i + 1]));
    }
    level = next;
  }
  return level[0];
}

export function txCanonical(tx) {
  return [
    tx.id,
    tx.from_address || '',
    tx.to_address,
    String(tx.amount),
    tx.type,
    tx.ref_type || '',
    tx.ref_id || '',
    String(tx.timestamp)
  ].join('|');
}

export function hashTransaction(tx) {
  return sha256Hex(txCanonical(tx));
}

export function hashBlock(b) {
  return sha256Hex([
    String(b.index_num),
    b.prev_hash,
    b.merkle_root,
    String(b.timestamp),
    String(b.nonce)
  ].join('|'));
}

// =============== 链查询 ===============
export function getBlocks(limit = 20, offset = 0) {
  const all = Blocks.all().slice().sort((a, b) => b.index_num - a.index_num);
  return all.slice(offset, offset + limit);
}

export function getBlockById(id) {
  return Blocks.byId(id);
}

export function getBlockTransactions(blockId) {
  return Txs.byBlock(blockId).sort((a, b) => a.timestamp - b.timestamp);
}

export function getTransactions(limit = 30, offset = 0, address = null) {
  let all = address ? Txs.byAddress(address) : Txs.all();
  all = all.sort((a, b) => b.timestamp - a.timestamp);
  return all.slice(offset, offset + limit);
}

export function getTransactionById(id) {
  return Txs.byId(id);
}

export function getBalance(address) {
  let sum = 0;
  for (const t of Txs.all()) {
    if (!t.block_id) continue; // 只算已上链的
    if (t.to_address === address) sum += t.amount;
    if (t.from_address === address) sum -= t.amount;
  }
  return sum;
}

// =============== 创世区块 ===============
function createGenesisBlock() {
  if (Blocks.count() > 0) return;
  const ts = Date.now();
  const block = {
    id: nanoid(16),
    index_num: 0,
    prev_hash: HASH_256_ZERO,
    merkle_root: HASH_256_ZERO,
    timestamp: ts,
    nonce: 0,
    hash: '',
    tx_count: 0
  };
  block.hash = hashBlock(block);
  Blocks.create(block);
  log.info(`genesis block: ${block.hash.slice(0, 16)}...`);
}

// =============== 系统钱包 ===============
function getOrCreateSystemWallet() {
  let address = ChainMeta.get('system_address');
  let priv = ChainMeta.get('system_private_key');
  let pub = ChainMeta.get('system_public_key');
  if (!address) {
    const w = generateWallet();
    ChainMeta.set('system_address', w.address);
    ChainMeta.set('system_private_key', w.privateKey);
    ChainMeta.set('system_public_key', w.publicKey);
    log.info(`system wallet: ${w.address}`);
    return w;
  }
  return { address, privateKey: priv, publicKey: pub };
}

export function getSystemAddress() {
  return getOrCreateSystemWallet().address;
}

function signWithSystem(message) {
  const w = getOrCreateSystemWallet();
  return signMessage(w.privateKey, message);
}

// =============== 交易创建 ===============
export function createTransaction({ from_address = null, to_address, amount, type, ref_type = null, ref_id = null, note = '' }) {
  if (!to_address) throw new Error('to_address required');
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('amount must be positive');

  const tx = {
    id: nanoid(20),
    from_address,
    to_address,
    amount: Math.floor(amount),
    type,
    ref_type,
    ref_id,
    note,
    timestamp: Date.now(),
    signature: '',
    block_id: null
  };
  tx.signature = signWithSystem(txCanonical(tx));
  return tx;
}

export async function submitTransaction(tx) {
  // 把交易放进内存池，由出块器打包
  txPool.push(tx);
  return tx;
}

// =============== 出块 ===============
const txPool = [];
let processing = false;

async function makeBlock() {
  if (processing) return null;
  if (txPool.length === 0) return null;
  processing = true;
  try {
    const txs = txPool.splice(0, txPool.length);
    if (txs.length === 0) return null;

    // 验签
    for (const tx of txs) {
      if (tx.from_address) {
        const user = Users.byWallet(tx.from_address);
        if (user && user.public_key) {
          const ok = verifySignature(user.public_key, txCanonical(tx), tx.signature);
          if (!ok) {
            console.warn(`[chain] invalid signature on tx ${tx.id}, dropping`);
            tx._invalid = true;
          }
        }
      }
    }
    const validTxs = txs.filter(t => !t._invalid);
    if (validTxs.length === 0) return null;

    const txHashes = validTxs.map(hashTransaction);
    const mr = merkleRoot(txHashes);
    const prev = Blocks.latest();
    const index_num = prev ? prev.index_num + 1 : 0;
    const ts = Date.now();
    const nonce = Math.floor(Math.random() * 1e6);
    const block = {
      id: nanoid(16),
      index_num,
      prev_hash: prev ? prev.hash : HASH_256_ZERO,
      merkle_root: mr,
      timestamp: ts,
      nonce,
      hash: '',
      tx_count: validTxs.length
    };
    block.hash = hashBlock(block);
    Blocks.create(block);
    for (const tx of validTxs) {
      // 写入 Txs 表（如果还没写入）
      if (!Txs.byId(tx.id)) {
        Txs.create({ ...tx, block_id: block.id });
      } else {
        Txs.update(tx.id, { block_id: block.id });
      }
      const u = Users.byWallet(tx.to_address);
      if (u) Users.incrementScore(u.id, tx.amount);
    }
    log.info(`block #${block.index_num} mined with ${validTxs.length} tx, hash=${block.hash.slice(0, 16)}...`);
    return { block, txs: validTxs };
  } finally {
    processing = false;
  }
}

let blockMakerHandle = null;
export function startBlockMaker(intervalMs) {
  if (blockMakerHandle) return;
  const ms = intervalMs ?? config.chain.blockIntervalMs;
  createGenesisBlock();
  blockMakerHandle = setInterval(() => {
    makeBlock().catch(e => log.error('makeBlock', { msg: e.message }));
  }, ms);
  log.info(`block maker started (every ${ms}ms)`);
}

export async function forceMakeBlock() {
  return makeBlock();
}

// 链验证
export function validateChain() {
  const blocks = Blocks.all().slice().sort((a, b) => a.index_num - b.index_num);
  let prevHash = HASH_256_ZERO;
  for (const b of blocks) {
    if (b.prev_hash !== prevHash) {
      return { valid: false, block: b.index_num, reason: 'prev_hash mismatch' };
    }
    if (b.hash !== hashBlock(b)) {
      return { valid: false, block: b.index_num, reason: 'block hash mismatch' };
    }
    prevHash = b.hash;
  }
  return { valid: true, length: blocks.length };
}
