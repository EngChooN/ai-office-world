// 남산 순환버스 그림 자료 검사(월드아트 11-19): 차로·도는 길·정류장·버스 치수
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createNamsanGround,courseAt,NAMSAN,BUS_ROAD} from '../src/namsan/namsan-data.js';
import {BUS,buildBus,placeOnLane} from '../src/namsan/namsan-bus-art.js';

const B='assets/shared/namsan/',meta=JSON.parse(fs.readFileSync(B+'namsan-meta.json'));
const rd=f=>{const b=fs.readFileSync(B+f);return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);};
const data={meta,terrain:{...meta.terrain,values:new Float32Array(rd('terrain.f32')),land:new Uint8Array(rd('landcover.u8'))},course:JSON.parse(fs.readFileSync(B+'course.json')),walls:[],busRoad:JSON.parse(fs.readFileSync(B+'bus-road.json'))};
const G=createNamsanGround(data),L=G.bus,C=L.cycle;

test('차로: 두 광장을 잇고 경사 15% 안, 끝은 정상 광장 높이',()=>{
 assert.ok(L.length>1500&&L.length<2500,`길이 ${L.length}`);
 // 3m 이상 떨어진 두 점으로 잰다(머리핀은 점 간격이 0.4m까지 좁아 소수 둘째 자리 반올림이 경사를 부풀림)
 for(let i=0,j=0;i<L.points.length;i++){while(j<L.points.length-1&&L.points[j].s-L.points[i].s<3)j++;const a=L.points[i],b=L.points[j];if(b.s-a.s<3)break;assert.ok(Math.abs(b.y-a.y)/(b.s-a.s)<=BUS_ROAD.grade+.005,`s ${b.s} 경사`);}
 assert.equal(L.points[0].y,G.startPlaza.y);assert.equal(L.points.at(-1).y,G.plaza.y);
});
test('도는 길: 닫힌 길, 구간 순서 백범광장 고리 → 오름 → 정상 고리 → 내림',()=>{
 assert.ok(C.closed);const f=C.points[0],l=C.points.at(-1);assert.ok(Math.hypot(f.x-l.x,f.z-l.z)<.01);
 const {startRing,up,summitRing,down}=C.legs;assert.ok(startRing[1]<up[0]&&up[1]<summitRing[0]&&summitRing[1]<down[0],JSON.stringify(C.legs));
 // 가장 급한 굽이 반지름 4m 이상(버스가 꺾이지 않게)
 let minR=1e9;for(let i=1;i<C.points.length-1;i++){const a=C.points[i-1],b=C.points[i],c=C.points[i+1],h1=Math.atan2(b.x-a.x,b.z-a.z),h2=Math.atan2(c.x-b.x,c.z-b.z);let d=Math.abs(h2-h1);if(d>Math.PI)d=2*Math.PI-d;if(d>1e-6)minR=Math.min(minR,(c.s-a.s)/2/d);}
 assert.ok(minR>=4,`가장 작은 굽은 반지름 ${minR.toFixed(1)}m`);
 // 전망탑 받침·화단(반지름 14.1m) + 버스 반폭에 닿지 않음
 for(const p of C.points)assert.ok(Math.hypot(p.x-NAMSAN.tower.x,p.z-NAMSAN.tower.z)>14.1+BUS.width/2+2);
});
test('정류장: 광장 안 고리 위, 버스 오른쪽(문 쪽)이 광장 가운데를 봄',()=>{
 for(const [k,P0] of [['start',G.startPlaza],['summit',G.plaza]]){const st=C.stops[k],m=courseAt(C.points,st.s);
  assert.ok(Math.hypot(m.x-P0.x,m.z-P0.z)<P0.r-2,`${k} 버스 자리가 광장 안`);
  assert.ok(((P0.x-m.x)*m.nx+(P0.z-m.z)*m.nz)>0,`${k} 문 쪽이 광장 가운데`);
  assert.ok(Math.hypot(st.x-P0.x,st.z-P0.z)<P0.r,`${k} 표지 자리가 광장 안`);
  assert.equal(st.y,P0.y);}
});
test('땅: 차로 가운데 땅 높이 = 차로 높이(±0.1m), 걷는 코스 높이는 그대로',()=>{
 for(let i=0;i<L.points.length;i+=7){const p=L.points[i];assert.ok(Math.abs(G.ground(p.x,p.z)-(p.y-.04))<.1||G.nearest(p.x,p.z).distance<12,`s ${p.s}: 땅 ${G.ground(p.x,p.z).toFixed(2)} 차로 ${p.y}`);}
 const D2={...data,busRoad:null},G0=createNamsanGround(D2);for(let i=0;i<G.points.length;i+=3){const p=G.points[i];assert.equal(G.ground(p.x,p.z),G0.ground(p.x,p.z),`코스 s ${p.s}`);}
});
test('버스: 치수·앉는 자리·길 위에 놓기',()=>{
 const bus=buildBus(),u=bus.userData;
 assert.equal(u.size.length,BUS.length);assert.ok(u.seats.length>=16);
 for(const s of u.seats){assert.ok(Math.abs(s.x)<BUS.width/2-.2);assert.ok(Math.abs(s.z)<BUS.length/2-.4);assert.equal(s.y,BUS.seatTop);}
 // 창턱이 앉은 동동이 머리 가운데(앉는 면 + 0.09 + 0.53)보다 낮아 창으로 보임
 assert.ok(BUS.sill<BUS.seatTop+.09+.53);
 placeOnLane(bus,C,C.stops.summit.s);assert.ok(Math.abs(bus.position.y-G.plaza.y)<.05);
 placeOnLane(bus,C,C.length+5);assert.ok(Number.isFinite(bus.position.x)); // 닫힌 길은 한 바퀴 넘어도 이어짐
});
test('밤 불빛(11-20): 툰 변환으로 재질을 갈아 끼워도 앞등·뒷등·창·번짐이 밤에 켜진다',()=>{
 const bus=buildBus();
 // toonify 흉내: 메시마다 재질을 복제본으로 바꾼다(같은 재질은 같은 복제본)
 const map=new Map();bus.traverse(o=>{if(!o.isMesh)return;const sw=m=>{if(!map.has(m))map.set(m,m.clone());return map.get(m);};o.material=Array.isArray(o.material)?o.material.map(sw):sw(o.material);});
 const get=n=>bus.getObjectByName(n);
 bus.userData.setNight(0);
 assert.ok(!get('버스 앞등 번짐').visible&&!get('버스 앞 빛 웅덩이').visible,'낮에는 번짐 숨김');
 const day=get('light').material.emissiveIntensity;
 bus.userData.setNight(1);
 assert.ok(get('light').material.emissiveIntensity>day+2,'앞등이 화면 재질에서 밝아짐');
 assert.ok(get('tail').material.emissiveIntensity>1.4,'뒷등');
 assert.ok(get('버스 유리').material.emissiveIntensity>.4,'창 불빛');
 for(const n of ['버스 앞등 번짐','버스 뒷등 번짐','버스 앞 빛 웅덩이']){const m=get(n);assert.ok(m.visible&&m.material.opacity>.2,n);assert.equal(m.material.blending,2,`${n} 더하기 섞기`);}
});
