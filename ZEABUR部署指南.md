# Zeabur 部署指南

## 🚀 快速部署步骤

### 方法一：通过 GitHub 部署（推荐）

#### 第 1 步：准备代码
1. 将整个项目文件夹上传到 GitHub 仓库
2. 确保包含以下文件：
   - `index.html`
   - `css/` 文件夹
   - `js/` 文件夹
   - `assets/` 文件夹
   - `zeabur.json`

#### 第 2 步：在 Zeabur 上部署
1. 访问 [https://zeabur.com/](https://zeabur.com/)
2. 登录账号（可以用 GitHub 账号登录）
3. 点击 **"Create Project"**
4. 选择 **"Deploy from GitHub"**
5. 选择你的仓库：`30761985-byte/xxxb`
6. 选择分支：`main` 或 `master`
7. 点击 **"Deploy"**

#### 第 3 步：配置域名（可选）
1. 部署完成后，点击项目
2. 进入 **"Domain"** 标签
3. 可以绑定自定义域名或使用 Zeabur 提供的免费域名

---

### 方法二：直接上传部署

#### 第 1 步：打包项目
将以下文件打包成 zip：
```
项目根目录/
├── index.html
├── zeabur.json
├── css/
│   ├── style.css
│   ├── pages.css
│   └── upload.css
├── js/
│   ├── main.js
│   ├── admin.js
│   ├── storage.js
│   └── upload.js
└── assets/
    ├── images/
    ├── videos/
    └── audio/
```

#### 第 2 步：上传到 Zeabur
1. 访问 [https://zeabur.com/](https://zeabur.com/)
2. 登录账号
3. 点击 **"Create Project"**
4. 选择 **"Upload ZIP"**
5. 上传打包好的 zip 文件
6. 等待部署完成

---

## ⚙️ 配置文件说明

### zeabur.json
```json
{
  "name": "xiaopao-portfolio",
  "type": "static",
  "build": {
    "command": "",
    "output": "."
  }
}
```

- `type: "static"` - 表示静态网站
- `output: "."` - 表示根目录就是输出目录

---

## 💾 必须配置：数据持久化（防止文件丢失）

Zeabur 的容器是临时的，每次重新部署，容器内的文件都会被重置。
为了防止上传的图片和作品数据丢失，**必须**配置持久化存储（Volume）。

### 步骤 1：创建挂载卷 (Volume)
1. 在 Zeabur 项目中，点击你的服务。
2. 进入 **Volumes** 标签页。
3. 点击 **Add Volume**。
4. **Mount Path**（挂载路径）填写 `/data`。
   - 这样，容器内的 `/data` 目录就会被持久化保存，重启也不会丢失。

### 步骤 2：配置环境变量
1. 进入 **Variables** 标签页。
2. 添加以下两个环境变量：
   - `DATA_FILE_PATH` = `/data/data.json`
   - `UPLOADS_DIR_PATH` = `/data/uploads`

这样配置后，你的数据文件和上传的图片都会保存在 `/data` 目录下，即使重新部署也不会丢失。

---

## 🔧 注意事项

### 1. 后端服务
当前前端使用的是 localStorage 存储数据。如果需要后端服务：
- 需要单独部署后端（Node.js + SQLite）
- 或者使用 Zeabur 的 Docker 部署方式

### 2. 文件大小限制
- Zeabur 免费版有存储限制
- 大视频文件建议：
  - 压缩后再上传
  - 或使用外部存储（如阿里云 OSS、七牛云等）

### 3. 环境变量
如果部署后端，需要设置环境变量：
```
JWT_SECRET=your-secret-key
PORT=3000
```

---

## 📋 部署检查清单

- [ ] 所有 HTML/CSS/JS 文件已上传
- [ ] 图片资源已包含
- [ ] `zeabur.json` 文件已添加
- [ ] 在 Zeabur 上成功创建项目
- [ ] 网站可以正常访问
- [ ] 页面跳转正常
- [ ] 管理员登录功能正常

---

## 🔗 相关链接

- Zeabur 官网：https://zeabur.com/
- Zeabur 文档：https://docs.zeabur.com/
- 你的仓库：https://github.com/30761985-byte/xxxb

---

## ❓ 常见问题

### Q: 部署后页面显示 404？
A: 确保 `zeabur.json` 配置正确，并且 `index.html` 在根目录。

### Q: 图片/视频加载不出来？
A: 检查文件路径是否正确，建议使用相对路径 `./assets/...`

### Q: 如何更新网站？
A: 如果是 GitHub 部署，直接推送代码到仓库，Zeabur 会自动重新部署。

### Q: 需要后端数据库怎么办？
A: 可以：
1. 使用 Zeabur 的 MySQL/PostgreSQL 服务
2. 使用第三方数据库服务
3. 继续使用 localStorage（仅限前端）

---

## 📞 需要帮助？

如果遇到问题：
1. 查看 Zeabur 官方文档
2. 检查浏览器控制台报错
3. 确认所有文件都已正确上传
