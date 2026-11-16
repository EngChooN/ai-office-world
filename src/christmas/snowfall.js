// 크리스마스 눈 내림(월드아트). 온라인 등산 비·눈(src/precipitation.js)과 같은 방식: 카메라 둘레 상자 안에서 GPU가 위치를 감아 돌린다(CPU 갱신 없음).
// 다른 점: 늘 내리는 함박눈이라 송이가 크고 느리며, 가까운 큰 송이·먼 작은 송이 두 층이다. 송이는 둥근 솜(가장자리가 부드러운 원)이고
// 달빛·불빛을 받은 듯 살짝 푸른 흰색이다. 밝기는 밤 블룸 문턱 아래로 둔다(넘으면 휴대폰 절반 해상도 블룸에서 송이가 네모로 번진다). 그리기 호출 2개, 텍스처 없음.
import * as THREE from 'three';
import {XMAS_SKY} from './palette.js';

function seeds(count,seed){let s=seed>>>0;const r=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);const a=new Float32Array(count*4);for(let i=0;i<count;i++)a.set([r(),r(),r(),r()],i*4);return a;}
function layer(count,{size,speed},box,seed){
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(count*3),3));g.setAttribute('aSeed',new THREE.BufferAttribute(seeds(count,seed),4));
 const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,
  uniforms:{uTime:{value:0},uCam:{value:new THREE.Vector3()},uBox:{value:new THREE.Vector3(...box)},uFall:{value:speed},uWind:{value:new THREE.Vector2(.25,.1)},uSize:{value:size},uScale:{value:600},uAmount:{value:1},uColor:{value:new THREE.Color('#eef4ff')}},
  vertexShader:`uniform float uTime,uFall,uSize,uScale,uAmount;uniform vec3 uCam,uBox;uniform vec2 uWind;attribute vec4 aSeed;varying float vA;
void main(){
 vec3 o=aSeed.xyz*uBox+vec3(uWind.x,-uFall*(.75+.5*aSeed.w),uWind.y)*uTime;
 o.x+=sin(uTime*(.6+aSeed.w)+aSeed.y*40.)*.45;o.z+=cos(uTime*(.5+aSeed.w*.7)+aSeed.x*40.)*.45;
 vec3 p=mod(o-uCam+uBox*.5,uBox)-uBox*.5;
 vec4 mv=viewMatrix*vec4(uCam+p,1.);gl_Position=projectionMatrix*mv;
 if(aSeed.w>uAmount)gl_Position=vec4(2.,2.,2.,1.);
 gl_PointSize=clamp(uScale*uSize*(.7+.6*aSeed.z)/max(-mv.z,.4),1.,26.);
 // 카메라 바로 앞은 흐리게(얼굴에 붙는 큰 점 방지), 상자 가장자리도 흐리게(감기는 경계가 안 보이게)
 vec3 q=abs(p)/(uBox*.5);vA=smoothstep(.5,2.2,-mv.z)*(1.-smoothstep(.75,1.,max(q.x,max(q.y,q.z))));}`,
  fragmentShader:`uniform vec3 uColor;varying float vA;void main(){float d=length(gl_PointCoord-.5)*2.;float a=smoothstep(1.,.35,d);gl_FragColor=vec4(uColor*(.64-.12*d),.85*a*vA);}`});
 const p=new THREE.Points(g,m);p.frustumCulled=false;p.renderOrder=905;return p;
}
export function createSnowfall({mobile=false}={}){
 const S=XMAS_SKY.snow,group=new THREE.Group();group.name='눈 내림';
 const near=layer(mobile?S.near.mobile:S.near.count,S.near,S.box.map(x=>x*.55),11),far=layer(mobile?S.far.mobile:S.far.count,S.far,S.box,23);
 near.name='함박눈(가까이)';far.name='눈(멀리)';group.add(near,far);
 return {group,
  // amount 0~1(보이는 송이 비율), wind = [x,z] m/s
  update(time,camera,{amount=1,wind=[.25,.1],viewHeight=900}={}){
   for(const l of [near,far]){const u=l.material.uniforms;u.uTime.value=time;u.uCam.value.copy(camera.position);u.uAmount.value=amount;u.uWind.value.set(wind[0],wind[1]);
    u.uScale.value=viewHeight/(2*Math.tan((camera.fov??60)*Math.PI/360));}
  },
  dispose(){for(const l of [near,far]){l.geometry.dispose();l.material.dispose();}}};
}
