// result.json(실제 파이프라인 출력)을 음성과 동기화해 재생하는 데모
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var fmt = function (t) {
    t = Math.max(0, t || 0);
    return Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
  };
  var COLORS = ['var(--spk0)', 'var(--spk1)', 'var(--spk2)', 'var(--spk3)'];

  var audio = $('audio');
  var data, total, speakers = [], segEls = [], rowEls = [], taskEls = [], taskSrc = [];

  function speakerLabel(s) {
    var i = speakers.indexOf(s);
    return '화자 ' + String.fromCharCode(65 + i); // SPEAKER_00 → 화자 A
  }

  // 업무 항목의 근거 발화: 담당자 이름과 기한(또는 제목 단어)이 함께 등장하는 첫 발화
  function findSource(item) {
    var keys = [item.assignee, item.due].filter(function (k) { return k && k !== 'null'; });
    var titleWords = String(item.title || '').split(/\s+/);
    var best = -1, bestScore = 0;
    data.transcript.forEach(function (s, i) {
      var score = 0;
      keys.forEach(function (k) { if (s.text.indexOf(k) !== -1) score += 2; });
      titleWords.forEach(function (w) { if (w.length > 1 && s.text.indexOf(w) !== -1) score += 1; });
      if (score > bestScore) { bestScore = score; best = i; }
    });
    return best;
  }

  function seek(t, play) {
    audio.currentTime = t;
    if (play) audio.play();
    update();
  }

  function render() {
    total = data.duration || data.transcript[data.transcript.length - 1].end;
    data.transcript.forEach(function (s) {
      if (speakers.indexOf(s.speaker) === -1) speakers.push(s.speaker);
    });
    speakers.sort();

    $('demoNote').textContent = data.note || '';
    $('dur').textContent = fmt(total);

    $('legend').innerHTML = speakers.map(function (s, i) {
      return '<span><i style="background:' + COLORS[i % 4] + '"></i>' + speakerLabel(s) + '</span>';
    }).join('');

    // 타임라인: 화자별 레인
    var tl = $('timeline');
    var laneH = 56 / speakers.length;
    data.transcript.forEach(function (s) {
      var lane = speakers.indexOf(s.speaker);
      var el = document.createElement('div');
      el.className = 'seg';
      el.style.left = (s.start / total * 100) + '%';
      el.style.width = Math.max(0.6, (s.end - s.start) / total * 100) + '%';
      el.style.top = (lane * laneH + (laneH - 18) / 2) + 'px';
      el.style.background = COLORS[lane % 4];
      tl.appendChild(el);
      segEls.push(el);
    });

    // 전사문
    $('transcript').innerHTML = data.transcript.map(function (s, i) {
      var lane = speakers.indexOf(s.speaker);
      return '<li data-i="' + i + '" style="border-left-color:' + COLORS[lane % 4] + '">' +
        '<span class="ts">' + fmt(s.start) + '</span>' +
        '<span><span class="spk" style="color:' + COLORS[lane % 4] + '">' + speakerLabel(s.speaker) + '</span>' +
        '<span class="txt">' + esc(s.text) + '</span></span></li>';
    }).join('');
    rowEls = Array.prototype.slice.call($('transcript').children);
    rowEls.forEach(function (li) {
      li.addEventListener('click', function () { seek(data.transcript[+li.dataset.i].start + 0.01, true); });
    });

    // 업무 카드
    $('itemCount').textContent = data.action_items.length;
    $('items').innerHTML = data.action_items.map(function (it, i) {
      return '<button type="button" class="task" data-i="' + i + '"><b>' + esc(it.title) + '</b>' +
        '<div class="tmeta">' +
        (it.assignee ? '<span class="who">👤 ' + esc(it.assignee) + '</span>' : '') +
        (it.due ? '<span>📅 ' + esc(it.due) + '</span>' : '') +
        '</div></button>';
    }).join('');
    taskEls = Array.prototype.slice.call($('items').children);
    taskSrc = data.action_items.map(findSource);
    taskEls.forEach(function (el, i) {
      el.addEventListener('click', function () {
        if (taskSrc[i] >= 0) seek(data.transcript[taskSrc[i]].start + 0.01, true);
      });
    });

    // 처리 시간
    var tm = data.timing || {};
    $('timing').innerHTML = [
      [tm.model_load_sec, '모델 로딩'],
      [tm.stt_diarization_sec, 'STT + 화자분리'],
      [tm.action_item_sec, '업무 추출 (LLM)']
    ].map(function (x) {
      return '<div><b>' + esc(x[0]) + 's</b><span>' + esc(x[1]) + '</span></div>';
    }).join('');

    // 타임라인 클릭/드래그로 이동
    var dragging = false;
    var posToTime = function (e) {
      var r = tl.getBoundingClientRect();
      return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * total;
    };
    tl.addEventListener('pointerdown', function (e) { dragging = true; tl.setPointerCapture(e.pointerId); seek(posToTime(e)); });
    tl.addEventListener('pointermove', function (e) { if (dragging) seek(posToTime(e)); });
    tl.addEventListener('pointerup', function () { dragging = false; });
    tl.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') seek(Math.min(total, audio.currentTime + 3));
      if (e.key === 'ArrowLeft') seek(Math.max(0, audio.currentTime - 3));
      if (e.key === ' ') { e.preventDefault(); toggle(); }
    });
  }

  var lastActive = -2;
  function update() {
    var t = audio.currentTime;
    $('cur').textContent = fmt(t);
    $('playhead').style.left = (Math.min(t, total) / total * 100) + '%';

    var active = -1;
    data.transcript.forEach(function (s, i) { if (t >= s.start - 0.05 && t <= s.end + 0.3) active = i; });
    if (active === lastActive) return;
    lastActive = active;

    segEls.forEach(function (el, i) { el.classList.toggle('on', i === active); });
    rowEls.forEach(function (el, i) { el.classList.toggle('on', i === active); });
    taskEls.forEach(function (el, i) { el.classList.toggle('on', taskSrc[i] === active && active !== -1); });

    if (active >= 0 && !audio.paused) {
      var row = rowEls[active], box = $('transcript');
      var top = row.offsetTop - box.offsetTop;
      if (top < box.scrollTop || top > box.scrollTop + box.clientHeight - row.offsetHeight) {
        box.scrollTo({ top: top - 40, behavior: 'smooth' });
      }
    }
  }

  function toggle() {
    if (audio.paused) audio.play(); else audio.pause();
  }

  $('playBtn').addEventListener('click', toggle);
  audio.addEventListener('play', function () { $('playBtn').textContent = '❚❚'; $('playBtn').setAttribute('aria-label', '일시정지'); });
  audio.addEventListener('pause', function () { $('playBtn').textContent = '▶'; $('playBtn').setAttribute('aria-label', '재생'); });
  audio.addEventListener('timeupdate', update);

  fetch('result.json')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      data = d; render(); update();
      // 딥링크: #t=12.5 → 해당 시점으로 이동
      var m = location.hash.match(/t=([\d.]+)/);
      if (m) {
        var go = function () { seek(parseFloat(m[1])); };
        if (audio.readyState >= 1) go(); else audio.addEventListener('loadedmetadata', go, { once: true });
      }
    })
    .catch(function (e) {
      console.error(e);
      $('transcript').innerHTML = '<li>결과 데이터를 불러오지 못했습니다.</li>';
    });
})();
