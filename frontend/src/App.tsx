import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';

// 页面组件
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import QuestionBankList from './pages/QuestionBankList';
import QuestionBankDetail from './pages/QuestionBankDetail';
import CreateQuestionPage from './pages/CreateQuestionPage';
import ExamPage from './pages/ExamPage';
import ExamResult from './pages/ExamResult';
import WrongQuestionList from './pages/WrongQuestionList';
import AdminPanel from './pages/AdminPanel';

// 公共组件
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

// 样式
import './App.css';

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
        <div className={isDarkMode ? 'dark-mode' : 'light-mode'}>
      <Router>
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
      </Router>
        </div>
    </ConfigProvider>
    </ThemeContext.Provider>
  );
}

export default App;
