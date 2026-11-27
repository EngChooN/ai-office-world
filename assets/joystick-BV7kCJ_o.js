import{N as Hn,az as In,aA as On,aB as Gn,u as da,Z as Un,w as Vn,aC as jn,x as Kn,q as N,n as Qo,aD as qn,aq as Zn,p as rt,i as zt,D as Ct,c as At,t as gt,b as Wt,aE as Xn,ap as Po,av as Ka,V as Mt,aF as Ye,$ as Pt,ag as $e,W as qa,m as Se,z as ma,ai as Yn,y as Qn,S as Jn,G as Rt,A as Bo,r as so,l as bt,an as ts,f as xe,F as st,k as Ce,aG as es,aH as ye,aI as de,aJ as me,aK as os,ad as as,aL as ns,aM as ss,aN as rs,aO as is,aP as ls,aQ as cs,ao as fs,aR as us,a7 as ds,aS as ms,aT as hs,aU as ps,M as Za,af as Xa,o as Jo,s as Ya,al as gs,a as vs,B as Ne,C as Kt,ak as Eo,T as xs,U as ys,ah as ws,aj as ta,I as ro,J as bs}from"./BufferGeometryUtils-C9DEbwli.js";import{L as ha}from"./link-hiker-BwQAxlHJ.js";const j={gradient:[.35,.7,1],terrainGradient:[.6,.82,1],terrainContactAO:{direct:.25,indirect:.35},localLightCap:.45,outline:{day:"#3b2f2a",night:"#1d2a44",strength:{day:0,sunset:1,night:1},width:[1,1,1.5],fadeNear:60,fadeFar:900,creaseNear:14,creaseFar:32,depthEdge:.012,normalEdge:.42},bloom:{day:{threshold:.85,strength:.35,radius:.45},sunset:{threshold:.8,strength:.35,radius:.5},night:{threshold:.55,strength:.9,radius:.6}},grade:{day:{saturation:.95,tint:"#8fc4c8",tintAmount:.05,contrast:1,lift:.01,shadowGain:0},sunset:{saturation:1.1,amber:"#ffb36b",violet:"#3b4f8c",tintAmount:.1,contrast:1.06,lift:0,shadowGain:.4},night:{saturation:.9,tint:"#16224a",tintAmount:.18,contrast:1,lift:.015,shadowGain:0},shadow:"#5f8fb0",shadowAmount:.35,dayShadowAmount:.18},sky:{day:{zenith:"#7aaed6",horizon:"#c3dcd4",cloud:"#eef4f1",cloudShade:"#b5d0d0"},sunset:{zenith:"#2c4d79",mid:"#7d66ab",pink:"#d19caf",horizon:"#fadfca",cloud:"#b48ea5",cloudShade:"#9f7e9b",cloudLit:"#ca9eab"},night:{zenith:"#172432",horizon:"#4f5b74",city:"#c4bfcd",cloud:"#3a5676",cloudShade:"#273e58",cloudLit:"#4c6d94"},bands:[.08,.18,.3],starIntensity:1.6,stars:{cells:120,share:.012,bright:.035,smallPx:1,brightPx:1.8,milkyBoost:4,small:.3,big:.6},milky:{from:[300,5],to:[30,55],width:.11,color:"#5d6d94",dust:"#141c2c",strength:.5},cityGlow:{bearing:345,strength:1,height:.16,input:"#cdc2c2",bino:{color:"#5a3f63",height:.05,horizonDim:.45}},cover:{sunset:.72,night:.3}},nightExposure:.42,nightLight:.5,sunsetLight:.3,sunsetHaze:{color:"#65545e",density:3e-4},city:{litMin:.35,litMax:.6,lampGain:1.2,roadLightGain:.45},lampPole:"#8d9a93",foliage:{waveA:"#a8d06a",waveB:"#6f9f4a",leafWave:.22,top:1.12,bottom:.68,grassFlat:{strength:1,brightness:1},needleFlat:{strength:.88,brightness:.62},sunsetDim:.4,nightDim:.6},terrain:{meadow:"#a3d27a",meadowFar:"#a6c993",forest:"#4f8434",highForest:"#6a9a4a",rock:"#8c9391",rockDark:"#4b5853",soil:"#b08a5e",ridgeHeight:520,forestHeight:430,rockSlope:.28,rockHeight:[500,600],summitHeight:[600,625],forestScale:70,rockScale:45,haze:"#8eaec4",hazeDensity:22e-5,brushNear:1.1,brushMid:4.5,brushAmount:.1,washAmount:.07,rockBrush:1.1,rockBrushAmount:.22},nature:{leaf:"#7cba48",leafShade:"#467f2c",trunk:"#8a8068",pine:"#4f7a58",pineShade:"#36584a",pineTrunk:"#5f4a3a",sapling:"#668760",saplingShade:"#4c6a52",bush:"#76ab4e",bushShade:"#4c7c36",grassBase:"#5f9550",grassTip:"#a2cf6c",grassBand:"#aed690",flowerA:"#f7e45c",flowerB:"#e6e2d2",flowerShare:.12,clumpDark:.68,bandAmount:.5,rim:.3,rock:"#8c9391",rockDark:"#4b5853",moss:"#8fb25a",mossDark:"#5c853d",mossLevel:.84,rockShadeTint:[.8,1,1.02],rockShadeDirect:.22,leafCell:.5,leafLight:.16,leafGap:.24},rock:{granite:"#a0a4a6",spread:.15},pattern:{amount:.85,dark:.8,light:1.15,darkTone:.8,lightTone:1.12,fadeNear:12,fadeFar:50,warmth:.35,gain:2.2,minLuma:.12,maxLuma:.36},trail:{soil:"#a48c70",rock:"#8c9391",paved:"#bdb6aa",stairs:"#a39a8c",deck_stairs:"#a0764a",ridge:"#a9aeab"},water:"#3e8878",stream:{day:{deep:"#3e8878",shallow:"#8bc6af",foam:"#e6f3ee",streak:"#6fae9e",sparkle:1},sunset:{deep:"#a4889c",shallow:"#dcc8c4",foam:"#fff0ea",streak:"#f3dcd6",sparkle:.8},night:{deep:"#26393a",shallow:"#394746",foam:"#7f9399",streak:"#4b5f62",sparkle:.15},opacity:.9,bed:"#8c9391"},lightShafts:.4},Ss=Object.keys(j.trail),Dt=(e,t=0,o=1)=>Math.max(t,Math.min(o,e)),pa=(e,t,o)=>{const a=Dt((o-e)/(t-e));return a*a*(3-2*a)},te=(e,t,o)=>e+(t-e)*o;function ft(e){const t=parseInt(String(e).replace("#",""),16);return[(t>>16&255)/255,(t>>8&255)/255,(t&255)/255]}const he=(e,t,o)=>e.map((a,r)=>te(a,t[r],o));function Lt(e={}){const t=Number.isFinite(e.elevation)?e.elevation:30,o=Dt(Number.isFinite(e.night)?e.night:pa(-2,-12,t)),a=pa(6,16,t),r=Dt(a*(1-o)),s=Dt((1-a)*(1-o));return{day:r,sunset:s,night:o}}const Nt=(e,t,o,a)=>t*e.day+o*e.sunset+a*e.night,io=(e,t,o,a)=>[0,1,2].map(r=>Nt(e,t[r],o[r],a[r]));function Ms(e){const t=Lt(e),{day:o,sunset:a,night:r}=j.bloom;return{threshold:Nt(t,o.threshold,a.threshold,r.threshold),strength:Nt(t,o.strength,a.strength,r.strength),radius:Nt(t,o.radius,a.radius,r.radius)}}function ks(e={}){const t=Lt(e),o=j.grade,a=Dt(e.gray??0),r=ft(o.day.tint),s=ft(o.sunset.amber),n=ft(o.sunset.violet),i=ft(o.night.tint),l=io(t,r,s,i),c=io(t,ft(o.shadow),n,i);return{saturation:Nt(t,o.day.saturation,o.sunset.saturation,o.night.saturation)*te(1,.8,a),contrast:Nt(t,o.day.contrast,o.sunset.contrast,o.night.contrast),lift:Nt(t,o.day.lift,o.sunset.lift,o.night.lift),shadowGain:Nt(t,o.day.shadowGain,o.sunset.shadowGain,o.night.shadowGain),highlight:l,highlightAmount:Nt(t,o.day.tintAmount,o.sunset.tintAmount,o.night.tintAmount)*te(1,.5,a),shadow:he(ft(o.shadow),c,.5),shadowAmount:(o.shadowAmount+(o.dayShadowAmount-o.shadowAmount)*t.day)*te(1,.6,t.night)}}function zs(e){const t=Lt(e),o=j.outline.strength;return{color:he(ft(j.outline.day),ft(j.outline.night),t.night),strength:Nt(t,o.day,o.sunset,o.night),fadeNear:j.outline.fadeNear,fadeFar:j.outline.fadeFar}}function Ts(e=1){return j.outline.width[Dt(Math.round(e),0,2)]}function _s(e={}){const t=Lt(e),o=j.sky,a=Dt(e.gray??0),r=(c,u)=>c[u]?ft(c[u]):u==="mid"?he(ft(c.horizon),ft(c.zenith),.65):u==="pink"?he(ft(c.horizon),ft(c.zenith),.3):u==="cloudLit"?ft(c.cloud):u==="city"?ft(c.horizon):null,s=c=>c==="city"?ft(o.cityGlow.input):r(o.night,c)??ft(o.night[c]),n=c=>io(t,r(o.day,c)??ft(o.day[c]),r(o.sunset,c)??ft(o.sunset[c]),s(c)),i=c=>{const u=c[0]*.2126+c[1]*.7152+c[2]*.0722;return he(c,[u,u,u],a*.75)},l=Dt(.35+.55*(e.cloud??0));return{zenith:i(n("zenith")),mid:i(n("mid")),pink:i(n("pink")),horizon:i(n("horizon")),city:i(n("city")),cloud:i(n("cloud")),cloudShade:i(n("cloudShade")),cloudLit:i(n("cloudLit")),stars:Dt(Math.max(e.stars??t.night*(1-a),t.sunset*.12*(1-a)))*o.starIntensity,milky:Dt(t.night*(1-a)*(1-Dt((e.moon?.illumination??0)*(e.moon?.visible??0))*.5))*o.milky.strength,cityGlow:t.night*o.cityGlow.strength*(1-a*.5),cloudCover:Dt(Nt(t,l,Math.max(o.cover.sunset,l),Math.max(o.cover.night,l))),weights:t}}function So(e,t=0){const o=e*Math.PI/180,a=t*Math.PI/180;return[Math.sin(o)*Math.cos(a),Math.sin(a),-Math.cos(o)*Math.cos(a)]}function Cs(e={}){return te(1,j.nightExposure,Lt(e).night)}function Ds(e={}){const t=Lt(e);return t.day+t.sunset*j.sunsetLight+t.night*j.nightLight}function ga(e={}){const t=Lt(e),o=j.stream,a=Dt(e.gray??0),r=n=>{const i=n[0]*.2126+n[1]*.7152+n[2]*.0722;return he(n,[i,i,i],a*.5)},s=n=>r(io(t,ft(o.day[n]),ft(o.sunset[n]),ft(o.night[n])));return{deep:s("deep"),shallow:s("shallow"),foam:s("foam"),streak:s("streak"),sparkle:Nt(t,o.day.sparkle,o.sunset.sparkle,o.night.sparkle)*(1-a*.8),opacity:o.opacity,bedRgb:ft(o.bed),weights:t}}function As(e={}){const t=Dt((e.windSpeed??3)/12,0,1);return{speed:te(.8,2.2,t),strength:te(.7,1,t)}}function Qa(e=j.gradient){if(!e.length||e.length>3)throw new Error("gradientMap은 1~3단");const t=new Uint8Array(e.length*4);e.forEach((a,r)=>{const s=Math.round(Math.max(0,Math.min(1,a))*255);t.set([s,s,s,255],r*4)});const o=new Hn(t,e.length,1,In);return o.minFilter=o.magFilter=On,o.generateMipmaps=!1,o.colorSpace=Gn,o.name=`toon-gradient-${e.length}`,o.userData.shared=!0,o.userData.levels=[...e],o.needsUpdate=!0,o}const Fs="float ttHash(vec2 p){vec3 p3=fract(vec3(p.x,p.y,p.x)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}",lt=Math.fround,ht=(e,t)=>lt(lt(e)+lt(t)),yt=(e,t)=>lt(lt(e)*lt(t)),De=e=>lt(e-Math.floor(e)),Mo=(e,t,o)=>ht(yt(e,lt(1-o)),yt(t,o));function Ge(e,t){let o=De(yt(e,.1031)),a=De(yt(t,.1031)),r=o;const s=ht(ht(yt(o,ht(a,33.33)),yt(a,ht(r,33.33))),yt(r,ht(o,33.33)));return o=ht(o,s),a=ht(a,s),r=ht(r,s),De(yt(ht(o,a),r))}function ko(e,t){e=lt(e),t=lt(t);const o=Math.floor(e),a=Math.floor(t);let r=De(e),s=De(t);return r=yt(yt(r,r),lt(3-yt(2,r))),s=yt(yt(s,s),lt(3-yt(2,s))),Mo(Mo(Ge(o,a),Ge(o+1,a),r),Mo(Ge(o,a+1),Ge(o+1,a+1),r),s)}function Te(e,t){return e=lt(e),t=lt(t),ht(ht(yt(ko(e,t),.58),yt(ko(ht(yt(e,2.13),5.2),ht(yt(t,2.13),1.3)),.28)),yt(ko(ht(yt(e,4.71),1.7),ht(yt(t,4.71),9.2)),.14))}function Rs(e,t){return Te(ht(lt(lt(e)/45),3.7),ht(lt(lt(t)/45),8.1))}const Ae=(e,t,o)=>{const a=Math.max(0,Math.min(1,(o-e)/(t-e)));return a*a*(3-2*a)},vl=.42;function xl(e,t,o,a){const r=Rs(e,t);return Math.max(a*(.5/.28)+(r-.5)*.32,Ae(500,600,o)*(.22+.62*Ae(.35,.75,r))+Ae(600,625,o)*.3)}const Ns=.03;function yl(e,t,o,a){if(a>=.3)return!1;const r=Te(ht(lt(o/2.2),7),ht(lt(lt(lt(e)*.71+lt(t)*.71)/28),2))*.6+Te(ht(lt(lt(e)/6),3),ht(lt(lt(t)/6),9))*.4,s=Te(ht(lt(lt(e)/6.5),4),ht(lt(lt(t)/6.5),1))*.6+Te(ht(lt(lt(e)/2.3),8),ht(lt(lt(t)/2.3),3))*.4,n=.53+(.47-.53)*Ae(600,625,o);return(1-Ae(.2,.36,a))*(r*.2+s*.8>n+Ns?1:0)>.5}const Ws=Object.freeze({blending:Kn,blendEquation:jn,blendSrc:Vn,blendDst:da,blendSrcAlpha:Un,blendDstAlpha:da}),$o=/[?&]fx=off(&|$)/.test(globalThis.location?.search??""),wt={fxTime:{value:0},fxSun:{value:new N(0,1,0)},fxSunVis:{value:1},fxLowSun:{value:0},fxQuality:{value:2},fxRain:{value:0},fxWind:{value:.3}},Fe={dapple:{scale:.34},shafts:{count:[16,40,64],radius:15,height:16,strength:1.15,warmLow:.55},canopy:{from:430,to:520,summitFrom:600,summitTo:625,ridgeFloor:.28,summitFloor:.1}},Qe=(e,t=0,o=1)=>Math.max(t,Math.min(o,e)),lo=(e,t,o)=>{const a=Qe((o-e)/(t-e));return a*a*(3-2*a)};function wl(e,t=Fe.canopy){if(!Number.isFinite(e))return 1;const o=lo(t.from,t.to,e),a=lo(t.summitFrom,t.summitTo,e),r=1+(t.ridgeFloor-1)*o;return r+(t.summitFloor-r)*a}function bl({time:e,sunVector:t,environment:o,quality:a=2,mobile:r=!1,camera:s=null}){const n=o,i=n.light?.elevation??n.elevation??45;wt.fxTime.value=e,wt.fxSun.value.copy(t);const l=$o?0:Qe((n.light?.intensity??1)*(1-.9*(n.gray??0))*(1-(n.night??0)))*lo(1,7,i);return wt.fxSunVis.value=l,wt.fxLowSun.value=lo(38,6,i)*l,wt.fxQuality.value=r?0:a,wt.fxRain.value=Qe(n.rain??0),wt.fxWind.value=Qe((n.windSpeed??2)/9),{direct:l,elevation:i}}`${Fe.canopy.from.toFixed(1)}${Fe.canopy.to.toFixed(1)}${Fe.dapple.scale.toFixed(3)}`;const Ls=`
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
}`,Ps=`
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
}`;function Sl({mobile:e=!1}={}){const t=Fe.shafts,o=t.count[2],a=new Qo(1,1,1,1),r=new qn;r.index=a.index,r.attributes.position=a.attributes.position,r.attributes.uv=a.attributes.uv;const s=new Float32Array(o*4),n=f=>(f=f*.1031%1,f*=f+33.33,f*=f+f,f-Math.floor(f));for(let f=0;f<o;f++)s.set([n(f*3.7+1),n(f*5.3+2),n(f*7.9+3),n(f*11.1+4)],f*4);r.setAttribute("aSeed",new Zn(s,4)),r.instanceCount=t.count[e?0:2];const i={...wt,fxCam:{value:new N},fxRadius:{value:t.radius},fxHeight:{value:t.height},fxWidthMul:{value:1},fxCount:{value:o},fxStrength:{value:t.strength},fxColor:{value:new rt(1,.92,.72)},fxCanopy:{value:1}},l=new zt({uniforms:i,vertexShader:Ls,fragmentShader:Ps,transparent:!0,depthWrite:!1,depthTest:!1,...Ws,side:Ct,fog:!1,toneMapped:!0}),c=new At(r,l);c.frustumCulled=!1,c.renderOrder=5,c.name="빛줄기";const u=new rt;return{mesh:c,material:l,update({camera:f,sunColor:h,quality:m,canopy:d,lowSun:g}){const p=l.uniforms;p.fxCam.value.copy(f.position),u.setRGB(...h,gt);const x=wt.fxLowSun.value*t.warmLow;p.fxColor.value.set(1,.93-.18*x,.78-.38*x).multiply(u.clone().multiplyScalar(1/Math.max(.001,Math.max(u.r,u.g,u.b)))),p.fxCanopy.value=d,r.instanceCount=t.count[e?0:Math.max(0,Math.min(2,m))],c.visible=d*wt.fxSunVis.value>.02&&r.instanceCount>0,p.fxWidthMul.value=1+.25*g}}}const ae={foliageTime:{value:0}};function Ja(e=""){return/_(leaves|twig)$/.test(e)?"leaf":/(branch|trunk|bark|dead)/.test(e)?"bark":"card"}function Bs(e,{name:t=e.name,pine:o=!1}={}){if(!e||e.userData.foliagePatched)return e;const a=Ja(t),r=e.onBeforeCompile,s=e.customProgramCacheKey?.bind(e),n=o?.55:1,i=a==="bark"?0:o?.45:.85,l=a==="bark"?0:a==="leaf"?1:.35;return e.userData.foliagePatched={kind:a,pine:o,recolor:n,transmission:i,sway:l},e.onBeforeCompile=function(c,u){r?.call(this,c,u),c.uniforms.foliageTime=ae.foliageTime,c.uniforms.fxSunVis=wt.fxSunVis,c.uniforms.fxLowSun=wt.fxLowSun,c.vertexShader=c.vertexShader.replace("#include <common>",`#include <common>
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
    #if NUM_DIR_LIGHTS > 0 && ${i>0?1:0}
    {
     // 해를 등진 잎이 비쳐 보이는 투과광. 시선이 해 쪽을 향할수록, 잎 뒷면이 해를 받을수록 밝다.
     vec3 foliageL=directionalLights[0].direction,foliageV=normalize(vViewPosition);
     float foliageBack=pow(clamp(dot(-foliageV,foliageL),0.,1.),4.);
     float foliageThrough=clamp(-dot(normal,foliageL),0.,1.);
     vec3 foliageGlow=diffuseColor.rgb*vec3(1.,.93,.7)*directionalLights[0].color*(foliageBack*.9+foliageThrough*.28);
     reflectedLight.directDiffuse+=foliageGlow*foliageLeafMask*${i.toFixed(2)};
     // 역광 잎 투과광 강화(light-fx): 맑은 날 해를 마주 보면 잎이 노랗게 비치고, 해가 낮을수록 더 진하다. ?fx=off·흐림·밤엔 0.
     float foliageRim=pow(clamp(dot(-foliageV,foliageL),0.,1.),2.5)*fxSunVis*(.5+.9*fxLowSun);
     reflectedLight.directDiffuse+=diffuseColor.rgb*vec3(1.25,1.,.5)*directionalLights[0].color*foliageRim*foliageLeafMask*${i.toFixed(2)};
    }
    #endif`)},e.customProgramCacheKey=()=>`${s?.()??""}|foliage-v2-${a}-${o?"pine":"broad"}`,e.needsUpdate=!0,e}function Es(){const e=new Wt({color:16777215,roughness:.92,envMapIntensity:.35,side:Ct});return e.onBeforeCompile=t=>{t.uniforms.foliageTime=ae.foliageTime,t.uniforms.fxSunVis=wt.fxSunVis,t.uniforms.fxLowSun=wt.fxLowSun,t.vertexShader=t.vertexShader.replace("#include <common>",`#include <common>
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
    #endif`)},e.customProgramCacheKey=()=>"shrub-layer-wind-v2-rim",e}const va="toon-local-light-cap",zo="#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )";function $s(e=j.localLightCap){const t=Xn.toon;if(t.fragmentShader.includes(va))return!0;const o=Po.lights_fragment_begin;if(!o.includes(zo)||!t.fragmentShader.includes("#include <lights_fragment_begin>"))return!1;const a=o.replace(zo,`// ${va}
 {vec3 tlK=material.diffuseColor*${e.toFixed(3)}+1e-4;reflectedLight.directDiffuse=reflectedLight.directDiffuse*tlK/(reflectedLight.directDiffuse+tlK);}
${zo}`);return t.fragmentShader=t.fragmentShader.replace("#include <lights_fragment_begin>",a),!0}const Ho=`
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
}`,Io="vec3 trcBaseN=vec3(0.,0.,1.);",Oo=(e,t)=>`
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
#endif`,Je=`
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
`,tn={spring:0,summer:1,autumn:2,winter:3},We={tsW:{value:new Ka(0,1,0,0)}},Et=e=>new rt().setRGB(...ft(e),gt),co=e=>e.r*.2126+e.g*.7152+e.b*.0722,ut=e=>`vec3(${e.r.toFixed(4)},${e.g.toFixed(4)},${e.b.toFixed(4)})`,Hs=co(Et("#7cba48"))/co(Et("#61973b")),Is=co(Et("#467f2c"))/co(Et("#3f7124")),Os=(e,t)=>({lit:Et(e).multiplyScalar(Hs),shade:Et(t).multiplyScalar(Is)}),en={cherry:["#f7cbd8","#dc9bb1"],cherryPale:["#f6dee3","#d2b0b9"],newLeaf:["#9cc95c","#719a3f"],azalea:["#f08cb4","#c4628a"],red:["#d24a30","#943222"],orange:["#d68f38","#9a652a"],brown:["#b07a3e","#80582c"],yellow:["#e2b434","#a68226"],pine:["#4f7a3a","#36562a"],bark:["#5f554c","#433b35"],twig:["#8d8079","#6a5f5b"],snow:["#d2dbe8","#aebdd4"],trampled:["#a8a49f","#857f78"],litter:["#9a6e42","#704f30"],petal:["#f1d6dc","#f1d6dc"]},Zt={red:.34,orange:.26,brown:.16,green:.03},se={low:.36,high:.14,lowHeight:250,highHeight:450},Gs=new Set(["snow","trampled","litter","petal","bark"]),dt=Object.fromEntries(Object.entries(en).map(([e,[t,o]])=>[e,Gs.has(e)?{lit:Et(t),shade:Et(o)}:Os(t,o)])),Us={summer:null,spring:{meadow:"#b2dc80",meadowFar:"#b2d39c",forest:"#6a9c44",highForest:"#7cab55"},autumn:{meadow:"#c8b56c",meadowFar:"#bab18c",forest:"#a2672f",highForest:"#ab7c3e"},winter:{meadow:"#b3a58a",meadowFar:"#b9b3ab",forest:"#7d6e68",highForest:"#887b76"}},re={spring:["#b8dc72","#78a84c"],autumn:["#e2c25c","#b48a3e"],winter:["#e2ddd2","#b9ab90"]},xa={summer:null,spring:["#6aa452","#b8de74"],autumn:["#9a7a3a","#e0bc62"],winter:["#cbd4e0","#a8987c"]},Yt=`
uniform vec4 tsW;
float tsH(float x){return fract(sin(x*91.345+3.17)*47453.5453);}
float tsLuma(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
// 여름 잎의 밝은 면·그늘 사이 위치(0~1.3)로 계절 색 짝을 칠한다(덩어리 명암·잎 그늘을 그대로 옮긴다).
vec3 tsPair(float t,vec3 lit,vec3 shade){return mix(shade,lit,t);}
vec3 tsAutumn(float h,float t){
 return h<${Zt.red.toFixed(3)}?tsPair(t,${ut(dt.red.lit)},${ut(dt.red.shade)}):
  h<${(Zt.red+Zt.orange).toFixed(3)}?tsPair(t,${ut(dt.orange.lit)},${ut(dt.orange.shade)}):
  h<${(Zt.red+Zt.orange+Zt.brown).toFixed(3)}?tsPair(t,${ut(dt.brown.lit)},${ut(dt.brown.shade)}):
  h<${(1-Zt.green).toFixed(3)}?tsPair(t,${ut(dt.yellow.lit)},${ut(dt.yellow.shade)}):vec3(-1.);
}
float tsCherry(float h,float y){return step(h,mix(${se.low.toFixed(3)},${se.high.toFixed(3)},smoothstep(${se.lowHeight.toFixed(1)},${se.highHeight.toFixed(1)},y)));}
vec3 tsSpringLeaf(float t,float h,float y){return mix(tsPair(t,${ut(dt.newLeaf.lit)},${ut(dt.newLeaf.shade)}),tsPair(t,${ut(dt.cherry.lit)},${ut(dt.cherry.shade)}),tsCherry(h,y));}
// 활엽수 잎: c = 여름 정점색, t = 밝은 면 위치, h = 나무 난수, y = 나무 밑동 높이(m).
vec3 tsLeafColor(vec3 c,float t,float h,float y){
 vec3 spring=tsSpringLeaf(t,h,y);
 vec3 a=tsAutumn(fract(h*7.13+.21),t);vec3 autumn=a.x<0.?c:a;
 return c*tsW.y+spring*tsW.x+autumn*tsW.z+c*tsW.w;
}
// 덤불·생울타리 잎: 봄은 새잎 연두에 진달래 분홍 약 20%, 가을은 단풍 섞임.
vec3 tsBushColor(vec3 c,float t,float h){
 vec3 spring=mix(tsPair(t,${ut(dt.newLeaf.lit)},${ut(dt.newLeaf.shade)}),tsPair(t,${ut(dt.azalea.lit)},${ut(dt.azalea.shade)}),step(fract(h*3.71),.2));
 vec3 a=tsAutumn(fract(h*5.31+.6),t);vec3 autumn=a.x<0.?c:a;
 return c*(tsW.y+tsW.w)+spring*tsW.x+autumn*tsW.z;
}
const vec3 TS_SNOW=${ut(dt.snow.lit)};const vec3 TS_SNOW_SHADE=${ut(dt.snow.shade)};
const vec3 TS_BARK=${ut(dt.bark.lit)};const vec3 TS_TWIG=${ut(dt.twig.lit)};const vec3 TS_TWIG_SHADE=${ut(dt.twig.shade)};
const vec3 TS_PINE=${ut(dt.pine.lit)};const vec3 TS_PINE_SHADE=${ut(dt.pine.shade)};
const vec3 TS_TRAMPLED=${ut(dt.trampled.lit)};const vec3 TS_TRAMPLED_SHADE=${ut(dt.trampled.shade)};
const vec3 TS_PETAL=${ut(Et(en.petal[0]))};
const vec3 TS_RED=${ut(dt.red.lit)};const vec3 TS_ORANGE=${ut(dt.orange.lit)};const vec3 TS_YELLOW=${ut(dt.yellow.lit)};const vec3 TS_BROWN=${ut(dt.brown.lit)};
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
 float autumn=leaf*step(h,.3)*tsW.z,spring=leaf*step(h,.13)*tsW.x*(1.-smoothstep(${se.lowHeight.toFixed(1)},${se.highHeight.toFixed(1)},y));
 float k=fract(h*7.7);vec3 ac=k<.35?TS_RED:k<.65?TS_ORANGE:k<.85?TS_YELLOW:TS_BROWN;
 float a=(autumn+spring)*fade;
 return vec4((ac*autumn+TS_PETAL*spring)/max(autumn+spring,1e-3),a);
}
`,pe=e=>{e.uniforms.tsW=We.tsW};function Vs(e){const t=[0,0,0,0];return t[tn[e]??1]=1,t}function js({tau:e=1.2}={}){const t=new Ka(0,1,0,0),o=We.tsW.value;let a="summer",r=!0;return{set(s){return s in tn?(a=s,t.fromArray(Vs(s)),!0):!1},snap(){r=!0},update(s){if(r)return o.copy(t),r=!1,o;const n=1-Math.exp(-Math.max(0,Math.min(s,.5))/e);return o.lerp(t,n),Math.abs(o.x-t.x)+Math.abs(o.y-t.y)+Math.abs(o.z-t.z)+Math.abs(o.w-t.w)<.001&&o.copy(t),o},get name(){return a},get weights(){return o.toArray().map(s=>Math.round(s*1e3)/1e3)}}}function To(e,t,o,a){e.setRGB(0,0,0);const r=new rt;return["spring","summer","autumn","winter"].forEach((s,n)=>{const i=o?.[s];r.copy(i?Et(i):t),e.r+=r.r*a[n],e.g+=r.g*a[n],e.b+=r.b*a[n]}),e}const on=Et,Tt=e=>new rt().setRGB(...ft(e),gt),_o=e=>{const t=Tt(e);return`vec3(${t.r.toFixed(4)},${t.g.toFixed(4)},${t.b.toFixed(4)})`},jt={toonWaveA:{value:Tt(j.foliage.waveA)},toonWaveB:{value:Tt(j.foliage.waveB)},toonWindDir:{value:new Mt(.8,.6)},toonWaveSpeed:{value:1.2},toonWaveStrength:{value:1}},Ks={value:new rt(.85,.95,1)},ke=e=>(e.userData.shared=!0,e),Ue=e=>e.r*.2126+e.g*.7152+e.b*.0722,qs=.1;function Zs(e){const t=e?.image;if(!t||typeof document>"u"||!(t.width>0))return null;try{const o=document.createElement("canvas");o.width=o.height=8;const a=o.getContext("2d",{willReadFrequently:!0});a.drawImage(t,0,0,8,8);const r=a.getImageData(0,0,8,8).data;let s=0,n=0,i=0;for(let u=0;u<r.length;u+=4)s+=r[u],n+=r[u+1],i+=r[u+2];const l=r.length/4*255,c=new rt;return e.colorSpace===gt?c.setRGB(s/l,n/l,i/l,gt):c.setRGB(s/l,n/l,i/l,Yn)}catch{return null}}const ya=`
vec3 toonWaveColor(vec3 world){
 float along=dot(world.xz,toonWindDir);
 float wave=sin(along*.045-foliageTime*toonWaveSpeed)*.62+sin(along*.13+world.x*.017-foliageTime*toonWaveSpeed*1.7)*.38;
 return mix(toonWaveA,toonWaveB,wave*.5+.5);
}`,Co="uniform vec3 toonWaveA;uniform vec3 toonWaveB;uniform vec2 toonWindDir;uniform float toonWaveSpeed;uniform float toonWaveStrength;uniform float foliageTime;",Do=e=>Object.assign(e.uniforms,jt,{foliageTime:ae.foliageTime}),Ao=e=>`
{
 vec4 ${e}W=vec4(transformed,1.);vec3 ${e}N=objectNormal;
 #ifdef USE_INSTANCING
 ${e}W=instanceMatrix*${e}W;${e}N=mat3(instanceMatrix)*${e}N;
 #endif
 v${e}World=(modelMatrix*${e}W).xyz;v${e}Up=normalize(mat3(modelMatrix)*${e}N).y;
}`;function Xs({gradientMap:e,softAutumnDistance:t=!1}){const o={converted:0,reused:0,blobs:0,cutoutMeshes:0,skipped:0,foliage:0,localLightCap:$s()},a=(b={})=>new Ye({gradientMap:e,...b});function r(b,{name:G=b?.name??"",kind:J,pine:X=!1,wind:et=!0}={}){if(!b||b.userData.toonFoliage)return b;const ot=Ja(G),at=J??(/grass|풀/.test(G)||/^pine_sapling.*_(twig|dead_branches)$/.test(G)?"grass":/_twig$/.test(G)?"needle":ot);et&&Bs(b,{name:at==="grass"?"grass_leaves":G,pine:X});const T=j.foliage,B={grass:T.grassFlat,needle:T.needleFlat}[at],$=at==="bark"?0:B?B.strength:T.leafWave,V=B?`vec3(${B.brightness.toFixed(3)})`:"vec3(clamp(tfLuma*2.4,.3,1.25))",Z=at==="bark"?[.9,1.04]:[T.bottom,T.top],tt=b.onBeforeCompile,Y=b.customProgramCacheKey.bind(b);return b.onBeforeCompile=function(nt,mt){tt.call(this,nt,mt),Do(nt),nt.vertexShader=nt.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vTfWorld;varying float vTfUp;`).replace("#include <project_vertex>",`#include <project_vertex>
`+Ao("Tf")),nt.fragmentShader=nt.fragmentShader.replace("#include <common>",`#include <common>
varying vec3 vTfWorld;varying float vTfUp;
${Co}
${ya}`).replace("#include <alphamap_fragment>",`
     {
      // 잎은 텍스처 디테일 대신 덩어리 단색: 명도만 남기고 물결색을 섞는다.
      float tfLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
      vec3 tfWave=toonWaveColor(vTfWorld)*${V};
      diffuseColor.rgb=mix(diffuseColor.rgb,tfWave,${$.toFixed(3)}*toonWaveStrength);
      diffuseColor.rgb*=mix(${Z[0].toFixed(3)},${Z[1].toFixed(3)},clamp(vTfUp*.5+.5,0.,1.));
     }
     #include <alphamap_fragment>`),at==="grass"&&!b.transparent&&(nt.fragmentShader=nt.fragmentShader.replace("#include <opaque_fragment>",`#include <opaque_fragment>
 gl_FragColor.a=min(gl_FragColor.a,.5);`))},b.customProgramCacheKey=()=>`${Y()}|toon-foliage-v1-${at}`,b.userData.toonFoliage={kind:at,strength:$},b.needsUpdate=!0,o.foliage++,b}const s=new Map;let n;function i({vertexColors:b=!1,stableHash:G=!1}={}){const J=`${b}:${G}`;if(s.has(J))return s.get(J);n??=Qa(j.terrainGradient);const X=j.terrain,et=ke(a({color:16777215,vertexColors:b,name:"toon-terrain",gradientMap:n})),ot=B=>Tt(X[B]),at=G?i({vertexColors:b}).userData.toonUniforms:{tMeadow:{value:ot("meadow")},tMeadowFar:{value:ot("meadowFar")},tForest:{value:ot("forest")},tHigh:{value:ot("highForest")},tRock:{value:ot("rock")},tRockDark:{value:ot("rockDark")},tSoil:{value:ot("soil")},tMoss:{value:Tt(j.nature.moss)},tMossDark:{value:Tt(j.nature.mossDark)}};et.userData.toonUniforms=at;const T=B=>B.toFixed(4);return et.onBeforeCompile=B=>{Object.assign(B.uniforms,at),Do(B),pe(B),B.vertexShader=B.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vTtWorld;varying float vTtUp;varying vec3 vTtN;`).replace("#include <project_vertex>",`#include <project_vertex>
`+Ao("Tt")+`
vTtN=normalize(mat3(modelMatrix)*objectNormal);`),B.fragmentShader=B.fragmentShader.replace("#include <common>",`#include <common>
    varying vec3 vTtWorld;varying float vTtUp;varying vec3 vTtN;uniform vec3 tMeadow,tMeadowFar,tForest,tHigh,tRock,tRockDark,tSoil,tMoss,tMossDark;
    ${Ho}${Io}${Je}
    ${Co}
${ya}
    ${G?Fs:"float ttHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}"}
    float ttNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(ttHash(i),ttHash(i+vec2(1,0)),f.x),mix(ttHash(i+vec2(0,1)),ttHash(i+vec2(1,1)),f.x),f.y);}
    float ttFbm(vec2 p){return ttNoise(p)*.58+ttNoise(p*2.13+vec2(5.2,1.3))*.28+ttNoise(p*4.71+vec2(1.7,9.2))*.14;}
    // 경계 폭을 화면 미분으로 잡아 계단·깜빡임 없이 두 톤으로 끊는다.
    float ttCut(float x,float at){float w=max(fwidth(x),.004);return smoothstep(at-w,at+w,x);}
    float ttRockMask=0.,ttSnow=0.;vec3 ttBumpN=vec3(0.,1.,0.);
    ${Yt}`).replace("#include <color_fragment>",`#include <color_fragment>
    {
     vec2 xz=vTtWorld.xz;float slope=1.-clamp(vTtUp,0.,1.),h=vTtWorld.y,dist=length(vViewPosition);
     // 먼 곳(픽셀보다 잘아지는 무늬)은 평균으로 접는다.
     float farFade=smoothstep(500.,1800.,dist);
     // ① 풀밭: 가까이 연두 → 멀리 밝고 푸른 연두. 바람결 줄무늬는 가까운 풀밭에만 약하게.
     vec3 meadow=mix(tMeadow,tMeadowFar,smoothstep(120.,1400.,dist));
     meadow=mix(meadow,toonWaveColor(vTtWorld)*1.02,.14*toonWaveStrength*(1.-smoothstep(60.,400.,dist)));
     // ② 숲 덩어리(약 ${X.forestScale}m): 능선 위로는 줄어든다. 숲 안은 덩어리 명암 두 톤.
     float blob=ttFbm(xz/${T(X.forestScale)});
     // 중경(정상에서 내려다보는 250m~ 사면)은 관악산 실제처럼 숲이 사면 대부분을 덮는다(참고 05_14: 짙은 녹색 나무 무리).
     float midWood=smoothstep(250.,900.,dist)*(1.-smoothstep(${T(X.ridgeHeight)},${T(X.ridgeHeight+60)},h));
     float forestT=mix(blob,.5,farFade*.5)+slope*.35-smoothstep(${T(X.ridgeHeight)},${T(X.ridgeHeight+80)},h)*.3+midWood*.3;
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
      vec3 crownColor=tsCrown(tForest*vec3(.86,1.06,.62),ttHash(bid+3.3),h)*mix(.42,mix(.66,.96,lit),crown);
      ${t?"float autumnDistance=tsW.z*smoothstep(300.,1000.,dist);float autumnWash=ttFbm(xz/180.+vec2(4.3,8.1));crownColor=mix(crownColor,tForest*vec3(.86,1.06,.62)*mix(.58,.82,autumnWash),autumnDistance);":""}
      wood+=lw*crownColor;woodMask+=lw*fade;
     }
     green=mix(green,wood,midWood*forest*woodMask);
     green=mix(green,tForest*vec3(.86,1.06,.62)*.66,midWood*forest*(1.-woodMask));
     // 아주 먼 사면만 숲·풀밭 대비를 줄인다(원경은 덩어리 하나의 녹색 톤 + 안개). 중경 숲은 짙게 남긴다.
     green=mix(green,mix(meadow,tForest*.86,.78),smoothstep(1000.,2800.,dist)*.5*(1.-midWood*.8));
     green=mix(green,tHigh,smoothstep(${T(X.forestHeight)},${T(X.forestHeight+50)},h)*.45*(1.-forest*.5));
     // 붓질 그라데이션(카툰 2차, 참고 03_03·03_08·05_19): 풀밭·숲 바닥에 바람 방향 짧은 붓 자국(밝은 자국은 노란 연두,
     // 어두운 자국은 푸른 녹색) + 수십 m 크기의 칠 얼룩. 붓 자국이 픽셀보다 잘아지면 접는다.
     float bpx=dist*.0014/max(vTtUp,.3);
     float bs1=bsStroke(xz,toonWindDir,${T(X.brushNear)})*bsFade(bpx,${T(X.brushNear)});
     float bs2=bsStroke(xz*vec2(1.,1.)+vec2(31.,7.),normalize(vec2(-toonWindDir.y,toonWindDir.x)*.4+toonWindDir),${T(X.brushMid)})*bsFade(bpx,${T(X.brushMid)});
     float bwash=(ttFbm(xz/34.+vec2(2.,5.))-.5)*2.*(1.-smoothstep(900.,2400.,dist));
     float bt=bs1*.55+bs2*.45;
     green*=1.+bt*${T(X.brushAmount)}+bwash*${T(X.washAmount)};
     green=mix(green,green*vec3(1.07,1.05,.86),clamp(bt+bwash*.5,0.,1.)*.45);
     green=mix(green,green*vec3(.9,.98,1.06),clamp(-bt,0.,1.)*.35);
     // ③ 암반: 경사 rockSlope(약 44°)에서 0.5. 고지(rockHeight 위)는 덩어리 얼룩이 짙은 곳부터, 정상부는 거의 전부.
     float rn=mix(ttFbm(xz/${T(X.rockScale)}+vec2(3.7,8.1)),.5,farFade);
     float slopeRock=slope*${T(.5/X.rockSlope)}+(rn-.5)*.32;
     float altRock=smoothstep(${T(X.rockHeight[0])},${T(X.rockHeight[1])},h)*(.22+.62*smoothstep(.35,.75,rn))+smoothstep(${T(X.summitHeight[0])},${T(X.summitHeight[1])},h)*.3;
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
     float ledge=(1.-smoothstep(.2,.36,slope))*ttCut(mix(ledgeN,patchN,.8),mix(.53,.47,smoothstep(${T(X.summitHeight[0])},${T(X.summitHeight[1])},h)));
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
     ${Oo("ttRockMask",j.nature.rockShadeDirect.toFixed(3))}`)},et.customProgramCacheKey=()=>`toon-terrain-v8-season-${b}-${G}-${t}`,s.set(J,et),et}const l=new WeakMap;function c(b=i()){if(!l.has(b)){const G=b.clone();G.onBeforeCompile=b.onBeforeCompile,G.customProgramCacheKey=b.customProgramCacheKey,G.userData={...b.userData,shared:!0,toonUnderlay:!0},G.polygonOffset=!0,G.polygonOffsetFactor=4,G.polygonOffsetUnits=8,l.set(b,G)}return l.get(b)}function u(b,{cell:G=[3.2,2.6,3.2],amt:J=.8,crack:X=.7,edge:et=!1,moss:ot=-.32}={}){return b.onBeforeCompile=at=>{pe(at),at.vertexShader=at.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vTsWorld;varying float vTsUp;varying vec3 vTsN;`+(et?"attribute float trailEdge;varying float vTsSide;":"")).replace("#include <project_vertex>",`#include <project_vertex>
`+Ao("Ts")+`
vTsN=normalize(mat3(modelMatrix)*objectNormal);`+(et?"vTsSide=trailEdge;":"")),at.fragmentShader=at.fragmentShader.replace("#include <common>",`#include <common>
    varying vec3 vTsWorld;varying float vTsUp;varying vec3 vTsN;vec3 tsBumpN=vec3(0.,1.,0.);float tsFlat=0.,tsMoss=0.,tsSnowAmt=0.;${Io}${et?"varying float vTsSide;":""}
    ${Ho}${Je}${Yt}`).replace("#include <color_fragment>",`#include <color_fragment>
     ${et?`{
      vec3 ew=trcWarp(vTsWorld*vec3(.55,.3,.55)+1.7)+trcWarp(vTsWorld*vec3(1.6,.8,1.6)+5.3)*.45;
      float thr=max(.34,.62+ew.x*.55+ew.z*.25);if(abs(vTsSide)>thr)discard;
      // 가장자리 띠에서는 굴곡·그늘 면을 접어 아래 지형 암반과 같은 밝기로 이어지게 한다(경계에 단이 보이지 않게).
      tsFlat=smoothstep(thr-.45,thr-.02,abs(vTsSide));
     }`:""}
     {
      // 재판정(참고 04_20): 둥근 암괴 굴곡(갈라짐 선·셀 경계 그늘 없음) + 지형 암반과 같은 칠(회색 바탕·어두운 얼룩·이끼).
      vec3 wn=normalize(vTsN);if(!gl_FrontFacing)wn=-wn;float px=trcPixel(vTsWorld,wn),crk;
      tsBumpN=trcBump(vTsWorld,wn,vec3(${G.map(T=>T.toFixed(2)).join(",")}),${J.toFixed(2)}*.8*(1.-tsFlat),px,crk);trcOcc=1.;
      vec3 tsBase=diffuseColor.rgb;
      diffuseColor.rgb=trcPaint(vTsWorld,wn,diffuseColor.rgb,${_o(j.nature.rockDark)},tsMossTint(${_o(j.nature.moss)}),tsMossTint(${_o(j.nature.mossDark)}),px,${ot.toFixed(2)},tsMoss);
      ${et?`// 노면은 얼룩을 절반으로(짙은 얼룩이 발밑에서 구멍·웅덩이처럼 읽히지 않게).
      diffuseColor.rgb=mix(diffuseColor.rgb,tsBase,.5*(1.-tsMoss));`:""}
      // 겨울: 평평한 윗면·턱에만 눈(가파른 면은 맨 바위). 바위 노면은 밟힌 눈(회갈색)과 눈이 섞인다.
      tsSnowAmt=tsSnowCover(vTsWorld,wn.y,.6,.82)${et?"*(.2+.6*smoothstep(.42,.62,tsN2(vTsWorld.xz*.45+3.)))":""};
      diffuseColor.rgb=mix(diffuseColor.rgb,${et?"mix(TS_TRAMPLED,TS_SNOW,smoothstep(.3,.7,tsN2(vTsWorld.xz*1.7)))":"TS_SNOW"},tsSnowAmt);
     }`).replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
     ${et?`// 노면 리본은 마디마다 기울어 툰 명암·그늘 면이 마디째 어두운 띠로 떨어진다(정상 길이 계단처럼 보였다). 바탕 법선을 위로 세운다.
     {vec3 up=(viewMatrix*vec4(0.,1.,0.,0.)).xyz;normal=normalize(mix(normal,up,.85));tsBumpN=normalize(mix(tsBumpN,vec3(0.,1.,0.),.6));}`:""}
     trcBaseN=normal;normal=normalize((viewMatrix*vec4(tsBumpN,0.)).xyz);`).replace("#include <lights_fragment_end>",`#include <lights_fragment_end>
     reflectedLight.indirectDiffuse*=mix(vec3(${j.nature.rockShadeTint.join(",")}),vec3(1.),max(max(tsFlat,tsMoss*.8),tsSnowAmt));
     ${Oo("(1.-tsFlat)*(1.-tsMoss*.8)*(1.-tsSnowAmt)",j.nature.rockShadeDirect.toFixed(3))}`)},b.customProgramCacheKey=()=>`toon-rock-surface-v5-season-${G.join("_")}-${J}-${X}-${et}-${ot}`,b.userData.toonRockSurface=!0,b}const f=new Map;function h(b=Tt(j.nature.rock),G={},J={}){const X=`${new rt(b).getHexString()}|${JSON.stringify(G)}|${JSON.stringify(J)}`;return f.has(X)||f.set(X,ke(u(a({name:"toon-rock-surface",color:b,...G}),J))),f.get(X)}const m=new Set(["rock","ridge"]),d=new Map;function g(b="soil"){if(j.trail[b]||(b="soil"),!d.has(b)){const G=ke(a({name:`toon-trail-${b}`,color:Tt(j.trail[b]),side:b==="stairs"||b==="deck_stairs"?Ct:ma}));m.has(b)?(u(G,{cell:[1.7,1.4,1.7],amt:.45,crack:.2,edge:!0,moss:-.45}),G.polygonOffset=!0,G.polygonOffsetFactor=-2,G.polygonOffsetUnits=-6,b==="ridge"&&(G.visible=!1)):(b==="soil"||b==="paved")&&p(G,{ragged:b==="soil"}),d.set(b,G)}return d.get(b)}function p(b,{ragged:G=!1}={}){return b.onBeforeCompile=J=>{pe(J),J.vertexShader=J.vertexShader.replace("#include <common>",`#include <common>
attribute float trailEdge;varying float vTbSide;varying vec2 vTbUv;varying vec3 vTbWorld;`).replace("#include <project_vertex>",`#include <project_vertex>
vTbSide=trailEdge;vTbUv=uv;vTbWorld=(modelMatrix*vec4(transformed,1.)).xyz;`),J.fragmentShader=J.fragmentShader.replace("#include <common>",`#include <common>
varying float vTbSide;varying vec2 vTbUv;varying vec3 vTbWorld;
${Je}${Yt}`).replace("#include <color_fragment>",`#include <color_fragment>
     {
      float side=abs(vTbSide),dist=length(vViewPosition),px=dist*.0014/max(abs(normalize(vViewPosition).y),.2);
      ${G?"float thr=.8+(bsNoise(vTbWorld.xz*.9)-.5)*.3+(bsNoise(vTbWorld.xz*3.1+5.)-.5)*.12;if(side>thr)discard;":"float thr=1.;"}
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
     normal=normalize(mix(normal,(viewMatrix*vec4(0.,1.,0.,0.)).xyz,.85));`)},b.customProgramCacheKey=()=>`toon-trail-brush-v3-season-${G}`,b.userData.toonTrailBrush=!0,b}const x=new Map;function v(b=16777215,G={}){const J=`${new rt(b).getHexString()}|${JSON.stringify(G)}`;return x.has(J)||x.set(J,ke(a({name:"toon-basic",color:b,...G}))),x.get(J)}let y;function S(){return y||(y=ke(a({name:"toon-water",color:Tt(j.water),transparent:!0,opacity:.86})),y.onBeforeCompile=b=>{Do(b),b.uniforms.toonWaterSky=Ks,b.fragmentShader=b.fragmentShader.replace("#include <common>",`#include <common>
${Co}
uniform vec3 toonWaterSky;`).replace("#include <opaque_fragment>",`float twFres=pow(1.-abs(dot(normalize(vViewPosition),normal)),3.);
     float twBand=step(.82,sin(vViewPosition.x*.9+foliageTime*1.4)*.5+.5)*.18;
     outgoingLight+=toonWaterSky*(twFres*.35+twBand);
     #include <opaque_fragment>`)},y.customProgramCacheKey=()=>"toon-water-v2",y)}let C;function D(){if(C)return C;const b=j.terrain,G=j.trail;return C={soil:v(Tt(G.soil)),stone:h(Tt(G.rock)),granite:h(Tt(b.rock)),leaves:v(Tt("#6f7f3e")),grass:v(Tt(b.meadow)),wood:v(Tt(G.deck_stairs)),bark:v(Tt("#6b4e36")),paved:g("paved"),stoneStairs:g("stairs"),woodStairs:g("deck_stairs")},C}const R={terrain:i,terrainUnderlay:c,trail:g,basic:v,rock:h,water:S,materials:D,pathMaterials:()=>Object.fromEntries(Ss.map(b=>[b,g(b)])),gradientMap:e},k=b=>/^(roadside-(grass|shrub)|forest-blades)-/.test(b.customProgramCacheKey?.()??""),M=b=>/^(rock_|boulder_|mountainside)/.test(b??""),w=Tt(j.rock.granite);function A(b){const G=Pt.clamp(Ue(b.color)/qs,1-j.rock.spread,1+j.rock.spread);b.color.copy(w).multiplyScalar(G),b.userData.toonRock=!0}const z=b=>!!b.map?.isCanvasTexture&&!(b.alphaTest>0)&&!b.transparent&&Ue(b.color)>.6;function F(b,G){const J=j.pattern,X=Zs(G.map),et=X?X.clone().multiply(new rt(1,1,1).lerp(G.color,J.warmth)):G.color.clone().multiplyScalar(.12),ot=Ue(et),at=Pt.clamp(ot*J.gain,J.minLuma,J.maxLuma);et.multiplyScalar(at/Math.max(ot,1e-4)),b.color.copy(et),b.map=G.map,b.userData.toonPattern=!0;const T=Math.max(.02,X?Ue(X):.3);b.onBeforeCompile=B=>{B.fragmentShader=B.fragmentShader.replace("#include <map_fragment>",`
    #ifdef USE_MAP
    {
     float tpRatio=dot(texture2D(map,vMapUv).rgb,vec3(.2126,.7152,.0722))/${T.toFixed(4)};
     float tpDark=1.-smoothstep(${(J.dark-.03).toFixed(3)},${(J.dark+.03).toFixed(3)},tpRatio),tpLight=smoothstep(${(J.light-.03).toFixed(3)},${(J.light+.03).toFixed(3)},tpRatio);
     float tpTone=mix(1.,${J.darkTone.toFixed(3)},tpDark)*mix(1.,${J.lightTone.toFixed(3)},tpLight),tpFade=1.-smoothstep(${J.fadeNear.toFixed(1)},${J.fadeFar.toFixed(1)},length(vViewPosition));
     diffuseColor.rgb*=mix(1.,tpTone,tpFade*${J.amount.toFixed(3)});
    }
    #endif`)},b.customProgramCacheKey=()=>`toon-pattern-floor-v1-${T.toFixed(4)}`}const _=new WeakMap,L=b=>b&&!b.isMeshToonMaterial&&!b.isShaderMaterial&&(b.isMeshStandardMaterial||b.isMeshBasicMaterial||b.isMeshLambertMaterial||b.isMeshPhongMaterial);function I(b,{kind:G,keepMaps:J=!1}={}){if(!L(b))return o.skipped++,b;let X=_.get(b);X||_.set(b,X=new Map);const et=`${G??""}|${J}`;if(X.has(et))return o.reused++,X.get(et);const{foliagePatched:ot,...at}=b.userData??{},T=a({name:b.name,color:b.color?.clone()??new rt(1,1,1),vertexColors:b.vertexColors,alphaTest:b.alphaTest,transparent:b.transparent,opacity:b.opacity,side:b.side,depthWrite:b.depthWrite,depthTest:b.depthTest,fog:b.fog,visible:b.visible,alphaMap:b.alphaMap??null,map:J?b.map??null:null,emissive:b.emissive?b.emissive.clone():new rt(0),emissiveIntensity:b.emissiveIntensity??1,emissiveMap:J?b.emissiveMap??null:null,polygonOffset:b.polygonOffset,polygonOffsetFactor:b.polygonOffsetFactor,polygonOffsetUnits:b.polygonOffsetUnits});if(!J&&b.map&&b.alphaTest>0&&!b.alphaMap&&(T.alphaMap=b.map,T.userData.alphaFromMap=!0),T.userData={...T.userData,...at,toonSource:b.uuid,toonKind:G??null,shared:!0},k(b)){T.onBeforeCompile=b.onBeforeCompile;const B=b.customProgramCacheKey.bind(b);T.customProgramCacheKey=()=>B(),r(T,{name:b.name,kind:"grass",wind:!1})}else G==="foliage"||G==="grass"||ot?r(T,{name:b.name,pine:ot?.pine,kind:G==="grass"?"grass":void 0}):!J&&M(b.name)?A(T):!J&&z(b)&&F(T,b);return X.set(et,T),o.converted++,T}const O=new WeakMap,H=[[0,.05,0,1],[.42,-.18,.22,.72],[-.38,-.12,-.3,.74],[.05,-.22,.45,.66]];function E(b){if(O.has(b))return O.get(b);b.boundingBox||b.computeBoundingBox();const G=b.boundingBox,J=G.getCenter(new N),X=G.getSize(new N).multiplyScalar(.5),et=H.map(([at,T,B,$],V)=>{const Z=new $e(1,1);Z.deleteAttribute("uv");const tt=Z.attributes.position;for(let Y=0;Y<tt.count;Y++){const nt=tt.getX(Y),mt=tt.getY(Y),pt=tt.getZ(Y),ct=1+.08*Math.sin(nt*5.1+mt*3.7+pt*4.3+V*1.7);tt.setXYZ(Y,J.x+X.x*(at+nt*$*ct*.62),J.y+X.y*(T+mt*$*ct*.6),J.z+X.z*(B+pt*$*ct*.62))}return Z}),ot=qa(Se(et));return et.forEach(at=>at.dispose()),ot.computeVertexNormals(),ot.computeBoundingBox(),ot.computeBoundingSphere(),ot.name=`${b.name||"leaves"}-toon-blob`,ot.userData.shared=!0,O.set(b,ot),o.blobs++,ot}const Q=b=>b?.userData?.toonAlphaCutout===!0;function U(b,{kind:G,keepMaps:J=!1}={}){return b&&(b.traverse(X=>{if(!X.isMesh||X.isLine||X.isPoints)return;const et=Array.isArray(X.material)?X.material:[X.material];if(!X.isSkinnedMesh&&et.length===1&&Q(et[0])){X.geometry=E(X.geometry),o.cutoutMeshes++,X.material=q(I(et[0],{kind:"foliage",keepMaps:J})),X.userData.toonBlob=!0;return}const ot=et.map(at=>I(at,{kind:G,keepMaps:J}));X.material=Array.isArray(X.material)?ot:ot[0]}),b)}const K=new WeakMap;function q(b){if(!K.has(b)){const G=b.clone();G.alphaTest=0,G.alphaMap=null,G.transparent=!1,G.side=ma,G.onBeforeCompile=b.onBeforeCompile,G.customProgramCacheKey=()=>`${b.customProgramCacheKey()}|blob`,G.userData={...b.userData,shared:!0},K.set(b,G)}return K.get(b)}return{materialFactory:R,toonify:U,convert:I,patchFoliage:r,status:o}}const Ys=`
varying vec3 vSkyDir;
void main(){
 vSkyDir=normalize(position);
 vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);
 gl_Position=p.xyww;
}`,$t=j.sky.stars,Go=j.sky.cityGlow.bino,wa={stretch:.6,full:4},Qs=e=>e>1.001?e*(1+wa.stretch*Math.min(1,(e-1)/(wa.full-1))):1,Js=`
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
 col*=1.-bn*${Go.horizonDim.toFixed(2)}*(1.-smoothstep(0.,skyBands.y,y));
 float city=pow(max(dot(hz,normalize(skyCityDir.xz+1e-5)),0.),2.5)*(1.-smoothstep(0.,mix(${j.sky.cityGlow.height.toFixed(2)},${Go.height.toFixed(3)},bn),y));
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
  float boost=1.+mw*${$t.milkyBoost.toFixed(2)};
  float small=starLayer(uv,${$t.cells.toFixed(1)},${$t.share.toFixed(3)}*boost,${$t.smallPx.toFixed(2)},faceSeed);
  float big=starLayer(uv,${($t.cells/3).toFixed(1)},${$t.bright.toFixed(3)},${$t.brightPx.toFixed(2)},faceSeed+19.);
  float h=hash(floor(uv*${$t.cells.toFixed(1)})+faceSeed);
  float tw=.75+.25*sin(skyTime*(1.5+h*4.)+h*40.);
  vec3 tint=mix(vec3(.85,.9,1.),vec3(1.,.93,.82),step(.7,fract(h*13.)));
  col+=tint*(small*${$t.small.toFixed(2)}+big*${$t.big.toFixed(2)})*tw*skyStars*smoothstep(.02,.22,d.y)*(1.-city*skyCityGlow*.8);
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
}`;function tr({radius:e=2e4}={}){const t=()=>({value:new rt}),o={skyZenith:t(),skyMid:t(),skyPink:t(),skyHorizon:t(),skyCity:t(),skyCloud:t(),skyCloudShade:t(),skyCloudLit:t(),skyMilkyColor:{value:new rt().setRGB(...ft(j.sky.milky.color),gt)},skyMilkyDust:{value:new rt().setRGB(...ft(j.sky.milky.dust),gt)},skySun:{value:new N(0,1,0)},skyMoon:{value:new N(0,-1,0)},skySunColor:{value:new rt(1,.95,.85)},skyCityDir:{value:new N(...So(j.sky.cityGlow.bearing))},skyMilkyN:{value:new N().crossVectors(new N(...So(...j.sky.milky.from)),new N(...So(...j.sky.milky.to))).normalize()},skyBands:{value:new N(...j.sky.bands)},skyCityBino:{value:new rt().setRGB(...ft(Go.color),gt)},skyZoom:{value:1},skyCamAz:{value:0},skyDip:{value:0},skyStars:{value:0},skyMilky:{value:0},skyCityGlow:{value:0},skyCover:{value:.4},skyTime:{value:0},skySunVis:{value:1},skyMoonVis:{value:0},skyGain:{value:1},skySunset:{value:0},skyNight:{value:0}},a=new zt({name:"toon-sky",uniforms:o,vertexShader:Ys,fragmentShader:Js,side:Qn,depthWrite:!1,depthTest:!1,fog:!1});a.extensions={derivatives:!0};const r=new At(new Jn(e,48,24),a);r.name="카툰 하늘",r.renderOrder=-1e3,r.frustumCulled=!1,r.userData.toonSky=!0;const s=new N;r.onBeforeRender=(l,c,u)=>{r.position.copy(u.position),r.updateMatrixWorld(),o.skyZoom.value=Qs(u.zoom||1),u.getWorldDirection(s),o.skyCamAz.value=Math.atan2(s.x,s.z),o.skyDip.value=Math.min(.021,Math.sqrt(2*Math.max(0,u.position.y)/6371e3))};let n={};function i(l={},c,u,f=0,h=1){const m=_s(l),d=(g,p)=>g.value.setRGB(...p,gt);for(const g of["Zenith","Mid","Pink","Horizon","City","Cloud","CloudShade","CloudLit"])d(o[`sky${g}`],m[g[0].toLowerCase()+g.slice(1)]);return c&&o.skySun.value.copy(c).normalize(),u&&o.skyMoon.value.copy(u).normalize(),o.skySunColor.value.setRGB(1,.95-.12*m.weights.sunset,.85-.2*m.weights.sunset,gt),o.skySunVis.value=(1-m.weights.night)*(1-(l.gray??0)*.8)*(o.skySun.value.y>-.05?1:0),o.skyMoonVis.value=l.moon?.visible??m.weights.night,o.skyStars.value=m.stars,o.skyMilky.value=m.milky,o.skyCityGlow.value=m.cityGlow,o.skyCover.value=m.cloudCover,o.skyTime.value+=f,o.skySunset.value=m.weights.sunset,o.skyNight.value=m.weights.night,o.skyGain.value=1/Math.max(.05,h),n=m,m}return{mesh:r,uniforms:o,update:i,get palette(){return n},dispose(){r.geometry.dispose(),a.dispose()}}}const it=e=>new rt().setRGB(...ft(e),gt),to=Object.freeze({pastelLift:.22,pastelDesat:.3,day:{lit:"#f6efe2",shade:"#8e9fbe",roof:"#e6e4de",glass:"#7fa7c6",glassTop:"#bcd6e4",haze:"#8eaac2",hazeScale:9e3,hazeMax:.9},sunset:{lit:"#bf929a",shade:"#4c5078",roof:"#8d7f9c",rim:"#ffd9b0",glass:"#5d5a85",glassLit:"#f3c1a4",haze:"#7a7092",hazeScale:9e3,hazeMax:.88},binoDusk:{lit:"#7d8ba3",shade:"#3f4f66",roof:"#8d8a9c",haze:"#69748e",litFrom:.3,rimM:3},night:{body:"#262c3c",bodyLit:"#323a4e",glass:"#1a1f2d",haze:"#454a6a",hazeScale:16e3,hazeMax:.75},zoomClear:.55,light:{cream:"#f0e5bc",blueWhite:"#e3e6f4",teal:"#8fbcdc",warm:"#e5b281",magenta:"#e07ad0",pink:"#f2a0c8",share:[.55,.25,.12,.08],tallHeight:70,magentaShare:.35},windowIntensity:1,litMin:j.city.litMin,litMax:j.city.litMax,dots:{density:62e-5,max:4e3,total:18e4,px:2.2,gain:1,target:.01,layers:3,lowKeep:.5},halo:{height:90,base:80,scale:.7,maxPx:240,fullPx:70,gain:.07,dusk:.35,colorA:"#c46fb8",colorB:"#9a7fd0"},traffic:{kinds:/^(motorway|trunk|primary)(_link)?$/,major:/^(motorway|trunk)$/,cell:26,fill:.6,speed:.8,head:"#fff1d6",tail:"#ff5a48",gain:1.8,clearM:1.5,maxSegment:120},river:{day:"#7fa9bd",daySky:"#c9dde6",sunset:"#4f4e74",sunsetSky:"#e8b8b0",night:"#141a28",nightSky:"#454a6a",streak:.12,streakGain:.42}}),ba=it(to.light.cream).multiplyScalar(.62).add(it(to.light.blueWhite).multiplyScalar(.22)).add(it(to.light.warm).multiplyScalar(.16)),P=to,ie={cityNight:{value:0},cityDay:{value:1},citySunset:{value:0},cityLights:{value:0},cityTime:{value:0},citySun:{value:new N(0,1,0)},cityHaze:{value:new rt(.7,.78,.84)},cityHazeScale:{value:P.day.hazeScale},cityHazeMax:{value:P.day.hazeMax},cityDayLit:{value:it(P.day.lit)},cityDayShade:{value:it(P.day.shade)},cityDayRoof:{value:it(P.day.roof)},cityGlassDay:{value:it(P.day.glass)},cityGlassTop:{value:it(P.day.glassTop)},cityDuskLit:{value:it(P.sunset.lit)},cityDuskShade:{value:it(P.sunset.shade)},cityDuskRoof:{value:it(P.sunset.roof)},cityDuskRim:{value:it(P.sunset.rim)},cityGlassDusk:{value:it(P.sunset.glass)},cityGlassDuskLit:{value:it(P.sunset.glassLit)},cityBinoLit:{value:it(P.binoDusk.lit)},cityBinoShade:{value:it(P.binoDusk.shade)},cityBinoRoof:{value:it(P.binoDusk.roof)},cityBinoHaze:{value:it(P.binoDusk.haze)},cityNightTint:{value:it(P.night.body)},cityNightLit:{value:it(P.night.bodyLit)},cityGlassNight:{value:it(P.night.glass)},cityCream:{value:it(P.light.cream)},cityBlueWhite:{value:it(P.light.blueWhite)},cityTeal:{value:it(P.light.teal)},cityWindow:{value:it(P.light.warm)},cityMagenta:{value:it(P.light.magenta)},cityPink:{value:it(P.light.pink)},cityWindowIntensity:{value:P.windowIntensity},cityLitMin:{value:P.litMin},cityLitMax:{value:P.litMax},cityDotGain:{value:P.dots.gain},cityDotPx:{value:P.dots.px},cityZoom:{value:1},cityViewH:{value:800},cityPxAngle:{value:.0014},cityDotKeep:{value:1},cityHaloA:{value:it(P.halo.colorA)},cityHaloB:{value:it(P.halo.colorB)},cityHaloGain:{value:0},cityHead:{value:it(P.traffic.head)},cityTail:{value:it(P.traffic.tail)},cityRiverDay:{value:it(P.river.day)},cityRiverDaySky:{value:it(P.river.daySky)},cityRiverSunset:{value:it(P.river.sunset)},cityRiverSunsetSky:{value:it(P.river.sunsetSky)},cityRiverNight:{value:it(P.river.night)},cityRiverNightSky:{value:it(P.river.nightSky)}},vt=e=>e.toFixed(3),[er,or,ar]=[P.light.share[0],P.light.share[0]+P.light.share[1],P.light.share[0]+P.light.share[1]+P.light.share[2]],an=`
vec3 tcTone(float t){return t<${vt(er)}?cityCream:t<${vt(or)}?cityBlueWhite:t<${vt(ar)}?cityTeal:cityWindow;}
vec3 tcToneAvg(){return cityCream*${vt(P.light.share[0])}+cityBlueWhite*${vt(P.light.share[1])}+cityTeal*${vt(P.light.share[2])}+cityWindow*${vt(P.light.share[3])};}`,nr=`
uniform float cityNight,cityDay,citySunset,cityLights,cityTime,cityHazeScale,cityHazeMax,cityWindowIntensity,cityLitMin,cityLitMax,cityZoom;
uniform vec3 citySun,cityHaze,cityDayLit,cityDayShade,cityDayRoof,cityGlassDay,cityGlassTop,cityDuskLit,cityDuskShade,cityDuskRoof,cityDuskRim,cityGlassDusk,cityGlassDuskLit;
uniform vec3 cityBinoLit,cityBinoShade,cityBinoRoof,cityBinoHaze;
uniform vec3 cityNightTint,cityNightLit,cityGlassNight,cityCream,cityBlueWhite,cityTeal,cityWindow,cityMagenta,cityPink;
uniform vec3 cityRiverDay,cityRiverDaySky,cityRiverSunset,cityRiverSunsetSky,cityRiverNight,cityRiverNightSky;
float tcHash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
// 거리 대기 원근: 시간대 연무색으로. 상한(cityHazeMax)을 둬 먼 건물도 실루엣이 남는다.
// 쌍안경(cityZoom>1)은 배율만큼 연무를 덜 받는다(실제보다 또렷하게: 확대해도 덩어리로 뭉개지지 않게).
float tcFog(float d){return min(1.-exp(-d/(cityHazeScale*(1.+(cityZoom-1.)*${vt(P.zoomClear)}))),cityHazeMax);}
${an}`,sr="attribute vec3 seoulInfo;attribute float seoulType;varying vec3 vTcWorld;varying vec3 vTcNormal;varying vec3 vTcInfo;varying float vTcDist;varying float vTcType;",rr=`
{
 vec4 tcW=modelMatrix*vec4(transformed,1.);vTcWorld=tcW.xyz;vTcNormal=normalize(mat3(modelMatrix)*normal);vTcInfo=seoulInfo;vTcType=seoulType;
 vTcDist=length((viewMatrix*tcW).xyz);
}`,ir=`
varying vec3 vTcWorld;varying vec3 vTcNormal;varying vec3 vTcInfo;varying float vTcDist;varying float vTcType;
${nr}`,lr=`
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
 vec3 pastel=mix(mix(src,vec3(lum),${vt(P.pastelDesat)}),vec3(1.),${vt(P.pastelLift)});
 // 해 쪽 벽(수평 방향)만 밝다: 2단 툰. 해가 낮을수록(노을) 경계가 또렷하다.
 vec3 sunH=normalize(vec3(citySun.x,0.,citySun.z)+vec3(1e-4,0.,0.));
 float litK=mix(smoothstep(-.12,.12,dot(N,sunH)),1.,roof);
 // 멀수록 밝은 면·그늘 차(대비)가 줄어 층층이 옅어진다.
 float fog=tcFog(vTcDist);float contrast=1.-fog*.55;litK=mix(.55,litK,contrast);
 vec3 dayC=pastel*mix(mix(cityDayShade,cityDayLit,litK),cityDayRoof,roof);
 vec3 duskC=pastel*mix(mix(cityDuskShade,cityDuskLit,litK),cityDuskRoof,roof);
 // 쌍안경 노을: 청회색 본체(해를 정면으로 받는 벽만 밝게). zb는 1배에서 0이라 1배 노을은 그대로다.
 float zb=smoothstep(1.5,4.,cityZoom);
 float litB=mix(.4,mix(smoothstep(${vt(P.binoDusk.litFrom)},${vt(P.binoDusk.litFrom+.25)},dot(N,sunH)),1.,roof),contrast);
 duskC=mix(duskC,pastel*mix(mix(cityBinoShade,cityBinoLit,litB),cityBinoRoof,roof),zb);
 vec3 nightC=mix(cityNightTint,cityNightLit,litK*.6)*mix(.82,1.12,fract(seed*3.7));
 // 노을 윤곽빛: 해 쪽 벽 맨 위 1.5m, 지붕 가장자리 쪽이 크림으로 빛난다(14_13·14_14 지붕 윤곽).
 float rim=step(bh-mix(1.6,${vt(P.binoDusk.rimM)},zb),v)*(1.-roof)*step(.5,mix(litK,litB+.3,zb));
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
   float tall=step(${vt(P.light.tallHeight)},bh)*step(.6,hv);
   tone=mix(tone,mix(cityPink,cityMagenta,fract(h*5.3)),tall*step(${vt(1-P.light.magentaShare)},fract(h*7.7)));
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
}`,cr=`
uniform float cityLights,cityDotPx,cityZoom,cityPxAngle,cityDotKeep;attribute float aDot;attribute float aTall;varying float vOn;varying float vTone;varying float vTall;varying float vDist;
void main(){
 vec4 mv=modelViewMatrix*vec4(position,1.);float d=length(mv.xyz);
 mv.xyz*=max(0.,d-clamp(d*.004,1.,60.))/max(d,1e-3);
 gl_Position=projectionMatrix*mv;
 vOn=step(aDot,cityLights*1.05-.05);
 // 한 픽셀에 겹치는 벽 넓이가 크면(멀리·1배) 그만큼 솎는다: 남는 비율 = 목표 밀도 / (벽 m²당 점 × 겹침 × 픽셀 넓이).
 float pxm=d*cityPxAngle;vOn*=step(fract(aDot*91.7),cityDotKeep*${vt(P.dots.target)}/(${P.dots.density.toFixed(5)}*${P.dots.layers.toFixed(1)}*pxm*pxm));vTone=fract(aDot*53.7);vTall=aTall;vDist=d;
 gl_PointSize=vOn*cityDotPx*mix(1.5,1.,smoothstep(2000.,14000.,d))*(.8+.5*fract(aDot*17.3))*mix(1.,1.25,clamp((cityZoom-1.)/7.,0.,1.));
}`,fr=`
uniform vec3 cityCream,cityBlueWhite,cityTeal,cityWindow,cityMagenta,cityPink,cityHaze;uniform float cityDotGain,cityHazeScale,cityHazeMax,cityZoom;varying float vOn;varying float vTone;varying float vTall;varying float vDist;
${an}
void main(){if(vOn<.5)discard;float r=length(gl_PointCoord-.5);if(r>.5)discard;
 vec3 c=tcTone(vTone);c=mix(c,mix(cityPink,cityMagenta,fract(vTone*5.3)),vTall*step(${vt(1-P.light.magentaShare)},fract(vTone*7.7)));
 float fog=min(1.-exp(-vDist/(cityHazeScale*(1.+(cityZoom-1.)*${vt(P.zoomClear)}))),cityHazeMax);
 gl_FragColor=vec4(mix(c*cityDotGain,cityHaze,fog*.45)*(1.-.35*smoothstep(.2,.5,r)),1.);}`;function ur(e,{density:t=P.dots.density,max:o=P.dots.max}={},a=null){const r=e?.attributes?.position;if(!r)return null;const s=e.attributes.seoulInfo,n=e.index,i=n?n.count/3:r.count/3,l=[],c=[],u=[],f=new N,h=new N,m=new N,d=new N,g=new N,p=new N;let x=0,v=0;for(let y=0;y<i;y++){const S=n?n.getX(y*3):y*3,C=n?n.getX(y*3+1):y*3+1,D=n?n.getX(y*3+2):y*3+2;f.fromBufferAttribute(r,S),h.fromBufferAttribute(r,C),m.fromBufferAttribute(r,D),g.subVectors(h,f),p.subVectors(m,f),d.crossVectors(g,p);const W=d.length()/2;if(W<.001||Math.abs(d.y)/(W*2)>.5)continue;const R=s?s.getY(S):0,k=s?s.getZ(S):0;if(a&&s&&k>=P.halo.height){const M=s.getX(S).toFixed(6)+":"+R.toFixed(1),w=a.get(M)??{x:0,z:0,n:0,base:R,height:k};w.x+=f.x,w.z+=f.z,w.n++,a.set(M,w)}if(!(l.length/3>=o))for(x+=W*t;x>=1&&l.length/3<o;){x-=1,v++;const M=F=>{const _=Math.sin(v*12.9898+F*78.233+y*.37)*43758.5453;return _-Math.floor(_)};let w=M(1),A=M(2);w+A>1&&(w=1-w,A=1-A);const z=f.y+g.y*w+p.y*A;l.push(f.x+g.x*w+p.x*A,z,f.z+g.z*w+p.z*A),c.push(M(3)),u.push(s&&k>=P.light.tallHeight&&(z-R)/k>.6?1:0)}}return l.length?{position:new Float32Array(l),aDot:new Float32Array(c),aTall:new Float32Array(u)}:null}const dr=`
uniform float cityViewH,cityHaloGain;attribute float aSize;attribute float aTone;varying float vTone;varying float vA;
void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;float d=max(-mv.z,1.);
 float px=aSize*projectionMatrix[1][1]*cityViewH*.5/d;
 // 화면에서 작을수록(1배·먼 곳) 약하게: 고층 무리 빛무리가 겹쳐 흰 덩어리가 되지 않게.
 vTone=aTone;vA=cityHaloGain*clamp(px/${P.halo.fullPx.toFixed(1)},.08,1.);gl_PointSize=cityHaloGain>.0005?clamp(px,2.,${P.halo.maxPx.toFixed(1)}):0.;}`,mr=`
uniform vec3 cityHaloA,cityHaloB;varying float vTone;varying float vA;
void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;float a=exp(-r*r*3.5)*(1.-smoothstep(.75,1.,r));
 gl_FragColor=vec4(mix(cityHaloA,cityHaloB,vTone)*a*vA,1.);}`,hr=`
attribute float aAlong;attribute float aDir;attribute float aSeed;varying float vAlong;varying float vDir;varying float vSeed;varying float vDist;
void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;vAlong=aAlong;vDir=aDir;vSeed=aSeed;vDist=length(mv.xyz);}`,pr=`
uniform float cityLights,cityTime,cityHazeScale,cityHazeMax,cityZoom,cityPxAngle;uniform vec3 cityHead,cityTail,cityHaze;varying float vAlong;varying float vDir;varying float vSeed;varying float vDist;
float tcHash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
void main(){
 float k=vAlong/${P.traffic.cell.toFixed(1)}-cityTime*${P.traffic.speed.toFixed(2)}*vDir*mix(.8,1.2,vSeed);
 float id=floor(k),f=fract(k);
 float car=step(tcHash(vec2(id,vSeed*91.)),${P.traffic.fill.toFixed(2)})*smoothstep(.0,.08,f)*(1.-smoothstep(.3,.42,f));
 float px=fwidth(k);car=mix(car,${(P.traffic.fill*.36).toFixed(3)},smoothstep(.25,1.,px));
 vec3 c=vDir>0.?cityHead:cityTail;
 float fog=min(1.-exp(-vDist/(cityHazeScale*(1.+(cityZoom-1.)*${vt(P.zoomClear)}))),cityHazeMax);
 // 한 픽셀이 clearM(m)보다 넓은 땅을 덮으면(1배·먼 곳) 그만큼 어둡게: 많은 도로 선이 한 픽셀에 겹쳐 흰 빛 덩어리가 되지 않게.
 float dense=clamp(${P.traffic.clearM.toFixed(2)}/(vDist*cityPxAngle),0.,1.);
 float a=car*cityLights*(1.-fog*.6)*dense*${P.traffic.gain.toFixed(2)};if(a<.003)discard;
 gl_FragColor=vec4(c*a,1.);}`;function gr(e,t,{kinds:o=P.traffic.kinds,major:a=P.traffic.major,maxSegment:r=P.traffic.maxSegment}={}){const s=[],n=[],i=[],l=[];let c=7,u=0;const f=()=>(c=c*16807%2147483647)/2147483647,h=(e??[]).filter(g=>g.bridge||o.test(g.kind??"")),m=g=>a.test(g.kind??"");for(const g of[...h.filter(m),...h.filter(p=>!m(p))]){!m(g)&&!u&&(u=s.length/3);const p=Math.max(1.5,(g.width??10)*.25),x=f();let v=0;for(let y=1;y<g.points.length;y++){const[S,C]=g.points[y-1],[D,W]=g.points[y],R=D-S,k=W-C,M=Math.hypot(R,k);if(M<.1)continue;const w=-k/M,A=R/M,z=Math.max(1,Math.ceil(M/r)),F=g.bridge?Math.max(24,t(S,C),t(D,W))+3:null;for(let _=0;_<z;_++){const L=_/z,I=(_+1)/z,O=S+R*L,H=C+k*L,E=S+R*I,Q=C+k*I;for(const U of[1,-1]){const K=w*p*U,q=A*p*U,b=F??t(O+K,H+q)+2.5,G=F??t(E+K,Q+q)+2.5;s.push(O+K,b,H+q,E+K,G,Q+q),n.push(v+M*L,v+M*I),i.push(U,U),l.push(x,x)}}v+=M}}if(!s.length)return null;const d=new bt;return d.setAttribute("position",new st(s,3)),d.setAttribute("aAlong",new st(n,1)),d.setAttribute("aDir",new st(i,1)),d.setAttribute("aSeed",new st(l,1)),d.computeBoundingSphere(),d.userData.majorCount=u||s.length/3,d}const vr=`
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
 float col=step(1.-${vt(P.river.streak)},tcHash(vec2(cid,7.)));
 float flick=step(.35,tcHash(vec2(cid,floor(along/14.+cityTime*.6))));
 float streak=col*flick*(1.-smoothstep(.08,.2,abs(fract(cq)-.5)));
 streak=mix(streak,${vt(P.river.streak*.12)},smoothstep(.3,1.,fwidth(cq)));
 vec3 lightC=mix(cityCream,cityPink,step(.75,tcHash(vec2(cid,3.))));
 vec3 c=dayW*cityDay+duskW*citySunset+nightW*cityNight;
 float fog=tcFog(d);c=mix(c,cityHaze,fog);
 c+=lightC*streak*cityLights*${vt(P.river.streakGain)}*(1.-fog*.5);
 diffuseColor.rgb=c;
}`;function xr(){const e={materials:0,swapped:0,nightLights:0,dots:0,halos:0,traffic:0,river:0,landmarks:0},t=new Set,o=(z,F,_)=>(z.onBeforeCompile=L=>{Object.assign(L.uniforms,ie),L.vertexShader=L.vertexShader.replace("#include <common>",`#include <common>
${sr}`).replace("#include <project_vertex>",`#include <project_vertex>
${rr}`),L.fragmentShader=L.fragmentShader.replace("#include <common>",`#include <common>
${ir}`).replace("#include <color_fragment>",`#include <color_fragment>
${F}`)},z.customProgramCacheKey=()=>_,z.userData.shared=!0,z);function a({side:z=Ct}={}){const F=o(new xe({name:"toon-city",color:16777215,vertexColors:!0,side:z,fog:!1}),lr,"toon-city-v2");return F.userData.toonCity=!0,t.add(F),e.materials++,F}let r=null;function s(){return r||(r=o(new xe({name:"toon-han-river",color:16777215,side:Ct,fog:!1}),vr,"toon-city-river-v1"),e.river++,r)}const n=new Rt;n.name="도심 밤 덧그림",n.userData.toonCityExtras=!0;const i=new zt({name:"toon-city-dots",uniforms:ie,vertexShader:cr,fragmentShader:fr,fog:!1});i.userData.shared=!0;const l=new zt({name:"toon-city-halo",uniforms:ie,vertexShader:dr,fragmentShader:mr,fog:!1,transparent:!0,depthWrite:!1,blending:Bo});l.userData.shared=!0;const c=new zt({name:"toon-city-traffic",uniforms:ie,vertexShader:hr,fragmentShader:pr,fog:!1,transparent:!0,depthWrite:!1,blending:Bo});c.userData.shared=!0;const u=[],f=new Map;let h=!1,m=-1e9;const d=new so(new bt,i);d.name="도심 불빛 점",d.frustumCulled=!1,d.userData.toonCityDots=!0,d.visible=!1;const g=new so(new bt,l);g.name="도심 고층 빛무리",g.frustumCulled=!1,g.visible=!1,g.renderOrder=2;const p=new Mt;d.onBeforeRender=g.onBeforeRender=z=>{z.getDrawingBufferSize(p),ie.cityViewH.value=p.y},n.add(d,g);function x(){h=!1,m=globalThis.performance?.now?.()??0;const z=u.reduce((q,b)=>q+b.aDot.length,0),F=new Float32Array(z*3),_=new Float32Array(z),L=new Float32Array(z);let I=0;for(const q of u)F.set(q.position,I*3),_.set(q.aDot,I),L.set(q.aTall,I),I+=q.aDot.length;const O=new bt;O.setAttribute("position",new Ce(F,3)),O.setAttribute("aDot",new Ce(_,1)),O.setAttribute("aTall",new Ce(L,1)),d.geometry.dispose(),d.geometry=O;const H=[],E=[],Q=[];let U=0;for(const q of f.values())H.push(q.x/q.n,q.base+q.height*.78,q.z/q.n),E.push(P.halo.base+q.height*P.halo.scale),Q.push((Math.sin(++U*12.9898)*43758.5453%1+1)%1);const K=new bt;K.setAttribute("position",new st(H,3)),K.setAttribute("aSize",new st(E,1)),K.setAttribute("aTone",new st(Q,1)),g.geometry.dispose(),g.geometry=K,e.halos=f.size}function v(z){if(z.userData.toonCityDots)return;z.userData.toonCityDots=!0;const F=P.dots.total-e.dots,_=ur(z.geometry,{max:Math.max(0,Math.min(P.dots.max,F))},f);if(!_){h=!0;return}u.push(_),e.dots+=_.aDot.length,h=!0}const y=new WeakMap;function S(z){z.traverse(F=>{const _=F.material;if(!(!_||Array.isArray(_))){if(!y.has(_)){const L=_.clone();L.color?.copy(ba).multiplyScalar(j.city.lampGain),L.toneMapped=!0,L.userData={..._.userData,shared:!0,toonNightLight:!0},_.isShaderMaterial&&/lampSize/.test(_.vertexShader)&&(L.uniforms={..._.uniforms,cityLampTint:{value:ba},cityLampGain:{value:j.city.roadLightGain}},L.vertexShader=_.vertexShader.replace("clamp(lampSize*(1.6+zoom*.28)*pixelRatio,1.0,7.0)","clamp(lampSize*(1.6+zoom*.28)*pixelRatio*.6,1.0,4.0)"),L.fragmentShader=_.fragmentShader.replace("varying vec3 vColor;","uniform vec3 cityLampTint;uniform float cityLampGain;varying vec3 vColor;").replace("vColor*vAlpha*a*1.15","mix(vColor,cityLampTint,.8)*vAlpha*a*cityLampGain")),y.set(_,L)}F.material=y.get(_),e.nightLights++}})}let C=null;function D(z,F,_=n){if(C)return C;const L=gr(z,F);return L?(C=new ts(L,c),C.name="도심 차량 불빛 줄기",C.frustumCulled=!1,C.visible=!1,C.renderOrder=1,_.add(C),e.traffic=L.attributes.position.count/2,C):null}function W({material:z,nightLights:F=[]}={}){const _=a({side:z?.side??Ct});for(const E of F)S(E);const L=E=>E.traverse(Q=>{Q.isMesh&&!Q.isSprite&&Q.material!==_&&!Q.userData.seoulLabel&&!Q.userData.toonCityExtras&&!Q.parent?.userData.toonCityExtras&&(Q.material=_,e.swapped++,v(Q))}),I=[];function O(E){n.parent||E.add(n),L(E);const Q=U=>{U.child!==n&&L(U.child)};return E.addEventListener("childadded",Q),I.push([E,Q]),E}function H(E){return L(E),e.landmarks++,E}return{material:_,apply:O,applyLandmark:H,update:A,styleNightLight:S,styleRoads:D,riverMaterial:s,dispose(){for(const[E,Q]of I)E.removeEventListener("childadded",Q);_.dispose(),t.delete(_)}}}const R=new rt,k=new rt,M=new rt,w={day:it(P.day.haze),sunset:it(P.sunset.haze),night:it(P.night.haze)};function A(z={},F=null,_=2){const L=Lt(z),I=ie;I.cityDay.value=L.day,I.citySunset.value=L.sunset,I.cityNight.value=L.night;const O=Number.isFinite(z.elevation)?z.elevation:30,H=Math.min(1,Math.max(0,(3-O)/11)),E=Math.max(z.night??0,z.city??0,H*H*(3-2*H));I.cityLights.value=E;const Q=globalThis.performance?.now?.()??0;if(I.cityTime.value=Q/1e3,z.sunVector)I.citySun.value.fromArray(z.sunVector.toArray?z.sunVector.toArray():z.sunVector);else if(Number.isFinite(z.azimuth)&&Number.isFinite(z.elevation)){const q=z.azimuth*Math.PI/180,b=z.elevation*Math.PI/180;I.citySun.value.set(Math.sin(q)*Math.cos(b),Math.sin(b),-Math.cos(q)*Math.cos(b))}R.setRGB(0,0,0);for(const q of["day","sunset","night"])R.add(k.copy(w[q]).multiplyScalar(L[q]));const U=z.fogColor??z.haze;U&&(M.setRGB(U[0],U[1],U[2],gt),R.lerp(M,.25));const K=z.gray??0;if(K>0){const q=R.r*.2126+R.g*.7152+R.b*.0722;R.lerp(k.setRGB(q,q,q),K*.5)}if(I.cityHaze.value.copy(R),I.cityHazeScale.value=P.day.hazeScale*L.day+P.sunset.hazeScale*L.sunset+P.night.hazeScale*L.night,I.cityHazeMax.value=P.day.hazeMax*L.day+P.sunset.hazeMax*L.sunset+P.night.hazeMax*L.night,I.cityHaloGain.value=P.halo.gain*Math.max(E,0)*(1-L.sunset*(1-P.halo.dusk))*(1-K*.5),F){const q=Math.max(1,F.zoom||1);I.cityZoom.value=q,I.cityPxAngle.value=2*Math.tan((F.fov??60)*Math.PI/360)/Math.max(1,I.cityViewH.value)/q}if(h&&Q-m>500&&x(),d.visible=E>.02&&e.dots>0,g.visible=I.cityHaloGain.value>5e-4&&e.halos>0,C){C.visible=E>.02;const q=C.geometry;q.setDrawRange(0,_===0?q.userData.majorCount:1/0)}I.cityDotKeep.value=_===0?P.dots.lowKeep:1}return{styleCity:W,update:A,status:e,riverMaterial:s,styleRoads:D,extras:n}}const eo={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

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


		}`};class ne{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const yr=new es(-1,1,1,-1,0,1);class wr extends bt{constructor(){super(),this.setAttribute("position",new st([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new st([0,2,0,0,2,0],2))}}const br=new wr;class go{constructor(t){this._mesh=new At(br,t)}dispose(){this._mesh.geometry.dispose()}render(t){t.render(this._mesh,yr)}get material(){return this._mesh.material}set material(t){this._mesh.material=t}}class nn extends ne{constructor(t,o="tDiffuse"){super(),this.textureID=o,this.uniforms=null,this.material=null,t instanceof zt?(this.uniforms=t.uniforms,this.material=t):t&&(this.uniforms=ye.clone(t.uniforms),this.material=new zt({name:t.name!==void 0?t.name:"unspecified",defines:Object.assign({},t.defines),uniforms:this.uniforms,vertexShader:t.vertexShader,fragmentShader:t.fragmentShader})),this._fsQuad=new go(this.material)}render(t,o,a){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=a.texture),this._fsQuad.material=this.material,this.renderToScreen?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(o),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this._fsQuad.render(t))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}class Sa extends ne{constructor(t,o){super(),this.scene=t,this.camera=o,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(t,o,a){const r=t.getContext(),s=t.state;s.buffers.color.setMask(!1),s.buffers.depth.setMask(!1),s.buffers.color.setLocked(!0),s.buffers.depth.setLocked(!0);let n,i;this.inverse?(n=0,i=1):(n=1,i=0),s.buffers.stencil.setTest(!0),s.buffers.stencil.setOp(r.REPLACE,r.REPLACE,r.REPLACE),s.buffers.stencil.setFunc(r.ALWAYS,n,4294967295),s.buffers.stencil.setClear(i),s.buffers.stencil.setLocked(!0),t.setRenderTarget(a),this.clear&&t.clear(),t.render(this.scene,this.camera),t.setRenderTarget(o),this.clear&&t.clear(),t.render(this.scene,this.camera),s.buffers.color.setLocked(!1),s.buffers.depth.setLocked(!1),s.buffers.color.setMask(!0),s.buffers.depth.setMask(!0),s.buffers.stencil.setLocked(!1),s.buffers.stencil.setFunc(r.EQUAL,1,4294967295),s.buffers.stencil.setOp(r.KEEP,r.KEEP,r.KEEP),s.buffers.stencil.setLocked(!0)}}class Sr extends ne{constructor(){super(),this.needsSwap=!1}render(t){t.state.buffers.stencil.setLocked(!1),t.state.buffers.stencil.setTest(!1)}}class Mr{constructor(t,o){if(this.renderer=t,this._pixelRatio=t.getPixelRatio(),o===void 0){const a=t.getSize(new Mt);this._width=a.width,this._height=a.height,o=new de(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:me}),o.texture.name="EffectComposer.rt1"}else this._width=o.width,this._height=o.height;this.renderTarget1=o,this.renderTarget2=o.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new nn(eo),this.copyPass.material.blending=os,this.clock=new as}swapBuffers(){const t=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=t}addPass(t){this.passes.push(t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(t,o){this.passes.splice(o,0,t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(t){const o=this.passes.indexOf(t);o!==-1&&this.passes.splice(o,1)}isLastEnabledPass(t){for(let o=t+1;o<this.passes.length;o++)if(this.passes[o].enabled)return!1;return!0}render(t){t===void 0&&(t=this.clock.getDelta());const o=this.renderer.getRenderTarget();let a=!1;for(let r=0,s=this.passes.length;r<s;r++){const n=this.passes[r];if(n.enabled!==!1){if(n.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(r),n.render(this.renderer,this.writeBuffer,this.readBuffer,t,a),n.needsSwap){if(a){const i=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(i.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,t),l.setFunc(i.EQUAL,1,4294967295)}this.swapBuffers()}Sa!==void 0&&(n instanceof Sa?a=!0:n instanceof Sr&&(a=!1))}}this.renderer.setRenderTarget(o)}reset(t){if(t===void 0){const o=this.renderer.getSize(new Mt);this._pixelRatio=this.renderer.getPixelRatio(),this._width=o.width,this._height=o.height,t=this.renderTarget1.clone(),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=t,this.renderTarget2=t.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(t,o){this._width=t,this._height=o;const a=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(a,r),this.renderTarget2.setSize(a,r);for(let s=0;s<this.passes.length;s++)this.passes[s].setSize(a,r)}setPixelRatio(t){this._pixelRatio=t,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class kr extends ne{constructor(t,o,a=null,r=null,s=null){super(),this.scene=t,this.camera=o,this.overrideMaterial=a,this.clearColor=r,this.clearAlpha=s,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new rt}render(t,o,a){const r=t.autoClear;t.autoClear=!1;let s,n;this.overrideMaterial!==null&&(n=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(t.getClearColor(this._oldClearColor),t.setClearColor(this.clearColor,t.getClearAlpha())),this.clearAlpha!==null&&(s=t.getClearAlpha(),t.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&t.clearDepth(),t.setRenderTarget(this.renderToScreen?null:a),this.clear===!0&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),t.render(this.scene,this.camera),this.clearColor!==null&&t.setClearColor(this._oldClearColor),this.clearAlpha!==null&&t.setClearAlpha(s),this.overrideMaterial!==null&&(this.scene.overrideMaterial=n),t.autoClear=r}}const zr={uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new rt(0)},defaultOpacity:{value:0}},vertexShader:`

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

		}`};class we extends ne{constructor(t,o=1,a,r){super(),this.strength=o,this.radius=a,this.threshold=r,this.resolution=t!==void 0?new Mt(t.x,t.y):new Mt(256,256),this.clearColor=new rt(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let s=Math.round(this.resolution.x/2),n=Math.round(this.resolution.y/2);this.renderTargetBright=new de(s,n,{type:me}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let u=0;u<this.nMips;u++){const f=new de(s,n,{type:me});f.texture.name="UnrealBloomPass.h"+u,f.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(f);const h=new de(s,n,{type:me});h.texture.name="UnrealBloomPass.v"+u,h.texture.generateMipmaps=!1,this.renderTargetsVertical.push(h),s=Math.round(s/2),n=Math.round(n/2)}const i=zr;this.highPassUniforms=ye.clone(i.uniforms),this.highPassUniforms.luminosityThreshold.value=r,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new zt({uniforms:this.highPassUniforms,vertexShader:i.vertexShader,fragmentShader:i.fragmentShader}),this.separableBlurMaterials=[];const l=[3,5,7,9,11];s=Math.round(this.resolution.x/2),n=Math.round(this.resolution.y/2);for(let u=0;u<this.nMips;u++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(l[u])),this.separableBlurMaterials[u].uniforms.invSize.value=new Mt(1/s,1/n),s=Math.round(s/2),n=Math.round(n/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=o,this.compositeMaterial.uniforms.bloomRadius.value=.1;const c=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=c,this.bloomTintColors=[new N(1,1,1),new N(1,1,1),new N(1,1,1),new N(1,1,1),new N(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=ye.clone(eo.uniforms),this.blendMaterial=new zt({uniforms:this.copyUniforms,vertexShader:eo.vertexShader,fragmentShader:eo.fragmentShader,blending:Bo,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new rt,this._oldClearAlpha=1,this._basic=new xe,this._fsQuad=new go(null)}dispose(){for(let t=0;t<this.renderTargetsHorizontal.length;t++)this.renderTargetsHorizontal[t].dispose();for(let t=0;t<this.renderTargetsVertical.length;t++)this.renderTargetsVertical[t].dispose();this.renderTargetBright.dispose();for(let t=0;t<this.separableBlurMaterials.length;t++)this.separableBlurMaterials[t].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(t,o){let a=Math.round(t/2),r=Math.round(o/2);this.renderTargetBright.setSize(a,r);for(let s=0;s<this.nMips;s++)this.renderTargetsHorizontal[s].setSize(a,r),this.renderTargetsVertical[s].setSize(a,r),this.separableBlurMaterials[s].uniforms.invSize.value=new Mt(1/a,1/r),a=Math.round(a/2),r=Math.round(r/2)}render(t,o,a,r,s){t.getClearColor(this._oldClearColor),this._oldClearAlpha=t.getClearAlpha();const n=t.autoClear;t.autoClear=!1,t.setClearColor(this.clearColor,0),s&&t.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=a.texture,t.setRenderTarget(null),t.clear(),this._fsQuad.render(t)),this.highPassUniforms.tDiffuse.value=a.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,t.setRenderTarget(this.renderTargetBright),t.clear(),this._fsQuad.render(t);let i=this.renderTargetBright;for(let l=0;l<this.nMips;l++)this._fsQuad.material=this.separableBlurMaterials[l],this.separableBlurMaterials[l].uniforms.colorTexture.value=i.texture,this.separableBlurMaterials[l].uniforms.direction.value=we.BlurDirectionX,t.setRenderTarget(this.renderTargetsHorizontal[l]),t.clear(),this._fsQuad.render(t),this.separableBlurMaterials[l].uniforms.colorTexture.value=this.renderTargetsHorizontal[l].texture,this.separableBlurMaterials[l].uniforms.direction.value=we.BlurDirectionY,t.setRenderTarget(this.renderTargetsVertical[l]),t.clear(),this._fsQuad.render(t),i=this.renderTargetsVertical[l];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,t.setRenderTarget(this.renderTargetsHorizontal[0]),t.clear(),this._fsQuad.render(t),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,s&&t.state.buffers.stencil.setTest(!0),this.renderToScreen?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(a),this._fsQuad.render(t)),t.setClearColor(this._oldClearColor,this._oldClearAlpha),t.autoClear=n}_getSeparableBlurMaterial(t){const o=[];for(let a=0;a<t;a++)o.push(.39894*Math.exp(-.5*a*a/(t*t))/t);return new zt({defines:{KERNEL_RADIUS:t},uniforms:{colorTexture:{value:null},invSize:{value:new Mt(.5,.5)},direction:{value:new Mt(.5,.5)},gaussianCoefficients:{value:o}},vertexShader:`varying vec2 vUv;
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
				}`})}_getCompositeMaterial(t){return new zt({defines:{NUM_MIPS:t},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`varying vec2 vUv;
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
				}`})}}we.BlurDirectionX=new Mt(1,0);we.BlurDirectionY=new Mt(0,1);const Ve={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
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

		}`};class Tr extends ne{constructor(){super(),this.uniforms=ye.clone(Ve.uniforms),this.material=new ns({name:Ve.name,uniforms:this.uniforms,vertexShader:Ve.vertexShader,fragmentShader:Ve.fragmentShader}),this._fsQuad=new go(this.material),this._outputColorSpace=null,this._toneMapping=null}render(t,o,a){this.uniforms.tDiffuse.value=a.texture,this.uniforms.toneMappingExposure.value=t.toneMappingExposure,(this._outputColorSpace!==t.outputColorSpace||this._toneMapping!==t.toneMapping)&&(this._outputColorSpace=t.outputColorSpace,this._toneMapping=t.toneMapping,this.material.defines={},ss.getTransfer(this._outputColorSpace)===rs&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===is?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===ls?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===cs?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===fs?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===us?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===ds?this.material.defines.NEUTRAL_TONE_MAPPING="":this._toneMapping===ms&&(this.material.defines.CUSTOM_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(o),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this._fsQuad.render(t))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}const fo={uniforms:{tDepth:{value:null},tColor:{value:null},cameraNear:{value:.1},cameraFar:{value:3e4},projInv:{value:new Za},texStep:{value:new Mt(1/1024,1/1024)},depthEdge:{value:j.outline.depthEdge},normalEdge:{value:j.outline.normalEdge},fadeNear:{value:j.outline.fadeNear},fadeFar:{value:j.outline.fadeFar},creaseNear:{value:j.outline.creaseNear},creaseFar:{value:j.outline.creaseFar}},vertexShader:"varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",fragmentShader:`#include <packing>
 uniform sampler2D tDepth,tColor;uniform float cameraNear,cameraFar,depthEdge,normalEdge,fadeNear,fadeFar,creaseNear,creaseFar;uniform mat4 projInv;uniform vec2 texStep;varying vec2 vUv;
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
  // 접힌 모서리는 가까이서만(11-22 대표 지적: 밤에 먼 나무 잎 덩어리의 잔면마다 선이 그어져 점·줄무늬 격자로 보였다). 실루엣은 그대로 멀리까지
  crease*=1.-smoothstep(creaseNear,creaseFar,z);
  float edge=max(silhouette,crease*.75);
  // 외곽선 제외 표시(알파 < .75: 풀잎·물). 자신이나 이웃이 표시돼 있으면 선을 긋지 않는다(풀밭이 검은 잡음으로 덮이지 않게).
  float keep=min(texture2D(tColor,vUv).a,min(min(texture2D(tColor,vUv+vec2(texStep.x,0.)).a,texture2D(tColor,vUv-vec2(texStep.x,0.)).a),min(texture2D(tColor,vUv+vec2(0.,texStep.y)).a,texture2D(tColor,vUv-vec2(0.,texStep.y)).a)));
  edge*=step(.75,keep);
  // 원경으로 갈수록 0(산 능선이 검은 선으로 뒤덮이지 않게).
  edge*=1.-smoothstep(fadeNear,fadeFar,z);
  gl_FragColor=vec4(edge,0.,0.,1.);
 }`},Ma={uniforms:{tDiffuse:{value:null},tEdge:{value:null},outlineColor:{value:new rt},outlineStrength:{value:1}},vertexShader:fo.vertexShader,fragmentShader:`uniform sampler2D tDiffuse,tEdge;uniform vec3 outlineColor;uniform float outlineStrength;varying vec2 vUv;
 void main(){vec4 c=texture2D(tDiffuse,vUv);float e=texture2D(tEdge,vUv).r*outlineStrength;gl_FragColor=vec4(mix(c.rgb,outlineColor,clamp(e,0.,1.)),1.);}`};class _r extends ne{constructor(t){super(),this.camera=t,this.scale=1,this.width=1,this.size=new Mt(1,1),this.edgeTarget=new de(1,1,{type:me,depthBuffer:!1}),this.edgeTarget.texture.name="toon-outline-edges",this.edgeMaterial=new zt({...fo,uniforms:ye.clone(fo.uniforms),depthTest:!1,depthWrite:!1}),this.compositeMaterial=new zt({...Ma,uniforms:ye.clone(Ma.uniforms),depthTest:!1,depthWrite:!1}),this.compositeMaterial.uniforms.tEdge.value=this.edgeTarget.texture,this.quad=new go(this.edgeMaterial)}setScale(t,o){this.scale=t,this.width=o,this.setSize(this.size.x,this.size.y)}setSize(t,o){this.size.set(t,o),this.edgeTarget.setSize(Math.max(1,Math.round(t*this.scale)),Math.max(1,Math.round(o*this.scale))),this.edgeMaterial.uniforms.texStep.value.set(this.width/Math.max(1,t),this.width/Math.max(1,o))}render(t,o,a){const r=this.edgeMaterial.uniforms;r.tDepth.value=a.depthTexture,r.tColor.value=a.texture,r.cameraNear.value=this.camera.near,r.cameraFar.value=this.camera.far,r.projInv.value.copy(this.camera.projectionMatrixInverse),this.quad.material=this.edgeMaterial,t.setRenderTarget(this.edgeTarget),this.quad.render(t),this.compositeMaterial.uniforms.tDiffuse.value=a.texture,this.quad.material=this.compositeMaterial,t.setRenderTarget(this.renderToScreen?null:o),this.quad.render(t)}dispose(){this.edgeTarget.dispose(),this.edgeMaterial.dispose(),this.compositeMaterial.dispose(),this.quad.dispose()}}const Cr={name:"ToonGrade",uniforms:{tDiffuse:{value:null},saturation:{value:1},contrast:{value:1},lift:{value:0},shadowGain:{value:0},highlight:{value:new rt(1,1,1)},highlightAmount:{value:0},shadow:{value:new rt(1,1,1)},shadowAmount:{value:0}},vertexShader:fo.vertexShader,fragmentShader:`uniform sampler2D tDiffuse;uniform float saturation,contrast,lift,shadowGain,highlightAmount,shadowAmount;uniform vec3 highlight,shadow;varying vec2 vUv;
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
 }`};function Dr(e,t=6){const o=e.materialHighPassFilter,a="vec4 texel = texture2D( tDiffuse, vUv );";return o?.fragmentShader?.includes(a)?(o.fragmentShader=o.fragmentShader.replace(a,`${a}
if(any(isnan(texel))||any(isinf(texel)))texel=vec4(0.);
texel.rgb*=min(1.,${t.toFixed(2)}/max(luminance(texel.rgb),1e-4));`),o.needsUpdate=!0,!0):!1}function Ar({renderer:e,scene:t,camera:o,mobile:a=!1}){const r=e.getDrawingBufferSize(new Mt),s=new de(Math.max(1,r.x),Math.max(1,r.y),{type:me});s.depthTexture=new hs(Math.max(1,r.x),Math.max(1,r.y)),s.depthTexture.type=ps;const n=new Mr(e,s),i=new kr(t,o),l=new _r(o),c=new we(new Mt(r.x,r.y),j.bloom.day.strength,j.bloom.day.radius,j.bloom.day.threshold);Dr(c);let u=1;const f=c.setSize.bind(c);c.setSize=(S,C)=>f(Math.max(1,Math.round(S*u)),Math.max(1,Math.round(C*u)));const h=new nn(Cr),m=new Tr;for(const S of[i,l,c,h,m])n.addPass(S);const d={quality:null,mobile:a,half:!1,outline:{enabled:!0,scale:1,width:1,color:j.outline.day},bloom:{...j.bloom.day,scale:1},grade:null,phase:null,passes:["RenderPass","ToonOutline","UnrealBloom","ToonGrade","Output"]},g=S=>"#"+S.getHexString();function p(S=1,C=innerWidth,D=innerHeight,W=1){const R=a||S===0;u=R?.5:1,l.setScale(R?.5:1,Ts(S)),n.setPixelRatio(W),n.setSize(C,D),Object.assign(d,{quality:S,half:R}),Object.assign(d.outline,{scale:l.scale,width:l.width}),d.bloom.scale=u}function x(S={}){const C=Lt(S),D=Ms(S),W=ks(S),R=zs(S);c.threshold=D.threshold,c.strength=D.strength,c.radius=D.radius;const k=h.uniforms;return k.saturation.value=W.saturation,k.contrast.value=W.contrast,k.lift.value=W.lift,k.shadowGain.value=W.shadowGain,k.highlight.value.setRGB(...W.highlight,gt),k.highlightAmount.value=W.highlightAmount,k.shadow.value.setRGB(...W.shadow,gt),k.shadowAmount.value=W.shadowAmount,l.compositeMaterial.uniforms.outlineColor.value.setRGB(...R.color,gt),l.compositeMaterial.uniforms.outlineStrength.value=R.strength,l.enabled=R.strength>.01,d.outline.enabled=l.enabled,d.outline.strength=R.strength,Object.assign(d.bloom,D),d.outline.color=g(l.compositeMaterial.uniforms.outlineColor.value),d.grade=W,d.phase=C,d}function v(S){n.render(S)}function y(){l.dispose(),c.dispose(),h.material.dispose(),m.dispose?.(),n.dispose(),s.depthTexture?.dispose()}return{composer:n,passes:{renderPass:i,outline:l,bloom:c,grade:h,output:m},resize:p,update:x,render:v,dispose:y,status:d}}const St=e=>new rt().setRGB(...ft(e),gt);function Vt(e){let t=e>>>0;return()=>(t=Math.imul(t,1664525)+1013904223>>>0)/4294967296}const le=(e,t,o)=>{const a=Math.max(0,Math.min(1,(o-e)/(t-e)));return a*a*(3-2*a)},Bt={trunk:0,leaf:1,twig:2,needle:3,bush:4,farCrown:6};class He{constructor(){this.p=[],this.n=[],this.c=[],this.s=[],this.extra=[],this.parts=[],this.part=0}vertex(t,o,a,r=0,s=0){this.p.push(t.x,t.y,t.z),this.n.push(o.x,o.y,o.z),this.c.push(a.r,a.g,a.b),this.s.push(r),this.extra.push(s),this.parts.push(this.part)}geometry(t,{extra:o=null}={}){const a=new bt;return a.setAttribute("position",new st(this.p,3)),a.setAttribute("normal",new st(this.n,3)),a.setAttribute("color",new st(this.c,3)),a.setAttribute("toonSway",new st(this.s,1)),o&&a.setAttribute(o,new st(this.extra,1)),a.setAttribute("toonPart",new st(this.parts,1)),a.computeBoundingBox(),a.computeBoundingSphere(),a.name=t,a.userData.shared=!0,a.userData.toonNature=!0,a}get triangles(){return this.p.length/9}}function ea(e,{center:t,radius:o,detail:a,seed:r,crown:s,leaf:n,shade:i,swayOf:l,jag:c=.17,bend:u=.55,variation:f=0,tufts:h=0}){const m=new $e(1,a),d=m.attributes.position,g=Vt(r),p=[0,1,2,3].map(()=>new N(g()*2-1,g()*2-1,g()*2-1).normalize()),x=p.map(()=>g()*6.283),v=new N,y=new N,S=new N,C=new N,D=new rt,W=1+f*(g()*2-1);for(let w=0;w<d.count;w++){v.fromBufferAttribute(d,w).normalize();const A=Math.sin(v.dot(p[0])*5.3+x[0])*Math.sin(v.dot(p[1])*4.7+x[1])*.5+Math.sin(v.dot(p[2])*8.1+x[2])*.3+Math.sin(v.dot(p[3])*13.7+x[3])*.2,z=1+c*A;y.set(t.x+v.x*o.x*z,t.y+v.y*o.y*z,t.z+v.z*o.z*z),S.set(v.x/o.x,v.y/o.y,v.z/o.z).normalize(),C.copy(y).sub(s).normalize(),S.lerp(C,u).normalize();const F=(.8+.2*le(-.75,.85,C.y))*(.9+.1*le(-.4,.6,v.dot(C)))*W,_=le(-.35,.35,A);D.copy(i).lerp(n,le(-.55,.7,C.y)*(.7+.3*_)).multiplyScalar(F*(.9+.14*_)),e.vertex(y,S,D,l(y.y))}m.dispose();const R=new N,k=new N,M=[new N,new N,new N,new N];for(let w=0;w<h;w++){const A=1-2*(w+.5)/h,z=Math.sqrt(1-A*A),F=w*2.39996+g()*.6;if(v.set(Math.cos(F)*z,A,Math.sin(F)*z).normalize(),v.y<-.5&&g()<.75)continue;const _=Math.sin(v.dot(p[0])*5.3+x[0])*Math.sin(v.dot(p[1])*4.7+x[1])*.5+Math.sin(v.dot(p[2])*8.1+x[2])*.3+Math.sin(v.dot(p[3])*13.7+x[3])*.2,L=(1+c*_)*(.96+g()*.06),I=Math.min(o.x,o.y)*(.2+g()*.1);y.set(t.x+v.x*o.x*L,t.y+v.y*o.y*L,t.z+v.z*o.z*L),R.set(-v.z,0,v.x),R.lengthSq()<1e-4&&R.set(1,0,0),R.normalize().applyAxisAngle(v,g()*6.283),k.crossVectors(v,R);const O=.6+g()*.45,H=k.clone().multiplyScalar(Math.cos(O)).addScaledVector(v,Math.sin(O));M[0].copy(y).addScaledVector(H,-I*.35),M[2].copy(y).addScaledVector(H,I*.95),M[1].copy(y).addScaledVector(H,I*.25).addScaledVector(R,I*.36),M[3].copy(y).addScaledVector(H,I*.25).addScaledVector(R,-I*.36),C.copy(M[2]).sub(s).normalize(),S.copy(v).lerp(C,u).normalize();const E=(.78+.26*le(-.75,.85,C.y))*W*(.96+g()*.12);D.copy(i).lerp(n,le(-.55,.7,C.y)).multiplyScalar(E);const U=new N().subVectors(M[1],M[0]).cross(new N().subVectors(M[2],M[0])).dot(v)>0?[0,1,2,0,2,3]:[0,2,1,0,3,2];for(const K of U)e.vertex(M[K],S,D,l(M[K].y))}}function ge(e,{a:t,b:o,ra:a,rb:r,sides:s,rings:n=2,color:i,swayOf:l,flare:c=1,bow:u=null,seed:f=1,dark:h=.78}){const m=new N().subVectors(o,t),d=m.length();m.normalize();const g=Math.abs(m.y)>.95?new N(1,0,0):new N(0,1,0),p=new N().crossVectors(m,g).normalize(),x=new N().crossVectors(m,p).normalize(),v=D=>{const W=t.clone().addScaledVector(m,d*D);u&&W.addScaledVector(u,Math.sin(D*Math.PI));const R=Pt.lerp(a,r,D)*(1+(c-1)*Math.pow(1-D,6));return{c:W,rr:R}},y=[];for(let D=0;D<=n;D++)y.push(v(D/n));const S=(D,W)=>{const R=W/s*Math.PI*2,k=p.clone().multiplyScalar(Math.cos(R)).addScaledVector(x,Math.sin(R));return{p:D.c.clone().addScaledVector(k,D.rr),n:k}},C=new rt;for(let D=0;D<n;D++)for(let W=0;W<s;W++){const R=[S(y[D],W),S(y[D],W+1),S(y[D+1],W+1),S(y[D+1],W)];for(const k of[0,1,2,0,2,3]){const M=(D+(k===2||k===3?1:0))/n;C.copy(i).multiplyScalar(Pt.lerp(h,1,Math.min(1,M*1.4+.2))),e.vertex(R[k].p,R[k].n,C,l(R[k].p.y))}}}function Fr(e,{y:t,height:o,radius:a,segments:r,seed:s,needle:n,shade:i,swayOf:l,droop:c=.25,offset:u=new N,tufts:f=0}){const h=Vt(s),m=new N(u.x,t+o,u.z),d=new N(u.x,t+o*.18,u.z),g=[];for(let y=0;y<r;y++){const S=y/r*Math.PI*2+h()*.12,C=y%2?.74+h()*.12:1+h()*.08,D=a*C;g.push(new N(u.x+Math.cos(S)*D,t-c*o*(C>.9?1:.4),u.z+Math.sin(S)*D))}const p=new rt,x=new N,v=new N;new N;for(let y=0;y<r;y++){const S=g[y],C=g[(y+1)%r];for(const[D,W]of[[m,1],[C,0],[S,0]])x.set(D.x-u.x,0,D.z-u.z),x.lengthSq()<1e-6?x.set(0,1,0):x.normalize().multiplyScalar(.75),x.y=W?1:.55,x.normalize(),p.copy(n).multiplyScalar(W?1.08:.9),e.vertex(D,x,p,l(D.y));for(const D of[d,S,C])v.set(D.x-u.x,0,D.z-u.z),v.lengthSq()>1e-6&&v.normalize().multiplyScalar(.5),x.set(v.x,-1,v.z).normalize(),p.copy(i),e.vertex(D,x,p,l(D.y));for(let D=0;D<f;D++){const W=(D+.5)/f,R=S.clone().lerp(C,W),k=new N(R.x-u.x,0,R.z-u.z),M=k.length()||1;k.multiplyScalar(1/M);const w=new N(-k.z,0,k.x),A=a*(.16+h()*.1),z=R.clone().addScaledVector(w,A*.45).addScaledVector(k,-A*.3),F=R.clone().addScaledVector(w,-A*.45).addScaledVector(k,-A*.3),_=R.clone().addScaledVector(k,A*.9).add(new N(0,-A*(.25+h()*.3),0));x.set(k.x*.6,.8,k.z*.6).normalize(),p.copy(n).multiplyScalar(.86+h()*.1);for(const L of[z,F,_,F,z,_])e.vertex(L,x,p,l(L.y))}}}const ka={tree_small_02:{kind:"broadleaf",height:9.4,width:9,seed:11,lean:.15},island_tree_01:{kind:"broadleaf",height:10.4,width:10.4,seed:23,lean:.25},pine_tree_01:{kind:"pine",height:12.4,width:6.4,seed:31},pine_sapling_medium:{kind:"sapling",height:5,width:3.4,seed:47}},Rr=[{lumps:7,detail:2,trunkSides:9,branches:4,rings:4,tufts:40,twigs:5,forks:2,twigSides:4},{lumps:5,detail:1,trunkSides:6,branches:3,rings:3,tufts:10,twigs:3,forks:1,twigSides:3},{lumps:2,detail:1,trunkSides:4,branches:0,rings:1,tufts:0,twigs:3,forks:1,twigSides:3}];function Nr(e,t,o){const a=Rr[t],r=new He,s=Vt(e.seed),n=e.height,i=e.width,l=p=>.42*Math.pow(Math.max(0,p)/n,2),c=n*.3,u=new N(e.lean*i*.08,0,0),f=new N(u.x,n*.66,0),h=new N(u.x,c,0);ge(r,{a:new N(0,0,0),b:a.branches?h.clone().add(new N(0,n*.05,0)):new N(u.x,n*.6,0),ra:i*.06,rb:a.branches?i*.045:i*.035,sides:a.trunkSides,rings:a.rings,color:o.trunk,swayOf:l,flare:1.6,bow:new N(i*.025,0,i*.015)});const m=[{c:new N(f.x+i*.02,n*.84,-i*.02),r:i*.25}],d=Math.max(1,Math.ceil((a.lumps-1)*.6)),g=Math.max(0,a.lumps-1-d);for(let p=0;p<d;p++){const x=p/d*Math.PI*2+s()*.4+.3,v=i*(.24+s()*.04),y=n*(.7+s()*.05);m.push({c:new N(f.x+Math.cos(x)*v,y,f.z+Math.sin(x)*v),r:i*(.22+s()*.03)})}for(let p=0;p<g;p++){const x=p/g*Math.PI*2+s()*.5+1.1,v=i*(.27+s()*.03),y=n*(.55+s()*.04);m.push({c:new N(f.x+Math.cos(x)*v,y,f.z+Math.sin(x)*v),r:i*(.18+s()*.03)})}a.lumps===2&&(m.length=2,m[0].r=i*.36,m[0].c.set(f.x,n*.72,0),m[1].c.set(f.x+i*.15,n*.6,-i*.1),m[1].r=i*.3);for(let p=0;p<a.branches&&p<m.length-1;p++){const x=m[p+1].c.clone();x.y-=m[p+1].r*.35,ge(r,{a:h.clone(),b:x,ra:i*.032,rb:i*.016,sides:Math.max(4,a.trunkSides-3),rings:2,color:o.trunk,swayOf:l,dark:.92,bow:new N(0,n*.03,0)})}return a.branches&&ge(r,{a:h.clone(),b:m[0].c.clone().add(new N(0,-m[0].r*.5,0)),ra:i*.03,rb:i*.015,sides:Math.max(4,a.trunkSides-3),rings:1,color:o.trunk,swayOf:l,dark:.92}),a.twigs&&sn(r,{lumps:m,fork:h,W:i,H:n,L:a,palette:o,swayOf:l,seed:e.seed*31}),r.part=t===2?Bt.farCrown:Bt.leaf,m.forEach((p,x)=>ea(r,{center:p.c,radius:new N(p.r,p.r*.84,p.r),detail:a.detail,seed:e.seed*7+x,crown:f,leaf:o.leaf,shade:o.leafShade,swayOf:l,jag:t===2?.06:.09,bend:.6,variation:.06,tufts:a.tufts})),r.part=Bt.trunk,r}function sn(e,{lumps:t,fork:o,W:a,H:r,L:s,palette:n,swayOf:i,seed:l}){const c=Vt(l),u=new N,f=e.part;e.part=Bt.twig;const h=(m,d,g,p,x)=>ge(e,{a:m,b:d,ra:g,rb:p,sides:x,rings:1,color:n.trunk,swayOf:i,dark:.95});t.forEach((m,d)=>{const g=m.c.clone();g.y-=m.r*(d===0?.5:.35),(d>s.branches||!s.branches)&&h(o.clone(),g,a*.026,a*.013,4);for(let p=0;p<s.twigs;p++){const x=p/s.twigs*Math.PI*2+c()*.8,v=.35+c()*.55;u.set(Math.cos(x)*(1-v*.6),v,Math.sin(x)*(1-v*.6)).normalize();const y=m.r*(.95+c()*.3),S=g.clone().addScaledVector(u,y);h(g,S,a*.012,a*.004,s.twigSides);for(let C=0;C<s.forks;C++){const D=g.clone().addScaledVector(u,y*(.45+C*.2)),W=new N(-u.z,0,u.x).normalize().multiplyScalar(C%2?-1:1),R=u.clone().multiplyScalar(.7).addScaledVector(W,.6+c()*.3);R.y+=.25,R.normalize(),h(D,D.clone().addScaledVector(R,y*(.38+c()*.15)),a*.006,a*.0025,3)}}}),e.part=f}const Wr=[{tiers:8,segments:14,trunkSides:7,rings:3,tufts:3},{tiers:6,segments:9,trunkSides:5,rings:2,tufts:2},{tiers:4,segments:7,trunkSides:3,rings:1,tufts:1}];function Lr(e,t,o,{sapling:a=!1}={}){const r=Wr[t],s=new He,n=Vt(e.seed),i=e.height,l=e.width,c=m=>(a?.12:.3)*Math.pow(Math.max(0,m)/i,2),u=new N(0,i*.97,0);ge(s,{a:new N(0,0,0),b:u,ra:l*.06,rb:l*.015,sides:r.trunkSides,rings:r.rings,color:o.pineTrunk,swayOf:c,flare:1.35});const f=Math.max(3,r.tiers-(a?2:0)),h=i*(a?.2:.16);for(let m=0;m<f;m++){const d=m/(f-1),g=Pt.lerp(h,i*.86,Math.pow(d,.9)),p=l*Pt.lerp(.5,.1,d)*(.92+n()*.16),x=new N((n()-.5)*l*.04,0,(n()-.5)*l*.04);s.part=Bt.needle,Fr(s,{y:g,height:i*Pt.lerp(a?.22:.15,a?.16:.12,d),radius:p,segments:r.segments,seed:e.seed*13+m,needle:o.pine,shade:o.pineShade,swayOf:c,offset:x,droop:.5,tufts:r.tufts}),s.part=Bt.trunk}return s}const Pr=[{detail:2,tufts:10,trunkSides:5,branches:0,twigs:4,forks:1,twigSides:3},{detail:1,tufts:3,trunkSides:4,branches:0,twigs:3,forks:0,twigSides:3},{detail:1,tufts:0,trunkSides:3,branches:0,twigs:3,forks:1,twigSides:3}];function Br(e,t,o){const a=Pr[t],r=new He,s=Vt(e.seed),n=e.height,i=e.width,l=f=>.14*Math.pow(Math.max(0,f)/n,2),c=new N(0,n*.42,0);ge(r,{a:new N(0,0,0),b:new N(0,n*.3,0),ra:i*.05,rb:i*.035,sides:a.trunkSides,rings:1,color:o.trunk,swayOf:l,flare:1.4});const u=[];for(let f=0;f<3;f++){const h=f/3*Math.PI*2+s()*.5;u.push([Math.cos(h)*i*.2,n*(.3+s()*.04),Math.sin(h)*i*.2,i*(.3+s()*.04)])}return u.push([i*.04,n*.52,-i*.03,i*.34],[-i*.05,n*.7,i*.02,i*.26]),t===2&&u.splice(0,u.length,[0,n*.36,0,i*.42],[i*.03,n*.66,-i*.02,i*.3]),sn(r,{lumps:u.map(([f,h,m,d])=>({c:new N(f,h,m),r:d*.8})),fork:new N(0,n*.28,0),W:i,H:n,L:a,palette:o,swayOf:l,seed:e.seed*29}),r.part=t===2?Bt.farCrown:Bt.leaf,u.forEach(([f,h,m,d],g)=>ea(r,{center:new N(f,h,m),radius:new N(d,d*.9,d),detail:a.detail,seed:e.seed*5+g,crown:c,leaf:o.bush,shade:o.bushShade,swayOf:l,jag:.08,bend:.6,variation:.06,tufts:a.tufts})),r.part=Bt.trunk,r}function Er(e){const t=new He;t.part=Bt.bush;const o=new N(0,.4,0),a=r=>.06*Math.pow(Math.max(0,r)/1.1,2);return[[0,.6,0,.4],[.36,.42,.14,.32],[-.3,.4,-.22,.33]].forEach(([r,s,n,i],l)=>ea(t,{center:new N(r,s,n),radius:new N(i*1.12,i*.86,i*1.12),detail:2,seed:500+l,crown:o,leaf:e.bush,shade:e.bushShade,swayOf:a,jag:.08,bend:.6,variation:.06,tufts:8})),t}function ce({blades:e=9,height:t=.42,spread:o=.2,flowers:a=1,seed:r=3}={},s){const n=new He,i=Vt(r),l=new rt,c=new N(0,1,0);for(let u=0;u<e;u++){const f=u*2.399+i()*.4,h=o*(.15+i()*.85),m=Math.cos(f)*h,d=Math.sin(f)*h,g=t*(.6+i()*.55),p=.016+i()*.012,x=.12+i()*.18,v=.25+i()*.3,y=f+Math.PI/2+(i()-.5)*.6,S=Math.cos(y),C=Math.sin(y),D=Math.cos(f),W=Math.sin(f),R=U=>{const K=g*(x*U+v*U*U*U);return new N(m+D*K,g*U*(1-v*.35*U*U),d+W*K)},k=R(.4),M=R(.75),w=R(1),A=(U,K)=>[U.clone().add(new N(-S*p*K,0,-C*p*K)),U.clone().add(new N(S*p*K,0,C*p*K))],[z,F]=A(new N(m,0,d),1),[_,L]=A(k,1.05),[I,O]=A(M,.75),H=new N(D*.3,1,W*.3).normalize(),E=U=>l.copy(s.grassBase).lerp(s.grassTip,U).clone(),Q=U=>.16*Math.pow(Math.max(0,U)/t,2);for(const[U,K]of[[z,0],[F,0],[L,.4],[z,0],[L,.4],[_,.4],[_,.4],[L,.4],[O,.75],[_,.4],[O,.75],[I,.75],[I,.75],[O,.75],[w,1]])n.vertex(U,H,E(K),Q(U.y),0)}for(let u=0;u<a;u++){const f=i()*6.283,h=o*.5*i(),m=Math.cos(f)*h,d=Math.sin(f)*h,g=t*(.62+i()*.25),p=.05,x=new N(m,g,d),v=s.grassBase.clone().lerp(s.grassTip,.5);for(const y of[new N(m-.008,0,d),new N(m+.008,0,d),x])n.vertex(y,c,v,.14*Math.pow(y.y/t,2),0);for(const y of[0,Math.PI/4]){const S=[0,1,2,3].map(C=>{const D=y+C*Math.PI/2;return new N(m+Math.cos(D)*p,g+(C%2?.03:-.03),d+Math.sin(D)*p)});for(const[C,D,W]of[[0,1,2],[0,2,3]])for(const R of[S[C],S[D],S[W]])n.vertex(R,c,new rt(1,1,1),.14*Math.pow(g/t,2),1)}}return n}const rn={rock_09:{size:[.08,.034,.14],seed:91,lumps:[[0,.42,0,.5,.55,.5,.15,0]]},boulder_01:{size:[1.28,1,1.83],seed:17,lumps:[[0,.45,0,.5,.55,.5,.18,-.08]]},rock_face_01:{size:[4.96,3.56,3.82],seed:53,cliff:!0,lumps:[[-.18,.36,0,.34,.4,.46,.12,0],[.2,.42,.04,.3,.46,.42,-.18,.06],[-.02,.72,-.04,.28,.27,.36,.28,0]]},rock_face_02:{size:[2.72,2.47,2.12],seed:67,cliff:!0,lumps:[[-.12,.4,0,.38,.42,.48,.1,0],[.18,.6,.02,.3,.38,.4,-.25,.05]]},mountainside:{size:[10.2,10.5,5.24],seed:79,cliff:!0,lumps:[[0,.26,0,.5,.34,.5,.05,0],[-.1,.58,.02,.42,.3,.46,.35,.05],[.16,.78,-.02,.34,.24,.42,-.45,0]]}};function ln({center:e,radius:t,rotation:o=new Jo,seed:a=1,floor:r=-1/0,cuts:s=5,flatTop:n=!0}){const i=Vt(a),l=qa(new $e(1,1).deleteAttribute("uv").deleteAttribute("normal")),c=l.attributes.position,u=[0,1].map(()=>({d:new N(i()-.5,i()-.5,i()-.5).normalize(),f:1.2+i(),ph:i()*6.283,a:.06+i()*.04})),f={d:new N((i()-.5)*.5,1,(i()-.5)*.5).normalize(),at:.72+i()*.1},h=n?[f]:[];for(let d=1;d<s;d++){const g=d/(s-1)*Math.PI*2+i()*.9,p=(i()-.35)*.9;h.push({d:new N(Math.cos(g),p,Math.sin(g)).normalize(),at:.78+i()*.14})}const m=new N;for(let d=0;d<c.count;d++){m.fromBufferAttribute(c,d);let g=1;for(const p of u)g+=p.a*Math.sin(m.dot(p.d)*p.f*3.1416+p.ph);m.multiplyScalar(g);for(const p of h){const x=m.dot(p.d)-p.at;x>0&&m.addScaledVector(p.d,-x*.7)}m.set(m.x,m.y*(m.y>0?.95:1.1),m.z).multiply(t).applyEuler(o).add(e),m.y=Math.max(m.y,r+d*1e-5),c.setXYZ(d,m.x,m.y,m.z)}return l.computeVertexNormals(),l}function $r(e){const t=rn[e];if(!t)return null;const[o,a,r]=t.size,s=Vt(t.seed),n=[];t.lumps.forEach(([l,c,u,f,h,m,d,g],p)=>n.push(ln({center:new N(l*o,c*a,u*r),radius:new N(f*o,h*a,m*r),rotation:new Jo(g,s()*.6-.3,d),seed:t.seed*11+p,floor:-a*.06})));const i=n.length>1?Se(n):n[0];return n.length>1&&n.forEach(l=>l.dispose()),i.computeBoundingBox(),i.computeBoundingSphere(),i.name=`toon-rock-${e}`,i.userData.shared=!0,i.userData.toonNature=!0,i.userData.cliff=!!t.cliff,i}const za=`
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
`,Ta=`
#if defined(USE_COLOR)||defined(USE_INSTANCING_COLOR)
vColor=vec3(1.);
#endif
#ifdef USE_COLOR
vColor*=color.rgb;
#endif
#if defined(USE_COLOR)||defined(USE_INSTANCING_COLOR)
{vec2 a=tnAnchor().xz;float h=tnHash(a),g=tnHash(a+17.3);vColor*=mix(vec3(.88,.93,.84),vec3(1.08,1.06,.96),h)*mix(vec3(1.06,1.02,.9),vec3(.94,1.,1.06),g);}
#endif`,Hr=e=>`
{
 vec3 a=tnAnchor();float th=tnHash(a.xz+41.7);int part=int(toonPart+.5);vec3 c=vColor;
 if(part==1||part==6){float t=clamp((tsLuma(c)-${e.leafShade})/${e.leafSpan},0.,1.3);c=tsLeafColor(c,t,th,a.y);
  if(part==6)c=mix(c,tsPair(t,TS_TWIG,TS_TWIG_SHADE)*.8,tsW.w);}
 else if(part==4){float t=clamp((tsLuma(c)-${e.bushShade})/${e.bushSpan},0.,1.3);c=tsBushColor(c,t,th);c=mix(c,tsPair(t,TS_TWIG*.85,TS_TWIG_SHADE*.75),tsW.w);}
 else if(part==3){float t=clamp((tsLuma(c)-${e.pineShade})/${e.pineSpan},0.,1.3);c=mix(c,tsPair(t,TS_PINE,TS_PINE_SHADE),tsW.z*.6+tsW.w);}
 else c=mix(c,TS_BARK*clamp(tsLuma(c)/${e.trunk},.6,1.2),tsW.w*.85);
 vColor=c;vTsPart=float(part);
}`,Ir=`
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
}`,Or=`
if(tsW.w>.01){
 float p=vTsPart,snow=p<2.5?tsSnowCover(vTnLeaf*3.,vTsUp,.3,.55):p<3.5?tsSnowCover(vTnLeaf*1.7,vTsUp,.5,.78):p<4.5?tsSnowCover(vTnLeaf*1.3,vTsUp,-.45,.05):.3*tsSnowCover(vTnLeaf*.8,vTsUp,.45,.85);
 diffuseColor.rgb=mix(diffuseColor.rgb,TS_SNOW,snow);
}`,_a=`
{
 // 수관 전체가 한 몸으로 기울었다 돌아오고(돌풍), 잎 덩어리는 조금 빠르게 떤다. 밑동(toonSway=0)은 고정.
 vec3 a=tnAnchor();
 // 개체 변이: 가지·수관(흔들림이 있는 부분)만 옆으로 0.82~1.18배, 위로 0.9~1.1배(밑동은 그대로 접지).
 {float h1=tnHash(a.xz+3.7),h2=tnHash(a.xz+9.1),k=smoothstep(0.,.03,toonSway);transformed.xz*=mix(1.,.82+.36*h1,k);transformed.y*=mix(1.,.9+.2*h2,k);}
 float gust=sin(foliageTime*1.25+a.x*.071+a.z*.053)*.65+sin(foliageTime*2.07+a.z*.113+a.x*.031)*.35;
 float flutter=sin(foliageTime*4.1+dot(position,vec3(1.7,2.3,1.9)));
 transformed.xz+=toonWindDir*(gust*.75+.3)*toonSway*toonWaveStrength+vec2(-toonWindDir.y,toonWindDir.x)*flutter*toonSway*.14;
 transformed.y-=abs(gust)*toonSway*.08;
}`,Gr=`
float tnH3(vec3 p){p=fract(p*.1031);p+=dot(p,p.zyx+31.32);return fract((p.x+p.y)*p.z);}
float tnN3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(tnH3(i),tnH3(i+vec3(1,0,0)),f.x),mix(tnH3(i+vec3(0,1,0)),tnH3(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(tnH3(i+vec3(0,0,1)),tnH3(i+vec3(1,0,1)),f.x),mix(tnH3(i+vec3(0,1,1)),tnH3(i+vec3(1,1,1)),f.x),f.y),f.z);}
// 잎 무늬 값(0~1): 큰 잎 뭉치 + 작은 잎 두 겹의 값 잡음. 크면 밝은 잎 뭉치, 작으면 잎 사이 짙은 틈.
float tnLeaf(vec3 p){return tnN3(p*vec3(1.,1.3,1.))*.6+tnN3(p*2.3+vec3(4.1,1.7,8.3))*.4;}`,Ca=`
#if NUM_DIR_LIGHTS > 0
{
 vec3 tnL=directionalLights[0].direction,tnV=normalize(vViewPosition);
 float tnBack=pow(clamp(dot(-tnV,tnL),0.,1.),2.);
 float tnEdge=pow(1.-clamp(dot(normal,tnV),0.,1.),2.5);
 reflectedLight.directDiffuse+=diffuseColor.rgb*vec3(1.3,1.12,.55)*directionalLights[0].color*tnBack*tnEdge*RIM;
}
#endif`;function Ur({gradientMap:e,uniforms:t}){const o=j.nature,a={leaf:St(o.leaf),leafShade:St(o.leafShade),trunk:St(o.trunk),pine:St(o.pine),pineShade:St(o.pineShade),pineTrunk:St(o.pineTrunk),sapling:St(o.sapling),saplingShade:St(o.saplingShade),bush:St(o.bush),bushShade:St(o.bushShade),grassBase:St(o.grassBase),grassTip:St(o.grassTip)},r={parts:0,triangles:{},grassSwaps:0,shrubSwaps:0,rocks:0},s=w=>w.r*.2126+w.g*.7152+w.b*.0722,n=w=>w.toFixed(4),i={leafShade:n(s(a.leafShade)),leafSpan:n(s(a.leaf)-s(a.leafShade)),bushShade:n(s(a.bushShade)),bushSpan:n(s(a.bush)-s(a.bushShade)),pineShade:n(s(a.pineShade)),pineSpan:n(s(a.pine)-s(a.pineShade)),trunk:n(s(a.trunk))},l=w=>{w.uniforms.foliageTime=ae.foliageTime,w.uniforms.toonWaveStrength=t.toonWaveStrength,w.uniforms.toonWindDir=t.toonWindDir},c=new Ye({name:"toon-nature-foliage",gradientMap:e,vertexColors:!0});c.onBeforeCompile=w=>{l(w),pe(w),w.vertexShader=w.vertexShader.replace("#include <common>",`#include <common>
`+za+Yt+"attribute float toonPart;varying vec3 vTnLeaf;varying float vTsPart;varying float vTsUp;").replace("#include <color_vertex>",Ta+Hr(i)).replace("#include <begin_vertex>",`#include <begin_vertex>
vTnLeaf=position+tnAnchor()*.37;
`+_a+Ir),w.fragmentShader=w.fragmentShader.replace("#include <common>",`#include <common>
varying vec3 vTnLeaf;varying float vTsPart;varying float vTsUp;
`+Yt+Gr).replace("#include <color_fragment>",`#include <color_fragment>
    {
     // 잎 무늬(카툰 2차, 참고 01_08·01_19·01_22): 덩어리 표면에 밝은 잎 뭉치와 그 사이 짙은 틈. 한 덩어리가 단색 판으로 보이지 않게.
     // 잎 뭉치(${o.leafCell}m)가 픽셀보다 잘아지면 접는다.
     float px=length(vViewPosition)*.0014,fade=1.-smoothstep(.1,.4,px/${o.leafCell.toFixed(3)});
     // 잎 정점만(부위 1·3·4·6): 줄기·가지는 무늬 없이. 접힌 곳은 잡음을 계산하지 않는다(GPU 절약). 단풍색도 잎으로 본다.
     fade*=step(.5,abs(vTsPart-2.))*step(.5,vTsPart);
     if(fade>.01){float lf=tnLeaf(vTnLeaf/${o.leafCell.toFixed(3)});
     diffuseColor.rgb*=1.+fade*(${o.leafLight.toFixed(3)}*smoothstep(.58,.66,lf)-${o.leafGap.toFixed(3)}*(1.-smoothstep(.26,.34,lf)));}
    }
    ${Or}`).replace("#include <lights_fragment_end>",`#include <lights_fragment_end>
`+Ca.replace("RIM",o.rim.toFixed(3)))},c.customProgramCacheKey=()=>"toon-nature-foliage-v3-season",c.userData.shared=!0,c.userData.toonNature="foliage";const u=w=>`vec3(${w.r.toFixed(4)},${w.g.toFixed(4)},${w.b.toFixed(4)})`,f=Object.fromEntries(["spring","summer","autumn","winter"].map(w=>[w,xa[w]?xa[w].map(A=>u(on(A))):[u(a.grassBase),u(a.grassTip)]])),h=(w=!1)=>{const A=new Ye({name:w?"toon-nature-grass-field":"toon-nature-grass",gradientMap:e,vertexColors:!0,side:Ct}),z={tgFieldRadius:{value:30}};return w&&(A.userData.fieldUniforms=z),A.onBeforeCompile=F=>{l(F),pe(F),w&&Object.assign(F.uniforms,z),Object.assign(F.uniforms,{tgFlowerA:{value:St(o.flowerA)},tgFlowerB:{value:St(o.flowerB)},tgBand:{value:St(o.grassBand)}}),F.vertexShader=F.vertexShader.replace("#include <common>",`#include <common>
`+za+Yt+"attribute float toonFlower;uniform vec3 tgFlowerA,tgFlowerB;uniform float tgFieldRadius;varying float vTgBand;varying float vTgTip;").replace("#include <color_vertex>",Ta+`
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
    ${w?`{
     // 카메라 둘레 풀밭의 바깥 테두리: 다발을 줄여 사라지게 한다(경계선이 보이지 않게).
     float fd=distance(tnAnchor().xz,cameraPosition.xz);transformed*=1.-smoothstep(tgFieldRadius*.6,tgFieldRadius*.97,fd);
    }`:""}
    ${_a}
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
    }`),F.fragmentShader=F.fragmentShader.replace("#include <common>",`#include <common>
uniform vec3 tgBand;uniform float toonWaveStrength;uniform vec4 tsW;varying float vTgBand;varying float vTgTip;`).replace("#include <color_fragment>",`#include <color_fragment>
    diffuseColor.rgb=mix(diffuseColor.rgb,tgBand*mix(.8,1.,vTgTip),vTgBand*${o.bandAmount.toFixed(3)}*toonWaveStrength*vTgTip*(1.-tsW.w-tsW.z*.6));`).replace("#include <normal_fragment_begin>",`#include <normal_fragment_begin>
 normal=normalize(vNormal);`).replace("#include <lights_fragment_end>",`#include <lights_fragment_end>
`+Ca.replace("RIM",(o.rim*.6).toFixed(3))).replace("#include <opaque_fragment>",`#include <opaque_fragment>
 gl_FragColor.a=min(gl_FragColor.a,.5);`)},A.customProgramCacheKey=()=>`toon-nature-grass-v3-season${w?"-field":""}`,A.userData.shared=!0,A.userData.toonNature="grass",A},m=h(),d=h(!0),g=w=>{const A=new Ye({name:w?"toon-nature-cliff":"toon-nature-rock",gradientMap:e,color:St(o.rock)});return A.onBeforeCompile=z=>{Object.assign(z.uniforms,{trMoss:{value:St(o.moss)},trMossDark:{value:St(o.mossDark)},trDark:{value:St(o.rockDark)}}),pe(z),z.vertexShader=z.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vTrWorld;varying vec3 vTrNormal;varying vec3 vTrLocal;`).replace("#include <project_vertex>",`#include <project_vertex>
     {
      vec4 w=vec4(transformed,1.);vec3 nn=objectNormal;
      #ifdef USE_INSTANCING
      w=instanceMatrix*w;nn=mat3(instanceMatrix)*nn;
      #endif
      vTrWorld=(modelMatrix*w).xyz;vTrNormal=normalize(mat3(modelMatrix)*nn);vTrLocal=transformed;
     }`),z.fragmentShader=z.fragmentShader.replace("#include <lights_fragment_end>",`#include <lights_fragment_end>
 reflectedLight.indirectDiffuse*=vec3(${o.rockShadeTint.join(",")});
${Oo("trRockMask",o.rockShadeDirect.toFixed(3))}`).replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
     trcBaseN=normal;`).replace("#include <common>",`#include <common>
    uniform vec3 trMoss,trMossDark,trDark;varying vec3 vTrWorld;varying vec3 vTrNormal;varying vec3 vTrLocal;
    float trRockMask=1.;${Io}${Yt}
    ${Ho}${Je}
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
     }`)},A.customProgramCacheKey=()=>`toon-nature-rock-v6-season-${w?"cliff":"rock"}`,A.userData.shared=!0,A.userData.toonNature="rock",A.userData.toonRock=!0,A},p={rock:g(!1),cliff:g(!0)},x=new Map;function v(w){const A=/([a-z0-9_]+)-lod(\d)\.glb$/.exec(String(w));if(!A)return null;const[,z,F]=A,_=Math.min(2,+F),L=`${z}:${_}`;if(x.has(L))return x.get(L);let I=null;if(rn[z]){const O=$r(z);I=[{geometry:O,material:O.userData.cliff?p.cliff:p.rock}],r.rocks++}else if(ka[z]){const O=ka[z];I=[{geometry:(O.kind==="broadleaf"?Nr(O,_,a):O.kind==="sapling"?Br(O,_,a):Lr(O,_,a)).geometry(`toon-${z}-lod${_}`),material:c}]}return I&&(r.parts++,r.triangles[L]=I.reduce((O,H)=>O+H.geometry.attributes.position.count/3,0)),x.set(L,I),I}const y={grass:ce({blades:12,height:.5,spread:.22,flowers:2,seed:5},a).geometry("toon-grass-clump",{extra:"toonFlower"}),short:ce({blades:8,height:.34,spread:.26,flowers:1,seed:9},a).geometry("toon-grass-short",{extra:"toonFlower"}),tall:ce({blades:14,height:.7,spread:.3,flowers:2,seed:13},a).geometry("toon-grass-tall",{extra:"toonFlower"}),forest:ce({blades:7,height:.44,spread:.18,flowers:1,seed:17},a).geometry("toon-grass-forest",{extra:"toonFlower"}),field:ce({blades:17,height:.58,spread:.42,flowers:2,seed:21},a).geometry("toon-grass-field",{extra:"toonFlower"}),fieldFar:ce({blades:8,height:.58,spread:.42,flowers:2,seed:21},a).geometry("toon-grass-field-far",{extra:"toonFlower"})},S=Er(a).geometry("toon-shrub"),C=new Set(["66655f","55544f"]);function D(w){if(!w?.isMesh||w.isInstancedMesh||w.userData.toonStreamSlab||!w.parent?.userData?.stream)return!1;const A=w.material;if(!A?.isMeshStandardMaterial||!A.flatShading||!C.has(A.color.getHexString()))return!1;const z=w.geometry.attributes.position;if(!z||z.count%36)return!1;const F=[],_=new Xa,L=new N,I=new N;for(let H=0;H<z.count;H+=36){_.makeEmpty();for(let q=H;q<H+36;q++)_.expandByPoint(L.fromBufferAttribute(z,q));_.getSize(I);const E=Math.floor(Math.abs(_.min.x*7.31+_.min.z*3.17)*100)%1e5+1,Q=I.x*.4,U=I.z*.4,K=Math.max(I.y*.9,Math.min(Q,U)*.62);F.push(ln({center:new N((_.min.x+_.max.x)/2,_.min.y+K*.3,(_.min.z+_.max.z)/2),radius:new N(Q,K,U),rotation:new Jo(0,E*.37,0),seed:E,floor:_.min.y,flatTop:!1}))}const O=Se(F);return F.forEach(H=>H.dispose()),O.computeBoundingBox(),O.computeBoundingSphere(),O.name="toon-stream-rocks",w.geometry=O,w.material=p.rock,w.castShadow=!1,w.userData.toonStreamSlab=!0,r.streamSlabs=(r.streamSlabs??0)+F.length,!0}const W=new Set(["4e6b3a","36502c"]);let R=null;function k(w){if(!w?.isMesh||w.isInstancedMesh||w.userData.toonHedge)return!1;const A=w.material;if(!A?.isMeshStandardMaterial||!A.vertexColors||!W.has(A.color.getHexString()))return!1;const z=w.geometry.clone(),F=z.attributes.position,_=z.attributes.normal;if(!_)return!1;const L=new Map,I=O=>`${Math.round(F.getX(O)*500)},${Math.round(F.getY(O)*500)},${Math.round(F.getZ(O)*500)}`;for(let O=0;O<F.count;O++){const H=I(O),E=L.get(H)??[0,0,0];E[0]+=_.getX(O),E[1]+=_.getY(O),E[2]+=_.getZ(O),L.set(H,E)}for(let O=0;O<F.count;O++){const H=L.get(I(O)),E=Math.hypot(...H)||1;_.setXYZ(O,H[0]/E,H[1]/E,H[2]/E)}return z.setAttribute("toonPart",new st(new Float32Array(F.count).fill(Bt.bush),1)),z.userData.shared=!0,w.geometry=z,R||(R=c.clone(),R.onBeforeCompile=c.onBeforeCompile,R.customProgramCacheKey=c.customProgramCacheKey,R.color.copy(a.bush).multiplyScalar(.95),R.userData={...c.userData,shared:!0}),w.material=R,w.userData.toonHedge=!0,r.hedges=(r.hedges??0)+1,!0}function M(w){if(D(w)||k(w))return!0;if(!w?.isInstancedMesh||w.userData.toonGroundCover)return!1;const A=Array.isArray(w.material)?null:w.material;if(!A)return!1;const z=A.customProgramCacheKey?.()??"";let F=null;return/^roadside-grass/.test(z)?F="grass":/^roadside-shrub/.test(z)?F="tall":/^forest-blades/.test(z)?F="forest":/^shrub-layer/.test(z)?F="shrub":w.userData.metricKind==="하층 식생"&&A.isMeshStandardMaterial&&!A.map&&A.side===Ct&&(F="short"),F?(w.geometry=F==="shrub"?S:y[F],w.material=F==="shrub"?c:m,w.userData.toonGroundCover=F,w.boundingBox&&w.boundingBox.expandByScalar(.3),w.boundingSphere&&(w.boundingSphere.radius+=.3),F==="shrub"?r.shrubSwaps++:r.grassSwaps++,!0):!1}return{natureParts:v,swapGroundCover:M,materials:{foliage:c,grass:m,grassField:d,rock:p.rock,cliff:p.cliff},palette:a,status:r,geometries:{grass:y,shrub:S}}}const Uo={lat:37.46803,lon:126.946528},oa=Math.PI/180,cn=6378137,fn=.0066943799901413165,un=Uo.lat*oa,dn=1-fn*Math.sin(un)**2,Vr=cn/Math.sqrt(dn)*Math.cos(un)*oa,jr=cn*(1-fn)/dn**1.5*oa,Kr=(e,t)=>({x:(t-Uo.lon)*Vr,z:(Uo.lat-e)*jr}),kt=(e,t,o)=>e+(t-e)*o;function Ml(e,t,o){const{x0:a,z0:r,spacing:s,width:n,height:i,values:l}=e,c=(t-a)/s,u=(o-r)/s;if(c<0||u<0||c>n-1||u>i-1)throw new RangeError("고도 격자 범위 밖");const f=Math.min(n-2,Math.floor(c)),h=Math.min(i-2,Math.floor(u));return kt(kt(l[h*n+f],l[h*n+f+1],c-f),kt(l[(h+1)*n+f],l[(h+1)*n+f+1],c-f),u-h)}function Fo(e,t,o){let a={distance:1/0};for(let r=0;r<e.length-1;r++){const s=e[r],n=e[r+1],i=n.x-s.x,l=n.z-s.z,c=Math.max(0,Math.min(1,((t-s.x)*i+(o-s.z)*l)/(i*i+l*l||1))),u=Math.hypot(t-kt(s.x,n.x,c),o-kt(s.z,n.z,c));u<a.distance&&(a={distance:u,y:kt(s.y,n.y,c),s:kt(s.s,n.s,c),width:kt(s.width,n.width,c),index:r,t:c})}return a}function aa(e){const t=f=>{const h={minX:1/0,minZ:1/0,maxX:-1/0,maxZ:-1/0};for(const m of f)for(const d of[e[m],e[m+1]])h.minX=Math.min(h.minX,d.x),h.maxX=Math.max(h.maxX,d.x),h.minZ=Math.min(h.minZ,d.z),h.maxZ=Math.max(h.maxZ,d.z);if(f.length<=8)h.ids=f;else{const m=h.maxX-h.minX>h.maxZ-h.minZ?"x":"z";f.sort((g,p)=>e[g][m]+e[g+1][m]-e[p][m]-e[p+1][m]);const d=f.length>>1;h.left=t(f.slice(0,d)),h.right=t(f.slice(d))}return h},o=t(e.slice(1).map((f,h)=>h));let a=0,r=0,s=1/0,n=1/0,i=1/0,l=0;const c=f=>Math.max(f.minX-a,0,a-f.maxX)**2+Math.max(f.minZ-r,0,r-f.maxZ)**2,u=f=>{if(!(c(f)>n+1e-9))if(f.ids)for(const h of f.ids){const m=e[h],d=e[h+1],g=d.x-m.x,p=d.z-m.z,x=Math.max(0,Math.min(1,((a-m.x)*g+(r-m.z)*p)/(g*g+p*p||1))),v=Math.hypot(a-kt(m.x,d.x,x),r-kt(m.z,d.z,x));(v<s||v===s&&h<i)&&(n=v**2,s=v,i=h,l=x)}else{const h=c(f.left)<=c(f.right)?f.left:f.right;u(h),u(h===f.left?f.right:f.left)}};return(f,h)=>{if(a=f,r=h,s=1/0,n=1/0,i=1/0,l=0,u(o),i===1/0)return{distance:1/0,index:1/0};const m=e[i],d=e[i+1],g=l;return{distance:s,y:kt(m.y,d.y,g),s:kt(m.s,d.s,g),width:kt(m.width,d.width,g),index:i,t:g}}}function kl(e,t){const o=Math.max(0,Math.min(1,(t.distance-t.width/2-2)/24)),a=o*o*(3-2*o);return kt(t.y,e,a)}const vo=Object.freeze({road:{half:5.5,from:-1.5,to:20},innerRoad:{half:3.5,from:-24,to:-1.5},sidewalk:{inner:5.6,outer:7.7,from:-1.5,to:20},plaza:{half:7.7,from:20,to:41},pavilionPad:{x0:7.7,x1:11.8,z0:.6,z1:8.4},kerb:{inner:.06,outer:.14,width:.2},lift:.02});function mn(e,t,o=0){const a=vo,r=Math.abs(e);if(t>=a.road.from-o&&t<=a.plaza.to+.3+o&&r<=a.plaza.half+.3+o||t>=a.innerRoad.from-o&&t<=a.road.from+o&&r<=a.innerRoad.half+.3+o)return!0;const s=a.pavilionPad;return e>=s.x0-o&&e<=s.x1+o&&t>=s.z0-o&&t<=s.z1+o}const na=Object.freeze([{id:"왼쪽 석축+낮은 상록 생울타리",side:-1,x:-8.55,from:1.5,to:40.5,height:.85,depth:.95,wall:.45},{id:"오른쪽 높은 관목 울타리",side:1,x:8.6,from:9.2,to:40.5,height:2.1,depth:1.1,wall:0}]),qr=Object.freeze([{id:"pavilion",name:"안내도 정자(기와지붕·붉은 기둥·안내판 3면)",x:9.75,z:4.5,yaw:.35,source:"로드뷰 2025-05 눈확인"},{id:"bench",name:"흰 철제 벤치",x:7.05,z:2.6,yaw:Math.PI/2,source:"로드뷰 2025-05"},{id:"bench",name:"흰 철제 벤치",x:7.05,z:6.4,yaw:Math.PI/2,source:"로드뷰 2025-05"},{id:"sign",name:"소형 안내판(검은 기둥)",x:6.55,z:-.9,yaw:-.5,source:"2020 사진"},{id:"bollard",name:"노랑·검정 차단봉",x:-5.6,z:19.6},{id:"bollard",name:"노랑·검정 차단봉",x:5.6,z:19.6},{id:"bollard",name:"노랑·검정 차단봉",x:-5.6,z:1.2},{id:"bollard",name:"노랑·검정 차단봉",x:5.6,z:9.4},{id:"lamp",name:"가로등(위치 임의)",x:-7.25,z:12},{id:"lamp",name:"가로등(위치 임의)",x:7.25,z:16},{id:"lamp",name:"가로등(위치 임의)",x:-7.25,z:33},{id:"lamp",name:"가로등(위치 임의)",x:7.25,z:37}]),Zr=Object.freeze([{id:"pine_tree_01",x:11.2,z:27,scale:1.15},{id:"pine_tree_01",x:12.6,z:33.5,scale:1.3},{id:"pine_tree_01",x:10.9,z:39.5,scale:1.05},{id:"pine_sapling_medium",x:-10.6,z:7.5,scale:1.35},{id:"island_tree_01",x:-11.3,z:16.5,scale:1},{id:"island_tree_01",x:-12.2,z:27.5,scale:1.1},{id:"tree_small_02",x:-10.8,z:36,scale:.95,tint:14262412},{id:"tree_small_02",x:9.3,z:-7.5,scale:1.05},{id:"tree_small_02",x:-8.4,z:-6.5,scale:.95}]),sa=()=>typeof document<"u";function xo(e){return()=>(e=Math.imul(e,1664525)+1013904223>>>0)/4294967296}function be(e){const t=xo(e),o=new Float32Array(4096).map(()=>t());return(a,r)=>{const s=Math.floor(a),n=Math.floor(r),i=a-s,l=r-n,c=g=>g*g*(3-2*g),u=(g,p)=>o[(p&63)<<6|g&63],f=u(s,n),h=u(s+1,n),m=u(s,n+1),d=u(s+1,n+1);return f+(h-f)*c(i)+(m-f)*c(l)+(f-h-m+d)*c(i)*c(l)}}function hn(e,t,o){const a=document.createElement("canvas");a.width=a.height=t;const r=a.getContext("2d"),s=r.createImageData(t,t);for(let n=0;n<t;n++)for(let i=0;i<t;i++){const l=(m,d)=>e[(d+t)%t*t+(m+t)%t],c=(l(i+1,n)-l(i-1,n))*o,u=(l(i,n+1)-l(i,n-1))*o,f=Math.hypot(c,u,1),h=(n*t+i)*4;s.data[h]=(-c/f*.5+.5)*255,s.data[h+1]=(u/f*.5+.5)*255,s.data[h+2]=(1/f*.5+.5)*255,s.data[h+3]=255}return r.putImageData(s,0,0),a}function ee(e,t=!0){const o=new Ya(e);return o.wrapS=o.wrapT=gs,o.anisotropy=8,t&&(o.colorSpace=gt),o.needsUpdate=!0,o}const oo=4;function Xr(e=1024){if(!sa())return null;const t=16,o=e/t,a=Math.max(2,Math.round(o*.034)),r=xo(20261103),s=be(7),n=be(11),i=document.createElement("canvas");i.width=i.height=e;const l=i.getContext("2d"),c=l.createImageData(e,e),u=new Float32Array(e*e),f=[];for(let h=0;h<t;h++)for(let m=0;m<t;m++){const d=r(),g=d<.05?"white":d<.11?"dark":"grey",p=g==="white"?[188,186,180]:g==="dark"?[112,113,112]:[150,150,147],x=(r()-.5)*10,v=(r()-.5)*5;f.push({rgb:[p[0]+x+v,p[1]+x,p[2]+x-v],stain:r()<.22?{x:r(),y:r(),r:.25+r()*.5,a:.08+r()*.12}:null,chip:r()<.3?Math.floor(r()*4):-1,tilt:(r()-.5)*.6})}for(let h=0;h<e;h++)for(let m=0;m<e;m++){const d=Math.floor(m/o),g=Math.floor(h/o),p=f[g*t+d],x=m-d*o,v=h-g*o,y=Math.min(x,v,o-1-x,o-1-v),S=(h*e+m)*4;let C,D;const W=p.chip>=0&&Math.hypot(x-(p.chip&1?o:0),v-(p.chip&2?o:0))<o*.13*(.7+.6*n(m*.3,h*.3));if(y<a||W){const R=.5+.3*s(m*.05,h*.05);C=[70*R+62,66*R+60,58*R+56],D=0}else{const R=Math.min(1,(y-a)/(o*.06)),k=(n(m*.9,h*.9)-.5)*12+(r()-.5)*9,M=(s(m*.012+3,h*.012)-.5)*14;let w=k+M+p.tilt*(x/o-.5)*6;if(p.stain){const z=x/o-p.stain.x,F=v/o-p.stain.y,_=Math.max(0,1-Math.hypot(z,F)/p.stain.r);w-=_*_*p.stain.a*255*.5}const A=(1-R)*-7;C=p.rgb.map(z=>z+w+A),D=.55+.45*R+(n(m*.6,h*.6)-.5)*.08}c.data[S]=Math.max(0,Math.min(255,C[0])),c.data[S+1]=Math.max(0,Math.min(255,C[1])),c.data[S+2]=Math.max(0,Math.min(255,C[2])),c.data[S+3]=255,u[h*e+m]=D}return l.putImageData(c,0,0),{map:ee(i),normalMap:ee(hn(u,e,2.2),!1),metres:oo}}const Vo=2;function Yr(e=512){if(!sa())return null;const t=xo(4),o=be(5),a=be(9),r=document.createElement("canvas");r.width=r.height=e;const s=r.getContext("2d"),n=s.createImageData(e,e),i=new Float32Array(e*e);for(let l=0;l<e;l++)for(let c=0;c<e;c++){const u=(l*e+c)*4,f=t(),h=(o(c*.02,l*.02)-.5)*16,m=(a(c*.7,l*.7)-.5)*18;let d=84+h+m;f>.93?d+=26+t()*30:f<.05&&(d-=18),n.data[u]=d+1,n.data[u+1]=d,n.data[u+2]=d-2,n.data[u+3]=255,i[l*e+c]=(f>.93?.6:f<.05?.1:.35)+m*.004}return s.putImageData(n,0,0),{map:ee(r),normalMap:ee(hn(i,e,1.4),!1),metres:Vo}}function Qr(){const e=document.createElement("canvas");e.width=512,e.height=384;const t=e.getContext("2d");t.fillStyle="#e9ecdf",t.fillRect(0,0,512,384),t.fillStyle="#1f4d3a",t.fillRect(0,0,512,54),t.fillStyle="#fff",t.font='bold 30px "Noto Sans KR", "Apple SD Gothic Neo", sans-serif',t.textAlign="center",t.fillText("관악산 등산 안내도",256,38);const o=be(3);for(let a=0;a<9;a++){t.strokeStyle=`rgba(70,110,70,${.25+a*.05})`,t.lineWidth=2,t.beginPath();for(let r=0;r<=64;r++){const s=r/64*Math.PI*2,n=150-a*15+o(Math.cos(s)*3+5,Math.sin(s)*3+5)*30;t.lineTo(270+Math.cos(s)*n*1.25,215+Math.sin(s)*n*.8)}t.closePath(),t.fillStyle=`rgba(${120-a*8},${160-a*6},${110-a*8},.35)`,t.fill(),t.stroke()}return t.strokeStyle="#c23b2c",t.lineWidth=5,t.setLineDash([12,6]),t.beginPath(),t.moveTo(90,350),t.bezierCurveTo(160,300,170,240,230,230),t.bezierCurveTo(300,215,300,160,285,140),t.stroke(),t.setLineDash([]),t.fillStyle="#c23b2c",t.beginPath(),t.arc(90,350,9,0,Math.PI*2),t.fill(),t.fillStyle="#222",t.font="bold 18px sans-serif",t.textAlign="left",t.fillText("현위치",104,356),t.fillText("연주대 ▲",296,140),e}function Da(e){const t=document.createElement("canvas");t.width=256,t.height=384;const o=t.getContext("2d");o.fillStyle="#ecefe7",o.fillRect(0,0,256,384),o.fillStyle="#1f4d3a",o.fillRect(0,0,256,48),o.fillStyle="#fff",o.font='bold 24px "Noto Sans KR", "Apple SD Gothic Neo", sans-serif',o.textAlign="center",o.fillText(e,128,33),o.fillStyle="#7c857a";for(let a=0;a<13;a++){const r=150+a*53%60;o.fillRect(24,72+a*23,r,7)}return t}function pn(){const e=new Map,t=(s,n,i=0,l=0,c=0,u=0)=>{u&&n.rotateY(u),n.translate(i,l,c);const f=n.index?n.toNonIndexed():n;f!==n&&n.dispose(),e.has(s)||e.set(s,[]),e.get(s).push(f)};return{add:t,box:(s,n,i,l,c,u,f,h=0)=>t(s,new Ne(c,u,f),n,i,l,h),cyl:(s,n,i,l,c,u,f,h=8)=>t(s,new Kt(c,u,f,h),n,i,l),merged:()=>[...e].map(([s,n])=>{for(const c of n)for(const u of Object.keys(c.attributes))["position","normal","uv","color"].includes(u)||c.deleteAttribute(u);if(n.some(c=>c.attributes.color)){for(const c of n)if(!c.attributes.color){const u=new Float32Array(c.attributes.position.count*3).fill(1);c.setAttribute("color",new Ce(u,3))}}const l=Se(n,!1);return n.forEach(c=>c.dispose()),l.computeBoundingBox(),l.computeBoundingSphere(),[s,l]})}}const Jr={granite:11842476,kerbDark:9342342,white:15790057,whiteSteel:15264230,red:9386544,roof:5198676,tile:8225150,woodDark:4930092,black:2763821,lampGrey:6054243,yellow:15317283,leaf:5139258,leafDark:3559468,stone:10196618,soil:5194290,glass:16052184},ra=new Map(Object.entries(Jr).map(([e,t])=>[e,new Wt({color:t,roughness:e==="whiteSteel"?.55:e==="glass"?.3:.9,metalness:e==="whiteSteel"||e==="lampGrey"?.25:0,vertexColors:["leaf","leafDark"].includes(e)})]));ra.get("glass").emissive=new rt(2762264);function ia(e,t,o){const a=Math.cos(e.yaw),r=Math.sin(e.yaw);return{x:e.x+t*a+o*r,z:e.z-t*r+o*a}}function Xt(e,t,o,a,r,s,n,i,l=vo.lift,c=.5){const u=Math.max(1,Math.ceil((a-o)/c)),f=Math.max(1,Math.ceil((s-r)/c)),h=[],m=[],d=[],g=[];for(let x=0;x<=f;x++)for(let v=0;v<=u;v++){const y=o+(a-o)*v/u,S=r+(s-r)*x/f,C=ia(e,y,S);h.push(C.x,t(C.x,C.z)+l,C.z),m.push(y/n,S/n);const D=1+(i(y*.11,S*.11)-.5)*.14+Math.max(0,1-Math.abs(y)/3.5)*.035;d.push(D,D,D)}for(let x=0;x<f;x++)for(let v=0;v<u;v++){const y=x*(u+1)+v,S=y+1,C=y+u+1,D=C+1;g.push(y,C,S,S,C,D)}const p=new bt;return p.setAttribute("position",new st(h,3)),p.setAttribute("uv",new st(m,2)),p.setAttribute("color",new st(d,3)),p.setIndex(g),p.computeVertexNormals(),p.toNonIndexed()}function Ht(e,t,o,a,r,s,n,i,l,c){const u=Math.hypot(n-r,i-s),f=Math.max(1,Math.round(u/1)),h=Math.atan2(n-r,i-s)+t.yaw;for(let m=0;m<f;m++){const d=(m+.5)/f,g=r+(n-r)*d,p=s+(i-s)*d,x=ia(t,g,p),v=o(x.x,x.z)+vo.lift;e.box(m%3===1?"kerbDark":a,x.x,v+c/2-.03,x.z,l,c+.06,u/f-.006,h)}}function ti(e,t){const o=new Rt;o.name="광장 바닥 · 블록·아스팔트·경계석(자체 절차 텍스처)";const a=vo,r=be(17),s=Xr(),n=Yr(),i=new Wt({color:s?16772829:10262672,map:s?.map??null,normalMap:s?.normalMap??null,normalScale:new Mt(.9,.9),roughness:.9,vertexColors:!0,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),l=new Wt({color:n?16772829:5657423,map:n?.map??null,normalMap:n?.normalMap??null,normalScale:new Mt(.6,.6),roughness:.95,vertexColors:!0,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),c=new Wt({color:15329247,roughness:.8,polygonOffset:!0,polygonOffsetFactor:-4,polygonOffsetUnits:-4}),u=[Xt(e,t,-a.plaza.half,a.plaza.half,a.plaza.from,a.plaza.to,oo,r),...[-1,1].map(p=>Xt(e,t,p<0?-a.sidewalk.outer:a.sidewalk.inner,p<0?-a.sidewalk.inner:a.sidewalk.outer,a.sidewalk.from,a.sidewalk.to,oo,r)),Xt(e,t,a.pavilionPad.x0,a.pavilionPad.x1,a.pavilionPad.z0,a.pavilionPad.z1,oo,r)],f=[Xt(e,t,-a.road.half,a.road.half,a.road.from,a.road.to,Vo,r),Xt(e,t,-a.innerRoad.half,a.innerRoad.half,a.innerRoad.from,a.innerRoad.to,Vo,r)],h=[...[-1,1].map(p=>Xt(e,t,p*5.2-.075,p*5.2+.075,a.road.from+.4,a.road.to-.4,1,()=>.5,a.lift+.004,1)),...[-1,1].map(p=>Xt(e,t,p*3.2-.075,p*3.2+.075,a.innerRoad.from+.4,a.road.from-.6,1,()=>.5,a.lift+.004,1))];for(const[p,x,v]of[["블록 포장",u,i],["아스팔트",f,l],["흰 차선",h,c]]){const y=Se(x,!1);x.forEach(C=>C.dispose()),y.computeBoundingBox(),y.computeBoundingSphere();const S=new At(y,v);S.name=p,S.receiveShadow=!0,o.add(S)}const m=pn(),d=a.kerb;for(const p of[-1,1]){Ht(m,e,t,"granite",p*a.sidewalk.inner,a.sidewalk.from,p*a.sidewalk.inner,a.sidewalk.to,d.width,d.inner);const x=p>0?a.pavilionPad.z1:a.sidewalk.from;Ht(m,e,t,"granite",p*a.plaza.half,x,p*a.plaza.half,a.plaza.to,d.width,d.outer),Ht(m,e,t,"granite",p*a.innerRoad.half+p*.1,a.innerRoad.from,p*a.innerRoad.half+p*.1,a.road.from,d.width,d.outer)}const g=a.pavilionPad;Ht(m,e,t,"granite",g.x0,g.z0,g.x1,g.z0,d.width,d.outer),Ht(m,e,t,"granite",g.x1,g.z0,g.x1,g.z1,d.width,d.outer),Ht(m,e,t,"granite",g.x1,g.z1,g.x0,g.z1,d.width,d.outer),Ht(m,e,t,"granite",a.plaza.half,a.sidewalk.from,a.plaza.half,g.z0,d.width,d.outer),Ht(m,e,t,"granite",-a.plaza.half,a.plaza.to,a.plaza.half,a.plaza.to,d.width,d.outer),Ht(m,e,t,"granite",-a.road.half,a.road.to,a.road.half,a.road.to,.3,.004);for(const[p,x]of m.merged()){const v=new At(x,ra.get(p));v.name="경계석",v.receiveShadow=!0,o.add(v)}return o.userData.textures={block:!!s,asphalt:!!n,source:"산풍경 자체 절차 텍스처(외부 이미지 없음)"},o}function ei(e,t,o){const a=xo(Math.round(t.x*100));if(t.to-t.from,t.wall)for(let i=0;i<2;i++){let l=t.from;for(;l<t.to;){const c=.32+a()*.22;(!o||i===0)&&e.box("stone",t.x-t.side*.5+t.side*i*.04,i*.22+.11,l+c/2,.36,o?t.wall:.21,c-.025),l+=c}}const r=o?1.6:.55,s=t.wall?t.wall-.05:0,n=t.height;for(let i=t.from+r/2;i<t.to;i+=r)for(let l=0;l<(o?1:n>1.2?3:2);l++){const c=(o?.75:.48)*(n>1.2?1.15:1)*(.85+a()*.3),u=new $e(c,o?0:1),f=u.attributes.position;for(let d=0;d<f.count;d++){const g=.82+a()*.32;f.setXYZ(d,f.getX(d)*g*(t.depth/1.9/c+.25),f.getY(d)*g*(n>1.2?1.25:.85),f.getZ(d)*g)}const h=new Float32Array(f.count*3);for(let d=0;d<f.count;d++){const g=.78+a()*.4,p=.85+.25*(f.getY(d)/c);h.set([g*p*.95,g*p,g*p*.85],d*3)}u.setAttribute("color",new Ce(h,3)),u.computeVertexNormals();const m=o?s+n/2:s+c*.7+l*(n-s-c*.9)/Math.max(1,n>1.2?2:1);e.add(l%2?"leafDark":"leaf",u,t.x+(a()-.5)*.15,Math.min(m,s+n-c*.45),i+(a()-.5)*.2)}}function oi(e,t,o,a){const r=Math.cos(t.yaw),s=Math.sin(t.yaw),n=(m,d)=>[t.x+m*r+d*s,t.z-m*s+d*r];for(const m of[-.75,.75])for(const d of[-1.6,1.6]){const[g,p]=n(m,d);e.cyl("red",g,1.25,p,.11,.12,2.5,o?6:10),e.cyl("granite",g,.08,p,.2,.22,.16,8)}for(const m of[-1.6,1.6]){const[d,g]=n(0,m);e.box("red",d,2.45,g,1.7,.16,.18,t.yaw)}for(const m of[-.75,.75]){const[d,g]=n(m,0);e.box("red",d,2.45,g,.18,.16,3.4,t.yaw)}const i=new vs(1,1,4,1,!0);i.rotateY(Math.PI/4),i.scale(1.25*1.42,.95,2.45*1.42);const[l,c]=n(0,0);e.add("roof",i,l,3,c,t.yaw);const u=new Ne(.14,.12,1.3);if(e.add("tile",u,l,3.44,c,t.yaw),!o){const m=new Ne(2.5,.1,4.9);e.add("woodDark",m,l,2.56,c,t.yaw)}const[f,h]=n(.62,0);if(e.box("woodDark",f,1.45,h,.08,1.35,3.1,t.yaw),a)for(const[m,d]of[-1.05,0,1.05].entries()){const[g,p]=n(.57,d),x=new At(new Qo(m===1?1.25:.92,m===1?.95:1.15),a[m]);x.position.set(g,1.5,p),x.rotation.y=t.yaw-Math.PI/2,a.meshes.push(x)}}function ai(e,t,o){const a=Math.cos(t.yaw),r=Math.sin(t.yaw),s=(n,i)=>[t.x+n*a+i*r,t.z-n*r+i*a];for(const n of[-.7,.7]){const[i,l]=s(n,0);e.box("whiteSteel",i,.22,l,.05,.44,.42,t.yaw),e.box("whiteSteel",i,.62,l+0,.05,.4,.05,t.yaw)}for(let n=0;n<(o?1:4);n++){const[i,l]=s(0,-.15+n*.1);e.box("whiteSteel",i,.44,l,1.6,.035,o?.42:.07,t.yaw)}if(!o)for(let n=0;n<3;n++){const[i,l]=s(0,.22);e.box("whiteSteel",i,.58+n*.12,l,1.6,.06,.03,t.yaw)}}function ni(e,t,o){const a=t.x<0?1:-1;e.cyl("lampGrey",t.x,2.25,t.z,.06,.09,4.5,o?5:8),e.cyl("lampGrey",t.x,.15,t.z,.13,.15,.3,8),o||(e.box("lampGrey",t.x+a*.35,4.45,t.z,.75,.06,.08),e.box("lampGrey",t.x+a*.75,4.36,t.z,.42,.12,.26),e.box("glass",t.x+a*.75,4.28,t.z,.36,.04,.2))}function si(e,t,o){for(let a=0;a<(o?1:4);a++)e.cyl(a%2?"black":"yellow",t.x,o?.4:.1+a*.2,t.z,.07,.07,o?.8:.2,8);e.cyl("black",t.x,.83,t.z,.05,.075,.06,8)}function ri(e,t,o){e.cyl("black",t.x,.9,t.z,.05,.05,1.8,6),e.box("black",t.x,1.55,t.z,.62,.42,.06,t.yaw),o||e.box("white",t.x,1.55,t.z,.56,.36,.065,t.yaw)}function ii(e=!1){const t=pn(),o=sa()&&!e?Object.assign([ee(Da("관악산 안내")),ee(Qr()),ee(Da("산행 안전"))].map(r=>new Wt({map:r,roughness:.6})),{meshes:[]}):null;for(const r of na)ei(t,r,e);for(const r of qr)({pavilion:()=>oi(t,r,e,o),bench:()=>ai(t,r,e),lamp:()=>ni(t,r,e),bollard:()=>si(t,r,e),sign:()=>ri(t,r,e)})[r.id]();const a=new Rt;a.name="광장 시설 · 정자·벤치·가로등·차단봉·화단(추정 위치)";for(const[r,s]of t.merged()){const n=new At(s,ra.get(r));n.receiveShadow=!0,n.castShadow=!e&&["red","roof","whiteSteel","lampGrey","leaf","leafDark"].includes(r),a.add(n)}for(const r of o?.meshes??[])a.add(r);return a}function zl(e){const t=new Map;for(const[o,a]of Zr.entries()){const r=ia(e,a.x,a.z);t.has(a.id)||t.set(a.id,[]),t.get(a.id).push({x:r.x,z:r.z,scale:a.scale,yaw:o*2.399%(Math.PI*2),embed:.03,...a.tint?{forestTint:a.tint}:{}})}return[...t].map(([o,a])=>({id:o,kind:"tree",priority:!0,entranceSpecimen:!0,placements:a,levels:[0,1,2].map(r=>({url:`${o}-lod${r}.glb`,distance:[0,55,130][r]}))}))}const li="B",ci={A:{startPoint:{lat:37.468244,lon:126.946319,facingDeg:142},gate:{lat:37.46803,lon:126.946528},freeRoamPolygon:[{lat:37.468054,lon:126.946419},{lat:37.46812,lon:126.946526},{lat:37.468334,lon:126.946317},{lat:37.468268,lon:126.94621}]},B:{startPoint:{lat:37.468378,lon:126.946067,facingDeg:132},gate:{lat:37.468197,lon:126.94632},freeRoamPolygon:[{lat:37.468205,lon:126.946207},{lat:37.468285,lon:126.946298},{lat:37.468467,lon:126.946046},{lat:37.468386,lon:126.945955}]}},Ro={...ci[li]},uo=3.05,fi=.56,gn=[-2.15,-.92,1.15,2.3],vn=.3,Aa={x:.4,z:.35},ui=[...[-uo,uo].map(e=>({kind:"pillar",x:e,z:0,radius:fi})),...gn.map(e=>({kind:"barricade",x:e,z:vn,halfX:Aa.x,halfZ:Aa.z}))];function Tl(e,t,o=.25){return ui.some(a=>a.kind==="pillar"?Math.hypot(e-a.x,t-a.z)<a.radius+o:Math.hypot(Math.max(0,Math.abs(e-a.x)-a.halfX),Math.max(0,Math.abs(t-a.z)-a.halfZ))<o)}function _l(e,t,o,a=.25){const r=e.reduce((l,c,u)=>{const f=e[(u+1)%e.length];return l+c.x*f.z-f.x*c.z},0),s=Math.sign(r);let n=-1/0,i=1/0;for(let l=0;l<e.length;l++){const c=e[l],u=e[(l+1)%e.length],f=u.x-c.x,h=u.z-c.z,m=s*(f*(t.z-c.z)-h*(t.x-c.x))-a*Math.hypot(f,h),d=s*(f*o.z-h*o.x);if(Math.abs(d)<1e-10){if(m<-1e-8)return[1/0,-1/0];continue}const g=-m/d;d>0?n=Math.max(n,g):i=Math.min(i,g)}return n<=i?[n,i]:[1/0,-1/0]}const di={roof:5593434,eave:4672332,tile:8488322,red:9518387,green:2585955,blue:3370115,cream:14009762,stone:10592148,soil:5326388,yellow:15909676,orange:14510382,leaf:4219705,flower:14127037,paving:4013885,water:6323576,wood:7689275},ve=new Map(Object.entries(di).map(([e,t])=>[e,new Wt({color:t,roughness:e==="water"?.28:.88})]));ve.get("roof").side=ve.get("eave").side=ve.get("wood").side=Ct;function yo(){const e=new Map;function t(s,n,i=0,l=0,c=0){s.translate(i,l,c),e.has(n)||e.set(n,[]),e.get(n).push(s)}const o=(s,n,i,l,c,u,f)=>t(new Ne(c,u,f),s,n,i,l);function a(s,n,i,l=.04,c=6){const u=new N(...i).sub(new N(...n)),f=new Kt(l,l,u.length(),c);f.applyQuaternion(new ys().setFromUnitVectors(new N(0,1,0),u.normalize())),t(f,s,...n.map((h,m)=>(h+i[m])/2))}function r(){const s=new Rt;for(const[n,i]of e){const l=i.map(f=>f.index?f.toNonIndexed():f),c=Se(l,!1);new Set([...i,...l]).forEach(f=>f.dispose()),c.computeBoundingBox(),c.computeBoundingSphere();const u=new At(c,ve.get(n));u.receiveShadow=!0,s.add(u)}return s}return{add:t,box:o,beam:a,finish:r}}function Fa(e,t,o,a,r){const s=r?3:10,n=(i,l,c)=>{const u=i*(o*.36+l*o*.14),f=c*l*a*.5,h=Math.abs(i);return[u,t+1.75*Math.pow(1-l,1.55)+.12*l*l+.62*Math.pow(h,5)*l*l+.2*Math.pow(h,3)*Math.pow(l,6),f]};for(const i of[-1,1]){const l=[];for(let u=0;u<s;u++)for(let f=0;f<s;f++){const h=n(-1+2*f/s,u/s,i),m=n(-1+2*(f+1)/s,u/s,i),d=n(-1+2*f/s,(u+1)/s,i),g=n(-1+2*(f+1)/s,(u+1)/s,i);l.push(...(i===1?[h,d,m,m,d,g]:[h,m,d,m,g,d]).flat())}const c=new bt;if(c.setAttribute("position",new st(l,3)),c.computeVertexNormals(),e.add(c,"roof"),!r)for(let u=0;u<=40;u++){const f=-1+u/20;for(let h=0;h<5;h++)e.beam("tile",n(f,h/5,i),n(f,(h+1)/5,i),.028,4)}for(let u=0;u<s;u++)e.beam("tile",n(-1+2*u/s,1,i),n(-1+2*(u+1)/s,1,i),.075)}for(const i of[-1,1]){const l=n(i,0,1),c=n(i,1,1),u=n(i,1,-1),f=new bt;f.setAttribute("position",new st([...l,...c,...u,...l,...u,...c],3)),f.computeVertexNormals(),e.add(f,"roof"),e.beam("tile",l,c,.065),e.beam("tile",l,u,.065)}if(e.beam("tile",[-o*.36,t+1.79,0],[o*.36,t+1.79,0],.12),!r)for(const i of[-1,1])for(let l=0;l<s;l++){const c=n(-1+2*l/s,1,i),u=n(-1+2*(l+1)/s,1,i);e.beam("eave",[c[0],c[1]-.16,c[2]],[u[0],u[1]-.16,u[2]],.15,5)}}function mi(e,t,o,a,r){const n=o*.34,i=o/2,l=a/2,c=.46,u=.38,f=1.3,h=r?6:18,m=r?4:10,d=k=>k<c?n:n+(i-n)*(k-c)/(1-c),g=(k,M)=>u*Math.pow(Math.min(1,Math.abs(k)/i),2.2)*Math.pow(M,2),p=(k,M,w)=>{const A=k*d(M),z=.035*l*(1-k*k)*M*M;return[A,t+1.6*Math.pow(1-M,f)+g(A,M),w*M*(l-z)]},x=(k,M,w)=>{const A=c+M*(1-c),z=p(k,A,1),F=g(z[0],A),_=.035*l*(1-w*w)*M*M;return[z[0]+k*-_,z[1]-F*(1-Math.pow(Math.abs(w),4)),w*z[2]]},v=(k,M,w,A,z)=>{const F=[];for(let _=0;_<w;_++)for(let L=0;L<M;L++){const I=k(L/M,_/w),O=k((L+1)/M,_/w),H=k(L/M,(_+1)/w),E=k((L+1)/M,(_+1)/w);F.push(...(z?[I,O,H,O,E,H]:[I,H,O,O,H,E]).flat())}e.add(y(F),A)},y=k=>{const M=new bt;return M.setAttribute("position",new st(k,3)),M.setAttribute("uv",new st(new Float32Array(k.length/3*2),2)),M.computeVertexNormals(),M},S=(k,M)=>[k[0],k[1]-M,k[2]],C=t+1.6;for(const k of[-1,1])v((M,w)=>p(-1+2*M,w,k),h*2,h,"roof",k<0),r||v((M,w)=>S(p(-1+2*M,.6+.4*w,k),.2),h*2,4,"eave",k>0);for(const k of[-1,1]){v((z,F)=>x(k,F,-1+2*z),m,m,"roof",k>0),r||v((z,F)=>S(x(k,.35+.65*F,-1+2*z),.2),m,3,"eave",k<0);const M=8,w=[],A=[k*n*.995,p(1,c,1)[1],0];for(const z of[-1,1])for(let F=0;F<M;F++){const _=p(k,c*F/M,z),L=p(k,c*(F+1)/M,z);w.push(...A,..._.map((I,O)=>O?I-.04:I*.995),...L.map((I,O)=>O?I-.04:I*.995))}if(e.add(y(w),"wood"),!r){const z=p(k,c,1)[1];e.box("cream",k*n*.99,z+.35,0,.03,.08,c*l*1.2),e.box("red",k*n*.99,z+.18,0,.03,.22,c*l*1.5)}}e.beam("tile",[-n,C+.1,0],[n,C+.1,0],r?.14:.17,8),r||e.beam("roof",[-n,C+.27,0],[n,C+.27,0],.1,6);for(const k of[-1,1])e.beam("tile",[k*n,C+.1,0],[k*(n+.16),C+.26,0],.17,8);const D=(k,M)=>{for(let w=0;w<k.length-1;w++)e.beam("tile",k[w],k[w+1],M,6)},W=r?3:8;for(const k of[-1,1])for(const M of[-1,1]){D(Array.from({length:W+1},(z,F)=>S(p(k,c*F/W,M),-.06)),.085);const w=Array.from({length:W+1},(z,F)=>S(p(k,c+(1-c)*F/W,M),-.07)),A=w[w.length-1];w.push([A[0]+k*.14,A[1]+.1,A[2]+M*.11]),D(w,.095)}if(r)return;for(const k of[-1,1])for(let M=0;M<=44;M++){const w=-1+M/22;for(let A=0;A<5;A++)e.beam("tile",S(p(w,A/5,k),-.035),S(p(w,(A+1)/5,k),-.035),.04,4)}for(const k of[-1,1])for(let M=1;M<14;M++){const w=-1+M/7;for(let A=0;A<4;A++)e.beam("tile",S(x(k,A/4,w),-.035),S(x(k,(A+1)/4,w),-.035),.04,4)}for(const k of[-1,1])for(let M=0;M<h*2;M++)e.beam("eave",S(p(-1+2*M/(h*2),1,k),.1),S(p(-1+2*(M+1)/(h*2),1,k),.1),.11,5);for(const k of[-1,1])for(let M=0;M<m;M++)e.beam("eave",S(x(k,1,-1+2*M/m),.1),S(x(k,1,-1+2*(M+1)/m),.1),.11,5);const R=(k,M)=>{const w=S(k,.29),A=S(M,.29),z=A.map((L,I)=>L-w[I]),F=Math.hypot(...z),_=A.map((L,I)=>L+z[I]/F*.06);e.beam("green",w,A,.06,6),e.beam("blue",A,_,.062,6)};for(const k of[-1,1])for(let M=1;M<40;M++){const w=-1+M/20;R(p(w,.66,k),p(w,.99,k))}for(const k of[-1,1])for(let M=1;M<14;M++){const w=-1+M/7;R(x(k,.45,w),x(k,.99,w))}}function xn(e,t,o,{background:a="#194f70",color:r="#ffffff"}={}){if(typeof document>"u")return null;const s=document.createElement("canvas");s.width=1024,s.height=256;const n=s.getContext("2d");n.fillStyle=a,n.fillRect(0,0,1024,256),n.strokeStyle="#a5b5a4",n.lineWidth=12,n.strokeRect(12,12,1e3,232),n.fillStyle=r,n.textAlign="center",n.textBaseline="middle",n.font='bold 140px "Noto Serif KR", "AppleMyungjo", serif',n.fillText(e,512,132,940);const i=new Ya(s);return i.colorSpace=gt,new At(new Qo(t,o),new xe({map:i}))}function hi(e=!1){const t=yo();for(const r of[-uo,uo]){t.add(new Kt(.48,.56,.5,8),"stone",r,.25,0),t.add(new Kt(.34,.38,3.15,e?8:12),"red",r,2.075,0),t.box("green",r,3.65,0,1.15,.26,1.1);for(const s of[-1,1])t.box("blue",r+s*.35,3.9,0,.24,.27,1.5),t.box("green",r+s*.45,4.1,0,.62,.16,1.8)}t.box("red",0,3.45,0,6.5,.24,.44),t.box("green",0,3.83,0,7.9,.35,.65),t.box("blue",0,4.12,0,8.4,.23,.85);for(const r of[-.6,.6])if(t.box("green",0,4.25,r,9.4,.14,.18),!e)for(let s=0;s<43;s++){const n=-4.6+s*9.2/42;t.beam(s%2?"green":"cream",[n,4.18,r],[n,4.35,r*2.1],.047)}if(!e)for(let r=0;r<27;r++){const s=-3.9+r*.3;for(const n of[-.44,.44])t.box("cream",s,4.1,n,.06,.12,.02),t.box(r%2?"red":"blue",s,3.87,n*.76,.15,.12,.025)}mi(t,4.27,10.2,4.1,e);const o=t.finish(),a=xn("관악산공원",3.25,.65);return a&&(a.position.set(0,3.72,.48),o.add(a)),o.name="관악산공원 · 두 기둥 겹처마 자체 모델",o}function pi(e,t,o,a){e.add(new Kt(.62,.46,.18,12),"stone",t,.2,o),e.add(new Kt(.86,.58,.53,a?8:16,1,!0),"stone",t,.53,o);const r=new xs(.85,.07,4,a?12:20);r.rotateX(Math.PI/2),e.add(r,"stone",t,.8,o),e.add(new Kt(.78,.78,.04,12),"soil",t,.71,o);for(let s=0;s<(a?6:20);s++){const n=s*2.4,i=.65*Math.sqrt(s/(a?6:20)),l=t+Math.cos(n)*i,c=o+Math.sin(n)*i;e.beam("leaf",[l,.73,c],[l,.99,c],.022),e.add(new $e(.13,0),s%3?"flower":"cream",l,1.01,c)}}function gi(e){const t=yo();for(const[o,a]of gn.entries()){const r=o%2?"orange":"yellow",s=vn;t.box(r,a,.6,s,.64,1.1,.16);for(const n of[-1,1])t.box(r,a+n*.29,.52,s,.08,1,.32),t.box(r,a+n*.27,.1,s,.26,.15,.7);t.box("cream",a,.76,s+.09,.45,.12,.02)}for(const[o,a]of[[-4.1,3.2],[-5.2,6.2],[4.2,3.4]])pi(t,o,a,e);return t.finish()}function Ie(e){return{...Kr(Ro.gate.lat,Ro.gate.lon),y:e[0].y,yaw:-Ro.startPoint.facingDeg*Math.PI/180}}function vi(e,t,o){const a=Ie(e),r=t-a.x,s=o-a.z,n=Math.cos(a.yaw),i=Math.sin(a.yaw);return{x:n*r-i*s,z:i*r+n*s}}function Cl(e,t){const o=Ie(t),a=Math.cos(o.yaw),r=Math.sin(o.yaw),s=(n,i)=>na.some(l=>Math.abs(n.x-l.x)<l.depth/2+.6+i&&n.z>l.from-i&&n.z<l.to+i);return e.map(n=>n.entranceSpecimen||n.keepAtEntrance?n:{...n,placements:n.placements.filter(i=>{const l=i.x-o.x,c=i.z-o.z,u={x:a*l-r*c,z:r*l+a*c},f=n.kind==="tree"?2.5:.6;return!mn(u.x,u.z,f)&&!s(u,f)})}).filter(n=>n.placements.length)}function Dl(e,t){const o=Ie(e),a=new Rt,r=new Eo,s=new Eo;a.name="입구 일주문·광장",a.userData.metricKind="입구 시설",r.autoUpdate=s.autoUpdate=!1;for(const l of[!1,!0]){const c=new Rt;c.add(hi(l),gi(l)),r.addLevel(c,l?45:0,.1)}r.addLevel(new Rt,150,.1),s.name="광장 시설";for(const l of[!1,!0])s.addLevel(ii(l),l?60:0,.1);s.addLevel(new Rt,170,.1);for(const l of[r,s])l.position.set(o.x,o.y,o.z),l.rotation.y=o.yaw,a.add(l);const n=ti(o,t);a.add(n);const i=(l,c,u)=>l<c?0:l<u?1:2;return a.updateMatrixWorld(!0),{group:a,items:[r,s],frame:o,ground:n,update(l){const c=l.position.distanceTo(r.position);r.levels.forEach((u,f)=>{u.object.visible=f===i(c,45,150)}),s.levels.forEach((u,f)=>{u.object.visible=f===i(c,60,170)}),n.visible=c<220}}}function Al(e,t){const o=t[0];return e.flatMap(a=>{if(a.kind!=="tree"||!a.id?.startsWith("pine_"))return[a];const r=[],s=[];for(const n of a.placements)(Math.hypot(n.x-o.x,n.z-o.z)<65?r:s).push(n);return[...s.length?[{...a,placements:s}]:[],...r.length?[{...a,id:"tree_small_02",crossboard:null,impostor:null,placements:r,levels:[0,1,2].map(n=>({url:`tree_small_02-lod${n}.glb`,distance:[0,48,120][n]}))}]:[]]})}function Fl(e){const t=Ie(e),o=Math.cos(t.yaw),a=Math.sin(t.yaw);return(r,s,n)=>{const i=r-t.x,l=s-t.z,c=o*i-a*l,u=a*i+o*l,f=Math.max(Math.abs(c)-13,-2-u,u-42,0),h=Math.min(1,f/10),m=1-h*h*(3-2*h);return n+(t.y-n)*m}}const jo=Object.freeze(["paved","stairs","deck","deck_stairs"]),Ra=e=>jo.includes(e?.material);function yn(e,{nearest:t=aa(e),sites:o=[],water:a=null}={}){const r=Ie(e),s=Math.cos(r.yaw),n=Math.sin(r.yaw),i=(u,f)=>{const h=u-r.x,m=f-r.z;return{x:s*h-n*m,z:n*h+s*m}};function l(u,f,h=0){const m=i(u,f);return mn(m.x,m.z,h)||na.some(d=>Math.abs(m.x-d.x)<d.depth/2+h&&m.z>d.from-h&&m.z<d.to+h)}function c(u,f,h=0,m=null){if(l(u,f,h))return!0;const d=m??t(u,f);if(Number.isFinite(d.distance)&&(Ra(e[d.index])||Ra(e[d.index+1]))&&d.distance<d.width/2+h||a?.blocked(u,f,h))return!0;for(const g of o)if(Math.hypot(u-g.x,f-g.z)<g.supportRadius+h)return!0;return!1}return{entrance:l,blocked:c,local:i,water:a}}const Le=1.5,Pe=6.5,Gt=18,Re=1.9,Na=3.5,Qt=e=>(e=e*.1031%1,e*=e+33.33,e*=e+e,e-Math.floor(e));function wn(e){return Qt(e*3.1+1)>.72?null:{across:(Qt(e*7.3+2)-.5)*1,along:(e+.15+.7*Qt(e*5.7+3))*Pe,radius:.2+.22*Qt(e*11.9+4)}}function bn(e){return Qt(e*5.1+1)<.4?null:{along:e*Gt+(Qt(e*2.3+7)-.5)*5,height:.35+.5*Qt(e*9.7+2)}}function Jt(e){const t=Math.floor(e/Gt+.5),o=bn(t);if(!o)return 0;const a=e-o.along;return a<0||a>=Na?0:o.height*Math.pow(1-a/Na,1.4)}function xi(e,t,o=0,a=1,r=null){const s=[0];for(let x=1;x<e.length;x++)s.push(s[x-1]+Math.hypot(e[x].x-e[x-1].x,e[x].z-e[x-1].z));const n=s.at(-1),i=Math.max(2,Math.round(n/a)+1),l=[],c=Array.from({length:i},(x,v)=>n*v/(i-1));if(r)for(let x=Math.floor((o-Gt)/Gt);x<=Math.ceil((o+n)/Gt);x++){const v=bn(x);if(!v)continue;const y=v.along-o;y>.03&&y<n&&c.push(y-.02,y)}c.sort((x,v)=>x-v);const u=c.length;for(let x=0;x<u;x++){const v=c[x];let y=1;for(;y<e.length-1&&s[y]<v;)y++;const S=(v-s[y-1])/Math.max(1e-6,s[y]-s[y-1]);l.push({x:e[y-1].x+(e[y].x-e[y-1].x)*S,z:e[y-1].z+(e[y].z-e[y-1].z)*S,along:o+v})}for(let x=0;x<u;x++){const v=l[Math.max(0,x-1)],y=l[Math.min(u-1,x+1)],S=Math.hypot(y.x-v.x,y.z-v.z)||1;l[x].dir=[(v.x-y.x)/S,(v.z-y.z)/S],l[x].side=[-(y.z-v.z)/S*-1,(y.x-v.x)/S*-1];const C=l[x].dir[0],D=l[x].dir[1];l[x].side=[D,-C]}const f=[-1,-.62,-.3,0,.3,.62,1],h=[],m=[],d=[],g=[];for(let x=0;x<u;x++){const v=l[x];for(const y of f){const S=v.x+v.side[0]*y*Le,C=v.z+v.side[1]*y*Le;h.push(S,t(S,C)+.035+(r?r(v.along):0),C),m.push(y,v.along),d.push(v.dir[0],v.dir[1],v.side[0],v.side[1])}if(x){const y=x*f.length,S=y-f.length;for(let C=0;C<f.length-1;C++)g.push(S+C,S+C+1,y+C,S+C+1,y+C+1,y+C)}}const p=new bt;if(p.setAttribute("position",new st(h,3)),p.setAttribute("aStream",new st(m,2)),p.setAttribute("aFrame",new st(d,4)),p.setIndex(g),p.computeVertexNormals(),p.computeBoundingSphere(),r){const x=p.attributes.normal;for(let v=0;v<x.count;v++)x.setXYZ(v,0,1,0)}return{geometry:p,samples:l,alongEnd:l.at(-1).along}}function yi(e,t,o=null){const a=[-1,-.78,-.55,-.28,0,.28,.55,.78,1],r=[],s=[],n=[],i=new rt;for(let c=0;c<e.length;c++){const u=e[c],f=o?o(u.along):0,h=o&&f===0&&c+1<e.length&&o(e[c+1].along)>0&&e[c+1].along-u.along<.05;for(const m of a){const d=m*Re,g=u.x+u.side[0]*d,p=u.z+u.side[1]*d,x=1-Math.min(1,Math.max(0,(Math.abs(d)-1.5)/(Re-1.5))),v=.5+.5*Math.sin(g*.9+Math.sin(p*.7)*1.8)*Math.cos(p*.8-g*.3);r.push(g,t(g,p)+.02+f*x,p),i.setRGB(.082+.035*v,.078+.033*v,.07+.03*v),i.multiplyScalar(1-.4*Math.min(1,Math.max(0,(Math.abs(d)-.9)/(Re-.9)))),h&&Math.abs(d)<1.8&&i.multiplyScalar(.6),s.push(i.r,i.g,i.b)}if(c){const m=c*a.length,d=m-a.length;for(let g=0;g<a.length-1;g++)n.push(d+g,d+g+1,m+g,d+g+1,m+g+1,m+g)}}const l=new bt;return l.setAttribute("position",new st(r,3)),l.setAttribute("color",new st(s,3)),l.setIndex(n),l.computeVertexNormals(),l.computeBoundingSphere(),l}const Be=9,Sn=[-.85,-.42,0,.42,.85],Mn=(e,t=1/0)=>Math.max(.05,Math.min(.22+.5*e,t*.8)),ao=e=>({out:e,drop:e*e}),wi=.3;function kn(e,t){const o=e[t];for(let a=t-1;a>=0;a--){const r=Math.hypot(e[a].x-o.x,e[a].z-o.z);if(r>=wi)return{index:a,room:r}}return{index:-1,room:1/0}}function bi(e,t){const o=[],a=[],r=[],s=Sn,n=Be;for(let l=1;l<e.length;l++){const c=e[l],u=Jt(c.along);if(!(u>0&&Jt(e[l-1].along)===0))continue;const f=o.length/3,h=Mn(u,kn(e,l-1).room),m=[0];for(let d=1;d<n;d++){const g=ao((d-1)/(n-1)),p=ao(d/(n-1));m.push(m[d-1]+Math.hypot((p.out-g.out)*h,(p.drop-g.drop)*u))}for(let d=0;d<n;d++){const g=d/(n-1),{out:p,drop:x}=ao(g),v=h,y=-2*u*g,S=Math.hypot(v,y)||1,C=-y/S*.03,D=v/S*.03;for(let W=0;W<s.length;W++){const R=c.x+c.side[0]*s[W],k=c.z+c.side[1]*s[W],M=t(R,k)+.035+u,w=t(R+c.dir[0]*h,k+c.dir[1]*h)+.035,A=p*h+C;o.push(R+c.dir[0]*A,M+(w-M)*x+D,k+c.dir[1]*A),a.push(W/(s.length-1),m[d]/m[n-1])}}for(let d=0;d<n-1;d++)for(let g=0;g<s.length-1;g++){const p=f+d*s.length+g,x=p+1,v=p+s.length,y=v+1;r.push(p,x,v,x,y,v)}}if(!o.length)return null;const i=new bt;return i.setAttribute("position",new st(o,3)),i.setAttribute("uv",new st(a,2)),i.setIndex(r),i.computeBoundingSphere(),i}function Si(e,t,o,a,r=28){const s=[],n=[],i=[],l=[],c=[0,.35,.62,.82,.94,1,1.3];s.push(e,a(e,t)+.04,t),n.push(0,0),i.push(0,-1,1,0);for(const f of c.slice(1))for(let h=0;h<r;h++){const m=h/r*Math.PI*2,d=e+Math.cos(m)*o*f,g=t+Math.sin(m)*o*f;s.push(d,a(d,g)+.04,g),n.push(f,0),i.push(0,-1,1,0)}for(let f=0;f<r;f++)l.push(0,1+(f+1)%r,1+f);for(let f=0;f<c.length-2;f++)for(let h=0;h<r;h++){const m=1+f*r+h,d=1+f*r+(h+1)%r,g=m+r,p=d+r;l.push(m,d,g,d,p,g)}const u=new bt;return u.setAttribute("position",new st(s,3)),u.setAttribute("aStream",new st(n,2)),u.setAttribute("aFrame",new st(i,4)),u.setIndex(l),u.computeVertexNormals(),u.computeBoundingSphere(),u}const Mi=`
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
`,ki=`
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
 float across=sStream.x*${Le.toFixed(2)};float along=sStream.y;
 float speed=.85+.4*fxRain;
 float q=along+fxTime*speed;
 float halfW=.62+.22*sV(vec2(along*.28,3.1));
 float dW=halfW-abs(across);
 vec2 flowP=vec2(across,q);
 // 턱(작은 낙차): 18m마다 물이 한 번 떨어지고 그 아래로 거품이 하류로 길게 흩어진다.
 float lc=floor(along/${Gt.toFixed(1)}+.5);
 float ledgeOn=step(.4,sH(lc*5.1+1.));
 float lx=along-(lc*${Gt.toFixed(1)}+(sH(lc*2.3+7.)-.5)*5.);
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
`;function Wa({pond:e=!1,pondRadius:t=5}={}){const o=new xe({color:16777215,transparent:!0,depthWrite:!1,side:Ct,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2});return o.userData.fxWater=!0,o.onBeforeCompile=a=>{Object.assign(a.uniforms,{fxTime:wt.fxTime,fxSunVis:wt.fxSunVis,fxLowSun:wt.fxLowSun,fxQuality:wt.fxQuality,fxRain:wt.fxRain,fxSun:wt.fxSun}),a.vertexShader=a.vertexShader.replace("#include <common>",`#include <common>
attribute vec2 aStream;attribute vec4 aFrame;varying vec2 sStream;varying vec4 sFrame;varying vec3 sWorld;`).replace("#include <begin_vertex>",`#include <begin_vertex>
sStream=aStream;sFrame=aFrame;sWorld=(modelMatrix*vec4(transformed,1.0)).xyz;`);const r=e?`#define STREAM_POND
#define SPAN ${t.toFixed(2)}
`:"",s="{float la=sStream.x*"+Le.toFixed(2)+";diffuseColor=vec4(vec3(.13,.36,.5)*diffuseColor.rgb,step(abs(la),.75));}";a.fragmentShader=a.fragmentShader.replace("#include <common>",r+`#include <common>
`+Mi).replace("#include <color_fragment>",`#include <color_fragment>
`+($o&&!e?s:ki))},o.customProgramCacheKey=()=>`stream-water-v3-${e?"pond":"stream"}-${t}-${$o?"off":"on"}`,o}function zi(e,t,o){let a=1/0;for(let r=0;r<e.length;r+=2){const s=e[r],n=Math.hypot(s.x-t,s.z-o);n<a&&(a=n)}return a}function Ti(){const e=new xe({color:16777215,transparent:!0,depthWrite:!1,side:Ct});return e.onBeforeCompile=t=>{t.uniforms.fxTime=wt.fxTime,t.vertexShader=t.vertexShader.replace("#include <common>",`#include <common>
varying vec2 fUv;`).replace("#include <begin_vertex>",`#include <begin_vertex>
fUv=uv;`),t.fragmentShader=t.fragmentShader.replace("#include <common>",`#include <common>
varying vec2 fUv;uniform float fxTime;float fH(float n){return fract(sin(n*12.9898)*43758.5453);}`).replace("#include <color_fragment>",`#include <color_fragment>
{float lane=floor(fUv.x*9.);float r=fH(lane+3.);float flow=fract(fUv.y*1.4-fxTime*(1.5+r)+r*7.);
 float lane2=step(.35,fH(lane+11.));float a=(.12+.6*smoothstep(.2,.9,flow)*lane2)*(1.-smoothstep(.3,.5,abs(fUv.x-.5)))*(1.-.6*smoothstep(.5,1.,fUv.y))*smoothstep(0.,.1,fUv.y);
 diffuseColor=vec4(vec3(.42,.5,.52)*diffuseColor.rgb,a*.55);}`)},e.customProgramCacheKey=()=>"fall-water-v2",e}function _i(){const e=new Wt({color:16777215,vertexColors:!0,roughness:.96,metalness:0,emissive:2762789,flatShading:!0,polygonOffset:!0,polygonOffsetFactor:-1,polygonOffsetUnits:-1});return e.onBeforeCompile=t=>{t.vertexShader=t.vertexShader.replace("#include <common>",`#include <common>
varying vec3 bWorld;`).replace("#include <begin_vertex>",`#include <begin_vertex>
bWorld=(modelMatrix*vec4(transformed,1.0)).xyz;`),t.fragmentShader=t.fragmentShader.replace("#include <common>",`#include <common>
varying vec3 bWorld;`).replace("#include <color_fragment>",`#include <color_fragment>
{vec2 w=bWorld.xz;vec2 p=vec2(w.x*.94+w.y*.34,-w.x*.34+w.y*.94)/vec2(3.4,2.2);float row=floor(p.y);
 p.x+=row*.37+fract(sin(row*7.1)*43758.5)*.9;vec2 f=fract(p);vec2 id=vec2(floor(p.x),row);
 float d=min(min(f.x,1.-f.x)*3.4,min(f.y,1.-f.y)*2.2);float crack=1.-smoothstep(.02,.1,d);
 float h=fract(sin(dot(id,vec2(12.9898,78.233)))*43758.5453);float g=fract(sin(dot(floor(w*8.),vec2(41.3,17.7)))*9631.7);
 diffuseColor.rgb*=(.8+.34*h)*(1.-.6*crack)*(.95+.1*g);}`)},e.customProgramCacheKey=()=>"bed-rock-v2",e}const zn=[{id:1,metres:1070,shares:[["paved",70],["soil",30]]},{id:2,metres:1525,shares:[["soil",60],["rock",40]]},{id:3,metres:651,shares:[["soil",40],["rock",30],["stairs",30]]},{id:4,metres:1066,shares:[["soil",15],["rock",25],["deck_stairs",60]]},{id:5,metres:157,shares:[["deck_stairs",60],["rock",25],["soil",15]]},{id:6,metres:340,shares:[["stairs",40],["rock",30],["ridge",30]]},{id:7,metres:153,shares:[["ridge",60],["rock",40]]}],La=zn.reduce((e,t)=>e+t.metres,0),Ee=[];let No=0;for(const e of zn)for(const[t,o]of e.shares){const a=No+e.metres*o/100;Ee.push({section:e.id,material:t,start:No,end:a}),No=a}function Tn(e){return Ee.find(t=>e<t.end-1e-8)??Ee.at(-1)}const Rl=e=>e==="stairs"||e==="deck_stairs";function Nl(e){const t=e.slice(1).map((l,c)=>Math.hypot(l.x-e[c].x,l.z-e[c].z)),o=t.reduce((l,c)=>l+c,0),a=La/o,r=[];let s=0,n=0;for(let l=0;l<t.length;l++){const c=e[l],u=e[l+1],f=t[l],h=Math.hypot(f,u.y-c.y),m=[0,...Ee.map(d=>d.end/a-s).filter(d=>d>1e-7&&d<f-1e-7).map(d=>d/f)];for(const d of m){const g=(s+f*d)*a,p=Tn(g);r.push({...c,x:c.x+(u.x-c.x)*d,y:c.y+(u.y-c.y)*d,z:c.z+(u.z-c.z)*d,elevationCorrection:(c.elevationCorrection??0)+((u.elevationCorrection??0)-(c.elevationCorrection??0))*d,width:(c.width??2.2)+((u.width??2.2)-(c.width??2.2))*d,s:n+h*d,referenceMetres:g,material:p.material,section:p.section})}s+=f,n+=h}const i=Ee.at(-1);return r.push({...e.at(-1),s:n,referenceMetres:La,material:i.material,section:i.section}),r}const Ci=!1,Di=!1,Ai=!1,Fi=!0,Ri="gwanak-hiking:ambient-volume:v1",_n={stream:"stream-loop.flac",forest:"wind-forest-loop.flac",ridge:"wind-ridge-loop.flac",birds:"birds-loop.flac",crowd:"summit-murmur-loop.flac",city:"city-far-loop.flac"},Ni={stream:-26,forest:-30,ridge:-24,birds:-34,crowd:-34,city:-36},Ko={stream:[null,-50,-38,-42,null,null,null,null],forest:[null,-50,-48,-46,-42,-42,-46,null],ridge:[null,null,null,null,null,null,-39,-33],birds:[null,-52,-52,-54,-56,-56,null,null],city:[null,-52,-60,null,null,null,null,null],crowd:[null,null,null,null,null,null,-48,-44]},qo={low:-37,high:-32},no=[[0,60],[800,30],[1070,15],[1500,8],[2e3,5],[2595,8],[2800,20],[3e3,45],[3246,90]],Cn=-58,Dn={hMin:100,hMax:560,dbMin:-50,dbMax:-42},_e={h0:580,h1:640,exposure:{6:.6,7:1},dbBase:-48,dbRange:15,lowpassHz:[1200,3500],gustDb:2.5},Wi={birds:{on:[8,14],off:[12,30],upperOn:[6,10],upperOff:[20,45],fade:1.5},crow:{low:[20,70],high:[40,140],peakDb:-30},moktak:{count:[8,12],interval:[.9,1.1],rest:[40,90],start:4800,radius:60,origin:4860}},Li={jump:1.5,city:12,forest:6,upper:8,summit:6},Pi={db:-2,attackS:.01,releaseS:.25,minSumDb:-34},Ut=(e,t=0,o=1)=>Math.max(t,Math.min(o,e)),mo=e=>e===null||e===-1/0?0:10**(e/20),Bi=e=>{let t=0;for(const o of e)o&&(t+=o.length*o.numberOfChannels*4);return Math.round(t/1048576*10)/10},Zo=e=>{const t=e.reduce((o,a)=>o+mo(a)**2,0);return t?10*Math.log10(t):-1/0},An=e=>Tn(e).section;function Xo(e){for(let t=1;t<no.length;t++){const[o,a]=no[t],[r,s]=no[t-1];if(e<=o)return s+(a-s)*Ut((e-r)/(o-r))}return 90}const ho={distance:null},Fn=e=>{ho.distance=Number.isFinite(e)?e:null},Rn=e=>{const t=-38-20*Math.log10(Math.max(e,5)/5);return t<Cn?null:t},It={wind:null,rain:0,listeners:new Set};function Ei({wind:e=It.wind,rain:t=It.rain}={}){It.wind=e===null?null:Ut(e),It.rain=Ut(t);for(const o of It.listeners)o(It)}const Nn=e=>e===null?0:Ut(14*(e-.2),-4,10);function $i(e,t,{birds:o=!0,gust:a=0}={}){const r=An(e),s=Ut((t-_e.h0)/(_e.h1-_e.h0)),n=s*s*(3-2*s)*(_e.exposure[r]||0),i=ho.distance===null?Xo(e):Math.min(ho.distance,Xo(e)*2.5),l=Dn.dbMin+8*Ut((t-100)/460),c=Nn(It.wind),u=It.rain,f=o&&u<.6?Ko.birds[r]:null,h={stream:r<=3?Rn(i):null,forest:r<7&&n<1?l+20*Math.log10(1-n)+c:null,ridge:n>0?-48+15*n+a+c:null,birds:f===null?null:f-14*u,city:Ko.city[r],crowd:r===7?-44:r===6&&e>=4609?-54+6*Ut((e-4609)/200):null},m=(r<=5?qo.low:qo.high)+Math.max(0,c)*.6,d=Zo(Object.values(h)),g=Math.min(0,m-d);for(const p in h)h[p]!==null&&(h[p]+=g);return{section:r,targets:h,distance:i,exposure:n,budgetDb:m,correction:g,sumRmsDb:Zo(Object.values(h))}}function Hi(e,t,o){o=Ut(o);const a=o===0?1:o===1?0:Math.cos(o*Math.PI/2)**2,r=1-a;return Object.fromEntries(Object.keys(_n).map(s=>[s,Math.sqrt(mo(e[s])**2*a+mo(t[s])**2*r)]))}const Wl=Object.freeze(Object.defineProperty({__proto__:null,BUDGET_DB:qo,CICADA_ENABLED:Ai,CITY_SUMMIT_ENABLED:Di,CROSSFADE_S:Li,CROWD_ENABLED:Fi,DUCK:Pi,FILE_RMS_DB:Ni,INTERMITTENT:Wi,LAYER_FILES:_n,SECTION_TARGET_DB:Ko,STREAM_CUTOFF_DB:Cn,STREAM_DISTANCE_M:no,STREAM_NEAR:ho,VERIFIED:Ci,VOLUME_SAVE_KEY:Ri,WEATHER_SOUND:It,WIND_FOREST:Dn,WIND_RIDGE:_e,ambientSectionAt:An,ambientTargets:$i,audioBufferMB:Bi,clamp:Ut,crossfade:Hi,dbGain:mo,powerDb:Zo,setStreamDistance:Fn,setWeatherSound:Ei,streamDb:Rn,streamDistance:Xo,windShiftDb:Nn},Symbol.toStringTag,{value:"Module"})),Wn=[{id:"lake",metres:740,side:-12,kind:"호수공원·자하정",source:"실경-구간별-참고사진.md §2"},{id:"junction",metres:1070,side:4.8,kind:"제1광장 갈림·쉼터",source:"실경-구간별-참고사진.md §4"},{id:"stairs-rest",metres:4312,side:3,kind:"깔딱고개 중간 벤치",source:"실경-구간별-참고사진.md §5"},{id:"yeonjuam",metres:4540,side:15,kind:"연주암 사찰 표현",source:"실경-구간별-참고사진.md §6"}];function oe(e,t,o=0){const a=e.findIndex(f=>(f.referenceMetres??f.s)>=t),r=a<0?e.length-1:Math.max(1,a),s=e[r-1],n=e[r],i=Pt.clamp((t-(s.referenceMetres??s.s))/((n.referenceMetres??n.s)-(s.referenceMetres??s.s)||1),0,1),l=n.x-s.x,c=n.z-s.z,u=Math.hypot(l,c)||1;return{x:Pt.lerp(s.x,n.x,i)-c/u*o,z:Pt.lerp(s.z,n.z,i)+l/u*o,yaw:Math.atan2(-l,-c)}}const Ln=e=>-6.2+1.9*Math.sin(e/4.1+.7)+.8*Math.sin(e/9.3+2.1),Pn=2;function Wo(e,t,o,a){const r=new Ne(e,t,o),s=r.attributes.position,n=(i,l)=>{const c=Math.sin(a*13.7+i*7.9+l*3.3)*43758.5453;return c-Math.floor(c)-.5};for(let i=0;i<s.count;i++){const l=s.getY(i)>0,c=l?.55:1;s.setXYZ(i,s.getX(i)*c+n(i,1)*e*.1,s.getY(i)+(l?n(i,2)*t*.5:0),s.getZ(i)*c+n(i,3)*o*.1)}return r.rotateY(a*1.9),r.computeVertexNormals(),r}ve.set("slab",new Wt({color:6710623,emissive:3815733,roughness:.96,flatShading:!0}));ve.set("slabDark",new Wt({color:5592143,emissive:3289389,roughness:.96,flatShading:!0}));function je(e,t=0,o=0){e.box("wood",t,.48,o,1.8,.13,.5),e.box("wood",t,.9,o-.23,1.8,.55,.08);for(const a of[-1,1])e.box("stone",t+a*.64,.23,o,.15,.46,.4)}function Pa(e,t){const o=yo();if(e==="lake"){o.add(new Kt(2.4,2.6,.3,8),"stone",0,.15,0);for(let s=0;s<6;s++){const n=s*Math.PI/3;o.beam("red",[Math.cos(n)*1.8,.3,Math.sin(n)*1.8],[Math.cos(n)*1.8,2.8,Math.sin(n)*1.8],.1)}o.box("green",0,2.75,0,4,.22,3.8),Fa(o,2.8,5.2,4.9,t),je(o,0,0)}else if(e==="junction")je(o,1.6,1.7),je(o,-1.2,1.7),o.beam("wood",[0,0,0],[0,2.8,0],.09),o.box("wood",0,2.5,0,2.6,.4,.1),o.box("wood",0,2,0,2.1,.35,.1);else if(e==="stairs-rest")je(o);else if(e==="yeonjuam"){o.box("stone",0,.35,0,7,.7,5),o.box("cream",0,1.9,0,6.2,2.4,4.2);for(const s of[-2.9,-1.45,0,1.45,2.9])o.box("red",s,1.9,2.13,.13,2.5,.13),s<2.9&&o.box("wood",s+.7,1.8,2.16,1.05,1.8,.03);o.box("green",0,3.2,0,6.8,.3,4.5),Fa(o,3.35,8.2,6,t)}const a=o.finish(),r=e==="junction"?"← 호수공원 · 삼성산 →":e==="lake"?"자하정":e==="yeonjuam"?"연주암":null;if(r){const s=xn(r,e==="junction"?2.5:1.6,e==="junction"?.32:.42,{background:"#484637",color:"#fff2cf"});s&&(s.position.set(0,e==="junction"?2.5:e==="lake"?2.72:3.1,e==="junction"?.061:e==="lake"?1.92:2.3),a.add(s))}return a}function Ll(e,t){return[...Wn.map(o=>{const a=oe(e,o.metres,o.side);return{...o,...a,y:t(a.x,a.z),supportRadius:o.id==="lake"?2.7:o.id==="yeonjuam"?4.5:2.5}}),{...oe(e,740,-19),id:"lake-water",supportRadius:5.5}].map(o=>({...o,y:o.y??t(o.x,o.z)}))}function Pl(e,t,o=1){return e.filter(a=>t.every(r=>Math.hypot(a.x-r.x,a.z-r.z)>r.supportRadius+o))}function Bl(e,t){const o=new Rt,a=[];o.name="구간별 참고 특징 보정",o.userData.metricKind="구간별 시설";for(const f of Wn){const h=oe(e,f.metres,f.side),m=new Eo;m.autoUpdate=!1,m.position.set(h.x,t(h.x,h.z)+.03,h.z),m.rotation.y=h.yaw,m.userData={...f,status:"위치·치수 추정"},m.addLevel(Pa(f.id,!1),0,.1),m.addLevel(Pa(f.id,!0),40,.1),m.addLevel(new Rt,120,.1),o.add(m),a.push(m)}const r=Wa(),s=_i(),n=Ti(),i=[];let l=0;for(let f=800;f<2560;f+=80){const h=[],m=yo();for(let y=f;y<=Math.min(f+80,2595);y+=Pn)h.push(oe(e,y,Ln(y)));const d=xi(h,t,l,1,Jt);i.push(...d.samples);for(let y=0;y<d.samples.length;y+=4){const S=d.samples[y];if(Jt(S.along)>0)continue;const D=Math.round(S.along*3.1);for(const W of[-1,1]){const R=_=>{const L=Math.sin(D*12.9+W*78.2+_*4.1)*43758.5453;return L-Math.floor(L)};if(R(0)<.3)continue;const k=W*(Re*(.95+.3*R(1))),M=S.x+S.side[0]*k,w=S.z+S.side[1]*k,A=1.3+1.5*R(2),z=.18+.2*R(3),F=1.2+1.2*R(4);if(m.add(Wo(A,z,F,D+W*3+R(5)),R(6)<.3?"slabDark":"slab",M,t(M,w)+z*.2,w),R(7)<.3){const _=.6+.5*R(8);m.add(Wo(_*1.8,_*.4,_*1.3,D*1.3+W),"slab",M+(R(9)-.5),t(M,w)+z+_*.1,w+(R(10)-.5))}}}for(let y=Math.floor(l/Pe);y<=Math.floor(d.alongEnd/Pe);y++){const S=wn(y);if(!S||S.along<l||S.along>=d.alongEnd||Jt(S.along)>0)continue;const C=d.samples.reduce((R,k)=>Math.abs(k.along-S.along)<Math.abs(R.along-S.along)?k:R),D=C.x+C.side[0]*S.across,W=C.z+C.side[1]*S.across;m.add(Wo(S.radius*3.4,S.radius*.7,S.radius*2.6,y),"slabDark",D,t(D,W)+S.radius*.1,W)}l=d.alongEnd;const g=m.finish(),p=new At(yi(d.samples,t,Jt),s),x=new At(d.geometry,r);p.name="계곡 암반",p.receiveShadow=!0,x.renderOrder=2,x.name="계곡 물",g.add(p,x);const v=bi(d.samples,t);if(v){const y=new At(v,n);y.renderOrder=3,y.name="계곡 낙수",g.add(y)}g.userData.stream=!0,g.userData.centre=h[Math.floor(h.length/2)],o.add(g)}const c=oe(e,740,-19),u=new At(Si(c.x,c.z,5,t),Wa({pond:!0,pondRadius:5}));return u.renderOrder=2,u.name="호수 수면",o.add(u),o.updateMatrixWorld(!0),{group:o,items:a,update(f){for(const m of a){const d=f.position.distanceTo(m.position);m.levels.forEach((g,p)=>{g.object.visible=p===(d<40?0:d<120?1:2)})}for(const m of o.children)if(m.userData.stream){const d=m.userData.centre;m.visible=Math.hypot(f.position.x-d.x,f.position.z-d.z)<150}u.visible=Math.hypot(f.position.x-c.x,f.position.z-c.z)<150;const h=zi(i,f.position.x,f.position.z);Fn(h<90?Math.max(h,2):null)}}}const ze=Object.freeze({from:800,to:2560,step:Pn,halfWidth:Re}),Ke=Object.freeze({metres:740,side:-19,radius:5}),fe=16;function Ii(e,t,o,a){const r=a.x-o.x,s=a.z-o.z,n=r*r+s*s,i=n?Math.max(0,Math.min(1,((e-o.x)*r+(t-o.z)*s)/n)):0;return Math.hypot(e-(o.x+r*i),t-(o.z+s*i))}function Bn(e){const t=[];for(let i=ze.from;i<=ze.to;i+=ze.step)t.push(oe(e,i,Ln(i)));const o=oe(e,Ke.metres,Ke.side),a=new Map,r=(i,l)=>(i+1048576)*2097152+(l+1048576);for(let i=1;i<t.length;i++){const l=t[i-1],c=t[i];for(let u=Math.floor(Math.min(l.x,c.x)/fe)-1;u<=Math.floor(Math.max(l.x,c.x)/fe)+1;u++)for(let f=Math.floor(Math.min(l.z,c.z)/fe)-1;f<=Math.floor(Math.max(l.z,c.z)/fe)+1;f++){const h=r(u,f);a.has(h)||a.set(h,[]),a.get(h).push(i)}}function s(i,l){const c=a.get(r(Math.floor(i/fe),Math.floor(l/fe)));if(!c)return 1/0;let u=1/0;for(const f of c)u=Math.min(u,Ii(i,l,t[f-1],t[f]));return u}const n=(i,l)=>Math.hypot(i-o.x,l-o.z);return{line:t,pond:o,streamDistance:s,pondDistance:n,inStream:(i,l,c=0)=>s(i,l)<ze.halfWidth+c,inPond:(i,l,c=0)=>n(i,l)<Ke.radius+c,blocked(i,l,c=0){return s(i,l)<ze.halfWidth+c||n(i,l)<Ke.radius+c}}}function Oi(e,t){return Math.max(e.min.x-t.x,0,t.x-e.max.x)**2+Math.max(e.min.y-t.y,0,t.y-e.max.y)**2+Math.max(e.min.z-t.z,0,t.z-e.max.z)**2}function El(e){e.updateWorldMatrix(!0,!0);const t=new Xa;return e.traverse(o=>{o.geometry&&(o.isInstancedMesh?(o.computeBoundingBox(),t.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld))):(o.geometry.computeBoundingBox(),t.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld))))}),t}function Gi(){const e=new ws,t=new Za;function o(a,r=63){if(a.isEmpty())return-1;let s=0;for(let n=0;n<6;n++){const i=1<<n;if(!(r&i))continue;const l=e.planes[n],c=l.normal,u=c.x>0?a.min.x:a.max.x,f=c.x>0?a.max.x:a.min.x,h=c.y>0?a.min.y:a.max.y,m=c.y>0?a.max.y:a.min.y,d=c.z>0?a.min.z:a.max.z,g=c.z>0?a.max.z:a.min.z;if(c.x*f+c.y*m+c.z*g+l.constant<0)return-1;c.x*u+c.y*h+c.z*d+l.constant<0&&(s|=i)}return s}return{update(a){a.updateMatrixWorld(),e.setFromProjectionMatrix(t.multiplyMatrices(a.projectionMatrix,a.matrixWorldInverse))},inFrustum(a){return!a.isEmpty()&&e.intersectsBox(a)},planeMask:o,visible(a,r,s=1/0,n=63){return!a.isEmpty()&&Oi(a,r.position)<=s*s&&(n===63?e.intersectsBox(a):o(a,n)>=0)}}}const qe=new WeakMap;function Ui(){}function Ba(e){return e.traverse(t=>{qe.has(t)&&(t.updateMatrixWorld=qe.get(t)),t.matrixWorldAutoUpdate=!0,t.updateMatrix(),t.matrixAutoUpdate=!1}),e.updateWorldMatrix(!0,!1),e.updateMatrixWorld(!0),e.traverse(t=>{t.matrixWorldAutoUpdate=!1,t.matrixWorldNeedsUpdate=!1}),qe.has(e)||qe.set(e,e.updateMatrixWorld),e.updateMatrixWorld=Ui,e}function Vi(e,{kind:t,nearDetail:o,representation:a,index:r},s){if(a==="crossboard")return 120;if(a==="impostor")return 400;if(r===0)return 0;const n=t==="rock"?[[6,16],[12,32],[24,64]][s]:o||t==="understory"?[[3,10],[5,16],[8,32]][s]:[[4,12],[6,20],[10,40]][s];return Math.min(e,n[Math.min(r-1,1)])}function $l(e,t){for(const[o,a]of e.levels.entries()){const r=a.object.userData.lodSource;a.distance=Vi(r.distance,{...r,index:o},t),a.object.traverse(s=>{s.isMesh&&(s.castShadow=!1)})}}const Ot={ridgeStart:430,ridgeFull:520,summitStart:600,summitFull:625,targets:{valley:{broadleaf:.8},mid:{broadleaf:.75},ridge:{broadleaf:.25},summit:{broadleaf:.1}}},ji=e=>Math.max(0,Math.min(1,e)),wo=(e,t,o)=>{const a=ji((o-e)/(t-e));return a*a*(3-2*a)},qt=(e,t,o)=>e+(t-e)*o;function la(e){return Number.isFinite(e)?wo(Ot.ridgeStart,Ot.ridgeFull,e):0}function ca(e){return Number.isFinite(e)?wo(Ot.summitStart,Ot.summitFull,e):0}function Ki(e){return qt(qt(1,.3,la(e)),.12,ca(e))}function Ea(e){return qt(qt(1,.25,la(e)),.12,ca(e))}function $a(e){return Number.isFinite(e)?qt(1,.184,wo(585,595,e)):1}function Ha(e){if(!Number.isFinite(e))return Ot.targets.mid.broadleaf;const t=qt(Ot.targets.valley.broadleaf,Ot.targets.mid.broadleaf,wo(150,300,e));return qt(qt(t,Ot.targets.ridge.broadleaf,la(e)),Ot.targets.summit.broadleaf,ca(e))}function Hl(e){let t=20261103;const o=()=>(t=Math.imul(t,1664525)+1013904223>>>0)/4294967296,a=new Map,r=[];function s(i,l,c){const u=`${i}:${Math.floor(c.x/64)}:${Math.floor(c.z/64)}`;a.has(u)||a.set(u,{id:i,kind:l,nearDetail:!0,levels:i==="rock_09"?[{url:"rock_09-lod2.glb",distance:0}]:[0,1,2].map(f=>({url:`${i}-lod${f}.glb`,distance:[0,48,110][f]})),placements:[]}),a.get(u).placements.push(c)}let n=0;for(let i=0;i<e.length-1;i++){const l=e[i],c=e[i+1],u=Math.hypot(c.x-l.x,c.z-l.z)||1;for(;n<=c.s;){const f=Math.max(0,Math.min(1,(n-l.s)/(c.s-l.s||1))),h=kt(l.x,c.x,f),m=kt(l.z,c.z,f),d=kt(l.y,c.y,f),g=kt(l.width,c.width,f);for(const p of[-1,1]){const x=g/2+.18+o()*.85,v=h-(c.z-l.z)/u*x*p,y=m+(c.x-l.x)/u*x*p,S=Fo(e,v,y);if(S.distance>S.width/2+.08){s("rock_09","rock",{x:v,z:y,scale:1.2+o()*4.5,yaw:o()*Math.PI*2,embed:.006});for(let C=0;C<3;C++){const D=g/2+.3+C*1.8+o()*1.5,W=h-(c.z-l.z)/u*D*p,R=m+(c.x-l.x)/u*D*p,k=Fo(e,W,R);if(k.distance<=k.width/2+.15)continue;const M=o(),w=M<.48?"litter":M<.9?"grass":"shrub";if(d>600&&w==="shrub")continue;const A=.65+o()*.7,z=o()*Math.PI*2;(jo.includes(e[k.index]?.material)||jo.includes(e[k.index+1]?.material))&&k.distance<k.width/2+(w==="litter"?.36:.2)*A||r.push({x:W,z:R,kind:w,scale:A,yaw:z})}}if(d>430&&n%12<2){const C=g/2+2.5+o()*6,D=h-(c.z-l.z)/u*C*p,W=m+(c.x-l.x)/u*C*p,R=Fo(e,D,W);R.distance>R.width/2+1.5&&s(d<600&&o()<.25?"pine_tree_01":"pine_sapling_medium","tree",{x:D,z:W,scale:d<600?.36+o()*.28:.22+o()*.12,yaw:o()*Math.PI*2,embed:.035})}}n+=2}}return{entries:[...a.values()],grass:r}}function Il(e,t){const o=new Rt;o.name="길가 하층 식생 · 임시 표현";const a=new Map;for(const n of e){const i=`${n.kind??"grass"}:${Math.floor(n.x/64)},${Math.floor(n.z/64)}`;a.has(i)||a.set(i,[]),a.get(i).push(n)}const r=new Map;for(const[n,i]of[["grass",5858114],["litter",7888964],["shrub",4938041]]){const l=[];for(let f=0;f<(n==="shrub"?8:5);f++){const h=f*2.399,m=Math.cos(h)*.17,d=Math.sin(h)*.17;if(n==="litter")l.push(m-.09,.025,d,m+.09,.025,d,m,.04,d+.19);else{const g=n==="shrub"?.45+f*.025:.18+f*.018;l.push(m-.035,0,d,m+.035,0,d,m+.08,g,d+.025)}}const c=new bt;c.setAttribute("position",new st(l,3)),n!=="litter"&&c.scale(.65,n==="shrub"?.45:.65,.65),c.computeVertexNormals();const u=new Wt({color:i,roughness:1,side:Ct});n!=="litter"&&(u.onBeforeCompile=f=>{f.uniforms.foliageTime=ae.foliageTime,f.vertexShader=f.vertexShader.replace("#include <common>",`#include <common>
uniform float foliageTime;`).replace("#include <begin_vertex>",`#include <begin_vertex>
     #ifdef USE_INSTANCING
     vec3 roadsideAnchor=instanceMatrix[3].xyz;float roadsideTip=position.y*position.y*${n==="shrub"?"4.":"9."};
     transformed.x+=sin(foliageTime*1.5+roadsideAnchor.x*.08+roadsideAnchor.z*.06)*roadsideTip*.35;
     transformed.z+=sin(foliageTime*1.1+roadsideAnchor.z*.07)*roadsideTip*.2;
     #endif`)},u.customProgramCacheKey=()=>`roadside-${n}-wind-v1`),r.set(n,{geometry:c,material:u})}const s=new ta;for(const n of a.values()){const{geometry:i,material:l}=r.get(n[0].kind??"grass"),c=new ro(i,l,n.length);n.forEach((u,f)=>{s.position.set(u.x,t(u.x,u.z)-.025,u.z),s.rotation.y=u.yaw,s.scale.setScalar(u.scale),s.updateMatrix(),c.setMatrixAt(f,s.matrix)}),c.userData.fullCount=n.length,c.userData.metricKind="하층 식생",c.computeBoundingBox(),c.computeBoundingSphere(),c.receiveShadow=!0,o.add(c)}return o}const po={near:[10,16,24],far:[28,45,65],floor:.2,step:.05};function En(e,t,o,a=po.floor){const r=Math.max(0,Math.min(1,(e-t)/(o-t))),s=Math.round(1/po.step);return Math.round((1-(1-a)*r)*s)/s}function Ol(e,t,o){const a=po.far[o],r=po.near[o];e.visible=t<a;const s=[.25,.5,1][o]*En(t,r,a);e.count=Math.ceil(e.userData.fullCount*s)}const Ia=[8,12,16];function Yo(e,t,o){const a=Math.floor(t/2)*2,r=Math.floor(o/2)*2,s=(t-a)/2,n=(o-r)/2,i=e(a,r),l=e(a+2,r),c=e(a,r+2),u=e(a+2,r+2);return s+n<=1?i+(l-i)*s+(c-i)*n:u+(c-u)*(1-s)+(l-u)*(1-n)}function Gl(e){const t=aa(e.route),o=new Rt;o.name="숲 층위 · 바람 풀";const a=new Map,r=new Map,s=new Map,n=new Map;let i=61103;const l=()=>(i=Math.imul(i,1664525)+1013904223>>>0)/4294967296,c=e.route,u=Math.min(...c.map(T=>T.x))-30,f=Math.max(...c.map(T=>T.x))+30,h=Math.min(...c.map(T=>T.z))-30,m=Math.max(...c.map(T=>T.z))+30,d=(T,B,$)=>{T.has(B)||T.set(B,[]),T.get(B).push($)},g=new Map,p=(T,B)=>{const $=(T+65536)*131072+(B+65536);let V=g.get($);return V===void 0&&(V=e.floorHeight(T,B),g.set($,V)),V},x=T=>`${Math.floor(T.gridX/12)},${Math.floor(T.gridZ/12)}`,v=[...e.status.sectionScenery?.sites??[],...e.status.interactionProps?.clearSites??[],...e.status.trailProps?.clearSites??[]],y=Bn(c),S=yn(c,{nearest:t,sites:v,water:y}),C=.35,D=T=>.8*T,W=[];let R=0;const k=Xi(e,c),M=k.stats;for(let T=h;T<m;T+=2)for(let B=u;B<f;B+=2){const $=B+l()*1.9,V=T+l()*1.9,Z=t($,V);if(Z.distance>30||Z.distance<Z.width/2+.65)continue;const tt=vi(c,$,V);if(Math.abs(tt.x)<11.4&&tt.z>-12.4&&tt.z<34.4){W.push({px:$,pz:V,x:B,z:T,h:Z});continue}if(v.some(ct=>Math.hypot($-ct.x,V-ct.z)<ct.supportRadius+1.4))continue;const Y=e.floorHeight($,V),nt={x:$,z:V,y:Y,gridX:B,gridZ:T,distance:Z.distance,yaw:l()*6.283,scale:.65+l()*.8};if(l()<.98*$a(Y)&&d(a,x(nt),nt),Z.distance>Z.width/2+1.4&&l()<.55*Ea(Y)){const ct=`${Math.floor($/24)},${Math.floor(V/24)}`;n.has(ct)||n.set(ct,[]);const _t=Math.min(1,(Z.distance-Z.width/2-1.4)/4),xt={x:$+l()*.6-.3,z:V+l()*.6-.3,yaw:l()*6.283,scale:(.8+l()*.95)*(.55+.45*_t),roll:l()};y.blocked(xt.x,xt.z,D(xt.scale))?R++:!S.blocked(xt.x,xt.z,D(xt.scale))&&k.fit(xt)&&n.get(ct).push(xt)}const mt=l(),pt=Ki(Y);if(Z.distance>Z.width/2+4.5&&Z.distance<30&&mt<.2*pt&&Y<605){const ct=l()<Ha(Y),_t=l(),xt=ct?_t<.55?"tree_small_02":"island_tree_01":_t<.75?"pine_tree_01":"pine_sapling_medium",Me=mt>=.13*pt,bo=`${xt}:${Math.floor($/96)},${Math.floor(V/96)}`;r.has(bo)||r.set(bo,{id:xt,kind:"tree",forestTint:11978901,placements:[],levels:[{url:`${xt}-lod1.glb`,distance:0},{url:`${xt}-lod2.glb`,distance:14}]}),r.get(bo).placements.push({x:$,z:V,scale:.65+l()*.3,yaw:nt.yaw,embed:.03,...Me?{dense:!0}:{}})}if(Y>470&&Z.distance>Z.width/2+7&&l()<.018){const ct="rock_face_02",_t=`${Math.floor($/48)},${Math.floor(V/48)}`;s.has(_t)||s.set(_t,{id:ct,kind:"rock",levels:[{url:`${ct}-lod2.glb`,distance:0}],placements:[]}),s.get(_t).placements.push({x:$,z:V,scale:Y>590?1+l()*.6:.5+l()*.45,stretch:Y>590?[1.1,2.2+l()*1.2,1.1]:void 0,yaw:nt.yaw,embed:.3})}}{let T=20261104;const B=()=>(T=Math.imul(T,1664525)+1013904223>>>0)/4294967296;for(const{px:$,pz:V,x:Z,z:tt,h:Y}of W){const nt=e.floorHeight($,V),mt=B()<.98*$a(nt),pt=B()*6.283,ct=.65+B()*.8;if(mt&&!S.entrance($,V,-1)&&d(a,`entrance:${x({gridX:Z,gridZ:tt})}`,{x:$,z:V,y:nt,gridX:Z,gridZ:tt,distance:Y.distance,yaw:pt,scale:ct}),Y.distance>Y.width/2+1.4&&B()<.55*Ea(nt)){const _t=Math.min(1,(Y.distance-Y.width/2-1.4)/4),xt={x:$+B()*.6-.3,z:V+B()*.6-.3,yaw:B()*6.283,scale:(.8+B()*.95)*(.55+.45*_t),roll:B()};if(!S.blocked(xt.x,xt.z,D(xt.scale))){const Me=`entrance:${Math.floor($/24)},${Math.floor(V/24)}`;n.has(Me)||n.set(Me,[]),n.get(Me).push(xt)}}}}const w=c.at(-1),A=e.status.summitFacilities?.sites??[];for(let T=0;T<Math.PI*2;T+=Math.PI/10){const B=24+l()*14,$=w.x+Math.sin(T)*B,V=w.z+Math.cos(T)*B,Z=t($,V),tt=e.floorHeight($,V);if(Z.distance<Z.width/2+13||tt<w.y-32||A.some(nt=>Math.hypot($-nt.x,V-nt.z)<nt.supportRadius+18))continue;const Y=`summit:${Math.floor($/48)},${Math.floor(V/48)}`;s.has(Y)||s.set(Y,{id:"rock_face_01",kind:"rock",levels:[{url:"rock_face_01-lod2.glb",distance:0}],placements:[]}),s.get(Y).placements.push({x:$,z:V,scale:1,stretch:[2.2,2+l()*.7,2.2],yaw:T,embed:.35})}for(const[T,B]of[[4,-12],[14,-22],[-2,-24]]){const $=w.x+T,V=w.z+B,Z=t($,V);if(Z.distance<Z.width/2+9||A.some(Y=>Math.hypot($-Y.x,V-Y.z)<Y.supportRadius+12))continue;const tt=`summit-front:${Math.floor($/48)},${Math.floor(V/48)}`;s.has(tt)||s.set(tt,{id:"rock_face_01",kind:"rock",levels:[{url:"rock_face_01-lod2.glb",distance:0}],placements:[]}),s.get(tt).placements.push({x:$,z:V,scale:1,stretch:[1.7,2.2,1.7],yaw:.3,embed:.2})}for(let T=h-150;T<m+150;T+=10)for(let B=u-150;B<f+150;B+=10){const $=B+l()*5,V=T+l()*5,Z=t($,V);if(Z.distance<30||Z.distance>180)continue;let tt;try{tt=e.floorHeight($,V)}catch{continue}if(!Number.isFinite(tt)||tt>590)continue;const Y=l()<Ha(tt)?"tree_small_02":"pine_tree_01",nt=`far:${Y}:${Math.floor($/96)},${Math.floor(V/96)}`;r.has(nt)||r.set(nt,{id:Y,kind:"tree",forestTint:11978901,levels:[{url:`${Y}-lod2.glb`,distance:0}],placements:[]}),r.get(nt).placements.push({x:$,z:V,scale:1+l()*.35,yaw:l()*6.283})}const z=[],F=9;for(let T=0;T<F;T++){const B=T*2.399,$=.12+T%4*.025,V=Math.cos(B),Z=Math.sin(B),tt=.25+T%3*.12+T%5*.015,Y=.029,nt=V*$,mt=Z*$,pt=nt+V*.07,ct=mt+Z*.07;z.push(nt-Z*Y,0,mt+V*Y,nt+Z*Y,0,mt-V*Y,pt-Z*Y*.6,tt*.55,ct+V*Y*.6,nt+Z*Y,0,mt-V*Y,pt+Z*Y*.6,tt*.55,ct-V*Y*.6,pt-Z*Y*.6,tt*.55,ct+V*Y*.6,pt-Z*Y*.6,tt*.55,ct+V*Y*.6,pt+Z*Y*.6,tt*.55,ct-V*Y*.6,nt+V*.2,tt,mt+Z*.2)}for(let T=0;T<3;T++){const B=T*2.399,$=Math.cos(B),V=Math.sin(B);for(let Z=1;Z<=2;Z++)for(const tt of[-1,1]){const Y=Z*.1,nt=.12+Z*.055,mt=$*Y,pt=V*Y,ct=mt+$*.07-V*.12*tt,_t=pt+V*.07+$*.12*tt;z.push(mt,nt,pt,ct,nt+.025,_t,mt+$*.1,nt+.025,pt+V*.1)}}const _=new bt;_.setAttribute("position",new st(z,3)),_.setAttribute("forestLeaf",new st(Array.from({length:z.length/3},(T,B)=>B>=F*9?1:0),1)),_.scale(.55,.42,.55),_.computeVertexNormals();const L=_.attributes.normal,I=new N;for(let T=0;T<L.count;T++)I.fromBufferAttribute(L,T).multiplyScalar(.25),I.y+=.75,I.normalize(),L.setXYZ(T,I.x,I.y,I.z);const O={value:0},H=new Wt({color:16777215,roughness:1,envMapIntensity:.35,side:Ct});H.onBeforeCompile=T=>{T.uniforms.forestTime=O,T.vertexShader=T.vertexShader.replace("#include <common>",`#include <common>
uniform float forestTime;
attribute float forestLeaf;
varying float grassHeight;`),T.vertexShader=T.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
   vec4 anchor=instanceMatrix*vec4(0.,0.,0.,1.);
   float tip=position.y*position.y;
   grassHeight=clamp(position.y/.227,0.,1.);
   transformed.x+=sin(forestTime*1.5+anchor.x*.08+anchor.z*.06)*tip*.85;
   transformed.z+=sin(forestTime*1.1+anchor.z*.07)*tip*.45;
   // 포기 수를 늘리지 않고 낮은 관목형 잎을 군락으로 섞는다.
   float understoryPatch=.5+.25*sin(anchor.x*.31)+.25*sin(anchor.z*.27);
   float fern=step(.78-understoryPatch*.35,fract(sin(anchor.x*12.9898+anchor.z*78.233)*43758.5453));
   transformed*=mix(1.,fern,forestLeaf);`),T.fragmentShader=T.fragmentShader.replace("#include <common>",`#include <common>
varying float grassHeight;`).replace("#include <color_fragment>",`#include <color_fragment>
diffuseColor.rgb*=mix(.62,1.12,grassHeight);`)},H.customProgramCacheKey=()=>"forest-blades-wind-v3-understory";const E=new ta,Q=new rt,U=[];let K=0,q=0;for(const T of a.values()){const B=Z=>Math.ceil(Z*ha.forestGrass),$=new ro(_,H,T.reduce((Z,tt)=>Z+B(tt.distance<=14?49:21),0));let V=0;for(let Z=0;Z<49;Z++)for(const tt of T){const Y=tt.distance<=14?7:3,nt=7*Y;if(Z>=B(nt))continue;const mt=Z*(nt===49?17:8)%nt,pt=tt.gridX+(mt%7+.15+l()*.7)*2/7,ct=tt.gridZ+(Math.floor(mt/7)+.15+l()*.7)*2/Y,_t=t(pt,ct);if(_t.distance<_t.width/2+.25)continue;if(y.blocked(pt,ct,C)){l(),l(),l(),q++;continue}if(S.blocked(pt,ct,C,_t)){l(),l(),l(),K++;continue}E.position.set(pt,Yo(p,pt,ct)+.012,ct),E.rotation.y=tt.yaw+mt,E.scale.setScalar(tt.scale*(.75+l()*.25)),E.updateMatrix(),$.setMatrixAt(V,E.matrix);const xt=.5+.25*Math.sin(pt*.11)+.25*Math.sin(ct*.09);Q.setHSL(.105+xt*.095,.22+l()*.13,.25+xt*.07+l()*.035,gt),$.setColorAt(V,Q),V++}if(!V){$.dispose();continue}$.count=V,$.userData.metricKind="하층 식생",$.receiveShadow=!0,$.computeBoundingBox(),$.computeBoundingSphere(),$.boundingBox.expandByScalar(.5),$.boundingSphere.radius+=.5,o.add($),U.push({mesh:$,box:$.boundingBox.clone(),count:V})}const b=Yi(),G=Es(),J=[],X=new Rt;X.name="덤불층 · 바람";const et=[8144432,9394742,7295284,8745538,5660730,6960168];for(const T of n.values()){if(!T.length)continue;const B=new ro(b,G,T.length);T.forEach(($,V)=>{E.position.set($.x,Yo(p,$.x,$.z)-.02,$.z),E.rotation.set(0,$.yaw,0),E.scale.set($.scale*(.85+$.roll*.3),$.scale*(.8+$.roll*7%1*.6),$.scale*(.85+$.roll*3%1*.3)),E.updateMatrix(),B.setMatrixAt(V,E.matrix);const Z=.5+.25*Math.sin($.x*.05+$.z*.03)+.25*Math.sin($.z*.07-$.x*.02),tt=Math.min(et.length-1,Math.floor((Z*.6+$.roll*.4)*et.length));B.setColorAt(V,Q.set(et[tt]).multiplyScalar(.85+$.roll*.3))}),B.userData.metricKind="하층 식생",B.receiveShadow=!0,B.computeBoundingBox(),B.computeBoundingSphere(),B.boundingBox.expandByScalar(1.5),B.boundingSphere.radius+=1.5,X.add(B),J.push({mesh:B,box:B.boundingBox.clone(),count:T.length})}e.group.add(o,X),Ba(o),Ba(X);const ot=Gi(),at=e.update.bind(e);return e.update=(T,B=2)=>{if(at(T,B),O.value=performance.now()/1e3,e.status.culling?.reused){ae.foliageTime.value=O.value;return}ot.update(T);let $=0;for(const Z of U){const{mesh:tt,box:Y,count:nt}=Z,mt=[20,30,40][B];tt.visible=ot.visible(Y,T,mt),tt.count=Math.min(nt,Math.ceil(nt/ha.forestGrass*[.22,.5,1][B]*En(Y.distanceToPoint(T.position),Ia[B],mt))),tt.visible&&($+=tt.count)}e.status.scenery.visibleGrass=$;let V=0;ae.foliageTime.value=O.value;for(const{mesh:Z,box:tt,count:Y}of J)Z.visible=ot.visible(tt,T,[22,34,48][B]),Z.count=Math.ceil(Y*[.3,.65,1][B]),Z.visible&&(V+=Z.count);e.status.scenery.visibleShrubs=V},e.status.scenery={forestCorridor:30,grassRadius:[20,30,40],grassFullRadius:Ia,grassDensityPerM2:[12.25,5.25],grassBlades:F,shrubs:J.reduce((T,B)=>T+B.count,0),shrubRadius:[22,34,48],denseTrees:[...r.values()].reduce((T,B)=>T+B.placements.filter($=>$.dense).length,0),zones:"forest-zones.js",grassChunkSize:12,pavedGrassCleared:K,waterGrassCleared:q,waterShrubsCleared:R,summitShrubs:M,grassInstances:U.reduce((T,B)=>T+B.count,0),trees:[...r.values()].reduce((T,B)=>T+B.placements.length,0),outcrops:[...s.values()].reduce((T,B)=>T+B.placements.length,0),speciesStatus:"임상도 미확보 · 구간별 활엽 비율(숲 75~80%, 능선 25%) 시각 대용",wind:!0,layers:["소나무·참나무류 교목 시각 대용","덤불층(1~3m)","관목","고사리·조릿대형 하층"],ground:"낙엽층 PBR + 이끼 군락 · 등산로 별도 재질 유지"},[...r.values(),...s.values()]}const qi=6,Zi=1.12;function Xi(e,t,{radius:o=45,eye:a=1.6,margin:r=.3}={}){const s=t.at(-1),n=e.status.summitFacilities?.sites?.find(f=>f.id==="marker"),i=[...t.filter(f=>Number.isFinite(f.s)&&Number.isFinite(s.s)&&s.s-f.s<=15),...n?[n]:[]].map(f=>({x:f.x,z:f.z,eye:e.floorHeight(f.x,f.z)+a})),l=Math.tan(qi*Math.PI/180),c={viewers:i.length,lowered:0,removed:0};function u(f,h){const m=e.floorHeight(f,h);let d=1/0;for(const g of i){const p=Math.hypot(f-g.x,h-g.z);p<o&&(d=Math.min(d,g.eye-p*l-r-m))}return d}return{viewers:i,maxTop:u,stats:c,fit(f){const h=u(f.x,f.z),m=Zi*(.8+f.roll*7%1*.6);if(m*f.scale<=h)return!0;const d=h/m;return d<.3?(c.removed++,!1):(f.scale=d,c.lowered++,!0)}}}function Yi(){const e=[],t=[];let o=7;const a=()=>(o=Math.imul(o,1664525)+1013904223>>>0)/4294967296;for(let i=0;i<5;i++){const l=i*1.256+a()*.4,c=Math.cos(l)*.35,u=Math.sin(l)*.35,f=.75+a()*.45,h=.012;e.push(-h,0,0,h,0,0,c,f,u),t.push(.35,.35,.5)}for(const[i,l,c,u,f,h]of[[0,26,.16,.48,.42,.16],[1,36,.42,.82,.5,.18],[2,26,.76,1.12,.38,.19]])for(let m=0;m<l;m++){const d=a()*6.283,g=f*(m%4===0?.2+a()*.5:.7+a()*.3),p=c+a()*(u-c),x=Math.cos(d)*g,v=Math.sin(d)*g,y=a()*6.283,S=.35+a()*.5,C=Math.cos(y)*h,D=Math.sin(y)*h,W=-Math.sin(y)*h*.55,R=Math.cos(y)*h*.55,k=S*h*.6,M=[x-C,p-k,v-D],w=[x+W,p+k*.4,v+R],A=[x+C,p+k,v+D],z=[x-W,p-k*.4,v-R];e.push(...M,...w,...A,...M,...A,...z);const F=.45+i*.17+a()*.15;for(let _=0;_<6;_++)t.push(F)}const r=new bt;r.setAttribute("position",new st(e,3)),r.setAttribute("shrubShade",new st(t,1)),r.computeVertexNormals();const s=r.attributes.normal,n=new N;for(let i=0;i<s.count;i++)n.fromBufferAttribute(s,i).multiplyScalar(.5),n.y+=.6,n.normalize(),s.setXYZ(i,n.x,n.y,n.z);return r}function Ul(e){const t=new Set;e.group.traverse(o=>{if(!o.isMesh||!o.material||t.has(o.material))return;const a=o.material;if(!String(a.customProgramCacheKey?.()).includes("gwanak-slope"))return;t.add(a);const r=a.onBeforeCompile,s=a.customProgramCacheKey();a.onBeforeCompile=function(n,...i){r.call(this,n,...i),n.fragmentShader=n.fragmentShader.replace("rock=max(rock,smoothstep(490.0,625.0,landWorld.y)*(.18+.65*outcrop));","rock=max(rock,smoothstep(490.0,625.0,landWorld.y)*(.78+.22*outcrop));"),n.fragmentShader=n.fragmentShader.replace("vec3 forestColor=groundColor.rgb*mottling;",`vec3 forestColor=groundColor.rgb*mottling;
    float mossPatch=smoothstep(.30,.72,.5+.25*sin(landWorld.x*.61)+.25*sin(landWorld.z*.47));
    float moss=mossPatch*(1.0-smoothstep(460.,600.,landWorld.y))*(1.0-rockCover)*.82;
    float litterPatch=.5+.25*sin(landWorld.x*2.7+sin(landWorld.z*1.9))+.25*sin(landWorld.z*3.1);
    float forestFloor=(1.0-smoothstep(490.,610.,landWorld.y))*(1.0-rockCover);
    // 저지대의 풀 포기 사이도 낙엽층으로 연결한다. 바위·정상은 기존 혼합 유지.
    vec3 leafBed=texture2D(land3D,landWorld.xz/1.6).rgb*vec3(.38,.30,.20);
    forestColor=mix(forestColor,leafBed,forestFloor*(.90+.08*litterPatch));
    // 밝은 모래색에 녹색만 곱하지 않고 저채도 이끼의 색·명도를 사용한다.
    vec3 mossBed=vec3(.055,.073,.028)*(.72+.56*litterPatch);
    forestColor=mix(forestColor,mossBed,moss*.68);`)},a.customProgramCacheKey=()=>s+"-moss-v2-leaf-bed",a.needsUpdate=!0})}const Ft={tile:16,step:.62,radius:[14,22,30],capacity:[1400,3800,7200],slopeMax:.24,heightMax:596,pathMargin:.02,reach:.32,near:.45,band:2};function Oa({landscape:e,geometry:t,farGeometry:o=t,material:a,scene:r,ground:s=null}){const n=s?null:e.route,i=s?null:aa(n),l=s?null:Bn(n),c=s?.heightMax??Ft.heightMax,u=s?.slopeMax??Ft.slopeMax,f=()=>[...e.status.sectionScenery?.sites??[],...e.status.interactionProps?.clearSites??[],...e.status.trailProps?.clearSites??[],...(e.status.summitFacilities?.sites??[]).map(M=>({x:M.x,z:M.z,supportRadius:M.supportRadius??3}))];let h=null;const m=Ft.capacity[2],d=(M,w)=>{const A=new ro(M,a,m);return A.name=w,A.count=0,A.frustumCulled=!1,A.receiveShadow=!0,A.castShadow=!1,A.userData.metricKind="하층 식생",A.userData.toonGroundCover="field",A.matrixAutoUpdate=!1,r.add(A),A},g=d(t,"카툰 풀밭"),p=d(o,"카툰 풀밭 · 먼 쪽"),x=new Map,v={tiles:0,clumps:0,clumpsNear:0,clumpsFar:0,rebuilds:0,radius:0,nearRadius:0},y=s?s.height:(M,w)=>Yo(e.floorHeight,M,w);function S(M,w){const z=(y(M+1.5,w)-y(M-1.5,w))/3,F=(y(M,w+1.5)-y(M,w-1.5))/(2*1.5);return 1-1/Math.sqrt(1+z*z+F*F)}function C(M,w){const A=`${M},${w}`;if(x.has(A))return x.get(A);s||(h??=yn(n,{nearest:i,sites:f(),water:l}));let z=(Math.imul(M,73856093)^Math.imul(w,19349663)^1540483477)>>>0;const F=()=>(z=Math.imul(z,1664525)+1013904223>>>0)/4294967296,_=Ft.tile,L=Ft.step,I=Math.round(_/L),O=[];for(let E=0;E<I;E++)for(let Q=0;Q<I;Q++){const U=M*_+(Q+.1+F()*.8)*L,K=w*_+(E+.1+F()*.8)*L,q=F()*6.283,b=.75+F()*.5,G=y(U,K);if(!(!Number.isFinite(G)||G>c)){if(s){if(s.blocked(U,K,Ft.reach))continue}else{const J=i(U,K);if(J.distance<J.width/2+Ft.pathMargin||h.blocked(U,K,Ft.reach))continue}S(U,K)>u||O.push(U,G-.02,K,q,b)}}const H=new Float32Array(O);return x.set(A,H),v.tiles=x.size,x.size>400&&x.delete(x.keys().next().value),H}const D=new ta;let W=null;function R(M,w=1){const A=Math.max(0,Math.min(2,w|0)),z=Ft.radius[A],F=Ft.capacity[A],_=M.position;if(W&&W.q===A&&Math.hypot(_.x-W.x,_.z-W.z)<3)return;W={x:_.x,z:_.z,q:A},v.radius=z;const L=z*Ft.near,I=Ft.band;v.nearRadius=L,a.userData.fieldUniforms&&(a.userData.fieldUniforms.tgFieldRadius.value=z);const O=Ft.tile,H=z+3,E=Math.floor((_.x-H)/O),Q=Math.floor((_.x+H)/O),U=Math.floor((_.z-H)/O),K=Math.floor((_.z+H)/O),q=[];for(let et=U;et<=K;et++)for(let ot=E;ot<=Q;ot++){const at=(ot+.5)*O-_.x,T=(et+.5)*O-_.z;Math.hypot(at,T)<H+O*.71&&q.push([Math.hypot(at,T),ot,et])}q.sort((et,ot)=>et[0]-ot[0]);let b=0,G=0;const J=g.instanceMatrix.array,X=p.instanceMatrix.array;for(const[,et,ot]of q){const at=C(et,ot);for(let T=0;T<at.length&&b+G<F;T+=5){const B=at[T]-_.x,$=at[T+2]-_.z,V=B*B+$*$;V>H*H||(D.position.set(at[T],at[T+1],at[T+2]),D.rotation.set(0,at[T+3],0),D.scale.setScalar(at[T+4]),D.updateMatrix(),V<L*L||V<(L+I)**2&&at[T+3]*157.3%1>(Math.sqrt(V)-L)/I?(D.matrix.toArray(J,b*16),b++):(D.matrix.toArray(X,G*16),G++))}if(b+G>=F)break}for(const[et,ot]of[[g,b],[p,G]]){et.count=ot;const at=et.instanceMatrix;at.clearUpdateRanges(),at.addUpdateRange(0,Math.max(1,ot)*16),at.needsUpdate=!0}v.clumps=b+G,v.clumpsNear=b,v.clumpsFar=G,v.rebuilds++}function k(){for(const M of[g,p])r.remove(M),M.dispose();x.clear()}return{mesh:g,meshFar:p,update:R,dispose:k,status:v}}const Oe={twTime:{value:0},twDeep:{value:new rt},twShallow:{value:new rt},twFoam:{value:new rt},twStreak:{value:new rt},twSparkle:{value:0},twGain:{value:1},twSun:{value:new N(0,1,0)},twOpacity:{value:j.stream.opacity}},fa=`
uniform float twTime,twSparkle,twOpacity,twGain;uniform vec3 twDeep,twShallow,twFoam,twStreak,twSun;
float twH(float n){n=fract(n*.1031);n*=n+33.33;n*=n+n;return fract(n);}
float twHash(vec2 p){p=fract(p*vec2(.1031,.1030));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.x);}
float twN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(twHash(i),twHash(i+vec2(1,0)),f.x),mix(twHash(i+vec2(0,1)),twHash(i+vec2(1,1)),f.x),f.y);}
// 픽셀 폭으로 부드럽게 끊는 계단(카툰 경계가 계단 무늬로 깨지지 않게).
float twStep(float e,float x){float w=max(fwidth(x),1e-4);return smoothstep(e-w,e+w,x);}
`,Qi=`
attribute vec2 aStream;attribute vec4 aFrame;
varying vec2 vS;varying vec3 vW;varying vec3 vV;
void main(){
 vS=aStream;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vV=cameraPosition-w.xyz;
 gl_Position=projectionMatrix*viewMatrix*w;
}`,Ji=`
${fa}
varying vec2 vS;varying vec3 vW;varying vec3 vV;
void main(){
 #ifdef TW_POND
 float across=vS.x*TW_SPAN;float halfW=TW_SPAN*(.9+.04*twN(vW.xz*.5));float dW=halfW-across;
 vec2 flow=vW.xz*vec2(1.,1.)+vec2(twTime*.08,-twTime*.05);float along=0.;
 vec2 curl=flow;float cut=1.;
 #else
 float across=vS.x*${Le.toFixed(2)};float along=vS.y;
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
 float lc=floor(along/${Gt.toFixed(1)}+.5);
 float lx=along-(lc*${Gt.toFixed(1)}+(twH(lc*2.3+7.)-.5)*5.);
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
}`;function Ga({pond:e=!1,span:t=5}={}){const o=new zt({name:e?"toon-pond":"toon-stream",uniforms:Oe,vertexShader:Qi,fragmentShader:Ji,transparent:!0,depthWrite:!1,side:Ct,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2,defines:e?{TW_POND:"",TW_SPAN:t.toFixed(2)}:{}});return o.extensions={derivatives:!0},o.userData.shared=!0,o.userData.toonWater=!0,o}const tl="varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",el=`
${fa}
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
}`;function ol(){const e=new zt({name:"toon-fall",uniforms:Oe,vertexShader:tl,fragmentShader:el,transparent:!0,depthWrite:!1,side:Ct});return e.extensions={derivatives:!0},e.userData.shared=!0,e.userData.toonWater=!0,e}const al=`
attribute vec3 aRing;varying vec3 vR;
void main(){vR=aRing;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,nl=`
${fa}
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
}`;let ue=null;function sl(){return ue||(ue=new zt({name:"toon-rock-ring",uniforms:Oe,vertexShader:al,fragmentShader:nl,transparent:!0,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),ue.extensions={derivatives:!0},ue.userData.shared=!0,ue.userData.toonWater=!0),ue}function rl(e){const t=e.attributes.position,o=e.attributes.aStream,a=e.attributes.aFrame,r=7,s=t.count/r;if(!s||!o)return null;const n=g=>o.getY(g*r+3),i=n(0),l=n(s-1),c=Math.min(i,l),u=Math.max(i,l),f=[],h=[],m=[];for(let g=Math.floor(c/Pe);g<=Math.floor(u/Pe);g++){const p=wn(g);if(!p||p.along<c||p.along>=u||Jt(p.along)>0)continue;let x=0,v=1/0;for(let _=0;_<s;_++){const L=Math.abs(n(_)-p.along);L<v&&(v=L,x=_)}const y=x*r+3,S=a.getX(y),C=a.getY(y),D=a.getZ(y),W=a.getW(y),R=t.getX(y)+D*p.across,k=t.getZ(y)+W*p.across,M=t.getY(y)+.012,w=p.radius*2+.25,A=p.radius*2+.25,z=p.radius*4.5+.3,F=f.length/3;for(const[_,L]of[[-w,-z],[w,-z],[w,A],[-w,A]])f.push(R+D*_-S*L,M,k+W*_-C*L),h.push(_,L,p.radius);m.push(F,F+1,F+2,F,F+2,F+3)}if(!f.length)return null;const d=new bt;return d.setAttribute("position",new st(f,3)),d.setAttribute("aRing",new st(h,3)),d.setIndex(m),d.computeBoundingSphere(),d}const Ua=30,il=`
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
}`,ll=`
uniform vec3 twFoam;uniform float twGain;varying float vA;varying float vMist;
void main(){vec2 c=gl_PointCoord-.5;float d=length(c);if(d>.5)discard;
 if(vMist>.5){gl_FragColor=vec4(twFoam*twGain,vA*smoothstep(.5,.1,d)*.8);return;}
 // 카툰 점: 안은 꽉 차고 가장자리 한 줄만 풀린다.
 float a=vA*(1.-smoothstep(.42,.5,d));gl_FragColor=vec4(twFoam*twGain*(1.-.12*smoothstep(.0,.45,d)),a*.85);}`,$n={...Oe,twPx:{value:600}};let Ze=null;function Va(){return Ze??=new zt({name:"toon-spray",uniforms:$n,vertexShader:il,fragmentShader:ll,transparent:!0,depthWrite:!1}),Ze.userData.shared=!0,Ze.userData.toonWater=!0,Ze}function cl(e){const t=e.attributes.position,o=Sn.length,a=Be*o,r=[],s=[];for(let i=0;i+a<=t.count;i+=a){const l=i+(Be-1)*o,c=Math.floor(o/2),u=t.getX(l+c)-t.getX(l-o+c),f=t.getZ(l+c)-t.getZ(l-o+c),h=Math.hypot(u,f)||1;for(let m=0;m<Ua;m++){const d=(m+.5)/Ua*(o-1),g=Math.min(o-2,Math.floor(d)),p=d-g,x=l+g,v=S=>{const C=Math.sin(i*7.1+m*13.3+S*3.7)*43758.5453;return C-Math.floor(C)},y=.35*v(5);r.push(t.getX(x)+(t.getX(x+1)-t.getX(x))*p+u/h*y,t.getY(x)+(t.getY(x+1)-t.getY(x))*p+.04,t.getZ(x)+(t.getZ(x+1)-t.getZ(x))*p+f/h*y),s.push(v(1),v(2),(v(3)-.5)*2,v(4))}}const n=new bt;return n.setAttribute("position",new st(r,3)),n.setAttribute("aSeed",new st(s,4)),n.computeBoundingSphere(),n.boundingSphere&&(n.boundingSphere.radius+=2),n}function fl(e,t=7,o=3){const a=e?.attributes?.position,r=e?.attributes?.aStream,s=e?.attributes?.aFrame;if(!a||!r||!s)return 0;const n=a.count/t;if(!Number.isInteger(n)||n<2)return 0;const i=Object.keys(e.attributes),l=Object.fromEntries(i.map(v=>[v,e.attributes[v]])),c=Object.fromEntries(i.map(v=>[v,[]])),u=v=>{for(const y of i){const S=l[y],C=S.itemSize;for(let D=0;D<t;D++)for(let W=0;W<C;W++)c[y].push(S.array[(v*t+D)*C+W])}},f=(v,y=o)=>a.getY(v*t+y),h=Array.from({length:n},(v,y)=>({x:a.getX(y*t+o),z:a.getZ(y*t+o)})),m=new Set;for(let v=0;v+1<n;v++){const y=r.getY((v+1)*t+o)-r.getY(v*t+o),S=f(v+1)-f(v);y<.05&&S>.05&&S>y*6&&m.add(v+1)}const d=new Map;for(const v of m){const{index:y}=kn(h,v-1);d.set(y+1,v)}let g=0,p=0;for(let v=0;v<n;v++){if(!d.has(v)){u(v),p++;continue}const y=d.get(v),S=y-1,C=f(y)-f(S),D=v-1,W=D>=0?Math.hypot(h[D].x-h[S].x,h[D].z-h[S].z):1/0,R=Mn(C,W),k=r.getY(y*t+o);for(let M=Be-1;M>=1;M--){const w=M/(Be-1),{out:A,drop:z}=ao(w);for(let F=0;F<t;F++){const _=y*t+F,L=s.getX(_),I=s.getY(_),O=f(S,F),H=D>=0&&W>1e-6?O+(f(D,F)-O)*Math.min(1,R/W):O;for(const E of i){const Q=l[E],U=Q.itemSize;if(E==="position")c[E].push(a.getX(_)+L*R*A,a.getY(_)+(H-a.getY(_))*z,a.getZ(_)+I*R*A);else if(E==="aStream")c[E].push(r.getX(_),k-R*A);else for(let K=0;K<U;K++)c[E].push(Q.array[_*U+K])}}p++}v=y-1,g++}if(!g)return 0;for(const v of i){const y=l[v];e.setAttribute(v,new st(c[v],y.itemSize,y.normalized))}const x=[];for(let v=1;v<p;v++){const y=v*t,S=y-t;for(let C=0;C<t-1;C++)x.push(S+C,S+C+1,y+C,S+C+1,y+C+1,y+C)}return e.setIndex(x),e.computeBoundingSphere(),e.computeBoundingBox?.(),g}function ja(e,t,o,a=3){const r=e?.attributes?.position,s=e?.attributes?.aFrame;if(!r)return!1;const n=r.count/t;if(n<3||!Number.isInteger(n))return!1;const i=[];for(let f=0;f<n;f++){const h=f*t+o;i.push([r.getX(h),r.getZ(h)])}const l=f=>{const h=i[Math.max(0,f-1)],m=i[Math.min(n-1,f+1)],d=h[0]-m[0],g=h[1]-m[1],p=Math.hypot(d,g)||1;return[d/p,g/p]},c=i.map((f,h)=>l(h)),u=c.map((f,h)=>{let m=0,d=0;for(let p=-a;p<=a;p++){const x=c[Math.min(n-1,Math.max(0,h+p))],v=1-Math.abs(p)/(a+1);m+=x[0]*v,d+=x[1]*v}const g=Math.hypot(m,d)||1;return[m/g,d/g]});for(let f=0;f<n;f++){const[h,m]=[c[f][1],-c[f][0]],[d,g]=[u[f][1],-u[f][0]];for(let p=0;p<t;p++){const x=f*t+p,v=r.getX(x)-i[f][0],y=r.getZ(x)-i[f][1],S=v*h+y*m;r.setX(x,i[f][0]+d*S),r.setZ(x,i[f][1]+g*S),s&&s.setXYZW(x,u[f][0],u[f][1],d,g)}}return r.needsUpdate=!0,s&&(s.needsUpdate=!0),e.computeBoundingSphere(),e.computeBoundingBox?.(),!0}function ul({materials:e}={}){const t={streams:0,ponds:0,falls:0,sprays:0,beds:0},o=Ga(),a=new Map,r=ol(),s=new rt().setRGB(...ga({}).bedRgb,gt).multiplyScalar(1/.1);let n=null;const i=u=>u?.customProgramCacheKey?.()??"";function l(u){if(!u.isMesh||Array.isArray(u.material))return!1;const f=u.material,h=i(f);if(f.userData?.fxWater){if(/-pond-/.test(h)){const d=Number(h.split("-pond-")[1]?.split("-")[0])||5;a.has(d)||a.set(d,Ga({pond:!0,span:d})),u.material=a.get(d),t.ponds++}else{if(u.material=o,t.streams++,!u.geometry.userData.toonSmoothed&&ja(u.geometry,7,3)&&(u.geometry.userData.toonSmoothed=!0,t.smoothed=(t.smoothed??0)+1),!u.geometry.userData.toonCurved){const g=fl(u.geometry,7,3);u.geometry.userData.toonCurved=!0,g&&(t.curvedLedges=(t.curvedLedges??0)+g)}const d=!u.userData.toonRings&&rl(u.geometry);if(d){const g=new At(d,sl());g.name="계곡 바위 물결",g.renderOrder=(u.renderOrder??0)+1,u.add(g),u.userData.toonRings=g,t.rings=(t.rings??0)+d.index.count/6}}return!0}if(/^fall-water-/.test(h)){if(u.material=r,t.falls++,!u.userData.toonSpray){const m=new so(cl(u.geometry),Va());m.name="계곡 물보라",m.renderOrder=4,m.frustumCulled=!0,u.add(m),u.userData.toonSpray=m,t.sprays++}return!0}return/^bed-rock-/.test(h)&&e?(n??=(e.rock??e.basic)(s,{vertexColors:!0},{cell:[1.8,1.4,1.8],amt:1.2,crack:0,moss:-.3}),u.material=n,t.beds++,!u.geometry.userData.toonSmoothed&&ja(u.geometry,9,4)&&(u.geometry.userData.toonSmoothed=!0),!0):!1}function c(u={},{sunVector:f=null,dt:h=0,pointScale:m=null,exposure:d=1}={}){const g=ga(u),p=Oe,x=(v,y)=>v.value.setRGB(...y,gt);return x(p.twDeep,g.deep),x(p.twShallow,g.shallow),x(p.twFoam,g.foam),x(p.twStreak,g.streak),p.twSparkle.value=g.sparkle,p.twOpacity.value=g.opacity,p.twTime.value+=h,p.twGain.value=1/Math.max(.05,d),f&&p.twSun.value.copy(f).normalize(),m&&($n.twPx.value=m),g}return{swap:l,update:c,status:t,materials:{stream:o,fall:r,get spray(){return Va()}}}}const dl=[34,16,34];function ml({mobile:e=!1}={}){const t=e?140:260,o=new Float32Array(t*4);let a=97;const r=()=>(a=Math.imul(a,1664525)+1013904223>>>0)/4294967296;for(let h=0;h<t;h++)o[h*4]=r(),o[h*4+1]=r(),o[h*4+2]=r(),o[h*4+3]=(h+.5)/t;const s=new bt;s.setAttribute("position",new st(new Float32Array(t*3),3)),s.setAttribute("aSeed",new st(o,4)),s.boundingSphere=new bs(new N,1e7);const n={uTime:{value:0},uCam:{value:new N},uBox:{value:new N(...dl)},uScale:{value:600},uLight:{value:1},uSpringHeight:{value:1},tsW:We.tsW},i=new zt({name:"toon-season-particles",transparent:!0,depthWrite:!1,fog:!1,uniforms:n,vertexShader:`
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
}`}),l=new so(s,i);l.name="계절 꽃잎·낙엽",l.frustumCulled=!1,l.renderOrder=2;const c={count:t,visible:!1};function u(h,m,{light:d=1}={}){const g=We.tsW.value,p=g.x+g.z>.01;l.visible=p,c.visible=p,!(!p||!m)&&(n.uTime.value+=Math.min(h,.1),n.uCam.value.copy(m.position),n.uLight.value=d,n.uSpringHeight.value=1-.65*Pt.smoothstep(m.position.y,250,450))}function f(h,m){n.uScale.value=h/(2*Math.tan(m*Math.PI/360))}return{points:l,update:u,resize:f,status:c,dispose(){s.dispose(),i.dispose()}}}async function Vl({renderer:e,scene:t,camera:o,mobile:a=!1,softAutumnDistance:r=!1}={}){const s=Qa(),n=Xs({gradientMap:s,softAutumnDistance:r}),i=Ur({gradientMap:s,uniforms:jt}),l=ul({materials:n.materialFactory}),c=(H,E)=>(H?.traverse?.(Q=>{i.swapGroundCover(Q),l.swap(Q)}),n.toonify(H,E)),u=xr(),f=e?Ar({renderer:e,scene:t,camera:o,mobile:a}):null,h=new rt,m={a:jt.toonWaveA.value.clone(),b:jt.toonWaveB.value.clone()},d={a:m.a.clone(),b:m.b.clone()},g=js(),p=ml({mobile:a});t?.add(p.points);const x={};let v="";const y=["stairs","deck_stairs"].map(H=>{const E=n.materialFactory.trail(H);return{m:E,base:E.color.clone()}}),S=on("#d9dde2");function C(){const H=We.tsW.value.toArray(),E=H.map(K=>K.toFixed(3)).join();if(E===v)return;v=E;const Q=n.materialFactory.terrain().userData.toonUniforms,U={meadow:"tMeadow",meadowFar:"tMeadowFar",forest:"tForest",highForest:"tHigh"};for(const[K,q]of Object.entries(U))x[K]??=Q[q].value.clone(),To(Q[q].value,x[K],Object.fromEntries(["spring","autumn","winter"].map(b=>[b,Us[b][K]])),H);To(d.a,m.a,{spring:re.spring[0],autumn:re.autumn[0],winter:re.winter[0]},H),To(d.b,m.b,{spring:re.spring[1],autumn:re.autumn[1],winter:re.winter[1]},H);for(const K of y)K.m.color.copy(K.base).lerp(S,.45*H[3])}let D=null,W=null;function R(H){if(D||!H?.floorHeight||!t)return D;{const E=n.materialFactory.terrain(),Q=E.onBeforeCompile,U=E.customProgramCacheKey.bind(E),K=j.terrainContactAO;E.onBeforeCompile=function(q,b){Q.call(this,q,b),q.fragmentShader=q.fragmentShader.replace("reflectedLight.directDiffuse*=contactAO;",`reflectedLight.directDiffuse*=mix(1.,contactAO,${K.direct.toFixed(2)});`).replace("reflectedLight.indirectDiffuse*=contactAO;",`reflectedLight.indirectDiffuse*=mix(1.,contactAO,${K.indirect.toFixed(2)});`)},E.customProgramCacheKey=()=>`${U()}|toon-contact-soft`}return D=Oa({landscape:H,geometry:i.geometries.grass.field,farGeometry:i.geometries.grass.fieldFar,material:i.materials.grassField,scene:t}),F.grassField=D.status,D}function k(H){return D||!H?.height||!t||(D=Oa({ground:H,geometry:i.geometries.grass.field,farGeometry:i.geometries.grass.fieldFar,material:i.materials.grassField,scene:t}),F.grassField=D.status),D}let M=null,w=globalThis.performance?.now?.()??0,A=w;const z=new N(0,1,0),F={style:"toon",gradient:[...j.gradient],materials:n.status,nature:i.status,water:l.status,city:u.status,pipeline:f?.status??null,sky:{created:!1},phase:null};function _(){return M||(M=tr({radius:Math.min(2e4,(o?.far??3e4)*.66)}),t?.add(M.mesh),F.sky.created=!0),M.mesh}function L(H,E,Q){M||_();const U=globalThis.performance?.now?.()??0,K=Math.min(.5,Math.max(0,(U-w)/1e3));w=U,E&&z.copy(E);const q=M.update(H,E,Q,K,e?.toneMappingExposure??1);return F.sky.stars=q.stars,t?.background?.isColor&&t.background.setRGB(...q.horizon,gt),q}let I=globalThis.performance?.now?.()??0;const O=H=>{{const U=globalThis.performance?.now?.()??0,K=Math.min(.5,Math.max(0,(U-I)/1e3));I=U,g.update(K),C(),F.season={name:g.name,weights:g.weights,particles:p.status.visible};const q=Lt(H),b=e?.domElement?.height??800;p.resize(b,o?.fov??60),p.update(K,o,{light:q.day+q.sunset*.6+q.night*.22})}const E=As(H);jt.toonWaveSpeed.value=E.speed,jt.toonWaveStrength.value=E.strength;{const U=q=>q.day+q.sunset*j.foliage.sunsetDim+q.night*j.foliage.nightDim,K=U(Lt(H));jt.toonWaveA.value.copy(d.a).multiplyScalar(K),jt.toonWaveB.value.copy(d.b).multiplyScalar(K)}u.update(H,o,f?.status.quality??2);const Q=F.phase=Lt(H);{const U=globalThis.performance?.now?.()??0,K=Math.min(.5,Math.max(0,(U-A)/1e3));A=U;const q=e?.domElement?.height??800,b=(o?.fov??60)*Math.PI/180;l.update(H,{sunVector:z,dt:K,pointScale:q/(2*Math.tan(b/2)),exposure:e?.toneMappingExposure??1})}if(D&&o&&D.update(o,f?.status.quality??1),W===null&&t&&(W=!1,t.traverse(U=>{!W&&U.name==="빛줄기"&&U.material?.uniforms?.fxStrength&&(W=U,U.material.uniforms.fxStrength.value*=j.lightShafts)})),t?.fog&&Q.day>0&&Po.fog_fragment.includes("fogNear")){const U=j.terrain;h.setRGB(...ft(U.haze),gt),t.fog.color.lerp(h,Q.day*(1-(H.gray??0)*.6)),t.fog.near+=U.hazeDensity*Q.day}if(t?.fog&&Q.sunset>0&&Po.fog_fragment.includes("fogNear")){const U=j.sunsetHaze;h.setRGB(...ft(U.color),gt),t.fog.color.lerp(h,Q.sunset*(1-(H.gray??0)*.6)),t.fog.near+=U.density*Q.sunset}return f?.update(H)??F};return{materialFactory:n.materialFactory,toonify:c,natureParts:i.natureParts,attachLandscape:R,attachGround:k,nature:i,patchFoliage:n.patchFoliage,createSky:_,updateSky:L,exposureFor:Cs,lightScale:Ds,styleCity:u.styleCity,setSeason(H,{instant:E=!1}={}){const Q=g.set(H);return Q&&E&&g.snap(),Q},get season(){return g.name},styleNightLighting(H){const E=H?.getObjectByName?.("가로등 기둥");return E&&(E.material=n.materialFactory.basic(new rt(j.lampPole))),!!E},pipeline:f&&{resize:f.resize,update:O,render:f.render,dispose:f.dispose,composer:f.composer,passes:f.passes,status:f.status},status:F,dispose(){p.dispose(),D?.dispose(),f?.dispose(),M?.dispose(),s.dispose()}}}const ua=Object.freeze({radius:56,deadZone:.2,releaseZone:.14,cardinalHalfDeg:28,diagonalHalfDeg:17,holdDeg:8,margin:12}),Lo=Object.freeze([[0,1,0],[45,1,1],[90,0,1],[135,-1,1],[180,-1,0],[-135,-1,-1],[-90,0,-1],[-45,1,-1]].map(([e,t,o])=>Object.freeze({deg:e,forward:t,side:o,key:`${t},${o}`}))),Xe=e=>(e+540)%360-180,hl=(e,t)=>Math.atan2(e,-t)*180/Math.PI;function jl(e,t,o=null,a=ua){if(Math.hypot(e,t)/a.radius<(o?a.releaseZone:a.deadZone))return null;const s=hl(e,t),n=l=>l.forward&&l.side?a.diagonalHalfDeg:a.cardinalHalfDeg,i=Lo.find(l=>l.key===o);return i&&Math.abs(Xe(s-i.deg))<=n(i)+a.holdDeg?i:Lo.find(l=>Math.abs(Xe(s-l.deg))<=n(l))||Lo.reduce((l,c)=>Math.abs(Xe(s-c.deg))<Math.abs(Xe(s-l.deg))?c:l)}function Kl(e,t,o,a,r=ua.radius){let s=o-e,n=a-t;const i=Math.hypot(s,n);if(i>r){const l=(i-r)/i;e+=s*l,t+=n*l,s=o-e,n=a-t}return{cx:e,cy:t,dx:s,dy:n}}const ql=(e,t,o,a,r=ua)=>{const s=r.radius+r.margin;return{x:Math.min(Math.max(e,s),Math.max(s,o-s)),y:Math.min(Math.max(t,s),Math.max(s,a-s))}};export{Zr as $,Ws as A,gn as B,ql as C,Pi as D,li as E,Sl as F,uo as G,bl as H,Wi as I,wl as J,Ei as K,wt as L,Bn as M,vl as N,Ba as O,Oi as P,Ot as Q,Ha as R,ua as S,xn as T,Gi as U,Fl as V,It as W,Ll as X,Dl as Y,Bl as Z,mn as _,Ie as a,qr as a0,Pl as a1,Cl as a2,Il as a3,kt as a4,$l as a5,ae as a6,Ol as a7,Ml as a8,El as a9,Li as aa,_n as ab,Wl as ac,Ri as ad,to as ae,Al as b,Vl as c,xl as d,zl as e,Gl as f,yl as g,mo as h,aa as i,Ut as j,Bi as k,Kr as l,Ul as m,Hl as n,Nl as o,Zo as p,Ro as q,_l as r,Rl as s,Tl as t,Aa as u,fi as v,Nn as w,kl as x,Kl as y,jl as z};
//# sourceMappingURL=joystick-BV7kCJ_o.js.map
