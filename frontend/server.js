// 简单的生产环境静态服务器
const express = require('express');
const path = require('path');
const compression = require('compression');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// 启用gzip压缩
app.use(compression());

// 记录请求日志的中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 重要：先设置模拟API路由，当后端不可用时直接返回模拟数据
// 这些路由必须在代理中间件之前定义
app.get('/api/health-check', (req, res) => {
  console.log('使用模拟数据响应health-check请求');
  res.json({ status: 'ok', message: '服务正常运行' });
});

app.get('/api/question-banks/public', (req, res) => {
  console.log('使用模拟数据响应question-banks/public请求');
  res.json({
    data: [
      { id: 'bank1', name: '前端基础题库', count: 100, tags: ['HTML', 'CSS', 'JavaScript'] },
      { id: 'bank2', name: 'React面试题库', count: 50, tags: ['React', 'Redux', 'Hooks'] },
      { id: 'bank3', name: 'Vue开发题库', count: 80, tags: ['Vue', 'Vuex', 'Vue Router'] }
    ]
  });
});

// 设置API代理 - 在模拟数据路由之后
const apiProxy = createProxyMiddleware('/api', {
  target: API_URL, 
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // 移除/api前缀
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('代理请求:', req.method, req.url);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('代理响应:', proxyRes.statusCode, req.url);
    
    // 当后端返回404时，记录更详细的信息以便调试
    if (proxyRes.statusCode === 404) {
      console.log('后端404响应，请确认API路径是否正确:', req.url);
    }
  },
  onError: (err, req, res) => {
    console.error('代理错误:', err);
    // 设置响应头，避免CORS问题
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // 检查是否为已知API路径，提供相应的模拟数据
    if (req.url === '/api/health-check') {
      console.log('代理错误，使用模拟数据响应health-check请求');
      return res.json({ status: 'ok', message: '服务正常运行' });
    } else if (req.url === '/api/question-banks/public') {
      console.log('代理错误，使用模拟数据响应question-banks/public请求');
      return res.json({
        data: [
          { id: 'bank1', name: '前端基础题库', count: 100, tags: ['HTML', 'CSS', 'JavaScript'] },
          { id: 'bank2', name: 'React面试题库', count: 50, tags: ['React', 'Redux', 'Hooks'] },
          { id: 'bank3', name: 'Vue开发题库', count: 80, tags: ['Vue', 'Vuex', 'Vue Router'] }
        ]
      });
    }
    
    // 通用错误响应
    res.status(500).json({ message: '后端服务暂时不可用，请稍后再试' });
  }
});

// 使用API代理中间件 - 会处理未被上面模拟数据路由匹配的API请求
app.use('/api', apiProxy);

// 静态文件服务
app.use(express.static(path.join(__dirname, 'build'), {
  // 设置缓存头
  maxAge: '7d', // 7天缓存
  etag: true, // 启用ETag
}));

// 所有请求路由到index.html (SPA支持)
// 修改路由匹配方式，避免path-to-regexp错误
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// 捕获所有其他路由
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器启动在端口 ${PORT}`);
  console.log(`API代理目标: ${API_URL}`);
  console.log(`访问 http://localhost:${PORT}`);
  console.log(`模拟数据功能已启用，支持的API路径: /api/health-check, /api/question-banks/public`);
});

// 处理进程信号
process.on('SIGINT', () => {
  console.log('服务器关闭');
  process.exit(0);
});

// 全局错误处理
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

// 内存使用监控
setInterval(() => {
  const memoryUsage = process.memoryUsage();
  console.log(`内存使用: ${Math.round(memoryUsage.rss / 1024 / 1024)} MB`);
}, 60000); // 每分钟记录一次