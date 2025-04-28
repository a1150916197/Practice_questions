import express from 'express';
import * as questionController from '../controllers/questionController';

const router = express.Router();

// 创建题目
router.post('/', questionController.createQuestion);

// 批量导入题目
router.post('/import', questionController.importQuestions);

// 获取题库中的所有题目
router.get('/bank/:bankId', questionController.getQuestionsByBankId);

// 获取题目详情
router.get('/:id', questionController.getQuestionById);

// 更新题目
router.put('/:id', questionController.updateQuestion);

// 删除题目
router.delete('/:id', questionController.deleteQuestion);

export default router; 