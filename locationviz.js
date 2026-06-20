/* NEXXAI location hero visuals - one module, dispatched by <canvas data-locviz="...">.
   barcelona: data point-cloud spires + data-sun
   boston:    skyline built in geometry, AI-blob material
   florida:   real satellite model + orbiting data rings over Earth's limb
   lahore:    Badshahi Mosque built in geometry, gilded / royal
   turkey:    Hagia Sophia built in geometry, crystal glass (dimmer)
   ukraine:   St Sophia Kyiv built in geometry, hologram (no scan line)
   Three.js via the page importmap. Mobile-aware (lower DPR / counts / segments). */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const MOB = Math.min(innerWidth, innerHeight) < 820 || matchMedia('(pointer:coarse)').matches;
const Q = MOB ? 0.55 : 1;
const SAT='https://static.poly.pizza/37eb82fb-8fae-4035-aeb8-48d807840858.glb';

function engine(canvas,o){
  let r; try{ r=new THREE.WebGLRenderer({canvas,antialias:!MOB,alpha:true,powerPreference:'high-performance'}); }catch(e){ return; }
  r.setPixelRatio(Math.min(devicePixelRatio, MOB?1.5:2));
  r.setClearColor(0x000000, 0); // fully transparent: figure floats on the page, no panel/box
  r.toneMapping=THREE.ACESFilmicToneMapping; r.toneMappingExposure=o.exposure||1.2;
  const scene=new THREE.Scene(), cam=new THREE.PerspectiveCamera(o.fov||45,1,0.1,500);
  cam.position.set(0,o.camY??3,o.camZ??14);
  const api={scene,cam,THREE,r,mixers:[]}; o.build(api);
  let comp=null; if(o.bloom && !(MOB&&o.mobNoBloom)){ comp=new EffectComposer(r); comp.addPass(new RenderPass(scene,cam)); comp.addPass(new UnrealBloomPass(new THREE.Vector2(1,1),o.bloom[0],o.bloom[1],o.bloom[2])); }
  function size(){ const b=canvas.getBoundingClientRect(),w=Math.max(1,b.width),h=Math.max(1,b.height); r.setSize(w,h,false); if(comp)comp.setSize(w,h); cam.aspect=w/h; cam.updateProjectionMatrix(); }
  size(); addEventListener('resize',size);
  let tx=0,ty=0; api.px=0; api.py=0;
  canvas.addEventListener('pointermove',e=>{ const b=canvas.getBoundingClientRect(); tx=(e.clientX-b.left)/b.width-0.5; ty=(e.clientY-b.top)/b.height-0.5; });
  canvas.addEventListener('pointerleave',()=>{ tx=0; ty=0; });
  let vis=true; try{ new IntersectionObserver(es=>vis=es[0].isIntersecting,{threshold:0}).observe(canvas); }catch(e){}
  const clk=new THREE.Clock();
  (function loop(){ requestAnimationFrame(loop); if(!vis)return; const dt=Math.min(clk.getDelta(),0.05),t=clk.elapsedTime; api.px+=(tx-api.px)*0.05; api.py+=(ty-api.py)*0.05; api.mixers.forEach(m=>m.update(dt)); o.update&&o.update(t,api.px,api.py,api); if(comp)comp.render(); else r.render(scene,cam); })();
}
function envmap(a){ try{ const pm=new THREE.PMREMGenerator(a.r); a.scene.environment=pm.fromScene(new RoomEnvironment(),0.04).texture; }catch(e){} }
function fit(obj,size,yoff){ let b=new THREE.Box3().setFromObject(obj); const s=b.getSize(new THREE.Vector3()); const sc=size/Math.max(s.x,s.y,s.z); obj.scale.setScalar(sc); b=new THREE.Box3().setFromObject(obj); const c=b.getCenter(new THREE.Vector3()); obj.position.sub(c); obj.position.y+=(yoff||0); }
function P3(P,C,size){ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(C,3)); return new THREE.Points(g,new THREE.PointsMaterial({size:size||0.06,vertexColors:true,transparent:true,opacity:0.95,blending:THREE.AdditiveBlending,depthWrite:false})); }

