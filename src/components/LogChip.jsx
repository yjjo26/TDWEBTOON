const MAP = {
  create: { label: "추가", cls: "chip-add" },
  add: { label: "추가", cls: "chip-add" },
  update: { label: "수정", cls: "chip-edit" },
  edit: { label: "수정", cls: "chip-edit" },
  delete: { label: "삭제", cls: "chip-delete" },
  rollback: { label: "롤백", cls: "chip-rollback" },
};

export default function LogChip({ kind }) {
  const m = MAP[kind] || MAP.update;
  return <span className={`chip ${m.cls}`}>{m.label}</span>;
}
