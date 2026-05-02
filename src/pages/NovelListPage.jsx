import { useState } from "react";
import { Link } from "react-router-dom";
import { useStoreState } from "../data/useStore";
import { createNovel, deleteNovel } from "../data/store";
import { useAuth } from "../context/AuthContext";

export default function NovelListPage() {
  const { logout } = useAuth();
  const state = useStoreState();
  const [newTitle, setNewTitle] = useState("");

  const onCreate = (e) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    createNovel(title);
    setNewTitle("");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">📚 소설 작업실</h1>
          <button
            onClick={logout}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <section>
          <h2 className="text-sm font-semibold text-slate-500 mb-3">
            새 소설 만들기
          </h2>
          <form onSubmit={onCreate} className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="새 소설 제목"
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-4 py-2 transition"
            >
              추가
            </button>
          </form>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-500 mb-3">
            내 소설 ({state.novels.length})
          </h2>
          {state.novels.length === 0 ? (
            <p className="text-slate-400 text-sm">아직 등록된 소설이 없습니다.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {state.novels.map((novel) => (
                <li
                  key={novel.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition flex flex-col"
                >
                  <Link
                    to={`/novels/${novel.id}`}
                    className="block flex-1 mb-3"
                  >
                    <h3 className="font-semibold text-slate-800 mb-1">
                      {novel.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {novel.synopsis || "줄거리가 비어 있습니다."}
                    </p>
                    <div className="mt-2 text-xs text-slate-400">
                      회차 {novel.episodes.length} · 캐릭터{" "}
                      {novel.characters.length} · 배경 {novel.backgrounds.length}
                    </div>
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm(`'${novel.title}' 을(를) 삭제할까요?`)) {
                        deleteNovel(novel.id);
                      }
                    }}
                    className="self-start text-xs text-red-500 hover:text-red-700"
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
