// 온라인 인형뽑기 타이머 기계·열쇠 기계 그림(월드아트, 2026-11-23). 규칙·판정은 월드개발(설계 v3 §3-2·§3-3 fmtTimer·judgeTimer·judgeKey).
// 바닥 넓이·조작대·인형 나오는 문은 집게 기계(CLAW)와 같아서 가게 자리·부딪힘·서는 자리가 그대로 맞는다. 다른 것은 위쪽뿐이다.
//  타이머(도시): 위 간판 자리에 큰 숫자판(기계 폭 84%, 숫자 높이 ≈ 기계 폭 20%) + 그 위 이름판, 유리 상자 안 가운데 낮은 단 위 큰 인형 하나(11-23 v1.6) + 잠금 유리문,
//   조작대 오른쪽 큰 단추 하나 + 왼쪽 경품 받침(문으로 꺼낸 큰 인형이 놓이는 곳).
//  열쇠(별빛): 유리 상자 안 앞면에 칸 2줄×4칸(칸 폭 KEY.cell, 칸 높이 = 1.4칸 폭), 칸마다 아래 자물쇠 판 + 정사각 열쇠 구멍(그림 크기 = 판정 크기), 칸 앞을 오가는 열쇠.
// 메모리: 숫자판은 384×144 캔버스 1장(보이는 숫자·상태가 바뀔 때만 다시 그림), 열쇠 칸 인형은 같은 종 형상 공유(텍스처 없음).
// 좌표는 집게 기계와 같음: 앞 +Z, 바닥 y=0, 가운데 x=0.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {MACHINES,SHOP_COLORS,plushInfo} from './claw-palette.js';
import {CLAW,buildClawMachine,lightController,machineKit} from './claw-machine-art.js';
import {plushGeometry,plushSize,plushMaterial,plushLineMaterial,plushLineWidth,isOurPlush} from './claw-plush.js';
import {guestSize,resolvePool} from './claw-guest.js';

const {builder,machineLine,canvasTex,std,FONT,buildClaw,findMat}=machineKit;
const themeOf=t=>{const M=typeof t==='string'?MACHINES.find(m=>m.id===t):t;if(!M)throw new Error(`기계 없음: ${t}`);return M;};

// ── 타이머 기계 치수
export const TIMER=Object.freeze({
 height:1.8,                                   // 이름판 위 끝
 glassTop:1.3,boxTop:1.62,                     // 유리 상자 위 끝·위 간판 상자 위 끝(11-26 집게·봉 기계를 12cm 높일 때 타이머는 그대로 둠 — 숫자판·이름판이 이 자리에 맞춰 있음)
 display:Object.freeze({w:CLAW.width*.84,h:CLAW.width*.84*144/384,y:1.46,digitH:CLAW.width*.84*92/384}),   // 숫자판(앞면, 위 간판 상자 자리). 숫자 글자 높이 digitH ≈ 0.19m = 기계 폭 20%
 // 인형 올린 단(윗면 높이). 11-23 v1.6: 큰 인형(최대 0.50m)이 유리 상자(안 높이 0.74m) 안에 머리 위 18cm 남기고 들어가게 낮고 넓게(높이 6cm·반지름 20cm)
 stage:Object.freeze({x:0,z:-.04,r:.2,top:CLAW.floorY+.06}),
 big:Object.freeze({maxSize:.56}),             // 단 위에 올릴 수 있는 인형 높이 한도(m). 큰 인형 규칙(claw-palette.js BIG_PLUSH)이 이 아래여야 함
 // 잠금 유리문(11-23 대표 피드백: 10.00이면 문이 열려 인형을 꺼냄). 앞 유리 = 왼쪽 경첩 문, 오른쪽 기둥에 잠금 칸(불빛: 잠김 빨강·아까움 노랑 깜빡·열림 초록)
 door:Object.freeze({openAngle:1.6,rattle:.09,lockY:.92}),
 // 경품 받침(조작대 왼쪽, 조작대보다 10cm 앞으로 나옴): 꺼낸 큰 인형이 놓이는 곳. 열린 문(왼쪽 경첩, x ≈ -0.44)과 큰 단추에 닿지 않는 폭
 tray:Object.freeze({x:-.2,w:.42,z0:CLAW.depth/2-.03,z1:CLAW.depth/2+.3,top:CLAW.panel.top+.016}),
 out:Object.freeze([-.2,CLAW.panel.top+.016,CLAW.depth/2+.15]),       // 꺼낸 인형이 놓이는 곳(경품 받침 가운데)
 button:Object.freeze([.17,.5,.56]),           // 큰 단추(시작/멈춤) 자리 — 11-23 v1.6: 경품 받침 자리를 비우려고 오른쪽으로
 // 조작 중 카메라 추천값: 숫자판과 단이 함께 보이게(집게 기계보다 낮고 앞에서)
 // 11-23 v1.6: 큰 인형 — 숫자판·단 위 큰 인형·문 밖 경품 받침(y 0.5, z 0.6)이 한 화면에 들게 뒤로·위로 물리고 낮게 봄. 단 윗면은 서는 자리 동동이 모자 위로 보임
 camera:Object.freeze({pos:[0,2.0,2.25],look:[0,.9,.1],fov:42,portrait:Object.freeze({pos:[0,2.3,2.7],look:[0,.92,.1],fov:55})}),
});
// 숫자 글자(설계 v3 §3-2: 0.01초 아래 버림, 늘 「두 자리.두 자리」). 화면 HUD와 같은 식 — 판정 쪽 fmtTimer 값(text)을 넘기면 그대로 쓴다.
export function timerText(ms){const h=Math.max(0,Math.floor(ms/10+1e-9));return String(Math.floor(h/100)%100).padStart(2,'0')+'.'+String(h%100).padStart(2,'0');}
// 숫자판 색: 준비·도는 중 = 주황 불빛, 성공 = 초록(처음 4번 깜빡), 아까움 = 노랑, 실패 = 빨강
const LED=Object.freeze({ready:'#ffb43d',run:'#ffb43d',win:'#5cf08a',near:'#ffe04a',miss:'#ff5a4a',off:'#ffb43d'});
// 7-선분 숫자(가로 a·g·d, 세로 f·b·e·c)
const SEG={0:'abcdef',1:'bc',2:'abged',3:'abgcd',4:'fgbc',5:'afgcd',6:'afgedc',7:'abc',8:'abcdefg',9:'abcdfg','-':'g'};
function drawDigit(g,ch,x,y,w,h,on,ghost){const t=w*.2,p=t*.25;const S={a:[x+t,y,w-2*t,t,0],d:[x+t,y+h-t,w-2*t,t,0],g:[x+t,y+(h-t)/2,w-2*t,t,0],f:[x,y+t,t,(h-3*t)/2+t*.5,1],b:[x+w-t,y+t,t,(h-3*t)/2+t*.5,1],e:[x,y+(h+t)/2-t*.25,t,(h-3*t)/2+t*.5,1],c:[x+w-t,y+(h+t)/2-t*.25,t,(h-3*t)/2+t*.5,1]};
 const lit=SEG[ch]??'';for(const k of 'abcdefg'){const [sx,sy,sw,sh,v]=S[k],isOn=lit.includes(k);g.fillStyle=isOn?on:ghost;
  g.beginPath();if(v){g.moveTo(sx+sw/2,sy+p);g.lineTo(sx+sw,sy+p+sw/2);g.lineTo(sx+sw,sy+sh-p-sw/2);g.lineTo(sx+sw/2,sy+sh-p);g.lineTo(sx,sy+sh-p-sw/2);g.lineTo(sx,sy+p+sw/2);}
  else{g.moveTo(sx+p,sy+sh/2);g.lineTo(sx+p+sh/2,sy);g.lineTo(sx+sw-p-sh/2,sy);g.lineTo(sx+sw-p,sy+sh/2);g.lineTo(sx+sw-p-sh/2,sy+sh);g.lineTo(sx+p+sh/2,sy+sh);}g.closePath();g.fill();}}
