import axios from 'axios';
// 移除未使用的导入，直接使用环境变量
// import { API_URL } from '../config';

// 默认请求配置
const defaultConfig = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001', // 使用环境变量
  timeout: 15000, // 15秒超时
  headers: {
    'Content-Type': 'application/json',
  },
};

// 创建一个独立的axios实例
const instance = axios.create(defaultConfig);

// 添加请求重试功能
axios.defaults.headers.common['user-id'] = localStorage.getItem('userId') || '';

// 请求拦截器
instance.interceptors.request.use(
  (config: any) => {
    // 添加用户身份标识
    const userId = localStorage.getItem('userId');
    if (userId && config.headers) {
      config.headers['user-id'] = userId;
    }

    // 添加重试配置
    config.retry = config.retry || 3; // 默认重试3次
    config.retryDelay = config.retryDelay || 1000; // 重试间隔1秒

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response: any) => {
    // 成功响应，直接返回数据
    return response.data;
  },
  async (error) => {
    // 处理网络错误和超时
    if (!error.response) {
      console.error('网络错误或服务器未响应');
      // 显示友好的错误消息
      return Promise.reject({
        message: '网络连接不稳定，请检查您的网络连接',
      });
    }

    const { config, response } = error;
    const status = response?.status;

    // 处理重试逻辑 - 只对GET请求和特定错误进行重试
    if (
      config.method === 'get' &&
      config.retry && config.retry > 0 &&
      (status === 408 || status === 500 || status === 502 || status === 503 || status === 504 || !response)
    ) {
      config.retry -= 1;
      
      // 延迟重试
      const delay = new Promise((resolve) => {
        setTimeout(resolve, config.retryDelay || 1000);
      });
      
      await delay;
      console.log(`重试请求: ${config.url}, 剩余重试次数: ${config.retry}`);
      return instance(config);
    }

    // 处理授权错误
    if (status === 401) {
      // 清除用户登录状态
      localStorage.removeItem('userId');
      // 可以在这里实现重定向到登录页
      window.location.href = '/';
      return Promise.reject({
        message: '登录已过期，请重新登录',
      });
    }

    // 处理常见错误
    let errorMessage = '发生了未知错误';
    
    if (response) {
      if (response.data && response.data.message) {
        errorMessage = response.data.message;
      } else {
        switch (status) {
          case 400:
            errorMessage = '请求参数有误';
            break;
          case 403:
            errorMessage = '无权访问该资源';
            break;
          case 404:
            errorMessage = '请求的资源不存在';
            break;
          case 429:
            errorMessage = '请求次数过多，请稍后再试';
            break;
          case 500:
            errorMessage = '服务器内部错误';
            break;
          default:
            errorMessage = `请求出错 (${status})`;
        }
      }
    }

    return Promise.reject({
      status,
      message: errorMessage,
      data: response?.data,
    });
  }
);

// 导出优化的API服务
const apiService = {
  // 获取题库列表
  getQuestionBanks: async () => {
    return instance.get('/question-banks');
  },

  // 获取题库详情
  getQuestionBank: async (id: string) => {
    return instance.get(`/question-banks/${id}`);
  },

  // 获取题目列表
  getQuestions: async (bankId: string) => {
    return instance.get(`/questions/bank/${bankId}`);
  },

  // 获取题目详情
  getQuestion: async (id: string) => {
    return instance.get(`/questions/${id}`);
  },

  // 获取错题列表
  getWrongQuestions: async () => {
    return instance.get('/wrong-questions');
  },

  // 提交答题结果
  submitExamResults: async (bankId: string, answers: any[]) => {
    return instance.post(`/wrong-questions/${bankId}`, { answers });
  },

  // 注册/登录用户
  loginUser: async (name: string) => {
    return instance.post('/users/login', { name });
  },

  // 创建题库
  createQuestionBank: async (data: any) => {
    return instance.post('/question-banks', data);
  },

  // 创建题目
  createQuestion: async (data: any) => {
    return instance.post('/questions', data);
  },

  // 导入题目
  importQuestions: async (bankId: string, questions: any[]) => {
    return instance.post('/questions/import', { questionBankId: bankId, questions });
  },

  // 删除题目
  deleteQuestion: async (id: string) => {
    return instance.delete(`/questions/${id}`);
  },

  // 更新题目
  updateQuestion: async (id: string, data: any) => {
    return instance.put(`/questions/${id}`, data);
  },
};

export default apiService;