/* MingAn OS 的 3D 特效（three.js）
   - FX.wallpaper(theme)   會動的 3D 桌布：XP 草地山丘 / Hacker 程式碼隧道 / Mac 流光
   - FX.bootZoom(theme)    開機時鏡頭飛進 Blender 做的 CRT 螢幕
   - FX.saver.start/stop   螢幕保護程式：鉻金屬 3D「陳洺安」+ 星空曲速
   - FX.showcase(el)       3D 展示.app：轉、縮放、點零件看說明
   - FX.awardsWall(el, awards, onFocus)  3D 獎狀展示牆
   沒有 WebGL 時全部安靜失敗，頁面保留靜態圖片。 */
(function () {
  const FX = window.FX = { ok: false, wallpaper() {}, bootZoom: () => Promise.resolve(false), saver: { start() {}, stop() {}, active: false }, showcase() {}, awardsWall() {} };
  if (!window.THREE || !THREE.GLTFLoader) return;
  try { const c = document.createElement('canvas'); if (!(c.getContext('webgl2') || c.getContext('webgl'))) return; } catch (e) { return; }
  FX.ok = true;
  FX.preload = url => loadGLB(url).catch(() => {});

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = () => Math.min(innerWidth, innerHeight) < 700;
  const DPR = () => Math.min(devicePixelRatio || 1, small() ? 1.5 : 1.75);
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const loader = new THREE.GLTFLoader();
  const cache = {};
  function loadGLB(url) {
    if (cache[url]) return cache[url];
    cache[url] = new Promise((res, rej) => {
      const emb = window.GLB_DATA && window.GLB_DATA[url];
      if (emb) {
        const bin = atob(emb), buf = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
        loader.parse(buf.buffer, '', res, rej);
      } else loader.load(url, res, undefined, rej);
    });
    return cache[url];
  }
  function makeRenderer(canvas, alpha = true) {
    const r = new THREE.WebGLRenderer({ canvas, antialias: !small(), alpha, powerPreference: 'high-performance' });
    r.setPixelRatio(DPR());
    r.outputEncoding = THREE.sRGBEncoding;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    return r;
  }
  // 環境貼圖：讓金屬有東西可以反射
  function envFor(renderer, colors = ['#ff5fa2', '#ffb347', '#5ad6ff', '#8b5cff']) {
    const s = new THREE.Scene();
    const geo = new THREE.SphereGeometry(10, 32, 16);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: { a: { value: new THREE.Color(colors[0]) }, b: { value: new THREE.Color(colors[1]) }, c: { value: new THREE.Color(colors[2]) }, d: { value: new THREE.Color(colors[3]) } },
      vertexShader: 'varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
      fragmentShader: 'uniform vec3 a,b,c,d; varying vec3 p; void main(){ float t = p.y*.5+.5; vec3 col = mix(mix(d,c,smoothstep(0.,.45,t)), mix(b,a,smoothstep(.55,1.,t)), smoothstep(.4,.6,t)); col += vec3(1.)*pow(max(0.,sin(p.x*6.)*sin(p.z*6.)),12.)*2.; gl_FragColor = vec4(col,1.); }',
    });
    s.add(new THREE.Mesh(geo, mat));
    const pm = new THREE.PMREMGenerator(renderer);
    const tex = pm.fromScene(s, 0.02).texture;
    pm.dispose();
    return tex;
  }
  function onResize(fn) { let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fn, 120); }); }

  /* =========================================================
     1. 會動的 3D 桌布
     ========================================================= */
  const wall = (() => {
    const canvas = document.getElementById('wallGL');
    if (!canvas) return { set() {} };
    let renderer = null, current = null, raf = 0, theme = null;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    addEventListener('pointermove', e => { mouse.tx = e.clientX / innerWidth - .5; mouse.ty = e.clientY / innerHeight - .5; }, { passive: true });
    function ensure() {
      if (renderer) return renderer;
      renderer = makeRenderer(canvas, false);
      try {
        const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
        const name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
        FX.lowGPU = /swiftshader|llvmpipe|software|mesa offscreen/i.test(name);
      } catch (e) {}
      if (/[?&]hq/.test(location.search)) FX.lowGPU = false; // 強制高畫質（截圖用）
      if (FX.lowGPU) renderer.setPixelRatio(1);
      renderer.setSize(innerWidth, innerHeight, false);
      onResize(() => { renderer.setPixelRatio(DPR()); renderer.setSize(innerWidth, innerHeight, false); current && current.resize(); });
      return renderer;
    }

    /* ----- XP：草地山丘 ----- */
    function hillScene() {
      const r = ensure();
      const scene = new THREE.Scene();
      const horizon = new THREE.Color('#bfe0fb');
      scene.fog = new THREE.Fog(horizon, 60, 230);
      const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, .1, 600);
      const H = (x, z) => 11 * Math.exp(-((x + 10) ** 2) / 1400 - ((z + 40) ** 2) / 700) + 5 * Math.exp(-((x - 45) ** 2) / 600 - ((z + 70) ** 2) / 500) + .35 * Math.sin(x * .18) * Math.cos(z * .15);
      // 天空
      const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false, fog: false,
        uniforms: { top: { value: new THREE.Color('#0f52d3') }, mid: { value: new THREE.Color('#4f93ec') }, bot: { value: horizon } },
        vertexShader: 'varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
        fragmentShader: 'uniform vec3 top,mid,bot; varying float h; void main(){ vec3 c = h>0.08 ? mix(mid,top,smoothstep(.08,.55,h)) : mix(bot,mid,smoothstep(-.05,.08,h)); gl_FragColor=vec4(c,1.); }',
      }));
      scene.add(sky);
      // 雲：畫在 canvas 上的柔軟雲朵
      const cloudTex = (() => {
        const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
        for (let i = 0; i < 26; i++) {
          const x = 120 + Math.random() * 270, y = 120 + Math.random() * 50 - (Math.abs(x - 256) < 90 ? 30 : 0), rr = 40 + Math.random() * 55;
          const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
          g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill();
        }
        const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
      })();
      const clouds = [];
      for (let i = 0; i < 14; i++) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, fog: false, opacity: .9 }));
        const s = 40 + Math.random() * 50; sp.scale.set(s * 2, s, 1);
        sp.position.set(-220 + Math.random() * 440, 30 + Math.random() * 45, -180 - Math.random() * 120);
        sp.userData.v = .6 + Math.random() * 1.2; scene.add(sp); clouds.push(sp);
      }
      // 地面
      const ground = new THREE.PlaneGeometry(420, 260, 140, 90);
      ground.rotateX(-Math.PI / 2);
      const pos = ground.attributes.position, cols = [];
      const c1 = new THREE.Color('#1f7a14'), c2 = new THREE.Color('#5cbf24'), tmp = new THREE.Color();
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i) - 60; pos.setZ(i, z);
        const h = H(x, z); pos.setY(i, h);
        tmp.copy(c1).lerp(c2, Math.min(1, Math.max(0, h / 10 + .2 + Math.sin(x * .3) * .05))); cols.push(tmp.r, tmp.g, tmp.b);
      }
      ground.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      ground.computeVertexNormals();
      scene.add(new THREE.Mesh(ground, new THREE.MeshLambertMaterial({ vertexColors: true })));
      // 草：InstancedMesh + 風的 shader
      const N = FX.lowGPU ? 4000 : small() ? 22000 : 70000;
      const blade = new THREE.PlaneGeometry(.12, 1, 1, 4); blade.translate(0, .5, 0);
      const grassMat = new THREE.ShaderMaterial({
        side: THREE.DoubleSide, fog: true,
        uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { time: { value: 0 }, base: { value: new THREE.Color('#1d6b10') }, tip: { value: new THREE.Color('#9be35a') } }]),
        vertexShader: `uniform float time; varying float vy; varying vec3 vc;
          #include <fog_pars_vertex>
          void main(){
            vy = position.y;
            vec4 wp = instanceMatrix * vec4(position, 1.);
            float w = sin(time*1.6 + wp.x*.25 + wp.z*.18) * .5 + sin(time*3.1 + wp.x*.9) * .12;
            float gust = .6 + .4 * sin(time*.35 + wp.x*.02);
            wp.x += w * vy * vy * .55 * gust; wp.z += w * vy * vy * .25 * gust;
            vec4 mvPosition = viewMatrix * wp;
            gl_Position = projectionMatrix * mvPosition;
            vc = vec3(instanceMatrix[3].x, 0., instanceMatrix[3].z);
            #include <fog_vertex>
          }`,
        fragmentShader: `uniform vec3 base, tip; varying float vy; varying vec3 vc;
          #include <fog_pars_fragment>
          void main(){ vec3 c = mix(base, tip, vy) * (.85 + .15*sin(vc.x*.7+vc.z*.5)); gl_FragColor = vec4(c, 1.);
            #include <fog_fragment>
          }`,
      });
      const grass = new THREE.InstancedMesh(blade, grassMat, N);
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), p = new THREE.Vector3();
      for (let i = 0; i < N; i++) {
        const z = 20 - Math.pow(Math.random(), 1.35) * 120, x = (Math.random() - .5) * (60 + (20 - z) * 1.9);
        const y = H(x, z) - .05;
        e.set((Math.random() - .5) * .3, Math.random() * Math.PI, (Math.random() - .5) * .3); q.setFromEuler(e);
        const s = .45 + Math.random() * .5; sc.set(s * 1.3, s * (.7 + Math.random() * .8), s);
        p.set(x, y, z); m4.compose(p, q, sc); grass.setMatrixAt(i, m4);
      }
      scene.add(grass);
      scene.add(new THREE.HemisphereLight('#dff1ff', '#2c5a12', 1.0));
      const sun = new THREE.DirectionalLight('#fff6e0', 1.4); sun.position.set(-40, 60, 30); scene.add(sun);
      const base = new THREE.Vector3(0, 5.2, 36);
      function resize() { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
      resize();
      return {
        resize,
        degrade() { if (grass.count > 4000) { grass.count = Math.floor(grass.count / 2); return true; } return false; },
        frame(t) {
          grassMat.uniforms.time.value = t;
          clouds.forEach(c => { c.position.x += c.userData.v * .02; if (c.position.x > 240) c.position.x = -240; });
          camera.position.set(base.x + mouse.x * 4, base.y - mouse.y * 1.2, base.z);
          camera.lookAt(mouse.x * 2, 7 - mouse.y * 1.5, -70);
          r.render(scene, camera);
        },
        dispose() { scene.traverse(o => { o.geometry && o.geometry.dispose(); o.material && o.material.dispose && o.material.dispose(); }); cloudTex.dispose(); },
      };
    }

    /* ----- Hacker：3D 程式碼隧道 ----- */
    function tunnelScene() {
      const r = ensure();
      const scene = new THREE.Scene(); scene.background = new THREE.Color('#020604');
      const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, .1, 300);
      const chars = 'アイウエオカキクケコサシスセソタチツテト0123456789陳洺安資工管{}<>/=+*#$ABCDEF';
      const G = 8, atlas = document.createElement('canvas'); atlas.width = atlas.height = 512;
      const g = atlas.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 512, 512);
      g.font = 'bold 48px "JetBrains Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
      for (let i = 0; i < G * G; i++) g.fillText(chars[i % chars.length], (i % G) * 64 + 32, Math.floor(i / G) * 64 + 34);
      const tex = new THREE.CanvasTexture(atlas);
      const N = FX.lowGPU ? 2500 : small() ? 5000 : 12000, L = 220;
      const geo = new THREE.BufferGeometry();
      const P = new Float32Array(N * 3), ID = new Float32Array(N), SP = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        const a = Math.random() * Math.PI * 2, rad = 7 + Math.random() * 6;
        P[i * 3] = Math.cos(a) * rad; P[i * 3 + 1] = Math.sin(a) * rad; P[i * 3 + 2] = -Math.random() * L;
        ID[i] = Math.floor(Math.random() * G * G); SP[i] = Math.random();
      }
      geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
      geo.setAttribute('gid', new THREE.BufferAttribute(ID, 1));
      geo.setAttribute('seed', new THREE.BufferAttribute(SP, 1));
      const mat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { atlas: { value: tex }, time: { value: 0 }, L: { value: L }, px: { value: DPR() } },
        vertexShader: `attribute float gid; attribute float seed; uniform float time, L, px; varying float vId; varying float vB; varying float vDepth;
          void main(){
            vec3 p = position; p.z = mod(p.z + time * (14. + seed*10.), L) - L + 4.;
            float swirl = time*.08 + p.z*.012; mat2 rot = mat2(cos(swirl),-sin(swirl),sin(swirl),cos(swirl)); p.xy = rot * p.xy;
            vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
            gl_PointSize = 26. * px * (10. / -mv.z);
            vId = floor(mod(gid + floor(time*(2.+seed*6.)), 64.)); vB = .45 + .55*step(.93, fract(seed*13.7 + time*.4)); vDepth = -mv.z;
          }`,
        fragmentShader: `uniform sampler2D atlas; varying float vId; varying float vB; varying float vDepth;
          void main(){
            vec2 cell = vec2(mod(vId, 8.), floor(vId / 8.)); vec2 uv = (cell + vec2(gl_PointCoord.x, gl_PointCoord.y)) / 8.;
            float a = texture2D(atlas, vec2(uv.x, 1. - uv.y)).r;
            float fade = smoothstep(200., 20., vDepth) * smoothstep(1., 6., vDepth);
            vec3 c = mix(vec3(.15,1.,.5), vec3(.85,1.,.9), step(.99, vB));
            gl_FragColor = vec4(c * vB, a * fade);
          }`,
      });
      scene.add(new THREE.Points(geo, mat));
      function resize() { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); mat.uniforms.px.value = DPR(); }
      resize();
      return {
        resize,
        frame(t) {
          mat.uniforms.time.value = t;
          camera.position.set(mouse.x * 3, -mouse.y * 3, 0);
          camera.rotation.z = Math.sin(t * .15) * .15;
          camera.lookAt(mouse.x * 6, -mouse.y * 6, -50);
          r.render(scene, camera);
        },
        dispose() { geo.dispose(); mat.dispose(); tex.dispose(); },
      };
    }

    /* ----- Mac：流動的光帶 ----- */
    function aquaScene() {
      const r = ensure();
      const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const mat = new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 }, res: { value: new THREE.Vector2(innerWidth, innerHeight) }, m: { value: new THREE.Vector2() } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = position.xy*.5+.5; gl_Position = vec4(position.xy,0.,1.); }',
        fragmentShader: `uniform float time; uniform vec2 res, m; varying vec2 vUv;
          void main(){
            vec2 p = vUv; p.x *= res.x / res.y;
            vec3 col = mix(vec3(.02,.14,.42), vec3(.08,.42,.85), vUv.y);
            for (int i = 0; i < 5; i++) {
              float fi = float(i);
              float y = .42 + .08*fi*.35 + .13*sin(p.x*(1.1+fi*.23) + time*(.25+fi*.07) + fi*1.7 + m.x*1.5) + .05*sin(p.x*3.3 - time*.4 + fi);
              float d = abs(vUv.y - y);
              float w = .012 + .02*fi*.4;
              col += vec3(.55,.85,1.) * (w / (d + w)) * .22 * (1. - fi*.12);
              col += vec3(.9,.97,1.) * smoothstep(.006, 0., d) * .35;
            }
            col += vec3(.2,.45,.9) * pow(1. - abs(vUv.x - .5 - m.x*.2)*1.4, 3.) * .15;
            gl_FragColor = vec4(col, 1.);
          }`,
      });
      scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
      function resize() { mat.uniforms.res.value.set(innerWidth, innerHeight); }
      return {
        resize,
        frame(t) { mat.uniforms.time.value = t; mat.uniforms.m.value.set(mouse.x, mouse.y); r.render(scene, camera); },
        dispose() { mat.dispose(); },
      };
    }

    // XP 用原本的靜態綠色山丘桌布（不做 3D 草）；Hacker、Mac 才有會動的桌布
    const BUILD = { hacker: tunnelScene, mac: aquaScene };
    const t0 = performance.now();
    let paused = false, lastT = 0;
    let slow = 0, frames = 0, minGap = 0;
    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (paused || !current) return;
      const gap = Math.max(FX.lowGPU ? 66 : small() ? 30 : 0, minGap);
      if (now - lastT < gap) return; // 手機約 30fps，慢的機器更低
      const dt = now - lastT;
      lastT = now;
      if (++frames > 10 && dt > (gap || 16) * 2.6) { if (++slow > 12) { slow = 0; adapt(); } } else slow = Math.max(0, slow - 1);
      mouse.x += (mouse.tx - mouse.x) * .04; mouse.y += (mouse.ty - mouse.y) * .04;
      current.frame((now - t0) / 1000);
    }
    function adapt() {
      if (current && current.degrade && current.degrade()) return;
      if (renderer.getPixelRatio() > 1) { renderer.setPixelRatio(1); renderer.setSize(innerWidth, innerHeight, false); return; }
      minGap = Math.min(100, minGap + 33);
    }
    function set(th) {
      theme = th;
      if (current) { current.dispose(); current = null; }
      document.getElementById('os').classList.remove('gl-wall');
      if (!BUILD[th]) return;
      try { current = BUILD[th](); } catch (err) { console.warn('wallpaper', err); current = null; return; }
      current.frame((performance.now() - t0) / 1000);
      requestAnimationFrame(() => document.getElementById('os').classList.add('gl-wall'));
      if (!raf && !reduce) raf = requestAnimationFrame(loop);
    }
    document.addEventListener('visibilitychange', () => { paused = document.hidden; });
    return { set, pause(v) { paused = v; }, get theme() { return theme; } };
  })();
  FX.wallpaper = th => wall.set(th);
  FX.pauseWallpaper = v => wall.pause(v);

  /* =========================================================
     2. 開機：鏡頭飛進 CRT 螢幕
     ========================================================= */
  const WALL_IMG = { xp: './assets/wall/wall_hill.jpg', mac: './assets/wall/wall_aqua.jpg' };
  FX.bootZoom = theme => new Promise(resolve => {
    const box = document.getElementById('boot3d');
    if (!box || reduce) return resolve(false);
    let done = false;
    const finish = ok => { if (done) return; done = true; resolve(ok); };
    const timeout = setTimeout(() => finish(false), 4000); // 模型太慢就不等
    Promise.all([loadGLB('./assets/3d/desk.glb'), new Promise(r => {
      if (!WALL_IMG[theme]) return r(null);
      const im = new Image(); im.onload = () => r(im); im.onerror = () => r(null); im.src = WALL_IMG[theme];
    })]).then(([gltf, img]) => {
      if (done) return;
      clearTimeout(timeout);
      const canvas = document.createElement('canvas'); box.innerHTML = ''; box.appendChild(canvas);
      box.hidden = false;
      const r = makeRenderer(canvas, false); r.setSize(innerWidth, innerHeight, false);
      const scene = new THREE.Scene(); scene.background = new THREE.Color('#000');
      const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, .05, 100);
      scene.add(new THREE.HemisphereLight('#ffe8d0', '#100804', .9));
      const key = new THREE.DirectionalLight('#ffd2a0', 1.6); key.position.set(-4, 6, 5); scene.add(key);
      const rim = new THREE.DirectionalLight('#6fe3d6', .8); rim.position.set(5, 3, -4); scene.add(rim);
      // 螢幕畫面 = 縮小版桌面
      const sc = document.createElement('canvas'); sc.width = 1040; sc.height = 768; const g = sc.getContext('2d');
      const bg = { win98: '#008080', hacker: '#050806' }[theme] || '#245edb';
      g.fillStyle = bg; g.fillRect(0, 0, 1040, 768);
      if (img) g.drawImage(img, 0, 0, 1040, 768);
      g.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 6; i++) g.fillRect(28, 28 + i * 92, 56, 56);
      g.fillStyle = theme === 'hacker' ? '#39ff88' : 'rgba(255,255,255,.85)'; g.font = '900 120px "Noto Sans TC", sans-serif'; g.textAlign = 'right';
      g.fillText('陳洺安', 1000, 640);
      g.fillStyle = theme === 'xp' ? '#245edb' : theme === 'win98' ? '#c0c0c0' : 'rgba(0,0,0,.45)'; g.fillRect(0, 728, 1040, 40);
      const stex = new THREE.CanvasTexture(sc); stex.flipY = false; stex.encoding = THREE.sRGBEncoding;
      const model = gltf.scene.clone(true);
      let screen = null;
      model.traverse(o => { if (o.isMesh && o.name === 'Screen') { screen = o; o.material = new THREE.MeshBasicMaterial({ map: stex, toneMapped: false }); } });
      scene.add(model);
      const box3 = new THREE.Box3().setFromObject(model), center = box3.getCenter(new THREE.Vector3());
      const sb = screen ? new THREE.Box3().setFromObject(screen) : box3;
      const sCenter = sb.getCenter(new THREE.Vector3()), sSize = sb.getSize(new THREE.Vector3());
      const fov = THREE.MathUtils.degToRad(camera.fov);
      const fit = Math.max(sSize.y, sSize.x / camera.aspect);
      const endPos = sCenter.clone().add(new THREE.Vector3(0, 0, (fit / 2) / Math.tan(fov / 2) * .66));
      const size = box3.getSize(new THREE.Vector3()).length();
      const startPos = center.clone().add(new THREE.Vector3(size * .55, size * .32, size * 1.05));
      const look = new THREE.Vector3();
      const T = 1500, t0 = performance.now();
      box.classList.remove('out');
      (function step(now) {
        const k = Math.min(1, (now - t0) / T), e = ease(k);
        camera.position.lerpVectors(startPos, endPos, e);
        look.lerpVectors(center, sCenter, Math.min(1, e * 1.3)); camera.lookAt(look);
        r.render(scene, camera);
        if (k < 1 && !done) requestAnimationFrame(step);
        else {
          box.classList.add('out');
          setTimeout(() => { box.hidden = true; box.classList.remove('out'); r.dispose(); stex.dispose(); box.innerHTML = ''; }, 500);
          finish(true);
        }
      })(t0);
    }).catch(() => finish(false));
  });

  /* =========================================================
     3. 螢幕保護程式
     ========================================================= */
  FX.saver = (() => {
    const box = document.getElementById('saver');
    let r = null, scene, camera, name = null, stars, raf = 0, active = false, vel = new THREE.Vector2(.9, .6), hue = 0, startedAt = 0, onExit = null;
    function build() {
      const canvas = document.createElement('canvas'); box.prepend(canvas);
      r = makeRenderer(canvas, false); r.setSize(innerWidth, innerHeight, false);
      scene = new THREE.Scene(); scene.background = new THREE.Color('#000');
      scene.environment = envFor(r);
      camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, .1, 400); camera.position.set(0, 0, 14);
      scene.add(new THREE.AmbientLight('#ffffff', .3));
      const k = new THREE.DirectionalLight('#ffffff', 1.2); k.position.set(3, 5, 8); scene.add(k);
      // 星空曲速
      const N = 3000, P = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) { P[i * 3] = (Math.random() - .5) * 120; P[i * 3 + 1] = (Math.random() - .5) * 80; P[i * 3 + 2] = -Math.random() * 300; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3));
      stars = new THREE.Points(g, new THREE.PointsMaterial({ color: '#cfe7ff', size: .25, sizeAttenuation: true, transparent: true, opacity: .9 }));
      scene.add(stars);
      loadGLB('./assets/3d/name3d.glb').then(gltf => {
        name = gltf.scene.clone(true);
        const mat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', metalness: 1, roughness: .12, clearcoat: 1, iridescence: .6, iridescenceIOR: 1.6 });
        name.traverse(o => { if (o.isMesh) { o.material = mat; } });
        const b = new THREE.Box3().setFromObject(name), c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3());
        name.position.sub(c); const wrap = new THREE.Group(); wrap.add(name);
        wrap.scale.setScalar(5.2 / s.x); name = wrap; scene.add(name);
      }).catch(() => {});
      onResize(() => { if (!r) return; r.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });
    }
    function frame(now) {
      raf = requestAnimationFrame(frame);
      const t = now / 1000;
      const p = stars.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) { let z = p.getZ(i) + 1.6; if (z > 14) z = -300; p.setZ(i, z); }
      p.needsUpdate = true;
      if (name) {
        // 像 DVD logo 一樣在畫面裡彈來彈去
        const hH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 14, hW = hH * camera.aspect;
        const limX = Math.max(.5, hW - 3), limY = Math.max(.5, hH - 1.3);
        name.position.x += vel.x * .045; name.position.y += vel.y * .045;
        let hit = false;
        if (Math.abs(name.position.x) > limX) { vel.x *= -1; name.position.x = Math.sign(name.position.x) * limX; hit = true; }
        if (Math.abs(name.position.y) > limY) { vel.y *= -1; name.position.y = Math.sign(name.position.y) * limY; hit = true; }
        if (hit) hue = (hue + .17) % 1;
        name.rotation.y = Math.sin(t * .8) * .7; name.rotation.x = Math.sin(t * .6) * .25;
        name.traverse(o => { if (o.isMesh) o.material.color.setHSL(hue, .55, .72); });
      }
      r.render(scene, camera);
    }
    function start(exitCb) {
      if (active || reduce) return;
      active = true; onExit = exitCb; startedAt = performance.now();
      if (!r) build();
      box.hidden = false; requestAnimationFrame(() => box.classList.add('on'));
      wall.pause(true);
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      if (!active) return;
      active = false; cancelAnimationFrame(raf); raf = 0;
      box.classList.remove('on'); setTimeout(() => { if (!active) box.hidden = true; }, 400);
      wall.pause(false);
      onExit && onExit();
    }
    const exit = e => { if (active && performance.now() - startedAt > 600) stop(); };
    ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, exit, { passive: true }));
    return { start, stop, get active() { return active; } };
  })();

  /* =========================================================
     4. 3D 展示.app
     ========================================================= */
  const MODELS = [
    { url: './assets/3d/desk.glb', name: '書桌', parts: [[/^Screen/, 'CRT 螢幕：開機動畫就是飛進這裡'], [/^(Monitor|Bezel|Vent|LED)/, 'CRT 外殼：在 Blender 用方塊加倒角做的'], [/^(Key|Keyboard)/, '鍵盤：48 顆鍵帽，橘色的是 Esc、Enter 和空白鍵'], [/^(Mug|Handle|Coffee)/, '咖啡杯：葡萄王吧檯的日常'], [/^(Pot|Leaf|Soil)/, '盆栽：11 片葉子，角度都是隨機的'], [/^Floppy/, '磁碟片：致敬老電腦'], [/^(Stand|Neck)/, '底座']] },
    { url: './assets/3d/tree23.glb', name: '2-3 Tree', parts: [[/^Root/, '根節點：存 30、60 兩個 key'], [/^[ABC]/, '子節點：比 30 小、介於中間、比 60 大'], [/^E/, '指標：父節點指向 3 個子節點']] },
    { url: './assets/3d/heap.glb', name: 'Heap', parts: [[/^N0/, '堆頂：優先權最高的元素'], [/^N/, '節點：index i 的子節點是 2i+1、2i+2'], [/^E/, '連線：其實程式裡不用指標，只是陣列']] },
    { url: './assets/3d/trophy.glb', name: '獎盃', parts: [[/^(Cup|Handle|Knot|Stem)/, '獎盃：書卷獎、黑客松、市長獎'], [/^(Base|Plate)/, '底座：還有空間刻下一個獎']] },
    { url: './assets/3d/camera.glb', name: '相機', parts: [[/^(Lens|Glass)/, '鏡頭：旅行一定要拍夕陽'], [/^Shutter/, '快門'], [/./, '相機：相簿.app 裡的照片都在這']] },
    { url: './assets/3d/keycaps.glb', name: '鍵帽', parts: [[/./, '鍵帽：C++、</>、{ }，每天都在敲']] },
    { url: './assets/3d/stairs.glb', name: '樓梯', parts: [[/^Flag|^Pole/, '旗子：畢業！'], [/./, '大一到大四，一階一階爬上來']] },
    { url: './assets/3d/envelope.glb', name: '信封', parts: [[/^(Seal|Heart)/, '愛心封蠟 <3'], [/./, '信封：歡迎寫信給我']] },
    { url: './assets/3d/name3d.glb', name: '3D 名字', parts: [[/./, '螢幕保護程式用的 3D 立體字']] },
  ];
  FX.showcase = el => {
    const stageEl = el.querySelector('.show-stage'), list = el.querySelector('.show-list'), label = el.querySelector('.show-label');
    const canvas = document.createElement('canvas'); stageEl.prepend(canvas);
    const r = makeRenderer(canvas, true); r.shadowMap.enabled = true; r.toneMappingExposure = 1.1;
    const scene = new THREE.Scene(); scene.environment = envFor(r, ['#ffffff', '#ffd9b0', '#9ad8ff', '#334']);
    const camera = new THREE.PerspectiveCamera(35, 1, .05, 200);
    scene.add(new THREE.HemisphereLight('#ffffff', '#443322', .6));
    const key = new THREE.DirectionalLight('#fff1dc', 1.4); key.position.set(-4, 7, 5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 }); scene.add(key);
    const rim = new THREE.DirectionalLight('#7fdcff', .9); rim.position.set(5, 3, -5); scene.add(rim);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(30, 64), new THREE.ShadowMaterial({ opacity: .28 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    const pivot = new THREE.Group(); scene.add(pivot);
    let model = null, current = null, yaw = .6, pitch = .25, dist = 8, tDist = 8, vy = 0, idle = 0, radius = 3, focus = new THREE.Vector3(), hl = null, running = true, appear = 1;
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    MODELS.forEach((m, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.textContent = m.name;
      b.addEventListener('click', () => show(i)); list.appendChild(b);
    });
    function show(i) {
      [...list.children].forEach((b, k) => b.classList.toggle('is-on', k === i));
      current = MODELS[i]; label.hidden = true;
      loadGLB(current.url).then(g => {
        if (current !== MODELS[i]) return;
        if (model) pivot.remove(model);
        model = g.scene.clone(true);
        model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.material = o.material.clone(); } });
        const b = new THREE.Box3().setFromObject(model), c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3());
        model.position.set(-c.x, -b.min.y, -c.z);
        pivot.add(model);
        radius = s.length() / 2; focus.set(0, s.y * .45, 0);
        tDist = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * .78; dist = tDist * 1.6; appear = 0;
      });
    }
    function size() { const w = stageEl.clientWidth, h = stageEl.clientHeight; if (!w || !h) return; r.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    new ResizeObserver(size).observe(stageEl);
    // 拖曳旋轉、滾輪/雙指縮放
    const pts = new Map(); let lastPinch = 0, moved = 0;
    canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = 0; idle = 0; });
    canvas.addEventListener('pointermove', e => {
      const p = pts.get(e.pointerId); if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y; moved += Math.abs(dx) + Math.abs(dy);
      if (pts.size === 1) { yaw -= dx * .008; vy = -dx * .008; pitch = Math.min(1.2, Math.max(-.15, pitch + dy * .006)); }
      p.x = e.clientX; p.y = e.clientY;
      if (pts.size === 2) {
        const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (lastPinch) tDist = Math.min(radius * 8, Math.max(radius * 1.2, tDist * lastPinch / d)); lastPinch = d;
      }
    });
    const up = e => {
      pts.delete(e.pointerId); lastPinch = 0;
      if (moved < 6 && model) pick(e);
    };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', e => { pts.delete(e.pointerId); lastPinch = 0; });
    canvas.addEventListener('wheel', e => { e.preventDefault(); tDist = Math.min(radius * 8, Math.max(radius * 1.2, tDist * (1 + e.deltaY * .001))); }, { passive: false });
    function pick(e) {
      const rect = canvas.getBoundingClientRect();
      ndc.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObject(model, true)[0];
      if (hl) { hl.material.emissive && hl.material.emissive.setRGB(0, 0, 0); hl = null; }
      if (!hit) { label.hidden = true; return; }
      let o = hit.object, nm = o.name;
      while (o.parent && o.parent !== model && !nm) { o = o.parent; nm = o.name; }
      nm = hit.object.name || (hit.object.parent && hit.object.parent.name) || '';
      const part = current.parts.find(([re]) => re.test(nm));
      label.textContent = part ? part[1] : nm; label.hidden = false;
      label.style.left = (e.clientX - rect.left) + 'px'; label.style.top = (e.clientY - rect.top) + 'px';
      hl = hit.object; if (hl.material.emissive) hl.material.emissive.setRGB(.35, .25, .05);
    }
    function frame() {
      if (!running) return;
      requestAnimationFrame(frame);
      if (!stageEl.clientWidth) return;
      idle++;
      if (!pts.size) { yaw += vy; vy *= .94; if (idle > 120 && !reduce) yaw += .004; }
      dist += (tDist - dist) * .1; appear = Math.min(1, appear + .04);
      if (model) model.scale.setScalar(.6 + .4 * ease(appear));
      camera.position.set(focus.x + Math.sin(yaw) * Math.cos(pitch) * dist, focus.y + Math.sin(pitch) * dist, focus.z + Math.cos(yaw) * Math.cos(pitch) * dist);
      camera.lookAt(focus);
      if (hl && hl.material.emissive) { const k = .2 + .15 * Math.sin(performance.now() / 150); hl.material.emissive.setRGB(k * 1.5, k, k * .2); }
      r.render(scene, camera);
    }
    el.closest('.win').addEventListener('winclose', () => { running = false; r.dispose(); });
    size(); show(0); requestAnimationFrame(frame);
  };

  /* =========================================================
     5. 3D 獎狀展示牆
     ========================================================= */
  FX.awardsWall = (el, awards, onFocus) => {
    const host = el.querySelector('.wall3d'), cap = el.querySelector('.wall-cap');
    const canvas = document.createElement('canvas'); host.prepend(canvas);
    const r = makeRenderer(canvas, false); r.shadowMap.enabled = true; r.toneMappingExposure = 1.05;
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#1b1714'); scene.fog = new THREE.Fog('#1b1714', 14, 34);
    const camera = new THREE.PerspectiveCamera(42, 1, .05, 100);
    scene.add(new THREE.HemisphereLight('#fff4e6', '#2b1f17', .55));
    const R = 11, n = awards.length, arc = Math.min(Math.PI * 1.3, n * .36);
    // 弧形牆與地板
    const wallGeo = new THREE.CylinderGeometry(R + .25, R + .25, 7, 64, 1, true, Math.PI - arc / 2 - .3, arc + .6);
    const wallM = new THREE.Mesh(wallGeo, new THREE.MeshStandardMaterial({ color: '#e8dfd2', side: THREE.BackSide, roughness: .95 }));
    wallM.position.y = 2.6; wallM.receiveShadow = true; scene.add(wallM);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(R + 1, 64), new THREE.MeshStandardMaterial({ color: '#3a2a1e', roughness: .6, metalness: .1 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -.9; floor.receiveShadow = true; scene.add(floor);
    const tl = new THREE.TextureLoader(), frames = [];
    awards.forEach((a, i) => {
      const ang = Math.PI + (n === 1 ? 0 : (i / (n - 1) - .5) * arc);
      const g = new THREE.Group();
      g.position.set(Math.sin(ang) * R, 2.3 + (i % 2 ? .15 : -.05), Math.cos(ang) * R);
      g.lookAt(0, g.position.y, 0);
      const w = 1.5, h = 2.05;
      const frame = new THREE.Mesh(new THREE.BoxGeometry(w + .16, h + .16, .08), new THREE.MeshStandardMaterial({ color: '#2b2118', metalness: .3, roughness: .5 }));
      frame.castShadow = true; g.add(frame);
      const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .8 });
      const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); pic.position.z = .045; g.add(pic);
      tl.load(a.img, t => {
        t.encoding = THREE.sRGBEncoding; mat.map = t; mat.needsUpdate = true;
        const ar = t.image.width / t.image.height; if (ar > w / h) pic.scale.y = (w / ar) / h; else pic.scale.x = (h * ar) / w;
      });
      const spot = new THREE.SpotLight('#ffe7c2', 1.1, 7, .5, .6, 1.2);
      spot.position.set(0, 2.4, 1.6); spot.target = pic; g.add(spot);
      pic.userData = { i, a }; frames.push({ g, pic, ang });
      scene.add(g);
    });
    let yaw = Math.PI, tYaw = Math.PI, zoom = 0, tZoom = 0, focused = -1, running = true, dragging = false, sx = 0, moved = 0;
    const camPos = new THREE.Vector3(), target = new THREE.Vector3();
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    function size() { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; r.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    new ResizeObserver(size).observe(host);
    function focus(i) {
      focused = i;
      if (i < 0) { tZoom = 0; cap.textContent = '拖曳左右看，點一張飛過去'; onFocus && onFocus(null); return; }
      tYaw = frames[i].ang; tZoom = 1;
      const a = frames[i].pic.userData.a; cap.innerHTML = `<b>${a.title}</b>　${a.text}`; onFocus && onFocus(a);
    }
    canvas.addEventListener('pointerdown', e => { dragging = true; sx = e.clientX; moved = 0; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - sx; sx = e.clientX; moved += Math.abs(dx);
      if (moved > 6 && focused >= 0) focus(-1);
      tYaw = Math.min(Math.PI + arc / 2, Math.max(Math.PI - arc / 2, tYaw + dx * .004));
    });
    canvas.addEventListener('pointerup', e => {
      dragging = false; if (moved > 6) return;
      const rect = canvas.getBoundingClientRect();
      ndc.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(frames.map(f => f.pic))[0];
      if (hit) focus(hit.object.userData.i === focused ? -1 : hit.object.userData.i); else focus(-1);
    });
    canvas.addEventListener('wheel', e => { e.preventDefault(); if (focused >= 0) focus(-1); tYaw = Math.min(Math.PI + arc / 2, Math.max(Math.PI - arc / 2, tYaw + e.deltaY * .002 + e.deltaX * .002)); }, { passive: false });
    el.wallFocus = focus;
    function frame() {
      if (!running) return;
      requestAnimationFrame(frame);
      if (!host.clientWidth) return;
      yaw += (tYaw - yaw) * .08; zoom += (tZoom - zoom) * .08;
      // 鏡頭在圓心附近，看向牆；聚焦時往前飛
      const d = THREE.MathUtils.lerp(0, R - 3.1, ease(zoom));
      camPos.set(Math.sin(yaw) * d, 2.35 + Math.sin(performance.now() / 2400) * .05, Math.cos(yaw) * d);
      camera.position.copy(camPos);
      target.set(Math.sin(yaw) * R, 2.3, Math.cos(yaw) * R);
      camera.lookAt(target);
      r.render(scene, camera);
    }
    el.closest('.win').addEventListener('winclose', () => { running = false; r.dispose(); });
    size(); focus(-1); requestAnimationFrame(frame);
  };
})();
