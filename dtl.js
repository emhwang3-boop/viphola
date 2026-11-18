// 11-18 사장님 「년도 월 일이 한글로 나온다 외국어로 보이게」
//  날짜·시각 칸(input date/time)은 브라우저 언어로 글자가 나와(한국어 크롬이면 「연도-월-일」「오후 03:30」)
//  → 칸 글자는 숨기고 그 위에 사이트 언어 글자를 덮어 보인다. 값·검사·달력 고르기는 원래 칸 그대로.
//  쓰는 곳: 서울 신청서(도착일·항공편 시각) · 결제 뒤 여행자 정보(생년월일·여권 만료일). 관리자 화면은 안 씀.
(function () {
  'use strict';
  var LOC = { en: 'en-GB', ja: 'ja-JP', es: 'es-ES', zhs: 'zh-CN', zht: 'zh-TW' };
  var PH = { en: 'Select a date', ja: '日付を選択', es: 'Seleccione una fecha', zhs: '选择日期', zht: '選擇日期' };
  function lang() { var l = document.documentElement.getAttribute('data-lang') || window.VIP_LANG || 'en'; return LOC[l] ? l : 'en'; }
  function text(inp) {
    var v = inp.value, l = lang();
    if (inp.type === 'time') return /^\d{2}:\d{2}/.test(v) ? v.slice(0, 5) : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return '';
    var o = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' };
    if (inp.id === 'f-date') o.weekday = 'short';   // 도착일만 요일까지
    try { return new Intl.DateTimeFormat(LOC[l], o).format(new Date(v + 'T00:00:00Z')); } catch (e) { return v; }
  }
  function paint(inp) {
    var s = inp.__dtl; if (!s) return;
    var t = text(inp);
    var n = t || (inp.type === 'time' ? '--:--' : PH[lang()]);
    if (s.textContent !== n) s.textContent = n;   // 같으면 안 건드림 — 감시(MutationObserver)가 끝없이 도는 것 막기
    s.classList.toggle('dtl-ph', !t);
  }
  function wire(inp) {
    if (inp.__dtl || inp.closest('.dtl')) return;
    var w = document.createElement('span'); w.className = 'dtl';
    inp.parentNode.insertBefore(w, inp); w.appendChild(inp);
    var s = document.createElement('span'); s.className = 'dtl-txt'; s.setAttribute('aria-hidden', 'true'); w.appendChild(s);
    inp.__dtl = s; inp.classList.add('dtl-in');
    inp.addEventListener('input', function () { paint(inp); });
    inp.addEventListener('change', function () { paint(inp); });
    inp.addEventListener('click', function () { try { if (inp.showPicker) inp.showPicker(); } catch (e) {} });   // 글자가 숨어 있으니 누르면 달력·시계를 바로 연다
    paint(inp);
  }
  function scan() {
    Array.prototype.forEach.call(document.querySelectorAll('input[type="date"], input[type="time"]'), function (i) { if (i.__dtl) paint(i); else wire(i); });
  }
  window.vipDtl = scan;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
  document.addEventListener('vip:lang', scan);
  try {   // 결제 화면은 여행자 칸을 나중에 그리고, 언어도 나중에 정함
    var tm = 0, mo = new MutationObserver(function () { clearTimeout(tm); tm = setTimeout(scan, 30); });
    mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-lang'] });
  } catch (e) {}
})();
