// 뽑은 인형 자랑하기 — 동동이 몸에 붙이기(월드개발, 2026-11-25). 그림은 월드아트 carry-art.js(createCarryArt) 그대로.
// 사람(내 몸·다른 사람 몸) 하나마다 attachCarry 하나. 인형을 처음 들 때 그림을 만들고(안 든 사람은 비용 0), 내려놓으면 그림을 지운다.
// 부르는 순서(인계 문서 §3): 몸 update → ground → (콘텐츠 자세 poser) → carry.update(dt,{moving,phase,hideHand,hideBack,seated,far}).
// 카메라·낮밤은 페이지마다 하나라 setCarryEnv로 한 번 알려 준다(daylight 0 밤 ~ 1 낮).
import {sanitizeCarry} from './carry-store.js';
// 그림 부품(인형 모형·상자·자세 도구)은 처음 들 때 불러온다 — 인형을 안 드는 사람은 페이지 무게 그대로
let artMod=null,artLoad=null;
export function loadCarryArt(){artLoad??=import('./carry-art.js').then(m=>(artMod=m)).catch(e=>{artLoad=null;console.warn('[인형 들기] 그림 못 불러옴',e);return null;});return artLoad;}

const env={camera:null,daylight:1};
/** 페이지 공통: 빛을 인형 뒤로 미는 카메라, 낮밤(0~1, 함수도 됨) */
export function setCarryEnv({camera,daylight}={}){if(camera!==undefined)env.camera=camera;if(daylight!==undefined)env.daylight=daylight;}
const day=()=>{const d=typeof env.daylight==='function'?env.daylight():env.daylight;return Number.isFinite(d)?Math.min(1,Math.max(0,d)):1;};

/**
 * @param {object} hiker createRealisticHiker 결과
 * @param {{toonify?:Function,pack?:boolean|Function}} o pack = 큰 배낭을 멘 몸(등산). 함수면 그릴 때 물어봄
 */
// 점검용(개발 서버에서만): 붙인 것 목록 window.__carry.list() → 사람마다 {name,hand,back,shown:{hand,back},boxes}
const live=new Set();
try{if(import.meta.env?.DEV&&typeof window!=='undefined')window.__carry={list:()=>[...live].map(c=>c.info()),loadArt:loadCarryArt};}catch{}
export function attachCarry(hiker,{toonify=null,pack=false}={}){
 let art=null,want={hand:null,back:null},packNow=null,gone=false;
 const packOf=()=>typeof pack==='function'?!!pack():!!pack;
 function apply(){
  const p=packOf();
  if(art&&p!==packNow){art.dispose();art=null;}
  if(!want.hand&&!want.back){if(art){art.dispose();art=null;}return;}
  if(!artMod){loadCarryArt().then(m=>{if(m&&!gone)apply();});return;}
  if(!art){art=artMod.createCarryArt(hiker,{toonify,pack:p});packNow=p;}
  art.set({hand:want.hand,back:want.back});
 }
 const api={
  /** 들 인형 {hand,back}(틀린 값은 버림). 같으면 아무것도 안 함 */
  set(c){const n=sanitizeCarry(c);if(n.hand===want.hand&&n.back===want.back&&(!!art===!!(n.hand||n.back)||!artMod))return;want=n;apply();},
  get hand(){return want.hand;},get back(){return want.back;},
  get art(){return art;},
  /** 매 프레임(몸 동작이 끝난 뒤) */
  update(dt,{moving=false,phase=0,hideHand=false,hideBack=false,seated=0,far=false}={}){
   if(!art)return;
   art.update(dt,{camera:env.camera,daylight:day(),moving,phase,seated,hideHand,hideBack,far});
  },
  /** 몸을 다른 사람에게 넘길 때(사람 몸 돌려쓰기) — 들고 있던 것을 지움 */
  clear(){want={hand:null,back:null};if(art){art.dispose();art=null;}},
  dispose(){gone=true;this.clear();live.delete(api);},
  bounds(slot){return art?.bounds(slot)??null;},
  info(){const sl=art?.slots??{},vis=k=>{let o=sl[k]?.root;if(!o)return false;for(;o;o=o.parent)if(!o.visible)return false;return true;};
   const box=k=>{const b=vis(k)?art.bounds(k):null;return b?{min:b.min.toArray().map(v=>+v.toFixed(3)),max:b.max.toArray().map(v=>+v.toFixed(3))}:null;};
   let head=null;const h=hiker.model?.getObjectByName?.('mixamorigHead');if(h){const p=h.getWorldPosition(new h.position.constructor());head=p.toArray().map(v=>+v.toFixed(3));}
   return {name:hiker.scene?.name??'',hand:want.hand,back:want.back,shown:{hand:vis('hand'),back:vis('back')},glow:{hand:!!sl.hand?.glow,back:!!sl.back?.glow},boxes:{hand:box('hand'),back:box('back')},head,pack:packNow};},
 };
 live.add(api);
 return api;
}
