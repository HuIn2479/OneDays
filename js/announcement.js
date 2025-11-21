(function () {
  const cfg = window.__APP_CONFIG__ || {};

  const box = document.getElementById('announcement');
  if (!box) return;

  if (cfg.enableAnnouncement === false) {
    box.remove();
    delete window.__ANN_PENDING;
    delete window.__announceAdd;
    console.log('[Announcement] 公告系统已禁用，清理完成');
    return;
  }

  const host = box.querySelector('.ann-text');
  const iconEl = box.querySelector('.ann-icon');
  const closeBtn = box.querySelector('.ann-close');

  if (!host) {
    console.warn('[Announcement] 找不到文本容器 .ann-text');
    return;
  }

  const storeKey = cfg.announcementDismissKey || 'ann-card-v1';
  if (localStorage.getItem(storeKey)) {
    window.__announceRestore = () => {
      localStorage.removeItem(storeKey);
      location.reload();
    };
    box.remove();
    return;
  }

  if (iconEl) iconEl.textContent = cfg.announcementIcon || '📢';

  const cycle = Math.max(2000, cfg.announcementCycleInterval || 4800);
  const transition = Math.min(cycle - 600, cfg.announcementTransition || 500);

  const state = {
    items: [],
    index: 0,
    panes: [],
    mode: 'single',
    rotateTimer: null,
    remoteTimer: null,
    stack: null,
    seenKeys: new Set(),
  };

  function makeKey(msg) {
    if (msg == null) return null;
    if (typeof msg === 'string') return msg;
    if (typeof msg.text === 'string') return msg.text;
    return JSON.stringify(msg);
  }

  function normalizeMessage(msg) {
    if (!msg) return null;
    if (typeof msg === 'string') return { text: msg };
    if (typeof msg === 'object' && typeof msg.text === 'string') return { ...msg };
    return null;
  }

  function registerMessages(messages, opts = {}) {
    const normalized = [];
    const list = Array.isArray(messages) ? messages : [messages];

    for (const msg of list) {
      const normalizedMsg = normalizeMessage(msg);
      if (!normalizedMsg) continue;
      const key = makeKey(normalizedMsg);
      if (key && state.seenKeys.has(key)) continue;
      if (key) state.seenKeys.add(key);
      normalized.push(normalizedMsg);
    }

    if (!normalized.length) return;

    if (opts.priority === 'front') {
      state.items = normalized.concat(state.items);
      state.index = 0;
    } else {
      state.items = state.items.concat(normalized);
    }

    ensureRendering();
  }

  function getText(msg) {
    return msg && typeof msg.text === 'string' ? msg.text : '';
  }

  function stopRotation() {
    if (state.rotateTimer) {
      clearTimeout(state.rotateTimer);
      state.rotateTimer = null;
    }
  }

  function stopRemote() {
    if (state.remoteTimer) {
      clearTimeout(state.remoteTimer);
      state.remoteTimer = null;
    }
  }

  function showSingleMessage(msg) {
    stopRotation();
    state.mode = 'single';
    state.panes = [];
    if (state.stack) {
      state.stack.remove();
      state.stack = null;
    }
    host.textContent = getText(msg);
  }

  function ensureCarouselStructure() {
    if (state.mode === 'carousel' && state.stack && state.panes.length === 2) return;

    stopRotation();
    host.innerHTML = '';

    const stack = document.createElement('div');
    stack.className = 'ann-stack';
    const paneA = document.createElement('span');
    paneA.className = 'ann-pane active';
    const paneB = document.createElement('span');
    paneB.className = 'ann-pane';
    stack.appendChild(paneA);
    stack.appendChild(paneB);
    host.appendChild(stack);

    state.stack = stack;
    state.panes = [paneA, paneB];
    state.mode = 'carousel';

    requestAnimationFrame(() => {
      stack.style.height = paneA.offsetHeight + 'px';
    });
  }

  function renderCurrent() {
    if (state.items.length === 0) {
      box.remove();
      stopRotation();
      stopRemote();
      delete window.__announceAdd;
      return;
    }

    if (state.items.length === 1) {
      showSingleMessage(state.items[0]);
      return;
    }

    ensureCarouselStructure();

    const [currentPane, nextPane] = state.panes;
    const currentMsg = state.items[state.index % state.items.length];
    currentPane.textContent = getText(currentMsg);
    currentPane.classList.add('active');
    nextPane.classList.remove('active');
    state.index = (state.index + 1) % state.items.length;

    requestAnimationFrame(() => {
      state.stack.style.height = currentPane.offsetHeight + 'px';
    });

    scheduleNextFlip();
  }

  function scheduleNextFlip() {
    stopRotation();
    state.rotateTimer = window.setTimeout(flipPane, cycle);
  }

  function flipPane() {
    if (state.mode !== 'carousel' || state.panes.length !== 2) return;
    if (state.items.length <= 1) {
      ensureRendering();
      return;
    }

    const [currentPane, nextPane] = state.panes;
    const nextMsg = state.items[state.index % state.items.length];
    state.index = (state.index + 1) % state.items.length;

    nextPane.textContent = getText(nextMsg);

    requestAnimationFrame(() => {
      const newHeight = nextPane.offsetHeight;
      state.stack.style.height = newHeight + 'px';

      currentPane.classList.remove('active');
      nextPane.classList.add('active');

      const duration = transition + 'ms';
      currentPane.style.setProperty('--ann-trans', duration);
      nextPane.style.setProperty('--ann-trans', duration);
    });

    state.panes.reverse();
    scheduleNextFlip();
  }

  function ensureRendering() {
    if (!box || !box.parentNode) return;
    if (state.index >= state.items.length) {
      state.index = 0;
    }
    renderCurrent();
  }

  function fetchRemoteMessages() {
    if (!cfg.enableAnnouncementRemoteFeed) return;
    const source = cfg.announcementRemoteSource;
    if (!source) return;

    const refresh = Math.max(60000, cfg.announcementRemoteRefresh || 3600000);

    const doFetch = () => {
      fetch(source, { cache: 'no-store' })
        .then(res => (res.ok ? res.json() : Promise.reject(new Error(res.statusText))))
        .then(data => {
          if (Array.isArray(data)) {
            registerMessages(data);
          } else if (data && Array.isArray(data.messages)) {
            registerMessages(data.messages);
          }
        })
        .catch(err => {
          console.warn('[Announcement] 远程公告获取失败:', err);
        })
        .finally(() => {
          state.remoteTimer = window.setTimeout(doFetch, refresh);
        });
    };

    doFetch();
  }

  function handleClose() {
    stopRotation();
    stopRemote();
    delete window.__announceAdd;
    box.classList.add('ann-hide');
    setTimeout(() => {
      if (box.parentNode) {
        box.remove();
      }
    }, 400);
  }

  if (cfg.enableAnnouncementClose && closeBtn) {
    closeBtn.hidden = false;
    closeBtn.addEventListener('click', () => {
      try {
        localStorage.setItem(storeKey, '1');
      } catch (_) {
        /* ignore */
      }
      handleClose();
    });
  }

  box.classList.add('announcement-card');
  box.hidden = false;

  registerMessages(Array.isArray(window.__ANN_PENDING) ? window.__ANN_PENDING.splice(0) : [], {
    priority: 'front',
  });
  registerMessages((cfg.announcementMessages || []).filter(Boolean));

  if (!state.items.length) {
    box.remove();
    return;
  }

  ensureRendering();

  window.__announceAdd = (msg, opts) => {
    if (!box || !box.parentNode || box.classList.contains('ann-hide')) {
      console.warn('[Announcement] 公告已关闭，无法添加新消息');
      return;
    }
    registerMessages(msg, opts);
  };

  fetchRemoteMessages();
})();
