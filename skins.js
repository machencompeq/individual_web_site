/* 風格切換 · Matrix 程式碼雨 · 可以打字的終端機 */
(function () {
  const $ = s => document.querySelector(s);
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SKINS = ['hacker', 'cyber', 'pop'];
  const site = () => window.__site || {};
  const save = v => { try { localStorage.setItem('skin', v); } catch (e) {} };

  /* ---------------- 風格切換 ---------------- */
  const nameEl = $('#skinName');
  const meta = document.querySelector('meta[name="theme-color"]');
  const THEME = { hacker: '#050806', cyber: '#0d0221', pop: '#fff4e6' };
  function setSkin(s) {
    if (!SKINS.includes(s)) return false;
    root.dataset.skin = s;
    nameEl.textContent = s;
    if (meta) meta.content = THEME[s];
    save(s);
    matrixToggle();
    return true;
  }
  $('#skinBtn').addEventListener('click', () => {
    const next = SKINS[(SKINS.indexOf(root.dataset.skin) + 1) % SKINS.length];
    setSkin(next);
    site().say && site().say('風格切換：' + next);
  });
  nameEl.textContent = root.dataset.skin;

  /* ---------------- Matrix 程式碼雨 ---------------- */
  const cv = $('#matrix');
  const g = cv.getContext('2d');
  const glyphs = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789陳洺安資工管{}<>/=+*#$';
  let cols = [], fs = 16, raf = 0, heroVisible = true, full = false, last = 0;
  function size() {
    const r = full ? { width: innerWidth, height: innerHeight } : cv.parentElement.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = r.width * dpr; cv.height = r.height * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    fs = r.width < 600 ? 13 : 16;
    cols = Array.from({ length: Math.ceil(r.width / fs) }, () => Math.random() * -50);
    g.fillStyle = '#050806'; g.fillRect(0, 0, r.width, r.height);
  }
  function draw(now) {
    raf = requestAnimationFrame(draw);
    if (now - last < 50) return;
    last = now;
    const w = cv.width / Math.min(devicePixelRatio || 1, 2), h = cv.height / Math.min(devicePixelRatio || 1, 2);
    g.fillStyle = 'rgba(5, 8, 6, .12)';
    g.fillRect(0, 0, w, h);
    g.font = `${fs}px "JetBrains Mono", monospace`;
    cols.forEach((y, i) => {
      const ch = glyphs[(Math.random() * glyphs.length) | 0];
      g.fillStyle = Math.random() < .04 ? '#eafff1' : '#39ff88';
      g.fillText(ch, i * fs, y * fs);
      cols[i] = y * fs > h && Math.random() > .975 ? 0 : y + 1;
    });
  }
  function matrixToggle() {
    const on = !reduce && (full || (root.dataset.skin === 'hacker' && heroVisible));
    if (on && !raf) { size(); raf = requestAnimationFrame(draw); }
    if (!on && raf) { cancelAnimationFrame(raf); raf = 0; }
  }
  new IntersectionObserver(es => { heroVisible = es[0].isIntersecting; matrixToggle(); }).observe(cv.parentElement);
  addEventListener('resize', () => { if (raf) size(); });
  function matrixFull(sec = 7) {
    if (reduce) return;
    full = true; cv.classList.add('full'); size(); matrixToggle();
    setTimeout(() => { full = false; cv.classList.remove('full'); if (raf) size(); matrixToggle(); }, sec * 1000);
  }
  matrixToggle();

  /* ---------------- 終端機 ---------------- */
  const out = $('#termOut'), form = $('#termForm'), input = $('#termIn');
  const hist = []; let hi = 0;
  const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function print(html, cls) {
    const d = document.createElement('div');
    if (cls) d.className = cls;
    d.innerHTML = html;
    out.appendChild(d);
    out.scrollTop = out.scrollHeight;
  }
  function typeLines(lines, i = 0) {
    if (i >= lines.length) return;
    print(lines[i][0], lines[i][1]);
    setTimeout(() => typeLines(lines, i + 1), reduce ? 0 : 70);
  }
  const go = id => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); };

  const CMDS = {
    help: () => [
      ['可以用的指令：', 'hl'],
      ['  whoami      我是誰'], ['  about       基本資料'], ['  skills      技能'], ['  jobs        工作經歷'],
      ['  projects    程式作品'], ['  awards      獎狀與證照'], ['  contact     聯絡方式'],
      ['  skin <名稱>  換風格：hacker · cyber · pop'], ['  matrix      駭客任務模式'], ['  jump        讓我跳一下'],
      ['  grapes      下葡萄雨'], ['  goto <區塊>  跳到：card toys road now album awards projects hello'],
      ['  clear       清空畫面'], ['（還有一些隱藏指令，自己找找看）', 'dim'],
    ],
    whoami: () => [['陳洺安 Ming-An Chen', 'ok'], ['中原大學 資訊工程（雙主修資訊管理）畢業 · 現在在葡萄王'], ['會寫程式、會導覽、會做咖啡，還會跳很高。', 'dim']],
    about: () => [['name      陳洺安 Ming-An Chen'], ['born      2001-10-30'], ['school    中原大學 CSIE × IM'], ['now       葡萄王'], ['hobbies   旅遊、看短影音、看夕陽'], ['motto     心中的火焰比任何風暴都更持久。', 'hl']],
    skills: () => [['[程式]  C/C++ ██████████ Java ████████ Verilog ███████ HTML/CSS ███████', 'ok'], ['[其他]  商業經濟預測分析 · 證券分析 · 系統分析', 'hl'], ['[人]    導覽解說 · 門市銷售 · 咖啡吧檯', 'dim']],
    jobs: () => [['[1] 運動精品店員'], ['[2] 經濟學助教／課業守護'], ['[3] 物流場'], ['[4] 葡萄王 · 門市銷售、導覽、咖啡吧', 'ok']],
    projects: () => { setTimeout(() => go('projects'), 600); return [['two_three_tree.cpp   2-3 Tree（C++）'], ['heap.cpp             Heap／Priority Queue（C++）'], ['codefest_2023/       台北城市儀表板大黑客松'], ['econ_forecast.pdf    商業經濟預測期末報告'], ['→ 帶你過去…', 'dim']]; },
    awards: () => { setTimeout(() => go('awards'), 600); return [['書卷獎 · 企資通 · 資料結構 · PBL · 貿易理論'], ['黑客松 · 義工服務 · 市長獎'], ['英檢 · Java SE 7 ×2 · CWT 全民中檢'], ['→ 帶你過去…', 'dim']]; },
    contact: () => [['email     asd0389wsx0216@gmail.com', 'ok'], ['phone     0978-581-189'], ['github    <a href="https://github.com/minggg1030" target="_blank" rel="noopener">github.com/minggg1030</a>'], ['ig        <a href="https://www.instagram.com/andy__901030/" target="_blank" rel="noopener">@andy__901030</a>'], ['輸入 sudo hire mingan 直接複製 Email', 'dim']],
    social: () => CMDS.contact(),
    skin: a => {
      if (!a) return [['目前風格：' + root.dataset.skin], ['用法：skin hacker | skin cyber | skin pop', 'dim']];
      return setSkin(a) ? [['風格已切換成 ' + a, 'ok']] : [['沒有這個風格：' + esc(a) + '（可用：hacker cyber pop）', 'err']];
    },
    matrix: () => { matrixFull(7); return [['Wake up, Ming-An...', 'ok'], ['The Matrix has you.', 'dim']]; },
    jump: () => { go('hi'); setTimeout(() => site().jump && site().jump(), 500); return [['起跳！', 'ok']]; },
    grapes: () => { site().rain && site().rain(120); return [['葡萄雨開始～', 'ok']]; },
    goto: a => { if (!a || !document.getElementById(a)) return [['用法：goto card | toys | road | now | album | awards | projects | hello', 'dim']]; go(a); return [['→ ' + esc(a), 'dim']]; },
    ls: () => [['about.md  skills.txt  jobs.log  projects/  awards/  album/  motto.txt  .secret'], ['（試試 cat motto.txt）', 'dim']],
    cat: a => {
      if (a === 'motto.txt') return [['心中的火焰比任何風暴都更持久。', 'hl']];
      if (a === '.secret') return [['恭喜找到！試試 sudo make coffee 或 Konami 秘技 ↑↑↓↓←→←→BA', 'ok']];
      if (a === 'about.md') return CMDS.about();
      if (a === 'skills.txt') return CMDS.skills();
      if (a === 'jobs.log') return CMDS.jobs();
      return [['cat: ' + esc(a || '') + ': 找不到這個檔案', 'err']];
    },
    sudo: a => {
      if (a === 'hire mingan') { site().copy && site().copy('asd0389wsx0216@gmail.com', 'Email 已複製，期待你的來信！'); site().rain && site().rain(80); return [['[sudo] 權限通過。Email 已複製到剪貼簿 ✓', 'ok'], ['asd0389wsx0216@gmail.com', 'hl']]; }
      if (a === 'make coffee') return [['沖煮中… 萃取 25 秒… 完成！', 'ok'], ['（洺安在葡萄王的咖啡吧是真的會做喔）', 'dim']];
      if (a && /rm\s+-rf/.test(a)) return [['權限不足，但勇氣可嘉。', 'err']];
      return [['[sudo] 密碼是…才不告訴你。試試 sudo hire mingan', 'dim']];
    },
    date: () => [[new Date().toString()]],
    echo: a => [[esc(a || '')]],
    history: () => hist.map((h, i) => [`${String(i + 1).padStart(3)}  ${esc(h)}`]),
    clear: () => { out.innerHTML = ''; return []; },
    exit: () => [['你走不掉的，往下捲還有很多東西 :)', 'hl']],
    hello: () => [['嗨！很高興認識你', 'ok']],
    coffee: () => CMDS.sudo('make coffee'),
  };
  const NAMES = Object.keys(CMDS);

  function run(line) {
    const raw = line.trim();
    print(`<span class="cmd"><b>mingan@cycu:~$</b> ${esc(raw)}</span>`);
    if (!raw) return;
    hist.push(raw); hi = hist.length;
    const [c, ...rest] = raw.split(/\s+/);
    const fn = CMDS[c.toLowerCase()];
    if (!fn) { print(`zsh: command not found: ${esc(c)}（輸入 help 看指令）`, 'err'); return; }
    typeLines(fn(rest.join(' ')) || []);
  }
  form.addEventListener('submit', e => { e.preventDefault(); run(input.value); input.value = ''; });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') { e.preventDefault(); if (hi > 0) input.value = hist[--hi]; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); hi = Math.min(hist.length, hi + 1); input.value = hist[hi] || ''; }
    else if (e.key === 'Tab') {
      e.preventDefault();
      const v = input.value.trim().toLowerCase();
      const m = NAMES.filter(n => n.startsWith(v));
      if (m.length === 1) input.value = m[0] + ' ';
      else if (m.length > 1) print(m.join('  '), 'dim');
    }
  });
  out.addEventListener('click', () => { if (!getSelection().toString()) input.focus({ preventScroll: true }); });
  document.getElementById('termChips').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    run(b.textContent);
  });

  // 開機畫面
  typeLines([
    ['Booting mingan-os v2026.11 ...', 'dim'],
    ['[ OK ] Mounted /home/mingan', 'ok'],
    ['[ OK ] Loaded coffee.service', 'ok'],
    ['[ OK ] Started jump-daemon (彈跳力 99)', 'ok'],
    ['歡迎！輸入 <span class="hl">help</span> 看看可以做什麼，或點下面的按鈕。'],
  ]);
  window.__term = run;
})();
