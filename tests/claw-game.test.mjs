// 온라인 인형뽑기 게임 규칙·연결 시험(월드개발, 2026-11-23): 코인 매일 지급·한 판 값·잡기 판정·보장·도감·저장 정리,
// 같은 가게 손님 규격(act claw)·서버가 인형뽑기 방을 받고 act를 중계하는지, 허브 카드·입장, 공개판에 손님 인형이 없는지.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CLAW_TUNING as T,COIN_V,seoulDate,msToNextGrant,freshState,sanitizeState,grantDaily,grantedToday,canPlay,spendCoin,recordResult,rulesFor,pityLeft,pityOn,kindOf,
 judgeTimer,fmtTimer,judgeKey,keyMissText,timerDiffText,encodeClawPos,decodeClawPos,encodeKeyPos,decodeKeyPos,KIND_CODE,KIND_OF,ACT_PHASES,dexCount,isRefillLog,levelOf,hideAfterOf,pityNow,
  machStateToday,saveMachState,sanitizeMachState,MACH_PV} from '../src/claw/claw-rules.js';
import {createBridgeSim,bridgeGeom,runBridgeDrop,startPose,nearState,bridgeSnap,noProgress,boxParts,bridgeOutcome,offRails,FINGER_PLATES,HEAD_PLATE,FINGER_ANGLE_B,FINGER_PIVOT_Z,plateBox} from '../src/claw/claw-bridge-physics.js';
import {geomFrom,createClawSim,runDrop,BODY_TYPES,PLUSH_BODY,CLAW_RIG,U,FINGER_CURVE,FINGER_TUBE,FINGER_TIP,FINGER_PIVOT,FINGER_ANGLE_C} from '../src/claw/claw-physics.js';
import * as THREE from 'three';
// 물리 집게발 끝이 가운데에서 떨어진 거리(m): 판정 손가락 = 그림 곡선(FINGER_CURVE 끝 (−0.14, 0))·뿌리 FINGER_PIVOT·배율 clawTip/0.14 (11-24: 옛 두 마디 식 대신 지금 판정 식)
const CLAW_RIG_TIP=th=>{const o=Math.max(0,Math.min(1,(th-CLAW_RIG.closed)/(CLAW_RIG.splay-CLAW_RIG.closed))),an=.3+o*(-.57-.3);return (-.14*Math.sin(an)+.03)*CLAW.clawTip/.14;};
import {CLAW,FINGER_ANGLE} from '../src/claw/claw-machine-art.js';
import {KEY} from '../src/claw/claw-machines-more.js';
import {plushSize} from '../src/claw/claw-plush.js';
import {PLUSH,MACHINES,BIG_PLUSH,BOX_PLUSH,GUEST_SLOTS} from '../src/claw/claw-palette.js';
import {clawCatalog,resolvePool} from '../src/claw/claw-guest.js';
import {sanitizeAct,EXPERIENCES,parseExperience,messageAllowed,SERVERS,findServer,anonymousName,ACT_SCHEMA} from '../src/multi-protocol.js';
import {createRooms} from '../server/rooms.mjs';
import {EXPERIENCES as HUB_EXP,experienceHref} from '../src/hub/experiences.js';
import {MAP_POS} from '../src/hub/hub.js';
import {ART} from '../src/hub/art.js';
import {hasIcon} from '../src/icons/icon.js';
import {PICK_LABELS,createServerPick} from '../src/server-pick.js';
import {lastEntry} from '../src/entry.js';
import {inviteText,inviteUrl} from '../src/invite.js';
import {clawStatusView,multiParams} from '../src/claw/claw-multi.js';

const read=p=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const KST=Date.UTC(2026,10,23,15,0,0); // 서울 11-24 0시

