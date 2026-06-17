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
  const N = 110, pos = new Float32Array(N * 3), base = [];
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

/* ---- state 3: software (holographic cloud + devices + data + binary code) ---- */
function makeSoftware(holo) {
  const grp = new THREE.Group();
  const core = new THREE.Group(); grp.add(core);       // rotates: cloud + devices + data
  const codeGrp = new THREE.Group(); grp.add(codeGrp); // near-fixed binary field

  // technological holographic cloud (glowing lumps, not fog)
  const cloud = new THREE.Group();
  [[0, 0, 0, 0.72], [-0.72, -0.1, 0.1, 0.56], [0.72, -0.1, -0.1, 0.56], [0.36, 0.34, 0, 0.52], [-0.4, 0.3, 0.12, 0.48], [0, -0.16, -0.2, 0.62]]
    .forEach(function (c) { const m = new THREE.Mesh(new THREE.SphereGeometry(c[3], 24, 18), holo); m.position.set(c[0], c[1], c[2]); cloud.add(m); });
  cloud.position.set(0, 0.85, 0); core.add(cloud);

  function accent(color) { return new THREE.Sprite(new THREE.SpriteMaterial({ map: SOFT, color: color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); }
  function screen(w, h, color, op) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false })); return m; }

  const devs = [];
  function orbit(obj, ang, rad, y, spin) { const piv = new THREE.Group(); obj.position.set(rad, y, 0); piv.add(obj); core.add(piv); devs.push({ piv: piv, obj: obj, ang: ang, spin: spin }); }

  // phone: body + glowing screen + camera dot
  const phone = new THREE.Group();
  phone.add(new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.9, 0.07), holo));
  const ps = screen(0.34, 0.66, CYAN, 0.18); ps.position.z = 0.041; phone.add(ps);
  const pc = accent(0x9be7ff); pc.position.set(0, 0.37, 0.05); pc.scale.setScalar(0.05); phone.add(pc);
  orbit(phone, 0.5, 2.0, -0.25, 0.4);

  // browser: window + glowing screen + 3 traffic dots
  const browser = new THREE.Group();
  browser.add(new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.72, 0.06), holo));
  const bs = screen(0.92, 0.46, BLUE, 0.16); bs.position.set(0, -0.08, 0.035); browser.add(bs);
  [0xff6b6b, 0xffd166, 0x6ee7b7].forEach(function (col, i) { const d = accent(col); d.position.set(-0.42 + i * 0.08, 0.27, 0.04); d.scale.setScalar(0.045); browser.add(d); });
  orbit(browser, 2.5, 2.1, 0.2, -0.35);

  // server / database: stacked cylinders + status lights
  const server = new THREE.Group();
  [-0.18, 0, 0.18].forEach(function (yy) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.15, 24), holo); s.position.y = yy; server.add(s); const led = accent(0x6ee7b7); led.position.set(0.22, yy, 0.2); led.scale.setScalar(0.05); server.add(led); });
  orbit(server, 4.6, 1.95, -0.05, 0.3);

  // connections + travelling data dots
  const cc = new THREE.Vector3(0, 0.85, 0);
  const clpos = new Float32Array(devs.length * 2 * 3); const clgeo = new THREE.BufferGeometry(); clgeo.setAttribute('position', new THREE.BufferAttribute(clpos, 3));
  const conn = new THREE.LineSegments(clgeo, new THREE.LineBasicMaterial({ color: new THREE.Color(CYAN), transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false })); core.add(conn);
  const dpos = new Float32Array(devs.length * 3); const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dots = new THREE.Points(dgeo, roundPoints({ size: 0.24, color: new THREE.Color(CYAN), opacity: 1 })); core.add(dots);
  const dph = devs.map(function () { return Math.random(); });

  // binary field: only 0/1, lilac by default, green around the cursor
  const tex0 = glyphTex('0', '#ffffff'), tex1 = glyphTex('1', '#ffffff');
  const lilacC = new THREE.Color(LILAC), greenC = new THREE.Color('#46f08a');
  const COLS = 12, ROWS = 7, bits = [];
  for (let c = 0; c < COLS; c++) {
    const cx = -3.6 + 7.2 * c / (COLS - 1);
    for (let r = 0; r < ROWS; r++) {
      const y0 = 2.6 - r * 0.62;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: Math.random() < 0.5 ? tex0 : tex1, color: lilacC.clone(), transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false }));
      sp.position.set(cx, y0, -1.5); sp.scale.setScalar(0.3); codeGrp.add(sp);
      bits.push({ sp: sp, cx: cx, y: y0, spd: 0.4 + Math.random() * 0.5 });
    }
  }

  const v = new THREE.Vector3();
  return {
    group: grp,
    update(t, p, scrollN, dt) {
      for (let i = 0; i < devs.length; i++) {
        const d = devs[i]; d.piv.rotation.y = d.ang + t * 0.2; d.obj.rotation.y = t * d.spin; d.obj.rotation.x = Math.sin(t * 0.5 + i) * 0.1;
        d.obj.getWorldPosition(v); core.worldToLocal(v);
        clpos[i * 6] = cc.x; clpos[i * 6 + 1] = cc.y; clpos[i * 6 + 2] = cc.z; clpos[i * 6 + 3] = v.x; clpos[i * 6 + 4] = v.y; clpos[i * 6 + 5] = v.z;
        dph[i] += dt * 0.5; if (dph[i] > 1) dph[i] -= 1; const tt = dph[i]; dpos[i * 3] = cc.x + (v.x - cc.x) * tt; dpos[i * 3 + 1] = cc.y + (v.y - cc.y) * tt; dpos[i * 3 + 2] = cc.z + (v.z - cc.z) * tt;
      }
      clgeo.attributes.position.needsUpdate = true; dgeo.attributes.position.needsUpdate = true;
      const sx = p.x * 7.0, sy = -p.y * 4.2;
      for (let i = 0; i < bits.length; i++) {
        const b = bits[i]; b.y -= b.spd * dt;
        if (b.y < -2.2) { b.y = 2.8; b.sp.material.map = Math.random() < 0.5 ? tex0 : tex1; b.sp.material.needsUpdate = true; }
        b.sp.position.y = b.y;
        const dx = b.cx - sx, dy = b.y - sy, near = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 1.7);
        b.sp.material.color.copy(lilacC).lerp(greenC, near);
        b.sp.material.opacity = 0.13 + near * 0.85;
      }
      cloud.position.y = 0.85 + Math.sin(t * 0.8) * 0.05; cloud.rotation.y = t * 0.12;
      core.rotation.y = p.x * 0.45 + scrollN * 0.7; core.rotation.x = p.y * 0.28 + scrollN * 0.22;
      codeGrp.rotation.y = p.x * 0.05;
    }
  };
}

