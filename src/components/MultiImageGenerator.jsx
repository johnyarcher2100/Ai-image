import React, { useState, useEffect } from 'react';
import MultiImageUploader from './MultiImageUploader';
import MultiImageResults from './MultiImageResults';
import { generateImageWithOpenAI, generatePromptWithDeepseek } from '../services/api';
import characterThemes, { getThemeById } from '../data/characterThemes';
import '../styles/MultiImageGenerator.css';

// 使用豪華角色貼圖中的風格主題
const styleOptions = characterThemes.map(theme => ({
  id: theme.id,
  name: theme.name,
  description: theme.description,
  promptTemplate: theme.promptTemplate,
  backgroundPrompt: theme.backgroundPrompt
}));

const MultiImageGenerator = () => {
  const [images, setImages] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(null);
  const [processingStatus, setProcessingStatus] = useState('');
  const [animationDots, setAnimationDots] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // 處理圖片上傳變更
  const handleImagesChange = (newImages) => {
    setImages(newImages);
    // 如果清空了圖片，也清空結果
    if (newImages.length === 0) {
      setResults([]);
      setShowResults(false);
    }
  };

  // 處理風格選擇
  const handleStyleSelect = (styleId) => {
    setSelectedStyle(styleId === selectedStyle ? null : styleId);
  };

  // 生成風格提示詞
  const generateStylePrompt = (styleId, imageUrl, customText) => {
    const style = getThemeById(styleId);
    if (!style) {
      return `將圖片轉換為高品質風格。${customText ? customText.trim() : ''}`;
    }

    // 使用豪華角色貼圖中的提示詞模板
    let basePrompt = style.promptTemplate;

    // 如果有自定義提示詞，添加到提示詞中
    if (customText && customText.trim()) {
      basePrompt += ` ${customText.trim()}`;
    }

    return basePrompt;
  };

  // 動畫效果
  useEffect(() => {
    if (isGenerating) {
      const dotsTimer = setInterval(() => {
        setAnimationDots(prev => {
          if (prev.length >= 3) return '';
          return prev + '.';
        });
      }, 500);

      return () => clearInterval(dotsTimer);
    }
  }, [isGenerating]);

  // 更新當前時間
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 計算預估剩餘時間
  const calculateEstimatedTimeRemaining = (currentIndex, totalImages, elapsedTime) => {
    if (currentIndex === 0) return null;

    // 計算每張圖片平均處理時間（秒）
    const averageTimePerImage = elapsedTime / currentIndex;

    // 計算剩餘圖片數量
    const remainingImages = totalImages - currentIndex;

    // 計算預估剩餘時間（秒）
    // 為每張圖片設置最低處理時間為120秒（2分鐘），確保預估時間合理
    const minTimePerImage = 120; // 最低每張圖片2分鐘
    const adjustedTimePerImage = Math.max(averageTimePerImage, minTimePerImage);
    const estimatedSecondsRemaining = adjustedTimePerImage * remainingImages;

    // 轉換為分鐘和秒
    const minutes = Math.floor(estimatedSecondsRemaining / 60);
    const seconds = Math.floor(estimatedSecondsRemaining % 60);

    return { minutes, seconds, totalSeconds: estimatedSecondsRemaining };
  };

  // 處理生成圖片
  const handleGenerateImages = async () => {
    if (images.length === 0) {
      alert('請上傳至少一張圖片');
      return;
    }

    if (!selectedStyle) {
      alert('請選擇一種風格');
      return;
    }

    // 檢查是否所有圖片都已加載完成
    const unloadedImages = images.filter(img => !img.loaded);
    if (unloadedImages.length > 0) {
      console.log('等待圖片加載完成...', unloadedImages.length);
      setProcessingStatus('等待圖片加載完成...');

      // 等待所有圖片加載完成
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          const stillUnloaded = images.filter(img => !img.loaded);
          if (stillUnloaded.length === 0) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 500);

        // 設置一個超時，避免無限等待
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, 10000);
      });
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setResults([]);
    setShowResults(true);
    setCurrentImageIndex(0);
    setStartTime(Date.now());
    setEstimatedTimeRemaining(null);
    setProcessingStatus('正在準備生成...');

    const totalImages = images.length;
    const newResults = [];

    // 記錄所有要處理的圖片，確保不會漏掉
    console.log(`準備處理 ${totalImages} 張圖片:`, images.map(img => img.name).join(', '));

    try {
      // 獲取選中的主題
      const selectedTheme = getThemeById(selectedStyle);
      if (!selectedTheme) {
        throw new Error('無法找到選擇的風格主題');
      }

      // 獲取基本提示詞
      const basePrompt = selectedTheme.promptTemplate || `將圖片轉換為${selectedTheme.name}風格。`;

      // 不使用變體生成，直接使用相同的提示詞處理所有圖片
      for (let i = 0; i < totalImages; i++) {
        setCurrentImageIndex(i);
        let image = images[i];

        // 確保圖片對象存在
        if (!image) {
          console.error(`找不到索引 ${i} 的圖片對象`);
          continue; // 跳過這張圖片
        }

        // 使用基本提示詞
        let prompt = basePrompt;

        // 如果有自定義提示詞，添加到提示詞中
        if (customPrompt && customPrompt.trim()) {
          prompt += ` ${customPrompt.trim()}`;
        }

        console.log(`處理圖片 ${i+1}/${totalImages}，使用提示詞:`, prompt);

        // 更新進度
        const progress = Math.floor((i / totalImages) * 100);
        setGenerationProgress(progress);

        // 更新處理狀態
        setProcessingStatus(`正在處理第 ${i+1}/${totalImages} 張圖片 (${image.name})`);

        // 計算預估剩餘時間
        if (i > 0) {
          const elapsedTime = (Date.now() - startTime) / 1000; // 轉換為秒
          const timeRemaining = calculateEstimatedTimeRemaining(i, totalImages, elapsedTime);
          setEstimatedTimeRemaining(timeRemaining);
        }

        try {
          // 檢查圖片URL是否有效
          if (!image.preview) {
            console.error(`第 ${i+1} 張圖片URL無效:`, image);
            throw new Error('圖片URL無效');
          }

          // 確保圖片已加載完成
          if (!image.loaded) {
            console.log(`第 ${i+1} 張圖片尚未完全加載，等待加載完成...`);

            // 等待圖片加載完成或超時
            await new Promise((resolve) => {
              const checkLoaded = setInterval(() => {
                const currentImage = images.find(img => img.id === image.id);
                if (currentImage && currentImage.loaded) {
                  clearInterval(checkLoaded);
                  clearTimeout(timeout);
                  resolve();
                }
              }, 500);

              const timeout = setTimeout(() => {
                clearInterval(checkLoaded);
                resolve();
              }, 5000);
            });

            // 重新獲取可能已更新的圖片對象
            const updatedImage = images.find(img => img.id === image.id);
            if (updatedImage && updatedImage.loaded) {
              image = updatedImage;
            }
          }

          console.log(`開始生成第 ${i+1} 張圖片，圖片名稱: ${image.name}, URL類型:`, typeof image.preview);
          setProcessingStatus(`正在生成第 ${i+1}/${totalImages} 張圖片 (${image.name})...`);

          // 調用 API 生成圖片
          const generatedImageUrl = await generateImageWithOpenAI(prompt, image.preview);

          console.log(`第 ${i+1} 張圖片生成成功，URL:`, generatedImageUrl ? generatedImageUrl.substring(0, 50) + '...' : 'undefined');
          setProcessingStatus(`第 ${i+1}/${totalImages} 張圖片生成成功！`);

          if (!generatedImageUrl) {
            throw new Error('生成的圖片URL為空');
          }

          // 添加到結果中
          newResults.push({
            id: image.id,
            originalImage: image.preview,
            originalName: image.name,
            generatedImage: generatedImageUrl,
            prompt: prompt,
            theme: selectedTheme.name,
            timestamp: new Date().toISOString() // 添加時間戳
          });

          // 更新結果顯示
          setResults([...newResults]);
        } catch (imageError) {
          console.error(`生成第 ${i+1} 張圖片時出錯:`, imageError);

          // 檢查錯誤類型
          const isTimeoutError = imageError.message && (
            imageError.message.includes('timeout') ||
            imageError.message.includes('time') ||
            imageError.message.includes('ETIMEDOUT')
          );

          if (isTimeoutError) {
            console.log('檢測到超時錯誤，繼續處理...');
            setProcessingStatus(`第 ${i+1}/${totalImages} 張圖片生成時間較長，正在繼續處理...`);

            // 延遲一下再重試，給API一些恢復時間
            await new Promise(resolve => setTimeout(resolve, 3000));

            // 再次嘗試生成圖片，但不顯示錯誤
            try {
              // 再次調用 API 生成圖片，增加超時時間
              console.log(`重新嘗試生成第 ${i+1} 張圖片...`);
              const generatedImageUrl = await generateImageWithOpenAI(prompt, image.preview);

              if (generatedImageUrl) {
                console.log(`第 ${i+1} 張圖片重試成功，URL:`, generatedImageUrl.substring(0, 50) + '...');
                setProcessingStatus(`第 ${i+1}/${totalImages} 張圖片生成成功！`);

                // 添加到結果中
                newResults.push({
                  id: image.id,
                  originalImage: image.preview,
                  originalName: image.name,
                  generatedImage: generatedImageUrl,
                  prompt: prompt,
                  theme: selectedTheme.name,
                  timestamp: new Date().toISOString() // 添加時間戳
                });

                // 更新結果顯示
                setResults([...newResults]);
              } else {
                console.log(`第 ${i+1} 張圖片重試後仍然失敗，跳過此圖片`);
                setProcessingStatus(`第 ${i+1}/${totalImages} 張圖片處理完成，但未能獲得結果`);
              }
            } catch (retryError) {
              console.error(`重試生成第 ${i+1} 張圖片時出錯:`, retryError);
              setProcessingStatus(`第 ${i+1}/${totalImages} 張圖片處理完成，但未能獲得結果`);
            }
          } else {
            console.log(`第 ${i+1} 張圖片生成失敗，錯誤類型: ${imageError.message}`);
            setProcessingStatus(`第 ${i+1}/${totalImages} 張圖片處理完成，但未能獲得結果`);
            // 繼續處理下一張圖片，而不是中斷整個過程
          }
        }
      }

      // 完成所有生成
      setGenerationProgress(100);
      setProcessingStatus('所有圖片生成完成！');
      setEstimatedTimeRemaining(null);
    } catch (error) {
      console.error('生成圖片時出錯:', error);
      setProcessingStatus(`生成過程中發生錯誤: ${error.message || '未知錯誤'}`);
      alert('生成圖片時出錯: ' + (error.message || '未知錯誤'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="multi-image-generator">
      <div className="generator-container">
        {!showResults ? (
          <>
            <MultiImageUploader onImagesChange={handleImagesChange} />

            <div className="style-selector-section">
              <h2>選擇風格</h2>
              <p>為所有圖片選擇統一的風格</p>

              <div className="style-options">
                {styleOptions.map(style => (
                  <div
                    key={style.id}
                    className={`style-option ${selectedStyle === style.id ? 'selected' : ''}`}
                    onClick={() => handleStyleSelect(style.id)}
                  >
                    <div className="style-name">{style.name}</div>
                    <div className="style-description">{style.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="custom-prompt-section">
              <h2>自定義提示詞（選填）</h2>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="添加額外的提示詞來調整生成效果..."
                rows={3}
              />
            </div>

            <div className="action-buttons">
              <button
                className="generate-button"
                onClick={handleGenerateImages}
                disabled={images.length === 0 || !selectedStyle || isGenerating}
              >
                {isGenerating ? '生成中...' : '開始生成圖片'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="results-header">
              <button
                className="back-to-upload-button"
                onClick={() => setShowResults(false)}
                disabled={isGenerating}
              >
                返回上傳頁面
              </button>
              <h2>生成結果</h2>
            </div>

            {isGenerating && (
              <div className="generation-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${generationProgress}%` }}
                  ></div>
                </div>
                <div className="progress-text">
                  正在生成圖片{animationDots} {generationProgress}%
                </div>
                <div className="current-time">
                  當前時間: {currentTime.toLocaleTimeString()}
                </div>
                <div className="processing-status">
                  {processingStatus}
                </div>
                {estimatedTimeRemaining && (
                  <div className="estimated-time">
                    預估剩餘時間: {estimatedTimeRemaining.minutes} 分 {estimatedTimeRemaining.seconds} 秒
                  </div>
                )}
                <div className="image-counter">
                  處理進度: {currentImageIndex + 1}/{images.length} 張圖片
                </div>
                <div className="generation-tips">
                  <div className="tip-icon">💡</div>
                  <div className="tip-text">
                    生成每張圖片約需2-3分鐘，總共需要 {Math.ceil(images.length * 2.5)} 分鐘左右。
                    <br />
                    系統會自動處理所有圖片，請耐心等待完成。
                  </div>
                </div>
              </div>
            )}

            <MultiImageResults results={results} />
          </>
        )}
      </div>
    </div>
  );
};

export default MultiImageGenerator;
