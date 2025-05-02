#!/bin/sh
set -e

# 设置内存限制配置
export NODE_OPTIONS="--max-old-space-size=512 --optimize-for-size"

# 确保脚本具有可执行权限
chmod +x /usr/local/bin/docker-entrypoint.sh

# 设置TERM环境变量，防止一些终端相关的问题
export TERM=xterm

# 使用PM2启动应用程序
exec pm2-runtime start index.js --name "app" \
  --max-memory-restart 1500M \
  --node-args="--optimize-for-size" \
  --instances 1 \
  --exp-backoff-restart-delay=100 \
  --merge-logs 