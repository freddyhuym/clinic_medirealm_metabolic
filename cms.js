/**
 * 醫境知識文章：從 Payload CMS（clinic-payload 的 metabolic-articles）讀取已發布文章，
 * 轉成網站原本 site.json 的文章格式，與 site.json 內的舊文章合併後給前台使用。
 *
 * - 每 60 秒背景同步一次；後台儲存時 Payload 會呼叫 /api/cms-revalidate 立即同步。
 * - CMS 連不上時沿用上次成功的資料，網站其餘內容（site.json）照常顯示。
 * - 圖片透過 /cms-media/<檔名> 代理，網址維持在本站網域下。
 * 零依賴：只用 Node 內建模組與全域 fetch（Node 18+）。
 */
const crypto = require('crypto');

const CMS_URL = String(process.env.CMS_URL || 'http://127.0.0.1:3302').replace(/\/$/, '');
const REFRESH_MS = 60 * 1000;

let state = { articles: [], categories: [], ok: false, fetchedAt: 0, error: '' };
let inflight = null;

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ── YouTube：各種網址格式 → 嵌入網址 ── */
function youtubeId(url) {
  const s = String(url || '').trim();
  const m = s.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : '';
}
function youtubeEmbed(url) {
  const id = youtubeId(url);
  return id ? 'https://www.youtube.com/embed/' + id : '';
}

/* ── 圖片：Payload 的 /api/metabolic-media/file/<name> → 本站 /cms-media/<name> ── */
function mediaUrl(doc, size) {
  if (!doc || typeof doc !== 'object') return '';
  const pick = (size && doc.sizes && doc.sizes[size] && doc.sizes[size].filename) || doc.filename;
  return pick ? '/cms-media/' + encodeURIComponent(pick) : '';
}

