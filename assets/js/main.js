// 데이터(JSON) 기반 렌더링. 내용 수정은 data/*.json 에서 한다.
(function () {
  'use strict';

  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var $ = function (id) { return document.getElementById(id); };
  var getJSON = function (url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(url + ' ' + r.status);
      return r.json();
    });
  };
  var exists = function (url) {
    return fetch(url, { method: 'HEAD', cache: 'no-cache' })
      .then(function (r) { return r.ok; })
      .catch(function () { return false; });
  };
  var chips = function (list) {
    return '<div class="chips">' + (list || []).map(function (t) {
      return '<span class="chip">' + esc(t) + '</span>';
    }).join('') + '</div>';
  };
  var ext = function (href, label, cls) {
    return '<a class="btn small ' + (cls || '') + '" href="' + esc(href) + '" target="_blank" rel="noopener">' + esc(label) + '</a>';
  };

  function renderSite(s) {
    document.querySelectorAll('[data-bind]').forEach(function (el) {
      el.textContent = s[el.dataset.bind] || '';
    });
    $('ghLink').href = s.links.github;
    $('velogLink').href = s.links.velog;
    $('velogMore').href = s.links.velog;
    var emails = s.links.email || [];
    if (emails.length) $('mailLink').href = 'mailto:' + emails[0];
    else $('mailLink').hidden = true;
    $('footerLinks').innerHTML =
      emails.map(function (m) {
        return '<a href="mailto:' + esc(m) + '">' + esc(m) + '</a>';
      }).join('') +
      '<a href="' + esc(s.links.github) + '" target="_blank" rel="noopener">GitHub</a>' +
      '<a href="' + esc(s.links.velog) + '" target="_blank" rel="noopener">velog</a>';

    var badges = [];
    s.education.forEach(function (e) {
      badges.push('<span class="badge">' + esc(e.school + ' ' + e.major) + '</span>');
      if (e.minor) badges.push('<span class="badge accent">' + esc(e.minor) + '</span>');
    });
    $('eduBadges').innerHTML = badges.join('');

    $('eduList').innerHTML = s.education.map(function (e) {
      return '<div class="edu"><strong>' + esc(e.school) + '</strong>' +
        '<span>' + esc(e.major) + '</span>' +
        (e.minor ? ' · <span class="minor">' + esc(e.minor) + '</span>' : '') +
        '<div class="meta">' + esc(e.period) + '</div></div>';
    }).join('');

    $('stack').innerHTML = Object.keys(s.stack).map(function (k) {
      return '<div><h4>' + esc(k) + '</h4>' + chips(s.stack[k]) + '</div>';
    }).join('');

    renderThesis(s.thesis);
  }

  function renderThesis(t) {
    $('thesisTitle').textContent = t.title;
    $('thesisTitleEn').textContent = t.titleEn;
    $('thesisSummary').textContent = t.summary;
    $('thesisMetrics').innerHTML = (t.metrics || []).map(function (m) {
      return '<div class="metric"><b>' + esc(m.value) + '</b><span>' + esc(m.label) + '</span></div>';
    }).join('');

    var projectBtn = t.project
      ? '<a class="btn small" href="#project-' + esc(t.project) + '">관련 프로젝트</a>'
      : '';
    // PDF 파일이 실제로 있을 때만 버튼 노출 (assets/docs/README.md 참고)
    exists(t.pdf).then(function (ok) {
      $('thesisActions').innerHTML = ok
        ? ext(t.pdf, '논문 PDF 보기', 'primary') +
          '<a class="btn small" href="' + esc(t.pdf) + '" download>다운로드</a>' + projectBtn
        : '<span class="pending">📄 최종 제출본 공개 예정</span>' + projectBtn;
    });
  }

  function projectLinks(p) {
    var out = '';
    if (p.page) out += '<a class="btn small primary" href="' + esc(p.page) + '">자세히 보기</a>';
    if (p.demo) out += ext(p.demo, '데모');
    if (p.repo) out += ext(p.repo, 'GitHub');
    return out ? '<div class="card-actions">' + out + '</div>' : '';
  }

  function renderProjects(list) {
    var featured = list.filter(function (p) { return p.featured; });
    var rest = list.filter(function (p) { return !p.featured; });

    $('featured').innerHTML = featured.map(function (p) {
      return '<article class="card featured' + (p.image ? ' has-image' : '') + '" id="project-' + esc(p.slug) + '">' +
        '<div><span class="label">대표 프로젝트 · ' + esc(p.type) + '</span>' +
        '<h3>' + esc(p.title) + '</h3><div class="meta">' + esc(p.period) + '</div>' +
        '<p>' + esc(p.summary) + '</p>' +
        (p.highlights && p.highlights.length
          ? '<ul>' + p.highlights.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ul>'
          : '') +
        chips(p.tags) + projectLinks(p) + '</div>' +
        (p.image ? '<img class="thumb" src="' + esc(p.image) + '" alt="' + esc(p.title) + ' 화면" loading="lazy">' : '') +
        '</article>';
    }).join('');

    $('projectGrid').innerHTML = rest.map(function (p) {
      return '<article class="card p-card" id="project-' + esc(p.slug) + '">' +
        (p.image ? '<img class="thumb" src="' + esc(p.image) + '" alt="" loading="lazy">' : '') +
        '<div class="meta">' + esc(p.type) + ' · ' + esc(p.period) + '</div>' +
        '<h3>' + esc(p.title) + '</h3><p>' + esc(p.summary) + '</p>' +
        chips(p.tags) + projectLinks(p) + '</article>';
    }).join('');
  }

  function renderLearning(l) {
    if (!l || !l.items || !l.items.length) return;
    $('learning').hidden = false;
    $('learningTitle').textContent = l.title || '학습 기록';
    $('learningIntro').textContent = l.intro || '';
    var max = Math.max.apply(null, l.items.map(function (i) { return i.commits || 0; }));
    $('learningList').innerHTML = l.items.map(function (i) {
      var w = max ? Math.max(4, Math.round((i.commits || 0) / max * 100)) : 0;
      return '<li><span class="t-when">' + esc(i.period) + '</span>' +
        '<a class="t-body" href="' + esc(i.repo) + '" target="_blank" rel="noopener">' +
        '<b>' + esc(i.title) + '</b><span class="muted">' + esc(i.desc) + '</span>' +
        '<span class="t-commits"><i style="width:' + w + '%"></i><em>' + esc(i.commits) + ' commits</em></span>' +
        '</a></li>';
    }).join('');
    if (l.more) $('learningMore').textContent = l.more.label + ': ' + l.more.text;
  }

  function renderPosts(posts) {
    if (!posts || !posts.length) return; // 글이 없으면 섹션 숨김 유지
    $('blog').hidden = false;
    $('postGrid').innerHTML = posts.slice(0, 6).map(function (p) {
      return '<a class="card p-card post" href="' + esc(p.link) + '" target="_blank" rel="noopener">' +
        '<div class="meta">' + esc(p.date) + '</div><h3>' + esc(p.title) + '</h3>' +
        (p.summary ? '<p class="muted">' + esc(p.summary) + '</p>' : '') +
        chips(p.tags) + '</a>';
    }).join('');
  }

  Promise.all([getJSON('data/site.json'), getJSON('data/projects.json')])
    .then(function (r) { renderSite(r[0]); renderProjects(r[1]); })
    .catch(function (e) { console.error(e); });
  getJSON('data/posts.json').then(renderPosts).catch(function () {});
  getJSON('data/learning.json').then(renderLearning).catch(function () {});

  // 블로그 섹션이 숨겨져 있으면 메뉴 링크도 숨김
  var blogLink = document.querySelector('[data-section-link="blog"]');
  new MutationObserver(function () { blogLink.hidden = $('blog').hidden; })
    .observe($('blog'), { attributes: true, attributeFilter: ['hidden'] });
  blogLink.hidden = true;
})();
