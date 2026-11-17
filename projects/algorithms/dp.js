// 동적 계획법 — 조약돌 놓기 / 행렬 경로 최소합을 표를 채우는 과정으로 시각화
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var rnd = function (lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); };

  // 단계 재생 공용 컨트롤러
  function Stepper(ids, build, render) {
    var s = { frames: [], idx: 0, timer: null };
    var stop = function () { if (s.timer) clearInterval(s.timer); s.timer = null; $(ids.play).textContent = '▶ 재생'; };
    var show = function () { render(s.frames[s.idx], s.idx, s.frames.length); };
    s.reset = function () { stop(); s.frames = build(); s.idx = 0; show(); };
    $(ids.prev).addEventListener('click', function () { stop(); s.idx = Math.max(0, s.idx - 1); show(); });
    $(ids.next).addEventListener('click', function () { stop(); s.idx = Math.min(s.frames.length - 1, s.idx + 1); show(); });
    $(ids.play).addEventListener('click', function () {
      if (s.timer) return stop();
      if (s.idx >= s.frames.length - 1) s.idx = 0;
      $(ids.play).textContent = '❚❚ 정지';
      s.timer = setInterval(function () {
        if (s.idx >= s.frames.length - 1) return stop();
        s.idx++; show();
      }, 450);
    });
    $(ids.renew).addEventListener('click', function () { ids.onNew(); s.reset(); });
    return s;
  }

  // ================= 조약돌 놓기 =================
  // 패턴(행 0=위, 1=가운데, 2=아래): 1 위, 2 가운데, 3 아래, 4 위+아래  — 교재 정의
  var PAT = [[0], [1], [2], [0, 2]];
  var GLYPH = ['●○○', '○●○', '○○●', '●○●'];
  var compatible = function (p, q) { return PAT[p].every(function (r) { return PAT[q].indexOf(r) === -1; }); };
  var N = 6, W = [];
  var pw = function (col, p) { return PAT[p].reduce(function (s, r) { return s + W[r][col]; }, 0); };

  function newPebble() {
    W = [0, 1, 2].map(function () { var row = []; for (var i = 0; i < N; i++) row.push(rnd(-8, 15)); return row; });
  }

  function buildPebble() {
    var peb = [], frames = [];
    var snap = function (o) { o.peb = peb.map(function (c) { return c.slice(); }); frames.push(o); };
    snap({ msg: '열마다 4가지 패턴의 최대 합 peb[i][p] 를 왼쪽부터 채웁니다.' });
    for (var i = 0; i < N; i++) {
      peb.push([null, null, null, null]);
      for (var p = 0; p < 4; p++) {
        if (i === 0) {
          peb[i][p] = pw(0, p);
          snap({ cur: [i, p], refs: [], msg: 'peb[1][' + (p + 1) + '] = w = ' + peb[i][p] });
        } else {
          var best = -Infinity, bq = -1, refs = [];
          for (var q = 0; q < 4; q++) if (compatible(p, q)) { refs.push([i - 1, q]); if (peb[i - 1][q] > best) { best = peb[i - 1][q]; bq = q; } }
          peb[i][p] = pw(i, p) + best;
          snap({ cur: [i, p], refs: refs, msg: 'peb[' + (i + 1) + '][' + (p + 1) + '] = w(' + pw(i, p) + ') + max(양립 패턴 ' + refs.map(function (r) { return r[1] + 1; }).join(',') + ') ' + best + ' = ' + peb[i][p] });
        }
      }
    }
    // 역추적
    var last = peb[N - 1], bp = last.indexOf(Math.max.apply(null, last)), picks = [];
    for (var c = N - 1; c >= 0; c--) {
      picks.unshift([c, bp]);
      if (c === 0) break;
      var need = peb[c][bp] - pw(c, bp);
      for (var q2 = 0; q2 < 4; q2++) if (compatible(bp, q2) && peb[c - 1][q2] === need) { bp = q2; break; }
    }
    snap({ picks: picks, msg: '최대 합 = ' + Math.max.apply(null, last) + ' · 역추적으로 고른 패턴: ' + picks.map(function (x) { return x[1] + 1; }).join(' → ') });
    return frames;
  }

  function renderPebble(f, idx, len) {
    var pickCol = {};
    (f.picks || []).forEach(function (x) { pickCol[x[0]] = x[1]; });
    // 가치 표 (선택된 조약돌 표시)
    var h = '<tr><th></th>';
    for (var i = 0; i < N; i++) h += '<th>' + (i + 1) + '열</th>';
    h += '</tr>';
    ['위', '가운데', '아래'].forEach(function (name, r) {
      h += '<tr><th>' + name + '</th>';
      for (var c = 0; c < N; c++) {
        var on = pickCol[c] != null && PAT[pickCol[c]].indexOf(r) !== -1;
        h += '<td class="' + (on ? 'peb pick' : '') + '">' + W[r][c] + '</td>';
      }
      h += '</tr>';
    });
    $('pebW').innerHTML = h;
    // DP 표
    var t = '<tr><th>패턴</th>';
    for (var i2 = 0; i2 < N; i2++) t += '<th>peb[' + (i2 + 1) + ']</th>';
    t += '</tr>';
    for (var p = 0; p < 4; p++) {
      t += '<tr><th title="패턴 ' + (p + 1) + '">' + (p + 1) + ' ' + GLYPH[p] + '</th>';
      for (var c2 = 0; c2 < N; c2++) {
        var v = f.peb[c2] ? f.peb[c2][p] : null, cls = [];
        if (f.cur && f.cur[0] === c2 && f.cur[1] === p) cls.push('cur');
        if (f.refs && f.refs.some(function (r) { return r[0] === c2 && r[1] === p; })) cls.push('ref');
        if (pickCol[c2] === p) cls.push('pick');
        if (v == null) cls.push('empty');
        t += '<td class="' + cls.join(' ') + '">' + (v == null ? '·' : v) + '</td>';
      }
      t += '</tr>';
    }
    $('pebT').innerHTML = t;
    $('pebMsg').textContent = f.msg;
    $('pebInfo').textContent = '단계 ' + idx + '/' + (len - 1);
  }

  newPebble();
  Stepper({ prev: 'pPrev', next: 'pNext', play: 'pPlay', renew: 'pNew', onNew: newPebble }, buildPebble, renderPebble).reset();

  // ================= 행렬 경로 =================
  var M = 5, MAT = [];
  function newMatrix() {
    MAT = [];
    for (var i = 0; i < M; i++) { var row = []; for (var j = 0; j < M; j++) row.push(rnd(1, 9)); MAT.push(row); }
  }
  function buildMatrix() {
    var c = MAT.map(function (r) { return r.map(function () { return null; }); }), frames = [];
    var snap = function (o) { o.c = c.map(function (r) { return r.slice(); }); frames.push(o); };
    snap({ msg: '왼쪽 위부터 한 칸씩 최소합 c[i][j] 를 채웁니다. (원본의 재귀는 같은 칸을 반복 계산 → 표에 저장)' });
    for (var i = 0; i < M; i++) for (var j = 0; j < M; j++) {
      var refs = [], best;
      if (i === 0 && j === 0) best = 0;
      else if (i === 0) { best = c[0][j - 1]; refs.push([0, j - 1]); }
      else if (j === 0) { best = c[i - 1][0]; refs.push([i - 1, 0]); }
      else { best = Math.min(c[i - 1][j], c[i][j - 1]); refs.push([i - 1, j], [i, j - 1]); }
      c[i][j] = MAT[i][j] + best;
      snap({ cur: [i, j], refs: refs, msg: 'c[' + (i + 1) + '][' + (j + 1) + '] = ' + MAT[i][j] + (refs.length ? ' + min(' + refs.map(function (r) { return c[r[0]][r[1]]; }).join(', ') + ')' : '') + ' = ' + c[i][j] });
    }
    var path = [[M - 1, M - 1]], a = M - 1, b = M - 1;
    while (a > 0 || b > 0) {
      if (a === 0) b--; else if (b === 0) a--; else if (c[a - 1][b] <= c[a][b - 1]) a--; else b--;
      path.unshift([a, b]);
    }
    snap({ path: path, msg: '최소합 = ' + c[M - 1][M - 1] + ' · 경로: ' + path.map(function (q) { return MAT[q[0]][q[1]]; }).join(' → ') + ' · 시간 O(n²)' });
    return frames;
  }
  function renderMatrix(f, idx, len) {
    var onPath = {};
    (f.path || []).forEach(function (q) { onPath[q[0] + ',' + q[1]] = 1; });
    var h = '';
    for (var i = 0; i < M; i++) {
      h += '<tr>';
      for (var j = 0; j < M; j++) {
        var cls = [];
        if (f.cur && f.cur[0] === i && f.cur[1] === j) cls.push('cur');
        if (f.refs && f.refs.some(function (r) { return r[0] === i && r[1] === j; })) cls.push('ref');
        if (onPath[i + ',' + j]) cls.push('pick');
        h += '<td class="' + cls.join(' ') + '">' + MAT[i][j] + '<small>' + (f.c[i][j] == null ? '&nbsp;' : 'c=' + f.c[i][j]) + '</small></td>';
      }
      h += '</tr>';
    }
    $('matT').innerHTML = h;
    $('matMsg').textContent = f.msg;
    $('matInfo').textContent = '단계 ' + idx + '/' + (len - 1);
  }

  newMatrix();
  Stepper({ prev: 'mPrev', next: 'mNext', play: 'mPlay', renew: 'mNew', onNew: newMatrix }, buildMatrix, renderMatrix).reset();
})();
