import React, { useState } from 'react';
import { Form, Input, Button, message, Card, Typography, Grid, Space } from 'antd';
import { UserOutlined, BookOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const screens = useBreakpoint();

  // 如果用户已登录，直接跳转到仪表盘
  React.useEffect(() => {
    try {
      const userString = localStorage.getItem('user');
      
      if (userString) {
        const user = JSON.parse(userString);
        
        if (user && user.id) {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('检查登录状态时出错:', error);
    }
  }, [navigate]);

  // 处理登录/注册
  const onFinish = async (values: { name: string }) => {
    try {
      setLoading(true);
      
      const response = await userAPI.login(values.name);
      
      // 保存用户信息到本地存储
      localStorage.setItem('user', JSON.stringify((response.data as any).user));
      
      message.success('登录成功');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('登录失败:', error);
      message.error(error.message || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const isMobile = !screens.md;

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: isMobile ? '0 16px' : 0,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
      <div style={{
        width: isMobile ? '100%' : '75%',
        maxWidth: 1000,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }}>
        {/* 左侧图片/信息区域 - 在移动端不显示 */}
        {!isMobile && (
          <div style={{ 
            flex: '0 0 50%',
            background: 'linear-gradient(120deg, #1890ff, #52c41a)',
            padding: 40,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <BookOutlined style={{ fontSize: 64, color: 'rgba(255,255,255,0.9)', marginBottom: 24 }} />
              <Title level={2} style={{ color: '#fff', marginBottom: 16 }}>题库学习系统</Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, lineHeight: '1.8' }}>
                轻松备考，高效学习，掌握知识，提升能力。随时随地，自由练习，实现教师梦想的第一步。
              </Text>
              
              <div style={{ marginTop: 40 }}>
                <Space direction="vertical" size={16}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: '50%', 
                      background: 'rgba(255,255,255,0.2)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginRight: 16
                    }}>
                      <RightOutlined style={{ color: '#fff' }} />
                    </div>
                    <Text style={{ color: '#fff' }}>多种题型，满足不同学习需求</Text>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: '50%', 
                      background: 'rgba(255,255,255,0.2)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginRight: 16
                    }}>
                      <RightOutlined style={{ color: '#fff' }} />
                    </div>
                    <Text style={{ color: '#fff' }}>错题分析，掌握知识薄弱点</Text>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: '50%', 
                      background: 'rgba(255,255,255,0.2)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginRight: 16
                    }}>
                      <RightOutlined style={{ color: '#fff' }} />
                    </div>
                    <Text style={{ color: '#fff' }}>专业解析，理解知识点</Text>
                  </div>
                </Space>
              </div>
            </div>
            
            {/* 装饰元素 */}
            <div style={{
              position: 'absolute',
              top: -100,
              right: -100,
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              zIndex: 1
            }} />
            
            <div style={{
              position: 'absolute',
              bottom: -50,
              left: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              zIndex: 1
            }} />
          </div>
        )}
        
        {/* 登录表单区域 */}
        <div style={{ 
          flex: isMobile ? '1' : '0 0 50%',
          background: '#fff',
          padding: isMobile ? '40px 24px' : 40,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          {/* 移动端标题 */}
          {isMobile && (
            <div style={{ 
              textAlign: 'center', 
              marginBottom: 32,
              background: 'linear-gradient(90deg, #1890ff, #52c41a)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              <Title level={3} style={{ marginBottom: 8 }}>题库学习系统</Title>
              <Text style={{ fontSize: 14, color: '#666' }}>输入姓名即可开始答题</Text>
            </div>
          )}
          
          {/* 电脑端标题 */}
          {!isMobile && (
            <div style={{ marginBottom: 40 }}>
              <Title level={3}>欢迎使用</Title>
              <Text type="secondary">输入您的姓名开始学习之旅</Text>
            </div>
          )}
          
          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
            size={isMobile ? "large" : "large"}
          >
            <Form.Item
              name="name"
              rules={[{ required: true, message: '请输入您的姓名' }]}
            >
              <Input 
                prefix={<UserOutlined style={{ color: '#1890ff' }} />} 
                placeholder="请输入姓名" 
                style={{ height: 50, borderRadius: 8 }}
                autoFocus
              />
            </Form.Item>

            <Form.Item style={{ marginTop: 24 }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                block 
                loading={loading}
                style={{ 
                  height: 50,
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 500,
                  background: 'linear-gradient(90deg, #1890ff, #52c41a)',
                  border: 'none'
                }}
              >
                进入系统
              </Button>
            </Form.Item>
          </Form>
          
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              © 2023 教师编制备考系统 - 版权所有
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 