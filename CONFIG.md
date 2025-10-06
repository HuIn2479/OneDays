# 🔧 OneDays 配置指南

> 详细说明 OneDays 项目中 `js/config.js` 文件的所有配置选项

## 🚀 快速开始

OneDays 使用单一的配置文件 `js/config.js` 来管理所有功能。配置采用模块化设计，每个功能都有独立的配置项。

## 📋 配置结构

```javascript
const config = {
  version: "v0.11.8",          // 版本号
  meta: { /* 基础信息 */ },
  splash: { /* 启动画面 */ },
  theme: { /* 主题系统 */ },
  effects: { /* 视觉效果 */ },
  runtime: { /* 运行时间 */ },
  hitokoto: { /* 一言系统 */ },
  announcement: { /* 公告系统 */ },
  performance: { /* 性能优化 */ },
  update: { /* 版本更新 */ },
  navigation: { /* 导航卡片 */ },
  easter: { /* 彩蛋功能 */ }
};
```

---

## 🎯 基础配置

### 版本信息

```javascript
version: "v0.11.8"  // 当前版本号，用于版本检测
```

### 站点信息

```javascript
meta: {
  launchDate: "2021-02-27T00:00:00+08:00",  // 网站启动日期
  title: "忆窝",                             // 网站标题  
  subtitle: "One Day."                       // 网站副标题
}
```

---

## 🎨 主题系统

### 基础主题配置

```javascript
theme: {
  // 主色调数组 (HSL格式)
  accents: [
    "hsl(350 82% 54%)",  // 红色
    "hsl(215 85% 55%)",  // 蓝色  
    "hsl(135 50% 42%)",  // 绿色
    "hsl(32 90% 52%)",   // 橙色
    "hsl(275 70% 60%)"   // 紫色
  ],
  
  defaultAccentIndex: 0,     // 默认主色调索引 (0-4)
  enableAccentPanel: true,   // 启用色彩选择面板
}
```

### 自动主题轮换

```javascript
theme: {
  autoRotate: {
    enable: true,              // 启用自动轮换
    schedule: {
      dawn: 0,   // 黎明 6:00-10:00  -> accents[0]
      noon: 1,   // 正午 10:00-16:00 -> accents[1]  
      dusk: 3,   // 黄昏 16:00-20:00 -> accents[3]
      night: 4   // 夜晚 20:00-6:00  -> accents[4]
    }
  }
}
```

**自定义主色调**

HSL 色彩格式说明：`"hsl(色相 饱和度% 亮度%)"`

- **色相** (0-360): 红0, 黄60, 绿120, 青180, 蓝240, 紫300
- **饱和度** (0-100%): 0%灰色, 100%纯色
- **亮度** (0-100%): 0%黑色, 50%正常, 100%白色

---

## 🌟 启动画面

```javascript
splash: {
  enable: true,           // 启用启动画面
  minDuration: 1000,      // 最小显示时间 (毫秒)
  removeIfFast: true,     // 快速加载时移除启动画面
  skeletonFadeDelay: 120  // 骨架屏淡出延迟 (毫秒)
}
```

**推荐设置**

- 桌面端: `minDuration: 1000-1500`
- 移动端: `minDuration: 800-1200`

---

## ✨ 视觉效果

```javascript
effects: {
  enableScrollProgress: false   // 启用滚动进度条
}
```

```javascript
runtime: {
  enable: true                  // 显示网站运行时长
}
```

运行时间基于 `meta.launchDate` 计算。

---

## 📝 一言系统

### 基础配置

```javascript
hitokoto: {
  enable: true,                 // 启用一言显示
  provider: "hitokoto",         // API提供者: "hitokoto" | "custom"
  timeout: 8000,                // 请求超时 (毫秒)
  retries: 2,                   // 失败重试次数
  cacheTime: 300000             // 缓存时间 (毫秒)
}
```

### API 配置

```javascript
hitokoto: {
  apis: {
    // 官方一言 API
    hitokoto: {
      url: "https://v1.hitokoto.cn/",
      categories: ["a", "b", "d", "h"],  // 句子分类
      params: { encode: "json" }
    },
    
    // 自定义 API
    custom: {
      url: "",                  // 自定义API地址
      params: {}
    }
  }
}
```

**句子分类**

| 代码 | 类型 | 代码 | 类型 | 代码 | 类型 |
|-----|------|-----|------|-----|------|
| a | 动画 | e | 原创 | i | 诗词 |
| b | 漫画 | f | 网络 | j | 网易云 |
| c | 游戏 | g | 其他 | k | 哲学 |
| d | 文学 | h | 影视 | l | 抖机灵 |

