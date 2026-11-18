// 하늘 썰매 별 흔적(월드아트, 2026-11-18). 설계 v2 §5: 날아간 자리(썰매 날 뒤)에 반짝이는 별이 떨어지며 작아지고 서서히 사라짐 + 땅에서 달릴 때 썰매 날 뒤 눈 튐·반짝임 + 착지 눈 튐.
// ■ 그리기 1번: 모든 별(내 것·다른 사람 것·땅 반짝임·눈 튐)을 점 묶음 하나(Points + 셰이더)로 그린다. 텍스처 없음(별 모양은 셰이더가 계산).
//   한 화면 상한 cap(PC 400 · 휴대폰 150 = 대표 결정). 넘으면 가장 오래된 별 자리를 다시 쓴다(고리 버퍼). 통신 없음 — 각 화면이 받은 위치로 만든다.
// ■ 모양: 별 5갈래(큰 별)·반짝 4갈래(작은 별·땅 반짝임) 두 가지, 크기 0.2~0.46m(멀어도 4px 이상), 색 5가지(금·따뜻한 흰빛·하늘·분홍·민트 — 마켓 전구 색을 연하게).
//   색은 HDR(1보다 큼)이라 블룸 문턱(.9, festive tunePipeline)을 넘어 은은히 번진다. 더하기 섞기라 겹치면 밝아지고 뒤 물체를 가리지 않는다.
// ■ 움직임: 생기면 0.08초 동안 커지고, 수명 동안 아래로 떨어지며(중력 0.9m/s², 공기 저항) 작아지고, 끝에서 투명해진다. 저마다 반짝이며 돈다.
// 쓰는 법(월드개발):
//   const stars=createStarTrail({mobile});scene.add(stars.points);
//   const trail=stars.emitter({mine:true});                   // 썰매 한 대당 하나(다른 사람 것은 mine:false)
//   매 프레임: team.trailPoint(p); trail.update(dt,p,{air:team.mode!=='stand'&&team.mode!=='run',running:team.mode==='run',ground:groundY});
//   착지 순간: stars.splash(x,groundY,z) — 썰매 날 둘레 눈 튐 8개
//   stars.update(dt,camera,renderer.domElement.height);       // 한 번
import * as THREE from 'three';

export const STAR_COLORS=Object.freeze(['#ffe27a','#fff4d6','#bfe6ff','#ffc2e0','#c8ffd8']);
// 설계 v1 §5 표 그대로(보통 = 대표 결정). perSec = 1초에 떨어뜨리는 별(내 것 / 다른 사람), life = 별 수명(초), spark = 땅 반짝임 수명(0 = 없음)
export const STAR_LEVELS=Object.freeze({
 soft:Object.freeze({mine:6,others:3,life:1.6,spark:0,sparkPerSec:0}),
 normal:Object.freeze({mine:10,others:5,life:2.4,spark:.8,sparkPerSec:3}),
 rich:Object.freeze({mine:16,others:10,life:3.2,spark:1.2,sparkPerSec:3}),
});
export const STAR_CAP=Object.freeze({pc:400,mobile:150});
export const STAR_TRAIL=Object.freeze({puffSize:Object.freeze([.18,.34]),puffColor:'#eef4ff',spacing:.6,gravity:.9,drag:.6,size:Object.freeze([.2,.46]),sparkSize:Object.freeze([.1,.16]),hdr:2.5,hdrMobile:1.3,minPx:4,sparkY:.08});

const rnd=seed=>{let s=seed>>>0||1;return ()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);};

