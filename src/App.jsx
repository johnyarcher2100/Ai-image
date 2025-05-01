import { useState, useEffect } from 'react';
import './App.css';
import ChatInterface from './components/ChatInterface';
import ModelStatus from './components/ModelStatus';
import ImagePreview from './components/ImagePreview';
import GeneratingStatus from './components/GeneratingStatus';
import CaseStudies from './components/CaseStudies';
import PromptTemplates from './components/PromptTemplates';
import DebugConsole from './components/DebugConsole';
import { generateImageWithOpenAI, saveCase, savePromptTemplate, getCases, getPromptTemplates, ensureTablesExist } from './services/api';

// 調試函數
console.log('App.jsx 開始執行');

// 檢查 React 和 DOM 是否正確載入
console.log('React 版本檢查:', {
  useState: typeof useState,
  useEffect: typeof useEffect
});

// 檢查組件是否正確載入
console.log('組件載入檢查:', {
  ChatInterface: typeof ChatInterface,
  ModelStatus: typeof ModelStatus,
  ImagePreview: typeof ImagePreview,
  GeneratingStatus: typeof GeneratingStatus,
  CaseStudies: typeof CaseStudies,
  PromptTemplates: typeof PromptTemplates
});

// 啟用調試模式（設置為 true 會顯示調試控制台）
const ENABLE_DEBUG_CONSOLE = true;

// 基本渲染測試
function DebugApp() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>基本渲染測試成功</h1>
      {ENABLE_DEBUG_CONSOLE && <DebugConsole />}
    </div>
  );
}

