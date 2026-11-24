// 시험용 조절값 끼우기(월드개발 11-24): node --import ./tune-env.mjs <다른 잣대 스크립트> … — 같은 모듈이라 잣대 스크립트도 이 값으로 돎
// 환경 변수 ROOT(코드 뿌리) · SLACK · BOTTOM · PUSH · PRESS · VMAX · UPMAX · SLIP (안 주면 코드 기본값)
const E=process.env,root=E.ROOT??new URL('../../..',import.meta.url).pathname.replace(/\/$/,'');
const P=await import(root+'/src/claw/claw-bridge-physics.js');
if(E.SLACK)P.setBridgeSlack(+E.SLACK);
if(E.BOTTOM&&P.setBridgeBottom)P.setBridgeBottom(+E.BOTTOM);
if((E.PUSH||E.PRESS)&&P.setBridgePushMax)P.setBridgePushMax(+(E.PUSH??.03),+(E.PRESS??E.PUSH??.005));
if((E.VMAX||E.UPMAX||E.JAM)&&P.setBridgeGuard)P.setBridgeGuard(+(E.VMAX??20),+(E.UPMAX??8),+(E.JAM??.02));
if(E.SLIP&&P.setBridgeSlip)P.setBridgeSlip(+E.SLIP);
