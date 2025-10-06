
(() => {
	const root = document.documentElement;
	const cfg = window.__APP_CONFIG__ || {};
	const THEME_KEY = 'onedays-theme';
	const ACC_KEY = 'onedays-accent';

	const toggleBtn = document.getElementById('themeToggle');
	const accents = Array.isArray(cfg.accents) ? cfg.accents : [];
	const defaultAccentIndex = Number.parseInt(cfg.defaultAccentIndex ?? 0, 10) || 0;

	let accentIdx = Number.parseInt(localStorage.getItem(ACC_KEY) ?? defaultAccentIndex, 10) || 0;
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
	const translate = (key, fallback) => typeof i18nApi.t === 'function' ? i18nApi.t(key, fallback ?? key) : (fallback ?? key);

	const MODE_OPTIONS = [
		{ mode: 'auto', icon: '🌓', label: 'languageThemeAuto' },
		{ mode: 'light', icon: '🌤', label: 'languageThemeLight' },
		{ mode: 'dark', icon: '💤', label: 'languageThemeDark' },
	];

	const accentPanelEnabled = cfg.enableAccentPanel !== false && accents.length > 1;
	if (accentPanelEnabled) {
		window.__THEME_PANEL_SUPPORTS_ACCENTS__ = true;
	} else if (window.__THEME_PANEL_SUPPORTS_ACCENTS__) {
		window.__THEME_PANEL_SUPPORTS_ACCENTS__ = false;
	}

	const autoRotateEnabled = !!cfg.enableAccentAutoRotate;
	const autoRotateSchedule = parseSchedule(cfg.accentRotateSchedule);

	function parseSchedule(raw) {
		if (!autoRotateEnabled) return [];
		if (!raw || typeof raw !== 'object') return [];

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
			if (typeof timeKey === 'number') {
				minutes = timeKey;
			} else if (typeof timeKey === 'string') {
				const key = timeKey.trim().toLowerCase();
				if (/^\d{1,2}:\d{2}$/.test(key)) {
					const [h, m] = key.split(':').map(Number);
					minutes = (h * 60 + m) % (24 * 60);
				} else if (/^\d+$/.test(key)) {
					minutes = Number(key) % (24 * 60);
				} else if (key in namedSlots) {
					minutes = namedSlots[key];
				}
			}

			if (minutes == null) continue;
			const normalized = ((minutes % (24 * 60)) + (24 * 60)) % (24 * 60);
			entries.push({ minutes: normalized, index });
		}

		entries.sort((a, b) => a.minutes - b.minutes);
		return entries;
	}

	function setAccent(i, opts = {}) {
		if (!accents.length) return;
		accentIdx = (i + accents.length) % accents.length;
		const accent = accents[accentIdx];
		root.style.setProperty('--accent', accent);
		root.style.setProperty('--accent-hover', accent.replace(/(\d+%?\))?$/, ''));
		if (toggleBtn) {
			toggleBtn.setAttribute('data-accent', String(accentIdx));
		}
		if (opts.persist !== false) {
			try {
				localStorage.setItem(ACC_KEY, String(accentIdx));
			} catch (_) { /* ignore */ }
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

		let next = autoRotateSchedule.find(entry => entry.minutes > minutesNow);
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

	const mqlDark = window.matchMedia('(prefers-color-scheme: dark)');
	const sysDark = () => mqlDark.matches;

	let savedMode = localStorage.getItem(THEME_KEY);
	if (!savedMode) {
		savedMode = 'auto';
		try { localStorage.setItem(THEME_KEY, savedMode); } catch (_) { /* ignore */ }
	}

	function applyEffective() {
		const dark = sysDark();
		if (savedMode === 'auto') {
			root.setAttribute('data-theme', dark ? 'dark' : 'light');
		} else {
			root.setAttribute('data-theme', savedMode);
		}
	}

	function currentEffective() {
		return root.getAttribute('data-theme');
	}

	function updateBtn() {
		if (!toggleBtn) return;
		const effective = currentEffective();
		let icon = '🌓';
		if (savedMode === 'auto') {
			icon = effective === 'dark' ? '💤' : '💻';
		} else {
			icon = effective === 'dark' ? '🌤' : '🌓';
		}
		toggleBtn.textContent = icon;
		toggleBtn.title = '主题: ' + (savedMode === 'auto' ? '自动(' + effective + ')' : effective);
		toggleBtn.setAttribute('aria-label', toggleBtn.title);
		toggleBtn.dataset.mode = savedMode;
		toggleBtn.setAttribute('data-accent', String(accentIdx));
	}

	function applyThemeMode(mode) {
		if (!MODE_OPTIONS.some(item => item.mode === mode)) return;
		savedMode = mode;
		try { localStorage.setItem(THEME_KEY, savedMode); } catch (_) { /* ignore */ }
		applyEffective();
		updateBtn();
		refreshThemeButtons();
	}

	function cycleThemeMode() {
		const order = MODE_OPTIONS.map(item => item.mode);
		const idx = order.indexOf(savedMode);
		const next = order[(idx + 1) % order.length];
		applyThemeMode(next);
	}

	applyEffective();
	updateBtn();

	let lastTap = 0;
	if (toggleBtn) {
		toggleBtn.addEventListener('pointerdown', handlePointerDown);
		toggleBtn.addEventListener('pointerup', handlePointerUp);
		toggleBtn.addEventListener('pointerleave', clearPressTimer);
		toggleBtn.addEventListener('pointercancel', clearPressTimer);
		toggleBtn.addEventListener('click', handleClick, true);
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
		if (event.pointerType === 'touch') {
			event.preventDefault();
		}
		longPressTriggered = false;
		clearPressTimer();
		pressTimer = window.setTimeout(() => {
			longPressTriggered = true;
			skipNextClick = true;
			if (isLanguagePanelOpen()) {
				hideLanguagePanel();
			} else {
				showLanguagePanel();
			}
		}, LONG_PRESS_DELAY);
	}

	function handlePointerUp(event) {
		if (event.button !== undefined && event.button !== 0 && event.pointerType !== 'touch' && event.pointerType !== 'pen') {
			clearPressTimer();
			return;
		}
		clearPressTimer();
		if (longPressTriggered) {
			window.setTimeout(() => { skipNextClick = false; }, 0);
		}
	}

	function clearPressTimer() {
		if (pressTimer) {
			clearTimeout(pressTimer);
			pressTimer = null;
		}
	}

	const darkListener = () => {
		if (savedMode === 'auto') {
			applyEffective();
			updateBtn();
		}
	};

	if (typeof mqlDark.addEventListener === 'function') {
		mqlDark.addEventListener('change', darkListener);
	} else if (typeof mqlDark.addListener === 'function') {
		mqlDark.addListener(darkListener);
	}

	function isLanguagePanelOpen() {
		return !!(langPanel && !langPanel.hidden && langPanel.classList.contains('open'));
	}

	function ensureLanguagePanel() {
		if (langPanel) return langPanel;
		langPanel = document.createElement('div');
		langPanel.className = 'theme-lang-panel';
		langPanel.hidden = true;
		langPanel.setAttribute('role', 'menu');
		langPanel.setAttribute('aria-label', translate('languagePickerTitle', 'Choose language'));

		langHeader = document.createElement('div');
		langHeader.className = 'theme-lang-header';
		langPanel.appendChild(langHeader);

		langHint = document.createElement('div');
		langHint.className = 'theme-lang-hint';
		langPanel.appendChild(langHint);

		langThemeRow = document.createElement('div');
		langThemeRow.className = 'theme-lang-theme';
		langPanel.appendChild(langThemeRow);

		langThemeTitle = document.createElement('div');
		langThemeTitle.className = 'theme-lang-theme-title';
		langThemeRow.appendChild(langThemeTitle);

		langThemeActions = document.createElement('div');
		langThemeActions.className = 'theme-lang-theme-actions';
		langThemeRow.appendChild(langThemeActions);

		if (accentPanelEnabled) {
			langAccentRow = document.createElement('div');
			langAccentRow.className = 'theme-lang-accent';
			langPanel.appendChild(langAccentRow);

			langAccentTitle = document.createElement('div');
			langAccentTitle.className = 'theme-lang-accent-title';
			langAccentRow.appendChild(langAccentTitle);

			langAccentList = document.createElement('div');
			langAccentList.className = 'theme-lang-accent-list';
			langAccentRow.appendChild(langAccentList);
		}

		langList = document.createElement('div');
		langList.className = 'theme-lang-list';
		langPanel.appendChild(langList);

		document.body.appendChild(langPanel);

		window.addEventListener('languageChanged', () => {
			updateLanguagePanelTexts();
			if (langPanel && !langPanel.hidden) {
				renderLanguagePanel();
			}
		});

		return langPanel;
	}

	function updateLanguagePanelTexts() {
		if (!langPanel) return;
		if (langHeader) langHeader.textContent = translate('languagePickerTitle', 'Choose language');
		if (langHint) langHint.textContent = translate('languagePickerHint', 'Tap an option to switch immediately.');
		if (langThemeTitle) langThemeTitle.textContent = translate('languageThemeTitle', 'Theme mode');
		if (langAccentTitle) langAccentTitle.textContent = translate('languageAccentTitle', 'Accent color');
		langPanel?.setAttribute('aria-label', translate('languagePickerTitle', 'Choose language'));
	}

	function renderLanguagePanel() {
		const panel = ensureLanguagePanel();
		updateLanguagePanelTexts();
		renderThemeOptions();
		if (accentPanelEnabled) {
			renderAccentOptions();
		}
		if (!langList) return panel;

		langList.innerHTML = '';
		const languages = typeof i18nApi.getAvailableLanguages === 'function' ? i18nApi.getAvailableLanguages() : [];
		const currentLang = typeof i18nApi.getCurrentLanguage === 'function' ? i18nApi.getCurrentLanguage() : null;

		languages.forEach(({ code, name }) => {
			const option = document.createElement('button');
			option.type = 'button';
			option.className = 'theme-lang-option';
			option.dataset.lang = code;
			option.setAttribute('role', 'menuitemradio');
			option.setAttribute('aria-checked', code === currentLang ? 'true' : 'false');

			const dot = document.createElement('span');
			dot.className = 'theme-lang-dot';
			option.appendChild(dot);

			const label = document.createElement('span');
			label.className = 'theme-lang-name';
			label.textContent = name;
			option.appendChild(label);

			const codeTag = document.createElement('span');
			codeTag.className = 'theme-lang-code';
			codeTag.textContent = code;
			option.appendChild(codeTag);

			if (code === currentLang) {
				option.classList.add('active');
				const badge = document.createElement('span');
				badge.className = 'theme-lang-current';
				badge.textContent = translate('languageCurrentTag', 'Current');
				option.appendChild(badge);
			}

			option.addEventListener('click', () => {
				if (typeof i18nApi.setLanguage === 'function') {
					i18nApi.setLanguage(code);
				}
				hideLanguagePanel();
				updateBtn();
			});

			langList.appendChild(option);
		});

		if (!languages.length) {
			const empty = document.createElement('div');
			empty.className = 'theme-lang-empty';
			empty.textContent = translate('languagePickerEmpty', 'No languages available');
			langList.appendChild(empty);
		}

		return panel;
	}

	function renderThemeOptions() {
		if (!langThemeActions) return;
		langThemeActions.innerHTML = '';
		MODE_OPTIONS.forEach(({ mode, icon, label }) => {
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'theme-lang-theme-btn';
			btn.dataset.mode = mode;
			btn.setAttribute('aria-pressed', 'false');

			const iconSpan = document.createElement('span');
			iconSpan.className = 'theme-lang-theme-icon';
			iconSpan.textContent = icon;
			btn.appendChild(iconSpan);

			const textSpan = document.createElement('span');
			textSpan.className = 'theme-lang-theme-text';
			textSpan.textContent = translate(label, mode);
			btn.appendChild(textSpan);

			btn.addEventListener('click', () => {
				applyThemeMode(mode);
			});

			langThemeActions.appendChild(btn);
		});
		refreshThemeButtons();
	}

	function renderAccentOptions() {
		if (!accentPanelEnabled || !langAccentList) return;
		langAccentList.innerHTML = '';
		accents.forEach((color, idx) => {
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'theme-lang-accent-dot';
			btn.dataset.index = String(idx);
			btn.setAttribute('aria-pressed', 'false');
			btn.setAttribute('aria-label', `${translate('languageAccentOption', 'Accent color')} ${idx + 1}`);
			btn.style.setProperty('--swatch-color', color);
			btn.title = color;
			btn.addEventListener('click', () => {
				if (accentIdx === idx) return;
				setAccent(idx);
				scheduleNextRotate();
			});
			langAccentList.appendChild(btn);
		});
		refreshAccentButtons();
	}

	function refreshThemeButtons() {
		if (!langThemeActions) return;
		langThemeActions.querySelectorAll('.theme-lang-theme-btn').forEach(btn => {
			const active = btn.dataset.mode === savedMode;
			btn.classList.toggle('active', active);
			btn.setAttribute('aria-pressed', active ? 'true' : 'false');
		});
	}

	function refreshAccentButtons() {
		if (!accentPanelEnabled || !langAccentList) return;
		langAccentList.querySelectorAll('.theme-lang-accent-dot').forEach(btn => {
			const index = Number.parseInt(btn.dataset.index ?? '-1', 10);
			const active = index === accentIdx;
			btn.classList.toggle('active', active);
			btn.setAttribute('aria-pressed', active ? 'true' : 'false');
		});
	}

	function showLanguagePanel() {
		const panel = renderLanguagePanel();
		panel.hidden = false;
		refreshAccentButtons();
		positionLanguagePanel();
		requestAnimationFrame(() => {
			panel.classList.add('open');
		});
		document.addEventListener('pointerdown', handleOutsidePress, true);
		document.addEventListener('keydown', handlePanelKeydown, true);
		window.addEventListener('resize', positionLanguagePanel);
		window.addEventListener('scroll', handlePanelScroll, true);
	}

	function hideLanguagePanel() {
		if (!langPanel || langPanel.hidden) return;
		langPanel.classList.remove('open');
		document.removeEventListener('pointerdown', handleOutsidePress, true);
		document.removeEventListener('keydown', handlePanelKeydown, true);
		window.removeEventListener('resize', positionLanguagePanel);
		window.removeEventListener('scroll', handlePanelScroll, true);
		setTimeout(() => {
			if (langPanel && !langPanel.classList.contains('open')) {
				langPanel.hidden = true;
			}
		}, 200);
	}

	function positionLanguagePanel() {
		if (!langPanel || langPanel.hidden || !toggleBtn) return;
		const rect = toggleBtn.getBoundingClientRect();
		const top = Math.min(window.innerHeight - 24, Math.max(16, rect.bottom + 12));
		const centerX = Math.min(window.innerWidth - 24, Math.max(24, rect.left + rect.width / 2));
		langPanel.style.top = `${top}px`;
		langPanel.style.left = `${centerX}px`;
	}

	function handleOutsidePress(event) {
		if (!langPanel) return;
		if (langPanel.contains(event.target) || toggleBtn?.contains(event.target)) return;
		hideLanguagePanel();
	}

	function handlePanelKeydown(event) {
		if (event.key === 'Escape') {
			hideLanguagePanel();
		}
	}

	function handlePanelScroll() {
		hideLanguagePanel();
	}

	if (!window.getDeviceDisplayState) {
		window.getDeviceDisplayState = function () {
			const motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
			let dataSaver = false;
			try {
				dataSaver = window.matchMedia('(prefers-reduced-data: reduce)').matches;
			} catch (_) { /* ignore */ }

			let contrast;
			try {
				const mqMore = window.matchMedia('(prefers-contrast: more)');
				const mqLess = window.matchMedia('(prefers-contrast: less)');
				contrast = mqMore.matches ? 'more' : (mqLess.matches ? 'less' : 'no-preference');
			} catch (_) {
				contrast = undefined;
			}

			return {
				mode: savedMode,
				effective: currentEffective(),
				systemDark: sysDark(),
				reducedMotion: motion,
				reducedData: dataSaver,
				contrast,
			};
		};
	}

	initAutoRotate();
})();
