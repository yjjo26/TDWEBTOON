# Novel Writing Harness

작품 컨텍스트(zip)를 입력으로, 새 회차를 `/output/`으로 출력하는 Claude Code 하네스.

## 사용법 (3단계)

1. 작품 zip을 `contexts/inbox/<제목>.zip`에 드롭
2. Claude Code 실행
3. 프롬프트 입력: **`지침에 따라 소설을 작성해.`**

끝. 결과는 `output/<slug>/<n>화/`에 생성된다.

## zip 입력 형식

zip 안에 다음 파일들이 들어있어야 한다 (파일명은 가이드, 정확한 이름은 무관):

```
<제목>.zip
├── manifest.yaml             (선택) 메타: title, slug, next_episode 등
├── storytelling_style.md     필수: 작품 전반의 톤·문체·시점
├── characters/               필수: 캐릭터별 .md
│   ├── 도깨.md
│   ├── 구미호.md
│   └── ...
├── world/                    필수: 세계관·배경
│   ├── X여관.md
│   ├── places.md
│   └── lore.md
└── episodes/                 이전 회차들
    ├── 1화.md
    ├── 2화.md
    └── ...
```

`manifest.yaml`이 없으면 harness가 zip 이름·내용으로 추론한다.

## 출력 형식

`output/<slug>/<n>화/`:
```
<제목>_<n>화.md                # 회차 본문
<제목>_<n>화_hook.md           # 회차 hook
<제목>_<n>화_<character>.md    # 회차에 등장한 캐릭터별 컨텍스트
```

## 디렉터리 구조

```
.
├── CLAUDE.md                       # 행동 원칙 (slim)
├── .claude/
│   ├── settings.json               # hooks 등록
│   ├── agents/                     # subagents
│   │   ├── style-keeper.md
│   │   ├── consistency-auditor.md
│   │   └── isolation-warden.md
│   ├── skills/                     # 재사용 skills
│   │   ├── novel-context-loader/
│   │   ├── project-isolation/
│   │   ├── episode-writer/
│   │   ├── output-formatter/
│   │   └── consistency-rules/
│   └── hooks/                      # 자동 트리거 스크립트
│       ├── prepare-context.sh
│       ├── firewall.sh
│       ├── audit-output.sh
│       └── archive.sh
├── contexts/
│   ├── inbox/                      # ← zip 드롭 위치
│   └── <slug>/                     # zip 풀린 작품 sandbox
├── output/                         # ← 결과물
└── .active-project                 # 현재 활성 작품 slug
```

## 격리 보장

- 활성 작품은 `.active-project`에 기록된 slug **하나뿐**
- 활성 외 `contexts/<other-slug>/` 접근은 `firewall` hook이 차단
- `/output/` 외 위치에 결과물 쓰기 차단
- 작품 전환은 새 zip 또는 명시적 명령으로만
