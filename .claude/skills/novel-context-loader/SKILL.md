---
name: novel-context-loader
description: contexts/inbox/ 에 새 zip이 들어왔을 때 압축 해제, sandbox 생성, 매니페스트 인식, .active-project 갱신을 담당. zip 입력 흐름의 진입점이며 prepare-context hook과 함께 작동한다. 사용자가 "지침에 따라 소설을 작성해"라고 했을 때, 또는 "zip 로드", "작품 불러와" 등을 요청했을 때 호출된다.
---

# Novel Context Loader

작품 zip을 `contexts/<slug>/` sandbox로 풀고 활성화하는 skill.

## When to invoke

- `prepare-context` hook이 `contexts/inbox/`에서 새 zip을 감지했을 때
- 사용자가 "작품 로드", "zip 불러와", "다른 작품으로 전환" 등을 요청할 때
- `.active-project`가 비어있고 inbox에 zip이 있을 때

## Steps

### 1. zip 검증 (실패 시 거부)

- [ ] `contexts/inbox/*.zip` 검색
- [ ] 두 개 이상이면 사용자에게 어느 것을 로드할지 확인
- [ ] zip slip 검사: 모든 entry path가 상대경로이며 `..` 포함 안 함
- [ ] 깨진 zip / 빈 zip 거부
- [ ] 최소 요구 파일 존재 확인:
  - `storytelling_style.md` (또는 `*_storytelling_style.md`)
  - `characters/` 또는 `*_<character>.md` 형식 파일 1개 이상

### 2. slug 결정

우선순위:
1. zip 내 `manifest.yaml` 의 `slug` 필드
2. zip 파일명 (확장자 제거, 한글→로마자, 공백→`-`)
3. 사용자에게 확인

slug는 `[a-z0-9-]+` 만 허용. 충돌 시 `-2`, `-3` 등 suffix.

### 3. Sandbox 생성

- [ ] `contexts/<slug>/` 디렉터리 생성 (이미 있으면 사용자에게 덮어쓸지 확인)
- [ ] zip을 `contexts/<slug>/`에 풀기
- [ ] read-only 권한 권장 (`chmod -R a-w`) — 입력은 절대 변경 안 함
- [ ] `contexts/<slug>/.loaded-at` 타임스탬프 기록
- [ ] zip 원본은 `contexts/inbox/.processed/` 로 이동 (재로드 가능하게 보존)

### 4. 매니페스트 인식

`contexts/<slug>/manifest.yaml`이 있으면 그대로 사용. 없으면 자동 생성:

```yaml
title: "<zip에서 추론한 작품명>"
slug: "<slug>"
files:
  storytelling_style: "storytelling_style.md"
  characters:
    - "characters/도깨.md"
    - "characters/구미호.md"
  world:
    - "world/X여관.md"
  episodes:
    - { number: 1, file: "episodes/1화.md" }
    - { number: 2, file: "episodes/2화.md" }
next_episode: <episodes 중 max(number) + 1, 없으면 1>
```

- [ ] 매니페스트 파일 카운트와 실제 디렉터리 카운트 일치 검증
- [ ] 누락된 파일 발견 시 사용자에게 보고

### 5. 활성화

- [ ] `.active-project` 파일에 slug 한 줄 기록
- [ ] 이전 활성 작품이 있었다면 `.active-project.previous` 로 이동
- [ ] 활성화 완료 메시지: "작품 '<title>' 로드 완료. 다음 회차: <next_episode>화"

## Refusals

다음 경우 스스로 진행하지 말고 사용자에게 확인:

- inbox에 zip이 0개일 때 → 작업 진행 못함을 알림
- inbox에 zip이 2개 이상일 때 → 어느 것을 로드할지 묻기
- 동일 slug sandbox가 이미 존재할 때 → 덮어쓸지 / 다른 slug 쓸지 묻기
- 매니페스트와 실제 파일이 어긋날 때 → 차이를 보여주고 진행 여부 확인

## Boundary

- 이 skill은 **로드만** 한다. 회차 작성은 `episode-writer` skill 담당.
- sandbox 생성 후 절대 sandbox 내용을 수정하지 않는다 (read-only).
- `output/`에 아무것도 쓰지 않는다.
