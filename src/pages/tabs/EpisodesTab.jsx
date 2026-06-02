import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import * as api from "../../data/api";
import IconButton from "../../components/IconButton";
import UploadButton from "../../components/UploadButton";
import Icon from "../../components/Icon";
import Confirm from "../../components/Confirm";
import MentionTextarea from "../../components/MentionTextarea";
import PickerInput from "../../components/PickerInput";
import {
  countWords,
  composeProseFromScenes,
  normalizeChars,
} from "../../data/utils";
import { downloadKindZip, downloadMd } from "../../data/download";

export default function EpisodesTab() {
  const { novel, slug, refresh } = useOutletContext();
  const sidebarSide = localStorage.getItem("td:sidebar") || "left";

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
  const worlds = useMemo(
    () => novel.files.filter((f) => f.kind === "world"),
    [novel.files]
  );
  // @-멘션 자동완성 후보 (캐릭터 + 배경 통합)
  const mentions = useMemo(
    () => [
      ...characters.map((c) => ({ id: c.id, title: c.title, kind: "character" })),
      ...worlds.map((w) => ({ id: w.id, title: w.title, kind: "world" })),
    ],
    [characters, worlds]
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
            icon="download"
            label="회차 전체 ZIP 다운로드"
            size="sm"
            onClick={() => downloadKindZip(novel, "episode")}
            disabled={episodes.length === 0}
          />
          <UploadButton
            novel={novel}
            slug={slug}
            refresh={refresh}
            kind="episode"
            size="sm"
            label="회차 .md 다중 업로드 (씬 자동 분리·기존 회차 갱신)"
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
            <>
              <IconButton
                icon="download"
                label="이 회차 .md 다운로드"
                onClick={() => downloadMd(ep.title, ep.content)}
              />
              <IconButton
                icon="edit"
                label="수정"
                onClick={() => setEditing(true)}
              />
            </>
          )}
        </div>
      </div>

      <BodyComposite
        editing={editing}
        scenes={epScenes}
        characters={characters}
        worlds={worlds}
        manual={editing ? draft.body : ep.content}
        onChange={(v) => editing && setDraft({ ...draft, body: v })}
        mentions={mentions}
      />

      <EpisodeStats
        body={
          composeProseFromScenes(epScenes, characters, worlds) +
          "\n\n" +
          (editing ? draft.body : ep.content || "")
        }
        dirty={dirty}
      />

      <SceneList
        slug={slug}
        episodeId={ep.id}
        scenes={epScenes}
        characters={characters}
        worlds={worlds}
        mentions={mentions}
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

