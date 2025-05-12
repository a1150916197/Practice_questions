@echo off
chcp 65001 > nul
echo 启动生产环境服务器...
echo 内存限制设置为 12MB
set NODE_OPTIONS=--max-old-space-size=12288

node server.js 