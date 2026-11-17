/* VIP 견적 관리 (사장님만, 11-15 「실행해」) — 허브 /vip/adm/* · 로그인 = 투어앱 관리자 비밀번호(x-admin) + 이 기기 열쇠(x-adm2, 텔레그램 6자리 코드)
 *  신청 목록(신청 / 견적 보냄 / 결제 완료 / 확정) → 견적서: 신청 내용이 줄로 자동으로 들어옴 · 줄마다 원가(비어 있음)·마진 %(기본 20, 상한 없음)·견적가 = 원가 ÷ (1 − 마진%) · 줄 추가·삭제 · 합계 자동
 *  사장님만 보는 참고: 카드 수수료 3.5% · 부가세 예상 · 실제 남는 돈과 비율 · 줄마다 「매입 부가세 공제」(세단 차량·가이드 인건비는 기본으로 끔)
 *  환율: 보내는 날 고시 매매기준율(허브가 서울외국환중개 → 수출입은행 → 시장 환율 순으로 받음) · 직접 고칠 수 있음 · 보낼 때 견적에 고정
 *  결제 뒤: 확정 정보(기사·가이드·예약 확인번호) → 「확정 메일 보내기」 → 손님 여정 화면 · 설정: 컨시어지 왓츠앱·전화(비워 두면 여정 화면에서 숨김) */
