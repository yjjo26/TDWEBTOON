import { Fragment, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import * as api from "../../data/api";
import { useLogs } from "../../data/hooks";
import Icon from "../../components/Icon";
import IconButton from "../../components/IconButton";
import LogChip from "../../components/LogChip";
import Confirm from "../../components/Confirm";
import { Avatar } from "../../components/Avatar";
import { COLLABORATORS, fmtTime, fmtFullTime } from "../../data/utils";

const KIND_TO_TARGET = {
  novel: "소설",
  title: "소설",
  synopsis: "줄거리",
  character: "캐릭터",
  world: "배경",
  episode: "회차",
};

const ACTIONS = [
  { id: "all", label: "전체" },
  { id: "create", label: "추가" },
  { id: "update", label: "수정" },
  { id: "delete", label: "삭제" },
  { id: "rollback", label: "롤백" },
];

const TARGETS = ["all", "소설", "줄거리", "캐릭터", "배경", "회차"];

export default function LogTab() {
  const { slug, refresh } = useOutletContext();
  const { logs, error, refresh: refreshLogs } = useLogs(slug);

  const [filter, setFilter] = useState("all");
  const [targetFilter, setTargetFilter] = useState("all");
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("time");
  const [sortDir, setSortDir] = useState("desc");
  const [expanded, setExpanded] = useState(null);
  const [confirmRb, setConfirmRb] = useState(null);

  const enriched = useMemo(
    () =>
      (logs || []).map((l) => ({
        ...l,
        targetLabel: KIND_TO_TARGET[l.target_kind] || l.target_kind,
      })),
    [logs]
  );

  const filtered = useMemo(() => {
    let arr = enriched.slice();
    if (filter !== "all") arr = arr.filter((l) => l.action === filter);
    if (targetFilter !== "all") arr = arr.filter((l) => l.targetLabel === targetFilter);
    if (q) {
      const ql = q.toLowerCase();
      arr = arr.filter((l) => (l.description || "").toLowerCase().includes(ql));
    }
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "time") cmp = a.timestamp - b.timestamp;
      else if (sortBy === "kind") cmp = a.action.localeCompare(b.action);
      else if (sortBy === "target")
        cmp = a.targetLabel.localeCompare(b.targetLabel);
      else if (sortBy === "label")
        cmp = (a.description || "").localeCompare(b.description || "");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [enriched, filter, targetFilter, q, sortBy, sortDir]);

  const counts = useMemo(
    () => ({
      all: enriched.length,
      create: enriched.filter((l) => l.action === "create").length,
      update: enriched.filter((l) => l.action === "update").length,
      delete: enriched.filter((l) => l.action === "delete").length,
      rollback: enriched.filter((l) => l.action === "rollback").length,
    }),
    [enriched]
  );

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortDir("desc");
    }
  };

  const sortIcon = (col) =>
    sortBy !== col ? null : (
      <Icon
        name={sortDir === "asc" ? "chevronUp" : "chevronDown"}
        size={11}
        style={{ marginLeft: 2 }}
      />
    );

  const onRollback = async (log) => {
    if (!log.target_id || !log.before_version) {
      alert("롤백 대상 버전 정보가 없는 로그입니다.");
      return;
    }
    try {
      await api.rollbackFile(slug, log.target_id, log.before_version);
      await refresh();
      await refreshLogs();
    } catch (e) {
      alert(`롤백 실패: ${e.message}`);
    } finally {
      setConfirmRb(null);
    }
  };

  return (
    <div
      className="page-in"
      style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h2
            className="serif"
            style={{ fontSize: "var(--fs-2xl)", fontWeight: 800 }}
          >
            변경 이력
          </h2>
          <p
            style={{
              fontSize: "var(--fs-sm)",
              color: "var(--ink-3)",
              marginTop: 4,
            }}
          >
            {counts.all}개의 기록 · 모든 변경은 롤백 가능
          </p>
        </div>
        <div style={{ position: "relative", minWidth: 200 }}>
          <Icon
            name="search"
            size={14}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--ink-4)",
            }}
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="로그 내용 검색"
            className="input"
            style={{ paddingLeft: 30 }}
          />
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: 12,
            background: "var(--danger-soft)",
            color: "var(--danger)",
            borderRadius: "var(--r-md)",
            marginBottom: 12,
          }}
        >
          서버 오류: {error}
        </div>
      )}

      {/* Filter chips */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        {ACTIONS.map((f) => {
          const on = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              title={f.label}
              data-tooltip={f.label}
              style={{
                padding: "6px 12px",
                fontSize: "var(--fs-xs)",
                fontWeight: 600,
                borderRadius: "var(--r-pill)",
                background: on ? "var(--accent)" : "var(--bg-surface)",
                color: on ? "white" : "var(--ink-2)",
                border: on ? "none" : "1px solid var(--border-1)",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                transition: "all var(--dur-fast)",
              }}
            >
              {f.label}
              <span
                style={{
                  fontSize: 11,
                  opacity: 0.7,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {counts[f.id]}
              </span>
            </button>
          );
        })}
        <div
          style={{ width: 1, background: "var(--border-1)", margin: "0 4px" }}
        />
        {TARGETS.map((t) => {
          const on = targetFilter === t;
          return (
            <button
              key={t}
              onClick={() => setTargetFilter(t)}
              title={t === "all" ? "모든 영역" : t}
              data-tooltip={t === "all" ? "모든 영역" : t}
              style={{
                padding: "6px 12px",
                fontSize: "var(--fs-xs)",
                fontWeight: 600,
                borderRadius: "var(--r-pill)",
                background: on ? "var(--ink-1)" : "var(--bg-surface)",
                color: on ? "var(--bg-surface)" : "var(--ink-3)",
                border: on ? "none" : "1px solid var(--border-1)",
              }}
            >
              {t === "all" ? "모든 영역" : t}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: "hidden", padding: 0 }}>
        <div
          style={{
            maxHeight: "calc(100vh - 320px)",
            overflowY: "auto",
            overflowX: "auto",
          }}
        >
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                <th
                  style={{ width: 80 }}
                  className="sortable"
                  onClick={() => toggleSort("kind")}
                >
                  <span style={{ display: "inline-flex", alignItems: "center" }}>
                    유형{sortIcon("kind")}
                  </span>
                </th>
                <th
                  style={{ width: 80 }}
                  className="sortable"
                  onClick={() => toggleSort("target")}
                >
                  <span style={{ display: "inline-flex", alignItems: "center" }}>
                    영역{sortIcon("target")}
                  </span>
                </th>
                <th className="sortable" onClick={() => toggleSort("label")}>
                  <span style={{ display: "inline-flex", alignItems: "center" }}>
                    내용{sortIcon("label")}
                  </span>
                </th>
                <th style={{ width: 100 }}>작업자</th>
                <th
                  style={{ width: 130 }}
                  className="sortable"
                  onClick={() => toggleSort("time")}
                >
                  <span style={{ display: "inline-flex", alignItems: "center" }}>
                    시각{sortIcon("time")}
                  </span>
                </th>
                <th style={{ width: 80, textAlign: "right" }}>액션</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const isExp = expanded === l.id;
                const user =
                  COLLABORATORS.find((c) => c.id === l.user_label) || {
                    id: l.user_label || "anon",
                    name: l.user_label || "익명",
                    color: "#94A3B8",
                    initials: (l.user_label || "?").slice(0, 1).toUpperCase(),
                  };
                const canRollback =
                  l.action === "update" && l.target_id && l.before_version;
                return (
                  <Fragment key={l.id}>
                    <tr
                      className={isExp ? "expanded" : ""}
                      onClick={() => setExpanded(isExp ? null : l.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        <Icon
                          name={isExp ? "chevronDown" : "chevronRight"}
                          size={12}
                          style={{ color: "var(--ink-4)" }}
                        />
                      </td>
                      <td>
                        <LogChip kind={l.action} />
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "var(--fs-xs)",
                            color: "var(--ink-3)",
                          }}
                        >
                          {l.targetLabel}
                        </span>
                      </td>
                      <td>
                        <span
                          className="serif"
                          style={{ fontWeight: 600, color: "var(--ink-1)" }}
                        >
                          {l.description}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Avatar user={user} size={20} />
                          <span style={{ fontSize: "var(--fs-xs)" }}>
                            {user.name}
                          </span>
                        </span>
                      </td>
                      <td>
                        <span
                          title={fmtFullTime(l.timestamp)}
                          style={{
                            fontSize: "var(--fs-xs)",
                            color: "var(--ink-3)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {fmtTime(l.timestamp)}
                        </span>
                      </td>
                      <td
                        style={{ textAlign: "right" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {canRollback && (
                          <IconButton
                            icon="rollback"
                            label="이 시점으로 롤백"
                            size="sm"
                            onClick={() => setConfirmRb(l)}
                          />
                        )}
                      </td>
                    </tr>
                    {isExp && (
                      <tr className="expanded">
                        <td colSpan={7} style={{ padding: 0 }}>
                          <div
                            style={{ padding: 16, background: "var(--bg-subtle)" }}
                          >
                            <div
                              style={{
                                fontSize: "var(--fs-xs)",
                                color: "var(--ink-3)",
                                lineHeight: 1.6,
                              }}
                            >
                              {l.before_version != null && (
                                <div>
                                  버전 변화: v{l.before_version}
                                  {l.after_version != null && ` → v${l.after_version}`}
                                </div>
                              )}
                              {l.target_id && (
                                <div style={{ fontFamily: "var(--font-mono)" }}>
                                  대상 ID: {l.target_id}
                                </div>
                              )}
                              <div>
                                상세 시각:{" "}
                                <span style={{ fontFamily: "var(--font-mono)" }}>
                                  {fmtFullTime(l.timestamp)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: 48,
                      color: "var(--ink-4)",
                    }}
                  >
                    <Icon name="history" size={24} style={{ marginBottom: 6 }} />
                    <div style={{ fontSize: "var(--fs-sm)" }}>
                      조건에 맞는 로그가 없어요
                    </div>
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
        message={
          confirmRb
            ? `"${confirmRb.description}"의 이전 버전(v${confirmRb.before_version})으로 되돌립니다. 이 롤백 자체도 로그에 기록돼요.`
            : ""
        }
        onConfirm={() => onRollback(confirmRb)}
        onCancel={() => setConfirmRb(null)}
      />
    </div>
  );
}
