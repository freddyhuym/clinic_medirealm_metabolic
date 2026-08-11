/* 纖顏醫境 — 電音波拉提設備瀏覽頁 */
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
      var lt = d.lifting || {};
      setText('ltEyebrow', lt.eyebrow);
      setText('ltTitle', lt.title);
      setText('ltSubtitle', lt.subtitle);
      setText('ltDevicesEyebrow', lt.devicesEyebrow);
      setText('ltDevicesTitle', lt.devicesTitle);
      document.title = (lt.title || '電音波拉提') + '｜纖顏醫境 XIAN YAN · MEDIREALM';

      var grid = $('ltGrid');
      if (grid) {
        grid.innerHTML = (lt.devices || []).map(function (dev) {
          var inner =
            '<div class="lt-card-visual">' +
              '<img src="' + esc(dev.image) + '" alt="' + esc(dev.alt || (dev.name + ' ' + dev.zhName)) + '" loading="lazy">' +
            '</div>' +
            '<div class="lt-card-body">' +
              '<p class="lt-card-cat">' + esc(dev.categoryEn) + '<i>' + esc(dev.category) + '</i></p>' +
              '<h3 class="lt-card-name">' + esc(dev.name) + '<small>' + esc(dev.zhName) + '</small></h3>' +
            '</div>';
          if (dev.href) {
            return '<a class="lt-card lt-card-link" href="' + esc(dev.href) + '" aria-label="' + esc(dev.name + ' ' + dev.zhName) + '：查看詳細介紹">' + inner + '</a>';
          }
          return '<article class="lt-card">' + inner + '</article>';
        }).join('');
      }

      var f = (d.footer || {});
      if (f.copyright) setText('ltFooterCopy', f.copyright);
    })
    .catch(function (err) {
      console.error('[纖顏醫境] 站台資料載入失敗：', err);
    });
})();
