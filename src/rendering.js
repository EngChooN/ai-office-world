// 온라인 등산 그리기 설정: 빛(해·반구광)·그림자·연무·시간/날씨 반영·강수·빛줄기. 하늘·후처리(외곽선·블룸·색보정)는 카툰 모듈(toon)이 맡는다.
// 2026-11-19: 11-06에 화면에서 뺀 실사 모드의 남은 코드(Preetham 하늘·환경광 굽기·SSAO·실사 블룸/색보정·MeshBasic 감광·노출 보정)를 지움.
import * as THREE from 'three';
import {BLOOM} from './mood-config.js';
import {LOOK_PROFILE,SUN_PRESETS,sunDirection,HAZE_FRAGMENT} from './look-profile.js';
import {createEnvironment} from './environment.js';
import {createPrecipitation} from './precipitation.js';
import {setWeatherSound} from './ambient-config.js';
import {installEnvironmentHud} from './hud.js';
import {INDIRECT_PROFILE} from './indirect-light.js';
import {installRenderBreakdown} from './render-breakdown.js';
import {warmRenderingPaths} from './rendering-preparation.js';
import {createAOProfiler} from './ao-profiler.js';
import {updateLightFx,createLightShafts,canopyAt,LIGHT_FX} from './light-fx.js';