function paintTimer(g,w,h,{text,state,band,dim}){
 g.clearRect(0,0,w,h);g.fillStyle='#1b1d22';g.beginPath();g.roundRect(0,0,w,h,18);g.fill();
 g.fillStyle='#0c0d10';g.beginPath();g.roundRect(8,6,w-16,h-40,12);g.fill();
 const on=state==='off'?'#3a2e22':LED[state]??LED.run,ghost='rgba(255,180,80,.05)',col=dim&&state==='run'?'rgba(255,180,61,.18)':on;
 const dh=h-40-12,dw=dh*.5,gap=dw*.2,dot=dw*.28,total=dw*4+gap*3+dot+gap,x0=(w-total)/2,y0=6+6;   // 숫자 높이 = 92/144 × 숫자판 높이 ≈ 기계 폭 20%
 const chars=(text??'00.00').padStart(5,'0').slice(-5);let x=x0;
 for(const ch of chars){if(ch==='.'){g.fillStyle=col;g.beginPath();g.arc(x+dot/2,y0+dh-dot*.45,dot*.42,0,Math.PI*2);g.fill();x+=dot+gap;continue;}drawDigit(g,ch,x,y0,dw,dh,col,ghost);x+=dw+gap;}
 // 허용 띠(설계 v3 §3-2): 실패 | 아까움 | 10.00 성공 | 아까움 | 실패. 가운데 칸 = 성공, 양옆 = 아까움.
 if(band){const by=h-30,bh=24,bx=14,bw=w-28,seg=[['#ff5a4a',.2],['#ffe04a',.22],['#5cf08a',.16],['#ffe04a',.22],['#ff5a4a',.2]];let sx=bx;
  for(const [c,f] of seg){g.fillStyle=c;g.globalAlpha=.85;g.fillRect(sx,by,bw*f,bh);sx+=bw*f;}g.globalAlpha=1;
  g.fillStyle='#14161a';g.font=`800 15px ${FONT}`;g.textAlign='center';g.textBaseline='middle';
  g.fillText(band.lo,bx+bw*.31,by+bh/2+1);g.fillText(band.mid,bx+bw*.5,by+bh/2+1);g.fillText(band.hi,bx+bw*.69,by+bh/2+1);
  g.fillStyle='#fff6e0';g.font=`700 12px ${FONT}`;g.fillText('실패',bx+bw*.1,by+bh/2+1);g.fillText('실패',bx+bw*.9,by+bh/2+1);}
}
// 타이머 이름판 = 간판 아틀라스(claw-machine-art.js signAtlas)의 4:1 칸

