// 인형가게 전용 옷(claw-outfits.js)·무인 뽑기방 꾸밈(claw-arcade-art.js) 검사(월드아트, 2026-11-23)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {CLAW_OUTFITS,CLAW_OUTFIT_IDS,DEFAULT_CLAW_OUTFIT,clawOutfitKey,clawPartTriangles} from '../src/claw/claw-outfits.js';
import {ARCADE_LOOKS,DEFAULT_LOOK,arcadeLook} from '../src/claw/claw-arcade-art.js';
import {SHOP,SHOP_LIGHT,SHOP_LIGHTS,buildClawShop} from '../src/claw/claw-shop-art.js';

test('가게 옷: 후드티 기본·대안 2벌, 등산 장비 색(주황 바람막이·빨간 장갑)을 쓰지 않음, 부품 형상이 가벼움',()=>{
 assert.equal(DEFAULT_CLAW_OUTFIT,'hoodie');assert.deepEqual(CLAW_OUTFIT_IDS,['hoodie','jacket','tee']);
 assert.equal(clawOutfitKey('hike'),'hoodie','모르는 값은 기본 옷');
 for(const id of CLAW_OUTFIT_IDS){const o=CLAW_OUTFITS[id];
  assert.notEqual(o.colors.jacket.toLowerCase(),'#f08a3c',`${id} 바람막이 색 아님`);assert.equal(o.colors.mitten,'#f7d9b8',`${id} 맨손`);
  for(const n of ['zip','strap'])assert.ok(o.fold.includes(n),`${id} 등산복 ${n} 접음`);}
 const tri=clawPartTriangles();for(const id of CLAW_OUTFIT_IDS){assert.ok(tri[id]>0&&tri[id]<6000,`${id} 부품 삼각형 ${tri[id]}`);}
 // 다른 콘텐츠 옷 파일은 건드리지 않고 공용 applyOutfit 옵션만 씀
 const code=fs.readFileSync('src/claw/claw-outfits.js','utf8');assert.match(code,/from '\.\.\/lounge\/outfit\.js'/);
 assert.match(fs.readFileSync('src/claw/claw-avatar.js','utf8'),/applyClawOutfit/,'내 동동이·손님 동동이 모두 같은 createClawAvatar로 옷을 입음');
});
test('무인 뽑기방: 그림 방향 둘(기본 neon), 실시간 빛은 그대로 둘, 두 방향 모두 동선·서는 자리 막힘 없음',()=>{
 assert.equal(DEFAULT_LOOK,'neon');assert.equal(arcadeLook('x'),'neon');assert.equal(SHOP_LIGHT,SHOP_LIGHTS.neon);
 for(const k of Object.keys(ARCADE_LOOKS)){const L=ARCADE_LOOKS[k].light;assert.ok(L.hemi&&L.key&&L.background,`${k} 빛 값`);}
 for(const look of Object.keys(ARCADE_LOOKS)){const shop=buildClawShop({mobile:true,look,kinds:true}),U=shop.userData,W=SHOP.walk;
  assert.equal(U.look,look);
  const inside=(x,z,c)=>c.r?Math.hypot(x-c.x,z-c.z)<c.r+.15:x>c.x0-.15&&x<c.x1+.15&&z>c.z0-.15&&z<c.z1+.15; // 동동이 몸 반지름만큼 여유
  const free=(x,z)=>x>W.x[0]&&x<W.x[1]&&z>W.z[0]&&z<W.z[1]&&!U.colliders.some(c=>inside(x,z,c));
  for(const m of U.machines)assert.ok(free(m.stand.x,m.stand.z),`${look} ${m.id} 서는 자리`);
  for(const k of ['kiosk','showcase','statue','door','spawn'])assert.ok(free(U.spots[k].x,U.spots[k].z),`${look} ${k}`);
  // 문 → 각 기계 앞까지 가로막힘 없이 걸어갈 수 있음(0.1m 칸 넓이 우선 찾기)
  const step=.1,key=(i,j)=>i+','+j,toI=x=>Math.round(x/step),start=[toI(U.spots.door.x),toI(U.spots.door.z)],seen=new Set([key(...start)]),q=[start];
  while(q.length){const [i,j]=q.shift();for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const n=[i+di,j+dj],k=key(...n);if(seen.has(k)||!free(n[0]*step,n[1]*step))continue;seen.add(k);q.push(n);}}
  for(const m of U.machines)assert.ok(seen.has(key(toI(m.stand.x),toI(m.stand.z))),`${look} 문에서 ${m.id}까지 길`);
  for(const k of ['kiosk','showcase'])assert.ok(seen.has(key(toI(U.spots[k].x),toI(U.spots[k].z))),`${look} 문에서 ${k}까지 길`);
  // 실시간 빛을 더하지 않음(가게 안에 Light 없음), 네온은 빛 계산 없는 재질
  let lights=0,neon=0;shop.traverse(o=>{if(o.isLight)lights++;if(o.userData.neon){neon++;assert.ok(o.material.isMeshBasicMaterial);}});
  assert.equal(lights,0);assert.ok(neon>=6,`네온 묶음 ${neon}`);
  // 천장 네온: 카메라가 위로 가면 숨김
  const ceil=shop.getObjectByName('천장 네온'),cam=new THREE.PerspectiveCamera();cam.position.set(0,1.6,1);U.fadeWalls(cam);assert.equal(ceil.visible,true);
  cam.position.set(0,3.4,1);U.fadeWalls(cam);assert.equal(ceil.visible,false);}
});
