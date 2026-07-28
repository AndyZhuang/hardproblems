#!/usr/bin/env bash
# =============================================================================
#  高级健康检查 + 告警（飞书 / 钉钉 / 邮件）
#
#  用法：
#    WEBHOOK=https://open.feishu.cn/... bash monitor.sh
#    EMAIL=you@x.com bash monitor.sh
#    或者什么都不传，只输出到 stdout
#
#  配合 systemd timer 或 cron：
#    */5 * * * * /opt/hardproblems/deploy/monitor.sh
# =============================================================================
set -euo pipefail

APP_PORT="${APP_PORT:-4000}"
HEALTH_URL="http://localhost:$APP_PORT/api/health"

# ---- 检查 ----
HTTP_CODE=$(curl -s -o /tmp/hp-h.json -w "%{http_code}" --max-time 5 "$HEALTH_URL" || echo 000)
SERVICE_OK=0
systemctl is-active --quiet hardproblems && SERVICE_OK=1
DISK_PCT=$(df -P / | tail -1 | awk '{print $5}' | tr -d '%')
MEM_PCT=$(free | awk '/Mem:/ {printf "%.0f", $3/$2*100}')

# 解析健康数据
BLOCKS=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('/tmp/hp-h.json','utf-8')).chain.length||'?')}catch{console.log('?')}" 2>/dev/null || echo "?")
VALID=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('/tmp/hp-h.json','utf-8')).chain.valid||'?')}catch{console.log('?')}" 2>/dev/null || echo "?")
HOSTNAME=$(hostname)
TS=$(date '+%Y-%m-%d %H:%M:%S')

ALERTS=()

if [[ $HTTP_CODE -ne 200 ]]; then
  ALERTS+=("❌ HTTP 不健康: $HTTP_CODE")
fi
if [[ $SERVICE_OK -eq 0 ]]; then
  ALERTS+=("❌ hardproblems 服务未运行")
fi
if [[ $DISK_PCT -ge 85 ]]; then
  ALERTS+=("⚠️ 磁盘使用 ${DISK_PCT}%")
fi
if [[ $MEM_PCT -ge 90 ]]; then
  ALERTS+=("⚠️ 内存使用 ${MEM_PCT}%")
fi
if [[ $VALID == "false" ]]; then
  ALERTS+=("⚠️ 链验证失败！")
fi

# 输出状态
echo "[$TS] host=$HOSTNAME http=$HTTP_CODE service=$([ $SERVICE_OK -eq 1 ] && echo OK || echo DOWN) blocks=$BLOCKS valid=$VALID disk=${DISK_PCT}% mem=${MEM_PCT}%"

# 无告警
if [[ ${#ALERTS[@]} -eq 0 ]]; then
  exit 0
fi

# 有告警：构造消息
MSG="[$TS] HardProblems.World @ $HOSTNAME
─────────────────────────────────
$([ $HTTP_CODE -eq 200 ] || echo "❌ HTTP: $HTTP_CODE")
$([ $SERVICE_OK -eq 1 ] || echo "❌ Service: DOWN")
📊 Blocks: $BLOCKS  Valid: $VALID
💾 Disk: ${DISK_PCT}%  Mem: ${MEM_PCT}%
─────────────────────────────────
${ALERTS[*]}"

# 飞书 webhook
if [[ -n "${WEBHOOK:-}" ]]; then
  curl -s -X POST -H "Content-Type: application/json" \
    -d "$(jq -nc --arg t "HardProblems Alert" --arg c "$MSG" '{msg_type:"text",content:{text:($t+"\n"+$c)}}')" \
    "$WEBHOOK" >/dev/null
  echo "[INFO] 飞书告警已发送"
fi

# 钉钉 webhook
if [[ -n "${DINGTALK:-}" ]]; then
  curl -s -X POST -H "Content-Type: application/json" \
    -d "$(jq -nc --arg c "$MSG" '{msgtype:"text",text:{content:$c}}')" \
    "$DINGTALK" >/dev/null
  echo "[INFO] 钉钉告警已发送"
fi

# 邮件（需要 mailutils）
if [[ -n "${EMAIL:-}" ]] && command -v mail >/dev/null; then
  echo "$MSG" | mail -s "⚠️ HardProblems Alert on $HOSTNAME" "$EMAIL"
  echo "[INFO] 邮件已发到 $EMAIL"
fi

# 至少输出到 stderr
if [[ -z "${WEBHOOK:-}${DINGTALK:-}${EMAIL:-}" ]]; then
  echo "⚠️ 告警：" >&2
  printf '   %s\n' "${ALERTS[@]}" >&2
fi
