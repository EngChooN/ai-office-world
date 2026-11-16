import {climb} from './dd-stairs.mjs';
console.log(JSON.stringify(await climb({rise:+process.argv[2]||.18,log:true,seconds:3.2})));
