(function () {
    'use strict';

    const cfg = window.__APP_CONFIG__ || {};

    const navigationState = {
        cards: Array.isArray(cfg.navigationCards) ? cfg.navigationCards.slice() : [],
        filter: 'all',
        filtersEnabled: !!cfg.enableNavigationFilters,
        filterTags: Array.isArray(cfg.navigationFilterTags) ? cfg.navigationFilterTags.filter(Boolean) : [],
        filterBar: null,
        maxDisplayCount: cfg.navigationMaxDisplayCount || 6,
        showAll: cfg.navigationShowAll || false,
    };

    // 检查是否启用导航功能
    if (!cfg.enableNavigation || !cfg.navigationCards) {
        return;
    }

    /**
     * 创建导航卡片元素
     * @param {Object} cardConfig 卡片配置
     * @returns {HTMLElement} 创建的卡片元素
     */
    function createNavCard(cardConfig) {
        const { id, icon, title, description, url, target = '_self', tags } = cardConfig;

        // 创建主容器
        const card = document.createElement('a');
        card.className = 'nav-card';
        card.href = url || '#';
        card.target = target;
        card.setAttribute('data-nav-id', id);
        card.setAttribute('title', `导航到${title}`);
        if (Array.isArray(tags) && tags.length) {
            card.dataset.tags = tags.join(',');
        }

        // 创建图标
        const iconEl = document.createElement('div');
        iconEl.className = 'nav-card-icon';
        iconEl.textContent = icon;

        // 创建内容容器
        const contentEl = document.createElement('div');
        contentEl.className = 'nav-card-content';

        // 创建标题
        const titleEl = document.createElement('h3');
        titleEl.className = 'nav-card-title';
        titleEl.textContent = title;

        // 创建描述
        const descEl = document.createElement('p');
        descEl.className = 'nav-card-desc';
        descEl.textContent = description;

        // 创建箭头
        const arrowEl = document.createElement('div');
        arrowEl.className = 'nav-card-arrow';
        arrowEl.textContent = '→';

        // 组装元素
        contentEl.appendChild(titleEl);
        contentEl.appendChild(descEl);
        card.appendChild(iconEl);
        card.appendChild(contentEl);
        card.appendChild(arrowEl);

        return card;
    }

    /**
     * 创建"查看更多"按钮
     * @param {number} remainingCount 剩余卡片数量
     * @returns {HTMLElement} 创建的按钮元素
     */
    function createMoreButton(remainingCount) {
        const button = document.createElement('button');
        button.className = 'nav-more-btn';
        button.type = 'button';
        button.setAttribute('aria-label', `查看更多 ${remainingCount} 个导航卡片`);

        const icon = document.createElement('span');
        icon.className = 'nav-more-icon';
        icon.textContent = '⋯';

        const text = document.createElement('span');
        text.className = 'nav-more-text';
        text.textContent = `查看更多 (+${remainingCount})`;

        button.appendChild(icon);
        button.appendChild(text);

        button.addEventListener('click', () => showAllCardsModal());

        return button;
    }

    /**
     * 显示所有卡片的模态框
     */
    function showAllCardsModal() {
        const allCards = getFilteredCards();
        if (allCards.length <= navigationState.maxDisplayCount) return;

        // 模态框状态
        let modalShowAll = false; // 模态框内的显示模式，默认为分页显示
        let cardsGrid; // 引用网格容器

        // 更新模态框内容
        function updateModalContent() {
            if (!cardsGrid) return;

            const displayCards = modalShowAll ? allCards : allCards.slice(navigationState.maxDisplayCount);

            // 清空现有内容
            cardsGrid.innerHTML = '';

            // 重新添加卡片
            displayCards.forEach(cardConfig => {
                try {
                    const cardElement = createNavCard(cardConfig);
                    cardsGrid.appendChild(cardElement);
                } catch (error) {
                    console.error('[Navigation] 创建模态框卡片失败:', cardConfig, error);
                }
            });

            // 更新标题
            modalTitle.textContent = modalShowAll ?
                `所有导航 (${allCards.length})` :
                `更多导航 (${displayCards.length})`;

            // 更新切换按钮状态
            toggleButton.classList.toggle('active', modalShowAll);
            toggleButton.setAttribute('aria-label',
                modalShowAll ? '切换到仅显示更多' : '切换到显示全部');

            // 更新按钮内容
            const toggleContent = toggleButton.querySelector('.nav-modal-toggle-content');
            if (toggleContent) {
                toggleContent.textContent = modalShowAll ? '⊖ 收起' : '⊕ 展开';
            }
        }

        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'nav-modal-overlay';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'nav-modal-title');

        const modalContent = document.createElement('div');
        modalContent.className = 'nav-modal-content';

        // 模态框头部
        const modalHeader = document.createElement('div');
        modalHeader.className = 'nav-modal-header';

        const modalTitle = document.createElement('h2');
        modalTitle.id = 'nav-modal-title';
        modalTitle.className = 'nav-modal-title';
        modalTitle.textContent = `所有导航 (${allCards.length})`;

        // 添加切换按钮
        const toggleButton = document.createElement('button');
        toggleButton.className = 'nav-modal-toggle';
        toggleButton.type = 'button';
        toggleButton.setAttribute('aria-label', '切换显示模式');

        // 创建按钮内容容器
        const toggleContent = document.createElement('span');
        toggleContent.className = 'nav-modal-toggle-content';
        toggleButton.appendChild(toggleContent);

        const closeButton = document.createElement('button');
        closeButton.className = 'nav-modal-close';
        closeButton.type = 'button';
        closeButton.setAttribute('aria-label', '关闭');
        closeButton.innerHTML = '✕';

        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(toggleButton);
        modalHeader.appendChild(closeButton);

        // 模态框主体
        const modalBody = document.createElement('div');
        modalBody.className = 'nav-modal-body';

        cardsGrid = document.createElement('div');
        cardsGrid.className = 'nav-modal-grid';

        modalBody.appendChild(cardsGrid);

        // 组装模态框
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        modal.appendChild(modalContent);

        // 初始化内容
        updateModalContent();

        // 添加到页面
        document.body.appendChild(modal);

        // 绑定事件
        const closeModal = () => {
            modal.classList.add('closing');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        };

        closeButton.addEventListener('click', closeModal);
        toggleButton.addEventListener('click', () => {
            modalShowAll = !modalShowAll;
            updateModalContent();
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // ESC键关闭
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // 动画进入
        requestAnimationFrame(() => {
            modal.classList.add('open');
        });
    }

    /**
     * 初始化导航卡片
     */
    function getFilteredCards() {
        if (!navigationState.filtersEnabled || navigationState.filter === 'all') {
            return navigationState.cards;
        }
        return navigationState.cards.filter(card => {
            const tags = Array.isArray(card.tags) ? card.tags : [];
            return tags.includes(navigationState.filter);
        });
    }

    function initNavigation() {
        const container = document.getElementById('navCards');
        if (!container) {
            console.warn('[Navigation] 找不到导航卡片容器 #navCards');
            return;
        }

        // 显示容器并开始加载
        container.hidden = false;

        // 清空容器
        container.innerHTML = '';

        // 生成卡片
        const cards = getFilteredCards();
        const displayCards = navigationState.showAll ? cards : cards.slice(0, navigationState.maxDisplayCount);
        const hasMoreCards = cards.length > navigationState.maxDisplayCount;

        if (displayCards.length === 0) {
            console.warn('[Navigation] 没有配置导航卡片');
            container.classList.remove('skeleton');
            return;
        }

        const fragment = document.createDocumentFragment();
        displayCards.forEach(cardConfig => {
            try {
                const cardElement = createNavCard(cardConfig);
                fragment.appendChild(cardElement);
            } catch (error) {
                console.error('[Navigation] 创建卡片失败:', cardConfig, error);
            }
        });

        container.appendChild(fragment);

        // 如果有更多卡片，在容器外部添加"查看更多"按钮
        if (hasMoreCards && !navigationState.showAll) {
            // 移除现有的查看更多按钮
            const existingButton = container.parentElement?.querySelector('.nav-more-btn');
            if (existingButton) {
                existingButton.remove();
            }

            const moreButton = createMoreButton(cards.length - navigationState.maxDisplayCount);
            // 将按钮添加到导航容器的父元素中
            container.parentElement?.appendChild(moreButton);
        } else {
            // 如果没有更多卡片，移除现有的查看更多按钮
            const existingButton = container.parentElement?.querySelector('.nav-more-btn');
            if (existingButton) {
                existingButton.remove();
            }
        }

        // 移除骨架屏，显示真实内容
        container.classList.remove('skeleton');

        console.log(`[Navigation] 成功加载 ${displayCards.length} 个导航卡片${hasMoreCards ? ` (共${cards.length}个)` : ''}，当前筛选: ${navigationState.filter}`);
    }

    /**
     * 添加导航卡片点击事件处理
     */
    function bindEvents() {
        document.addEventListener('click', (event) => {
            const card = event.target.closest('.nav-card');
            if (!card) return;

            const navId = card.getAttribute('data-nav-id');
            const url = card.href;

            // 触发自定义事件，允许其他脚本监听
            const navEvent = new CustomEvent('navigation:click', {
                detail: { id: navId, url, card }
            });
            document.dispatchEvent(navEvent);

            // 如果是锚点链接，可以在这里添加平滑滚动等效果
            if (url.startsWith('#')) {
                event.preventDefault();
                const targetId = url.substring(1);
                const target = document.getElementById(targetId);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    }

    /**
     * 动态更新导航卡片配置
     * @param {Array} newCards 新的卡片配置数组
     */
    function updateNavigation(newCards) {
        if (!Array.isArray(newCards)) return;

        cfg.navigationCards = newCards;
        navigationState.cards = newCards.slice();
        initNavigation();
    }

    function setFilter(tag) {
        navigationState.filter = tag;
        initNavigation();
        if (navigationState.filterBar) {
            const buttons = navigationState.filterBar.querySelectorAll('.nav-filter-btn');
            buttons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.filter === tag);
            });
        }
    }

    function buildFilterBar() {
        if (!navigationState.filtersEnabled) return;
        const tags = navigationState.filterTags;
        if (!tags.length) return;

        const container = document.getElementById('navCards');
        if (!container || navigationState.filterBar) return;

        const bar = document.createElement('div');
        bar.className = 'nav-filter-bar reveal-item';

        const allButton = document.createElement('button');
        allButton.type = 'button';
        allButton.className = 'nav-filter-btn active';
        allButton.dataset.filter = 'all';
        allButton.textContent = window.__I18N__?.t?.('All') || '全部';
        allButton.addEventListener('click', () => setFilter('all'));
        bar.appendChild(allButton);

        tags.forEach(tag => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'nav-filter-btn';
            btn.dataset.filter = tag;
            btn.textContent = tag;
            btn.addEventListener('click', () => setFilter(tag));
            bar.appendChild(btn);
        });

        container.parentNode.insertBefore(bar, container);
        navigationState.filterBar = bar;
    }

    // 暴露公共API
    window.__NAVIGATION__ = {
        init: initNavigation,
        update: updateNavigation,
        create: createNavCard,
        filter: setFilter
    };

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            buildFilterBar();
            initNavigation();
            bindEvents();
        });
    } else {
        buildFilterBar();
        initNavigation();
        bindEvents();
    }

})();
