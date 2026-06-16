// NEXXAI hero 3D — a living, 3-state AI scene (build 4).
// Click cycles: abstract orb -> AI brain (+ 3D robot) -> software (cloud,
// devices, data, code) -> back. Reacts to cursor and scroll. Code-only.
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

/* ---- Ashima 3D simplex noise (liquid orb) ---- */
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

const VIOLET = 0x8b5cf6, BLUE = 0x3b82f6, PINK = 0xec4899, CYAN = 0x5eead4, LILAC = 0xcdb6ff;

/* ---- ambient particle field (always behind every state) ---- */
function makeParticles() {
  const N = 110, pos = new Float32Array(N * 3), base = [];
  for (let i = 0; i < N; i++) {
    const r = 2.8 * Math.cbrt(Math.random()), th = Math.random() * 6.283, ph = Math.acos(2 * Math.random() - 1);
    const x = r * Math.sin(ph) * Math.cos(th), y = r * Math.sin(ph) * Math.sin(th), z = r * Math.cos(ph);
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; base.push([x, y, z]);
  }
  const pgeo = new THREE.BufferGeometry(); pgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pmat = new THREE.PointsMaterial({ size: 0.045, color: new THREE.Color(LILAC), transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false });
  const points = new THREE.Points(pgeo, pmat);
  const lpos = new Float32Array(N * N * 3);
  const lgeo = new THREE.BufferGeometry(); lgeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3));
  const lmat = new THREE.LineBasicMaterial({ color: new THREE.Color(0x6f5bd6), transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false });
  const lines = new THREE.LineSegments(lgeo, lmat);
  const grp = new THREE.Group(); grp.add(points, lines);
  const pa = pgeo.attributes.position.array, TH = 0.95;
  return {
    group: grp,
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
      grp.rotation.y = t * 0.05 + p.x * 0.4; grp.rotation.x = p.y * 0.25;
    }
  };
}

