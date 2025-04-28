import axios from 'axios';
import { API_BASE_URL, API_URL } from '../config';

// 创建Axios实例
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000, // 增加超时时间
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器：添加用户ID到请求头，并添加调试日志
api.interceptors.request.use((config) => {
  console.log('准备发送请求:', config.url);
  
  const userString = localStorage.getItem('user');
  if (userString) {
    try {
      const user = JSON.parse(userString);
      if (user && user.id) {
        if (config.headers) {
          config.headers['user-id'] = user.id;
        }
        console.log('已添加用户ID到请求头:', user.id);
      }
    } catch (error) {
      console.error('解析localStorage中的user失败:', error);
    }
  } else {
    console.log('localStorage中没有找到user');
  }
  return config;
}, (error) => {
  console.error('请求拦截器错误:', error);
  return Promise.reject(error);
});

// 响应拦截器：处理常见错误，并添加调试日志
api.interceptors.response.use((response) => {
  console.log('收到响应:', response.config.url, response.status);
  return response;
}, (error) => {
  console.error('API请求失败:', error);
  
  if (error.response) {
    // 服务器返回错误
    const { status } = error.response;
    console.error('服务器错误状态码:', status);
    
    if (status === 401) {
      // 未授权，清除用户信息并重定向到登录页
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    
    // 返回错误信息
    return Promise.reject(error.response.data);
  }
  
  // 服务器未响应
  return Promise.reject({ message: '服务器无响应，请检查网络连接' });
});

// 用户相关API
export const userAPI = {
  // 登录/注册
  login: (name: string) => {
    return api.post('/users/login', { name });
  },
  
  // 获取所有用户（仅管理员）
  getAllUsers: () => {
    return api.get('/users');
  }
};

// 题库相关API
export const questionBankAPI = {
  // 获取题库列表
  getQuestionBanks: async () => {
    try {
      const response = await api.get('/question-banks');
      return response;
    } catch (error) {
      console.error('获取题库列表失败:', error);
      throw error;
    }
  },

  // 创建题库
  createQuestionBank: async (data: {
    name: string;
    description?: string;
    isPublic: boolean;
  }) => {
    try {
      const response = await api.post('/question-banks', data);
      return response;
    } catch (error) {
      console.error('创建题库失败:', error);
      throw error;
    }
  },

  // 更新题库
  updateQuestionBank: async (id: string, data: {
    name: string;
    description?: string;
    isPublic: boolean;
  }) => {
    try {
      const response = await api.put(`/question-banks/${id}`, data);
      return response;
    } catch (error) {
      console.error('更新题库失败:', error);
      throw error;
    }
  },

  // 删除题库
  deleteQuestionBank: async (id: string) => {
    try {
      const response = await api.delete(`/question-banks/${id}`);
      return response;
    } catch (error) {
      console.error('删除题库失败:', error);
      throw error;
    }
  },

  // 获取公开题库
  getPublicQuestionBanks: () => {
    return api.get('/question-banks/public');
  },
  
  // 获取用户题库
  getUserQuestionBanks: (userId: string) => {
    return api.get(`/question-banks/user/${userId}`);
  },
  
  // 获取题库详情
  getQuestionBankById: async (id: string) => {
    // 添加调试日志
    console.log(`开始获取题库详情，ID: ${id}`);
    try {
      const response = await api.get(`/question-banks/${id}`);
      console.log('题库详情API响应:', response.data);
      return response;
    } catch (error) {
      console.error('获取题库详情失败:', error);
      throw error;
    }
  },
};

// 题目相关API
export const questionAPI = {
  // 创建题目
  createQuestion: (data: any) => {
    return api.post('/questions', data);
  },
  
  // 批量导入题目
  importQuestions: (data: { questions: any[]; questionBankId: string }) => {
    return api.post('/questions/import', data);
  },
  
  // 获取题库中的所有题目
  getQuestionsByBankId: (bankId: string) => {
    return api.get(`/questions/bank/${bankId}`);
  },
  
  // 获取题目详情
  getQuestionById: (id: string) => {
    return api.get(`/questions/${id}`);
  },
  
  // 更新题目
  updateQuestion: (id: string, data: any) => {
    return api.put(`/questions/${id}`, data);
  },
  
  // 删除题目
  deleteQuestion: (id: string) => {
    return api.delete(`/questions/${id}`);
  }
};

// 错题相关API
export const wrongQuestionAPI = {
  // 添加错题
  addWrongQuestion: (data: { questionId: string; wrongAnswer: any }) => {
    return api.post('/wrong-questions', data);
  },
  
  // 获取用户的错题列表
  getUserWrongQuestions: (userId: string) => {
    return api.get(`/wrong-questions/user/${userId}`);
  },
  
  // 获取用户错题统计
  getWrongQuestionStats: (userId: string) => {
    return api.get(`/wrong-questions/stats/${userId}`);
  },
  
  // 移除错题
  removeWrongQuestion: (id: string) => {
    return api.delete(`/wrong-questions/${id}`);
  }
}; 