// 눈싸움 화면(월드개발, 2026-11-16 · 11-17 조준 개편). 규칙은 snowfight.js, 판정은 room-play.js(서버·혼자 모드 공용).
//  11-17 조준(눈썰매-눈싸움-개선-v1 §2-1): 누르고 있는 동안 조준, 떼면 던짐.
//   - PC: 마당 안에서 마우스 왼쪽 누름(마우스 자리 = 방향·거리, 게이지는 빠르기만 +20%) 또는 F 누름(카메라 정면, 거리 = 게이지).
//   - 휴대폰: ❄️ 단추를 누른 채 끌기(끈 쪽으로 던짐, 20~120px = 4~14m, 짧으면 게이지), 0.2초 안 톡 = 자동 조준(앞 60°·12m 가장 가까운 사람).
//   - 점선 포물선(점 12개, 화면 6px 고정, 흰색 + 잉크 테두리, 벽에 막히면 그곳까지·끝 회색) + 바닥 고리(0.8→1.2m, 사람 위면 빨강 + 머리 위 과녁)
//     + 캐릭터 옆 둥근 힘 게이지(48px, 1초에 가득, 가득 찬 뒤 0.5초 넘으면 깜빡임). 고리 0.5m 안 사람 쪽으로 최대 0.4m 끌어당김(조준 보정).
//   - 미리보기 = 서버와 같은 planThrow/resolveThrow 식. 조준 중 걷기 50%, 카메라가 어깨 뒤로 당겨짐(main.js가 camHint를 읽음).
//  §2-2 맞음: 맞힌 쪽 "명중!"/"헤드샷!"(+점수는 한 판 중만), 맞은 쪽 화면 가장자리 눈 얼룩 1.5초·움찔 0.15초·0.6초 못 던짐, 웅크리기(C·Ctrl / 단추, 누르는 동안).
//  - 손에 3개, 눈 뭉치기(R, 1초 웅크림)로 1개, 가만히 있어도 3초마다 1개. 0.8초 간격. 날아가는 눈덩이는 서버가 정한 끝점까지 같은 포물선, 흰 꼬리 0.3초, 땅 자국 3초.
//  - 맞은 사람은 머리·몸에 눈이 쌓이는 겉모습(최대 3단계, 5초 안 맞으면 털어냄). 집중 공격(soft)이면 연출을 작게. 음소거한 사람의 눈덩이는 아예 안 보인다.
import * as THREE from 'three';
import * as P from './props.js';
import {FIGHT,FIGHT_TEXT,inFightYard,autoAim,createAmmo,planThrow,arcDots,arcHeight,ringDiameter,gaugeOf,gaugeDist,dragDist,DRAG,resolveThrow} from './snowfight.js';
// 11-17 5차 손맛(월드개발): ① 누르면 서버 답을 기다리지 않고 내 화면에 바로 눈덩이(같은 식으로 미리 계산) → 답이 오면 끝점을 0.15초에 걸쳐 서버 값으로
//  ② 맞은 눈덩이는 날아가는 동안 맞은 사람의 지금 몸 쪽으로 휘어 들어감(서버는 던진 순간 자리로 판정 — 걷는 사람 옆에 떨어지던 「맞았는데 빗나가 보임」)
//  ③ 맞은 사람은 0.35m 밀림(0.18초) ④ PC F 톡(0.2초 안) = 자동 조준(전에는 4m 앞에 떨어짐)
export const FEEL=Object.freeze({blendSecs:.15,homing:9,knock:.35,knockSecs:.18,pendSecs:3});
// 동시에 그리는 수 상한(30명이 한꺼번에 던져도 휴대폰이 멈추지 않게, 5차): 눈덩이·눈 터짐·땅 자국은 미리 만든 것을 돌려 쓰고, 넘치면 그림만 건너뜀(판정·맞음 연출은 그대로).
// far = 내게서 이보다 먼 눈덩이·터짐은 그리지 않음(m)
export const SNOW_FX=Object.freeze({mobile:Object.freeze({balls:10,bursts:4,marks:6,far:28}),desktop:Object.freeze({balls:32,bursts:12,marks:20,far:45})});
import {SNOWBALL_YARD} from './layout.js';
const SNOWBALL_YARD_IN=(m=.35)=>({x0:SNOWBALL_YARD.x-SNOWBALL_YARD.w/2+m,x1:SNOWBALL_YARD.x+SNOWBALL_YARD.w/2-m,z0:SNOWBALL_YARD.z-SNOWBALL_YARD.d/2+m,z1:SNOWBALL_YARD.z+SNOWBALL_YARD.d/2-m});
import {icon} from '../icons/icon.js';

