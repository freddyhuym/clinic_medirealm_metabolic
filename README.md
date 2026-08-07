# 纖顏醫境 XIAN YAN · MEDIREALM — 都會代謝美學官網

零依賴 Node.js 伺服器 + 原生前端（無需 build、無需 `npm install`）。

## 品牌架構

**纖顏醫境體系**（醫境醫療集團旗下・都會型代謝美學連鎖）

- 初纖顏醫境診所・台北信義館 — 都會輕醫美 × 體態
- 沐纖顏醫境診所・台北中正館 — 代謝 × 預防醫學
- 森纖顏醫境診所・新北新莊館 — 生活圈代謝 × 體態 × 美學

## 啟動

```bash
npm start          # → http://localhost:3309（或用 PORT 環境變數指定）
```

## 改內容：只要編輯 `data/site.json`

**整站文案、三大院所、醫療團隊、營業時間全部集中在這一個檔案。**
改完存檔、重新整理瀏覽器即可生效。

## 檔案結構

- `server.js` — 靜態伺服器 + `/api/site` + `/api/booking`
- `data/site.json` — 全站內容資料
- `data/bookings.jsonl` — 預約表單紀錄
- `public/` — 前端（index.html / styles.css / app.js / images）
