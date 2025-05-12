module.exports = {
  apps: [
    {
      name: 'teacher-exam-backend',
      script: './backend/dist/index.js',
      instances: 1, // 2核服务器使用单实例更合适
      exec_mode: 'fork', // 低内存环境下使用fork模式
      max_memory_restart: '150M', // 内存超过150M时自动重启
      watch: false, // 关闭监视，减少IO操作
      node_args: '--max-old-space-size=256', // 设置较小的内存限制
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        // 数据库配置可通过环境变量设置
        // MONGO_URI: 'mongodb://localhost:27017/teacher-exam'
      },
      // 避免无限重启
      max_restarts: 10,
      min_uptime: '5s', // 至少运行5秒视为成功启动
      restart_delay: 5000, // 重启延迟
      // 日志配置
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true, // 添加时间戳
      merge_logs: true,
      // 日志管理
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      log_type: 'json', // 使JSON格式便于解析
      // 日志轮转 (需要安装 pm2-logrotate)
      max_size: '10M', // 单个日志文件最大10M
      retain: 10, // 保留10个日志文件
    },
    {
      name: 'teacher-exam-frontend',
      script: 'serve',
      args: ['-s', 'frontend/build', '-l', '3000'],
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '100M',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PM2_SERVE_PATH: 'frontend/build',
        PM2_SERVE_PORT: 3000,
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    }
  ]
}; 