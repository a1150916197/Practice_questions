import React, { useState, useEffect } from 'react';
import { 
  Card, 
  List, 
  Button, 
  Tabs, 
  Empty, 
  Typography, 
  Statistic, 
  Row, 
  Col,
  Tag,
  Popconfirm,
  message,
  Spin
} from 'antd';
import { 
  DeleteOutlined, 
  CheckCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import QuestionCard, { Question, QuestionType } from '../components/QuestionCard';
import { wrongQuestionAPI } from '../services/api';

const { Title, Paragraph } = Typography;

interface User {
  id: string;
  name: string;
}

interface WrongQuestion {
  _id: string;
  user: string;
  question: Question | null;
  wrongAnswer: any;
  timestamp: string;
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

const WrongQuestionList: React.FC = () => {
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestion[]>([]);
  const [stats, setStats] = useState<WrongQuestionStats | null>(null);
  const [activeKey, setActiveKey] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // 从localStorage获取用户信息
  const userString = localStorage.getItem('user');
  const user: User = userString ? JSON.parse(userString) : { id: '', name: '' };
  
  // 获取错题数据
  useEffect(() => {
    const fetchWrongQuestions = async () => {
      try {
        setLoading(true);
        
        // 获取错题列表
        const response = await wrongQuestionAPI.getUserWrongQuestions(user.id);
        setWrongQuestions(response.data as WrongQuestion[]);
        
        // 获取错题统计
        const statsResponse = await wrongQuestionAPI.getWrongQuestionStats(user.id);
        setStats(statsResponse.data as WrongQuestionStats);
      } catch (error) {
        console.error('获取错题失败', error);
        message.error('获取错题数据失败，请重试');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWrongQuestions();
  }, [user.id]);
  
  // 处理移除错题
  const handleRemoveWrongQuestion = async (id: string) => {
    try {
      await wrongQuestionAPI.removeWrongQuestion(id);
      
      // 更新列表
      setWrongQuestions(prevWrongQuestions => 
        prevWrongQuestions.filter(wq => wq._id !== id)
      );
      
      // 更新统计数据
      if (stats) {
        setStats({
          ...stats,
          totalWrongQuestions: stats.totalWrongQuestions - 1
        });
      }
      
      message.success('已从错题本中移除');
    } catch (error) {
      console.error('移除错题失败', error);
      message.error('移除失败，请重试');
    }
  };
  
  // 获取过滤后的错题列表
  const getFilteredWrongQuestions = () => {
    if (activeKey === 'all') {
      return wrongQuestions.filter(wq => wq.question !== null);
    }
    
    return wrongQuestions.filter(wq => wq.question && wq.question.type === activeKey);
  };
  
  // 处理练习错题
  const handlePracticeWrongQuestions = () => {
    try {
      const questionsToPractice = filteredWrongQuestions
        .filter(wq => wq.question)
        .map(wq => wq.question);
      
      if (questionsToPractice.length === 0) {
        message.warning('没有可练习的错题');
        return;
      }
      
      // 创建临时错题练习集
      const wrongQuestionBank = {
        _id: 'wrong-questions-practice',
        name: '错题练习',
        description: '来自错题本的练习题目',
        questions: questionsToPractice,
        isPublic: false,
        createdBy: user.id,
        createdAt: new Date().toISOString()
      };
      
      // 存储到会话存储中
      sessionStorage.setItem('wrongQuestionBank', JSON.stringify(wrongQuestionBank));
      
      // 跳转到答题页面
      message.success('正在准备错题练习...');
      navigate('/exam/wrong-questions-practice');
    } catch (error) {
      console.error('准备错题练习失败', error);
      message.error('无法开始练习，请重试');
    }
  };
  
  // 格式化时间
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };
  
  // 获取题目类型标签
  const getQuestionTypeTag = (type: QuestionType | undefined) => {
    if (!type) return null;
    
    switch (type) {
      case QuestionType.SINGLE_CHOICE:
        return <Tag color="blue">单选题</Tag>;
      case QuestionType.MULTIPLE_CHOICE:
        return <Tag color="purple">多选题</Tag>;
      case QuestionType.TRUE_FALSE:
        return <Tag color="green">判断题</Tag>;
      default:
        return null;
    }
  };
  
  const filteredWrongQuestions = getFilteredWrongQuestions();
  const validWrongQuestions = wrongQuestions.filter(wq => wq.question !== null);
  
  // 标签页
  const items = [
    {
      key: 'all',
      label: `全部错题 (${validWrongQuestions.length})`,
      children: null
    },
    {
      key: QuestionType.SINGLE_CHOICE,
      label: `单选题 (${stats?.typeStats.single || 0})`,
      children: null
    },
    {
      key: QuestionType.MULTIPLE_CHOICE,
      label: `多选题 (${stats?.typeStats.multiple || 0})`,
      children: null
    },
    {
      key: QuestionType.TRUE_FALSE,
      label: `判断题 (${stats?.typeStats.tf || 0})`,
      children: null
    }
  ];
  
  return (
    <div>
      <Title level={2}>我的错题本</Title>
      
      {/* 统计概览 */}
      {!loading && stats && (
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Statistic 
                title="错题总数" 
                value={stats.totalWrongQuestions}
                prefix={<FileTextOutlined />}
                suffix="道"
              />
            </Col>
            <Col xs={24} sm={16}>
              <Paragraph>
                错题分布: 
                <Tag color="blue" style={{ marginLeft: 8 }}>单选题 {stats.typeStats.single} 道</Tag>
                <Tag color="purple">多选题 {stats.typeStats.multiple} 道</Tag>
                <Tag color="green">判断题 {stats.typeStats.tf} 道</Tag>
              </Paragraph>
              <Paragraph>
                涉及题库:
                {stats.questionBanks.map(bank => (
                  <Tag key={bank._id} style={{ marginLeft: 8 }}>{bank.name}</Tag>
                ))}
              </Paragraph>
            </Col>
          </Row>
        </Card>
      )}
      
      {/* 错题列表 */}
      <Card
        loading={loading}
        tabList={items}
        activeTabKey={activeKey}
        onTabChange={setActiveKey}
        tabBarExtraContent={
          <div>
            {validWrongQuestions.length > 0 && (
              <Button 
                type="primary"
                disabled={filteredWrongQuestions.length === 0}
                onClick={handlePracticeWrongQuestions}
              >
                练习错题
              </Button>
            )}
          </div>
        }
      >
        {!loading && filteredWrongQuestions.length === 0 ? (
          <Empty 
            description={
              validWrongQuestions.length === 0 
                ? "您还没有错题记录" 
                : "没有符合条件的错题"
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            itemLayout="vertical"
            dataSource={filteredWrongQuestions}
            renderItem={(wrongQuestion) => (
              <List.Item
                key={wrongQuestion._id}
                actions={[
                  <Popconfirm
                    key="delete"
                    title="确定将此题从错题本中移除吗？"
                    onConfirm={() => handleRemoveWrongQuestion(wrongQuestion._id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button 
                      icon={<DeleteOutlined />} 
                      type="text" 
                      danger
                    >
                      移除
                    </Button>
                  </Popconfirm>,
                  <span key="time">
                    加入时间: {formatDate(wrongQuestion.timestamp)}
                  </span>
                ]}
                extra={wrongQuestion.question ? getQuestionTypeTag(wrongQuestion.question.type) : null}
              >
                {wrongQuestion.question ? (
                  <QuestionCard
                    question={wrongQuestion.question}
                    userAnswer={wrongQuestion.wrongAnswer}
                    onAnswerChange={() => {}}
                    showAnswer
                  />
                ) : (
                  <Card>
                    <Empty description="题目数据不存在或已被删除" />
                  </Card>
                )}
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default WrongQuestionList; 