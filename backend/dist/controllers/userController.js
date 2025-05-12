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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = exports.loginUser = void 0;
const User_1 = __importStar(require("../models/User"));
const QuestionBank_1 = __importDefault(require("../models/QuestionBank"));
// 用户登录/注册
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: '姓名不能为空' });
        }
        // 检查用户是否已存在
        let user = yield User_1.default.findOne({ name });
        // 如果用户不存在，创建新用户
        if (!user) {
            user = new User_1.default({
                name,
                role: User_1.UserRole.STUDENT
            });
            yield user.save();
            // 为新用户创建个人错题库
            const wrongQuestionBank = new QuestionBank_1.default({
                name: `${name}的错题库`,
                description: `${name}的个人错题收集`,
                isPublic: false,
                creator: user._id
            });
            yield wrongQuestionBank.save();
        }
        return res.status(200).json({
            message: '登录成功',
            user: {
                id: user._id,
                name: user.name,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error('登录错误:', error);
        return res.status(500).json({ message: '服务器错误' });
    }
});
exports.loginUser = loginUser;
// 获取所有用户（仅管理员可用）
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield User_1.default.find().select('-__v');
        return res.status(200).json(users);
    }
    catch (error) {
        console.error('获取用户错误:', error);
        return res.status(500).json({ message: '服务器错误' });
    }
});
exports.getAllUsers = getAllUsers;
