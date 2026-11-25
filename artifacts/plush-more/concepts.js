// 새 인형 후보 시안(월드아트, 2026-11-25). 게임 코드가 아니다 — 대표가 고른 뒤 claw-plush.js·claw-palette.js로 옮긴다.
// 그리는 법은 claw-plush.js와 같다: 앉은 인형·큰 머리·짧은 팔다리·옆구리 희귀도 이름표, 꼭짓점 색 한 덩어리 + 외곽선 껍질, 높이 1로 만들어 희귀도 크기로 줄임.
// 색은 기존 그림에서 가져온다: 크리스마스 palette.js XMAS·reindeer.js REINDEER_COLORS, mascot-concepts.js 콩이·바우·돔돌이, 동동이 concept-kit/hub 옷.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {v,smoothGeo,ell as kitEll,capsule,sweep,noodle,at,part,surf,smile,omega,grp,box as boxShape} from '/src/toon/concept-kit.js';
import {RARITY,BIG_EXTRA} from '/src/claw/claw-palette.js';
import {makePlush,plushMaterial,plushLineMaterial} from '/src/claw/claw-plush.js';
import {XMAS} from '/src/christmas/palette.js';
import {REINDEER_COLORS as RD} from '/src/christmas/reindeer.js';

const E=(r,o={})=>kitEll(r,{w:12,h:8,...o}),Es=(r,o={})=>kitEll(r,{w:8,h:6,...o});
// ── claw-plush.js와 같은 얼굴·이름표·몸(그쪽은 내보내지 않아 그대로 옮김)
function face(g,c,r,{eyeYaw=.34,eyePitch=-.08,eye=v(.055,.07,.02),blushYaw=.6,blushPitch=-.3,blush='#f3a08f',mouth='#8a3f33',mouthPitch=-.32,kind='smile',eyeColor='#2a2321'}={}){
 for(const s of [-1,1]){const e=surf(g,c,r,s*eyeYaw,eyePitch,Es(eye),eyeColor,{lift:-eye.z*.3});
  part(e,at(Es(v(eye.x*.38,eye.y*.32,eye.z*.5)),v(-eye.x*.28,eye.y*.36,eye.z*.75)),'#ffffff',{line:0,shadow:false});
  if(blush)surf(g,c,r,s*blushYaw,blushPitch,Es(v(.06,.032,.012)),blush,{lift:-.004});}
 if(kind==='smile')surf(g,c,r,0,mouthPitch,smile(.03,.008),mouth,{lift:.003});
 else if(kind==='omega')surf(g,c,r,0,mouthPitch,omega(.018,.006),mouth,{lift:.004});
}
function tag(g,rarity,p=v(-.25,.2,.12)){
 const R=RARITY[rarity],t=grp(g,p);t.rotation.set(0,-.7,.25);
 part(t,E(v(.085,.085,.018)),'#fffaf0',{line:.5});part(t,at(E(v(.068,.068,.02)),v(0,0,.004)),R.color,{line:0});
 for(let i=0;i<R.stars;i++){const s=part(t,new THREE.OctahedronGeometry(.016,0).scale(1,1,.4),'#fffaf0',{line:0});s.position.set((i-(R.stars-1)/2)*.03,0,.024);}
 part(t,capsule(v(0,.08,0),v(.02,.13,-.02),.008,6),'#fffaf0',{line:0});
}
function sitBody(g,C){
 for(const s of [-1,1]){part(g,at(E(v(.1,.085,.14)),v(s*.12,.085,.1)),C.pants);part(g,at(E(v(.095,.075,.1),{shape:V=>{if(V.y<-.5)V.y=-.5;}}),v(s*.125,.075,.24)),C.boot);}
 part(g,at(E(v(.25,.22,.21),{shape:V=>{if(V.y<0){V.x*=1+.08*-V.y;V.z*=1+.06*-V.y;}}}),v(0,.25,0)),C.body);
 for(const s of [-1,1]){const a=grp(g,v(s*.24,.34,.02));a.rotation.set(-.35,0,s*.5);part(a,at(E(v(.075,.13,.075)),v(0,-.09,0)),C.body);part(a,at(E(v(.07,.07,.07)),v(0,-.2,0)),C.mitt);}
}
function ddHead(g,C,{hairTop=false}={}){const hc=v(0,.68,0),hr=v(.34,.3,.31);
 part(g,at(E(hr,{shape:V=>{if(V.y<0)V.x*=1-.08*V.y*V.y;}}),hc),V=>{const y=(V.y-hc.y)/hr.y,z=(V.z-hc.z)/hr.z;return (z<.15&&y>-.3)||y>(hairTop?.35:.6)?C.hair:C.skin;});
 for(const s of [-1,1])part(g,at(Es(v(.045,.06,.04)),v(s*.335,.66,-.01)),C.skin);
 face(g,hc,hr,{eyeYaw:.32,eyePitch:-.14,blushPitch:-.34,mouthPitch:-.38});return {hc,hr};}
// 짧은 팔다리(동물·사물 인형 공용): 앞으로 뻗은 발 두 개 + 옆 팔 두 개
function stubs(g,col,{legX=.12,legY=.065,legZ=.14,armX=.2,armY=.27,armZ=.12,foot=col,hand=col,leg=v(.08,.065,.13),arm=v(.055,.09,.06),armRoll=.4}={}){
 for(const s of [-1,1]){part(g,at(E(leg),v(s*legX,legY,legZ)),foot);const a=part(g,E(arm),hand);a.position.set(s*armX,armY,armZ);a.rotation.z=s*armRoll;}
}

