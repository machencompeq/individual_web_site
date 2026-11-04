(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;

  /* ---------- 導覽：目前區塊 + 閱讀進度 ---------- */
  const links = $$('#tabs a');
  const sections = [$('#hello'), ...links.map(a => $(a.getAttribute('href')))].filter(Boolean);
  const bar = $('#progressBar');
  function onScroll() {
    const y = scrollY + innerHeight * 0.35;
    let current = sections[0];
    for (const s of sections) if (s.offsetTop <= y) current = s;
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) current = sections[sections.length - 1];
    links.forEach(a => {
      const on = a.getAttribute('href') === '#' + current.id;
      if (on && !a.classList.contains('is-active')) {
        a.classList.add('is-active');
        const nav = a.parentElement;
        nav.scrollTo({ left: a.offsetLeft - nav.clientWidth / 2 + a.offsetWidth / 2, behavior: 'smooth' });
      } else if (!on) a.classList.remove('is-active');
    });
    if (current.id === 'hello' && links[0]) links[0].parentElement.scrollLeft = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- 獎項篩選 ---------- */
  const chips = $$('.filters .chip');
  const awards = $$('#awardGrid .award');
  function setFilter(f) {
    chips.forEach(c => c.classList.toggle('is-on', c.dataset.filter === f));
    awards.forEach(a => { a.hidden = !(f === 'all' || a.dataset.cat === f); });
  }
  chips.forEach(c => c.addEventListener('click', () => setFilter(c.dataset.filter)));
  $$('a[data-filter]').forEach(a => a.addEventListener('click', () => setFilter(a.dataset.filter)));

  /* ---------- 作品分頁（IDE tabs） ---------- */
  const tabs = $$('.ide-tabs [role="tab"]');
  function selectTab(tab, focus) {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
    const strip = tab.parentElement;
    strip.scrollTo({ left: tab.offsetLeft - 16, behavior: 'smooth' });
    window.dispatchEvent(new Event('panelchange'));
    const viewer = $('#' + tab.getAttribute('aria-controls') + ' .code-viewer');
    if (viewer) loadCode(viewer);
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); selectTab(tabs[(i + d + tabs.length) % tabs.length], true); }
    });
  });
  $$('a[data-tab]').forEach(a => a.addEventListener('click', () => selectTab($('#tab-' + a.dataset.tab))));

  /* ---------- 程式碼載入（原始檔為 Big5） ---------- */
  async function loadCode(viewer) {
    if (viewer.dataset.state) return;
    viewer.dataset.state = 'loading';
    const code = $('code', viewer);
    try {
      const res = await fetch(viewer.dataset.src);
      if (!res.ok) throw new Error(res.status);
      const buf = await res.arrayBuffer();
      let text;
      try { text = new TextDecoder('utf-8', { fatal: true }).decode(buf); }
      catch (e) { text = new TextDecoder('big5').decode(buf); }
      const frag = document.createDocumentFragment();
      text.replace(/\r\n?/g, '\n').split('\n').forEach((line, i) => {
        const s = document.createElement('span');
        s.className = /^\s*(\/\/|\/\*|\*)/.test(line) ? 'ln c' : 'ln';
        s.dataset.n = i + 1; s.textContent = line || ' ';
        frag.appendChild(s);
      });
      code.textContent = '';
      code.appendChild(frag);
      viewer.dataset.state = 'done';
    } catch (err) {
      code.innerHTML = '';
      const m = document.createElement('span'); m.className = 'msg';
      m.append('程式碼沒有載入成功。');
      const a = document.createElement('a'); a.href = viewer.dataset.src; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = '直接開啟原始檔';
      m.append(a);
      code.appendChild(m);
      delete viewer.dataset.state;
    }
  }
  const firstViewer = $('#panel-tree .code-viewer');
  if (firstViewer) loadCode(firstViewer);

  /* ---------- 圖片檢視（左右切換、鍵盤、滑動） ---------- */
  const lb = $('#lightbox');
  const lbImg = $('img', lb);
  const lbTitle = $('.lb-title', lb);
  const lbCount = $('.lb-count', lb);
  let group = [], idx = 0, lastFocus = null;

  function captionOf(btn) {
    const fig = btn.closest('figure');
    const h = fig && $('h3', fig);
    return h ? h.textContent : ($('span', btn) ? $('span', btn).textContent : $('img', btn).alt);
  }
  function show(i) {
    idx = (i + group.length) % group.length;
    const b = group[idx];
    lbImg.src = b.dataset.full;
    lbImg.alt = $('img', b).alt;
    lbTitle.textContent = captionOf(b);
    lbCount.textContent = (idx + 1) + ' / ' + group.length;
  }
  function open(btn) {
    const container = btn.closest('#awardGrid, #photoGrid');
    group = $$('.thumb', container).filter(b => !b.closest('[hidden]'));
    lastFocus = btn;
    show(group.indexOf(btn));
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    $('.lb-close', lb).focus();
  }
  function close() {
    lb.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  $$('.thumb').forEach(b => b.addEventListener('click', () => open(b)));
  $('.lb-close', lb).addEventListener('click', close);
  $('.lb-prev', lb).addEventListener('click', () => show(idx - 1));
  $('.lb-next', lb).addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', e => { if (e.target === lb || e.target.tagName === 'FIGURE') close(); });
  addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'ArrowRight') show(idx + 1);
  });
  let tx = null;
  lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    tx = null;
  });

  /* ---------- 複製聯絡方式 ---------- */
  const toast = $('#toast');
  let tt;
  function say(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(tt);
    tt = setTimeout(() => toast.classList.remove('show'), 1800);
  }
  $$('.copy').forEach(b => b.addEventListener('click', () => {
    const v = b.dataset.copy;
    const fallback = () => {
      const el = b.parentElement.querySelector('.c-value');
      const r = document.createRange(); r.selectNodeContents(el);
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      say('已選取，按 Ctrl/⌘ + C 複製');
    };
    try {
      navigator.clipboard.writeText(v).then(() => say('已複製：' + v), fallback);
    } catch (e) { fallback(); }
  }));
  /* ---------- 鍵盤快捷鍵 1–6 ---------- */
  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey || !lb.hidden) return;
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= links.length) { e.preventDefault(); links[n - 1].click(); }
  });

  /* ---------- 打字效果 ---------- */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const typed = $('#typed');
  const cmds = ['whoami', 'cat motto.txt', 'sudo make coffee', './hello --warm'];
  if (typed && !reduce) {
    let ci = 0, pos = cmds[0].length, del = true;
    setTimeout(function tick() {
      const word = cmds[ci];
      pos += del ? -1 : 1;
      typed.textContent = word.slice(0, pos);
      let wait = del ? 40 : 90;
      if (!del && pos >= word.length) { del = true; wait = 2200; }
      else if (del && pos <= 0) { del = false; ci = (ci + 1) % cmds.length; wait = 300; }
      setTimeout(tick, wait);
    }, 3200);
  }

  /* ---------- 名字偶爾 glitch ---------- */
  const nameEl = $('.name');
  if (nameEl && !reduce) setInterval(() => {
    nameEl.classList.add('glitch');
    setTimeout(() => nameEl.classList.remove('glitch'), 700);
  }, 6000);

  /* ---------- 卡片 3D 傾斜 ---------- */
  if (!reduce && matchMedia('(hover: hover)').matches) {
    $$('.tilt').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------- 狀態列時鐘 ---------- */
  const clock = $('#clock');
  const tickClock = () => {
    const d = new Date();
    clock.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  };
  if (clock) { tickClock(); setInterval(tickClock, 15000); }
})();
