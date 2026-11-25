// 온라인 인형뽑기 타이머·열쇠 기계 그림 검사(월드아트 2026-11-23): 숫자 글자 = 설계 v3 표, 열쇠 구멍 그림 크기·자리 = 판정 좌표, 가게 kinds 옵션, 조작 카메라가 칸을 가리지 않음
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {MACHINES,plushInfo,BIG_PLUSH} from '../src/claw/claw-palette.js';
import {plushGeometry,plushSize,plushLineWidth} from '../src/claw/claw-plush.js';
import {CLAW} from '../src/claw/claw-machine-art.js';
import {TIMER,KEY,timerText,keyCellRare,buildTimerMachine,buildKeyMachine,buildMachine} from '../src/claw/claw-machines-more.js';
import {buildClawShop} from '../src/claw/claw-shop-art.js';
import {resolvePool} from '../src/claw/claw-guest.js';

test('기계 종류(11-23 16대, 설계 v4.1): 집게 6·봉 4·타이머 3·열쇠 3, 열쇠 칸 8개',()=>{
 assert.deepEqual([...new Set(MACHINES.map(m=>m.kind))],['claw','bridge','timer','key']);for(const M of MACHINES.filter(m=>m.kind==='key'))assert.equal(M.cells.length,KEY.cols*KEY.rows);
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
 const m=buildTimerMachine('timer-2'),U=m.userData;
 assert.equal(U.kind,'timer');assert.equal(U.height,TIMER.height);
 U.setTimer({text:'09.87',state:'run'});assert.equal(U.timer.text,'09.87');assert.equal(U.timer.state,'run');
 U.setTimer({ms:10009,state:'win'});assert.equal(U.timer.text,'10.00');
 assert.equal(U.prize.userData.plushId,MACHINES.find(m=>m.id==='timer-2').pool[0]);
 assert.ok(Math.abs(U.prize.position.y-TIMER.stage.top)<1e-9,'인형이 단 윗면에 앉음');
 const st=TIMER.stage,hw=CLAW.width/2-.05,hd=CLAW.depth/2-.05;assert.ok(Math.abs(st.x)+st.r<hw&&Math.abs(st.z)+st.r<hd,'단이 유리 안');
 // 11-23 v1.6 큰 인형: 단 위 인형 머리가 유리 천장 불빛 줄 아래, 경품 받침·단추가 서로·열린 문과 안 겹침
 {const bb=new THREE.Box3().setFromObject(U.prize);assert.ok(bb.max.y<CLAW.glassTop-.05,`큰 인형 머리 ${bb.max.y.toFixed(3)}`);assert.ok(U.prize.userData.size>=.4,'큰 인형');}
 const t=TIMER.tray;assert.ok(t.x+t.w/2<TIMER.button[0]-.08,'받침이 단추 왼쪽');assert.ok(t.x-t.w/2>-CLAW.width/2+.04,'받침이 열린 문(왼쪽 경첩) 안쪽');
 // 11-23 대표 피드백: 타이머 기계는 집게 없이 잠금 유리문으로 꺼냄
 assert.equal(U.claw,undefined,'집게 없음');let clawParts=0;m.traverse(o=>{if(/집게/.test(o.name))clawParts++;});assert.equal(clawParts,0);
 const hinge=m.getObjectByName('잠금 유리문');assert.ok(hinge);assert.equal(U.door.lock,'locked');assert.ok(Math.abs(hinge.rotation.y)<1e-9);
 U.setDoor({open:1,lock:'open'});assert.ok(hinge.rotation.y<-1.2,'문이 바깥으로 활짝');assert.equal(U.door.lock,'open');
 U.setDoor({open:0,rattle:.05,lock:'near'});assert.ok(Math.abs(hinge.rotation.y+.05)<1e-9,'덜컥(닫힌 채 살짝)');U.setDoor({open:0,lock:'locked'});
 assert.ok(U.spots.out.z>CLAW.depth/2&&U.spots.out.y>=CLAW.panel.top,'꺼낸 인형 자리 = 문 밖 조작대 위');
 const o=U.detachPrize();assert.ok(o);assert.equal(U.prize,null);U.setPrize(MACHINES.find(m=>m.id==='timer-2').pool[0]);
 U.setPrize('haechi');assert.equal(U.prize.userData.plushId,'haechi');U.setPrize(null);assert.equal(U.prize,null);
 U.setButton('stop');U.setButton('start');U.setButton('off');U.setBand({targetSec:10,nearWinSec:.1,okWinSec:0});U.update(.1);
});
test('열쇠 칸: 크기 = 판정 단위(칸 폭·1.4칸), 구멍 그림 한 변 = 2 × 허용 폭, 희귀·특별 칸 구멍이 작음, 보장 판이면 넓어짐',()=>{
 const m=buildKeyMachine('key-1'),U=m.userData,wp=new THREE.Vector3();m.updateMatrixWorld(true);
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
 const m=buildKeyMachine('key-1'),U=m.userData,v=new THREE.Vector3();
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
test('가게 kinds: 기본은 모두 집게(미리보기), 켜면 종류대로 — 자리·서는 곳·부딪힘은 같음, 공개판 열쇠 칸은 우리 인형',()=>{
 const a=buildClawShop(),b=buildClawShop({kinds:true});
 assert.ok(a.userData.machines.every(m=>m.kind==='claw'));
 assert.deepEqual(b.userData.machines.map(m=>m.kind),MACHINES.map(m=>m.kind));
 a.userData.machines.forEach((m,i)=>{const n=b.userData.machines[i];assert.equal(m.x,n.x);assert.equal(m.z,n.z);assert.ok(m.stand.equals(n.stand));});
 // 부딪힘은 같음. 타이머 기계만 경품 받침(조작대보다 10cm 앞)까지 늘어남(11-23 v1.6)
 b.userData.colliders.forEach((c,i)=>{const d=a.userData.colliders[i];if(c.id.startsWith('timer-'))assert.ok(Math.abs(c.z1-d.z1-(TIMER.tray.z1-CLAW.depth/2-CLAW.panel.depth))<1e-9);else assert.deepEqual(c,d);});
 assert.ok(a.userData.machines[0].group.userData.pile,'미리보기 집게 기계는 인형 더미');assert.equal(b.userData.machines[0].group.userData.pile,null,'게임(kinds)은 물리 더미를 claw-play가 그림');
 const ki=MACHINES.findIndex(m=>m.id==='key-1'),key=b.userData.machines[ki].group.userData;assert.deepEqual(key.cells.map(c=>c.id),resolvePool(MACHINES[ki].cells,[]));
 assert.ok(!key.cells.some(c=>c.id.startsWith('guest-')),'공개판에는 손님 인형 없음');
 b.userData.update(.1);
});

test('큰 인형(11-23 v1.6, 타이머 기계 전용): 원래 인형 형상 공유·희귀도 그대로·약 2배·단 한도 아래, 문 밖 받침에 놓임',()=>{
 assert.equal(BIG_PLUSH.length,6); // 11-25 큰 인형 3 + 3
 for(const b of BIG_PLUSH){const base=plushInfo(b.base);assert.ok(base,'원래 인형');assert.equal(b.rarity,base.rarity,'희귀도·이름표 색 그대로');assert.equal(plushInfo(b.id).name,b.name);
  assert.equal(plushGeometry(b.id),plushGeometry(b.base),'형상 공유(새 형상 없음)');const k=plushSize(b.id)/plushSize(b.base);assert.ok(k>=1.65&&k<=2.2,`${b.id} 배율 ${k.toFixed(2)}`);
  assert.ok(plushSize(b.id)<=TIMER.big.maxSize,'단 한도 아래');assert.ok(Math.abs(plushLineWidth(b.id)*plushSize(b.id)-plushLineWidth(b.base)*plushSize(b.base))<1e-9,'외곽선 실제 두께 같음');}
 assert.deepEqual(MACHINES.filter(m=>m.kind==='timer').flatMap(m=>m.pool).sort(),BIG_PLUSH.map(b=>b.id).sort(),'타이머 기계 = 큰 인형만(11-25부터 기계마다 2종 번갈아)');
 const m=buildTimerMachine('timer-2'),U=m.userData;
 for(const b of BIG_PLUSH){U.setPrize(b.id);const bb=new THREE.Box3().setFromObject(U.prize);assert.ok(bb.max.y<CLAW.glassTop-.05,`${b.id} 유리 안`);assert.ok(bb.max.x-bb.min.x<CLAW.width-.2,'문 폭 안');
  // 받침에 놓았을 때: 열린 문(x ≈ -0.44)과 큰 단추에 안 닿음
  const o=U.prize;o.position.copy(U.spots.out);o.rotation.y=0;const q=new THREE.Box3().setFromObject(o);
  assert.ok(q.min.x>-CLAW.width/2+.01,`${b.id} 열린 문과 떨어짐 ${q.min.x.toFixed(3)}`);assert.ok(q.max.x<TIMER.button[0]-.07,`${b.id} 단추와 떨어짐`);}
});
