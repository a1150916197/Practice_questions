import axios from 'axios';

// 获取环境变量
const isDevelopment = process.env.NODE_ENV === 'development';
const hostname = window.location.hostname;

// 默认后端API地址
let baseURL = '/api'; // 默认通过代理
const configuredApiUrl = process.env.REACT_APP_API_URL;

// 打印环境信息便于调试
console.log('当前环境:', process.env.NODE_ENV);
console.log('当前主机名:', hostname);
console.log('REACT_APP_API_URL:', configuredApiUrl);

// 设置API基础URL
if (!isDevelopment) {
  // 在生产环境使用相对路径，依赖于代理
  console.log('生产环境API基础URL:', '/api');
} else if (configuredApiUrl) {
  // 在开发环境使用配置的API URL
  baseURL = configuredApiUrl;
  console.log('开发环境API基础URL:', baseURL);
}

console.log('最终API基础URL:', baseURL);

// 创建axios实例
const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 模拟API响应类型定义
interface HealthCheckResponse {
  status: string;
  message: string;
}

interface QuestionBank {
  id: string;
  name: string;
  count: number;
  tags: string[];
}

interface QuestionBanksResponse {
  data: QuestionBank[];
}

// 模拟响应数据映射类型
interface MockResponseMap {
  '/health-check': HealthCheckResponse;
  '/question-banks/public': QuestionBanksResponse;
  [key: string]: any; // 允许其他路径
}

// 模拟API响应，当后端不可用时
const mockResponses: MockResponseMap = {
  '/health-check': { status: 'ok', message: '服务正常运行' },
  '/question-banks/public': {
    data: [
      { id: 'bank1', name: '前端基础题库', count: 100, tags: ['HTML', 'CSS', 'JavaScript'] },
      { id: 'bank2', name: 'React面试题库', count: 50, tags: ['React', 'Redux', 'Hooks'] },
      { id: 'bank3', name: 'Vue开发题库', count: 80, tags: ['Vue', 'Vuex', 'Vue Router'] }
    ]
  }
};

// 提取API路径的函数
const getApiPath = (url: string | undefined): string | null => {
  if (!url) return null;
  
  // 移除baseURL前缀
  let path = url;
  if (path.startsWith(baseURL)) {
    path = path.substr(baseURL.length);
  }
  
  // 确保路径以/开头
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  
  console.log('提取的API路径:', path);
  return path;
};

// 是否使用模拟数据
let useMockData = false;

// 设置是否使用模拟数据
export const setUseMockData = (use: boolean) => {
  useMockData = use;
  console.log('模拟数据模式:', useMockData ? '已启用' : '已禁用');
};

// 检查API是否可用
export const checkApiAvailability = async (): Promise<boolean> => {
  try {
    await axios.get(baseURL + '/health-check', { timeout: 5000 });
    setUseMockData(false);
    return true;
  } catch (error) {
    console.warn('API不可用，启用模拟数据模式');
    setUseMockData(true);
    return false;
  }
};

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log('准备发送请求:', config.url);
    
    try {
      // 获取本地存储的用户ID
      const userId = localStorage.getItem('userId');
      
      // 如果有用户ID，添加到请求头
      if (userId && config.headers) {
        // 安全地设置头部
        config.headers = {
          ...config.headers,
          'X-User-ID': userId
        };
        console.log('已添加用户ID到请求头:', userId);
      }
    } catch (error) {
      console.error('处理请求拦截器时出错:', error);
      // 继续请求，不中断
    }
    
    return config;
  },
  (error) => {
    console.error('请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log('收到响应:', response.config.url, response.status);
    return response;
  },
  (error) => {
    // 检查是否为模拟数据模式
    if (!error.config) {
      console.error('错误对象中没有配置信息:', error);
      return Promise.reject(error);
    }
    
    const apiPath = getApiPath(error.config.url);
    console.log('检查模拟数据:', apiPath, '可用模拟数据:', Object.keys(mockResponses).join(', '));
    
    // 如果API路径匹配到模拟数据，返回模拟响应
    if (useMockData && apiPath && mockResponses[apiPath]) {
      console.log('使用模拟数据:', apiPath);
      return Promise.resolve({ 
        data: mockResponses[apiPath], 
        status: 200,
        statusText: 'OK',
        headers: {},
        config: error.config,
      });
    }
    
    // 处理网络错误
    if (!error.response) {
      console.error('网络错误或服务器未响应');
      // 如果没有响应且有对应的模拟数据，自动启用模拟数据模式
      setUseMockData(true);
      
      if (apiPath && mockResponses[apiPath]) {
        console.log('网络错误，自动使用模拟数据:', apiPath);
        return Promise.resolve({ 
          data: mockResponses[apiPath], 
          status: 200,
          statusText: 'OK (Mocked)',
          headers: {},
          config: error.config,
        });
      }
      
      // 显示友好的错误消息
      return Promise.reject({
        data: { message: '网络错误或服务器未响应，请检查网络连接' }
      });
    }
    
    // 处理HTTP错误
    console.error('API错误:', error.response.status, error.response.data);
    
    // 处理401未授权错误
    if (error.response.status === 401) {
      console.log('未授权，需要登录');
      // 可以在这里添加重定向到登录页面的逻辑
    }
    
    // 处理404错误
    if (error.response.status === 404) {
      console.error('服务器错误状态码:', error.response.status);
      
      // 如果是404错误且有对应的模拟数据，自动启用模拟数据
      if (apiPath && mockResponses[apiPath]) {
        console.log('API 404错误，自动使用模拟数据:', apiPath);
        return Promise.resolve({ 
          data: mockResponses[apiPath], 
          status: 200,
          statusText: 'OK (Mocked)',
          headers: {},
          config: error.config,
        });
      }
      
      return Promise.reject({
        data: { message: '路径不存在' }
      });
    }
    
    return Promise.reject(error);
  }
);

// 默认启动时检查API可用性
checkApiAvailability();

export default api; 