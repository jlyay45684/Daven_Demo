/* NEXUS — UI layer: cursor, parallax, reveal, scramble, tilt, HUD, boot */
(function () {
  const NX = (window.NX = {
    mx: 0, my: 0, sx: 0, sy: 0, px: innerWidth / 2, py: innerHeight / 2,
    prog: 0, quality: localStorage.getItem('nx-q') || 'auto',
    shocks: [], hyper: 0, ready: false, warp: 0,
    shock(x, y, power) { this.shocks.push({ x, y, power: power || 1, t: performance.now() / 1000 }); if (this.shocks.length > 4) this.shocks.shift(); glitchBurst(); }
  });
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- BOOT ---------- */
  const bootMsgs = [
    ['INIT', 'quantum core'], ['LOAD', 'stellar catalogue · 120,000 objects'],
    ['SYNC', 'gravitational field mesh'], ['CALIB', 'event-horizon lens'],
    ['ARM', 'warp drive coils'], ['LINK', 'NEXUS corridor']
  ];
  const bl = $('#bootLines'), bb = $('#bootBar');
  let bi = 0;
  const bootT0 = performance.now();
  const bootTick = setInterval(() => {
    if (bi < bootMsgs.length) {
      const d = document.createElement('div');
      d.innerHTML = `<b>[${bootMsgs[bi][0]}]</b> ${bootMsgs[bi][1]} <span style="opacity:.5">…ok</span>`;
      bl.appendChild(d); bl.scrollTop = 999; bi++;
    }
    const p = Math.min(1, bi / bootMsgs.length) * (NX.ready ? 1 : 0.85);
    bb.style.width = p * 100 + '%';
    const t = performance.now() - bootT0;
    if ((bi >= bootMsgs.length && NX.ready && t > 1400) || t > 7000) {
      clearInterval(bootTick); bb.style.width = '100%';
      setTimeout(() => { $('#boot').classList.add('gone'); revealHero(); }, 250);
    }
  }, 180);

  /* ---------- CURSOR ---------- */
  const ring = $('#cur-ring'), dot = $('#cur-dot');
  let rx = NX.px, ry = NX.py;
  addEventListener('pointermove', e => {
    NX.px = e.clientX; NX.py = e.clientY;
    NX.mx = (e.clientX / innerWidth) * 2 - 1;
    NX.my = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });
  document.addEventListener('pointerover', e => {
    document.body.classList.toggle('hov', !!e.target.closest('button,a,[data-tilt]'));
  });

  /* click → spacetime ripple */
  addEventListener('pointerdown', e => {
    if (e.target.closest('button,.hud,.rail')) return;
    NX.shock(e.clientX / innerWidth, 1 - e.clientY / innerHeight, 1);
  });

  /* ---------- REVEAL + SCRAMBLE ---------- */
  const glyphs = '░▒▓█<>/\\|01ΣΔΨΩ#*+=_星光核域';
  function scramble(el) {
    if (el._scr) return; el._scr = 1;
    const final = el.textContent; const len = final.length;
    const start = performance.now(), dur = 700 + len * 40;
    (function step(now) {
      const p = Math.min(1, (now - start) / dur);
      let out = '';
      for (let i = 0; i < len; i++) {
        const ch = final[i];
        if (ch === ' ' || ch === '，' || ch === '。') { out += ch; continue; }
        out += (i / len < p * 1.15 - 0.1) ? ch : glyphs[(Math.random() * glyphs.length) | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(step); else el.textContent = final;
    })(start);
  }
  const io = new IntersectionObserver(ents => {
    ents.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      $$('[data-scramble]', en.target).forEach(scramble);
      if (en.target.matches('[data-scramble]')) scramble(en.target);
      io.unobserve(en.target);
    });
  }, { threshold: 0.25 });
  function revealHero() {
    $$('.reveal').forEach(el => io.observe(el));
  }

  /* ---------- GLITCH ---------- */
  const h1 = $('.glitch');
  function glitchBurst() {
    if (!h1 || reduce) return;
    let n = 0;
    const iv = setInterval(() => {
      h1.classList.add('g');
      const r = () => (Math.random() * 70).toFixed(0) + '%';
      h1.style.setProperty('--g1', r()); h1.style.setProperty('--g2', r());
      h1.style.setProperty('--g3', r()); h1.style.setProperty('--g4', r());
      if (++n > 5) { clearInterval(iv); h1.classList.remove('g'); }
    }, 50);
  }
  setInterval(() => { if (Math.random() < 0.5 && scrollY < innerHeight) glitchBurst(); }, 3200);

  /* ---------- CARD TILT ---------- */
  $$('[data-tilt]').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', x * 100 + '%'); card.style.setProperty('--my', y * 100 + '%');
      card.style.transform = `rotateY(${(x - .5) * 22}deg) rotateX(${(.5 - y) * 18}deg) translateZ(20px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });

  /* ---------- MAGNET + LAUNCH ---------- */
  const launch = $('#launch');
  launch.addEventListener('pointermove', e => {
    const r = launch.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
    launch.style.transform = `translate(${x * .25}px, ${y * .35}px)`;
  });
  launch.addEventListener('pointerleave', () => launch.style.transform = '');
  const flash = document.createElement('div'); flash.id = 'flash'; document.body.appendChild(flash);
  launch.addEventListener('click', () => {
    NX.shock(.5, .5, 2.2);
    NX.hyperStart = performance.now() / 1000;
    flash.animate([{ opacity: 0 }, { opacity: 0 }, { opacity: 1 }, { opacity: 0 }], { duration: 2400, offsets: [0, .6, .72, 1], easing: 'ease-out' });
    setTimeout(() => scrollTo({ top: 0, behavior: 'instant' }), 1700);
  });

  /* ---------- RAIL / QUALITY ---------- */
  const secs = $$('.sec'), railBtns = $$('#rail button');
  railBtns.forEach(b => b.addEventListener('click', () => {
    scrollTo({ top: secs[+b.dataset.s].offsetTop, behavior: 'smooth' });
  }));
  const qb = $$('#qbtns button');
  function setQ(q) { NX.quality = q; localStorage.setItem('nx-q', q); qb.forEach(b => b.classList.toggle('on', b.dataset.q === q)); }
  qb.forEach(b => b.addEventListener('click', () => setQ(b.dataset.q)));
  setQ(NX.quality);

  /* ---------- MAIN UI LOOP ---------- */
  const depthEls = $$('[data-depth]').map(el => ({ el, d: +el.dataset.depth }));
  const railFill = $('#railFill'), hudWarp = $('#hudWarp'), hudWarpBar = $('#hudWarpBar'), warpBig = $('#warpBig');
  let lastSec = -1;
  function loop() {
    NX.sx += (NX.mx - NX.sx) * 0.08; NX.sy += (NX.my - NX.sy) * 0.08;
    rx += (NX.px - rx) * 0.2; ry += (NX.py - ry) * 0.2;
    ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
    dot.style.transform = `translate3d(${NX.px}px,${NX.py}px,0)`;

    const vh = innerHeight;
    for (const o of depthEls) {
      const r = o.el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      const c = (r.top + r.height / 2 - vh / 2) / vh;  // scroll-based depth
      o.el.style.transform = `translate3d(${-NX.sx * o.d}px, ${-NX.sy * o.d - c * o.d * 4}px, 0)`;
    }

    const max = document.documentElement.scrollHeight - vh;
    NX.prog = max > 0 ? scrollY / max : 0;
    railFill.style.height = NX.prog * 100 + '%';
    let si = 0; secs.forEach((s, i) => { if (scrollY + vh * 0.5 >= s.offsetTop) si = i; });
    if (si !== lastSec) { railBtns.forEach((b, i) => b.classList.toggle('on', i === si)); lastSec = si; }

    const w = NX.warp;
    hudWarp.textContent = (w * 9.99).toFixed(2);
    hudWarpBar.style.width = Math.min(100, w * 100) + '%';
    if (warpBig) warpBig.textContent = (w * 9.99).toFixed(2);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
