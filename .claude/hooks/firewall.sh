#!/usr/bin/env bash
# firewall.sh
# PreToolUse hook (Read|Write|Edit|Bash)
#
# 모든 도구 호출 직전 실행. 격리·출력 위치 정책을 강제한다.
# - 활성 외 sandbox 접근 차단
# - /output/<inactive>/ 쓰기 차단
# - contexts/<active>/ 쓰기 차단 (read-only)
#
# 위반 시 exit 2로 도구 호출 거부. 메시지는 stderr로.

set -u

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
ACTIVE_FILE="$PROJECT_DIR/.active-project"

# 입력: stdin으로 도구 호출 정보(JSON)가 들어옴 (Claude Code 스펙)
INPUT=$(cat || true)

# 활성 slug 로드
ACTIVE_SLUG=""
if [ -f "$ACTIVE_FILE" ] && [ -s "$ACTIVE_FILE" ]; then
  ACTIVE_SLUG=$(head -n 1 "$ACTIVE_FILE" | tr -d '[:space:]')
fi

# 도구 이름과 경로/명령 추출 (jq 가용 시 정확, 아니면 grep fallback)
TOOL_NAME=""
TARGET_PATH=""
BASH_COMMAND=""
if command -v jq >/dev/null 2>&1; then
  TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""' 2>/dev/null || echo "")
  TARGET_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""' 2>/dev/null || echo "")
  BASH_COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null || echo "")
else
  TOOL_NAME=$(echo "$INPUT" | grep -oE '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -n1 | sed 's/.*"\([^"]*\)"$/\1/')
  TARGET_PATH=$(echo "$INPUT" | grep -oE '"(file_path|path)"[[:space:]]*:[[:space:]]*"[^"]*"' | head -n1 | sed 's/.*"\([^"]*\)"$/\1/')
  BASH_COMMAND=$(echo "$INPUT" | grep -oE '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | head -n1 | sed 's/.*"\([^"]*\)"$/\1/')
fi

deny() {
  echo "[firewall] DENIED: $1" >&2
  echo "활성 작품: ${ACTIVE_SLUG:-<없음>}" >&2
  echo "차단 대상: $2" >&2
  echo "근거: project-isolation skill / CLAUDE.md §7" >&2
  exit 2
}

# 절대경로화
abs_path() {
  local p="$1"
  case "$p" in
    /*) echo "$p" ;;
    *)  echo "$PROJECT_DIR/$p" ;;
  esac
}

check_path() {
  local raw="$1"
  local op="$2"  # "read" | "write"
  [ -z "$raw" ] && return 0
  local p
  p=$(abs_path "$raw")

  # contexts/<slug>/ 검사
  case "$p" in
    "$PROJECT_DIR"/contexts/inbox/*|"$PROJECT_DIR"/contexts/inbox)
      return 0 ;;  # inbox는 자유 접근
    "$PROJECT_DIR"/contexts/*/*|"$PROJECT_DIR"/contexts/*)
      local slug
      slug=$(echo "$p" | sed -E "s|^$PROJECT_DIR/contexts/([^/]+).*|\1|")
      if [ "$slug" != "$ACTIVE_SLUG" ]; then
        deny "활성 작품 외 sandbox 접근" "$p (slug=$slug, active=$ACTIVE_SLUG)"
      fi
      if [ "$op" = "write" ]; then
        deny "활성 sandbox는 read-only" "$p"
      fi
      return 0
      ;;
    "$PROJECT_DIR"/output/*)
      local slug
      slug=$(echo "$p" | sed -E "s|^$PROJECT_DIR/output/([^/]+).*|\1|")
      if [ -n "$ACTIVE_SLUG" ] && [ "$slug" != "$ACTIVE_SLUG" ]; then
        deny "활성 작품 외 output 접근" "$p (slug=$slug, active=$ACTIVE_SLUG)"
      fi
      return 0
      ;;
    "$PROJECT_DIR"/.active-project)
      # loader/warden만 변경. 일반 도구 호출은 read만 허용.
      if [ "$op" = "write" ]; then
        echo "[firewall] WARN: .active-project write — loader/warden 의도가 맞는지 확인" >&2
      fi
      return 0
      ;;
    *)
      return 0 ;;  # 그 외 경로는 일반 작업 허용
  esac
}

# Bash 명령은 위험한 패턴 차단
check_bash() {
  local cmd="$1"
  [ -z "$cmd" ] && return 0

  # 활성 외 sandbox에 접근하는 명령 차단
  for slug_dir in "$PROJECT_DIR"/contexts/*/; do
    [ -d "$slug_dir" ] || continue
    local slug
    slug=$(basename "$slug_dir")
    [ "$slug" = "inbox" ] && continue
    if [ "$slug" != "$ACTIVE_SLUG" ]; then
      if echo "$cmd" | grep -qE "contexts/$slug(/|\$|\")"; then
        deny "Bash 명령이 활성 외 sandbox 참조" "$cmd"
      fi
    fi
  done

  # rm -rf, sudo 등 파괴적 명령은 경고만
  if echo "$cmd" | grep -qE '(rm[[:space:]]+-rf|sudo|mkfs|dd[[:space:]]+if=)'; then
    echo "[firewall] WARN: 파괴적 명령 의심 — 의도 확인" >&2
  fi
}

case "$TOOL_NAME" in
  Read|Glob|Grep)
    check_path "$TARGET_PATH" "read"
    ;;
  Write|Edit|MultiEdit)
    check_path "$TARGET_PATH" "write"
    ;;
  Bash)
    check_bash "$BASH_COMMAND"
    ;;
esac

exit 0
