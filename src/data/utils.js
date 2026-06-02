// 디자인 spec 의 helper 들 (TD/data.jsx 참고)

export const COLLABORATORS = [
  { id: "moody", name: "무디", color: "#4F46E5", initials: "무" },
  { id: "cube", name: "큐브", color: "#059669", initials: "큐" },
];

export function fmtTime(ms) {
  if (!ms) return "";
  const d = new Date(ms);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function fmtFullTime(ms) {
  if (!ms) return "";
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function countWords(text) {
  if (!text) return { chars: 0, charsNoSpace: 0, words: 0, pages: 0 };
  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, "").length;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const pages = Math.ceil(charsNoSpace / 1000); // 원고지 1장 ~= 1000자
  return { chars, charsNoSpace, words, pages };
}

export function coverGradient(kind) {
  const map = {
    rose: "linear-gradient(135deg, #fda4af 0%, #be185d 100%)",
    indigo: "linear-gradient(135deg, #a5b4fc 0%, #3730a3 100%)",
    teal: "linear-gradient(135deg, #5eead4 0%, #0f766e 100%)",
    amber: "linear-gradient(135deg, #fcd34d 0%, #b45309 100%)",
    slate: "linear-gradient(135deg, #cbd5e1 0%, #334155 100%)",
  };
  return map[kind] || map.slate;
}

export const COVER_OPTIONS = ["indigo", "rose", "teal", "amber", "slate"];

// 씬 캐릭터 정규화 — 신·구 두 형식 모두 받아 [{id, dialogue}] 로 통일.
export function normalizeChars(s) {
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

// 씬 카드들을 본문(prose) 형태로 합치기 — 회차 본문 자동 렌더에 사용
export function composeProseFromScenes(scenes, characters, worlds) {
  if (!scenes || scenes.length === 0) return "";
  const charById = new Map((characters || []).map((c) => [c.id, c.title]));
  const worldById = new Map((worlds || []).map((w) => [w.id, w.title]));

  const blocks = scenes.map((s, i) => {
    const num = String(i + 1).padStart(2, "0");
    const sit = (s.situation || "").trim() || "(상황 미입력)";
    const worldName = worldById.get(s.setting) || "";
    const chars = normalizeChars(s.characters);
    const charNames = chars.map((c) => charById.get(c.id)).filter(Boolean);

    const lines = [];
    let header = `—— SCENE ${num} · ${sit}`;
    if (worldName) header += `  [${worldName}]`;
    lines.push(header);
    if (charNames.length) lines.push(`등장: ${charNames.join(", ")}`);
    lines.push("");

    for (const c of chars) {
      const name = charById.get(c.id);
      if (!name) continue;
      if (c.dialogue) {
        lines.push(`"${c.dialogue}"`);
        lines.push(`— ${name}`);
        lines.push("");
      }
    }

    // 마지막 빈 줄 제거
    while (lines.length && lines[lines.length - 1] === "") lines.pop();
    return lines.join("\n");
  });

  return blocks.join("\n");
}

// 다운로드 / 업로드 시 자동 영역과 추가 본문을 구분하는 마커
export const MANUAL_BODY_MARKER = "<!-- ── 추가 본문 ── -->";
