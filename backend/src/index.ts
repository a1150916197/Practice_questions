import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import userRoutes from './routes/userRoutes';
import questionBankRoutes from './routes/questionBankRoutes';
import questionRoutes from './routes/questionRoutes';
import wrongQuestionRoutes from './routes/wrongQuestionRoutes';
import { validateUser, validateAdmin } from './middleware/auth';
import { connectDB } from './utils/dbConfig';
import { setupPerformanceMiddlewares } from './middlewares/performance';

// 配置环境变量
dotenv.config();

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 5000;

// 应用性能优化中间件
setupPerformanceMiddlewares(app);

// CORS设置
app.use(cors({
  origin: function(origin, callback) { callback(null, true); }, // 允许所有来源访问允许所有来源的请求
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 明确允许DELETE请求
  allowedHeaders: ['Content-Type', 'Authorization', 'user-id'], // 允许自定义的user-id头
  credentials: true, // 允许携带凭证
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// 请求体解析中间件 - 添加大小限制
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

// 路由
app.use('/api/users', userRoutes);
app.use('/api/question-banks', validateUser, questionBankRoutes);
app.use('/api/questions', validateUser, questionRoutes);
app.use('/api/wrong-questions', validateUser, wrongQuestionRoutes);

// 处理未匹配路由
app.use((req, res) => {
  res.status(404).json({ message: '路径不存在' });
});

// 连接MongoDB数据库并启动服务器
(async () => {
  const connected = await connectDB();
  
  if (connected) {
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
    });
  }
})();

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('未处理的Promise拒绝:', error);
}); 


