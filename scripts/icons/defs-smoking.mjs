// 흡연장 아이콘 31개. 면 = 불씨 주황. 세기 4단계는 동동이 얼굴(점 눈·짧은 입), 맛 4종은 잎 바탕, 상황 4종은 빌딩 바탕(§8).
import { head } from './kit.mjs';

export const GROUP = 'smoking';
const cig = '<rect x="3" y="13" width="16" height="3.5" rx="1"/><path d="M7.5 13v3.5"/>';
const cigF = '<rect x="3" y="13" width="4.5" height="3.5" rx="1"/>';
const ember = '<path d="M19 13h1a1 1 0 0 1 1 1v1.5a1 1 0 0 1-1 1h-1z" style="fill:#e0552e"/>';
const face = (eyes, mouth, extra = '') => ({ f: '<circle cx="12" cy="12" r="8.5"/>', s: `<circle cx="12" cy="12" r="8.5"/>${eyes}${mouth}${extra}` });
const leaf = '<path d="M5 19C4 11 9 5 19.5 4.5 20 14 14 20 5 19z"/>';
const leafVein = '<path d="M5 19 14 10"/>';
const bld = '<path d="M3 20.5V9h6v11.5zM9 20.5V5h7v15.5z"/>';
const bldS = '<path d="M2 20.5h20M3 20.5V9h6M9 20.5V5h7v15.5M11.5 8v.1M13.5 8v.1M11.5 11.5v.1M13.5 11.5v.1M5.5 12.5v.1"/>';

