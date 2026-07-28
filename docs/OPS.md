# 🛠️ 运维手册

## 目录

- [常用命令速查](#常用命令速查)
- [服务管理（systemd）](#服务管理systemd)
- [日志查看](#日志查看)
- [数据备份与恢复](#数据备份与恢复)
- [健康检查与监控](#健康检查与监控)
- [扩缩容](#扩缩容)
- [故障排查](#故障排查)
- [安全运维](#安全运维)

---

## 常用命令速查

```bash
# 服务
sudo systemctl status hardproblems
sudo systemctl restart hardproblems
sudo systemctl stop hardproblems
sudo systemctl start hardproblems
sudo systemctl enable hardproblems  # 开机自启

# 日志
sudo journalctl -u hardproblems -f            # 实时
sudo journalctl -u hardproblems -n 200        # 最近 200 行
sudo journalctl -u hardproblems --since today # 今天

# Nginx
sudo nginx -t               # 测试配置
sudo systemctl reload nginx # 重载（不中断）
sudo systemctl restart nginx

# 数据
ls -la /opt/hardproblems/data/
du -sh /opt/hardproblems/data/*

# 监控
bash /opt/hardproblems/deploy/monitor.sh           # 一次性
bash /opt/hardproblems/deploy/monitor.sh --watch 60 # 每 60s
```

---

## 服务管理（systemd）

`/etc/systemd/system/hardproblems.service`：

```ini
[Unit]
Description=HardProblems.World API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/hardproblems/server
EnvironmentFile=/opt/hardproblems/server/.env
ExecStart=/usr/bin/node /opt/hardproblems/server/src/index.js
Restart=on-failure
RestartSec=5s
LimitNOFILE=65536

# 安全
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=/opt/hardproblems/data /opt/hardproblems/logs

[Install]
WantedBy=multi-user.target
```

修改后：
```bash
sudo systemctl daemon-reload
sudo systemctl restart hardproblems
```

---

## 日志查看

### 应用日志（journald）

```bash
# 实时跟踪
sudo journalctl -u hardproblems -f

# 最近 100 行
sudo journalctl -u hardproblems -n 100 --no-pager

# 今天的日志
sudo journalctl -u hardproblems --since today --no-pager

# 错误级别
sudo journalctl -u hardproblems -p err --no-pager

# 某时间段
sudo journalctl -u hardproblems --since "2026-07-29 00:00" --until "2026-07-29 12:00"
```

### Nginx 日志

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 日志轮转

`/etc/logrotate.d/hardproblems`（由 `deploy.sh` 安装）：

```bash
# 立即轮转
sudo logrotate -f /etc/logrotate.d/hardproblems
```

---

## 数据备份与恢复

### 自动备份（推荐）

```bash
# 添加到 crontab
echo "0 3 * * * root /opt/hardproblems/deploy/backup.sh" | sudo tee /etc/cron.d/hardproblems-backup

# 验证
sudo run-parts --test /etc/cron.daily
```

每天凌晨 3 点自动备份，保留 7 天。

### 手动备份

```bash
sudo bash /opt/hardproblems/deploy/backup.sh
# 备份到 /var/backups/hardproblems/hardproblems-data-YYYYMMDD-HHMMSS.tar.gz
```

### 备份上传到 OSS（阿里云对象存储）

```bash
# 安装 ossutil
curl -O https://gosspublic.alicdn.com/ossutil/1.7.18/ossutil64.zip
unzip ossutil64.zip
chmod +x ossutil64

# 配置
./ossutil64 config
# 输入 AccessKey / Secret / Endpoint

# 备份后上传
TS=$(date +%Y%m%d-%H%M%S)
./ossutil64 cp /var/backups/hardproblems/hardproblems-data-${TS}.tar.gz \
  oss://your-bucket/hardproblems/backups/
```

类似地，可以用 `aws s3 cp` 上传到 AWS S3 / Cloudflare R2。

### 恢复

```bash
# 1. 停服务
sudo systemctl stop hardproblems

# 2. 备份当前（以防回滚）
sudo mv /opt/hardproblems/data /opt/hardproblems/data.broken

# 3. 解压备份
cd /opt/hardproblems
sudo tar -xzf /var/backups/hardproblems/hardproblems-data-XXX.tar.gz

# 4. 改权限
sudo chown -R www-data:www-data /opt/hardproblems/data

# 5. 起服务
sudo systemctl start hardproblems

# 6. 验证
curl http://localhost:4000/api/chain/info
```

---

## 健康检查与监控

### 一次性检查

```bash
bash /opt/hardproblems/deploy/monitor.sh
```

输出示例：
```
[2026-07-29 00:30:00] http=200  blocks=12  chain_valid=true  service=OK  disk=42%  mem=58%
```

### 定时检查 + 告警

```bash
# 编辑 healthcheck.sh 顶部加上告警渠道
# 飞书
export WEBHOOK='https://open.feishu.cn/open-apis/bot/v2/hook/...'
# 钉钉
export DINGTALK='https://oapi.dingtalk.com/robot/send?access_token=...'
# 邮件
export EMAIL='you@example.com'

# 装到 cron（每 5 分钟）
echo "*/5 * * * * root /opt/hardproblems/deploy/healthcheck.sh >> /var/log/hardproblems-health.log 2>&1" \
  | sudo tee /etc/cron.d/hardproblems-monitor
```

### 第三方监控

推荐接入：
- **UptimeRobot**（免费，5 分钟检测）
- **阿里云云监控**（国内）
- **腾讯云云监控**（国内）
- **Sentry**（错误监控，免费额度够 demo）

监控 URL：`https://yourdomain.com/api/health`

---

## 扩缩容

### 垂直扩（单机升级）

按需升级 ECS 配置：
- 用户 < 1000：1c1g 够用
- 1000-10000：2c4g
- 10000-100000：4c8g + 换 SQLite / PostgreSQL

### 水平扩（多机）

单进程 + JSON 文件存储**不适合水平扩**。要水平扩需要：

1. 换 PostgreSQL（共享数据）
2. 用 Redis 共享 txPool
3. 多机同时出块需要共识机制

实际场景：硬问题平台不是高频交易，99% 情况下单机足够。

### 接入 CDN

把 `client/dist/` 部署到 CDN（阿里云 CDN / Cloudflare），后端保留在 ECS：
- 静态资源：CDN 直出，回源少
- API 请求：直接打到 ECS
- 减少 70%+ 带宽

---

## 故障排查

### 服务起不来

```bash
sudo systemctl status hardproblems
sudo journalctl -u hardproblems -n 100 --no-pager
```

常见原因：
- 端口被占：`sudo ss -tlnp | grep 4000`
- 配置文件错：检查 `/opt/hardproblems/server/.env`
- 权限问题：`sudo chown -R www-data:www-data /opt/hardproblems`

### 链无效

```bash
curl http://localhost:4000/api/chain/validate
```

如果 invalid：
- 看 `block` 和 `reason` 字段定位是哪个块
- 可能是数据被人手动改过；从备份恢复

### 数据库损坏

```bash
# 检查 JSON 是否合法
for f in /opt/hardproblems/data/*.json; do
  echo -n "$f: "
  node -e "JSON.parse(require('fs').readFileSync('$f','utf-8'))" 2>&1 && echo OK
done
```

修复：从备份恢复。

### 性能问题

```bash
# 看内存 / CPU
top -p $(pgrep -f "node src/index.js")

# 看 QPS
sudo tail -f /var/log/nginx/access.log | awk '{print $4}' | sort | uniq -c
```

如果是 JSON 存储满了（> 10k solutions），考虑：
- 加索引（在 `db.js` 里加简单索引）
- 换 SQLite
- 拆分成归档表

### 磁盘满

```bash
df -h /
# 清理日志
sudo journalctl --vacuum-size=100M
# 清理 npm 缓存
npm cache clean --force
# 清理老备份
ls /var/backups/hardproblems/ | head -5
```

---

## 安全运维

### 定期更新

```bash
# 系统
sudo apt update && sudo apt upgrade -y

# Node 依赖
cd /opt/hardproblems
npm outdated
npm update
```

### 改密码 / 密钥

```bash
# 改用户密码
sudo passwd www-data

# 改 JWT 密钥（强制所有用户重新登录）
sudo nano /opt/hardproblems/server/.env
# 改 JWT_SECRET=<新值>
sudo systemctl restart hardproblems
```

### 防止暴力 SSH

`deploy.sh` 默认装 fail2ban。

```bash
sudo fail2ban-client status sshd
```

### 备份到异地

参考上文"备份上传到 OSS"。

---

## SLA / 容量参考

| 指标 | 1c1g | 2c4g | 4c8g |
|---|---|---|---|
| 并发用户 | ~50 | ~300 | ~1000 |
| 解答数 | ~1万 | ~10万 | ~100万 |
| 区块数 | ~5千 | ~5万 | ~50万 |
| 月流量 | ~20GB | ~200GB | ~2TB |
| ECS 月费 | ~¥30 | ~¥100 | ~¥400 |

（阿里云 ECS 2c2g 包月 ~¥100 供参考）
