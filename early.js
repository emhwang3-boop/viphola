// viphola.com/seoul/ 오픈 전 사전 등록 (11-20 사장님 「실행해」)
//  · 2027-04-01 0시(한국 시각) 전에만 작동 — 위쪽 띠(#pre-band)·사전 등록 칸(#early)을 켜고 원래 신청서(#req)를 숨김
//    · 「진행 순서」 1·2단계·안내 줄·신청 머리글·첫 화면 단추는 data-i18n-pre 글자로 바꿔 씀
//  · 4월 1일 0시부터는 이 파일이 아무것도 하지 않음 → 띠 없음, 원래 신청서 그대로 (다시 배포할 필요 없음)
//  · 받는 칸: 이름·이메일·원하는 달·날짜(선택)·인원 → 허브 POST /vip/early (저장 · 사장님 텔레그램 · 관리자 화면 「사전 등록」)
(function () {
  'use strict';
  var OPEN = Date.parse('2027-04-01T00:00:00+09:00');
  if (!(Date.now() < OPEN)) return;
  var form = document.getElementById('early'); if (!form) return;
  var HUB = window.VIP_HUB || 'https://brief-live-hub.emhwang3.workers.dev';
  var $ = function (id) { return document.getElementById(id); };
  var t = function (k) { return window.VIPT ? window.VIPT(k) : ''; };
  var L = function () { return window.VIP_LANG || 'en'; };
  var LOC = { en: 'en-GB', ja: 'ja-JP', es: 'es-ES', zhs: 'zh-CN', zht: 'zh-TW' };
  var busy = false, sentTo = '';

  document.documentElement.classList.add('pre-open');
  $('pre-band').hidden = false; form.hidden = false; $('req').hidden = true;
  document.querySelectorAll('[data-i18n-pre]').forEach(function (el) { el.setAttribute('data-i18n', el.getAttribute('data-i18n-pre')); });

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function monthList() {   // 2027년 4월부터 12달 (그 뒤에 보면 다음 달부터)
    var now = new Date(Date.now() + 9 * 3600000), y = now.getUTCFullYear(), m = now.getUTCMonth() + 2;
    if (m > 12) { m -= 12; y++; }
    if (y < 2027 || (y === 2027 && m < 4)) { y = 2027; m = 4; }
    var out = [];
    for (var i = 0; i < 12; i++) { out.push(y + '-' + pad(m)); m++; if (m > 12) { m = 1; y++; } }
    return out;
  }
  function mLabel(ym) {
    try { return new Intl.DateTimeFormat(LOC[L()] || 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7) - 1, 1))); } catch (e) { return ym; }
  }
  function fill() {
    var ms = $('e-month'), mv = ms.value; ms.innerHTML = '';
    var o0 = document.createElement('option'); o0.value = ''; o0.textContent = t('ea.month.pick'); ms.appendChild(o0);
    monthList().forEach(function (ym) { var o = document.createElement('option'); o.value = ym; o.textContent = mLabel(ym); ms.appendChild(o); });
    var ot = document.createElement('option'); ot.value = 'tbd'; ot.textContent = t('ea.month.tbd'); ms.appendChild(ot);
    ms.value = mv;
    var g = $('e-guests'), gv = g.value || '2'; g.innerHTML = '';
    for (var n = 1; n <= 6; n++) { var o = document.createElement('option'); o.value = String(n); o.textContent = n === 1 ? t('guests.1') : t('guests.n').replace('{n}', n); g.appendChild(o); }
    g.value = gv;
  }
  function paint() {
    document.querySelectorAll('[data-i18n-pre]').forEach(function (el) { var s = t(el.getAttribute('data-i18n-pre')); if (s) el.textContent = s; });
    fill();
    if (sentTo) $('e-ok-text').textContent = t('ea.ok').replace('{email}', sentTo);
  }
  paint();
  document.addEventListener('vip:lang', paint);

  var FIELD = { name: 'e-name', email: 'e-email', month: 'e-month', guests: 'e-guests' };
  function showErr(list, msg) {
    Object.keys(FIELD).forEach(function (k) { $(FIELD[k]).removeAttribute('aria-invalid'); });
    (list || []).forEach(function (k) { if (FIELD[k]) $(FIELD[k]).setAttribute('aria-invalid', 'true'); });
    var lines = (list || []).map(function (k) { return k === 'month' ? t('ea.e.month') : t('e.' + k); }).filter(Boolean); if (msg) lines.push(msg);
    var box = $('e-err'); box.textContent = ''; lines.forEach(function (s, i) { if (i) box.appendChild(document.createElement('br')); box.appendChild(document.createTextNode(s)); }); box.hidden = !lines.length;
    if (list && list.length && FIELD[list[0]]) $(FIELD[list[0]]).focus();
  }
  form.addEventListener('submit', function (ev) {
    ev.preventDefault(); if (busy) return;
    var d = { name: $('e-name').value.trim(), email: $('e-email').value.trim(), month: $('e-month').value, dates: $('e-dates').value.trim(), guests: parseInt($('e-guests').value, 10) || 2, ui: L(), lang: L() }, e = [];
    if (!d.name) e.push('name');
    if (!/^[^\s@<>"']+@[^\s@<>"']+\.[A-Za-z]{2,}$/.test(d.email)) e.push('email');
    if (!d.month) e.push('month');
    if (e.length) { showErr(e); return; }
    busy = true; $('e-go').disabled = true; showErr([]);
    fetch(HUB + '/vip/early', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) })
      .then(function (r) { return r.json().catch(function () { return null; }); })
      .then(function (j) {
        busy = false; $('e-go').disabled = false;
        if (!j || !j.ok) { showErr(j && j.fields, j && j.fields ? '' : j && j.err === 'rate' ? t('e.rate') : j && j.err === 'busy' ? t('e.busy') : t('e.net')); return; }
        sentTo = d.email; form.hidden = true; $('early-done').hidden = false;
        $('e-ok-text').textContent = t('ea.ok').replace('{email}', d.email);
        $('request').scrollIntoView({ behavior: 'smooth', block: 'start' });
      })
      .catch(function () { busy = false; $('e-go').disabled = false; showErr([], t('e.net')); });
  });
})();
