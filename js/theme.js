(() => {
  const root = document.documentElement;
  const cfg = window.__APP_CONFIG__ || {};
  const THEME_KEY = "onedays-theme";
  const ACC_KEY = "onedays-accent";

  const toggleBtn = document.getElementById("themeToggle");
  const accents = Array.isArray(cfg.accents) ? cfg.accents : [];
  const defaultAccentIndex =
    Number.parseInt(cfg.defaultAccentIndex ?? 0, 10) || 0;

  let accentIdx =
    Number.parseInt(localStorage.getItem(ACC_KEY) ?? defaultAccentIndex, 10) ||
    0;
  let autoTimer = null;

  const LONG_PRESS_DELAY = 550;
  const DOUBLE_TAP_INTERVAL = 400;

  let pressTimer = null;
  let longPressTriggered = false;
  let skipNextClick = false;

  let langPanel = null;
  let langHeader = null;
  let langHint = null;
  let langThemeRow = null;
  let langThemeTitle = null;
  let langThemeActions = null;
  let langList = null;
  let langAccentRow = null;
  let langAccentTitle = null;
  let langAccentList = null;

  const i18nApi = window.__I18N__ || {};
  const translate = (key, fallback) =>
    typeof i18nApi.t === "function"
      ? i18nApi.t(key, fallback ?? key)
      : (fallback ?? key);

  const MODE_OPTIONS = [
    { mode: "auto", icon: "🌓", label: "languageThemeAuto" },
    { mode: "light", icon: "🌤", label: "languageThemeLight" },
    { mode: "dark", icon: "💤", label: "languageThemeDark" },
  ];

  const accentPanelEnabled =
    cfg.enableAccentPanel !== false && accents.length > 1;
  if (accentPanelEnabled) {
    window.__THEME_PANEL_SUPPORTS_ACCENTS__ = true;
  } else if (window.__THEME_PANEL_SUPPORTS_ACCENTS__) {
    window.__THEME_PANEL_SUPPORTS_ACCENTS__ = false;
  }

  const autoRotateEnabled = !!cfg.enableAccentAutoRotate;
  const autoRotateSchedule = parseSchedule(cfg.accentRotateSchedule);

  function parseSchedule(raw) {
    if (!autoRotateEnabled) return [];
    if (!raw || typeof raw !== "object") return [];

    const namedSlots = {
      midnight: 0,
      dawn: 5 * 60 + 30,
      morning: 9 * 60,
      noon: 12 * 60,
      afternoon: 15 * 60,
      dusk: 18 * 60,
      evening: 20 * 60,
      night: 22 * 60,
    };

    const entries = [];
    for (const [timeKey, indexValue] of Object.entries(raw)) {
      const index = Number.parseInt(indexValue, 10);
      if (!Number.isFinite(index)) continue;

      let minutes = null;
      if (typeof timeKey === "number") {
        minutes = timeKey;
      } else if (typeof timeKey === "string") {
        const key = timeKey.trim().toLowerCase();
        if (/^\d{1,2}:\d{2}$/.test(key)) {
          const [h, m] = key.split(":").map(Number);
          minutes = (h * 60 + m) % (24 * 60);
        } else if (/^\d+$/.test(key)) {
          minutes = Number(key) % (24 * 60);
        } else if (key in namedSlots) {
          minutes = namedSlots[key];
        }
      }

      if (minutes == null) continue;
      const normalized = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
      entries.push({ minutes: normalized, index });
    }

    entries.sort((a, b) => a.minutes - b.minutes);
    return entries;
  }

  function setAccent(i, opts = {}) {
    if (!accents.length) return;
    accentIdx = (i + accents.length) % accents.length;
    const accent = accents[accentIdx];
    root.style.setProperty("--accent", accent);
    // 使用 color-mix 生成 hover 色，兼容所有颜色格式
    root.style.setProperty(
      "--accent-hover",
      `color-mix(in srgb, ${accent} 85%, #000)`,
    );
    if (toggleBtn) {
      toggleBtn.setAttribute("data-accent", String(accentIdx));
    }
    if (opts.persist !== false) {
      try {
        localStorage.setItem(ACC_KEY, String(accentIdx));
      } catch (_) {
        /* ignore */
      }
    }
    refreshAccentButtons();
    if (opts.updateBtn !== false) {
      updateBtn();
    }
  }

  function applyAccentByTime(now = new Date()) {
    if (!autoRotateSchedule.length) return;
    const minutesNow = now.getHours() * 60 + now.getMinutes();

    let candidate = autoRotateSchedule[autoRotateSchedule.length - 1];
    for (const entry of autoRotateSchedule) {
      if (entry.minutes <= minutesNow) {
        candidate = entry;
      } else {
        break;
      }
    }

    if (candidate) {
      setAccent(candidate.index);
    }
  }

  function scheduleNextRotate(now = new Date()) {
    if (!autoRotateSchedule.length) return;
    if (autoTimer) clearTimeout(autoTimer);

    const minutesNow = now.getHours() * 60 + now.getMinutes();
    const secondsNow = now.getSeconds();
    const msNow = now.getMilliseconds();

    let next = autoRotateSchedule.find((entry) => entry.minutes > minutesNow);
    if (!next) {
      next = autoRotateSchedule[0];
    }

    const totalNowMs = minutesNow * 60 * 1000 + secondsNow * 1000 + msNow;
    let targetMs = next.minutes * 60 * 1000;
    if (targetMs <= totalNowMs) {
      targetMs += 24 * 60 * 60 * 1000; // next day
    }

    const delay = Math.max(1000, targetMs - totalNowMs);
    autoTimer = window.setTimeout(() => {
      applyAccentByTime();
      scheduleNextRotate();
    }, delay);
  }

  function initAutoRotate() {
    if (!autoRotateSchedule.length) return;
    applyAccentByTime();
    scheduleNextRotate();
  }

  setAccent(accentIdx, { updateBtn: false });

  const mqlDark = window.matchMedia("(prefers-color-scheme: dark)");
  const sysDark = () => mqlDark.matches;

  let savedMode = localStorage.getItem(THEME_KEY);
  if (!savedMode) {
    savedMode = "auto";
    try {
      localStorage.setItem(THEME_KEY, savedMode);
    } catch (_) {
      /* ignore */
    }
  }

  function applyEffective() {
    const dark = sysDark();
    if (savedMode === "auto") {
      root.setAttribute("data-theme", dark ? "dark" : "light");
    } else {
      root.setAttribute("data-theme", savedMode);
    }
  }

  function currentEffective() {
    return root.getAttribute("data-theme");
  }

  function updateBtn() {
    if (!toggleBtn) return;
    const effective = currentEffective();
    let icon = "🌓";
    if (savedMode === "auto") {
      icon = effective === "dark" ? "💤" : "💻";
    } else {
      icon = effective === "dark" ? "🌤" : "🌓";
    }
    toggleBtn.textContent = icon;
    toggleBtn.title =
      "主题: " + (savedMode === "auto" ? "自动(" + effective + ")" : effective);
    toggleBtn.setAttribute("aria-label", toggleBtn.title);
    toggleBtn.dataset.mode = savedMode;
    toggleBtn.setAttribute("data-accent", String(accentIdx));
  }

  function applyThemeMode(mode) {
    if (!MODE_OPTIONS.some((item) => item.mode === mode)) return;

    // 显示遮罩
    const mask = document.getElementById("themeMask");
    if (mask) {
      mask.hidden = false;
      requestAnimationFrame(() => mask.classList.add("show"));
    }

    // 延迟应用主题变化，让遮罩先显示
    setTimeout(() => {
      savedMode = mode;
      try {
        localStorage.setItem(THEME_KEY, savedMode);
      } catch (_) {
        /* ignore */
      }
      applyEffective();
      updateBtn();
      refreshThemeButtons();

      // 隐藏遮罩
      if (mask) {
        setTimeout(() => {
          mask.classList.remove("show");
          setTimeout(() => (mask.hidden = true), 300);
        }, 100);
      }
    }, 50);
  }

  function cycleThemeMode() {
    const order = MODE_OPTIONS.map((item) => item.mode);
    const idx = order.indexOf(savedMode);
    const next = order[(idx + 1) % order.length];
    applyThemeMode(next);
  }

  applyEffective();
  updateBtn();

  let lastTap = 0;
  if (toggleBtn) {
    toggleBtn.addEventListener("pointerdown", handlePointerDown);
    toggleBtn.addEventListener("pointerup", handlePointerUp);
    toggleBtn.addEventListener("pointerleave", clearPressTimer);
    toggleBtn.addEventListener("pointercancel", clearPressTimer);
    toggleBtn.addEventListener("click", handleClick, true);
  }

  function handleClick(event) {
    if (skipNextClick) {
      event.preventDefault();
      event.stopImmediatePropagation();
      skipNextClick = false;
      return;
    }

    const now = Date.now();
    if (now - lastTap < DOUBLE_TAP_INTERVAL) {
      setAccent(accentIdx + 1);
      scheduleNextRotate();
      lastTap = 0;
      return;
    }

    lastTap = now;
    cycleThemeMode();
  }

  function handlePointerDown(event) {
    if (event.button !== undefined && event.button !== 0) {
      return;
    }
    if (event.pointerType === "touch") {
      event.preventDefault();
    }
    longPressTriggered = false;
    clearPressTimer();
    pressTimer = window.setTimeout(() => {
      longPressTriggered = true;
      skipNextClick = true;
      LanguagePanelManager.toggle();
    }, LONG_PRESS_DELAY);
  }

  function handlePointerUp(event) {
    if (
      event.button !== undefined &&
      event.button !== 0 &&
      event.pointerType !== "touch" &&
      event.pointerType !== "pen"
    ) {
      clearPressTimer();
      return;
    }
    clearPressTimer();
    if (longPressTriggered) {
      window.setTimeout(() => {
        skipNextClick = false;
      }, 0);
    }
  }

  function clearPressTimer() {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  }

  const darkListener = () => {
    if (savedMode === "auto") {
      // 显示遮罩
      const mask = document.getElementById("themeMask");
      if (mask) {
        mask.hidden = false;
        requestAnimationFrame(() => mask.classList.add("show"));
      }

      // 延迟应用主题变化
      setTimeout(() => {
        applyEffective();
        updateBtn();

        // 隐藏遮罩
        if (mask) {
          setTimeout(() => {
            mask.classList.remove("show");
            setTimeout(() => (mask.hidden = true), 300);
          }, 100);
        }
      }, 50);
    }
  };

  if (typeof mqlDark.addEventListener === "function") {
    mqlDark.addEventListener("change", darkListener);
  } else if (typeof mqlDark.addListener === "function") {
    mqlDark.addListener(darkListener);
  }

  function isLanguagePanelOpen() {
    return !!(
      langPanel &&
      !langPanel.hidden &&
      langPanel.classList.contains("open")
    );
  }

  function ensureLanguagePanel() {
    if (langPanel) return langPanel;

    // 创建面板容器
    langPanel = document.createElement("div");
    langPanel.className = "theme-lang-panel";
    langPanel.hidden = true;
    langPanel.setAttribute("role", "menu");
    langPanel.setAttribute(
      "aria-label",
      translate("languagePickerTitle", "Choose language"),
    );

    // 使用DocumentFragment优化DOM操作
    const fragment = document.createDocumentFragment();

    // 创建面板各部分
    langHeader = createPanelElement("div", "theme-lang-header");
    fragment.appendChild(langHeader);

    langHint = createPanelElement("div", "theme-lang-hint");
    fragment.appendChild(langHint);

    // 主题选择区域
    const themeSection = createThemeSection();
    fragment.appendChild(themeSection);

    // 强调色选择区域（如果启用）
    if (accentPanelEnabled) {
      const accentSection = createAccentSection();
      fragment.appendChild(accentSection);
    }

    // 语言选择区域
    langList = createPanelElement("div", "theme-lang-list");
    fragment.appendChild(langList);

    langPanel.appendChild(fragment);
    document.body.appendChild(langPanel);

    // 绑定语言变化事件
    window.addEventListener("languageChanged", handleLanguageChange);

    return langPanel;
  }

  // 辅助函数：创建面板元素
  function createPanelElement(tagName, className, textContent = "") {
    const element = document.createElement(tagName);
    element.className = className;
    if (textContent) element.textContent = textContent;
    return element;
  }

  // 创建主题选择区域
  function createThemeSection() {
    const section = createPanelElement("div", "theme-lang-theme");

    langThemeTitle = createPanelElement("div", "theme-lang-theme-title");
    section.appendChild(langThemeTitle);

    langThemeActions = createPanelElement("div", "theme-lang-theme-actions");
    section.appendChild(langThemeActions);

    return section;
  }

  // 创建强调色选择区域
  function createAccentSection() {
    const section = createPanelElement("div", "theme-lang-accent");

    langAccentTitle = createPanelElement("div", "theme-lang-accent-title");
    section.appendChild(langAccentTitle);

    langAccentList = createPanelElement("div", "theme-lang-accent-list");
    section.appendChild(langAccentList);

    return section;
  }

  // 处理语言变化
  function handleLanguageChange() {
    updateLanguagePanelTexts();
    if (langPanel && !langPanel.hidden) {
      renderLanguagePanel();
    }
  }

  function updateLanguagePanelTexts() {
    if (!langPanel) return;
    if (langHeader)
      langHeader.textContent = translate(
        "languagePickerTitle",
        "Choose language",
      );
    if (langHint)
      langHint.textContent = translate(
        "languagePickerHint",
        "Tap an option to switch immediately.",
      );
    if (langThemeTitle)
      langThemeTitle.textContent = translate(
        "languageThemeTitle",
        "Theme mode",
      );
    if (langAccentTitle)
      langAccentTitle.textContent = translate(
        "languageAccentTitle",
        "Accent color",
      );
    langPanel?.setAttribute(
      "aria-label",
      translate("languagePickerTitle", "Choose language"),
    );
  }

  function renderLanguagePanel() {
    const panel = ensureLanguagePanel();
    updateLanguagePanelTexts();

    // 并行渲染各个部分
    renderThemeOptions();
    if (accentPanelEnabled) {
      renderAccentOptions();
    }

    renderLanguageOptions();

    return panel;
  }

  // 渲染语言选项
  function renderLanguageOptions() {
    if (!langList) return;

    const languages =
      typeof i18nApi.getAvailableLanguages === "function"
        ? i18nApi.getAvailableLanguages()
        : [];
    const currentLang =
      typeof i18nApi.getCurrentLanguage === "function"
        ? i18nApi.getCurrentLanguage()
        : null;

    if (!languages.length) {
      const empty = createPanelElement(
        "div",
        "theme-lang-empty",
        translate("languagePickerEmpty", "No languages available"),
      );
      langList.innerHTML = "";
      langList.appendChild(empty);
      return;
    }

    const fragment = document.createDocumentFragment();

    languages.forEach(({ code, name }) => {
      const option = createLanguageOption(code, name, currentLang);
      fragment.appendChild(option);
    });

    langList.innerHTML = "";
    langList.appendChild(fragment);
  }

  // 创建语言选项
  function createLanguageOption(code, name, currentLang) {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "theme-lang-option";
    option.dataset.lang = code;
    option.setAttribute("role", "menuitemradio");
    option.setAttribute(
      "aria-checked",
      code === currentLang ? "true" : "false",
    );

    // 使用DocumentFragment创建选项内容
    const optionFragment = document.createDocumentFragment();

    const dot = createPanelElement("span", "theme-lang-dot");
    optionFragment.appendChild(dot);

    const label = createPanelElement("span", "theme-lang-name", name);
    optionFragment.appendChild(label);

    const codeTag = createPanelElement("span", "theme-lang-code", code);
    optionFragment.appendChild(codeTag);

    if (code === currentLang) {
      option.classList.add("active");
      const badge = createPanelElement(
        "span",
        "theme-lang-current",
        translate("languageCurrentTag", "Current"),
      );
      optionFragment.appendChild(badge);
    }

    option.appendChild(optionFragment);

    option.addEventListener("click", () => {
      if (typeof i18nApi.setLanguage === "function") {
        i18nApi.setLanguage(code);
      }
      hideLanguagePanel();
      updateBtn();
    });

    return option;
  }

  function renderThemeOptions() {
    if (!langThemeActions) return;

    const fragment = document.createDocumentFragment();

    MODE_OPTIONS.forEach(({ mode, icon, label }) => {
      const btn = createThemeButton(mode, icon, label);
      fragment.appendChild(btn);
    });

    langThemeActions.innerHTML = "";
    langThemeActions.appendChild(fragment);
    refreshThemeButtons();
  }

  // 创建主题按钮
  function createThemeButton(mode, icon, label) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-lang-theme-btn";
    btn.dataset.mode = mode;
    btn.setAttribute("aria-pressed", "false");

    // 使用DocumentFragment创建按钮内容
    const btnFragment = document.createDocumentFragment();

    const iconSpan = createPanelElement("span", "theme-lang-theme-icon", icon);
    btnFragment.appendChild(iconSpan);

    const textSpan = createPanelElement(
      "span",
      "theme-lang-theme-text",
      translate(label, mode),
    );
    btnFragment.appendChild(textSpan);

    btn.appendChild(btnFragment);

    btn.addEventListener("click", () => applyThemeMode(mode));

    return btn;
  }

  function renderAccentOptions() {
    if (!accentPanelEnabled || !langAccentList) return;

    const fragment = document.createDocumentFragment();

    accents.forEach((color, idx) => {
      const btn = createAccentButton(color, idx);
      fragment.appendChild(btn);
    });

    langAccentList.innerHTML = "";
    langAccentList.appendChild(fragment);
    refreshAccentButtons();
  }

  // 创建强调色按钮
  function createAccentButton(color, idx) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-lang-accent-dot";
    btn.dataset.index = String(idx);
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute(
      "aria-label",
      `${translate("languageAccentOption", "Accent color")} ${idx + 1}`,
    );
    btn.style.setProperty("--swatch-color", color);
    btn.title = color;

    btn.addEventListener("click", () => {
      if (accentIdx === idx) return;
      setAccent(idx);
      scheduleNextRotate();
    });

    return btn;
  }

  function refreshThemeButtons() {
    if (!langThemeActions) return;
    langThemeActions
      .querySelectorAll(".theme-lang-theme-btn")
      .forEach((btn) => {
        const active = btn.dataset.mode === savedMode;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });
  }

  function refreshAccentButtons() {
    if (!accentPanelEnabled || !langAccentList) return;
    langAccentList.querySelectorAll(".theme-lang-accent-dot").forEach((btn) => {
      const index = Number.parseInt(btn.dataset.index ?? "-1", 10);
      const active = index === accentIdx;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  // 事件管理器
  const eventManager = {
    listeners: new Map(),

    add(type, listener, options = {}) {
      if (!this.listeners.has(type)) {
        this.listeners.set(type, []);
      }
      this.listeners.get(type).push({ listener, options });
      document.addEventListener(type, listener, options);
    },

    remove(type, listener) {
      const listeners = this.listeners.get(type);
      if (listeners) {
        const index = listeners.findIndex((item) => item.listener === listener);
        if (index > -1) {
          listeners.splice(index, 1);
          document.removeEventListener(type, listener);
        }
      }
    },

    removeAll(type) {
      const listeners = this.listeners.get(type);
      if (listeners) {
        listeners.forEach(({ listener, options }) => {
          document.removeEventListener(type, listener, options);
        });
        this.listeners.delete(type);
      }
    },

    clear() {
      this.listeners.forEach((listeners, type) => {
        listeners.forEach(({ listener }) => {
          document.removeEventListener(type, listener);
        });
      });
      this.listeners.clear();
    },
  };

  function showLanguagePanel() {
    const panel = renderLanguagePanel();
    panel.hidden = false;
    refreshAccentButtons();
    positionLanguagePanel();

    requestAnimationFrame(() => {
      panel.classList.add("open");
      // 将焦点设置到面板的第一个可聚焦元素
      const firstFocusable = getFocusableElements()[0];
      if (firstFocusable) {
        firstFocusable.focus();
      }
    });

    // 使用事件管理器添加事件监听器
    eventManager.add("pointerdown", handleOutsidePress, { capture: true });
    eventManager.add("keydown", handlePanelKeydown, { capture: true });
    window.addEventListener("resize", debouncedPositionPanel);
    window.addEventListener("scroll", handlePanelScroll, true);
  }

  function hideLanguagePanel() {
    if (!langPanel || langPanel.hidden) return;

    langPanel.classList.remove("open");

    // 使用事件管理器移除事件监听器
    eventManager.removeAll("pointerdown");
    eventManager.removeAll("keydown");
    window.removeEventListener("resize", debouncedPositionPanel);
    window.removeEventListener("scroll", handlePanelScroll, true);

    setTimeout(() => {
      if (langPanel && !langPanel.classList.contains("open")) {
        langPanel.hidden = true;
      }
    }, 200);
  }

  function positionLanguagePanel() {
    if (!langPanel || langPanel.hidden || !toggleBtn) return;
    const rect = toggleBtn.getBoundingClientRect();
    const margin = 16;
    const gap = 12;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const panelHeight =
      langPanel.offsetHeight ||
      langPanel.scrollHeight ||
      langPanel.getBoundingClientRect().height ||
      0;
    let top = rect.bottom + gap;
    let showAbove = false;
    const fitsBelow = top + panelHeight <= viewportHeight - margin;
    if (!fitsBelow) {
      const aboveTop = rect.top - panelHeight - gap;
      if (aboveTop >= margin) {
        top = aboveTop;
        showAbove = true;
      } else {
        top = Math.max(margin, viewportHeight - panelHeight - margin);
      }
    } else {
      top = Math.max(margin, top);
    }
    const centerX = rect.left + rect.width / 2;
    const clampedCenter = Math.min(
      viewportWidth - margin,
      Math.max(margin, centerX),
    );
    langPanel.style.top = `${top}px`;
    langPanel.style.left = `${clampedCenter}px`;
    langPanel.classList.toggle("theme-lang-panel--above", showAbove);
  }

  function handleOutsidePress(event) {
    if (!langPanel) return;
    if (langPanel.contains(event.target) || toggleBtn?.contains(event.target))
      return;
    hideLanguagePanel();
  }

  function handlePanelKeydown(event) {
    if (event.key === "Escape") {
      hideLanguagePanel();
      return;
    }

    // 增强键盘导航
    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement);

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusNextElement(focusableElements, currentIndex);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusPreviousElement(focusableElements, currentIndex);
        break;
      case "Home":
        event.preventDefault();
        focusableElements[0]?.focus();
        break;
      case "End":
        event.preventDefault();
        focusableElements[focusableElements.length - 1]?.focus();
        break;
      case "Tab":
        // 允许Tab键在面板内循环
        if (event.shiftKey) {
          if (currentIndex === 0) {
            event.preventDefault();
            focusableElements[focusableElements.length - 1]?.focus();
          }
        } else {
          if (currentIndex === focusableElements.length - 1) {
            event.preventDefault();
            focusableElements[0]?.focus();
          }
        }
        break;
    }
  }

  // 获取面板内所有可聚焦元素
  function getFocusableElements() {
    if (!langPanel) return [];
    return Array.from(
      langPanel.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter(
      (el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"),
    );
  }

  // 聚焦下一个元素
  function focusNextElement(elements, currentIndex) {
    const nextIndex = (currentIndex + 1) % elements.length;
    elements[nextIndex]?.focus();
  }

  // 聚焦上一个元素
  function focusPreviousElement(elements, currentIndex) {
    const prevIndex =
      currentIndex <= 0 ? elements.length - 1 : currentIndex - 1;
    elements[prevIndex]?.focus();
  }

  // 防抖函数
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // 防抖的定位函数
  const debouncedPositionPanel = debounce(positionLanguagePanel, 100);

  // 语言面板管理器
  // 提供主题、强调色和语言选择的统一界面
  const LanguagePanelManager = {
    // 面板元素引用
    elements: {},

    // 初始化面板
    init() {
      this.createPanel();
      this.bindEvents();
    },

    // 创建面板结构
    createPanel() {
      try {
        ensureLanguagePanel();
      } catch (error) {
        console.error("[Theme Panel] Failed to create language panel:", error);
      }
    },

    // 绑定事件
    bindEvents() {
      window.addEventListener("languageChanged", () => {
        this.updateTexts();
        if (this.isVisible()) {
          this.render();
        }
      });
    },

    // 更新文本
    updateTexts() {
      updateLanguagePanelTexts();
    },

    // 渲染面板
    render() {
      renderLanguagePanel();
    },

    // 显示面板
    show() {
      showLanguagePanel();
    },

    // 隐藏面板
    hide() {
      hideLanguagePanel();
    },

    // 检查面板是否可见
    isVisible() {
      return langPanel && !langPanel.hidden;
    },

    // 切换面板显示状态
    toggle() {
      if (this.isVisible()) {
        this.hide();
      } else {
        this.show();
      }
    },
  };

  initAutoRotate();

  // 初始化语言面板管理器
  LanguagePanelManager.init();

  function handlePanelScroll() {
    hideLanguagePanel();
  }
})();
