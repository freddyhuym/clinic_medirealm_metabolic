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

  /* ── 細線醫療 Icon（Monoline，呼應招牌 Icon 語彙） ── */
  var ICONS = {
    metabolic: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="24" cy="24" r="19"/><path d="M14 27l5-6 4 4 6-8 5 7"/><path d="M14 33h20"/></svg>',
    body: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="24" cy="24" r="19"/><path d="M19 13c0 4-2.4 6.4-2.4 10S19 30 19 35"/><path d="M29 13c0 4 2.4 6.4 2.4 10S29 30 29 35"/></svg>',
    aesthetics: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="24" cy="24" r="19"/><path d="M24 14c2.8 3.4 4.6 6.6 4.6 10a4.6 4.6 0 1 1-9.2 0c0-3.4 1.8-6.6 4.6-10Z"/><path d="M17 33.5c4.6 2 9.4 2 14 0"/></svg>',
    lifting: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="24" cy="24" r="19"/><path d="M17 32c0-7 3-13 7-17 4 4 7 10 7 17"/><path d="M15 26l6-5M33 26l-6-5"/></svg>',
    inject: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="24" cy="24" r="19"/><path d="M24 13c2.4 3 4 5.8 4 8.4a4 4 0 1 1-8 0c0-2.6 1.6-5.4 4-8.4Z"/><circle cx="24" cy="31.5" r="1.1"/><circle cx="18.5" cy="34.5" r="1.1"/><circle cx="29.5" cy="34.5" r="1.1"/></svg>',
    laser: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="24" cy="24" r="19"/><circle cx="24" cy="24" r="6.5"/><path d="M24 12.5v4M24 31.5v4M12.5 24h4M31.5 24h4M16 16l2.6 2.6M32 32l-2.6-2.6M32 16l-2.6 2.6M16 32l2.6-2.6"/></svg>',
    shield: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="24" cy="24" r="19"/><path d="M24 13.5l8 3v7c0 5.4-3.2 9.4-8 11.5-4.8-2.1-8-6.1-8-11.5v-7l8-3Z"/><path d="M20.5 24l2.6 2.6 4.6-5.2"/></svg>'
  };

  /* ── 各區塊渲染 ───────────────────────── */

  function renderNav(d) {
    var links = (d.nav || []).map(function (n) {
      return '<a href="' + esc(n.href) + '">' + esc(n.label) + '</a>';
    }).join('');
    setHTML('navLinks', links);
    setHTML('footerNav', (d.nav || []).map(function (n) {
      return '<a href="' + esc(n.href) + '">' + esc(n.label) + '</a>';
    }).join(''));
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
    if (more && p.more) { more.textContent = p.more.label + ' →'; more.href = p.more.href || '/#services'; }

    setHTML('popTrack', items.map(function (it) {
      return '<div class="popular-card">' +
        '<figure class="popular-card-media"><img src="' + esc(it.image) + '" alt="' + esc(it.name) + '" loading="lazy"></figure>' +
        '<h3 class="popular-card-name serif">' + esc(it.name) + '</h3>' +
      '</div>';
    }).join(''));

    initPopularCarousel(items.length);
  }

  function initPopularCarousel(total) {
    var viewport = $('popViewport');
    var track = $('popTrack');
    var prev = $('popPrev');
    var next = $('popNext');
    var count = $('popCount');
    if (!viewport || !track || !prev || !next) return;

    /* 無限循環：尾端補上前幾張的複製卡 */
    var CLONES = 3;
    var cards = Array.prototype.slice.call(track.children);
    cards.slice(0, CLONES).forEach(function (c) {
      var clone = c.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });

    var index = 0;
    var animating = false;
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function cardWidth() {
      var card = track.querySelector('.popular-card');
      return card ? card.offsetWidth + 16 : 300;
    }
    function setX(noAnim) {
      if (noAnim) track.style.transition = 'none';
      track.style.transform = 'translateX(' + (-index * cardWidth()) + 'px)';
      if (noAnim) { void track.offsetWidth; track.style.transition = ''; }
      if (count) count.innerHTML = '<b>' + pad((index % total) + 1) + '</b>／' + pad(total);
    }
    function go(dir) {
      if (animating) return;
      animating = true;
      if (dir < 0 && index === 0) { index = total; setX(true); } // 從第一張往前 → 先無感跳到複製區
      index += dir;
      setX(false);
      window.setTimeout(function () {
        if (index >= total) { index = index % total; setX(true); } // 滑進複製區後無感跳回真卡
        animating = false;
      }, 520);
    }
    prev.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });
    window.addEventListener('resize', function () { setX(true); });

    /* 觸控滑動 */
    var startX = null;
    viewport.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    viewport.addEventListener('touchend', function (e) {
      if (startX == null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      startX = null;
    }, { passive: true });

    setX(true);
  }

  function renderPillars(d) {
    var p = d.pillars || {};
    setText('pillarsEyebrow', p.eyebrow);
    setText('pillarsTitle', p.title);
    setText('pillarsSubtitle', p.subtitle);
    setText('pillarsFootnote', p.footnote);
    setHTML('pillarGrid', (p.items || []).map(function (it) {
      var tags = (it.tags || []).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
      var inner =
        '<p class="pillar-no" aria-hidden="true">' + esc(it.no) + '</p>' +
        '<div class="pillar-icon" aria-hidden="true">' + (ICONS[it.icon] || '') + '</div>' +
        '<p class="pillar-en">' + esc(it.en) + '</p>' +
        '<h3 class="pillar-zh">' + esc(it.zh) + '</h3>' +
        '<p class="pillar-desc">' + esc(it.desc) + '</p>' +
        (tags ? '<ul class="pillar-tags">' + tags + '</ul>' : '');
      if (it.href) {
        return '<a class="pillar pillar-link reveal" href="' + esc(it.href) + '" aria-label="' + esc(it.zh) + '：查看更多">' + inner + '</a>';
      }
      return '<article class="pillar reveal">' + inner + '</article>';
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

    setHTML('doctorGrid', (t.doctors || []).map(function (dr) {
      var exp = (dr.expertise || []).map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('');
      var cl = (dr.clinics || []).map(function (id) { return clinicName[id] || ''; }).filter(Boolean).join('、');
      var inner =
        (dr.image ? '<figure><img src="' + esc(dr.image) + '" alt="' + esc(dr.name) + '" loading="lazy"></figure>' : '') +
        '<div class="doctor-card-body">' +
          '<h3 class="doctor-card-name">' + esc(dr.name) + (dr.nameEn ? '<i>' + esc(dr.nameEn) + '</i>' : '') + '</h3>' +
          '<p class="doctor-card-spec">' + esc(dr.specialty) + '</p>' +
          (exp ? '<ul class="doctor-card-exp">' + exp + '</ul>' : '') +
          (cl ? '<p class="doctor-card-clinic">主要看診：' + esc(cl) + '</p>' : '') +
        '</div>';
      if (dr.href) {
        return '<a class="doctor-card doctor-card-link reveal" href="' + esc(dr.href) + '" aria-label="' + esc(dr.name) + '：查看詳細介紹">' + inner + '</a>';
      }
      return '<article class="doctor-card reveal">' + inner + '</article>';
    }).join(''));

    setText('teamNote', t.note);
    initTeamCarousel();
  }

  function initTeamCarousel() {
    var track = $('doctorGrid');
    var prev = $('teamPrev');
    var next = $('teamNext');
    if (!track || !prev || !next) return;

    function step() {
      var card = track.querySelector('.doctor-card');
      return card ? card.offsetWidth + 28 : 320;
    }
    function update() {
      var max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max;
    }
    prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
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
    setHTML('knArticles', arts.map(function (a, i) {
      return '<article class="kn-card" data-index="' + i + '">' +
        '<figure class="kn-card-media">' +
          '<img src="' + esc(a.image) + '" alt="' + esc(a.imageAlt || a.title) + '"' + (i === 0 ? '' : ' loading="lazy"') + '>' +
        '</figure>' +
        '<div class="kn-card-body">' +
          '<p class="kn-card-cat">' + esc(a.category) + (a.titleEn ? '<i>' + esc(a.titleEn) + '</i>' : '') + '</p>' +
          '<h3 class="kn-card-title serif">' + esc(a.title) + '</h3>' +
          '<p class="kn-card-hook">' + esc(a.hook) + '</p>' +
          '<p class="kn-card-excerpt">' + esc(a.excerpt) + '</p>' +
          '<a class="kn-card-cta" href="' + esc(a.href) + '">' + esc(a.cta || '閱讀完整文章 →') + '</a>' +
        '</div>' +
      '</article>';
    }).join(''));
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

  function renderFooter(d) {
    var f = d.footer || {};
    setText('footerDesc', f.brandDesc);
    setHTML('footerClinics', ((d.clinics || {}).items || []).map(function (c) {
      return '<li>' + esc(c.name + '・' + c.hall) + '</li>';
    }).join(''));
    setText('footerDisclaimer', f.disclaimer);
    setText('footerGroup', f.group);
    if (f.groupSite) {
      var a = $('footerGroupLink');
      a.href = f.groupSite.href; a.textContent = f.groupSite.label;
    }
  }

  /* ── 互動：導覽列 ─────────────────────── */
  function initNav() {
    var nav = $('nav'), toggle = $('navToggle'), links = $('navLinks');

    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 24); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
    });

    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    var sections = [].slice.call(document.querySelectorAll('main section[id]'));
    var anchors = [].slice.call(links.querySelectorAll('a'));
    if (!('IntersectionObserver' in window) || !sections.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        anchors.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { io.observe(s); });
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
  $('year').textContent = new Date().getFullYear();

  fetch('/api/site')
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (d) {
      renderNav(d); renderHero(d); renderPopular(d); renderAbout(d); renderPillars(d);
      renderUnderstand(d); renderClinics(d); renderTeam(d);
      renderKnowledge(d);
      renderContact(d); renderFooter(d);

      initNav(); initReveal(); initForm();

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
