#!/usr/bin/env bash
# prepare-context.sh
# UserPromptSubmit hook
#
# 사용자가 메시지를 입력할 때마다 자동 실행.
# 1) inbox/ 에 새 zip이 있으면 활성 작품 로드 트리거 (Claude에게 신호)
# 2) 활성 작품 컨텍스트 요약을 표준출력에 주입
# 3) 활성 작품이 없고 inbox도 비어있으면 안내

set -u

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
INBOX="$PROJECT_DIR/contexts/inbox"
ACTIVE_FILE="$PROJECT_DIR/.active-project"

# stdout으로 출력하는 내용은 Claude 컨텍스트에 주입됨
emit() {
  echo "<harness-context>"
  echo "$@"
  echo "</harness-context>"
}

# --- 1. inbox 검사 ---
if [ -d "$INBOX" ]; then
  ZIP_COUNT=$(find "$INBOX" -maxdepth 1 -name "*.zip" -type f 2>/dev/null | wc -l)
  if [ "$ZIP_COUNT" -gt 0 ]; then
    ZIPS=$(find "$INBOX" -maxdepth 1 -name "*.zip" -type f 2>/dev/null)
    emit "INBOX_NEW_ZIP_DETECTED: novel-context-loader skill을 호출하여 다음 zip을 로드해야 합니다.
zip 파일:
$ZIPS

조치: novel-context-loader skill의 단계를 따라 압축 해제 → sandbox 생성 → .active-project 갱신."
    exit 0
  fi
fi

# --- 2. 활성 작품 컨텍스트 주입 ---
if [ -f "$ACTIVE_FILE" ] && [ -s "$ACTIVE_FILE" ]; then
  ACTIVE_SLUG=$(head -n 1 "$ACTIVE_FILE" | tr -d '[:space:]')
  ACTIVE_DIR="$PROJECT_DIR/contexts/$ACTIVE_SLUG"

  if [ -d "$ACTIVE_DIR" ]; then
    MANIFEST="$ACTIVE_DIR/manifest.yaml"
    TITLE="$ACTIVE_SLUG"
    NEXT_EP="?"
    if [ -f "$MANIFEST" ]; then
      TITLE=$(grep -E '^title:' "$MANIFEST" | head -n 1 | sed 's/title:[[:space:]]*//' | tr -d '"' || echo "$ACTIVE_SLUG")
      NEXT_EP=$(grep -E '^next_episode:' "$MANIFEST" | head -n 1 | sed 's/next_episode:[[:space:]]*//' | tr -d '"' || echo "?")
    fi

    CHAR_COUNT=$(find "$ACTIVE_DIR" -name "*.md" -path "*characters*" 2>/dev/null | wc -l)
    WORLD_COUNT=$(find "$ACTIVE_DIR" -name "*.md" -path "*world*" 2>/dev/null | wc -l)
    EP_COUNT=$(find "$ACTIVE_DIR" -name "*.md" -path "*episodes*" 2>/dev/null | wc -l)

    emit "ACTIVE_PROJECT: $ACTIVE_SLUG
TITLE: $TITLE
NEXT_EPISODE: $NEXT_EP
CHARACTERS_LOADED: $CHAR_COUNT
WORLD_DOCS_LOADED: $WORLD_COUNT
PREVIOUS_EPISODES: $EP_COUNT
SANDBOX: $ACTIVE_DIR (read-only)
OUTPUT_LOCATION: $PROJECT_DIR/output/$ACTIVE_SLUG/

지침: 사용자가 '지침에 따라 소설을 작성해'라고 말하면 episode-writer skill을 따라 다음 회차($NEXT_EP화)를 작성하세요. 컨텍스트 외부 정보는 절대 사용하지 마세요. 결과물은 output-formatter skill을 따라 $PROJECT_DIR/output/$ACTIVE_SLUG/$NEXT_EP화/ 에만 저장하세요."
    exit 0
  else
    emit "WARNING: .active-project가 '$ACTIVE_SLUG'를 가리키지만 sandbox 디렉터리가 없습니다. isolation-warden 에이전트를 호출하여 무결성을 점검하세요."
    exit 0
  fi
fi

# --- 3. 활성 작품 없음 + inbox 비어있음 ---
emit "NO_ACTIVE_PROJECT: 활성 작품이 없으며 inbox도 비어있습니다.
사용자가 회차 작성을 요청하면 다음을 안내하세요:
1. 작품 zip을 contexts/inbox/<제목>.zip 에 드롭하세요
2. 메시지를 다시 보내세요
zip 없이는 회차 작성을 시작하지 마세요 (CLAUDE.md §6 Context Before Composition)."
exit 0
