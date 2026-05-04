import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import * as api from "../../data/api";
import { countWords } from "../../data/utils";
import IconButton from "../../components/IconButton";
import { downloadMd } from "../../data/download";

// 줄거리 (storytelling_style.md) — synopsis kind, key='main', 1 file per novel.
export default function PlotTab() {
  const { novel, slug, refresh } = useOutletContext();
  const synopsis = novel.files.find((f) => f.kind === "synopsis");

  const [creating, setCreating] = useState(false);
  const [val, setVal] = useState(synopsis?.content || "");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  // synopsis 가 없으면 자동 생성
  useEffect(() => {
    if (!synopsis && !creating) {
      setCreating(true);
      api
        .createFile(slug, {
          kind: "synopsis",
          key: "main",
          title: "줄거리",
          content: "",
        })
        .then(refresh)
        .finally(() => setCreating(false));
    }
  }, [synopsis, creating, slug, refresh]);

  useEffect(() => {
    setVal(synopsis?.content || "");
    setDirty(false);
  }, [synopsis?.id, synopsis?.current_version]);

  if (!synopsis) {
    return (
      <div style={{ padding: 32, color: "var(--ink-4)" }}>줄거리 영역을 만드는 중…</div>
    );
  }

  const change = (v) => {
    setVal(v);
    setDirty(v !== synopsis.content);
  };
  const save = async () => {
    setBusy(true);
    try {
      await api.updateFile(slug, synopsis.id, { content: val });
      await refresh();
      setDirty(false);
    } catch (e) {
      alert(`저장 실패: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };
  const cancel = () => {
    setVal(synopsis.content);
    setDirty(false);
  };

  const stats = countWords(val);

  return (
    <div className="page-in" style={{ maxWidth: 880, margin: "0 auto", padding: "32px 24px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div>
          <h2 className="serif" style={{ fontSize: "var(--fs-2xl)", fontWeight: 800 }}>
            줄거리 · 톤앤매너
          </h2>
          <p
            style={{
              fontSize: "var(--fs-xs)",
              color: "var(--ink-4)",
              marginTop: 4,
              fontFamily: "var(--font-mono)",
            }}
          >
            storytelling_style.md
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <IconButton
            icon="download"
            label="storytelling_style.md 다운로드"
            onClick={() => downloadMd("storytelling_style", val)}
          />
          {dirty && (
            <>
              <IconButton icon="cancel" label="취소" onClick={cancel} disabled={busy} />
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
        placeholder="이 소설의 톤앤매너, 핵심 갈등, 결말 방향을 자유롭게 적어주세요…"
        className="serif"
        style={{
          width: "100%",
          minHeight: 480,
          background: "var(--bg-surface)",
          border: dirty ? "1px solid var(--accent-border)" : "1px solid var(--border-1)",
          boxShadow: dirty ? "var(--shadow-glow)" : "var(--shadow-sm)",
          borderRadius: "var(--r-lg)",
          padding: 24,
          fontSize: "var(--fs-md)",
          lineHeight: 1.85,
          color: "var(--ink-1)",
          outline: "none",
          transition: "all var(--dur) var(--ease-out)",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginTop: 12,
          fontSize: "var(--fs-xs)",
          color: "var(--ink-4)",
          fontFamily: "var(--font-mono)",
        }}
      >
        <span>{stats.chars}자</span>
        <span>{stats.charsNoSpace}자 (공백제외)</span>
        <span>{stats.words}단어</span>
        <span>{stats.pages}장</span>
        {dirty && (
          <span style={{ color: "var(--warn)", marginLeft: "auto" }}>
            ● 저장하지 않은 변경
          </span>
        )}
      </div>
    </div>
  );
}
