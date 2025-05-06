import { useState, useEffect } from 'react';
import '../styles/StoryGenerator.css';
import CharacterUploader from './CharacterUploader';
import StoryPreview from './StoryPreview';
import { generateStoryScript, generateStoryImages, saveStory } from '../services/api';

const StoryGenerator = () => {
  // 故事基本信息
  const [storyTitle, setStoryTitle] = useState('');
  const [storyDescription, setStoryDescription] = useState('');
  const [imageCount, setImageCount] = useState(4);

  // 角色相關狀態
  const [characters, setCharacters] = useState([]);

  // 生成狀態
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: 輸入信息, 2: 生成劇本, 3: 生成圖像, 4: 預覽結果

  // 生成結果
  const [storyScript, setStoryScript] = useState(null);
  const [storyImages, setStoryImages] = useState([]);
  const [generationProgress, setGenerationProgress] = useState(0);

  // 計時器狀態
  const [startTime, setStartTime] = useState(null);
  const [currentImageStartTime, setCurrentImageStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentImageTime, setCurrentImageTime] = useState(0);
  const [imageGenerationTimes, setImageGenerationTimes] = useState([]);

  // 添加角色
  const handleAddCharacter = (character) => {
    setCharacters([...characters, character]);
  };

  // 移除角色
  const handleRemoveCharacter = (index) => {
    const updatedCharacters = [...characters];
    updatedCharacters.splice(index, 1);
    setCharacters(updatedCharacters);
  };

  // 生成劇本
  const handleGenerateScript = async () => {
    if (!storyTitle || !storyDescription || characters.length === 0) {
      alert('請填寫故事標題、描述並至少添加一個角色');
      return;
    }

    setIsGeneratingScript(true);
    setCurrentStep(2);

    try {
      const scriptData = await generateStoryScript({
        title: storyTitle,
        description: storyDescription,
        characters: characters,
        imageCount: imageCount
      });

      setStoryScript(scriptData);
      setCurrentStep(3);
    } catch (error) {
      console.error('生成劇本時發生錯誤:', error);
      alert('生成劇本時發生錯誤，請稍後再試');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // 格式化時間為分:秒
  const formatTime = (timeInMs) => {
    const totalSeconds = Math.floor(timeInMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  };

  // 更新計時器
  useEffect(() => {
    let timer;
    if (isGeneratingImages && startTime) {
      timer = setInterval(() => {
        const now = Date.now();
        setElapsedTime(now - startTime);

        if (currentImageStartTime) {
          setCurrentImageTime(now - currentImageStartTime);
        }
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isGeneratingImages, startTime, currentImageStartTime]);

  // 生成圖像
  const handleGenerateImages = async () => {
    if (!storyScript) {
      alert('請先生成劇本');
      return;
    }

    setIsGeneratingImages(true);
    setStoryImages([]);
    setGenerationProgress(0);

    // 初始化計時器
    const timeStart = Date.now();
    setStartTime(timeStart);
    setElapsedTime(0);
    setImageGenerationTimes([]);

    try {
      // 分段生成圖像
      const scenes = storyScript.scenes;
      const totalScenes = scenes.length;

      const generatedImages = [];
      const times = [];

      for (let i = 0; i < totalScenes; i++) {
        const scene = scenes[i];

        // 更新進度
        setGenerationProgress(Math.floor((i / totalScenes) * 100));

        // 記錄當前圖像開始生成的時間
        const imageStartTime = Date.now();
        setCurrentImageStartTime(imageStartTime);
        setCurrentImageTime(0);

        // 生成當前場景的圖像
        const imageData = await generateStoryImages({
          scene: scene,
          characters: characters,
          previousScenes: scenes.slice(0, i),
          previousImages: generatedImages
        });

        // 計算並記錄這張圖像生成所花費的時間
        const imageEndTime = Date.now();
        const imageTime = imageEndTime - imageStartTime;
        times.push(imageTime);

        generatedImages.push({
          sceneIndex: i,
          imageUrl: imageData.imageUrl,
          scene: imageData.scene || scene, // 使用可能更新過的場景描述
          prompt: imageData.prompt, // 保存生成圖像使用的提示詞
          generationTime: imageTime // 添加生成時間
        });

        // 更新狀態以顯示進度
        setStoryImages([...generatedImages]);
      }

      setImageGenerationTimes(times);
      setGenerationProgress(100);
      setCurrentStep(4);
    } catch (error) {
      console.error('生成圖像時發生錯誤:', error);
      alert('生成圖像時發生錯誤，請稍後再試');
    } finally {
      setIsGeneratingImages(false);
      setStartTime(null);
      setCurrentImageStartTime(null);
    }
  };

  // 保存故事
  const handleSaveStory = async () => {
    if (!storyScript || storyImages.length === 0) {
      alert('請先完成故事生成');
      return;
    }

    try {
      await saveStory({
        title: storyTitle,
        description: storyDescription,
        characters: characters,
        script: storyScript,
        images: storyImages,
        timestamp: new Date().toISOString()
      });

      alert('故事保存成功！');
    } catch (error) {
      console.error('保存故事時發生錯誤:', error);
      alert('保存故事時發生錯誤，請稍後再試');
    }
  };

  // 重新開始
  const handleReset = () => {
    if (confirm('確定要重新開始嗎？所有未保存的內容將會丟失。')) {
      setStoryTitle('');
      setStoryDescription('');
      setCharacters([]);
      setStoryScript(null);
      setStoryImages([]);
      setCurrentStep(1);
    }
  };

  return (
    <div className="story-generator">
      <div className="story-generator-content">
        {/* 步驟指示器 */}
        <div className="step-indicator">
          <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>1. 設定故事</div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>2. 生成劇本</div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>3. 生成圖像</div>
          <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>4. 完成</div>
        </div>

        {/* 步驟 1: 故事設定 */}
        {currentStep === 1 && (
          <div className="story-setup">
            <div className="story-info">
              <h2>故事基本信息</h2>
              <div className="form-group">
                <label>故事標題</label>
                <input
                  type="text"
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  placeholder="輸入故事標題"
                />
              </div>

              <div className="form-group">
                <label>故事描述</label>
                <textarea
                  value={storyDescription}
                  onChange={(e) => setStoryDescription(e.target.value)}
                  placeholder="描述你想要的故事情節、風格、氛圍等..."
                  rows={5}
                />
              </div>

              <div className="form-group">
                <label>圖像數量</label>
                <select
                  value={imageCount}
                  onChange={(e) => setImageCount(parseInt(e.target.value))}
                >
                  <option value={4}>4 張 (短篇)</option>
                  <option value={8}>8 張 (中篇)</option>
                  <option value={12}>12 張 (長篇)</option>
                  <option value={16}>16 張 (連載)</option>
                </select>
              </div>
            </div>

            <div className="character-setup">
              <h2>角色設定</h2>
              <CharacterUploader
                onAddCharacter={handleAddCharacter}
                characters={characters}
                onRemoveCharacter={handleRemoveCharacter}
              />
            </div>

            <div className="action-buttons">
              <button
                className="primary-button generate-script-btn"
                onClick={handleGenerateScript}
                disabled={!storyTitle || !storyDescription || characters.length === 0}
              >
                <i className="fas fa-book"></i> 生成劇本
              </button>
            </div>
          </div>
        )}

        {/* 步驟 2: 生成劇本 */}
        {currentStep === 2 && (
          <div className="generating-script">
            <h2>正在生成劇本...</h2>
            <div className="loading-spinner"></div>
            <p>使用 DeepSeek LLM 根據您提供的故事描述和角色信息生成劇本，請稍候...</p>
            <div className="model-info">
              <span className="model-badge">DeepSeek LLM</span>
              <p className="model-description">DeepSeek LLM 是一個強大的語言模型，擅長創意寫作和故事生成</p>
            </div>
          </div>
        )}

        {/* 步驟 3: 生成圖像 */}
        {currentStep === 3 && (
          <div className="script-preview">
            <h2>劇本預覽</h2>
            <div className="script-content">
              <h3>{storyScript.title}</h3>
              <p className="script-description">{storyScript.description}</p>

              <div className="scenes-list">
                <h4>場景分鏡 ({storyScript.scenes.length})</h4>
                {storyScript.scenes.map((scene, index) => (
                  <div key={index} className="scene-item">
                    <div className="scene-number">場景 {index + 1}</div>
                    <div className="scene-description">{scene.description}</div>
                    {scene.dialogue && (
                      <div className="scene-dialogue">
                        <strong>對白:</strong> {scene.dialogue}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="action-buttons">
                <button className="secondary-button" onClick={() => setCurrentStep(1)}>
                  <i className="fas fa-arrow-left"></i> 返回修改
                </button>
                <button className="primary-button generate-images-btn" onClick={handleGenerateImages}>
                  <i className="fas fa-images"></i> 開始生成圖像
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 步驟 3.5: 生成圖像中 */}
        {isGeneratingImages && (
          <div className="generating-images">
            <h2>正在生成圖像...</h2>

            <div className="model-info">
              <span className="model-badge">GPT-4o-image-vip</span>
              <p className="model-description">使用 OpenAI 的 GPT-4o-image-vip 模型生成高品質連續圖像</p>
            </div>

            <div className="progress-container">
              <div className="progress-bar" data-progress={generationProgress}>
                <div
                  className="progress-fill"
                  style={{ width: `${generationProgress}%` }}
                ></div>
              </div>
              <div className="progress-status">
                <p className="progress-text">
                  已完成: {storyImages.length} / {storyScript.scenes.length} 張圖像
                  ({generationProgress}%)
                </p>
                <p className="progress-detail">
                  {storyImages.length < storyScript.scenes.length ?
                    `正在生成場景 ${storyImages.length + 1}...` :
                    '所有圖像生成完成！'}
                </p>
              </div>

              <div className="timer-container">
                <div className="timer-item">
                  <span className="timer-label">總耗時:</span>
                  <span className="timer-value">{formatTime(elapsedTime)}</span>
                </div>
                {storyImages.length < storyScript.scenes.length && (
                  <div className="timer-item">
                    <span className="timer-label">當前圖像耗時:</span>
                    <span className="timer-value">{formatTime(currentImageTime)}</span>
                  </div>
                )}
                {storyImages.length > 0 && (
                  <div className="timer-item">
                    <span className="timer-label">平均耗時/圖:</span>
                    <span className="timer-value">
                      {formatTime(storyImages.reduce((sum, img) => sum + (img.generationTime || 0), 0) / storyImages.length)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {storyImages.length > 0 && (
              <div className="preview-images">
                {storyImages.map((image, index) => (
                  <div key={index} className="preview-image-item">
                    <img src={image.imageUrl} alt={`場景 ${image.sceneIndex + 1}`} />
                    <div className="preview-image-caption">
                      <span className="scene-number">場景 {image.sceneIndex + 1}</span>
                      <div className="scene-info">
                        <span className="scene-status">已完成</span>
                        {image.generationTime && (
                          <span className="scene-time">{formatTime(image.generationTime)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {storyImages.length < storyScript.scenes.length && (
                  <div className="preview-image-item loading">
                    <div className="image-placeholder">
                      <div className="loading-spinner"></div>
                    </div>
                    <div className="preview-image-caption">
                      <span className="scene-number">場景 {storyImages.length + 1}</span>
                      <span className="scene-status generating">生成中...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 步驟 4: 完成 */}
        {currentStep === 4 && !isGeneratingImages && (
          <div className="story-complete">
            <h2>故事生成完成</h2>
            <StoryPreview
              title={storyTitle}
              description={storyDescription}
              script={storyScript}
              images={storyImages}
              characters={characters}
            />

            <div className="action-buttons">
              <button className="secondary-button" onClick={handleReset}>
                <i className="fas fa-redo"></i> 重新開始
              </button>
              <button className="primary-button save-story-btn" onClick={handleSaveStory}>
                <i className="fas fa-save"></i> 保存故事
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryGenerator;
