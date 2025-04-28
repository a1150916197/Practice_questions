import React from 'react';

function ProgressBar({ current, total }) {
  const progressPercent = (current / total) * 100;

  return (
    <div className="progress-container">
      <div className="progress-info">
        <span>{current} / {total}</span>
      </div>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
    </div>
  );
}

export default ProgressBar; 