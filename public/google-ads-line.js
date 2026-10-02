(function () {
  'use strict';

  if (window.__medirealmLineAdsTracking) return;
  var script = document.currentScript;
  var officialLine;
  try {
    officialLine = new URL(script.getAttribute('data-official-line'));
    if (officialLine.protocol !== 'https:' ||
        (officialLine.hostname !== 'lin.ee' && officialLine.hostname !== 'line.me')) {
      throw new Error('Invalid official LINE destination');
    }
  } catch (error) {
    console.warn('[Google Ads] LINE tracking skipped: invalid official LINE URL.');
    return;
  }
  window.__medirealmLineAdsTracking = true;

  function trackLineClick(event) {
    if (event.defaultPrevented) return;
    if (event.type === 'auxclick' ? event.button !== 1 : event.button > 0) return;
    var target = event.target;
    var anchor = target && typeof target.closest === 'function' ? target.closest('a[href]') : null;
    if (!anchor) return;
    var destination;
    try {
      destination = new URL(anchor.href, window.location.href);
    } catch (error) {
      return;
    }
    if (destination.origin !== officialLine.origin ||
        destination.pathname !== officialLine.pathname ||
        destination.search !== officialLine.search) return;

    // 保留連結原本的跳轉／另開視窗行為；只回報點擊，不傳表單或醫療資料。
    // 委派監聽也涵蓋頁面載入後才產生的連結及 SVG 圖示點擊。
    try {
      if (typeof window.gtag !== 'function') {
        console.warn('[Google Ads] LINE click not recorded: Google tag unavailable.');
        return;
      }
      window.gtag('event', 'conversion', {
        send_to: 'AW-18469650813/uDjRCPPtgo4dEP2CgudE',
      });
    } catch (error) {
      console.warn('[Google Ads] LINE click could not be recorded.');
    }
  }

  document.addEventListener('click', trackLineClick);
  document.addEventListener('auxclick', trackLineClick);
})();