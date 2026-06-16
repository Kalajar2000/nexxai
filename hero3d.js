// NEXXAI hero 3D — code-only abstract scenes (orb / particles / crystal)
// One persistent renderer; swap scenes via setKind. No external media.
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

/* ---- shared GLSL: Ashima 3D simplex noise ---- */
const SNOISE = `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod(i,289.0);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=1.0/7.0; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

export const KINDS = ['orb', 'particles', 'crystal'];

/* ---------- scene builders ---------- */
function buildOrb(scene) {
  const uniforms = { uTime: { value: 0 } };
  const geo = new THREE.IcosahedronGeometry(1.55, 5);
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: SNOISE + `
      uniform float uTime; varying float vN; varying vec3 vNrm; varying vec3 vView;
      void main(){
        float d = snoise(position*0.9 + uTime*0.22);
        float d2 = snoise(position*1.9 - uTime*0.16)*0.45;
        float disp = d + d2; vN = disp;
        vec3 p = position + normal * disp * 0.26;
        vec4 mv = modelViewMatrix * vec4(p,1.0);
        vNrm = normalize(normalMatrix * normal); vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying float vN; varying vec3 vNrm; varying vec3 vView;
      void main(){
        vec3 violet=vec3(0.545,0.361,0.965), blue=vec3(0.231,0.510,0.965), pink=vec3(0.925,0.282,0.600);
        float m = smoothstep(-1.0,1.0,vN);
        vec3 col = mix(blue, violet, m);
        col = mix(col, pink, smoothstep(0.45,1.0,m)*0.55);
        float fres = pow(1.0 - max(dot(normalize(vNrm), normalize(vView)),0.0), 2.4);
        col += fres*0.55;
        gl_FragColor = vec4(col,1.0);
      }`
  });
  const mesh = new THREE.Mesh(geo, mat); scene.add(mesh);
  return {
    disposables: [mesh],
    update(t, p) { uniforms.uTime.value = t; mesh.rotation.y = t * 0.14 + p.x * 0.6; mesh.rotation.x = p.y * 0.4; }
  };
}

function buildParticles(scene) {
  const N = 150, pos = new Float32Array(N * 3), base = [];
  for (let i = 0; i < N; i++) {
    const r = 2.3 * Math.cbrt(Math.random()), th = Math.random() * 6.283, ph = Math.acos(2 * Math.random() - 1);
    const x = r * Math.sin(ph) * Math.cos(th), y = r * Math.sin(ph) * Math.sin(th), z = r * Math.cos(ph);
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; base.push([x, y, z]);
  }
  const pgeo = new THREE.BufferGeometry(); pgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pmat = new THREE.PointsMaterial({ size: 0.07, color: new THREE.Color('#d7c6ff'), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
  const points = new THREE.Points(pgeo, pmat);
  const lpos = new Float32Array(N * N * 3);
  const lgeo = new THREE.BufferGeometry(); lgeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3));
  const lmat = new THREE.LineBasicMaterial({ color: new THREE.Color('#7c5fe0'), transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false });
  const lines = new THREE.LineSegments(lgeo, lmat);
  const grp = new THREE.Group(); grp.add(points); grp.add(lines); scene.add(grp);
  const pa = pgeo.attributes.position.array, TH = 0.9;
  return {
    disposables: [points, lines],
    update(t, p) {
      for (let i = 0; i < N; i++) {
        const b = base[i];
        pa[i * 3] = b[0] + Math.sin(t * 0.5 + i) * 0.09;
        pa[i * 3 + 1] = b[1] + Math.cos(t * 0.4 + i * 1.3) * 0.09;
        pa[i * 3 + 2] = b[2] + Math.sin(t * 0.3 + i * 0.7) * 0.09;
      }
      pgeo.attributes.position.needsUpdate = true;
      let k = 0;
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
        const dx = pa[i * 3] - pa[j * 3], dy = pa[i * 3 + 1] - pa[j * 3 + 1], dz = pa[i * 3 + 2] - pa[j * 3 + 2];
        if (dx * dx + dy * dy + dz * dz < TH * TH) {
          lpos[k++] = pa[i * 3]; lpos[k++] = pa[i * 3 + 1]; lpos[k++] = pa[i * 3 + 2];
          lpos[k++] = pa[j * 3]; lpos[k++] = pa[j * 3 + 1]; lpos[k++] = pa[j * 3 + 2];
        }
      }
      lgeo.setDrawRange(0, k / 3); lgeo.attributes.position.needsUpdate = true;
      grp.rotation.y = t * 0.11 + p.x * 0.8; grp.rotation.x = p.y * 0.5;
    }
  };
}

function buildCrystal(scene) {
  const geo = new THREE.IcosahedronGeometry(1.6, 1);
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#1b1536'), emissive: new THREE.Color('#140d2e'), metalness: 0.6, roughness: 0.28, flatShading: true });
  const mesh = new THREE.Mesh(geo, mat);
  const egeo = new THREE.EdgesGeometry(geo);
  const emat = new THREE.LineBasicMaterial({ color: new THREE.Color('#a78bfa') });
  const edges = new THREE.LineSegments(egeo, emat);
  const grp = new THREE.Group(); grp.add(mesh); grp.add(edges); scene.add(grp);
  const amb = new THREE.AmbientLight(0xffffff, 0.55);
  const d1 = new THREE.DirectionalLight(0xa78bfa, 2.4); d1.position.set(4, 3, 5);
  const d2 = new THREE.DirectionalLight(0x3b82f6, 1.6); d2.position.set(-5, -2, 2);
  scene.add(amb, d1, d2);
  return {
    disposables: [mesh, edges],
    update(t, p) { grp.rotation.y = t * 0.24 + p.x * 0.8; grp.rotation.x = t * 0.11 + p.y * 0.5; }
  };
}

const BUILDERS = { orb: buildOrb, particles: buildParticles, crystal: buildCrystal };

/* ---------- engine ---------- */
export function createHero(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (e) {
    if (canvas) canvas.style.display = 'none';
    return { setKind() {}, dispose() {} };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearAlpha(0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100); camera.position.z = 5;
  const pointer = { x: 0, y: 0 };
  let current = null, raf = 0, stopped = false;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize); ro.observe(canvas);
  function onMove(e) { pointer.x = e.clientX / window.innerWidth - 0.5; pointer.y = e.clientY / window.innerHeight - 0.5; }
  window.addEventListener('pointermove', onMove, { passive: true });

  function clear() {
    if (!current) return;
    while (scene.children.length) scene.remove(scene.children[0]);
    current.disposables.forEach(function (o) {
      if (o.geometry && o.geometry.dispose) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { m.dispose && m.dispose(); });
    });
    current = null;
  }
  function setKind(kind) {
    clear();
    current = (BUILDERS[kind] || BUILDERS.orb)(scene);
    resize();
    if (reduce) { current.update(0, pointer); renderer.render(scene, camera); }
  }
  function loop(now) {
    if (stopped) return;
    if (!reduce && current) { current.update((now - start) / 1000, pointer); renderer.render(scene, camera); }
    raf = requestAnimationFrame(loop);
  }
  const start = performance.now();
  if (!reduce) raf = requestAnimationFrame(loop);

  return {
    setKind: setKind,
    dispose() {
      stopped = true; cancelAnimationFrame(raf); ro.disconnect();
      window.removeEventListener('pointermove', onMove); clear(); renderer.dispose();
    }
  };
}
