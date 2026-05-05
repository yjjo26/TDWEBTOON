import { useRef, useState } from "react";
import Icon from "./Icon";

// @를 입력하면 자동완성 (캐릭터/배경 등)
// props.mentions: [{ id, title, kind }] — kind 별 아이콘 자동 표시
//   - character → user 아이콘
//   - world     → map 아이콘
//   - 그 외      → user
// props.characters (구버전 호환): characters 만 넘기면 자동으로 mentions 으로 매핑
export default function MentionTextarea({
  value,
  onChange,
  mentions,
  characters = [],
  placeholder,
  style,
  readOnly,
  className = "input",
  ...rest
}) {
  const items =
    mentions ||
    (characters || []).map((c) => ({ ...c, kind: c.kind || "character" }));

  const [showSuggest, setShowSuggest] = useState(false);
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [activeIdx, setActiveIdx] = useState(0);
  const ref = useRef(null);

  const filtered = items
    .filter((m) => (m.title || "").includes(query))
    .slice(0, 8);

  const handleChange = (e) => {
    const v = e.target.value;
    onChange?.(v);
    const cursor = e.target.selectionStart;
    const before = v.slice(0, cursor);
    const m = before.match(/@([^\s@]*)$/);
    if (m) {
      setQuery(m[1]);
      setShowSuggest(true);
      setActiveIdx(0);
      const rect = e.target.getBoundingClientRect();
      const parentRect = e.target.offsetParent?.getBoundingClientRect() || rect;
      setPos({
        top: rect.top - parentRect.top + 24,
        left: rect.left - parentRect.left + 16,
      });
    } else {
      setShowSuggest(false);
    }
  };

  const insert = (item) => {
    const v = ref.current.value;
    const cursor = ref.current.selectionStart;
    const before = v.slice(0, cursor).replace(/@[^\s@]*$/, "");
    const after = v.slice(cursor);
    const next = `${before}@${item.title} ${after}`;
    onChange?.(next);
    setShowSuggest(false);
    setTimeout(() => {
      ref.current.focus();
      const newPos = before.length + item.title.length + 2;
      ref.current.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const onKeyDown = (e) => {
    if (!showSuggest || filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % filtered.length);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + filtered.length) % filtered.length);
    }
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insert(filtered[activeIdx]);
    }
    if (e.key === "Escape") setShowSuggest(false);
  };

  const iconFor = (kind) => (kind === "world" ? "map" : "user");
  const labelFor = (kind) =>
    ({ character: "캐릭터", world: "배경" }[kind] || "");

  return (
    <div style={{ position: "relative" }}>
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        readOnly={readOnly}
        className={className}
        style={style}
        {...rest}
      />
      {showSuggest && filtered.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: pos.top,
            left: pos.left,
            zIndex: 100,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-2)",
            borderRadius: "var(--r-md)",
            boxShadow: "var(--shadow-lg)",
            padding: 4,
            minWidth: 200,
          }}
        >
          {filtered.map((m, i) => (
            <button
              key={`${m.kind || "?"}-${m.id}`}
              onMouseDown={(ev) => {
                ev.preventDefault();
                insert(m);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "6px 10px",
                borderRadius: "var(--r-sm)",
                background: i === activeIdx ? "var(--accent-soft)" : "transparent",
                color: i === activeIdx ? "var(--accent)" : "var(--ink-1)",
                fontSize: "var(--fs-sm)",
                fontWeight: 500,
                textAlign: "left",
              }}
            >
              <Icon name={iconFor(m.kind)} size={14} />
              <span style={{ flex: 1 }}>{m.title}</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color:
                    i === activeIdx
                      ? "var(--accent)"
                      : "var(--ink-4)",
                  letterSpacing: "var(--tracking-wide)",
                  textTransform: "uppercase",
                }}
              >
                {labelFor(m.kind)}
              </span>
            </button>
          ))}
          <div
            style={{
              padding: "4px 10px",
              fontSize: 11,
              color: "var(--ink-4)",
              borderTop: "1px solid var(--border-1)",
              marginTop: 4,
            }}
          >
            <kbd>↑</kbd> <kbd>↓</kbd> 이동 · <kbd>↵</kbd> 선택
          </div>
        </div>
      )}
    </div>
  );
}

export function renderWithMentions(text, mentions) {
  if (!text) return null;
  const names = (mentions || []).map((m) => m.title);
  if (!names.length) return text;
  const re = new RegExp(`@(${names.join("|")})`, "g");
  const parts = [];
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <span key={m.index} className="mention">
        @{m[1]}
      </span>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
