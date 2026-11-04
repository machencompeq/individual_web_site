/* MingAn OS：開機、桌面、視窗、/ 指令、終端機、桌面寵物 */
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = () => matchMedia('(max-width: 760px)').matches;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };
  const C = window.CONTENT || {};
  const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ================= Toast / 複製 ================= */
  const toast = $('#toast');
  let tt;
  function say(msg) {
    toast.textContent = msg; toast.classList.add('show');
    clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 2200);
  }
  function copy(text, ok) {
    const done = () => say(ok || '已複製：' + text);
    try { navigator.clipboard.writeText(text).then(done, () => say(text)); } catch (e) { say(text); }
  }

  /* ================= 主題 ================= */
  const THEMES = { xp: 'XP', win98: 'Win98', mac: 'Mac', hacker: 'Hacker' };
  const THEME_COLOR = { xp: '#245edb', win98: '#008080', mac: '#1660c9', hacker: '#050806' };
  function setTheme(t) {
    if (!THEMES[t]) return false;
    root.dataset.theme = t;
    store.set('os-theme', t);
    $('#trayTheme').textContent = THEMES[t];
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = THEME_COLOR[t];
    window.FX && FX.wallpaper(t);
    matrix.toggle();
    return true;
  }

  /* ================= App 定義 ================= */
  const APPS = {
    about:    { title: '關於我.txt',    w: 560, h: 470, alias: ['關於', '關於我', 'me'] },
    terminal: { title: '終端機 — zsh',  w: 560, h: 340, alias: ['終端機', 'term', 'shell'], flush: true },
    projects: { title: '作品/',         w: 880, h: 600, alias: ['作品', 'works', 'code'] },
    album:    { title: '相簿.app',      w: 720, h: 560, alias: ['相簿', 'photos', 'photo'] },
    awards:   { title: '獎狀/',         w: 820, h: 580, alias: ['獎狀', '證照', 'award'] },
    journey:  { title: '一路走來.log',  w: 560, h: 600, alias: ['經歷', '一路走來', 'timeline'] },
    skills:   { title: '技能.sh',       w: 480, h: 420, alias: ['技能', 'skill'] },
    contact:  { title: '聯絡我.exe',    w: 520, h: 380, alias: ['聯絡', '聯絡我', 'mail'] },
    toys:     { title: '玩具間.app',    w: 620, h: 470, alias: ['玩具', '玩具間', 'toy'] },
    ads:      { title: '廣告作品/',     w: 900, h: 640, alias: ['廣告', 'ad', 'reels', '廣告作品'] },
    showcase: { title: '3D展示.app',    w: 860, h: 580, alias: ['3d', '展示', '3d展示', 'model'], flush: true },
  };
  function findApp(name) {
    if (!name) return null;
    const n = name.toLowerCase().replace(/^\/+|[.\/]+(txt|app|exe|log|sh)?$/g, '');
    for (const [id, a] of Object.entries(APPS)) {
      if (id === n || a.alias.includes(n) || a.title.toLowerCase().startsWith(n)) return id;
    }
    return null;
  }

  /* ================= 視窗管理 ================= */
  const winLayer = $('#windows'), tasks = $('#tasks');
  const open = new Map();
  let z = 20, cascade = 0;

  /* 視窗動畫：從圖示長出來、縮到工作列、關掉；每個主題不一樣 */
  const rectOf = x => (x && x.getBoundingClientRect ? x.getBoundingClientRect() : null);
  function frames(el, from, opening) {
    const r = el.getBoundingClientRect(), th = root.dataset.theme;
    let fx = 0, fy = 0;
    if (from) { fx = from.left + from.width / 2 - (r.left + r.width / 2); fy = from.top + from.height / 2 - (r.top + r.height / 2); }
    let kf, opt = { duration: 380, easing: 'cubic-bezier(.2,.9,.3,1.12)' };
    if (th === 'mac') {
      kf = [{ transform: `translate(${fx}px,${fy}px) scale(.06,.02) skewX(-25deg)`, opacity: .2, filter: 'blur(3px)' },
        { offset: .45, transform: `translate(${fx * .35}px,${fy * .35}px) scale(.55,.85) skewX(8deg)`, opacity: .9, filter: 'blur(0)' },
        { transform: 'none', opacity: 1, filter: 'blur(0)' }];
      opt = { duration: 480, easing: 'cubic-bezier(.3,.8,.3,1)' };
    } else if (th === 'hacker') {
      kf = [{ clipPath: 'inset(50% 0 50% 0)', opacity: 0, transform: `translate(${fx * .2}px,${fy * .2}px)`, filter: 'hue-rotate(90deg) brightness(2)' },
        { offset: .3, clipPath: 'inset(15% 0 60% 0)', opacity: 1, transform: 'translateX(-14px)', filter: 'hue-rotate(40deg) brightness(1.6)' },
        { offset: .55, clipPath: 'inset(45% 0 8% 0)', transform: 'translateX(12px)', filter: 'none' },
        { offset: .75, clipPath: 'inset(0 0 30% 0)', transform: 'translateX(-4px)' },
        { clipPath: 'inset(0 0 0 0)', transform: 'none', opacity: 1, filter: 'none' }];
      opt = { duration: 420, easing: 'linear' };
    } else if (th === 'win98') {
      kf = [{ transform: `translate(${fx}px,${fy}px) scale(.1)`, opacity: .6 }, { transform: 'none', opacity: 1 }];
      opt = { duration: 260, easing: 'steps(6, end)' };
    } else {
      kf = [{ transform: `translate(${fx}px,${fy}px) scale(.15) perspective(900px) rotateX(35deg)`, opacity: 0 },
        { transform: 'none', opacity: 1 }];
    }
    if (!opening) { kf = kf.slice().reverse(); opt = { ...opt, duration: opt.duration * .75, easing: th === 'win98' ? opt.easing : 'cubic-bezier(.5,0,.75,0)' }; }
    return { kf, opt };
  }
  function animWin(el, from, opening) {
    if (reduce || !el.animate) return Promise.resolve();
    const { kf, opt } = frames(el, from, opening);
    el.style.transformOrigin = 'center';
    const a = el.animate(kf, opt);
    return a.finished.catch(() => {});
  }

  function focusWin(id) {
    const w = open.get(id); if (!w) return;
    w.el.hidden = false; w.el.style.zIndex = ++z;
    open.forEach((o, k) => { o.el.classList.toggle('focus', k === id); o.task.classList.toggle('on', k === id && !o.el.hidden); });
  }
  function openApp(id, origin) {
    if (!APPS[id]) return false;
    if (open.has(id)) { const o = open.get(id); const was = o.el.hidden; focusWin(id); if (was) animWin(o.el, rectOf(o.task), true); return true; }
    const a = APPS[id];
    const el = document.createElement('section');
    el.className = 'win';
    el.dataset.win = id;
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', a.title);
    el.innerHTML = `<header class="titlebar"><span class="t">${a.title}</span><span class="ctrls">
        <button type="button" class="c-min" aria-label="縮小">_</button><button type="button" class="c-max" aria-label="放大">□</button><button type="button" class="c-close" aria-label="關閉">✕</button></span></header>
      <div class="win-body${a.flush ? ' flush' : ''}"></div><span class="resize" aria-hidden="true"></span>`;
    $('.win-body', el).appendChild($('#tpl-' + id).content.cloneNode(true));
    // 位置：疊在一起往右下錯開
    const W = innerWidth, H = innerHeight - 80;
    const w = Math.min(a.w, W - 40), h = Math.min(a.h, H - 20);
    const x = Math.min(240 + cascade * 34, Math.max(10, W - w - 20)), y = Math.min(40 + cascade * 30, Math.max(34, H - h));
    cascade = (cascade + 1) % 7;
    Object.assign(el.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
    winLayer.appendChild(el);

    const task = document.createElement('button');
    task.type = 'button'; task.textContent = a.title;
    task.addEventListener('click', () => {
      const o = open.get(id);
      if (!o.el.hidden && o.el.classList.contains('focus')) minimize(id);
      else { const was = o.el.hidden; focusWin(id); if (was) animWin(o.el, rectOf(task), true); }
    });
    tasks.appendChild(task);
    open.set(id, { el, task });

    $('.c-close', el).addEventListener('click', () => closeApp(id));
    $('.c-min', el).addEventListener('click', () => minimize(id));
    $('.c-max', el).addEventListener('click', () => el.classList.toggle('max'));
    $('.titlebar', el).addEventListener('dblclick', e => { if (!e.target.closest('.ctrls')) el.classList.toggle('max'); });
    el.addEventListener('pointerdown', () => focusWin(id));
    dragify(el, $('.titlebar', el), 'move');
    dragify(el, $('.resize', el), 'size');
    INIT[id] && INIT[id](el);
    window.__initStages && window.__initStages(el);
    focusWin(id);
    animWin(el, rectOf(origin) || rectOf(task), true);
    return true;
  }
  function minimize(id) {
    const o = open.get(id); if (!o || o.el.hidden) return;
    o.task.classList.remove('on');
    animWin(o.el, rectOf(o.task), false).then(() => { o.el.hidden = true; });
  }
  function closeApp(id, instant) {
    const o = open.get(id); if (!o) return;
    open.delete(id); o.task.remove();
    const gone = () => { o.el.dispatchEvent(new Event('winclose')); o.el.remove(); };
    if (instant) gone(); else animWin(o.el, null, false).then(gone);
  }
  function closeAll() { [...open.keys()].forEach(id => closeApp(id)); }
  function dragify(el, handle, mode) {
    let sx, sy, ox, oy, ow, oh, on = false;
    handle.addEventListener('pointerdown', e => {
      if (mobile() || el.classList.contains('max') || e.target.closest('.ctrls')) return;
      on = true; sx = e.clientX; sy = e.clientY;
      ox = el.offsetLeft; oy = el.offsetTop; ow = el.offsetWidth; oh = el.offsetHeight;
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', e => {
      if (!on) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (mode === 'move') {
        el.style.left = Math.min(innerWidth - 80, Math.max(-ow + 80, ox + dx)) + 'px';
        el.style.top = Math.min(innerHeight - 70, Math.max(0, oy + dy)) + 'px';
      } else {
        el.style.width = Math.max(280, ow + dx) + 'px';
        el.style.height = Math.max(180, oh + dy) + 'px';
      }
    });
    const up = () => { on = false; };
    handle.addEventListener('pointerup', up); handle.addEventListener('pointercancel', up);
  }

  /* ================= 每個 App 的初始化 ================= */
  const PHOTOS = C.photos || [];
  const AWARDS = C.awards || [];

  const INIT = {
    about(el) {
      const P = C.profile || {};
      $('.about-root', el).innerHTML = `
        <div class="about">
          <img class="about-photo" src="${P.photo}" alt="${esc(P.name)}">
          <div class="about-text">
            <h2>${esc(P.name)}</h2><p class="en">${esc(P.nameEn)}</p>
            <p>${esc(P.school)}</p><p>${esc(P.now)}</p><p>${esc(P.tagline)}</p>
            <p class="motto">「${esc(P.motto)}」</p>
            <div class="chips">${(P.tags || []).map(t => `<span>${esc(t)}</span>`).join('')}</div>
          </div>
        </div>
        <dl class="kv">
          ${(C.education || []).slice(0, 2).map((e, k) => `<div><dt>${k ? '' : '學歷'}</dt><dd>${esc(e.school)} ${esc(e.dept)}<small>${esc(e.when)}</small></dd></div>`).join('')}
          ${(C.jobs || []).slice().reverse().slice(0, 3).map((j, k) => `<div><dt>${k ? '' : '經歷'}</dt><dd>${esc(j.title)} · ${esc(j.role || '')}<small>${esc(j.when || '')}</small></dd></div>`).join('')}
          ${P.interests ? `<div><dt>方向</dt><dd>${esc(P.interests)}</dd></div>` : ''}
          ${P.languages ? `<div><dt>語言</dt><dd>${esc(P.languages)}</dd></div>` : ''}
          <div><dt>生日</dt><dd>${esc(P.birthday)}</dd></div>
          <div><dt>興趣</dt><dd>${esc(P.hobbies)}</dd></div>
        </dl>
        <div class="row-btns"><button type="button" class="btn" data-app="projects">看作品</button><button type="button" class="btn" data-app="showcase">3D 展示</button><button type="button" class="btn" data-app="contact">聯絡我</button></div>`;
    },
    journey(el) {
      $('.log', el).innerHTML = (C.journey || []).map(j => `<li${j.now ? ' class="now"' : ''}><span class="when">${esc(j.when)}</span><div><b>${esc(j.title)}</b>${j.sub ? `<em>${esc(j.sub)}</em>` : ''}${j.text ? `<p>${esc(j.text)}${j.link ? ` <a href="${j.link.href}" target="_blank" rel="noopener">${esc(j.link.text)}</a>` : ''}</p>` : ''}${j.img ? `<img src="${j.img}" alt="${esc(j.title)}" loading="lazy">` : ''}</div></li>`).join('');
    },
    skills(el) {
      $('.bars', el).innerHTML = (C.skills || []).map(([n, v]) => `<li style="--v:${+v}"><span>${esc(n)}</span><i></i><b>${+v}</b></li>`).join('');
      $('.hint', el).textContent = C.skillsNote || '';
    },
    contact(el) {
      const K = C.contact || {};
      $('.contact-root', el).innerHTML = `<p class="contact-lede">${esc(K.lede || '')}</p><ul class="contact">
        <li><span>Email</span><b>${esc(K.email)}</b><button type="button" class="btn" data-copy="${esc(K.email)}">複製</button></li>
        <li><span>電話</span><b>${esc(K.phone)}</b><button type="button" class="btn" data-copy="${esc((K.phone || '').replace(/\D/g, ''))}">複製</button></li>
        ${(K.links || []).map(([l, t, h]) => `<li><span>${esc(l)}</span><a href="${h}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join('')}</ul>`;
    },
    terminal(el) { Terminal(el); },
    projects(el) {
      const list = C.projects || [];
      $('.tabs', el).innerHTML = list.map((p, i) => `<button type="button" role="tab" data-tab="${p.id}" aria-selected="${i === 0}">${esc(p.tab)}</button>`).join('');
      $('.tab-panels', el).innerHTML = list.map((p, i) => {
        const link = p.link ? `<a class="btn" href="${p.link.href}" target="_blank" rel="noopener">${esc(p.link.text)}</a>` : '';
        const stage = p.model ? `<figure class="stage" data-model="${p.model}" data-kind="spin"><img class="stage-fallback" src="${p.modelImg}" alt="${esc(p.title)} 3D 模型"></figure>` : '';
        const media = p.type === 'code' ? `<div class="code-viewer" data-src="${p.code}"><pre><code>載入中…</code></pre></div>`
          : p.type === 'info' ? `<div class="feat"><p class="feat-h">做了什麼</p><ul>${(p.bullets || []).map(b => `<li>${esc(b)}</li>`).join('')}</ul>${p.stack ? `<div class="chips">${p.stack.map(t => `<span>${esc(t)}</span>`).join('')}</div>` : ''}</div>`
          : p.type === 'video' ? `<video class="proj-video" src="${p.video}" poster="${p.poster || ''}" controls preload="none" playsinline></video>`
          : `<img class="proj-doc" src="${p.img}" alt="${esc(p.title)}">`;
        return `<div class="tab-panel" data-panel="${p.id}"${i ? ' hidden' : ''}><div class="proj"><div class="proj-info"><p class="kind">${esc(p.kind)}</p><h3>${esc(p.title)}</h3>${stage}<p>${esc(p.text)}</p>${link}</div>${media}</div></div>`;
      }).join('');
      const tabs = $$('[role="tab"]', el);
      const show = name => {
        tabs.forEach(t => t.setAttribute('aria-selected', t.dataset.tab === name));
        $$('.tab-panel', el).forEach(p => { p.hidden = p.dataset.panel !== name; });
        const v = $(`[data-panel="${name}"] .code-viewer`, el); if (v) loadCode(v);
      };
      tabs.forEach(t => t.addEventListener('click', () => show(t.dataset.tab)));
      el.showTab = show;
      if (list[0]) show(list[0].id);
    },
    album(el) {
      const img = $('.viewer-img', el), cap = $('.viewer-cap', el), thumbs = $('.thumbs', el);
      let i = 0;
      PHOTOS.forEach(([src, c], k) => {
        const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', c);
        b.innerHTML = `<img src="${src}" alt="" loading="lazy">`;
        b.addEventListener('click', () => go(k));
        thumbs.appendChild(b);
      });
      function go(k) {
        i = (k + PHOTOS.length) % PHOTOS.length;
        img.src = PHOTOS[i][0]; img.alt = PHOTOS[i][1];
        cap.textContent = `${PHOTOS[i][1]}  (${i + 1}/${PHOTOS.length})`;
        $$('button', thumbs).forEach((b, k2) => b.classList.toggle('on', k2 === i));
      }
      $$('[data-dir]', el).forEach(b => b.addEventListener('click', () => go(i + Number(b.dataset.dir))));
      el.addEventListener('keydown', e => { if (e.key === 'ArrowRight') go(i + 1); if (e.key === 'ArrowLeft') go(i - 1); });
      go(0);
      const ring = Carousel(el, idx => { setMode('grid'); go(idx); });
      function setMode(m) {
        $$('[data-mode]', el).forEach(b => b.classList.toggle('is-on', b.dataset.mode === m));
        $$('[data-view]', el).forEach(v => { v.hidden = v.dataset.view !== m; });
        $('.mode-hint', el).hidden = m !== 'ring';
        ring.active(m === 'ring');
      }
      $$('[data-mode]', el).forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
      el.albumMode = setMode;
    },
    awards(el) {
      const files = $('.files', el), detail = $('.award-detail', el), folder = $('[data-view="folder"]', el);
      $('.filters', el).innerHTML = (C.awardCats || [['all', '全部']]).map(([k, n], i) => `<button type="button" class="btn${i ? '' : ' is-on'}" data-filter="${k}">${esc(n)} ${k === 'all' ? AWARDS.length : AWARDS.filter(a => a.cat === k).length}</button>`).join('');
      AWARDS.forEach(a => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'file'; b.dataset.cat = a.cat;
        b.innerHTML = `<img src="${a.img}" alt="" loading="lazy"><span>${esc(a.title)}.jpg</span>`;
        b.addEventListener('click', () => {
          files.hidden = true; $('.filters', el).hidden = true; detail.hidden = false;
          $('.award-view img', el).src = a.img; $('.award-view img', el).alt = a.title;
          $('.award-view h3', el).textContent = (a.year ? a.year + '　' : '') + a.title; $('.award-view p', el).textContent = a.text;
        });
        files.appendChild(b);
      });
      $('.award-back', el).addEventListener('click', () => { files.hidden = false; $('.filters', el).hidden = false; detail.hidden = true; });
      $$('[data-filter]', el).forEach(c => c.addEventListener('click', () => {
        $$('[data-filter]', el).forEach(x => x.classList.toggle('is-on', x === c));
        $$('.file', files).forEach(f => { f.hidden = !(c.dataset.filter === 'all' || f.dataset.cat === c.dataset.filter); });
      }));
      let wallMade = false;
      function setMode(m) {
        if (m === 'wall' && !(window.FX && FX.ok)) m = 'folder';
        $$('[data-mode]', el).forEach(b => b.classList.toggle('is-on', b.dataset.mode === m));
        $$('[data-view]', el).forEach(v => { v.hidden = v.dataset.view !== m; });
        $('.mode-hint', el).hidden = m !== 'wall';
        if (m === 'wall' && !wallMade) { wallMade = true; FX.awardsWall(el, AWARDS); }
      }
      $$('[data-mode]', el).forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
      if (!(window.FX && FX.ok)) $('[data-mode="wall"]', el).hidden = true;
      el.awardsMode = setMode;
      setMode('wall');
    },
    ads(el) {
      $('.ads', el).innerHTML = (C.ads || []).map(a => {
        const url = `https://www.instagram.com/reel/${encodeURIComponent(a.id)}/`;
        return `<figure class="ad"><div class="ad-frame"><iframe src="${url}embed/" title="${esc(a.title)}" loading="lazy" allowfullscreen scrolling="no"></iframe></div>
          <figcaption><b>${esc(a.title)}</b><a href="${url}" target="_blank" rel="noopener">在 Instagram 看 ↗</a></figcaption></figure>`;
      }).join('');
    },
    showcase(el) {
      if (window.FX && FX.ok) FX.showcase(el);
      else $('.show-stage', el).innerHTML = '<p style="padding:20px">這台裝置不支援 3D（WebGL）。</p>';
    },
    toys(el) { Toys(el); },
  };

  /* ================= 3D 旋轉木馬相簿（CSS 3D） ================= */
  function Carousel(el, onPick) {
    const host = $('.carousel', el), ring = $('.ring', host);
    const n = PHOTOS.length, step = 360 / n;
    const items = PHOTOS.map(([src, c], i) => {
      const f = document.createElement('figure'); f.className = 'card3d';
      f.innerHTML = `<img src="${src}" alt="${esc(c)}" draggable="false" loading="lazy"><figcaption>${esc(c)}</figcaption>`;
      ring.appendChild(f); return f;
    });
    let ang = 0, vel = 0, drag = false, sx = 0, moved = 0, on = true, raf = 0, R = 400, idle = 0;
    function layout() {
      const w = items[0] ? items[0].offsetWidth || 180 : 180;
      R = Math.round((w / 2) / Math.tan(Math.PI / n) * 1.12);
      items.forEach((f, i) => { f.style.transform = `rotateY(${i * step}deg) translateZ(${R}px)`; });
    }
    function frame() {
      raf = requestAnimationFrame(frame);
      if (!on || !host.clientWidth) return;
      if (!drag) { ang += vel; vel *= .95; idle++; if (idle > 90 && !reduce && Math.abs(vel) < .05) ang -= .12; }
      ring.style.transform = `translateZ(${-R}px) rotateY(${ang}deg)`;
      items.forEach((f, i) => {
        const a = ((i * step + ang) % 360 + 540) % 360 - 180; // -180..180，0 是正面
        const k = Math.cos(a * Math.PI / 180);
        f.style.filter = `brightness(${.45 + .55 * Math.max(0, k)})`;
        f.classList.toggle('front', Math.abs(a) < step / 2);
      });
    }
    host.addEventListener('pointerdown', e => { drag = true; sx = e.clientX; moved = 0; vel = 0; idle = 0; host.setPointerCapture(e.pointerId); });
    host.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - sx; sx = e.clientX; moved += Math.abs(dx); ang += dx * .3; vel = dx * .3; });
    host.addEventListener('pointerup', e => {
      drag = false;
      if (moved > 6) return;
      const f = document.elementsFromPoint(e.clientX, e.clientY).find(x => x.classList && x.classList.contains('card3d'));
      if (!f) return;
      const i = items.indexOf(f);
      if (f.classList.contains('front')) onPick(i);
      else { const target = -i * step; let d = ((target - ang) % 360 + 540) % 360 - 180; vel = d / 18; }
    });
    host.addEventListener('wheel', e => { e.preventDefault(); vel += (e.deltaY + e.deltaX) * -.02; idle = 0; }, { passive: false });
    new ResizeObserver(layout).observe(host);
    layout(); raf = requestAnimationFrame(frame);
    el.addEventListener('winclose', () => cancelAnimationFrame(raf));
    return { active(v) { on = v; } };
  }

  /* ================= 程式碼載入 ================= */
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
      code.textContent = ''; code.appendChild(frag); v.dataset.state = 'done';
    } catch (err) {
      code.innerHTML = '<span class="msg">程式碼沒有載入成功。<a target="_blank" rel="noopener">直接開啟原始檔</a></span>';
      $('a', code).href = v.dataset.src; delete v.dataset.state;
    }
  }

  /* ================= 指令（/ 指令列和終端機共用） ================= */
  const APP_LIST = Object.keys(APPS).map(id => `${id}（${APPS[id].alias[0]}）`).join('  ');
  const CMDS = {
    help: { desc: '列出所有指令', run: () => [
      ['可以用的指令（前面加 / 或不加都可以）：', 'hl'],
      ['  /open <app>     打開視窗：' + Object.keys(APPS).join(' ')],
      ['  /theme <名稱>   換桌面：xp win98 mac hacker'],
      ['  /jump           讓桌面上的洺安跳一下'],
      ['  /close          關掉所有視窗'],
      ['  /screensaver    3D 螢幕保護程式'],
      ['  /cv             一般履歷模式'],
      ['  /whoami /skills /contact /hire /clear /help'],
      ['（還有一些隱藏指令）', 'dim']] },
    open: { desc: '打開視窗', args: () => Object.keys(APPS), run: a => {
      const id = findApp(a);
      if (!id) return [['用法：open <app>　可用：' + APP_LIST, 'err']];
      openApp(id); return [['→ 已開啟 ' + APPS[id].title, 'ok']];
    } },
    theme: { desc: '換桌面主題', args: () => Object.keys(THEMES), run: a => {
      if (!a) return [['目前主題：' + root.dataset.theme + '　可用：xp win98 mac hacker', 'dim']];
      return setTheme(a.toLowerCase()) ? [['主題已切換成 ' + THEMES[a.toLowerCase()], 'ok']] : [['沒有這個主題：' + esc(a) + '（可用：xp win98 mac hacker）', 'err']];
    } },
    jump: { desc: '讓洺安跳一下', run: () => { pet.jump(); return [['起跳！', 'ok']]; } },
    close: { desc: '關掉所有視窗', run: () => { closeAll(); return [['所有視窗已關閉', 'ok']]; } },
    screensaver: { desc: '螢幕保護程式', run: () => { setTimeout(startSaver, 300); return [['螢幕保護程式啟動…', 'ok']]; } },
    cv: { desc: '一般履歷模式', run: () => { showCV(true); return [['→ 一般模式', 'ok']]; } },
    whoami: { desc: '我是誰', run: () => { const P = C.profile || {}; return [[esc(P.name + ' ' + P.nameEn), 'ok'], [esc(P.school + ' · ' + P.now)], [esc(P.tagline), 'dim']]; } },
    skills: { desc: '技能', run: () => [['[程式] C/C++ · Java · Verilog · HTML/CSS', 'ok'], ['[分析] 商業經濟預測 · 證券分析 · 系統分析', 'hl'], ['[人]   導覽解說 · 門市銷售 · 咖啡吧檯', 'dim']] },
    contact: { desc: '聯絡方式', run: () => { const K = C.contact || {}; return [['email  ' + esc(K.email), 'ok'], ['phone  ' + esc(K.phone)]].concat((K.links || []).map(([l, t, h]) => [`${esc(l.toLowerCase())}  <a href="${h}" target="_blank" rel="noopener">${esc(t)}</a>`]), [['打 /hire 直接複製 Email', 'dim']]); } },
    hire: { desc: '複製 Email', run: () => { copy((C.contact || {}).email, 'Email 已複製，期待你的來信！'); return [['Email 已複製到剪貼簿 ✓', 'ok']]; } },
    clear: { desc: '清空終端機', run: (a, ctx) => { if (ctx && ctx.out) ctx.out.innerHTML = ''; return []; } },
    ls: { hidden: true, run: () => [['about.txt  projects/  album.app  awards/  journey.log  skills.sh  contact.exe  toys.app  .secret']] },
    cat: { hidden: true, run: a => a === '.secret' ? [['找到了！試試 sudo make coffee，或在桌面打 Konami 秘技 ↑↑↓↓←→←→BA', 'ok']] : a === 'motto.txt' ? [['心中的火焰比任何風暴都更持久。', 'hl']] : [['cat: ' + esc(a || '') + ': 找不到檔案', 'err']] },
    sudo: { hidden: true, run: a => a === 'make coffee' ? [['沖煮中… 萃取 25 秒… 完成！（洺安在葡萄王的吧檯是真的會做）', 'ok']]
      : /rm\s+-rf/.test(a || '') ? [['權限不足，但勇氣可嘉。', 'err']] : a === 'hire mingan' ? CMDS.hire.run() : [['[sudo] 密碼才不告訴你', 'dim']] },
    matrix: { hidden: true, run: () => { matrix.full(6); return [['Wake up, Ming-An...', 'ok']]; } },
    date: { hidden: true, run: () => [[new Date().toString()]] },
    echo: { hidden: true, run: a => [[esc(a || '')]] },
    exit: { hidden: true, run: () => [['你走不掉的 :)', 'hl']] },
  };
  // 直接打 app 名字也可以，例如 /album、/相簿
  function resolve(line) {
    const raw = line.trim().replace(/^\/+/, '');
    if (!raw) return null;
    const [c, ...rest] = raw.split(/\s+/);
    const key = c.toLowerCase();
    if (CMDS[key]) return { key, arg: rest.join(' ') };
    const id = findApp(key);
    if (id) return { key: 'open', arg: id };
    if (THEMES[key]) return { key: 'theme', arg: key };
    return { key: null, name: c };
  }
  function execute(line, ctx) {
    const r = resolve(line);
    if (!r) return [];
    if (!r.key) return [[`找不到指令：${esc(r.name)}（打 /help 看看）`, 'err']];
    return CMDS[r.key].run(r.arg, ctx) || [];
  }
  function suggest(text) {
    const raw = text.replace(/^\/+/, '');
    const [c, ...rest] = raw.split(/\s+/);
    const out = [];
    if (raw.includes(' ') && CMDS[c.toLowerCase()] && CMDS[c.toLowerCase()].args) {
      const part = rest.join(' ').toLowerCase();
      CMDS[c.toLowerCase()].args().filter(x => x.startsWith(part)).forEach(x =>
        out.push({ fill: `${c.toLowerCase()} ${x}`, label: `/${c.toLowerCase()} ${x}`, desc: c.toLowerCase() === 'open' ? APPS[x].title : THEMES[x] }));
      return out;
    }
    const q = c.toLowerCase();
    Object.entries(CMDS).filter(([k, v]) => !v.hidden && k.startsWith(q)).forEach(([k, v]) =>
      out.push({ fill: v.args ? k + ' ' : k, label: '/' + k + (v.args ? ' …' : ''), desc: v.desc, more: !!v.args }));
    if (q) Object.entries(APPS).filter(([id, a]) => id.startsWith(q) || a.alias.some(x => x.startsWith(q))).forEach(([id, a]) =>
      out.push({ fill: 'open ' + id, label: '/open ' + id, desc: a.title }));
    return out.slice(0, 8);
  }

  /* ================= / 指令列 ================= */
  const pal = $('#palette'), palIn = $('#palIn'), palList = $('#palList');
  let palSel = 0, palItems = [];
  function showPalette(prefill = '') {
    closeMenus();
    pal.hidden = false; palIn.value = prefill; renderPal(); palIn.focus();
  }
  function hidePalette() { pal.hidden = true; palIn.blur(); }
  function renderPal() {
    palItems = suggest(palIn.value);
    palSel = Math.min(palSel, Math.max(0, palItems.length - 1));
    palList.innerHTML = palItems.map((it, i) => `<li role="option" data-i="${i}" class="${i === palSel ? 'on' : ''}"><b>${esc(it.label)}</b><span>${esc(it.desc || '')}</span></li>`).join('');
  }
  function runPalette(line) {
    const lines = execute(line);
    hidePalette();
    const first = lines.find(l => l[0]);
    if (first) say(first[0].replace(/<[^>]+>/g, ''));
    if (/^\/?(help|whoami|skills|contact)\b/i.test(line.trim())) {
      openApp('terminal');
      const t = open.get('terminal'); t && t.el.term && t.el.term.show(line.trim(), lines);
    }
  }
  palIn.addEventListener('input', () => { palSel = 0; renderPal(); });
  palIn.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); palSel = Math.min(palItems.length - 1, palSel + 1); renderPal(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); palSel = Math.max(0, palSel - 1); renderPal(); }
    else if (e.key === 'Tab' && palItems[palSel]) { e.preventDefault(); palIn.value = palItems[palSel].fill; renderPal(); }
    else if (e.key === 'Escape') hidePalette();
  });
  $('#palForm').addEventListener('submit', e => {
    e.preventDefault();
    const v = palIn.value.trim();
    const it = palItems[palSel];
    // 沒打完整（例如只打 the），就用選中的提示
    if (it && (!resolve(v) || !resolve(v).key || (it.more && !v.includes(' ')))) {
      if (it.more) { palIn.value = it.fill; renderPal(); return; }
      runPalette(it.fill); return;
    }
    runPalette(v);
  });
  palList.addEventListener('click', e => {
    const li = e.target.closest('li'); if (!li) return;
    const it = palItems[+li.dataset.i];
    if (it.more) { palIn.value = it.fill; palIn.focus(); renderPal(); } else runPalette(it.fill);
  });
  pal.addEventListener('pointerdown', e => { if (e.target === pal) hidePalette(); });

  /* ================= 終端機 ================= */
  function Terminal(el) {
    const out = $('.term-out', el), form = $('.term-form', el), input = $('input', el);
    const hist = []; let hi = 0;
    function print(html, cls) {
      const d = document.createElement('div'); if (cls) d.className = cls; d.innerHTML = html;
      out.appendChild(d); out.scrollTop = out.scrollHeight;
    }
    function lines(ls) { ls.forEach(([h, c]) => print(h, c)); }
    function run(line) {
      const raw = line.trim();
      print(`<span class="cmd"><b>mingan@cycu:~$</b> ${esc(raw)}</span>`);
      if (!raw) return;
      hist.push(raw); hi = hist.length;
      lines(execute(raw, { out }));
    }
    form.addEventListener('submit', e => { e.preventDefault(); run(input.value); input.value = ''; });
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowUp') { e.preventDefault(); if (hi > 0) input.value = hist[--hi]; }
      else if (e.key === 'ArrowDown') { e.preventDefault(); hi = Math.min(hist.length, hi + 1); input.value = hist[hi] || ''; }
      else if (e.key === 'Tab') {
        e.preventDefault();
        const s = suggest(input.value);
        if (s.length === 1) input.value = s[0].fill;
        else if (s.length > 1) print(s.map(x => x.label).join('   '), 'dim');
      }
    });
    out.addEventListener('click', () => { if (!getSelection().toString()) input.focus({ preventScroll: true }); });
    el.term = { show(cmd, ls) { print(`<span class="cmd"><b>mingan@cycu:~$</b> ${esc(cmd)}</span>`); lines(ls); } };
    lines([
      ['MingAn OS v2026.11 — 歡迎！', 'ok'],
      ['打 <span class="hl">help</span> 看指令，或試試 <span class="hl">theme hacker</span>、<span class="hl">open 相簿</span>、<span class="hl">jump</span>', 'dim'],
    ]);
  }

  /* ================= 玩具間（matter.js） ================= */
  function Toys(el) {
    const box = $('.toybox', el);
    if (!window.Matter) { box.innerHTML = '<p style="padding:16px">物理引擎沒有載入成功。</p>'; return; }
    const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint, Events } = Matter;
    const engine = Engine.create();
    let W = 0, H = 0, walls = [], toys = [], running = true, raf = 0;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const SPRITES = ['icon_keycaps', 'icon_trophy', 'icon_camera', 'icon_envelope', 'icon_stairs', 'tree23', 'heap'];
    const PILLS = [['C/C++', '#fff'], ['Java', '#ffd23f'], ['Verilog', '#16c59b'], ['HTML', '#ff8a00'], ['CSS', '#ff4f8b'], ['系統分析', '#ece2ff'], ['經濟預測', '#ffd23f'], ['導覽解說', '#ff8a00'], ['咖啡', '#16c59b']];
    function walls_() {
      Composite.remove(engine.world, walls);
      W = box.clientWidth; H = box.clientHeight; const t = 200;
      walls = [Bodies.rectangle(W / 2, H + t / 2, W * 3, t, { isStatic: true }), Bodies.rectangle(W / 2, -t / 2, W * 3, t, { isStatic: true }),
        Bodies.rectangle(-t / 2, H / 2, t, H * 3, { isStatic: true }), Bodies.rectangle(W + t / 2, H / 2, t, H * 3, { isStatic: true })];
      Composite.add(engine.world, walls);
    }
    function add(node, body, w, h) {
      node.style.width = w + 'px'; node.style.height = h + 'px'; box.appendChild(node);
      body.plugin = { node, w, h }; Composite.add(engine.world, body); toys.push(body);
    }
    const inX = m => rnd(m, Math.max(m + 1, W - m));
    function grapes(n) {
      for (let i = 0; i < n; i++) {
        const r = rnd(11, 18), d = document.createElement('div'); d.className = 'toy toy-grape';
        add(d, Bodies.circle(inX(r), rnd(10, 60), r, { restitution: .7, friction: .05 }), r * 2, r * 2);
      }
    }
    function fill() {
      toys.forEach(b => { Composite.remove(engine.world, b); b.plugin.node.remove(); }); toys = [];
      const k = W < 500 ? .7 : 1;
      SPRITES.forEach(src => {
        const s = Math.round(rnd(110, 140) * k), d = document.createElement('div'); d.className = 'toy';
        d.innerHTML = `<img src="./assets/3d/${src}.png" alt="" draggable="false">`;
        add(d, Bodies.rectangle(inX(s / 2), rnd(20, H * .5), s * .5, s * .42, { chamfer: { radius: s * .1 }, restitution: .45, angle: rnd(-.5, .5) }), s, s);
      });
      PILLS.forEach(([label, bg]) => {
        const d = document.createElement('div'); d.className = 'toy toy-pill'; d.textContent = label;
        d.style.cssText = `background:${bg};font-size:${k < 1 ? 13 : 15}px;padding:0 14px;width:auto`;
        box.appendChild(d); const w = Math.ceil(d.getBoundingClientRect().width) || 90, h = k < 1 ? 34 : 40; d.remove();
        add(d, Bodies.rectangle(inX(w / 2 + 4), rnd(10, H * .4), w, h, { chamfer: { radius: h / 2 }, restitution: .55, angle: rnd(-.4, .4) }), w, h);
      });
      grapes(8);
    }
    const mouse = Mouse.create(box);
    ['mousewheel', 'DOMMouseScroll', 'wheel'].forEach(ev => box.removeEventListener(ev, mouse.mousewheel));
    Composite.add(engine.world, MouseConstraint.create(engine, { mouse, constraint: { stiffness: .2, render: { visible: false } } }));
    let last = performance.now();
    function loop(now) {
      if (!running) return;
      Engine.update(engine, Math.min(32, now - last)); last = now;
      for (const b of toys) { const { node, w, h } = b.plugin; node.style.transform = `translate(${b.position.x - w / 2}px, ${b.position.y - h / 2}px) rotate(${b.angle}rad)`; }
      raf = requestAnimationFrame(loop);
    }
    requestAnimationFrame(() => { walls_(); fill(); raf = requestAnimationFrame(loop); });
    new ResizeObserver(() => walls_()).observe(box);
    $$('[data-toy]', el).forEach(b => b.addEventListener('click', () => {
      const a = b.dataset.toy;
      if (a === 'grapes') grapes(14);
      if (a === 'flip') { engine.gravity.y *= -1; say(engine.gravity.y < 0 ? '重力反轉！' : '重力恢復'); }
      if (a === 'shake') toys.forEach(t => Body.applyForce(t, t.position, { x: rnd(-.04, .04) * t.mass, y: -rnd(.03, .08) * t.mass }));
      if (a === 'reset') { engine.gravity.y = 1; fill(); }
    }));
    el.addEventListener('winclose', () => { running = false; cancelAnimationFrame(raf); });
    window.__toys = () => toys.length;
  }

  /* ================= 桌面寵物 ================= */
  const pet = (() => {
    const el = $('#pet'), bubble = $('#bubble');
    const LINES = C.petLines && C.petLines.length ? C.petLines : ['點我！'];
    let n = 0, pos = 18;
    function jump() {
      el.classList.remove('jump'); void el.offsetWidth; el.classList.add('jump');
      n++; bubble.textContent = LINES[n % LINES.length];
      if (n % 10 === 0) say(`已經跳了 ${n} 次！`);
    }
    el.addEventListener('click', jump);
    el.addEventListener('animationend', () => el.classList.remove('jump'));
    // 偶爾走一走
    if (!reduce) setInterval(() => {
      if (document.hidden || mobile()) return;
      const next = Math.round(8 + Math.random() * 50);
      el.classList.toggle('face-l', next > pos);
      el.classList.add('walk'); pos = next;
      el.style.right = pos + '%'; bubble.style.right = `calc(${pos}% + 30px)`;
    }, 9000);
    return { jump };
  })();

  /* ================= Matrix（Hacker 主題的桌布） ================= */
  const matrix = (() => {
    const cv = $('#matrix'), g = cv.getContext('2d');
    const glyphs = 'アイウエオカキクケコサシスセソ0123456789陳洺安{}<>/=+*#';
    let cols = [], fs = 16, raf = 0, last = 0, isFull = false;
    function size() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
      fs = innerWidth < 600 ? 13 : 16; cols = Array.from({ length: Math.ceil(innerWidth / fs) }, () => Math.random() * -60);
    }
    function draw(now) {
      raf = requestAnimationFrame(draw);
      if (now - last < 55) return; last = now;
      g.fillStyle = 'rgba(5, 8, 6, .14)'; g.fillRect(0, 0, innerWidth, innerHeight);
      g.font = `${fs}px "JetBrains Mono", monospace`;
      cols.forEach((y, i) => {
        g.fillStyle = Math.random() < .04 ? '#eafff1' : '#39ff88';
        g.fillText(glyphs[(Math.random() * glyphs.length) | 0], i * fs, y * fs);
        cols[i] = y * fs > innerHeight && Math.random() > .975 ? 0 : y + 1;
      });
    }
    function toggle() {
      const on = !reduce && !document.hidden && ((root.dataset.theme === 'hacker' && !(window.FX && FX.ok)) || isFull);
      cv.style.display = isFull ? 'block' : ''; cv.style.zIndex = isFull ? 800 : ''; cv.style.opacity = isFull ? '.9' : '';
      if (on && !raf) { size(); raf = requestAnimationFrame(draw); }
      if (!on && raf) { cancelAnimationFrame(raf); raf = 0; g.clearRect(0, 0, innerWidth, innerHeight); }
    }
    function full(sec) { isFull = true; toggle(); setTimeout(() => { isFull = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } toggle(); }, sec * 1000); }
    addEventListener('resize', () => { if (raf) size(); });
    document.addEventListener('visibilitychange', toggle);
    return { toggle, full };
  })();

  /* ================= 一般模式 / 選單 / 桌面 ================= */
  const cv = $('#cv');
  (function renderCV() {
    const P = C.profile || {}, K = C.contact || {};
    $('#cvIn').innerHTML = `
      <button type="button" class="cv-back" data-act="desktop">← 回到桌面</button>
      <header class="cv-head"><img src="${P.photo}" alt="${esc(P.name)}">
        <div><h1>${esc(P.name)} <span>${esc(P.nameEn)}</span></h1><p>${esc(P.school)} · ${esc(P.now)}</p>
        <p class="cv-contact">${esc(K.email)} · ${esc(K.phone)}${(K.links || []).slice(0, 1).map(([, t, h]) => ` · <a href="${h}" target="_blank" rel="noopener">${esc(t)}</a>`).join('')}</p></div></header>
      ${P.headline ? `<p class="cv-headline">${esc(P.headline)}</p>` : ''}
      ${(C.about_en || []).length ? `<section><h2>ABOUT</h2>${C.about_en.map(t => `<p>${esc(t)}</p>`).join('')}</section>` : ''}
      <section><h2>學歷</h2><ul class="cv-list">${(C.education || []).map(e => `<li><b>${esc(e.school)}</b><span>${esc(e.dept)}　<i>${esc(e.when)}</i></span></li>`).join('')}</ul></section>
      <section><h2>經歷</h2><ul class="cv-list">${(C.jobs || []).slice().reverse().map(j => `<li><b>${esc(j.title)}<br><i>${esc(j.when || '')}</i></b><span><b>${esc(j.role || '')}</b>　${esc(j.note || '')}</span></li>`).join('')}</ul></section>
      <section><h2>技能</h2><p>${(C.skills || []).map(([n]) => esc(n)).join('、')}</p></section>
      <section><h2>專案</h2><ul class="cv-list">${(C.projects || []).map(p => `<li><b>${esc(p.title)}<br><i>${esc(p.kind)}</i></b><span>${esc(p.text)}</span></li>`).join('')}</ul></section>
      <section><h2>一路走來</h2><ul class="cv-list">${(C.journey || []).map(j => `<li><b>${esc(j.when)}　${esc(j.title)}</b><span>${esc(j.text || j.sub || '')}</span></li>`).join('')}</ul></section>
      <section><h2>獎項與證照</h2><ul class="cv-list">${(C.awards || []).map(a => `<li><b>${esc(a.year || '')}</b><span>${esc(a.title)}</span></li>`).join('')}</ul></section>`;
    const st = $('#mbStatus'); if (st) st.textContent = P.status || '';
  })();
  function showCV(on) { cv.hidden = !on; if (on) cv.scrollTop = 0; }
  const startMenu = $('#startMenu'), themeMenu = $('#themeMenu');
  function closeMenus() { startMenu.hidden = true; themeMenu.hidden = true; $$('.start').forEach(b => b.setAttribute('aria-expanded', 'false')); }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-app], [data-act], [data-theme-set], [data-menu], [data-copy]');
    if (!t) { if (!e.target.closest('.startmenu, .dropdown')) closeMenus(); return; }
    if (t.classList.contains('icon') && !mobile() && e.detail === 1 && t.dataset.app) {
      // 桌機：點一下選取、點兩下打開
      $$('.icon').forEach(i => i.classList.toggle('sel', i === t)); return;
    }
    if (t.dataset.app) { closeMenus(); openApp(t.dataset.app, t); return; }
    if (t.dataset.themeSet) { closeMenus(); setTheme(t.dataset.themeSet); say('主題：' + THEMES[t.dataset.themeSet]); return; }
    if (t.dataset.copy) { copy(t.dataset.copy); return; }
    if (t.dataset.menu === 'theme') { const was = themeMenu.hidden; closeMenus(); themeMenu.hidden = !was; return; }
    const act = t.dataset.act;
    if (act === 'start') { const was = startMenu.hidden; closeMenus(); startMenu.hidden = !was; $$('.start').forEach(b => b.setAttribute('aria-expanded', String(was))); }
    if (act === 'palette') showPalette();
    if (act === 'cv') { closeMenus(); showCV(true); }
    if (act === 'desktop') showCV(false);
  });
  $$('.icon[data-app]').forEach(i => {
    i.addEventListener('dblclick', () => openApp(i.dataset.app, i));
    i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); openApp(i.dataset.app, i); } });
  });

  /* ================= 全域快捷鍵 ================= */
  const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let keys = [];
  addEventListener('keydown', e => {
    const typing = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
    if (e.key === 'Escape') { if (!pal.hidden) hidePalette(); else if (!cv.hidden) showCV(false); else closeMenus(); return; }
    if (typing || !$('#boot').hidden) return;
    if (e.key === '/' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); showPalette(); return; }
    keys = keys.concat(e.key).slice(-konami.length);
    if (keys.join() === konami.join()) { matrix.full(8); say('你找到彩蛋了！'); keys = []; }
  });

  /* ================= 螢幕保護程式（閒置 45 秒） ================= */
  let booted = false, idleTimer = 0;
  function startSaver() {
    if (!(window.FX && FX.ok) || FX.saver.active) return;
    if ($$('video').some(v => !v.paused)) return;
    hidePalette(); closeMenus();
    FX.saver.start(armIdle);
  }
  function armIdle() { clearTimeout(idleTimer); if (booted && !reduce) idleTimer = setTimeout(startSaver, 45000); }
  ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, () => { if (!(window.FX && FX.saver.active)) armIdle(); }, { passive: true }));

  /* ================= 時鐘 ================= */
  const tick = () => { const d = new Date(), s = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); $$('.clock').forEach(c => { c.textContent = s; }); };
  tick(); setInterval(tick, 15000);

  /* ================= 開機 ================= */
  function boot(done) {
    const b = $('#boot'), log = $('#bootLog'), bar = $('#bootBar'), b3 = $('#boot3d');
    let seen = false;
    try { seen = sessionStorage.getItem('booted') === '1'; } catch (e) {}
    if (seen || reduce || /[?&]noboot/.test(location.search)) { done(); return; }
    b.hidden = false;
    if (window.FX && FX.ok) { FX.preload('./assets/3d/desk.glb'); FX.pauseWallpaper(true); }
    const L = ['MingAn BIOS v2026.11   (C) 中原大學 CSIE × IM', 'CPU: Brain @ 咖啡因加速 ........ OK', 'Memory: 大一到大四 4 年 ........ OK',
      'Loading jump-daemon (彈跳力 99) . OK', 'Mounting /葡萄王 ............... OK', 'Starting desktop ...'];
    const T = 1500, t0 = performance.now();
    let biosDone = false, all = false;
    const end = () => {
      if (all) return; all = true;
      try { sessionStorage.setItem('booted', '1'); } catch (e) {}
      removeEventListener('keydown', skip); b.removeEventListener('pointerdown', skip); b3.removeEventListener('pointerdown', skip);
      if (!b3.hidden) b.hidden = true; else { b.classList.add('out'); setTimeout(() => { b.hidden = true; b.classList.remove('out'); }, 350); }
      if (!b3.hidden) { b3.classList.add('out'); setTimeout(() => { b3.hidden = true; b3.classList.remove('out'); }, 450); }
      window.FX && FX.pauseWallpaper && FX.pauseWallpaper(false);
      done();
    };
    const skip = () => end();
    function biosFinished() {
      if (biosDone || all) return; biosDone = true;
      if (!(window.FX && FX.ok)) { end(); return; }
      // BIOS 跑完：鏡頭飛進 CRT 螢幕
      FX.bootZoom(root.dataset.theme).then(() => end());
      setTimeout(() => { if (!b3.hidden) { b.hidden = true; } }, 60);
    }
    (function step(now) {
      if (all) return;
      const p = Math.min(1, (now - t0) / T);
      bar.style.width = p * 100 + '%';
      log.textContent = L.slice(0, Math.ceil(p * L.length)).join('\n');
      if (p < 1) requestAnimationFrame(step); else biosFinished();
    })(t0);
    addEventListener('keydown', skip); b.addEventListener('pointerdown', skip); b3.addEventListener('pointerdown', skip);
  }

  /* ================= 啟動 ================= */
  setTheme(root.dataset.theme);
  boot(() => {
    booted = true; armIdle();
    if (!mobile()) { openApp('about'); openApp('terminal'); const t = open.get('terminal');
      if (t) { t.el.style.left = Math.max(260, innerWidth - 620) + 'px'; t.el.style.top = Math.max(60, innerHeight - 460) + 'px'; } focusWin('about'); }
  });

  window.__os = { openApp, closeApp, setTheme, execute, showPalette, startSaver, jump: () => pet.jump() };
})();
