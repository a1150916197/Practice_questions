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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const questionBankRoutes_1 = __importDefault(require("./routes/questionBankRoutes"));
const questionRoutes_1 = __importDefault(require("./routes/questionRoutes"));
const wrongQuestionRoutes_1 = __importDefault(require("./routes/wrongQuestionRoutes"));
const auth_1 = require("./middleware/auth");
const dbConfig_1 = require("./utils/dbConfig");
const performance_1 = require("./middlewares/performance");
// 配置环境变量
dotenv_1.default.config();
// 创建Express应用
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// 应用性能优化中间件
(0, performance_1.setupPerformanceMiddlewares)(app);
// CORS设置
app.use((0, cors_1.default)({
    origin: '*', // 允许所有来源的请求
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 明确允许DELETE请求
    allowedHeaders: ['Content-Type', 'Authorization', 'user-id'], // 允许自定义的user-id头
    credentials: true, // 允许携带凭证
    preflightContinue: false,
    optionsSuccessStatus: 204
}));
// 请求体解析中间件 - 添加大小限制
app.use(body_parser_1.default.json({ limit: '1mb' }));
app.use(body_parser_1.default.urlencoded({ extended: true, limit: '1mb' }));
// 健康检查路由 - 不需要验证
app.get('/health-check', (req, res) => {
    res.status(200).json({ status: 'ok', message: '服务正常运行' });
});
// API路由
app.use('/api/users', userRoutes_1.default);
app.use('/api/question-banks', auth_1.validateUser, questionBankRoutes_1.default);
app.use('/api/questions', auth_1.validateUser, questionRoutes_1.default);
app.use('/api/wrong-questions', auth_1.validateUser, wrongQuestionRoutes_1.default);
// 处理未匹配路由
app.use((req, res) => {
    res.status(404).json({ message: '路径不存在' });
});
// 连接MongoDB数据库并启动服务器
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 无论数据库是否连接成功，都启动服务器
        yield (0, dbConfig_1.connectDB)();
        // 启动服务器
        app.listen(PORT, () => {
            console.log(`服务器运行在 http://localhost:${PORT}`);
            console.log(`健康检查: http://localhost:${PORT}/health-check`);
        });
    }
    catch (error) {
        console.error('启动服务器时发生错误:', error);
        process.exit(1);
    }
}))();
// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
});
process.on('unhandledRejection', (error) => {
    console.error('未处理的Promise拒绝:', error);
});
// 优雅关闭
process.on('SIGINT', () => {
    console.log('接收到SIGINT信号，正在关闭服务器...');
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.log('接收到SIGTERM信号，正在关闭服务器...');
    process.exit(0);
});
