import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Button, List, Typography, Space, Avatar, Tag, Divider } from 'antd';
import { Link } from 'react-router-dom';
import { 
  BookOutlined, 
  FileTextOutlined, 
  CheckCircleOutlined, 
  RightOutlined, 
  UserOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { questionBankAPI, wrongQuestionAPI } from '../services/api';

const { Title, Text } = Typography;

interface User {
  id: string;
  name: string;
  role: string;
}

interface QuestionBank {
  _id: string;
  name: string;
  description: string;
  isPublic: boolean;
  creator: {
    _id: string;
    name: string;
  };
}

interface WrongQuestionStats {
  totalWrongQuestions: number;
  typeStats: {
    single: number;
    multiple: number;
    tf: number;
  };
  questionBanks: {
    _id: string;
    name: string;
  }[];
}

const Dashboard: React.FC = () => {
  const [publicBanks, setPublicBanks] = useState<QuestionBank[]>([]);
  const [userBanks, setUserBanks] = useState<QuestionBank[]>([]);
  const [wrongStats, setWrongStats] = useState<WrongQuestionStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 从localStorage获取用户信息
  const userString = localStorage.getItem('user');
  const user: User = userString ? JSON.parse(userString) : { id: '', name: '', role: 'student' };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 获取公开题库
        const publicResponse = await questionBankAPI.getPublicQuestionBanks();
        setPublicBanks(publicResponse.data as QuestionBank[]);
        
        // 获取用户题库
        const userResponse = await questionBankAPI.getUserQuestionBanks(user.id);
        setUserBanks(userResponse.data as QuestionBank[]);
        
        // 获取错题统计
        const statsResponse = await wrongQuestionAPI.getWrongQuestionStats(user.id);
        setWrongStats(statsResponse.data as WrongQuestionStats);
      } catch (error) {
        console.error('获取数据失败', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user.id]);
  
  return (
    <div className="dashboard">
      <div className="welcome-section" style={{ marginBottom: 24, padding: '16px 0' }}>
        <Title level={2} style={{ fontSize: '1.5rem', margin: 0 }}>
          <Space>
            <Avatar icon={<UserOutlined />} />
            欢迎回来，{user.name}
          </Space>
        </Title>
      </div>
      
      {/* 统计卡片 */}
      <Row gutter={[16, 8]} style={{ marginBottom: 24 }}>
        <Col xs={8} sm={8}>
          <Card loading={loading} size="small" bodyStyle={{ padding: '10px' }} hoverable>
            <Statistic
              title={<span style={{ fontSize: '12px' }}>我的题库</span>}
              value={userBanks.length}
              prefix={<BookOutlined style={{ color: '#1890ff' }} />}
              suffix="个"
              valueStyle={{ fontSize: '16px' }}
            />
          </Card>
        </Col>
        <Col xs={8} sm={8}>
          <Card loading={loading} size="small" bodyStyle={{ padding: '10px' }} hoverable>
            <Statistic
              title={<span style={{ fontSize: '12px' }}>错题数量</span>}
              value={wrongStats?.totalWrongQuestions || 0}
              prefix={<FileTextOutlined style={{ color: '#ff4d4f' }} />}
              suffix="道"
              valueStyle={{ fontSize: '16px' }}
            />
          </Card>
        </Col>
        <Col xs={8} sm={8}>
          <Card loading={loading} size="small" bodyStyle={{ padding: '10px' }} hoverable>
            <Statistic
              title={<span style={{ fontSize: '12px' }}>可用题库</span>}
              value={publicBanks.length}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              suffix="个"
              valueStyle={{ fontSize: '16px' }}
            />
          </Card>
        </Col>
      </Row>
      
      {/* 最近公开题库 */}
      <Card
        title={
          <Space>
            <BookOutlined style={{ color: '#1890ff' }} />
            <span>最近公开题库</span>
          </Space>
        }
        extra={
          <Link to="/question-banks">
            <Space>
              <Text type="secondary" style={{ fontSize: '14px' }}>查看全部</Text>
              <RightOutlined style={{ fontSize: '12px' }} />
            </Space>
          </Link>
        }
        style={{ marginBottom: 24 }}
        loading={loading}
        bodyStyle={{ padding: '12px' }}
        bordered={false}
        className="dashboard-card"
      >
        <List
          dataSource={publicBanks.slice(0, 5)}
          renderItem={(bank: QuestionBank) => (
            <List.Item
              className="bank-list-item"
              style={{ 
                padding: '12px 8px',
                borderRadius: '8px',
                marginBottom: '8px',
                background: '#f9f9f9' 
              }}
            >
              <List.Item.Meta
                avatar={<Avatar style={{ backgroundColor: '#1890ff' }}>{bank.name.slice(0, 1)}</Avatar>}
                title={<Text strong>{bank.name}</Text>}
                description={
                  <Space direction="vertical" size={2} style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }} ellipsis={{ tooltip: bank.description }}>
                      {bank.description || '无描述'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>创建者: {bank.creator?.name || '未知'}</Text>
                  </Space>
                }
              />
              <div className="list-item-actions">
                <Space wrap size={[4, 8]} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Link to={`/question-banks/${bank._id}`}>
                    <Button type="text" size="small">
                      详情
                    </Button>
                  </Link>
                  <Link to={`/exam/${bank._id}`}>
                    <Button type="primary" size="small" icon={<ArrowRightOutlined />}>
                      开始
                    </Button>
                  </Link>
                </Space>
              </div>
            </List.Item>
          )}
          locale={{ emptyText: '暂无公开题库' }}
          className="bank-list"
        />
      </Card>
      
      {/* 我的错题库 */}
      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: '#ff4d4f' }} />
            <span>我的错题</span>
          </Space>
        }
        extra={
          <Link to="/wrong-questions">
            <Space>
              <Text type="secondary" style={{ fontSize: '14px' }}>查看全部</Text>
              <RightOutlined style={{ fontSize: '12px' }} />
            </Space>
          </Link>
        }
        loading={loading}
        bodyStyle={{ padding: '16px' }}
        bordered={false}
        className="dashboard-card"
      >
        {wrongStats && wrongStats.totalWrongQuestions > 0 ? (
          <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={8} sm={8}>
                <Card size="small" bordered={false} style={{ background: '#f0f5ff', borderRadius: '8px' }}>
                  <Statistic
                    title={<span style={{ fontSize: '12px', color: '#597ef7' }}>单选题错题</span>}
                    value={wrongStats.typeStats.single}
                    suffix="道"
                    valueStyle={{ fontSize: '16px', color: '#2f54eb' }}
                  />
                </Card>
              </Col>
              <Col xs={8} sm={8}>
                <Card size="small" bordered={false} style={{ background: '#fff2e8', borderRadius: '8px' }}>
                  <Statistic
                    title={<span style={{ fontSize: '12px', color: '#fa8c16' }}>多选题错题</span>}
                    value={wrongStats.typeStats.multiple}
                    suffix="道"
                    valueStyle={{ fontSize: '16px', color: '#fa541c' }}
                  />
                </Card>
              </Col>
              <Col xs={8} sm={8}>
                <Card size="small" bordered={false} style={{ background: '#f6ffed', borderRadius: '8px' }}>
                  <Statistic
                    title={<span style={{ fontSize: '12px', color: '#52c41a' }}>判断题错题</span>}
                    value={wrongStats.typeStats.tf}
                    suffix="道"
                    valueStyle={{ fontSize: '16px', color: '#389e0d' }}
                  />
                </Card>
              </Col>
            </Row>
            
            {wrongStats.questionBanks && wrongStats.questionBanks.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                  错题来源:
                </Text>
                <div>
                  {wrongStats.questionBanks.map(bank => (
                    <Tag key={bank._id} color="processing" style={{ marginBottom: '8px' }}>
                      {bank.name}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
            
            <Link to="/wrong-questions">
              <Button type="primary" block>
                练习我的错题
              </Button>
            </Link>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '28px 0' }}>
            <Space direction="vertical" size={16} align="center">
              <FileTextOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
              <Text type="secondary">您还没有错题记录</Text>
            <Link to="/question-banks">
              <Button type="primary">
                去答题
              </Button>
            </Link>
            </Space>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard; 