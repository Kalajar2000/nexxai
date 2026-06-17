// NEXXAI hero 3D — living AI scene (build 5). Soft round particles, a
// holographic robot, a soft cloud, solid holo devices and cursor-reactive
// matrix code. Click cycles: orb -> AI brain (+robot) -> software -> back.
import * as THREE from 'three';

const VIOLET = 0x8b5cf6, BLUE = 0x3b82f6, PINK = 0xec4899, CYAN = 0x5eead4, LILAC = 0xcdb6ff;

/* ---- soft round sprite/point texture (kills the square look) ---- */
function softTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.82)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearFilter; return t;
}
function glyphTex(ch, color) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'); x.clearRect(0, 0, 64, 64);
  x.font = 'bold 42px monospace'; x.fillStyle = color; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(ch, 32, 34);
  const t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearFilter; return t;
}
const SOFT = softTex();

function roundPoints(opts) {
  return new THREE.PointsMaterial(Object.assign({ map: SOFT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }, opts));
}

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

/* ---- holographic material (shared) ---- */
function makeHolo() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: `varying vec3 vN; varying vec3 vV; varying float vY;
      void main(){ vec4 wp=modelMatrix*vec4(position,1.0); vY=wp.y; vN=normalize(mat3(modelMatrix)*normal); vV=normalize(cameraPosition-wp.xyz); gl_Position=projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: `uniform float uTime; varying vec3 vN; varying vec3 vV; varying float vY;
      void main(){
        float fres=pow(1.0-max(dot(normalize(vN),normalize(vV)),0.0),2.0);
        float scan=0.5+0.5*sin(vY*42.0-uTime*5.0);
        vec3 cA=vec3(0.36,0.86,0.93), cB=vec3(0.55,0.36,0.96);
        vec3 col=mix(cA,cB,fres)*(0.55+fres*0.9);
        float a=fres*0.8+scan*0.12+0.16;
        gl_FragColor=vec4(col,a);
      }`
  });
}

/* ---- ambient particle field ---- */
function makeParticles() {
  const N = 80, pos = new Float32Array(N * 3), base = [];
  for (let i = 0; i < N; i++) {
    const r = 2.8 * Math.cbrt(Math.random()), th = Math.random() * 6.283, ph = Math.acos(2 * Math.random() - 1);
    const x = r * Math.sin(ph) * Math.cos(th), y = r * Math.sin(ph) * Math.sin(th), z = r * Math.cos(ph);
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; base.push([x, y, z]);
  }
  const pgeo = new THREE.BufferGeometry(); pgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const points = new THREE.Points(pgeo, roundPoints({ size: 0.07, color: new THREE.Color(LILAC), opacity: 0.6 }));
  const lpos = new Float32Array(N * N * 3);
  const lgeo = new THREE.BufferGeometry(); lgeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3));
  const lines = new THREE.LineSegments(lgeo, new THREE.LineBasicMaterial({ color: new THREE.Color(0x6f5bd6), transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false }));
  const grp = new THREE.Group(); grp.add(points, lines);
  const pa = pgeo.attributes.position.array, TH = 0.95;
  return {
    group: grp,
    update(t, p) {
      for (let i = 0; i < N; i++) { const b = base[i]; pa[i * 3] = b[0] + Math.sin(t * 0.5 + i) * 0.08; pa[i * 3 + 1] = b[1] + Math.cos(t * 0.4 + i * 1.3) * 0.08; pa[i * 3 + 2] = b[2] + Math.sin(t * 0.3 + i * 0.7) * 0.08; }
      pgeo.attributes.position.needsUpdate = true;
      let k = 0;
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) { const dx = pa[i * 3] - pa[j * 3], dy = pa[i * 3 + 1] - pa[j * 3 + 1], dz = pa[i * 3 + 2] - pa[j * 3 + 2]; if (dx * dx + dy * dy + dz * dz < TH * TH) { lpos[k++] = pa[i * 3]; lpos[k++] = pa[i * 3 + 1]; lpos[k++] = pa[i * 3 + 2]; lpos[k++] = pa[j * 3]; lpos[k++] = pa[j * 3 + 1]; lpos[k++] = pa[j * 3 + 2]; } }
      lgeo.setDrawRange(0, k / 3); lgeo.attributes.position.needsUpdate = true;
      grp.rotation.y = t * 0.05 + p.x * 0.4; grp.rotation.x = p.y * 0.25;
    }
  };
}

/* ---- state 1: liquid orb ---- */
function makeOrb() {
  const uniforms = { uTime: { value: 0 } };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true,
    vertexShader: SNOISE + `uniform float uTime; varying float vN; varying vec3 vNrm; varying vec3 vView;
      void main(){
        float t=uTime;
        float n1=snoise(position*0.75 + vec3(0.0,t*0.28,0.0));
        float n2=snoise(position*1.7 + vec3(t*0.22,0.0,t*0.16) + n1*0.8);
        float n3=snoise(position*3.4 - t*0.12)*0.22;
        float disp=n1*0.62 + n2*0.42 + n3; vN=disp;
        vec3 pp=position+normal*disp*0.34;
        vec4 mv=modelViewMatrix*vec4(pp,1.0);
        vNrm=normalize(normalMatrix*normal); vView=normalize(-mv.xyz);
        gl_Position=projectionMatrix*mv;
      }`,
    fragmentShader: `uniform float uTime; varying float vN; varying vec3 vNrm; varying vec3 vView;
      void main(){
        vec3 violet=vec3(0.545,0.361,0.965), blue=vec3(0.231,0.510,0.965), pink=vec3(0.925,0.282,0.600), cyan=vec3(0.36,0.86,0.93);
        float m=smoothstep(-1.0,1.0,vN);
        vec3 col=mix(blue,violet,m);
        col=mix(col,pink,smoothstep(0.5,1.0,m)*0.6);
        col=mix(col,cyan,smoothstep(0.0,-1.0,vN)*0.22);
        float fres=pow(1.0-max(dot(normalize(vNrm),normalize(vView)),0.0),2.2);
        col+=fres*0.6;
        float iri=0.5+0.5*sin(fres*10.0 + vN*5.0 + uTime*1.2);
        col+=vec3(0.12,0.06,0.18)*iri*0.5;
        gl_FragColor=vec4(col,1.0);
      }`
  });
  const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 5), mat);
  const grp = new THREE.Group(); grp.add(mesh);
  return { group: grp, update(t, p) { uniforms.uTime.value = t; mesh.rotation.y = t * 0.12 + p.x * 0.6; mesh.rotation.x = p.y * 0.4; } };
}

/* ---- state 2: AI neural-network brain ---- */
function makeBrain() {
  const N = 46, R = 1.5, nodes = [], npos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { const y = 1 - (i / (N - 1)) * 2, rr = Math.sqrt(Math.max(1 - y * y, 0)), phi = i * 2.399963, rad = R * (0.8 + Math.random() * 0.2); const x = Math.cos(phi) * rr * rad, z = Math.sin(phi) * rr * rad, yy = y * rad; nodes.push([x, yy, z]); npos[i * 3] = x; npos[i * 3 + 1] = yy; npos[i * 3 + 2] = z; }
  const edges = [], seen = {};
  for (let i = 0; i < N; i++) { const d = []; for (let j = 0; j < N; j++) if (j !== i) { const dx = nodes[i][0] - nodes[j][0], dy = nodes[i][1] - nodes[j][1], dz = nodes[i][2] - nodes[j][2]; d.push([dx * dx + dy * dy + dz * dz, j]); } d.sort(function (a, b) { return a[0] - b[0]; }); for (let k = 0; k < 3; k++) { const a = Math.min(i, d[k][1]), b = Math.max(i, d[k][1]), key = a + '_' + b; if (!seen[key]) { seen[key] = 1; edges.push([a, b]); } } }
  const ngeo = new THREE.BufferGeometry(); ngeo.setAttribute('position', new THREE.BufferAttribute(npos, 3));
  const nmat = roundPoints({ size: 0.16, color: new THREE.Color(LILAC), opacity: 0.95 });
  const points = new THREE.Points(ngeo, nmat);
  const lpos = new Float32Array(edges.length * 2 * 3);
  for (let e = 0; e < edges.length; e++) { const a = nodes[edges[e][0]], b = nodes[edges[e][1]]; lpos[e * 6] = a[0]; lpos[e * 6 + 1] = a[1]; lpos[e * 6 + 2] = a[2]; lpos[e * 6 + 3] = b[0]; lpos[e * 6 + 4] = b[1]; lpos[e * 6 + 5] = b[2]; }
  const lgeo = new THREE.BufferGeometry(); lgeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3));
  const lines = new THREE.LineSegments(lgeo, new THREE.LineBasicMaterial({ color: new THREE.Color(0x7c5fe0), transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false }));
  const SIG = 20, spos = new Float32Array(SIG * 3), sig = [];
  for (let s = 0; s < SIG; s++) sig.push({ e: Math.floor(Math.random() * edges.length), t: Math.random(), spd: 0.45 + Math.random() * 0.8 });
  const sgeo = new THREE.BufferGeometry(); sgeo.setAttribute('position', new THREE.BufferAttribute(spos, 3));
  const signals = new THREE.Points(sgeo, roundPoints({ size: 0.2, color: new THREE.Color(CYAN), opacity: 1 }));
  const grp = new THREE.Group(); grp.add(lines, points, signals);
  return {
    group: grp,
    update(t, p, scrollN, dt) {
      for (let s = 0; s < SIG; s++) { const o = sig[s]; o.t += o.spd * dt; if (o.t >= 1) { o.t = 0; o.e = Math.floor(Math.random() * edges.length); o.spd = 0.45 + Math.random() * 0.8; } const a = nodes[edges[o.e][0]], b = nodes[edges[o.e][1]], tt = o.t; spos[s * 3] = a[0] + (b[0] - a[0]) * tt; spos[s * 3 + 1] = a[1] + (b[1] - a[1]) * tt; spos[s * 3 + 2] = a[2] + (b[2] - a[2]) * tt; }
      sgeo.attributes.position.needsUpdate = true;
      nmat.opacity = 0.72 + Math.sin(t * 2.0) * 0.22;
      grp.rotation.y = t * 0.18 + p.x * 0.8 + scrollN * 1.2; grp.rotation.x = p.y * 0.5 + scrollN * 0.4;
    }
  };
}

/* ---- holographic robot (brain state) ---- */
function makeRobot(holo) {
  const g = new THREE.Group();
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.44, 30, 24), holo); head.scale.set(1, 0.95, 0.92);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.42, 8, 18), holo); torso.position.y = -0.66;
  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.34, 6, 12), holo); armL.position.set(-0.44, -0.58, 0); armL.rotation.z = 0.32;
  const armR = armL.clone(); armR.position.x = 0.44; armR.rotation.z = -0.32;
  const ant = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.16, 4, 8), holo); ant.position.set(0, 0.52, 0);
  const eyeMat = new THREE.SpriteMaterial({ map: SOFT, color: 0x9be7ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const eL = new THREE.Sprite(eyeMat); eL.position.set(-0.15, 0.05, 0.4); eL.scale.setScalar(0.17);
  const eR = eL.clone(); eR.position.x = 0.15;
  const tip = new THREE.Sprite(new THREE.SpriteMaterial({ map: SOFT, color: PINK, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); tip.position.set(0, 0.64, 0); tip.scale.setScalar(0.16);
  head.add(eL, eR, ant, tip);
  g.add(head, torso, armL, armR);
  g.position.set(0, -0.02, 1.5); g.scale.setScalar(0.95);
  return {
    group: g, head: head,
    update(t, p) { g.position.y = -0.02 + Math.sin(t * 1.7) * 0.07; head.rotation.y = p.x * 0.6; head.rotation.x = p.y * 0.4; tip.scale.setScalar(0.14 + Math.sin(t * 5) * 0.04); }
  };
}

/* ---- state 3: GLOBAL CLOUD — laptop projecting a cloud + data flow to devices/code ---- */
function makeSoftware(holo) {
  const grp = new THREE.Group();
  const core = new THREE.Group(); core.scale.setScalar(0.82); grp.add(core);
  const BASE_Y = 0.2, BASE_X = -0.12;
  const blinkers = [];

  function neonMat(color, op) { return new THREE.LineBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false }); }
  function fillMat(color, op) { return new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }); }
  function wireMat(color, op) { return new THREE.MeshBasicMaterial({ color: new THREE.Color(color), wireframe: true, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false }); }
  function edgesOf(geo, color, op) { return new THREE.LineSegments(new THREE.EdgesGeometry(geo), neonMat(color, op)); }
  function neonBox(w, h, d, color, fillOp) { const g = new THREE.Group(); const bg = new THREE.BoxGeometry(w, h, d); g.add(new THREE.Mesh(bg, fillMat(color, fillOp == null ? 0.05 : fillOp))); g.add(edgesOf(bg, color, 0.85)); return g; }
  function glow(color, scale, op) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: SOFT, color: new THREE.Color(color), transparent: true, opacity: op == null ? 0.8 : op, blending: THREE.AdditiveBlending, depthWrite: false })); s.scale.setScalar(scale); return s; }
  function row(w, color, op) { return new THREE.Mesh(new THREE.PlaneGeometry(w, 0.035), fillMat(color, op == null ? 0.55 : op)); }
  function dot(color, scale) { return glow(color, scale, 0.95); }
  function labelSprite(text) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d');
    x.font = 'bold 56px Montserrat, Arial, sans-serif'; x.fillStyle = '#cfeeff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.shadowColor = '#5be0ff'; x.shadowBlur = 22; x.fillText(text, 256, 66);
    const tx = new THREE.CanvasTexture(c); tx.minFilter = THREE.LinearFilter;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true, opacity: 0.95, depthWrite: false })); sp.scale.set(1.35, 0.34, 1); return sp;
  }
  function codeTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
    x.font = '15px monospace'; x.textBaseline = 'top';
    for (let r = 0; r < 12; r++) { let s = ''; const n = 6 + Math.floor(Math.random() * 9); for (let k = 0; k < n; k++) s += Math.random() < 0.5 ? '0' : '1'; x.fillStyle = r % 4 === 0 ? '#9be7ff' : 'rgba(120,200,255,0.6)'; x.fillText(s, 10 + (r % 3) * 12, 10 + r * 20); }
    const tx = new THREE.CanvasTexture(c); tx.minFilter = THREE.LinearFilter; return tx;
  }

  // ---------- laptop projecting the cloud ----------
  const laptop = new THREE.Group();
  const screenBox = neonBox(1.55, 0.98, 0.05, VIOLET, 0.04); screenBox.position.set(0, -0.88, 0);
  const screenFace = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.84), new THREE.MeshBasicMaterial({ map: codeTexture(), transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false })); screenFace.position.set(0, -0.88, 0.04);
  const deck = neonBox(1.72, 0.07, 0.92, VIOLET, 0.05); deck.position.set(0, -1.42, 0.4); deck.rotation.x = 1.3;
  const lglow = glow(0x6a4bd8, 1.9, 0.18); lglow.position.set(0, -0.95, -0.1);
  laptop.add(lglow, screenBox, screenFace, deck); core.add(laptop);

  // ---------- cloud (top) ----------
  const cloud = new THREE.Group(); cloud.position.set(0, 1.12, 0);
  const cglow = glow(0x8b5cf6, 2.4, 0.28); cloud.add(cglow);
  [[0, 0, 0, 0.6], [-0.62, -0.05, 0, 0.46], [0.62, -0.05, 0, 0.46], [0.3, 0.26, 0.05, 0.42], [-0.32, 0.24, 0.05, 0.4], [0, -0.12, -0.05, 0.5]].forEach(function (c, i) {
    const sg = new THREE.SphereGeometry(c[3], 18, 14);
    const body = new THREE.Mesh(sg, fillMat(i % 2 ? 0x6aa8ff : VIOLET, 0.13)); body.position.set(c[0], c[1], c[2]);
    const wire = new THREE.Mesh(sg, wireMat(0x7fe6ff, 0.2)); wire.position.copy(body.position);
    cloud.add(body, wire);
  });
  const cloudLabel = labelSprite('GLOBAL CLOUD'); cloudLabel.position.set(0, 0.02, 0.62); cloud.add(cloudLabel);
  core.add(cloud);

  // ---------- modules ----------
  const modules = [];
  function place(g, x, y, z) { g.position.set(x, y, z); core.add(g); return g; }

  // server racks
  const server = new THREE.Group(); server.add(neonBox(0.6, 1.0, 0.46, VIOLET, 0.05));
  for (let i = 0; i < 4; i++) { const r = row(0.5, 0x7fe6ff, 0.45); r.position.set(0, 0.36 - i * 0.24, 0.24); server.add(r); const led = dot(i % 2 ? 0x6ee7b7 : 0xff79c6, 0.12); led.position.set(0.18, 0.36 - i * 0.24, 0.26); server.add(led); blinkers.push({ sp: led, ph: Math.random() }); }
  place(server, -1.95, 0.18, -0.1); modules.push({ anchor: new THREE.Vector3(-1.95, 0.6, -0.1) });

  // database (stacked cylinders)
  const database = new THREE.Group();
  [-0.26, 0, 0.26].forEach(function (yy) {
    const sub = new THREE.Group(); sub.position.y = yy; const cg = new THREE.CylinderGeometry(0.34, 0.34, 0.18, 22);
    sub.add(new THREE.Mesh(cg, fillMat(VIOLET, 0.1))); sub.add(new THREE.Mesh(cg, wireMat(0x7fe6ff, 0.28)));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.014, 6, 24), neonMat(0x9be7ff, 0.85)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.09; sub.add(ring);
    database.add(sub);
  });
  place(database, -1.0, -0.42, 0.2); modules.push({ anchor: new THREE.Vector3(-1.0, -0.05, 0.2) });

  // browser / web window
  const browser = new THREE.Group(); browser.add(neonBox(1.2, 0.8, 0.04, BLUE, 0.05));
  const bbar = row(1.12, 0x7fe6ff, 0.4); bbar.position.set(0, 0.22, 0.03); browser.add(bbar);
  [0xff6b6b, 0xffd166, 0x6ee7b7].forEach(function (col, i) { const d = dot(col, 0.07); d.position.set(-0.5 + i * 0.1, 0.32, 0.05); browser.add(d); });
  const url = row(0.55, 0x9be7ff, 0.5); url.position.set(0.12, 0.32, 0.04); browser.add(url);
  for (let i = 0; i < 3; i++) { const r = row(0.82 - i * 0.12, 0x7fe6ff, 0.45); r.position.set(-0.14, 0.06 - i * 0.17, 0.04); browser.add(r); }
  place(browser, 1.15, 0.25, 0.05); modules.push({ anchor: new THREE.Vector3(1.15, 0.62, 0.05) });

  // globe (the "global")
  const globe = new THREE.Group(); const gg = new THREE.SphereGeometry(0.46, 16, 12);
  globe.add(new THREE.Mesh(gg, wireMat(0x6fe9ff, 0.3))); globe.add(new THREE.Mesh(gg, fillMat(0x244a8c, 0.12)));
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.012, 6, 32), neonMat(0x9be7ff, 0.7)); globe.add(ring1);
  const ring2 = ring1.clone(); ring2.rotation.x = Math.PI / 2; globe.add(ring2);
  globe.add(glow(0x4aa8ff, 1.3, 0.16));
  place(globe, 1.98, -0.28, -0.05); modules.push({ anchor: new THREE.Vector3(1.98, 0.1, -0.05) });

  // floating code panels (more code stuff)
  function codePanel() {
    const g = new THREE.Group(); g.add(neonBox(0.95, 0.62, 0.03, 0x4f7bff, 0.05));
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.5), new THREE.MeshBasicMaterial({ map: codeTexture(), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })); face.position.z = 0.02; g.add(face); return g;
  }
  const code1 = codePanel(); code1.rotation.y = 0.4; place(code1, -1.55, -1.05, 0.55); modules.push({ anchor: new THREE.Vector3(-1.4, -0.75, 0.55) });
  const code2 = codePanel(); code2.rotation.y = -0.4; place(code2, 1.55, -1.05, 0.55); modules.push({ anchor: new THREE.Vector3(1.4, -0.75, 0.55) });

  // ---------- connectors + travelling data ----------
  const cloudBottom = new THREE.Vector3(0, 0.55, 0), laptopTop = new THREE.Vector3(0, -0.42, 0);
  const segs = [{ a: laptopTop, b: cloudBottom }];
  modules.forEach(function (m) { segs.push({ a: cloudBottom, b: m.anchor }); });
  const lpos = new Float32Array(segs.length * 6);
  segs.forEach(function (s, i) { lpos[i * 6] = s.a.x; lpos[i * 6 + 1] = s.a.y; lpos[i * 6 + 2] = s.a.z; lpos[i * 6 + 3] = s.b.x; lpos[i * 6 + 4] = s.b.y; lpos[i * 6 + 5] = s.b.z; });
  const lgeo = new THREE.BufferGeometry(); lgeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3));
  core.add(new THREE.LineSegments(lgeo, neonMat(0x6fb7ff, 0.3)));
  const M = segs.length * 2, dpos = new Float32Array(M * 3);
  const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  core.add(new THREE.Points(dgeo, roundPoints({ size: 0.16, color: new THREE.Color(0x9be7ff), opacity: 1 })));
  const ddat = [];
  for (let i = 0; i < M; i++) ddat.push({ s: i % segs.length, t: Math.random(), spd: 0.3 + Math.random() * 0.5 });

  return {
    group: grp,
    update(t, p, scrollN, dt) {
      grp.position.y = Math.sin(t * 0.7) * 0.05;
      core.rotation.y = BASE_Y + p.x * 0.4 + scrollN * 0.3;
      core.rotation.x = BASE_X + p.y * 0.22;
      cloud.position.y = 1.12 + Math.sin(t * 0.8) * 0.05;
      cglow.material.opacity = 0.22 + Math.sin(t * 1.4) * 0.08;
      cloudLabel.material.opacity = 0.78 + Math.sin(t * 1.4) * 0.16;
      globe.rotation.y += dt * 0.5;
      for (let i = 0; i < blinkers.length; i++) { blinkers[i].sp.material.opacity = 0.4 + 0.5 * Math.abs(Math.sin(t * 3 + blinkers[i].ph * 6)); }
      for (let i = 0; i < ddat.length; i++) {
        const d = ddat[i]; d.t += d.spd * dt; if (d.t >= 1) { d.t = 0; d.s = Math.floor(Math.random() * segs.length); d.spd = 0.3 + Math.random() * 0.5; }
        const s = segs[d.s]; dpos[i * 3] = s.a.x + (s.b.x - s.a.x) * d.t; dpos[i * 3 + 1] = s.a.y + (s.b.y - s.a.y) * d.t; dpos[i * 3 + 2] = s.a.z + (s.b.z - s.a.z) * d.t;
      }
      dgeo.attributes.position.needsUpdate = true;
    }
  };
}

/* ---- brain-flash overlay (moving pulses inside the robot's glass skull) ---- */
// neural-network "galaxy" of light orbs that surrounds the robot (not on her face)
function makeGalaxy() {
  const N = 84, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), nodes = [];
  const cV = new THREE.Color(0x8b5cf6), cC = new THREE.Color(0x5be0ff), cP = new THREE.Color(0xff5ed0);
  for (let i = 0; i < N; i++) {
    const a = Math.random() * 6.283, b = Math.acos(2 * Math.random() - 1);
    const r = 1.15 + Math.pow(Math.random(), 0.65) * 1.05;          // hollow shell around her
    const x = r * Math.sin(b) * Math.cos(a), y = r * Math.cos(b) * 0.7, z = r * Math.sin(b) * Math.sin(a) * 0.85;
    nodes.push([x, y, z]); pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    const cc = (Math.random() < 0.55) ? cV.clone().lerp(cC, Math.random()) : cP.clone().lerp(cV, Math.random() * 0.7);
    col[i * 3] = cc.r; col[i * 3 + 1] = cc.g; col[i * 3 + 2] = cc.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pmat = roundPoints({ size: 0.15, opacity: 0.95, vertexColors: true });
  const pts = new THREE.Points(geo, pmat);
  const edges = [];
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
    const dx = nodes[i][0] - nodes[j][0], dy = nodes[i][1] - nodes[j][1], dz = nodes[i][2] - nodes[j][2];
    if (dx * dx + dy * dy + dz * dz < 0.62 * 0.62 && edges.length < 150) edges.push([i, j]);
  }
  const lpos = new Float32Array(edges.length * 6);
  for (let k = 0; k < edges.length; k++) { const a = nodes[edges[k][0]], b = nodes[edges[k][1]]; lpos[k * 6] = a[0]; lpos[k * 6 + 1] = a[1]; lpos[k * 6 + 2] = a[2]; lpos[k * 6 + 3] = b[0]; lpos[k * 6 + 4] = b[1]; lpos[k * 6 + 5] = b[2]; }
  const lgeo = new THREE.BufferGeometry(); lgeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3));
  const lmat = new THREE.LineBasicMaterial({ color: 0x6f7cff, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false });
  const lines = new THREE.LineSegments(lgeo, lmat);
  const SIG = 9, spos = new Float32Array(SIG * 3), sig = [];
  for (let s = 0; s < SIG; s++) sig.push({ e: edges.length ? Math.floor(Math.random() * edges.length) : 0, t: Math.random(), spd: 0.35 + Math.random() * 0.6 });
  const sgeo = new THREE.BufferGeometry(); sgeo.setAttribute('position', new THREE.BufferAttribute(spos, 3));
  const sigPts = new THREE.Points(sgeo, roundPoints({ size: 0.16, color: new THREE.Color(0x9be7ff), opacity: 1 }));
  const g = new THREE.Group(); g.add(lines, pts, sigPts);
  return {
    group: g,
    update(t, dt) {
      g.rotation.y = t * 0.1; g.rotation.x = Math.sin(t * 0.13) * 0.12;
      if (edges.length) { for (let s = 0; s < SIG; s++) { const o = sig[s]; o.t += o.spd * dt; if (o.t >= 1) { o.t = 0; o.e = Math.floor(Math.random() * edges.length); } const a = nodes[edges[o.e][0]], b = nodes[edges[o.e][1]], tt = o.t; spos[s * 3] = a[0] + (b[0] - a[0]) * tt; spos[s * 3 + 1] = a[1] + (b[1] - a[1]) * tt; spos[s * 3 + 2] = a[2] + (b[2] - a[2]) * tt; } sgeo.attributes.position.needsUpdate = true; }
      pmat.opacity = 0.72 + Math.sin(t * 1.8) * 0.18;
    }
  };
}

/* ---- engine ---- */
export function createHero(canvas, opts) {
  opts = opts || {};
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true }); }
  catch (e) { if (canvas) canvas.style.display = 'none'; return { dispose() {}, reset() {}, next() {} }; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearAlpha(0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100); camera.position.z = 5.2;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const holo = makeHolo();

  const particles = makeParticles();
  let sw; try { sw = makeSoftware(holo); } catch (e) { sw = { group: new THREE.Group(), update: function () {} }; }
  const states = [makeOrb(), makeBrain(), sw];
  scene.add(particles.group);
  states.forEach(function (s, i) { scene.add(s.group); s.shown = i === 0 ? 1 : 0; if (i !== 0) { s.group.visible = false; s.group.scale.setScalar(0.001); } });

  // lights (only the GLB robot's PBR materials respond; unlit scene elements ignore these).
  // Brighter + a hemisphere fill + a RoomEnvironment env map (added in loadRobot) so her
  // full porcelain colours and glowing circuitry read clearly instead of looking dark.
  scene.add(new THREE.AmbientLight(0xc7ccff, 1.2));
  scene.add(new THREE.HemisphereLight(0xbcd0ff, 0x3a2d5c, 0.85));
  var kl = new THREE.DirectionalLight(0xffffff, 2.1); kl.position.set(2, 3, 4); scene.add(kl);
  var fl = new THREE.DirectionalLight(0x8aa0ff, 0.85); fl.position.set(-3, -1, 2); scene.add(fl);
  var rimL = new THREE.DirectionalLight(0xff79c6, 0.7); rimL.position.set(0, 2, -4); scene.add(rimL);
  var frontL = new THREE.DirectionalLight(0xffffff, 1.25); frontL.position.set(0, 0.6, 6); scene.add(frontL);

  // robot (Higgsfield porcelain GLB), lazy-loaded after first paint, shown in the brain state
  var HH = 2.0;
  var robotHolder = new THREE.Group(); robotHolder.visible = false; robotHolder.scale.setScalar(0.001); robotHolder.position.set(0, -0.3, 0.7); scene.add(robotHolder);
  var robot = null, robotShown = 0, robotLoading = false;
  function loadRobot() {
    if (robotLoading) return; robotLoading = true;
    (async function () {
      try {
        var mods = await Promise.all([import('three/addons/loaders/GLTFLoader.js'), import('three/addons/loaders/DRACOLoader.js'), import('three/addons/environments/RoomEnvironment.js')]);
        try { var pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new mods[2].RoomEnvironment(), 0.04).texture; } catch (e) {}
        var draco = new mods[1].DRACOLoader(); draco.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/gltf/');
        var loader = new mods[0].GLTFLoader(); loader.setDRACOLoader(draco);
        loader.load(opts.robotUrl || 'assets/robot.glb?v=3', function (gltf) {
          var model = gltf.scene;
          model.traverse(function (o) {
            if (o.isMesh && o.material) {
              (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) {
                if ('envMapIntensity' in m) m.envMapIntensity = 1.5;
                if (m.emissive && (m.emissive.r + m.emissive.g + m.emissive.b) > 0.05) m.emissiveIntensity = (m.emissiveIntensity || 1) * 1.7;
                m.needsUpdate = true;
              });
            }
          });
          var box = new THREE.Box3().setFromObject(model), size = new THREE.Vector3(), center = new THREE.Vector3();
          box.getSize(size); box.getCenter(center);
          var sc = HH / (size.y || 1);
          model.position.sub(center);
          var wrap = new THREE.Group(); wrap.add(model); wrap.scale.setScalar(sc); robotHolder.add(wrap);
          var halo = makeGalaxy(); halo.group.position.set(0, 0.18, 0); robotHolder.add(halo.group);
          robot = { wrap: wrap, halo: halo };
        }, undefined, function () { robot = null; });
      } catch (e) { robot = null; }
    })();
  }
  if (window.requestIdleCallback) requestIdleCallback(loadRobot, { timeout: 2500 }); else setTimeout(loadRobot, 1500);

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

  function setState(i) { current = ((i % 3) + 3) % 3; if (current === 1) loadRobot(); if (opts.onState) opts.onState(current, NAMES[current]); }
  function next() { setState(current + 1); }
  function reset() { setState(0); }
  function smooth(x) { x = Math.min(Math.max(x, 0), 1); return x * x * (3 - 2 * x); }
  setState(0);

  const start = performance.now(), tmp = new THREE.Vector3();
  function frame(now) {
    if (stopped) return;
    let dt = (now - last) / 1000; last = now; if (dt > 0.05) dt = 0.05;
    const t = reduce ? 0 : (now - start) / 1000;
    holo.uniforms.uTime.value = t;
    pointer.x += (pointer.tx - pointer.x) * 0.06; pointer.y += (pointer.ty - pointer.y) * 0.06;

    particles.update(t, pointer);
    for (let i = 0; i < states.length; i++) {
      const s = states[i], tg = i === current ? 1 : 0;
      s.shown += (tg - s.shown) * 0.09; const vis = smooth(s.shown);
      s.group.visible = vis > 0.01; s.group.scale.setScalar(Math.max(vis, 0.001));
      if (s.group.visible) s.update(t, pointer, scrollN, reduce ? 0.016 : dt);
    }
    var rtg = current === 1 ? 1 : 0;
    robotShown += (rtg - robotShown) * 0.09;
    var rvis = smooth(robotShown);
    robotHolder.visible = rvis > 0.01; robotHolder.scale.setScalar(Math.max(rvis, 0.001));
    if (robot) {
      robotHolder.rotation.y = pointer.x * 0.5 + Math.sin(t * 0.5) * 0.06;
      robotHolder.rotation.x = pointer.y * 0.28 + Math.sin(t * 0.4) * 0.03;
      robotHolder.position.y = -0.3 + Math.sin(t * 1.2) * 0.04;
      robot.halo.update(t, reduce ? 0.016 : dt);
    }
    if (opts.speechEl) {
      if (current === 1 && robotShown > 0.5) {
        tmp.set(0, 0.6, 0.7).project(camera);
        const rect = canvas.getBoundingClientRect();
        var sx = rect.left + (tmp.x * 0.5 + 0.5) * rect.width, sy = rect.top + (-tmp.y * 0.5 + 0.5) * rect.height;
        sx = Math.min(Math.max(sx, 130), window.innerWidth - 130); sy = Math.max(sy, 92);
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
      window.removeEventListener('pointermove', onMove); window.removeEventListener('scroll', onScroll); canvas.removeEventListener('click', onClick);
      scene.traverse(function (o) { if (o.geometry && o.geometry.dispose) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { if (m.map && m.map.dispose) m.map.dispose(); m.dispose && m.dispose(); }); });
      renderer.dispose();
    }
  };
}
