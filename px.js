// VIPHola 메타 픽셀 (11-21 사장님 「메타픽셀도 붙여」) — 이벤트 관리자 「VIPHola Pixel」 29786229174398878
//  · 모든 화면: 화면 열람(PageView)
//  · 사전 등록 완료(early.js)·여행 신청 완료(request.js)는 window.vipPx('Lead', …) 로 「등록 1건」
//  · 손님 이름·이메일·전화는 보내지 않음 — 자동 이벤트(autoConfig)도 끔
//  · viphola.com 에서만 작동 · 이 PC 시험(localhost)은 주소에 ?px=1 을 붙였을 때만
//  · 결제 화면(pay/)·관리자 화면엔 안 붙임 — 주소에 견적 번호가 들어 있어서
(function () {
  'use strict';
  var ID = '29786229174398878';
  var on = /(^|\.)viphola\.com$/.test(location.hostname) || /[?&]px=1(&|$)/.test(location.search);
  window.vipPx = function (ev, p) { try { if (on && window.fbq) window.fbq('track', ev, p || {}); } catch (e) {} };
  if (!on) return;
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('set', 'autoConfig', false, ID);
  window.fbq('init', ID);
  window.fbq('track', 'PageView');
})();
