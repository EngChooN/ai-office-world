// 마을 「썰매 경주」 판 그림(월드아트, 2026-11-18 · 월드개발 1차 판을 다듬음). 자리·가까이 판정·상태 계산은 sled-play.js(RACE_BOARD),
// 이 파일은 모양과 글 판 칠하기만 한다(three·캔버스, 서버에서 쓰지 않음).
// 모양: 지팡이 사탕 기둥 2개 + 짙은 나무 틀 + 눈 덮인 지붕 + 줄 색 4색 삼각 깃발 줄 + 지붕 위 작은 빨간 썰매 + 양 끝 전구.
// 그리기: 나무·기둥·깃발(꼭짓점 색 한 덩어리) 1 + 글 판 1 + 전구 1 + 지붕 위 썰매(props buildSled, 합쳐 둔 것).
// 글 판: 위 빨간 띠 「썰매 경주」 · 지금 상태 알약(경주 없음 / 모집 중 n/4 · 남은 초 + 줄 색 자리 4칸 / 달리는 중) · 오늘의 기록 위 3명(금·은·동 동그라미).
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {XMAS} from './palette.js';
import * as P from './props.js';

export const RACE_BOARD_ART=Object.freeze({w:2.0,h:1.3,y:1.62,cw:640,ch:416});
const INK='#4a3618',PAPER='#fbf3df',SUB='#7a5f3a',MEDAL=['#e9b949','#c9d1dc','#c98a52'];
const FONT='"Apple SD Gothic Neo","Noto Sans KR",sans-serif';
const lin=hex=>new THREE.Color(hex);
const paintGeo=(geo,colorAt)=>{const g=geo.index?geo.toNonIndexed():geo,p=g.attributes.position,c=[];for(let i=0;i<p.count;i++){const k=colorAt(p.getX(i),p.getY(i),p.getZ(i));c.push(k.r,k.g,k.b);}
 g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));if(g.attributes.uv)g.deleteAttribute('uv');return g;};
const solid=(geo,hex)=>{const k=lin(hex);return paintGeo(geo,()=>k);};

