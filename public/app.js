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
      '<circle cx="24" cy="24" r="19"/><path d="M24 14c2.8 3.4 4.6 6.6 4.6 10a4.6 4.6 0 1 1-9.2 0c0-3.4 1.8-6.6 4.6-10Z"/><path d="M17 33.5c4.6 2 9.4 2 14 0"/></svg>'
  };

  /* ── 各區塊渲染 ───────────────────────── */

  function renderNav(d) {
    var links = (d.nav || []).map(function (n) {
      return '<a href="' + esc(n.href) + '">' + esc(n.label) + '</a>';
    }).join('');
    setHTML('navLinks', links);
    setHTML('footerNav', links);
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
  }

  function renderAbout(d) {
    var a = d.about || {};
    setText('aboutEyebrow', a.eyebrow);
    setText('aboutTitle', a.title);
    setHTML('aboutBody', (a.paragraphs || []).map(function (p) {
      return '<p class="reveal">' + esc(p) + '</p>';
    }).join(''));
  }

  function renderPillars(d) {
    var p = d.pillars || {};
    setText('pillarsEyebrow', p.eyebrow);
    setText('pillarsTitle', p.title);
    setHTML('pillarGrid', (p.items || []).map(function (it) {
      var tags = (it.tags || []).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
      return '<article class="pillar reveal">' +
        '<p class="pillar-no" aria-hidden="true">' + esc(it.no) + '</p>' +
        '<div class="pillar-icon" aria-hidden="true">' + (ICONS[it.icon] || '') + '</div>' +
        '<p class="pillar-en">' + esc(it.en) + '</p>' +
        '<h3 class="pillar-zh">' + esc(it.zh) + '</h3>' +
        '<p class="pillar-desc">' + esc(it.desc) + '</p>' +
        (tags ? '<ul class="pillar-tags">' + tags + '</ul>' : '') +
      '</article>';
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
  }

  var STATUS_LABEL = { open: '營運中', preparing: '籌備中' };

  function renderClinics(d) {
    var c = d.clinics || {};
    setText('clinicsEyebrow', c.eyebrow);
    setText('clinicsTitle', c.title);
    setText('clinicsIntro', c.intro);

    setHTML('clinicPanels', (c.items || []).map(function (it) {
      var visual = it.logo
        ? '<img class="clinic-logo" src="' + esc(it.logo) + '" alt="' + esc(it.name) + ' Logo" loading="lazy">'
        : '<div class="clinic-monogram" aria-hidden="true"><b>' + esc(it.shortName) + '</b><i>XIAN YAN</i></div>';
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

      return '<article class="clinic-panel theme-' + esc(it.theme) + ' reveal">' +
        '<div class="clinic-visual">' + visual + '</div>' +
        '<div class="clinic-content">' +
          '<p class="clinic-role">' + esc(it.role) + '</p>' +
          '<h3 class="clinic-name">' + esc(it.name) + '<small>' + esc(it.hall) + '</small></h3>' +
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
      return '<article class="doctor-card reveal">' +
        (dr.image ? '<figure><img src="' + esc(dr.image) + '" alt="' + esc(dr.name) + '" loading="lazy"></figure>' : '') +
        '<div class="doctor-card-body">' +
          '<h3 class="doctor-card-name">' + esc(dr.name) + (dr.nameEn ? '<i>' + esc(dr.nameEn) + '</i>' : '') + '</h3>' +
          '<p class="doctor-card-spec">' + esc(dr.specialty) + '</p>' +
          (exp ? '<ul class="doctor-card-exp">' + exp + '</ul>' : '') +
          (cl ? '<p class="doctor-card-clinic">主要看診：' + esc(cl) + '</p>' : '') +
        '</div>' +
      '</article>';
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
    if (more) { more.textContent = k.moreText || ''; more.href = k.moreHref || '/knowledge'; }

    var arts = k.articles || [];
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

    initKnowledgeStory(arts.length);
  }

  function initKnowledgeStory(total) {
    if (!total) return;
    var cards = Array.prototype.slice.call(document.querySelectorAll('.kn-card'));
    var num = $('knProgressNum');
    var fill = $('knProgressFill');

    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function setActive(i) {
      cards.forEach(function (c, j) { c.classList.toggle('active', i === j); });
      if (num) num.textContent = pad(i + 1) + ' / ' + pad(total);
      if (fill) fill.style.width = ((i + 1) / total * 100) + '%';
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) setActive(cards.indexOf(en.target));
        });
      }, { rootMargin: '-40% 0px -40% 0px', threshold: 0 });
      cards.forEach(function (c) { io.observe(c); });
    }
    setActive(0);
  }

  function renderFinalCta(d) {
    var f = d.finalCta || {};
    setText('fcEyebrow', f.eyebrow);
    setText('fcTitle', f.title);
    var acts = [];
    if (f.cta)    acts.push('<a class="btn btn-solid" href="' + esc(f.cta.href) + '">' + esc(f.cta.label) + '</a>');
    if (f.ctaAlt) acts.push('<a class="btn btn-ghost" href="' + esc(f.ctaAlt.href) + '">' + esc(f.ctaAlt.label) + '</a>');
    setHTML('fcActions', acts.join(''));
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
      renderNav(d); renderHero(d); renderAbout(d); renderPillars(d);
      renderUnderstand(d); renderClinics(d); renderTeam(d);
      renderKnowledge(d); renderFinalCta(d);
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
