// components.jsx — Icon, IconButton with tooltip, primitives
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ─── Lucide-style inline icons (24px, stroke 1.75)
const Icon = ({ name, size = 18, stroke = 1.75, ...rest }) => {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: stroke,
    strokeLinecap: 'round', strokeLinejoin: 'round',
    ...rest,
  };
  const paths = {
    // pencil — edit
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></>,
    save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>,
    cancel: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    rollback: <><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    filter: <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
    close: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>,
    feather: <><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></>,
    palette: <><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></>,
    layout: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></>,
    list: <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
    grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
    sort: <><path d="M11 5h10"/><path d="M11 9h7"/><path d="M11 13h4"/><path d="M3 17l3 3 3-3"/><path d="M6 18V4"/></>,
    drag: <><circle cx="9" cy="5" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="19" r="1" fill="currentColor"/><circle cx="15" cy="5" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="19" r="1" fill="currentColor"/></>,
    chevronDown: <polyline points="6 9 12 15 18 9"/>,
    chevronRight: <polyline points="9 18 15 12 9 6"/>,
    chevronLeft: <polyline points="15 18 9 12 15 6"/>,
    chevronUp: <polyline points="18 15 12 9 6 15"/>,
    arrowUp: <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>,
    arrowDown: <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    eyeOff: <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>,
    sun: <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
    fileText: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
    folder: <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>,
    map: <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    history: <><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><polyline points="12 7 12 12 16 14"/></>,
    info: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
    sparkles: <><path d="M12 3l1.9 5.8L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-2.2z"/><path d="M19 3l.5 1.5L21 5l-1.5.5L19 7l-.5-1.5L17 5l1.5-.5z"/><path d="M19 17l.5 1.5L21 19l-1.5.5L19 21l-.5-1.5L17 19l1.5-.5z"/></>,
    at: <><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></>,
    moreH: <><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/><circle cx="5" cy="12" r="1" fill="currentColor"/></>,
    moreV: <><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/></>,
    archive: <><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></>,
    check: <polyline points="20 6 9 17 4 12"/>,
    pin: <><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24z"/></>,
    play: <polygon points="5 3 19 12 5 21 5 3"/>,
    home: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
  };
  return <svg {...props}>{paths[name] || null}</svg>;
};

// IconButton — always tooltipped, always icon-only
const IconButton = ({ icon, label, variant = 'default', size = 'md', shortcut, onClick, disabled, className = '', ...rest }) => {
  const tip = shortcut ? `${label} · ${shortcut}` : label;
  const cls = `icon-btn ${variant !== 'default' ? variant : ''} ${size !== 'md' ? size : ''} ${className}`.trim();
  return (
    <button
      type="button"
      className={cls}
      title={tip}
      data-tooltip={tip}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      <Icon name={icon} size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
    </button>
  );
};

// Avatar
const Avatar = ({ user, size = 28 }) => (
  <span
    className="avatar"
    style={{ width: size, height: size, background: user.color, fontSize: size * 0.4 }}
    title={user.name}
    data-tooltip={user.name}
  >
    {user.initials}
  </span>
);

const AvatarStack = ({ users, max = 3 }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center' }}>
    {users.slice(0, max).map((u, i) => (
      <span key={u.id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
        <Avatar user={u} />
      </span>
    ))}
    {users.length > max && (
      <span className="avatar" style={{ background: 'var(--ink-4)', marginLeft: -8 }}>
        +{users.length - max}
      </span>
    )}
  </div>
);

// Chip for log kinds
const LogChip = ({ kind }) => {
  const map = {
    add:      { label: '추가', cls: 'chip-add' },
    edit:     { label: '수정', cls: 'chip-edit' },
    delete:   { label: '삭제', cls: 'chip-delete' },
    rollback: { label: '롤백', cls: 'chip-rollback' },
  };
  const m = map[kind] || map.edit;
  return <span className={`chip ${m.cls}`}>{m.label}</span>;
};

// Confirm dialog
const Confirm = ({ open, title, message, danger, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      animation: 'pageIn 200ms var(--ease-out)',
    }}>
      <div style={{
        background: 'var(--bg-surface)', borderRadius: 'var(--r-xl)',
        boxShadow: 'var(--shadow-lg)', padding: 24, width: 360, maxWidth: '90vw',
      }}>
        <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-3)', marginBottom: 20 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 14px', fontSize: 'var(--fs-sm)', fontWeight: 600,
              color: 'var(--ink-2)', background: 'var(--bg-raised)', borderRadius: 'var(--r-md)',
            }}
          >취소</button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 14px', fontSize: 'var(--fs-sm)', fontWeight: 700,
              color: 'white',
              background: danger ? 'var(--danger)' : 'var(--accent)',
              borderRadius: 'var(--r-md)',
            }}
          >확인</button>
        </div>
      </div>
    </div>
  );
};

