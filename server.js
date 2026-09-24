/**
 * 纖顏醫境 XIAN YAN · MEDIREALM — 都會代謝美學官網
 * 零依賴靜態伺服器 + /api/site
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT) || 3309;
// 不指定 host：Node 預設以雙堆疊監聽（IPv4 0.0.0.0 + IPv6 ::1），
// 避免瀏覽器把 localhost 解析成 ::1 時連不上。
const HOST = process.env.HOST || undefined;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_FILE = path.join(__dirname, 'data', 'site.json');
const BOOKINGS_FILE = path.join(__dirname, 'data', 'bookings.jsonl');
const APPOINTMENTS_FILE = path.join(__dirname, 'data', 'appointments.jsonl');
const APPOINTMENT_TREATMENTS = require('./public/appointment-treatments');
const appointmentTreatmentMap = new Map(APPOINTMENT_TREATMENTS.map((t) => [t.id, t]));
const recentAppointments = new Map();
let appointmentRateWindow = { startedAt: Date.now(), requests: 0, writes: 0 };

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

// 圖片可以長快取（改圖時換檔名即可）；HTML/CSS/JS 不快取，方便隨改隨看
const LONG_CACHE = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg', '.ico', '.woff', '.woff2']);

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, buf) => {
    if (err) {
      return send(res, 404, '404 Not Found', {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      });
    }
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.html') buf = applyLayout(buf.toString('utf8'), res.sitePath, filePath);
    send(res, 200, buf, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': LONG_CACHE.has(ext) ? 'public, max-age=2592000' : 'no-cache',
    });
  });
}

// 設備詳細頁的社群分享預覽需要伺服器端 meta；
// LINE、Facebook、WhatsApp 等爬蟲不會執行 device.js。
function serveDeviceFile(res, site, device, pathname, request) {
  const filePath = path.join(PUBLIC_DIR, 'device.html');
  fs.readFile(filePath, (err, buf) => {
    if (err) {
      return send(res, 404, '404 Not Found', {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      });
    }

    const detail = device.detail || {};
    const siteName = (site.seo && site.seo.siteName) || '初纖顏醫境診所';
    const fallbackTitle = `${device.name || ''} ${device.zhName || ''}｜${siteName}`;
    const title = detail.seoTitle || fallbackTitle;
    const desc = detail.seoDesc || `${device.name || ''} ${device.zhName || ''}設備介紹｜${siteName}`;
    const configuredOrigin = String((site.seo && site.seo.siteUrl) || '').replace(/\/$/, '');
    const forwardedProto = String((request.headers['x-forwarded-proto'] || 'https')).split(',')[0].trim();
    const requestOrigin = request.headers.host
      ? `${forwardedProto}://${request.headers.host}`
      : configuredOrigin;
    const origin = requestOrigin || configuredOrigin || 'https://medirealm-origin.com';
    const image = /^https?:\/\//i.test(device.image || '') ? device.image : origin + (device.image || '');
    const url = origin + pathname;
    const tags = [
      '<title>' + htmlAttr(title) + '</title>',
      '<meta name="description" content="' + htmlAttr(desc) + '">',
      '<meta property="og:type" content="website">',
      '<meta property="og:site_name" content="' + htmlAttr(siteName) + '">',
      '<meta property="og:locale" content="zh_TW">',
      '<meta property="og:title" content="' + htmlAttr(title) + '">',
      '<meta property="og:description" content="' + htmlAttr(desc) + '">',
      '<meta property="og:url" content="' + htmlAttr(url) + '">',
      '<meta property="og:image" content="' + htmlAttr(image) + '">',
      '<meta property="og:image:alt" content="' + htmlAttr(device.alt || title) + '">',
      '<meta name="twitter:card" content="summary_large_image">',
      '<meta name="twitter:title" content="' + htmlAttr(title) + '">',
      '<meta name="twitter:description" content="' + htmlAttr(desc) + '">',
      '<meta name="twitter:image" content="' + htmlAttr(image) + '">',
    ].join('\n');

    const html = applyLayout(buf.toString('utf8'), pathname, filePath)
      .replace(/<title>[\s\S]*?<\/title>/i, tags.split('\n')[0])
      .replace(/<meta name="description"[^>]*>/i, tags.split('\n')[1])
      .replace('</head>', tags.split('\n').slice(2).join('\n') + '\n</head>');

    send(res, 200, html, {
      'Content-Type': MIME['.html'],
      'Cache-Control': 'no-cache',
    });
  });
}

// ── 醫境知識文章：把 SEO 標籤直接寫進 HTML ──
// 文章內容由前端載入，但 LINE / Facebook 等爬蟲不會執行 JavaScript，
// 所以 title、description、canonical、Open Graph、JSON-LD 要在伺服器端先寫進 <head>。
function htmlAttr(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
// ── 全站共用導覽列／頁尾 ──
// 每個 HTML 只放 <!-- @site-header --> 與 <!-- @site-footer --> 佔位符，
// 伺服器送出前依 data/site.json（nav、secondaryNav、footer、clinics）產生同一份導覽列與頁尾，
// 所有頁面長得一樣、改一處就全站生效，而且內容寫在 HTML 裡，搜尋引擎爬得到。
let layoutCache = { mtimeMs: -1, site: null };
function loadSiteForLayout() {
  try {
    const st = fs.statSync(DATA_FILE);
    if (st.mtimeMs !== layoutCache.mtimeMs) {
      layoutCache = { mtimeMs: st.mtimeMs, site: JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) };
    }
  } catch (e) {
    console.error('  [錯誤] 讀取站台資料失敗（共用導覽列）：', e.message);
  }
  return layoutCache.site || {};
}
// site.json 的 nav 是寫給首頁用的相對錨點（#popular），其他頁要補成 /#popular
function navHref(href) { return /^#/.test(href || '') ? '/' + href : (href || '/'); }
// 目前頁面對應哪個主選單項目（加底線）
function navIsActive(href, pathname) {
  const h = navHref(href);
  if (h.indexOf('#') >= 0 || h === '/') return false;
  if (h === '/clinics') return pathname === '/clinics' || pathname.startsWith('/clinics/') || pathname.startsWith('/services/');
  return pathname === h || pathname.startsWith(h + '/');
}
const SOLID_NAV_PATHS = new Set(['/appointment']);
function buildSiteHeader(site, pathname) {
  const links = (site.nav || []).map((n) => {
    const active = navIsActive(n.href, pathname);
    return '      <a href="' + htmlAttr(navHref(n.href)) + '"' + (active ? ' class="active" aria-current="page"' : '') + '>' + htmlAttr(n.label) + '</a>';
  }).join('\n');
  const solid = SOLID_NAV_PATHS.has(pathname);
  return [
    '<header class="nav' + (solid ? ' nav-solid scrolled' : '') + '" id="siteNav">',
    '  <div class="nav-inner">',
    '    <a class="nav-brand" href="/" aria-label="初纖顏醫境診所 回首頁">',
    '      <span class="nav-wordmark">',
    '        <b>初纖顏醫境診所</b>',
    '        <i>XIAN YAN · MEDIREALM</i>',
    '      </span>',
    '    </a>',
    '    <nav class="nav-links" id="navLinks" aria-label="主選單">',
    links,
    '    </nav>',
    '    <a class="nav-cta" href="/appointment">線上預約</a>',
    '    <button class="nav-toggle" id="navToggle" type="button" aria-label="開啟選單" aria-expanded="false" aria-controls="navLinks">',
    '      <span></span><span></span><span></span>',
    '    </button>',
    '  </div>',
    '</header>',
  ].join('\n');
}
// 頁尾「最後更新日期」自動產生：取該頁 HTML 檔與 site.json 兩者較新的修改時間（台灣時區）
function lastUpdatedDate(filePath) {
  let t = layoutCache.mtimeMs > 0 ? layoutCache.mtimeMs : 0;
  try { if (filePath) t = Math.max(t, fs.statSync(filePath).mtimeMs); } catch (e) { /* 取不到就只用 site.json */ }
  if (!t) return '';
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(t));
}
function buildSiteFooter(site, filePath) {
  const f = site.footer || {};
  const clinics = (site.clinics && site.clinics.items) || [];
  const main = clinics.filter((c) => c.id === 'chu')[0] || clinics[0] || {};
  const link = (n) => '<a href="' + htmlAttr(navHref(n.href)) + '">' + htmlAttr(n.label) + '</a>';
  const contact = [];
  if (main.address) contact.push('<a href="/visit">' + htmlAttr(main.address) + '</a>');
  if (main.phone) contact.push('電話 <a href="tel:' + htmlAttr(String(main.phone).replace(/[^0-9+]/g, '')) + '">' + htmlAttr(main.phone) + '</a>');
  const year = new Date().getFullYear();
  const updated = lastUpdatedDate(filePath);
  return [
    '<footer class="footer">',
    '  <div class="wrap">',
    '    <p class="footer-wordmark">初纖顏醫境診所<i>XIAN YAN · MEDIREALM</i></p>',
    f.brandDesc ? '    <p class="footer-desc">' + htmlAttr(f.brandDesc) + '</p>' : '',
    clinics.length ? '    <ul class="footer-clinics">' + clinics.map((c) => '<li>' + htmlAttr(c.name + '・' + c.hall) + '</li>').join('') + '</ul>' : '',
    contact.length ? '    <p class="footer-contact">' + contact.join('<span class="footer-contact-sep" aria-hidden="true">｜</span>') + '</p>' : '',
    '    <nav class="footer-nav" aria-label="頁尾選單">' + (site.nav || []).concat(site.secondaryNav || []).map(link).join('') + '</nav>',
    f.disclaimer ? '    <p class="footer-disclaimer">' + htmlAttr(f.disclaimer) + '</p>' : '',
    '    <nav class="footer-legal" aria-label="網站政策">' + (f.legalLinks || []).map(link).join('') + '</nav>',
    '    <small class="footer-copy">© ' + year + ' ' + htmlAttr(f.group || '初纖顏醫境診所') +
      (f.groupSite ? '　|　<a href="' + htmlAttr(f.groupSite.href) + '" target="_blank" rel="noopener noreferrer">' + htmlAttr(f.groupSite.label) + '</a>' : '') + '</small>',
    (updated ? '    <p class="footer-updated">最後更新日期：' + htmlAttr(updated) + '</p>' : ''),
    '  </div>',
    '</footer>',
    '<script src="/nav.js?v=1"></script>',
  ].filter(Boolean).join('\n');
}
// 懸浮 LINE 按鈕（參考曜妍 LineFloatingButton）：連結取 site.json contact.line，全站同一顆
const LINE_ICON_PATH = 'M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314';
function buildLineFab(site) {
  const url = site.contact && site.contact.line;
  if (!url) return '';
  return [
    '<a class="line-fab" href="' + htmlAttr(url) + '" target="_blank" rel="noopener noreferrer" aria-label="用 LINE 預約諮詢（另開新視窗）">',
    '  <span class="line-fab-circle">',
    '    <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="' + LINE_ICON_PATH + '"/></svg>',
    '    <i class="line-fab-sparkle" style="top:4px;right:8px"></i>',
    '    <i class="line-fab-sparkle" style="bottom:8px;left:4px;animation-delay:.4s"></i>',
    '    <i class="line-fab-sparkle" style="top:16px;left:8px;animation-delay:.8s"></i>',
    '  </span>',
    '  <span class="line-fab-label">預約諮詢</span>',
    '</a>',
  ].join('\n');
}
function applyLayout(html, pathname, filePath) {
  if (html.indexOf('<!-- @site-header -->') < 0 && html.indexOf('<!-- @site-footer -->') < 0) return html;
  const site = loadSiteForLayout();
  return html
    .replace('<!-- @site-header -->', () => buildSiteHeader(site, pathname || '/'))
    .replace('<!-- @site-footer -->', () => buildSiteFooter(site, filePath) + '\n' + buildLineFab(site));
}

