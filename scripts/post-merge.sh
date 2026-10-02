#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# 本專案使用 Node.js 內建模組，沒有需安裝的套件、建置步驟或本機資料庫遷移。
# 合併後只驗證程式與設定；工作流重新啟動由平台接續處理。
for file in server.js cms.js google-tag.js public/*.js; do
  node --check "$file"
done

node <<'NODE'
const fs = require('node:fs');
for (const file of ['package.json', 'data/site.json', 'data/face-types.json']) {
  JSON.parse(fs.readFileSync(file, 'utf8'));
}
console.log('Post-merge setup: JavaScript and JSON checks passed. No database changes.');
NODE