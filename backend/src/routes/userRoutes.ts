import express from 'express';
import * as userController from '../controllers/userController';

const router = express.Router();

// 用户登录/注册
router.post('/login', userController.loginUser);

// 获取所有用户（仅管理员可用）
router.get('/', userController.getAllUsers);

export default router; 