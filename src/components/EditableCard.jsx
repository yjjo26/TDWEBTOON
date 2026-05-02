import { useEffect, useState } from "react";
import IconButton from "./IconButton";
import Confirm from "./Confirm";

// Reusable 카드 — 보기/수정 토글. TD/screens-detail.jsx EditableCard 1:1 포팅.
// fields: [{ key, type?: 'textarea', placeholder, autoFocus?, bold?, large?, serif?, minHeight? }]
export default function EditableCard({
  item,
  fields,
  onSave,
  onDelete,
  autoEdit,
  onCancelNew,
}) {
  const [editing, setEditing] = useState(autoEdit || false);
  const [draft, setDraft] = useState(item);
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    setDraft(item);
  }, [item.id]);

  const save = () => {
    onSave(draft);
    setEditing(false);
  };

  const cancel = () => {
    if (autoEdit) onCancelNew?.();
    else {
      setDraft(item);
      setEditing(false);
    }
  };

  return (
    <div className={`card ${editing ? "editing" : "hover"}`} style={{ padding: 16 }}>
      {editing ? (
        <>
          {fields.map((f) =>
            f.type === "textarea" ? (
              <textarea
                key={f.key}
                value={draft[f.key] || ""}
                onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className="input"
                style={{
                  marginBottom: 8,
                  minHeight: f.minHeight || 80,
                  fontFamily: f.serif ? "var(--font-serif)" : "inherit",
                  lineHeight: 1.7,
                }}
              />
            ) : (
              <input
                key={f.key}
                value={draft[f.key] || ""}
                onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className="input"
                style={{
                  marginBottom: 8,
                  fontWeight: f.bold ? 700 : 400,
                  fontSize: f.large ? "var(--fs-md)" : "var(--fs-base)",
                }}
                autoFocus={f.autoFocus}
              />
            )
          )}
          <div
            style={{
              display: "flex",
              gap: 4,
              justifyContent: "flex-end",
              marginTop: 8,
              paddingTop: 8,
              borderTop: "1px solid var(--border-1)",
            }}
          >
            {!autoEdit && (
              <IconButton
                icon="trash"
                label="삭제"
                variant="danger"
                size="sm"
                onClick={() => setConfirmDel(true)}
              />
            )}
            <div style={{ flex: 1 }} />
            <IconButton icon="cancel" label="취소" size="sm" onClick={cancel} />
            <IconButton
              icon="save"
              label="저장"
              shortcut="⌘S"
              variant="primary"
              size="sm"
              onClick={save}
            />
          </div>
        </>
      ) : (
        <>
          {fields.map((f) =>
            f.type === "textarea" ? (
              <p
                key={f.key}
                className={f.serif ? "serif" : ""}
                style={{
                  fontSize: "var(--fs-sm)",
                  color: "var(--ink-2)",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                }}
              >
                {item[f.key] || (
                  <span style={{ color: "var(--ink-4)" }}>{f.placeholder}</span>
                )}
              </p>
            ) : (
              <h3
                key={f.key}
                className="serif"
                style={{
                  fontSize: "var(--fs-md)",
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                {item[f.key] || "제목 없음"}
              </h3>
            )
          )}
          <div
            style={{
              display: "flex",
              gap: 4,
              justifyContent: "flex-end",
              marginTop: 12,
            }}
          >
            <IconButton
              icon="edit"
              label="수정"
              size="sm"
              onClick={() => setEditing(true)}
            />
          </div>
        </>
      )}
      <Confirm
        open={confirmDel}
        title="삭제할까요?"
        message="로그에 남아 롤백 가능해요."
        danger
        onConfirm={() => {
          onDelete(item.id);
          setConfirmDel(false);
        }}
        onCancel={() => setConfirmDel(false)}
      />
    </div>
  );
}
