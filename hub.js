// viphola.com — 허브(클라우드플레어 워커) 주소 한 곳 · 이 PC 시험(127.0.0.1·localhost)에서만 ?hub= 로 바꿔 쓸 수 있다 (11-15)
window.VIP_HUB = (function () {
  var d = 'https://brief-live-hub.emhwang3.workers.dev';
  try {
    if (/^(127\.0\.0\.1|localhost)$/.test(location.hostname)) {
      var q = new URLSearchParams(location.search).get('hub');
      if (q && /^http:\/\/(127\.0\.0\.1|localhost):\d{2,5}$/.test(q)) sessionStorage.setItem('vip_hub', q);
      return sessionStorage.getItem('vip_hub') || d;
    }
  } catch (e) {}
  return d;
})();
