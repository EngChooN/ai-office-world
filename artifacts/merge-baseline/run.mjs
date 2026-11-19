// 한 게임 통합 0단계 기준선(월드개발 11-19): 1군 점검 스크립트 + 남산 점검 + 단위 시험을 지금 코드로 돌려 통과/실패를 남긴다.
// 스크립트마다 박힌 주소(포트)가 달라서 그 포트마다 vite를 띄운다(4173은 vite preview = 먼저 npm run build 필요).
// node artifacts/merge-baseline/run.mjs [라벨]  → artifacts/merge-baseline/<라벨>/summary.json·로그
import {spawn} from 'node:child_process';import {mkdirSync,writeFileSync,createWriteStream} from 'node:fs';
const label=process.argv[2]??'before',dir=`artifacts/merge-baseline/${label}`;mkdirSync(dir,{recursive:true});
const {createServer,preview}=await import('vite');const servers=[];
for(const port of [5173,5176,5178,5190,5310]){const s=await createServer({server:{port,host:'127.0.0.1',strictPort:true},logLevel:'silent'});await s.listen();servers.push(s);}
const pv=await preview({preview:{port:4173,host:'127.0.0.1',strictPort:true},logLevel:'silent'});
const JOBS=[
 ['plaza-start',{BASE_URL:'http://127.0.0.1:5190'}],['full-autowalk',{BASE_URL:'http://127.0.0.1:5310/'}],['controls-camera',{}],['facing',{}],['auto-view',{}],
 ['entrance-integration',{BASE_URL:'http://127.0.0.1:5176'}],['start-choice',{BASE_URL:'http://127.0.0.1:5176'}],['mobile-buttons',{BASE_URL:'http://127.0.0.1:4173/'}],
 ['mobile-pages',{BASE_URL:'http://127.0.0.1:4173/'}],['hud-toggle',{}],['ui-frame',{OUT_DIR:`${dir}/ui-frame`}],['free-settings',{BASE_URL:'http://127.0.0.1:4173/hiking/',OUT:`${dir}/free-settings`}],
 ['no-realistic',{}],['namsan-game',{PAGE_URL:'http://127.0.0.1:5173'}]];
const only=process.env.ONLY?.split(',');const res=[];
for(const [name,env] of JOBS){if(only&&!only.includes(name))continue;const t0=Date.now();const log=createWriteStream(`${dir}/${name}.log`);
 const code=await new Promise(r=>{const c=spawn(process.execPath,[`scripts/verify-${name}.mjs`],{env:{...process.env,...env},stdio:['ignore','pipe','pipe']});c.stdout.pipe(log);c.stderr.pipe(log);
  const kill=setTimeout(()=>{c.kill('SIGKILL');},25*60000);c.on('close',k=>{clearTimeout(kill);r(k);});});
 res.push({name,code,sec:Math.round((Date.now()-t0)/1000)});console.log(name,code,Math.round((Date.now()-t0)/1000)+'s');writeFileSync(`${dir}/summary.json`,JSON.stringify(res,null,1));}
for(const s of servers)await s.close();pv.httpServer.close();process.exit(0);
