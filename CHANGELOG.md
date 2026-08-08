# Changelog

All notable changes to HardProblems.World are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2026-08-08

### 🤝 E 阶段 — 协作：讨论 + 路线图 + 团队

**让硬问题变成集体活动**：每个问题有讨论区、路线图时间线、协作团队。

### Added

#### 后端 3 大模块

- **Discussions**（`/api/discussions`）— 顶层帖 + 单层回复 + up/down 投票
  - `GET ?problem=xxx` 列表（含回复聚合 + 当前用户视角的 myVote）
  - `POST { problemId, content, parentId? }` 创建（顶层或回复）
  - `PATCH /:id` / `DELETE /:id` 仅作者
  - `POST /:id/vote { value: 1|-1|0 }` 投票（不能给自己投票）
  - 删顶层帖时连带删除回复
- **Roadmap**（`/api/roadmap`）— 时间线条目 + 6 种状态 + 5 种 emoji 反应
  - 6 种状态：`proposed` / `exploring` / `in_progress` / `breakthrough` / `blocked` / `done`
  - 5 种反应：`👍 like` / `🔥 fire` / `💡 bulb` / `🚀 rocket` / `👀 eyes`
  - 同一反应二次点击 = 取消
- **Teams**（`/api/teams`）— 协作团队 + 成员角色 + 贡献聚合
  - 6 种角色：`leader` / `mentor` / `researcher` / `engineer` / `student` / `observer`
  - 队长自动加入、不可退出（需先解散）
  - 成员按角色排序（leader 优先）
  - GET /:id 返回 contributions 列表（每人解答数 + 总积分）

#### 前端 4 个组件

- `DiscussionSection.jsx` — 线程式回复、投票按钮、登录提示、编辑/删除
- `Roadmap.jsx` — 时间线 + 状态徽章 + emoji 反应行 + 状态切换下拉
- `Teams.jsx` — 问题选择器 + 团队卡片网格 + 创建表单
- `TeamDetail.jsx` — 团队头部 + 成员列表（带角色图标）+ 贡献表
- 嵌入到 `ProblemDetail`：DiscussionSection、Roadmap + "想组队？"入口
- 新路由：`/teams`、`/teams/:id`
- 顶栏新增"团队"导航入口
- 协作专属 CSS（~360 行）

#### 数据层

- `db.js` 新增 7 张 JSON 表：`discussions` / `discussion_votes` / `roadmaps` / `roadmap_reactions` / `teams` / `team_members`
- 6 个查询 helper：`topLevelByProblem` / `repliesOf` / `byDiscussionAndUser` / `countFor` / `byRoadmapAndUser` / `countByTeam`
- `localImpl`（IndexedDB）镜像全部方法（DB_VERSION 1 → 2）
- IndexedDB 新增 6 个 store + 6 个复合索引（`discussion_user`、`roadmap_user`、`team_user` 等）
- 前端支持 server + local 双模式

#### i18n

- 4 语言包（zh-CN / en-US / es-ES / ja-JP）各加 47 条协作文案
- 顶栏 `nav.teams` 多语言翻译

### Fixed

- 时间格式化 `timeAgo()` 加防御（处理 undefined/NaN，避免 `RangeError: Invalid time value`）
- server 返回统一 camelCase（前端期望 `createdAt` 不是 `created_at`）

### Tests

- `test_collab.cjs` — 后端 56 项断言全过（discussions 17 / roadmap 13 / teams 23 / 跨用户 3）
- `test_collab_browser.cjs` — 前端 7 步全过（注册、UI 渲染、创建讨论、创建路线图、emoji 反应、Teams 页面、创建团队跳转）
- 总测试 56+7 = 63 项

### Build

- main bundle: 470 KB（gzip 177 KB）+ 协作 CSS 8 KB
- WalletButton 仍 lazy: 300 KB（gzip 92 KB）
- 模 块 数 1273

## [1.3.1] - 2026-08-08

