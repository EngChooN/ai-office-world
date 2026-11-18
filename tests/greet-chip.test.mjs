// 사람 인사 칩·카드 표시 규칙(2026-11-18, 시안 docs/인사창/인사창-전후-시안-v1.html)
import test from 'node:test';
import assert from 'node:assert/strict';
import {GREET,createGreetModel,placeGreet} from '../src/greet-chip.js';

const P=(d,o={})=>({id:'b',name:'바다',d,ang:0,moving:false,partner:false,...o});
// sec초 동안 0.1초씩 같은 입력으로 돌리고 마지막 결과
function run(m,from,sec,input){let v;for(let t=0;t<=sec+1e-9;t+=.1)v=m.step({now:from+t,...input});return v;}

test('칩: 4m 안·앞 70° 안에서 보이고, 5.5m까지 남고, 그 밖이면 숨김',()=>{
 const m=createGreetModel();
 assert.equal(m.step({now:0,people:[P(4.5)]}).mode,'none','4.5m는 아직 안 뜸');
 assert.equal(m.step({now:.1,people:[P(3.8,{ang:80*Math.PI/180})]}).mode,'none','앞 70° 밖');
 assert.equal(m.step({now:.2,people:[P(3.8)]}).mode,'chip');
 assert.equal(m.step({now:.3,people:[P(5.4,{ang:2})]}).mode,'chip','5.5m 안이면 각도와 상관없이 남음(깜빡임 막기)');
 assert.equal(m.step({now:.4,people:[P(5.6)]}).mode,'none');
 assert.deepEqual([GREET.show,GREET.hide,Math.round(GREET.cone*180/Math.PI)],[4,5.5,70]);
});
test('칩은 가장 가까운 1명, 걷는 중이면 흐리게(펼치지 않음)',()=>{
 const m=createGreetModel();
 const v=m.step({now:0,people:[P(3.5,{id:'a',name:'하늘'}),P(2.5)]});assert.equal(v.id,'b');
 assert.equal(run(m,0,3,{people:[P(1.5)],meMoving:true}).mode,'dim','걷는 중엔 2m 안이어도 안 펼침');
});
test('2m 안에서 1초 멈추면 펼침 → 5초 무입력이면 접힘, 다시 저절로 펼치지 않음',()=>{
 const m=createGreetModel();
 assert.equal(m.step({now:0,people:[P(1.8)]}).mode,'chip');
 assert.equal(m.step({now:.9,people:[P(1.8)]}).mode,'chip');
 assert.equal(m.step({now:1.0,people:[P(1.8)]}).mode,'open');
 m.touch();assert.equal(m.step({now:5.9,people:[P(1.8)]}).mode,'open','5초 전');
 assert.equal(m.step({now:6.0,people:[P(1.8)]}).mode,'chip','5초 무입력이면 접힘');
 assert.equal(run(m,6.1,3,{people:[P(1.8)]}).mode,'chip','그대로 서 있으면 다시 안 펼침');
 // 움직였다가 다시 멈추면 다시 1초 뒤 펼침
 m.step({now:9.5,people:[P(1.8)],meMoving:true});
 assert.equal(m.step({now:9.6,people:[P(1.8)]}).mode,'chip');assert.equal(m.step({now:10.7,people:[P(1.8)]}).mode,'open');
});
test('펼친 카드는 3m 밖·걷기 시작·✕이면 접힘, 누르면 5초가 다시 시작',()=>{
 const far=createGreetModel();far.step({now:0,people:[P(1.5)]});far.step({now:1,people:[P(1.5)]});assert.equal(far.open,true);
 assert.equal(far.step({now:1.1,people:[P(3.1)]}).mode,'chip');
 const walk=createGreetModel();walk.step({now:0,people:[P(1.5)]});walk.step({now:1,people:[P(1.5)]});
 assert.equal(walk.step({now:1.1,people:[P(1.5)],meMoving:true}).mode,'dim');
 const x=createGreetModel();x.step({now:0,people:[P(1.5)]});x.step({now:1,people:[P(1.5)]});x.close();assert.equal(x.step({now:1.1,people:[P(1.5)]}).mode,'chip');
 const tap=createGreetModel();tap.step({now:0,people:[P(3.5)]});assert.equal(tap.tap(false),true,'칩 누르면 3.5m에서도 펼침');
 assert.equal(tap.step({now:.1,people:[P(2.9)]}).mode,'open');tap.step({now:4,people:[P(2.9)]});tap.touch();
 assert.equal(tap.step({now:8.9,people:[P(2.9)]}).mode,'open','누르면 5초 다시');assert.equal(tap.step({now:9.1,people:[P(2.9)]}).mode,'chip');
 const moving=createGreetModel();moving.step({now:0,people:[P(2)],meMoving:true});assert.equal(moving.tap(true),false,'걷는 중 누르면 인사만, 안 펼침');
});
test('동행 상대: 칩 없음, 둘 다 멈춘 뒤 2초 지나야 보임',()=>{
 const m=createGreetModel(),p=o=>[P(1.5,{partner:true,...o})];
 assert.equal(run(m,0,5,{people:p({moving:true}),meMoving:true}).mode,'none','둘 다 걷는 중');
 assert.equal(run(m,6,5,{people:p({moving:true})}).mode,'none','상대가 걷는 중');
 assert.equal(m.step({now:12,people:p()}).mode,'none');assert.equal(m.step({now:13.9,people:p()}).mode,'none');
 assert.notEqual(m.step({now:14,people:p()}).mode,'none','둘 다 멈춘 뒤 2초');
});
test('앉기·기구·창이 열리면(busy) 숨김',()=>{
 const m=createGreetModel();m.step({now:0,people:[P(2)]});assert.equal(m.step({now:.1,people:[P(2)],busy:true}).mode,'none');
});
test('자리: 칩은 이름표 오른쪽, 화면 끝이면 왼쪽 · 카드는 머리 위, 위가 막히면 옆 · 가로 휴대폰은 옆 먼저',()=>{
 const W=390,H=844,size={w:40,h:36},tag={x:150,y:270,w:60,h:22};
 const r=placeGreet('chip',tag,size,{W,H});assert.equal(r.side,'right');assert.ok(r.x>=tag.x+tag.w);
 const edge=placeGreet('chip',{...tag,x:W-70},size,{W,H});assert.equal(edge.side,'left');assert.ok(edge.x+edge.w<=W-70);
 const card={w:236,h:100};
 const up=placeGreet('card',tag,card,{W,H});assert.equal(up.side,'above');assert.ok(up.y+up.h<=tag.y);
 const blocked=placeGreet('card',tag,card,{W,H,avoid:[{x:0,y:0,w:W,h:260}]});assert.notEqual(blocked.side,'above');
 const land=placeGreet('card',{x:400,y:120,w:60,h:22},card,{W:844,H:390,prefer:'side'});assert.equal(land.side,'right');
 assert.ok(land.y>=8&&land.y+land.h<=390-8);
});
