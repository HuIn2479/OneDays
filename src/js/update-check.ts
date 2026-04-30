import { APP_CONFIG } from './config';
import { i18n } from './i18n';
import { createToast } from './core';
import { setUpdateLock, setPendingUpdate, setMemReleased, UPDATE_LOCK, PENDING_UPDATE } from './shared-state';

interface StorageKeys {
  version: string;
  lastUpdate: string;
  gapList: string;
}

interface Settings {
  version: string;
  source: string;
  checkInterval: number;
  quietWindow: number;
  notifyDelay: number;
  maxRetries: number;
  retryBaseDelay: number;
}

interface UpdateConfig {
  enable?: boolean;
  source?: string;
  checkInterval?: number;
  quietWindow?: number;
  notifyDelay?: number;
  maxRetries?: number;
  retryBaseDelay?: number;
}

interface AppState {
  storedVersion: string;
  lastUpdate: number;
  gapList: string[];
  inFlight: boolean;
  timer: ReturnType<typeof setTimeout> | null;
}

const updateConfig: UpdateConfig = (APP_CONFIG as any).update || {};
const ENABLED: boolean =
  updateConfig.enable !== false && (APP_CONFIG as any).enableUpdateCheck !== false;

const DEFAULTS: Readonly<Settings> = Object.freeze({
  version: "dev",
  source: "/version.json",
  checkInterval: 300000,
  quietWindow: 300000,
  notifyDelay: 0,
  maxRetries: 3,
  retryBaseDelay: 400,
});

const SETTINGS: Settings = {
  version: (APP_CONFIG as any).version || DEFAULTS.version,
  source: updateConfig.source || (APP_CONFIG as any).updateSource || DEFAULTS.source,
  checkInterval:
    updateConfig.checkInterval ||
    (APP_CONFIG as any).updateCheckInterval ||
    DEFAULTS.checkInterval,
  quietWindow:
    updateConfig.quietWindow ||
    (APP_CONFIG as any).updateQuietWindow ||
    DEFAULTS.quietWindow,
  notifyDelay:
    updateConfig.notifyDelay ||
    (APP_CONFIG as any).updateNotifyDelay ||
    DEFAULTS.notifyDelay,
  maxRetries: Math.max(1, updateConfig.maxRetries || DEFAULTS.maxRetries),
  retryBaseDelay: updateConfig.retryBaseDelay || DEFAULTS.retryBaseDelay,
};

const STORAGE_KEYS: StorageKeys = {
  version: "onedays-version",
  lastUpdate: "onedays-last-update",
  gapList: "onedays-version-gap",
};

const storage = {
  get(key: string, fallback: string | null = null): string | null {
    try {
      const value = window.localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (err) {
      console.warn("[Update] localStorage.get failed:", err);
      return fallback;
    }
  },
  set(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      console.warn("[Update] localStorage.set failed:", err);
    }
  },
  remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch (err) {
      console.warn("[Update] localStorage.remove failed:", err);
    }
  },
};

function readGapList(): string[] {
  const raw = storage.get(STORAGE_KEYS.gapList);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("[Update] Failed to parse gap list:", err);
    return [];
  }
}

const announcer = {
  push(text: string | Record<string, any>): void {
    if ((APP_CONFIG as any).enableAnnouncement === false) {
      console.log("[Update] Announcement disabled, skip:", text);
      return;
    }
    const payload =
      typeof text === "string"
        ? { text, isUpdate: true }
        : { ...text, isUpdate: true };
    const announceAdd = (window as any).__announceAdd;
    if (typeof announceAdd === "function") {
      announceAdd(payload, {
        priority: "front",
        updateMessage: true,
      });
    } else {
      (window as any).__ANN_PENDING = (window as any).__ANN_PENDING || [];
      (window as any).__ANN_PENDING.unshift(payload);
    }
  },
};

const splashActive = (): boolean => {
  const splash = document.getElementById("splash");
  return !!(splash && !splash.classList.contains("fade-out"));
};

