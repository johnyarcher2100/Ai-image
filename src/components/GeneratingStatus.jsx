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
      <h2>🎨 圖像生成中</h2>

      <div className="generating-container">
        <div className="generating-animation">
          <div className="spinner"></div>
          <div className="generating-text">AI繪圖啟動中{dots}</div>
          <div className="model-info">使用模型: {modelName}</div>
        </div>

        <div className="progress-bar-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(elapsedTime / 90 * 100, 100)}%`,
                backgroundColor: elapsedTime > 60 ? '#ff9800' : '#4a90e2'
              }}
            ></div>
          </div>
          <p className="elapsed-time">已經過：{formatTime(elapsedTime)}</p>
        </div>

        <div className="prompt-summary">
          <h3>使用的提示詞</h3>
          <ul>
            {keyPoints.map((point, index) => (
              <li key={index}>- {point}</li>
            ))}
          </ul>
          <div className="prompt-badge">完整提示詞將在圖像生成後顯示</div>
        </div>

        <div className="generating-info">
          <p className="time-info">* 【AI繪圖啟動 | 生成時間約1~2分鐘】 *</p>
          <div className="status-message">
            <p>請稍候～ 系統生成中，完成後圖像將直接顯示在這裡！</p>
            <p className="tips">
              <span className="tips-icon">💡</span> 溫馨提示：生成完成後，您可以：
              <ul>
                <li>查看高清原圖</li>
                <li>下載圖像</li>
                <li>儲存作品到案例庫</li>
              </ul>
            </p>
          </div>

          {showRetry && onRetry && (
            <div className="retry-container">
              <p className="retry-message">生成似乎需要較長時間，您可以重試或繼續等待。</p>
              <button className="retry-button" onClick={handleRetry}>
                <span className="retry-icon">🔄</span> 重新嘗試生成
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneratingStatus;
