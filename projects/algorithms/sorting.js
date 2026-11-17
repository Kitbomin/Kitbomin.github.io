// 정렬 시각화 — 원본 SortAnimation.pde 의 "단계마다 배열 상태를 저장해 두고 재생" 구조를 유지
(function () {
  'use strict';

  var ALGOS = [
    { id: 'selection', name: '선택 정렬', big: 'O(n²)' },
    { id: 'bubble', name: '버블 정렬', big: 'O(n²)' },
    { id: 'insertion', name: '삽입 정렬', big: 'O(n²)' },
    { id: 'merge', name: '병합 정렬', big: 'O(n log n)' },
    { id: 'quick', name: '퀵 정렬', big: '평균 O(n log n)' },
    { id: 'heap', name: '힙 정렬', big: 'O(n log n)' }
  ];

  // ---------- 프레임 기록 ----------
  // frame = { a: 배열 복사본, c: 비교 인덱스, s: 교환/쓰기 인덱스, p: 피벗, d: 확정 인덱스, r: [lo,hi], msg, cmp, swp }
  function record(algo, src) {
    var a = src.slice(), n = a.length, frames = [], cmp = 0, swp = 0, done = {};
    var push = function (o) {
      o = o || {};
      frames.push({
        a: a.slice(), c: o.c || [], s: o.s || [], p: o.p == null ? -1 : o.p,
        d: Object.keys(done).map(Number), r: o.r || null, msg: o.msg || '', cmp: cmp, swp: swp
      });
    };
    var swap = function (i, j) { var t = a[i]; a[i] = a[j]; a[j] = t; swp++; };
    var all = function () { for (var k = 0; k < n; k++) done[k] = 1; };

    push({ msg: '초기 배열' });

    if (algo === 'selection') {
      // 원본과 같이: 남은 구간의 최댓값을 찾아 맨 뒤로
      for (var end = n - 1; end > 0; end--) {
        var mx = 0;
        for (var j = 1; j <= end; j++) {
          cmp++;
          if (a[j] > a[mx]) mx = j;
          push({ c: [j, mx], r: [0, end], msg: '최댓값 탐색: 현재 최대 a[' + mx + ']=' + a[mx] });
        }
        swap(mx, end); done[end] = 1;
        push({ s: [mx, end], msg: '최댓값 ' + a[end] + ' 을(를) ' + end + '번 자리로' });
      }
    } else if (algo === 'bubble') {
      for (var i = 0; i < n - 1; i++) {
        var swapped = false;
        for (var k = 0; k < n - i - 1; k++) {
          cmp++;
          push({ c: [k, k + 1], r: [0, n - i - 1], msg: a[k] + ' 와 ' + a[k + 1] + ' 비교' });
          if (a[k] > a[k + 1]) { swap(k, k + 1); swapped = true; push({ s: [k, k + 1], msg: '교환' }); }
        }
        done[n - i - 1] = 1;
        if (!swapped) { push({ msg: '교환이 없으므로 조기 종료' }); break; }
      }
    } else if (algo === 'insertion') {
      for (var i2 = 1; i2 < n; i2++) {
        var key = a[i2], j2 = i2 - 1;
        push({ c: [i2], r: [0, i2], msg: 'key = ' + key + ' 를 앞쪽 정렬 구간에 삽입' });
        while (j2 >= 0) {
          cmp++;
          push({ c: [j2, j2 + 1], r: [0, i2], msg: a[j2] + ' > ' + key + ' ?' });
          if (a[j2] <= key) break;
          a[j2 + 1] = a[j2]; swp++;
          push({ s: [j2 + 1], r: [0, i2], msg: a[j2] + ' 를 오른쪽으로 이동' });
          j2--;
        }
        a[j2 + 1] = key;
        push({ s: [j2 + 1], r: [0, i2], msg: key + ' 를 ' + (j2 + 1) + '번 자리에 삽입' });
      }
    } else if (algo === 'merge') {
      var tmp = new Array(n);
      var ms = function (lo, hi) {
        if (lo >= hi) return;
        var mid = (lo + hi) >> 1;
        push({ r: [lo, hi], msg: '분할 [' + lo + '..' + hi + '] → [' + lo + '..' + mid + '] + [' + (mid + 1) + '..' + hi + ']' });
        ms(lo, mid); ms(mid + 1, hi);
        for (var t = lo; t <= hi; t++) tmp[t] = a[t];
        var p = lo, q = mid + 1, w = lo;
        while (p <= mid && q <= hi) {
          cmp++;
          a[w] = tmp[p] <= tmp[q] ? tmp[p++] : tmp[q++]; swp++;
          push({ s: [w], r: [lo, hi], msg: '병합 [' + lo + '..' + hi + ']: ' + a[w] + ' 기록' });
          w++;
        }
        while (p <= mid) { a[w] = tmp[p++]; swp++; push({ s: [w], r: [lo, hi], msg: '왼쪽 나머지 기록' }); w++; }
        while (q <= hi) { a[w] = tmp[q++]; swp++; push({ s: [w], r: [lo, hi], msg: '오른쪽 나머지 기록' }); w++; }
      };
      ms(0, n - 1);
    } else if (algo === 'quick') {
      // 원본 quick_sorting.pde 와 같은 Lomuto 분할 (피벗 = 마지막 원소)
      var qs = function (lo, hi) {
        if (lo > hi) return;
        if (lo === hi) { done[lo] = 1; return; }
        var pivot = a[hi], i3 = lo - 1;
        push({ p: hi, r: [lo, hi], msg: '피벗 ' + pivot + ' 로 [' + lo + '..' + hi + '] 분할' });
        for (var j3 = lo; j3 < hi; j3++) {
          cmp++;
          push({ c: [j3], p: hi, r: [lo, hi], msg: a[j3] + ' < ' + pivot + ' ?' });
          if (a[j3] < pivot) { i3++; if (i3 !== j3) { swap(i3, j3); push({ s: [i3, j3], p: hi, r: [lo, hi], msg: '작은 값을 앞으로' }); } }
        }
        swap(i3 + 1, hi); done[i3 + 1] = 1;
        push({ s: [i3 + 1, hi], r: [lo, hi], msg: '피벗 ' + pivot + ' 확정 → ' + (i3 + 1) + '번 자리' });
        qs(lo, i3); qs(i3 + 2, hi);
      };
      qs(0, n - 1);
    } else if (algo === 'heap') {
      var sift = function (i4, size) {
        while (true) {
          var l = 2 * i4 + 1, r = l + 1, big = i4;
          if (l < size) { cmp++; if (a[l] > a[big]) big = l; }
          if (r < size) { cmp++; if (a[r] > a[big]) big = r; }
          push({ c: [i4, l < size ? l : i4, r < size ? r : i4], r: [0, size - 1], msg: 'sift-down: a[' + i4 + ']=' + a[i4] + ' 과 자식 비교' });
          if (big === i4) return;
          swap(i4, big); push({ s: [i4, big], r: [0, size - 1], msg: '더 큰 자식과 교환' });
          i4 = big;
        }
      };
      for (var b = (n >> 1) - 1; b >= 0; b--) sift(b, n);
      push({ msg: '최대 힙 구성 완료 — 루트가 최댓값' });
      for (var e = n - 1; e > 0; e--) {
        swap(0, e); done[e] = 1;
        push({ s: [0, e], msg: '루트(최댓값) ' + a[e] + ' 를 ' + e + '번 자리로' });
        sift(0, e);
      }
    }

    all();
    push({ msg: '정렬 완료 · 비교 ' + cmp + '회 · 교환/쓰기 ' + swp + '회' });
    return frames;
  }

  // ---------- 상태 ----------
  var $ = function (id) { return document.getElementById(id); };
  var algoIdx = 0, size = 16, base = [], frames = [], idx = 0, playing = false, speed = 6, acc = 0;

  function shuffle() {
    base = [];
    for (var i = 0; i < size; i++) base.push(5 + Math.floor(Math.random() * 95));
  }
  function rebuild() {
    frames = record(ALGOS[algoIdx].id, base);
    idx = 0;
    $('sortScrub').max = frames.length - 1;
    $('sortTitle').textContent = ALGOS[algoIdx].name + ' · ' + ALGOS[algoIdx].big;
    document.querySelectorAll('#algoBtns button').forEach(function (b, i) { b.setAttribute('aria-pressed', i === algoIdx); });
    syncUI();
  }
  function syncUI() {
    var f = frames[idx];
    $('sortScrub').value = idx;
    $('sortMsg').textContent = f.msg;
    $('sortStats').textContent = '단계 ' + idx + '/' + (frames.length - 1) + ' · 비교 ' + f.cmp + ' · 교환/쓰기 ' + f.swp;
  }
  function setPlaying(v) {
    playing = v;
    if (playing && idx >= frames.length - 1) idx = 0;
    $('sPlay').textContent = playing ? '❚❚ 정지' : '▶ 재생';
  }
  function step(d) {
    idx = Math.max(0, Math.min(frames.length - 1, idx + d));
    syncUI();
  }
  function selectAlgo(i) {
    algoIdx = (i + ALGOS.length) % ALGOS.length;
    setPlaying(false);
    rebuild();
  }

  $('algoBtns').innerHTML = ALGOS.map(function (a, i) {
    return '<button type="button" data-i="' + i + '">' + a.name + '</button>';
  }).join('');
  document.querySelectorAll('#algoBtns button').forEach(function (b) {
    b.addEventListener('click', function () { selectAlgo(+b.dataset.i); });
  });
  $('sPlay').addEventListener('click', function () { setPlaying(!playing); });
  $('sPrev').addEventListener('click', function () { setPlaying(false); step(-1); });
  $('sNext').addEventListener('click', function () { setPlaying(false); step(1); });
  $('sShuffle').addEventListener('click', function () { shuffle(); setPlaying(false); rebuild(); });
  $('sSpeed').addEventListener('input', function (e) { speed = +e.target.value; });
  $('sSize').addEventListener('input', function (e) {
    size = +e.target.value; $('sSizeVal').textContent = size;
    shuffle(); setPlaying(false); rebuild();
  });
  $('sortScrub').addEventListener('input', function (e) { setPlaying(false); idx = +e.target.value; syncUI(); });

  // 원본 단축키: space 재생/정지, ←/→ 단계, z/x 알고리즘 변경, a/s 속도
  document.addEventListener('keydown', function (e) {
    if ($('panel-sort').hidden || /INPUT|TEXTAREA/.test(document.activeElement.tagName) && document.activeElement.type !== 'range') return;
    var k = e.key;
    if (k === ' ') { e.preventDefault(); setPlaying(!playing); }
    else if (k === 'ArrowLeft') { setPlaying(false); step(-1); }
    else if (k === 'ArrowRight') { setPlaying(false); step(1); }
    else if (k === 'z') selectAlgo(algoIdx - 1);
    else if (k === 'x') selectAlgo(algoIdx + 1);
    else if (k === 'a') { speed = Math.min(10, speed + 1); $('sSpeed').value = speed; }
    else if (k === 's') { speed = Math.max(1, speed - 1); $('sSpeed').value = speed; }
  });

  shuffle();
  rebuild();

  // ---------- 그리기 (p5 instance mode) ----------
  new p5(function (p) {
    var box = $('sortCanvas');
    var css = function (name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); };
    var H = 320;

    p.setup = function () {
      p.createCanvas(Math.max(280, box.clientWidth), H).parent(box);
      p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
      p.textFont('Pretendard Variable, sans-serif');
    };
    p.windowResized = function () {
      if (box.clientWidth > 0) p.resizeCanvas(Math.max(280, box.clientWidth), H);
    };
    p.draw = function () {
      if (playing) {
        // 속도 1~10 → 초당 약 2~60 프레임 진행
        acc += Math.pow(1.5, speed) * 1.05 * p.deltaTime / 1000;
        while (acc >= 1) { acc -= 1; if (idx < frames.length - 1) idx++; else { setPlaying(false); break; } }
        syncUI();
      }
      var f = frames[idx], n = f.a.length;
      var col = {
        bg: css('--bg'), bar: css('--muted'), cmp: css('--spk0'), swp: css('--spk1'),
        piv: css('--spk3'), done: css('--spk2'), text: css('--text'), line: css('--line')
      };
      p.background(col.bg);
      var pad = 12, top = 18, bottom = 26, gap = n > 32 ? 2 : 4;
      var w = (p.width - pad * 2) / n, hMax = p.height - top - bottom;
      var isDone = {}; f.d.forEach(function (i) { isDone[i] = 1; });
      var isC = {}; f.c.forEach(function (i) { isC[i] = 1; });
      var isS = {}; f.s.forEach(function (i) { isS[i] = 1; });

      // 현재 작업 구간 표시
      if (f.r) {
        p.noStroke(); p.fill(col.line);
        p.rect(pad + f.r[0] * w, p.height - bottom + 6, (f.r[1] - f.r[0] + 1) * w - gap, 4, 2);
      }
      for (var i = 0; i < n; i++) {
        var h = f.a[i] / 100 * hMax;
        var c = col.bar, alpha = 255;
        if (isDone[i]) c = col.done;
        if (isC[i]) c = col.cmp;
        if (i === f.p) c = col.piv;
        if (isS[i]) c = col.swp;
        if (f.r && (i < f.r[0] || i > f.r[1]) && !isDone[i]) alpha = 90;
        var cc = p.color(c); cc.setAlpha(alpha);
        p.noStroke(); p.fill(cc);
        p.rect(pad + i * w, p.height - bottom - h, w - gap, h, 3, 3, 0, 0);
        if (n <= 24) {
          p.fill(col.text); p.textAlign(p.CENTER, p.BOTTOM); p.textSize(11);
          p.text(f.a[i], pad + i * w + (w - gap) / 2, p.height - bottom - h - 3);
        }
      }
    };
  });
})();
