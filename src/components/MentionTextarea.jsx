import { useRef, useState } from "react";
import Icon from "./Icon";

// @를 입력하면 캐릭터 자동완성. TD/components.jsx 1:1 포팅.
export default function MentionTextarea({
  value,
  onChange,
  characters = [],
  placeholder,
  style,
  readOnly,
  ...rest
}) {
  const [showSuggest, setShowSuggest] = useState(false);
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [activeIdx, setActiveIdx] = useState(0);
  const ref = useRef(null);

  const filtered = characters
    .filter((c) => c.title.includes(query))
    .slice(0, 5);

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

  const insert = (char) => {
    const v = ref.current.value;
    const cursor = ref.current.selectionStart;
    const before = v.slice(0, cursor).replace(/@[^\s@]*$/, "");
    const after = v.slice(cursor);
    const next = `${before}@${char.title} ${after}`;
    onChange?.(next);
    setShowSuggest(false);
    setTimeout(() => {
      ref.current.focus();
      const newPos = before.length + char.title.length + 2;
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

  return (
    <div style={{ position: "relative" }}>
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        readOnly={readOnly}
        className="input"
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
            minWidth: 180,
          }}
        >
          {filtered.map((c, i) => (
            <button
              key={c.id}
              onMouseDown={(e) => {
                e.preventDefault();
                insert(c);
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
              <Icon name="user" size={14} />
              {c.title}
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

export function renderWithMentions(text, characters) {
  if (!text) return null;
  const names = characters.map((c) => c.title);
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