// 집게 기계와 같은 아래 몸통·조작대 판·문·투입구·유리 기둥·불빛 줄(b에 더함). bulbs: 'top' = 위 간판 상자 둘레, 'crest' = 위 이름판 둘레(타이머: 간판 자리를 숫자판이 씀).
function lowerBody(b,M,{bulbs='top',glassTop=CLAW.glassTop,height=CLAW.height}={}){
 const C={...CLAW,glassTop,height},W=C.width,D=C.depth,hw=W/2,hd=D/2;
 b.rbox('body',W,C.floorY,D,.05,0,C.floorY/2,0);b.rbox('dark',W+.02,.06,D+.02,.02,0,.03,0);
 b.rbox('body',W-.02,.07,C.panel.depth+.04,.025,0,C.panel.top-.035,hd+C.panel.depth/2-.02);
 b.rbox('trim',W-.1,.012,C.panel.depth-.02,.005,0,C.panel.top+.002,hd+C.panel.depth/2-.02);
 b.rbox('dark',W-.02,C.panel.top-.08,.06,.02,0,(C.panel.top-.07)/2+.06,hd+.02);
 b.box('accent',W-.08,.035,.01,0,C.floorY-.06,hd+.005);
 b.rbox('chute',.26,.18,.02,.02,C.door[0],C.door[1],hd+.002);b.rbox('rubber',.22,.08,.02,.01,C.door[0],C.door[1]+.04,hd+.012);b.box('trim',.28,.02,.03,C.door[0],C.door[1]-.1,hd+.01);
 b.rbox('accent',.1,.13,.02,.015,C.panel.coin[0],C.panel.coin[1],hd+.012);b.box('chute',.012,.06,.025,C.panel.coin[0],C.panel.coin[1]+.015,hd+.02);
 for(const sx of [-1,1])for(const sz of [-1,1])b.rbox('dark',.045,C.glassTop-C.floorY+.02,.045,.012,sx*(hw-.022),(C.glassTop+C.floorY)/2,sz*(hd-.022));
 const topH=C.height-C.glassTop;b.rbox('top',W,topH,D,.06,0,C.glassTop+topH/2,0);b.rbox('dark',W+.02,.04,D+.02,.02,0,C.glassTop+.01,0);
 b.box('strip',W-.12,.015,.03,0,C.glassTop-.03,hd-.06);
 // 간판 둘레 전구
 const pts=[];
 if(bulbs==='crest'){const cw=W*.78,y0=C.height+.02,y1=TIMER.height-.02,n=8;for(let i=0;i<n;i++){const x=-cw/2+.04+i*(cw-.08)/(n-1);pts.push([x,y1,.185]);}pts.push([-cw/2+.03,(y0+y1)/2,.185],[cw/2-.03,(y0+y1)/2,.185]);}
 else{const y0=C.glassTop+.05,y1=C.height-.05,n=9;for(let i=0;i<n;i++){const x=-hw+.06+i*(W-.12)/(n-1);pts.push([x,y1,hd+.012],[x,y0,hd+.012]);}}
 pts.forEach(([x,y,z],i)=>b.sph(i%2?'bulbA':'bulbB',.016,x,y,z,8));
}
function machineMats(M){const S=SHOP_COLORS;return {body:std(M.body),top:std(M.body),dark:std(M.bodyDark),trim:std(M.trim),accent:std(M.accent,{roughness:.5}),metal:std(S.metal,{roughness:.35,metalness:.3}),
 chute:std(S.chute),rubber:std(S.rubber),floor:std(M.trim),gold:std(S.coin,{roughness:.35,metalness:.35}),
 bulbA:std(M.light,{emissive:new THREE.Color(M.light),emissiveIntensity:.6}),bulbB:std(M.accent,{emissive:new THREE.Color(M.accent),emissiveIntensity:.6}),
 strip:std('#fffaf0',{emissive:new THREE.Color(M.light),emissiveIntensity:.8}),back:std(M.trim,{emissive:new THREE.Color(M.light),emissiveIntensity:.35})};}
const glassMat=()=>new THREE.MeshStandardMaterial({color:SHOP_COLORS.glass,roughness:.1,metalness:0,transparent:true,opacity:.1,depthWrite:false,side:THREE.DoubleSide,name:'claw-glass'});
function glassBox(root,late,{chuteGuard=true,glassTop=CLAW.glassTop,front=true}={}){
 const C={...CLAW,glassTop},W=C.width,D=C.depth,hw=W/2,hd=D/2,ch=C.chute,gh=C.glassTop-C.floorY,gy=(C.glassTop+C.floorY)/2,g=[];
 if(front)g.push(new THREE.PlaneGeometry(W-.05,gh).translate(0,gy,hd-.02));
 g.push(new THREE.PlaneGeometry(D-.05,gh).rotateY(Math.PI/2).translate(-hw+.02,gy,0),new THREE.PlaneGeometry(D-.05,gh).rotateY(Math.PI/2).translate(hw-.02,gy,0));
 if(chuteGuard){const gx=(ch.x[0]+ch.x[1])/2,gz=(ch.z[0]+ch.z[1])/2,cw=ch.x[1]-ch.x[0],cd=ch.z[1]-ch.z[0],gy2=C.floorY+ch.guard/2;
  g.push(new THREE.PlaneGeometry(cw,ch.guard).translate(gx,gy2,ch.z[0]),new THREE.PlaneGeometry(cd,ch.guard).rotateY(Math.PI/2).translate(ch.x[1],gy2,gz));}
 for(const x of g)x.deleteAttribute('uv');
 const m=new THREE.Mesh(mergeGeometries(g),glassMat());m.name='기계 유리';m.renderOrder=2;root.add(m);g.forEach(x=>x.dispose());
 const hl=new THREE.Mesh(new THREE.PlaneGeometry(.035,gh*.8),new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.35,depthWrite:false}));
 hl.position.set(hw-.18,gy+.02,hd-.015);hl.rotation.z=-.35;hl.renderOrder=3;const hl2=hl.clone();hl2.scale.x=.5;hl2.position.x=hw-.12;late.push(hl,hl2);
}
function finish(root,mats,toonify,late){
 toonify?.(root,{kind:'prop',keepMaps:true});
 if(toonify){for(const k of ['bulbA','bulbB','strip'])mats[k]=findMat(root,k)??mats[k];}
 root.traverse(o=>{if(o.isMesh&&o.userData.wantLine){const l=new THREE.Mesh(o.geometry,machineLine());l.userData.outline=true;l.name='outline';o.add(l);}});
 for(const o of late)root.add(o);
}
// 단추(누르면 내려감). 색은 setButton으로 바꿈.
function bigButton(root,pos,color,r=.055){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r+.003,.03,20),std(color,{emissive:new THREE.Color(color),emissiveIntensity:.3,roughness:.4}));
 m.position.set(pos[0],CLAW.panel.top+.025,pos[2]);root.add(m);const ring=new THREE.Mesh(new THREE.CylinderGeometry(r+.014,r+.014,.014,20),std('#2b2f36'));ring.position.set(pos[0],CLAW.panel.top+.008,pos[2]);root.add(ring);return m;}
