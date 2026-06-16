// NEXXAI hero 3D — one living scene: ambient particles + liquid orb that
// morphs into a 4D tesseract on click. Reacts to cursor and scroll.
// Built entirely in code (Three.js), no external media.
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

/* ---- Ashima 3D simplex noise (for the liquid orb) ---- */
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

/* ---- ambient particle network ---- */
function makeParticles() {
  const N = 120, pos = new Float32Array(N * 3), base = [];
  for (let i = 0; i < N; i++) {
    const r = 2.6 * Math.cbrt(Math.random()), th = Math.random() * 6.283, ph = Math.acos(2 * Math.random() - 1);
    const x = r * Math.sin(ph) * Math.cos(th), y = r * Math.sin(ph) * Math.sin(th), z = r * Math.cos(ph);
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; base.push([x, y, z]);
  }
  const pgeo = new THREE.BufferGeometry(); pgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pmat = new THREE.PointsMaterial({ size: 0.055, color: new THREE.Color('#cdb6ff'), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const points = new THREE.Points(pgeo, pmat);
  const lpos = new Float32Array(N * N * 3);
  const lgeo = new THREE.BufferGeometry(); lgeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3));
  const lmat = new THREE.LineBasicMaterial({ color: new THREE.Color('#6f5bd6'), transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false });
  const lines = new THREE.LineSegments(lgeo, lmat);
  const grp = new THREE.Group(); grp.add(points, lines);
  const pa = pgeo.attributes.position.array, TH = 0.95;
  return {
    group: grp, disposables: [points, lines],
    update(t, p) {
      for (let i = 0; i < N; i++) {
        const b = base[i];
        pa[i * 3] = b[0] + Math.sin(t * 0.5 + i) * 0.08;
        pa[i * 3 + 1] = b[1] + Math.cos(t * 0.4 + i * 1.3) * 0.08;
        pa[i * 3 + 2] = b[2] + Math.sin(t * 0.3 + i * 0.7) * 0.08;
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
      grp.rotation.y = t * 0.06 + p.x * 0.5; grp.rotation.x = p.y * 0.3;
    }
  };
}

/* ---- liquid orb (shader-displaced sphere) ---- */
function makeOrb() {
  const uniforms = { uTime: { value: 0 } };
  const geo = new THREE.IcosahedronGeometry(1.5, 5);
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true,
    vertexShader: SNOISE + `
      uniform float uTime; varying float vN; varying vec3 vNrm; varying vec3 vView;
      void main(){
        float d=snoise(position*0.9+uTime*0.22); float d2=snoise(position*1.9-uTime*0.16)*0.45;
        float disp=d+d2; vN=disp;
        vec3 pp=position+normal*disp*0.26;
        vec4 mv=modelViewMatrix*vec4(pp,1.0);
        vNrm=normalize(normalMatrix*normal); vView=normalize(-mv.xyz);
        gl_Position=projectionMatrix*mv;
      }`,
    fragmentShader: `
      varying float vN; varying vec3 vNrm; varying vec3 vView; uniform float uTime;
      void main(){
        vec3 violet=vec3(0.545,0.361,0.965), blue=vec3(0.231,0.510,0.965), pink=vec3(0.925,0.282,0.600);
        float m=smoothstep(-1.0,1.0,vN);
        vec3 col=mix(blue,violet,m); col=mix(col,pink,smoothstep(0.45,1.0,m)*0.55);
        float fres=pow(1.0-max(dot(normalize(vNrm),normalize(vView)),0.0),2.4); col+=fres*0.55;
        gl_FragColor=vec4(col,1.0);
      }`
  });
  const mesh = new THREE.Mesh(geo, mat);
  return {
    object: mesh, disposables: [mesh],
    update(t, p) { uniforms.uTime.value = t; mesh.rotation.y = t * 0.14 + p.x * 0.6; mesh.rotation.x = p.y * 0.4; }
  };
}

