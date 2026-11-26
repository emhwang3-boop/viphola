// 11-26 사장님 「가」 — 손님 동선 기록(서울편): 어디서 왔나 · 어디까지 내려 봤나 · 신청 단추를 눌렀나 → 허브 /vt (칸 home-vip)
//   · 단계마다 같은 기기는 처음 한 번만 셈(허브가 거름) · 기기 번호 = main.js 의 vip_vid(브라우저 난수, 개인정보 없음)
//   · 안 세는 것: 사장님 기기(vip_owner) · viphola.com 밖(이 PC 미리보기) — main.js 방문 수와 같은 기준 · 로봇·사장님 집 인터넷은 허브가 뺌
//   · 어디서 왔나: fbclid + ?lang= = 메타 광고(ad) · fbclid 만 = 페북·인스타 게시물(meta) · 그 밖은 앞 주소(referrer)로
//   · 단계: land 도착 · t10/t60 10초·60초 머묾 · jr 일정 · inc 포함 사항 · opt 옵션 · proc 진행 방식 · req 신청서 칸 보임
//           cta 「Plan your journey」 누름 · pam 팜플렛 펼침 · fill 신청서 입력 시작 · rv 마지막 확인 · ea 사전 등록 단계 · done 사전 등록 끝
(function () {
  try {
    if (!/(^|\.)viphola\.com$/i.test(location.hostname)) return;
    if (localStorage.getItem('vip_owner')) return;
  } catch (e) { return; }
  var HUB = window.VIP_HUB || 'https://brief-live-hub.emhwang3.workers.dev';
  var vid = ''; try { vid = localStorage.getItem('vip_vid') || ''; } catch (e) {}
  if (!vid) return;

  function source() {
    try { var s0 = sessionStorage.getItem('vip_src'); if (s0) return s0; } catch (e) {}
    var q = location.search, r = '', s = 'direct';
    try { r = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) {}
    if (/[?&]fbclid=/.test(q)) s = /[?&]lang=/.test(q) ? 'ad' : 'meta';
    else if (/[?&]utm_/.test(q)) s = 'other';
    else if (/instagram\./i.test(r)) s = 'ig';
    else if (/facebook\.|fb\.com|messenger\./i.test(r)) s = 'fb';
    else if (/google\.|bing\.|naver\.|yahoo\.|duckduckgo\.|baidu\.|daum\./i.test(r)) s = 'search';
    else if (/line\.me|line\.naver/i.test(r)) s = 'line';
    else if (/viphola\.com$/i.test(r)) s = 'site';
    else if (r) s = 'other';
    try { sessionStorage.setItem('vip_src', s); } catch (e) {}
    return s;
  }
  var SRC = source(), sent = {};
  function hit(e) {
    if (sent[e]) return; sent[e] = 1;
    try { fetch(HUB + '/vt?e=' + e + '&src=' + SRC + '&vid=' + encodeURIComponent(vid), { cache: 'no-store', keepalive: true, mode: 'no-cors' }).catch(function () {}); } catch (x) {}
  }
  hit('land');

  // 머문 시간 — 화면을 보고 있는 동안만 셈(다른 탭·앱으로 가면 멈춤)
  var seen = 0, last = Date.now();
  setInterval(function () {
    var now = Date.now();
    if (document.visibilityState === 'visible') seen += now - last;
    last = now;
    if (seen >= 10000) hit('t10');
    if (seen >= 60000) hit('t60');
  }, 1000);

  // 구간이 화면에 들어오면
  var SEC = { journey: 'jr', included: 'inc', options: 'opt', process: 'proc', request: 'req' };
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (x) { if (x.isIntersecting) { hit(SEC[x.target.id]); io.unobserve(x.target); } });
    }, { threshold: 0.2 });
    Object.keys(SEC).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  }

  // 단추·신청서
  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a[href="#request"], #pam-open') : null;
    if (!a) return;
    hit(a.id === 'pam-open' ? 'pam' : 'cta');
  }, true);
  var form = document.getElementById('req');
  if (form) {
    var f1 = function () { hit('fill'); };
    form.addEventListener('input', f1, true); form.addEventListener('change', f1, true);
  }
  // 신청서 다음 단계가 보이면(hidden 이 풀리면)
  var STEP = { review: 'rv', early: 'ea', 'early-done': 'done', 'req-done': 'done' };
  if ('MutationObserver' in window) {
    Object.keys(STEP).forEach(function (id) {
      var el = document.getElementById(id); if (!el) return;
      new MutationObserver(function () { if (!el.hidden) hit(STEP[id]); }).observe(el, { attributes: true, attributeFilter: ['hidden'] });
    });
  }
})();
