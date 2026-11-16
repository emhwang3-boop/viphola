// viphola.com 공용 — 언어 변경 · 카드 넘기기 표시 (신청 칸은 request.js)
//  · 쓸 수 있는 언어는 페이지마다: 대문 = 한국어·영어·일본어·스페인어 · 서울(인바운드) = 영어·일본어·스페인어 (11-15 사장님 「인바운드는 한국어 필요없어」) · 약관(/terms/) = 네 언어 (11-16)
//  · 처음 언어: 주소 ?lang= → 저장값(mtp_lang) → 기본값(영어) — 그 페이지에 없는 언어면 영어
(function () {
  'use strict';
  var D = window.I18N || {};
  var LANGS = window.PAGE_LANGS || ['en', 'ko', 'ja', 'es'];
  var HTML_LANG = { en: 'en', ko: 'ko', ja: 'ja', es: 'es' };
  var KEY = 'mtp_lang';
  var cur = 'en';

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function fromBrowser() {   // 한국어·일본어·스페인어 외에는 영어
    var l = '';
    try { l = ((navigator.languages && navigator.languages[0]) || navigator.language || '').toLowerCase(); } catch (e) {}
    if (/^ko/.test(l) && LANGS.indexOf('ko') >= 0) return 'ko';
    if (/^ja/.test(l)) return 'ja';
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
