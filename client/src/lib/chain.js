// 浏览器端"区块链"实现（IndexedDB 持久化）
// 用 Web Crypto API 做 Ed25519 签名 + SHA-256 哈希

import { PROBLEMS, CATEGORIES, getProblemById } from './problems.js';

const DB_NAME = 'hpw_chain';
const DB_VERSION = 1;
const HASH_ZERO = '0'.repeat(64);

// =============== IndexedDB 工具 ===============
let dbInstance = null;
function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('sessions')) db.createObjectStore('sessions', { keyPath: 'token' });
      if (!db.objectStoreNames.contains('solutions')) db.createObjectStore('solutions', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('votes')) db.createObjectStore('votes', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('transactions')) db.createObjectStore('transactions', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('blocks')) db.createObjectStore('blocks', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
    };
    req.onsuccess = () => { dbInstance = req.result; resolve(req.result); };
    req.onerror = () => reject(req.error);
  });
}

function p(req) { return new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); }); }

async function getStore(name, mode = 'readonly') {
  const db = await openDB();
  return db.transaction(name, mode).objectStore(name);
}
async function dbAll(name) { return p((await getStore(name)).getAll()); }
async function dbGet(name, key) { return p((await getStore(name)).get(key)); }
async function dbPut(name, value) { return p((await getStore(name, 'readwrite')).put(value)); }
async function dbDelete(name, key) { return p((await getStore(name, 'readwrite')).delete(key)); }
async function dbQuery(name, pred) { return (await dbAll(name)).filter(pred); }
async function metaGet(key) { const r = await dbGet('meta', key); return r ? r.value : null; }
async function metaSet(key, value) { await dbPut('meta', { key, value }); }

// =============== 加密原语 ===============
async function sha256Hex(data) {
  const buf = new TextEncoder().encode(data);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function generateWallet() {
  const keyPair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const pubB64 = btoa(String.fromCharCode(...new Uint8Array(publicKey)));
  const privB64 = btoa(String.fromCharCode(...new Uint8Array(privateKey)));
  const pubPem = `-----BEGIN PUBLIC KEY-----\n${pubB64}\n-----END PUBLIC KEY-----`;
  const privPem = `-----BEGIN PRIVATE KEY-----\n${privB64}\n-----END PRIVATE KEY-----`;
  const pubHash = await sha256Hex(pubPem);
  const address = 'HPW1' + pubHash.slice(0, 40);
  return { address, publicKey: pubPem, privateKey: privPem };
}

function pemToDer(pem) {
  const b64 = pem.replace(/-----[^-]+-----|\n/g, '');
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

async function pemToKeys(privPem, pubPem) {
  const privateKey = await crypto.subtle.importKey('pkcs8', pemToDer(privPem), { name: 'Ed25519' }, true, ['sign']);
  const publicKey = await crypto.subtle.importKey('spki', pemToDer(pubPem), { name: 'Ed25519' }, true, ['verify']);
  return { privateKey, publicKey };
}

async function signWithCryptoKey(privateKey, message) {
  const data = new TextEncoder().encode(message);
  const sig = await crypto.subtle.sign('Ed25519', privateKey, data);
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function verifyWithCryptoKey(publicKey, message, signatureB64) {
  try {
    const data = new TextEncoder().encode(message);
    const sig = Uint8Array.from(atob(signatureB64), c => c.charCodeAt(0));
    return await crypto.subtle.verify('Ed25519', publicKey, sig, data);
  } catch {
    return false;
  }
}

function txCanonical(tx) {
  return [tx.id, tx.from_address || '', tx.to_address, String(tx.amount), tx.type, tx.ref_type || '', tx.ref_id || '', String(tx.timestamp)].join('|');
}

async function txHash(tx) {
  return sha256Hex(txCanonical(tx));
}

async function blockHash(b) {
  return sha256Hex([String(b.index_num), b.prev_hash, b.merkle_root, String(b.timestamp), String(b.nonce)].join('|'));
}

async function merkleRoot(hashes) {
  if (hashes.length === 0) return HASH_ZERO;
  let level = [...hashes];
  if (level.length % 2 === 1) level.push(level[level.length - 1]);
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      next.push(await sha256Hex(level[i] + level[i + 1]));
    }
    level = next;
  }
  return level[0];
}

function genId(len = 16) {
  return Array.from(crypto.getRandomValues(new Uint8Array(len))).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, len);
}

// =============== 创世区块 ===============
async function ensureGenesis() {
  const count = (await dbAll('blocks')).length;
  if (count > 0) return;
  const block = {
    id: genId(16), index_num: 0, prev_hash: HASH_ZERO, merkle_root: HASH_ZERO,
    timestamp: Date.now(), nonce: 0, hash: '', tx_count: 0
  };
  block.hash = await blockHash(block);
  await dbPut('blocks', block);
}