function jsonLdTag(obj) {
  return '<script type="application/ld+json">' + JSON.stringify(obj).replace(/</g, '\\u003c') + '</script>';
}
function buildKnowledgeHead(site, art) {
  const cfg = site.seo || {};
  const origin = String(cfg.siteUrl || 'https://medirealm-origin.com').replace(/\/$/, '');
  const siteName = cfg.siteName || '初纖顏醫境診所';
  const abs = (u) => (/^https?:\/\//i.test(u || '') ? u : origin + (u || ''));
  const seo = art.seo || {};
  const url = origin + art.href;
  const title = seo.title || (art.title + '｜醫境知識庫｜' + siteName);
  const desc = seo.description || ((art.hook || '') + ' ' + String(art.excerpt || '').slice(0, 80));
  const ogImage = abs(seo.ogImage || art.image);
  const heroImage = abs(art.image);
  const logo = abs(cfg.logo);
  const publisher = { '@type': 'Organization', name: siteName, url: origin + '/', logo: { '@type': 'ImageObject', url: logo } };

  const tags = [];
  tags.push('<title>' + htmlAttr(title) + '</title>');
  tags.push('<meta name="description" content="' + htmlAttr(desc) + '">');
  if (seo.keywords && seo.keywords.length) tags.push('<meta name="keywords" content="' + htmlAttr(seo.keywords.join(',')) + '">');
  if (seo.robots) tags.push('<meta name="robots" content="' + htmlAttr(seo.robots) + '">');
  tags.push('<link rel="canonical" href="' + htmlAttr(url) + '">');
  tags.push('<meta property="og:type" content="article">');
  tags.push('<meta property="og:site_name" content="' + htmlAttr(siteName) + '">');
  tags.push('<meta property="og:locale" content="' + htmlAttr(cfg.locale || 'zh_TW') + '">');
  tags.push('<meta property="og:title" content="' + htmlAttr(seo.ogTitle || title) + '">');
  tags.push('<meta property="og:description" content="' + htmlAttr(desc) + '">');
  tags.push('<meta property="og:url" content="' + htmlAttr(url) + '">');
  tags.push('<meta property="og:image" content="' + htmlAttr(ogImage) + '">');
  if (seo.ogImageWidth) tags.push('<meta property="og:image:width" content="' + htmlAttr(seo.ogImageWidth) + '">');
  if (seo.ogImageHeight) tags.push('<meta property="og:image:height" content="' + htmlAttr(seo.ogImageHeight) + '">');
  tags.push('<meta property="og:image:alt" content="' + htmlAttr(seo.ogImageAlt || art.imageAlt || art.title) + '">');
  if (seo.datePublished) tags.push('<meta property="article:published_time" content="' + htmlAttr(seo.datePublished) + '">');
  if (seo.dateModified) tags.push('<meta property="article:modified_time" content="' + htmlAttr(seo.dateModified) + '">');
  if (seo.section || art.category) tags.push('<meta property="article:section" content="' + htmlAttr(seo.section || art.category) + '">');
  (seo.keywords || []).forEach((k) => tags.push('<meta property="article:tag" content="' + htmlAttr(k) + '">'));
  tags.push('<meta name="twitter:card" content="summary_large_image">');
  tags.push('<meta name="twitter:title" content="' + htmlAttr(seo.ogTitle || title) + '">');
  tags.push('<meta name="twitter:description" content="' + htmlAttr(desc) + '">');
  tags.push('<meta name="twitter:image" content="' + htmlAttr(ogImage) + '">');

  // Article
  const article = {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: art.title, description: desc, inLanguage: 'zh-TW',
    image: [ogImage, heroImage].filter((v, i, a) => a.indexOf(v) === i),
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    // 有具名撰稿醫師時採用 Person（利於 E-E-A-T），否則回退為機構本身
    author: seo.author
      ? { '@type': 'Person', name: seo.author, url: abs(seo.authorUrl), jobTitle: seo.authorTitle }
      : { '@type': 'Organization', name: siteName, url: origin + '/' },
    publisher,
  };
  if (seo.reviewedBy && seo.reviewedBy !== seo.author) article.reviewedBy = { '@type': 'Person', name: seo.reviewedBy };
  if (seo.datePublished) article.datePublished = seo.datePublished;
  if (seo.dateModified || seo.datePublished) article.dateModified = seo.dateModified || seo.datePublished;
  if (seo.keywords && seo.keywords.length) article.keywords = seo.keywords.join(',');
  if (seo.section || art.category) article.articleSection = seo.section || art.category;
  if (seo.about) article.about = { '@type': 'Person', name: seo.about.name, url: abs(seo.about.url), jobTitle: seo.about.jobTitle };
  tags.push(jsonLdTag(article));

  // BreadcrumbList
  tags.push(jsonLdTag({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '首頁', item: origin + '/' },
      { '@type': 'ListItem', position: 2, name: '醫境知識庫', item: origin + '/knowledge' },
      { '@type': 'ListItem', position: 3, name: art.title, item: url },
    ],
  }));

  // FAQPage（文章內有 faq 區塊時）
  const faqs = [];
  (art.body || []).forEach((b) => { if (b.type === 'faq') (b.items || []).forEach((it) => faqs.push(it)); });
  if (faqs.length) {
    tags.push(jsonLdTag({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: faqs.map((it) => ({ '@type': 'Question', name: it.question, acceptedAnswer: { '@type': 'Answer', text: it.answer } })),
    }));
  }

  // ItemList（門診／服務清單，供 AI 答案引擎直接解析「有哪些門診／服務」）
  if (seo.services && seo.services.length) {
    tags.push(jsonLdTag({
      '@context': 'https://schema.org', '@type': 'ItemList',
      itemListElement: seo.services.map((sv, i) => ({
        '@type': 'ListItem', position: i + 1,
        item: { '@type': 'Service', name: sv.name, description: sv.description, provider: { '@type': 'MedicalBusiness', name: siteName } },
      })),
    }));
  }

  // Event（活動型文章）
  if (seo.event) {
    const ev = seo.event;
    tags.push(jsonLdTag({
      '@context': 'https://schema.org', '@type': 'Event',
      name: ev.name, description: ev.description || desc,
      startDate: ev.startDate, endDate: ev.endDate,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      image: [ogImage], url,
      location: {
        '@type': 'Place', name: ev.locationName,
        address: { '@type': 'PostalAddress', streetAddress: ev.streetAddress, addressLocality: ev.addressLocality, addressRegion: ev.addressRegion, addressCountry: ev.addressCountry || 'TW' },
      },
      performer: ev.performer ? { '@type': 'Person', name: ev.performer, url: ev.performerUrl ? abs(ev.performerUrl) : undefined } : undefined,
      organizer: { '@type': 'Organization', name: siteName, url: origin + '/' },
    }));
  }
  return tags.join('\n');
}

