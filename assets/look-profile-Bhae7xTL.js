import{y as t}from"./server-pick-tiQOPjHF.js";const n={am:{label:"오전 10시",elevation:29,azimuth:142},pm:{label:"오후 3시",elevation:25,azimuth:224}},l={id:"forest-granite-clear-v3",sunElevation:29,sunAzimuth:142,haze:"#9DBEDF",zenith:"#4A86C8",horizon:"#BAD6EE",sunColor:"#FFF1DE",far:3e4};function s(o=l.sunElevation,i=l.sunAzimuth){const a=o*Math.PI/180,e=i*Math.PI/180;return[Math.sin(e)*Math.cos(a),Math.sin(a),-Math.cos(e)*Math.cos(a)]}const g=`
#ifdef USE_FOG
 float d=max(0.0,vFogDepth);
 float a=-log(0.68),b=-log(0.55),c=-log(0.25);
 float tau=d<=8000.0?a*d/8000.0:d<=12000.0?a+(b-a)*(d-8000.0)/4000.0:b+(c-b)*(d-12000.0)/13000.0;
 // 날씨 연무(비·눈·안개·흐림)는 fog.near 슬롯으로 받은 감쇠 계수(1/m)만큼 광학 깊이를 더한다. 0이면 맑은 날 기준 그대로.
 tau+=d*fogNear;
 gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor,1.0-exp(-tau));
 // 푸른 연무: 대비 감쇠와 별개로 먼 곳일수록 레일리 산란처럼 하늘색을 얹는다(회색 안개 대신).
 float veil=${t.veil.toFixed(3)}*(1.0-exp(-d/${t.scale.toFixed(1)}));
 gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(${t.color.map(o=>o.toFixed(3)).join(",")})*max(dot(fogColor,vec3(0.2126,0.7152,0.0722))*1.05,0.0)/0.62,veil);
#endif
`;export{g as H,l as L,n as S,s};
//# sourceMappingURL=look-profile-Bhae7xTL.js.map
