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
    zhs: ['Booman Inc.（株式会社 富滿） | 营业执照号 : 297-81-03712 | 通信销售业申告号 : (     ) | 位置服务业务申报号 : 第1866号', '代表 : Jeon Hyeonjin | 个人信息管理负责人 : Hwang Euiman', '客服 : +82-10-4221-7066 | 邮箱 : ' + em, ADDR_EN],
    zht: ['Booman Inc.（株式會社 富滿） | 營業執照號 : 297-81-03712 | 通信銷售業申告號 : (     ) | 位置服務業務申報號 : 第1866號', '代表 : Jeon Hyeonjin | 個人資料管理負責人 : Hwang Euiman', '客服 : +82-10-4221-7066 | 電郵 : ' + em, ADDR_EN],
    es: ['Booman Inc. | N.º de registro mercantil : 297-81-03712 | N.º de venta a distancia : (     ) | N.º de servicio de localización : 1866', 'Representante : Jeon Hyeonjin | Resp. de privacidad : Hwang Euiman', 'Atención : +82-10-4221-7066 | Correo : ' + em, ADDR_EN]
  };
  // 관광사업자 등록번호 — 모든 화면(대문·서울·약관·결제·스페인어권), 사업자등록번호 바로 뒤 (11-17 사장님 「서울·약관·결제 화면 맨 아래도 바꿔줘」 · 「관광사업자 등록번호 : 제00000호 로 해서 … viphola.com 첫 페이지 아래에」) · 번호 나오면 여기만 바꾼다
  var TR = { ko: '관광사업자 등록번호 : 제00000호', en: 'Tourism Business Reg. No. 00000', ja: '観光事業者登録番号 : 第00000号', zhs: '旅游业登记号 : 第00000号', zht: '旅遊業登記號 : 第00000號', es: 'N.º de registro de empresa turística : 00000' };
  function render(l) {
    document.querySelectorAll('.bizinfo').forEach(function (el) {
      var lg = el.getAttribute('data-lang') || l, a = F[lg] || F.en;
      { var p = a[0].split(' | '); p.splice(2, 0, TR[F[lg] ? lg : 'en']); a = [p.join(' | ')].concat(a.slice(1)); }
      el.innerHTML = a.map(function (x) { return '<span>' + x + '</span>'; }).join('');
    });
  }
  window.VIP_BIZINFO = render;
  document.addEventListener('vip:lang', function (e) { render(e.detail); });
  var l0 = document.documentElement.getAttribute('data-lang') || document.documentElement.lang || 'en';
  render(F[l0] ? l0 : l0.slice(0, 2));   // zhs·zht 는 그대로(앞 두 글자로 자르지 않음)
})();
