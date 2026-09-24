/* 纖顏醫境 — 院所資訊頁（/visit：院所位置） */
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
      var clinic = ((d.clinics || {}).items || []).filter(function (c) { return c.id === 'chu'; })[0] || {};

      /* ── 院所卡片 ── */
      setText('vsName', clinic.name);
      setText('vsHall', clinic.hall);
      setText('vsAddress', clinic.address);
      if (clinic.phone) {
        var tel = $('vsPhone');
        tel.textContent = clinic.phone;
        tel.href = 'tel:' + clinic.phone.replace(/[^0-9+]/g, '');
        $('vsPhoneRow').hidden = false;
      }

      // Google 地圖：用診所名稱＋地址查詢，會定位到 Google 商家「初纖顏・醫境診所」；不需要 API 金鑰
      var q = encodeURIComponent((clinic.name || '') + ' ' + (clinic.mapQuery || clinic.address || ''));
      $('vsMap').innerHTML = '<iframe src="https://www.google.com/maps?q=' + q + '&hl=zh-TW&z=17&output=embed"' +
        ' loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen' +
        ' title="' + esc(clinic.name) + ' 位置地圖"></iframe>';
      $('vsDirections').href = 'https://www.google.com/maps/dir/?api=1&destination=' + q;

      // 看診時間：沿用 site.json contact.hours
      var hours = (d.contact && d.contact.hours) || [];
      if (hours.length) {
        $('vsHours').innerHTML = hours.map(function (h) {
          var off = /休/.test(h.time);
          return '<tr' + (off ? ' class="is-off"' : '') + '><td>' + esc(h.days) + '</td><td>' + esc(h.time) + '</td></tr>';
        }).join('');
        $('vsHoursRow').hidden = false;
      }

      /* ── 初診流程（與首頁「第一次來，怎麼安排？」同一份資料） ── */
      var fv = d.firstVisit;
      if (fv) {
        setText('fvEyebrow', fv.eyebrow);
        setText('fvTitle', fv.title);
        setText('fvIntro', fv.intro);
        $('fvSteps').innerHTML = (fv.steps || []).map(function (s) {
          return '<li class="fv-step">' +
            '<span class="fv-step-no" aria-hidden="true">' + esc(s.no) + '</span>' +
            '<h3 class="fv-step-title serif">' + esc(s.title) + '</h3>' +
            '<p class="fv-step-desc">' + esc(s.desc) + '</p>' +
          '</li>';
        }).join('');
        if (fv.cta) $('fvCta').innerHTML = '<a class="btn btn-solid" href="' + esc(fv.cta.href) + '">' + esc(fv.cta.label) + '</a>';
        $('vsSteps').hidden = false;
      }

      var f = d.footer || {};
      if (f.copyright) setText('vsFooterCopy', f.copyright);
    })
    .catch(function (err) {
      console.error('[纖顏醫境] 站台資料載入失敗：', err);
    });
})();
