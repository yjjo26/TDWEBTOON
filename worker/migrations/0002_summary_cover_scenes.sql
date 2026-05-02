-- Novel 카드용 추가 메타
ALTER TABLE novels ADD COLUMN summary TEXT NOT NULL DEFAULT '';
ALTER TABLE novels ADD COLUMN cover   TEXT NOT NULL DEFAULT 'slate';

-- 회차 안의 씬 (디자인 spec)
-- characters: JSON 배열 of character file IDs
CREATE TABLE IF NOT EXISTS scenes (
  id              TEXT PRIMARY KEY,
  episode_id      TEXT NOT NULL,
  novel_slug      TEXT NOT NULL,
  position        INTEGER NOT NULL DEFAULT 0,
  situation       TEXT NOT NULL DEFAULT '',
  setting         TEXT NOT NULL DEFAULT '',
  characters      TEXT NOT NULL DEFAULT '[]',
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  FOREIGN KEY (episode_id) REFERENCES files(id) ON DELETE CASCADE,
  FOREIGN KEY (novel_slug) REFERENCES novels(slug) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scenes_episode ON scenes (episode_id, position);
CREATE INDEX IF NOT EXISTS idx_scenes_novel   ON scenes (novel_slug);

-- 회차 정렬용 컬럼 (드래그 reorder)
ALTER TABLE files ADD COLUMN position INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_files_kind_position ON files (novel_slug, kind, position);
