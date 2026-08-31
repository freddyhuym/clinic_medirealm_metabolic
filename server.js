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
