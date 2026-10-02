# M4 正式頁投放前檢查

檢查日期：2026-10-02。結論：**尚未通過正式站投放前檢查，需使用者發佈並完成網域設定核對後再驗證。**

## 正式網址與檢查方式

由部署資料取得正式網址，未猜測網址或自行發佈：

https://clinicmedirealmmetabolic.replit.app/clinics/metabolic-weight-management

部署資料顯示公開部署、目前建置成功，無額外已驗證網域。這不代表新版 M4 已上線。實際以公開 GET 回應、HTML 解析、JSON/XML 解析、資源 MIME 與檔案特徵、正式站畫面截圖核對。

## 正式站結果

| 項目 | 實際結果 | 判定 |
| --- | --- | --- |
| M4 路徑 HTTP | 200、text/html，未轉址；回應為舊版首頁 | 未通過，不能只以 200 判定正常 |
| 首屏 | 截圖顯示「熱門療程」及鳳凰電波、美音二代、彈力針圖片；不是新版 M4 首屏 | 未通過 |
| Title | 初纖顏醫境診所｜都會代謝美學・體態管理・精緻醫美 | 舊版首頁標題 |
| Description | 纖顏醫境以代謝健康、體態管理與精緻美學為核心，由多位醫師共同組成醫療團隊，旗下初纖顏醫境診所位於台北信義，依不同需求提供專業醫療評估與健康美學管理方向。 | 非新版 M4 描述 |
| OG | og:title、og:description 為首頁內容，無 og:url、og:image | 未通過 |
| Canonical | `https://medirealm-metabolic.com/` | 指向另一網域首頁，不是已確認的正式 M4 頁 |
| Robots | 200，`User-agent: *`、`Allow: /`；無頁面 meta robots 或 HTTP X-Robots-Tag 禁止指令 | 允許爬取，但 sitemap 宣告指向另一網域 |
| Robots sitemap 宣告 | `https://medirealm-origin.com/sitemap.xml` | 與已確認正式網域不一致 |
| Sitemap | 200、application/xml，XML 可解析；URL 使用 `https://medirealm-origin.com`；缺少 M4 頁 | 未通過 |
| JSON-LD | 現有 MedicalOrganization 可解析；缺少 WebPage、BreadcrumbList、FAQPage | 未通過 |
| FAQ | 原始回應無新版 9 題 FAQ，也無 FAQPage | 無法在正式新版上核對一致性 |
| 四組關鍵字 | 原始 HTML 正文未出現不復胖、代謝減重門診、M4代謝、醫境 M4 四軸代謝 | 尚未上線 |

### 新版資源在正式站的結果

下列 URL 全部回傳 HTTP 200，但 Content-Type 是 `text/html`，內容開頭是 `<!DOCTYPE ht…`，不是所要求的圖片或 CSS。這是首頁替代回應，不能視為資源載入成功：

- `/images/clinics/m4/hero-refined-desktop.webp`
- `/images/clinics/m4/hero-refined-mobile.webp`
- `/images/clinics/m4/measure-clean.jpg`
- `/images/clinics/m4/manage-clean.jpg`
- `/images/clinics/m4/nourish-clean.jpg`
- `/images/clinics/m4/contour-clean.jpg`
- `/images/clinics/metabolic-weight-management-hero.jpg`
- `/metabolic.css?v=4`

`/styles.css?v=50` 可取得 CSS，但僅網址帶新版查詢參數並不能證明檔案為新版。

## 開發新版對照結果

開發工作流起初未提供正常回應，啟動既有工作流後經外部開發網址 GET 確認頁面 200；未變更執行設定。手機首屏截圖可見 M4 標題、介紹、醫療提醒與預約動作，圖片排在主要預約動作之後。

- Title：`不復胖怎麼做？M4代謝減重門診｜初纖顏醫境診所`。
- Description：`初纖顏醫境診所代謝減重門診，透過「醫境 M4 四軸代謝」討論減重與維持期規劃。想不復胖？了解 M4代謝的測、控、養、塑與降低復胖風險的方法；醫療結果因人而異。`
- Canonical、og:url 均為已取得的正式 M4 網址。
- og:title、og:description 與頁面設定一致；og:image 為正式網域上的 `/images/clinics/metabolic-weight-management-hero.jpg`，但該正式資源目前尚未上線。
- WebPage、BreadcrumbList、FAQPage 均可 JSON 解析；WebPage URL 與麵包屑末項使用同一正式 M4 URL。
- 9 題 FAQ 的問題及答案：頁面 `<details>` 文字、FAQPage、門診資料逐字一致，不依賴 JavaScript 才能取得。摺疊答案屬可展開內容，並非隱藏的額外結構化宣稱。
- 四組關鍵字均出現在 HTML 正文中。
- 保留「不是療效保證」「並非固定套餐」「不代表保證不復胖」及個別醫師評估等提醒，未變更醫療文案。
- 上列七張圖片均回傳正確 image/webp 或 image/jpeg，檔案特徵符合格式；兩份 CSS 均為 text/css。
- **仍存在設定風險**：開發版 robots 宣告及 sitemap 的 M4 URL 使用 `https://medirealm-origin.com`，與 M4 canonical 不同。僅發佈新版不會自動消除此差異。
- 工作流另有 CMS 文章同步失敗、沿用既有資料的警告；本次 M4 由本地門診資料產生且通過上述檢查。未處理或變更其他文章／門診。

### 已核對的 9 題 FAQ

1. M4代謝是什麼？與醫境 M4 四軸代謝有什麼關係？
2. M4代謝可以保證不復胖嗎？
3. 想不復胖，減重後該怎麼維持？
4. 看代謝減重門診一定要用藥嗎？
5. 減重藥物有哪些注意事項？
6. 減重時如何兼顧肌肉？
7. 立倍塑體雕和整體減重有什麼不同？
8. 第一次看診需要準備什麼？
9. 需要多久回診？費用怎麼計算？

## 發佈及投放前的必要步驟

1. 由使用者確認預定使用的正式主網域。部署資料未列出已驗證自訂網域，不應把程式中的另一網域當作已確認的正式網址，也不應未經同意改動全站設定。
2. 取得同意後統一 robots sitemap 宣告、sitemap M4 項目與 canonical。若採另一自訂網域，先驗證綁定與可達性，並同步 M4 的 canonical、OG 與 JSON-LD。
3. 由使用者發佈最新程式與圖片；本輪沒有自行發佈。
4. 發佈後在正式網址重新檢查 HTTP 實際內容、首屏、桌機／手機圖片、CSS、meta、canonical、robots、sitemap、三種 JSON-LD 與 9 題 FAQ 一致性。不要沿用開發檢查作為正式站通過證明。
5. 投放前仍須院方完成醫療及廣告用語審閱；本報告不代替院方審閱。

## 搜尋與 AI 能見度的界線

- **設定正確**：代表頁面內容及爬取訊號符合預期；本次正式站尚未通過。
- **搜尋收錄**：需另外取得 Search Console 等工具的網址檢查證據；本輪未確認已收錄。
- **排名**：需另看指定關鍵字的實際搜尋表現；HTTP 正常、設定正確或已收錄均不保證排名。
- **AI 引用**：需觀察實際 AI 回答中的引用；伺服器可讀正文與 JSON-LD 只提供可讀性，不保證引用。
- `Allow: /` 不代表所有搜尋或 AI 服務已抓取；FAQPage 語法可解析也不保證搜尋結果呈現 FAQ 樣式。

本次只新增檢查報告，未修改 `public/metabolic.html`、`data/site.json`、`server.js` 或其他門診。