# 🌟 OneDays

> 一个优雅的纯静态页面项目，提供现代化的用户体验和丰富的交互功能

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Version](https://img.shields.io/badge/Version-0.11.8-green.svg)
![Static](https://img.shields.io/badge/Static-Only-orange.svg)

## ✨ 特性

- 🎨 **主题系统** - 支持多主题切换和 Accent 色彩自定义
- 📢 **动态公告** - 智能公告系统 + 一言集成
- 🔄 **自动更新** - 版本检测与静默刷新机制
- 💾 **内存管理** - 智能内存释放与功能恢复
- 🐱 **互动彩蛋** - 可爱的猫猫漂浮动画
- 📱 **响应式设计** - 完美适配各种设备屏幕
- ⚡ **纯静态** - 零依赖，即拷即用

## 🚀 快速开始

### 1. 获取代码

```bash
# 克隆仓库
git clone https://github.com/HuIn2479/OneDays.git
cd OneDays

# 或者直接下载 ZIP 文件
```

### 2. 自定义配置

```bash
# 替换 Logo
# 将您的 Logo 文件替换 image/logo/index.jpg

# 修改配置文件
# 编辑 js/config.js 进行个性化配置
```

### 3. 本地预览

```powershell
# 使用 Python 启动本地服务器
python -m http.server 5173

# 或使用 Node.js
npx http-server -p 5173

# 访问 http://localhost:5173
```

## ⚙️ 配置说明

### 基础配置 (`js/config.js`)

```javascript
const config = {
  // 版本信息 - 修改后会触发静默刷新
  version: "V1.0.0",

  // 自动更新设置
  update: {
    enable: true, // 启用自动更新检测
    interval: 300000, // 检测间隔 (毫秒)
  },

  // 内存管理设置
  idle: {
    enable: true, // 启用闲置时内存释放
    timeout: 600000, // 闲置超时时间 (毫秒)
  },

  // 猫猫动画设置
  catDriftInterval: 14000, // 猫猫漂浮间隔 (毫秒)

  // 主题设置
  theme: {
    default: "light", // 默认主题
    accent: "#007acc", // 主色调
  },
};
```

### 公告配置 (`data/announcements.json`)

```json
{
  "announcements": [
    {
      "id": 1,
      "text": "欢迎使用 OneDays！",
      "type": "info",
      "timestamp": "2025-01-01T00:00:00Z"
    }
  ]
}
```

## 🛠️ API 接口

### 内存管理

```javascript
// 释放内存 (等级: 1-轻度, 2-中度, 3-重度)
releaseMemory(1);

// 恢复所有功能
restoreFeatures();
```

### 公告系统

```javascript
// 添加新公告
__announceAdd({
  text: "系统维护通知：今晚 23:00 开始",
  type: "warning",
});

// 清除所有公告
__announceClear();
```

### 主题控制

```javascript
// 切换主题
switchTheme("dark");

// 设置主色调
setAccentColor("#ff6b6b");
```

### 猫猫控制

```javascript
// 分离猫猫 (禁用动画)
detachMaomao();

// 重新启用猫猫
attachMaomao();
```

## 🎯 功能控制

| 功能     | 启用                          | 禁用                           |
| -------- | ----------------------------- | ------------------------------ |
| 自动更新 | `config.update.enable = true` | `config.update.enable = false` |
| 内存释放 | `config.idle.enable = true`   | `config.idle.enable = false`   |
| 猫猫动画 | `attachMaomao()`              | `detachMaomao()`               |

## 📁 项目结构

```text
OneDays/
├── css/                    # 样式文件
│   ├── index.css          # 主样式
│   └── maomao.css         # 猫猫动画样式
├── data/                   # 数据文件
│   └── announcements.json # 公告数据
├── image/                  # 图片资源
│   ├── logo/              # Logo 文件
│   └── maomao/            # 猫猫相关图片
├── js/                     # JavaScript 文件
│   ├── config.js          # 配置文件
│   ├── core.js            # 核心功能
│   ├── theme.js           # 主题系统
│   └── ...                # 其他功能模块
├── error/                  # 错误页面
├── index.html             # 主页面
└── README.md              # 项目说明
```

## 🚀 部署方式

支持部署到任何静态文件托管服务：

### GitHub Pages

1. Fork 本仓库
2. 在仓库设置中启用 GitHub Pages
3. 选择 `main` 分支作为源

### Netlify

1. 连接 GitHub 仓库
2. 构建命令：无需构建
3. 发布目录：`/`

### Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

### Cloudflare Pages

1. 连接 Git 仓库
2. 构建设置：无需构建
3. 输出目录：`/`

## 🙏 致谢

感谢以下开源项目和服务：

- [Hitokoto](https://hitokoto.cn/) - 提供一言 API 服务
- [Cloudflare](https://cloudflare.com/) - 提供 CDN 和安全服务

## 📄 许可证

[MIT](LICENSE) © 2024 HuIn2479
