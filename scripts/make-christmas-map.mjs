// 크리스마스 넓힌 광장(시안 B) 바로 가기 지도 그림(월드아트, 2026-11-17 5차): node scripts/make-christmas-map.mjs
// 결과 public/christmas/map/plaza-map-b.svg — 배경 그림만(핀·내 자리·다른 사람 점은 월드개발 travel-ui.js가 그 위에 올림).
// 좌표: viewBox = 월드개발 travel.js mapBounds()의 세계 좌표(1 = 1m, 오른쪽 = +x 동쪽, 아래 = +z 남쪽). 화면 % = (x − x0)/(x1 − x0), (z − z0)/(z1 − z0).
// 배치 값은 모두 layout.js·festive-layout.js(?look=festive-b)·sled-course.js·gondola.js에서 읽는다 → 배치가 바뀌면 이 스크립트만 다시 돌리면 된다.
import {writeFileSync,mkdirSync} from 'node:fs';
globalThis.location={search:'?look=festive-b'};
const L=await import('../src/christmas/layout.js');
const F=await import('../src/christmas/festive-layout.js');
const {SKELETON}=await import('../src/christmas/sled-course.js');
const {mapBounds}=await import('../src/christmas/travel.js');
const B=mapBounds(),W=B.x1-B.x0,D=B.z1-B.z0;
const X=x=>+(x-B.x0).toFixed(2),Z=z=>+(z-B.z0).toFixed(2);
const K=F.PLAZA_B;
// 결정적 난수(숲 자리)
let seed=17;const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const out=[];const add=s=>out.push(s);
const C={snow:'#eef3fa',snow2:'#e2eaf5',hill:'#dbe5f1',hill2:'#cbd8ea',course:'#f7fbff',courseEdge:'#b6c6dc',fence:'#a87a52',plaza:'#ecdcbd',plazaEdge:'#b9996a',ring:'#dcc79f',
 pine:'#2f7a52',pineD:'#1f5c3f',wood:'#b07a4a',woodD:'#7d5232',roof:'#f4f7fb',red:'#c23a32',gold:'#e9b949',ice:'#bfe3f5',iceD:'#6fa9cc',ink:'#4a3618'};

