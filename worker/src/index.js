// tdwebtoon-api — Cloudflare Worker
// 모든 데이터 변경은 자동으로 file_versions(스냅샷) + logs(이력)에 기록.
// kind: 'synopsis' | 'character' | 'world' | 'episode'
//   - synopsis: 소설당 1개 (key='main') — storytelling_style.md
//   - world   : 소설당 1개 (key='settings') — settings.md (디자인 spec)
//   - character: characters/<이름>.md
//   - episode : episodes/<n>화.md
// scenes 는 별도 테이블 — 회차에 종속되는 메타데이터.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

const VALID_KINDS = new Set(["synopsis", "character", "world", "episode"]);
const KIND_LABEL = {
  synopsis: "줄거리",
  character: "캐릭터",
  world: "배경",
  episode: "회차",
};

const json = (body, init = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...CORS_HEADERS,
      ...(init.headers || {}),
    },
  });

const bad = (status, message) => json({ error: message }, { status });
const nowMs = () => Date.now();

const toSlug = (s) =>
  (s || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣\-]/g, "")
    .slice(0, 60) || `novel-${Date.now().toString(36)}`;

const newId = () => crypto.randomUUID();

const COVER_OPTIONS = ["indigo", "rose", "teal", "amber", "slate"];

// ---------- Novels ----------
async function listNovels(env) {
  const { results } = await env.DB.prepare(
    "SELECT slug, title, summary, cover, next_episode, created_at, updated_at FROM novels ORDER BY updated_at DESC"
  ).all();
  return results;
}

async function getNovel(env, slug) {
  const novel = await env.DB.prepare(
    "SELECT slug, title, summary, cover, next_episode, created_at, updated_at FROM novels WHERE slug = ?"
  )
    .bind(slug)
    .first();
  if (!novel) return null;
  const { results: files } = await env.DB.prepare(
    "SELECT id, kind, key, title, content, current_version, position, created_at, updated_at FROM files WHERE novel_slug = ? ORDER BY kind, position, key"
  )
    .bind(slug)
    .all();
  // Scenes
  const { results: scenes } = await env.DB.prepare(
    "SELECT id, episode_id, position, situation, setting, characters, created_at, updated_at FROM scenes WHERE novel_slug = ? ORDER BY episode_id, position"
  )
    .bind(slug)
    .all();
  return { ...novel, files, scenes };
}

async function createNovel(env, { title, summary = "", cover = "" }) {
  if (!title || typeof title !== "string") throw new Error("title required");
  const ts = nowMs();
  let slug = toSlug(title);

  const existing = await env.DB.prepare(
    "SELECT slug FROM novels WHERE slug = ? OR slug LIKE ?"
  )
    .bind(slug, `${slug}-%`)
    .all();
  const taken = new Set(existing.results.map((r) => r.slug));
  if (taken.has(slug)) {
    let i = 2;
    while (taken.has(`${slug}-${i}`)) i++;
    slug = `${slug}-${i}`;
  }

  // 자동 cover 회전
  const total = await env.DB.prepare("SELECT COUNT(*) AS n FROM novels").first();
  const autoCover = COVER_OPTIONS[(total?.n || 0) % COVER_OPTIONS.length];
  const finalCover = cover || autoCover;

  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO novels (slug, title, summary, cover, next_episode, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)"
    ).bind(slug, title, summary, finalCover, ts, ts),
    env.DB.prepare(
      "INSERT INTO logs (novel_slug, timestamp, action, target_kind, description, user_label) VALUES (?, ?, 'create', 'novel', ?, 'me')"
    ).bind(slug, ts, `소설 '${title}' 생성`),
  ]);

  return {
    slug,
    title,
    summary,
    cover: finalCover,
    next_episode: 1,
    created_at: ts,
    updated_at: ts,
  };
}

