import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  addBackgroundCategory,
  addBackgroundItem,
  deleteBackgroundCategory,
  deleteBackgroundItem,
  updateBackgroundCategory,
  updateBackgroundItem,
} from "../../data/store";

export default function BackgroundsTab() {
  const { novel } = useOutletContext();
  const [activeCatId, setActiveCatId] = useState(
    () => novel.backgrounds[0]?.id || null
  );
  const [newCatName, setNewCatName] = useState("");
  const [newItemName, setNewItemName] = useState("");

  // 카테고리가 삭제됐거나 활성 ID가 더 이상 없을 때 첫 번째로 복구
  useEffect(() => {
    if (!novel.backgrounds.find((b) => b.id === activeCatId)) {
      setActiveCatId(novel.backgrounds[0]?.id || null);
    }
  }, [novel.backgrounds, activeCatId]);

  const activeCat = novel.backgrounds.find((b) => b.id === activeCatId);

  const onAddCat = (e) => {
    e.preventDefault();
    const name = newCatName.trim();
    if (!name) return;
    addBackgroundCategory(novel.id, name);
    setNewCatName("");
  };

  const onAddItem = (e) => {
    e.preventDefault();
    const name = newItemName.trim();
    if (!name || !activeCat) return;
    addBackgroundItem(novel.id, activeCat.id, { name });
    setNewItemName("");
  };

  return (
    <section className="grid gap-4 md:grid-cols-[220px_1fr]">
      {/* 카테고리(배경) 사이드바 */}
      <aside className="bg-white border border-slate-200 rounded-xl p-3 space-y-3">
        <h3 className="text-xs font-semibold text-slate-500 px-1">배경</h3>
        <ul className="space-y-1">
          {novel.backgrounds.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => setActiveCatId(cat.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                  activeCatId === cat.id
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {cat.name}
                <span className="ml-2 text-xs text-slate-400">
                  {cat.items.length}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={onAddCat} className="flex gap-1 pt-2 border-t border-slate-100">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="새 배경"
            className="flex-1 border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-md px-2"
          >
            +
          </button>
        </form>
      </aside>

      {/* 활성 카테고리 상세 */}
      <div className="space-y-4">
        {activeCat ? (
          <>
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
              <input
                type="text"
                value={activeCat.name}
                onChange={(e) =>
                  updateBackgroundCategory(novel.id, activeCat.id, {
                    name: e.target.value,
                  })
                }
                className="flex-1 font-semibold text-slate-800 bg-transparent border-0 focus:outline-none focus:bg-slate-100 rounded px-2 py-1"
              />
              <button
                onClick={() => {
                  if (
                    confirm(
                      `'${activeCat.name}' 배경 카테고리를 삭제할까요? 하위 항목도 모두 삭제됩니다.`
                    )
                  ) {
                    deleteBackgroundCategory(novel.id, activeCat.id);
                  }
                }}
                className="text-xs text-red-500 hover:text-red-700"
              >
                카테고리 삭제
              </button>
            </div>

            <form
              onSubmit={onAddItem}
              className="bg-white border border-slate-200 rounded-xl p-3 flex gap-2"
            >
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={`새 항목 (예: ${activeCat.name === "대학교" ? "공학관" : "장소 이름"})`}
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-4 py-2"
              >
                추가
              </button>
            </form>

            {activeCat.items.length === 0 ? (
              <p className="text-slate-400 text-sm px-1">
                항목이 없습니다.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {activeCat.items.map((item) => (
                  <li
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) =>
                          updateBackgroundItem(novel.id, activeCat.id, item.id, {
                            name: e.target.value,
                          })
                        }
                        className="flex-1 font-medium text-slate-800 bg-transparent border-0 focus:outline-none focus:bg-slate-100 rounded px-1"
                      />
                      <button
                        onClick={() => {
                          if (confirm(`'${item.name}' 을(를) 삭제할까요?`)) {
                            deleteBackgroundItem(novel.id, activeCat.id, item.id);
                          }
                        }}
                        className="text-xs text-red-500 hover:text-red-700 shrink-0"
                      >
                        삭제
                      </button>
                    </div>
                    <textarea
                      value={item.description}
                      onChange={(e) =>
                        updateBackgroundItem(novel.id, activeCat.id, item.id, {
                          description: e.target.value,
                        })
                      }
                      placeholder="장소/배경 설명"
                      rows={3}
                      className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y"
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="text-slate-400 text-sm px-1">
            먼저 왼쪽에서 배경 카테고리를 추가하세요.
          </p>
        )}
      </div>
    </section>
  );
}
