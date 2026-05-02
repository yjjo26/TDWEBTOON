// screens-auth.jsx — Login + Novel List
const { useState: useStateAuth } = React;

function LoginScreen({ onLogin }) {
  const [pw, setPw] = useStateAuth('');
  const [show, setShow] = useStateAuth(false);
  const [err, setErr] = useStateAuth('');

  const submit = (e) => {
    e?.preventDefault();
    if (!pw) { setErr('비밀번호를 입력해주세요'); return; }
    onLogin();
  };

  return (
    <div className="login-bg page-in" style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} data-screen-label="01 로그인">
      <div style={{
        width: 380, maxWidth: '100%',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-1)',
        borderRadius: 'var(--r-2xl)',
        boxShadow: 'var(--shadow-lg)',
        padding: 36,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 'var(--r-xl)',
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', marginBottom: 16, boxShadow: 'var(--shadow-glow)',
          }}>
            <Icon name="feather" size={26} stroke={2} />
          </div>
          <h1 className="serif" style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>소설 작업실</h1>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-3)', marginTop: 6, whiteSpace: 'nowrap' }}>이야기를 함께 쌓는 공간</p>
        </div>

        <form onSubmit={submit}>
          <label style={{ display: 'block', fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--ink-2)', marginBottom: 8 }}>
            비밀번호
          </label>
          <div style={{ position: 'relative' }}>
            <Icon name="lock" size={16} style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--ink-4)', pointerEvents: 'none',
            }} />
            <input
              type={show ? 'text' : 'password'}
              value={pw}
              onChange={(e) => { setPw(e.target.value); setErr(''); }}
              className="input"
              placeholder="••••••••"
              style={{ paddingLeft: 38, paddingRight: 44, height: 44 }}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShow(s => !s)}
              title={show ? '숨기기' : '보이기'}
              data-tooltip={show ? '숨기기' : '보이기'}
              aria-label={show ? '숨기기' : '보이기'}
              className="icon-btn sm"
              style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)' }}
            >
              <Icon name={show ? 'eyeOff' : 'eye'} size={14} />
            </button>
          </div>
          {err && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)', marginTop: 6 }}>{err}</div>}

          <button
            type="submit"
            style={{
              width: '100%', marginTop: 20, padding: '12px 16px',
              background: 'var(--accent)', color: 'white',
              fontSize: 'var(--fs-base)', fontWeight: 700,
              borderRadius: 'var(--r-md)',
              boxShadow: 'var(--shadow-glow)',
              transition: 'all var(--dur-fast) var(--ease-out)',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--accent-hover)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'var(--accent)'}
          >
            들어가기
          </button>
        </form>

        <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-4)', textAlign: 'center', marginTop: 20 }}>
          공동 작업자는 공유받은 링크로 입장하세요
        </p>
      </div>
    </div>
  );
}

