import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import userRoutes from './routes/userRoutes';
import questionBankRoutes from './routes/questionBankRoutes';
import questionRoutes from './routes/questionRoutes';
import wrongQuestionRoutes from './routes/wrongQuestionRoutes';
import { validateUser, validateAdmin } from './middleware/auth';

// 配置环境变量
dotenv.config();

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors({
  origin: '*', // 允许所有来源的请求
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 明确允许DELETE请求
  allowedHeaders: ['Content-Type', 'Authorization', 'user-id'], // 允许自定义的user-id头
  credentials: true, // 允许携带凭证
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 路由
app.use('/api/users', userRoutes);
app.use('/api/question-banks', validateUser, questionBankRoutes);
app.use('/api/questions', validateUser, questionRoutes);
app.use('/api/wrong-questions', validateUser, wrongQuestionRoutes);

// 处理未匹配路由
app.use((req, res) => {
  res.status(404).json({ message: '路径不存在' });
});

// 连接MongoDB数据库
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/teacher-exam';

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log('成功连接到MongoDB数据库');
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('连接MongoDB数据库失败:', error);
    console.log('请确保MongoDB服务已启动，或检查环境变量MONGO_URI配置是否正确');
  });

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('未处理的Promise拒绝:', error);
}); 