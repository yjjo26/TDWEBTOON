// 브라우저 측 다운로드 유틸 (.md / .zip)
import JSZip from "jszip";

// 파일명에 쓸 수 없는 문자 제거 — 윈도우/맥/리눅스 모두 안전한 형태로
function safeName(s) {
  return (s || "untitled")
    .replace(/[\\/:*?"<>|\x00-\x1f]+/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100) || "untitled";
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── 단일 .md ───
export function downloadMd(filename, content) {
  const blob = new Blob([content || ""], {
    type: "text/markdown;charset=utf-8",
  });
  triggerDownload(blob, safeName(filename) + ".md");
}

// ─── kind 별 ZIP (캐릭터/배경/회차) ───
export async function downloadKindZip(novel, kind, options = {}) {
  const items = (novel.files || []).filter((f) => f.kind === kind);
  if (items.length === 0) {
    alert("내보낼 항목이 없습니다.");
    return;
  }
  const folderName = options.folder || kindFolder(kind);
  const zip = new JSZip();
  const folder = zip.folder(folderName);
  for (const f of items) {
    folder.file(`${safeName(f.title)}.md`, f.content || "");
  }
  // 매니페스트(간단)
  zip.file("manifest.yaml", manifestYaml(novel, { only: kind }));
  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(blob, `${safeName(novel.title)}-${folderName}.zip`);
}

// ─── 전체 ZIP (소설 통째) ───
export async function downloadNovelZip(novel) {
  const zip = new JSZip();

  // storytelling_style.md (synopsis)
  const synopsis = (novel.files || []).find((f) => f.kind === "synopsis");
  if (synopsis) zip.file("storytelling_style.md", synopsis.content || "");

  // characters/
  const charFolder = zip.folder("characters");
  const characters = (novel.files || []).filter((f) => f.kind === "character");
  for (const c of characters) {
    charFolder.file(`${safeName(c.title)}.md`, c.content || "");
  }

  // world/
  const worldFolder = zip.folder("world");
  const worlds = (novel.files || []).filter((f) => f.kind === "world");
  for (const w of worlds) {
    worldFolder.file(`${safeName(w.title)}.md`, w.content || "");
  }

  // episodes/ + 씬 메타 (씬은 episodes 본문 위에 코멘트 블록으로)
  const epFolder = zip.folder("episodes");
  const episodes = (novel.files || [])
    .filter((f) => f.kind === "episode")
    .sort((a, b) => (a.position || 0) - (b.position || 0));
  for (const e of episodes) {
    const epScenes = (novel.scenes || [])
      .filter((s) => s.episode_id === e.id)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
    epFolder.file(
      `${safeName(e.title)}.md`,
      buildEpisodeMd(e.content || "", epScenes, characters, worlds)
    );
  }

  // manifest
  zip.file("manifest.yaml", manifestYaml(novel));

  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(blob, `${safeName(novel.title)}.zip`);
}

// ─── helpers ───
function kindFolder(kind) {
  return (
    {
      character: "characters",
      world: "world",
      episode: "episodes",
      synopsis: "synopsis",
    }[kind] || kind
  );
}

function buildEpisodeMd(body, scenes, characters, worlds) {
  if (!scenes || scenes.length === 0) return body;
  const charById = new Map(characters.map((c) => [c.id, c.title]));
  const worldById = new Map((worlds || []).map((w) => [w.id, w.title]));
  const lines = [];
  lines.push("<!-- 씬 카드 (자동 생성)");
  scenes.forEach((s, i) => {
    const charsArr = normalizeChars(s.characters)
      .map((c) => ({
        name: charById.get(c.id),
        dialogue: c.dialogue || "",
      }))
      .filter((c) => c.name);
    const settingTitle = worldById.get(s.setting) || s.setting || "";
    lines.push(
      `${String(i + 1).padStart(2, "0")}. ${s.situation || "(상황 미입력)"}`
    );
    if (settingTitle) lines.push(`    배경: @${settingTitle}`);
    for (const c of charsArr) {
      if (c.dialogue) {
        lines.push(`    @${c.name}: ${JSON.stringify(c.dialogue)}`);
      } else {
        lines.push(`    @${c.name}`);
      }
    }
  });
  lines.push("-->");
  lines.push("");
  return lines.join("\n") + body;
}

function normalizeChars(s) {
  let raw;
  if (Array.isArray(s)) raw = s;
  else if (!s) raw = [];
  else {
    try {
      const v = JSON.parse(s);
      raw = Array.isArray(v) ? v : [];
    } catch {
      raw = [];
    }
  }
  return raw
    .map((it) =>
      typeof it === "string"
        ? { id: it, dialogue: "" }
        : it && typeof it === "object" && it.id
        ? { id: it.id, dialogue: it.dialogue || "" }
        : null
    )
    .filter(Boolean);
}

function manifestYaml(novel, opts = {}) {
  const files = novel.files || [];
  const counts = {
    characters: files.filter((f) => f.kind === "character").length,
    world: files.filter((f) => f.kind === "world").length,
    episodes: files.filter((f) => f.kind === "episode").length,
    synopsis: files.filter((f) => f.kind === "synopsis").length,
    scenes: (novel.scenes || []).length,
  };
  const lines = [
    `title: "${escapeYaml(novel.title)}"`,
    `slug: "${escapeYaml(novel.slug)}"`,
    `exported_at: "${new Date().toISOString()}"`,
    `next_episode: ${novel.next_episode || 1}`,
    "counts:",
    `  characters: ${counts.characters}`,
    `  world: ${counts.world}`,
    `  episodes: ${counts.episodes}`,
    `  synopsis: ${counts.synopsis}`,
    `  scenes: ${counts.scenes}`,
  ];
  if (opts.only) lines.push(`only: "${opts.only}"`);
  return lines.join("\n") + "\n";
}

function escapeYaml(s) {
  return String(s || "").replace(/"/g, '\\"');
}
