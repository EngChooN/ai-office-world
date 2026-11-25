// 온라인 인형뽑기 추가 인형 그림(월드아트, 2026-11-25). 대표 결정 11-25: 시안 docs/인형뽑기/인형추가-시안-v1.html 후보 14개 모두.
// 작은 인형 8(꿀밤이·눈송이·몽글이·부엉·루돌프·돔돌이·캠핑 동동이·반짝별) + 상자 안 전용 모양 3(콩이·바우·황금 해치).
// 큰 인형 3(큰 눈송이·큰 루돌프·큰 산타 동동이)은 작은 인형 형상을 그대로 크게 쓴다(claw-palette.js BIG_PLUSH_ADD).
// 그리는 법은 claw-plush.js와 같다(얼굴·이름표·앉은 몸은 그쪽 kit을 받아 씀): 앉은 인형·큰 머리·짧은 팔다리·옆구리 희귀도 이름표,
//  높이 1로 만들어 희귀도 크기로 줄임, 앞 +Z, 바닥 y=0. 무게는 지금 인형(약 1.7천~5천 삼각형)과 같은 수준으로 칸 수를 줄였다.
// 색은 기존 그림에서 가져온다: 크리스마스 palette.js XMAS·reindeer.js REINDEER_COLORS, mascot-concepts.js 콩이·바우·돔돌이, 동동이 옷.
// claw-plush.js가 moreMakers(kit)를 불러 MAKERS에 더한다(이 파일은 claw-plush.js를 import하지 않음 — 서로 부르기 막음).
import * as THREE from 'three';
import {XMAS} from '../christmas/palette.js';
import {REINDEER_COLORS as RD} from '../christmas/reindeer.js';

