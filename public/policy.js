/* 纖顏醫境 — 網站政策頁（/privacy、/terms 共用） */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var slug = location.pathname.replace(/^\//, '').replace(/\/$/, ''); // 'privacy' 或 'terms'

  fetch('/api/site')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var pol = d.policies && d.policies[slug];
      var main = $('plMain');
      if (!pol) {
        main.innerHTML = '<h1 class="serif">找不到這個頁面</h1><p>可以回到<a href="/">首頁</a>查看其他內容。</p>';
        return;
      }
      renderPolicy(d, pol);
    })
    .catch(function () {
      var main = $('plMain');
      if (main) main.innerHTML = '<h1 class="serif">頁面載入失敗</h1><p>請稍後再試，或回到<a href="/">首頁</a>。</p>';
    });

  function renderPolicy(d, pol) {
    document.title = pol.title + '｜初纖顏醫境診所 XIAN YAN · MEDIREALM';
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', pol.intro || pol.title);
    var canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = ((d.seo && d.seo.siteUrl) || 'https://medirealm-origin.com').replace(/\/$/, '') + '/' + pol.slug;
    document.head.appendChild(canonical);

    var other = pol.slug === 'privacy'
      ? { label: '查看使用條款', href: '/terms' }
      : { label: '查看隱私權政策', href: '/privacy' };

    $('plMain').innerHTML =
      '<p class="pl-breadcrumb"><a href="/">首頁</a>　／　' + esc(pol.title) + '</p>' +
      '<p class="eyebrow">' + esc(pol.eyebrow || '') + '</p>' +
      '<h1 class="serif">' + esc(pol.title) + '</h1>' +
      '<p class="pl-updated">最後更新日期：' + esc(pol.updatedDate) + '</p>' +
      (pol.intro ? '<p class="pl-intro">' + esc(pol.intro) + '</p>' : '') +
      (pol.sections || []).map(function (s) {
        return '<section class="pl-section"><h2>' + esc(s.heading) + '</h2>' +
          (s.paragraphs || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
        '</section>';
      }).join('') +
      (pol.contactNote ? '<p class="pl-contact">' + esc(pol.contactNote) + '</p>' : '') +
      '<p class="pl-switch"><a href="' + esc(other.href) + '">' + esc(other.label) + ' →</a></p>';
  }
})();
