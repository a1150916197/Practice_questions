import express from 'express';
import * as wrongQuestionController from '../controllers/wrongQuestionController';

const router = express.Router();

// 添加错题
router.post('/', wrongQuestionController.addWrongQuestion);

// 获取用户的错题列表
router.get('/user/:userId', wrongQuestionController.getUserWrongQuestions);

// 获取用户错题统计
router.get('/stats/:userId', wrongQuestionController.getWrongQuestionStats);

// 移除错题
router.delete('/:id', wrongQuestionController.removeWrongQuestion);

export default router; 