// 봉 기계(claw-bridge.js)도 같은 몸통·유리·마무리를 쓴다
export const bodyKit=Object.freeze({lowerBody:(...a)=>lowerBody(...a),machineMats:M=>machineMats(M),glassBox:(...a)=>glassBox(...a),finish:(...a)=>finish(...a)});
const sizeOf=id=>isOurPlush(id)?plushSize(id):guestSize(id);
const KEY_BUTTON=Object.freeze([0,.5,.56]);    // 열쇠 기계 큰 단추(가운데, 타이머 단추가 옮겨 가기 전 자리 그대로)
// 인형 하나(형상·재질 공유). 손님 인형(guest-*)은 guestObject(id)가 돌려준 물체를 쓴다.
function plushAt(id,{toonify,guestObject,scale=1}){
 if(!isOurPlush(id)){if(!guestObject)throw new Error(`손님 인형은 guestObject가 필요: ${id}`);const o=guestObject(id);o.scale.multiplyScalar(scale);return o;}
 const geo=plushGeometry(id),s=plushSize(id)*scale,g=new THREE.Group();g.name=`인형:${id}`;
 const m=new THREE.Mesh(geo.color,plushMaterial());m.castShadow=true;m.receiveShadow=true;m.scale.setScalar(s);g.add(m);toonify?.(g,{kind:'character'});
 const l=new THREE.Mesh(geo.line,plushLineMaterial(plushLineWidth(id)));l.userData.outline=true;l.scale.setScalar(s);l.name='outline';g.add(l);g.userData.plushId=id;g.userData.size=s;return g;}

