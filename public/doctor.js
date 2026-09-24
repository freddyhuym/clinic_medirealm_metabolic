/* 纖顏醫境 — 醫師個人詳細頁（共用 Doctor Detail Template）
   版型參考琢藝醫師頁：左照片＋右資料（標籤、經歷、專長）→ 醫師介紹 → 門診表 → 專業認證（含證書照片） */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function setText(id, v) { var el = $(id); if (el && v != null) el.textContent = v; }
  function list(items) { return (items || []).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join(''); }
  function head(eyebrow, titleHTML) {
    return '<div class="dx-head">' + (eyebrow ? '<p class="eyebrow">' + esc(eyebrow) + '</p>' : '') + '<h2>' + titleHTML + '</h2></div>';
  }

  var WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];
  var slug = (location.pathname.split('/').filter(Boolean).pop() || '');

  fetch('/api/site')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var team = d.team || {};
      var doctors = team.doctors || [];
      var dr = doctors.filter(function (x) { return x.slug === slug && x.detail; })[0];
      if (!dr) { location.replace('/doctors'); return; }
      var det = dr.detail;

      /* ── 院所名稱（沿用既有資料） ── */
      var clinicName = {};
      ((d.clinics || {}).items || []).forEach(function (c) { clinicName[c.id] = c.shortName + '｜' + c.hall; });
      var clinicLabel = (dr.clinics || []).map(function (id) { return clinicName[id] || ''; }).filter(Boolean).join('、');
      var clinic = ((d.clinics || {}).items || []).filter(function (c) { return (dr.clinics || []).indexOf(c.id) >= 0; })[0] || {};
      var cs = det.clinicSection || {};

      /* ── SEO ── */
      document.title = det.seoTitle || (dr.name + '｜初纖顏醫境診所 XIAN YAN · MEDIREALM');
      var meta = document.querySelector('meta[name="description"]');
      if (meta && det.seoDesc) meta.setAttribute('content', det.seoDesc);

      /* ── Hero ── */
      var m = String(dr.name || '').match(/^(.*?)\s*(醫師)$/);
      var shortName = m ? m[1] : dr.name;
      setText('drCrumbName', shortName);
      $('drName').innerHTML = esc(shortName) + (m ? '<small>醫師</small>' : '');
      setText('drTagline', dr.specialty);

      var photo = det.photo || {};
      var img = $('drPhoto');
      img.src = photo.src || dr.image;
      img.alt = photo.alt || dr.name;

      // 專長標籤：連到對應的門診頁（site.json team.tagLinks）
      var tagLinks = team.tagLinks || {};
      $('drTags').innerHTML = (dr.tags || []).map(function (t) {
        return tagLinks[t]
          ? '<a class="dx-spec-tag" href="' + esc(tagLinks[t]) + '">' + esc(t) + '</a>'
          : '<span class="dx-spec-tag">' + esc(t) + '</span>';
      }).join('');

      // 經歷／現任／專長：左側短標籤＋雙欄清單
      var bio = [];
      if (det.education) bio.push({ label: '經歷', items: det.education.items });
      if (det.certifications && det.certifications.asBio) bio.push({ label: '現任', items: det.certifications.items });
      if (det.specialties) bio.push({ label: '專長', items: det.specialties.items });
      $('drBio').innerHTML = bio.filter(function (b) { return (b.items || []).length; }).map(function (b) {
        return '<div class="dx-bio-block"><span class="dx-bio-label">' + esc(b.label) + '</span><ul class="dx-bio-list">' + list(b.items) + '</ul></div>';
      }).join('');

      var heroMeta = '';
      if (clinicLabel) heroMeta += '<p><b>主要看診</b>' + esc(clinicLabel) + '</p>';
      if (cs.hours) heroMeta += '<p><b>門診時間</b>' + esc(cs.hours) + '</p>';
      $('drHeroMeta').innerHTML = heroMeta;
      $('drHeroCta').innerHTML = '預約 ' + esc(shortName) + ' 醫師<i aria-hidden="true">→</i>';

      /* ── Sections ── */
      var html = '';

      // 醫師介紹＋理念
      if (det.intro || det.philosophy) {
        html += '<section class="dx-section dx-about"><div class="dx-about-inner">' +
          (det.intro ? head('ABOUT', esc(det.intro.title)) +
            '<div class="dx-about-body">' + (det.intro.paras || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>' : '') +
          (det.philosophy ? '<div class="dx-quote"><h3>' + esc(det.philosophy.title) + '</h3>' +
            (det.philosophy.paras || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>' : '') +
        '</div></section>';
      }

      // 門診表：只有 site.json 填了 schedule 才畫週表，不自行推測時段
      if (clinicLabel) {
        var byDay = {};
        (cs.schedule || []).forEach(function (s) { byDay[s.day] = s.hours; });
        var hasSchedule = (cs.schedule || []).length > 0;
        html += '<section class="dx-section dx-hours"><div class="dx-hours-inner">' +
          head('CLINIC HOURS', '<strong>' + esc(shortName) + '</strong> 醫師 門診表') +
          (hasSchedule
            ? '<div class="dx-clinic-grid">' + WEEKDAYS.map(function (wd) {
                var hr = byDay[wd];
                return '<div class="dx-clinic-cell ' + (hr ? 'is-on' : 'is-off') + '"><div class="dx-clinic-wd">' + wd + '</div>' +
                  '<div class="dx-clinic-hr">' + (hr ? esc(hr) : '—') + '</div></div>';
              }).join('') + '</div>'
            : '<p class="dx-hours-note">門診時段依院所安排，歡迎線上預約，將由專人與您聯繫確認。</p>') +
          '<p class="dx-clinic-place"><b>' + esc(clinicLabel) + '</b>' + (clinic.address ? esc(clinic.address) : '') + '</p>' +
          (clinic.phone ? '<p class="dx-clinic-place">電話 <a class="dx-tel" href="tel:' + esc(clinic.phone.replace(/[^0-9+]/g, '')) + '">' + esc(clinic.phone) + '</a></p>' : '') +
          (hasSchedule ? '<p class="dx-hours-note">門診時間如有異動，以預約時專人確認為準。</p>' : '') +
          '<a class="dx-hero-cta" href="/appointment">現在預約門診<i aria-hidden="true">→</i></a>' +
        '</div></section>';
      }

      // 專業認證：徽章清單＋證書照片（證書照片保留）
      var certs = det.certifications && !det.certifications.asBio ? det.certifications : null;
      var certImgs = det.certificateImages && (det.certificateImages.items || []).length ? det.certificateImages : null;
      if (certs || certImgs) {
        html += '<section class="dx-section dx-certs"><div class="dx-certs-inner">' +
          (certs ? head(certs.eyebrow || 'CERTIFICATIONS', esc(certs.title || '專業認證')) +
            '<div class="dx-certs-grid">' + (certs.items || []).map(function (t) {
              return '<div class="dx-cert-card"><span class="dx-cert-mark" aria-hidden="true">✦</span><span>' + esc(t) + '</span></div>';
            }).join('') + '</div>' : '') +
          (certImgs ? (certs
              ? '<h3 class="dx-cert-photos-title"><span>' + esc(certImgs.eyebrow || 'CERTIFICATES') + '</span>' + esc(certImgs.title) + '</h3>'
              : head(certImgs.eyebrow, esc(certImgs.title))) +
            '<div class="dr-cert-grid">' + certImgs.items.map(function (c) {
              return '<figure class="dr-cert-item"><img src="' + esc(c.src) + '" alt="' + esc(c.alt || '') + '" loading="lazy">' +
                (c.caption ? '<figcaption>' + esc(c.caption) + '</figcaption>' : '') + '</figure>';
            }).join('') + '</div>' : '') +
        '</div></section>';
      }
      $('drSections').innerHTML = html;

      /* ── CTA ── */
      if (det.cta) {
        $('drCta').innerHTML =
          '<h2 class="serif">' + esc(det.cta.title) + '</h2>' +
          '<p>' + esc(det.cta.text) + '</p>' +
          '<div class="dr-cta-actions">' +
            (det.cta.primary ? '<a class="btn btn-solid" href="' + esc(det.cta.primary.href) + '">' + esc(det.cta.primary.label) + '</a>' : '') +
            (det.cta.secondary ? '<a class="btn btn-ghost" href="' + esc(det.cta.secondary.href) + '">' + esc(det.cta.secondary.label) + '</a>' : '') +
          '</div>';
        $('drCtaWrap').style.display = '';
      }

      /* ── Person Schema ── */
      var s = document.createElement('script');
      s.type = 'application/ld+json';
      s.textContent = JSON.stringify({
        '@context': 'https://schema.org', '@type': 'Person',
        name: shortName, jobTitle: '醫師',
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
