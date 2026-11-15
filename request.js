// viphola.com/seoul/ 신청 칸 (11-15 사장님 「실행해」) — 결제 없음
//  입력(날짜·인원·차량·옵션·요청 사항·이름·이메일·전화/왓츠앱·메일 언어) → 「Review your request」 = 마지막 확인(날마다 1·2·3 번호 · 대략 시작~끝 시각 · 고른 옵션을 알맞은 자리에)
//  → 「Send request」 → 허브 POST /vip/req (저장 · 손님에게 금색 접수 메일 · 사장님 텔레그램) · 일정 글은 허브 한 곳(vip_hub.js vipItin)에서 받아 메일과 똑같다
(function () {
  'use strict';
  var form = document.getElementById('req'); if (!form) return;
  var HUB = window.VIP_HUB || 'https://brief-live-hub.emhwang3.workers.dev';
  var OPTS = ['porter', 'photo', 'hanbok', 'wine', 'bnb', 'mkt', 'gj'];   // bnb·mkt = 바꿔 넣기 (3일차 저녁·오전, 11-15)   // gj = 경주 1박 2일 연장 (4일차 서울 대신 경주, 5일차 출국)
  var $ = function (id) { return document.getElementById(id); };
  var t = function (k) { return window.VIPT ? window.VIPT(k) : k; };
  var L = function () { return window.VIP_LANG || 'en'; };
  var langTouched = false, last = null, busy = false;
  var LOC = { en: 'en-GB', ja: 'ja-JP', es: 'es-ES' };

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymdOf(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function addDays(ymd, n) { var d = new Date(Date.UTC(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10)) + n * 86400000); return d.toISOString().slice(0, 10); }
  function fmt(ymd) {
    try { return new Intl.DateTimeFormat(LOC[L()] || 'en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(ymd + 'T00:00:00Z')); } catch (e) { return ymd; }
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var today = ymdOf(new Date()), minD = addDays(today, 30);
  $('f-date').min = minD; $('f-date').max = addDays(today, 730);

  function fill() {
    var g = $('f-guests'), gv = g.value || '2'; g.innerHTML = '';
    for (var n = 1; n <= 6; n++) { var o = document.createElement('option'); o.value = String(n); o.textContent = n === 1 ? t('guests.1') : t('guests.n').replace('{n}', n); g.appendChild(o); }
    g.value = gv;
    var c = $('f-car'), cv = c.value || 's560'; c.innerHTML = '';
    (window.CARS || []).forEach(function (x) { var o = document.createElement('option'); o.value = x.v; o.textContent = x.name + ' — ' + t(x.tag); c.appendChild(o); });
    c.value = cv;
    if (!langTouched) $('f-lang').value = L();
    dep();
    if (!$('review').hidden && last) preview(true);   // 확인 단계에서 화면 언어를 바꾸면 일정도 그 언어로
  }
  function gjOn() { var i = form.querySelector('input[name="opt"][value="gj"]'); return !!(i && i.checked); }
  function dep() { var v = $('f-date').value, g = gjOn(); $('f-dep').textContent = /^\d{4}-\d{2}-\d{2}$/.test(v) ? t(g ? 'f.dep5' : 'f.dep').replace('{d}', fmt(addDays(v, g ? 4 : 3))) : ''; }
  $('f-date').addEventListener('change', dep); $('f-date').addEventListener('input', dep);
  $('f-lang').addEventListener('change', function () { langTouched = true; });
  form.querySelector('input[name="opt"][value="gj"]').addEventListener('change', dep);
  document.addEventListener('vip:lang', fill);
  fill();

  function data() {
    return { ui: L(), lang: $('f-lang').value, date: $('f-date').value, guests: +$('f-guests').value, car: $('f-car').value,
      opts: OPTS.filter(function (k) { var i = form.querySelector('input[name="opt"][value="' + k + '"]'); return i && i.checked; }),
      craft: (form.querySelector('input[name="craft"]:checked') || {}).value || '',
      req: $('f-req').value.trim(), name: $('f-name').value.trim(), email: $('f-email').value.trim(), phone: $('f-phone').value.trim() };
  }
  function check(d) {
    var e = [];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date) || d.date < minD) e.push('date');
    if (!(d.guests >= 1)) e.push('guests');
    if (!d.car) e.push('car');
    if (!d.craft) e.push('craft');
    if (!d.name) e.push('name');
    if (!/^[^\s@<>"']+@[^\s@<>"']+\.[A-Za-z]{2,}$/.test(d.email)) e.push('email');
    if (!/^\+?[\d][\d\s().-]{5,38}$/.test(d.phone)) e.push('phone');
    return e;
  }
  var FIELD = { date: 'f-date', guests: 'f-guests', car: 'f-car', craft: 'f-craft', name: 'f-name', email: 'f-email', phone: 'f-phone' };
  function showErr(box, list, msg) {
    Object.keys(FIELD).forEach(function (k) { $(FIELD[k]).removeAttribute('aria-invalid'); });
    (list || []).forEach(function (k) { if (FIELD[k]) $(FIELD[k]).setAttribute('aria-invalid', 'true'); });
    var lines = (list || []).map(function (k) { return t('e.' + k); }).filter(Boolean); if (msg) lines.push(msg);
    box.innerHTML = lines.map(esc).join('<br>'); box.hidden = !lines.length;
    if (list && list.length && FIELD[list[0]]) { var fe = $(FIELD[list[0]]); if (fe.tagName === 'FIELDSET') fe.scrollIntoView({ behavior: 'smooth', block: 'center' }); else fe.focus(); }
  }
  function errMsg(j) { return j && j.err === 'rate' ? t('e.rate') : j && j.err === 'busy' ? t('e.busy') : t('e.net'); }
  function post(body) {
    return fetch(HUB + '/vip/req', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }); });
  }

  function render(d, j) {
    var opt = d.opts.map(function (k) { return t('c.' + k); }), car = (window.CARS || []).filter(function (x) { return x.v === d.car; })[0];
    var langName = { en: 'English', ja: '日本語', es: 'Español' }[d.lang] || d.lang;
    var rows = [[t('r.dates'), fmt(d.date) + ' – ' + fmt(j.end || addDays(d.date, d.opts.indexOf('gj') >= 0 ? 4 : 3))], [t('r.guests'), d.guests === 1 ? t('guests.1') : t('guests.n').replace('{n}', d.guests)],
      [t('r.car'), car ? car.name : d.car], [t('r.craft'), t('crs.' + d.craft)], [t('r.opts'), opt.length ? opt.join(L() === 'ja' ? '、' : ', ') : t('r.none')], [t('r.contact'), d.name + ' · ' + d.email + ' · ' + d.phone], [t('r.lang'), langName]];
    if (d.req) rows.push([t('r.req'), d.req]);
    $('rv-sum').innerHTML = rows.map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]).replace(/\n/g, '<br>') + '</dd></div>'; }).join('');
    $('rv-days').innerHTML = j.itin.days.map(function (x) {
      return '<section class="rv-day"><p class="rv-dh"><span class="day">' + esc(x.day) + '</span><span class="rv-date">' + esc(x.dl) + '</span></p><h4>' + esc(x.title) + '</h4><ol class="rv-items">'
        + x.items.map(function (i) { return '<li><span class="rv-no">' + i.no + '</span><span class="rv-t">' + esc(i.t) + '</span><span class="rv-x">' + esc(i.x) + '</span></li>'; }).join('')
        + '</ol>' + (x.note ? '<p class="rv-note">' + esc(x.note) + '</p>' : '') + '</section>';
    }).join('');
    $('rv-all').textContent = j.itin.all || '';
  }
  function preview(keep) {
    var d = data(), e = check(d);
    if (e.length) { if (!keep) showErr($('req-err'), e); return; }
    if (busy) return; busy = true; $('f-go').disabled = true;
    post(Object.assign({ preview: 1 }, d)).then(function (j) {
      busy = false; $('f-go').disabled = false;
      if (!j || !j.ok) { showErr($('req-err'), j && j.fields, j && j.fields ? '' : errMsg(j)); return; }
      showErr($('req-err'), []); last = d; render(d, j);
      form.hidden = true; $('review').hidden = false; $('rv-err').hidden = true;
      if (!keep) $('request').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }).catch(function () { busy = false; $('f-go').disabled = false; showErr($('req-err'), [], t('e.net')); });
  }
  form.addEventListener('submit', function (ev) { ev.preventDefault(); preview(false); });
  $('rv-edit').addEventListener('click', function () { $('review').hidden = true; form.hidden = false; $('request').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  $('rv-send').addEventListener('click', function () {
    if (busy || !last) return; busy = true; var b = $('rv-send'); b.disabled = true; b.textContent = t('r.sending');
    post(Object.assign({}, last, { ui: L() })).then(function (j) {
      busy = false; b.disabled = false; b.textContent = t('r.send');
      if (!j || !j.ok) { $('rv-err').textContent = j && j.fields ? (j.fields.map(function (k) { return t('e.' + k); }).join(' ')) : errMsg(j); $('rv-err').hidden = false; return; }
      $('review').hidden = true; $('req-done').hidden = false;
      $('ok-text').textContent = t(j.mailed === false ? 'ok.text2' : 'ok.text').replace('{id}', j.id).replace('{email}', last.email);
      $('request').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }).catch(function () { busy = false; b.disabled = false; b.textContent = t('r.send'); $('rv-err').textContent = t('e.net'); $('rv-err').hidden = false; });
  });
})();
