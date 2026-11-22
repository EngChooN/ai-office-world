import {test} from 'node:test';
import assert from 'node:assert/strict';
import {namsanRockNoise,namsanRockValue,NAMSAN_ROCK_CLEAR} from '../src/namsan/namsan-rock-mask.js';
import {namsanGrassGround} from '../src/namsan/namsan-art.js';

test('남산 암반 무늬는 같은 자리에서 일정하고 경사와 고도에 따라 막힌다',()=>{
 const n=namsanRockNoise(3409,-9555);assert.ok(Math.abs(n-.5609)<.002);assert.equal(n,namsanRockNoise(3409,-9555));
 assert.ok(namsanRockValue(3409,-9555,190,.5)>NAMSAN_ROCK_CLEAR);
 assert.ok(namsanRockValue(3409,-9555,190,0)<NAMSAN_ROCK_CLEAR);
 assert.ok(namsanRockValue(3409,-9555,650,0)>NAMSAN_ROCK_CLEAR);
});
test('남산 풀 막힘은 가로등 받침과 암반을 비운다',()=>{
 const G={ground:()=>190,park:()=>true,plaza:{x:100,z:100,r:1},startPlaza:{x:-100,z:-100,r:1},nearest:()=>({index:0,distance:20}),points:[{},{}]};
 const surface=()=>190;surface.slope=(x)=>x>2?.5:0;
 const ground=namsanGrassGround(G,{surface,rockMask:true,lamps:[{x:0,z:0}]});
 assert.equal(ground.blocked(0,0),true);assert.equal(ground.blocked(1,0),false);assert.equal(ground.blocked(3,0),true);assert.equal(ground.blocked(1.9,0,.32),true);
});
