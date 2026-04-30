// greeting.ts -- ES module version of greeting.js
import { APP_CONFIG } from "./config";
import { i18n } from "./i18n";

// 使用设备本地时间
const now: Date = new Date();
const hour: number = now.getHours();

// 根据小时数判断时间段
let greetingKey: string;
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

const greeting: string = i18n.t(greetingKey);

if (greeting) {
  const title: string = APP_CONFIG.title || "OneDay";
  document.title = title + "'S Home | " + greeting;
}
