# 一键部署到阿里云 / 腾讯云 ECS

> 适用：阿里云 ECS、腾讯云 CVM、华为云 ECS、AWS EC2，任何 Ubuntu 20.04+ Linux VPS

## 快速开始（5 分钟）

```bash
# 1. 在阿里云 / 腾讯云控制台开一台 ECS：
#    - 系统：Ubuntu 22.04 LTS（推荐）或 Debian 11
#    - 规格：1c1g 起（小项目足够）
#    - 公网带宽：按量 5Mbps 或固定 1Mbps
#    - 安全组：开放 22 (SSH) / 80 (HTTP) / 443 (HTTPS)
#
# 2. SSH 上服务器
ssh root@your-server-ip

# 3. 上传代码（任选一种）
#    a) scp 上传（推荐）
#       在本机：
scp hardproblems-*.tar.gz root@your-server-ip:/tmp/hardproblems.tar.gz
#
#    b) Git
#       服务器上先 git clone ...

# 4. 解包（如 scp）
cd /opt && tar -xzf /tmp/hardproblems.tar.gz

# 5. 运行部署脚本
cd /opt/hardproblems
sudo bash deploy/deploy.sh \
  --domain yourdomain.com \
  --email you@example.com \
  --port 4000

#    第一次部署会自动：
#      - 装 Node 20 / Nginx / certbot / ufw / fail2ban
#      - 装依赖、构建前端
#      - 写 systemd 服务 + .env（随机 JWT 密钥）
#      - 写 Nginx 反向代理
#      - 申请 Let's Encrypt HTTPS 证书
#      - 启用防火墙

# 6. 浏览器打开 https://yourdomain.com 验证
```

## 进阶用法

### 仅 HTTP 部署（先不上 HTTPS）

```bash
sudo bash deploy/deploy.sh --no-https --port 4000
```

### 后续更新代码

```bash
# 本机：scp 新包
scp hardproblems-*.tar.gz root@server:/tmp/hardproblems.tar.gz
# 服务器：
cd /opt/hardproblems
sudo bash deploy/deploy.sh --redeploy --skip-build
# 或重新 build：
sudo bash deploy/deploy.sh --redeploy
```

### 用 Git 部署

```bash
sudo bash deploy/deploy.sh \
  --git https://github.com/you/hardproblems.git \
  --ref main \
  --domain hardproblems.world
```

## 日常运维

```bash
# 查看服务状态
sudo systemctl status hardproblems

# 实时日志
sudo journalctl -u hardproblems -f

# 重启服务
sudo systemctl restart hardproblems

# 停止
sudo systemctl stop hardproblems

# 监控（一次性）
sudo bash deploy/monitor.sh

# 监控（每 60 秒）
sudo bash deploy/monitor.sh --watch 60

# 备份（自动保留 7 天）
sudo bash deploy/backup.sh

# 定时备份（每天凌晨 3 点）
echo "0 3 * * * root /opt/hardproblems/deploy/backup.sh" | sudo tee /etc/cron.d/hardproblems-backup
```

## 卸载

```bash
# 保留数据
sudo bash deploy/uninstall.sh

# 彻底删除（含数据）
sudo bash deploy/uninstall.sh --purge
```

## 目录结构

```
/opt/hardproblems/
├── client/dist/         # 前端构建产物
├── server/              # 后端源码 + node_modules + .env
├── data/                # 链上数据（JSON 文件）
│   ├── users.json
│   ├── blocks.json
│   ├── transactions.json
│   └── ...
├── logs/                # 运行时日志（如启用）
└── deploy/              # 部署 + 运维脚本
    ├── deploy.sh
    ├── backup.sh
    ├── monitor.sh
    └── uninstall.sh
```

## 数据备份与恢复

```bash
# 备份
sudo bash deploy/backup.sh
# 生成 /var/backups/hardproblems/hardproblems-data-YYYYMMDD-HHMMSS.tar.gz

# 恢复
sudo systemctl stop hardproblems
cd /opt/hardproblems
sudo tar -xzf /var/backups/hardproblems/hardproblems-data-XXX.tar.gz
sudo systemctl start hardproblems
```

## 防火墙 / 安全组设置

阿里云 / 腾讯云控制台的安全组需要放行：

| 端口 | 协议 | 用途 |
|----|----|----|
| 22  | TCP | SSH |
| 80  | TCP | HTTP（certbot 验证用） |
| 443 | TCP | HTTPS |

其它全部 DROP。

服务器内部由 UFW 兜底：

```bash
sudo ufw status verbose
```

## HTTPS 自动续期

certbot 安装时会自动加一个 systemd timer / cron，每天两次检查过期。
不需要手动管。

## 故障排查

```bash
# 服务起不来
sudo journalctl -u hardproblems -n 100 --no-pager

# 端口被占
sudo ss -tlnp | grep 4000

# Nginx 配置错误
sudo nginx -t

# 数据异常
curl http://localhost:4000/api/chain/info
curl http://localhost:4000/api/health
```
