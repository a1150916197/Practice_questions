import { Request, Response, NextFunction } from 'express';
import User, { UserRole } from '../models/User';

// 扩展Request接口添加userId属性
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// 用户验证中间件
export const validateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ message: '用户未授权' });
    }
    
    // 简单验证用户存在
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }
    
    // 将用户ID添加到请求对象，方便后续处理
    req.userId = userId;
    
    next();
  } catch (error) {
    console.error('验证用户错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 管理员验证中间件
export const validateAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ message: '用户未授权' });
    }
    
    // 验证用户是否为管理员
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }
    
    if (user.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: '无权操作，仅管理员可执行此操作' });
    }
    
    // 将用户ID添加到请求对象，方便后续处理
    req.userId = userId;
    
    next();
  } catch (error) {
    console.error('验证管理员错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
}; 