// ═════ 후보 그림 ═════
// ① 꿀밤이(도토리): 반들반들 밤색 도토리 몸 + 체크무늬 깍정이 모자·꼭지. 등산로 다람쥐가 들고 있던 도토리(trail-props.js acorn) 색
function kkulbam(){
 const g=new THREE.Group(),nut='#c58a4a',nutHi='#dba466',cap='#6e4a2a',capHi='#8a6038';
 stubs(g,nut,{foot:'#a9703a',hand:nut});
 const bc=v(0,.4,0),br=v(.31,.36,.29);
 part(g,at(E(br,{w:16,h:12,shape:V=>{if(V.y<0){V.x*=1+.1*V.y;V.z*=1+.1*V.y;}if(V.y<-.85)V.y=-.85;}}),bc),V=>(V.x-.1)**2+(V.y-.55)**2<.02?nutHi:nut);
 face(g,bc,br,{eyeYaw:.34,eyePitch:-.05,blushPitch:-.22,mouthPitch:-.3,kind:'omega',mouth:'#5a3020'});
 // 깍정이(비늘 무늬 = 칸마다 두 색)
 const k=grp(g,v(0,.66,-.01));
 part(k,E(v(.34,.17,.32),{w:16,h:10,shape:V=>{if(V.y<-.15)V.y=-.15;}}),V=>(Math.floor(Math.atan2(V.x,V.z)*3)+Math.floor(V.y*30))%2?cap:capHi);
 part(k,capsule(v(0,.15,0),v(.03,.25,-.02),.03,8),cap,{line:.7});
 tag(g,'common',v(-.29,.2,.12));return g;
}
// ② 눈송이(눈사람): 크리스마스 마을 눈사람 꾸미기와 같은 부품 — 높은 모자·빨강 줄 목도리·당근 코·돌 단추
function nunsong(){
 const g=new THREE.Group(),S=XMAS;
 const lc=v(0,.25,0),lr=v(.29,.25,.27);
 part(g,at(E(lr,{w:16,h:12,shape:V=>{if(V.y<-.8)V.y=-.8;}}),lc),S.snow);
 for(let i=0;i<2;i++)surf(g,lc,lr,0,.15-i*.3,Es(v(.025,.025,.015)),S.coal,{lift:-.004});
 for(const s of [-1,1]){part(g,at(E(v(.08,.06,.1)),v(s*.13,.05,.17)),S.snowShade);const a=part(g,E(v(.06,.09,.06)),S.snow);a.position.set(s*.26,.3,.06);a.rotation.z=s*.6;}
 const hc=v(0,.62,0),hr=v(.27,.24,.25);part(g,at(E(hr,{w:16,h:12}),hc),S.snow);
 face(g,hc,hr,{eyeYaw:.36,eyePitch:.0,eye:v(.045,.055,.02),eyeColor:S.coal,blushPitch:-.22,kind:'smile',mouth:S.coal,mouthPitch:-.4});
 {const c=new THREE.ConeGeometry(.04,.13,10);c.rotateX(Math.PI/2);c.translate(0,0,.06);part(g,at(c,v(0,.6,.24)),S.carrot,{line:.5});}
 part(g,at(new THREE.TorusGeometry(.2,.055,8,24).rotateX(Math.PI/2),v(0,.42,0)),V=>Math.floor((Math.atan2(V.x,V.z)+Math.PI)*3)%2?S.santaRed:S.fur);
 part(g,at(new THREE.BoxGeometry(.08,.17,.04).rotateZ(.2),v(.11,.32,.2)),S.santaRed,{line:.5});
 const t=grp(g,v(0,.83,0));t.rotation.z=-.15;
 part(t,new THREE.CylinderGeometry(.22,.22,.03,20),S.topHat,{line:.6});part(t,new THREE.CylinderGeometry(.14,.15,.2,20).translate(0,.1,0),S.topHat,{line:.6});
 part(t,new THREE.CylinderGeometry(.152,.152,.04,20,1,true).translate(0,.03,0),S.hatBand,{line:.4});part(t,at(Es(v(.03,.03,.03)),v(.1,.05,.11)),S.pine,{line:0});
 tag(g,'common',v(-.27,.2,.13));return g;
}
// ③ 몽글이(김 나는 커피잔): 흡연장 옥상 쉼터의 따뜻한 한 잔. 크림 잔 + 밤색 띠 + 우유 거품 하트 + 머리 위 김 세 방울
function mongle(){
 const g=new THREE.Group(),cup='#f6efe2',sleeve='#a4704a',coffee='#6b4430',foam='#f3e2c4';
 for(const s of [-1,1])part(g,at(E(v(.075,.055,.1)),v(s*.12,.05,.15)),sleeve);
 const cg=new THREE.CylinderGeometry(.3,.24,.58,24,6);cg.translate(0,.31,0);part(g,smoothGeo(cg),V=>V.y>.17&&V.y<.31?sleeve:cup);
 part(g,at(new THREE.TorusGeometry(.3,.03,8,28).rotateX(Math.PI/2),v(0,.6,0)),cup,{line:.6});
 part(g,at(E(v(.28,.03,.28)),v(0,.585,0)),coffee,{line:0});
 {const sh=new THREE.Shape();sh.moveTo(0,-.5);sh.bezierCurveTo(-.15,-.3,-.6,-.1,-.5,.22);sh.bezierCurveTo(-.4,.55,-.05,.5,0,.25);sh.bezierCurveTo(.05,.5,.4,.55,.5,.22);sh.bezierCurveTo(.6,-.1,.15,-.3,0,-.5);
  const h=new THREE.ShapeGeometry(sh,8).scale(.2,.2,1).rotateX(-Math.PI/2).translate(0,.618,.03);part(g,h,foam,{line:0,shadow:false});}
 part(g,at(new THREE.TorusGeometry(.12,.04,8,16,Math.PI*1.3).rotateZ(-Math.PI*.65),v(.31,.36,0)),cup,{line:.7});
 part(g,at(E(v(.06,.08,.06)),v(-.29,.3,.06)),cup);
 const fc=v(0,.4,0),fr=v(.28,.3,.28);
 face(g,fc,fr,{eyeYaw:.32,eyePitch:.1,eye:v(.045,.06,.02),blushPitch:-.12,kind:'smile',mouthPitch:-.14});
 [[0,.8,.0,.07],[.07,.92,0,.055],[-.03,1.02,0,.045]].forEach(([x,y,z,r])=>part(g,at(Es(v(r,r,r)),v(x,y,z)),'#ffffff',{line:.5}));
 tag(g,'common',v(-.29,.2,.12));return g;
}
// ④ 부엉(부엉이): 밤 등산 친구. 둥근 얼굴판·귀깃·노란 헤드랜턴(등산 밤 헤드랜턴과 같은 노랑)
function bueong(){
 const g=new THREE.Group(),fur='#8a6a4a',dark='#6b4f36',belly='#ecdcbc',disc='#f3e6cc',beak='#f2b33d';
 for(const s of [-1,1])part(g,at(Es(v(.07,.035,.09)),v(s*.11,.035,.15)),beak,{line:.5});
 const bc=v(0,.42,0),br=v(.32,.4,.3);
 part(g,at(E(br,{w:16,h:12,shape:V=>{if(V.y<-.8)V.y=-.8;}}),bc),V=>{const y=(V.y-bc.y)/br.y,z=(V.z-bc.z)/br.z;return z>.35&&y<-.05?belly:fur;});
 for(let i=0;i<5;i++)surf(g,bc,br,(i%2?.18:-.18)*(i>2?0:1)+(i>2?(i-3.5)*.3:0),-.25-i%3*.15,Es(v(.035,.018,.01)),dark,{lift:-.003});
 for(const s of [-1,1]){const w=grp(g,v(s*.3,.42,-.02));w.rotation.z=s*.2;part(w,at(E(v(.07,.2,.15)),v(0,-.05,0)),V=>V.y<-.15?dark:fur);}
 const hc=v(0,.56,.06),hr=v(.28,.24,.24);
 for(const s of [-1,1])surf(g,hc,hr,s*.36,.05,E(v(.13,.13,.04)),disc,{lift:-.03,line:0});
 face(g,hc,hr,{eyeYaw:.36,eyePitch:.05,eye:v(.06,.065,.02),blush:null,kind:'none'});
 surf(g,hc,hr,0,-.12,new THREE.ConeGeometry(.04,.08,8).rotateX(Math.PI*.6),beak,{lift:.01,line:.5});
 for(const s of [-1,1]){const e=part(g,new THREE.ConeGeometry(.07,.17,6).translate(0,.085,0),fur);e.position.set(s*.2,.76,0);e.rotation.z=-s*.35;}
 // 헤드랜턴: 이마 띠 + 앞 노란 등
 part(g,at(new THREE.TorusGeometry(.225,.022,6,28).rotateX(Math.PI/2),v(0,.7,0)),'#3b4a7a',{line:.4});
 part(g,at(new THREE.CylinderGeometry(.045,.05,.04,12).rotateX(Math.PI/2),v(0,.71,.22)),'#ffd84d',{line:.5});
 tag(g,'uncommon',v(-.31,.24,.12));return g;
}
// ⑤ 루돌프: 크리스마스 하늘 썰매를 끄는 루돌프(reindeer.js) 색 — 밤색 털·크림 주둥이·빨간 코·연한 뿔·금방울 목걸이
function rudolph(){
 const g=new THREE.Group();
 for(const s of [-1,1]){part(g,at(E(v(.08,.07,.14)),v(s*.12,.07,.14)),RD.fur);part(g,at(Es(v(.06,.04,.05)),v(s*.12,.05,.27)),RD.hoof,{line:.5});}
 const bc=v(0,.24,0),br=v(.23,.23,.21);part(g,at(E(br),bc),RD.fur);
 surf(g,bc,br,0,-.12,E(v(.13,.14,.03)),RD.cream,{lift:-.01,line:0});
 for(const s of [-1,1]){const a=part(g,E(v(.055,.1,.06)),RD.fur);a.position.set(s*.2,.25,.12);a.rotation.z=s*.35;}
 part(g,at(Es(v(.06,.06,.05)),v(0,.12,-.2)),RD.cream);
 part(g,at(new THREE.TorusGeometry(.17,.03,6,20).rotateX(Math.PI/2+.15),v(0,.43,0)),XMAS.santaRed,{line:.6});
 part(g,at(Es(v(.05,.05,.05)),v(0,.38,.2)),XMAS.gold,{line:.5});
 const hc=v(0,.6,.02),hr=v(.27,.23,.24);part(g,at(E(hr),hc),RD.fur);
 surf(g,hc,hr,0,-.3,E(v(.14,.1,.07)),RD.muzzle,{lift:-.02,line:.4});
 surf(g,hc,hr,0,-.12,Es(v(.055,.05,.05)),RD.nose,{lift:.03,line:.5});
 face(g,hc,hr,{eyeYaw:.38,eyePitch:.08,blushPitch:-.22,kind:'omega',mouth:RD.mouth,mouthPitch:-.46});
 for(const s of [-1,1]){const e=part(g,Es(v(.08,.035,.045)),RD.fur);e.position.set(s*.28,.66,-.02);e.rotation.z=s*-.4;
  surf(g,hc,hr,s*1.2,.1,Es(v(.05,.022,.01)),RD.earIn,{lift:-.004});
  const a=grp(g,v(s*.12,.8,-.02));a.rotation.z=-s*.35;
  part(a,capsule(v(0,0,0),v(0,.18,0),.028,6),RD.antler,{line:.6});part(a,capsule(v(0,.1,0),v(s*.09,.17,0),.022,6),RD.antler,{line:.5});part(a,capsule(v(0,.06,0),v(-s*.06,.12,0),.02,6),RD.antlerTip,{line:.5});}
 tag(g,'uncommon');return g;
}
// ⑥ 콩이(콩알 대원): 젤리빈 몸·노란 셔츠·초록 반바지·빨강 네커치프·레인저 모자(mascot-concepts.js kongi)
function kongi(){
 const g=new THREE.Group(),C={skin:'#ffe2c2',shirt:'#ffcf4a',belt:'#8a5a3b',shorts:'#4f6d3a',scarf:'#e5484d',hat:'#4f6d3a',band:'#3a2a20',woggle:'#f2c14e',shoe:'#8a5a3b'};
 for(const s of [-1,1]){part(g,capsule(v(s*.11,.06,.04),v(s*.11,.06,.18),.04,8),C.skin);part(g,at(E(v(.06,.05,.07)),v(s*.11,.06,.24)),C.shoe);}
 const bc=v(0,.45,0);part(g,smoothGeo(at(new THREE.CapsuleGeometry(.26,.38,10,24),bc)),V=>V.y>.5?C.skin:V.y>.25?C.shirt:V.y>.21?C.belt:C.shorts);
 const fc=v(0,.66,0),fr=v(.26,.26,.26);
 face(g,fc,fr,{eyeYaw:.3,eyePitch:.0,eye:v(.035,.045,.015),blushYaw:.55,blushPitch:-.1,kind:'smile',mouthPitch:-.17});
 part(g,at(new THREE.TorusGeometry(.262,.024,8,32).rotateX(Math.PI/2),v(0,.52,0)),C.scarf,{line:.7});
 {const c=new THREE.ConeGeometry(.09,.14,3);c.rotateX(Math.PI);c.scale(1,1,.25);c.rotateY(Math.PI);part(g,at(c,v(0,.44,.25)),C.scarf,{line:.7});part(g,at(E(v(.028,.028,.02)),v(0,.5,.27)),C.woggle,{line:.6});}
 for(const s of [-1,1]){const a=grp(g,v(s*.25,.48,.02));part(a,noodle([v(0,0,0),v(s*.06,-.1,.04),v(s*.06,-.2,.08)],.03),C.skin);part(a,at(E(v(.045,.045,.045)),v(s*.06,-.21,.08)),C.skin);}
 const hat=grp(g,v(0,.88,0));hat.rotation.set(-.08,0,.08);
 part(hat,new THREE.CylinderGeometry(.36,.36,.02,32),C.hat);
 part(hat,new THREE.CylinderGeometry(.15,.2,.16,24).translate(0,.08,0),C.hat);part(hat,new THREE.CylinderGeometry(.202,.202,.035,24,1,true).translate(0,.025,0),C.band,{line:.6});
 tag(g,'uncommon',v(-.26,.22,.14));return g;
}
// ⑦ 돔돌이: 관악산 정상 기상레이더 돔을 머리에 쓴 작은 로봇(mascot-concepts.js domdol) — 흰 몸·주황 띠·화면 얼굴·바람개비 안테나
function domdol(){
 const g=new THREE.Group(),C={white:'#f4f4ef',orange:'#ff7a3d',gray:'#b9bec6',visor:'#1d2a44',glow:'#8ff0ff'};
 for(const s of [-1,1]){part(g,capsule(v(s*.11,.06,.02),v(s*.11,.06,.14),.045,8),C.gray);part(g,at(E(v(.07,.05,.08),{shape:V=>{if(V.y<-.3)V.y=-.3;}}),v(s*.11,.05,.2)),C.orange);}
 part(g,smoothGeo(at(new THREE.CapsuleGeometry(.22,.1,8,24),v(0,.27,0))),C.white);
 part(g,at(new THREE.TorusGeometry(.222,.026,8,32).rotateX(Math.PI/2),v(0,.27,0)),C.orange,{line:.7});
 for(const s of [-1,1]){const a=grp(g,v(s*.22,.36,0));a.rotation.z=s*.35;part(a,capsule(v(0,0,0),v(s*.02,-.12,.03),.03,8),C.gray);part(a,at(E(v(.05,.05,.05)),v(s*.025,-.16,.04)),C.white);}
 const hd=grp(g,v(0,.6,0));
 {const ig=new THREE.IcosahedronGeometry(.28,2);ig.deleteAttribute('uv');ig.translate(0,.04,0);part(hd,ig,C.white);}
 part(hd,at(new THREE.TorusGeometry(.245,.04,8,32).rotateX(Math.PI/2),v(0,-.09,0)),C.orange,{line:.8});
 const hc=v(0,.04,0),hr=v(.28,.28,.28);
 surf(hd,hc,hr,0,-.04,E(v(.19,.11,.045)),C.visor,{lift:-.022,line:.5});
 for(const s of [-1,1])surf(hd,hc,hr,s*.2,0,Es(v(.03,.042,.012)),C.glow,{lift:.02});
 surf(hd,hc,hr,0,-.15,smile(.022,.006),C.glow,{lift:.018});
 const ant=grp(hd,v(0,.31,0));part(ant,capsule(v(0,0,0),v(0,.1,0),.012,6),C.gray,{line:.5});
 for(let i=0;i<3;i++){const a=i/3*Math.PI*2+.4;part(ant,capsule(v(0,.11,0),v(Math.cos(a)*.06,.11,Math.sin(a)*.06),.007,6),C.gray,{line:.4});part(ant,at(Es(v(.02,.02,.02)),v(Math.cos(a)*.07,.11,Math.sin(a)*.07)),C.orange,{line:.5});}
 tag(g,'rare',v(-.23,.2,.14));return g;
}
// ⑧ 바우(바위 돌돌이): 화강암 몸·이끼 모자·소나무 싹·진달래·작은 주황 배낭(mascot-concepts.js bau)
function bau(){
 const g=new THREE.Group(),C={rock:'#d9c7a8',dark:'#b3a181',light:'#efe3cc',low:'#c8b493',moss:'#6fa04a',mossDark:'#5a8a3c',pine:'#4f7a52',trunk:'#7a5232',petal:'#ef7fb0',center:'#f7d35c',pack:'#f08a3c'};
 for(const s of [-1,1])part(g,at(E(v(.11,.08,.13)),v(s*.15,.07,.12)),C.low);
 const bc=v(0,.42,0),br=v(.38,.38,.33);
 part(g,at(E(br,{w:20,h:14,shape:V=>{if(V.y<-.75)V.y=-.75+(V.y+.75)*.35;}}),bc),V=>V.y-bc.y<-.26?C.low:C.rock);
 for(let i=0;i<26;i++){const yaw=i*2.39996%(Math.PI*2)-Math.PI,pitch=Math.asin(((i*.618)%1)*1.4-.7);if(Math.abs(yaw)<.95&&pitch<.15&&pitch>-.7)continue;
  const r=.018+((i*7)%5)*.007;surf(g,bc,br,yaw,pitch,Es(v(r,r*.8,.008)),i%3?C.dark:C.light,{lift:-.003,roll:i});}
 face(g,bc,br,{eyeYaw:.42,eyePitch:-.15,eye:v(.045,.06,.02),blushYaw:.62,blushPitch:-.28,blush:'#f2a08a',kind:'omega',mouth:'#6b4a3a',mouthPitch:-.3});
 for(const s of [-1,1]){const a=part(g,E(v(.08,.11,.09)),C.low);a.position.set(s*.37,.38,.06);a.rotation.z=s*.3;}
 const top=grp(g,v(0,.76,-.01));
 part(top,E(v(.3,.1,.27),{shape:V=>{if(V.y<0)V.y*=1+.5*Math.max(0,Math.sin(Math.atan2(V.x,V.z)*7));}}),C.moss);
 for(let i=0;i<7;i++){const a=i/7*Math.PI*2+.3;part(top,at(Es(v(.05,.04,.045)),v(Math.sin(a)*.26,-.04,Math.cos(a)*.23)),i%2?C.moss:C.mossDark,{line:.6});}
 const sp=grp(top,v(.02,.07,-.02));part(sp,capsule(v(0,0,0),v(0,.15,0),.018,6),C.trunk,{line:.6});
 [[.1,.1,.09],[.075,.09,.16],[.05,.07,.22]].forEach(([r,h,y])=>part(sp,new THREE.ConeGeometry(r,h,9).translate(0,y,0),C.pine,{line:.7}));
 const fl=grp(top,v(.18,.06,.15));fl.rotation.set(.5,0,-.4);
 for(let i=0;i<5;i++){const a=i/5*Math.PI*2;part(fl,at(Es(v(.026,.01,.017)).rotateY(-a),v(Math.cos(a)*.026,0,Math.sin(a)*.026)),C.petal,{line:.4});}
 part(fl,at(Es(v(.012,.009,.012)),v(0,.006,0)),C.center,{line:0});
 part(g,at(E(v(.11,.12,.06),{shape:boxShape(.55,.7)}),v(0,.46,-.33)),C.pack);
 tag(g,'rare',v(-.33,.22,.14));return g;
}
// ⑨ 캠핑 동동이: 새 콘텐츠(캠핑장)로 이을 옷 — 겨자색 털모자·올리브 플리스·밤색 바지·옆구리 작은 랜턴
function dongdongCamp(){
 const g=new THREE.Group(),C={body:'#6f8f4f',pants:'#6b4a33',boot:'#8d5c35',mitt:'#e0a93b',skin:'#f7d9b8',hair:'#5a3a26'};
 sitBody(g,C);const {hc}=ddHead(g,C);
 // 플리스 지퍼·주머니 덮개
 part(g,at(E(v(.016,.15,.012)),v(0,.28,.21)),'#e8e0c8',{line:0});
 // 털모자(겨자, 접은 단 + 방울)
 const hat=grp(g,v(0,hc.y+.13,0));hat.rotation.x=-.12;
 part(hat,E(v(.33,.22,.31),{shape:V=>{if(V.y<0)V.y=0;}}),'#e0a93b');
 part(hat,at(new THREE.TorusGeometry(.32,.05,8,28).rotateX(Math.PI/2),v(0,.02,0)),'#c98f2a',{line:.6});
 part(hat,at(E(v(.08,.08,.08)),v(0,.24,0)),'#f7f2e8');
 // 랜턴(오른쪽 허리)
 const L=grp(g,v(.3,.14,.12));
 part(L,new THREE.CylinderGeometry(.05,.05,.1,12),'#ffe08a',{line:.5});part(L,new THREE.CylinderGeometry(.06,.06,.02,12).translate(0,.06,0),'#3a3f45',{line:.5});
 part(L,new THREE.CylinderGeometry(.06,.06,.02,12).translate(0,-.06,0),'#3a3f45',{line:.5});part(L,new THREE.TorusGeometry(.035,.008,6,12,Math.PI).translate(0,.07,0),'#3a3f45',{line:.3});
 tag(g,'rare');return g;
}
// ⑩ 반짝별: 크리스마스 트리 꼭대기·밤하늘 별 보기에서 온 통통한 별. 두 아래 꼭짓점으로 섬
function star(){
 const g=new THREE.Group(),gold='#ffd54a',hi='#fff1a8';
 // 통통한 별: 타원체를 별 모양으로 눌러 만든다(꼭짓점 5개, 가장자리까지 둥근 면)
 const sm=E(v(.46,.46,.13),{w:60,h:20,shape:V=>{const a=Math.atan2(V.x,V.y),k=.5+.5*Math.pow((1+Math.cos(5*a))/2,1.8);V.x*=k;V.y*=k;V.z*=.75+.25*k;}});sm.translate(0,.42,0);
 part(g,sm,V=>V.x<-.1&&V.y>.6?hi:gold,{line:0}); // 껍질 외곽선이 납작한 별 위쪽에 두껍게 몰려 그려져(원인 못 찾음) 화면 외곽선만 씀 — 모형 제작 때 다시 볼 것
 const fc=v(0,.5,.025),fr=v(.2,.2,.1);
 face(g,fc,fr,{eyeYaw:.36,eyePitch:.08,eye:v(.05,.062,.02),blushYaw:.72,blushPitch:-.25,kind:'smile',mouthPitch:-.3});
 // 작은 반짝이 두 개
 for(const [x,y] of [[.33,.93],[-.38,.86]])part(g,new THREE.OctahedronGeometry(.045,0).scale(.5,1,.5).translate(x,y,0),hi,{line:.3});
 tag(g,'special',v(-.22,.22,.1));return g;
}
// ⑪ 황금 해치: 해치(claw-plush.js haechi)를 금빛으로 — 금 몸·주홍 갈기·흰 금 뿔·청록 목걸이·이마 구름 무늬
function haechiGold(){
 const g=new THREE.Group(),C={body:'#f5d27a',belly:'#fff4d6',mane:'#e8823a',maneDark:'#c8602a',gold:'#fff3c4',teal:'#2f8f83',nose:'#7a4a2e'};
 for(const s of [-1,1])part(g,at(E(v(.1,.08,.13)),v(s*.13,.08,.13)),C.body);
 const bc=v(0,.25,0),br=v(.26,.23,.22);part(g,at(E(br),bc),C.body);
 surf(g,bc,br,0,-.15,E(v(.15,.13,.03)),C.belly,{lift:-.01,line:0});
 for(const s of [-1,1])surf(g,bc,br,s*1.25,.05,Es(v(.07,.025,.01)),C.teal,{roll:s*.3,lift:-.003});
 part(g,at(new THREE.TorusGeometry(.18,.03,6,20).rotateX(Math.PI/2+.15),v(0,.42,0)),C.teal,{line:.6});
 part(g,at(E(v(.05,.05,.05)),v(0,.37,.2)),'#e9b949');
 for(const s of [-1,1])part(g,at(E(v(.07,.1,.07)),v(s*.22,.28,.1)),C.body);
 [[0,.12,-.24,.08],[0,.24,-.3,.09],[0,.36,-.26,.075]].forEach(([x,y,z,r])=>part(g,at(Es(v(r,r,r)),v(x,y,z)),C.mane));
 const hc=v(0,.62,0),hr=v(.34,.27,.28);
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2,r=Math.cos(a)<-.55?.06:.1;part(g,at(Es(v(r,r,r*.9)),v(Math.sin(a)*.33,hc.y+Math.cos(a)*.26,-.06)),i%2?C.mane:C.maneDark);}
 part(g,at(E(hr,{shape:V=>{if(V.y<0)V.x*=1-.06*V.y*V.y;}}),hc),C.body);
 for(const s of [-1,1]){const e=part(g,Es(v(.07,.04,.045)),C.body);e.position.set(s*.29,.82,-.02);e.rotation.z=s*-.5;}
 part(g,new THREE.ConeGeometry(.045,.12,8).translate(0,.06,0).rotateX(.25).translate(0,.86,.06),C.gold,{line:.8});
 surf(g,hc,hr,0,-.36,E(v(.13,.08,.06)),C.belly,{lift:-.02,line:.4});
 surf(g,hc,hr,0,-.22,Es(v(.04,.025,.02)),C.nose,{lift:.012});
 for(const s of [-1,1])surf(g,hc,hr,s*.36,.2,Es(v(.04,.016,.01)),C.mane,{roll:-s*.25});
 // 이마 구름 무늬(작은 동그라미 셋)
 for(const [a,p] of [[-.09,.42],[0,.46],[.09,.42]])surf(g,hc,hr,a,p,Es(v(.03,.025,.008)),'#ffffff',{lift:-.002});
 face(g,hc,hr,{eyeYaw:.36,eyePitch:-.06,blushYaw:.66,blushPitch:-.32,blush:'#f2a08a',mouthPitch:-.44,kind:'omega',mouth:C.nose});
 tag(g,'special');return g;
}

