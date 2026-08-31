/* 醫境知識庫頁面：/knowledge（索引）與 /knowledge/<slug>（單篇） */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  var main = document.getElementById('knMain');

  fetch('/api/site')
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      var k = d.knowledge || {};
      var arts = k.articles || [];
      var slug = location.pathname.replace(/^\/knowledge\/?/, '').replace(/\/$/, '');
      var art = arts.filter(function (a) { return a.id === slug; })[0];

      var copy = document.getElementById('knFooterCopy');
      if (copy && d.footer && d.footer.copyright) copy.textContent = d.footer.copyright;

      if (slug && !art) { location.replace('/knowledge'); return; }
      if (art) renderArticle(k, arts, art);
      else renderIndex(k, arts);
    })
    .catch(function () {
      main.innerHTML = '<p>資料載入失敗，請稍後再試。</p>';
    });

  function renderIndex(k, arts) {
    document.title = '醫境知識庫｜初纖顏醫境診所 XIAN YAN · MEDIREALM';
    main.innerHTML =
      '<p class="kn-breadcrumb"><a href="/">首頁</a>　／　醫境知識庫</p>' +
      '<p class="kn-page-cat">' + esc(k.eyebrow || 'MEDIREALM KNOWLEDGE') + '</p>' +
      '<h1>' + esc(k.label || '醫境知識庫') + '</h1>' +
      '<p class="kn-page-intro">' + esc(k.intro || '') + '</p>' +
      '<div class="kn-index-grid">' + arts.map(function (a) {
        return '<article class="kn-card active">' +
          '<figure class="kn-card-media"><img src="' + esc(a.image) + '" alt="' + esc(a.imageAlt || a.title) + '" loading="lazy"></figure>' +
          '<div class="kn-card-body">' +
            '<p class="kn-card-cat">' + esc(a.category) + '</p>' +
            '<h3 class="kn-card-title serif" style="font-size:22px">' + esc(a.title) + '</h3>' +
            '<p class="kn-card-hook" style="font-size:16px">' + esc(a.hook) + '</p>' +
            '<a class="kn-card-cta" href="' + esc(a.href) + '">閱讀文章 →</a>' +
          '</div>' +
        '</article>';
      }).join('') + '</div>';
  }

  function renderBody(blocks) {
    return '<div class="kn-body">' + blocks.map(function (b) {
      if (b.type === 'p') return '<p>' + esc(b.text) + '</p>';
      if (b.type === 'h2') return '<h2 class="serif">' + esc(b.text) + '</h2>';
      if (b.type === 'image') {
        return '<figure class="kn-body-img"><img src="' + esc(b.src) + '" alt="' + esc(b.alt || '') + '" loading="lazy">' +
          (b.caption ? '<figcaption>' + esc(b.caption) + '</figcaption>' : '') + '</figure>';
      }
      if (b.type === 'highlight') return '<blockquote class="kn-body-highlight serif">' + esc(b.text) + '</blockquote>';
      if (b.type === 'cta') {
        return '<div class="kn-body-cta"><p>' + esc(b.text) + '</p>' +
          (b.href ? '<a class="btn btn-primary" href="' + esc(b.href) + '" target="_blank" rel="noopener">' + esc(b.label || '了解更多') + '</a>' : '') + '</div>';
      }
      if (b.type === 'byline') return '<p class="kn-body-byline">' + esc(b.text) + '</p>';
      if (b.type === 'tags') {
        return '<p class="kn-body-tags">' + (b.items || []).map(function (t) { return '<span>#' + esc(t) + '</span>'; }).join('') + '</p>';
      }
      return '';
    }).join('') + '</div>';
  }

  function renderArticle(k, arts, a) {
    document.title = a.title + '｜醫境知識庫｜初纖顏醫境診所';
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', a.hook + ' ' + a.excerpt.slice(0, 80));
    var canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = 'https://medirealm-metabolic.com' + a.href;
    document.head.appendChild(canonical);

    var others = arts.filter(function (x) { return x.id !== a.id; });

    main.innerHTML =
      '<p class="kn-breadcrumb"><a href="/">首頁</a>　／　<a href="/knowledge">醫境知識庫</a>　／　' + esc(a.category) + '</p>' +
      '<p class="kn-page-cat">' + esc(a.category) + (a.titleEn ? '<i>' + esc(a.titleEn) + '</i>' : '') + '</p>' +
      '<h1>' + esc(a.title) + '</h1>' +
      '<p class="kn-page-hook">' + esc(a.hook) + '</p>' +
      '<figure class="kn-page-hero"><img src="' + esc(a.image) + '" alt="' + esc(a.imageAlt || a.title) + '"></figure>' +
      (a.body && a.body.length ? renderBody(a.body) :
        '<p class="kn-page-intro">' + esc(a.excerpt) + '</p>' +
        '<div class="kn-placeholder"><b>完整文章籌備中</b>' + esc(k.placeholderNote || '完整內容將於近期發布。') + '</div>') +
      '<div class="kn-page-cta"><a class="btn btn-primary" href="/#contact">預約專業評估</a></div>' +
      '<section class="kn-related"><h2>延伸閱讀</h2><div class="kn-related-list">' +
        others.map(function (o) {
          return '<a href="' + esc(o.href) + '"><span class="cat">' + esc(o.category) + '</span><span class="ttl">' + esc(o.title) + '</span></a>';
        }).join('') +
      '</div></section>';
  }
})();
