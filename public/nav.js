/* 纖顏醫境 — 全站共用導覽列互動（導覽列／頁尾 HTML 由 server.js 依 site.json 產生） */
(function () {
  'use strict';
  var nav = document.getElementById('siteNav');
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (!nav) return;

  // 捲動後加上半透明底色；預約頁等頁面由伺服器直接給 nav-solid，一律維持底色
  var solid = nav.classList.contains('nav-solid');
  var onScroll = function () { nav.classList.toggle('scrolled', solid || window.scrollY > 24); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (!toggle || !links) return;
  function setOpen(open) {
    links.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
  }
  toggle.addEventListener('click', function () { setOpen(!links.classList.contains('open')); });
  // 手機選單點了連結（含同頁錨點）就收起
  links.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
})();