/* ---- 4D tesseract ---- */
function makeTesseract() {
  const V = [];
  for (let i = 0; i < 16; i++) V.push([(i & 1) ? 1 : -1, (i & 2) ? 1 : -1, (i & 4) ? 1 : -1, (i & 8) ? 1 : -1]);
  const E = [];
  for (let i = 0; i < 16; i++) for (let j = i + 1; j < 16; j++) {
    let diff = 0; for (let k = 0; k < 4; k++) if (V[i][k] !== V[j][k]) diff++;
    if (diff === 1) E.push([i, j]);
  }
  const lpos = new Float32Array(E.length * 2 * 3);
  const lgeo = new THREE.BufferGeometry(); lgeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3));
  const lmat = new THREE.LineBasicMaterial({ color: new THREE.Color('#b79dff'), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
  const lines = new THREE.LineSegments(lgeo, lmat);
  const vpos = new Float32Array(16 * 3);
  const vgeo = new THREE.BufferGeometry(); vgeo.setAttribute('position', new THREE.BufferAttribute(vpos, 3));
  const vmat = new THREE.PointsMaterial({ size: 0.13, color: new THREE.Color('#e3d6ff'), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
  const verts = new THREE.Points(vgeo, vmat);
  const grp = new THREE.Group(); grp.add(lines, verts);
  const P = new Array(16); const D = 2.5, SCALE = 1.55;
  function rot(pt, a) {
    let x = pt[0], y = pt[1], z = pt[2], w = pt[3], c, s;
    c = Math.cos(a.xw); s = Math.sin(a.xw); { const nx = x * c - w * s, nw = x * s + w * c; x = nx; w = nw; }
    c = Math.cos(a.yw); s = Math.sin(a.yw); { const ny = y * c - w * s, nw = y * s + w * c; y = ny; w = nw; }
    c = Math.cos(a.zw); s = Math.sin(a.zw); { const nz = z * c - w * s, nw = z * s + w * c; z = nz; w = nw; }
    c = Math.cos(a.xy); s = Math.sin(a.xy); { const nx = x * c - y * s, ny = x * s + y * c; x = nx; y = ny; }
    c = Math.cos(a.xz); s = Math.sin(a.xz); { const nx = x * c - z * s, nz = x * s + z * c; x = nx; z = nz; }
    const k = SCALE / (D - w);
    return [x * k, y * k, z * k];
  }
  return {
    group: grp, disposables: [lines, verts],
    update(t, p, scrollN) {
      const a = {
        xw: t * 0.30 + p.x * 0.9,
        yw: t * 0.22 + p.y * 0.9 + scrollN * 1.6,
        zw: t * 0.16,
        xy: t * 0.14,
        xz: t * 0.10 + scrollN * 0.6
      };
      for (let i = 0; i < 16; i++) { P[i] = rot(V[i], a); vpos[i * 3] = P[i][0]; vpos[i * 3 + 1] = P[i][1]; vpos[i * 3 + 2] = P[i][2]; }
      let k = 0;
      for (let e = 0; e < E.length; e++) {
        const A = P[E[e][0]], B = P[E[e][1]];
        lpos[k++] = A[0]; lpos[k++] = A[1]; lpos[k++] = A[2];
        lpos[k++] = B[0]; lpos[k++] = B[1]; lpos[k++] = B[2];
      }
      lgeo.attributes.position.needsUpdate = true; vgeo.attributes.position.needsUpdate = true;
    }
  };
}

/* ---- engine: one scene, orb <-> tesseract morph ---- */
export function createHero(canvas, opts) {
  opts = opts || {};
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true }); }
  catch (e) { if (canvas) canvas.style.display = 'none'; return { dispose() {}, reset() {}, toggle() {} }; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearAlpha(0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100); camera.position.z = 5;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion = reduce ? 0 : 1;

  const particles = makeParticles();
  const orb = makeOrb();
  const tess = makeTesseract();
  scene.add(particles.group, orb.object, tess.group);
  tess.group.scale.setScalar(0.001); tess.group.visible = false;

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let scrollN = 0, target = 0, mix = 0, raf = 0, stopped = false, mt = 0;

  function resize() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize); ro.observe(canvas);
  function onMove(e) { pointer.tx = e.clientX / window.innerWidth - 0.5; pointer.ty = e.clientY / window.innerHeight - 0.5; }
  function onScroll() { scrollN = Math.min(window.scrollY / 700, 1); }
  function onClick() { toggle(); }
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  canvas.addEventListener('click', onClick);

  function toggle() {
    target = target > 0.5 ? 0 : 1;
    if (target === 1 && opts.onEnterTesseract) opts.onEnterTesseract();
  }
  function reset() { target = 0; }

  const start = performance.now();
  function frame(now) {
    if (stopped) return;
    const t = ((now - start) / 1000) * (motion || 1);
    pointer.x += (pointer.tx - pointer.x) * 0.06; pointer.y += (pointer.ty - pointer.y) * 0.06;
    mix += (target - mix) * 0.08;
    const tt = reduce ? 0 : t;

    particles.update(tt, pointer);
    const orbS = 1 - smooth(mix);
    orb.object.visible = orbS > 0.01; orb.object.scale.setScalar(Math.max(orbS, 0.001));
    if (orb.object.visible) orb.update(tt, pointer);
    const teS = smooth(mix);
    tess.group.visible = teS > 0.01; tess.group.scale.setScalar(Math.max(teS, 0.001));
    tess.group.children.forEach(function (c) { if (c.material) c.material.opacity = (c.type === 'Points' ? 0.95 : 0.95) * teS; });
    if (tess.group.visible) tess.update(tt, pointer, scrollN);

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  function smooth(x) { x = Math.min(Math.max(x, 0), 1); return x * x * (3 - 2 * x); }
  raf = requestAnimationFrame(frame);

  return {
    toggle: toggle, reset: reset,
    dispose() {
      stopped = true; cancelAnimationFrame(raf); ro.disconnect();
      window.removeEventListener('pointermove', onMove); window.removeEventListener('scroll', onScroll);
      canvas.removeEventListener('click', onClick);
      [particles, orb, tess].forEach(function (s) {
        s.disposables.forEach(function (o) {
          if (o.geometry && o.geometry.dispose) o.geometry.dispose();
          if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { m.dispose && m.dispose(); });
        });
      });
      renderer.dispose();
    }
  };
}