// ═════ 후보 목록 ═════
// kind: small 작은 인형 · big 큰 인형(등에 업음, 같은 생김새를 크게) · box 상자 피규어(손에 듦, 작은 인형이 상자 안)
// shape = 생김새를 만드는 것(큰·상자 후보는 작은 인형 생김새를 그대로 씀). existing = 이미 있는 인형 생김새(claw-plush.js)
// link = 이어지는 콘텐츠
export const CONCEPTS=[
 {id:'kkulbam',name:'꿀밤이',kind:'small',rarity:'common',make:kkulbam,box:'#c58a4a',link:'온라인 등산',line:'등산로 다람쥐가 줍던 도토리. 깍정이 모자에 꼭지가 달린 반들반들한 밤색 몸.'},
 {id:'nunsong',name:'눈송이',kind:'small',rarity:'common',make:nunsong,box:'#7fb2e0',link:'온라인 크리스마스',line:'크리스마스 마을 눈사람을 인형으로. 높은 모자·빨강 줄 목도리·당근 코.'},
 {id:'mongle',name:'몽글이',kind:'small',rarity:'common',make:mongle,box:'#a4704a',link:'온라인 흡연장(옥상 쉼터)',line:'쉬는 시간의 따뜻한 커피 한 잔. 우유 거품 하트와 머리 위 김 세 방울.'},
 {id:'bueong',name:'부엉',kind:'small',rarity:'uncommon',make:bueong,box:'#6b4f36',link:'온라인 등산(밤)',line:'밤 등산 친구 부엉이. 이마에 노란 헤드랜턴을 찼어요.'},
 {id:'rudolph',name:'루돌프',kind:'small',rarity:'uncommon',make:rudolph,box:'#a5683b',link:'온라인 크리스마스',line:'하늘 썰매를 끄는 그 루돌프. 빨간 코와 금방울 목걸이.'},
 {id:'domdol',name:'돔돌이',kind:'small',rarity:'rare',make:domdol,box:'#ff7a3d',link:'온라인 등산(정상)·새 콘텐츠',line:'정상 기상레이더 돔을 머리에 쓴 꼬마 로봇. 화면 얼굴과 바람개비 안테나.'},
 {id:'dongdong-camp',name:'캠핑 동동이',kind:'small',rarity:'rare',make:dongdongCamp,box:'#6f8f4f',link:'새 콘텐츠(캠핑장)',line:'동동이 넷째 옷. 겨자색 털모자·올리브 플리스·허리에 작은 랜턴.'},
 {id:'star',name:'반짝별',kind:'small',rarity:'special',make:star,box:'#3e4b8c',link:'온라인 크리스마스·새 콘텐츠(별 보기)',line:'트리 꼭대기에서 내려온 통통한 별. 볼에 홍조, 반짝이 두 개를 달고 다녀요.'},
 {id:'big-nunsong',name:'큰 눈송이',kind:'big',rarity:'common',shape:'nunsong',link:'온라인 크리스마스',line:'눈송이를 크게. 타이머 기계 경품으로 등에 업어요.'},
 {id:'big-rudolph',name:'큰 루돌프',kind:'big',rarity:'uncommon',shape:'rudolph',link:'온라인 크리스마스',line:'루돌프를 크게. 뿔이 등 위로 쏙 나와요.'},
 {id:'big-dongdong-santa',name:'큰 산타 동동이',kind:'big',rarity:'special',shape:'dongdong-santa',existing:true,link:'온라인 크리스마스',line:'지금 있는 산타 동동이를 크게. 아직 없는 「특별 큰 인형」 자리를 채워요.'},
 {id:'box-kongi',name:'콩이 상자',kind:'box',rarity:'uncommon',shape:'kongi',make:kongi,box:'#ffcf4a',link:'새 콘텐츠(탐험대)',line:'우리 캐릭터 시안 「콩이」를 상자 피규어로. 레인저 모자·빨강 네커치프.'},
 {id:'box-bau',name:'바우 상자',kind:'box',rarity:'rare',shape:'bau',make:bau,box:'#6fa04a',link:'온라인 등산',line:'캐릭터 시안 「바우」(바위 돌돌이). 이끼 모자에 소나무 싹·진달래.'},
 {id:'box-haechi-gold',name:'황금 해치 상자',kind:'box',rarity:'special',shape:'haechi-gold',make:haechiGold,box:'#e9b949',link:'공통(해치 특별판)',line:'해치를 금빛으로 칠한 특별판. 이마에 흰 구름 무늬.'},
];
export const conceptOf=id=>CONCEPTS.find(c=>c.id===id);
const MAKE=Object.fromEntries(CONCEPTS.filter(c=>c.make).map(c=>[c.shape??c.id,c.make]));

