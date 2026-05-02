---
name: consistency-rules
description: 작성된 회차가 활성 작품의 캐릭터 .md, 세계관 .md, 이전 회차들과 충돌하는지 검사하는 룰 모음. consistency-auditor agent가 이 룰을 사용한다. audit-output hook이 작성 직후 자동 실행한다. 사용자가 "일관성 검사", "검증해줘" 등을 요청할 때도 호출된다.
---

# Consistency Rules

작성된 회차의 일관성 검증 룰. `consistency-auditor` agent가 이 룰을 가지고 감사한다.

## Rule categories

### A. Character consistency

각 캐릭터 .md를 진실원천으로 본다.

- **A1. 이름·호칭**: 캐릭터의 정식 이름, 별명, 직책이 캐릭터 .md와 일치하는가
- **A2. 말투**: 캐릭터 .md에 명시된 말투(존댓말/반말, 사투리, 어투 특징)와 회차 본문의 발화가 일치하는가
- **A3. 외형**: 머리색·눈색·체격·복장 등 외형 묘사가 일치하는가
- **A4. 관계**: 다른 캐릭터와의 관계(가족·친구·적대·연인 등)가 일치하는가
- **A5. 능력·소속**: 캐릭터의 능력·직업·소속 조직이 일치하는가
- **A6. 금기 행동**: 캐릭터 .md에 명시된 금기(절대 하지 않는 것)를 회차에서 위반하지 않는가

### B. World consistency

세계관 .md (`world/*.md`)를 진실원천으로 본다.

- **B1. 장소 묘사**: 무대 장소의 묘사(분위기·구조·특징)가 세계관 .md와 일치하는가
- **B2. 세계 규칙**: 마법·기술·사회 규칙·물리 법칙이 일치하는가
- **B3. 시간선**: 회차 시점이 작품 타임라인과 일치하는가

### C. Continuity

이전 회차 .md를 진실원천으로 본다.

- **C1. 사실 일관성**: 이전 회차에서 일어난 사건을 변경·재해석하지 않았는가
- **C2. 떡밥 처리**: 이전 회차의 미해결 떡밥을 무시하지 않았는가 (의도적 보류는 OK, 망각은 NG)
- **C3. 캐릭터 상태**: 이전 회차 끝의 캐릭터 상태(위치·부상·감정·관계)가 이번 회차 시작과 연결되는가
- **C4. 시점 인물**: 시점 인물 전환이 작품 규칙(`storytelling_style.md`)을 따르는가

### D. Style adherence

`storytelling_style.md`를 진실원천으로 본다. (세부 검증은 `style-keeper` agent 담당)

- **D1. 시점**: 1인칭/3인칭, 제한/전지 여부 일치
- **D2. 문체·톤**: 명시된 문체 특성과 어긋나지 않는가
- **D3. 문장 호흡**: 평균 문장 길이·단락 패턴이 작품 평균과 크게 다르지 않은가

### E. Out-of-scope additions (가장 중요)

- **E1. 새 캐릭터**: 컨텍스트에 없는 새 캐릭터를 도입하지 않았는가
- **E2. 새 장소**: 컨텍스트에 없는 새 장소를 도입하지 않았는가
- **E3. 새 설정**: 컨텍스트에 없는 새 세계관 요소·고유명사를 만들지 않았는가

E 위반은 가장 흔하고 가장 치명적. 발견 시 무조건 사용자에게 보고.

## Severity levels

| 레벨 | 기준 | 대응 |
|---|---|---|
| `error` | A6, E1~E3, C1 위반 | 자동 거부, 회차 폐기 또는 재작성 |
| `warning` | A1~A5, B1~B3, C2~C4 위반 | 사용자에게 보고, 진행 여부 확인 |
| `notice` | D1~D3 위반 | 보고만, 자동 진행 |

## Audit output format

`audit-output` hook이 작성 직후 자동 실행하며 다음 형식으로 보고:

```yaml
audit:
  episode: <n>
  passed: <bool>
  findings:
    - rule: A2
      severity: warning
      character: 도깨
      detail: "캐릭터 .md에는 반말 어투 명시. 회차 본문 32번 발화에서 존댓말 사용."
      location: "<title>_<n>화.md line 142"
    - rule: E1
      severity: error
      detail: "캐릭터 .md에 없는 인물 '월화'가 회차에 등장."
      location: "<title>_<n>화.md line 89"
```

## Boundary

- 이 skill은 **룰 정의**만 한다. 실제 검증은 `consistency-auditor` agent가 LLM 추론으로 수행.
- 룰을 추가/수정하려면 이 SKILL.md를 직접 수정. 룰 변경은 `[Prompt]` 트래킹 가능한 커밋으로 기록 권장.
