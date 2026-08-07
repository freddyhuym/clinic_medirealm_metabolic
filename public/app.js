/* 雲纖醫境 YUN XIAN — 所有內容由 /api/site 驅動，改 data/site.json 即可 */
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

  /* ── 核心價值圖示（線條風，配合品牌調性） ── */
  var ICONS = {
    team: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">' +
          '<circle cx="24" cy="16" r="6"/><path d="M13 38c0-6.1 4.9-11 11-11s11 4.9 11 11"/>' +
          '<circle cx="9.5" cy="21" r="4"/><path d="M3 35c0-4 2.9-7.3 6.6-7.9"/>' +
          '<circle cx="38.5" cy="21" r="4"/><path d="M45 35c0-4-2.9-7.3-6.6-7.9"/></svg>',
    dna:  '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round">' +
          '<path d="M16 5c0 9 16 11 16 19S16 34 16 43"/><path d="M32 5c0 9-16 11-16 19s16 10 16 19"/>' +
          '<path d="M18.6 12h10.8M16.4 19h15.2M16.4 29h15.2M18.6 36h10.8"/></svg>',
    lotus:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M24 8c4.4 4.6 6.6 9.9 6.6 15.8 0 5.9-2.2 11.2-6.6 15.8-4.4-4.6-6.6-9.9-6.6-15.8C17.4 17.9 19.6 12.6 24 8Z"/>' +
          '<path d="M24 39.6C17.4 39.6 11.4 36 6 28.8c4.6-2.4 8.8-2.8 12.6-1.2"/>' +
          '<path d="M24 39.6c6.6 0 12.6-3.6 18-10.8-4.6-2.4-8.8-2.8-12.6-1.2"/></svg>',
    heart:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M24 40S8 30.4 8 19.6C8 14.3 12.1 10 17.2 10c2.9 0 5.5 1.4 7.2 3.6C26.1 11.4 28.7 10 31.6 10 36.7 10 40.8 14.3 40.8 19.6 40.8 30.4 24 40 24 40Z"/>' +
          '<path d="M14 24h6l2.4-4 3.2 8 2.4-4h6"/></svg>'
  };

  /* ── 各區塊渲染 ───────────────────────── */

  function renderNav(d) {
    setText('navNameZh', d.brand.nameZh);
    setText('navNameEn', d.brand.nameEn);
    var links = (d.nav || []).map(function (n) {
      return '<a href="' + esc(n.href) + '">' + esc(n.label) + '</a>';
    }).join('');
    setHTML('navLinks', links);
    setHTML('footerNav', links);
  }

  function renderHero(d) {
    var h = d.hero || {};
    if (h.image) {
      var img = $('heroImg');
      img.src = h.image;
      // 主視覺含大量文字，alt 需完整描述，否則螢幕閱讀器讀不到圖上的訊息
      img.alt = [h.alt, d.brand.nameZh + ' ' + d.brand.nameEn, d.brand.subtitle,
                 (h.titleLines || []).join('，'), (d.brand.traits || []).join('、')]
                 .filter(Boolean).join('　');
    }

    var lines = h.titleLines || [d.brand.slogan];
    setHTML('heroTitle', lines.map(esc).join('<span class="sep"></span>'));
    setText('heroLead', h.lead);
    setText('heroSub', h.sub);

    var acts = [];
    if (h.cta)    acts.push('<a class="btn btn-solid" href="' + esc(h.cta.href) + '">' + esc(h.cta.label) + '</a>');
    if (h.ctaAlt) acts.push('<a class="btn btn-ghost" href="' + esc(h.ctaAlt.href) + '">' + esc(h.ctaAlt.label) + '</a>');
    setHTML('heroActions', acts.join(''));

    setHTML('heroTraits', (d.brand.traits || []).map(function (t) {
      return '<li>' + esc(t) + '</li>';
    }).join(''));
  }

  function renderAbout(d) {
    var a = d.about || {};
    setText('aboutEyebrow', a.eyebrow);
    setText('aboutTitle', a.title);
    setText('aboutTitleSub', a.titleSub);
    setHTML('aboutBody', (a.paragraphs || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join(''));
    setText('aboutQuote', a.quote ? '「' + a.quote + '」' : '');
    setText('aboutCaption', d.brand.companion);

    // 水墨山霧上的四軸
    setHTML('inkAxes', (a.axes || []).map(function (ax) {
      return '<li>' + esc(ax.zh) + '<i>' + esc(ax.en) + '</i></li>';
    }).join(''));
  }

  function renderValues(d) {
    var v = d.values || {};
    setText('valuesEyebrow', v.eyebrow);
    setText('valuesTitle', v.title);
    setHTML('valueGrid', (v.items || []).map(function (it) {
      return '<article class="value-card reveal">' +
        '<div class="value-icon" aria-hidden="true">' + (ICONS[it.icon] || ICONS.lotus) + '</div>' +
        '<h3 class="value-zh">' + esc(it.zh) + '</h3>' +
        '<p class="value-en">' + esc(it.en) + '</p>' +
        '<p class="value-desc">' + esc(it.desc) + '</p>' +
      '</article>';
    }).join(''));
  }

  function renderServices(d) {
    var s = d.services || {};
    setText('servicesEyebrow', s.eyebrow);
    setText('servicesTitle', s.title);
    setText('servicesSubtitle', s.subtitle);
    setHTML('serviceGrid', (s.items || []).map(function (it) {
      var tags = (it.tags || []).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
      return '<article class="service-card reveal">' +
        '<p class="service-no">' + esc(it.no) + '</p>' +
        '<h3 class="service-zh">' + esc(it.zh) + '</h3>' +
        '<p class="service-en">' + esc(it.en) + '</p>' +
        '<p class="service-desc">' + esc(it.desc) + '</p>' +
        (tags ? '<ul class="service-tags">' + tags + '</ul>' : '') +
      '</article>';
    }).join(''));
  }

  function renderDoctor(d) {
    var dr = d.doctor || {};
    setText('doctorEyebrow', dr.eyebrow);
    setText('doctorTitle', dr.title);
    if (dr.image) { $('doctorImg').src = dr.image; $('doctorImg').alt = dr.nameZh || ''; }
    setText('doctorNameZh', dr.nameZh);
    setText('doctorNameEn', dr.nameEn);
    setText('doctorRole', dr.role);
    setText('doctorQuote', dr.quote ? '「' + dr.quote + '」' : '');
    setHTML('doctorBio', (dr.bio || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join(''));
    setHTML('doctorCred', (dr.credentials || []).map(function (c) { return '<li>' + esc(c) + '</li>'; }).join(''));
  }

  var STATUS_LABEL = { flagship: '旗艦館', open: '營運中', preparing: '籌備中' };

  function renderLocations(d) {
    var l = d.locations || {};
    setText('locEyebrow', l.eyebrow);
    setText('locTitle', l.title);
    setText('locSubtitle', l.subtitle ? '「' + l.subtitle + '」' : '');

    setHTML('locGrid', (l.items || []).map(function (it) {
      var svc = (it.services || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
      var map = it.mapQuery
        ? '<a class="loc-map" href="https://www.google.com/maps/search/?api=1&query=' +
          encodeURIComponent(it.mapQuery) + '" target="_blank" rel="noopener noreferrer">在 Google 地圖開啟 →</a>'
        : '';
      return '<article class="loc-card reveal is-' + esc(it.status || 'open') + '">' +
        '<span class="loc-badge">' + esc(STATUS_LABEL[it.status] || '營運中') + '</span>' +
        '<h3 class="loc-name">' + esc(it.name) + '</h3>' +
        (it.aka ? '<p class="loc-aka">' + esc(it.aka) + '</p>' : '') +
        '<p class="loc-legal">正式登記名稱：' + esc(it.legal) + '</p>' +
        '<p class="loc-focus">' + esc(it.focus) + '</p>' +
        (svc ? '<ul class="loc-services">' + svc + '</ul>' : '') +
        '<div class="loc-foot"><p class="loc-addr">◈ ' + esc(it.address) + '</p>' + map + '</div>' +
      '</article>';
    }).join(''));
  }

  function renderGifts(d) {
    var g = d.gifts || {};
    setText('giftEyebrow', g.eyebrow);
    setText('giftTitle', g.title);
    setText('giftSubtitle', g.subtitle);
    setText('giftNote', g.note);

    if (g.tote) {
      setHTML('giftTote',
        '<img src="' + esc(g.tote.image) + '" alt="' + esc(g.tote.title) + '" loading="lazy">' +
        '<div><h3>' + esc(g.tote.title) + '</h3><p>' + esc(g.tote.desc) + '</p></div>');
    }

    setHTML('giftGrid', (g.items || []).map(function (it) {
      return '<article class="gift-card reveal">' +
        '<img src="' + esc(it.image) + '" alt="' + esc(it.title) + '" loading="lazy">' +
        '<div class="gift-body">' +
          '<span class="gift-no">' + esc(it.no) + '</span>' +
          '<h4>' + esc(it.title) + '</h4>' +
          '<p>' + esc(it.desc) + '</p>' +
        '</div></article>';
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

    // 表單下拉：據點
    var clinicSel = $('fClinic');
    clinicSel.innerHTML = '<option value="">請選擇</option>' +
      (d.locations && d.locations.items || [])
        .filter(function (it) { return it.status !== 'preparing'; })
        .map(function (it) { return '<option>' + esc(it.name.replace(/\s+/g, '')) + '</option>'; }).join('');

    // 表單下拉：諮詢項目
    var topicSel = $('fTopic');
    topicSel.innerHTML = '<option value="">請選擇</option>' +
      (d.services && d.services.items || [])
        .map(function (it) { return '<option>' + esc(it.zh) + '</option>'; }).join('') +
      '<option>其他／不確定</option>';
  }

  function renderFooter(d) {
    var f = d.footer || {};
    setText('footerLine', f.line);
    setText('footerKeywords', d.brand.keywords);
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

    // 捲動高亮：目前捲到哪一區，選單就標記哪一項
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
    if (!('IntersectionObserver' in window)) {
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
        status.style.color = '#E8A188';
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
          status.style.color = '#E8A188';
          status.textContent = '送出失敗，請改用 LINE 與我們聯繫，或稍後再試。';
        })
        .finally(function () { btn.disabled = false; });
    });
  }

  /* ── 啟動 ─────────────────────────────── */
  $('year').textContent = new Date().getFullYear();

  fetch('/api/site')
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (d) {
      renderNav(d); renderHero(d); renderAbout(d); renderValues(d);
      renderServices(d); renderDoctor(d); renderLocations(d);
      renderGifts(d); renderContact(d); renderFooter(d);

      document.title = d.brand.nameZh + ' ' + d.brand.nameEn + '｜' + d.brand.positioning;

      initNav(); initReveal(); initForm();
    })
    .catch(function (err) {
      console.error('[雲纖醫境] 站台資料載入失敗：', err);
      var t = $('heroTitle');
      if (t) t.textContent = '資料載入失敗';
      var l = $('heroLead');
      if (l) l.textContent = '請確認伺服器與 data/site.json。';
    });
})();
