// 썰매 산 케이블카 그림(월드개발, 2026-11-17 — 월드아트가 다듬기 전 1차). 자리·케이블 선은 gondola.js.
//  승강장 두 곳(나무 바닥·기둥 4개·눈 덮인 빨간 지붕·큰 바퀴·「케이블카」 팻말) · 가운데 철 기둥 · 케이블(두 줄) · 승강장에 서 있는 빈 객실 · 타는 사람 객실(buildCabin).
import * as THREE from 'three';
import {XMAS} from './palette.js';
import * as P from './props.js';
import {GONDOLA,CABLE,TOWERS} from './gondola.js';

const lin=hex=>new THREE.Color(hex);
const CABIN_H=2.3;
// 객실 한 칸(바닥이 원점, 앞 = -Z). 아래 벽·모서리 기둥·지붕·유리·위 걸이. 사람이 창으로 보인다
export function buildCabin(f,tz,{color=XMAS.santaRed}={}){
 const g=new THREE.Group();g.name='케이블카 객실';
 const body=f.basic(lin(color),{name:'xmas-cabin'}),trim=f.basic(lin(XMAS.candy),{name:'xmas-cabin-trim'}),iron=f.basic(lin('#3e4a5a'),{name:'xmas-cabin-iron'});
 const box=(w,h,d,x,y,z,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;g.add(o);return o;};
 box(1.7,.1,1.7,0,.05,0,body);                                   // 바닥
 for(const [x,z,w,d] of [[0,.82,1.7,.06],[0,-.82,1.7,.06],[.82,0,.06,1.7],[-.82,0,.06,1.7]])box(w,.85,d,x,.5,z,body); // 아래 벽
 for(const x of [-.82,.82])for(const z of [-.82,.82])box(.08,CABIN_H-.1,.08,x,CABIN_H/2,z,trim); // 모서리 기둥
 box(1.84,.16,1.84,0,CABIN_H,0,body);box(1.9,.06,1.9,0,CABIN_H-.1,0,trim);                    // 지붕
 {const snow=new THREE.Mesh(new THREE.SphereGeometry(.8,14,8,0,Math.PI*2,0,Math.PI/2),f.basic(lin(XMAS.snow),{name:'xmas-cabin-snow'}));snow.scale.set(1.12,.16,1.12);snow.position.y=CABIN_H+.07;g.add(snow);}
 {const glass=new THREE.Mesh(new THREE.BoxGeometry(1.62,1.1,1.62),new THREE.MeshBasicMaterial({color:'#cfeaff',transparent:true,opacity:.18,depthWrite:false}));glass.position.y=1.48;g.add(glass);}
 box(.08,.55,.08,0,CABIN_H+.35,0,iron);box(.5,.08,.12,0,CABIN_H+.62,0,iron);                // 걸이
 if(tz)g.traverse(m=>{if(m.isMesh&&m.material!==undefined&&!m.material.transparent)tz(m,{kind:'prop'});});
 return g;
}
export function buildGondolaArt({group,tz,f,H,putS,mobile=false}){
 const out={cabins:[]};
 const wood=f.basic(lin(XMAS.wood),{name:'xmas-station-wood'}),dark=f.basic(lin(XMAS.woodDark),{name:'xmas-station-dark'}),roof=f.basic(lin(XMAS.santaRed),{name:'xmas-station-roof'}),
  snow=f.basic(lin(XMAS.snow),{name:'xmas-station-snow'}),iron=f.basic(lin('#4a5668'),{name:'xmas-tower-iron'});
 const mesh=(geo,m,x,y,z,ry=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.rotation.y=ry;o.castShadow=!mobile;o.receiveShadow=true;group.add(o);if(tz)tz(o,{kind:'prop'});return o;};
 // 승강장: 탑승 자리 위 지붕(케이블 방향으로 길쭉), 뒤에 큰 바퀴
 const station=(st,toward,label)=>{const dx=toward.x-st.x,dz=toward.z-st.z,ry=Math.atan2(dx,dz),y=st.y,fx=Math.sin(ry),fz=Math.cos(ry),rx=Math.cos(ry),rz=-Math.sin(ry);
  mesh(new THREE.BoxGeometry(4.2,.22,5.2),wood,st.x,y+.08,st.z,ry);                        // 나무 바닥
  for(const a of [-1,1])for(const b of [-1,1])mesh(new THREE.BoxGeometry(.22,3.6,.22),dark,st.x+rx*a*1.9+fx*b*2.3,y+1.8,st.z+rz*a*1.9+fz*b*2.3,ry);
  const rf=mesh(new THREE.BoxGeometry(4.8,.28,5.8),roof,st.x,y+3.72,st.z,ry);
  mesh(new THREE.BoxGeometry(4.9,.18,5.9),snow,st.x,y+3.95,st.z,ry);
  // 큰 바퀴(케이블이 도는 곳, 뒤쪽)
  {const w=mesh(new THREE.TorusGeometry(1.25,.09,8,28),iron,st.x-fx*1.3,y+GONDOLA.station+GONDOLA.hang-.02,st.z-fz*1.3,0);w.rotation.x=Math.PI/2;out.wheels=(out.wheels??[]).concat(w);}
  putS(P.buildSign(tz,[label,'타고 올라가기 · 내려가기']),st.x+rx*2.6-fx*1.6,st.z+rz*2.6-fz*1.6,ry+Math.PI,y);
  void rf;};
 station(GONDOLA.base,CABLE[12],'케이블카 · 마을');
 station(GONDOLA.top,CABLE[CABLE.length-13],'케이블카 · 꼭대기');
 // 철 기둥 두 개(격자 느낌: 네 다리 + 가로대 + 위 팔)
 for(const t of TOWERS){const gy=H(t.x,t.z),top=t.y+GONDOLA.hang+.25,h=top-gy;
  for(const a of [-1,1])for(const b of [-1,1]){const leg=mesh(new THREE.CylinderGeometry(.09,.14,h,6),iron,t.x+a*.55,gy+h/2,t.z+b*.55);leg.rotation.set(b*-.04,0,a*.04);}
  for(let y=gy+2;y<top-.5;y+=2.4)mesh(new THREE.BoxGeometry(1.3,.08,1.3),iron,t.x,y,t.z);
  mesh(new THREE.BoxGeometry(.18,.18,2.2),iron,t.x,top,t.z,Math.atan2(CABLE.at(-1).x-CABLE[0].x,CABLE.at(-1).z-CABLE[0].z)+Math.PI/2);
  for(const sd of [-1,1]){const w=mesh(new THREE.TorusGeometry(.35,.06,6,14),iron,t.x,top+.38,t.z);w.rotation.y=Math.atan2(CABLE.at(-1).x-CABLE[0].x,CABLE.at(-1).z-CABLE[0].z);void sd;break;}}
 // 케이블 두 줄(가는 관)
 {const pts=CABLE.filter((p,i)=>i%2===0||i===CABLE.length-1).map(p=>new THREE.Vector3(p.x,p.y+GONDOLA.hang+.42,p.z));
  const curve=new THREE.CatmullRomCurve3(pts),m=new THREE.MeshBasicMaterial({color:'#2d3440'});
  for(const sd of [-.12,.12]){const g=new THREE.TubeGeometry(curve,pts.length*3,.028,5,false);g.translate(sd,0,0);const o=new THREE.Mesh(g,m);o.name='케이블';group.add(o);}}
 // 승강장마다 서 있는 빈 객실(장식)
 for(const [st,to] of [[GONDOLA.base,CABLE[12]],[GONDOLA.top,CABLE[CABLE.length-13]]]){const c=buildCabin(f,tz,{color:'#3f7fbf'}),ry=Math.atan2(-(to.x-st.x),-(to.z-st.z));
  const fx=-Math.sin(ry),fz=-Math.cos(ry);c.position.set(st.x-fx*1.6+Math.cos(ry)*1.5,st.y+.12,st.z-fz*1.6-Math.sin(ry)*1.5);c.rotation.y=ry;group.add(c);out.cabins.push(c);}
 let t=0;out.update=dt=>{t+=dt;for(const w of out.wheels??[])w.rotation.z=t*1.4;};
 return out;
}