// ── sitemap.xml / robots.txt ──
// 網址清單直接由 data/site.json 產生，新增文章、醫師、設備頁後不必手動維護。
function xmlText(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function siteOrigin(site) {
  return String((site.seo && site.seo.siteUrl) || 'https://medirealm-origin.com').replace(/\/$/, '');
}
function buildSitemap(site) {
  const origin = siteOrigin(site);
  const urls = [];
  const add = (loc, lastmod) => urls.push({ loc: origin + loc, lastmod });
  add('/');
  add('/clinics');
  add('/doctors');
  add('/visit');
  add('/knowledge');
  ((site.knowledge && site.knowledge.articles) || []).forEach((a) => {
    add(a.href, a.seo && (a.seo.dateModified || a.seo.datePublished));
  });
  ((site.team && site.team.doctors) || []).forEach((dr) => { if (dr.slug && dr.detail) add('/doctors/' + dr.slug); });
  ((site.departments && site.departments.items) || []).forEach((it) => { if (it.slug) add('/clinics/' + it.slug); });
  add('/privacy', site.policies && site.policies.privacy && site.policies.privacy.updatedDate);
  add('/terms', site.policies && site.policies.terms && site.policies.terms.updatedDate);
  add('/clinics/lifting');
  ((site.lifting && site.lifting.devices) || []).forEach((dv) => { if (dv.id) add('/services/lifting/' + dv.id); });
  add('/appointment');
  add('/clinics/laser');
  ((site.laser && site.laser.devices) || []).forEach((dv) => { if (dv.id) add('/services/laser/' + dv.id); });
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => '  <url><loc>' + xmlText(u.loc) + '</loc>' + (u.lastmod ? '<lastmod>' + xmlText(u.lastmod) + '</lastmod>' : '') + '</url>').join('\n') +
    '\n</urlset>\n';
}

