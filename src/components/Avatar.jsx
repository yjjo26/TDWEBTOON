export function Avatar({ user, size = 28 }) {
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        background: user.color,
        fontSize: size * 0.4,
      }}
      title={user.name}
      data-tooltip={user.name}
    >
      {user.initials}
    </span>
  );
}

export function AvatarStack({ users, max = 3 }) {
  if (!users?.length) return null;
  return (
    <div style={{ display: "inline-flex", alignItems: "center" }}>
      {users.slice(0, max).map((u, i) => (
        <span key={u.id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
          <Avatar user={u} />
        </span>
      ))}
      {users.length > max && (
        <span
          className="avatar"
          style={{ background: "var(--ink-4)", marginLeft: -8 }}
        >
          +{users.length - max}
        </span>
      )}
    </div>
  );
}
