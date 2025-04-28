import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Card,
  Button,
  Descriptions,
  Table,
  Tag,
  Space,
  message,
  Spin,
  Statistic,
  Row,
  Col,
  Divider,
  Modal,
  Popconfirm
} from 'antd';
import {
  BookOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  UploadOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { questionBankAPI, questionAPI } from '../services/api';
import ImportQuestions from '../components/ImportQuestions';

const { Title } = Typography;

enum QuestionType {
  SINGLE_CHOICE = 'single',
  MULTIPLE_CHOICE = 'multiple',
  TRUE_FALSE = 'tf'
}

interface Question {
  _id: string;
  type: QuestionType;
  content: string;
  options?: { label: string; content: string }[];
  answer: string | string[];
  explanation: string;
}

interface QuestionBank {
  _id: string;
  name: string;
  description: string;
  isPublic: boolean;
  createdAt: string;
  createdBy: { _id: string; name: string } | string;
}

const QuestionBankDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isCreator, setIsCreator] = useState(false);

  // 获取题库和问题数据
  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('开始获取题库详情，ID:', id);
      
      if (!id) {
        message.error('题库ID不存在');
        navigate('/question-banks');
        return;
      }
      
      // 获取用户信息
      const userString = localStorage.getItem('user');
      const user = userString ? JSON.parse(userString) : null;
      if (!user || !user.id) {
        console.log('未找到用户信息或用户ID');
        setIsCreator(false);
      } else {
        console.log('当前用户ID:', user.id);
      }

      try {
        // 使用API服务获取题库详情
        const bankResponse = await questionBankAPI.getQuestionBankById(id);
        const bankData = bankResponse.data as any;
        console.log('题库详情数据:', bankData);
        
        if (bankData) {
          setBank(bankData as QuestionBank);
          
          // 用户已登录且存在题库数据，进行创建者判断
          if (user && user.id) {
            // 检查是否为最近创建的题库（浏览器临时存储）
            const lastCreatedId = localStorage.getItem('lastCreatedBankId');
            if (lastCreatedId === id) {
              console.log('这是用户最近创建的题库，自动设置为创建者');
              setIsCreator(true);
            } 
            // 正常比较创建者ID
            else {
              // 尝试从题库数据中提取创建者ID
              let creatorId = null;
              
              // 处理不同格式的creator字段
              if (bankData.creator) {
                if (typeof bankData.creator === 'object' && bankData.creator !== null) {
                  // 处理createdBy是对象的情况 { _id: '...', name: '...' }
                  creatorId = bankData.creator._id;
                  console.log('创建者是对象，ID:', creatorId);
                } else {
                  // 处理createdBy是字符串的情况
                  creatorId = bankData.creator;
                  console.log('创建者是字符串ID:', creatorId);
                }
              }
              
              // 如果从数据中提取不到creator，使用替代策略
              if (!creatorId) {
                // 检查是否为用户的题库之一
                try {
                  console.log('尝试从用户题库列表中确认所有权');
                  const userBanksResponse = await questionBankAPI.getUserQuestionBanks(user.id);
                  // 确保数据是数组
                  const userBanks: any[] = Array.isArray(userBanksResponse.data) 
                    ? userBanksResponse.data 
                    : [];
                  
                  // 检查当前题库是否在用户题库列表中
                  const isUserBank = userBanks.some(bank => bank._id === id);
                  setIsCreator(isUserBank);
                  console.log('从用户题库列表确认所有权结果:', isUserBank);
                  
                  // 如果确认是用户创建的题库，则不需要继续比较ID
                  if (isUserBank) {
                    return;
                  }
                } catch (err) {
                  console.error('获取用户题库列表失败:', err);
                }
              }
              
              if (creatorId) {
                // 标准化ID字符串进行比较
                const userId = String(user.id).trim();
                const creatorIdStr = String(creatorId).trim();
                
                console.log('比较用户ID和创建者ID - 用户ID:', userId, '创建者ID:', creatorIdStr);
                const isCreatorFlag = userId === creatorIdStr;
                setIsCreator(isCreatorFlag);
                console.log('设置isCreator为:', isCreatorFlag);
              } else {
                console.log('无法从题库数据中提取创建者ID，设置非创建者状态');
                setIsCreator(false);
      }
            }
          } else {
            console.log('用户未登录，设置非创建者状态');
            setIsCreator(false);
          }
        }
      } catch (error) {
        console.error('获取题库详情失败:', error);
        message.error('获取题库详情失败');
      }

      // 获取题目列表
      try {
      const questionsResponse = await questionAPI.getQuestionsByBankId(id);
      console.log('题目列表数据:', questionsResponse.data);
        setQuestions(questionsResponse.data as Question[]);
      } catch (error) {
        console.error('获取题目列表失败:', error);
        message.error('获取题目失败');
      }
    } catch (error) {
      console.error('整体获取过程失败', error);
      message.error('加载失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, navigate]);

  const startExam = () => {
    navigate(`/exam/${id}`);
  };

  // 创建新题目
  const createQuestion = () => {
    navigate(`/question-banks/${id}/create-question`);
  };

  // 查看题目详情
  const viewQuestionDetail = (questionId: string) => {
    navigate(`/questions/${questionId}`);
  };

  // 编辑题目
  const editQuestion = (questionId: string) => {
    navigate(`/questions/${questionId}/edit`);
  };

  // 删除题目
  const deleteQuestion = async (questionId: string) => {
    try {
      await questionAPI.deleteQuestion(questionId);
      message.success('题目删除成功');
      fetchData(); // 重新加载数据
    } catch (error) {
      console.error('删除题目失败:', error);
      message.error('删除题目失败，请重试');
    }
  };

  // 导入题目成功后的回调
  const handleImportSuccess = () => {
    message.success('导入题目成功！');
    fetchData(); // 重新加载数据
  };

  const getQuestionTypeTag = (type: QuestionType) => {
    switch (type) {
      case QuestionType.SINGLE_CHOICE:
        return <Tag color="blue">单选题</Tag>;
      case QuestionType.MULTIPLE_CHOICE:
        return <Tag color="purple">多选题</Tag>;
      case QuestionType.TRUE_FALSE:
        return <Tag color="green">判断题</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  const questionTypeCount = () => {
    const counts = {
      [QuestionType.SINGLE_CHOICE]: 0,
      [QuestionType.MULTIPLE_CHOICE]: 0,
      [QuestionType.TRUE_FALSE]: 0
    };

    questions.forEach(question => {
      counts[question.type]++;
    });

    return counts;
  };

  const counts = questionTypeCount();

  const columns = [
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      title: '题目类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: QuestionType) => getQuestionTypeTag(type)
    },
    {
      title: '题目内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Question) => (
        <Space size="small">
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={() => viewQuestionDetail(record._id)}
          >
            查看
          </Button>
          {isCreator && (
            <>
              <Button 
                type="text" 
                icon={<EditOutlined />} 
                onClick={() => editQuestion(record._id)}
              >
                编辑
              </Button>
              <Popconfirm
                title="确定要删除这道题目吗？"
                description="删除后将无法恢复"
                onConfirm={() => deleteQuestion(record._id)}
                okText="删除"
                cancelText="取消"
                okButtonProps={{ danger: true }}
              >
                <Button 
                  type="text" 
                  danger
                  icon={<DeleteOutlined />}
                >
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!bank) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p>题库不存在或已被删除</p>
          <Button type="primary" onClick={() => navigate('/question-banks')}>
            返回题库列表
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <Title level={2}>题库详情</Title>

      <Card style={{ marginBottom: 24 }}>
        <Descriptions title={bank.name} bordered>
          <Descriptions.Item label="分类" span={3}>
            <Tag color="blue">{bank.description}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="题目数量" span={3}>
            {questions.length}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间" span={3}>
            {new Date(bank.createdAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间" span={3}>
            {new Date(bank.createdAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="描述" span={3}>
            {bank.description || '暂无描述'}
          </Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 16 }}>
          <Button
            type="primary"
            icon={<FileTextOutlined />}
            size="large"
            onClick={startExam}
          >
            开始答题
          </Button>
        </div>
      </Card>

      <Card title="题目类型统计" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="单选题"
              value={counts[QuestionType.SINGLE_CHOICE]}
              prefix={<BookOutlined />}
              suffix="道"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="多选题"
              value={counts[QuestionType.MULTIPLE_CHOICE]}
              prefix={<CheckCircleOutlined />}
              suffix="道"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="判断题"
              value={counts[QuestionType.TRUE_FALSE]}
              prefix={<ClockCircleOutlined />}
              suffix="道"
            />
          </Col>
        </Row>
      </Card>

      <Card 
        title="题目列表" 
        extra={
          <Space>
            {isCreator && (
              <>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={createQuestion}
                >
                  添加题目
                </Button>
                
                {/* 导入题目组件 */}
                {id && (
                  <ImportQuestions
                    bankId={id}
                    onImportSuccess={handleImportSuccess}
                  />
                )}
              </>
            )}
            
            {/* 如果不是创建者，显示信息说明 */}
            {!isCreator && (
              <Typography.Text type="secondary">
                仅题库创建者可添加或导入题目
              </Typography.Text>
            )}
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={questions.map(q => ({ ...q, key: q._id }))}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default QuestionBankDetail; 