// localStorage 기반 데이터 스토어
// 모든 변경(추가/수정/삭제)은 자동으로 logs 배열에 기록됩니다.
// 추후 Firebase Firestore 로 교체할 때 이 파일의 인터페이스만 유지하면 됩니다.

const STORAGE_KEY = "novel_app_state_v1";

const SUBSCRIBERS = new Set();

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function nowISO() {
  return new Date().toISOString();
}

function loadRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveRaw(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  SUBSCRIBERS.forEach((cb) => {
    try {
      cb(state);
    } catch {
      /* ignore */
    }
  });
}

// ---------- Seed ----------
function seed() {
  const novelId = uid();
  const initial = {
    novels: [
      {
        id: novelId,
        title: "예시 소설 1",
        synopsis:
          "여기에 줄거리를 작성하세요. 이 영역은 클릭하여 직접 편집할 수 있습니다.",
        characters: [
          { id: uid(), name: "홍길동", description: "주인공. 의적." },
        ],
        backgrounds: [
          {
            id: uid(),
            name: "대학교",
            items: [
              { id: uid(), name: "공학관", description: "주인공이 다니는 학과 건물" },
            ],
          },
          { id: uid(), name: "절", items: [] },
          { id: uid(), name: "산속", items: [] },
        ],
        episodes: [
          { id: uid(), title: "1화 - 시작", content: "회차 본문을 입력하세요." },
        ],
        logs: [
          {
            id: uid(),
            timestamp: nowISO(),
            action: "create",
            target: "novel",
            description: "소설 '예시 소설 1' 생성 (초기 시드)",
          },
        ],
      },
    ],
  };
  saveRaw(initial);
  return initial;
}

// ---------- Public API ----------
export function getState() {
  let s = loadRaw();
  if (!s) s = seed();
  return s;
}

export function subscribe(cb) {
  SUBSCRIBERS.add(cb);
  return () => SUBSCRIBERS.delete(cb);
}

function appendLog(novel, entry) {
  novel.logs = novel.logs || [];
  novel.logs.unshift({
    id: uid(),
    timestamp: nowISO(),
    ...entry,
  });
}

function updateNovel(novelId, mutator) {
  const state = getState();
  const novel = state.novels.find((n) => n.id === novelId);
  if (!novel) return;
  mutator(novel);
  saveRaw(state);
}

// Novels
export function listNovels() {
  return getState().novels;
}

export function getNovel(id) {
  return getState().novels.find((n) => n.id === id);
}

export function createNovel(title) {
  const state = getState();
  const novel = {
    id: uid(),
    title: title || "새 소설",
    synopsis: "",
    characters: [],
    backgrounds: [],
    episodes: [],
    logs: [],
  };
  appendLog(novel, {
    action: "create",
    target: "novel",
    description: `소설 '${novel.title}' 생성`,
  });
  state.novels.push(novel);
  saveRaw(state);
  return novel;
}

export function deleteNovel(id) {
  const state = getState();
  const idx = state.novels.findIndex((n) => n.id === id);
  if (idx === -1) return;
  const removed = state.novels[idx];
  state.novels.splice(idx, 1);
  saveRaw(state);
  return removed;
}

// Synopsis
export function updateSynopsis(novelId, newText) {
  updateNovel(novelId, (novel) => {
    const oldText = novel.synopsis || "";
    if (oldText === newText) return;
    novel.synopsis = newText;
    appendLog(novel, {
      action: "update",
      target: "synopsis",
      description: `줄거리 수정`,
      before: oldText,
      after: newText,
    });
  });
}

// Title
export function updateNovelTitle(novelId, newTitle) {
  updateNovel(novelId, (novel) => {
    const before = novel.title;
    if (before === newTitle) return;
    novel.title = newTitle;
    appendLog(novel, {
      action: "update",
      target: "title",
      description: `제목 변경: '${before}' → '${newTitle}'`,
      before,
      after: newTitle,
    });
  });
}

// Characters
export function addCharacter(novelId, character) {
  updateNovel(novelId, (novel) => {
    const c = { id: uid(), name: "이름 없음", description: "", ...character };
    novel.characters.push(c);
    appendLog(novel, {
      action: "create",
      target: "character",
      description: `캐릭터 추가: '${c.name}'`,
    });
  });
}

export function updateCharacter(novelId, charId, patch) {
  updateNovel(novelId, (novel) => {
    const c = novel.characters.find((c) => c.id === charId);
    if (!c) return;
    const changed = Object.keys(patch).filter((k) => c[k] !== patch[k]);
    if (changed.length === 0) return;
    const before = { ...c };
    Object.assign(c, patch);
    appendLog(novel, {
      action: "update",
      target: "character",
      description: `캐릭터 수정: '${c.name}' (${changed.join(", ")})`,
      before,
      after: { ...c },
    });
  });
}