### 🌐 D 阶段收尾 — 多语言问题内容（Top 10 + 基础设施）

**给最知名的 10 道题加了完整英文翻译**（summary/kid/formal/whyHard/aiPrompt 各字段），其他 191 题在英文 UI 下自动 fallback 到中文。

### Added - 10 题完整英文翻译

| 题目 | 英文标题 | 类别 |
|---|---|---|
| `millennium-riemann` | Riemann Hypothesis | Math |
| `millennium-pvsnp` | P versus NP | CS/Math |
| `millennium-yangmills` | Yang-Mills Existence & Mass Gap | Physics |
| `millennium-navierstokes` | Navier-Stokes Regularity | Math |
| `millennium-hodge` | Hodge Conjecture | Math |
| `millennium-bsd` | Birch & Swinnerton-Dyer | Math |
| `twin-primes` | Twin Prime Conjecture | Math |
| `goldbach` | Goldbach's Conjecture | Math |
| `collatz` | Collatz Conjecture (3n+1) | Math |
| `fermat-catalan` | Fermat-Catalan Conjecture | Math |

### Changed - Schema 扩展（向后兼容）

每个问题增加 5 个可选字段：
- `summaryEn` / `kidEn` / `formalEn` / `whyHardEn` / `aiPromptEn`

**前端行为** (`ProblemDetail.jsx`):
- 切到 `en-US` 时，UI 优先用 `*En` 字段
- 没有 `*En` 的题自动 fallback 到中文 + 顶部显示英文 title
- 搜索框同时支持中文 + 英文（`searchProblems` 已加 `*En` 匹配）

**AI 行为** (`server/src/ai/solver.js`):
- `buildRAGContext` 返回所有字段（中文 + 英文）
- `buildChatSystemPrompt(lang='en-US')` 优先用 `*En` 字段构造 system prompt
- LLM 真实可用时，按用户语言回答（用 `*En` 字段的英文）

**生成器** (`deploy/gen_problems.py` + `gen_problems_js.py`):
- 字段列表加入 `summaryEn`, `kidEn`, `formalEn`, `whyHardEn`, `aiPromptEn`
- 搜索过滤加入 `summaryEn` / `kidEn`

### Tests

- `test_english_content.cjs` (新): 12/12 passed (3 题 × 4 断言：标题中英 + kid/formal 英文)
- `e2e_v1.2.cjs`: 8/8 passed (回归)
- `test_chat.cjs`: 14/14 passed (回归)
- `test_i18n_chat.cjs`: 6/6 passed (回归)
- HPW 合约: 17/17 passed (回归)

### Bundle

- Main: 427 KB JS + 36 KB CSS (gzip 166 + 7)
- WalletButton chunk: 300 KB (按需加载)
- 增加 ~10KB 给英文字段（每个 add 块 +5 字段，201 题 +9KB 平均）

### Deploy

- mcode: https://...mcode.cn
- ZIP: `releases/hardproblems-v1.3.1-source-20260808043156.zip` (982 KB, 152 files)
- Top 10 problems 已英文化；其余 191 题用户切到 en-US 仍看中文（可后续批量补）

### TODO

批量翻译剩余 191 题的英文（需要 LLM API 可用，或者人工逐题处理）

## [1.3.0] - 2026-08-08

### 🎉 A + C + D 三方向大版本

**A: 智能 AI 解题 + 评估**
**C: HPW 真链集成（Base L2）**
**D: 4 语言国际化（zh-CN / en-US / es-ES / ja-JP）**

### Added - A: AI 多轮对话 + 严格 5 维 Rubric 评估

**多轮对话** (`POST /ai/chat`):
- 完整对话历史保持，支持追问/反驱/要求举例/要求简化
- 每轮显示「第 N 轮」标签 + 来源 (LLM / 启发式回退)
- RAG 上下文注入：自动拉取问题的 kid/formal/whyHard/aiPrompt + 3 个相关问题作为参考
- 离线模式 (localAIchat) 完整可用，无需后端

