// 남산 순환버스 그림(월드아트, 11-19): 게임 속 전기 순환버스 · 백범광장 정류장 · 정상 광장 하차 지점 표식 · 버스 차로 · 버스 안에 앉은 동동이 자세.
// 실제 버스 회사 로고·노선 번호·차량 디자인을 따라 하지 않는다(월드기획 지시). 이름은 「남산 순환」만 쓰고, 표시는 우리 그림(산 + 잎).
// 모두 MeshStandard로 만들고 붙이는 쪽이 toon.toonify(group,{kind:'prop',keepMaps:true})로 카툰 재질로 바꾼다(글자판 무늬를 남기려고 keepMaps).
// 크기는 관악산·남산 소품과 같은 실제 크기(벤치 좌판 0.42m). 다만 창턱을 낮춘 전망 버스라 앉은 동동이(1.0m)의 머리·어깨가 창으로 보인다.
// 좌표: 버스·정류장 모두 앞 +Z, 오른쪽 -X(진행 방향 오른쪽 = 문 쪽), 바닥 y=0. place(obj,{x,y,z,tx,tz})로 차로 위에 놓는다.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {courseAt,NAMSAN} from './namsan-data.js';

// ── 치수(월드개발과 맞출 기준값) ──
export const BUS=Object.freeze({
 length:9.0,width:2.5,height:3.05,   // 바깥 크기(m). 지붕 배터리 덮개 포함 높이
 wheelBase:5.2,wheelR:.42,           // 앞뒤 바퀴 사이·바퀴 반지름(굴림: 1m 가면 1/0.42 rad)
 floor:.36,                          // 바닥 윗면 높이(낮은 바닥 버스)
 sill:1.2,windowTop:2.3,             // 옆 창 아래·위 높이(바닥 0 기준)
 seatTop:.78,                        // 의자 앉는 면 높이(바닥 0 기준) = floor + 0.42
 door:{z:[3.05,.25],width:1.3},      // 오른쪽(-X) 문 두 개의 가운데 z·폭(앞문·가운데 문)
 speedMax:11,                        // 월드개발 구현안: 서버 위치 한도 12m/s 아래
});
export const BUS_COLORS=Object.freeze({
 body:'#ffcb3d',bodyLow:'#f2a93b',stripe:'#3fb58f',roof:'#fff7e6',pod:'#dfe5e2',trim:'#3a3f45',tyre:'#2b2d31',hub:'#e9ecef',
 glass:'#9fd6ee',seat:'#e8553f',seatBack:'#c94634',floor:'#8e8a83',pole:'#ffd23f',light:'#fff3c4',tail:'#ff5a4a',
 road:'#8d8b88',roadEdge:'#f4f1ea',roadCenter:'#ffcf3f',curb:'#c9c3b6',bay:'#ffcf3f',
 shelterRoof:'#3fb58f',shelterFrame:'#2f7f68',shelterWood:'#b07a4a',sign:'#3fb58f',
});
const FONT='"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif';
const std=(color,o={})=>new THREE.MeshStandardMaterial({color,roughness:.85,...o});

