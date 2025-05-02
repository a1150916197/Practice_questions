import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Button, 
  Divider, 
  Typography, 
  Progress,
  Empty,
  message
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  RollbackOutlined,
  HomeOutlined
} from '@ant-design/icons';
import QuestionCard, { Question, QuestionType } from '../components/QuestionCard';
import { questionAPI, questionBankAPI } from '../services/api';

const { Title, Paragraph } = Typography;

interface ExamResultData {
  bankId: string;
  userAnswers: {
    [key: string]: any;
  };
  timeSpent: number;
  totalQuestions: number;
  correctAnswers: number;
}

const ExamResult: React.FC = () => {
  const { bankId } = useParams<{ bankId: string }>();
  const navigate = useNavigate();
  
  const [questionBank, setQuestionBank] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [examResult, setExamResult] = useState<ExamResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWrongQuestionPractice, setIsWrongQuestionPractice] = useState(false);
  
  // 获取考试结果和题目数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 从sessionStorage获取考试结果
        const resultString = sessionStorage.getItem('examResult');
        
        if (!resultString) {
          message.error('未找到考试结果，请重新答题');
          navigate(`/question-banks/${bankId}`);
          return;
        }
        
        const result = JSON.parse(resultString) as ExamResultData;
        setExamResult(result);
        
        // 检查是否是错题练习模式
        if (bankId === 'wrong-questions-practice') {
          setIsWrongQuestionPractice(true);
          
          // 从sessionStorage获取错题练习数据
          const wrongQuestionBankString = sessionStorage.getItem('wrongQuestionBank');
          
          if (!wrongQuestionBankString) {
            message.error('错题练习数据不存在');
            navigate('/wrong-questions');
            return;
          }
          
          const wrongQuestionBank = JSON.parse(wrongQuestionBankString);
          setQuestionBank(wrongQuestionBank);
          setQuestions(wrongQuestionBank.questions);
        } else {
          // 正常模式：从API获取数据
        // 获取题库信息
        const bankResponse = await questionBankAPI.getQuestionBankById(bankId!);
        setQuestionBank(bankResponse.data);
        
        // 获取题目列表
        const questionsResponse = await questionAPI.getQuestionsByBankId(bankId!);
        setQuestions(questionsResponse.data as Question[]);
        }
      } catch (error) {
        console.error('获取数据失败', error);
        message.error('获取结果数据失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [bankId, navigate]);
  
  // 格式化时间
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // 计算正确率
  const calculateAccuracy = () => {
    if (!examResult) return 0;
    return Math.round((examResult.correctAnswers / examResult.totalQuestions) * 100);
  };
  
  // 分析错题类型分布
  const analyzeWrongQuestions = () => {
    if (!examResult || !questions.length) return {
      totalWrong: 0,
      typeStats: {
        [QuestionType.SINGLE_CHOICE]: 0,
        [QuestionType.MULTIPLE_CHOICE]: 0,
        [QuestionType.TRUE_FALSE]: 0
      }
    };
    
    const wrongQuestions = questions.filter(q => {
      const userAnswer = examResult.userAnswers[q._id];
      let isCorrect = false;
      
      if (q.type === QuestionType.SINGLE_CHOICE || q.type === QuestionType.TRUE_FALSE) {
        isCorrect = userAnswer === q.answer;
      } else if (q.type === QuestionType.MULTIPLE_CHOICE) {
        const correctAnswers = q.answer as string[];
        const userAnswerArray = userAnswer as string[] || [];
        
        isCorrect = 
          userAnswerArray.length === correctAnswers.length && 
          userAnswerArray.every(a => correctAnswers.includes(a));
      }
      
      return !isCorrect && userAnswer !== undefined;
    });
    
    const typeStats = {
      [QuestionType.SINGLE_CHOICE]: 0,
      [QuestionType.MULTIPLE_CHOICE]: 0,
      [QuestionType.TRUE_FALSE]: 0
    };
    
    wrongQuestions.forEach(q => {
      typeStats[q.type]++;
    });
    
    return {
      totalWrong: wrongQuestions.length,
      typeStats
    };
  };
  
  const wrongStats = analyzeWrongQuestions();
  
  // 重新答题
  const handleRetry = () => {
    navigate(`/exam/${bankId}`);
  };
  
  // 返回首页
  const handleBackHome = () => {
    navigate('/dashboard');
  };

  // 返回错题本
  const handleBackToWrongQuestions = () => {
    navigate('/wrong-questions');
  };
  
  if (loading || !examResult) {
    return (
      <div style={{ padding: 24 }}>
        <Card loading={loading}>
          <div style={{ height: 400 }}></div>
        </Card>
      </div>
    );
  }
  
  return (
    <div>
      <Title level={2}>{isWrongQuestionPractice ? '错题练习结果' : '答题结果'}</Title>
      
      {/* 结果概览 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={24}>
          <Col xs={24} sm={8}>
            <Statistic 
              title="正确率" 
              value={calculateAccuracy()} 
              suffix="%" 
              valueStyle={{ color: calculateAccuracy() >= 60 ? '#3f8600' : '#cf1322' }}
              prefix={calculateAccuracy() >= 60 ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            />
            <Progress 
              percent={calculateAccuracy()} 
              status={calculateAccuracy() >= 60 ? "success" : "exception"} 
              style={{ marginTop: 8 }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic 
              title="得分统计" 
              value={examResult.correctAnswers} 
              suffix={`/ ${examResult.totalQuestions}`}
            />
            <Paragraph style={{ marginTop: 8 }}>
              共 {examResult.totalQuestions} 道题，答对 {examResult.correctAnswers} 道，
              答错 {examResult.totalQuestions - examResult.correctAnswers} 道
            </Paragraph>
          </Col>
          <Col xs={24} sm={8}>
            <Statistic 
              title="用时" 
              value={formatTime(examResult.timeSpent)} 
              prefix={<ClockCircleOutlined />}
            />
            <Paragraph style={{ marginTop: 8 }}>
              平均每题用时: {formatTime(Math.round(examResult.timeSpent / examResult.totalQuestions))}
            </Paragraph>
          </Col>
        </Row>
        
        <Divider />
        
        <Row gutter={24}>
          <Col span={24}>
            <Title level={4}>错题分析</Title>
            {wrongStats.totalWrong > 0 ? (
              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Card size="small">
                    <Statistic 
                      title="单选题错题" 
                      value={wrongStats.typeStats[QuestionType.SINGLE_CHOICE]} 
                      suffix="道"
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small">
                    <Statistic 
                      title="多选题错题" 
                      value={wrongStats.typeStats[QuestionType.MULTIPLE_CHOICE]} 
                      suffix="道"
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small">
                    <Statistic 
                      title="判断题错题" 
                      value={wrongStats.typeStats[QuestionType.TRUE_FALSE]} 
                      suffix="道"
                    />
                  </Card>
                </Col>
              </Row>
            ) : (
              <Empty description="恭喜！您没有错题" />
            )}
          </Col>
        </Row>
        
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 16 }}>
          {isWrongQuestionPractice ? (
            <>
              <Button 
                type="primary" 
                icon={<RollbackOutlined />} 
                onClick={handleBackToWrongQuestions}
              >
                返回错题本
              </Button>
              <Button 
                icon={<HomeOutlined />} 
                onClick={handleBackHome}
              >
                返回首页
              </Button>
            </>
          ) : (
            <>
          <Button 
            type="primary" 
            icon={<RollbackOutlined />} 
            size="large"
            onClick={handleRetry}
          >
            重新答题
          </Button>
          <Button 
            icon={<HomeOutlined />} 
            size="large"
            onClick={handleBackHome}
          >
            返回首页
          </Button>
            </>
          )}
        </div>
      </Card>
      
      {/* 题目答案对照 */}
      <Title level={3}>题目详情</Title>
      {questions.map((question, index) => {
        const userAnswer = examResult.userAnswers[question._id];
        return (
          <Card key={question._id} style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <strong>第 {index + 1} 题</strong>
            </div>
        <QuestionCard 
          question={question}
              userAnswer={userAnswer}
          onAnswerChange={() => {}}
          showAnswer
        />
          </Card>
        );
      })}
    </div>
  );
};

export default ExamResult; 