test('서울 날짜·다음 지급까지 남은 시간', ()=>{
 assert.equal(seoulDate(KST-1000),'2026-11-23');assert.equal(seoulDate(KST),'2026-11-24');
 assert.equal(msToNextGrant(KST-60000),60000);assert.equal(msToNextGrant(KST),24*3600e3);
});
test('무료 코인(11-24 대표 결정, 11-23 15개 → 30개): 하루 첫 접속에 30개, 다음 날은 남은 개수와 상관없이 30으로 다시 채움, 이미 받았으면 null', ()=>{
 assert.equal(T.coin.daily,30);assert.equal(T.coin.cap,undefined,'모으기 상한 규칙 없음');assert.equal(COIN_V,3);
 const s=freshState();
 assert.equal(grantDaily(s,KST-5000),30);assert.equal(s.coins,30,'하루 첫 접속 30개');assert.ok(grantedToday(s,KST-5000));
 assert.equal(grantDaily(s,KST-4000),null,'같은 날 두 번 안 줌');assert.equal(s.coins,30);
 s.coins=3;assert.equal(grantDaily(s,KST+1000),30);assert.equal(s.coins,30,'남은 3개 → 다음 날 30(더하지 않음)');
 // 채움 기록(v4 §10): 늘어남·줄어듦 숫자 없이 「오늘 30개로 채웠어요」 + 결과 개수
 assert.match(s.log.at(-1).text,/오늘 30개로 채웠어요/);assert.equal(s.log.at(-1).d,0);assert.equal(s.log.at(-1).t,'refill');assert.equal(s.log.at(-1).n,30);assert.ok(isRefillLog(s.log.at(-1)));
 assert.ok(isRefillLog({text:'오늘의 코인 15개(어제 남은 13개는 넘어오지 않아요)',d:-13}),'예전 저장의 채움 줄도 같은 모양');assert.ok(isRefillLog({text:'오늘 15개로 채웠어요',t:'refill',n:15}),'15개 시절 채움 줄도 그대로');assert.ok(!isRefillLog({text:'집게 1 한 판',d:-1}));
 s.coins=0;assert.equal(grantDaily(s,KST+1000+86400e3),30);assert.equal(s.coins,30,'다 쓴 다음 날 30');
 s.coins=30;assert.equal(grantDaily(s,KST+1000+2*86400e3),30);assert.equal(s.coins,30,'안 쓴 다음 날도 30(60이 되지 않음)');
 for(let d=3;d<10;d++){grantDaily(s,KST+1000+d*86400e3);assert.equal(s.coins,30);}
 assert.ok(s.log.length<=T.log);
});
test('무료 코인: 옛 규칙 저장(1 = 10개씩 더해 30개까지, 2 = 하루 15개) 이어받기', ()=>{
 const today=seoulDate(KST-5000),yday=seoulDate(KST-5000-86400e3);
 // 옛 저장(판 1), 어제 받음·남은 28개 → 오늘 30
 let s=sanitizeState({coins:28,lastGrant:yday,plays:9});assert.equal(s.coinV,1);
 assert.equal(grantDaily(s,KST-5000),30);assert.equal(s.coins,30);assert.equal(s.coinV,3);assert.equal(s.plays,9);
 // 옛 저장(판 1), 오늘 이미 10개 받고 4개 남음 → 오늘 30개로 채움, 같은 날 다시 안 줌, 다음 날 30
 s=sanitizeState({coins:4,lastGrant:today});assert.equal(grantDaily(s,KST-5000),30);assert.equal(s.coins,30);assert.match(s.log.at(-1).text,/하루 30개로 바뀌었어요 · 오늘 30개로 채웠어요/);
 assert.equal(grantDaily(s,KST-4000),null);assert.equal(grantDaily(s,KST+1000),30);
 // 옛 저장(판 1), 오늘 이미 받아 32개 → 오늘은 빼앗지 않음, 다음 날 30
 s=sanitizeState({coins:32,lastGrant:today});assert.equal(grantDaily(s,KST-5000),null);assert.equal(s.coins,32);
 assert.equal(grantDaily(s,KST+1000),30);assert.equal(s.coins,30);
 // 하루 15개 판(2) 저장: 오늘 15개 받고 6개 남음 → 오늘 바로 30개로 채움(같은 날 두 번은 안 줌)
 s=sanitizeState({coins:6,lastGrant:today,coinV:2,plays:9,wins:2,dex:{},pity:{'claw-1':3}});assert.equal(s.coinV,1,'판 2는 옛 판으로 읽음');assert.equal(s.pity['claw-1'],3,'보장 수는 그대로');
 assert.equal(grantDaily(s,KST-5000),30);assert.equal(s.coins,30);assert.equal(s.coinV,3);assert.equal(s.plays,9);assert.equal(s.wins,2);
 assert.equal(grantDaily(s,KST-4000),null);assert.equal(s.coins,30);
 // 하루 15개 판(2) 저장, 어제 받음 → 오늘 30
 s=sanitizeState({coins:15,lastGrant:yday,coinV:2});assert.equal(grantDaily(s,KST-5000),30);assert.equal(s.coins,30);
 // 새 저장은 판 표시가 남아 다시 이전하지 않음
 s=sanitizeState(JSON.parse(JSON.stringify(s)));assert.equal(s.coinV,3);assert.equal(grantDaily(s,KST-4000),null);
});
test('한 판 값: 코인 1개, 없으면 못 함(사는 길 없음)', ()=>{
 const s=freshState();assert.equal(canPlay(s),false);assert.equal(spendCoin(s,'claw-1'),false);assert.equal(s.plays,0);
 s.coins=1;assert.ok(spendCoin(s,'claw-1',1));assert.match(s.log.at(-1).text,/집게 1 한 판/);assert.equal(s.coins,0);assert.equal(s.plays,1);assert.equal(s.log.at(-1).d,-1);
 const src=read('src/claw/claw-hud.js')+read('src/claw/main.js');
 assert.doesNotMatch(src,/구매|결제|충전|buy|purchase/i,'코인을 사는 단추·말이 없다');
});
test('기계 16대(설계 v4.1 §12, 대표 승인): 집게 6·봉 4·타이머 3·열쇠 3, id·이름·경품 표 그대로', ()=>{
 const n=k=>MACHINES.filter(m=>kindOf(m.id)===k).length;
 assert.equal(MACHINES.length,16);assert.deepEqual([n('claw'),n('bridge'),n('timer'),n('key')],[6,4,3,3]);
 assert.deepEqual(MACHINES.map(m=>m.id),['claw-1','claw-2','claw-3','claw-4','claw-5','claw-6','bridge-1','bridge-2','bridge-3','bridge-4','timer-1','timer-2','timer-3','key-1','key-2','key-3']);
 for(const M of MACHINES)assert.match(M.name,/^(집게|봉|타이머|열쇠) \d$/,M.id);
 assert.deepEqual(MACHINES.filter(m=>m.kind==='timer').map(m=>m.pool[0]),['big-squirrel','big-dongdong','big-haechi']);
 // 봉: 기계마다 상자 2종, 8종 모두 뽑을 수 있음
 const boxes=MACHINES.filter(m=>m.kind==='bridge').flatMap(m=>{assert.equal(m.pool.length,2,m.id);return m.pool;});assert.deepEqual([...new Set(boxes)].sort(),BOX_PLUSH.map(b=>b.id).sort());
 // 손님 인형 자리(v4.1 §11): 열쇠 1·2의 8번째 칸에만, 다른 종류 pool에는 없음, guest-2 공개판 대체 = 회사원 동동이(희귀 → 작은 구멍)
 for(const M of MACHINES){const ids=M.cells??M.pool,g=ids.map((id,i)=>id.startsWith('guest-')?i:-1).filter(i=>i>=0);
  if(M.id==='key-1')assert.deepEqual([g,ids[7]],[[7],'guest-1']);else if(M.id==='key-2')assert.deepEqual([g,ids[7]],[[7],'guest-2']);else assert.deepEqual(g,[],M.id);
  if(M.kind!=='key')assert.ok(!M.pool.some(id=>id.startsWith('guest-')),M.id);}
 assert.equal(GUEST_SLOTS.find(g=>g.id==='guest-2').fallback,'dongdong-office');assert.deepEqual(resolvePool(MACHINES[14].cells).slice(-1),['dongdong-office']);
 assert.equal(levelOf('timer-3'),5);assert.equal(hideAfterOf('timer-3'),3);assert.equal(levelOf('timer-2'),4);assert.equal(hideAfterOf('timer-2'),7);assert.equal(hideAfterOf('timer-1'),0);
});
test('타이머 판정 표(설계 v3 §7-1): 화면 숫자로만, 0.01초 아래 버림', ()=>{
 const t=ms=>{const j=judgeTimer(ms);return [j.shown,j.r];};
 assert.deepEqual(t(9999),['09.99','near']);assert.deepEqual(t(10000),['10.00','win']);assert.deepEqual(t(10009),['10.00','win']);
 assert.deepEqual(t(10010),['10.01','near']);assert.deepEqual(t(10100),['10.10','near']);assert.deepEqual(t(10110),['10.11','miss']);assert.deepEqual(t(9899),['09.89','miss']);
 assert.equal(judgeTimer(15000).r,'miss','15.00 넘김');
 // 0~15초 1ms 간격 전체: 성공 ⇔ 화면 10.00, 숫자는 늘 두 자리.두 자리
 for(let ms=0;ms<=15000;ms++){const j=judgeTimer(ms);assert.match(j.shown,/^\d\d\.\d\d$/);if((j.r==='win')!==(j.shown==='10.00'))assert.fail(`${ms} ${j.shown} ${j.r}`);}
 assert.equal(fmtTimer(9876.9),'09.87');assert.equal(timerDiffText(.03),'+0.03초 늦었어요');assert.equal(timerDiffText(-1.42),'1.42초 빨랐어요');
});
test('열쇠 판정(설계 v3 §7-3): 구멍 가운데 성공·0.2칸 아까움·0.5칸 실패·희귀 칸은 작은 구멍·보장은 넓어짐', ()=>{
 const c=T.key,hole=(i,j)=>[i+.5,j*c.cellH+c.holeY];
 assert.equal(judgeKey(...hole(1,0)).r,'win');
 const [x,y]=hole(2,1);assert.equal(judgeKey(x+.2,y).r,'near');assert.equal(judgeKey(x+.5,y).r,'miss');
 assert.equal(judgeKey(x+.1,y,c,()=>true).r,'near','희귀 칸 0.08');assert.equal(judgeKey(x+.1,y,c,()=>false).r,'win');
 assert.equal(judgeKey(x+.17,y,c,()=>false,true).r,'win','보장 +0.05');
 assert.equal(judgeKey(1.5,-.3).r,'miss','칸 아래');assert.match(keyMissText(judgeKey(x+.5,y)),/왼쪽/);
 // 그림 좌표 = 판정 좌표(월드아트 KEY)
 assert.equal(KEY.cols,c.cols);assert.equal(KEY.rows,c.rows);assert.equal(KEY.cellH,c.cellH);assert.equal(KEY.holeY,c.holeY);
});
test('집게 물리: 보이는 손가락(휜 관·끝 구슬)이 인형을 뚫지 않음(무작위 판, 0.5cm 넘게 들어간 장면 0), 판정 손가락 = 그림 곡선', ()=>{
 assert.deepEqual({...FINGER_ANGLE_C},{...FINGER_ANGLE});
 const art=read('src/claw/claw-machine-art.js');for(const n of ['new THREE.Vector3(0,-.04,.035),new THREE.Vector3(0,-.1,.04),new THREE.Vector3(0,-.14,.0)','TubeGeometry(new THREE.CatmullRomCurve3(pts),10,.007,6,false)','SphereGeometry(.011,8,6).translate(0,-.14,0)','f.position.set(0,0,.03)'])assert.ok(art.includes(n),'그림 치수 그대로: '+n);
 assert.ok(FINGER_TUBE===.007&&FINGER_TIP===.011&&FINGER_PIVOT===.03);
 const cv=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(0,-.04,.035),new THREE.Vector3(0,-.1,.04),new THREE.Vector3(0,-.14,0)]).getPoints(FINGER_CURVE.length-1);
 cv.forEach((v,i)=>assert.ok(Math.abs(v.y-FINGER_CURVE[i][0])<2e-4&&Math.abs(v.z-FINGER_CURVE[i][1])<2e-4,'곡선 점 '+i));
 const g=geomFrom(CLAW),C=T.claw,S=CLAW.clawTip/.14/U,TIP=CLAW_RIG.l1*Math.cos(CLAW_RIG.rest)+CLAW_RIG.l2*Math.cos(CLAW_RIG.rest-CLAW_RIG.bend),UP=CLAW.clawTip/U-TIP;
 const dense=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(0,-.04,.035),new THREE.Vector3(0,-.1,.04),new THREE.Vector3(0,-.14,0)]).getPoints(24).map(v=>[v.y,v.z]);
 const pts=c=>{const out=[],o=k=>Math.max(0,Math.min(1,(c.th[k]-CLAW_RIG.closed)/(CLAW_RIG.splay-CLAW_RIG.closed)));
  for(let i=0;i<3;i++){const p=[0,2,1][i],th=i/3*Math.PI*2,an=FINGER_ANGLE.shut+o(p)*(FINGER_ANGLE.wide-FINGER_ANGLE.shut);
   dense.forEach(([y,z],j)=>{const y1=y*Math.cos(an)-z*Math.sin(an),z1=y*Math.sin(an)+z*Math.cos(an)+.03;out.push([c.x+Math.sin(th)*z1*S,c.y+UP+y1*S,c.z+Math.cos(th)*z1*S,(j===dense.length-1?.011:.007)*S]);});}return out;};
 let worst=0,plays=0;
 for(let t=0;t<3;t++){let q=t*13+5;const R=()=>((q=(q*1664525+1013904223)>>>0)/4294967296);
  const s=createClawSim({geom:g,ids:PLUSH.map(p=>p.id),sizeOf:plushSize,massOf:id=>C.mass[PLUSH.find(p=>p.id===id).rarity]??1,seed:t+3,count:C.dolls,power:C.power});
  for(let k=0;k<2;k++){plays++;const Rg=g.RANGE;s.start();s.setPos(Rg.x0+R()*(Rg.x1-Rg.x0),Rg.z0+R()*(Rg.z1-Rg.z0));s.drop();
   for(let tt=0;tt<14&&s.claw.state!=='done';tt+=1/60){s.step(1/60);const Q=s.P;for(const [x,y,z,r] of pts(s.claw))for(let i=0;i<Q.x.length;i++){if(s.dolls[Q.d[i]].gone)continue;worst=Math.max(worst,r+Q.r[i]-Math.hypot(x-Q.x[i],y-Q.y[i],z-Q.z[i]));}}
   for(let tt=0;tt<1;tt+=1/30)s.step(1/30);}}
 assert.ok(worst*U<.005,`손가락이 인형에 ${(worst*10).toFixed(2)}cm 들어감`);assert.equal(plays,6);
});
test('집게 물리: 기계 치수에서 만든 상자·구멍, 인형 8종 몸, 판이 끝나고 결과가 나옴', ()=>{
 const g=geomFrom(CLAW);
 assert.ok(g.CHUTE.x1<0&&g.CHUTE.z0>0,'구멍은 왼쪽 앞');assert.ok(Math.abs(g.HOME.x-CLAW.home[0]*10)<1e-9);assert.ok(g.RANGE.x1<g.BOX.x1);
 for(const p of PLUSH)assert.ok(BODY_TYPES[PLUSH_BODY[p.id]],p.id);
 const sim=createClawSim({geom:g,ids:['squirrel','hare','magpie','dongdong'],sizeOf:plushSize,seed:3,count:T.claw.dolls,power:T.claw.power});
 assert.equal(sim.left(),T.claw.dolls,'쌓을 때 구멍에 빠진 인형 없음');
 for(const D of sim.dolls)assert.ok(D.cy>-.5&&Math.abs(D.cx)<g.BOX.x1&&D.cz<g.BOX.z1+.1,'상자 안');
 const top=sim.dolls.filter(d=>!d.gone).sort((a,b)=>b.cy-a.cy)[0];
 const r=runDrop(sim,top.cx,top.cz);assert.equal(sim.claw.state,'done');assert.ok(Array.isArray(r.won));
 // 같은 씨앗 = 같은 더미
 const a=createClawSim({geom:g,ids:['cat'],sizeOf:plushSize,seed:9,count:6}),b=createClawSim({geom:g,ids:['cat'],sizeOf:plushSize,seed:9,count:6});
 assert.deepEqual(a.dolls.map(d=>d.cx.toFixed(4)),b.dolls.map(d=>d.cx.toFixed(4)));
});
test('집게 순서(대표 피드백 11-23): 벌리고 내려감 → 벌린 채 바닥 → 바닥에서 조임 → 조인 채 올라옴 → 출구에서 놓음, 그림 벌린 폭 = 물리 집게발 폭', async ()=>{
 const THREE=await import('three');const {buildClawMachine}=await import('../src/claw/claw-machine-art.js');
 const g=geomFrom(CLAW),sim=createClawSim({geom:g,ids:['squirrel','hare','magpie'],sizeOf:plushSize,seed:5,count:T.claw.dolls,power:T.claw.power});
 const m=buildClawMachine('claw-1'),c=m.userData.claw,R=CLAW_RIG_TIP;
 sim.start();sim.setPos(0,-.5);const rest=sim.clawPose().open;sim.drop();
 const log=[];let firstMove=null;
 for(let t=0;t<16&&sim.claw.state!=='done';t+=1/60){sim.step(1/60);const p=sim.clawPose();log.push({s:sim.claw.state,...p});if(firstMove==null&&p.drop>.002)firstMove=p;}
 assert.ok(firstMove&&firstMove.open>rest+.3,`내려가기 시작할 때 이미 벌림(${firstMove?.open.toFixed(2)} > 쉼 ${rest.toFixed(2)})`);
 const down=log.filter(p=>p.s==='drop'&&p.drop>.002);assert.ok(down.length>10&&down.every(p=>p.open>.55),'벌린 채 내려감');
 const bottom=Math.max(...log.map(p=>p.drop)),closeAt=log.findIndex(p=>p.s==='close');
 assert.ok(bottom-log[closeAt].drop<.051,'조이기는 바닥에서 시작(조이면서 인형 사이로 5cm까지만 가라앉음, 11-23 통과 수정)');
 const lift=log.filter(p=>p.s==='lift'||p.s==='carry');assert.ok(lift.length&&lift.every(p=>p.open<log[closeAt].open),'조인 채 올라오고 옮김');
 const rel=log.findIndex(p=>p.s==='release');assert.ok(rel>0&&Math.abs(log[rel].x-CLAW.home[0])<1e-6&&Math.abs(log[rel].z-CLAW.home[1])<1e-6,'출구 위에서 놓음');
 assert.ok(log.at(-1).open>lift.at(-1).open,'놓을 때 벌림');
 // 그림 손가락 끝이 가운데에서 떨어진 거리 ≈ 물리 집게발 끝 거리(1cm 안)
 for(const th of [-.04,.18,.6,1]){const open=(th+.04)/1.04;c.set({drop:0,open});m.updateMatrixWorld(true);
  const h=c.head.getWorldPosition(new THREE.Vector3()),t=c.fingers[0].localToWorld(new THREE.Vector3(0,-.14,0)).sub(h);
  assert.ok(Math.abs(t.z-R(th))<.012,`th ${th}: 그림 ${t.z.toFixed(3)} 물리 ${R(th).toFixed(3)}`);}
});
test('보장: 같은 기계 5번 연달아 실패 → 다음 판 도움(집게·봉 직원 도움·열쇠 넓은 구멍), 봉은 8판, 타이머는 기본 끔', ()=>{
 const s=freshState();for(let i=0;i<T.pity.after;i++)recordResult(s,'claw-1',{kind:'miss'});
 assert.equal(pityLeft(s,'claw-1'),0);assert.equal(pityLeft(s,'claw-2'),T.pity.after,'같은 종류라도 기계마다 따로');assert.equal(pityLeft(s,'key-1'),T.pity.after);assert.equal(pityLeft(s,'timer-1'),null,'타이머 보장 끔');
 assert.ok(pityOn('claw')&&pityOn('key')&&pityOn('bridge')&&!pityOn('timer'));
 assert.equal(pityLeft(s,'bridge-1'),8,'봉 = 8판(v4.1 §7-5)');for(let i=0;i<8;i++)recordResult(s,'bridge-1',{kind:'near'});assert.ok(pityNow(s,'bridge-1'));assert.match(rulesFor('bridge-1',MACHINES[6].pool).pity,/직원이 상자를 처음 자리에/);
 const rec=recordResult(s,'claw-1',{kind:'win',id:'squirrel'},KST);assert.ok(rec.isNew);assert.equal(s.pity['claw-1'],0);assert.equal(s.dex.squirrel.first,'2026-11-24');assert.equal(s.dex.squirrel.machine,'claw-1');
 assert.deepEqual(recordResult(s,'key-1',{kind:'win',id:'squirrel'}),{isNew:false,count:2});assert.equal(dexCount(s),1);
 recordResult(s,'key-1',{kind:'near',id:null});assert.equal(s.pity['key-1'],1,'아까움도 실패로 셈');
});
test('집게 직원 도움(11-24): 구멍 뒤 턱 바로 뒤에 인형 하나를 세우고 가라앉힘, 구멍 밖, 집게 범위 안', async ()=>{
 const P=await import('../src/claw/claw-physics.js');const {CLAW}=await import('../src/claw/claw-machine-art.js');const {PLUSH,RARITY}=await import('../src/claw/claw-palette.js');
 const g=P.geomFrom(CLAW),rar=id=>PLUSH.find(p=>p.id===id).rarity;
 const s=P.createClawSim({geom:g,ids:PLUSH.map(p=>p.id),sizeOf:id=>RARITY[rar(id)].size,seed:3,count:T.claw.dolls,power:T.claw.power});
 const h=P.staffHelp(s);assert.ok(h,'옮길 인형이 있음');const fr=s.frame(h.di),D=s.dolls[h.di];
 assert.ok(Math.hypot(fr.p[0]-h.x,fr.p[2]-h.z)<1,'세운 자리 근처(10cm 안)에 머묾');assert.ok(!D.won&&!D.gone,'구멍에 빠지지 않음');
 const {CHUTE,RANGE}=g;assert.ok(!(h.x>CHUTE.x0&&h.x<CHUTE.x1&&h.z>CHUTE.z0&&h.z<CHUTE.z1),'구멍 위 아님');
 assert.ok(h.x>=RANGE.x0&&h.x<=RANGE.x1&&h.z>=RANGE.z0&&h.z<=RANGE.z1,'집게가 닿는 곳');
 assert.ok(h.z<CHUTE.z0&&Math.abs(h.x-Math.max(RANGE.x0+.2,(CHUTE.x0+CHUTE.x1)/2))<1e-9,'구멍 뒤 턱 바로 뒤');
});
test('규칙 안내: 조절값에서 만든 글(값을 바꾸면 글도 바뀜)', ()=>{
 const t=rulesFor('timer-1',MACHINES[10].pool);assert.equal(t.kind,'timer');assert.ok(t.lines.some(l=>/딱 10\.00일 때만 성공/.test(l)));assert.ok(t.lines.some(l=>/9\.90~10\.10/.test(l)));assert.equal(t.pity,'');
 const t2=rulesFor('timer-1',MACHINES[10].pool,{...T,timer:{...T.timer,okWinSec:.05,pityWinSec:.02}});assert.ok(t2.lines.some(l=>/9\.95~10\.05에 멈추면 성공/.test(l)));assert.match(t2.pity,/0\.02초/);
 assert.match(rulesFor('key-1',MACHINES[13].cells).lines.join(' '),/0\.14칸.*0\.08칸/);assert.match(rulesFor('claw-1',MACHINES[0].pool).pity,/직원이 인형 하나를 구멍 뒤/);assert.ok(!('pityPower' in T.claw),'힘센 집게 없앰(11-24)');
 assert.ok(rulesFor('timer-3',MACHINES[12].pool).lines.some(l=>/3\.00초부터 숫자가 어두워져요/.test(l)),'타이머 3은 3초부터');assert.ok(rulesFor('timer-2',MACHINES[11].pool).lines.some(l=>/7\.00초부터 숫자가 어두워져요/.test(l)),'타이머 2는 7초부터');assert.ok(!rulesFor('timer-1',MACHINES[10].pool).lines.some(l=>/어두워져요/.test(l)));
 // 봉 규칙 글(v4.1 §7-7): 혼자 = 오늘 안에 이어서, 가게 공유(3단계) = 모두 같음·30분
 const b=rulesFor('bridge-3',MACHINES[8].pool);assert.equal(b.kind,'bridge');assert.match(b.lines.join(' '),/들고 오지 못해요.*봉 사이로 떨어뜨리면 성공/);assert.match(b.lines.join(' '),/팔\(八\) 자.*15cm.*17\.5cm/);assert.match(b.lines.join(' '),/오늘 안에 이어서/);
 assert.match(rulesFor('bridge-1',MACHINES[6].pool,T,undefined,undefined,{shared:true}).lines.join(' '),/상자 자리는 모두 같아요.*30분/);
 for(const M of MACHINES){const n=rulesFor(M.id,M.pool).note;assert.match(n,/사는 곳·바꾸는 곳은 없어요/);assert.match(n,/30개/);assert.match(n,/넘어가지 않아요/);}
});
test('저장 정리: 이상한 값·모르는 인형(공개판의 손님 인형)·잘못된 기계는 버림', ()=>{
 const raw={coins:9999,lastGrant:'어제',plays:3,dex:{cat:{n:2,first:'2026-11-23',machine:'city'},'guest-1':{n:1},nope:{n:1},hare:{n:0}},pity:{forest:3,zzz:2},log:[{at:1,text:'a'},{x:1}],seenTip:true};
 const s=sanitizeState(raw);
 assert.equal(s.coins,0);assert.equal(s.lastGrant,null);assert.equal(s.plays,3);assert.deepEqual(Object.keys(s.dex),['cat']);assert.equal(s.log.length,1);assert.ok(s.seenTip);
 // 옛 기계 id(MVP 3대) → 16대 이어받기: forest → 집게 1, star → 열쇠 1, city → 큰 인형의 타이머(모르면 타이머 1), 처음 규칙 본 것도
 assert.deepEqual(s.pity,{'claw-1':3});assert.equal(s.dex.cat.machine,'timer-1');
 const m=sanitizeState({pity:{star:2,city:1},seen:{forest:true,city:true},dex:{'big-haechi':{n:1,machine:'city'},haechi:{n:1,machine:'star'}}});
 assert.deepEqual(m.pity,{'key-1':2,'timer-1':1});assert.deepEqual(Object.keys(m.seen).sort(),['claw-1','timer-1','timer-2','timer-3']);assert.equal(m.dex['big-haechi'].machine,'timer-3');assert.equal(m.dex.haechi.machine,'key-1');
 // 개발용(손님 인형이 들어온 화면)에서는 손님 칸도 남는다
 assert.ok(sanitizeState(raw,{isKnown:id=>id==='guest-1'||id==='cat'}).dex['guest-1']);
 assert.deepEqual(sanitizeState('x'),freshState());
});
test('공개판 도감: 우리 인형 8 + 큰 인형 3 + 상자 8칸, 손님 자리는 우리 인형으로 바뀜(다른 회사 캐릭터 이름·파일 없음)', ()=>{
 assert.deepEqual(clawCatalog().map(c=>c.id),[...PLUSH.map(p=>p.id),...BIG_PLUSH.map(b=>b.id),...BOX_PLUSH.map(b=>b.id)]); // 11-23 v1.6 큰 인형 3칸(월드아트) + v4.1 봉 상자 8칸
 assert.equal(clawCatalog().length,19);assert.equal(clawCatalog().filter(c=>c.box).length,8);assert.deepEqual(clawCatalog().filter(c=>c.big).map(c=>c.base),['squirrel','dongdong','haechi']); // 도감 「큰」 딱지는 big으로 붙임
 assert.deepEqual(sanitizeState({...freshState(),dex:{'big-haechi':{n:1,first:'2026-11-23'}}}).dex['big-haechi']?.n,1); // 큰 인형 저장이 지워지지 않음
 for(const M of MACHINES)for(const id of resolvePool(M.cells??M.pool))assert.ok(PLUSH.some(p=>p.id===id)||BIG_PLUSH.some(b=>b.id===id)||BOX_PLUSH.some(b=>b.id===id),`${M.id} ${id}`);
 const src=['src/claw/main.js','src/claw/claw-hud.js','src/claw/claw-play.js','src/claw/claw-rules.js','src/claw/claw-multi.js','src/claw/claw-physics.js','claw/index.html'].map(read).join('\n');
 assert.doesNotMatch(src,/치이카와|chiikawa|ちいかわ|하치와레|우사기/i);
 // 비공개 자료 읽기는 VITE_CLAW_PRIVATE=1일 때만(빌드에서 빠짐)
 assert.match(read('src/claw/claw-guest.js'),/VITE_CLAW_PRIVATE!=='1'\)return \[\]/);
 assert.match(read('.gitignore'),/^private\/$/m);
});
test('같은 가게 손님 규격: claw 체험·위치/채팅/act만·1서버·익명 이름', ()=>{
 assert.ok(EXPERIENCES.includes('claw'));assert.equal(parseExperience('claw'),'claw');
 for(const t of ['s','c','act','j','b','report'])assert.ok(messageAllowed('claw',t),t);
 for(const t of ['tree:put','lounge:smoke','pair:offer','lk-hang','g'])assert.equal(messageAllowed('claw',t),false,t);
 assert.deepEqual(SERVERS.claw.map(s=>s.id),['1']);assert.equal(findServer('claw','인형가게').id,'1');assert.equal(findServer('claw','인형가게-1').name,'인형가게 1서버');
 assert.match(anonymousName('ab12cd','claw'),/^뽑기손님[0-9A-Z]{4}$/);
 assert.deepEqual(sanitizeAct('claw',{m:2,ph:'drop',cx:encodeClawPos(.2),cz:encodeClawPos(-.28),r:'dongdong-santa',k:KIND_CODE.win,n:7,v:1000,o:'santa'}),{m:2,ph:'drop',cx:70,cz:22,r:'dongdong-santa',k:1,n:7,v:1000});
 {const [a,b]=decodeKeyPos(...encodeKeyPos(2.5,1.72));assert.ok(Math.abs(a-2.5)<1e-9&&Math.abs(b-1.72)<1e-9);}
 assert.equal(sanitizeAct('claw',{m:17,ph:'fly',r:'<b>'}),null);assert.equal(sanitizeAct('claw',{m:16,ph:'play'}).m,16,'기계 16대(m 1~16)');
 assert.deepEqual(ACT_SCHEMA.claw.ph,ACT_PHASES);assert.equal(KIND_OF[KIND_CODE.near],'near');
 assert.ok(Math.abs(decodeClawPos(encodeClawPos(-.33))+.33)<.006);assert.equal(encodeClawPos(9),100);
});
test('서버: 인형가게 방에 들어가고 act(집게 자리·결과)를 같은 가게에만 중계·기억', ()=>{
 let t=1e6,n=0;const rooms=createRooms({now:()=>t,idGen:()=>`p${++n}`,tokenGen:()=>`tok${n}`,reports:{append(){}}});
 const join=(name,room,exp)=>{const inbox=[];const r=rooms.join({room,name,experience:exp,send:s=>inbox.push(JSON.parse(s))});r.client.inbox=inbox;return r.client;};
 const a=join('가','인형가게-1','claw'),b=join('나','인형가게-1','claw'),x=join('다','인형가게-1','christmas');
 assert.equal(a.room.key,'claw:인형가게');assert.equal(x.room.key,'christmas:인형가게','다른 체험과 섞이지 않음');
 rooms.message(a,{t:'act',a:{m:1,ph:'play',cx:40,cz:60,r:'',k:0,n:1}});
 assert.deepEqual(b.inbox.filter(m=>m.t==='act').at(-1),{t:'act',id:a.id,a:{m:1,ph:'play',cx:40,cz:60,r:'',k:0,n:1}});
 assert.equal(x.inbox.filter(m=>m.t==='act').length,0);
 const c=join('라','인형가게-1','claw');assert.ok(c.inbox.some(m=>m.t==='act'&&m.id===a.id&&m.a.ph==='play'),'나중에 온 손님도 지금 뽑는 모습');
 rooms.message(a,{t:'tree:put',slot:1,k:'ballRed'});assert.equal(rooms.stats.tree??0,0,'다른 체험 메시지는 버림');
 const cnt=rooms.serverCounts().claw;assert.deepEqual(cnt,[{id:'1',name:'인형가게 1서버',count:3,max:30}]);
});
test('허브 카드·서버 창·친구 부르기·입장: 인형뽑기 한 줄', ()=>{
 const e=HUB_EXP.find(x=>x.id==='claw');assert.ok(e);assert.equal(experienceHref(e,'/ai-office-world/'),'/ai-office-world/claw/');
 assert.ok(ART[e.art]);assert.ok(MAP_POS.claw);assert.ok(hasIcon(e.icon));for(const [ic] of e.feats)assert.ok(hasIcon(ic),ic);
 assert.equal(e.record({getItem:()=>JSON.stringify({dex:{cat:{n:1},hare:{n:2}}})}),'도감 2종');assert.equal(e.record({getItem:()=>null}),null);
 assert.equal(PICK_LABELS.claw.solo,'혼자 뽑기');
 assert.equal(inviteText('claw','인형가게-1'),'나 지금 온라인 인형뽑기 인형가게 1서버! 설치 없이 바로 들어와');
 assert.match(inviteUrl('https://engchoon.github.io/ai-office-world/claw/?x=1',{exp:'claw',room:'인형가게'}),/claw\/\?multi=%EC%9D%B8%ED%98%95%EA%B0%80%EA%B2%8C-1&utm_source=invite/);
 const mem=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};};
 const ls=mem(),p=createServerPick({experience:'claw',serverUrl:null,storage:ls,doc:null,fetchImpl:null});
 return p.open({closable:false}).then(()=>{p.join('1');assert.deepEqual(lastEntry('claw',ls),{server:'1'});});
});
test('상태 알약 글·주소 옵션', ()=>{
 assert.equal(clawStatusView({}).text,'혼자 뽑기');
 assert.equal(clawStatusView({state:'online',transport:'server',room:'인형가게',count:3,max:30}).text,'인형가게 1서버 · 👥 3/30');
 assert.match(clawStatusView({state:'reconnecting'}).sub,/혼자 뽑기는 계속/);
 assert.deepEqual(multiParams('?multi=인형가게-1&name=동동','') .room,'인형가게-1');
});
test('화면 규칙: 모든 조작이 화면 단추로(키는 덧붙임)·일시정지 없음·알림/카드가 HUD 위(z 50·55)', ()=>{
 const hud=read('src/claw/claw-hud.js'),css=read('src/claw/claw-hud.css');
 for(const d of ['up','down','left','right'])assert.match(hud,new RegExp(`data-dir="${d}"`));
 for(const id of ['press','play','rules','run','side'])assert.match(hud,new RegExp(`id:'${id}'`));
 assert.match(hud,/act\.bigDown\?\.\(e\.timeStamp\)/,'타이머는 누른 순간 시각');
 assert.match(hud,/kh-quit/);assert.match(hud,/data-go=/);assert.match(hud,/data-c="again"/);
 assert.doesNotMatch(hud+read('src/claw/main.js'),/일시정지|pause/i);
 assert.match(css,/\.kh-toast\{[^}]*z-index:50/);assert.match(css,/\.kh-card\{[^}]*z-index:55/);
 assert.match(css,/\.kh-dir\{[^}]*touch-action:none/);assert.match(css,/--kp:60px/);assert.match(css,/--kp:56px/);
});

