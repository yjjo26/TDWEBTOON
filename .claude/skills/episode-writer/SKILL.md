---
name: episode-writer
description: 활성 작품의 컨텍스트(스타일·캐릭터·세계관·이전 회차)를 바탕으로 새 회차를 작성하는 워크플로우. 사용자가 "지침에 따라 소설을 작성해", "다음 회차 써", "n화 작성" 등을 요청할 때 호출된다. output-formatter, consistency-rules, style-keeper와 협력한다.
---

# Episode Writer

활성 작품의 다음 회차를 작성하는 워크플로우.

## Pre-flight (작성 전 검증)

작성 시작 전 다음을 모두 확인. 하나라도 실패하면 멈추고 사용자에게 보고.

- [ ] `.active-project`에 slug가 기록되어 있는가
- [ ] `contexts/<slug>/`가 존재하는가
- [ ] `manifest.yaml` 또는 자동 추론된 매니페스트가 유효한가
- [ ] `storytelling_style.md`가 로드되었는가 (필수)
- [ ] 캐릭터 .md 파일이 1개 이상 로드되었는가 (필수)
- [ ] 작성할 회차 번호가 결정되었는가 (`manifest.yaml` 의 `next_episode` 또는 max+1)

## Composition workflow

### 1. 컨텍스트 흡수

- [ ] `storytelling_style.md` 정독: 시점·문체·톤·문장 길이 패턴·고유 표현 추출
- [ ] 모든 `characters/*.md` 정독: 등장 캐릭터·말투·관계·금기
- [ ] `world/*.md` 정독: 장소·설정·세계관 규칙
- [ ] 가장 최근 N개 회차 (`manifest.yaml` 의 `episodes` 중 마지막 3~5편) 정독: 직전 사건·미해결 떡밥·시점 인물

### 2. 회차 계획 (사용자에게 제시 후 승인 대기)

작성 시작 전 짧은 계획을 사용자에게 제시:

```
다음 회차 계획 (<n>화):
- 등장 캐릭터: <list>
- 무대: <location>
- 핵심 사건: <one line>
- 직전 회차의 떡밥 처리: <one line>
- 회차 hook (끝맺음 방향): <one line>
승인하면 작성 시작합니다.
```

사용자가 승인하면 작성 진행. 수정 요청이 있으면 반영 후 재제시.

### 3. 작성 (constraints)

다음을 **반드시** 지킨다:

- 컨텍스트에 없는 새 캐릭터·새 장소·새 설정 도입 금지
- 캐릭터의 말투·소속·외형은 캐릭터 .md에 명시된 대로
- 시점·문체·문장 호흡은 `storytelling_style.md`에 명시된 대로
- 이전 회차에서 일어난 사실을 임의 변경·재해석 금지
- 작품 본문은 한국어 (§5 of CLAUDE.md)

회차 분량은 `manifest.yaml`의 `target_length`를 따른다. 없으면 기존 회차들의 평균.

### 4. 결과물 저장 (output-formatter에 위임)

작성된 본문을 `output-formatter` skill에 넘겨 정해진 형식으로 `/output/<slug>/<n>화/`에 저장.

### 5. 일관성 감사 (consistency-auditor agent에 위임)

저장 후 `consistency-auditor` agent를 호출하여 다음 검증:

- 캐릭터 발화·행동이 캐릭터 .md와 모순되는지
- 세계관 규칙 위반이 있는지
- 이전 회차와 사실 충돌이 있는지
- `storytelling_style.md` 톤·시점에서 벗어났는지

audit 결과 위반 발견 시 사용자에게 보고하고, 수정 또는 보존 여부를 묻는다.

## Refusals

- 컨텍스트가 로드되지 않은 상태에서 작성 요청 → 거부, loader 우선 실행
- 사용자가 컨텍스트와 충돌하는 내용을 강하게 요구 → 충돌 지점을 보여주고 컨텍스트 갱신(작품 .md 수정)이 먼저 필요함을 안내
- 작품 외부 자료(다른 zip의 캐릭터 등) 참조 요구 → §Project Isolation 위반, 거부

## Boundary

- 이 skill은 **작성 워크플로우만** 담당. 파일 저장 형식은 `output-formatter`에 위임. 일관성 검증은 `consistency-rules` skill / `consistency-auditor` agent에 위임.
- 격리 검증은 `project-isolation` skill / `firewall` hook이 백그라운드로 처리.
