// 눈사람 만들기 화면(월드개발, 2026-11-16). 규칙은 snowman-state.js, 판정은 room-play.js(서버·혼자 모드 공용).
//  - 마당 눈덩이: 눈덩이 하나 = 월드아트 snowball(반지름 1)을 크기만큼 키워 그림, 굴러간 만큼 돌고, 쌓거나 꾸미면 buildSnowman으로 다시 만든다.
//  - 밀기: 눈덩이(한 덩이)를 향해 걸으면 몸 앞으로 밀린다. 내 화면은 바로 움직이고(예측) 서버에는 10Hz로 snow:push. 큼은 혼자 밀면 걷기 절반 속도.
//  - 단추(main.js 행동 단추): ⛄ 눈덩이 만들기 · ⬆ 올리기(작은 눈덩이 옆 큰 눈덩이) · 🎨 꾸미기(쌓은 눈사람 옆, 부품 6칸 + 완성!)
//  - 완성: 반짝 + 모두에게 "○○·○○이 눈사람을 완성했어요", 트리 앞 전시 자리에 세우고 이름판(참여한 사람 이름만).
//  - 눈덩이 위에 크기 막대(3칸)와 지금 미는 사람 수 👥n(DOM 표, main.js가 위치를 준다).
import * as THREE from 'three';
import * as P from './props.js';
import {SNOWMAN_RULES,SNOWMAN_PARTS,SNOWMAN_NEED,SNOWMAN_TEXT,ballStage,coopMul,inYard,sanitizeBallRow,sanitizeDisplay,namesText} from './snowman-state.js';
import {SNOWMAN_YARD} from './layout.js';
import {BODY_R} from './collide.js';
import {icon,iconText} from '../icons/icon.js';

