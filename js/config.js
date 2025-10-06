// 全局配置
(function () {
  const config = {
    version: "v0.11.8",
    meta: {
      launchDate: "2021-02-27T00:00:00+08:00",
      title: "忆窝",
      subtitle: "One Day.",
    },
    splash: {
      enable: true,
      minDuration: 1000,
      removeIfFast: true,
      skeletonFadeDelay: 120,
    },
    theme: {
      accents: [
        "hsl(350 82% 54%)",
        "hsl(215 85% 55%)",
        "hsl(135 50% 42%)",
        "hsl(32 90% 52%)",
        "hsl(275 70% 60%)",
      ],
      defaultAccentIndex: 0,
      enableAccentPanel: true,
      // 自动轮换强调色：根据 schedule 中的时间段切换 accents 索引
      autoRotate: {
        enable: true,
        // 命名时段或分钟标记 -> 对应 accents 数组索引
        schedule: {
          dawn: 0,
          noon: 1,
          dusk: 3,
          night: 4,
        },
      },
    },
    effects: {
      enableScrollProgress: false, // 启用滚动进度
    },
    runtime: {
      enable: true, // 启用运行时间显示
    },
    hitokoto: {
      enable: true, // 启用一言显示
      provider: "hitokoto", // API提供者：hitokoto | custom
      apis: {
        // 官方一言 API
        hitokoto: {
          url: "https://v1.hitokoto.cn/",
          categories: ["a", "b", "d", "h"],
          params: { encode: "json" }
        },
        // 自定义 API
        custom: {
          url: "", // 用户自定义API地址
          params: {}
        }
      },
      timeout: 8000, // 请求超时时间(ms)
      retries: 2, // 重试次数
      cacheTime: 300000, // 缓存时间(ms) - 5分钟
    },
    announcement: {
      enable: true,
      icon: "😽",
      messages: [
        "平安喜樂，萬事勝意，祝你，祝我，祝我們",
        "关注卡拉彼丘喵！关注卡拉彼丘谢谢喵！",
        "ISTP-A | 机械键盘爱好者 | 猫奴",
      ],
      cycleInterval: 4800, // ms
      transition: 500, // ms
      dismissKey: "ann-v3",
      closeButton: true,
      // 远程公告：按间隔拉取 JSON，若不需要可保持 enable 为 false
      remoteFeed: {
        enable: false,
        source: "/data/announcements.json",
        refreshInterval: 3600000,
      },
    },
    performance: {
      adaptive: true, // 自适应关闭部分特效
      idleAutoRelease: true,          // 空闲自动释放内存
      idleReleaseDelay: 60000,        // 一级释放延迟 (ms)
      idleDeepReleaseDelay: 180000,   // 深度释放额外延迟 (ms) 0 关闭
      idleAutoRestore: true,          // 交互自动恢复
    },
    update: {
      enable: true,              // 启用版本检测
      checkInterval: 300000,     // 轮询间隔(ms)
      notifyDelay: 0,            // 检测到新版本后展示延迟
      source: "/js/config.js",   // 提取 version 的文件
    },
    navigation: {
      enable: true,              // 启用导航卡片
      cards: [
        {
          id: "Blog",
          icon: "🎯",
          title: "Rin",
          description: "平安喜樂，萬事勝意，祝你，祝我，祝我們",
          url: "https://ns.onedays.top",
          target: "_self",
          tags: ["blog", "life"]
        },
        {
          id: "GitHub",
          icon: "💻",
          title: "GitHub",
          description: "什么也不会",
          url: "https://github.com/Huin2479",
          target: "_self",
          tags: ["dev"]
        }
      ],
      // 导航筛选：展示标签按钮并按 tags 过滤 cards
      filters: {
        enable: true,
        tags: ["blog", "dev", "life"],
      },
    },
    easter: {
      konami: true,            // Konami 代码触发彩蛋
      titleClicks: true,       // 标题短时间连点彩蛋
      maxTitleInterval: 2000,  // 连点窗口(ms)
      titleClickThreshold: 7,  // 需要点击次数
      ascii: true,             // 隐藏 ASCII 面板
      confetti: true,          // 猫咪点击掉彩带
      catDriftInterval: 12000  // 猫咪自动漂移基础间隔 (ms)，0 关闭
    }
  };

  // 展平旧字段以兼容现有脚本
  const flat = {
    // meta
    launchDate: config.meta.launchDate,
    title: config.meta.title,
    subtitle: config.meta.subtitle,
    // splash
    enableSplash: config.splash.enable,
    splashMinDuration: config.splash.minDuration,
    removeSplashIfFast: config.splash.removeIfFast,
    skeletonFadeDelay: config.splash.skeletonFadeDelay,
    // theme
    accents: config.theme.accents,
    defaultAccentIndex: config.theme.defaultAccentIndex,
    enableAccentPanel: config.theme.enableAccentPanel,
    enableAccentAutoRotate: config.theme.autoRotate?.enable,
    accentRotateSchedule: config.theme.autoRotate?.schedule,
    // effects
    enableScrollProgress: config.effects.enableScrollProgress,
    // runtime
    enableRuntime: config.runtime.enable,
    // hitokoto
    enableHitokoto: config.hitokoto.enable,
    hitokotoProvider: config.hitokoto.provider,
    hitokotoApis: config.hitokoto.apis,
    hitokotoTimeout: config.hitokoto.timeout,
    hitokotoRetries: config.hitokoto.retries,
    hitokotoCacheTime: config.hitokoto.cacheTime,
    // announcement
    enableAnnouncement: config.announcement.enable,
    announcementIcon: config.announcement.icon,
    announcementMessages: config.announcement.messages,
    announcementCycleInterval: config.announcement.cycleInterval,
    announcementTransition: config.announcement.transition,
    announcementDismissKey: config.announcement.dismissKey,
    enableAnnouncementClose: config.announcement.closeButton,
    enableAnnouncementRemoteFeed: config.announcement.remoteFeed?.enable,
    announcementRemoteSource: config.announcement.remoteFeed?.source,
    announcementRemoteRefresh: config.announcement.remoteFeed?.refreshInterval,
    // performance
    adaptivePerformance: config.performance.adaptive,
    enableIdleAutoRelease: config.performance.idleAutoRelease,
    idleReleaseDelay: config.performance.idleReleaseDelay,
    idleDeepReleaseDelay: config.performance.idleDeepReleaseDelay,
    enableIdleAutoRestore: config.performance.idleAutoRestore,
    // update
    enableUpdateCheck: config.update.enable,
    updateCheckInterval: config.update.checkInterval,
    updateNotifyDelay: config.update.notifyDelay,
    updateSource: config.update.source,
    // navigation
    enableNavigation: config.navigation.enable,
    navigationCards: config.navigation.cards,
    enableNavigationFilters: config.navigation.filters?.enable,
    navigationFilterTags: config.navigation.filters?.tags,
    // version flat
    version: config.version,
    // easter
    enableKonami: config.easter.konami,
    enableTitleClicks: config.easter.titleClicks,
    titleClickWindow: config.easter.maxTitleInterval,
    titleClickThreshold: config.easter.titleClickThreshold,
    enableAsciiPanel: config.easter.ascii,
    enableConfetti: config.easter.confetti,
    catDriftInterval: config.easter.catDriftInterval,
  };

  window.__APP_CONFIG__ = Object.assign({}, config, flat);
})();