// =============== 系统钱包 ===============
async function getSystemWallet() {
  let address = await metaGet('system_address');
  let privPem = await metaGet('system_private_key');
  let pubPem = await metaGet('system_public_key');
  if (!address) {
    const w = await generateWallet();
    address = w.address; privPem = w.privateKey; pubPem = w.publicKey;
    await metaSet('system_address', address);
    await metaSet('system_private_key', privPem);
    await metaSet('system_public_key', pubPem);
    console.log('[chain] system wallet:', address);
  }
  const cryptoKeys = await pemToKeys(privPem, pubPem);
  return { address, privateKey: privPem, publicKey: pubPem, cryptoKeys };
}

// =============== 出块 ===============
let txPool = [];
let blockTimer = null;

async function createTx({ to_address, amount, type, ref_type, ref_id, note, from_address = null, signerKeys = null }) {
  const tx = {
    id: genId(20),
    from_address,
    to_address,
    amount: Math.floor(amount),
    type,
    ref_type: ref_type || null,
    ref_id: ref_id || null,
    note: note || '',
    timestamp: Date.now(),
    signature: '',
    block_id: null
  };
  let keys = signerKeys;
  if (!keys) {
    const sys = await getSystemWallet();
    keys = sys.cryptoKeys;
  }
  tx.signature = await signWithCryptoKey(keys.privateKey, txCanonical(tx));
  return tx;
}

async function submitTransaction(tx) {
  txPool.push(tx);
  if (txPool.length >= 1) await makeBlock();
  return tx;
}

async function makeBlock() {
  if (txPool.length === 0) return;
  const txs = txPool.splice(0, txPool.length);
  for (const tx of txs) {
    if (tx.from_address) {
      const user = (await dbQuery('users', u => u.wallet_address === tx.from_address))[0];
      if (user && user.publicKey) {
        const { publicKey } = await pemToKeys('', user.publicKey);
        const ok = await verifyWithCryptoKey(publicKey, txCanonical(tx), tx.signature);
        if (!ok) tx._invalid = true;
      }
    }
  }
  const validTxs = txs.filter(t => !t._invalid);
  if (validTxs.length === 0) return;
  const txHashes = await Promise.all(validTxs.map(txHash));
  const mr = await merkleRoot(txHashes);
  const blocks = (await dbAll('blocks')).sort((a, b) => a.index_num - b.index_num);
  const prev = blocks[blocks.length - 1];
  const ts = Date.now();
  const block = {
    id: genId(16),
    index_num: (prev?.index_num ?? -1) + 1,
    prev_hash: prev?.hash || HASH_ZERO,
    merkle_root: mr,
    timestamp: ts,
    nonce: Math.floor(Math.random() * 1e6),
    hash: '',
    tx_count: validTxs.length
  };
  block.hash = await blockHash(block);
  await dbPut('blocks', block);
  for (const tx of validTxs) {
    tx.block_id = block.id;
    await dbPut('transactions', tx);
    const users = await dbQuery('users', u => u.wallet_address === tx.to_address);
    if (users[0]) {
      users[0].total_score = (users[0].total_score || 0) + tx.amount;
      await dbPut('users', users[0]);
    }
  }
}

export function startBlockMaker(intervalMs = 5000) {
  if (blockTimer) return;
  ensureGenesis();
  blockTimer = setInterval(() => {
    makeBlock().catch(e => console.error('[client-chain] makeBlock', e));
  }, intervalMs);
}

// 别名：让 clientChain.startBlockMaker 也能用
const _startBlockMaker = startBlockMaker;

// =============== 对外 API ===============
export const clientChain = {
  async getBalance(address) {
    const txs = await dbAll('transactions');
    let s = 0;
    for (const t of txs) {
      if (t.block_id && t.to_address === address) s += t.amount;
      if (t.block_id && t.from_address === address) s -= t.amount;
    }
    return s;
  },
  async getBlocks(limit = 20) {
    const all = await dbAll('blocks');
    return all.sort((a, b) => b.index_num - a.index_num).slice(0, limit);
  },
  async getBlockTransactions(blockId) {
    return (await dbQuery('transactions', t => t.block_id === blockId)).sort((a, b) => a.timestamp - b.timestamp);
  },
  async getTransactions(limit = 30, address = null) {
    let txs = await dbAll('transactions');
    if (address) txs = txs.filter(t => t.to_address === address || t.from_address === address);
    return txs.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  },
  async getSystemAddress() {
    const w = await getSystemWallet();
    return w.address;
  },
  submitTransaction,
  generateWallet,
  getSystemWallet,
  createTx,
  startBlockMaker
};

export { PROBLEMS, CATEGORIES, getProblemById };
