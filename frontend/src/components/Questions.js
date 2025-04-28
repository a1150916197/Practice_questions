import React from 'react';

function Questions({ currentQuestion, userAnswer, onAnswer, slideDirection }) {
  if (!currentQuestion) return <div>没有问题</div>;

  const handleOptionClick = (optionId) => {
    onAnswer(optionId);
  };

  const getSlideClass = () => {
    if (!slideDirection) return '';
    return slideDirection === 'next' ? 'slide-left' : 'slide-right';
  };

  return (
    <div className={`question ${getSlideClass()}`}>
      <h2 className="question-text">问题 {currentQuestion.id}:</h2>
      <div className="question-content">
        <p>{currentQuestion.question}</p>
      </div>
      
      <div className="options-container">
        {currentQuestion.options.map((option) => (
          <div
            key={option.id}
            className={`option ${userAnswer === option.id ? 'selected' : ''}`}
            onClick={() => handleOptionClick(option.id)}
          >
            <span className="option-letter">{option.id.toUpperCase()}</span>
            <span className="option-text">{option.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Questions; 