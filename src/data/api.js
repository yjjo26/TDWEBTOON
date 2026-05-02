// Cloudflare Worker API 클라이언트
export const API_BASE =
  import.meta.env.VITE_API_BASE || "https://tdwebtoon-api.yjj2662.workers.dev";

async function call(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = data?.error || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return data;
}

// Novels
export const listNovels = () => call("/api/novels").then((d) => d.novels);
export const getNovel = (slug) =>
  call(`/api/novels/${encodeURIComponent(slug)}`).then((d) => d.novel);
export const createNovel = (title, extras = {}) =>
  call("/api/novels", {
    method: "POST",
    body: JSON.stringify({ title, ...extras }),
  }).then((d) => d.novel);
export const updateNovel = (slug, patch) =>
  call(`/api/novels/${encodeURIComponent(slug)}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
export const deleteNovel = (slug) =>
  call(`/api/novels/${encodeURIComponent(slug)}`, { method: "DELETE" });

// Files
export const listFiles = (slug, kind) => {
  const q = kind ? `?kind=${encodeURIComponent(kind)}` : "";
  return call(`/api/novels/${encodeURIComponent(slug)}/files${q}`).then(
    (d) => d.files
  );
};
export const getFile = (slug, id) =>
  call(`/api/novels/${encodeURIComponent(slug)}/files/${id}`).then((d) => d.file);
export const createFile = (slug, body) =>
  call(`/api/novels/${encodeURIComponent(slug)}/files`, {
    method: "POST",
    body: JSON.stringify(body),
  }).then((d) => d.file);
export const updateFile = (slug, id, patch) =>
  call(`/api/novels/${encodeURIComponent(slug)}/files/${id}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  }).then((d) => d.file);
export const deleteFile = (slug, id) =>
  call(`/api/novels/${encodeURIComponent(slug)}/files/${id}`, {
    method: "DELETE",
  });

// Episode reorder
export const reorderEpisodes = (slug, fromId, toId) =>
  call(`/api/novels/${encodeURIComponent(slug)}/episodes/reorder`, {
    method: "POST",
    body: JSON.stringify({ fromId, toId }),
  });

// Versions / rollback
export const listVersions = (slug, id) =>
  call(`/api/novels/${encodeURIComponent(slug)}/files/${id}/versions`).then(
    (d) => d.versions
  );
export const rollbackFile = (slug, id, version) =>
  call(`/api/novels/${encodeURIComponent(slug)}/files/${id}/rollback`, {
    method: "POST",
    body: JSON.stringify({ version }),
  }).then((d) => d.file);

// Scenes
export const createScene = (slug, episodeId, body) =>
  call(
    `/api/novels/${encodeURIComponent(slug)}/episodes/${episodeId}/scenes`,
    { method: "POST", body: JSON.stringify(body) }
  ).then((d) => d.scene);
export const updateScene = (slug, sceneId, patch) =>
  call(`/api/novels/${encodeURIComponent(slug)}/scenes/${sceneId}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  }).then((d) => d.scene);
export const deleteScene = (slug, sceneId) =>
  call(`/api/novels/${encodeURIComponent(slug)}/scenes/${sceneId}`, {
    method: "DELETE",
  });
export const reorderScenes = (slug, episodeId, fromId, toId) =>
  call(
    `/api/novels/${encodeURIComponent(slug)}/episodes/${episodeId}/scenes/reorder`,
    { method: "POST", body: JSON.stringify({ fromId, toId }) }
  );

// Logs
export const listLogs = (slug, limit = 500) =>
  call(`/api/novels/${encodeURIComponent(slug)}/logs?limit=${limit}`).then(
    (d) => d.logs
  );