async function updateNovel(env, slug, patch) {
  const before = await env.DB.prepare(
    "SELECT title, summary, cover FROM novels WHERE slug = ?"
  )
    .bind(slug)
    .first();
  if (!before) throw new Error("novel not found");

  const newTitle = patch.title !== undefined ? patch.title : before.title;
  const newSummary = patch.summary !== undefined ? patch.summary : before.summary;
  const newCover = patch.cover !== undefined ? patch.cover : before.cover;

  const titleChanged = newTitle !== before.title;
  const summaryChanged = newSummary !== before.summary;
  const coverChanged = newCover !== before.cover;
  if (!titleChanged && !summaryChanged && !coverChanged) return;

  const ts = nowMs();
  const stmts = [
    env.DB.prepare(
      "UPDATE novels SET title = ?, summary = ?, cover = ?, updated_at = ? WHERE slug = ?"
    ).bind(newTitle, newSummary, newCover, ts, slug),
  ];
  if (titleChanged) {
    stmts.push(
      env.DB.prepare(
        "INSERT INTO logs (novel_slug, timestamp, action, target_kind, description, user_label) VALUES (?, ?, 'update', 'title', ?, 'me')"
      ).bind(slug, ts, `제목 변경: '${before.title}' → '${newTitle}'`)
    );
  }
  if (summaryChanged) {
    stmts.push(
      env.DB.prepare(
        "INSERT INTO logs (novel_slug, timestamp, action, target_kind, description, user_label) VALUES (?, ?, 'update', 'novel', ?, 'me')"
      ).bind(slug, ts, `요약 수정`)
    );
  }
  if (coverChanged) {
    stmts.push(
      env.DB.prepare(
        "INSERT INTO logs (novel_slug, timestamp, action, target_kind, description, user_label) VALUES (?, ?, 'update', 'novel', ?, 'me')"
      ).bind(slug, ts, `커버 색 변경: '${before.cover}' → '${newCover}'`)
    );
  }
  await env.DB.batch(stmts);
}

async function deleteNovel(env, slug) {
  const novel = await env.DB.prepare("SELECT title FROM novels WHERE slug = ?")
    .bind(slug)
    .first();
  if (!novel) return;
  await env.DB.prepare("DELETE FROM novels WHERE slug = ?").bind(slug).run();
}

// ---------- Files ----------
async function listFiles(env, slug, kind) {
  const sql = kind
    ? "SELECT id, kind, key, title, current_version, position, created_at, updated_at FROM files WHERE novel_slug = ? AND kind = ? ORDER BY position, key"
    : "SELECT id, kind, key, title, current_version, position, created_at, updated_at FROM files WHERE novel_slug = ? ORDER BY kind, position, key";
  const stmt = kind
    ? env.DB.prepare(sql).bind(slug, kind)
    : env.DB.prepare(sql).bind(slug);
  const { results } = await stmt.all();
  return results;
}

async function getFile(env, slug, id) {
  return env.DB.prepare(
    "SELECT id, novel_slug, kind, key, title, content, current_version, position, created_at, updated_at FROM files WHERE novel_slug = ? AND id = ?"
  )
    .bind(slug, id)
    .first();
}

async function createFile(env, slug, { kind, key, title, content }) {
  if (!VALID_KINDS.has(kind)) throw new Error("invalid kind");
  if (!key) throw new Error("key required");
  const id = newId();
  const ts = nowMs();
  const safeContent = content || "";
  const safeTitle = title || key;

  // synopsis 는 소설당 1개 제한 (world/character/episode 는 다중)
  if (kind === "synopsis") {
    const exists = await env.DB.prepare(
      "SELECT id FROM files WHERE novel_slug = ? AND kind = 'synopsis'"
    )
      .bind(slug)
      .first();
    if (exists) throw new Error("synopsis already exists");
  }

  // 같은 kind 내 다음 position
  const maxPos = await env.DB.prepare(
    "SELECT COALESCE(MAX(position), 0) AS m FROM files WHERE novel_slug = ? AND kind = ?"
  )
    .bind(slug, kind)
    .first();
  const nextPos = (maxPos?.m || 0) + 1;

  try {
    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO files (id, novel_slug, kind, key, title, content, current_version, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)"
      ).bind(id, slug, kind, key, safeTitle, safeContent, nextPos, ts, ts),
      env.DB.prepare(
        "INSERT INTO file_versions (file_id, version, content, created_at) VALUES (?, 1, ?, ?)"
      ).bind(id, safeContent, ts),
      env.DB.prepare(
        "INSERT INTO logs (novel_slug, timestamp, action, target_kind, target_id, description, after_version, user_label) VALUES (?, ?, 'create', ?, ?, ?, 1, 'me')"
      ).bind(slug, ts, kind, id, `${KIND_LABEL[kind]} 추가: '${safeTitle}'`),
      env.DB.prepare("UPDATE novels SET updated_at = ? WHERE slug = ?").bind(
        ts,
        slug
      ),
    ]);
  } catch (e) {
    if (String(e).includes("UNIQUE")) {
      throw new Error(`이미 존재하는 ${KIND_LABEL[kind]} key: ${key}`);
    }
    throw e;
  }

  return {
    id,
    novel_slug: slug,
    kind,
    key,
    title: safeTitle,
    content: safeContent,
    current_version: 1,
    position: nextPos,
    created_at: ts,
    updated_at: ts,
  };
}