export function deleteCharacter(novelId, charId) {
  updateNovel(novelId, (novel) => {
    const idx = novel.characters.findIndex((c) => c.id === charId);
    if (idx === -1) return;
    const removed = novel.characters[idx];
    novel.characters.splice(idx, 1);
    appendLog(novel, {
      action: "delete",
      target: "character",
      description: `캐릭터 삭제: '${removed.name}'`,
      before: removed,
    });
  });
}

// Backgrounds (categories with items)
export function addBackgroundCategory(novelId, name) {
  updateNovel(novelId, (novel) => {
    const cat = { id: uid(), name: name || "새 배경", items: [] };
    novel.backgrounds.push(cat);
    appendLog(novel, {
      action: "create",
      target: "background_category",
      description: `배경 카테고리 추가: '${cat.name}'`,
    });
  });
}

export function updateBackgroundCategory(novelId, catId, patch) {
  updateNovel(novelId, (novel) => {
    const cat = novel.backgrounds.find((b) => b.id === catId);
    if (!cat) return;
    const before = cat.name;
    if (patch.name !== undefined && patch.name !== before) {
      cat.name = patch.name;
      appendLog(novel, {
        action: "update",
        target: "background_category",
        description: `배경 카테고리 이름 변경: '${before}' → '${cat.name}'`,
        before,
        after: cat.name,
      });
    }
  });
}

export function deleteBackgroundCategory(novelId, catId) {
  updateNovel(novelId, (novel) => {
    const idx = novel.backgrounds.findIndex((b) => b.id === catId);
    if (idx === -1) return;
    const removed = novel.backgrounds[idx];
    novel.backgrounds.splice(idx, 1);
    appendLog(novel, {
      action: "delete",
      target: "background_category",
      description: `배경 카테고리 삭제: '${removed.name}'`,
      before: removed,
    });
  });
}

export function addBackgroundItem(novelId, catId, item) {
  updateNovel(novelId, (novel) => {
    const cat = novel.backgrounds.find((b) => b.id === catId);
    if (!cat) return;
    const it = { id: uid(), name: "새 항목", description: "", ...item };
    cat.items.push(it);
    appendLog(novel, {
      action: "create",
      target: "background_item",
      description: `배경 항목 추가: [${cat.name}] '${it.name}'`,
    });
  });
}

export function updateBackgroundItem(novelId, catId, itemId, patch) {
  updateNovel(novelId, (novel) => {
    const cat = novel.backgrounds.find((b) => b.id === catId);
    if (!cat) return;
    const it = cat.items.find((i) => i.id === itemId);
    if (!it) return;
    const changed = Object.keys(patch).filter((k) => it[k] !== patch[k]);
    if (changed.length === 0) return;
    const before = { ...it };
    Object.assign(it, patch);
    appendLog(novel, {
      action: "update",
      target: "background_item",
      description: `배경 항목 수정: [${cat.name}] '${it.name}' (${changed.join(", ")})`,
      before,
      after: { ...it },
    });
  });
}

export function deleteBackgroundItem(novelId, catId, itemId) {
  updateNovel(novelId, (novel) => {
    const cat = novel.backgrounds.find((b) => b.id === catId);
    if (!cat) return;
    const idx = cat.items.findIndex((i) => i.id === itemId);
    if (idx === -1) return;
    const removed = cat.items[idx];
    cat.items.splice(idx, 1);
    appendLog(novel, {
      action: "delete",
      target: "background_item",
      description: `배경 항목 삭제: [${cat.name}] '${removed.name}'`,
      before: removed,
    });
  });
}

// Episodes
export function addEpisode(novelId, episode) {
  updateNovel(novelId, (novel) => {
    const ep = {
      id: uid(),
      title: `${novel.episodes.length + 1}화`,
      content: "",
      ...episode,
    };
    novel.episodes.push(ep);
    appendLog(novel, {
      action: "create",
      target: "episode",
      description: `회차 추가: '${ep.title}'`,
    });
  });
}

export function updateEpisode(novelId, epId, patch) {
  updateNovel(novelId, (novel) => {
    const ep = novel.episodes.find((e) => e.id === epId);
    if (!ep) return;
    const changed = Object.keys(patch).filter((k) => ep[k] !== patch[k]);
    if (changed.length === 0) return;
    const before = { ...ep };
    Object.assign(ep, patch);
    appendLog(novel, {
      action: "update",
      target: "episode",
      description: `회차 수정: '${ep.title}' (${changed.join(", ")})`,
      before,
      after: { ...ep },
    });
  });
}

export function deleteEpisode(novelId, epId) {
  updateNovel(novelId, (novel) => {
    const idx = novel.episodes.findIndex((e) => e.id === epId);
    if (idx === -1) return;
    const removed = novel.episodes[idx];
    novel.episodes.splice(idx, 1);
    appendLog(novel, {
      action: "delete",
      target: "episode",
      description: `회차 삭제: '${removed.title}'`,
      before: removed,
    });
  });
}
