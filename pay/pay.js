/* viphola.com/pay/?q=<토큰> — 견적 메일 링크로만 열리는 손님 화면 (11-15 사장님 「실행해」 · 「그렇게 하자」)
 *  상태 셋: ① 견적 + VIP 특별 약관 동의 + 카드 결제(KG이니시스·포트원 — 허브가 채널 키를 가졌을 때만 결제창, 없으면 「결제하기」 = 바로 결제 완료)
 *          ② 결제 완료 · 예약 확보 중   ③ 「확정 메일 보내기」 뒤 = 손님 여정 화면(일정·기사·가이드·예약 확인번호·컨시어지·긴급)
 *  유효기간이 지나면 「견적 기간이 끝났습니다」 · 여행 마지막 날 + 14일이 지나면 감사 인사만 · 언어 = 견적 언어(en·ja·es) */
(function () {
  'use strict';
  var HUB = window.VIP_HUB || 'https://brief-live-hub.emhwang3.workers.dev', PSDK = 'https://cdn.portone.io/v2/browser-sdk.js', MAIL = 'concierge@viphola.com';
  var box = document.getElementById('pay'), sp = new URLSearchParams(location.search), Q = sp.get('q') || '', L = 'en', D = null;
  var LOC = { en: 'en-GB', ja: 'ja-JP', es: 'es-ES' };
  var TX = {
    en: { load: 'Loading your quote…', bad: 'This link is not valid. Please use the link in your email, or write to us at {m}.', net: 'We could not reach our server. Please refresh this page in a moment.',
      qk: 'Your quote', pkg: 'Seoul Wellness & Gastronomy', prep: 'Prepared for {n}', no: 'Quote no.', iss: 'Date of issue', valid: 'Valid until', car: 'Vehicle', opts: 'Options', none: 'None',
      item: 'Item', amt: 'Amount', total: 'Total (KRW)', incl: 'Included', krw: 'Payment is made in Korean won (KRW). Your card issuer converts the amount into your card’s currency.',
      tt: 'Special terms for this bespoke journey: cancellation and refunds',
      t1: 'This journey is arranged especially for you, so the following special terms apply.',
      t1b: 'These special terms differ from the Korea Fair Trade Commission’s Domestic Travel Standard Terms and Consumer Dispute Settlement Criteria, and take precedence over them.',
      t2: 'Refund = amount paid − cancellation fees charged by our partner suppliers (hotel, restaurants, spas, car and airport services) under their own policies − our cancellation fee.',
      t3: 'Our cancellation fee, as a share of the journey price:', f1: 'Until 30 days before Day 1', f2: '29 to 8 days before', f3: '7 days before or later',
      t4: 'Days are counted to Day 1 of your journey, in Korea time.',
      full: 'View the full terms and refund policy', ft: 'Terms & refund policy',
      agree: 'I have read and agree to these special terms.', pay: 'Pay {a} by card', fine: 'Card payment only (KG Inicis). Your quote is valid until {d}.',
      opening: 'Opening the secure payment window…', checking: 'Confirming your payment…',
      eAgree: 'Please tick the box to agree to the special terms.', eExp: 'This quote has expired.', ePaid: 'This quote has already been paid.', eFail: 'The payment was not completed. Please try again.',
      ePend: 'We are still confirming your payment. This page will update shortly, and we will also email you.', eAmt: 'The payment amount did not match. Please contact us at {m}.', ePg: 'The card payment window could not be opened. Please try again later, or write to us at {m}.',
      expH: 'This quote has expired', expP: 'Please contact us and we will be glad to prepare a new one.',
      paidK: 'Paid', paidH: 'Thank you', paidP: 'Your payment has been received. We are now securing your bookings and will email your confirmation shortly.', paidAmt: 'Amount paid', paidOn: 'Paid on', kst: 'Korea time',
      tripK: 'Your journey', welcome: 'Welcome, {n}. Everything for your days in Seoul is on this page.',
      conc: 'Your concierge', concP: 'Reach your concierge at any time, day or night.', wa: 'WhatsApp', call: 'Call {t}', mail: 'Email',
      team: 'Your team', drv: 'Your driver', gd: 'Your guide', plate: 'Plate', soon: 'Details will appear here shortly.',
      rsv: 'Reservations', conf: 'Confirmation no.', itin: 'Your itinerary',
      sos: '<b>In an emergency in Korea:</b> police 112 · fire and ambulance 119 · Korea Travel Hotline 1330 (24 hours, multilingual).',
      overH: 'Thank you for travelling with us', overP: 'We hope to welcome you to Seoul again. For anything at all, write to us at {m}.', guests1: '1 guest', guestsN: '{n} guests',
      craftL: 'Craft experience', cr: { najeon: 'Mother-of-pearl hand mirror (Jeong Myeong-chae)', silver: 'Silver ring (Lee Hwang-jae)' }, opt: { porter: 'Porter service', photo: 'Professional photographer', hanbok: 'Bespoke hanbok', wine: 'Wine pairing', gj: 'Gyeongju extension, 1 night / 2 days', bnb: 'Born & Bred hanwoo omakase (replaces Sushi Kanesaka)', nam: 'Namsan morning walk (replaces the morning tea at Rakkojae)' }, co: 'Booman Inc.' },
    ja: { load: 'お見積りを読み込んでいます…', bad: 'このリンクは無効です。メールに記載のリンクをご利用いただくか、{m} までご連絡ください。', net: 'サーバーに接続できませんでした。しばらくしてからページを再読み込みしてください。',
      qk: 'お見積り', pkg: 'ソウル ウェルネス＆ガストロノミー', prep: '{n} 様', no: 'お見積り番号', iss: '発行日', valid: '有効期限', car: 'お車', opts: 'オプション', none: 'なし',
      item: '項目', amt: '金額', total: '合計（KRW）', incl: '含まれます', krw: 'お支払いは韓国ウォン（KRW）建てです。お客様のカード会社が、カードの通貨に換算いたします。',
      tt: 'ご旅行の特別条件（取消・返金）',
      t1: '本旅行はお客様のためにお仕立てする旅程のため、以下の特別条件が適用されます。',
      t1b: 'この特別条件は、韓国公正取引委員会の国内旅行標準約款および消費者紛争解決基準と異なり、これらに優先して適用されます。',
      t2: '返金額 ＝ お支払い額 − 提携先（ホテル・レストラン・スパ・お車・空港サービス）が各規定に基づき請求する取消料 − 当社の取消手数料',
      t3: '当社の取消手数料（旅行代金に対する割合）：', f1: '1日目の30日前まで', f2: '29日前〜8日前', f3: '7日前以降',
      t4: '日数は旅行1日目を基準に、韓国時間で数えます。',
      full: '旅行約款・取消返金規定の全文を見る', ft: '約款・返金規定',
      agree: '上記の特別条件を読み、同意します。', pay: '{a} をカードで支払う', fine: 'お支払いはカードのみ（KG イニシス）です。お見積りの有効期限は{d}です。',
      opening: '決済画面を開いています…', checking: 'お支払いを確認しています…',
      eAgree: '特別条件に同意するチェックを入れてください。', eExp: 'このお見積りは有効期限が過ぎました。', ePaid: 'このお見積りはお支払い済みです。', eFail: 'お支払いが完了しませんでした。もう一度お試しください。',
      ePend: 'お支払いを確認しております。まもなくこの画面が更新され、メールでもお知らせいたします。', eAmt: 'お支払い金額が一致しませんでした。{m} までご連絡ください。', ePg: 'カード決済の画面を開くことができませんでした。しばらくしてから再度お試しいただくか、{m} までご連絡ください。',
      expH: 'お見積りの有効期限が過ぎました', expP: 'お手数ですが、改めてお問い合わせください。新しいお見積りをお送りいたします。',
      paidK: 'お支払い済み', paidH: 'ありがとうございます', paidP: 'お支払いを確認いたしました。ただいま各予約を確保しており、確定のご案内をまもなくメールでお送りいたします。', paidAmt: 'お支払い金額', paidOn: 'お支払い日時', kst: '韓国時間',
      tripK: 'ご旅程', welcome: '{n} 様、ソウルでの日々に必要なことはすべてこのページにまとめております。',
      conc: 'コンシェルジュ', concP: '昼夜を問わず、いつでもコンシェルジュにご連絡いただけます。', wa: 'WhatsApp', call: '電話 {t}', mail: 'メール',
      team: '担当スタッフ', drv: 'ドライバー', gd: 'ガイド', plate: 'ナンバー', soon: 'まもなくこちらにご案内いたします。',
      rsv: 'ご予約', conf: '確認番号', itin: '旅程',
      sos: '<b>韓国での緊急時：</b>警察 112・消防／救急 119・観光案内電話 1330（24時間・多言語）',
      overH: 'ご旅行ありがとうございました', overP: 'またソウルでお目にかかれますように。ご用の際は {m} までご連絡ください。', guests1: '1名様', guestsN: '{n}名様',
      craftL: '伝統工芸体験', cr: { najeon: '螺鈿の手鏡（チョン・ミョンチェ氏）', silver: '銀の指輪（イ・ファンジェ氏）' }, opt: { porter: 'ポーターサービス', photo: 'プロカメラマン', hanbok: 'オーダーメイドの韓服', wine: 'ワインペアリング', gj: '慶州への延長（1泊2日）', bnb: 'Born & Bred 韓牛おまかせ（鮨 かねさかと差し替え）', nam: '南山の朝の散策（楽古斎の茶礼と差し替え）' }, co: '株式会社 富滿（Booman Inc.）' },
    es: { load: 'Cargando su presupuesto…', bad: 'Este enlace no es válido. Utilice el enlace de su correo o escríbanos a {m}.', net: 'No hemos podido conectar con nuestro servidor. Actualice esta página en unos momentos.',
      qk: 'Su presupuesto', pkg: 'Seúl: bienestar y gastronomía', prep: 'Preparado para {n}', no: 'N.º de presupuesto', iss: 'Fecha de emisión', valid: 'Válido hasta', car: 'Vehículo', opts: 'Opciones', none: 'Ninguna',
      item: 'Concepto', amt: 'Importe', total: 'Total (KRW)', incl: 'Incluido', krw: 'El pago se realiza en wones coreanos (KRW). El emisor de su tarjeta convierte el importe a la moneda de su tarjeta.',
      tt: 'Condiciones especiales de este viaje a medida: cancelación y reembolsos',
      t1: 'Este viaje se organiza especialmente para usted, por lo que se aplican las siguientes condiciones especiales.',
      t1b: 'Estas condiciones especiales difieren de las Condiciones Generales Tipo para Viajes Nacionales y de los Criterios de Resolución de Conflictos de Consumo de la Comisión de Comercio Justo de Corea, y prevalecen sobre ellos.',
      t2: 'Reembolso = importe pagado − gastos de cancelación que apliquen nuestros proveedores (hotel, restaurantes, spas, vehículo y servicios aeroportuarios) según sus propias condiciones − nuestra comisión de cancelación.',
      t3: 'Nuestra comisión de cancelación, sobre el precio del viaje:', f1: 'Hasta 30 días antes del día 1', f2: 'De 29 a 8 días antes', f3: 'Desde 7 días antes',
      t4: 'Los días se cuentan hasta el día 1 del viaje, en hora de Corea.',
      full: 'Ver las condiciones generales y la política de reembolso completas', ft: 'Condiciones y reembolsos',
      agree: 'He leído y acepto estas condiciones especiales.', pay: 'Pagar {a} con tarjeta', fine: 'Solo pago con tarjeta (KG Inicis). Su presupuesto es válido hasta el {d}.',
      opening: 'Abriendo la ventana de pago segura…', checking: 'Confirmando su pago…',
      eAgree: 'Marque la casilla para aceptar las condiciones especiales.', eExp: 'Este presupuesto ha caducado.', ePaid: 'Este presupuesto ya está pagado.', eFail: 'El pago no se completó. Inténtelo de nuevo.',
      ePend: 'Aún estamos confirmando su pago. Esta página se actualizará en breve y también le avisaremos por correo.', eAmt: 'El importe pagado no coincide. Escríbanos a {m}.', ePg: 'No se pudo abrir la ventana de pago con tarjeta. Inténtelo de nuevo más tarde o escríbanos a {m}.',
      expH: 'Este presupuesto ha caducado', expP: 'Le rogamos que se ponga en contacto con nosotros y le prepararemos uno nuevo con mucho gusto.',
      paidK: 'Pagado', paidH: 'Muchas gracias', paidP: 'Hemos recibido su pago. Ya estamos asegurando sus reservas y le enviaremos la confirmación por correo en breve.', paidAmt: 'Importe pagado', paidOn: 'Fecha de pago', kst: 'hora de Corea',
      tripK: 'Su viaje', welcome: 'Bienvenido/a, {n}. Todo lo que necesita para sus días en Seúl está en esta página.',
      conc: 'Su conserje', concP: 'Puede contactar con su conserje en cualquier momento, de día o de noche.', wa: 'WhatsApp', call: 'Llamar al {t}', mail: 'Correo',
      team: 'Su equipo', drv: 'Su chófer', gd: 'Su guía', plate: 'Matrícula', soon: 'Los datos aparecerán aquí en breve.',
      rsv: 'Reservas', conf: 'N.º de confirmación', itin: 'Su itinerario',
      sos: '<b>En caso de emergencia en Corea:</b> policía 112 · bomberos y ambulancia 119 · línea de ayuda al turista 1330 (24 horas, varios idiomas).',
      overH: 'Gracias por viajar con nosotros', overP: 'Esperamos recibirle de nuevo en Seúl. Para cualquier cosa, escríbanos a {m}.', guests1: '1 persona', guestsN: '{n} personas',
      craftL: 'Artesanía', cr: { najeon: 'Espejo de nácar (Jeong Myeong-chae)', silver: 'Anillo de plata (Lee Hwang-jae)' }, opt: { porter: 'Servicio de equipaje', photo: 'Fotógrafo profesional', hanbok: 'Hanbok a medida', wine: 'Maridaje de vinos', gj: 'Extensión a Gyeongju, 1 noche / 2 días', bnb: 'Omakase hanwoo en Born & Bred (en lugar de Sushi Kanesaka)', nam: 'Paseo matinal por Namsan (en lugar de la ceremonia del té en Rakkojae)' }, co: 'Booman Inc.' }
  };
  function T(k) { var s = (TX[L] && TX[L][k]); return s == null ? TX.en[k] : s; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function grp(n) { return String(Math.round(Math.abs(Number(n) || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, L === 'es' ? '.' : ','); }
  function krw(n) { return '₩' + grp(n); }
  function fd(ymd, wd) { try { return new Intl.DateTimeFormat(LOC[L], wd ? { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' } : { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(ymd + 'T00:00:00Z')); } catch (e) { return ymd; } }
  function mailA() { return '<a href="mailto:' + MAIL + '">' + MAIL + '</a>'; }
  function msg(html, orn) { box.innerHTML = '<div class="pay-msg">' + (orn ? '<span class="art art-orn"><img src="../img/mugunghwa-mark.png" alt=""></span>' : '') + html + '</div>'; }
  function api(path, body) {
    var o = body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {};
    return fetch(HUB + path, o).then(function (r) { return r.json().catch(function () { return { ok: false }; }); });
  }
  function setLang(l) {
    L = l === 'ja' || l === 'es' ? l : 'en';
    document.documentElement.lang = L; document.documentElement.setAttribute('data-lang', L);
    document.getElementById('pf-co').textContent = T('co');
    var ft = document.getElementById('pf-terms'); if (ft) { ft.textContent = T('ft'); ft.setAttribute('href', '../terms/?lang=' + L); }   // 꼬리말 약관 링크 — 견적 언어 그대로 (11-16)
  }

  function head(k, sub) { return '<header class="pay-head"><p class="kicker">' + esc(k) + '</p><h1>' + esc(T('pkg')) + '</h1><p>' + esc(sub) + '</p></header>'; }
  function subLine() { return fd(D.date) + ' – ' + fd(D.end) + ' · ' + (D.guests === 1 ? T('guests1') : T('guestsN').replace('{n}', D.guests)); }
  function itinHtml(it) {
    if (!it) return '';
    return '<section class="pay-sec"><h2>' + esc(T('itin')) + '</h2>' + it.days.map(function (x) {
      return '<section class="rv-day"><p class="rv-dh"><span class="day">' + esc(x.day) + '</span><span class="rv-date">' + esc(x.dl) + '</span></p><h4>' + esc(x.title) + '</h4><ol class="rv-items">'
        + x.items.map(function (i) { return '<li><span class="rv-no">' + i.no + '</span><span class="rv-t">' + esc(i.t) + '</span><span class="rv-x">' + esc(i.x) + '</span></li>'; }).join('')
        + '</ol>' + (x.note ? '<p class="rv-note">' + esc(x.note) + '</p>' : '') + '</section>';
    }).join('') + '<p class="rv-all">' + esc(it.all) + '</p></section>';
  }
  function quoteHtml() {
    var q = D.q, op = D.opts.map(function (k) { return T('opt')[k]; }).filter(Boolean);
    return '<dl class="qmeta"><div><dt>' + esc(T('no')) + '</dt><dd>' + esc(q.no) + '</dd></div><div><dt>' + esc(T('iss')) + '</dt><dd>' + esc(fd(q.issued)) + '</dd></div><div><dt>' + esc(T('valid')) + '</dt><dd>' + esc(fd(q.valid)) + '</dd></div></dl>'
      + '<dl class="qmeta qmeta2"><div><dt>' + esc(T('car')) + '</dt><dd>' + esc(D.car) + '</dd></div>' + (D.craft ? '<div><dt>' + esc(T('craftL')) + '</dt><dd>' + esc(T('cr')[D.craft] || '') + '</dd></div>' : '') + '<div><dt>' + esc(T('opts')) + '</dt><dd>' + esc(op.length ? op.join(L === 'ja' ? '、' : ', ') : T('none')) + '</dd></div></dl>'
      + '<table class="qtable"><thead><tr><th>' + esc(T('item')) + '</th><th>' + esc(T('amt')) + '</th></tr></thead><tbody>'
      + q.lines.map(function (l) { return '<tr><td>' + esc(l.g) + '</td><td>' + (l.p > 0 ? krw(l.p) : esc(T('incl'))) + '</td></tr>'; }).join('')
      + '<tr class="qtot"><td>' + esc(T('total')) + '</td><td>' + krw(q.total) + '</td></tr></tbody></table>'
      + (q.fxLine ? '<p class="qfx">' + esc(q.fxLine) + '</p>' : '') + '<p class="qkrw">' + esc(T('krw')) + '</p>';
  }

  function render() {
    setLang(D.lang); document.title = T('qk') + ' — VIPHola.com';
    if (D.over) { document.title = 'VIPHola.com'; box.innerHTML = head(T('tripK'), subLine()); box.insertAdjacentHTML('beforeend', '<div class="pay-msg"><span class="art art-orn"><img src="../img/mugunghwa-mark.png" alt=""></span><p><b>' + esc(T('overH')) + '</b></p><p>' + T('overP').replace('{m}', mailA()) + '</p></div>'); return; }
    if (D.st === 'confirmed' && D.trip) return renderTrip();
    if (D.st === 'paid' || D.st === 'confirmed') {
      box.innerHTML = head(T('paidK'), subLine()) + '<div class="pay-msg"><span class="art art-orn"><img src="../img/mugunghwa-mark.png" alt=""></span><span class="paid-badge">' + esc(T('paidK')) + '</span><p><b>' + esc(T('paidH')) + '</b></p><p>' + esc(T('paidP')) + '</p></div>'
        + '<dl class="qmeta"><div><dt>' + esc(T('no')) + '</dt><dd>' + esc(D.q.no) + '</dd></div><div><dt>' + esc(T('paidAmt')) + '</dt><dd>' + krw(D.q.total) + ' (KRW)</dd></div><div><dt>' + esc(T('paidOn')) + '</dt><dd>' + esc(D.paidAt) + ' (' + esc(T('kst')) + ')</dd></div></dl>'
        + itinHtml(D.itin);
      return;
    }
    if (D.expired) { box.innerHTML = head(T('qk'), subLine()) + '<div class="pay-msg"><span class="art art-orn"><img src="../img/mugunghwa-mark.png" alt=""></span><p><b>' + esc(T('expH')) + '</b></p><p>' + esc(T('expP')) + '</p><p>' + mailA() + '</p></div>'; return; }
    box.innerHTML = head(T('qk'), T('prep').replace('{n}', D.name) + ' · ' + subLine())
      + '<section>' + quoteHtml() + '</section>'
      + '<section class="pay-sec"><div class="terms"><h3>' + esc(T('tt')) + '</h3><ol><li>' + esc(T('t1')) + (L === 'ja' ? '' : ' ') + esc(T('t1b')) + '</li><li>' + esc(T('t2')) + '</li><li>' + esc(T('t3'))
      + '<table><tr><td>' + esc(T('f1')) + '</td><td>5%</td></tr><tr><td>' + esc(T('f2')) + '</td><td>10%</td></tr><tr><td>' + esc(T('f3')) + '</td><td>20%</td></tr></table></li><li>' + esc(T('t4')) + '</li></ol>'
      + '<p class="terms-full"><a href="../terms/?lang=' + L + '#refund" target="_blank" rel="noopener">' + esc(T('full')) + '</a></p></div>'   // 11-16 표준약관과 다르고 우선 적용된다는 설명(t1b) · 약관 전문 링크
      + '<label class="agree"><input type="checkbox" id="pay-agree"><span>' + esc(T('agree')) + '</span></label>'
      + '<div class="pay-go"><button class="btn" type="button" id="pay-btn">' + esc(T('pay').replace('{a}', krw(D.q.total))) + '</button><p class="fine">' + esc(T('fine').replace('{d}', fd(D.q.valid))) + '</p></div>'
      + '<p class="enq-status pay-st" id="pay-st" role="status" hidden></p></section>'
      + itinHtml(D.itin);
    document.getElementById('pay-btn').addEventListener('click', start);
  }
  function renderTrip() {
    var tr = D.trip, d = tr.drv || {}, g = tr.gd || {}, ph = function (p) { var n = String(p || '').replace(/[^\d+]/g, ''); return n ? '<a href="tel:' + esc(n) + '">' + esc(p) + '</a>' : ''; };
    document.title = T('tripK') + ' — VIPHola.com';
    var conc = '';
    if (tr.wa || tr.tel) conc = '<section class="pay-sec"><h2>' + esc(T('conc')) + '</h2><p class="rv-lead">' + esc(T('concP')) + '</p><div class="contact-row" style="margin-top:18px">'
      + (tr.wa ? '<a class="btn" href="https://wa.me/' + esc(String(tr.wa).replace(/[^\d]/g, '')) + '" target="_blank" rel="noopener">' + esc(T('wa')) + ' · ' + esc(tr.wa) + '</a>' : '')
      + (tr.tel ? '<a class="btn btn-line" href="tel:' + esc(String(tr.tel).replace(/[^\d+]/g, '')) + '">' + esc(T('call').replace('{t}', tr.tel)) + '</a>' : '')
      + '</div><p class="fine" style="margin-top:14px">' + esc(T('mail')) + ' · ' + mailA() + '</p></section>';
    var dc = d.name || d.phone || d.plate ? '<p class="who">' + esc(d.name) + '</p>' + (d.phone ? '<p>' + ph(d.phone) + '</p>' : '') + '<p>' + esc(D.car) + (d.plate ? ' · ' + esc(T('plate')) + ' ' + esc(d.plate) : '') + '</p>' : '<p class="later">' + esc(T('soon')) + '</p>';
    var gc = g.name || g.phone ? '<p class="who">' + esc(g.name) + '</p>' + (g.phone ? '<p>' + ph(g.phone) + '</p>' : '') : '<p class="later">' + esc(T('soon')) + '</p>';
    var rs = (tr.rs || []).length ? '<ul class="rsv">' + tr.rs.map(function (r) { return '<li><span class="rx">' + esc(r.x) + '</span><span class="rt">' + esc(r.t) + '</span>'
      + (r.c || r.m ? '<span class="rc">' + (r.c ? esc(T('conf')) + ' <b>' + esc(r.c) + '</b>' : '') + (r.c && r.m ? ' · ' : '') + (r.m ? esc(r.m) : '') + '</span>' : '') + '</li>'; }).join('') + '</ul>' : '<p class="later">' + esc(T('soon')) + '</p>';
    box.innerHTML = head(T('tripK'), subLine()) + '<p class="pay-msg">' + esc(T('welcome').replace('{n}', D.name)) + '</p>' + conc
      + '<section class="pay-sec"><h2>' + esc(T('team')) + '</h2><div class="tcards"><div class="tcard"><h3>' + esc(T('drv')) + '</h3>' + dc + '</div><div class="tcard"><h3>' + esc(T('gd')) + '</h3>' + gc + '</div></div></section>'
      + '<section class="pay-sec"><h2>' + esc(T('rsv')) + '</h2>' + rs + '</section>'
      + itinHtml(D.itin) + '<p class="sos">' + T('sos') + '</p>';
  }

  function st(t) { var e = document.getElementById('pay-st'); if (!e) return; e.textContent = t || ''; e.hidden = !t; }
  function errTx(e) { return e === 'expired' ? T('eExp') : e === 'paid' ? T('ePaid') : e === 'consent' ? T('eAgree') : e === 'pgoff' ? T('ePg').replace('{m}', MAIL) : e === 'amount' ? T('eAmt').replace('{m}', MAIL) : e === 'fail' ? T('eFail') : e === 'pending' ? T('ePend') : T('net'); }
  var going = false;
  function start() {
    if (going) return;
    if (!document.getElementById('pay-agree').checked) { st(T('eAgree')); return; }
    going = true; var b = document.getElementById('pay-btn'); b.disabled = true; st(T('opening'));
    api('/vip/pay/start', { q: Q, agree: true }).then(function (j) {
      if (!j || !j.ok) { going = false; b.disabled = false; st(errTx(j && j.err)); if (j && (j.err === 'paid' || j.err === 'expired')) load(); return; }
      return pgGo(j).then(function (e) { going = false; b.disabled = false; if (e) st(e); });
    }).catch(function () { going = false; b.disabled = false; st(T('net')); });
  }
  function psdk() { return new Promise(function (ok, no) { if (window.PortOne) return ok(); var s = document.createElement('script'); s.src = PSDK; s.onload = function () { ok(); }; s.onerror = no; document.head.appendChild(s); }); }
  function pgGo(j) {   // 투어앱 tpg.js 와 같은 방식 — 금액·상점·채널은 허브가 준 값 · 확정은 허브가 포트원에서 다시 읽는다
    var g = j.pg, cu = j.cu || {}, c = {}, ph = String(cu.phone || '').replace(/[^\d]/g, '');
    if (cu.name) c.fullName = String(cu.name).slice(0, 100); if (cu.email) c.email = cu.email; if (ph) c.phoneNumber = ph;
    var back = location.origin + location.pathname + '?q=' + encodeURIComponent(Q) + '&tpres=1';
    var req = { storeId: g.storeId, channelKey: g.channelKey, paymentId: g.paymentId, orderName: g.orderName, totalAmount: g.totalAmount, currency: 'KRW', payMethod: 'CARD', customer: c, redirectUrl: back, forceRedirect: true, locale: 'EN_US' };
    return psdk().then(function () { return window.PortOne.requestPayment(req); }).then(function (r) {
      if (r && r.code !== undefined) return T('eFail');
      location.href = back + '&paymentId=' + encodeURIComponent(g.paymentId); return null;
    }).catch(function () { return T('eFail'); });
  }
  function ret() {   // 결제창에서 돌아옴
    var pid = sp.get('paymentId') || '', code = sp.get('code');
    try { history.replaceState(null, '', location.pathname + '?q=' + encodeURIComponent(Q)); } catch (e) {}
    if (code) return Promise.resolve({ err: 'fail' });
    msg(esc(T('checking')), true);
    return api('/vip/pay/confirm', { q: Q, paymentId: pid }).then(function (j) { return j && j.ok ? {} : { err: (j && j.err) || 'pending' }; }).catch(function () { return { err: 'pending' }; });
  }
  function load(after) {
    api('/vip/pay?q=' + encodeURIComponent(Q)).then(function (j) {
      if (!j || !j.ok) { setLang(L); msg(T(j && j.err === 'q' ? 'bad' : 'net').replace('{m}', mailA()), true); return; }
      D = j; render(); if (after) st(after);
    }).catch(function () { msg(esc(T('net')), true); });
  }
  if (!/^[0-9a-f]{48}$/.test(Q)) { setLang('en'); msg(T('bad').replace('{m}', mailA()), true); return; }
  msg(esc(T('load')));
  if (sp.get('tpres')) ret().then(function (r) { load(r.err ? errTx(r.err) : ''); }); else load();
})();