**5 维 Rubric 评估** (`POST /ai/evaluate`):
- 5 个独立维度，每维 0-20 分：accuracy / depth / originality / rigor / clarity
- 总分 0-100，附 strengths / weaknesses / verdict
- 启发式回退版按相同维度打分

**前端 UI** (ProblemDetail.jsx):
- 聊天气泡布局：用户（右）/ AI（左）
- 4 个快捷问题按钮（"用 8 岁能懂的话解释"等）
- Ctrl/Cmd+Enter 发送
- "📋 复制最后一轮到提交框" 快捷操作
- 5 维评估明细卡片：进度条 + 分值 + 优势/不足
- "📊 5 维评估" 按钮（提交前预览分数）

### Added - C: HPW 真链集成（Base Sepolia）

**HPW ERC-20 合约** (`contracts/src/HPW.sol`):
- 标准 OpenZeppelin v5 ERC-20
- Cap: 1B HPW (1,000,000,000 * 10^18)
- `reward(to, amount, reason)` 单笔 mint
- `rewardBatch(recipients[], amounts[], reason)` 批量 mint
- `setRewardMinter()` owner 切换 minter
- `rescueTokens()` owner 提取误转 ERC20
- Reward / RewardMinterUpdated 事件

**部署基础设施**:
- Hardhat 配置: Base Sepolia (testnet) + Base mainnet + 本地 hardhat 网络
- `contracts/scripts/deploy.cjs` 部署 + Basescan 验证
- `contracts/indexer.cjs` 监听链上事件同步到 `data/chain/indexed.json`
- 17 单元测试覆盖部署 / reward / cap / batch / setRewardMinter / 标准 ERC20

**前端 MetaMask 集成**:
- `useWallet` hook: Viem 2.x + EIP-1193 wallet API
- `WalletButton` 组件: 4 状态 (无 MetaMask / 未连接 / 已连接 / 链不对)
- 按需懒加载 (viem 300KB 单独 chunk)
- 自动保存 wallet 地址到 user profile
- HPW 余额实时显示

**服务端链上奖励** (`server/src/hpw.js`):
- 检测 HPW_ADDRESS + REWARD_MINTER_KEY 环境变量
- 提交解答时自动触发链上 mint
- graceful fallback: 未配置时仅链下记账
- `GET /api/hpw/status` 端点暴露合约状态

### Added - D: 国际化（4 语言）

**支持语言**:
- 🇨🇳 zh-CN (简体中文，默认)
- 🇺🇸 en-US (English)
- 🇪🇸 es-ES (Español) - **新**
- 🇯🇵 ja-JP (日本語) - **新**

**自动检测**:
- navigator.language → 优先匹配 (zh → zh-CN, es → es-ES, ja → ja-JP, 其他 → en-US)
- localStorage 记忆用户上次选择

**AI 跟语言** (D3):
- `chatProblem({ problemId, messages, lang })` 接受 lang 参数
- 系统 prompt 包含 `请用中文回答` / `Please respond in English` 等指令
- 4 语言完整模板 (zh-CN / en-US / es-ES / ja-JP) 用于离线启发式回退
- 在线 LLM 也按用户语言回答

### Tech

- viem 2.55 (Ethereum 库，按需懒加载)
- ethers 6.13 (Node 端用)
- @openzeppelin/contracts 5.0
- hardhat 2.22 + @nomicfoundation/hardhat-toolbox 5.0
- @nomicfoundation/hardhat-toolbox 含 chai / ethers / hardhat-network-helpers

### Tests

- e2e_v1.2.cjs: 8/8 passed
- test_chat.cjs: 14/14 passed (多轮对话 + 5 维评估)
- test_i18n_chat.cjs: 6/6 passed (4 语言 AI 聊天)
- test_register_browser.cjs: passed (TDZ 修复持续有效)
- HPW 合约测试: 17/17 passed

### Bundle

