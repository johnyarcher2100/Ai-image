import { useState } from 'react';
import '../styles/ImagePreview.css';

const ImagePreview = ({ imageUrl, prompt, onSaveCase, modelUsed = 'GPT-4-All' }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveAsCase, setSaveAsCase] = useState(false);
  const [saveAsPrompt, setSaveAsPrompt] = useState(false);
  const [caseName, setCaseName] = useState('');

  const handleSaveCase = () => {
    setIsSaving(true);

    // 這裡應該有保存案例的邏輯
    onSaveCase({
      imageUrl,
      prompt,
      name: caseName || '未命名案例',
      saveAsCase,
      saveAsPrompt,
      timestamp: new Date().toISOString(),
      modelUsed // 儲存使用的模型資訊
    });

    setIsSaving(false);
    setSaveAsCase(false);
    setSaveAsPrompt(false);
    setCaseName('');
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `阿布吉圖像_${new Date().toISOString().replace(/:/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!imageUrl) {
    return null;
  }

  return (
    <div className="image-preview">
      <h2>生成的圖像</h2>

      <div className="image-container">
        <img src={imageUrl} alt="Generated" />
        <div className="model-info">
          生成模型: {modelUsed}
        </div>
      </div>

      <div className="prompt-container">
        <h3>使用的提示詞</h3>
        <div className="prompt-text">
          {prompt.split('\n').map((line, index) => (
            line.trim() ? <p key={index}>- {line}</p> : null
          ))}
        </div>
      </div>

      <div className="actions">
        <button onClick={handleDownload} className="download-button">
          下載圖像
        </button>

        <div className="save-options">
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="save-as-case"
              checked={saveAsCase}
              onChange={() => setSaveAsCase(!saveAsCase)}
            />
            <label htmlFor="save-as-case">儲存為案例頁面供其他人參考</label>
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="save-as-prompt"
              checked={saveAsPrompt}
              onChange={() => setSaveAsPrompt(!saveAsPrompt)}
            />
            <label htmlFor="save-as-prompt">儲存prompt頁面供其他人快速調用</label>
          </div>

          {(saveAsCase || saveAsPrompt) && (
            <div className="case-name-input">
              <input
                type="text"
                placeholder="案例名稱"
                value={caseName}
                onChange={(e) => setCaseName(e.target.value)}
              />
              <button
                onClick={handleSaveCase}
                disabled={isSaving}
                className="save-button"
              >
                {isSaving ? '儲存中...' : '儲存'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImagePreview;
