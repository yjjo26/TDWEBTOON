import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import * as api from "../../data/api";
import EditableFile from "../../components/EditableFile";

// 배경(world): 각 항목 1개 = 1개의 .md 파일
// 추후 카테고리/하위 필드(날씨/건축물/시대) 분화는 본문 .md 안에서 섹션으로 처리.
export default function BackgroundsTab() {
  const { novel, slug, refresh } = useOutletContext();
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  const items = novel.files
    .filter((f) => f.kind === "world")
    .sort((a, b) => a.title.localeCompare(b.title));

  const onAdd = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    try {
      const key = name.replace(/[\\/]/g, "_").slice(0, 60);
      await api.createFile(slug, {
        kind: "world",
        key,
        title: name,
        content: "## 날씨\n\n## 건축물\n\n## 시대 배경\n\n## 기타\n",
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
          placeholder="새 배경 (예: 대학교, 절, 산속)"
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

      {items.length === 0 ? (
        <p className="text-slate-400 text-sm px-1">
          등록된 배경이 없습니다. (저장 시 <code>world/&lt;이름&gt;.md</code> 형식. 본문 안에 날씨/건축물/시대 섹션이 자동 템플릿으로 들어갑니다.)
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((f) => (
            <li key={f.id}>
              <EditableFile
                file={f}
                onSave={(patch) => saveFile(f.id, patch)}
                onDelete={() => deleteFile(f.id)}
                contentRows={8}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