/* ---------------- Barcelona: point-cloud spires + data-sun ---------------- */
function barcelona(canvas){ engine(canvas,{ exposure:1.32, fov:44, camY:5.5, camZ:17, bloom:[1.0,0.55,0.0], build(a){
  const g=new THREE.Group(); a.scene.add(g); a.g=g;
  const SPS=[[-3.4,5.2,0.6],[-2.1,7.2,-0.6],[-0.85,9.2,0.6],[0.5,10.8,-0.5],[1.8,9.0,0.6],[3.0,7.0,-0.6],[4.1,5.0,0.6]];
  const P=[],C=[],cB=new THREE.Color(0x8b5cf6),cC=new THREE.Color(0x49e0ff),cW=new THREE.Color(0xffffff),per=Math.floor(820*Q);
  SPS.forEach(s=>{ for(let i=0;i<per;i++){ const u=Math.random(),y=u*s[1],rad=0.5*(1-u),an=Math.random()*Math.PI*2; P.push(s[0]+Math.cos(an)*rad,y,s[2]+Math.sin(an)*rad); const c=cB.clone().lerp(cC,u); if(Math.random()<0.14)c.copy(cW); C.push(c.r,c.g,c.b);} });
  for(let i=0;i<Math.floor(280*Q);i++){ P.push((Math.random()-.5)*22,Math.random()*14,(Math.random()-.5)*12); C.push(0.6,0.7,1); }
  const cloud=P3(P,C,0.075); g.add(cloud); a.cloud=cloud; a.base=cloud.geometry.attributes.position.array.slice();
  const sp=[],sc=[],cx=7,cy=11.8,cz=-3.5;
  for(let i=0;i<Math.floor(260*Q);i++){ const an=Math.random()*Math.PI*2,rr=Math.sqrt(Math.random())*1.15; sp.push(cx+Math.cos(an)*rr,cy+Math.sin(an)*rr,cz); sc.push(1,0.82,0.45); }
  for(let i=0;i<13;i++){ const an=i/13*Math.PI*2; for(let j=0;j<11;j++){ const rr=1.35+j*0.17; sp.push(cx+Math.cos(an)*rr,cy+Math.sin(an)*rr,cz); sc.push(1,0.78,0.42);} }
  const sun=P3(sp,sc,0.085); sun.position.set(-cx,-cy,-cz); const piv=new THREE.Group(); piv.position.set(cx,cy,cz); piv.add(sun); g.add(piv); a.piv=piv;
}, update(t,px,py,a){ a.g.rotation.y=Math.sin(t*0.1)*0.25+px*0.6; const amp=0.05+Math.hypot(px,py)*0.5, arr=a.cloud.geometry.attributes.position.array,base=a.base; for(let i=0;i<arr.length;i+=3){ arr[i]=base[i]+Math.sin(t*1.3+base[i+1])*amp; arr[i+2]=base[i+2]+Math.cos(t*1.1+base[i+1])*amp; } a.cloud.geometry.attributes.position.needsUpdate=true; a.piv.rotation.z=t*0.25; a.cam.position.x=px*4; a.cam.position.y=5.5-py*2; a.cam.lookAt(0,5.2,0); }});}

