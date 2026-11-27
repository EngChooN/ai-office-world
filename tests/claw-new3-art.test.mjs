// 인형뽑기 새 기계 3종 그림 검사(월드아트 2026-11-27): 줄 자르기·공 구멍 넣기 기계 그림이 규칙서 v1 좌표와 같고, 바닥 넓이·서는 자리가 기존 기계와 같으며,
// 조작 카메라가 유리 밖에서 판정 자리를 가리지 않고 보는지, 불빛 쌓기 꾸밈이 월드공통개발 기계의 치수·카메라·자리를 바꾸지 않는지.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {MACHINES} from '../src/claw/claw-palette.js';
import {CLAW} from '../src/claw/claw-machine-art.js';
import {plushSize} from '../src/claw/claw-plush.js';
import {buildStringMachine,STRING,STRING_THEME,cutCamera} from '../src/claw/claw-string-art.js';
import {buildBallMachine,BALL,BALL_THEME,holeCenter,toLocal} from '../src/claw/claw-ball-art.js';
import {buildStackMachine,STACK} from '../src/claw/claw-stack.js';
import {dressStackMachine} from '../src/claw/claw-stack-art.js';

const near=(a,b,e=1e-6,msg)=>assert.ok(Math.abs(a-b)<=e,`${msg??''} ${a} ≈ ${b}`);
// 바닥 넓이: 꼭대기 장식·간판을 빼고 몸통이 집게 기계와 같은 네모 안(가게 자리·부딪힘이 그대로 맞음)
function footprint(root){const box=new THREE.Box3();root.updateMatrixWorld(true);
 root.traverse(o=>{if(!o.isMesh||o.userData.outline||o.isInstancedMesh)return;for(let p=o;p;p=p.parent)if(!p.visible)return;const b=new THREE.Box3().setFromObject(o);if(b.min.y>CLAW.height-.01)return;box.union(b);});return box;}
const fitsBody=(root,msg)=>{const b=footprint(root),hw=CLAW.width/2,hd=CLAW.depth/2;
 assert.ok(b.min.x>=-hw-.03&&b.max.x<=hw+.03,`${msg} 폭 ${b.min.x.toFixed(3)}~${b.max.x.toFixed(3)}`);
 assert.ok(b.min.z>=-hd-.025&&b.max.z<=hd+CLAW.panel.depth+.03,`${msg} 깊이 ${b.min.z.toFixed(3)}~${b.max.z.toFixed(3)}`);
 assert.ok(b.min.y>=-.001,`${msg} 바닥 아래로 안 나감`);};
// 카메라 → 보는 곳 선이 앞 유리(z = hd)를 유리 높이 안에서 지나는지(위 간판 상자·조작대에 안 가림)
const throughGlass=(pos,look,msg)=>{const hd=CLAW.depth/2;assert.ok(pos[2]>hd+.05,`${msg} 카메라가 유리 밖`);
 const k=(pos[2]-hd)/(pos[2]-look[2]),y=pos[1]+(look[1]-pos[1])*k;assert.ok(y<CLAW.glassTop-.01&&y>CLAW.floorY,`${msg} 유리 앞을 ${y.toFixed(3)}m에서 지남`);};

