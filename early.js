// viphola.com/seoul/ 오픈 전 사전 등록 (11-20 사장님 「실행해」 · 11-20 오후 「옛 화면을 살려 … 일정 확인 → 다음 → 사전 등록 → DB 수집」)
//  · 2027-04-01 0시(한국 시각) 전에만 작동 — 위쪽 띠(#pre-band)를 켜고, 원래 신청서(#req)는 그대로 둔 채
//    · 「진행 순서」 1·2단계·안내 줄·신청 머리글 설명·마지막 확인의 단추와 작은 글씨는 data-i18n-pre 글자로 바꿔 씀
//    · 도착일은 2027-04-01 부터 (허브 /vip/early 도 같은 검사)
//    · 마지막 확인의 「Next」(request.js 가 window.VIP_PRE.next 를 부름) → 사전 등록 단계(#early) → 「Request early access」
//      = 신청서 전체(/vip/req 와 같은 칸)를 허브 POST /vip/early 로 (저장 · 사장님 텔레그램 · 관리자 「사전 등록」·「4월 1일 리마인드 메일」) → 감사 화면
//  · 4월 1일 0시부터는 이 파일이 아무것도 하지 않음 → 띠 없음, 「Send request」 원래 흐름 그대로 (다시 배포할 필요 없음)
(function () {
  'use strict';
  var OPEN = Date.parse('2027-04-01T00:00:00+09:00'), OPEN_D = '2027-04-01';
  if (!(Date.now() < OPEN)) return;
  var step = document.getElementById('early'); if (!step || !document.getElementById('req')) return;
  var HUB = window.VIP_HUB || 'https://brief-live-hub.emhwang3.workers.dev';
  var $ = function (id) { return document.getElementById(id); };
  var t = function (k) { return window.VIPT ? window.VIPT(k) : ''; };
  var body = null, busy = false, sentTo = '';

  document.documentElement.classList.add('pre-open');
  $('pre-band').hidden = false;
  document.querySelectorAll('[data-i18n-pre]').forEach(function (el) { el.setAttribute('data-i18n', el.getAttribute('data-i18n-pre')); });   // main.js 가 언어를 바꿀 때도 오픈 전 글자로
  var fd = $('f-date'); if (!fd.min || fd.min < OPEN_D) fd.min = OPEN_D;

  function paint() {
    document.querySelectorAll('[data-i18n-pre]').forEach(function (el) { var s = t(el.getAttribute('data-i18n-pre')); if (s) el.textContent = s; });
    if (sentTo) $('ea-ok-text').textContent = t('ea.ok').replace('{email}', sentTo);
  }
  paint();
  document.addEventListener('vip:lang', paint);

  function showErr(msg) { var b = $('ea-err'); b.textContent = msg || ''; b.hidden = !msg; }
  function top() { $('request').scrollIntoView({ behavior: 'smooth', block: 'start' }); }

  // request.js — 마지막 확인에서 「Next」를 누르면 여기로 (d = /vip/req 로 보낼 신청서 전체)
  window.VIP_PRE = { min: OPEN_D, next: function (d) {
    body = d; showErr(''); $('ea-email').textContent = d.email;
    $('req').hidden = true; $('review').hidden = true; step.hidden = false; top();
  } };

  $('ea-edit').addEventListener('click', function () { if (busy) return; step.hidden = true; $('req').hidden = false; top(); });
  $('ea-go').addEventListener('click', function () {
    if (busy || !body) return; busy = true; var b = $('ea-go'); b.disabled = true; b.textContent = t('r.sending'); showErr('');
    fetch(HUB + '/vip/early', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({}, body, { ui: window.VIP_LANG || body.ui })) })
      .then(function (r) { return r.json().catch(function () { return null; }); })
      .then(function (j) {
        busy = false; b.disabled = false; b.textContent = t('ea.go');
        if (!j || !j.ok) {
          var e = j && j.err;
          showErr(e === 'fields' && j.fields ? j.fields.map(function (k) { return t(k === 'date' ? 'pre.e.date' : 'e.' + k); }).filter(Boolean).join(' ')
            : e === 'open' ? t('ea.e.open') : e === 'rate' ? t('e.rate') : e === 'busy' ? t('e.busy') : t('e.net'));
          return;
        }
        sentTo = body.email; step.hidden = true; $('early-done').hidden = false;
        $('ea-ok-text').textContent = t('ea.ok').replace('{email}', sentTo);
        top();
      })
      .catch(function () { busy = false; b.disabled = false; b.textContent = t('ea.go'); showErr(t('e.net')); });
  });
})();
