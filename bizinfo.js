// viphola.com 맨 아래 사업자 정보 — 투어앱(navi_pub index.html footBuild)과 같은 내용 (11-16 사장님 「투어앱 맨 아래 회사 정보를 그대로 viphola.com 에도」 → 「넣어」)
//  · 이메일만 VIPHola 주소(concierge@viphola.com) · 통신판매업 신고번호는 투어앱처럼 ( ) 빈칸
//  · 페이지의 .bizinfo 칸에 넣는다 — 언어: main.js 의 vip:lang 이벤트(대문·서울·약관), 결제 화면은 pay.js 가 VIP_BIZINFO(언어) 를 부름, 칸에 data-lang 이 있으면 그 언어로 고정(스페인어권 준비 중 페이지 = ko)
//  · main.js 보다 먼저 읽어야 한다(처음 언어 이벤트를 받으려고)
(function () {
  'use strict';
  var em = '<a href="mailto:concierge@viphola.com">concierge@viphola.com</a>';
  var ADDR_EN = '220 Haemilyedang 1-ro, Jinjeop-eup, Namyangju-si, Gyeonggi-do, Rm 707 C64 (M Tower), Korea';
  var F = {
    ko: ['주식회사 부만 | 사업자등록번호 : 297-81-03712 | 통신판매업 신고번호 : (     ) | 위치기반서비스사업 신고 : 제1866호', '대표 : 전현진 | 개인정보관리책임자 : 황의만', '고객센터 : 010-4221-7066 | 이메일 : ' + em, '경기도 남양주시 진접읍 해밀예당1로 220, 707호 씨64호(엠타워)'],
    en: ['Booman Inc. | Business Reg. No. 297-81-03712 | Mail-order Sales Reg. No. : (     ) | Location-Based Service Reg. No. 1866', 'CEO : Jeon Hyeonjin | Compliance Officer : Hwang Euiman', 'Support : +82-10-4221-7066 | Email : ' + em, ADDR_EN],
    ja: ['株式会社 富滿（Booman Inc.） | 事業者登録番号 : 297-81-03712 | 通信販売業申告番号 : (     ) | 位置情報サービス事業申告 : 第1866号', '代表 : 全賢珍（Jeon Hyeonjin） | 個人情報管理責任者 : 黄義晩', 'カスタマーセンター : +82-10-4221-7066 | メール : ' + em, ADDR_EN],
    es: ['Booman Inc. | N.º de registro mercantil : 297-81-03712 | N.º de venta a distancia : (     ) | N.º de servicio de localización : 1866', 'Representante : Jeon Hyeonjin | Resp. de privacidad : Hwang Euiman', 'Atención : +82-10-4221-7066 | Correo : ' + em, ADDR_EN]
  };
  function render(l) {
    document.querySelectorAll('.bizinfo').forEach(function (el) {
      var a = F[el.getAttribute('data-lang') || l] || F.en;
      el.innerHTML = a.map(function (x) { return '<span>' + x + '</span>'; }).join('');
    });
  }
  window.VIP_BIZINFO = render;
  document.addEventListener('vip:lang', function (e) { render(e.detail); });
  render((document.documentElement.getAttribute('data-lang') || document.documentElement.lang || 'en').slice(0, 2));
})();
