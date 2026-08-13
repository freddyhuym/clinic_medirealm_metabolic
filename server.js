/**
 * 纖顏醫境 XIAN YAN · MEDIREALM — 都會代謝美學官網
 * 零依賴靜態伺服器 + /api/site
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 3309;
// 不指定 host：Node 預設以雙堆疊監聽（IPv4 0.0.0.0 + IPv6 ::1），
// 避免瀏覽器把 localhost 解析成 ::1 時連不上。
const HOST = process.env.HOST || undefined;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_FILE = path.join(__dirname, 'data', 'site.json');
const BOOKINGS_FILE = path.join(__dirname, 'data', 'bookings.jsonl');

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
    send(res, 200, buf, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': LONG_CACHE.has(ext) ? 'public, max-age=2592000' : 'no-cache',
    });
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // 站台文案／資料：每次讀檔，改完 data/site.json 重新整理即可生效
  if (url.pathname === '/api/site') {
    return fs.readFile(DATA_FILE, 'utf8', (err, txt) => {
      if (err) {
        return send(res, 500, JSON.stringify({ error: 'site.json 讀取失敗' }), {
          'Content-Type': MIME['.json'], 'Cache-Control': 'no-cache',
        });
      }
      send(res, 200, txt, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-cache' });
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

  // 醫療服務：電音波拉提設備瀏覽頁
  if (url.pathname === '/services/lifting') {
    return serveFile(res, path.join(PUBLIC_DIR, 'lifting.html'));
  }

  // 電音波拉提設備詳細頁：/services/lifting/<slug>（未知 slug 一律導回列表頁）
  if (url.pathname.startsWith('/services/lifting/')) {
    const slug = url.pathname.slice('/services/lifting/'.length);
    let valid = false;
    try {
      const site = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      const devices = (site.lifting && site.lifting.devices) || [];
      valid = devices.some((d) => d.id === slug);
    } catch (e) {
      console.error('  [錯誤] 讀取站台資料失敗：', e.message);
    }
    if (valid) return serveFile(res, path.join(PUBLIC_DIR, 'device.html'));
    return send(res, 302, '', { Location: '/services/lifting', 'Cache-Control': 'no-cache' });
  }

  // 醫師詳細頁：/doctors/<slug>（未知 slug 一律導回首頁醫療團隊）
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
    return send(res, 302, '', { Location: '/#team', 'Cache-Control': 'no-cache' });
  }

  // 文章列表：/articles
  if (url.pathname === '/articles' || url.pathname === '/articles/') {
    return serveFile(res, path.join(PUBLIC_DIR, 'articles.html'));
  }

  // 醫境知識：/knowledge 與 /knowledge/<slug> 皆由 knowledge.html 呈現
  if (url.pathname === '/knowledge' || url.pathname.startsWith('/knowledge/')) {
    return serveFile(res, path.join(PUBLIC_DIR, 'knowledge.html'));
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