// ── 봉 기계(설계 v4.1 §7, 다리 걸치기) ──
const bridgeSim=(bars={gap:.16},o={})=>createBridgeSim({geom:bridgeGeom(CLAW,bars,T.bridge),box:T.bridge.box,power:{grab:T.bridge.clawGrab,carry:T.bridge.clawGrab*.8},friction:T.bridge.barFriction,openTo:T.bridge.clawOpen,...o});
test('봉 물리: 상자가 가운데 받침 봉 둘에 걸쳐 쉼(기울기 0·양쪽 받침), 봉 4개·구멍 = 받침 봉 사이뿐, 상자 크기 = 조절값, 처음 자리 흔들림은 공정 범위 안', ()=>{
 {const g=bridgeGeom(CLAW,{gap:.16},T.bridge);assert.equal(g.rods.length,4);assert.deepEqual(g.rods.map(r=>r.kind).sort(),['guard','guard','support','support']);
  assert.ok(g.inGap(0,0)&&!g.inGap(0,1.0)&&!g.inGap(0,-1.0),'구멍 = 받침 봉 사이(바깥은 아님)');}
 const B=T.bridge,s=bridgeSim();
 assert.ok(s.sleeping,'가만히 두면 잠듦');assert.ok(s.tilt()<1,`기울기 ${s.tilt()}`);assert.ok(s.support()>.025,`받침 여유 ${s.support()}`);assert.ok(!nearState(s,B),'새 상자는 아슬아슬 아님');
 const bp=boxParts(B.box);assert.ok(Math.abs(bp.half[0]*2*U-B.box[2])<1e-9&&Math.abs(bp.half[1]*2*U-B.box[1])<1e-9&&Math.abs(bp.half[2]*2*U-B.box[0])<1e-9,'그림 크기 = 판정 크기');
 for(let i=0;i<20;i++){const p=startPose(B);assert.ok(Math.abs(p.x*U)<=B.startJitterM+1e-12&&Math.abs(p.yaw-Math.PI/2)<=B.startJitterDeg*Math.PI/180+1e-12,'긴 쪽이 앞뒤(90°) ± 8°');}
 // 八자: 앞 11cm → 뒤 15cm
 const g=bridgeGeom(CLAW,{near:.11,far:.15},B);assert.ok(Math.abs(g.barZ(1,g.xl)*2*U-.11)<1e-9&&Math.abs(g.barZ(1,g.xr)*2*U-.15)<1e-9,'八자: 왼쪽 11 → 오른쪽 15cm');
});
test('봉 물리: 약한 집게는 조이면 상자가 걸려 조금 들려도 끝까지 들고 가지 못함, 판이 끝나고 결과가 나옴, 모서리를 여러 번 밀면 떨어짐(성공)', ()=>{
 const B=T.bridge,s=bridgeSim();const c=s.center();
 // 가운데를 조이면 닿은 곳이 걸려 조금 들리지만(현실처럼, 11-23 대표 지적) 약한 집게라 8cm 넘게 못 들고 결국 빠짐(성공 아님)
 const y0=c[1];s.start();s.setPos(c[0],c[2]);s.drop();let maxY=y0;for(let t=0;t<14&&s.claw.state!=='done';t+=1/30){s.step(1/30);maxY=Math.max(maxY,s.center()[1]);}
 assert.equal(s.claw.state,'done');assert.ok((maxY-y0)*U<.08,`들림 ${((maxY-y0)*U).toFixed(3)}m`);assert.ok(!s.won,'집게가 들고 가서 성공하지 않음');
 // 정해 둔 순서(모서리 노리기)로 몇 판 안에 떨어짐
 // 봉 4개(11-23 대표 사진): 상자 긴 쪽이 앞뒤로 받침 봉을 건넘. 모서리(앞뒤 끝)를 번갈아 누르는 정해 둔 순서로 몇 판 안에 받침 봉 사이로 떨어짐
 let won=false,n=0;const s2=bridgeSim({gap:.16},{seed:3,pose:{x:0,z:0,yaw:Math.PI/2}});
 while(!won&&n<25){n++;const k=s2.center();won=runBridgeDrop(s2,k[0]+(n%2?.5:-.5),k[2]+(n%3?.9:-.9),B).won;}
 if(!won){for(let seed=4;seed<10&&!won;seed++){const s3=bridgeSim({gap:.16},{seed,pose:{x:0,z:0,yaw:Math.PI/2+seed*.02}});for(let m=0;m<25&&!won;m++){const k=s3.center();won=runBridgeDrop(s3,k[0]+(m%2?.5:-.5),k[2]+(m%3?.9:-.9),B).won;}}}
 assert.ok(won,'정해 둔 순서로 25판 안에 성공하는 상자가 있음');
});
test('봉 깊이(11-24 대표 지적 「별로 안 내려옴」): 발 하나가 상자 윗면에 닿아도 바로 멈추지 않고 더 내려감(가장자리 겨눔 7cm 넘게), 가장 낮은 곳은 바닥 제한 그대로', ()=>{
 const B=T.bridge;
 for(const [ox,oz] of [[.56,.66],[-.56,-.66],[.56,0],[0,.66],[0,0]]){const s=bridgeSim();const c=s.center();s.start();s.setPos(c[0]+ox,c[2]+oz);s.drop();let low=99;
  for(let t=0;t<6&&s.claw.state!=='lift';t+=1/240){s.step(1/240);low=Math.min(low,s.claw.y);}
  const drop=(s.geom.HOME.y-low)*U;assert.ok(drop>.07,`겨눔 (${ox},${oz}) 하강 ${(drop*100).toFixed(1)}cm`);assert.ok(low>=s.claw.minY-1e-6,'바닥 제한(발끝 상자 바닥 + 3.5cm) 아래로 안 내려감');}
});
test('봉 상태 저장(혼자 뽑기 v4.1 §3): 상자 자리를 그대로 다시 놓음·오늘까지·새날은 처음 자리, 진척 없음 판정', ()=>{
 // 11-24 집게 키움 뒤: 예전 겨눔(+0.9, +0.6)은 상자가 막이 봉 끝에 기울어 걸린 채 멈춰(드묾) 다시 열면 2cm 미끄러짐 → 상자가 16cm 움직이는 (−0.6, +0.6)으로
 const B=T.bridge,s=bridgeSim();const k=s.center();runBridgeDrop(s,k[0]-.6,k[2]+.6,B);
 for(let t=0;t<8&&!s.sleeping;t+=1/30)s.step(1/30); // 게임처럼 상자가 멈춘 뒤 저장(claw-play.js pendingSave)
 const st=s.boxState(),s2=bridgeSim({gap:.16},{st});
 assert.ok(Math.hypot(...s.center().map((v,i)=>v-s2.center()[i]))*U<.004,'다시 놓은 상자 자리 4mm 안');assert.ok(Math.abs(s.tilt()-s2.tilt())<2);
 const save=freshState(),now=KST-5000;saveMachState(save,'bridge-1',{st,id:'box-hare',mv:3,still:1},now);
 const re=sanitizeState(JSON.parse(JSON.stringify(save)));assert.deepEqual(machStateToday(re,'bridge-1',now).st,st);assert.equal(machStateToday(re,'bridge-1',now).id,'box-hare');
 assert.equal(machStateToday(re,'bridge-1',now+86400e3),null,'다음 날은 처음 자리');
 assert.equal(sanitizeMachState({day:'2026-11-23',st:[1,2,'x']},'bridge').st,null,'이상한 공 자리는 버림(처음 자리로)');assert.equal(sanitizeMachState({day:'어제'},'bridge'),null);
 assert.equal(sanitizeMachState({day:'2026-11-23',st:[]},'timer'),null,'봉 말고는 저장 안 함');
 const s3=bridgeSim(),b3=bridgeSnap(s3);assert.ok(noProgress(s3,b3,T.share),'안 움직이면 진척 없음');
});

