/* 纖顏醫境 — 六大門診總覽頁 */
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
      var p = d.pillars || {};
      setText('clFootnote', p.footnote);

      var grid = $('clGrid');
      if (grid) {
        grid.innerHTML = (p.items || []).map(function (it) {
          if (!it.image) return '';
          // shiftY：微調海報圖在裁切框內的垂直位置，疊加在既有的 1.28 倍放大之上
          var shiftPx = it.image.shiftY ? Number(it.image.shiftY) : 0;
          var imgStyle = ' style="transform: translateY(' + shiftPx + 'px) scale(1.28)"';
          return '<a class="cl-card" href="' + esc(it.href) + '" aria-label="' + esc(it.zh) + '：查看門診">' +
            '<img src="' + esc(it.image.src) + '" alt="' + esc(it.image.alt || it.zh) + '" loading="lazy"' + imgStyle + '>' +
            '<span class="cl-card-btn"><span class="cl-card-btn-label">查看門診</span><i>→</i></span>' +
          '</a>';
        }).join('');
      }

      var f = d.footer || {};
      if (f.copyright) setText('clFooterCopy', f.copyright);
    })
    .catch(function (err) {
      console.error('[纖顏醫境] 站台資料載入失敗：', err);
    });
})();
