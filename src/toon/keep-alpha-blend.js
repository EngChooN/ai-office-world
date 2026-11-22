import * as THREE from 'three';
// 가산 혼합(빛 웅덩이·후광·빛줄기)인데 화면 알파는 그대로 두는 설정. 카툰 외곽선은 화면 알파 0.5를 「외곽선 빼기」 표시로 읽는데(pipeline.js keep),
// AdditiveBlending은 알파까지 더해 그 표시를 지운다 → 넓은 바닥(광장)에 가로 줄무늬가 생겼다(11-22 대표 지적, 남산 출발 광장 밤).
// 색은 AdditiveBlending과 같은 식(src·α + dst).
export const ADDITIVE_KEEP_ALPHA=Object.freeze({blending:THREE.CustomBlending,blendEquation:THREE.AddEquation,blendSrc:THREE.SrcAlphaFactor,blendDst:THREE.OneFactor,blendSrcAlpha:THREE.ZeroFactor,blendDstAlpha:THREE.OneFactor});
