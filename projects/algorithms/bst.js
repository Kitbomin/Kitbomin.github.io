// 이진 탐색 트리 — 원본 BinarySearchTree.pde 의 삽입/삭제(클릭)·위치 계산 방식을 유지하고 순회 3종 구현
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };

  // ---------- 자료구조 ----------
  function Node(v) { this.val = v; this.left = null; this.right = null; this.x = 0; this.y = 0; }
  var root = null;

  function insert(v) {
    if (!root) { root = new Node(v); return true; }
    var cur = root;
    while (true) {
      if (v === cur.val) return false; // 중복 무시
      var dir = v < cur.val ? 'left' : 'right';
      if (!cur[dir]) { cur[dir] = new Node(v); return true; }
      cur = cur[dir];
    }
  }
  function minNode(n) { while (n.left) n = n.left; return n; }
  function remove(v, n) {
    if (!n) return null;
    if (v < n.val) n.left = remove(v, n.left);
    else if (v > n.val) n.right = remove(v, n.right);
    else if (n.left && n.right) { n.val = minNode(n.right).val; n.right = remove(n.val, n.right); }
    else n = n.left || n.right;
    return n;
  }
  function contains(v) { var c = root; while (c) { if (v === c.val) return true; c = v < c.val ? c.left : c.right; } return false; }
  function searchPath(v) { var path = [], c = root; while (c) { path.push(c); if (v === c.val) break; c = v < c.val ? c.left : c.right; } return path; }
  function height(n) { return n ? 1 + Math.max(height(n.left), height(n.right)) : -1; }
  function count(n) { return n ? 1 + count(n.left) + count(n.right) : 0; }
  // 원본 assignPosition: 깊이 d 에서 좌우로 1/2^(d+1) 씩 벌림
  function assign(n, dx, d) {
    if (!n) return;
    assign(n.left, dx - 1 / Math.pow(2, d + 1), d + 1);
    n.x = dx; n.y = d;
    assign(n.right, dx + 1 / Math.pow(2, d + 1), d + 1);
  }
  function traverse(kind) {
    var out = [];
    (function go(n) {
      if (!n) return;
      if (kind === 'pre') out.push(n);
      go(n.left);
      if (kind === 'in') out.push(n);
      go(n.right);
      if (kind === 'post') out.push(n);
    })(root);
    return out;
  }
  function newTree() {
    root = null;
    var k = 0;
    while (count(root) < 9 && k++ < 100) insert(Math.floor(Math.random() * 99));
  }

  // ---------- 애니메이션 상태 ----------
  var order = [], shown = 0, travTimer = null, hover = null, flash = null, travName = '';
  var NAMES = { in: '중위 순회 (L → 루트 → R) · 오름차순', pre: '전위 순회 (루트 → L → R)', post: '후위 순회 (L → R → 루트)' };

  function stopTrav() { if (travTimer) clearInterval(travTimer); travTimer = null; order = []; shown = 0; $('travOut').textContent = ''; }
  function info() { $('bstInfo').textContent = '노드 ' + count(root) + '개 · 높이 ' + Math.max(0, height(root)); }
  function msg(t) { $('bstMsg').textContent = t; }
  function flashNodes(nodes, color) { flash = { nodes: nodes, color: color, until: Date.now() + 1400 }; }

  function doInsert(v) {
    if (isNaN(v) || v < 0 || v > 99) { msg('0–99 사이의 값을 입력하세요.'); return; }
    stopTrav();
    if (insert(v)) { msg(v + ' 삽입: 루트부터 크기를 비교하며 내려가 빈 자리에 연결'); flashNodes(searchPath(v), '--spk2'); }
    else msg(v + ' 은(는) 이미 트리에 있습니다.');
    info();
  }
  function doDelete(v) {
    stopTrav();
    if (!contains(v)) { msg(v + ' 은(는) 트리에 없습니다.'); return; }
    var n = searchPath(v).pop();
    var kind = n.left && n.right ? '자식이 둘 → 오른쪽 서브트리의 최솟값으로 대체' : (n.left || n.right ? '자식이 하나 → 자식을 끌어올림' : '리프 노드 → 그대로 제거');
    root = remove(v, root);
    msg(v + ' 삭제: ' + kind);
    info();
  }
  function doFind(v) {
    stopTrav();
    var path = searchPath(v), found = path.length && path[path.length - 1].val === v;
    flashNodes(path, found ? '--spk2' : '--spk1');
    msg(v + (found ? ' 탐색 성공: ' : ' 탐색 실패: ') + path.map(function (n) { return n.val; }).join(' → ') + ' (' + path.length + '번 비교)');
  }

  $('bstIns').addEventListener('click', function () { doInsert(parseInt($('bstVal').value, 10)); });
  $('bstDel').addEventListener('click', function () { doDelete(parseInt($('bstVal').value, 10)); });
  $('bstFind').addEventListener('click', function () { doFind(parseInt($('bstVal').value, 10)); });
  $('bstVal').addEventListener('keydown', function (e) { if (e.key === 'Enter') doInsert(parseInt(e.target.value, 10)); });
  $('bstNew').addEventListener('click', function () { stopTrav(); newTree(); info(); msg('무작위 값으로 새 트리를 만들었습니다.'); });
  $('bstClear').addEventListener('click', function () { stopTrav(); root = null; info(); msg('트리를 비웠습니다.'); });
  document.querySelectorAll('[data-trav]').forEach(function (b) {
    b.addEventListener('click', function () {
      stopTrav();
      if (!root) { msg('트리가 비어 있습니다.'); return; }
      travName = b.dataset.trav;
      order = traverse(travName); shown = 0;
      msg(NAMES[travName]);
      travTimer = setInterval(function () {
        shown++;
        $('travOut').textContent = order.slice(0, shown).map(function (n) { return n.val; }).join(' → ');
        if (shown >= order.length) { clearInterval(travTimer); travTimer = null; }
      }, 550);
    });
  });

  newTree(); info();

  // ---------- 그리기 ----------
  new p5(function (p) {
    var box = $('bstCanvas');
    var css = function (n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); };
    var H = 380, R = 30;
    var pos = function (n) {
      var xstep = (p.width - R * 2) / 2, ystep = Math.min(60, (p.height - R * 2) / Math.max(1, height(root)));
      return { x: p.width / 2 + n.x * xstep, y: R + 6 + n.y * ystep };
    };
    var forEach = function (n, fn) { if (!n) return; forEach(n.left, fn); fn(n); forEach(n.right, fn); };
    var hit = function (mx, my) {
      var found = null;
      forEach(root, function (n) { var q = pos(n); if ((mx - q.x) * (mx - q.x) + (my - q.y) * (my - q.y) < (R / 2 + 4) * (R / 2 + 4)) found = n; });
      return found;
    };

    p.setup = function () {
      p.createCanvas(Math.max(280, box.clientWidth), H).parent(box);
      p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
      p.textFont('Pretendard Variable, sans-serif');
    };
    p.windowResized = function () { if (box.clientWidth > 0) p.resizeCanvas(Math.max(280, box.clientWidth), H); };

    var inside = function () { return p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height; };
    p.mouseMoved = function () { hover = inside() ? hit(p.mouseX, p.mouseY) : null; };
    p.mousePressed = function () {
      if ($('panel-bst').hidden || !inside()) return;
      var n = hit(p.mouseX, p.mouseY);
      if (n) doDelete(n.val);
      else doInsert(Math.min(99, Math.max(0, Math.floor(100 * p.mouseX / p.width)))); // 원본: x 위치 → 값
    };

    p.draw = function () {
      var c = { bg: css('--bg'), line: css('--muted'), node: css('--surface'), text: css('--text'), acc: css('--spk0'), muted: css('--muted') };
      p.background(c.bg);
      if (!root) {
        p.fill(c.muted); p.noStroke(); p.textAlign(p.CENTER, p.CENTER); p.textSize(14);
        p.text('빈 트리 — 아무 곳이나 눌러 노드를 삽입하세요', p.width / 2, p.height / 2);
        return;
      }
      assign(root, 0, 0);

      // 간선
      p.stroke(c.line); p.strokeWeight(1.5);
      forEach(root, function (n) {
        var a = pos(n);
        [n.left, n.right].forEach(function (ch) { if (ch) { var b = pos(ch); p.line(a.x, a.y, b.x, b.y); } });
      });

      var visited = {};
      order.slice(0, shown).forEach(function (n, i) { visited[n.val] = i + 1; });
      var flashSet = {};
      if (flash && Date.now() < flash.until) flash.nodes.forEach(function (n) { flashSet[n.val] = 1; });

      // 노드
      forEach(root, function (n) {
        var q = pos(n), fill = c.node, tc = c.text, sw = 1.5, sc = c.line;
        if (flashSet[n.val]) { sc = css(flash.color); sw = 3; }
        if (visited[n.val]) { fill = c.acc; tc = '#fff'; sc = c.acc; }
        if (n === hover) { sw = 3; sc = css('--spk1'); }
        p.stroke(sc); p.strokeWeight(sw); p.fill(fill);
        p.circle(q.x, q.y, R);
        p.noStroke(); p.fill(tc); p.textAlign(p.CENTER, p.CENTER); p.textSize(13); p.textStyle(p.BOLD);
        p.text(n.val, q.x, q.y + 1);
        if (visited[n.val]) {
          p.fill(css('--spk3')); p.circle(q.x + R / 2, q.y - R / 2, 16);
          p.fill('#000'); p.textSize(10); p.text(visited[n.val], q.x + R / 2, q.y - R / 2 + 1);
        }
        p.textStyle(p.NORMAL);
      });

      // 원본처럼 커서 x 위치의 삽입값 미리보기
      if (inside() && !hover) {
        p.noStroke(); p.fill(c.muted); p.textAlign(p.LEFT, p.BOTTOM); p.textSize(12);
        p.text('클릭하면 ' + Math.floor(100 * p.mouseX / p.width) + ' 삽입', 10, p.height - 8);
      } else if (hover) {
        p.noStroke(); p.fill(css('--spk1')); p.textAlign(p.LEFT, p.BOTTOM); p.textSize(12);
        p.text('클릭하면 ' + hover.val + ' 삭제', 10, p.height - 8);
      }
    };
  });
})();
