import {chromium} from 'playwright';
const b=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const p=await b.newPage({viewport:{width:800,height:500}});
await p.goto('http://127.0.0.1:5181/src/christmas/preview.html?hud=0');
await p.waitForFunction(()=>window.xmas&&window.xmas.frames>5,null,{timeout:90000});
console.log(await p.evaluate(async()=>{const THREE=await import('/node_modules/three/build/three.module.js');const {scene,village}=window.xmas;const C=village.course.course;
 let road=null,ground=null;scene.traverse(o=>{if(o.name==='썰매 길')road=o;if(o.name==='눈 땅')ground=o;});
 const rc=new THREE.Raycaster();const res=[];
 for(const s of [10,40,80,120,200,300]){const a=C.xz(s);rc.set(new THREE.Vector3(a.x,60,a.z),new THREE.Vector3(0,-1,0));const hits=rc.intersectObjects([road,ground].filter(Boolean),false).slice(0,2).map(h=>h.object.name+':'+h.point.y.toFixed(3));res.push(s+' prof '+C.profileH(s).toFixed(3)+' '+hits.join(' '));}
 return JSON.stringify({road:!!road,vis:road?.visible,mat:road?.material?.type,vc:road?.material?.vertexColors,col:road&&[...road.geometry.attributes.color.array.slice(0,6)].map(v=>v.toFixed(2)),ground:!!ground,res},null,1);}));
await b.close();