(function () {
  'use strict';
  var HUB = window.VIP_HUB || 'https://brief-live-hub.emhwang3.workers.dev';
  try { localStorage.setItem('vip_owner', '1'); } catch (e) {}   // 11-16 관리자 화면을 연 기기 = 사장님 기기 → 대문 방문자 수에서 뺌 (main.js)
  var TOK = '', ADM2 = ''; try { TOK = localStorage.getItem('vipadm_tok') || ''; ADM2 = localStorage.getItem('vipadm_t2') || ''; } catch (e) {}
  var $ = function (id) { return document.getElementById(id); };
  var ST_KO = { 'new': '신청', quoted: '견적 보냄', paid: '결제 완료', confirmed: '확정' };
  var LANG_KO = { en: '영어', ja: '일본어', es: '스페인어', zhs: '중국어 간체', zht: '중국어 번체' };
  var OPT_KO = { porter: '포터 서비스', photo: '전문 사진작가', hanbok: '맞춤 한복', wine: '와인 페어링', gj: '경주 1박 2일 연장', nam: '남산 아침 산책 (락고재 다도 대신)', noshop: '쇼핑 대신 봉은사·별마당 도서관 (4일차 오전)', yacht: '4일차 오후 한강 프라이빗 요트', leeum: '4일차 오후 리움미술관 큐레이터 해설' };   // 11-17 4박 5일 — 옛 bnb·beauty 는 기본 일정이 됨
  var VEN = null, VCATS = [], TPL = {}, vcat = 'seoul_hotel', vedit = null;   // 업체 목록 (허브 /vip/adm/vendors) — 손님에겐 안 보임
  var psrMin = 0;   // 11-16 더현대 PSR 최소 쇼핑금액(USD) — 견적서 칸, 밑에 원화 자동
  var items = [], filter = 'all', cur = null, lines = [], fx = null, fxInfo = '', fxWarn = false, valid = '', trip = null, cfg = { wa: '', tel: '', line: '', wc: '' }, PG = false;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function won(n) { var v = Math.round(Number(n) || 0); return (v < 0 ? '−' : '') + String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '원'; }
  function num(n) { return String(Math.round(Math.abs(Number(n) || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function kstToday() { return new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10); }
  function toast(t, ms) { var e = $('toast'); e.textContent = t; e.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(function () { e.hidden = true; }, ms || 2200); }
  function modal(title, html) { $('m-title').textContent = title; $('m-body').innerHTML = html; $('modal').hidden = false; }
  function closeModal() { $('modal').hidden = true; $('m-body').innerHTML = ''; var mb = document.querySelector('.mbox'); if (mb) mb.classList.remove('wide'); }
  $('m-x').addEventListener('click', closeModal);
  $('modal').addEventListener('click', function (e) { if (e.target === $('modal')) closeModal(); });
  function ask(title, html, okLabel) {   // 가운데 확인 창 — Promise<boolean>
    return new Promise(function (res) {
      modal(title, '<div>' + html + '</div><div class="acts"><button type="button" class="b b-main" id="ask-ok">' + esc(okLabel || '확인') + '</button><button type="button" class="b b-ghost" id="ask-no">취소</button></div>');
      $('ask-ok').onclick = function () { closeModal(); res(true); }; $('ask-no').onclick = function () { closeModal(); res(false); };
    });
  }

  function api(path, body) {
    var h = { 'x-admin': encodeURIComponent(TOK), 'x-adm2': ADM2 }; if (body) h['Content-Type'] = 'application/json';
    return fetch(HUB + path, { method: body ? 'POST' : 'GET', headers: h, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' }).then(function (r) {
      if (r.status === 401) throw new Error('2fa'); if (r.status === 403) throw new Error('admin'); if (r.status === 429) throw new Error('locked');
      return r.json().catch(function () { return { ok: false, err: 'json' }; });
    });
  }
  function pub(path, body) { return fetch(HUB + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) { return r.json().catch(function () { return { ok: false }; }); }); }

  // ── 로그인 ──
  function showLogin(m) { $('login').hidden = false; $('app').hidden = true; ['btn-cfg', 'btn-out', 'pgchip', 'btn-ven'].forEach(function (i) { $(i).hidden = true; }); $('lg-msg').textContent = m || ''; }
  function fail(e) {
    var m = e && e.message;
    if (m === '2fa') { showLogin(''); $('lg-2fa').hidden = false; pub('/vip/adm/code', { a: TOK }).then(function (r) { $('lg-msg').textContent = r && r.wait ? '방금 보낸 코드를 넣어 주세요 (1분 뒤 다시 받을 수 있습니다).' : r && r.ok ? '' : '코드를 보내지 못했습니다.'; }); return; }
    if (m === 'admin') { TOK = ''; try { localStorage.removeItem('vipadm_tok'); } catch (x) {} showLogin('비밀번호가 맞지 않습니다.'); return; }
    if (m === 'locked') { showLogin('5번 틀려 15분 동안 잠겼습니다. 잠시 뒤 다시 넣어 주세요.'); return; }
    toast('허브에 닿지 못했습니다. 잠시 뒤 다시 해 주세요.', 3000);
  }
  $('lg-go').addEventListener('click', function () { TOK = $('lg-pw').value; if (!TOK) return; try { localStorage.setItem('vipadm_tok', TOK); } catch (e) {} loadList(); });
  $('lg-pw').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('lg-go').click(); });
  $('lg-verify').addEventListener('click', function () {
    pub('/vip/adm/verify', { a: TOK, code: $('lg-code').value.replace(/\D/g, '') }).then(function (v) {
      if (v && v.ok && v.t) { ADM2 = v.t; try { localStorage.setItem('vipadm_t2', ADM2); } catch (e) {} $('lg-2fa').hidden = true; loadList(); return; }
      $('lg-msg').textContent = v && v.err === 'expired' ? '코드 시간이 지났습니다. 「코드 다시 받기」를 눌러 주세요.' : '코드가 맞지 않습니다.';
    });
  });
  $('lg-resend').addEventListener('click', function () { pub('/vip/adm/code', { a: TOK }).then(function (r) { $('lg-msg').textContent = r && r.wait ? '1분 뒤에 다시 받을 수 있습니다.' : '텔레그램으로 새 코드를 보냈습니다.'; }); });
  $('btn-out').addEventListener('click', function () { TOK = ''; try { localStorage.removeItem('vipadm_tok'); } catch (e) {} showLogin('로그아웃했습니다.'); });

  // ── 설정 (컨시어지 왓츠앱·전화) ──
  $('btn-cfg').addEventListener('click', function () {
    api('/vip/adm/cfg').then(function (j) {
      cfg = (j && j.cfg) || cfg;
      modal('설정', '<p class="mute">손님 여정 화면에 보이는 컨시어지 연락처입니다. 비워 두면 여정 화면에서 그 줄을 숨깁니다.</p>'
        + '<label class="fl">컨시어지 왓츠앱 번호 (국가 번호부터, 예: +82 10 1234 5678)<input type="text" id="cf-wa" value="' + esc(cfg.wa) + '"></label>'
        + '<label class="fl">컨시어지 전화번호<input type="text" id="cf-tel" value="' + esc(cfg.tel) + '"></label>'
        + '<label class="fl">컨시어지 LINE 아이디 (개인 아이디 또는 공식 계정 @아이디)<input type="text" id="cf-line" value="' + esc(cfg.line || '') + '"></label>'   // 11-17 일본·대만 손님
        + '<label class="fl">컨시어지 WeChat 아이디<input type="text" id="cf-wc" value="' + esc(cfg.wc || '') + '"></label>'   // 11-17 중국 본토 손님 — 손님 화면엔 아이디 + 복사 단추
        + '<div class="acts"><button type="button" class="b b-main" id="cf-save">저장</button></div>');
      $('cf-save').onclick = function () { api('/vip/adm/cfg', { wa: $('cf-wa').value, tel: $('cf-tel').value, line: $('cf-line').value, wc: $('cf-wc').value }).then(function (r) { if (r && r.ok) { cfg = r.cfg; closeModal(); toast('설정을 저장했습니다.'); } else toast('저장하지 못했습니다.'); }).catch(fail); };
    }).catch(fail);
  });

  // ── 업체 목록 (분류 · 이름 · 영문 이름 · 기본/대체 · 전화 · 이메일 · 웹 · 주소 · 메모) ──
  function loadVen(after) { return api('/vip/adm/vendors').then(function (j) { if (j && j.ok) { VEN = j.ven; VCATS = j.cats || []; TPL = j.tpl || {}; if (cur && $('qlines')) redrawLines(); if (after) after(); } }).catch(fail); }
  function venSet(j, msg) { if (j && j.ok) { VEN = j.ven; VCATS = j.cats || VCATS; TPL = j.tpl || TPL; if (cur && $('qlines')) redrawLines(); drawVen(); if (msg) toast(msg); } else toast(j && j.err === 'name' ? '이름(한글 또는 영문)을 넣어 주세요.' : '저장하지 못했습니다.'); }
  function drawVen() {
    if ($('modal').hidden || !$('ven-box')) return;
    var list = (VEN.cats[vcat] || []).slice().sort(function (a, b) { return (a.role === '기본' ? 0 : 1) - (b.role === '기본' ? 0 : 1); });
    $('ven-tabs').innerHTML = VCATS.map(function (c) { return '<button type="button" class="tab' + (c[0] === vcat ? ' on' : '') + '" data-vc="' + c[0] + '">' + esc(c[1]) + ' ' + ((VEN.cats[c[0]] || []).length) + '</button>'; }).join('');
    $('ven-list').innerHTML = list.length ? list.map(function (v) { return '<div class="vrow"><div><b>' + esc(v.name_ko || v.name_en) + '</b>' + (v.name_en && v.name_ko ? ' <span class="mute">' + esc(v.name_en) + '</span>' : '') + ' <span class="chip' + (v.role === '기본' ? ' c-quoted' : '') + '">' + v.role + '</span>' + (flagWord(v) ? ' <span class="chip c-exp">⚠ ' + esc(flagWord(v)) + '</span>' : '')
      + '<div class="qv-c">' + contacts(v) + '</div></div><div class="row"><button type="button" class="b b-sm" data-ve="' + esc(v.id) + '">수정</button><button type="button" class="b b-sm b-red" data-vd="' + esc(v.id) + '">삭제</button></div></div>'; }).join('') : '<p class="mute">이 분류에 업체가 없습니다.</p>';
    var e = vedit || { role: '대체' };
    $('ven-form').innerHTML = '<h3>' + (e.id ? '업체 수정' : '업체 추가') + '</h3><div class="grid3"><label class="fl">분류<select id="vf-cat">' + VCATS.map(function (c) { return '<option value="' + c[0] + '"' + (c[0] === vcat ? ' selected' : '') + '>' + esc(c[1]) + '</option>'; }).join('') + '</select></label>'
      + '<label class="fl">이름<input type="text" id="vf-ko" value="' + esc(e.name_ko) + '"></label><label class="fl">영문 이름<input type="text" id="vf-en" value="' + esc(e.name_en) + '"></label></div>'
      + '<div class="grid3"><label class="fl">기본/대체<select id="vf-role"><option' + (e.role === '기본' ? ' selected' : '') + '>기본</option><option' + (e.role !== '기본' ? ' selected' : '') + '>대체</option></select></label>'
      + '<label class="fl">전화<input type="text" id="vf-ph" value="' + esc(e.phone) + '"></label><label class="fl">이메일<input type="text" id="vf-em" value="' + esc(e.email) + '"></label></div>'
      + '<div class="grid2"><label class="fl">웹<input type="text" id="vf-web" value="' + esc(e.web) + '"></label><label class="fl">주소<input type="text" id="vf-ad" value="' + esc(e.address) + '"></label></div>'
      + '<label class="fl">메모<textarea class="note" id="vf-note">' + esc(e.note) + '</textarea></label>'
      + '<div class="acts"><button type="button" class="b b-main" id="vf-save">' + (e.id ? '수정 저장' : '추가') + '</button>' + (e.id ? '<button type="button" class="b b-ghost" id="vf-new">새로 쓰기</button>' : '') + '</div>';
    $('vf-save').onclick = function () { var v = { id: e.id || '', name_ko: $('vf-ko').value, name_en: $('vf-en').value, role: $('vf-role').value, phone: $('vf-ph').value, email: $('vf-em').value, web: $('vf-web').value, address: $('vf-ad').value, note: $('vf-note').value, source: e.source || '' };
      var c = $('vf-cat').value; api('/vip/adm/vendors', { op: 'save', cat: c, v: v }).then(function (j) { if (j && j.ok) { vcat = c; vedit = null; } venSet(j, e.id ? '업체를 고쳤습니다.' : '업체를 더했습니다.'); }).catch(fail); };
    if ($('vf-new')) $('vf-new').onclick = function () { vedit = null; drawVen(); };
  }
  $('btn-ven').addEventListener('click', function () {
    var go = function () { vedit = null;
      modal('업체 목록', '<div id="ven-box"><p class="mute">견적 줄에서 고르는 업체입니다. 손님 메일·결제 화면에는 연락처가 나가지 않습니다.' + (VEN.updated ? ' (목록 기준일 ' + esc(VEN.updated) + ')' : '') + '</p>'
        + '<div class="row" style="margin:8px 0 4px"><button type="button" class="b b-sm b-ghost" id="ven-seed">기본 목록 다시 넣기</button><label class="b b-sm b-ghost">JSON 파일 가져오기<input type="file" id="ven-file" accept=".json,application/json" hidden></label></div>'
        + '<div class="tabs" id="ven-tabs"></div><div id="ven-list"></div><div class="vform" id="ven-form"></div></div>');
      $('m-body').closest('.mbox').classList.add('wide'); drawVen();
      $('ven-tabs').onclick = function (e) { var b = e.target.closest('[data-vc]'); if (!b) return; vcat = b.getAttribute('data-vc'); vedit = null; drawVen(); };
      $('ven-list').onclick = function (e) { var b = e.target.closest('[data-ve],[data-vd]'); if (!b) return;
        if (b.hasAttribute('data-ve')) { vedit = venOf(vcat, b.getAttribute('data-ve')); drawVen(); $('vf-ko').focus(); return; }
        var v = venOf(vcat, b.getAttribute('data-vd')); if (!v || !confirmDel(v)) return;
        api('/vip/adm/vendors', { op: 'del', cat: vcat, id: v.id }).then(function (j) { venSet(j, '업체를 지웠습니다.'); }).catch(fail); };
      $('ven-seed').onclick = function () { api('/vip/adm/vendors', { op: 'seed' }).then(function (j) { venSet(j, '기본 목록에서 ' + ((j && j.added) || 0) + '곳을 더했습니다.'); }).catch(fail); };
      $('ven-file').onchange = function () { var f = this.files && this.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { var d = null; try { d = JSON.parse(r.result); } catch (x) { toast('JSON 파일을 읽지 못했습니다.'); return; }
        api('/vip/adm/vendors', { op: 'import', data: d }).then(function (j) { venSet(j, '가져오기 끝 — ' + ((j && j.added) || 0) + '곳을 더했습니다 (같은 이름은 빈 칸만 채움).'); }).catch(fail); }; r.readAsText(f); };
    };
    if (VEN) go(); else loadVen(go);
  });
  var delArm = '';
  function confirmDel(v) { if (delArm === v.id) { delArm = ''; return true; } delArm = v.id; toast('한 번 더 누르면 「' + (v.name_ko || v.name_en) + '」을(를) 지웁니다.', 2600); return false; }

  // ── 목록 ──
  function loadList(keepId) {
    return api('/vip/adm/list').then(function (j) {
      if (!j || !j.ok) { toast('목록을 받지 못했습니다.'); return; }
      $('login').hidden = true; $('app').hidden = false; $('btn-cfg').hidden = false; $('btn-out').hidden = false;
      PG = !!j.pg; var c = $('pgchip'); c.hidden = false; c.className = 'chip c-pg'; c.textContent = PG ? '카드 결제: 켜짐 (KG이니시스)' : '카드 결제: 채널 키 전 — 손님이 「결제하기」를 눌러도 결제창이 안 열림(결제 안 됨)';
      items = j.items || []; drawList(); $('btn-ven').hidden = false;
      if (!VEN) loadVen();
      if (keepId) openReq(keepId);
    }).catch(fail);
  }
  function drawList() {
    var cnt = { all: items.length, 'new': 0, quoted: 0, paid: 0, confirmed: 0 };
    items.forEach(function (x) { cnt[x.st] = (cnt[x.st] || 0) + 1; });
    $('tabs').innerHTML = [['all', '전체'], ['new', '신청'], ['quoted', '견적 보냄'], ['paid', '결제 완료'], ['confirmed', '확정']].map(function (t) {
      return '<button type="button" class="tab' + (filter === t[0] ? ' on' : '') + '" data-f="' + t[0] + '">' + t[1] + ' ' + (cnt[t[0]] || 0) + '</button>'; }).join('');
    var rows = items.filter(function (x) { return filter === 'all' || x.st === filter; });
    $('rows').innerHTML = rows.length ? rows.map(function (x) {
      return '<button type="button" class="it' + (cur && cur.rec.id === x.id ? ' on' : '') + '" data-id="' + esc(x.id) + '"><div class="it-top"><span class="it-id">' + esc(x.id) + ' · ' + esc(x.at) + '</span>'
        + '<span class="chip c-' + (x.expired ? 'exp' : x.st) + '">' + (x.expired ? '기간 지남' : ST_KO[x.st]) + '</span></div>'
        + '<div class="it-nm">' + esc(x.name) + '</div><div class="it-sub">' + esc(x.date) + '부터 ' + (x.nights === 5 ? '5박 6일 (경주 연장)' : '4박 5일') + ' · ' + x.guests + '명 · ' + esc(x.car) + ' · ' + (LANG_KO[x.lang] || x.lang)
        + (x.total ? ' · ' + won(x.total) : '') + '</div></button>'; }).join('') : '<p class="empty">신청이 없습니다.</p>';
  }
  $('tabs').addEventListener('click', function (e) { var b = e.target.closest('.tab'); if (!b) return; filter = b.getAttribute('data-f'); drawList(); });
  $('rows').addEventListener('click', function (e) { var b = e.target.closest('.it'); if (!b) return; openReq(b.getAttribute('data-id')); });

  // ── 견적 계산 (허브 vipPrice·vipCalc 와 같은 공식) ──
  function price(cost, m) { var c = Math.round(Number(cost) || 0), mm = Number(m); if (!(c > 0)) return 0; if (!isFinite(mm) || mm >= 100) return -1; var x = Math.round(c * 100 / (100 - mm) * 100) / 100; return Math.ceil(x / 1000) * 1000; }
  function lc(l) { var pc = Math.round(Number(l.pc) || 0); return (l.cost == null || l.cost === '') && !(pc > 0) ? l.cost : Math.round(Number(l.cost) || 0) + pc; }   // 11-17 음식 원가 + 페어링 원가
  function calc() {
    var r = { cost: 0, total: 0, ded: 0, bad: 0, blank: 0 };
    lines.forEach(function (l) { var p = price(lc(l), l.m); if (p < 0) r.bad++; l.p = p < 0 ? 0 : p; var c = Math.round(Number(lc(l)) || 0); if (!(c > 0)) r.blank++; r.cost += c; r.total += l.p; if (l.vat) r.ded += c; });
    r.card = Math.round(r.total * 0.035); r.vo = Math.round(r.total / 11); r.vi = Math.round(r.ded / 11); r.vp = r.vo - r.vi; r.net = r.total - r.cost - r.card - r.vp; r.pct = r.total ? Math.round(r.net / r.total * 1000) / 10 : 0;
    return r;
  }
  function fxLine(total, f) {
    f = f || fx;
    if (!f || !(f.rate > 0)) return '환율이 없습니다 — 「고시 환율 다시 받기」를 누르거나 직접 넣어 주세요.';
    var r = (Math.round(f.rate * 100) / 100).toFixed(2).split('.');
    return 'USD 1 = ₩' + num(r[0]) + '.' + r[1] + ' (' + f.date + ' ' + (f.src === 'market' ? '시장 환율' : '매매기준율') + ') 적용 시 약 US$ ' + num(Math.round(total / f.rate));
  }

  // ── 상세 ──
  function openReq(id) {
    api('/vip/adm/get?id=' + encodeURIComponent(id)).then(function (j) {
      if (!j || !j.ok) { toast('신청을 열지 못했습니다.'); return; }
      cur = j; lines = JSON.parse(JSON.stringify(j.draft.lines || [])); valid = j.draft.valid || ''; fx = j.draft.fx || null; psrMin = j.draft.psrMin || 0; fxInfo = ''; fxWarn = false;
      trip = JSON.parse(JSON.stringify(j.trip || { drv: {}, gd: {}, rs: [] })); cfg = j.cfg || cfg;
      $('app').classList.add('open'); drawList(); draw(); window.scrollTo(0, 0);
      var editable = j.rec.st === 'new' || j.rec.st === 'quoted';
      if (editable && !(fx && fx.src === 'manual')) getFx(false);
      else if (fx) { fxInfo = fx.src === 'manual' ? '직접 넣은 값' : ''; drawFx(); }
    }).catch(fail);
  }
  function getFx(fresh) {
    $('fx-src') && ($('fx-src').textContent = '고시 환율을 받는 중…');
    api('/vip/adm/fx?day=' + kstToday() + (fresh ? '&fresh=1' : '')).then(function (v) {
      if (!v || !v.ok) { fxInfo = '환율을 받지 못했습니다 — 직접 넣어 주세요.'; fxWarn = true; drawFx(); return; }
      fx = { rate: v.rate, date: v.date, src: v.src };
      var tr = v.tried || {}, why = [];
      if (tr.smbs && tr.smbs !== 'ok') why.push('서울외국환중개 ' + (tr.smbs === 'fail' ? '연결 안 됨' : '값 없음'));
      if (tr.kexim) why.push('한국수출입은행 ' + (tr.kexim === 'nokey' ? '인증키 없음' : tr.kexim === 'ok' ? '사용' : '값 없음'));
      fxInfo = v.srcKo + (v.date !== kstToday() ? ' · ' + v.date + ' 고시 (오늘 고시 전이거나 주말·공휴일이라 직전 영업일 값)' : ' · 오늘 고시') + (why.length ? ' · ' + why.join(' → ') : '');
      fxWarn = v.src === 'market'; drawFx();
    }).catch(fail);
  }
  function drawFx() {
    if (!$('fx-rate')) return;
    $('fx-rate').value = fx && fx.rate ? fx.rate : ''; $('fx-date').value = fx && fx.date ? fx.date : '';
    $('fx-src').textContent = fxInfo || (fx ? (fx.src === 'manual' ? '직접 넣은 값' : '') : ''); $('fx-src').className = 'fxsrc' + (fxWarn ? ' warn' : '');
    recalc();
  }
  // 11-16 사장님 「넣어」 — 쇼핑 줄에서 청담 플래그십(더현대가 아닌 업체)을 고르면 줄 아래에 손님이 고른 브랜드 + 청담 매장 주소 (사장님만 봄, 손님 견적엔 안 나감)
  //   주소: 보그 코리아 2025-09 「서울에서 럭셔리를 찾는 법」 청담 지도 · 페라가모·셀린 기사 · 에르메스는 도산공원 앞 · 나머지는 이름만
  var BR_ADDR = { 'Dolce & Gabbana': '압구정로 414', 'Audemars Piguet': '압구정로 428', 'Vacheron Constantin': '압구정로 430', 'Chanel': '압구정로 431', 'Ferragamo': '압구정로 433', 'Cartier': '압구정로 435 · 까르띠에 메종 청담',
    'Van Cleef & Arpels': '압구정로 441', 'Richard Mille': '압구정로 450', 'Louis Vuitton': '압구정로 454 · 루이 비통 메종 서울', 'Gucci': '압구정로 462', 'Prada': '압구정로 463', 'Dior': '압구정로 464 · 하우스 오브 디올',
    'Celine': '압구정로 466', 'Hermès': '메종 에르메스 도산 파크 · 신사동 도산공원 앞' };
  function brandBox(na) { var b = (cur && cur.rec && cur.rec.brands) || [];   // na = 주소 빼기(11-17 롯데면세점)
    return '<div class="qn">손님이 고른 브랜드 · ' + (b.length ? b.map(function (n) { var a = na ? '' : BR_ADDR[n]; return '<b>' + esc(n) + '</b>' + (a ? ' (' + esc(a) + ')' : ''); }).join(' · ') : '없음 (신청서에서 고르지 않음)') + '</div>'; }
  function lineRow(l, i, ro) {
    var d = ro ? ' disabled' : '';
    return '<div class="ql" data-i="' + i + '"><div><span class="lb">항목 (관리용)</span><input type="text" data-k="ko" value="' + esc(l.ko) + '"' + d + '></div>'
      + '<div><span class="lb">손님에게 보이는 이름 (' + (LANG_KO[cur.rec.lang] || '') + ')' + (l.pr ? ' · 뒤에 「' + (l.pr === 'sake' ? '사케' : '와인') + ' 페어링 포함」 붙음' : '') + '</span><input type="text" data-k="g" value="' + esc(l.g) + '"' + d + '></div>'
      + '<div><span class="lb">원가 (원)</span><input type="text" class="num" data-k="cost" inputmode="numeric" placeholder="원가" value="' + (l.cost == null || l.cost === '' ? '' : num(l.cost)) + '"' + d + '></div>'
      + (l.pr != null && l.pr !== undefined && (l.pr || l.pc != null) ? '<div><span class="lb">페어링</span><select data-k="pr"' + d + '><option value="wine"' + (l.pr === 'wine' ? ' selected' : '') + '>와인 페어링</option><option value="sake"' + (l.pr === 'sake' ? ' selected' : '') + '>사케 페어링</option><option value=""' + (!l.pr ? ' selected' : '') + '>없음</option></select></div>'
        + '<div><span class="lb">페어링 원가 (원)</span><input type="text" class="num" data-k="pc" inputmode="numeric" placeholder="1인 값 × 인원" value="' + (l.pc == null || l.pc === '' ? '' : num(l.pc)) + '"' + d + '></div>' : '')   // 11-17 와인·사케 페어링 — 음식 원가에 합쳐 견적가
      + '<div><span class="lb">마진 %</span><input type="text" class="num" data-k="m" inputmode="decimal" value="' + esc(l.m) + '"' + d + '></div>'
      + '<div><span class="lb">견적가</span><div class="pr" data-pr="' + i + '"></div></div>'
      + '<div class="vt"><input type="checkbox" data-k="vat" title="매입 부가세 공제"' + (l.vat ? ' checked' : '') + d + '><span class="lb">매입 부가세 공제</span></div>'
      + '<div class="del">' + (ro ? '' : '<button type="button" class="x" data-del="' + i + '" aria-label="줄 삭제">✕</button>') + '</div>'
      + (l.nt ? '<div class="qn' + (l.nt.indexOf('🔴') >= 0 ? ' red' : '') + '">메모 · ' + esc(l.nt) + '</div>' : '')
      + (l.k === 'dept' && l.vn && !/현대|hyundai/i.test((l.vn.ko || '') + ' ' + (l.vn.en || '')) ? brandBox(/롯데면세점|lotte duty free/i.test((l.vn.ko || '') + ' ' + (l.vn.en || ''))) : '')   // 11-16 청담 플래그십 → 손님 브랜드 · 11-17 롯데면세점이면 청담 주소 없이 브랜드만
      + ((l.k === 'pm4' || l.k === 'wine' || (l.pr === 'wine')) && cur && cur.rec && cur.rec.wine ? '<div class="qn">손님이 좋아하는 와인 · <b>' + esc(cur.rec.wine) + '</b></div>' : '')   // 11-17 요트 와인 패키지·와인 페어링에 맞추기
      + (l.k === 'photo' ? '<div class="qn">메모 · 사진작가 섭외처 — 영어 가능 스냅 작가를 시간 단위로 예약: <a href="https://www.trazy.com" target="_blank" rel="noopener">Trazy(트래지)</a> · <a href="https://www.klook.com" target="_blank" rel="noopener">Klook(클룩)</a> · <a href="https://www.myrealtrip.com" target="_blank" rel="noopener">마이리얼트립</a>. 사장님이 직접 예약·결제한 뒤 이 줄 원가에 넣으세요.</div>' : '')   // 사장님만 (손님에겐 안 나감)
      + venRow(l, i, ro) + '</div>';
  }
  function venOf(c, id) { var a = (VEN && VEN.cats && VEN.cats[c]) || []; for (var k = 0; k < a.length; k++) if (a[k].id === id) return a[k]; return null; }
  function venFind(id) { if (!VEN || !id) return null; for (var c in VEN.cats) { var v = venOf(c, id); if (v) return v; } return null; }
  // 업체 메모에 휴업·재건축·철수 같은 상태가 있으면 고르는 칸·줄에 빨갛게 보인다 (사장님 11-15 — 예: 갤러리아 명품관 2027년부터 순차 재건축)
  var FLAG_RE = /휴업|재건축|철수|폐업|폐점|리뉴얼|공사 중|영업 종료|영업 중단|운영 안 함|운영 중단|이전 예정/;
  function flagWord(v) { var m = v && v.note && String(v.note).match(FLAG_RE); return m ? m[0] : ''; }
  function venFlag(v) { return v && v.note ? String(v.note).split(/\s·\s|\n/).filter(function (x) { return FLAG_RE.test(x); }).join(' · ') : ''; }
  function contacts(v) {
    if (!v) return '';
    var tel = String(v.phone || '').replace(/[^\d+]/g, ''), x = [];
    if (v.phone) x.push('전화 <a href="tel:' + esc(tel) + '">' + esc(v.phone) + '</a>');
    if (v.email) x.push('메일 <a href="mailto:' + esc(v.email) + '">' + esc(v.email) + '</a>');
    if (v.web) x.push('<a href="' + esc(v.web) + '" target="_blank" rel="noopener">웹사이트</a>');
    if (v.address) x.push(esc(v.address));
    return (venFlag(v) ? '<div class="vflag">⚠ ' + esc(venFlag(v)) + '</div>' : '') + (x.length ? x.join(' · ') : '<span class="mute">연락처 없음 — 「업체 목록」에서 넣어 주세요</span>') + (v.note ? '<div class="vnote">' + esc(v.note).replace(/\n/g, '<br>') + '</div>' : '');
  }
  function venRow(l, i, ro) {   // 줄마다 분류·업체 — 고르면 줄 이름이 바뀌고 연락처가 바로 보인다(전화·메일은 눌러서 연결)
    var d = ro ? ' disabled' : '', c = l.c || '', list = (VEN && VEN.cats && VEN.cats[c]) || [], v = l.v ? (venOf(c, l.v) || venFind(l.v)) : null;
    var co = '<option value="">분류 없음</option>' + VCATS.map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === c ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join('');
    var vo = '<option value="">' + (list.length ? '— 업체 선택 —' : (c ? '이 분류에 업체 없음' : '— 분류부터 선택 —')) + '</option>' + list.slice().sort(function (a, b) { return (a.role === '기본' ? 0 : 1) - (b.role === '기본' ? 0 : 1); }).map(function (x) {
      return '<option value="' + esc(x.id) + '"' + (x.id === l.v ? ' selected' : '') + '>' + esc((x.name_ko || x.name_en) + (x.name_en && x.name_ko ? ' · ' + x.name_en : '') + ' (' + x.role + ')' + (flagWord(x) ? ' ⚠ ' + flagWord(x) : '')) + '</option>'; }).join('');
    if (l.v && !v) vo += '<option value="' + esc(l.v) + '" selected>' + esc(((l.vn && (l.vn.ko || l.vn.en)) || '') + ' (목록에서 지운 업체)') + '</option>';
    return '<div class="qv"><span class="qv-l">업체</span><select data-k="c"' + d + '>' + co + '</select><select data-k="v"' + d + '>' + vo + '</select><div class="qv-c">' + contacts(v) + '</div></div>';
  }
  function pickVen(l, id) {   // 업체를 고르면 줄 이름 채우기 — 틀이 있는 줄(호텔·식당·스파·다도·면세점·백화점·경주 숙소)은 틀대로, 새 줄은 업체 이름 그대로, 차량·의전·가이드·열차는 이름 그대로
    var v = venOf(l.c, id); l.v = v ? v.id : ''; l.vn = v ? { ko: v.name_ko || v.name_en, en: v.name_en || v.name_ko } : null; if (!v) return;
    var t = TPL[l.k], gl = cur.rec.lang;
    var nm = (l.vn.ko || '') + ' ' + (l.vn.en || ''), hit = t && t.byName ? t.byName.filter(function (b) { return new RegExp(b.re, 'i').test(nm); })[0] : null;   // 정해진 이름(4일차 오전: 리움·경복궁)
    if (l.pr) l.pr = /카네사카|kanesaka|스시|sushi|鮨|오마카세|omakase|일식|가이세키|kaiseki/i.test(nm) ? 'sake' : 'wine';   // 11-17 저녁 업체를 바꾸면 페어링 종류도 자동
    if (hit) { l.ko = hit.ko.replace('{v}', l.vn.ko); l.g = (hit[gl] || hit.en).replace('{v}', l.vn.en); }
    else if (t) { l.ko = t.ko.replace('{v}', l.vn.ko); l.g = (t[gl] || t.en).replace('{v}', l.vn.en); }
    else if (l.k === 'x' || (!l.ko && !l.g)) { if (!l.ko) l.ko = l.vn.ko; if (!l.g) l.g = l.vn.en; }
    l.ko = String(l.ko || '').replace('{d}', l.d || ''); l.g = String(l.g || '').replace('{d}', l.d || '');   // 11-17 줄의 날 번호(허브가 l.d 로 줌 — 휴무로 2·3일차를 바꾸면 바뀜)
  }
  function redrawLines() { var ro = cur.rec.st === 'paid' || cur.rec.st === 'confirmed'; $('qlines').innerHTML = lines.map(function (l, i) { return lineRow(l, i, ro); }).join(''); recalc(); }
  function draw() {
    var r = cur.rec, q = cur.quote, ro = r.st === 'paid' || r.st === 'confirmed', it = cur.itinKo;
    var h = '<button type="button" class="b b-ghost b-sm back" id="d-back">← 목록</button>'
      + '<div class="dh"><div><div class="sub">' + esc(r.id) + ' · 받은 시각 ' + esc(r.at) + '</div><h1>' + esc(r.name) + ' <span class="chip c-' + r.st + '">' + ST_KO[r.st] + '</span></h1></div>'
      + '<div class="row">' + (ro ? '' : '<button type="button" class="b b-red b-sm" id="d-del">신청 삭제</button>') + '</div></div>';
    h += '<div class="sec"><h2>신청 내용 <button type="button" class="b b-ghost b-sm" data-pv="recv">접수 메일 보기</button></h2><dl class="kv">'
      + '<dt>이메일</dt><dd>' + esc(r.email) + '</dd><dt>전화·왓츠앱</dt><dd>' + esc(r.phone) + '</dd><dt>메일 언어</dt><dd>' + (LANG_KO[r.lang] || r.lang) + '</dd>'
      + '<dt>일정</dt><dd>' + esc(r.date) + ' ~ ' + esc(r.end) + (r.nights === 5 ? ' (5박 6일 · 경주 연장)' : ' (4박 5일)') + '</dd><dt>인원</dt><dd>' + r.guests + '명</dd><dt>차량</dt><dd>' + esc(r.carKo) + '</dd>'
      + (cur.craftKo ? '<dt>장인 체험</dt><dd>' + esc(cur.craftKo) + '</dd>' : '')
      + '<dt>옵션</dt><dd>' + (r.opts.length ? r.opts.map(function (k) { return OPT_KO[k]; }).filter(Boolean).join(', ') : '없음') + '</dd>'
      + (r.brands && r.brands.length ? '<dt>좋아하는 브랜드</dt><dd>' + esc(r.brands.join(', ')) + '</dd>' : '')   // 11-16 신청서 브랜드 칸
      + (r.wine ? '<dt>좋아하는 와인</dt><dd>' + esc(r.wine) + '</dd>' : '')   // 11-17 신청서 와인 칸
      + '<dt>입국 항공편</dt><dd>' + (r.fin || r.fint ? esc([{'icn': '인천', 'gmp': '김포', 'jet': '김포 전용기 터미널'}[r.fia] || '', r.fin, r.fint ? r.fint + ' 도착' : ''].filter(Boolean).join(' ')) : '미정') + '</dd>'   // 11-17 입국·출국 항공편
      + '<dt>출국 항공편</dt><dd>' + (r.fout || r.foutt ? esc([{'icn': '인천', 'gmp': '김포', 'jet': '김포 전용기 터미널'}[r.foa] || '', r.fout, r.foutt ? r.foutt + ' 출발' : ''].filter(Boolean).join(' ')) : '미정') + '</dd>'
      + '<dt>여행자 정보 (여권)</dt><dd>' + (cur.trav && cur.trav.length ? cur.trav.map(function (x, i) { return (i + 1) + '. <b>' + esc(x.n) + '</b> · ' + esc(x.nat) + ' · 생년월일 ' + esc(x.dob) + ' · 여권 ' + esc(x.pno) + ' (만료 ' + esc(x.pexp) + ')'; }).join('<br>')
        + '<br><small>' + esc(cur.travAt) + ' 입력 · 여행 끝나고 15일 뒤 자동 삭제</small>' : cur.travAt ? '지움 (여행 끝나고 15일 뒤)' : (r.st === 'paid' || r.st === 'confirmed' ? '아직 안 받음 — 손님 결제 화면에서 입력' : '결제 뒤 손님이 결제 화면에서 입력')) + '</dd>'   // 11-17 여행자 정보(여권)
      + '<dt>요청 사항</dt><dd>' + (r.req ? esc(r.req).replace(/\n/g, '<br>') : '—') + '</dd></dl></div>';
    h += '<div class="sec itin"><h2>일정 <small>손님이 고른 옵션까지 넣은 대략 시각</small></h2>' + it.days.map(function (d, k) {
      return '<details' + (k === 0 ? ' open' : '') + '><summary>' + esc(d.day) + ' · ' + esc(d.dl) + ' — ' + esc(d.title) + '</summary><ol>' + d.items.map(function (x) { return '<li><span class="n">' + x.no + '</span><span class="t">' + esc(x.t) + '</span><span>' + esc(x.x) + '</span></li>'; }).join('') + '</ol></details>'; }).join('') + '</div>';
    h += '<div class="sec"><h2>견적서 <small>' + (ro ? '결제가 끝나 고칠 수 없습니다' : '원가는 부가세 포함 금액으로 넣어 주세요 · 견적가 = 원가 ÷ (1 − 마진%) · 1,000원 단위 올림') + '</small></h2>'
      + '<div class="qh"><span>항목 (관리용)</span><span>손님에게 보이는 이름 (' + (LANG_KO[r.lang] || '') + ')</span><span>원가 (원)</span><span>마진 %</span><span>견적가</span><span>공제</span><span></span></div>'
      + '<div id="qlines">' + lines.map(function (l, i) { return lineRow(l, i, ro); }).join('') + '</div>'
      + (ro ? '' : '<div class="qadd"><button type="button" class="b b-ghost b-sm" id="q-add">＋ 줄 추가</button></div>')
      + '<dl class="tot"><dt>원가 합계</dt><dd id="t-cost"></dd><dt>견적가 합계 (손님 결제 금액)</dt><dd class="big" id="t-total"></dd></dl>'
      + ((r.opts || []).indexOf('noshop') >= 0 ? '' : '<div class="psr"><label class="fl">더현대 PSR 최소 쇼핑금액 (USD) <small>TBD — 정해지면 넣기 · 비우면 손님에게 안 나감</small><input type="text" id="q-psr" inputmode="decimal" placeholder="예: 10000" value="' + (psrMin || '') + '"' + (ro ? ' disabled' : '') + '></label><p class="usd" id="q-psr-krw"></p></div>')
      + '<div class="ref"><h3>참고 — 사장님만 봅니다 (손님 메일·결제 화면에는 안 나감)</h3><dl class="tot"><dt>카드 수수료 3.5%</dt><dd id="t-card"></dd><dt>매출 부가세 (견적가 합계의 10/110)</dt><dd id="t-vo"></dd>'
      + '<dt>매입 부가세 공제 (공제 체크한 줄 원가의 10/110)</dt><dd id="t-vi"></dd><dt>납부할 부가세 (예상)</dt><dd id="t-vp"></dd><dt><b>실제 남는 돈</b></dt><dd><b id="t-net"></b></dd></dl></div>'
      + '<div class="sec" style="border:0;padding:14px 0 0;margin-top:14px"><div class="fx"><label class="fl">환율 (USD 1 = 원)<input type="text" id="fx-rate" inputmode="decimal"' + (ro ? ' disabled' : '') + '></label>'
      + '<label class="fl">고시 날짜<input type="date" id="fx-date"' + (ro ? ' disabled' : '') + '></label><label class="fl">견적 유효기간 (이 날까지)<input type="date" id="q-valid" value="' + esc(valid) + '"' + (ro ? ' disabled' : '') + '></label></div>'
      + '<p class="fxsrc" id="fx-src"></p>' + (ro ? '' : '<button type="button" class="b b-ghost b-sm" id="fx-get">고시 환율 다시 받기</button>')
      + '<p class="usd" id="t-usd"></p><p class="mute" style="font-size:12.5px;margin:4px 0 0">직접 고친 환율도 손님 메일에는 「매매기준율」로 표시됩니다 (시장 환율로 받은 값만 「시장 환율」).</p></div>'
      + '<p class="warnline" id="q-warn" hidden></p>'
      + (ro ? '' : '<div class="acts"><button type="button" class="b" id="q-save">저장</button><button type="button" class="b b-ghost" data-pv="quote">견적 메일 미리보기</button><button type="button" class="b b-main" id="q-send">' + (q ? '견적 다시 보내기' : '견적 보내기') + '</button></div>');
    if (q) h += '<div class="sent"><b>보낸 견적 ' + esc(q.no) + '</b> · ' + esc(q.sentAt) + ' 보냄 · ' + won(q.total) + ' · 유효기간 ' + esc(q.valid) + (q.psrMin ? ' · PSR 최소 쇼핑금액 US$ ' + Number(q.psrMin).toLocaleString('en-US') : '') + (r.st === 'quoted' && q.valid < kstToday() ? ' <span class="chip c-exp">기간 지남</span>' : '')
      + '<br>환율 ' + esc(q.fx.rate) + ' (' + esc(q.fx.date) + ') · 손님 화면 표시: ' + esc(fxLine(q.total, q.fx)) + '<div class="link"><input type="text" readonly value="' + esc(cur.link) + '" id="q-link"><button type="button" class="b b-sm" id="q-copy">복사</button><a class="b b-sm b-ghost" href="' + esc(cur.link) + '" target="_blank" rel="noopener">열기</a></div></div>';
    h += '</div>';
    if (r.pay) h += '<div class="sec"><h2>결제 <button type="button" class="b b-ghost b-sm" data-pv="paid">영수 메일 보기</button></h2><dl class="kv"><dt>결제 금액</dt><dd>' + won(r.pay.amount) + '</dd><dt>결제 시각</dt><dd>' + esc(r.pay.at) + '</dd>'
      + '<dt>방식</dt><dd>' + (r.pay.how === 'none' ? '결제 없이 완료 (PG 채널 키 전)' : '카드 · 포트원 ' + esc(r.pay.id) + (r.pay.test ? ' (시험 결제)' : '')) + '</dd><dt>특별 약관 동의</dt><dd>' + esc(r.agreeAt || '—') + '</dd></dl></div>';
    if (ro) {
      var d = trip.drv || {}, g = trip.gd || {};
      h += '<div class="sec"><h2>확정 정보 <small>' + (cur.tripSaved ? '저장됨 — 고치면 손님 여정 화면이 바로 바뀝니다' : '아직 저장 전 — 예약 줄은 일정에서 미리 채웠습니다') + '</small></h2>'
        + '<div class="grid3"><label class="fl">기사 이름<input type="text" id="tr-dn" value="' + esc(d.name) + '"></label><label class="fl">기사 전화<input type="text" id="tr-dp" value="' + esc(d.phone) + '"></label><label class="fl">차량 번호<input type="text" id="tr-dc" value="' + esc(d.plate) + '"></label></div>'
        + '<div class="grid2"><label class="fl">가이드 이름<input type="text" id="tr-gn" value="' + esc(g.name) + '"></label><label class="fl">가이드 전화<input type="text" id="tr-gp" value="' + esc(g.phone) + '"></label></div>'
        + '<p class="mute" style="margin:8px 0">예약 — 손님 화면에 그대로 보입니다 (항목은 손님 언어 ' + (LANG_KO[r.lang] || '') + '로)</p>'
        + '<div class="rh"><span>항목</span><span>시각</span><span>확인번호</span><span>메모</span><span></span></div><div id="rlines">' + rsRows() + '</div>'
        + '<div class="qadd row"><button type="button" class="b b-ghost b-sm" id="r-add">＋ 예약 줄 추가</button><button type="button" class="b b-sm" id="tr-save">확정 정보 저장</button>' + (q ? '<a class="b b-sm b-ghost" href="' + esc(cur.link) + '" target="_blank" rel="noopener">손님 화면 열기</a>' : '') + '</div>'
        + '<p class="mute" style="font-size:12.5px;margin:10px 0 0">컨시어지 연락처: ' + (cfg.wa || cfg.tel || cfg.line || cfg.wc ? esc([cfg.wa ? '왓츠앱 ' + cfg.wa : '', cfg.line ? 'LINE ' + cfg.line : '', cfg.wc ? 'WeChat ' + cfg.wc : '', cfg.tel ? '전화 ' + cfg.tel : ''].filter(Boolean).join(' · ')) : '비어 있음 — 여정 화면에서 숨겨집니다') + ' (위 「설정」에서 변경)</p></div>';
      h += '<div class="sec"><h2>확정 메일 <small>' + (r.st === 'confirmed' ? '보낸 시각 ' + esc(r.confAt) : '예약을 모두 확보한 뒤 보내 주세요') + '</small></h2>'
        + '<label class="fl">손님에게 덧붙일 말 (선택 · 손님 언어 ' + (LANG_KO[r.lang] || '') + '로)<textarea class="note" id="cf-note">' + esc(r.confNote) + '</textarea></label>'
        + '<div class="acts"><button type="button" class="b b-ghost" data-pv="conf">확정 메일 미리보기</button><button type="button" class="b b-gold" id="cf-send">' + (r.st === 'confirmed' ? '확정 메일 다시 보내기' : '확정 메일 보내기') + '</button></div></div>';
    }
    h += '<div class="sec"><h2>기록</h2><ol class="hist">' + (r.h || []).slice().reverse().map(function (x) { return '<li>' + esc(x.at) + ' · ' + esc(x.a) + (x.by ? ' · ' + esc(x.by) : '') + '</li>'; }).join('') + '</ol></div>';
    $('detail').innerHTML = h; drawFx(); bind();
  }
  function rsRows() {
    return (trip.rs || []).map(function (x, i) {
      return '<div class="rl" data-i="' + i + '"><div><span class="lb">항목</span><input type="text" data-r="x" value="' + esc(x.x) + '"></div><div><span class="lb">시각</span><input type="text" data-r="t" value="' + esc(x.t) + '"></div>'
        + '<div><span class="lb">확인번호</span><input type="text" data-r="c" value="' + esc(x.c) + '"></div><div><span class="lb">메모</span><input type="text" data-r="m" value="' + esc(x.m) + '"></div>'
        + '<div class="del"><button type="button" class="x" data-rdel="' + i + '" aria-label="줄 삭제">✕</button></div></div>'; }).join('');
  }
  function recalc() {
    if (!$('t-total')) return; var r = calc();
    lines.forEach(function (l, i) { var e = document.querySelector('[data-pr="' + i + '"]'); if (!e) return; var p = price(lc(l), l.m);
      if (p < 0) { e.textContent = '마진 100% 이상은 이 공식으로 계산할 수 없습니다'; e.className = 'pr bad'; } else { e.textContent = p > 0 ? won(p) : '— (포함)'; e.className = 'pr'; } });
    $('t-cost').textContent = won(r.cost); $('t-total').textContent = won(r.total); $('t-card').textContent = won(r.card); $('t-vo').textContent = won(r.vo); $('t-vi').textContent = '− ' + won(r.vi);
    $('t-vp').textContent = won(r.vp); $('t-net').textContent = won(r.net) + ' (' + r.pct + '%)'; $('t-net').className = r.net < 0 ? 'neg' : '';
    $('t-usd').textContent = '손님 메일·결제 화면 표시: ' + fxLine(r.total);
    var pk = $('q-psr-krw'); if (pk) pk.textContent = psrMin > 0 ? (fx && fx.rate > 0 ? '≈ ' + won(Math.round(psrMin * fx.rate)) + '  (USD 1 = ' + fx.rate + '원 기준 · 손님 견적 메일·결제 화면에 「최소 쇼핑금액 US$ ' + psrMin.toLocaleString('en-US') + ' (약 ' + won(Math.round(psrMin * fx.rate)) + ')」로 나감)' : '환율을 넣으면 원화로 바뀝니다') : '';
    var w = []; if (r.bad) w.push('마진이 100% 이상인 줄이 ' + r.bad + '개 있습니다.'); if (r.blank && r.total > 0) w.push('원가가 빈 줄 ' + r.blank + '개는 손님에게 「Included(포함)」로 보입니다.');
    var qw = $('q-warn'); if (qw) { qw.textContent = w.join(' '); qw.hidden = !w.length; }
  }
  function body() { return { id: cur.rec.id, lines: lines, valid: $('q-valid') ? $('q-valid').value : valid, fx: fx, psrMin: $('q-psr') ? psrMin : 0 }; }
  function tripBody() {
    var rs = []; document.querySelectorAll('#rlines .rl').forEach(function (row) { var o = {}; row.querySelectorAll('[data-r]').forEach(function (i) { o[i.getAttribute('data-r')] = i.value; }); rs.push(o); });
    return { drv: { name: $('tr-dn').value, phone: $('tr-dp').value, plate: $('tr-dc').value }, gd: { name: $('tr-gn').value, phone: $('tr-gp').value }, rs: rs };
  }
  function syncRs() { if ($('rlines')) trip = Object.assign(trip, tripBody()); }
  function preview(kind) {
    var b = Object.assign(body(), { kind: kind }); if (kind === 'conf') b.note = $('cf-note') ? $('cf-note').value : '';
    api('/vip/adm/preview', b).then(function (j) {
      if (!j || !j.ok) { toast(j && j.err === 'state' ? '아직 그 메일을 보낼 단계가 아닙니다.' : '미리보기를 만들지 못했습니다.'); return; }
      modal('메일 미리보기 — ' + j.subject, '<iframe id="pv-frame" title="메일 미리보기"></iframe>'); $('pv-frame').srcdoc = j.html;
    }).catch(fail);
  }
  function bind() {
    var D0 = $('detail');
    $('d-back').onclick = function () { $('app').classList.remove('open'); };
    if ($('d-del')) $('d-del').onclick = function () { ask('신청 삭제', esc(cur.rec.id + ' ' + cur.rec.name) + ' 신청을 지웁니다. 되돌릴 수 없습니다.', '삭제').then(function (ok) { if (!ok) return;
      api('/vip/adm/del', { id: cur.rec.id }).then(function (j) { if (j && j.ok) { cur = null; $('detail').innerHTML = '<p class="empty">지웠습니다.</p>'; $('app').classList.remove('open'); loadList(); } else toast('지우지 못했습니다.'); }).catch(fail); }); };
    D0.querySelectorAll('[data-pv]').forEach(function (b) { b.onclick = function () { preview(b.getAttribute('data-pv')); }; });
    var ql = $('qlines');
    if (ql) {
      ql.addEventListener('input', function (e) { var t = e.target, row = t.closest('.ql'); if (!row) return; var l = lines[+row.getAttribute('data-i')], k = t.getAttribute('data-k');
        if (k === 'c' || k === 'v') return;
        if (k === 'cost') { var v = t.value.replace(/[^\d]/g, ''); l.cost = v === '' ? null : +v; } else if (k === 'pc') { var v2 = t.value.replace(/[^\d]/g, ''); l.pc = v2 === '' ? null : +v2; } else if (k === 'm') { l.m = t.value.trim() === '' ? '' : Number(t.value); } else if (k === 'vat') l.vat = t.checked; else l[k] = t.value; recalc(); });
      ql.addEventListener('change', function (e) { var t = e.target, kk = t.getAttribute('data-k');
        if (kk === 'c' || kk === 'v') { var ln = lines[+t.closest('.ql').getAttribute('data-i')]; if (kk === 'c') { ln.c = t.value; ln.v = ''; ln.vn = null; } else pickVen(ln, t.value); redrawLines(); return; } if (t.getAttribute('data-k') === 'cost' && t.value) { var v = t.value.replace(/[^\d]/g, ''); t.value = v ? num(v) : ''; } if (t.getAttribute('data-k') === 'vat') { lines[+t.closest('.ql').getAttribute('data-i')].vat = t.checked; recalc(); } });
      ql.addEventListener('click', function (e) { var b = e.target.closest('[data-del]'); if (!b) return; lines.splice(+b.getAttribute('data-del'), 1); $('qlines').innerHTML = lines.map(function (l, i) { return lineRow(l, i, false); }).join(''); recalc(); });
    }
    if ($('q-add')) $('q-add').onclick = function () { lines.push({ k: 'x', c: '', v: '', ko: '', g: '', cost: null, m: 20, vat: true }); $('qlines').innerHTML = lines.map(function (l, i) { return lineRow(l, i, false); }).join(''); recalc(); var ins = $('qlines').querySelectorAll('.ql'); ins[ins.length - 1].querySelector('input').focus(); };
    if ($('q-psr')) $('q-psr').addEventListener('input', function () { var v = Number(this.value.replace(/[^\d.]/g, '')); psrMin = v > 0 ? Math.round(v) : 0; recalc(); });
    if ($('fx-rate')) $('fx-rate').addEventListener('input', function () { var v = Number(this.value.replace(/[^\d.]/g, '')); fx = { rate: v > 0 ? v : 0, date: $('fx-date').value || kstToday(), src: 'manual' }; fxInfo = '직접 넣은 값'; fxWarn = false; $('fx-src').textContent = fxInfo; $('fx-src').className = 'fxsrc'; recalc(); });
    if ($('fx-date')) $('fx-date').addEventListener('change', function () { if (fx) { fx.date = this.value; recalc(); } });
    if ($('fx-get')) $('fx-get').onclick = function () { getFx(true); };
    if ($('q-valid')) $('q-valid').addEventListener('change', function () { valid = this.value; });
    if ($('q-save')) $('q-save').onclick = function () { api('/vip/adm/save', body()).then(function (j) { toast(j && j.ok ? '저장했습니다.' : '저장하지 못했습니다.'); }).catch(fail); };
    if ($('q-send')) $('q-send').onclick = sendQuote;
    if ($('q-copy')) $('q-copy').onclick = function () { var i = $('q-link'); i.select(); try { navigator.clipboard.writeText(i.value).then(function () { toast('결제 링크를 복사했습니다.'); }, function () { document.execCommand('copy'); toast('결제 링크를 복사했습니다.'); }); } catch (e) { document.execCommand('copy'); toast('결제 링크를 복사했습니다.'); } };
    var rl = $('rlines');
    if (rl) {
      rl.addEventListener('click', function (e) { var b = e.target.closest('[data-rdel]'); if (!b) return; syncRs(); trip.rs.splice(+b.getAttribute('data-rdel'), 1); $('rlines').innerHTML = rsRows(); });
      $('r-add').onclick = function () { syncRs(); trip.rs.push({ x: '', t: '', c: '', m: '' }); $('rlines').innerHTML = rsRows(); var r = $('rlines').querySelectorAll('.rl'); r[r.length - 1].querySelector('input').focus(); };
      $('tr-save').onclick = function () { api('/vip/adm/trip', { id: cur.rec.id, trip: tripBody() }).then(function (j) { if (j && j.ok) { cur.tripSaved = true; trip = j.trip; toast('확정 정보를 저장했습니다. 손님 화면에 바로 반영됩니다.'); } else toast('저장하지 못했습니다.'); }).catch(fail); };
      $('cf-send').onclick = function () {
        var again = cur.rec.st === 'confirmed';
        ask(again ? '확정 메일 다시 보내기' : '확정 메일 보내기', esc(cur.rec.email) + ' 로 확정 메일을 보내고, 결제 링크가 손님 여정 화면으로 바뀝니다.<br>확정 정보(기사·가이드·예약)도 함께 저장합니다.', '보내기').then(function (ok) { if (!ok) return;
          api('/vip/adm/confirm', { id: cur.rec.id, note: $('cf-note').value, trip: tripBody() }).then(function (j) { if (j && j.ok) { toast(j.mailed ? '확정 메일을 보냈습니다.' : '확정으로 바꿨지만 메일은 보내지 못했습니다.', 3000); loadList(cur.rec.id); } else toast('보내지 못했습니다.'); }).catch(fail); });
      };
    }
  }
  function sendQuote() {
    var r = calc(), b = body(), E = { valid: '견적 유효기간을 넣어 주세요 (오늘 이후).', fx: '환율을 넣어 주세요.', margin: '마진이 100% 이상인 줄이 있습니다.', total: '견적가 합계가 0원입니다.', gname: '손님에게 보이는 이름이 빈 줄이 있습니다.', paid: '이미 결제된 신청입니다.', lines: '견적 줄을 확인해 주세요.' };
    var err = !b.valid || b.valid < kstToday() ? 'valid' : !(fx && fx.rate > 0) ? 'fx' : r.bad ? 'margin' : !(r.total > 0) ? 'total' : lines.some(function (l) { return !String(l.g || '').trim(); }) ? 'gname' : '';
    if (err) { toast(E[err], 3000); return; }
    var again = !!cur.quote;
    ask(again ? '견적 다시 보내기' : '견적 보내기', esc(cur.rec.name) + ' (' + esc(cur.rec.email) + ') 에게 견적 <b>' + won(r.total) + '</b> 을 보냅니다.<br>유효기간 ' + esc(b.valid) + ' · ' + esc(fxLine(r.total))
      + (r.blank ? '<br><span style="color:#B3261E">원가가 빈 줄 ' + r.blank + '개는 손님에게 「Included(포함)」로 보입니다.</span>' : '') + (again ? '<br>같은 결제 링크에 새 견적(번호 뒤 -' + ((cur.quote.rev || 1) + 1) + ')이 보입니다.' : ''), '보내기').then(function (ok) { if (!ok) return;
      api('/vip/adm/send', b).then(function (j) {
        if (!j || !j.ok) { toast(E[j && j.err] || '보내지 못했습니다.', 3000); return; }
        toast(j.mailed ? '견적 ' + j.quote.no + ' 을 보냈습니다.' : '견적은 저장했지만 메일을 보내지 못했습니다.', 3000); loadList(cur.rec.id);
      }).catch(fail);
    });
  }

  if (TOK) loadList(); else showLogin('');
})();
