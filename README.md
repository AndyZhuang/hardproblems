# 🌍 HardProblems.World

> **用 AI 解决 8 大学科 64 个世界级硬问题，链上积分奖励。**

一个开源的协作平台。任何人（尤其是小朋友）都可以针对世界级的硬问题提交自己的解答，借助 AI 助手获得详细解释；每一次提交、点赞都会在自实现的轻量级区块链上记录并发放 HPW 积分奖励。

🌐 **线上 Demo**：https://95homq8olzln7.space.mcode.cn

---

## ✨ 核心特性

| 模块 | 描述 |
|----|----|
| 🧠 **64 个硬问题** | 8 大学科：数学 / 物理 / 化学 / 生命科学 / 计算机 / 哲学 / 工程 / 社会 |
| 🤖 **AI 助手** | 一键调用 LLM 生成符合科研规范的解答，含启发式回退 |
| ⛓️ **链上积分** | 自实现 Ed25519 + SHA-256 + Merkle 区块链，每 5 秒自动出块 |
| 🏆 **7 阶徽章** | 从 🌱 新手到 👑 传奇，按分数 + 解答数发放 |
| 🔐 **零外部依赖** | 无需 MySQL / Redis；JSON 文件存数据，单进程跑通 |
| 📦 **一键部署** | Docker / systemd / Nginx / Let's Encrypt 全套脚本 |

---

## 🚀 5 分钟跑起来

### 方式 A：本地开发（Windows / macOS / Linux）

```bash
# 1. 克隆
git clone https://github.com/you/hardproblems.git
cd hardproblems

# 2. 一键启动
./start.sh         # Linux / macOS
start.bat          # Windows
```

`start.sh` 会自动：
- 装 server + client 依赖
- 跑前端构建
- 启动后端（http://localhost:4000）

### 方式 B：Docker

```bash
cp .env.docker.example .env
# 编辑 .env 填 JWT_SECRET 等

docker compose up -d --build
docker compose logs -f
```

访问 http://localhost:4000

### 方式 C：阿里云 / 腾讯云 ECS 一键部署

```bash
# 本机打包
tar -czf hardproblems-v1.0.0.tar.gz \
  --exclude=node_modules --exclude=client/dist --exclude=data --exclude=.git \
  --exclude=screenshots --exclude=*.log \
  .

# 上传
scp hardproblems-v1.0.0.tar.gz root@your-server:/tmp/hardproblems.tar.gz

# 服务器上（Ubuntu 22.04）
ssh root@your-server
cd /opt && tar -xzf /tmp/hardproblems.tar.gz -C hardproblems
cd /opt/hardproblems
sudo bash deploy/deploy.sh --domain yourdomain.com --email you@example.com
```

详见 [deploy/README.md](./deploy/README.md)

---

## 🧱 技术栈

**后端**
- Node.js 20 + Express 4
- JSON 文件存储（自实现轻量 ORM）
- Ed25519 钱包 + SHA-256 链 + Merkle Tree（自实现）
- JWT 鉴权（HS256）
- helmet + compression + express-rate-limit
- pino 风格轻量 logger

**前端**
- React 18 + Vite 5 + React Router 6
- Tailwind CSS 3（深色 + 渐变）
- Web Crypto API（浏览器内降级方案：纯静态也能跑）
- ErrorBoundary + SEO meta + 404 兜底

**运维**
- Dockerfile（多阶段，~150MB 最终镜像）
- docker-compose.yml
- systemd unit + Nginx 反向代理
- Let's Encrypt 自动 HTTPS
- logrotate + 备份脚本 + 监控告警（飞书/钉钉/邮件）

---

## 📁 项目结构

```
hardproblems/
├── client/                  # React 前端
│   ├── src/
│   │   ├── pages/           # 7 个页面：Home/Problems/Detail/Leaderboard/Chain/Auth/Profile
│   │   ├── components/      # Layout/ProblemCard/ErrorBoundary/Loading/ScrollToTop
│   │   ├── hooks/           # useAuth / useDocumentTitle
│   │   └── lib/             # api.js (双模客户端) / chain.js (浏览器链) / problems.js / badges.js
│   ├── index.html
│   └── vite.config.js
├── server/                  # Node 后端
│   ├── src/
│   │   ├── index.js         # Express 入口
│   │   ├── config.js        # 环境配置
│   │   ├── logger.js        # 日志
│   │   ├── auth.js          # JWT
│   │   ├── db.js            # JSON 存储
│   │   ├── blockchain.js    # 自实现链
│   │   ├── ai/solver.js     # LLM + 启发式回退
│   │   ├── data/problems.js # 64 题目 + 8 学科 + 7 徽章
│   │   └── routes/          # users / problems / solutions / leaderboard / chain / ai
│   └── package.json
├── data/                    # 链上数据（git ignored）
├── deploy/                  # 一键部署 + 运维脚本
│   ├── deploy.sh            # 阿里云/腾讯云一键部署
│   ├── uninstall.sh
│   ├── backup.sh            # 数据备份（7 天保留）
│   ├── rotate-logs.sh       # 日志轮转
│   ├── monitor.sh           # 健康监控
│   ├── healthcheck.sh       # 高级告警（飞书/钉钉/邮件）
│   └── hardproblems.logrotate
├── Dockerfile
├── docker-compose.yml
├── README.md
└── docs/                    # 详细文档
    ├── ARCHITECTURE.md
    ├── DEPLOY.md
    ├── API.md
    └── OPS.md
```

---

## 🔧 常用命令

```bash
# 后端
cd server
npm run dev          # 热重载
npm start            # 生产模式

# 前端
cd client
npm run dev          # http://localhost:5173
npm run build        # 产出 dist/

# E2E 测试（PowerShell）
node e2e_test.cjs
```

---

## 📚 文档导航

- 📐 [**架构设计**](./docs/ARCHITECTURE.md) — 系统架构图、数据流、技术选型理由
- 🚀 [**部署指南**](./docs/DEPLOY.md) — 三种部署方式（本地 / Docker / ECS）的详细步骤
- 🔌 [**API 文档**](./docs/API.md) — 所有 RESTful 端点、请求/响应示例
- 🛠️ [**运维手册**](./docs/OPS.md) — 日常运维、备份恢复、故障排查、扩缩容
- 🇨🇳 [**阿里云 ECS 部署**](./deploy/README.md) — 一键部署脚本使用说明

---

## 🤝 贡献

- 🐛 报告 Bug / 提功能 → [Issues](../../issues)
- 🔧 提交代码 → Fork → PR
- 🌐 翻译 → `client/src/lib/problems.js` 里的 `titleEn` 字段
- 📝 添加硬问题 → `server/src/data/problems.js`

---

## 📜 许可证

MIT License — 完全开源，欢迎二次开发。

---

## 💡 设计哲学

1. **零外部依赖**：单进程 + JSON 文件 = 任何机器都能跑（甚至树莓派）
2. **双模式架构**：同一前端代码，既能连后端，也能用浏览器 IndexedDB 独立运行
3. **AI 优先**：每个问题都有 AI 助手入口，让"不会"不再是门槛
4. **小朋友友好**：每个问题都有"kid"版本，用日常类比解释
5. **真·链上奖励**：每次提交都签名 + 哈希上链，积分不可篡改

> 让硬问题不再只是大人物的专属游戏，让每个有想法的人（无论年龄）都能参与。

