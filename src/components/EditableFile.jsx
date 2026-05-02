import { useEffect, useState } from "react";

// 수정 모드 / 보기 모드 카드.
// 보기 모드: 제목·본문 표시 + [수정] [삭제]
// 수정 모드: 제목 input + 본문 textarea + [저장] [취소] [삭제]
//
// props:
//   file: { id, title, content, current_version }
//   onSave({ title, content }) -> Promise
//   onDelete() -> Promise
//   contentRows / contentMinHeight: textarea 사이즈 힌트
export default function EditableFile({
  file,
  onSave,
  onDelete,
  contentRows = 4,
  contentMinHeight,
}) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(file.title);
  const [draftContent, setDraftContent] = useState(file.content);
  const [busy, setBusy] = useState(false);

  // file 이 외부에서 갱신될 때(다른 사람 수정 등) 보기 모드일 때만 동기화
  useEffect(() => {
    if (!editing) {
      setDraftTitle(file.title);
      setDraftContent(file.content);
    }
  }, [file.title, file.content, editing]);

  const startEdit = () => {
    setDraftTitle(file.title);
    setDraftContent(file.content);
    setEditing(true);
  };

  const cancel = () => {
    setDraftTitle(file.title);
    setDraftContent(file.content);
    setEditing(false);
  };

  const save = async () => {
    if (draftTitle === file.title && draftContent === file.content) {
      setEditing(false);
      return;
    }
    setBusy(true);
    try {
      await onSave({ title: draftTitle, content: draftContent });
      setEditing(false);
    } catch (e) {
      alert(`저장 실패: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`'${file.title}' 을(를) 삭제할까요?`)) return;
    setBusy(true);
    try {
      await onDelete();
    } catch (e) {
      alert(`삭제 실패: ${e.message}`);
      setBusy(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
      <div className="flex items-start gap-2">
        {editing ? (
          <input
            type="text"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            autoFocus
            className="flex-1 font-semibold text-slate-800 border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        ) : (
          <h4 className="flex-1 font-semibold text-slate-800 px-1 py-1">
            {file.title}
          </h4>
        )}
        <span className="text-xs text-slate-400 shrink-0 mt-2">
          v{file.current_version}
        </span>
      </div>

      {editing ? (
        <textarea
          value={draftContent}
          onChange={(e) => setDraftContent(e.target.value)}
          rows={contentRows}
          style={contentMinHeight ? { minHeight: contentMinHeight } : undefined}
          placeholder="설명 / 본문"
          className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y leading-relaxed"
        />
      ) : (
        <div className="w-full border border-transparent rounded-lg p-2 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap break-words min-h-[3rem]">
          {file.content || (
            <span className="text-slate-400">(내용 없음)</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        {editing ? (
          <>
            <button
              onClick={save}
              disabled={busy}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md px-3 py-1.5 font-medium"
            >
              {busy ? "저장 중…" : "저장"}
            </button>
            <button
              onClick={cancel}
              disabled={busy}
              className="text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-md px-3 py-1.5"
            >
              취소
            </button>
            <button
              onClick={remove}
              disabled={busy}
              className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 px-1"
            >
              삭제
            </button>
          </>
        ) : (
          <>
            <button
              onClick={startEdit}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md px-3 py-1.5"
            >
              수정
            </button>
            <button
              onClick={remove}
              disabled={busy}
              className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 px-1"
            >
              삭제
            </button>
          </>
        )}
      </div>
    </div>
  );
}
