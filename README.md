# 小升初数学衔接学习助手

## 项目简介

这是一个专为小学升初中学生设计的数学衔接学习网站，帮助学生巩固小学数学基础，提前预习初中数学知识，实现平稳过渡。网站采用清新简洁的界面设计，包含知识点梳理、例题练习、错题本、AI数学助手等功能模块。

## 项目特色

- 知识点按章节分类，清晰易学
- 交互式例题练习，即时反馈
- 自动记录错题，方便复习
- AI数学助手在线答疑
- 响应式设计，支持多设备访问
- 精美的 SVG 图形演示

## 项目结构

```
小升初数学衔接学习助手/
├── math_study.html        # 主网站文件
├── index.html             # 入口页面
├── public/                # 前端资源目录
│   ├── css/               # 样式文件
│   └── js/                # JavaScript 文件
├── server.js              # Node.js 服务器
├── package.json           # 项目配置
├── Dockerfile             # Docker 配置
├── zeabur.json            # 部署配置
└── README.md              # 项目说明
```

## 功能模块

### 1. 首页
- 欢迎介绍
- 使用步骤指引
- 教材目录导航

### 2. 知识点梳理
- 第一章：丰富的图形世界
- 第二章：有理数及其运算
- 第三章：整式及其加减
- 第四章：基本平面图形
- 第五章：一元一次方程
- 第六章：数据的收集与整理

### 3. 例题练习
- 选择题练习
- 即时答案反馈
- 详细解析说明

### 4. 错题本
- 自动记录错题
- 支持手动添加
- 方便复习回顾

### 5. AI数学助手
- 在线提问答疑
- 支持图片上传
- 智能解题分析

## 如何使用

### 方法一：直接打开
双击 `math_study.html` 文件即可在浏览器中打开网站。

### 方法二：本地服务器
```bash
# 安装依赖
npm install

# 启动服务器
node server.js

# 访问 http://localhost:3000
```

### 方法三：Docker 部署
```bash
docker build -t math-study .
docker run -p 3000:3000 math-study
```

## 技术栈

- HTML5
- CSS3（动画、响应式设计）
- JavaScript（原生）
- SVG 图形
- Node.js（可选服务器）

## 浏览器兼容性

- Chrome（推荐）
- Firefox
- Edge
- Safari

## 在线访问

- GitHub Pages: https://xxxb666.github.io/sx/math_study.html
- Gitee Pages: https://xumingqi444.gitee.io/xxxb/math_study.html

## 更新日志

### V1.0 (2026年3月)
- 完成基础功能开发
- 添加知识点梳理模块
- 添加例题练习模块
- 添加错题本功能
- 添加AI数学助手
- 优化界面布局和样式

---

祝学习愉快！
