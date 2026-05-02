-- 소설(작품) 단위
CREATE TABLE IF NOT EXISTS novels (
  slug          TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  next_episode  INTEGER NOT NULL DEFAULT 1,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

-- 파일 (줄거리/캐릭터/배경/회차) — kind+key 로 고유
-- kind: 'synopsis' | 'character' | 'world' | 'episode'
-- key:
--   synopsis : 'main' (소설당 1개)
--   character: 캐릭터 이름 슬러그 (예: '도깨')
--   world    : '<카테고리>/<항목>' 또는 '<카테고리>' (계층은 / 로 구분)
--   episode  : 회차 번호 문자열 (예: '5')
CREATE TABLE IF NOT EXISTS files (
  id              TEXT PRIMARY KEY,
  novel_slug      TEXT NOT NULL,
  kind            TEXT NOT NULL,
  key             TEXT NOT NULL,
  title           TEXT NOT NULL,
  content         TEXT NOT NULL DEFAULT '',
  current_version INTEGER NOT NULL DEFAULT 1,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  FOREIGN KEY (novel_slug) REFERENCES novels(slug) ON DELETE CASCADE,
  UNIQUE (novel_slug, kind, key)
);

-- 파일의 버전별 스냅샷 (롤백용 — 모든 update 마다 1행 추가)
CREATE TABLE IF NOT EXISTS file_versions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id     TEXT NOT NULL,
  version     INTEGER NOT NULL,
  content     TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  created_by  TEXT,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  UNIQUE (file_id, version)
);

-- 변경 로그 (모든 CRUD)
CREATE TABLE IF NOT EXISTS logs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  novel_slug      TEXT NOT NULL,
  timestamp       INTEGER NOT NULL,
  action          TEXT NOT NULL,           -- 'create' | 'update' | 'delete' | 'rollback'
  target_kind     TEXT NOT NULL,           -- 'novel' | 'synopsis' | 'character' | 'world' | 'episode' | 'title'
  target_id       TEXT,                    -- files.id (해당시)
  description     TEXT NOT NULL,
  user_label      TEXT,                    -- 누구의 변경인지 (자유 라벨)
  before_version  INTEGER,
  after_version   INTEGER,
  FOREIGN KEY (novel_slug) REFERENCES novels(slug) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_files_novel_kind  ON files (novel_slug, kind);
CREATE INDEX IF NOT EXISTS idx_versions_file     ON file_versions (file_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_logs_novel_ts     ON logs (novel_slug, timestamp DESC);
