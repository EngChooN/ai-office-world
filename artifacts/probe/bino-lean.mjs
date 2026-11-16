import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const page=await browser.newPage({viewport:{width:400,height:400}});
await page.goto(`http://127.0.0.1:5173/src/toon/character-preview.html?hud=0&bg=plain`);
await page.waitForFunction(()=>window.charPreview&&window.charPreview.frames>5,null,{timeout:60000});
const probe=g=>page.evaluate(g=>{for(let i=0;i<6;i++)window.charPreview.set({view:'side',clip:'Idle',pose:'stand',gadget:g});
 const s=window.charPreview.hiker.scene;s.updateMatrixWorld(true);const out={};
 for(const n of ['Hips','Spine','Spine1','Spine2','Neck','Head','LeftUpLeg','LeftLeg','LeftFoot','LeftArm','LeftHand','RightHand']){const b=s.getObjectByName('mixamorig'+n);const e=b.matrixWorld.elements;out[n]=[e[12],e[13],e[14]].map(v=>+v.toFixed(3));}
 const h=s.getObjectByName('mixamorigHead');const e=h.matrixWorld.elements;out.headZ=[e[8],e[9],e[10]].map(v=>+v.toFixed(2));out.headY=[e[4],e[5],e[6]].map(v=>+v.toFixed(2));
 const V=new s.children[0].position.constructor();let lo=1e9;s.traverse(o=>{if(o.isSkinnedMesh&&o.name==='ToonHiker_boots'){o.skeleton.update();for(let i=0;i<o.geometry.attributes.position.count;i++){o.getVertexPosition(i,V);V.applyMatrix4(o.matrixWorld);lo=Math.min(lo,V.y);}}});out.sole=+lo.toFixed(4);
 return out;},g);
console.log('idle',JSON.stringify(await probe('none')));
console.log('bino',JSON.stringify(await probe('binoculars')));
await browser.close();
