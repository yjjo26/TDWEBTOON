import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useLogs } from "../../data/hooks";
import * as api from "../../data/api";

const ACTION_STYLE = {
  create: "bg-emerald-50 text-emerald-700 border-emerald-200",
  update: "bg-amber-50 text-amber-700 border-amber-200",
  delete: "bg-rose-50 text-rose-700 border-rose-200",
  rollback: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

const ACTION_LABEL = {
  create: "추가",
  update: "수정",
  delete: "삭제",
  rollback: "롤백",
};

const KIND_LABEL = {
  novel: "소설",
  title: "제목",
  synopsis: "줄거리",
  character: "캐릭터",
  world: "배경",
  episode: "회차",
};

function formatTs(ms) {
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function LogsTab() {
  const { slug, refresh } = useOutletContext();
  const { logs, error, refresh: refreshLogs } = useLogs(slug);
  const [busyId, setBusyId] = useState(null);

  const onRollback = async (log) => {
    if (!log.target_id || !log.before_version) {
      alert("롤백 대상 버전 정보가 없는 로그입니다.");
      return;
    }
    if (
      !confirm(
        `'${log.description}' 의 이전 버전(v${log.before_version})으로 롤백할까요?`
      )
    )
      return;
    setBusyId(log.id);
    try {
      await api.rollbackFile(slug, log.target_id, log.before_version);
      await refresh();
      await refreshLogs();
    } catch (err) {
      alert(`롤백 실패: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-slate-700">변경 로그</h2>
        <button
          onClick={refreshLogs}
          className="text-xs text-slate-500 hover:text-slate-700"
        >
          🔄 새로고침
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500 mb-3">서버 오류: {error}</p>
      )}

      {logs === null ? (
        <p className="text-slate-400 text-sm">불러오는 중...</p>
      ) : logs.length === 0 ? (
        <p className="text-slate-400 text-sm">아직 기록된 변경이 없습니다.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {logs.map((log) => (
            <li
              key={log.id}
              className="py-3 flex flex-col sm:flex-row sm:items-start gap-2"
            >
              <span
                className={`inline-block text-xs border rounded-md px-2 py-0.5 font-medium shrink-0 ${
                  ACTION_STYLE[log.action] ||
                  "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                {ACTION_LABEL[log.action] || log.action}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800">{log.description}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatTs(log.timestamp)} · {KIND_LABEL[log.target_kind] || log.target_kind}
                  {log.before_version != null && (
                    <span className="ml-2">
                      v{log.before_version}
                      {log.after_version != null && ` → v${log.after_version}`}
                    </span>
                  )}
                </p>
              </div>
              {log.action === "update" && log.target_id && log.before_version && (
                <button
                  onClick={() => onRollback(log)}
                  disabled={busyId === log.id}
                  className="text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50 shrink-0"
                  title={`v${log.before_version} 으로 되돌리기`}
                >
                  {busyId === log.id ? "..." : "↩ 이 시점으로 롤백"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
