/* Cloud Lab — three side-by-side options for the "software/cloud" state.
   v1: generated 3D mesh (assets/cloud.glb)   v2: clean code-built scene   v3: DOM/SVG component (in HTML) */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const VIOLET = 0x8b5cf6, BLUE = 0x3b82f6, CYAN = 0x5be0ff, PINK = 0xff5ed0;

function softTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}
const SOFT = softTex();

function labelSprite(text, color) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d');
  x.font = 'bold 50px Montserrat, Arial, sans-serif'; x.fillStyle = color || '#dfeaff'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.shadowColor = color || '#9be7ff'; x.shadowBlur = 18; x.fillText(text, 256, 66);
  const tx = new THREE.CanvasTexture(c); tx.minFilter = THREE.LinearFilter;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true, depthWrite: false })); sp.scale.set(1.5, 0.375, 1); return sp;
}
function glow(color, scale, op) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: SOFT, color: new THREE.Color(color), transparent: true, opacity: op == null ? 0.8 : op, blending: THREE.AdditiveBlending, depthWrite: false })); s.scale.setScalar(scale); return s; }

function makeStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x06060f, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100); camera.position.set(0, 0, 6);
  scene.add(new THREE.AmbientLight(0xc7ccff, 1.0));
  const kl = new THREE.DirectionalLight(0xffffff, 2.1); kl.position.set(2, 3, 4); scene.add(kl);
  const fl = new THREE.DirectionalLight(0x8aa0ff, 0.8); fl.position.set(-3, -1, 2); scene.add(fl);
  const frontL = new THREE.DirectionalLight(0xffffff, 1.1); frontL.position.set(0, 0.4, 6); scene.add(frontL);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.8, 0.5, 0.5));
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  canvas.addEventListener('pointermove', function (e) { const r = canvas.getBoundingClientRect(); pointer.tx = (e.clientX - r.left) / r.width - 0.5; pointer.ty = (e.clientY - r.top) / r.height - 0.5; }, { passive: true });
  function resize() { const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); composer.setSize(w, h); }
  let raf = 0, running = false, updater = null, T = 0, last = performance.now();
  function loop() {
    if (!running) return; raf = requestAnimationFrame(loop);
    const now = performance.now(), dt = Math.min((now - last) / 1000, 0.05); last = now; T += dt;
    pointer.x += (pointer.tx - pointer.x) * 0.08; pointer.y += (pointer.ty - pointer.y) * 0.08;
    if (updater) updater(T, dt, pointer);
    composer.render();
  }
  return {
    scene: scene, camera: camera, renderer: renderer,
    setUpdater: function (fn) { updater = fn; },
    start: function () { if (running) return; running = true; resize(); last = performance.now(); loop(); window.addEventListener('resize', resize); },
    stop: function () { running = false; cancelAnimationFrame(raf); window.removeEventListener('resize', resize); }
  };
}

