/* 纖顏醫境 XIAN YAN · MEDIREALM — 所有內容由 /api/site 驅動，改 data/site.json 即可 */
(function () {
  'use strict';

  /* ── 工具 ─────────────────────────────── */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(id) { return document.getElementById(id); }
  function setText(id, txt) { var el = $(id); if (el && txt != null) el.textContent = txt; }
  function setHTML(id, html) { var el = $(id); if (el) el.innerHTML = html; }

  /* ── 各區塊渲染 ───────────────────────── */


  // 首頁「六大門診」區塊只放文字＋總覽海報圖（圖片本身是靜態 HTML）；
  // 完整六門診卡片格改在獨立分頁 /clinics 呈現
  function renderPillarsBanner(d) {
    var p = d.pillars || {};
    setText('pillarsEyebrow', p.eyebrow);
    setText('pillarsTitle', p.title);
    setText('pillarsSubtitle', p.subtitle);
  }

  function renderHero(d) {
    var h = d.hero || {};
    setText('heroEyebrow', h.eyebrow);
    setText('heroTitle', h.title);
    setText('heroPositioning', h.positioning);
    setText('heroLead', h.lead);
    var acts = [];
    if (h.cta)    acts.push('<a class="btn btn-solid" href="' + esc(h.cta.href) + '">' + esc(h.cta.label) + '</a>');
    if (h.ctaAlt) acts.push('<a class="btn btn-ghost" href="' + esc(h.ctaAlt.href) + '">' + esc(h.ctaAlt.label) + '</a>');
    setHTML('heroActions', acts.join(''));
    renderHeroClinics(d);
  }

  function renderHeroClinics(d) {
    var items = (d.clinics && d.clinics.items) || [];
    setHTML('heroClinics', items.map(function (it, i) {
      var num = '0' + (i + 1);
      var mark = it.logo
        ? '<img class="hc-logo" src="' + esc(it.logo) + '" alt="" loading="eager">'
        : '<span class="hc-wordmark serif" aria-hidden="true">' + esc(it.shortName) + '<i>XIAN YAN · MEDIREALM</i></span>';
      var tags = (it.services || []).slice(0, 4).map(function (s) {
        return '<li>' + esc(s) + '</li>';
      }).join('');
      return '<a class="hero-card hc-theme-' + esc(it.theme) + '" href="#clinic-' + esc(it.id) + '"' +
        ' aria-label="探索' + esc(it.name) + esc(it.hall || '') + '" style="--hc-delay:' + (100 + i * 120) + 'ms">' +
        '<span class="hc-num display">' + num + '</span>' +
        '<span class="hc-visual" aria-hidden="true">' + mark + '</span>' +
        '<span class="hc-name serif">' + esc(it.name) + '</span>' +
        '<span class="hc-loc">' + esc(it.hall || '') + '</span>' +
        '<span class="hc-pos">' + esc(it.positioning || '') + '</span>' +
        '<ul class="hc-tags" aria-hidden="true">' + tags + '</ul>' +
        '<span class="hc-cta">探索' + esc(it.shortName) + ' <b>→</b></span>' +
      '</a>';
    }).join(''));
  }

  var VALUE_ICONS = {
    cross: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 6v20M6 16h20" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>',
    rings: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="12.5" cy="16" r="7.5" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="19.5" cy="16" r="7.5" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>',
    team: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="9" r="3.4" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="8.5" cy="21" r="3.4" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="23.5" cy="21" r="3.4" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M13.8 11.8 10.4 18M18.2 11.8l3.4 6.2M12 21h8" stroke="currentColor" stroke-width="1" fill="none"/></svg>',
    city: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 26V13l6-4v17M12 26V15l7-3v14M19 26V13l7 3v10M4 26h24" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linejoin="round"/></svg>'
  };

  function renderAbout(d) {
    var a = d.about || {};
    setText('aboutEyebrow', a.eyebrow + (a.eyebrowZh ? '　' + a.eyebrowZh : ''));
    setText('aboutTitle', a.title);
    setText('aboutSubtitle', a.subtitle);
    setHTML('aboutBody', (a.manifesto || a.paragraphs || []).map(function (p) {
      return '<p class="reveal">' + esc(p) + '</p>';
    }).join(''));

    setHTML('phiValues', (a.values || []).map(function (v, i) {
      return '<article class="phi-value reveal" style="transition-delay:' + (i * 100) + 'ms">' +
        '<span class="phi-value-num display">' + esc(v.number) + '</span>' +
        '<span class="phi-value-icon">' + (VALUE_ICONS[v.icon] || '') + '</span>' +
        '<p class="phi-value-en display">' + esc(v.en) + '</p>' +
        '<h3 class="phi-value-title serif">' + esc(v.title) + '</h3>' +
        '<span class="phi-value-divider" aria-hidden="true"></span>' +
        '<p class="phi-value-tagline serif">' + esc(v.tagline) + '</p>' +
        '<p class="phi-value-desc">' + esc(v.description) + '</p>' +
      '</article>';
    }).join(''));

    var c = a.closing || {};
    setText('phiClosing', c.text);
    setText('phiClosingSig', c.signature);
  }

  /* ── 熱門療程輪播 ─────────────────────── */
  function renderPopular(d) {
    var p = d.popular || {};
    var items = p.items || [];
    var sec = $('popular');
    if (!sec || !items.length) return;
    sec.hidden = false;

    setText('popEyebrow', p.eyebrow);
    setText('popTitle', p.title);
    setText('popText', p.text);
    var more = $('popMore');
    if (more && p.more) { more.textContent = p.more.label + ' →'; more.href = p.more.href || '/clinics'; }
    var feeEl = $('popFeeNote');
    if (feeEl) feeEl.textContent = p.feeNote || '';

    // 靜態格狀卡片：沿用 site.json 原本就有、但先前沒渲染出來的 desc／href 欄位
    setHTML('popTrack', items.map(function (it) {
      var inner =
        '<figure class="popular-card-media"><img src="' + esc(it.image) + '" alt="' + esc(it.name) + '" loading="lazy"></figure>' +
        '<div class="popular-card-body">' +
          '<h3 class="popular-card-name serif">' + esc(it.name) + '</h3>' +
          (it.desc ? '<p class="popular-card-desc">' + esc(it.desc) + '</p>' : '') +
        '</div>';
      if (it.href) {
        return '<a class="popular-card" href="' + esc(it.href) + '" aria-label="' + esc(it.name) + '：了解更多">' + inner + '</a>';
      }
      return '<div class="popular-card">' + inner + '</div>';
    }).join(''));
  }

  function renderUnderstand(d) {
    var u = d.understand || {};
    setText('undEyebrow', u.eyebrow);
    setText('undTitle', u.title);
    setText('undLead', u.lead);
    setHTML('undQuestions', (u.questions || []).map(function (q) {
      return '<li class="reveal">' + esc(q) + '</li>';
    }).join(''));
    setText('undBody', u.body);
    if (u.cta) setHTML('undCta', '<a class="btn btn-ghost" href="' + esc(u.cta.href) + '">' + esc(u.cta.label) + '</a>');
    if (u.image && u.image.src) {
      var fig = $('undVisual');
      if (fig) {
        var img = document.createElement('img');
        img.src = u.image.src;
        img.alt = u.image.alt || '';
        img.loading = 'lazy';
        fig.appendChild(img);
      }
    }
  }

  var STATUS_LABEL = { open: '營運中', preparing: '籌備中' };

  /* ── 第一次來怎麼安排（流程說明，非醫療承諾）───── */
  function renderFirstVisit(d) {
    var fv = d.firstVisit;
    if (!fv) return;
    setText('fvEyebrow', fv.eyebrow);
    setText('fvTitle', fv.title);
    setText('fvIntro', fv.intro);
    setHTML('fvSteps', (fv.steps || []).map(function (s) {
      return '<li class="fv-step">' +
        '<span class="fv-step-no" aria-hidden="true">' + esc(s.no) + '</span>' +
        '<h3 class="fv-step-title serif">' + esc(s.title) + '</h3>' +
        '<p class="fv-step-desc">' + esc(s.desc) + '</p>' +
      '</li>';
    }).join(''));
    if (fv.cta) setHTML('fvCta', '<a class="btn btn-primary" href="' + esc(fv.cta.href) + '">' + esc(fv.cta.label) + '</a>');
  }

  /* ── 就診前常見問題（一般性流程說明，非個案醫療判斷）── */
  function renderPreVisitFaq(d) {
    var pf = d.preVisitFaq;
    if (!pf) return;
    setText('pfEyebrow', pf.eyebrow);
    setText('pfTitle', pf.title);
    setHTML('pfList', (pf.items || []).map(function (it, i) {
      return '<details class="pf-item"' + (i === 0 ? ' open' : '') + '>' +
        '<summary class="pf-q">' + esc(it.q) + '</summary>' +
        '<p class="pf-a">' + esc(it.a) + '</p>' +
      '</details>';
    }).join(''));
  }

  function renderClinics(d) {
    var c = d.clinics || {};
    setText('clinicsEyebrow', c.eyebrow);
    setText('clinicsTitle', c.title);
    setText('clinicsIntro', c.intro);

    setHTML('clinicPanels', (c.items || []).map(function (it) {
      var visual;
      var hasPhoto = !!(it.photo && it.photo.src);
      if (hasPhoto) {
        visual = '<img class="clinic-photo" src="' + esc(it.photo.src) + '" alt="' + esc(it.photo.alt || it.name) + '" loading="lazy">';
      } else if (it.logo) {
        visual = '<img class="clinic-logo" src="' + esc(it.logo) + '" alt="' + esc(it.name) + ' Logo" loading="lazy">';
      } else {
        visual = '<div class="clinic-monogram" aria-hidden="true"><b>' + esc(it.shortName) + '</b><i>XIAN YAN</i></div>';
      }
      var svc = (it.services || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
      var foot = [];
      if (it.address) {
        foot.push('<p class="clinic-addr">◈ ' + esc(it.address) + '</p>');
        if (it.mapQuery) {
          foot.push('<a class="btn-text" href="https://www.google.com/maps/search/?api=1&query=' +
            encodeURIComponent(it.mapQuery) + '" target="_blank" rel="noopener noreferrer">Google 地圖 →</a>');
        }
      } else {
        foot.push('<p class="clinic-addr">院所資訊籌備中</p>');
      }
      foot.push('<span class="clinic-status">' + esc(STATUS_LABEL[it.status] || '營運中') + '</span>');

      return '<article class="clinic-panel theme-' + esc(it.theme) + ' reveal" id="clinic-' + esc(it.id) + '">' +
        '<div class="clinic-visual' + (hasPhoto ? ' has-photo' : '') + '">' + visual + '</div>' +
        '<div class="clinic-content">' +
          '<p class="clinic-role">' + esc(it.role) + '</p>' +
          '<h3 class="clinic-name">' + (it.website
            ? '<a href="' + esc(it.website) + '" target="_blank" rel="noopener noreferrer">' + esc(it.name) + '</a>'
            : esc(it.name)) + '<small>' + esc(it.hall) + '</small></h3>' +
          '<p class="clinic-positioning">' + esc(it.positioning) + '</p>' +
          (svc ? '<ul class="clinic-services">' + svc + '</ul>' : '') +
          '<div class="clinic-foot">' + foot.join('') + '</div>' +
        '</div>' +
      '</article>';
    }).join(''));
  }

  function renderTeam(d) {
    var t = d.team || {};
    setText('teamEyebrow', t.eyebrow);
    setText('teamTitle', t.title);
    setText('teamSubtitle', t.subtitle);
    setHTML('teamBody', (t.paragraphs || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join(''));

    var clinicName = {};
    ((d.clinics || {}).items || []).forEach(function (c) { clinicName[c.id] = c.shortName + '｜' + c.hall; });

    var doctors = t.doctors || [];
    function doctorCardHTML(dr, isDuplicate) {
      var exp = (dr.expertise || []).map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('');
      var cl = (dr.clinics || []).map(function (id) { return clinicName[id] || ''; }).filter(Boolean).join('、');
      var inner =
        (dr.image ? '<figure><img src="' + esc(dr.image) + '" alt="' + esc(dr.name) + '" loading="lazy"' + (isDuplicate ? ' aria-hidden="true"' : '') + '></figure>' : '') +
        '<div class="doctor-card-body">' +
          '<h3 class="doctor-card-name">' + esc(dr.name) + (dr.nameEn ? '<i>' + esc(dr.nameEn) + '</i>' : '') + '</h3>' +
          '<p class="doctor-card-spec">' + esc(dr.specialty) + '</p>' +
          (exp ? '<ul class="doctor-card-exp">' + exp + '</ul>' : '') +
          (cl ? '<p class="doctor-card-clinic">主要看診：' + esc(cl) + '</p>' : '') +
        '</div>';
      // 跑馬燈會把清單重複幾份做無縫循環；重複的那幾份對輔助科技隱藏，避免重複朗讀
      var cls = 'doctor-card' + (isDuplicate ? '' : ' reveal');
      var attrs = isDuplicate ? ' aria-hidden="true" tabindex="-1"' : '';
      if (dr.href) {
        return '<a class="' + cls + ' doctor-card-link" href="' + esc(dr.href) + '" aria-label="' + esc(dr.name) + '：查看詳細介紹"' + attrs + '>' + inner + '</a>';
      }
      return '<article class="' + cls + '"' + attrs + '>' + inner + '</article>';
    }

    // 橫向跑馬燈：半圈至少要比畫面寬，醫師人數少時先把清單重複幾份，再整組複製一份做無縫循環
    var reps = doctors.length ? Math.max(1, Math.ceil(1800 / (doctors.length * 318))) : 1;
    var half = [];
    for (var r = 0; r < reps; r++) {
      half = half.concat(doctors.map(function (dr) { return doctorCardHTML(dr, r > 0); }));
    }
    var dup = [];
    for (var r2 = 0; r2 < reps; r2++) {
      dup = dup.concat(doctors.map(function (dr) { return doctorCardHTML(dr, true); }));
    }
    setHTML('doctorGrid', half.join('') + dup.join(''));

    setText('teamNote', t.note);
    var track = $('doctorGrid');
    // 醫師卡片愈多，動畫時間愈長，讓橫移速度維持一致
    if (track && doctors.length) track.style.animationDuration = (doctors.length * reps * 8) + 's';
  }

  function renderKnowledge(d) {
    var k = d.knowledge || {};
    setText('knEyebrow', k.eyebrow);
    setText('knLabel', k.label);
    setText('knTitle', k.title);
    setText('knIntro', k.intro);
    var more = $('knMore');
    if (more) { more.textContent = '探索更多醫境知識 →'; more.href = k.moreHref || '/knowledge'; }

    var arts = (k.articles || []).slice(0, 6); // 首頁最多顯示六篇
    function articleCardHTML(a, isDuplicate) {
      var attrs = isDuplicate ? ' aria-hidden="true" tabindex="-1"' : '';
      return '<article class="kn-card"' + attrs + '>' +
        '<figure class="kn-card-media">' +
          '<img src="' + esc(a.image) + '" alt="' + esc(a.imageAlt || a.title) + '" loading="lazy"' + (isDuplicate ? ' aria-hidden="true"' : '') + '>' +
        '</figure>' +
        '<div class="kn-card-body">' +
          '<p class="kn-card-cat">' + esc(a.category) + (a.titleEn ? '<i>' + esc(a.titleEn) + '</i>' : '') + '</p>' +
          '<h3 class="kn-card-title serif">' + esc(a.title) + '</h3>' +
          '<p class="kn-card-hook">' + esc(a.hook) + '</p>' +
          '<p class="kn-card-excerpt">' + esc(a.excerpt) + '</p>' +
          '<a class="kn-card-cta" href="' + esc(a.href) + '"' + (isDuplicate ? ' tabindex="-1"' : '') + '>' + esc(a.cta || '閱讀完整文章 →') + '</a>' +
        '</div>' +
      '</article>';
    }
    // 橫向自動跑馬燈：清單重複一份做無縫循環（做法與醫療團隊卡片一致）
    setHTML(
      'knArticles',
      arts.map(function (a) { return articleCardHTML(a, false); }).join('') +
      arts.map(function (a) { return articleCardHTML(a, true); }).join('')
    );
    var knTrack = $('knArticles');
    if (knTrack && arts.length) knTrack.style.animationDuration = Math.max(28, arts.length * 9) + 's';
  }

  function renderTagline(d) {
    var b = d.brand || {};
    var parts = [b.subtitle, b.philosophy, b.nameEn].filter(Boolean);
    setHTML('taglineInner', parts.map(function (t) {
      return '<span class="tagline-t">' + esc(t) + '</span>';
    }).join('<span class="tagline-dot" aria-hidden="true"></span>'));
  }

  function renderContact(d) {
    var c = d.contact || {};
    setText('contactEyebrow', c.eyebrow);
    setText('contactTitle', c.title);
    setText('contactSubtitle', c.subtitle);
    setText('formConsent', c.consent);

    setHTML('hours', (c.hours || []).map(function (h) {
      return '<div><dt>' + esc(h.days) + '</dt><dd>' + esc(h.time) + '</dd></div>';
    }).join(''));

    var lines = [];
    if (c.line)  lines.push('<span><span class="lbl">LINE</span>' + esc(c.line) + '</span>');
    if (c.phone) lines.push('<a href="tel:' + esc(c.phone.replace(/[^0-9+]/g, '')) + '"><span class="lbl">TEL</span>' + esc(c.phone) + '</a>');
    if (c.email) lines.push('<a href="mailto:' + esc(c.email) + '"><span class="lbl">MAIL</span>' + esc(c.email) + '</a>');
    setHTML('contactLines', lines.join(''));

    // 表單下拉：院所
    var clinicSel = $('fClinic');
    clinicSel.innerHTML = '<option value="">請選擇</option>' +
      ((d.clinics || {}).items || [])
        .map(function (it) { return '<option>' + esc(it.shortName + '｜' + it.hall) + '</option>'; }).join('') +
      '<option>由專人建議</option>';

    // 表單下拉：諮詢方向
    var topicSel = $('fTopic');
    topicSel.innerHTML = '<option value="">請選擇</option>' +
      ((d.pillars || {}).items || [])
        .map(function (it) { return '<option>' + esc(it.zh) + '</option>'; }).join('') +
      '<option>健康抗老</option><option>其他／不確定</option>';
  }



  /* ── 互動：捲動進場 ───────────────────── */
  function initReveal() {
    var items = [].slice.call(document.querySelectorAll('.reveal'));
    if (!items.length) return;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en, i) {
        if (!en.isIntersecting) return;
        var el = en.target;
        setTimeout(function () { el.classList.add('in'); }, i * 70);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ── 互動：預約表單 ───────────────────── */
  function initForm() {
    var form = $('bookingForm'), status = $('formStatus');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.style.color = '';

      var name = form.name.value.trim();
      var phone = form.phone.value.trim();

      form.name.setAttribute('aria-invalid', String(!name));
      form.phone.setAttribute('aria-invalid', String(!phone));

      if (!name || !phone) {
        status.style.color = '#C97B5D';
        status.textContent = '請填寫姓名與聯絡電話。';
        (!name ? form.name : form.phone).focus();
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      status.textContent = '傳送中…';

      fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name, phone: phone,
          clinic: form.clinic.value, topic: form.topic.value,
          note: form.note.value.trim()
        })
      })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function () {
          form.reset();
          status.textContent = '已收到您的預約，我們會盡快與您聯繫。';
        })
        .catch(function () {
          status.style.color = '#C97B5D';
          status.textContent = '送出失敗，請稍後再試。';
        })
        .finally(function () { btn.disabled = false; });
    });
  }

  /* ── 啟動 ─────────────────────────────── */

  fetch('/api/site')
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (d) {
      renderHero(d); renderTagline(d); renderPillarsBanner(d); renderPopular(d); renderAbout(d);
      renderUnderstand(d); renderClinics(d); renderTeam(d);
      renderFirstVisit(d); renderPreVisitFaq(d);
      renderKnowledge(d);

      initReveal(); initForm();

      // 內容為 JS 渲染，深層連結（如 /#locations）需在渲染後重新定位
      if (location.hash) {
        var target = document.getElementById(location.hash.slice(1));
        if (target) target.scrollIntoView();
      }
    })
    .catch(function (err) {
      console.error('[纖顏醫境] 站台資料載入失敗：', err);
      var t = $('heroTitle');
      if (t) t.textContent = '資料載入失敗';
      var l = $('heroLead');
      if (l) l.textContent = '請確認伺服器與 data/site.json。';
    });
})();