- Main: 418 KB JS + 36 KB CSS (gzip 162 KB + 7 KB)
- WalletButton (lazy): 300 KB (gzip 92 KB)
- HPW ABI: 1 KB

### Deploy

- mcode: https://space.mcode.cn (deploy 后)
- ZIP: `releases/hardproblems-v1.3.0-source-<ts>.zip`
- 合约测试通过 (17/17)
- 合约实际部署到 Base Sepolia 需要 testnet ETH（文档在 `contracts/README.md`）

## [1.2.2] - 2026-08-07

### 🗑 Removed - 用户提交问题模块 (Contribute)

**删除 `/contribute` 页面 + 全部相关代码**：
- ❌ `client/src/pages/Contribute.jsx` (已归档到 `_archive/`)
- ❌ 路由 `<Route path="contribute" />`
- ❌ 导航栏 `+ 提交问题` 链接
- ❌ i18n 键 `nav.contribute` (zh-CN + en-US)
- ❌ 前端 `api.contributeProblem()` + `localAIcontribute()` 启发式 (90 行)
- ❌ 后端 `POST /ai/contribute` 路由 (90 行)
- ❌ `EXPLICIT_ROUTES` 中的 `/ai/contribute` 项

**侧边栏改造**：
- 详情页右下「推荐一个类似问题」卡片 → 改为「分享这道硬问题」卡片
- 调用 `navigator.share()` (Web Share API) / fallback 到剪贴板

**Bundle 体积**: 414 KB → 399 KB JS (节省 15 KB)
**模块数**: 59 → 58

### Why

用户反馈：把硬问题列表的"质量门控"交还给维护者，避免质量参差；专注 AI 解答 + 链上积分这条主线。

## [1.2.1] - 2026-07-30

### 🐛 Critical Fix + 内容强化

**v1.2.0 注册时偶发 "Cannot access 'y' before initialization" 错误的根因修复 + formal 字段全面强化。**

### Fixed - TDZ 错误（v1.2.0 遗留）

**问题**：`/users/register` 等显式路由在打包后偶发抛出 "Cannot access 'X' before initialization"
（X 是 minifier 压缩后的单字母变量名，可能是 y/m/z/z 等）。

**根因**：`client/src/lib/api.js` 的 `localRoute()` 函数中，`const localApi = {...}` 
虽然源码在 `EXPLICIT_ROUTES` 检查之前声明，但 Vite 的 esbuild minifier 看到 
`let resource, _id` 只在闭包内被引用，就把它们上提；又把 `localApi` 块和后续的 
`const method/body/params` 合并下移。结果是：
```js
const EXPLICIT_ROUTES = {...};
if (EXPLICIT_ROUTES[cleanPath]) return localApi[...];  // ❌ localApi 还在 TDZ
// ...
let resource, _id;  // ← 被 minifier 上提
const method, body, params, localApi = {...};  // ← 被 minifier 下移合并
```

**修复**（minifier-safe 重构）：
- 把 `let _id` 改成 `_state` mutable object (`const _state = { resource, id }`)
- 预解析 `path.split('/')` 在函数顶部，闭包只读 `const` 变量
- `localApi` 现在只依赖 `const` 变量 + `const _state` 属性访问，minifier 无论怎么重排都不会触发 TDZ
- 删除了 `let resource, _id` 模式

**文件**: `client/src/lib/api.js`（localRoute 函数完全重写）

### Removed - 政治敏感问题 (5 → 3)

- ❌ `drug-policy` (禁毒) — v1.2.0 已移除
- ❌ `terrorism` (恐怖主义) — v1.2.0 已移除
- ❌ `criminal-justice` (刑事司法改革) — v1.2.1 移除
- ❌ `indigenous-rights` (原住民权利) — v1.2.1 移除
- ❌ `misinformation` (打击虚假信息) — v1.2.1 移除

