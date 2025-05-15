import React, { useState, useRef } from 'react';
import '../styles/StickerGenerator.css';
import { stickerTemplates } from '../data/stickerTemplates';
import { generateStickerImage, generateMultipleStickers } from '../services/api';
import StyleSelector from './StyleSelector';
import PromptSuggestions from './PromptSuggestions';

const StickerGenerator = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [stickerSize, setStickerSize] = useState('370x320'); // LINE 貼圖標準尺寸
  const [stickerFormat, setStickerFormat] = useState('png'); // PNG 格式，支持透明背景
  const [promptText, setPromptText] = useState(''); // 用戶自定義提示文字
  const [selectedStyle, setSelectedStyle] = useState(null); // 選擇的貼圖風格
  const [realismLevel, setRealismLevel] = useState(50); // 真實感百分比，預設 50%
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStickers, setGeneratedStickers] = useState([]);
  const [showGuidelines, setShowGuidelines] = useState(false); // 控制準則區塊的顯示狀態
  const fileInputRef = useRef(null);

  // 處理風格選擇
  const handleStyleSelect = (style) => {
    setSelectedStyle(style);
    if (style && style.promptHint) {
      // 如果用戶已經輸入了提示文字，則在後面添加風格提示
      if (promptText.trim()) {
        setPromptText(prev => `${prev}\n\n風格: ${style.promptHint}`);
      } else {
        // 否則直接設置風格提示
        setPromptText(style.promptHint);
      }
    }
  };

  // 處理文字參數建議選擇
  const handlePromptSuggestionSelect = (suggestion) => {
    // 如果用戶已經輸入了提示文字，則在後面添加建議
    if (promptText.trim()) {
      setPromptText(prev => `${prev}\n\n${suggestion}`);
    } else {
      // 否則直接設置建議
      setPromptText(suggestion);
    }
  };

  // 處理文件上傳
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target.result);
        setImageUrl('');
      };
      reader.readAsDataURL(file);
    }
  };

  // 處理網址輸入
  const handleUrlChange = (e) => {
    setImageUrl(e.target.value);
  };

  // 處理網址圖片載入
  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (imageUrl.trim()) {
      setUploadedImage(imageUrl);
    }
  };

  // 處理模板選擇
  const handleTemplateSelect = (templateId) => {
    setSelectedTemplates(prev => {
      if (prev.includes(templateId)) {
        return prev.filter(id => id !== templateId);
      } else {
        return [...prev, templateId];
      }
    });
  };

  // 處理全選
  const handleSelectAll = () => {
    if (selectedTemplates.length === stickerTemplates.length) {
      setSelectedTemplates([]);
    } else {
      setSelectedTemplates(stickerTemplates.map(template => template.id));
    }
  };

  // 處理生成表情貼圖
  const handleGenerateStickers = async () => {
    if (!uploadedImage || selectedTemplates.length === 0) {
      alert('請上傳圖片並選擇至少一個表情模板');
      return;
    }

    setIsGenerating(true);
    setGeneratedStickers([]); // 清空之前生成的貼圖

    try {
      // 調用API生成表情貼圖
      const result = await generateMultipleStickers(
        uploadedImage,
        selectedTemplates,
        stickerSize,
        stickerFormat,
        promptText, // 傳遞用戶提示文字
        selectedStyle, // 傳遞選擇的風格信息
        realismLevel // 傳遞真實感百分比
      );

      // 處理生成結果
      if (result.stickers.length > 0) {
        setGeneratedStickers(result.stickers);

        // 如果有失敗的模板，顯示提示
        if (result.failedTemplateIds.length > 0) {
          const failedTemplateNames = result.failedTemplateIds.map(id => {
            const template = stickerTemplates.find(t => t.id === id);
            return template ? template.name : `模板 ${id}`;
          }).join(', ');

          alert(`部分表情貼圖生成失敗: ${failedTemplateNames}`);
        }
      } else {
        alert('表情貼圖生成失敗，請稍後再試');
      }
    } catch (error) {
      console.error('生成表情貼圖時出錯:', error);
      alert('生成表情貼圖時出錯: ' + (error.message || '未知錯誤'));
    } finally {
      setIsGenerating(false);
    }
  };

  // 處理下載貼圖
  const handleDownloadSticker = (sticker) => {
    if (!sticker || !sticker.imageUrl) {
      alert('貼圖URL無效，無法下載');
      return;
    }

    // 創建一個臨時的a標籤來下載圖片
    const link = document.createElement('a');
    link.href = sticker.imageUrl;
    link.download = `${sticker.templateName || '表情貼圖'}.${sticker.format || 'png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 處理下載所有貼圖
  const handleDownloadAll = () => {
    if (generatedStickers.length === 0) return;

    // 為每個貼圖創建下載任務
    generatedStickers.forEach((sticker, index) => {
      // 延遲下載，避免瀏覽器阻止多個下載
      setTimeout(() => {
        handleDownloadSticker(sticker);
      }, index * 500); // 每500毫秒下載一個
    });
  };

  return (
    <div className="sticker-generator-container">
      <div className="sticker-guidelines-section">
        <div className="guidelines-header" onClick={() => setShowGuidelines(!showGuidelines)}>
          <h2>表情貼圖準則</h2>
          <button className="toggle-guidelines-button">
            {showGuidelines ? '收起' : '展開'}
          </button>
        </div>

        {showGuidelines && (
          <div className="guidelines-content">
            <p>根據LINE創作者市集的準則，表情貼圖應符合以下要求：</p>
            <ul>
              <li><strong>尺寸規格：</strong>
                <ul>
                  <li>主要圖片：240 x 240 像素</li>
                  <li>貼圖圖片：370 x 320 像素（最大）</li>
                  <li>聊天室標籤：96 x 74 像素</li>
                </ul>
              </li>
              <li><strong>檔案格式：</strong> PNG格式，需要透明背景</li>
              <li><strong>留白要求：</strong> 圖片與貼圖圖案之間必須有一定程度（約10像素）的留白</li>
              <li><strong>推薦貼圖類型：</strong>
                <ul>
                  <li>易於日常對話、溝通時使用的貼圖</li>
                  <li>表情、訊息、圖案淺顯易懂的貼圖</li>
                </ul>
              </li>
              <li><strong>避免的貼圖類型：</strong>
                <ul>
                  <li>難於日常對話中用到的貼圖（如：物體、景色等）</li>
                  <li>難以辨認的貼圖（如：扁長的圖片或全身圖片等）</li>
                  <li>整體貼圖明顯失衡的貼圖</li>
                  <li>違反善良風俗、猥褻、暴力等內容</li>
                </ul>
              </li>
            </ul>
            <p>更多詳細資訊，請參考 <a href="https://creator.line.me/zh-hant/guideline/" target="_blank" rel="noopener noreferrer">LINE創作者市集官方準則</a></p>
          </div>
        )}
      </div>

      <div className="sticker-upload-section">
        <h2>上傳照片</h2>
        <div className="upload-options">
          <div className="file-upload">
            <button
              className="upload-button"
              onClick={() => fileInputRef.current.click()}
            >
              選擇文件
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>
          <div className="url-upload">
            <form onSubmit={handleUrlSubmit}>
              <input
                type="text"
                placeholder="輸入圖片URL"
                value={imageUrl}
                onChange={handleUrlChange}
              />
              <button type="submit">載入</button>
            </form>
          </div>
        </div>

        {uploadedImage && (
          <div className="preview-container">
            <h3>預覽</h3>
            <div className="image-preview">
              <img
                src={uploadedImage}
                alt="上傳的圖片"
                className="uploaded-image"
              />
            </div>
          </div>
        )}
      </div>

      <div className="sticker-style-section">
        <h2>選擇貼圖風格</h2>
        <p className="section-description">選擇適合的風格可以提高貼圖的吸引力和營利潛力</p>
        <StyleSelector onStyleSelect={handleStyleSelect} />

        {/* 文字參數建議組件 */}
        {selectedStyle && (
          <PromptSuggestions
            styleInfo={selectedStyle}
            onSelectPrompt={handlePromptSuggestionSelect}
          />
        )}
      </div>

      <div className="sticker-templates-section">
        <div className="templates-header">
          <h2>選擇表情模板</h2>
          <button
            className="select-all-button"
            onClick={handleSelectAll}
          >
            {selectedTemplates.length === stickerTemplates.length ? '取消全選' : '全選'}
          </button>
        </div>

        <div className="templates-grid">
          {stickerTemplates.map(template => (
            <div
              key={template.id}
              className={`template-item ${selectedTemplates.includes(template.id) ? 'selected' : ''}`}
              onClick={() => handleTemplateSelect(template.id)}
            >
              <img src={template.previewUrl} alt={template.name} />
              <div className="template-name">{template.name}</div>
              {selectedTemplates.includes(template.id) && (
                <div className="selected-indicator">
                  <i className="fas fa-check"></i>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="sticker-options-section">
        <h2>貼圖選項</h2>

        <div className="prompt-container">
          <label>自定義提示文字:</label>
          <div className="prompt-input-wrapper">
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="描述您想要的表情貼圖效果，例如：「我希望表情更誇張」、「保持我的臉部特徵但添加卡通風格」、「使用明亮的顏色」等..."
              rows={3}
              className="prompt-textarea"
            />
          </div>
          <p className="prompt-hint">提示：添加詳細描述可以讓生成的表情貼圖更符合您的期望</p>
        </div>

        <div className="options-container">
          <div className="option-group">
            <label>貼圖尺寸:</label>
            <select
              value={stickerSize}
              onChange={(e) => setStickerSize(e.target.value)}
            >
              <option value="240x240">LINE-主要圖片 (240x240)</option>
              <option value="370x320">LINE-貼圖圖片 (370x320)</option>
              <option value="96x74">LINE-聊天室標籤 (96x74)</option>
              <option value="512x512">標準方形 (512x512)</option>
              <option value="768x768">中型方形 (768x768)</option>
              <option value="1024x1024">大型方形 (1024x1024)</option>
              <option value="800x600">寬幅矩形 (800x600)</option>
              <option value="1280x720">HD寬幅 (1280x720)</option>
            </select>
          </div>

          <div className="option-group">
            <label>檔案格式:</label>
            <select
              value={stickerFormat}
              onChange={(e) => setStickerFormat(e.target.value)}
            >
              <option value="png">PNG (透明背景)</option>
              <option value="jpg">JPG</option>
              <option value="webp">WebP</option>
            </select>
          </div>

          <div className="option-group realism-slider">
            <label>真實感百分比: {realismLevel}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={realismLevel}
              onChange={(e) => setRealismLevel(parseInt(e.target.value))}
              className="realism-range"
            />
            <div className="realism-labels">
              <span>卡通風格</span>
              <span>真實照片</span>
            </div>
          </div>
        </div>

        <button
          className="generate-button"
          onClick={handleGenerateStickers}
          disabled={!uploadedImage || selectedTemplates.length === 0 || isGenerating}
        >
          {isGenerating ? '生成中...' : '生成表情貼圖'}
        </button>
      </div>

      {isGenerating && (
        <div className="generating-status">
          <div className="loading-spinner"></div>
          <p>正在生成您的表情貼圖...</p>
        </div>
      )}

      {generatedStickers.length > 0 && !isGenerating && (
        <div className="generated-stickers-section">
          <div className="section-header">
            <h2>生成的表情貼圖</h2>
            <button
              className="download-all-button"
              onClick={handleDownloadAll}
            >
              下載全部
            </button>
          </div>

          <div className="stickers-grid">
            {generatedStickers.map((sticker, index) => (
              <div key={sticker.templateId + '-' + index} className="sticker-item">
                <img src={sticker.imageUrl} alt={sticker.templateName} />
                <div className="sticker-name">{sticker.templateName}</div>
                <div className="sticker-info">
                  {sticker.size} - {sticker.format.toUpperCase()}
                </div>
                <button
                  className="download-button"
                  onClick={() => handleDownloadSticker(sticker)}
                >
                  下載
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StickerGenerator;
