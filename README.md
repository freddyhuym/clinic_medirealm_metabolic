# 雲纖醫境 YUN XIAN — 代謝美學診所官網

零依賴 Node.js 伺服器 + 原生前端（無需 build、無需 `npm install`）。

## 啟動

```powershell
cd C:\Users\User\Clinic\clinic_medirealm_metabolic
npm start          # → http://localhost:3309
```

換連接埠：

```powershell
$env:PORT=4000; npm start
```

## 改內容：只要編輯 `data/site.json`

**整站文案、服務項目、據點、醫師介紹、營業時間全部集中在這一個檔案。**
改完存檔，重新整理頁面即可生效 —— 不用重啟伺服器、不用改任何 HTML/CSS/JS。

| 想改什麼 | 改 `site.json` 的哪一段 |
|---|---|
| 品牌標語、關鍵字 | `brand` |
| 首頁大圖與標題 | `hero` |
| 品牌理念文案 | `about` |
| 四大核心價值 | `values.items` |
| 服務項目（六大類） | `services.items` |
| 醫師介紹 | `doctor` |
| 各館據點、地址 | `locations.items` |
| 醫旅送禮提案 | `gifts` |
| 營業時間、LINE、電話 | `contact` |
| 頁尾與免責聲明 | `footer` |
| 導覽列選單 | `nav` |

### 據點的 `status` 會影響外觀

- `flagship` — 深綠底卡片，標記「旗艦館」
- `open` — 一般卡片，標記「營運中」
- `preparing` — 標記「籌備中」，且**不會出現在預約表單的據點下拉選單**

### 換圖片

把檔案放進 `public/images/`，再到 `site.json` 改路徑即可。

## 網站結構

```
導覽列（固定、捲動高亮）
├─ 主視覺        #top
├─ 品牌理念      #about
├─ 四大核心價值  #values
├─ 服務項目      #services
├─ 醫療團隊      #doctor
├─ 全台據點      #locations
├─ 醫旅禮遇      #gifts
├─ 預約諮詢      #contact
└─ 頁尾
```

## 端點

| 路徑 | 說明 |
|---|---|
| `/` | 官網首頁 |
| `/api/site` | 站台資料 JSON（每次請求即時讀檔） |
| `/api/booking` | `POST` 預約表單，附加寫入 `data/bookings.jsonl` |
| `/healthz` | 健康檢查 |

## ⚠️ 預約表單的資料處理

表單送出後會**以純文字附加寫入 `data/bookings.jsonl`**（一行一筆 JSON）。

正式上線前請務必確認以下幾點：

1. **這個檔案含有患者姓名與電話**（個資）。請確認檔案權限、備份策略與保存期限，並確保它不會被 git 追蹤或對外提供下載。
2. **沒有通知機制** —— 不會寄信也不會發 LINE，需要有人定期去看這個檔案。建議接上通知或 CRM。
3. **沒有防濫發保護** —— 沒有驗證碼、沒有速率限制。對外開放後可能會收到機器人灌入的假預約。

## 配色（品牌手冊）

| Token | 色值 | 說明 |
|---|---|---|
| 玉石綠 | `#2E4A35` / `#4A6B50` | 自然・療癒 |
| 雲霧灰 | `#C3C9C0` / `#E2E6DE` | 純淨・平衡 |
| 香檳金 | `#C6A76B` / `#A5854A` | 高級・優雅 |
| 銀白 | `#FAF8F3` / `#FFFFFF` | 科技・專業 |

色票都定義在 `public/styles.css` 的 `:root`。

## 檔案結構

```
clinic_medirealm_metabolic/
├── server.js              # 靜態伺服器 + /api/site + /api/booking
├── data/
│   ├── site.json          # ← 唯一需要維護的內容檔
│   └── bookings.jsonl     # 預約紀錄（執行後自動產生）
└── public/
    ├── index.html
    ├── styles.css         # 品牌色票都在 :root
    ├── app.js             # 由 site.json 驅動全站渲染
    └── images/
        ├── logo.png
        ├── hero-team.jpg
        ├── doctor-chiu.jpg
        ├── gift-tote.jpg
        └── gift-01~04.jpg
```