function serveKnowledgePage(res, slug) {
  const file = path.join(PUBLIC_DIR, 'knowledge.html');
  let art = null, site = null;
  if (slug) {
    try {
      site = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      art = ((site.knowledge && site.knowledge.articles) || []).filter((a) => a.id === slug)[0] || null;
    } catch (e) {
      console.error('  [錯誤] 讀取站台資料失敗：', e.message);
    }
  }
  if (!art) return serveFile(res, file);
  fs.readFile(file, 'utf8', (err, html) => {
    if (err) return serveFile(res, file);
    const head = buildKnowledgeHead(site, art);
    // 移除範本裡預設的 title / description，改由文章自己的標籤取代
    html = html
      .replace(/<title>[\s\S]*?<\/title>\s*/i, () => '')
      .replace(/<meta name="description"[^>]*>\s*/i, () => '')
      .replace(/(<meta name="viewport"[^>]*>)/i, (m) => m + '\n' + head);
    html = applyLayout(html, '/knowledge/' + slug, file);
    send(res, 200, html, { 'Content-Type': MIME['.html'] || 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  res.sitePath = url.pathname.replace(/\/+$/, '') || '/'; // 共用導覽列用來標示目前所在頁

  // 站台文案／資料：每次讀檔。瀏覽器可快取 60 秒，過期後先用舊資料、背景再更新
  // （stale-while-revalidate），換頁不用每次等一趟回主機；改完 data/site.json
  // 最多約 1 分鐘（再多一次換頁）前台就會看到。ETag 讓重新驗證時沒變就回 304。
  if (url.pathname === '/api/site') {
    return fs.stat(DATA_FILE, (statErr, st) => {
      const etag = statErr ? '' : '"' + st.size.toString(36) + '-' + Math.floor(st.mtimeMs).toString(36) + '"';
      const cacheHeaders = { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=600' };
      if (etag) cacheHeaders.ETag = etag;
      // Cloudflare 壓縮後會把 ETag 改成弱驗證 W/"..."，比對時去掉前綴
      const inm = String(req.headers['if-none-match'] || '').replace(/^W\//, '');
      if (etag && inm === etag) {
        res.writeHead(304, cacheHeaders);
        return res.end();
      }
      fs.readFile(DATA_FILE, 'utf8', (err, txt) => {
        if (err) {
          return send(res, 500, JSON.stringify({ error: 'site.json 讀取失敗' }), {
            'Content-Type': MIME['.json'], 'Cache-Control': 'no-cache',
          });
        }
        send(res, 200, txt, Object.assign({ 'Content-Type': MIME['.json'] }, cacheHeaders));
      });
    });
  }

  // 預約表單：附加寫入 data/bookings.jsonl（一行一筆）
  if (url.pathname === '/api/booking') {
    if (req.method !== 'POST') {
      return send(res, 405, JSON.stringify({ error: 'Method Not Allowed' }), {
        'Content-Type': MIME['.json'], 'Allow': 'POST', 'Cache-Control': 'no-cache',
      });
    }
    let body = '';
    let tooBig = false;
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 8 * 1024) { tooBig = true; req.destroy(); }
    });
    req.on('end', () => {
      if (tooBig) return;
      let data;
      try { data = JSON.parse(body); } catch {
        return send(res, 400, JSON.stringify({ error: '格式錯誤' }), {
          'Content-Type': MIME['.json'], 'Cache-Control': 'no-cache',
        });
      }
      const clean = (v, max) => String(v == null ? '' : v).slice(0, max).trim();
      const record = {
        at: new Date().toISOString(),
        name: clean(data.name, 60),
        phone: clean(data.phone, 40),
        clinic: clean(data.clinic, 60),
        topic: clean(data.topic, 60),
        note: clean(data.note, 1000),
      };
      if (!record.name || !record.phone) {
        return send(res, 400, JSON.stringify({ error: '姓名與電話為必填' }), {
          'Content-Type': MIME['.json'], 'Cache-Control': 'no-cache',
        });
      }
      fs.appendFile(BOOKINGS_FILE, JSON.stringify(record) + '\n', (err) => {
        if (err) {
          console.error('  [錯誤] 預約寫入失敗：', err.message);
          return send(res, 500, JSON.stringify({ error: '寫入失敗' }), {
            'Content-Type': MIME['.json'], 'Cache-Control': 'no-cache',
          });
        }
        console.log(`  [預約] ${record.at}　${record.name}　${record.phone}　${record.clinic}　${record.topic}`);
        send(res, 200, JSON.stringify({ ok: true }), {
          'Content-Type': MIME['.json'], 'Cache-Control': 'no-cache',
        });
      });
    });
    return;
  }

  // 線上預約頁：結構化預約資料（JSONL 持久化）
  if (url.pathname === '/api/appointments') {
    if (req.method !== 'POST') {
      return send(res, 405, JSON.stringify({ error: 'Method Not Allowed' }), {
        'Content-Type': MIME['.json'], 'Allow': 'POST', 'Cache-Control': 'no-cache',
      });
    }
    const rateNow = Date.now();
    // Replit 反向代理不提供不可偽造的客戶端 IP，因此採全站固定視窗：
    // 高容量請求上限保護程序，成功寫入另設較低上限保護儲存。
    if (rateNow - appointmentRateWindow.startedAt > 10 * 60 * 1000) {
      appointmentRateWindow = { startedAt: rateNow, requests: 0, writes: 0 };
    }
    appointmentRateWindow.requests += 1;
    if (appointmentRateWindow.requests > 600) {
      return send(res, 429, JSON.stringify({ error: '送出次數過多，請稍後再試' }), {
        'Content-Type': MIME['.json'], 'Cache-Control': 'no-cache', 'Retry-After': '600',
      });
    }
    let body = '';
    let tooBig = false;
    req.on('data', (chunk) => {
      if (tooBig) return;
      body += chunk;
      if (body.length > 32 * 1024) { tooBig = true; body = ''; }
    });
    req.on('end', () => {
      if (tooBig) {
        return send(res, 413, JSON.stringify({ error: '預約資料超過大小限制' }), {
          'Content-Type': MIME['.json'], 'Cache-Control': 'no-cache',
        });
      }
      let data;
      try { data = JSON.parse(body); } catch {
        return send(res, 400, JSON.stringify({ error: '預約資料格式錯誤' }), {
          'Content-Type': MIME['.json'], 'Cache-Control': 'no-cache',
        });
      }
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return send(res, 400, JSON.stringify({ error: '預約資料格式錯誤' }), {
          'Content-Type': MIME['.json'], 'Cache-Control': 'no-cache',
        });
      }
      const clean = (v, max) => String(v == null ? '' : v).slice(0, max).trim();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dateText = clean(data.appointmentDate, 10);
      const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText);
      let chosenDate = null;
      if (dateMatch) {
        const year = Number(dateMatch[1]), month = Number(dateMatch[2]), day = Number(dateMatch[3]);
        const candidate = new Date(year, month - 1, day);
        if (candidate.getFullYear() === year && candidate.getMonth() === month - 1 && candidate.getDate() === day) chosenDate = candidate;
      }
      const phone = clean(data.phone, 20);
      const email = clean(data.email, 120);
      const treatments = Array.isArray(data.treatments) ? data.treatments.slice(0, 20)
        .filter((input) => input && typeof input === 'object' && !Array.isArray(input))
        .map((input) => {
        const configured = appointmentTreatmentMap.get(clean(input.id, 60));
        if (!configured) return null;
        const optionMap = new Map((configured.options || []).map((o) => [o.id, o]));
        const options = Array.isArray(input.options) ? input.options.slice(0, 10)
          .filter((o) => o && typeof o === 'object' && !Array.isArray(o))
          .map((o) => optionMap.get(clean(o.id, 60))).filter(Boolean)
          .map((o) => ({ id: o.id, name: o.name, price: o.price })) : [];
        return { id: configured.id, name: configured.name, price: configured.price == null ? null : configured.price, options };
      }).filter(Boolean) : [];
      const record = {
        id: crypto.randomUUID(),
        appointmentDate: dateText,
        preferredTime: clean(data.preferredTime, 20),
        name: clean(data.name, 60),
        phone,
        email,
        lineId: clean(data.lineId, 80),
        treatments,
        source: Array.isArray(data.source) ? data.source.slice(0, 10).map((v) => clean(v, 60)).filter(Boolean) : [],
        sourceOther: clean(data.sourceOther, 120),
        note: clean(data.note, 1200),
        privacyConsent: data.privacyConsent === true,
        submittedAt: new Date().toISOString(),
      };
      if (clean(data.website, 120)) {
        return send(res, 400, JSON.stringify({ error: '無法處理此預約' }), {
          'Content-Type': MIME['.json'], 'Cache-Control': 'no-cache',
        });
      }
      const hair = treatments.find((t) => t.id === 'ipl-hair-removal');
      const botox = treatments.find((t) => t.id === 'botox-wrinkle');
      let error = '';
      if (!treatments.length) error = '請選擇希望預約的療程';
      else if (!chosenDate || chosenDate < today) error = '請選擇有效的預約日期';
      else if (!['morning', 'afternoon', 'evening', 'any'].includes(record.preferredTime)) error = '請選擇希望預約時段';
      else if (!record.name) error = '請填寫姓名';
      else if (!/^09\d{8}$/.test(phone)) error = '請填寫正確的台灣手機號碼';
      else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) error = 'Email 格式不正確';
      else if (hair && !hair.options.length) error = '請選擇除毛部位';
      else if (botox && botox.options.length !== 1) error = '請選擇一個肉毒方案';
      else if (!record.privacyConsent) error = '請同意聯絡資訊使用說明';
      if (error) {
        return send(res, 400, JSON.stringify({ error }), {
          'Content-Type': MIME['.json'], 'Cache-Control': 'no-cache',
        });
      }
      const fingerprint = `${record.phone}|${record.appointmentDate}|${treatments.map((t) => t.id).sort().join(',')}`;
      const now = Date.now();
      for (const [key, time] of recentAppointments) if (now - time > 60000) recentAppointments.delete(key);
      if (recentAppointments.has(fingerprint)) {
        return send(res, 409, JSON.stringify({ error: '此預約已送出，請勿重複提交' }), {
          'Content-Type': MIME['.json'], 'Cache-Control': 'no-cache',
        });
      }
      if (appointmentRateWindow.writes >= 120) {
        return send(res, 429, JSON.stringify({ error: '目前預約量較大，請稍後再試' }), {
          'Content-Type': MIME['.json'], 'Cache-Control': 'no-cache', 'Retry-After': '600',
        });
      }
      recentAppointments.set(fingerprint, now);
      appointmentRateWindow.writes += 1;
      fs.appendFile(APPOINTMENTS_FILE, JSON.stringify(record) + '\n', (err) => {
        if (err) {
          recentAppointments.delete(fingerprint);
          appointmentRateWindow.writes = Math.max(0, appointmentRateWindow.writes - 1);
          console.error('  [錯誤] 線上預約寫入失敗：', err.message);
          return send(res, 500, JSON.stringify({ error: '預約資料暫時無法儲存，請稍後再試' }), {
            'Content-Type': MIME['.json'], 'Cache-Control': 'no-cache',
          });
        }
        console.log(`  [線上預約] ${record.id} 已儲存`);
        send(res, 201, JSON.stringify({ ok: true }), {
          'Content-Type': MIME['.json'], 'Cache-Control': 'no-cache',
        });
      });
    });
    return;
  }

  if (url.pathname === '/appointment') {
    return serveFile(res, path.join(PUBLIC_DIR, 'appointment.html'));
  }

  // 電音波拉提列表頁：統一改用 /clinics/lifting，與其他六大門診網址格式一致；
  // 舊網址 /services/lifting 保留 302 轉址，避免外部連結或書籤失效
  if (url.pathname === '/services/lifting') {
    return send(res, 302, '', { Location: '/clinics/lifting', 'Cache-Control': 'no-cache' });
  }
  if (url.pathname === '/clinics/lifting') {
    return serveFile(res, path.join(PUBLIC_DIR, 'lifting.html'));
  }
  // 雷射光療列表頁：同樣統一改用 /clinics/laser；舊網址 /services/laser 保留 302 轉址
  if (url.pathname === '/services/laser') {
    return send(res, 302, '', { Location: '/clinics/laser', 'Cache-Control': 'no-cache' });
  }
  if (url.pathname === '/clinics/laser') {
    return serveFile(res, path.join(PUBLIC_DIR, 'lifting.html'));
  }

  // 電音波拉提設備詳細頁：/services/lifting/<slug>（未知 slug 一律導回列表頁）
  if (url.pathname.startsWith('/services/lifting/')) {
    const slug = url.pathname.slice('/services/lifting/'.length);
    let valid = false;
    let site = null;
    let device = null;
    try {
      site = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      const devices = (site.lifting && site.lifting.devices) || [];
      device = devices.find((d) => d.id === slug) || null;
      valid = Boolean(device);
    } catch (e) {
      console.error('  [錯誤] 讀取站台資料失敗：', e.message);
    }
    if (valid) return serveDeviceFile(res, site, device, url.pathname, req);
    return send(res, 302, '', { Location: '/clinics/lifting', 'Cache-Control': 'no-cache' });
  }
  if (url.pathname.startsWith('/services/laser/')) {
    const slug = url.pathname.slice('/services/laser/'.length);
    let valid = false;
    let site = null;
    let device = null;
    try {
      site = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      const devices = (site.laser && site.laser.devices) || [];
      device = devices.find((d) => d.id === slug) || null;
      valid = Boolean(device);
    } catch (e) {
      console.error('  [錯誤] 讀取站台資料失敗：', e.message);
    }
    if (valid) return serveDeviceFile(res, site, device, url.pathname, req);
    return send(res, 302, '', { Location: '/clinics/laser', 'Cache-Control': 'no-cache' });
  }

  // 網站政策頁：/privacy、/terms
  if (url.pathname === '/privacy' || url.pathname === '/terms') {
    return serveFile(res, path.join(PUBLIC_DIR, 'policy.html'));
  }

  // 六大門診總覽頁：/clinics（海報總覽圖＋六個門診卡片，各卡片連到下面的獨立分頁）
  if (url.pathname === '/clinics' || url.pathname === '/clinics/') {
    return serveFile(res, path.join(PUBLIC_DIR, 'clinics.html'));
  }

  // 六大門診詳細頁：/clinics/<slug>（未知 slug 一律導回六大門診總覽頁）
  if (url.pathname.startsWith('/clinics/')) {
    const slug = url.pathname.slice('/clinics/'.length).replace(/\/$/, '');
    let valid = false;
    try {
      const site = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      const deps = (site.departments && site.departments.items) || [];
      valid = deps.some((it) => it.slug === slug);
    } catch (e) {
      console.error('  [錯誤] 讀取站台資料失敗：', e.message);
    }
    if (valid) return serveFile(res, path.join(PUBLIC_DIR, 'department.html'));
    return send(res, 302, '', { Location: '/clinics', 'Cache-Control': 'no-cache' });
  }

  // 院所資訊頁：/visit（導覽列「院所位置」：地圖、看診時間、交通、初診流程）
  if (url.pathname === '/visit' || url.pathname === '/visit/') {
    return serveFile(res, path.join(PUBLIC_DIR, 'visit.html'));
  }

  // 醫療團隊列表頁：/doctors（首頁醫師跑馬燈下方「認識全部醫師」按鈕的目的地）
  if (url.pathname === '/doctors' || url.pathname === '/doctors/') {
    return serveFile(res, path.join(PUBLIC_DIR, 'doctors.html'));
  }

  // 醫師詳細頁：/doctors/<slug>（未知 slug 一律導回醫療團隊列表頁）
  if (url.pathname.startsWith('/doctors/')) {
    const slug = url.pathname.slice('/doctors/'.length);
    let valid = false;
    try {
      const site = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      const doctors = (site.team && site.team.doctors) || [];
      valid = doctors.some((dr) => dr.slug === slug && dr.detail);
    } catch (e) {
      console.error('  [錯誤] 讀取站台資料失敗：', e.message);
    }
    if (valid) return serveFile(res, path.join(PUBLIC_DIR, 'doctor.html'));
    return send(res, 302, '', { Location: '/doctors', 'Cache-Control': 'no-cache' });
  }

  // 醫境知識：/knowledge 與 /knowledge/<slug> 皆由 knowledge.html 呈現
  if (url.pathname === '/knowledge' || url.pathname.startsWith('/knowledge/')) {
    let slug = '';
    try { slug = decodeURIComponent(url.pathname.replace(/^\/knowledge\/?/, '').replace(/\/$/, '')); } catch (e) { slug = ''; }
    return serveKnowledgePage(res, slug);
  }

  // 注意：robots.txt 不封鎖 /api/，因為頁面內容是由前端呼叫 /api/site 載入，封鎖會讓搜尋引擎看不到內容
  if (url.pathname === '/robots.txt' || url.pathname === '/sitemap.xml') {
    let site = {};
    try { site = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) { console.error('  [錯誤] 讀取站台資料失敗：', e.message); }
    if (url.pathname === '/sitemap.xml') {
      return send(res, 200, buildSitemap(site), { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-cache' });
    }
    return send(res, 200, 'User-agent: *\nAllow: /\n\nSitemap: ' + siteOrigin(site) + '/sitemap.xml\n', { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' });
  }

  if (url.pathname === '/healthz') {
    return send(res, 200, 'ok', { 'Content-Type': 'text/plain', 'Cache-Control': 'no-cache' });
  }

  // 靜態檔案（阻擋路徑穿越）
  let rel;
  try {
    rel = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  } catch {
    return send(res, 400, '400 Bad Request', { 'Content-Type': 'text/plain', 'Cache-Control': 'no-cache' });
  }

  const filePath = path.normalize(path.join(PUBLIC_DIR, rel));
  // 結尾要補 path.sep，否則 public 之外的同前綴目錄（如 public_backup）會被誤放行
  if (filePath !== PUBLIC_DIR && !filePath.startsWith(PUBLIC_DIR + path.sep)) {
    return send(res, 403, '403 Forbidden', { 'Content-Type': 'text/plain', 'Cache-Control': 'no-cache' });
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      return serveFile(res, path.join(PUBLIC_DIR, 'index.html')); // SPA fallback
    }
    serveFile(res, filePath);
  });
});

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('  纖顏醫境 XIAN YAN · MEDIREALM');
  console.log(`  ▸ http://localhost:${PORT}`);
  console.log('  ▸ 站台文案：data/site.json（改完重新整理即可生效）');
  console.log('');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  [錯誤] 連接埠 ${PORT} 已被占用（請確認沒有其他服務在跑）。`);
    console.error(`  可改用：$env:PORT=4000; npm start\n`);
    process.exit(1);
  }
  throw err;
});
