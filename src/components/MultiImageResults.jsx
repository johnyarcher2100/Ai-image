import React from 'react';
import '../styles/MultiImageResults.css';

const MultiImageResults = ({ results }) => {
  // 格式化時間為可讀格式
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };
  // 下載單張圖片
  const handleDownloadImage = (imageUrl, imageName) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated_${imageName || 'image'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 下載所有圖片
  const handleDownloadAll = () => {
    results.forEach((result, index) => {
      setTimeout(() => {
        handleDownloadImage(result.generatedImage, result.originalName || `image_${index}`);
      }, index * 500); // 延遲下載，避免瀏覽器阻擋
    });
  };

  if (results.length === 0) {
    return (
      <div className="no-results">
        <p>尚未生成任何圖片</p>
      </div>
    );
  }

  return (
    <div className="multi-image-results">
      <div className="results-actions">
        <div className="results-count">
          共 {results.length} 張生成結果
        </div>
        <button
          className="download-all-button"
          onClick={handleDownloadAll}
          disabled={results.length === 0}
        >
          下載全部圖片
        </button>
      </div>

      <div className="results-grid">
        {results.map((result, index) => (
          <div key={result.id} className="result-item">
            <div className="result-number">#{index + 1}</div>
            <div className="image-comparison">
              <div className="original-image">
                <img src={result.originalImage} alt="原始圖片" />
                <div className="image-label">原始圖片</div>
              </div>
              <div className="arrow">→</div>
              <div className="generated-image">
                <img src={result.generatedImage} alt="生成圖片" />
                <div className="image-label">生成圖片</div>
                <button
                  className="download-button"
                  onClick={() => handleDownloadImage(result.generatedImage, result.originalName)}
                >
                  下載
                </button>
              </div>
            </div>
            <div className="result-info">
              <div className="image-name">{result.originalName}</div>
            <div className="theme-name">{result.theme && <span>風格: {result.theme}</span>}</div>
              {result.timestamp && (
                <div className="generation-time">
                  生成時間: <span>{formatTimestamp(result.timestamp)}</span>
                </div>
              )}
              <div className="prompt-used">
                <span>使用的提示詞:</span>
                <p>{result.prompt}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiImageResults;
