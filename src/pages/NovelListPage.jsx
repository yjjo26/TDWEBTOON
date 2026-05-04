import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNovels } from "../data/hooks";
import * as api from "../data/api";
import { useAuth } from "../context/AuthContext";
import Icon from "../components/Icon";
import IconButton from "../components/IconButton";
import Confirm from "../components/Confirm";
import { fmtTime, coverGradient } from "../data/utils";

export default function NovelListPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { novels, error, refresh } = useNovels();
  const [q, setQ] = useState("");
  const [view, setView] = useState(
    () => localStorage.getItem("td:listView") || "grid"
  );
  const [sortBy, setSortBy] = useState(
    () => localStorage.getItem("td:listSort") || "updated"
  );
  const [newTitle, setNewTitle] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const setViewPersist = (v) => {
    setView(v);
    localStorage.setItem("td:listView", v);
  };
  const setSortPersist = (v) => {
    setSortBy(v);
    localStorage.setItem("td:listSort", v);
  };

  const list = novels || [];
  const filtered = useMemo(() => {
    return list
      .filter(
        (n) =>
          !q ||
          (n.title || "").includes(q) ||
          (n.summary || "").includes(q)
      )
      .sort((a, b) => {
        if (sortBy === "title") return a.title.localeCompare(b.title);
        return (b.updated_at || 0) - (a.updated_at || 0);
      });
  }, [list, q, sortBy]);

  const create = async () => {
    if (!newTitle.trim() || busy) return;
    setBusy(true);
    try {
      const novel = await api.createNovel(newTitle.trim());
      setNewTitle("");
      await refresh();
      navigate(`/novels/${encodeURIComponent(novel.slug)}/plot`);
    } catch (e) {
      alert(`생성 실패: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (slug) => {
    try {
      await api.deleteNovel(slug);
      await refresh();
    } catch (e) {
      alert(`삭제 실패: ${e.message}`);
    }
  };

  return (
    <div
      className="page-in"
      style={{ minHeight: "100vh", background: "var(--bg-base)" }}
    >
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-1)",
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--r-md)",
              background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            <Icon name="feather" size={16} stroke={2} />
          </div>
          <h1
            className="serif"
            style={{ fontSize: "var(--fs-lg)", fontWeight: 800, flex: 1 }}
          >
            소설 작업실
          </h1>

          <IconButton icon="logout" label="로그아웃" onClick={logout} align="end" pos="bottom" />
        </div>
      </header>

      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 24px" }}>
        {/* Title row */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div>
            <h2
              className="serif"
              style={{
                fontSize: "var(--fs-3xl)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
              }}
            >
              내 소설
            </h2>
            <p
              style={{
                fontSize: "var(--fs-sm)",
                color: "var(--ink-3)",
                marginTop: 4,
              }}
            >
              {list.length}편의 작품을 쓰고 있어요
            </p>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: 12,
              background: "var(--danger-soft)",
              color: "var(--danger)",
              borderRadius: "var(--r-md)",
              marginBottom: 16,
              fontSize: "var(--fs-sm)",
            }}
          >
            서버 오류: {error}
          </div>
        )}

        {/* Search + view toggles */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              position: "relative",
              flex: "1 1 240px",
              minWidth: 200,
            }}
          >
            <Icon
              name="search"
              size={16}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--ink-4)",
                pointerEvents: "none",
              }}
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="소설 제목, 줄거리로 찾기"
              className="input"
              style={{ paddingLeft: 36 }}
            />
            {q && (
              <button
                onClick={() => setQ("")}
                title="검색어 지우기"
                data-tooltip="검색어 지우기"
                aria-label="검색어 지우기"
                className="icon-btn sm"
                style={{
                  position: "absolute",
                  right: 4,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              >
                <Icon name="close" size={12} />
              </button>
            )}
          </div>

          <SortToggle sortBy={sortBy} setSortBy={setSortPersist} />
          <ViewToggle view={view} setView={setViewPersist} />
        </div>

        {/* New novel input */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 24,
            padding: 12,
            background: "var(--bg-surface)",
            border: "1px dashed var(--border-2)",
            borderRadius: "var(--r-lg)",
          }}
        >
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder="새 소설 제목을 입력하고 Enter"
            className="input"
            style={{
              border: "none",
              background: "transparent",
              padding: "4px 8px",
            }}
          />
          <IconButton
            icon="plus"
            label="새 소설 만들기"
            shortcut="⌘N"
            variant="primary"
            onClick={create}
            disabled={!newTitle.trim() || busy}
          />
        </div>

        {/* Cards */}
        {!novels ? (
          <p style={{ color: "var(--ink-4)" }}>불러오는 중…</p>
        ) : filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "64px 24px",
              color: "var(--ink-3)",
            }}
          >
            <Icon
              name="book"
              size={32}
              style={{ color: "var(--ink-4)", marginBottom: 12 }}
            />
            <p>{q ? "검색 결과가 없어요" : "첫 소설을 시작해보세요"}</p>
          </div>
        ) : view === "grid" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {filtered.map((n) => (
              <NovelCard
                key={n.slug}
                novel={n}
                onOpen={() =>
                  navigate(`/novels/${encodeURIComponent(n.slug)}/plot`)
                }
                onDelete={() => setConfirm(n)}
              />
            ))}
          </div>
        ) : (
          <div className="card" style={{ overflow: "hidden" }}>
            {filtered.map((n, i) => (
              <NovelRow
                key={n.slug}
                novel={n}
                first={i === 0}
                onOpen={() =>
                  navigate(`/novels/${encodeURIComponent(n.slug)}/plot`)
                }
                onDelete={() => setConfirm(n)}
              />
            ))}
          </div>
        )}
      </main>

      <Confirm
        open={!!confirm}
        title="소설을 삭제할까요?"
        message={
          confirm
            ? `"${confirm.title}"의 모든 내용이 삭제됩니다. 로그에는 남아 롤백 가능해요.`
            : ""
        }
        danger
        onConfirm={() => {
          onDelete(confirm.slug);
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

function SortToggle({ sortBy, setSortBy }) {
  const wrap = {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: 4,
    background: "var(--bg-surface)",
    border: "1px solid var(--border-1)",
    borderRadius: "var(--r-md)",
  };
  const btn = (active) => ({
    background: active ? "var(--accent-soft)" : "transparent",
    color: active ? "var(--accent)" : undefined,
  });
  return (
    <div style={wrap}>
      <button
        onClick={() => setSortBy("updated")}
        title="최근 편집순"
        data-tooltip="최근 편집순"
        aria-label="최근 편집순"
        className="icon-btn sm"
        style={btn(sortBy === "updated")}
      >
        <Icon name="clock" size={14} />
      </button>
      <button
        onClick={() => setSortBy("title")}
        title="제목순"
        data-tooltip="제목순"
        aria-label="제목순"
        className="icon-btn sm"
        style={btn(sortBy === "title")}
      >
        <Icon name="sort" size={14} />
      </button>
    </div>
  );
}

function ViewToggle({ view, setView }) {
  const wrap = {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: 4,
    background: "var(--bg-surface)",
    border: "1px solid var(--border-1)",
    borderRadius: "var(--r-md)",
  };
  const btn = (active) => ({
    background: active ? "var(--accent-soft)" : "transparent",
    color: active ? "var(--accent)" : undefined,
  });
  return (
    <div style={wrap}>
      <button
        onClick={() => setView("grid")}
        title="카드 보기"
        data-tooltip="카드 보기"
        aria-label="카드 보기"
        className="icon-btn sm"
        style={btn(view === "grid")}
      >
        <Icon name="grid" size={14} />
      </button>
      <button
        onClick={() => setView("list")}
        title="목록 보기"
        data-tooltip="목록 보기"
        aria-label="목록 보기"
        className="icon-btn sm"
        style={btn(view === "list")}
      >
        <Icon name="list" size={14} />
      </button>
    </div>
  );
}

function NovelCard({ novel, onOpen, onDelete }) {
  return (
    <article
      className="card hover"
      style={{
        cursor: "pointer",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
      onClick={onOpen}
    >
      <div
        style={{
          height: 100,
          background: coverGradient(novel.cover),
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          padding: 12,
        }}
      >
        <div
          style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            title="삭제"
            data-tooltip="삭제"
            aria-label="삭제"
            className="icon-btn sm"
            style={{ background: "rgba(255,255,255,0.85)", color: "var(--danger)" }}
            onClick={onDelete}
          >
            <Icon name="trash" size={12} />
          </button>
        </div>
        <Icon
          name="feather"
          size={28}
          style={{ color: "rgba(255,255,255,0.85)" }}
        />
      </div>
      <div
        style={{
          padding: 16,
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h3
          className="serif"
          style={{
            fontSize: "var(--fs-lg)",
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          {novel.title}
        </h3>
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--ink-3)",
            lineHeight: 1.5,
            flex: 1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {novel.summary || "아직 줄거리가 없어요"}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 12,
            fontSize: "var(--fs-xs)",
            color: "var(--ink-4)",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Icon name="fileText" size={12} /> 다음 {novel.next_episode}화
          </span>
          <span style={{ marginLeft: "auto" }}>
            {fmtTime(novel.updated_at)}
          </span>
        </div>
      </div>
    </article>
  );
}

function NovelRow({ novel, first, onOpen, onDelete }) {
  return (
    <div
      onClick={onOpen}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderTop: first ? "none" : "1px solid var(--border-1)",
        cursor: "pointer",
        transition: "background var(--dur-fast)",
      }}
      onMouseOver={(e) =>
        (e.currentTarget.style.background = "var(--bg-raised)")
      }
      onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div
        style={{
          width: 32,
          height: 40,
          borderRadius: 4,
          background: coverGradient(novel.cover),
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="serif"
          style={{ fontSize: "var(--fs-md)", fontWeight: 700 }}
        >
          {novel.title}
        </div>
        <div
          style={{
            fontSize: "var(--fs-xs)",
            color: "var(--ink-3)",
            marginTop: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {novel.summary || "줄거리 없음"}
        </div>
      </div>
      <div
        style={{
          fontSize: "var(--fs-xs)",
          color: "var(--ink-4)",
          width: 70,
          textAlign: "right",
        }}
      >
        {fmtTime(novel.updated_at)}
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <IconButton
          icon="trash"
          label="삭제"
          variant="danger"
          size="sm"
          onClick={onDelete}
        />
      </div>
    </div>
  );
}
