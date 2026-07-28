# 🚀 部署指南

三种部署方式，按场景选择：

| 场景 | 方式 | 难度 | 适用 |
|---|---|---|---|
| 本机体验 | `start.sh` / `start.bat` | ⭐ | 开发者本地 |
| 自托管 | Docker Compose | ⭐⭐ | 有 Docker 的环境 |
| 生产 | ECS + systemd + Nginx | ⭐⭐⭐ | 阿里云 / 腾讯云 / AWS |

---

## 方式 A：本地开发

### Windows
```cmd
git clone <repo>
cd hardproblems
start.bat
```

### macOS / Linux
```bash
git clone <repo>
cd hardproblems
chmod +x start.sh
./start.sh
```

启动脚本会：
1. 检测 Node 版本
2. 装 `server` 和 `client` 依赖（首次）
3. 构建前端
4. 启动后端

访问 http://localhost:4000

### 关闭

```bash
# Windows
stop.bat

# Linux
pkill -f "node src/index.js"
```

---

## 方式 B：Docker Compose

适合：自己 VPS、有 Docker 经验。

### 前置

- Docker 20.10+
- Docker Compose v2

### 步骤

```bash
# 1. 准备环境变量
cp .env.docker.example .env
nano .env  # 改 JWT_SECRET

# 2. 启动
docker compose up -d --build

# 3. 看日志
docker compose logs -f

# 4. 验证
curl http://localhost:4000/api/health
```

### 数据持久化

`./data` 目录被挂载到容器 `/app/data`，数据持久化在宿主机。

### 更新

```bash
git pull
docker compose up -d --build
```

### 卸载

```bash
docker compose down          # 保留数据
docker compose down -v       # 同时删数据
```

---

## 方式 C：ECS 一键部署（推荐生产）

适用：阿里云 ECS、腾讯云 CVM、华为云 ECS、AWS EC2。

### 1. 准备 ECS

阿里云 / 腾讯云控制台：
- **系统**：Ubuntu 22.04 LTS（推荐）或 Debian 11+
- **规格**：1c1g 起步（demo 足够），2c2g 推荐
- **带宽**：按量 5Mbps 或固定 1Mbps
- **公网 IP**：必须有
- **安全组**：开放 22 (SSH) / 80 (HTTP) / 443 (HTTPS)

### 2. 解析域名

在阿里云 / 腾讯云 DNS 控制台，把域名 A 记录指向 ECS 公网 IP。

### 3. 上传代码

```bash
# 本机打包（PowerShell）
$ts = Get-Date -Format "yyyyMMdd-HHmmss"
$tar = "hardproblems-$ts.tar.gz"
tar -czf $tar `
  --exclude=node_modules `
  --exclude=client/dist `
  --exclude=data `
  --exclude=.git `
  --exclude=screenshots `
  --exclude=*.log `
  --exclude=deploy/*.log `
  .

# 上传到 ECS
scp $tar root@your-server:/tmp/hardproblems.tar.gz
```

### 4. SSH 上 ECS 跑部署脚本

```bash
ssh root@your-server

# 解包
mkdir -p /opt/hardproblems
tar -xzf /tmp/hardproblems.tar.gz -C /opt/hardproblems

# 部署
cd /opt/hardproblems
sudo bash deploy/deploy.sh \
  --domain yourdomain.com \
  --email you@example.com \
  --port 4000
```

脚本会自动：
- 装 Node 20 / Nginx / certbot / ufw
- 装后端依赖、构建前端
- 写 systemd 服务 + 生成 .env
- 写 Nginx 反向代理
- 申请 Let's Encrypt HTTPS 证书
- 启用 UFW 防火墙

### 5. 验证

```bash
# 服务状态
sudo systemctl status hardproblems

# 健康检查
curl https://yourdomain.com/api/health

# 浏览器
open https://yourdomain.com
```

### 6. 后续更新

```bash
# 本机重新打包上传
scp hardproblems-new.tar.gz root@server:/tmp/

# 服务器
ssh root@server
cd /opt/hardproblems
tar -xzf /tmp/hardproblems-new.tar.gz --strip-components=1
sudo bash deploy/deploy.sh --redeploy
```

---

## 配置 HTTPS

### 自动（推荐）

`deploy.sh` 默认会调 certbot 申请证书，并把 Nginx 改成 HTTPS。

### 手动

```bash
sudo certbot --nginx -d yourdomain.com
# 选 redirect 强制 HTTPS
```

### 自动续期

certbot 自带 systemd timer，每天检查过期。

```bash
sudo systemctl list-timers | grep certbot
```

---

## 反向代理 / Nginx

`deploy.sh` 写好的配置在 `/etc/nginx/conf.d/hardproblems.conf`：

```nginx
upstream hardproblems_app {
  server 127.0.0.1:4000;
  keepalive 32;
}

server {
  listen 443 ssl http2;
  server_name yourdomain.com;

  ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

  gzip on;
  client_max_body_size 2m;

  location / {
    proxy_pass http://hardproblems_app;
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 120s;
  }

  location /assets/ {
    proxy_pass http://hardproblems_app;
    expires 7d;
  }
}
```

如果想加 CDN（阿里云 CDN / 腾讯云 CDN / Cloudflare）：

- 后端 ECS 源站回源到 443
- 缓存策略：HTML 不缓存，`/assets/*` 缓存 7 天
- 记得在 CDN 配置回源 HOST = 你的域名

---

## 阿里云 / 腾讯云 备案

中国大陆 ECS 上跑 Web 服务，域名必须备案。流程：

1. 阿里云 / 腾讯云 控制台 → 备案系统
2. 提交资料（身份证 + 域名证书）
3. 7-20 个工作日审核
4. 拿到备案号后挂在网站底部

海外节点（香港 / 新加坡 ECS）可以免备案。

---

## 防火墙 / 安全组

### 阿里云 / 腾讯云 控制台安全组

| 方向 | 端口 | 协议 | 来源 | 用途 |
|---|---|---|---|---|
| 入 | 22 | TCP | 0.0.0.0/0 | SSH（生产建议限制 IP） |
| 入 | 80 | TCP | 0.0.0.0/0 | HTTP |
| 入 | 443 | TCP | 0.0.0.0/0 | HTTPS |
| 出 | ALL | ALL | 0.0.0.0/0 | 系统更新、证书申请 |

### UFW（服务器内）

`deploy.sh` 已自动配好：
```bash
sudo ufw status verbose
```

---

## 故障排查

见 [OPS.md § 故障排查](./OPS.md#故障排查)
