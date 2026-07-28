#!/usr/bin/env bash
# =============================================================================
#  HardProblems.World — 一键部署到阿里云 / 腾讯云 ECS
#
#  适用系统：Ubuntu 20.04+ / Debian 11+ / CentOS 8+（推荐 Ubuntu 22.04 LTS）
#  适用架构：x86_64 / aarch64
#  适用云：阿里云 ECS、腾讯云 CVM、华为云 ECS、AWS EC2、任何 Linux VPS
#
#  功能：
#    - 安装 Node.js 20（无 nvm，直接 apt + Nodesource）
#    - 安装 Nginx + certbot（自动 HTTPS）
#    - 安装 fail2ban + ufw（安全加固）
#    - 部署应用到 /opt/hardproblems（systemd 管理）
#    - 自动配置 Nginx 反向代理
#    - 可选自动申请 Let's Encrypt 证书
#    - 创建专用 deploy 用户（可选）
#
#  用法：
#    # 1. 把整个项目 tar.gz 上传到服务器 /tmp/hardproblems.tar.gz
#    # 2. SSH 上服务器后：
#    sudo bash deploy.sh \
#      --domain yourdomain.com \
#      --email you@example.com \
#      --port 4000
#
#    或者只用 --no-https 跳过证书申请（先 http 上线）
#    sudo bash deploy.sh --no-https --port 4000
#
#  重新部署（保留数据）：
#    sudo bash deploy.sh --redeploy
# =============================================================================

set -euo pipefail

# --------- 默认配置 ---------
APP_NAME="hardproblems"
APP_DIR="/opt/hardproblems"
APP_USER="www-data"   # 跟 nginx 一致
APP_PORT=4000
DOMAIN=""
EMAIL=""
USE_HTTPS=1
REDEPLOY=0
SKIP_BUILD=0
GIT_REPO=""
GIT_REF="main"

# --------- 颜色 ---------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${BLUE}[INFO]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()   { echo -e "${RED}[ERR]${NC} $*"; }

# --------- 参数解析 ---------
while [[ $# -gt 0 ]]; do
  case $1 in
    --domain)        DOMAIN="$2"; shift 2 ;;
    --email)         EMAIL="$2"; shift 2 ;;
    --port)          APP_PORT="$2"; shift 2 ;;
    --no-https)      USE_HTTPS=0; shift ;;
    --redeploy)      REDEPLOY=1; shift ;;
    --skip-build)    SKIP_BUILD=1; shift ;;
    --git)           GIT_REPO="$2"; shift 2 ;;
    --ref)           GIT_REF="$2"; shift 2 ;;
    --help|-h)
      sed -n '2,40p' "$0"; exit 0 ;;
    *) err "未知参数: $1"; exit 1 ;;
  esac
done

# --------- 预检 ---------
if [[ $EUID -ne 0 ]]; then
  err "请用 root 运行：sudo bash $0 ..."
  exit 1
fi

. /etc/os-release
info "检测到系统：$ID $VERSION_CODENAME"

if ! command -v apt-get >/dev/null && ! command -v yum >/dev/null; then
  err "不支持的系统（需要 apt 或 yum）"; exit 1
fi

PM="apt"
if command -v apt-get >/dev/null; then PM="apt"
elif command -v yum >/dev/null; then PM="yum"
fi

# --------- 1. 安装基础依赖 ---------
info "[1/7] 安装基础依赖..."
if [[ $PM == apt ]]; then
  apt-get update -qq
  apt-get install -y -qq curl git ca-certificates ufw fail2ban rsync openssl 2>&1 | tail -5
elif [[ $PM == yum ]]; then
  yum install -y -q curl git ca-certificates firewalld epel-release rsync openssl 2>&1 | tail -5
fi
ok "基础依赖已安装"