**新增 3 个更安全的问题**:
- ✅ `data-privacy` (数据隐私保护) — 差分隐私 + 同态加密 + TEE
- ✅ `aging-population` (人口老龄化) — HALE 指标 + 养老金替代率
- ✅ `digital-divide` (数字鸿沟) — ITU IDI 指数 + 公平接入

**净问题数**: 203 → 201 (5 移除 + 3 新增)

### Changed - 全面强化 formal 字段

**问题**: 60+ 个问题的 `formal`（严格陈述）字段过于简单（仅 "> X metric" 形式），缺乏可证伪/可测量性。

**修复**: 批量重写 100 个 formal 字段，按类别分模板：
- **物理 (5)**: 加入公式 / 可观测量 / 可证伪判据 (e.g. `m_h = 125.1 GeV` vs `m_Pl = 10^17` 17 个数量级差距)
- **化学 (13)**: 转化率 / TOF / 法拉第效率 / 能耗 + 表征方法 (XRD/XPS/operando XAS)
- **生物 (13)**: 实验设计 (对照组/样本量/读数/验证) + 临床标准
- **计算机 (11)**: 复杂度 / 渐近 / 基准 / 对抗鲁棒性 (e.g. `TOPS/W`, `TPS`, `ε-差分隐私`)
- **哲学 (18)**: 问题 → 可测试假说 + 操作化 (e.g. "Trolley 跨文化 r ≥ 0.8", "fMRI 前扣带皮层激活")
- **工程 (22)**: 规格 + 容差 + 失效模式 + 验证协议 (e.g. `T_m ≥ 50°C`, `M ≤ 3.0 地震`, `循环 1000 次`)
- **社会 (20)**: 量化指标 + 测量方法 + 反事实 (e.g. `WHO UHC ≥ 80`, `WEF Gender Gap ≥ 0.9`)

**示例**:
- `criminal-justice` 旧: `> 监禁率 < 150/10 万、再犯率 < 30%。`
  → `refugee` 新: `联合国难民署年安置需求满足率 ≥ 80%、第一年安置国家 ≥ 40 个且分配公平 (σ/μ ≤ 0.3)、难民 5 年内经济自给率 ≥ 70%、身心健康指标 (WHO-5) ≥ 对照人群 90%。`
- `quantum-internet` 旧: `实现可扩展、长距离、容错的量子网络。`
  → 新: `多节点量子网络：≥ 1000 节点纠缠分发、保真度 F ≥ 0.9、距离 ≥ 1000 km、延迟 < 100 ms、且对节点故障有鲁棒错误纠正。`

**文件**: `deploy/gen_problems.py` (201 个 add() 调用，100 个 formal 强化)

### Tech

- `client/src/lib/problems.js` + `server/src/data/problems.js` — 重新生成 (201 题)
- `client/index.html` — title/description 203 → 201
- `deploy/gen_problems.py` — 含全部 201 题 + 强化 formal

## [1.2.0] - 2026-07-30

### 🎉 HardProblems 三大升级: 200+ 题库 + 视频介绍 + 用户贡献

**从 64 题扩展到 203 题；每个问题增加视频介绍和参与方式；新增用户提交问题流程。**

### Added - 内容升级 (200+)

**问题数量 64 → 203** (`server/src/data/problems.js`, `client/src/lib/problems.js`)
- 数学 10 → 27 (新增 abc/beal/fermat-catalan/Erdős-Straus/odd-perfect/Mertens/Cramér 等)
- 物理 10 → 24 (新增 hierarchy/strong-CP/measurement/cosmological-constant/arrow-of-time/vacuum-decay/neutrino-mass 等)
- 化学 5 → 26 (新增 perovskite/Li-air/biocatalyst/self-healing/MOF/green-chem 等)
- 生命科学 8 → 25 (新增 microbiome/gene-drive/microbiome/epigenetics/universal-flu/HIV-cure 等)
- 计算机 7 → 25 (新增 crypto-scale/consensus/privacy-ml/AI-code/AI-math/self-improve-ai 等)
- 哲学 6 → 25 (新增 personal-identity/epistemology/truth/beauty/time/punishment/trolley 等)
- 工程 11 → 26 (新增 nuclear-waste/asteroid-mining/floating-city/earthquake-pred/self-healing-infra 等)
- 社会 7 → 25 (新增 UBI/digital-democracy/AI-governance/remote-work/climate-migration 等)
- 数据生成器: `deploy/gen_problems.py` (可重跑生成)

