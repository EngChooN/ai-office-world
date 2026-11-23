// 온라인 인형뽑기 그림 검사(월드아트 2026-11-23): 인형 목록·형상 무게, 기계 치수·집게, 인형 더미, 가게 배치, 손님 인형 자리(공개판 대체)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {PLUSH,RARITY,RARITY_ORDER,MACHINES,GUEST_SLOTS} from '../src/claw/claw-palette.js';
import {PLUSH_IDS,plushGeometry,plushTriangles,plushSize,makePlush} from '../src/claw/claw-plush.js';
import {CLAW,buildClawMachine,fillPile} from '../src/claw/claw-machine-art.js';
import {SHOP,buildClawShop} from '../src/claw/claw-shop-art.js';
import {loadGuests,clawCatalog,resolvePool,isGuestId,makeGuestPlush} from '../src/claw/claw-guest.js';

test('인형 8종: id 겹침 없음, 희귀도 4단계가 모두 있고 클수록 큼',()=>{
 assert.equal(PLUSH.length,8);assert.equal(new Set(PLUSH_IDS).size,8);
 for(const p of PLUSH)assert.ok(RARITY[p.rarity],p.id);
 assert.deepEqual([...new Set(PLUSH.map(p=>p.rarity))].sort(),[...RARITY_ORDER].sort());
 for(let i=1;i<RARITY_ORDER.length;i++)assert.ok(RARITY[RARITY_ORDER[i]].size>RARITY[RARITY_ORDER[i-1]].size);
 assert.ok(new Set(RARITY_ORDER.map(k=>RARITY[k].color)).size===4,'희귀도 색이 서로 다름');
});
test('인형 형상: 높이 1·바닥 0, 한 종 6천 삼각형 아래(휴대폰), 같은 형상을 다시 만들지 않음',()=>{
 for(const id of PLUSH_IDS){const g=plushGeometry(id),b=g.color.boundingBox;
  assert.ok(Math.abs(b.min.y)<1e-6&&Math.abs(b.max.y-1)<1e-6,`${id} 높이`);
  assert.ok(plushTriangles(id)<6000,`${id} ${plushTriangles(id)}`);
  assert.ok(b.max.x-b.min.x<1.0,`${id} 폭 ${(b.max.x-b.min.x).toFixed(2)}(떨어져 나간 부품 없음)`);
  assert.ok(g.color.attributes.color,'꼭짓점 색');assert.equal(plushGeometry(id),g);}
 const p=makePlush('dongdong');assert.equal(p.userData.size,plushSize('dongdong'));assert.ok(p.children.some(c=>c.userData.outline));
});
test('기계 치수: 동동이 손이 닿는 조작대, 집게 범위가 유리 안, 구멍은 집게 처음 자리 아래',()=>{
 assert.ok(CLAW.panel.top<=.52,'조작대 윗면이 동동이 팔 높이(약 0.5m) 근처');
 assert.ok(CLAW.floorY<CLAW.glassTop&&CLAW.glassTop<CLAW.height);
 const hw=CLAW.width/2-.05,hd=CLAW.depth/2-.05;
 for(const x of CLAW.play.x)assert.ok(Math.abs(x)+.06<hw);for(const z of CLAW.play.z)assert.ok(Math.abs(z)+.06<hd);
 const [hx,hz]=CLAW.home,c=CLAW.chute;assert.ok(hx>c.x[0]&&hx<c.x[1]&&hz>c.z[0]&&hz<c.z[1],'처음 자리 = 구멍 위');
 assert.ok(CLAW.clawTop-CLAW.dropMax>CLAW.floorY,'최대로 내려도 바닥을 뚫지 않음');
 assert.ok(CLAW.clawTop+CLAW.clawTip<CLAW.railY+.001,'집게가 레일 아래에 매달림');
});
test('집게 자세: 손가락 끝 높이 = clawTop − drop, 여닫기, 그림자 점',()=>{
 const m=buildClawMachine('forest');m.updateMatrixWorld(true);const c=m.userData.claw;
 for(const drop of [0,.2,CLAW.dropMax]){c.set({x:.1,z:-.1,drop,open:.5});m.updateMatrixWorld(true);const p=c.tipWorld();
  assert.ok(Math.abs(p.y-(CLAW.clawTop-drop))<1e-6,`drop ${drop} → ${p.y}`);assert.ok(Math.abs(p.x-.1)<1e-6&&Math.abs(p.z+.1)<1e-6);}
 // 여닫기 방향: open이 클수록 손가락 끝이 집게 가운데에서 멀어짐(11-23 거꾸로였던 것 고침), opens로 손가락마다 따로
 const spread=()=>{m.updateMatrixWorld(true);const h=c.head.getWorldPosition(new THREE.Vector3());let s=0;
  for(const f of c.fingers){const t=f.localToWorld(new THREE.Vector3(0,-.14,0)).sub(h);s+=Math.hypot(t.x,t.z);}return s/3;};
 let prev=-1;for(const open of [0,.25,.5,.75,1]){c.set({drop:0,open});const s=spread();assert.ok(s>prev,`open ${open} 벌어진 거리 ${s.toFixed(3)}`);prev=s;}
 c.set({open:0});assert.ok(spread()<.02,'오므리면 끝이 가운데로 모임(물리처럼 살짝 겹침)');
 c.set({open:0,opens:[1,0,0]});m.updateMatrixWorld(true);assert.ok(c.fingers[0].rotation.x<c.fingers[1].rotation.x,'opens 손가락마다');
 c.set({x:.2,z:.1,dotY:.7});assert.ok(Math.abs(c.dot.position.y-.704)<1e-6);
 for(const id of MACHINES.map(x=>x.id))assert.ok(buildClawMachine(id).getObjectByName('뽑기 단추'));
 assert.throws(()=>buildClawMachine('없는기계'));
});
test('불빛 상태: idle·play·win·rainbow·off에서 전구 밝기가 바뀜',()=>{
 const m=buildClawMachine('star'),U=m.userData;const seen=new Set();
 for(const mode of ['idle','play','win','rainbow','off']){U.setLights(mode);U.update(.13);seen.add(U.mats.bulbA.emissiveIntensity.toFixed(2)+U.mats.bulbA.emissive.getHexString());}
 assert.ok(seen.size>=4);
});
test('인형 더미: 유리 안·구멍 밖, seed가 같으면 같은 배치, 꺼내기·되돌리기',()=>{
 const m=buildClawMachine('city'),p=fillPile(m,['cat','magpie','dongdong-office'],{count:14,seed:3});
 assert.ok(p.items.length>=10&&p.items.length<=14,`${p.items.length}개`);
 const c=CLAW.chute,hw=CLAW.width/2,hd=CLAW.depth/2;
 for(const it of p.items){assert.ok(Math.abs(it.pos.x)<hw-.05&&Math.abs(it.pos.z)<hd-.05,'유리 안');
  assert.ok(!(it.pos.x>c.x[0]&&it.pos.x<c.x[1]&&it.pos.z>c.z[0]&&it.pos.z<c.z[1]),'구멍 위에 없음');assert.ok(it.pos.y>=CLAW.floorY);}
 const q=fillPile(buildClawMachine('city'),['cat','magpie','dongdong-office'],{count:14,seed:3});
 assert.deepEqual(q.items.map(i=>[i.id,i.pos.x.toFixed(4)]),p.items.map(i=>[i.id,i.pos.x.toFixed(4)]));
 // 종마다 InstancedMesh 하나(+외곽선)
 const ims=p.group.children.filter(o=>o.isInstancedMesh&&!o.userData.outline);assert.equal(ims.length,new Set(p.items.map(i=>i.id)).size);
 const n=p.nearest(0,0);assert.ok(n);p.take(n.index);assert.ok(p.items[n.index].hidden);assert.notEqual(p.nearest(0,0)?.index,n.index);p.put(n.index);assert.ok(!p.items[n.index].hidden);
 assert.ok(p.topAt(n.item.pos.x,n.item.pos.z)>CLAW.floorY);
 assert.throws(()=>fillPile(buildClawMachine('star'),['guest-1'],{count:3}),/guestObject/);
});
test('가게: 기계 세 대가 걷는 범위 안·서는 자리가 막히지 않음, 들어온 자리 비어 있음, 벽 숨기기',()=>{
 const shop=buildClawShop({mobile:true}),U=shop.userData,W=SHOP.walk;
 assert.equal(U.machines.length,3);
 const inside=(x,z,c)=>c.r?Math.hypot(x-c.x,z-c.z)<c.r:x>c.x0&&x<c.x1&&z>c.z0&&z<c.z1;
 const free=(x,z)=>x>W.x[0]&&x<W.x[1]&&z>W.z[0]&&z<W.z[1]&&!U.colliders.some(c=>inside(x,z,c));
 for(const m of U.machines){assert.ok(free(m.stand.x,m.stand.z),`${m.id} 서는 자리`);assert.ok(m.group.userData.pile.items.length>=6,'휴대폰도 더미가 있음');}
 assert.ok(free(SHOP.spawn.x,SHOP.spawn.z),'들어온 자리');
 for(const k of ['kiosk','showcase','statue','door'])assert.ok(free(U.spots[k].x,U.spots[k].z),`${k} 앞 자리`);
 // 기계끼리·진열장과 안 겹침
 const boxes=U.colliders.filter(c=>!c.r);for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert.ok(a.x1<=b.x0||b.x1<=a.x0||a.z1<=b.z0||b.z1<=a.z0,`${a.id}·${b.id} 겹침`);}
 const cam=new THREE.PerspectiveCamera();cam.position.set(0,6,SHOP.d/2+3);U.fadeWalls(cam);
 assert.equal(U.walls.find(w=>w.key==='front').mesh.visible,false);assert.equal(U.walls.find(w=>w.key==='back').mesh.visible,true);
 cam.position.set(0,1.5,0);U.fadeWalls(cam);assert.ok(U.walls.every(w=>w.mesh.visible));
 U.showcase.set(['hare']);assert.equal(U.showcase.slots.length,8);
});
test('손님 인형 자리: 공개판(설정 없음)에는 손님이 없고 대체 우리 인형이 그 자리에 놓임',async()=>{
 const guests=await loadGuests();assert.deepEqual(guests,[]);
 assert.equal(clawCatalog(guests).length,8);assert.ok(clawCatalog(guests).every(c=>!c.guest));
 for(const s of GUEST_SLOTS){assert.ok(PLUSH_IDS.includes(s.fallback),`${s.id} 대체 인형`);assert.ok(isGuestId(s.id));}
 for(const M of MACHINES){const pool=resolvePool(M.pool,guests);assert.ok(pool.every(id=>PLUSH_IDS.includes(id)),`${M.id} 공개판 목록`);}
 assert.deepEqual(resolvePool(['guest-1','cat'],[{id:'guest-1'}]),['guest-1','cat']);
 const g=await makeGuestPlush('guest-1',[]);assert.equal(g.userData.plushId,GUEST_SLOTS[0].fallback);
 // 공개 코드에는 다른 회사 캐릭터 이름이 글자로 들어가지 않는다(설명 주석 제외)
 for(const f of fs.readdirSync('src/claw').filter(f=>f.endsWith('.js'))){const code=fs.readFileSync(`src/claw/${f}`,'utf8').replace(/\/\/.*$/gm,'').replace(/\/\*[\s\S]*?\*\//g,'');
  assert.ok(!/치이카와|chiikawa|ちいかわ/i.test(code),`${f}에 이름 글자`);}
 assert.match(fs.readFileSync('.gitignore','utf8'),/^private\/$/m,'비공개 폴더는 커밋 안 함');
});
