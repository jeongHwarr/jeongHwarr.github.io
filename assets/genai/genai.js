/* 이미지 생성 모델 시리즈 엔진: 단계 그림과 수식 유도.
   규약과 동작은 lecture_maker/docs/superpowers/specs/2026-11-14-genai-blog-series-design.md 3~4절. */
(function () {
  'use strict';

  var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var EASE = 'cubic-bezier(.45,0,.2,1)';
  var FIG_STEP_MS = 2200, DERIV_STEP_MS = 2700, FULL_DELAY_MS = 3200, MOVE_MS = 850, HIDE_MS = 260;
  var FAMS = ['blue', 'violet', 'cyan', 'key'];
  var DELIM = /^\\(big|Big|bigg|Bigg)[lr]?/;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* 요소가 화면보다 훨씬 크면 고정 비율에 끝내 도달하지 못하므로, 화면 높이의 60%가 보이는 정도로 기준을 낮춘다 */
  function visibleRatio(target, base) {
    var h = Math.max(1, target.getBoundingClientRect().height);
    return Math.max(0.05, Math.min(base, 0.6 * window.innerHeight / h));
  }

  /* 한 번만 fn을 부른다. 화면 크기가 바뀌면(회전 등) 아직 부르기 전일 때 기준 비율을 다시 계산한다. */
  function onceVisible(target, base, fn) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = null, done = false, raf = 0;
    function observe() {
      if (io) io.disconnect();
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !done) { done = true; io.disconnect(); window.removeEventListener('resize', onResize); fn(); }
        });
      }, { threshold: visibleRatio(target, base) });
      io.observe(target);
    }
    function onResize() { cancelAnimationFrame(raf); raf = requestAnimationFrame(function () { if (!done) observe(); }); }
    window.addEventListener('resize', onResize);
    observe();
  }

  function button(cls, text, label) {
    var b = el('button', cls, text);
    b.type = 'button';
    if (label) b.setAttribute('aria-label', label);
    return b;
  }

  /* 조작 막대: ◀ ▶ 점 n/N 자동재생표시 ↺ [전체 보기] */
  function controls(root, n, withAll) {
    var bar = el('div', 'gm-ctl');
    var prev = button('gm-prev', '◀', '이전 단계');
    var next = button('gm-next', '▶', '다음 단계');
    var dotsWrap = el('span', 'gm-dots');
    var dots = [];
    for (var i = 0; i < n; i++) { var d = button('', '', (i + 1) + '단계로 가기'); dotsWrap.appendChild(d); dots.push(d); }
    var cnt = el('span', 'gm-cnt');
    var badge = el('span', 'gm-badge', '자동 재생 중');
    var replay = button('gm-replay gm-push', '↺ 처음부터', '처음부터 다시 재생');
    bar.append(prev, next, dotsWrap, cnt, badge, replay);
    var all = null;
    if (withAll) { all = button('gm-all', '전체 한 번에 보기'); bar.appendChild(all); }
    root.appendChild(bar);
    return { prev: prev, next: next, dots: dots, cnt: cnt, badge: badge, replay: replay, all: all };
  }

  /* ───────── 단계 그림 (data-gm="steps") ───────── */
  function initSteps(root) {
    var svg = root.querySelector('svg');
    var steps = Array.prototype.slice.call(root.querySelectorAll('.gm-step'));
    var caps = Array.prototype.slice.call(root.querySelectorAll('.gm-caps > li'));
    var N = steps.reduce(function (m, g) { return Math.max(m, +g.getAttribute('data-step') || 0); }, 0);
    if (!svg || N === 0) return;
    if (caps.length !== N) console.warn('[gm] 단계 수(' + N + ')와 캡션 수(' + caps.length + ')가 다릅니다', root);
    root.classList.add('gm-on', 'tex2jax_ignore');
    var ui = controls(root, N, false);
    var cur = 0, timer = null, touched = false, played = false;

    function show(n) {
      cur = n;
      steps.forEach(function (g) { g.classList.toggle('gm-show', +g.getAttribute('data-step') <= n); });
      caps.forEach(function (li, i) { li.classList.toggle('gm-cur', i === n - 1); });
      ui.dots.forEach(function (d, i) { d.classList.toggle('gm-on', i < n); });
      ui.cnt.textContent = n ? n + ' / ' + N : '';
      ui.prev.disabled = n <= 1;
      ui.next.disabled = n >= N;
    }
    function stop() { clearTimeout(timer); timer = null; ui.badge.classList.remove('gm-on'); }
    function play() {
      stop(); played = true;
      if (REDUCED) { show(N); return; }
      show(0);
      ui.badge.classList.add('gm-on');
      var tick = function () { show(cur + 1); if (cur < N) timer = setTimeout(tick, FIG_STEP_MS); else stop(); };
      timer = setTimeout(tick, 300);
    }
    function user(f) { return function (e) { if (e) e.stopPropagation(); touched = true; stop(); f(); }; }

    ui.next.onclick = user(function () { show(Math.min(N, cur + 1)); });
    ui.prev.onclick = user(function () { show(Math.max(1, cur - 1)); });
    ui.dots.forEach(function (d, i) { d.onclick = user(function () { show(i + 1); }); });
    svg.style.cursor = 'pointer';
    svg.addEventListener('click', user(function () { show(cur >= N ? 1 : cur + 1); }));
    ui.replay.onclick = function (e) { e.stopPropagation(); play(); };

    if (REDUCED) { show(N); return; }
    show(0);
    /* 자동 재생 전에 사용자가 먼저 조작했으면 자동 재생하지 않는다 */
    onceVisible(root, 0.4, function () { if (!touched && !played) play(); });
  }

  /* ───────── 수식 유도 (data-gm="deriv") ───────── */
  function texOf(nodes) {
    var out = [];
    (nodes || []).forEach(function (n) {
      if (n.frac) out.push('\\frac{' + texOf(n.num).join(' ') + '}{' + texOf(n.den).join(' ') + '}');
      else if (n.group) out.push(texOf(n.items).join(' '));
      else out.push(n.tex);
    });
    return out;
  }

  function waitMathJax(ready, slow) {
    var t0 = Date.now(), slowShown = false;
    (function poll() {
      var MJ = window.MathJax;
      if (MJ && MJ.startup && MJ.startup.promise && MJ.tex2chtml) { MJ.startup.promise.then(ready); return; }
      if (!slowShown && Date.now() - t0 > 10000) { slowShown = true; slow(); }
      setTimeout(poll, 100);
    })();
  }

  function initDeriv(root) {
    var src = root.querySelector('script[type="application/json"]');
    if (!src) return;
    var spec;
    try { spec = JSON.parse(src.textContent); } catch (err) { console.error('[gm] 유도 JSON 파싱 실패', err, root); return; }
    var R = spec.rows || [], N = R.length;
    if (!N) return;
    root.classList.add('tex2jax_ignore');

    var legend = el('div', 'gm-legend');
    Object.keys(spec.legend || {}).forEach(function (k) {
      var s = el('span'); s.append(el('i', 'gm-sw-' + k), document.createTextNode(spec.legend[k])); legend.appendChild(s);
    });
    var sNew = el('span'); sNew.append(el('i', 'gm-sw-new'), document.createTextNode('그 줄에서 바뀐 부분')); legend.appendChild(sNew);
    var scroll = el('div', 'gm-scroll'), stage = el('div', 'gm-stage'), below = el('div', 'gm-belowbox');
    scroll.appendChild(stage);
    root.append(legend, scroll, below);
    root.classList.add('gm-below');

    var fallback = el('div', 'gm-fallback');
    fallback.textContent = '수식을 불러오는 중입니다.\n' + R.map(function (r) { return texOf(r.l).concat(texOf(r.r)).join(' '); }).join('\n');

    var rows = [], hideT = [], fullGuide = null, ui = null, cur = 0, auto = null, fullTimer = null, touched = false, played = false;

    /* 항마다 따로 렌더하면 기준선이 어긋나므로, 괄호와 짧은 연산자(=, +, \ge 등)를 뺀 항에 높이 맞춤을 붙인다 */
    function math(tex) {
      var pad = tex.length > 3 && !DELIM.test(tex);
      return window.MathJax.tex2chtml(pad ? tex + '\\vphantom{(x)}' : tex, { display: false });
    }
    function node(n) {
      if (n.frac) {
        var f = el('span', 'gm-frac'); f.setAttribute('data-fid', n.frac);
        var a = el('span', 'gm-num'); n.num.forEach(function (x) { a.appendChild(node(x)); });
        var c = el('span', 'gm-den'); n.den.forEach(function (x) { c.appendChild(node(x)); });
        f.append(a, el('span', 'gm-bar'), c); return f;
      }
      if (n.group) {
        var g = el('span', 'gm-grp'); g.setAttribute('data-gid', n.group);
        n.items.forEach(function (x) { g.appendChild(node(x)); });
        g.append(el('span', 'gm-brace'), el('span', 'gm-glabel', n.label || '')); return g;
      }
      var s = el('span', 'gm-tok');
      s.setAttribute('data-id', n.id); s.setAttribute('data-tex', n.tex);
      if (n.new) s.classList.add('gm-new');
      if (n.f && FAMS.indexOf(n.f) >= 0) s.classList.add('gm-f-' + n.f);
      if (n.c && FAMS.indexOf(n.c) >= 0) s.classList.add('gm-c-' + n.c);
      if (n.from) s.setAttribute('data-from', n.from);
      if (n.absorb) s.setAttribute('data-absorb', n.absorb.join(','));
      s.appendChild(math(n.tex));
      if (n.note) s.appendChild(el('span', 'gm-note', n.note));
      return s;
    }
    function has(nodes, pred) {
      return (nodes || []).some(function (n) { return pred(n) || has(n.num, pred) || has(n.den, pred) || has(n.items, pred); });
    }

    function build() {
      if (fallback.parentNode) fallback.parentNode.removeChild(fallback);
      var grid = el('div', 'gm-grid');
      stage.appendChild(grid);
      R.forEach(function (r, i) {
        var row = el('div', 'gm-row gm-pending');
        var lc = el('div', 'gm-lc'); (r.l || []).forEach(function (n) { lc.appendChild(node(n)); });
        var rc = el('div', 'gm-rc'); (r.r || []).forEach(function (n) { rc.appendChild(node(n)); });
        if (has(r.r, function (n) { return !!n.note; })) rc.classList.add('gm-has-note');
        if (has(r.r, function (n) { return !!n.group; })) rc.classList.add('gm-has-grp');
        var nc = el('div', 'gm-nc');
        var sh = el('span', 'gm-short'); sh.append(el('b', null, String(i + 1)), document.createTextNode(r.short || ''));
        var lg = el('div', 'gm-long'); lg.innerHTML = '<span class="gm-tag">' + (i + 1) + '</span>' + (r.long || '');
        nc.append(sh, lg);
        var rl = el('div', 'gm-rl'); rl.append(el('b', null, String(i + 1)), document.createTextNode(r.short || ''));
        row.append(lc, rc, nc, rl);
        grid.appendChild(row);
        rows.push(row);
        var bd = el('div'); bd.innerHTML = '<span class="gm-tag">' + (i + 1) + '</span>' + (r.long || '');
        below.appendChild(bd);
      });
      fullGuide = el('div', null, '같은 항은 같은 색, 앰버 배경은 그 줄에서 바뀐 부분입니다.');
      below.appendChild(fullGuide);
      var doc = window.MathJax.startup.document;
      doc.clear(); doc.updateDocument();
      requestAnimationFrame(function () {
        (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start);
      });
    }

    function layout() {
      var grid = stage.firstElementChild;
      if (!grid) return;
      root.classList.remove('gm-side'); root.classList.add('gm-below');
      var wEq = grid.getBoundingClientRect().width;
      /* 24 = 열 간격 10 + 여유, 14 = .gm-nc의 margin-left */
      var room = scroll.clientWidth - wEq - 24 - 14;
      if (room >= 200) {
        root.classList.remove('gm-below'); root.classList.add('gm-side');
        root.style.setProperty('--gm-note-w', Math.min(320, Math.floor(room)) + 'px');
      }
      clampLong();
    }
    function clampLong() {
      rows.forEach(function (r) { r.querySelector('.gm-long').style.removeProperty('--gm-shift'); });
      if (!root.classList.contains('gm-side')) return;
      var row = rows.filter(function (r) { return r.classList.contains('gm-cur'); })[0];
      if (!row) return;
      var lg = row.querySelector('.gm-long'), s = stage.getBoundingClientRect(), b = lg.getBoundingClientRect();
      var shift = 0;
      if (b.top < s.top) shift = s.top - b.top; else if (b.bottom > s.bottom) shift = s.bottom - b.bottom;
      if (shift) lg.style.setProperty('--gm-shift', shift + 'px');
    }

    function setCur(n) {
      rows.forEach(function (r, i) { r.classList.toggle('gm-cur', i === n); });
      Array.prototype.forEach.call(below.children, function (d, i) { d.classList.toggle('gm-cur', n >= 0 ? i === n : d === fullGuide); });
      clampLong();
    }
    function syncUi(n) {
      ui.cnt.textContent = (n + 1) + ' / ' + N;
      ui.prev.disabled = n === 0;
      ui.next.disabled = n === N - 1;
      ui.dots.forEach(function (d, i) { d.classList.toggle('gm-on', i <= n); });
    }
    function rel(e) {
      var b = stage.getBoundingClientRect(), r = e.getBoundingClientRect();
      return { x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height };
    }
    function findSrc(id, n) {
      for (var k = n - 1; k >= 0; k--) { var e = rows[k].querySelector('.gm-tok[data-id="' + id + '"]'); if (e) return e; }
      return null;
    }
    function ghost(src, to, D, opt) {
      opt = opt || {};
      var o = rel(src), g = src.cloneNode(true);
      g.className = 'gm-ghost';
      g.style.left = o.x + 'px'; g.style.top = o.y + 'px'; g.style.width = o.w + 'px'; g.style.height = o.h + 'px';
      g.style.color = opt.key ? 'var(--gm-key-ink)' : 'var(--gm-ink)';
      var note = g.querySelector('.gm-note'); if (note) note.remove();
      stage.appendChild(g);
      var dx = (to.x + to.w / 2) - (o.x + o.w / 2), dy = (to.y + to.h / 2) - (o.y + o.h / 2);
      var kf = opt.shrink
        ? [{ transform: 'none', opacity: 1 }, { opacity: 0.9, offset: 0.6 }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.35)', opacity: 0 }]
        : [{ transform: 'none', opacity: 1 }, { transform: 'translate(' + dx + 'px,' + dy + 'px)', opacity: 0 }];
      g.animate(kf, { duration: D, delay: opt.delay || 0, easing: EASE, fill: 'both' }).onfinish = function () { g.remove(); };
    }
    function keepInView(row) {
      if (scroll.scrollWidth <= scroll.clientWidth) return;
      var sb = scroll.getBoundingClientRect(), left = Infinity, right = -Infinity;
      row.querySelectorAll('.gm-tok').forEach(function (t) { var r = t.getBoundingClientRect(); left = Math.min(left, r.left); right = Math.max(right, r.right); });
      if (right > sb.right) scroll.scrollLeft += right - sb.right + 12;
      else if (left < sb.left) scroll.scrollLeft -= sb.left - left + 12;
    }

    function cancelAnims(row) {
      row.querySelectorAll('.gm-tok,.gm-bar,.gm-brace,.gm-glabel').forEach(function (e) { e.getAnimations().forEach(function (a) { a.cancel(); }); });
    }
    /* 숨김 예약이 남아 있는 줄을 다시 보일 때는 예약을 취소한다 (◀ 직후 ▶ 경쟁 상태 방지) */
    function unhide(k) {
      if (hideT[k]) { clearTimeout(hideT[k]); hideT[k] = 0; cancelAnims(rows[k]); }
      rows[k].classList.remove('gm-pending');
    }
    function hide(n) {
      var row = rows[n];
      clearTimeout(hideT[n]);
      if (REDUCED) { hideT[n] = 0; row.classList.add('gm-pending'); return; }
      row.querySelectorAll('.gm-tok,.gm-bar,.gm-brace,.gm-glabel').forEach(function (e) { e.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' }); });
      hideT[n] = setTimeout(function () { hideT[n] = 0; row.classList.add('gm-pending'); cancelAnims(row); }, HIDE_MS);
    }

    function reveal(n) {
      var row = rows[n];
      unhide(n); setCur(n); syncUi(n); keepInView(row);
      if (REDUCED) return;
      if (n === 0) {
        row.querySelectorAll('.gm-tok').forEach(function (t, i) {
          t.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 450, delay: i * 70, fill: 'backwards' });
        });
        return;
      }
      var D = MOVE_MS;
      row.querySelectorAll('.gm-tok').forEach(function (t) {
        var src = findSrc(t.getAttribute('data-from') || t.getAttribute('data-id'), n);
        if (src) {
          var s = rel(src), d = rel(t), dx = s.x - d.x, dy = s.y - d.y;
          if (src.getAttribute('data-tex') === t.getAttribute('data-tex')) {
            t.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: D, easing: EASE });
          } else {
            t.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)', opacity: 0 }, { opacity: 0, offset: 0.3 }, { transform: 'none', opacity: 1 }], { duration: D, easing: EASE });
            ghost(src, d, D * 0.7);
          }
        } else {
          t.animate([{ opacity: 0, transform: 'translateY(8px) scale(.85)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: D * 0.6, easing: 'ease-out', fill: 'backwards' });
        }
        var ab = t.getAttribute('data-absorb');
        if (ab) {
          var to = rel(t);
          ab.split(',').forEach(function (id, i) { var s2 = findSrc(id, n); if (s2) ghost(s2, to, D, { shrink: true, delay: i * 40, key: true }); });
        }
      });
      row.querySelectorAll('.gm-frac').forEach(function (f) {
        if (!rows[n - 1].querySelector('.gm-frac[data-fid="' + f.getAttribute('data-fid') + '"]'))
          f.querySelector('.gm-bar').animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 450, delay: D * 0.45, fill: 'backwards' });
      });
      row.querySelectorAll('.gm-grp').forEach(function (g) {
        [g.querySelector('.gm-brace'), g.querySelector('.gm-glabel')].forEach(function (e) {
          e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: D * 0.7, fill: 'backwards' });
        });
      });
    }
    function go(n) {
      if (n < 0 || n >= N || n === cur) return;
      if (n > cur) { for (var k = cur + 1; k < n; k++) unhide(k); reveal(n); }
      else { for (var j = cur; j > n; j--) hide(j); setCur(n); syncUi(n); keepInView(rows[n]); }
      cur = n;
    }
    function stopAuto() { clearTimeout(auto); auto = null; ui.badge.classList.remove('gm-on'); }
    function enterFull() {
      clearTimeout(fullTimer); fullTimer = null;
      rows.forEach(function (r, k) { unhide(k); });
      cur = N - 1; setCur(-1); syncUi(N - 1);
      root.classList.add('gm-full');
    }
    function scheduleFull() { clearTimeout(fullTimer); fullTimer = setTimeout(enterFull, FULL_DELAY_MS); }
    /* first: 화면에 처음 들어왔을 때의 재생. 첫 줄은 이미 보이므로 다시 숨기거나 등장시키지 않는다(깜빡임 방지). */
    function autoplay(first) {
      var initial = first === true && !played;
      played = true;
      stopAuto(); clearTimeout(fullTimer); root.classList.remove('gm-full');
      if (REDUCED) { enterFull(); return; }
      rows.forEach(function (r, k) {
        if (initial && k === 0) return;
        clearTimeout(hideT[k]); hideT[k] = 0; r.classList.add('gm-pending'); cancelAnims(r);
      });
      stage.querySelectorAll('.gm-ghost').forEach(function (g) { g.remove(); });
      cur = 0;
      if (initial) { unhide(0); setCur(0); syncUi(0); } else reveal(0);
      ui.badge.classList.add('gm-on');
      var tick = function () {
        go(cur + 1);
        if (cur === N - 1) { auto = null; ui.badge.classList.remove('gm-on'); scheduleFull(); }
        else auto = setTimeout(tick, DERIV_STEP_MS);
      };
      if (N > 1) auto = setTimeout(tick, DERIV_STEP_MS); else { ui.badge.classList.remove('gm-on'); scheduleFull(); }
    }
    /* 사용자 조작: 자동 재생과 전체 보기 대기를 멈추고, 전체 보기였다면 단계 보기로 돌아와 동작을 실행한다 */
    function user(f) {
      return function (e) {
        if (e) e.stopPropagation();
        touched = true;
        stopAuto(); clearTimeout(fullTimer);
        var wasFull = root.classList.contains('gm-full');
        root.classList.remove('gm-full');
        if (wasFull) { setCur(cur); syncUi(cur); }
        f();
        if (cur === N - 1 && !root.classList.contains('gm-full')) scheduleFull();
      };
    }
    function start() {
      layout();
      if ('ResizeObserver' in window) {
        var raf = 0;
        new ResizeObserver(function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(layout); }).observe(root);
      }
      ui = controls(root, N, true);
      ui.next.onclick = user(function () { go(cur + 1); });
      ui.prev.onclick = user(function () { go(cur - 1); });
      ui.dots.forEach(function (d, i) { d.onclick = user(function () { go(i); }); });
      stage.addEventListener('click', user(function () { go(cur + 1); }));
      ui.replay.onclick = function (e) { e.stopPropagation(); autoplay(); };
      ui.all.onclick = user(enterFull);
      root.setAttribute('data-gm-ready', '1');
      if (REDUCED) { enterFull(); return; }
      /* 자동 재생 전에도 첫 줄은 보여 두고, 사용자가 먼저 조작했으면 자동 재생하지 않는다 */
      cur = 0; unhide(0); setCur(0); syncUi(0);
      onceVisible(stage, 0.35, function () { if (!touched && !played) autoplay(true); });
    }

    waitMathJax(build, function () { stage.appendChild(fallback); });
  }

  function boot() {
    document.querySelectorAll('[data-gm="steps"]').forEach(initSteps);
    document.querySelectorAll('[data-gm="deriv"]').forEach(initDeriv);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
