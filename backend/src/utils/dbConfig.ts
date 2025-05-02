import mongoose from 'mongoose';

// MongoDB连接优化配置
export const connectDB = async () => {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/teacher-exam';
  
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // 连接池优化
      maxPoolSize: 10, // 限制最大连接数
      minPoolSize: 2, // 保持最小连接数
      // 性能优化
      connectTimeoutMS: 30000,
      // mongoose 6+ 不再支持 keepAlive 选项
      heartbeatFrequencyMS: 30000, // 心跳检测频率
      autoIndex: false, // 生产环境禁用自动索引创建
    });
    
    console.log('成功连接到MongoDB数据库');
    
    // 添加MongoDB服务端监控
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB连接错误:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB连接断开，尝试重新连接...');
    });
    
    return true;
  } catch (error) {
    console.error('连接MongoDB数据库失败:', error);
    console.log('请确保MongoDB服务已启动，或检查环境变量MONGO_URI配置是否正确');
    return false;
  }
};

// 关闭数据库连接
export const closeDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB连接已关闭');
  } catch (error) {
    console.error('关闭MongoDB连接出错:', error);
  }
}; 