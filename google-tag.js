'use strict';

// Google Ads 公開標籤 ID；共用 HTML 回應只安裝一次，不另送表單或醫療資料。
const TAG_ID = 'AW-18469650813';
const TAG_SOURCE = 'https://www.googletagmanager.com/gtag/js?id=' + TAG_ID;
const GOOGLE_TAG = [
  '<!-- Google tag (gtag.js) -->',
  '<script async src="' + TAG_SOURCE + '"></script>',
  '<script>',
  '  window.dataLayer = window.dataLayer || [];',
  '  function gtag(){dataLayer.push(arguments);}',
  "  gtag('js', new Date());",
  "  gtag('config', '" + TAG_ID + "');",
  '</script>',
].join('\n');

module.exports = function injectGoogleAdsTag(html) {
  // 避免同一個頁面重複載入或再次初始化使用者提供的標籤。
  if (html.includes(TAG_SOURCE)) return html;
  return html.replace(/<head\b[^>]*>/i, (head) => head + '\n' + GOOGLE_TAG);
};