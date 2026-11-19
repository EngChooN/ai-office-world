// 한 게임 통합 2군(기능 14개) 점검(월드개발 11-19, 2단계부터). run.mjs와 같은 방식: 스크립트마다 박힌 포트에 vite를 띄운다(4173 = vite preview, 먼저 npm run build).
// node artifacts/merge-baseline/run2.mjs [라벨]  → artifacts/merge-baseline/<라벨>/tier2/summary.json·로그
import {spawn} from 'node:child_process';import {mkdirSync,writeFileSync,createWriteStream} from 'node:fs';
const label=process.argv[2]??'before',dir=`artifacts/merge-baseline/${label}/tier2`;mkdirSync(dir,{recursive:true});
const {createServer,preview}=await import('vite');const servers=[];
for(const port of [5173,5175,5176,5177,5178,5197,5310,5330]){const s=await createServer({server:{port,host:'127.0.0.1',strictPort:true},logLevel:'silent'});await s.listen();servers.push(s);}
const pv=await preview({preview:{port:4173,host:'127.0.0.1',strictPort:true},logLevel:'silent'});
const JOBS=[['interaction',{PORT:'5197'}],['hiking-interactions',{}],['hiker-interactions',{}],['rest-integration',{}],['gadgets',{}],['mobile-gadgets',{}],
 ['mobile-fb-photo',{}],['trail-buttons',{}],['trail-dropin',{}],['trail-dropin-route',{}],['trail-sound',{}],['exhaustion',{}],['radio',{}],['arms-app',{}]];
const only=process.env.ONLY?.split(',');const res=[];
for(const [name,env] of JOBS){if(only&&!only.includes(name))continue;const t0=Date.now();const log=createWriteStream(`${dir}/${name}.log`);
 const code=await new Promise(r=>{const c=spawn(process.execPath,[`scripts/verify-${name}.mjs`],{env:Object.fromEntries(Object.entries({...process.env,...env}).filter(([k])=>k!=="ONLY")),stdio:['ignore','pipe','pipe']});c.stdout.pipe(log);c.stderr.pipe(log);
  const kill=setTimeout(()=>{c.kill('SIGKILL');},20*60000);c.on('close',k=>{clearTimeout(kill);r(k);});});
 res.push({name,code,sec:Math.round((Date.now()-t0)/1000)});console.log(name,code,Math.round((Date.now()-t0)/1000)+'s');writeFileSync(`${dir}/summary.json`,JSON.stringify(res,null,1));}
for(const s of servers)await s.close();pv.httpServer.close();process.exit(0);
