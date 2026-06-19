/* NEXXAI location hero visual - Barcelona: data point-cloud spires + data-sun, cursor-reactive.
   Mounts on <canvas data-locviz="barcelona">. Three.js via the page importmap. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const SP=[[-3.4,5.2,0.6],[-2.1,7.2,-0.6],[-0.85,9.2,0.6],[0.5,10.8,-0.5],[1.8,9.0,0.6],[3.0,7.0,-0.6],[4.1,5.0,0.6]];

function spireCloud(){
  const pts=[],cols=[],cB=new THREE.Color(0x8b5cf6),cC=new THREE.Color(0x49e0ff),cW=new THREE.Color(0xffffff);
  SP.forEach(s=>{ for(let i=0;i<820;i++){ const u=Math.random(),y=u*s[1],rad=0.5*(1-u),an=Math.random()*Math.PI*2;
    pts.push(s[0]+Math.cos(an)*rad,y,s[2]+Math.sin(an)*rad); const c=cB.clone().lerp(cC,u); if(Math.random()<0.14)c.copy(cW); cols.push(c.r,c.g,c.b); } });
  for(let i=0;i<280;i++){ pts.push((Math.random()-.5)*22,Math.random()*14,(Math.random()-.5)*12); cols.push(0.6,0.7,1); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3)); return g;
}

function mount(canvas){
  let r; try{ r=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true}); }catch(e){ return; }
  r.setPixelRatio(Math.min(devicePixelRatio,2)); r.toneMapping=THREE.ACESFilmicToneMapping; r.toneMappingExposure=1.32;
  const scene=new THREE.Scene(), cam=new THREE.PerspectiveCamera(44,1,0.1,200); cam.position.set(0,5.5,17);
  const g=new THREE.Group(); scene.add(g);

  const cg=spireCloud();
  const cloud=new THREE.Points(cg,new THREE.PointsMaterial({size:0.075,vertexColors:true,transparent:true,opacity:0.95,blending:THREE.AdditiveBlending,depthWrite:false}));
  g.add(cloud); const base=cg.attributes.position.array.slice();

  // data-sun (Barcelona hint)
  const sp=[],sc=[],cx=7,cy=11.8,cz=-3.5;
  for(let i=0;i<260;i++){ const an=Math.random()*Math.PI*2,rr=Math.sqrt(Math.random())*1.15; sp.push(cx+Math.cos(an)*rr,cy+Math.sin(an)*rr,cz); sc.push(1,0.82,0.45); }
  for(let i=0;i<13;i++){ const an=i/13*Math.PI*2; for(let j=0;j<11;j++){ const rr=1.35+j*0.17; sp.push(cx+Math.cos(an)*rr,cy+Math.sin(an)*rr,cz); sc.push(1,0.78,0.42); } }
  const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3)); sg.setAttribute('color',new THREE.Float32BufferAttribute(sc,3));
  const sun=new THREE.Points(sg,new THREE.PointsMaterial({size:0.085,vertexColors:true,transparent:true,opacity:0.95,blending:THREE.AdditiveBlending,depthWrite:false}));
  sun.position.set(-cx,-cy,-cz); const sunPivot=new THREE.Group(); sunPivot.position.set(cx,cy,cz); sunPivot.add(sun); g.add(sunPivot);

  const comp=new EffectComposer(r); comp.addPass(new RenderPass(scene,cam)); comp.addPass(new UnrealBloomPass(new THREE.Vector2(1,1),1.0,0.55,0.0));
  function size(){ const b=canvas.getBoundingClientRect(),w=Math.max(1,b.width),h=Math.max(1,b.height); r.setSize(w,h,false); comp.setSize(w,h); cam.aspect=w/h; cam.updateProjectionMatrix(); }
  size(); addEventListener('resize',size);
  let tx=0,ty=0,px=0,py=0;
  canvas.addEventListener('pointermove',e=>{ const b=canvas.getBoundingClientRect(); tx=(e.clientX-b.left)/b.width-0.5; ty=(e.clientY-b.top)/b.height-0.5; });
  canvas.addEventListener('pointerleave',()=>{ tx=0; ty=0; });
  let vis=true; try{ new IntersectionObserver(es=>vis=es[0].isIntersecting,{threshold:0}).observe(canvas); }catch(e){}
  const clk=new THREE.Clock();
  (function loop(){ requestAnimationFrame(loop); if(!vis)return; const t=clk.getElapsedTime(); px+=(tx-px)*0.05; py+=(ty-py)*0.05;
    g.rotation.y=Math.sin(t*0.1)*0.25+px*0.6;
    const amp=0.05+Math.hypot(px,py)*0.5, arr=cloud.geometry.attributes.position.array;
    for(let i=0;i<arr.length;i+=3){ arr[i]=base[i]+Math.sin(t*1.3+base[i+1])*amp; arr[i+2]=base[i+2]+Math.cos(t*1.1+base[i+1])*amp; }
    cloud.geometry.attributes.position.needsUpdate=true; sunPivot.rotation.z=t*0.25;
    cam.position.x=px*4; cam.position.y=5.5-py*2; cam.lookAt(0,5.2,0); comp.render();
  })();
}

const c=document.querySelector('canvas[data-locviz]');
if(c) mount(c);
