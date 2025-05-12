import React, { ReactNode, useState, useContext } from 'react';
import { Layout as AntLayout, Menu, Avatar, Dropdown, MenuProps, Button, Grid, Space, Drawer, Badge } from 'antd';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  BookOutlined,
  FileTextOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  MoonOutlined,
  SunOutlined
} from '@ant-design/icons';
import { ThemeContext } from '../App';

const { Header, Content } = AntLayout;
const { useBreakpoint } = Grid;

interface LayoutProps {
  children: ReactNode;
}

interface User {
  id: string;
  name: string;
  role: string;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  
  // 从localStorage获取用户信息
  const userString = localStorage.getItem('user');
  const user: User = userString ? JSON.parse(userString) : { name: '未登录', role: 'student' };
  
  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };
  
  // 用户下拉菜单选项
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: user.name
    },
    {
      key: 'theme',
      icon: isDarkMode ? <SunOutlined /> : <MoonOutlined />,
      label: isDarkMode ? '切换到浅色模式' : '切换到深色模式',
      onClick: toggleTheme
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];
  
  // 确定当前激活的菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return ['dashboard'];
    if (path.includes('/question-banks')) return ['question-banks'];
    if (path.includes('/wrong-questions')) return ['wrong-questions'];
    if (path.includes('/admin')) return ['admin'];
    return ['dashboard'];
  };

  // 关闭抽屉
  const handleMenuClick = () => {
    setDrawerVisible(false);
  };
  
  // 菜单项配置
  const menuItems = [
    {
      key: 'dashboard',
      icon: <HomeOutlined />,
      label: <Link to="/dashboard" onClick={handleMenuClick}>首页</Link>
    },
    {
      key: 'question-banks',
      icon: <BookOutlined />,
      label: <Link to="/question-banks" onClick={handleMenuClick}>题库列表</Link>
    },
    {
      key: 'wrong-questions',
      icon: <FileTextOutlined />,
      label: <Link to="/wrong-questions" onClick={handleMenuClick}>我的错题</Link>
    },
    user.role === 'admin' ? {
      key: 'admin',
      icon: <SettingOutlined />,
      label: <Link to="/admin" onClick={handleMenuClick}>管理面板</Link>
    } : null
  ].filter(Boolean);
  
  // 移动导航栏items
  const mobileNavItems = [
    {
      key: 'dashboard',
      icon: <HomeOutlined style={{ fontSize: 20 }} />,
      label: <Link to="/dashboard" style={{ fontSize: 12 }}>首页</Link>
    },
    {
      key: 'question-banks',
      icon: <BookOutlined style={{ fontSize: 20 }} />,
      label: <Link to="/question-banks" style={{ fontSize: 12 }}>题库</Link>
    },
    {
      key: 'wrong-questions',
      icon: <FileTextOutlined style={{ fontSize: 20 }} />,
      label: <Link to="/wrong-questions" style={{ fontSize: 12 }}>错题</Link>
    },
    user.role === 'admin' ? {
      key: 'admin',
      icon: <SettingOutlined style={{ fontSize: 20 }} />,
      label: <Link to="/admin" style={{ fontSize: 12 }}>管理</Link>
    } : null
  ].filter(Boolean);
  
  // 判断是否为移动设备
  const isMobile = !screens.md;
  
  return (
    <AntLayout style={{ minHeight: '100vh', background: isDarkMode ? '#141414' : '#f0f2f5' }}>
        <Header style={{ 
        background: isDarkMode ? '#1f1f1f' : '#fff', 
          padding: '0 16px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 99,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        height: isMobile ? 56 : 64
        }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {isMobile ? (
            <Button 
              type="text" 
              icon={<MenuUnfoldOutlined />} 
              onClick={() => setDrawerVisible(true)}
              style={{ marginRight: 12 }}
            />
          ) : null}
          <div className="logo" style={{ 
            fontWeight: 'bold', 
            fontSize: isMobile ? 16 : 18,
            background: 'linear-gradient(to right, #1890ff, #52c41a)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent' 
          }}>
              题库系统
            </div>
        </div>
        
        {!isMobile && (
          <Menu
            mode="horizontal"
            selectedKeys={getSelectedKey()}
            items={menuItems}
            style={{ 
              flex: 1, 
              marginLeft: 30,
              border: 'none'
            }}
          />
        )}
          
        <Space size={isMobile ? 4 : 12}>
          <Button 
            type="text" 
            icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />} 
            onClick={toggleTheme}
            size={isMobile ? "small" : "middle"}
          />
          
          <Badge dot>
            <Button type="text" icon={<BellOutlined />} size={isMobile ? "small" : "middle"} />
          </Badge>
          
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Avatar icon={<UserOutlined />} size={isMobile ? "small" : "default"} />
              {!isMobile && <span style={{ marginLeft: 8 }}>{user.name}</span>}
            </div>
          </Dropdown>
        </Space>
      </Header>
      
      {/* 移动端侧边栏抽屉 */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
            <span>{user.name}</span>
          </div>
        }
        placement="left"
        closable={true}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={250}
      >
        <Menu 
          mode="inline" 
          selectedKeys={getSelectedKey()}
          items={menuItems}
          style={{ border: 'none' }}
        />
        
        <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, padding: '0 24px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button 
              icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
              onClick={() => {
                toggleTheme();
                setDrawerVisible(false);
              }}
              block
            >
              {isDarkMode ? '切换到浅色模式' : '切换到深色模式'}
            </Button>
            
            <Button 
              type="primary" 
              danger 
              icon={<LogoutOutlined />} 
              onClick={handleLogout}
              block
            >
              退出登录
            </Button>
          </Space>
        </div>
      </Drawer>
      
      <Content style={{ 
        margin: isMobile ? '8px 8px 60px' : '16px', 
        padding: isMobile ? 12 : 20, 
        background: isDarkMode ? '#1f1f1f' : '#fff', 
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        minHeight: isMobile ? 'calc(100vh - 124px)' : 'calc(100vh - 96px)'
      }}>
        {children}
      </Content>
      
      {/* 移动端底部导航 */}
      {isMobile && (
        <div style={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          background: isDarkMode ? '#1f1f1f' : '#fff',
          borderTop: `1px solid ${isDarkMode ? '#303030' : '#f0f0f0'}`,
          zIndex: 99
        }}>
          <Menu
            mode="horizontal"
            selectedKeys={getSelectedKey()}
            items={mobileNavItems}
            style={{ 
              display: 'flex',
              justifyContent: 'space-around',
              border: 'none'
            }}
          />
        </div>
      )}
    </AntLayout>
  );
};

export default Layout; 