export default function Confirm({
  open,
  title,
  message,
  danger,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        animation: "pageIn 200ms var(--ease-out)",
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-surface)",
          borderRadius: "var(--r-xl)",
          boxShadow: "var(--shadow-lg)",
          padding: 24,
          width: 360,
          maxWidth: "90vw",
        }}
      >
        <h3
          style={{ fontSize: "var(--fs-lg)", fontWeight: 700, marginBottom: 8 }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--ink-3)",
            marginBottom: 20,
          }}
        >
          {message}
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 14px",
              fontSize: "var(--fs-sm)",
              fontWeight: 600,
              color: "var(--ink-2)",
              background: "var(--bg-raised)",
              borderRadius: "var(--r-md)",
            }}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "8px 14px",
              fontSize: "var(--fs-sm)",
              fontWeight: 700,
              color: "white",
              background: danger ? "var(--danger)" : "var(--accent)",
              borderRadius: "var(--r-md)",
            }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
