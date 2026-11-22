// viphola.com/seoul/ 팜플렛 펼침 — 11-22 사장님 「플랜 유어 저니 옆에 둬 … 촌스럽지 않게 잘해」
//  · #pam-open 을 누르면 남색 무대 위로 접힌 팜플렛이 떠올라 병풍처럼 한 폭씩 펴진다 (PC: 여러 폭 / 폰: 작게 다 펼쳐 보인 뒤 한 폭씩)
//  · 폭의 각도는 창(보이는 폭)과의 거리로 정한다 — 끌면 오른쪽에서 한 폭씩 펴지고 왼쪽에서 접힌다. 접힌 금마다 그늘이 각도를 따라 움직인다
//  · 그림은 누를 때 받는다: img/pam/enNN.jpg (폰 img/pam/s/) · 사이트 언어대로 en·ja·zhs·zht (원본 마케팅/IR/VIPHola_팜플렛)
(function () {
  'use strict';
  var btn = document.getElementById('pam-open'); if (!btn) return;
  var N = 14, RATIO = 2.1, MAXA = 88.2, RAD = Math.PI / 180;
  var BASE = (function () { var s = document.currentScript && document.currentScript.src; return s ? s.replace(/pamphlet\.js.*$/, '') : '../'; })();
  var VER = '?v=1122pm';
  var PL = ['en', 'ja', 'zhs', 'zht'], cur = '';   // 팜플렛이 있는 언어 — 그 밖은 영어
  function plang() { return PL.indexOf(window.VIP_LANG) >= 0 ? window.VIP_LANG : 'en'; }
  var ALT = ['Seoul, reserved for two', 'An Invitation', 'The Courtesies', 'Day One, The Welcome', 'Day Two, The Secret Garden', 'Day Two, Mother-of-Pearl', 'Repose', 'Day Three, The Tea Room', 'Above the City', 'Day Four, The River', 'Day Five, The Farewell', 'Eight Tables', 'Gyeongju', 'Our Word'];
  var LAB = { en: 'The Pamphlet', ja: '小冊子をひらく', zhs: '展开画册', zht: '展開畫冊' }, CLOSE = { en: 'Close', ja: '閉じる', zhs: '关闭', zht: '關閉' };
  function L(o) { return o[window.VIP_LANG] || o.en; }
  function label() { btn.querySelector('.pam-tx').textContent = L(LAB); }
  label(); document.addEventListener('vip:lang', label);

  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var el = null, book, floor, ps = [], sh = [], no, line, goA, prevB, nextB;
  var w = 300, h = 630, V = 3, phone = false, sw = 0, shh = 0;
  var p = 0, tp = 0, vis = 1, sc = 1, open = false, busy = false, raf = 0, pushed = false, lastF = null;
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var smooth = function (t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };

  function build() {
    el = document.createElement('div'); el.className = 'pm'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = '<div class="pm-floor"></div><div class="pm-stage"><div class="pm-book"></div></div><button type="button" class="pm-nav pm-prev" aria-label="Previous"></button><button type="button" class="pm-nav pm-next" aria-label="Next"></button>' +
      '<div class="pm-bar"><span class="pm-no"></span><span class="pm-line"><b></b></span><a class="pm-go" href="#request"></a></div><button type="button" class="pm-x"></button>';
    document.body.appendChild(el);
    book = el.querySelector('.pm-book'); floor = el.querySelector('.pm-floor'); no = el.querySelector('.pm-no'); line = el.querySelector('.pm-line b'); goA = el.querySelector('.pm-go'); prevB = el.querySelector('.pm-prev'); nextB = el.querySelector('.pm-next');
    cur = plang(); var dir = BASE + 'img/pam/' + (Math.min(innerWidth, innerHeight) < 640 ? 's/' : '');
    for (var i = 0; i < N; i++) {
      var d = document.createElement('div'); d.className = 'pm-p'; var im = new Image(); im.alt = ALT[i]; im.decoding = 'async'; im.draggable = false;
      im.src = dir + cur + (i < 9 ? '0' : '') + (i + 1) + '.jpg' + VER; d.appendChild(im); var s = document.createElement('s'); d.appendChild(s); book.appendChild(d); ps.push(d); sh.push(s);
    }
    el.querySelector('.pm-x').addEventListener('click', function () { shut(); });
    prevB.addEventListener('click', function () { step(-1); }); nextB.addEventListener('click', function () { step(1); });
    goA.addEventListener('click', function (e) { e.preventDefault(); shut(function () { var r = document.getElementById('request'); if (r) r.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' }); }); });
    drag();
  }

  function size() {
    sw = innerWidth; shh = innerHeight; phone = sw < 640;
    if (phone) { h = Math.min(shh - 118, sw * .84 * RATIO); w = h / RATIO; V = 1; }
    else { h = Math.min(shh - 92, 1040); w = h / RATIO; V = Math.max(1, Math.min(4, Math.floor(sw * .86 / w))); if (V < 2 && sw > h * .8) { w = sw * .42; h = w * RATIO; V = 2; } }
    for (var i = 0; i < N; i++) { ps[i].style.width = w + 'px'; ps[i].style.height = h + 'px'; }
  }
  var top0 = function () { return phone ? Math.max(56, (shh - h) / 2 - 14) : Math.max(24, (shh - 48 - h) / 2); };

  // 폭마다 각도 → 이어진 자리 계산
  function draw() {
    var rest = calm ? 0 : (phone ? 0 : 6.5) * Math.min(1, Math.max(0, vis - 1)), X = [0], Z = [0], A = [], M = [], i;
    for (i = 0; i < N; i++) {
      var dr = i - (p + vis - 1), dl = p - i, k = dr > 0 ? smooth(dr) : dl > 0 ? smooth(dl) : 0, m = rest + (MAXA - rest) * k;
      M[i] = m; A[i] = (i % 2 ? -1 : 1) * m;
      X[i + 1] = X[i] + w * Math.cos(m * RAD); Z[i + 1] = Z[i] - w * Math.sin(A[i] * RAD);
    }
    var a = Math.max(0, Math.min(N - 1, Math.floor(p))), f = p - a, Xp = X[a] + f * (X[a + 1] - X[a]), Zp = Z[a] + f * (Z[a + 1] - Z[a]);
    var q = Math.min(N, p + vis), b = Math.max(0, Math.min(N - 1, Math.ceil(q) - 1)), g = q - b, Xq = X[b] + g * (X[b + 1] - X[b]), width = Xq - Xp, y = top0();
    for (i = 0; i < N; i++) {
      var sx = -width / 2 + X[i] - Xp, hide = i > p + vis + (phone ? .95 : 2.2) || i < p - (phone ? 1.95 : 3.2) || sx * sc > sw * .75 || (sx + w) * sc < -sw * .75;   // 접힌 나머지는 세 겹까지만 보인다
      ps[i].style.visibility = hide ? 'hidden' : 'visible'; if (hide) continue;
      ps[i].style.transform = 'translate3d(' + sx.toFixed(2) + 'px,' + y.toFixed(1) + 'px,' + (Z[i] - Zp).toFixed(2) + 'px) rotateY(' + A[i].toFixed(3) + 'deg)';
      var s = Math.sin(M[i] * RAD); sh[i].style.opacity = M[i] < .05 ? 0 : Math.min(.96, .12 + .84 * s).toFixed(3);
    }
    book.style.transformOrigin = '0 ' + (y + h / 2).toFixed(1) + 'px'; book.style.transform = 'scale(' + sc.toFixed(4) + ')';
    var fw = Math.max(width, w) * sc; floor.style.width = (fw * 1.06) + 'px'; floor.style.top = (y + h / 2 + h * sc / 2 - 24) + 'px';
    var v = Math.round(vis), i1 = Math.round(p) + 1, i2 = Math.min(N, i1 + v - 1);
    no.textContent = (i2 > i1 ? i1 + '–' + i2 : i1) + ' / ' + N; line.style.left = (p / N * 100) + '%'; line.style.width = (vis / N * 100) + '%';
    prevB.disabled = tp <= .01; nextB.disabled = tp >= N - V - .01;
  }
  function loop() { raf = 0; if (!open) return; var d = tp - p; if (Math.abs(d) > .0006) { p += d * (calm ? 1 : .17); draw(); kick(); } else if (p !== tp) { p = tp; draw(); } }
  function kick() { if (!raf) raf = requestAnimationFrame(loop); }
  function clamp(x) { return Math.max(0, Math.min(N - V, x)); }
  function to(x) { tp = clamp(x); kick(); }
  function step(d) { if (!busy) to(Math.round(tp) + d * Math.max(1, V - 1)); }

  // 시간 길이 ms 동안 0→1
  function run(ms, fn) { return new Promise(function (ok) { if (calm) { fn(1); ok(); return; } var t0 = performance.now(); (function tick(t) { if (!el || !open) { ok(); return; } var u = Math.min(1, (t - t0) / ms); fn(u); if (u < 1) requestAnimationFrame(tick); else ok(); })(t0); }); }
  function wait(ms) { return new Promise(function (ok) { setTimeout(ok, calm ? 0 : ms); }); }
  function ready(list, ms) { return Promise.race([Promise.all(list.map(function (d) { var im = d.firstChild; return im.decode ? im.decode().catch(function () {}) : Promise.resolve(); })), new Promise(function (ok) { setTimeout(ok, ms); })]); }

  function show() {
    if (open || busy) return; busy = true; open = true; lastF = document.activeElement; if (el && cur !== plang()) { el.remove(); el = null; ps = []; sh = []; } if (!el) build();
    el.setAttribute('aria-label', L(LAB)); el.querySelector('.pm-x').setAttribute('aria-label', L(CLOSE));
    var cta = document.querySelector('.hero .btn'); goA.textContent = cta ? cta.textContent : 'Plan your journey';
    document.documentElement.classList.add('pm-lock'); el.style.display = ''; size(); p = tp = 0; vis = 1; sc = calm ? 1 : .8; draw(); el.classList.remove('ready');
    el.offsetWidth; el.classList.add('on');
    try { history.pushState({ pm: 1 }, ''); pushed = true; } catch (e) { pushed = false; }
    el.querySelector('.pm-x').focus({ preventScroll: true });
    var mini = phone ? Math.min(.5, sw * .88 / (w * 3)) : 1;
    ready(ps.slice(0, phone ? 3 : V), 2600)
      .then(function () { return run(700, function (u) { sc = .8 + (phone ? .04 : .06) * ease(u); draw(); }); })
      .then(function () { return wait(120); })
      .then(function () { var s0 = sc; return run(phone ? 1500 : 2100, function (u) { var e = ease(u); vis = 1 + ((phone ? 3 : V) - 1) * e; sc = s0 + (mini - s0) * e; draw(); }); })
      .then(function () { return phone ? wait(260) : null; })
      .then(function () { if (!phone) return null; var s0 = sc; return run(1050, function (u) { var e = ease(u); vis = 3 - 2 * e; sc = s0 + (1 - s0) * e; draw(); }); })
      .then(function () { if (!open) return; vis = V; sc = 1; draw(); busy = false; el.classList.add('ready'); if (phone && !calm) return run(1100, function (u) { if (tp === 0 && !held) { p = .16 * Math.sin(Math.PI * u); draw(); } }); });
  }
  function shut(after, popped) {
    if (!open) return; busy = true; el.classList.remove('ready');
    var p0 = p, v0 = vis, s0 = sc; tp = p;
    (calm ? Promise.resolve() : run(after ? 260 : 820, function (u) { var e = ease(u); if (!after) { p = p0 * (1 - e); vis = v0 + (1 - v0) * e; sc = s0 + (.82 - s0) * e; } else sc = s0 * (1 - .06 * e); draw(); })).then(function () {
      el.classList.remove('on'); open = false;
      setTimeout(function () {
        el.style.display = 'none'; busy = false; document.documentElement.classList.remove('pm-lock');
        if (pushed && !popped) { pushed = false; mute = true; history.back(); } pushed = false;
        if (lastF && lastF.focus) lastF.focus({ preventScroll: true });
        if (after) setTimeout(after, 60);
      }, calm ? 0 : 480);
    });
  }
  var mute = false, held = false;
  window.addEventListener('popstate', function () { if (mute) { mute = false; return; } if (open) shut(null, true); });

  // 끌기 · 휠 · 글쇠
  function drag() {
    var st = el.querySelector('.pm-stage'), x0 = 0, t0 = 0, p0 = 0, vx = 0, lx = 0, lt = 0, id = null;
    st.addEventListener('pointerdown', function (e) { if (busy || (e.button && e.button !== 0)) return; held = true; id = e.pointerId; st.setPointerCapture(id); x0 = lx = e.clientX; lt = t0 = e.timeStamp; p0 = p; tp = p; vx = 0; el.classList.add('drag'); });
    st.addEventListener('pointermove', function (e) { if (!held || e.pointerId !== id) return; var dt = Math.max(1, e.timeStamp - lt); vx = .7 * vx + .3 * ((e.clientX - lx) / dt); lx = e.clientX; lt = e.timeStamp; var x = p0 - (e.clientX - x0) / w, mx = N - V; tp = x < 0 ? x * .3 : x > mx ? mx + (x - mx) * .3 : x; p += (tp - p) * .6; draw(); kick(); });
    function up(e) { if (!held || e.pointerId !== id) return; held = false; id = null; el.classList.remove('drag'); var moved = (e.clientX - x0) / w; if (phone) { var b = Math.round(p0); to(Math.abs(vx) > .35 ? b + (vx < 0 ? 1 : -1) : Math.abs(moved) > .24 ? b + (moved < 0 ? Math.max(1, Math.round(-moved)) : -Math.max(1, Math.round(moved))) : b); } else to(Math.round(p - Math.max(-2.2, Math.min(2.2, vx)) * 260 / w)); }
    st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up);
    var wt = 0; el.addEventListener('wheel', function (e) { e.preventDefault(); if (busy) return; var d = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * (e.deltaMode ? 30 : 1); tp = clamp(tp + d / (w * 1.15)); kick(); clearTimeout(wt); wt = setTimeout(function () { to(Math.round(tp)); }, 170); }, { passive: false });
  }
  document.addEventListener('keydown', function (e) {
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); shut(); }
    else if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); if (!busy) to(Math.round(tp) + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); if (!busy) to(Math.round(tp) - 1); }
    else if (e.key === 'Home') { if (!busy) to(0); } else if (e.key === 'End') { if (!busy) to(N - V); }
    else if (e.key === 'Tab') { var fs = [].slice.call(el.querySelectorAll('button:not([disabled]),a[href]')).filter(function (n) { return n.offsetParent; }), i = fs.indexOf(document.activeElement); e.preventDefault(); fs[(i + (e.shiftKey ? -1 : 1) + fs.length) % fs.length].focus(); }
  });
  window.addEventListener('resize', function () { if (!open || busy) return; size(); vis = V; tp = p = clamp(Math.round(p)); draw(); });
  btn.addEventListener('click', show);
})();
