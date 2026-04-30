import { APP_CONFIG } from './config';

const rand = (a: number, b: number = a): number => Math.floor(Math.random() * (b - a + 1)) + a;

let lastMove: number = 0;
let globalCatEl: HTMLElement | null = null;
let keyListener: ((e: KeyboardEvent) => void) | null = null;
let safetyTimer: ReturnType<typeof setTimeout> | null = null;
let hoverEvents: string[] = [];

function repositionCat(): void {
  const el = document.getElementById('maomao');
  if (!el) return;
  const now = Date.now();
  if (now - lastMove < 250) return;
  lastMove = now;
  const bottomVH = rand(5, 80);
  const rightPx = rand(-5, -2);
  el.style.bottom = bottomVH + 'vh';
  el.style.right = rightPx + 'px';
}

export function initMaomao(): boolean {
  const el = document.getElementById('maomao');
  if (!el) return false;
  if ((el as any).__maomaoInited) return true;
  (el as any).__maomaoInited = true;
  globalCatEl = el;
  const cfg = APP_CONFIG || {};
  const curTrans = getComputedStyle(el).transition || '';
  if (!/bottom|right/.test(curTrans)) {
    el.style.transition =
      (curTrans ? curTrans + ',' : '') +
      'bottom .8s cubic-bezier(.4,0,.2,1), right .8s cubic-bezier(.4,0,.2,1)';
  }
  repositionCat();
  hoverEvents = ['mouseleave', 'click', 'touchend', 'mouseenter'];
  hoverEvents.forEach((ev) =>
    el.addEventListener(ev, repositionCat, { passive: true }),
  );
  keyListener = (e: KeyboardEvent) => {
    if (e.code === 'Space' && !e.repeat) repositionCat();
  };
  window.addEventListener('keydown', keyListener);
  safetyTimer = setTimeout(() => {
    if (lastMove === 0) repositionCat();
  }, 5000);

  // Auto drift
  let autoTimer: ReturnType<typeof setTimeout> | null = null;
  const base: number = parseInt(cfg.catDriftInterval || 0, 10);
  function schedule(): void {
    if (!base) return;
    clearTimeout(autoTimer!);
    const next = base * (0.7 + Math.random() * 0.7);
    autoTimer = setTimeout(() => {
      repositionCat();
      schedule();
    }, next);
    (el as any).__mmAutoTimer = autoTimer;
  }
  if (base > 0) {
    schedule();
    const resetEvents = ['click', 'mousemove', 'touchstart'];
    const resetHandler = (): void => base && schedule();
    resetEvents.forEach((ev) =>
      window.addEventListener(ev, resetHandler, { passive: true }),
    );
    const visListener = (): void => {
      if (document.hidden) clearTimeout(autoTimer!);
      else schedule();
    };
    document.addEventListener('visibilitychange', visListener);
    (el as any).__mmResetEvents = resetEvents;
    (el as any).__mmResetHandler = resetHandler;
    (el as any).__mmVisListener = visListener;
  }

  return true;
}

export function detachMaomao(): void {
  if (!globalCatEl) return;
  try {
    hoverEvents.forEach((ev) =>
      globalCatEl!.removeEventListener(ev, repositionCat),
    );
    if (keyListener) window.removeEventListener('keydown', keyListener);
    if (safetyTimer) clearTimeout(safetyTimer);
    if ((globalCatEl as any).__mmAutoTimer) clearTimeout((globalCatEl as any).__mmAutoTimer);
    if ((globalCatEl as any).__mmResetEvents && (globalCatEl as any).__mmResetHandler) {
      (globalCatEl as any).__mmResetEvents.forEach((ev: string) =>
        window.removeEventListener(ev, (globalCatEl as any).__mmResetHandler),
      );
    }
    if ((globalCatEl as any).__mmVisListener)
      document.removeEventListener(
        'visibilitychange',
        (globalCatEl as any).__mmVisListener,
      );
  } catch (_) { /* ignore */ }
  (globalCatEl as any).__maomaoInited = false;
  globalCatEl = null;
}

// Auto-init on DOMContentLoaded or immediately
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMaomao, { once: true });
} else {
  initMaomao();
}

// Backward-compat bridge
(window as any).initMaomao = initMaomao;
(window as any).detachMaomao = detachMaomao;
(window as any).duoMaomao = repositionCat;