// 재질별로 모아 한 메시로 합치는 도우미(그리기 횟수 줄이기)
function builder(){
 const parts=new Map();
 const add=(key,g)=>{if(!parts.has(key))parts.set(key,[]);parts.get(key).push(g);return g;};
 const box=(key,w,h,d,x,y,z,ry=0)=>{const g=new THREE.BoxGeometry(w,h,d);if(ry)g.rotateY(ry);g.translate(x,y,z);return add(key,g);};
 const rbox=(key,w,h,d,r,x,y,z)=>{const g=new RoundedBoxGeometry(w,h,d,3,Math.min(r,w/2-.001,h/2-.001,d/2-.001));g.translate(x,y,z);return add(key,g);};
 const cyl=(key,r0,r1,h,x,y,z,{seg=16,rx=0,rz=0}={})=>{const g=new THREE.CylinderGeometry(r0,r1,h,seg);if(rx)g.rotateX(rx);if(rz)g.rotateZ(rz);g.translate(x,y,z);return add(key,g);};
 const build=(mats,group)=>{for(const [key,list] of parts){const g=mergeGeometries(list.map(x=>x.index?x.toNonIndexed():x).map(x=>{for(const a of Object.keys(x.attributes))if(!['position','normal','uv'].includes(a))x.deleteAttribute(a);return x;}));
  const m=new THREE.Mesh(g,mats[key]);m.name=key;m.castShadow=!mats[key].transparent;m.receiveShadow=true;group.add(m);list.forEach(x=>x.dispose());}return group;};
 return {add,box,rbox,cyl,build};
}
// 캔버스 글자판(keepMaps로 무늬를 남긴다)
function canvasTex(w,h,draw){if(typeof document==='undefined')return null; // node 검사에서는 글자판 없이
 const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
// 우리 표시: 동그라미 안에 초록 산 두 봉우리 + 잎 하나(실제 버스·서울시 표시와 무관한 게임 그림)
function emblem(g,cx,cy,r,{bg='#ffffff',fg=BUS_COLORS.stripe}={}){
 g.fillStyle=bg;g.beginPath();g.arc(cx,cy,r,0,Math.PI*2);g.fill();
 g.fillStyle=fg;g.beginPath();g.moveTo(cx-r*.72,cy+r*.42);g.lineTo(cx-r*.22,cy-r*.38);g.lineTo(cx+.02*r,cy+.02*r);g.lineTo(cx+r*.3,cy-r*.22);g.lineTo(cx+r*.74,cy+r*.42);g.closePath();g.fill();
 g.fillStyle='#ffcb3d';g.beginPath();g.ellipse(cx+r*.32,cy-r*.52,r*.2,r*.1,-.6,0,Math.PI*2);g.fill();
}

// ── 1. 전기 순환버스 ──
// 반환 group.userData: seats(앉은 동동이 엉덩이 자리 목록, 버스 좌표, 앞 +Z를 봄)·drive(거리 m)·setNight(0~1)·setDoors(0~1)·size
export function buildBus({name='남산 순환버스'}={}){
 const C=BUS_COLORS,L=BUS.length,W=BUS.width,root=new THREE.Group();root.name=name;
 const b=builder(),hw=W/2,hl=L/2;
 // 몸통(속이 빈 껍데기 — 안의 의자·동동이가 창으로 보이게): 앞·뒤 둥근 머리 + 옆벽(창턱까지, 오른쪽은 문 자리 비움) + 지붕(크림) + 배터리 덮개.
 const lowH=BUS.sill-.3,lowY=.3+lowH/2,cap=.42,wallT=.08;
 b.rbox('body',W,lowH,cap,.2,0,lowY,hl-cap/2);b.rbox('body',W,lowH,cap,.2,0,lowY,-hl+cap/2);
 const doorSpans=BUS.door.z.map(z=>[z-BUS.door.width/2,z+BUS.door.width/2]),z0=-hl+cap-.05,z1=hl-cap+.05;
 for(const sx of [-1,1]){let cuts=[[z0,z1]];if(sx<0)for(const [a,c] of doorSpans)cuts=cuts.flatMap(([u,v])=>c<=u||a>=v?[[u,v]]:[[u,a],[c,v]].filter(([p,q])=>q-p>.05));
  for(const [u,v] of cuts){b.box('body',wallT,lowH,v-u,sx*(hw-wallT/2),lowY,(u+v)/2);b.box('stripe',.03,.16,v-u,sx*(hw+.012),BUS.sill-.12,(u+v)/2);}}
 for(const z of [hl,-hl])b.box('stripe',W-.5,.16,.03,0,BUS.sill-.12,z+Math.sign(z)*.012);
 b.box('bodyLow',W-.06,.3,L-.5,0,.2,0);                                  // 바닥 아래 짙은 치마(바닥 0.36보다 낮게)
 b.rbox('roof',W,.42,L,.24,0,BUS.windowTop+.17,0);
 b.rbox('pod',W-.7,.32,L*.52,.14,0,BUS.windowTop+.5,-.4);                // 전기 배터리 덮개(배기통 없음)
 // 창 기둥: 옆면 6칸, 앞뒤 모서리 둥근 기둥
 const posts=[-hl+.18,-2.6,-1.05,.25+.65+.08,2.35,hl-.18];
 for(const s of [-1,1])for(const z of posts){if(s<0&&Math.abs(z-BUS.door.z[1])<.75)continue;b.box('trim',.08,BUS.windowTop-BUS.sill+.04,.12,s*(hw-.03),(BUS.sill+BUS.windowTop)/2,z);}
 // 문(오른쪽 -X): 노란 문틀 + 유리 두 짝(setDoors로 열림)
 const doors=[];
 for(const dz of BUS.door.z){b.box('trim',.1,BUS.windowTop-.05,.08,-hw+.02,(BUS.windowTop+.05)/2,dz-BUS.door.width/2);b.box('trim',.1,BUS.windowTop-.05,.08,-hw+.02,(BUS.windowTop+.05)/2,dz+BUS.door.width/2);}
 // 앞: 큰 앞유리(살짝 누움)·행선지 띠·둥근 앞등(웃는 얼굴 느낌)·범퍼
 b.rbox('trim',W-.1,.34,.16,.08,0,.42,hl-.02);                             // 앞 범퍼
 b.rbox('trim',W-.1,.34,.16,.08,0,.42,-hl+.02);                            // 뒤 범퍼
 b.rbox('trim',W-.16,.36,.12,.06,0,BUS.windowTop+.05,hl-.02);              // 행선지 띠 바탕
 for(const s of [-1,1]){b.cyl('light',.16,.16,.08,s*(hw-.42),.82,hl+.01,{seg:20,rx:Math.PI/2});b.cyl('trim',.2,.2,.05,s*(hw-.42),.82,hl-.01,{seg:20,rx:Math.PI/2});
  b.rbox('tail',.24,.42,.06,.04,s*(hw-.3),.95,-hl-.005);}
 // 바퀴집(검은 반달) — 바퀴는 따로 돌린다
 for(const z of [BUS.wheelBase/2,-BUS.wheelBase/2])for(const s of [-1,1])b.cyl('trim',BUS.wheelR+.1,BUS.wheelR+.1,.06,s*(hw+.005),BUS.wheelR,z,{seg:20,rz:Math.PI/2});
 // 실내: 바닥·의자(2+2, 5줄, 앞을 봄)·노란 손잡이 기둥
 b.box('floor',W-.16,.06,L-.4,0,BUS.floor-.03,0);
 const seats=[];
 const rows=[-3.3,-2.35,-1.4,1.05,1.95]; // 가운데 문(z 0.25) 앞뒤는 비움
 for(const z of rows)for(const x of [-.78,-.36,.36,.78]){
  if(x<0&&z>.5&&z<1.3)continue;
  b.rbox('seat',.4,.12,.42,.04,x,BUS.seatTop-.06,z);b.rbox('seatBack',.4,.5,.1,.04,x,BUS.seatTop+.22,z-.22);b.box('trim',.06,BUS.seatTop-.12-BUS.floor,.06,x,(BUS.seatTop-.12+BUS.floor)/2,z);
  seats.push({x,y:BUS.seatTop,z:z+.02});}
 for(const z of [-1.9,.25-.9,.25+.9,2.5])for(const x of [-.57,.57])b.cyl('pole',.025,.025,BUS.windowTop-BUS.floor,x,(BUS.windowTop+BUS.floor)/2,z,{seg:8});
 // 운전석(왼쪽 앞, 게임 속 운전사는 없음 — 자동 운전 버스로 둔다): 계기판·핸들
 b.rbox('trim',W-.3,.4,.4,.06,0,BUS.sill-.15,hl-.45);
 b.cyl('trim',.17,.17,.04,.6,1.2,hl-.75,{seg:16,rx:-1.0});
 const mats={body:std(C.body),bodyLow:std(C.bodyLow),roof:std(C.roof),pod:std(C.pod),stripe:std(C.stripe),trim:std(C.trim),light:std(C.light,{emissive:new THREE.Color(C.light),emissiveIntensity:.15}),
  tail:std(C.tail,{emissive:new THREE.Color(C.tail),emissiveIntensity:.25}),floor:std(C.floor),seat:std(C.seat),seatBack:std(C.seatBack),pole:std(C.pole)};
 b.build(mats,root);
 // 유리: 옆 창 띠·앞유리·뒷유리 — 엷은 하늘색 반투명(안의 동동이가 보이게). 그림자 없음.
 const glass=new THREE.MeshStandardMaterial({color:C.glass,roughness:.15,metalness:0,transparent:true,opacity:.28,depthWrite:false,side:THREE.DoubleSide});
 const gl=[];
 for(const s of [-1,1]){const g=new THREE.PlaneGeometry(L-.5,BUS.windowTop-BUS.sill);g.rotateY(s*Math.PI/2);g.translate(s*(hw-.02),(BUS.sill+BUS.windowTop)/2,0);gl.push(g);}
 {const g=new THREE.PlaneGeometry(W-.24,BUS.windowTop-BUS.sill+.35);g.rotateX(-.12);g.translate(0,(BUS.sill+BUS.windowTop)/2-.18,hl-.06);gl.push(g);
  const r=new THREE.PlaneGeometry(W-.4,BUS.windowTop-BUS.sill-.2);r.rotateY(Math.PI);r.translate(0,(BUS.sill+BUS.windowTop)/2+.05,-hl+.01);gl.push(r);}
 const glassMesh=new THREE.Mesh(mergeGeometries(gl),glass);glassMesh.name='버스 유리';glassMesh.renderOrder=2;root.add(glassMesh);gl.forEach(g=>g.dispose());
 // 문짝(유리 + 노란 테): 오른쪽 문 두 곳, 두 짝씩 앞뒤로 미끄러져 열림
 for(const dz of BUS.door.z)for(const s of [-1,1]){const leaf=new THREE.Group();leaf.name='버스 문';
  const pane=new THREE.Mesh(new THREE.PlaneGeometry(BUS.door.width/2-.06,BUS.windowTop-BUS.sill+.05),glass);pane.rotation.y=-Math.PI/2;pane.position.y=(BUS.windowTop+BUS.sill)/2-.02;pane.renderOrder=2;
  const low=new THREE.Mesh(new THREE.BoxGeometry(.06,BUS.sill-.3,BUS.door.width/2-.04),mats.body);low.position.y=(BUS.sill+.3)/2;low.castShadow=true;
  const edge=new THREE.Mesh(new THREE.BoxGeometry(.07,BUS.windowTop-.3,.06),mats.trim);edge.position.set(0,(BUS.windowTop+.3)/2,-s*(BUS.door.width/4-.03));
  leaf.add(pane,low,edge);leaf.position.set(-hw+.02,0,dz+s*BUS.door.width/4);leaf.userData={z0:leaf.position.z,dir:s};root.add(leaf);doors.push(leaf);}
 // 바퀴 4개(돌림)
 const wheels=[],tyre=std(C.tyre),hub=std(C.hub);
 for(const z of [BUS.wheelBase/2,-BUS.wheelBase/2])for(const s of [-1,1]){const w=new THREE.Group();w.name='버스 바퀴';
  const t=new THREE.Mesh(new THREE.CylinderGeometry(BUS.wheelR,BUS.wheelR,.3,20).rotateZ(Math.PI/2),tyre);t.castShadow=true;
  const h=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.32,12).rotateZ(Math.PI/2),hub);
  const dot=new THREE.Mesh(new THREE.BoxGeometry(.33,.06,.3),tyre);
  w.add(t,h,dot);w.position.set(s*(hw-.16),BUS.wheelR,z);root.add(w);wheels.push(w);}
 // 글자판: 앞 행선지 「남산 순환」(밤에 빛남), 옆 「남산 순환버스」 + 표시, 뒤 「남산 순환」
 const dest=canvasTex(512,80,(g,w,h)=>{g.fillStyle='#1f2a2c';g.fillRect(0,0,w,h);g.fillStyle='#ffb43a';g.font=`900 52px ${FONT}`;g.textAlign='center';g.textBaseline='middle';g.fillText('남산 순환',w/2+20,h/2+3);emblem(g,58,h/2,28,{bg:'#1f2a2c',fg:'#5fe0b0'});});
 const destMat=new THREE.MeshStandardMaterial({map:dest,emissive:new THREE.Color('#ffffff'),emissiveMap:dest,emissiveIntensity:.35,roughness:.6});
 const dPlane=new THREE.Mesh(new THREE.PlaneGeometry(W-.34,.28),destMat);dPlane.position.set(0,BUS.windowTop+.05,hl+.045);dPlane.name='버스 행선지';root.add(dPlane);
 const back=dPlane.clone();back.position.set(0,BUS.windowTop+.12,-hl-.01);back.rotation.y=Math.PI;back.scale.setScalar(.8);root.add(back);
 const side=canvasTex(1024,128,(g,w,h)=>{g.clearRect(0,0,w,h);emblem(g,64,h/2,50);g.fillStyle='#ffffff';g.font=`900 74px ${FONT}`;g.textBaseline='middle';g.fillText('남산 순환버스',132,h/2+4);
  g.font=`800 40px ${FONT}`;g.fillStyle='#e6fff4';g.fillText('⚡ 전기',w-190,h/2+4);});
 const sideMat=new THREE.MeshStandardMaterial({map:side,transparent:true,alphaTest:.3,roughness:.8});
 for(const s of [-1,1]){const p=new THREE.Mesh(new THREE.PlaneGeometry(3.6,.45),sideMat);p.rotation.y=s*Math.PI/2;p.position.set(s*(hw+.012),.78,s>0?-1.0:-1.6);p.name='버스 옆 글자';root.add(p);}
 // 실내 등(밤): 천장 띠
 const ceil=new THREE.Mesh(new THREE.BoxGeometry(.3,.03,L-1.2),std('#fff6dc',{emissive:new THREE.Color('#ffe7b0'),emissiveIntensity:0}));ceil.position.set(0,BUS.windowTop-.02,0);ceil.name='버스 실내등';root.add(ceil);
 let rolled=0;
 root.userData={kind:'bus',size:{length:L,width:W,height:BUS.height},seats,doorSide:-1,doorZ:[...BUS.door.z],
  // 바퀴 굴리기: 지난번 뒤로 간 거리(m, 뒤로 가면 음수)
  drive(d){rolled+=d/BUS.wheelR;for(const w of wheels)w.rotation.x=rolled;},
  setNight(n){glass.emissive.set('#ffd98a');glass.emissiveIntensity=n*.45;mats.light.emissiveIntensity=.15+n*2.4;mats.tail.emissiveIntensity=.25+n*1.2;destMat.emissiveIntensity=.35+n*.9;ceil.material.emissiveIntensity=n*2.2;},
  // 문 열림 0(닫힘)~1(열림)
  setDoors(k){for(const d of doors)d.position.z=d.userData.z0+d.userData.dir*BUS.door.width*.46*k;}};
 return root;
}

