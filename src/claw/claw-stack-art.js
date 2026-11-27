// 새 기계 ① 불빛 쌓기 「별빛 탑」 정식 꾸밈(월드아트, 2026-11-27). 몸·불빛 판·단추·경품 받침은 월드공통개발 claw-stack.js(buildStackMachine) 그대로 두고 위에 더한다.
// 더하는 것(모두 그림만, 판정·치수·카메라·자리 안 바꿈):
//  ① 꼭대기 큰 별(멀리서도 「별빛 탑」으로 보이게, 불빛 상태를 따라 빛남) ② 판 뒤 밤하늘 판(작은 별·별자리 줄, 캔버스 1장)
//  ③ 판 양옆 줄 불(11줄 = 판 줄마다 하나, 7줄·11줄은 큰 금 불) ④ 7줄·11줄 경품 받침 앞 「7줄」·「11줄」 작은 이름표(캔버스 1장을 둘이 나눠 씀)
//  ⑤ 판 테 아래 받침 기둥을 별 계단 모양 기둥으로(쌓기 느낌)
// 쓰는 법: const g=buildStackMachine(M,{toonify}); dressStackMachine(g,{toonify}); — update(dt)·setLights는 원래 것을 감싸 같이 돈다.
// 실제 오락실 상표·로고는 쓰지 않는다.
import * as THREE from 'three';
import {CLAW,machineKit} from './claw-machine-art.js';
import {STACK} from './claw-stack.js';
import {CLAW_TUNING} from './claw-rules.js';

const {builder,std,FONT,canvasTex,machineLine,findMat}=machineKit;

// 간판 종류 그림(쌓인 빛 칸) — claw-machine-art.js kindGlyph 'stack'과 같은 모양(이미 있음). 참고용으로 둠
export const STACK_DRESS=Object.freeze({starY:.13,starR:.13,lampR:.011});

function starShape(R,r,n=5){const s=new THREE.Shape();for(let k=0;k<n*2;k++){const a=Math.PI/2+k*Math.PI/n,rad=k%2?r:R,x=Math.cos(a)*rad,y=Math.sin(a)*rad;k?s.lineTo(x,y):s.moveTo(x,y);}s.closePath();return s;}

