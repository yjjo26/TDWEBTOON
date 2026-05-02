import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import * as api from "../../data/api";

export default function SynopsisTab() {
  const { novel, slug, refresh } = useOutletContext();
  const synopsis = novel.files.find((f) => f.kind === "synopsis");

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  // synopsis 가 없으면 자동 생성 (소설 1개당 1개 보장)
  useEffect(() => {
    if (!synopsis && !creating) {
      setCreating(true);
      api
        .createFile(slug, {
          kind: "synopsis",
          key: "main",
          title: "줄거리",
          content: "",
        })
        .then(refresh)
        .finally(() => setCreating(false));
    }
  }, [synopsis, creating, slug, refresh]);

  // 보기 모드일 때 외부 변경 동기화
  useEffect(() => {
    if (synopsis && !editing) setDraft(synopsis.content);
  }, [synopsis, editing]);

  if (!synopsis) {
    return <p className="text-slate-400 text-sm">줄거리 영역을 만드는 중...</p>;
  }

  const startEdit = () => {
    setDraft(synopsis.content);
    setEditing(true);
  };

  const cancel = () => {
    setDraft(synopsis.content);
    setEditing(false);
  };

  const save = async () => {
    if (draft === synopsis.content) {
      setEditing(false);
      return;
    }
    setBusy(true);
    try {
      await api.updateFile(slug, synopsis.id, { content: draft });
      await refresh();
      setEditing(false);
    } catch (e) {
      alert(`저장 실패: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-slate-700">
          줄거리{" "}
          <span className="text-xs font-normal text-slate-400">
            (storytelling_style.md)
          </span>
        </h2>
        <span className="text-xs text-slate-400">
          v{synopsis.current_version}
        </span>
      </div>

      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
          placeholder="줄거리를 입력하세요."
          className="w-full min-h-[280px] sm:min-h-[400px] border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 leading-relaxed text-slate-800 resize-y"
        />
      ) : (
        <div className="w-full min-h-[280px] sm:min-h-[400px] border border-transparent rounded-lg p-3 leading-relaxed text-slate-800 whitespace-pre-wrap break-words bg-slate-50">
          {synopsis.content || (
            <span className="text-slate-400">(줄거리가 비어 있습니다. [수정] 을 눌러 작성하세요.)</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 mt-3">
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
          </>
        ) : (
          <button
            onClick={startEdit}
            className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md px-4 py-2"
          >
            수정
          </button>
        )}
      </div>

      <p className="text-xs text-slate-400 mt-3">
        모든 변경 내역은 [로그] 탭에서 확인 + 롤백 가능합니다.
      </p>
    </section>
  );
}
