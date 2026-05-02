// data.jsx — sample seed data + store

const seedNovels = [
  {
    id: 'n1',
    title: '폐허의 정원사',
    cover: 'rose',
    summary: '문명이 사라진 후, 한 정원사가 식물의 기억을 통해 잃어버린 인류의 흔적을 되찾는 이야기.',
    updatedAt: '2026-04-30T14:22:00',
    storytelling: '## 톤앤매너\n조용하고 사색적인 톤. 1인칭 관찰자 시점.\n\n## 핵심 갈등\n자연과 기억, 보존과 망각의 충돌.\n\n## 결말 방향\n열린 결말 — 화자가 새로운 씨앗을 심으며 끝.',
    characters: [
      { id: 'c1', name: '한서린', desc: '폐허 도시를 떠도는 정원사. 32세. 식물의 기억을 읽는 능력이 있음. 말수가 적고 신중하다.' },
      { id: 'c2', name: '도진우', desc: '기록 보관소의 마지막 사서. 50대. 서린의 발견을 책으로 남기려 한다.' },
      { id: 'c3', name: '윤하늘', desc: '폐허에서 만난 어린 동행자. 12세. 부모를 잃고 서린을 따라다님.' },
    ],
    settings: '## 날씨\n사계절이 모호해진 시대. 회색 안개가 자주 낀다. 비는 산성을 띠어 식물에 해롭다.\n\n## 건축물\n50년 전 도시의 골조만 남음. 콘크리트 위로 덩굴이 뒤덮여 있다.\n\n## 시대 배경\n대붕괴 이후 47년. 인구는 1/100로 줄었다.\n\n## 기타\n식물은 인간의 기억을 흡수하는 능력을 진화시켰다.',
    episodes: [
      { id: 'e1', title: '1화. 마지막 정원', body: '서린은 무너진 백화점 옥상에서 첫 번째 장미를 발견했다. 잎의 결을 따라 손가락을 갖다 대자, 한 여인의 결혼식 풍경이 머릿속에 흘러들어왔다...', scenes: [
        { id: 's1', situation: '백화점 옥상에서 장미를 발견', characters: ['c1'], setting: '폐허 도시 옥상' },
        { id: 's2', situation: '식물의 기억을 처음 읽음', characters: ['c1'], setting: '백화점 옥상' },
      ]},
      { id: 'e2', title: '2화. 사서의 부탁', body: '도진우가 서린을 찾아왔다. 그는 자신의 보관소에 있는 마른 식물들을 보여주며 그들의 기억을 받아 적어달라고 부탁했다...', scenes: [] },
      { id: 'e3', title: '3화. 회색 비', body: '비가 내리기 시작했다. 서린은 임시 천막 아래에서 윤하늘이라는 아이를 만난다...', scenes: [] },
      { id: 'e4', title: '4화. 첫 번째 씨앗', body: '', scenes: [] },
    ],
    logs: [
      { id: 'l1', kind: 'add', target: '회차', label: '4화. 첫 번째 씨앗', time: '2026-04-30T14:22:00', user: 'me', before: null, after: '4화. 첫 번째 씨앗' },
      { id: 'l2', kind: 'edit', target: '캐릭터', label: '한서린', time: '2026-04-30T11:15:00', user: 'me', before: '폐허 도시를 떠도는 정원사. 30세.', after: '폐허 도시를 떠도는 정원사. 32세. 식물의 기억을 읽는 능력이 있음. 말수가 적고 신중하다.' },
      { id: 'l3', kind: 'edit', target: '회차', label: '1화. 마지막 정원', time: '2026-04-29T20:08:00', user: 'editor1', before: '서린은 백화점 옥상에서 장미를 발견했다.', after: '서린은 무너진 백화점 옥상에서 첫 번째 장미를 발견했다. 잎의 결을 따라...' },
      { id: 'l4', kind: 'rollback', target: '줄거리', label: 'storytelling_style.md', time: '2026-04-29T15:30:00', user: 'me', before: 'v3', after: 'v2' },
      { id: 'l5', kind: 'add', target: '캐릭터', label: '윤하늘', time: '2026-04-28T22:11:00', user: 'editor1', before: null, after: '윤하늘' },
      { id: 'l6', kind: 'delete', target: '회차', label: '구. 외전 1', time: '2026-04-28T10:00:00', user: 'me', before: '외전 1: 도진우의 어린 시절...', after: null },
      { id: 'l7', kind: 'edit', target: '배경', label: 'settings.md', time: '2026-04-27T16:42:00', user: 'me', before: '## 날씨\n사계절이 있다.', after: '## 날씨\n사계절이 모호해진 시대...' },
      { id: 'l8', kind: 'add', target: '회차', label: '3화. 회색 비', time: '2026-04-26T09:20:00', user: 'editor1', before: null, after: '3화. 회색 비' },
    ],
  },
  {
    id: 'n2',
    title: '도시의 그림자 길드',
    cover: 'indigo',
    summary: '서울 한복판, 보이지 않는 길드들이 도시의 그림자를 거래한다. 새로 입문한 견습생의 첫 임무.',
    updatedAt: '2026-04-25T10:00:00',
    storytelling: '## 톤앤매너\n도시 누아르. 빠른 호흡. 짧은 문장.',
    characters: [
      { id: 'c1', name: '진하루', desc: '견습 그림자 사냥꾼. 19세.' },
      { id: 'c2', name: '마스터 림', desc: '길드의 노련한 베테랑. 정체불명.' },
    ],
    settings: '## 날씨\n늘 비 오는 서울.\n\n## 건축물\n현대 서울 + 지하 던전.\n\n## 시대 배경\n현대.\n\n## 기타\n그림자에는 가격이 매겨진다.',
    episodes: [
      { id: 'e1', title: '1화. 첫 사냥', body: '비 오는 종로 뒷골목...', scenes: [] },
      { id: 'e2', title: '2화. 지하의 시장', body: '', scenes: [] },
    ],
    logs: [
      { id: 'l1', kind: 'add', target: '소설', label: '도시의 그림자 길드', time: '2026-04-20T10:00:00', user: 'me', before: null, after: '도시의 그림자 길드' },
    ],
  },
  {
    id: 'n3',
    title: '바다 위의 도서관',
    cover: 'teal',
    summary: '떠다니는 도서관 배에서 일하는 사서. 책 한 권이 사라질 때마다 누군가의 기억도 사라진다.',
    updatedAt: '2026-04-12T09:00:00',
    storytelling: '',
    characters: [],
    settings: '',
    episodes: [],
    logs: [],
  },
];

