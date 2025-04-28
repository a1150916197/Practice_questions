// 使用相对路径或当前网站的主机名，而不是硬编码的localhost
const currentHost = window.location.hostname;
let apiBaseUrl = '';

console.log('当前环境:', process.env.NODE_ENV);
console.log('当前主机名:', currentHost);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

// 根据环境设置API基础URL
if (process.env.NODE_ENV === 'production') {
  // 生产环境：使用相同的主机名
  apiBaseUrl = window.location.origin;
  console.log('生产环境API基础URL:', apiBaseUrl);
} else {
  // 开发环境：如果是本地IP或localhost，使用localhost:5000
  if (currentHost === 'localhost' || /^127\.\d+\.\d+\.\d+$/.test(currentHost)) {
    apiBaseUrl = 'http://localhost:5000';
  } else {
    // 如果是从其他设备访问的开发服务器，使用相同IP但不同端口
    apiBaseUrl = `${window.location.protocol}//${currentHost}:5000`;
  }
  console.log('开发环境API基础URL:', apiBaseUrl);
}

console.log('最终API基础URL:', process.env.REACT_APP_API_URL || apiBaseUrl);

export const API_BASE_URL = process.env.REACT_APP_API_URL || apiBaseUrl;

//export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'; 
export const API_URL = process.env.REACT_APP_API_URL || `${apiBaseUrl}/api`;