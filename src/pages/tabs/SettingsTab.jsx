import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import * as api from "../../data/api";
import IconButton from "../../components/IconButton";

const TEMPLATE = "## 날씨\n\n## 건축물\n\n## 시대 배경\n\n## 기타\n";

// 배경 (settings.md) — kind='world', key='settings', 1 file per novel.
export default function SettingsTab() {
  const { novel, slug, refresh } = useOutletContext();
  const settingsFile = novel.files.find(
    (f) => f.kind === "world" && f.key === "settings"
  );

  const [creating, setCreating] = useState(false);
  const [val, setVal] = useState(settingsFile?.content || TEMPLATE);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  // 자동 생성
  useEffect(() => {
    if (!settingsFile && !creating) {
      setCreating(true);
      api
        .createFile(slug, {
          kind: "world",
          key: "settings",
          title: "배경",
          content: TEMPLATE,
        })
        .then(refresh)
        .finally(() => setCreating(false));
    }
  }, [settingsFile, creating, slug, refresh]);

  useEffect(() => {
    setVal(settingsFile?.content || TEMPLATE);
    setDirty(false);
  }, [settingsFile?.id, settingsFile?.current_version]);

  const sections = useMemo(() => {
    const lines = val.split("\n");
    const out = [];
    lines.forEach((l, i) => {
      const m = l.match(/^##\s+(.+)$/);
      if (m) out.push({ name: m[1], line: i });
    });
    return out;
  }, [val]);

  if (!settingsFile) {
    return (
      <div style={{ padding: 32, color: "var(--ink-4)" }}>
        배경 영역을 만드는 중…
      </div>
    );
  }

  const change = (v) => {
    setVal(v);
    setDirty(v !== settingsFile.content);
  };
  const save = async () => {
    setBusy(true);
    try {
      await api.updateFile(slug, settingsFile.id, { content: val });
      await refresh();
      setDirty(false);
    } catch (e) {
      alert(`저장 실패: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };
  const cancel = () => {
    setVal(settingsFile.content);
    setDirty(false);
  };

  return (
    <div
      className="page-in"
      style={{
        maxWidth: 1120,
        margin: "0 auto",
        padding: "32px 24px",
        display: "grid",
        gridTemplateColumns: "180px 1fr",
        gap: 24,
      }}
    >
      <aside style={{ position: "sticky", top: 120, alignSelf: "start" }}>
        <div
          style={{
            fontSize: "var(--fs-xs)",
            fontWeight: 700,
            color: "var(--ink-3)",
            marginBottom: 8,
            letterSpacing: "var(--tracking-wide)",
            textTransform: "uppercase",
          }}
        >
          섹션
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {sections.map((s) => (
            <span
              key={s.line}
              style={{
                padding: "6px 10px",
                fontSize: "var(--fs-sm)",
                color: "var(--ink-2)",
                borderRadius: "var(--r-sm)",
                borderLeft: "2px solid var(--border-2)",
              }}
            >
              {s.name}
            </span>
          ))}
        </div>
      </aside>

      <div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div>
            <h2
              className="serif"
              style={{ fontSize: "var(--fs-2xl)", fontWeight: 800 }}
            >
              배경 · 세계관
            </h2>
            <p
              style={{
                fontSize: "var(--fs-xs)",
                color: "var(--ink-4)",
                marginTop: 4,
                fontFamily: "var(--font-mono)",
              }}
            >
              settings.md
            </p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {dirty && (
              <>
                <IconButton
                  icon="cancel"
                  label="취소"
                  onClick={cancel}
                  disabled={busy}
                />
                <IconButton
                  icon="save"
                  label="저장"
                  shortcut="⌘S"
                  variant="primary"
                  onClick={save}
                  disabled={busy}
                />
              </>
            )}
          </div>
        </div>

        <textarea
          value={val}
          onChange={(e) => change(e.target.value)}
          className="serif"
          style={{
            width: "100%",
            minHeight: 520,
            background: "var(--bg-surface)",
            border: dirty
              ? "1px solid var(--accent-border)"
              : "1px solid var(--border-1)",
            boxShadow: dirty ? "var(--shadow-glow)" : "var(--shadow-sm)",
            borderRadius: "var(--r-lg)",
            padding: 24,
            fontSize: "var(--fs-md)",
            lineHeight: 1.85,
            color: "var(--ink-1)",
            outline: "none",
          }}
        />
      </div>
    </div>
  );
}