add(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${D}" width="${W*8}" height="${D*8}" data-x0="${B.x0}" data-x1="${B.x1}" data-z0="${B.z0}" data-z1="${B.z1}">`);
add(`<title>눈마을 광장 바로 가기 지도(시안 B) — 1칸 = 1m, x ${B.x0}~${B.x1}, z ${B.z0}~${B.z1}</title>`);
add(`<defs><pattern id="sn" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1.2" cy="1.5" r=".35" fill="#fff"/><circle cx="4.3" cy="4.6" r=".25" fill="#fff"/></pattern>
<linearGradient id="hl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.hill2}"/><stop offset="1" stop-color="${C.hill}"/></linearGradient>
<radialGradient id="pl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f6ead1"/><stop offset="1" stop-color="${C.plaza}"/></radialGradient></defs>`);
// 바탕 눈 + 반짝임
add(`<rect width="${W}" height="${D}" fill="${C.snow}"/><rect width="${W}" height="${D}" fill="url(#sn)" opacity=".8"/>`);
// 북쪽 썰매 산(열린 곳 |x| < gapX, 지도 위 끝까지)
{const g=L.BOUNDS.gapX,zb=-L.PLAZA.fence*.62;add(`<path d="M${X(-g)} 0H${X(g)}V${Z(zb-6)}Q${X(g*.55)} ${Z(zb+3)} ${X(0)} ${Z(zb+4)}Q${X(-g*.55)} ${Z(zb+3)} ${X(-g)} ${Z(zb-6)}z" fill="url(#hl)"/>`);}
// 썰매 길(오늘 코스의 가운데 뼈대, 지도 안 부분만): 굵은 흰 띠 + 가는 테두리
{const pts=SKELETON.filter((p,i)=>i%2===0&&p.z>B.z0-3).map(p=>`${X(p.x)},${Z(p.z)}`);
 if(pts.length>1){add(`<polyline points="${pts.join(' ')}" fill="none" stroke="${C.courseEdge}" stroke-width="4.6" stroke-linejoin="round" stroke-linecap="round"/>`);
  add(`<polyline points="${pts.join(' ')}" fill="none" stroke="${C.course}" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round"/>`);}
 // 멈춤 구역(썰매 끝)
 const s=L.SLED_RUN.stop;add(`<circle cx="${X(s.x)}" cy="${Z(s.z)}" r="${s.r}" fill="${C.course}" stroke="${C.courseEdge}" stroke-width=".6"/>`);}
// 숲(울타리 밖, 산 옆) — 작은 전나무
{const trees=[];for(let i=0;i<260;i++){const x=B.x0+rnd()*W,z=B.z0+rnd()*D,r=Math.hypot(x,z);
  if(r<L.PLAZA.fence+2.5)continue;if(z<-24&&Math.abs(x)<L.BOUNDS.gapX+2)continue;trees.push([x,z,1.3+rnd()*1.1]);}
 trees.sort((a,b)=>a[1]-b[1]);for(const [x,z,s] of trees)add(`<path d="M${X(x)} ${Z(z)-s*1.5}l${s} ${s*1.9}h${-s*2}z" fill="${rnd()<.5?C.pine:C.pineD}"/>`);}
// 마을 울타리(반지름 fence, 북쪽 열린 곳은 비움)
{const r=L.PLAZA.fence,g=L.BOUNDS.gapX,a0=Math.asin(g/r);// 북쪽(−z) 양옆 끝 각도
 const pt=a=>`${X(Math.sin(a)*r)} ${Z(Math.cos(a)*r)}`;// a: atan2(x, z) 규칙(0 = 남쪽)
 add(`<path d="M${pt(Math.PI-a0)}A${r} ${r} 0 1 1 ${pt(-(Math.PI-a0))}" fill="none" stroke="${C.fence}" stroke-width=".7" stroke-dasharray="1.6 1" stroke-linecap="round"/>`);}
// 입구 길(남쪽) + 빛 터널 아치 3개
{const E=L.ENTRANCE;add(`<rect x="${X(-E.w/2)}" y="${Z(E.z)}" width="${E.w}" height="${D-Z(E.z)}" fill="${C.snow2}"/>`);
 for(let k=0;k<3;k++){const z=E.z+2.4+k*2;add(`<path d="M${X(-3.4)} ${Z(z)}h6.8" stroke="${C.gold}" stroke-width=".55" stroke-dasharray=".2 .7" stroke-linecap="round"/>`);}}
// 다져진 눈길(마당·회전목마·링크 가는 길)
for(const [[x0,z0],[x1,z1]] of K.paths)add(`<path d="M${X(x0)} ${Z(z0)}L${X(x1)} ${Z(z1)}" stroke="${C.snow2}" stroke-width="2.4" stroke-linecap="round"/>`);
// 광장 돌바닥 + 둘레 길 + 전구 줄(트리에서 8갈래)
{const r=L.PLAZA.radius;add(`<circle cx="${X(0)}" cy="${Z(0)}" r="${r}" fill="url(#pl)" stroke="${C.plazaEdge}" stroke-width=".7"/>`);
 add(`<circle cx="${X(0)}" cy="${Z(0)}" r="${r-1.6}" fill="none" stroke="${C.ring}" stroke-width=".5" stroke-dasharray="2 1.2"/>`);
 for(const [lx,lz] of L.LAMPS)add(`<path d="M${X(0)} ${Z(0)}L${X(lx)} ${Z(lz)}" stroke="${C.gold}" stroke-width=".25" stroke-dasharray=".35 .8" opacity=".9"/>`);}
// 눈사람 마당 · 눈싸움 마당(서버 판정 경계 그대로)
for(const [Y,kind] of [[L.SNOWMAN_YARD,'man'],[L.SNOWBALL_YARD,'fight']]){
 add(`<rect x="${X(Y.x-Y.w/2)}" y="${Z(Y.z-Y.d/2)}" width="${Y.w}" height="${Y.d}" rx="1.6" fill="#fbfdff" stroke="#9fb4cf" stroke-width=".55" stroke-dasharray="1.2 .7"/>`);
 if(kind==='fight')for(const [wx,wz,len,ry] of Y.walls??[])add(`<rect x="${X(wx-len/2)}" y="${Z(wz-.35)}" width="${len}" height=".7" rx=".35" fill="#cfdbea" transform="rotate(${(-ry*180/Math.PI).toFixed(1)} ${X(wx)} ${Z(wz)})"/>`);}
// 가림 눈벽
{const d=L.DIVIDER;add(`<rect x="${X(d.x-.35)}" y="${Z(d.z0)}" width=".7" height="${d.z1-d.z0}" rx=".35" fill="#cfdbea"/>`);}
// 노점(광장 둘레, 지붕 색 줄무늬)
for(const [deg] of [[40],[-40],[64],[-62],[120],[-120],[-142]]){const a=deg*Math.PI/180,x=Math.sin(a)*K.stallR,z=Math.cos(a)*K.stallR;
 add(`<g transform="translate(${X(x)} ${Z(z)}) rotate(${(-deg).toFixed(1)})"><rect x="-1.35" y="-.8" width="2.7" height="1.6" rx=".25" fill="${C.wood}" stroke="${C.woodD}" stroke-width=".25"/><path d="M-1.35 -.8h2.7" stroke="${C.red}" stroke-width=".55" stroke-dasharray=".45 .45"/></g>`);}
// 집(앞문이 트리를 봄 = 그림의 위쪽): 위에서 본 눈 덮인 박공지붕(가운데 용마루) + 굴뚝 + 앞 처마의 따뜻한 창빛
for(const [x,z,,s=1] of L.HOUSES){const h=L.houseHeading(x,z)*180/Math.PI,w=4.6*s,d=3.8*s;
 add(`<g transform="translate(${X(x)} ${Z(z)}) rotate(${(180-h).toFixed(1)})"><rect x="${-w/2}" y="${-d/2}" width="${w}" height="${d}" rx=".35" fill="${C.wood}" stroke="${C.woodD}" stroke-width=".3"/><rect x="${-w/2+.25}" y="${-d/2+.25}" width="${w-.5}" height="${d-.5}" rx=".25" fill="${C.roof}"/><path d="M${-w/2+.25} 0h${w-.5}" stroke="#b9c8de" stroke-width=".35"/><rect x="${w*.2}" y="${d*.08}" width=".75" height=".75" fill="#9a5b46"/><path d="M${-w*.18} ${-d/2-.05}h${w*.36}" stroke="#ffcf7a" stroke-width=".45" stroke-linecap="round"/></g>`);}
// 가로등(금빛 점)
for(const [x,z] of L.LAMPS)add(`<circle cx="${X(x)}" cy="${Z(z)}" r=".55" fill="${C.gold}" stroke="${C.ink}" stroke-width=".2"/>`);
// 빛 선물상자
{const g=K.giftBox;add(`<rect x="${X(g.x)-1.1}" y="${Z(g.z)-1.1}" width="2.2" height="2.2" rx=".2" fill="#fff6dc" stroke="${C.red}" stroke-width=".35"/><path d="M${X(g.x)} ${Z(g.z)-1.1}v2.2M${X(g.x)-1.1} ${Z(g.z)}h2.2" stroke="${C.red}" stroke-width=".3"/>`);}
// 아이스링크(얼음 + 울타리 + 가운데 섬 + 문)
{const R=F.RINK;add(`<rect x="${X(R.x-R.w/2)}" y="${Z(R.z-R.d/2)}" width="${R.w}" height="${R.d}" rx="${R.corner}" fill="${C.ice}" stroke="${C.red}" stroke-width=".45"/>`);
 add(`<ellipse cx="${X(R.x)}" cy="${Z(R.z)}" rx="${R.w*.33}" ry="${R.d*.3}" fill="none" stroke="#fff" stroke-width=".3" opacity=".8"/>`);
 add(`<circle cx="${X(R.island.x)}" cy="${Z(R.island.z)}" r="${R.island.r}" fill="#fbfdff" stroke="${C.iceD}" stroke-width=".25"/>`);
 const g=R.gate;add(`<path d="M${X(g.x)} ${Z(g.z-g.w/2)}v${g.w}" stroke="${C.gold}" stroke-width=".7"/>`);}
// 회전목마(빨강·흰 부채꼴 지붕을 위에서 본 모양) + 타는 계단
{const c=F.CAROUSEL,r=c.R+.35,n=16,seg=[];for(let k=0;k<n;k++){const a0=k/n*Math.PI*2,a1=(k+1)/n*Math.PI*2;
  seg.push(`<path d="M${X(c.x)} ${Z(c.z)}L${X(c.x+Math.sin(a0)*r)} ${Z(c.z+Math.cos(a0)*r)}A${r} ${r} 0 0 0 ${X(c.x+Math.sin(a1)*r)} ${Z(c.z+Math.cos(a1)*r)}z" fill="${k%2?'#fff6ee':C.red}"/>`);}
 add(`<circle cx="${X(c.x)}" cy="${Z(c.z)}" r="${c.baseR}" fill="${C.woodD}"/>`+seg.join('')+`<circle cx="${X(c.x)}" cy="${Z(c.z)}" r="${r}" fill="none" stroke="${C.gold}" stroke-width=".45"/><circle cx="${X(c.x)}" cy="${Z(c.z)}" r=".8" fill="${C.gold}"/>`);
 const a=c.step.a;add(`<path d="M${X(c.x+Math.sin(a)*(c.baseR+.1))} ${Z(c.z+Math.cos(a)*(c.baseR+.1))}L${X(c.x+Math.sin(a)*(c.baseR+.7))} ${Z(c.z+Math.cos(a)*(c.baseR+.7))}" stroke="${C.wood}" stroke-width="1.8"/>`);}
// 케이블카: 줄(지도 위 끝까지) · 중간 탑 · 마을 승강장
{const G0=L.TARGETS.gondolaBase,T=L.TARGETS.gondolaTop,mid={x:2,z:-52};
 const t=(B.z0-G0.z)/(T.z-G0.z),ex=G0.x+(T.x-G0.x)*Math.min(1,t),ez=Math.max(B.z0,T.z);
 add(`<path d="M${X(G0.x)} ${Z(G0.z)}L${X(ex)} ${Z(ez)}" stroke="#6d6a7c" stroke-width=".45" stroke-dasharray="1.4 .8"/>`);
 add(`<rect x="${X(mid.x)-.8}" y="${Z(mid.z)-.8}" width="1.6" height="1.6" fill="#6d6a7c"/>`);
 add(`<rect x="${X(G0.x)-2.6}" y="${Z(G0.z)-2}" width="5.2" height="4" rx=".6" fill="#fbfdff" stroke="#6d6a7c" stroke-width=".4"/><rect x="${X(G0.x)-1.2}" y="${Z(G0.z)-.9}" width="2.4" height="1.8" rx=".4" fill="#4f86d9"/>`);}
// 모닥불 · 우체통 · 카드 판
{const c=L.CAMPFIRE;add(`<circle cx="${X(c.x)}" cy="${Z(c.z)}" r="${c.logR+.3}" fill="#f3e2c2" stroke="${C.woodD}" stroke-width=".6" stroke-dasharray="1.1 .5"/><circle cx="${X(c.x)}" cy="${Z(c.z)}" r="${c.stoneR}" fill="#ffb347" stroke="#ff6a2a" stroke-width=".3"/>`);}
{const m=L.MAILBOX;add(`<rect x="${X(m.x)-.5}" y="${Z(m.z)-.6}" width="1" height="1.2" rx=".3" fill="${C.red}" stroke="${C.ink}" stroke-width=".2"/>`);
 const b=L.CARD_BOARD;add(`<rect x="${X(b.x)-.9}" y="${Z(b.z)-.25}" width="1.8" height=".5" fill="${C.wood}" transform="rotate(${(-b.heading*180/Math.PI).toFixed(1)} ${X(b.x)} ${Z(b.z)})"/>`);}
// 트리(가운데, 위에서 본 별 모양 전나무)
{const t=L.TREE,pts=[];for(let i=0;i<16;i++){const a=i/16*Math.PI*2,r=i%2?1.7:3;pts.push(`${(X(t.x)+Math.sin(a)*r).toFixed(2)},${(Z(t.z)+Math.cos(a)*r).toFixed(2)}`);}
 add(`<circle cx="${X(t.x)}" cy="${Z(t.z)}" r="4.2" fill="#f6ead1" stroke="${C.gold}" stroke-width=".35" stroke-dasharray=".3 .6"/><polygon points="${pts.join(' ')}" fill="${C.pine}" stroke="${C.pineD}" stroke-width=".3"/><circle cx="${X(t.x)}" cy="${Z(t.z)}" r=".8" fill="${C.gold}"/>`);}
// 입구 아치(금빛 반원)
{const E=L.ENTRANCE;add(`<path d="M${X(-E.w/2)} ${Z(E.z)}h${E.w}" stroke="${C.red}" stroke-width=".9" stroke-linecap="round"/><circle cx="${X(0)}" cy="${Z(E.z)}" r=".7" fill="${C.gold}"/>`);}
// 방위(북쪽 = 위)
add(`<g transform="translate(${W-6} 6)"><circle r="3.6" fill="#fffaf0" stroke="${C.ink}" stroke-width=".3"/><path d="M0 -2.6 1.3 1.2 0 .4 -1.3 1.2z" fill="${C.red}"/><text y="3" font-size="2.2" text-anchor="middle" font-weight="900" fill="${C.ink}" font-family="Apple SD Gothic Neo,sans-serif" dy="-4.6">N</text></g>`);
add('</svg>');
mkdirSync('public/christmas/map',{recursive:true});
writeFileSync('public/christmas/map/plaza-map-b.svg',out.join('\n'));
// 월드개발 인계용 숫자(같은 폴더 JSON): 지도 범위·핀 자리(세계 좌표 → 0~1)
const u=x=>+((x-B.x0)/W).toFixed(4),v=z=>+((z-B.z0)/D).toFixed(4);
const pins={tree:L.TREE,campfire:L.CAMPFIRE,mailbox:L.MAILBOX,snowman:L.SNOWMAN_YARD,snowball:L.SNOWBALL_YARD,carousel:F.CAROUSEL,rink:F.RINK,gondola:L.TARGETS.gondolaBase,sled:L.SLED_RUN.deck,entrance:L.SPAWN};
writeFileSync('public/christmas/map/plaza-map-b.json',JSON.stringify({bounds:B,size:{w:W,d:D},aspect:+(W/D).toFixed(4),
 pins:Object.fromEntries(Object.entries(pins).map(([k,p])=>[k,{x:+p.x.toFixed(2),z:+p.z.toFixed(2),u:u(p.x),v:v(p.z),edge:p.z<B.z0||p.z>B.z1||p.x<B.x0||p.x>B.x1}]))},null,1));
console.log('지도',W,'×',D,'m → public/christmas/map/plaza-map-b.svg');
