import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  List, 
  Card, 
  Button, 
  Modal, 
  Form, 
  Input, 
  message, 
  Tabs, 
  Tooltip, 
  Space, 
  Typography,
  Empty,
  Spin,
  Switch,
  Tag,
  Badge,
  Divider
} from 'antd';
import { 
  EyeOutlined, 
  PlayCircleOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined,
  GlobalOutlined,
  LockOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';
import { questionBankAPI } from '../services/api';
import './QuestionBankList.css';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

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

const QuestionBankList: React.FC = () => {
  const [activeKey, setActiveKey] = useState('public');
  const [publicBanks, setPublicBanks] = useState<QuestionBank[]>([]);
  const [userBanks, setUserBanks] = useState<QuestionBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null);
  const [form] = Form.useForm();
  
  // 添加删除相关状态
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [bankToDelete, setBankToDelete] = useState<QuestionBank | null>(null);
  
  // 从localStorage获取用户信息
  const userString = localStorage.getItem('user');
  const user: User = userString ? JSON.parse(userString) : { id: '', name: '', role: 'student' };
  
  // 获取题库数据
  const fetchQuestionBanks = async () => {
    try {
      setLoading(true);
      // 获取公开题库
      const publicResponse = await questionBankAPI.getPublicQuestionBanks();
      setPublicBanks(publicResponse.data as QuestionBank[]);
      
      // 获取用户题库
      const userResponse = await questionBankAPI.getUserQuestionBanks(user.id);
      setUserBanks(userResponse.data as QuestionBank[]);
    } catch (error) {
      console.error('获取题库失败', error);
      message.error('获取题库失败，请重试');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchQuestionBanks();
  }, [user.id]);
  
  // 打开创建/编辑题库模态框
  const showModal = (bank?: QuestionBank) => {
    setEditingBank(bank || null);
    
    if (bank) {
      form.setFieldsValue({
        name: bank.name,
        description: bank.description,
        isPublic: bank.isPublic
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        isPublic: false
      });
    }
    
    setIsModalVisible(true);
  };
  
  // 关闭模态框
  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingBank(null);
    form.resetFields();
  };
  
  // 处理创建/编辑题库
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingBank) {
        // 更新现有题库
        await questionBankAPI.updateQuestionBank(editingBank._id, values);
        message.success('题库更新成功');
      } else {
        // 创建新题库
        const response = await questionBankAPI.createQuestionBank(values);
        console.log('创建题库成功，返回数据:', response.data);
        
        // 保存最近创建的题库ID，以便在详情页面确认创建者
        const bankData = response.data as any;
        if (bankData && bankData._id) {
          localStorage.setItem('lastCreatedBankId', bankData._id);
          // 设置一个5分钟的过期时间
          setTimeout(() => {
            localStorage.removeItem('lastCreatedBankId');
          }, 5 * 60 * 1000);
        }
        
        message.success('题库创建成功');
      }
      
      // 重新获取题库数据
      fetchQuestionBanks();
      
      // 关闭模态框
      handleCancel();
    } catch (error) {
      console.error('提交表单错误', error);
      message.error('操作失败，请重试');
    }
  };
  
  // 处理删除题库
  const handleDelete = (bank: QuestionBank) => {
    setBankToDelete(bank);
    setDeleteModalVisible(true);
  };
  
  // 执行删除操作
  const confirmDelete = async () => {
    if (!bankToDelete) return;
    
    try {
      // 使用API服务删除题库
      await questionBankAPI.deleteQuestionBank(bankToDelete._id);
      
      message.success('题库删除成功');
      fetchQuestionBanks();
    } catch (error) {
      console.error('删除题库失败，详细错误:', error);
      message.error('删除题库失败，请重试');
    } finally {
      setDeleteModalVisible(false);
      setBankToDelete(null);
    }
  };
  
  // 取消删除
  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setBankToDelete(null);
  };
  
  const renderBankList = (banks: QuestionBank[], isUserBanks: boolean = false) => (
    <List
      grid={{ 
        gutter: 16, 
        xs: 1, 
        sm: 1, 
        md: 2, 
        lg: 3, 
        xl: 4, 
        xxl: 4 
      }}
      dataSource={banks}
      renderItem={(bank) => (
        <List.Item>
          <Card
            className="question-bank-card"
            hoverable
            cover={
              <div className="card-cover">
                <div className="card-cover-content">
                  <div className="card-status">
                    {bank.isPublic ? (
                      <Tag color="blue" icon={<GlobalOutlined />}>公开</Tag>
                    ) : (
                      <Tag color="orange" icon={<LockOutlined />}>私有</Tag>
                    )}
                  </div>
                </div>
              </div>
            }
            actions={[
              <Tooltip title="查看详情" key="view">
                <Link to={`/question-banks/${bank._id}`}>
                  <Button type="text" icon={<EyeOutlined />} className="action-button">查看</Button>
                </Link>
              </Tooltip>,
              <Tooltip title="开始答题" key="exam">
                <Link to={`/exam/${bank._id}`}>
                  <Button type="primary" size="small" icon={<PlayCircleOutlined />} className="action-button">答题</Button>
                </Link>
              </Tooltip>,
              isUserBanks && (
                <Tooltip title="编辑" key="edit">
                  <Button type="text" icon={<EditOutlined />} onClick={() => showModal(bank)} className="action-button">编辑</Button>
                </Tooltip>
              ),
              isUserBanks && (
                <Tooltip title="删除" key="delete">
                  <Button 
                    type="text" 
                    danger
                    icon={<DeleteOutlined />} 
                    onClick={() => handleDelete(bank)}
                    className="action-button"
                  >
                    删除
                  </Button>
                </Tooltip>
              )
            ].filter(Boolean)}
          >
            <Card.Meta
              title={
                <Space>
                  <Text strong>{bank.name}</Text>
                </Space>
              }
              description={
                <>
                  <Paragraph ellipsis={{ rows: 2 }} className="bank-description">
                    {bank.description || '暂无描述'}
                  </Paragraph>
                  <Divider style={{ margin: '8px 0' }} />
                  <div className="bank-creator">
                    <Text type="secondary">创建者: {bank.creator?.name || '未知'}</Text>
                  </div>
                </>
              }
            />
          </Card>
        </List.Item>
      )}
      locale={{ emptyText: <Empty description="暂无题库" /> }}
    />
  );
  
  // 标签页
  const items = [
    {
      key: 'public',
      label: (
        <span>
          <GlobalOutlined />
          公开题库
        </span>
      ),
      children: loading ? (
        <div className="loading-container">
          <Spin size="large" tip="加载中..." />
        </div>
      ) : renderBankList(publicBanks)
    },
    {
      key: 'my',
      label: (
        <span>
          <LockOutlined />
          我的题库
        </span>
      ),
      children: (
        <>
          <div className="create-bank-container">
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => showModal()}
              size="large"
            >
              创建题库
            </Button>
          </div>
          {loading ? (
            <div className="loading-container">
              <Spin size="large" tip="加载中..." />
            </div>
          ) : renderBankList(userBanks, true)}
        </>
      )
    }
  ];
  
  return (
    <div className="question-bank-container">
      <Title level={2} className="page-title">题库列表</Title>
      
      <Tabs 
        activeKey={activeKey} 
        onChange={setActiveKey}
        items={items}
        className="bank-tabs"
      />
      
      {/* 创建/编辑题库模态框 */}
      <Modal
        title={editingBank ? '编辑题库' : '创建题库'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
        okText={editingBank ? '保存' : '创建'}
        cancelText="取消"
        width={400}
        className="bank-modal"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="题库名称"
            rules={[{ required: true, message: '请输入题库名称' }]}
          >
            <Input placeholder="请输入题库名称" size="large" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="题库描述"
          >
            <TextArea 
              placeholder="请输入题库描述（可选）" 
              rows={4}
              showCount
              maxLength={200}
            />
          </Form.Item>
          
          <Form.Item
            name="isPublic"
            label="是否公开"
            valuePropName="checked"
          >
            <Switch 
              checkedChildren={<GlobalOutlined />} 
              unCheckedChildren={<LockOutlined />}
            />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 删除确认模态框 */}
      <Modal
        title="确定要删除此题库吗？"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={cancelDelete}
        okText="删除"
        okType="danger"
        cancelText="取消"
        className="delete-modal"
      >
        <div className="delete-modal-content">
          <Text type="warning">
            <QuestionCircleOutlined /> 删除后，该题库中的所有题目也将被删除，且无法恢复。
          </Text>
          {bankToDelete && (
            <div className="delete-bank-info">
              <Text strong>题库名称: {bankToDelete.name}</Text>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default QuestionBankList; 