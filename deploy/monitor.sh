#!/usr/bin/env bash
# =============================================================================
#  健康检查 + 监控
#  用法：
#    bash monitor.sh                 # 一次性检查
#    bash monitor.sh --watch 60      # 每 60 秒检查一次
# =============================================================================
set -euo pipefail

APP_PORT="${APP_PORT:-4000}"
WATCH_INTERVAL=0

while [[ $# -gt 0 ]]; do
  case $1 in
    --watch) WATCH_INTERVAL="$2"; shift 2 ;;
    --port)  APP_PORT="$2"; shift 2 ;;
    *) echo "未知参数: $1"; exit 1 ;;
  esac
done

check_once() {
  local STATUS=0
  local HTTP_CODE
  HTTP_CODE=$(curl -s -o /tmp/hp-health.json -w "%{http_code}" "http://localhost:$APP_PORT/api/health" || echo 000)
  local BLOCKS
  local VALID
  if [[ -s /tmp/hp-health.json ]]; then
    BLOCKS=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('/tmp/hp-health.json','utf-8')).chain.length)}catch{console.log('?')}" 2>/dev/null || echo "?")
    VALID=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('/tmp/hp-health.json','utf-8')).chain.valid)}catch{console.log('?')}" 2>/dev/null || echo "?")
  else
    BLOCKS="?"; VALID="?"
  fi

  local SERVICE_OK=0
  if systemctl is-active --quiet hardproblems; then SERVICE_OK=1; fi

  local DISK_PCT
  DISK_PCT=$(df -P / | tail -1 | awk '{print $5}' | tr -d '%')
  local MEM_PCT
  MEM_PCT=$(free | awk '/Mem:/ {printf "%.0f", $3/$2*100}')

  local TS
  TS=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$TS] http=$HTTP_CODE  blocks=$BLOCKS  chain_valid=$VALID  service=$([ $SERVICE_OK -eq 1 ] && echo OK || echo DOWN)  disk=${DISK_PCT}%  mem=${MEM_PCT}%"

  # 告警
  if [[ $HTTP_CODE -ne 200 ]] || [[ $SERVICE_OK -eq 0 ]]; then STATUS=1; fi
  if [[ $DISK_PCT -ge 85 ]]; then echo "[WARN] 磁盘使用 ${DISK_PCT}%，请清理"; STATUS=1; fi
  if [[ $MEM_PCT -ge 90 ]]; then echo "[WARN] 内存使用 ${MEM_PCT}%"; STATUS=1; fi
  if [[ $VALID == "false" ]]; then echo "[WARN] 链无效！检查数据完整性"; STATUS=1; fi

  return $STATUS
}

if [[ $WATCH_INTERVAL -gt 0 ]]; then
  while true; do check_once || true; sleep "$WATCH_INTERVAL"; done
else
  check_once
fi