// ── 타이머 기계. 반환 group.userData: kind 'timer', machine, height, setTimer({ms|text,state,dim}), setBand(conf), setButton('start'|'stop'|'off'),
//  setPrize(id)(큰 인형 BIG_PLUSH, 단 한도 TIMER.big.maxSize), prize(지금 단 위 인형), stage(단 윗면 가운데, 기계 좌표), setDoor({open,rattle,lock}), door(상태), setLights, update(dt), press(k), spots(out = 꺼낸 인형 자리)
//  11-23(대표 피드백): 집게 없음. 유리 상자 안 = 단 위 인형 + 잠긴 앞 유리문. 성공이면 잠금이 풀리고 문이 열려 인형을 꺼낸다(연출 순서는 claw-play.js).
export function buildTimerMachine(theme='timer-1',{toonify=null,guestObject=null,prize=null}={}){
 const T=TIMER,M=themeOf(theme),C={...CLAW,glassTop:T.glassTop,height:T.boxTop},W=C.width,D=C.depth,hw=W/2,hd=D/2,root=new THREE.Group();root.name=`인형뽑기 기계:${M.id}`;
 const mats=machineMats(M),b=builder(),late=[];
 lowerBody(b,M,{bulbs:'crest',glassTop:T.glassTop,height:T.boxTop});
 // 위 간판 상자 위 이름판 받침(숫자판이 간판 자리를 쓰므로 이름은 위로)
 b.rbox('dark',W*.78,T.height-C.height,.16,.03,0,(C.height+T.height)/2,.1);
 // 숫자판 테(금색)·안쪽 바닥판·뒷벽
 b.rbox('gold',T.display.w+.03,T.display.h+.03,.012,.012,0,T.display.y,hd+.002);
 b.box('floor',W-.06,.02,D-.06,0,C.floorY-.005,0);b.box('back',W-.07,C.glassTop-C.floorY-.02,.012,0,(C.glassTop+C.floorY)/2,-hd+.04);
 // 단: 줄무늬 원기둥 + 윗판(인형이 앉는 곳)
 const st=T.stage,sh=st.top-C.floorY;b.cyl('accent',st.r,st.r+.012,sh*.55,st.x,C.floorY+sh*.275,st.z,{seg:24});b.cyl('trim',st.r,st.r,sh*.45-.012,st.x,C.floorY+sh*.775-.006,st.z,{seg:24});   // 윗면은 금색 테가 덮음(같은 높이 두 면이 겹쳐 줄무늬가 나지 않게)
 b.cyl('gold',st.r+.012,st.r+.012,.012,st.x,st.top-.006,st.z,{seg:24});
 // 경품 받침: 조작대 왼쪽 위 판 + 앞·옆 턱 + 아래 받침 두 개(꺼낸 큰 인형이 놓임)
 {const t=T.tray,d=t.z1-t.z0,zc=(t.z0+t.z1)/2;b.rbox('trim',t.w,.016,d,.006,t.x,t.top-.008,zc);
  b.rbox('accent',t.w,.035,.016,.006,t.x,t.top+.012,t.z1-.008);for(const sx of [-1,1])b.rbox('accent',.016,.03,d-.02,.006,t.x+sx*(t.w/2-.008),t.top+.01,zc);
  for(const sx of [-1,1])b.rbox('dark',.03,t.top-.016,.03,.008,t.x+sx*(t.w/2-.05),(t.top-.016)/2,t.z1-.05);}   // 바닥까지 닿는 다리 둘
 // 잠금 칸(오른쪽 앞 기둥, 문 걸쇠가 들어가는 곳)
 const ly=T.door.lockY;b.rbox('dark',.06,.13,.05,.01,hw-.03,ly,hd+.005);b.box('gold',.03,.016,.02,hw-.05,ly+.035,hd+.03);
 b.box('strip',W-.12,.015,.03,0,C.glassTop-.03,-hd+.08);
 b.build(mats,root,{outline:new Set(['body','top','dark'])});
 glassBox(root,late,{chuteGuard:false,front:false,glassTop:T.glassTop});
 // 앞 유리문: 경첩(왼쪽 앞 기둥) 묶음 = 유리 + 테 + 손잡이·걸쇠. 열면 바깥(+Z)으로 돈다
 const gh=C.glassTop-C.floorY-.02,gw=W-.08,gy=(C.glassTop+C.floorY)/2,hinge=new THREE.Group();hinge.name='잠금 유리문';hinge.position.set(-hw+.04,0,hd-.015);root.add(hinge);
 const glassD=new THREE.Mesh(new THREE.PlaneGeometry(gw-.03,gh-.03),glassMat());glassD.position.set(gw/2,gy,0);glassD.renderOrder=2;hinge.add(glassD);
 const fb=builder();fb.box('trim',gw,.022,.022,gw/2,gy+gh/2,0);fb.box('trim',gw,.022,.022,gw/2,gy-gh/2,0);fb.box('trim',.022,gh,.022,0,gy,0);fb.box('trim',.022,gh,.022,gw,gy,0);
 fb.rbox('gold',.022,.12,.03,.01,gw-.045,ly,.022);fb.box('metal',.05,.014,.014,gw+.005,ly+.035,.008);
 const frame=new THREE.Group();fb.build(mats,frame,{outline:new Set(['trim'])});hinge.add(frame);
 // 잠금 불빛(빛 계산 없는 작은 공, 상태 색은 setDoor·update가 바꿈)
 const led=new THREE.Mesh(new THREE.SphereGeometry(.014,10,8),new THREE.MeshBasicMaterial({color:'#ff4a4a',toneMapped:false}));led.position.set(hw-.03,ly-.03,hd+.033);led.name='잠금 불빛';late.push(led);
 const button=bigButton(root,T.button,'#3fbf6a',.062);button.name='시작 단추';
 finish(root,mats,toonify,late);
 // 유리 반짝임 줄은 문과 같이 돌게 문 묶음으로 옮김
 for(const o of late)if(o!==led&&o.isMesh&&o.material?.isMeshBasicMaterial&&o.position.z>hd-.03){root.remove(o);o.position.x-=hinge.position.x;o.position.z=.004;hinge.add(o);}
 // 이름판(앞)·숫자판(앞) — 빛나는 판이라 카툰 재질로 바꾸지 않는다
 {const m=machineKit.signMesh(M,W*.72,W*.72/4);if(m){m.position.set(0,(C.height+T.height)/2,.181);root.add(m);}}
 const cv=typeof document!=='undefined'?document.createElement('canvas'):null;let tex=null,disp=null;
 if(cv){cv.width=384;cv.height=144;tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
  disp=new THREE.Mesh(new THREE.PlaneGeometry(T.display.w,T.display.w*144/384),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));disp.position.set(0,T.display.y,hd+.01);disp.name='타이머 숫자판';root.add(disp);}
 const S={text:'00.00',state:'ready',dim:false,band:{lo:'9.90',mid:'10.00',hi:'10.10'},t:0,drawn:''};
 const redraw=()=>{if(!cv)return;const blinkOff=S.state==='win'&&S.t<1.6&&Math.floor(S.t/.2)%2===1;
  const key=`${S.text}|${blinkOff?'off':S.state}|${S.dim}|${S.band?.lo}${S.band?.mid}${S.band?.hi}`;if(key===S.drawn)return;S.drawn=key;
  paintTimer(cv.getContext('2d'),cv.width,cv.height,{text:S.text,state:blinkOff?'off':S.state,band:S.band,dim:S.dim});tex.needsUpdate=true;};
 redraw();
 // setTimer: text(판정이 준 fmtTimer 값)가 있으면 그것을, 없으면 ms로 같은 식(timerText)을 쓴다. state = ready·run·win·near·miss·off
 const setTimer=({ms=null,text=null,state=S.state,dim=false}={})=>{const was=S.state;S.text=text??(ms!=null?timerText(ms):S.text);S.state=state;S.dim=dim;if(state!==was)S.t=0;redraw();};
 // 허용 띠 글자: conf = {targetSec, nearWinSec, okWinSec} (조절값을 바꾸면 띠 글도 바뀜). null이면 띠를 안 그림.
 const setBand=conf=>{if(!conf){S.band=null;redraw();return;}const t=conf.targetSec??10,n=conf.nearWinSec??.1,o=conf.okWinSec??0;
  S.band={lo:(t-n).toFixed(2),mid:o>0?`${(t-o).toFixed(2)}~${(t+o).toFixed(2)}`:t.toFixed(2),hi:(t+n).toFixed(2)};redraw();};
 const BTN={start:'#3fbf6a',stop:'#e8443a',off:'#9a948a'};
 const setButton=m=>{const c=BTN[m]??BTN.off;button.material.color.set(c);button.material.emissive.set(c);button.material.emissiveIntensity=m==='off'?.05:.35;button.name=m==='stop'?'멈춤 단추':'시작 단추';};
 // 단 위 인형
 let prizeObj=null;const stageTop=new THREE.Vector3(st.x,st.top,st.z);
 // 단 위 인형. 단이 받칠 수 있는 높이(TIMER.big.maxSize)보다 큰 인형은 그 높이로 줄여 유리 위에 닿지 않게
 const setPrize=id=>{if(prizeObj){root.remove(prizeObj);prizeObj=null;}if(!id)return null;const sz=sizeOf(id);prizeObj=plushAt(id,{toonify,guestObject,scale:sz>T.big.maxSize?T.big.maxSize/sz:1});prizeObj.position.copy(stageTop);prizeObj.rotation.y=-.15;prizeObj.name=`단 위 인형:${id}`;root.add(prizeObj);return prizeObj;};
 // 꺼낸 인형을 단 인형 자리에서 떼어 냄(물체는 그대로 둠 — 연출 쪽이 조작대 위에 두었다가 치움)
 const detachPrize=()=>{const o=prizeObj;prizeObj=null;return o;};
 setPrize(prize??resolvePool(M.pool??[],[])[0]??null);
 const lights=lightController(M,mats);
 // 문: open 0(닫힘)~1(활짝), rattle = 덜컥 흔들림 각(라디안, 닫힌 채), lock = 'locked'|'near'|'open'|'miss'(miss = 빨강 깜빡)
 const DS={open:0,rattle:0,lock:'locked',t:0},LED={locked:'#ff4a4a',miss:'#ff4a4a',near:'#ffd23a',open:'#3dff7a'};
 const paintLed=()=>{const blink=(DS.lock==='near'||DS.lock==='miss')&&Math.floor(DS.t/.12)%2===1;led.material.color.set(blink?'#3a2020':LED[DS.lock]??LED.locked);};
 const setDoor=({open=DS.open,rattle=0,lock=DS.lock}={})=>{if(lock!==DS.lock)DS.t=0;DS.open=open;DS.rattle=rattle;DS.lock=lock;hinge.rotation.y=-(open*T.door.openAngle)-rattle;paintLed();};
 setDoor({open:0,lock:'locked'});
 const update=dt=>{lights.update(dt);if(S.state==='win'&&S.t<1.8){S.t+=dt;redraw();}else S.t+=dt;DS.t+=dt;paintLed();};
 const press=(k=1)=>{button.position.y=C.panel.top+.025-.012*k;};
 root.userData={kind:'timer',machine:M,height:T.height,setTimer,setBand,setButton,setPrize,detachPrize,get prize(){return prizeObj;},stage:stageTop,setDoor,door:DS,
  setLights:lights.setLights,update,press,mats,camera:T.camera,timer:{get text(){return S.text;},get state(){return S.state;},get dim(){return S.dim;}},
  spots:{stand:new THREE.Vector3(0,0,C.stand.z),button:new THREE.Vector3(T.button[0],C.panel.top+.04,T.button[2]),coin:new THREE.Vector3(...C.panel.coin).setZ(hd+.02),
   door:new THREE.Vector3(C.door[0],C.door[1],hd+.03),display:new THREE.Vector3(0,T.display.y,hd+.01),sign:new THREE.Vector3(0,T.height+.15,0),
   out:new THREE.Vector3(...T.out),tray:new THREE.Vector3(T.tray.x,T.tray.top,(T.tray.z0+T.tray.z1)/2),lock:new THREE.Vector3(hw-.03,ly,hd+.03)},pile:null};
 return root;
}