---

## 📢 公告系统

### 公告配置

```javascript
announcement: {
  enable: true,                 // 启用公告系统
  icon: "😽",                   // 公告图标 (emoji)
  cycleInterval: 4800,          // 轮播间隔 (毫秒)
  transition: 500,              // 过渡动画时长 (毫秒)
  dismissKey: "ann-v3",         // 本地存储键名
  closeButton: true             // 显示关闭按钮
}
```

### 公告内容

```javascript
announcement: {
  messages: [
    "平安喜樂，萬事勝意，祝你，祝我，祝我們",
    "关注卡拉彼丘喵！关注卡拉彼丘谢谢喵！",
    "ISTP-A | 机械键盘爱好者 | 猫奴"
  ]
}
```

### 远程公告

```javascript
announcement: {
  remoteFeed: {
    enable: false,              // 启用远程公告
    source: "/data/announcements.json",  // 数据源
    refreshInterval: 3600000    // 刷新间隔 (毫秒)
  }
}
```

**远程公告 JSON 格式**

```json
{
  "announcements": [
    {
      "id": 1,
      "text": "系统维护通知",
      "type": "info", 
      "timestamp": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

## ⚡ 性能优化

```javascript
performance: {
  adaptive: true,               // 自适应关闭部分特效
  idleAutoRelease: true,        // 空闲自动释放内存
  idleReleaseDelay: 60000,      // 一级释放延迟 (毫秒)
  idleDeepReleaseDelay: 180000, // 深度释放延迟 (毫秒)
  idleAutoRestore: true         // 交互自动恢复功能
}
```

**性能优化机制**

1. **自适应特效**: 根据设备性能自动调整效果
2. **空闲释放**: 用户无操作时释放内存占用  
3. **自动恢复**: 用户重新交互时恢复所有功能

**延迟时间建议**

- 移动端: `idleReleaseDelay: 30000`
- 桌面端: `idleReleaseDelay: 60000`
- 低性能设备: `idleDeepReleaseDelay: 90000`

---

## 🔄 版本更新

```javascript
update: {
  enable: true,                 // 启用自动版本检测
  checkInterval: 300000,        // 检测间隔 (毫秒)
  notifyDelay: 0,               // 通知延迟 (毫秒)
  source: "/js/config.js"       // 版本检测源文件
}
```

系统会定期检查源文件中的 `version` 字段，发现更新时自动刷新页面。

---

## 🧭 导航系统

### 导航配置

```javascript
navigation: {
  enable: true,                 // 启用导航功能
  
  // 导航卡片
  cards: [
    {
      id: "blog",               // 唯一标识
      icon: "🎯",               // 卡片图标 (emoji)
      title: "博客",             // 卡片标题
      description: "记录生活点滴",  // 卡片描述
      url: "https://blog.example.com",  // 链接地址
      target: "_blank",         // 打开方式: "_self" | "_blank"
      tags: ["blog", "personal"] // 分类标签
    }
  ],
  
  // 标签筛选器
  filters: {
    enable: true,               // 启用筛选功能
    tags: ["blog", "dev", "personal"]  // 可筛选标签
  }
}
```

**卡片配置说明**

- `target`:
  - `"_self"`: 当前窗口打开
  - `"_blank"`: 新窗口打开
- `tags`: 用于分类筛选的标签数组
- `icon`: 支持 emoji 或图标字体

---

## 🎮 彩蛋功能

```javascript
easter: {
  konami: true,                 // Konami 代码彩蛋
  titleClicks: true,            // 标题连击彩蛋
  maxTitleInterval: 2000,       // 连击时间窗口 (毫秒)
  titleClickThreshold: 7,       // 触发连击次数
  ascii: true,                  // ASCII 艺术面板
  confetti: true,               // 猫咪点击彩带效果
  catDriftInterval: 12000       // 猫咪漂移间隔 (毫秒，0=关闭)
}
```

**彩蛋触发方式**

- **Konami 代码**: ↑↑↓↓←→←→BA (方向键+B+A)
- **标题连击**: 在设定时间内快速点击页面标题
- **猫咪互动**: 点击页面中的猫咪元素

---

## 🎛️ 完整配置示例

以下是一个针对不同场景的配置示例：

### 个人博客配置

```javascript
const config = {
  version: "v1.0.0",
  
  meta: {
    launchDate: "2024-01-01T00:00:00+08:00",
    title: "我的博客",
    subtitle: "记录生活·分享技术"
  },
  
  theme: {
    accents: [
      "hsl(220 90% 65%)",  // 蓝色主题
      "hsl(280 70% 70%)",  // 紫色
      "hsl(160 60% 60%)",  // 绿色
      "hsl(30 85% 65%)",   // 橙色
      "hsl(340 80% 70%)"   // 红色
    ],
    defaultAccentIndex: 0,
    enableAccentPanel: true,
    autoRotate: { enable: true, schedule: { dawn: 0, noon: 1, dusk: 3, night: 4 } }
  },
  
  hitokoto: {
    enable: true,
    provider: "hitokoto",
    apis: {
      hitokoto: {
        url: "https://v1.hitokoto.cn/",
        categories: ["d", "h", "i"],  // 文学、影视、诗词
        params: { encode: "json" }
      }
    }
  },
  
  announcement: {
    enable: true,
    icon: "📝",
    messages: ["欢迎来到我的博客！", "记得关注最新文章~"]
  }
};
```

### 极简配置

```javascript  
const config = {
  version: "v1.0.0",
  meta: { title: "Simple Page", subtitle: "" },
  
  // 关闭大部分功能
  splash: { enable: false },
  announcement: { enable: false },
  navigation: { enable: false },
  easter: { konami: false, titleClicks: false, confetti: false, catDriftInterval: 0 },
  
  // 保留核心功能
  theme: { accents: ["hsl(220 90% 65%)"], defaultAccentIndex: 0 },
  hitokoto: { enable: true, provider: "hitokoto" }
};
```

### 性能优化配置

```javascript
const config = {
  // 移动端优化
  performance: {
    adaptive: true,
    idleAutoRelease: true,
    idleReleaseDelay: 30000,      // 更短释放延迟
    idleDeepReleaseDelay: 90000,
    idleAutoRestore: true
  },
  
  // 关闭消耗性能的效果
  effects: { enableScrollProgress: false },
  splash: { enable: false },
  easter: { catDriftInterval: 0 },
  
  // 减少网络请求
  hitokoto: { cacheTime: 600000 },  // 10分钟缓存
  update: { checkInterval: 600000 } // 10分钟检查一次
};
```

---

## 🔧 故障排除

### 常见问题

**1. 配置不生效**

```javascript
// 检查语法错误
const config = {
  version: "v1.0.0",  // ← 注意逗号
  theme: {
    accents: ["hsl(220 90% 65%)"]  // ← 注意引号和括号
  }  // ← 最后一项不要逗号
};
```

**2. 一言显示异常**

```javascript
hitokoto: {
  timeout: 10000,    // 增加超时时间
  retries: 3,        // 增加重试次数
  provider: "custom", // 尝试自定义API
  apis: {
    custom: {
      url: "https://your-api.com/hitokoto",
      params: {}
    }
  }
}
```

**3. 主题色彩问题**

```javascript
// 正确的HSL格式
"hsl(220 90% 65%)"  ✅
"220, 90%, 65%"     ❌

