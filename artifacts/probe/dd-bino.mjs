import {readFileSync} from 'node:fs';
import {Vector3,Box3,Raycaster,Quaternion} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {buildToonHikerGltf} from '../../src/toon/link-hiker.js';
import {createRealisticHiker} from '../../src/realistic-hiker.js';
globalThis.self??=globalThis;globalThis.createImageBitmap??=async()=>({width:1,height:1,close(){}});
const buf=readFileSync('assets/toon/models/hiker/Hiker.glb'),warn=console.warn;console.warn=()=>{};
const g=await new GLTFLoader().parseAsync(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'');console.warn=warn;
const h=createRealisticHiker(buildToonHikerGltf(g));const flat=()=>0;
const run=(o,n=40)=>{for(let i=0;i<n;i++){h.update({clip:'Idle',pose:'stand',dt:.1,...o});h.ground({moving:false,phase:0,surfaceHeight:flat});}h.scene.updateMatrixWorld(true);};
run({});
const bino=h.gadgetProps.binoculars;const bb=new Box3().setFromObject(bino);console.log('rest bino parent',bino.parent.name,'size',bb.getSize(new Vector3()).toArray().map(v=>v.toFixed(3)));
// chest width
const body=h.model.getObjectByName('ToonHiker_Body');body.skeleton.update();let minx=1,maxx=-1;const V=new Vector3();for(let i=0;i<body.geometry.attributes.position.count;i++){body.getVertexPosition(i,V).applyMatrix4(body.matrixWorld);if(Math.abs(V.y-.4)<.01&&Math.abs(V.z)<.2){minx=Math.min(minx,V.x);maxx=Math.max(maxx,V.x);}}
console.log('chest width at .4 (incl arms?)',(maxx-minx).toFixed(3));
run({gadget:'binoculars'});
const head=h.model.getObjectByName('ToonHiker_Head');const rc=new Raycaster();
for(const s of [-1,1]){const p=bino.localToWorld(new Vector3(s*.028,0,.044)),d=new Vector3(0,0,1).applyQuaternion(bino.getWorldQuaternion(new Quaternion()));rc.set(p.clone().addScaledVector(d,-.1),d);rc.far=.3;const hit0=rc.intersectObject(head,false)[0],hit=hit0&&{distance:hit0.distance-.1};
 rc.set(p,d.clone().negate());const back=rc.intersectObject(head,false)[0];console.log('eyecup',s,'gap',hit?.distance?.toFixed(4),'inside?',back?.distance?.toFixed(4));}
console.log('arms',h.interaction.arms.map(a=>a.targetError.toFixed(4)),'held',h.interaction.gadget.held,'bino in',bino.parent.name);
for(const a of h.interaction.arms){const s=new Vector3(...a.shoulder),w=new Vector3(...a.wrist),e=new Vector3(...a.elbow);console.log(a.side,'shoulder',a.shoulder.map(v=>v.toFixed(3)),'wrist',a.wrist.map(v=>v.toFixed(3)),'reach',(s.distanceTo(e)+e.distanceTo(w)).toFixed(3),'dist',s.distanceTo(w).toFixed(3));}
console.log('eye',h.model.getObjectByName('mixamorigHead').localToWorld(new Vector3(...h.profile.eyeLocal)).toArray().map(v=>v.toFixed(3)));
{const hb=h.model.getObjectByName('mixamorigHead');const e=hb.localToWorld(new Vector3(...h.profile.eyeLocal));const c=bino.getWorldPosition(new Vector3());
console.log('bino-eye world delta',c.clone().sub(e).toArray().map(v=>v.toFixed(3)),'faceDir',h.faceDirection().toArray().map(v=>v.toFixed(3)));}
{const q=bino.getWorldQuaternion(new Quaternion()),d=new Vector3(0,0,1).applyQuaternion(q);for(const yy of [-.02,-.01,0,.01,.02]){const p=bino.localToWorld(new Vector3(.028,yy,.044));rc.set(p,d);rc.far=.3;const hit=rc.intersectObject(head,false)[0];console.log('y',yy,'gap',hit?.distance?.toFixed(4),'hitY',hit?.point?.y?.toFixed(3),'p',p.toArray().map(v=>v.toFixed(3)),'d',d.toArray().map(v=>v.toFixed(2)));}}
{const q=bino.getWorldQuaternion(new Quaternion()),d=new Vector3(0,0,1).applyQuaternion(q),col=head.geometry.attributes.color;for(const yy of [-.02,-.015,-.01]){const p=bino.localToWorld(new Vector3(.028,yy,.044));rc.set(p,d);const hit=rc.intersectObject(head,false)[0];const i=hit.face.a;console.log(yy,'color',[col.getX(i),col.getY(i),col.getZ(i)].map(v=>v.toFixed(2)),hit.point.toArray().map(v=>v.toFixed(3)));}}
{const col=head.geometry.attributes.color;for(const y of [.68,.69,.70,.71,.72,.74]){let row=[];for(const x of [-.08,-.04,0,.02,.028,.04,.08]){rc.set(new Vector3(x,y,-.5),new Vector3(0,0,1));rc.far=1;const hit=rc.intersectObject(head,false)[0];row.push(hit?`${hit.point.z.toFixed(3)}${col.getX(hit.face.a)<.3?'H':'S'}`:'-');}console.log(y,row.join(' '));}}
