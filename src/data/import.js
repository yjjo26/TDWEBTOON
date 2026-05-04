// 업로드/임포트 유틸 — 단일 .md / 다중 .md / .zip 모두 지원
// 핵심:
//   - 같은 이름의 항목이 있으면 새 버전으로 갱신 (logs 자동 기록)
//   - 없으면 신규 추가
//   - 회차 .md 안에 <!-- 씬 카드 ... --> 코멘트가 있으면 자동 파싱 → 씬 행 생성
//     (기존 씬은 모두 교체)
import JSZip from "jszip";
import * as api from "./api";

// ─── Scene 파서 (download.js 의 buildEpisodeMd 와 1:1 대응) ───
const SCENE_BLOCK_RE = /^<!--\s*씬\s*카드[^\n]*\n([\s\S]*?)\n-->\s*\n?/;

export function parseEpisodeScenes(content) {
  const m = String(content || "").match(SCENE_BLOCK_RE);
  if (!m) return { scenes: [], strippedBody: content || "" };
  const block = m[1];
  const strippedBody = (content.slice(m[0].length) || "").replace(/^\s+/, "");

  const scenes = [];
  let cur = null;
  for (const raw of block.split("\n")) {
    const line = raw;
    const sceneMatch = line.match(/^\s*\d+\.\s*(.+)$/);
    if (sceneMatch) {
      if (cur) scenes.push(cur);
      cur = { situation: sceneMatch[1].trim(), setting: "", characters: [] };
      continue;
    }
    if (!cur) continue;
    const charMatch = line.match(/^\s+캐릭터\s*[:：]\s*(.+)$/);
    if (charMatch) {
      cur.characters = charMatch[1]
        .split(/[,，、]/)
        .map((s) => s.trim().replace(/^@/, ""))
        .filter(Boolean);
      continue;
    }
    const setMatch = line.match(/^\s+배경\s*[:：]\s*(.+)$/);
    if (setMatch) cur.setting = setMatch[1].trim();
  }
  if (cur) scenes.push(cur);
  return { scenes, strippedBody };
}

// 파일명 → 회차 번호 추출 (없으면 null)
function pickEpisodeNumber(name) {
  const m = String(name).match(/^\s*(\d+)/);
  return m ? Number(m[1]) : null;
}

// 임포트 결과 통계
function blank() {
  return { created: 0, updated: 0, scenes: 0, errors: [] };
}

// ─── upsert (캐싱된 인덱스 사용) ───
class Importer {
  constructor(slug, novel) {
    this.slug = slug;
    // 로컬 인덱스 (업로드 진행 중 새로 만든 항목도 즉시 반영)
    this.files = [...(novel.files || [])];
    this.scenes = [...(novel.scenes || [])];
    this.charByName = new Map();
    this.refreshCharIndex();
  }

  refreshCharIndex() {
    this.charByName.clear();
    for (const f of this.files) {
      if (f.kind === "character") this.charByName.set(f.title, f.id);
    }
  }

  findFile(kind, { key, title }) {
    return this.files.find(
      (f) =>
        f.kind === kind &&
        ((key && f.key === key) || (title && f.title === title))
    );
  }

  async upsertFile({ kind, key, title, content }) {
    const existing = this.findFile(kind, { key, title });
    if (existing) {
      const updated = await api.updateFile(this.slug, existing.id, { content });
      Object.assign(existing, { content, current_version: updated?.current_version || existing.current_version });
      return { id: existing.id, action: "update", title: existing.title };
    } else {
      const safeKey =
        (key || title || "").replace(/[\\/]/g, "_").slice(0, 60) ||
        `${kind}-${Date.now().toString(36)}`;
      const created = await api.createFile(this.slug, {
        kind,
        key: safeKey,
        title: title || safeKey,
        content,
      });
      this.files.push(created);
      if (kind === "character") this.refreshCharIndex();
      return { id: created.id, action: "create", title: created.title };
    }
  }

  // 회차의 기존 씬을 모두 지우고, 파싱된 씬들로 재생성
  async replaceScenes(episodeId, parsed) {
    const old = this.scenes.filter((s) => s.episode_id === episodeId);
    for (const s of old) {
      try {
        await api.deleteScene(this.slug, s.id);
      } catch {
        /* ignore */
      }
    }
    this.scenes = this.scenes.filter((s) => s.episode_id !== episodeId);

    for (const ps of parsed) {
      const charIds = ps.characters
        .map((name) => this.charByName.get(name))
        .filter(Boolean);
      try {
        const created = await api.createScene(this.slug, episodeId, {
          situation: ps.situation,
          setting: ps.setting,
          characters: charIds,
        });
        this.scenes.push(created);
      } catch {
        /* ignore */
      }
    }
  }