export function dressStackMachine(root,{toonify=null}={}){
 const U=root.userData;if(!U||U.kind!=='stack'||U.dressed)return root;
 const M=U.machine,C=CLAW,W=C.width,D=C.depth,hw=W/2,hd=D/2,S=STACK,cell=S.cell,BW=cell*S.cols,BH=cell*S.rows,bx=S.boardX,by=S.boardY,bz=S.boardZ,mid=CLAW_TUNING.stack.mid;
 const g=new THREE.Group();g.name='별빛 탑 꾸밈';root.add(g);
 const mats={gold:std('#f5c33b',{roughness:.35,metalness:.35,emissive:new THREE.Color('#f5a623'),emissiveIntensity:.35}),dark:std(M.bodyDark),trim:std(M.trim),
  lampA:std(M.light,{emissive:new THREE.Color(M.light),emissiveIntensity:.8}),lampB:std(M.accent,{emissive:new THREE.Color(M.accent),emissiveIntensity:.8})};
 // ② 판 뒤 밤하늘(뒷벽 앞 1cm): 남색 바탕 + 작은 별 + 별자리 선. 빛 계산 없는 판(밝기 고정)
 const sky=canvasTex(256,320,(c,w,h)=>{const gr=c.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#1a1440');gr.addColorStop(1,'#2d2163');c.fillStyle=gr;c.fillRect(0,0,w,h);
  let a=7;const rnd=()=>{a=(a*16807)%2147483647;return a/2147483647;};
  for(let k=0;k<90;k++){const x=rnd()*w,y=rnd()*h,s=rnd()<.12?2.2:1;c.globalAlpha=.4+rnd()*.6;c.fillStyle=rnd()<.2?'#ffe14d':'#e8f6ff';c.beginPath();c.arc(x,y,s,0,7);c.fill();}
  c.globalAlpha=.45;c.strokeStyle='#9fd8ff';c.lineWidth=1.5;const P=[[30,40],[70,70],[52,120],[96,150],[210,60],[226,110],[190,140],[40,250],[80,280],[200,260],[230,300]];
  for(const [i,j] of [[0,1],[1,2],[2,3],[4,5],[5,6],[7,8],[9,10]]){c.beginPath();c.moveTo(...P[i]);c.lineTo(...P[j]);c.stroke();}
  c.globalAlpha=1;for(const [x,y] of P){c.fillStyle='#fff8c8';c.beginPath();c.arc(x,y,3,0,7);c.fill();}});
 if(sky){const sh=C.glassTop-C.floorY-.04,sm=new THREE.Mesh(new THREE.PlaneGeometry(W-.1,sh),new THREE.MeshBasicMaterial({map:sky,toneMapped:false}));
  sm.position.set(0,C.floorY+.02+sh/2,-hd+.047);sm.name='밤하늘 판';g.add(sm);}
 // ③ 판 양옆 줄 불(줄 가운데 높이), ⑤ 별 계단 기둥
 const b=builder();
 for(let r=1;r<=S.rows;r++){const y=by+(r-.5)*cell,big=r===mid||r===S.rows;
  for(const s of [-1,1]){const x=bx+s*(BW/2+.045);if(big)b.sph('gold',.016,x,y,bz+.005,10);else b.sph(r%2?'lampA':'lampB',STACK_DRESS.lampR,x,y,bz+.005,8);}}
 for(const s of [-1,1])b.rbox('dark',.022,BH+.04,.02,.006,bx+s*(BW/2+.045),by+BH/2,bz-.012);
 // 계단 기둥(판 아래 받침 앞을 가리는 작은 상자 셋)
 for(let k=0;k<3;k++){const w=.16-k*.045,h=.028;b.rbox(k%2?'trim':'gold',w,h,.05,.008,bx,C.floorY+h/2+k*h,bz-.03);}
 // ④ 경품 받침 앞 줄 이름표 받침 판
 b.build(mats,g,{outline:new Set(['dark'])});
 const tag=canvasTex(256,64,(c,w,h)=>{for(const [k,txt,col] of [[0,`${mid}줄`,'#7cc4ff'],[1,`${S.rows}줄`,'#c9a2ff']]){const x=k*w/2;c.fillStyle='#120d22';c.beginPath();c.roundRect(x+3,3,w/2-6,h-6,14);c.fill();
  c.strokeStyle=col;c.lineWidth=4;c.stroke();c.fillStyle=col;c.font=`900 34px ${FONT}`;c.textAlign='center';c.textBaseline='middle';c.fillText(txt,x+w/4,h/2+2);}});
 if(tag){for(const [k,r] of [[0,mid],[1,S.rows]]){const pg=new THREE.PlaneGeometry(.085,.042),uv=pg.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)*.5+k*.5);
  const m=new THREE.Mesh(pg,new THREE.MeshBasicMaterial({map:tag,toneMapped:false,transparent:true}));m.position.set(S.shelfX,by+(r-1)*cell-.032,bz+.07);m.name=`줄 이름표 ${r}`;g.add(m);}}
 // ① 꼭대기 큰 별(앞뒤 두께 있는 별 + 받침)
 const crown=new THREE.Group();crown.name='꼭대기 별';
 const star=new THREE.Mesh(new THREE.ExtrudeGeometry(starShape(STACK_DRESS.starR,STACK_DRESS.starR*.45),{depth:.035,bevelEnabled:true,bevelThickness:.012,bevelSize:.01,bevelSegments:2}).translate(0,0,-.0175),mats.gold);
 star.castShadow=true;star.position.y=STACK_DRESS.starR+.03;crown.add(star);
 const stem=new THREE.Mesh(new THREE.CylinderGeometry(.018,.03,.05,10),mats.dark);stem.position.y=.02;crown.add(stem);
 crown.position.set(0,S.height,-.05);g.add(crown);
 toonify?.(g,{kind:'prop',keepMaps:true});
 // 외곽선(별·기둥)
 g.traverse(o=>{if(o.isMesh&&o.userData.wantLine){const l=new THREE.Mesh(o.geometry,machineLine());l.userData.outline=true;l.name='outline';o.add(l);}});
 for(const o of [star])if(o.isMesh){const l=new THREE.Mesh(o.geometry,machineLine());l.userData.outline=true;l.name='outline';o.add(l);}
 // 빛 따라가기: 원래 setLights·update를 감싸 줄 불·별을 같이 깜빡임
 const lamp=[findMat(g,'lampA')??mats.lampA,findMat(g,'lampB')??mats.lampB],goldM=star.material;   // 카툰 재질로 바뀐 뒤 것
 let mode='idle',t=0;const hue=new THREE.Color();
 const baseSet=U.setLights,baseUpdate=U.update;
 U.setLights=m=>{mode=m;t=0;baseSet?.(m);};
 U.update=dt=>{baseUpdate?.(dt);t+=dt;
  if(mode==='off'){for(const m of lamp)m.emissiveIntensity=.05;goldM.emissiveIntensity=.1;return;}
  if(mode==='rainbow'){hue.setHSL((t*.8)%1,.85,.6);lamp[0].emissive.copy(hue);hue.setHSL((t*.8+.5)%1,.85,.6);lamp[1].emissive.copy(hue);for(const m of lamp)m.emissiveIntensity=1.6;goldM.emissiveIntensity=1.2;return;}
  lamp[0].emissive.set(M.light);lamp[1].emissive.set(M.accent);
  const rate=mode==='play'?3:mode==='win'?10:1.2,on=Math.sin(t*rate*Math.PI)>0;
  lamp[0].emissiveIntensity=on?1.1:.25;lamp[1].emissiveIntensity=on?.25:1.1;goldM.emissiveIntensity=mode==='win'?1.0+.6*Math.sin(t*20):.35+.15*Math.sin(t*2);
  crown.rotation.y=mode==='win'?t*4:Math.sin(t*.8)*.25;};
 U.dressed=true;U.crown=crown;
 return root;
}
