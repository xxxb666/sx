# 使用轻量级的 Node.js 镜像
FROM node:18-slim

# 设置工作目录
WORKDIR /app

# 首先只复制 package.json 和 package-lock.json（如果有），以利用 Docker 缓存
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制项目所有文件
COPY . .

# 暴露服务器端口 (与 server.js 中的 8080 一致)
EXPOSE 8080

# 启动命令
CMD ["npm", "start"]