// ── 통과 없음(11-23 대표 지적 「봉 게임에서 집게가 올라갈 때 상자를 통과하는 것처럼 보임」): 보이는 집게(팔·발끝·머리)·봉이 상자(직육면체)에 0.5cm 넘게 안 파고듦
test('봉 물리: 보이는 집게·봉이 상자를 뚫지 않음(무작위 판, 0.5cm 넘게 파고든 장면 0), 집게 판정 치수 = 그림 치수', ()=>{
 assert.deepEqual({...FINGER_ANGLE_B},{...FINGER_ANGLE},'손가락 각 = 그림');
 const art=read('src/claw/claw-bridge.js');
 for(const n of ['new THREE.Vector3(0,-.012,.034)','new THREE.Vector3(0,-.11,.036)','new THREE.Vector3(0,-.14,0)','TubeGeometry(path,12,.008,4,false).scale(2.4,1,1)','RoundedBoxGeometry(.04,.012,.026,2,.005).translate(0,-.142,-.004)','f.position.set(0,0,.03)','RoundedBoxGeometry(.1,.045,.05,2,.012).translate(0,.022,0)'])assert.ok(art.includes(n),'그림 치수 그대로: '+n);
 assert.equal(FINGER_PIVOT_Z,.03);assert.equal(FINGER_PLATES[1].r,.008);assert.ok(Math.abs(FINGER_PLATES[1].side+FINGER_PLATES[1].r-.008*2.4)<1e-9,'팔 반폭 = 관 반지름 × 2.4');assert.equal(HEAD_PLATE.c[1],.022);
 // 판정 도우미: 상자 가운데 판은 겹침, 멀리 있으면 아님, 위에서 누르면 상자를 아래로
 {const h=[1.1,.5,.8];assert.equal(plateBox([0,2,0],[0,3,0],[0,0,0],.1,h),null);const H=plateBox([0,.45,-.3],[0,.45,.3],[0,0,0],.1,h);assert.ok(H&&H.u[1]>.9&&Math.abs(H.d-.15)<1e-9,'위에서 닿으면 상자를 아래로');}
 const B=T.bridge,g=bridgeGeom(CLAW,{gap:.16},B),S=CLAW.clawTip/.14/U;
 const nrm=a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l);},dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
 const obb=s=>{const Q=s.P,c=[Q.x[0],Q.y[0],Q.z[0]],L=nrm([Q.x[3]-Q.x[2],Q.y[3]-Q.y[2],Q.z[3]-Q.z[2]]);let H=[Q.x[1]-Q.x[0],Q.y[1]-Q.y[0],Q.z[1]-Q.z[0]];const k=dot(H,L);H=nrm(H.map((v,i)=>v-k*L[i]));
  return {c,ax:[L,H,[L[1]*H[2]-L[2]*H[1],L[2]*H[0]-L[0]*H[2],L[0]*H[1]-L[1]*H[0]]],h:s.half};};
 const depth=(O,p)=>{const d=[p[0]-O.c[0],p[1]-O.c[1],p[2]-O.c[2]];let m=Infinity;for(let k=0;k<3;k++){const e=O.h[k]-Math.abs(dot(d,O.ax[k]));if(e<0)return -1;m=Math.min(m,e);}return m;};
 const plateDepth=(O,a,b,sd,r)=>{let m=-1;for(let i=0;i<=12;i++)for(let j=-1;j<=1;j++){const t=i/12;m=Math.max(m,depth(O,[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t+sd*j])+r);}return m;};
 const TIP=CLAW_RIG.l1*Math.cos(CLAW_RIG.rest)+CLAW_RIG.l2*Math.cos(CLAW_RIG.rest-CLAW_RIG.bend);
 const seen=c0=>{const o=c0.sway,x=c0.x+o[0],y=c0.y+o[1]+CLAW.clawTip/U-TIP,z=c0.z+o[2],out=[];
  for(let k=0;k<2;k++){const sg=k?-1:1,op=Math.max(0,Math.min(1,(c0.th[k]-CLAW_RIG.closed)/(CLAW_RIG.splay-CLAW_RIG.closed))),an=FINGER_ANGLE.shut+op*(FINGER_ANGLE.wide-FINGER_ANGLE.shut);
   const W=([,py,pz])=>[x+sg*(py*Math.sin(an)+pz*Math.cos(an)+.03)*S,y+(py*Math.cos(an)-pz*Math.sin(an))*S,z];for(const F of FINGER_PLATES)out.push([W(F.a),W(F.b),F.side*S,F.r*S]);}
  out.push([[x-HEAD_PLATE.half*S,y+HEAD_PLATE.c[1]*S,z],[x+HEAD_PLATE.half*S,y+HEAD_PLATE.c[1]*S,z],HEAD_PLATE.side*S,HEAD_PLATE.r*S]);return out;};
 let worst=0,worstBar=0,plays=0,lifted=0;
 for(let t=0;t<6;t++){let q=t*7+1;const R=()=>((q=(q*1664525+1013904223)>>>0)/4294967296);const s=bridgeSim({gap:.16},{seed:t+1,pose:startPose(B,R)});
  for(let k=0;k<3;k++){plays++;const c=s.center(),y0=c[1];s.start();s.setPos(c[0]+(R()*2-1)*1.0,c[2]+(R()*2-1)*.9);s.drop();
   for(let tt=0;tt<14&&s.claw.state!=='done';tt+=1/60){s.step(1/60);const O=obb(s);for(const [a,b,sd,r] of seen(s.claw))worst=Math.max(worst,plateDepth(O,a,b,sd,r));
    for(const R2 of g.rods)worstBar=Math.max(worstBar,plateDepth(O,[g.xl,R2.y,R2.z(g.xl)],[g.xr,R2.y,R2.z(g.xr)],0,g.barR));if(s.center()[1]-y0>.15)lifted++;}
   if(s.won)break;for(let tt=0;tt<1;tt+=1/30)s.step(1/30);}}
 assert.ok(worst*U<.005,`집게가 상자에 ${(worst*10).toFixed(2)}cm 파고듦`);assert.ok(worstBar*U<.005,`봉이 상자에 ${(worstBar*10).toFixed(2)}cm 파고듦`);assert.ok(plays>=12);
});
test('봉 상태 저장: 옛 판정(상자 박힘·옛 봉 간격) 자리는 버리고 처음 자리로, 경품·판 수는 이어 받음', ()=>{
 const old=sanitizeMachState({day:'2026-11-23',st:[1,2,3,4,5,6],id:'box-hare',mv:3},'bridge');assert.equal(old.st,null);assert.equal(old.id,'box-hare');assert.equal(old.mv,3);
 assert.deepEqual(sanitizeMachState({day:'2026-11-23',pv:MACH_PV,st:[1,2,3,4,5,6]},'bridge').st,[1,2,3,4,5,6]);
 const save=freshState();saveMachState(save,'bridge-2',{st:[1,2,3,4,5,6],id:'box-cat',mv:0,still:0},KST-5000);assert.equal(save.mach['bridge-2'].pv,MACH_PV);
});