const PACK_SECS=FIGHT.packMs/1000;
// ctx: {doc,root,world,toon,heightAt,player,poser(내 자세),net,multi,hud,audio,camera,canvas,mobile,onChange()}
export function createSnowfight({doc=document,root,world,toon,heightAt,player,poser,net,multi,hud,audio,camera,canvas,renderer=null,yaw=null,mobile=false,onChange=()=>{}}){
 const tz=toon.toonify,ammo=createAmmo();
 const flying=[],bursts=[],marks=[],covers=new Map();
 const FX=mobile?SNOW_FX.mobile:SNOW_FX.desktop;
 const farFromMe=(x,z)=>Math.hypot(x-player.x,z-player.z)>FX.far;
 // 돌려 쓰는 그림: 눈덩이(+ 흰 꼬리 4개, 모양·재질 공용)·눈 터짐·땅 자국
 const trailGeo=[0,1,2,3].map(i=>new THREE.SphereGeometry(.05-i*.008,8,6)),trailMat=[0,1,2,3].map(i=>new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.6-i*.12,depthWrite:false}));
 const pool={balls:[],bursts:[],marks:[]},used={balls:0,bursts:0,marks:0};
 function takeBall(){if(used.balls>=FX.balls)return null;let v=pool.balls.pop();
  if(!v){v={g:P.thrownSnowball(tz),trail:trailGeo.map((g,i)=>new THREE.Mesh(g,trailMat[i]))};world.add(v.g);v.trail.forEach(t=>world.add(t));}
  v.g.visible=true;v.trail.forEach(t=>t.visible=true);used.balls++;return v;}
 function dropBall(v){if(!v)return;v.g.visible=false;v.trail.forEach(t=>t.visible=false);pool.balls.push(v);used.balls--;}
 const S={pack:0,aim:null,inYard:false,crouch:false,crouchKey:false,crouchBtn:false,stun:0,splat:0,flinch:0,lastPlan:null,knock:null};
 const pending=[]; // 내가 던져 미리 그린 눈덩이(서버 답 기다림, 보낸 순서)
 // ── 조준 그림: 고리·점선·과녁
 const ringMat=new THREE.MeshBasicMaterial({color:'#fff3b0',transparent:true,opacity:.9,depthWrite:false,depthTest:false});
 const ring=new THREE.Mesh(new THREE.RingGeometry(.3,.4,32).rotateX(-Math.PI/2),ringMat);ring.visible=false;ring.renderOrder=6;world.add(ring);
 // 점선 점: 화면(HUD) 위 흰 점 + 잉크 테두리, 화면 크기 고정(점 12개 + 끝). 3D 점은 눈송이·빛 번짐과 섞여 안 보여서 HUD로 그린다(11-17 화면 확인)
 const N=FIGHT.dots+1,dotsEl=doc.createElement('div');dotsEl.className='xf-dots';dotsEl.hidden=true;dotsEl.setAttribute('aria-hidden','true');
 dotsEl.innerHTML='<i></i>'.repeat(N);root.appendChild(dotsEl);const dotEls=[...dotsEl.children];
 const dots={get visible(){return !dotsEl.hidden;},set visible(v){dotsEl.hidden=!v;}};
 const dotV=new THREE.Vector3();
 // 손에 든 눈덩이 표시·힘 게이지·과녁·명중 글씨·맞은 눈 얼룩(HUD)
 const ammoEl=doc.createElement('div');ammoEl.className='xf-ammo';ammoEl.hidden=true;ammoEl.setAttribute('role','status');ammoEl.setAttribute('aria-label','손에 든 눈덩이');root.appendChild(ammoEl);
 const gaugeEl=doc.createElement('div');gaugeEl.className='xf-gauge';gaugeEl.hidden=true;gaugeEl.setAttribute('aria-hidden','true');gaugeEl.innerHTML='<i></i>';root.appendChild(gaugeEl);
 const targetEl=doc.createElement('div');targetEl.className='xf-target';targetEl.hidden=true;targetEl.innerHTML=icon('x-target',{size:'m'});root.appendChild(targetEl);
 const splatEl=doc.createElement('div');splatEl.className='xf-splat';splatEl.hidden=true;splatEl.setAttribute('aria-hidden','true');root.appendChild(splatEl);
 const floats=[];
 const people=()=>multi.joined?multi.people().filter(p=>p.sample&&!p.muted).map(p=>({id:p.id,x:p.sample.x,z:p.sample.z,crouch:p.act?.cr===1})):[];
 // 과녁 연습 등에서 사람 대신 쓸 과녁 목록(fight-ui가 넣는다)
 let extraTargets=()=>[];
 const allTargets=()=>[...people(),...extraTargets()];
 // 카메라가 보는 쪽(조준 중 어깨 쪽으로 비켜도 겨누는 방향은 그대로): main.js의 cam.yaw
 const camYaw=()=>yaw?yaw():Math.atan2(camera.position.x-player.x,camera.position.z-player.z);
 // ── 던지기(조준 결과 보내기)
 let localThrow=null; // 과녁 연습 중이면 서버 대신 이 함수가 판정(fight-ui)
 function throwDir(dx,dz,dist,{power=0}={}){
  if(!inFightYard(player.x,player.z,-.3)){hud?.say(FIGHT_TEXT.outside,2);return false;}
  if(S.pack>0)return false;
  if(S.stun>0)return false;
  if(!ammo.canThrow()){if(ammo.n<=0)hud?.say(FIGHT_TEXT.empty,1.8);return false;}
  const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
  const m={t:'sb:throw',x:+player.x.toFixed(2),z:+player.z.toFixed(2),dx:+dx.toFixed(3),dz:+dz.toFixed(3),d:+dist.toFixed(2),...(power?{p:+power.toFixed(2)}:{})};
  if(localThrow){localThrow(m);}
  else if(!net.send(m)){hud?.say(FIGHT_TEXT.offline,2);return false;}
  else{const me=multi.id??'me',r=resolveThrow({x:m.x,z:m.z,dx:m.dx,dz:m.dz,dist:m.d},allTargets().filter(p=>p.id!==me));
   const f=spawn({id:me,x:r.x,z:r.z,tx:r.tx,tz:r.tz,d0:r.d0,ms:r.ms,hit:null},{pred:true});f.at=performance.now()/1000;pending.push(f);}
  ammo.take();player.heading=Math.atan2(-dx,-dz);poser.throw();audio?.play('throw');return true;
 }
 const forward=()=>{const y=camYaw();return throwDir(-Math.sin(y),-Math.cos(y),FIGHT.forward);};
 const auto=()=>{const a=autoAim(player,player.heading,allTargets());return throwDir(a.dx,a.dz,a.dist);};
 // 화면 점 → 바닥 자리(마당 높이 평면)
 const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hitV=new THREE.Vector3();
 function groundAt(px,py){ndc.set(px/innerWidth*2-1,-(py/innerHeight)*2+1);ray.setFromCamera(ndc,camera);plane.constant=-heightAt(player.x,player.z);return ray.ray.intersectPlane(plane,hitV)?hitV.clone():null;}
 function toward(p){if(!p)return false;const pl=planThrow(player,p.x,p.z,allTargets());return throwDir(pl.dx,pl.dz,pl.dist);}
 // ── 조준 상태: src 'mouse'(PC 마우스) · 'key'(F·PC 단추) · 'touch'(휴대폰 ❄️)
 function canAim(){return S.inYard&&!document.documentElement.classList.contains('xh-decorating')&&S.pack<=0;}
 function aimStart(src,extra={}){if(!canAim())return false;S.aim={src,t:0,px:extra.px??null,py:extra.py??null,dx:0,dy:0,moved:false};onChange();return true;}
 // 지금 조준이 겨눈 땅 점(가장 최근 프레임)
 function aimPoint(){
  const a=S.aim;if(!a)return null;const g=gaugeOf(a.t);
  if(a.src==='mouse'&&a.px!=null){const p=groundAt(a.px,a.py);if(p)return {x:p.x,z:p.z,g};}
  const y=camYaw();let fx=-Math.sin(y),fz=-Math.cos(y),dist=gaugeDist(g);
  if(a.src==='touch'){const len=Math.hypot(a.dx,a.dy);
   if(len>=DRAG.min){const rx=Math.cos(y),rz=-Math.sin(y),f=-a.dy/len,s=a.dx/len;fx=fx*f+rx*s;fz=fz*f+rz*s;const l=Math.hypot(fx,fz)||1;fx/=l;fz/=l;}
   dist=dragDist(len,g);}
  // 손 몫(0.35m)을 더해 끝점이 거리만큼 떨어지게
  return {x:player.x+fx*(dist+FIGHT.hand),z:player.z+fz*(dist+FIGHT.hand),g};
 }
 function aimEnd(cancel=false){const a=S.aim;if(!a)return false;S.aim=null;onChange();if(cancel)return false;
  // 휴대폰 톡(0.2초 안·거의 안 끔) = 자동 조준
  if(a.src==='touch'&&a.t<DRAG.tapMs/1000&&Math.hypot(a.dx,a.dy)<12)return auto();
  if(a.src==='key'&&a.t<DRAG.tapMs/1000)return auto(); // PC F·던지기 단추 톡 = 자동 조준(5차)
  const p=aimPoint.call(null,S.aim=a);S.aim=null;if(!p)return false;
  const pl=planThrow(player,p.x,p.z,allTargets());
  return throwDir(pl.dx,pl.dz,pl.dist,{power:a.src==='mouse'?gaugeOf(a.t):0});
 }
 // PC: 마당 안에서 마우스 왼쪽 누름 = 조준, 떼면 던짐(오른쪽 끌기는 그대로 시점 돌리기)
 if(!mobile&&canvas){
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0||e.pointerType==='touch')return;if(aimStart('mouse',{px:e.clientX,py:e.clientY}))e.stopImmediatePropagation?.();},true);
  addEventListener('pointermove',e=>{if(S.aim?.src==='mouse'){S.aim.px=e.clientX;S.aim.py=e.clientY;}});
  addEventListener('pointerup',e=>{if(e.button===0&&S.aim?.src==='mouse')aimEnd();});
 }
 // 휴대폰 ❄️ 단추(hud가 부른다): 누름 → 끌기(dx,dy px) → 뗌
 const touchAim={start:()=>aimStart('touch'),move:(dx,dy)=>{if(S.aim?.src==='touch'){S.aim.dx=dx;S.aim.dy=dy;}},end:(dx,dy)=>{if(S.aim?.src==='touch'){S.aim.dx=dx;S.aim.dy=dy;}return aimEnd();},cancel:()=>aimEnd(true)};
 // 옛 길(시험 스크립트·이전 hud): 끌기 한 번에 조준·던지기
 function aimDrag(dx,dy,done){if(!S.aim)aimStart('touch');if(!S.aim)return false;S.aim.dx=dx;S.aim.dy=dy;S.aim.t=Math.max(S.aim.t,.25);if(done)return aimEnd();return true;}
 function pack(){if(!inFightYard(player.x,player.z,-.3)||S.pack>0)return false;if(ammo.n>=FIGHT.ammo){hud?.say('손에 눈덩이가 가득해요',1.4,'x-snowball');return false;}S.aim=null;S.pack=PACK_SECS;onChange();audio?.play('roll');return true;}
 // ── 눈투성이(사람마다 머리 위 눈 덩어리 + 몸 얼룩): 겉모습 그룹 하나를 머리 자리에 붙인다
 let coverGeo=null,coverMat=null;
 function coverMesh(){const g=new THREE.Group();g.name='눈투성이';// 0~2 머리 위 눈 더미, 3~4 어깨·가슴 얼룩, 5~6 셋째 단계(더 쌓임)
  const r=[[0,.02,0,.13],[-.1,-.03,.03,.08],[.1,-.04,.02,.09],[-.07,-.46,.15,.07],[.09,-.52,.14,.06],[.02,.09,-.05,.09],[-.11,-.6,.12,.05]];
  coverGeo??=r.map(([,,,s])=>new THREE.SphereGeometry(s,10,8));coverMat??=new THREE.MeshStandardMaterial({color:'#f7fbff',roughness:1}); // 모양·재질은 모두 같이 씀(5차)
  r.forEach(([x,y,z],i)=>{const m=new THREE.Mesh(coverGeo[i],coverMat);m.position.set(x,y,z);m.userData.i=i;g.add(m);});
  toon?.toonify?.(g,{kind:'prop'});world.add(g);return g;}
 function coverHit(id,soft){const t=performance.now()/1000;let c=covers.get(id);if(!c){c={level:0,last:0,g:coverMesh()};covers.set(id,c);}
  c.level=soft?Math.max(1,c.level):Math.min(FIGHT.maxCover,c.level+1);c.last=t;}
 const headV=new THREE.Vector3();
 function headOf(id){
  if(id===multi.id||id==='me'){player.headTop(headV);return {p:headV,h:player.root.rotation.y};}
  const a=multi.avatarOf(id);if(a){a.headTop(headV);return {p:headV,h:a.root.rotation.y};}
  const s=multi.sampleOf(id);if(s){headV.set(s.x,heightAt(s.x,s.z)+.98,s.z);return {p:headV,h:s.heading};}
  const t=extraTargets().find(x=>x.id===id);if(t){headV.set(t.x,heightAt(t.x,t.z)+(t.h??1.1),t.z);return {p:headV,h:0};}
  return null;
 }
 const scr=new THREE.Vector3();
 function toScreen(v){scr.copy(v).project(camera);return {x:(scr.x*.5+.5)*innerWidth,y:(-scr.y*.5+.5)*innerHeight,ok:scr.z<1&&Math.abs(scr.x)<1.2&&Math.abs(scr.y)<1.2};}
 // 머리 위로 떠오르는 글(명중!·헤드샷!·+1)
 function floatText(id,text,cls=''){const h=headOf(id);if(!h)return;const el=doc.createElement('div');el.className=`xf-float ${cls}`;el.textContent=text;root.appendChild(el);floats.push({el,p:h.p.clone(),t:0,dur:1});}
 function burst(x,y,z,{small=false}={}){if(used.bursts>=FX.bursts||farFromMe(x,z))return;let g=pool.bursts.pop();
  if(!g){g=P.snowBurst(tz);for(const c of g.children)c.userData.p0=c.position.clone();world.add(g);}
  for(const c of g.children)if(c.userData.p0)c.position.copy(c.userData.p0);
  g.visible=true;g.position.set(x,y,z);g.scale.setScalar(small?.6:1.1);used.bursts++;bursts.push({g,t:0});}
 // 땅에 남는 흰 자국(3초)
 const markGeo=new THREE.CircleGeometry(.22,14).rotateX(-Math.PI/2);
 function mark(x,z){if(farFromMe(x,z))return;
  // 상한이면 가장 오래된 자국을 옮겨 씀
  let m;if(used.marks>=FX.marks){const o=marks.shift();m=o.m;}else{m=pool.marks.pop();if(!m){m=new THREE.Mesh(markGeo,new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.85,depthWrite:false}));m.renderOrder=3;world.add(m);}used.marks++;}
  m.visible=true;m.material.opacity=.85;m.position.set(x,heightAt(x,z)+.03,z);marks.push({m,t:0});}
 // ── 받기
 net.on(m=>{
  if(m.t==='sb:no'){pending.shift();if(m.reason==='outside')hud?.say(FIGHT_TEXT.outside,2);return;} // 미리 그린 것은 빗나간 채로 떨어짐
  if((m.t!=='sb'&&m.t!=='sbh')||typeof m.id!=='string')return;
  if(multi.isMuted?.(m.id))return; // 음소거한 사람 눈덩이는 아예 그리지 않음
  if(m.t==='sbh')return hitBall(m);
  receiveBall(m);
 });
 // 6차: 서버는 던질 때 길만(sb fly:1), 맞으면 나중에 sbh {k,hit,tx,tz,…}. 아직 날아가는 중이면 그 자리에서 멈춰 맞은 사람 쪽으로, 이미 떨어졌으면 맞은 사람 머리에서 터짐
 const byK=new Map(); // k → 그린 눈덩이(떨어진 뒤 3초까지)
 function remember(f){if(f.m?.k==null)return;byK.set(f.m.k,f);f.seen=performance.now()/1000;if(byK.size>80)for(const [k,g] of byK){if(performance.now()/1000-g.seen>3)byK.delete(k);if(byK.size<=60)break;}}
 function hitBall(m){
  const me=multi.id??'me',f=byK.get(m.k);byK.delete(m.k);
  if(!f||f.landed||!flying.includes(f)){
   const g=f??{x:m.x,z:m.z,tx:m.tx,tz:m.tz,me:m.id===me};g.m={...(f?.m??{}),...m,t:'sb'};g.hitMe=m.hit===me;g.landed=true;
   if(!multi.isMuted?.(m.hit)){const h=headOf(m.hit);const t=h?{x:h.p.x,z:h.p.z,y:h.p.y-.1}:{x:m.tx,z:m.tz,y:heightAt(m.tx,m.tz)+.8};burst(t.x,t.y,t.z,{small:!!m.soft});}
   hitEffects(g);return;}
  // 날아가는 중: 같은 빠르기로 맞은 자리까지(남은 거리만큼 시간을 다시 잡음)
  const k=Math.min(1,f.t/f.dur),s=f.d*k,v=f.d/Math.max(.05,f.dur);
  f.m={...f.m,...m,t:'sb'};f.hitMe=m.hit===me;f.from=null;f.blend=1;f.tx=m.tx;f.tz=m.tz;
  const d=Math.hypot(m.tx-f.x,m.tz-f.z);f.dur=s>=d-.05?f.t:f.t+(d-s)/v;
 }
 function receiveBall(m){
  const me=m.id===(multi.id??'me');
  // 내가 던져 미리 그린 눈덩이가 있으면 새로 그리지 않고 서버 값으로 맞춘다
  const now=performance.now()/1000;while(pending.length&&now-pending[0].at>FEEL.pendSecs)pending.shift();
  if(me&&pending.length){confirm(pending.shift(),m);return;}
  if(!me){multi.poserOf(m.id)?.throw();audio?.play('throw',{at:{x:m.x,z:m.z},gain:.7});}
  spawn(m);
 }
 function confirm(f,m){
  f.m=m;f.pred=false;remember(f);
  if(m.fly)return; // 6차: 맞음은 sbh로 따로 온다
  if(f.landed){if(m.hit&&!multi.isMuted?.(m.hit)){const h=headOf(m.hit);const t=h?{x:h.p.x,z:h.p.z,y:h.p.y-.1}:{x:m.tx,z:m.tz,y:heightAt(m.tx,m.tz)+.8};burst(t.x,t.y,t.z,{small:!!m.soft});hitEffects(f);}return;}
  f.from={tx:f.tx,tz:f.tz};f.blend=0;
 }
 function spawn(m,{pred=false}={}){
  const vis=farFromMe((m.x+m.tx)/2,(m.z+m.tz)/2)?null:takeBall(),g=vis?.g??null,trail=vis?.trail??[];
  const hitMe=m.hit&&(m.hit===(multi.id??'me'));
  const d=Math.hypot(m.tx-m.x,m.tz-m.z),d0=Number.isFinite(m.d0)&&m.d0>0?m.d0:d;
  const f={vis,g,trail,hist:[],x:m.x,z:m.z,tx:m.tx,tz:m.tz,d,d0,t:0,dur:Math.max(.12,(m.ms??500)/1000),m,me:m.id===(multi.id??'me'),hitMe,pred};flying.push(f);if(!pred)remember(f);return f;
 }
 function land(f){
  const m=f.m,soft=!!m.soft;let y=heightAt(f.tx,f.tz)+arcHeight(Math.min(1,f.d/f.d0));
  S.lastLand={x:+f.tx.toFixed(2),z:+f.tz.toFixed(2),me:f.me};
  if(f.pred){f.landed=true;burst(f.tx,y,f.tz);mark(f.tx,f.tz);audio?.play('hit',{at:{x:f.tx,z:f.tz},gain:.7});return;}
  if(m.hit&&!multi.isMuted?.(m.hit)){const h=headOf(m.hit);if(h)y=Math.min(y,h.p.y-.1);coverHit(m.hit,soft);}
  burst(f.tx,y,f.tz,{small:soft});if(!m.hit)mark(f.tx,f.tz);audio?.play('hit',{at:{x:f.tx,z:f.tz},gain:soft?.5:1});
  hitEffects(f);
 }
 function hitEffects(f){
  const m=f.m,soft=!!m.soft;if(f.landed&&m.hit)coverHit(m.hit,soft);
  if(f.hitMe){if(!soft){const dx=f.tx-f.x,dz=f.tz-f.z,l=Math.hypot(dx,dz)||1;S.knock={x:dx/l,z:dz/l,t:FEEL.knockSecs};}S.stun=FIGHT.stunMs/1000;if(!soft){S.splat=1.5;S.flinch=.15;S.flinchDir={x:f.tx-f.x,z:f.tz-f.z};}
   hud?.say(soft?'눈덩이를 맞았어요':`${multi.nameOf(m.id)}의 눈덩이!`,soft?.8:1.2,soft?null:'x-snowball');}
  else if(f.me&&m.hit){
   if(m.ff){floatText(m.hit,'같은 편!','ff');}
   else{floatText(m.hit,m.head?'헤드샷!':'명중!',m.head?'head':'');if(m.pts)floatText(m.hit,`+${m.pts}`,'pts');audio?.play('done',{gain:.35});}}
  onLand?.(f.m);
 }
 let onLand=null;
 // ── 웅크리기(누르고 있는 동안)
 function setCrouch(on,src='btn'){if(src==='key')S.crouchKey=on;else S.crouchBtn=on;}
 addEventListener('keydown',e=>{if(e.repeat)return;const a=document.activeElement;if(a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA'))return;
  if((e.code==='KeyC'||e.code==='ControlLeft'||e.code==='ControlRight')&&S.inYard){setCrouch(true,'key');}
  if(e.code==='KeyF'&&S.inYard&&!S.aim){e.preventDefault();aimStart('key');}});
 addEventListener('keyup',e=>{if(e.code==='KeyC'||e.code==='ControlLeft'||e.code==='ControlRight')setCrouch(false,'key');if(e.code==='KeyF'&&S.aim?.src==='key')aimEnd();});
 addEventListener('blur',()=>{S.crouchKey=false;S.crouchBtn=false;if(S.aim)aimEnd(true);});
 return {
  forward,auto,toward,aimDrag,pack,throwDir,touchAim,aimStart,aimEnd,setCrouch,receiveBall,
  resetAmmo(){ammo.reset();},
  set extraTargets(f){extraTargets=f??(()=>[]);},set localThrow(f){localThrow=f;},set onLand(f){onLand=f;},
  get ammo(){return ammo.n;},get packing(){return S.pack>0;},get inYard(){return S.inYard;},get aiming(){return !!S.aim;},get crouching(){return S.crouch;},
  // 걷기 빠르기 배수(조준 50%·웅크림 40%)
  get moveMul(){return S.crouch?.4:S.aim?.5:1;},
  // 조준 중이면 몸이 겨눈 쪽을 본다
  get aimHeading(){const p=S.aim?S.lastPlan:null;return p?Math.atan2(-p.dx,-p.dz):null;},
  // 카메라: 조준 중 어깨 뒤로(main.js)
  get camHint(){return S.aim?{dist:.78,side:.35}:null;},
  actFields(){return {pk:S.pack>0?1:0,cr:S.crouch?1:0};},
  actions(){if(!S.inYard)return [];return [{id:'sb:throw',ic:'x-snowball',label:'던지기',key:'F',aim:true},{id:'sb:pack',ic:'x-scoop',label:'눈 뭉치기',key:'R'},{id:'sb:crouch',ic:'x-crouch',label:'웅크리기',key:'C',hold:true}];},
  act(id){if(id==='sb:throw')return mobile?auto():forward();if(id==='sb:pack')return pack();if(id==='sb:crouch'){setCrouch(!S.crouchBtn);return true;}return false;},
  hold(id,on){if(id==='sb:crouch')setCrouch(on,'btn');},
  // 조준 단추(PC 단추·휴대폰 ❄️) 누름·끌기·뗌
  aimButton(phase,dx=0,dy=0){if(phase==='down')return mobile?touchAim.start():aimStart('key');if(phase==='move')return touchAim.move(dx,dy);if(phase==='up'){if(S.aim?.src==='touch')return touchAim.end(dx,dy);if(S.aim?.src==='key')return aimEnd();}if(phase==='cancel')return aimEnd(true);return false;},
  update(dt,{moveInput=false}={}){
   const inside=inFightYard(player.x,player.z,-.3);
   if(inside!==S.inYard){S.inYard=inside;if(!inside){if(S.aim)aimEnd(true);S.crouchKey=S.crouchBtn=false;if(S.pack>0){S.pack=0;onChange();}}}
   if(S.pack>0){if(moveInput){S.pack=0;onChange();}else{S.pack-=dt;if(S.pack<=0){S.pack=0;ammo.pack();onChange();}}}
   if(S.stun>0)S.stun=Math.max(0,S.stun-dt);
   const crouch=S.inYard&&(S.crouchKey||S.crouchBtn)&&S.pack<=0;if(crouch!==S.crouch){S.crouch=crouch;onChange();}
   poser.setArms(S.pack>0?'pack':S.crouch?'crouch':['pack','crouch'].includes(poser.arms)?'none':poser.arms);
   // 맞은 쪽 움찔(0.15초, 맞은 방향 반대로 살짝)
   if(S.flinch>0){S.flinch=Math.max(0,S.flinch-dt);const k=Math.sin(Math.PI*(1-S.flinch/.15))*.07,d=S.flinchDir,l=Math.hypot(d.x,d.z)||1;player.root.position.x+=d.x/l*k;player.root.position.z+=d.z/l*k;}
   // 손 눈덩이 표시
   ammoEl.hidden=!inside;if(inside){const n=ammo.n,k=String(n);if(ammoEl.dataset.n!==k){ammoEl.dataset.n=k;ammoEl.setAttribute('aria-label',`손에 든 눈덩이 ${n}개`);ammoEl.innerHTML=icon('x-snowball',{size:'s'}).repeat(n)+'<i class="xf-empty" aria-hidden="true"></i>'.repeat(FIGHT.ammo-n);}}
   // 조준: 게이지·점선·고리·과녁
   let plan=null;
   if(S.aim&&inside){S.aim.t+=dt;const p=aimPoint();if(p){plan=planThrow(player,p.x,p.z,allTargets());plan.g=p.g;}}
   else if(S.aim&&!inside)aimEnd(true);
   S.lastPlan=plan;
   if(plan){
    const r=plan.r,dd=arcDots(r),gy=heightAt(player.x,player.z);
    dd.forEach((d,i)=>{const q=toScreen(dotV.set(d.x,gy+d.y,d.z)),el=dotEls[i];el.style.display=i&&q.ok?'':'none';
     if(i&&q.ok){el.style.transform=`translate(${q.x.toFixed(1)}px,${q.y.toFixed(1)}px)`;el.classList.toggle('grey',!!d.blocked);}});
    dots.visible=true;
    const s=ringDiameter(r.d0)/.8;ring.scale.setScalar(s);ring.position.set(r.tx,heightAt(r.tx,r.tz)+.05,r.tz);ring.visible=true;
    const on=r.hit??plan.target;ringMat.color.set(on?'#ff4a3d':r.wall?'#cfd6df':'#fff3b0');
    if(on){const h=headOf(on);if(h){const q=toScreen(h.p.clone().add({x:0,y:.32,z:0}));targetEl.hidden=!q.ok;targetEl.style.transform=`translate(${Math.round(q.x)}px,${Math.round(q.y)}px) translate(-50%,-50%)`;}else targetEl.hidden=true;}else targetEl.hidden=true;
    // 힘 게이지: 캐릭터 오른쪽 옆(화면)
    const q=toScreen(new THREE.Vector3(player.x,gy+.62,player.z));const g=plan.g,full=S.aim.t>FIGHT.gaugeSecs+.5;
    gaugeEl.hidden=!q.ok;gaugeEl.style.transform=`translate(${Math.round(q.x+46)}px,${Math.round(q.y)}px) translate(-50%,-50%)`;gaugeEl.style.setProperty('--g',String(g));gaugeEl.classList.toggle('full',full);
   }else{dots.visible=false;ring.visible=false;targetEl.hidden=true;gaugeEl.hidden=true;}
   // 맞은 쪽 화면 가장자리 눈 얼룩(1.5초, 가운데 70%는 비움)
   if(S.splat>0){S.splat=Math.max(0,S.splat-dt);splatEl.hidden=false;splatEl.style.opacity=String(Math.min(1,S.splat/.5));}else splatEl.hidden=true;
   // 날아가는 눈덩이(포물선 = 판정과 같은 식) + 흰 꼬리
   // 맞은 쪽 밀림(맞은 방향으로 0.35m, 마당 밖으로는 안 나감)
   if(S.knock){const K=S.knock,st=Math.min(dt,K.t);K.t-=dt;const v=FEEL.knock/FEEL.knockSecs*st;const Y=SNOWBALL_YARD_IN();
    player.x=Math.max(Y.x0,Math.min(Y.x1,player.x+K.x*v));player.z=Math.max(Y.z0,Math.min(Y.z1,player.z+K.z*v));if(K.t<=0)S.knock=null;}
   for(let i=flying.length-1;i>=0;i--){const f=flying[i];f.t+=dt;
    // 서버 답이 오면 끝점을 0.15초에 걸쳐 서버 값으로
    if(f.from&&f.blend<1){f.blend=Math.min(1,f.blend+dt/FEEL.blendSecs);const b=f.blend;f.tx=f.from.tx+(f.m.tx-f.from.tx)*b;f.tz=f.from.tz+(f.m.tz-f.from.tz)*b;}
    // 맞은 눈덩이: 맞은 사람의 지금 몸 쪽으로 휘어 들어감
    if(!f.pred&&f.m.hit&&(!f.from||f.blend>=1)){const q=f.m.hit===(multi.id??'me')?{x:player.x,z:player.z}:headOf(f.m.hit)?.p;if(q){const a=Math.min(1,dt*FEEL.homing);f.tx+=(q.x-f.tx)*a;f.tz+=(q.z-f.tz)*a;}}
    f.d=Math.hypot(f.tx-f.x,f.tz-f.z);
    const k=Math.min(1,f.t/f.dur),s=f.d*k;
    const x=f.x+(f.tx-f.x)*k,z=f.z+(f.tz-f.z)*k,y=heightAt(x,z)+arcHeight(Math.min(1,s/f.d0));
    if(f.g){f.g.position.set(x,y,z);f.hist.unshift([x,y,z]);if(f.hist.length>12)f.hist.length=12;
     f.trail.forEach((t,j)=>{const h=f.hist[Math.min(f.hist.length-1,(j+1)*2)];if(h)t.position.set(...h);});}
    if(k>=1){dropBall(f.vis);f.vis=f.g=null;f.trail=[];flying.splice(i,1);land(f);}}
   for(let i=bursts.length-1;i>=0;i--){const b=bursts[i];b.t+=dt;for(const c of b.g.children){const d=c.userData.dir;if(d)c.position.addScaledVector(d,dt*1.4);c.position.y-=dt*b.t*2.5;}b.g.scale.multiplyScalar(1-dt*.6);
    if(b.t>.4){b.g.visible=false;pool.bursts.push(b.g);used.bursts--;bursts.splice(i,1);}}
   for(let i=marks.length-1;i>=0;i--){const m=marks[i];m.t+=dt;m.m.material.opacity=.85*Math.min(1,(3-m.t)/.8);if(m.t>3){m.m.visible=false;pool.marks.push(m.m);used.marks--;marks.splice(i,1);}}
   // 떠오르는 글
   for(let i=floats.length-1;i>=0;i--){const f=floats[i];f.t+=dt;const q=toScreen(f.p.clone().add({x:0,y:.35+f.t*.5,z:0}));
    f.el.style.transform=`translate(${Math.round(q.x)}px,${Math.round(q.y)}px) translate(-50%,-100%)`;f.el.style.opacity=String(q.ok?Math.min(1,(f.dur-f.t)/.3):0);
    if(f.t>=f.dur){f.el.remove();floats.splice(i,1);}}
   // 눈투성이: 5초 안 맞으면 털어냄
   const t=performance.now()/1000;
   const fullIds=mobile?new Set(multi.people().filter(p=>p.full).map(p=>p.id)):null;
   for(const [id,c] of covers){const age=t-c.last,mine=id===multi.id||id==='me',show=age<FIGHT.stackMs/1000&&!multi.isMuted?.(id)&&(mine||!fullIds||fullIds.has(id));const h0=show?headOf(id):null,h=h0&&(mine||!farFromMe(h0.p.x,h0.p.z))?h0:null;
    if(!h||extraTargets().some(x=>x.id===id)){c.g.visible=false;if(age>=FIGHT.stackMs/1000)c.level=0;if(age>10){world.remove(c.g);covers.delete(id);}continue;}
    c.g.visible=true;c.g.position.copy(h.p).add({x:0,y:-.06,z:0});c.g.rotation.y=h.h; // headTop = 머리 꼭대기 근처(말풍선 자리)
    const shake=age>FIGHT.stackMs/1000-.5?Math.sin(age*40)*.03:0;c.g.position.x+=shake;
    for(const m of c.g.children){const i=m.userData.i;m.visible=c.level>=3||(c.level>=2?i<5:i<3);}}
  },
  coverOf:id=>covers.get(id)?.level??0,
  status(){const p=S.lastPlan;return {lastLand:S.lastLand??null,knock:!!S.knock,inYard:S.inYard,ammo:ammo.n,packing:S.pack>0,crouch:S.crouch,stun:+S.stun.toFixed(2),flying:flying.length,covers:Object.fromEntries([...covers].map(([k,v])=>[k,v.level])),
   aim:S.aim?{src:S.aim.src,t:+S.aim.t.toFixed(2),dots:dots.visible,ring:ring.visible,tx:p?+p.r.tx.toFixed(2):null,tz:p?+p.r.tz.toFixed(2):null,hit:p?.r.hit??null,target:p?.target??null}:null};},
 };
}
