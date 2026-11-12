/** Every chance comes off and everything runs 10× faster. Needs VITE_DEV_MODE; toggled by clicking the logo. */
const SPEED = 10;

export const devModeAvailable = Boolean(import.meta.env.VITE_DEV_MODE);

let on = false;
const listeners = new Set<(on: boolean) => void>();

export const devMode = {
  get on() {
    return on;
  },
  get speed() {
    return on ? SPEED : 1;
  },
  toggle() {
    devMode.set(!on);
  },
  set(value: boolean) {
    on = devModeAvailable && value;
    for (const listener of listeners) listener(on);
  },
  subscribe(listener: (on: boolean) => void) {
    listeners.add(listener);
  },
};
