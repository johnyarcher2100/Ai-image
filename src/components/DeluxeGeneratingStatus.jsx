import React, { useState, useEffect } from 'react';
import '../styles/DeluxeGeneratingStatus.css';

const DeluxeGeneratingStatus = ({ 
  totalItems, 
  currentItemIndex, 
  currentItemName, 
  onCancel = null,
  progressiveResults = [],
  modelName = 'GPT-4o-image-vip'
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [dots, setDots] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState(null);
  const [currentStage, setCurrentStage] = useState('準備中');

  // 計算總進度百分比
  const totalProgress = totalItems > 0 
    ? Math.round((currentItemIndex / totalItems) * 100) 
    : 0;

  // 計算當前項目的進度百分比 (模擬)
  const [currentItemProgress, setCurrentItemProgress] = useState(0);

  // 計算經過的時間
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => {
        const newTime = prev + 1;
        // 如果時間超過 60 秒 (1分鐘)，顯示取消按鈕
        if (newTime > 60 && !showCancel) {
          setShowCancel(true);
        }
        
        // 更新估計剩餘時間
        if (currentItemIndex > 0) {
          const averageTimePerItem = newTime / currentItemIndex;
          const itemsLeft = totalItems - currentItemIndex;
          const estimatedSecondsLeft = Math.round(averageTimePerItem * itemsLeft);
          setEstimatedTimeLeft(estimatedSecondsLeft);
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentItemIndex, totalItems, showCancel]);

  // 動畫效果
  useEffect(() => {
    const dotsTimer = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(dotsTimer);
  }, []);

  // 模擬當前項目的進度
  useEffect(() => {
    // 重置當前項目進度
    setCurrentItemProgress(0);
    
    // 更新生成階段
    if (currentItemIndex === 0) {
      setCurrentStage('準備中');
    } else if (currentItemIndex <= Math.floor(totalItems * 0.3)) {
      setCurrentStage('分析圖像');
    } else if (currentItemIndex <= Math.floor(totalItems * 0.6)) {
      setCurrentStage('應用風格');
    } else {
      setCurrentStage('最終處理');
    }

    // 模擬進度增加
    const interval = setInterval(() => {
      setCurrentItemProgress(prev => {
        // 如果已經到了下一個項目，保持在100%
        if (currentItemIndex > prev) return 100;
        
        // 否則逐漸增加到95%
        const increment = Math.random() * 5;
        return Math.min(prev + increment, 95);
      });
    }, 500);

    return () => clearInterval(interval);
  }, [currentItemIndex, totalItems]);

  // 格式化時間為分鐘和秒
  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '計算中...';
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  // 處理取消按鈕點擊
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="deluxe-generating-status">
      <h2>🎨 角色生成中</h2>
      
      <div className="status-container">
        <div className="status-header">
          <div className="status-animation">
            <div className="status-spinner"></div>
            <div className="status-text">{currentStage}{dots}</div>
          </div>
          
          <div className="model-info">
            <span className="model-badge">使用模型: {modelName}</span>
          </div>
        </div>
        
        <div className="progress-section">
          <div className="progress-info">
            <span className="progress-label">總進度: {totalProgress}%</span>
            <span className="progress-count">{currentItemIndex} / {totalItems}</span>
          </div>
          
          <div className="progress-bar total-progress">
            <div 
              className="progress-fill"
              style={{ width: `${totalProgress}%` }}
            ></div>
          </div>
          
          <div className="progress-info">
            <span className="progress-label">當前項目: {currentItemName}</span>
            <span className="progress-percentage">{Math.round(currentItemProgress)}%</span>
          </div>
          
          <div className="progress-bar current-progress">
            <div 
              className="progress-fill"
              style={{ width: `${currentItemProgress}%` }}
            ></div>
          </div>
        </div>
        
        <div className="time-section">
          <div className="time-info">
            <span className="time-label">已經過:</span>
            <span className="time-value">{formatTime(elapsedTime)}</span>
          </div>
          
          <div className="time-info">
            <span className="time-label">預計剩餘:</span>
            <span className="time-value">{formatTime(estimatedTimeLeft)}</span>
          </div>
        </div>
        
        {progressiveResults.length > 0 && (
          <div className="progressive-results">
            <h3>已完成的角色</h3>
            <div className="results-preview">
              {progressiveResults.map((result, index) => (
                <div key={index} className="result-preview-item">
                  <img src={result.imageUrl} alt={result.name} />
                  <div className="result-name">{result.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {showCancel && onCancel && (
          <div className="cancel-container">
            <p className="cancel-message">生成需要較長時間，您可以取消並調整設置。</p>
            <button className="cancel-button" onClick={handleCancel}>
              <span className="cancel-icon">⨯</span> 取消生成
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeluxeGeneratingStatus;