**每个问题新增字段**:
- `videoUrl`: YouTube embed URL
- `videoTitle` / `videoChannel`: 视频元数据
- `participate`: 数组 `{type, label, desc}` — 用户能用什么方式参与

**参与方式字典** (18 种):
- solve, code, experiment, data, survey, discuss, prototype, community, citizen-science, kid-project, visualize, model, analyze, essay, team, translate, teach, fund
- 每种有独立 icon / color / 背景 / 描述

### Added - 用户提交问题 (Contribute)

**新页面 `/contribute`**
- 4 步流程：粗略输入 → AI 扩展 → 审核编辑 → 提交待审核
- 启发式 fallback (浏览器模式无 LLM 时也能生成结构化问题)
- 本地 localStorage 保存待提交列表 (刷新不丢)
- 一键复制 JSON 提交到管理员

**新 API 端点**: `POST /ai/contribute` (server-side, 用 LLM 扩展 + fallback)
- 已加在 `client/src/lib/api.js` 的 dual-mode (浏览器/服务器都支持)

### UI 升级

**ProblemDetail** (`client/src/pages/ProblemDetail.jsx`)
- 顶部 YouTube 视频 iframe 嵌入 (16:9 自适应)
- "我能怎么参与？" 卡片网格 (按 participate 渲染)
- 侧边栏新增 "推荐一个类似问题" → 引导到 Contribute

**Contribute** (`client/src/pages/Contribute.jsx`) - 新文件
- 4 步进度条
- 学科选择 + 附加要求 textarea
- AI 扩展按钮 (loading 状态)
- 完整审核表单 (title/titleEn/summary/kid/formal/whyHard/aiPrompt/tags/videoUrl/participate)
- 参与方式 18 项 chip 选择 (最多 6)
- 提交后保存到 localStorage, 列出 + 编辑/复制/删除

**导航** (`client/src/components/Layout.jsx`)
- 新增 "提交问题" 链接 (zh-CN) / "Contribute" (en-US)

### Bug Fixes

- **路由正则 bug**: `\w` 不包含 `-` 导致 `/problems/beal-conjecture` 被截成 `/problems/beal` —— 改成 `[\w-]+`
- **首页/NotFound 硬编码 64**: 改成 `PROBLEMS.length` 动态读取

### i18n

- 导航栏新增 `nav.contribute` (zh-CN: 提交问题 / en-US: Contribute)
- Contribute 页面预留 i18n (下一步)

### Generator Scripts

- `deploy/gen_problems.py` — Python 源数据 (200+ 问题 + 18 种参与方式)
- `deploy/gen_problems_js.py` — 把 Python 数据转成 JS

### Testing

- `e2e_v1.2.cjs`: 12/12 通过
  - Home: 203 problems displayed ✅
  - Problems list: 203 cards ✅
  - Problem detail: 黎曼猜想 ✅ + video + participate ✅
  - Contribute: 流程跑通 + AI 生成 ✅
  - i18n: 中/英 切换 ✅
  - Chain / Leaderboard: 正常 ✅

### Files Changed