// ── 열쇠 기계 치수. 판정 좌표(설계 v3 judgeKey): x = 칸 단위(0~cols), y = 칸 폭 단위(0~rows×cellH, 아래가 0). KEY.toLocal(x,y)가 기계 좌표로 바꾼다.
const KC=.2;                                   // 칸 폭(m)
export const KEY=Object.freeze({
 cols:4,rows:2,cellH:1.4,holeY:.32,dollY:.95,startX:.15,startY:-.3, // 설계 v3 시안 CONF.key와 같은 값(그림 기준값, 규칙 값은 월드개발 조절값을 setHoles로 받는다)
 cell:KC,left:-KC*2,bottom:.64,front:.18,back:-.16, // 칸 묶음 왼쪽 끝 x·아래 끝 y·앞면 z·뒷벽 z
 glassTop:1.42,                                // 유리 상자를 집게 기계보다 12cm 높게: 위 간판이 위 줄 칸을 가리지 않게(카메라가 동동이 모자 위로 넘겨 볼 때)
 keyZ:.2,push:.045,                            // 열쇠 끝 쉬는 자리 z(칸 앞면 2cm 앞), 끝까지 밀어 넣는 길이(끝이 구멍 안 2.5cm). 위에서 내려다봐도 겨눈 칸과 어긋나 보이지 않게 칸에 붙임
 height:1.74,
 // 조작 중 카메라 추천값: 서는 자리(z 1.0)의 동동이 모자(약 1.1m) 위로 넘겨 칸 묶음 전체가 보이게(모자는 화면 아래 밖 또는 칸 아래)
 camera:Object.freeze({pos:[0,1.85,1.55],look:[0,.92,0],fov:42,portrait:Object.freeze({pos:[0,2.15,1.75],fov:55})}),
 toLocal(x,y,out=new THREE.Vector3()){return out.set(this.left+x*this.cell,this.bottom+y*this.cell,this.front);},
});
// 희귀 칸 = 희귀·특별 인형 칸(구멍이 작게 그려짐, judgeKey의 isRare와 같게 쓴다)
export const keyCellRare=id=>{const r=(plushInfo(id)?.rarity)??(String(id).startsWith('guest-')?'special':'common');return r==='rare'||r==='special';};
function keyMiniScale(id){const s=sizeOf(id);return (.13+(s-.2)/.12*.05)/s;}   // 칸에 들어가게 줄인 비율(흔함 0.13m ~ 특별 0.18m, 희귀도 순서 유지). 다리 쪽은 자물쇠 판 뒤에 가려진다

