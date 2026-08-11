/* 纖顏醫境 — 電音波拉提設備詳細頁（共用 Template） */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function setText(id, v) { var el = $(id); if (el && v != null) el.textContent = v; }

  var slug = (location.pathname.split('/').filter(Boolean).pop() || '');

  // Section 定義：內容由 site.json 的 device.detail 填入，空值的 Section 不顯示
  var SECTIONS = [
    { no: '01', title: '療程介紹', key: 'intro', type: 'text' },
    { no: '02', title: '療程特色', key: 'features', type: 'list' },
    { no: '03', title: '作用原理', key: 'mechanism', type: 'text' },
    { no: '04', title: '適合族群', key: 'candidates', type: 'list' },
    { no: '05', title: '療程部位', key: 'areas', type: 'list' },
    { no: '06', title: '療程流程', key: 'process', type: 'list' },
    { no: '07', title: '療程資訊', key: 'treatmentInfo', type: 'list' },
    { no: '08', title: '常見問題 FAQ', key: 'faq', type: 'faq' }
  ];

  function renderBody(sec, val) {
    if (sec.type === 'text') return '<p>' + esc(val) + '</p>';
    if (sec.type === 'faq') {
      return val.map(function (f) {
        return '<p class="dv-faq-q">' + esc(f.q) + '</p>' +
          (f.a ? '<p class="dv-faq-a">' + esc(f.a) + '</p>' : '');
      }).join('');
    }
    return '<ul>' + val.map(function (v) { return '<li>' + esc(v) + '</li>'; }).join('') + '</ul>';
  }

  fetch('/api/site')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var devices = (d.lifting && d.lifting.devices) || [];
      var dev = devices.filter(function (x) { return x.id === slug; })[0];
      if (!dev) { location.replace('/services/lifting'); return; }

      document.title = dev.name + ' ' + dev.zhName + '｜纖顏醫境 XIAN YAN · MEDIREALM';
      setText('dvCrumbName', dev.name + ' ' + dev.zhName);
      setText('dvEyebrow', dev.categoryEn);
      setText('dvName', dev.name);
      setText('dvZhName', dev.zhName);
      setText('dvType', dev.typeZh || dev.category);
      var img = $('dvImage');
      img.src = dev.image;
      img.alt = dev.alt || (dev.name + ' ' + dev.zhName);

      var detail = dev.detail || {};
      var html = SECTIONS.map(function (sec) {
        var val = detail[sec.key];
        var has = sec.type === 'text' ? (val && String(val).trim()) : (val && val.length);
        if (!has) return ''; // 尚無內容的 Section 不顯示
        return '<section class="dv-section">' +
          '<div class="dv-section-head">' +
            '<span class="dv-section-no">' + sec.no + '</span>' +
            '<h2>' + esc(sec.title) + '</h2>' +
          '</div>' +
          '<div class="dv-section-body">' + renderBody(sec, val) + '</div>' +
        '</section>';
      }).join('');
      var wrap = $('dvSections');
      wrap.innerHTML = html;
      if (!html) wrap.parentElement.style.display = 'none';

      var f = (d.footer || {});
      if (f.copyright) setText('dvFooterCopy', f.copyright);
    })
    .catch(function (err) {
      console.error('[纖顏醫境] 站台資料載入失敗：', err);
    });
})();
