import {climb} from './dd-stairs.mjs';
const o=JSON.parse(process.argv[2]);console.log(JSON.stringify(await climb({...o,log:true,seconds:o.seconds??5})));
