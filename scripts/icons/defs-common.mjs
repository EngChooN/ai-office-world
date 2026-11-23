// 공통 아이콘 65개(+꺼짐 변형). 24 격자, f = 면(포인트 색), s = 잉크 선.
// 규칙: docs/아이콘교체/아이콘-규칙-v1.md §3·§7-1. 모두 직접 그림.
import { head, slash } from './kit.mjs';

export const GROUP = 'common';
export const ICONS = {
  // 가. 조작
  'c-enter': { f: '<rect x="4" y="4" width="9" height="16" rx="2"/>', s: '<rect x="4" y="4" width="9" height="16" rx="2"/><path d="M10 12h10M16.5 8.5 20 12l-3.5 3.5"/>' },
  'c-left': { f: '<path d="M15 5 7 12l8 7z"/>', s: '<path d="M15 5 7 12l8 7z"/>' },
  'c-right': { f: '<path d="M9 5l8 7-8 7z"/>', s: '<path d="M9 5l8 7-8 7z"/>' },
  'c-undo': { f: '', s: '<path d="M9 5 4.5 9.5 9 14"/><path d="M5 9.5h9a5 5 0 0 1 0 10h-3"/>' },
  'c-leave': { f: '<path d="M4 4h8v16H4z"/>', s: '<path d="M12 7V4H4v16h8v-3"/><path d="M9 12h11M16.5 8.5 20 12l-3.5 3.5"/>' },
  'c-stand-up': { f: head(9, 11, 3.6), s: head(9, 11, 3.6) + '<path d="M6.5 16.5h5v4h-5z"/><path d="M18 20V6M14.8 9.2 18 6l3.2 3.2"/>' },
  'c-sit': { f: head(9, 7, 3.6), s: head(9, 7, 3.6) + '<path d="M7 12h4v4h5v4"/><path d="M4 16h3M4 12v8"/>' },
  'c-tap': { f: '<path d="M9 11V5a1.6 1.6 0 0 1 3.2 0v6l4.3.9a2 2 0 0 1 1.6 2.3l-.9 4.8H9.5L6.3 15a1.6 1.6 0 0 1 2.2-2.2L9 13.3z"/>', s: '<path d="M9 13.3V5a1.6 1.6 0 0 1 3.2 0v6l4.3.9a2 2 0 0 1 1.6 2.3l-.9 4.8H9.5L6.3 15a1.6 1.6 0 0 1 2.2-2.2L9 13.3"/>' },
  'c-detail': { f: '<circle cx="10.5" cy="10.5" r="5.5"/>', s: '<circle cx="10.5" cy="10.5" r="5.5"/><path d="M14.5 14.5 20 20"/>' },
  'c-link-out': { f: '', s: '<path d="M10 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-4"/><path d="M13 4h7v7M20 4l-9 9"/>' },
  'c-close': { f: '', s: '<path d="M6 6l12 12M18 6 6 18"/>' },
  'c-back': { f: '', s: '<path d="M20 12H5M10.5 6.5 5 12l5.5 5.5"/>' },
  'c-more': { f: '<circle cx="6" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="18" cy="12" r="1.8"/>', s: '<circle cx="6" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="18" cy="12" r="1.8"/>' },
  'c-check': { f: '', s: '<path d="M5 12.5 10 17.5 19.5 7"/>' },

  // 나. 설정·시스템
  'c-settings': { f: '<circle cx="12" cy="12" r="6"/>', s: '<path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2.2"/>' },
  'c-help': { f: '<circle cx="12" cy="12" r="9"/>', s: '<circle cx="12" cy="12" r="9"/><path d="M9.3 9.5a2.8 2.8 0 1 1 3.9 2.6c-.8.4-1.2 1-1.2 1.9v.5"/><path d="M12 17.2v.1"/>' },
  'c-hide-ui': { f: '<circle cx="12" cy="12" r="3.2"/>', s: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3.2"/>' },
  'c-mouse-lock': { f: '<path d="M7 9h10v6a5 5 0 0 1-10 0z"/>', s: '<rect x="7" y="3" width="10" height="17" rx="5"/><path d="M12 3v6M7 9h10"/>' },
  'c-lock': { f: '<rect x="5" y="10.5" width="14" height="10" rx="2"/>', s: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2.5"/>' },
  'c-dev': { f: '<path d="M14.5 4.5a4.5 4.5 0 0 0-4.3 5.9L4.5 16a2.1 2.1 0 0 0 3 3l5.6-5.7a4.5 4.5 0 0 0 5.9-4.3l-2.6 2.6-2.8-.8-.8-2.8z"/>', s: '<path d="M14.5 4.5a4.5 4.5 0 0 0-4.3 5.9L4.5 16a2.1 2.1 0 0 0 3 3l5.6-5.7a4.5 4.5 0 0 0 5.9-4.3l-2.6 2.6-2.8-.8-.8-2.8z"/>' },
  'c-edit': { f: '<path d="M15 5l4 4-10 10H5v-4z"/>', s: '<path d="M15 5l4 4-10 10H5v-4z"/><path d="M13 7l4 4"/>' },
  'c-feedback': { f: '<rect x="3.5" y="6" width="17" height="12" rx="2"/>', s: '<rect x="3.5" y="6" width="17" height="12" rx="2"/><path d="M4 7l8 6 8-6"/>' },
  'c-donate': { f: '<path d="M12 20s-8-4.6-8-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 8 2.4C20 15.4 12 20 12 20z"/>', s: '<path d="M12 20s-8-4.6-8-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 8 2.4C20 15.4 12 20 12 20z"/>' },
  'c-notebook': { f: '<rect x="5" y="3.5" width="14" height="17" rx="2"/>', s: '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M9 3.5v17M12 8h4M12 11.5h4"/>' },
  'c-wait': { f: '<path d="M8.5 19.5 12 15l3.5 4.5z"/>', s: '<path d="M6.5 3.5h11M6.5 20.5h11M8 3.5c0 4.5 4 5.5 4 8.5s-4 4-4 8.5M16 3.5c0 4.5-4 5.5-4 8.5s4 4 4 8.5"/>' },

  // 다. 소리
  'c-sound': { f: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/>', s: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>' },
  'c-music': { f: '<ellipse cx="7" cy="17.5" rx="3" ry="2.4"/><ellipse cx="17" cy="15.5" rx="3" ry="2.4"/>', s: '<ellipse cx="7" cy="17.5" rx="3" ry="2.4"/><ellipse cx="17" cy="15.5" rx="3" ry="2.4"/><path d="M10 17.5V6l10-2v11.5M10 9.5l10-2"/>' },

  // 라. 채팅·사람
  'c-chat': { f: '<path d="M4 6.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4.5 3.5v-3.5H6a2 2 0 0 1-2-2z"/>', s: '<path d="M4 6.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4.5 3.5v-3.5H6a2 2 0 0 1-2-2z"/>' },
  'c-people': { f: head(8, 9, 3.8) + head(16.5, 10, 3.3), s: head(16.5, 10, 3.3) + head(8, 9, 3.8) + '<path d="M3.5 20.5a4.5 4 0 0 1 9 0M13 20.5a3.8 3.5 0 0 1 7.5 0"/>' },
  'c-person': { f: head(12, 9, 4.8), s: head(12, 9, 4.8) + '<path d="M6.5 20.5a5.5 4.5 0 0 1 11 0"/>' },
  'c-multi-join': { f: head(6.5, 9, 3.2) + head(13, 9, 3.2), s: head(6.5, 9, 3.2) + head(13, 9, 3.2) + '<path d="M3 19.5a3.5 3.2 0 0 1 7 0M9.5 19.5a3.5 3.2 0 0 1 7 0M18.5 9v7M15 12.5h7"/>' },
  'c-wave': { f: '<path d="M8 12V6.5a1.5 1.5 0 0 1 3 0V11V5a1.5 1.5 0 0 1 3 0v6V6.5a1.5 1.5 0 0 1 3 0V15a5.5 5.5 0 0 1-10.3 2.7L4.3 13.5a1.5 1.5 0 0 1 2.4-1.8z"/>', s: '<path d="M8 13.5V6.5a1.5 1.5 0 0 1 3 0V11V5a1.5 1.5 0 0 1 3 0v6V6.5a1.5 1.5 0 0 1 3 0V15a5.5 5.5 0 0 1-10.3 2.7L4.3 13.5a1.5 1.5 0 0 1 2.4-1.8L8 13.5"/><path d="M19.5 3.5a3.5 3.5 0 0 1 1.5 3M3.5 6a4 4 0 0 1 1.5-2.5"/>' },
  'c-mute-person': { f: head(8, 10, 4), s: head(8, 10, 4) + '<path d="M3 20.5a5 4.3 0 0 1 10 0"/><path d="M14 4.5h6.5a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5H17l-2.5 2v-2"/><path d="M14 3l8 10"/>' },
  'c-report': { f: '<path d="M6 4.5h12l-2.5 4 2.5 4H6z"/>', s: '<path d="M6 21V4.5h12l-2.5 4 2.5 4H6"/>' },

  // 마. 연결 상태 (고정 상태 색은 kit의 C 토큰)
  'c-net-connecting': { f: '', s: '<path d="M12 4a8 8 0 0 1 8 8"/><path d="M12 20a8 8 0 0 1-8-8" opacity=".45"/><circle cx="12" cy="12" r="2.4"/>', spin: true },
  'c-net-ok': { f: '<circle cx="12" cy="12" r="8.5" style="fill:var(--ic-ok,#5f8f3e)"/>', s: '<circle cx="12" cy="12" r="8.5"/><path d="M8 12.3l2.8 2.8L16 9.6" style="stroke:var(--ic-on,#fbf3df)"/>' },
  'c-net-other': { f: '<circle cx="9" cy="12" r="5.5" style="fill:var(--ic-mid,#d39a2e)"/>', s: '<circle cx="9" cy="12" r="5.5"/><path d="M17 5.5h4v13h-4M19.3 12.3v.1"/>' },
  'c-net-retry': { f: '', s: '<path d="M19 9a7.5 7.5 0 0 0-13.5-1.5M5 15a7.5 7.5 0 0 0 13.5 1.5"/><path d="M5 3.5v4.5h4.5M19 20.5V16h-4.5"/>' },
  'c-net-lost': { f: '<path d="M12 3.5 21 19.5H3z" style="fill:var(--ic-low,#c8553d)"/>', s: '<path d="M12 3.5 21 19.5H3z"/><path d="M12 9.5v4.5M12 16.8v.1" style="stroke:var(--ic-on,#fbf3df)"/>' },
  'c-net-full': { f: '<path d="M6 20.5V5a1.5 1.5 0 0 1 1.5-1.5h9A1.5 1.5 0 0 1 18 5v15.5z"/>', s: '<path d="M3.5 20.5h17M6 20.5V5a1.5 1.5 0 0 1 1.5-1.5h9A1.5 1.5 0 0 1 18 5v15.5"/><path d="M14.5 12.5v.1"/>' },
  'c-net-local': { f: '<rect x="5" y="5" width="14" height="10" rx="1.5"/>', s: '<rect x="5" y="5" width="14" height="10" rx="1.5"/><path d="M2.5 19h19l-2-4h-15z"/>' },
  'c-server-off': { f: '<rect x="3.5" y="9" width="12" height="11" rx="2"/>', s: '<rect x="3.5" y="9" width="12" height="11" rx="2"/><path d="M3.5 14.5h12M7 12v.1M7 17.3v.1M15 3.5h5l-5 5h5"/>' },
  'c-server-list': { f: '<rect x="4" y="4" width="16" height="5" rx="1.5"/>', s: '<rect x="4" y="4" width="16" height="5" rx="1.5"/><rect x="4" y="11" width="16" height="4" rx="1.5"/><rect x="4" y="17" width="16" height="4" rx="1.5"/><path d="M7 6.5v.1M7 13v.1M7 19v.1"/>' },

  // 바. 의견 보내기
  'c-fb-bug': { f: '<ellipse cx="12" cy="14" rx="5" ry="6"/>', s: '<ellipse cx="12" cy="14" rx="5" ry="6"/><path d="M12 8v12M9 6l-1.5-2.5M15 6l1.5-2.5M7 11H3.5M7 15H4M17 11h3.5M17 15h3"/>' },
  'c-fb-idea': { f: '<path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V17h5v-1.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>', s: '<path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V17h5v-1.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/><path d="M9.5 20.5h5"/>' },
  'c-attach': { f: '', s: '<path d="M16.5 7.5 9 15a2 2 0 0 0 2.8 2.8l7.4-7.4a4 4 0 0 0-5.7-5.7l-7.6 7.6a6 6 0 0 0 8.5 8.5L19 16"/>' },
  'c-upload': { f: '<path d="M6 3.5h8l4 4v13H6z"/>', s: '<path d="M6 3.5h8l4 4v13H6z"/><path d="M14 3.5v4h4M12 17.5v-7M9 13l3-3 3 3"/>' },
  'c-copy': { f: '<rect x="8.5" y="8.5" width="11" height="12" rx="2"/>', s: '<rect x="8.5" y="8.5" width="11" height="12" rx="2"/><path d="M15.5 5.5V5a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 5v10A1.5 1.5 0 0 0 6 16.5h.5"/>' },

  // 사. 날씨·시간·계절
  'c-wx-clear': { f: '<circle cx="12" cy="12" r="4.5"/>', s: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>' },
  'c-wx-clear-night': { f: '<path d="M19 15A8 8 0 0 1 9 5a8 8 0 1 0 10 10z"/>', s: '<path d="M19 15A8 8 0 0 1 9 5a8 8 0 1 0 10 10z"/>' },
  'c-wx-partly': { f: '<circle cx="9" cy="9" r="4"/>', s: '<path d="M9 2.5v1.5M2.5 9H4M4.4 4.4l1 1M13.6 4.4l-1 1"/><path d="M5.2 11.4A4 4 0 1 1 12.8 7.6"/><path d="M8 20h10a3.5 3.5 0 0 0 .3-7A5 5 0 0 0 8.7 14 3 3 0 0 0 8 20z"/>' },
  'c-wx-cloud': { f: '<path d="M7 18.5h10.5a4 4 0 0 0 .4-8A6 6 0 0 0 6.5 11.5 3.5 3.5 0 0 0 7 18.5z"/>', s: '<path d="M7 18.5h10.5a4 4 0 0 0 .4-8A6 6 0 0 0 6.5 11.5 3.5 3.5 0 0 0 7 18.5z"/>' },
  'c-wx-rain': { f: '<path d="M7 14h10.5a3.6 3.6 0 0 0 .3-7.2A5.5 5.5 0 0 0 7 8 3 3 0 0 0 7 14z"/>', s: '<path d="M7 14h10.5a3.6 3.6 0 0 0 .3-7.2A5.5 5.5 0 0 0 7 8 3 3 0 0 0 7 14z"/><path d="M8 17l-1 3M12.5 17l-1 3M17 17l-1 3"/>' },
  'c-wx-snow': { f: '<path d="M7 14h10.5a3.6 3.6 0 0 0 .3-7.2A5.5 5.5 0 0 0 7 8 3 3 0 0 0 7 14z"/>', s: '<path d="M7 14h10.5a3.6 3.6 0 0 0 .3-7.2A5.5 5.5 0 0 0 7 8 3 3 0 0 0 7 14z"/><path d="M8 18v.1M12 20v.1M16 18v.1" style="stroke-width:2.8"/>' },
  'c-wx-fog': { f: '<path d="M6 10.5h12a3.4 3.4 0 0 0-3-5.5 5 5 0 0 0-8.5 1.8A2.6 2.6 0 0 0 6 10.5z"/>', s: '<path d="M6 10.5h12a3.4 3.4 0 0 0-3-5.5 5 5 0 0 0-8.5 1.8A2.6 2.6 0 0 0 6 10.5z"/><path d="M3.5 14h17M5.5 17.5h13M8 21h8"/>' },
  'c-time-day': { f: '<circle cx="12" cy="11" r="4"/>', s: '<circle cx="12" cy="11" r="4"/><path d="M12 3v1.5M5 11H3.5M20.5 11H19M6.7 5.7l1 1M17.3 5.7l-1 1M3 19.5h18"/>' },
  'c-time-dusk': { f: '<path d="M6 17.5a6 6 0 0 1 12 0z"/>', s: '<path d="M6 17.5a6 6 0 0 1 12 0M12 6.5V8.5M4.2 10.2l1.4 1.4M19.8 10.2l-1.4 1.4M2.5 17.5h19M7 21h10"/>' },
  'c-time-night': { f: '<path d="M16.5 13A6 6 0 0 1 9.5 5a6.5 6.5 0 1 0 7 8z"/>', s: '<path d="M16.5 13A6 6 0 0 1 9.5 5a6.5 6.5 0 1 0 7 8z"/><path d="M18.5 4.5v.1M3 19.5h18"/>' },
  'c-season-spring': { f: '<ellipse cx="12" cy="7" rx="3" ry="4.2" transform="rotate(0 12 12)"/><ellipse cx="12" cy="7" rx="3" ry="4.2" transform="rotate(72 12 12)"/><ellipse cx="12" cy="7" rx="3" ry="4.2" transform="rotate(144 12 12)"/><ellipse cx="12" cy="7" rx="3" ry="4.2" transform="rotate(216 12 12)"/><ellipse cx="12" cy="7" rx="3" ry="4.2" transform="rotate(288 12 12)"/>', s: '<ellipse cx="12" cy="7" rx="3" ry="4.2" transform="rotate(0 12 12)"/><ellipse cx="12" cy="7" rx="3" ry="4.2" transform="rotate(72 12 12)"/><ellipse cx="12" cy="7" rx="3" ry="4.2" transform="rotate(144 12 12)"/><ellipse cx="12" cy="7" rx="3" ry="4.2" transform="rotate(216 12 12)"/><ellipse cx="12" cy="7" rx="3" ry="4.2" transform="rotate(288 12 12)"/><circle cx="12" cy="12" r="1.6"/>' },
  'c-season-summer': { f: '<path d="M11 20C5 18 3.5 11 6 4.5c5 2 7 8 5 15.5zM13 20c5.5-1 7.5-6 6.5-11.5-4 .8-6.5 5-6.5 11.5z"/>', s: '<path d="M11 20C5 18 3.5 11 6 4.5c5 2 7 8 5 15.5zM13 20c5.5-1 7.5-6 6.5-11.5-4 .8-6.5 5-6.5 11.5zM11 20 7.5 9M13 20l4-8M12 20v1.5"/>' },
  'c-season-autumn': { f: '<path d="M12 3l1.8 3.8 2.7-1.3-.6 3.6 3.6-.4-1.7 3 2.7 1.6-4 1.2.6 2.2-4.2-1.1L12 17l-.9-2.4-4.2 1.1.6-2.2-4-1.2 2.7-1.6-1.7-3 3.6.4-.6-3.6 2.7 1.3z"/>', s: '<path d="M12 3l1.8 3.8 2.7-1.3-.6 3.6 3.6-.4-1.7 3 2.7 1.6-4 1.2.6 2.2-4.2-1.1L12 17l-.9-2.4-4.2 1.1.6-2.2-4-1.2 2.7-1.6-1.7-3 3.6.4-.6-3.6 2.7 1.3zM12 9.5v11.5"/>' },
  'c-season-winter': { f: '<path d="M3.5 12.5c2-1.8 4.5-2.3 7-1.5 1.3-2 4-3 6.5-2.3 1.2-.8 2.5-.9 3.5-.4-.8 1.6-2.5 2.6-4.3 2.6-1.6 1.8-4 2.5-6.2 1.9-2 1.2-4.4 1.2-6.5-.3z"/>', s: '<path d="M3 17 21 7.5M9 13.8 7 9.5M14.5 10.9l-.5-4M17.5 9.3l2.5 3"/><path d="M3.5 12.5c2-1.8 4.5-2.3 7-1.5 1.3-2 4-3 6.5-2.3 1.2-.8 2.5-.9 3.5-.4-.8 1.6-2.5 2.6-4.3 2.6-1.6 1.8-4 2.5-6.2 1.9-2 1.2-4.4 1.2-6.5-.3z"/>' },

  // 아. 체험 표지 (허브 카드 그림을 줄인 모양: 산·옥상·마을)
  'c-exp-hiking': { f: '<path d="M2.5 19.5 9 8l3.5 5.5L15 10l6.5 9.5z"/>', s: '<path d="M2.5 19.5 9 8l3.5 5.5L15 10l6.5 9.5z"/><path d="M7.3 11 9 12.3l1.6-1.3M15 4v6M15 4h3.5l-1 1.3 1 1.2H15"/>' },
  'c-exp-smoking': { f: '<path d="M3 20.5V11h7v9.5zM10 20.5V7h8v13.5z"/>', s: '<path d="M2 20.5h20M3 20.5V11h7M10 20.5V7h8v13.5M13 10v.1M15.5 10v.1M13 13.5v.1M15.5 13.5v.1M6 4.5c1-1 0-2 1-3M8.5 6c1-1 0-2 1-3"/><path d="M5 8.5h3"/>' },
  'c-exp-christmas': { f: '<path d="M12 3.5 6.5 12h3l-4 6h13l-4-6h3z"/>', s: '<path d="M12 3.5 6.5 12h3l-4 6h13l-4-6h3zM12 18v2.5M3 20.5h18"/>' },
  // 11-23 인형뽑기(월드아트): 기계 정면 — 유리 안 곰 인형을 집게가 잡음, 아래 조작대
  'c-exp-claw': { f: '<rect x="6.5" y="4.5" width="11" height="9" rx="1" style="fill:var(--ic-glass,#dff4fb)"/>' + head(12, 11.2, 1.9), s: '<rect x="4" y="2" width="16" height="19.5" rx="2"/><rect x="6.5" y="4.5" width="11" height="9" rx="1"/><path d="M12 4.5v2.2M10.3 8.6c-.6.6-.7 1.3-.4 2M13.7 8.6c.6.6.7 1.3.4 2"/>' + head(12, 11.2, 1.9) + '<path d="M4 16h16M7.5 18.8h3M15.5 18.8v.1"/>' },
};

// 꺼짐 = 같은 그림 + 사선(면 빼고 선만). 규칙 §5.
export const OFF = ['c-sound', 'c-music', 'c-hide-ui'];
