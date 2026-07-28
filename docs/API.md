# 🔌 API 文档

> 基础 URL：`https://your-domain.com/api`
> 所有响应都是 JSON。
> 错误格式：`{ "error": "message" }`，HTTP 状态码表示错误类别。

## 目录

- [通用](#通用)
- [用户 / 鉴权](#用户--鉴权)
- [问题](#问题)
- [解答](#解答)
- [排行榜](#排行榜)
- [区块链](#区块链)
- [AI](#ai)
- [健康检查](#健康检查)

---

## 通用

### 鉴权

除了 `/register` `/login` `/health` `/version` `/problems` `GET /problems/:id` `GET /chain/*` `/leaderboard` `/categories` `/ai/evaluate` 之外，其他端点都需要 `Authorization: Bearer <token>`。

### 限流

`/api/*` 默认 200 请求/分钟/IP。超过会返回 429。

### 跨域

`CORS_ORIGINS` 配置（默认 `*`）。生产环境务必改为白名单。

---

## 健康检查

### GET /api/health

```bash
curl http://localhost:4000/api/health
```

响应：
```json
{
  "ok": true,
  "time": 1785000000000,
  "env": "production",
  "version": "1.0.0",
  "name": "hardproblems-server",
  "uptime": 3600,
  "pid": 1234,
  "node": "v20.10.0",
  "chain": { "valid": true, "length": 3 },
  "memory": { "rss": 52, "heapUsed": 10, "heapTotal": 11 }
}
```

### GET /api/version

```json
{ "name": "hardproblems-server", "version": "1.0.0", "env": "production" }
```

### GET /api

返回所有端点列表（用于调试）。

---

## 用户 / 鉴权

### POST /api/users/register

注册 + 自动登录 + 送 100 HPW 注册奖励。

请求：
```json
{
  "username": "tester_xiaoming",  // 2-30 字符, 字母数字下划线中文横线
  "password": "test123456",        // 6-200 字符
  "bio": "optional bio"            // 最多 200 字符
}
```

响应 200：
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "abc123",
    "username": "tester_xiaoming",
    "walletAddress": "HPW1...",
    "bio": "",
    "avatar": "",
    "totalScore": 0,
    "balance": 100,
    "createdAt": 1785000000000
  }
}
```

错误：
- `400` 输入校验失败
- `409` 用户名已被占用
- `429` 注册太频繁（15 分钟 30 次）

### POST /api/users/login

请求：
```json
{ "username": "tester_xiaoming", "password": "test123456" }
```

响应 200：同 register

### POST /api/users/logout

需要鉴权。无响应体。

### GET /api/users/me

需要鉴权。返回当前用户信息。

### PATCH /api/users/me

需要鉴权。可更新 `bio`、`avatar`。

### GET /api/users/:username

获取某用户的公开信息。

---

## 问题

### GET /api/problems/categories

返回 8 大学科分类。

```json
{
  "categories": [
    { "id": "mathematics", "name": "数学" },
    { "id": "physics", "name": "物理" },
    ...
  ]
}
```

### GET /api/problems

参数：
- `category` (可选) `mathematics` / `physics` / ...
- `search` (可选) 搜索关键词，匹配 title / titleEn / summary / kid / tags
- `status` (可选) `open` / `partially_solved` / `solved`
- `limit` (可选, 默认 100)

响应：
```json
{
  "total": 64,
  "problems": [
    {
      "id": "millennium-riemann",
      "category": "mathematics",
      "title": "黎曼猜想",
      "titleEn": "Riemann Hypothesis",
      "summary": "素数在自然数中...",
      "difficulty": 5,
      "reward": 5000,
      "status": "open",
      "year": 1859,
      "proposer": "Bernhard Riemann",
      "tags": ["千禧年问题", "数论", "素数"],
      "solutionCount": 0,
      "netVotes": 0
    },
    ...
  ]
}
```

### GET /api/problems/:id

返回问题完整信息（含 `formal`、`whyHard`、`aiPrompt` 等）。

---

## 解答

### GET /api/solutions

参数：
- `problem_id` (可选)
- `user_id` (可选)
- `sort` (可选) `top`（按净票数）/ `new`（按时间）/ `ai`（按 AI 评分）
- `limit` / `offset`

### GET /api/solutions/:id

### POST /api/solutions

需要鉴权。

请求：
```json
{
  "problem_id": "millennium-pvsnp",
  "title": "对 P vs NP 的一点看法",
  "content": "至少 20 字符...",
  "ai_assisted": false,
  "ai_model": ""
}
```

响应 200：
```json
{
  "solution": {
    "id": "sol_xxx",
    "problemId": "millennium-pvsnp",
    "userId": "user_xxx",
    "title": "...",
    "content": "...",
    "aiAssisted": false,
    "aiModel": "heuristic",
    "aiQualityScore": 75,
    "scoreAwarded": 18,
    "createdAt": 1785000000000,
    "txId": "tx_xxx"
  },
  "evaluation": {
    "score": 75,
    "reasoning": "...",
    "strengths": [...],
    "weaknesses": [...],
    "model": "heuristic"
  },
  "reward": 18
}
```

奖励计算：
- 基础：+10 HPW（提交即可）
- 质量奖励：AI 评分 ≥ 60 时，每超 1 分加 `(p.reward / 100) / 2` HPW

### POST /api/solutions/:id/vote

需要鉴权。不能给自己投票。

请求：
```json
{ "value": 1 }   // 1 = upvote, -1 = downvote, 0 = 取消
```

每个 up 票给作者 +5 HPW。

### GET /api/solutions/:id/my-vote

需要鉴权。返回 `{ "value": 0 | 1 | -1 }`。

---

## 排行榜

### GET /api/leaderboard

参数：`category` (可选)、`limit` (默认 100)

响应：
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "id": "user_xxx",
      "username": "tester",
      "wallet": "HPW1...",
      "avatar": "url",
      "bio": "string",
      "totalScore": 5000,
      "solutionCount": 12,
      "netVotes": 48,
      "badges": [
        { "id": "explorer", "name": "探索者", "icon": "🔍", "color": "text-cyan-300" }
      ],
      "createdAt": 1785000000000
    }
  ]
}
```

### GET /api/leaderboard/stats

```json
{
  "users": 100,
  "problems": 64,
  "solutions": 250,
  "transactions": 380,
  "blocks": 76,
  "totalReward": 5000,
  "categories": [
    { "id": "math", "name": "数学", "count": 10, "solved": 3 },
    ...
  ],
  "badges": [ ... ]
}
```

---

## 区块链

### GET /api/chain/info

```json
{
  "blockCount": 76,
  "txCount": 380,
  "totalSupply": 12000,
  "systemAddress": "HPW1...",
  "valid": true,
  "validation": { "valid": true, "length": 76 }
}
```

### GET /api/chain/blocks

参数：`limit` / `offset`

### GET /api/chain/blocks/:id

返回区块 + 关联交易。

### GET /api/chain/transactions

参数：`limit` / `offset` / `address`（按地址过滤）

### GET /api/chain/transactions/:id

### GET /api/chain/balance/:address

```json
{ "address": "HPW1...", "balance": 350, "user": { ... } }
```

### GET /api/chain/address/:address

返回某地址的余额 + 交易历史。

### GET /api/chain/validate

验证整条链的完整性。

---

## AI

### POST /api/ai/solve

需要鉴权。让 AI 帮你解题。

请求：
```json
{ "problem_id": "millennium-pvsnp", "user_input": "用小朋友能懂的方式" }
```

### POST /api/ai/evaluate

让 AI 评估某个解答的质量（无需登录，但调用 LLM 时有限流）。

请求：
```json
{ "problem_id": "millennium-pvsnp", "content": "解答内容..." }
```

---

## 错误码

| 状态码 | 含义 |
|---|---|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未登录 / token 无效 |
| 404 | 资源不存在 |
| 409 | 冲突（如用户名重复） |
| 429 | 限流 |
| 500 | 服务器内部错误 |

所有错误响应体：
```json
{ "error": "可读的提示" }
```
