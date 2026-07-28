# Changelog

All notable changes to HardProblems.World are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