  async importEpisodeMd(filename, content) {
    const baseName = String(filename).replace(/\.(md|txt)$/i, "");
    const num = pickEpisodeNumber(baseName);
    // 키: 번호가 있으면 번호 문자열, 없으면 파일명 슬러그
    const key = num != null ? String(num) : baseName.slice(0, 60);
    const { scenes, strippedBody } = parseEpisodeScenes(content);
    const r = await this.upsertFile({
      kind: "episode",
      key,
      title: baseName,
      content: strippedBody,
    });
    let sceneCount = 0;
    if (scenes.length > 0) {
      await this.replaceScenes(r.id, scenes);
      sceneCount = scenes.length;
    }
    return { ...r, scenes: sceneCount };
  }

  async importSynopsisMd(content) {
    return this.upsertFile({
      kind: "synopsis",
      key: "main",
      title: "줄거리",
      content,
    });
  }

  async importCharacterMd(filename, content) {
    const baseName = String(filename).replace(/\.(md|txt)$/i, "");
    return this.upsertFile({
      kind: "character",
      key: baseName,
      title: baseName,
      content,
    });
  }

  async importWorldMd(filename, content) {
    const baseName = String(filename).replace(/\.(md|txt)$/i, "");
    return this.upsertFile({
      kind: "world",
      key: baseName,
      title: baseName,
      content,
    });
  }
}

// ─── 외부 API ───

// kind 별 다중 .md 임포트
export async function importMdFiles(novel, slug, kind, fileList, onProgress) {
  const stats = blank();
  const imp = new Importer(slug, novel);
  const files = Array.from(fileList || []);
  let i = 0;
  for (const file of files) {
    i++;
    onProgress?.({ current: i, total: files.length, file: file.name });
    try {
      const text = await file.text();
      let r;
      if (kind === "synopsis") r = await imp.importSynopsisMd(text);
      else if (kind === "character") r = await imp.importCharacterMd(file.name, text);
      else if (kind === "world") r = await imp.importWorldMd(file.name, text);
      else if (kind === "episode") {
        r = await imp.importEpisodeMd(file.name, text);
        stats.scenes += r.scenes || 0;
      }
      if (r?.action === "create") stats.created++;
      else if (r?.action === "update") stats.updated++;
    } catch (e) {
      stats.errors.push({ file: file.name, message: e.message });
    }
  }
  return stats;
}

// 전체 ZIP 임포트 — download.js 의 ZIP 구조에 맞춤
export async function importZip(novel, slug, file, onProgress) {
  const stats = blank();
  const imp = new Importer(slug, novel);
  const zip = await JSZip.loadAsync(file);

  const entries = [];
  zip.forEach((path, entry) => {
    if (entry.dir) return;
    if (path.startsWith("__MACOSX")) return;
    if (path.toLowerCase().endsWith(".ds_store")) return;
    if (path.toLowerCase() === "manifest.yaml") return;
    if (!path.toLowerCase().endsWith(".md") && !path.toLowerCase().endsWith(".txt")) return;
    entries.push({ path, entry });
  });

  let i = 0;
  for (const { path, entry } of entries) {
    i++;
    onProgress?.({ current: i, total: entries.length, file: path });
    try {
      const text = await entry.async("string");
      const lower = path.toLowerCase().replace(/^\.?\//, "");
      const baseName = path.split("/").pop();

      let r;
      if (lower.endsWith("storytelling_style.md") || lower.endsWith("/synopsis.md")) {
        r = await imp.importSynopsisMd(text);
      } else if (/(?:^|\/)characters\//.test(lower)) {
        r = await imp.importCharacterMd(baseName, text);
      } else if (/(?:^|\/)world\//.test(lower)) {
        r = await imp.importWorldMd(baseName, text);
      } else if (/(?:^|\/)episodes\//.test(lower)) {
        r = await imp.importEpisodeMd(baseName, text);
        stats.scenes += r.scenes || 0;
      } else {
        // 알 수 없는 위치 — 파일명 패턴으로 추정
        if (/^\d/.test(baseName)) {
          r = await imp.importEpisodeMd(baseName, text);
          stats.scenes += r.scenes || 0;
        } else {
          // 기본은 캐릭터로 취급하기엔 위험. skip.
          continue;
        }
      }
      if (r?.action === "create") stats.created++;
      else if (r?.action === "update") stats.updated++;
    } catch (e) {
      stats.errors.push({ file: path, message: e.message });
    }
  }
  return stats;
}

export function summarizeStats(stats) {
  const parts = [];
  if (stats.created) parts.push(`추가 ${stats.created}`);
  if (stats.updated) parts.push(`갱신 ${stats.updated}`);
  if (stats.scenes) parts.push(`씬 ${stats.scenes}`);
  if (stats.errors?.length) parts.push(`실패 ${stats.errors.length}`);
  return parts.length ? parts.join(" · ") : "변경 없음";
}