export function moreMakers({E,Es,face,tag,sitBody,ddHead,K}){
 const {v,smoothGeo,capsule,noodle,at,part,surf,smile,grp,box:boxShape}=K;
 // 짧은 팔다리(동물·사물 인형 공용): 앞으로 뻗은 발 두 개 + 옆 팔 두 개
 const stubs=(g,col,{foot=col,hand=col}={})=>{for(const s of [-1,1]){part(g,at(E(v(.08,.065,.13)),v(s*.12,.065,.14)),foot);const a=part(g,E(v(.055,.09,.06)),hand);a.position.set(s*.2,.27,.12);a.rotation.z=s*.4;}};

 // ① 꿀밤이(도토리): 반들반들 밤색 몸 + 비늘 무늬 깍정이 모자·꼭지(등산로 다람쥐 도토리 색)
 function kkulbam(){
  const g=new THREE.Group(),nut='#c58a4a',nutHi='#dba466',cap='#6e4a2a',capHi='#8a6038';
  stubs(g,nut,{foot:'#a9703a'});
  const bc=v(0,.4,0),br=v(.31,.36,.29);
  part(g,at(E(br,{w:14,h:10,shape:V=>{if(V.y<0){V.x*=1+.1*V.y;V.z*=1+.1*V.y;}if(V.y<-.85)V.y=-.85;}}),bc),V=>(V.x-.1)**2+(V.y-.55)**2<.02?nutHi:nut);
  face(g,bc,br,{eyeYaw:.34,eyePitch:-.05,blushPitch:-.22,mouthPitch:-.3,kind:'omega',mouth:'#5a3020'});
  const k=grp(g,v(0,.66,-.01));
  part(k,E(v(.34,.17,.32),{w:14,h:8,shape:V=>{if(V.y<-.15)V.y=-.15;}}),V=>(Math.floor(Math.atan2(V.x,V.z)*3)+Math.floor(V.y*30))%2?cap:capHi);
  part(k,capsule(v(0,.15,0),v(.03,.25,-.02),.03,6),cap,{line:.7});
  tag(g,'common',v(-.29,.2,.12));return g;
 }
 // ② 눈송이(눈사람): 크리스마스 마을 눈사람 부품 — 높은 모자·빨강 줄 목도리·당근 코·돌 단추
 function nunsong(){
  const g=new THREE.Group(),S=XMAS;
  const lc=v(0,.25,0),lr=v(.29,.25,.27);
  part(g,at(E(lr,{shape:V=>{if(V.y<-.8)V.y=-.8;}}),lc),S.snow);
  for(let i=0;i<2;i++)surf(g,lc,lr,0,.15-i*.3,Es(v(.025,.025,.015),{w:6,h:4}),S.coal,{lift:-.004});
  for(const s of [-1,1]){part(g,at(E(v(.08,.06,.1)),v(s*.13,.05,.17)),S.snowShade);const a=part(g,E(v(.06,.09,.06)),S.snow);a.position.set(s*.26,.3,.06);a.rotation.z=s*.6;}
  const hc=v(0,.62,0),hr=v(.27,.24,.25);part(g,at(E(hr),hc),S.snow);
  face(g,hc,hr,{eyeYaw:.36,eyePitch:0,eye:v(.045,.055,.02),eyeColor:S.coal,blushPitch:-.22,kind:'smile',mouth:S.coal,mouthPitch:-.4});
  {const c=new THREE.ConeGeometry(.04,.13,8);c.rotateX(Math.PI/2);c.translate(0,0,.06);part(g,at(c,v(0,.6,.24)),S.carrot,{line:.5});}
  part(g,at(new THREE.TorusGeometry(.2,.055,6,18).rotateX(Math.PI/2),v(0,.42,0)),V=>Math.floor((Math.atan2(V.x,V.z)+Math.PI)*3)%2?S.santaRed:S.fur);
  part(g,at(new THREE.BoxGeometry(.08,.17,.04).rotateZ(.2),v(.11,.32,.2)),S.santaRed,{line:.5});
  const t=grp(g,v(0,.83,0));t.rotation.z=-.15;
  part(t,new THREE.CylinderGeometry(.22,.22,.03,16),S.topHat,{line:.6});part(t,new THREE.CylinderGeometry(.14,.15,.2,16).translate(0,.1,0),S.topHat,{line:.6});
  part(t,new THREE.CylinderGeometry(.152,.152,.04,16,1,true).translate(0,.03,0),S.hatBand,{line:.4});part(t,at(Es(v(.03,.03,.03),{w:6,h:4}),v(.1,.05,.11)),S.pine,{line:0});
  tag(g,'common',v(-.27,.2,.13));return g;
 }
 // ③ 몽글이(김 나는 커피잔): 흡연장 옥상 쉼터의 따뜻한 한 잔. 크림 잔 + 밤색 띠 + 우유 거품 하트 + 머리 위 김 세 방울
 function mongle(){
  const g=new THREE.Group(),cup='#f6efe2',sleeve='#a4704a',coffee='#6b4430',foam='#f3e2c4';
  for(const s of [-1,1])part(g,at(E(v(.075,.055,.1)),v(s*.12,.05,.15)),sleeve);
  const cg=new THREE.CylinderGeometry(.3,.24,.58,20,6);cg.translate(0,.31,0);part(g,smoothGeo(cg),V=>V.y>.17&&V.y<.31?sleeve:cup);
  part(g,at(new THREE.TorusGeometry(.3,.03,6,24).rotateX(Math.PI/2),v(0,.6,0)),cup,{line:.6});
  part(g,at(E(v(.28,.03,.28),{h:4}),v(0,.585,0)),coffee,{line:0});
  {const sh=new THREE.Shape();sh.moveTo(0,-.5);sh.bezierCurveTo(-.15,-.3,-.6,-.1,-.5,.22);sh.bezierCurveTo(-.4,.55,-.05,.5,0,.25);sh.bezierCurveTo(.05,.5,.4,.55,.5,.22);sh.bezierCurveTo(.6,-.1,.15,-.3,0,-.5);
   const h=new THREE.ShapeGeometry(sh,6).scale(.2,.2,1).rotateX(-Math.PI/2).translate(0,.618,.03);h.deleteAttribute('uv');part(g,h,foam,{line:0,shadow:false});}
  part(g,at(new THREE.TorusGeometry(.12,.04,6,12,Math.PI*1.3).rotateZ(-Math.PI*.65),v(.31,.36,0)),cup,{line:.7});
  part(g,at(E(v(.06,.08,.06)),v(-.29,.3,.06)),cup);
  const fc=v(0,.4,0),fr=v(.28,.3,.28);
  face(g,fc,fr,{eyeYaw:.32,eyePitch:.1,eye:v(.045,.06,.02),blushPitch:-.12,kind:'smile',mouthPitch:-.14});
  [[0,.8,0,.07],[.07,.92,0,.055],[-.03,1.02,0,.045]].forEach(([x,y,z,r])=>part(g,at(Es(v(r,r,r)),v(x,y,z)),'#ffffff',{line:.5}));
  tag(g,'common',v(-.29,.2,.12));return g;
 }
 // ④ 부엉(부엉이): 밤 등산 친구. 둥근 얼굴판·귀깃·노란 헤드랜턴(등산 밤 헤드랜턴과 같은 노랑)
 function bueong(){
  const g=new THREE.Group(),fur='#8a6a4a',dark='#6b4f36',belly='#ecdcbc',disc='#f3e6cc',beak='#f2b33d';
  for(const s of [-1,1])part(g,at(Es(v(.07,.035,.09)),v(s*.11,.035,.15)),beak,{line:.5});
  const bc=v(0,.42,0),br=v(.32,.4,.3);
  part(g,at(E(br,{w:14,h:10,shape:V=>{if(V.y<-.8)V.y=-.8;}}),bc),V=>{const y=(V.y-bc.y)/br.y,z=(V.z-bc.z)/br.z;return z>.35&&y<-.05?belly:fur;});
  for(let i=0;i<5;i++)surf(g,bc,br,(i%2?.18:-.18)*(i>2?0:1)+(i>2?(i-3.5)*.3:0),-.25-i%3*.15,Es(v(.035,.018,.01),{w:6,h:4}),dark,{lift:-.003});
  for(const s of [-1,1]){const w=grp(g,v(s*.3,.42,-.02));w.rotation.z=s*.2;part(w,at(E(v(.07,.2,.15)),v(0,-.05,0)),V=>V.y<-.15?dark:fur);}
  const hc=v(0,.56,.06),hr=v(.28,.24,.24);
  for(const s of [-1,1])surf(g,hc,hr,s*.36,.05,E(v(.13,.13,.04),{h:6}),disc,{lift:-.03,line:0});
  face(g,hc,hr,{eyeYaw:.36,eyePitch:.05,eye:v(.06,.065,.02),blush:null,kind:'none'});
  surf(g,hc,hr,0,-.12,new THREE.ConeGeometry(.04,.08,8).rotateX(Math.PI*.6),beak,{lift:.01,line:.5});
  for(const s of [-1,1]){const e=part(g,new THREE.ConeGeometry(.07,.17,6).translate(0,.085,0),fur);e.position.set(s*.2,.76,0);e.rotation.z=-s*.35;}
  part(g,at(new THREE.TorusGeometry(.225,.022,5,22).rotateX(Math.PI/2),v(0,.7,0)),'#3b4a7a',{line:.4});
  part(g,at(new THREE.CylinderGeometry(.045,.05,.04,10).rotateX(Math.PI/2),v(0,.71,.22)),'#ffd84d',{line:.5});
  tag(g,'uncommon',v(-.31,.24,.12));return g;
 }
 // ⑤ 루돌프: 크리스마스 하늘 썰매 루돌프(reindeer.js) 색 — 밤색 털·크림 주둥이·빨간 코·연한 뿔·금방울 목걸이
 function rudolph(){
  const g=new THREE.Group();
  for(const s of [-1,1]){part(g,at(E(v(.08,.07,.14)),v(s*.12,.07,.14)),RD.fur);part(g,at(Es(v(.06,.04,.05)),v(s*.12,.05,.27)),RD.hoof,{line:.5});}
  const bc=v(0,.24,0),br=v(.23,.23,.21);part(g,at(E(br),bc),RD.fur);
  surf(g,bc,br,0,-.12,E(v(.13,.14,.03),{h:6}),RD.cream,{lift:-.01,line:0});
  for(const s of [-1,1]){const a=part(g,E(v(.055,.1,.06)),RD.fur);a.position.set(s*.2,.25,.12);a.rotation.z=s*.35;}
  part(g,at(Es(v(.06,.06,.05)),v(0,.12,-.2)),RD.cream);
  part(g,at(new THREE.TorusGeometry(.17,.03,5,16).rotateX(Math.PI/2+.15),v(0,.43,0)),XMAS.santaRed,{line:.6});
  part(g,at(Es(v(.05,.05,.05)),v(0,.38,.2)),XMAS.gold,{line:.5});
  const hc=v(0,.6,.02),hr=v(.27,.23,.24);part(g,at(E(hr),hc),RD.fur);
  surf(g,hc,hr,0,-.3,E(v(.14,.1,.07),{h:6}),RD.muzzle,{lift:-.02,line:.4});
  surf(g,hc,hr,0,-.12,Es(v(.055,.05,.05)),RD.nose,{lift:.03,line:.5});
  face(g,hc,hr,{eyeYaw:.38,eyePitch:.08,blushPitch:-.22,kind:'omega',mouth:RD.mouth,mouthPitch:-.46});
  for(const s of [-1,1]){const e=part(g,Es(v(.08,.035,.045)),RD.fur);e.position.set(s*.28,.66,-.02);e.rotation.z=s*-.4;
   surf(g,hc,hr,s*1.2,.1,Es(v(.05,.022,.01),{w:6,h:4}),RD.earIn,{lift:-.004});
   const a=grp(g,v(s*.12,.8,-.02));a.rotation.z=-s*.35;
   part(a,capsule(v(0,0,0),v(0,.18,0),.028,5),RD.antler,{line:.6});part(a,capsule(v(0,.1,0),v(s*.09,.17,0),.022,5),RD.antler,{line:.5});part(a,capsule(v(0,.06,0),v(-s*.06,.12,0),.02,5),RD.antlerTip,{line:.5});}
  tag(g,'uncommon');return g;
 }
 // ⑥ 돔돌이: 관악산 정상 기상레이더 돔을 머리에 쓴 꼬마 로봇(mascot-concepts.js domdol) — 흰 몸·주황 띠·화면 얼굴·바람개비 안테나
 function domdol(){
  const g=new THREE.Group(),C={white:'#f4f4ef',orange:'#ff7a3d',gray:'#b9bec6',visor:'#1d2a44',glow:'#8ff0ff'};
  for(const s of [-1,1]){part(g,capsule(v(s*.11,.06,.02),v(s*.11,.06,.14),.045,6),C.gray);part(g,at(E(v(.07,.05,.08),{shape:V=>{if(V.y<-.3)V.y=-.3;}}),v(s*.11,.05,.2)),C.orange);}
  part(g,smoothGeo(at(new THREE.CapsuleGeometry(.22,.1,4,16),v(0,.27,0))),C.white);
  part(g,at(new THREE.TorusGeometry(.222,.026,5,22).rotateX(Math.PI/2),v(0,.27,0)),C.orange,{line:.7});
  for(const s of [-1,1]){const a=grp(g,v(s*.22,.36,0));a.rotation.z=s*.35;part(a,capsule(v(0,0,0),v(s*.02,-.12,.03),.03,6),C.gray);part(a,at(E(v(.05,.05,.05)),v(s*.025,-.16,.04)),C.white);}
  const hd=grp(g,v(0,.6,0));
  {const ig=new THREE.IcosahedronGeometry(.28,2);ig.deleteAttribute('uv');ig.translate(0,.04,0);part(hd,smoothGeo(ig),C.white);}
  part(hd,at(new THREE.TorusGeometry(.245,.04,5,22).rotateX(Math.PI/2),v(0,-.09,0)),C.orange,{line:.8});
  const hc=v(0,.04,0),hr=v(.28,.28,.28);
  surf(hd,hc,hr,0,-.04,E(v(.19,.11,.045),{h:6}),C.visor,{lift:-.022,line:.5});
  for(const s of [-1,1])surf(hd,hc,hr,s*.2,0,Es(v(.03,.042,.012),{w:6,h:4}),C.glow,{lift:.02});
  surf(hd,hc,hr,0,-.15,smile(.022,.006),C.glow,{lift:.018});
  const ant=grp(hd,v(0,.31,0));part(ant,capsule(v(0,0,0),v(0,.1,0),.012,5),C.gray,{line:.5});
  for(let i=0;i<3;i++){const a=i/3*Math.PI*2+.4;part(ant,capsule(v(0,.11,0),v(Math.cos(a)*.06,.11,Math.sin(a)*.06),.007,4),C.gray,{line:.4});part(ant,at(Es(v(.02,.02,.02),{w:6,h:4}),v(Math.cos(a)*.07,.11,Math.sin(a)*.07)),C.orange,{line:.5});}
  tag(g,'rare',v(-.23,.2,.14));return g;
 }
 // ⑦ 캠핑 동동이: 새 콘텐츠(캠핑장)로 이을 동동이 넷째 옷 — 겨자색 털모자·올리브 플리스·밤색 바지·허리 작은 랜턴
 function dongdongCamp(){
  const g=new THREE.Group(),C={body:'#6f8f4f',pants:'#6b4a33',boot:'#8d5c35',mitt:'#e0a93b',skin:'#f7d9b8',hair:'#5a3a26'};
  sitBody(g,C);const {hc}=ddHead(g,C);
  part(g,at(E(v(.016,.15,.012),{w:6,h:6}),v(0,.28,.21)),'#e8e0c8',{line:0});
  const hat=grp(g,v(0,hc.y+.13,0));hat.rotation.x=-.12;
  part(hat,E(v(.33,.22,.31),{shape:V=>{if(V.y<0)V.y=0;}}),'#e0a93b');
  part(hat,at(new THREE.TorusGeometry(.32,.05,6,22).rotateX(Math.PI/2),v(0,.02,0)),'#c98f2a',{line:.6});
  part(hat,at(Es(v(.08,.08,.08)),v(0,.24,0)),'#f7f2e8');
  const L=grp(g,v(.3,.14,.12));
  part(L,new THREE.CylinderGeometry(.05,.05,.1,10),'#ffe08a',{line:.5});part(L,new THREE.CylinderGeometry(.06,.06,.02,10).translate(0,.06,0),'#3a3f45',{line:.5});
  part(L,new THREE.CylinderGeometry(.06,.06,.02,10).translate(0,-.06,0),'#3a3f45',{line:.5});part(L,new THREE.TorusGeometry(.035,.008,4,8,Math.PI).translate(0,.07,0),'#3a3f45',{line:.3});
  tag(g,'rare');return g;
 }
 // ⑧ 반짝별: 크리스마스 트리 꼭대기에서 내려온 통통한 별. 두 아래 꼭짓점으로 섬.
 //  시안은 구를 눌러 별로 만들어 구의 극(위·아래 끝)이 위 꼭짓점에 몰렸고, 거기서 외곽선 껍질이 두껍게 뭉쳤다(11-25 시안 때 원인 못 찾음 → 찾음:
 //  극 둘레 가는 삼각형들의 법선이 위쪽으로 쏠려 껍질이 위로 밀림). 이제 별 둘레를 고르게 나눈 베개 모양(앞·뒤 가운데가 극)으로 만들어 모든 꼭짓점이 같은 두께.
 function puffyStar(R=.46,T=.13,inner=.5,n=50,m=8){
  const pos=[],idx=[],rad=a=>R*(inner+(1-inner)*Math.pow((1+Math.cos(5*a))/2,1.8));
  for(let j=0;j<=m;j++){const f=-Math.PI/2+Math.PI*j/m,cf=Math.cos(f),sf=Math.sin(f);
   for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,r=rad(a)*cf,tip=(rad(a)/R-inner)/(1-inner),t=T*(1-(1-cf)*0)*THREE.MathUtils.lerp(.6+.4*(1-tip),1,Math.abs(sf));
    pos.push(Math.sin(a)*r,Math.cos(a)*r,sf*t);}}
  for(let j=0;j<m;j++)for(let i=0;i<n;i++){const a=j*(n+1)+i,b=a+n+1;idx.push(a,b,a+1,a+1,b,b+1);}
  const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));gg.setIndex(idx);return smoothGeo(gg);
 }
 function star(){
  const g=new THREE.Group(),gold='#ffd54a',hi='#fff1a8';
  const sm=puffyStar();sm.translate(0,.42,0);part(g,sm,V=>V.x<-.1&&V.y>.6&&V.z>0?hi:gold);
  const fc=v(0,.5,0),fr=v(.2,.2,.14); // 얼굴판 = 별 앞면 볼록(가운데 두께 0.13)에 맞춤 — 볼 홍조가 별 속에 묻히지 않게
  face(g,fc,fr,{eyeYaw:.36,eyePitch:.08,eye:v(.05,.062,.02),blushYaw:.72,blushPitch:-.25,kind:'smile',mouthPitch:-.3});
  for(const [x,y] of [[.33,.93],[-.38,.86]])part(g,new THREE.OctahedronGeometry(.045,0).scale(.5,1,.5).translate(x,y,0),hi,{line:.3});
  tag(g,'special',v(-.22,.22,.1));return g;
 }
 // ── 상자 안 전용 모양(작은 인형 칸 없음, 상자 피규어로만 나옴 — claw-palette.js BOX_PLUSH_ADD)
 // ⑨ 콩이(콩알 대원): 젤리빈 몸·노란 셔츠·초록 반바지·빨강 네커치프·레인저 모자(mascot-concepts.js kongi)
 function kongi(){
  const g=new THREE.Group(),C={skin:'#ffe2c2',shirt:'#ffcf4a',belt:'#8a5a3b',shorts:'#4f6d3a',scarf:'#e5484d',hat:'#4f6d3a',band:'#3a2a20',woggle:'#f2c14e',shoe:'#8a5a3b'};
  for(const s of [-1,1]){part(g,capsule(v(s*.11,.06,.04),v(s*.11,.06,.18),.04,6),C.skin);part(g,at(E(v(.06,.05,.07)),v(s*.11,.06,.24)),C.shoe);}
  const bc=v(0,.45,0);part(g,smoothGeo(at(new THREE.CapsuleGeometry(.26,.38,6,16),bc)),V=>V.y>.5?C.skin:V.y>.25?C.shirt:V.y>.21?C.belt:C.shorts);
  const fc=v(0,.66,0),fr=v(.26,.26,.26);
  face(g,fc,fr,{eyeYaw:.3,eyePitch:0,eye:v(.035,.045,.015),blushYaw:.55,blushPitch:-.1,kind:'smile',mouthPitch:-.17});
  part(g,at(new THREE.TorusGeometry(.262,.024,5,24).rotateX(Math.PI/2),v(0,.52,0)),C.scarf,{line:.7});
  {const c=new THREE.ConeGeometry(.09,.14,3);c.rotateX(Math.PI);c.scale(1,1,.25);c.rotateY(Math.PI);part(g,at(c,v(0,.44,.25)),C.scarf,{line:.7});part(g,at(Es(v(.028,.028,.02)),v(0,.5,.27)),C.woggle,{line:.6});}
  for(const s of [-1,1]){const a=grp(g,v(s*.25,.48,.02));part(a,noodle([v(0,0,0),v(s*.06,-.1,.04),v(s*.06,-.2,.08)],.03),C.skin);part(a,at(Es(v(.045,.045,.045)),v(s*.06,-.21,.08)),C.skin);}
  const hat=grp(g,v(0,.88,0));hat.rotation.set(-.08,0,.08);
  part(hat,new THREE.CylinderGeometry(.36,.36,.02,24),C.hat);
  part(hat,new THREE.CylinderGeometry(.15,.2,.16,16).translate(0,.08,0),C.hat);part(hat,new THREE.CylinderGeometry(.202,.202,.035,16,1,true).translate(0,.025,0),C.band,{line:.6});
  tag(g,'uncommon',v(-.26,.22,.14));return g;
 }
 // ⑩ 바우(바위 돌돌이): 화강암 몸·이끼 모자·소나무 싹·진달래·작은 주황 배낭(mascot-concepts.js bau)
 function bau(){
  const g=new THREE.Group(),C={rock:'#d9c7a8',dark:'#b3a181',light:'#efe3cc',low:'#c8b493',moss:'#6fa04a',mossDark:'#5a8a3c',pine:'#4f7a52',trunk:'#7a5232',petal:'#ef7fb0',center:'#f7d35c',pack:'#f08a3c'};
  for(const s of [-1,1])part(g,at(E(v(.11,.08,.13)),v(s*.15,.07,.12)),C.low);
  const bc=v(0,.42,0),br=v(.38,.38,.33);
  // 화강암 얼룩 = 꼭짓점 색(따로 붙인 점 26개 대신 — 삼각형 약 2천 덜어냄)
  part(g,at(E(br,{w:16,h:12,shape:V=>{if(V.y<-.75)V.y=-.75+(V.y+.75)*.35;}}),bc),V=>{if(V.y-bc.y<-.26)return C.low;const n=Math.sin(V.x*41+V.z*17)*Math.sin(V.y*37-V.z*23)*Math.sin(V.x*13-V.y*29);
   const front=Math.abs(Math.atan2(V.x,V.z))<.95&&V.y-bc.y>-.25&&V.y-bc.y<.06;return front?C.rock:n>.32?C.dark:n<-.4?C.light:C.rock;});
  face(g,bc,br,{eyeYaw:.42,eyePitch:-.15,eye:v(.045,.06,.02),blushYaw:.62,blushPitch:-.28,blush:'#f2a08a',kind:'omega',mouth:'#6b4a3a',mouthPitch:-.3});
  for(const s of [-1,1]){const a=part(g,E(v(.08,.11,.09)),C.low);a.position.set(s*.37,.38,.06);a.rotation.z=s*.3;}
  const top=grp(g,v(0,.76,-.01));
  part(top,E(v(.3,.1,.27),{w:14,shape:V=>{if(V.y<0)V.y*=1+.5*Math.max(0,Math.sin(Math.atan2(V.x,V.z)*7));}}),C.moss);
  for(let i=0;i<7;i++){const a=i/7*Math.PI*2+.3;part(top,at(Es(v(.05,.04,.045),{w:6,h:4}),v(Math.sin(a)*.26,-.04,Math.cos(a)*.23)),i%2?C.moss:C.mossDark,{line:.6});}
  const sp=grp(top,v(.02,.07,-.02));part(sp,capsule(v(0,0,0),v(0,.15,0),.018,5),C.trunk,{line:.6});
  [[.1,.1,.09],[.075,.09,.16],[.05,.07,.22]].forEach(([r,h,y])=>part(sp,new THREE.ConeGeometry(r,h,8).translate(0,y,0),C.pine,{line:.7}));
  const fl=grp(top,v(.18,.06,.15));fl.rotation.set(.5,0,-.4);
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2;part(fl,at(Es(v(.026,.01,.017),{w:6,h:4}).rotateY(-a),v(Math.cos(a)*.026,0,Math.sin(a)*.026)),C.petal,{line:.4});}
  part(fl,at(Es(v(.012,.009,.012),{w:6,h:4}),v(0,.006,0)),C.center,{line:0});
  part(g,at(E(v(.11,.12,.06),{shape:boxShape(.55,.7)}),v(0,.46,-.33)),C.pack);
  tag(g,'rare',v(-.33,.22,.14));return g;
 }
 // ⑪ 황금 해치: 해치(claw-plush.js haechi)를 금빛으로 — 금 몸·주홍 갈기·흰 금 뿔·청록 목걸이·이마 구름 무늬
 function haechiGold(){
  const g=new THREE.Group(),C={body:'#f5d27a',belly:'#fff4d6',mane:'#e8823a',maneDark:'#c8602a',gold:'#fff3c4',teal:'#2f8f83',nose:'#7a4a2e'};
  for(const s of [-1,1])part(g,at(E(v(.1,.08,.13)),v(s*.13,.08,.13)),C.body);
  const bc=v(0,.25,0),br=v(.26,.23,.22);part(g,at(E(br),bc),C.body);
  surf(g,bc,br,0,-.15,E(v(.15,.13,.03),{h:6}),C.belly,{lift:-.01,line:0});
  for(const s of [-1,1])surf(g,bc,br,s*1.25,.05,Es(v(.07,.025,.01),{w:6,h:4}),C.teal,{roll:s*.3,lift:-.003});
  part(g,at(new THREE.TorusGeometry(.18,.03,5,16).rotateX(Math.PI/2+.15),v(0,.42,0)),C.teal,{line:.6});
  part(g,at(Es(v(.05,.05,.05)),v(0,.37,.2)),'#e9b949');
  for(const s of [-1,1])part(g,at(E(v(.07,.1,.07)),v(s*.22,.28,.1)),C.body);
  [[0,.12,-.24,.08],[0,.24,-.3,.09],[0,.36,-.26,.075]].forEach(([x,y,z,r])=>part(g,at(Es(v(r,r,r)),v(x,y,z)),C.mane));
  const hc=v(0,.62,0),hr=v(.34,.27,.28);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2,r=Math.cos(a)<-.55?.06:.1;part(g,at(Es(v(r,r,r*.9),{w:6,h:5}),v(Math.sin(a)*.33,hc.y+Math.cos(a)*.26,-.06)),i%2?C.mane:C.maneDark);}
  part(g,at(E(hr,{shape:V=>{if(V.y<0)V.x*=1-.06*V.y*V.y;}}),hc),C.body);
  for(const s of [-1,1]){const e=part(g,Es(v(.07,.04,.045)),C.body);e.position.set(s*.29,.82,-.02);e.rotation.z=s*-.5;}
  part(g,new THREE.ConeGeometry(.045,.12,8).translate(0,.06,0).rotateX(.25).translate(0,.86,.06),C.gold,{line:.8});
  surf(g,hc,hr,0,-.36,E(v(.13,.08,.06),{h:6}),C.belly,{lift:-.02,line:.4});
  surf(g,hc,hr,0,-.22,Es(v(.04,.025,.02),{w:6,h:4}),C.nose,{lift:.012});
  for(const s of [-1,1])surf(g,hc,hr,s*.36,.2,Es(v(.04,.016,.01),{w:6,h:4}),C.mane,{roll:-s*.25});
  for(const [a,p] of [[-.09,.42],[0,.46],[.09,.42]])surf(g,hc,hr,a,p,Es(v(.03,.025,.008),{w:6,h:4}),'#ffffff',{lift:-.002});
  face(g,hc,hr,{eyeYaw:.36,eyePitch:-.06,blushYaw:.66,blushPitch:-.32,blush:'#f2a08a',mouthPitch:-.44,kind:'omega',mouth:C.nose});
  tag(g,'special');return g;
 }
 return {kkulbam,nunsong,mongle,bueong,rudolph,domdol,'dongdong-camp':dongdongCamp,star,kongi,bau,'haechi-gold':haechiGold};
}
