import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
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

function App() {
  return (
    <ConfigProvider locale={zhCN}>
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
    </ConfigProvider>
  );
}

export default App;
