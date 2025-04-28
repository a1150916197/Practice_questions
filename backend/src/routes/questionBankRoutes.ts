import express from 'express';
import * as questionBankController from '../controllers/questionBankController';

const router = express.Router();

// 创建题库
router.post('/', questionBankController.createQuestionBank);

// 批量导入题目到题库
router.post('/:id/questions/batch', questionBankController.batchImportQuestions);

// 获取所有公开题库
router.get('/public', questionBankController.getPublicQuestionBanks);

// 获取用户创建的题库
router.get('/user/:userId', questionBankController.getUserQuestionBanks);

// 获取题库详情
router.get('/:id', questionBankController.getQuestionBankById);

// 更新题库
router.put('/:id', questionBankController.updateQuestionBank);

// 删除题库
router.delete('/:id', questionBankController.deleteQuestionBank);

export default router; 