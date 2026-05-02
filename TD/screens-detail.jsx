// screens-detail.jsx — Novel detail screens (Plot, Characters, Settings, Episodes, Log)
const { useState: useS, useMemo: useM, useRef: useR, useEffect: useE } = React;

// ─── Header used by all detail tabs ───
function DetailHeader({ novel, onBack, onTitleChange, onLogout, presence, onExport, density, onDensityChange, theme, onThemeChange, onOpenTweaks }) {
  const [editing, setEditing] = useS(false);
  const [val, setVal] = useS(novel.title);

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-1)',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '12px 24px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <IconButton icon="chevronLeft" label="목록으로" onClick={onBack} />

        <div style={{ width: 24, height: 30, borderRadius: 3, background: coverGradient(novel.cover), flexShrink: 0 }} />

        {editing ? (
          <input
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={() => { onTitleChange(val.trim() || novel.title); setEditing(false); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { onTitleChange(val.trim() || novel.title); setEditing(false); }
              if (e.key === 'Escape') { setVal(novel.title); setEditing(false); }
            }}
            className="serif"
            style={{
              fontSize: 'var(--fs-lg)', fontWeight: 800, padding: '4px 8px',
              background: 'var(--bg-surface)', border: '1px solid var(--accent)',
              borderRadius: 'var(--r-sm)', flex: 1, maxWidth: 360,
            }}
          />
        ) : (
          <h1
            className="serif"
            style={{ fontSize: 'var(--fs-lg)', fontWeight: 800, flex: 1, cursor: 'text', padding: '4px 8px', borderRadius: 'var(--r-sm)' }}
            onClick={() => setEditing(true)}
            title="제목 수정"
            data-tooltip="클릭해서 수정"
          >{novel.title}</h1>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <AvatarStack users={presence} />
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--border-1)', margin: '0 4px' }} />

        <IconButton icon="download" label="전체 .md ZIP 다운로드" onClick={onExport} />
        <IconButton icon={theme === 'dark' ? 'sun' : 'moon'} label={theme === 'dark' ? '라이트 모드' : '다크 모드'} onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')} />
        <IconButton icon="settings" label="설정" onClick={onOpenTweaks} />
        <IconButton icon="logout" label="로그아웃" onClick={onLogout} />
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <DetailTabs novel={novel} />
      </div>
    </header>
  );
}

