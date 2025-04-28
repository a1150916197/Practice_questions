import { Request, Response } from 'express';
import User, { UserRole } from '../models/User';
import QuestionBank from '../models/QuestionBank';

// 用户登录/注册
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: '姓名不能为空' });
    }

    // 检查用户是否已存在
    let user = await User.findOne({ name });
    
    // 如果用户不存在，创建新用户
    if (!user) {
      user = new User({
        name,
        role: UserRole.STUDENT
      });
      
      await user.save();

      // 为新用户创建个人错题库
      const wrongQuestionBank = new QuestionBank({
        name: `${name}的错题库`,
        description: `${name}的个人错题收集`,
        isPublic: false,
        creator: user._id
      });
      
      await wrongQuestionBank.save();
    }

    return res.status(200).json({
      message: '登录成功',
      user: {
        id: user._id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 获取所有用户（仅管理员可用）
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-__v');
    return res.status(200).json(users);
  } catch (error) {
    console.error('获取用户错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
}; 