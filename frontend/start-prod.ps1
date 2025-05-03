# PowerShell生产环境启动脚本
Write-Host "启动生产环境服务器..." -ForegroundColor Green
$env:NODE_ENV = "production"
$env:PORT = "3000"
Write-Host "内存限制设置为512MB" -ForegroundColor Yellow
$env:NODE_OPTIONS = "--max-old-space-size=512"

# 检查build目录是否存在
if (-not (Test-Path -Path ".\build" -PathType Container)) {
    Write-Host "错误: 未找到build目录，请先运行 'npm run build:prod'" -ForegroundColor Red
    exit 1
}

# 检查server.js是否存在
if (-not (Test-Path -Path ".\server.js" -PathType Leaf)) {
    Write-Host "错误: 未找到server.js文件" -ForegroundColor Red
    exit 1
}

# 启动服务器
try {
    Write-Host "正在启动服务器，请稍候..." -ForegroundColor Cyan
    node server.js
} catch {
    Write-Host "启动服务器时出错: $_" -ForegroundColor Red
} 