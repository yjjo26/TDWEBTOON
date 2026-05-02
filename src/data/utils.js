// 디자인 spec 의 helper 들 (TD/data.jsx 참고)

export const COLLABORATORS = [
  { id: "me", name: "나", color: "#4F46E5", initials: "ME" },
  { id: "editor1", name: "편집자", color: "#DB2777", initials: "편" },
  { id: "writer2", name: "공동작가", color: "#059669", initials: "공" },
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
