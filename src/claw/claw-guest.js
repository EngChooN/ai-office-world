// 손님 인형 자리(다른 회사 캐릭터, 월드아트 2026-11-23). 사용 허락이 확인될 때까지 공개 배포에 넣지 않는다(기획서·조사 보고).
// 구조:
//  - 공개 코드(이 저장소)에는 실제 이름·그림·모델이 없다. 자리 id(guest-1·guest-2)와 공개판 대체 인형(fallback = 우리 인형)만 있다.
//  - 실제 인형은 저장소 밖 비공개 폴더 private/claw/(.gitignore)에 둔다. 개발 서버를 VITE_CLAW_PRIVATE=1로 켰을 때만 읽는다.
//    빌드 때 이 값이 없으면 아래 import.meta.glob 줄이 통째로 빠져(죽은 코드) 비공개 파일이 dist에 들어가지 않는다 — scripts/check-claw-private.mjs로 확인.
//  - 비공개 파일 약속(private/claw/guest-1.js 처럼 자리 id와 같은 이름):
//      export default {id:'guest-1', name:'(실제 이름)', model:new URL('./guest-1.glb',import.meta.url).href  또는  image:new URL('./guest-1.png',import.meta.url).href,
//                      icon:(도감 그림 주소, 없으면 image), height:(m, 없으면 자리 희귀도 크기)}
//    model(GLB)이 있으면 그 모델을, 없고 image(배경 투명 PNG)만 있으면 두께 있는 그림 판 인형을 만든다.
import * as THREE from 'three';
import {GUEST_SLOTS,PLUSH,RARITY} from './claw-palette.js';
import {makePlush,plushSize} from './claw-plush.js';

const slot=id=>GUEST_SLOTS.find(s=>s.id===id)??null;
export const isGuestId=id=>!!slot(id);

// 비공개 자료 찾기. 공개 빌드(VITE_CLAW_PRIVATE 없음)·node 검사에서는 늘 빈 목록.
export async function loadGuests(){
 if(typeof import.meta.env==='undefined'||import.meta.env.VITE_CLAW_PRIVATE!=='1')return [];
 const mods=import.meta.glob('/private/claw/guest-*.js',{import:'default'}),out=[];
 for(const [path,load] of Object.entries(mods)){try{const g=await load();if(g&&slot(g.id))out.push(Object.freeze({...g,rarity:slot(g.id).rarity}));else console.warn('[claw] 손님 인형 자리 id가 맞지 않음',path);}catch(e){console.warn('[claw] 손님 인형 못 읽음',path,e);}}
 return out;
}
// 도감·확률 안내에 쓸 인형 목록: 우리 인형 8종 + 실제로 들어온 손님 인형만(공개판에는 손님 칸이 없다)
export function clawCatalog(guests=[]){return [...PLUSH.map(p=>({...p,guest:false})),...guests.map(g=>({id:g.id,name:g.name,rarity:g.rarity,icon:g.icon??g.image??null,guest:true}))];}
// 기계 인형 목록(pool)의 손님 자리를 실제 인형 또는 대체 인형으로 바꾼다
export function resolvePool(pool,guests=[]){const have=new Set(guests.map(g=>g.id));return pool.map(id=>isGuestId(id)&&!have.has(id)?slot(id).fallback:id);}

// 손님 인형 3D. 실제 자료가 없으면 대체 우리 인형. GLTFLoader는 모델이 있을 때만 불러온다(공개판 무게 0).
const built=new Map();
export async function makeGuestPlush(id,guests=[],{toonify=null}={}){
 const s=slot(id),g=guests.find(x=>x.id===id);
 if(!s)throw new Error(`손님 인형 자리 없음: ${id}`);
 if(!g)return makePlush(s.fallback,{toonify});
 const h=g.height??RARITY[s.rarity].size,root=new THREE.Group();root.name=`손님 인형:${id}`;root.userData.plushId=id;root.userData.size=h;root.userData.guest=true;
 if(g.model){
  if(!built.has(id)){const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');const gl=await new GLTFLoader().loadAsync(g.model);
   const m=gl.scene;const bb=new THREE.Box3().setFromObject(m),k=h/Math.max(1e-6,bb.max.y-bb.min.y);m.scale.setScalar(k);m.position.y=-bb.min.y*k;
   m.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});toonify?.(m,{kind:'character',keepMaps:true});built.set(id,m);}
  root.add(built.get(id).clone(true));
 }else if(g.image){
  if(!built.has(id)){const tex=await new THREE.TextureLoader().loadAsync(g.image);tex.colorSpace=THREE.SRGBColorSpace;
   const a=tex.image.width/tex.image.height,mat=new THREE.MeshStandardMaterial({map:tex,alphaTest:.5,side:THREE.DoubleSide,roughness:1});
   // 그림 판 두 장을 2cm 띄워 겹쳐 두께가 있어 보이게(옆에서 봐도 사라지지 않게 십자로 한 장 더)
   const grp=new THREE.Group();for(const [z,ry] of [[.01,0],[-.01,0],[0,Math.PI/2]]){const p=new THREE.Mesh(new THREE.PlaneGeometry(h*a,h).translate(0,h/2,0),mat);p.position.z=z;p.rotation.y=ry;if(ry)p.scale.x=.35;p.castShadow=true;grp.add(p);}
   toonify?.(grp,{kind:'character',keepMaps:true});built.set(id,grp);}
  root.add(built.get(id).clone(true));
 }else return makePlush(s.fallback,{toonify});
 return root;
}
export const guestSize=id=>{const s=slot(id);return s?RARITY[s.rarity].size:plushSize(id);};
