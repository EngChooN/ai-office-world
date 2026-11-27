// 공 구멍 넣기 간판 종류 그림 — 월드아트 claw-ball-art.js에서 옮김(11-27 월드공통개발: 간판판 claw-machine-art.js와 순환 import를 피하려고 따로 둠)
export function drawBallGlyph(g,x,y,s,color){g.save();g.fillStyle=color;g.strokeStyle=color;g.lineWidth=s*.07;
 for(let j=0;j<2;j++)for(let i=0;i<3;i++){g.beginPath();g.arc(x-s*.28+i*s*.28,y+s*.08+j*s*.24,s*.07,0,Math.PI*2);g.fill();}
 g.beginPath();g.arc(x+s*.1,y-s*.26,s*.13,0,Math.PI*2);g.stroke();g.restore();}
