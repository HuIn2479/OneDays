import { APP_CONFIG } from './config';

const cfg = APP_CONFIG || {};

const {
  title,
  subtitle,
  enableSplash,
  splashMinDuration = 0,
  removeSplashIfFast,
} = cfg as Record<string, any>;

// Inject basic copy
const yearEl = document.getElementById('year');
yearEl && (yearEl.textContent = String(new Date().getFullYear()));
if (title) {
  const t = document.getElementById('siteTitle');
  t && (t.textContent = title);
  document.title = title + "'S Home";
}
if (subtitle) {
  const s = document.getElementById('siteSubtitle');
  s && (s.textContent = subtitle);
}

// Splash handling
(function handleSplash(): void {
  const splash = document.getElementById('splash');
  if (!splash) return;
  if (!enableSplash) {
    splash.remove();
    return;
  }
  const START: number = performance.now();
  const FAST_THRESHOLD = 400;
  const QUICK_EXTRA = 200;
  const HARD_TIMEOUT = 4000;
  let done = false;
  function fade(): void {
    if (done) return;
    done = true;
    splash.classList.add('fade-out');
    document.dispatchEvent(new CustomEvent('splash:fade'));
  }
  function finish(): void {
    const elapsed = performance.now() - START;
    const wait = Math.max(0, splashMinDuration - elapsed);
    setTimeout(fade, wait);
  }
  window.addEventListener(
    'load',
    () => {
      if (removeSplashIfFast) {
        const elapsed = performance.now() - START;
        if (elapsed < FAST_THRESHOLD) {
          const remain = Math.max(0, QUICK_EXTRA - elapsed);
          setTimeout(finish, remain);
          return;
        }
      }
      finish();
    },
    { once: true },
  );
  setTimeout(fade, HARD_TIMEOUT);
})();

// Clean legacy PWA
(function cleanLegacyPWA(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => regs.forEach((r) => r.unregister()))
      .catch(() => {});
  }
  if ('caches' in window) {
    caches
      .keys()
      .then((keys) =>
        keys
          .filter((k) => k.startsWith('onedays-'))
          .forEach((k) => caches.delete(k)),
      )
      .catch(() => {});
  }
})();

// Signal init complete
document.dispatchEvent(new CustomEvent('app:init'));
