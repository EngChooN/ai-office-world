// 인형 들기 저장·전달·숨김 규칙(11-25, src/carry/carry-store.js)과 인형가게 act 칸(multi-protocol ACT_SCHEMA.claw). 범위 = 인형가게 안에서만(시안 v2 대표 결정).
import test from 'node:test';
import assert from 'node:assert/strict';
import {CARRY_IDS,CLAW_SAVE_KEY,CARRY_KEY,slotOf,sanitizeCarry,ownedFromClaw,loadCarry,saveCarry,sortCarryList,toggleCarry,carryAct,carryFromAct,carryHide,carryFar,CARRY_FAR_M,setCarry,currentCarry,_resetCarry,CARRY_EVENT} from '../src/carry/carry-store.js';
import {SAVE_KEY} from '../src/claw/claw-rules.js';
import {ACT_SCHEMA,sanitizeAct} from '../src/multi-protocol.js';
import {carrySlotOf} from '../src/carry/carry-art.js';

const mem=(o={})=>{const m=new Map(Object.entries(o));return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),m};};
const dex=ids=>JSON.stringify({dex:Object.fromEntries(ids.map(id=>[id,{n:1,first:'2026-11-25',machine:'claw-1'}]))});

test('들 수 있는 인형 = 작은 8·큰 3·상자 8, 자리는 그림 규칙과 같음(큰 인형만 등)',()=>{
 assert.equal(CARRY_IDS.length,19);
 for(const id of CARRY_IDS)assert.equal(slotOf(id),carrySlotOf(id),id);
 assert.deepEqual(CARRY_IDS.filter(id=>slotOf(id)==='back'),['big-squirrel','big-dongdong','big-haechi']);
 assert.equal(CLAW_SAVE_KEY,SAVE_KEY);
});
test('저장값 정리: 모르는 인형·자리 틀림·안 뽑은 인형은 내려놓음',()=>{
 assert.deepEqual(sanitizeCarry({hand:'big-haechi',back:'haechi'}),{hand:null,back:null});
 assert.deepEqual(sanitizeCarry({hand:'guest-1',back:'nope'}),{hand:null,back:null});
 assert.deepEqual(sanitizeCarry({hand:'haechi',back:'big-haechi'},new Set(['haechi'])),{hand:'haechi',back:null});
 const s=mem({[CLAW_SAVE_KEY]:dex(['haechi','big-haechi','guest-1']),[CARRY_KEY]:JSON.stringify({hand:'haechi',back:'big-haechi'})});
 assert.deepEqual([...ownedFromClaw(s).keys()],['haechi','big-haechi']);
 assert.deepEqual(loadCarry(s),{hand:'haechi',back:'big-haechi'});
 // 도감을 지우면 저절로 내려놓음
 s.setItem(CLAW_SAVE_KEY,'{}');assert.deepEqual(loadCarry(s),{hand:null,back:null});
 assert.deepEqual(loadCarry(mem({[CARRY_KEY]:'깨진 값'})),{hand:null,back:null});
});
test('목록 순서: 특별 → 흔함, 같은 등급은 도감 순',()=>{
 assert.deepEqual(sortCarryList(['squirrel','box-cat','big-haechi','dongdong-santa','dongdong-office','haechi']),['dongdong-santa','dongdong-office','haechi','big-haechi','box-cat','squirrel']);
});
test('누르기: 빈 자리면 들고, 같은 인형이면 내려놓고, 같은 자리의 다른 인형은 바꿔 듦(손·등 따로)',()=>{
 let c={hand:null,back:null};
 c=toggleCarry(c,'haechi');assert.deepEqual(c,{hand:'haechi',back:null});
 c=toggleCarry(c,'big-squirrel');assert.deepEqual(c,{hand:'haechi',back:'big-squirrel'});
 c=toggleCarry(c,'box-cat');assert.deepEqual(c,{hand:'box-cat',back:'big-squirrel'});
 c=toggleCarry(c,'big-squirrel');assert.deepEqual(c,{hand:'box-cat',back:null});
});
test('같은 가게 손님에게: 인형가게 act에만 ch·cb(다른 체험은 버림), 받는 쪽이 되돌림. 빈 자리는 칸 없음, 손님 인형은 같은 등급 우리 인형',()=>{
 assert.equal(ACT_SCHEMA.claw.ch,'id');assert.equal(ACT_SCHEMA.claw.cb,'id');
 const a=sanitizeAct('claw',{m:0,ph:'',...carryAct({hand:'box-dongdong-office',back:'big-dongdong'})});
 assert.deepEqual(carryFromAct(a),{hand:'box-dongdong-office',back:'big-dongdong'});
 for(const exp of ['hiking','smoking','christmas']){assert.equal(ACT_SCHEMA[exp].ch,undefined,exp);assert.equal(sanitizeAct(exp,{ch:'haechi',cb:'big-haechi'}),null,exp);}
 assert.deepEqual(carryAct({hand:null,back:null}),{});
 assert.deepEqual(carryFromAct({ch:'guest-1',cb:'haechi'}),{hand:'haechi',back:null});
 assert.deepEqual(carryFromAct({ch:'big-haechi'}),{hand:null,back:null});
 assert.deepEqual(carryFromAct(null),{hand:null,back:null});
});
test('옛 서버(ch·cb를 모름)와 새 화면: 칸만 빠지고 나머지 act는 그대로 — 받는 쪽은 빈손',()=>{
 const oldSchema={...ACT_SCHEMA.claw};delete oldSchema.ch;delete oldSchema.cb;
 const sent={m:3,ph:'play',cx:50,cz:50,r:'',k:0,n:2,v:0,ch:'haechi',cb:'big-haechi'};
 const old=Object.fromEntries(Object.entries(sent).filter(([k])=>k in oldSchema));
 assert.deepEqual(sanitizeAct('claw',old),{m:3,ph:'play',cx:50,cz:50,r:'',k:0,n:2,v:0});
 assert.deepEqual(carryFromAct(old),{hand:null,back:null});
});
test('잠시 숨김: 기계 앞에서 뽑는 동안(m > 0)만 손·등 모두',()=>{
 assert.deepEqual(carryHide({m:0}),{hideHand:false,hideBack:false,seated:0});
 assert.deepEqual(carryHide({m:7}),{hideHand:true,hideBack:true,seated:0});
 assert.deepEqual(carryHide(null),{hideHand:false,hideBack:false,seated:0});
 assert.equal(carryFar(CARRY_FAR_M+1,true),true);assert.equal(carryFar(CARRY_FAR_M+1,false),false);assert.equal(carryFar(3,true),false);
});
test('이 기기 든 인형: 바꾸면 저장·이벤트, 같으면 이벤트 없음',()=>{
 const s=mem({[CLAW_SAVE_KEY]:dex(['haechi','big-haechi'])});const ev=[];
 const win={dispatchEvent:e=>ev.push(e.type)};
 globalThis.CustomEvent??=class{constructor(t,o){this.type=t;this.detail=o?.detail;}};
 _resetCarry();const g=globalThis.localStorage;globalThis.localStorage=s;
 try{
  assert.deepEqual(currentCarry(),{hand:null,back:null});
  assert.deepEqual(setCarry({hand:'haechi',back:'big-haechi'},{win,storage:s}),{hand:'haechi',back:'big-haechi'});
  assert.equal(s.getItem(CARRY_KEY),'{"hand":"haechi","back":"big-haechi"}');
  setCarry({hand:'haechi',back:'big-haechi'},{win,storage:s});
  setCarry({hand:'dongdong-santa',back:'big-haechi'},{win,storage:s}); // 안 뽑은 인형 → 손은 비움
  assert.deepEqual(currentCarry(),{hand:null,back:'big-haechi'});
  assert.deepEqual(ev,[CARRY_EVENT,CARRY_EVENT]);
 }finally{globalThis.localStorage=g;_resetCarry();}
});
