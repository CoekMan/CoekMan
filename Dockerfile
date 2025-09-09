# 使用官方Node.js镜像作为基础镜像
# ===== 构建阶段 =====
FROM node:16-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装所有依赖（包括开发依赖）
RUN npm install

# ===== 运行阶段 =====
FROM node:16-alpine

# 设置维护者信息
LABEL maintainer="WeChat Auto Reply System"

# 设置工作目录
WORKDIR /app

# 设置时区为Asia/Shanghai
ENV TZ=Asia/Shanghai
RUN apk add --no-cache tzdata && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 添加非root用户以提高安全性
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 从构建阶段复制node_modules
COPY --from=builder /app/node_modules ./node_modules

# 复制项目文件
COPY package*.json ./
COPY index.js ./
COPY config.js ./
COPY .env.example ./
COPY README.md ./
COPY src/ ./src/

# 确保appuser有正确的文件权限
RUN chown -R appuser:appgroup /app

# 切换到非root用户
USER appuser

# 设置环境变量（可以通过docker run -e 参数覆盖）
ENV NODE_ENV=production

# 暴露容器端口
EXPOSE 80

# 启动应用
CMD ["npm", "start"]