// Mention textarea
const MentionTextarea = ({ value, onChange, characters = [], placeholder, style, ...rest }) => {
  const [showSuggest, setShowSuggest] = useState(false);
  const [query, setQuery] = useState('');
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [activeIdx, setActiveIdx] = useState(0);
  const ref = useRef(null);

  const filtered = characters.filter(c => c.name.includes(query)).slice(0, 5);

  const handleChange = (e) => {
    const v = e.target.value;
    onChange(v);
    const cursor = e.target.selectionStart;
    const before = v.slice(0, cursor);
    const m = before.match(/@([^\s@]*)$/);
    if (m) {
      setQuery(m[1]);
      setShowSuggest(true);
      setActiveIdx(0);
      // approximate position
      const rect = e.target.getBoundingClientRect();
      const parentRect = e.target.offsetParent?.getBoundingClientRect() || rect;
      setPos({ top: rect.top - parentRect.top + 24, left: rect.left - parentRect.left + 16 });
    } else {
      setShowSuggest(false);
    }
  };

  const insert = (char) => {
    const v = ref.current.value;
    const cursor = ref.current.selectionStart;
    const before = v.slice(0, cursor).replace(/@[^\s@]*$/, '');
    const after = v.slice(cursor);
    const next = `${before}@${char.name} ${after}`;
    onChange(next);
    setShowSuggest(false);
    setTimeout(() => {
      ref.current.focus();
      const newPos = before.length + char.name.length + 2;
      ref.current.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const onKeyDown = (e) => {
    if (!showSuggest || filtered.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => (i+1) % filtered.length); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => (i-1+filtered.length) % filtered.length); }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      insert(filtered[activeIdx]);
    }
    if (e.key === 'Escape') { setShowSuggest(false); }
  };

  return (
    <div style={{ position: 'relative' }}>
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="input"
        style={style}
        {...rest}
      />
      {showSuggest && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: pos.top, left: pos.left, zIndex: 100,
          background: 'var(--bg-surface)', border: '1px solid var(--border-2)',
          borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-lg)',
          padding: 4, minWidth: 180,
        }}>
          {filtered.map((c, i) => (
            <button
              key={c.id}
              onMouseDown={(e) => { e.preventDefault(); insert(c); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '6px 10px', borderRadius: 'var(--r-sm)',
                background: i === activeIdx ? 'var(--accent-soft)' : 'transparent',
                color: i === activeIdx ? 'var(--accent)' : 'var(--ink-1)',
                fontSize: 'var(--fs-sm)', fontWeight: 500, textAlign: 'left',
              }}
            >
              <Icon name="user" size={14} />
              {c.name}
            </button>
          ))}
          <div style={{ padding: '4px 10px', fontSize: 11, color: 'var(--ink-4)', borderTop: '1px solid var(--border-1)', marginTop: 4 }}>
            <kbd>↑</kbd> <kbd>↓</kbd> 이동 · <kbd>↵</kbd> 선택
          </div>
        </div>
      )}
    </div>
  );
};

// render text with @mentions highlighted
const renderWithMentions = (text, characters) => {
  if (!text) return null;
  const names = characters.map(c => c.name);
  const re = new RegExp(`@(${names.join('|')})`, 'g');
  const parts = [];
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(<span key={m.index} className="mention">@{m[1]}</span>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
};

Object.assign(window, { Icon, IconButton, Avatar, AvatarStack, LogChip, Confirm, MentionTextarea, renderWithMentions });