function SceneList({ slug, episodeId, scenes, characters, worlds, mentions, refresh }) {
  const [expanded, setExpanded] = useState(true);
  const [adding, setAdding] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [dropId, setDropId] = useState(null);

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

  const onDragStart = (e, id) => {
    setDragId(id);
    try {
      e.dataTransfer.effectAllowed = "move";
    } catch {
      /* ignore */
    }
  };
  const onDragOver = (e, id) => {
    if (!dragId || dragId === id) return;
    e.preventDefault();
    setDropId(id);
  };
  const onDrop = async (e, id) => {
    e.preventDefault();
    if (dragId && dragId !== id) {
      try {
        await api.reorderScenes(slug, episodeId, dragId, id);
        await refresh();
      } catch (err) {
        alert(`씬 정렬 실패: ${err.message}`);
      }
    }
    setDragId(null);
    setDropId(null);
  };
  const onDragEnd = () => {
    setDragId(null);
    setDropId(null);
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
              worlds={worlds}
              mentions={mentions}
              autoEdit
              onSave={onAdd}
              onCancel={() => setAdding(false)}
            />
          )}
          {scenes.map((s, i) => (
            <div
              key={s.id}
              draggable
              onDragStart={(e) => onDragStart(e, s.id)}
              onDragOver={(e) => onDragOver(e, s.id)}
              onDrop={(e) => onDrop(e, s.id)}
              onDragEnd={onDragEnd}
              className={`draggable ${dragId === s.id ? "dragging" : ""} ${
                dropId === s.id ? "drop-target" : ""
              }`}
              style={{ borderRadius: "var(--r-lg)" }}
            >
              <SceneCard
                scene={s}
                index={i + 1}
                characters={characters}
                worlds={worlds}
                mentions={mentions}
                onSave={onSave}
                onDelete={onDelete}
              />
            </div>
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

// 본문 박스 = (씬 자동 렌더 — 읽기 전용) + (추가 본문 textarea)
// 씬 카드 변경 시 위 영역이 즉시 갱신됨 — 추가 본문은 사용자 입력만 보존.
function BodyComposite({
  editing,
  scenes,
  characters,
  worlds,
  manual,
  onChange,
  mentions,
}) {
  const auto = composeProseFromScenes(scenes, characters, worlds);
  const hasAuto = auto.length > 0;

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: editing
          ? "1px solid var(--accent-border)"
          : "1px solid var(--border-1)",
        boxShadow: editing ? "var(--shadow-glow)" : "var(--shadow-sm)",
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
        transition: "all var(--dur) var(--ease-out)",
      }}
    >
      {hasAuto && (
        <>
          <div
            style={{
              padding: "16px 20px",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--ink-3)",
              letterSpacing: "var(--tracking-wide)",
              textTransform: "uppercase",
              borderBottom: "1px solid var(--border-1)",
              background: "var(--bg-raised)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="sparkles" size={12} />
            씬 자동 합본 — 아래 [씬 카드] 수정 시 즉시 갱신
          </div>
          <div
            className="serif"
            style={{
              padding: "10px 14px",
              fontSize: "var(--fs-md)",
              lineHeight: 1.9,
              maxHeight: 200,
              color: "var(--ink-1)",
              whiteSpace: "pre-wrap",
              wordBreak: "keep-all",
              overflowY: "auto",
            }}
          >
            {auto}
          </div>
        </>
      )}

      <div
        style={{
          padding: "10px 20px 6px",
          fontSize: 11,
          fontWeight: 700,
          color: "var(--ink-3)",
          letterSpacing: "var(--tracking-wide)",
          textTransform: "uppercase",
          borderTop: hasAuto ? "1px dashed var(--border-2)" : "none",
          background: "var(--bg-raised)",
        }}
      >
        추가 본문 (씬 외 자유 서술)
      </div>
      <MentionTextarea
        value={manual || ""}
        onChange={onChange}
        mentions={mentions}
        placeholder={
          hasAuto
            ? "씬 사이/마무리 등 추가 서술을 자유롭게 적어주세요. @로 멘션 가능."
            : "회차 본문을 적어주세요. @로 캐릭터·배경 자동완성이 떠요."
        }
        readOnly={!editing}
        style={{
          minHeight: 570,
          border: "none",
          borderRadius: 0,
          padding: "16px 4px 24px",
          fontFamily: "var(--font-serif)",
          fontSize: "var(--fs-md)",
          lineHeight: 1.9,
          color: editing ? "var(--ink-1)" : "var(--ink-2)",
          background: "transparent",
          width: "100%",
          boxShadow: "none",
        }}
      />
    </div>
  );
}

function SectionLabel({ children }) {
  return (
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
      {children}
    </label>
  );
}


function SceneCard({ scene, index, characters, worlds, mentions, autoEdit, onSave, onDelete, onCancel }) {
  const [editing, setEditing] = useState(autoEdit || false);
  const [draft, setDraft] = useState(() => ({
    situation: scene.situation || "",
    setting: scene.setting || "",
    characters: normalizeChars(scene.characters),
  }));
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    if (!editing) {
      setDraft({
        situation: scene.situation || "",
        setting: scene.setting || "",
        characters: normalizeChars(scene.characters),
      });
    }
  }, [scene.id, scene.situation, scene.setting, scene.characters, editing]);

  const charById = new Map(characters.map((c) => [c.id, c]));
  const worldById = new Map(worlds.map((w) => [w.id, w]));

  // 보기 모드용
  const linkedChars = (normalizeChars(scene.characters) || [])
    .map((c) => ({ ...c, file: charById.get(c.id) }))
    .filter((c) => c.file);
  const linkedWorld = worldById.get(scene.setting);
  // setting 이 ID 가 아니라 옛 자유 텍스트인 경우
  const legacySetting = scene.setting && !linkedWorld ? scene.setting : null;

  // 편집 모드 핸들러
  const addChar = (item) => {
    if ((draft.characters || []).find((c) => c.id === item.id)) return;
    setDraft({
      ...draft,
      characters: [...(draft.characters || []), { id: item.id, dialogue: "" }],
    });
  };
  const removeChar = (id) => {
    setDraft({
      ...draft,
      characters: (draft.characters || []).filter((c) => c.id !== id),
    });
  };
  const updateDialogue = (id, dialogue) => {
    setDraft({
      ...draft,
      characters: (draft.characters || []).map((c) =>
        c.id === id ? { ...c, dialogue } : c
      ),
    });
  };
  const setWorld = (item) => setDraft({ ...draft, setting: item.id });
  const clearWorld = () => setDraft({ ...draft, setting: "" });

  const save = () => {
    onSave({
      id: scene.id,
      situation: draft.situation,
      setting: draft.setting,
      characters: draft.characters, // [{id, dialogue}]
    });
    if (!autoEdit) setEditing(false);
  };

  const cancel = () => {
    if (autoEdit) onCancel?.();
    else {
      setDraft({
        situation: scene.situation || "",
        setting: scene.setting || "",
        characters: normalizeChars(scene.characters),
      });
      setEditing(false);
    }
  };

  const draftWorld = worldById.get(draft.setting);
  const draftLegacy = draft.setting && !draftWorld ? draft.setting : null;
  const excludeIds = (draft.characters || []).map((c) => c.id);

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
          <>
            <span
              className="drag-handle"
              title="드래그해서 순서 변경"
              data-tooltip="드래그해서 순서 변경"
              style={{ cursor: "grab", color: "var(--ink-4)" }}
            >
              <Icon name="drag" size={12} />
            </span>
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
          </>
        )}
      </div>

      {editing ? (
        <>
          {/* 상황 */}
          <SectionLabel>상황</SectionLabel>
          <div style={{ marginBottom: 12 }}>
            <MentionTextarea
              value={draft.situation}
              onChange={(v) => setDraft({ ...draft, situation: v })}
              mentions={mentions}
              placeholder="무엇이 벌어지나요? @로 캐릭터·배경 멘션 가능"
              className="input serif"
              style={{ minHeight: 64, lineHeight: 1.6 }}
              autoFocus
            />
          </div>

          {/* 등장 캐릭터 + 대사 */}
          <SectionLabel>등장 캐릭터 & 대사</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
            {(draft.characters || []).length === 0 && (
              <div style={{ fontSize: 11, color: "var(--ink-4)", padding: "2px 4px" }}>
                @ 입력으로 등록된 캐릭터를 추가하세요
              </div>
            )}
            {(draft.characters || []).map((c) => {
              const file = charById.get(c.id);
              return (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    gap: 6,
                    alignItems: "center",
                  }}
                >
                  <span
                    className="mention"
                    style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4 }}
                  >
                    @{file ? file.title : `(삭제됨)`}
                  </span>
                  <input
                    value={c.dialogue}
                    onChange={(e) => updateDialogue(c.id, e.target.value)}
                    placeholder="대사 (선택)"
                    className="input"
                    style={{ flex: 1, padding: "6px 10px", fontSize: "var(--fs-sm)" }}
                  />
                  <button
                    type="button"
                    onClick={() => removeChar(c.id)}
                    title="제거"
                    data-tooltip="제거"
                    aria-label="제거"
                    className="icon-btn sm"
                    style={{ flexShrink: 0 }}
                  >
                    <Icon name="close" size={11} />
                  </button>
                </div>
              );
            })}
            <PickerInput
              items={characters.map((c) => ({
                id: c.id,
                title: c.title,
                kind: "character",
              }))}
              exclude={excludeIds}
              onPick={addChar}
              placeholder={
                characters.length === 0
                  ? "(먼저 캐릭터 탭에서 캐릭터를 추가하세요)"
                  : "@ 입력해서 캐릭터 추가"
              }
              size="sm"
            />
          </div>

          {/* 배경 — 하단, 단일 선택 */}
          <SectionLabel>배경</SectionLabel>
          <div style={{ marginBottom: 8 }}>
            {draftWorld ? (
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                  padding: "6px 10px",
                  background: "var(--bg-raised)",
                  borderRadius: "var(--r-md)",
                  border: "1px solid var(--border-1)",
                }}
              >
                <Icon
                  name="map"
                  size={12}
                  style={{ color: "var(--ink-3)" }}
                />
                <span className="mention" style={{ flex: 1 }}>
                  @{draftWorld.title}
                </span>
                <button
                  type="button"
                  onClick={clearWorld}
                  title="배경 해제"
                  data-tooltip="배경 해제"
                  aria-label="배경 해제"
                  className="icon-btn sm"
                  style={{ flexShrink: 0 }}
                >
                  <Icon name="close" size={11} />
                </button>
              </div>
            ) : draftLegacy ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  padding: "8px 10px",
                  background: "var(--warn-soft)",
                  borderRadius: "var(--r-md)",
                  border: "1px solid var(--warn)",
                }}
              >
                <div style={{ fontSize: 11, color: "var(--warn)", fontWeight: 700 }}>
                  ⚠ 옛 자유 텍스트 (등록된 배경 아님): "{draftLegacy}"
                </div>
                <button
                  type="button"
                  onClick={clearWorld}
                  style={{
                    fontSize: 11,
                    color: "var(--warn)",
                    textDecoration: "underline",
                    textAlign: "left",
                  }}
                >
                  비우고 새 배경 선택
                </button>
              </div>
            ) : (
              <PickerInput
                items={worlds.map((w) => ({
                  id: w.id,
                  title: w.title,
                  kind: "world",
                }))}
                onPick={setWorld}
                placeholder={
                  worlds.length === 0
                    ? "(먼저 배경 탭에서 배경을 추가하세요)"
                    : "@ 입력해서 배경 선택"
                }
                size="sm"
              />
            )}
          </div>

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
              marginBottom: 10,
              whiteSpace: "pre-wrap",
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
                flexDirection: "column",
                gap: 4,
                marginBottom: 8,
              }}
            >
              {linkedChars.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    gap: 6,
                    alignItems: "baseline",
                    fontSize: "var(--fs-sm)",
                    lineHeight: 1.5,
                  }}
                >
                  <span className="mention" style={{ flexShrink: 0 }}>
                    @{c.file.title}
                  </span>
                  {c.dialogue && (
                    <span className="serif" style={{ color: "var(--ink-2)" }}>
                      "{c.dialogue}"
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {linkedWorld ? (
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-3)",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Icon name="map" size={11} />
              <span className="mention" style={{ fontSize: 11 }}>
                @{linkedWorld.title}
              </span>
            </div>
          ) : legacySetting ? (
            <div
              style={{
                fontSize: 11,
                color: "var(--warn)",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
              title="등록된 배경이 아닙니다 — 수정에서 다시 선택하세요"
            >
              <Icon name="map" size={11} /> {legacySetting} ⚠
            </div>
          ) : null}

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
