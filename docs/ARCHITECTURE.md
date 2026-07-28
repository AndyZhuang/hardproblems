# 📐 架构设计

> 适用版本：v1.0.0

## 1. 系统全景

```
                        ┌─────────────────────────────┐
                        │       Browser (React)        │
                        │  ┌──────────────────────┐    │
                        │  │ Pages / Components   │    │
                        │  │ ErrorBoundary        │    │
                        │  └────────┬─────────────┘    │
                        │           │ api.*            │
                        │  ┌────────▼─────────────┐    │
                        │  │ api.js (双模客户端)  │    │
                        │  │ ├ 模式A: HTTP→Server │    │
                        │  │ └ 模式B: IndexedDB   │    │
                        │  └────────┬─────────────┘    │
                        └───────────┼─────────────────┘
                                    │ HTTPS (Nginx)
                        ┌───────────▼─────────────────┐
                        │   Nginx 反向代理 + 静态      │
                        └───────────┬─────────────────┘
                                    │ 127.0.0.1:4000
                        ┌───────────▼─────────────────┐
                        │   Express (Node.js 20)        │
                        │  ┌──────────────────────┐    │
                        │  │ Middleware            │    │
                        │  │ helmet / cors / gzip  │    │
                        │  │ rate-limit / logger    │    │
                        │  └────────┬─────────────┘    │
                        │  ┌────────▼─────────────┐    │
                        │  │ Routes                │    │
                        │  │ /users /problems      │    │
                        │  │ /solutions /leader    │    │
                        │  │ /chain /ai            │    │
                        │  └──┬──────────────┬─────┘    │
                        │     │              │          │
                        │  ┌──▼─────┐  ┌─────▼──────┐  │
                        │  │ db.js  │  │ blockchain │  │
                        │  │ JSON   │  │ .js        │  │
                        │  │ 文件   │  │ Ed25519 +  │  │
                        │  │ 存储   │  │ SHA-256    │  │
                        │  └────────┘  └────────────┘  │
                        └─────────────────────────────┘
                                    │
                        ┌───────────▼─────────────────┐
                        │   data/*.json                │
                        │  blocks / users / txs /...   │
                        └─────────────────────────────┘
```

## 2. 数据流

### 2.1 注册流程

```
Client                Server                db.js              blockchain.js
  │                     │                     │                     │
  │ POST /register      │                     │                     │
  ├────────────────────►│                     │                     │
  │                     │ validate username   │                     │
  │                     │                     │                     │
  │                     │ Users.byUsername    │                     │
  │                     ├────────────────────►│                     │
  │                     │◄───── null ─────────┤                     │
  │                     │                     │                     │
  │                     │ bcrypt.hash         │                     │
  │                     │ generateWallet      │                     │
  │                     ├────────────────────►│ Users.create        │
  │                     │                     │                     │
  │                     │ createTransaction(100 HPW reward)         │
  │                     ├───────────────────────────────────────►  │
  │                     │   sign + add to tx pool                  │
  │                     │                                          │
  │                     │ submitTransaction                       │
  │                     │   → txPool.push(tx)                     │
  │                     │                                          │
  │                     │ startBlockMaker (已起)                  │
  │                     │   每 5 秒 makeBlock()                   │
  │                     │   → 出块时把 tx 上链                     │
  │                     │                                          │
  │ 200 {token, user}   │                     │                     │
  │◄────────────────────┤                     │                     │
```

### 2.2 提交解答流程

```
Client                    Server
  │                          │
  │ POST /api/solutions      │
  │ Authorization: Bearer ... │
  │ { problem_id, content }  │
  ├─────────────────────────►│
  │                          │ requireAuth → verify JWT → Users.byId
  │                          │
  │                          │ AI 评估:
  │                          │   ├ 优先 LLM (solver.js)
  │                          │   └ 回退 启发式评分
  │                          │
  │                          │ Solutions.create
  │                          │ createTransaction(reward) → txPool
  │                          │ forceMakeBlock() (immediate)
  │                          │
  │ 200 { solution, eval }  │
  │◄─────────────────────────┤
```

## 3. 区块链设计

### 3.1 为什么自己实现而不是用以太坊？

- **演示目的**：完整区块链（PoW/PoS）对 demo 来说太重
- **零依赖**：自实现只需 Node `crypto` 模块
- **足够真实**：Ed25519 签名 + SHA-256 哈希 + Merkle root，能演示完整的链结构