export function createStarTrail({mobile=false,cap=mobile?STAR_CAP.mobile:STAR_CAP.pc,level='normal',seed=1218}={}){
 const r=rnd(seed),L=STAR_LEVELS[level]??STAR_LEVELS.normal;
 // 휴대폰은 블룸이 반 해상도라 아주 밝은 점이 네모로 번진다 → 밝기를 낮춘다(festive.js 전구와 같은 이유)
 const HDR=mobile?STAR_TRAIL.hdrMobile:STAR_TRAIL.hdr;
 const pos=new Float32Array(cap*3),vel=new Float32Array(cap*3),col=new Float32Array(cap*3),born=new Float32Array(cap).fill(-1e4),life=new Float32Array(cap).fill(1),size=new Float32Array(cap),kind=new Float32Array(cap);
 const g=new THREE.BufferGeometry();
 const attr=(name,arr,n)=>{const a=new THREE.BufferAttribute(arr,n);a.setUsage(THREE.DynamicDrawUsage);g.setAttribute(name,a);return a;};
 const A={position:attr('position',pos,3),vel:attr('aVel',vel,3),col:attr('aCol',col,3),born:attr('aBorn',born,1),life:attr('aLife',life,1),size:attr('aSize',size,1),kind:attr('aKind',kind,1)};
 g.boundingSphere=new THREE.Sphere(new THREE.Vector3(),1e5);
 const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,
  uniforms:{uT:{value:0},uScale:{value:600},uG:{value:STAR_TRAIL.gravity},uDrag:{value:STAR_TRAIL.drag},uMin:{value:STAR_TRAIL.minPx}},
  vertexShader:`attribute vec3 aVel;attribute vec3 aCol;attribute float aBorn;attribute float aLife;attribute float aSize;attribute float aKind;
uniform float uT;uniform float uScale;uniform float uG;uniform float uDrag;uniform float uMin;
varying vec3 vCol;varying float vA;varying float vKind;varying float vSpin;
void main(){float age=uT-aBorn;float k=age/aLife;
 if(k<0.||k>1.){gl_Position=vec4(2.,2.,2.,1.);gl_PointSize=0.;return;}
 // 공기 저항이 있는 떨어짐: 처음 속도는 줄고 아래로 점점 빨라짐(땅 반짝임 aKind=2는 떠 있음)
 float d=(1.-exp(-uDrag*age))/uDrag;vec3 p=position+aVel*d;
 if(aKind<1.5)p.y-=uG*(age-d)/uDrag; // 별·반짝은 떨어지고, 땅 반짝임(2)·눈 튐(3)은 떠오르다 멈춤
 vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
 float tw=.82+.18*sin(uT*11.+aBorn*37.);
 float grow=smoothstep(0.,.08/aLife,k),shrink=aKind>2.5?1.+k*1.3:aKind>1.5?1.-k*.3:mix(1.,.35,k);
 // 멀리서도 점 하나는 보이게(최소 uMin px), 너무 가까우면 96px까지
 gl_PointSize=clamp(aSize*uScale/max(.1,-mv.z)*shrink*tw,uMin,96.)*grow;
 vA=(1.-smoothstep(aKind>2.5?.2:.55,1.,k))*grow*(aKind>2.5?.55:1.);vCol=aCol;vKind=aKind;vSpin=aBorn*5.+age*(aKind>.5?2.4:1.3);}`,
  fragmentShader:`varying vec3 vCol;varying float vA;varying float vKind;varying float vSpin;
void main(){vec2 c=(gl_PointCoord-.5)*2.;float s=sin(vSpin),co=cos(vSpin);c=mat2(co,-s,s,co)*c;
 float r=length(c),a=atan(c.y,c.x),shape;
 if(vKind<.5){ // 별 5갈래: 갈래 끝 1, 사이 .45
  float k=.45+.55*pow(abs(cos(2.5*a)),3.);shape=1.-smoothstep(k*.82,k*.98,r);}
 else if(vKind>2.5){shape=1.-smoothstep(.35,1.,r);} // 눈 튐: 부드러운 둥근 덩이
 else{ // 반짝 4갈래: 가는 십자 + 둥근 심
  vec2 q=abs(c);shape=max(max(0.,1.-q.x*7.)*max(0.,1.-q.y),max(0.,1.-q.y*7.)*max(0.,1.-q.x));shape=max(shape,1.-smoothstep(.15,.35,r));}
 float core=1.-smoothstep(0.,.4,r),glow=max(0.,1.-r)*.25;
 float a2=(shape+glow)*vA;if(a2<.01)discard;
 float hi=max(vCol.r,max(vCol.g,vCol.b));gl_FragColor=vec4(mix(vCol,vec3(hi),core*.45)*a2,1.);}`});
 const points=new THREE.Points(g,mat);points.name='루돌프 별 흔적';points.frustumCulled=false;points.renderOrder=3;points.userData.line=0;
 let head=0,t=0,dirty=false,spawned=0,lastBorn=-1e4;
 points.visible=false; // 살아 있는 별이 없으면 그리지 않는다(그리기 0번)
 const C=new THREE.Color();
 // 별 하나. kind 0 = 별 5갈래, 1 = 반짝 4갈래(떨어짐), 2 = 땅 반짝임(떠 있음), 3 = 눈 튐(퍼지며 사라짐)
 function emit(x,y,z,{kind=r()<.55?0:1,lifeSecs=L.life,color=STAR_COLORS[Math.floor(r()*STAR_COLORS.length)],s}={}){
  const i=head;head=(head+1)%cap;spawned++;
  pos[i*3]=x+(r()-.5)*.25;pos[i*3+1]=y+(r()-.5)*.15;pos[i*3+2]=z+(r()-.5)*.25;
  const sp=kind===2?0:kind===3?1.1:.35;vel[i*3]=(r()-.5)*sp;vel[i*3+1]=kind===2?.25+r()*.15:kind===3?.5+r()*.5:(r()-.3)*.3;vel[i*3+2]=(r()-.5)*sp;
  // 눈 튐은 블룸이 안 생기게(1 아래)
  C.set(color).multiplyScalar(kind===3?.9:HDR*(kind===2?.85:1));col[i*3]=C.r;col[i*3+1]=C.g;col[i*3+2]=C.b;
  const [a,b]=kind===3?STAR_TRAIL.puffSize:kind===2?STAR_TRAIL.sparkSize:STAR_TRAIL.size;size[i]=s??(kind===0?a+(b-a)*(.45+r()*.55):a+(b-a)*r()*.6);
  born[i]=t;life[i]=lifeSecs*(kind>=2?1:.8+r()*.4);kind_(i,kind);dirty=true;lastBorn=t;points.visible=true;
 }
 const kind_=(i,k)=>{kind[i]=k;};
 function sparkle(x,y,z){if(!L.spark)return;emit(x,y+STAR_TRAIL.sparkY,z,{kind:2,lifeSecs:L.spark,color:r()<.6?STAR_COLORS[0]:STAR_COLORS[1]});}
 // 눈 튐 하나(땅 위, 0.7초 동안 퍼지며 사라짐)
 function puff(x,y,z){emit(x,y+.05,z,{kind:3,lifeSecs:.7,color:STAR_TRAIL.puffColor});}
 // 착지: 둘레로 눈 튐 n개
 function splash(x,y,z,n=8){for(let k=0;k<n;k++){const a=k/n*Math.PI*2;puff(x+Math.sin(a)*.5,y,z+Math.cos(a)*.5);}}
 // 루돌프 한 마리의 흔적: 하늘에서는 0.6m마다(1초 상한 mine/others), 땅에서 달리면 발밑 반짝임(1초 sparkPerSec)
 function emitter({mine=true}={}){
  const E={last:null,acc:0,budget:0,spark:0,on:true};
  return {get on(){return E.on;},set on(v){E.on=!!v;},
   update(dt,p,{air=false,running=false,ground=null}={}){
    if(!E.on){E.last=null;return;}
    const per=mine?L.mine:L.others;E.budget=Math.min(per,E.budget+per*dt);
    if(air){if(E.last){const d=Math.hypot(p.x-E.last.x,p.y-E.last.y,p.z-E.last.z);E.acc+=d;
      // 멈춰 떠 있어도 1초에 3개쯤은 떨어진다(둥실 떠 있는 모습)
      E.acc+=dt*STAR_TRAIL.spacing*3;
      while(E.acc>=STAR_TRAIL.spacing&&E.budget>=1){E.acc-=STAR_TRAIL.spacing;E.budget-=1;emit(p.x,p.y,p.z);}
      if(E.acc>STAR_TRAIL.spacing*2)E.acc=STAR_TRAIL.spacing;}
     E.last=(E.last??new THREE.Vector3()).copy(p);}
    else{E.last=null;E.acc=0;}
    // 땅에서 달리면 썰매 날 뒤 눈 튐·반짝임 번갈아(1초 sparkPerSec개)
    if(running&&ground!=null&&L.sparkPerSec){E.spark+=dt*L.sparkPerSec;while(E.spark>=1){E.spark-=1;(E.alt=!E.alt)?puff(p.x,ground,p.z):sparkle(p.x,ground,p.z);}}
   }};
 }
 return {points,emit,sparkle,puff,splash,emitter,level:L,cap,
  // 지금 살아 있는 별 수(점검용)
  alive(){let n=0;for(let i=0;i<cap;i++)if(t-born[i]<=life[i])n++;return n;},
  get spawned(){return spawned;},
  update(dt,camera,viewHeight){t+=dt;mat.uniforms.uT.value=t;if(points.visible&&t-lastBorn>L.life*1.25+.1)points.visible=false;
   if(camera?.isPerspectiveCamera&&viewHeight)mat.uniforms.uScale.value=viewHeight/(2*Math.tan(camera.fov*Math.PI/360));
   if(dirty){for(const a of Object.values(A))a.needsUpdate=true;dirty=false;}},
  dispose(){g.dispose();mat.dispose();points.removeFromParent();}};
}
