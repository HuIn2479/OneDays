# 🌟 OneDays

> 一个优雅的纯静态页面项目

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Version](https://img.shields.io/badge/Version-0.11.8-green.svg)
![Static](https://img.shields.io/badge/Static-Only-orange.svg)

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

- [Hitokoto](https://hitokoto.cn/)
- [Cloudflare](https://cloudflare.com/)

## 📄 许可证

[MIT](LICENSE) © 2024 HuIn2479
