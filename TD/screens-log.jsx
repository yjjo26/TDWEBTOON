// screens-log.jsx — Log tab (table with sort/filter)
const { useState: useLs, useMemo: useLm } = React;

function LogTab({ novel, onRollback }) {
  const [filter, setFilter] = useLs('all');
  const [targetFilter, setTargetFilter] = useLs('all');
  const [q, setQ] = useLs('');
  const [sortBy, setSortBy] = useLs('time');
  const [sortDir, setSortDir] = useLs('desc');
  const [expanded, setExpanded] = useLs(null);
  const [confirmRb, setConfirmRb] = useLs(null);

  const filtered = useLm(() => {
    let arr = novel.logs.slice();
    if (filter !== 'all') arr = arr.filter(l => l.kind === filter);
    if (targetFilter !== 'all') arr = arr.filter(l => l.target === targetFilter);
    if (q) arr = arr.filter(l => l.label.includes(q) || (l.before||'').includes(q) || (l.after||'').includes(q));
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'time') cmp = new Date(a.time) - new Date(b.time);
      else if (sortBy === 'kind') cmp = a.kind.localeCompare(b.kind);
      else if (sortBy === 'target') cmp = a.target.localeCompare(b.target);
      else if (sortBy === 'label') cmp = a.label.localeCompare(b.label);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [novel.logs, filter, targetFilter, q, sortBy, sortDir]);

  const counts = useLm(() => ({
    all: novel.logs.length,
    add: novel.logs.filter(l => l.kind === 'add').length,
    edit: novel.logs.filter(l => l.kind === 'edit').length,
    delete: novel.logs.filter(l => l.kind === 'delete').length,
    rollback: novel.logs.filter(l => l.kind === 'rollback').length,
  }), [novel.logs]);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const sortIcon = (col) => sortBy !== col ? null : <Icon name={sortDir === 'asc' ? 'chevronUp' : 'chevronDown'} size={11} style={{ marginLeft: 2 }} />;

  const targets = ['all', '소설', '줄거리', '캐릭터', '배경', '회차'];

  return (
    <div className="page-in" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="serif" style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800 }}>변경 이력</h2>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-3)', marginTop: 4 }}>{novel.logs.length}개의 기록 · 모든 변경은 롤백 가능</p>
        </div>
        <div style={{ position: 'relative', minWidth: 200 }}>
          <Icon name="search" size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)' }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="로그 내용 검색" className="input" style={{ paddingLeft: 30 }} />
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: '전체', count: counts.all },
          { id: 'add', label: '추가', count: counts.add },
          { id: 'edit', label: '수정', count: counts.edit },
          { id: 'delete', label: '삭제', count: counts.delete },
          { id: 'rollback', label: '롤백', count: counts.rollback },
        ].map(f => {
          const on = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              title={f.label} data-tooltip={f.label}
              style={{
                padding: '6px 12px', fontSize: 'var(--fs-xs)', fontWeight: 600,
                borderRadius: 'var(--r-pill)',
                background: on ? 'var(--accent)' : 'var(--bg-surface)',
                color: on ? 'white' : 'var(--ink-2)',
                border: on ? 'none' : '1px solid var(--border-1)',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                transition: 'all var(--dur-fast)',
              }}
            >
              {f.label}
              <span style={{ fontSize: 11, opacity: 0.7, fontFamily: 'var(--font-mono)' }}>{f.count}</span>
            </button>
          );
        })}
        <div style={{ width: 1, background: 'var(--border-1)', margin: '0 4px' }} />
        {targets.map(t => {
          const on = targetFilter === t;
          return (
            <button
              key={t}
              onClick={() => setTargetFilter(t)}
              title={t === 'all' ? '모든 영역' : t}
              data-tooltip={t === 'all' ? '모든 영역' : t}
              style={{
                padding: '6px 12px', fontSize: 'var(--fs-xs)', fontWeight: 600,
                borderRadius: 'var(--r-pill)',
                background: on ? 'var(--ink-1)' : 'var(--bg-surface)',
                color: on ? 'white' : 'var(--ink-3)',
                border: on ? 'none' : '1px solid var(--border-1)',
              }}
            >{t === 'all' ? '모든 영역' : t}</button>
          );
        })}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ maxHeight: 'calc(100vh - 320px)', overflowY: 'auto', overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                <th style={{ width: 80 }} className="sortable" onClick={() => toggleSort('kind')}>
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>유형{sortIcon('kind')}</span>
                </th>
                <th style={{ width: 80 }} className="sortable" onClick={() => toggleSort('target')}>
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>영역{sortIcon('target')}</span>
                </th>
                <th className="sortable" onClick={() => toggleSort('label')}>
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>대상{sortIcon('label')}</span>
                </th>
                <th style={{ width: 100 }}>작업자</th>
                <th style={{ width: 130 }} className="sortable" onClick={() => toggleSort('time')}>
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>시각{sortIcon('time')}</span>
                </th>
                <th style={{ width: 80, textAlign: 'right' }}>액션</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => {
                const isExp = expanded === l.id;
                const user = collaborators.find(c => c.id === l.user) || collaborators[0];
                return (
                  <React.Fragment key={l.id}>
                    <tr className={isExp ? 'expanded' : ''} onClick={() => setExpanded(isExp ? null : l.id)} style={{ cursor: 'pointer' }}>
                      <td>
                        <Icon name={isExp ? 'chevronDown' : 'chevronRight'} size={12} style={{ color: 'var(--ink-4)' }} />
                      </td>
                      <td><LogChip kind={l.kind} /></td>
                      <td><span style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-3)' }}>{l.target}</span></td>
                      <td><span className="serif" style={{ fontWeight: 600, color: 'var(--ink-1)' }}>{l.label}</span></td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <Avatar user={user} size={20} />
                          <span style={{ fontSize: 'var(--fs-xs)' }}>{user.name}</span>
                        </span>
                      </td>
                      <td>
                        <span title={fmtFullTime(l.time)} style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                          {fmtTime(l.time)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        {l.kind === 'edit' || l.kind === 'delete' ? (
                          <IconButton icon="rollback" label="이 시점으로 롤백" size="sm" onClick={() => setConfirmRb(l)} />
                        ) : null}
                      </td>
                    </tr>
                    {isExp && (
                      <tr className="expanded">
                        <td colSpan={7} style={{ padding: 0 }}>
                          <div style={{ padding: 16, background: 'var(--bg-subtle)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 24px 1fr', gap: 12, alignItems: 'stretch' }}>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', marginBottom: 6, letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase' }}>BEFORE</div>
                                <div className="serif" style={{
                                  padding: 12, background: l.before == null ? 'var(--bg-raised)' : 'var(--danger-soft)',
                                  border: '1px solid ' + (l.before == null ? 'var(--border-1)' : 'rgba(220, 38, 38, 0.2)'),
                                  borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', lineHeight: 1.6,
                                  color: l.before == null ? 'var(--ink-4)' : 'var(--ink-1)',
                                  whiteSpace: 'pre-wrap', minHeight: 60,
                                }}>{l.before == null ? '(없음)' : l.before}</div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-4)' }}>
                                <Icon name="chevronRight" size={16} />
                              </div>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', marginBottom: 6, letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase' }}>AFTER</div>
                                <div className="serif" style={{
                                  padding: 12, background: l.after == null ? 'var(--bg-raised)' : 'var(--success-soft)',
                                  border: '1px solid ' + (l.after == null ? 'var(--border-1)' : 'rgba(5, 150, 105, 0.2)'),
                                  borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', lineHeight: 1.6,
                                  color: l.after == null ? 'var(--ink-4)' : 'var(--ink-1)',
                                  whiteSpace: 'pre-wrap', minHeight: 60,
                                }}>{l.after == null ? '(삭제됨)' : l.after}</div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--ink-4)' }}>
                    <Icon name="history" size={24} style={{ marginBottom: 6 }} />
                    <div style={{ fontSize: 'var(--fs-sm)' }}>조건에 맞는 로그가 없어요</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Confirm
        open={!!confirmRb}
        title="이 시점으로 롤백할까요?"
        message={confirmRb ? `"${confirmRb.label}"을 이전 상태로 되돌립니다. 이 롤백 자체도 로그에 기록돼요.` : ''}
        onConfirm={() => { onRollback(confirmRb); setConfirmRb(null); }}
        onCancel={() => setConfirmRb(null)}
      />
    </div>
  );
}

window.LogTab = LogTab;