test('봉 손맛(11-23 대표 결정): 아슬아슬 = 받침 여유 2cm 이하만, 아까움 = 이번 판에 2cm 이하로 들어감, 막이 봉 밖·봉 아래 = 다시 놓기, 봉 간격 16cm(11-23 통과 수정, 봉 1·2는 11-24 16.5cm)',()=>{
 const B=T.bridge,fake=(sup,tilt,c=[0,3,0],won=false)=>({won,support:()=>sup,tilt:()=>tilt,center:()=>c});
 assert.ok(!nearState(fake(.04,60),B),'많이 기울어도 받침 여유가 크면 아님');assert.ok(nearState(fake(.015,0),B));assert.ok(!nearState(fake(.01,0,[0,3,0],true),B),'떨어진 상자는 아님');
 assert.equal(bridgeOutcome(fake(.015,0),{support:.03},B),'near');assert.equal(bridgeOutcome(fake(.015,0),{support:.018},B),'miss','이미 아슬아슬하던 상자는 아까움 아님');
 assert.equal(bridgeOutcome(fake(.04,40,[2,3,0]),{support:.04,tilt:0,c:[0,3,0]},B),'miss','기울기·움직임만으로는 아까움 아님');
 const g=bridgeGeom(CLAW,{gap:.16},B),gz=g.layout.guardZ;
 assert.ok(!offRails(fake(.03,0,[0,3,gz-.1]),g));assert.ok(offRails(fake(.03,0,[0,3,gz+.1]),g));assert.ok(offRails(fake(.03,0,[0,3,-gz-.1]),g));assert.ok(offRails(fake(.03,0,[0,g.barY-1.2,0]),g),'봉 아래로 끼임');
 assert.ok(g.rods[0].y>g.rods[1].y&&Math.abs(g.rods[0].y-g.rods[1].y-.3)<1e-9,'막이 봉 3cm 위');
 assert.deepEqual({...MACHINES.find(m=>m.id==='bridge-4').bars},{gap:.16});assert.deepEqual({...MACHINES.find(m=>m.id==='bridge-3').bars},{near:.15,far:.175});assert.deepEqual({...MACHINES.find(m=>m.id==='bridge-1').bars},{gap:.165});assert.deepEqual({...MACHINES.find(m=>m.id==='bridge-2').bars},{gap:.165},'봉 1·2 = 16.5cm(11-24 집게 키움 뒤 다시 맞춤)');
 assert.ok(B.pityAfter===8&&B.lieDeg===45&&B.liePlays===3&&!('pityPower' in B));
});

