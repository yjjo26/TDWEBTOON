#!/usr/bin/env bash
# audit-output.sh
# PostToolUse hook (Write|Edit)
#
# /output/<active>/<n>화/<title>_<n>화.md 가 새로 작성/수정되면
# consistency-auditor 에이전트 호출을 Claude에게 신호한다.

set -u

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
ACTIVE_FILE="$PROJECT_DIR/.active-project"

INPUT=$(cat || true)

TARGET_PATH=""
if command -v jq >/dev/null 2>&1; then
  TARGET_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""' 2>/dev/null || echo "")
else
  TARGET_PATH=$(echo "$INPUT" | grep -oE '"(file_path|path)"[[:space:]]*:[[:space:]]*"[^"]*"' | head -n1 | sed 's/.*"\([^"]*\)"$/\1/')
fi

[ -z "$TARGET_PATH" ] && exit 0

ACTIVE_SLUG=""
if [ -f "$ACTIVE_FILE" ] && [ -s "$ACTIVE_FILE" ]; then
  ACTIVE_SLUG=$(head -n 1 "$ACTIVE_FILE" | tr -d '[:space:]')
fi
[ -z "$ACTIVE_SLUG" ] && exit 0

# 회차 본문 파일 패턴 매칭: output/<slug>/<n>화/<title>_<n>화.md
if echo "$TARGET_PATH" | grep -qE "output/$ACTIVE_SLUG/[0-9]+화/.*_[0-9]+화\.md$"; then
  EP_NUM=$(echo "$TARGET_PATH" | grep -oE '[0-9]+화' | head -n1 | tr -d '화')
  echo "<harness-context>"
  echo "EPISODE_WRITTEN: $EP_NUM화 본문이 작성되었습니다 ($TARGET_PATH)."
  echo "다음 단계:"
  echo "1) output-formatter skill에 따라 hook.md, 캐릭터별.md, meta.yaml, zip을 생성"
  echo "2) consistency-auditor 에이전트 호출하여 일관성 감사"
  echo "3) (선택) style-keeper 에이전트 호출하여 스타일 감사"
  echo "감사 결과를 사용자에게 보고하세요."
  echo "</harness-context>"
fi

exit 0