// 길 위 s 자리에 놓기(앞이 진행 방향). 경사(앞뒤 바퀴 높이 차)만큼 앞뒤로 기운다. lane = G.bus.cycle(버스가 도는 닫힌 길) — {points}면 무엇이든
export function placeOnLane(obj,lane,s,{reverse=false}={}){
 const half=BUS.wheelBase/2,Lc=lane.points.at(-1).s,wrap=x=>lane.closed?((x%Lc)+Lc)%Lc:x,a=courseAt(lane.points,wrap(s-half)),b=courseAt(lane.points,wrap(s+half)),m=courseAt(lane.points,wrap(s));
 const dir=reverse?-1:1;obj.position.set(m.x,(a.y+b.y)/2,m.z);obj.rotation.set(0,0,0);obj.rotation.order='YXZ';
 obj.rotation.y=Math.atan2(m.tx*dir,m.tz*dir);obj.rotation.x=-Math.atan2((b.y-a.y)*dir,BUS.wheelBase);
 return obj;
}

// ── 2. 버스 차로: 폭 6.4m 아스팔트 + 양옆 흰 선 + 가운데 노란 겹선(점선) + 연석(비탈을 따라 이어진 띠). 두 광장 판석 안에서는 아스팔트 대신
// 버스가 도는 고리 길을 판석 위에 노란 점선 두 줄로 칠하고, 정류장 칸(노란 테 + 「버스」)·걷는 코스가 지나는 곳 횡단보도를 칠한다 ──
const ribbonGeo=(run,off0,off1,lift,yOf=m=>m.y)=>{const pos=[],idx=[];run.forEach((m,k)=>{for(const o of [off0,off1])pos.push(m.x+m.nx*o,yOf(m)+lift,m.z+m.nz*o);if(k){const a=(k-1)*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;};
// 세로 벽 띠: 위 선(off, top) → 아래(땅 - 0.4)
const wallGeo=(run,off,top,G)=>{const pos=[],idx=[];run.forEach((m,k)=>{const x=m.x+m.nx*off,z=m.z+m.nz*off;pos.push(x,m.y+top,z,x,Math.min(m.y,G.ground(x,z))-.4,z);if(k){const a=(k-1)*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}}); // 한 겹(양면 재질). 앞뒤 두 겹이면 법선이 0이 되어 카툰 외곽선이 크게 터짐
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;};
export function buildBusRoad(G){
 const lane=G.bus,P=lane.points,W=P[0].width,group=new THREE.Group();group.name='남산 순환버스 차로';const C=BUS_COLORS;
 const SP=G.startPlaza,PP=G.plaza,inside=(p,pad=0)=>Math.hypot(p.x-SP.x,p.z-SP.z)<SP.r-pad||Math.hypot(p.x-PP.x,p.z-PP.z)<PP.r-pad;
 const S=[];for(let s=0;s<=lane.length;s+=1.5)S.push(courseAt(P,s));S.push(courseAt(P,lane.length));
 const runs=[];let cur=null;for(const m of S){if(inside(m,.5)){cur=null;continue;}if(!cur)runs.push(cur=[]);cur.push(m);}
 const asphalt=[],edge=[],center=[],curbTop=[],curbSide=[];
 for(const run of runs.filter(r=>r.length>1)){
  asphalt.push(ribbonGeo(run,W/2,-W/2,.06));
  for(const s of [-1,1])edge.push(ribbonGeo(run,s*(W/2-.25),s*(W/2-.4),.075));
  for(let k=0;k+2<run.length;k+=4){const piece=run.slice(k,k+3);for(const o of [.1,-.1])center.push(ribbonGeo(piece,o+.05,o-.05,.08));}
  // 연석: 폭 0.24m·노면 위 0.14m, 바깥 옆면은 땅 밑까지
  for(const s of [-1,1]){curbTop.push(ribbonGeo(run,s*W/2,s*(W/2+.24),.2));curbSide.push(wallGeo(run,s*(W/2+.24),.2,G),wallGeo(run,s*W/2,.2,G));}
 }
 // 광장 안: 버스 고리 길 안내선(버스 폭 + 0.4m 바깥에 노란 점선 두 줄, 판석 위 0.02m)
 const cyc=lane.cycle,CS=[];for(let s=0;s<cyc.length;s+=1)CS.push(courseAt(cyc.points,s));
 const guide=[];{let run=[];const flush=()=>{for(let k=0;k+1<run.length;k+=3){const piece=run.slice(k,k+2);for(const o of [BUS.width/2+.4,-(BUS.width/2+.4)])guide.push(ribbonGeo(piece,o+.07,o-.07,.065));}run=[];};
  for(const m of CS){if(inside(m,1)){run.push(m);}else flush();}flush();}
 const add=(list,mat,name,shadow=false)=>{if(!list.length)return;const m=new THREE.Mesh(mergeGeometries(list),mat);m.name=name;m.receiveShadow=true;m.castShadow=shadow;group.add(m);list.forEach(g=>g.dispose());};
 add(asphalt,std(C.road,{roughness:.95}),'차로 아스팔트');add(edge,std(C.roadEdge),'차로 흰 선');add(center,std(C.roadCenter),'차로 가운데 노란 선');
 add(curbTop,std(C.curb),'차로 연석 윗면');add(curbSide,std(C.curb,{side:THREE.DoubleSide}),'차로 연석 옆면');add(guide,std(C.bay),'광장 버스 길 안내선');
 // 정류장 칸
 for(const st of Object.values(lane.stops))group.add(busBay(cyc,st));
 // 횡단보도: 걷는 코스가 광장 안 버스 고리 길을 건너는 곳(흰 줄 7개)
 const zebra=[];let crossings=0;
 for(let i=1;i<G.points.length;i++){const p=G.points[i];if(!inside(p,1))continue;const hit=cyc.nearest(p.x,p.z);if(hit.distance>.8)continue;
  const m=courseAt(G.points,p.s);for(let k=-3;k<=3;k++){const g=new THREE.BoxGeometry(.45,.02,BUS.width+1.4);g.rotateY(Math.atan2(m.nx,m.nz));const c=courseAt(G.points,p.s+k*.9);g.translate(c.x,(inside(c,1)?(Math.hypot(c.x-SP.x,c.z-SP.z)<SP.r?SP.y:PP.y):c.y)+.065,c.z);zebra.push(g);}
  crossings++;i+=12;}
 add(zebra,std('#ffffff'),'광장 횡단보도');
 group.userData={length:lane.length,cycle:cyc.length,runs:runs.length,crossings};
 return group;
}
// 정류장 칸: 버스가 서는 s 앞뒤 8m, 고리를 따라 휘는 노란 테 + 가운데 「버스」 글자
function busBay(cyc,st){
 const g=new THREE.Group();g.name=`버스 세우는 칸 ${st.name}`;const half=BUS.width/2+.45,run=[];for(let s=st.bay[0];s<=st.bay[1]+.01;s+=1)run.push(courseAt(cyc.points,s));
 const y=()=>st.y;const lines=[ribbonGeo(run,half,half-.16,.07,y),ribbonGeo(run,-half+.16,-half,.07,y)];
 for(const m of [run[0],run.at(-1)])lines.push(ribbonGeo([{...m,x:m.x-m.tx*.08,z:m.z-m.tz*.08},{...m,x:m.x+m.tx*.08,z:m.z+m.tz*.08}],half,-half,.07,y));
 const mesh=new THREE.Mesh(mergeGeometries(lines),std(BUS_COLORS.bay));mesh.name='버스 칸 테';mesh.receiveShadow=true;g.add(mesh);lines.forEach(x=>x.dispose());
 const tex=canvasTex(256,128,(c,w,h)=>{c.clearRect(0,0,w,h);c.fillStyle=BUS_COLORS.bay;c.font=`900 100px ${FONT}`;c.textAlign='center';c.textBaseline='middle';c.fillText('버스',w/2,h/2+6);});
 const m=courseAt(cyc.points,st.s),word=new THREE.Mesh(new THREE.PlaneGeometry(2.2,1.1),new THREE.MeshStandardMaterial({map:tex,transparent:true,alphaTest:.35,depthWrite:false}));
 word.rotation.order='YXZ';word.rotation.set(-Math.PI/2,Math.atan2(m.tx,m.tz)+Math.PI/2,0);word.position.set(m.x-m.tx*3,st.y+.075,m.z-m.tz*3);word.name='버스 칸 글자';g.add(word);
 return g;
}

// ── 3. 정류장(백범광장): 초록 지붕 대기소(나무 의자) + 둥근 정류장 표지 + 시간표 판(setBoard로 글 바꿈) ──
// 원점 = 차로 가장자리 밖 1.6m(stops.*.x,z). 앞 +Z = 버스 진행 방향, 차로는 -side 쪽(side = 광장 쪽).
function stopSignPole(name,sub){
 const g=new THREE.Group();g.name='정류장 표지';const C=BUS_COLORS;
 const post=new THREE.Mesh(new THREE.CylinderGeometry(.05,.06,2.9,10),std(C.trim));post.position.y=1.45-.3;post.castShadow=true;g.add(post);
 const face=canvasTex(512,512,(c,w,h)=>{c.fillStyle=C.sign;c.beginPath();c.arc(w/2,h/2,w/2-4,0,Math.PI*2);c.fill();c.strokeStyle='#ffffff';c.lineWidth=18;c.beginPath();c.arc(w/2,h/2,w/2-26,0,Math.PI*2);c.stroke();
  // 작은 버스 그림(우리 버스 옆모습)
  c.fillStyle='#ffcb3d';c.beginPath();c.roundRect(118,120,276,140,30);c.fill();c.fillStyle='#bfe6f5';for(let i=0;i<4;i++){c.beginPath();c.roundRect(140+i*62,140,48,54,8);c.fill();}
  c.fillStyle='#2b2d31';for(const x of [178,334]){c.beginPath();c.arc(x,262,24,0,Math.PI*2);c.fill();}
  c.fillStyle='#ffffff';c.textAlign='center';c.textBaseline='middle';c.font=`900 66px ${FONT}`;c.fillText(name,w/2,348);c.font=`800 40px ${FONT}`;c.fillText(sub,w/2,410);});
 const disc=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.05,32).rotateX(Math.PI/2),[std(C.trim),new THREE.MeshStandardMaterial({map:face,roughness:.7}),new THREE.MeshStandardMaterial({map:face,roughness:.7})]);
 // 원기둥 면 1(위)·2(아래)는 앞뒤 면 — 둥근 판 앞뒤 모두 그림
 disc.position.y=2.75;disc.castShadow=true;disc.name='정류장 표지 판';g.add(disc);
 return g;
}
function boardTexture(lines){return canvasTex(384,512,(c,w,h)=>{c.fillStyle='#fffaf0';c.fillRect(0,0,w,h);c.fillStyle=BUS_COLORS.sign;c.fillRect(0,0,w,92);emblem(c,52,46,30);
 c.fillStyle='#ffffff';c.font=`900 44px ${FONT}`;c.textBaseline='middle';c.fillText('남산 순환',96,48);
 c.fillStyle='#2a2925';c.textAlign='center';lines.forEach((t,i)=>{c.font=i===1?`900 92px ${FONT}`:`800 38px ${FONT}`;c.fillText(t,w/2,i===0?150:i===1?258:350+(i-2)*52);});});}
export function buildBusStop(st,{kind='shelter'}={}){
 const C=BUS_COLORS,root=new THREE.Group();root.name=`버스 정류장 ${st.name}`;
 root.position.set(st.x,st.y+.04,st.z);root.rotation.y=st.heading;
 const toRoad=st.side>0?1:-1; // side +1 = 광장이 오른쪽(-X) → 차로는 +X
 const b=builder();
 if(kind==='shelter'){
  // 대기소: 폭(앞뒤) 4.2m·깊이 1.7m·높이 2.5m. 뒷벽은 광장 쪽(차로 반대), 열린 쪽이 차로를 봄
  const D=1.7,Lz=4.2,back=-toRoad*(D+.4);
  for(const z of [-Lz/2+.1,Lz/2-.1])for(const x of [back,back+toRoad*D]){b.box('frame',.1,2.5,.1,x,1.25,z);}
  b.rbox('roofTop',D+.6,.16,Lz+.5,.07,back+toRoad*D/2,2.55,0);
  b.box('frame',.06,.12,Lz,back+toRoad*(D+.25),2.43,0);
  b.box('wood',.42,.06,Lz-.6,back+toRoad*.32,.45,0);b.box('wood',.06,.36,Lz-.6,back+toRoad*.08,.72,0);
  for(const z of [-1.3,0,1.3])b.box('frame',.06,.42,.06,back+toRoad*.32,.21,z);
  b.build({frame:std(C.shelterFrame),roofTop:std(C.shelterRoof),wood:std(C.shelterWood)},root);
  // 뒷벽 유리 + 옆 유리(반투명)
  const glass=new THREE.MeshStandardMaterial({color:'#cfeaf3',transparent:true,opacity:.35,depthWrite:false,roughness:.2,side:THREE.DoubleSide});
  const bw=new THREE.Mesh(new THREE.PlaneGeometry(Lz-.2,1.9),glass);bw.rotation.y=Math.PI/2;bw.position.set(back,1.25,0);root.add(bw);
  // 시간표 판(옆벽, 버스 오는 쪽 = 뒤 -Z 끝): 월드개발이 setBoard(['다음 버스','0:24','정상까지 약 3분'])로 바꿈
  let tex=boardTexture(['다음 버스','–:––','정상까지 약 3분']);
  const board=new THREE.Mesh(new THREE.PlaneGeometry(.9,1.2),new THREE.MeshStandardMaterial({map:tex,roughness:.7,emissive:new THREE.Color('#ffffff'),emissiveMap:tex,emissiveIntensity:.08}));
  board.position.set(back+toRoad*D/2,1.35,-Lz/2+.06);board.name='정류장 시간표';root.add(board);
  const board2=board.clone();board2.rotation.y=Math.PI;board2.position.z=-Lz/2+.04;root.add(board2);
  root.userData.setBoard=lines=>{const old=tex;tex=boardTexture(lines);board.material.map=board.material.emissiveMap=tex;board.material.needsUpdate=true;old?.dispose();};
  root.userData.setNight=n=>{board.material.emissiveIntensity=.08+n*.7;};
  root.userData.bench={x:back+toRoad*.32,y:.45,z:0,heading:toRoad>0?Math.PI/2:-Math.PI/2}; // 대기소 의자(로컬)
 }
 // 둥근 정류장 표지: 차로 가장자리 0.6m 안쪽(보도), 버스 앞문 가까이(+Z 쪽)
 const sign=stopSignPole(st.name,kind==='shelter'?'남산 순환버스':'버스 타는 곳 · 내리는 곳');sign.position.set(-toRoad*.2,0,kind==='shelter'?2.6:3.2);root.add(sign); // 판은 앞뒤(±Z)를 봄 — 오는 버스·떠나는 쪽 둘 다에서 보임
 if(kind!=='shelter')root.userData.setNight=()=>{};
 return root;
}
// ── 4. 정상 광장 하차 지점: 둥근 표지 + 바닥 안내 화살표(전망탑 쪽) + 낮은 볼라드 4개(버스 칸과 광장 경계) ──
export function buildSummitDropOff(G){
 const st=G.bus.stops.summit,root=buildBusStop(st,{kind:'marker'});root.name='하차 지점 표지';
 const toRoad=st.side>0?1:-1,C=BUS_COLORS;
 const bol=[];for(const z of [-6,-2.5,4.5,7.5]){const g=new THREE.CylinderGeometry(.13,.15,.7,12);g.translate(-toRoad*.25,.35,z);bol.push(g);const c=new THREE.CylinderGeometry(.14,.14,.12,12);c.translate(-toRoad*.25,.62,z);bol.push(c);}
 const bm=new THREE.Mesh(mergeGeometries(bol),std(C.body));bm.name='하차 지점 볼라드';bm.castShadow=true;root.add(bm);bol.forEach(g=>g.dispose());
 // 바닥 화살표 「전망탑」: 표지에서 광장 쪽 2.4m 판석 위, 전망탑을 가리킴(월드 좌표로 따로 둠 → group으로 묶어 돌려줌)
 const arrow=canvasTex(256,384,(c,w,h)=>{c.clearRect(0,0,w,h);c.fillStyle='rgba(63,181,143,.92)';c.beginPath();c.moveTo(w/2,10);c.lineTo(w-20,150);c.lineTo(w/2+46,150);c.lineTo(w/2+46,260);c.lineTo(w/2-46,260);c.lineTo(w/2-46,150);c.lineTo(20,150);c.closePath();c.fill();
  c.fillStyle='#2f7f68';c.font=`900 56px ${FONT}`;c.textAlign='center';c.fillText('전망탑',w/2,330);});
 const a=new THREE.Mesh(new THREE.PlaneGeometry(1.4,2.1),new THREE.MeshStandardMaterial({map:arrow,transparent:true,alphaTest:.3,depthWrite:false}));a.rotation.x=-Math.PI/2;a.name='하차 지점 바닥 화살표';a.renderOrder=1;
 const tw=NAMSAN.tower,dx=tw.x-st.x,dz=tw.z-st.z,dl=Math.hypot(dx,dz)||1,holder=new THREE.Group();holder.add(a);
 holder.position.set(st.x+dx/dl*2.4,G.plaza.y+.06,st.z+dz/dl*2.4);holder.rotation.y=Math.atan2(-dx,-dz);
 const group=new THREE.Group();group.name='정상 광장 버스 하차 지점';group.add(root,holder);group.userData=root.userData;
 return group;
}

// ── 5. 버스에 앉은 동동이 자세: 엉덩이를 의자에, 허벅지 앞으로, 무릎 아래로(짧은 다리는 바닥에 안 닿음), 손은 무릎 위 ──
// avatar = 동동이 scene(link-hiker). 걷기 애니메이션(mixer)을 멈춘 뒤 부르고, seat(버스 좌표 seats[i])에 avatar를 버스 자식으로 붙인다.
// 되돌리기: 반환 함수 호출(바인드 자세 restPose로). 다른 몸짓 코드가 같은 뼈를 매 프레임 덮으면 그 뒤에 다시 부른다.
const _v=new THREE.Vector3(),_w=new THREE.Vector3(),_q=new THREE.Quaternion(),_p=new THREE.Quaternion();
function aim(bone,child,dirWorld){
 bone.updateMatrixWorld(true);const a=bone.getWorldPosition(_v),c=child.getWorldPosition(_w).sub(a).normalize();
 const delta=_q.setFromUnitVectors(c,dirWorld.clone().normalize());
 const wq=bone.getWorldQuaternion(new THREE.Quaternion()),pq=bone.parent.getWorldQuaternion(_p);
 bone.quaternion.copy(pq.invert().multiply(delta.multiply(wq)));bone.updateMatrixWorld(true);
}
export function poseBusRider(avatar){
 let rest=null;avatar.traverse(o=>{rest??=o.userData?.restPose??null;});const bones={};avatar.traverse(o=>{if(o.isBone)bones[o.name.replace('mixamorig','')]=o;});
 if(rest)for(const [n,r] of Object.entries(rest)){const bo=avatar.getObjectByName(n);if(bo){bo.quaternion.fromArray(r.q);bo.position.fromArray(r.p);}}
 avatar.updateMatrixWorld(true);
 const Q=new THREE.Quaternion();avatar.getWorldQuaternion(Q);
 const fwd=new THREE.Vector3(0,-.12,1).applyQuaternion(Q),down=new THREE.Vector3(0,-1,.18).applyQuaternion(Q),lap=new THREE.Vector3(0,-.55,1).applyQuaternion(Q);
 for(const s of ['Left','Right']){
  if(bones[s+'UpLeg']&&bones[s+'Leg'])aim(bones[s+'UpLeg'],bones[s+'Leg'],fwd);
  if(bones[s+'Leg']&&bones[s+'Foot'])aim(bones[s+'Leg'],bones[s+'Foot'],down);
  if(bones[s+'Arm']&&bones[s+'ForeArm'])aim(bones[s+'Arm'],bones[s+'ForeArm'],new THREE.Vector3(s==='Left'?.25:-.25,-1,.35).applyQuaternion(Q));
  if(bones[s+'ForeArm']&&bones[s+'Hand'])aim(bones[s+'ForeArm'],bones[s+'Hand'],lap);
 }
 return ()=>{if(rest)for(const [n,r] of Object.entries(rest)){const bo=avatar.getObjectByName(n);if(bo){bo.quaternion.fromArray(r.q);bo.position.fromArray(r.p);}}};
}
// 동동이를 버스 의자 i에 앉힌다(버스 자식으로). 엉덩이 높이 = seatTop + hikerProfile.seat.hipAbove(0.09)
export function seatInBus(bus,avatar,i=0){
 const seat=bus.userData.seats[i%bus.userData.seats.length];bus.add(avatar);
 avatar.position.set(seat.x,0,seat.z);avatar.rotation.set(0,0,0);avatar.updateMatrixWorld(true);
 const undo=poseBusRider(avatar);
 // 엉덩이 뼈 높이를 의자 + 0.09에 맞춘다
 const hips=avatar.getObjectByName('mixamorigHips');if(hips){const y=hips.getWorldPosition(new THREE.Vector3());bus.worldToLocal(y);let prof=null;avatar.traverse(o=>{prof??=o.userData?.hikerProfile??null;});avatar.position.y+=seat.y+(prof?.seat?.hipAbove??.09)-y.y;}
 return undo;
}

// ── 한 번에 조립(buildNamsan이 G.bus가 있으면 부름): 차로 + 정류장 + 하차 지점 + 백범광장에 서 있는 버스 한 대 ──
export function buildNamsanBus(G){
 const root=new THREE.Group();root.name='남산 순환버스';
 const road=buildBusRoad(G),stop=buildBusStop(G.bus.stops.start),drop=buildSummitDropOff(G);
 const bus=buildBus();placeOnLane(bus,G.bus.cycle,G.bus.stops.start.s);bus.userData.setDoors(1);
 root.add(road,stop,drop,bus);
 const update=(t,night)=>{bus.userData.setNight(night);stop.userData.setNight?.(night);};
 return {root,road,stop,drop,bus,update};
}
