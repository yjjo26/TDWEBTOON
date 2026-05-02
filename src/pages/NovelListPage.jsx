import { useState } from "react";
import { Link } from "react-router-dom";
import { useNovels } from "../data/hooks";
import * as api from "../data/api";
import { useAuth } from "../context/AuthContext";

export default function NovelListPage() {
  const { logout } = useAuth();
  const { novels, error, refresh } = useNovels();
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);

  const onCreate = async (e) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setBusy(true);
    try {
      await api.createNovel(title);
      setNewTitle("");
      await refresh();
    } catch (err) {
      alert(`생성 실패: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (slug, title) => {
    if (!confirm(`'${title}' 을(를) 삭제할까요?`)) return;
    try {
      await api.deleteNovel(slug);
      await refresh();
    } catch (err) {
      alert(`삭제 실패: ${err.message}`);
    }
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
              disabled={busy}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 transition"
            >
              {busy ? "추가 중..." : "추가"}
            </button>
          </form>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-500 mb-3">
            내 소설{novels ? ` (${novels.length})` : ""}
          </h2>

          {error && (
            <p className="text-sm text-red-500 mb-3">서버 오류: {error}</p>
          )}

          {novels === null ? (
            <p className="text-slate-400 text-sm">불러오는 중...</p>
          ) : novels.length === 0 ? (
            <p className="text-slate-400 text-sm">아직 등록된 소설이 없습니다.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {novels.map((novel) => (
                <li
                  key={novel.slug}
                  className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition flex flex-col"
                >
                  <Link
                    to={`/novels/${encodeURIComponent(novel.slug)}`}
                    className="block flex-1 mb-3"
                  >
                    <h3 className="font-semibold text-slate-800 mb-1">
                      {novel.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      slug: {novel.slug} · 다음 회차: {novel.next_episode}화
                    </p>
                  </Link>
                  <button
                    onClick={() => onDelete(novel.slug, novel.title)}
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
