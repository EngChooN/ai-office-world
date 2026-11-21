import{a5 as Rn,aX as Nn,aY as Pn,aZ as Wn,J as P,z as Uo,a_ as Ln,aK as Bn,H as nt,q as St,Y as zt,A as Qe,e as _t,Q as ht,d as At,a$ as En,aJ as Do,aq as $a,V as wt,b0 as Ue,ac as Nt,aF as Ne,a2 as Ha,m as ye,$ as na,aA as $n,_ as Hn,S as In,G as Dt,K as Je,y as xt,aH as On,j as pe,F as at,x as ke,b1 as Gn,b2 as ge,b3 as ce,b4 as fe,b5 as Un,ap as Vn,b6 as jn,b7 as Kn,b8 as qn,b9 as Zn,ba as Xn,bb as Yn,aI as Qn,bc as Jn,aj as ts,bd as es,be as os,bf as as,M as Ia,av as Oa,D as Vo,N as Ga,aE as ns,c as ss,B as _e,C as Ut,aD as Fo,T as is,a8 as rs,bg as ls,aB as jo,I as to,ar as sa,a3 as cs}from"./trail-props-BWawlPoR.js";import{y as go}from"./server-pick-iUApIc3u.js";const j={gradient:[.35,.7,1],terrainGradient:[.6,.82,1],terrainContactAO:{direct:.25,indirect:.35},localLightCap:.45,outline:{day:"#3b2f2a",night:"#1d2a44",strength:{day:0,sunset:1,night:1},width:[1,1,1.5],fadeNear:60,fadeFar:900,depthEdge:.012,normalEdge:.42},bloom:{day:{threshold:.85,strength:.35,radius:.45},sunset:{threshold:.8,strength:.35,radius:.5},night:{threshold:.55,strength:.9,radius:.6}},grade:{day:{saturation:.95,tint:"#8fc4c8",tintAmount:.05,contrast:1,lift:.01,shadowGain:0},sunset:{saturation:1.1,amber:"#ffb36b",violet:"#3b4f8c",tintAmount:.1,contrast:1.06,lift:0,shadowGain:.4},night:{saturation:.9,tint:"#16224a",tintAmount:.18,contrast:1,lift:.015,shadowGain:0},shadow:"#5f8fb0",shadowAmount:.35,dayShadowAmount:.18},sky:{day:{zenith:"#7aaed6",horizon:"#c3dcd4",cloud:"#eef4f1",cloudShade:"#b5d0d0"},sunset:{zenith:"#2c4d79",mid:"#7d66ab",pink:"#d19caf",horizon:"#fadfca",cloud:"#b48ea5",cloudShade:"#9f7e9b",cloudLit:"#ca9eab"},night:{zenith:"#172432",horizon:"#4f5b74",city:"#c4bfcd",cloud:"#3a5676",cloudShade:"#273e58",cloudLit:"#4c6d94"},bands:[.08,.18,.3],starIntensity:1.6,stars:{cells:120,share:.012,bright:.035,smallPx:1,brightPx:1.8,milkyBoost:4,small:.3,big:.6},milky:{from:[300,5],to:[30,55],width:.11,color:"#5d6d94",dust:"#141c2c",strength:.5},cityGlow:{bearing:345,strength:1,height:.16,input:"#cdc2c2",bino:{color:"#5a3f63",height:.05,horizonDim:.45}},cover:{sunset:.72,night:.3}},nightExposure:.42,nightLight:.5,sunsetLight:.3,sunsetHaze:{color:"#65545e",density:3e-4},city:{litMin:.35,litMax:.6,lampGain:1.2,roadLightGain:.45},lampPole:"#8d9a93",foliage:{waveA:"#a8d06a",waveB:"#6f9f4a",leafWave:.22,top:1.12,bottom:.68,grassFlat:{strength:1,brightness:1},needleFlat:{strength:.88,brightness:.62},sunsetDim:.4,nightDim:.6},terrain:{meadow:"#a3d27a",meadowFar:"#a6c993",forest:"#4f8434",highForest:"#6a9a4a",rock:"#8c9391",rockDark:"#4b5853",soil:"#b08a5e",ridgeHeight:520,forestHeight:430,rockSlope:.28,rockHeight:[500,600],summitHeight:[600,625],forestScale:70,rockScale:45,haze:"#8eaec4",hazeDensity:22e-5,brushNear:1.1,brushMid:4.5,brushAmount:.1,washAmount:.07,rockBrush:1.1,rockBrushAmount:.22},nature:{leaf:"#7cba48",leafShade:"#467f2c",trunk:"#8a8068",pine:"#4f7a58",pineShade:"#36584a",pineTrunk:"#5f4a3a",sapling:"#668760",saplingShade:"#4c6a52",bush:"#76ab4e",bushShade:"#4c7c36",grassBase:"#5f9550",grassTip:"#a2cf6c",grassBand:"#aed690",flowerA:"#f7e45c",flowerB:"#e6e2d2",flowerShare:.12,clumpDark:.68,bandAmount:.5,rim:.3,rock:"#8c9391",rockDark:"#4b5853",moss:"#8fb25a",mossDark:"#5c853d",mossLevel:.84,rockShadeTint:[.8,1,1.02],rockShadeDirect:.22,leafCell:.5,leafLight:.16,leafGap:.24},rock:{granite:"#a0a4a6",spread:.15},pattern:{amount:.85,dark:.8,light:1.15,darkTone:.8,lightTone:1.12,fadeNear:12,fadeFar:50,warmth:.35,gain:2.2,minLuma:.12,maxLuma:.36},trail:{soil:"#a48c70",rock:"#8c9391",paved:"#bdb6aa",stairs:"#a39a8c",deck_stairs:"#a0764a",ridge:"#a9aeab"},water:"#3e8878",stream:{day:{deep:"#3e8878",shallow:"#8bc6af",foam:"#e6f3ee",streak:"#6fae9e",sparkle:1},sunset:{deep:"#a4889c",shallow:"#dcc8c4",foam:"#fff0ea",streak:"#f3dcd6",sparkle:.8},night:{deep:"#26393a",shallow:"#394746",foam:"#7f9399",streak:"#4b5f62",sparkle:.15},opacity:.9,bed:"#8c9391"},lightShafts:.4},fs=Object.keys(j.trail),Tt=(e,t=0,o=1)=>Math.max(t,Math.min(o,e)),ia=(e,t,o)=>{const a=Tt((o-e)/(t-e));return a*a*(3-2*a)},Yt=(e,t,o)=>e+(t-e)*o;function lt(e){const t=parseInt(String(e).replace("#",""),16);return[(t>>16&255)/255,(t>>8&255)/255,(t&255)/255]}const ue=(e,t,o)=>e.map((a,i)=>Yt(a,t[i],o));function Rt(e={}){const t=Number.isFinite(e.elevation)?e.elevation:30,o=Tt(Number.isFinite(e.night)?e.night:ia(-2,-12,t)),a=ia(6,16,t),i=Tt(a*(1-o)),s=Tt((1-a)*(1-o));return{day:i,sunset:s,night:o}}const Ft=(e,t,o,a)=>t*e.day+o*e.sunset+a*e.night,eo=(e,t,o,a)=>[0,1,2].map(i=>Ft(e,t[i],o[i],a[i]));function us(e){const t=Rt(e),{day:o,sunset:a,night:i}=j.bloom;return{threshold:Ft(t,o.threshold,a.threshold,i.threshold),strength:Ft(t,o.strength,a.strength,i.strength),radius:Ft(t,o.radius,a.radius,i.radius)}}function ds(e={}){const t=Rt(e),o=j.grade,a=Tt(e.gray??0),i=lt(o.day.tint),s=lt(o.sunset.amber),n=lt(o.sunset.violet),r=lt(o.night.tint),l=eo(t,i,s,r),c=eo(t,lt(o.shadow),n,r);return{saturation:Ft(t,o.day.saturation,o.sunset.saturation,o.night.saturation)*Yt(1,.8,a),contrast:Ft(t,o.day.contrast,o.sunset.contrast,o.night.contrast),lift:Ft(t,o.day.lift,o.sunset.lift,o.night.lift),shadowGain:Ft(t,o.day.shadowGain,o.sunset.shadowGain,o.night.shadowGain),highlight:l,highlightAmount:Ft(t,o.day.tintAmount,o.sunset.tintAmount,o.night.tintAmount)*Yt(1,.5,a),shadow:ue(lt(o.shadow),c,.5),shadowAmount:(o.shadowAmount+(o.dayShadowAmount-o.shadowAmount)*t.day)*Yt(1,.6,t.night)}}function ms(e){const t=Rt(e),o=j.outline.strength;return{color:ue(lt(j.outline.day),lt(j.outline.night),t.night),strength:Ft(t,o.day,o.sunset,o.night),fadeNear:j.outline.fadeNear,fadeFar:j.outline.fadeFar}}function hs(e=1){return j.outline.width[Tt(Math.round(e),0,2)]}function ps(e={}){const t=Rt(e),o=j.sky,a=Tt(e.gray??0),i=(c,u)=>c[u]?lt(c[u]):u==="mid"?ue(lt(c.horizon),lt(c.zenith),.65):u==="pink"?ue(lt(c.horizon),lt(c.zenith),.3):u==="cloudLit"?lt(c.cloud):u==="city"?lt(c.horizon):null,s=c=>c==="city"?lt(o.cityGlow.input):i(o.night,c)??lt(o.night[c]),n=c=>eo(t,i(o.day,c)??lt(o.day[c]),i(o.sunset,c)??lt(o.sunset[c]),s(c)),r=c=>{const u=c[0]*.2126+c[1]*.7152+c[2]*.0722;return ue(c,[u,u,u],a*.75)},l=Tt(.35+.55*(e.cloud??0));return{zenith:r(n("zenith")),mid:r(n("mid")),pink:r(n("pink")),horizon:r(n("horizon")),city:r(n("city")),cloud:r(n("cloud")),cloudShade:r(n("cloudShade")),cloudLit:r(n("cloudLit")),stars:Tt(Math.max(e.stars??t.night*(1-a),t.sunset*.12*(1-a)))*o.starIntensity,milky:Tt(t.night*(1-a)*(1-Tt((e.moon?.illumination??0)*(e.moon?.visible??0))*.5))*o.milky.strength,cityGlow:t.night*o.cityGlow.strength*(1-a*.5),cloudCover:Tt(Ft(t,l,Math.max(o.cover.sunset,l),Math.max(o.cover.night,l))),weights:t}}function vo(e,t=0){const o=e*Math.PI/180,a=t*Math.PI/180;return[Math.sin(o)*Math.cos(a),Math.sin(a),-Math.cos(o)*Math.cos(a)]}function gs(e={}){return Yt(1,j.nightExposure,Rt(e).night)}function vs(e={}){const t=Rt(e);return t.day+t.sunset*j.sunsetLight+t.night*j.nightLight}function ra(e={}){const t=Rt(e),o=j.stream,a=Tt(e.gray??0),i=n=>{const r=n[0]*.2126+n[1]*.7152+n[2]*.0722;return ue(n,[r,r,r],a*.5)},s=n=>i(eo(t,lt(o.day[n]),lt(o.sunset[n]),lt(o.night[n])));return{deep:s("deep"),shallow:s("shallow"),foam:s("foam"),streak:s("streak"),sparkle:Ft(t,o.day.sparkle,o.sunset.sparkle,o.night.sparkle)*(1-a*.8),opacity:o.opacity,bedRgb:lt(o.bed),weights:t}}function xs(e={}){const t=Tt((e.windSpeed??3)/12,0,1);return{speed:Yt(.8,2.2,t),strength:Yt(.7,1,t)}}function Ua(e=j.gradient){if(!e.length||e.length>3)throw new Error("gradientMap은 1~3단");const t=new Uint8Array(e.length*4);e.forEach((a,i)=>{const s=Math.round(Math.max(0,Math.min(1,a))*255);t.set([s,s,s,255],i*4)});const o=new Rn(t,e.length,1,Nn);return o.minFilter=o.magFilter=Pn,o.generateMipmaps=!1,o.colorSpace=Wn,o.name=`toon-gradient-${e.length}`,o.userData.shared=!0,o.userData.levels=[...e],o.needsUpdate=!0,o}const Ao=/[?&]fx=off(&|$)/.test(globalThis.location?.search??""),vt={fxTime:{value:0},fxSun:{value:new P(0,1,0)},fxSunVis:{value:1},fxLowSun:{value:0},fxQuality:{value:2},fxRain:{value:0},fxWind:{value:.3}},ze={dapple:{scale:.34},shafts:{count:[16,40,64],radius:15,height:16,strength:1.15,warmLow:.55},canopy:{from:430,to:520,summitFrom:600,summitTo:625,ridgeFloor:.28,summitFloor:.1}},Ve=(e,t=0,o=1)=>Math.max(t,Math.min(o,e)),oo=(e,t,o)=>{const a=Ve((o-e)/(t-e));return a*a*(3-2*a)};function tl(e,t=ze.canopy){if(!Number.isFinite(e))return 1;const o=oo(t.from,t.to,e),a=oo(t.summitFrom,t.summitTo,e),i=1+(t.ridgeFloor-1)*o;return i+(t.summitFloor-i)*a}function el({time:e,sunVector:t,environment:o,quality:a=2,mobile:i=!1,camera:s=null}){const n=o,r=n.light?.elevation??n.elevation??45;vt.fxTime.value=e,vt.fxSun.value.copy(t);const l=Ao?0:Ve((n.light?.intensity??1)*(1-.9*(n.gray??0))*(1-(n.night??0)))*oo(1,7,r);return vt.fxSunVis.value=l,vt.fxLowSun.value=oo(38,6,r)*l,vt.fxQuality.value=i?0:a,vt.fxRain.value=Ve(n.rain??0),vt.fxWind.value=Ve((n.windSpeed??2)/9),{direct:l,elevation:r}}`${ze.canopy.from.toFixed(1)}${ze.canopy.to.toFixed(1)}${ze.dapple.scale.toFixed(3)}`;const ys=`
attribute vec4 aSeed;
uniform vec3 fxSun;uniform float fxLowSun;uniform vec3 fxCam;uniform float fxRadius;uniform float fxHeight;uniform float fxWidthMul;uniform float fxCount;
varying vec2 vUv;varying float vFade;varying float vSeed;varying float vLow;varying float vRel;varying float vBright;
void main(){
 vec2 seed=aSeed.xy;
 // 카메라 둘레 [-R,R]² 안의 한 점. 카메라가 움직이면 반대쪽 가장자리로 되감기지만 가장자리에서는 투명하다.
 vec2 off=mod(seed*fxRadius*2.-fxCam.xz+fxRadius,fxRadius*2.)-fxRadius;
 float edge=1.-smoothstep(.62,1.,length(off)/fxRadius);
 vec3 foot=vec3(fxCam.x+off.x,fxCam.y-1.8,fxCam.z+off.y);
 vec3 axis=normalize(vec3(fxSun.x,max(fxSun.y,.16),fxSun.z));
 float len=min(fxHeight/axis.y,52.);
 vec3 top=foot+axis*len;
 vec3 V=normalize(cameraPosition-foot);
 vec3 side=normalize(cross(axis,V));
 float width=(.55+1.9*aSeed.z*aSeed.z+.5*aSeed.w)*fxWidthMul;
 vec3 p=mix(foot,top,uv.y)+side*(uv.x-.5)*width;
 vUv=uv;vSeed=aSeed.w;vLow=fxLowSun;
 float dist=length(cameraPosition-foot);
 vFade=edge*smoothstep(2.5,9.,dist);
 vRel=p.y-fxCam.y;vBright=.25+1.35*aSeed.w*aSeed.w;
 gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);
}`,ws=`
uniform float fxTime;uniform float fxStrength;uniform vec3 fxColor;uniform float fxQuality;uniform float fxCanopy;uniform float fxSunVis;
varying vec2 vUv;varying float vFade;varying float vSeed;varying float vLow;varying float vRel;varying float vBright;
float shH(vec2 p){p=fract(p*vec2(.1031,.1030));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.x);}
float shN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(shH(i),shH(i+vec2(1,0)),f.x),mix(shH(i+vec2(0,1)),shH(i+vec2(1,1)),f.x),f.y);}
void main(){
 float across=1.-abs(vUv.x*2.-1.);
 float soft=pow(smoothstep(0.,1.,across),1.25);
 // 위는 잎 틈에서 시작해 서서히 퍼지고 아래는 땅 가까이에서 옅어진다.
 float along=smoothstep(0.,.16,vUv.y)*(1.-smoothstep(.55,1.,vUv.y))*(.55+.45*vUv.y);
 // 잎 틈 모양(위로 갈수록 빛이 모인 줄무늬)과 떠다니는 먼지.
 float streak=.25+.75*smoothstep(.25,.75,shN(vec2(vUv.x*5.+vSeed*40.,vUv.y*1.8-fxTime*.05)));
 // 눈높이 위로 올라갈수록 옅어진다(하늘을 배경으로 한 흰 기둥처럼 보이지 않게, 줄기 사이 어두운 숲에서만 또렷하다).
 float heightFade=1.-smoothstep(2.,10.,vRel);
 float dust=1.;
 if(fxQuality>.5)dust=.7+.6*shN(vec2(vUv.x*4.+vSeed*17.,vUv.y*7.-fxTime*.22+vSeed*9.));
 float shimmer=.82+.18*sin(fxTime*.7+vSeed*40.);
 float a=soft*along*streak*dust*shimmer*vFade*heightFade*vBright*fxStrength*fxCanopy*fxSunVis;
 a*=1.+.45*vLow;
 gl_FragColor=vec4(fxColor*a,a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;function ol({mobile:e=!1}={}){const t=ze.shafts,o=t.count[2],a=new Uo(1,1,1,1),i=new Ln;i.index=a.index,i.attributes.position=a.attributes.position,i.attributes.uv=a.attributes.uv;const s=new Float32Array(o*4),n=f=>(f=f*.1031%1,f*=f+33.33,f*=f+f,f-Math.floor(f));for(let f=0;f<o;f++)s.set([n(f*3.7+1),n(f*5.3+2),n(f*7.9+3),n(f*11.1+4)],f*4);i.setAttribute("aSeed",new Bn(s,4)),i.instanceCount=t.count[e?0:2];const r={...vt,fxCam:{value:new P},fxRadius:{value:t.radius},fxHeight:{value:t.height},fxWidthMul:{value:1},fxCount:{value:o},fxStrength:{value:t.strength},fxColor:{value:new nt(1,.92,.72)},fxCanopy:{value:1}},l=new St({uniforms:r,vertexShader:ys,fragmentShader:ws,transparent:!0,depthWrite:!1,depthTest:!1,blending:Qe,side:zt,fog:!1,toneMapped:!0}),c=new _t(i,l);c.frustumCulled=!1,c.renderOrder=5,c.name="빛줄기";const u=new nt;return{mesh:c,material:l,update({camera:f,sunColor:h,quality:m,canopy:d,lowSun:g}){const p=l.uniforms;p.fxCam.value.copy(f.position),u.setRGB(...h,ht);const y=vt.fxLowSun.value*t.warmLow;p.fxColor.value.set(1,.93-.18*y,.78-.38*y).multiply(u.clone().multiplyScalar(1/Math.max(.001,Math.max(u.r,u.g,u.b)))),p.fxCanopy.value=d,i.instanceCount=t.count[e?0:Math.max(0,Math.min(2,m))],c.visible=d*vt.fxSunVis.value>.02&&i.instanceCount>0,p.fxWidthMul.value=1+.25*g}}}const te={foliageTime:{value:0}};function Va(e=""){return/_(leaves|twig)$/.test(e)?"leaf":/(branch|trunk|bark|dead)/.test(e)?"bark":"card"}function bs(e,{name:t=e.name,pine:o=!1}={}){if(!e||e.userData.foliagePatched)return e;const a=Va(t),i=e.onBeforeCompile,s=e.customProgramCacheKey?.bind(e),n=o?.55:1,r=a==="bark"?0:o?.45:.85,l=a==="bark"?0:a==="leaf"?1:.35;return e.userData.foliagePatched={kind:a,pine:o,recolor:n,transmission:r,sway:l},e.onBeforeCompile=function(c,u){i?.call(this,c,u),c.uniforms.foliageTime=te.foliageTime,c.uniforms.fxSunVis=vt.fxSunVis,c.uniforms.fxLowSun=vt.fxLowSun,c.vertexShader=c.vertexShader.replace("#include <common>",`#include <common>
uniform float foliageTime;
varying vec3 vFoliageTint;`).replace("#include <begin_vertex>",`#include <begin_vertex>
   // 인스턴스 색이 있는 나무만 잎 색을 입힌다. 입구 표본처럼 색이 없으면 원래 텍스처를 쓴다.
   #ifdef USE_INSTANCING_COLOR
   vFoliageTint=instanceColor.rgb;
   #else
   vFoliageTint=vec3(-1.);
   #endif
   #ifdef USE_INSTANCING
   {
    // 줄기 아래는 고정하고 위로 갈수록 크게, 잎 끝은 빠르게 떨린다. 나무마다 위상이 다르다.
    vec3 foliageAnchor=instanceMatrix[3].xyz;
    float foliageHeight=max(0.,position.y);
    float foliageGust=sin(foliageTime*1.1+foliageAnchor.x*.07+foliageAnchor.z*.05)*.6+sin(foliageTime*2.3+foliageAnchor.z*.11)*.4;
    float foliageFlutter=sin(foliageTime*5.7+dot(position,vec3(3.1,2.3,2.7)));
    transformed.x+=(${(.006*l).toFixed(4)}*foliageGust*foliageHeight)+${(.012*l).toFixed(4)}*foliageFlutter*min(foliageHeight,1.);
    transformed.z+=(${(.004*l).toFixed(4)}*foliageGust*foliageHeight)+${(.009*l).toFixed(4)}*foliageFlutter*min(foliageHeight,1.);
   }
   #endif`),c.fragmentShader=c.fragmentShader.replace("#include <common>",`#include <common>
uniform float fxSunVis;uniform float fxLowSun;
float foliageLeafMask=0.;
varying vec3 vFoliageTint;`).replace("#include <color_fragment>",`
    // 초록 성분이 강한 텍셀을 잎으로 본다. 잎 재질은 전체를 잎으로 둔다.
    vec3 foliageTexel=diffuseColor.rgb;
    float foliageGreen=smoothstep(.004,.05,foliageTexel.g-max(foliageTexel.r,foliageTexel.b)*.8);
    foliageLeafMask=${a==="bark"?"0.":a==="leaf"?"max(.85,foliageGreen)":"foliageGreen"};
    #include <color_fragment>
    if(vFoliageTint.r>=0.){
     float foliageLuma=dot(foliageTexel,vec3(.2126,.7152,.0722));
     // 잎은 텍스처 명도×잎 색, 줄기는 원래 텍스처를 살짝 따뜻하게(인스턴스 색이 줄기를 주황으로 칠하지 않게).
     vec3 foliageLeaf=vFoliageTint*foliageLuma*2.6;
     vec3 foliageBark=foliageTexel*vec3(1.,.97,.93);
     diffuseColor.rgb=mix(foliageBark,mix(foliageTexel*vFoliageTint,foliageLeaf,${n.toFixed(2)}),foliageLeafMask);
    }`).replace("#include <lights_fragment_end>",`#include <lights_fragment_end>
    #if NUM_DIR_LIGHTS > 0 && ${r>0?1:0}
    {
     // 해를 등진 잎이 비쳐 보이는 투과광. 시선이 해 쪽을 향할수록, 잎 뒷면이 해를 받을수록 밝다.
     vec3 foliageL=directionalLights[0].direction,foliageV=normalize(vViewPosition);
     float foliageBack=pow(clamp(dot(-foliageV,foliageL),0.,1.),4.);
     float foliageThrough=clamp(-dot(normal,foliageL),0.,1.);
     vec3 foliageGlow=diffuseColor.rgb*vec3(1.,.93,.7)*directionalLights[0].color*(foliageBack*.9+foliageThrough*.28);
     reflectedLight.directDiffuse+=foliageGlow*foliageLeafMask*${r.toFixed(2)};
     // 역광 잎 투과광 강화(light-fx): 맑은 날 해를 마주 보면 잎이 노랗게 비치고, 해가 낮을수록 더 진하다. ?fx=off·흐림·밤엔 0.
     float foliageRim=pow(clamp(dot(-foliageV,foliageL),0.,1.),2.5)*fxSunVis*(.5+.9*fxLowSun);
     reflectedLight.directDiffuse+=diffuseColor.rgb*vec3(1.25,1.,.5)*directionalLights[0].color*foliageRim*foliageLeafMask*${r.toFixed(2)};
    }
    #endif`)},e.customProgramCacheKey=()=>`${s?.()??""}|foliage-v2-${a}-${o?"pine":"broad"}`,e.needsUpdate=!0,e}function Ss(){const e=new At({color:16777215,roughness:.92,envMapIntensity:.35,side:zt});return e.onBeforeCompile=t=>{t.uniforms.foliageTime=te.foliageTime,t.uniforms.fxSunVis=vt.fxSunVis,t.uniforms.fxLowSun=vt.fxLowSun,t.vertexShader=t.vertexShader.replace("#include <common>",`#include <common>
uniform float foliageTime;
attribute float shrubShade;
varying float vShrubShade;`).replace("#include <begin_vertex>",`#include <begin_vertex>
   vShrubShade=shrubShade;
   #ifdef USE_INSTANCING
   vec3 shrubAnchor=instanceMatrix[3].xyz;float shrubTip=position.y*position.y;
   transformed.x+=sin(foliageTime*1.4+shrubAnchor.x*.13+shrubAnchor.z*.09)*shrubTip*.07+sin(foliageTime*6.1+dot(position,vec3(7.,5.,6.)))*.012*position.y;
   transformed.z+=sin(foliageTime*1.05+shrubAnchor.z*.11)*shrubTip*.05;
   #endif`),t.fragmentShader=t.fragmentShader.replace("#include <common>",`#include <common>
uniform float fxSunVis;uniform float fxLowSun;
varying float vShrubShade;`).replace("#include <color_fragment>",`#include <color_fragment>
diffuseColor.rgb*=vShrubShade;`).replace("#include <lights_fragment_end>",`#include <lights_fragment_end>
    #if NUM_DIR_LIGHTS > 0
    {
     vec3 shrubL=directionalLights[0].direction,shrubV=normalize(vViewPosition);
     float shrubBack=pow(clamp(dot(-shrubV,shrubL),0.,1.),4.),shrubThrough=clamp(-dot(normal,shrubL),0.,1.);
     reflectedLight.directDiffuse+=diffuseColor.rgb*vec3(1.,.92,.7)*directionalLights[0].color*(shrubBack*.8+shrubThrough*.3)*.45;
     reflectedLight.directDiffuse+=diffuseColor.rgb*vec3(1.25,1.,.5)*directionalLights[0].color*pow(clamp(dot(-shrubV,shrubL),0.,1.),2.5)*fxSunVis*(.4+.7*fxLowSun)*.5;
    }
    #endif`)},e.customProgramCacheKey=()=>"shrub-layer-wind-v2-rim",e}const la="toon-local-light-cap",xo="#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )";function Ms(e=j.localLightCap){const t=En.toon;if(t.fragmentShader.includes(la))return!0;const o=Do.lights_fragment_begin;if(!o.includes(xo)||!t.fragmentShader.includes("#include <lights_fragment_begin>"))return!1;const a=o.replace(xo,`// ${la}
 {vec3 tlK=material.diffuseColor*${e.toFixed(3)}+1e-4;reflectedLight.directDiffuse=reflectedLight.directDiffuse*tlK/(reflectedLight.directDiffuse+tlK);}
${xo}`);return t.fragmentShader=t.fragmentShader.replace("#include <lights_fragment_begin>",a),!0}const Ro=`
float trcOcc=1.;
vec3 trcHash3(vec3 p){p=mod(p,289.);p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)));return fract(sin(p)*43758.5453);}
// xyz: 셀 중심 → 이 점(셀 단위)을 가까운 셀끼리 부드럽게 섞은 값(경계에서 법선이 꺾이지 않고 둥근 골이 된다),
// w: 두 번째로 가까운 셀과의 거리 차(경계에서 0).
vec4 trcCells(vec3 p){
 vec3 i=floor(p),f=fract(p),acc=vec3(0.);float d1=8.,d2=8.,ws=0.;
 for(int z=-1;z<=1;z++)for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
  vec3 g=vec3(float(x),float(y),float(z)),r=g+trcHash3(i+g)*.8+.1-f;float d=dot(r,r),w=exp(-13.*d);
  acc-=r*w;ws+=w;
  if(d<d1){d2=d1;d1=d;}else if(d<d2)d2=d;
 }
 return vec4(acc/max(ws,1e-5),sqrt(d2)-sqrt(d1));
}
// px: 한 픽셀이 덮는 월드 크기(m). 거리와 보는 각도로 매끄럽게 어림한다(화면 높이 약 800px, 시야 60°).
// fwidth로 재면 옆으로 누운 면에서 2×2 픽셀마다 값이 튀어 점무늬가 생긴다.
float trcPixel(vec3 wp,vec3 wn){vec3 v=wp-cameraPosition;float d=length(v);return d*.0014/max(abs(dot(v/d,wn)),.15);}
// 셀 경계를 둥글게: 찾는 자리를 매끄러운 값 잡음으로 흔든다(직선 경계 → 굽은 경계, 보도블록·육각 판처럼 읽히지 않게).
vec3 trcWarp(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(trcHash3(i),trcHash3(i+vec3(1,0,0)),f.x),mix(trcHash3(i+vec3(0,1,0)),trcHash3(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(trcHash3(i+vec3(0,0,1)),trcHash3(i+vec3(1,0,1)),f.x),mix(trcHash3(i+vec3(0,1,1)),trcHash3(i+vec3(1,1,1)),f.x),f.y),f.z)-.5;}
// wn: 월드 법선, cell: 셀 크기(m), amt: 굴곡 세기. crack: 덩어리 사이 갈라짐(0~1, 가는 선).
// 덩어리는 반구(둥근 암괴): 중심에서 멀수록 법선이 크게 기울어, 밝은 면·그늘 면 경계가 직선이 아니라 둥근 호가 된다.
// 셀이 픽셀보다 잘아지면(먼 곳·옆으로 누운 면) 갈라짐부터, 이어 굴곡을 접어 점무늬(계단 잡음)를 막는다.
vec3 trcBump(vec3 wp,vec3 wn,vec3 cell,float amt,float px,out float crack){
 float k=px/cell.x,near=1.-smoothstep(.06,.25,k);crack=0.;
 if(near<=0.)return wn;
 vec3 q=wp/cell,wv=trcWarp(q*.55+3.1);q+=wv*.75;
 vec4 c=trcCells(q);
 vec3 dome=c.xyz*(cell.x/cell);dome-=wn*dot(dome,wn);
 vec3 o=dome*amt*near*1.35;
 // 가까이는 작은 혹(셀의 0.4배)을 한 겹 더 얹는다. 발밑에서 큰 덩어리 하나가 평평한 판으로 읽히지 않게.
 float k2=k/.4,near2=1.-smoothstep(.06,.2,k2);
 if(near2>0.){vec4 c2=trcCells(q/.4+7.3);vec3 d2=c2.xyz*(cell.x/cell);d2-=wn*dot(d2,wn);o+=d2*amt*near2*.75;}
 float o2=min(dot(o,o),.86);
 float w=max(.006,k*1.2),at=.012;
 // 갈라짐은 모든 경계에 긋지 않고 몇 셀 길이씩 끊는다(돌담·포석 그물처럼 읽히지 않게).
 crack=(1.-smoothstep(at-w,at+w,c.w))*(1.-smoothstep(.012,.04,k))*smoothstep(-.06,.1,wv.y);
 // 덩어리 사이 골은 넓고 부드럽게 어둡게(접촉 그늘): 평평한 바닥에서도 혹이 솟아 보이게 한다.
 trcOcc=mix(1.,mix(.74,1.,smoothstep(.0,.32,c.w)),near);
 return normalize(o+wn*sqrt(1.-o2));
}
// 각진 면(카툰 2차, 「야생의 숨결」 절벽): 셀마다 한 방향으로 기운 평평한 면. 셀 안에서는 법선이 일정해서
// 경계가 갈라짐 선이 아니라 명암이 꺾이는 모서리로 읽힌다(육각 그물 선을 긋지 않는다). id: 셀 난수(붓 방향용).
vec3 trcFacet(vec3 wp,vec3 wn,vec3 cell,float amt,float px,out vec3 id){
 float k=px/cell.x,near=1.-smoothstep(.08,.3,k);id=vec3(.5);
 if(near<=0.)return wn;
 vec3 q=wp/cell;q+=trcWarp(q*.45+3.1)*.9;
 vec3 i=floor(q),f=fract(q);float d1=8.;vec3 best=i;
 for(int z=-1;z<=1;z++)for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
  vec3 g=vec3(float(x),float(y),float(z)),r=g+trcHash3(i+g)*.8+.1-f;float d=dot(r,r);
  if(d<d1){d1=d;best=i+g;}
 }
 id=trcHash3(best*1.37+11.);
 vec3 t=id-.5;t.y*=.6;t-=wn*dot(t,wn);
 return normalize(wn+t*amt*near*1.5);
}
// 야숨 바위 칠(카툰 2차 재판정, 참고 04_19·04_20·04_09): 회색 바탕에 크고 작은 어두운 녹회 얼룩(빗물 자국처럼 세로로 조금 길다),
// 얼룩 사이 밝은 회백 결, 위를 향한 면과 얼룩 속 이끼. 선(갈라짐·띠)은 긋지 않는다. 얼룩이 픽셀보다 잘아지면 접는다.
// mossAmt: 이끼 양(0 = 윗면 일부, 높을수록 넓게). moss: 이끼 덮임(0~1, 그늘 면 계산에서 뺀다).
float trcFadeAt(float px,float size){return 1.-smoothstep(.2,.7,px/size);}
vec3 trcPaint(vec3 wp,vec3 wn,vec3 base,vec3 dark,vec3 mossC,vec3 mossD,float px,float mossAmt,out float moss){
 vec3 q=wp*vec3(1.,.5,1.);
 float fm=trcFadeAt(px,1.),ff=trcFadeAt(px,.38);
 float big=trcWarp(q*.28+1.3).x+trcWarp(q*.66+6.7).y*.5,mid=trcWarp(q*1.1+4.1).y,fine=trcWarp(q*2.6+8.2).z;
 float n=big*.5+mid*.38*fm+fine*.2*ff;
 // 얼룩 가장자리는 짧은 붓 끝처럼 또렷하게(흐린 연기처럼 번지지 않게), 안쪽은 두 단(짙은 얼룩·중간 얼룩).
 float blot=smoothstep(.0,.03,n),deep=smoothstep(.16,.2,n+fine*.25*ff);
 vec3 col=mix(base*1.06,mix(base,dark,.62),blot);col=mix(col,dark*.92,deep*.5);
 col*=1.+smoothstep(-.1,-.16,n)*.08+(fine*.3+mid*.12)*ff;
 // 이끼: 위를 향한 면은 넓게, 급한 면도 얼룩 따라 군데군데(참고 04_09·04_19 벽면의 녹색 이끼).
 float mn=trcWarp(wp*.37+12.).x+trcWarp(wp*1.25+3.).y*.45;
 // 위를 향한 면도 전부 덮지 않고 얼룩진다(평평한 암반 바닥이 통째로 초록이 되지 않게). mossAmt 0이면 윗면 약 45%, 옆면 약 15%.
 moss=smoothstep(.0,.05,mn*.9+wn.y*.25-.3+mossAmt+blot*.12+fine*.15*ff);
 // 옆면 이끼는 짙은 이끼색 쪽(밝은 연두 물감이 벽에 튄 것처럼 보이지 않게).
 col=mix(col,mix(mossD,mossC,smoothstep(-.25,.3,mn+fine*.6*ff)*smoothstep(.2,.8,wn.y)),moss);
 return col;
}`,No="vec3 trcBaseN=vec3(0.,0.,1.);",Po=(e,t)=>`
#if NUM_DIR_LIGHTS > 0
{
 vec3 trcL=directionalLights[0].direction;float trcNdl=dot(normal,trcL);
 float trcBase=dot(trcBaseN,trcL),trcAway=smoothstep(.08,.3,trcBase-trcNdl);
 float trcShade=max(max(1.-smoothstep(-.08,.22,trcNdl),trcAway),1.-smoothstep(0.,.25,trcBase))*${e};
 // 툰 단계 안에서도 덩어리 안쪽에 부드러운 명암을 남긴다(한 덩어리가 단색 판으로 읽히지 않게, 둥근 굴곡).
 float trcUp=dot(normal,(viewMatrix*vec4(0.,1.,0.,0.)).xyz);
 reflectedLight.directDiffuse*=mix(1.,mix(.62,1.12,smoothstep(-.1,.85,trcNdl))*trcOcc,${e});
 reflectedLight.indirectDiffuse*=mix(1.,mix(.72,1.12,trcUp*.5+.5)*trcOcc,${e});
 reflectedLight.directDiffuse=mix(reflectedLight.directDiffuse,BRDF_Lambert(diffuseColor.rgb)*directionalLights[0].color*${t},trcShade);
}
#endif`,je=`
float bsHash(vec2 p){p=fract(p*vec2(.1031,.1030));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.x);}
float bsNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(bsHash(i),bsHash(i+vec2(1,0)),f.x),mix(bsHash(i+vec2(0,1)),bsHash(i+vec2(1,1)),f.x),f.y);}
// 붓질 값(-1~1): p 평면 좌표(m), dir 붓 방향(단위 벡터), w 붓 자국 폭(m). 자국 길이는 폭의 약 3.5배.
float bsStroke(vec2 p,vec2 dir,float w){
 vec2 q=vec2(dot(p,dir),dot(p,vec2(-dir.y,dir.x)))/w;
 q.x*=.28;
 q.y+=(bsNoise(q*vec2(.9,.35)+3.1)-.5)*1.6;
 float n=bsNoise(q)*.62+bsNoise(q*vec2(2.1,2.03)+vec2(7.3,1.1))*.38;
 return n*2.-1.;
}
// 붓 자국이 픽셀보다 얼마나 큰지에 따른 세기(1 = 또렷, 0 = 접음). px: 한 픽셀의 월드 크기(m).
float bsFade(float px,float w){return 1.-smoothstep(.12,.45,px/w);}
// 면 위 좌표: 법선 n에 수직인 두 축(가로·비탈 방향). 수평 면은 월드 xz.
vec2 bsPlane(vec3 p,vec3 n){
 vec3 t=cross(vec3(0.,1.,0.),n);float l=length(t);
 if(l<.25)return p.xz;
 t/=l;vec3 b=cross(n,t);
 return vec2(dot(p,t),dot(p,b));
}
`,ja={spring:0,summer:1,autumn:2,winter:3},Ce={tsW:{value:new $a(0,1,0,0)}},Wt=e=>new nt().setRGB(...lt(e),ht),ao=e=>e.r*.2126+e.g*.7152+e.b*.0722,ct=e=>`vec3(${e.r.toFixed(4)},${e.g.toFixed(4)},${e.b.toFixed(4)})`,ks=ao(Wt("#7cba48"))/ao(Wt("#61973b")),zs=ao(Wt("#467f2c"))/ao(Wt("#3f7124")),Ts=(e,t)=>({lit:Wt(e).multiplyScalar(ks),shade:Wt(t).multiplyScalar(zs)}),Ka={cherry:["#f7cbd8","#dc9bb1"],cherryPale:["#f6dee3","#d2b0b9"],newLeaf:["#9cc95c","#719a3f"],azalea:["#f08cb4","#c4628a"],red:["#d24a30","#943222"],orange:["#d68f38","#9a652a"],brown:["#b07a3e","#80582c"],yellow:["#e2b434","#a68226"],pine:["#4f7a3a","#36562a"],bark:["#5f554c","#433b35"],twig:["#8d8079","#6a5f5b"],snow:["#d2dbe8","#aebdd4"],trampled:["#a8a49f","#857f78"],litter:["#9a6e42","#704f30"],petal:["#f1d6dc","#f1d6dc"]},jt={red:.34,orange:.26,brown:.16,green:.03},oe={low:.36,high:.14,lowHeight:250,highHeight:450},_s=new Set(["snow","trampled","litter","petal","bark"]),ut=Object.fromEntries(Object.entries(Ka).map(([e,[t,o]])=>[e,_s.has(e)?{lit:Wt(t),shade:Wt(o)}:Ts(t,o)])),Cs={summer:null,spring:{meadow:"#b2dc80",meadowFar:"#b2d39c",forest:"#6a9c44",highForest:"#7cab55"},autumn:{meadow:"#c8b56c",meadowFar:"#bab18c",forest:"#a2672f",highForest:"#ab7c3e"},winter:{meadow:"#b3a58a",meadowFar:"#b9b3ab",forest:"#7d6e68",highForest:"#887b76"}},ae={spring:["#b8dc72","#78a84c"],autumn:["#e2c25c","#b48a3e"],winter:["#e2ddd2","#b9ab90"]},ca={summer:null,spring:["#6aa452","#b8de74"],autumn:["#9a7a3a","#e0bc62"],winter:["#cbd4e0","#a8987c"]},qt=`
uniform vec4 tsW;
float tsH(float x){return fract(sin(x*91.345+3.17)*47453.5453);}
float tsLuma(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
// 여름 잎의 밝은 면·그늘 사이 위치(0~1.3)로 계절 색 짝을 칠한다(덩어리 명암·잎 그늘을 그대로 옮긴다).
vec3 tsPair(float t,vec3 lit,vec3 shade){return mix(shade,lit,t);}
vec3 tsAutumn(float h,float t){
 return h<${jt.red.toFixed(3)}?tsPair(t,${ct(ut.red.lit)},${ct(ut.red.shade)}):
  h<${(jt.red+jt.orange).toFixed(3)}?tsPair(t,${ct(ut.orange.lit)},${ct(ut.orange.shade)}):
  h<${(jt.red+jt.orange+jt.brown).toFixed(3)}?tsPair(t,${ct(ut.brown.lit)},${ct(ut.brown.shade)}):
  h<${(1-jt.green).toFixed(3)}?tsPair(t,${ct(ut.yellow.lit)},${ct(ut.yellow.shade)}):vec3(-1.);
}
float tsCherry(float h,float y){return step(h,mix(${oe.low.toFixed(3)},${oe.high.toFixed(3)},smoothstep(${oe.lowHeight.toFixed(1)},${oe.highHeight.toFixed(1)},y)));}
vec3 tsSpringLeaf(float t,float h,float y){return mix(tsPair(t,${ct(ut.newLeaf.lit)},${ct(ut.newLeaf.shade)}),tsPair(t,${ct(ut.cherry.lit)},${ct(ut.cherry.shade)}),tsCherry(h,y));}
// 활엽수 잎: c = 여름 정점색, t = 밝은 면 위치, h = 나무 난수, y = 나무 밑동 높이(m).
vec3 tsLeafColor(vec3 c,float t,float h,float y){
 vec3 spring=tsSpringLeaf(t,h,y);
 vec3 a=tsAutumn(fract(h*7.13+.21),t);vec3 autumn=a.x<0.?c:a;
 return c*tsW.y+spring*tsW.x+autumn*tsW.z+c*tsW.w;
}
// 덤불·생울타리 잎: 봄은 새잎 연두에 진달래 분홍 약 20%, 가을은 단풍 섞임.
vec3 tsBushColor(vec3 c,float t,float h){
 vec3 spring=mix(tsPair(t,${ct(ut.newLeaf.lit)},${ct(ut.newLeaf.shade)}),tsPair(t,${ct(ut.azalea.lit)},${ct(ut.azalea.shade)}),step(fract(h*3.71),.2));
 vec3 a=tsAutumn(fract(h*5.31+.6),t);vec3 autumn=a.x<0.?c:a;
 return c*(tsW.y+tsW.w)+spring*tsW.x+autumn*tsW.z;
}
const vec3 TS_SNOW=${ct(ut.snow.lit)};const vec3 TS_SNOW_SHADE=${ct(ut.snow.shade)};
const vec3 TS_BARK=${ct(ut.bark.lit)};const vec3 TS_TWIG=${ct(ut.twig.lit)};const vec3 TS_TWIG_SHADE=${ct(ut.twig.shade)};
const vec3 TS_PINE=${ct(ut.pine.lit)};const vec3 TS_PINE_SHADE=${ct(ut.pine.shade)};
const vec3 TS_TRAMPLED=${ct(ut.trampled.lit)};const vec3 TS_TRAMPLED_SHADE=${ct(ut.trampled.shade)};
const vec3 TS_PETAL=${ct(Wt(Ka.petal[0]))};
const vec3 TS_RED=${ct(ut.red.lit)};const vec3 TS_ORANGE=${ct(ut.orange.lit)};const vec3 TS_YELLOW=${ct(ut.yellow.lit)};const vec3 TS_BROWN=${ct(ut.brown.lit)};
// 지형 셰이더가 그리는 중경 수관 덩어리 하나의 색(summer = 여름 색). 잎 재질보다 어둡게 둔다(원경 숲 톤).
vec3 tsCrown(vec3 summer,float h,float y){
 vec3 a=tsAutumn(fract(h*7.13+.21),.45);a=a.x<0.?summer:a*.72;
 return summer*tsW.y+tsSpringLeaf(.45,h,y)*.72*tsW.x+a*tsW.z+mix(TS_TWIG_SHADE,TS_TWIG,.35)*.8*tsW.w;
}
// 바위 이끼: 가을엔 누런 올리브, 겨울엔 마른 회갈색(초록 이끼가 눈·단풍 사이에서 튀지 않게).
vec3 tsMossTint(vec3 m){return m*(tsW.x+tsW.y)+m*vec3(1.2,.74,.42)*tsW.z+mix(m,vec3(.3,.28,.25),.8)*tsW.w;}
// 값 잡음. 해시는 sin을 쓰지 않는다(좌표가 수천 m라 sin 해시는 GPU 정밀도에서 넓은 곳이 한 값으로 뭉친다).
float tsHash2(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float tsN2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(tsHash2(i),tsHash2(i+vec2(1,0)),f.x),mix(tsHash2(i+vec2(0,1)),tsHash2(i+vec2(1,1)),f.x),f.y);}
// 쌓인 눈 양(0~1): 위를 향한 면(up)일수록, 겨울 가중치만큼. 가장자리는 잡음으로 굽힌다. 가파른 면(약 45° 이상)은 맨 바위.
float tsSnowCover(vec3 wp,float up,float lo,float hi){
 float n=tsN2(wp.xz*.55+wp.y*.3)*.6+tsN2(wp.xz*2.1+7.)*.4;
 return tsW.w*smoothstep(lo,hi,up+(n-.5)*.22);
}
// 길바닥에 떨어진 꽃잎(봄)·낙엽(가을): 잎 크기 칸마다 일부만 색을 얹는다. 반환 = (색, 양).
vec4 tsLitter(vec2 xz,float dist,float y){
 float fade=1.-smoothstep(18.,45.,dist);if(fade<=0.||tsW.x+tsW.z<.01)return vec4(0.);
 vec2 q=xz*3.2,ci=floor(q),f=fract(q)-.5;float h=fract(sin(dot(ci,vec2(41.3,289.1)))*15731.743);
 // 잎 하나: 칸 안 아무 자리, 아무 방향의 길쭉한 타원(크기 0.6~1배). 일정한 물방울 무늬로 보이지 않게.
 vec2 o=vec2(fract(h*13.7),fract(h*29.1))-.5,v=f-o*.45;float an=h*40.,ca=cos(an),sa=sin(an);v=mat2(ca,-sa,sa,ca)*v;
 float d=length(v*vec2(1.,2.3))/(.6+.4*fract(h*3.3));float leaf=1.-smoothstep(.15,.19,d);
 float autumn=leaf*step(h,.3)*tsW.z,spring=leaf*step(h,.13)*tsW.x*(1.-smoothstep(${oe.lowHeight.toFixed(1)},${oe.highHeight.toFixed(1)},y));
 float k=fract(h*7.7);vec3 ac=k<.35?TS_RED:k<.65?TS_ORANGE:k<.85?TS_YELLOW:TS_BROWN;
 float a=(autumn+spring)*fade;
 return vec4((ac*autumn+TS_PETAL*spring)/max(autumn+spring,1e-3),a);
}
`,de=e=>{e.uniforms.tsW=Ce.tsW};function Ds(e){const t=[0,0,0,0];return t[ja[e]??1]=1,t}function Fs({tau:e=1.2}={}){const t=new $a(0,1,0,0),o=Ce.tsW.value;let a="summer",i=!0;return{set(s){return s in ja?(a=s,t.fromArray(Ds(s)),!0):!1},snap(){i=!0},update(s){if(i)return o.copy(t),i=!1,o;const n=1-Math.exp(-Math.max(0,Math.min(s,.5))/e);return o.lerp(t,n),Math.abs(o.x-t.x)+Math.abs(o.y-t.y)+Math.abs(o.z-t.z)+Math.abs(o.w-t.w)<.001&&o.copy(t),o},get name(){return a},get weights(){return o.toArray().map(s=>Math.round(s*1e3)/1e3)}}}function yo(e,t,o,a){e.setRGB(0,0,0);const i=new nt;return["spring","summer","autumn","winter"].forEach((s,n)=>{const r=o?.[s];i.copy(r?Wt(r):t),e.r+=i.r*a[n],e.g+=i.g*a[n],e.b+=i.b*a[n]}),e}const qa=Wt,Mt=e=>new nt().setRGB(...lt(e),ht),wo=e=>{const t=Mt(e);return`vec3(${t.r.toFixed(4)},${t.g.toFixed(4)},${t.b.toFixed(4)})`},Gt={toonWaveA:{value:Mt(j.foliage.waveA)},toonWaveB:{value:Mt(j.foliage.waveB)},toonWindDir:{value:new wt(.8,.6)},toonWaveSpeed:{value:1.2},toonWaveStrength:{value:1}},As={value:new nt(.85,.95,1)},be=e=>(e.userData.shared=!0,e),Be=e=>e.r*.2126+e.g*.7152+e.b*.0722,Rs=.1;function Ns(e){const t=e?.image;if(!t||typeof document>"u"||!(t.width>0))return null;try{const o=document.createElement("canvas");o.width=o.height=8;const a=o.getContext("2d",{willReadFrequently:!0});a.drawImage(t,0,0,8,8);const i=a.getImageData(0,0,8,8).data;let s=0,n=0,r=0;for(let u=0;u<i.length;u+=4)s+=i[u],n+=i[u+1],r+=i[u+2];const l=i.length/4*255,c=new nt;return e.colorSpace===ht?c.setRGB(s/l,n/l,r/l,ht):c.setRGB(s/l,n/l,r/l,$n)}catch{return null}}const fa=`
vec3 toonWaveColor(vec3 world){
 float along=dot(world.xz,toonWindDir);
 float wave=sin(along*.045-foliageTime*toonWaveSpeed)*.62+sin(along*.13+world.x*.017-foliageTime*toonWaveSpeed*1.7)*.38;
 return mix(toonWaveA,toonWaveB,wave*.5+.5);
}`,bo="uniform vec3 toonWaveA;uniform vec3 toonWaveB;uniform vec2 toonWindDir;uniform float toonWaveSpeed;uniform float toonWaveStrength;uniform float foliageTime;",So=e=>Object.assign(e.uniforms,Gt,{foliageTime:te.foliageTime}),Mo=e=>`
{
 vec4 ${e}W=vec4(transformed,1.);vec3 ${e}N=objectNormal;
 #ifdef USE_INSTANCING
 ${e}W=instanceMatrix*${e}W;${e}N=mat3(instanceMatrix)*${e}N;
 #endif
 v${e}World=(modelMatrix*${e}W).xyz;v${e}Up=normalize(mat3(modelMatrix)*${e}N).y;
}`;function Ps({gradientMap:e}){const t={converted:0,reused:0,blobs:0,cutoutMeshes:0,skipped:0,foliage:0,localLightCap:Ms()},o=(x={})=>new Ue({gradientMap:e,...x});function a(x,{name:N=x?.name??"",kind:Y,pine:et=!1,wind:ot=!0}={}){if(!x||x.userData.toonFoliage)return x;const Q=Va(N),J=Y??(/grass|풀/.test(N)||/^pine_sapling.*_(twig|dead_branches)$/.test(N)?"grass":/_twig$/.test(N)?"needle":Q);ot&&bs(x,{name:J==="grass"?"grass_leaves":N,pine:et});const st=j.foliage,L={grass:st.grassFlat,needle:st.needleFlat}[J],G=J==="bark"?0:L?L.strength:st.leafWave,$=L?`vec3(${L.brightness.toFixed(3)})`:"vec3(clamp(tfLuma*2.4,.3,1.25))",V=J==="bark"?[.9,1.04]:[st.bottom,st.top],q=x.onBeforeCompile,tt=x.customProgramCacheKey.bind(x);return x.onBeforeCompile=function(Z,rt){q.call(this,Z,rt),So(Z),Z.vertexShader=Z.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vTfWorld;varying float vTfUp;`).replace("#include <project_vertex>",`#include <project_vertex>
`+Mo("Tf")),Z.fragmentShader=Z.fragmentShader.replace("#include <common>",`#include <common>
varying vec3 vTfWorld;varying float vTfUp;
${bo}
${fa}`).replace("#include <alphamap_fragment>",`
     {
      // 잎은 텍스처 디테일 대신 덩어리 단색: 명도만 남기고 물결색을 섞는다.
      float tfLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
      vec3 tfWave=toonWaveColor(vTfWorld)*${$};
      diffuseColor.rgb=mix(diffuseColor.rgb,tfWave,${G.toFixed(3)}*toonWaveStrength);
      diffuseColor.rgb*=mix(${V[0].toFixed(3)},${V[1].toFixed(3)},clamp(vTfUp*.5+.5,0.,1.));
     }
     #include <alphamap_fragment>`),J==="grass"&&!x.transparent&&(Z.fragmentShader=Z.fragmentShader.replace("#include <opaque_fragment>",`#include <opaque_fragment>
 gl_FragColor.a=min(gl_FragColor.a,.5);`))},x.customProgramCacheKey=()=>`${tt()}|toon-foliage-v1-${J}`,x.userData.toonFoliage={kind:J,strength:G},x.needsUpdate=!0,t.foliage++,x}let i,s;function n({vertexColors:x=!1}={}){if(i&&i.vertexColors===x)return i;s??=Ua(j.terrainGradient);const N=j.terrain,Y=be(o({color:16777215,vertexColors:x,name:"toon-terrain",gradientMap:s})),et=J=>Mt(N[J]),ot={tMeadow:{value:et("meadow")},tMeadowFar:{value:et("meadowFar")},tForest:{value:et("forest")},tHigh:{value:et("highForest")},tRock:{value:et("rock")},tRockDark:{value:et("rockDark")},tSoil:{value:et("soil")},tMoss:{value:Mt(j.nature.moss)},tMossDark:{value:Mt(j.nature.mossDark)}};Y.userData.toonUniforms=ot;const Q=J=>J.toFixed(4);return Y.onBeforeCompile=J=>{Object.assign(J.uniforms,ot),So(J),de(J),J.vertexShader=J.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vTtWorld;varying float vTtUp;varying vec3 vTtN;`).replace("#include <project_vertex>",`#include <project_vertex>
`+Mo("Tt")+`
vTtN=normalize(mat3(modelMatrix)*objectNormal);`),J.fragmentShader=J.fragmentShader.replace("#include <common>",`#include <common>
    varying vec3 vTtWorld;varying float vTtUp;varying vec3 vTtN;uniform vec3 tMeadow,tMeadowFar,tForest,tHigh,tRock,tRockDark,tSoil,tMoss,tMossDark;
    ${Ro}${No}${je}
    ${bo}
${fa}
    float ttHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float ttNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(ttHash(i),ttHash(i+vec2(1,0)),f.x),mix(ttHash(i+vec2(0,1)),ttHash(i+vec2(1,1)),f.x),f.y);}
    float ttFbm(vec2 p){return ttNoise(p)*.58+ttNoise(p*2.13+vec2(5.2,1.3))*.28+ttNoise(p*4.71+vec2(1.7,9.2))*.14;}
    // 경계 폭을 화면 미분으로 잡아 계단·깜빡임 없이 두 톤으로 끊는다.
    float ttCut(float x,float at){float w=max(fwidth(x),.004);return smoothstep(at-w,at+w,x);}
    float ttRockMask=0.,ttSnow=0.;vec3 ttBumpN=vec3(0.,1.,0.);
    ${qt}`).replace("#include <color_fragment>",`#include <color_fragment>
    {
     vec2 xz=vTtWorld.xz;float slope=1.-clamp(vTtUp,0.,1.),h=vTtWorld.y,dist=length(vViewPosition);
     // 먼 곳(픽셀보다 잘아지는 무늬)은 평균으로 접는다.
     float farFade=smoothstep(500.,1800.,dist);
     // ① 풀밭: 가까이 연두 → 멀리 밝고 푸른 연두. 바람결 줄무늬는 가까운 풀밭에만 약하게.
     vec3 meadow=mix(tMeadow,tMeadowFar,smoothstep(120.,1400.,dist));
     meadow=mix(meadow,toonWaveColor(vTtWorld)*1.02,.14*toonWaveStrength*(1.-smoothstep(60.,400.,dist)));
     // ② 숲 덩어리(약 ${N.forestScale}m): 능선 위로는 줄어든다. 숲 안은 덩어리 명암 두 톤.
     float blob=ttFbm(xz/${Q(N.forestScale)});
     // 중경(정상에서 내려다보는 250m~ 사면)은 관악산 실제처럼 숲이 사면 대부분을 덮는다(참고 05_14: 짙은 녹색 나무 무리).
     float midWood=smoothstep(250.,900.,dist)*(1.-smoothstep(${Q(N.ridgeHeight)},${Q(N.ridgeHeight+60)},h));
     float forestT=mix(blob,.5,farFade*.5)+slope*.35-smoothstep(${Q(N.ridgeHeight)},${Q(N.ridgeHeight+80)},h)*.3+midWood*.3;
     float forest=ttCut(forestT,.5);
     // 가까운 숲 바닥(풀밭이 덮는 거리)은 짙은 숲색 대신 풀밭색 쪽으로(길가·풀 틈에 짙은 띠가 보이지 않게, 참고 01_12·01_23).
     float nearFloor=1.-smoothstep(45.,160.,dist);
     // 수관 명암: 가까이는 나무 몇 그루 크기, 중경(정상에서 내려다보는 사면)은 숲 덩어리 크기(약 45m)로 둥글게 끊는다.
     float canopy=mix(ttCut(ttFbm(xz/14.+3.1),.55),ttCut(ttFbm(xz/45.+1.7),.52),smoothstep(150.,700.,dist));
     canopy=mix(canopy,.4,smoothstep(1800.,3200.,dist));
     vec3 green=mix(meadow,tForest*mix(1.08,.8,canopy),forest*(1.-nearFloor*.7));
     // 중경 나무 무리: 둥근 수관 덩어리 하나하나가 해 쪽은 밝고 아래·틈은 짙다(참고 05_14). 가까이(~900m)는 약 24m,
     // 더 멀리는 나무 무리 약 60m. 덩어리가 픽셀보다 작아지면 숲 평균 톤으로 접는다. 낮 연무를 지나도 짙은 녹색이 남게 바탕을 낮춘다.
     float woodMask=0.;vec3 wood=vec3(0.);
     if(midWood>0.)for(int layer=0;layer<2;layer++){
      float sc=layer==0?24.:60.,lw=layer==0?1.-smoothstep(700.,1100.,dist):smoothstep(700.,1100.,dist);
      vec2 cq=xz/sc+float(layer)*13.1,ci=floor(cq),cf=fract(cq),best=vec2(0.),bid=ci;float d1=8.;
      for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(float(x),float(y)),o=g+vec2(ttHash(ci+g),ttHash(ci+g+19.7))*.7+.15-cf;float d=dot(o,o);if(d<d1){d1=d;best=o;bid=ci+g;}}
      float rr=sqrt(d1),crown=1.-smoothstep(.34,.6,rr),lit=smoothstep(-.15,.3,dot(-best,normalize(vec2(-.55,-.8)))+.1);
      float fade=1.-smoothstep(.25,.6,max(fwidth(cq).x,fwidth(cq).y));
      // 계절: 수관 덩어리마다 난수로 벚꽃·단풍 색을 고르고, 겨울엔 회갈색 잔가지 안개(src/toon/season.js tsCrown).
      wood+=lw*tsCrown(tForest*vec3(.86,1.06,.62),ttHash(bid+3.3),h)*mix(.42,mix(.66,.96,lit),crown);woodMask+=lw*fade;
     }
     green=mix(green,wood,midWood*forest*woodMask);
     green=mix(green,tForest*vec3(.86,1.06,.62)*.66,midWood*forest*(1.-woodMask));
     // 아주 먼 사면만 숲·풀밭 대비를 줄인다(원경은 덩어리 하나의 녹색 톤 + 안개). 중경 숲은 짙게 남긴다.
     green=mix(green,mix(meadow,tForest*.86,.78),smoothstep(1000.,2800.,dist)*.5*(1.-midWood*.8));
     green=mix(green,tHigh,smoothstep(${Q(N.forestHeight)},${Q(N.forestHeight+50)},h)*.45*(1.-forest*.5));
     // 붓질 그라데이션(카툰 2차, 참고 03_03·03_08·05_19): 풀밭·숲 바닥에 바람 방향 짧은 붓 자국(밝은 자국은 노란 연두,
     // 어두운 자국은 푸른 녹색) + 수십 m 크기의 칠 얼룩. 붓 자국이 픽셀보다 잘아지면 접는다.
     float bpx=dist*.0014/max(vTtUp,.3);
     float bs1=bsStroke(xz,toonWindDir,${Q(N.brushNear)})*bsFade(bpx,${Q(N.brushNear)});
     float bs2=bsStroke(xz*vec2(1.,1.)+vec2(31.,7.),normalize(vec2(-toonWindDir.y,toonWindDir.x)*.4+toonWindDir),${Q(N.brushMid)})*bsFade(bpx,${Q(N.brushMid)});
     float bwash=(ttFbm(xz/34.+vec2(2.,5.))-.5)*2.*(1.-smoothstep(900.,2400.,dist));
     float bt=bs1*.55+bs2*.45;
     green*=1.+bt*${Q(N.brushAmount)}+bwash*${Q(N.washAmount)};
     green=mix(green,green*vec3(1.07,1.05,.86),clamp(bt+bwash*.5,0.,1.)*.45);
     green=mix(green,green*vec3(.9,.98,1.06),clamp(-bt,0.,1.)*.35);
     // ③ 암반: 경사 rockSlope(약 44°)에서 0.5. 고지(rockHeight 위)는 덩어리 얼룩이 짙은 곳부터, 정상부는 거의 전부.
     float rn=mix(ttFbm(xz/${Q(N.rockScale)}+vec2(3.7,8.1)),.5,farFade);
     float slopeRock=slope*${Q(.5/N.rockSlope)}+(rn-.5)*.32;
     float altRock=smoothstep(${Q(N.rockHeight[0])},${Q(N.rockHeight[1])},h)*(.22+.62*smoothstep(.35,.75,rn))+smoothstep(${Q(N.summitHeight[0])},${Q(N.summitHeight[1])},h)*.3;
     float rock=ttCut(max(slopeRock,altRock),.5);
     // 암벽 톤: 큰 얼룩 두 톤 + 급한 면의 가로 층(단 높이 약 3.2m, 짙은 띠). 멀어지면 평균 톤.
     // 높이도 섞어 세로 절벽면에서도 얼룩이 생기게 한다(수평 좌표만 쓰면 절벽에 세로 줄만 남는다).
     // 야숨 바위 칠(재판정, 참고 04_19·04_20·04_09): 회색 바탕 + 어두운 녹회 얼룩 + 이끼(trcPaint). 가로 층 띠·붓 줄무늬는 쓰지 않는다
     // (평평한 암반 바닥에서 쓸린 줄무늬·헤링본으로 읽혔다). 먼 곳은 얼룩을 평균 톤으로 접는다.
     float steep=smoothstep(.3,.55,slope);
     // 둥근 암괴: 셀 법선 굴곡(그늘 면은 조명 단계에서). 셀은 세로로 조금 길다. 갈라짐 선·셀 경계 그늘은 쓰지 않는다(육각 그물 방지).
     // 셀 크기는 경사와 무관하게 고정한다(겹쳐 그려지는 지형 조각끼리 무늬가 달라지면 점무늬가 생긴다).
     // 뒷면(접힌 급경사 면)은 법선을 뒤집는다. 안 그러면 굴곡 법선이 화면 법선과 정반대가 되어 섞을 때 0이 된다(점무늬).
     vec3 wn=normalize(vTtN);if(!gl_FrontFacing)wn=-wn;
     // 접힌 삼각형(정점 법선과 실제 면 방향이 크게 어긋남)에서는 굴곡·그늘 면을 끈다. 그런 면은 명암이 점점이 깨진다.
     vec3 gN=normalize(cross(dFdx(vTtWorld),dFdy(vTtWorld)));float ttStable=smoothstep(.55,.8,abs(dot(gN,wn))),px=trcPixel(vTtWorld,gN);
     vec3 stone=tRock;float ttMoss=0.;
     if(rock>.001){
      float crk;ttBumpN=trcBump(vTtWorld,wn,vec3(5.,6.,5.),mix(.25,.8,steep),px,crk);trcOcc=1.;
      stone=trcPaint(vTtWorld,wn,tRock,tRockDark,tsMossTint(tMoss),tsMossTint(tMossDark),px,mix(-.12,-.1,steep),ttMoss);
      stone=mix(stone,tRock*.92,farFade);ttMoss*=1.-farFade;
     }
     // 바위 턱 위의 풀 띠: 완만한 암반 윗면에서, 등고선을 따라 길게(턱을 따라 띠로 덮인다).
     float ledgeN=ttFbm(vec2(h/2.2,dot(xz,vec2(.71,.71))/28.)+vec2(7.,2.))*.6+ttFbm(xz/6.+vec2(3.,9.))*.4;
     // 능선·정상의 완만한 암반은 풀밭과 반쯤 섞인다(참고 04_16·05_18: 회색 암반 사이 연두 풀밭, 05_14: 풀 덮인 정상에 바위가 흩어짐).
     // 평평한 바닥은 등고선 잡음이 한 면 전체에서 같아지므로, 수 m 크기 평면 얼룩을 섞어 암반 자리와 풀밭 자리가 번갈아 나오게 한다.
     float patchN=ttFbm(xz/6.5+vec2(4.,1.))*.6+ttFbm(xz/2.3+vec2(8.,3.))*.4;
     float ledge=(1.-smoothstep(.2,.36,slope))*ttCut(mix(ledgeN,patchN,.8),mix(.53,.47,smoothstep(${Q(N.summitHeight[0])},${Q(N.summitHeight[1])},h)));
     stone=mix(stone,green,ledge*.95);
     vec3 base=mix(green,stone,rock);ttRockMask=rock*(1.-ledge*.95)*(1.-ttMoss*.8)*ttStable;
     // 흙: 숲 밖의 중간 경사만 옅게.
     base=mix(base,tSoil,ttCut(slope,.3)*(1.-rock)*(1.-forest)*.25);
     // 계절 바닥(src/toon/season.js): 봄 꽃잎·가을 낙엽(가까이), 겨울 쌓인 눈. 눈은 완만한 땅·암반 윗면에만 쌓이고
     // 가파른 바위(약 45° 이상)는 맨 바위로 남는다. 남쪽 비탈(+z)은 군데군데 녹고, 중경 숲은 회갈색 수관 사이로 눈이 보인다.
     {vec4 lt=tsLitter(xz,dist,h);base=mix(base,lt.rgb,lt.a*(1.-rock*(1.-ledge)));}
     if(tsW.w>.001){
      float south=smoothstep(.05,.45,vTtN.z),melt=ttFbm(xz/11.+vec2(9.,4.));
      float cover=1.-smoothstep(.3,.5,slope)-south*.4*smoothstep(.45,.7,melt)*(1.-.6*rock)+(mix(tsN2(xz/3.+vec2(2.,6.)),.5,farFade)-.5)*.3;
      // 암반은 눈이 군데군데만 남는다(바람에 쓸린 둥근 바위 등이 드러난다). 풀 덮인 턱은 그대로 눈.
      cover-=rock*(1.-ledge)*(.15+.65*smoothstep(.45,.62,mix(tsN2(xz/5.+vec2(1.,8.))*.65+tsN2(xz/1.9+vec2(4.,2.))*.35,.5,farFade)));
      ttSnow=tsW.w*ttCut(cover,.45)*(1.-.5*midWood*forest);
      base=mix(base,TS_SNOW,ttSnow);ttRockMask*=1.-ttSnow;
     }
     diffuseColor.rgb*=base;
    }`).replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
     trcBaseN=normal;if(ttRockMask>0.)normal=normalize(mix(normal,(viewMatrix*vec4(ttBumpN,0.)).xyz,ttRockMask));`).replace("#include <lights_fragment_end>",`#include <lights_fragment_end>
     reflectedLight.indirectDiffuse*=mix(vec3(1.),vec3(${j.nature.rockShadeTint.join(",")}),ttRockMask);
     // 눈 그늘은 푸르게(자료 §6 눈 그늘 #b8c6da).
     reflectedLight.indirectDiffuse*=mix(vec3(1.),vec3(.86,.95,1.12),ttSnow);
     ${Po("ttRockMask",j.nature.rockShadeDirect.toFixed(3))}`)},Y.customProgramCacheKey=()=>`toon-terrain-v7-season-${x}`,i=Y}const r=new WeakMap;function l(x=n()){if(!r.has(x)){const N=x.clone();N.onBeforeCompile=x.onBeforeCompile,N.customProgramCacheKey=x.customProgramCacheKey,N.userData={...x.userData,shared:!0,toonUnderlay:!0},N.polygonOffset=!0,N.polygonOffsetFactor=4,N.polygonOffsetUnits=8,r.set(x,N)}return r.get(x)}function c(x,{cell:N=[3.2,2.6,3.2],amt:Y=.8,crack:et=.7,edge:ot=!1,moss:Q=-.32}={}){return x.onBeforeCompile=J=>{de(J),J.vertexShader=J.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vTsWorld;varying float vTsUp;varying vec3 vTsN;`+(ot?"attribute float trailEdge;varying float vTsSide;":"")).replace("#include <project_vertex>",`#include <project_vertex>
`+Mo("Ts")+`
vTsN=normalize(mat3(modelMatrix)*objectNormal);`+(ot?"vTsSide=trailEdge;":"")),J.fragmentShader=J.fragmentShader.replace("#include <common>",`#include <common>
    varying vec3 vTsWorld;varying float vTsUp;varying vec3 vTsN;vec3 tsBumpN=vec3(0.,1.,0.);float tsFlat=0.,tsMoss=0.,tsSnowAmt=0.;${No}${ot?"varying float vTsSide;":""}
    ${Ro}${je}${qt}`).replace("#include <color_fragment>",`#include <color_fragment>
     ${ot?`{
      vec3 ew=trcWarp(vTsWorld*vec3(.55,.3,.55)+1.7)+trcWarp(vTsWorld*vec3(1.6,.8,1.6)+5.3)*.45;
      float thr=max(.34,.62+ew.x*.55+ew.z*.25);if(abs(vTsSide)>thr)discard;
      // 가장자리 띠에서는 굴곡·그늘 면을 접어 아래 지형 암반과 같은 밝기로 이어지게 한다(경계에 단이 보이지 않게).
      tsFlat=smoothstep(thr-.45,thr-.02,abs(vTsSide));
     }`:""}
     {
      // 재판정(참고 04_20): 둥근 암괴 굴곡(갈라짐 선·셀 경계 그늘 없음) + 지형 암반과 같은 칠(회색 바탕·어두운 얼룩·이끼).
      vec3 wn=normalize(vTsN);if(!gl_FrontFacing)wn=-wn;float px=trcPixel(vTsWorld,wn),crk;
      tsBumpN=trcBump(vTsWorld,wn,vec3(${N.map(st=>st.toFixed(2)).join(",")}),${Y.toFixed(2)}*.8*(1.-tsFlat),px,crk);trcOcc=1.;
      vec3 tsBase=diffuseColor.rgb;
      diffuseColor.rgb=trcPaint(vTsWorld,wn,diffuseColor.rgb,${wo(j.nature.rockDark)},tsMossTint(${wo(j.nature.moss)}),tsMossTint(${wo(j.nature.mossDark)}),px,${Q.toFixed(2)},tsMoss);
      ${ot?`// 노면은 얼룩을 절반으로(짙은 얼룩이 발밑에서 구멍·웅덩이처럼 읽히지 않게).
      diffuseColor.rgb=mix(diffuseColor.rgb,tsBase,.5*(1.-tsMoss));`:""}
      // 겨울: 평평한 윗면·턱에만 눈(가파른 면은 맨 바위). 바위 노면은 밟힌 눈(회갈색)과 눈이 섞인다.
      tsSnowAmt=tsSnowCover(vTsWorld,wn.y,.6,.82)${ot?"*(.2+.6*smoothstep(.42,.62,tsN2(vTsWorld.xz*.45+3.)))":""};
      diffuseColor.rgb=mix(diffuseColor.rgb,${ot?"mix(TS_TRAMPLED,TS_SNOW,smoothstep(.3,.7,tsN2(vTsWorld.xz*1.7)))":"TS_SNOW"},tsSnowAmt);
     }`).replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
     ${ot?`// 노면 리본은 마디마다 기울어 툰 명암·그늘 면이 마디째 어두운 띠로 떨어진다(정상 길이 계단처럼 보였다). 바탕 법선을 위로 세운다.
     {vec3 up=(viewMatrix*vec4(0.,1.,0.,0.)).xyz;normal=normalize(mix(normal,up,.85));tsBumpN=normalize(mix(tsBumpN,vec3(0.,1.,0.),.6));}`:""}
     trcBaseN=normal;normal=normalize((viewMatrix*vec4(tsBumpN,0.)).xyz);`).replace("#include <lights_fragment_end>",`#include <lights_fragment_end>
     reflectedLight.indirectDiffuse*=mix(vec3(${j.nature.rockShadeTint.join(",")}),vec3(1.),max(max(tsFlat,tsMoss*.8),tsSnowAmt));
     ${Po("(1.-tsFlat)*(1.-tsMoss*.8)*(1.-tsSnowAmt)",j.nature.rockShadeDirect.toFixed(3))}`)},x.customProgramCacheKey=()=>`toon-rock-surface-v5-season-${N.join("_")}-${Y}-${et}-${ot}-${Q}`,x.userData.toonRockSurface=!0,x}const u=new Map;function f(x=Mt(j.nature.rock),N={},Y={}){const et=`${new nt(x).getHexString()}|${JSON.stringify(N)}|${JSON.stringify(Y)}`;return u.has(et)||u.set(et,be(c(o({name:"toon-rock-surface",color:x,...N}),Y))),u.get(et)}const h=new Set(["rock","ridge"]),m=new Map;function d(x="soil"){if(j.trail[x]||(x="soil"),!m.has(x)){const N=be(o({name:`toon-trail-${x}`,color:Mt(j.trail[x]),side:x==="stairs"||x==="deck_stairs"?zt:na}));h.has(x)?(c(N,{cell:[1.7,1.4,1.7],amt:.45,crack:.2,edge:!0,moss:-.45}),N.polygonOffset=!0,N.polygonOffsetFactor=-2,N.polygonOffsetUnits=-6,x==="ridge"&&(N.visible=!1)):(x==="soil"||x==="paved")&&g(N,{ragged:x==="soil"}),m.set(x,N)}return m.get(x)}function g(x,{ragged:N=!1}={}){return x.onBeforeCompile=Y=>{de(Y),Y.vertexShader=Y.vertexShader.replace("#include <common>",`#include <common>
attribute float trailEdge;varying float vTbSide;varying vec2 vTbUv;varying vec3 vTbWorld;`).replace("#include <project_vertex>",`#include <project_vertex>
vTbSide=trailEdge;vTbUv=uv;vTbWorld=(modelMatrix*vec4(transformed,1.)).xyz;`),Y.fragmentShader=Y.fragmentShader.replace("#include <common>",`#include <common>
varying float vTbSide;varying vec2 vTbUv;varying vec3 vTbWorld;
${je}${qt}`).replace("#include <color_fragment>",`#include <color_fragment>
     {
      float side=abs(vTbSide),dist=length(vViewPosition),px=dist*.0014/max(abs(normalize(vViewPosition).y),.2);
      ${N?"float thr=.8+(bsNoise(vTbWorld.xz*.9)-.5)*.3+(bsNoise(vTbWorld.xz*3.1+5.)-.5)*.12;if(side>thr)discard;":"float thr=1.;"}
      // 길 방향 좌표(uv.y = s/metres)로 붓을 길게 긋는다. 자국 폭 .35m.
      vec2 tp=vec2(vTbUv.y*4.,vTbUv.x*4.);
      float st=bsStroke(tp,vec2(1.,0.),.35)*bsFade(px,.35)*.6+bsStroke(tp*.35+9.,vec2(1.,.15),.6)*bsFade(px,1.7)*.4;
      diffuseColor.rgb*=1.+st*.2;
      diffuseColor.rgb*=mix(1.06,.86,smoothstep(.25,thr,side));
      // 계절: 봄 꽃잎·가을 낙엽이 길에 떨어져 있다. 겨울 길은 밟힌 눈(회갈색·흙 얼룩)이고 가장자리로 갈수록 흰 눈.
      {vec4 lt=tsLitter(vTbWorld.xz,dist,vTbWorld.y);diffuseColor.rgb=mix(diffuseColor.rgb,lt.rgb,lt.a*.9);}
      if(tsW.w>.001){
       float n=bsNoise(vTbWorld.xz*1.3)*.6+bsNoise(vTbWorld.xz*4.+3.)*.4;
       vec3 tr=mix(TS_TRAMPLED,TS_TRAMPLED_SHADE,smoothstep(.6,.7,n)*.7);
       diffuseColor.rgb=mix(diffuseColor.rgb,mix(tr,TS_SNOW,smoothstep(.35,.85,side/thr+(n-.5)*.6)),tsW.w);
      }
     }`).replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
     normal=normalize(mix(normal,(viewMatrix*vec4(0.,1.,0.,0.)).xyz,.85));`)},x.customProgramCacheKey=()=>`toon-trail-brush-v3-season-${N}`,x.userData.toonTrailBrush=!0,x}const p=new Map;function y(x=16777215,N={}){const Y=`${new nt(x).getHexString()}|${JSON.stringify(N)}`;return p.has(Y)||p.set(Y,be(o({name:"toon-basic",color:x,...N}))),p.get(Y)}let v;function w(){return v||(v=be(o({name:"toon-water",color:Mt(j.water),transparent:!0,opacity:.86})),v.onBeforeCompile=x=>{So(x),x.uniforms.toonWaterSky=As,x.fragmentShader=x.fragmentShader.replace("#include <common>",`#include <common>
${bo}
uniform vec3 toonWaterSky;`).replace("#include <opaque_fragment>",`float twFres=pow(1.-abs(dot(normalize(vViewPosition),normal)),3.);
     float twBand=step(.82,sin(vViewPosition.x*.9+foliageTime*1.4)*.5+.5)*.18;
     outgoingLight+=toonWaterSky*(twFres*.35+twBand);
     #include <opaque_fragment>`)},v.customProgramCacheKey=()=>"toon-water-v2",v)}let M;function k(){if(M)return M;const x=j.terrain,N=j.trail;return M={soil:y(Mt(N.soil)),stone:f(Mt(N.rock)),granite:f(Mt(x.rock)),leaves:y(Mt("#6f7f3e")),grass:y(Mt(x.meadow)),wood:y(Mt(N.deck_stairs)),bark:y(Mt("#6b4e36")),paved:d("paved"),stoneStairs:d("stairs"),woodStairs:d("deck_stairs")},M}const B={terrain:n,terrainUnderlay:l,trail:d,basic:y,rock:f,water:w,materials:k,pathMaterials:()=>Object.fromEntries(fs.map(x=>[x,d(x)])),gradientMap:e},A=x=>/^(roadside-(grass|shrub)|forest-blades)-/.test(x.customProgramCacheKey?.()??""),S=x=>/^(rock_|boulder_|mountainside)/.test(x??""),T=Mt(j.rock.granite);function b(x){const N=Nt.clamp(Be(x.color)/Rs,1-j.rock.spread,1+j.rock.spread);x.color.copy(T).multiplyScalar(N),x.userData.toonRock=!0}const F=x=>!!x.map?.isCanvasTexture&&!(x.alphaTest>0)&&!x.transparent&&Be(x.color)>.6;function z(x,N){const Y=j.pattern,et=Ns(N.map),ot=et?et.clone().multiply(new nt(1,1,1).lerp(N.color,Y.warmth)):N.color.clone().multiplyScalar(.12),Q=Be(ot),J=Nt.clamp(Q*Y.gain,Y.minLuma,Y.maxLuma);ot.multiplyScalar(J/Math.max(Q,1e-4)),x.color.copy(ot),x.map=N.map,x.userData.toonPattern=!0;const st=Math.max(.02,et?Be(et):.3);x.onBeforeCompile=L=>{L.fragmentShader=L.fragmentShader.replace("#include <map_fragment>",`
    #ifdef USE_MAP
    {
     float tpRatio=dot(texture2D(map,vMapUv).rgb,vec3(.2126,.7152,.0722))/${st.toFixed(4)};
     float tpDark=1.-smoothstep(${(Y.dark-.03).toFixed(3)},${(Y.dark+.03).toFixed(3)},tpRatio),tpLight=smoothstep(${(Y.light-.03).toFixed(3)},${(Y.light+.03).toFixed(3)},tpRatio);
     float tpTone=mix(1.,${Y.darkTone.toFixed(3)},tpDark)*mix(1.,${Y.lightTone.toFixed(3)},tpLight),tpFade=1.-smoothstep(${Y.fadeNear.toFixed(1)},${Y.fadeFar.toFixed(1)},length(vViewPosition));
     diffuseColor.rgb*=mix(1.,tpTone,tpFade*${Y.amount.toFixed(3)});
    }
    #endif`)},x.customProgramCacheKey=()=>`toon-pattern-floor-v1-${st.toFixed(4)}`}const C=new WeakMap,_=x=>x&&!x.isMeshToonMaterial&&!x.isShaderMaterial&&(x.isMeshStandardMaterial||x.isMeshBasicMaterial||x.isMeshLambertMaterial||x.isMeshPhongMaterial);function W(x,{kind:N,keepMaps:Y=!1}={}){if(!_(x))return t.skipped++,x;let et=C.get(x);et||C.set(x,et=new Map);const ot=`${N??""}|${Y}`;if(et.has(ot))return t.reused++,et.get(ot);const{foliagePatched:Q,...J}=x.userData??{},st=o({name:x.name,color:x.color?.clone()??new nt(1,1,1),vertexColors:x.vertexColors,alphaTest:x.alphaTest,transparent:x.transparent,opacity:x.opacity,side:x.side,depthWrite:x.depthWrite,depthTest:x.depthTest,fog:x.fog,visible:x.visible,alphaMap:x.alphaMap??null,map:Y?x.map??null:null,emissive:x.emissive?x.emissive.clone():new nt(0),emissiveIntensity:x.emissiveIntensity??1,emissiveMap:Y?x.emissiveMap??null:null,polygonOffset:x.polygonOffset,polygonOffsetFactor:x.polygonOffsetFactor,polygonOffsetUnits:x.polygonOffsetUnits});if(!Y&&x.map&&x.alphaTest>0&&!x.alphaMap&&(st.alphaMap=x.map,st.userData.alphaFromMap=!0),st.userData={...st.userData,...J,toonSource:x.uuid,toonKind:N??null,shared:!0},A(x)){st.onBeforeCompile=x.onBeforeCompile;const L=x.customProgramCacheKey.bind(x);st.customProgramCacheKey=()=>L(),a(st,{name:x.name,kind:"grass",wind:!1})}else N==="foliage"||N==="grass"||Q?a(st,{name:x.name,pine:Q?.pine,kind:N==="grass"?"grass":void 0}):!Y&&S(x.name)?b(st):!Y&&F(x)&&z(st,x);return et.set(ot,st),t.converted++,st}const H=new WeakMap,R=[[0,.05,0,1],[.42,-.18,.22,.72],[-.38,-.12,-.3,.74],[.05,-.22,.45,.66]];function O(x){if(H.has(x))return H.get(x);x.boundingBox||x.computeBoundingBox();const N=x.boundingBox,Y=N.getCenter(new P),et=N.getSize(new P).multiplyScalar(.5),ot=R.map(([J,st,L,G],$)=>{const V=new Ne(1,1);V.deleteAttribute("uv");const q=V.attributes.position;for(let tt=0;tt<q.count;tt++){const Z=q.getX(tt),rt=q.getY(tt),mt=q.getZ(tt),dt=1+.08*Math.sin(Z*5.1+rt*3.7+mt*4.3+$*1.7);q.setXYZ(tt,Y.x+et.x*(J+Z*G*dt*.62),Y.y+et.y*(st+rt*G*dt*.6),Y.z+et.z*(L+mt*G*dt*.62))}return V}),Q=Ha(ye(ot));return ot.forEach(J=>J.dispose()),Q.computeVertexNormals(),Q.computeBoundingBox(),Q.computeBoundingSphere(),Q.name=`${x.name||"leaves"}-toon-blob`,Q.userData.shared=!0,H.set(x,Q),t.blobs++,Q}const I=x=>x?.userData?.toonAlphaCutout===!0;function K(x,{kind:N,keepMaps:Y=!1}={}){return x&&(x.traverse(et=>{if(!et.isMesh||et.isLine||et.isPoints)return;const ot=Array.isArray(et.material)?et.material:[et.material];if(!et.isSkinnedMesh&&ot.length===1&&I(ot[0])){et.geometry=O(et.geometry),t.cutoutMeshes++,et.material=X(W(ot[0],{kind:"foliage",keepMaps:Y})),et.userData.toonBlob=!0;return}const Q=ot.map(J=>W(J,{kind:N,keepMaps:Y}));et.material=Array.isArray(et.material)?Q:Q[0]}),x)}const U=new WeakMap;function X(x){if(!U.has(x)){const N=x.clone();N.alphaTest=0,N.alphaMap=null,N.transparent=!1,N.side=na,N.onBeforeCompile=x.onBeforeCompile,N.customProgramCacheKey=()=>`${x.customProgramCacheKey()}|blob`,N.userData={...x.userData,shared:!0},U.set(x,N)}return U.get(x)}return{materialFactory:B,toonify:K,convert:W,patchFoliage:a,status:t}}const Ws=`
varying vec3 vSkyDir;
void main(){
 vSkyDir=normalize(position);
 vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);
 gl_Position=p.xyww;
}`,Lt=j.sky.stars,Wo=j.sky.cityGlow.bino,ua={stretch:.6,full:4},Ls=e=>e>1.001?e*(1+ua.stretch*Math.min(1,(e-1)/(ua.full-1))):1,Bs=`
uniform vec3 skyZenith,skyMid,skyPink,skyHorizon,skyCity,skyCityDir,skyCloud,skyCloudShade,skyCloudLit,skySun,skyMoon,skySunColor,skyMilkyN,skyMilkyColor,skyMilkyDust;
uniform float skyStars,skyMilky,skyCityGlow,skyCover,skyTime,skySunVis,skyMoonVis,skyGain,skySunset,skyNight;
uniform vec3 skyBands,skyCityBino;
uniform float skyZoom,skyCamAz,skyDip;
varying vec3 vSkyDir;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
// 둥근 별 한 겹: 방향 격자 칸마다 하나, 화면 픽셀 크기(px)로 그린 둥근 점. 반환은 밝기.
float starLayer(vec2 uv,float cells,float share,float px,float seed){
 vec2 g=uv*cells,cell=floor(g),f=fract(g)-.5;float h=hash(cell+seed);
 if(h>share)return 0.;
 vec2 c=(vec2(hash(cell+seed+.3),hash(cell+seed+.7))-.5)*.6;
 float pix=max(fwidth(g.x),fwidth(g.y));
 float d=length(f-c)/max(pix,1e-5);
 // 또렷한 원(가장자리 1px만 풀림) + 아주 옅은 후광.
 return (1.-smoothstep(px-.6,px+.6,d))+.12*exp(-d*d/(px*px*6.));
}
// 쌍안경(skyZoom>1): 하늘 그라데이션·빛무리·구름은 시야 중심 방위와 지평선을 기준으로 배율만큼 넓혀 본다.
// 확대하면 지평선 띠 한 가지 색만 화면을 채우던 것을, 1배에서 보이던 하늘 층(지평선 빛 → 남색 천정)·구름이 그대로 들어오게 한다. 1배는 d 그대로.
// 높은 곳(정상 635m)에서는 보이는 지평선이 수평보다 skyDip(rad)만큼 아래라, 고도를 그만큼 올려 잰 뒤 넓힌다(능선 바로 위가 지평선 빛).
vec3 skyView(vec3 d){
 if(skyZoom<1.001)return d;
 float az=atan(d.x,d.z),da=az-skyCamAz;da-=6.2831853*floor((da+3.1415927)/6.2831853);
 float el=(asin(clamp(d.y,-1.,1.))+skyDip)*skyZoom;el=clamp(el,-1.55,1.55);
 float a=skyCamAz+da*skyZoom;
 return vec3(cos(el)*sin(a),sin(el),cos(el)*cos(a));
}
void main(){
 vec3 d0=normalize(vSkyDir),d=skyView(d0);float y=max(d.y,0.);
 // 4단 그라데이션: 지평선 → 분홍 → 보라 → 천정.
 vec3 col=skyHorizon;
 col=mix(col,skyPink,smoothstep(0.,skyBands.x,y));
 col=mix(col,skyMid,smoothstep(skyBands.x,skyBands.y,y));
 col=mix(col,skyZenith,smoothstep(skyBands.y,skyBands.z,y));
 vec2 hz=normalize(d.xz+1e-5);
 // 노을: 해 쪽 지평선은 더 밝은 크림, 반대쪽은 보라가 내려온다.
 float toSun=dot(hz,normalize(skySun.xz+1e-5))*.5+.5;
 col=mix(col,mix(col,skyMid,.35*(1.-smoothstep(0.,.3,y))),skySunset*(1.-toSun));
 // 밤: 도심 쪽 지평선 라벤더 빛무리.
 // 쌍안경 밤(bn): 지평선 빛을 덜고, 빛무리는 능선 바로 위 좁은 분홍 자주 띠로(도심 불빛보다 어둡게).
 float bn=skyNight*smoothstep(1.,2.,skyZoom);
 col*=1.-bn*${Wo.horizonDim.toFixed(2)}*(1.-smoothstep(0.,skyBands.y,y));
 float city=pow(max(dot(hz,normalize(skyCityDir.xz+1e-5)),0.),2.5)*(1.-smoothstep(0.,mix(${j.sky.cityGlow.height.toFixed(2)},${Wo.height.toFixed(3)},bn),y));
 col=mix(col,mix(skyCity,skyCityBino,bn),clamp(city*skyCityGlow,0.,1.));
 if(d.y<0.)col=mix(col,col*.82,smoothstep(0.,-.25,d.y));
 // 해 원반·후광(HDR). 노을에는 원반을 작게, 후광을 넓고 부드럽게.
 float sd=max(dot(d0,skySun),0.);
 col+=skySunColor*(pow(sd,mix(8.,5.,skySunset))*mix(.35,.22,skySunset)+pow(sd,90.)*mix(.6,.3,skySunset))*skySunVis;
 col+=skySunColor*smoothstep(.9994,.9997,sd)*mix(6.,3.,skySunset)*skySunVis;
 float md=max(dot(d0,skyMoon),0.);
 col+=vec3(.9,.94,1.)*(smoothstep(.99965,.9998,md)*3.5+pow(md,200.)*.25)*skyMoonVis;
 vec3 a=abs(d0);vec2 uv=a.x>a.y&&a.x>a.z?d0.yz/a.x:a.y>a.z?d0.xz/a.y:d0.xy/a.z;
 float faceSeed=sign(d0.x)*3.+sign(d0.y)*7.+sign(d0.z)*11.;
 // 은하수: 기울어진 큰 원을 따라 옅은 빛 띠 + 어두운 먼지 줄 + 띠 안 별 더 촘촘히.
 float mw=0.;
 if(skyMilky>.001){
  float off=dot(d0,skyMilkyN);
  vec2 mp=uv*5.+faceSeed;
  float band=exp(-off*off/${(j.sky.milky.width**2).toFixed(4)})*(.55+.75*fbm(mp*1.7));
  float dust=exp(-pow(off-.025+.03*(fbm(mp*2.3)-.5),2.)/.0012)*smoothstep(.45,.7,fbm(mp*3.1+4.));
  mw=band*smoothstep(0.,.12,d0.y);
  col=mix(col,skyMilkyColor,clamp(mw*skyMilky,0.,.6));
  col=mix(col,skyMilkyDust,clamp(dust*mw*skyMilky*1.2,0.,.5));
 }
 // 둥근 별: 작은 별 + 드문 밝은 별. 지평선 근처·도심 빛무리 안은 옅게.
 if(skyStars>.001){
  float boost=1.+mw*${Lt.milkyBoost.toFixed(2)};
  float small=starLayer(uv,${Lt.cells.toFixed(1)},${Lt.share.toFixed(3)}*boost,${Lt.smallPx.toFixed(2)},faceSeed);
  float big=starLayer(uv,${(Lt.cells/3).toFixed(1)},${Lt.bright.toFixed(3)},${Lt.brightPx.toFixed(2)},faceSeed+19.);
  float h=hash(floor(uv*${Lt.cells.toFixed(1)})+faceSeed);
  float tw=.75+.25*sin(skyTime*(1.5+h*4.)+h*40.);
  vec3 tint=mix(vec3(.85,.9,1.),vec3(1.,.93,.82),step(.7,fract(h*13.)));
  col+=tint*(small*${Lt.small.toFixed(2)}+big*${Lt.big.toFixed(2)})*tw*skyStars*smoothstep(.02,.22,d.y)*(1.-city*skyCityGlow*.8);
 }
 // 구름: 하늘 평면에 투영한 fbm을 단으로 끊는다(밝은 면/그늘 면). 노을은 지평선 가까이 가로로 길게 뜨고, 해 쪽 가장자리가 빛을 받는다.
 if(d.y>.01){
  vec2 p=d.xz/(d.y+.12)*1.4+vec2(skyTime*.004,skyTime*.0015);
  p*=mix(vec2(1.),vec2(.45,1.6),skySunset);
  float n=fbm(p)+fbm(p*2.7+3.1)*.35;
  float edge=1.12-skyCover*.55;
  // 노을 구름은 낮은 하늘 띠(분홍~보라)에 모인다.
  edge+=skySunset*.3*smoothstep(.1,.24,d.y);
  float body=smoothstep(edge,edge+.04,n);
  float lit=smoothstep(edge+.1,edge+.14,n+fbm(p*1.9-vec2(.04,.08))*.18);
  vec3 cloud=mix(skyCloudShade,skyCloud,lit);
  // 빛 받은 가장자리: 구름 바깥 테두리(몸통 경계 안쪽 띠). 해를 향할수록 넓고 밝다.
  float rim=body*(1.-smoothstep(edge+.02,edge+.07+.06*toSun,n));
  // 노을: 해 쪽 구름만 가장자리가 밝다(반대쪽 흰 획이 혜성처럼 보이지 않게).
  cloud=mix(cloud,skyCloudLit,rim*mix(.4+.6*toSun,smoothstep(.55,.9,toSun),skySunset)*(skySunset+skyNight*.6+(1.-skySunset-skyNight)*.3));
  col=mix(col,cloud,body*smoothstep(.01,.12,d.y));
 }
 gl_FragColor=vec4(col*skyGain,1.);
}`;function Es({radius:e=2e4}={}){const t=()=>({value:new nt}),o={skyZenith:t(),skyMid:t(),skyPink:t(),skyHorizon:t(),skyCity:t(),skyCloud:t(),skyCloudShade:t(),skyCloudLit:t(),skyMilkyColor:{value:new nt().setRGB(...lt(j.sky.milky.color),ht)},skyMilkyDust:{value:new nt().setRGB(...lt(j.sky.milky.dust),ht)},skySun:{value:new P(0,1,0)},skyMoon:{value:new P(0,-1,0)},skySunColor:{value:new nt(1,.95,.85)},skyCityDir:{value:new P(...vo(j.sky.cityGlow.bearing))},skyMilkyN:{value:new P().crossVectors(new P(...vo(...j.sky.milky.from)),new P(...vo(...j.sky.milky.to))).normalize()},skyBands:{value:new P(...j.sky.bands)},skyCityBino:{value:new nt().setRGB(...lt(Wo.color),ht)},skyZoom:{value:1},skyCamAz:{value:0},skyDip:{value:0},skyStars:{value:0},skyMilky:{value:0},skyCityGlow:{value:0},skyCover:{value:.4},skyTime:{value:0},skySunVis:{value:1},skyMoonVis:{value:0},skyGain:{value:1},skySunset:{value:0},skyNight:{value:0}},a=new St({name:"toon-sky",uniforms:o,vertexShader:Ws,fragmentShader:Bs,side:Hn,depthWrite:!1,depthTest:!1,fog:!1});a.extensions={derivatives:!0};const i=new _t(new In(e,48,24),a);i.name="카툰 하늘",i.renderOrder=-1e3,i.frustumCulled=!1,i.userData.toonSky=!0;const s=new P;i.onBeforeRender=(l,c,u)=>{i.position.copy(u.position),i.updateMatrixWorld(),o.skyZoom.value=Ls(u.zoom||1),u.getWorldDirection(s),o.skyCamAz.value=Math.atan2(s.x,s.z),o.skyDip.value=Math.min(.021,Math.sqrt(2*Math.max(0,u.position.y)/6371e3))};let n={};function r(l={},c,u,f=0,h=1){const m=ps(l),d=(g,p)=>g.value.setRGB(...p,ht);for(const g of["Zenith","Mid","Pink","Horizon","City","Cloud","CloudShade","CloudLit"])d(o[`sky${g}`],m[g[0].toLowerCase()+g.slice(1)]);return c&&o.skySun.value.copy(c).normalize(),u&&o.skyMoon.value.copy(u).normalize(),o.skySunColor.value.setRGB(1,.95-.12*m.weights.sunset,.85-.2*m.weights.sunset,ht),o.skySunVis.value=(1-m.weights.night)*(1-(l.gray??0)*.8)*(o.skySun.value.y>-.05?1:0),o.skyMoonVis.value=l.moon?.visible??m.weights.night,o.skyStars.value=m.stars,o.skyMilky.value=m.milky,o.skyCityGlow.value=m.cityGlow,o.skyCover.value=m.cloudCover,o.skyTime.value+=f,o.skySunset.value=m.weights.sunset,o.skyNight.value=m.weights.night,o.skyGain.value=1/Math.max(.05,h),n=m,m}return{mesh:i,uniforms:o,update:r,get palette(){return n},dispose(){i.geometry.dispose(),a.dispose()}}}const it=e=>new nt().setRGB(...lt(e),ht),Ke=Object.freeze({pastelLift:.22,pastelDesat:.3,day:{lit:"#f6efe2",shade:"#8e9fbe",roof:"#e6e4de",glass:"#7fa7c6",glassTop:"#bcd6e4",haze:"#8eaac2",hazeScale:9e3,hazeMax:.9},sunset:{lit:"#bf929a",shade:"#4c5078",roof:"#8d7f9c",rim:"#ffd9b0",glass:"#5d5a85",glassLit:"#f3c1a4",haze:"#7a7092",hazeScale:9e3,hazeMax:.88},binoDusk:{lit:"#7d8ba3",shade:"#3f4f66",roof:"#8d8a9c",haze:"#69748e",litFrom:.3,rimM:3},night:{body:"#262c3c",bodyLit:"#323a4e",glass:"#1a1f2d",haze:"#454a6a",hazeScale:16e3,hazeMax:.75},zoomClear:.55,light:{cream:"#f0e5bc",blueWhite:"#e3e6f4",teal:"#8fbcdc",warm:"#e5b281",magenta:"#e07ad0",pink:"#f2a0c8",share:[.55,.25,.12,.08],tallHeight:70,magentaShare:.35},windowIntensity:1,litMin:j.city.litMin,litMax:j.city.litMax,dots:{density:62e-5,max:4e3,total:18e4,px:2.2,gain:1,target:.01,layers:3,lowKeep:.5},halo:{height:90,base:80,scale:.7,maxPx:240,fullPx:70,gain:.07,dusk:.35,colorA:"#c46fb8",colorB:"#9a7fd0"},traffic:{kinds:/^(motorway|trunk|primary)(_link)?$/,major:/^(motorway|trunk)$/,cell:26,fill:.6,speed:.8,head:"#fff1d6",tail:"#ff5a48",gain:1.8,clearM:1.5,maxSegment:120},river:{day:"#7fa9bd",daySky:"#c9dde6",sunset:"#4f4e74",sunsetSky:"#e8b8b0",night:"#141a28",nightSky:"#454a6a",streak:.12,streakGain:.42}}),da=it(Ke.light.cream).multiplyScalar(.62).add(it(Ke.light.blueWhite).multiplyScalar(.22)).add(it(Ke.light.warm).multiplyScalar(.16)),E=Ke,ne={cityNight:{value:0},cityDay:{value:1},citySunset:{value:0},cityLights:{value:0},cityTime:{value:0},citySun:{value:new P(0,1,0)},cityHaze:{value:new nt(.7,.78,.84)},cityHazeScale:{value:E.day.hazeScale},cityHazeMax:{value:E.day.hazeMax},cityDayLit:{value:it(E.day.lit)},cityDayShade:{value:it(E.day.shade)},cityDayRoof:{value:it(E.day.roof)},cityGlassDay:{value:it(E.day.glass)},cityGlassTop:{value:it(E.day.glassTop)},cityDuskLit:{value:it(E.sunset.lit)},cityDuskShade:{value:it(E.sunset.shade)},cityDuskRoof:{value:it(E.sunset.roof)},cityDuskRim:{value:it(E.sunset.rim)},cityGlassDusk:{value:it(E.sunset.glass)},cityGlassDuskLit:{value:it(E.sunset.glassLit)},cityBinoLit:{value:it(E.binoDusk.lit)},cityBinoShade:{value:it(E.binoDusk.shade)},cityBinoRoof:{value:it(E.binoDusk.roof)},cityBinoHaze:{value:it(E.binoDusk.haze)},cityNightTint:{value:it(E.night.body)},cityNightLit:{value:it(E.night.bodyLit)},cityGlassNight:{value:it(E.night.glass)},cityCream:{value:it(E.light.cream)},cityBlueWhite:{value:it(E.light.blueWhite)},cityTeal:{value:it(E.light.teal)},cityWindow:{value:it(E.light.warm)},cityMagenta:{value:it(E.light.magenta)},cityPink:{value:it(E.light.pink)},cityWindowIntensity:{value:E.windowIntensity},cityLitMin:{value:E.litMin},cityLitMax:{value:E.litMax},cityDotGain:{value:E.dots.gain},cityDotPx:{value:E.dots.px},cityZoom:{value:1},cityViewH:{value:800},cityPxAngle:{value:.0014},cityDotKeep:{value:1},cityHaloA:{value:it(E.halo.colorA)},cityHaloB:{value:it(E.halo.colorB)},cityHaloGain:{value:0},cityHead:{value:it(E.traffic.head)},cityTail:{value:it(E.traffic.tail)},cityRiverDay:{value:it(E.river.day)},cityRiverDaySky:{value:it(E.river.daySky)},cityRiverSunset:{value:it(E.river.sunset)},cityRiverSunsetSky:{value:it(E.river.sunsetSky)},cityRiverNight:{value:it(E.river.night)},cityRiverNightSky:{value:it(E.river.nightSky)}},pt=e=>e.toFixed(3),[$s,Hs,Is]=[E.light.share[0],E.light.share[0]+E.light.share[1],E.light.share[0]+E.light.share[1]+E.light.share[2]],Za=`
vec3 tcTone(float t){return t<${pt($s)}?cityCream:t<${pt(Hs)}?cityBlueWhite:t<${pt(Is)}?cityTeal:cityWindow;}
vec3 tcToneAvg(){return cityCream*${pt(E.light.share[0])}+cityBlueWhite*${pt(E.light.share[1])}+cityTeal*${pt(E.light.share[2])}+cityWindow*${pt(E.light.share[3])};}`,Os=`
uniform float cityNight,cityDay,citySunset,cityLights,cityTime,cityHazeScale,cityHazeMax,cityWindowIntensity,cityLitMin,cityLitMax,cityZoom;
uniform vec3 citySun,cityHaze,cityDayLit,cityDayShade,cityDayRoof,cityGlassDay,cityGlassTop,cityDuskLit,cityDuskShade,cityDuskRoof,cityDuskRim,cityGlassDusk,cityGlassDuskLit;
uniform vec3 cityBinoLit,cityBinoShade,cityBinoRoof,cityBinoHaze;
uniform vec3 cityNightTint,cityNightLit,cityGlassNight,cityCream,cityBlueWhite,cityTeal,cityWindow,cityMagenta,cityPink;
uniform vec3 cityRiverDay,cityRiverDaySky,cityRiverSunset,cityRiverSunsetSky,cityRiverNight,cityRiverNightSky;
float tcHash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
// 거리 대기 원근: 시간대 연무색으로. 상한(cityHazeMax)을 둬 먼 건물도 실루엣이 남는다.
// 쌍안경(cityZoom>1)은 배율만큼 연무를 덜 받는다(실제보다 또렷하게: 확대해도 덩어리로 뭉개지지 않게).
float tcFog(float d){return min(1.-exp(-d/(cityHazeScale*(1.+(cityZoom-1.)*${pt(E.zoomClear)}))),cityHazeMax);}
${Za}`,Gs="attribute vec3 seoulInfo;attribute float seoulType;varying vec3 vTcWorld;varying vec3 vTcNormal;varying vec3 vTcInfo;varying float vTcDist;varying float vTcType;",Us=`
{
 vec4 tcW=modelMatrix*vec4(transformed,1.);vTcWorld=tcW.xyz;vTcNormal=normalize(mat3(modelMatrix)*normal);vTcInfo=seoulInfo;vTcType=seoulType;
 vTcDist=length((viewMatrix*tcW).xyz);
}`,Vs=`
varying vec3 vTcWorld;varying vec3 vTcNormal;varying vec3 vTcInfo;varying float vTcDist;varying float vTcType;
${Os}`,js=`
{
 bool known=vTcInfo.x>0.;
 float seed=known?vTcInfo.x:tcHash(floor(vTcWorld.xz/40.));
 float baseY=known?vTcInfo.y:0.,bh=known?max(vTcInfo.z,1.):40.;
 int use=int(vTcType+.5);
 vec3 N=normalize(vTcNormal);
 float roof=step(.5,N.y),v=vTcWorld.y-baseY,hv=clamp(v/bh,0.,1.);
 float s2=fract(seed*7.31),s3=fract(seed*13.7);
 // 파스텔: 실제 외벽색(정점색)의 색감은 남기고 채도를 빼 흰색 쪽으로 올린다.
 vec3 src=diffuseColor.rgb;float lum=dot(src,vec3(.299,.587,.114));
 vec3 pastel=mix(mix(src,vec3(lum),${pt(E.pastelDesat)}),vec3(1.),${pt(E.pastelLift)});
 // 해 쪽 벽(수평 방향)만 밝다: 2단 툰. 해가 낮을수록(노을) 경계가 또렷하다.
 vec3 sunH=normalize(vec3(citySun.x,0.,citySun.z)+vec3(1e-4,0.,0.));
 float litK=mix(smoothstep(-.12,.12,dot(N,sunH)),1.,roof);
 // 멀수록 밝은 면·그늘 차(대비)가 줄어 층층이 옅어진다.
 float fog=tcFog(vTcDist);float contrast=1.-fog*.55;litK=mix(.55,litK,contrast);
 vec3 dayC=pastel*mix(mix(cityDayShade,cityDayLit,litK),cityDayRoof,roof);
 vec3 duskC=pastel*mix(mix(cityDuskShade,cityDuskLit,litK),cityDuskRoof,roof);
 // 쌍안경 노을: 청회색 본체(해를 정면으로 받는 벽만 밝게). zb는 1배에서 0이라 1배 노을은 그대로다.
 float zb=smoothstep(1.5,4.,cityZoom);
 float litB=mix(.4,mix(smoothstep(${pt(E.binoDusk.litFrom)},${pt(E.binoDusk.litFrom+.25)},dot(N,sunH)),1.,roof),contrast);
 duskC=mix(duskC,pastel*mix(mix(cityBinoShade,cityBinoLit,litB),cityBinoRoof,roof),zb);
 vec3 nightC=mix(cityNightTint,cityNightLit,litK*.6)*mix(.82,1.12,fract(seed*3.7));
 // 노을 윤곽빛: 해 쪽 벽 맨 위 1.5m, 지붕 가장자리 쪽이 크림으로 빛난다(14_13·14_14 지붕 윤곽).
 float rim=step(bh-mix(1.6,${pt(E.binoDusk.rimM)},zb),v)*(1.-roof)*step(.5,mix(litK,litB+.3,zb));
 duskC=mix(duskC,cityDuskRim,rim*.85);dayC=mix(dayC,cityDayLit,rim*.5);
 vec3 col=dayC*cityDay+duskC*citySunset+nightC*cityNight;
 vec3 glow=vec3(0.);
 if(use==5){
  // 항공장애등: 낮엔 빨간 점, 밤엔 깜빡인다.
  col=vec3(.62,.1,.08);glow=vec3(1.5,.16,.1)*cityLights*step(.45,fract(cityTime*.75+seed*7.));
 }else if(use==8){
  // 남산타워 기둥: 창 없음. 밤에 아래 푸른빛 → 위 흰빛 조명.
  glow=mix(vec3(.3,.42,.95),vec3(.92,.9,1.),hv)*.42*cityLights;
 }else if(roof<.5&&use!=4){
  // 창 격자(월드 좌표). 용도마다 층 높이·칸 폭·유리 면적이 다르다.
  float floorH=3.2,colW=3.4,glassy=0.;vec2 lo=vec2(.22,.3),hi=vec2(.78,.8);
  if(use==0){floorH=2.8;colW=mix(2.6,3.8,s2);lo=vec2(.08,.34);hi=vec2(.92,.84);}
  else if(use==1){floorH=mix(3.7,4.3,s2);colW=mix(1.5,2.3,s3);glassy=step(.38,seed);lo=glassy>.5?vec2(.06,.18):vec2(.18,.26);hi=glassy>.5?vec2(.94,.94):vec2(.82,.8);}
  else if(use==2){floorH=3.1;colW=mix(3.,4.6,s2);lo=vec2(.25,.34);hi=vec2(.72,.78);}
  else if(use==3){floorH=6.;colW=mix(5.,8.,s2);lo=vec2(.1,.62);hi=vec2(.9,.8);}
  else if(use==6||use==7){floorH=4.;colW=1.6;glassy=1.;lo=vec2(.05,.15);hi=vec2(.95,.94);}
  else if(use==9){floorH=3.5;colW=1.2;glassy=1.;lo=vec2(.03,.1);hi=vec2(.97,.9);}
  vec2 T=normalize(vec2(-N.z,N.x)+1e-5);
  vec2 cell=vec2(dot(vTcWorld.xz,T)/colW,v/floorH),id=floor(cell),f=fract(cell);
  // 칸이 픽셀보다 작아지면 축마다 유리 면적 평균으로 바꿔 지글거림(모아레)을 막는다.
  vec2 farA=smoothstep(vec2(.3),vec2(1.),fwidth(cell));float far=max(farA.x,farA.y);
  float pane=mix(step(lo.x,f.x)*step(f.x,hi.x),hi.x-lo.x,farA.x)*mix(step(lo.y,f.y)*step(f.y,hi.y),hi.y-lo.y,farA.y);
  pane*=(1.-step(bh-1.2,v))*step(.5,id.y);
  // 낮 유리: 하늘빛(위로 갈수록 밝게). 업무 유리 외벽은 면 전체가 유리라 하늘이 비친 듯 보인다.
  vec3 gDay=mix(cityGlassDay,cityGlassTop,hv*.8+.2*litK)*mix(.9,1.04,litK);
  vec3 gDusk=mix(cityGlassDusk,cityGlassDuskLit,litK*mix(.5,1.,hv));
  vec3 gNight=cityGlassNight;
  vec3 glass=gDay*cityDay+gDusk*citySunset+gNight*cityNight;
  float gAmt=pane*mix(.5,.88,glassy);
  if(use==6)glass*=vec3(1.18,.98,.7);
  col=mix(col,glass,gAmt);
  // 밤 창 불빛: 칸마다 켜짐·색이 다르고, 건물마다 늦게까지 켜진 정도가 다르다.
  if(cityLights>.001){
   float h=tcHash(id*vec2(1.,1.37)+seed*97.);
   float share=mix(cityLitMin,cityLitMax,fract(seed*5.13))*cityLights*(use==3?.4:use>=6?1.4:1.);
   vec3 tone=tcTone(fract(h*17.3+seed*3.1));
   // 고층 위쪽: 일부 창이 분홍·자홍(14_15 고층 무리).
   float tall=step(${pt(E.light.tallHeight)},bh)*step(.6,hv);
   tone=mix(tone,mix(cityPink,cityMagenta,fract(h*5.3)),tall*step(${pt(1-E.light.magentaShare)},fract(h*7.7)));
   if(use==6)tone=mix(cityWindow,cityCream,.4);
   float lit=mix(step(h,share)*pane,share*pane*.5,far);
   tone=mix(tone,tcToneAvg(),far);
   // 먼 창 평균은 블룸 문턱 아래로(빛 덩어리 방지). 먼 도심 불빛은 벽 불빛 점이 맡는다.
   glow+=tone*lit*cityWindowIntensity*mix(.75,1.15,fract(h*29.))*mix(1.,.55,far);
   // 저층 1층 상가 진열창.
   if(use==2)glow+=cityCream*.4*cityLights*step(v,floorH*1.1)*step(.55,fract(seed*3.3+id.x*.13))*(1.-far*.6);
  }
 }
 col=mix(col,mix(cityHaze,cityBinoHaze,zb*citySunset),fog);
 diffuseColor.rgb=col+glow*(1.-fog*.5);
}`,Ks=`
uniform float cityLights,cityDotPx,cityZoom,cityPxAngle,cityDotKeep;attribute float aDot;attribute float aTall;varying float vOn;varying float vTone;varying float vTall;varying float vDist;
void main(){
 vec4 mv=modelViewMatrix*vec4(position,1.);float d=length(mv.xyz);
 mv.xyz*=max(0.,d-clamp(d*.004,1.,60.))/max(d,1e-3);
 gl_Position=projectionMatrix*mv;
 vOn=step(aDot,cityLights*1.05-.05);
 // 한 픽셀에 겹치는 벽 넓이가 크면(멀리·1배) 그만큼 솎는다: 남는 비율 = 목표 밀도 / (벽 m²당 점 × 겹침 × 픽셀 넓이).
 float pxm=d*cityPxAngle;vOn*=step(fract(aDot*91.7),cityDotKeep*${pt(E.dots.target)}/(${E.dots.density.toFixed(5)}*${E.dots.layers.toFixed(1)}*pxm*pxm));vTone=fract(aDot*53.7);vTall=aTall;vDist=d;
 gl_PointSize=vOn*cityDotPx*mix(1.5,1.,smoothstep(2000.,14000.,d))*(.8+.5*fract(aDot*17.3))*mix(1.,1.25,clamp((cityZoom-1.)/7.,0.,1.));
}`,qs=`
uniform vec3 cityCream,cityBlueWhite,cityTeal,cityWindow,cityMagenta,cityPink,cityHaze;uniform float cityDotGain,cityHazeScale,cityHazeMax,cityZoom;varying float vOn;varying float vTone;varying float vTall;varying float vDist;
${Za}
void main(){if(vOn<.5)discard;float r=length(gl_PointCoord-.5);if(r>.5)discard;
 vec3 c=tcTone(vTone);c=mix(c,mix(cityPink,cityMagenta,fract(vTone*5.3)),vTall*step(${pt(1-E.light.magentaShare)},fract(vTone*7.7)));
 float fog=min(1.-exp(-vDist/(cityHazeScale*(1.+(cityZoom-1.)*${pt(E.zoomClear)}))),cityHazeMax);
 gl_FragColor=vec4(mix(c*cityDotGain,cityHaze,fog*.45)*(1.-.35*smoothstep(.2,.5,r)),1.);}`;function Zs(e,{density:t=E.dots.density,max:o=E.dots.max}={},a=null){const i=e?.attributes?.position;if(!i)return null;const s=e.attributes.seoulInfo,n=e.index,r=n?n.count/3:i.count/3,l=[],c=[],u=[],f=new P,h=new P,m=new P,d=new P,g=new P,p=new P;let y=0,v=0;for(let w=0;w<r;w++){const M=n?n.getX(w*3):w*3,k=n?n.getX(w*3+1):w*3+1,D=n?n.getX(w*3+2):w*3+2;f.fromBufferAttribute(i,M),h.fromBufferAttribute(i,k),m.fromBufferAttribute(i,D),g.subVectors(h,f),p.subVectors(m,f),d.crossVectors(g,p);const B=d.length()/2;if(B<.001||Math.abs(d.y)/(B*2)>.5)continue;const A=s?s.getY(M):0,S=s?s.getZ(M):0;if(a&&s&&S>=E.halo.height){const T=s.getX(M).toFixed(6)+":"+A.toFixed(1),b=a.get(T)??{x:0,z:0,n:0,base:A,height:S};b.x+=f.x,b.z+=f.z,b.n++,a.set(T,b)}if(!(l.length/3>=o))for(y+=B*t;y>=1&&l.length/3<o;){y-=1,v++;const T=C=>{const _=Math.sin(v*12.9898+C*78.233+w*.37)*43758.5453;return _-Math.floor(_)};let b=T(1),F=T(2);b+F>1&&(b=1-b,F=1-F);const z=f.y+g.y*b+p.y*F;l.push(f.x+g.x*b+p.x*F,z,f.z+g.z*b+p.z*F),c.push(T(3)),u.push(s&&S>=E.light.tallHeight&&(z-A)/S>.6?1:0)}}return l.length?{position:new Float32Array(l),aDot:new Float32Array(c),aTall:new Float32Array(u)}:null}const Xs=`
uniform float cityViewH,cityHaloGain;attribute float aSize;attribute float aTone;varying float vTone;varying float vA;
void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;float d=max(-mv.z,1.);
 float px=aSize*projectionMatrix[1][1]*cityViewH*.5/d;
 // 화면에서 작을수록(1배·먼 곳) 약하게: 고층 무리 빛무리가 겹쳐 흰 덩어리가 되지 않게.
 vTone=aTone;vA=cityHaloGain*clamp(px/${E.halo.fullPx.toFixed(1)},.08,1.);gl_PointSize=cityHaloGain>.0005?clamp(px,2.,${E.halo.maxPx.toFixed(1)}):0.;}`,Ys=`
uniform vec3 cityHaloA,cityHaloB;varying float vTone;varying float vA;
void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;float a=exp(-r*r*3.5)*(1.-smoothstep(.75,1.,r));
 gl_FragColor=vec4(mix(cityHaloA,cityHaloB,vTone)*a*vA,1.);}`,Qs=`
attribute float aAlong;attribute float aDir;attribute float aSeed;varying float vAlong;varying float vDir;varying float vSeed;varying float vDist;
void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;vAlong=aAlong;vDir=aDir;vSeed=aSeed;vDist=length(mv.xyz);}`,Js=`
uniform float cityLights,cityTime,cityHazeScale,cityHazeMax,cityZoom,cityPxAngle;uniform vec3 cityHead,cityTail,cityHaze;varying float vAlong;varying float vDir;varying float vSeed;varying float vDist;
float tcHash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
void main(){
 float k=vAlong/${E.traffic.cell.toFixed(1)}-cityTime*${E.traffic.speed.toFixed(2)}*vDir*mix(.8,1.2,vSeed);
 float id=floor(k),f=fract(k);
 float car=step(tcHash(vec2(id,vSeed*91.)),${E.traffic.fill.toFixed(2)})*smoothstep(.0,.08,f)*(1.-smoothstep(.3,.42,f));
 float px=fwidth(k);car=mix(car,${(E.traffic.fill*.36).toFixed(3)},smoothstep(.25,1.,px));
 vec3 c=vDir>0.?cityHead:cityTail;
 float fog=min(1.-exp(-vDist/(cityHazeScale*(1.+(cityZoom-1.)*${pt(E.zoomClear)}))),cityHazeMax);
 // 한 픽셀이 clearM(m)보다 넓은 땅을 덮으면(1배·먼 곳) 그만큼 어둡게: 많은 도로 선이 한 픽셀에 겹쳐 흰 빛 덩어리가 되지 않게.
 float dense=clamp(${E.traffic.clearM.toFixed(2)}/(vDist*cityPxAngle),0.,1.);
 float a=car*cityLights*(1.-fog*.6)*dense*${E.traffic.gain.toFixed(2)};if(a<.003)discard;
 gl_FragColor=vec4(c*a,1.);}`;function ti(e,t,{kinds:o=E.traffic.kinds,major:a=E.traffic.major,maxSegment:i=E.traffic.maxSegment}={}){const s=[],n=[],r=[],l=[];let c=7,u=0;const f=()=>(c=c*16807%2147483647)/2147483647,h=(e??[]).filter(g=>g.bridge||o.test(g.kind??"")),m=g=>a.test(g.kind??"");for(const g of[...h.filter(m),...h.filter(p=>!m(p))]){!m(g)&&!u&&(u=s.length/3);const p=Math.max(1.5,(g.width??10)*.25),y=f();let v=0;for(let w=1;w<g.points.length;w++){const[M,k]=g.points[w-1],[D,B]=g.points[w],A=D-M,S=B-k,T=Math.hypot(A,S);if(T<.1)continue;const b=-S/T,F=A/T,z=Math.max(1,Math.ceil(T/i)),C=g.bridge?Math.max(24,t(M,k),t(D,B))+3:null;for(let _=0;_<z;_++){const W=_/z,H=(_+1)/z,R=M+A*W,O=k+S*W,I=M+A*H,K=k+S*H;for(const U of[1,-1]){const X=b*p*U,x=F*p*U,N=C??t(R+X,O+x)+2.5,Y=C??t(I+X,K+x)+2.5;s.push(R+X,N,O+x,I+X,Y,K+x),n.push(v+T*W,v+T*H),r.push(U,U),l.push(y,y)}}v+=T}}if(!s.length)return null;const d=new xt;return d.setAttribute("position",new at(s,3)),d.setAttribute("aAlong",new at(n,1)),d.setAttribute("aDir",new at(r,1)),d.setAttribute("aSeed",new at(l,1)),d.computeBoundingSphere(),d.userData.majorCount=u||s.length/3,d}const ei=`
{
 vec3 V=normalize(cameraPosition-vTcWorld);float d=vTcDist;
 float fres=pow(1.-clamp(V.y,0.,1.),4.);
 // 시선 방향(수평)과 그 옆 방향: 반사는 시선 쪽으로 길게 늘어진다.
 vec2 fw=normalize(-V.xz+1e-5),side=vec2(-fw.y,fw.x);
 float along=dot(vTcWorld.xz,fw),across=dot(vTcWorld.xz,side);
 // 잔물결 띠(가로 줄): 시선 방향으로 18m 간격, 시간에 따라 조금씩 흐른다.
 float wq=along/18.+cityTime*.08,wid=floor(wq),wf=fract(wq);
 float ripple=step(.72,tcHash(vec2(wid,floor(across/60.))))*smoothstep(.0,.2,wf)*(1.-smoothstep(.45,.65,wf));
 ripple=mix(ripple,.08,smoothstep(.3,1.,fwidth(wq)));
 vec3 dayW=mix(cityRiverDay,cityRiverDaySky,fres*.75+ripple*.25);
 // 노을: 해 쪽으로 빛길(살구), 나머지는 라벤더.
 vec3 sunH=normalize(vec3(citySun.x,0.,citySun.z)+vec3(1e-4,0.,0.));
 float path=pow(max(dot(-V,sunH),0.),6.)*(.6+ripple);
 vec3 duskW=mix(cityRiverSunset,cityRiverSunsetSky,clamp(fres*.6+path*.8,0.,1.));
 // 밤: 강변 불빛이 물결에 세로로 늘어진 반사(옆 방향 9m 칸마다 켜짐·색).
 vec3 nightW=mix(cityRiverNight,cityRiverNightSky,fres*.55);
 float cq=across/9.,cid=floor(cq);
 float col=step(1.-${pt(E.river.streak)},tcHash(vec2(cid,7.)));
 float flick=step(.35,tcHash(vec2(cid,floor(along/14.+cityTime*.6))));
 float streak=col*flick*(1.-smoothstep(.08,.2,abs(fract(cq)-.5)));
 streak=mix(streak,${pt(E.river.streak*.12)},smoothstep(.3,1.,fwidth(cq)));
 vec3 lightC=mix(cityCream,cityPink,step(.75,tcHash(vec2(cid,3.))));
 vec3 c=dayW*cityDay+duskW*citySunset+nightW*cityNight;
 float fog=tcFog(d);c=mix(c,cityHaze,fog);
 c+=lightC*streak*cityLights*${pt(E.river.streakGain)}*(1.-fog*.5);
 diffuseColor.rgb=c;
}`;function oi(){const e={materials:0,swapped:0,nightLights:0,dots:0,halos:0,traffic:0,river:0,landmarks:0},t=new Set,o=(z,C,_)=>(z.onBeforeCompile=W=>{Object.assign(W.uniforms,ne),W.vertexShader=W.vertexShader.replace("#include <common>",`#include <common>
${Gs}`).replace("#include <project_vertex>",`#include <project_vertex>
${Us}`),W.fragmentShader=W.fragmentShader.replace("#include <common>",`#include <common>
${Vs}`).replace("#include <color_fragment>",`#include <color_fragment>
${C}`)},z.customProgramCacheKey=()=>_,z.userData.shared=!0,z);function a({side:z=zt}={}){const C=o(new pe({name:"toon-city",color:16777215,vertexColors:!0,side:z,fog:!1}),js,"toon-city-v2");return C.userData.toonCity=!0,t.add(C),e.materials++,C}let i=null;function s(){return i||(i=o(new pe({name:"toon-han-river",color:16777215,side:zt,fog:!1}),ei,"toon-city-river-v1"),e.river++,i)}const n=new Dt;n.name="도심 밤 덧그림",n.userData.toonCityExtras=!0;const r=new St({name:"toon-city-dots",uniforms:ne,vertexShader:Ks,fragmentShader:qs,fog:!1});r.userData.shared=!0;const l=new St({name:"toon-city-halo",uniforms:ne,vertexShader:Xs,fragmentShader:Ys,fog:!1,transparent:!0,depthWrite:!1,blending:Qe});l.userData.shared=!0;const c=new St({name:"toon-city-traffic",uniforms:ne,vertexShader:Qs,fragmentShader:Js,fog:!1,transparent:!0,depthWrite:!1,blending:Qe});c.userData.shared=!0;const u=[],f=new Map;let h=!1,m=-1e9;const d=new Je(new xt,r);d.name="도심 불빛 점",d.frustumCulled=!1,d.userData.toonCityDots=!0,d.visible=!1;const g=new Je(new xt,l);g.name="도심 고층 빛무리",g.frustumCulled=!1,g.visible=!1,g.renderOrder=2;const p=new wt;d.onBeforeRender=g.onBeforeRender=z=>{z.getDrawingBufferSize(p),ne.cityViewH.value=p.y},n.add(d,g);function y(){h=!1,m=globalThis.performance?.now?.()??0;const z=u.reduce((x,N)=>x+N.aDot.length,0),C=new Float32Array(z*3),_=new Float32Array(z),W=new Float32Array(z);let H=0;for(const x of u)C.set(x.position,H*3),_.set(x.aDot,H),W.set(x.aTall,H),H+=x.aDot.length;const R=new xt;R.setAttribute("position",new ke(C,3)),R.setAttribute("aDot",new ke(_,1)),R.setAttribute("aTall",new ke(W,1)),d.geometry.dispose(),d.geometry=R;const O=[],I=[],K=[];let U=0;for(const x of f.values())O.push(x.x/x.n,x.base+x.height*.78,x.z/x.n),I.push(E.halo.base+x.height*E.halo.scale),K.push((Math.sin(++U*12.9898)*43758.5453%1+1)%1);const X=new xt;X.setAttribute("position",new at(O,3)),X.setAttribute("aSize",new at(I,1)),X.setAttribute("aTone",new at(K,1)),g.geometry.dispose(),g.geometry=X,e.halos=f.size}function v(z){if(z.userData.toonCityDots)return;z.userData.toonCityDots=!0;const C=E.dots.total-e.dots,_=Zs(z.geometry,{max:Math.max(0,Math.min(E.dots.max,C))},f);if(!_){h=!0;return}u.push(_),e.dots+=_.aDot.length,h=!0}const w=new WeakMap;function M(z){z.traverse(C=>{const _=C.material;if(!(!_||Array.isArray(_))){if(!w.has(_)){const W=_.clone();W.color?.copy(da).multiplyScalar(j.city.lampGain),W.toneMapped=!0,W.userData={..._.userData,shared:!0,toonNightLight:!0},_.isShaderMaterial&&/lampSize/.test(_.vertexShader)&&(W.uniforms={..._.uniforms,cityLampTint:{value:da},cityLampGain:{value:j.city.roadLightGain}},W.vertexShader=_.vertexShader.replace("clamp(lampSize*(1.6+zoom*.28)*pixelRatio,1.0,7.0)","clamp(lampSize*(1.6+zoom*.28)*pixelRatio*.6,1.0,4.0)"),W.fragmentShader=_.fragmentShader.replace("varying vec3 vColor;","uniform vec3 cityLampTint;uniform float cityLampGain;varying vec3 vColor;").replace("vColor*vAlpha*a*1.15","mix(vColor,cityLampTint,.8)*vAlpha*a*cityLampGain")),w.set(_,W)}C.material=w.get(_),e.nightLights++}})}let k=null;function D(z,C,_=n){if(k)return k;const W=ti(z,C);return W?(k=new On(W,c),k.name="도심 차량 불빛 줄기",k.frustumCulled=!1,k.visible=!1,k.renderOrder=1,_.add(k),e.traffic=W.attributes.position.count/2,k):null}function B({material:z,nightLights:C=[]}={}){const _=a({side:z?.side??zt});for(const I of C)M(I);const W=I=>I.traverse(K=>{K.isMesh&&!K.isSprite&&K.material!==_&&!K.userData.seoulLabel&&!K.userData.toonCityExtras&&!K.parent?.userData.toonCityExtras&&(K.material=_,e.swapped++,v(K))}),H=[];function R(I){n.parent||I.add(n),W(I);const K=U=>{U.child!==n&&W(U.child)};return I.addEventListener("childadded",K),H.push([I,K]),I}function O(I){return W(I),e.landmarks++,I}return{material:_,apply:R,applyLandmark:O,update:F,styleNightLight:M,styleRoads:D,riverMaterial:s,dispose(){for(const[I,K]of H)I.removeEventListener("childadded",K);_.dispose(),t.delete(_)}}}const A=new nt,S=new nt,T=new nt,b={day:it(E.day.haze),sunset:it(E.sunset.haze),night:it(E.night.haze)};function F(z={},C=null,_=2){const W=Rt(z),H=ne;H.cityDay.value=W.day,H.citySunset.value=W.sunset,H.cityNight.value=W.night;const R=Number.isFinite(z.elevation)?z.elevation:30,O=Math.min(1,Math.max(0,(3-R)/11)),I=Math.max(z.night??0,z.city??0,O*O*(3-2*O));H.cityLights.value=I;const K=globalThis.performance?.now?.()??0;if(H.cityTime.value=K/1e3,z.sunVector)H.citySun.value.fromArray(z.sunVector.toArray?z.sunVector.toArray():z.sunVector);else if(Number.isFinite(z.azimuth)&&Number.isFinite(z.elevation)){const x=z.azimuth*Math.PI/180,N=z.elevation*Math.PI/180;H.citySun.value.set(Math.sin(x)*Math.cos(N),Math.sin(N),-Math.cos(x)*Math.cos(N))}A.setRGB(0,0,0);for(const x of["day","sunset","night"])A.add(S.copy(b[x]).multiplyScalar(W[x]));const U=z.fogColor??z.haze;U&&(T.setRGB(U[0],U[1],U[2],ht),A.lerp(T,.25));const X=z.gray??0;if(X>0){const x=A.r*.2126+A.g*.7152+A.b*.0722;A.lerp(S.setRGB(x,x,x),X*.5)}if(H.cityHaze.value.copy(A),H.cityHazeScale.value=E.day.hazeScale*W.day+E.sunset.hazeScale*W.sunset+E.night.hazeScale*W.night,H.cityHazeMax.value=E.day.hazeMax*W.day+E.sunset.hazeMax*W.sunset+E.night.hazeMax*W.night,H.cityHaloGain.value=E.halo.gain*Math.max(I,0)*(1-W.sunset*(1-E.halo.dusk))*(1-X*.5),C){const x=Math.max(1,C.zoom||1);H.cityZoom.value=x,H.cityPxAngle.value=2*Math.tan((C.fov??60)*Math.PI/360)/Math.max(1,H.cityViewH.value)/x}if(h&&K-m>500&&y(),d.visible=I>.02&&e.dots>0,g.visible=H.cityHaloGain.value>5e-4&&e.halos>0,k){k.visible=I>.02;const x=k.geometry;x.setDrawRange(0,_===0?x.userData.majorCount:1/0)}H.cityDotKeep.value=_===0?E.dots.lowKeep:1}return{styleCity:B,update:F,status:e,riverMaterial:s,styleRoads:D,extras:n}}const qe={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};class ee{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const ai=new Gn(-1,1,1,-1,0,1);class ni extends xt{constructor(){super(),this.setAttribute("position",new at([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new at([0,2,0,0,2,0],2))}}const si=new ni;class co{constructor(t){this._mesh=new _t(si,t)}dispose(){this._mesh.geometry.dispose()}render(t){t.render(this._mesh,ai)}get material(){return this._mesh.material}set material(t){this._mesh.material=t}}class Xa extends ee{constructor(t,o="tDiffuse"){super(),this.textureID=o,this.uniforms=null,this.material=null,t instanceof St?(this.uniforms=t.uniforms,this.material=t):t&&(this.uniforms=ge.clone(t.uniforms),this.material=new St({name:t.name!==void 0?t.name:"unspecified",defines:Object.assign({},t.defines),uniforms:this.uniforms,vertexShader:t.vertexShader,fragmentShader:t.fragmentShader})),this._fsQuad=new co(this.material)}render(t,o,a){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=a.texture),this._fsQuad.material=this.material,this.renderToScreen?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(o),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this._fsQuad.render(t))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}class ma extends ee{constructor(t,o){super(),this.scene=t,this.camera=o,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(t,o,a){const i=t.getContext(),s=t.state;s.buffers.color.setMask(!1),s.buffers.depth.setMask(!1),s.buffers.color.setLocked(!0),s.buffers.depth.setLocked(!0);let n,r;this.inverse?(n=0,r=1):(n=1,r=0),s.buffers.stencil.setTest(!0),s.buffers.stencil.setOp(i.REPLACE,i.REPLACE,i.REPLACE),s.buffers.stencil.setFunc(i.ALWAYS,n,4294967295),s.buffers.stencil.setClear(r),s.buffers.stencil.setLocked(!0),t.setRenderTarget(a),this.clear&&t.clear(),t.render(this.scene,this.camera),t.setRenderTarget(o),this.clear&&t.clear(),t.render(this.scene,this.camera),s.buffers.color.setLocked(!1),s.buffers.depth.setLocked(!1),s.buffers.color.setMask(!0),s.buffers.depth.setMask(!0),s.buffers.stencil.setLocked(!1),s.buffers.stencil.setFunc(i.EQUAL,1,4294967295),s.buffers.stencil.setOp(i.KEEP,i.KEEP,i.KEEP),s.buffers.stencil.setLocked(!0)}}class ii extends ee{constructor(){super(),this.needsSwap=!1}render(t){t.state.buffers.stencil.setLocked(!1),t.state.buffers.stencil.setTest(!1)}}class ri{constructor(t,o){if(this.renderer=t,this._pixelRatio=t.getPixelRatio(),o===void 0){const a=t.getSize(new wt);this._width=a.width,this._height=a.height,o=new ce(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:fe}),o.texture.name="EffectComposer.rt1"}else this._width=o.width,this._height=o.height;this.renderTarget1=o,this.renderTarget2=o.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new Xa(qe),this.copyPass.material.blending=Un,this.clock=new Vn}swapBuffers(){const t=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=t}addPass(t){this.passes.push(t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(t,o){this.passes.splice(o,0,t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(t){const o=this.passes.indexOf(t);o!==-1&&this.passes.splice(o,1)}isLastEnabledPass(t){for(let o=t+1;o<this.passes.length;o++)if(this.passes[o].enabled)return!1;return!0}render(t){t===void 0&&(t=this.clock.getDelta());const o=this.renderer.getRenderTarget();let a=!1;for(let i=0,s=this.passes.length;i<s;i++){const n=this.passes[i];if(n.enabled!==!1){if(n.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(i),n.render(this.renderer,this.writeBuffer,this.readBuffer,t,a),n.needsSwap){if(a){const r=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(r.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,t),l.setFunc(r.EQUAL,1,4294967295)}this.swapBuffers()}ma!==void 0&&(n instanceof ma?a=!0:n instanceof ii&&(a=!1))}}this.renderer.setRenderTarget(o)}reset(t){if(t===void 0){const o=this.renderer.getSize(new wt);this._pixelRatio=this.renderer.getPixelRatio(),this._width=o.width,this._height=o.height,t=this.renderTarget1.clone(),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=t,this.renderTarget2=t.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(t,o){this._width=t,this._height=o;const a=this._width*this._pixelRatio,i=this._height*this._pixelRatio;this.renderTarget1.setSize(a,i),this.renderTarget2.setSize(a,i);for(let s=0;s<this.passes.length;s++)this.passes[s].setSize(a,i)}setPixelRatio(t){this._pixelRatio=t,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class li extends ee{constructor(t,o,a=null,i=null,s=null){super(),this.scene=t,this.camera=o,this.overrideMaterial=a,this.clearColor=i,this.clearAlpha=s,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new nt}render(t,o,a){const i=t.autoClear;t.autoClear=!1;let s,n;this.overrideMaterial!==null&&(n=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(t.getClearColor(this._oldClearColor),t.setClearColor(this.clearColor,t.getClearAlpha())),this.clearAlpha!==null&&(s=t.getClearAlpha(),t.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&t.clearDepth(),t.setRenderTarget(this.renderToScreen?null:a),this.clear===!0&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),t.render(this.scene,this.camera),this.clearColor!==null&&t.setClearColor(this._oldClearColor),this.clearAlpha!==null&&t.setClearAlpha(s),this.overrideMaterial!==null&&(this.scene.overrideMaterial=n),t.autoClear=i}}const ci={uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new nt(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};class ve extends ee{constructor(t,o=1,a,i){super(),this.strength=o,this.radius=a,this.threshold=i,this.resolution=t!==void 0?new wt(t.x,t.y):new wt(256,256),this.clearColor=new nt(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let s=Math.round(this.resolution.x/2),n=Math.round(this.resolution.y/2);this.renderTargetBright=new ce(s,n,{type:fe}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let u=0;u<this.nMips;u++){const f=new ce(s,n,{type:fe});f.texture.name="UnrealBloomPass.h"+u,f.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(f);const h=new ce(s,n,{type:fe});h.texture.name="UnrealBloomPass.v"+u,h.texture.generateMipmaps=!1,this.renderTargetsVertical.push(h),s=Math.round(s/2),n=Math.round(n/2)}const r=ci;this.highPassUniforms=ge.clone(r.uniforms),this.highPassUniforms.luminosityThreshold.value=i,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new St({uniforms:this.highPassUniforms,vertexShader:r.vertexShader,fragmentShader:r.fragmentShader}),this.separableBlurMaterials=[];const l=[3,5,7,9,11];s=Math.round(this.resolution.x/2),n=Math.round(this.resolution.y/2);for(let u=0;u<this.nMips;u++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(l[u])),this.separableBlurMaterials[u].uniforms.invSize.value=new wt(1/s,1/n),s=Math.round(s/2),n=Math.round(n/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=o,this.compositeMaterial.uniforms.bloomRadius.value=.1;const c=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=c,this.bloomTintColors=[new P(1,1,1),new P(1,1,1),new P(1,1,1),new P(1,1,1),new P(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=ge.clone(qe.uniforms),this.blendMaterial=new St({uniforms:this.copyUniforms,vertexShader:qe.vertexShader,fragmentShader:qe.fragmentShader,blending:Qe,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new nt,this._oldClearAlpha=1,this._basic=new pe,this._fsQuad=new co(null)}dispose(){for(let t=0;t<this.renderTargetsHorizontal.length;t++)this.renderTargetsHorizontal[t].dispose();for(let t=0;t<this.renderTargetsVertical.length;t++)this.renderTargetsVertical[t].dispose();this.renderTargetBright.dispose();for(let t=0;t<this.separableBlurMaterials.length;t++)this.separableBlurMaterials[t].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(t,o){let a=Math.round(t/2),i=Math.round(o/2);this.renderTargetBright.setSize(a,i);for(let s=0;s<this.nMips;s++)this.renderTargetsHorizontal[s].setSize(a,i),this.renderTargetsVertical[s].setSize(a,i),this.separableBlurMaterials[s].uniforms.invSize.value=new wt(1/a,1/i),a=Math.round(a/2),i=Math.round(i/2)}render(t,o,a,i,s){t.getClearColor(this._oldClearColor),this._oldClearAlpha=t.getClearAlpha();const n=t.autoClear;t.autoClear=!1,t.setClearColor(this.clearColor,0),s&&t.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=a.texture,t.setRenderTarget(null),t.clear(),this._fsQuad.render(t)),this.highPassUniforms.tDiffuse.value=a.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,t.setRenderTarget(this.renderTargetBright),t.clear(),this._fsQuad.render(t);let r=this.renderTargetBright;for(let l=0;l<this.nMips;l++)this._fsQuad.material=this.separableBlurMaterials[l],this.separableBlurMaterials[l].uniforms.colorTexture.value=r.texture,this.separableBlurMaterials[l].uniforms.direction.value=ve.BlurDirectionX,t.setRenderTarget(this.renderTargetsHorizontal[l]),t.clear(),this._fsQuad.render(t),this.separableBlurMaterials[l].uniforms.colorTexture.value=this.renderTargetsHorizontal[l].texture,this.separableBlurMaterials[l].uniforms.direction.value=ve.BlurDirectionY,t.setRenderTarget(this.renderTargetsVertical[l]),t.clear(),this._fsQuad.render(t),r=this.renderTargetsVertical[l];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,t.setRenderTarget(this.renderTargetsHorizontal[0]),t.clear(),this._fsQuad.render(t),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,s&&t.state.buffers.stencil.setTest(!0),this.renderToScreen?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(a),this._fsQuad.render(t)),t.setClearColor(this._oldClearColor,this._oldClearAlpha),t.autoClear=n}_getSeparableBlurMaterial(t){const o=[];for(let a=0;a<t;a++)o.push(.39894*Math.exp(-.5*a*a/(t*t))/t);return new St({defines:{KERNEL_RADIUS:t},uniforms:{colorTexture:{value:null},invSize:{value:new wt(.5,.5)},direction:{value:new wt(.5,.5)},gaussianCoefficients:{value:o}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`#include <common>
				varying vec2 vUv;
				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float gaussianCoefficients[KERNEL_RADIUS];

				void main() {
					float weightSum = gaussianCoefficients[0];
					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;
					for( int i = 1; i < KERNEL_RADIUS; i ++ ) {
						float x = float(i);
						float w = gaussianCoefficients[i];
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += (sample1 + sample2) * w;
						weightSum += 2.0 * w;
					}
					gl_FragColor = vec4(diffuseSum/weightSum, 1.0);
				}`})}_getCompositeMaterial(t){return new St({defines:{NUM_MIPS:t},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`varying vec2 vUv;
				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor(const in float factor) {
					float mirrorFactor = 1.2 - factor;
					return mix(factor, mirrorFactor, bloomRadius);
				}

				void main() {
					gl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) +
						lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) +
						lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) +
						lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) +
						lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );
				}`})}}ve.BlurDirectionX=new wt(1,0);ve.BlurDirectionY=new wt(0,1);const Ee={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#elif defined( CUSTOM_TONE_MAPPING )

				gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};class fi extends ee{constructor(){super(),this.uniforms=ge.clone(Ee.uniforms),this.material=new jn({name:Ee.name,uniforms:this.uniforms,vertexShader:Ee.vertexShader,fragmentShader:Ee.fragmentShader}),this._fsQuad=new co(this.material),this._outputColorSpace=null,this._toneMapping=null}render(t,o,a){this.uniforms.tDiffuse.value=a.texture,this.uniforms.toneMappingExposure.value=t.toneMappingExposure,(this._outputColorSpace!==t.outputColorSpace||this._toneMapping!==t.toneMapping)&&(this._outputColorSpace=t.outputColorSpace,this._toneMapping=t.toneMapping,this.material.defines={},Kn.getTransfer(this._outputColorSpace)===qn&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===Zn?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===Xn?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===Yn?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===Qn?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===Jn?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===ts?this.material.defines.NEUTRAL_TONE_MAPPING="":this._toneMapping===es&&(this.material.defines.CUSTOM_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(o),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this._fsQuad.render(t))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}const no={uniforms:{tDepth:{value:null},tColor:{value:null},cameraNear:{value:.1},cameraFar:{value:3e4},projInv:{value:new Ia},texStep:{value:new wt(1/1024,1/1024)},depthEdge:{value:j.outline.depthEdge},normalEdge:{value:j.outline.normalEdge},fadeNear:{value:j.outline.fadeNear},fadeFar:{value:j.outline.fadeFar}},vertexShader:"varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",fragmentShader:`#include <packing>
 uniform sampler2D tDepth,tColor;uniform float cameraNear,cameraFar,depthEdge,normalEdge,fadeNear,fadeFar;uniform mat4 projInv;uniform vec2 texStep;varying vec2 vUv;
 vec3 viewPos(vec2 uv){float d=texture2D(tDepth,uv).x;vec4 p=projInv*vec4(uv*2.-1.,d*2.-1.,1.);return p.xyz/p.w;}
 void main(){
  float dc=texture2D(tDepth,vUv).x;
  if(dc>=.99999){gl_FragColor=vec4(0.);return;}
  vec3 c=viewPos(vUv),r=viewPos(vUv+vec2(texStep.x,0.)),l=viewPos(vUv-vec2(texStep.x,0.)),u=viewPos(vUv+vec2(0.,texStep.y)),d=viewPos(vUv-vec2(0.,texStep.y));
  float z=max(-c.z,1e-3);
  // ① 실루엣: 이웃과의 최대 깊이 차를 거리로 나눠 원근에 무관하게.
  float jump=max(max(abs(r.z-c.z),abs(l.z-c.z)),max(abs(u.z-c.z),abs(d.z-c.z)))/z;
  float silhouette=smoothstep(depthEdge,depthEdge*2.5,jump);
  // ② 접힌 모서리: 마주 보는 사분면 법선 각도 차.
  vec3 n1=normalize(cross(r-c,u-c)),n2=normalize(cross(u-c,l-c)),n3=normalize(cross(l-c,d-c)),n4=normalize(cross(d-c,r-c));
  float bend=1.-min(dot(n1,n3),dot(n2,n4));
  float crease=smoothstep(normalEdge,normalEdge+.3,bend)*(1.-smoothstep(.05,.2,jump));
  float edge=max(silhouette,crease*.75);
  // 외곽선 제외 표시(알파 < .75: 풀잎·물). 자신이나 이웃이 표시돼 있으면 선을 긋지 않는다(풀밭이 검은 잡음으로 덮이지 않게).
  float keep=min(texture2D(tColor,vUv).a,min(min(texture2D(tColor,vUv+vec2(texStep.x,0.)).a,texture2D(tColor,vUv-vec2(texStep.x,0.)).a),min(texture2D(tColor,vUv+vec2(0.,texStep.y)).a,texture2D(tColor,vUv-vec2(0.,texStep.y)).a)));
  edge*=step(.75,keep);
  // 원경으로 갈수록 0(산 능선이 검은 선으로 뒤덮이지 않게).
  edge*=1.-smoothstep(fadeNear,fadeFar,z);
  gl_FragColor=vec4(edge,0.,0.,1.);
 }`},ha={uniforms:{tDiffuse:{value:null},tEdge:{value:null},outlineColor:{value:new nt},outlineStrength:{value:1}},vertexShader:no.vertexShader,fragmentShader:`uniform sampler2D tDiffuse,tEdge;uniform vec3 outlineColor;uniform float outlineStrength;varying vec2 vUv;
 void main(){vec4 c=texture2D(tDiffuse,vUv);float e=texture2D(tEdge,vUv).r*outlineStrength;gl_FragColor=vec4(mix(c.rgb,outlineColor,clamp(e,0.,1.)),1.);}`};class ui extends ee{constructor(t){super(),this.camera=t,this.scale=1,this.width=1,this.size=new wt(1,1),this.edgeTarget=new ce(1,1,{type:fe,depthBuffer:!1}),this.edgeTarget.texture.name="toon-outline-edges",this.edgeMaterial=new St({...no,uniforms:ge.clone(no.uniforms),depthTest:!1,depthWrite:!1}),this.compositeMaterial=new St({...ha,uniforms:ge.clone(ha.uniforms),depthTest:!1,depthWrite:!1}),this.compositeMaterial.uniforms.tEdge.value=this.edgeTarget.texture,this.quad=new co(this.edgeMaterial)}setScale(t,o){this.scale=t,this.width=o,this.setSize(this.size.x,this.size.y)}setSize(t,o){this.size.set(t,o),this.edgeTarget.setSize(Math.max(1,Math.round(t*this.scale)),Math.max(1,Math.round(o*this.scale))),this.edgeMaterial.uniforms.texStep.value.set(this.width/Math.max(1,t),this.width/Math.max(1,o))}render(t,o,a){const i=this.edgeMaterial.uniforms;i.tDepth.value=a.depthTexture,i.tColor.value=a.texture,i.cameraNear.value=this.camera.near,i.cameraFar.value=this.camera.far,i.projInv.value.copy(this.camera.projectionMatrixInverse),this.quad.material=this.edgeMaterial,t.setRenderTarget(this.edgeTarget),this.quad.render(t),this.compositeMaterial.uniforms.tDiffuse.value=a.texture,this.quad.material=this.compositeMaterial,t.setRenderTarget(this.renderToScreen?null:o),this.quad.render(t)}dispose(){this.edgeTarget.dispose(),this.edgeMaterial.dispose(),this.compositeMaterial.dispose(),this.quad.dispose()}}const di={name:"ToonGrade",uniforms:{tDiffuse:{value:null},saturation:{value:1},contrast:{value:1},lift:{value:0},shadowGain:{value:0},highlight:{value:new nt(1,1,1)},highlightAmount:{value:0},shadow:{value:new nt(1,1,1)},shadowAmount:{value:0}},vertexShader:no.vertexShader,fragmentShader:`uniform sampler2D tDiffuse;uniform float saturation,contrast,lift,shadowGain,highlightAmount,shadowAmount;uniform vec3 highlight,shadow;varying vec2 vUv;
 float luma(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
 // 색상만 남긴 단위 밝기 색. 짙은 남색처럼 밝기가 낮은 색도 채널이 튀지 않게 2배로 묶고 다시 밝기 1로 맞춘다.
 vec3 hue(vec3 c){vec3 h=min(c/max(luma(c),1e-3),vec3(2.));return h/max(luma(h),1e-3);}
 void main(){
  vec4 t=texture2D(tDiffuse,vUv);vec3 c=t.rgb;float l=luma(c);
  c=mix(vec3(l),c,saturation);
  // 그늘 바닥 올림: 아주 어두운 면일수록 크게(최대 1+shadowGain배), 중간톤부터는 그대로.
  c*=1.+shadowGain*(1.-smoothstep(.01,.16,l));
  c=max(vec3(0.),.18+(c-.18)*contrast);
  float hi=smoothstep(.2,1.,l),sh=1.-smoothstep(.015,.22,l);
  c*=mix(vec3(1.),hue(highlight),highlightAmount*(.35+.65*hi));
  c=mix(c,max(l,.002)*hue(shadow),sh*shadowAmount);
  c+=lift*hue(highlight)*(1.-hi);
  gl_FragColor=vec4(c,t.a);
 }`};function mi(e,t=6){const o=e.materialHighPassFilter,a="vec4 texel = texture2D( tDiffuse, vUv );";return o?.fragmentShader?.includes(a)?(o.fragmentShader=o.fragmentShader.replace(a,`${a}
if(any(isnan(texel))||any(isinf(texel)))texel=vec4(0.);
texel.rgb*=min(1.,${t.toFixed(2)}/max(luminance(texel.rgb),1e-4));`),o.needsUpdate=!0,!0):!1}function hi({renderer:e,scene:t,camera:o,mobile:a=!1}){const i=e.getDrawingBufferSize(new wt),s=new ce(Math.max(1,i.x),Math.max(1,i.y),{type:fe});s.depthTexture=new os(Math.max(1,i.x),Math.max(1,i.y)),s.depthTexture.type=as;const n=new ri(e,s),r=new li(t,o),l=new ui(o),c=new ve(new wt(i.x,i.y),j.bloom.day.strength,j.bloom.day.radius,j.bloom.day.threshold);mi(c);let u=1;const f=c.setSize.bind(c);c.setSize=(M,k)=>f(Math.max(1,Math.round(M*u)),Math.max(1,Math.round(k*u)));const h=new Xa(di),m=new fi;for(const M of[r,l,c,h,m])n.addPass(M);const d={quality:null,mobile:a,half:!1,outline:{enabled:!0,scale:1,width:1,color:j.outline.day},bloom:{...j.bloom.day,scale:1},grade:null,phase:null,passes:["RenderPass","ToonOutline","UnrealBloom","ToonGrade","Output"]},g=M=>"#"+M.getHexString();function p(M=1,k=innerWidth,D=innerHeight,B=1){const A=a||M===0;u=A?.5:1,l.setScale(A?.5:1,hs(M)),n.setPixelRatio(B),n.setSize(k,D),Object.assign(d,{quality:M,half:A}),Object.assign(d.outline,{scale:l.scale,width:l.width}),d.bloom.scale=u}function y(M={}){const k=Rt(M),D=us(M),B=ds(M),A=ms(M);c.threshold=D.threshold,c.strength=D.strength,c.radius=D.radius;const S=h.uniforms;return S.saturation.value=B.saturation,S.contrast.value=B.contrast,S.lift.value=B.lift,S.shadowGain.value=B.shadowGain,S.highlight.value.setRGB(...B.highlight,ht),S.highlightAmount.value=B.highlightAmount,S.shadow.value.setRGB(...B.shadow,ht),S.shadowAmount.value=B.shadowAmount,l.compositeMaterial.uniforms.outlineColor.value.setRGB(...A.color,ht),l.compositeMaterial.uniforms.outlineStrength.value=A.strength,l.enabled=A.strength>.01,d.outline.enabled=l.enabled,d.outline.strength=A.strength,Object.assign(d.bloom,D),d.outline.color=g(l.compositeMaterial.uniforms.outlineColor.value),d.grade=B,d.phase=k,d}function v(M){n.render(M)}function w(){l.dispose(),c.dispose(),h.material.dispose(),m.dispose?.(),n.dispose(),s.depthTexture?.dispose()}return{composer:n,passes:{renderPass:r,outline:l,bloom:c,grade:h,output:m},resize:p,update:y,render:v,dispose:w,status:d}}const yt=e=>new nt().setRGB(...lt(e),ht);function Ot(e){let t=e>>>0;return()=>(t=Math.imul(t,1664525)+1013904223>>>0)/4294967296}const se=(e,t,o)=>{const a=Math.max(0,Math.min(1,(o-e)/(t-e)));return a*a*(3-2*a)},Pt={trunk:0,leaf:1,twig:2,needle:3,bush:4,farCrown:6};class Pe{constructor(){this.p=[],this.n=[],this.c=[],this.s=[],this.extra=[],this.parts=[],this.part=0}vertex(t,o,a,i=0,s=0){this.p.push(t.x,t.y,t.z),this.n.push(o.x,o.y,o.z),this.c.push(a.r,a.g,a.b),this.s.push(i),this.extra.push(s),this.parts.push(this.part)}geometry(t,{extra:o=null}={}){const a=new xt;return a.setAttribute("position",new at(this.p,3)),a.setAttribute("normal",new at(this.n,3)),a.setAttribute("color",new at(this.c,3)),a.setAttribute("toonSway",new at(this.s,1)),o&&a.setAttribute(o,new at(this.extra,1)),a.setAttribute("toonPart",new at(this.parts,1)),a.computeBoundingBox(),a.computeBoundingSphere(),a.name=t,a.userData.shared=!0,a.userData.toonNature=!0,a}get triangles(){return this.p.length/9}}function Ko(e,{center:t,radius:o,detail:a,seed:i,crown:s,leaf:n,shade:r,swayOf:l,jag:c=.17,bend:u=.55,variation:f=0,tufts:h=0}){const m=new Ne(1,a),d=m.attributes.position,g=Ot(i),p=[0,1,2,3].map(()=>new P(g()*2-1,g()*2-1,g()*2-1).normalize()),y=p.map(()=>g()*6.283),v=new P,w=new P,M=new P,k=new P,D=new nt,B=1+f*(g()*2-1);for(let b=0;b<d.count;b++){v.fromBufferAttribute(d,b).normalize();const F=Math.sin(v.dot(p[0])*5.3+y[0])*Math.sin(v.dot(p[1])*4.7+y[1])*.5+Math.sin(v.dot(p[2])*8.1+y[2])*.3+Math.sin(v.dot(p[3])*13.7+y[3])*.2,z=1+c*F;w.set(t.x+v.x*o.x*z,t.y+v.y*o.y*z,t.z+v.z*o.z*z),M.set(v.x/o.x,v.y/o.y,v.z/o.z).normalize(),k.copy(w).sub(s).normalize(),M.lerp(k,u).normalize();const C=(.8+.2*se(-.75,.85,k.y))*(.9+.1*se(-.4,.6,v.dot(k)))*B,_=se(-.35,.35,F);D.copy(r).lerp(n,se(-.55,.7,k.y)*(.7+.3*_)).multiplyScalar(C*(.9+.14*_)),e.vertex(w,M,D,l(w.y))}m.dispose();const A=new P,S=new P,T=[new P,new P,new P,new P];for(let b=0;b<h;b++){const F=1-2*(b+.5)/h,z=Math.sqrt(1-F*F),C=b*2.39996+g()*.6;if(v.set(Math.cos(C)*z,F,Math.sin(C)*z).normalize(),v.y<-.5&&g()<.75)continue;const _=Math.sin(v.dot(p[0])*5.3+y[0])*Math.sin(v.dot(p[1])*4.7+y[1])*.5+Math.sin(v.dot(p[2])*8.1+y[2])*.3+Math.sin(v.dot(p[3])*13.7+y[3])*.2,W=(1+c*_)*(.96+g()*.06),H=Math.min(o.x,o.y)*(.2+g()*.1);w.set(t.x+v.x*o.x*W,t.y+v.y*o.y*W,t.z+v.z*o.z*W),A.set(-v.z,0,v.x),A.lengthSq()<1e-4&&A.set(1,0,0),A.normalize().applyAxisAngle(v,g()*6.283),S.crossVectors(v,A);const R=.6+g()*.45,O=S.clone().multiplyScalar(Math.cos(R)).addScaledVector(v,Math.sin(R));T[0].copy(w).addScaledVector(O,-H*.35),T[2].copy(w).addScaledVector(O,H*.95),T[1].copy(w).addScaledVector(O,H*.25).addScaledVector(A,H*.36),T[3].copy(w).addScaledVector(O,H*.25).addScaledVector(A,-H*.36),k.copy(T[2]).sub(s).normalize(),M.copy(v).lerp(k,u).normalize();const I=(.78+.26*se(-.75,.85,k.y))*B*(.96+g()*.12);D.copy(r).lerp(n,se(-.55,.7,k.y)).multiplyScalar(I);const U=new P().subVectors(T[1],T[0]).cross(new P().subVectors(T[2],T[0])).dot(v)>0?[0,1,2,0,2,3]:[0,2,1,0,3,2];for(const X of U)e.vertex(T[X],M,D,l(T[X].y))}}function me(e,{a:t,b:o,ra:a,rb:i,sides:s,rings:n=2,color:r,swayOf:l,flare:c=1,bow:u=null,seed:f=1,dark:h=.78}){const m=new P().subVectors(o,t),d=m.length();m.normalize();const g=Math.abs(m.y)>.95?new P(1,0,0):new P(0,1,0),p=new P().crossVectors(m,g).normalize(),y=new P().crossVectors(m,p).normalize(),v=D=>{const B=t.clone().addScaledVector(m,d*D);u&&B.addScaledVector(u,Math.sin(D*Math.PI));const A=Nt.lerp(a,i,D)*(1+(c-1)*Math.pow(1-D,6));return{c:B,rr:A}},w=[];for(let D=0;D<=n;D++)w.push(v(D/n));const M=(D,B)=>{const A=B/s*Math.PI*2,S=p.clone().multiplyScalar(Math.cos(A)).addScaledVector(y,Math.sin(A));return{p:D.c.clone().addScaledVector(S,D.rr),n:S}},k=new nt;for(let D=0;D<n;D++)for(let B=0;B<s;B++){const A=[M(w[D],B),M(w[D],B+1),M(w[D+1],B+1),M(w[D+1],B)];for(const S of[0,1,2,0,2,3]){const T=(D+(S===2||S===3?1:0))/n;k.copy(r).multiplyScalar(Nt.lerp(h,1,Math.min(1,T*1.4+.2))),e.vertex(A[S].p,A[S].n,k,l(A[S].p.y))}}}function pi(e,{y:t,height:o,radius:a,segments:i,seed:s,needle:n,shade:r,swayOf:l,droop:c=.25,offset:u=new P,tufts:f=0}){const h=Ot(s),m=new P(u.x,t+o,u.z),d=new P(u.x,t+o*.18,u.z),g=[];for(let w=0;w<i;w++){const M=w/i*Math.PI*2+h()*.12,k=w%2?.74+h()*.12:1+h()*.08,D=a*k;g.push(new P(u.x+Math.cos(M)*D,t-c*o*(k>.9?1:.4),u.z+Math.sin(M)*D))}const p=new nt,y=new P,v=new P;new P;for(let w=0;w<i;w++){const M=g[w],k=g[(w+1)%i];for(const[D,B]of[[m,1],[k,0],[M,0]])y.set(D.x-u.x,0,D.z-u.z),y.lengthSq()<1e-6?y.set(0,1,0):y.normalize().multiplyScalar(.75),y.y=B?1:.55,y.normalize(),p.copy(n).multiplyScalar(B?1.08:.9),e.vertex(D,y,p,l(D.y));for(const D of[d,M,k])v.set(D.x-u.x,0,D.z-u.z),v.lengthSq()>1e-6&&v.normalize().multiplyScalar(.5),y.set(v.x,-1,v.z).normalize(),p.copy(r),e.vertex(D,y,p,l(D.y));for(let D=0;D<f;D++){const B=(D+.5)/f,A=M.clone().lerp(k,B),S=new P(A.x-u.x,0,A.z-u.z),T=S.length()||1;S.multiplyScalar(1/T);const b=new P(-S.z,0,S.x),F=a*(.16+h()*.1),z=A.clone().addScaledVector(b,F*.45).addScaledVector(S,-F*.3),C=A.clone().addScaledVector(b,-F*.45).addScaledVector(S,-F*.3),_=A.clone().addScaledVector(S,F*.9).add(new P(0,-F*(.25+h()*.3),0));y.set(S.x*.6,.8,S.z*.6).normalize(),p.copy(n).multiplyScalar(.86+h()*.1);for(const W of[z,C,_,C,z,_])e.vertex(W,y,p,l(W.y))}}}const pa={tree_small_02:{kind:"broadleaf",height:9.4,width:9,seed:11,lean:.15},island_tree_01:{kind:"broadleaf",height:10.4,width:10.4,seed:23,lean:.25},pine_tree_01:{kind:"pine",height:12.4,width:6.4,seed:31},pine_sapling_medium:{kind:"sapling",height:5,width:3.4,seed:47}},gi=[{lumps:7,detail:2,trunkSides:9,branches:4,rings:4,tufts:40,twigs:5,forks:2,twigSides:4},{lumps:5,detail:1,trunkSides:6,branches:3,rings:3,tufts:10,twigs:3,forks:1,twigSides:3},{lumps:2,detail:1,trunkSides:4,branches:0,rings:1,tufts:0,twigs:3,forks:1,twigSides:3}];function vi(e,t,o){const a=gi[t],i=new Pe,s=Ot(e.seed),n=e.height,r=e.width,l=p=>.42*Math.pow(Math.max(0,p)/n,2),c=n*.3,u=new P(e.lean*r*.08,0,0),f=new P(u.x,n*.66,0),h=new P(u.x,c,0);me(i,{a:new P(0,0,0),b:a.branches?h.clone().add(new P(0,n*.05,0)):new P(u.x,n*.6,0),ra:r*.06,rb:a.branches?r*.045:r*.035,sides:a.trunkSides,rings:a.rings,color:o.trunk,swayOf:l,flare:1.6,bow:new P(r*.025,0,r*.015)});const m=[{c:new P(f.x+r*.02,n*.84,-r*.02),r:r*.25}],d=Math.max(1,Math.ceil((a.lumps-1)*.6)),g=Math.max(0,a.lumps-1-d);for(let p=0;p<d;p++){const y=p/d*Math.PI*2+s()*.4+.3,v=r*(.24+s()*.04),w=n*(.7+s()*.05);m.push({c:new P(f.x+Math.cos(y)*v,w,f.z+Math.sin(y)*v),r:r*(.22+s()*.03)})}for(let p=0;p<g;p++){const y=p/g*Math.PI*2+s()*.5+1.1,v=r*(.27+s()*.03),w=n*(.55+s()*.04);m.push({c:new P(f.x+Math.cos(y)*v,w,f.z+Math.sin(y)*v),r:r*(.18+s()*.03)})}a.lumps===2&&(m.length=2,m[0].r=r*.36,m[0].c.set(f.x,n*.72,0),m[1].c.set(f.x+r*.15,n*.6,-r*.1),m[1].r=r*.3);for(let p=0;p<a.branches&&p<m.length-1;p++){const y=m[p+1].c.clone();y.y-=m[p+1].r*.35,me(i,{a:h.clone(),b:y,ra:r*.032,rb:r*.016,sides:Math.max(4,a.trunkSides-3),rings:2,color:o.trunk,swayOf:l,dark:.92,bow:new P(0,n*.03,0)})}return a.branches&&me(i,{a:h.clone(),b:m[0].c.clone().add(new P(0,-m[0].r*.5,0)),ra:r*.03,rb:r*.015,sides:Math.max(4,a.trunkSides-3),rings:1,color:o.trunk,swayOf:l,dark:.92}),a.twigs&&Ya(i,{lumps:m,fork:h,W:r,H:n,L:a,palette:o,swayOf:l,seed:e.seed*31}),i.part=t===2?Pt.farCrown:Pt.leaf,m.forEach((p,y)=>Ko(i,{center:p.c,radius:new P(p.r,p.r*.84,p.r),detail:a.detail,seed:e.seed*7+y,crown:f,leaf:o.leaf,shade:o.leafShade,swayOf:l,jag:t===2?.06:.09,bend:.6,variation:.06,tufts:a.tufts})),i.part=Pt.trunk,i}function Ya(e,{lumps:t,fork:o,W:a,H:i,L:s,palette:n,swayOf:r,seed:l}){const c=Ot(l),u=new P,f=e.part;e.part=Pt.twig;const h=(m,d,g,p,y)=>me(e,{a:m,b:d,ra:g,rb:p,sides:y,rings:1,color:n.trunk,swayOf:r,dark:.95});t.forEach((m,d)=>{const g=m.c.clone();g.y-=m.r*(d===0?.5:.35),(d>s.branches||!s.branches)&&h(o.clone(),g,a*.026,a*.013,4);for(let p=0;p<s.twigs;p++){const y=p/s.twigs*Math.PI*2+c()*.8,v=.35+c()*.55;u.set(Math.cos(y)*(1-v*.6),v,Math.sin(y)*(1-v*.6)).normalize();const w=m.r*(.95+c()*.3),M=g.clone().addScaledVector(u,w);h(g,M,a*.012,a*.004,s.twigSides);for(let k=0;k<s.forks;k++){const D=g.clone().addScaledVector(u,w*(.45+k*.2)),B=new P(-u.z,0,u.x).normalize().multiplyScalar(k%2?-1:1),A=u.clone().multiplyScalar(.7).addScaledVector(B,.6+c()*.3);A.y+=.25,A.normalize(),h(D,D.clone().addScaledVector(A,w*(.38+c()*.15)),a*.006,a*.0025,3)}}}),e.part=f}const xi=[{tiers:8,segments:14,trunkSides:7,rings:3,tufts:3},{tiers:6,segments:9,trunkSides:5,rings:2,tufts:2},{tiers:4,segments:7,trunkSides:3,rings:1,tufts:1}];function yi(e,t,o,{sapling:a=!1}={}){const i=xi[t],s=new Pe,n=Ot(e.seed),r=e.height,l=e.width,c=m=>(a?.12:.3)*Math.pow(Math.max(0,m)/r,2),u=new P(0,r*.97,0);me(s,{a:new P(0,0,0),b:u,ra:l*.06,rb:l*.015,sides:i.trunkSides,rings:i.rings,color:o.pineTrunk,swayOf:c,flare:1.35});const f=Math.max(3,i.tiers-(a?2:0)),h=r*(a?.2:.16);for(let m=0;m<f;m++){const d=m/(f-1),g=Nt.lerp(h,r*.86,Math.pow(d,.9)),p=l*Nt.lerp(.5,.1,d)*(.92+n()*.16),y=new P((n()-.5)*l*.04,0,(n()-.5)*l*.04);s.part=Pt.needle,pi(s,{y:g,height:r*Nt.lerp(a?.22:.15,a?.16:.12,d),radius:p,segments:i.segments,seed:e.seed*13+m,needle:o.pine,shade:o.pineShade,swayOf:c,offset:y,droop:.5,tufts:i.tufts}),s.part=Pt.trunk}return s}const wi=[{detail:2,tufts:10,trunkSides:5,branches:0,twigs:4,forks:1,twigSides:3},{detail:1,tufts:3,trunkSides:4,branches:0,twigs:3,forks:0,twigSides:3},{detail:1,tufts:0,trunkSides:3,branches:0,twigs:3,forks:1,twigSides:3}];function bi(e,t,o){const a=wi[t],i=new Pe,s=Ot(e.seed),n=e.height,r=e.width,l=f=>.14*Math.pow(Math.max(0,f)/n,2),c=new P(0,n*.42,0);me(i,{a:new P(0,0,0),b:new P(0,n*.3,0),ra:r*.05,rb:r*.035,sides:a.trunkSides,rings:1,color:o.trunk,swayOf:l,flare:1.4});const u=[];for(let f=0;f<3;f++){const h=f/3*Math.PI*2+s()*.5;u.push([Math.cos(h)*r*.2,n*(.3+s()*.04),Math.sin(h)*r*.2,r*(.3+s()*.04)])}return u.push([r*.04,n*.52,-r*.03,r*.34],[-r*.05,n*.7,r*.02,r*.26]),t===2&&u.splice(0,u.length,[0,n*.36,0,r*.42],[r*.03,n*.66,-r*.02,r*.3]),Ya(i,{lumps:u.map(([f,h,m,d])=>({c:new P(f,h,m),r:d*.8})),fork:new P(0,n*.28,0),W:r,H:n,L:a,palette:o,swayOf:l,seed:e.seed*29}),i.part=t===2?Pt.farCrown:Pt.leaf,u.forEach(([f,h,m,d],g)=>Ko(i,{center:new P(f,h,m),radius:new P(d,d*.9,d),detail:a.detail,seed:e.seed*5+g,crown:c,leaf:o.bush,shade:o.bushShade,swayOf:l,jag:.08,bend:.6,variation:.06,tufts:a.tufts})),i.part=Pt.trunk,i}function Si(e){const t=new Pe;t.part=Pt.bush;const o=new P(0,.4,0),a=i=>.06*Math.pow(Math.max(0,i)/1.1,2);return[[0,.6,0,.4],[.36,.42,.14,.32],[-.3,.4,-.22,.33]].forEach(([i,s,n,r],l)=>Ko(t,{center:new P(i,s,n),radius:new P(r*1.12,r*.86,r*1.12),detail:2,seed:500+l,crown:o,leaf:e.bush,shade:e.bushShade,swayOf:a,jag:.08,bend:.6,variation:.06,tufts:8})),t}function ie({blades:e=9,height:t=.42,spread:o=.2,flowers:a=1,seed:i=3}={},s){const n=new Pe,r=Ot(i),l=new nt,c=new P(0,1,0);for(let u=0;u<e;u++){const f=u*2.399+r()*.4,h=o*(.15+r()*.85),m=Math.cos(f)*h,d=Math.sin(f)*h,g=t*(.6+r()*.55),p=.016+r()*.012,y=.12+r()*.18,v=.25+r()*.3,w=f+Math.PI/2+(r()-.5)*.6,M=Math.cos(w),k=Math.sin(w),D=Math.cos(f),B=Math.sin(f),A=U=>{const X=g*(y*U+v*U*U*U);return new P(m+D*X,g*U*(1-v*.35*U*U),d+B*X)},S=A(.4),T=A(.75),b=A(1),F=(U,X)=>[U.clone().add(new P(-M*p*X,0,-k*p*X)),U.clone().add(new P(M*p*X,0,k*p*X))],[z,C]=F(new P(m,0,d),1),[_,W]=F(S,1.05),[H,R]=F(T,.75),O=new P(D*.3,1,B*.3).normalize(),I=U=>l.copy(s.grassBase).lerp(s.grassTip,U).clone(),K=U=>.16*Math.pow(Math.max(0,U)/t,2);for(const[U,X]of[[z,0],[C,0],[W,.4],[z,0],[W,.4],[_,.4],[_,.4],[W,.4],[R,.75],[_,.4],[R,.75],[H,.75],[H,.75],[R,.75],[b,1]])n.vertex(U,O,I(X),K(U.y),0)}for(let u=0;u<a;u++){const f=r()*6.283,h=o*.5*r(),m=Math.cos(f)*h,d=Math.sin(f)*h,g=t*(.62+r()*.25),p=.05,y=new P(m,g,d),v=s.grassBase.clone().lerp(s.grassTip,.5);for(const w of[new P(m-.008,0,d),new P(m+.008,0,d),y])n.vertex(w,c,v,.14*Math.pow(w.y/t,2),0);for(const w of[0,Math.PI/4]){const M=[0,1,2,3].map(k=>{const D=w+k*Math.PI/2;return new P(m+Math.cos(D)*p,g+(k%2?.03:-.03),d+Math.sin(D)*p)});for(const[k,D,B]of[[0,1,2],[0,2,3]])for(const A of[M[k],M[D],M[B]])n.vertex(A,c,new nt(1,1,1),.14*Math.pow(g/t,2),1)}}return n}const Qa={rock_09:{size:[.08,.034,.14],seed:91,lumps:[[0,.42,0,.5,.55,.5,.15,0]]},boulder_01:{size:[1.28,1,1.83],seed:17,lumps:[[0,.45,0,.5,.55,.5,.18,-.08]]},rock_face_01:{size:[4.96,3.56,3.82],seed:53,cliff:!0,lumps:[[-.18,.36,0,.34,.4,.46,.12,0],[.2,.42,.04,.3,.46,.42,-.18,.06],[-.02,.72,-.04,.28,.27,.36,.28,0]]},rock_face_02:{size:[2.72,2.47,2.12],seed:67,cliff:!0,lumps:[[-.12,.4,0,.38,.42,.48,.1,0],[.18,.6,.02,.3,.38,.4,-.25,.05]]},mountainside:{size:[10.2,10.5,5.24],seed:79,cliff:!0,lumps:[[0,.26,0,.5,.34,.5,.05,0],[-.1,.58,.02,.42,.3,.46,.35,.05],[.16,.78,-.02,.34,.24,.42,-.45,0]]}};function Ja({center:e,radius:t,rotation:o=new Vo,seed:a=1,floor:i=-1/0,cuts:s=5,flatTop:n=!0}){const r=Ot(a),l=Ha(new Ne(1,1).deleteAttribute("uv").deleteAttribute("normal")),c=l.attributes.position,u=[0,1].map(()=>({d:new P(r()-.5,r()-.5,r()-.5).normalize(),f:1.2+r(),ph:r()*6.283,a:.06+r()*.04})),f={d:new P((r()-.5)*.5,1,(r()-.5)*.5).normalize(),at:.72+r()*.1},h=n?[f]:[];for(let d=1;d<s;d++){const g=d/(s-1)*Math.PI*2+r()*.9,p=(r()-.35)*.9;h.push({d:new P(Math.cos(g),p,Math.sin(g)).normalize(),at:.78+r()*.14})}const m=new P;for(let d=0;d<c.count;d++){m.fromBufferAttribute(c,d);let g=1;for(const p of u)g+=p.a*Math.sin(m.dot(p.d)*p.f*3.1416+p.ph);m.multiplyScalar(g);for(const p of h){const y=m.dot(p.d)-p.at;y>0&&m.addScaledVector(p.d,-y*.7)}m.set(m.x,m.y*(m.y>0?.95:1.1),m.z).multiply(t).applyEuler(o).add(e),m.y=Math.max(m.y,i+d*1e-5),c.setXYZ(d,m.x,m.y,m.z)}return l.computeVertexNormals(),l}function Mi(e){const t=Qa[e];if(!t)return null;const[o,a,i]=t.size,s=Ot(t.seed),n=[];t.lumps.forEach(([l,c,u,f,h,m,d,g],p)=>n.push(Ja({center:new P(l*o,c*a,u*i),radius:new P(f*o,h*a,m*i),rotation:new Vo(g,s()*.6-.3,d),seed:t.seed*11+p,floor:-a*.06})));const r=n.length>1?ye(n):n[0];return n.length>1&&n.forEach(l=>l.dispose()),r.computeBoundingBox(),r.computeBoundingSphere(),r.name=`toon-rock-${e}`,r.userData.shared=!0,r.userData.toonNature=!0,r.userData.cliff=!!t.cliff,r}const ga=`
attribute float toonSway;
uniform float foliageTime;uniform float toonWaveStrength;uniform vec2 toonWindDir;
vec3 tnAnchor(){
 vec3 a=(modelMatrix*vec4(0.,0.,0.,1.)).xyz;
 #ifdef USE_INSTANCING
 a+=mat3(modelMatrix)*instanceMatrix[3].xyz;
 #endif
 return a;
}
float tnHash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
`,va=`
#if defined(USE_COLOR)||defined(USE_INSTANCING_COLOR)
vColor=vec3(1.);
#endif
#ifdef USE_COLOR
vColor*=color.rgb;
#endif
#if defined(USE_COLOR)||defined(USE_INSTANCING_COLOR)
{vec2 a=tnAnchor().xz;float h=tnHash(a),g=tnHash(a+17.3);vColor*=mix(vec3(.88,.93,.84),vec3(1.08,1.06,.96),h)*mix(vec3(1.06,1.02,.9),vec3(.94,1.,1.06),g);}
#endif`,ki=e=>`
{
 vec3 a=tnAnchor();float th=tnHash(a.xz+41.7);int part=int(toonPart+.5);vec3 c=vColor;
 if(part==1||part==6){float t=clamp((tsLuma(c)-${e.leafShade})/${e.leafSpan},0.,1.3);c=tsLeafColor(c,t,th,a.y);
  if(part==6)c=mix(c,tsPair(t,TS_TWIG,TS_TWIG_SHADE)*.8,tsW.w);}
 else if(part==4){float t=clamp((tsLuma(c)-${e.bushShade})/${e.bushSpan},0.,1.3);c=tsBushColor(c,t,th);c=mix(c,tsPair(t,TS_TWIG*.85,TS_TWIG_SHADE*.75),tsW.w);}
 else if(part==3){float t=clamp((tsLuma(c)-${e.pineShade})/${e.pineSpan},0.,1.3);c=mix(c,tsPair(t,TS_PINE,TS_PINE_SHADE),tsW.z*.6+tsW.w);}
 else c=mix(c,TS_BARK*clamp(tsLuma(c)/${e.trunk},.6,1.2),tsW.w*.85);
 vColor=c;vTsPart=float(part);
}`,zi=`
{
 int part=int(toonPart+.5);float winter=step(.5,tsW.w);
 // 먼 단계 수관(6)은 겨울에 가까우면 접고(잔가지만), 멀면(160~200m~) 조금 작은 회갈색 잔가지 안개로 남긴다.
 vec3 tsA=tnAnchor();float far=step(160.+40.*tnHash(tsA.xz+5.3),distance(cameraPosition.xz,tsA.xz));
 if(part==6&&winter>.5)transformed=mix(vec3(0.,transformed.y*.92,0.),transformed,.82);
 if((part==1||part==6&&far<.5)&&winter>.5||part==2&&winter<.5)transformed=vec3(0.,-60.,0.);
 vec3 tsN=objectNormal;
 #ifdef USE_INSTANCING
 tsN=mat3(instanceMatrix)*tsN;
 #endif
 vTsUp=normalize(mat3(modelMatrix)*tsN).y;
}`,Ti=`
if(tsW.w>.01){
 float p=vTsPart,snow=p<2.5?tsSnowCover(vTnLeaf*3.,vTsUp,.3,.55):p<3.5?tsSnowCover(vTnLeaf*1.7,vTsUp,.5,.78):p<4.5?tsSnowCover(vTnLeaf*1.3,vTsUp,-.45,.05):.3*tsSnowCover(vTnLeaf*.8,vTsUp,.45,.85);
 diffuseColor.rgb=mix(diffuseColor.rgb,TS_SNOW,snow);
}`,xa=`
{
 // 수관 전체가 한 몸으로 기울었다 돌아오고(돌풍), 잎 덩어리는 조금 빠르게 떤다. 밑동(toonSway=0)은 고정.
 vec3 a=tnAnchor();
 // 개체 변이: 가지·수관(흔들림이 있는 부분)만 옆으로 0.82~1.18배, 위로 0.9~1.1배(밑동은 그대로 접지).
 {float h1=tnHash(a.xz+3.7),h2=tnHash(a.xz+9.1),k=smoothstep(0.,.03,toonSway);transformed.xz*=mix(1.,.82+.36*h1,k);transformed.y*=mix(1.,.9+.2*h2,k);}
 float gust=sin(foliageTime*1.25+a.x*.071+a.z*.053)*.65+sin(foliageTime*2.07+a.z*.113+a.x*.031)*.35;
 float flutter=sin(foliageTime*4.1+dot(position,vec3(1.7,2.3,1.9)));
 transformed.xz+=toonWindDir*(gust*.75+.3)*toonSway*toonWaveStrength+vec2(-toonWindDir.y,toonWindDir.x)*flutter*toonSway*.14;
 transformed.y-=abs(gust)*toonSway*.08;
}`,_i=`
float tnH3(vec3 p){p=fract(p*.1031);p+=dot(p,p.zyx+31.32);return fract((p.x+p.y)*p.z);}
float tnN3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(tnH3(i),tnH3(i+vec3(1,0,0)),f.x),mix(tnH3(i+vec3(0,1,0)),tnH3(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(tnH3(i+vec3(0,0,1)),tnH3(i+vec3(1,0,1)),f.x),mix(tnH3(i+vec3(0,1,1)),tnH3(i+vec3(1,1,1)),f.x),f.y),f.z);}
// 잎 무늬 값(0~1): 큰 잎 뭉치 + 작은 잎 두 겹의 값 잡음. 크면 밝은 잎 뭉치, 작으면 잎 사이 짙은 틈.
float tnLeaf(vec3 p){return tnN3(p*vec3(1.,1.3,1.))*.6+tnN3(p*2.3+vec3(4.1,1.7,8.3))*.4;}`,ya=`
#if NUM_DIR_LIGHTS > 0
{
 vec3 tnL=directionalLights[0].direction,tnV=normalize(vViewPosition);
 float tnBack=pow(clamp(dot(-tnV,tnL),0.,1.),2.);
 float tnEdge=pow(1.-clamp(dot(normal,tnV),0.,1.),2.5);
 reflectedLight.directDiffuse+=diffuseColor.rgb*vec3(1.3,1.12,.55)*directionalLights[0].color*tnBack*tnEdge*RIM;
}
#endif`;function Ci({gradientMap:e,uniforms:t}){const o=j.nature,a={leaf:yt(o.leaf),leafShade:yt(o.leafShade),trunk:yt(o.trunk),pine:yt(o.pine),pineShade:yt(o.pineShade),pineTrunk:yt(o.pineTrunk),sapling:yt(o.sapling),saplingShade:yt(o.saplingShade),bush:yt(o.bush),bushShade:yt(o.bushShade),grassBase:yt(o.grassBase),grassTip:yt(o.grassTip)},i={parts:0,triangles:{},grassSwaps:0,shrubSwaps:0,rocks:0},s=b=>b.r*.2126+b.g*.7152+b.b*.0722,n=b=>b.toFixed(4),r={leafShade:n(s(a.leafShade)),leafSpan:n(s(a.leaf)-s(a.leafShade)),bushShade:n(s(a.bushShade)),bushSpan:n(s(a.bush)-s(a.bushShade)),pineShade:n(s(a.pineShade)),pineSpan:n(s(a.pine)-s(a.pineShade)),trunk:n(s(a.trunk))},l=b=>{b.uniforms.foliageTime=te.foliageTime,b.uniforms.toonWaveStrength=t.toonWaveStrength,b.uniforms.toonWindDir=t.toonWindDir},c=new Ue({name:"toon-nature-foliage",gradientMap:e,vertexColors:!0});c.onBeforeCompile=b=>{l(b),de(b),b.vertexShader=b.vertexShader.replace("#include <common>",`#include <common>
`+ga+qt+"attribute float toonPart;varying vec3 vTnLeaf;varying float vTsPart;varying float vTsUp;").replace("#include <color_vertex>",va+ki(r)).replace("#include <begin_vertex>",`#include <begin_vertex>
vTnLeaf=position+tnAnchor()*.37;
`+xa+zi),b.fragmentShader=b.fragmentShader.replace("#include <common>",`#include <common>
varying vec3 vTnLeaf;varying float vTsPart;varying float vTsUp;
`+qt+_i).replace("#include <color_fragment>",`#include <color_fragment>
    {
     // 잎 무늬(카툰 2차, 참고 01_08·01_19·01_22): 덩어리 표면에 밝은 잎 뭉치와 그 사이 짙은 틈. 한 덩어리가 단색 판으로 보이지 않게.
     // 잎 뭉치(${o.leafCell}m)가 픽셀보다 잘아지면 접는다.
     float px=length(vViewPosition)*.0014,fade=1.-smoothstep(.1,.4,px/${o.leafCell.toFixed(3)});
     // 잎 정점만(부위 1·3·4·6): 줄기·가지는 무늬 없이. 접힌 곳은 잡음을 계산하지 않는다(GPU 절약). 단풍색도 잎으로 본다.
     fade*=step(.5,abs(vTsPart-2.))*step(.5,vTsPart);
     if(fade>.01){float lf=tnLeaf(vTnLeaf/${o.leafCell.toFixed(3)});
     diffuseColor.rgb*=1.+fade*(${o.leafLight.toFixed(3)}*smoothstep(.58,.66,lf)-${o.leafGap.toFixed(3)}*(1.-smoothstep(.26,.34,lf)));}
    }
    ${Ti}`).replace("#include <lights_fragment_end>",`#include <lights_fragment_end>
`+ya.replace("RIM",o.rim.toFixed(3)))},c.customProgramCacheKey=()=>"toon-nature-foliage-v3-season",c.userData.shared=!0,c.userData.toonNature="foliage";const u=b=>`vec3(${b.r.toFixed(4)},${b.g.toFixed(4)},${b.b.toFixed(4)})`,f=Object.fromEntries(["spring","summer","autumn","winter"].map(b=>[b,ca[b]?ca[b].map(F=>u(qa(F))):[u(a.grassBase),u(a.grassTip)]])),h=(b=!1)=>{const F=new Ue({name:b?"toon-nature-grass-field":"toon-nature-grass",gradientMap:e,vertexColors:!0,side:zt}),z={tgFieldRadius:{value:30}};return b&&(F.userData.fieldUniforms=z),F.onBeforeCompile=C=>{l(C),de(C),b&&Object.assign(C.uniforms,z),Object.assign(C.uniforms,{tgFlowerA:{value:yt(o.flowerA)},tgFlowerB:{value:yt(o.flowerB)},tgBand:{value:yt(o.grassBand)}}),C.vertexShader=C.vertexShader.replace("#include <common>",`#include <common>
`+ga+qt+"attribute float toonFlower;uniform vec3 tgFlowerA,tgFlowerB;uniform float tgFieldRadius;varying float vTgBand;varying float vTgTip;").replace("#include <color_vertex>",va+`
    {
     vec3 a=tnAnchor();float h=tnHash(a.xz*1.37+3.1);
     // 짙은 다발 얼룩(그늘색 쪽)과 꽃 색(노랑·흰).
     float clump=sin(a.x*.21+sin(a.z*.17)*1.3)*sin(a.z*.19-a.x*.07);
     // 짙은 다발은 덩어리째(약 8~15m 얼룩) 모인다. 그늘색 #53794a 쪽.
     vColor*=mix(1.,${o.clumpDark.toFixed(3)},clamp(step(.8,h)*.5+smoothstep(.15,.55,clump),0.,1.))*(1.-toonFlower);
     vColor+=toonFlower*mix(tgFlowerA,tgFlowerB,step(.5,fract(h*7.3)));
    }
    {
     // 계절 풀색: 밑동→끝 색을 계절 짝으로 바꾸고, 짙은 다발 얼룩(여름 대비 명도 비)은 그대로 둔다. 봄 꽃은 분홍·흰색.
     float gt=clamp(position.y/.55,0.,1.);vec3 ref=mix(${f.summer[0]},${f.summer[1]},gt);
     float ratio=clamp(tsLuma(vColor)/max(tsLuma(ref),1e-3),.4,1.3);
     vec3 g=vColor*tsW.y+(mix(${f.spring[0]},${f.spring[1]},gt)*tsW.x+mix(${f.autumn[0]},${f.autumn[1]},gt)*tsW.z+mix(${f.winter[0]},${f.winter[1]},gt)*tsW.w)*ratio;
     float pink=step(.45,fract(tnHash(tnAnchor().xz*1.37+3.1)*5.1));
     vColor=mix(g,mix(vColor,mix(vec3(1.,.62,.78),vec3(1.,.93,.95),pink),tsW.x),toonFlower);
    }`).replace("#include <begin_vertex>",`#include <begin_vertex>
    ${b?`{
     // 카메라 둘레 풀밭의 바깥 테두리: 다발을 줄여 사라지게 한다(경계선이 보이지 않게).
     float fd=distance(tnAnchor().xz,cameraPosition.xz);transformed*=1.-smoothstep(tgFieldRadius*.6,tgFieldRadius*.97,fd);
    }`:""}
    ${xa}
    {
     // 꽃은 다발의 일부에만 핀다(나머지는 꽃 정점을 밑동으로 접는다).
     vec3 a=tnAnchor();
     // 봄에는 더 많이(30%), 가을·겨울에는 피지 않는다. 겨울 풀은 눈에 묻혀 키가 38%.
     if(toonFlower>.5&&tnHash(a.xz*2.11+.7)>${o.flowerShare.toFixed(3)}*tsW.y+.3*tsW.x)transformed=vec3(0.,-.05,0.);
     transformed.y*=1.-.62*tsW.w;
     // 바람 물결 띠: 바람 방향으로 흐르는 넓은 밝은 띠(색만 바뀌고 형태는 그대로).
     float along=dot(a.xz,toonWindDir);
     vTgBand=smoothstep(.55,.95,sin(along*.09-foliageTime*1.6)*.5+.5+sin(along*.023+a.x*.011-foliageTime*.7)*.25)*(1.-toonFlower);
     vTgTip=clamp(position.y/.55,0.,1.);
    }`),C.fragmentShader=C.fragmentShader.replace("#include <common>",`#include <common>
uniform vec3 tgBand;uniform float toonWaveStrength;uniform vec4 tsW;varying float vTgBand;varying float vTgTip;`).replace("#include <color_fragment>",`#include <color_fragment>
    diffuseColor.rgb=mix(diffuseColor.rgb,tgBand*mix(.8,1.,vTgTip),vTgBand*${o.bandAmount.toFixed(3)}*toonWaveStrength*vTgTip*(1.-tsW.w-tsW.z*.6));`).replace("#include <normal_fragment_begin>",`#include <normal_fragment_begin>
 normal=normalize(vNormal);`).replace("#include <lights_fragment_end>",`#include <lights_fragment_end>
`+ya.replace("RIM",(o.rim*.6).toFixed(3))).replace("#include <opaque_fragment>",`#include <opaque_fragment>
 gl_FragColor.a=min(gl_FragColor.a,.5);`)},F.customProgramCacheKey=()=>`toon-nature-grass-v3-season${b?"-field":""}`,F.userData.shared=!0,F.userData.toonNature="grass",F},m=h(),d=h(!0),g=b=>{const F=new Ue({name:b?"toon-nature-cliff":"toon-nature-rock",gradientMap:e,color:yt(o.rock)});return F.onBeforeCompile=z=>{Object.assign(z.uniforms,{trMoss:{value:yt(o.moss)},trMossDark:{value:yt(o.mossDark)},trDark:{value:yt(o.rockDark)}}),de(z),z.vertexShader=z.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vTrWorld;varying vec3 vTrNormal;varying vec3 vTrLocal;`).replace("#include <project_vertex>",`#include <project_vertex>
     {
      vec4 w=vec4(transformed,1.);vec3 nn=objectNormal;
      #ifdef USE_INSTANCING
      w=instanceMatrix*w;nn=mat3(instanceMatrix)*nn;
      #endif
      vTrWorld=(modelMatrix*w).xyz;vTrNormal=normalize(mat3(modelMatrix)*nn);vTrLocal=transformed;
     }`),z.fragmentShader=z.fragmentShader.replace("#include <lights_fragment_end>",`#include <lights_fragment_end>
 reflectedLight.indirectDiffuse*=vec3(${o.rockShadeTint.join(",")});
${Po("trRockMask",o.rockShadeDirect.toFixed(3))}`).replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
     trcBaseN=normal;`).replace("#include <common>",`#include <common>
    uniform vec3 trMoss,trMossDark,trDark;varying vec3 vTrWorld;varying vec3 vTrNormal;varying vec3 vTrLocal;
    float trRockMask=1.;${No}${qt}
    ${Ro}${je}
    float trHash(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
    float trNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
     return mix(mix(mix(trHash(i),trHash(i+vec3(1,0,0)),f.x),mix(trHash(i+vec3(0,1,0)),trHash(i+vec3(1,1,0)),f.x),f.y),
                mix(mix(trHash(i+vec3(0,0,1)),trHash(i+vec3(1,0,1)),f.x),mix(trHash(i+vec3(0,1,1)),trHash(i+vec3(1,1,1)),f.x),f.y),f.z);}`).replace("#include <color_fragment>",`#include <color_fragment>
     {
      // 야숨 바위 칠(재판정, 참고 04_19·04_20·04_09): 회색 바탕 + 어두운 녹회 얼룩 + 이끼. 지형 암반과 같은 함수(trcPaint).
      vec3 wp=vTrWorld,wn=normalize(vTrNormal);if(!gl_FrontFacing)wn=-wn;float px=trcPixel(wp,wn),moss;
      diffuseColor.rgb=trcPaint(wp,wn,diffuseColor.rgb,trDark,tsMossTint(trMoss),tsMossTint(trMossDark),px,${(o.mossLevel-.84).toFixed(3)},moss);
      trRockMask=1.-moss*.8;
      // 겨울: 평평한 윗면·턱에만 눈. 가파른 면(약 45° 이상)은 맨 바위로 남긴다(회색 바위와 흰 눈의 줄무늬).
      float snow=tsSnowCover(wp,wn.y,.6,.82);diffuseColor.rgb=mix(diffuseColor.rgb,TS_SNOW,snow);trRockMask*=1.-snow;
     }`)},F.customProgramCacheKey=()=>`toon-nature-rock-v6-season-${b?"cliff":"rock"}`,F.userData.shared=!0,F.userData.toonNature="rock",F.userData.toonRock=!0,F},p={rock:g(!1),cliff:g(!0)},y=new Map;function v(b){const F=/([a-z0-9_]+)-lod(\d)\.glb$/.exec(String(b));if(!F)return null;const[,z,C]=F,_=Math.min(2,+C),W=`${z}:${_}`;if(y.has(W))return y.get(W);let H=null;if(Qa[z]){const R=Mi(z);H=[{geometry:R,material:R.userData.cliff?p.cliff:p.rock}],i.rocks++}else if(pa[z]){const R=pa[z];H=[{geometry:(R.kind==="broadleaf"?vi(R,_,a):R.kind==="sapling"?bi(R,_,a):yi(R,_,a)).geometry(`toon-${z}-lod${_}`),material:c}]}return H&&(i.parts++,i.triangles[W]=H.reduce((R,O)=>R+O.geometry.attributes.position.count/3,0)),y.set(W,H),H}const w={grass:ie({blades:12,height:.5,spread:.22,flowers:2,seed:5},a).geometry("toon-grass-clump",{extra:"toonFlower"}),short:ie({blades:8,height:.34,spread:.26,flowers:1,seed:9},a).geometry("toon-grass-short",{extra:"toonFlower"}),tall:ie({blades:14,height:.7,spread:.3,flowers:2,seed:13},a).geometry("toon-grass-tall",{extra:"toonFlower"}),forest:ie({blades:7,height:.44,spread:.18,flowers:1,seed:17},a).geometry("toon-grass-forest",{extra:"toonFlower"}),field:ie({blades:17,height:.58,spread:.42,flowers:2,seed:21},a).geometry("toon-grass-field",{extra:"toonFlower"}),fieldFar:ie({blades:8,height:.58,spread:.42,flowers:2,seed:21},a).geometry("toon-grass-field-far",{extra:"toonFlower"})},M=Si(a).geometry("toon-shrub"),k=new Set(["66655f","55544f"]);function D(b){if(!b?.isMesh||b.isInstancedMesh||b.userData.toonStreamSlab||!b.parent?.userData?.stream)return!1;const F=b.material;if(!F?.isMeshStandardMaterial||!F.flatShading||!k.has(F.color.getHexString()))return!1;const z=b.geometry.attributes.position;if(!z||z.count%36)return!1;const C=[],_=new Oa,W=new P,H=new P;for(let O=0;O<z.count;O+=36){_.makeEmpty();for(let x=O;x<O+36;x++)_.expandByPoint(W.fromBufferAttribute(z,x));_.getSize(H);const I=Math.floor(Math.abs(_.min.x*7.31+_.min.z*3.17)*100)%1e5+1,K=H.x*.4,U=H.z*.4,X=Math.max(H.y*.9,Math.min(K,U)*.62);C.push(Ja({center:new P((_.min.x+_.max.x)/2,_.min.y+X*.3,(_.min.z+_.max.z)/2),radius:new P(K,X,U),rotation:new Vo(0,I*.37,0),seed:I,floor:_.min.y,flatTop:!1}))}const R=ye(C);return C.forEach(O=>O.dispose()),R.computeBoundingBox(),R.computeBoundingSphere(),R.name="toon-stream-rocks",b.geometry=R,b.material=p.rock,b.castShadow=!1,b.userData.toonStreamSlab=!0,i.streamSlabs=(i.streamSlabs??0)+C.length,!0}const B=new Set(["4e6b3a","36502c"]);let A=null;function S(b){if(!b?.isMesh||b.isInstancedMesh||b.userData.toonHedge)return!1;const F=b.material;if(!F?.isMeshStandardMaterial||!F.vertexColors||!B.has(F.color.getHexString()))return!1;const z=b.geometry.clone(),C=z.attributes.position,_=z.attributes.normal;if(!_)return!1;const W=new Map,H=R=>`${Math.round(C.getX(R)*500)},${Math.round(C.getY(R)*500)},${Math.round(C.getZ(R)*500)}`;for(let R=0;R<C.count;R++){const O=H(R),I=W.get(O)??[0,0,0];I[0]+=_.getX(R),I[1]+=_.getY(R),I[2]+=_.getZ(R),W.set(O,I)}for(let R=0;R<C.count;R++){const O=W.get(H(R)),I=Math.hypot(...O)||1;_.setXYZ(R,O[0]/I,O[1]/I,O[2]/I)}return z.setAttribute("toonPart",new at(new Float32Array(C.count).fill(Pt.bush),1)),z.userData.shared=!0,b.geometry=z,A||(A=c.clone(),A.onBeforeCompile=c.onBeforeCompile,A.customProgramCacheKey=c.customProgramCacheKey,A.color.copy(a.bush).multiplyScalar(.95),A.userData={...c.userData,shared:!0}),b.material=A,b.userData.toonHedge=!0,i.hedges=(i.hedges??0)+1,!0}function T(b){if(D(b)||S(b))return!0;if(!b?.isInstancedMesh||b.userData.toonGroundCover)return!1;const F=Array.isArray(b.material)?null:b.material;if(!F)return!1;const z=F.customProgramCacheKey?.()??"";let C=null;return/^roadside-grass/.test(z)?C="grass":/^roadside-shrub/.test(z)?C="tall":/^forest-blades/.test(z)?C="forest":/^shrub-layer/.test(z)?C="shrub":b.userData.metricKind==="하층 식생"&&F.isMeshStandardMaterial&&!F.map&&F.side===zt&&(C="short"),C?(b.geometry=C==="shrub"?M:w[C],b.material=C==="shrub"?c:m,b.userData.toonGroundCover=C,b.boundingBox&&b.boundingBox.expandByScalar(.3),b.boundingSphere&&(b.boundingSphere.radius+=.3),C==="shrub"?i.shrubSwaps++:i.grassSwaps++,!0):!1}return{natureParts:v,swapGroundCover:T,materials:{foliage:c,grass:m,grassField:d,rock:p.rock,cliff:p.cliff},palette:a,status:i,geometries:{grass:w,shrub:M}}}const Lo={lat:37.46803,lon:126.946528},qo=Math.PI/180,tn=6378137,en=.0066943799901413165,on=Lo.lat*qo,an=1-en*Math.sin(on)**2,Di=tn/Math.sqrt(an)*Math.cos(on)*qo,Fi=tn*(1-en)/an**1.5*qo,Ai=(e,t)=>({x:(t-Lo.lon)*Di,z:(Lo.lat-e)*Fi}),bt=(e,t,o)=>e+(t-e)*o;function al(e,t,o){const{x0:a,z0:i,spacing:s,width:n,height:r,values:l}=e,c=(t-a)/s,u=(o-i)/s;if(c<0||u<0||c>n-1||u>r-1)throw new RangeError("고도 격자 범위 밖");const f=Math.min(n-2,Math.floor(c)),h=Math.min(r-2,Math.floor(u));return bt(bt(l[h*n+f],l[h*n+f+1],c-f),bt(l[(h+1)*n+f],l[(h+1)*n+f+1],c-f),u-h)}function ko(e,t,o){let a={distance:1/0};for(let i=0;i<e.length-1;i++){const s=e[i],n=e[i+1],r=n.x-s.x,l=n.z-s.z,c=Math.max(0,Math.min(1,((t-s.x)*r+(o-s.z)*l)/(r*r+l*l||1))),u=Math.hypot(t-bt(s.x,n.x,c),o-bt(s.z,n.z,c));u<a.distance&&(a={distance:u,y:bt(s.y,n.y,c),s:bt(s.s,n.s,c),width:bt(s.width,n.width,c),index:i,t:c})}return a}function Zo(e){const t=f=>{const h={minX:1/0,minZ:1/0,maxX:-1/0,maxZ:-1/0};for(const m of f)for(const d of[e[m],e[m+1]])h.minX=Math.min(h.minX,d.x),h.maxX=Math.max(h.maxX,d.x),h.minZ=Math.min(h.minZ,d.z),h.maxZ=Math.max(h.maxZ,d.z);if(f.length<=8)h.ids=f;else{const m=h.maxX-h.minX>h.maxZ-h.minZ?"x":"z";f.sort((g,p)=>e[g][m]+e[g+1][m]-e[p][m]-e[p+1][m]);const d=f.length>>1;h.left=t(f.slice(0,d)),h.right=t(f.slice(d))}return h},o=t(e.slice(1).map((f,h)=>h));let a=0,i=0,s=1/0,n=1/0,r=1/0,l=0;const c=f=>Math.max(f.minX-a,0,a-f.maxX)**2+Math.max(f.minZ-i,0,i-f.maxZ)**2,u=f=>{if(!(c(f)>n+1e-9))if(f.ids)for(const h of f.ids){const m=e[h],d=e[h+1],g=d.x-m.x,p=d.z-m.z,y=Math.max(0,Math.min(1,((a-m.x)*g+(i-m.z)*p)/(g*g+p*p||1))),v=Math.hypot(a-bt(m.x,d.x,y),i-bt(m.z,d.z,y));(v<s||v===s&&h<r)&&(n=v**2,s=v,r=h,l=y)}else{const h=c(f.left)<=c(f.right)?f.left:f.right;u(h),u(h===f.left?f.right:f.left)}};return(f,h)=>{if(a=f,i=h,s=1/0,n=1/0,r=1/0,l=0,u(o),r===1/0)return{distance:1/0,index:1/0};const m=e[r],d=e[r+1],g=l;return{distance:s,y:bt(m.y,d.y,g),s:bt(m.s,d.s,g),width:bt(m.width,d.width,g),index:r,t:g}}}function nl(e,t){const o=Math.max(0,Math.min(1,(t.distance-t.width/2-2)/24)),a=o*o*(3-2*o);return bt(t.y,e,a)}const fo=Object.freeze({road:{half:5.5,from:-1.5,to:20},innerRoad:{half:3.5,from:-24,to:-1.5},sidewalk:{inner:5.6,outer:7.7,from:-1.5,to:20},plaza:{half:7.7,from:20,to:41},pavilionPad:{x0:7.7,x1:11.8,z0:.6,z1:8.4},kerb:{inner:.06,outer:.14,width:.2},lift:.02});function nn(e,t,o=0){const a=fo,i=Math.abs(e);if(t>=a.road.from-o&&t<=a.plaza.to+.3+o&&i<=a.plaza.half+.3+o||t>=a.innerRoad.from-o&&t<=a.road.from+o&&i<=a.innerRoad.half+.3+o)return!0;const s=a.pavilionPad;return e>=s.x0-o&&e<=s.x1+o&&t>=s.z0-o&&t<=s.z1+o}const Xo=Object.freeze([{id:"왼쪽 석축+낮은 상록 생울타리",side:-1,x:-8.55,from:1.5,to:40.5,height:.85,depth:.95,wall:.45},{id:"오른쪽 높은 관목 울타리",side:1,x:8.6,from:9.2,to:40.5,height:2.1,depth:1.1,wall:0}]),Ri=Object.freeze([{id:"pavilion",name:"안내도 정자(기와지붕·붉은 기둥·안내판 3면)",x:9.75,z:4.5,yaw:.35,source:"로드뷰 2025-05 눈확인"},{id:"bench",name:"흰 철제 벤치",x:7.05,z:2.6,yaw:Math.PI/2,source:"로드뷰 2025-05"},{id:"bench",name:"흰 철제 벤치",x:7.05,z:6.4,yaw:Math.PI/2,source:"로드뷰 2025-05"},{id:"sign",name:"소형 안내판(검은 기둥)",x:6.55,z:-.9,yaw:-.5,source:"2020 사진"},{id:"bollard",name:"노랑·검정 차단봉",x:-5.6,z:19.6},{id:"bollard",name:"노랑·검정 차단봉",x:5.6,z:19.6},{id:"bollard",name:"노랑·검정 차단봉",x:-5.6,z:1.2},{id:"bollard",name:"노랑·검정 차단봉",x:5.6,z:9.4},{id:"lamp",name:"가로등(위치 임의)",x:-7.25,z:12},{id:"lamp",name:"가로등(위치 임의)",x:7.25,z:16},{id:"lamp",name:"가로등(위치 임의)",x:-7.25,z:33},{id:"lamp",name:"가로등(위치 임의)",x:7.25,z:37}]),Ni=Object.freeze([{id:"pine_tree_01",x:11.2,z:27,scale:1.15},{id:"pine_tree_01",x:12.6,z:33.5,scale:1.3},{id:"pine_tree_01",x:10.9,z:39.5,scale:1.05},{id:"pine_sapling_medium",x:-10.6,z:7.5,scale:1.35},{id:"island_tree_01",x:-11.3,z:16.5,scale:1},{id:"island_tree_01",x:-12.2,z:27.5,scale:1.1},{id:"tree_small_02",x:-10.8,z:36,scale:.95,tint:14262412},{id:"tree_small_02",x:9.3,z:-7.5,scale:1.05},{id:"tree_small_02",x:-8.4,z:-6.5,scale:.95}]),Yo=()=>typeof document<"u";function uo(e){return()=>(e=Math.imul(e,1664525)+1013904223>>>0)/4294967296}function xe(e){const t=uo(e),o=new Float32Array(4096).map(()=>t());return(a,i)=>{const s=Math.floor(a),n=Math.floor(i),r=a-s,l=i-n,c=g=>g*g*(3-2*g),u=(g,p)=>o[(p&63)<<6|g&63],f=u(s,n),h=u(s+1,n),m=u(s,n+1),d=u(s+1,n+1);return f+(h-f)*c(r)+(m-f)*c(l)+(f-h-m+d)*c(r)*c(l)}}function sn(e,t,o){const a=document.createElement("canvas");a.width=a.height=t;const i=a.getContext("2d"),s=i.createImageData(t,t);for(let n=0;n<t;n++)for(let r=0;r<t;r++){const l=(m,d)=>e[(d+t)%t*t+(m+t)%t],c=(l(r+1,n)-l(r-1,n))*o,u=(l(r,n+1)-l(r,n-1))*o,f=Math.hypot(c,u,1),h=(n*t+r)*4;s.data[h]=(-c/f*.5+.5)*255,s.data[h+1]=(u/f*.5+.5)*255,s.data[h+2]=(1/f*.5+.5)*255,s.data[h+3]=255}return i.putImageData(s,0,0),a}function Qt(e,t=!0){const o=new Ga(e);return o.wrapS=o.wrapT=ns,o.anisotropy=8,t&&(o.colorSpace=ht),o.needsUpdate=!0,o}const Ze=4;function Pi(e=1024){if(!Yo())return null;const t=16,o=e/t,a=Math.max(2,Math.round(o*.034)),i=uo(20261103),s=xe(7),n=xe(11),r=document.createElement("canvas");r.width=r.height=e;const l=r.getContext("2d"),c=l.createImageData(e,e),u=new Float32Array(e*e),f=[];for(let h=0;h<t;h++)for(let m=0;m<t;m++){const d=i(),g=d<.05?"white":d<.11?"dark":"grey",p=g==="white"?[188,186,180]:g==="dark"?[112,113,112]:[150,150,147],y=(i()-.5)*10,v=(i()-.5)*5;f.push({rgb:[p[0]+y+v,p[1]+y,p[2]+y-v],stain:i()<.22?{x:i(),y:i(),r:.25+i()*.5,a:.08+i()*.12}:null,chip:i()<.3?Math.floor(i()*4):-1,tilt:(i()-.5)*.6})}for(let h=0;h<e;h++)for(let m=0;m<e;m++){const d=Math.floor(m/o),g=Math.floor(h/o),p=f[g*t+d],y=m-d*o,v=h-g*o,w=Math.min(y,v,o-1-y,o-1-v),M=(h*e+m)*4;let k,D;const B=p.chip>=0&&Math.hypot(y-(p.chip&1?o:0),v-(p.chip&2?o:0))<o*.13*(.7+.6*n(m*.3,h*.3));if(w<a||B){const A=.5+.3*s(m*.05,h*.05);k=[70*A+62,66*A+60,58*A+56],D=0}else{const A=Math.min(1,(w-a)/(o*.06)),S=(n(m*.9,h*.9)-.5)*12+(i()-.5)*9,T=(s(m*.012+3,h*.012)-.5)*14;let b=S+T+p.tilt*(y/o-.5)*6;if(p.stain){const z=y/o-p.stain.x,C=v/o-p.stain.y,_=Math.max(0,1-Math.hypot(z,C)/p.stain.r);b-=_*_*p.stain.a*255*.5}const F=(1-A)*-7;k=p.rgb.map(z=>z+b+F),D=.55+.45*A+(n(m*.6,h*.6)-.5)*.08}c.data[M]=Math.max(0,Math.min(255,k[0])),c.data[M+1]=Math.max(0,Math.min(255,k[1])),c.data[M+2]=Math.max(0,Math.min(255,k[2])),c.data[M+3]=255,u[h*e+m]=D}return l.putImageData(c,0,0),{map:Qt(r),normalMap:Qt(sn(u,e,2.2),!1),metres:Ze}}const Bo=2;function Wi(e=512){if(!Yo())return null;const t=uo(4),o=xe(5),a=xe(9),i=document.createElement("canvas");i.width=i.height=e;const s=i.getContext("2d"),n=s.createImageData(e,e),r=new Float32Array(e*e);for(let l=0;l<e;l++)for(let c=0;c<e;c++){const u=(l*e+c)*4,f=t(),h=(o(c*.02,l*.02)-.5)*16,m=(a(c*.7,l*.7)-.5)*18;let d=84+h+m;f>.93?d+=26+t()*30:f<.05&&(d-=18),n.data[u]=d+1,n.data[u+1]=d,n.data[u+2]=d-2,n.data[u+3]=255,r[l*e+c]=(f>.93?.6:f<.05?.1:.35)+m*.004}return s.putImageData(n,0,0),{map:Qt(i),normalMap:Qt(sn(r,e,1.4),!1),metres:Bo}}function Li(){const e=document.createElement("canvas");e.width=512,e.height=384;const t=e.getContext("2d");t.fillStyle="#e9ecdf",t.fillRect(0,0,512,384),t.fillStyle="#1f4d3a",t.fillRect(0,0,512,54),t.fillStyle="#fff",t.font='bold 30px "Noto Sans KR", "Apple SD Gothic Neo", sans-serif',t.textAlign="center",t.fillText("관악산 등산 안내도",256,38);const o=xe(3);for(let a=0;a<9;a++){t.strokeStyle=`rgba(70,110,70,${.25+a*.05})`,t.lineWidth=2,t.beginPath();for(let i=0;i<=64;i++){const s=i/64*Math.PI*2,n=150-a*15+o(Math.cos(s)*3+5,Math.sin(s)*3+5)*30;t.lineTo(270+Math.cos(s)*n*1.25,215+Math.sin(s)*n*.8)}t.closePath(),t.fillStyle=`rgba(${120-a*8},${160-a*6},${110-a*8},.35)`,t.fill(),t.stroke()}return t.strokeStyle="#c23b2c",t.lineWidth=5,t.setLineDash([12,6]),t.beginPath(),t.moveTo(90,350),t.bezierCurveTo(160,300,170,240,230,230),t.bezierCurveTo(300,215,300,160,285,140),t.stroke(),t.setLineDash([]),t.fillStyle="#c23b2c",t.beginPath(),t.arc(90,350,9,0,Math.PI*2),t.fill(),t.fillStyle="#222",t.font="bold 18px sans-serif",t.textAlign="left",t.fillText("현위치",104,356),t.fillText("연주대 ▲",296,140),e}function wa(e){const t=document.createElement("canvas");t.width=256,t.height=384;const o=t.getContext("2d");o.fillStyle="#ecefe7",o.fillRect(0,0,256,384),o.fillStyle="#1f4d3a",o.fillRect(0,0,256,48),o.fillStyle="#fff",o.font='bold 24px "Noto Sans KR", "Apple SD Gothic Neo", sans-serif',o.textAlign="center",o.fillText(e,128,33),o.fillStyle="#7c857a";for(let a=0;a<13;a++){const i=150+a*53%60;o.fillRect(24,72+a*23,i,7)}return t}function rn(){const e=new Map,t=(s,n,r=0,l=0,c=0,u=0)=>{u&&n.rotateY(u),n.translate(r,l,c);const f=n.index?n.toNonIndexed():n;f!==n&&n.dispose(),e.has(s)||e.set(s,[]),e.get(s).push(f)};return{add:t,box:(s,n,r,l,c,u,f,h=0)=>t(s,new _e(c,u,f),n,r,l,h),cyl:(s,n,r,l,c,u,f,h=8)=>t(s,new Ut(c,u,f,h),n,r,l),merged:()=>[...e].map(([s,n])=>{for(const c of n)for(const u of Object.keys(c.attributes))["position","normal","uv","color"].includes(u)||c.deleteAttribute(u);if(n.some(c=>c.attributes.color)){for(const c of n)if(!c.attributes.color){const u=new Float32Array(c.attributes.position.count*3).fill(1);c.setAttribute("color",new ke(u,3))}}const l=ye(n,!1);return n.forEach(c=>c.dispose()),l.computeBoundingBox(),l.computeBoundingSphere(),[s,l]})}}const Bi={granite:11842476,kerbDark:9342342,white:15790057,whiteSteel:15264230,red:9386544,roof:5198676,tile:8225150,woodDark:4930092,black:2763821,lampGrey:6054243,yellow:15317283,leaf:5139258,leafDark:3559468,stone:10196618,soil:5194290,glass:16052184},Qo=new Map(Object.entries(Bi).map(([e,t])=>[e,new At({color:t,roughness:e==="whiteSteel"?.55:e==="glass"?.3:.9,metalness:e==="whiteSteel"||e==="lampGrey"?.25:0,vertexColors:["leaf","leafDark"].includes(e)})]));Qo.get("glass").emissive=new nt(2762264);function Jo(e,t,o){const a=Math.cos(e.yaw),i=Math.sin(e.yaw);return{x:e.x+t*a+o*i,z:e.z-t*i+o*a}}function Kt(e,t,o,a,i,s,n,r,l=fo.lift,c=.5){const u=Math.max(1,Math.ceil((a-o)/c)),f=Math.max(1,Math.ceil((s-i)/c)),h=[],m=[],d=[],g=[];for(let y=0;y<=f;y++)for(let v=0;v<=u;v++){const w=o+(a-o)*v/u,M=i+(s-i)*y/f,k=Jo(e,w,M);h.push(k.x,t(k.x,k.z)+l,k.z),m.push(w/n,M/n);const D=1+(r(w*.11,M*.11)-.5)*.14+Math.max(0,1-Math.abs(w)/3.5)*.035;d.push(D,D,D)}for(let y=0;y<f;y++)for(let v=0;v<u;v++){const w=y*(u+1)+v,M=w+1,k=w+u+1,D=k+1;g.push(w,k,M,M,k,D)}const p=new xt;return p.setAttribute("position",new at(h,3)),p.setAttribute("uv",new at(m,2)),p.setAttribute("color",new at(d,3)),p.setIndex(g),p.computeVertexNormals(),p.toNonIndexed()}function Bt(e,t,o,a,i,s,n,r,l,c){const u=Math.hypot(n-i,r-s),f=Math.max(1,Math.round(u/1)),h=Math.atan2(n-i,r-s)+t.yaw;for(let m=0;m<f;m++){const d=(m+.5)/f,g=i+(n-i)*d,p=s+(r-s)*d,y=Jo(t,g,p),v=o(y.x,y.z)+fo.lift;e.box(m%3===1?"kerbDark":a,y.x,v+c/2-.03,y.z,l,c+.06,u/f-.006,h)}}function Ei(e,t){const o=new Dt;o.name="광장 바닥 · 블록·아스팔트·경계석(자체 절차 텍스처)";const a=fo,i=xe(17),s=Pi(),n=Wi(),r=new At({color:s?16772829:10262672,map:s?.map??null,normalMap:s?.normalMap??null,normalScale:new wt(.9,.9),roughness:.9,vertexColors:!0,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),l=new At({color:n?16772829:5657423,map:n?.map??null,normalMap:n?.normalMap??null,normalScale:new wt(.6,.6),roughness:.95,vertexColors:!0,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),c=new At({color:15329247,roughness:.8,polygonOffset:!0,polygonOffsetFactor:-4,polygonOffsetUnits:-4}),u=[Kt(e,t,-a.plaza.half,a.plaza.half,a.plaza.from,a.plaza.to,Ze,i),...[-1,1].map(p=>Kt(e,t,p<0?-a.sidewalk.outer:a.sidewalk.inner,p<0?-a.sidewalk.inner:a.sidewalk.outer,a.sidewalk.from,a.sidewalk.to,Ze,i)),Kt(e,t,a.pavilionPad.x0,a.pavilionPad.x1,a.pavilionPad.z0,a.pavilionPad.z1,Ze,i)],f=[Kt(e,t,-a.road.half,a.road.half,a.road.from,a.road.to,Bo,i),Kt(e,t,-a.innerRoad.half,a.innerRoad.half,a.innerRoad.from,a.innerRoad.to,Bo,i)],h=[...[-1,1].map(p=>Kt(e,t,p*5.2-.075,p*5.2+.075,a.road.from+.4,a.road.to-.4,1,()=>.5,a.lift+.004,1)),...[-1,1].map(p=>Kt(e,t,p*3.2-.075,p*3.2+.075,a.innerRoad.from+.4,a.road.from-.6,1,()=>.5,a.lift+.004,1))];for(const[p,y,v]of[["블록 포장",u,r],["아스팔트",f,l],["흰 차선",h,c]]){const w=ye(y,!1);y.forEach(k=>k.dispose()),w.computeBoundingBox(),w.computeBoundingSphere();const M=new _t(w,v);M.name=p,M.receiveShadow=!0,o.add(M)}const m=rn(),d=a.kerb;for(const p of[-1,1]){Bt(m,e,t,"granite",p*a.sidewalk.inner,a.sidewalk.from,p*a.sidewalk.inner,a.sidewalk.to,d.width,d.inner);const y=p>0?a.pavilionPad.z1:a.sidewalk.from;Bt(m,e,t,"granite",p*a.plaza.half,y,p*a.plaza.half,a.plaza.to,d.width,d.outer),Bt(m,e,t,"granite",p*a.innerRoad.half+p*.1,a.innerRoad.from,p*a.innerRoad.half+p*.1,a.road.from,d.width,d.outer)}const g=a.pavilionPad;Bt(m,e,t,"granite",g.x0,g.z0,g.x1,g.z0,d.width,d.outer),Bt(m,e,t,"granite",g.x1,g.z0,g.x1,g.z1,d.width,d.outer),Bt(m,e,t,"granite",g.x1,g.z1,g.x0,g.z1,d.width,d.outer),Bt(m,e,t,"granite",a.plaza.half,a.sidewalk.from,a.plaza.half,g.z0,d.width,d.outer),Bt(m,e,t,"granite",-a.plaza.half,a.plaza.to,a.plaza.half,a.plaza.to,d.width,d.outer),Bt(m,e,t,"granite",-a.road.half,a.road.to,a.road.half,a.road.to,.3,.004);for(const[p,y]of m.merged()){const v=new _t(y,Qo.get(p));v.name="경계석",v.receiveShadow=!0,o.add(v)}return o.userData.textures={block:!!s,asphalt:!!n,source:"산풍경 자체 절차 텍스처(외부 이미지 없음)"},o}function $i(e,t,o){const a=uo(Math.round(t.x*100));if(t.to-t.from,t.wall)for(let r=0;r<2;r++){let l=t.from;for(;l<t.to;){const c=.32+a()*.22;(!o||r===0)&&e.box("stone",t.x-t.side*.5+t.side*r*.04,r*.22+.11,l+c/2,.36,o?t.wall:.21,c-.025),l+=c}}const i=o?1.6:.55,s=t.wall?t.wall-.05:0,n=t.height;for(let r=t.from+i/2;r<t.to;r+=i)for(let l=0;l<(o?1:n>1.2?3:2);l++){const c=(o?.75:.48)*(n>1.2?1.15:1)*(.85+a()*.3),u=new Ne(c,o?0:1),f=u.attributes.position;for(let d=0;d<f.count;d++){const g=.82+a()*.32;f.setXYZ(d,f.getX(d)*g*(t.depth/1.9/c+.25),f.getY(d)*g*(n>1.2?1.25:.85),f.getZ(d)*g)}const h=new Float32Array(f.count*3);for(let d=0;d<f.count;d++){const g=.78+a()*.4,p=.85+.25*(f.getY(d)/c);h.set([g*p*.95,g*p,g*p*.85],d*3)}u.setAttribute("color",new ke(h,3)),u.computeVertexNormals();const m=o?s+n/2:s+c*.7+l*(n-s-c*.9)/Math.max(1,n>1.2?2:1);e.add(l%2?"leafDark":"leaf",u,t.x+(a()-.5)*.15,Math.min(m,s+n-c*.45),r+(a()-.5)*.2)}}function Hi(e,t,o,a){const i=Math.cos(t.yaw),s=Math.sin(t.yaw),n=(m,d)=>[t.x+m*i+d*s,t.z-m*s+d*i];for(const m of[-.75,.75])for(const d of[-1.6,1.6]){const[g,p]=n(m,d);e.cyl("red",g,1.25,p,.11,.12,2.5,o?6:10),e.cyl("granite",g,.08,p,.2,.22,.16,8)}for(const m of[-1.6,1.6]){const[d,g]=n(0,m);e.box("red",d,2.45,g,1.7,.16,.18,t.yaw)}for(const m of[-.75,.75]){const[d,g]=n(m,0);e.box("red",d,2.45,g,.18,.16,3.4,t.yaw)}const r=new ss(1,1,4,1,!0);r.rotateY(Math.PI/4),r.scale(1.25*1.42,.95,2.45*1.42);const[l,c]=n(0,0);e.add("roof",r,l,3,c,t.yaw);const u=new _e(.14,.12,1.3);if(e.add("tile",u,l,3.44,c,t.yaw),!o){const m=new _e(2.5,.1,4.9);e.add("woodDark",m,l,2.56,c,t.yaw)}const[f,h]=n(.62,0);if(e.box("woodDark",f,1.45,h,.08,1.35,3.1,t.yaw),a)for(const[m,d]of[-1.05,0,1.05].entries()){const[g,p]=n(.57,d),y=new _t(new Uo(m===1?1.25:.92,m===1?.95:1.15),a[m]);y.position.set(g,1.5,p),y.rotation.y=t.yaw-Math.PI/2,a.meshes.push(y)}}function Ii(e,t,o){const a=Math.cos(t.yaw),i=Math.sin(t.yaw),s=(n,r)=>[t.x+n*a+r*i,t.z-n*i+r*a];for(const n of[-.7,.7]){const[r,l]=s(n,0);e.box("whiteSteel",r,.22,l,.05,.44,.42,t.yaw),e.box("whiteSteel",r,.62,l+0,.05,.4,.05,t.yaw)}for(let n=0;n<(o?1:4);n++){const[r,l]=s(0,-.15+n*.1);e.box("whiteSteel",r,.44,l,1.6,.035,o?.42:.07,t.yaw)}if(!o)for(let n=0;n<3;n++){const[r,l]=s(0,.22);e.box("whiteSteel",r,.58+n*.12,l,1.6,.06,.03,t.yaw)}}function Oi(e,t,o){const a=t.x<0?1:-1;e.cyl("lampGrey",t.x,2.25,t.z,.06,.09,4.5,o?5:8),e.cyl("lampGrey",t.x,.15,t.z,.13,.15,.3,8),o||(e.box("lampGrey",t.x+a*.35,4.45,t.z,.75,.06,.08),e.box("lampGrey",t.x+a*.75,4.36,t.z,.42,.12,.26),e.box("glass",t.x+a*.75,4.28,t.z,.36,.04,.2))}function Gi(e,t,o){for(let a=0;a<(o?1:4);a++)e.cyl(a%2?"black":"yellow",t.x,o?.4:.1+a*.2,t.z,.07,.07,o?.8:.2,8);e.cyl("black",t.x,.83,t.z,.05,.075,.06,8)}function Ui(e,t,o){e.cyl("black",t.x,.9,t.z,.05,.05,1.8,6),e.box("black",t.x,1.55,t.z,.62,.42,.06,t.yaw),o||e.box("white",t.x,1.55,t.z,.56,.36,.065,t.yaw)}function Vi(e=!1){const t=rn(),o=Yo()&&!e?Object.assign([Qt(wa("관악산 안내")),Qt(Li()),Qt(wa("산행 안전"))].map(i=>new At({map:i,roughness:.6})),{meshes:[]}):null;for(const i of Xo)$i(t,i,e);for(const i of Ri)({pavilion:()=>Hi(t,i,e,o),bench:()=>Ii(t,i,e),lamp:()=>Oi(t,i,e),bollard:()=>Gi(t,i,e),sign:()=>Ui(t,i,e)})[i.id]();const a=new Dt;a.name="광장 시설 · 정자·벤치·가로등·차단봉·화단(추정 위치)";for(const[i,s]of t.merged()){const n=new _t(s,Qo.get(i));n.receiveShadow=!0,n.castShadow=!e&&["red","roof","whiteSteel","lampGrey","leaf","leafDark"].includes(i),a.add(n)}for(const i of o?.meshes??[])a.add(i);return a}function sl(e){const t=new Map;for(const[o,a]of Ni.entries()){const i=Jo(e,a.x,a.z);t.has(a.id)||t.set(a.id,[]),t.get(a.id).push({x:i.x,z:i.z,scale:a.scale,yaw:o*2.399%(Math.PI*2),embed:.03,...a.tint?{forestTint:a.tint}:{}})}return[...t].map(([o,a])=>({id:o,kind:"tree",priority:!0,entranceSpecimen:!0,placements:a,levels:[0,1,2].map(i=>({url:`${o}-lod${i}.glb`,distance:[0,55,130][i]}))}))}const ji="B",Ki={A:{startPoint:{lat:37.468244,lon:126.946319,facingDeg:142},gate:{lat:37.46803,lon:126.946528},freeRoamPolygon:[{lat:37.468054,lon:126.946419},{lat:37.46812,lon:126.946526},{lat:37.468334,lon:126.946317},{lat:37.468268,lon:126.94621}]},B:{startPoint:{lat:37.468378,lon:126.946067,facingDeg:132},gate:{lat:37.468197,lon:126.94632},freeRoamPolygon:[{lat:37.468205,lon:126.946207},{lat:37.468285,lon:126.946298},{lat:37.468467,lon:126.946046},{lat:37.468386,lon:126.945955}]}},zo={...Ki[ji]},so=3.05,qi=.56,ln=[-2.15,-.92,1.15,2.3],cn=.3,ba={x:.4,z:.35},Zi=[...[-so,so].map(e=>({kind:"pillar",x:e,z:0,radius:qi})),...ln.map(e=>({kind:"barricade",x:e,z:cn,halfX:ba.x,halfZ:ba.z}))];function il(e,t,o=.25){return Zi.some(a=>a.kind==="pillar"?Math.hypot(e-a.x,t-a.z)<a.radius+o:Math.hypot(Math.max(0,Math.abs(e-a.x)-a.halfX),Math.max(0,Math.abs(t-a.z)-a.halfZ))<o)}function rl(e,t,o,a=.25){const i=e.reduce((l,c,u)=>{const f=e[(u+1)%e.length];return l+c.x*f.z-f.x*c.z},0),s=Math.sign(i);let n=-1/0,r=1/0;for(let l=0;l<e.length;l++){const c=e[l],u=e[(l+1)%e.length],f=u.x-c.x,h=u.z-c.z,m=s*(f*(t.z-c.z)-h*(t.x-c.x))-a*Math.hypot(f,h),d=s*(f*o.z-h*o.x);if(Math.abs(d)<1e-10){if(m<-1e-8)return[1/0,-1/0];continue}const g=-m/d;d>0?n=Math.max(n,g):r=Math.min(r,g)}return n<=r?[n,r]:[1/0,-1/0]}const Xi={roof:5593434,eave:4672332,tile:8488322,red:9518387,green:2585955,blue:3370115,cream:14009762,stone:10592148,soil:5326388,yellow:15909676,orange:14510382,leaf:4219705,flower:14127037,paving:4013885,water:6323576,wood:7689275},he=new Map(Object.entries(Xi).map(([e,t])=>[e,new At({color:t,roughness:e==="water"?.28:.88})]));he.get("roof").side=he.get("eave").side=he.get("wood").side=zt;function mo(){const e=new Map;function t(s,n,r=0,l=0,c=0){s.translate(r,l,c),e.has(n)||e.set(n,[]),e.get(n).push(s)}const o=(s,n,r,l,c,u,f)=>t(new _e(c,u,f),s,n,r,l);function a(s,n,r,l=.04,c=6){const u=new P(...r).sub(new P(...n)),f=new Ut(l,l,u.length(),c);f.applyQuaternion(new rs().setFromUnitVectors(new P(0,1,0),u.normalize())),t(f,s,...n.map((h,m)=>(h+r[m])/2))}function i(){const s=new Dt;for(const[n,r]of e){const l=r.map(f=>f.index?f.toNonIndexed():f),c=ye(l,!1);new Set([...r,...l]).forEach(f=>f.dispose()),c.computeBoundingBox(),c.computeBoundingSphere();const u=new _t(c,he.get(n));u.receiveShadow=!0,s.add(u)}return s}return{add:t,box:o,beam:a,finish:i}}function Sa(e,t,o,a,i){const s=i?3:10,n=(r,l,c)=>{const u=r*(o*.36+l*o*.14),f=c*l*a*.5,h=Math.abs(r);return[u,t+1.75*Math.pow(1-l,1.55)+.12*l*l+.62*Math.pow(h,5)*l*l+.2*Math.pow(h,3)*Math.pow(l,6),f]};for(const r of[-1,1]){const l=[];for(let u=0;u<s;u++)for(let f=0;f<s;f++){const h=n(-1+2*f/s,u/s,r),m=n(-1+2*(f+1)/s,u/s,r),d=n(-1+2*f/s,(u+1)/s,r),g=n(-1+2*(f+1)/s,(u+1)/s,r);l.push(...(r===1?[h,d,m,m,d,g]:[h,m,d,m,g,d]).flat())}const c=new xt;if(c.setAttribute("position",new at(l,3)),c.computeVertexNormals(),e.add(c,"roof"),!i)for(let u=0;u<=40;u++){const f=-1+u/20;for(let h=0;h<5;h++)e.beam("tile",n(f,h/5,r),n(f,(h+1)/5,r),.028,4)}for(let u=0;u<s;u++)e.beam("tile",n(-1+2*u/s,1,r),n(-1+2*(u+1)/s,1,r),.075)}for(const r of[-1,1]){const l=n(r,0,1),c=n(r,1,1),u=n(r,1,-1),f=new xt;f.setAttribute("position",new at([...l,...c,...u,...l,...u,...c],3)),f.computeVertexNormals(),e.add(f,"roof"),e.beam("tile",l,c,.065),e.beam("tile",l,u,.065)}if(e.beam("tile",[-o*.36,t+1.79,0],[o*.36,t+1.79,0],.12),!i)for(const r of[-1,1])for(let l=0;l<s;l++){const c=n(-1+2*l/s,1,r),u=n(-1+2*(l+1)/s,1,r);e.beam("eave",[c[0],c[1]-.16,c[2]],[u[0],u[1]-.16,u[2]],.15,5)}}function Yi(e,t,o,a,i){const n=o*.34,r=o/2,l=a/2,c=.46,u=.38,f=1.3,h=i?6:18,m=i?4:10,d=S=>S<c?n:n+(r-n)*(S-c)/(1-c),g=(S,T)=>u*Math.pow(Math.min(1,Math.abs(S)/r),2.2)*Math.pow(T,2),p=(S,T,b)=>{const F=S*d(T),z=.035*l*(1-S*S)*T*T;return[F,t+1.6*Math.pow(1-T,f)+g(F,T),b*T*(l-z)]},y=(S,T,b)=>{const F=c+T*(1-c),z=p(S,F,1),C=g(z[0],F),_=.035*l*(1-b*b)*T*T;return[z[0]+S*-_,z[1]-C*(1-Math.pow(Math.abs(b),4)),b*z[2]]},v=(S,T,b,F,z)=>{const C=[];for(let _=0;_<b;_++)for(let W=0;W<T;W++){const H=S(W/T,_/b),R=S((W+1)/T,_/b),O=S(W/T,(_+1)/b),I=S((W+1)/T,(_+1)/b);C.push(...(z?[H,R,O,R,I,O]:[H,O,R,R,O,I]).flat())}e.add(w(C),F)},w=S=>{const T=new xt;return T.setAttribute("position",new at(S,3)),T.setAttribute("uv",new at(new Float32Array(S.length/3*2),2)),T.computeVertexNormals(),T},M=(S,T)=>[S[0],S[1]-T,S[2]],k=t+1.6;for(const S of[-1,1])v((T,b)=>p(-1+2*T,b,S),h*2,h,"roof",S<0),i||v((T,b)=>M(p(-1+2*T,.6+.4*b,S),.2),h*2,4,"eave",S>0);for(const S of[-1,1]){v((z,C)=>y(S,C,-1+2*z),m,m,"roof",S>0),i||v((z,C)=>M(y(S,.35+.65*C,-1+2*z),.2),m,3,"eave",S<0);const T=8,b=[],F=[S*n*.995,p(1,c,1)[1],0];for(const z of[-1,1])for(let C=0;C<T;C++){const _=p(S,c*C/T,z),W=p(S,c*(C+1)/T,z);b.push(...F,..._.map((H,R)=>R?H-.04:H*.995),...W.map((H,R)=>R?H-.04:H*.995))}if(e.add(w(b),"wood"),!i){const z=p(S,c,1)[1];e.box("cream",S*n*.99,z+.35,0,.03,.08,c*l*1.2),e.box("red",S*n*.99,z+.18,0,.03,.22,c*l*1.5)}}e.beam("tile",[-n,k+.1,0],[n,k+.1,0],i?.14:.17,8),i||e.beam("roof",[-n,k+.27,0],[n,k+.27,0],.1,6);for(const S of[-1,1])e.beam("tile",[S*n,k+.1,0],[S*(n+.16),k+.26,0],.17,8);const D=(S,T)=>{for(let b=0;b<S.length-1;b++)e.beam("tile",S[b],S[b+1],T,6)},B=i?3:8;for(const S of[-1,1])for(const T of[-1,1]){D(Array.from({length:B+1},(z,C)=>M(p(S,c*C/B,T),-.06)),.085);const b=Array.from({length:B+1},(z,C)=>M(p(S,c+(1-c)*C/B,T),-.07)),F=b[b.length-1];b.push([F[0]+S*.14,F[1]+.1,F[2]+T*.11]),D(b,.095)}if(i)return;for(const S of[-1,1])for(let T=0;T<=44;T++){const b=-1+T/22;for(let F=0;F<5;F++)e.beam("tile",M(p(b,F/5,S),-.035),M(p(b,(F+1)/5,S),-.035),.04,4)}for(const S of[-1,1])for(let T=1;T<14;T++){const b=-1+T/7;for(let F=0;F<4;F++)e.beam("tile",M(y(S,F/4,b),-.035),M(y(S,(F+1)/4,b),-.035),.04,4)}for(const S of[-1,1])for(let T=0;T<h*2;T++)e.beam("eave",M(p(-1+2*T/(h*2),1,S),.1),M(p(-1+2*(T+1)/(h*2),1,S),.1),.11,5);for(const S of[-1,1])for(let T=0;T<m;T++)e.beam("eave",M(y(S,1,-1+2*T/m),.1),M(y(S,1,-1+2*(T+1)/m),.1),.11,5);const A=(S,T)=>{const b=M(S,.29),F=M(T,.29),z=F.map((W,H)=>W-b[H]),C=Math.hypot(...z),_=F.map((W,H)=>W+z[H]/C*.06);e.beam("green",b,F,.06,6),e.beam("blue",F,_,.062,6)};for(const S of[-1,1])for(let T=1;T<40;T++){const b=-1+T/20;A(p(b,.66,S),p(b,.99,S))}for(const S of[-1,1])for(let T=1;T<14;T++){const b=-1+T/7;A(y(S,.45,b),y(S,.99,b))}}function fn(e,t,o,{background:a="#194f70",color:i="#ffffff"}={}){if(typeof document>"u")return null;const s=document.createElement("canvas");s.width=1024,s.height=256;const n=s.getContext("2d");n.fillStyle=a,n.fillRect(0,0,1024,256),n.strokeStyle="#a5b5a4",n.lineWidth=12,n.strokeRect(12,12,1e3,232),n.fillStyle=i,n.textAlign="center",n.textBaseline="middle",n.font='bold 140px "Noto Serif KR", "AppleMyungjo", serif',n.fillText(e,512,132,940);const r=new Ga(s);return r.colorSpace=ht,new _t(new Uo(t,o),new pe({map:r}))}function Qi(e=!1){const t=mo();for(const i of[-so,so]){t.add(new Ut(.48,.56,.5,8),"stone",i,.25,0),t.add(new Ut(.34,.38,3.15,e?8:12),"red",i,2.075,0),t.box("green",i,3.65,0,1.15,.26,1.1);for(const s of[-1,1])t.box("blue",i+s*.35,3.9,0,.24,.27,1.5),t.box("green",i+s*.45,4.1,0,.62,.16,1.8)}t.box("red",0,3.45,0,6.5,.24,.44),t.box("green",0,3.83,0,7.9,.35,.65),t.box("blue",0,4.12,0,8.4,.23,.85);for(const i of[-.6,.6])if(t.box("green",0,4.25,i,9.4,.14,.18),!e)for(let s=0;s<43;s++){const n=-4.6+s*9.2/42;t.beam(s%2?"green":"cream",[n,4.18,i],[n,4.35,i*2.1],.047)}if(!e)for(let i=0;i<27;i++){const s=-3.9+i*.3;for(const n of[-.44,.44])t.box("cream",s,4.1,n,.06,.12,.02),t.box(i%2?"red":"blue",s,3.87,n*.76,.15,.12,.025)}Yi(t,4.27,10.2,4.1,e);const o=t.finish(),a=fn("관악산공원",3.25,.65);return a&&(a.position.set(0,3.72,.48),o.add(a)),o.name="관악산공원 · 두 기둥 겹처마 자체 모델",o}function Ji(e,t,o,a){e.add(new Ut(.62,.46,.18,12),"stone",t,.2,o),e.add(new Ut(.86,.58,.53,a?8:16,1,!0),"stone",t,.53,o);const i=new is(.85,.07,4,a?12:20);i.rotateX(Math.PI/2),e.add(i,"stone",t,.8,o),e.add(new Ut(.78,.78,.04,12),"soil",t,.71,o);for(let s=0;s<(a?6:20);s++){const n=s*2.4,r=.65*Math.sqrt(s/(a?6:20)),l=t+Math.cos(n)*r,c=o+Math.sin(n)*r;e.beam("leaf",[l,.73,c],[l,.99,c],.022),e.add(new Ne(.13,0),s%3?"flower":"cream",l,1.01,c)}}function tr(e){const t=mo();for(const[o,a]of ln.entries()){const i=o%2?"orange":"yellow",s=cn;t.box(i,a,.6,s,.64,1.1,.16);for(const n of[-1,1])t.box(i,a+n*.29,.52,s,.08,1,.32),t.box(i,a+n*.27,.1,s,.26,.15,.7);t.box("cream",a,.76,s+.09,.45,.12,.02)}for(const[o,a]of[[-4.1,3.2],[-5.2,6.2],[4.2,3.4]])Ji(t,o,a,e);return t.finish()}function We(e){return{...Ai(zo.gate.lat,zo.gate.lon),y:e[0].y,yaw:-zo.startPoint.facingDeg*Math.PI/180}}function er(e,t,o){const a=We(e),i=t-a.x,s=o-a.z,n=Math.cos(a.yaw),r=Math.sin(a.yaw);return{x:n*i-r*s,z:r*i+n*s}}function ll(e,t){const o=We(t),a=Math.cos(o.yaw),i=Math.sin(o.yaw),s=(n,r)=>Xo.some(l=>Math.abs(n.x-l.x)<l.depth/2+.6+r&&n.z>l.from-r&&n.z<l.to+r);return e.map(n=>n.entranceSpecimen||n.keepAtEntrance?n:{...n,placements:n.placements.filter(r=>{const l=r.x-o.x,c=r.z-o.z,u={x:a*l-i*c,z:i*l+a*c},f=n.kind==="tree"?2.5:.6;return!nn(u.x,u.z,f)&&!s(u,f)})}).filter(n=>n.placements.length)}function cl(e,t){const o=We(e),a=new Dt,i=new Fo,s=new Fo;a.name="입구 일주문·광장",a.userData.metricKind="입구 시설",i.autoUpdate=s.autoUpdate=!1;for(const l of[!1,!0]){const c=new Dt;c.add(Qi(l),tr(l)),i.addLevel(c,l?45:0,.1)}i.addLevel(new Dt,150,.1),s.name="광장 시설";for(const l of[!1,!0])s.addLevel(Vi(l),l?60:0,.1);s.addLevel(new Dt,170,.1);for(const l of[i,s])l.position.set(o.x,o.y,o.z),l.rotation.y=o.yaw,a.add(l);const n=Ei(o,t);a.add(n);const r=(l,c,u)=>l<c?0:l<u?1:2;return a.updateMatrixWorld(!0),{group:a,items:[i,s],frame:o,ground:n,update(l){const c=l.position.distanceTo(i.position);i.levels.forEach((u,f)=>{u.object.visible=f===r(c,45,150)}),s.levels.forEach((u,f)=>{u.object.visible=f===r(c,60,170)}),n.visible=c<220}}}function fl(e,t){const o=t[0];return e.flatMap(a=>{if(a.kind!=="tree"||!a.id?.startsWith("pine_"))return[a];const i=[],s=[];for(const n of a.placements)(Math.hypot(n.x-o.x,n.z-o.z)<65?i:s).push(n);return[...s.length?[{...a,placements:s}]:[],...i.length?[{...a,id:"tree_small_02",crossboard:null,impostor:null,placements:i,levels:[0,1,2].map(n=>({url:`tree_small_02-lod${n}.glb`,distance:[0,48,120][n]}))}]:[]]})}function ul(e){const t=We(e),o=Math.cos(t.yaw),a=Math.sin(t.yaw);return(i,s,n)=>{const r=i-t.x,l=s-t.z,c=o*r-a*l,u=a*r+o*l,f=Math.max(Math.abs(c)-13,-2-u,u-42,0),h=Math.min(1,f/10),m=1-h*h*(3-2*h);return n+(t.y-n)*m}}const Eo=Object.freeze(["paved","stairs","deck","deck_stairs"]),Ma=e=>Eo.includes(e?.material);function un(e,{nearest:t=Zo(e),sites:o=[],water:a=null}={}){const i=We(e),s=Math.cos(i.yaw),n=Math.sin(i.yaw),r=(u,f)=>{const h=u-i.x,m=f-i.z;return{x:s*h-n*m,z:n*h+s*m}};function l(u,f,h=0){const m=r(u,f);return nn(m.x,m.z,h)||Xo.some(d=>Math.abs(m.x-d.x)<d.depth/2+h&&m.z>d.from-h&&m.z<d.to+h)}function c(u,f,h=0,m=null){if(l(u,f,h))return!0;const d=m??t(u,f);if(Number.isFinite(d.distance)&&(Ma(e[d.index])||Ma(e[d.index+1]))&&d.distance<d.width/2+h||a?.blocked(u,f,h))return!0;for(const g of o)if(Math.hypot(u-g.x,f-g.z)<g.supportRadius+h)return!0;return!1}return{entrance:l,blocked:c,local:r,water:a}}const De=1.5,Fe=6.5,Ht=18,Te=1.9,ka=3.5,Zt=e=>(e=e*.1031%1,e*=e+33.33,e*=e+e,e-Math.floor(e));function dn(e){return Zt(e*3.1+1)>.72?null:{across:(Zt(e*7.3+2)-.5)*1,along:(e+.15+.7*Zt(e*5.7+3))*Fe,radius:.2+.22*Zt(e*11.9+4)}}function mn(e){return Zt(e*5.1+1)<.4?null:{along:e*Ht+(Zt(e*2.3+7)-.5)*5,height:.35+.5*Zt(e*9.7+2)}}function Xt(e){const t=Math.floor(e/Ht+.5),o=mn(t);if(!o)return 0;const a=e-o.along;return a<0||a>=ka?0:o.height*Math.pow(1-a/ka,1.4)}function or(e,t,o=0,a=1,i=null){const s=[0];for(let y=1;y<e.length;y++)s.push(s[y-1]+Math.hypot(e[y].x-e[y-1].x,e[y].z-e[y-1].z));const n=s.at(-1),r=Math.max(2,Math.round(n/a)+1),l=[],c=Array.from({length:r},(y,v)=>n*v/(r-1));if(i)for(let y=Math.floor((o-Ht)/Ht);y<=Math.ceil((o+n)/Ht);y++){const v=mn(y);if(!v)continue;const w=v.along-o;w>.03&&w<n&&c.push(w-.02,w)}c.sort((y,v)=>y-v);const u=c.length;for(let y=0;y<u;y++){const v=c[y];let w=1;for(;w<e.length-1&&s[w]<v;)w++;const M=(v-s[w-1])/Math.max(1e-6,s[w]-s[w-1]);l.push({x:e[w-1].x+(e[w].x-e[w-1].x)*M,z:e[w-1].z+(e[w].z-e[w-1].z)*M,along:o+v})}for(let y=0;y<u;y++){const v=l[Math.max(0,y-1)],w=l[Math.min(u-1,y+1)],M=Math.hypot(w.x-v.x,w.z-v.z)||1;l[y].dir=[(v.x-w.x)/M,(v.z-w.z)/M],l[y].side=[-(w.z-v.z)/M*-1,(w.x-v.x)/M*-1];const k=l[y].dir[0],D=l[y].dir[1];l[y].side=[D,-k]}const f=[-1,-.62,-.3,0,.3,.62,1],h=[],m=[],d=[],g=[];for(let y=0;y<u;y++){const v=l[y];for(const w of f){const M=v.x+v.side[0]*w*De,k=v.z+v.side[1]*w*De;h.push(M,t(M,k)+.035+(i?i(v.along):0),k),m.push(w,v.along),d.push(v.dir[0],v.dir[1],v.side[0],v.side[1])}if(y){const w=y*f.length,M=w-f.length;for(let k=0;k<f.length-1;k++)g.push(M+k,M+k+1,w+k,M+k+1,w+k+1,w+k)}}const p=new xt;if(p.setAttribute("position",new at(h,3)),p.setAttribute("aStream",new at(m,2)),p.setAttribute("aFrame",new at(d,4)),p.setIndex(g),p.computeVertexNormals(),p.computeBoundingSphere(),i){const y=p.attributes.normal;for(let v=0;v<y.count;v++)y.setXYZ(v,0,1,0)}return{geometry:p,samples:l,alongEnd:l.at(-1).along}}function ar(e,t,o=null){const a=[-1,-.78,-.55,-.28,0,.28,.55,.78,1],i=[],s=[],n=[],r=new nt;for(let c=0;c<e.length;c++){const u=e[c],f=o?o(u.along):0,h=o&&f===0&&c+1<e.length&&o(e[c+1].along)>0&&e[c+1].along-u.along<.05;for(const m of a){const d=m*Te,g=u.x+u.side[0]*d,p=u.z+u.side[1]*d,y=1-Math.min(1,Math.max(0,(Math.abs(d)-1.5)/(Te-1.5))),v=.5+.5*Math.sin(g*.9+Math.sin(p*.7)*1.8)*Math.cos(p*.8-g*.3);i.push(g,t(g,p)+.02+f*y,p),r.setRGB(.082+.035*v,.078+.033*v,.07+.03*v),r.multiplyScalar(1-.4*Math.min(1,Math.max(0,(Math.abs(d)-.9)/(Te-.9)))),h&&Math.abs(d)<1.8&&r.multiplyScalar(.6),s.push(r.r,r.g,r.b)}if(c){const m=c*a.length,d=m-a.length;for(let g=0;g<a.length-1;g++)n.push(d+g,d+g+1,m+g,d+g+1,m+g+1,m+g)}}const l=new xt;return l.setAttribute("position",new at(i,3)),l.setAttribute("color",new at(s,3)),l.setIndex(n),l.computeVertexNormals(),l.computeBoundingSphere(),l}const Ae=9,hn=[-.85,-.42,0,.42,.85],pn=(e,t=1/0)=>Math.max(.05,Math.min(.22+.5*e,t*.8)),Xe=e=>({out:e,drop:e*e}),nr=.3;function gn(e,t){const o=e[t];for(let a=t-1;a>=0;a--){const i=Math.hypot(e[a].x-o.x,e[a].z-o.z);if(i>=nr)return{index:a,room:i}}return{index:-1,room:1/0}}function sr(e,t){const o=[],a=[],i=[],s=hn,n=Ae;for(let l=1;l<e.length;l++){const c=e[l],u=Xt(c.along);if(!(u>0&&Xt(e[l-1].along)===0))continue;const f=o.length/3,h=pn(u,gn(e,l-1).room),m=[0];for(let d=1;d<n;d++){const g=Xe((d-1)/(n-1)),p=Xe(d/(n-1));m.push(m[d-1]+Math.hypot((p.out-g.out)*h,(p.drop-g.drop)*u))}for(let d=0;d<n;d++){const g=d/(n-1),{out:p,drop:y}=Xe(g),v=h,w=-2*u*g,M=Math.hypot(v,w)||1,k=-w/M*.03,D=v/M*.03;for(let B=0;B<s.length;B++){const A=c.x+c.side[0]*s[B],S=c.z+c.side[1]*s[B],T=t(A,S)+.035+u,b=t(A+c.dir[0]*h,S+c.dir[1]*h)+.035,F=p*h+k;o.push(A+c.dir[0]*F,T+(b-T)*y+D,S+c.dir[1]*F),a.push(B/(s.length-1),m[d]/m[n-1])}}for(let d=0;d<n-1;d++)for(let g=0;g<s.length-1;g++){const p=f+d*s.length+g,y=p+1,v=p+s.length,w=v+1;i.push(p,y,v,y,w,v)}}if(!o.length)return null;const r=new xt;return r.setAttribute("position",new at(o,3)),r.setAttribute("uv",new at(a,2)),r.setIndex(i),r.computeBoundingSphere(),r}function ir(e,t,o,a,i=28){const s=[],n=[],r=[],l=[],c=[0,.35,.62,.82,.94,1,1.3];s.push(e,a(e,t)+.04,t),n.push(0,0),r.push(0,-1,1,0);for(const f of c.slice(1))for(let h=0;h<i;h++){const m=h/i*Math.PI*2,d=e+Math.cos(m)*o*f,g=t+Math.sin(m)*o*f;s.push(d,a(d,g)+.04,g),n.push(f,0),r.push(0,-1,1,0)}for(let f=0;f<i;f++)l.push(0,1+(f+1)%i,1+f);for(let f=0;f<c.length-2;f++)for(let h=0;h<i;h++){const m=1+f*i+h,d=1+f*i+(h+1)%i,g=m+i,p=d+i;l.push(m,d,g,d,p,g)}const u=new xt;return u.setAttribute("position",new at(s,3)),u.setAttribute("aStream",new at(n,2)),u.setAttribute("aFrame",new at(r,4)),u.setIndex(l),u.computeVertexNormals(),u.computeBoundingSphere(),u}const rr=`
varying vec2 sStream;varying vec4 sFrame;varying vec3 sWorld;
uniform float fxTime;uniform float fxSunVis;uniform float fxLowSun;uniform float fxQuality;uniform float fxRain;uniform vec3 fxSun;
float sH(float n){n=fract(n*.1031);n*=n+33.33;n*=n+n;return fract(n);}
float sHash(vec2 p){p=fract(p*vec2(.1031,.1030));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.x);}
float sV(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(sHash(i),sHash(i+vec2(1,0)),f.x),mix(sHash(i+vec2(0,1)),sHash(i+vec2(1,1)),f.x),f.y);}
// 흐름 방향으로 길쭉한 잔물결 높이. p=(across, along+흐름 이동). 가로로 촘촘하고 세로(흐름 방향)로 길다.
float sRip(vec2 p,float lite){
 float h=sV(p*vec2(3.4,1.15))*.55+sV(p*vec2(7.3,2.5)+9.)*.3;
 if(lite<.5)h+=sV(p*vec2(15.,5.2)+4.)*.15;else h+=.075;
 return h;
}
// 물속 자갈 색: 틈은 어둡고 돌마다 회갈색·황갈색·청회색이 섞인다.
vec3 sPebble(vec2 p){
 float n=sV(p*5.)*.6+sV(p*11.+3.)*.4;
 float tone=sV(p*2.1+7.);
 vec3 stone=mix(mix(vec3(.30,.29,.26),vec3(.47,.39,.29),smoothstep(.25,.6,tone)),vec3(.3,.33,.35),smoothstep(.6,.9,tone));
 return mix(vec3(.05,.045,.04),stone,smoothstep(.34,.52,n))*(.78+.4*sV(p*23.));
}
`,lr=`
{
 float level=clamp(dot(diffuseColor.rgb,vec3(.3333)),0.,1.);   // applyBasic이 밤·흐림에 곱해 주는 밝기
 vec3 Vv=cameraPosition-sWorld;float dist=length(Vv);vec3 V=Vv/max(dist,1e-4);
 float lite=fxQuality<.5?1.:0.;
 float fade=1.-smoothstep(28.,120.,dist);
 #ifdef STREAM_POND
 float across=sStream.x*SPAN;float along=0.;
 vec2 pw=sWorld.xz;
 float q=fxTime*.05;
 float halfW=SPAN*(.9+.04*sV(sWorld.xz*.5));
 float dW=halfW-across;
 vec2 flowP=pw*1.1+vec2(q,-q*.7);
 float tail=0.;
 #else
 float across=sStream.x*${De.toFixed(2)};float along=sStream.y;
 float speed=.85+.4*fxRain;
 float q=along+fxTime*speed;
 float halfW=.62+.22*sV(vec2(along*.28,3.1));
 float dW=halfW-abs(across);
 vec2 flowP=vec2(across,q);
 // 턱(작은 낙차): 18m마다 물이 한 번 떨어지고 그 아래로 거품이 하류로 길게 흩어진다.
 float lc=floor(along/${Ht.toFixed(1)}+.5);
 float ledgeOn=step(.4,sH(lc*5.1+1.));
 float lx=along-(lc*${Ht.toFixed(1)}+(sH(lc*2.3+7.)-.5)*5.);
 float lip=exp(-lx*lx/.12)*ledgeOn;
 float tail=ledgeOn*smoothstep(-4.,-.2,lx)*(1.-smoothstep(-.2,.25,lx));
 #endif
 float inside=smoothstep(-.04,.06,dW);
 float depth=(.035+.2*smoothstep(0.,.6,dW))*(.8+.4*sV(vec2(along*.5,across*.8)+1.));

 // 법선: 흐름 방향 잔물결의 기울기를 세계 좌표 축으로 옮긴다.
 vec2 e=vec2(.05,0.);
 float h0=sRip(flowP,lite),hx=sRip(flowP+e.xy,lite),hy=sRip(flowP+e.yx,lite);
 vec2 sl=vec2(hx-h0,hy-h0)/.05*fade;
 #ifdef STREAM_POND
 sl*=.12;
 vec2 nxz=-sl*.55;
 #else
 sl*=(.2+.12*fxRain+.35*tail);
 vec2 dirW=sFrame.xy,sideW=sFrame.zw;
 // along이 늘어나는 쪽은 하류의 반대(-dir)다.
 vec2 nxz=-(sl.x*sideW-sl.y*dirW);
 #endif
 vec3 N=normalize(vec3(nxz.x,1.,nxz.y));
 float cosV=max(dot(N,V),0.);

 // 얕은 곳 바닥: 법선만큼 밀려 보이는(굴절) 자갈과 햇살 그물무늬.
 vec2 refr=sl*depth*1.4;
 #ifdef STREAM_POND
 vec2 pb=pw+refr;
 #else
 vec2 pb=vec2(across,along)+refr;
 #endif
 vec3 bed=sPebble(pb)*level*vec3(.9,.98,.95);
 float caustic=0.;
 if(lite<.5){float c1=sV(pb*6.+vec2(0.,fxTime*.7)),c2=sV(pb*8.2-vec2(fxTime*.5,0.)+5.);caustic=pow(1.-abs(c1-c2),7.)*fxSunVis*.55*(1.-smoothstep(.1,.3,depth));}
 float transmit=exp(-depth*4.4);
 vec3 body=vec3(.045,.1,.085)*(.35+.65*level);
 vec3 under=mix(body,bed+caustic*vec3(.9,1.,.8)*level,transmit);

 // 반사: 가까운 쪽은 숲(가을 잎·어두운 줄기), 위쪽 나뭇잎 틈은 하늘.
 vec3 R=reflect(-V,N);
 float fres=.025+.975*pow(1.-cosV,5.);
 vec3 skyC=fogColor;
 vec3 sky=mix(skyC,skyC*vec3(.72,.86,1.1),clamp(R.y*2.5,0.,1.));
 vec2 rp=R.xz/(abs(R.y)+.2)*3.5+sWorld.xz*.02;
 vec3 forest=mix(vec3(.03,.055,.022),vec3(.2,.125,.04),sV(rp));
 forest*=(.3+.9*level)*(.75+.5*fxSunVis);
 float gap=smoothstep(.3,.9,R.y+(sV(rp*1.7+4.)-.5)*.55);
 vec3 refl=mix(forest,sky*(.55+.45*level),gap);

 // 해 반짝임(숲 그늘에서는 잎 사이로 드문드문).
 float glint=pow(max(dot(R,fxSun),0.),240.)*fxSunVis*(.35+.65*sV(pb*9.+vec2(fxTime*1.6,0.)))*(1.-lite*.5)*fade;

 vec3 col=mix(under,refl,clamp(fres,0.,.78));
 col+=glint*vec3(1.1,.95,.7);

 // 거품: 바위 둘레(하류 쪽으로 길게), 턱 아래, 물가 가는 띠.
 float foam=0.;
 #ifndef STREAM_POND
 foam=max(foam,lip*.4*(.4+.6*sV(vec2(across*6.,3.))));
 foam=max(foam,tail*.4*sV(vec2(across*3.,q*.8)));
 #endif
 float edgeF=(1.-smoothstep(0.,.14,abs(dW)))*.38*step(0.,dW+.04);
 foam=max(foam,edgeF);
 float ft=sV(vec2(across*5.,q*2.2))*.6+sV(vec2(across*11.,q*4.7)+3.)*.4;
 float foamMask=smoothstep(.22,.55,foam*(.45+1.1*ft)-.06)*inside;
 vec3 foamC=vec3(.72,.77,.78)*(.2+.8*level)*(.9+.1*fxSunVis);
 col=mix(col,foamC,foamMask*.8);

 // 젖은 돌 둑: 물가 0.6m는 어두운 젖은 자갈에서 마른 지면으로 녹아든다.
 float bank=smoothstep(-.7,-.04,dW)*(1.-inside);
 vec3 wet=sPebble(vec2(across,along)*1.15+vec2(3.,1.))*.5*level;
 wet*=.7+.3*smoothstep(-.7,0.,dW);
 col=mix(wet,col,inside);
 float aWater=inside*mix(.62,.97,1.-transmit*.85);
 float a=max(bank*.88,aWater);a=max(a,foamMask*.8);
 diffuseColor=vec4(col,a*smoothstep(0.,.02,a));
}
`;function za({pond:e=!1,pondRadius:t=5}={}){const o=new pe({color:16777215,transparent:!0,depthWrite:!1,side:zt,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2});return o.userData.fxWater=!0,o.onBeforeCompile=a=>{Object.assign(a.uniforms,{fxTime:vt.fxTime,fxSunVis:vt.fxSunVis,fxLowSun:vt.fxLowSun,fxQuality:vt.fxQuality,fxRain:vt.fxRain,fxSun:vt.fxSun}),a.vertexShader=a.vertexShader.replace("#include <common>",`#include <common>
attribute vec2 aStream;attribute vec4 aFrame;varying vec2 sStream;varying vec4 sFrame;varying vec3 sWorld;`).replace("#include <begin_vertex>",`#include <begin_vertex>
sStream=aStream;sFrame=aFrame;sWorld=(modelMatrix*vec4(transformed,1.0)).xyz;`);const i=e?`#define STREAM_POND
#define SPAN ${t.toFixed(2)}
`:"",s="{float la=sStream.x*"+De.toFixed(2)+";diffuseColor=vec4(vec3(.13,.36,.5)*diffuseColor.rgb,step(abs(la),.75));}";a.fragmentShader=a.fragmentShader.replace("#include <common>",i+`#include <common>
`+rr).replace("#include <color_fragment>",`#include <color_fragment>
`+(Ao&&!e?s:lr))},o.customProgramCacheKey=()=>`stream-water-v3-${e?"pond":"stream"}-${t}-${Ao?"off":"on"}`,o}function cr(e,t,o){let a=1/0;for(let i=0;i<e.length;i+=2){const s=e[i],n=Math.hypot(s.x-t,s.z-o);n<a&&(a=n)}return a}function fr(){const e=new pe({color:16777215,transparent:!0,depthWrite:!1,side:zt});return e.onBeforeCompile=t=>{t.uniforms.fxTime=vt.fxTime,t.vertexShader=t.vertexShader.replace("#include <common>",`#include <common>
varying vec2 fUv;`).replace("#include <begin_vertex>",`#include <begin_vertex>
fUv=uv;`),t.fragmentShader=t.fragmentShader.replace("#include <common>",`#include <common>
varying vec2 fUv;uniform float fxTime;float fH(float n){return fract(sin(n*12.9898)*43758.5453);}`).replace("#include <color_fragment>",`#include <color_fragment>
{float lane=floor(fUv.x*9.);float r=fH(lane+3.);float flow=fract(fUv.y*1.4-fxTime*(1.5+r)+r*7.);
 float lane2=step(.35,fH(lane+11.));float a=(.12+.6*smoothstep(.2,.9,flow)*lane2)*(1.-smoothstep(.3,.5,abs(fUv.x-.5)))*(1.-.6*smoothstep(.5,1.,fUv.y))*smoothstep(0.,.1,fUv.y);
 diffuseColor=vec4(vec3(.42,.5,.52)*diffuseColor.rgb,a*.55);}`)},e.customProgramCacheKey=()=>"fall-water-v2",e}function ur(){const e=new At({color:16777215,vertexColors:!0,roughness:.96,metalness:0,emissive:2762789,flatShading:!0,polygonOffset:!0,polygonOffsetFactor:-1,polygonOffsetUnits:-1});return e.onBeforeCompile=t=>{t.vertexShader=t.vertexShader.replace("#include <common>",`#include <common>
varying vec3 bWorld;`).replace("#include <begin_vertex>",`#include <begin_vertex>
bWorld=(modelMatrix*vec4(transformed,1.0)).xyz;`),t.fragmentShader=t.fragmentShader.replace("#include <common>",`#include <common>
varying vec3 bWorld;`).replace("#include <color_fragment>",`#include <color_fragment>
{vec2 w=bWorld.xz;vec2 p=vec2(w.x*.94+w.y*.34,-w.x*.34+w.y*.94)/vec2(3.4,2.2);float row=floor(p.y);
 p.x+=row*.37+fract(sin(row*7.1)*43758.5)*.9;vec2 f=fract(p);vec2 id=vec2(floor(p.x),row);
 float d=min(min(f.x,1.-f.x)*3.4,min(f.y,1.-f.y)*2.2);float crack=1.-smoothstep(.02,.1,d);
 float h=fract(sin(dot(id,vec2(12.9898,78.233)))*43758.5453);float g=fract(sin(dot(floor(w*8.),vec2(41.3,17.7)))*9631.7);
 diffuseColor.rgb*=(.8+.34*h)*(1.-.6*crack)*(.95+.1*g);}`)},e.customProgramCacheKey=()=>"bed-rock-v2",e}const vn=[{id:1,metres:1070,shares:[["paved",70],["soil",30]]},{id:2,metres:1525,shares:[["soil",60],["rock",40]]},{id:3,metres:651,shares:[["soil",40],["rock",30],["stairs",30]]},{id:4,metres:1066,shares:[["soil",15],["rock",25],["deck_stairs",60]]},{id:5,metres:157,shares:[["deck_stairs",60],["rock",25],["soil",15]]},{id:6,metres:340,shares:[["stairs",40],["rock",30],["ridge",30]]},{id:7,metres:153,shares:[["ridge",60],["rock",40]]}],Ta=vn.reduce((e,t)=>e+t.metres,0),Re=[];let To=0;for(const e of vn)for(const[t,o]of e.shares){const a=To+e.metres*o/100;Re.push({section:e.id,material:t,start:To,end:a}),To=a}function xn(e){return Re.find(t=>e<t.end-1e-8)??Re.at(-1)}const dl=e=>e==="stairs"||e==="deck_stairs";function ml(e){const t=e.slice(1).map((l,c)=>Math.hypot(l.x-e[c].x,l.z-e[c].z)),o=t.reduce((l,c)=>l+c,0),a=Ta/o,i=[];let s=0,n=0;for(let l=0;l<t.length;l++){const c=e[l],u=e[l+1],f=t[l],h=Math.hypot(f,u.y-c.y),m=[0,...Re.map(d=>d.end/a-s).filter(d=>d>1e-7&&d<f-1e-7).map(d=>d/f)];for(const d of m){const g=(s+f*d)*a,p=xn(g);i.push({...c,x:c.x+(u.x-c.x)*d,y:c.y+(u.y-c.y)*d,z:c.z+(u.z-c.z)*d,elevationCorrection:(c.elevationCorrection??0)+((u.elevationCorrection??0)-(c.elevationCorrection??0))*d,width:(c.width??2.2)+((u.width??2.2)-(c.width??2.2))*d,s:n+h*d,referenceMetres:g,material:p.material,section:p.section})}s+=f,n+=h}const r=Re.at(-1);return i.push({...e.at(-1),s:n,referenceMetres:Ta,material:r.material,section:r.section}),i}const dr=!1,mr=!1,hr=!1,pr="gwanak-hiking:ambient-volume:v1",yn={stream:"stream-loop.flac",forest:"wind-forest-loop.flac",ridge:"wind-ridge-loop.flac",birds:"birds-loop.flac",crowd:"summit-crowd-loop.flac",city:"city-far-loop.flac"},gr={stream:-26,forest:-30,ridge:-24,birds:-34,crowd:-34,city:-36},$o={stream:[null,-50,-38,-42,null,null,null,null],forest:[null,-50,-48,-46,-42,-42,-46,null],ridge:[null,null,null,null,null,null,-39,-33],birds:[null,-52,-52,-54,-56,-56,null,null],city:[null,-52,-60,null,null,null,null,null],crowd:[null,null,null,null,null,null,-48,-44]},Ho={low:-37,high:-32},Ye=[[0,60],[800,30],[1070,15],[1500,8],[2e3,5],[2595,8],[2800,20],[3e3,45],[3246,90]],wn=-58,bn={hMin:100,hMax:560,dbMin:-50,dbMax:-42},Me={h0:580,h1:640,exposure:{6:.6,7:1},dbBase:-48,dbRange:15,lowpassHz:[1200,3500],gustDb:2.5},vr={birds:{on:[8,14],off:[12,30],upperOn:[6,10],upperOff:[20,45],fade:1.5},crow:{low:[20,70],high:[40,140],peakDb:-30},moktak:{count:[8,12],interval:[.9,1.1],rest:[40,90],start:4800,radius:60,origin:4860}},xr={jump:1.5,city:12,forest:6,upper:8,summit:6},yr={db:-2,attackS:.01,releaseS:.25,minSumDb:-34},It=(e,t=0,o=1)=>Math.max(t,Math.min(o,e)),io=e=>e===null||e===-1/0?0:10**(e/20),wr=e=>{let t=0;for(const o of e)o&&(t+=o.length*o.numberOfChannels*4);return Math.round(t/1048576*10)/10},Io=e=>{const t=e.reduce((o,a)=>o+io(a)**2,0);return t?10*Math.log10(t):-1/0},Sn=e=>xn(e).section;function Oo(e){for(let t=1;t<Ye.length;t++){const[o,a]=Ye[t],[i,s]=Ye[t-1];if(e<=o)return s+(a-s)*It((e-i)/(o-i))}return 90}const ro={distance:null},Mn=e=>{ro.distance=Number.isFinite(e)?e:null},kn=e=>{const t=-38-20*Math.log10(Math.max(e,5)/5);return t<wn?null:t},Et={wind:null,rain:0,listeners:new Set};function br({wind:e=Et.wind,rain:t=Et.rain}={}){Et.wind=e===null?null:It(e),Et.rain=It(t);for(const o of Et.listeners)o(Et)}const zn=e=>e===null?0:It(14*(e-.2),-4,10);function Sr(e,t,{birds:o=!0,gust:a=0}={}){const i=Sn(e),s=It((t-Me.h0)/(Me.h1-Me.h0)),n=s*s*(3-2*s)*(Me.exposure[i]||0),r=ro.distance===null?Oo(e):Math.min(ro.distance,Oo(e)*2.5),l=bn.dbMin+8*It((t-100)/460),c=zn(Et.wind),u=Et.rain,f=o&&u<.6?$o.birds[i]:null,h={stream:i<=3?kn(r):null,forest:i<7&&n<1?l+20*Math.log10(1-n)+c:null,ridge:n>0?-48+15*n+a+c:null,birds:f===null?null:f-14*u,city:$o.city[i],crowd:i===7?-44:i===6&&e>=4609?-54+6*It((e-4609)/200):null},m=(i<=5?Ho.low:Ho.high)+Math.max(0,c)*.6,d=Io(Object.values(h)),g=Math.min(0,m-d);for(const p in h)h[p]!==null&&(h[p]+=g);return{section:i,targets:h,distance:r,exposure:n,budgetDb:m,correction:g,sumRmsDb:Io(Object.values(h))}}function Mr(e,t,o){o=It(o);const a=o===0?1:o===1?0:Math.cos(o*Math.PI/2)**2,i=1-a;return Object.fromEntries(Object.keys(yn).map(s=>[s,Math.sqrt(io(e[s])**2*a+io(t[s])**2*i)]))}const hl=Object.freeze(Object.defineProperty({__proto__:null,BUDGET_DB:Ho,CICADA_ENABLED:hr,CITY_SUMMIT_ENABLED:mr,CROSSFADE_S:xr,DUCK:yr,FILE_RMS_DB:gr,INTERMITTENT:vr,LAYER_FILES:yn,SECTION_TARGET_DB:$o,STREAM_CUTOFF_DB:wn,STREAM_DISTANCE_M:Ye,STREAM_NEAR:ro,VERIFIED:dr,VOLUME_SAVE_KEY:pr,WEATHER_SOUND:Et,WIND_FOREST:bn,WIND_RIDGE:Me,ambientSectionAt:Sn,ambientTargets:Sr,audioBufferMB:wr,clamp:It,crossfade:Mr,dbGain:io,powerDb:Io,setStreamDistance:Mn,setWeatherSound:br,streamDb:kn,streamDistance:Oo,windShiftDb:zn},Symbol.toStringTag,{value:"Module"})),Tn=[{id:"lake",metres:740,side:-12,kind:"호수공원·자하정",source:"실경-구간별-참고사진.md §2"},{id:"junction",metres:1070,side:4.8,kind:"제1광장 갈림·쉼터",source:"실경-구간별-참고사진.md §4"},{id:"stairs-rest",metres:4312,side:3,kind:"깔딱고개 중간 벤치",source:"실경-구간별-참고사진.md §5"},{id:"yeonjuam",metres:4540,side:15,kind:"연주암 사찰 표현",source:"실경-구간별-참고사진.md §6"}];function Jt(e,t,o=0){const a=e.findIndex(f=>(f.referenceMetres??f.s)>=t),i=a<0?e.length-1:Math.max(1,a),s=e[i-1],n=e[i],r=Nt.clamp((t-(s.referenceMetres??s.s))/((n.referenceMetres??n.s)-(s.referenceMetres??s.s)||1),0,1),l=n.x-s.x,c=n.z-s.z,u=Math.hypot(l,c)||1;return{x:Nt.lerp(s.x,n.x,r)-c/u*o,z:Nt.lerp(s.z,n.z,r)+l/u*o,yaw:Math.atan2(-l,-c)}}const _n=e=>-6.2+1.9*Math.sin(e/4.1+.7)+.8*Math.sin(e/9.3+2.1),Cn=2;function _o(e,t,o,a){const i=new _e(e,t,o),s=i.attributes.position,n=(r,l)=>{const c=Math.sin(a*13.7+r*7.9+l*3.3)*43758.5453;return c-Math.floor(c)-.5};for(let r=0;r<s.count;r++){const l=s.getY(r)>0,c=l?.55:1;s.setXYZ(r,s.getX(r)*c+n(r,1)*e*.1,s.getY(r)+(l?n(r,2)*t*.5:0),s.getZ(r)*c+n(r,3)*o*.1)}return i.rotateY(a*1.9),i.computeVertexNormals(),i}he.set("slab",new At({color:6710623,emissive:3815733,roughness:.96,flatShading:!0}));he.set("slabDark",new At({color:5592143,emissive:3289389,roughness:.96,flatShading:!0}));function $e(e,t=0,o=0){e.box("wood",t,.48,o,1.8,.13,.5),e.box("wood",t,.9,o-.23,1.8,.55,.08);for(const a of[-1,1])e.box("stone",t+a*.64,.23,o,.15,.46,.4)}function _a(e,t){const o=mo();if(e==="lake"){o.add(new Ut(2.4,2.6,.3,8),"stone",0,.15,0);for(let s=0;s<6;s++){const n=s*Math.PI/3;o.beam("red",[Math.cos(n)*1.8,.3,Math.sin(n)*1.8],[Math.cos(n)*1.8,2.8,Math.sin(n)*1.8],.1)}o.box("green",0,2.75,0,4,.22,3.8),Sa(o,2.8,5.2,4.9,t),$e(o,0,0)}else if(e==="junction")$e(o,1.6,1.7),$e(o,-1.2,1.7),o.beam("wood",[0,0,0],[0,2.8,0],.09),o.box("wood",0,2.5,0,2.6,.4,.1),o.box("wood",0,2,0,2.1,.35,.1);else if(e==="stairs-rest")$e(o);else if(e==="yeonjuam"){o.box("stone",0,.35,0,7,.7,5),o.box("cream",0,1.9,0,6.2,2.4,4.2);for(const s of[-2.9,-1.45,0,1.45,2.9])o.box("red",s,1.9,2.13,.13,2.5,.13),s<2.9&&o.box("wood",s+.7,1.8,2.16,1.05,1.8,.03);o.box("green",0,3.2,0,6.8,.3,4.5),Sa(o,3.35,8.2,6,t)}const a=o.finish(),i=e==="junction"?"← 호수공원 · 삼성산 →":e==="lake"?"자하정":e==="yeonjuam"?"연주암":null;if(i){const s=fn(i,e==="junction"?2.5:1.6,e==="junction"?.32:.42,{background:"#484637",color:"#fff2cf"});s&&(s.position.set(0,e==="junction"?2.5:e==="lake"?2.72:3.1,e==="junction"?.061:e==="lake"?1.92:2.3),a.add(s))}return a}function pl(e,t){return[...Tn.map(o=>{const a=Jt(e,o.metres,o.side);return{...o,...a,y:t(a.x,a.z),supportRadius:o.id==="lake"?2.7:o.id==="yeonjuam"?4.5:2.5}}),{...Jt(e,740,-19),id:"lake-water",supportRadius:5.5}].map(o=>({...o,y:o.y??t(o.x,o.z)}))}function gl(e,t,o=1){return e.filter(a=>t.every(i=>Math.hypot(a.x-i.x,a.z-i.z)>i.supportRadius+o))}function vl(e,t){const o=new Dt,a=[];o.name="구간별 참고 특징 보정",o.userData.metricKind="구간별 시설";for(const f of Tn){const h=Jt(e,f.metres,f.side),m=new Fo;m.autoUpdate=!1,m.position.set(h.x,t(h.x,h.z)+.03,h.z),m.rotation.y=h.yaw,m.userData={...f,status:"위치·치수 추정"},m.addLevel(_a(f.id,!1),0,.1),m.addLevel(_a(f.id,!0),40,.1),m.addLevel(new Dt,120,.1),o.add(m),a.push(m)}const i=za(),s=ur(),n=fr(),r=[];let l=0;for(let f=800;f<2560;f+=80){const h=[],m=mo();for(let w=f;w<=Math.min(f+80,2595);w+=Cn)h.push(Jt(e,w,_n(w)));const d=or(h,t,l,1,Xt);r.push(...d.samples);for(let w=0;w<d.samples.length;w+=4){const M=d.samples[w];if(Xt(M.along)>0)continue;const D=Math.round(M.along*3.1);for(const B of[-1,1]){const A=_=>{const W=Math.sin(D*12.9+B*78.2+_*4.1)*43758.5453;return W-Math.floor(W)};if(A(0)<.3)continue;const S=B*(Te*(.95+.3*A(1))),T=M.x+M.side[0]*S,b=M.z+M.side[1]*S,F=1.3+1.5*A(2),z=.18+.2*A(3),C=1.2+1.2*A(4);if(m.add(_o(F,z,C,D+B*3+A(5)),A(6)<.3?"slabDark":"slab",T,t(T,b)+z*.2,b),A(7)<.3){const _=.6+.5*A(8);m.add(_o(_*1.8,_*.4,_*1.3,D*1.3+B),"slab",T+(A(9)-.5),t(T,b)+z+_*.1,b+(A(10)-.5))}}}for(let w=Math.floor(l/Fe);w<=Math.floor(d.alongEnd/Fe);w++){const M=dn(w);if(!M||M.along<l||M.along>=d.alongEnd||Xt(M.along)>0)continue;const k=d.samples.reduce((A,S)=>Math.abs(S.along-M.along)<Math.abs(A.along-M.along)?S:A),D=k.x+k.side[0]*M.across,B=k.z+k.side[1]*M.across;m.add(_o(M.radius*3.4,M.radius*.7,M.radius*2.6,w),"slabDark",D,t(D,B)+M.radius*.1,B)}l=d.alongEnd;const g=m.finish(),p=new _t(ar(d.samples,t,Xt),s),y=new _t(d.geometry,i);p.name="계곡 암반",p.receiveShadow=!0,y.renderOrder=2,y.name="계곡 물",g.add(p,y);const v=sr(d.samples,t);if(v){const w=new _t(v,n);w.renderOrder=3,w.name="계곡 낙수",g.add(w)}g.userData.stream=!0,g.userData.centre=h[Math.floor(h.length/2)],o.add(g)}const c=Jt(e,740,-19),u=new _t(ir(c.x,c.z,5,t),za({pond:!0,pondRadius:5}));return u.renderOrder=2,u.name="호수 수면",o.add(u),o.updateMatrixWorld(!0),{group:o,items:a,update(f){for(const m of a){const d=f.position.distanceTo(m.position);m.levels.forEach((g,p)=>{g.object.visible=p===(d<40?0:d<120?1:2)})}for(const m of o.children)if(m.userData.stream){const d=m.userData.centre;m.visible=Math.hypot(f.position.x-d.x,f.position.z-d.z)<150}u.visible=Math.hypot(f.position.x-c.x,f.position.z-c.z)<150;const h=cr(r,f.position.x,f.position.z);Mn(h<90?Math.max(h,2):null)}}}const Se=Object.freeze({from:800,to:2560,step:Cn,halfWidth:Te}),He=Object.freeze({metres:740,side:-19,radius:5}),re=16;function kr(e,t,o,a){const i=a.x-o.x,s=a.z-o.z,n=i*i+s*s,r=n?Math.max(0,Math.min(1,((e-o.x)*i+(t-o.z)*s)/n)):0;return Math.hypot(e-(o.x+i*r),t-(o.z+s*r))}function Dn(e){const t=[];for(let r=Se.from;r<=Se.to;r+=Se.step)t.push(Jt(e,r,_n(r)));const o=Jt(e,He.metres,He.side),a=new Map,i=(r,l)=>(r+1048576)*2097152+(l+1048576);for(let r=1;r<t.length;r++){const l=t[r-1],c=t[r];for(let u=Math.floor(Math.min(l.x,c.x)/re)-1;u<=Math.floor(Math.max(l.x,c.x)/re)+1;u++)for(let f=Math.floor(Math.min(l.z,c.z)/re)-1;f<=Math.floor(Math.max(l.z,c.z)/re)+1;f++){const h=i(u,f);a.has(h)||a.set(h,[]),a.get(h).push(r)}}function s(r,l){const c=a.get(i(Math.floor(r/re),Math.floor(l/re)));if(!c)return 1/0;let u=1/0;for(const f of c)u=Math.min(u,kr(r,l,t[f-1],t[f]));return u}const n=(r,l)=>Math.hypot(r-o.x,l-o.z);return{line:t,pond:o,streamDistance:s,pondDistance:n,inStream:(r,l,c=0)=>s(r,l)<Se.halfWidth+c,inPond:(r,l,c=0)=>n(r,l)<He.radius+c,blocked(r,l,c=0){return s(r,l)<Se.halfWidth+c||n(r,l)<He.radius+c}}}function zr(e,t){return Math.max(e.min.x-t.x,0,t.x-e.max.x)**2+Math.max(e.min.y-t.y,0,t.y-e.max.y)**2+Math.max(e.min.z-t.z,0,t.z-e.max.z)**2}function xl(e){e.updateWorldMatrix(!0,!0);const t=new Oa;return e.traverse(o=>{o.geometry&&(o.isInstancedMesh?(o.computeBoundingBox(),t.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld))):(o.geometry.computeBoundingBox(),t.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld))))}),t}function Tr(){const e=new ls,t=new Ia;function o(a,i=63){if(a.isEmpty())return-1;let s=0;for(let n=0;n<6;n++){const r=1<<n;if(!(i&r))continue;const l=e.planes[n],c=l.normal,u=c.x>0?a.min.x:a.max.x,f=c.x>0?a.max.x:a.min.x,h=c.y>0?a.min.y:a.max.y,m=c.y>0?a.max.y:a.min.y,d=c.z>0?a.min.z:a.max.z,g=c.z>0?a.max.z:a.min.z;if(c.x*f+c.y*m+c.z*g+l.constant<0)return-1;c.x*u+c.y*h+c.z*d+l.constant<0&&(s|=r)}return s}return{update(a){a.updateMatrixWorld(),e.setFromProjectionMatrix(t.multiplyMatrices(a.projectionMatrix,a.matrixWorldInverse))},inFrustum(a){return!a.isEmpty()&&e.intersectsBox(a)},planeMask:o,visible(a,i,s=1/0,n=63){return!a.isEmpty()&&zr(a,i.position)<=s*s&&(n===63?e.intersectsBox(a):o(a,n)>=0)}}}const Ie=new WeakMap;function _r(){}function Ca(e){return e.traverse(t=>{Ie.has(t)&&(t.updateMatrixWorld=Ie.get(t)),t.matrixWorldAutoUpdate=!0,t.updateMatrix(),t.matrixAutoUpdate=!1}),e.updateWorldMatrix(!0,!1),e.updateMatrixWorld(!0),e.traverse(t=>{t.matrixWorldAutoUpdate=!1,t.matrixWorldNeedsUpdate=!1}),Ie.has(e)||Ie.set(e,e.updateMatrixWorld),e.updateMatrixWorld=_r,e}function Cr(e,{kind:t,nearDetail:o,representation:a,index:i},s){if(a==="crossboard")return 120;if(a==="impostor")return 400;if(i===0)return 0;const n=t==="rock"?[[6,16],[12,32],[24,64]][s]:o||t==="understory"?[[3,10],[5,16],[8,32]][s]:[[4,12],[6,20],[10,40]][s];return Math.min(e,n[Math.min(i-1,1)])}function yl(e,t){for(const[o,a]of e.levels.entries()){const i=a.object.userData.lodSource;a.distance=Cr(i.distance,{...i,index:o},t),a.object.traverse(s=>{s.isMesh&&(s.castShadow=!1)})}}const $t={ridgeStart:430,ridgeFull:520,summitStart:600,summitFull:625,targets:{valley:{broadleaf:.8},mid:{broadleaf:.75},ridge:{broadleaf:.25},summit:{broadleaf:.1}}},Dr=e=>Math.max(0,Math.min(1,e)),ho=(e,t,o)=>{const a=Dr((o-e)/(t-e));return a*a*(3-2*a)},Vt=(e,t,o)=>e+(t-e)*o;function ta(e){return Number.isFinite(e)?ho($t.ridgeStart,$t.ridgeFull,e):0}function ea(e){return Number.isFinite(e)?ho($t.summitStart,$t.summitFull,e):0}function Fr(e){return Vt(Vt(1,.3,ta(e)),.12,ea(e))}function Da(e){return Vt(Vt(1,.25,ta(e)),.12,ea(e))}function Fa(e){return Number.isFinite(e)?Vt(1,.184,ho(585,595,e)):1}function Aa(e){if(!Number.isFinite(e))return $t.targets.mid.broadleaf;const t=Vt($t.targets.valley.broadleaf,$t.targets.mid.broadleaf,ho(150,300,e));return Vt(Vt(t,$t.targets.ridge.broadleaf,ta(e)),$t.targets.summit.broadleaf,ea(e))}function wl(e){let t=20261103;const o=()=>(t=Math.imul(t,1664525)+1013904223>>>0)/4294967296,a=new Map,i=[];function s(r,l,c){const u=`${r}:${Math.floor(c.x/64)}:${Math.floor(c.z/64)}`;a.has(u)||a.set(u,{id:r,kind:l,nearDetail:!0,levels:r==="rock_09"?[{url:"rock_09-lod2.glb",distance:0}]:[0,1,2].map(f=>({url:`${r}-lod${f}.glb`,distance:[0,48,110][f]})),placements:[]}),a.get(u).placements.push(c)}let n=0;for(let r=0;r<e.length-1;r++){const l=e[r],c=e[r+1],u=Math.hypot(c.x-l.x,c.z-l.z)||1;for(;n<=c.s;){const f=Math.max(0,Math.min(1,(n-l.s)/(c.s-l.s||1))),h=bt(l.x,c.x,f),m=bt(l.z,c.z,f),d=bt(l.y,c.y,f),g=bt(l.width,c.width,f);for(const p of[-1,1]){const y=g/2+.18+o()*.85,v=h-(c.z-l.z)/u*y*p,w=m+(c.x-l.x)/u*y*p,M=ko(e,v,w);if(M.distance>M.width/2+.08){s("rock_09","rock",{x:v,z:w,scale:1.2+o()*4.5,yaw:o()*Math.PI*2,embed:.006});for(let k=0;k<3;k++){const D=g/2+.3+k*1.8+o()*1.5,B=h-(c.z-l.z)/u*D*p,A=m+(c.x-l.x)/u*D*p,S=ko(e,B,A);if(S.distance<=S.width/2+.15)continue;const T=o(),b=T<.48?"litter":T<.9?"grass":"shrub";if(d>600&&b==="shrub")continue;const F=.65+o()*.7,z=o()*Math.PI*2;(Eo.includes(e[S.index]?.material)||Eo.includes(e[S.index+1]?.material))&&S.distance<S.width/2+(b==="litter"?.36:.2)*F||i.push({x:B,z:A,kind:b,scale:F,yaw:z})}}if(d>430&&n%12<2){const k=g/2+2.5+o()*6,D=h-(c.z-l.z)/u*k*p,B=m+(c.x-l.x)/u*k*p,A=ko(e,D,B);A.distance>A.width/2+1.5&&s(d<600&&o()<.25?"pine_tree_01":"pine_sapling_medium","tree",{x:D,z:B,scale:d<600?.36+o()*.28:.22+o()*.12,yaw:o()*Math.PI*2,embed:.035})}}n+=2}}return{entries:[...a.values()],grass:i}}function bl(e,t){const o=new Dt;o.name="길가 하층 식생 · 임시 표현";const a=new Map;for(const n of e){const r=`${n.kind??"grass"}:${Math.floor(n.x/64)},${Math.floor(n.z/64)}`;a.has(r)||a.set(r,[]),a.get(r).push(n)}const i=new Map;for(const[n,r]of[["grass",5858114],["litter",7888964],["shrub",4938041]]){const l=[];for(let f=0;f<(n==="shrub"?8:5);f++){const h=f*2.399,m=Math.cos(h)*.17,d=Math.sin(h)*.17;if(n==="litter")l.push(m-.09,.025,d,m+.09,.025,d,m,.04,d+.19);else{const g=n==="shrub"?.45+f*.025:.18+f*.018;l.push(m-.035,0,d,m+.035,0,d,m+.08,g,d+.025)}}const c=new xt;c.setAttribute("position",new at(l,3)),n!=="litter"&&c.scale(.65,n==="shrub"?.45:.65,.65),c.computeVertexNormals();const u=new At({color:r,roughness:1,side:zt});n!=="litter"&&(u.onBeforeCompile=f=>{f.uniforms.foliageTime=te.foliageTime,f.vertexShader=f.vertexShader.replace("#include <common>",`#include <common>
uniform float foliageTime;`).replace("#include <begin_vertex>",`#include <begin_vertex>
     #ifdef USE_INSTANCING
     vec3 roadsideAnchor=instanceMatrix[3].xyz;float roadsideTip=position.y*position.y*${n==="shrub"?"4.":"9."};
     transformed.x+=sin(foliageTime*1.5+roadsideAnchor.x*.08+roadsideAnchor.z*.06)*roadsideTip*.35;
     transformed.z+=sin(foliageTime*1.1+roadsideAnchor.z*.07)*roadsideTip*.2;
     #endif`)},u.customProgramCacheKey=()=>`roadside-${n}-wind-v1`),i.set(n,{geometry:c,material:u})}const s=new jo;for(const n of a.values()){const{geometry:r,material:l}=i.get(n[0].kind??"grass"),c=new to(r,l,n.length);n.forEach((u,f)=>{s.position.set(u.x,t(u.x,u.z)-.025,u.z),s.rotation.y=u.yaw,s.scale.setScalar(u.scale),s.updateMatrix(),c.setMatrixAt(f,s.matrix)}),c.userData.fullCount=n.length,c.userData.metricKind="하층 식생",c.computeBoundingBox(),c.computeBoundingSphere(),c.receiveShadow=!0,o.add(c)}return o}const lo={near:[10,16,24],far:[28,45,65],floor:.2,step:.05};function Fn(e,t,o,a=lo.floor){const i=Math.max(0,Math.min(1,(e-t)/(o-t))),s=Math.round(1/lo.step);return Math.round((1-(1-a)*i)*s)/s}function Sl(e,t,o){const a=lo.far[o],i=lo.near[o];e.visible=t<a;const s=[.25,.5,1][o]*Fn(t,i,a);e.count=Math.ceil(e.userData.fullCount*s)}const Ra=[8,12,16];function Go(e,t,o){const a=Math.floor(t/2)*2,i=Math.floor(o/2)*2,s=(t-a)/2,n=(o-i)/2,r=e(a,i),l=e(a+2,i),c=e(a,i+2),u=e(a+2,i+2);return s+n<=1?r+(l-r)*s+(c-r)*n:u+(c-u)*(1-s)+(l-u)*(1-n)}function Ml(e){const t=Zo(e.route),o=new Dt;o.name="숲 층위 · 바람 풀";const a=new Map,i=new Map,s=new Map,n=new Map;let r=61103;const l=()=>(r=Math.imul(r,1664525)+1013904223>>>0)/4294967296,c=e.route,u=Math.min(...c.map(L=>L.x))-30,f=Math.max(...c.map(L=>L.x))+30,h=Math.min(...c.map(L=>L.z))-30,m=Math.max(...c.map(L=>L.z))+30,d=(L,G,$)=>{L.has(G)||L.set(G,[]),L.get(G).push($)},g=new Map,p=(L,G)=>{const $=(L+65536)*131072+(G+65536);let V=g.get($);return V===void 0&&(V=e.floorHeight(L,G),g.set($,V)),V},y=L=>`${Math.floor(L.gridX/12)},${Math.floor(L.gridZ/12)}`,v=[...e.status.sectionScenery?.sites??[],...e.status.interactionProps?.clearSites??[],...e.status.trailProps?.clearSites??[]],w=Dn(c),M=un(c,{nearest:t,sites:v,water:w}),k=.35,D=L=>.8*L,B=[];let A=0;const S=Nr(e,c),T=S.stats;for(let L=h;L<m;L+=2)for(let G=u;G<f;G+=2){const $=G+l()*1.9,V=L+l()*1.9,q=t($,V);if(q.distance>30||q.distance<q.width/2+.65)continue;const tt=er(c,$,V);if(Math.abs(tt.x)<11.4&&tt.z>-12.4&&tt.z<34.4){B.push({px:$,pz:V,x:G,z:L,h:q});continue}if(v.some(ft=>Math.hypot($-ft.x,V-ft.z)<ft.supportRadius+1.4))continue;const Z=e.floorHeight($,V),rt={x:$,z:V,y:Z,gridX:G,gridZ:L,distance:q.distance,yaw:l()*6.283,scale:.65+l()*.8};if(l()<.98*Fa(Z)&&d(a,y(rt),rt),q.distance>q.width/2+1.4&&l()<.55*Da(Z)){const ft=`${Math.floor($/24)},${Math.floor(V/24)}`;n.has(ft)||n.set(ft,[]);const kt=Math.min(1,(q.distance-q.width/2-1.4)/4),gt={x:$+l()*.6-.3,z:V+l()*.6-.3,yaw:l()*6.283,scale:(.8+l()*.95)*(.55+.45*kt),roll:l()};w.blocked(gt.x,gt.z,D(gt.scale))?A++:!M.blocked(gt.x,gt.z,D(gt.scale))&&S.fit(gt)&&n.get(ft).push(gt)}const mt=l(),dt=Fr(Z);if(q.distance>q.width/2+4.5&&q.distance<30&&mt<.2*dt&&Z<605){const ft=l()<Aa(Z),kt=l(),gt=ft?kt<.55?"tree_small_02":"island_tree_01":kt<.75?"pine_tree_01":"pine_sapling_medium",we=mt>=.13*dt,po=`${gt}:${Math.floor($/96)},${Math.floor(V/96)}`;i.has(po)||i.set(po,{id:gt,kind:"tree",forestTint:11978901,placements:[],levels:[{url:`${gt}-lod1.glb`,distance:0},{url:`${gt}-lod2.glb`,distance:14}]}),i.get(po).placements.push({x:$,z:V,scale:.65+l()*.3,yaw:rt.yaw,embed:.03,...we?{dense:!0}:{}})}if(Z>470&&q.distance>q.width/2+7&&l()<.018){const ft="rock_face_02",kt=`${Math.floor($/48)},${Math.floor(V/48)}`;s.has(kt)||s.set(kt,{id:ft,kind:"rock",levels:[{url:`${ft}-lod2.glb`,distance:0}],placements:[]}),s.get(kt).placements.push({x:$,z:V,scale:Z>590?1+l()*.6:.5+l()*.45,stretch:Z>590?[1.1,2.2+l()*1.2,1.1]:void 0,yaw:rt.yaw,embed:.3})}}{let L=20261104;const G=()=>(L=Math.imul(L,1664525)+1013904223>>>0)/4294967296;for(const{px:$,pz:V,x:q,z:tt,h:Z}of B){const rt=e.floorHeight($,V),mt=G()<.98*Fa(rt),dt=G()*6.283,ft=.65+G()*.8;if(mt&&!M.entrance($,V,-1)&&d(a,`entrance:${y({gridX:q,gridZ:tt})}`,{x:$,z:V,y:rt,gridX:q,gridZ:tt,distance:Z.distance,yaw:dt,scale:ft}),Z.distance>Z.width/2+1.4&&G()<.55*Da(rt)){const kt=Math.min(1,(Z.distance-Z.width/2-1.4)/4),gt={x:$+G()*.6-.3,z:V+G()*.6-.3,yaw:G()*6.283,scale:(.8+G()*.95)*(.55+.45*kt),roll:G()};if(!M.blocked(gt.x,gt.z,D(gt.scale))){const we=`entrance:${Math.floor($/24)},${Math.floor(V/24)}`;n.has(we)||n.set(we,[]),n.get(we).push(gt)}}}}const b=c.at(-1),F=e.status.summitFacilities?.sites??[];for(let L=0;L<Math.PI*2;L+=Math.PI/10){const G=24+l()*14,$=b.x+Math.sin(L)*G,V=b.z+Math.cos(L)*G,q=t($,V),tt=e.floorHeight($,V);if(q.distance<q.width/2+13||tt<b.y-32||F.some(rt=>Math.hypot($-rt.x,V-rt.z)<rt.supportRadius+18))continue;const Z=`summit:${Math.floor($/48)},${Math.floor(V/48)}`;s.has(Z)||s.set(Z,{id:"rock_face_01",kind:"rock",levels:[{url:"rock_face_01-lod2.glb",distance:0}],placements:[]}),s.get(Z).placements.push({x:$,z:V,scale:1,stretch:[2.2,2+l()*.7,2.2],yaw:L,embed:.35})}for(const[L,G]of[[4,-12],[14,-22],[-2,-24]]){const $=b.x+L,V=b.z+G,q=t($,V);if(q.distance<q.width/2+9||F.some(Z=>Math.hypot($-Z.x,V-Z.z)<Z.supportRadius+12))continue;const tt=`summit-front:${Math.floor($/48)},${Math.floor(V/48)}`;s.has(tt)||s.set(tt,{id:"rock_face_01",kind:"rock",levels:[{url:"rock_face_01-lod2.glb",distance:0}],placements:[]}),s.get(tt).placements.push({x:$,z:V,scale:1,stretch:[1.7,2.2,1.7],yaw:.3,embed:.2})}for(let L=h-150;L<m+150;L+=10)for(let G=u-150;G<f+150;G+=10){const $=G+l()*5,V=L+l()*5,q=t($,V);if(q.distance<30||q.distance>180)continue;let tt;try{tt=e.floorHeight($,V)}catch{continue}if(!Number.isFinite(tt)||tt>590)continue;const Z=l()<Aa(tt)?"tree_small_02":"pine_tree_01",rt=`far:${Z}:${Math.floor($/96)},${Math.floor(V/96)}`;i.has(rt)||i.set(rt,{id:Z,kind:"tree",forestTint:11978901,levels:[{url:`${Z}-lod2.glb`,distance:0}],placements:[]}),i.get(rt).placements.push({x:$,z:V,scale:1+l()*.35,yaw:l()*6.283})}const z=[],C=9;for(let L=0;L<C;L++){const G=L*2.399,$=.12+L%4*.025,V=Math.cos(G),q=Math.sin(G),tt=.25+L%3*.12+L%5*.015,Z=.029,rt=V*$,mt=q*$,dt=rt+V*.07,ft=mt+q*.07;z.push(rt-q*Z,0,mt+V*Z,rt+q*Z,0,mt-V*Z,dt-q*Z*.6,tt*.55,ft+V*Z*.6,rt+q*Z,0,mt-V*Z,dt+q*Z*.6,tt*.55,ft-V*Z*.6,dt-q*Z*.6,tt*.55,ft+V*Z*.6,dt-q*Z*.6,tt*.55,ft+V*Z*.6,dt+q*Z*.6,tt*.55,ft-V*Z*.6,rt+V*.2,tt,mt+q*.2)}for(let L=0;L<3;L++){const G=L*2.399,$=Math.cos(G),V=Math.sin(G);for(let q=1;q<=2;q++)for(const tt of[-1,1]){const Z=q*.1,rt=.12+q*.055,mt=$*Z,dt=V*Z,ft=mt+$*.07-V*.12*tt,kt=dt+V*.07+$*.12*tt;z.push(mt,rt,dt,ft,rt+.025,kt,mt+$*.1,rt+.025,dt+V*.1)}}const _=new xt;_.setAttribute("position",new at(z,3)),_.setAttribute("forestLeaf",new at(Array.from({length:z.length/3},(L,G)=>G>=C*9?1:0),1)),_.scale(.55,.42,.55),_.computeVertexNormals();const W=_.attributes.normal,H=new P;for(let L=0;L<W.count;L++)H.fromBufferAttribute(W,L).multiplyScalar(.25),H.y+=.75,H.normalize(),W.setXYZ(L,H.x,H.y,H.z);const R={value:0},O=new At({color:16777215,roughness:1,envMapIntensity:.35,side:zt});O.onBeforeCompile=L=>{L.uniforms.forestTime=R,L.vertexShader=L.vertexShader.replace("#include <common>",`#include <common>
uniform float forestTime;
attribute float forestLeaf;
varying float grassHeight;`),L.vertexShader=L.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
   vec4 anchor=instanceMatrix*vec4(0.,0.,0.,1.);
   float tip=position.y*position.y;
   grassHeight=clamp(position.y/.227,0.,1.);
   transformed.x+=sin(forestTime*1.5+anchor.x*.08+anchor.z*.06)*tip*.85;
   transformed.z+=sin(forestTime*1.1+anchor.z*.07)*tip*.45;
   // 포기 수를 늘리지 않고 낮은 관목형 잎을 군락으로 섞는다.
   float understoryPatch=.5+.25*sin(anchor.x*.31)+.25*sin(anchor.z*.27);
   float fern=step(.78-understoryPatch*.35,fract(sin(anchor.x*12.9898+anchor.z*78.233)*43758.5453));
   transformed*=mix(1.,fern,forestLeaf);`),L.fragmentShader=L.fragmentShader.replace("#include <common>",`#include <common>
varying float grassHeight;`).replace("#include <color_fragment>",`#include <color_fragment>
diffuseColor.rgb*=mix(.62,1.12,grassHeight);`)},O.customProgramCacheKey=()=>"forest-blades-wind-v3-understory";const I=new jo,K=new nt,U=[];let X=0,x=0;for(const L of a.values()){const G=q=>Math.ceil(q*sa.forestGrass),$=new to(_,O,L.reduce((q,tt)=>q+G(tt.distance<=14?49:21),0));let V=0;for(let q=0;q<49;q++)for(const tt of L){const Z=tt.distance<=14?7:3,rt=7*Z;if(q>=G(rt))continue;const mt=q*(rt===49?17:8)%rt,dt=tt.gridX+(mt%7+.15+l()*.7)*2/7,ft=tt.gridZ+(Math.floor(mt/7)+.15+l()*.7)*2/Z,kt=t(dt,ft);if(kt.distance<kt.width/2+.25)continue;if(w.blocked(dt,ft,k)){l(),l(),l(),x++;continue}if(M.blocked(dt,ft,k,kt)){l(),l(),l(),X++;continue}I.position.set(dt,Go(p,dt,ft)+.012,ft),I.rotation.y=tt.yaw+mt,I.scale.setScalar(tt.scale*(.75+l()*.25)),I.updateMatrix(),$.setMatrixAt(V,I.matrix);const gt=.5+.25*Math.sin(dt*.11)+.25*Math.sin(ft*.09);K.setHSL(.105+gt*.095,.22+l()*.13,.25+gt*.07+l()*.035,ht),$.setColorAt(V,K),V++}if(!V){$.dispose();continue}$.count=V,$.userData.metricKind="하층 식생",$.receiveShadow=!0,$.computeBoundingBox(),$.computeBoundingSphere(),$.boundingBox.expandByScalar(.5),$.boundingSphere.radius+=.5,o.add($),U.push({mesh:$,box:$.boundingBox.clone(),count:V})}const N=Pr(),Y=Ss(),et=[],ot=new Dt;ot.name="덤불층 · 바람";const Q=[8144432,9394742,7295284,8745538,5660730,6960168];for(const L of n.values()){if(!L.length)continue;const G=new to(N,Y,L.length);L.forEach(($,V)=>{I.position.set($.x,Go(p,$.x,$.z)-.02,$.z),I.rotation.set(0,$.yaw,0),I.scale.set($.scale*(.85+$.roll*.3),$.scale*(.8+$.roll*7%1*.6),$.scale*(.85+$.roll*3%1*.3)),I.updateMatrix(),G.setMatrixAt(V,I.matrix);const q=.5+.25*Math.sin($.x*.05+$.z*.03)+.25*Math.sin($.z*.07-$.x*.02),tt=Math.min(Q.length-1,Math.floor((q*.6+$.roll*.4)*Q.length));G.setColorAt(V,K.set(Q[tt]).multiplyScalar(.85+$.roll*.3))}),G.userData.metricKind="하층 식생",G.receiveShadow=!0,G.computeBoundingBox(),G.computeBoundingSphere(),G.boundingBox.expandByScalar(1.5),G.boundingSphere.radius+=1.5,ot.add(G),et.push({mesh:G,box:G.boundingBox.clone(),count:L.length})}e.group.add(o,ot),Ca(o),Ca(ot);const J=Tr(),st=e.update.bind(e);return e.update=(L,G=2)=>{if(st(L,G),R.value=performance.now()/1e3,e.status.culling?.reused){te.foliageTime.value=R.value;return}J.update(L);let $=0;for(const q of U){const{mesh:tt,box:Z,count:rt}=q,mt=[20,30,40][G];tt.visible=J.visible(Z,L,mt),tt.count=Math.min(rt,Math.ceil(rt/sa.forestGrass*[.22,.5,1][G]*Fn(Z.distanceToPoint(L.position),Ra[G],mt))),tt.visible&&($+=tt.count)}e.status.scenery.visibleGrass=$;let V=0;te.foliageTime.value=R.value;for(const{mesh:q,box:tt,count:Z}of et)q.visible=J.visible(tt,L,[22,34,48][G]),q.count=Math.ceil(Z*[.3,.65,1][G]),q.visible&&(V+=q.count);e.status.scenery.visibleShrubs=V},e.status.scenery={forestCorridor:30,grassRadius:[20,30,40],grassFullRadius:Ra,grassDensityPerM2:[12.25,5.25],grassBlades:C,shrubs:et.reduce((L,G)=>L+G.count,0),shrubRadius:[22,34,48],denseTrees:[...i.values()].reduce((L,G)=>L+G.placements.filter($=>$.dense).length,0),zones:"forest-zones.js",grassChunkSize:12,pavedGrassCleared:X,waterGrassCleared:x,waterShrubsCleared:A,summitShrubs:T,grassInstances:U.reduce((L,G)=>L+G.count,0),trees:[...i.values()].reduce((L,G)=>L+G.placements.length,0),outcrops:[...s.values()].reduce((L,G)=>L+G.placements.length,0),speciesStatus:"임상도 미확보 · 구간별 활엽 비율(숲 75~80%, 능선 25%) 시각 대용",wind:!0,layers:["소나무·참나무류 교목 시각 대용","덤불층(1~3m)","관목","고사리·조릿대형 하층"],ground:"낙엽층 PBR + 이끼 군락 · 등산로 별도 재질 유지"},[...i.values(),...s.values()]}const Ar=6,Rr=1.12;function Nr(e,t,{radius:o=45,eye:a=1.6,margin:i=.3}={}){const s=t.at(-1),n=e.status.summitFacilities?.sites?.find(f=>f.id==="marker"),r=[...t.filter(f=>Number.isFinite(f.s)&&Number.isFinite(s.s)&&s.s-f.s<=15),...n?[n]:[]].map(f=>({x:f.x,z:f.z,eye:e.floorHeight(f.x,f.z)+a})),l=Math.tan(Ar*Math.PI/180),c={viewers:r.length,lowered:0,removed:0};function u(f,h){const m=e.floorHeight(f,h);let d=1/0;for(const g of r){const p=Math.hypot(f-g.x,h-g.z);p<o&&(d=Math.min(d,g.eye-p*l-i-m))}return d}return{viewers:r,maxTop:u,stats:c,fit(f){const h=u(f.x,f.z),m=Rr*(.8+f.roll*7%1*.6);if(m*f.scale<=h)return!0;const d=h/m;return d<.3?(c.removed++,!1):(f.scale=d,c.lowered++,!0)}}}function Pr(){const e=[],t=[];let o=7;const a=()=>(o=Math.imul(o,1664525)+1013904223>>>0)/4294967296;for(let r=0;r<5;r++){const l=r*1.256+a()*.4,c=Math.cos(l)*.35,u=Math.sin(l)*.35,f=.75+a()*.45,h=.012;e.push(-h,0,0,h,0,0,c,f,u),t.push(.35,.35,.5)}for(const[r,l,c,u,f,h]of[[0,26,.16,.48,.42,.16],[1,36,.42,.82,.5,.18],[2,26,.76,1.12,.38,.19]])for(let m=0;m<l;m++){const d=a()*6.283,g=f*(m%4===0?.2+a()*.5:.7+a()*.3),p=c+a()*(u-c),y=Math.cos(d)*g,v=Math.sin(d)*g,w=a()*6.283,M=.35+a()*.5,k=Math.cos(w)*h,D=Math.sin(w)*h,B=-Math.sin(w)*h*.55,A=Math.cos(w)*h*.55,S=M*h*.6,T=[y-k,p-S,v-D],b=[y+B,p+S*.4,v+A],F=[y+k,p+S,v+D],z=[y-B,p-S*.4,v-A];e.push(...T,...b,...F,...T,...F,...z);const C=.45+r*.17+a()*.15;for(let _=0;_<6;_++)t.push(C)}const i=new xt;i.setAttribute("position",new at(e,3)),i.setAttribute("shrubShade",new at(t,1)),i.computeVertexNormals();const s=i.attributes.normal,n=new P;for(let r=0;r<s.count;r++)n.fromBufferAttribute(s,r).multiplyScalar(.5),n.y+=.6,n.normalize(),s.setXYZ(r,n.x,n.y,n.z);return i}function kl(e){const t=new Set;e.group.traverse(o=>{if(!o.isMesh||!o.material||t.has(o.material))return;const a=o.material;if(!String(a.customProgramCacheKey?.()).includes("gwanak-slope"))return;t.add(a);const i=a.onBeforeCompile,s=a.customProgramCacheKey();a.onBeforeCompile=function(n,...r){i.call(this,n,...r),n.fragmentShader=n.fragmentShader.replace("rock=max(rock,smoothstep(490.0,625.0,landWorld.y)*(.18+.65*outcrop));","rock=max(rock,smoothstep(490.0,625.0,landWorld.y)*(.78+.22*outcrop));"),n.fragmentShader=n.fragmentShader.replace("vec3 forestColor=groundColor.rgb*mottling;",`vec3 forestColor=groundColor.rgb*mottling;
    float mossPatch=smoothstep(.30,.72,.5+.25*sin(landWorld.x*.61)+.25*sin(landWorld.z*.47));
    float moss=mossPatch*(1.0-smoothstep(460.,600.,landWorld.y))*(1.0-rockCover)*.82;
    float litterPatch=.5+.25*sin(landWorld.x*2.7+sin(landWorld.z*1.9))+.25*sin(landWorld.z*3.1);
    float forestFloor=(1.0-smoothstep(490.,610.,landWorld.y))*(1.0-rockCover);
    // 저지대의 풀 포기 사이도 낙엽층으로 연결한다. 바위·정상은 기존 혼합 유지.
    vec3 leafBed=texture2D(land3D,landWorld.xz/1.6).rgb*vec3(.38,.30,.20);
    forestColor=mix(forestColor,leafBed,forestFloor*(.90+.08*litterPatch));
    // 밝은 모래색에 녹색만 곱하지 않고 저채도 이끼의 색·명도를 사용한다.
    vec3 mossBed=vec3(.055,.073,.028)*(.72+.56*litterPatch);
    forestColor=mix(forestColor,mossBed,moss*.68);`)},a.customProgramCacheKey=()=>s+"-moss-v2-leaf-bed",a.needsUpdate=!0})}const Ct={tile:16,step:.62,radius:[14,22,30],capacity:[1400,3800,7200],slopeMax:.24,heightMax:596,pathMargin:.02,reach:.32,near:.45,band:2};function Na({landscape:e,geometry:t,farGeometry:o=t,material:a,scene:i,ground:s=null}){const n=s?null:e.route,r=s?null:Zo(n),l=s?null:Dn(n),c=s?.heightMax??Ct.heightMax,u=()=>[...e.status.sectionScenery?.sites??[],...e.status.interactionProps?.clearSites??[],...e.status.trailProps?.clearSites??[],...(e.status.summitFacilities?.sites??[]).map(S=>({x:S.x,z:S.z,supportRadius:S.supportRadius??3}))];let f=null;const h=Ct.capacity[2],m=(S,T)=>{const b=new to(S,a,h);return b.name=T,b.count=0,b.frustumCulled=!1,b.receiveShadow=!0,b.castShadow=!1,b.userData.metricKind="하층 식생",b.userData.toonGroundCover="field",b.matrixAutoUpdate=!1,i.add(b),b},d=m(t,"카툰 풀밭"),g=m(o,"카툰 풀밭 · 먼 쪽"),p=new Map,y={tiles:0,clumps:0,clumpsNear:0,clumpsFar:0,rebuilds:0,radius:0,nearRadius:0},v=s?s.height:(S,T)=>Go(e.floorHeight,S,T);function w(S,T){const F=(v(S+1.5,T)-v(S-1.5,T))/3,z=(v(S,T+1.5)-v(S,T-1.5))/(2*1.5);return 1-1/Math.sqrt(1+F*F+z*z)}function M(S,T){const b=`${S},${T}`;if(p.has(b))return p.get(b);s||(f??=un(n,{nearest:r,sites:u(),water:l}));let F=(Math.imul(S,73856093)^Math.imul(T,19349663)^1540483477)>>>0;const z=()=>(F=Math.imul(F,1664525)+1013904223>>>0)/4294967296,C=Ct.tile,_=Ct.step,W=Math.round(C/_),H=[];for(let O=0;O<W;O++)for(let I=0;I<W;I++){const K=S*C+(I+.1+z()*.8)*_,U=T*C+(O+.1+z()*.8)*_,X=z()*6.283,x=.75+z()*.5,N=v(K,U);if(!(!Number.isFinite(N)||N>c)){if(s){if(s.blocked(K,U,Ct.reach))continue}else{const Y=r(K,U);if(Y.distance<Y.width/2+Ct.pathMargin||f.blocked(K,U,Ct.reach))continue}w(K,U)>Ct.slopeMax||H.push(K,N-.02,U,X,x)}}const R=new Float32Array(H);return p.set(b,R),y.tiles=p.size,p.size>400&&p.delete(p.keys().next().value),R}const k=new jo;let D=null;function B(S,T=1){const b=Math.max(0,Math.min(2,T|0)),F=Ct.radius[b],z=Ct.capacity[b],C=S.position;if(D&&D.q===b&&Math.hypot(C.x-D.x,C.z-D.z)<3)return;D={x:C.x,z:C.z,q:b},y.radius=F;const _=F*Ct.near,W=Ct.band;y.nearRadius=_,a.userData.fieldUniforms&&(a.userData.fieldUniforms.tgFieldRadius.value=F);const H=Ct.tile,R=F+3,O=Math.floor((C.x-R)/H),I=Math.floor((C.x+R)/H),K=Math.floor((C.z-R)/H),U=Math.floor((C.z+R)/H),X=[];for(let ot=K;ot<=U;ot++)for(let Q=O;Q<=I;Q++){const J=(Q+.5)*H-C.x,st=(ot+.5)*H-C.z;Math.hypot(J,st)<R+H*.71&&X.push([Math.hypot(J,st),Q,ot])}X.sort((ot,Q)=>ot[0]-Q[0]);let x=0,N=0;const Y=d.instanceMatrix.array,et=g.instanceMatrix.array;for(const[,ot,Q]of X){const J=M(ot,Q);for(let st=0;st<J.length&&x+N<z;st+=5){const L=J[st]-C.x,G=J[st+2]-C.z,$=L*L+G*G;$>R*R||(k.position.set(J[st],J[st+1],J[st+2]),k.rotation.set(0,J[st+3],0),k.scale.setScalar(J[st+4]),k.updateMatrix(),$<_*_||$<(_+W)**2&&J[st+3]*157.3%1>(Math.sqrt($)-_)/W?(k.matrix.toArray(Y,x*16),x++):(k.matrix.toArray(et,N*16),N++))}if(x+N>=z)break}for(const[ot,Q]of[[d,x],[g,N]]){ot.count=Q;const J=ot.instanceMatrix;J.clearUpdateRanges(),J.addUpdateRange(0,Math.max(1,Q)*16),J.needsUpdate=!0}y.clumps=x+N,y.clumpsNear=x,y.clumpsFar=N,y.rebuilds++}function A(){for(const S of[d,g])i.remove(S),S.dispose();p.clear()}return{mesh:d,meshFar:g,update:B,dispose:A,status:y}}const Le={twTime:{value:0},twDeep:{value:new nt},twShallow:{value:new nt},twFoam:{value:new nt},twStreak:{value:new nt},twSparkle:{value:0},twGain:{value:1},twSun:{value:new P(0,1,0)},twOpacity:{value:j.stream.opacity}},oa=`
uniform float twTime,twSparkle,twOpacity,twGain;uniform vec3 twDeep,twShallow,twFoam,twStreak,twSun;
float twH(float n){n=fract(n*.1031);n*=n+33.33;n*=n+n;return fract(n);}
float twHash(vec2 p){p=fract(p*vec2(.1031,.1030));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.x);}
float twN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(twHash(i),twHash(i+vec2(1,0)),f.x),mix(twHash(i+vec2(0,1)),twHash(i+vec2(1,1)),f.x),f.y);}
// 픽셀 폭으로 부드럽게 끊는 계단(카툰 경계가 계단 무늬로 깨지지 않게).
float twStep(float e,float x){float w=max(fwidth(x),1e-4);return smoothstep(e-w,e+w,x);}
`,Wr=`
attribute vec2 aStream;attribute vec4 aFrame;
varying vec2 vS;varying vec3 vW;varying vec3 vV;
void main(){
 vS=aStream;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vV=cameraPosition-w.xyz;
 gl_Position=projectionMatrix*viewMatrix*w;
}`,Lr=`
${oa}
varying vec2 vS;varying vec3 vW;varying vec3 vV;
void main(){
 #ifdef TW_POND
 float across=vS.x*TW_SPAN;float halfW=TW_SPAN*(.9+.04*twN(vW.xz*.5));float dW=halfW-across;
 vec2 flow=vW.xz*vec2(1.,1.)+vec2(twTime*.08,-twTime*.05);float along=0.;
 vec2 curl=flow;float cut=1.;
 #else
 float across=vS.x*${De.toFixed(2)};float along=vS.y;
 // 실사와 같은 물 폭(반폭 .62~.84m). 그 밖은 암반 홈이 보이도록 버린다.
 // 물가 윤곽: 물줄기 방향의 느린 폭 변화만 쓰면 물가가 긴 직선·꺾인 모서리로 보인다(final4 계곡 왼쪽 위).
 // 월드 좌표 잡음 두 겹을 더해 물가가 둥글게 들고 나게 한다(카툰 2차).
 float halfW=.62+.22*twN(vec2(along*.28,3.1))+.2*(twN(vW.xz*.85)-.5)+.08*(twN(vW.xz*2.6+4.)-.5);float dW=halfW-abs(across);
 float q=along+twTime*.9;vec2 flow=vec2(across*2.4,q*1.1);
 // 물결 결 좌표(curl): 옆으로 완만하게 휘고(월드 잡음으로 굽이마다 다르게), cut으로 2~4m마다 끊는다.
 // 물줄기 기준 좌표를 그대로 쓰면 물길이 꺾이는 자리에서 결이 직각 지그재그로 이어진다(final3 계곡).
 vec2 curl=flow+vec2(2.4*(.16*sin(q*.8+across*1.6+twN(vW.xz*.22)*6.2832)+.08*sin(q*2.3)),0.);
 float cut=twStep(.45,twN(vec2(across*1.1+5.,q*.42)));
 #endif
 if(dW<-.02)discard;
 float dist=length(vV);
 // 색 2단: 가장자리 얕은 물은 밝은 청록, 가운데는 짙은 청록(경계는 살짝 일렁인다).
 // 얕은 띠 폭: 물줄기를 따라 0~.2m로 달라지고 군데군데 끊긴다(같은 폭 테두리로 읽히지 않게).
 float bandW=.2*smoothstep(.3,.8,twN(vec2(along*.25,across*.3+7.)))+.04*twN(flow*1.3+3.);
 float deep=twStep(bandW,dW);
 vec3 col=mix(twShallow,twDeep,deep);
 // 흐름 방향 밝은 물결 줄(「야생의 숨결」 물 표면의 옅은 결).
 float streak=twN(curl*vec2(1.3,.3)+vec2(0.,twTime*.1))*.6+twN(curl*vec2(2.8,.6)+5.)*.4;
 float near=1.-smoothstep(30.,110.,dist);
 col=mix(col,twStreak,twStep(.66,streak)*.55*near);
 // 잔물결 하이라이트: 짧고 가는 밝은 결(흐름 방향으로 조금 길고, 둥글게 휘며 끊어진다).
 float rip=twN(curl*vec2(4.,.9)+vec2(3.,-twTime*.4));
 col=mix(col,mix(twStreak,twFoam,.5),(1.-twStep(.05,abs(rip-.72)))*.45*near*cut);
 // 반짝임: 작은 칸마다 하나, 해 쪽을 볼수록·물결 꼭대기일수록 자주 켜지는 흰 점.
 vec2 sp=vec2(across*3.,(along+twTime*.9)*1.4);
 #ifdef TW_POND
 sp=vW.xz*2.2+vec2(twTime*.05,0.);
 #endif
 vec2 cell=floor(sp),f=fract(sp)-.5;float h=twHash(cell+7.1);
 vec3 V=normalize(vV);vec3 R=reflect(-V,vec3(0.,1.,0.));
 float sunFace=pow(max(dot(R,twSun),0.),3.);
 float on=step(1.-(.16+.4*sunFace),h)*(.5+.5*sin(twTime*(3.+h*6.)+h*40.));
 float dotSize=.13*(.6+.6*fract(h*13.));
 float sparkle=on*(1.-twStep(dotSize,length(f-(vec2(twHash(cell+.3),twHash(cell+.7))-.5)*.5)))*twSparkle*(1.-smoothstep(20.,70.,dist));
 // 흰 물결선: 물가를 따라(끊어지는 선) + 바위 둘레 고리 + 낙수 아래 거품.
 float foam=0.;
 #ifdef TW_POND
 float edgeLine=(1.-twStep(.08,abs(dW-.12-.05*sin(atan(vW.z,vW.x)*9.+twTime))));
 foam=max(foam,edgeLine*twStep(.35,twN(vW.xz*1.5+twTime*.1)));
 #else
 // 물가 흰 선은 물이 부딪히는 곳(드문 조각)에만. 끊김 없는 테두리는 두지 않는다(낮 배경 외곽선 0, 기준값 §2-6).
 float edgeLine=1.-twStep(.035,abs(dW-.06-.03*sin(q*2.1+across)));
 foam=max(foam,edgeLine*twStep(.72,twN(vec2(across*2.,q*.35)))*.8);
 // 낙수 바로 아래: 둥근 흰 거품 덩어리가 하류로 2~4m 흩어진다.
 float lc=floor(along/${Ht.toFixed(1)}+.5);
 float lx=along-(lc*${Ht.toFixed(1)}+(twH(lc*2.3+7.)-.5)*5.);
 if(twH(lc*5.1+1.)>=.4&&lx<.4&&lx>-3.5){
  float k=smoothstep(-.2,-3.,lx);
  float blob=twN(vec2(across*2.6,(along+twTime*1.4)*1.8))*.7+twN(vec2(across*6.,(along+twTime*1.4)*4.))*.3;
  foam=max(foam,twStep(.5+.42*k,blob));
  // 떨어지는 가장자리 바로 위(고인 단 끝) 흰 띠.
  foam=max(foam,(1.-twStep(.18,abs(lx-.2)))*twStep(.3,twN(vec2(across*4.,twTime))));
 }
 #endif
 col=mix(col,twFoam,clamp(foam,0.,1.));
 col+=twFoam*sparkle*1.6;
 // 알파: 가장자리는 픽셀 폭으로 녹이고, 몸통은 약간 비친다(외곽선 패스는 알파 .75 미만을 건너뛴다).
 float a=twStep(0.,dW)*mix(twOpacity,1.,max(foam,deep*.6));
 gl_FragColor=vec4(col*twGain,a);
}`;function Pa({pond:e=!1,span:t=5}={}){const o=new St({name:e?"toon-pond":"toon-stream",uniforms:Le,vertexShader:Wr,fragmentShader:Lr,transparent:!0,depthWrite:!1,side:zt,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2,defines:e?{TW_POND:"",TW_SPAN:t.toFixed(2)}:{}});return o.extensions={derivatives:!0},o.userData.shared=!0,o.userData.toonWater=!0,o}const Br="varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",Er=`
${oa}
varying vec2 vUv;
void main(){
 float lane=floor(vUv.x*14.),r=twH(lane+3.);
 float flow=fract(pow(vUv.y,.7)*1.6-twTime*(1.3+r*.8)+r*7.);
 // 세로 줄: 칸 안에서 가운데가 굵은 둥근 줄(네모 블록처럼 보이지 않게).
 float lx=abs(fract(vUv.x*14.)-.5);
 float white=twStep(.35,flow)*(1.-twStep(.32,lx))*step(.25,twH(lane+11.));
 // 아래 끝 거품: 떨어진 물이 부딪히는 자리. 잡음으로 윗선이 들쭉날쭉하다.
 float splash=twStep(.82-.08*twN(vec2(vUv.x*9.,twTime*1.5)),vUv.y);
 vec3 col=mix(mix(twShallow,twFoam,.55),twFoam,max(white,splash));
 float side=1.-smoothstep(.36,.5,abs(vUv.x-.5));
 float a=side*smoothstep(0.,.08,vUv.y)*mix(.72+.25*white,.92,splash);
 gl_FragColor=vec4(col*twGain,a);
}`;function $r(){const e=new St({name:"toon-fall",uniforms:Le,vertexShader:Br,fragmentShader:Er,transparent:!0,depthWrite:!1,side:zt});return e.extensions={derivatives:!0},e.userData.shared=!0,e.userData.toonWater=!0,e}const Hr=`
attribute vec3 aRing;varying vec3 vR;
void main(){vR=aRing;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,Ir=`
${oa}
varying vec3 vR;
void main(){
 vec2 d=vR.xy;float rr=vR.z,seed=rr*97.;
 // d.x 옆, d.y 상류(+). 하류(-) 쪽은 길게 끌린 꼬리.
 vec2 e=vec2(d.x,d.y*(d.y<0.?.5:1.));
 float ang=atan(e.y,e.x);
 float r=length(e)-rr*1.2-.035*sin(ang*5.+twTime*2.+seed);
 // 안쪽 띠도 끊어진 조각(바위 밑동에 부딪힌 옅은 거품)으로.
 float inner=(1.-twStep(.03,abs(r)))*step(.38,twN(vec2(ang*3.,seed+twTime*.6)));
 float ph=fract(twTime*.5+fract(seed));
 float outer=(1.-twStep(.018,abs(r-.08-ph*.32)))*(1.-ph)*step(.5,twN(vec2(ang*2.,seed)));
 float a=max(inner,outer)*.85;if(a<.01)discard;
 gl_FragColor=vec4(twFoam*twGain,a);
}`;let le=null;function Or(){return le||(le=new St({name:"toon-rock-ring",uniforms:Le,vertexShader:Hr,fragmentShader:Ir,transparent:!0,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),le.extensions={derivatives:!0},le.userData.shared=!0,le.userData.toonWater=!0),le}function Gr(e){const t=e.attributes.position,o=e.attributes.aStream,a=e.attributes.aFrame,i=7,s=t.count/i;if(!s||!o)return null;const n=g=>o.getY(g*i+3),r=n(0),l=n(s-1),c=Math.min(r,l),u=Math.max(r,l),f=[],h=[],m=[];for(let g=Math.floor(c/Fe);g<=Math.floor(u/Fe);g++){const p=dn(g);if(!p||p.along<c||p.along>=u||Xt(p.along)>0)continue;let y=0,v=1/0;for(let _=0;_<s;_++){const W=Math.abs(n(_)-p.along);W<v&&(v=W,y=_)}const w=y*i+3,M=a.getX(w),k=a.getY(w),D=a.getZ(w),B=a.getW(w),A=t.getX(w)+D*p.across,S=t.getZ(w)+B*p.across,T=t.getY(w)+.012,b=p.radius*2+.25,F=p.radius*2+.25,z=p.radius*4.5+.3,C=f.length/3;for(const[_,W]of[[-b,-z],[b,-z],[b,F],[-b,F]])f.push(A+D*_-M*W,T,S+B*_-k*W),h.push(_,W,p.radius);m.push(C,C+1,C+2,C,C+2,C+3)}if(!f.length)return null;const d=new xt;return d.setAttribute("position",new at(f,3)),d.setAttribute("aRing",new at(h,3)),d.setIndex(m),d.computeBoundingSphere(),d}const Wa=30,Ur=`
uniform float twTime,twPx;attribute vec4 aSeed;varying float vA;varying float vMist;
void main(){
 float ph=fract(twTime*(.55+.35*aSeed.x)+aSeed.y);
 vec3 p=position;
 // aSeed.z: 튀는 방향(수평 각 -π~π), aSeed.w: 튀어 오르는 높이.
 float an=aSeed.z*3.1416;
 p+=vec3(cos(an)*.5*ph,(.5+.7*aSeed.w)*ph*(1.-ph)*1.8,sin(an)*.5*ph)*mix(1.,.35,step(.9,aSeed.x))+vec3(0.,.25*step(.9,aSeed.x),0.);
 vec4 mv=modelViewMatrix*vec4(p,1.);
 gl_Position=projectionMatrix*mv;
 vA=(1.-ph)*smoothstep(0.,.12,ph);
 // 넷 중 하나는 크고 옅은 안개 덩이(물보라 구름), 나머지는 작은 물방울.
 float big=step(.75,aSeed.x);
 // 열에 하나는 떨어지는 자리에 머무는 크고 부드러운 반투명 안개 덩이(06_13). 천천히 부풀며 옅어진다.
 vMist=step(.9,aSeed.x);
 gl_PointSize=twPx*mix((.06+.16*ph)*(.7+.6*aSeed.x)*(1.+2.2*big),.9+.5*ph,vMist)/max(-mv.z,.5);
 vA*=mix(1.-.45*big,.5*(1.-ph*.6),vMist);
}`,Vr=`
uniform vec3 twFoam;uniform float twGain;varying float vA;varying float vMist;
void main(){vec2 c=gl_PointCoord-.5;float d=length(c);if(d>.5)discard;
 if(vMist>.5){gl_FragColor=vec4(twFoam*twGain,vA*smoothstep(.5,.1,d)*.8);return;}
 // 카툰 점: 안은 꽉 차고 가장자리 한 줄만 풀린다.
 float a=vA*(1.-smoothstep(.42,.5,d));gl_FragColor=vec4(twFoam*twGain*(1.-.12*smoothstep(.0,.45,d)),a*.85);}`,An={...Le,twPx:{value:600}};let Oe=null;function La(){return Oe??=new St({name:"toon-spray",uniforms:An,vertexShader:Ur,fragmentShader:Vr,transparent:!0,depthWrite:!1}),Oe.userData.shared=!0,Oe.userData.toonWater=!0,Oe}function jr(e){const t=e.attributes.position,o=hn.length,a=Ae*o,i=[],s=[];for(let r=0;r+a<=t.count;r+=a){const l=r+(Ae-1)*o,c=Math.floor(o/2),u=t.getX(l+c)-t.getX(l-o+c),f=t.getZ(l+c)-t.getZ(l-o+c),h=Math.hypot(u,f)||1;for(let m=0;m<Wa;m++){const d=(m+.5)/Wa*(o-1),g=Math.min(o-2,Math.floor(d)),p=d-g,y=l+g,v=M=>{const k=Math.sin(r*7.1+m*13.3+M*3.7)*43758.5453;return k-Math.floor(k)},w=.35*v(5);i.push(t.getX(y)+(t.getX(y+1)-t.getX(y))*p+u/h*w,t.getY(y)+(t.getY(y+1)-t.getY(y))*p+.04,t.getZ(y)+(t.getZ(y+1)-t.getZ(y))*p+f/h*w),s.push(v(1),v(2),(v(3)-.5)*2,v(4))}}const n=new xt;return n.setAttribute("position",new at(i,3)),n.setAttribute("aSeed",new at(s,4)),n.computeBoundingSphere(),n.boundingSphere&&(n.boundingSphere.radius+=2),n}function Kr(e,t=7,o=3){const a=e?.attributes?.position,i=e?.attributes?.aStream,s=e?.attributes?.aFrame;if(!a||!i||!s)return 0;const n=a.count/t;if(!Number.isInteger(n)||n<2)return 0;const r=Object.keys(e.attributes),l=Object.fromEntries(r.map(v=>[v,e.attributes[v]])),c=Object.fromEntries(r.map(v=>[v,[]])),u=v=>{for(const w of r){const M=l[w],k=M.itemSize;for(let D=0;D<t;D++)for(let B=0;B<k;B++)c[w].push(M.array[(v*t+D)*k+B])}},f=(v,w=o)=>a.getY(v*t+w),h=Array.from({length:n},(v,w)=>({x:a.getX(w*t+o),z:a.getZ(w*t+o)})),m=new Set;for(let v=0;v+1<n;v++){const w=i.getY((v+1)*t+o)-i.getY(v*t+o),M=f(v+1)-f(v);w<.05&&M>.05&&M>w*6&&m.add(v+1)}const d=new Map;for(const v of m){const{index:w}=gn(h,v-1);d.set(w+1,v)}let g=0,p=0;for(let v=0;v<n;v++){if(!d.has(v)){u(v),p++;continue}const w=d.get(v),M=w-1,k=f(w)-f(M),D=v-1,B=D>=0?Math.hypot(h[D].x-h[M].x,h[D].z-h[M].z):1/0,A=pn(k,B),S=i.getY(w*t+o);for(let T=Ae-1;T>=1;T--){const b=T/(Ae-1),{out:F,drop:z}=Xe(b);for(let C=0;C<t;C++){const _=w*t+C,W=s.getX(_),H=s.getY(_),R=f(M,C),O=D>=0&&B>1e-6?R+(f(D,C)-R)*Math.min(1,A/B):R;for(const I of r){const K=l[I],U=K.itemSize;if(I==="position")c[I].push(a.getX(_)+W*A*F,a.getY(_)+(O-a.getY(_))*z,a.getZ(_)+H*A*F);else if(I==="aStream")c[I].push(i.getX(_),S-A*F);else for(let X=0;X<U;X++)c[I].push(K.array[_*U+X])}}p++}v=w-1,g++}if(!g)return 0;for(const v of r){const w=l[v];e.setAttribute(v,new at(c[v],w.itemSize,w.normalized))}const y=[];for(let v=1;v<p;v++){const w=v*t,M=w-t;for(let k=0;k<t-1;k++)y.push(M+k,M+k+1,w+k,M+k+1,w+k+1,w+k)}return e.setIndex(y),e.computeBoundingSphere(),e.computeBoundingBox?.(),g}function Ba(e,t,o,a=3){const i=e?.attributes?.position,s=e?.attributes?.aFrame;if(!i)return!1;const n=i.count/t;if(n<3||!Number.isInteger(n))return!1;const r=[];for(let f=0;f<n;f++){const h=f*t+o;r.push([i.getX(h),i.getZ(h)])}const l=f=>{const h=r[Math.max(0,f-1)],m=r[Math.min(n-1,f+1)],d=h[0]-m[0],g=h[1]-m[1],p=Math.hypot(d,g)||1;return[d/p,g/p]},c=r.map((f,h)=>l(h)),u=c.map((f,h)=>{let m=0,d=0;for(let p=-a;p<=a;p++){const y=c[Math.min(n-1,Math.max(0,h+p))],v=1-Math.abs(p)/(a+1);m+=y[0]*v,d+=y[1]*v}const g=Math.hypot(m,d)||1;return[m/g,d/g]});for(let f=0;f<n;f++){const[h,m]=[c[f][1],-c[f][0]],[d,g]=[u[f][1],-u[f][0]];for(let p=0;p<t;p++){const y=f*t+p,v=i.getX(y)-r[f][0],w=i.getZ(y)-r[f][1],M=v*h+w*m;i.setX(y,r[f][0]+d*M),i.setZ(y,r[f][1]+g*M),s&&s.setXYZW(y,u[f][0],u[f][1],d,g)}}return i.needsUpdate=!0,s&&(s.needsUpdate=!0),e.computeBoundingSphere(),e.computeBoundingBox?.(),!0}function qr({materials:e}={}){const t={streams:0,ponds:0,falls:0,sprays:0,beds:0},o=Pa(),a=new Map,i=$r(),s=new nt().setRGB(...ra({}).bedRgb,ht).multiplyScalar(1/.1);let n=null;const r=u=>u?.customProgramCacheKey?.()??"";function l(u){if(!u.isMesh||Array.isArray(u.material))return!1;const f=u.material,h=r(f);if(f.userData?.fxWater){if(/-pond-/.test(h)){const d=Number(h.split("-pond-")[1]?.split("-")[0])||5;a.has(d)||a.set(d,Pa({pond:!0,span:d})),u.material=a.get(d),t.ponds++}else{if(u.material=o,t.streams++,!u.geometry.userData.toonSmoothed&&Ba(u.geometry,7,3)&&(u.geometry.userData.toonSmoothed=!0,t.smoothed=(t.smoothed??0)+1),!u.geometry.userData.toonCurved){const g=Kr(u.geometry,7,3);u.geometry.userData.toonCurved=!0,g&&(t.curvedLedges=(t.curvedLedges??0)+g)}const d=!u.userData.toonRings&&Gr(u.geometry);if(d){const g=new _t(d,Or());g.name="계곡 바위 물결",g.renderOrder=(u.renderOrder??0)+1,u.add(g),u.userData.toonRings=g,t.rings=(t.rings??0)+d.index.count/6}}return!0}if(/^fall-water-/.test(h)){if(u.material=i,t.falls++,!u.userData.toonSpray){const m=new Je(jr(u.geometry),La());m.name="계곡 물보라",m.renderOrder=4,m.frustumCulled=!0,u.add(m),u.userData.toonSpray=m,t.sprays++}return!0}return/^bed-rock-/.test(h)&&e?(n??=(e.rock??e.basic)(s,{vertexColors:!0},{cell:[1.8,1.4,1.8],amt:1.2,crack:0,moss:-.3}),u.material=n,t.beds++,!u.geometry.userData.toonSmoothed&&Ba(u.geometry,9,4)&&(u.geometry.userData.toonSmoothed=!0),!0):!1}function c(u={},{sunVector:f=null,dt:h=0,pointScale:m=null,exposure:d=1}={}){const g=ra(u),p=Le,y=(v,w)=>v.value.setRGB(...w,ht);return y(p.twDeep,g.deep),y(p.twShallow,g.shallow),y(p.twFoam,g.foam),y(p.twStreak,g.streak),p.twSparkle.value=g.sparkle,p.twOpacity.value=g.opacity,p.twTime.value+=h,p.twGain.value=1/Math.max(.05,d),f&&p.twSun.value.copy(f).normalize(),m&&(An.twPx.value=m),g}return{swap:l,update:c,status:t,materials:{stream:o,fall:i,get spray(){return La()}}}}const Zr=[34,16,34];function Xr({mobile:e=!1}={}){const t=e?140:260,o=new Float32Array(t*4);let a=97;const i=()=>(a=Math.imul(a,1664525)+1013904223>>>0)/4294967296;for(let h=0;h<t;h++)o[h*4]=i(),o[h*4+1]=i(),o[h*4+2]=i(),o[h*4+3]=(h+.5)/t;const s=new xt;s.setAttribute("position",new at(new Float32Array(t*3),3)),s.setAttribute("aSeed",new at(o,4)),s.boundingSphere=new cs(new P,1e7);const n={uTime:{value:0},uCam:{value:new P},uBox:{value:new P(...Zr)},uScale:{value:600},uLight:{value:1},uSpringHeight:{value:1},tsW:Ce.tsW},r=new St({name:"toon-season-particles",transparent:!0,depthWrite:!1,fog:!1,uniforms:n,vertexShader:`
uniform float uTime,uScale,uSpringHeight;uniform vec3 uCam,uBox;uniform vec4 tsW;
attribute vec4 aSeed;varying vec3 vColor;varying float vAlpha,vSpin;
void main(){
 // 봄은 꽃잎(분홍·흰), 가을은 낙엽(빨강·주황·노랑·갈색). 계절이 섞이는 동안은 입자마다 하나를 고른다.
 float spring=tsW.x*uSpringHeight,autumn=tsW.z*.8,amount=spring+autumn,isSpring=step(aSeed.z*(spring+autumn),spring);
 // 낙엽은 꽃잎보다 무겁게 떨어지고 크게 흔들린다.
 float fall=mix(1.15,.7,isSpring),sway=mix(1.1,.8,isSpring);
 vec3 o=aSeed.xyz*uBox+vec3(.55,-fall,.25)*uTime;
 o.x+=sin(uTime*.9+aSeed.y*40.)*sway;o.z+=cos(uTime*.7+aSeed.x*40.)*sway;
 vec3 p=mod(o-uCam+uBox*.5,uBox)-uBox*.5;
 vec4 mv=viewMatrix*vec4(uCam+p,1.);gl_Position=projectionMatrix*mv;
 if(aSeed.w>amount)gl_Position=vec4(2.,2.,2.,1.);
 gl_PointSize=clamp(uScale*mix(.075,.055,isSpring)*(.75+.5*aSeed.z)/max(-mv.z,.5),1.5,22.);
 float k=fract(aSeed.y*7.3);
 vec3 autumnC=k<.35?vec3(.75,.12,.05):k<.6?vec3(.85,.38,.06):k<.85?vec3(.9,.68,.08):vec3(.5,.28,.1);
 vec3 springC=k<.6?vec3(1.,.66,.78):vec3(1.,.88,.92);
 vColor=mix(autumnC,springC,isSpring);
 vAlpha=smoothstep(.6,2.5,-mv.z)*(1.-smoothstep(uBox.x*.35,uBox.x*.5,length(p.xz)));
 vSpin=uTime*(1.3+aSeed.x*2.)+aSeed.z*6.28;
}`,fragmentShader:`
uniform float uLight;varying vec3 vColor;varying float vAlpha,vSpin;
void main(){
 // 빙글 도는 작은 타원 잎(가운데가 밝고 가장자리는 조금 어둡다).
 vec2 q=gl_PointCoord-.5;float c=cos(vSpin),s=sin(vSpin);q=mat2(c,-s,s,c)*q;q.y*=1.+.7*abs(sin(vSpin*.7));
 float d=length(q*vec2(1.,1.9))*2.;if(d>1.)discard;
 gl_FragColor=vec4(vColor*uLight*mix(1.,.82,d),vAlpha*.95);
}`}),l=new Je(s,r);l.name="계절 꽃잎·낙엽",l.frustumCulled=!1,l.renderOrder=2;const c={count:t,visible:!1};function u(h,m,{light:d=1}={}){const g=Ce.tsW.value,p=g.x+g.z>.01;l.visible=p,c.visible=p,!(!p||!m)&&(n.uTime.value+=Math.min(h,.1),n.uCam.value.copy(m.position),n.uLight.value=d,n.uSpringHeight.value=1-.65*Nt.smoothstep(m.position.y,250,450))}function f(h,m){n.uScale.value=h/(2*Math.tan(m*Math.PI/360))}return{points:l,update:u,resize:f,status:c,dispose(){s.dispose(),r.dispose()}}}async function zl({renderer:e,scene:t,camera:o,mobile:a=!1}={}){const i=Ua(),s=Ps({gradientMap:i}),n=Ci({gradientMap:i,uniforms:Gt}),r=qr({materials:s.materialFactory}),l=(R,O)=>(R?.traverse?.(I=>{n.swapGroundCover(I),r.swap(I)}),s.toonify(R,O)),c=oi(),u=e?hi({renderer:e,scene:t,camera:o,mobile:a}):null,f=new nt,h={a:Gt.toonWaveA.value.clone(),b:Gt.toonWaveB.value.clone()},m={a:h.a.clone(),b:h.b.clone()},d=Fs(),g=Xr({mobile:a});t?.add(g.points);const p={};let y="";const v=["stairs","deck_stairs"].map(R=>{const O=s.materialFactory.trail(R);return{m:O,base:O.color.clone()}}),w=qa("#d9dde2");function M(){const R=Ce.tsW.value.toArray(),O=R.map(U=>U.toFixed(3)).join();if(O===y)return;y=O;const I=s.materialFactory.terrain().userData.toonUniforms,K={meadow:"tMeadow",meadowFar:"tMeadowFar",forest:"tForest",highForest:"tHigh"};for(const[U,X]of Object.entries(K))p[U]??=I[X].value.clone(),yo(I[X].value,p[U],Object.fromEntries(["spring","autumn","winter"].map(x=>[x,Cs[x][U]])),R);yo(m.a,h.a,{spring:ae.spring[0],autumn:ae.autumn[0],winter:ae.winter[0]},R),yo(m.b,h.b,{spring:ae.spring[1],autumn:ae.autumn[1],winter:ae.winter[1]},R);for(const U of v)U.m.color.copy(U.base).lerp(w,.45*R[3])}let k=null,D=null;function B(R){if(k||!R?.floorHeight||!t)return k;{const O=s.materialFactory.terrain(),I=O.onBeforeCompile,K=O.customProgramCacheKey.bind(O),U=j.terrainContactAO;O.onBeforeCompile=function(X,x){I.call(this,X,x),X.fragmentShader=X.fragmentShader.replace("reflectedLight.directDiffuse*=contactAO;",`reflectedLight.directDiffuse*=mix(1.,contactAO,${U.direct.toFixed(2)});`).replace("reflectedLight.indirectDiffuse*=contactAO;",`reflectedLight.indirectDiffuse*=mix(1.,contactAO,${U.indirect.toFixed(2)});`)},O.customProgramCacheKey=()=>`${K()}|toon-contact-soft`}return k=Na({landscape:R,geometry:n.geometries.grass.field,farGeometry:n.geometries.grass.fieldFar,material:n.materials.grassField,scene:t}),z.grassField=k.status,k}function A(R){return k||!R?.height||!t||(k=Na({ground:R,geometry:n.geometries.grass.field,farGeometry:n.geometries.grass.fieldFar,material:n.materials.grassField,scene:t}),z.grassField=k.status),k}let S=null,T=globalThis.performance?.now?.()??0,b=T;const F=new P(0,1,0),z={style:"toon",gradient:[...j.gradient],materials:s.status,nature:n.status,water:r.status,city:c.status,pipeline:u?.status??null,sky:{created:!1},phase:null};function C(){return S||(S=Es({radius:Math.min(2e4,(o?.far??3e4)*.66)}),t?.add(S.mesh),z.sky.created=!0),S.mesh}function _(R,O,I){S||C();const K=globalThis.performance?.now?.()??0,U=Math.min(.5,Math.max(0,(K-T)/1e3));T=K,O&&F.copy(O);const X=S.update(R,O,I,U,e?.toneMappingExposure??1);return z.sky.stars=X.stars,t?.background?.isColor&&t.background.setRGB(...X.horizon,ht),X}let W=globalThis.performance?.now?.()??0;const H=R=>{{const K=globalThis.performance?.now?.()??0,U=Math.min(.5,Math.max(0,(K-W)/1e3));W=K,d.update(U),M(),z.season={name:d.name,weights:d.weights,particles:g.status.visible};const X=Rt(R),x=e?.domElement?.height??800;g.resize(x,o?.fov??60),g.update(U,o,{light:X.day+X.sunset*.6+X.night*.22})}const O=xs(R);Gt.toonWaveSpeed.value=O.speed,Gt.toonWaveStrength.value=O.strength;{const K=X=>X.day+X.sunset*j.foliage.sunsetDim+X.night*j.foliage.nightDim,U=K(Rt(R));Gt.toonWaveA.value.copy(m.a).multiplyScalar(U),Gt.toonWaveB.value.copy(m.b).multiplyScalar(U)}c.update(R,o,u?.status.quality??2);const I=z.phase=Rt(R);{const K=globalThis.performance?.now?.()??0,U=Math.min(.5,Math.max(0,(K-b)/1e3));b=K;const X=e?.domElement?.height??800,x=(o?.fov??60)*Math.PI/180;r.update(R,{sunVector:F,dt:U,pointScale:X/(2*Math.tan(x/2)),exposure:e?.toneMappingExposure??1})}if(k&&o&&k.update(o,u?.status.quality??1),D===null&&t&&(D=!1,t.traverse(K=>{!D&&K.name==="빛줄기"&&K.material?.uniforms?.fxStrength&&(D=K,K.material.uniforms.fxStrength.value*=j.lightShafts)})),t?.fog&&I.day>0&&Do.fog_fragment.includes("fogNear")){const K=j.terrain;f.setRGB(...lt(K.haze),ht),t.fog.color.lerp(f,I.day*(1-(R.gray??0)*.6)),t.fog.near+=K.hazeDensity*I.day}if(t?.fog&&I.sunset>0&&Do.fog_fragment.includes("fogNear")){const K=j.sunsetHaze;f.setRGB(...lt(K.color),ht),t.fog.color.lerp(f,I.sunset*(1-(R.gray??0)*.6)),t.fog.near+=K.density*I.sunset}return u?.update(R)??z};return{materialFactory:s.materialFactory,toonify:l,natureParts:n.natureParts,attachLandscape:B,attachGround:A,nature:n,patchFoliage:s.patchFoliage,createSky:C,updateSky:_,exposureFor:gs,lightScale:vs,styleCity:c.styleCity,setSeason(R,{instant:O=!1}={}){const I=d.set(R);return I&&O&&d.snap(),I},get season(){return d.name},styleNightLighting(R){const O=R?.getObjectByName?.("가로등 기둥");return O&&(O.material=s.materialFactory.basic(new nt(j.lampPole))),!!O},pipeline:u&&{resize:u.resize,update:H,render:u.render,dispose:u.dispose,composer:u.composer,passes:u.passes,status:u.status},status:z,dispose(){g.dispose(),k?.dispose(),u?.dispose(),S?.dispose(),i.dispose()}}}const Tl={am:{label:"오전 10시",elevation:29,azimuth:142},pm:{label:"오후 3시",elevation:25,azimuth:224}},Ea={id:"forest-granite-clear-v3",sunElevation:29,sunAzimuth:142,haze:"#9DBEDF",zenith:"#4A86C8",horizon:"#BAD6EE",sunColor:"#FFF1DE",far:3e4};function _l(e=Ea.sunElevation,t=Ea.sunAzimuth){const o=e*Math.PI/180,a=t*Math.PI/180;return[Math.sin(a)*Math.cos(o),Math.sin(o),-Math.cos(a)*Math.cos(o)]}const Cl=`
#ifdef USE_FOG
 float d=max(0.0,vFogDepth);
 float a=-log(0.68),b=-log(0.55),c=-log(0.25);
 float tau=d<=8000.0?a*d/8000.0:d<=12000.0?a+(b-a)*(d-8000.0)/4000.0:b+(c-b)*(d-12000.0)/13000.0;
 // 날씨 연무(비·눈·안개·흐림)는 fog.near 슬롯으로 받은 감쇠 계수(1/m)만큼 광학 깊이를 더한다. 0이면 맑은 날 기준 그대로.
 tau+=d*fogNear;
 gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor,1.0-exp(-tau));
 // 푸른 연무: 대비 감쇠와 별개로 먼 곳일수록 레일리 산란처럼 하늘색을 얹는다(회색 안개 대신).
 float veil=${go.veil.toFixed(3)}*(1.0-exp(-d/${go.scale.toFixed(1)}));
 gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(${go.color.map(e=>e.toFixed(3)).join(",")})*max(dot(fogColor,vec3(0.2126,0.7152,0.0722))*1.05,0.0)/0.62,veil);
#endif
`,aa=Object.freeze({radius:56,deadZone:.2,releaseZone:.14,cardinalHalfDeg:28,diagonalHalfDeg:17,holdDeg:8,margin:12}),Co=Object.freeze([[0,1,0],[45,1,1],[90,0,1],[135,-1,1],[180,-1,0],[-135,-1,-1],[-90,0,-1],[-45,1,-1]].map(([e,t,o])=>Object.freeze({deg:e,forward:t,side:o,key:`${t},${o}`}))),Ge=e=>(e+540)%360-180,Yr=(e,t)=>Math.atan2(e,-t)*180/Math.PI;function Dl(e,t,o=null,a=aa){if(Math.hypot(e,t)/a.radius<(o?a.releaseZone:a.deadZone))return null;const s=Yr(e,t),n=l=>l.forward&&l.side?a.diagonalHalfDeg:a.cardinalHalfDeg,r=Co.find(l=>l.key===o);return r&&Math.abs(Ge(s-r.deg))<=n(r)+a.holdDeg?r:Co.find(l=>Math.abs(Ge(s-l.deg))<=n(l))||Co.reduce((l,c)=>Math.abs(Ge(s-c.deg))<Math.abs(Ge(s-l.deg))?c:l)}function Fl(e,t,o,a,i=aa.radius){let s=o-e,n=a-t;const r=Math.hypot(s,n);if(r>i){const l=(r-i)/r;e+=s*l,t+=n*l,s=o-e,n=a-t}return{cx:e,cy:t,dx:s,dy:n}}const Al=(e,t,o,a,i=aa)=>{const s=i.radius+i.margin;return{x:Math.min(Math.max(e,s),Math.max(s,o-s)),y:Math.min(Math.max(t,s),Math.max(s,a-s))}};export{Ni as $,Tl as A,ln as B,ol as C,yr as D,ji as E,vt as F,so as G,Cl as H,vr as I,el as J,tl as K,Ea as L,br as M,Dn as N,Ca as O,zr as P,$t as Q,Aa as R,aa as S,fn as T,Tr as U,ul as V,Et as W,pl as X,cl as Y,vl as Z,nn as _,We as a,Ri as a0,gl as a1,ll as a2,bl as a3,bt as a4,yl as a5,te as a6,Sl as a7,al as a8,xl as a9,xr as aa,hl as ab,pr as ac,Ke as ad,fl as b,zl as c,io as d,sl as e,Ml as f,It as g,wr as h,Zo as i,Ai as j,ml as k,zo as l,kl as m,wl as n,rl as o,Io as p,dl as q,il as r,_l as s,ba as t,qi as u,nl as v,zn as w,Fl as x,Dl as y,Al as z};
//# sourceMappingURL=joystick-C2bC3XUy.js.map
