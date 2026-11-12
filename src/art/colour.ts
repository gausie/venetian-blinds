const channels = (c: number) => [(c >> 16) & 0xff, (c >> 8) & 0xff, c & 0xff];

/** `a` blended towards `b` by `t` (0 to 1) */
export function mix(a: number, b: number, t: number) {
  const [ar = 0, ag = 0, ab = 0] = channels(a);
  const [br = 0, bg = 0, bb = 0] = channels(b);
  const lerp = (x: number, y: number) => Math.round(x + (y - x) * t);
  return (lerp(ar, br) << 16) | (lerp(ag, bg) << 8) | lerp(ab, bb);
}

/**
 * A die roll that always comes out the same for the same `x`, `y` and `salt`,
 * so procedural detail doesn't shimmer between redraws
 */
export const roll = (x: number, y: number, salt: number, sides: number) =>
  (((x * 73856093) ^ (y * 19349663) ^ (salt * 83492791)) >>> 0) % sides;