// ═════ 형상(claw-plush.js flatten과 같음): 색 덩어리 + 외곽선 덩어리, 높이 1 ═════
const _col=new THREE.Color();
function flatten(root){
 root.updateMatrixWorld(true);const all=[],body=[];
 root.traverse(o=>{if(!o.isMesh)return;let g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);
  for(const k of Object.keys(g.attributes))if(!['position','normal','color'].includes(k))g.deleteAttribute(k);
  if(!g.index){const n=g.attributes.position.count;g.setIndex([...Array(n).keys()]);}
  if(!g.attributes.color){_col.copy(o.material.color);const n=g.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++)a.set([_col.r,_col.g,_col.b],i*3);g.setAttribute('color',new THREE.BufferAttribute(a,3));}
  if(!g.attributes.normal)g.computeVertexNormals();all.push(g);if(o.userData.line>0)body.push(g);});
 const color=mergeGeometries(all,false),line=mergeGeometries(body.map(g=>{const c=g.clone();c.deleteAttribute('color');return c;}),false);
 color.computeBoundingBox();const bb=color.boundingBox,k=1/(bb.max.y-bb.min.y);
 for(const g of [color,line]){g.translate(0,-bb.min.y,0);g.scale(k,k,k);g.computeBoundingSphere();}
 return {color,line,tris:color.index.count/3};
}
const cache=new Map();
export function conceptGeometry(shape){if(!cache.has(shape))cache.set(shape,flatten(MAKE[shape]()));return cache.get(shape);}
/** 후보 크기(m): 희귀도 크기, 큰 인형은 + BIG_EXTRA(지금 규칙 그대로) */
export const conceptSize=c=>RARITY[c.rarity].size+(c.kind==='big'?BIG_EXTRA:0);
/** 후보 인형 하나(makePlush와 같은 꼴). 상자 후보는 안에 든 작은 인형 모습. size를 주면 그 높이로 */
export function makeConcept(id,{toonify=null,size=null}={}){
 const c=conceptOf(id)??{id,rarity:'common',kind:'small',shape:id};
 if(c.existing){const p=makePlush(c.shape,{toonify});const k=(size??conceptSize(c))/p.userData.size;p.children.forEach(m=>m.scale.multiplyScalar(k));p.userData.size=size??conceptSize(c);return p;}
 const geo=conceptGeometry(c.shape??c.id),s=size??(c.kind==='box'?RARITY[c.rarity].size:conceptSize(c)),g=new THREE.Group();g.name=`후보:${id}`;
 const m=new THREE.Mesh(geo.color,plushMaterial());m.castShadow=true;m.scale.setScalar(s);g.add(m);toonify?.(g,{kind:'character'});
 // 외곽선 실제 두께는 작은 인형(약 4mm)과 같게
 const l=new THREE.Mesh(geo.line,plushLineMaterial(.016*RARITY[c.rarity].size/s));l.userData.outline=true;l.scale.setScalar(s);g.add(l);
 g.userData={plushId:id,size:s,tris:geo.tris};return g;
}

