(() => {
    const cfg = window.__APP_CONFIG__ || {};
    if (!cfg.enableSplash) {
        const splashEl = document.getElementById('splash');
        splashEl && splashEl.remove();
        return;
    }

    const splash = document.getElementById('splash');
    if (!splash) return;

    ensureSplashStructure(splash, cfg);

    const bar = splash.querySelector('.splash-matrix-progress-fill');
    const title = splash.querySelector('.splash-matrix-progress-text');

    // 获取所有需要加载的资源
    const resources = [...document.querySelectorAll('link[rel="stylesheet"], link[rel="manifest"], script[defer]')]
        .filter(el => el.src || el.href);

    const urls = [...new Set(resources.map(r => r.src || r.href))];
    const total = urls.length || 1;
    let loaded = 0;

    const updateProgress = () => {
        loaded = Math.min(loaded, total);
        const percent = Math.round(loaded / total * 100);
        requestAnimationFrame(() => {
            if (bar) {
                bar.style.width = percent + '%';
            }
            if (title) {
                title.textContent = percent < 100 ? 'Loading ' + percent + '%' : 'Ready';
            }
        });
    };

    updateProgress();

    urls.forEach(url => {
        // 如果资源已在performance中标记为已加载
        if (performance.getEntriesByName(url).some(entry => entry.initiatorType)) {
            loaded++;
            updateProgress();
            return;
        }

        const element = resources.find(r => (r.src || r.href) === url);
        if (!element) {
            loaded++;
            updateProgress();
            return;
        }

        const onLoad = () => {
            loaded++;
            updateProgress();
            cleanup();
        };

        const onError = () => {
            loaded++;
            updateProgress();
            cleanup();
        };

        const cleanup = () => {
            element.removeEventListener('load', onLoad);
            element.removeEventListener('error', onError);
        };

        element.addEventListener('load', onLoad);
        element.addEventListener('error', onError);
    });

    // 监听进度条完成
    const progressObserver = new MutationObserver(() => {
        if (bar && bar.style.width === '100%') {
            progressObserver.disconnect();
        }
    });

    if (bar) {
        progressObserver.observe(bar, { attributes: true, attributeFilter: ['style'] });
        // 安全超时：30秒后强制断开
        setTimeout(() => progressObserver.disconnect(), 30000);
    }

    function ensureSplashStructure(root, config) {
        if (root.dataset.enhanced === 'true') return;

        root.innerHTML = '';

        // 创建主容器
        const container = document.createElement('div');
        container.className = 'splash-matrix';

        // 创建标题区域
        const header = document.createElement('div');
        header.className = 'splash-matrix-header';

        const title = document.createElement('div');
        title.className = 'splash-matrix-title';
        const titleText = config.splashHeading
            || config.splash?.heading
            || config.meta?.title
            || config.title
            || '忆窝';
        title.textContent = titleText;

        const subtitle = document.createElement('div');
        subtitle.className = 'splash-matrix-subtitle';
        const subtitleText = config.splashSubheading
            || config.splash?.subheading
            || config.meta?.subtitle
            || 'Digital dreams are loading…';
        subtitle.textContent = subtitleText;

        header.appendChild(title);
        header.appendChild(subtitle);

        // 创建矩阵雨容器
        const rain = document.createElement('div');
        rain.className = 'splash-matrix-rain';

        // 创建多个雨滴列
        for (let i = 0; i < 15; i++) {
            const column = document.createElement('div');
            column.className = 'splash-matrix-column';
            column.style.left = `${(i / 15) * 100}%`;
            column.style.animationDelay = `${Math.random() * 2}s`;

            // 每个列包含多个字符
            for (let j = 0; j < 20; j++) {
                const char = document.createElement('span');
                char.className = 'splash-matrix-char';
                char.textContent = getRandomChar();
                char.style.animationDelay = `${j * 0.1 + Math.random() * 0.5}s`;
                column.appendChild(char);
            }

            rain.appendChild(column);
        }

        // 创建进度区域
        const progress = document.createElement('div');
        progress.className = 'splash-matrix-progress';

        const progressText = document.createElement('div');
        progressText.className = 'splash-matrix-progress-text';
        progressText.dataset.i18n = 'loadingProgress';
        progressText.textContent = 'Loading...';

        const progressBar = document.createElement('div');
        progressBar.className = 'splash-matrix-progress-bar';
        const progressFill = document.createElement('div');
        progressFill.className = 'splash-matrix-progress-fill';
        progressBar.appendChild(progressFill);

        progress.appendChild(progressText);
        progress.appendChild(progressBar);

        // 组装
        container.appendChild(header);
        container.appendChild(rain);
        container.appendChild(progress);

        root.appendChild(container);
        root.dataset.enhanced = 'true';

        // 启动字符更新动画
        startCharAnimation(container);
    }

    // 获取随机字符
    function getRandomChar() {
        const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        return chars[Math.floor(Math.random() * chars.length)];
    }

    // 启动字符动画
    function startCharAnimation(container) {
        const chars = container.querySelectorAll('.splash-matrix-char');
        let interval;
        let observer;
        let timeout;

        const updateChars = () => {
            chars.forEach(char => {
                if (Math.random() < 0.02) { // 2% 概率更新
                    char.textContent = getRandomChar();
                    char.style.opacity = Math.random() * 0.5 + 0.5;
                }
            });
        };

        const cleanup = () => {
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
            if (observer) {
                observer.disconnect();
                observer = null;
            }
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
        };

        // 每100ms更新一次
        interval = setInterval(updateChars, 100);

        // 当开屏消失时清理
        observer = new MutationObserver(() => {
            if (container.closest('.splash.fade-out')) {
                cleanup();
            }
        });

        if (container.parentElement) {
            observer.observe(container.parentElement, {
                attributes: true,
                attributeFilter: ['class']
            });
        }

        // 安全超时：最长运行10秒后自动清理
        timeout = setTimeout(cleanup, 10000);

        // 将清理函数暴露给全局，以便在需要时手动清理
        container._cleanupAnimation = cleanup;
    }

    // 页面卸载时清理所有资源
    window.addEventListener('beforeunload', () => {
        const splash = document.getElementById('splash');
        if (splash) {
            const container = splash.querySelector('.splash-matrix');
            if (container && container._cleanupAnimation) {
                container._cleanupAnimation();
            }
        }
    });
})();
