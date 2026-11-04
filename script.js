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
    matrix.toggle();
    return true;
  }

  /* ================= App 定義 ================= */
  const APPS = {
    about:    { title: '關於我.txt',    w: 560, h: 470, alias: ['關於', '關於我', 'me'] },
    terminal: { title: '終端機 — zsh',  w: 560, h: 340, alias: ['終端機', 'term', 'shell'], flush: true },
    projects: { title: '作品/',         w: 880, h: 600, alias: ['作品', 'works', 'code'] },
    album:    { title: '相簿.app',      w: 660, h: 600, alias: ['相簿', 'photos', 'photo'] },
    awards:   { title: '獎狀/',         w: 700, h: 560, alias: ['獎狀', '證照', 'award'] },
    journey:  { title: '一路走來.log',  w: 560, h: 600, alias: ['經歷', '一路走來', 'timeline'] },
    skills:   { title: '技能.sh',       w: 480, h: 420, alias: ['技能', 'skill'] },
    contact:  { title: '聯絡我.exe',    w: 520, h: 380, alias: ['聯絡', '聯絡我', 'mail'] },
    toys:     { title: '玩具間.app',    w: 620, h: 470, alias: ['玩具', '玩具間', 'toy'] },
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

  function focusWin(id) {
    const w = open.get(id); if (!w) return;
    w.el.hidden = false; w.el.style.zIndex = ++z;
    open.forEach((o, k) => { o.el.classList.toggle('focus', k === id); o.task.classList.toggle('on', k === id && !o.el.hidden); });
  }
  function openApp(id) {
    if (!APPS[id]) return false;
    if (open.has(id)) { focusWin(id); return true; }
    const a = APPS[id];
    const el = document.createElement('section');
    el.className = 'win' + (reduce ? '' : ' anim-in');
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
      if (!o.el.hidden && o.el.classList.contains('focus')) { o.el.hidden = true; task.classList.remove('on'); }
      else focusWin(id);
    });
    tasks.appendChild(task);
    open.set(id, { el, task });

    $('.c-close', el).addEventListener('click', () => closeApp(id));
    $('.c-min', el).addEventListener('click', () => { el.hidden = true; task.classList.remove('on'); });
    $('.c-max', el).addEventListener('click', () => el.classList.toggle('max'));
    $('.titlebar', el).addEventListener('dblclick', e => { if (!e.target.closest('.ctrls')) el.classList.toggle('max'); });
    el.addEventListener('pointerdown', () => focusWin(id));
    dragify(el, $('.titlebar', el), 'move');
    dragify(el, $('.resize', el), 'size');
    INIT[id] && INIT[id](el);
    window.__initStages && window.__initStages(el);
    focusWin(id);
    return true;
  }
  function closeApp(id) {
    const o = open.get(id); if (!o) return;
    o.el.dispatchEvent(new Event('winclose'));
    o.el.remove(); o.task.remove(); open.delete(id);
  }
  function closeAll() { [...open.keys()].forEach(closeApp); }
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
  const PHOTOS = [
    ['new/street.jpg', '老街散步'], ['new/sunset.jpg', '大溪的夕陽'], ['new/temple.jpg', '老樹和廟'],
    ['new/grad_full.jpg', '畢業照'], ['new/grad_cap.jpg', '畢業典禮'], ['new/tour.jpg', '葡萄王導覽'],
    ['new/coffee.jpg', '吧檯咖啡時間'], ['new/jump.jpg', '上班也要跳一下'], ['S__1851394.jpg', '海邊比耶'],
    ['8A756D7C-FD46-40F7-BE1F-1C669E6CB23B.jpg', '饒河街夜市'], ['rest.jpg', '黑客松'], ['S__1851396.jpg', '佛學參訪'],
    ['work_1.jpg', '工作照'], ['S__129581066.jpg', '閒暇跑 Uber'],
  ].map(([f, c]) => ['./image/web/' + f, c]);
  const AWARDS = [
    ['school', 'good_grade', '書卷獎', '第一次拿到書卷獎，雖然只有 2000 元，但還是很快樂！'],
    ['school', 'enterprise', '企資通', '超努力搞懂各種 protocol，現在有關網路的課幾乎都用得到。'],
    ['school', 'ds', '資料結構', '演算法最基礎的課，也讓我在資工可以吃老本。'],
    ['school', 'pbl', 'PBL', '跟工業系跨系合作：我們分析，他們做竹槍。'],
    ['school', 'tradetheory', '貿易理論', '要背超多東西，但學到很多貿易、匯率和市場理論。'],
    ['exp', 'codefest', '黑客松', '第一次碰前端，向很多厲害的人學習，一起整晚不睡打 code。'],
    ['exp', 'service', '義工服務', '青年團、夏令營帶營隊，認識很多學校以外的朋友。'],
    ['exp', 'sunior', '市長獎', '高中畢業時拿到臺南市市長獎。'],
    ['cert', 'jept', '英檢', '考過英文畢業門檻，大一就不用再一直做模擬考。'],
    ['cert', 'java_1', 'Java SE 7 Programming', 'Oracle Workforce Development Program 結業。'],
    ['cert', 'java_2', 'Java SE 7 Fundamentals', 'Oracle Workforce Development Program 結業。'],
    ['cert', 'cwt', '全民中文能力檢定', 'CWT 中高等合格。'],
  ];

  const INIT = {
    terminal(el) { Terminal(el); },
    projects(el) {
      const tabs = $$('[role="tab"]', el);
      const show = name => {
        tabs.forEach(t => t.setAttribute('aria-selected', t.dataset.tab === name));
        $$('.tab-panel', el).forEach(p => { p.hidden = p.dataset.panel !== name; });
        const v = $(`[data-panel="${name}"] .code-viewer`, el); if (v) loadCode(v);
      };
      tabs.forEach(t => t.addEventListener('click', () => show(t.dataset.tab)));
      el.showTab = show;
      show('tree');
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
    },
    awards(el) {
      const files = $('.files', el), detail = $('.award-detail', el);
      AWARDS.forEach(([cat, img, title, text]) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'file'; b.dataset.cat = cat;
        b.innerHTML = `<img src="./image/web/award/${img}.jpg" alt="" loading="lazy"><span>${title}.jpg</span>`;
        b.addEventListener('click', () => {
          files.hidden = true; $('.filters', el).hidden = true; detail.hidden = false;
          $('.award-view img', el).src = `./image/web/award/${img}.jpg`; $('.award-view img', el).alt = title;
          $('.award-view h3', el).textContent = title; $('.award-view p', el).textContent = text;
        });
        files.appendChild(b);
      });
      $('.award-back', el).addEventListener('click', () => { files.hidden = false; $('.filters', el).hidden = false; detail.hidden = true; });
      $$('[data-filter]', el).forEach(c => c.addEventListener('click', () => {
        $$('[data-filter]', el).forEach(x => x.classList.toggle('is-on', x === c));
        $$('.file', files).forEach(f => { f.hidden = !(c.dataset.filter === 'all' || f.dataset.cat === c.dataset.filter); });
      }));
    },
    toys(el) { Toys(el); },
  };

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
    cv: { desc: '一般履歷模式', run: () => { showCV(true); return [['→ 一般模式', 'ok']]; } },
    whoami: { desc: '我是誰', run: () => [['陳洺安 Ming-An Chen', 'ok'], ['中原大學 資工 × 資管 畢業 · 現在在葡萄王'], ['會寫程式、會導覽、會做咖啡，還會跳很高。', 'dim']] },
    skills: { desc: '技能', run: () => [['[程式] C/C++ · Java · Verilog · HTML/CSS', 'ok'], ['[分析] 商業經濟預測 · 證券分析 · 系統分析', 'hl'], ['[人]   導覽解說 · 門市銷售 · 咖啡吧檯', 'dim']] },
    contact: { desc: '聯絡方式', run: () => [['email  asd0389wsx0216@gmail.com', 'ok'], ['phone  0978-581-189'], ['github <a href="https://github.com/minggg1030" target="_blank" rel="noopener">github.com/minggg1030</a>'], ['打 /hire 直接複製 Email', 'dim']] },
    hire: { desc: '複製 Email', run: () => { copy('asd0389wsx0216@gmail.com', 'Email 已複製，期待你的來信！'); return [['Email 已複製到剪貼簿 ✓', 'ok']]; } },
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
    const LINES = ['點我！', '嗨～', '彈跳力 99', '要喝咖啡嗎？', '按 / 試試看', '再一次！', '我在葡萄王上班', '看看我的作品！'];
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
      const on = !reduce && !document.hidden && (root.dataset.theme === 'hacker' || isFull);
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
    if (t.dataset.app) { closeMenus(); openApp(t.dataset.app); return; }
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
    i.addEventListener('dblclick', () => openApp(i.dataset.app));
    i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); openApp(i.dataset.app); } });
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

  /* ================= 時鐘 ================= */
  const tick = () => { const d = new Date(), s = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); $$('.clock').forEach(c => { c.textContent = s; }); };
  tick(); setInterval(tick, 15000);

  /* ================= 開機 ================= */
  function boot(done) {
    const b = $('#boot'), log = $('#bootLog'), bar = $('#bootBar');
    let seen = false;
    try { seen = sessionStorage.getItem('booted') === '1'; } catch (e) {}
    if (seen || reduce || /[?&]noboot/.test(location.search)) { done(); return; }
    b.hidden = false;
    const L = ['MingAn BIOS v2026.11   (C) 中原大學 CSIE × IM', 'CPU: Brain @ 咖啡因加速 ........ OK', 'Memory: 大一到大四 4 年 ........ OK',
      'Loading jump-daemon (彈跳力 99) . OK', 'Mounting /葡萄王 ............... OK', 'Starting desktop ...'];
    const T = 2600, t0 = performance.now();
    let finished = false;
    function finish() {
      if (finished) return; finished = true;
      try { sessionStorage.setItem('booted', '1'); } catch (e) {}
      b.classList.add('out'); setTimeout(() => { b.hidden = true; done(); }, 350);
      removeEventListener('keydown', finish); b.removeEventListener('pointerdown', finish);
    }
    (function step(now) {
      const p = Math.min(1, (now - t0) / T);
      bar.style.width = p * 100 + '%';
      log.textContent = L.slice(0, Math.ceil(p * L.length)).join('\n');
      if (p < 1 && !finished) requestAnimationFrame(step); else finish();
    })(t0);
    addEventListener('keydown', finish); b.addEventListener('pointerdown', finish);
  }

  /* ================= 啟動 ================= */
  setTheme(root.dataset.theme);
  boot(() => {
    if (!mobile()) { openApp('about'); openApp('terminal'); const t = open.get('terminal');
      if (t) { t.el.style.left = Math.max(260, innerWidth - 620) + 'px'; t.el.style.top = Math.max(60, innerHeight - 460) + 'px'; } focusWin('about'); }
  });

  window.__os = { openApp, closeApp, setTheme, execute, showPalette, jump: () => pet.jump() };
})();
