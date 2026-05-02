import { NavLink, Outlet, useParams, Link } from "react-router-dom";
import { useStoreState } from "../data/useStore";
import { updateNovelTitle } from "../data/store";

const TABS = [
  { to: "synopsis", label: "줄거리" },
  { to: "characters", label: "캐릭터" },
  { to: "backgrounds", label: "배경" },
  { to: "episodes", label: "회차" },
  { to: "logs", label: "로그" },
];

export default function NovelDetailPage() {
  const { novelId } = useParams();
  const state = useStoreState();
  const novel = state.novels.find((n) => n.id === novelId);

  if (!novel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-500">
        <p>소설을 찾을 수 없습니다.</p>
        <Link to="/novels" className="text-indigo-600 mt-2 underline">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link
            to="/novels"
            className="text-slate-400 hover:text-slate-600 text-xl shrink-0"
            title="목록으로"
          >
            ←
          </Link>
          <input
            type="text"
            value={novel.title}
            onChange={(e) => updateNovelTitle(novel.id, e.target.value)}
            className="flex-1 text-lg font-bold text-slate-800 bg-transparent border-0 focus:outline-none focus:bg-slate-100 rounded px-2 py-1"
          />
        </div>

        {/* Tabs */}
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
        <Outlet context={{ novel }} />
      </main>
    </div>
  );
}
