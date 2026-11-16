// viphola.com 공용 — 언어 변경 · 카드 넘기기 표시 (신청 칸은 request.js)
//  · 쓸 수 있는 언어는 페이지마다(PAGE_LANGS): 대문·약관 = 한국어·영어·일본어·중국어 간체·번체 · 서울(인바운드) = 영어·일본어·중국어 간체·번체 (11-15 사장님 「인바운드는 한국어 필요없어」 · 11-16 중국어 더함)
//  · 🔴 11-16 사장님 — 스페인어는 숨김(아래 OFF 한 줄). 번역 자료(i18n-*.js 의 es·약관 es 본문·pay.js·허브)는 그대로 · ?lang=es 는 영어로
//  · 처음 언어: 주소 ?lang= → 저장값(mtp_lang) → 기본값(영어) — 그 페이지에 없는 언어면 영어
(function () {
  'use strict';
  var D = window.I18N || {};
  var OFF = ['es'];   // 🔴 숨길 언어 — 다시 켜려면 여기서 'es' 를 빼면 대문·서울·약관의 언어 고르기와 서울 신청서 「메일 언어」에 다시 나온다
  var LANGS = (window.PAGE_LANGS || ['en', 'ko', 'ja', 'zhs', 'zht', 'es']).filter(function (l) { return OFF.indexOf(l) < 0; });
  window.VIP_LANGS = LANGS;   // request.js 「메일 언어」 칸도 이 목록으로
  var HTML_LANG = { en: 'en', ko: 'ko', ja: 'ja', es: 'es', zhs: 'zh-Hans', zht: 'zh-Hant' };
  var KEY = 'mtp_lang';
  var cur = 'en';

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function fromBrowser() {   // 한국어·일본어·중국어(간체·번체)·스페인어 외에는 영어 — 그 페이지에 없는 언어면 apply 가 영어로
    var l = '';
    try { l = ((navigator.languages && navigator.languages[0]) || navigator.language || '').toLowerCase(); } catch (e) {}
    if (/^ko/.test(l) && LANGS.indexOf('ko') >= 0) return 'ko';
    if (/^ja/.test(l)) return 'ja';
    if (/^zh-(hant|tw|hk|mo)\b/.test(l)) return 'zht';   // zh-TW·zh-HK·zh-MO·zh-Hant
    if (/^zh\b/.test(l)) return 'zhs';                    // zh-CN·zh-SG·zh-Hans·zh
    if (/^es/.test(l)) return 'es';
    return 'en';
  }
  function t(k) { var s = (D[cur] && D[cur][k]); if (s == null) s = D.en && D.en[k]; return s == null ? '' : s; }
  window.VIPT = t;

  function apply(lang, save) {
    if (LANGS.indexOf(lang) < 0) lang = 'en';
    cur = lang; window.VIP_LANG = lang;
    var root = document.documentElement;
    root.lang = HTML_LANG[lang]; root.setAttribute('data-lang', lang);
    document.querySelectorAll('[data-i18n]').forEach(function (el) { var s = t(el.getAttribute('data-i18n')); if (s) el.textContent = s; });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) { el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph'))); });
    if (t('meta.title')) document.title = t('meta.title');
    var md = document.querySelector('meta[name="description"]'); if (md && t('meta.desc')) md.setAttribute('content', t('meta.desc'));
    document.querySelectorAll('[data-set-lang]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-set-lang') === lang ? 'true' : 'false'); });
    document.querySelectorAll('.lang-select').forEach(function (s) { s.value = lang; });
    var din = document.getElementById('door-in'); if (din) din.setAttribute('href', 'seoul/?lang=' + (lang === 'ko' ? 'en' : lang));   // 대문 언어 그대로 서울 페이지로 (서울은 한국어가 없어 영어로)
    document.querySelectorAll('a[data-lang-href]').forEach(function (a) {   // 꼬리말 「약관·환불 규정」 — 지금 언어 그대로 약관 페이지로 (11-16)
      var h = a.getAttribute('data-lang-href'), i = h.indexOf('#');
      a.setAttribute('href', (i < 0 ? h : h.slice(0, i)) + '?lang=' + lang + (i < 0 ? '' : h.slice(i)));
    });
    if (save) store(KEY, lang);
    try { document.dispatchEvent(new CustomEvent('vip:lang', { detail: lang })); } catch (e) {}
  }

  // 언어 고르기 — 이 페이지 언어(LANGS)에 없는 단추는 숨기고(HTML 에서 hidden 으로 시작) 항목은 뺀다
  document.querySelectorAll('[data-set-lang]').forEach(function (b) { b.hidden = LANGS.indexOf(b.getAttribute('data-set-lang')) < 0; });
  document.querySelectorAll('.lang-select option').forEach(function (o) { if (LANGS.indexOf(o.value) < 0) o.parentNode.removeChild(o); });

  var q = null;
  try { q = new URLSearchParams(location.search).get('lang'); } catch (e) {}
  var saved = store(KEY);
  var start = (q && LANGS.indexOf(q) >= 0) ? q : ((saved && LANGS.indexOf(saved) >= 0) ? saved : (window.DEFAULT_LANG === 'browser' ? fromBrowser() : (window.DEFAULT_LANG || 'en')));
  apply(start, false);

  document.querySelectorAll('[data-set-lang]').forEach(function (b) {
    b.addEventListener('click', function () { apply(b.getAttribute('data-set-lang'), true); });
  });
  document.querySelectorAll('.lang-select').forEach(function (s) {
    s.addEventListener('change', function () { apply(s.value, true); });
  });

  // 방문자 수 (11-16 사장님 「누적 방문자 수·오늘 방문자수·오늘 조회수 … 나는 빼줘」) — 허브 /hc?s=vip (MosaicTrip 홈페이지와 같은 방식, 따로 셈)
  //  · 세는 곳: 이 파일을 쓰는 공개 페이지(대문·서울·약관)를 열 때마다 조회 1 · 방문자 = 브라우저 난수(vip_vid, 개인정보 없음)
  //  · 안 세는 것: 사장님 기기(vip_owner — 관리자 화면을 연 기기, 또는 ?me=EM2410 로 한 번 연 기기) · viphola.com 밖(이 PC 미리보기)
  //               · 사장님 집 인터넷·로봇·헤드리스 시험은 허브가 뺌 · 숫자는 대문 맨 아래(#vcnt)에만 보임
  var VC = null;
  function vcPaint() {
    var e = document.getElementById('vcnt'); if (!e || !VC) return;
    var f = function (x) { return Number(x || 0).toLocaleString('en-US'); };
    var T = { ko: ['누적 방문자 ', '명 · 오늘 방문자 ', '명 · 오늘 조회 ', '회'], en: ['Total visitors ', ' · Visitors today ', ' · Views today ', ''],
      ja: ['累計訪問者 ', '人 · 今日の訪問者 ', '人 · 今日の閲覧 ', '回'], zhs: ['累计访客 ', '人 · 今日访客 ', '人 · 今日浏览 ', '次'],
      zht: ['累計訪客 ', '人 · 今日訪客 ', '人 · 今日瀏覽 ', '次'], es: ['Visitantes totales ', ' · Visitantes hoy ', ' · Visitas hoy ', ''] }[cur] || null;
    if (!T) T = ['Total visitors ', ' · Visitors today ', ' · Views today ', ''];
    e.textContent = T[0] + f(VC.uniq) + T[1] + f(VC.tuniq) + T[2] + f(VC.today) + T[3];
  }
  try {
    var vid = '', n = '1';
    try { if (/[?&]me=EM2410/i.test(location.search)) localStorage.setItem('vip_owner', '1'); if (localStorage.getItem('vip_owner')) n = '0'; } catch (e) {}
    try { vid = localStorage.getItem('vip_vid') || ''; if (!vid) { vid = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('vip_vid', vid); } } catch (e) {}
    if (!/(^|\.)viphola\.com$/i.test(location.hostname)) n = '0';
    fetch((window.VIP_HUB || 'https://brief-live-hub.emhwang3.workers.dev') + '/hc?s=vip&n=' + n + '&vid=' + encodeURIComponent(vid), { cache: 'no-store' })
      .then(function (r) { return r.json(); }).then(function (j) { VC = j; vcPaint(); }).catch(function () {});
    document.addEventListener('vip:lang', vcPaint);
  } catch (e) {}

  // 카드 넘기기 표시(폰)
  var cards = document.getElementById('cards'), dots = document.getElementById('dots');
  if (cards && dots) {
    var ds = dots.querySelectorAll('i');
    cards.addEventListener('scroll', function () {
      var w = cards.scrollWidth - cards.clientWidth; if (w <= 0) return;
      var i = Math.round((cards.scrollLeft / w) * (ds.length - 1));
      ds.forEach(function (d, k) { d.classList.toggle('on', k === i); });
    }, { passive: true });
  }
})();
