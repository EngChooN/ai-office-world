import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyNamsanStairs,NAMSAN_STAIR_GRADE,NAMSAN_STAIR_MIN_RUN} from '../src/namsan/namsan-stairs-classify.js';
import {namsanStairSteps} from '../src/namsan/namsan-stair-steps.js';
import {stairRuns} from '../src/namsan/namsan-walk.js';
import {courseAt,NAMSAN} from '../src/namsan/namsan-data.js';
const data=JSON.parse(readFileSync('assets/shared/namsan/course.json','utf8')),P=data.points;
test('계단 표시는 원본과 고도에서 재현되며 좌표와 높이는 보존된다',()=>{
 const p=structuredClone(P),before=p.map(({x,z,y,s})=>({x,z,y,s}));classifyNamsanStairs(p);assert.deepEqual(p,P);assert.deepEqual(p.map(({x,z,y,s})=>({x,z,y,s})),before);
 for(let i=0;i<p.length-1;i++)if(p[i].stairs)assert.ok((p[i+1].y-p[i].y)/(p[i+1].s-p[i].s)>=NAMSAN_STAIR_GRADE-1e-9);
 for(const s of [59,63.3,67.5,963,978.2,999.2,1027.2])assert.equal(courseAt(p,s+.01).stairs,false,`${s}m`);
 for(const r of stairRuns({points:p}))assert.ok(r.s1-r.s0>=NAMSAN_STAIR_MIN_RUN);
});
test('각 단의 높이는 일정하고 걸음에 쓰는 단 수와 일치한다',()=>{
 const runs=stairRuns({points:P});for(const r of runs){const steps=namsanStairSteps(P,r);assert.equal(steps.length,r.steps);assert.ok((r.y1-r.y0)/r.steps<=NAMSAN.riser+.015);
  assert.ok(Math.abs(steps[0].sA-r.s0)<1e-7&&Math.abs(steps.at(-1).sB-r.s1)<1e-7);
  for(let i=0;i<steps.length;i++){const t=steps[i];assert.ok(t.depth>0);if(i){assert.ok(Math.abs(t.sA-steps[i-1].sB)<1e-7);assert.ok(t.top-steps[i-1].top<=NAMSAN.riser+.015);}}
 }
});
