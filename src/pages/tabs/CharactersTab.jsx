import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import * as api from "../../data/api";
import EditableCard from "../../components/EditableCard";
import IconButton from "../../components/IconButton";
import Icon from "../../components/Icon";

export default function CharactersTab() {
  const { novel, slug, refresh } = useOutletContext();
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);

  const characters = useMemo(
    () => novel.files.filter((f) => f.kind === "character"),
    [novel.files]
  );
  const filtered = useMemo(
    () =>
      characters.filter(
        (c) => !q || c.title.includes(q) || (c.content || "").includes(q)
      ),
    [characters, q]
  );

  // EditableCard 는 { name, desc } 패턴을 사용 → 우리 file 모델로 매핑
  const toCardItem = (file) => ({
    id: file.id,
    name: file.title,
    desc: file.content,
  });

  const onSave = async (item) => {
    if (item.id === "new") {
      try {
        const key = (item.name || "")
          .replace(/[\\/]/g, "_")
          .slice(0, 60) || `char-${Date.now().toString(36)}`;
        await api.createFile(slug, {
          kind: "character",
          key,
          title: item.name || "이름 없음",
          content: item.desc || "",
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
            캐릭터
          </h2>
          <p
            style={{
              fontSize: "var(--fs-sm)",
              color: "var(--ink-3)",
              marginTop: 4,
            }}
          >
            {characters.length}명의 인물
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
              placeholder="이름, 설명으로 찾기"
              className="input"
              style={{ paddingLeft: 32 }}
            />
          </div>
          <IconButton
            icon="plus"
            label="캐릭터 추가"
            shortcut="⌘⇧A"
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
            item={{ id: "new", name: "", desc: "" }}
            autoEdit
            fields={[
              {
                key: "name",
                placeholder: "이름",
                autoFocus: true,
                bold: true,
                large: true,
              },
              {
                key: "desc",
                type: "textarea",
                placeholder: "나이, 외모, 성격, 배경… 자유롭게 적어주세요",
                minHeight: 100,
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
                placeholder: "나이, 외모, 성격, 배경…",
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
              name="users"
              size={28}
              style={{ color: "var(--ink-4)", marginBottom: 8 }}
            />
            <p style={{ fontSize: "var(--fs-sm)" }}>
              {q ? "검색 결과가 없어요" : "첫 캐릭터를 추가해보세요"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
