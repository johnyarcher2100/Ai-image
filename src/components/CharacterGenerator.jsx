import { useState, useRef, useEffect } from 'react';
import WebcamCapture from './WebcamCapture';
import ImageUrlInput from './ImageUrlInput';
import ImageUploadMenu from './ImageUploadMenu';
import { generateImageWithOpenAI, sendMessageToDeepseek, saveCharacter } from '../services/api';
import '../styles/CharacterGenerator.css';

const CharacterGenerator = () => {
  // 照片上傳相關狀態
  const [characterImage, setCharacterImage] = useState(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const fileInputRef = useRef(null);

  // 風格選擇相關狀態
  const [selectedStyle, setSelectedStyle] = useState(null);

  // 生成狀態
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [generationStartTime, setGenerationStartTime] = useState(null);
  const [generationElapsedTime, setGenerationElapsedTime] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('準備中');
  const [generationProgress, setGenerationProgress] = useState(0);

  // 角色設定相關狀態
  const [isSettingCharacter, setIsSettingCharacter] = useState(false);
  const [characterSetting, setCharacterSetting] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState('general');
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [isSavingCharacter, setIsSavingCharacter] = useState(false);
  const [characterName, setCharacterName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [nameInputValue, setNameInputValue] = useState('');
  const [isLlmWorking, setIsLlmWorking] = useState(false); // LLM 工作狀態

  // 風格選項
  const styleOptions = [
    { id: 'qing-dynasty', name: '清朝古裝風格', description: '寫實臉部，傳統清朝服飾與髮型' },
    { id: 'future-tech', name: '未來科技感上身', description: '寫實臉部，搭配未來科技風格的服裝與配件' },
    { id: 'pixar', name: '皮克斯工作室風格', description: '3D卡通風格，大眼睛，誇張表情' },
    { id: 'ghibli', name: '吉卜力風格', description: '溫暖細膩的手繪風格，自然柔和的色調' },
    { id: 'animal-crossing', name: '動物森友會風格', description: '可愛簡約的卡通風格，圓潤的造型' },
    { id: 'doraemon', name: '哆啦A夢風格', description: '簡約線條，明亮色彩，日式動畫風格' },
    { id: 'random', name: '隨機風格', description: '隨機組合種族/外貌/職業/髮型/配件/個性等元素' }
  ];

  // 角色設定模板選項
  const characterTemplates = [
    {
      id: 'general',
      name: '一般角色',
      description: '適用於各種類型的角色設定',
      questions: [
        '請告訴我這個角色的基本信息，如姓名、年齡和性別。您希望這個角色有什麼樣的身份或職業？',
        '請描述這個角色的外表特徵，包括外貌、服裝、特殊標誌等。有什麼獨特的視覺元素能讓這個角色脫穎而出？',
        '請描述這個角色的性格特點、愛好和技能。這些特質如何影響他/她的行為和決策？',
        '請描述這個角色的背景故事和重要經歷。有哪些關鍵事件塑造了這個角色？他/她與其他人有什麼樣的關係？'
      ]
    },
    {
      id: 'fantasy',
      name: '奇幻角色',
      description: '適用於魔法世界、異世界的角色',
      questions: [
        '請告訴我這個奇幻角色的基本信息，如姓名、種族、年齡和性別。在奇幻世界中，這個角色屬於什麼樣的種族或陣營？',
        '請描述這個角色的外表特徵，包括外貌、服裝、特殊標誌，以及魔法或特殊能力的視覺表現。這個角色的外表如何反映其種族特徵或魔法屬性？',
        '請描述這個角色的性格特點、魔法能力或特殊技能，以及在奇幻世界中的職業或身份。這些能力如何影響角色在世界中的地位？',
        '請描述這個角色在奇幻世界中的背景故事、所屬勢力或種族歷史，以及重要經歷。這個角色在奇幻世界的歷史或預言中扮演什麼角色？'
      ]
    },
    {
      id: 'scifi',
      name: '科幻角色',
      description: '適用於未來世界、太空或賽博朋克設定的角色',
      questions: [
        '請告訴我這個科幻角色的基本信息，如姓名、年齡、性別，以及是否為人類、改造人或AI等。在這個科技世界中，角色的身份類別如何影響其社會地位？',
        '請描述這個角色的外表特徵，包括外貌、科技裝備、改造部件或特殊標誌等。這些科技元素如何融入角色的日常生活和工作？',
        '請描述這個角色的性格特點、科技專長或特殊能力，以及在科幻世界中的職業或身份。角色如何看待科技與人性的關係？',
        '請描述這個角色在科幻世界中的背景故事、所屬組織或星球，以及重要的科技相關經歷。角色對所處的科技社會有什麼樣的態度或抱負？'
      ]
    },
    {
      id: 'anime',
      name: '動漫角色',
      description: '適用於日式動漫風格的角色',
      questions: [
        '請告訴我這個動漫角色的基本信息，如姓名、年齡、性別，以及可能的稱號或別名。這個角色在動漫世界中屬於什麼類型的角色原型？',
        '請描述這個角色的外表特徵，包括髮型髮色、瞳色、服裝風格、特殊標誌等動漫元素。這些視覺元素如何反映角色的性格或能力？',
        '請描述這個角色的性格特點、口頭禪、必殺技或特殊能力，以及在動漫世界中的定位。角色有什麼樣的成長軌跡或內心掙扎？',
        '請描述這個角色的背景故事、所屬學校或組織，以及與其他角色的關係和重要經歷。這個角色在故事中的動機和目標是什麼？'
      ]
    },
    {
      id: 'historical',
      name: '歷史角色',
      description: '適用於各個歷史時期的人物角色',
      questions: [
        '請告訴我這個歷史角色的基本信息，如姓名、年齡、性別，以及所處的歷史時期和地區。這個角色在當時的社會階層中處於什麼位置？',
        '請描述這個角色的外表特徵，包括外貌、服飾、配飾等符合歷史時期的元素。有什麼特殊的標誌或裝扮能反映角色的身份或地位？',
        '請描述這個角色的性格特點、才能或專長，以及在歷史背景下的職業或身份。這些特質如何受到當時社會環境和價值觀的影響？',
        '請描述這個角色的背景故事、家族歷史，以及與重要歷史事件或人物的關聯。這個角色如何看待或參與所處時代的重大變革？'
      ]
    }
  ];

  // 處理圖片上傳選項選擇
  const handleUploadOptionSelect = (option) => {
    setShowUploadMenu(false);

    switch (option) {
      case 'file':
        fileInputRef.current.click();
        break;
      case 'camera':
        setShowWebcam(true);
        break;
      case 'url':
        setShowUrlInput(true);
        break;
      default:
        break;
    }
  };

  // 處理文件上傳
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCharacterImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 處理拍照
  const handleCapture = (imageSrc) => {
    setCharacterImage(imageSrc);
    setShowWebcam(false);
  };

  // 處理 URL 圖片
  const handleUrlImage = (url) => {
    setCharacterImage(url);
    setShowUrlInput(false);
  };

  // 生成風格提示詞
  const generateStylePrompt = (style, imageUrl) => {
    let basePrompt = `基於參考照片中的人物，創建一個全身45度角的人物角色照片，透明背景。`;

    switch (style) {
      case 'qing-dynasty':
        return `${basePrompt} 風格：清朝古裝風格，保持寫實的臉部特徵，但穿著傳統清朝服飾，包括長袍、馬褂、官帽等元素。使用傳統中國風的色彩和紋樣。`;
      case 'future-tech':
        return `${basePrompt} 風格：未來科技感風格，保持寫實的臉部特徵，但穿著未來科技風格的服裝，包括發光元素、全息投影、金屬質感和流線型設計。使用藍色、紫色和銀色等科技感色調。`;
      case 'pixar':
        return `${basePrompt} 風格：皮克斯工作室3D動畫風格，大眼睛，誇張的表情，圓潤的造型，細膩的質感和光影效果。保持人物的基本特徵但進行卡通化處理。`;
      case 'ghibli':
        return `${basePrompt} 風格：吉卜力工作室風格，溫暖細膩的手繪風格，自然柔和的色調，簡約但富有表現力的臉部特徵，細節豐富的服裝和背景元素。`;
      case 'animal-crossing':
        return `${basePrompt} 風格：動物森友會風格，超可愛的簡約卡通風格，圓潤的頭部和身體，簡化的臉部特徵，明亮飽和的色彩，無陰影的平面設計感。`;
      case 'doraemon':
        return `${basePrompt} 風格：哆啦A夢風格，簡約的線條，明亮的色彩，日式動畫風格，大頭小身體的比例，簡化但富有表現力的臉部特徵。`;
      case 'random':
        return `${basePrompt} 創建一個獨特的角色，隨機組合不同的種族、外貌、職業、髮型、服裝、配件和個性特徵。保持人物的基本特徵但賦予全新的風格和身份。`;
      default:
        return basePrompt;
    }
  };

  // 計時器效果
  useEffect(() => {
    let timer;
    if (isGenerating && generationStartTime) {
      timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - generationStartTime) / 1000);
        setGenerationElapsedTime(elapsed);

        // 更新進度 - 模擬進度，實際應該從API獲取
        if (generationProgress < 95) {
          const newProgress = Math.min(95, generationProgress + (Math.random() * 2));
          setGenerationProgress(newProgress);

          // 更新狀態文字
          if (elapsed < 3) {
            setGenerationStatus('分析圖像中...');
          } else if (elapsed < 8) {
            setGenerationStatus('生成角色特徵中...');
          } else if (elapsed < 15) {
            setGenerationStatus('應用風格中...');
          } else {
            setGenerationStatus('最終處理中...');
          }
        }
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isGenerating, generationStartTime, generationProgress]);

  // 生成圖片
  const handleGenerateImage = async () => {
    if (!characterImage || !selectedStyle) {
      alert('請上傳照片並選擇一種風格');
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    setGenerationStartTime(Date.now());
    setGenerationElapsedTime(0);
    setGenerationProgress(0);
    setGenerationStatus('準備中...');

    try {
      // 生成提示詞
      const prompt = generateStylePrompt(selectedStyle, characterImage);
      setGenerationPrompt(prompt);

      // 使用 OpenAI API 生成圖像
      const imageUrl = await generateImageWithOpenAI(prompt, characterImage);
      setGeneratedImage(imageUrl);
      setGenerationProgress(100);
      setGenerationStatus('完成');
    } catch (error) {
      console.error('生成圖像時出錯:', error);
      alert('生成圖像時出錯，請稍後再試');
      setGenerationStatus('生成失敗');
    } finally {
      setIsGenerating(false);
    }
  };

  // 開始角色設定
  const handleStartCharacterSetting = async () => {
    if (!generatedImage) {
      alert('請先生成角色圖像');
      return;
    }

    // 顯示模板選擇界面
    setShowTemplateSelection(true);
  };

  // 選擇角色設定模板
  const handleSelectTemplate = async (templateId) => {
    setSelectedTemplate(templateId);
    setShowTemplateSelection(false);

    // 開始角色設定問答
    setIsSettingCharacter(true);

    // 獲取選擇的模板
    const template = characterTemplates.find(t => t.id === templateId);

    // 使用 deepseek 生成初始問題
    try {
      setGenerationStatus('北京影室創作坊的 deepseek-chat 大模型正在準備第一個引導性問題...');
      setIsLlmWorking(true); // 設置 LLM 工作狀態為 true

      const initialPrompt = `你是北京影室創作坊的角色設計專家，正在幫助用戶創建一個${template.name}。

請生成第一個引導性問題，詢問用戶關於這個角色的基本信息。問題應該簡潔明了，但能引導用戶思考角色的核心特質。
問題應該涵蓋角色的基本資料，如姓名、年齡、性別等，以及角色的身份或職業。

請直接給出問題，不要有任何前綴或說明。問題應該是中文的，並且字數控制在100字以內。`;

      const firstQuestion = await sendMessageToDeepseek(initialPrompt, []);

      // 設置初始問題
      setChatMessages([
        {
          sender: 'bot',
          text: firstQuestion,
          timestamp: new Date().toISOString()
        }
      ]);
      setCurrentQuestion(1);
      setIsLlmWorking(false); // 設置 LLM 工作狀態為 false
    } catch (error) {
      console.error('生成初始問題時出錯:', error);

      // 如果出錯，使用模板中的預設問題
      setChatMessages([
        {
          sender: 'bot',
          text: `讓我們為您的角色創建詳細的設定。我將通過4個問題幫助您塑造這個${template.name}。${template.questions[0]}`,
          timestamp: new Date().toISOString()
        }
      ]);
      setCurrentQuestion(1);
    }
  };

  // 儲存角色設定
  const handleSaveCharacter = () => {
    if (!characterSetting || !generatedImage) {
      alert('請先生成角色圖像和設定');
      return;
    }

    // 從設定中提取默認角色名稱
    if (!characterName) {
      // 嘗試從設定中提取名稱
      const nameMatch = characterSetting.match(/姓名[：:]\s*([^\n,，。]+)/);
      if (nameMatch && nameMatch[1]) {
        const extractedName = nameMatch[1].trim();
        setCharacterName(extractedName);
        setNameInputValue(extractedName);
      } else {
        setNameInputValue('未命名角色');
      }
    } else {
      setNameInputValue(characterName);
    }

    // 顯示名稱輸入對話框
    setShowNameInput(true);
  };

  // 確認儲存角色
  const handleConfirmSave = async () => {
    try {
      setIsSavingCharacter(true);

      // 使用用戶輸入的名稱或默認名稱
      const name = nameInputValue.trim() || '未命名角色';
      setCharacterName(name);

      // 從設定中提取三個部分
      let externalTraits = '';
      let internalTraits = '';
      let biography = '';

      // 提取外部特質
      const externalMatch = characterSetting.match(/【第一部分：角色外部特質】[\s\S]*?(?=【第二部分)/);
      if (externalMatch) {
        externalTraits = externalMatch[0].replace(/【第一部分：角色外部特質】[\s\n]*(\(100字\))?/, '').trim();
      } else {
        console.warn('無法從設定中提取外部特質');
        // 使用默認值
        externalTraits = `${name}是一個外表特徵尚未詳細描述的角色。`;
      }

      // 提取內部特質
      const internalMatch = characterSetting.match(/【第二部分：角色內部特質】[\s\S]*?(?=【第三部分)/);
      if (internalMatch) {
        internalTraits = internalMatch[0].replace(/【第二部分：角色內部特質】[\s\n]*(\(100字\))?/, '').trim();
      } else {
        console.warn('無法從設定中提取內部特質');
        // 使用默認值
        internalTraits = `${name}的性格特點和內在特質尚未詳細描述。`;
      }

      // 提取人物傳記
      const biographyMatch = characterSetting.match(/【第三部分：角色人物傳記】[\s\S]*/);
      if (biographyMatch) {
        biography = biographyMatch[0].replace(/【第三部分：角色人物傳記】[\s\n]*(\(600字\))?/, '').trim();
      } else {
        console.warn('無法從設定中提取人物傳記');
        // 使用默認值
        biography = `${name}的背景故事和人物傳記尚未詳細描述。這個角色的故事正在發展中。`;
      }

      console.log('提取的角色設定:', {
        externalTraits,
        internalTraits,
        biography
      });

      // 準備角色數據
      const characterData = {
        name: name,
        imageUrl: generatedImage,
        styleId: selectedStyle,
        styleName: styleOptions.find(s => s.id === selectedStyle)?.name || '未指定風格',
        externalTraits: externalTraits,
        internalTraits: internalTraits,
        biography: biography
      };

      console.log('準備保存的角色數據:', characterData);

      // 保存角色
      try {
        const savedCharacter = await saveCharacter(characterData);
        console.log('角色保存成功:', savedCharacter);

        // 關閉名稱輸入對話框
        setShowNameInput(false);

        alert(`角色 "${savedCharacter.name}" 已成功儲存！`);
      } catch (saveError) {
        console.error('調用 saveCharacter 函數時出錯:', saveError);

        // 顯示更詳細的錯誤信息
        if (saveError.message && saveError.message.includes('本地存儲')) {
          alert(`角色 "${name}" 已保存到本地存儲。由於數據庫連接問題，數據僅保存在當前設備上。`);
          setShowNameInput(false);
        } else {
          alert(`儲存角色時出錯: ${saveError.message || '未知錯誤'}`);
        }
      }
    } catch (error) {
      console.error('儲存角色過程中出錯:', error);
      alert(`儲存角色時出錯: ${error.message || '未知錯誤'}`);
    } finally {
      setIsSavingCharacter(false);
    }
  };

  // 發送用戶消息
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    // 添加用戶消息
    const userMessage = {
      sender: 'user',
      text: userInput,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setUserInput('');

    // 獲取當前模板
    const template = characterTemplates.find(t => t.id === selectedTemplate);

    // 顯示加載狀態 - 明確提示 LLM 正在工作
    setGenerationStatus('北京影室創作坊的 deepseek-chat 大模型正在思考中...');
    setIsLlmWorking(true); // 設置 LLM 工作狀態為 true

    // 準備下一個問題或生成角色設定
    if (currentQuestion < 4) {
      try {
        // 構建提示詞，讓 deepseek 生成下一個問題
        const questionNumber = currentQuestion + 1;
        let questionFocus = '';

        if (questionNumber === 2) {
          questionFocus = '外表特徵、服裝風格和視覺特點';
        } else if (questionNumber === 3) {
          questionFocus = '性格特點、能力和技能';
        } else if (questionNumber === 4) {
          questionFocus = '背景故事、關係網絡和動機';
        }

        const nextQuestionPrompt = `你是北京影室創作坊的角色設計專家，正在幫助用戶創建一個${template.name}。這是第${questionNumber}輪問答。

以下是之前的對話記錄：
${updatedMessages.map(msg => `${msg.sender === 'user' ? '用戶' : '助手'}: ${msg.text}`).join('\n')}

請生成下一個引導性問題，詢問用戶關於這個角色的${questionFocus}。問題應該簡潔明了，但能引導用戶深入思考角色的特質。

請直接給出問題，不要有任何前綴或說明。問題應該是中文的，並且字數控制在100字以內。`;

        // 使用 Deepseek API 生成下一個問題
        const nextQuestion = await sendMessageToDeepseek(nextQuestionPrompt, []);

        // 添加機器人消息
        setChatMessages([...updatedMessages, {
          sender: 'bot',
          text: nextQuestion,
          timestamp: new Date().toISOString()
        }]);

        // 更新問題計數
        setCurrentQuestion(currentQuestion + 1);

        // 設置 LLM 工作狀態為 false
        setIsLlmWorking(false);
      } catch (error) {
        console.error('生成問題時出錯:', error);

        // 如果出錯，使用模板中的預設問題
        const nextQuestion = template.questions[currentQuestion];

        setChatMessages([...updatedMessages, {
          sender: 'bot',
          text: nextQuestion,
          timestamp: new Date().toISOString()
        }]);

        setCurrentQuestion(currentQuestion + 1);
        setIsLlmWorking(false); // 設置 LLM 工作狀態為 false
      }
    } else if (currentQuestion === 4) {
      // 最後一個問題，生成完整角色設定
      try {
        // 構建提示詞
        const characterPrompt = `你是北京影室創作坊的創作大師，專精於角色設定與人物塑造。請基於以下對話，為這個${template.name}創建一個完整、專業的角色設定：

【角色基本信息】
角色類型: ${template.name}
視覺風格: ${styleOptions.find(s => s.id === selectedStyle)?.name || '未指定'}
生成圖像: ${generatedImage ? '已生成角色視覺形象' : '尚未生成視覺形象'}

【用戶與助手的對話記錄】
${updatedMessages.map(msg => `${msg.sender === 'user' ? '用戶' : '助手'}: ${msg.text}`).join('\n')}

請以專業編劇和角色設計師的視角，創建一個深度、立體且富有魅力的角色設定。你的設定必須嚴格按照以下三大部分及其字數要求：

【第一部分：角色外部特質】(100字)
簡潔描述角色的基本資料（姓名、年齡、性別等）、外觀特徵、服裝風格、聲音特點和肢體語言等外在表現。請確保這部分總字數為100字左右。

【第二部分：角色內部特質】(100字)
簡潔描述角色的性格特點、價值觀、能力技能和內在弱點等。請確保這部分總字數為100字左右。

【第三部分：角色人物傳記】(600字)
詳細描述角色的背景故事、成長經歷、重要關係、動機目標和發展潛力等。這部分應該更加詳盡，請確保總字數為600字左右。

請使用第三人稱描述，保持條理清晰、內容豐富。注重角色的獨特性和內在邏輯，確保各個特質之間相互呼應，形成一個連貫且引人入勝的角色形象。

重要：
1. 請嚴格遵守每個部分的字數限制：第一部分100字，第二部分100字，第三部分600字
2. 請確保包含所有三個主要部分，並使用【第一部分：角色外部特質】、【第二部分：角色內部特質】和【第三部分：角色人物傳記】作為明確的標題
3. 不要使用項目符號或編號，每個部分應該是連貫的段落`;

        setGenerationStatus('北京影室創作坊的 deepseek-chat 大模型正在創建完整角色設定（外部特質、內部特質和人物傳記）...');
        setIsLlmWorking(true); // 設置 LLM 工作狀態為 true

        // 使用 Deepseek API 生成角色設定
        const settingText = await sendMessageToDeepseek(characterPrompt, []);

        // 添加機器人消息
        setChatMessages([...updatedMessages, {
          sender: 'bot',
          text: '感謝您的回答！北京影室創作坊的創作大師已為您生成了完整的角色設定，包括角色外部特質（100字）、內部特質（100字）和人物傳記（600字）：',
          timestamp: new Date().toISOString()
        }]);

        // 設置角色設定
        setCharacterSetting(settingText);
        setIsLlmWorking(false); // 設置 LLM 工作狀態為 false
        return;
      } catch (error) {
        console.error('生成角色設定時出錯:', error);

        // 添加錯誤消息
        setChatMessages([...updatedMessages, {
          sender: 'bot',
          text: '抱歉，生成角色設定時出錯。請再試一次。',
          timestamp: new Date().toISOString()
        }]);

        setIsLlmWorking(false); // 設置 LLM 工作狀態為 false
      }
    }
  };

  return (
    <div className="character-generator">
      {/* 名稱輸入對話框 */}
      {showNameInput && (
        <div className="name-input-overlay">
          <div className="name-input-dialog">
            <h3>請輸入角色名稱</h3>
            <input
              type="text"
              value={nameInputValue}
              onChange={(e) => setNameInputValue(e.target.value)}
              placeholder="請輸入角色名稱"
              className="name-input-field"
              autoFocus
            />
            <div className="name-input-buttons">
              <button
                onClick={() => setShowNameInput(false)}
                className="cancel-button"
              >
                取消
              </button>
              <button
                onClick={handleConfirmSave}
                className="confirm-button"
                disabled={isSavingCharacter}
              >
                {isSavingCharacter ? '儲存中...' : '確認儲存'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="character-generator-content">
        <div className="character-setup-section">
          <h2>上傳照片</h2>
          <div className="photo-upload-area">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <div
              className="upload-container"
              onClick={() => setShowUploadMenu(!showUploadMenu)}
            >
              {characterImage ? (
                <img src={characterImage} alt="上傳的照片" className="uploaded-image" />
              ) : (
                <div className="upload-placeholder">
                  <span>點擊上傳照片</span>
                  <small>支持拍照/提供檔案/提供路徑</small>
                </div>
              )}
            </div>
            {showUploadMenu && (
              <ImageUploadMenu
                onSelectOption={handleUploadOptionSelect}
                onClose={() => setShowUploadMenu(false)}
              />
            )}
          </div>

          <h2>選擇風格</h2>
          <div className="style-options">
            {styleOptions.map(style => (
              <div
                key={style.id}
                className={`style-option ${selectedStyle === style.id ? 'selected' : ''}`}
                onClick={() => setSelectedStyle(style.id)}
              >
                <div className="style-name">{style.name}</div>
                <div className="style-description">{style.description}</div>
              </div>
            ))}
          </div>

          <button
            className="generate-button"
            onClick={handleGenerateImage}
            disabled={!characterImage || !selectedStyle || isGenerating}
          >
            {isGenerating ? '生成中...' : '生成圖片'}
          </button>

          {isGenerating && (
            <div className="generation-status">
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{ width: `${generationProgress}%` }}
                ></div>
              </div>
              <div className="status-text">
                <span>{generationStatus}</span>
                <span>{generationElapsedTime}秒</span>
              </div>
            </div>
          )}
        </div>

        {generatedImage && (
          <div className="character-result-section">
            <div className="generated-image-container">
              <img src={generatedImage} alt="生成的角色" className="generated-image" />

              <div className="image-actions">
                <button onClick={() => window.open(generatedImage, '_blank')}>
                  查看原圖
                </button>
                <button onClick={() => {
                  const link = document.createElement('a');
                  link.href = generatedImage;
                  link.download = '角色圖像.png';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}>
                  下載圖片
                </button>
              </div>
            </div>

            <button
              className="character-setting-button"
              onClick={handleStartCharacterSetting}
              disabled={isSettingCharacter}
            >
              角色設定
            </button>
          </div>
        )}

        {isSettingCharacter && (
          <div className="character-setting-section">
            <div className="chat-messages">
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
                >
                  {message.text}
                </div>
              ))}
            </div>

            {characterSetting ? (
              <div className="character-setting-result">
                <h3>角色設定</h3>
                <div className="setting-content">
                  {characterSetting.split('\n').map((line, index) => {
                    // 檢查是否為主要部分標題（如【第一部分：角色外部特質】）
                    if (/【第[一二三]部分：.*】/.test(line)) {
                      return <h3 key={index} className="setting-main-title">{line}</h3>;
                    }
                    // 檢查是否為標題行（數字開頭的行）
                    else if (/^\d+\./.test(line)) {
                      return <h4 key={index} className="setting-section-title">{line}</h4>;
                    }
                    // 檢查是否為子標題（帶有冒號的行）
                    else if (/:/.test(line) && line.length < 80) {
                      const [title, content] = line.split(/:(.*)/);
                      return (
                        <div key={index} className="setting-item">
                          <span className="setting-item-title">{title}:</span>
                          {content}
                        </div>
                      );
                    }
                    // 普通段落
                    else {
                      return <p key={index}>{line}</p>;
                    }
                  })}
                </div>
                <div className="setting-actions">
                  <button onClick={() => {
                    // 複製到剪貼板
                    navigator.clipboard.writeText(characterSetting)
                      .then(() => alert('角色設定已複製到剪貼板'))
                      .catch(err => console.error('複製失敗:', err));
                  }}>
                    複製設定
                  </button>
                  <button
                    className="save-button"
                    onClick={handleSaveCharacter}
                  >
                    儲存角色
                  </button>
                  <button onClick={() => {
                    // 重置角色設定
                    setCharacterSetting(null);
                    setChatMessages([]);
                    setCurrentQuestion(0);
                    setIsSettingCharacter(false);
                  }}>
                    重新設定
                  </button>
                </div>
              </div>
            ) : (
              <div className="chat-input">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="輸入您的回答..."
                  rows="3"
                />
                <button onClick={handleSendMessage}>發送</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 拍照組件 */}
      {showWebcam && (
        <WebcamCapture
          onCapture={handleCapture}
          onClose={() => setShowWebcam(false)}
        />
      )}

      {/* URL 輸入組件 */}
      {showUrlInput && (
        <ImageUrlInput
          onSubmit={handleUrlImage}
          onClose={() => setShowUrlInput(false)}
        />
      )}

      {/* 角色模板選擇組件 */}
      {showTemplateSelection && (
        <div className="template-selection-overlay">
          <div className="template-selection-container">
            <div className="template-header">
              <h2>選擇角色設定模板</h2>
              <div className="studio-branding">
                <span className="studio-name">北京影室創作坊</span>
                <span className="studio-tagline">專業角色設計與塑造</span>
              </div>
            </div>

            <p className="template-intro">
              選擇一個適合您角色的模板，北京影室創作坊的創作大師將通過四輪引導式問答，從不同面向探索角色特質。
              每一輪問答都由 deepseek-chat 大模型根據您的回答動態生成，最終將完整呈現角色的外部特質（100字）、
              內部特質（100字）和人物傳記（600字）。
            </p>

            <div className="template-options">
              {characterTemplates.map(template => (
                <div
                  key={template.id}
                  className="template-option"
                  onClick={() => handleSelectTemplate(template.id)}
                >
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                  <div className="template-questions-preview">
                    <span>將探討的方向：</span>
                    <ul>
                      {template.questions.map((q, i) => (
                        <li key={i}>{q.split('。')[0]}。</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="template-footer">
              <button
                className="close-button"
                onClick={() => setShowTemplateSelection(false)}
              >
                取消
              </button>
              <div className="template-footer-note">
                由 deepseek-chat 大模型提供支持
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterGenerator;
