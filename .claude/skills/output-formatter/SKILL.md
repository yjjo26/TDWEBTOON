---
name: output-formatter
description: 작성된 회차를 /output/<slug>/<n>화/ 디렉터리에 정해진 파일명 규약대로 저장하는 skill. episode-writer 다음 단계로 호출된다. 본문·hook·캐릭터별 분리 .md 생성, manifest.yaml 갱신, zip 패키징을 담당한다.
---

# Output Formatter

회차 결과물을 `/output/`에 규약된 형식으로 저장.

## Output location (strict)

```
output/<slug>/<n>화/
├── <title>_<n>화.md                # 회차 본문
├── <title>_<n>화_hook.md           # 회차의 hook
├── <title>_<n>화_<character>.md    # 회차 등장 캐릭터별
├── <title>_<n>화.meta.yaml         # 메타 (생성 시각, 등장 캐릭터 등)
└── <title>_<n>화.zip               # 위 .md들을 묶은 다운로드용 zip
```

다른 위치에 절대 쓰지 않는다. `/output/` 외 위치 쓰기는 `firewall` hook이 차단.

## Filename rules

- `<title>`: `manifest.yaml`의 `title`. 공백·특수문자는 `_` 로 치환.
- `<n>`: 회차 번호 (정수, 0-padding 없음. 예: `5화`, `12화`)
- `<character>`: 캐릭터 슬러그. 한글이면 그대로 (`도깨`, `구미호`), 영문이면 lowercase.

예:
```
네온타짜_5화.md
네온타짜_5화_hook.md
네온타짜_5화_도깨.md
네온타짜_5화_구미호.md
네온타짜_5화_X여관.md   # 장소도 같은 패턴 (선택)
```

## Per-file content rules

### `<title>_<n>화.md` (본문)
- 회차 전체 본문. 마크다운 헤더는 사용하지 않음 (LLM 입력 시 노이즈가 됨).
- 첫 줄에 회차 번호와 부제목만: `# <n>화 — <부제>`
- 그 외 일반 산문.

### `<title>_<n>화_hook.md`
- 한 단락으로 회차의 hook을 명시.
- hook 정의는 `manifest.yaml` 또는 `storytelling_style.md`의 `hook_position`을 따름:
  - `opening`: 회차 도입 후킹
  - `closing`: 회차 끝 떡밥 (default)
  - `meta`: 회차의 핵심 매혹 포인트 별도 메모

### `<title>_<n>화_<character>.md`
- 해당 캐릭터가 이번 회차에 어떻게 등장했는지 컨텍스트.
- 구성:
  ```
  # <character> — <n>화 컨텍스트
  ## 등장 장면
  - <간략 기록>
  ## 발화 요지
  - <간략 기록>
  ## 상태 변화
  - <감정·관계·소속의 변화>
  ## 다음 화 시작 시점 상태
  - <continuation hint>
  ```
- 이는 외부 LLM에 다음 회차 작성 의뢰 시 캐릭터 일관성 유지용.

### `<title>_<n>화.meta.yaml`
```yaml
slug: <slug>
title: <title>
episode: <n>
written_at: <ISO timestamp>
characters_present: [<list>]
locations: [<list>]
hook_type: <opening|closing|meta>
consistency_audit:
  passed: <bool>
  warnings: [<list>]
```

### `<title>_<n>화.zip`
- 위 모든 .md를 묶은 zip. 외부 LLM 또는 다른 도구에 던지기 편한 단일 다운로드.

## Post-write actions

- [ ] `contexts/<slug>/manifest.yaml`의 `next_episode` 를 +1
  - 단, `contexts/`는 read-only 원칙. **manifest는 예외**로 갱신 허용 (또는 갱신본을 `output/<slug>/manifest.next.yaml`에 저장하고 사용자가 다음 zip 만들 때 반영)
  - 권장: **출력 쪽**에만 기록하고 입력 sandbox는 건드리지 않음. `output/<slug>/manifest.next.yaml` 사용.
- [ ] 사용자에게 결과 경로 보고:
  ```
  <n>화 작성 완료.
  /output/<slug>/<n>화/
    - <title>_<n>화.md (<word_count>자)
    - <title>_<n>화_hook.md
    - <title>_<n>화_<character>.md ×<count>
    - <title>_<n>화.zip (다운로드용)
  ```

## Refusals

- `/output/` 외 위치 쓰기 요청 → 거부
- 활성 작품 외 slug로 쓰기 요청 → 거부
- 같은 회차 번호의 결과물이 이미 존재 → 사용자에게 덮어쓸지 / 다음 번호로 갈지 묻기