// 检查索引范围
defaultAccentIndex: 0  // accents数组长度为5，索引0-4
```

**4. 性能问题**

```javascript
// 启用所有优化选项
performance: {
  adaptive: true,
  idleAutoRelease: true,
  idleReleaseDelay: 30000
},
effects: {
  enableScrollProgress: false
},
easter: {
  catDriftInterval: 0  // 关闭猫咪动画
}
```

### 调试技巧

1. **查看控制台**: 按 F12 查看错误信息
2. **检查网络**: 确认API可访问性
3. **清除缓存**: 强制刷新查看最新配置
4. **分步测试**: 逐项启用功能定位问题

---

## 🎯 最佳实践

### 配置文件管理

1. **版本控制**: 每次修改后更新 `version` 号
2. **备份配置**: 修改前保存原配置
3. **文档同步**: 重要修改记录到文档中

### 性能建议

1. **移动端优化**: 缩短各种延迟时间
2. **弱网络**: 增加超时时间和重试次数  
3. **低性能设备**: 关闭动画效果

### 用户体验

1. **主题一致**: 保持色彩搭配协调
2. **内容质量**: 定期更新公告和导航
3. **加载体验**: 合理设置启动画面时长

---

**配置完成后记得刷新页面查看效果！** 🎉

如有问题，请检查浏览器控制台的错误信息。
