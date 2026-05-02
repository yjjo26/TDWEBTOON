import { useOutletContext } from "react-router-dom";

const ACTION_STYLE = {
  create: "bg-emerald-50 text-emerald-700 border-emerald-200",
  update: "bg-amber-50 text-amber-700 border-amber-200",
  delete: "bg-rose-50 text-rose-700 border-rose-200",
};

const ACTION_LABEL = {
  create: "추가",
  update: "수정",
  delete: "삭제",
};

function formatTs(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function LogsTab() {
  const { novel } = useOutletContext();
  const logs = novel.logs || [];

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-slate-700">변경 로그</h2>
        <span className="text-xs text-slate-400">{logs.length}건</span>
      </div>

      {logs.length === 0 ? (
        <p className="text-slate-400 text-sm">아직 기록된 변경이 없습니다.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {logs.map((log) => (
            <li key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-start gap-2">
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
                  {formatTs(log.timestamp)} · {log.target}
                </p>
                {(log.before !== undefined || log.after !== undefined) && (
                  <details className="mt-1">
                    <summary className="text-xs text-indigo-500 cursor-pointer select-none">
                      변경 상세 보기
                    </summary>
                    <div className="mt-2 grid sm:grid-cols-2 gap-2 text-xs">
                      {log.before !== undefined && (
                        <div className="bg-rose-50 border border-rose-100 rounded-md p-2">
                          <p className="font-semibold text-rose-600 mb-1">이전</p>
                          <pre className="whitespace-pre-wrap break-words text-rose-800">
                            {typeof log.before === "string"
                              ? log.before
                              : JSON.stringify(log.before, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.after !== undefined && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-md p-2">
                          <p className="font-semibold text-emerald-600 mb-1">이후</p>
                          <pre className="whitespace-pre-wrap break-words text-emerald-800">
                            {typeof log.after === "string"
                              ? log.after
                              : JSON.stringify(log.after, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
