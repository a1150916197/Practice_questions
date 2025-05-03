"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupPerformanceMiddlewares = void 0;
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/**
 * 配置性能优化中间件
 * 包括压缩、速率限制和安全头
 */
const setupPerformanceMiddlewares = (app) => {
    // 启用GZIP压缩
    app.use((0, compression_1.default)({
        // 只压缩超过1kb的响应
        threshold: 1024,
        // 启用过滤
        filter: (req, res) => {
            if (req.headers['x-no-compression']) {
                return false;
            }
            // 默认的过滤器
            return compression_1.default.filter(req, res);
        }
    }));
    // 添加安全头部
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                imgSrc: ["'self'", 'data:', 'blob:'],
                connectSrc: ["'self'", process.env.API_URL || 'http://localhost:5000']
            },
        },
        crossOriginEmbedderPolicy: false,
    }));
    // 配置API速率限制
    const apiLimiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000, // 15分钟
        max: 100, // 每个IP每15分钟最多100个请求
        standardHeaders: true,
        legacyHeaders: false,
        message: { message: '请求过于频繁，请稍后再试' }
    });
    // 添加健康检查端点
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok', timestamp: Date.now() });
    });
    // 应用API速率限制到所有API路由
    app.use('/api', apiLimiter);
};
exports.setupPerformanceMiddlewares = setupPerformanceMiddlewares;