const versionParser = {
  patterns: [
    /version\s*:\s*"([^"]+)"/,
    /version\s*:\s*'([^']+)'/,
    /"version"\s*:\s*"([^"]+)"/,
    /(?:const|let|var)\s+VERSION\s*=\s*"([^"]+)"/,
    /(?:const|let|var)\s+VERSION\s*=\s*'([^']+)'/,
    /VERSION\s*:\s*"([^"]+)"/,
    /VERSION\s*:\s*'([^']+)'/,
    /\bv?(\d+\.\d+(?:\.\d+)?(?:-[a-zA-Z0-9\-.]+)?)\b/,
  ],
  parse(text: string): string | null {
    for (const pattern of this.patterns) {
      const match = text.match(pattern);
      if (match && match[1]) return match[1];
    }
    return null;
  },
};

const cacheCleaner = {
  async flushAll(): Promise<void> {
    try {
      const m = await import('./extras');
      m.releaseMemory(2);
    } catch (_) {}

    // 清除 CacheStorage
    if ("caches" in window) {
      try {
        const keys = await window.caches.keys();
        await Promise.allSettled(
          keys.map((key) => window.caches.delete(key)),
        );
      } catch (err) {
        console.warn("[Update] CacheStorage cleanup failed:", err);
      }
    }

    // 注销 Service Worker 以确保下次加载全新资源
    if ("serviceWorker" in navigator) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.allSettled(regs.map((r) => r.unregister()));
      } catch (err) {
        console.warn("[Update] SW unregister failed:", err);
      }
    }
  },
};

const state: AppState = {
  storedVersion: storage.get(STORAGE_KEYS.version) || SETTINGS.version,
  lastUpdate: parseInt(storage.get(STORAGE_KEYS.lastUpdate) || "0", 10) || 0,
  gapList: readGapList(),
  inFlight: false,
  timer: null,
};

if (!storage.get(STORAGE_KEYS.version)) {
  storage.set(STORAGE_KEYS.version, state.storedVersion);
}

function persistGapList(): void {
  const limited = state.gapList.slice(-6);
  storage.set(STORAGE_KEYS.gapList, JSON.stringify(limited));
}

function lockUpdate(): void {
  setUpdateLock(true);
}

function unlockUpdate(): void {
  setUpdateLock(false);
}

function buildGapInfo(): string {
  if (state.gapList.length <= 1) return "";
  return (
    " " +
    i18n.t("updateCumulative") +
    " " +
    state.gapList.length +
    " " +
    i18n.t("updateVersionSpan")
  );
}

async function fetchRemoteVersion(attempt: number = 0): Promise<string | null> {
  const url =
    SETTINGS.source +
    (SETTINGS.source.includes("?") ? "&" : "?") +
    "v=" +
    Date.now();
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    const text = await response.text();
    return versionParser.parse(text);
  } catch (err) {
    if (attempt + 1 >= SETTINGS.maxRetries) return null;
    const delay = SETTINGS.retryBaseDelay * Math.pow(2, attempt);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchRemoteVersion(attempt + 1);
  }
}

async function applyUpdate(remoteVersion?: string): Promise<void> {
  lockUpdate();
  const stamp = Date.now();
  storage.set(STORAGE_KEYS.version, "pending-" + stamp);
  storage.set(STORAGE_KEYS.lastUpdate, stamp.toString());
  state.lastUpdate = stamp;

  await cacheCleaner.flushAll();

  const url = new URL(window.location.href);
  url.searchParams.set("v", stamp.toString());

  if (remoteVersion) {
    setPendingUpdate(undefined as any);
  }

  window.location.replace(url.toString());
}

function scheduleNext(): void {
  if (state.timer) clearTimeout(state.timer);
  state.timer = setTimeout(checkForUpdate, SETTINGS.checkInterval);
}

function shouldDeferByQuietWindow(): boolean {
  return Date.now() - state.lastUpdate < SETTINGS.quietWindow;
}

function queueGap(version: string): void {
  const last = state.gapList[state.gapList.length - 1];
  if (last === version) return;
  state.gapList.push(version);
  persistGapList();
}

