---
name: project-isolation
description: 활성 작품 sandbox 외의 contexts/ 경로 접근을 차단하는 격리 정책. cross-contamination 방지가 본 harness의 핵심 가치이며, 모든 파일 접근은 이 skill의 규칙을 통과해야 한다. firewall hook이 이 skill의 규칙을 자동 적용한다. 사용자가 "다른 작품 봐", "이전 작품 참조" 등 격리 위반 요청을 할 때도 이 skill이 거부 근거를 제공한다.
---

# Project Isolation

활성 작품 외 sandbox 접근을 막는 격리 정책. 본 harness의 존재 이유.

## Core rule

`contexts/<slug>/` 경로 접근은 **`.active-project`에 기록된 slug와 일치할 때만** 허용한다.

```
.active-project = "neon-tajja"

contexts/neon-tajja/...      → 허용 (read-only)
contexts/paleo/...            → 차단
contexts/inbox/...            → 허용 (loader만)
contexts/inbox/.processed/... → 허용 (loader만)
```

## Allowed operations matrix

| 위치 | Read | Write | 비고 |
|---|---|---|---|
| `contexts/<active>/` | ✓ | ✗ | 입력은 read-only |
| `contexts/<other>/` | ✗ | ✗ | 격리 위반 |
| `contexts/inbox/` | ✓ | ✓ | loader만 |
| `output/<active>/` | ✓ | ✓ | 결과물 |
| `output/<other>/` | ✗ | ✗ | 다른 작품 결과물 접근 금지 |
| `.active-project` | ✓ | ✓ | loader만 write |
| `.claude/`, `CLAUDE.md`, `README.md` | ✓ | ✗ | 시스템 파일 |
| 그 외 (소스코드 등) | ✓ | ✓ | 일반 작업 |

## Enforcement

`firewall` hook이 모든 Read/Write/Edit/Bash 도구 호출 직전에 이 규칙을 검사한다.

위반 감지 시:
1. 도구 호출 거부
2. 위반 경로와 활성 작품 slug를 사용자에게 보고
3. 의도적이라면 명시적 작품 전환 요청을 안내

## Active project switch

작품 전환은 다음 두 가지 경로로만:

1. **새 zip 로드**: `contexts/inbox/`에 새 zip이 들어오면 `novel-context-loader`가 처리하며 `.active-project`를 갱신
2. **명시적 명령**: 사용자가 "작품을 <slug>로 전환" 요청 시:
   - [ ] 현재 활성 작품의 미저장 작업이 있는지 확인
   - [ ] 있으면 사용자에게 보고하고 진행 여부 묻기
   - [ ] `.active-project` 갱신, 이전 값은 `.active-project.previous`에 보관
   - [ ] 컨텍스트 전환 완료 보고

추론·자동 전환 절대 금지. "이전 작품에서는..." 같은 발화도 격리 위반으로 간주.

## Read access edge cases

- **`output/<active>/` 의 이전 회차**: 허용. 같은 작품의 이전 결과물은 컨텍스트로 활용 가능
- **`contexts/inbox/.processed/<slug>.zip`**: 활성 작품의 원본 zip 재참조 시 허용
- **다른 작품의 어떤 파일이든**: 항상 거부

## Failure modes (회피해야 할 패턴)

- "참고만 잠깐" — 거부
- "비교를 위해" — 거부
- "공통 캐릭터가 있어서" — 거부 (각 작품에 별도 정의 필요)
- "스타일 학습" — 거부
- "이전에 다른 작품에서 봤던" — 거부

이런 요청이 오면 사용자에게 명시적 작품 전환 또는 두 작품 모두에 동일 정의 포함을 안내한다.
