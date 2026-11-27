// 기계 단계 그림(월드아트, 2026-11-23, 설계 v4 §6 「가벼운 기계」). 기계 종류(집게·봉·타이머·열쇠)와 상관없이 같은 방식. 단계 3개:
//  0 자세히 = 원래 부품 그대로(내가 쓰는·앞에 선·남이 쓰는 기계)
//  1 중간   = 불투명 부품(몸·조작대·봉·상자·문·칸·인형 더미)을 기계 좌표로 구운 한 덩어리(인형은 가벼운 형상 plushGeometry low) + 기계 외곽선 한 덩어리
//             + 간판·숫자판·전구는 살아 있는 부품 그대로(깜빡임 유지). 기계 하나 그리기 약 6번
//  2 먼     = 한 덩어리(인형은 먼 형상 plushFarGeometry, 삼각형 약 1/6, 전구도 구운 색) + 간판·숫자판. 외곽선·유리·반사 줄·그림자 점 없음. 그리기 2~3번
//  · 안 그리는 부품은 visible을 건드리지 않고 그리기 층(layers)만 1로 옮긴다(게임 쪽이 visible로 상자·인형을 숨기고 보이는 것과 섞이지 않게).
//    카메라·그림자 카메라는 층 0만 그리므로 화면에도 그림자에도 안 나온다.
//  · 굽힌 동안 부품이 바뀌면(봉 상자 새로 놓기 등) 다음 setLod 때 다시 굽는다(부품 자리·보임·인스턴스 판 번호로 알아챔).
// 사용: attachLod(machineRoot,{toonify}) → root.userData.setLod(0|1|2) (월드개발 main.js applyLod가 0.3초마다 부름)
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {plushGeometry,plushFarGeometry,plushIdOfGeometry} from './claw-plush.js';

const FAR_LAYER=1;
// 먼 그림에서도 따로 그리는 판(글자·숫자가 텍스처라 굽지 않음)
const KEEP=new Set(['기계 간판','타이머 숫자판','불빛 판','밤하늘 판','구멍 판']); // 11-27 불빛 쌓기 판도 글자판처럼 살아 있게(멀리서도 빛이 움직임)
let farMat=null;
function farMaterial(toonify){
 if(farMat)return farMat;
 const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,name:'claw-far'});
 const tmp=new THREE.Mesh(new THREE.BufferGeometry(),m);toonify?.(tmp,{kind:'prop'});
 farMat=tmp.material;farMat.userData={...farMat.userData,shared:true};return farMat;
}
const _m=new THREE.Matrix4(),_mi=new THREE.Matrix4(),_inv=new THREE.Matrix4(),_c=new THREE.Color(),_e=new THREE.Color(),_n=new THREE.Matrix3();
// 한 부품(형상 + 기계 좌표 행렬 + 색) → 위치·법선·색만 남긴 비색인 형상
function bakePart(geo,matrix,mat){
 let g=geo.index?geo.toNonIndexed():geo.clone();
 for(const k of Object.keys(g.attributes))if(!['position','normal','color'].includes(k))g.deleteAttribute(k);
 if(!g.attributes.normal)g.computeVertexNormals();
 g.applyMatrix4(matrix);
 // 색 = 재질 색 × 꼭짓점 색(있으면) + 빛나는 부품은 빛 색을 조금 더함(깜빡임 없이 켜진 느낌)
 _c.copy(mat.color??_c.set(1,1,1));
 if(mat.emissive&&(mat.emissiveIntensity??0)>0&&!mat.emissiveMap){_e.copy(mat.emissive).multiplyScalar(Math.min(1,mat.emissiveIntensity)*.5);_c.add(_e);}
 const n=g.attributes.position.count,src=mat.vertexColors?g.attributes.color:null,a=new Float32Array(n*3);
 for(let i=0;i<n;i++){const r=src?src.getX(i):1,gg=src?src.getY(i):1,b=src?src.getZ(i):1;a[i*3]=Math.min(1,_c.r*r);a[i*3+1]=Math.min(1,_c.g*gg);a[i*3+2]=Math.min(1,_c.b*b);}
 g.setAttribute('color',new THREE.BufferAttribute(a,3));return g;
}
const isOutline=o=>o.userData.outline||o.name==='outline';
const keepOf=(o,keep)=>{for(let p=o;p;p=p.parent)if(keep.has(p.name))return true;return false;};
// 중간 단계에서 따로(살아 있게) 그리는 부품: 간판·숫자판 + 깜빡이는 전구·불빛 줄
const KEEP_MID=new Set([...KEEP,'bulbA','bulbB','strip']);
const plushOf=(geo,level)=>{const id=plushIdOfGeometry(geo);return !id?geo:level===2?plushFarGeometry(id):plushGeometry(id,{low:true}).color;};
// 기계 외곽선 껍질(claw-machine-art.js machineLine, 법선으로 0.008 밀어냄)을 미리 밀어 둔 형상으로
const isMachineLine=o=>o.material?.customProgramCacheKey?.()==='claw-machine-line';
let lineMat=null;
const bakedLineMat=()=>lineMat??=Object.assign(new THREE.MeshBasicMaterial({color:'#2e2420',side:THREE.BackSide,name:'claw-far-line'}),{userData:{shared:true}});
function pushedPart(geo,matrix,w){let g=geo.index?geo.toNonIndexed():geo.clone();for(const k of Object.keys(g.attributes))if(!['position','normal'].includes(k))g.deleteAttribute(k);
 if(!g.attributes.normal)g.computeVertexNormals();const p=g.attributes.position,n=g.attributes.normal,v=new THREE.Vector3();
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(n,i).normalize().multiplyScalar(w);p.setXYZ(i,p.getX(i)+v.x,p.getY(i)+v.y,p.getZ(i)+v.z);}
 g.deleteAttribute('normal');g.applyMatrix4(matrix);return g;}

