/* 纖顏醫境 — 醫療團隊列表頁（/doctors） */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function setText(id, v) { var el = $(id); if (el && v != null) el.textContent = v; }

  // site.json 的姓名是「邱文瑾 醫師」，拆成姓名＋小字「醫師」
  function nameHTML(name) {
    var m = String(name || '').match(/^(.*?)\s*(醫師)$/);
    if (!m) return esc(name);
    return esc(m[1]) + ' <span class="drs-name-suffix">' + m[2] + '</span>';
  }

  function cardHTML(dr) {
    var inner =
      (dr.image ? '<figure class="drs-photo"><img src="' + esc(dr.image) + '" alt="' + esc(dr.name) + '" loading="lazy"></figure>' : '') +
      '<div class="drs-info">' +
        '<p class="drs-eyebrow">Physician</p>' +
        '<h3 class="drs-name">' + nameHTML(dr.name) + '</h3>' +
        (dr.specialty ? '<p class="drs-title">' + esc(dr.specialty) + '</p>' : '') +
        (dr.href ? '<p class="drs-cta">View Profile<span class="drs-cta-arrow" aria-hidden="true">→</span></p>' : '') +
      '</div>';
    var tags = ' data-tags="' + esc((dr.tags || []).join('|')) + '"';
    if (dr.href) {
      return '<a class="drs-card" href="' + esc(dr.href) + '"' + tags + ' aria-label="' + esc(dr.name) + '：查看詳細介紹">' + inner + '</a>';
    }
    return '<article class="drs-card"' + tags + '>' + inner + '</article>';
  }

  function initFilter(filters) {
    var nav = $('drsFilter');
    var grid = $('drsGrid');
    if (!nav || !grid || !filters.length) return;
    var all = ['全部'].concat(filters);
    nav.innerHTML = all.map(function (f, i) {
      return '<button type="button" class="drs-filter-pill' + (i === 0 ? ' is-active' : '') + '" aria-pressed="' + (i === 0) + '" data-filter="' + (i === 0 ? '' : esc(f)) + '">' + esc(f) + '</button>';
    }).join('');
    nav.hidden = false;

    nav.addEventListener('click', function (e) {
      var btn = e.target.closest('.drs-filter-pill');
      if (!btn) return;
      var f = btn.getAttribute('data-filter');
      [].forEach.call(nav.children, function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      var shown = 0;
      [].forEach.call(grid.querySelectorAll('.drs-card'), function (card) {
        var match = !f || card.getAttribute('data-tags').split('|').indexOf(f) !== -1;
        card.hidden = !match;
        if (match) shown++;
      });
      var empty = grid.querySelector('.drs-empty');
      if (!shown && !empty) grid.insertAdjacentHTML('beforeend', '<p class="drs-empty">此分類的醫師介紹陸續更新中。</p>');
      if (shown && empty) empty.remove();
    });
  }

  fetch('/api/site')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var t = d.team || {};
      setText('drsEyebrow', t.eyebrow);
      setText('drsTitle', t.title);
      setText('drsSubtitle', t.subtitle);
      setText('drsNote', t.note);

      var grid = $('drsGrid');
      if (grid) grid.innerHTML = (t.doctors || []).map(cardHTML).join('');
      initFilter(t.filters || []);

      var f = d.footer || {};
      if (f.copyright) setText('drsFooterCopy', f.copyright);
    })
    .catch(function (err) {
      console.error('[纖顏醫境] 站台資料載入失敗：', err);
    });
})();
