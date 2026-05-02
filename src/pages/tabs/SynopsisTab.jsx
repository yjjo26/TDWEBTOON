import { useOutletContext } from "react-router-dom";
import { updateSynopsis } from "../../data/store";

export default function SynopsisTab() {
  const { novel } = useOutletContext();

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
      <h2 className="text-base font-semibold text-slate-700 mb-3">줄거리</h2>
      <textarea
        value={novel.synopsis}
        onChange={(e) => updateSynopsis(novel.id, e.target.value)}
        placeholder="줄거리를 입력하세요. 변경사항은 자동으로 저장됩니다."
        className="w-full min-h-[280px] sm:min-h-[400px] border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 leading-relaxed text-slate-800 resize-y"
      />
      <p className="text-xs text-slate-400 mt-2">
        변경 내역은 [로그] 탭에서 확인할 수 있습니다.
      </p>
    </section>
  );
}