/* ---- state 1: liquid orb (the core) ---- */
function makeOrb() {
  const uniforms = { uTime: { value: 0 } };
  const geo = new THREE.IcosahedronGeometry(1.5, 5);
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true,
    vertexShader: SNOISE + `
      uniform float uTime; varying float vN; varying vec3 vNrm; varying vec3 vView;
      void main(){
        float d=snoise(position*0.9+uTime*0.22); float d2=snoise(position*1.9-uTime*0.16)*0.45;
        float disp=d+d2; vN=disp; vec3 pp=position+normal*disp*0.26;
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
  const grp = new THREE.Group(); grp.add(mesh);
  return { group: grp, update(t, p) { uniforms.uTime.value = t; mesh.rotation.y = t * 0.14 + p.x * 0.6; mesh.rotation.x = p.y * 0.4; } };
}

/* ---- state 2: AI neural-network brain ---- */
function makeBrain() {
  const N = 46, R = 1.5, nodes = [], npos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, rr = Math.sqrt(Math.max(1 - y * y, 0)), phi = i * 2.399963, rad = R * (0.8 + Math.random() * 0.2);
    const x = Math.cos(phi) * rr * rad, z = Math.sin(phi) * rr * rad, yy = y * rad;
    nodes.push([x, yy, z]); npos[i * 3] = x; npos[i * 3 + 1] = yy; npos[i * 3 + 2] = z;
  }
  const edges = [], seen = {};
  for (let i = 0; i < N; i++) {
    const d = [];
    for (let j = 0; j < N; j++) if (j !== i) { const dx = nodes[i][0] - nodes[j][0], dy = nodes[i][1] - nodes[j][1], dz = nodes[i][2] - nodes[j][2]; d.push([dx * dx + dy * dy + dz * dz, j]); }
    d.sort(function (a, b) { return a[0] - b[0]; });
    for (let k = 0; k < 3; k++) { const a = Math.min(i, d[k][1]), b = Math.max(i, d[k][1]), key = a + '_' + b; if (!seen[key]) { seen[key] = 1; edges.push([a, b]); } }
  }
  const ngeo = new THREE.BufferGeometry(); ngeo.setAttribute('position', new THREE.BufferAttribute(npos, 3));
  const nmat = new THREE.PointsMaterial({ size: 0.13, color: new THREE.Color(LILAC), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
  const points = new THREE.Points(ngeo, nmat);
  const lpos = new Float32Array(edges.length * 2 * 3);
  for (let e = 0; e < edges.length; e++) { const a = nodes[edges[e][0]], b = nodes[edges[e][1]]; lpos[e * 6] = a[0]; lpos[e * 6 + 1] = a[1]; lpos[e * 6 + 2] = a[2]; lpos[e * 6 + 3] = b[0]; lpos[e * 6 + 4] = b[1]; lpos[e * 6 + 5] = b[2]; }
  const lgeo = new THREE.BufferGeometry(); lgeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3));
  const lmat = new THREE.LineBasicMaterial({ color: new THREE.Color(0x7c5fe0), transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false });
  const lines = new THREE.LineSegments(lgeo, lmat);
  const SIG = 20, spos = new Float32Array(SIG * 3), sig = [];
  for (let s = 0; s < SIG; s++) sig.push({ e: Math.floor(Math.random() * edges.length), t: Math.random(), spd: 0.45 + Math.random() * 0.8 });
  const sgeo = new THREE.BufferGeometry(); sgeo.setAttribute('position', new THREE.BufferAttribute(spos, 3));
  const smat = new THREE.PointsMaterial({ size: 0.17, color: new THREE.Color(CYAN), transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
  const signals = new THREE.Points(sgeo, smat);
  const grp = new THREE.Group(); grp.add(lines, points, signals);
  return {
    group: grp,
    update(t, p, scrollN, dt) {
      for (let s = 0; s < SIG; s++) {
        const o = sig[s]; o.t += o.spd * dt;
        if (o.t >= 1) { o.t = 0; o.e = Math.floor(Math.random() * edges.length); o.spd = 0.45 + Math.random() * 0.8; }
        const a = nodes[edges[o.e][0]], b = nodes[edges[o.e][1]], tt = o.t;
        spos[s * 3] = a[0] + (b[0] - a[0]) * tt; spos[s * 3 + 1] = a[1] + (b[1] - a[1]) * tt; spos[s * 3 + 2] = a[2] + (b[2] - a[2]) * tt;
      }
      sgeo.attributes.position.needsUpdate = true;
      nmat.opacity = 0.72 + Math.sin(t * 2.0) * 0.22;
      grp.rotation.y = t * 0.18 + p.x * 0.8 + scrollN * 1.2; grp.rotation.x = p.y * 0.5 + scrollN * 0.4;
    }
  };
}

/* ---- 3D robot (shows during the brain state) ---- */
function makeRobot() {
  const g = new THREE.Group();
  const shell = new THREE.MeshStandardMaterial({ color: 0x2a2350, metalness: 0.5, roughness: 0.35, emissive: 0x160f30, emissiveIntensity: 0.7 });
  const eye = new THREE.MeshBasicMaterial({ color: 0x9be7ff });
  const headGeo = new THREE.BoxGeometry(0.9, 0.7, 0.7);
  const head = new THREE.Mesh(headGeo, shell);
  head.add(new THREE.LineSegments(new THREE.EdgesGeometry(headGeo), new THREE.LineBasicMaterial({ color: VIOLET })));
  const eL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), eye); eL.position.set(-0.18, 0.04, 0.36);
  const eR = eL.clone(); eR.position.x = 0.18;
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 8), new THREE.MeshBasicMaterial({ color: VIOLET })); ant.position.set(0, 0.46, 0);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), new THREE.MeshBasicMaterial({ color: PINK })); tip.position.set(0, 0.58, 0);
  const earGeo = new THREE.BoxGeometry(0.1, 0.24, 0.24);
  const earL = new THREE.Mesh(earGeo, shell); earL.position.set(-0.5, 0, 0);
  const earR = earL.clone(); earR.position.x = 0.5;
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.16, 4, 12), shell); body.position.set(0, -0.62, 0); body.scale.set(1, 0.85, 0.7);
  head.add(eL, eR, ant, tip, earL, earR);
  g.add(head, body);
  g.position.set(0, -0.05, 1.6); g.scale.setScalar(0.92);
  return {
    group: g, head: head, tip: tip,
    update(t, p) {
      g.position.y = -0.05 + Math.sin(t * 1.7) * 0.07;
      head.rotation.y = p.x * 0.6; head.rotation.x = p.y * 0.4;
      tip.material.opacity = 1; tip.scale.setScalar(0.9 + Math.sin(t * 5) * 0.18);
    }
  };
}

/* ---- state 3: software (cloud + devices + data + code) ---- */
function glyphTex(ch) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'); x.clearRect(0, 0, 64, 64);
  x.font = 'bold 34px monospace'; x.fillStyle = '#7ef2d8'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(ch, 32, 34);
  const tex = new THREE.CanvasTexture(c); tex.minFilter = THREE.LinearFilter; return tex;
}
function wire(geo, color, op) {
  return new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: op == null ? 0.85 : op }));
}
function makeSoftware() {
  const grp = new THREE.Group();
  // cloud (cluster of faceted wire balls)
  const cloud = new THREE.Group();
  [[0, 0, 0, 0.5], [-0.42, -0.04, 0.05, 0.34], [0.42, -0.04, -0.05, 0.34], [0.18, 0.2, 0, 0.3], [-0.2, 0.16, 0.05, 0.27]]
    .forEach(function (c) { const m = wire(new THREE.IcosahedronGeometry(c[3], 0), LILAC, 0.7); m.position.set(c[0], c[1], c[2]); cloud.add(m); });
  cloud.position.set(0, 0.55, 0); grp.add(cloud);
  // devices orbiting the cloud
  const devices = [];
  function device(mesh, ang, rad, yOff, spin) { const piv = new THREE.Group(); mesh.position.set(rad, yOff, 0); piv.add(mesh); piv.rotation.y = ang; grp.add(piv); devices.push({ piv: piv, mesh: mesh, ang: ang, rad: rad, yOff: yOff, spin: spin }); return mesh; }
  const phone = new THREE.Group(); phone.add(wire(new THREE.BoxGeometry(0.42, 0.84, 0.06), VIOLET)); device(phone, 0.4, 1.9, -0.1, 0.5);
  const browser = new THREE.Group(); browser.add(wire(new THREE.BoxGeometry(1.0, 0.72, 0.05), BLUE)); const bar = wire(new THREE.BoxGeometry(1.0, 0.14, 0.05), BLUE); bar.position.y = 0.29; browser.add(bar); device(browser, 2.6, 2.0, 0.15, -0.4);
  const server = new THREE.Group(); [-0.18, 0, 0.18].forEach(function (yy) { const s = wire(new THREE.CylinderGeometry(0.32, 0.32, 0.14, 18), 0x9b87ff); s.position.y = yy; server.add(s); }); device(server, 4.7, 1.85, -0.05, 0.3);
  // connections cloud -> devices, with travelling data dots
  const cc = new THREE.Vector3(0, 0.55, 0);
  const clpos = new Float32Array(devices.length * 2 * 3);
  const clgeo = new THREE.BufferGeometry(); clgeo.setAttribute('position', new THREE.BufferAttribute(clpos, 3));
  const clmat = new THREE.LineBasicMaterial({ color: new THREE.Color(CYAN), transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });
  const conn = new THREE.LineSegments(clgeo, clmat); grp.add(conn);
  const DOT = devices.length, dpos = new Float32Array(DOT * 3), dphase = [];
  for (let i = 0; i < DOT; i++) dphase.push(Math.random());
  const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dmat = new THREE.PointsMaterial({ size: 0.16, color: new THREE.Color(CYAN), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const dots = new THREE.Points(dgeo, dmat); grp.add(dots);
  // drifting code glyphs (matrix flavour)
  const chars = ['0', '1', '{', '}', ';', '/', '<', '>', '#', '=', '*', '+'];
  const texs = chars.map(glyphTex);
  const GL = 16, glyphs = [];
  for (let i = 0; i < GL; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: texs[i % texs.length], transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
    sp.position.set((Math.random() - 0.5) * 4.2, Math.random() * 3.4 - 1.2, (Math.random() - 0.5) * 2.4);
    sp.scale.setScalar(0.34); grp.add(sp); glyphs.push({ sp: sp, spd: 0.5 + Math.random() * 0.9 });
  }
  const v = new THREE.Vector3();
  return {
    group: grp,
    update(t, p, scrollN, dt) {
      for (let i = 0; i < devices.length; i++) {
        const d = devices[i]; d.piv.rotation.y = d.ang + t * 0.25; d.mesh.rotation.y = t * d.spin; d.mesh.rotation.x = Math.sin(t * 0.6 + i) * 0.15;
        d.mesh.getWorldPosition(v); grp.worldToLocal(v);
        clpos[i * 6] = cc.x; clpos[i * 6 + 1] = cc.y; clpos[i * 6 + 2] = cc.z;
        clpos[i * 6 + 3] = v.x; clpos[i * 6 + 4] = v.y; clpos[i * 6 + 5] = v.z;
        dphase[i] += dt * 0.5; if (dphase[i] > 1) dphase[i] -= 1; const tt = dphase[i];
        dpos[i * 3] = cc.x + (v.x - cc.x) * tt; dpos[i * 3 + 1] = cc.y + (v.y - cc.y) * tt; dpos[i * 3 + 2] = cc.z + (v.z - cc.z) * tt;
      }
      clgeo.attributes.position.needsUpdate = true; dgeo.attributes.position.needsUpdate = true;
      for (let i = 0; i < glyphs.length; i++) { const gl = glyphs[i]; gl.sp.position.y -= gl.spd * dt; if (gl.sp.position.y < -1.7) { gl.sp.position.y = 2.2; gl.sp.position.x = (Math.random() - 0.5) * 4.2; } }
      cloud.rotation.y = t * 0.2;
      grp.rotation.y = t * 0.06 + p.x * 0.6 + scrollN * 1.0; grp.rotation.x = p.y * 0.35 + scrollN * 0.3;
    }
  };
}

/* ---- engine ---- */
export function createHero(canvas, opts) {
  opts = opts || {};
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true }); }
  catch (e) { if (canvas) canvas.style.display = 'none'; return { dispose() {}, reset() {}, next() {} }; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearAlpha(0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100); camera.position.z = 5.2;
  scene.add(new THREE.AmbientLight(0x556088, 0.8));
  const dl = new THREE.DirectionalLight(0xffffff, 1.6); dl.position.set(3, 4, 5); scene.add(dl);
  const dl2 = new THREE.DirectionalLight(0x6699ff, 0.6); dl2.position.set(-4, -2, 2); scene.add(dl2);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const particles = makeParticles();
  const states = [makeOrb(), makeBrain(), makeSoftware()];
  const robot = makeRobot();
  scene.add(particles.group, robot.group);
  states.forEach(function (s, i) { scene.add(s.group); s.shown = i === 0 ? 1 : 0; if (i !== 0) { s.group.visible = false; s.group.scale.setScalar(0.001); } });
  robot.shown = 0; robot.group.visible = false; robot.group.scale.setScalar(0.001);

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let scrollN = 0, current = 0, raf = 0, stopped = false, last = performance.now();
  const NAMES = ['orb', 'brain', 'software'];

  function resize() { const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  resize();
  const ro = new ResizeObserver(resize); ro.observe(canvas);
  function onMove(e) { pointer.tx = e.clientX / window.innerWidth - 0.5; pointer.ty = e.clientY / window.innerHeight - 0.5; }
  function onScroll() { scrollN = Math.min(window.scrollY / 700, 1); }
  function onClick() { next(); }
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  canvas.addEventListener('click', onClick);

  function setState(i) { current = ((i % 3) + 3) % 3; if (opts.onState) opts.onState(current, NAMES[current]); }
  function next() { setState(current + 1); }
  function reset() { setState(0); }
  function smooth(x) { x = Math.min(Math.max(x, 0), 1); return x * x * (3 - 2 * x); }
  setState(0);

  const start = performance.now(), tmp = new THREE.Vector3();
  function frame(now) {
    if (stopped) return;
    let dt = (now - last) / 1000; last = now; if (dt > 0.05) dt = 0.05;
    const t = reduce ? 0 : (now - start) / 1000;
    pointer.x += (pointer.tx - pointer.x) * 0.06; pointer.y += (pointer.ty - pointer.y) * 0.06;

    particles.update(t, pointer);
    for (let i = 0; i < states.length; i++) {
      const s = states[i], tg = i === current ? 1 : 0;
      s.shown += (tg - s.shown) * 0.09; const vis = smooth(s.shown);
      s.group.visible = vis > 0.01; s.group.scale.setScalar(Math.max(vis, 0.001));
      if (s.group.visible) s.update(t, pointer, scrollN, reduce ? 0.016 : dt);
    }
    const rt = current === 1 ? 1 : 0;
    robot.shown += (rt - robot.shown) * 0.1; const rvis = smooth(robot.shown);
    robot.group.visible = rvis > 0.01; robot.group.scale.setScalar(Math.max(rvis * 0.92, 0.001));
    if (robot.group.visible) robot.update(t, pointer);

    if (opts.speechEl) {
      if (current === 1 && robot.shown > 0.55) {
        robot.head.getWorldPosition(tmp); tmp.project(camera);
        const rect = canvas.getBoundingClientRect();
        const sx = rect.left + (tmp.x * 0.5 + 0.5) * rect.width;
        const sy = rect.top + (-tmp.y * 0.5 + 0.5) * rect.height;
        opts.speechEl.style.left = sx + 'px'; opts.speechEl.style.top = sy + 'px';
        opts.speechEl.classList.add('show');
      } else { opts.speechEl.classList.remove('show'); }
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return {
    next: next, reset: reset,
    dispose() {
      stopped = true; cancelAnimationFrame(raf); ro.disconnect();
      window.removeEventListener('pointermove', onMove); window.removeEventListener('scroll', onScroll);
      canvas.removeEventListener('click', onClick);
      scene.traverse(function (o) {
        if (o.geometry && o.geometry.dispose) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { if (m.map && m.map.dispose) m.map.dispose(); m.dispose && m.dispose(); });
      });
      renderer.dispose();
    }
  };
}