/* ---- brain-flash overlay (moving pulses inside the robot's glass skull) ---- */
function makeFlash() {
  const N = 12, R = 0.42, nodes = [], npos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { const a = Math.random() * 6.283, b = Math.acos(2 * Math.random() - 1), r = R * (0.45 + Math.random() * 0.55); const x = r * Math.sin(b) * Math.cos(a), y = r * Math.sin(b) * Math.sin(a) * 0.8, z = r * Math.cos(b); nodes.push([x, y, z]); npos[i * 3] = x; npos[i * 3 + 1] = y; npos[i * 3 + 2] = z; }
  const ngeo = new THREE.BufferGeometry(); ngeo.setAttribute('position', new THREE.BufferAttribute(npos, 3));
  const pmat = roundPoints({ size: 0.16, color: new THREE.Color(0xff5ed0), opacity: 0.9 });
  const pts = new THREE.Points(ngeo, pmat);
  const edges = []; for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) { const dx = nodes[i][0] - nodes[j][0], dy = nodes[i][1] - nodes[j][1], dz = nodes[i][2] - nodes[j][2]; if (dx * dx + dy * dy + dz * dz < (R * 0.95) * (R * 0.95)) edges.push([i, j]); }
  const SIG = 8, spos = new Float32Array(SIG * 3), sig = [];
  for (let s = 0; s < SIG; s++) sig.push({ e: edges.length ? Math.floor(Math.random() * edges.length) : 0, t: Math.random(), spd: 0.6 + Math.random() * 0.9 });
  const sgeo = new THREE.BufferGeometry(); sgeo.setAttribute('position', new THREE.BufferAttribute(spos, 3));
  const sigPts = new THREE.Points(sgeo, roundPoints({ size: 0.2, color: new THREE.Color(0x9be7ff), opacity: 1 }));
  const g = new THREE.Group(); g.add(pts, sigPts);
  return {
    group: g,
    update(t, dt) {
      if (edges.length) { for (let s = 0; s < SIG; s++) { const o = sig[s]; o.t += o.spd * dt; if (o.t >= 1) { o.t = 0; o.e = Math.floor(Math.random() * edges.length); } const a = nodes[edges[o.e][0]], b = nodes[edges[o.e][1]], tt = o.t; spos[s * 3] = a[0] + (b[0] - a[0]) * tt; spos[s * 3 + 1] = a[1] + (b[1] - a[1]) * tt; spos[s * 3 + 2] = a[2] + (b[2] - a[2]) * tt; } sgeo.attributes.position.needsUpdate = true; }
      pmat.opacity = 0.55 + Math.sin(t * 4.0) * 0.3; g.rotation.y = t * 0.4;
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
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const holo = makeHolo();

  const particles = makeParticles();
  const states = [makeOrb(), makeBrain(), makeSoftware(holo)];
  scene.add(particles.group);
  states.forEach(function (s, i) { scene.add(s.group); s.shown = i === 0 ? 1 : 0; if (i !== 0) { s.group.visible = false; s.group.scale.setScalar(0.001); } });

  // lights (only the GLB robot's PBR materials respond; unlit scene elements ignore these)
  scene.add(new THREE.AmbientLight(0xb9c2ff, 0.75));
  var kl = new THREE.DirectionalLight(0xffffff, 1.5); kl.position.set(2, 3, 4); scene.add(kl);
  var fl = new THREE.DirectionalLight(0x6f8cff, 0.6); fl.position.set(-3, -1, 2); scene.add(fl);
  var rimL = new THREE.DirectionalLight(0xec4899, 0.5); rimL.position.set(0, 2, -4); scene.add(rimL);

  // robot (Higgsfield porcelain GLB), shown in the brain state
  var robotHolder = new THREE.Group(); robotHolder.visible = false; robotHolder.scale.setScalar(0.001); robotHolder.position.set(0, -0.2, 0.7); scene.add(robotHolder);
  var robot = null, robotShown = 0;
  (async function loadRobot() {
    try {
      var mods = await Promise.all([import('three/addons/loaders/GLTFLoader.js'), import('three/addons/loaders/DRACOLoader.js')]);
      var draco = new mods[1].DRACOLoader(); draco.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/gltf/');
      var loader = new mods[0].GLTFLoader(); loader.setDRACOLoader(draco);
      loader.load(opts.robotUrl || 'assets/robot.glb?v=3', function (gltf) {
        var model = gltf.scene;
        var box = new THREE.Box3().setFromObject(model), size = new THREE.Vector3(), center = new THREE.Vector3();
        box.getSize(size); box.getCenter(center);
        var sc = 2.8 / (size.y || 1);
        model.position.sub(center);
        var wrap = new THREE.Group(); wrap.add(model); wrap.scale.setScalar(sc); robotHolder.add(wrap);
        var flash = makeFlash(); flash.group.position.set(0, 0.34 * 2.8, 0.12 * 2.8); robotHolder.add(flash.group);
        robot = { wrap: wrap, flash: flash };
      }, undefined, function () { robot = null; });
    } catch (e) { robot = null; }
  })();

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
      robotHolder.rotation.y = pointer.x * 0.4; robotHolder.rotation.x = pointer.y * 0.2;
      robotHolder.position.y = -0.2 + Math.sin(t * 1.2) * 0.04;
      robot.flash.update(t, reduce ? 0.016 : dt);
    }
    if (opts.speechEl) {
      if (current === 1 && robotShown > 0.5) {
        tmp.set(0, 1.2, 0.7).project(camera);
        const rect = canvas.getBoundingClientRect();
        opts.speechEl.style.left = (rect.left + (tmp.x * 0.5 + 0.5) * rect.width) + 'px';
        opts.speechEl.style.top = (rect.top + (-tmp.y * 0.5 + 0.5) * rect.height) + 'px';
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
