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
      var devices = (d.lifting && d.lifting.devices) || [];
      var dev = devices.filter(function (x) { return x.id === slug; })[0];
      if (!dev) { location.replace('/services/lifting'); return; }
      var det = dev.detail || {};

      /* ── SEO ── */
      document.title = det.seoTitle || (dev.name + ' ' + dev.zhName + '｜初纖顏醫境診所 XIAN YAN · MEDIREALM');
      var meta = document.querySelector('meta[name="description"]');
      if (meta && det.seoDesc) meta.setAttribute('content', det.seoDesc);

      /* ── Hero ── */
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

      /* ── 文章區塊 ── */
      var html = '';

      if (det.quick) {
        html += section('01', det.quick.title,
          (det.quick.text ? '<p>' + esc(det.quick.text) + '</p>' : '') +
          '<div class="dv-quick-grid">' + (det.quick.points || []).map(function (p) {
            return '<div class="dv-quick-card">' + esc(p) + '</div>';
          }).join('') + '</div>');
      }
      if (det.whatIs) html += section('02', det.whatIs.title, parasHTML(det.whatIs.paras));
      if (det.mechanism) {
        html += section('03', det.mechanism.title,
          parasHTML(det.mechanism.paras) +
          '<div class="dv-figures">' + (det.mechanism.figures || []).map(figureHTML).join('') + '</div>');
      }
      if (det.features) {
        html += section('04', det.features.title,
          '<div class="dv-feature-grid">' + (det.features.items || []).map(function (f) {
            return '<div class="dv-feature-card"><h3>' + esc(f.t) + '</h3><p>' + esc(f.d) + '</p></div>';
          }).join('') + '</div>' +
          figureHTML(det.features.figure));
      }
      if (det.candidates) {
        html += section('05', det.candidates.title,
          (det.candidates.lead ? '<p>' + esc(det.candidates.lead) + '</p>' : '') +
          listHTML(det.candidates.points) +
          (det.candidates.note ? '<p class="dv-note">' + esc(det.candidates.note) + '</p>' : '') +
          figureHTML(det.candidates.figure));
      }
      if (det.areas) {
        html += section('06', det.areas.title,
          (det.areas.lead ? '<p>' + esc(det.areas.lead) + '</p>' : '') +
          listHTML(det.areas.points) +
          (det.areas.note ? '<p class="dv-note">' + esc(det.areas.note) + '</p>' : '') +
          figureHTML(det.areas.figure));
      }
      if (det.process) {
        html += section('07', det.process.title,
          '<div class="dv-steps">' + (det.process.steps || []).map(function (s, i) {
            return '<div class="dv-step"><span class="dv-step-no">0' + (i + 1) + '</span>' +
              '<h3>' + esc(s.t) + '</h3><p>' + esc(s.d) + '</p></div>';
          }).join('') + '</div>');
      }
      if (det.aftercare) {
        html += section('08', det.aftercare.title,
          (det.aftercare.lead ? '<p>' + esc(det.aftercare.lead) + '</p>' : '') +
          listHTML(det.aftercare.points));
      }
      if (det.faq && det.faq.length) {
        html += section('09', det.faqTitle || '常見問題',
          det.faq.map(function (f) {
            return '<p class="dv-faq-q">Q：' + esc(f.q) + '</p>' +
              (f.a ? '<p class="dv-faq-a">A：' + esc(f.a) + '</p>' : '');
          }).join(''));
      }
      $('dvSections').innerHTML = html;

      /* ── CTA（兩頁共用） ── */
      var cta = (d.lifting && d.lifting.cta) || null;
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
          { '@type': 'ListItem', position: 2, name: '醫療服務', item: location.origin + '/#services' },
          { '@type': 'ListItem', position: 3, name: '電音波拉提', item: location.origin + '/services/lifting' },
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