/**
 * 기계 하나에 단계 그림을 붙인다. root.userData.setLod(level): 0 = 자세히(원래 부품 그대로), 1 = 중간, 2 = 먼 기계.
 *  1 중간 = 불투명 부품을 한 덩어리로 굽고(인형은 가벼운 형상) + 기계 외곽선 한 덩어리 + 간판·숫자판·전구는 살아 있는 부품 그대로(깜빡임 유지)
 *  2 먼   = 한 덩어리(인형은 먼 형상, 전구도 구움) + 간판·숫자판. 외곽선 없음
 *  예전 꼴 setLod(true|false)도 받는다(true = 2, false = 0)
 */
export function attachLod(root,{toonify=null}={}){
 const mat=farMaterial(toonify);
 const far=new THREE.Mesh(new THREE.BufferGeometry(),mat);far.name='먼 기계';far.castShadow=false;far.receiveShadow=true;far.userData.lodFar=true;far.layers.set(FAR_LAYER);
 const line=new THREE.Mesh(new THREE.BufferGeometry(),bakedLineMat());line.name='먼 기계 외곽선';line.castShadow=false;line.layers.set(FAR_LAYER);
 root.add(far,line);
 let level=0,sig='',tris=0;
 // 지금 보이는 불투명 부품(굽는 것)·기계 외곽선 목록
 const parts=keep=>{const out=[],lines=[];root.updateMatrixWorld(true);
  root.traverseVisible(o=>{if(!o.isMesh||o===far||o===line||keepOf(o,keep))return;if(isOutline(o)){if(isMachineLine(o))lines.push(o);return;}const m=o.material;if(!m||Array.isArray(m)||m.transparent||m.map)return;out.push(o);});return {out,lines};};
 const signature=(list,lv)=>{let s=`${lv}|`;for(const o of list){const e=o.matrixWorld.elements;s+=`${o.id}:${e[12].toFixed(3)},${e[13].toFixed(3)},${e[14].toFixed(3)}${o.isInstancedMesh?'#'+o.instanceMatrix.version+'/'+o.count:''}|`;}return s;};
 function bake({out,lines},lv){
  _inv.copy(root.matrixWorld).invert();const geos=[];
  for(const o of out){
   const base=plushOf(o.geometry,lv);
   _m.multiplyMatrices(_inv,o.matrixWorld);
   if(o.isInstancedMesh){for(let i=0;i<o.count;i++){o.getMatrixAt(i,_mi);if(Math.abs(_mi.determinant())<1e-12)continue;geos.push(bakePart(base,_mi.clone().premultiply(_m),o.material));}}
   else geos.push(bakePart(base,_m,o.material));}
  far.geometry.dispose();far.geometry=geos.length?mergeGeometries(geos,false):new THREE.BufferGeometry();geos.forEach(g=>g.dispose());
  far.geometry.computeBoundingSphere();tris=(far.geometry.attributes.position?.count??0)/3;
  line.geometry.dispose();line.geometry=new THREE.BufferGeometry();
  if(lv===1&&lines.length){const lg=lines.map(o=>pushedPart(o.geometry,_m.multiplyMatrices(_inv,o.matrixWorld),.008));line.geometry=mergeGeometries(lg,false);lg.forEach(g=>g.dispose());line.geometry.computeBoundingSphere();tris+=line.geometry.attributes.position.count/3;}
 }
 const setLayers=(lv,keep)=>{root.traverse(o=>{if(o===far||o===line||!o.isMesh&&!o.isLine&&!o.isSprite)return;o.layers.set(lv&&!keepOf(o,keep)?FAR_LAYER:0);});
  far.layers.set(lv?0:FAR_LAYER);line.layers.set(lv===1?0:FAR_LAYER);};
 /** 0.3초마다 불러도 되게: 바뀐 게 없으면 거의 일을 안 한다(부품 자리·보임·인스턴스 판 번호가 같으면 다시 굽지 않음) */
 function setLod(next){
  const lv=next===true?2:next===false?0:next|0,keep=lv===1?KEEP_MID:KEEP;
  if(lv){const P=parts(keep),s=signature(P.out,lv);if(lv!==level||s!==sig){bake(P,lv);sig=s;}
   // 게임 쪽이 새로 붙인 부품(새 상자·새 더미)도 층을 옮겨야 하므로 굽힌 동안에는 매번 층을 맞춘다
   setLayers(lv,keep);level=lv;return;}
  if(level){setLayers(0,KEEP);level=0;sig='';}
 }
 root.userData.setLod=setLod;
 Object.defineProperties(root.userData,{lodLevel:{get:()=>level,configurable:true},lodFar:{get:()=>level===2,configurable:true},lodTris:{get:()=>tris,configurable:true}});
 return root;
}
