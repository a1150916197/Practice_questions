import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme, Spin } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';

// 核心组件直接导入
import Login from './pages/Login';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

// 全局上下文提供者
import { CacheProvider } from './contexts/CacheContext';

// 样式
import './App.css';

// 懒加载其他页面组件
const Dashboard = lazy(() => import('./pages/Dashboard'));
const QuestionBankList = lazy(() => import('./pages/QuestionBankList'));
const QuestionBankDetail = lazy(() => import('./pages/QuestionBankDetail'));
const CreateQuestionPage = lazy(() => import('./pages/CreateQuestionPage'));
const ExamPage = lazy(() => import('./pages/ExamPage'));
const ExamResult = lazy(() => import('./pages/ExamResult'));
const WrongQuestionList = lazy(() => import('./pages/WrongQuestionList'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

// 加载中组件
const LoadingComponent = () => (
  <div style={{ padding: '50px', textAlign: 'center' }}>
    <Spin size="large" tip="页面加载中..." />
  </div>
);

// 创建主题上下文，以便在组件间共享
export const ThemeContext = React.createContext({
  isDarkMode: false,
  toggleTheme: () => {}
});

function App() {
  // 读取用户主题偏好
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    // 检查用户偏好或本地存储
    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedMode = localStorage.getItem('darkMode');
    
    if (storedMode !== null) {
      setIsDarkMode(storedMode === 'true');
    } else {
      setIsDarkMode(prefersDarkMode);
      localStorage.setItem('darkMode', String(prefersDarkMode));
    }
  }, []);
  
  // 切换主题的函数
  const toggleTheme = () => {
    setIsDarkMode(prevMode => {
      const newMode = !prevMode;
      localStorage.setItem('darkMode', String(newMode));
      return newMode;
    });
  };
  
  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <ConfigProvider 
        locale={zhCN}
        theme={{
          algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            // 自定义主题令牌
            colorPrimary: '#1890ff',
            borderRadius: 8
          }
        }}
      >
        <CacheProvider>
          <div className={isDarkMode ? 'dark-mode' : 'light-mode'}>
            <Router>
              <Suspense fallback={<LoadingComponent />}>
                <Routes>
                  <Route path="/" element={<Login />} />
                  <Route path="/dashboard" element={
                    <PrivateRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </PrivateRoute>
                  } />
                  <Route path="/question-banks" element={
                    <PrivateRoute>
                      <Layout>
                        <QuestionBankList />
                      </Layout>
                    </PrivateRoute>
                  } />
                  <Route path="/question-banks/:id" element={
                    <PrivateRoute>
                      <Layout>
                        <QuestionBankDetail />
                      </Layout>
                    </PrivateRoute>
                  } />
                  <Route path="/question-banks/:id/create-question" element={
                    <PrivateRoute>
                      <Layout>
                        <CreateQuestionPage />
                      </Layout>
                    </PrivateRoute>
                  } />
                  <Route path="/exam/:bankId" element={
                    <PrivateRoute>
                      <ExamPage />
                    </PrivateRoute>
                  } />
                  <Route path="/exam-result/:bankId" element={
                    <PrivateRoute>
                      <Layout>
                        <ExamResult />
                      </Layout>
                    </PrivateRoute>
                  } />
                  <Route path="/wrong-questions" element={
                    <PrivateRoute>
                      <Layout>
                        <WrongQuestionList />
                      </Layout>
                    </PrivateRoute>
                  } />
                  <Route path="/admin" element={
                    <PrivateRoute adminOnly>
                      <Layout>
                        <AdminPanel />
                      </Layout>
                    </PrivateRoute>
                  } />
                </Routes>
              </Suspense>
            </Router>
          </div>
        </CacheProvider>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

export default App;