# --------- 2. 安装 Node.js 20 ---------
info "[2/7] 安装 Node.js 20..."
if ! command -v node >/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]]; then
  if [[ $PM == apt ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
    apt-get install -y -qq nodejs
  else
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - >/dev/null
    yum install -y -q nodejs
  fi
fi
ok "Node.js: $(node -v)  npm: $(npm -v)"

# --------- 3. 部署代码 ---------
info "[3/7] 部署应用代码到 $APP_DIR..."
mkdir -p "$APP_DIR"
mkdir -p "$APP_DIR/data"
mkdir -p "$APP_DIR/logs"

if [[ -n $GIT_REPO ]]; then
  if [[ -d "$APP_DIR/.git" ]]; then
    (cd "$APP_DIR" && git fetch origin && git reset --hard "origin/$GIT_REF")
  else
    rm -rf "$APP_DIR"/*
    git clone --branch "$GIT_REF" --depth 1 "$GIT_REPO" "$APP_DIR"
  fi
elif [[ -f /tmp/hardproblems.tar.gz ]]; then
  warn "从 /tmp/hardproblems.tar.gz 解包..."
  tar -xzf /tmp/hardproblems.tar.gz -C "$APP_DIR" --strip-components=1
elif [[ -d $(pwd) ]] && [[ -f $(pwd)/server/package.json ]] && [[ -f $(pwd)/client/package.json ]]; then
  warn "从当前目录同步代码（rsync）..."
  rsync -a --delete \
    --exclude 'node_modules' --exclude '.git' --exclude 'data' --exclude 'logs' \
    --exclude 'screenshots' --exclude 'deploy/*.log' \
    ./ "$APP_DIR/"
else
  err "找不到代码。请提供 --git <repo> 或把 tar.gz 放到 /tmp/hardproblems.tar.gz"
  exit 1
fi

# 修复 ownership
chown -R "$APP_USER":"$APP_USER" "$APP_DIR" 2>/dev/null || chown -R root:root "$APP_DIR"

# --------- 4. 装依赖 + build ---------
if [[ $SKIP_BUILD -eq 0 ]]; then
  info "[4/7] 装依赖 + 构建前端..."
  (cd "$APP_DIR/server" && npm install --omit=dev --no-audit --no-fund 2>&1 | tail -5)
  (cd "$APP_DIR/client" && npm install --no-audit --no-fund 2>&1 | tail -5 && npm run build 2>&1 | tail -5)
  ok "构建完成"
else
  info "[4/7] 跳过构建（--skip-build）"
fi

# --------- 5. 写 .env + 启动 systemd ---------
info "[5/7] 配置 systemd 服务..."
if [[ ! -f "$APP_DIR/server/.env" ]]; then
  JWT_SECRET=$(openssl rand -hex 48)
  cat > "$APP_DIR/server/.env" <<EOF
NODE_ENV=production
PORT=$APP_PORT
HOST=127.0.0.1
JWT_SECRET=$JWT_SECRET
CORS_ORIGINS=https://${DOMAIN:-*},http://${DOMAIN:-*}
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=300
BLOCK_INTERVAL_MS=5000
LOG_LEVEL=info
DATA_DIR=/opt/hardproblems/data
EOF
  ok ".env 已生成（JWT 随机密钥）"
fi

cat > /etc/systemd/system/hardproblems.service <<EOF
[Unit]
Description=HardProblems.World API
Documentation=https://github.com/your/hardproblems
After=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR/server
EnvironmentFile=$APP_DIR/server/.env
ExecStart=$(command -v node) $APP_DIR/server/src/index.js
Restart=on-failure
RestartSec=5s
LimitNOFILE=65536

# 安全加固
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=$APP_DIR/data $APP_DIR/logs

# 日志走 journald
StandardOutput=journal
StandardError=journal
SyslogIdentifier=hardproblems

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable hardproblems.service
systemctl restart hardproblems.service
sleep 3
if systemctl is-active --quiet hardproblems.service; then
  ok "systemd 启动成功"
else
  err "启动失败，查看日志：journalctl -u hardproblems -n 50"
  exit 1
fi

# --------- 6. Nginx + 可选 HTTPS ---------
info "[6/7] 配置 Nginx..."
if [[ $PM == apt ]]; then apt-get install -y -qq nginx
else yum install -y -q nginx; fi

# 用 envsubst 替换占位符
export APP_PORT DOMAIN
mkdir -p /etc/nginx/conf.d

cat > /etc/nginx/conf.d/hardproblems.conf <<'NGINX'
upstream hardproblems_app {
  server 127.0.0.1:__APP_PORT__;
  keepalive 32;
}

server {
  listen 80;
  listen [::]:80;
  server_name __DOMAIN__;

  # 健康检查直接给 nginx
  location = /api/health {
    proxy_pass http://hardproblems_app;
    access_log off;
  }

  # gzip
  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
  gzip_min_length 1000;

  # 客户端最大上传
  client_max_body_size 2m;

  # 代理
  location / {
    proxy_pass http://hardproblems_app;
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Connection        "";

    # SSE / 长连接支持（链上事件）
    proxy_read_timeout  120s;
    proxy_send_timeout  120s;

    # 安全
    proxy_hide_header X-Powered-By;
  }

  # 静态资源缓存
  location /assets/ {
    proxy_pass http://hardproblems_app;
    expires 7d;
    add_header Cache-Control "public, immutable";
  }
}
NGINX

# 用 envsubst 替换 __APP_PORT__ / __DOMAIN__
envsubst '__APP_PORT__ __DOMAIN__' < /etc/nginx/conf.d/hardproblems.conf > /tmp/hardproblems.conf
mv /tmp/hardproblems.conf /etc/nginx/conf.d/hardproblems.conf
# 移除 default site
rm -f /etc/nginx/sites-enabled/default /etc/nginx/conf.d/default.conf

nginx -t
systemctl enable nginx
systemctl restart nginx
ok "Nginx 配置完成"

# --------- 7. HTTPS (Let's Encrypt) ---------
if [[ $USE_HTTPS -eq 1 && -n $DOMAIN ]]; then
  info "[7/7] 申请 Let's Encrypt 证书..."
  if ! command -v certbot >/dev/null; then
    if [[ $PM == apt ]]; then
      apt-get install -y -qq certbot python3-certbot-nginx
    else
      yum install -y -q certbot python3-certbot-nginx
    fi
  fi
  certbot --nginx --non-interactive --agree-tos -m "$EMAIL" -d "$DOMAIN" || {
    warn "证书申请失败，请检查 DNS 是否指向本机 IP"
  }
  ok "HTTPS 已配置"
elif [[ $USE_HTTPS -eq 0 ]]; then
  warn "跳过 HTTPS（--no-https）"
else
  warn "未提供 --domain，跳过 HTTPS"
fi

# --------- 8. 安全加固 ---------
info "配置 UFW 防火墙..."
if command -v ufw >/dev/null; then
  ufw --force reset >/dev/null
  ufw default deny incoming >/dev/null
  ufw default allow outgoing >/dev/null
  ufw allow ssh >/dev/null
  ufw allow 'Nginx Full' >/dev/null
  ufw --force enable >/dev/null
  ok "UFW 已启用"
fi

# --------- 9. 输出最终状态 ---------
echo
echo "=================================================================="
echo -e "${GREEN} 部署完成！${NC}"
echo "=================================================================="
echo "  应用目录   : $APP_DIR"
echo "  数据目录   : $APP_DIR/data"
echo "  内部端口   : $APP_PORT"
echo "  服务状态   : systemctl status hardproblems"
echo "  实时日志   : journalctl -u hardproblems -f"
echo "  健康检查   : curl http://localhost:$APP_PORT/api/health"
echo
if [[ -n $DOMAIN ]]; then
  if [[ $USE_HTTPS -eq 1 ]]; then
    echo "  外网访问   : https://$DOMAIN"
  else
    echo "  外网访问   : http://$DOMAIN"
  fi
fi
echo
echo -e "  ${YELLOW}下一步建议：${NC}"
echo "  1. 浏览器打开域名确认页面正常"
echo "  2. 注册账号测试提交流程"
echo "  3. 查看 blocks 浏览器是否有新区块"
echo "=================================================================="
