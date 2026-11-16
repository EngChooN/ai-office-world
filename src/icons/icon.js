// 아이콘 표시 공통 부품 (허브·등산·흡연장·크리스마스 공용, 아이콘-규칙-v1 §2·§3-3·§5·§6).
// 그림은 월드아트가 낸 public/icons/sprite.svg 한 파일의 <symbol id="ic-이름">. 선 currentColor(굵기 --ic-sw), 면 var(--ic-point).
// 꺼짐은 월드아트의 `이름-off` 그림이 있으면 그것, 없으면 CSS 사선. 연결 중(c-net-connecting)은 저절로 돎.
// 그림이 아직 없는 이름은 지금 쓰는 이모지 글자를 그대로 보여 줘서 화면이 비지 않는다(월드아트 파일이 오는 대로 저절로 바뀜).
import { ICON_FALLBACK } from './emoji-map.js';
import { AVAILABLE_ICONS } from './available.js';

const SPIN = new Set(['c-net-connecting']);
export const ICON_SIZES = Object.freeze({ xs: 14, s: 18, m: 22, l: 28, xl: 40 });

const base = () => {
  try { return import.meta.env?.BASE_URL ?? '/'; } catch { return '/'; }
};
export const spriteUrl = () => `${base()}icons/sprite.svg`;

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function hasIcon(name) { return AVAILABLE_ICONS.has(name); }

// 아이콘 하나의 HTML. opts: size(xs·s·m·l·xl), label(아이콘만 있는 자리의 화면 읽기 이름), off(꺼짐 사선), fallback(대신 보일 글자)
export function icon(name, opts = {}) {
  const size = ICON_SIZES[opts.size] ? opts.size : 's';
  const offArt = opts.off && hasIcon(`${name}-off`);
  const spin = SPIN.has(name) && hasIcon(name);
  const cls = `ic ic-${size}${opts.off && !offArt ? ' ic-off' : ''}${spin ? ' ic-spin' : ''}${opts.className ? ' ' + opts.className : ''}`;
  const aria = opts.label ? ` role="img" aria-label="${esc(opts.label)}"` : ' aria-hidden="true"';
  if (hasIcon(name)) {
    return `<svg class="${cls}" data-ic="${esc(name)}"${aria} focusable="false"><use href="${spriteUrl()}#ic-${esc(offArt ? name + '-off' : name)}"></use></svg>`;
  }
  const text = opts.fallback ?? ICON_FALLBACK[name] ?? '';
  return `<span class="${cls} ic-emoji" data-ic="${esc(name)}"${aria}>${esc(text)}</span>`;
}

// 글 + 아이콘(§6): 아이콘 앞·글 뒤, after:true면 글 뒤(이동 화살·바깥 링크). stack:true면 아이콘 위·글 아래.
export function iconText(name, text, opts = {}) {
  const ic = icon(name, { ...opts, label: undefined });
  const t = `<span class="ic-txt">${esc(text)}</span>`;
  const cls = `ic-row${opts.stack ? ' ic-stack' : ''}`;
  return `<span class="${cls}">${opts.after ? t + ic : ic + t}</span>`;
}

// DOM 요소로 받고 싶을 때(createElement 쓰는 화면용)
export function iconEl(name, opts = {}) {
  const tpl = document.createElement('template');
  tpl.innerHTML = icon(name, opts);
  return tpl.content.firstElementChild;
}

// 이미 그려진 아이콘 자리의 그림만 바꿈(켜기/끄기 단추 등)
export function setIcon(el, name, opts = {}) {
  if (!el) return;
  const next = iconEl(name, opts);
  el.replaceWith(next);
  return next;
}
