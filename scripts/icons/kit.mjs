// 아이콘 그리기 도우미. 사람 = 동동이 머리(둥글고 살짝 넓은 큰 머리).
export const head = (cx, cy, r) => `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${+(r * 0.93).toFixed(2)}"/>`;
export const slash = '<path d="M4 4l16 16"/>';
