# Changelog

All notable changes to HardProblems.World are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
