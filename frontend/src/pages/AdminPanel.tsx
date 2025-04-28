import React, { useState, useEffect } from 'react';
import {
  Typography,
  Tabs,
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tag,
  Popconfirm
} from 'antd';
import {
  UserOutlined,
  BookOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const { Title } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

// 用户管理
interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

// 题库管理
interface QuestionBank {
  _id: string;
  name: string;
  description: string;
  category: string;
  questionCount: number;
  createdAt: string;
}

const AdminPanel: React.FC = () => {
  // 用户管理状态
  const [users, setUsers] = useState<User[]>([]);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [userForm] = Form.useForm();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // 题库管理状态
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [bankForm] = Form.useForm();
  const [editingBankId, setEditingBankId] = useState<string | null>(null);

  // 加载状态
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(false);

  // 加载用户数据
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await axios.get(`${API_BASE_URL}/api/users`);
      setUsers(response.data as User[]);
    } catch (error) {
      console.error('获取用户列表失败', error);
      message.error('获取用户列表失败');
    } finally {
      setLoadingUsers(false);
    }
  };

  // 加载题库数据
  const fetchQuestionBanks = async () => {
    try {
      setLoadingBanks(true);
      const response = await axios.get(`${API_BASE_URL}/api/questionBanks`);
      setQuestionBanks(response.data as QuestionBank[]);
    } catch (error) {
      console.error('获取题库列表失败', error);
      message.error('获取题库列表失败');
    } finally {
      setLoadingBanks(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    fetchUsers();
    fetchQuestionBanks();
  }, []);

  // 用户表格列
  const userColumns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role === 'admin' ? '管理员' : '普通用户'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Space size="middle">
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingUserId(record._id);
              userForm.setFieldsValue({
                username: record.username,
                email: record.email,
                role: record.role,
              });
              setUserModalVisible(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个用户吗?"
            onConfirm={() => handleDeleteUser(record._id)}
            okText="确定"
            cancelText="取消"
          >
            <Button icon={<DeleteOutlined />} danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 题库表格列
  const bankColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: '题目数量',
      dataIndex: 'questionCount',
      key: 'questionCount',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: QuestionBank) => (
        <Space size="middle">
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingBankId(record._id);
              bankForm.setFieldsValue({
                name: record.name,
                description: record.description,
                category: record.category,
              });
              setBankModalVisible(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个题库吗?"
            onConfirm={() => handleDeleteBank(record._id)}
            okText="确定"
            cancelText="取消"
          >
            <Button icon={<DeleteOutlined />} danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 用户相关处理函数
  const handleUserModalOk = async () => {
    try {
      const values = await userForm.validateFields();
      if (editingUserId) {
        // 更新用户
        await axios.put(`${API_BASE_URL}/api/users/${editingUserId}`, values);
        message.success('用户更新成功');
      } else {
        // 创建用户
        await axios.post(`${API_BASE_URL}/api/users`, values);
        message.success('用户创建成功');
      }
      setUserModalVisible(false);
      userForm.resetFields();
      setEditingUserId(null);
      fetchUsers();
    } catch (error) {
      console.error('保存用户失败', error);
      message.error('保存用户失败');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/users/${userId}`);
      message.success('用户删除成功');
      fetchUsers();
    } catch (error) {
      console.error('删除用户失败', error);
      message.error('删除用户失败');
    }
  };

  // 题库相关处理函数
  const handleBankModalOk = async () => {
    try {
      const values = await bankForm.validateFields();
      if (editingBankId) {
        // 更新题库
        await axios.put(`${API_BASE_URL}/api/questionBanks/${editingBankId}`, values);
        message.success('题库更新成功');
      } else {
        // 创建题库
        await axios.post(`${API_BASE_URL}/api/questionBanks`, values);
        message.success('题库创建成功');
      }
      setBankModalVisible(false);
      bankForm.resetFields();
      setEditingBankId(null);
      fetchQuestionBanks();
    } catch (error) {
      console.error('保存题库失败', error);
      message.error('保存题库失败');
    }
  };

  const handleDeleteBank = async (bankId: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/questionBanks/${bankId}`);
      message.success('题库删除成功');
      fetchQuestionBanks();
    } catch (error) {
      console.error('删除题库失败', error);
      message.error('删除题库失败');
    }
  };

  return (
    <div>
      <Title level={2}>系统管理</Title>

      <Tabs defaultActiveKey="users">
        <TabPane
          tab={
            <span>
              <UserOutlined />
              用户管理
            </span>
          }
          key="users"
        >
          <Card
            title="用户列表"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingUserId(null);
                  userForm.resetFields();
                  setUserModalVisible(true);
                }}
              >
                添加用户
              </Button>
            }
          >
            <Table
              columns={userColumns}
              dataSource={users.map(user => ({ ...user, key: user._id }))}
              loading={loadingUsers}
              pagination={{ pageSize: 10 }}
            />
          </Card>

          <Modal
            title={editingUserId ? '编辑用户' : '添加用户'}
            open={userModalVisible}
            onOk={handleUserModalOk}
            onCancel={() => setUserModalVisible(false)}
            okText="保存"
            cancelText="取消"
          >
            <Form form={userForm} layout="vertical">
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
              {!editingUserId && (
                <Form.Item
                  name="password"
                  label="密码"
                  rules={[{ required: true, message: '请输入密码' }]}
                >
                  <Input.Password placeholder="请输入密码" />
                </Form.Item>
              )}
              <Form.Item
                name="role"
                label="角色"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select placeholder="请选择角色">
                  <Option value="user">普通用户</Option>
                  <Option value="admin">管理员</Option>
                </Select>
              </Form.Item>
            </Form>
          </Modal>
        </TabPane>

        <TabPane
          tab={
            <span>
              <BookOutlined />
              题库管理
            </span>
          }
          key="banks"
        >
          <Card
            title="题库列表"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingBankId(null);
                  bankForm.resetFields();
                  setBankModalVisible(true);
                }}
              >
                添加题库
              </Button>
            }
          >
            <Table
              columns={bankColumns}
              dataSource={questionBanks.map(bank => ({ ...bank, key: bank._id }))}
              loading={loadingBanks}
              pagination={{ pageSize: 10 }}
            />
          </Card>

          <Modal
            title={editingBankId ? '编辑题库' : '添加题库'}
            open={bankModalVisible}
            onOk={handleBankModalOk}
            onCancel={() => setBankModalVisible(false)}
            okText="保存"
            cancelText="取消"
          >
            <Form form={bankForm} layout="vertical">
              <Form.Item
                name="name"
                label="名称"
                rules={[{ required: true, message: '请输入题库名称' }]}
              >
                <Input placeholder="请输入题库名称" />
              </Form.Item>
              <Form.Item
                name="category"
                label="分类"
                rules={[{ required: true, message: '请输入题库分类' }]}
              >
                <Input placeholder="请输入题库分类" />
              </Form.Item>
              <Form.Item
                name="description"
                label="描述"
              >
                <Input.TextArea rows={4} placeholder="请输入题库描述" />
              </Form.Item>
            </Form>
          </Modal>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AdminPanel; 