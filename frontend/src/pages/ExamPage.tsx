import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Button, 
  message, 
  Steps, 
  Modal, 
  Row, 
  Col, 
  Card, 
  Progress,
  Drawer,
  Grid,
  Typography,
  Spin,
  Badge,
  Divider,
  Tooltip,
  Tag,
  ConfigProvider,
  theme
} from 'antd';
import { 
  LeftOutlined, 
  RightOutlined, 
  CheckOutlined,
  MenuOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionOutlined,
  BulbOutlined,
  SwapOutlined,
  SettingOutlined
} from '@ant-design/icons';
import QuestionCard, { Question, QuestionType } from '../components/QuestionCard';
import { questionAPI, questionBankAPI, wrongQuestionAPI } from '../services/api';

const { useBreakpoint } = Grid;
const { Title, Text } = Typography;
const { useToken } = theme;

interface UserAnswer {
  [questionId: string]: any;
}

// 导航状态类型
enum QuestionStatus {
  UNANSWERED = 'unanswered',
  CORRECT = 'correct',
  INCORRECT = 'incorrect',
  CURRENT = 'current'
}

const ExamPage: React.FC = () => {
  const { bankId } = useParams<{ bankId: string }>();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const { token } = useToken();
  
  const [questionBank, setQuestionBank] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer>({});
  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // 滑动动画相关状态
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const animationEndRef = useRef<boolean>(false);
  
  // 滑动相关状态
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchMoveX = useRef<number | null>(null);
  const isTouchMoving = useRef<boolean>(false);
  const lastAnimationFrame = useRef<number | null>(null);
  const MIN_SWIPE_DISTANCE = 50;
  
  // 获取用户信息
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  
  // 添加一个新的状态记录要渲染的下一题
  const [nextQuestionIndex, setNextQuestionIndex] = useState<number | null>(null);
  
  // 获取题库和题目数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (!bankId) {
          message.error('题库ID不存在');
          navigate('/question-banks');
          return;
        }
        
        // 检查是否是错题练习模式
        if (bankId === 'wrong-questions-practice') {
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
        const bankResponse = await questionBankAPI.getQuestionBankById(bankId);
        setQuestionBank(bankResponse.data);
        
        // 获取题目列表
        const questionsResponse = await questionAPI.getQuestionsByBankId(bankId);
        setQuestions(questionsResponse.data as Question[]);
        }
      } catch (error) {
        console.error('获取数据失败', error);
        message.error('获取题库数据失败');
        navigate('/question-banks');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [bankId, navigate]);
  
  // 单独设置计时器
  useEffect(() => {
    // 初始化计时器
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    
    // 组件卸载时清除计时器
    return () => clearInterval(timer);
  }, []);
  
  // 暗黑模式初始化
  useEffect(() => {
    // 检查用户偏好或本地存储
    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedMode = localStorage.getItem('darkMode');
    
    if (storedMode !== null) {
      setIsDarkMode(storedMode === 'true');
    } else {
      setIsDarkMode(prefersDarkMode);
    }
    
    // 添加事件监听，当本地存储变化时更新状态
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'darkMode') {
        setIsDarkMode(e.newValue === 'true');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // 处理用户回答
  const handleAnswerChange = (value: any) => {
    if (!questions[currentStep]) return;
    
    const question = questions[currentStep];
    setUserAnswers({
      ...userAnswers,
      [question._id]: value
    });
    
    // 多选题不自动提交，等待用户手动提交
    if (question.type !== QuestionType.MULTIPLE_CHOICE) {
      // 单选题和判断题仍然自动提交
    submitCurrentAnswer(question._id, value);
    }
  };
  
  // 每题单独提交到错题本
  const submitCurrentAnswer = async (questionId: string, userAnswer: any) => {
    try {
      const question = questions.find(q => q._id === questionId);
      if (!question) return;
      
      let isCorrect = false;
      
      // 判断答案是否正确
      if (question.type === QuestionType.SINGLE_CHOICE || question.type === QuestionType.TRUE_FALSE) {
        isCorrect = userAnswer === question.answer;
      } else if (question.type === QuestionType.MULTIPLE_CHOICE) {
        // 多选题需要完全一致（无遗漏、无多选）
        const correctAnswers = question.answer as string[];
        const userAnswerArray = userAnswer as string[] || [];
        
        isCorrect = 
          userAnswerArray.length === correctAnswers.length && 
          userAnswerArray.every(a => correctAnswers.includes(a));
      }
      
      // 如果答错，添加到错题本并显示正确答案
      if (!isCorrect && userAnswer !== undefined) {
        await wrongQuestionAPI.addWrongQuestion({
          questionId: questionId,
          wrongAnswer: userAnswer
        });
        
        // 显示错误提示，更明显的视觉反馈
        message.error({
          content: '答案错误！已自动加入错题本',
          style: {
            marginTop: '20px',
          },
          duration: 2
        });
        
        // 设置该题目为显示答案状态
        setUserAnswers(prev => ({
          ...prev,
          [`${questionId}_showAnswer`]: true
        }));
        
      } else if (isCorrect && userAnswer !== undefined) {
        // 显示正确提示，更明显的视觉反馈
        message.success({
          content: '答案正确！',
          style: {
            marginTop: '20px',
          },
          duration: 1
        });
        
        // 设置该题目为显示答案状态，禁用选项
        setUserAnswers(prev => ({
          ...prev,
          [`${questionId}_showAnswer`]: true
        }));
        
        // 如果回答正确，短暂延迟后自动跳转到下一题
        if (currentStep < questions.length - 1) {
          setTimeout(() => {
            setCurrentStep(currentStep + 1);
          }, 1000);
        }
      }
    } catch (error) {
      console.error('提交当前答案失败', error);
      // 不向用户显示错误，静默处理
    }
  };
  
  // 手动提交答案
  const handleSubmitAnswer = () => {
    if (!questions[currentStep]) return;
    
    const question = questions[currentStep];
    const userAnswer = userAnswers[question._id];
    
    if (userAnswer !== undefined) {
      submitCurrentAnswer(question._id, userAnswer);
    }
  };
  
  // 跳转到下一题（添加动画）
  const goToNextQuestion = () => {
    if (currentStep < questions.length - 1 && !isAnimating) {
      // 先设置下一题索引
      setNextQuestionIndex(currentStep + 1);
      setSlideDirection('left');
      setIsAnimating(true);
      
      // 等待动画完成后更新当前题目
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        // 清除下一题索引和动画状态
        setNextQuestionIndex(null);
        setIsAnimating(false);
      }, 300);
    }
  };
  
  // 跳转到上一题（添加动画）
  const goToPrevQuestion = () => {
    if (currentStep > 0 && !isAnimating) {
      // 先设置下一题索引
      setNextQuestionIndex(currentStep - 1);
      setSlideDirection('right');
      setIsAnimating(true);
      
      // 等待动画完成后更新当前题目
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        // 清除下一题索引和动画状态
        setNextQuestionIndex(null);
        setIsAnimating(false);
      }, 300);
    }
  };
  
  // 跳转到指定题目
  const goToQuestion = (index: number) => {
    if (index !== currentStep) {
    setCurrentStep(index);
    }
    setShowDrawer(false);
  };
  
  // 提交考试
  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // 存储考试结果
      sessionStorage.setItem('examResult', JSON.stringify({
        bankId,
        userAnswers,
        timeSpent,
        totalQuestions: questions.length,
        correctAnswers: calculateCorrectAnswers()
      }));
      
      // 跳转到结果页面
      navigate(`/exam-result/${bankId}`);
    } catch (error) {
      console.error('提交考试失败', error);
      message.error('提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };
  
  // 计算正确答案数量
  const calculateCorrectAnswers = () => {
    let correctCount = 0;
    
    for (const question of questions) {
      const userAnswer = userAnswers[question._id];
      if (userAnswer === undefined) continue;
      
      let isCorrect = false;
      
      // 判断答案是否正确
      if (question.type === QuestionType.SINGLE_CHOICE || question.type === QuestionType.TRUE_FALSE) {
        isCorrect = userAnswer === question.answer;
      } else if (question.type === QuestionType.MULTIPLE_CHOICE) {
        // 多选题需要完全一致（无遗漏、无多选）
        const correctAnswers = question.answer as string[];
        const userAnswerArray = userAnswer as string[] || [];
        
        isCorrect = 
          userAnswerArray.length === correctAnswers.length && 
          userAnswerArray.every(a => correctAnswers.includes(a));
      }
      
      if (isCorrect) {
        correctCount++;
      }
    }
    
    return correctCount;
  };
  
  // 格式化时间
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // 计算已答题数量
  const getAnsweredCount = () => {
    return Object.keys(userAnswers).filter(key => !key.includes('_showAnswer')).length;
  };

  // 获取问题状态
  const getQuestionStatus = (index: number): QuestionStatus => {
    if (index === currentStep) return QuestionStatus.CURRENT;
    
    const question = questions[index];
    if (!question) return QuestionStatus.UNANSWERED;
    
    const userAnswer = userAnswers[question._id];
    if (userAnswer === undefined) return QuestionStatus.UNANSWERED;
    
    // 判断答案是否正确
    let isCorrect = false;
    if (question.type === QuestionType.SINGLE_CHOICE || question.type === QuestionType.TRUE_FALSE) {
      isCorrect = userAnswer === question.answer;
    } else if (question.type === QuestionType.MULTIPLE_CHOICE) {
      const correctAnswers = question.answer as string[];
      const userAnswerArray = userAnswer as string[] || [];
      
      isCorrect = 
        userAnswerArray.length === correctAnswers.length && 
        userAnswerArray.every(a => correctAnswers.includes(a));
    }
    
    return isCorrect ? QuestionStatus.CORRECT : QuestionStatus.INCORRECT;
  };

  // 绘制环形进度指示器
  const renderCircleProgress = () => {
    const answeredCount = getAnsweredCount();
    const total = questions.length;
    const percent = total > 0 ? Math.round((answeredCount / total) * 100) : 0;
    
    const correctCount = questions.reduce((count, question, index) => {
      return getQuestionStatus(index) === QuestionStatus.CORRECT ? count + 1 : count;
    }, 0);
    
    const incorrectCount = answeredCount - correctCount;
    
    return (
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px'
      }}>
        <div style={{ position: 'relative' }}>
          <Progress 
            type="circle" 
            percent={percent} 
            width={screens.xs ? 80 : 120}
            format={() => (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: screens.xs ? 14 : 20, fontWeight: 'bold' }}>
                  {answeredCount}/{total}
                </div>
                <div style={{ fontSize: screens.xs ? 10 : 12, color: token.colorTextSecondary }}>
                  已完成
                </div>
              </div>
            )}
            strokeColor={{
              '0%': token.colorPrimary,
              '100%': token.colorPrimaryActive,
            }}
          />
          <div style={{ position: 'absolute', bottom: -4, right: -4 }}>
            <Tooltip title="当前正确率">
              <Tag color={correctCount > incorrectCount ? 'success' : 'error'} style={{
                borderRadius: '50%',
                width: screens.xs ? 24 : 32,
                height: screens.xs ? 24 : 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: screens.xs ? 10 : 12,
                fontWeight: 'bold'
              }}>
                {answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0}%
              </Tag>
            </Tooltip>
          </div>
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <Tag icon={<CheckCircleOutlined />} color="success">{correctCount}</Tag>
          <Tag icon={<CloseCircleOutlined />} color="error">{incorrectCount}</Tag>
          <Tag icon={<QuestionOutlined />} color="default">{total - answeredCount}</Tag>
        </div>
      </div>
    );
  };

  // 处理滑动事件
  const handleTouchStart = (e: React.TouchEvent) => {
    // 如果动画正在进行中，不处理触摸事件
    if (isAnimating) return;
    
    // 记录起始位置
    touchStartX.current = e.touches[0].clientX;
    isTouchMoving.current = false;
    
    // 如果有正在进行的动画帧，取消它
    if (lastAnimationFrame.current) {
      cancelAnimationFrame(lastAnimationFrame.current);
      lastAnimationFrame.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // 如果动画正在进行中或未开始触摸，不处理
    if (isAnimating || touchStartX.current === null) return;
    
    // 更新当前位置
    touchMoveX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
    isTouchMoving.current = true;
    
    // 使用requestAnimationFrame优化性能
    if (lastAnimationFrame.current === null) {
      lastAnimationFrame.current = requestAnimationFrame(updateTouchMove);
    }
  };

  // 优化的动画帧更新函数
  const updateTouchMove = () => {
    lastAnimationFrame.current = null;
    
    if (!isTouchMoving.current || touchStartX.current === null || touchMoveX.current === null) return;
    
    // 实时反馈滑动效果
    if (contentRef.current) {
      const diffX = touchMoveX.current - touchStartX.current;
      if (Math.abs(diffX) > 10) {
        // 计算有限制的滑动距离
        let limitedDiff = diffX;
        
        // 第一题不能向右滑，最后一题不能向左滑
        if ((currentStep === 0 && diffX > 0) || 
            (currentStep === questions.length - 1 && diffX < 0)) {
          // 设置更强的阻力感
          limitedDiff = diffX / 4;
        } else if (Math.abs(diffX) > 100) {
          // 限制最大滑动距离
          limitedDiff = Math.sign(diffX) * (100 + (Math.abs(diffX) - 100) * 0.2);
        }
        
        // 应用硬件加速的CSS变换
        contentRef.current.style.transform = `translate3d(${limitedDiff}px, 0, 0)`;
      }
    }
    
    // 如果仍在移动，继续请求下一帧
    if (isTouchMoving.current) {
      lastAnimationFrame.current = requestAnimationFrame(updateTouchMove);
    }
  };

  const handleTouchEnd = () => {
    // 如果没有开始触摸或正在动画中，则直接返回
    if (touchStartX.current === null || touchEndX.current === null || isAnimating) {
      resetTouchState();
      return;
    }
    
    // 停止动画帧更新
    if (lastAnimationFrame.current) {
      cancelAnimationFrame(lastAnimationFrame.current);
      lastAnimationFrame.current = null;
    }
    
    const distance = touchEndX.current - touchStartX.current;
    const absDist = Math.abs(distance);
    
    // 重置transform，添加平滑过渡
    if (contentRef.current) {
      // 只有当滑动距离足够大时才触发翻页
      if (absDist > MIN_SWIPE_DISTANCE) {
        if (distance > 0 && currentStep > 0) {
          // 右滑，前一题 - 直接调用翻页函数
          contentRef.current.style.transition = '';
          contentRef.current.style.transform = '';
          goToPrevQuestion();
        } else if (distance < 0 && currentStep < questions.length - 1) {
          // 左滑，下一题 - 直接调用翻页函数
          contentRef.current.style.transition = '';
          contentRef.current.style.transform = '';
          goToNextQuestion();
        } else {
          // 回弹到原位
          contentRef.current.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
          contentRef.current.style.transform = 'translate3d(0, 0, 0)';
          
          // 清除transition
          setTimeout(() => {
            if (contentRef.current) {
              contentRef.current.style.transition = '';
            }
          }, 300);
        }
      } else {
        // 距离太小，只需回弹
        contentRef.current.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        contentRef.current.style.transform = 'translate3d(0, 0, 0)';
        
        // 清除transition
        setTimeout(() => {
          if (contentRef.current) {
            contentRef.current.style.transition = '';
          }
        }, 300);
      }
    }
    
    // 重置触摸状态
    resetTouchState();
  };

  // 重置触摸状态的函数
  const resetTouchState = () => {
    touchStartX.current = null;
    touchEndX.current = null;
    touchMoveX.current = null;
    isTouchMoving.current = false;
    
    if (lastAnimationFrame.current) {
      cancelAnimationFrame(lastAnimationFrame.current);
      lastAnimationFrame.current = null;
    }
  };

  // 处理滑动取消
  const handleTouchCancel = () => {
    // 回弹到原位
    if (contentRef.current) {
      contentRef.current.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      contentRef.current.style.transform = 'translate3d(0, 0, 0)';
      
      // 清除transition属性
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.style.transition = '';
        }
      }, 300);
    }
    
    // 重置触摸状态
    resetTouchState();
  };
  
  // 添加CSS样式
  const getSlideAnimation = () => {
    if (!isAnimating) return {} as CSSProperties;
    
    return {
      animation: `slide-${slideDirection} 0.3s ease-out`,
      position: 'relative',
    } as CSSProperties;
  };
  
  if (loading && questions.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }
  
  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      background: isDarkMode ? '#141414' : '#f5f5f5'
    }}>
      {/* 添加全局动画样式 */}
      <style>
        {`
          @keyframes slide-out-to-left {
            0% { transform: translate3d(0, 0, 0); opacity: 1; }
            100% { transform: translate3d(-100%, 0, 0); opacity: 0; }
          }
          @keyframes slide-in-from-right {
            0% { transform: translate3d(100%, 0, 0); opacity: 0; }
            100% { transform: translate3d(0, 0, 0); opacity: 1; }
          }
          @keyframes slide-out-to-right {
            0% { transform: translate3d(0, 0, 0); opacity: 1; }
            100% { transform: translate3d(100%, 0, 0); opacity: 0; }
          }
          @keyframes slide-in-from-left {
            0% { transform: translate3d(-100%, 0, 0); opacity: 0; }
            100% { transform: translate3d(0, 0, 0); opacity: 1; }
          }
          .question-container {
            overflow: hidden;
            position: relative;
            -webkit-mask-image: -webkit-radial-gradient(white, black);
          }
          .question-content {
            will-change: transform;
            touch-action: pan-y;
            position: relative;
            height: 100%;
            width: 100%;
            transform: translate3d(0, 0, 0);
          }
          .current-animation {
            animation-fill-mode: forwards !important;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 2;
          }
          .next-animation {
            animation-fill-mode: forwards !important;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
          }
          .slide-out-left {
            animation: slide-out-to-left 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          .slide-in-right {
            animation: slide-in-from-right 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          .slide-out-right {
            animation: slide-out-to-right 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          .slide-in-left {
            animation: slide-in-from-left 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
        `}
      </style>
      
      {/* 头部导航栏 */}
      <div style={{ 
          background: isDarkMode ? '#1f1f1f' : '#fff', 
        padding: screens.xs ? '8px 12px' : '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        flexWrap: screens.xs ? 'wrap' : 'nowrap'
      }}>
        <div style={{ flex: 1, minWidth: screens.xs ? '100%' : 'auto', marginBottom: screens.xs ? 8 : 0 }}>
          <Title level={screens.xs ? 5 : 4} style={{ margin: 0 }}>
            {questionBank?.name || '题库练习'}
          </Title>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          flex: screens.xs ? 1 : 'none',
          justifyContent: screens.xs ? 'space-between' : 'flex-end',
          width: screens.xs ? '100%' : 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ClockCircleOutlined style={{ marginRight: 8 }} />
            <span>用时: {formatTime(timeSpent)}</span>
          </div>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <Button 
              type="primary" 
              onClick={() => setSubmitModalVisible(true)}
              size={screens.xs ? 'middle' : 'large'}
              style={{ borderRadius: 8 }}
            >
              结束答题
            </Button>
          </div>
        </div>
      </div>
        
      {/* 进度指示区 */}
      <div style={{ 
        background: isDarkMode ? '#1f1f1f' : '#fff',
        borderTop: `1px solid ${isDarkMode ? '#303030' : '#f0f0f0'}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: screens.xs ? 'wrap' : 'nowrap'
      }}>
        {/* 环形进度指示器 */}
        <div style={{ padding: screens.xs ? '8px' : '12px' }}>
          {renderCircleProgress()}
        </div>
          
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          flex: 1,
          padding: screens.xs ? '8px 12px' : '8px 24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text>
              进度: {getAnsweredCount()}/{questions.length} 题
            </Text>
            <Button 
              type="primary"
              shape="round"
              icon={<MenuOutlined />} 
              onClick={() => setShowDrawer(true)}
              size={screens.xs ? 'small' : 'middle'}
            >
              题目导航
            </Button>
          </div>
          <Progress 
            percent={Math.round((getAnsweredCount() / questions.length) * 100)} 
            showInfo={false} 
            status="active" 
            strokeColor={{ from: token.colorPrimary, to: token.colorPrimaryActive }}
            style={{ margin: screens.xs ? '4px 0 8px' : '8px 0 12px' }}
          />
        </div>
      </div>
      
      {/* 题目内容 */}
      <div 
        className="question-container"
        style={{ 
          flex: 1, 
          padding: 0,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* 滑动手势层 */}
        <div 
          ref={contentRef}
          className="question-content"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
        >
          {/* 当前题目 */}
          {!isAnimating ? (
            <div 
              style={{ 
                padding: screens.xs ? '16px 12px' : '24px',
                position: 'relative',
                zIndex: 1
              }}
            >
              {questions.length > 0 && currentStep < questions.length ? (
                <QuestionCard 
                  question={questions[currentStep]} 
                  userAnswer={userAnswers[questions[currentStep]._id]}
                  onAnswerChange={handleAnswerChange}
                  showAnswer={userAnswers[`${questions[currentStep]._id}_showAnswer`] === true}
                  onSubmit={questions[currentStep].type === QuestionType.MULTIPLE_CHOICE ? handleSubmitAnswer : undefined}
                />
              ) : (
                <Card>
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <p>没有题目或已完成所有题目</p>
                    <Button 
                      type="primary" 
                      onClick={() => setSubmitModalVisible(true)}
                      size="large"
                    >
                      结束答题
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            // 动画状态 - 显示两层
            <>
              {/* 当前题目 - 滑出 */}
              <div 
                className={`current-animation ${
                  slideDirection === 'left' ? 'slide-out-left' : 'slide-out-right'
                }`}
              >
                <div style={{ padding: screens.xs ? '16px 12px' : '24px' }}>
                  {questions.length > 0 && currentStep < questions.length && (
                    <QuestionCard 
                      question={questions[currentStep]} 
                      userAnswer={userAnswers[questions[currentStep]._id]}
                      onAnswerChange={() => {}}
                      showAnswer={userAnswers[`${questions[currentStep]._id}_showAnswer`] === true}
                    />
                  )}
                </div>
              </div>
              
              {/* 下一题 - 滑入 */}
              {nextQuestionIndex !== null && nextQuestionIndex >= 0 && nextQuestionIndex < questions.length && (
                <div 
                  className={`next-animation ${
                    slideDirection === 'left' ? 'slide-in-right' : 'slide-in-left'
                  }`}
                >
                  <div style={{ padding: screens.xs ? '16px 12px' : '24px' }}>
                    <QuestionCard 
                      question={questions[nextQuestionIndex]} 
                      userAnswer={userAnswers[questions[nextQuestionIndex]._id]}
                      onAnswerChange={() => {}}
                      showAnswer={userAnswers[`${questions[nextQuestionIndex]._id}_showAnswer`] === true}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* 底部导航 */}
      <div style={{ 
          background: isDarkMode ? '#1f1f1f' : '#fff', 
          padding: screens.xs ? '12px 16px' : '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
          borderTop: `1px solid ${isDarkMode ? '#303030' : '#f0f0f0'}`
      }}>
        <Button 
          icon={<LeftOutlined />}
          onClick={goToPrevQuestion}
          disabled={currentStep === 0}
            size={screens.xs ? 'middle' : 'large'}
            style={{ 
              borderRadius: 8, 
              minWidth: screens.xs ? 60 : 100,
              height: screens.xs ? 40 : 48
            }}
        >
          {!screens.xs && '上一题'}
        </Button>
        
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '4px'
          }}>
            <Badge 
              count={currentStep + 1} 
              style={{ 
                backgroundColor: token.colorPrimary,
                fontSize: 14,
                boxShadow: 'none'
              }}
              overflowCount={9999}
            />
            <Text strong style={{ marginLeft: 4 }}>/ {questions.length}</Text>
        </div>
        
          {currentStep === questions.length - 1 ? (
            <Button 
              type="primary"
              onClick={() => setSubmitModalVisible(true)}
              size={screens.xs ? 'middle' : 'large'}
              style={{ 
                borderRadius: 8, 
                minWidth: screens.xs ? 60 : 100,
                height: screens.xs ? 40 : 48
              }}
            >
              {!screens.xs && '完成答题'} <CheckOutlined />
            </Button>
          ) : (
        <Button 
          type="primary"
          onClick={goToNextQuestion}
              size={screens.xs ? 'middle' : 'large'}
              style={{ 
                borderRadius: 8, 
                minWidth: screens.xs ? 60 : 100,
                height: screens.xs ? 40 : 48
              }}
        >
          {!screens.xs && '下一题'} <RightOutlined />
        </Button>
          )}
      </div>
      
      {/* 题目导航抽屉 */}
      <Drawer 
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>题目导航</span>
              <div>
                <Tooltip title="正确">
                  <Badge count={questions.filter((_, index) => getQuestionStatus(index) === QuestionStatus.CORRECT).length} 
                    style={{ backgroundColor: '#52c41a', marginRight: 8 }} 
                    showZero
                  />
                </Tooltip>
                <Tooltip title="错误">
                  <Badge count={questions.filter((_, index) => getQuestionStatus(index) === QuestionStatus.INCORRECT).length} 
                    style={{ backgroundColor: '#f5222d', marginRight: 8 }} 
                    showZero  
                  />
                </Tooltip>
                <Tooltip title="未答">
                  <Badge count={questions.filter((_, index) => getQuestionStatus(index) === QuestionStatus.UNANSWERED).length} 
                    style={{ backgroundColor: '#faad14' }} 
                    showZero
                  />
                </Tooltip>
              </div>
            </div>
          }
        placement={screens.xs ? 'bottom' : 'right'}
        onClose={() => setShowDrawer(false)}
        open={showDrawer}
          height={screens.xs ? 500 : undefined}
          width={screens.xs ? undefined : 360}
          bodyStyle={{ padding: '16px 12px' }}
      >
        <Row gutter={[8, 8]}>
            {questions.map((question, index) => {
              const status = getQuestionStatus(index);
              let buttonType: "default" | "primary" | "dashed" | "link" | "text" | undefined = 'default';
              let color: string | undefined;
              let icon = null;
              
              switch (status) {
                case QuestionStatus.CORRECT:
                  color = '#52c41a';
                  icon = <CheckCircleOutlined />;
                  break;
                case QuestionStatus.INCORRECT:
                  color = '#f5222d';
                  icon = <CloseCircleOutlined />;
                  break;
                case QuestionStatus.CURRENT:
                  buttonType = 'primary';
                  break;
                default:
                  buttonType = 'default';
                  break;
              }
              
              return (
            <Col span={screens.xs ? 6 : 8} key={question._id}>
              <Button 
                    type={buttonType}
                    shape="round"
                onClick={() => goToQuestion(index)}
                style={{
                  width: '100%',
                      height: screens.xs ? 40 : 48,
                      border: status !== QuestionStatus.UNANSWERED && status !== QuestionStatus.CURRENT 
                        ? `1px solid ${color}` 
                        : undefined,
                      color: status !== QuestionStatus.CURRENT ? color : undefined
                    }}
                    icon={icon}
                    size={screens.xs ? 'middle' : 'large'}
                  >
                    {icon ? '' : index + 1}
              </Button>
            </Col>
              );
            })}
        </Row>
          
          <Divider />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <Button 
              type="default" 
              onClick={() => goToQuestion(0)}
              icon={<LeftOutlined />}
            >
              第一题
            </Button>
            
            <Button 
              type="primary" 
              onClick={() => goToQuestion(questions.length - 1)}
              icon={<RightOutlined />}
            >
              最后一题
            </Button>
          </div>
      </Drawer>
      
      {/* 提交确认弹窗 */}
      <Modal
        title="确认提交"
        open={submitModalVisible}
        onOk={handleSubmit}
        onCancel={() => setSubmitModalVisible(false)}
        okText="确认提交"
        cancelText="继续答题"
        centered
      >
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <Progress 
              type="circle" 
              percent={Math.round((getAnsweredCount() / questions.length) * 100)} 
              width={80}
            />
            <div style={{ margin: '16px 0' }}>
              <p style={{ fontSize: 16, marginBottom: 8 }}>您已完成 {getAnsweredCount()} / {questions.length} 题</p>
              <p style={{ fontSize: 16, marginBottom: 8 }}>用时: {formatTime(timeSpent)}</p>
              <Tag color="warning" style={{ margin: '8px 0' }}>
                {questions.length - getAnsweredCount()} 题未完成
              </Tag>
            </div>
            <p style={{ fontSize: 16, fontWeight: 'bold' }}>确定要结束答题并查看结果吗？</p>
          </div>
      </Modal>
    </div>
    </ConfigProvider>
  );
};

export default ExamPage; 