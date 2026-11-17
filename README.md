# kitbomin.github.io

김보민의 포트폴리오 사이트 — https://kitbomin.github.io

빌드 도구 없는 정적 사이트입니다. 내용은 `data/*.json`에서 읽어 그리므로, 대부분의 수정은 JSON만 고치면 됩니다.

## 구조

```
index.html              메인 (소개 · 논문 · 프로젝트 · 학습 기록 · 블로그)
blog/                   velog 글 전체 아카이브 (주제 필터 · 검색)
projects/<slug>/        프로젝트 상세 페이지
data/
  site.json             프로필 · 학력 · 기술 스택 · 논문 정보
  projects.json         프로젝트 카드 (page 가 있으면 "자세히 보기" 노출)
  learning.json         학습 기록 타임라인
  blog.json             블로그 주제 분류 규칙 · 추천 글
  posts.json            velog 글 목록 (자동 생성 — 직접 수정하지 않음)
assets/docs/thesis.pdf  졸업논문 최종본을 이 이름으로 넣으면 버튼이 자동으로 나타남
scripts/sync-velog.mjs  velog → data/posts.json 동기화
```

## 자주 하는 작업

**velog 글 반영** — 자동입니다. `.github/workflows/sync-velog.yml`이 매일 새벽 3시(KST)에 글 목록을 받아,
바뀐 게 있으면 `github-actions[bot]`이 `data/posts.json`을 커밋합니다(그러면 Pages가 자동으로 다시 배포됨).

- 바로 반영하고 싶으면: GitHub 저장소 → **Actions → Sync velog posts → Run workflow**
- 봇이 커밋을 올리므로, 로컬에서 작업하기 전에는 `git pull`을 먼저 해 주세요.
- 로컬에서 직접 돌려 볼 수도 있습니다 (Node 18 이상): `node scripts/sync-velog.mjs`

- 주제 분류는 `data/blog.json`의 `topics`(시리즈 이름 · 태그 기준), 추천 글은 `featured`(글 주소의 slug)로 정합니다.
- RSS는 최근 20개만 주기 때문에 velog 공개 GraphQL API로 전체를 받습니다.

**프로젝트 추가** — `data/projects.json`에 항목을 추가하고, 상세 페이지가 필요하면 `projects/<slug>/index.html`을 만듭니다.
기존 상세 페이지(`projects/devshop/`)를 복사해 쓰면 공통 스타일(`assets/css/project.css`)과 갤러리(`assets/js/gallery.js`)가 그대로 적용됩니다.

## 로컬 미리보기

`fetch`로 JSON을 읽기 때문에 파일을 직접 열면 동작하지 않습니다. 간단한 서버로 띄워 주세요.

```bash
python -m http.server 8000
# http://localhost:8000
```