function NovelListScreen({ novels, onOpen, onCreate, onDelete, onLogout, presence }) {
  const [q, setQ] = useStateAuth('');
  const [view, setView] = useStateAuth('grid'); // grid | list
  const [sortBy, setSortBy] = useStateAuth('updated'); // updated | title
  const [newTitle, setNewTitle] = useStateAuth('');
  const [confirm, setConfirm] = useStateAuth(null);

  const filtered = novels
    .filter(n => !q || n.title.includes(q) || n.summary.includes(q))
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

  const create = () => {
    if (!newTitle.trim()) return;
    onCreate(newTitle.trim());
    setNewTitle('');
  };

  return (
    <div className="page-in" style={{ minHeight: '100vh', background: 'var(--bg-base)' }} data-screen-label="02 소설 목록">
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-1)',
      }}>
        <div style={{
          maxWidth: 1120, margin: '0 auto', padding: '14px 24px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 'var(--r-md)',
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
          }}>
            <Icon name="feather" size={16} stroke={2} />
          </div>
          <h1 className="serif" style={{ fontSize: 'var(--fs-lg)', fontWeight: 800, flex: 1 }}>소설 작업실</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <AvatarStack users={presence} />
          </div>

          <div className="divider" style={{ width: 1, height: 20, background: 'var(--border-1)' }} />

          <IconButton icon="logout" label="로그아웃" onClick={onLogout} />
        </div>
      </header>

      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 24px' }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 className="serif" style={{ fontSize: 'var(--fs-3xl)', fontWeight: 800, letterSpacing: '-0.02em' }}>내 소설</h2>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-3)', marginTop: 4 }}>{novels.length}편의 작품을 쓰고 있어요</p>
          </div>
        </div>

        {/* Search + new + view toggles */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
            <Icon name="search" size={16} style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--ink-4)', pointerEvents: 'none',
            }} />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="소설 제목, 줄거리로 찾기"
              className="input"
              style={{ paddingLeft: 36 }}
            />
            {q && (
              <button
                onClick={() => setQ('')}
                title="검색어 지우기" data-tooltip="검색어 지우기" aria-label="검색어 지우기"
                className="icon-btn sm"
                style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)' }}
              >
                <Icon name="close" size={12} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: 4, background: 'var(--bg-surface)', border: '1px solid var(--border-1)', borderRadius: 'var(--r-md)' }}>
            <button
              onClick={() => setSortBy('updated')}
              title="최근 편집순" data-tooltip="최근 편집순" aria-label="최근 편집순"
              className="icon-btn sm"
              style={{ background: sortBy === 'updated' ? 'var(--accent-soft)' : 'transparent', color: sortBy === 'updated' ? 'var(--accent)' : undefined }}
            >
              <Icon name="clock" size={14} />
            </button>
            <button
              onClick={() => setSortBy('title')}
              title="제목순" data-tooltip="제목순" aria-label="제목순"
              className="icon-btn sm"
              style={{ background: sortBy === 'title' ? 'var(--accent-soft)' : 'transparent', color: sortBy === 'title' ? 'var(--accent)' : undefined }}
            >
              <Icon name="sort" size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: 4, background: 'var(--bg-surface)', border: '1px solid var(--border-1)', borderRadius: 'var(--r-md)' }}>
            <button
              onClick={() => setView('grid')}
              title="카드 보기" data-tooltip="카드 보기" aria-label="카드 보기"
              className="icon-btn sm"
              style={{ background: view === 'grid' ? 'var(--accent-soft)' : 'transparent', color: view === 'grid' ? 'var(--accent)' : undefined }}
            >
              <Icon name="grid" size={14} />
            </button>
            <button
              onClick={() => setView('list')}
              title="목록 보기" data-tooltip="목록 보기" aria-label="목록 보기"
              className="icon-btn sm"
              style={{ background: view === 'list' ? 'var(--accent-soft)' : 'transparent', color: view === 'list' ? 'var(--accent)' : undefined }}
            >
              <Icon name="list" size={14} />
            </button>
          </div>
        </div>

        {/* New novel input */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, padding: 12, background: 'var(--bg-surface)', border: '1px dashed var(--border-2)', borderRadius: 'var(--r-lg)' }}>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
            placeholder="새 소설 제목을 입력하고 Enter"
            className="input"
            style={{ border: 'none', background: 'transparent', padding: '4px 8px' }}
          />
          <IconButton icon="plus" label="새 소설 만들기" shortcut="⌘N" variant="primary" onClick={create} disabled={!newTitle.trim()} />
        </div>

        {/* Cards */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--ink-3)' }}>
            <Icon name="book" size={32} style={{ color: 'var(--ink-4)', marginBottom: 12 }} />
            <p>{q ? '검색 결과가 없어요' : '첫 소설을 시작해보세요'}</p>
          </div>
        ) : view === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {filtered.map(n => (
              <article
                key={n.id}
                className="card hover"
                style={{ cursor: 'pointer', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                onClick={() => onOpen(n.id)}
              >
                <div style={{
                  height: 100, background: coverGradient(n.cover),
                  position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 12,
                }}>
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    display: 'flex', gap: 4,
                  }} onClick={(e) => e.stopPropagation()}>
                    <button
                      title="삭제" data-tooltip="삭제" aria-label="삭제"
                      className="icon-btn sm"
                      style={{ background: 'rgba(255,255,255,0.85)', color: 'var(--danger)' }}
                      onClick={() => setConfirm(n)}
                    >
                      <Icon name="trash" size={12} />
                    </button>
                  </div>
                  <Icon name="feather" size={28} style={{ color: 'rgba(255,255,255,0.85)' }} />
                </div>
                <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 className="serif" style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, marginBottom: 6 }}>{n.title}</h3>
                  <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-3)', lineHeight: 1.5, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {n.summary || '아직 줄거리가 없어요'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, fontSize: 'var(--fs-xs)', color: 'var(--ink-4)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="fileText" size={12} /> {n.episodes.length}화
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="users" size={12} /> {n.characters.length}
                    </span>
                    <span style={{ marginLeft: 'auto' }}>{fmtTime(n.updatedAt)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            {filtered.map((n, i) => (
              <div
                key={n.id}
                onClick={() => onOpen(n.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderTop: i === 0 ? 'none' : '1px solid var(--border-1)',
                  cursor: 'pointer', transition: 'background var(--dur-fast)',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-raised)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 32, height: 40, borderRadius: 4, background: coverGradient(n.cover), flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="serif" style={{ fontSize: 'var(--fs-md)', fontWeight: 700 }}>{n.title}</div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.summary}</div>
                </div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-4)' }}>{n.episodes.length}화</div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-4)', width: 70, textAlign: 'right' }}>{fmtTime(n.updatedAt)}</div>
                <div onClick={(e) => e.stopPropagation()}>
                  <IconButton icon="trash" label="삭제" variant="danger" size="sm" onClick={() => setConfirm(n)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Confirm
        open={!!confirm}
        title="소설을 삭제할까요?"
        message={confirm ? `"${confirm.title}"의 모든 내용이 삭제됩니다. 로그에는 남아 롤백 가능해요.` : ''}
        danger
        onConfirm={() => { onDelete(confirm.id); setConfirm(null); }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

window.LoginScreen = LoginScreen;
window.NovelListScreen = NovelListScreen;