function DetailTabs({ novel }) {
  const tab = window.__appCtx?.tab || 'plot';
  const setTab = window.__appCtx?.setTab || (() => {});
  const tabs = [
    { id: 'plot', label: '줄거리', icon: 'fileText' },
    { id: 'characters', label: '캐릭터', icon: 'users', count: novel.characters.length },
    { id: 'settings', label: '배경', icon: 'map' },
    { id: 'episodes', label: '회차', icon: 'book', count: novel.episodes.length },
    { id: 'log', label: '로그', icon: 'history', count: novel.logs.length },
  ];
  return (
    <div className="tab-bar" style={{ borderBottom: 'none' }}>
      {tabs.map(t => (
        <button
          key={t.id}
          className={`tab ${tab === t.id ? 'active' : ''}`}
          onClick={() => setTab(t.id)}
          title={t.label}
          data-tooltip={t.label}
        >
          <Icon name={t.icon} size={14} />
          {t.label}
          {t.count != null && <span style={{ fontSize: 11, color: 'var(--ink-4)', fontWeight: 500, marginLeft: 2 }}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

// ─── Plot tab ───
function PlotTab({ novel, onSave }) {
  const [val, setVal] = useS(novel.storytelling);
  const [dirty, setDirty] = useS(false);
  const stats = countWords(val);

  useE(() => { setVal(novel.storytelling); setDirty(false); }, [novel.id]);

  const change = (v) => { setVal(v); setDirty(v !== novel.storytelling); };
  const save = () => { onSave(val); setDirty(false); };
  const cancel = () => { setVal(novel.storytelling); setDirty(false); };

  return (
    <div className="page-in" style={{ maxWidth: 880, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 className="serif" style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800 }}>줄거리 · 톤앤매너</h2>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-4)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>storytelling_style.md</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {dirty && (
            <>
              <IconButton icon="cancel" label="취소" onClick={cancel} />
              <IconButton icon="save" label="저장" shortcut="⌘S" variant="primary" onClick={save} />
            </>
          )}
        </div>
      </div>

      <textarea
        value={val}
        onChange={(e) => change(e.target.value)}
        placeholder="이 소설의 톤앤매너, 핵심 갈등, 결말 방향을 자유롭게 적어주세요…"
        className="serif"
        style={{
          width: '100%', minHeight: 480,
          background: 'var(--bg-surface)',
          border: dirty ? '1px solid var(--accent-border)' : '1px solid var(--border-1)',
          boxShadow: dirty ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
          borderRadius: 'var(--r-lg)',
          padding: 24,
          fontSize: 'var(--fs-md)',
          lineHeight: 1.85,
          color: 'var(--ink-1)',
          outline: 'none',
          transition: 'all var(--dur) var(--ease-out)',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, fontSize: 'var(--fs-xs)', color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>
        <span>{stats.chars}자</span>
        <span>{stats.charsNoSpace}자 (공백제외)</span>
        <span>{stats.words}단어</span>
        <span>{stats.pages}장</span>
        {dirty && <span style={{ color: 'var(--warn)', marginLeft: 'auto' }}>● 저장하지 않은 변경</span>}
      </div>
    </div>
  );
}

// ─── Reusable Card with edit/view toggle ───
function EditableCard({ item, fields, onSave, onDelete, autoEdit, onCancelNew }) {
  const [editing, setEditing] = useS(autoEdit || false);
  const [draft, setDraft] = useS(item);
  const [confirmDel, setConfirmDel] = useS(false);

  useE(() => { setDraft(item); }, [item.id]);

  const save = () => { onSave(draft); setEditing(false); };
  const cancel = () => {
    if (autoEdit) { onCancelNew?.(); }
    else { setDraft(item); setEditing(false); }
  };

  return (
    <div className={`card ${editing ? 'editing' : 'hover'}`} style={{ padding: 16 }}>
      {editing ? (
        <>
          {fields.map(f => (
            f.type === 'textarea' ? (
              <textarea
                key={f.key}
                value={draft[f.key] || ''}
                onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className="input"
                style={{ marginBottom: 8, minHeight: f.minHeight || 80, fontFamily: f.serif ? 'var(--font-serif)' : 'inherit', lineHeight: 1.7 }}
              />
            ) : (
              <input
                key={f.key}
                value={draft[f.key] || ''}
                onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className="input"
                style={{ marginBottom: 8, fontWeight: f.bold ? 700 : 400, fontSize: f.large ? 'var(--fs-md)' : 'var(--fs-base)' }}
                autoFocus={f.autoFocus}
              />
            )
          ))}
          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-1)' }}>
            {!autoEdit && (
              <IconButton icon="trash" label="삭제" variant="danger" size="sm" onClick={() => setConfirmDel(true)} />
            )}
            <div style={{ flex: 1 }} />
            <IconButton icon="cancel" label="취소" size="sm" onClick={cancel} />
            <IconButton icon="save" label="저장" shortcut="⌘S" variant="primary" size="sm" onClick={save} />
          </div>
        </>
      ) : (
        <>
          {fields.map(f => (
            f.type === 'textarea' ? (
              <p
                key={f.key}
                className={f.serif ? 'serif' : ''}
                style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}
              >{item[f.key] || <span style={{ color: 'var(--ink-4)' }}>{f.placeholder}</span>}</p>
            ) : (
              <h3 key={f.key} className="serif" style={{ fontSize: 'var(--fs-md)', fontWeight: 700, marginBottom: 6 }}>{item[f.key] || '제목 없음'}</h3>
            )
          ))}
          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 12 }}>
            <IconButton icon="edit" label="수정" size="sm" onClick={() => setEditing(true)} />
          </div>
        </>
      )}
      <Confirm
        open={confirmDel}
        title="삭제할까요?"
        message="로그에 남아 롤백 가능해요."
        danger
        onConfirm={() => { onDelete(item.id); setConfirmDel(false); }}
        onCancel={() => setConfirmDel(false)}
      />
    </div>
  );
}

// ─── Characters tab ───
function CharactersTab({ novel, onSave, onDelete }) {
  const [q, setQ] = useS('');
  const [adding, setAdding] = useS(false);

  const filtered = novel.characters.filter(c => !q || c.name.includes(q) || c.desc.includes(q));

  return (
    <div className="page-in" style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 className="serif" style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800 }}>캐릭터</h2>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-3)', marginTop: 4 }}>{novel.characters.length}명의 인물</p>
        </div>
        <div style={{ display: 'flex', gap: 6, flex: 1, maxWidth: 480, marginLeft: 'auto' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Icon name="search" size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)' }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름, 설명으로 찾기" className="input" style={{ paddingLeft: 32 }} />
          </div>
          <IconButton icon="plus" label="캐릭터 추가" shortcut="⌘⇧A" variant="primary" onClick={() => setAdding(true)} disabled={adding} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {adding && (
          <EditableCard
            item={{ id: 'new', name: '', desc: '' }}
            autoEdit
            fields={[
              { key: 'name', placeholder: '이름', autoFocus: true, bold: true, large: true },
              { key: 'desc', type: 'textarea', placeholder: '나이, 외모, 성격, 배경… 자유롭게 적어주세요', minHeight: 100 },
            ]}
            onSave={(d) => { onSave({ ...d, id: 'c' + Date.now() }); setAdding(false); }}
            onCancelNew={() => setAdding(false)}
          />
        )}
        {filtered.map(c => (
          <EditableCard
            key={c.id}
            item={c}
            fields={[
              { key: 'name', placeholder: '이름', bold: true, large: true },
              { key: 'desc', type: 'textarea', placeholder: '나이, 외모, 성격, 배경…' },
            ]}
            onSave={onSave}
            onDelete={onDelete}
          />
        ))}
        {filtered.length === 0 && !adding && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 64, color: 'var(--ink-3)' }}>
            <Icon name="users" size={28} style={{ color: 'var(--ink-4)', marginBottom: 8 }} />
            <p style={{ fontSize: 'var(--fs-sm)' }}>{q ? '검색 결과가 없어요' : '첫 캐릭터를 추가해보세요'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Settings (배경) tab ───
function SettingsTab({ novel, onSave }) {
  const [val, setVal] = useS(novel.settings || '## 날씨\n\n## 건축물\n\n## 시대 배경\n\n## 기타\n');
  const [dirty, setDirty] = useS(false);

  useE(() => {
    setVal(novel.settings || '## 날씨\n\n## 건축물\n\n## 시대 배경\n\n## 기타\n');
    setDirty(false);
  }, [novel.id]);

  const change = (v) => { setVal(v); setDirty(v !== novel.settings); };
  const save = () => { onSave(val); setDirty(false); };
  const cancel = () => { setVal(novel.settings); setDirty(false); };

  // split sections for outline
  const sections = useM(() => {
    const lines = val.split('\n');
    const out = [];
    lines.forEach((l, i) => {
      const m = l.match(/^##\s+(.+)$/);
      if (m) out.push({ name: m[1], line: i });
    });
    return out;
  }, [val]);

  return (
    <div className="page-in" style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '180px 1fr', gap: 24 }}>
      <aside style={{ position: 'sticky', top: 120, alignSelf: 'start' }}>
        <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--ink-3)', marginBottom: 8, letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase' }}>섹션</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {sections.map(s => (
            <a key={s.line} href="#" style={{
              padding: '6px 10px', fontSize: 'var(--fs-sm)', color: 'var(--ink-2)',
              borderRadius: 'var(--r-sm)', textDecoration: 'none',
              borderLeft: '2px solid var(--border-2)',
            }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-raised)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >{s.name}</a>
          ))}
        </div>
      </aside>

      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 className="serif" style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800 }}>배경 · 세계관</h2>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-4)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>settings.md</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {dirty && (
              <>
                <IconButton icon="cancel" label="취소" onClick={cancel} />
                <IconButton icon="save" label="저장" shortcut="⌘S" variant="primary" onClick={save} />
              </>
            )}
          </div>
        </div>

        <textarea
          value={val}
          onChange={(e) => change(e.target.value)}
          className="serif"
          style={{
            width: '100%', minHeight: 520,
            background: 'var(--bg-surface)',
            border: dirty ? '1px solid var(--accent-border)' : '1px solid var(--border-1)',
            boxShadow: dirty ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
            borderRadius: 'var(--r-lg)',
            padding: 24,
            fontSize: 'var(--fs-md)',
            lineHeight: 1.85,
            color: 'var(--ink-1)',
            outline: 'none',
          }}
        />
      </div>
    </div>
  );
}

window.DetailHeader = DetailHeader;
window.PlotTab = PlotTab;
window.CharactersTab = CharactersTab;
window.SettingsTab = SettingsTab;
