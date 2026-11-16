// 가벼운 동동이(월드개발, 2026-11-16) — 광장 20명 대책. 휴대폰은 가까운 6명만 뼈대 동동이로 그리고, 나머지는 이 몸으로 그린다.
// 뼈대·피부 변형 없이 꼭짓점 색 메시 하나(삼각형 약 1천 개, 동동이 한 명 약 4.9만의 2%)라 20명이 모여도 가볍다.
// 비율은 동동이 그대로(키 1.0m·머리 가운데 0.73m·머리 반지름 .25/.225/.23, link-hiker DONGDONG). 옷 색은 크리스마스 옷 표(outfits.js)와 같은 색.
// 걷는 동안은 몸 전체가 통통 튀고 좌우로 살짝 흔들린다(걸음 위상만, 다리 없음 — 멀리서 보는 몸).
// ⚠ 모양은 월드개발 임시안이다. 월드아트가 다듬을 수 있게 형상은 buildLiteGeometry 한곳에 모았다.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {XMAS} from './palette.js';

const SKIN='#f7d9b8',HAIR='#5a3a26',EYE='#2a2321';
// 옷 → [윗옷, 바지, 장갑, 신발, 모자 기본]
const OUTFIT_COLORS=Object.freeze({
 santa:{jacket:XMAS.santaRed,trim:XMAS.fur,pants:XMAS.santaRed,mitten:XMAS.fur,boot:'#2b2321',hat:'santa'},
 sweater:{jacket:XMAS.knitCream,trim:XMAS.santaRed,pants:'#3b4a7a',mitten:XMAS.santaRed,boot:'#8d5c35',hat:'beanie'},
 elf:{jacket:XMAS.elfGreen,trim:XMAS.santaRed,pants:XMAS.santaRed,mitten:XMAS.elfGreen,boot:'#7a4a2c',hat:'elf'},
});
const col=(g,hex)=>{const c=new THREE.Color(hex),n=g.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++){a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b;}g.setAttribute('color',new THREE.BufferAttribute(a,3));return g;};
const prep=(g,hex)=>{g=g.index?g.toNonIndexed():g;g.deleteAttribute('uv');return col(g,hex);};
const ell=(rx,ry,rz,w=14,h=10)=>new THREE.SphereGeometry(1,w,h).scale(rx,ry,rz);

export function buildLiteGeometry({outfit='santa',hat=null,scarf=null}={}){
 const o=OUTFIT_COLORS[outfit]??OUTFIT_COLORS.santa,H=hat||o.hat,parts=[];
 const add=(g,hex)=>parts.push(prep(g,hex));
 // 다리·신발
 for(const s of [-1,1]){add(new THREE.CylinderGeometry(.055,.055,.12,8).translate(s*.075,.1,0),o.pants);add(ell(.075,.055,.1,10,8).translate(s*.075,.045,.025),o.boot);}
 // 몸통(아래가 조금 넓은 통) + 밑단·허리
 add(new THREE.CylinderGeometry(.15,.185,.32,14).translate(0,.32,0),o.jacket);
 add(new THREE.CylinderGeometry(.19,.19,.04,14).translate(0,.17,0),o.trim);
 // 팔·장갑
 for(const s of [-1,1]){add(new THREE.CylinderGeometry(.045,.05,.2,8).rotateZ(s*.35).translate(s*.2,.36,0),o.jacket);add(ell(.05,.05,.05,8,6).translate(s*.235,.26,0),o.mitten);}
 // 머리(큰 머리) + 머리카락 뒤쪽 + 눈 둘
 add(ell(.25,.225,.23,18,14).translate(0,.73,0),SKIN);
 add(ell(.255,.2,.21,14,10).translate(0,.76,-.04),HAIR);
 for(const s of [-1,1])add(ell(.03,.045,.02,8,6).translate(s*.085,.72,.215),EYE);
 // 목도리
 if(scarf==='stripe'||outfit==='santa')add(new THREE.TorusGeometry(.13,.04,6,14).rotateX(Math.PI/2).translate(0,.5,0),scarf==='stripe'?XMAS.santaRed:o.trim);
 // 모자
 if(H==='santa'){add(new THREE.ConeGeometry(.22,.32,14).rotateX(-.35).translate(0,1.04,-.06),XMAS.santaRed);add(new THREE.TorusGeometry(.22,.045,6,16).rotateX(Math.PI/2).translate(0,.92,0),XMAS.fur);add(ell(.06,.06,.06,8,6).translate(0,1.17,-.17),XMAS.fur);}
 else if(H==='elf'){add(new THREE.ConeGeometry(.2,.4,12).rotateX(-.5).translate(0,1.06,-.1),XMAS.elfGreen);add(ell(.05,.05,.05,8,6).translate(0,1.18,-.3),XMAS.gold);}
 else if(H==='beanie'){add(ell(.255,.16,.245,14,8).translate(0,.86,0),XMAS.santaRed);add(ell(.06,.06,.06,8,6).translate(0,1.02,0),XMAS.knitCream);}
 else if(H==='antlers'){for(const s of [-1,1]){add(new THREE.CylinderGeometry(.02,.025,.22,6).rotateZ(-s*.4).translate(s*.12,1.02,0),XMAS.antler);add(new THREE.CylinderGeometry(.015,.02,.1,6).rotateZ(s*.6).translate(s*.17,1.06,0),XMAS.antler);}}
 return mergeGeometries(parts);
}

// toon: createToonStyle 결과(toonify로 카툰 명암·외곽선을 입힌다)
export function createLiteDongdong({toon,look={outfit:'santa'}}){
 const root=new THREE.Group();root.name='가벼운 동동이';
 const mesh=new THREE.Mesh(buildLiteGeometry(look),new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0}));
 mesh.castShadow=true;root.add(mesh);toon?.toonify?.(mesh,{kind:'prop'});
 let sig=JSON.stringify(look),phase=0;
 return {root,mesh,
  setLook(l){const s=JSON.stringify(l);if(s===sig)return;sig=s;const old=mesh.geometry;mesh.geometry=buildLiteGeometry(l);old.dispose();
   // 외곽선 껍질도 같은 형상을 쓴다(toonify가 만든 자식)
   mesh.traverse(c=>{if(c!==mesh&&c.isMesh&&c.geometry===old)c.geometry=mesh.geometry;});},
  update(dt,moving){phase=moving?phase+dt*12:phase*.9;mesh.position.y=moving?Math.abs(Math.sin(phase))*.04:0;mesh.rotation.z=moving?Math.sin(phase)*.06:0;},
  dispose(){mesh.geometry.dispose();},
 };
}
