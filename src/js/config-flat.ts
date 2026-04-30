// config-flat.ts — 将嵌套配置扁平化为 __APP_CONFIG__ 所需的平级键

// 嵌套路径 -> 扁平键名 的映射表
// 格式: [flatKey, nestedPath]
const FLAT_MAP: [string, string][] = [
  // meta
  ["launchDate", "meta.launchDate"],
  ["title", "meta.title"],
  ["subtitle", "meta.subtitle"],
  // splash
  ["enableSplash", "splash.enable"],
  ["splashMinDuration", "splash.minDuration"],
  ["removeSplashIfFast", "splash.removeIfFast"],
  ["skeletonFadeDelay", "splash.skeletonFadeDelay"],
  ["splashHeading", "splash.heading"],
  ["splashSubheading", "splash.subheading"],
  // theme
  ["accents", "theme.accents"],
  ["defaultAccentIndex", "theme.defaultAccentIndex"],
  ["enableAccentPanel", "theme.enableAccentPanel"],
  ["enableAccentAutoRotate", "theme.autoRotate.enable"],
  ["accentRotateSchedule", "theme.autoRotate.schedule"],
  // effects
  ["enableScrollProgress", "effects.enableScrollProgress"],
  // runtime
  ["enableRuntime", "runtime.enable"],
  // hitokoto
  ["enableHitokoto", "hitokoto.enable"],
  ["hitokotoProvider", "hitokoto.provider"],
  ["hitokotoApis", "hitokoto.apis"],
  ["hitokotoTimeout", "hitokoto.timeout"],
  ["hitokotoRetries", "hitokoto.retries"],
  ["hitokotoCacheTime", "hitokoto.cacheTime"],
  // announcement
  ["enableAnnouncement", "announcement.enable"],
  ["announcementIcon", "announcement.icon"],
  ["announcementMessages", "announcement.messages"],
  ["announcementCycleInterval", "announcement.cycleInterval"],
  ["announcementTransition", "announcement.transition"],
  ["announcementDismissKey", "announcement.dismissKey"],
  ["enableAnnouncementClose", "announcement.closeButton"],
  ["enableAnnouncementRemoteFeed", "announcement.remoteFeed.enable"],
  ["announcementRemoteSource", "announcement.remoteFeed.source"],
  ["announcementRemoteRefresh", "announcement.remoteFeed.refreshInterval"],
  // performance
  ["adaptivePerformance", "performance.adaptive"],
  ["enableIdleAutoRelease", "performance.idleAutoRelease"],
  ["idleReleaseDelay", "performance.idleReleaseDelay"],
  ["idleDeepReleaseDelay", "performance.idleDeepReleaseDelay"],
  ["enableIdleAutoRestore", "performance.idleAutoRestore"],
  // update
  ["enableUpdateCheck", "update.enable"],
  ["updateCheckInterval", "update.checkInterval"],
  ["updateNotifyDelay", "update.notifyDelay"],
  ["updateSource", "update.source"],
  // navigation
  ["enableNavigation", "navigation.enable"],
  ["navigationMaxDisplayCount", "navigation.maxDisplayCount"],
  ["navigationShowAll", "navigation.showAll"],
  ["navigationCards", "navigation.cards"],
  ["enableNavigationFilters", "navigation.filters.enable"],
  ["navigationFilterTags", "navigation.filters.tags"],
  // easter
  ["enableKonami", "easter.konami"],
  ["enableTitleClicks", "easter.titleClicks"],
  ["titleClickWindow", "easter.maxTitleInterval"],
  ["titleClickThreshold", "easter.titleClickThreshold"],
  ["enableAsciiPanel", "easter.ascii"],
  ["enableConfetti", "easter.confetti"],
  ["catDriftInterval", "easter.catDriftInterval"],
];

function getNested(obj: any, path: string): any {
  let cur = obj;
  for (const key of path.split(".")) {
    if (cur == null) return undefined;
    cur = cur[key];
  }
  return cur;
}

export function flattenConfig(config: Record<string, any>): Record<string, any> {
  const flat: Record<string, any> = {};
  for (const [flatKey, nestedPath] of FLAT_MAP) {
    flat[flatKey] = getNested(config, nestedPath);
  }
  flat.version = config.version;
  return flat;
}
