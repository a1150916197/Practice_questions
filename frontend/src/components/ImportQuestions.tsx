import React, { useState, useEffect } from 'react';
import { Upload, Button, Modal, message, Table, Spin, Alert, Radio } from 'antd';
import { UploadOutlined, FileExcelOutlined, FileTextOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { API_BASE_URL } from '../config';
import { questionAPI } from '../services/api';

// 定义后端支持的问题类型枚举值，必须与后端保持一致
enum QuestionType {
  SINGLE_CHOICE = 'single',  // 单选题
  MULTIPLE_CHOICE = 'multiple',  // 多选题
  TRUE_FALSE = 'tf'  // 判断题
}

interface ImportQuestionsProps {
  bankId: string;
  onImportSuccess: () => void;
}

// 修改后的问题数据接口，与后端模型匹配
interface QuestionData {
  type: QuestionType;  // 使用正确的枚举值
  content: string;     // 原来的 title 改为 content
  options?: { label: string; content: string }[];  // 与后端模型匹配的选项格式
  answer: boolean | string | string[];  // 答案格式：判断题为布尔值，单选题为字符串，多选题为字符串数组
  explanation?: string;
}

const ImportQuestions: React.FC<ImportQuestionsProps> = ({ bankId, onImportSuccess }) => {
  console.log('ImportQuestions组件初始化, bankId:', bankId);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [fileType, setFileType] = useState<'excel' | 'txt'>('excel');
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [parsedData, setParsedData] = useState<QuestionData[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);

  const showImportModal = () => {
    setImportModalVisible(true);
    setParsedData([]);
    setError('');
  };

  const handleCancel = () => {
    setImportModalVisible(false);
    setParsedData([]);
    setError('');
  };

  const handleFileTypeChange = (e: React.ChangeEvent<HTMLInputElement> | any) => {
    setFileType(e.target.value);
    setParsedData([]);
    setError('');
  };

  const handleExcelFile = (file: File): Promise<QuestionData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const questions: QuestionData[] = jsonData.map((row: any) => {
            let options = [];
            let answer: boolean | string | string[] = '';

            // 将类型字符串转换为后端需要的枚举值
            const mappedType = mapTypeToEnum(row.type);

            // 处理选项和正确答案
            if (mappedType === QuestionType.SINGLE_CHOICE || mappedType === QuestionType.MULTIPLE_CHOICE) {
              options = [];
              const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
              const correctLabels = [];
              
              // 处理选项
              for (let i = 1; i <= 10; i++) { // 假设最多10个选项
                const optionKey = `option${i}`;
                const isCorrectKey = `isCorrect${i}`;
                if (row[optionKey]) {
                  options.push({
                    label: optionLabels[i-1],
                    content: row[optionKey]
                  });
                  
                  // 收集正确答案的标签
                  if (row[isCorrectKey] === 'true' || row[isCorrectKey] === true) {
                    correctLabels.push(optionLabels[i-1]);
                  }
                }
              }

              // 设置答案
              if (mappedType === QuestionType.SINGLE_CHOICE) {
                answer = correctLabels.length > 0 ? correctLabels[0] : 'A';
              } else {
                answer = correctLabels.length > 0 ? correctLabels : ['A'];
              }
            } else if (mappedType === QuestionType.TRUE_FALSE) {
              // 判断题答案
              answer = row.correctAnswer === 'true' || row.correctAnswer === true;
            }

            return {
              content: row.title || row.content, // 兼容两种字段名
              type: mappedType,
              options: options.length > 0 ? options : undefined,
              answer,
              explanation: row.explanation || ''
            };
          });

          resolve(questions);
        } catch (error) {
          reject(new Error('解析Excel文件失败，请检查文件格式'));
        }
      };
      reader.onerror = () => reject(new Error('读取文件失败'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleTxtFile = (file: File): Promise<QuestionData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const lines = content.split('\n').filter(line => line.trim() !== '');
          
          const questions: QuestionData[] = [];
          let currentQuestion: Partial<QuestionData> = {};
          let currentOptions: { label: string; content: string }[] = [];
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('题目:') || line.startsWith('题目：')) {
              // 如果已经有一个问题在处理中，先保存它
              if (currentQuestion.content) {
                questions.push(currentQuestion as QuestionData);
                currentQuestion = {};
                currentOptions = [];
              }
              
              currentQuestion.content = line.substring(line.indexOf(':') + 1).trim();
            } else if (line.startsWith('类型:') || line.startsWith('类型：')) {
              const typeValue = line.substring(line.indexOf(':') + 1).trim();
              currentQuestion.type = mapTypeToEnum(typeValue);
            } else if (line.startsWith('选项:') || line.startsWith('选项：')) {
              // 不处理这行，下面几行会是具体选项
            } else if ((line.startsWith('A.') || line.startsWith('A、') || line.startsWith('A:') || line.startsWith('A：')) && 
                      (currentQuestion.type === QuestionType.SINGLE_CHOICE || currentQuestion.type === QuestionType.MULTIPLE_CHOICE)) {
              currentOptions.push({
                label: 'A',
                content: line.substring(2).trim()
              });
            } else if ((line.startsWith('B.') || line.startsWith('B、') || line.startsWith('B:') || line.startsWith('B：')) && 
                      (currentQuestion.type === QuestionType.SINGLE_CHOICE || currentQuestion.type === QuestionType.MULTIPLE_CHOICE)) {
              currentOptions.push({
                label: 'B',
                content: line.substring(2).trim()
              });
            } else if ((line.startsWith('C.') || line.startsWith('C、') || line.startsWith('C:') || line.startsWith('C：')) && 
                      (currentQuestion.type === QuestionType.SINGLE_CHOICE || currentQuestion.type === QuestionType.MULTIPLE_CHOICE)) {
              currentOptions.push({
                label: 'C',
                content: line.substring(2).trim()
              });
            } else if ((line.startsWith('D.') || line.startsWith('D、') || line.startsWith('D:') || line.startsWith('D：')) && 
                      (currentQuestion.type === QuestionType.SINGLE_CHOICE || currentQuestion.type === QuestionType.MULTIPLE_CHOICE)) {
              currentOptions.push({
                label: 'D',
                content: line.substring(2).trim()
              });
            } else if (line.startsWith('正确答案:') || line.startsWith('正确答案：')) {
              const answerText = line.substring(line.indexOf(':') + 1).trim();
              
              if (currentQuestion.type === QuestionType.SINGLE_CHOICE) {
                // 单选题处理
                const correctOption = answerText.charAt(0).toUpperCase();
                currentQuestion.answer = correctOption;
                currentQuestion.options = currentOptions;
              } else if (currentQuestion.type === QuestionType.MULTIPLE_CHOICE) {
                // 多选题处理
                const correctOptions = answerText.split(/[,，\s]+/).map(opt => opt.trim().toUpperCase());
                currentQuestion.answer = correctOptions;
                currentQuestion.options = currentOptions;
              } else if (currentQuestion.type === QuestionType.TRUE_FALSE) {
                // 判断题处理
                currentQuestion.answer = answerText.toLowerCase() === 'true' || 
                                         answerText === '对' || 
                                         answerText === '正确' || 
                                         answerText === 'T';
              }
            } else if (line.startsWith('解析:') || line.startsWith('解析：')) {
              currentQuestion.explanation = line.substring(line.indexOf(':') + 1).trim();
            }
          }
          
          // 添加最后一个问题
          if (currentQuestion.content) {
            questions.push(currentQuestion as QuestionData);
          }
          
          resolve(questions);
        } catch (error) {
          reject(new Error('解析文本文件失败，请检查文件格式'));
        }
      };
      reader.onerror = () => reject(new Error('读取文件失败'));
      reader.readAsText(file);
    });
  };

  // 将类型字符串映射为后端枚举值
  const mapTypeToEnum = (value: string): QuestionType => {
    const map: Record<string, QuestionType> = {
      '单选': QuestionType.SINGLE_CHOICE,
      '单选题': QuestionType.SINGLE_CHOICE,
      'single_choice': QuestionType.SINGLE_CHOICE,
      '多选': QuestionType.MULTIPLE_CHOICE,
      '多选题': QuestionType.MULTIPLE_CHOICE,
      'multiple_choice': QuestionType.MULTIPLE_CHOICE,
      '判断': QuestionType.TRUE_FALSE,
      '判断题': QuestionType.TRUE_FALSE,
      'true_false': QuestionType.TRUE_FALSE
    };
    return map[value] || QuestionType.SINGLE_CHOICE;
  };

  // 将中文难度值映射为英文难度
  const mapDifficultyValue = (value: string): string => {
    const map: Record<string, string> = {
      '简单': 'easy',
      '容易': 'easy',
      '中等': 'medium',
      '一般': 'medium',
      '困难': 'hard',
      '难': 'hard'
    };
    return map[value] || 'medium';
  };

  const handleFileUpload = async (file: File) => {
    try {
      setError('');
      setImporting(true);
      
      let parsedQuestions: QuestionData[];
      
      if (fileType === 'excel') {
        parsedQuestions = await handleExcelFile(file);
      } else {
        parsedQuestions = await handleTxtFile(file);
      }
      
      if (parsedQuestions.length === 0) {
        setError('没有找到有效的题目数据');
        setImporting(false);
        return false;
      }
      
      setParsedData(parsedQuestions);
      setPreviewVisible(true);
      setImporting(false);
      return false; // 阻止自动上传
    } catch (err: any) {
      setError(err.message || '解析文件失败');
      setImporting(false);
      return false;
    }
  };

  const importQuestions = async () => {
    if (parsedData.length === 0) {
      setError('没有有效的题目数据');
      return;
    }

    try {
      setImporting(true);
      
      // 从localStorage获取用户信息
      const userString = localStorage.getItem('user');
      const user = userString ? JSON.parse(userString) : null;
      
      if (!user || !user.id) {
        throw new Error('用户未登录或ID不存在');
      }
      
      // 添加调试日志
      console.log('准备发送批量导入请求');
      console.log('API基础URL:', API_BASE_URL);
      console.log('题目数量:', parsedData.length);
      console.log('题目数据示例:', parsedData[0]);
      
      try {
        // 使用questionAPI提供的接口进行批量导入
        const response = await questionAPI.importQuestions({
          questions: parsedData,
          questionBankId: bankId
        });
        
        console.log('导入结果:', response.data);
        const result = response.data as { importedCount?: number; message: string };
        message.success(`成功导入 ${result.importedCount || parsedData.length} 道题目`);
        
        setImportModalVisible(false);
        setPreviewVisible(false);
        setParsedData([]);
        onImportSuccess();
      } catch (fetchError) {
        console.error('导入操作失败:', fetchError);
        if (fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
          throw new Error(`无法连接到服务器，请检查网络连接或服务器是否正常运行。API URL: ${API_BASE_URL}`);
        }
        throw fetchError;
      }
    } catch (error: any) {
      console.error('导入过程中发生错误:', error);
      setError(error.message || '导入题目失败');
    } finally {
      setImporting(false);
    }
  };

  const columns = [
    {
      title: '题目',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: QuestionType) => {
        const typeMap: Record<string, string> = {
          [QuestionType.SINGLE_CHOICE]: '单选题',
          [QuestionType.MULTIPLE_CHOICE]: '多选题',
          [QuestionType.TRUE_FALSE]: '判断题'
        };
        return typeMap[type] || type;
      }
    }
  ];

  // 调试添加的渲染标记
  useEffect(() => {
    console.log('ImportQuestions组件已挂载');
    return () => {
      console.log('ImportQuestions组件已卸载');
    };
  }, []);

  return (
    <>
      <Button 
        type="primary" 
        icon={<UploadOutlined />} 
        onClick={() => {
          console.log('点击导入题目按钮');
          showImportModal();
        }}
      >
        导入题目
      </Button>

      <Modal
        title="导入题目"
        open={importModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={700}
      >
        <Spin spinning={importing}>
          {error && <Alert message={error} type="error" style={{ marginBottom: 16 }} />}
          
          <div style={{ marginBottom: 16 }}>
            <Radio.Group value={fileType} onChange={handleFileTypeChange}>
              <Radio.Button value="excel">
                <FileExcelOutlined /> Excel文件
              </Radio.Button>
              <Radio.Button value="txt">
                <FileTextOutlined /> 文本文件
              </Radio.Button>
            </Radio.Group>
          </div>
          
          {!previewVisible ? (
            <>
              <Upload.Dragger
                beforeUpload={handleFileUpload}
                showUploadList={false}
                accept={fileType === 'excel' ? '.xlsx,.xls' : '.txt'}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                <p className="ant-upload-hint">
                  {fileType === 'excel' 
                    ? '支持Excel格式(.xlsx, .xls)，请按模板格式填写数据' 
                    : '支持文本格式(.txt)，请按指定格式编写题目'}
                </p>
              </Upload.Dragger>
              
              <div style={{ marginTop: 16 }}>
                <h4>文件格式说明：</h4>
                {fileType === 'excel' ? (
                  <ul>
                    <li>Excel文件必须包含以下列：title/content(题目内容)、type(题目类型)</li>
                    <li>type值应为：single(单选题)、multiple(多选题)、tf(判断题)</li>
                    <li>对于选择题，选项列命名为option1, option2...，正确答案列命名为isCorrect1, isCorrect2...</li>
                    <li>对于判断题，正确答案列命名为correctAnswer，值为true或false</li>
                    <li>可选列：explanation(解析)</li>
                  </ul>
                ) : (
                  <ul>
                    <li>每道题目需要以"题目:"开头</li>
                    <li>题目类型需要以"类型:"开头，可选值：单选题、多选题、判断题</li>
                    <li>选择题需要以A.、B.、C.、D.开头列出选项</li>
                    <li>正确答案需要以"正确答案:"开头</li>
                    <li>解析需要以"解析:"开头</li>
                  </ul>
                )}
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <h4>预览导入的题目 (共 {parsedData.length} 道)</h4>
                <Table 
                  dataSource={parsedData} 
                  columns={columns}
                  rowKey={(record, index) => `${index}`}
                  pagination={{ pageSize: 5 }}
                  size="small"
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button onClick={() => setPreviewVisible(false)}>返回</Button>
                <Button type="primary" onClick={importQuestions}>确认导入</Button>
              </div>
            </>
          )}
        </Spin>
      </Modal>
    </>
  );
};

export default ImportQuestions; 