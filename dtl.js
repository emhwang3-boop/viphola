// 11-18 사장님 「년도 월 일이 한글로 나온다 외국어로 보이게」 → 「달력은 아직도 한글로 나온다」
//  브라우저 날짜·시각 칸은 글자와 달력이 브라우저 언어로 나온다(한국어 크롬이면 「연도-월-일」·한글 달력·오전/오후)
//  → 칸을 글자 칸(읽기 전용)으로 바꾸고, 값은 그대로 YYYY-MM-DD / HH:MM 으로 담는다.
//    보이는 글자와 달력·시각 고르기 창은 우리가 사이트 언어로 그린다(Intl 로 월·요일 이름).
//  쓰는 곳: 서울 신청서(도착일·항공편 시각) · 결제 뒤 여행자 정보(생년월일·여권 만료일). 관리자 화면은 안 씀.
(function () {
  'use strict';
  var LOC = { en: 'en-GB', ja: 'ja-JP', es: 'es-ES', zhs: 'zh-CN', zht: 'zh-TW' };
  var PH = { en: 'Select a date', ja: '日付を選択', es: 'Seleccione una fecha', zhs: '选择日期', zht: '選擇日期' };
  var MON1 = { en: 1, es: 1 };   // 주 시작 — 영어(영국식)·스페인어 월요일, 일본어·중국어 일요일
  var TODAY = { en: 'Today', ja: '今日', es: 'Hoy', zhs: '今天', zht: '今天' };
  var PREV = { en: 'Previous month', ja: '前の月', es: 'Mes anterior', zhs: '上个月', zht: '上個月' };
  var NEXT = { en: 'Next month', ja: '次の月', es: 'Mes siguiente', zhs: '下个月', zht: '下個月' };
  var open = null;   // 지금 열린 창 { inp, box }

  function lang() { var l = document.documentElement.getAttribute('data-lang') || window.VIP_LANG || 'en'; return LOC[l] ? l : 'en'; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); }
  function todayYmd() { var d = new Date(); return ymd(d.getFullYear(), d.getMonth(), d.getDate()); }
  function fmt(v, o) { try { o.timeZone = 'UTC'; return new Intl.DateTimeFormat(LOC[lang()], o).format(new Date(v + 'T00:00:00Z')); } catch (e) { return v; } }
  function kind(inp) { return inp.getAttribute('data-dtl'); }
  function text(inp) {
    var v = inp.value;
    if (kind(inp) === 'time') return /^\d{2}:\d{2}/.test(v) ? v.slice(0, 5) : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return '';
    var o = { day: 'numeric', month: 'long', year: 'numeric' };
    if (inp.id === 'f-date') o.weekday = 'short';   // 도착일만 요일까지
    return fmt(v, o);
  }
  function paint(inp) {
    var s = inp.__dtl; if (!s) return;
    var t = text(inp), n = t || (kind(inp) === 'time' ? '--:--' : PH[lang()]);
    if (s.textContent !== n) s.textContent = n;   // 같으면 안 건드림 — 감시(MutationObserver)가 끝없이 도는 것 막기
    s.classList.toggle('dtl-ph', !t);
  }
  function set(inp, v) {
    inp.value = v; paint(inp);
    inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function close() { if (!open) return; var o = open; open = null; if (o.box.parentNode) o.box.parentNode.removeChild(o.box); o.inp.setAttribute('aria-expanded', 'false'); }
  function place(box) {   // 화면 오른쪽 밖으로 나가면 오른쪽 끝에 맞춤
    box.style.left = '0'; box.style.right = 'auto';
    var r = box.getBoundingClientRect(); if (r.right > window.innerWidth - 8) { box.style.left = 'auto'; box.style.right = '0'; }
  }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  // ── 달력 ──
  function calendar(inp) {
    var l = lang(), mn = inp.getAttribute('min') || '', mx = inp.getAttribute('max') || '', v = inp.value, t = todayYmd();
    var base = /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : (mn && t < mn ? mn : (mx && t > mx ? mx : t));
    var st = { y: +base.slice(0, 4), m: +base.slice(5, 7) - 1 };
    var y0 = mn ? +mn.slice(0, 4) : new Date().getFullYear() - 100, y1 = mx ? +mx.slice(0, 4) : new Date().getFullYear() + 15;
    var box = el('div', 'dtl-pop dtl-cal'); box.setAttribute('role', 'dialog');
    function ok(d) { return (!mn || d >= mn) && (!mx || d <= mx); }
    function draw() {
      box.innerHTML = '';
      var hd = el('div', 'dtl-hd');
      var pv = el('button', 'dtl-nav', '‹'); pv.type = 'button'; pv.setAttribute('aria-label', PREV[l]);
      var nx = el('button', 'dtl-nav', '›'); nx.type = 'button'; nx.setAttribute('aria-label', NEXT[l]);
      var sm = el('select', 'dtl-sel'), sy = el('select', 'dtl-sel');
      for (var i = 0; i < 12; i++) { var o = el('option', null, fmt(ymd(2026, i, 1), { month: 'long' })); o.value = i; sm.appendChild(o); }
      for (var y = y1; y >= y0; y--) { var p = el('option', null, fmt(ymd(y, 0, 1), { year: 'numeric' })); p.value = y; sy.appendChild(p); }
      sm.value = st.m; sy.value = st.y;
      sm.onchange = function () { st.m = +sm.value; draw(); }; sy.onchange = function () { st.y = +sy.value; draw(); };
      pv.onclick = function () { if (--st.m < 0) { st.m = 11; st.y--; } draw(); };
      nx.onclick = function () { if (++st.m > 11) { st.m = 0; st.y++; } draw(); };
      pv.disabled = !!mn && ymd(st.y, st.m, 1) <= mn.slice(0, 8) + '01' || st.y <= y0 && st.m === 0;
      nx.disabled = !!mx && ymd(st.y, st.m, 1) >= mx.slice(0, 8) + '01' || st.y >= y1 && st.m === 11;
      var mid = el('div', 'dtl-hm');
      if (l === 'en' || l === 'es') { mid.appendChild(sm); mid.appendChild(sy); } else { mid.appendChild(sy); mid.appendChild(sm); }
      hd.appendChild(pv); hd.appendChild(mid); hd.appendChild(nx); box.appendChild(hd);
      var g = el('div', 'dtl-grid'), s0 = MON1[l] ? 1 : 0;
      for (var w = 0; w < 7; w++) g.appendChild(el('span', 'dtl-wd', fmt(ymd(2026, 10, 1 + ((w + s0) % 7)), { weekday: 'short' })));   // 2026-11-01 = 일요일
      var first = new Date(Date.UTC(st.y, st.m, 1)).getUTCDay(), lead = (first - s0 + 7) % 7, days = new Date(Date.UTC(st.y, st.m + 1, 0)).getUTCDate();
      for (var b = 0; b < lead; b++) g.appendChild(el('span'));
      for (var d = 1; d <= days; d++) {
        var k = ymd(st.y, st.m, d), bt = el('button', 'dtl-day', String(d)); bt.type = 'button'; bt.setAttribute('data-v', k);
        bt.setAttribute('aria-label', fmt(k, { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }));
        if (k === v) bt.classList.add('on'); if (k === t) bt.classList.add('today');
        if (!ok(k)) bt.disabled = true; else bt.onclick = function () { set(inp, this.getAttribute('data-v')); close(); inp.focus(); };
        g.appendChild(bt);
      }
      box.appendChild(g);
      if (ok(t)) { var ft = el('div', 'dtl-ft'), tb = el('button', 'dtl-link', TODAY[l]); tb.type = 'button'; tb.onclick = function () { set(inp, t); close(); inp.focus(); }; ft.appendChild(tb); box.appendChild(ft); }
    }
    draw(); return box;
  }

  // ── 시각 (00~23시 · 00~59분, 숫자만이라 언어 상관없음) ──
  function clock(inp) {
    var v = /^\d{2}:\d{2}/.test(inp.value) ? inp.value.slice(0, 5) : '', h = v ? v.slice(0, 2) : '', m = v ? v.slice(3, 5) : '';
    var box = el('div', 'dtl-pop dtl-clk'); box.setAttribute('role', 'dialog');
    var ch = el('div', 'dtl-col'), cm = el('div', 'dtl-col');
    function col(c, n, cur, pick) {
      for (var i = 0; i < n; i++) { var s = pad(i), b = el('button', 'dtl-t' + (s === cur ? ' on' : ''), s); b.type = 'button'; b.setAttribute('data-v', s); b.onclick = pick; c.appendChild(b); }
    }
    col(ch, 24, h, function () { h = this.getAttribute('data-v'); mark(ch, h); set(inp, h + ':' + (m || '00')); if (!m) { m = '00'; mark(cm, m); } });
    col(cm, 60, m, function () { m = this.getAttribute('data-v'); mark(cm, m); set(inp, (h || '12') + ':' + m); close(); inp.focus(); });
    function mark(c, s) { Array.prototype.forEach.call(c.children, function (b) { b.classList.toggle('on', b.getAttribute('data-v') === s); }); }
    box.appendChild(ch); box.appendChild(cm);
    box.__scroll = function () {   // 고른 시각(없으면 12시)이 보이게
      [[ch, h || '12'], [cm, m || '00']].forEach(function (a) { var b = a[0].querySelector('[data-v="' + a[1] + '"]'); if (b) a[0].scrollTop = b.offsetTop - a[0].clientHeight / 2 + b.offsetHeight / 2; });
    };
    return box;
  }

  function show(inp) {
    if (open && open.inp === inp) { close(); return; }
    close();
    var box = kind(inp) === 'time' ? clock(inp) : calendar(inp);
    box.addEventListener('click', function (e) { if (!e.target.closest('button, select')) e.preventDefault(); });   // 칸이 <label> 안에 있으면 빈 곳을 눌러도 칸이 눌려 창이 닫힘 — 막음
    inp.parentNode.appendChild(box); open = { inp: inp, box: box }; inp.setAttribute('aria-expanded', 'true');
    place(box); if (box.__scroll) box.__scroll();
  }

  function wire(inp) {
    if (inp.__dtl) return;
    var k = inp.type === 'time' ? 'time' : 'date';
    var w = document.createElement('span'); w.className = 'dtl dtl-' + k;
    inp.parentNode.insertBefore(w, inp); w.appendChild(inp);
    inp.setAttribute('data-dtl', k);
    try { inp.type = 'text'; } catch (e) {}
    inp.readOnly = true; inp.setAttribute('inputmode', 'none'); inp.setAttribute('autocomplete', 'off'); inp.setAttribute('aria-haspopup', 'dialog');
    var s = document.createElement('span'); s.className = 'dtl-txt'; s.setAttribute('aria-hidden', 'true'); w.appendChild(s);
    var ic = document.createElement('span'); ic.className = 'dtl-ic'; ic.setAttribute('aria-hidden', 'true'); w.appendChild(ic);
    inp.__dtl = s; inp.classList.add('dtl-in');
    inp.addEventListener('click', function () { show(inp); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); show(inp); }
      else if (e.key === 'Escape') close();
      else if ((e.key === 'Backspace' || e.key === 'Delete') && inp.value) { e.preventDefault(); set(inp, ''); }
    });
    paint(inp);
  }
  function scan() {
    Array.prototype.forEach.call(document.querySelectorAll('input[type="date"], input[type="time"], input.dtl-in'), function (i) { if (i.__dtl) paint(i); else wire(i); });
  }
  window.vipDtl = scan;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
  document.addEventListener('vip:lang', function () { close(); scan(); });
  document.addEventListener('reset', function () { close(); setTimeout(scan, 0); }, true);
  document.addEventListener('mousedown', function (e) { if (open && !open.box.contains(e.target) && e.target !== open.inp) close(); });
  document.addEventListener('touchstart', function (e) { if (open && !open.box.contains(e.target) && e.target !== open.inp) close(); }, { passive: true });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) { var i = open.inp; close(); i.focus(); } });
  try {   // 결제 화면은 여행자 칸을 나중에 그리고, 언어도 나중에 정함
    var tm = 0, mo = new MutationObserver(function () { clearTimeout(tm); tm = setTimeout(scan, 30); });
    mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-lang'] });
  } catch (e) {}
})();
