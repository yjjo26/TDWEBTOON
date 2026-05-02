import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  addCharacter,
  deleteCharacter,
  updateCharacter,
} from "../../data/store";

export default function CharactersTab() {
  const { novel } = useOutletContext();
  const [newName, setNewName] = useState("");

  const onAdd = (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    addCharacter(novel.id, { name });
    setNewName("");
  };

  return (
    <section className="space-y-4">
      <form
        onSubmit={onAdd}
        className="bg-white border border-slate-200 rounded-xl p-4 flex gap-2"
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="새 캐릭터 이름"
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-4 py-2 transition"
        >
          추가
        </button>
      </form>

      {novel.characters.length === 0 ? (
        <p className="text-slate-400 text-sm px-1">
          등록된 캐릭터가 없습니다.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {novel.characters.map((c) => (
            <li
              key={c.id}
              className="bg-white border border-slate-200 rounded-xl p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <input
                  type="text"
                  value={c.name}
                  onChange={(e) =>
                    updateCharacter(novel.id, c.id, { name: e.target.value })
                  }
                  className="flex-1 font-semibold text-slate-800 bg-transparent border-0 focus:outline-none focus:bg-slate-100 rounded px-1"
                />
                <button
                  onClick={() => {
                    if (confirm(`'${c.name}' 캐릭터를 삭제할까요?`)) {
                      deleteCharacter(novel.id, c.id);
                    }
                  }}
                  className="text-xs text-red-500 hover:text-red-700 shrink-0"
                >
                  삭제
                </button>
              </div>
              <textarea
                value={c.description}
                onChange={(e) =>
                  updateCharacter(novel.id, c.id, {
                    description: e.target.value,
                  })
                }
                placeholder="캐릭터 설명"
                rows={3}
                className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y"
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
