"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAdmin = exports.validateUser = void 0;
const User_1 = __importStar(require("../models/User"));
// 用户验证中间件
const validateUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.headers['user-id'];
        if (!userId) {
            return res.status(401).json({ message: '用户未授权' });
        }
        // 简单验证用户存在
        const user = yield User_1.default.findById(userId);
        if (!user) {
            return res.status(401).json({ message: '用户不存在' });
        }
        // 将用户ID添加到请求对象，方便后续处理
        req.userId = userId;
        next();
    }
    catch (error) {
        console.error('验证用户错误:', error);
        return res.status(500).json({ message: '服务器错误' });
    }
});
exports.validateUser = validateUser;
// 管理员验证中间件
const validateAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.headers['user-id'];
        if (!userId) {
            return res.status(401).json({ message: '用户未授权' });
        }
        // 验证用户是否为管理员
        const user = yield User_1.default.findById(userId);
        if (!user) {
            return res.status(401).json({ message: '用户不存在' });
        }
        if (user.role !== User_1.UserRole.ADMIN) {
            return res.status(403).json({ message: '无权操作，仅管理员可执行此操作' });
        }
        // 将用户ID添加到请求对象，方便后续处理
        req.userId = userId;
        next();
    }
    catch (error) {
        console.error('验证管理员错误:', error);
        return res.status(500).json({ message: '服务器错误' });
    }
});
exports.validateAdmin = validateAdmin;