// 11-24 조작 단추 시안 B(대표 승인): 조작 중 큰 단추 = 아래 가운데 넓은 판, 공통 틀 원 자리(data-uf)에 안 넣음, 마우스 기기만 키캡, 그림 단추 알림
test('조작 단추 시안 B: 세 기계(집게·타이머·봉/열쇠) 모두 판, 키캡은 마우스 기기만, 그림 단추 알림', ()=>{
 const js=readFileSync(new URL('../src/claw/claw-hud.js',import.meta.url),'utf8'),css=readFileSync(new URL('../src/claw/claw-hud.css',import.meta.url),'utf8'),main=readFileSync(new URL('../src/claw/main.js',import.meta.url),'utf8');
 const playBlock=js.slice(js.indexOf("if(kind==='claw')setActions("),js.indexOf("else if(mode==='result'||cardKind)"));
 assert.equal((playBlock.match(/bar:true/g)??[]).length,3,'집게·타이머·봉(열쇠) 세 갈래 모두 판');
 assert.match(playBlock,/half:!F/,'손가락 기기 집게만 오른쪽(십자 판 옆)');
 assert.match(js,/ufPlace\(root,\{big:big\?\.bar\?null:b/,'판은 공통 틀 원 자리에 안 넣음');
 assert.match(js,/kbd class="kh-key"[^`]*스페이스/);assert.ok(!/스페이스|Space|WASD|방향키/.test(playBlock.match(/'십자로[^']*'/)[0]));
 assert.match(css,/\.kh \.kh-bar kbd\.kh-key\{display:none\}/,'키캡 기본 숨김');
 assert.match(css,/@media \(hover:hover\) and \(pointer:fine\)\{\n \.kh:not\(\.touch\) \.kh-big\.kh-bar\{[^}]*width:min\(520px/,'마우스 기기 = 520px 판');
 assert.match(css,/\.kh:not\(\.touch\) \.kh-bar kbd\.kh-key\{display:flex/,'마우스 기기만 키캡');
 assert.match(js,/기계 그림 단추는 장식이에요 · 아래 「\$\{l\}」 단추나 Space를 눌러요/);assert.match(js,/기계 그림 단추는 장식이에요 · 아래 「\$\{l\}」 판을 눌러요/);
 assert.match(main,/hud\.artTap\(\)/);assert.match(main,/function barReserve\(/,'판이 가리면 그림을 위로');
});
