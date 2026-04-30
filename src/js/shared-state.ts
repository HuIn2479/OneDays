// shared-state.ts — 提取 extras.js ↔ update-check.js 之间的共享状态，打破循环依赖
export let UPDATE_LOCK = false;
export let PENDING_UPDATE: string | undefined;
export let MEM_RELEASED = 0;
export let MEM_RELEASED_LEVEL = 0;

export function setUpdateLock(val: boolean) {
  UPDATE_LOCK = val;
}
export function setPendingUpdate(val: string | undefined) {
  PENDING_UPDATE = val;
}
export function setMemReleased(level: number) {
  MEM_RELEASED = level;
  MEM_RELEASED_LEVEL = level;
}
