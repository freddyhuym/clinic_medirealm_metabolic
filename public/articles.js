/* 纖顏醫境 — 文章列表頁（內容由 data/site.json 的 articles 區塊驅動） */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function setText(id, v) { var el = $(id); if (el && v != null) el.textContent = v; }

  fetch('/api/site')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var a = d.articles || {};
      setText('arEyebrow', a.eyebrow);
      setText('arTitle', a.title);
      setText('arIntro', a.intro);
      if (a.title) document.title = a.title + '｜纖顏醫境 XIAN YAN · MEDIREALM';

      var items = a.items || [];
      var list = $('arList');
      if (!items.length) {
        list.innerHTML =
          '<div class="ar-empty">' +
            '<p class="ar-empty-mark">COMING SOON</p>' +
            '<h2>' + esc(a.emptyTitle || '文章即將上線') + '</h2>' +
            '<p>' + esc(a.emptyText || '我們正在準備專欄內容，敬請期待。') + '</p>' +
            '<a class="btn btn-ghost" href="/">返回首頁</a>' +
          '</div>';
      } else {
        list.innerHTML = '<div class="ar-list">' + items.map(function (it) {
          var inner =
            (it.date || it.category ? '<p class="ar-card-meta">' + esc([it.date, it.category].filter(Boolean).join('　·　')) + '</p>' : '') +
            '<h2>' + esc(it.title) + '</h2>' +
            (it.excerpt ? '<p>' + esc(it.excerpt) + '</p>' : '');
          return it.href
            ? '<a class="ar-card" href="' + esc(it.href) + '">' + inner + '</a>'
            : '<article class="ar-card">' + inner + '</article>';
        }).join('') + '</div>';
      }

      var f = (d.footer || {});
      if (f.copyright) setText('arFooterCopy', f.copyright);
    })
    .catch(function (err) {
      console.error('[纖顏醫境] 站台資料載入失敗：', err);
    });
})();
