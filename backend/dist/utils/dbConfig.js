"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// MongoDB连接优化配置
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/teacher-exam';
    try {
        // 检查是否需要使用内存模拟模式（不实际连接数据库）
        const useMockDB = process.env.USE_MOCK_DB === 'true';
        if (useMockDB) {
            console.log('启用模拟数据库模式，不实际连接MongoDB');
            return true; // 返回连接成功但实际上是模拟模式
        }
        yield mongoose_1.default.connect(MONGO_URI, {
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
        mongoose_1.default.connection.on('error', (err) => {
            console.error('MongoDB连接错误:', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            console.warn('MongoDB连接断开，尝试重新连接...');
        });
        return true;
    }
    catch (error) {
        console.error('连接MongoDB数据库失败:', error);
        console.log('请确保MongoDB服务已启动，或检查环境变量MONGO_URI配置是否正确');
        console.log('将继续使用模拟模式运行，部分功能可能受限');
        // 连接失败也返回成功，让服务继续启动，后续使用模拟数据
        return true;
    }
});
exports.connectDB = connectDB;
// 关闭数据库连接
const closeDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connection.close();
        console.log('MongoDB连接已关闭');
    }
    catch (error) {
        console.error('关闭MongoDB连接出错:', error);
    }
});
exports.closeDB = closeDB;
