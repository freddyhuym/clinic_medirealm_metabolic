/* 纖顏醫境 — 醫師個人詳細頁（共用 Doctor Detail Template） */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function setText(id, v) { var el = $(id); if (el && v != null) el.textContent = v; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  var slug = (location.pathname.split('/').filter(Boolean).pop() || '');

  fetch('/api/site')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var doctors = (d.team && d.team.doctors) || [];
      var dr = doctors.filter(function (x) { return x.slug === slug && x.detail; })[0];
      if (!dr) { location.replace('/#team'); return; }
      var det = dr.detail;

      /* ── 院所名稱（沿用既有資料） ── */
      var clinicName = {};
      ((d.clinics || {}).items || []).forEach(function (c) { clinicName[c.id] = c.shortName + '｜' + c.hall; });
      var clinicLabel = (dr.clinics || []).map(function (id) { return clinicName[id] || ''; }).filter(Boolean).join('、');

      /* ── SEO ── */
      document.title = det.seoTitle || (dr.name + '｜初纖顏醫境診所 XIAN YAN · MEDIREALM');
      var meta = document.querySelector('meta[name="description"]');
      if (meta && det.seoDesc) meta.setAttribute('content', det.seoDesc);

      /* ── Hero ── */
      setText('drCrumbName', dr.name);
      setText('drEyebrow', det.heroEyebrow || 'MEDICAL TEAM');
      setText('drName', dr.name);
      setText('drTagline', dr.specialty);
      $('drExpertise').innerHTML = (dr.expertise || []).map(function (e) { return '<p>' + esc(e) + '</p>'; }).join('');
      if (clinicLabel) {
        var cl = $('drClinicLine');
        cl.innerHTML = '<b>主要看診</b>' + esc(clinicLabel);
        cl.style.display = '';
      }
      var photo = (det.photo || {});
      var img = $('drPhoto');
      img.src = photo.src || dr.image;
      img.alt = photo.alt || dr.name;

      /* ── Sections ── */
      var html = '';

      if (det.intro) {
        html += '<section class="dr-section">' +
          '<h2>' + esc(det.intro.title) + '</h2>' +
          '<div class="dr-section-body">' + (det.intro.paras || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>' +
        '</section>';
      }
      if (det.education) {
        html += '<section class="dr-section">' +
          '<p class="eyebrow">' + esc(det.education.eyebrow) + '</p>' +
          '<h2>' + esc(det.education.title) + '</h2>' +
          '<div class="dr-section-body dr-edu">' + (det.education.items || []).map(function (t, i) {
            return '<div class="dr-edu-row"><span class="dr-edu-no">' + pad(i + 1) + '</span><span class="dr-edu-text">' + esc(t) + '</span></div>';
          }).join('') + '</div>' +
        '</section>';
      }
      if (det.certifications) {
        html += '<section class="dr-section">' +
          '<p class="eyebrow">' + esc(det.certifications.eyebrow) + '</p>' +
          '<h2>' + esc(det.certifications.title) + '</h2>' +
          '<div class="dr-section-body"><ul class="dr-cert-list">' + (det.certifications.items || []).map(function (t) {
            return '<li>' + esc(t) + '</li>';
          }).join('') + '</ul></div>' +
        '</section>';
      }
      if (det.specialties) {
        html += '<section class="dr-section">' +
          '<p class="eyebrow">' + esc(det.specialties.eyebrow) + '</p>' +
          '<h2>' + esc(det.specialties.title) + '</h2>' +
          '<div class="dr-section-body"><div class="dr-spec-grid">' + (det.specialties.items || []).map(function (t, i) {
            return '<div class="dr-spec-card"><span class="dr-spec-no">' + pad(i + 1) + '</span>' +
              '<span class="dr-spec-name">' + esc(t) + '</span></div>';
          }).join('') + '</div></div>' +
        '</section>';
      }
      if (det.philosophy) {
        html += '<section class="dr-section dr-philosophy">' +
          '<h2>' + esc(det.philosophy.title) + '</h2>' +
          '<div class="dr-section-body">' + (det.philosophy.paras || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>' +
        '</section>';
      }
      if (det.clinicSection && clinicLabel) {
        // 沿用既有院所資料，不虛構時段與電話
        var clinic = ((d.clinics || {}).items || []).filter(function (c) { return (dr.clinics || []).indexOf(c.id) >= 0; })[0] || {};
        html += '<section class="dr-section">' +
          '<p class="eyebrow">' + esc(det.clinicSection.eyebrow) + '</p>' +
          '<h2>' + esc(det.clinicSection.title) + '</h2>' +
          '<div class="dr-section-body"><div class="dr-clinic-card">' +
            '<h3>' + esc(clinicLabel) + '</h3>' +
            (clinic.address ? '<p>' + esc(clinic.address) + '</p>' : '') +
            (clinic.phone ? '<p>' + esc(clinic.phone) + '</p>' : '') +
          '</div></div>' +
        '</section>';
      }
      $('drSections').innerHTML = html;

      /* ── CTA ── */
      if (det.cta) {
        $('drCta').innerHTML =
          '<h2 class="serif">' + esc(det.cta.title) + '</h2>' +
          '<p>' + esc(det.cta.text) + '</p>' +
          '<div class="dr-cta-actions">' +
            (det.cta.primary ? '<a class="btn btn-primary" href="' + esc(det.cta.primary.href) + '">' + esc(det.cta.primary.label) + '</a>' : '') +
            (det.cta.secondary ? '<a class="btn btn-ghost" href="' + esc(det.cta.secondary.href) + '">' + esc(det.cta.secondary.label) + '</a>' : '') +
          '</div>';
        $('drCtaWrap').style.display = '';
      }

      /* ── Person Schema ── */
      var s = document.createElement('script');
      s.type = 'application/ld+json';
      s.textContent = JSON.stringify({
        '@context': 'https://schema.org', '@type': 'Person',
        name: dr.name.replace(/\s*醫師$/, ''), jobTitle: '醫師',
        affiliation: { '@type': 'MedicalOrganization', name: '初纖顏醫境診所' }
      });
      document.head.appendChild(s);

      var f = (d.footer || {});
      if (f.copyright) setText('drFooterCopy', f.copyright);
    })
    .catch(function (err) {
      console.error('[纖顏醫境] 站台資料載入失敗：', err);
    });
})();
