# 教师编制备考答题系统优化指南

本文档提供在2核2G Linux服务器上优化该系统的完整方案，确保系统流畅稳定运行。

## 1. 系统架构优化

### 1.1 使用PM2进程管理

已经创建了`ecosystem.config.js`配置文件，用PM2管理应用：

```bash
# 安装PM2
npm install -g pm2

# 安装日志轮转插件
pm2 install pm2-logrotate

# 启动应用
pm2 start ecosystem.config.js

# 设置开机自启
pm2 startup
pm2 save
```

### 1.2 使用Nginx作为反向代理和静态资源服务器

```bash
# 安装Nginx
apt-get update
apt-get install nginx -y

# 创建Nginx配置
nano /etc/nginx/sites-available/teacher-exam
```

配置内容：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为您的域名

    # 日志配置
    access_log /var/log/nginx/teacher-exam-access.log;
    error_log /var/log/nginx/teacher-exam-error.log;

    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        root /path/to/frontend/build;  # 替换为实际路径
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
        access_log off;
    }

    # 前端应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }

    # API请求
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        
        # 限制请求大小
        client_max_body_size 2M;
    }
}
```

启用配置：

```bash
ln -s /etc/nginx/sites-available/teacher-exam /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## 2. 系统级优化

### 2.1 增加Swap空间

对于内存只有2G的服务器，增加swap空间很有必要：

```bash
# 已经提供了脚本 frontend/create_swap.sh
chmod +x frontend/create_swap.sh
sudo ./frontend/create_swap.sh
```

### 2.2 设置系统参数

```bash
# 文件描述符限制
echo "* soft nofile 65535" >> /etc/security/limits.conf
echo "* hard nofile 65535" >> /etc/security/limits.conf

# 内核参数调整
cat > /etc/sysctl.d/99-sysctl.conf << EOF
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_max_tw_buckets = 5000
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_slow_start_after_idle = 0
net.core.somaxconn = 65535
vm.swappiness = 10
vm.dirty_ratio = 60
vm.dirty_background_ratio = 2
EOF

# 应用配置
sysctl -p /etc/sysctl.d/99-sysctl.conf
```

## 3. 前端性能优化

### 3.1 构建优化

已优化了craco.config.js，使用以下命令构建：

```bash
cd frontend
npm install --save-dev webpack-bundle-analyzer terser-webpack-plugin
npm run build
```

### 3.2 部署优化

```bash
# 安装serve工具
npm install -g serve

# 使用serve提供前端静态文件(PM2已配置)
serve -s build -l 3000
```

### 3.3 缓存策略调整

在前端代码中使用localStorage缓存常用数据，减少API请求：

```javascript
// 添加到 frontend/src/services/cacheService.ts
export const CACHE_TTL = 3600000; // 1小时

export const setCache = (key: string, data: any) => {
  localStorage.setItem(
    key,
    JSON.stringify({
      data,
      timestamp: Date.now()
    })
  );
};

export const getCache = (key: string) => {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > CACHE_TTL) {
    localStorage.removeItem(key);
    return null;
  }
  
  return data;
};
```

## 4. 后端性能优化

### 4.1 数据库优化

已优化MongoDB连接配置，新增了以下功能：
- 连接池管理
- 超时设置优化
- 错误处理增强

其他MongoDB优化建议：
```bash
# 为常用查询字段创建索引
mongo teacher-exam --eval '
db.questions.createIndex({ "questionBank": 1 });
db.wrongquestions.createIndex({ "user": 1 });
db.wrongquestions.createIndex({ "question": 1 });
'
```

### 4.2 API优化

已优化后端API：
- 添加了请求限流
- 提高了错误处理能力
- 限制了请求大小

## 5. 监控与维护

### 5.1 使用PM2监控

```bash
# 监控应用状态
pm2 monit

# 查看日志
pm2 logs

# 检查性能状态
pm2 status
```

### 5.2 系统监控

```bash
# 安装监控工具
apt-get install htop iotop -y

# 监控系统资源
htop

# 监控磁盘I/O
iotop
```

### 5.3 定时任务

```bash
# 清理旧日志
crontab -e
# 添加以下行
0 1 * * * find /path/to/logs -type f -name "*.log.*" -mtime +7 -delete
```

## 6. 安全优化

### 6.1 防火墙设置

```bash
# 配置防火墙
apt-get install ufw -y
ufw allow ssh
ufw allow http
ufw allow https
ufw enable
```

### 6.2 HTTPS配置

```bash
# 安装certbot
apt-get install certbot python3-certbot-nginx -y

# 获取SSL证书
certbot --nginx -d your-domain.com
```

## 7. 性能测试工具

可以使用以下工具测试系统性能：

```bash
# 安装压测工具
npm install -g autocannon

# 测试API性能
autocannon -c 100 -d 30 http://localhost:5000/api/questions/bank/:bankId
```

---

按照以上优化指南进行配置后，系统应该能够在2核2G的Linux服务器上流畅稳定运行。如遇性能问题，可以通过监控工具找出瓶颈，并有针对性地进行优化。 