/* ---------- v2: clean code-built cloud → services ---------- */
function buildCleanCloud(stage) {
  const root = new THREE.Group(); stage.scene.add(root);

  // clean glowing cloud
  const cloud = new THREE.Group(); cloud.position.set(0, 1.35, 0); root.add(cloud);
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0x8ea2ff, emissive: 0x6650d8, emissiveIntensity: 0.7, roughness: 0.35, metalness: 0.1, transparent: true, opacity: 0.95 });
  [[0, 0, 0, 0.62], [-0.62, -0.04, 0, 0.46], [0.62, -0.04, 0, 0.46], [0.32, 0.27, 0, 0.42], [-0.32, 0.25, 0, 0.4], [0, -0.12, 0, 0.5]].forEach(function (c) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(c[3], 32, 24), cloudMat); m.position.set(c[0], c[1], c[2]); cloud.add(m);
  });
  cloud.add(glow(VIOLET, 3.4, 0.42));
  const title = labelSprite('GLOBAL CLOUD', '#cfe6ff'); title.position.set(0, -0.85, 0.3); title.scale.set(1.8, 0.45, 1); cloud.add(title);

  // four clean service nodes in a row
  const defs = [['SERVERS', VIOLET, -2.45], ['DATABASE', CYAN, -0.82], ['WEB APP', BLUE, 0.82], ['GLOBAL CDN', PINK, 2.45]];
  const nodes = [];
  defs.forEach(function (d) {
    const g = new THREE.Group(); g.position.set(d[2], -0.95, 0);
    const bg = new THREE.BoxGeometry(1.18, 0.74, 0.08);
    g.add(new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ color: new THREE.Color(d[1]), transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false })));
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(bg), new THREE.LineBasicMaterial({ color: new THREE.Color(d[1]), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })));
    const lab = labelSprite(d[0], '#eaf2ff'); lab.scale.set(0.95, 0.24, 1); lab.position.set(0, 0, 0.08); g.add(lab);
    g.add(glow(d[1], 1.3, 0.3));
    root.add(g); nodes.push(g);
  });

  // connectors + flowing data
  const top = new THREE.Vector3(0, 0.78, 0);
  const segs = nodes.map(function (n) { return { a: top, b: new THREE.Vector3(n.position.x, n.position.y + 0.42, 0) }; });
  const lpos = new Float32Array(segs.length * 6);
  segs.forEach(function (s, i) { lpos[i * 6] = s.a.x; lpos[i * 6 + 1] = s.a.y; lpos[i * 6 + 2] = s.a.z; lpos[i * 6 + 3] = s.b.x; lpos[i * 6 + 4] = s.b.y; lpos[i * 6 + 5] = s.b.z; });
  const lgeo = new THREE.BufferGeometry(); lgeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3));
  root.add(new THREE.LineSegments(lgeo, new THREE.LineBasicMaterial({ color: new THREE.Color(0x7fb7ff), transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false })));
  const M = segs.length * 3, dpos = new Float32Array(M * 3);
  const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dmat = new THREE.PointsMaterial({ size: 0.17, map: SOFT, color: new THREE.Color(0xbfe6ff), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  root.add(new THREE.Points(dgeo, dmat));
  const dd = []; for (let i = 0; i < M; i++) dd.push({ s: i % segs.length, t: Math.random(), spd: 0.3 + Math.random() * 0.5 });

  stage.setUpdater(function (t, dt, p) {
    root.rotation.y = p.x * 0.35; root.rotation.x = p.y * 0.18; root.position.y = Math.sin(t * 0.7) * 0.05;
    cloud.position.y = 1.35 + Math.sin(t * 0.9) * 0.06; cloud.rotation.y = Math.sin(t * 0.3) * 0.15;
    for (let i = 0; i < dd.length; i++) {
      const o = dd[i]; o.t += o.spd * dt; if (o.t >= 1) { o.t = 0; o.s = Math.floor(Math.random() * segs.length); }
      const s = segs[o.s]; dpos[i * 3] = s.a.x + (s.b.x - s.a.x) * o.t; dpos[i * 3 + 1] = s.a.y + (s.b.y - s.a.y) * o.t; dpos[i * 3 + 2] = 0;
    }
    dgeo.attributes.position.needsUpdate = true;
  });
}

/* ---------- v1: generated 3D mesh ---------- */
function buildModel(stage, onState) {
  const pmrem = new THREE.PMREMGenerator(stage.renderer);
  stage.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const holder = new THREE.Group(); stage.scene.add(holder);
  let model = null;
  new GLTFLoader().load('assets/cloud.glb?v=1', function (gltf) {
    model = gltf.scene;
    model.traverse(function (o) {
      if (o.isMesh && o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) {
        if ('envMapIntensity' in m) m.envMapIntensity = 1.6;
        if (m.color && m.emissive) { const mx = Math.max(m.color.r, m.color.g, m.color.b), mn = Math.min(m.color.r, m.color.g, m.color.b), sat = mx > 0 ? (mx - mn) / mx : 0; if (sat > 0.28 && mx > 0.2) { m.emissive.copy(m.color); m.emissiveIntensity = 1.25; } }
        m.needsUpdate = true;
      });
    });
    const box = new THREE.Box3().setFromObject(model), size = new THREE.Vector3(), center = new THREE.Vector3();
    box.getSize(size); box.getCenter(center);
    const sc = 3.2 / (Math.max(size.x, size.y, size.z) || 1);
    model.position.sub(center);
    const wrap = new THREE.Group(); wrap.add(model); wrap.scale.setScalar(sc); holder.add(wrap);
    if (onState) onState('ready');
  }, undefined, function () { if (onState) onState('error'); });
  holder.add(glow(VIOLET, 4.0, 0.18));
  stage.setUpdater(function (t, dt, p) { holder.rotation.y = t * 0.3 + p.x * 1.1; holder.rotation.x = p.y * 0.3; });
}

/* ---------- bootstrap + switcher ---------- */
const stages = {};
function ensure(which) {
  if (stages[which]) return stages[which];
  if (which === '3d') { const s = makeStage(document.getElementById('cv-3d')); buildModel(s, function (st) { const m = document.getElementById('model-msg'); if (m) m.style.display = st === 'ready' ? 'none' : 'flex'; }); stages[which] = s; }
  else if (which === 'code') { const s = makeStage(document.getElementById('cv-code')); buildCleanCloud(s); stages[which] = s; }
  return stages[which];
}
const HINTS = { '3d': 'Generated 3D mesh — move your cursor to rotate it. Glowing with bloom.', code: 'Code-built holographic cloud → services, cleaned up. Cursor parallax.', comp: 'UI-component style: glass cards + animated data flow (HTML/SVG).' };
function show(which) {
  ['3d', 'code', 'comp'].forEach(function (w) {
    const stage = document.getElementById('stage-' + w); const on = w === which;
    stage.hidden = !on;
    if (stages[w]) { if (on) stages[w].start(); else stages[w].stop(); }
  });
  if (which === '3d' || which === 'code') ensure(which).start();
  document.querySelectorAll('.lab-switch button').forEach(function (b) { b.classList.toggle('active', b.dataset.v === which); });
  const h = document.getElementById('hint'); if (h) h.textContent = HINTS[which];
}
document.querySelectorAll('.lab-switch button').forEach(function (b) { b.addEventListener('click', function () { show(b.dataset.v); }); });
show('3d');
