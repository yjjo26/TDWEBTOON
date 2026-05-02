import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useNovel } from "../data/hooks";
import * as api from "../data/api";
import { useAuth } from "../context/AuthContext";
import Icon from "../components/Icon";
import IconButton from "../components/IconButton";
import { AvatarStack } from "../components/Avatar";
import { coverGradient, COLLABORATORS } from "../data/utils";

const TABS = [
  { to: "plot", label: "줄거리", icon: "fileText" },
  { to: "characters", label: "캐릭터", icon: "users", countOf: (n) => n.files.filter((f) => f.kind === "character").length },
  { to: "settings", label: "배경", icon: "map" },
  { to: "episodes", label: "회차", icon: "book", countOf: (n) => n.files.filter((f) => f.kind === "episode").length },
  { to: "log", label: "로그", icon: "history" },
];

export default function NovelDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { novel, error, loading, refresh } = useNovel(slug);

  if (loading && !novel) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ink-3)",
        }}
      >
        불러오는 중…
      </div>
    );
  }

  if (error || !novel) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ink-3)",
          gap: 12,
        }}
      >
        <p>{error || "소설을 찾을 수 없습니다."}</p>
        <Link
          to="/novels"
          style={{
            color: "var(--accent)",
            textDecoration: "underline",
            fontWeight: 600,
          }}
        >
          목록으로
        </Link>
      </div>
    );
  }

  const onExport = () => {
    alert(
      `"${novel.title}"의 .md 파일을 ZIP으로 묶는 기능은 다음 단계에서 추가됩니다.\n(현재는 알림만 표시)`
    );
  };

  return (
    <div className="page-in">
      <DetailHeader
        novel={novel}
        onBack={() => navigate("/novels")}
        onLogout={logout}
        onExport={onExport}
        refresh={refresh}
      />
      <main>
        <Outlet context={{ novel, slug, refresh }} />
      </main>
    </div>
  );
}

function DetailHeader({ novel, onBack, onLogout, onExport, refresh }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(novel.title);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("td:theme") || "light"
  );
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setVal(novel.title);
  }, [novel.title]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("td:theme", next);
    window.dispatchEvent(new Event("td:settings-changed"));
  };

  const commitTitle = async () => {
    const t = val.trim() || novel.title;
    if (t !== novel.title) {
      try {
        await api.updateNovel(novel.slug, { title: t });
        await refresh();
      } catch (e) {
        alert(`저장 실패: ${e.message}`);
        setVal(novel.title);
      }
    }
    setEditing(false);
  };

  return (
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
          maxWidth: 1280,
          margin: "0 auto",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <IconButton icon="chevronLeft" label="목록으로" onClick={onBack} />

        <div
          style={{
            width: 24,
            height: 30,
            borderRadius: 3,
            background: coverGradient(novel.cover),
            flexShrink: 0,
          }}
        />

        {editing ? (
          <input
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitTitle();
              if (e.key === "Escape") {
                setVal(novel.title);
                setEditing(false);
              }
            }}
            className="serif"
            style={{
              fontSize: "var(--fs-lg)",
              fontWeight: 800,
              padding: "4px 8px",
              background: "var(--bg-surface)",
              border: "1px solid var(--accent)",
              borderRadius: "var(--r-sm)",
              flex: 1,
              maxWidth: 360,
              outline: "none",
              color: "var(--ink-1)",
            }}
          />
        ) : (
          <h1
            className="serif"
            style={{
              fontSize: "var(--fs-lg)",
              fontWeight: 800,
              flex: 1,
              cursor: "text",
              padding: "4px 8px",
              borderRadius: "var(--r-sm)",
            }}
            onClick={() => setEditing(true)}
            title="제목 수정"
            data-tooltip="클릭해서 수정"
          >
            {novel.title}
          </h1>
        )}

        <AvatarStack users={COLLABORATORS} />

        <div
          style={{
            width: 1,
            height: 20,
            background: "var(--border-1)",
            margin: "0 4px",
          }}
        />

        <IconButton
          icon="download"
          label="전체 .md ZIP 다운로드"
          onClick={onExport}
        />
        <IconButton
          icon={theme === "dark" ? "sun" : "moon"}
          label={theme === "dark" ? "라이트 모드" : "다크 모드"}
          onClick={toggleTheme}
        />
        <div style={{ position: "relative" }}>
          <IconButton
            icon="settings"
            label="설정"
            onClick={() => setSettingsOpen((o) => !o)}
          />
          {settingsOpen && (
            <SettingsPopover onClose={() => setSettingsOpen(false)} />
          )}
        </div>
        <IconButton icon="logout" label="로그아웃" onClick={onLogout} />
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
        <DetailTabs novel={novel} />
      </div>
    </header>
  );
}

function DetailTabs({ novel }) {
  return (
    <div className="tab-bar" style={{ borderBottom: "none" }}>
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) => `tab ${isActive ? "active" : ""}`}
          title={t.label}
          data-tooltip={t.label}
        >
          <Icon name={t.icon} size={14} />
          {t.label}
          {t.countOf && (
            <span
              style={{
                fontSize: 11,
                color: "var(--ink-4)",
                fontWeight: 500,
                marginLeft: 2,
              }}
            >
              {t.countOf(novel)}
            </span>
          )}
        </NavLink>
      ))}
    </div>
  );
}

function SettingsPopover({ onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [onClose]);

  const setKey = (k, v) => {
    localStorage.setItem(k, v);
    window.dispatchEvent(new Event("td:settings-changed"));
  };

  const density = localStorage.getItem("td:density") || "standard";
  const sidebar = localStorage.getItem("td:sidebar") || "left";

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        right: 0,
        top: "calc(100% + 6px)",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-2)",
        borderRadius: "var(--r-md)",
        boxShadow: "var(--shadow-lg)",
        padding: 12,
        minWidth: 200,
        zIndex: 100,
      }}
    >
      <RadioRow
        label="밀도"
        value={density}
        options={[
          { v: "compact", l: "조밀" },
          { v: "standard", l: "표준" },
          { v: "spacious", l: "넉넉" },
        ]}
        onChange={(v) => setKey("td:density", v)}
      />
      <div style={{ height: 8 }} />
      <RadioRow
        label="회차 사이드바"
        value={sidebar}
        options={[
          { v: "left", l: "왼쪽" },
          { v: "right", l: "오른쪽" },
        ]}
        onChange={(v) => setKey("td:sidebar", v)}
      />
    </div>
  );
}

function RadioRow({ label, value, options, onChange }) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--ink-3)",
          marginBottom: 4,
          letterSpacing: "var(--tracking-wide)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          gap: 2,
          padding: 2,
          background: "var(--bg-raised)",
          borderRadius: "var(--r-sm)",
        }}
      >
        {options.map((o) => (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            style={{
              flex: 1,
              padding: "4px 8px",
              fontSize: "var(--fs-xs)",
              fontWeight: 600,
              borderRadius: "var(--r-sm)",
              background: value === o.v ? "var(--bg-surface)" : "transparent",
              color: value === o.v ? "var(--ink-1)" : "var(--ink-3)",
              boxShadow: value === o.v ? "var(--shadow-sm)" : "none",
            }}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}
