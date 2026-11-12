/** Smoothed 0 to 1 as `t` goes from `a` to `b` */
export function ease(t: number, a: number, b: number) {
  const p = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return p * p * (3 - 2 * p);
}
