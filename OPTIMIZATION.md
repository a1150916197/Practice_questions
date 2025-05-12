# 应用优化指南 - 2核2G云服务器部署

本文档提供了将应用程序优化并部署到资源受限环境(2核2G Linux云服务器)的完整指南。

## 优化概述

为使应用程序在低资源环境中高效运行，我们进行了以下优化：

1. **前端优化**
   - React组件优化
   - 构建优化
   - 代码分割与懒加载
   - 静态资源优化

2. **后端优化**
   - 内存使用限制
   - 数据库查询优化
   - 缓存策略
   - 进程管理

3. **部署优化**
   - Docker多阶段构建
   - Nginx配置优化
   - MongoDB配置优化
   - 监控与自动恢复

## 前端优化详解

### React组件优化

1. **使用React.memo避免不必要的重渲染**
   
   ```tsx
   const CustomButton = memo(({ ... }) => { ... });
   ```

2. **避免重复创建引用数据**
   
   ```tsx
   // 使用useMemo缓存计算结果
   const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
   
   // 使用useCallback保持函数引用一致
   const memoizedCallback = useCallback(() => { doSomething(a, b); }, [a, b]);
   ```

3. **使用内联样式替代样式库**
   
   减少样式库依赖，改用内联样式或静态CSS，减小打包体积。

### 构建优化

1. **webpack优化配置**
   
   ```js
   // webpack.config.js
   module.exports = {
     // ...其他配置
     optimization: {
       minimizer: [
         new TerserPlugin({
           terserOptions: {
             compress: {
               drop_console: true,
             },
           },
         }),
       ],
       splitChunks: {
         chunks: 'all',
       },
     },
   };
   ```

2. **启用Tree Shaking**
   
   确保package.json中设置了"sideEffects": false，以便webpack可以安全地移除未使用的代码。

3. **启用代码分割**
   
   使用React的lazy()和Suspense组件实现代码分割，仅加载需要的代码。

   ```tsx
   const ProfilePage = React.lazy(() => import('./ProfilePage'));
   
   function App() {
     return (
       <Suspense fallback={<Loading />}>
         <ProfilePage />
       </Suspense>
     );
   }
   ```

### 静态资源优化

1. **图片压缩与WebP格式**
   
   使用WebP格式并设置合适的尺寸，减少图片大小。

2. **资源CDN加载**
   
   考虑将常用库(如React、lodash等)通过CDN加载，减少打包体积。

## 后端优化详解

### 内存使用限制

1. **Node.js内存限制**
   
   ```sh
   NODE_OPTIONS="--max-old-space-size=512 --optimize-for-size"
   ```

2. **批量数据处理**
   
   对大数据集使用分页和流处理，避免一次性加载过多数据到内存。

### 数据库查询优化

1. **索引优化**
   
   为常用查询添加适当的索引：
   
   ```js
   db.users.createIndex({ email: 1 });
   db.sessions.createIndex({ userId: 1, createdAt: 1 });
   ```

2. **投影查询**
   
   只查询需要的字段，减少数据传输：
   
   ```js
   db.users.find({}, { name: 1, email: 1 });
   ```

3. **使用aggregate而非多次查询**
   
   合并多次查询为一次聚合查询。

### 缓存策略

1. **内存缓存**
   
   使用node-cache或Redis缓存频繁查询的数据。

2. **HTTP缓存**
   
   为静态资源和API响应设置合适的缓存头。
   
   ```js
   res.setHeader('Cache-Control', 'public, max-age=86400');
   ```

## 部署优化详解

### Docker多阶段构建

使用多阶段构建创建更小的镜像：

```dockerfile
# 第一阶段: 构建
FROM node:18-alpine AS builder
# ...构建代码...

# 第二阶段: 运行
FROM node:18-alpine
# 仅复制需要的文件
COPY --from=builder /app/dist /app
# ...
```

### Nginx配置优化

1. **启用Gzip压缩**
2. **配置缓存控制**
3. **限制worker进程**
4. **启用HTTP/2**

### MongoDB配置优化

1. **限制WiredTiger缓存大小**
   
   ```sh
   mongod --wiredTigerCacheSizeGB 0.25
   ```

2. **定期执行清理操作**
   
   定期运行`mongod --repair`或设置TTL索引自动清理过期数据。

## 监控与性能分析

### 性能监控工具

1. **使用PM2监控Node.js进程**
   
   ```sh
   pm2 start app.js --name "api" --max-memory-restart 512M
   ```

2. **服务器资源监控**
   
   使用基础的监控如htop、netdata或轻量级的Prometheus+Grafana。

### 性能测试

使用Artillery或Apache Bench进行简单的性能测试：

```sh
artillery quick --count 20 -n 100 http://localhost:3001/api/products
```

## 部署指南

1. 构建优化的Docker镜像：
   ```sh
   docker-compose -f docker-compose.prod.yml build
   ```

2. 启动服务：
   ```sh
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. 监控日志：
   ```sh
   docker-compose -f docker-compose.prod.yml logs -f
   ```

## 故障排除

1. **内存问题**
   - 检查是否存在内存泄漏
   - 查看PM2内存监控报告
   - 减少并发连接数

2. **CPU过载**
   - 分析请求处理时间，找出耗时操作
   - 考虑缓存高CPU消耗的操作结果
   - 限制高消耗请求的并发数

## 结论

通过实施上述优化措施，应用程序可以在2核2G的资源限制下高效运行。始终记住定期监控性能指标并根据实际使用情况进一步优化。 