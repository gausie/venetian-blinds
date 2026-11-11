import { expect, test } from "vitest";
import { MAX_RAISED, createState, update, type Input } from "../src/demo";

const idle: Input = { up: false, down: false, select: false, reset: false, blackAndWhite: false };

test("up raises the blinds one line per frame, clamped at the top", () => {
  const s = createState();
  for (let i = 0; i < 200; i++) update(s, { ...idle, up: true });
  expect(s.raised).toBe(MAX_RAISED);
  update(s, { ...idle, down: true });
  expect(s.raised).toBe(MAX_RAISED - 1);
});

test("down stops at fully closed", () => {
  const s = createState();
  update(s, { ...idle, down: true });
  expect(s.raised).toBe(0);
});

test("select locks the joystick until reset, as in the original", () => {
  const s = createState();
  update(s, { ...idle, select: true });
  update(s, idle);
  update(s, { ...idle, up: true });
  expect(s.raised).toBe(0);
  update(s, { ...idle, reset: true });
  update(s, { ...idle, up: true });
  expect(s.raised).toBe(1);
});
