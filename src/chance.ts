import { devMode } from "./devMode";

/** True with probability `p`, or always in dev mode */
export const chance = (p: number) => devMode.on || Math.random() < p;
