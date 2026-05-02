import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import * as api from "../../data/api";
import EditableFile from "../../components/EditableFile";

export default function CharactersTab() {
  const { novel, slug, refresh } = useOutletContext();
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  const characters = novel.files
    .filter((f) => f.kind === "character")
    .sort((a, b) => a.title.localeCompare(b.title));

  const onAdd = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    try {
      // key 는 한글 그대로 (filesystem 친화적이지만 unique 만 되면 됨)
      const key = name.replace(/[\\/]/g, "_").slice(0, 60);
      await api.createFile(slug, {
        kind: "character",
        key,
        title: name,
        content: "",
      });
      setNewName("");
      await refresh();
    } catch (err) {
      alert(`추가 실패: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const saveFile = async (id, patch) => {
    await api.updateFile(slug, id, patch);
    await refresh();
  };

  const deleteFile = async (id) => {
    await api.deleteFile(slug, id);
    await refresh();
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
          disabled={busy}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 transition"
        >
          {busy ? "..." : "추가"}
        </button>
      </form>

      {characters.length === 0 ? (
        <p className="text-slate-400 text-sm px-1">
          등록된 캐릭터가 없습니다. (저장 시 <code>characters/&lt;이름&gt;.md</code> 형식으로 보관됨)
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {characters.map((f) => (
            <li key={f.id}>
              <EditableFile
                file={f}
                onSave={(patch) => saveFile(f.id, patch)}
                onDelete={() => deleteFile(f.id)}
                contentRows={4}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
