// 줄 자르기 간판 종류 그림(가위) — 월드아트 claw-string-art.js에서 옮김(11-27 월드공통개발: 간판판 claw-machine-art.js가 부를 때 서로 부르기(순환 import)를 피하려고 따로 둠)
export function drawStringGlyph(g,x,y,s,color){g.save();g.strokeStyle=color;g.fillStyle=color;g.lineWidth=s*.1;g.lineCap='round';
 g.beginPath();g.arc(x-s*.2,y+s*.24,s*.13,0,Math.PI*2);g.stroke();g.beginPath();g.arc(x+s*.2,y+s*.24,s*.13,0,Math.PI*2);g.stroke();
 g.beginPath();g.moveTo(x-s*.12,y+s*.14);g.lineTo(x+s*.22,y-s*.36);g.moveTo(x+s*.12,y+s*.14);g.lineTo(x-s*.22,y-s*.36);g.stroke();g.restore();}
