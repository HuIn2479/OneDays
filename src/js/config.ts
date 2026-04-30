import { flattenConfig } from "./config-flat";
import site from "../data/site.json";
import navigation from "../data/navigation.json";
import theme from "../data/theme.json";
import hitokoto from "../data/hitokoto.json";

const nestedConfig = {
  version: __APP_VERSION__,
  meta: {
    launchDate: import.meta.env.VITE_LAUNCH_DATE || site.meta.launchDate,
    title: import.meta.env.VITE_SITE_TITLE || site.meta.title,
    subtitle: import.meta.env.VITE_SITE_SUBTITLE || site.meta.subtitle,
  },
  splash: {
    enable: true,
    minDuration: 1000,
    removeIfFast: true,
    skeletonFadeDelay: 120,
    heading: site.splash.heading,
    subheading: site.splash.subheading,
  },
  theme: {
    accents: theme.accents,
    defaultAccentIndex: theme.defaultAccentIndex,
    enableAccentPanel: true,
    autoRotate: {
      enable: true,
      schedule: theme.autoRotate.schedule,
    },
  },
  effects: {
    enableScrollProgress: false,
  },
  runtime: {
    enable: true,
  },
  hitokoto: {
    enable: true,
    provider: "hitokoto",
    apis: {
      hitokoto: {
        url: hitokoto.apis.hitokoto.url,
        categories: hitokoto.apis.hitokoto.categories,
        params: hitokoto.apis.hitokoto.params,
      },
      custom: hitokoto.apis.custom,
    },
    timeout: hitokoto.timeout,
    retries: hitokoto.retries,
    cacheTime: hitokoto.cacheTime,
  },
  announcement: {
    enable: true,
    icon: site.announcement.icon,
    messages: site.announcement.messages,
    cycleInterval: site.announcement.cycleInterval,
    transition: site.announcement.transition,
    dismissKey: site.announcement.dismissKey,
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
    source: "/version.json",
  },
  navigation: {
    enable: true,
    maxDisplayCount: 4,
    showAll: false,
    cards: navigation.cards,
    filters: navigation.filters,
  },
  easter: {
    konami: true,
    titleClicks: true,
    maxTitleInterval: 2000,
    titleClickThreshold: 7,
    ascii: true,
    confetti: true,
    catDriftInterval: 12000,
  },
};

const flat = flattenConfig(nestedConfig);
export const APP_CONFIG: Record<string, any> = { ...nestedConfig, ...flat };

// 桥接：保留 window 全局变量供尚未迁移的模块使用
(window as any).__APP_CONFIG__ = APP_CONFIG;
