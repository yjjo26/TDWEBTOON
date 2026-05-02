import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { addEpisode, deleteEpisode, updateEpisode } from "../../data/store";

export default function EpisodesTab() {
  const { novel } = useOutletContext();
  const [activeId, setActiveId] = useState(() => novel.episodes[0]?.id || null);

  useEffect(() => {
    if (!novel.episodes.find((e) => e.id === activeId)) {
      setActiveId(novel.episodes[0]?.id || null);
    }
  }, [novel.episodes, activeId]);

  const active = novel.episodes.find((e) => e.id === activeId);

  return (
    <section className="grid gap-4 md:grid-cols-[240px_1fr]">
      <aside className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-semibold text-slate-500">회차 목록</h3>
          <button
            onClick={() => addEpisode(novel.id, {})}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-2 py-0.5"
          >
            + 새 회차
          </button>
        </div>
        <ul className="space-y-1">
          {novel.episodes.map((ep) => (
            <li key={ep.id}>
              <button
                onClick={() => setActiveId(ep.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition truncate ${
                  activeId === ep.id
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {ep.title || "(제목 없음)"}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div>
        {active ? (
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={active.title}
                onChange={(e) =>
                  updateEpisode(novel.id, active.id, { title: e.target.value })
                }
                className="flex-1 text-lg font-semibold text-slate-800 bg-transparent border-0 focus:outline-none focus:bg-slate-100 rounded px-2 py-1"
              />
              <button
                onClick={() => {
                  if (confirm(`'${active.title}' 회차를 삭제할까요?`)) {
                    deleteEpisode(novel.id, active.id);
                  }
                }}
                className="text-xs text-red-500 hover:text-red-700"
              >
                회차 삭제
              </button>
            </div>
            <textarea
              value={active.content}
              onChange={(e) =>
                updateEpisode(novel.id, active.id, { content: e.target.value })
              }
              placeholder="회차 본문을 작성하세요."
              className="w-full min-h-[400px] border border-slate-200 rounded-lg p-3 leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y"
            />
          </div>
        ) : (
          <p className="text-slate-400 text-sm px-1">
            왼쪽에서 회차를 선택하거나 새로 추가하세요.
          </p>
        )}
      </div>
    </section>
  );
}
