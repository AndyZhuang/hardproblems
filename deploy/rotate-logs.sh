#!/usr/bin/env bash
# =============================================================================
#  日志轮转：限制 /var/log/hardproblems 目录下的日志文件大小
#  配合 /etc/logrotate.d/hardproblems 使用
#  也可单独运行：bash rotate-logs.sh
# =============================================================================
set -euo pipefail

LOG_DIR="/var/log/hardproblems"
MAX_SIZE_MB=50
KEEP=5

mkdir -p "$LOG_DIR"

if [[ -z "$(ls -A $LOG_DIR 2>/dev/null)" ]]; then
  echo "[INFO] 日志目录为空，无需轮转"
  exit 0
fi

for f in "$LOG_DIR"/*.log; do
  [[ -f "$f" ]] || continue
  size_mb=$(du -m "$f" | cut -f1)
  if [[ $size_mb -ge $MAX_SIZE_MB ]]; then
    # rotate
    ts=$(date +%Y%m%d-%H%M%S)
    mv "$f" "${f}.${ts}"
    gzip "${f}.${ts}" || true
    echo "[INFO] rotated: ${f}.${ts}.gz"

    # 清理老日志
    ls -1t "$LOG_DIR"/$(basename "$f").* 2>/dev/null | tail -n +$((KEEP+1)) | xargs -r rm -f
  fi
done

echo "[OK] 日志轮转完成"
