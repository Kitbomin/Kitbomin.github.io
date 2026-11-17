// velog 글 목록을 받아 data/posts.json 으로 저장한다. (Node 18+, 외부 의존성 없음)
//   node scripts/sync-velog.mjs
// 설정(사용자명·주제 분류·추천 글)은 data/blog.json 에서 읽는다.
// RSS 는 최근 20개만 주므로 velog 공개 GraphQL API 로 전체를 페이지 단위로 받는다.
import { readFile, writeFile } from 'node:fs/promises';

const ROOT = new URL('..', import.meta.url);
const config = JSON.parse(await readFile(new URL('data/blog.json', ROOT), 'utf8'));
const USER = config.username;
const ENDPOINT = 'https://v2.velog.io/graphql';
const QUERY = `query ($u: String, $c: ID) {
  posts(username: $u, cursor: $c, limit: 50) {
    id title url_slug released_at updated_at short_description tags series { name }
  }
}`;

async function fetchPage(cursor) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'portfolio-velog-sync' },
    body: JSON.stringify({ query: QUERY, variables: { u: USER, c: cursor } }),
  });
  if (!res.ok) throw new Error(`velog API ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data.posts || [];
}

const raw = [];
for (let cursor = null; ;) {
  const page = await fetchPage(cursor);
  raw.push(...page);
  if (page.length < 50) break;
  cursor = page[page.length - 1].id;
}

const clean = (s, n) => {
  const t = (s || '')
    .replace(/\s+/g, ' ')
    // velog 요약은 줄바꿈을 지워 "~한다.이를" 처럼 붙어 나옴 → 한글 문장 끝에만 공백 보정 (api.ts, 3.1 등은 그대로)
    .replace(/([가-힣][.!?])(?=[가-힣A-Za-z])/g, '$1 ')
    .trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
};

const topicsOf = (p) => config.topics
  .filter((t) => (t.series || []).includes(p.series?.name) || (t.tags || []).some((tag) => p.tags.includes(tag)))
  .map((t) => t.id);

const posts = raw
  .map((p) => ({
    title: p.title.trim(),
    slug: p.url_slug,
    link: `https://velog.io/@${USER}/${encodeURIComponent(p.url_slug)}`,
    date: p.released_at.slice(0, 10),
    summary: clean(p.short_description, 140),
    tags: p.tags,
    series: p.series?.name || null,
    topics: topicsOf(p),
    featured: config.featured.includes(p.url_slug),
  }))
  .sort((a, b) => b.date.localeCompare(a.date));

const missing = config.featured.filter((s) => !posts.some((p) => p.slug === s));
if (missing.length) console.warn('추천 글을 찾지 못함:', missing);
if (!posts.length) throw new Error('글을 하나도 받지 못함 — 기존 파일을 덮어쓰지 않음');

await writeFile(new URL('data/posts.json', ROOT), JSON.stringify(posts, null, 1) + '\n', 'utf8');
console.log(`posts.json: ${posts.length}개 (최신 ${posts[0].date})`);
