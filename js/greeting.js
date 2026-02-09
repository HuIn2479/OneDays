(function () {
  const t = window.__I18N__?.t || ((k) => k);
  const cfg = window.__APP_CONFIG__ || {};

  // 使用设备本地时间
  const now = new Date();
  const hour = now.getHours();

  // 根据小时数判断时间段
  let greetingKey;
  if (hour >= 0 && hour < 5) {
    greetingKey = "greetingLateNight";
  } else if (hour >= 5 && hour < 9) {
    greetingKey = "greetingDawn";
  } else if (hour >= 9 && hour < 11) {
    greetingKey = "greetingMorning";
  } else if (hour >= 11 && hour < 13) {
    greetingKey = "greetingNoon";
  } else if (hour >= 13 && hour < 17) {
    greetingKey = "greetingAfternoon";
  } else if (hour >= 17 && hour < 19) {
    greetingKey = "greetingEvening";
  } else if (hour >= 19 && hour < 22) {
    greetingKey = "greetingNight";
  } else {
    greetingKey = "greetingLateNight";
  }

  const greeting = t(greetingKey);

  if (greeting) {
    const title = cfg.title || "OneDay";
    document.title = title + "'S Home | " + greeting;
  }
})();