async function updateFile(env, slug, id, patch) {
  const before = await getFile(env, slug, id);
  if (!before) throw new Error("file not found");

  const newTitle = patch.title !== undefined ? patch.title : before.title;
  const newContent =
    patch.content !== undefined ? patch.content : before.content;
  const newKey = patch.key !== undefined ? patch.key : before.key;

  const titleChanged = newTitle !== before.title;
  const contentChanged = newContent !== before.content;
  const keyChanged = newKey !== before.key;
  if (!titleChanged && !contentChanged && !keyChanged) return before;

  const ts = nowMs();
  const newVersion = contentChanged
    ? before.current_version + 1
    : before.current_version;

  const changedFields = [];
  if (titleChanged) changedFields.push("title");
  if (keyChanged) changedFields.push("key");
  if (contentChanged) changedFields.push("content");

  const stmts = [
    env.DB.prepare(
      "UPDATE files SET title = ?, key = ?, content = ?, current_version = ?, updated_at = ? WHERE id = ?"
    ).bind(newTitle, newKey, newContent, newVersion, ts, id),
    env.DB.prepare(
      "INSERT INTO logs (novel_slug, timestamp, action, target_kind, target_id, description, before_version, after_version, user_label) VALUES (?, ?, 'update', ?, ?, ?, ?, ?, 'me')"
    ).bind(
      slug,
      ts,
      before.kind,
      id,
      `${KIND_LABEL[before.kind]} 수정: '${newTitle}' (${changedFields.join(", ")})`,
      before.current_version,
      newVersion
    ),
    env.DB.prepare("UPDATE novels SET updated_at = ? WHERE slug = ?").bind(
      ts,
      slug
    ),
  ];
  if (contentChanged) {
    stmts.push(
      env.DB.prepare(
        "INSERT INTO file_versions (file_id, version, content, created_at) VALUES (?, ?, ?, ?)"
      ).bind(id, newVersion, newContent, ts)
    );
  }

  await env.DB.batch(stmts);
  return {
    ...before,
    title: newTitle,
    key: newKey,
    content: newContent,
    current_version: newVersion,
    updated_at: ts,
  };
}

async function deleteFile(env, slug, id) {
  const before = await getFile(env, slug, id);
  if (!before) return;
  const ts = nowMs();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM files WHERE id = ?").bind(id),
    env.DB.prepare(
      "INSERT INTO logs (novel_slug, timestamp, action, target_kind, target_id, description, before_version, user_label) VALUES (?, ?, 'delete', ?, ?, ?, ?, 'me')"
    ).bind(
      slug,
      ts,
      before.kind,
      id,
      `${KIND_LABEL[before.kind]} 삭제: '${before.title}'`,
      before.current_version
    ),
    env.DB.prepare("UPDATE novels SET updated_at = ? WHERE slug = ?").bind(
      ts,
      slug
    ),
  ]);
}

// 회차 순서 변경 (드래그)
async function reorderEpisode(env, slug, fromId, toId) {
  if (!fromId || !toId || fromId === toId) return;
  const { results } = await env.DB.prepare(
    "SELECT id FROM files WHERE novel_slug = ? AND kind = 'episode' ORDER BY position, key"
  )
    .bind(slug)
    .all();
  const ids = results.map((r) => r.id);
  const fromIdx = ids.indexOf(fromId);
  const toIdx = ids.indexOf(toId);
  if (fromIdx === -1 || toIdx === -1) return;
  const [moved] = ids.splice(fromIdx, 1);
  ids.splice(toIdx, 0, moved);
  const ts = nowMs();
  const stmts = ids.map((id, i) =>
    env.DB.prepare("UPDATE files SET position = ? WHERE id = ?").bind(i + 1, id)
  );
  stmts.push(
    env.DB.prepare(
      "INSERT INTO logs (novel_slug, timestamp, action, target_kind, description, user_label) VALUES (?, ?, 'update', 'episode', '회차 순서 변경', 'me')"
    ).bind(slug, ts)
  );
  stmts.push(
    env.DB.prepare("UPDATE novels SET updated_at = ? WHERE slug = ?").bind(
      ts,
      slug
    )
  );
  await env.DB.batch(stmts);
}