- `client/src/App.jsx` — 新增 /contribute 路由
- `client/src/components/Layout.jsx` — 新增提交问题 nav
- `client/src/lib/api.js` — 修复路由正则, 新增 contributeProblem + contribute 本地方法
- `client/src/lib/problems.js` — 203 problems (新生成)
- `client/src/lib/locales/{zh-CN,en-US}.js` — 新增 nav.contribute
- `client/src/pages/Home.jsx`, `Problems.jsx`, `NotFound.jsx` — 用 PROBLEMS.length 替代硬编码
- `client/src/pages/ProblemDetail.jsx` — 新增视频 + 参与 + 提交入口
- `client/src/pages/Contribute.jsx` — 新文件
- `client/index.html` — title/description 改 203
- `server/src/data/problems.js` — 同步 203 problems
- `server/src/routes/ai.js` — 新增 /ai/contribute
- `deploy/gen_problems.py`, `deploy/gen_problems_js.py` — 新生成器

## [1.1.0] - 2026-07-29

### Added - PWA & i18n

**PWA (Progressive Web App)**
- `manifest.webmanifest` with 8 icon sizes (72/96/128/144/152/192/384/512) + shortcuts
- Service Worker (`/sw.js`) with strategy:
  - HTML navigations: Network First, fallback to `/offline.html`
  - Static assets (`/assets/`, `/icons/`): Cache First
  - API: Network Only (never cache on-chain data)
- Custom offline page with brand styling
- `usePWA()` hook: install prompt, online/offline, SW update detection
- `PWABanner` component: install prompt + update prompt + offline indicator
- Apple touch icon + mobile-web-app-capable + theme-color
- PWA icon generated via `image_synthesize` (brain + atom + blockchain block design)

**i18n (Internationalization)**
- Self-implemented i18n (no external dependency)
- 2 languages: `zh-CN` (Simplified Chinese, default) + `en-US` (English)
- Auto-detection from `navigator.language`
- LocalStorage persistence (`hpw.lang` key)
- `LangSwitcher` component (dropdown in header)
- 100+ translation keys covering: nav, home, problems, problem detail, submit, leaderboard, chain, auth, notFound, pwa, categories
- Formatted strings with placeholders (`{n}`, `{name}`)
- Fallback to key when translation missing

**Mobile responsive**
- Header collapses to hamburger menu on small screens
- Stats grid: 4 cols → 2 cols on mobile
- All forms, buttons, cards adapt
- Tested on 390x844 (iPhone 12 Pro) viewport

### Performance & Quality

- Production build: **265KB JS** (gzip 103KB) + **32KB CSS** (gzip 6KB) + 18 resources
- FCP: **1.1s** on cold load (excluding blocked Google Fonts CDN)
- DOMContentLoaded: **707ms**
- API responses: **< 20ms** (after V8 warmup)
- 18 PWA precached resources
- 89 files in source ZIP, 300KB packed

### Testing
- `e2e_test_v2.cjs`: 38 assertions across 11 test sections
  - Health check, data integrity (64 problems, 8 categories, 7 badges)
  - Register/login flow with wallet generation
  - Solution submission with AI evaluation
  - Voting system
  - Leaderboard with badges
  - Chain validation
  - UI rendering on 5 pages (no React errors)
  - PWA checks (SW, manifest, theme-color, viewport)
  - i18n switch (zh ↔ en)
  - Mobile responsive
- `perf_audit.cjs`: 15 checks (performance, security, SEO, a11y)
  - All security headers (helmet, X-Powered-By hidden)
  - gzip compression (verified on /api/problems)
  - SEO meta (title, description, og, twitter)
  - Accessibility (html lang, button labels, img alts)

### Fixed
- React error #31 (Objects as React child): refactored step arrays to use unique key names (`n`, `title`, `desc` instead of `i`, `t`, `d` which conflicted with i18n import shadowing)
- PWA banner mobile: removed duplicate "Install" text
- Description meta length: expanded to 80 chars for better SEO

## [1.0.0] - 2026-07-29

### 🎉 First Production Release

**HardProblems.World 正式产品化发布。** 8 大领域 64 个世界级硬问题，链上积分奖励，AI 助手。

### Added

