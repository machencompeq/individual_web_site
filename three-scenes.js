/* 載入 Blender 匯出的 .glb，用 three.js 顯示可互動的 3D。
   失敗時（沒有 WebGL、離線）保留原本的 Blender 渲染圖，頁面一樣完整。 */
(function () {
  if (!window.THREE || !THREE.GLTFLoader) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loader = new THREE.GLTFLoader();

  function webglOK() {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch (e) { return false; }
  }
  if (!webglOK()) return;

  /* ---------- CRT 螢幕上的終端機動畫 ---------- */
  function makeTerminal() {
    const W = 640, H = 480;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    const script = [
      ['$ whoami', 'ming-an.chen  // CSIE x IM'],
      ['$ cat skills.txt', 'C/C++  Java  Verilog  HTML/CSS'],
      ['$ ./two_three_tree --insert 42', 'ok. height = 3  (binary tree: 6)'],
      ['$ sudo make coffee', 'brewing... ☕  done.'],
      ['$ echo $MOTTO', 'the fire inside lasts longer', 'than any storm.'],
    ];
    const lines = [];
    let si = 0, typing = '', target = script[0][0], outQueue = [], t = 0;
    const tex = new THREE.CanvasTexture(cv);
    tex.flipY = false;
    tex.encoding = THREE.sRGBEncoding;

    function draw(cursorOn) {
      g.fillStyle = '#1e0d00';
      g.fillRect(0, 0, W, H);
      const grd = g.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.7);
      grd.addColorStop(0, 'rgba(255,150,30,0.10)');
      grd.addColorStop(1, 'rgba(0,0,0,0.35)');
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      g.font = '700 31px "JetBrains Mono", monospace';
      g.textBaseline = 'top';
      g.shadowColor = 'rgba(255,160,40,0.9)';
      g.shadowBlur = 10;
      const all = lines.concat([{ text: typing, cmd: true, live: true }]);
      const start = Math.max(0, all.length - 10);
      all.slice(start).forEach((ln, i) => {
        g.fillStyle = ln.cmd ? '#ffb020' : '#ffd9a0';
        g.fillText(ln.text, 34, 30 + i * 43);
        if (ln.live && cursorOn) {
          const w = g.measureText(ln.text).width;
          g.fillRect(38 + w, 32 + i * 43, 17, 31);
        }
      });
      g.shadowBlur = 0;
      g.fillStyle = 'rgba(0,0,0,0.28)';
      for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 2);
      tex.needsUpdate = true;
    }

    function step(dt) {
      t += dt;
      if (t < 0.07) return;
      t = 0;
      if (outQueue.length) {
        lines.push({ text: outQueue.shift(), cmd: false });
      } else if (typing.length < target.length) {
        typing = target.slice(0, typing.length + 1);
      } else {
        lines.push({ text: typing, cmd: true });
        outQueue = script[si].slice(1);
        si = (si + 1) % script.length;
        if (si === 0) outQueue.push('');
        typing = '';
        target = script[si][0];
        t = -0.8;
      }
      if (lines.length > 40) lines.splice(0, lines.length - 40);
    }
    for (let i = 0; i < 120; i++) step(0.08);  // 先跑一段，螢幕一開始就有內容
    draw(true);
    return { tex, update(dt, time) { step(dt); draw(Math.floor(time * 2) % 2 === 0); } };
  }

  /* ---------- 通用 3D 舞台 ---------- */
  function Stage(el) {
    const kind = el.dataset.kind;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    scene.add(new THREE.HemisphereLight(0xffe0bd, 0x140b05, 0.75));
    const key = new THREE.DirectionalLight(0xffc48a, 1.9);
    key.position.set(-4, 6, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.radius = 6;
    Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 0.5, far: 30 });
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x6fe3d6, 1.1);
    rim.position.set(5, 3, -4);
    scene.add(rim);
    const glow = new THREE.PointLight(0xff9a2a, 0, 6);
    scene.add(glow);

    const pivot = new THREE.Group();
    scene.add(pivot);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.38 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;

    let terminal = null, ready = false, visible = false, raf = 0, last = 0;
    let rotY = kind === 'desk' ? -0.35 : 0, velY = 0, dragging = false, px = 0;
    let tiltX = 0, tiltY = 0, mx = 0, my = 0;

    const onLoad = gltf => {
      const root = gltf.scene;
      root.traverse(o => {
        if (!o.isMesh) return;
        o.castShadow = true;
        o.receiveShadow = true;
        if (o.name === 'Screen' || (o.parent && o.parent.name === 'Screen')) {
          terminal = makeTerminal();
          o.material = new THREE.MeshBasicMaterial({ map: terminal.tex, toneMapped: false });
          glow.intensity = 1.4;
        }
      });
      // 置中並把底部放在地面
      const box = new THREE.Box3().setFromObject(root);
      const c = box.getCenter(new THREE.Vector3());
      root.position.set(-c.x, -box.min.y, -c.z);
      pivot.add(root);
      pivot.add(ground);
      const size = box.getSize(new THREE.Vector3());
      const radius = size.length() / 2;
      const dir = kind === 'desk' ? new THREE.Vector3(0.12, 0.42, 1) : new THREE.Vector3(0.18, 0.3, 1);
      dir.normalize();
      const dist = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * (kind === 'desk' ? 0.98 : 0.9);
      const target = new THREE.Vector3(0, size.y * (kind === 'desk' ? 0.42 : 0.5), 0);
      camera.position.copy(target).addScaledVector(dir, dist);
      camera.lookAt(target);
      glow.position.set(0, size.y * 0.55, size.z * 0.6);
      ready = true;
      resize();
      renderOnce();
      el.classList.add('is-3d');
      if (visible) start();
    };
    const onError = () => { /* 載入失敗就保留渲染圖 */ };
    const embedded = window.GLB_DATA && window.GLB_DATA[el.dataset.model];
    if (embedded) {
      // 內嵌的模型（base64），給不能放 .glb 的環境用
      const bin = atob(embedded), buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      loader.parse(buf.buffer, '', onLoad, onError);
    } else {
      loader.load(el.dataset.model, onLoad, undefined, onError);
    }

    function resize() {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderOnce();
    }
    function renderOnce() { if (ready) renderer.render(scene, camera); }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      const t = now / 1000;
      if (!dragging) {
        velY *= 0.94;
        rotY += velY;
        if (kind === 'spin' && !reduce) rotY += dt * 0.35;
        if (kind === 'desk' && !reduce) rotY += (-0.35 + Math.sin(t * 0.4) * 0.12 - rotY) * 0.02;
      }
      tiltX += (my * 0.12 - tiltX) * 0.06;
      tiltY += (mx * 0.25 - tiltY) * 0.06;
      pivot.rotation.y = rotY + (kind === 'desk' ? tiltY : 0);
      pivot.rotation.x = kind === 'desk' ? tiltX * 0.5 : 0;
      if (!reduce) pivot.position.y = Math.sin(t * 1.2) * 0.04;
      if (terminal) terminal.update(dt, t);
      renderer.render(scene, camera);
    }
    function start() { if (!raf && ready) { last = performance.now(); raf = requestAnimationFrame(frame); } }
    function stop() { cancelAnimationFrame(raf); raf = 0; }

    // 拖曳旋轉
    const cv = renderer.domElement;
    cv.addEventListener('pointerdown', e => { dragging = true; px = e.clientX; velY = 0; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', e => {
      if (!dragging) return;
      const d = (e.clientX - px) / el.clientWidth * 4;
      rotY += d; velY = d * 0.5; px = e.clientX;
    });
    const up = () => { dragging = false; };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    if (kind === 'desk') {
      addEventListener('pointermove', e => {
        mx = e.clientX / innerWidth - 0.5;
        my = e.clientY / innerHeight - 0.5;
      }, { passive: true });
    }

    new ResizeObserver(resize).observe(el);
    new IntersectionObserver(es => {
      visible = es[0].isIntersecting && !document.hidden;
      visible ? start() : stop();
    }, { rootMargin: '100px' }).observe(el);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (visible) start(); });
  }

  // 依序初始化：先 hero，其他等捲到附近再載入
  const stages = [...document.querySelectorAll('.stage[data-model]')];
  const lazy = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      lazy.unobserve(e.target);
      Stage(e.target);
    });
  }, { rootMargin: '400px' });
  stages.forEach(s => lazy.observe(s));
})();