export const PUSH=Object.freeze({sendHz:10,hold:.4,near:.35});
export const PART_ICON=Object.freeze({eyes:'x-part-eyes',nose:'x-part-nose',mouth:'x-part-mouth',arms:'x-part-arm',hat:'x-part-hat',scarf:'x-scarf'}); // 아이콘 이름(아이콘-규칙-v1 §7-4)
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// ctx: {doc,root(hud .xh),world,toon,heightAt,village,player,net,multi,hud,audio,camera,mobile,onChange()(act 다시 보내기)}
export function createSnowmanPlay({doc=document,root,world,toon,heightAt,village,player,net,multi,hud,audio,camera,mobile=false,onChange=()=>{}}){
 const tz=toon.toonify,balls=new Map(),display=new Array(SNOWMAN_RULES.display).fill(null);
 const group=new THREE.Group();group.name='눈사람 마당 눈덩이';world.add(group);
 const S={pushing:null,pushT:0,sendT:0,deco:null,lastSent:null};
 // ── 눈덩이 그리기
 function sig(b){return b.r.length>1?`${b.r.length}|${b.p.join(',')}|${b.r.map(v=>v.toFixed(2)).join(',')}`:'1';}
 function build(o){
  if(o.mesh){o.holder.remove(o.mesh);}
  if(o.row.r.length>1){o.mesh=P.buildSnowman(tz,{sizes:o.row.r,parts:o.row.p,seed:o.seed});o.roll=null;o.pivot=null;}
  else{o.mesh=new THREE.Group();o.roll=P.snowball(tz,1,o.seed);o.roll.position.y=-.9;const pivot=new THREE.Group();pivot.position.y=.9;pivot.add(o.roll);o.mesh.add(pivot);o.pivot=pivot;}
  o.holder.add(o.mesh);o.sig=sig(o.row);o.scaleR=null;
 }
 function upsert(row,{fromServer=true}={}){
  let o=balls.get(row.id);
  if(!o){o={id:row.id,row,holder:new THREE.Group(),seed:(parseInt(row.id.slice(1),36)||1)%9+1,x:row.x,z:row.z,melt:0,born:0};group.add(o.holder);balls.set(row.id,o);o.row=row;build(o);}
  const mine=S.pushing===row.id&&S.pushT<PUSH.hold;
  const old=o.row;o.row={...row,...(mine&&fromServer?{x:o.x,z:o.z}:{})};
  if(!mine||!fromServer){const d=Math.hypot(row.x-o.x,row.z-o.z);if(d>2.5){o.x=row.x;o.z=row.z;}o.tx=row.x;o.tz=row.z;}
  if(sig(o.row)!==o.sig||(old.r.length>1)!==(row.r.length>1))build(o);
  return o;
 }
 function remove(id,why){const o=balls.get(id);if(!o)return;balls.delete(id);if(S.pushing===id)S.pushing=null;if(S.deco===id)closeDeco();
  if(why==='melt'){o.melt=1;melting.push(o);}else group.remove(o.holder);}
 const melting=[];
 // ── 전시(트리 앞 8자리)
 const shown=new Array(SNOWMAN_RULES.display).fill(null);
 function plate(text){const c=doc.createElement('canvas');c.width=512;c.height=96;const g=c.getContext('2d');g.fillStyle='#5a3a26';g.beginPath();g.roundRect?.(4,8,504,80,18);g.fill();g.fillStyle='#fbf0d8';g.font='900 40px "Apple SD Gothic Neo",Pretendard,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text.length>16?text.slice(0,15)+'…':text,256,50);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));s.scale.set(1.5,.28,1);s.renderOrder=4;return s;}
 function showDisplay(d,{celebrate=false}={}){
  const slot=village.display[d.slot];if(!slot)return;
  const old=shown[d.slot];if(old){world.remove(old.g);old.g.traverse(o=>{o.material?.map?.dispose?.();});}
  const g=new THREE.Group();g.name=`전시 눈사람 ${d.slot}`;const sm=P.buildSnowman(tz,{sizes:d.r,parts:d.p,seed:d.slot+3});g.add(sm);
  // 이름판은 몸통 앞(아래 눈덩이 반지름 + 0.3m)에 낮게
  const pl=plate(namesText(d));pl.position.set(0,.3,d.r[0]+.3);g.add(pl);
  g.position.set(slot.x,heightAt(slot.x,slot.z)+.12,slot.z);g.rotation.y=slot.heading;world.add(g);
  shown[d.slot]={g,d,pop:celebrate?1:0};display[d.slot]=d;
 }
 // ── 꾸미기 판
 const panel=doc.createElement('section');panel.className='xs-deco';panel.hidden=true;panel.setAttribute('aria-label','눈사람 꾸미기');root.appendChild(panel);
 function renderDeco(){
  const o=balls.get(S.deco);if(!o){closeDeco();return;}const p=new Set(o.row.p),ready=SNOWMAN_NEED.every(k=>p.has(k));
  panel.innerHTML=`<header><b>${iconText('x-decorate','눈사람 꾸미기')}</b><button type="button" class="xh-x" data-s="close" aria-label="꾸미기 그만하기">✕</button></header>
   <p class="xh-hint">눈(돌)·코(당근)는 꼭 붙여요. 붙인 부품은 30초 안에 다시 누르면 떼요</p>
   <div class="xs-parts">${SNOWMAN_PARTS.map(k=>`<button type="button" class="xh-kind" data-part="${k}" aria-pressed="${p.has(k)}"><em aria-hidden="true">${icon(PART_ICON[k],{size:'xl'})}</em><span>${esc(P.SNOWMAN_PART_LABELS[k])}${SNOWMAN_NEED.includes(k)?' *':''}</span></button>`).join('')}</div>
   <button type="button" class="xh-ok xs-done" data-s="finish" ${ready?'':'disabled'}>${iconText('x-snowman','완성!')}</button>`;
 }
 function openDeco(id){S.deco=id;panel.hidden=false;hud?.closeSheet?.();renderDeco();}
 function closeDeco(){S.deco=null;panel.hidden=true;}
 panel.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.part){const o=balls.get(S.deco);if(!o)return;const on=!o.row.p.includes(b.dataset.part);if(!net.send({t:'snow:deco',b:S.deco,p:b.dataset.part,on}))hud?.say(SNOWMAN_TEXT.offline);return;}
  if(b.dataset.s==='close')closeDeco();
  else if(b.dataset.s==='finish'){if(!net.send({t:'snow:finish',b:S.deco}))hud?.say(SNOWMAN_TEXT.offline);}
 });
 // ── 눈덩이 위 크기 막대(DOM)
 const tagLayer=doc.createElement('div');tagLayer.className='xs-tags';root.appendChild(tagLayer);const tags=new Map();
 // ── 받기
 net.on(m=>{
  switch(m.t){
   case 'snow':{for(const id of [...balls.keys()])remove(id);for(const b of Array.isArray(m.b)?m.b:[]){const r=sanitizeBallRow(b);if(r)upsert(r);}
    for(let i=0;i<display.length;i++){const d=Array.isArray(m.d)?sanitizeDisplay(m.d[i]):null;if(d)showDisplay(d);else if(shown[i]){world.remove(shown[i].g);shown[i]=null;display[i]=null;}}return;}
   case 'snow:ball':for(const b of Array.isArray(m.b)?m.b:[]){const r=sanitizeBallRow(b);if(r){const isNew=!balls.has(r.id);const o=upsert(r);if(isNew){o.born=1;audio?.play('roll',{at:{x:r.x,z:r.z}});}}}return;
   case 'snow:gone':remove(String(m.b??''),m.why);return;
   case 'snow:done':{const d=sanitizeDisplay(m.d);if(!d)return;showDisplay(d,{celebrate:true});audio?.play('done');
    const mine=m.by===multi.id||!multi.joined;hud?.say(`눈사람 완성! · ${namesText(d)}${mine?' · 트리 앞에 전시돼요':''}`,mine?3:1.6,'x-snowman');
    if(d.p&&S.deco)closeDeco();return;}
   case 'snow:no':hud?.say(SNOWMAN_TEXT[m.reason]??SNOWMAN_TEXT.bad,2.2);return;
  }
 });
 // 서버에 들어가면 혼자 만들던 눈덩이는 치운다(서버가 마당 전체 상태를 보내 준다)
 doc.defaultView?.addEventListener?.('xmas:multi-join',()=>{for(const id of [...balls.keys()])remove(id);});

 // ── 내 자리 기준: 가까운 눈덩이·올릴 짝
 const ballDist=o=>Math.hypot(o.x-player.x,o.z-player.z)-o.row.r[0];
 function nearest(filter=()=>true){let best=null;for(const o of balls.values()){if(!filter(o))continue;const d=ballDist(o);if(!best||d<best.d)best={o,d};}return best;}
 function stackPair(){
  // 내 옆 한 덩이(위) + 그 옆에 붙은 더 큰 눈덩이(아래)
  const me=nearest(o=>o.row.r.length===1);if(!me||me.d>1.2)return null;
  let best=null;for(const o of balls.values()){if(o===me.o||o.row.r.length>=SNOWMAN_RULES.maxStack)continue;const gap=Math.hypot(o.x-me.o.x,o.z-me.o.z)-o.row.r[0]-me.o.row.r[0];if(gap>1.2)continue;
   const lower=ballStage(o.row.r.at(-1))>ballStage(me.o.row.r[0])?o:o.row.r.length===1&&ballStage(me.o.row.r[0])>ballStage(o.row.r[0])?me.o:null;if(!lower)continue;
   const upper=lower===o?me.o:o;if(!best||gap<best.gap)best={lower,upper,gap};}
  return best;
 }
 // 지금 띄울 단추들(main.js 행동 단추). 마당 안에서만
 function actions(){
  if(!inYard(player.x,player.z,-1))return [];
  const out=[];const pair=stackPair();
  if(pair)out.push({id:'snow:stack',ic:'x-stack',label:'올리기',key:'E'});
  const st=nearest(o=>o.row.r.length>1);if(st&&st.d<1.4)out.push({id:'snow:deco',ic:'x-decorate',label:'꾸미기',key:out.length?'R':'E'});
  if(balls.size<SNOWMAN_RULES.maxBalls&&inYard(player.x,player.z,.2)){const n=nearest();if(!n||n.d>.9||!out.length)out.push({id:'snow:make',ic:'x-roll',label:'눈덩이 만들기',key:out.length?(out.length>1?'F':'R'):'E'});}
  return out;
 }
 function act(id){
  if(id==='snow:make'){const fx=-Math.sin(player.heading),fz=-Math.cos(player.heading),x=player.x+fx*(BODY_R+SNOWMAN_RULES.startR+.12),z=player.z+fz*(BODY_R+SNOWMAN_RULES.startR+.12);
   if(!net.send({t:'snow:make',x:+x.toFixed(2),z:+z.toFixed(2)}))hud?.say(SNOWMAN_TEXT.offline);return true;}
  if(id==='snow:stack'){const p=stackPair();if(!p)return false;if(!net.send({t:'snow:stack',b:p.lower.id,u:p.upper.id}))hud?.say(SNOWMAN_TEXT.offline);return true;}
  if(id==='snow:deco'){const st=nearest(o=>o.row.r.length>1);if(st)openDeco(st.o.id);return true;}
  return false;
 }
 // 걷기 한 걸음 처리(main.js updatePlayer가 충돌 전에 부름): 밀기·눈덩이 몸 충돌. 반환 {x,z,speedMul}
 function walk(fromX,fromZ,toX,toZ,dt){
  let x=toX,z=toZ,mul=1;const dx=toX-fromX,dz=toZ-fromZ,len=Math.hypot(dx,dz);
  for(const o of balls.values()){
   const r=o.row.r[0],min=r+BODY_R,ox=x-o.x,oz=z-o.z,d=Math.hypot(ox,oz);if(d>=min+PUSH.near)continue;
   const facing=len>1e-5?((o.x-fromX)*dx+(o.z-fromZ)*dz)/(len*Math.max(1e-5,Math.hypot(o.x-fromX,o.z-fromZ))):0;
   if(o.row.r.length===1&&len>1e-5&&facing>.55){
    // 밀기: 눈덩이를 몸 앞(min)으로. 큼을 혼자 밀면 절반 속도
    const solo=(o.row.n??0)<2,big=ballStage(r)>=2;mul=big&&solo?.5:1;
    const k=mul,nx=fromX+dx*k,nz=fromZ+dz*k;x=nx;z=nz;
    const ux=dx/len,uz=dz/len,bx=x+ux*min,bz=z+uz*min;
    // 미는 자리를 목표 자리(tx)에도 적어 둔다(손을 뗀 뒤 옛 서버 자리로 끌려 돌아가지 않게)
    if(inYard(bx,bz,r*.6)){const step=Math.hypot(bx-o.x,bz-o.z);o.x=bx;o.z=bz;o.tx=bx;o.tz=bz;o.row.r[0]=Math.min(SNOWMAN_RULES.maxR,r+step*SNOWMAN_RULES.grow*coopMul(Math.max(1,o.row.n||1)));
     if(o.pivot){const ax=new THREE.Vector3(uz,0,-ux);o.pivot.rotateOnWorldAxis(ax,-step/Math.max(.1,o.row.r[0]));}
     if(S.pushing!==o.id){S.pushing=o.id;onChange();}S.pushT=0;}
    else{const k2=min/Math.max(1e-5,d);x=o.x+ox*k2;z=o.z+oz*k2;} // 마당 끝: 더 못 밂
   }else if(d<min&&d>1e-5){x=o.x+ox/d*min;z=o.z+oz/d*min;}
  }
  return {x,z,mul};
 }
 const tagV=new THREE.Vector3();
 return {
  actions,act,walk,openDeco,closeDeco,
  get pushing(){return S.pushing!==null&&S.pushT<PUSH.hold;},get decoOpen(){return !panel.hidden;},
  get balls(){return balls;},get display(){return display;},
  actFields(){return {pu:S.pushing!==null&&S.pushT<PUSH.hold?1:0};},
  update(dt){
   S.pushT+=dt;
   if(S.pushing!==null&&S.pushT>=PUSH.hold){S.pushing=null;onChange();}
   // 내가 미는 눈덩이는 10Hz로 서버에
   S.sendT-=dt;if(S.pushing!==null&&S.sendT<=0){const o=balls.get(S.pushing);if(o){S.sendT=1/PUSH.sendHz;const k=`${o.x.toFixed(2)},${o.z.toFixed(2)}`;if(k!==S.lastSent){S.lastSent=k;net.send({t:'snow:push',b:o.id,x:+o.x.toFixed(2),z:+o.z.toFixed(2)});if(Math.random()<.3)audio?.play('roll',{gain:.6});}}}
   const seen=new Set();
   for(const o of balls.values()){
    // 남이 미는 눈덩이는 받은 자리로 부드럽게
    if(o.tx!==undefined&&!(S.pushing===o.id&&S.pushT<PUSH.hold)){const k=1-Math.exp(-dt*10),px=o.x,pz=o.z;o.x+=(o.tx-o.x)*k;o.z+=(o.tz-o.z)*k;const step=Math.hypot(o.x-px,o.z-pz);
     if(o.pivot&&step>1e-4){const ux=(o.x-px)/step,uz=(o.z-pz)/step;o.pivot.rotateOnWorldAxis(new THREE.Vector3(uz,0,-ux),-step/Math.max(.1,o.row.r[0]));}}
    const r=o.row.r[0];o.holder.position.set(o.x,heightAt(o.x,o.z),o.z);
    if(o.born>0){o.born=Math.max(0,o.born-dt*4);}
    if(o.row.r.length===1)o.mesh.scale.setScalar(r*(1-o.born*.6));else o.mesh.scale.setScalar(1-o.born*.3);
    // 크기 막대 + 미는 사람 수
    if(o.row.r.length===1&&Math.hypot(o.x-player.x,o.z-player.z)<12){seen.add(o.id);let el=tags.get(o.id);if(!el){el=doc.createElement('div');el.className='xs-tag';tagLayer.appendChild(el);tags.set(o.id,el);}
     const stg=ballStage(r),html=`<i class="xs-bar">${[0,1,2].map(i=>`<b data-on="${i<=stg}"></b>`).join('')}</i>${o.row.n>1?`<span class="ic-row" aria-label="같이 미는 사람 ${o.row.n}명">${icon('c-people',{size:'xs'})}<span class="ic-num">${o.row.n}</span></span>`:''}`;if(el.dataset.h!==html){el.innerHTML=html;el.dataset.h=html;}
     tagV.set(o.x,heightAt(o.x,o.z)+r*1.9+.25,o.z).project(camera);const vis=tagV.z<1&&Math.abs(tagV.x)<1.1&&Math.abs(tagV.y)<1.1;el.style.display=vis?'':'none';
     if(vis)el.style.transform=`translate(${Math.round((tagV.x*.5+.5)*innerWidth)}px,${Math.round((-tagV.y*.5+.5)*innerHeight)}px) translate(-50%,-100%)`;}
   }
   for(const [id,el] of tags)if(!seen.has(id)){el.remove();tags.delete(id);}
   for(let i=melting.length-1;i>=0;i--){const o=melting[i];o.melt-=dt;o.holder.scale.set(1,Math.max(.05,o.melt),1);if(o.melt<=0){group.remove(o.holder);melting.splice(i,1);}}
   for(const s of shown){if(s?.pop>0){s.pop=Math.max(0,s.pop-dt*.8);const k=1+Math.sin(s.pop*Math.PI*3)*.12*s.pop;s.g.scale.setScalar(k);}}
   if(S.deco)renderDecoIfChanged();
  },
  status(){return {balls:[...balls.values()].map(o=>({id:o.id,x:+o.x.toFixed(2),z:+o.z.toFixed(2),r:o.row.r.map(v=>+v.toFixed(2)),p:o.row.p,n:o.row.n})),display:display.map(d=>d?{slot:d.slot,names:d.names,parts:d.p,r:d.r}:null),pushing:S.pushing,deco:S.deco};},
 };
 function renderDecoIfChanged(){const o=balls.get(S.deco);if(!o){closeDeco();return;}const k=o.row.p.join(',');if(panel.dataset.k!==k){panel.dataset.k=k;renderDeco();}}
}
