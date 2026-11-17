// 허브 동동이(평면 그림). outfit: hike 등산복 · office 회사원 옷 · santa 산타 옷, wave: 한 손 들기.
// 임시(11-17): 월드아트의 허브용 2D 동동이 정식 그림이 아직 없어, 월드디자인 허브 시안(docs/허브개선/tools/common.js)의 평면 그림을 그대로 옮겼다.
// 게임 속 동동이(벙거지·빨간 목도리·주황 바람막이·청록 배낭, 큰 머리)를 따름. 정식 그림이 오면 이 함수 속만 바꾼다(부르는 쪽은 그대로).
export const OUTFITS=Object.freeze(['hike','office','santa']);
export function dongdong({outfit='hike',wave=false,cls=''}={}){
 const O='#3a2a16',SW=2.6,skin='#ecc59c';
 if(!OUTFITS.includes(outfit))outfit='hike';
 const body={hike:'#e07a22',office:'#f4f1e8',santa:'#c8352e'}[outfit];
 const mitt={hike:'#b8302d',office:skin,santa:'#2f7a52'}[outfit];
 const pack=outfit==='hike'?`<rect x="22" y="80" width="76" height="50" rx="18" fill="#1f7a72" stroke="${O}" stroke-width="${SW}"/><ellipse cx="94" cy="80" rx="9" ry="7" fill="#e3b23c" stroke="${O}" stroke-width="${SW}"/>`:'';
 const legs=`<rect x="45" y="120" width="13" height="16" rx="4" fill="${outfit==='office'?'#2f3542':'#22355e'}" stroke="${O}" stroke-width="${SW}"/><rect x="62" y="120" width="13" height="16" rx="4" fill="${outfit==='office'?'#2f3542':'#22355e'}" stroke="${O}" stroke-width="${SW}"/>
<ellipse cx="50" cy="140" rx="11" ry="6.5" fill="${outfit==='office'?'#2a2018':'#6b4226'}" stroke="${O}" stroke-width="${SW}"/><ellipse cx="71" cy="140" rx="11" ry="6.5" fill="${outfit==='office'?'#2a2018':'#6b4226'}" stroke="${O}" stroke-width="${SW}"/>`;
 const armL=`<ellipse cx="34" cy="111" rx="8" ry="14" transform="rotate(22 34 111)" fill="${body}" stroke="${O}" stroke-width="${SW}"/><circle cx="29" cy="124" r="7" fill="${mitt}" stroke="${O}" stroke-width="${SW}"/>`;
 const armR=wave?`<ellipse cx="89" cy="94" rx="8" ry="14" transform="rotate(-38 89 94)" fill="${body}" stroke="${O}" stroke-width="${SW}"/><circle cx="97" cy="81" r="7" fill="${mitt}" stroke="${O}" stroke-width="${SW}"/>`
  :`<ellipse cx="86" cy="111" rx="8" ry="14" transform="rotate(-22 86 111)" fill="${body}" stroke="${O}" stroke-width="${SW}"/><circle cx="91" cy="124" r="7" fill="${mitt}" stroke="${O}" stroke-width="${SW}"/>`;
 let torso=`<ellipse cx="60" cy="110" rx="27" ry="24" fill="${body}" stroke="${O}" stroke-width="${SW}"/>`;
 if(outfit==='hike')torso+=`<path d="M47 92 L46 126 M73 92 L74 126" stroke="#17403d" stroke-width="4.5" stroke-linecap="round"/><rect x="53" y="100" width="14" height="8" rx="3" fill="#1f6f68" stroke="${O}" stroke-width="1.6"/>`;
 if(outfit==='office')torso+=`<path d="M60 90 l-5 6 5 26 5-26z" fill="#2c3f73" stroke="${O}" stroke-width="1.8" stroke-linejoin="round"/><path d="M46 88 l14 6 14-6" fill="none" stroke="${O}" stroke-width="2"/>`;
 if(outfit==='santa')torso+=`<path d="M60 88 V134" stroke="#f6f3ee" stroke-width="6"/><rect x="34" y="112" width="52" height="6" fill="#2a2018"/><rect x="56" y="111" width="8" height="8" rx="1.5" fill="#e3b23c"/>`;
 const scarf=outfit==='hike'?`<ellipse cx="60" cy="89" rx="23" ry="7.5" fill="#b8302d" stroke="${O}" stroke-width="${SW}"/>`:outfit==='santa'?`<ellipse cx="60" cy="89" rx="23" ry="7" fill="#f6f3ee" stroke="${O}" stroke-width="${SW}"/>`:'';
 const ears=`<circle cx="25" cy="60" r="6" fill="${skin}" stroke="${O}" stroke-width="${SW}"/><circle cx="95" cy="60" r="6" fill="${skin}" stroke="${O}" stroke-width="${SW}"/>`;
 const head=`<circle cx="60" cy="56" r="35" fill="${skin}" stroke="${O}" stroke-width="${SW}"/>`;
 const hair=outfit==='office'?`<path d="M25 56 Q22 20 60 19 Q98 20 95 56 Q91 38 74 35 Q62 43 46 35 Q31 39 25 56Z" fill="#4a2c17" stroke="${O}" stroke-width="${SW}" stroke-linejoin="round"/>`
  :`<path d="M27 50 Q30 30 60 29 Q90 30 93 50 Q84 41 60 40 Q36 41 27 50Z" fill="#4a2c17"/>`;
 const face=`<ellipse cx="47" cy="62" rx="5.4" ry="6.6" fill="#1b1410"/><ellipse cx="73" cy="62" rx="5.4" ry="6.6" fill="#1b1410"/><circle cx="45.4" cy="59.4" r="1.9" fill="#fff"/><circle cx="71.4" cy="59.4" r="1.9" fill="#fff"/>
<ellipse cx="39" cy="71" rx="6" ry="3.4" fill="#e98f86" opacity=".75"/><ellipse cx="81" cy="71" rx="6" ry="3.4" fill="#e98f86" opacity=".75"/><path d="M56 72 q4 4 8 0" fill="none" stroke="#7a2b1f" stroke-width="2" stroke-linecap="round"/>`;
 let hat='';
 if(outfit==='hike')hat=`<ellipse cx="60" cy="33" rx="47" ry="9" fill="#b59a5c" stroke="${O}" stroke-width="${SW}"/><path d="M31 33 Q32 7 60 7 Q88 7 89 33Z" fill="#a88a4e" stroke="${O}" stroke-width="${SW}" stroke-linejoin="round"/><path d="M31.5 25 Q60 19 88.5 25 L89 31 Q60 26 31 31Z" fill="#b8302d"/>`;
 if(outfit==='santa')hat=`<path d="M26 36 Q30 4 66 5 Q96 8 106 44" fill="#c8352e" stroke="${O}" stroke-width="${SW}" stroke-linejoin="round"/><path d="M26 36 Q60 26 94 36" fill="#c8352e"/><circle cx="106" cy="46" r="7.5" fill="#f6f3ee" stroke="${O}" stroke-width="${SW}"/><rect x="21" y="28" width="78" height="13" rx="6.5" fill="#f6f3ee" stroke="${O}" stroke-width="${SW}"/>`;
 return `<svg class="dd ${cls}" viewBox="0 0 120 150" aria-hidden="true" focusable="false"><ellipse cx="60" cy="145" rx="34" ry="5" fill="rgba(40,25,10,.18)"/>${pack}${legs}${armL}${torso}${armR}${scarf}${ears}${head}${hair}${face}${hat}</svg>`;
}
