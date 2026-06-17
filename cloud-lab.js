/* Cloud Lab — two options for the "software/cloud" state:
   ① a properly-rendered 3D mesh (environment lighting + tone-mapping + orbit, like a real model viewer)
   ② the GLOBAL CLOUD reference image, premium-framed with parallax */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas = document.getElementById('cv-3d');

function radialShadowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(0.7, 'rgba(0,0,0,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
}

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearAlpha(0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100); camera.position.set(0, 0.4, 6);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

scene.add(new THREE.AmbientLight(0xffffff, 0.45));
const key = new THREE.DirectionalLight(0xffffff, 2.3); key.position.set(3, 5, 4); scene.add(key);
const fill = new THREE.DirectionalLight(0x88aaff, 0.7); fill.position.set(-4, 0, 3); scene.add(fill);
const rim = new THREE.DirectionalLight(0xff8ad0, 0.9); rim.position.set(0, 3, -5); scene.add(rim);

const controls = new OrbitControls(camera, canvas);
controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.autoRotate = true; controls.autoRotateSpeed = 1.3;
controls.minDistance = 3.2; controls.maxDistance = 9; controls.target.set(0, 0.25, 0);

const shadow = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 5.5), new THREE.MeshBasicMaterial({ map: radialShadowTex(), transparent: true, opacity: 0.55, depthWrite: false }));
shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.55; scene.add(shadow);

const holder = new THREE.Group(); scene.add(holder);
new GLTFLoader().load('assets/cloud.glb?v=4', function (g) {
  const model = g.scene;
  model.traverse(function (o) {
    if (o.isMesh && o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) {
      if ('envMapIntensity' in m) m.envMapIntensity = 1.1;
      if ('roughness' in m) m.roughness = Math.min(m.roughness != null ? m.roughness : 0.6, 0.75);
      m.needsUpdate = true;
    });
  });
  const box = new THREE.Box3().setFromObject(model), size = new THREE.Vector3(), center = new THREE.Vector3();
  box.getSize(size); box.getCenter(center);
  const sc = 2.7 / (Math.max(size.x, size.y, size.z) || 1);
  model.position.sub(center);
  const wrap = new THREE.Group(); wrap.add(model); wrap.scale.setScalar(sc); holder.add(wrap);
  const msg = document.getElementById('model-msg'); if (msg) msg.style.display = 'none';
}, undefined, function () { const msg = document.getElementById('model-msg'); if (msg) msg.style.display = 'flex'; });

let running = false, raf = 0, t = 0, lastT = performance.now();
function resize() { const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
function loop() {
  if (!running) return; raf = requestAnimationFrame(loop);
  const now = performance.now(); t += (now - lastT) / 1000; lastT = now;
  holder.position.y = Math.sin(t * 0.8) * 0.06;
  controls.update(); renderer.render(scene, camera);
}
function start() { if (running) return; running = true; resize(); lastT = performance.now(); loop(); window.addEventListener('resize', resize); }
function stop() { running = false; cancelAnimationFrame(raf); window.removeEventListener('resize', resize); }

const HINTS = { '3d': 'A properly-lit 3D mesh — drag to rotate, scroll to zoom. Environment lighting, no blow-out.' };
function show(which) {
  document.getElementById('stage-3d').hidden = which !== '3d';
  if (which === '3d') start(); else stop();
  document.querySelectorAll('.lab-switch button').forEach(function (b) { b.classList.toggle('active', b.dataset.v === which); });
  const h = document.getElementById('hint'); if (h) h.textContent = HINTS[which];
}
document.querySelectorAll('.lab-switch button').forEach(function (b) { b.addEventListener('click', function () { show(b.dataset.v); }); });
show('3d');

/* matrix-style code background */
(function matrixBG() {
  const mc = document.getElementById('matrix'); if (!mc) return;
  const mx = mc.getContext('2d'); const fs = 14; let cols = 0, drops = [];
  const chars = '01<>{}[]/\\|=+*#01010110';
  function mr() { mc.width = window.innerWidth; mc.height = window.innerHeight; cols = Math.ceil(mc.width / fs); drops = []; for (let i = 0; i < cols; i++) drops[i] = Math.random() * -60; }
  function mt() {
    mx.fillStyle = 'rgba(6,6,14,0.10)'; mx.fillRect(0, 0, mc.width, mc.height);
    mx.font = fs + 'px monospace';
    for (let i = 0; i < cols; i++) {
      const ch = chars[Math.floor(Math.random() * chars.length)], x = i * fs, y = drops[i] * fs;
      mx.fillStyle = Math.random() < 0.08 ? 'rgba(150,210,255,0.95)' : 'rgba(123,92,246,0.5)';
      mx.fillText(ch, x, y);
      if (y > mc.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
    requestAnimationFrame(mt);
  }
  mr(); window.addEventListener('resize', mr); mt();
})();
