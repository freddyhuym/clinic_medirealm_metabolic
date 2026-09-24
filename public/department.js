/* 纖顏醫境 — 六大門診共用頁面（骨架版：架構已建立，實際費用／風險／適用性待醫師與院方核定後更新） */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function setText(id, v) { var el = $(id); if (el && v != null) el.textContent = v; }

  var slug = decodeURIComponent(location.pathname.replace(/^\/clinics\/?/, '').replace(/\/$/, ''));

  fetch('/api/site')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var dep = ((d.departments && d.departments.items) || []).find(function (x) { return x.slug === slug; });
      var main = $('dpMain');
      if (!dep) {
        main.innerHTML =
          '<div class="dp-empty">' +
            '<h1 class="serif">找不到這個門診頁面</h1>' +
            '<p>可能是網址有誤，或此門診頁面尚未上線。您可以回到首頁查看六大門診。</p>' +
            '<p style="margin-top:22px"><a class="btn btn-primary" href="/clinics">回到六大門診</a></p>' +
          '</div>';
        return;
      }
      renderDepartment(d, dep);
    })
    .catch(function () {
      var main = $('dpMain');
      if (main) main.innerHTML = '<div class="dp-empty"><h1 class="serif">頁面載入失敗</h1><p>請稍後再試，或回到<a href="/">首頁</a>。</p></div>';
    });

  function renderDepartment(d, dep) {
    document.title = dep.name + '｜六大門診｜初纖顏醫境診所 XIAN YAN · MEDIREALM';
    var metaDesc = $('siteNav') && document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', dep.lead || (dep.name + '門診介紹，由醫師評估需求，討論選項與費用。'));
    var canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = ((d.seo && d.seo.siteUrl) || 'https://medirealm-origin.com').replace(/\/$/, '') + '/clinics/' + dep.slug;
    document.head.appendChild(canonical);

    var isSkeleton = dep.status === 'skeleton';

    var needsHTML = (dep.needs || []).length
      ? '<section class="dp-section"><h2 class="serif">哪些困擾適合諮詢這個門診？</h2>' +
        '<ul class="dp-need-list">' + dep.needs.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' +
        '</section>'
      : '';

    var catsHTML = '';
    if ((dep.categories || []).length) {
      catsHTML =
        '<section class="dp-section"><h2 class="serif">治療方向如何評估</h2>' +
        '<div class="dp-cat-grid">' + dep.categories.map(function (c) {
          return '<article class="dp-cat-card"><h3>' + esc(c.title) + '</h3><p>' + esc(c.desc) + '</p></article>';
        }).join('') + '</div>' +
        (dep.categoriesNote ? '<p class="dp-cat-note">' + esc(dep.categoriesNote) + '</p>' : '') +
        '</section>';
    } else if (dep.categoriesNote) {
      catsHTML = '<section class="dp-section"><h2 class="serif">治療方向如何評估</h2><p class="dp-cat-note">' + esc(dep.categoriesNote) + '</p></section>';
    }

    var highlightsHTML = (dep.highlights || []).length
      ? '<section class="dp-section"><h2 class="serif">就診時，我們會怎麼進行</h2>' +
        '<ul class="dp-highlight-list">' + dep.highlights.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ul>' +
        '</section>'
      : '';

    var faqHTML = (dep.faq || []).length
      ? '<section class="dp-section"><h2 class="serif">常見問題</h2><div class="dp-faq-list">' +
        dep.faq.map(function (f) {
          return '<div class="dp-faq-item"><p class="dp-faq-q">Q. ' + esc(f.q) + '</p>' +
            '<p class="dp-faq-a">' + (f.a ? esc(f.a) : 'A. 此問題將由醫師與院方確認後提供正式解答，如需進一步了解，歡迎先預約評估諮詢。') + '</p></div>';
        }).join('') + '</div></section>'
      : '';

    var statusNote = isSkeleton
      ? '<p class="dp-status-note"><b>頁面架構籌備中：</b>本門診完整內容（評估項目、費用與適用對象）尚待院方確認，目前僅為頁面架構，正式內容將於確認後更新。</p>'
      : '<p class="dp-status-note"><b>費用與項目確認中：</b>本頁呈現的是門診內容架構草稿，實際可提供的療程項目、計價方式與風險說明，將由醫師評估與院方核定後正式更新。</p>';

    var heroText =
      '<p class="dp-breadcrumb"><a href="/">首頁</a>　／　<a href="/clinics">六大門診</a>　／　' + esc(dep.name) + '</p>' +
      '<p class="eyebrow">' + esc(dep.nameEn || '') + '</p>' +
      '<h1 class="dp-name serif">' + esc(dep.name) + '</h1>' +
      (dep.tagline ? '<p class="dp-tagline serif">' + esc(dep.tagline) + '</p>' : '') +
      (dep.lead ? '<p class="dp-lead">' + esc(dep.lead) + '</p>' : '') +
      '<div class="dp-hero-actions"><a class="btn btn-primary" href="/appointment">預約評估諮詢</a><a class="btn btn-ghost" href="/doctors">查看醫師團隊</a></div>' +
      statusNote;

    var heroHTML = dep.heroImage
      ? '<section class="dp-hero dp-hero-split"><div class="dp-hero-split-inner">' +
          '<div class="dp-hero-text">' + heroText + '</div>' +
          '<figure class="dp-hero-visual"><img src="' + esc(dep.heroImage.src) + '" alt="' + esc(dep.heroImage.alt || dep.name) + '" loading="eager"></figure>' +
        '</div></section>'
      : '<section class="dp-hero"><div class="dp-hero-inner">' + heroText + '</div></section>';

    $('dpMain').innerHTML =
      heroHTML +
      '<section class="dp-main"><div class="dp-main-inner">' +
        needsHTML + catsHTML + highlightsHTML + faqHTML +
      '</div></section>' +
      '<section class="dp-cta"><div class="dp-cta-inner">' +
        (dep.closingLine ? '<p class="dp-closing serif">' + esc(dep.closingLine) + '</p>' : '') +
        '<h2 class="serif">想先了解自己適合的方向？</h2>' +
        '<p>可以先預約評估，由醫師了解狀況後，再一起討論合適的選擇與費用。</p>' +
        '<div class="dp-cta-actions"><a class="btn btn-primary" href="/appointment">預約評估諮詢</a><a class="btn btn-ghost" href="/clinics">查看其他門診</a></div>' +
      '</div></section>';
  }
})();
