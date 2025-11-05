// 真实资源加载进度统计(min)
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

    const bar = splash.querySelector('.splash-bar span');
    const title = splash.querySelector('.splash-title');

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
    const observer = new MutationObserver(() => {
        if (bar && bar.style.width === '100%') {
            observer.disconnect();
        }
    });

    if (bar) {
        observer.observe(bar, { attributes: true, attributeFilter: ['style'] });
    }

    function ensureSplashStructure(root, config) {
        if (root.dataset.enhanced === 'true') return;

        root.innerHTML = '';

        const content = document.createElement('div');
        content.className = 'splash-content';

        const scene = document.createElement('div');
        scene.className = 'splash-scene';
        scene.setAttribute('aria-hidden', 'true');

        const cat = document.createElement('div');
        cat.className = 'splash-cat';
        scene.appendChild(cat);

        const petals = document.createElement('div');
        petals.className = 'splash-petals';
        for (let i = 0; i < 6; i++) {
            petals.appendChild(document.createElement('span'));
        }
        scene.appendChild(petals);

        const copy = document.createElement('div');
        copy.className = 'splash-copy';

        const heading = document.createElement('div');
        heading.className = 'splash-heading';
        const headingText = config.splashHeading
            || config.splash?.heading
            || config.meta?.title
            || config.title
            || '忆窝';
        heading.textContent = headingText;

        const subHeading = document.createElement('div');
        subHeading.className = 'splash-subheading';
        const subHeadingText = config.splashSubheading
            || config.splash?.subheading
            || config.meta?.subtitle
            || 'Sakura daydreams are loading…';
        subHeading.textContent = subHeadingText;

        const loadingTitle = document.createElement('div');
        loadingTitle.className = 'splash-title';
        loadingTitle.dataset.i18n = 'loadingProgress';
        loadingTitle.textContent = 'Loading...';

        const bar = document.createElement('div');
        bar.className = 'splash-bar';
        bar.appendChild(document.createElement('span'));

        copy.appendChild(heading);
        copy.appendChild(subHeading);
        copy.appendChild(loadingTitle);
        copy.appendChild(bar);

        content.appendChild(scene);
        content.appendChild(copy);

        root.appendChild(content);
        root.dataset.enhanced = 'true';
    }
})();
