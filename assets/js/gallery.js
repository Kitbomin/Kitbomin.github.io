// 공용: 스크린샷 갤러리 (탭 필터 + 클릭 확대)
// 마크업: <div class="gallery" data-gallery> <div class="g-tabs"><button data-filter="all">..</button>..</div>
//          <figure data-group="user"><img src alt><figcaption>..</figcaption></figure> ... </div>
(function () {
  'use strict';
  document.querySelectorAll('[data-gallery]').forEach(function (g) {
    var tabs = g.querySelectorAll('.g-tabs button');
    var figs = g.querySelectorAll('figure');
    tabs.forEach(function (b) {
      b.addEventListener('click', function () {
        tabs.forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        figs.forEach(function (f) {
          f.hidden = !(b.dataset.filter === 'all' || f.dataset.group === b.dataset.filter);
        });
      });
    });
    if (tabs[0]) tabs[0].click();
  });

  // 확대 보기
  var box = document.createElement('div');
  box.className = 'lightbox';
  box.hidden = true;
  box.innerHTML = '<figure><img alt=""><figcaption></figcaption></figure><button type="button" aria-label="닫기">×</button>';
  document.body.appendChild(box);
  var close = function () { box.hidden = true; document.body.style.overflow = ''; };
  box.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  document.querySelectorAll('[data-gallery] figure img').forEach(function (img) {
    img.addEventListener('click', function () {
      box.querySelector('img').src = img.src;
      box.querySelector('img').alt = img.alt;
      var cap = img.closest('figure').querySelector('figcaption');
      box.querySelector('figcaption').textContent = cap ? cap.textContent : '';
      box.hidden = false;
      document.body.style.overflow = 'hidden';
    });
  });
})();