// 씬 순서 변경 (드래그)
async function reorderScene(env, slug, episodeId, fromId, toId) {
  if (!fromId || !toId || fromId === toId) return;
  const { results } = await env.DB.prepare(
    "SELECT id FROM scenes WHERE novel_slug = ? AND episode_id = ? ORDER BY position, id"
  )
    .bind(slug, episodeId)
    .all();
  const ids = results.map((r) => r.id);
  const fromIdx = ids.indexOf(fromId);
  const toIdx = ids.indexOf(toId);
  if (fromIdx === -1 || toIdx === -1) return;
  const [moved] = ids.splice(fromIdx, 1);
  ids.splice(toIdx, 0, moved);
  const ts = nowMs();
  const stmts = ids.map((id, i) =>
    env.DB.prepare("UPDATE scenes SET position = ?, updated_at = ? WHERE id = ?")
      .bind(i + 1, ts, id)
  );
  stmts.push(
    env.DB.prepare(
      "INSERT INTO logs (novel_slug, timestamp, action, target_kind, target_id, description, user_label) VALUES (?, ?, 'update', 'episode', ?, '씬 순서 변경', 'me')"
    ).bind(slug, ts, episodeId)
  );
  stmts.push(
    env.DB.prepare("UPDATE novels SET updated_at = ? WHERE slug = ?").bind(ts, slug)
  );
  await env.DB.batch(stmts);
}

// ---------- Versions / Rollback ----------
async function listVersions(env, fileId) {
  const { results } = await env.DB.prepare(
    "SELECT version, content, created_at FROM file_versions WHERE file_id = ? ORDER BY version DESC"
  )
    .bind(fileId)
    .all();
  return results;
}

async function rollbackFile(env, slug, id, targetVersion) {
  const file = await getFile(env, slug, id);
  if (!file) throw new Error("file not found");
  const target = await env.DB.prepare(
    "SELECT content FROM file_versions WHERE file_id = ? AND version = ?"
  )
    .bind(id, targetVersion)
    .first();
  if (!target) throw new Error("version not found");

  const ts = nowMs();
  const newVersion = file.current_version + 1;
  await env.DB.batch([
    env.DB.prepare(
      "UPDATE files SET content = ?, current_version = ?, updated_at = ? WHERE id = ?"
    ).bind(target.content, newVersion, ts, id),
    env.DB.prepare(
      "INSERT INTO file_versions (file_id, version, content, created_at) VALUES (?, ?, ?, ?)"
    ).bind(id, newVersion, target.content, ts),
    env.DB.prepare(
      "INSERT INTO logs (novel_slug, timestamp, action, target_kind, target_id, description, before_version, after_version, user_label) VALUES (?, ?, 'rollback', ?, ?, ?, ?, ?, 'me')"
    ).bind(
      slug,
      ts,
      file.kind,
      id,
      `${KIND_LABEL[file.kind]} 롤백: '${file.title}' v${file.current_version} → v${targetVersion}`,
      file.current_version,
      newVersion
    ),
    env.DB.prepare("UPDATE novels SET updated_at = ? WHERE slug = ?").bind(
      ts,
      slug
    ),
  ]);

  return {
    ...file,
    content: target.content,
    current_version: newVersion,
    updated_at: ts,
  };
}

// ---------- Scenes ----------
async function createScene(env, slug, episodeId, { situation = "", setting = "", characters = [] } = {}) {
  const ep = await getFile(env, slug, episodeId);
  if (!ep || ep.kind !== "episode") throw new Error("episode not found");
  const id = newId();
  const ts = nowMs();
  const maxPos = await env.DB.prepare(
    "SELECT COALESCE(MAX(position), 0) AS m FROM scenes WHERE episode_id = ?"
  )
    .bind(episodeId)
    .first();
  const pos = (maxPos?.m || 0) + 1;
  const charsJson = JSON.stringify(Array.isArray(characters) ? characters : []);

  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO scenes (id, episode_id, novel_slug, position, situation, setting, characters, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, episodeId, slug, pos, situation, setting, charsJson, ts, ts),
    env.DB.prepare(
      "INSERT INTO logs (novel_slug, timestamp, action, target_kind, target_id, description, user_label) VALUES (?, ?, 'create', 'episode', ?, ?, 'me')"
    ).bind(slug, ts, episodeId, `씬 추가 [${ep.title}]: ${situation.slice(0, 30)}`),
    env.DB.prepare("UPDATE novels SET updated_at = ? WHERE slug = ?").bind(ts, slug),
  ]);

  return {
    id,
    episode_id: episodeId,
    novel_slug: slug,
    position: pos,
    situation,
    setting,
    characters: charsJson,
    created_at: ts,
    updated_at: ts,
  };
}

