(function () {
  const config = window.__APP_CONFIG__ || {};
  const updateConfig = config.update || {};
  const ENABLED = updateConfig.enable !== false && config.enableUpdateCheck !== false;
  if (!ENABLED) return;

  const t = window.__I18N__?.t || (k => k);

  const DEFAULTS = Object.freeze({
    version: 'dev',
    source: '/js/config.js',
    checkInterval: 300000,
    quietWindow: 300000,
    notifyDelay: 0,
    maxRetries: 3,
    retryBaseDelay: 400,
  });

  const SETTINGS = {
    version: config.version || DEFAULTS.version,
    source: updateConfig.source || config.updateSource || DEFAULTS.source,
    checkInterval:
      updateConfig.checkInterval || config.updateCheckInterval || DEFAULTS.checkInterval,
    quietWindow: updateConfig.quietWindow || config.updateQuietWindow || DEFAULTS.quietWindow,
    notifyDelay: updateConfig.notifyDelay || config.updateNotifyDelay || DEFAULTS.notifyDelay,
    maxRetries: Math.max(1, updateConfig.maxRetries || DEFAULTS.maxRetries),
    retryBaseDelay: updateConfig.retryBaseDelay || DEFAULTS.retryBaseDelay,
  };

  const STORAGE_KEYS = {
    version: 'onedays-version',
    lastUpdate: 'onedays-last-update',
    gapList: 'onedays-version-gap',
  };

  const storage = {
    get(key, fallback = null) {
      try {
        const value = window.localStorage.getItem(key);
        return value === null ? fallback : value;
      } catch (err) {
        console.warn('[Update] localStorage.get failed:', err);
        return fallback;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch (err) {
        console.warn('[Update] localStorage.set failed:', err);
      }
    },
    remove(key) {
      try {
        window.localStorage.removeItem(key);
      } catch (err) {
        console.warn('[Update] localStorage.remove failed:', err);
      }
    },
  };

  function readGapList() {
    const raw = storage.get(STORAGE_KEYS.gapList);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('[Update] Failed to parse gap list:', err);
      return [];
    }
  }

  const announcer = {
    push(text) {
      if (config.enableAnnouncement === false) {
        console.log('[Update] Announcement disabled, skip:', text);
        return;
      }
      const payload =
        typeof text === 'string' ? { text, isUpdate: true } : { ...text, isUpdate: true };
      if (typeof window.__announceAdd === 'function') {
        window.__announceAdd(payload, { priority: 'front', updateMessage: true });
      } else {
        window.__ANN_PENDING = window.__ANN_PENDING || [];
        window.__ANN_PENDING.unshift(payload);
      }
    },
  };

  const splashActive = () => {
    const splash = document.getElementById('splash');
    return !!(splash && !splash.classList.contains('fade-out'));
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
    parse(text) {
      for (const pattern of this.patterns) {
        const match = text.match(pattern);
        if (match && match[1]) return match[1];
      }
      return null;
    },
  };

  const cacheCleaner = {
    async flushAll() {
      try {
        if (typeof window.releaseMemory === 'function') {
          window.releaseMemory(2);
        }
      } catch (err) {
        console.warn('[Update] releaseMemory failed:', err);
      }

      if ('caches' in window) {
        try {
          const keys = await window.caches.keys();
          await Promise.allSettled(keys.map(key => window.caches.delete(key)));
        } catch (err) {
          console.warn('[Update] CacheStorage cleanup failed:', err);
        }
      }
    },
  };

  const state = {
    storedVersion: storage.get(STORAGE_KEYS.version) || SETTINGS.version,
    lastUpdate: parseInt(storage.get(STORAGE_KEYS.lastUpdate) || '0', 10) || 0,
    gapList: readGapList(),
    inFlight: false,
    timer: null,
  };

  if (!storage.get(STORAGE_KEYS.version)) {
    storage.set(STORAGE_KEYS.version, state.storedVersion);
  }

  function persistGapList() {
    const limited = state.gapList.slice(-6);
    storage.set(STORAGE_KEYS.gapList, JSON.stringify(limited));
  }

  function lockUpdate() {
    window.__UPDATE_LOCK__ = true;
  }

  function unlockUpdate() {
    delete window.__UPDATE_LOCK__;
  }

  function buildGapInfo() {
    if (state.gapList.length <= 1) return '';
    return ' ' + t('updateCumulative') + ' ' + state.gapList.length + ' ' + t('updateVersionSpan');
  }

  async function fetchRemoteVersion(attempt = 0) {
    const url = SETTINGS.source + (SETTINGS.source.includes('?') ? '&' : '?') + 'v=' + Date.now();
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) return null;
      const text = await response.text();
      return versionParser.parse(text);
    } catch (err) {
      if (attempt + 1 >= SETTINGS.maxRetries) return null;
      const delay = SETTINGS.retryBaseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchRemoteVersion(attempt + 1);
    }
  }

  async function applyUpdate(remoteVersion) {
    lockUpdate();
    const stamp = Date.now();
    storage.set(STORAGE_KEYS.version, 'pending-' + stamp);
    storage.set(STORAGE_KEYS.lastUpdate, stamp.toString());
    state.lastUpdate = stamp;

    await cacheCleaner.flushAll();

    const url = new URL(window.location.href);
    url.searchParams.set('v', stamp);

    if (remoteVersion) {
      window.__PENDING_UPDATE__ = undefined;
    }

    window.location.replace(url.toString());
  }

  function scheduleNext() {
    if (state.timer) clearTimeout(state.timer);
    state.timer = window.setTimeout(checkForUpdate, SETTINGS.checkInterval);
  }

  function shouldDeferByQuietWindow() {
    return Date.now() - state.lastUpdate < SETTINGS.quietWindow;
  }

  function queueGap(version) {
    const last = state.gapList[state.gapList.length - 1];
    if (last === version) return;
    state.gapList.push(version);
    persistGapList();
  }

  function proceed(remoteVersion) {
    if (shouldDeferByQuietWindow()) {
      announcer.push(t('updateNewVersion') + ' ' + remoteVersion + ' ' + t('updateQuietPeriod'));
      scheduleNext();
      return;
    }

    const runRefresh = () => {
      lockUpdate();
      announcer.push(
        t('updateFound') + ' ' + remoteVersion + buildGapInfo() + t('updateWillRefresh')
      );
      setTimeout(() => applyUpdate(remoteVersion), 1500);
    };

    if (document.hidden) {
      window.__PENDING_UPDATE__ = remoteVersion;
      announcer.push(t('updateReady') + ' ' + remoteVersion + ' ' + t('updateReadySuffix'));
      scheduleNext();
      return;
    }

    if (splashActive()) {
      const waitSplash = () => {
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

  async function checkForUpdate() {
    if (state.inFlight) return;
    state.inFlight = true;

    const remote = await fetchRemoteVersion();

    state.inFlight = false;

    if (!remote) {
      scheduleNext();
      return;
    }

    if (window.__PENDING_UPDATE__ && window.__PENDING_UPDATE__ === remote) {
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

  function handlePostRefresh() {
    if (!state.storedVersion || !state.storedVersion.startsWith('pending-')) return;

    storage.set(STORAGE_KEYS.version, SETTINGS.version);
    state.storedVersion = SETTINGS.version;
    const now = Date.now();
    state.lastUpdate = now;
    storage.set(STORAGE_KEYS.lastUpdate, now.toString());

    let message = t('updateComplete') + ' ' + SETTINGS.version;
    if (state.gapList.length > 1) {
      message +=
        ' ' + t('updateCumulative') + ' ' + state.gapList.length + ' ' + t('updateVersions');
    }
    announcer.push(message);

    state.gapList = [];
    persistGapList();
    unlockUpdate();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    if (!window.__PENDING_UPDATE__) return;

    const version = window.__PENDING_UPDATE__;
    window.__PENDING_UPDATE__ = undefined;
    announcer.push(t('updateApplying') + ' ' + version + ' …');
    setTimeout(() => applyUpdate(version), 600);
  });

  window.applySiteUpdate = () => applyUpdate();
  window.checkForUpdates = () => {
    if (state.timer) clearTimeout(state.timer);
    checkForUpdate();
  };

  handlePostRefresh();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkForUpdate, { once: true });
  } else {
    checkForUpdate();
  }
})();
