#!/usr/bin/env bash
# archive.sh
# Stop hook
#
# 세션 종료 시 다음을 정리:
# 1) 본 세션에서 작성된 회차 요약 로그
# 2) 활성 작품의 next_episode 갱신 (output 쪽 manifest.next.yaml)
# 3) inbox에 미처리 zip 알림

set -u

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
ACTIVE_FILE="$PROJECT_DIR/.active-project"
SESSION_LOG="$PROJECT_DIR/.claude/sessions"
mkdir -p "$SESSION_LOG" 2>/dev/null

ACTIVE_SLUG=""
if [ -f "$ACTIVE_FILE" ] && [ -s "$ACTIVE_FILE" ]; then
  ACTIVE_SLUG=$(head -n 1 "$ACTIVE_FILE" | tr -d '[:space:]')
fi

TS=$(date +%Y%m%d-%H%M%S)
LOG="$SESSION_LOG/$TS.log"

{
  echo "session: $TS"
  echo "active_project: ${ACTIVE_SLUG:-<none>}"
  if [ -n "$ACTIVE_SLUG" ] && [ -d "$PROJECT_DIR/output/$ACTIVE_SLUG" ]; then
    echo "output_episodes:"
    find "$PROJECT_DIR/output/$ACTIVE_SLUG" -maxdepth 1 -type d -name "*화" 2>/dev/null | sort | while read -r d; do
      echo "  - $(basename "$d")"
    done
  fi

  # inbox 미처리 zip
  if [ -d "$PROJECT_DIR/contexts/inbox" ]; then
    PENDING=$(find "$PROJECT_DIR/contexts/inbox" -maxdepth 1 -name "*.zip" -type f 2>/dev/null | wc -l)
    if [ "$PENDING" -gt 0 ]; then
      echo "pending_inbox_zips: $PENDING"
    fi
  fi
} > "$LOG"

# 사용자 보이는 로그는 짧게 (Stop hook의 stdout이 대화에 보이지 않을 수 있으나 안전하게)
exit 0
