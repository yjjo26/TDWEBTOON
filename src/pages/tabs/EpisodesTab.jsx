import { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import * as api from "../../data/api";
import IconButton from "../../components/IconButton";
import Icon from "../../components/Icon";
import Confirm from "../../components/Confirm";
import MentionTextarea from "../../components/MentionTextarea";
import { countWords } from "../../data/utils";

export default function EpisodesTab() {
  const { novel, slug, refresh } = useOutletContext();
  const sidebarSide = localStorage.getItem("td:sidebar") || "left";
  const fileInputRef = useRef(null);

  const episodes = useMemo(
    () =>
      novel.files
        .filter((f) => f.kind === "episode")
        .sort((a, b) => (a.position || 0) - (b.position || 0)),
    [novel.files]
  );
  const characters = useMemo(
    () => novel.files.filter((f) => f.kind === "character"),
    [novel.files]
  );

  const [selectedId, setSelectedId] = useState(() => {
    const last = localStorage.getItem(`td:lastEp:${novel.slug}`);
    return episodes.find((e) => e.id === last)?.id || episodes[0]?.id || null;
  });
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [dropId, setDropId] = useState(null);
  const [busy, setBusy] = useState(false);

  const ep = episodes.find((e) => e.id === selectedId);
  const epScenes = useMemo(
    () =>
      (novel.scenes || [])
        .filter((s) => s.episode_id === selectedId)
        .sort((a, b) => (a.position || 0) - (b.position || 0)),
    [novel.scenes, selectedId]
  );

  useEffect(() => {
    if (!episodes.find((e) => e.id === selectedId)) {
      setSelectedId(episodes[0]?.id || null);
    }
  }, [episodes, selectedId]);

  useEffect(() => {
    if (selectedId) localStorage.setItem(`td:lastEp:${novel.slug}`, selectedId);
  }, [selectedId, novel.slug]);

  useEffect(() => {
    if (ep) {
      setDraft({ title: ep.title, body: ep.content });
      setEditing(false);
    }
  }, [selectedId, ep?.current_version, ep?.title]);

  const filteredEps = episodes.filter(
    (e) => !q || e.title.includes(q) || (e.content || "").includes(q)
  );

  const dirty =
    editing && draft && (draft.title !== ep.title || draft.body !== ep.content);

  const nextEpisodeNumber = () => {
    const nums = episodes.map((e) => Number(e.key)).filter((n) => !isNaN(n));
    return (nums.length ? Math.max(...nums) : 0) + 1;
  };

  const addNew = async () => {
    setBusy(true);
    try {
      const n = nextEpisodeNumber();
      const created = await api.createFile(slug, {
        kind: "episode",
        key: String(n),
        title: `${n}화. 새 회차`,
        content: "",
      });
      setSelectedId(created.id);
      setEditing(true);
      await refresh();
    } catch (e) {
      alert(`추가 실패: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const onUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setBusy(true);
    try {
      let n = nextEpisodeNumber();
      let firstId = null;
      for (const file of files) {
        const text = await file.text();
        const baseName = file.name.replace(/\.(md|txt)$/i, "");
        const created = await api.createFile(slug, {
          kind: "episode",
          key: String(n),
          title: baseName || `${n}화`,
          content: text,
        });
        if (!firstId) firstId = created.id;
        n++;
      }
      if (firstId) setSelectedId(firstId);
      await refresh();
    } catch (err) {
      alert(`업로드 실패: ${err.message}`);
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      await api.updateFile(slug, ep.id, {
        title: draft.title,
        content: draft.body,
      });
      await refresh();
      setEditing(false);
    } catch (e) {
      alert(`저장 실패: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const cancel = () => {
    setDraft({ title: ep.title, body: ep.content });
    setEditing(false);
  };

  const deleteEp = async () => {
    setBusy(true);
    try {
      await api.deleteFile(slug, ep.id);
      await refresh();
      setConfirmDel(false);
      setEditing(false);
      setSelectedId(episodes.find((e) => e.id !== ep.id)?.id || null);
    } catch (e) {
      alert(`삭제 실패: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const onDragStart = (id) => setDragId(id);
  const onDragOver = (e, id) => {
    e.preventDefault();
    setDropId(id);
  };
  const onDrop = async (e, id) => {
    e.preventDefault();
    if (dragId && dragId !== id) {
      try {
        await api.reorderEpisodes(slug, dragId, id);
        await refresh();
      } catch (err) {
        alert(`정렬 실패: ${err.message}`);
      }
    }
    setDragId(null);
    setDropId(null);
  };

  const Sidebar = (
    <aside
      style={{
        width: 260,
        flexShrink: 0,
        background: "var(--bg-surface)",
        borderRight: sidebarSide === "left" ? "1px solid var(--border-1)" : "none",
        borderLeft: sidebarSide === "right" ? "1px solid var(--border-1)" : "none",
        display: "flex",
        flexDirection: "column",
        maxHeight: "calc(100vh - 110px)",
        position: "sticky",
        top: 110,
      }}
    >
      <div style={{ padding: 12, borderBottom: "1px solid var(--border-1)" }}>
        <div style={{ position: "relative", marginBottom: 8 }}>
          <Icon
            name="search"
            size={14}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--ink-4)",
            }}
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="회차 찾기"
            className="input"
            style={{ paddingLeft: 30, fontSize: "var(--fs-sm)" }}
          />
        </div>
        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
          <IconButton
            icon="upload"
            label="회차 .md 업로드"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
          />
          <IconButton
            icon="plus"
            label="새 회차"
            shortcut="⌘N"
            variant="primary"
            size="sm"
            onClick={addNew}
            disabled={busy}
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".md,.txt,text/markdown,text/plain"
            onChange={onUpload}
            style={{ display: "none" }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 6 }}>
        {filteredEps.map((e) => {
          const wc = countWords(e.content);
          const sceneCount = (novel.scenes || []).filter(
            (s) => s.episode_id === e.id
          ).length;
          const active = e.id === selectedId;
          return (
            <div
              key={e.id}
              className={`draggable ${dragId === e.id ? "dragging" : ""} ${
                dropId === e.id ? "drop-target" : ""
              }`}
              draggable
              onDragStart={() => onDragStart(e.id)}
              onDragOver={(ev) => onDragOver(ev, e.id)}
              onDrop={(ev) => onDrop(ev, e.id)}
              onDragEnd={() => {
                setDragId(null);
                setDropId(null);
              }}
              onClick={() => setSelectedId(e.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 10px",
                borderRadius: "var(--r-sm)",
                cursor: "pointer",
                background: active ? "var(--accent-soft)" : "transparent",
                color: active ? "var(--accent)" : "var(--ink-2)",
                marginBottom: 2,
                position: "relative",
              }}
            >
              <span
                className="drag-handle"
                title="드래그해서 순서 변경"
                data-tooltip="드래그해서 순서 변경"
                style={{ cursor: "grab" }}
              >
                <Icon name="drag" size={12} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="serif"
                  style={{
                    fontSize: "var(--fs-sm)",
                    fontWeight: active ? 700 : 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {e.title}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--ink-4)",
                    marginTop: 2,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {wc.chars}자 · {sceneCount}씬
                </div>
              </div>
            </div>
          );
        })}
        {filteredEps.length === 0 && (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              fontSize: "var(--fs-xs)",
              color: "var(--ink-4)",
            }}
          >
            {q ? "검색 결과 없음" : "회차를 추가해보세요"}
          </div>
        )}
      </div>
    </aside>
  );

  const Editor = ep && draft ? (
    <div style={{ flex: 1, padding: "24px 32px", minWidth: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
        }}
      >
        {editing ? (
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            className="serif"
            style={{
              fontSize: "var(--fs-xl)",
              fontWeight: 800,
              padding: "6px 10px",
              background: "var(--bg-surface)",
              border: "1px solid var(--accent)",
              borderRadius: "var(--r-md)",
              flex: 1,
              outline: "none",
              color: "var(--ink-1)",
            }}
          />
        ) : (
          <h2
            className="serif"
            style={{
              fontSize: "var(--fs-xl)",
              fontWeight: 800,
              flex: 1,
            }}
          >
            {ep.title}
          </h2>
        )}

        <div style={{ display: "flex", gap: 4 }}>
          {editing ? (
            <>
              <IconButton
                icon="trash"
                label="삭제"
                variant="danger"
                onClick={() => setConfirmDel(true)}
                disabled={busy}
              />
              <IconButton
                icon="cancel"
                label="취소"
                onClick={cancel}
                disabled={!dirty || busy}
              />
              <IconButton
                icon="save"
                label="저장"
                shortcut="⌘S"
                variant="primary"
                onClick={save}
                disabled={!dirty || busy}
              />
            </>
          ) : (
            <IconButton
              icon="edit"
              label="수정"
              onClick={() => setEditing(true)}
            />
          )}
        </div>
      </div>

      <MentionTextarea
        value={editing ? draft.body : ep.content}
        onChange={(v) => editing && setDraft({ ...draft, body: v })}
        characters={characters}
        placeholder="회차 본문을 적어주세요. @를 입력하면 캐릭터 자동완성이 떠요."
        readOnly={!editing}
        style={{
          minHeight: 360,
          background: "var(--bg-surface)",
          border: editing
            ? "1px solid var(--accent-border)"
            : "1px solid var(--border-1)",
          boxShadow: editing ? "var(--shadow-glow)" : "var(--shadow-sm)",
          borderRadius: "var(--r-lg)",
          padding: 24,
          fontFamily: "var(--font-serif)",
          fontSize: "var(--fs-md)",
          lineHeight: 1.9,
          color: editing ? "var(--ink-1)" : "var(--ink-2)",
        }}
      />

      <EpisodeStats body={editing ? draft.body : ep.content} dirty={dirty} />

      <SceneList
        slug={slug}
        episodeId={ep.id}
        scenes={epScenes}
        characters={characters}
        refresh={refresh}
      />

      <Confirm
        open={confirmDel}
        title="회차를 삭제할까요?"
        message={`"${ep.title}"이 삭제됩니다. 로그에 남아 롤백 가능해요.`}
        danger
        onConfirm={deleteEp}
        onCancel={() => setConfirmDel(false)}
      />
    </div>
  ) : (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--ink-3)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <Icon
          name="book"
          size={32}
          style={{ color: "var(--ink-4)", marginBottom: 8 }}
        />
        <p style={{ fontSize: "var(--fs-sm)" }}>회차를 선택하거나 추가해보세요</p>
      </div>
    </div>
  );

  return (
    <div
      className="page-in"
      style={{
        maxWidth: 1280,
        margin: "0 auto",
        display: "flex",
        flexDirection: sidebarSide === "right" ? "row-reverse" : "row",
        minHeight: "calc(100vh - 110px)",
      }}
    >
      {Sidebar}
      {Editor}
    </div>
  );
}

function EpisodeStats({ body, dirty }) {
  const stats = countWords(body);
  return (
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
      <span>원고지 {stats.pages}장</span>
      <span>예상 {Math.ceil(stats.chars / 3000) || 0}분 분량</span>
      {dirty && (
        <span style={{ color: "var(--warn)", marginLeft: "auto" }}>
          ● 저장하지 않은 변경
        </span>
      )}
    </div>
  );
}

function SceneList({ slug, episodeId, scenes, characters, refresh }) {
  const [expanded, setExpanded] = useState(true);
  const [adding, setAdding] = useState(false);

  const onAdd = async (s) => {
    try {
      await api.createScene(slug, episodeId, {
        situation: s.situation || "",
        setting: s.setting || "",
        characters: s.characters || [],
      });
      await refresh();
      setAdding(false);
    } catch (e) {
      alert(`씬 추가 실패: ${e.message}`);
    }
  };

  const onSave = async (s) => {
    try {
      await api.updateScene(slug, s.id, {
        situation: s.situation,
        setting: s.setting,
        characters: s.characters || [],
      });
      await refresh();
    } catch (e) {
      alert(`씬 저장 실패: ${e.message}`);
    }
  };

  const onDelete = async (id) => {
    try {
      await api.deleteScene(slug, id);
      await refresh();
    } catch (e) {
      alert(`씬 삭제 실패: ${e.message}`);
    }
  };

  return (
    <div style={{ marginTop: 32 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          title={expanded ? "접기" : "펼치기"}
          data-tooltip={expanded ? "접기" : "펼치기"}
          aria-label={expanded ? "접기" : "펼치기"}
          className="icon-btn sm"
        >
          <Icon name={expanded ? "chevronDown" : "chevronRight"} size={14} />
        </button>
        <h3 style={{ fontSize: "var(--fs-md)", fontWeight: 700, flex: 1 }}>
          씬 카드
        </h3>
        <span style={{ fontSize: "var(--fs-xs)", color: "var(--ink-4)" }}>
          {scenes.length}개
        </span>
        <IconButton
          icon="plus"
          label="씬 추가"
          size="sm"
          variant="primary"
          onClick={() => setAdding(true)}
          disabled={adding}
        />
      </div>

      {expanded && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          {adding && (
            <SceneCard
              scene={{ id: "new", situation: "", characters: "[]", setting: "" }}
              characters={characters}
              autoEdit
              onSave={onAdd}
              onCancel={() => setAdding(false)}
            />
          )}
          {scenes.map((s, i) => (
            <SceneCard
              key={s.id}
              scene={s}
              index={i + 1}
              characters={characters}
              onSave={onSave}
              onDelete={onDelete}
            />
          ))}
          {scenes.length === 0 && !adding && (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: 24,
                textAlign: "center",
                fontSize: "var(--fs-sm)",
                color: "var(--ink-4)",
                border: "1px dashed var(--border-2)",
                borderRadius: "var(--r-lg)",
              }}
            >
              씬을 추가해서 회차를 구조화해보세요
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function parseChars(s) {
  if (Array.isArray(s)) return s;
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function SceneCard({ scene, index, characters, autoEdit, onSave, onDelete, onCancel }) {
  const [editing, setEditing] = useState(autoEdit || false);
  const [draft, setDraft] = useState(() => ({
    ...scene,
    characters: parseChars(scene.characters),
  }));
  const [confirmDel, setConfirmDel] = useState(false);
  const [charPickerOpen, setCharPickerOpen] = useState(false);

  useEffect(() => {
    if (!editing) {
      setDraft({ ...scene, characters: parseChars(scene.characters) });
    }
  }, [scene.id, scene.situation, scene.setting, scene.characters, editing]);

  const linkedChars = (draft.characters || [])
    .map((id) => characters.find((c) => c.id === id))
    .filter(Boolean);

  const toggleChar = (id) => {
    const cur = draft.characters || [];
    setDraft({
      ...draft,
      characters: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    });
  };

  const save = () => {
    onSave({
      id: scene.id,
      situation: draft.situation,
      setting: draft.setting,
      characters: draft.characters,
    });
    if (!autoEdit) setEditing(false);
  };

  const cancel = () => {
    if (autoEdit) onCancel?.();
    else {
      setDraft({ ...scene, characters: parseChars(scene.characters) });
      setEditing(false);
    }
  };

  return (
    <div
      className={`card ${editing ? "editing" : "hover"}`}
      style={{ padding: 14, position: "relative" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
        }}
      >
        {index && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--accent)",
              fontFamily: "var(--font-mono)",
            }}
          >
            SCENE {String(index).padStart(2, "0")}
          </span>
        )}
      </div>

      {editing ? (
        <>
          <textarea
            value={draft.situation}
            onChange={(e) => setDraft({ ...draft, situation: e.target.value })}
            placeholder="상황 — 이 씬에서 무엇이 벌어지나요?"
            className="input serif"
            style={{ minHeight: 64, marginBottom: 8, lineHeight: 1.6 }}
            autoFocus
          />

          <label
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--ink-3)",
              display: "block",
              marginBottom: 4,
              letterSpacing: "var(--tracking-wide)",
              textTransform: "uppercase",
            }}
          >
            등장 캐릭터
          </label>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              marginBottom: 8,
              position: "relative",
            }}
          >
            {linkedChars.map((c) => (
              <span
                key={c.id}
                className="mention"
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                @{c.title}
                <button
                  onClick={() => toggleChar(c.id)}
                  title="제거"
                  data-tooltip="제거"
                  aria-label="제거"
                  style={{ display: "inline-flex" }}
                >
                  <Icon name="close" size={10} />
                </button>
              </span>
            ))}
            <button
              onClick={() => setCharPickerOpen((o) => !o)}
              title="캐릭터 추가"
              data-tooltip="캐릭터 추가"
              aria-label="캐릭터 추가"
              className="icon-btn sm"
              style={{
                width: 22,
                height: 22,
                borderRadius: "var(--r-sm)",
                background: "var(--bg-raised)",
              }}
            >
              <Icon name={charPickerOpen ? "close" : "at"} size={11} />
            </button>
            {charPickerOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: 4,
                  zIndex: 50,
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-2)",
                  borderRadius: "var(--r-md)",
                  boxShadow: "var(--shadow-md)",
                  padding: 4,
                  minWidth: 160,
                }}
              >
                {characters.length === 0 && (
                  <div style={{ padding: 8, fontSize: 11, color: "var(--ink-4)" }}>
                    등록된 캐릭터 없음
                  </div>
                )}
                {characters.map((c) => {
                  const sel = (draft.characters || []).includes(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleChar(c.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        width: "100%",
                        padding: "4px 8px",
                        fontSize: "var(--fs-sm)",
                        borderRadius: "var(--r-sm)",
                        textAlign: "left",
                        background: sel ? "var(--accent-soft)" : "transparent",
                        color: sel ? "var(--accent)" : "var(--ink-1)",
                      }}
                    >
                      {sel && <Icon name="check" size={11} />}
                      <span style={{ marginLeft: sel ? 0 : 17 }}>{c.title}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <label
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--ink-3)",
              display: "block",
              marginBottom: 4,
              letterSpacing: "var(--tracking-wide)",
              textTransform: "uppercase",
            }}
          >
            배경
          </label>
          <input
            value={draft.setting || ""}
            onChange={(e) => setDraft({ ...draft, setting: e.target.value })}
            placeholder="장소 / 시간 / 분위기"
            className="input"
            style={{ marginBottom: 8 }}
          />

          <div
            style={{
              display: "flex",
              gap: 4,
              justifyContent: "flex-end",
              paddingTop: 8,
              borderTop: "1px solid var(--border-1)",
            }}
          >
            {!autoEdit && (
              <IconButton
                icon="trash"
                label="삭제"
                variant="danger"
                size="sm"
                onClick={() => setConfirmDel(true)}
              />
            )}
            <div style={{ flex: 1 }} />
            <IconButton icon="cancel" label="취소" size="sm" onClick={cancel} />
            <IconButton
              icon="save"
              label="저장"
              variant="primary"
              size="sm"
              onClick={save}
            />
          </div>
        </>
      ) : (
        <>
          <p
            className="serif"
            style={{
              fontSize: "var(--fs-sm)",
              color: "var(--ink-1)",
              lineHeight: 1.6,
              marginBottom: 8,
            }}
          >
            {scene.situation || (
              <span style={{ color: "var(--ink-4)" }}>상황 미입력</span>
            )}
          </p>
          {linkedChars.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 4,
                marginBottom: 6,
              }}
            >
              {linkedChars.map((c) => (
                <span key={c.id} className="mention">
                  @{c.title}
                </span>
              ))}
            </div>
          )}
          {scene.setting && (
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-3)",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Icon name="map" size={11} /> {scene.setting}
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 10,
            }}
          >
            <IconButton
              icon="edit"
              label="수정"
              size="sm"
              onClick={() => setEditing(true)}
            />
          </div>
        </>
      )}

      <Confirm
        open={confirmDel}
        title="씬을 삭제할까요?"
        message="로그에 남아 롤백 가능해요."
        danger
        onConfirm={() => {
          onDelete(scene.id);
          setConfirmDel(false);
        }}
        onCancel={() => setConfirmDel(false)}
      />
    </div>
  );
}
