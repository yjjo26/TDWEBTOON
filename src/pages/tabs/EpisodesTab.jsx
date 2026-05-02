import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import * as api from "../../data/api";

export default function EpisodesTab() {
  const { novel, slug, refresh } = useOutletContext();
  const fileInputRef = useRef(null);

  const episodes = novel.files
    .filter((f) => f.kind === "episode")
    .sort((a, b) => Number(a.key) - Number(b.key));

  const [activeId, setActiveId] = useState(() => episodes[0]?.id || null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!episodes.find((e) => e.id === activeId)) {
      setActiveId(episodes[0]?.id || null);
    }
  }, [episodes, activeId]);

  const active = episodes.find((e) => e.id === activeId);

  const nextEpisodeNumber = () => {
    const nums = episodes.map((e) => Number(e.key)).filter((n) => !isNaN(n));
    return (nums.length ? Math.max(...nums) : 0) + 1;
  };

  const onAdd = async () => {
    setBusy(true);
    try {
      const n = nextEpisodeNumber();
      const created = await api.createFile(slug, {
        kind: "episode",
        key: String(n),
        title: `${n}화`,
        content: "",
      });
      setActiveId(created.id);
      await refresh();
    } catch (err) {
      alert(`추가 실패: ${err.message}`);
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
      if (firstId) setActiveId(firstId);
      await refresh();
    } catch (err) {
      alert(`업로드 실패: ${err.message}`);
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <section className="grid gap-4 md:grid-cols-[260px_1fr]">
      <aside className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between px-1 gap-2">
          <h3 className="text-xs font-semibold text-slate-500">
            회차 ({episodes.length})
          </h3>
          <div className="flex gap-1">
            <button
              onClick={onAdd}
              disabled={busy}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md px-2 py-1"
            >
              + 새 회차
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              className="text-xs bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-700 rounded-md px-2 py-1"
              title=".md / .txt 파일 다중 업로드 가능"
            >
              ⬆ 업로드
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".md,.txt,text/markdown,text/plain"
              onChange={onUpload}
              className="hidden"
            />
          </div>
        </div>
        {episodes.length === 0 ? (
          <p className="text-slate-400 text-xs px-2 py-3">회차가 없습니다.</p>
        ) : (
          <ul className="space-y-1">
            {episodes.map((ep) => (
              <li key={ep.id}>
                <button
                  onClick={() => setActiveId(ep.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition truncate ${
                    activeId === ep.id
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-slate-400 mr-2">{ep.key}화</span>
                  {ep.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <div>
        {active ? (
          <ActiveEpisodeEditor
            key={active.id}
            slug={slug}
            episode={active}
            refresh={refresh}
          />
        ) : (
          <p className="text-slate-400 text-sm px-1">
            왼쪽에서 회차를 선택하거나 [새 회차] / [업로드] 로 추가하세요.
          </p>
        )}
      </div>
    </section>
  );
}

function ActiveEpisodeEditor({ slug, episode, refresh }) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(episode.title);
  const [draftContent, setDraftContent] = useState(episode.content);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) {
      setDraftTitle(episode.title);
      setDraftContent(episode.content);
    }
  }, [episode.title, episode.content, editing]);

  const startEdit = () => {
    setDraftTitle(episode.title);
    setDraftContent(episode.content);
    setEditing(true);
  };

  const cancel = () => {
    setDraftTitle(episode.title);
    setDraftContent(episode.content);
    setEditing(false);
  };

  const save = async () => {
    if (draftTitle === episode.title && draftContent === episode.content) {
      setEditing(false);
      return;
    }
    setBusy(true);
    try {
      await api.updateFile(slug, episode.id, {
        title: draftTitle,
        content: draftContent,
      });
      await refresh();
      setEditing(false);
    } catch (e) {
      alert(`저장 실패: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`'${episode.title}' 회차를 삭제할까요?`)) return;
    setBusy(true);
    try {
      await api.deleteFile(slug, episode.id);
      await refresh();
    } catch (e) {
      alert(`삭제 실패: ${e.message}`);
      setBusy(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400 shrink-0">{episode.key}화</span>
        {editing ? (
          <input
            type="text"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            className="flex-1 text-lg font-semibold text-slate-800 border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        ) : (
          <h3 className="flex-1 text-lg font-semibold text-slate-800 px-2 py-1">
            {episode.title}
          </h3>
        )}
        <span className="text-xs text-slate-400 shrink-0">
          v{episode.current_version}
        </span>
      </div>

      {editing ? (
        <textarea
          value={draftContent}
          onChange={(e) => setDraftContent(e.target.value)}
          placeholder="회차 본문을 작성하세요."
          className="w-full min-h-[400px] border border-slate-300 rounded-lg p-3 leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y"
        />
      ) : (
        <div className="w-full min-h-[400px] border border-transparent rounded-lg p-3 leading-relaxed text-slate-800 whitespace-pre-wrap break-words bg-slate-50">
          {episode.content || (
            <span className="text-slate-400">(본문이 비어있습니다. [수정] 을 눌러 작성하세요.)</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        {editing ? (
          <>
            <button
              onClick={save}
              disabled={busy}
              className="text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md px-4 py-2 font-medium"
            >
              {busy ? "저장 중…" : "저장"}
            </button>
            <button
              onClick={cancel}
              disabled={busy}
              className="text-sm bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-md px-4 py-2"
            >
              취소
            </button>
            <button
              onClick={remove}
              disabled={busy}
              className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50 px-2"
            >
              삭제
            </button>
          </>
        ) : (
          <>
            <button
              onClick={startEdit}
              className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md px-4 py-2"
            >
              수정
            </button>
            <button
              onClick={remove}
              disabled={busy}
              className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50 px-2"
            >
              삭제
            </button>
          </>
        )}
      </div>
    </div>
  );
}