#### Backend
- Express 4 + ESM 模块化
- 自实现轻量级区块链：Ed25519 钱包 + SHA-256 哈希链 + Merkle tree
- 每 5 秒自动出块
- JSON 文件存储（零外部依赖）
- JWT (HS256) 鉴权 + bcryptjs 密码哈希
- helmet / cors / compression / express-rate-limit / cookie-parser
- pino 风格轻量 logger
- 启动 banner + 健康检查端点（uptime/pid/memory/version/chain）
- 优雅关闭（SIGTERM/SIGINT）
- 完整 RESTful API：users / problems / solutions / leaderboard / chain / ai
- 输入验证 + 限流 + 错误统一响应

#### Frontend
- React 18 + Vite 5 + React Router 6 + Tailwind CSS 3
- 7 个页面：Home / Problems / ProblemDetail / Leaderboard / Chain / Auth / Profile / NotFound
- ErrorBoundary（友好错误兜底）
- Loading 组件 + 卡片骨架屏 + 列表骨架屏
- 动态 SEO meta（useDocumentTitle hook）
- 路由切换自动滚顶
- 双模式 API 客户端：HTTP 模式 / IndexedDB 模式（纯静态部署）
- 浏览器内 Web Crypto API 降级

#### Content
- 64 个硬问题（8 大领域）：
  - 数学 10 题（千禧年、希尔伯特）
  - 物理 10 题（杨-米尔斯、规范场、暗物质）
  - 化学 5 题（高温超导、催化剂）
  - 生命科学 8 题（意识、衰老、神经）
  - 计算机 7 题（P vs NP、深度学习理论）
  - 哲学 6 题（意识、价值、规范）
  - 工程 11 题（聚变、电池、太空电梯）
  - 社会 7 题（贫富、幸福、AGI 安全）
- 7 阶徽章系统：🌱 新手 → 👑 传奇
- 每个问题含：kid 版（小朋友能懂）/ formal（严格陈述）/ whyHard（为什么难）/ aiPrompt（AI 指令）

#### AI
- 统一 AI 评估器（评估解答质量）
- AI 求解器（按学科 prompt 模板）
- 启发式评分回退（无 LLM API 也能跑）
- 子进程调用 + 90s 超时

#### DevOps
- Docker 多阶段构建（基于 node:20-alpine，~150MB 最终镜像）
- docker-compose.yml（持久化数据 / 日志 / 健康检查）
- 阿里云 / 腾讯云 ECS 一键部署脚本（deploy/deploy.sh）
  - 自动装 Node 20 / Nginx / certbot / ufw / fail2ban
  - systemd 服务单元（自动重启、安全加固）
  - Nginx 反向代理 + gzip + 静态缓存
  - Let's Encrypt 自动 HTTPS
  - UFW 防火墙自动配置
- 备份脚本（7 天保留 + 可选 OSS 上传）
- 日志轮转（logrotate）
- 健康监控（一次性 / 持续 / cron）
- 高级告警（飞书 / 钉钉 / 邮件）
- 卸载脚本（保留数据 / 彻底删除）

#### Documentation
- README.md（快速开始 + 项目结构）
- docs/ARCHITECTURE.md（架构 + 数据流 + 安全考虑 + 演进路线）
- docs/DEPLOY.md（三种部署方式详解）
- docs/API.md（完整 API 参考 + 错误码表）
- docs/OPS.md（运维手册 + 故障排查 + 容量规划）
- deploy/README.md（一键部署 + 日常运维）

### Quality Metrics
- ✅ 后端：1 个进程，~50MB 内存，< 1ms 平均响应
- ✅ 前端：265KB JS（gzip 97KB）+ 31KB CSS（gzip 6KB）
- ✅ Docker 镜像：~150MB
- ✅ E2E 测试通过：注册 → 提交 → 出块 → 排行 → 链
- ✅ 健康检查：实时显示 uptime/pid/memory/链状态
- ✅ 零外部依赖：单进程 + JSON 文件

[1.0.0]: https://github.com/your/hardproblems/releases/tag/v1.0.0
