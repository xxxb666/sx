# 徐小泡的专属空间 - 个人作品展示网站

## 项目简介

这是一个为"徐小泡"设计的个人作品展示网站，采用游戏界面风格，主色调为粉色，简洁清晰。网站展示了AI辅助创作的照片和视频、舞蹈视频、奖状/奖杯/奖牌、绘画作品、PPT等内容。

## 项目特色

- 游戏界面风格设计，简洁清晰
- 粉色主色调，搭配浅白、浅灰辅助色
- 页面切换淡入淡出效果
- 鼠标hover卡片轻微放大
- 翻书式展示绘画作品（带音效）
- 游戏卡牌式荣誉墙展示
- 支持文档下载功能

## 项目结构

```
徐小泡的专属空间 - 个人作品展示网站项目文档/
├── index.html              # 主页面
├── css/
│   ├── style.css          # 主样式文件
│   └── pages.css          # 子页面样式
├── js/
│   └── main.js            # 主要JavaScript逻辑
├── assets/
│   ├── images/            # 图片资源
│   ├── videos/            # 视频资源
│   ├── audio/             # 音频资源
│   └── documents/         # 文档资源
├── start-server.ps1       # 本地服务器启动脚本
└── README.md             # 项目说明文档
```

## 功能页面

1. **首页** - 游戏界面风格，包含6个入口卡片和文档下载按钮
2. **绘画作品页** - 翻书式展示，支持翻页音效
3. **舞蹈视频页** - 视频封面列表，点击播放
4. **AI作品页** - 混合卡片列表，展示AI照片和视频
5. **荣誉墙** - 游戏卡牌式展示，悬浮质感
6. **我的简单介绍** - 个人信息展示
7. **PPT展示** - 分页展示PPT内容

## 如何使用

### 方法一：使用本地服务器（推荐）

1. 打开PowerShell终端
2. 进入项目目录
3. 运行以下命令启动服务器：

```powershell
powershell -ExecutionPolicy Bypass -File start-server.ps1
```

4. 在浏览器中访问：http://localhost:8000

### 方法二：直接打开

直接在浏览器中打开 `index.html` 文件即可浏览网站。

## 资源替换说明

当前网站使用的是占位符资源，请按照以下说明替换为实际内容：

### 图片资源

- `assets/images/painting*.jpg` - 绘画作品图片
- `assets/images/dance*.jpg` - 舞蹈视频封面
- `assets/images/ai*.jpg` - AI作品图片
- `assets/images/honor*.jpg` - 荣誉照片
- `assets/images/avatar.jpg` - 个人头像
- `assets/images/ppt*.jpg` - PPT页面截图

### 视频资源

- `assets/videos/dance*.mp4` - 舞蹈视频
- `assets/videos/ai*.mp4` - AI生成视频

### 音频资源

- `assets/audio/page-turn.mp3` - 翻页音效

### 文档资源

- `assets/documents/徐小泡的专属空间-作品合集.txt` - 下载文档（建议转换为PDF格式）

## 技术栈

- HTML5
- CSS3（包含动画效果）
- JavaScript（原生）
- 无需额外依赖

## 浏览器兼容性

- Chrome（推荐）
- Firefox
- Edge
- Safari

## 注意事项

1. 建议使用现代浏览器以获得最佳体验
2. 视频文件建议使用MP4格式，分辨率1280x720或更高
3. 图片建议使用JPG或PNG格式
4. 翻页音效文件建议时长0.5-1秒，音量适中

## 更新日志

### V1.1 (2026年2月)
- 完成基础功能开发
- 添加所有子页面
- 实现页面切换动画效果
- 添加文档下载功能

## 联系方式

如有问题或建议，请联系项目维护者。

---

祝使用愉快！