async function updateScene(env, slug, sceneId, patch) {
  const before = await env.DB.prepare("SELECT * FROM scenes WHERE id = ? AND novel_slug = ?")
    .bind(sceneId, slug)
    .first();
  if (!before) throw new Error("scene not found");
  const ep = await env.DB.prepare("SELECT title FROM files WHERE id = ?").bind(before.episode_id).first();

  const newSit = patch.situation !== undefined ? patch.situation : before.situation;
  const newSet = patch.setting !== undefined ? patch.setting : before.setting;
  const newChars =
    patch.characters !== undefined
      ? JSON.stringify(Array.isArray(patch.characters) ? patch.characters : [])
      : before.characters;

  if (newSit === before.situation && newSet === before.setting && newChars === before.characters) {
    return before;
  }

  const ts = nowMs();
  await env.DB.batch([
    env.DB.prepare(
      "UPDATE scenes SET situation = ?, setting = ?, characters = ?, updated_at = ? WHERE id = ?"
    ).bind(newSit, newSet, newChars, ts, sceneId),
    env.DB.prepare(
      "INSERT INTO logs (novel_slug, timestamp, action, target_kind, target_id, description, user_label) VALUES (?, ?, 'update', 'episode', ?, ?, 'me')"
    ).bind(slug, ts, before.episode_id, `씬 수정 [${ep?.title || "?"}]: ${newSit.slice(0, 30)}`),
    env.DB.prepare("UPDATE novels SET updated_at = ? WHERE slug = ?").bind(ts, slug),
  ]);

  return { ...before, situation: newSit, setting: newSet, characters: newChars, updated_at: ts };
}

async function deleteScene(env, slug, sceneId) {
  const before = await env.DB.prepare("SELECT * FROM scenes WHERE id = ? AND novel_slug = ?")
    .bind(sceneId, slug)
    .first();
  if (!before) return;
  const ep = await env.DB.prepare("SELECT title FROM files WHERE id = ?").bind(before.episode_id).first();
  const ts = nowMs();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM scenes WHERE id = ?").bind(sceneId),
    env.DB.prepare(
      "INSERT INTO logs (novel_slug, timestamp, action, target_kind, target_id, description, user_label) VALUES (?, ?, 'delete', 'episode', ?, ?, 'me')"
    ).bind(slug, ts, before.episode_id, `씬 삭제 [${ep?.title || "?"}]`),
    env.DB.prepare("UPDATE novels SET updated_at = ? WHERE slug = ?").bind(ts, slug),
  ]);
}

// ---------- Logs ----------
async function listLogs(env, slug, limit = 500) {
  const { results } = await env.DB.prepare(
    "SELECT id, timestamp, action, target_kind, target_id, description, user_label, before_version, after_version FROM logs WHERE novel_slug = ? ORDER BY timestamp DESC LIMIT ?"
  )
    .bind(slug, limit)
    .all();
  return results;
}