// ═════ 상자 피규어(claw-bridge.js makeBoxPrize와 같은 짜임, 색만 후보 색). box = [폭(z), 높이, 길이(x)] ═════
const paint=(g,hex)=>{if(g.index){const n=g.toNonIndexed();g.dispose();g=n;}for(const k of Object.keys(g.attributes))if(!['position','normal','color'].includes(k))g.deleteAttribute(k);
 _col.set(hex);const n=g.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++)a.set([_col.r,_col.g,_col.b],i*3);g.setAttribute('color',new THREE.BufferAttribute(a,3));return g;};
const pale=(hex,k)=>'#'+new THREE.Color(hex).lerp(new THREE.Color('#ffffff'),k).getHexString();
// 후보 상자 치수(11-25 대표 지적 「인형이 상자를 삐져나가지 않게 상자를 키우던가」): 지금 손에 드는 상자 [깊이 .10, 높이 .22, 폭 .16] → [.15, .24, .19]
export const CONCEPT_BOX=Object.freeze([.15,.24,.19]);
export function makeConceptBox(id,{toonify=null,box=CONCEPT_BOX}={}){
 const c=conceptOf(id),R=RARITY[c.rarity],[w,h,l]=box,g=new THREE.Group(),col=c.box,inside=pale(col,.72),t=.005,band=h*.3,P=[];
 const B=(sx,sy,sz,x,y,z,hex)=>P.push(paint(new THREE.BoxGeometry(sx,sy,sz).translate(x,y,z),hex));
 B(l,t,w,0,-h/2+t/2,0,col);B(l,h,t,0,0,-w/2+t/2,col);B(l-2*t,h-2*t,.001,0,0,-w/2+t+.0005,inside);
 for(const s of [-1,1]){B(t,h,w,s*(l/2-t/2),0,0,col);P.push(paint(new THREE.CylinderGeometry(h*.26,h*.26,.002,16).rotateZ(Math.PI/2).translate(s*(l/2+.001),h*.06,0),R.color));}
 B(l,band,t,0,-h/2+band/2,w/2-t/2,R.color);B(l,t*1.6,t,0,h/2-t*.8,w/2-t/2,col);
 for(const s of [-1,1])B(l*.1,h,t,s*(l/2-l*.05),0,w/2-t/2,col);
 for(let i=0;i<R.stars;i++)P.push(paint(new THREE.OctahedronGeometry(band*.26,0).scale(1,1,.35).translate((i-(R.stars-1)/2)*band*.62,-h/2+band/2,w/2+.0015),'#fffaf0'));
 B(l,t,w*.16,0,h/2-t/2,-w/2+w*.08,col);B(l,t,t*1.6,0,h/2-t/2,w/2-t*.8,col);for(const s of [-1,1])B(l*.1,t,w,s*(l/2-l*.05),h/2-t/2,0,col);
 const shell=new THREE.Mesh(mergeGeometries(P,false),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.75}));shell.castShadow=true;toonify?.(shell,{kind:'prop'});g.add(shell);
 const wf=new THREE.PlaneGeometry(l*.8,h-band-t*1.6).translate(0,-h/2+band+(h-band-t*1.6)/2,w/2-.0015),wt=new THREE.PlaneGeometry(l*.8,w*.82).rotateX(-Math.PI/2).translate(0,h/2-.0015,w*.04);
 g.add(Object.assign(new THREE.Mesh(mergeGeometries([wf,wt]),new THREE.MeshStandardMaterial({color:'#e8f8ff',transparent:true,opacity:.3,roughness:.1,depthWrite:false,side:THREE.DoubleSide})),{renderOrder:2}));
 // 안 인형: 아래 띠 높이의 받침 위에 세워 창으로 다 보이게. 창(폭 80%·띠 위 높이)·상자 깊이 안에 모두 들어가게 줄임(넓은 바우·해치 갈기도)
 const shelfTop=-h/2+band;
 {const sg=paint(new THREE.BoxGeometry(l-2*t,band-t,w-2*t).translate(0,-h/2+t+(band-t)/2,0),inside);const sh=new THREE.Mesh(sg,shell.material);toonify?.(sh,{kind:'prop'});g.add(sh);}
 const winH=h-band-t*1.6,p=makeConcept(id,{toonify,size:winH*.92});
 {const bb=new THREE.Box3().setFromObject(p),sz=bb.getSize(new THREE.Vector3()),k=Math.min(1,l*.8*.94/sz.x,(w-t*2)*.92/sz.z);
  p.scale.multiplyScalar(k);const b2=new THREE.Box3().setFromObject(p),c=b2.getCenter(new THREE.Vector3());p.position.set(-c.x,shelfTop-b2.min.y,-c.z);p.userData.inner=true;}
 g.add(p);
 g.userData={plushId:id,size:h,box:true};return g;
}