### 3.2 区块结构

```javascript
{
  id: 'abc123',         // nanoid(16)
  index_num: 0,         // 0 是创世块
  prev_hash: '0000...',
  merkle_root: 'a7f2...',
  timestamp: 1785000000000,
  nonce: 123456,
  hash: '7c8e...',      // SHA256(index|prev|merkle|ts|nonce)
  tx_count: 1
}
```

### 3.3 交易结构

```javascript
{
  id: 'tx_xxx',
  from_address: 'HPW1...',  // null = 系统铸造
  to_address: 'HPW1...',
  amount: 100,
  type: 'reward',         // reward | transfer | stake
  ref_type: 'solution',   // solution | vote | registration
  ref_id: 'sol_id',
  note: 'Welcome bonus',
  timestamp: 1785000000000,
  signature: 'base64...', // Ed25519
  block_id: 'block_id'    // null = 未上链
}
```

### 3.4 出块逻辑

```
每 5 秒一次：
  1. 收集 txPool
  2. 验签（验证每个 tx 的 Ed25519 签名）
  3. 计算 merkle_root
  4. 算 hash = SHA256(index|prev|merkle|ts|nonce)
  5. Blocks.create(block)
  6. 把 tx 写入 transactions.json + 关联 block_id
  7. 增加接收者 total_score
```

## 4. 存储设计

### 4.1 文件结构

```
data/
├── users.json
├── sessions.json          # 当前未使用，预留
├── solutions.json
├── votes.json
├── transactions.json
├── blocks.json
└── chain_meta.json        # 系统钱包私钥等
```

### 4.2 schema（关键字段）

**users**
```json
{
  "id": "abc",
  "username": "tester",
  "password_hash": "bcrypt$2a$...",
  "wallet_address": "HPW1...",
  "public_key": "-----BEGIN PUBLIC KEY-----\n...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",  // ⚠ demo 存私钥方便 UX，生产应该 client-side 管理
  "bio": "string",
  "avatar": "url",
  "total_score": 1500,
  "created_at": 1785000000000
}
```

**blocks**
```json
{
  "id": "blk_xxx",
  "index_num": 0,
  "prev_hash": "0000...",
  "merkle_root": "a7f2...",
  "timestamp": 1785000000000,
  "nonce": 123456,
  "hash": "7c8e...",
  "tx_count": 1
}
```

## 5. 双模式前端

```javascript
// client/src/lib/api.js
const MODE = import.meta.env.VITE_API_MODE || 'http';

if (MODE === 'indexeddb') {
  // 纯静态：所有数据存浏览器 IndexedDB
  // 用 Web Crypto API 模拟 Ed25519 + SHA-256
} else {
  // 连后端
  fetch(`${API_BASE}/api/...`)
}
```

这让前端既能：
- 连后端跑（生产模式）
- 纯静态部署到 CDN（demo / 离线场景）

## 6. 安全考虑

| 项 | 当前实现 | 生产建议 |
|---|----|----|
| 密码 | bcryptjs (12 rounds) | ✅ 足够 |
| 私钥 | 服务端存 | ❌ 应改为 client-side 管理（MetaMask 等） |
| JWT | HS256 | OK，加 refresh token |
| CORS | `*` | 生产应白名单 |
| Rate limit | 120/min | 调小更安全 |
| HTTPS | 可选 | 生产必须 |
| Helmet | ✅ | OK |
| SQL 注入 | 不存在 | N/A |
| XSS | React 默认 + React 16+ 转义 | 加 CSP |

## 7. 性能

- JSON 文件存储：写入用 50ms 批量 flush；查询为 O(n) 全表扫描
- 适用于 1k 用户、10k solutions 以内
- 超过这个量级：换 SQLite / PostgreSQL

## 8. 演进路线

| 阶段 | 改进 |
|---|----|
| v1.0 (当前) | JSON 存储 + 自实现链 + 双模式前端 |
| v1.1 | SQLite 替换 JSON；私钥移到 client-side |
| v1.2 | 真实 LLM 集成（OpenAI / Anthropic API） |
| v2.0 | 跨链桥接（Polygon / Base L2） |
| v3.0 | 多用户协作 + 评审流程 |
