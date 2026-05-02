import { useEffect, useState } from "react";
import { NavLink, Outlet, useParams, Link } from "react-router-dom";
import { useNovel } from "../data/hooks";
import * as api from "../data/api";

const TABS = [
  { to: "synopsis", label: "줄거리" },
  { to: "characters", label: "캐릭터" },
  { to: "backgrounds", label: "배경" },
  { to: "episodes", label: "회차" },
  { to: "logs", label: "로그" },
];

export default function NovelDetailPage() {
  const { slug } = useParams();
  const { novel, error, loading, refresh } = useNovel(slug);

  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [busyTitle, setBusyTitle] = useState(false);

  useEffect(() => {
    if (novel && !editingTitle) setDraftTitle(novel.title);
  }, [novel, editingTitle]);

  if (loading && !novel) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        불러오는 중...
      </div>
    );
  }

  if (error || !novel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-500 gap-2">
        <p>{error || "소설을 찾을 수 없습니다."}</p>
        <Link to="/novels" className="text-indigo-600 underline">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const startEditTitle = () => {
    setDraftTitle(novel.title);
    setEditingTitle(true);
  };

  const cancelTitle = () => {
    setDraftTitle(novel.title);
    setEditingTitle(false);
  };

  const saveTitle = async () => {
    if (!draftTitle.trim() || draftTitle === novel.title) {
      setEditingTitle(false);
      return;
    }
    setBusyTitle(true);
    try {
      await api.updateNovelTitle(slug, draftTitle.trim());
      await refresh();
      setEditingTitle(false);
    } catch (e) {
      alert(`저장 실패: ${e.message}`);
    } finally {
      setBusyTitle(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2">
          <Link
            to="/novels"
            className="text-slate-400 hover:text-slate-600 text-xl shrink-0"
            title="목록으로"
          >
            ←
          </Link>

          {editingTitle ? (
            <>
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                autoFocus
                className="flex-1 text-lg font-bold text-slate-800 border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                onClick={saveTitle}
                disabled={busyTitle}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md px-3 py-1.5 font-medium"
              >
                {busyTitle ? "저장 중…" : "저장"}
              </button>
              <button
                onClick={cancelTitle}
                disabled={busyTitle}
                className="text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-md px-3 py-1.5"
              >
                취소
              </button>
            </>
          ) : (
            <>
              <h1 className="flex-1 text-lg font-bold text-slate-800 px-2 py-1 truncate">
                {novel.title}
              </h1>
              <button
                onClick={startEditTitle}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md px-3 py-1.5"
              >
                제목 수정
              </button>
            </>
          )}
        </div>

        <nav className="max-w-5xl mx-auto px-4 sm:px-6 -mb-px flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                `px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                  isActive
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <Outlet context={{ novel, slug, refresh }} />
      </main>
    </div>
  );
}
