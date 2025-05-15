import React, { useState, useRef } from 'react';
import '../styles/DeluxeCharacterGenerator.css';
import characterThemes, { getThemeById } from '../data/characterThemes';
import { generateImageWithOpenAI, generatePromptWithDeepseek } from '../services/api';
import WebcamCapture from './WebcamCapture';
import ImageUrlInput from './ImageUrlInput';
import ImageUploadMenu from './ImageUploadMenu';
import DeluxeGeneratingStatus from './DeluxeGeneratingStatus';

const DeluxeCharacterGenerator = () => {
  // 上傳照片
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadMethod, setUploadMethod] = useState('file'); // 'file', 'camera', 'url'
  const fileInputRef = useRef(null);

  // 主題選擇
  const [selectedThemeId, setSelectedThemeId] = useState('');

  // 生成設置
  const [imageCount, setImageCount] = useState(1);

  // 生成狀態
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResults, setGeneratedResults] = useState([]);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [currentPromptName, setCurrentPromptName] = useState('');
  const [allPrompts, setAllPrompts] = useState([]);
  const [progressiveResults, setProgressiveResults] = useState([]);

  // 處理照片上傳
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 處理拍照上傳
  const handleCaptureImage = (imageSrc) => {
    setUploadedImage(imageSrc);
    setUploadMethod('file'); // 拍照完成後切換回文件上傳視圖
  };

  // 處理URL上傳
  const handleUrlImage = (url) => {
    setUploadedImage(url);
    setUploadMethod('file'); // URL上傳完成後切換回文件上傳視圖
  };

  // 處理主題選擇
  const handleThemeSelect = (themeId) => {
    setSelectedThemeId(themeId);
  };

  // 處理下載圖片
  const handleDownloadImage = (imageUrl, name) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `character-${name}-${new Date().getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 處理生成角色
  const handleGenerateCharacter = async () => {
    if (!uploadedImage || !selectedThemeId) {
      alert('請上傳照片並選擇一個角色主題');
      return;
    }

    // 重置生成狀態
    setIsGenerating(true);
    setGeneratedResults([]);
    setProgressiveResults([]);
    setCurrentPromptIndex(0);
    setCurrentPromptName('');

    try {
      // 獲取選中的主題
      const selectedTheme = getThemeById(selectedThemeId);

      // 使用 deepseek-chat 生成詳細的提示詞
      const basePrompt = selectedTheme.promptTemplate;
      const backgroundPrompt = selectedTheme.backgroundPrompt;

      // 組合提示詞，為每個圖像生成不同的變體
      const promptsToGenerate = [];

      for (let i = 0; i < imageCount; i++) {
        // 使用 deepseek 生成變體提示詞
        let variantPrompt;

        if (i === 0) {
          // 第一個使用基本提示詞
          variantPrompt = basePrompt;
        } else {
          // 其他生成變體
          try {
            variantPrompt = await generatePromptWithDeepseek(
              basePrompt,
              backgroundPrompt,
              selectedTheme.name
            );
          } catch (error) {
            console.error('生成變體提示詞時出錯:', error);
            variantPrompt = basePrompt; // 如果失敗，使用基本提示詞
          }
        }

        promptsToGenerate.push({
          id: `variant-${i}`,
          name: i === 0 ? selectedTheme.name : `${selectedTheme.name} 變體 ${i}`,
          prompt: variantPrompt,
          theme: selectedTheme.name
        });
      }

      // 保存所有提示詞以供狀態顯示使用
      setAllPrompts(promptsToGenerate);

      // 為每個 prompt 逐個生成圖像
      const results = [];

      for (let i = 0; i < promptsToGenerate.length; i++) {
        const promptData = promptsToGenerate[i];

        // 更新當前處理的提示詞索引和名稱
        setCurrentPromptIndex(i);
        setCurrentPromptName(promptData.name);

        try {
          // 調用 API 生成圖像
          const imageUrl = await generateImageWithOpenAI(
            promptData.prompt,
            uploadedImage
          );

          // 創建結果對象
          const resultItem = {
            id: promptData.id,
            name: promptData.name,
            prompt: promptData.prompt,
            imageUrl: imageUrl,
            theme: promptData.theme,
            timestamp: new Date().toISOString()
          };

          // 添加到結果中
          results.push(resultItem);

          // 更新進度顯示的結果
          setProgressiveResults(prev => [...prev, resultItem]);
        } catch (error) {
          console.error(`生成 ${promptData.name} 的圖像時出錯:`, error);
        }
      }

      // 所有圖像生成完成後，更新最終結果
      setGeneratedResults(results);
    } catch (error) {
      console.error('生成角色時出錯:', error);
      alert('生成角色時出錯: ' + (error.message || '未知錯誤'));
    } finally {
      setIsGenerating(false);
      setCurrentPromptIndex(0);
      setCurrentPromptName('');
    }
  };

  // 處理取消生成
  const handleCancelGeneration = () => {
    setIsGenerating(false);
    // 如果有部分結果，則顯示這些結果
    if (progressiveResults.length > 0) {
      setGeneratedResults(progressiveResults);
    }
  };

  return (
    <div className="deluxe-character-generator">
      <div className="generator-sections">
        <div className="generator-section">
          <div className="deluxe-section">
            <h2 className="deluxe-section-title">上傳照片</h2>
            <div className="upload-methods">
              <div className="upload-method-tabs">
                <button
                  className={`upload-method-tab ${uploadMethod === 'file' ? 'active' : ''}`}
                  onClick={() => setUploadMethod('file')}
                >
                  上傳檔案
                </button>
                <button
                  className={`upload-method-tab ${uploadMethod === 'camera' ? 'active' : ''}`}
                  onClick={() => setUploadMethod('camera')}
                >
                  拍照上傳
                </button>
                <button
                  className={`upload-method-tab ${uploadMethod === 'url' ? 'active' : ''}`}
                  onClick={() => setUploadMethod('url')}
                >
                  URL上傳
                </button>
              </div>

              <div className="upload-method-content">
                {uploadMethod === 'file' && (
                  <div className="file-upload-container">
                    {!uploadedImage ? (
                      <div
                        className="upload-area"
                        onClick={() => fileInputRef.current.click()}
                      >
                        <i className="upload-icon fas fa-cloud-upload-alt"></i>
                        <p className="upload-text">點擊上傳照片<br/>或拖放檔案至此</p>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          accept="image/*"
                          style={{ display: 'none' }}
                        />
                      </div>
                    ) : (
                      <div className="uploaded-image-container">
                        <img
                          src={uploadedImage}
                          alt="已上傳的照片"
                          className="uploaded-image"
                        />
                        <button
                          className="remove-image-button"
                          onClick={() => setUploadedImage(null)}
                        >
                          移除照片
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {uploadMethod === 'camera' && (
                  <WebcamCapture onCapture={handleCaptureImage} />
                )}

                {uploadMethod === 'url' && (
                  <ImageUrlInput onSubmit={handleUrlImage} />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="generator-section">
          <div className="deluxe-section">
            <h2 className="deluxe-section-title">選擇角色主題</h2>
            <div className="theme-grid">
              {characterThemes.map(theme => (
                <div
                  key={theme.id}
                  className={`theme-item ${selectedThemeId === theme.id ? 'selected' : ''}`}
                  onClick={() => handleThemeSelect(theme.id)}
                >
                  <div className="theme-info">
                    <h3 className="theme-name">{theme.name}</h3>
                    <p className="theme-description">{theme.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="deluxe-section">
            <h2 className="deluxe-section-title">生成設置</h2>
            <div className="generation-options">
              <div className="option-group">
                <label htmlFor="image-count">生成數量:</label>
                <select
                  id="image-count"
                  value={imageCount}
                  onChange={(e) => setImageCount(parseInt(e.target.value))}
                >
                  {[1, 2, 3, 4].map(num => (
                    <option key={num} value={num}>{num} 張</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              className="generate-button"
              onClick={handleGenerateCharacter}
              disabled={!uploadedImage || !selectedThemeId || isGenerating}
            >
              生成角色
            </button>
          </div>
        </div>
      </div>

      {/* 生成中狀態 */}
      {isGenerating && (
        <DeluxeGeneratingStatus
          totalItems={allPrompts.length}
          currentItemIndex={currentPromptIndex}
          currentItemName={currentPromptName}
          onCancel={handleCancelGeneration}
          progressiveResults={progressiveResults}
          modelName="GPT-4o-image-vip"
        />
      )}

      {/* 生成結果 */}
      {generatedResults.length > 0 && !isGenerating && (
        <div className="deluxe-section results-section">
          <h2 className="deluxe-section-title">生成結果</h2>
          <div className="results-grid">
            {generatedResults.map(result => (
              <div key={result.id} className="result-item">
                <img
                  src={result.imageUrl}
                  alt={result.name}
                  className="result-image"
                />
                <div className="result-info">
                  <h3 className="result-name">{result.name}</h3>
                  <div className="result-prompt">{result.prompt}</div>
                </div>
                <div className="result-actions">
                  <button
                    className="download-button"
                    onClick={() => handleDownloadImage(result.imageUrl, result.name)}
                  >
                    下載圖片
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeluxeCharacterGenerator;
