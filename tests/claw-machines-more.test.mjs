// 온라인 인형뽑기 타이머·열쇠 기계 그림 검사(월드아트 2026-11-23): 숫자 글자 = 설계 v3 표, 열쇠 구멍 그림 크기·자리 = 판정 좌표, 가게 kinds 옵션, 조작 카메라가 칸을 가리지 않음
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {MACHINES,plushInfo} from '../src/claw/claw-palette.js';
import {CLAW} from '../src/claw/claw-machine-art.js';
import {TIMER,KEY,timerText,keyCellRare,buildTimerMachine,buildKeyMachine,buildMachine} from '../src/claw/claw-machines-more.js';
import {buildClawShop} from '../src/claw/claw-shop-art.js';
import {resolvePool} from '../src/claw/claw-guest.js';

test('기계 종류 짝(추천안): 숲속 = 집게, 도시 = 타이머, 별빛 = 열쇠, 열쇠 칸 8개',()=>{
 assert.deepEqual(MACHINES.map(m=>m.kind),['claw','timer','key']);
 const star=MACHINES.find(m=>m.kind==='key');assert.equal(star.cells.length,KEY.cols*KEY.rows);
 for(const k of ['claw','timer','key'])assert.equal(buildMachine(MACHINES.find(m=>m.kind===k).id).userData.kind,k);
});
test('타이머 글자: 설계 v3 §7 표 그대로, 늘 두 자리.두 자리',()=>{
 const T=[[9999,'09.99'],[10000,'10.00'],[10009,'10.00'],[10010,'10.01'],[10100,'10.10'],[10110,'10.11'],[9899,'09.89'],[0,'00.00'],[15000,'15.00']];
 for(const [ms,t] of T)assert.equal(timerText(ms),t,`${ms}ms`);
 for(let ms=0;ms<=15000;ms+=7)assert.match(timerText(ms),/^\d\d\.\d\d$/);
});
test('타이머 기계: 숫자판 = 기계 폭 84%·숫자 ≈ 폭 20%, 판정이 준 글자를 그대로 씀, 단 위 인형, 단추 색',()=>{
 assert.ok(Math.abs(TIMER.display.w-CLAW.width*.84)<1e-9);assert.ok(TIMER.display.digitH/CLAW.width>=.19,'숫자 높이');
 assert.ok(TIMER.display.y+TIMER.display.h/2<=CLAW.height+.001&&TIMER.display.y-TIMER.display.h/2>=CLAW.glassTop-.001,'숫자판이 위 간판 상자 안');
 const m=buildTimerMachine('city'),U=m.userData;
 assert.equal(U.kind,'timer');assert.equal(U.height,TIMER.height);
 U.setTimer({text:'09.87',state:'run'});assert.equal(U.timer.text,'09.87');assert.equal(U.timer.state,'run');
 U.setTimer({ms:10009,state:'win'});assert.equal(U.timer.text,'10.00');
 assert.equal(U.prize.userData.plushId,MACHINES[1].pool[0]);
 assert.ok(Math.abs(U.prize.position.y-TIMER.stage.top)<1e-9,'인형이 단 윗면에 앉음');
 const st=TIMER.stage,hw=CLAW.width/2-.05,hd=CLAW.depth/2-.05;assert.ok(Math.abs(st.x)+st.r<hw&&Math.abs(st.z)+st.r<hd,'단이 유리 안');
 const c=CLAW.chute;assert.ok(st.x-st.r>c.x[1]||st.z+st.r<c.z[0],'단이 구멍과 안 겹침');
 assert.ok(Math.abs(U.claw.state.x-st.x)<1e-9&&Math.abs(U.claw.state.z-st.z)<1e-9,'집게가 단 위에서 시작');
 U.setPrize('haechi');assert.equal(U.prize.userData.plushId,'haechi');U.setPrize(null);assert.equal(U.prize,null);
 U.setButton('stop');U.setButton('start');U.setButton('off');U.setBand({targetSec:10,nearWinSec:.1,okWinSec:0});U.update(.1);
});
test('열쇠 칸: 크기 = 판정 단위(칸 폭·1.4칸), 구멍 그림 한 변 = 2 × 허용 폭, 희귀·특별 칸 구멍이 작음, 보장 판이면 넓어짐',()=>{
 const m=buildKeyMachine('star'),U=m.userData,wp=new THREE.Vector3();m.updateMatrixWorld(true);
 assert.equal(U.cells.length,8);
 for(const c of U.cells){const want=KEY.toLocal(c.i+.5,c.j*KEY.cellH+KEY.holeY);c.hole.getWorldPosition(wp);
  assert.ok(Math.abs(wp.x-want.x)<1e-6&&Math.abs(wp.y-want.y)<1e-6,`구멍 ${c.i},${c.j} 자리`);
  const f=c.rare?.08:.14;assert.ok(Math.abs(c.hole.scale.x-2*f*KEY.cell)<1e-9,`구멍 ${c.i},${c.j} 크기`);
  assert.equal(c.rare,keyCellRare(c.id));}
 assert.ok(U.cells.some(c=>c.rare)&&U.cells.some(c=>!c.rare));
 for(const c of U.cells)if(c.id&&!c.id.startsWith('guest-'))assert.equal(c.rare,['rare','special'].includes(plushInfo(c.id).rarity));
 U.setHoles({fit:.2,fitRare:.1,pity:true,pityBonus:.05});const c0=U.cells.find(c=>!c.rare);assert.ok(Math.abs(c0.hole.scale.x-2*.25*KEY.cell)<1e-9);
 assert.ok(KEY.left+KEY.cols*KEY.cell<=CLAW.width/2-.05&&KEY.bottom+KEY.rows*KEY.cellH*KEY.cell<KEY.glassTop-.05,'칸 묶음이 유리 안');
 // 칸 인형은 칸 높이 안
 for(const c of U.cells){if(!c.obj)continue;const b=new THREE.Box3().setFromObject(c.obj),top=KEY.bottom+(c.j+1)*KEY.cellH*KEY.cell;assert.ok(b.max.y<top+.002,`${c.id} 머리가 위 선반 아래 ${b.max.y.toFixed(3)} < ${top.toFixed(3)}`);}
});
test('열쇠: 판정 좌표대로 움직이고, 끝까지 밀면 끝이 구멍 안, 칸 열기 → 인형 떨어져 숨음 → 되돌리기',()=>{
 const m=buildKeyMachine('star'),U=m.userData,v=new THREE.Vector3();
 U.key.set({x:2.5,y:1.4+KEY.holeY,push:0});m.updateMatrixWorld(true);
 const carrier=U.key.root.getObjectByName('열쇠 수레');carrier.getWorldPosition(v);const want=KEY.toLocal(2.5,1.4+KEY.holeY);
 assert.ok(Math.abs(v.x-want.x)<1e-6&&Math.abs(v.y-want.y)<1e-6,'열쇠 끝 = 판정 자리');assert.ok(v.z>KEY.front,'쉬는 자리는 칸 앞');
 U.key.set({push:1});m.updateMatrixWorld(true);carrier.getWorldPosition(v);assert.ok(v.z<KEY.front+.0155&&v.z>KEY.front-.05,'끝까지 밀면 구멍 안');
 const c=U.cellAt(2,1),obj=c.obj;assert.ok(U.openCell(2,1));for(let i=0;i<10;i++)U.update(.08);
 assert.equal(obj.visible,false);assert.ok(c.hinge.rotation.x>1);assert.equal(c.open,1);
 U.markCell(2,1,'ok');assert.ok(c.mark.visible);U.resetCells();assert.equal(obj.visible,true);assert.equal(c.hinge.rotation.x,0);assert.equal(c.mark.visible,false);
});
test('조작 카메라: 서는 자리 동동이 모자(1.12m) 위로 넘겨 열쇠 칸 전체·타이머 숫자판과 단이 보이고, 위 간판에 안 가림',()=>{
 const hat={y:1.12,z:CLAW.stand.z-.2};
 const lineY=(p,q,z)=>p[1]+(q[1]-p[1])*(z-p[2])/(q[2]-p[2]);
 for(const pos of [KEY.camera.pos,KEY.camera.portrait.pos]){
  const gTop=[0,KEY.bottom+KEY.rows*KEY.cellH*KEY.cell,KEY.front],gBot=[0,KEY.bottom,KEY.front];
  assert.ok(lineY(pos,gBot,hat.z)>hat.y,`칸 아래가 모자 위로 보임 ${pos}`);
  assert.ok(lineY(pos,gTop,CLAW.depth/2+.01)<KEY.glassTop-.01,`칸 위가 간판에 안 가림 ${pos}`);}
 for(const pos of [TIMER.camera.pos,TIMER.camera.portrait.pos]){
  assert.ok(lineY(pos,[0,TIMER.stage.top,TIMER.stage.z],hat.z)>hat.y,`단 위 인형이 모자 위로 보임 ${pos}`);}
});
test('가게 kinds: 기본은 세 대 모두 집게(게임 연결 전), 켜면 집게·타이머·열쇠 — 자리·서는 곳·부딪힘은 같음, 공개판 열쇠 칸은 우리 인형',()=>{
 const a=buildClawShop(),b=buildClawShop({kinds:true});
 assert.deepEqual(a.userData.machines.map(m=>m.kind),['claw','claw','claw']);
 assert.deepEqual(b.userData.machines.map(m=>m.kind),['claw','timer','key']);
 a.userData.machines.forEach((m,i)=>{const n=b.userData.machines[i];assert.equal(m.x,n.x);assert.equal(m.z,n.z);assert.ok(m.stand.equals(n.stand));});
 assert.deepEqual(a.userData.colliders,b.userData.colliders);
 assert.ok(b.userData.machines[0].group.userData.pile,'집게 기계만 인형 더미');assert.equal(b.userData.machines[1].group.userData.pile,null);
 const key=b.userData.machines[2].group.userData;assert.deepEqual(key.cells.map(c=>c.id),resolvePool(MACHINES[2].cells,[]));
 assert.ok(!key.cells.some(c=>c.id.startsWith('guest-')),'공개판에는 손님 인형 없음');
 b.userData.update(.1);
});