/* ---------------- Boston: skyline in AI-blob material ---------------- */
function buildings(){ return [[-7,1.0,1.0,2.6],[-6,1.2,1.0,3.6],[-4.9,1.0,1.0,3.0],[-3.9,1.3,1.1,4.6],[-2.7,1.1,1.0,3.4],[-1.6,1.2,1.1,5.4],[-0.4,1.5,1.2,8.4],[1.1,1.1,1.0,4.2],[2.2,1.2,1.1,6.0],[3.4,1.0,1.0,3.4],[4.4,1.2,1.1,4.9],[5.6,1.0,1.0,3.0],[6.6,1.1,1.0,3.9]]; }
function boston(canvas){ engine(canvas,{ exposure:1.25, fov:45, camY:4, camZ:15, build(a){
  envmap(a); a.scene.add(new THREE.AmbientLight(0x9b8cff,0.7)); const k=new THREE.DirectionalLight(0xffffff,1.2); k.position.set(-4,8,6); a.scene.add(k);
  const g=new THREE.Group(); a.scene.add(g); a.g=g; const seg=MOB?[1,5,1]:[3,10,3];
  const mat=new THREE.MeshStandardMaterial({color:0x9a6cff,roughness:0.22,metalness:0.55,emissive:0x5a2fc0,emissiveIntensity:0.85});
  a.bld=[]; buildings().forEach((b,i)=>{ const[x,w,d,h]=b; const geo=new THREE.BoxGeometry(w,h,d,seg[0],seg[1],seg[2]); const m=new THREE.Mesh(geo,mat); m.position.set(x,h/2,0); m.userData={base:geo.attributes.position.array.slice(),ph:i}; g.add(m); a.bld.push(m);} );
}, update(t,px,py,a){ a.bld.forEach(m=>{ const p=m.geometry.attributes.position.array,b=m.userData.base,ph=m.userData.ph; for(let j=0;j<p.length;j+=3){ const x=b[j],y=b[j+1],z=b[j+2],n=1+0.05*Math.sin(y*1.6+t*1.3+ph); p[j]=x*n; p[j+2]=z*n; } m.geometry.attributes.position.needsUpdate=true; m.geometry.computeVertexNormals(); }); a.g.rotation.y=Math.sin(t*0.12)*0.25+px*0.6; a.cam.position.x=px*4; a.cam.position.y=4-py*2; a.cam.lookAt(0,3,0); }});}

/* ---------------- Florida: satellite + orbit data rings ---------------- */
function florida(canvas){ engine(canvas,{ exposure:1.2, fov:45, camY:0.6, camZ:7.2, build(a){
  envmap(a); a.scene.add(new THREE.AmbientLight(0x8ea0ff,0.7)); const sun=new THREE.DirectionalLight(0xffffff,2.4); sun.position.set(6,4,6); a.scene.add(sun);
  const g=new THREE.Group(); a.scene.add(g); a.g=g;
  const sp=[],sc=[]; for(let i=0;i<Math.floor(700*Q);i++){ const r=18+Math.random()*22,u=Math.random()*Math.PI*2,v=Math.acos(2*Math.random()-1); sp.push(r*Math.sin(v)*Math.cos(u),r*Math.sin(v)*Math.sin(u),r*Math.cos(v)); const w=0.55+Math.random()*0.45; sc.push(w,w,1);} a.scene.add(P3(sp,sc,0.12));
  const earth=new THREE.Mesh(new THREE.SphereGeometry(9,MOB?28:48,MOB?28:48), new THREE.MeshStandardMaterial({color:0x0a1f4a,emissive:0x0a2a66,emissiveIntensity:0.45,roughness:1})); earth.position.set(0,-11.6,-2); g.add(earth);
  const atmo=new THREE.Mesh(new THREE.SphereGeometry(9.7,MOB?28:48,MOB?28:48), new THREE.MeshBasicMaterial({color:0x2f7bff,transparent:true,opacity:0.18,side:THREE.BackSide})); atmo.position.copy(earth.position); g.add(atmo);
  const satG=new THREE.Group(); g.add(satG); a.sat=satG;
  new GLTFLoader().load(SAT, gltf=>{ const o=gltf.scene; satG.add(o); fit(o,2.7,0.2); }, undefined, ()=>{});
  a.rings=[]; const cols=[0x49e0ff,0x8b5cf6,0x32e6c0];
  for(let k=0;k<3;k++){ const P=[],C=[],col=new THREE.Color(cols[k]),R=2.9+k*0.6,N=Math.floor(150*Q); for(let i=0;i<N;i++){ const an=i/N*Math.PI*2; P.push(Math.cos(an)*R,(Math.random()-.5)*0.1,Math.sin(an)*R); C.push(col.r,col.g,col.b);} const ring=P3(P,C,0.075); ring.rotation.set(0.5+k*0.32,0,k*0.6); g.add(ring); a.rings.push(ring);}
}, update(t,px,py,a){ if(a.sat) a.sat.rotation.y=t*0.45+px*0.8; a.rings.forEach((r,i)=>{ r.rotation.y=t*(0.5+i*0.22); }); a.cam.position.x=px*2; a.cam.position.y=0.6-py*1.1; a.cam.lookAt(0,0.2,0); }});}