// 블룸 밝기 추출 단계에 밝기 상한(BLOOM.cap)과 부드러운 문턱(BLOOM.knee)을 둔다. NaN·무한대 픽셀도 0으로 지운다.
// 상한이 없으면 가로등 전구·갓 밑처럼 점광원 바로 옆 면이 보이는 순간 블룸이 화면 전체로 번쩍인다.
export function capBloomInput(bloom,{cap=BLOOM.cap,knee=BLOOM.knee}={}){
 const m=bloom.materialHighPassFilter,anchor='vec4 texel = texture2D( tDiffuse, vUv );';
 if(!m.fragmentShader.includes(anchor))return false;
 m.defines={...m.defines,BLOOM_CAP:cap.toFixed(3)};
 m.fragmentShader=m.fragmentShader.replace(anchor,`${anchor}\n\t\t\tif(any(isnan(texel))||any(isinf(texel)))texel=vec4(0.);\n\t\t\ttexel.rgb*=min(1.,BLOOM_CAP/max(luminance(texel.rgb),1e-4));`);
 bloom.highPassUniforms.smoothWidth.value=knee;m.needsUpdate=true;return true;
}
// toon = src/toon/index.js의 createToonStyle 결과(하늘·후처리 pipeline). 없으면 그릴 수 없다(실사 모드는 없음).
export function setupRendering(renderer,scene,camera,mobile,{toon}={}){
  if(!toon?.pipeline)throw new Error('카툰 후처리(toon.pipeline)가 필요합니다');
  const parameters=new URLSearchParams(location.search);
  const profiler=createAOProfiler(renderer,parameters.get('aoProfile')==='1'); // 이름은 예전 그대로: 기본 장면 그리기 시간 재기(?aoProfile=1)
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const comparison=parameters.get('tone')==='aces';
  renderer.toneMapping=comparison?THREE.ACESFilmicToneMapping:THREE.NeutralToneMapping;
  renderer.toneMappingExposure=1;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  THREE.ShaderChunk.fog_vertex=`#ifdef USE_FOG\n vFogDepth=length(mvPosition.xyz);\n#endif`;
  THREE.ShaderChunk.fog_fragment=HAZE_FRAGMENT;
  // 기본은 서울 현재 시각의 태양이다(daytime.js). ?time=HH:MM 수동 지정, ?sun=am|pm 은 예전처럼 고정 태양.
  const sunPreset=SUN_PRESETS[parameters.get('sun')]??SUN_PRESETS.am,sunDir=sunDirection(SUN_PRESETS.am.elevation,SUN_PRESETS.am.azimuth);
  const environment=createEnvironment({search:location.search}),precipitation=createPrecipitation();scene.add(precipitation.group);
  environment.weather.start();installEnvironmentHud();
  const ENV_GRAY_CUT=+(parameters.get('envcut')??.7),HEMI_GRAY_BOOST=+(parameters.get('hemiboost')??2);
  const base={environmentIntensity:.3,hemisphereIntensity:INDIRECT_PROFILE.hemisphereIntensity,exposure:1},clock={last:performance.now(),elapsed:0};
  const sunVector=new THREE.Vector3(),moonVector=new THREE.Vector3(),tmpColor=new THREE.Color();
  scene.background=new THREE.Color(LOOK_PROFILE.horizon);
  scene.fog=new THREE.Fog(LOOK_PROFILE.haze,0,LOOK_PROFILE.far);
  const sun=new THREE.DirectionalLight(LOOK_PROFILE.sunColor,4);
  const groundFill=new THREE.HemisphereLight(INDIRECT_PROFILE.skyColor,INDIRECT_PROFILE.groundColor,INDIRECT_PROFILE.hemisphereIntensity);scene.add(groundFill);
  const solarOffset=new THREE.Vector3().fromArray(sunDir).multiplyScalar(80);
  const sky=toon.createSky();
  // 나뭇잎 사이로 새는 빛줄기(볼륨 빛 카드). 바닥 그림자 얼룩·계곡 물 uniform은 light-fx.js가 함께 갱신한다.
  const shafts=createLightShafts({mobile});scene.add(shafts.mesh);globalThis.__lightFx={shafts,LIGHT_FX}; // 화면 조정·검증용
  sun.castShadow=true;sun.shadow.bias=-.001;sun.shadow.normalBias=.12;sun.shadow.radius=2;
  Object.assign(sun.shadow.camera,{left:-28,right:28,top:28,bottom:-28,near:1,far:140});
  scene.add(sun,sun.target);
  const status={indirectLight:{...INDIRECT_PROFILE},profile:LOOK_PROFILE.id,toneMapping:comparison?'ACES Filmic (비교용)':'Neutral',sunPreset:sunPreset.label,sunElevation:sunPreset.elevation,sunAzimuth:sunPreset.azimuth,shadowAzimuth:(sunPreset.azimuth+180)%360,shadowLengthPerHeight:1/Math.tan(sunPreset.elevation*Math.PI/180),sunColor:LOOK_PROFILE.sunColor,hazeColor:LOOK_PROFILE.haze,skyZenith:LOOK_PROFILE.zenith,far:LOOK_PROFILE.far,hdri:'로딩 중',ao:false,shadows:false,shaderErrors:[],calibration:{calibrated:false}};
  renderer.debug.onShaderError=(gl,program,vs,fs)=>{
    const source=gl.getShaderSource(fs)??'';
    const name=source.match(/#define SHADER_NAME\s+(\S+)/)?.[1]??'알 수 없는 재질';
    const hook=source.includes('gAtmosphereView')?'대기 감쇠':source.includes('landWorld')?'지형 혼합':'기본/override';
    status.shaderErrors.push([`${name} / ${hook}`,gl.getProgramInfoLog(program),gl.getShaderInfoLog(vs),gl.getShaderInfoLog(fs)].filter(Boolean).join('\n'));
  };
  // 카툰은 환경광(IBL)을 굽지 않는다(툰 음영). 하늘·후처리는 toon이 맡는다.
  const environmentReady=Promise.resolve().then(()=>{scene.environment=null;status.hdri='카툰: 환경광 굽기 없음(툰 음영)';status.toon=toon.status;});
  let current=-1,lastResize=null;
  function resize(quality,width,height,dpr,adaptive={}){
    lastResize=[quality,width,height,dpr,{...adaptive}];
    toon.pipeline.resize(quality,width,height,dpr);status.mood=true;status.ao=false;status.normalPass=false;status.shadows=true;
    renderer.shadowMap.enabled=true;sun.castShadow=true;
    const distance=adaptive.shadowDistance??[30,45,60][quality];status.shadowDistance=distance;const half=distance/2;
    Object.assign(sun.shadow.camera,{left:-half,right:half,top:half,bottom:-half});sun.shadow.camera.updateProjectionMatrix();
    if(current!==quality){sun.shadow.map?.dispose();sun.shadow.map=null;const size=quality===2&&!mobile?2048:1024;sun.shadow.mapSize.set(size,size);current=quality;}
  }
  renderer.info.autoReset=false;
  const breakdown=installRenderBreakdown(renderer);
  const direction=(elevation,azimuth,target)=>target.fromArray(sunDirection(elevation,azimuth));
  // 시각·날씨 → 방향광·하늘·연무·노출·입자·소리. 낮 맑음 기준값에 배율·색만 곱하므로 맑은 낮은 예전과 같다.
  function applyEnvironment(){
    const now=performance.now(),dt=(now-clock.last)/1000;clock.last=now;clock.elapsed+=Math.min(dt,.5);
    const e=environment.update(dt),ground=Math.max(0,Math.min(1,e.light.elevation/6));
    direction(e.light.elevation,e.light.azimuth,solarOffset).multiplyScalar(80);
    sun.color.setRGB(...e.light.color,THREE.SRGBColorSpace);sun.intensity=4*e.light.intensity;
    // 구워 둔 환경광(IBL)은 맑은 낮의 푸른 하늘색이라 색을 바꿀 수 없다. 흐림·비·안개에서는 그 몫을 줄이고 중성 반구광이 대신 채운다.
    scene.environmentIntensity=base.environmentIntensity*e.ambient*(1-ENV_GRAY_CUT*e.neutral);groundFill.intensity=base.hemisphereIntensity*e.ambient*(1+HEMI_GRAY_BOOST*e.neutral);groundFill.color.setRGB(...e.hemiColor,THREE.SRGBColorSpace);
    renderer.toneMappingExposure=base.exposure*e.exposureMul*(toon.exposureFor?.(e)??1);
    scene.fog.color.setRGB(...e.fogColor,THREE.SRGBColorSpace);scene.background.setRGB(...e.horizon,THREE.SRGBColorSpace);
    // 카툰 밤: 노출은 1 근처로 두고(블룸 문턱이 하늘·도심 빛무리를 번지게 하지 않게) 빛·연무만 어둡게 해 숲·산을 실루엣으로.
    if(toon.lightScale){const k=toon.lightScale(e);sun.intensity*=k;groundFill.intensity*=k;scene.environmentIntensity*=k;scene.fog.color.multiplyScalar(k);}
    // 맑은 날(15km) 기준 대비 얼마나 더 뿌연가. fog.near 칸에 감쇠 계수(1/m)를 실어 셰이더가 읽는다.
    scene.fog.near=Number.isFinite(e.fogDistance)?Math.max(0,3/e.fogDistance-3/15000):0;
    direction(e.elevation,e.azimuth,sunVector);direction(e.moon.elevation,e.moon.azimuth,moonVector);
    // 카툰: 하늘·색보정·블룸은 툰 모듈이 시간대에 맞춰 바꾼다. 도시·나무의 밤 밝기도 툰 재질이 직접 맡는다(MeshBasic 일괄 감광 없음).
    toon.updateSky(e,sunVector,moonVector);status.toonPhase=toon.pipeline.update(e)?.phase??null;
    {const fx=updateLightFx({time:clock.elapsed,sunVector,environment:e,quality:Math.max(0,current),mobile});shafts.update({camera,sunColor:e.light.color,quality:Math.max(0,current),canopy:canopyAt(camera.position.y),lowSun:fx.direct?Math.max(0,Math.min(1,(38-e.elevation)/32)):0});status.lightFx={direct:fx.direct,shafts:shafts.mesh.visible,count:shafts.mesh.geometry.instanceCount};}
    precipitation.update({time:clock.elapsed,camera,rain:e.rain,snow:e.snow,wind:e.windSpeed,viewHeight:renderer.domElement.height||900,fov:camera.fov});
    setWeatherSound({wind:e.windSound,rain:e.rain});
    status.environment={time:environment.info.timeLabel,legacySun:environment.info.legacySun,manualTime:environment.info.manualTime,weather:environment.info.kind,level:environment.info.level,source:environment.info.source,error:environment.weather.state.error,calls:environment.weather.state.calls,rain:e.rain,snow:e.snow,fogDistance:e.fogDistance,fogDensity:scene.fog.near,night:e.night,lightIntensity:e.light.intensity,ambient:e.ambient,exposure:renderer.toneMappingExposure,windSound:e.windSound,windSpeed:e.windSpeed,cloud:e.cloud,stars:e.stars,moon:e.moon,light:{elevation:e.light.elevation,azimuth:e.light.azimuth}};
  }
  // 쌍안경 중에는 그림자 상자를 보는 쪽 앞으로 옮긴다(뒤쪽 절반이 화면 밖이라 낭비됨). null이면 카메라 중심.
  let shadowFocus=null;const setShadowFocus=v=>{shadowFocus=v||null;status.shadowFocus=!!shadowFocus;};
  function render(position){
    applyEnvironment();
    renderer.info.reset();
    breakdown.reset();
    // 카메라 주변 30~60m 폭. 갱신 간격은 화질 비교 전까지 매 프레임 유지한다.
    const focus=shadowFocus??camera.position;sun.target.position.copy(focus);sun.position.copy(focus).add(solarOffset);sky.position.copy(camera.position);
    const solarDirection=new THREE.Vector3().subVectors(sun.position,sun.target.position).normalize();
    status.sunElevation=THREE.MathUtils.radToDeg(Math.asin(solarDirection.y));status.sunAzimuth=(THREE.MathUtils.radToDeg(Math.atan2(solarDirection.x,-solarDirection.z))+360)%360;
    profiler.poll();
    {const now=performance.now();profiler.measure('기본 장면',()=>toon.pipeline.render(Math.min(.1,(now-(clock.renderAt??now))/1000)));clock.renderAt=now;}
    status.aoProfile=profiler.status;
    status.breakdown=breakdown.snapshot();
    const submitted=Object.values(status.breakdown).reduce((sum,row)=>({triangles:sum.triangles+row.triangles,drawCalls:sum.drawCalls+row.drawCalls}),{triangles:0,drawCalls:0});
    // Sprite 등 renderBufferDirect를 거치지 않는 제출도 합계에서 빠뜨리지 않는다.
    status.breakdown['기타/직접 제출 외']={kind:'기타',pass:'직접 제출 외',triangles:renderer.info.render.triangles-submitted.triangles,drawCalls:renderer.info.render.calls-submitted.drawCalls};
  }
  async function prepare(){
    status.compiling=true;status.compileError=null;
    try{
      // compileAsync 내부의 동기 순회를 보행 전에만 수행한다.
      const selected=lastResize;
      await warmRenderingPaths({mobile,
        apply:(quality,enableAO)=>resize(quality,selected[1],selected[2],selected[3],{ao:enableAO}),
        compile:compileScene,
        render:()=>render(camera.position),
        restore:()=>resize(...selected)
      });
      render(camera.position);
      status.compileCount=(status.compileCount??0)+1;
    }catch(error){status.compileError=error.message;throw error;}
    finally{status.compiling=false;}
  }
  // 셰이더 미리 준비. 카툰은 RenderPass가 합성기 버퍼(렌더 타깃)에 그려 출력 색공간·톤매핑이 화면과 다른 셰이더 변형을 쓴다.
  // 그 타깃을 걸어 둔 채 compileAsync를 불러야 실제로 쓸 변형이 컴파일된다(compile 순회는 호출 안에서 동기로 끝난다). 2026-11-06.
  function compileScene(){
    const target=toon.pipeline.composer?.readBuffer??null,previous=renderer.getRenderTarget();
    if(target)renderer.setRenderTarget(target);
    try{return renderer.compileAsync(scene,camera);}finally{if(target)renderer.setRenderTarget(previous);}
  }
  return {resize,render,prepare,compile:compileScene,status,environment,environmentReady,setShadowFocus,style:'toon'};
}

// 카메라 근평면 네 모서리와 중앙에서 충돌을 검사해 지형·계단 앞쪽으로 당긴다.
export function retractCamera(target,desired,objects,camera){
  const delta=new THREE.Vector3().subVectors(desired,target),length=delta.length();
  if(length<1e-6)return desired.clone();
  const direction=delta.normalize(),right=new THREE.Vector3().crossVectors(direction,camera.up).normalize();
  const up=new THREE.Vector3().crossVectors(right,direction).normalize();
  const halfHeight=Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.near+.08,halfWidth=halfHeight*camera.aspect;
  const ray=new THREE.Raycaster();let distance=length;
  for(const [u,v]of [[0,0],[-1,-1],[-1,1],[1,-1],[1,1]]){
    const offset=right.clone().multiplyScalar(u*halfWidth).addScaledVector(up,v*halfHeight);
    ray.set(target.clone().add(offset),direction);ray.far=length+.25;
    const hit=ray.intersectObjects(objects,true)[0];if(hit)distance=Math.min(distance,Math.max(0,hit.distance-.25));
  }
  return target.clone().addScaledVector(direction,distance);
}