const collaborators = [
  { id: 'me',       name: '나',     color: '#4F46E5', initials: 'ME' },
  { id: 'editor1',  name: '편집자',  color: '#DB2777', initials: '편' },
  { id: 'writer2',  name: '공동작가', color: '#059669', initials: '공' },
];

window.seedNovels = seedNovels;
window.collaborators = collaborators;

// helpers
window.fmtTime = function(iso) {
  const d = new Date(iso);
  const now = new Date('2026-05-03T15:00:00');
  const diff = (now - d) / 1000;
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff/60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff/3600)}시간 전`;
  if (diff < 86400*7) return `${Math.floor(diff/86400)}일 전`;
  return `${d.getMonth()+1}월 ${d.getDate()}일`;
};

window.fmtFullTime = function(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

window.countWords = function(text) {
  if (!text) return { chars: 0, charsNoSpace: 0, words: 0, pages: 0 };
  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, '').length;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const pages = Math.ceil(charsNoSpace / 1000); // 원고지 1장 ~= 1000자 (대략)
  return { chars, charsNoSpace, words, pages };
};

window.coverGradient = function(kind) {
  const map = {
    rose:   'linear-gradient(135deg, #fda4af 0%, #be185d 100%)',
    indigo: 'linear-gradient(135deg, #a5b4fc 0%, #3730a3 100%)',
    teal:   'linear-gradient(135deg, #5eead4 0%, #0f766e 100%)',
    amber:  'linear-gradient(135deg, #fcd34d 0%, #b45309 100%)',
    slate:  'linear-gradient(135deg, #cbd5e1 0%, #334155 100%)',
  };
  return map[kind] || map.slate;
};
