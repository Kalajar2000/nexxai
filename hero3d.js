// NEXXAI hero 3D — one living AI scene: ambient particles + a liquid "AI core"
// orb that wakes into a neural network (nodes, synapses, firing signals) on click.
// Reacts to cursor and scroll. Built entirely in code (Three.js), no external media.
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
    const r = 2.7 * Math.cbrt(Math.random()), th = Math.random() * 6.283, ph = Math.acos(2 * Math.random() - 1);
    const x = r * Math.sin(ph) * Math.cos(th), y = r * Math.sin(ph) * Math.sin(th), z = r * Math.cos(ph);
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; base.push([x, y, z]);
  }
  const pgeo = new THREE.BufferGeometry(); pgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pmat = new THREE.PointsMaterial({ size: 0.05, color: new THREE.Color('#cdb6ff'), transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false });
  const points = new THREE.Points(pgeo, pmat);
  const lpos = new Float32Array(N * N * 3);
  const lgeo = new THREE.BufferGeometry(); lgeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3));
  const lmat = new THREE.LineBasicMaterial({ color: new THREE.Color('#6f5bd6'), transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false });
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

/* ---- liquid orb (the dormant AI core) ---- */
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
      varying float vN; varying vec3 vNrm; varying vec3 vView;
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

/* ---- neural network "brain" (nodes + synapses + firing signals) ---- */
function makeBrain() {
  const N = 46, R = 1.5, nodes = [], npos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, rr = Math.sqrt(Math.max(1 - y * y, 0)), phi = i * 2.399963;
    const rad = R * (0.8 + Math.random() * 0.2);
    const x = Math.cos(phi) * rr * rad, z = Math.sin(phi) * rr * rad, yy = y * rad;
    nodes.push([x, yy, z]); npos[i * 3] = x; npos[i * 3 + 1] = yy; npos[i * 3 + 2] = z;
  }
  // connect each node to its 3 nearest neighbours (dedup)
  const edges = [], seen = {};
  for (let i = 0; i < N; i++) {
    const d = [];
    for (let j = 0; j < N; j++) if (j !== i) {
      const dx = nodes[i][0] - nodes[j][0], dy = nodes[i][1] - nodes[j][1], dz = nodes[i][2] - nodes[j][2];
      d.push([dx * dx + dy * dy + dz * dz, j]);
    }
    d.sort(function (a, b) { return a[0] - b[0]; });
    for (let k = 0; k < 3; k++) {
      const a = Math.min(i, d[k][1]), b = Math.max(i, d[k][1]), key = a + '_' + b;
      if (!seen[key]) { seen[key] = 1; edges.push([a, b]); }
    }
  }
  const ngeo = new THREE.BufferGeometry(); ngeo.setAttribute('position', new THREE.BufferAttribute(npos, 3));
  const nmat = new THREE.PointsMaterial({ size: 0.13, color: new THREE.Color('#dcccff'), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
  const points = new THREE.Points(ngeo, nmat);
  const lpos = new Float32Array(edges.length * 2 * 3);
  for (let e = 0; e < edges.length; e++) {
    const a = nodes[edges[e][0]], b = nodes[edges[e][1]];
    lpos[e * 6] = a[0]; lpos[e * 6 + 1] = a[1]; lpos[e * 6 + 2] = a[2];
    lpos[e * 6 + 3] = b[0]; lpos[e * 6 + 4] = b[1]; lpos[e * 6 + 5] = b[2];
  }
  const lgeo = new THREE.BufferGeometry(); lgeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3));
  const lmat = new THREE.LineBasicMaterial({ color: new THREE.Color('#7c5fe0'), transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false });
  const lines = new THREE.LineSegments(lgeo, lmat);
  // firing signals travelling along edges
  const SIG = 20, spos = new Float32Array(SIG * 3), sig = [];
  for (let s = 0; s < SIG; s++) sig.push({ e: Math.floor(Math.random() * edges.length), t: Math.random(), spd: 0.45 + Math.random() * 0.8 });
  const sgeo = new THREE.BufferGeometry(); sgeo.setAttribute('position', new THREE.BufferAttribute(spos, 3));
  const smat = new THREE.PointsMaterial({ size: 0.17, color: new THREE.Color('#5eead4'), transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
  const signals = new THREE.Points(sgeo, smat);
  const grp = new THREE.Group(); grp.add(lines, points, signals);
  return {
    group: grp, disposables: [points, lines, signals],
    update(t, p, scrollN, dt) {
      for (let s = 0; s < SIG; s++) {
        const o = sig[s]; o.t += o.spd * dt;
        if (o.t >= 1) { o.t = 0; o.e = Math.floor(Math.random() * edges.length); o.spd = 0.45 + Math.random() * 0.8; }
        const a = nodes[edges[o.e][0]], b = nodes[edges[o.e][1]], tt = o.t;
        spos[s * 3] = a[0] + (b[0] - a[0]) * tt; spos[s * 3 + 1] = a[1] + (b[1] - a[1]) * tt; spos[s * 3 + 2] = a[2] + (b[2] - a[2]) * tt;
      }
      sgeo.attributes.position.needsUpdate = true;
      nmat.opacity = 0.72 + Math.sin(t * 2.0) * 0.22;
      grp.rotation.y = t * 0.18 + p.x * 0.8 + scrollN * 1.2;
      grp.rotation.x = p.y * 0.5 + scrollN * 0.4;
    }
  };
}

/* ---- engine: one scene, orb <-> brain morph ---- */
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

  const particles = makeParticles();
  const orb = makeOrb();
  const brain = makeBrain();
  scene.add(particles.group, orb.object, brain.group);
  brain.group.scale.setScalar(0.001); brain.group.visible = false;

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let scrollN = 0, target = 0, mix = 0, raf = 0, stopped = false, last = performance.now();

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
    if (target === 1 && opts.onActivate) opts.onActivate();
    if (target === 0 && opts.onReset) opts.onReset();
  }
  function reset() { target = 0; if (opts.onReset) opts.onReset(); }
  function smooth(x) { x = Math.min(Math.max(x, 0), 1); return x * x * (3 - 2 * x); }

  const start = performance.now();
  function frame(now) {
    if (stopped) return;
    let dt = (now - last) / 1000; last = now; if (dt > 0.05) dt = 0.05;
    const t = reduce ? 0 : (now - start) / 1000;
    pointer.x += (pointer.tx - pointer.x) * 0.06; pointer.y += (pointer.ty - pointer.y) * 0.06;
    mix += (target - mix) * 0.08;

    particles.update(t, pointer);
    const orbS = 1 - smooth(mix);
    orb.object.visible = orbS > 0.01; orb.object.scale.setScalar(Math.max(orbS, 0.001));
    if (orb.object.visible) orb.update(t, pointer);
    const brS = smooth(mix);
    brain.group.visible = brS > 0.01; brain.group.scale.setScalar(Math.max(brS, 0.001));
    if (brain.group.visible) {
      brain.update(t, pointer, scrollN, reduce ? 0.016 : dt);
    }

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return {
    toggle: toggle, reset: reset,
    dispose() {
      stopped = true; cancelAnimationFrame(raf); ro.disconnect();
      window.removeEventListener('pointermove', onMove); window.removeEventListener('scroll', onScroll);
      canvas.removeEventListener('click', onClick);
      [particles, orb, brain].forEach(function (s) {
        s.disposables.forEach(function (o) {
          if (o.geometry && o.geometry.dispose) o.geometry.dispose();
          if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { m.dispose && m.dispose(); });
        });
      });
      renderer.dispose();
    }
  };
}