/* ── Lexical（Payload 內文）→ 網站文章區塊 ── */
const FORMAT = { bold: 1, italic: 2, strike: 4, underline: 8 };
function inlineHTML(nodes) {
  return (nodes || []).map((n) => {
    if (!n) return '';
    if (n.type === 'text') {
      let t = esc(n.text || '').replace(/\n/g, '<br>');
      const f = n.format || 0;
      if (f & FORMAT.bold) t = '<strong>' + t + '</strong>';
      if (f & FORMAT.italic) t = '<em>' + t + '</em>';
      if (f & FORMAT.underline) t = '<u>' + t + '</u>';
      if (f & FORMAT.strike) t = '<s>' + t + '</s>';
      return t;
    }
    if (n.type === 'linebreak') return '<br>';
    if (n.type === 'link' || n.type === 'autolink') {
      const fields = n.fields || {};
      let href = fields.url || '';
      if (fields.linkType === 'internal' && fields.doc && fields.doc.value && fields.doc.value.slug) {
        href = '/knowledge/' + fields.doc.value.slug;
      }
      const inner = inlineHTML(n.children);
      if (!/^(https?:|mailto:|tel:|\/|#)/i.test(href)) return inner; // 擋掉 javascript: 等不安全連結
      const blank = fields.newTab ? ' target="_blank" rel="noopener noreferrer"' : '';
      return '<a href="' + esc(href) + '"' + blank + '>' + inner + '</a>';
    }
    return inlineHTML(n.children);
  }).join('');
}
function plainText(nodes) {
  return (nodes || []).map((n) => (n.type === 'text' ? n.text || '' : plainText(n.children))).join('');
}
function listHTML(node) {
  const tag = node.listType === 'number' ? 'ol' : 'ul';
  const items = (node.children || []).map((li) => {
    const nested = (li.children || []).filter((c) => c.type === 'list').map(listHTML).join('');
    const own = inlineHTML((li.children || []).filter((c) => c.type !== 'list'));
    return (own || nested) ? '<li>' + own + nested + '</li>' : '';
  }).join('');
  return '<' + tag + ' class="kn-body-list">' + items + '</' + tag + '>';
}
function lexicalToBlocks(content) {
  const root = content && content.root;
  const blocks = [];
  (root && root.children || []).forEach((n) => {
    if (n.type === 'paragraph') {
      const html = inlineHTML(n.children);
      if (html.replace(/<br>/g, '').trim()) blocks.push({ type: 'html', html: '<p>' + html + '</p>' });
    } else if (n.type === 'heading') {
      const text = plainText(n.children).trim();
      if (text) blocks.push({ type: n.tag === 'h3' || n.tag === 'h4' ? 'h3' : 'h2', text });
    } else if (n.type === 'list') {
      blocks.push({ type: 'html', html: listHTML(n) });
    } else if (n.type === 'quote') {
      const text = plainText(n.children).trim();
      if (text) blocks.push({ type: 'highlight', text });
    } else if (n.type === 'horizontalrule') {
      blocks.push({ type: 'html', html: '<hr class="kn-body-hr">' });
    } else if (n.type === 'upload' && n.value) {
      const src = mediaUrl(n.value, 'large');
      if (src) blocks.push({ type: 'image', src, alt: n.value.alt || '' });
    } else if (n.type === 'block' && n.fields) {
      const f = n.fields;
      if (f.blockType === 'metabolicYoutube') {
        const src = youtubeEmbed(f.url);
        if (src) blocks.push({ type: 'video', src, title: f.title || 'YouTube 影片' });
      } else if (f.blockType === 'metabolicFaq') {
        const items = (f.items || []).filter((it) => it && it.question && it.answer).map((it) => ({ question: it.question, answer: it.answer }));
        if (items.length) blocks.push({ type: 'faq', title: f.title || '常見問題 FAQ', items });
      } else if (f.blockType === 'metabolicCta') {
        const href = String(f.href || '');
        if (f.text) blocks.push({ type: 'cta', text: f.text, label: f.label || '了解更多', href: /^(https?:|\/)/i.test(href) ? href : '' });
      } else if (f.blockType === 'metabolicMedia' && f.media) {
        const src = mediaUrl(f.media, 'large');
        if (src) blocks.push({ type: 'image', src, alt: f.media.alt || '', caption: f.caption || '' });
      }
    }
  });
  return blocks;
}

/* ── 一篇 Payload 文章 → site.json 文章格式 ── */
function ymd(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return '';
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(dt);
}
function toArticle(doc) {
  const cats = (doc.categories || []).filter((c) => c && typeof c === 'object');
  const hero = doc.heroImage && typeof doc.heroImage === 'object' ? doc.heroImage : null;
  const body = [];
  const mainVideo = youtubeEmbed(doc.youtubeUrl);
  if (mainVideo) body.push({ type: 'video', src: mainVideo, title: doc.youtubeTitle || doc.title });
  lexicalToBlocks(doc.content).forEach((b) => body.push(b));
  const seo = {
    datePublished: ymd(doc.publishedAt || doc.createdAt),
    // 只有編輯填了「內容更新日期」才算更新；不用 updatedAt，避免改個錯字就顯示成今天更新
    dateModified: ymd(doc.updatedDate || doc.publishedAt || doc.createdAt),
  };
  if (doc.metaTitle) seo.title = doc.metaTitle;
  if (doc.metaDescription) seo.description = doc.metaDescription;
  if (doc.keywords) seo.keywords = String(doc.keywords).split(/[,，、]/).map((s) => s.trim()).filter(Boolean);
  if (doc.author) seo.author = doc.author;
  if (doc.authorTitle) seo.authorTitle = doc.authorTitle;
  if (doc.source) seo.source = doc.source;
  const ogDoc = doc.ogImage && typeof doc.ogImage === 'object' ? doc.ogImage : null;
  const og = ogDoc ? mediaUrl(ogDoc) : mediaUrl(hero, 'og');
  if (og) seo.ogImage = og;
  const heroMobile = doc.heroImageMobile && typeof doc.heroImageMobile === 'object' ? doc.heroImageMobile : null;
  return {
    id: doc.slug,
    source: 'cms',
    category: cats[0] ? cats[0].title : '醫境知識',
    categories: cats.map((c) => c.title),
    title: doc.title,
    titleEn: doc.titleEn || '',
    hook: doc.hook || doc.excerpt || '',
    excerpt: doc.excerpt || '',
    image: mediaUrl(hero, 'large'),
    imageAlt: (hero && hero.alt) || doc.title,
    imageMobile: heroMobile ? mediaUrl(heroMobile, 'large') : undefined,
    cta: doc.cardCta || '閱讀完整文章 →',
    href: '/knowledge/' + doc.slug,
    seo,
    body,
    publishedAt: doc.publishedAt || doc.createdAt,
  };
}

/* ── 同步 ── */
async function getJSON(path) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(CMS_URL + path, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + path.split('?')[0]);
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}
function refresh() {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const [arts, cats] = await Promise.all([
        getJSON('/api/metabolic-articles?where[_status][equals]=published&depth=2&limit=200&sort=-publishedAt'),
        getJSON('/api/metabolic-categories?limit=100&sort=sortOrder'),
      ]);
      const now = Date.now();
      const articles = (arts.docs || [])
        .filter((d) => d && d.slug && (!d.publishedAt || new Date(d.publishedAt).getTime() <= now))
        .map(toArticle);
      const categories = (cats.docs || []).map((c) => ({ title: c.title, titleEn: c.titleEn || '', slug: c.slug }));
      if (!state.ok || state.error) console.log('  [CMS] 已同步醫境知識文章 ' + articles.length + ' 篇（' + CMS_URL + '）');
      state = { articles, categories, ok: true, fetchedAt: now, error: '' };
    } catch (e) {
      const msg = e && e.name === 'AbortError' ? '逾時' : (e && e.message) || String(e);
      if (state.error !== msg) console.error('  [CMS] 文章同步失敗，沿用上次資料：' + msg);
      state = Object.assign({}, state, { error: msg });
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
function start() {
  refresh();
  setInterval(refresh, REFRESH_MS).unref();
}

/* ── 合併到 site.json：CMS 文章在前（新到舊），同 id 以 CMS 為準 ── */
function mergeSite(site) {
  if (!site || !state.articles.length && !state.categories.length) return site;
  const k = site.knowledge || {};
  const cmsIds = new Set(state.articles.map((a) => a.id));
  // 撰稿醫師：和醫師團隊同名時自動連到醫師介紹頁（「邱文瑾」對應「邱文瑾 醫師」）
  const doctors = (site.team && site.team.doctors) || [];
  const articles = state.articles.map((a) => {
    const name = a.seo && a.seo.author;
    if (!name || a.seo.authorUrl) return a;
    const dr = doctors.filter((d) => String(d.name || '').replace(/\s*醫師$/, '') === String(name).replace(/\s*醫師$/, ''))[0];
    return dr && dr.href ? Object.assign({}, a, { seo: Object.assign({}, a.seo, { authorUrl: dr.href }) }) : a;
  });
  const legacy = (k.articles || []).filter((a) => !cmsIds.has(a.id));
  return Object.assign({}, site, {
    knowledge: Object.assign({}, k, {
      articles: articles.concat(legacy),
      categories: state.categories,
    }),
  });
}

/* ── /cms-media/<檔名>：代理 Payload 圖片 ── */
async function serveMedia(res, name) {
  if (!/^[\w.\-%() ]+$/.test(name) || name.indexOf('..') >= 0) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    return res.end('bad name');
  }
  try {
    const r = await fetch(CMS_URL + '/api/metabolic-media/file/' + encodeURIComponent(decodeURIComponent(name)));
    if (!r.ok) {
      res.writeHead(r.status === 404 ? 404 : 502, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-cache' });
      return res.end('not found');
    }
    const buf = Buffer.from(await r.arrayBuffer());
    res.writeHead(200, {
      'Content-Type': r.headers.get('content-type') || 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400',
    });
    res.end(buf);
  } catch (e) {
    res.writeHead(502, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-cache' });
    res.end('cms unavailable');
  }
}

function secretMatches(given) {
  const expected = process.env.CMS_REVALIDATE_SECRET || '';
  if (!expected) return false;
  const a = Buffer.from(String(given || ''));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { start, refresh, mergeSite, serveMedia, secretMatches, status: () => state, _test: { lexicalToBlocks, youtubeEmbed, toArticle } };
