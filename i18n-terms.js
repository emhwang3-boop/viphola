// viphola.com/terms/ — 여행 약관·환불 규정 페이지 머리·꼬리 문구 (한국어 · English · 日本語 · 简体中文 · 繁體中文 · Español — 11-16 스페인어 숨김, main.js OFF)
//  · 11-16 사장님 「완성이 되면 표준약관과 환불규정을 사이트에 게시해」 · 본문은 terms/index.html 안에 언어별로(.legal-doc[data-tl]) — 원본 마케팅\VIP\약관\약관_환불규정_초안_{ko,en,ja,es}.md
//  · 문구 언어: 주소 ?lang= → 사용자가 선택한 언어(저장값 mtp_lang) → 영어(기본값) — 대문과 같은 방식(main.js)
//  · 시행일: 11-16 사장님 「머리에 시행일은 넣고 년 월 일로 비워 둬야지」 → 머리말에 빈칸(t.effb) · 날짜를 받으면 <span id="eff">YYYY-MM-DD</span> 로 바꾸면 언어별 날짜로 들어간다
//  · 바로 가기 #terms·#refund 는 지금 보이는 언어 본문에 붙인다 (언어를 바꾸면 옮겨 붙임)
window.PAGE = 'terms';
window.DEFAULT_LANG = 'en';
window.PAGE_LANGS = ['en', 'ko', 'ja', 'zhs', 'zht', 'es'];   // es 는 main.js OFF 로 숨김
window.I18N = {
  en: {
    'meta.title': 'VIPHola.com — Terms & refund policy',
    'meta.desc': 'Terms and conditions of travel and the cancellation and refund policy for VIPHola.com bespoke journeys.',
    'lang.label': 'Language',
    't.title': 'Terms and Conditions of Travel and Cancellation & Refund Policy',
    't.eff': 'Effective from: ', 't.effb': 'Effective from: ______________________',
    't.jumpA': 'A. Terms and Conditions of Travel', 't.jumpB': 'B. Cancellation & Refund Policy',
    'foot.company': 'Booman Inc.', 'foot.contact': 'Enquiries'
  },
  ko: {
    'meta.title': 'VIPHola.com — 여행 약관·환불 규정',
    'meta.desc': 'VIPHola.com 맞춤 여행의 여행 약관과 환불 규정입니다. 취소 수수료, 환불 방법과 기한을 안내합니다.',
    'lang.label': '언어',
    't.title': '여행 약관 및 환불 규정',
    't.eff': '시행일: ', 't.effb': '시행일: 　　　　년　　　월　　　일',
    't.jumpA': '가. 여행 약관', 't.jumpB': '나. 환불 규정',
    'foot.company': '주식회사 부만', 'foot.contact': '문의'
  },
  ja: {
    'meta.title': 'VIPHola.com — 旅行約款・取消返金規定',
    'meta.desc': 'VIPHola.com オーダーメイド旅行の旅行約款および取消・返金規定です。取消料、返金の方法と期限をご案内します。',
    'lang.label': '言語',
    't.title': '旅行約款および取消・返金規定',
    't.eff': '施行日：', 't.effb': '施行日：　　　　年　　　月　　　日',
    't.jumpA': 'A. 旅行約款', 't.jumpB': 'B. 取消・返金規定',
    'foot.company': 'Booman Inc.', 'foot.contact': 'お問い合わせ'
  },
  zhs: {
    'meta.title': 'VIPHola.com — 旅行条款与退款规定',
    'meta.desc': 'VIPHola.com 定制旅行的旅行条款及取消与退款规定，说明取消手续费以及退款的方式与期限。',
    'lang.label': '语言',
    't.title': '旅行条款及取消与退款规定',
    't.eff': '生效日期：', 't.effb': '生效日期：　　　　年　　　月　　　日',
    't.jumpA': 'A. 旅行条款', 't.jumpB': 'B. 取消与退款规定',
    'foot.company': '株式会社 富滿', 'foot.contact': '联系我们'
  },
  zht: {
    'meta.title': 'VIPHola.com — 旅行條款與退款規定',
    'meta.desc': 'VIPHola.com 訂製旅行的旅行條款及取消與退款規定，說明取消手續費以及退款的方式與期限。',
    'lang.label': '語言',
    't.title': '旅行條款及取消與退款規定',
    't.eff': '生效日期：', 't.effb': '生效日期：　　　　年　　　月　　　日',
    't.jumpA': 'A. 旅行條款', 't.jumpB': 'B. 取消與退款規定',
    'foot.company': '株式會社 富滿', 'foot.contact': '聯絡我們'
  },
  es: {
    'meta.title': 'VIPHola.com — Condiciones y política de reembolso',
    'meta.desc': 'Condiciones generales del viaje y política de cancelación y reembolso de los viajes a medida de VIPHola.com.',
    'lang.label': 'Idioma',
    't.title': 'Condiciones generales del viaje y Política de cancelación y reembolso',
    't.eff': 'En vigor desde: ', 't.effb': 'En vigor desde el ______ de ______________ de ________',
    't.jumpA': 'A. Condiciones generales del viaje', 't.jumpB': 'B. Política de cancelación y reembolso',
    'foot.company': 'Booman Inc.', 'foot.contact': 'Consultas'
  }
};

(function () {
  'use strict';
  var LOC = { ko: 'ko-KR', en: 'en-GB', ja: 'ja-JP', es: 'es-ES', zhs: 'zh-CN', zht: 'zh-TW' }, iso = null;
  function fmt(s, l) {   // 2026-11-17 → 2026년 11월 17일 · 17 November 2026 · 2026年11月17日 · 17 de noviembre de 2026
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return s;
    try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))); } catch (e) { return s; }
  }
  // main.js 가 언어를 정할 때마다(처음 한 번 포함) 부른다 — 그래서 main.js 보다 먼저 읽어야 한다
  document.addEventListener('vip:lang', function (e) {
    var l = e.detail, eff = document.getElementById('eff');
    if (eff) {
      if (iso == null) { iso = (eff.textContent || '').trim(); eff.setAttribute('data-date', iso); }
      var d = fmt(iso, l); eff.textContent = d;
      document.querySelectorAll('.eff-ref').forEach(function (x) { x.textContent = d; });
    }
    document.querySelectorAll('.legal-doc [data-sec="terms"], .legal-doc [data-sec="refund"]').forEach(function (s) {
      var tl = s.closest('.legal-doc').getAttribute('data-tl'), k = s.getAttribute('data-sec');
      s.id = tl === l ? k : k + '-' + tl;
    });
  });
  // 주소 끝에 #terms·#refund 가 붙어 열리면(결제 화면의 「전체 약관·환불 규정 보기」) 글꼴이 다 들어온 뒤 그 자리로 다시 맞춘다
  function jump() { var h = location.hash.slice(1); if (h !== 'terms' && h !== 'refund') return; var t = document.getElementById(h); if (t) t.scrollIntoView(); }
  window.addEventListener('load', function () { jump(); try { document.fonts.ready.then(jump); } catch (e) {} });
})();