function App() {
  console.log('App 組件開始渲染');

  try {
    const [activeTab, setActiveTab] = useState('cases'); // 'cases' or 'prompts'
    const [generatedImage, setGeneratedImage] = useState(null);
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [cases, setCases] = useState([]);
    const [promptTemplates, setPromptTemplates] = useState([]);
    const [selectedCase, setSelectedCase] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showDebug, setShowDebug] = useState(true);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [chatPrompt, setChatPrompt] = useState(''); // 用於傳遞給聊天界面的提示詞

    // 調試信息
    console.log('App 狀態初始化完成', {
      activeTab,
      isLoading,
      showDebug
    });

    // 載入已儲存的案例和模板
    useEffect(() => {
      console.log('載入數據 useEffect 開始執行');
      const fetchData = async () => {
        try {
          console.log('開始加載數據...');
          setIsLoading(true);

          // 確保必要的表存在
          console.log('確保必要的表存在...');
          await ensureTablesExist();

          console.log('調用 getCases...');
          const casesData = await getCases();
          console.log('getCases 返回結果:', casesData);

          console.log('調用 getPromptTemplates...');
          const templatesData = await getPromptTemplates();
          console.log('getPromptTemplates 返回結果:', templatesData);

          setCases(casesData);
          setPromptTemplates(templatesData);
          console.log('數據載入完成');
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          console.log('設置 isLoading = false');
          setIsLoading(false);
          setShowDebug(false);
        }
      };

      fetchData();
    }, []);

    // 處理圖像生成
    const handleImageGeneration = async (prompt, referenceImageUrl = null) => {
      setIsGenerating(true);
      setGeneratedPrompt(prompt);
      setGeneratedImage(null); // 清除之前的圖像

      try {
        // 調用 API 生成圖像
        console.log('開始生成圖像...');
        console.log('提示詞:', prompt);
        console.log('使用模型: GPT-4o-image-vip');

        // 使用 OpenAI API 生成圖像
        const imageUrl = await generateImageWithOpenAI(prompt, referenceImageUrl);

        console.log('圖像生成完成:', imageUrl);

        // 檢查是否成功獲取圖像 URL
        if (!imageUrl) {
          throw new Error('無法獲取生成的圖像 URL');
        }

        // 設置生成的圖像
        setGeneratedImage(imageUrl);
      } catch (error) {
        console.error('生成圖像時發生錯誤:', error);

        // 根據錯誤類型提供不同的錯誤訊息
        let errorMessage = '生成圖像時發生錯誤，請稍後再試。';

        if (error.response) {
          // API 響應錯誤
          if (error.response.status === 429) {
            errorMessage = '請求過於頻繁，請稍後再試。';
          } else if (error.response.status === 401) {
            errorMessage = 'API 金鑰驗證失敗，請檢查 API 金鑰設定。';
          } else if (error.response.status === 400) {
            errorMessage = '請求參數有誤，請修改您的提示詞後再試。';
          }
        } else if (error.message.includes('timeout')) {
          errorMessage = '請求超時，網絡可能不穩定，請稍後再試。';
        } else if (error.message.includes('Network Error')) {
          errorMessage = '網絡連接錯誤，請檢查您的網絡連接後再試。';
        }

        alert(errorMessage);

        // 將生成狀態設置為 false，讓用戶可以重新嘗試
        setIsGenerating(false);
        return;
      }

      setIsGenerating(false);
    };

    // 處理保存案例
    const handleSaveCase = async (caseData) => {
      try {
        if (caseData.saveAsCase) {
          await saveCase(caseData);
          // 重新獲取案例列表以獲取最新數據
          const updatedCases = await getCases();
          setCases(updatedCases);
        }

        if (caseData.saveAsPrompt) {
          const templateData = {
            title: caseData.name,
            content: caseData.prompt,
            category: 'user',
            date: new Date().toISOString()
          };
          await savePromptTemplate(templateData);
          // 重新獲取模板列表以獲取最新數據
          const updatedTemplates = await getPromptTemplates();
          setPromptTemplates(updatedTemplates);
        }

        alert('儲存成功！');
      } catch (error) {
        console.error('Error saving case:', error);
        alert('儲存時發生錯誤，請稍後再試。');
      }
    };

    // 處理選擇案例
    const handleSelectCase = (caseItem) => {
      setSelectedCase(caseItem);
      // 將案例的提示詞設置為當前輸入的提示詞，以便在聊天界面中顯示
      setChatPrompt(caseItem.prompt);
    };

    // 處理選擇模板
    const handleSelectTemplate = (template) => {
      setGeneratedPrompt(template.content);
      setSelectedCase(null);
      // 將模板內容設置為當前輸入的提示詞，以便在聊天界面中顯示
      setChatPrompt(template.content);
    };

    // 顯示調試信息
    if (showDebug) {
      return (
        <div className="app">
          <header className="app-header">
            <div className="app-title">阿布吉圖像產生器 (調試模式)</div>
          </header>
          <div style={{ padding: '20px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            <h2>應用初始化中...</h2>
            <p>這是調試信息，載入完成後會自動消失</p>
            <div>
              <button
                onClick={() => setShowDebug(false)}
                style={{ padding: '8px 16px', marginTop: '10px' }}
              >
                繼續到應用
              </button>
            </div>
          </div>
          {ENABLE_DEBUG_CONSOLE && <DebugConsole />}
        </div>
      );
    }

    // 顯示加載中狀態
    if (isLoading) {
      console.log('渲染加載中狀態');
      return (
        <div className="app">
          <header className="app-header">
            <div className="app-title">阿布吉圖像產生器</div>
            <ModelStatus />
          </header>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>載入中...</p>
          </div>
          {ENABLE_DEBUG_CONSOLE && <DebugConsole />}
        </div>
      );
    }

    console.log('渲染主要應用界面');
    return (
      <div className="app">
        <header className="app-header">
          <div className="app-title">阿布吉遊樂場</div>
          <button className="status-button" onClick={() => setShowStatusModal(true)}>
            API 狀態
          </button>
          {showStatusModal && (
            <div className="status-modal-overlay" onClick={() => setShowStatusModal(false)}>
              <div className="status-modal" onClick={(e) => e.stopPropagation()}>
                <div className="status-modal-header">
                  <h3>API 服務狀態</h3>
                  <button className="close-button" onClick={() => setShowStatusModal(false)}>×</button>
                </div>
                <div className="status-modal-content">
                  <ModelStatus />
                </div>
              </div>
            </div>
          )}
        </header>

        <div className="app-content">
          <div className="vertical-layout">
            <div className="top-section">
              <div className="chat-section">
                <ChatInterface
                  onImageGeneration={handleImageGeneration}
                  onSaveCase={handleSaveCase}
                  externalPrompt={chatPrompt}
                  setExternalPrompt={setChatPrompt}
                />
              </div>

              <div className="sidebar">
                <div className="tab-container">
                  <button
                    className={`tab ${activeTab === 'cases' ? 'active' : ''}`}
                    onClick={() => setActiveTab('cases')}
                  >
                    案例頁面
                  </button>
                  <button
                    className={`tab ${activeTab === 'prompts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('prompts')}
                  >
                    Prompt 模板
                  </button>
                </div>

                {activeTab === 'cases' && (
                  <CaseStudies
                    cases={cases}
                    onSelectCase={handleSelectCase}
                  />
                )}

                {activeTab === 'prompts' && (
                  <PromptTemplates
                    templates={promptTemplates}
                    onSelectTemplate={handleSelectTemplate}
                  />
                )}
              </div>
            </div>

            <div className="bottom-section">
              <div className="result-section">
                {isGenerating && (
                  <GeneratingStatus
                    prompt={generatedPrompt}
                    modelName="GPT-4o-image-vip"
                    onRetry={handleImageGeneration}
                  />
                )}

                {generatedImage && !isGenerating && (
                  <ImagePreview
                    imageUrl={generatedImage}
                    prompt={generatedPrompt}
                    onSaveCase={handleSaveCase}
                    modelUsed="GPT-4o-image-vip"
                  />
                )}

                {selectedCase && (
                  <div className="case-detail">
                    <h3>{selectedCase.title}</h3>
                    <img src={selectedCase.imageUrl} alt={selectedCase.title} />
                    <div className="prompt-text">{selectedCase.prompt}</div>
                    <button
                      onClick={() => handleImageGeneration(selectedCase.prompt)}
                      className="primary"
                    >
                      使用此提示詞重新生成
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {ENABLE_DEBUG_CONSOLE && <DebugConsole />}
      </div>
    );
  } catch (error) {
    console.error('App 渲染過程中出錯:', error);
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h2>應用渲染錯誤</h2>
        <p>錯誤信息: {error.message}</p>
        <p>請檢查控制台獲取更多信息</p>
        {ENABLE_DEBUG_CONSOLE && <DebugConsole />}
      </div>
    );
  }
}

// 導出基本測試用 App 以便進行渲染測試
export { DebugApp };
export default App;
