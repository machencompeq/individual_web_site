document.documentElement.classList.add('js');

// ===== 深色／淺色模式 =====
const root = document.documentElement;
document.getElementById('themeToggle').addEventListener('click', () => {
  const current = root.dataset.theme ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = current === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch (e) {}
});

// ===== 手機選單 =====
const nav = document.getElementById('nav');
const menuBtn = document.getElementById('menuToggle');
menuBtn.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', open);
  menuBtn.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open');
  menuBtn.setAttribute('aria-expanded', 'false');
  menuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
}));

// ===== 捲動：header 陰影、回到頂端按鈕 =====
const header = document.querySelector('.site-header');
const toTop = document.getElementById('toTop');
const onScroll = () => {
  header.classList.toggle('scrolled', scrollY > 8);
  toTop.classList.toggle('show', scrollY > 600);
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();
toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

// ===== 進場動畫 & 導覽列目前區塊 =====
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section[id]').forEach(s => spy.observe(s));
} else {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
}

// ===== 圖片放大（lightbox） =====
const lb = document.getElementById('lightbox');
const lbImg = lb.querySelector('img');
const lbCap = lb.querySelector('.lb-caption');
document.querySelectorAll('.zoom').forEach(btn => btn.addEventListener('click', () => {
  lbImg.src = btn.dataset.src;
  lbImg.alt = btn.dataset.caption || '';
  lbCap.textContent = btn.dataset.caption || '';
  lb.showModal();
}));
lb.querySelector('.lb-close').addEventListener('click', () => lb.close());
lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });

// ===== 程式碼檢視（原始檔為 Big5 編碼） =====
document.querySelectorAll('.code-view').forEach(d => {
  d.addEventListener('toggle', async () => {
    if (!d.open || d.dataset.loaded) return;
    d.dataset.loaded = '1';
    const code = d.querySelector('code');
    try {
      const res = await fetch(d.dataset.src);
      if (!res.ok) throw new Error(res.status);
      const buf = await res.arrayBuffer();
      let text;
      try { text = new TextDecoder('utf-8', { fatal: true }).decode(buf); }
      catch { text = new TextDecoder('big5').decode(buf); }
      code.textContent = text;
    } catch (err) {
      code.innerHTML = '';
      const a = document.createElement('a');
      a.href = d.dataset.src; a.target = '_blank'; a.textContent = '無法載入，點此直接開啟原始檔';
      code.appendChild(a);
      delete d.dataset.loaded;
    }
  });
});

document.getElementById('year').textContent = new Date().getFullYear();
