# 纖顏醫境 XIAN YAN · MEDIREALM — 都會代謝美學官網

## Overview
纖顏醫境體系（2026-08 全面品牌升級改版）官網。零依賴 Node.js 靜態伺服器（`server.js`），前端在 `public/`，全站內容集中在 `data/site.json`（改完重新整理即可生效），預約資料寫入 `data/bookings.jsonl`。

## Brand
- 體系：纖顏醫境（XIAN YAN · MEDIREALM），多位醫師共同主理，不主打單一醫師
- 三院所：初纖顏（台北信義）、沐纖顏（台北中正）、森纖顏（新北新莊）——院所名稱不可簡化為「纖顏」
- Design tokens 在 `styles.css` `:root`（奶油白 #FBF8F3、霧青綠 #72BAB4、香檳金 #CE9A4B）

## How to run
- 工作流「Start application」：`PORT=5000 node server.js`（無需安裝任何套件）

## Notes
- 匯入時本地與 GitHub 歷史不相關，已用 `--allow-unrelated-histories` 合併 origin/main
- `#locations` anchor 保留以維持舊連結相容
- 初纖顏圓形 Logo（去背版）：`public/images/chu-logo.png`；沐／森院所 Logo、地址、電話、LINE 尚待提供
