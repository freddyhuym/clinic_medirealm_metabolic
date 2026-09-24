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
      var isLaser = location.pathname === '/services/laser' || location.pathname === '/clinics/laser';
      var lt = isLaser ? (d.laser || {}) : (d.lifting || {});
      // 只有走新的 /clinics/* 網址才套用六大門診詳情頁的完整文字版型；
      // 舊網址 /services/lifting、/services/laser（理論上都會被伺服器 302 轉走）維持原本精簡版型
      var showRichContent = location.pathname.indexOf('/clinics/') === 0;
      setText('ltEyebrow', lt.eyebrow);
      setText('ltTitle', lt.title);
      setText('ltTagline', showRichContent ? (lt.tagline || '') : '');
      setText('ltSubtitle', lt.subtitle);
      setText('ltDevicesEyebrow', lt.devicesEyebrow);
      setText('ltDevicesTitle', lt.devicesTitle);

      // 沿用六大門診詳情頁的 Hero 按鈕、需求／評估／流程／FAQ／結尾 CTA
      var heroActions = $('ltHeroActions');
      if (heroActions) {
        heroActions.innerHTML = showRichContent ?
          '<a class="btn btn-primary" href="/appointment">預約評估諮詢</a><a class="btn btn-ghost" href="/doctors">查看醫師團隊</a>' : '';
      }

      var needsHTML = (showRichContent && (lt.needs || []).length)
        ? '<section class="dp-section"><h2 class="serif">哪些狀況適合諮詢' + esc(lt.title || '') + '？</h2>' +
          '<ul class="dp-need-list">' + lt.needs.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' +
          '</section>'
        : '';
      var catsHTML = '';
      if (showRichContent && (lt.categories || []).length) {
        catsHTML =
          '<section class="dp-section"><h2 class="serif">治療方向如何評估</h2>' +
          '<div class="dp-cat-grid">' + lt.categories.map(function (c) {
            return '<article class="dp-cat-card"><h3>' + esc(c.title) + '</h3><p>' + esc(c.desc) + '</p></article>';
          }).join('') + '</div>' +
          (lt.categoriesNote ? '<p class="dp-cat-note">' + esc(lt.categoriesNote) + '</p>' : '') +
          '</section>';
      }
      var highlightsHTML = (showRichContent && (lt.highlights || []).length)
        ? '<section class="dp-section"><h2 class="serif">就診時，我們會怎麼進行</h2>' +
          '<ul class="dp-highlight-list">' + lt.highlights.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ul>' +
          '</section>'
        : '';
      var faqHTML = (showRichContent && (lt.faq || []).length)
        ? '<section class="dp-section"><h2 class="serif">常見問題</h2><div class="dp-faq-list">' +
          lt.faq.map(function (f) {
            return '<div class="dp-faq-item"><p class="dp-faq-q">Q. ' + esc(f.q) + '</p>' +
              '<p class="dp-faq-a">' + (f.a ? esc(f.a) : 'A. 此問題將由醫師與院方確認後提供正式解答，如需進一步了解，歡迎先預約評估諮詢。') + '</p></div>';
          }).join('') + '</div></section>'
        : '';

      var preDevices = $('ltPreDevices');
      if (preDevices) {
        preDevices.innerHTML = (needsHTML || catsHTML)
          ? '<section class="dp-main"><div class="dp-main-inner">' + needsHTML + catsHTML + '</div></section>'
          : '';
      }
      var postDevices = $('ltPostDevices');
      if (postDevices) {
        var midHTML = (highlightsHTML || faqHTML)
          ? '<section class="dp-main"><div class="dp-main-inner">' + highlightsHTML + faqHTML + '</div></section>'
          : '';
        var ctaHTML = showRichContent
          ? '<section class="dp-cta"><div class="dp-cta-inner">' +
            (lt.closingLine ? '<p class="dp-closing serif">' + esc(lt.closingLine) + '</p>' : '') +
            '<h2 class="serif">想先了解自己適合的方向？</h2>' +
            '<p>可以先預約評估，由醫師了解狀況後，再一起討論合適的選擇與費用。</p>' +
            '<div class="dp-cta-actions"><a class="btn btn-primary" href="/appointment">預約評估諮詢</a><a class="btn btn-ghost" href="/clinics">查看其他門診</a></div>' +
            '</div></section>'
          : '';
        postDevices.innerHTML = midHTML + ctaHTML;
      }

      var heroSection = $('ltHero');
      var heroVisual = $('ltHeroVisual');
      if (heroSection && heroVisual) {
        if (lt.heroImage && lt.heroImage.src) {
          heroSection.classList.add('lt-hero-split');
          heroVisual.innerHTML = '<img src="' + esc(lt.heroImage.src) + '" alt="' + esc(lt.heroImage.alt || lt.title || '') + '" loading="eager">';
        } else {
          heroSection.classList.remove('lt-hero-split');
          heroVisual.innerHTML = '';
        }
      }
      setText('ltCategoryName', lt.categoryName || lt.title);
      var categoryLink = $('ltCategoryLink');
      if (categoryLink) categoryLink.href = lt.categoryHref || '/clinics';

      // 走 /clinics/* 網址時跟六大門診共用同一套麵包屑用詞；舊網址維持原本的「醫療服務」不動
      var sectionLink = $('ltSectionLink');
      if (sectionLink && showRichContent) { sectionLink.textContent = '六大門診'; sectionLink.href = '/clinics'; }
      document.title = (lt.title || '') + (showRichContent ? '｜六大門診' : '') + '｜初纖顏醫境診所 XIAN YAN · MEDIREALM';

      // 電音波拉提／雷射光療共用同一支頁面，title 與 description 這裡務必依實際內容改寫，
      // 避免不論哪個門診都固定顯示同一套（例如雷射頁誤植成電音波拉提的說明）
      var metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && lt.subtitle) metaDesc.setAttribute('content', lt.subtitle);
      var canonicalHref = (location.pathname === '/clinics/laser' || location.pathname === '/services/laser')
        ? '/clinics/laser' : '/clinics/lifting';
      var canonical = document.createElement('link');
      canonical.rel = 'canonical';
      canonical.href = ((d.seo && d.seo.siteUrl) || 'https://medirealm-origin.com').replace(/\/$/, '') + canonicalHref;
      document.head.appendChild(canonical);

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