test('줄 자르기: 줄 자리 = 규칙서 좌표(안 폭 0.60·줄 0.22·0.42), 레일이 가위 범위(0.04~0.56)를 덮음, 인형 둘이 깊이로 떨어져 있음',()=>{
 near(STRING.inner,.6);assert.deepEqual([...STRING.strings],[.22,.42]);
 assert.ok(STRING.rail.u0<=.04&&STRING.rail.u1>=.56,'레일 범위');
 const g=buildStringMachine(),U=g.userData;assert.equal(U.kind,'string');
 U.spots.strings.forEach((p,i)=>{near(p.x,STRING.toX(STRING.strings[i]),1e-9,'줄 x');});
 assert.ok(Math.abs(STRING.depth[0]-STRING.depth[1])>=.25,'큰 인형 둘이 앞뒤로 25cm 넘게 떨어짐');
 for(const u of [.04,.3,.56]){U.setBlade({u});near(g.getObjectByName('가위').position.x,STRING.toX(u),1e-9,'가위 x');}
 for(const s of U.spots.strings)assert.ok(Math.abs(s.x)<CLAW.width/2-.08,'걸이가 유리 안');
 fitsBody(g,'줄 자르기');
});
test('줄 자르기: 흔들림 dx를 넣으면 자르는 높이에서 줄이 정확히 dx만큼 비킴, 인형은 유리·쿠션 안',()=>{
 const g=buildStringMachine(),U=g.userData;g.updateMatrixWorld(true);
 for(const i of [0,1])for(const dx of [-.0575,-.003,0,.02,.0575]){U.setString(i,{dx});g.updateMatrixWorld(true);
  const pend=g.getObjectByName(`줄 ${i+1}`),p=new THREE.Vector3(0,-(STRING.hangY-STRING.cutY),0).applyMatrix4(pend.matrix);
  near(p.x-pend.position.x,dx,1e-9,`줄 ${i+1} dx ${dx}`);}
 // 가장 크게 흔들려도(진폭 5cm × 1.15) 인형 가운데가 유리 안쪽, 인형 발은 쿠션 위
 const [a,b]=STRING_THEME.prizes;[a,b].forEach((id,i)=>{const sw=.0575*U.lever(i),x=STRING.toX(STRING.strings[i]);
  assert.ok(Math.abs(x)+sw<CLAW.width/2-.1,`인형 ${i+1} 흔들림 ${sw.toFixed(3)}m`);assert.ok(U.lever(i)<1.6,'인형 흔들림이 자르는 곳의 1.6배 아래');
  assert.ok(STRING.tie[i]-plushSize(id)>CLAW.floorY+.045,`인형 ${i+1} 발이 쿠션 위`);});
});
test('줄 자르기: 끊으면 인형이 떨어져 쿠션에 앉고 onLanded, 다음 판에 제자리 · 아까움 자국 · 직원 팔',()=>{
 const g=buildStringMachine(),U=g.userData;const landed=[];U.onLanded=(i,p)=>landed.push([i,p?.userData.plushId]);
 U.setString(1,{dx:.001});U.cutString(1);for(let k=0;k<120;k++)U.update(1/60);
 assert.deepEqual(landed,[[1,STRING_THEME.prizes[1]]]);
 const prize=U.prizes[1];g.updateMatrixWorld(true);const bb=new THREE.Box3().setFromObject(prize);
 assert.ok(bb.min.y>CLAW.floorY&&bb.min.y<CLAW.floorY+.12,`떨어진 인형 바닥 ${bb.min.y.toFixed(3)}`);
 U.nickString(0);assert.ok(g.getObjectByName('줄 1').getObjectByName('반쯤 잘린 자국').visible);
 U.setStaff(true);for(let k=0;k<60;k++)U.update(1/60);const arm=g.getObjectByName('직원 팔 1');assert.ok(arm.visible,'직원 팔 내려옴');
 U.resetStrings();g.updateMatrixWorld(true);
 assert.equal(U.prizes[1].parent.parent.name,'줄 2','인형이 다시 줄에');assert.ok(!g.getObjectByName('줄 1').getObjectByName('반쯤 잘린 자국').visible);
 assert.ok(!arm.visible,'직원 팔 올라감');
});
test('줄 자르기 카메라: 전체·자르기(2.2배) 모두 유리 밖에서 칼날 높이를 봄, 자르기는 더 가까움',()=>{
 for(const P of [STRING.camera,STRING.camera.portrait])throughGlass(P.pos,P.look??STRING.camera.look,'전체');
 for(const u of [.04,.22,.42,.56])for(const portrait of [false,true]){const c=cutCamera(u,{portrait});throughGlass(c.pos,c.look,`자르기 u ${u}`);
  const full=portrait?STRING.camera.portrait:STRING.camera,d=Math.hypot(...c.pos.map((v,k)=>v-c.look[k])),d0=Math.hypot(...full.pos.map((v,k)=>v-(full.look??STRING.camera.look)[k]));
  const t=f=>Math.tan(f*Math.PI/360);near((d0/d)*(t(full.fov)/t(c.fov)),STRING.zoom,.25,'거리 × 화각 ≈ 2.2배');}
});
test('공 구멍 넣기: 구멍 자리·크기 = 규칙서(4×4·간격 6cm·구멍 2.1cm·희귀 1.6cm), 공이 희귀 구멍에도 들어감, 판이 벽 안',()=>{
 assert.equal(BALL.n,4);near(BALL.pitch,.06);near(BALL.holeR,.021);near(BALL.rareHoleR,.016);near(BALL.ballR,.013);
 assert.ok(BALL.ballR<BALL.rareHoleR,'공 < 희귀 구멍');
 for(let j=0;j<4;j++)for(let i=0;i<4;i++){const [x,z]=holeCenter(i,j);assert.ok(Math.abs(x)+BALL.holeR<BALL.half&&Math.abs(z)+BALL.holeR<BALL.half,'구멍이 판 안');}
 near(holeCenter(0,0)[0],-.09);near(holeCenter(3,3)[1],.09);
 const g=buildBallMachine(),U=g.userData;assert.equal(U.kind,'ball');
 assert.equal(Object.keys(U.holes.holes).length,3);assert.equal(U.holes.rare,'3,0');assert.equal(U.holes.holes['3,0'],BALL_THEME.holes['3,0']);
 assert.equal(Object.keys(U.prizes).length,3,'경품 단 인형 셋');U.setPity(true);assert.ok(U.prizes[BALL_THEME.pityHole],'도움 구멍 경품');U.setPity(false);assert.ok(!U.prizes[BALL_THEME.pityHole]);
 fitsBody(g,'공 구멍 넣기');
});
test('공 구멍 넣기: 집게·그림자 점·공·표시 고리가 판 좌표 그대로',()=>{
 const g=buildBallMachine(),U=g.userData;g.updateMatrixWorld(true);
 const [x,z]=holeCenter(2,1);U.claw.set({x,z,has:true});const dot=U.claw.dot.position;near(dot.x,toLocal(x,z).x);near(dot.z,toLocal(x,z).z);near(dot.y,BALL.board.top,.002);
 const head=g.getObjectByName('집게 공');g.updateMatrixWorld(true);const hp=head.getWorldPosition(new THREE.Vector3());
 near(hp.x,toLocal(x,z).x,1e-6,'집게 공 x');near(hp.y,BALL.board.top+BALL.carryH,1e-6,'든 높이');
 U.setBall({x,z,h:0});near(U.ball.position.y,BALL.board.top+BALL.ballR,1e-9,'판 위 공');U.setBall({x,z,sink:1});assert.ok(U.ball.position.y<BALL.board.top+BALL.ballR*.5,'구멍 안으로');
 U.markHole('3,0','near');const m=g.getObjectByName('구멍 표시');assert.ok(m.visible);near(m.position.x,toLocal(...holeCenter(3,0)).x);U.markHole(null);assert.ok(!m.visible);
 for(const P of [BALL.camera,BALL.camera.portrait])throughGlass(P.pos,P.look,'공 카메라');
 // 55° 안팎으로 내려다봄(규칙서)
 for(const P of [BALL.camera,BALL.camera.portrait]){const a=Math.atan2(P.pos[1]-P.look[1],P.pos[2]-P.look[2])*180/Math.PI;assert.ok(a>45&&a<60,`내려다보는 각 ${a.toFixed(0)}°`);}
});
test('불빛 쌓기 꾸밈: 월드공통개발 기계의 치수·카메라·자리·판 상태를 바꾸지 않고 별·줄 불을 더함, 불빛 상태를 따라감',()=>{
 const M=MACHINES.find(m=>m.kind==='stack');assert.ok(M,'stack 기계');
 const g=buildStackMachine(M),before={cam:g.userData.camera,spots:JSON.stringify(g.userData.spots),h:g.userData.height};
 dressStackMachine(g);const U=g.userData;
 assert.ok(U.dressed);assert.equal(U.camera,before.cam);assert.equal(JSON.stringify(U.spots),before.spots);assert.equal(U.height,before.h);
 dressStackMachine(g);assert.equal(g.children.filter(o=>o.name==='별빛 탑 꾸밈').length,1,'두 번 불러도 한 번만');
 near(U.crown.position.y,STACK.height,1e-9,'별은 간판 상자 위');
 U.setBoard({rows:[{x:2,w:3}],cur:{x:1,w:3,r:2}});U.setLights('win');for(let k=0;k<10;k++)U.update(1/30);U.setLights('off');U.update(1/30);
 assert.equal(U.board.rows.length,1,'판 상태 그대로');
 fitsBody(g,'불빛 쌓기');
});
test('단계 그림(LOD): 새 기계도 attachLod로 중간·먼 그림이 만들어지고 다시 자세히로 돌아옴',async()=>{
 const {attachLod}=await import('../src/claw/claw-machine-lod.js');
 for(const g of [buildStringMachine(),buildBallMachine(),dressStackMachine(buildStackMachine(MACHINES.find(m=>m.kind==='stack')))]){
  attachLod(g,{});for(const l of [1,2,0,2])g.userData.setLod(l);g.userData.update(1/30);}
});
test('줄 자르기 줄(11-27 보정): ② 다가간 카메라에서 짙은 심이 휴대폰 세로·가로·PC 모두 3px(테 포함 5.5px) 넘게, 밝은 테로 둘러 뒷벽·인형 앞 모두 또렷',()=>{
 const g=buildStringMachine(),U=g.userData,lum=c=>{const k=new THREE.Color(c);return .2126*k.r+.7152*k.g+.0722*k.b;};
 const core=U.mats.rope.color,pend=g.getObjectByName('줄 1');
 assert.ok(lum(core)<.06,`심 밝기 ${lum(core).toFixed(3)}`);
 const halos=[];g.traverse(o=>{if(o.name==='줄 테')halos.push(o);});assert.equal(halos.length,4,'줄 2개 × 위·아래 토막');
 for(const h of halos){assert.ok(h.material.isMeshBasicMaterial&&h.material.side===THREE.BackSide&&lum(h.material.color)>.85,'테 = 밝은 뒷면');}
 assert.ok(STRING.rope.halo>STRING.rope.r+.001,'테가 심보다 1mm 넘게 굵음');
 assert.ok(pend.getObjectByName('반쯤 잘린 자국').geometry.parameters.radius-.0022>STRING.rope.halo,'아까움 자국이 테 바깥');
 // 화면 높이 H px, 세로 fov에서 줄 굵기(px) = 2r ÷ (2·거리·tan(fov/2)) × H
 for(const [W,H,portrait] of [[390,844,true],[844,390,false],[1280,720,false]])for(const i of [0,1]){const u=STRING.strings[i],c=cutCamera(u,{portrait});
  const p=new THREE.Vector3(STRING.toX(u),STRING.cutY,STRING.depth[i]),d=p.distanceTo(new THREE.Vector3(...c.pos));
  const k=H/(2*d*Math.tan(c.fov*Math.PI/360)),px=2*STRING.rope.r*k,ph=2*STRING.rope.halo*k;
  assert.ok(px>=3&&ph>=5.5,`${W}×${H} 줄 ${i+1} 심 ${px.toFixed(1)}px·테 ${ph.toFixed(1)}px`);}
 near(STRING.rope.r*2,.006,1e-9,'심 굵기 = 괄호 사이 6mm');
 U.cutString(0);U.resetStrings();near(halos[0].scale.y,STRING.hangY-STRING.cutY,1e-9,'다음 판 위 토막 테 길이');
});