function proceed(remoteVersion: string): void {
  if (shouldDeferByQuietWindow()) {
    announcer.push(
      i18n.t("updateNewVersion") +
        " " +
        remoteVersion +
        " " +
        i18n.t("updateQuietPeriod"),
    );
    createToast({
      text: i18n.t("updateNewVersion") + " " + remoteVersion,
      variant: "accent",
      icon: "🔄",
      id: "update-defer",
      duration: 4000,
    });
    scheduleNext();
    return;
  }

  const runRefresh = (): void => {
    lockUpdate();
    announcer.push(
      i18n.t("updateFound") +
        " " +
        remoteVersion +
        buildGapInfo() +
        i18n.t("updateWillRefresh"),
    );
    createToast({
      text: i18n.t("updateFound") + " " + remoteVersion,
      variant: "success",
      icon: "🚀",
      id: "update-found",
      duration: 3000,
    });
    setTimeout(() => applyUpdate(remoteVersion), 1500);
  };

  if (document.hidden) {
    setPendingUpdate(remoteVersion);
    announcer.push(
      i18n.t("updateReady") + " " + remoteVersion + " " + i18n.t("updateReadySuffix"),
    );
    createToast({
      text: i18n.t("updateReady") + " " + remoteVersion,
      variant: "neutral",
      icon: "⏳",
      id: "update-ready",
      duration: 4000,
      closable: true,
    });
    scheduleNext();
    return;
  }

  if (splashActive()) {
    const waitSplash = (): void => {
      if (!splashActive()) {
        runRefresh();
      } else {
        setTimeout(waitSplash, 380);
      }
    };
    waitSplash();
    return;
  }

  setTimeout(runRefresh, SETTINGS.notifyDelay);
}

async function checkForUpdate(): Promise<void> {
  if (!ENABLED) return;
  if (state.inFlight) return;
  state.inFlight = true;

  const remote = await fetchRemoteVersion();

  state.inFlight = false;

  if (!remote) {
    scheduleNext();
    return;
  }

  if (PENDING_UPDATE && PENDING_UPDATE === remote) {
    scheduleNext();
    return;
  }

  if (remote !== state.storedVersion) {
    queueGap(remote);
    proceed(remote);
  } else {
    scheduleNext();
  }
}

function handlePostRefresh(): void {
  if (!state.storedVersion || !state.storedVersion.startsWith("pending-"))
    return;

  storage.set(STORAGE_KEYS.version, SETTINGS.version);
  state.storedVersion = SETTINGS.version;
  const now = Date.now();
  state.lastUpdate = now;
  storage.set(STORAGE_KEYS.lastUpdate, now.toString());

  let message = i18n.t("updateComplete") + " " + SETTINGS.version;
  if (state.gapList.length > 1) {
    message +=
      " " +
      i18n.t("updateCumulative") +
      " " +
      state.gapList.length +
      " " +
      i18n.t("updateVersions");
  }
  announcer.push(message);
  createToast({
    text: message,
    variant: "success",
    icon: "✅",
    id: "update-done",
    duration: 5000,
  });

  state.gapList = [];
  persistGapList();
  unlockUpdate();
}

export function applySiteUpdate(): void {
  applyUpdate();
}

export function checkForUpdates(): void {
  if (state.timer) clearTimeout(state.timer);
  checkForUpdate();
}

// Bridge for backward compatibility
(window as any).applySiteUpdate = applySiteUpdate;
(window as any).checkForUpdates = checkForUpdates;

document.addEventListener("visibilitychange", () => {
  if (document.hidden) return;
  const pending = PENDING_UPDATE;
  if (!pending) return;

  setPendingUpdate(undefined as any);
  announcer.push(i18n.t("updateApplying") + " " + pending + " …");
  createToast({
    text: i18n.t("updateApplying") + " " + pending,
    variant: "accent",
    icon: "🔄",
    id: "update-apply",
    duration: 2000,
  });
  setTimeout(() => applyUpdate(pending), 600);
});

handlePostRefresh();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => checkForUpdate(), {
    once: true,
  });
} else {
  checkForUpdate();
}
