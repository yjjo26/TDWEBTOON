import { useRef, useState } from "react";
import Icon from "./Icon";

// 화이트리스트 단일 선택 입력 — items 안에 있는 것만 선택 가능. 자유 입력 X.
// items: [{ id, title, kind?: 'character' | 'world' }]
// onPick(item) 호출 후 입력 자동 클리어.
// exclude: [id] — 이미 선택된 ID 들은 후보에서 제외.
export default function PickerInput({
  items,
  onPick,
  placeholder = "@ 입력해서 선택",
  exclude = [],
  size = "md",
  autoFocus,
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const ref = useRef(null);

  // @ 프리픽스는 검색에서 제외
  const query = q.replace(/^@/, "").trim();
  const filtered = (items || [])
    .filter((it) => !exclude.includes(it.id))
    .filter((it) => !query || (it.title || "").includes(query))
    .slice(0, 10);

  const pick = (it) => {
    onPick(it);
    setQ("");
    setActiveIdx(0);
    // 입력 유지 — 연속 추가가 가능하도록
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIdx((i) => (filtered.length ? (i + 1) % filtered.length : 0));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActiveIdx((i) =>
        filtered.length ? (i - 1 + filtered.length) % filtered.length : 0
      );
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIdx]) pick(filtered[activeIdx]);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      ref.current?.blur();
    }
  };

  const padY = size === "sm" ? 6 : 10;

  return (
    <div style={{ position: "relative" }}>
      <input
        ref={ref}
        className="input"
        placeholder={placeholder}
        value={q}
        autoFocus={autoFocus}
        style={{ padding: `${padY}px 12px` }}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActiveIdx(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
      />
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            zIndex: 100,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-2)",
            borderRadius: "var(--r-md)",
            boxShadow: "var(--shadow-lg)",
            padding: 4,
            maxHeight: 240,
            overflowY: "auto",
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: "8px 10px",
                fontSize: 12,
                color: "var(--ink-4)",
              }}
            >
              {query
                ? `"${query}" 검색 결과 없음 — 등록되지 않은 항목은 사용할 수 없습니다`
                : "등록된 항목이 없습니다"}
            </div>
          ) : (
            <>
              {filtered.map((it, i) => (
                <button
                  key={`${it.kind || "?"}-${it.id}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(it);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "6px 10px",
                    borderRadius: "var(--r-sm)",
                    background:
                      i === activeIdx ? "var(--accent-soft)" : "transparent",
                    color: i === activeIdx ? "var(--accent)" : "var(--ink-1)",
                    fontSize: "var(--fs-sm)",
                    fontWeight: 500,
                    textAlign: "left",
                  }}
                >
                  <Icon name={it.kind === "world" ? "map" : "user"} size={14} />
                  <span style={{ flex: 1 }}>{it.title}</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color:
                        i === activeIdx ? "var(--accent)" : "var(--ink-4)",
                      letterSpacing: "var(--tracking-wide)",
                      textTransform: "uppercase",
                    }}
                  >
                    {it.kind === "world" ? "배경" : "캐릭터"}
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