export const ICONS = {
  's-cigarette': { f: cigF, s: cig + '<path d="M19 10c1-1 0-2 1-3.5"/>' },
  's-lighter': { f: '<rect x="6" y="10" width="10" height="11" rx="2"/>', s: '<rect x="6" y="10" width="10" height="11" rx="2"/><path d="M8 10V7.5h5V10M14.5 7.5c0-2 1.5-3 1.5-5 1.5 1.5 2.5 3 2 4.5a2 2 0 0 1-3.5.5z"/>' },
  's-inhale': { f: cigF, s: cig + '<path d="M21.5 9c-3 0-4-2.5-7-2.5M19 6.5l-2.5 0M21.5 9 19 11"/>' },
  's-puff-light': face('<path d="M8.8 10.5v.1M15.2 10.5v.1"/>', '<path d="M10.5 15h3"/>', '<path d="M18 6c1.5-.5 2.5.5 3.5 0"/>'),
  's-puff-sweet': face('<path d="M7.8 10.5c.7-.8 1.6-.8 2.2 0M14 10.5c.7-.8 1.6-.8 2.2 0"/>', '<path d="M9.5 14.5a3 3 0 0 0 5 0"/>'),
  's-puff-strong': face('<path d="M7.8 9.3l2.2 1M16.2 9.3l-2.2 1"/>', '<path d="M10 15.5h4"/>', '<path d="M3 15.5c-1 0-1.5-1-1-2M21 15.5c1 0 1.5-1 1-2"/>'),
  's-puff-cough': face('<path d="M7.8 9l2 2M9.8 9l-2 2M14.2 9l2 2M16.2 9l-2 2"/>', '<ellipse cx="12" cy="15.3" rx="1.6" ry="1.3"/>'),
  's-receive': { f: '<path d="M11.5 20.5 7 16V9.5a1.4 1.4 0 0 1 2.8 0V13M12.5 20.5 17 16V9.5a1.4 1.4 0 0 0-2.8 0V13"/>', s: '<path d="M11.5 20.5 7 16V9.5a1.4 1.4 0 0 1 2.8 0V13l1.7 2V20.5M12.5 20.5V15l1.7-2V9.5a1.4 1.4 0 0 1 2.8 0V16l-4.5 4.5M12 3v3M8.5 4l1 1.5M15.5 4l-1 1.5"/>' },
  's-offer': { f: '<path d="M3 13.5h4l3-2h5a1.5 1.5 0 0 1 0 3h-3.5 6l2.5-2a1.5 1.5 0 0 1 2 2.2L17.5 19H3z"/>', s: '<path d="M3 13.5h4l3-2h5a1.5 1.5 0 0 1 0 3h-3.5 6l2.5-2a1.5 1.5 0 0 1 2 2.2L17.5 19H3"/><rect x="9" y="5.5" width="10" height="2.6" rx=".8" transform="rotate(-15 14 7)"/>' },
  's-bin': { f: '<path d="M6 7.5h12l-1.2 12.2a1.5 1.5 0 0 1-1.5 1.3H8.7a1.5 1.5 0 0 1-1.5-1.3z"/>', s: '<path d="M6 7.5h12l-1.2 12.2a1.5 1.5 0 0 1-1.5 1.3H8.7a1.5 1.5 0 0 1-1.5-1.3zM4 7.5h16M9.5 7.5V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2.5M10 11v6.5M14 11v6.5"/>' },
  's-trick': { f: '<rect x="7" y="11" width="10" height="7" rx="1"/>', s: '<rect x="7" y="11" width="10" height="7" rx="1"/><path d="M3.5 19c3 1.3 14 1.3 17 0"/><circle cx="12" cy="6" r="2.5"/><path d="M16.5 3.5a1.4 1.4 0 1 1-.1 0z"/>' },
  's-ash-tap': { f: cigF, s: cig + '<path d="M14 5.5v5M11.5 8l2.5 2.5L16.5 8M20 19.5v.1M18 21v.1"/>' },
  's-trick-ring': { f: '', s: '<circle cx="12" cy="12" r="6.5" style="stroke-width:calc(var(--ic-sw,2) * 1.6)"/><path d="M5 18.5c-1 1-2 1-2.5.5"/>' },
  's-trick-nose': { f: '<path d="M12 4c-1 3-4 7-4 9.5A2.5 2.5 0 0 0 10.5 16h3a2.5 2.5 0 0 0 2.5-2.5C16 11 13 7 12 4z"/>', s: '<path d="M12 4c-1 3-4 7-4 9.5A2.5 2.5 0 0 0 10.5 16h3a2.5 2.5 0 0 0 2.5-2.5C16 11 13 7 12 4zM9.5 18.5c-1 1.5 0 2.5-1 3.5M14.5 18.5c1 1.5 0 2.5 1 3.5"/>' },
  's-trick-french': { f: head(8, 13, 5.5), s: head(8, 13, 5.5) + '<path d="M8.5 16.5h2M12 16c2.5 0 3-2 4.5-4s2-4.5.5-6M12.5 14.5c1.5-.5 2-2 2.5-3.5"/>' },
  's-ashtray': { f: '<path d="M3 13h18l-1.5 5.5a2 2 0 0 1-2 1.5h-11a2 2 0 0 1-2-1.5z"/>', s: '<path d="M3 13h18l-1.5 5.5a2 2 0 0 1-2 1.5h-11a2 2 0 0 1-2-1.5zM9 13l7-4.5M16 8.5l1 1.5M16.5 6c.5-1-.5-2 .5-3"/>' },
  's-manner-stamp': { f: '<path d="M6 3.5h12v17l-6-4-6 4z"/>', s: '<path d="M6 3.5h12v17l-6-4-6 4zM9 9.5l2 2 4-4"/>' },
  's-quitting': { f: cigF, s: '<circle cx="12" cy="12" r="9"/><rect x="5.5" y="10.5" width="13" height="3" rx=".8"/><path d="M5.6 5.6l12.8 12.8" style="stroke:#c8553d"/>' },
  's-nonsmoker': { f: '<path d="M12 15c-3.5 0-5-2.5-5-5 3 0 5 1.5 5 5zM12 13c0-3 1.8-5 5-5 0 3-2 5-5 5z" style="fill:#5f8f3e"/>', s: '<circle cx="12" cy="12" r="9"/><path d="M12 19v-6M12 15c-3.5 0-5-2.5-5-5 3 0 5 1.5 5 5zM12 13c0-3 1.8-5 5-5 0 3-2 5-5 5z"/>', color: true },
  's-scene': { f: '<circle cx="12" cy="12" r="8.5"/>', s: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>' },
  's-scene-morning': { f: bld, s: bldS + '<path d="M17 20.5a3.5 3.5 0 0 1 3.5-3.5M19.5 14v-1.5"/>' },
  's-scene-lunch': { f: '<rect x="3.5" y="9" width="17" height="11" rx="1.5"/>', s: '<rect x="3.5" y="9" width="17" height="11" rx="1.5"/><path d="M3.5 14.5h17M11 9v11M14 6l3-3M16 6.5l3-3"/>' },
  's-scene-evening': { f: bld, s: bldS + '<path d="M16 20.5a3.5 3.5 0 0 1 7 0M18 14.5l.6 1M21.5 14.5l-.6 1"/>' },
  's-scene-dinner': { f: '<path d="M4 8h6v11a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 4 19zM14 8h6v11a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 14 19z" style="fill:var(--ic-gold,#e9b949)"/>', s: '<path d="M4 8h6v11a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 4 19zM14 8h6v11a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 14 19zM10 11h1.5v5H10M20 11h-1.5v5H20M4 8c0-2 3-3 3-1 0-2 3-1 3 1M14 8c0-2 3-3 3-1 0-2 3-1 3 1"/>', color: true },
  's-mild': { f: leaf, s: leaf + leafVein },
  's-strong': { f: '<path d="M5 19C4 13 7 9 13 8.5 13.5 15 10 19 5 19z" style="fill:#7a3a1a"/>', s: '<path d="M5 19C4 13 7 9 13 8.5 13.5 15 10 19 5 19zM5 19l5-6M15 8c1-1.5 0-3 1-4.5M18 9c1-1.5 0-3 1-4.5M21 10c1-1.5 0-3 1-4.5" style="stroke-width:calc(var(--ic-sw,2) * 1.2)"/>', color: true },
  's-menthol': { f: '<path d="M4 20C3 13 6.5 8.5 13 8c.5 7-3 12-9 12z" style="fill:#7fc4c8"/>', s: '<path d="M4 20C3 13 6.5 8.5 13 8c.5 7-3 12-9 12zM4 20l5.5-6.5M15 5c1.5-1 3-1 4.5 0s3 1 3 0M15 9.5c1.5-1 3-1 4.5 0s3 1 3 0"/>', color: true },
  's-cigar': { f: '<rect x="2.5" y="10" width="16" height="5" rx="2.5" style="fill:#7a4a2a"/>', s: '<rect x="2.5" y="10" width="16" height="5" rx="2.5"/><path d="M12 10v5M12 10h3v5h-3M20.5 9c1-1 0-2 1-3"/>' , color: true },
  's-can-coffee': { f: '<rect x="7" y="5" width="10" height="15.5" rx="2"/>', s: '<rect x="7" y="5" width="10" height="15.5" rx="2"/><path d="M8 3.5h8M7 9h10M7 16.5h10M11 3.5v1.5"/>' },
  's-vending': { f: '<rect x="4.5" y="3" width="15" height="18" rx="1.5"/>', s: '<rect x="4.5" y="3" width="15" height="18" rx="1.5"/><path d="M7 6h7v7H7zM16.5 6v2M16.5 10.5v.1M7 16.5h10v2H7M9 6v7M11.5 6v7"/>' },
  's-lean-rail': { f: head(9, 7.5, 3.6), s: head(9, 7.5, 3.6) + '<path d="M9.5 11.5 11.5 18M11 14l5-1.5M3 13h18M3 13v8M21 13v8M8 13v8M16 13v8M11.5 18 10 21"/>' },
};
