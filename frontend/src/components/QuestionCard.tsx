import React, { useRef, useContext } from 'react';
import { Card, Radio, Checkbox, Typography, Space, Grid, Button, Alert, Progress, ConfigProvider, theme } from 'antd';

const { Title, Paragraph, Text } = Typography;
const { Group: RadioGroup } = Radio;
const { Group: CheckboxGroup } = Checkbox;
const { useBreakpoint } = Grid;
const { useToken } = theme;

export enum QuestionType {
  SINGLE_CHOICE = 'single',
  MULTIPLE_CHOICE = 'multiple',
  TRUE_FALSE = 'tf'
}

interface Option {
  label: string;
  content: string;
}

export interface Question {
  _id: string;
  type: QuestionType;
  content: string;
  options?: Option[];
  answer: boolean | string | string[];
  explanation: string;
  questionBank: string;
}

interface QuestionCardProps {
  question: Question;
  userAnswer: any;
  onAnswerChange: (value: any) => void;
  showAnswer?: boolean;
  onSubmit?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  currentIndex?: number;
  totalQuestions?: number;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  userAnswer, 
  onAnswerChange, 
  showAnswer = false,
  onSubmit,
  onNext,
  onPrev,
  currentIndex,
  totalQuestions
}) => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const { token } = useToken();
  
  // 获取当前是否为暗色模式
  const isDarkMode = token.colorBgContainer === '#141414' || token.colorBgContainer === '#1f1f1f';
  
  // 滑动相关状态
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const MIN_SWIPE_DISTANCE = 50;
  
  // 处理滑动事件
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchEndX.current - touchStartX.current;
    
    if (Math.abs(distance) > MIN_SWIPE_DISTANCE) {
      if (distance > 0) {
        // 右滑，前一题
        onPrev && onPrev();
      } else {
        // 左滑，下一题
        onNext && onNext();
      }
    }
    
    // 重置
    touchStartX.current = null;
    touchEndX.current = null;
  };
  
  // 获取用户是否已回答此题
  const hasAnswered = userAnswer !== undefined;
  
  // 判断用户答案是否正确
  const isCorrect = (() => {
    if (!hasAnswered) return false;
    
    if (question.type === QuestionType.SINGLE_CHOICE || question.type === QuestionType.TRUE_FALSE) {
      return userAnswer === question.answer;
    } else if (question.type === QuestionType.MULTIPLE_CHOICE) {
      const correctAnswers = question.answer as string[];
      const userAnswerArray = userAnswer as string[] || [];
      
      return userAnswerArray.length === correctAnswers.length && 
             userAnswerArray.every(a => correctAnswers.includes(a));
    }
    
    return false;
  })();
  
  const renderQuestionType = () => {
    switch (question.type) {
      case QuestionType.SINGLE_CHOICE:
        return '单选题';
      case QuestionType.MULTIPLE_CHOICE:
        return '多选题';
      case QuestionType.TRUE_FALSE:
        return '判断题';
      default:
        return '';
    }
  };
  
  const renderOptions = () => {
    switch (question.type) {
      case QuestionType.SINGLE_CHOICE:
        return (
          <RadioGroup 
            value={userAnswer} 
            onChange={(e) => onAnswerChange(e.target.value)}
            disabled={showAnswer}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {question.options?.map((option) => (
                <Radio 
                  key={option.label} 
                  value={option.label}
                  style={{ 
                    padding: isMobile ? '12px 12px' : '12px 16px',
                    width: '100%',
                    marginRight: 0,
                    borderRadius: '8px',
                    background: getOptionBackground(option.label),
                    marginBottom: 8,
                    border: `1px solid ${isDarkMode ? '#303030' : '#f0f0f0'}`,
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex' }}>
                    <span style={{ 
                      fontWeight: 'bold', 
                      marginRight: 8, 
                      flexShrink: 0,
                      color: option.label === userAnswer ? '#1890ff' : 'inherit' 
                    }}>
                      {option.label}.
                    </span>
                    <span>{option.content}</span>
                  </div>
                </Radio>
              ))}
            </Space>
          </RadioGroup>
        );
        
      case QuestionType.MULTIPLE_CHOICE:
        return (
          <CheckboxGroup 
            value={userAnswer} 
            onChange={onAnswerChange}
            disabled={showAnswer}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {question.options?.map((option) => (
                <Checkbox 
                  key={option.label} 
                  value={option.label}
                  style={{ 
                    padding: isMobile ? '12px 12px' : '12px 16px',
                    width: '100%',
                    borderRadius: '8px',
                    background: getOptionBackground(option.label),
                    marginBottom: 8,
                    border: `1px solid ${isDarkMode ? '#303030' : '#f0f0f0'}`
                  }}
                >
                  <div style={{ display: 'flex' }}>
                    <span style={{ 
                      fontWeight: 'bold', 
                      marginRight: 8, 
                      flexShrink: 0,
                      color: userAnswer?.includes(option.label) ? '#1890ff' : 'inherit'
                    }}>
                      {option.label}.
                    </span>
                    <span>{option.content}</span>
                  </div>
                </Checkbox>
              ))}
            </Space>
          </CheckboxGroup>
        );
        
      case QuestionType.TRUE_FALSE:
        return (
          <RadioGroup 
            value={userAnswer} 
            onChange={(e) => onAnswerChange(e.target.value)}
            disabled={showAnswer}
            buttonStyle="solid"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio.Button 
                value={true}
                style={{ 
                  padding: '12px 0',
                  width: '100%',
                  textAlign: 'center',
                  marginBottom: 8,
                  borderRadius: '8px',
                  background: getTrueFalseBackground(true),
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.85)' : 'inherit',
                  borderColor: isDarkMode ? '#303030' : '#d9d9d9'
                }}
              >
                <span style={{ fontWeight: 'bold' }}>正确</span>
              </Radio.Button>
              <Radio.Button 
                value={false}
                style={{ 
                  padding: '12px 0',
                  width: '100%',
                  textAlign: 'center',
                  borderRadius: '8px',
                  background: getTrueFalseBackground(false),
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.85)' : 'inherit',
                  borderColor: isDarkMode ? '#303030' : '#d9d9d9'
                }}
              >
                <span style={{ fontWeight: 'bold' }}>错误</span>
              </Radio.Button>
            </Space>
          </RadioGroup>
        );
        
      default:
        return null;
    }
  };
  
  // 辅助函数: 获取选项背景色
  const getOptionBackground = (optionLabel: string) => {
    if (!showAnswer) {
      // 高亮用户选择的选项
      if (question.type === QuestionType.SINGLE_CHOICE) {
        return optionLabel === userAnswer 
          ? isDarkMode ? '#111b26' : '#e6f7ff' 
          : isDarkMode ? '#1f1f1f' : '#fff';
      }
      
      if (question.type === QuestionType.MULTIPLE_CHOICE) {
        return (userAnswer as string[])?.includes(optionLabel) 
          ? isDarkMode ? '#111b26' : '#e6f7ff' 
          : isDarkMode ? '#1f1f1f' : '#fff';
      }
      
      return isDarkMode ? '#1f1f1f' : '#fff';
    }
    
    // 显示答案时的背景色
    if (question.type === QuestionType.SINGLE_CHOICE) {
      // 正确答案
      if (optionLabel === question.answer) {
        return isDarkMode ? '#162312' : '#f6ffed'; // 深色/浅色绿色背景
      }
      // 用户的错误答案
      if (optionLabel === userAnswer && optionLabel !== question.answer) {
        return isDarkMode ? '#2a1215' : '#fff2f0'; // 深色/浅色红色背景
      }
    }
    
    // 多选题
    if (question.type === QuestionType.MULTIPLE_CHOICE) {
      const correctAnswers = question.answer as string[];
      const userAnswers = userAnswer as string[];
      
      // 正确答案
      if (correctAnswers.includes(optionLabel)) {
        return isDarkMode ? '#162312' : '#f6ffed'; // 深色/浅色绿色背景
      }
      
      // 用户选择的错误答案
      if (userAnswers?.includes(optionLabel) && !correctAnswers.includes(optionLabel)) {
        return isDarkMode ? '#2a1215' : '#fff2f0'; // 深色/浅色红色背景
      }
    }
    
    return isDarkMode ? '#1f1f1f' : '#fff';
  };
  
  // 辅助函数: 获取判断题选项背景色
  const getTrueFalseBackground = (isTrue: boolean) => {
    if (!showAnswer) {
      return userAnswer === isTrue
        ? isDarkMode ? '#111b26' : '#e6f7ff'
        : isDarkMode ? '#1f1f1f' : '#fff';
    }
    
    // 显示答案时
    if (question.answer === isTrue) {
      return isDarkMode ? '#162312' : '#f6ffed'; // 正确答案背景
    }
    
    if (userAnswer === isTrue && userAnswer !== question.answer) {
      return isDarkMode ? '#2a1215' : '#fff2f0'; // 错误答案背景
    }
    
    return isDarkMode ? '#1f1f1f' : '#fff';
  };
  
  const renderCorrectAnswer = () => {
    switch (question.type) {
      case QuestionType.SINGLE_CHOICE:
        return <div>选项 {question.answer}</div>;
      case QuestionType.MULTIPLE_CHOICE:
        return <div>选项 {(question.answer as string[]).join(', ')}</div>;
      case QuestionType.TRUE_FALSE:
        return <div>{question.answer ? '正确' : '错误'}</div>;
      default:
        return null;
    }
  };
  
  // 自定义标签组件
  const CustomTag = ({ color, children }: { color: string, children: React.ReactNode }) => (
    <span style={{
      background: color === 'blue' ? (isDarkMode ? '#111b26' : '#e6f7ff') : color,
      color: '#1890ff',
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 12,
      fontWeight: 'bold'
    }}>
      {children}
    </span>
  );
  
  return (
    <Card 
      style={{ 
        width: '100%', 
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: isDarkMode ? '0 4px 12px rgba(0,0,0,0.12)' : '0 4px 12px rgba(0,0,0,0.05)',
        background: token.colorBgContainer
      }}
      bordered={false}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {currentIndex !== undefined && totalQuestions && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text type="secondary">题目 {currentIndex+1}/{totalQuestions}</Text>
            <CustomTag color="blue">{renderQuestionType()}</CustomTag>
          </div>
          <Progress 
            percent={((currentIndex+1) / totalQuestions) * 100} 
            showInfo={false} 
            strokeColor="#1890ff" 
            size="small"
          />
        </div>
      )}
      
      <div style={{ marginBottom: 16 }}>
        <Title level={isMobile ? 5 : 4} style={{ 
          marginBottom: 16,
          fontWeight: 500,
          lineHeight: 1.4 
        }}>
          {question.content}
        </Title>
      </div>
      
      {renderOptions()}
      
      {/* 显示答案解释 */}
      {showAnswer && (
        <div style={{ marginTop: 24 }}>
          <Alert
            message={isCorrect ? "回答正确" : "回答错误"}
            description={
              <div>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>正确答案：</Text>{renderCorrectAnswer()}
                </div>
                {question.explanation && (
                  <div>
                    <Text strong>解析：</Text>{question.explanation}
                  </div>
                )}
              </div>
            }
            type={isCorrect ? "success" : "error"}
            showIcon
            style={{ borderRadius: 8 }}
          />
        </div>
      )}
        
      {/* 滑动提示 - 仅在移动设备上显示 */}
      {isMobile && onNext && onPrev && (
        <div style={{ 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '12px',
          color: '#8c8c8c',
          fontSize: 12,
          marginTop: 16,
          background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f9f9f9',
          borderRadius: 8
        }}>
          <span style={{ marginRight: 8, display: 'inline-flex' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 13L12 18L17 13" stroke="#8c8c8c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(270 12 12)"/>
            </svg>
          </span>
          左右滑动切换题目
        </div>
      )}
      
      {/* 提交按钮 */}
      {onSubmit && !showAnswer && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Button 
            type="primary" 
            onClick={onSubmit} 
            size={isMobile ? "large" : "middle"}
            style={{ borderRadius: 8, width: isMobile ? '100%' : 'auto' }}
          >
            提交答案
          </Button>
        </div>
      )}
    </Card>
  );
};

export default QuestionCard; 