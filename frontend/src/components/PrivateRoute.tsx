import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, adminOnly = false }) => {
  // 从localStorage中获取用户信息
  const userString = localStorage.getItem('user');
  
  // 如果用户未登录，重定向到登录页
  if (!userString) {
    return <Navigate to="/" replace />;
  }
  
  try {
    const user = JSON.parse(userString);
    
    // 如果是管理员专属路由，但用户不是管理员，则重定向到仪表盘
    if (adminOnly && user.role !== 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
    
    // 用户已登录且权限满足，渲染子组件
    return <>{children}</>;
  } catch (error) {
    // 解析用户信息失败，重定向到登录页
    localStorage.removeItem('user');
    return <Navigate to="/" replace />;
  }
};

export default PrivateRoute; 