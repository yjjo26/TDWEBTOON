// tdwebtoon-api — Cloudflare Worker
// 모든 데이터 변경은 자동으로 file_versions(스냅샷) + logs(이력) 두 곳에 기록.
// kind: 'synopsis' | 'character' | 'world' | 'episode'

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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

// ---------- Novels ----------
async function listNovels(env) {
  const { results } = await env.DB.prepare(
    "SELECT slug, title, next_episode, created_at, updated_at FROM novels ORDER BY updated_at DESC"
  ).all();
  return results;
}

async function getNovel(env, slug) {
  const novel = await env.DB.prepare(
    "SELECT slug, title, next_episode, created_at, updated_at FROM novels WHERE slug = ?"
  )
    .bind(slug)
    .first();
  if (!novel) return null;
  const { results: files } = await env.DB.prepare(
    "SELECT id, kind, key, title, content, current_version, created_at, updated_at FROM files WHERE novel_slug = ? ORDER BY kind, key"
  )
    .bind(slug)
    .all();
  return { ...novel, files };
}

async function createNovel(env, { title }) {
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

  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO novels (slug, title, next_episode, created_at, updated_at) VALUES (?, ?, 1, ?, ?)"
    ).bind(slug, title, ts, ts),
    env.DB.prepare(
      "INSERT INTO logs (novel_slug, timestamp, action, target_kind, description) VALUES (?, ?, 'create', 'novel', ?)"
    ).bind(slug, ts, `소설 '${title}' 생성`),
  ]);

  return { slug, title, next_episode: 1, created_at: ts, updated_at: ts };
}

async function updateNovelTitle(env, slug, newTitle) {
  if (!newTitle) throw new Error("title required");
  const before = await env.DB.prepare("SELECT title FROM novels WHERE slug = ?")
    .bind(slug)
    .first();
  if (!before) throw new Error("novel not found");
  if (before.title === newTitle) return;
  const ts = nowMs();
  await env.DB.batch([
    env.DB.prepare("UPDATE novels SET title = ?, updated_at = ? WHERE slug = ?")
      .bind(newTitle, ts, slug),
    env.DB.prepare(
      "INSERT INTO logs (novel_slug, timestamp, action, target_kind, description) VALUES (?, ?, 'update', 'title', ?)"
    ).bind(slug, ts, `제목 변경: '${before.title}' → '${newTitle}'`),
  ]);
}

async function deleteNovel(env, slug) {
  const novel = await env.DB.prepare("SELECT title FROM novels WHERE slug = ?")
    .bind(slug)
    .first();
  if (!novel) return;
  // CASCADE 가 files/file_versions/logs 다 지움
  await env.DB.prepare("DELETE FROM novels WHERE slug = ?").bind(slug).run();
}

// ---------- Files ----------
async function listFiles(env, slug, kind) {
  const sql = kind
    ? "SELECT id, kind, key, title, current_version, created_at, updated_at FROM files WHERE novel_slug = ? AND kind = ? ORDER BY key"
    : "SELECT id, kind, key, title, current_version, created_at, updated_at FROM files WHERE novel_slug = ? ORDER BY kind, key";
  const stmt = kind
    ? env.DB.prepare(sql).bind(slug, kind)
    : env.DB.prepare(sql).bind(slug);
  const { results } = await stmt.all();
  return results;
}

async function getFile(env, slug, id) {
  return env.DB.prepare(
    "SELECT id, novel_slug, kind, key, title, content, current_version, created_at, updated_at FROM files WHERE novel_slug = ? AND id = ?"
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

  // synopsis 는 소설당 1개로 제한 (key='main')
  if (kind === "synopsis") {
    const exists = await env.DB.prepare(
      "SELECT id FROM files WHERE novel_slug = ? AND kind = 'synopsis'"
    )
      .bind(slug)
      .first();
    if (exists) throw new Error("synopsis already exists for this novel");
  }

  try {
    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO files (id, novel_slug, kind, key, title, content, current_version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)"
      ).bind(id, slug, kind, key, safeTitle, safeContent, ts, ts),
      env.DB.prepare(
        "INSERT INTO file_versions (file_id, version, content, created_at) VALUES (?, 1, ?, ?)"
      ).bind(id, safeContent, ts),
      env.DB.prepare(
        "INSERT INTO logs (novel_slug, timestamp, action, target_kind, target_id, description, after_version) VALUES (?, ?, 'create', ?, ?, ?, 1)"
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
  const newVersion = contentChanged ? before.current_version + 1 : before.current_version;

  const changedFields = [];
  if (titleChanged) changedFields.push("title");
  if (keyChanged) changedFields.push("key");
  if (contentChanged) changedFields.push("content");

  const stmts = [
    env.DB.prepare(
      "UPDATE files SET title = ?, key = ?, content = ?, current_version = ?, updated_at = ? WHERE id = ?"
    ).bind(newTitle, newKey, newContent, newVersion, ts, id),
    env.DB.prepare(
      "INSERT INTO logs (novel_slug, timestamp, action, target_kind, target_id, description, before_version, after_version) VALUES (?, ?, 'update', ?, ?, ?, ?, ?)"
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
      "INSERT INTO logs (novel_slug, timestamp, action, target_kind, target_id, description, before_version) VALUES (?, ?, 'delete', ?, ?, ?, ?)"
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
      "INSERT INTO logs (novel_slug, timestamp, action, target_kind, target_id, description, before_version, after_version) VALUES (?, ?, 'rollback', ?, ?, ?, ?, ?)"
    ).bind(
      slug,
      ts,
      file.kind,
      id,
      `${KIND_LABEL[file.kind]} 롤백: '${file.title}' v${file.current_version} → v${targetVersion} 내용으로 복원`,
      file.current_version,
      newVersion
    ),
    env.DB.prepare("UPDATE novels SET updated_at = ? WHERE slug = ?").bind(
      ts,
      slug
    ),
  ]);

  return { ...file, content: target.content, current_version: newVersion, updated_at: ts };
}

// ---------- Logs ----------
async function listLogs(env, slug, limit = 200) {
  const { results } = await env.DB.prepare(
    "SELECT id, timestamp, action, target_kind, target_id, description, user_label, before_version, after_version FROM logs WHERE novel_slug = ? ORDER BY timestamp DESC LIMIT ?"
  )
    .bind(slug, limit)
    .all();
  return results;
}

// ---------- Router ----------
function matchPath(pathname, pattern) {
  // pattern e.g. "/api/novels/:slug/files/:id"
  const pParts = pattern.split("/").filter(Boolean);
  const xParts = pathname.split("/").filter(Boolean);
  if (pParts.length !== xParts.length) return null;
  const params = {};
  for (let i = 0; i < pParts.length; i++) {
    if (pParts[i].startsWith(":")) params[pParts[i].slice(1)] = decodeURIComponent(xParts[i]);
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

      // Health
      if (pathname === "/" || pathname === "/api/health") {
        return json({ ok: true, name: "tdwebtoon-api", time: nowMs(), d1: !!env.DB });
      }

      // Novels
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
        if (method === "PUT") {
          const body = await request.json().catch(() => ({}));
          await updateNovelTitle(env, m.slug, body.title);
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
          const limit = Number(url.searchParams.get("limit")) || 200;
          return json({ logs: await listLogs(env, m.slug, limit) });
        }
        return bad(405, "Method not allowed");
      }

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
        if (method === "PUT") {
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
        if (method === "GET") {
          return json({ versions: await listVersions(env, m.id) });
        }
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

      return bad(404, "Not found");
    } catch (err) {
      return bad(500, err.message || String(err));
    }
  },
};