// ---------- Router ----------
function matchPath(pathname, pattern) {
  const pParts = pattern.split("/").filter(Boolean);
  const xParts = pathname.split("/").filter(Boolean);
  if (pParts.length !== xParts.length) return null;
  const params = {};
  for (let i = 0; i < pParts.length; i++) {
    if (pParts[i].startsWith(":"))
      params[pParts[i].slice(1)] = decodeURIComponent(xParts[i]);
    else if (pParts[i] !== xParts[i]) return null;
  }
  return params;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    try {
      let m;

      if (pathname === "/" || pathname === "/api/health") {
        return json({ ok: true, name: "tdwebtoon-api", time: nowMs(), d1: !!env.DB });
      }

      // ── Novels ──
      if (pathname === "/api/novels") {
        if (method === "GET") return json({ novels: await listNovels(env) });
        if (method === "POST") {
          const body = await request.json().catch(() => ({}));
          return json({ novel: await createNovel(env, body) }, { status: 201 });
        }
        return bad(405, "Method not allowed");
      }

      if ((m = matchPath(pathname, "/api/novels/:slug"))) {
        if (method === "GET") {
          const novel = await getNovel(env, m.slug);
          return novel ? json({ novel }) : bad(404, "not found");
        }
        if (method === "PUT" || method === "PATCH") {
          const body = await request.json().catch(() => ({}));
          await updateNovel(env, m.slug, body);
          return json({ ok: true });
        }
        if (method === "DELETE") {
          await deleteNovel(env, m.slug);
          return json({ ok: true });
        }
        return bad(405, "Method not allowed");
      }

      if ((m = matchPath(pathname, "/api/novels/:slug/logs"))) {
        if (method === "GET") {
          const limit = Number(url.searchParams.get("limit")) || 500;
          return json({ logs: await listLogs(env, m.slug, limit) });
        }
        return bad(405, "Method not allowed");
      }

      // ── Episode reorder ──
      if ((m = matchPath(pathname, "/api/novels/:slug/episodes/reorder"))) {
        if (method === "POST") {
          const body = await request.json().catch(() => ({}));
          await reorderEpisode(env, m.slug, body.fromId, body.toId);
          return json({ ok: true });
        }
        return bad(405, "Method not allowed");
      }

      // ── Files (synopsis/character/world/episode) ──
      if ((m = matchPath(pathname, "/api/novels/:slug/files"))) {
        if (method === "GET") {
          const kind = url.searchParams.get("kind");
          if (kind && !VALID_KINDS.has(kind)) return bad(400, "invalid kind");
          return json({ files: await listFiles(env, m.slug, kind) });
        }
        if (method === "POST") {
          const body = await request.json().catch(() => ({}));
          return json({ file: await createFile(env, m.slug, body) }, { status: 201 });
        }
        return bad(405, "Method not allowed");
      }

      if ((m = matchPath(pathname, "/api/novels/:slug/files/:id"))) {
        if (method === "GET") {
          const file = await getFile(env, m.slug, m.id);
          return file ? json({ file }) : bad(404, "not found");
        }
        if (method === "PUT" || method === "PATCH") {
          const body = await request.json().catch(() => ({}));
          return json({ file: await updateFile(env, m.slug, m.id, body) });
        }
        if (method === "DELETE") {
          await deleteFile(env, m.slug, m.id);
          return json({ ok: true });
        }
        return bad(405, "Method not allowed");
      }

      if ((m = matchPath(pathname, "/api/novels/:slug/files/:id/versions"))) {
        if (method === "GET") return json({ versions: await listVersions(env, m.id) });
        return bad(405, "Method not allowed");
      }

      if ((m = matchPath(pathname, "/api/novels/:slug/files/:id/rollback"))) {
        if (method === "POST") {
          const body = await request.json().catch(() => ({}));
          const v = Number(body.version);
          if (!v || v < 1) return bad(400, "version required");
          return json({ file: await rollbackFile(env, m.slug, m.id, v) });
        }
        return bad(405, "Method not allowed");
      }

      // ── Scenes ──
      if ((m = matchPath(pathname, "/api/novels/:slug/episodes/:episodeId/scenes/reorder"))) {
        if (method === "POST") {
          const body = await request.json().catch(() => ({}));
          await reorderScene(env, m.slug, m.episodeId, body.fromId, body.toId);
          return json({ ok: true });
        }
        return bad(405, "Method not allowed");
      }

      if ((m = matchPath(pathname, "/api/novels/:slug/episodes/:episodeId/scenes"))) {
        if (method === "POST") {
          const body = await request.json().catch(() => ({}));
          return json(
            { scene: await createScene(env, m.slug, m.episodeId, body) },
            { status: 201 }
          );
        }
        return bad(405, "Method not allowed");
      }

      if ((m = matchPath(pathname, "/api/novels/:slug/scenes/:sceneId"))) {
        if (method === "PUT" || method === "PATCH") {
          const body = await request.json().catch(() => ({}));
          return json({ scene: await updateScene(env, m.slug, m.sceneId, body) });
        }
        if (method === "DELETE") {
          await deleteScene(env, m.slug, m.sceneId);
          return json({ ok: true });
        }
        return bad(405, "Method not allowed");
      }

      return bad(404, "Not found");
    } catch (err) {
      return bad(500, err.message || String(err));
    }
  },
};
