// probe-fly.mjs 결과 파일들 요약(월드개발 11-24): node sum.mjs <파일…>
import {readFileSync} from 'node:fs';
for(const f of process.argv.slice(2)){const [a,b]=readFileSync(f,'utf8').trim().split('\n');const o=JSON.parse(a);let fly=0,plays=0;
 console.log('==',f);for(const [k,v] of Object.entries(o)){fly+=v.flyPlays;plays+=v.plays;console.log(k,`날아감 ${v.flyPlays}/${v.plays}`,'점속도최대',v.maxV,'수평',v.maxCv,'위로(0.05초)',v.maxUpV,'위로(한칸)',v.maxUpV1,'솟음',v.maxUp,'유리밖칸',v.outside,JSON.stringify(v.byState));}
 console.log(`합계 날아감 ${fly}/${plays}`);if(process.env.LIST)for(const r of JSON.parse(b))console.log(JSON.stringify(r));}
