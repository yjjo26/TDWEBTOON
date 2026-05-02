# CLAUDE.md

Behavioral guidelines for the **novel-writing harness**.
사용자는 단 하나의 프롬프트만 입력한다: **"지침에 따라 소설을 작성해."**
나머지는 hooks · skills · agents가 자동으로 처리한다.

이 문서는 **how**만 담는다. **what**(작품 컨텍스트, 출력 형식, 격리 규칙)은 위임된다 — §Enforcement Map 참조.

**Tradeoff:** 일관성·격리 > 속도. 모호하면 멈춰서 묻는다. 작품 경계가 의심스러우면 즉시 중단.

---

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- 회차 작성에서도 동일: 컨텍스트가 요구하지 않은 새 캐릭터·세계관·설정 추가 금지.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

- Don't "improve" adjacent code, comments, or content.
- Don't refactor things that aren't broken.
- 회차 작성 시 이전 회차의 내용을 임의로 수정·재해석 금지.
- 기존 캐릭터·세계관 .md를 작성 과정에서 변경 금지 (입력은 read-only).

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

- "회차 작성" → "활성 작품의 스타일·캐릭터·세계관·이전 회차와 충돌 없는 새 회차 1편을 `/output/`에 규약된 형식으로 저장. `consistency-auditor` 통과."
- 강한 success criteria가 있으면 자율 루프 가능. 약하면 명확화 질문.

---

## 5. Korean by Default

**Respond, document, commit, and write fiction in Korean.**

- 모든 응답·로그·커밋·작품 본문은 한국어.
- 코드 식별자, 파일명 슬러그, 약어만 영문.
- 사용자가 명시적으로 영문 요청한 경우에만 영문.

## 6. Context Before Composition

**No fiction without loaded context. The active project's docs are the source of truth.**

- 활성 작품의 컨텍스트(스타일·캐릭터·세계관·이전 회차)가 로드되지 않은 상태에서 회차 작성 금지.
- 컨텍스트에 없는 사실(새 캐릭터, 새 장소, 새 설정)은 만들지 않는다. 모르면 컨텍스트를 가리킨다.
- 캐릭터의 말투·관계·소속·외형은 캐릭터 .md를 따른다. 헷갈리면 멈추고 묻는다.
- Enforced by: `novel-context-loader` skill, `episode-writer` skill, `prepare-context` hook.

## 7. Project Isolation (Core Value)

**One active project at a time. Never cross-contaminate.**

본 harness의 존재 이유. 작품 A의 캐릭터·스타일이 작품 B로 새는 순간 결과물이 무너진다.

- 작품은 zip 단위로 `contexts/inbox/`에 들어와 `contexts/<slug>/` sandbox로 풀린다.
- 활성 작품은 `.active-project`에 단 하나만 기록.
- 활성 외 sandbox에 대한 read/write는 무조건 거부.
- 작품 전환은 새 zip 입력 또는 명시적 명령으로만. 추론·자동 전환 금지.
- 두 작품의 컨텍스트를 동시에 들고 있지 않는다.
- Enforced by: `project-isolation` skill, `isolation-warden` agent, `firewall` hook.

## 8. Output Discipline

**All deliverables go to `/output/`. Nowhere else.**

- 회차 본문·캐릭터별 분리·hook 등 모든 산출물은 `/output/<slug>/<n>화/`에만 쓴다.
- `/contexts/`는 입력 sandbox다. 작성 결과를 여기에 쓰지 않는다.
- 파일명 규약은 `output-formatter` skill이 강제.
- Enforced by: `output-formatter` skill, `firewall` hook.

---

## Enforcement Map

본 CLAUDE.md는 행동 원칙만 담는다. 구체 규칙은 다음에 위임된다:

| 영역 | 위임 대상 |
|---|---|
| zip 입력 → sandbox 압축 해제 · 활성화 | `novel-context-loader` skill · `prepare-context` hook |
| 활성 작품 컨텍스트 자동 주입 | `prepare-context` hook |
| 작품 격리 (cross-contamination 차단) | `project-isolation` skill · `isolation-warden` agent · `firewall` hook |
| 회차 작성 워크플로우 | `episode-writer` skill |
| 결과물 위치·파일명 규약 | `output-formatter` skill · `firewall` hook |
| 일관성 검증 룰 (캐릭터·세계관·이전 회차) | `consistency-rules` skill · `consistency-auditor` agent · `audit-output` hook |
| 스타일 준수 감사 | `style-keeper` agent |

새 규칙이 필요하면 **CLAUDE.md를 부풀리지 말고** 새 skill/agent/hook으로 분리한다.

---

**This harness is working if:**
- 사용자가 "지침에 따라 소설을 작성해." 한 줄만 입력하고도 회차가 `/output/`에 나온다
- 작품 A의 캐릭터·스타일이 작품 B로 새지 않는다
- 회차가 바뀌어도 같은 형식·같은 톤으로 일관되게 출력된다
- 컨텍스트에 없는 새 사실을 마음대로 만들지 않는다
