(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };
  const COLORS = ['#7b3fe4', '#ff8a00', '#16c59b', '#ff4f8b', '#ffd23f', '#1f1530'];

  /* ================= Toast ================= */
  const toast = $('#toast');
  let tt;
  function say(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(tt);
    tt = setTimeout(() => toast.classList.remove('show'), 1900);
  }
  function copy(text, okMsg) {
    const done = () => say(okMsg || '已複製：' + text);
    try { navigator.clipboard.writeText(text).then(done, () => say(text)); } catch (e) { say(text); }
  }

  /* ================= 粒子特效（彩帶 + 葡萄） ================= */
  const fx = $('#fx');
  const g = fx.getContext('2d');
  let parts = [], fxRaf = 0;
  function sizeFx() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    fx.width = innerWidth * dpr; fx.height = innerHeight * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  sizeFx();
  addEventListener('resize', sizeFx);
  function burst(x, y, n = 40, power = 9) {
    if (reduce) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = power * (0.4 + Math.random());
      parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - power * 0.6, r: 4 + Math.random() * 7,
        c: COLORS[i % COLORS.length], rot: Math.random() * 6, vr: (Math.random() - .5) * .4, life: 1, grape: Math.random() < .35 });
    }
    if (!fxRaf) fxRaf = requestAnimationFrame(tickFx);
  }
  function rain(n = 70) {
    if (reduce) return;
    for (let i = 0; i < n; i++) {
      parts.push({ x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * .6, vx: (Math.random() - .5) * 2, vy: 2 + Math.random() * 4,
        r: 8 + Math.random() * 8, c: '#7b3fe4', rot: 0, vr: 0, life: 1.6, grape: true });
    }
    if (!fxRaf) fxRaf = requestAnimationFrame(tickFx);
  }
  function tickFx() {
    g.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(p => p.life > 0 && p.y < innerHeight + 40);
    for (const p of parts) {
      p.vy += 0.32; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 0.007;
      g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.globalAlpha = Math.min(1, p.life * 1.5);
      g.lineWidth = 2.5; g.strokeStyle = '#1f1530';
      if (p.grape) {
        g.fillStyle = '#7b3fe4'; g.beginPath(); g.arc(0, 0, p.r, 0, Math.PI * 2); g.fill(); g.stroke();
        g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(-p.r * .35, -p.r * .35, p.r * .28, 0, Math.PI * 2); g.fill();
      } else {
        g.fillStyle = p.c; g.fillRect(-p.r, -p.r * .45, p.r * 2, p.r * .9); g.strokeRect(-p.r, -p.r * .45, p.r * 2, p.r * .9);
      }
      g.restore();
    }
    fxRaf = parts.length ? requestAnimationFrame(tickFx) : 0;
    if (!fxRaf) g.clearRect(0, 0, innerWidth, innerHeight);
  }
  const centerOf = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };

  /* ================= 導覽 ================= */
  const navLinks = $$('.nav-links a');
  const secs = navLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
  function spy() {
    const y = scrollY + innerHeight * .35;
    let cur = null;
    for (const s of secs) if (s.offsetTop <= y) cur = s;
    navLinks.forEach(a => {
      const on = cur && a.getAttribute('href') === '#' + cur.id;
      if (on && !a.classList.contains('is-active')) {
        const box = a.parentElement;
        box.scrollTo({ left: a.offsetLeft - box.clientWidth / 2 + a.offsetWidth / 2, behavior: 'smooth' });
      }
      a.classList.toggle('is-active', !!on);
    });
    if (!cur && navLinks[0]) navLinks[0].parentElement.scrollLeft = 0;
  }
  addEventListener('scroll', spy, { passive: true });
  spy();

  /* ================= Hero：跳！ ================= */
  const jumper = $('#jumper');
  const countEl = $('#jumpCount');
  const hint = $('#jumpHint');
  let jumps = parseInt(store.get('jumps', '0'), 10) || 0;
  countEl.textContent = jumps;
  const lines = ['再一次！', '好高！', '彈跳力 99', '腳要斷了', '葡萄能量！', '你很愛點欸', '最後一次…才怪'];
  function jump() {
    jumper.classList.remove('jump');
    void jumper.offsetWidth;
    jumper.classList.add('jump');
    jumps++;
    countEl.textContent = jumps;
    store.set('jumps', jumps);
    hint.textContent = lines[(jumps - 1) % lines.length];
    const [x, y] = centerOf(jumper);
    setTimeout(() => burst(x, y - 60, 46, 10), 300);
    if (jumps % 10 === 0) { rain(90); say(`第 ${jumps} 跳！下葡萄雨了`); }
  }
  jumper.addEventListener('click', jump);
  jumper.addEventListener('animationend', e => { if (e.animationName === 'bigjump') jumper.classList.remove('jump'); });

  $$('.big-name span').forEach(s => s.addEventListener('click', () => {
    s.classList.add('boing');
    const [x, y] = centerOf(s); burst(x, y, 18, 7);
    setTimeout(() => s.classList.remove('boing'), 400);
  }));

  // 可拖曳貼紙
  $$('.drag').forEach(el => {
    let sx, sy, ox = 0, oy = 0, down = false;
    el.addEventListener('pointerdown', e => { down = true; sx = e.clientX - ox; sy = e.clientY - oy; el.setPointerCapture(e.pointerId); el.style.zIndex = 9; });
    el.addEventListener('pointermove', e => {
      if (!down) return;
      ox = e.clientX - sx; oy = e.clientY - sy;
      el.style.transform = `translate(${ox}px, ${oy}px) rotate(calc(var(--r) + ${ox * 0.05}deg)) scale(1.08)`;
    });
    const up = () => { if (!down) return; down = false; el.style.transform = `translate(${ox}px, ${oy}px) rotate(var(--r))`; };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  });

  /* ================= 球員卡 ================= */
  const pcard = $('#pcard');
  const pwrap = pcard.parentElement;
  pcard.addEventListener('click', () => {
    pcard.classList.toggle('flipped');
    const [x, y] = centerOf(pcard); burst(x, y, 24, 7);
  });
  if (!reduce) {
    pwrap.addEventListener('pointermove', e => {
      const r = pwrap.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      pwrap.style.transform = `rotateY(${(x - .5) * 16}deg) rotateX(${(.5 - y) * 16}deg)`;
      pcard.style.setProperty('--hx', x * 100 + '%');
      pcard.style.setProperty('--hy', y * 100 + '%');
    });
    pwrap.addEventListener('pointerleave', () => { pwrap.style.transform = ''; });
    pwrap.style.transition = 'transform .2s ease-out';
    pwrap.style.transformStyle = 'preserve-3d';
  }

  /* ================= 玩具間（matter.js 物理） ================= */
  const toybox = $('#toybox');
  if (window.Matter && toybox) {
    const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint, Events } = Matter;
    const engine = Engine.create();
    engine.gravity.y = 1;
    let W = 0, H = 0, walls = [], toys = [], running = false;

    const SPRITES = [
      ['./assets/3d/icon_keycaps.png', '鍵帽：C++、</>、{ }，每天都在敲'],
      ['./assets/3d/icon_trophy.png', '獎盃：書卷獎、黑客松、市長獎…'],
      ['./assets/3d/icon_camera.png', '相機：旅行一定要拍夕陽'],
      ['./assets/3d/icon_envelope.png', '信封：歡迎寫信給我 <3'],
      ['./assets/3d/icon_stairs.png', '樓梯：大一到大四，一階一階爬上來'],
      ['./assets/3d/tree23.png', '2-3 Tree：大學寫過最有成就感的資料結構'],
      ['./assets/3d/heap.png', 'Heap：不用指標的 priority queue'],
    ];
    const PILLS = [
      ['C/C++', '#ffffff', '主力語言，資料結構都用它寫'], ['Java', '#ffd23f', 'Oracle Java SE 7 兩張證書'],
      ['Verilog', '#16c59b', '硬體描述語言，數位邏輯課必備'], ['HTML', '#ff8a00', '黑客松第一次碰前端'],
      ['CSS', '#ff4f8b', '這個網站就是 CSS 寫的'], ['系統分析', '#ece2ff', '分析 YouBike 使用趨勢'],
      ['證券分析', '#ffffff', '資管 × 商管的那一面'], ['經濟預測', '#ffd23f', '時間序列預測訂單金額'],
      ['導覽解說', '#ff8a00', '葡萄王觀光工廠導覽'], ['咖啡', '#16c59b', '吧檯做咖啡'],
    ];

    function measure() { W = toybox.clientWidth; H = toybox.clientHeight; }
    function buildWalls() {
      Composite.remove(engine.world, walls);
      const t = 200;
      walls = [
        Bodies.rectangle(W / 2, H + t / 2, W * 3, t, { isStatic: true }),
        Bodies.rectangle(W / 2, -t / 2, W * 3, t, { isStatic: true }),
        Bodies.rectangle(-t / 2, H / 2, t, H * 3, { isStatic: true }),
        Bodies.rectangle(W + t / 2, H / 2, t, H * 3, { isStatic: true }),
      ];
      Composite.add(engine.world, walls);
    }
    function addToy(el, body, w, h, info) {
      el.style.width = w + 'px'; el.style.height = h + 'px';
      toybox.appendChild(el);
      body.plugin = { el, w, h, info };
      Composite.add(engine.world, body);
      toys.push(body);
    }
    const rnd = (a, b) => a + Math.random() * (b - a);
    const inside = (v, m) => Math.min(Math.max(v, m), Math.max(m, W - m));
    function spawnSprite([src, info], scale) {
      const s = Math.round(rnd(150, 185) * scale);
      const el = document.createElement('div');
      el.className = 'toy';
      el.innerHTML = `<img src="${src}" alt="" draggable="false">`;
      const b = Bodies.rectangle(inside(rnd(0, W), s), rnd(20, H * .5), s * .5, s * .42, { chamfer: { radius: s * .12 }, restitution: .45, friction: .2, angle: rnd(-.5, .5) });
      addToy(el, b, s, s, info);
    }
    function spawnPill([label, bg, info], scale) {
      const el = document.createElement('div');
      el.className = 'toy toy-pill';
      el.textContent = label;
      el.style.background = bg;
      el.style.fontSize = (scale < .8 ? 15 : 18) + 'px';
      el.style.padding = '0 18px';
      el.style.width = 'auto';
      toybox.appendChild(el);
      const w = Math.ceil(el.getBoundingClientRect().width) || 100, h = scale < .8 ? 42 : 50;
      el.remove();
      const b = Bodies.rectangle(inside(rnd(0, W), w / 2 + 4), rnd(10, H * .4), w, h, { chamfer: { radius: h / 2 }, restitution: .55, friction: .15, angle: rnd(-.4, .4) });
      addToy(el, b, w, h, info);
    }
    function spawnGrapes(n = 14) {
      for (let i = 0; i < n; i++) {
        const r = rnd(13, 22);
        const el = document.createElement('div');
        el.className = 'toy toy-grape';
        const b = Bodies.circle(inside(rnd(0, W), r), rnd(10, 60), r, { restitution: .7, friction: .05, density: .002 });
        addToy(el, b, r * 2, r * 2, '葡萄！葡萄王的葡萄');
      }
      if (toys.length > 120) toys.splice(0, toys.length - 120).forEach(b => { Composite.remove(engine.world, b); b.plugin.el.remove(); });
    }
    function clearToys() { toys.forEach(b => { Composite.remove(engine.world, b); b.plugin.el.remove(); }); toys = []; }
    function fill() {
      clearToys();
      const scale = W < 600 ? .62 : 1;
      SPRITES.forEach(s => spawnSprite(s, scale));
      PILLS.forEach(p => spawnPill(p, scale));
      spawnGrapes(W < 600 ? 6 : 10);
      sync();
    }

    const mouse = Mouse.create(toybox);
    ['mousewheel', 'DOMMouseScroll', 'wheel'].forEach(ev => toybox.removeEventListener(ev, mouse.mousewheel));
    const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: .2, damping: .1, render: { visible: false } } });
    Composite.add(engine.world, mc);
    let downAt = 0, downPos = null;
    Events.on(mc, 'startdrag', e => { downAt = performance.now(); downPos = { x: e.body.position.x, y: e.body.position.y }; });
    Events.on(mc, 'enddrag', e => {
      const moved = downPos ? Math.hypot(e.body.position.x - downPos.x, e.body.position.y - downPos.y) : 99;
      if (performance.now() - downAt < 300 && moved < 14 && e.body.plugin && e.body.plugin.info) say(e.body.plugin.info);
    });

    function sync() {
      for (const b of toys) {
        const { el, w, h } = b.plugin;
        el.style.transform = `translate(${b.position.x - w / 2}px, ${b.position.y - h / 2}px) rotate(${b.angle}rad)`;
      }
    }
    let last = performance.now();
    function loop(now) {
      if (!running) return;
      const dt = Math.min(32, now - last); last = now;
      Engine.update(engine, dt);
      sync();
      requestAnimationFrame(loop);
    }
    let started = false;
    new IntersectionObserver(es => {
      const vis = es[0].isIntersecting;
      if (vis && !started) { started = true; measure(); buildWalls(); fill(); }
      if (vis && !running) { running = true; last = performance.now(); requestAnimationFrame(loop); }
      if (!vis) running = false;
    }, { threshold: .05 }).observe(toybox);
    new ResizeObserver(() => { if (!started) return; measure(); buildWalls(); }).observe(toybox);

    $('#toyGrapes').addEventListener('click', e => { spawnGrapes(16); burst(e.clientX, e.clientY, 16, 6); });
    $('#toyFlip').addEventListener('click', () => { engine.gravity.y *= -1; say(engine.gravity.y < 0 ? '重力反轉！' : '重力恢復正常'); });
    $('#toyShake').addEventListener('click', () => {
      toys.forEach(b => Body.applyForce(b, b.position, { x: rnd(-.04, .04) * b.mass, y: -rnd(.03, .08) * b.mass }));
      toybox.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-8px,4px)' }, { transform: 'translate(8px,-4px)' }, { transform: 'translate(0,0)' }], { duration: 300, iterations: 2 });
    });
    $('#toyReset').addEventListener('click', () => { engine.gravity.y = 1; fill(); });
    window.__toys = () => toys.length;
  }

  /* ================= 一路走來：直捲變橫捲 ================= */
  const road = $('#road'), track = $('#roadTrack'), roadBar = $('#roadBar');
  function roadSize() {
    if (reduce) return;
    const extra = Math.max(0, track.scrollWidth - innerWidth);
    road.style.height = (innerHeight + extra * 1.1) + 'px';
    roadScroll();
  }
  function roadScroll() {
    if (reduce) return;
    const extra = Math.max(0, track.scrollWidth - innerWidth);
    const total = road.offsetHeight - innerHeight;
    const p = total > 0 ? Math.min(1, Math.max(0, (scrollY - road.offsetTop) / total)) : 0;
    track.style.transform = `translateX(${-p * extra}px)`;
    roadBar.style.width = p * 100 + '%';
  }
  addEventListener('scroll', roadScroll, { passive: true });
  addEventListener('resize', roadSize);
  addEventListener('load', roadSize);
  roadSize();

  /* ================= 相簿：可甩走的照片堆 ================= */
  const deck = $('#deck');
  const cards = $$('.polaroid', deck);
  const tilts = cards.map((_, i) => ((i * 37) % 13) - 6);
  let idx = 0;
  const deckCount = $('#deckCount');
  function layout() {
    cards.forEach((c, i) => {
      const k = (i - idx + cards.length) % cards.length;
      c.style.zIndex = cards.length - k;
      c.style.opacity = k > 4 ? 0 : 1;
      c.style.transform = `translate(-50%, -50%) translate(${k * 6}px, ${k * 6}px) rotate(${k === 0 ? tilts[i] * .3 : tilts[i]}deg) scale(${1 - k * .03})`;
    });
    deckCount.textContent = `${idx + 1} / ${cards.length}`;
  }
  function next(dir = 1) {
    const top = cards[idx];
    top.style.transform = `translate(-50%, -50%) translate(${dir * 700}px, -80px) rotate(${dir * 40}deg)`;
    top.style.opacity = 0;
    setTimeout(() => { idx = (idx + 1) % cards.length; layout(); }, 220);
  }
  function prev() { idx = (idx - 1 + cards.length) % cards.length; layout(); }
  $('#deckNext').addEventListener('click', () => next(1));
  $('#deckPrev').addEventListener('click', prev);
  let dx = 0, dy = 0, sx = 0, sy = 0, dragging = false;
  deck.addEventListener('pointerdown', e => {
    const top = cards[idx];
    if (!top.contains(e.target)) return;
    dragging = true; sx = e.clientX; sy = e.clientY; dx = dy = 0;
    top.classList.add('dragging'); deck.setPointerCapture(e.pointerId);
  });
  deck.addEventListener('pointermove', e => {
    if (!dragging) return;
    dx = e.clientX - sx; dy = e.clientY - sy;
    cards[idx].style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px) rotate(${dx * .08}deg)`;
  });
  const release = () => {
    if (!dragging) return;
    dragging = false;
    cards[idx].classList.remove('dragging');
    if (Math.abs(dx) > 90) { next(Math.sign(dx)); const [x, y] = centerOf(deck); burst(x, y, 14, 6); }
    else layout();
  };
  deck.addEventListener('pointerup', release);
  deck.addEventListener('pointercancel', release);
  layout();

  /* ================= 獎狀翻牌 ================= */
  const AWARDS = [
    ['school', 'good_grade', '書卷獎', '第一次拿到書卷獎，雖然只有 2000 元，但還是很快樂！', '#ffd23f'],
    ['school', 'enterprise', '企資通', '超努力搞懂各種 protocol，現在有關網路的課幾乎都用得到。', '#ece2ff'],
    ['school', 'ds', '資料結構', '演算法最基礎的課，也讓我在資工可以吃老本。', '#c8f3e6'],
    ['school', 'pbl', 'PBL', '跟工業系跨系合作：我們分析，他們做竹槍。', '#ffe0ea'],
    ['school', 'tradetheory', '貿易理論', '要背超多東西，但學到很多貿易、匯率和市場理論。', '#ffe7c7'],
    ['exp', 'codefest', '黑客松', '第一次碰前端，向很多厲害的人學習，一起整晚不睡打 code。', '#c8f3e6'],
    ['exp', 'service', '義工服務', '青年團、夏令營帶營隊，認識很多學校以外的朋友。', '#ffd23f'],
    ['exp', 'sunior', '市長獎', '高中畢業時拿到臺南市市長獎。', '#ece2ff'],
    ['cert', 'jept', '英檢', '考過英文畢業門檻，大一就不用再一直做模擬考。', '#ffe0ea'],
    ['cert', 'java_1', 'Java SE 7 Programming', 'Oracle Workforce Development Program 結業。', '#ffe7c7'],
    ['cert', 'java_2', 'Java SE 7 Fundamentals', 'Oracle Workforce Development Program 結業。', '#c8f3e6'],
    ['cert', 'cwt', '全民中文能力檢定', 'CWT 中高等合格。', '#ffd23f'],
  ];
  const flips = $('#flips');
  AWARDS.forEach(([cat, img, title, text, bg]) => {
    const d = document.createElement('div');
    d.className = 'flip'; d.dataset.cat = cat;
    d.innerHTML = `<button type="button" class="flip-in" aria-label="翻開：${title}">
      <span class="flip-face flip-front"><img src="./image/web/award/${img}.jpg" alt="${title}" loading="lazy"><b>${title}</b></span>
      <span class="flip-face flip-back" style="background:${bg}"><span><h3>${title}</h3><p>${text}</p></span>
        <span class="flip-zoom" data-full="./image/web/award/${img}.jpg" data-title="${title}">放大看 ⤢</span></span></button>`;
    flips.appendChild(d);
  });
  flips.addEventListener('click', e => {
    const z = e.target.closest('.flip-zoom');
    if (z && z.closest('.flip.on')) { openLb(z.dataset.full, z.dataset.title); return; }
    const f = e.target.closest('.flip');
    if (!f) return;
    f.classList.toggle('on');
    if (f.classList.contains('on')) { const [x, y] = centerOf(f); burst(x, y, 12, 5); }
  });
  $$('.filters .chip').forEach(c => c.addEventListener('click', () => {
    $$('.filters .chip').forEach(x => x.classList.toggle('is-on', x === c));
    $$('.flip', flips).forEach(f => { f.hidden = !(c.dataset.filter === 'all' || f.dataset.cat === c.dataset.filter); });
  }));

  /* ================= Lightbox ================= */
  const lb = $('#lightbox');
  function openLb(src, title) {
    $('img', lb).src = src; $('img', lb).alt = title; $('figcaption', lb).textContent = title;
    lb.hidden = false; document.body.style.overflow = 'hidden'; $('.lb-close', lb).focus();
  }
  function closeLb() { lb.hidden = true; document.body.style.overflow = ''; }
  $('.lb-close', lb).addEventListener('click', closeLb);
  lb.addEventListener('click', e => { if (e.target === lb || e.target.tagName === 'FIGURE') closeLb(); });

  /* ================= 作品分頁 + 程式碼 ================= */
  const tabs = $$('.ide-tabs [role="tab"]');
  function selectTab(tab, focus) {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
    const v = $('#' + tab.getAttribute('aria-controls') + ' .code-viewer');
    if (v) loadCode(v);
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); selectTab(tabs[(i + d + tabs.length) % tabs.length], true); }
    });
  });
  async function loadCode(v) {
    if (v.dataset.state) return;
    v.dataset.state = 'loading';
    const code = $('code', v);
    try {
      const res = await fetch(v.dataset.src);
      if (!res.ok) throw new Error(res.status);
      const buf = await res.arrayBuffer();
      let text;
      try { text = new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch (e) { text = new TextDecoder('big5').decode(buf); }
      const frag = document.createDocumentFragment();
      text.replace(/\r\n?/g, '\n').split('\n').forEach((line, i) => {
        const s = document.createElement('span');
        s.className = /^\s*(\/\/|\/\*|\*)/.test(line) ? 'ln c' : 'ln';
        s.dataset.n = i + 1; s.textContent = line || ' ';
        frag.appendChild(s);
      });
      code.textContent = ''; code.appendChild(frag);
      v.dataset.state = 'done';
    } catch (err) {
      code.innerHTML = '<span class="msg">程式碼沒有載入成功。<a target="_blank" rel="noopener"></a></span>';
      const a = $('a', code); a.href = v.dataset.src; a.textContent = '直接開啟原始檔';
      delete v.dataset.state;
    }
  }
  const first = $('#panel-tree .code-viewer');
  if (first) new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { loadCode(first); o.disconnect(); } }, { rootMargin: '300px' }).observe(first);

  /* ================= 打招呼 ================= */
  $('#sayHi').addEventListener('click', e => {
    copy(e.currentTarget.dataset.copy, 'Email 已複製，等你來信！');
    rain(60); burst(e.clientX, e.clientY, 40, 10);
  });
  $$('.mini-copy').forEach(b => b.addEventListener('click', () => copy(b.dataset.copy)));

  /* ================= 彩蛋 ================= */
  const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let keys = [], typed = '';
  addEventListener('keydown', e => {
    if (!lb.hidden && e.key === 'Escape') closeLb();
    if (/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    keys = keys.concat(e.key).slice(-konami.length);
    if (keys.join() === konami.join()) { rain(160); say('葡萄雨！你找到彩蛋了'); keys = []; }
    typed = (typed + (e.key.length === 1 ? e.key.toLowerCase() : '')).slice(-4);
    if (typed === 'jump') { scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(jump, 400); }
  });
})();
