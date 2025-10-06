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
      enable: true,
      provider: "hitokoto", // hitokoto | custom
      apis: {
        hitokoto: {
          url: "https://v1.hitokoto.cn/",
          categories: ["a", "b", "d", "h"],
          params: { encode: "json" }
        },
        custom: {
          url: "",
          params: {}
        }
      },
      timeout: 8000,
      retries: 2,
      cacheTime: 300000,
    },
    announcement: {
      enable: true,
      icon: "😽",
      messages: [
        "平安喜樂，萬事勝意，祝你，祝我，祝我們",
        "关注卡拉彼丘喵！关注卡拉彼丘谢谢喵！",
        "ISTP-A | 机械键盘爱好者 | 猫奴",
      ],
      cycleInterval: 4800,
      transition: 500,
      dismissKey: "ann-v3",
      closeButton: true,
      remoteFeed: {
        enable: false,
        source: "/data/announcements.json",
        refreshInterval: 3600000,
      },
    },
    performance: {
      adaptive: true,
      idleAutoRelease: true,
      idleReleaseDelay: 60000,
      idleDeepReleaseDelay: 180000,
      idleAutoRestore: true,
    },
    update: {
      enable: true,
      checkInterval: 300000,
      notifyDelay: 0,
      source: "/js/config.js",
    },
    navigation: {
      enable: true,
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
      filters: {
        enable: true,
        tags: ["blog", "dev", "life"],
      },
    },
    easter: {
      konami: true,
      titleClicks: true,
      maxTitleInterval: 2000,
      titleClickThreshold: 7,
      ascii: true,
      confetti: true,
      catDriftInterval: 12000
    }
  };

  const flat = {
    launchDate: config.meta.launchDate,
    title: config.meta.title,
    subtitle: config.meta.subtitle,
    enableSplash: config.splash.enable,
    splashMinDuration: config.splash.minDuration,
    removeSplashIfFast: config.splash.removeIfFast,
    skeletonFadeDelay: config.splash.skeletonFadeDelay,
    accents: config.theme.accents,
    defaultAccentIndex: config.theme.defaultAccentIndex,
    enableAccentPanel: config.theme.enableAccentPanel,
    enableAccentAutoRotate: config.theme.autoRotate?.enable,
    accentRotateSchedule: config.theme.autoRotate?.schedule,
    enableScrollProgress: config.effects.enableScrollProgress,
    enableRuntime: config.runtime.enable,
    enableHitokoto: config.hitokoto.enable,
    hitokotoProvider: config.hitokoto.provider,
    hitokotoApis: config.hitokoto.apis,
    hitokotoTimeout: config.hitokoto.timeout,
    hitokotoRetries: config.hitokoto.retries,
    hitokotoCacheTime: config.hitokoto.cacheTime,
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
    adaptivePerformance: config.performance.adaptive,
    enableIdleAutoRelease: config.performance.idleAutoRelease,
    idleReleaseDelay: config.performance.idleReleaseDelay,
    idleDeepReleaseDelay: config.performance.idleDeepReleaseDelay,
    enableIdleAutoRestore: config.performance.idleAutoRestore,
    enableUpdateCheck: config.update.enable,
    updateCheckInterval: config.update.checkInterval,
    updateNotifyDelay: config.update.notifyDelay,
    updateSource: config.update.source,
    enableNavigation: config.navigation.enable,
    navigationCards: config.navigation.cards,
    enableNavigationFilters: config.navigation.filters?.enable,
    navigationFilterTags: config.navigation.filters?.tags,
    version: config.version,
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