// 반환 group.userData: kind 'key', machine, height, key(set({x,y,push,aim}) · state, aim = 칸 앞면 겨눔 점 보이기), setCells(ids) · cells[{i,j,id,rare,obj,hole}], setHoles({fit,fitRare,pityBonus,pity}),
//  markCell(i,j,'ok'|'near'|'miss'|null) · openCell(i,j)(칸 바닥이 열리고 인형이 떨어져 숨음, 0.6초) · resetCells() · cellAt(i,j), setLights, update, press, spots
export function buildKeyMachine(theme='key-1',{toonify=null,guestObject=null,cells=null}={}){
 const M=themeOf(theme),C=CLAW,K=KEY,W=C.width,D=C.depth,hw=W/2,hd=D/2,root=new THREE.Group();root.name=`인형뽑기 기계:${M.id}`;
 const mats=machineMats(M),b=builder(),late=[];mats.back.emissiveIntensity=.75;
 lowerBody(b,M,{glassTop:K.glassTop,height:K.height});
 const gw=K.cols*K.cell,gh=K.rows*K.cellH*K.cell,gz=(K.front+K.back)/2,gd=K.front-K.back;
 // 유리 상자 안: 바닥·칸 묶음 뒷벽(빛남)·칸 나눔 기둥과 선반·칸 아래 받침
 b.box('floor',W-.06,.02,D-.06,0,C.floorY-.005,0);
 b.box('back',gw,gh,.012,0,K.bottom+gh/2,K.back);
 for(let c=0;c<=K.cols;c++)b.box('dark',.014,gh+.014,gd,K.left+c*K.cell,K.bottom+gh/2,gz);
 for(let r=0;r<=K.rows;r++)b.box('dark',gw+.014,.014,gd,0,K.bottom+r*K.cellH*K.cell,gz);
 b.box('body',gw+.03,K.bottom-C.floorY,gd+.06,0,(K.bottom+C.floorY)/2,gz);
 // 열쇠 길: 아래 받침 앞 금색 홈(열쇠가 쉬는 줄) + 위 레일
 b.box('gold',gw+.02,.012,.03,0,K.bottom-.004,K.keyZ+.1);b.box('metal',gw+.02,.012,.012,0,K.bottom+gh+.03,K.keyZ+.1);
 // 앞쪽 바닥 장식 띠
 b.box('accent',gw+.06,.02,.02,0,K.bottom+gh+.05,K.front+.02);
 b.box('strip',gw,.015,.03,0,K.glassTop-.03,K.front+.06);
 b.build(mats,root,{outline:new Set(['body','top','dark'])});
 glassBox(root,late,{chuteGuard:false,glassTop:K.glassTop});
 // 간판(앞)
 // 간판(앞) = 간판 아틀라스 한 칸
 // 큰 단추(①옆으로 ②위로 같은 단추)
 const button=bigButton(root,KEY_BUTTON,'#e8443a',.062);button.name='열쇠 단추';
 finish(root,mats,toonify,late);
 {const m=machineKit.signMesh(M,W*.86,W*.86*3/8);if(m){m.position.set(0,K.glassTop+(K.height-K.glassTop)/2,hd+.004);root.add(m);}}
 // ── 칸: 자물쇠 판(칸 아래쪽, 앞면)·열쇠 구멍·칸 바닥 덮개(열리면 아래로 젖혀짐)·인형
 const plateMat=std(M.trim,{roughness:.6}),plateRare=std('#fff3c8',{roughness:.6}),holeMat=new THREE.MeshBasicMaterial({color:'#15161c'}),rimMat=std(SHOP_COLORS.coin,{roughness:.35,metalness:.35});
 const markMats={ok:new THREE.MeshBasicMaterial({color:'#5cf08a',transparent:true,opacity:.55,depthWrite:false}),near:new THREE.MeshBasicMaterial({color:'#ffe04a',transparent:true,opacity:.55,depthWrite:false}),miss:new THREE.MeshBasicMaterial({color:'#ff5a4a',transparent:true,opacity:.45,depthWrite:false})};
 const plateH=.105,flapGeo=new RoundedBoxGeometry(K.cell-.022,.01,gd-.03,1,.003),plateGeo=new RoundedBoxGeometry(K.cell-.02,plateH,.012,1,.004),holeGeo=new THREE.PlaneGeometry(1,1),rimGeo=new THREE.PlaneGeometry(1,1),markGeo=new THREE.PlaneGeometry(K.cell-.02,K.cellH*K.cell-.02);
 const cellList=[],cellGroup=new THREE.Group();cellGroup.name='열쇠 칸';root.add(cellGroup);
 const faceGroup=new THREE.Group();faceGroup.name='열쇠 구멍·칸 표시';   // 카툰 재질로 안 바꿈(구멍은 늘 짙게, 표시는 반투명 빛)
 for(let j=0;j<K.rows;j++)for(let i=0;i<K.cols;i++){
  const x0=K.left+i*K.cell,y0=K.bottom+j*K.cellH*K.cell,cx=x0+K.cell/2;
  const plate=new THREE.Mesh(plateGeo,plateMat);plate.position.set(cx,y0+.007+plateH/2,K.front+.008);plate.name=`자물쇠 판 ${i},${j}`;cellGroup.add(plate);
  const rim=new THREE.Mesh(rimGeo,rimMat),hole=new THREE.Mesh(holeGeo,holeMat);const hy=y0+K.holeY*K.cell;rim.position.set(cx,hy,K.front+.0145);hole.position.set(cx,hy,K.front+.0155);rim.name='구멍 테';hole.name=`열쇠 구멍 ${i},${j}`;cellGroup.add(rim);faceGroup.add(hole);
  // 칸 바닥 덮개: 칸 뒤쪽에 경첩(열리면 앞쪽이 아래로 떨어짐) — 인형이 그 위에 앉는다
  const hinge=new THREE.Group();hinge.position.set(cx,y0+.03,K.back+.008);const flap=new THREE.Mesh(flapGeo,mats.metal);flap.position.set(0,0,(gd-.03)/2);hinge.add(flap);hinge.name=`칸 바닥 ${i},${j}`;cellGroup.add(hinge);
  const mark=new THREE.Mesh(markGeo,markMats.ok);mark.position.set(cx,y0+K.cellH*K.cell/2,K.front+.02);mark.visible=false;mark.renderOrder=4;faceGroup.add(mark);
  cellList.push({i,j,id:null,rare:false,obj:null,plate,hole,rim,hinge,mark,open:0,opening:false,seat:new THREE.Vector3(cx,hinge.position.y+.006,gz+.01)});}
 toonify?.(cellGroup,{kind:'prop'});root.add(faceGroup);
 // 자물쇠 판 재질도 카툰으로 바뀐 것을 쓴다(희귀 칸 판은 따로 바꿔 둠)
 const plateMats={n:cellList[0].plate.material,r:toonify?(()=>{const m=new THREE.Mesh(new THREE.BufferGeometry(),plateRare);toonify(m,{kind:'prop'});return m.material;})():plateRare};
 const cellAt=(i,j)=>cellList[j*K.cols+i]??null;
 let holeConf={fit:.14,fitRare:.08,pityBonus:0,pity:false};
 const paintHoles=()=>{for(const c of cellList){const f=(c.rare?holeConf.fitRare:holeConf.fit)+(holeConf.pity?holeConf.pityBonus:0),s=2*f*K.cell;
  c.hole.scale.set(s,s,1);c.rim.scale.set(s+.008,s+.008,1);c.plate.material=c.rare?plateMats.r:plateMats.n;}};
 // 구멍 크기 = 판정 허용 폭(칸 단위 fit·fitRare, 보장 판이면 + pityBonus). 그린 정사각형 한 변 = 2 × fit × 칸 폭.
 const setHoles=(o={})=>{holeConf={...holeConf,...o};if(o.pityFitBonus!=null)holeConf.pityBonus=o.pityFitBonus;paintHoles();};
 const setCells=(ids)=>{for(const c of cellList){if(c.obj){cellGroup.remove(c.obj);c.obj=null;}}
  cellList.forEach((c,k)=>{const id=ids?.[k]??null;c.id=id;c.rare=id?keyCellRare(id):false;c.open=0;c.opening=false;c.hinge.rotation.x=0;
   if(id){const o=plushAt(id,{toonify,guestObject,scale:keyMiniScale(id)});o.position.copy(c.seat);o.rotation.y=(k%2?-.18:.18);o.name=`칸 인형:${id}`;cellGroup.add(o);c.obj=o;}});paintHoles();return cellList;};
 setCells(cells??resolvePool(M.cells??[],[]));   // 칸을 안 넘기면 공개판처럼 손님 자리는 대체 인형으로
 // ── 열쇠: 세로 기둥(x로 움직임)에 매달린 열쇠(y로 움직임), 끝이 -Z(칸 쪽)를 봄
 const keyRoot=new THREE.Group();keyRoot.name='열쇠';root.add(keyRoot);
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,gh+.08,8).translate(0,gh/2+.01,0),mats.metal);pole.position.set(0,K.bottom-.04,K.keyZ+.1);pole.name='열쇠 기둥';keyRoot.add(pole);
 const carrier=new THREE.Group();carrier.name='열쇠 수레';keyRoot.add(carrier);
 const keyArt=new THREE.Group();carrier.add(keyArt);
 {const gold=std('#ffd04a',{roughness:.3,metalness:.4,emissive:new THREE.Color('#5a3a00'),emissiveIntensity:.25});
  const bow=new THREE.Mesh(new THREE.TorusGeometry(.03,.01,8,18),gold);bow.position.z=.07;keyArt.add(bow);   // 고리는 앞(손님 쪽)을 봄
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.06,8).rotateX(Math.PI/2),gold);shaft.position.z=.03;keyArt.add(shaft);
  for(const [z,h] of [[.008,.018],[.024,.012]]){const t=new THREE.Mesh(new THREE.BoxGeometry(.006,h,.009),gold);t.position.set(0,-.008-h/2+.003,z);keyArt.add(t);}
  const clip=new THREE.Mesh(new THREE.BoxGeometry(.028,.024,.02),mats.accent);clip.position.set(0,0,.1);keyArt.add(clip);
  toonify?.(keyArt,{kind:'prop'});}
 // 겨눔 점: 열쇠 끝이 들어갈 자리(판정 좌표 x,y)를 칸 앞면에 작은 빨간 점으로 — 비스듬히 보는 카메라에서도 어느 칸을 겨누는지 보이게
 const aim=new THREE.Mesh(new THREE.CircleGeometry(.007,14),new THREE.MeshBasicMaterial({color:'#ff3b3b',transparent:true,opacity:.9,depthWrite:false}));aim.name='열쇠 겨눔 점';aim.renderOrder=5;root.add(aim);
 const keyState={x:K.startX,y:K.startY,push:0,aim:true};const _v=new THREE.Vector3();
 const setKey=({x=keyState.x,y=keyState.y,push=keyState.push,aim:showAim=keyState.aim}={})=>{Object.assign(keyState,{x,y,push,aim:showAim});K.toLocal(x,y,_v);
  keyRoot.position.x=_v.x;carrier.position.set(0,_v.y,K.keyZ-push*K.push);
  aim.position.set(_v.x,_v.y,K.front+.017);aim.visible=showAim&&y>=0&&push<.5;};
 setKey({});
 // 표시: ok = 초록(철컥) · near = 노랑(가장자리 딱) · miss = 빨강(튕김) · null 끔
 const markCell=(i,j,m)=>{const c=cellAt(i,j);if(!c)return;if(!m){c.mark.visible=false;return;}c.mark.material=markMats[m]??markMats.miss;c.mark.visible=true;};
 const fall=new Map();
 const openCell=(i,j)=>{const c=cellAt(i,j);if(!c||c.opening)return null;c.opening=true;c.open=0;fall.set(c,{t:0,y0:c.obj?.position.y??0});return c;};
 const resetCells=()=>{fall.clear();for(const c of cellList){c.opening=false;c.open=0;c.hinge.rotation.x=0;c.mark.visible=false;if(c.obj){c.obj.visible=true;c.obj.position.copy(c.seat);}}};
 const lights=lightController(M,mats);
 const update=dt=>{lights.update(dt);
  for(const [c,s] of fall){s.t+=dt;const k=Math.min(1,s.t/.25);c.hinge.rotation.x=k*1.25;
   if(c.obj){const tt=Math.max(0,s.t-.08);c.obj.position.y=s.y0-4.9*tt*tt;if(c.obj.position.y<K.bottom-.02)c.obj.visible=false;}
   if(s.t>.6){fall.delete(c);c.open=1;}}};
 const press=(k=1)=>{button.position.y=C.panel.top+.025-.012*k;};
 root.userData={kind:'key',machine:M,height:K.height,key:{set:setKey,state:keyState,root:keyRoot},cells:cellList,cellAt,setCells,setHoles,get holes(){return {...holeConf};},markCell,openCell,resetCells,
  setLights:lights.setLights,update,press,mats,camera:K.camera,
  spots:{stand:new THREE.Vector3(0,0,C.stand.z),button:new THREE.Vector3(KEY_BUTTON[0],C.panel.top+.04,KEY_BUTTON[2]),coin:new THREE.Vector3(...C.panel.coin).setZ(hd+.02),
   door:new THREE.Vector3(C.door[0],C.door[1],hd+.03),grid:new THREE.Vector3(0,K.bottom+gh/2,K.front),sign:new THREE.Vector3(0,K.height+.15,0)},pile:null};
 return root;
}

// 기계 종류(kind)대로 만들기. 집게는 buildClawMachine 그대로(인형 더미는 fillPile로 따로 채움).
export function buildMachine(theme,opts={}){const M=themeOf(theme);
 if(M.kind==='timer')return buildTimerMachine(M,opts);if(M.kind==='key')return buildKeyMachine(M,opts);return buildClawMachine(M,opts);}
