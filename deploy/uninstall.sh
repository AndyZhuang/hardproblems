#!/usr/bin/env bash
# 卸载 hardproblems
# 保留 /opt/hardproblems/data（链上数据）— 如要彻底删除，加 --purge
set -euo pipefail
APP_DIR="/opt/hardproblems"

echo "[INFO] 停止服务..."
systemctl stop hardproblems 2>/dev/null || true
systemctl disable hardproblems 2>/dev/null || true

echo "[INFO] 删除 systemd unit..."
rm -f /etc/systemd/system/hardproblems.service
systemctl daemon-reload

echo "[INFO] 删除 Nginx 配置..."
rm -f /etc/nginx/conf.d/hardproblems.conf
systemctl reload nginx 2>/dev/null || true

if [[ "${1:-}" == "--purge" ]]; then
  echo "[INFO] 彻底删除（包含数据）..."
  rm -rf "$APP_DIR"
  echo "[OK] 已彻底删除"
else
  echo "[INFO] 保留 $APP_DIR（数据安全）"
  echo "[OK] 已卸载（数据保留）"
fi
