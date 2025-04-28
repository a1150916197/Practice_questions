import { Request, Response } from 'express';
import Question, { QuestionType, IQuestion } from '../models/Question';
import QuestionBank from '../models/QuestionBank';
import WrongQuestion from '../models/WrongQuestion';

// 创建题目
export const createQuestion = async (req: Request, res: Response) => {
  try {
    const { type, content, options, answer, explanation, questionBankId } = req.body;
    const userId = req.userId; // 用于验证权限
    
    // 检查题库是否存在
    const questionBank = await QuestionBank.findById(questionBankId);
    
    if (!questionBank) {
      return res.status(404).json({ message: '题库不存在' });
    }
    
    // 验证用户是否为题库创建者
    if (questionBank.creator.toString() !== userId) {
      return res.status(403).json({ message: '无权在此题库中添加题目' });
    }
    
    // 创建新题目
    const question = new Question({
      type,
      content,
      options,
      answer,
      explanation,
      questionBank: questionBankId
    });
    
    await question.save();
    
    return res.status(201).json(question);
  } catch (error) {
    console.error('创建题目错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 批量导入题目
export const importQuestions = async (req: Request, res: Response) => {
  try {
    const { questions, questionBankId } = req.body;
    const userId = req.userId; // 用于验证权限
    
    // 检查题库是否存在
    const questionBank = await QuestionBank.findById(questionBankId);
    
    if (!questionBank) {
      return res.status(404).json({ message: '题库不存在' });
    }
    
    // 验证用户是否为题库创建者
    if (questionBank.creator.toString() !== userId) {
      return res.status(403).json({ message: '无权在此题库中添加题目' });
    }
    
    // 准备批量导入的题目
    const questionsToInsert = questions.map((question: any) => ({
      ...question,
      questionBank: questionBankId
    }));
    
    // 批量插入题目
    const insertedQuestions = await Question.insertMany(questionsToInsert);
    
    return res.status(201).json({
      message: `成功导入 ${insertedQuestions.length} 道题目`,
      questions: insertedQuestions
    });
  } catch (error) {
    console.error('批量导入题目错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 获取题库中的所有题目
export const getQuestionsByBankId = async (req: Request, res: Response) => {
  try {
    const questionBankId = req.params.bankId;
    
    // 检查题库是否存在
    const questionBank = await QuestionBank.findById(questionBankId);
    
    if (!questionBank) {
      return res.status(404).json({ message: '题库不存在' });
    }
    
    // 获取题库中的所有题目
    const questions = await Question.find({ questionBank: questionBankId })
      .select('-__v');
    
    return res.status(200).json(questions);
  } catch (error) {
    console.error('获取题目错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 获取题目详情
export const getQuestionById = async (req: Request, res: Response) => {
  try {
    const questionId = req.params.id;
    
    const question = await Question.findById(questionId)
      .select('-__v');
    
    if (!question) {
      return res.status(404).json({ message: '题目不存在' });
    }
    
    return res.status(200).json(question);
  } catch (error) {
    console.error('获取题目详情错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 更新题目
export const updateQuestion = async (req: Request, res: Response) => {
  try {
    const questionId = req.params.id;
    const { type, content, options, answer, explanation } = req.body;
    const userId = req.userId; // 用于验证权限
    
    // 查找题目及其所属题库
    const question = await Question.findById(questionId);
    
    if (!question) {
      return res.status(404).json({ message: '题目不存在' });
    }
    
    // 查找题库以验证权限
    const questionBank = await QuestionBank.findById(question.questionBank);
    
    if (!questionBank) {
      return res.status(404).json({ message: '题库不存在' });
    }
    
    // 验证用户是否为题库创建者
    if (questionBank.creator.toString() !== userId) {
      return res.status(403).json({ message: '无权修改此题目' });
    }
    
    // 更新题目信息
    question.type = type || question.type;
    question.content = content || question.content;
    question.options = options || question.options;
    question.answer = answer !== undefined ? answer : question.answer;
    question.explanation = explanation !== undefined ? explanation : question.explanation;
    
    await question.save();
    
    return res.status(200).json(question);
  } catch (error) {
    console.error('更新题目错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 删除题目
export const deleteQuestion = async (req: Request, res: Response) => {
  try {
    const questionId = req.params.id;
    const userId = req.userId; // 用于验证权限
    
    // 查找题目及其所属题库
    const question = await Question.findById(questionId);
    
    if (!question) {
      return res.status(404).json({ message: '题目不存在' });
    }
    
    // 查找题库以验证权限
    const questionBank = await QuestionBank.findById(question.questionBank);
    
    if (!questionBank) {
      return res.status(404).json({ message: '题库不存在' });
    }
    
    // 验证用户是否为题库创建者
    if (questionBank.creator.toString() !== userId) {
      return res.status(403).json({ message: '无权删除此题目' });
    }
    
    // 删除题目
    await Question.findByIdAndDelete(questionId);
    
    // 同时删除相关的错题记录
    await WrongQuestion.deleteMany({ question: questionId });
    
    return res.status(200).json({ message: '题目删除成功' });
  } catch (error) {
    console.error('删除题目错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
}; 