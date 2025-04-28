import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Radio,
  Space,
  Card,
  Typography,
  message,
  Select,
  Divider,
  Switch
} from 'antd';
import { ArrowLeftOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { questionAPI } from '../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE'
}

// 定义创建题目表单数据的接口
interface QuestionFormData {
  type: QuestionType;
  content: string;
  explanation: string;
  questionBankId: string | undefined;
  options?: Array<{ label: string; content: string }>;
  answer?: string | string[] | boolean;
}

const CreateQuestionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [questionType, setQuestionType] = useState<QuestionType>(QuestionType.SINGLE_CHOICE);

  // 提交表单
  const handleSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      
      // 准备数据
      const formData: QuestionFormData = {
        type: values.type,
        content: values.content,
        explanation: values.explanation || '',
        questionBankId: id
      };
      
      // 根据题目类型处理选项和答案
      if (values.type === QuestionType.SINGLE_CHOICE || values.type === QuestionType.MULTIPLE_CHOICE) {
        const options = values.options.map((option: any, index: number) => ({
          label: String.fromCharCode(65 + index), // A, B, C, D...
          content: option.content
        }));
        
        formData.options = options;
        
        if (values.type === QuestionType.SINGLE_CHOICE) {
          formData.answer = values.singleAnswer;
        } else {
          formData.answer = values.multipleAnswer || [];
        }
      } else if (values.type === QuestionType.TRUE_FALSE) {
        formData.answer = values.trueFalseAnswer;
      }
      
      console.log('题目表单数据:', formData);
      
      // 调用API创建题目
      await questionAPI.createQuestion(formData);
      message.success('题目创建成功');
      
      // 跳转回题库详情页
      navigate(`/question-banks/${id}`);
    } catch (error) {
      console.error('创建题目失败:', error);
      message.error('创建题目失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };
  
  // 返回题库详情
  const handleBack = () => {
    navigate(`/question-banks/${id}`);
  };
  
  // 根据题目类型渲染不同的选项和答案输入区域
  const renderAnswerSection = () => {
    switch (questionType) {
      case QuestionType.SINGLE_CHOICE:
        return (
          <>
            <Form.List name="options" initialValue={[{ content: '' }, { content: '' }]}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field, index) => (
                    <Form.Item
                      key={field.key}
                      label={`选项${String.fromCharCode(65 + index)}`}
                      required
                    >
                      <Space style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                        <Form.Item
                          {...field}
                          name={[field.name, 'content']}
                          noStyle
                          rules={[{ required: true, message: '请输入选项内容' }]}
                        >
                          <Input placeholder="请输入选项内容" style={{ width: '400px' }} />
                        </Form.Item>
                        {fields.length > 2 ? (
                          <MinusCircleOutlined onClick={() => remove(field.name)} />
                        ) : null}
                      </Space>
                    </Form.Item>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      icon={<PlusOutlined />}
                      disabled={fields.length >= 6}
                    >
                      添加选项（最多6个）
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
            
            <Form.Item 
              name="singleAnswer" 
              label="正确答案" 
              rules={[{ required: true, message: '请选择正确答案' }]}
            >
              <Radio.Group>
                <Space direction="vertical">
                  <Radio value="A">A</Radio>
                  <Radio value="B">B</Radio>
                  <Radio value="C">C</Radio>
                  <Radio value="D">D</Radio>
                  <Radio value="E">E</Radio>
                  <Radio value="F">F</Radio>
                </Space>
              </Radio.Group>
            </Form.Item>
          </>
        );
      
      case QuestionType.MULTIPLE_CHOICE:
        return (
          <>
            <Form.List name="options" initialValue={[{ content: '' }, { content: '' }, { content: '' }]}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field, index) => (
                    <Form.Item
                      key={field.key}
                      label={`选项${String.fromCharCode(65 + index)}`}
                      required
                    >
                      <Space style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                        <Form.Item
                          {...field}
                          name={[field.name, 'content']}
                          noStyle
                          rules={[{ required: true, message: '请输入选项内容' }]}
                        >
                          <Input placeholder="请输入选项内容" style={{ width: '400px' }} />
                        </Form.Item>
                        {fields.length > 3 ? (
                          <MinusCircleOutlined onClick={() => remove(field.name)} />
                        ) : null}
                      </Space>
                    </Form.Item>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      icon={<PlusOutlined />}
                      disabled={fields.length >= 6}
                    >
                      添加选项（最多6个）
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
            
            <Form.Item 
              name="multipleAnswer" 
              label="正确答案" 
              rules={[{ required: true, message: '请选择正确答案' }]}
            >
              <Select
                mode="multiple"
                placeholder="请选择正确答案（可多选）"
                style={{ width: '100%' }}
              >
                <Option value="A">A</Option>
                <Option value="B">B</Option>
                <Option value="C">C</Option>
                <Option value="D">D</Option>
                <Option value="E">E</Option>
                <Option value="F">F</Option>
              </Select>
            </Form.Item>
          </>
        );
      
      case QuestionType.TRUE_FALSE:
        return (
          <Form.Item 
            name="trueFalseAnswer" 
            label="正确答案" 
            rules={[{ required: true, message: '请选择正确答案' }]}
          >
            <Radio.Group>
              <Radio value={true}>正确</Radio>
              <Radio value={false}>错误</Radio>
            </Radio.Group>
          </Form.Item>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
        >
          返回题库
        </Button>
      </div>
      
      <Title level={2}>添加题目</Title>
      
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            type: QuestionType.SINGLE_CHOICE
          }}
        >
          <Form.Item
            name="type"
            label="题目类型"
            rules={[{ required: true, message: '请选择题目类型' }]}
          >
            <Radio.Group onChange={(e) => setQuestionType(e.target.value)}>
              <Radio value={QuestionType.SINGLE_CHOICE}>单选题</Radio>
              <Radio value={QuestionType.MULTIPLE_CHOICE}>多选题</Radio>
              <Radio value={QuestionType.TRUE_FALSE}>判断题</Radio>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item
            name="content"
            label="题目内容"
            rules={[{ required: true, message: '请输入题目内容' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="请输入题目内容"
              showCount
              maxLength={500}
            />
          </Form.Item>
          
          <Divider>选项与答案</Divider>
          
          {renderAnswerSection()}
          
          <Divider />
          
          <Form.Item
            name="explanation"
            label="解析"
          >
            <TextArea 
              rows={3} 
              placeholder="请输入题目解析（可选）"
              showCount
              maxLength={500}
            />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={submitting}
              size="large"
            >
              保存题目
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateQuestionPage; 