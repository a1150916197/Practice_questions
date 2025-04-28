import { Request, Response } from 'express';
import WrongQuestion from '../models/WrongQuestion';
import Question from '../models/Question';
import QuestionBank from '../models/QuestionBank';

// 添加错题
export const addWrongQuestion = async (req: Request, res: Response) => {
  try {
    const { questionId, wrongAnswer } = req.body;
    const userId = req.userId;
    
    // 检查题目是否存在
    const question = await Question.findById(questionId);
    
    if (!question) {
      return res.status(404).json({ message: '题目不存在' });
    }
    
    // 查找是否已存在该用户的该错题记录
    let wrongQuestion = await WrongQuestion.findOne({ 
      user: userId,
      question: questionId
    });
    
    if (wrongQuestion) {
      // 如果已存在，更新错误答案和时间戳
      wrongQuestion.wrongAnswer = wrongAnswer;
      wrongQuestion.timestamp = new Date();
      await wrongQuestion.save();
    } else {
      // 如果不存在，创建新记录
      wrongQuestion = new WrongQuestion({
        user: userId,
        question: questionId,
        wrongAnswer
      });
      await wrongQuestion.save();
    }
    
    return res.status(201).json(wrongQuestion);
  } catch (error) {
    console.error('添加错题错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 获取用户的错题列表
export const getUserWrongQuestions = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    
    // 查找用户的所有错题记录
    const wrongQuestions = await WrongQuestion.find({ user: userId })
      .populate({
        path: 'question',
        select: '-__v'
      })
      .select('-__v')
      .sort({ timestamp: -1 }); // 按时间倒序排列
    
    return res.status(200).json(wrongQuestions);
  } catch (error) {
    console.error('获取错题列表错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 移除错题
export const removeWrongQuestion = async (req: Request, res: Response) => {
  try {
    const wrongQuestionId = req.params.id;
    const userId = req.userId;
    
    // 查找错题记录
    const wrongQuestion = await WrongQuestion.findById(wrongQuestionId);
    
    if (!wrongQuestion) {
      return res.status(404).json({ message: '错题记录不存在' });
    }
    
    // 验证用户权限
    if (wrongQuestion.user.toString() !== userId) {
      return res.status(403).json({ message: '无权删除此错题记录' });
    }
    
    // 删除错题记录
    await WrongQuestion.findByIdAndDelete(wrongQuestionId);
    
    return res.status(200).json({ message: '错题记录已删除' });
  } catch (error) {
    console.error('删除错题记录错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 获取用户错题统计
export const getWrongQuestionStats = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    
    // 获取用户的所有错题记录
    const wrongQuestions = await WrongQuestion.find({ user: userId })
      .populate({
        path: 'question',
        select: 'type questionBank'
      });
    
    // 按题目类型分组统计
    const typeStats = {
      single: 0,
      multiple: 0,
      tf: 0
    };
    
    wrongQuestions.forEach(wq => {
      if (wq.question && wq.question.type) {
        typeStats[wq.question.type as keyof typeof typeStats]++;
      }
    });
    
    // 获取用户错题涉及的题库
    const questionBankIds = new Set();
    wrongQuestions.forEach(wq => {
      if (wq.question && wq.question.questionBank) {
        questionBankIds.add(wq.question.questionBank.toString());
      }
    });
    
    // 获取题库信息
    const questionBanks = await QuestionBank.find({
      _id: { $in: Array.from(questionBankIds) }
    }).select('name');
    
    return res.status(200).json({
      totalWrongQuestions: wrongQuestions.length,
      typeStats,
      questionBanks
    });
  } catch (error) {
    console.error('获取错题统计错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
}; 