#!/usr/bin/env bash
# =============================================================================
#  备份 /opt/hardproblems/data 到 /var/backups/hardproblems/YYYYMMDD-HHMMSS.tar.gz
#  保留最近 7 天备份，自动清理老的
#  用法：bash backup.sh  （建议加到 crontab：0 3 * * * /opt/hardproblems/deploy/backup.sh）
# =============================================================================
set -euo pipefail

APP_DIR="/opt/hardproblems"
BACKUP_DIR="/var/backups/hardproblems"
KEEP_DAYS=7
TS=$(date +%Y%m%d-%H%M%S)
NAME="hardproblems-data-${TS}.tar.gz"
DEST="$BACKUP_DIR/$NAME"

mkdir -p "$BACKUP_DIR"

if [[ ! -d "$APP_DIR/data" ]]; then
  echo "[ERR] 数据目录不存在: $APP_DIR/data" >&2
  exit 1
fi

echo "[INFO] 备份 $APP_DIR/data -> $DEST"
tar -czf "$DEST" -C "$APP_DIR" data/

# 清理老备份
find "$BACKUP_DIR" -name "hardproblems-data-*.tar.gz" -mtime +$KEEP_DAYS -delete

SIZE=$(du -h "$DEST" | cut -f1)
echo "[OK] 备份完成: $DEST ($SIZE)"

# 保留备份列表
ls -lh "$BACKUP_DIR" | head -10
