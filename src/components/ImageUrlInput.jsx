import { useState } from 'react';
import '../styles/ImageUrlInput.css';

const ImageUrlInput = ({ onSubmit, onClose }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  // 檢查 URL 是否有效
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // 預覽圖片
  const handlePreview = async () => {
    if (!url.trim()) {
      setError('請輸入圖片 URL');
      return;
    }

    if (!isValidUrl(url)) {
      setError('請輸入有效的 URL');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 檢查 URL 是否可以訪問
      const response = await fetch(url, { method: 'HEAD' });
      
      if (!response.ok) {
        throw new Error('無法訪問此 URL');
      }
      
      // 檢查內容類型是否為圖片
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error('URL 不是有效的圖片');
      }
      
      setPreviewUrl(url);
    } catch (error) {
      console.error('Error previewing image:', error);
      setError('無法載入此 URL 的圖片，請確保它是公開可訪問的圖片 URL');
    } finally {
      setIsLoading(false);
    }
  };

  // 提交 URL
  const handleSubmit = () => {
    if (previewUrl) {
      onSubmit(previewUrl);
    } else {
      handlePreview();
    }
  };

  return (
    <div className="image-url-container">
      <div className="image-url-header">
        <h3>輸入圖片 URL</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="image-url-input-group">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="image-url-input"
        />
        <button 
          onClick={handlePreview} 
          disabled={isLoading}
          className="preview-button"
        >
          預覽
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {previewUrl && (
        <div className="image-preview-container">
          <img src={previewUrl} alt="Preview" className="image-preview" />
        </div>
      )}
      
      <div className="image-url-actions">
        <button onClick={onClose} className="cancel-button">
          取消
        </button>
        <button 
          onClick={handleSubmit} 
          disabled={isLoading || (!previewUrl && !url.trim())}
          className="submit-button"
        >
          {previewUrl ? '使用此圖片' : '確認'}
        </button>
      </div>
    </div>
  );
};

export default ImageUrlInput;
