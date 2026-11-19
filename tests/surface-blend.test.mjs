import test from 'node:test';import assert from 'node:assert/strict';
import * as THREE from 'three';
import {ribbon,densifyRoute,SURFACE_OVERLAP_METRES} from '../assets/realistic/load-landscape.js';

// 11-19: 실사 지형·노면 셰이더(terrain-material.js) 검사 3개는 그 파일과 함께 지움. 노면 리본 겹침(카툰도 씀)은 그대로.
test('계단이 아닌 노면 전환은 뒤 노면을 1.6m 겹쳐 깔고 계단 전환은 겹치지 않는다',()=>{
 const line=(materials)=>densifyRoute(materials.map((material,i)=>({x:0,z:i*10,y:100,s:i*10,width:2,material})));
 const group=ribbon(line(['soil','soil','ridge','ridge']),new THREE.MeshStandardMaterial(),1);
 const [soil,ridge]=group.children;
 const entries=ridge.geometry.getAttribute('trailEntry'),position=ridge.geometry.getAttribute('position');
 const zs=Array.from({length:position.count},(_,i)=>position.getZ(i));
 const first=Math.min(...zs);assert.ok(first>=20-SURFACE_OVERLAP_METRES-1e-6&&first<=20-SURFACE_OVERLAP_METRES+.5,'전환점 1.6m 안쪽 마지막 점부터 깐다(점 간격 0.5m)');
 for(let i=0;i<position.count;i++){
  const z=position.getZ(i),e=entries.getX(i);
  if(z>=20-1e-6){assert.equal(e,1);assert.ok(Math.abs(position.getY(i)-100.015)<1e-4);}
  else {assert.ok(e<1&&e>=0);assert.ok(Math.abs(position.getY(i)-100.019)<1e-4,'겹침 구간은 4mm 위');}
 }
 assert.ok(Array.from(soil.geometry.getAttribute('trailEntry').array).every(e=>e===1));
 const stairs=ribbon(line(['soil','soil','stairs','stairs','rock','rock']),new THREE.MeshStandardMaterial({side:THREE.DoubleSide}),1);
 const rock=stairs.children.at(-1),rockZ=Array.from({length:rock.geometry.getAttribute('position').count},(_,i)=>rock.geometry.getAttribute('position').getZ(i));
 assert.ok(Math.min(...rockZ)>=40-1e-6,'계단 뒤 노면은 계단 위로 겹치지 않는다');
 group.traverse(o=>o.geometry?.dispose());stairs.traverse(o=>o.geometry?.dispose());
});

