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
  var isLaser = location.pathname.indexOf('/services/laser/') === 0;

  function figureHTML(fig) {
    if (!fig || !fig.src) return '';
    return '<figure class="dv-figure">' +
      '<img src="' + esc(fig.src) + '" alt="' + esc(fig.alt || '') + '" loading="lazy">' +
      (fig.caption ? '<figcaption>' + esc(fig.caption) + '</figcaption>' : '') +
    '</figure>';
  }
  function listHTML(points) {
    return '<ul class="dv-list">' + (points || []).map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>';
  }
  function parasHTML(paras) {
    return (paras || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
  }
  function head(no, title) {
    return '<div class="dv-section-head">' +
      '<span class="dv-section-no">' + no + '</span>' +
      '<h2>' + esc(title) + '</h2>' +
    '</div>';
  }
  function section(no, title, bodyHTML, extraClass) {
    return '<section class="dv-section' + (extraClass ? ' ' + extraClass : '') + '">' +
      head(no, title) + '<div class="dv-section-body">' + bodyHTML + '</div></section>';
  }

  fetch('/api/site')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var catalog = isLaser ? (d.laser || {}) : (d.lifting || {});
      var devices = catalog.devices || [];
      var dev = devices.filter(function (x) { return x.id === slug; })[0];
      if (!dev) { location.replace(isLaser ? '/clinics/laser' : '/clinics/lifting'); return; }
      var det = dev.detail || {};
      var categoryHref = isLaser ? '/clinics/laser' : (catalog.categoryHref || '/clinics/lifting');
      var categoryName = catalog.categoryName || catalog.title || (isLaser ? '雷射光療' : '電音波拉提');

      /* ── SEO ── */
      document.title = det.seoTitle || (dev.name + ' ' + dev.zhName + '｜初纖顏醫境診所 XIAN YAN · MEDIREALM');
      var meta = document.querySelector('meta[name="description"]');
      if (meta && det.seoDesc) meta.setAttribute('content', det.seoDesc);

      /* ── Hero ── */
      setText('dvCategoryName', categoryName);
      var categoryLink = $('dvCategoryLink');
      if (categoryLink) categoryLink.href = categoryHref;
      setText('dvCrumbName', dev.name + ' ' + dev.zhName);
      setText('dvEyebrow', det.heroEyebrow || dev.categoryEn);
      setText('dvName', dev.name);
      setText('dvZhName', dev.zhName);
      setText('dvType', dev.typeZh || dev.category);
      if (det.heroIntro) {
        var introEl = $('dvIntro');
        if (introEl) { introEl.textContent = det.heroIntro; introEl.style.display = ''; }
      }
      var img = $('dvImage');
      img.src = dev.image;
      img.alt = dev.alt || (dev.name + ' ' + dev.zhName);
      var back = $('dvBack');
      if (back) { back.href = categoryHref; back.textContent = '← 返回' + categoryName; }

      /* ── 文章區塊 ── */
      var html = '';
      var sectionNo = 1;
      function nextNo() { return String(sectionNo++).padStart(2, '0'); }

      if (det.quick) {
        html += section(nextNo(), det.quick.title,
          (det.quick.text ? '<p>' + esc(det.quick.text) + '</p>' : '') +
          '<div class="dv-quick-grid">' + (det.quick.points || []).map(function (p) {
            return '<div class="dv-quick-card">' + esc(p) + '</div>';
          }).join('') + '</div>' +
          figureHTML(det.quick.figure) +
          (det.quick.note ? '<p class="dv-note">' + esc(det.quick.note) + '</p>' : ''));
      }
      if (det.whatIs) {
        html += section(nextNo(), det.whatIs.title,
          parasHTML(det.whatIs.paras) + figureHTML(det.whatIs.figure));
      }
      if (det.mechanism) {
        html += section(nextNo(), det.mechanism.title,
          parasHTML(det.mechanism.paras) +
          (det.mechanism.items ? '<div class="dv-feature-grid">' + det.mechanism.items.map(function (f) {
            return '<div class="dv-feature-card"><h3>' + esc(f.t) + '</h3><p>' + esc(f.d) + '</p></div>';
          }).join('') + '</div>' : '') +
          '<div class="dv-figures">' + (det.mechanism.figures || []).map(figureHTML).join('') + '</div>');
      }
      if (det.features) {
        html += section(nextNo(), det.features.title,
          '<div class="dv-feature-grid">' + (det.features.items || []).map(function (f) {
            return '<div class="dv-feature-card"><h3>' + esc(f.t) + '</h3><p>' + esc(f.d) + '</p></div>';
          }).join('') + '</div>' +
          figureHTML(det.features.figure));
      }
      if (det.candidates) {
        html += section(nextNo(), det.candidates.title,
          (det.candidates.lead ? '<p>' + esc(det.candidates.lead) + '</p>' : '') +
          listHTML(det.candidates.points) +
          (det.candidates.note ? '<p class="dv-note">' + esc(det.candidates.note) + '</p>' : '') +
          figureHTML(det.candidates.figure));
      }
      if (det.areas) {
        html += section(nextNo(), det.areas.title,
          (det.areas.lead ? '<p>' + esc(det.areas.lead) + '</p>' : '') +
          listHTML(det.areas.points) +
          (det.areas.note ? '<p class="dv-note">' + esc(det.areas.note) + '</p>' : '') +
          figureHTML(det.areas.figure));
      }
      if (det.process) {
        html += section(nextNo(), det.process.title,
          '<div class="dv-steps">' + (det.process.steps || []).map(function (s, i) {
            return '<div class="dv-step"><span class="dv-step-no">0' + (i + 1) + '</span>' +
              '<h3>' + esc(s.t) + '</h3><p>' + esc(s.d) + '</p></div>';
          }).join('') + '</div>' +
          (det.process.note ? '<p class="dv-note">' + esc(det.process.note) + '</p>' : ''));
      }
      if (det.aftercare) {
        var care = det.aftercare.columns
          ? '<div class="dv-aftercare-grid">' + det.aftercare.columns.map(function (col) {
            return '<div class="dv-aftercare-column"><h3>' + esc(col.title) + '</h3>' + listHTML(col.points) + '</div>';
          }).join('') + '</div>'
          : (det.aftercare.lead ? '<p>' + esc(det.aftercare.lead) + '</p>' : '') + listHTML(det.aftercare.points);
        html += section(nextNo(), det.aftercare.title, care);
      }
      if (det.faq && det.faq.length) {
        var faqBody = det.faqAccordion
          ? '<p class="dv-faq-label">FAQ</p>' + det.faq.map(function (f) {
            return '<details><summary>' + esc(f.q) + '</summary>' +
              (f.a ? '<p>' + esc(f.a) + '</p>' : '') + '</details>';
          }).join('')
          : det.faq.map(function (f) {
            return '<p class="dv-faq-q">Q：' + esc(f.q) + '</p>' +
              (f.a ? '<p class="dv-faq-a">A：' + esc(f.a) + '</p>' : '');
          }).join('');
        html += section(nextNo(), det.faqTitle || '常見問題', faqBody, det.faqAccordion ? 'dv-faq' : '');
      }
      $('dvSections').innerHTML = html;

      /* ── CTA（兩頁共用） ── */
      var cta = catalog.cta || null;
      if (cta) {
        $('dvCta').innerHTML =
          '<h2 class="serif">' + esc(cta.title) + '</h2>' +
          '<p>' + esc(cta.text) + '</p>' +
          '<div class="dv-cta-actions">' +
            (cta.primary ? '<a class="btn btn-primary" href="' + esc(cta.primary.href) + '">' + esc(cta.primary.label) + '</a>' : '') +
            (cta.secondary ? '<a class="btn btn-ghost" href="' + esc(cta.secondary.href) + '">' + esc(cta.secondary.label) + '</a>' : '') +
          '</div>';
        $('dvCtaWrap').style.display = '';
      }

      /* ── 結構化資料：FAQ + Breadcrumb ── */
      function addLd(obj) {
        var s = document.createElement('script');
        s.type = 'application/ld+json';
        s.textContent = JSON.stringify(obj);
        document.head.appendChild(s);
      }
      if (det.faq && det.faq.length) {
        addLd({
          '@context': 'https://schema.org', '@type': 'FAQPage',
          mainEntity: det.faq.map(function (f) {
            return { '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } };
          })
        });
      }
      addLd({
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首頁', item: location.origin + '/' },
          { '@type': 'ListItem', position: 2, name: '六大門診', item: location.origin + '/clinics' },
           { '@type': 'ListItem', position: 3, name: categoryName, item: location.origin + categoryHref },
          { '@type': 'ListItem', position: 4, name: dev.name + ' ' + dev.zhName, item: location.origin + location.pathname }
        ]
      });

      var f = (d.footer || {});
      if (f.copyright) setText('dvFooterCopy', f.copyright);
    })
    .catch(function (err) {
      console.error('[纖顏醫境] 站台資料載入失敗：', err);
    });
})();
