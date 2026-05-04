import { useRef, useState } from "react";
import IconButton from "./IconButton";
import { importMdFiles, summarizeStats } from "../data/import";

// 탭 공통 업로드 버튼.
// kind: 'synopsis' | 'character' | 'world' | 'episode'
// multiple=false 면 단일 파일만 (synopsis 같은 경우)
export default function UploadButton({
  novel,
  slug,
  kind,
  refresh,
  label,
  multiple = true,
  size,
  align,
}) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);

  const onChange = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    setBusy(true);
    try {
      const stats = await importMdFiles(novel, slug, kind, files);
      await refresh();
      alert(`업로드 완료 — ${summarizeStats(stats)}`);
    } catch (err) {
      alert(`업로드 실패: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <IconButton
        icon="upload"
        label={label || ".md 업로드"}
        size={size}
        align={align}
        onClick={() => ref.current?.click()}
        disabled={busy}
      />
      <input
        ref={ref}
        type="file"
        multiple={multiple}
        accept=".md,.txt,text/markdown,text/plain"
        onChange={onChange}
        style={{ display: "none" }}
      />
    </>
  );
}
