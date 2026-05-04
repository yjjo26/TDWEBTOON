import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import * as api from "../../data/api";
import EditableCard from "../../components/EditableCard";
import IconButton from "../../components/IconButton";
import Icon from "../../components/Icon";
import { downloadKindZip } from "../../data/download";

const TEMPLATE = "## 날씨\n\n## 건축물\n\n## 시대 배경\n\n## 기타\n";

// 배경 — 캐릭터처럼 다중 항목. kind='world', key=항목 슬러그.
export default function SettingsTab() {
  const { novel, slug, refresh } = useOutletContext();
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);

  const items = useMemo(
    () => novel.files.filter((f) => f.kind === "world"),
    [novel.files]
  );
  const filtered = useMemo(
    () =>
      items.filter(
        (c) => !q || c.title.includes(q) || (c.content || "").includes(q)
      ),
    [items, q]
  );

  // file → EditableCard item ({ id, name, desc })
  const toCardItem = (file) => ({
    id: file.id,
    name: file.title,
    desc: file.content,
  });

  const onSave = async (item) => {
    if (item.id === "new") {
      try {
        const key =
          (item.name || "").replace(/[\\/]/g, "_").slice(0, 60) ||
          `bg-${Date.now().toString(36)}`;
        await api.createFile(slug, {
          kind: "world",
          key,
          title: item.name || "이름 없음",
          content: item.desc || TEMPLATE,
        });
        await refresh();
        setAdding(false);
      } catch (e) {
        alert(`추가 실패: ${e.message}`);
      }
    } else {
      try {
        await api.updateFile(slug, item.id, {
          title: item.name,
          content: item.desc,
        });
        await refresh();
      } catch (e) {
        alert(`저장 실패: ${e.message}`);
      }
    }
  };

  const onDelete = async (id) => {
    try {
      await api.deleteFile(slug, id);
      await refresh();
    } catch (e) {
      alert(`삭제 실패: ${e.message}`);
    }
  };

  return (
    <div
      className="page-in"
      style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 24px" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 16,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2
            className="serif"
            style={{ fontSize: "var(--fs-2xl)", fontWeight: 800 }}
          >
            배경 · 세계관
          </h2>
          <p
            style={{
              fontSize: "var(--fs-sm)",
              color: "var(--ink-3)",
              marginTop: 4,
            }}
          >
            {items.length}개의 배경
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: 6,
            flex: 1,
            maxWidth: 480,
            marginLeft: "auto",
          }}
        >
          <div style={{ position: "relative", flex: 1 }}>
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
              placeholder="이름, 내용으로 찾기"
              className="input"
              style={{ paddingLeft: 32 }}
            />
          </div>
          <IconButton
            icon="download"
            label="배경 ZIP 다운로드"
            onClick={() => downloadKindZip(novel, "world")}
            disabled={items.length === 0}
          />
          <IconButton
            icon="plus"
            label="배경 추가"
            variant="primary"
            onClick={() => setAdding(true)}
            disabled={adding}
          />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 12,
        }}
      >
        {adding && (
          <EditableCard
            item={{ id: "new", name: "", desc: TEMPLATE }}
            autoEdit
            fields={[
              {
                key: "name",
                placeholder: "배경 이름 (예: 대학교, 절, 산속)",
                autoFocus: true,
                bold: true,
                large: true,
              },
              {
                key: "desc",
                type: "textarea",
                placeholder:
                  "## 날씨 · ## 건축물 · ## 시대 배경 · ## 기타 — 자유롭게 적어주세요",
                minHeight: 140,
                serif: true,
              },
            ]}
            onSave={onSave}
            onCancelNew={() => setAdding(false)}
          />
        )}
        {filtered.map((c) => (
          <EditableCard
            key={c.id}
            item={toCardItem(c)}
            fields={[
              { key: "name", placeholder: "이름", bold: true, large: true },
              {
                key: "desc",
                type: "textarea",
                placeholder: "## 날씨 · ## 건축물 · ## 시대 배경 · ## 기타",
                minHeight: 140,
                serif: true,
              },
            ]}
            onSave={onSave}
            onDelete={onDelete}
          />
        ))}
        {filtered.length === 0 && !adding && (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: 64,
              color: "var(--ink-3)",
            }}
          >
            <Icon
              name="map"
              size={28}
              style={{ color: "var(--ink-4)", marginBottom: 8 }}
            />
            <p style={{ fontSize: "var(--fs-sm)" }}>
              {q ? "검색 결과가 없어요" : "첫 배경을 추가해보세요"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
