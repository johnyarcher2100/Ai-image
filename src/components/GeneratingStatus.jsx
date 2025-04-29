import { useState, useEffect } from 'react';
import '../styles/GeneratingStatus.css';

const GeneratingStatus = ({ prompt, modelName = 'GPT-4-All', onRetry = null }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [dots, setDots] = useState('');
  const [showRetry, setShowRetry] = useState(false);

  // 計算經過的時間
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => {
        const newTime = prev + 1;
        // 如果時間超過 60 秒 (1分鐘)，顯示重試按鈕
        if (newTime > 60 && !showRetry) {
          setShowRetry(true);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showRetry]);

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

  // 格式化時間為分鐘和秒
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  // 從提示詞中提取關鍵點
  const extractKeyPoints = (promptText) => {
    // 簡單的實現：按行分割，並過濾掉空行
    const lines = promptText.split('\n').filter(line => line.trim());
    
    // 只返回前3行作為關鍵點
    return lines.slice(0, 3).map(line => {
      // 如果行太長，截斷它
      return line.length > 50 ? line.substring(0, 50) + '...' : line;
    });
  };

  const keyPoints = extractKeyPoints(prompt);

  // 處理重試按鈕點擊
  const handleRetry = () => {
    if (onRetry) {
      onRetry(prompt);
    }
  };

  return (
    <div className="generating-status">
      <h2>生成的圖像</h2>
      
      <div className="generating-container">
        <div className="generating-animation">
          <div className="spinner"></div>
          <div className="generating-text">AI繪圖啟動中{dots}</div>
          <div className="model-info">使用模型: {modelName}</div>
        </div>
        
        <div className="prompt-summary">
          <h3>使用的提示詞</h3>
          <ul>
            {keyPoints.map((point, index) => (
              <li key={index}>- {point}</li>
            ))}
          </ul>
        </div>
        
        <div className="generating-info">
          <p className="time-info">* 【AI繪圖啟動 | 生成時間約1~2分鐘】 *</p>
          <p className="elapsed-time">已經過：{formatTime(elapsedTime)}</p>
          <p className="status-message">
            請稍候～ 系統生成中，完成後會直接顯示在這裡！
            <br />
            (溫馨提示：若未來想微調，隨時可以追加細節，例如「改成夜晚櫻花+提燈氛圍」 ✨)
          </p>
          
          {showRetry && onRetry && (
            <div className="retry-container">
              <p className="retry-message">生成似乎需要較長時間，您可以重試或繼續等待。</p>
              <button className="retry-button" onClick={handleRetry}>
                重新嘗試生成
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneratingStatus;
