// 크리스마스 아이콘 42개(+썰매 2인 변형, 11-17 5차 이동 돕기 4개 x-run·x-map·x-carousel·x-skate). 면 = 전나무 초록, 색이 곧 뜻인 것만 고유색(§4-1).
import { head } from './kit.mjs';

export const GROUP = 'christmas';
const GOLD = 'style="fill:var(--ic-gold,#e9b949)"';
const RED = 'style="fill:#c23a32"';
const WHITE = 'style="fill:#fffaf0"';
const ball = (fill) => ({
  f: `<circle cx="12" cy="14" r="6.5" style="fill:${fill}"/>`,
  s: '<circle cx="12" cy="14" r="6.5"/><path d="M10.5 7.5h3V6h-3zM12 6V3.5"/><path d="M9 12a3.5 3.5 0 0 1 2-2" style="stroke:#fffaf0"/>',
  color: true,
});
const tree = '<path d="M12 3.5 6.5 11h3L5 17.5h14L14.5 11h3z"/>';
const hatBase = '<path d="M5 19.5h14"/>';

export const ICONS = {
  'x-tree': { f: tree, s: tree + '<path d="M12 17.5v3M9.5 20.5h5M10 13.5v.1M14 15v.1"/>' },
  'x-cards-all': { f: '<rect x="7.5" y="6.5" width="12" height="14" rx="2"/>', s: '<path d="M5.5 16.5 4 6.4a1.5 1.5 0 0 1 1.3-1.7l8.5-1.2"/><rect x="7.5" y="6.5" width="12" height="14" rx="2"/><path d="M13.5 9.5 10.8 14h5.4zM13.5 14v3"/>' },
  'x-star': { f: `<path d="M12 3l2.6 5.5 6 .8-4.4 4.1 1.1 6L12 16.5l-5.3 2.9 1.1-6L3.4 9.3l6-.8z" ${GOLD}/>`, s: '<path d="M12 3l2.6 5.5 6 .8-4.4 4.1 1.1 6L12 16.5l-5.3 2.9 1.1-6L3.4 9.3l6-.8z"/>', color: true },
  'x-sparkle': { f: `<path d="M10 3c.6 4 2 5.4 6 6-4 .6-5.4 2-6 6-.6-4-2-5.4-6-6 4-.6 5.4-2 6-6z" ${GOLD}/><path d="M18 13c.3 2 1 2.7 3 3-2 .3-2.7 1-3 3-.3-2-1-2.7-3-3 2-.3 2.7-1 3-3z" ${GOLD}/>`, s: '<path d="M10 3c.6 4 2 5.4 6 6-4 .6-5.4 2-6 6-.6-4-2-5.4-6-6 4-.6 5.4-2 6-6zM18 13c.3 2 1 2.7 3 3-2 .3-2.7 1-3 3-.3-2-1-2.7-3-3 2-.3 2.7-1 3-3zM5.5 17.5v3M4 19h3"/>', color: true },
  'x-gift': { f: `<rect x="4.5" y="10" width="15" height="10.5" rx="1.5"/><path d="M10.5 10h3v10.5h-3z" ${RED}/>`, s: '<rect x="4.5" y="10" width="15" height="10.5" rx="1.5"/><rect x="3.5" y="7" width="17" height="3" rx="1"/><path d="M10.5 10v10.5M13.5 10v10.5M12 7C10 3 6.5 4 8 6.3 8.7 7 12 7 12 7zM12 7c2-4 5.5-3 4-.7-.7.7-4 .7-4 .7z"/>' },
  'x-mailbox': { f: '<path d="M4 10a4.5 4.5 0 0 1 9 0v7H4z"/>', s: '<path d="M8.5 5.5H16a4.5 4.5 0 0 1 4.5 4.5v7H4v-7a4.5 4.5 0 0 1 9 0v7M12 21v-4"/><path d="M16 11V3.5h3.5v2.5H16" style="stroke:#c23a32"/><path d="M6.5 11h4"/>' },
  'x-cocoa': { f: '<path d="M5 9h11v7.5a3.5 3.5 0 0 1-3.5 3.5h-4A3.5 3.5 0 0 1 5 16.5z"/>', s: '<path d="M5 9h11v7.5a3.5 3.5 0 0 1-3.5 3.5h-4A3.5 3.5 0 0 1 5 16.5z"/><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16"/><rect x="7" y="6" width="3" height="3" rx="1" ' + WHITE + '/><rect x="10.5" y="5" width="3" height="3" rx="1" ' + WHITE + '/>' },
  'x-outfit': { f: '<path d="M8.5 4 4 6.5 5.5 11l2-.7V20h9v-9.7l2 .7L20 6.5 15.5 4c-.5 1.6-1.8 2.5-3.5 2.5S9 5.6 8.5 4z"/>', s: '<path d="M8.5 4 4 6.5 5.5 11l2-.7V20h9v-9.7l2 .7L20 6.5 15.5 4c-.5 1.6-1.8 2.5-3.5 2.5S9 5.6 8.5 4z"/>' },
  // 옷 3종: 동동이 몸통(짧은 몸 + 큰 머리 자리)에 옷 모양만
  'x-outfit-santa': { f: `<path d="M6 21v-7a6 6 0 0 1 12 0v7z" ${RED}/>`, s: head(12, 6.5, 3.6) + '<path d="M6 21v-7a6 6 0 0 1 12 0v7zM6 16.5h12M12 11v10"/><rect x="10.5" y="15" width="3" height="3" rx=".6" ' + GOLD + '/>', color: true },
  'x-outfit-knit': { f: '<path d="M6 21v-7a6 6 0 0 1 12 0v7z"/>', s: head(12, 6.5, 3.6) + '<path d="M6 21v-7a6 6 0 0 1 12 0v7zM7 14.5l1.7 1.5 1.6-1.5 1.7 1.5 1.6-1.5 1.7 1.5 1.7-1.5M7 18.5h10"/>' },
  'x-outfit-elf': { f: '<path d="M6 21v-7a6 6 0 0 1 12 0v7z"/>', s: head(12, 6.5, 3.6) + `<path d="M6 21v-7a6 6 0 0 1 12 0v7zM8.5 10.3l3.5 3.5 3.5-3.5M6 17.5h12"/><path d="M8 17.5h8" style="stroke:var(--ic-gold,#e9b949)"/>` },
  // 모자 6종: 동동이 머리 위 모자만
  'x-hat-auto': { f: '<path d="M6 14a6 6 0 0 1 12 0z"/>', s: '<path d="M6 14a6 6 0 0 1 12 0zM4.5 14h15M12 17.5a3 3 0 1 0 3 3"/><path d="M15.5 17.5v3h-3" transform="rotate(-20 15 19)"/>' },
  'x-hat-santa': { f: `<path d="M5 16C6 9 10 4.5 15 5.5c2 .4 3 2.5 3.5 5.5L18 16z" ${RED}/>`, s: `<path d="M5 16C6 9 10 4.5 15 5.5c2 .4 3 2.5 3.5 5.5L18 16"/><rect x="4" y="15.5" width="16" height="4" rx="2" ${WHITE}/><circle cx="18.7" cy="11.5" r="1.8" ${WHITE}/>`, color: true },
  'x-hat-reindeer': { f: '<path d="M4 15.5a8 8 0 0 1 16 0"/>', s: '<path d="M4 15.5a8 8 0 0 1 16 0M7.5 10 5 4.5M5.8 6.8 3.5 6.5M6.3 7.8 8 5M16.5 10 19 4.5M18.2 6.8l2.3-.3M17.7 7.8 16 5"/><path d="M4 15.5a8 8 0 0 0 16 0" opacity=".35"/>' },
  'x-hat-cap': { f: '<path d="M5 15a7 7 0 0 1 14 0z"/>', s: '<path d="M5 15a7 7 0 0 1 14 0zM12 8V6.5M12 8v7M19 15h2.5"/>' },
  'x-hat-elf': { f: '<path d="M6 16 13 3.5l2.5 4.5L18 16z"/>', s: '<path d="M6 16 13 3.5l2.5 4.5L18 16M15.5 8l3.5 1.5"/><circle cx="20" cy="10" r="1.4"/><rect x="5" y="15.5" width="14" height="3.5" rx="1.5" ' + RED + '/>' },
  'x-hat-none': { f: '', s: '<path d="M6 15a6 6 0 0 1 12 0zM4.5 15h15" stroke-dasharray="2 2.6"/>' },
  'x-scarf': { f: `<path d="M4 7c5 2 11 2 16 0v4c-5 2-11 2-16 0z"/><path d="M13 10h4l1 10h-4z" ${RED}/>`, s: '<path d="M4 7c5 2 11 2 16 0v4c-5 2-11 2-16 0zM13 10.5h4l1 9.5h-4zM8 8.3v3.5M12.5 8.8v3.4M14 13h3.4M14.4 16.5h3.4M14.5 20v1.5M16.5 20v1.5"/>' },
  // 장식 8종: 고리 달린 공(색이 뜻)
  'x-orn-red': ball('#c23a32'),
  'x-orn-yellow': ball('#e9b949'),
  'x-orn-blue': ball('#3e72b5'),
  'x-orn-white': ball('#fffaf0'),
  'x-orn-candy': { f: '<path d="M10 21V9a3.5 3.5 0 0 1 7 0" style="fill:none"/>', s: '<path d="M10 21V9.5a3.5 3.5 0 0 1 7 0v1.5"/><path d="M10 13l2-1.5M10 17l2-1.5M13 7l1.5-1.5M16 9.5l1-1.5" style="stroke:#c23a32"/><path d="M13.5 6V3.5"/>', color: true },
  'x-orn-bell': { f: `<path d="M6 17c1.5-1 1.5-2.5 1.5-6a4.5 4.5 0 0 1 9 0c0 3.5 0 5 1.5 6z" ${GOLD}/>`, s: '<path d="M6 17c1.5-1 1.5-2.5 1.5-6a4.5 4.5 0 0 1 9 0c0 3.5 0 5 1.5 6zM12 6.5V3.5"/><circle cx="12" cy="19" r="1.6"/>', color: true },
  'x-orn-snow': { f: '', s: '<path d="M12 7v14M6 10.5l12 7M18 10.5l-12 7M12 9.5l-1.6-1.6M12 9.5l1.6-1.6M12 18.5l-1.6 1.6M12 18.5l1.6 1.6"/><circle cx="12" cy="4.5" r="1.5"/>' },
  'x-orn-gift': { f: `<rect x="6" y="10" width="12" height="10" rx="1.5"/><path d="M10.5 10h3v10h-3z" ${RED}/>`, s: '<rect x="6" y="10" width="12" height="10" rx="1.5"/><path d="M10.5 10v10M13.5 10v10M12 10V7"/><circle cx="12" cy="5" r="1.8"/>' },
  'x-campfire': { f: '<path d="M12 3c3 3.5 5.5 6 5.5 9a5.5 5.5 0 0 1-11 0c0-1.8 1-3.2 2.2-4.2.2 1.5.8 2.5 1.8 2.8C10 8 10.5 5.5 12 3z" style="fill:#e07b2e"/>', s: '<path d="M12 3c3 3.5 5.5 6 5.5 9a5.5 5.5 0 0 1-11 0c0-1.8 1-3.2 2.2-4.2.2 1.5.8 2.5 1.8 2.8C10 8 10.5 5.5 12 3z"/><path d="M3.5 21 20.5 16M3.5 16l17 5"/>', color: true },
  'x-warm-hands': { f: '<path d="M12 21c2-1.2 2.8-2.5 2.8-4S13 14 12 12.5c-1 1.5-2.8 2.9-2.8 4.5s.8 2.8 2.8 4z" style="fill:#e07b2e"/>', s: '<path d="M12 21c2-1.2 2.8-2.5 2.8-4S13 14 12 12.5c-1 1.5-2.8 2.9-2.8 4.5s.8 2.8 2.8 4z"/><path d="M3.5 10.5V5.5a1.3 1.3 0 0 1 2.6 0V9V4.5a1.3 1.3 0 0 1 2.6 0V10l-1 2H4.5zM20.5 10.5V5.5a1.3 1.3 0 0 0-2.6 0V9V4.5a1.3 1.3 0 0 0-2.6 0V10l1 2h3.2z"/>' },
  'x-cheer': { f: head(12, 11, 4.2), s: head(12, 11, 4.2) + '<path d="M7.8 10 4 4.5M16.2 10 20 4.5M7.5 21a4.5 3.8 0 0 1 9 0M10.5 11v.1M13.5 11v.1M10.8 12.8a1.6 1.6 0 0 0 2.4 0"/>' },
  'x-sled': { f: '<path d="M5 13h13l-1.5 3H6.5z"/>', s: head(11, 7.5, 3.2) + '<path d="M5 13h13l-1.5 3H6.5zM3 19h16a2.5 2.5 0 0 0 2-2.5M7.5 16v3M14.5 16v3"/>' },
  'x-sled-pair': { f: '<path d="M3.5 13h15l-1.5 3H5z"/>', s: head(7, 8, 2.8) + head(13, 8, 2.8) + '<path d="M3.5 13h15L17 16H5zM2.5 19h17a2.5 2.5 0 0 0 2-2.5M6.5 16v3M14.5 16v3"/>' },
  'x-uphill': { f: '<path d="M3 20.5 21 9v11.5z"/>', s: '<path d="M3 20.5 21 9v11.5zM6 10.5 13 3.5M8.5 3.5H13V8"/>' },
  'x-snowball': { f: `<circle cx="12" cy="13" r="7" ${WHITE}/>`, s: '<circle cx="12" cy="13" r="7"/><path d="M8 11.5c1.5-1 3-1.2 4.5-.8M10.5 16.5c1.5.3 3.2 0 4.5-1"/>', color: true },
  'x-scoop': { f: `<circle cx="12" cy="9" r="3.5" ${WHITE}/>`, s: '<circle cx="12" cy="9" r="3.5"/><path d="M3 12c2.5 0 4 1.5 5 3.5.7 1.5 2 2.5 4 2.5s3.3-1 4-2.5c1-2 2.5-3.5 5-3.5M5 20h14"/>', color: true },
  'x-snowman': { f: `<circle cx="12" cy="7" r="3.8" ${WHITE}/><circle cx="12" cy="15.5" r="5.5" ${WHITE}/><path d="M8.3 9.8c2.4 1.3 5 1.3 7.4 0l.8 1.6c-2.8 1.3-6.2 1.3-9 0z" ${RED}/>`, s: '<circle cx="12" cy="7" r="3.8"/><circle cx="12" cy="15.5" r="5.5"/><path d="M8.3 9.8c2.4 1.3 5 1.3 7.4 0l.8 1.6c-2.8 1.3-6.2 1.3-9 0zM10.6 6.5v.1M13.4 6.5v.1M12 14.5v.1M12 17.5v.1"/>', color: true },
  'x-roll': { f: `<circle cx="10" cy="14" r="6" ${WHITE}/>`, s: '<circle cx="10" cy="14" r="6"/><path d="M3 20.5h18M14.5 4.5a6.5 6.5 0 0 1 6 5.5M20.5 6.5V10H17"/>', color: true },
  'x-stack': { f: `<circle cx="9" cy="15.5" r="5" ${WHITE}/><circle cx="9" cy="7" r="3.5" ${WHITE}/>`, s: '<circle cx="9" cy="15.5" r="5"/><circle cx="9" cy="7" r="3.5"/><path d="M18.5 20V5M15.5 8l3-3 3 3"/>', color: true },
  'x-decorate': { f: '<path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.5 0 2-1.2 1.4-2.2-.7-1.2 0-2.6 1.4-2.6h2.2a3.5 3.5 0 0 0 3.5-3.5C20.5 7.3 16.7 3.5 12 3.5z"/>', s: '<path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.5 0 2-1.2 1.4-2.2-.7-1.2 0-2.6 1.4-2.6h2.2a3.5 3.5 0 0 0 3.5-3.5C20.5 7.3 16.7 3.5 12 3.5z"/><circle cx="8" cy="10" r="1.3" ' + RED + '/><circle cx="12" cy="7.5" r="1.3" ' + GOLD + '/><circle cx="16" cy="10" r="1.3" style="fill:#3e72b5"/>' },
  // 눈썰매 레이스·눈싸움 한 판(11-17, 월드개발 — 눈썰매-눈싸움-개선-v1 §3 새 아이콘)
  'x-drift': { f: '<path d="M4 15h11l-1.2 2.5H5.2z"/>', s: '<path d="M4 15h11l-1.2 2.5H5.2zM3 20h13a2 2 0 0 0 1.8-1.5"/><path d="M15 9.5c2.5-.3 4.3-1.6 5.5-3.8M13.5 6c1.6-.3 2.8-1.2 3.6-2.6M17.5 12.5c1.6.1 2.8-.4 3.8-1.5"/>' },
  'x-brake': { f: '<circle cx="12" cy="12" r="8.5" style="fill:#c23a32"/>', s: '<circle cx="12" cy="12" r="8.5"/><path d="M7.5 12h9" style="stroke:#fffaf0;stroke-width:3"/>', color: true },
  'x-boost': { f: `<path d="M13 2.5 5.5 13.5H11l-1.5 8 8-11.5H12z" ${GOLD}/>`, s: '<path d="M13 2.5 5.5 13.5H11l-1.5 8 8-11.5H12z"/>', color: true },
  'x-crouch': { f: head(12, 9.5, 3.8), s: head(12, 9.5, 3.8) + '<path d="M6.5 20.5c0-3.5 2.5-6 5.5-6s5.5 2.5 5.5 6M4 20.5h16M12 2.5v2.2M9.8 4 12 2.3 14.2 4"/>' },
  'x-crown': { f: `<path d="M3.5 18 2.5 7.5l5 4L12 4l4.5 7.5 5-4-1 10.5z" ${GOLD}/>`, s: '<path d="M3.5 18 2.5 7.5l5 4L12 4l4.5 7.5 5-4-1 10.5zM4 21h16"/>', color: true },
  'x-target': { f: '<circle cx="12" cy="12" r="5" style="fill:#c23a32"/>', s: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>', color: true },
  'x-race': { f: '<path d="M6 3.5h12v7H6z"/>', s: '<path d="M6 21V3.5h12v7H6"/><path d="M9 3.5v7M12 3.5v7M15 3.5v7M6 7h12" style="stroke-width:1.2"/>' },
  'x-trophy': { f: `<path d="M7 3.5h10v5a5 5 0 0 1-10 0z" ${GOLD}/>`, s: '<path d="M7 3.5h10v5a5 5 0 0 1-10 0zM7 5.5H4.5a3 3 0 0 0 3 4.2M17 5.5h2.5a3 3 0 0 1-3 4.2M12 13.5v4M8 20.5h8M9.5 17.5h5v3h-5z"/>', color: true },
  // 11-17 2차: 케이블카·새 코스
  // 11-17 5차 이동 돕기(넓힌 광장): 달리기 단추 · 바로 가기 지도 단추 · 지도 핀(회전목마 · 스케이트장)
  'x-run': { f: head(15, 5.5, 2.8), s: head(15, 5.5, 2.8) + '<path d="M13.5 9.5 10.5 15M13 11l3.5 2.2M12.6 10.6 9 11.2M10.5 15l3.3 2.4-1.1 3.6M10.5 15l-2.8 2.4-2.9-.6M2.5 8.5h4M1.8 12.5h3.4M3 16.5h2.2"/>' },
  'x-map': { f: `<path d="M9 5.5l6 2v12l-6-2z"/><path d="M16.5 2.6a2.9 2.9 0 0 1 2.9 2.9c0 2-2.9 4.7-2.9 4.7s-2.9-2.7-2.9-4.7a2.9 2.9 0 0 1 2.9-2.9z" ${RED}/>`, s: '<path d="M13.2 7.1 9 5.5 3.5 7.5v12L9 17.5l6 2 5.5-2v-5M9 5.5v12M15 12v7.5"/><path d="M16.5 2.6a2.9 2.9 0 0 1 2.9 2.9c0 2-2.9 4.7-2.9 4.7s-2.9-2.7-2.9-4.7a2.9 2.9 0 0 1 2.9-2.9zM16.5 5.4v.1"/>', color: true },
  'x-carousel': { f: `<path d="M3.5 9 12 3.5 20.5 9z" ${RED}/><path d="M9 14.5c1.2-1.6 3-1.9 4.2-1l1.3-1 .3 1.6-1.2.7c.2 1.3-.4 2.3-1.6 2.7l-.3 2h-1.2l-.2-1.8L9 18.5h-1.2z" style="fill:#b07a4a"/>`, s: '<path d="M3.5 9 12 3.5 20.5 9zM3.5 9c1.4 1.3 2.8 1.3 4.2 0 1.4 1.3 2.9 1.3 4.3 0 1.4 1.3 2.9 1.3 4.3 0 1.4 1.3 2.8 1.3 4.2 0M12 2v1.5M6 10v10.5M18 10v10.5M3.5 20.5h17"/><path d="M9 14.5c1.2-1.6 3-1.9 4.2-1l1.3-1 .3 1.6-1.2.7c.2 1.3-.4 2.3-1.6 2.7l-.3 2h-1.2l-.2-1.8L9 18.5h-1.2z"/>', color: true },
  'x-skate': { f: '<path d="M6 3.5h5v6.5l5.5 2.3c1.7.7 2.8 1.9 2.8 3.4V17H6z" style="fill:#fffaf0"/><path d="M6 13.5h13.2" style="fill:none;stroke:#c23a32;stroke-width:1.6"/>', s: '<path d="M6 3.5h5v6.5l5.5 2.3c1.7.7 2.8 1.9 2.8 3.4V17H6zM3.5 20.5h15.5c1.3 0 2-.8 2.2-2M8.5 17v3.5M16 17v3.5M11 6.5H8.5M11 9H8.5"/><path d="M6 13.5h13.2" style="stroke:#c23a32"/>', color: true },
  'x-gondola': { f: '<rect x="6" y="9" width="12" height="11" rx="2.2"/>', s: '<path d="M2.5 4.5 21.5 2M12 3.3V9"/><rect x="6" y="9" width="12" height="11" rx="2.2"/><path d="M6 14h12M9.5 9v5M14.5 9v5"/>' },
  'x-downhill': { f: '<path d="M3 9v11.5h18z"/>', s: '<path d="M3 9v11.5h18zM11 3.5l7 7M18 6v4.5h-4.5"/>' },
  'x-skip': { f: '<path d="M4 6l7.5 6L4 18zM11.5 6l7.5 6-7.5 6z"/>', s: '<path d="M4 6l7.5 6L4 18zM11.5 6l7.5 6-7.5 6zM20.5 5.5v13"/>' },
  'x-new-course': { f: `<rect x="4" y="4" width="16" height="16" rx="3.5" ${WHITE}/>`, s: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="8.5" cy="8.5" r="1.1"/><circle cx="15.5" cy="8.5" r="1.1"/><circle cx="12" cy="12" r="1.1"/><circle cx="8.5" cy="15.5" r="1.1"/><circle cx="15.5" cy="15.5" r="1.1"/>', color: true },
  // 눈사람 부품
  'x-part-eyes': { f: '<circle cx="8" cy="12" r="3" style="fill:#2a2420"/><circle cx="16" cy="12" r="3" style="fill:#2a2420"/>', s: '<circle cx="8" cy="12" r="3"/><circle cx="16" cy="12" r="3"/>', color: true },
  'x-part-nose': { f: '<path d="M4 9.5c4-1 9.5 0 16.5 2.5-7 2.5-12.5 3.5-16.5 2.5z" style="fill:#e07b2e"/>', s: '<path d="M4 9.5c4-1 9.5 0 16.5 2.5-7 2.5-12.5 3.5-16.5 2.5zM8 9.5l.6 1.8M12 10.2l.6 1.6M7.5 14.4l1-1.3"/>', color: true },
  'x-part-mouth': { f: '<circle cx="5" cy="11" r="1.6"/><circle cx="8.5" cy="13.5" r="1.6"/><circle cx="12" cy="14.5" r="1.6"/><circle cx="15.5" cy="13.5" r="1.6"/><circle cx="19" cy="11" r="1.6"/>', s: '<circle cx="5" cy="11" r="1.6"/><circle cx="8.5" cy="13.5" r="1.6"/><circle cx="12" cy="14.5" r="1.6"/><circle cx="15.5" cy="13.5" r="1.6"/><circle cx="19" cy="11" r="1.6"/>' },
  'x-part-arm': { f: '', s: '<path d="M3.5 19 18 6M12 11.5l1.5-5.5M15 9l5 .5M18 6l.5-3" style="stroke:#7a5230"/>' , color: true },
  'x-part-hat': { f: '<rect x="7" y="4.5" width="10" height="11" rx="1.2" style="fill:#2a2420"/>', s: '<rect x="7" y="4.5" width="10" height="11" rx="1.2"/><path d="M3.5 17.5c3 1.3 14 1.3 17 0"/><path d="M7 13h10" style="stroke:#c23a32"/>', color: true },
};