/* ---------------- procedural landmark builders ---------------- */
function bulbDome(group,x,z,drumR,drumH,domeR,yscale,baseY){
  const drum=new THREE.Mesh(new THREE.CylinderGeometry(drumR,drumR,drumH,MOB?16:26)); drum.position.set(x,baseY+drumH/2,z); group.add(drum);
  const dome=new THREE.Mesh(new THREE.SphereGeometry(domeR,MOB?16:26,MOB?12:18)); dome.scale.y=yscale; dome.position.set(x,baseY+drumH+domeR*yscale*0.42,z); group.add(dome);
  const fin=new THREE.Mesh(new THREE.ConeGeometry(domeR*0.12,domeR*0.55,8)); fin.position.set(x,baseY+drumH+domeR*yscale*0.9+domeR*0.28,z); group.add(fin);
}
function minaret(group,x,z,h,r){
  const sh=new THREE.Mesh(new THREE.CylinderGeometry(r*0.82,r,h,MOB?10:16)); sh.position.set(x,h/2,z); group.add(sh);
  const cap=new THREE.Mesh(new THREE.SphereGeometry(r*1.35,12,9)); cap.scale.y=1.4; cap.position.set(x,h+r*1.1,z); group.add(cap);
  const tip=new THREE.Mesh(new THREE.ConeGeometry(r*0.32,r*1.3,8)); tip.position.set(x,h+r*2.3,z); group.add(tip);
}
function badshahi(){ const g=new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(11,0.6,6),0,0.3,0));
  g.add(mesh(new THREE.BoxGeometry(8,3.2,3),0,2.2,0));
  g.add(mesh(new THREE.BoxGeometry(2.4,3.6,0.7),0,2.4,1.45));
  bulbDome(g,0,-0.2,1.1,0.5,1.5,1.18,3.8);
  bulbDome(g,-2.7,-0.2,0.8,0.4,1.0,1.18,3.8);
  bulbDome(g,2.7,-0.2,0.8,0.4,1.0,1.18,3.8);
  [[-5.2,2.6],[5.2,2.6],[-5.2,-2.6],[5.2,-2.6]].forEach(p=>minaret(g,p[0],p[1],7.2,0.32));
  return g;
}
function hagia(){ const g=new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(7,3.4,7),0,1.7,0));
  g.add(mesh(new THREE.CylinderGeometry(2.4,2.4,0.8,MOB?20:34),0,3.8,0));
  g.add(mesh(new THREE.SphereGeometry(2.55,MOB?20:38,MOB?14:22,0,Math.PI*2,0,Math.PI/2),0,4.2,0));
  [[0,3.0],[0,-3.0]].forEach(p=>{ const sd=new THREE.Mesh(new THREE.SphereGeometry(1.8,24,15,0,Math.PI*2,0,Math.PI/2)); sd.scale.set(1,0.82,1); sd.position.set(p[0],3.4,p[1]); g.add(sd); });
  [[-3.7,3.7],[3.7,3.7],[-3.7,-3.7],[3.7,-3.7]].forEach(p=>{ g.add(mesh(new THREE.CylinderGeometry(0.22,0.25,8.5,MOB?10:16),p[0],4.25,p[1])); g.add(mesh(new THREE.ConeGeometry(0.3,2.4,10),p[0],9.6,p[1])); });
  return g;
}
function onionGeo(scale){ const pr=[[0,0],[0.6,0.05],[0.78,0.32],[0.6,0.62],[0.34,0.82],[0.15,1.0],[0.06,1.18],[0,1.34]]; return new THREE.LatheGeometry(pr.map(p=>new THREE.Vector2(p[0]*scale,p[1]*scale)),MOB?18:28); }
function onionDome(g,x,z,scale,baseY,drumR,drumH){ g.add(mesh(new THREE.CylinderGeometry(drumR,drumR,drumH,MOB?14:20),x,baseY+drumH/2,z)); const d=new THREE.Mesh(onionGeo(scale)); d.position.set(x,baseY+drumH,z); g.add(d); g.add(mesh(new THREE.BoxGeometry(scale*0.05,scale*0.45,scale*0.05),x,baseY+drumH+scale*1.5,z)); }
function stsophia(){ const g=new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(7,2.6,5),0,1.3,0));
  onionDome(g,0,0,1.5,2.6,1.0,1.2);
  [[-2.0,1.2],[2.0,1.2],[-2.0,-1.2],[2.0,-1.2]].forEach(p=>onionDome(g,p[0],p[1],0.9,2.6,0.6,0.9));
  onionDome(g,0,2.0,1.0,2.6,0.7,1.0);
  return g;
}
function mesh(geo,x,y,z){ const m=new THREE.Mesh(geo); m.position.set(x,y,z); return m; }