export function buildRaceBoardArt({tz,doc=document,mobile=false}={}){
 const A=RACE_BOARD_ART,g=new THREE.Group();g.name='썰매 경주 판';
 const top=A.y+A.h/2,roofY=top+.26;
 const parts=[];
 // 틀(앞 판보다 조금 크게) · 지붕(나무) · 지붕 위 눈
 parts.push(solid(new THREE.BoxGeometry(A.w+.16,A.h+.16,.1).translate(0,A.y,0),XMAS.woodDark));
 parts.push(solid(new THREE.BoxGeometry(A.w+.5,.08,.56).translate(0,roofY,0),XMAS.wood));
 parts.push(solid(new THREE.CapsuleGeometry(.09,A.w+.36,4,10).rotateZ(Math.PI/2).scale(1,.9,2.9).translate(0,roofY+.09,0),XMAS.snow));
 // 기둥: 지팡이 사탕 줄무늬(빨강·흰, 0.2m마다), 땅에서 지붕까지
 const cR=lin(XMAS.candyStripe),cW=lin(XMAS.candy);
 for(const sx of [-1,1]){const x=sx*(A.w/2+.12);parts.push(paintGeo(new THREE.CylinderGeometry(.07,.08,roofY,10,12).translate(x,roofY/2,0),(px,py)=>Math.floor(py*5)%2?cR:cW));}
 // 삼각 깃발 줄(줄 색 1·2·3·4 되풀이): 지붕 앞 가장자리 아래로 살짝 처진 줄
 {const n=8,span=A.w+.3,z=.3,sag=.07;
  for(let i=0;i<n;i++){const t=(i+.5)/n,x=-span/2+span*t,yy=roofY-.06-Math.sin(Math.PI*t)*sag,s=span/n*.42,k=lin(XMAS.lane[i%4]);
   const geo=new THREE.BufferGeometry();const v=[x-s,yy,z,x+s,yy,z,x,yy-.2,z, x+s,yy,z,x-s,yy,z,x,yy-.2,z];geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geo.computeVertexNormals();parts.push(paintGeo(geo,()=>k));}
  // 깃발 줄 끈
  parts.push(solid(new THREE.BoxGeometry(span,.018,.018).translate(0,roofY-.06-sag*.6,z),XMAS.woodDark));}
 const body=new THREE.Mesh(mergeGeometries(parts),new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0,side:THREE.DoubleSide}));body.name='썰매 경주 판 몸';body.castShadow=!mobile;body.receiveShadow=true;g.add(body);
 // 지붕 위 작은 썰매(무엇을 하는 판인지 멀리서도 보이게)
 {const s=P.buildSled(null);s.scale.setScalar(.5);s.position.set(0,roofY+.16,0);s.rotation.y=Math.PI/2;s.name='판 위 썰매';g.add(s);}
 tz?.(g,{kind:'prop'});
 // 전구(지붕 양 끝): 모집 중이면 깜빡임
 const bulbs=new THREE.Mesh(mergeGeometries([-1,1].map(sx=>new THREE.SphereGeometry(.07,10,8).translate(sx*(A.w/2+.12),roofY+.02,.28))),P.glow(XMAS.window,2.4));bulbs.name='판 전구';g.add(bulbs);
 // 글 판(앞 +z). 흰 글자가 밤 빛 번짐(bloom)에 뭉개지지 않게 판 밝기를 0.84배로 둔다
 const cv=doc.createElement('canvas');cv.width=A.cw;cv.height=A.ch;const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
 const face=new THREE.Mesh(new THREE.PlaneGeometry(A.w,A.h),new THREE.MeshBasicMaterial({map:tex,toneMapped:false,color:'#d6d3cc'}));face.position.set(0,A.y,.056);face.name='썰매 경주 판 글';g.add(face);
 let phase='none',t=0;
 // info: {phase:'none'|'wait'|'run', n, max, left(초), top:[{n,t}](시간은 이미 글자), online}
 function paint({phase:ph='none',n=0,max=4,left=0,top=[],online=false}={}){phase=ph;
  const c=cv.getContext('2d'),W=cv.width,H=cv.height;
  const rr=(x,y,w,h,r)=>{c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();};
  c.fillStyle=PAPER;c.fillRect(0,0,W,H);c.strokeStyle='#e6d4ad';c.lineWidth=4;c.strokeRect(10,10,W-20,H-20);
  // 위 띠
  c.fillStyle='#c23a32';c.fillRect(0,0,W,86);c.fillStyle=XMAS.gold;c.fillRect(0,86,W,6);
  c.fillStyle='#fff';c.font=`900 52px ${FONT}`;c.textAlign='center';c.textBaseline='middle';c.fillText('썰매 경주',W/2,46);
  for(let i=0;i<4;i++){c.fillStyle=XMAS.lane[i];c.beginPath();c.arc(36+i*20,46,7,0,Math.PI*2);c.fill();c.beginPath();c.arc(W-96+i*20,46,7,0,Math.PI*2);c.fill();}
  // 상태 알약
  const pill={none:['#efe3c6',INK],wait:['#2f7a52','#fff'],run:['#e08a2c','#fff']}[ph]??['#efe3c6',INK];
  const txt=ph==='wait'?`모집 중 ${n}/${max} · ${left}초`:ph==='run'?'달리는 중':'경주 없음';
  c.font=`900 36px ${FONT}`;const pw=Math.min(W-60,c.measureText(txt).width+64);rr((W-pw)/2,106,pw,58,29);c.fillStyle=pill[0];c.fill();c.fillStyle=pill[1];c.fillText(txt,W/2,136);
  if(ph==='wait'){for(let i=0;i<max;i++){const x=W/2+(i-(max-1)/2)*54,y=198;c.beginPath();c.arc(x,y,17,0,Math.PI*2);c.lineWidth=5;c.strokeStyle=XMAS.lane[i%4];
    if(i<n){c.fillStyle=XMAS.lane[i%4];c.fill();c.fillStyle='#fff';c.font=`900 20px ${FONT}`;c.fillText(String(i+1),x,y+1);}else c.stroke();}}
  else{c.font=`700 25px ${FONT}`;c.fillStyle=SUB;c.fillText(ph==='run'?'결승에서 만나요':'가까이 와서 「경주 열기」',W/2,198);}
  // 오늘의 기록 위 3명
  c.fillStyle='#e6d4ad';c.fillRect(30,230,W-60,3);
  c.textAlign='left';c.font=`800 24px ${FONT}`;c.fillStyle=SUB;c.fillText('오늘의 기록',34,258);
  if(!top.length){c.font=`700 26px ${FONT}`;c.fillText(online?'첫 기록을 남겨 보세요':'서버에 들어오면 기록이 남아요',34,316);}
  top.slice(0,3).forEach((x,i)=>{const y=302+i*42;c.fillStyle=MEDAL[i];c.beginPath();c.arc(50,y,16,0,Math.PI*2);c.fill();
   c.fillStyle=INK;c.textAlign='center';c.font=`900 20px ${FONT}`;c.fillText(String(i+1),50,y+1);
   c.textAlign='left';c.font=`800 28px ${FONT}`;c.fillText(String(x.n).slice(0,10),80,y+1);c.textAlign='right';c.fillText(x.t,W-34,y+1);});
  c.textAlign='center';tex.needsUpdate=true;}
 return {group:g,canvas:cv,tex,paint,
  update(dt){t+=dt;bulbs.visible=phase!=='wait'||Math.sin(t*6)>-.4;}};
}
