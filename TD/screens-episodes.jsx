// screens-episodes.jsx — Episodes tab with sidebar, drag-reorder, scene cards
const { useState: useEs, useMemo: useEm, useRef: useEr, useEffect: useEe } = React;

function EpisodesTab({ novel, onSaveEpisode, onAddEpisode, onDeleteEpisode, onReorderEpisodes, onUploadEpisode, onAddScene, onSaveScene, onDeleteScene, sidebarSide = 'left' }) {
  const [selectedId, setSelectedId] = useEs(() => {
    const last = localStorage.getItem(`td:lastEpisode:${novel.id}`);
    return (last && novel.episodes.find(e => e.id === last)) ? last : novel.episodes[0]?.id;
  });
  const [q, setQ] = useEs('');
  const [editing, setEditing] = useEs(false);
  const [draft, setDraft] = useEs(null);
  const [confirmDel, setConfirmDel] = useEs(false);
  const [dragId, setDragId] = useEs(null);
  const [dropId, setDropId] = useEs(null);

  const ep = novel.episodes.find(e => e.id === selectedId);

  useEe(() => {
    if (selectedId) localStorage.setItem(`td:lastEpisode:${novel.id}`, selectedId);
  }, [selectedId, novel.id]);

  useEe(() => {
    if (ep) setDraft(ep);
  }, [selectedId]);

  const filteredEps = novel.episodes.filter(e => !q || e.title.includes(q) || e.body.includes(q));
  const stats = ep ? countWords(ep.body) : { chars: 0, charsNoSpace: 0, pages: 0 };
  const dirty = editing && draft && (draft.title !== ep.title || draft.body !== ep.body);

  const addNew = () => {
    const id = 'e' + Date.now();
    onAddEpisode({ id, title: `${novel.episodes.length + 1}화. 새 회차`, body: '', scenes: [] });
    setSelectedId(id);
    setEditing(true);
  };

  const save = () => { onSaveEpisode(draft); setEditing(false); };
  const cancel = () => { setDraft(ep); setEditing(false); };

  const onDragStart = (id) => setDragId(id);
  const onDragOver = (e, id) => { e.preventDefault(); setDropId(id); };
  const onDrop = (e, id) => {
    e.preventDefault();
    if (dragId && dragId !== id) onReorderEpisodes(dragId, id);
    setDragId(null); setDropId(null);
  };

  const Sidebar = (
    <aside style={{
      width: 260, flexShrink: 0,
      background: 'var(--bg-surface)',
      borderRight: sidebarSide === 'left' ? '1px solid var(--border-1)' : 'none',
      borderLeft: sidebarSide === 'right' ? '1px solid var(--border-1)' : 'none',
      display: 'flex', flexDirection: 'column',
      maxHeight: 'calc(100vh - 110px)',
      position: 'sticky', top: 110,
    }}>
      <div style={{ padding: 12, borderBottom: '1px solid var(--border-1)' }}>
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <Icon name="search" size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)' }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="회차 찾기" className="input" style={{ paddingLeft: 30, fontSize: 'var(--fs-sm)' }} />
        </div>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          <IconButton icon="upload" label="회차 .md 업로드" size="sm" onClick={onUploadEpisode} />
          <IconButton icon="plus" label="새 회차" shortcut="⌘N" variant="primary" size="sm" onClick={addNew} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
        {filteredEps.map((e, i) => {
          const wc = countWords(e.body);
          const active = e.id === selectedId;
          return (
            <div
              key={e.id}
              className={`draggable ${dragId === e.id ? 'dragging' : ''} ${dropId === e.id ? 'drop-target' : ''}`}
              draggable
              onDragStart={() => onDragStart(e.id)}
              onDragOver={(ev) => onDragOver(ev, e.id)}
              onDrop={(ev) => onDrop(ev, e.id)}
              onDragEnd={() => { setDragId(null); setDropId(null); }}
              onClick={() => setSelectedId(e.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 10px', borderRadius: 'var(--r-sm)',
                cursor: 'pointer',
                background: active ? 'var(--accent-soft)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--ink-2)',
                marginBottom: 2,
                position: 'relative',
              }}
              onMouseOver={(ev) => { if (!active) ev.currentTarget.style.background = 'var(--bg-raised)'; }}
              onMouseOut={(ev) => { if (!active) ev.currentTarget.style.background = 'transparent'; }}
            >
              <span className="drag-handle" title="드래그해서 순서 변경" data-tooltip="드래그해서 순서 변경" style={{ cursor: 'grab' }}>
                <Icon name="drag" size={12} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="serif" style={{ fontSize: 'var(--fs-sm)', fontWeight: active ? 700 : 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                  {wc.chars}자 · {e.scenes.length}씬
                </div>
              </div>
            </div>
          );
        })}
        {filteredEps.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', fontSize: 'var(--fs-xs)', color: 'var(--ink-4)' }}>
            {q ? '검색 결과 없음' : '회차를 추가해보세요'}
          </div>
        )}
      </div>
    </aside>
  );

  const Editor = ep ? (
    <div style={{ flex: 1, padding: '24px 32px', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        {editing ? (
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            className="serif"
            style={{
              fontSize: 'var(--fs-xl)', fontWeight: 800, padding: '6px 10px',
              background: 'var(--bg-surface)', border: '1px solid var(--accent)', borderRadius: 'var(--r-md)',
              flex: 1, outline: 'none',
            }}
          />
        ) : (
          <h2 className="serif" style={{ fontSize: 'var(--fs-xl)', fontWeight: 800, flex: 1 }}>{ep.title}</h2>
        )}

        <div style={{ display: 'flex', gap: 4 }}>
          {editing ? (
            <>
              <IconButton icon="trash" label="삭제" variant="danger" onClick={() => setConfirmDel(true)} />
              <IconButton icon="cancel" label="취소" onClick={cancel} disabled={!dirty} />
              <IconButton icon="save" label="저장" shortcut="⌘S" variant="primary" onClick={save} disabled={!dirty} />
            </>
          ) : (
            <IconButton icon="edit" label="수정" onClick={() => setEditing(true)} />
          )}
        </div>
      </div>

      <MentionTextarea
        value={editing ? draft.body : ep.body}
        onChange={(v) => editing && setDraft({ ...draft, body: v })}
        characters={novel.characters}
        placeholder="회차 본문을 적어주세요. @를 입력하면 캐릭터 자동완성이 떠요."
        readOnly={!editing}
        style={{
          minHeight: 360,
          background: 'var(--bg-surface)',
          border: editing ? '1px solid var(--accent-border)' : '1px solid var(--border-1)',
          boxShadow: editing ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
          borderRadius: 'var(--r-lg)',
          padding: 24,
          fontFamily: 'var(--font-serif)',
          fontSize: 'var(--fs-md)',
          lineHeight: 1.9,
          color: editing ? 'var(--ink-1)' : 'var(--ink-2)',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, fontSize: 'var(--fs-xs)', color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>
        <span>{stats.chars}자</span>
        <span>{stats.charsNoSpace}자 (공백제외)</span>
        <span>원고지 {stats.pages}장</span>
        <span>예상 {Math.ceil(stats.chars / 3000)}분 분량</span>
        {dirty && <span style={{ color: 'var(--warn)', marginLeft: 'auto' }}>● 저장하지 않은 변경</span>}
      </div>

      {/* SCENE CARDS */}
      <SceneList
        scenes={ep.scenes}
        characters={novel.characters}
        onAdd={(s) => onAddScene(ep.id, s)}
        onSave={(s) => onSaveScene(ep.id, s)}
        onDelete={(id) => onDeleteScene(ep.id, id)}
      />

      <Confirm
        open={confirmDel}
        title="회차를 삭제할까요?"
        message={`"${ep.title}"이 삭제됩니다. 로그에 남아 롤백 가능해요.`}
        danger
        onConfirm={() => { onDeleteEpisode(ep.id); setConfirmDel(false); setEditing(false); setSelectedId(novel.episodes.find(e => e.id !== ep.id)?.id); }}
        onCancel={() => setConfirmDel(false)}
      />
    </div>
  ) : (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)' }}>
      <div style={{ textAlign: 'center' }}>
        <Icon name="book" size={32} style={{ color: 'var(--ink-4)', marginBottom: 8 }} />
        <p style={{ fontSize: 'var(--fs-sm)' }}>회차를 선택하거나 추가해보세요</p>
      </div>
    </div>
  );

  return (
    <div className="page-in" style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: sidebarSide === 'right' ? 'row-reverse' : 'row', minHeight: 'calc(100vh - 110px)' }}>
      {Sidebar}
      {Editor}
    </div>
  );
}

// Scene list — collapsible
function SceneList({ scenes, characters, onAdd, onSave, onDelete }) {
  const [expanded, setExpanded] = useEs(true);
  const [adding, setAdding] = useEs(false);

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setExpanded(!expanded)}
          title={expanded ? '접기' : '펼치기'}
          data-tooltip={expanded ? '접기' : '펼치기'}
          aria-label={expanded ? '접기' : '펼치기'}
          className="icon-btn sm"
        >
          <Icon name={expanded ? 'chevronDown' : 'chevronRight'} size={14} />
        </button>
        <h3 style={{ fontSize: 'var(--fs-md)', fontWeight: 700, flex: 1 }}>씬 카드</h3>
        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-4)' }}>{scenes.length}개</span>
        <IconButton icon="plus" label="씬 추가" size="sm" variant="primary" onClick={() => setAdding(true)} disabled={adding} />
      </div>

      {expanded && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {adding && (
            <SceneCard
              scene={{ id: 'new', situation: '', characters: [], setting: '' }}
              characters={characters}
              autoEdit
              onSave={(s) => { onAdd({ ...s, id: 's' + Date.now() }); setAdding(false); }}
              onCancel={() => setAdding(false)}
            />
          )}
          {scenes.map((s, i) => (
            <SceneCard
              key={s.id}
              scene={s}
              index={i + 1}
              characters={characters}
              onSave={onSave}
              onDelete={onDelete}
            />
          ))}
          {scenes.length === 0 && !adding && (
            <div style={{ gridColumn: '1 / -1', padding: 24, textAlign: 'center', fontSize: 'var(--fs-sm)', color: 'var(--ink-4)', border: '1px dashed var(--border-2)', borderRadius: 'var(--r-lg)' }}>
              씬을 추가해서 회차를 구조화해보세요
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SceneCard({ scene, index, characters, autoEdit, onSave, onDelete, onCancel }) {
  const [editing, setEditing] = useEs(autoEdit || false);
  const [draft, setDraft] = useEs(scene);
  const [confirmDel, setConfirmDel] = useEs(false);
  const [charPickerOpen, setCharPickerOpen] = useEs(false);

  const linkedChars = (draft.characters || []).map(id => characters.find(c => c.id === id)).filter(Boolean);

  const toggleChar = (id) => {
    const cur = draft.characters || [];
    setDraft({ ...draft, characters: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] });
  };

  return (
    <div className={`card ${editing ? 'editing' : 'hover'}`} style={{ padding: 14, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        {index && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>SCENE {String(index).padStart(2, '0')}</span>}
      </div>

      {editing ? (
        <>
          <textarea
            value={draft.situation}
            onChange={(e) => setDraft({ ...draft, situation: e.target.value })}
            placeholder="상황 — 이 씬에서 무엇이 벌어지나요?"
            className="input serif"
            style={{ minHeight: 64, marginBottom: 8, lineHeight: 1.6 }}
            autoFocus
          />

          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4, letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase' }}>등장 캐릭터</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8, position: 'relative' }}>
            {linkedChars.map(c => (
              <span key={c.id} className="mention" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                @{c.name}
                <button onClick={() => toggleChar(c.id)} title="제거" data-tooltip="제거" aria-label="제거" style={{ display: 'inline-flex' }}>
                  <Icon name="close" size={10} />
                </button>
              </span>
            ))}
            <button
              onClick={() => setCharPickerOpen(o => !o)}
              title="캐릭터 추가" data-tooltip="캐릭터 추가" aria-label="캐릭터 추가"
              className="icon-btn sm"
              style={{ width: 22, height: 22, borderRadius: 'var(--r-sm)', background: 'var(--bg-raised)' }}
            >
              <Icon name={charPickerOpen ? 'close' : 'at'} size={11} />
            </button>
            {charPickerOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 50, background: 'var(--bg-surface)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-md)', padding: 4, minWidth: 160 }}>
                {characters.length === 0 && <div style={{ padding: 8, fontSize: 11, color: 'var(--ink-4)' }}>등록된 캐릭터 없음</div>}
                {characters.map(c => {
                  const sel = (draft.characters || []).includes(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleChar(c.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '4px 8px', fontSize: 'var(--fs-sm)', borderRadius: 'var(--r-sm)', textAlign: 'left', background: sel ? 'var(--accent-soft)' : 'transparent', color: sel ? 'var(--accent)' : 'var(--ink-1)' }}
                    >
                      {sel && <Icon name="check" size={11} />}
                      <span style={{ marginLeft: sel ? 0 : 17 }}>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4, letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase' }}>배경</label>
          <input
            value={draft.setting}
            onChange={(e) => setDraft({ ...draft, setting: e.target.value })}
            placeholder="장소 / 시간 / 분위기"
            className="input"
            style={{ marginBottom: 8 }}
          />

          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--border-1)' }}>
            {!autoEdit && <IconButton icon="trash" label="삭제" variant="danger" size="sm" onClick={() => setConfirmDel(true)} />}
            <div style={{ flex: 1 }} />
            <IconButton icon="cancel" label="취소" size="sm" onClick={() => { if (autoEdit) onCancel?.(); else { setDraft(scene); setEditing(false); } }} />
            <IconButton icon="save" label="저장" variant="primary" size="sm" onClick={() => { onSave(draft); setEditing(false); }} />
          </div>
        </>
      ) : (
        <>
          <p className="serif" style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-1)', lineHeight: 1.6, marginBottom: 8 }}>
            {scene.situation || <span style={{ color: 'var(--ink-4)' }}>상황 미입력</span>}
          </p>
          {linkedChars.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
              {linkedChars.map(c => <span key={c.id} className="mention">@{c.name}</span>)}
            </div>
          )}
          {scene.setting && (
            <div style={{ fontSize: 11, color: 'var(--ink-3)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Icon name="map" size={11} /> {scene.setting}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <IconButton icon="edit" label="수정" size="sm" onClick={() => setEditing(true)} />
          </div>
        </>
      )}

      <Confirm
        open={confirmDel}
        title="씬을 삭제할까요?"
        message="로그에 남아 롤백 가능해요."
        danger
        onConfirm={() => { onDelete(scene.id); setConfirmDel(false); }}
        onCancel={() => setConfirmDel(false)}
      />
    </div>
  );
}

window.EpisodesTab = EpisodesTab;