/* ---------------- concept dressing ---------------- */
function dressGild(a,g,model){ envmap(a); a.scene.add(new THREE.AmbientLight(0xfff0d6,0.5)); const k=new THREE.DirectionalLight(0xffffff,1.7); k.position.set(5,10,7); a.scene.add(k);
  const gold=new THREE.MeshStandardMaterial({color:0xe8c062,roughness:0.18,metalness:1.0}); model.traverse(o=>{ if(o.isMesh)o.material=gold; }); g.add(model); }
function dressGlass(a,g,model){ envmap(a); a.scene.add(new THREE.AmbientLight(0x9fb0ff,0.6)); const k=new THREE.DirectionalLight(0xffffff,1.2); k.position.set(4,9,6); a.scene.add(k);
  const glass=new THREE.MeshPhysicalMaterial({color:0xbcd6f0,roughness:0.08,metalness:0,transparent:true,opacity:0.42,clearcoat:1,clearcoatRoughness:0.08,envMapIntensity:2.0,ior:1.4});
  model.traverse(o=>{ if(o.isMesh)o.material=glass; }); g.add(model); }
function dressHolo(a,g,model){ a.scene.add(new THREE.AmbientLight(0x4060a0,0.4));
  const face=new THREE.MeshBasicMaterial({color:0x18b6d8,transparent:true,opacity:0.10,side:THREE.DoubleSide}); const lmat=new THREE.LineBasicMaterial({color:0x7fe9ff,transparent:true,opacity:0.9});
  model.traverse(o=>{ if(o.isMesh){ o.material=face; try{ o.add(new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry,24),lmat)); }catch(_){}} }); g.add(model); }

function landmark(canvas,buildFn,concept,opts){
  const cfg=Object.assign({exposure:1.2,fov:45,camY:1.6,camZ:13,look:0.6,size:8,bloom:[0.55,0.6,0.1]},opts);
  engine(canvas,{ exposure:cfg.exposure, fov:cfg.fov, camY:cfg.camY, camZ:cfg.camZ, build(a){
    const g=new THREE.Group(); a.scene.add(g); a.g=g; const model=buildFn(); fit(model,cfg.size,0);
    if(concept==='gild') dressGild(a,g,model); else if(concept==='glass') dressGlass(a,g,model); else dressHolo(a,g,model);
  }, update(t,px,py,a){ if(a.g) a.g.rotation.y=t*0.16+px*0.6; a.cam.position.x=px*4; a.cam.position.y=cfg.camY-py*2; a.cam.lookAt(0,cfg.look,0); }});
}

/* ---------------- dispatch ---------------- */
const VIZ={ barcelona, boston, florida,
  lahore: c=>landmark(c,badshahi,'gild',{exposure:1.15,bloom:[0.5,0.7,0.1],size:9,camY:1.4,camZ:14,look:0.4}),
  turkey: c=>landmark(c,hagia,'glass',{exposure:1.0,bloom:[0.4,0.55,0.1],size:8.5,camY:1.6,camZ:13.5,look:0.3}),
  ukraine:c=>landmark(c,stsophia,'holo',{exposure:1.2,bloom:[1.0,0.7,0.0],size:8,camY:1.8,camZ:13,look:0.7})
};
document.querySelectorAll('canvas[data-locviz]').forEach(c=>{ const fn=VIZ[c.getAttribute('data-locviz')]; if(fn){ try{ fn(c); }catch(e){} } });
