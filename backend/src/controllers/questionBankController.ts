import { Request, Response } from 'express';
import QuestionBank from '../models/QuestionBank';
import Question from '../models/Question';

// 创建题库
export const createQuestionBank = async (req: Request, res: Response) => {
  try {
    const { name, description, isPublic } = req.body;
    const userId = req.userId; // 从请求中获取用户ID

    const questionBank = new QuestionBank({
      name,
      description,
      isPublic,
      creator: userId
    });

    await questionBank.save();
    return res.status(201).json(questionBank);
  } catch (error) {
    console.error('创建题库错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 获取所有公开题库
export const getPublicQuestionBanks = async (req: Request, res: Response) => {
  try {
    const questionBanks = await QuestionBank.find({ isPublic: true })
      .populate('creator', 'name')
      .select('-__v');
    
    return res.status(200).json(questionBanks);
  } catch (error) {
    console.error('获取公开题库错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 获取用户创建的题库
export const getUserQuestionBanks = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    
    const questionBanks = await QuestionBank.find({ creator: userId })
      .populate('creator', 'name')
      .select('-__v');
    
    return res.status(200).json(questionBanks);
  } catch (error) {
    console.error('获取用户题库错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 获取题库详情
export const getQuestionBankById = async (req: Request, res: Response) => {
  try {
    const questionBankId = req.params.id;
    
    const questionBank = await QuestionBank.findById(questionBankId)
      .populate('creator', 'name')
      .select('-__v');
    
    if (!questionBank) {
      return res.status(404).json({ message: '题库不存在' });
    }
    
    return res.status(200).json(questionBank);
  } catch (error) {
    console.error('获取题库详情错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 更新题库
export const updateQuestionBank = async (req: Request, res: Response) => {
  try {
    const questionBankId = req.params.id;
    const { name, description, isPublic } = req.body;
    const userId = req.userId; // 用于验证权限
    
    // 查找题库
    const questionBank = await QuestionBank.findById(questionBankId);
    
    if (!questionBank) {
      return res.status(404).json({ message: '题库不存在' });
    }
    
    // 验证用户是否为题库创建者
    if (questionBank.creator.toString() !== userId) {
      return res.status(403).json({ message: '无权修改此题库' });
    }
    
    // 更新题库信息
    questionBank.name = name || questionBank.name;
    questionBank.description = description !== undefined ? description : questionBank.description;
    questionBank.isPublic = isPublic !== undefined ? isPublic : questionBank.isPublic;
    
    await questionBank.save();
    
    return res.status(200).json(questionBank);
  } catch (error) {
    console.error('更新题库错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 删除题库
export const deleteQuestionBank = async (req: Request, res: Response) => {
  try {
    const questionBankId = req.params.id;
    const userId = req.userId; // 用于验证权限
    
    // 查找题库
    const questionBank = await QuestionBank.findById(questionBankId);
    
    if (!questionBank) {
      return res.status(404).json({ message: '题库不存在' });
    }
    
    // 验证用户是否为题库创建者
    if (questionBank.creator.toString() !== userId) {
      return res.status(403).json({ message: '无权删除此题库' });
    }
    
    // 先删除题库中的所有题目
    await Question.deleteMany({ questionBank: questionBankId });
    
    // 然后删除题库
    await QuestionBank.findByIdAndDelete(questionBankId);
    
    return res.status(200).json({ message: '题库删除成功' });
  } catch (error) {
    console.error('删除题库错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 批量导入题目到题库
export const batchImportQuestions = async (req: Request, res: Response) => {
  try {
    const bankId = req.params.id;
    const { questions } = req.body;
    const userId = req.userId; // 用于验证权限
    
    // 检查题库是否存在
    const questionBank = await QuestionBank.findById(bankId);
    
    if (!questionBank) {
      return res.status(404).json({ message: '题库不存在' });
    }
    
    // 验证用户是否为题库创建者
    if (questionBank.creator.toString() !== userId) {
      return res.status(403).json({ message: '无权在此题库中添加题目' });
    }
    
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: '请提供有效的题目数据' });
    }
    
    // 准备批量导入的题目
    const questionsToInsert = questions.map(question => ({
      ...question,
      questionBank: bankId
    }));
    
    // 批量插入题目
    const insertedQuestions = await Question.insertMany(questionsToInsert);
    
    // 更新题库的题目数量
    questionBank.questionCount = (questionBank.questionCount || 0) + insertedQuestions.length;
    await questionBank.save();
    
    return res.status(201).json({
      message: `成功导入 ${insertedQuestions.length} 道题目`,
      importedCount: insertedQuestions.length,
      questions: insertedQuestions
    });
  } catch (error: any) {
    console.error('批量导入题目错误:', error);
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
}; 