import axios from 'axios';
import supabase, { checkSupabaseConnection } from './supabase';

// API 密鑰和配置應該從環境變數來，這裡暫時硬編碼 (在實際應用中請使用 .env 文件)
// Deepseek API 設定
const DEEPSEEK_API_URL = import.meta.env.VITE_DEEPSEEK_API_URL || 'https://api.deepseek.com';
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || 'sk-185a52088452434dbc6806b2c5d2f621';
const DEEPSEEK_MODEL = import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat';

// OpenAI API 設定
const OPENAI_OFFICIAL_API_URL = import.meta.env.VITE_OPENAI_OFFICIAL_API_URL || 'https://api.openai.com';
const OPENAI_PROXY_API_URL = import.meta.env.VITE_OPENAI_PROXY_API_URL || 'https://zzzzapi.com';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || 'sk-OGysI6RuRDR6NDKZPd9lvzN36lspNNSeeKqw9tKmk2u0y13d';
const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-image-vip';

// 發送訊息到 Deepseek API 進行文字對話
export const sendMessageToDeepseek = async (message, previousMessages) => {
  try {
    // 將之前的對話轉換為 Deepseek API 所需的格式
    const messages = [
      { role: 'system', content: '你是一個友善的圖像生成助手，幫助用戶描述他們想要的圖像。你應該詢問細節，如場景、風格、角色、氛圍等，以便更好地理解用戶的需求。' },
      ...previousMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: 'user', content: message }
    ];

    console.log('Sending message to Deepseek API...');
    console.log('API URL:', `${DEEPSEEK_API_URL}/v1/chat/completions`);
    console.log('Model:', DEEPSEEK_MODEL);

    const requestBody = {
      model: DEEPSEEK_MODEL,
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: false
    };

    console.log('Request Payload:', JSON.stringify(requestBody));

    const response = await axios.post(
      `${DEEPSEEK_API_URL}/v1/chat/completions`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        }
      }
    );

    console.log('Deepseek API response:', JSON.stringify(response.data));

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('無法從 Deepseek API 獲取有效的回應');
    }
  } catch (error) {
    console.error('Error calling Deepseek API:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data));
    }
    throw error;
  }
};

// 使用 OpenAI API 生成圖像
export const generateImageWithOpenAI = async (prompt, referenceImageUrl = null) => {
  try {
    // 使用中轉地址
    const apiUrl = `${OPENAI_PROXY_API_URL}/v1/chat/completions`;
    console.log('使用 API 地址:', OPENAI_PROXY_API_URL);
    console.log('使用 API 密鑰:', OPENAI_API_KEY.substring(0, 10) + '...');

    console.log('Sending image generation request to OpenAI API...');
    console.log('API URL:', apiUrl);
    console.log('Model:', OPENAI_MODEL);
    console.log('提示詞長度:', prompt.length);

    // 檢查提示詞長度，如果太長則截斷
    const maxPromptLength = 4000;
    const trimmedPrompt = prompt.length > maxPromptLength
      ? prompt.substring(0, maxPromptLength) + '...(已截斷)'
      : prompt;

    // 準備訊息內容
    const messages = [
      {
        role: 'system',
        content: '你是一個專業的圖像生成助手，根據用戶的描述生成高品質圖像。請只回傳一張圖片。'
      }
    ];

    // 如果有參考圖片，則添加到訊息中
    if (referenceImageUrl) {
      // 檢查參考圖片URL是否有效
      if (!referenceImageUrl.startsWith('http') && !referenceImageUrl.startsWith('data:')) {
        console.error('參考圖片URL無效:', referenceImageUrl.substring(0, 50) + '...');
        throw new Error('參考圖片URL無效');
      }

      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: `請根據以下描述生成一張圖像：\n\n${trimmedPrompt}` },
          { type: 'image_url', image_url: { url: referenceImageUrl } }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: `請根據以下描述生成一張圖像：\n\n${trimmedPrompt}`
      });
    }

    const requestBody = {
      model: OPENAI_MODEL,
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000
    };

    console.log('Request Body (部分):', JSON.stringify({
      model: requestBody.model,
      temperature: requestBody.temperature,
      max_tokens: requestBody.max_tokens,
      messages: [
        requestBody.messages[0],
        {
          role: 'user',
          content: referenceImageUrl ? '[包含文本和圖像]' : '[僅文本]'
        }
      ]
    }));

    // 實際 API 調用
    console.log('開始發送請求...');
    const response = await axios.post(
      apiUrl,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        timeout: 600000 // 設置600秒(10分鐘)超時，確保有足夠時間處理複雜圖像生成
      }
    );

    console.log('收到API響應，狀態碼:', response.status);

    // 檢查響應是否包含數據
    if (!response.data) {
      console.error('API響應不包含數據');
      throw new Error('API響應不包含數據');
    }

    console.log('響應數據類型:', typeof response.data);
    console.log('響應數據結構:', Object.keys(response.data).join(', '));

    if (response.data.choices && response.data.choices.length > 0) {
      console.log('響應包含選項數量:', response.data.choices.length);
      console.log('第一個選項類型:', typeof response.data.choices[0]);
      console.log('第一個選項結構:', Object.keys(response.data.choices[0]).join(', '));

      if (response.data.choices[0].message) {
        console.log('消息類型:', typeof response.data.choices[0].message);
        console.log('消息結構:', Object.keys(response.data.choices[0].message).join(', '));
        console.log('內容類型:', typeof response.data.choices[0].message.content);
      }
    }

    // 處理不同的響應格式
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const messageContent = response.data.choices[0].message.content;
      console.log('消息內容類型:', typeof messageContent);

      // 處理字符串格式的響應
      if (typeof messageContent === 'string') {
        console.log('消息內容(部分):', messageContent.substring(0, 100) + '...');
        // 從文本中嘗試提取 URL
        const urlMatch = messageContent.match(/(https?:\/\/[^\s]+)/g);
        if (urlMatch && urlMatch.length > 0) {
          console.log('從文本中提取到URL:', urlMatch[0]);
          return urlMatch[0];
        } else {
          console.error('無法從文本中提取URL');
        }
      }
      // 處理數組格式的響應
      else if (Array.isArray(messageContent)) {
        console.log('消息內容是數組，長度:', messageContent.length);
        const imageItem = messageContent.find(item => item.type === 'image_url');
        if (imageItem && imageItem.image_url && imageItem.image_url.url) {
          console.log('從數組中提取到URL:', imageItem.image_url.url);
          return imageItem.image_url.url;
        } else {
          console.error('無法從數組中提取URL');
        }
      } else {
        console.error('未知的消息內容格式');
      }
    } else {
      console.error('響應不包含有效的選項');
    }

    // 如果無法從標準格式中獲取 URL，嘗試從整個響應中查找
    const responseStr = JSON.stringify(response.data);
    console.log('嘗試從完整響應中查找URL');
    const urlMatch = responseStr.match(/"url":"(https?:\/\/[^"]+)"/);
    if (urlMatch && urlMatch.length > 1) {
      console.log('從完整響應中提取到URL:', urlMatch[1]);
      return urlMatch[1];
    } else {
      console.error('無法從完整響應中提取URL');
    }

    // 如果仍然找不到 URL，則拋出錯誤
    throw new Error('無法從 API 響應中提取圖像 URL');
  } catch (error) {
    console.error('生成圖像時出錯:', error.message);
    if (error.response) {
      console.error('響應狀態碼:', error.response.status);
      console.error('響應數據:', JSON.stringify(error.response.data));
    } else if (error.request) {
      console.error('未收到響應，請求詳情:', error.request);
    } else {
      console.error('錯誤詳情:', error);
    }
    throw new Error(`生成圖像失敗: ${error.message}`);
  }
};

// 生成表情貼圖
export const generateStickerImage = async (sourceImageUrl, templateId, stickerSize, stickerFormat, userPrompt = '', styleInfo = null, realismLevel = 50) => {
  try {
    console.log('開始生成表情貼圖...');
    console.log('來源圖片:', sourceImageUrl);
    console.log('表情模板ID:', templateId);
    console.log('貼圖尺寸:', stickerSize);
    console.log('貼圖格式:', stickerFormat);
    console.log('用戶提示:', userPrompt);
    console.log('風格信息:', styleInfo);
    console.log('真實感百分比:', realismLevel);

    // 使用中轉地址
    const apiUrl = `${OPENAI_PROXY_API_URL}/v1/chat/completions`;

    // 根據模板ID獲取表情名稱
    const templateName = getTemplateNameById(templateId);

    // 構建基本提示詞
    let prompt = `請將提供的照片轉換為"${templateName}"表情的貼圖。
    保持人物的臉部特徵，但添加${templateName}表情的元素。
    生成的貼圖應該是${stickerSize}尺寸，${stickerFormat === 'png' ? '帶透明背景' : ''}。
    請確保表情生動自然，風格一致，並保留原始照片的主要特徵。`;

    // 根據尺寸添加不同的指導
    if (stickerSize === '240x240' || stickerSize === '370x320' || stickerSize === '96x74') {
      prompt += `
      這是LINE貼圖標準尺寸，請在圖片周圍留有適當的留白（約10像素），確保貼圖在聊天中顯示美觀。
      貼圖應該易於日常對話中使用，表情和訊息應該淺顯易懂。`;
    } else if (stickerSize === '1024x1024' || stickerSize === '768x768' || stickerSize === '512x512') {
      prompt += `
      這是標準方形尺寸，請確保圖像清晰且細節豐富，適合作為高質量的表情圖片。`;
    } else if (stickerSize === '800x600' || stickerSize === '1280x720') {
      prompt += `
      這是寬幅矩形尺寸，請確保圖像構圖合理，主體內容居中或遵循三分法則，適合作為橫向展示的表情圖片。`;
    }

    prompt += `
    真實感程度: ${realismLevel}%（0%表示完全卡通風格，100%表示完全真實照片風格）`;

    // 如果選擇了風格，添加風格提示
    if (styleInfo) {
      prompt += `\n\n貼圖風格: ${styleInfo.name} (${styleInfo.mainStyleName})
      風格描述: ${styleInfo.description}
      風格提示: ${styleInfo.promptHint}`;
    }

    // 如果用戶提供了自定義提示，則添加到提示詞中
    if (userPrompt && userPrompt.trim()) {
      prompt += `\n\n用戶特別要求: ${userPrompt.trim()}`;
    }

    // 準備訊息內容
    const messages = [
      {
        role: 'system',
        content: '你是一個專業的表情貼圖生成助手，能夠將用戶提供的照片轉換為各種表情貼圖。請只回傳一張圖片。'
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: sourceImageUrl } }
        ]
      }
    ];

    const requestBody = {
      model: OPENAI_MODEL,
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000
    };

    console.log('發送表情貼圖生成請求...');

    // 實際 API 調用
    const response = await axios.post(
      apiUrl,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
      }
    );

    console.log('表情貼圖生成響應接收到:', JSON.stringify(response.data));

    // 處理不同的響應格式
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const messageContent = response.data.choices[0].message.content;

      // 處理字符串格式的響應
      if (typeof messageContent === 'string') {
        // 從文本中嘗試提取 URL
        const urlMatch = messageContent.match(/(https?:\/\/[^\s]+)/g);
        if (urlMatch && urlMatch.length > 0) {
          return {
            imageUrl: urlMatch[0],
            templateId: templateId,
            templateName: templateName,
            size: stickerSize,
            format: stickerFormat
          };
        }
      }
      // 處理數組格式的響應
      else if (Array.isArray(messageContent)) {
        const imageItem = messageContent.find(item => item.type === 'image_url');
        if (imageItem && imageItem.image_url && imageItem.image_url.url) {
          return {
            imageUrl: imageItem.image_url.url,
            templateId: templateId,
            templateName: templateName,
            size: stickerSize,
            format: stickerFormat
          };
        }
      }
    }

    // 如果無法從標準格式中獲取 URL，嘗試從整個響應中查找
    const responseStr = JSON.stringify(response.data);
    const urlMatch = responseStr.match(/"url":"(https?:\/\/[^"]+)"/);
    if (urlMatch && urlMatch.length > 1) {
      return {
        imageUrl: urlMatch[1],
        templateId: templateId,
        templateName: templateName,
        size: stickerSize,
        format: stickerFormat
      };
    }

    // 如果仍然找不到 URL，則拋出錯誤
    throw new Error('無法從 API 響應中提取表情貼圖 URL');
  } catch (error) {
    console.error('生成表情貼圖時出錯:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data));
    }
    throw error;
  }
};

// 根據風格生成文字參數建議
export const generateTextPromptSuggestions = async (styleInfo) => {
  try {
    console.log('開始生成文字參數建議...');
    console.log('風格信息:', styleInfo);

    if (!styleInfo) {
      throw new Error('未提供風格信息');
    }

    // 構建提示詞
    const prompt = `請為我生成20組不同的文字參數，用於生成LINE表情貼圖。

    風格類型: ${styleInfo.mainStyleName}
    子風格: ${styleInfo.name}
    風格描述: ${styleInfo.description}
    風格提示: ${styleInfo.promptHint}

    每個文字參數應該:
    1. 具體描述表情貼圖的視覺風格、情緒表達方式或特殊效果
    2. 長度在20-50字之間，簡潔有力
    3. 符合所選風格的特點和市場需求
    4. 能夠指導AI生成高質量、有吸引力的表情貼圖
    5. 每個參數都應該有所不同，覆蓋不同的風格變化或表現方式

    請以編號列表形式輸出，每個參數一行，不要有多餘的解釋。`;

    // 使用 Deepseek API 生成建議
    const messages = [
      {
        role: 'system',
        content: '你是一個專業的表情貼圖設計師，擅長為不同風格的貼圖提供具體的文字參數建議。你的建議應該簡潔、具體、多樣化，並且符合市場需求。'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    console.log('發送請求到 DeepSeek API...');
    const response = await axios.post(
      `${DEEPSEEK_API_URL}/v1/chat/completions`,
      {
        model: DEEPSEEK_MODEL,
        messages: messages,
        temperature: 0.8,
        max_tokens: 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        }
      }
    );

    if (!response.data || !response.data.choices || !response.data.choices[0]) {
      console.error('DeepSeek API 回應無效:', response.data);
      throw new Error('無法從 API 獲取有效的回應');
    }

    const suggestionsText = response.data.choices[0].message.content;
    console.log('成功從 DeepSeek 獲取文字參數建議');

    // 解析建議文本為數組
    const suggestions = parsePromptSuggestions(suggestionsText);

    return suggestions;
  } catch (error) {
    console.error('生成文字參數建議時出錯:', error);
    throw error;
  }
};

// 解析文字參數建議
function parsePromptSuggestions(suggestionsText) {
  try {
    // 嘗試匹配編號列表格式 (1. xxx, 2. xxx, 等)
    const numberedListRegex = /\d+[\.\)]\s*(.+?)(?=\n\d+[\.\)]|$)/g;
    let match;
    const suggestions = [];

    while ((match = numberedListRegex.exec(suggestionsText)) !== null) {
      if (match[1] && match[1].trim()) {
        suggestions.push(match[1].trim());
      }
    }

    // 如果沒有匹配到編號列表，嘗試按行分割
    if (suggestions.length === 0) {
      const lines = suggestionsText.split('\n').filter(line => line.trim());
      for (const line of lines) {
        // 移除可能的編號前綴
        const cleanLine = line.replace(/^\d+[\.\)]\s*/, '').trim();
        if (cleanLine) {
          suggestions.push(cleanLine);
        }
      }
    }

    // 確保只返回最多20個建議
    return suggestions.slice(0, 20);
  } catch (error) {
    console.error('解析文字參數建議時出錯:', error);
    return [];
  }
}

// 批量生成表情貼圖
export const generateMultipleStickers = async (sourceImageUrl, templateIds, stickerSize, stickerFormat, userPrompt = '', styleInfo = null, realismLevel = 50) => {
  try {
    console.log('開始批量生成表情貼圖...');
    console.log('選擇的模板數量:', templateIds.length);
    console.log('用戶提示:', userPrompt);
    console.log('風格信息:', styleInfo);
    console.log('真實感百分比:', realismLevel);

    // 創建一個Promise數組來並行處理多個請求
    const stickerPromises = templateIds.map(templateId =>
      generateStickerImage(sourceImageUrl, templateId, stickerSize, stickerFormat, userPrompt, styleInfo, realismLevel)
    );

    // 等待所有請求完成
    const results = await Promise.allSettled(stickerPromises);

    // 處理結果
    const successfulStickers = [];
    const failedTemplateIds = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulStickers.push(result.value);
      } else {
        console.error(`模板ID ${templateIds[index]} 生成失敗:`, result.reason);
        failedTemplateIds.push(templateIds[index]);
      }
    });

    console.log(`批量生成完成。成功: ${successfulStickers.length}, 失敗: ${failedTemplateIds.length}`);

    return {
      stickers: successfulStickers,
      failedTemplateIds: failedTemplateIds
    };
  } catch (error) {
    console.error('批量生成表情貼圖時出錯:', error);
    throw error;
  }
};

// 根據模板ID獲取模板名稱的輔助函數
function getTemplateNameById(templateId) {
  // 這裡應該從某個地方獲取模板名稱，暫時使用硬編碼的映射
  const templateNames = {
    1: '開心', 2: '大笑', 3: '驚訝', 4: '疑惑', 5: '思考',
    6: '無奈', 7: '哭泣', 8: '大哭', 9: '生氣', 10: '憤怒',
    11: '害羞', 12: '愛心', 13: '得意', 14: '嘲笑', 15: '無聊',
    16: '睡覺', 17: '驚恐', 18: '尷尬', 19: '冷汗', 20: '嘆氣',
    21: '期待', 22: '驕傲', 23: '委屈', 24: '感動', 25: '困惑',
    26: '不屑', 27: '調皮', 28: '陶醉', 29: '緊張', 30: '興奮',
    31: '無辜', 32: '沮喪', 33: '滿足', 34: '懷疑', 35: '嫌棄',
    36: '驚喜', 37: '佩服', 38: '心碎', 39: '鬼臉', 40: '贊同'
  };

  return templateNames[templateId] || '未知表情';
}

// 使用 deepseek-chat 生成角色提示詞
export const generatePromptWithDeepseek = async (basePrompt, backgroundPrompt, themeName) => {
  try {
    console.log('開始生成角色提示詞...');
    console.log('基礎提示詞:', basePrompt);
    console.log('背景提示詞:', backgroundPrompt);
    console.log('主題名稱:', themeName);

    // 構建系統提示詞
    const systemPrompt = `你是一個專業的圖像生成提示詞專家，能夠根據基礎提示詞生成更詳細的變體。
請根據我提供的基礎提示詞和背景提示詞，生成一個更詳細、更具創意的提示詞變體。
這個變體應該保持原始提示詞的核心意圖和主題風格，但在表達方式、細節描述或場景設定上有所變化，以產生更豐富的結果。
請直接返回完整的提示詞變體，不要有其他解釋性文字。`;

    // 構建用戶提示詞
    const userPrompt = `基礎提示詞：${basePrompt}
背景提示詞：${backgroundPrompt}
主題風格：${themeName}

請生成一個更詳細、更具創意的提示詞變體，保持核心意圖和主題風格，但在表達方式、細節或場景設定上有所變化。`;

    // 準備訊息內容
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    console.log('發送請求到 DeepSeek API...');
    const response = await axios.post(
      `${DEEPSEEK_API_URL}/v1/chat/completions`,
      {
        model: DEEPSEEK_MODEL,
        messages: messages,
        temperature: 0.8,
        max_tokens: 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        }
      }
    );

    if (!response.data || !response.data.choices || !response.data.choices[0]) {
      console.error('DeepSeek API 回應無效:', response.data);
      throw new Error('無法從 API 獲取有效的回應');
    }

    const variantPrompt = response.data.choices[0].message.content;
    console.log('成功從 DeepSeek 獲取變體提示詞');

    return variantPrompt.trim();
  } catch (error) {
    console.error('生成變體提示詞時出錯:', error);
    // 如果出錯，返回原始提示詞
    return basePrompt;
  }
};

// 使用 deepseek-chat 生成變體 prompts
export const generateVariantPrompts = async (basePrompt, variantCount = 3) => {
  try {
    console.log('開始生成變體 prompts...');
    console.log('基礎 prompt:', basePrompt);
    console.log('變體數量:', variantCount);

    // 構建系統提示詞
    const systemPrompt = `你是一個專業的圖像生成提示詞專家，能夠根據基礎提示詞生成多樣化的變體。
請根據我提供的基礎提示詞，生成 ${variantCount} 個變體提示詞。
這些變體應該保持原始提示詞的核心意圖，但在表達方式、細節描述或風格上有所變化，以產生多樣化的結果。
每個變體都應該是完整的提示詞，而不僅僅是修改建議。
請直接返回這 ${variantCount} 個變體提示詞，每個變體用數字編號並換行分隔，不要有其他解釋性文字。`;

    // 構建用戶提示詞
    const userPrompt = `基礎提示詞：${basePrompt}

請生成 ${variantCount} 個變體提示詞，保持核心意圖但在表達方式、細節或風格上有所變化。`;

    // 準備訊息內容
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    console.log('發送請求到 DeepSeek API...');
    const response = await axios.post(
      `${DEEPSEEK_API_URL}/v1/chat/completions`,
      {
        model: DEEPSEEK_MODEL,
        messages: messages,
        temperature: 0.8,
        max_tokens: 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        }
      }
    );

    if (!response.data || !response.data.choices || !response.data.choices[0]) {
      console.error('DeepSeek API 回應無效:', response.data);
      throw new Error('無法從 API 獲取有效的回應');
    }

    const variantsText = response.data.choices[0].message.content;
    console.log('成功從 DeepSeek 獲取變體提示詞');

    // 解析變體提示詞
    const variants = parseVariantPrompts(variantsText, variantCount);
    return variants;
  } catch (error) {
    console.error('生成變體提示詞時出錯:', error);
    // 如果出錯，返回簡單的變體
    return Array(variantCount).fill(basePrompt).map((prompt, index) =>
      `${prompt} (變體 ${index + 1})`
    );
  }
};

// 解析變體提示詞的輔助函數
function parseVariantPrompts(text, expectedCount) {
  try {
    // 嘗試使用正則表達式匹配數字編號的提示詞
    const regex = /\d+[\.\):]?\s*(.*?)(?=\n\d+[\.\):]?|$)/gs;
    const matches = [...text.matchAll(regex)];

    const variants = matches.map(match => match[1].trim());

    // 如果找到的變體數量不符合預期，使用簡單的分行解析
    if (variants.length !== expectedCount) {
      const lines = text.split('\n').filter(line => line.trim());
      return lines.slice(0, expectedCount).map(line => {
        // 移除行首的數字和標點
        return line.replace(/^\d+[\.\):]?\s*/, '').trim();
      });
    }

    return variants;
  } catch (error) {
    console.error('解析變體提示詞時出錯:', error);
    // 如果解析出錯，返回原始文本按行分割
    return text.split('\n')
      .filter(line => line.trim())
      .slice(0, expectedCount);
  }
}

// 使用 GPT-4o-image-vip 分析圖像並生成描述
export const analyzeImageWithGPT4o = async (imageUrl) => {
  try {
    console.log('開始使用 GPT-4o 分析圖像:', imageUrl);

    // 使用中轉地址
    const apiUrl = `${OPENAI_PROXY_API_URL}/v1/chat/completions`;

    // 準備訊息內容
    const messages = [
      {
        role: 'system',
        content: '你是一個專業的圖像分析助手，請分析提供的圖像並給出簡潔的描述。描述應該包含圖像的主要內容、風格和特點，限制在100字以內。'
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: '請分析這張圖像並給出簡潔的描述，包含圖像的主要內容、風格和特點。' },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }
    ];

    const requestBody = {
      model: OPENAI_MODEL,
      messages: messages,
      temperature: 0.7,
      max_tokens: 300
    };

    // 實際 API 調用
    const response = await axios.post(
      apiUrl,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
      }
    );

    console.log('Image analysis response received');

    // 提取描述文本
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const description = response.data.choices[0].message.content;
      return description.trim();
    }

    throw new Error('無法從 API 響應中提取圖像描述');
  } catch (error) {
    console.error('Error analyzing image with GPT-4o:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data));
    }
    return '無法分析圖像';
  }
};

// 檢查 API 狀態
export const checkApiStatus = async () => {
  try {
    // 構建狀態結果對象
    let result = {
      deepseek: 'unknown',
      openai: 'unknown',
      supabase: 'unknown'
    };

    // 檢查 Deepseek API 狀態
    try {
      const deepseekResponse = await axios.get(`${DEEPSEEK_API_URL}/v1/models`, {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        timeout: 5000 // 5秒超時
      });

      // 檢查是否能獲取到 deepseek-chat 模型
      if (
        deepseekResponse.data &&
        deepseekResponse.data.data &&
        deepseekResponse.data.data.some(model => model.id === DEEPSEEK_MODEL)
      ) {
        result.deepseek = 'active';
      } else {
        result.deepseek = 'inactive';
      }
    } catch (error) {
      if (error.response) {
        // 如果有響應但不是 200 OK
        result.deepseek = 'inactive';
      } else if (error.request) {
        // 如果沒有收到響應
        result.deepseek = 'offline';
      } else {
        result.deepseek = 'inactive';
      }
    }

    // 檢查 OpenAI API 狀態
    try {
      const openaiResponse = await axios.get(`${OPENAI_PROXY_API_URL}/v1/models`, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        timeout: 5000 // 5秒超時
      });

      // 檢查是否能獲取到模型列表
      if (openaiResponse.data && openaiResponse.data.data && openaiResponse.data.data.length > 0) {
        result.openai = 'active';
      } else {
        result.openai = 'inactive';
      }
    } catch (error) {
      if (error.response) {
        // 如果有響應但不是 200 OK
        result.openai = 'inactive';
      } else if (error.request) {
        // 如果沒有收到響應
        result.openai = 'offline';
      } else {
        result.openai = 'inactive';
      }
    }

    // 檢查 Supabase 連接
    try {
      const supabaseStatus = await checkSupabaseConnection();
      result.supabase = supabaseStatus ? 'active' : 'inactive';
    } catch (error) {
      result.supabase = 'offline';
    }

    return result;
  } catch (error) {
    console.error('Error checking API statuses:', error);
    return {
      deepseek: 'unknown',
      openai: 'unknown',
      supabase: 'unknown'
    };
  }
};

// 檢查並創建必要的表
export const ensureTablesExist = async () => {
  try {
    console.log('檢查必要的表是否存在...');

    // 檢查 case_studies 表
    const { error: caseStudiesError } = await supabase
      .from('case_studies')
      .select('count')
      .limit(1);

    if (caseStudiesError && caseStudiesError.code === '42P01') {
      console.log('case_studies 表不存在，嘗試創建...');

      try {
        // 直接使用 SQL 創建表 - 方法 1
        console.log('使用方法 1 創建 case_studies 表...');
        const { error: sqlError1 } = await supabase.rpc('execute_sql', {
          sql: `
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

            CREATE TABLE IF NOT EXISTS public.case_studies (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              title TEXT NOT NULL,
              prompt TEXT NOT NULL,
              image_url TEXT NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
            );

            ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;

            DROP POLICY IF EXISTS "Allow anonymous access" ON public.case_studies;
            CREATE POLICY "Allow anonymous access" ON public.case_studies
              FOR ALL
              TO anon
              USING (true)
              WITH CHECK (true);
          `
        });

        if (sqlError1) {
          console.error('方法 1 創建 case_studies 表失敗:', sqlError1);

          // 直接使用 SQL 創建表 - 方法 2
          console.log('使用方法 2 創建 case_studies 表...');
          const response = await fetch('https://qzdiyunmopvjktzqywkx.supabase.co/rest/v1/rpc/execute_sql', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6ZGl5dW5tb3B2amt0enF5d2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4NDExMzMsImV4cCI6MjA2MTQxNzEzM30.unnQGExrfHsOmlwgI6lvHD55vjruH5jvz8Y9kuBDjPM',
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6ZGl5dW5tb3B2amt0enF5d2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4NDExMzMsImV4cCI6MjA2MTQxNzEzM30.unnQGExrfHsOmlwgI6lvHD55vjruH5jvz8Y9kuBDjPM'
            },
            body: JSON.stringify({
              sql: `
                CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

                CREATE TABLE IF NOT EXISTS public.case_studies (
                  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                  title TEXT NOT NULL,
                  prompt TEXT NOT NULL,
                  image_url TEXT NOT NULL,
                  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
                );

                ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;

                DROP POLICY IF EXISTS "Allow anonymous access" ON public.case_studies;
                CREATE POLICY "Allow anonymous access" ON public.case_studies
                  FOR ALL
                  TO anon
                  USING (true)
                  WITH CHECK (true);
              `
            })
          });

          if (!response.ok) {
            console.error('方法 2 創建 case_studies 表失敗:', await response.text());
          } else {
            console.log('方法 2 創建 case_studies 表成功');
          }
        } else {
          console.log('方法 1 創建 case_studies 表成功');
        }
      } catch (createError) {
        console.error('創建 case_studies 表時出錯:', createError);
      }
    } else {
      console.log('case_studies 表已存在');
    }

    // 檢查 prompt_templates 表
    const { error: promptTemplatesError } = await supabase
      .from('prompt_templates')
      .select('count')
      .limit(1);

    if (promptTemplatesError && promptTemplatesError.code === '42P01') {
      console.log('prompt_templates 表不存在，嘗試創建...');

      try {
        // 直接使用 SQL 創建表 - 方法 1
        console.log('使用方法 1 創建 prompt_templates 表...');
        const { error: sqlError1 } = await supabase.rpc('execute_sql', {
          sql: `
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

            CREATE TABLE IF NOT EXISTS public.prompt_templates (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              title TEXT NOT NULL,
              content TEXT NOT NULL,
              category TEXT DEFAULT 'general',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
            );

            ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;

            DROP POLICY IF EXISTS "Allow anonymous access" ON public.prompt_templates;
            CREATE POLICY "Allow anonymous access" ON public.prompt_templates
              FOR ALL
              TO anon
              USING (true)
              WITH CHECK (true);
          `
        });

        if (sqlError1) {
          console.error('方法 1 創建 prompt_templates 表失敗:', sqlError1);

          // 直接使用 SQL 創建表 - 方法 2
          console.log('使用方法 2 創建 prompt_templates 表...');
          const response = await fetch('https://qzdiyunmopvjktzqywkx.supabase.co/rest/v1/rpc/execute_sql', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6ZGl5dW5tb3B2amt0enF5d2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4NDExMzMsImV4cCI6MjA2MTQxNzEzM30.unnQGExrfHsOmlwgI6lvHD55vjruH5jvz8Y9kuBDjPM',
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6ZGl5dW5tb3B2amt0enF5d2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4NDExMzMsImV4cCI6MjA2MTQxNzEzM30.unnQGExrfHsOmlwgI6lvHD55vjruH5jvz8Y9kuBDjPM'
            },
            body: JSON.stringify({
              sql: `
                CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

                CREATE TABLE IF NOT EXISTS public.prompt_templates (
                  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                  title TEXT NOT NULL,
                  content TEXT NOT NULL,
                  category TEXT DEFAULT 'general',
                  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
                );

                ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;

                DROP POLICY IF EXISTS "Allow anonymous access" ON public.prompt_templates;
                CREATE POLICY "Allow anonymous access" ON public.prompt_templates
                  FOR ALL
                  TO anon
                  USING (true)
                  WITH CHECK (true);
              `
            })
          });

          if (!response.ok) {
            console.error('方法 2 創建 prompt_templates 表失敗:', await response.text());
          } else {
            console.log('方法 2 創建 prompt_templates 表成功');
          }
        } else {
          console.log('方法 1 創建 prompt_templates 表成功');
        }
      } catch (createError) {
        console.error('創建 prompt_templates 表時出錯:', createError);
      }
    } else {
      console.log('prompt_templates 表已存在');
    }

    return true;
  } catch (error) {
    console.error('檢查和創建表時出錯:', error);
    return false;
  }
};

// 儲存案例到 Supabase (先前是本地存儲)
export const saveCase = async (caseData) => {
  try {
    console.log('開始保存案例到 Supabase:', caseData);

    // 檢查必要的字段
    if (!caseData.name && !caseData.title) {
      console.error('案例缺少標題');
      throw new Error('案例缺少標題');
    }

    if (!caseData.prompt) {
      console.error('案例缺少提示詞');
      throw new Error('案例缺少提示詞');
    }

    if (!caseData.imageUrl) {
      console.error('案例缺少圖像URL');
      throw new Error('案例缺少圖像URL');
    }

    // 準備要插入的數據
    const insertData = {
      id: caseData.id || crypto.randomUUID(), // 添加 id 字段
      title: caseData.title || caseData.name,
      prompt: caseData.prompt,
      image_url: caseData.imageUrl,
      created_at: new Date().toISOString()
    };

    console.log('準備插入的數據:', insertData);

    // 嘗試使用 Supabase 存儲
    console.log('使用 Supabase 客戶端:', supabase);
    console.log('嘗試插入到表:', 'case_studies');

    // 嘗試使用 upsert 而不是 insert
    const { data, error } = await supabase
      .from('case_studies')
      .upsert([insertData], { onConflict: 'id' });

    if (error) {
      console.error('Supabase 插入錯誤:', error);
      console.error('錯誤詳情:', error.message, error.details, error.hint);

      // 檢查是否是表不存在的錯誤
      if (error.code === '42P01') {
        console.log('表不存在，嘗試創建表...');
        await ensureTablesExist();

        // 重新嘗試插入
        console.log('重新嘗試插入數據...');
        const retryResult = await supabase
          .from('case_studies')
          .insert([insertData]);

        if (retryResult.error) {
          console.error('重新嘗試插入失敗:', retryResult.error);
          throw retryResult.error;
        }

        console.log('重新嘗試插入成功:', retryResult.data);
        return retryResult.data;
      }

      throw error;
    }

    console.log('Supabase 保存成功:', data);
    return data;
  } catch (supabaseError) {
    console.error('Error saving to Supabase:', supabaseError);

    // 失敗時回退到本地存儲
    try {
      console.log('回退到本地存儲');
      const existingCases = JSON.parse(localStorage.getItem('cases') || '[]');
      const newCase = {
        id: Date.now().toString(),
        title: caseData.title || caseData.name,
        prompt: caseData.prompt,
        imageUrl: caseData.imageUrl,
        date: new Date().toISOString()
      };
      const updatedCases = [...existingCases, newCase];
      localStorage.setItem('cases', JSON.stringify(updatedCases));
      console.log('本地存儲成功');
      return newCase;
    } catch (localError) {
      console.error('Error saving to local storage:', localError);
      throw localError;
    }
  }
};

// 獲取案例列表 (優先從 Supabase 獲取，出錯時從本地獲取)
export const getCases = async () => {
  try {
    console.log('嘗試從 Supabase 獲取案例列表...');

    // 嘗試從 Supabase 獲取
    const { data, error } = await supabase
      .from('case_studies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('從 Supabase 獲取案例列表失敗:', error);

      // 檢查是否是表不存在的錯誤
      if (error.code === '42P01') {
        console.log('表不存在，嘗試創建表...');
        await ensureTablesExist();

        // 重新嘗試獲取
        console.log('重新嘗試獲取案例列表...');
        const retryResult = await supabase
          .from('case_studies')
          .select('*')
          .order('created_at', { ascending: false });

        if (retryResult.error) {
          console.error('重新嘗試獲取案例列表失敗:', retryResult.error);
          throw retryResult.error;
        }

        console.log('重新嘗試獲取案例列表成功:', retryResult.data);

        // 將 Supabase 數據格式轉換為應用格式
        return (retryResult.data || []).map(item => ({
          id: item.id,
          title: item.title,
          prompt: item.prompt,
          imageUrl: item.image_url,
          date: item.created_at
        }));
      }

      throw error;
    }

    console.log('從 Supabase 獲取案例列表成功:', data);

    // 將 Supabase 數據格式轉換為應用格式
    return (data || []).map(item => ({
      id: item.id,
      title: item.title,
      prompt: item.prompt,
      imageUrl: item.image_url,
      date: item.created_at
    }));
  } catch (supabaseError) {
    console.error('Error fetching from Supabase:', supabaseError);

    // 失敗時回退到本地存儲
    try {
      console.log('回退到本地存儲獲取案例列表');
      const localCases = JSON.parse(localStorage.getItem('cases') || '[]');
      console.log('從本地存儲獲取案例列表成功:', localCases);
      return localCases;
    } catch (localError) {
      console.error('Error reading from local storage:', localError);
      return [];
    }
  }
};

// 儲存提示範本到 Supabase (先前是本地存儲)
export const savePromptTemplate = async (templateData) => {
  try {
    console.log('開始保存提示範本到 Supabase:', templateData);

    // 檢查必要的字段
    if (!templateData.title) {
      console.error('提示範本缺少標題');
      throw new Error('提示範本缺少標題');
    }

    if (!templateData.content) {
      console.error('提示範本缺少內容');
      throw new Error('提示範本缺少內容');
    }

    // 準備要插入的數據
    const insertData = {
      id: templateData.id || crypto.randomUUID(), // 添加 id 字段
      title: templateData.title,
      content: templateData.content,
      category: templateData.category || 'general',
      created_at: new Date().toISOString()
    };

    console.log('準備插入的數據:', insertData);

    // 嘗試使用 Supabase 存儲
    console.log('使用 Supabase 客戶端:', supabase);
    console.log('嘗試插入到表:', 'prompt_templates');

    // 嘗試使用 upsert 而不是 insert
    const { data, error } = await supabase
      .from('prompt_templates')
      .upsert([insertData], { onConflict: 'id' });

    if (error) {
      console.error('Supabase 插入錯誤:', error);
      console.error('錯誤詳情:', error.message, error.details, error.hint);

      // 檢查是否是表不存在的錯誤
      if (error.code === '42P01') {
        console.log('表不存在，嘗試創建表...');
        await ensureTablesExist();

        // 重新嘗試插入
        console.log('重新嘗試插入數據...');
        const retryResult = await supabase
          .from('prompt_templates')
          .insert([insertData]);

        if (retryResult.error) {
          console.error('重新嘗試插入失敗:', retryResult.error);
          throw retryResult.error;
        }

        console.log('重新嘗試插入成功:', retryResult.data);
        return retryResult.data;
      }

      throw error;
    }

    console.log('Supabase 保存成功:', data);
    return data;
  } catch (supabaseError) {
    console.error('Error saving template to Supabase:', supabaseError);

    // 失敗時回退到本地存儲
    try {
      console.log('回退到本地存儲');
      const existingTemplates = JSON.parse(localStorage.getItem('promptTemplates') || '[]');
      const newTemplate = {
        id: Date.now().toString(),
        title: templateData.title,
        content: templateData.content,
        category: templateData.category || 'general',
        date: new Date().toISOString()
      };
      const updatedTemplates = [...existingTemplates, newTemplate];
      localStorage.setItem('promptTemplates', JSON.stringify(updatedTemplates));
      console.log('本地存儲成功');
      return newTemplate;
    } catch (localError) {
      console.error('Error saving template to local storage:', localError);
      throw localError;
    }
  }
};

// 獲取提示範本列表 (優先從 Supabase 獲取，出錯時從本地獲取)
export const getPromptTemplates = async () => {
  try {
    console.log('嘗試從 Supabase 獲取提示範本列表...');

    // 嘗試從 Supabase 獲取
    const { data, error } = await supabase
      .from('prompt_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('從 Supabase 獲取提示範本列表失敗:', error);

      // 檢查是否是表不存在的錯誤
      if (error.code === '42P01') {
        console.log('表不存在，嘗試創建表...');
        await ensureTablesExist();

        // 重新嘗試獲取
        console.log('重新嘗試獲取提示範本列表...');
        const retryResult = await supabase
          .from('prompt_templates')
          .select('*')
          .order('created_at', { ascending: false });

        if (retryResult.error) {
          console.error('重新嘗試獲取提示範本列表失敗:', retryResult.error);
          throw retryResult.error;
        }

        console.log('重新嘗試獲取提示範本列表成功:', retryResult.data);

        // 將 Supabase 數據格式轉換為應用格式
        return (retryResult.data || []).map(item => ({
          id: item.id,
          title: item.title,
          content: item.content,
          category: item.category,
          date: item.created_at
        }));
      }

      throw error;
    }

    console.log('從 Supabase 獲取提示範本列表成功:', data);

    // 將 Supabase 數據格式轉換為應用格式
    return (data || []).map(item => ({
      id: item.id,
      title: item.title,
      content: item.content,
      category: item.category,
      date: item.created_at
    }));
  } catch (supabaseError) {
    console.error('Error fetching templates from Supabase:', supabaseError);

    // 失敗時回退到本地存儲
    try {
      console.log('回退到本地存儲獲取提示範本列表');
      const localTemplates = JSON.parse(localStorage.getItem('promptTemplates') || '[]');
      console.log('從本地存儲獲取提示範本列表成功:', localTemplates);
      return localTemplates;
    } catch (localError) {
      console.error('Error reading templates from local storage:', localError);
      return [];
    }
  }
};

// 生成故事劇本
export const generateStoryScript = async (storyData) => {
  try {
    console.log('開始生成故事劇本:', storyData);
    console.log('使用 DeepSeek LLM 模型生成劇本');

    // 準備角色描述
    const charactersDescription = storyData.characters.map(char =>
      `角色: ${char.name}\n描述: ${char.description}${char.imageUrl ? '\n角色已有參考圖片' : ''}`
    ).join('\n\n');

    // 構建提示詞
    const prompt = `請為我創建一個分鏡劇本，包含${storyData.imageCount}個場景。
故事標題: ${storyData.title}
故事描述: ${storyData.description}

角色信息:
${charactersDescription}

請提供以下格式的劇本:
1. 故事概述 (簡潔扼要地描述整個故事的主要情節)
2. 分場景描述，每個場景必須包含以下內容並使用明確的標題分隔:
   - 場景描述: (詳細描述場景的環境、時間、地點等)
   - 角色動作: (描述角色在場景中的行為和互動)
   - 對白: (如果有對話，請使用引號標明)
   - 場景氛圍和視覺風格: (描述場景的情緒、色調、光線等視覺元素)

請確保:
1. 故事有清晰的起承轉合結構
2. 角色形象和性格保持一致
3. 每個場景都能獨立成圖，並且有視覺上的吸引力
4. 場景之間有合理的連貫性和故事進展
5. 總共生成${storyData.imageCount}個場景，不多不少
6. 每個場景必須有詳細的描述，不要使用"場景X: 故事繼續發展"這樣的簡略描述
7. 每個場景描述至少100字，包含具體的環境、角色動作和情感描述
8. 場景描述應該具有視覺可繪性，能夠被AI圖像生成模型理解並創建出連貫的圖像
9. 不要在場景描述中包含元數據或格式說明，如"場景4"或"故事編輯發展"等標記`;

    // 使用 Deepseek API 生成劇本
    const messages = [
      {
        role: 'system',
        content: '你是一個專業的故事編劇和分鏡師，擅長創作連貫且引人入勝的故事。你的劇本將被用於生成連續的圖像，所以每個場景的描述都應該具有很強的視覺表現力和可繪性。請確保按照用戶要求的格式輸出，並嚴格遵循場景數量的限制。'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    console.log('發送請求到 DeepSeek API...');
    const response = await axios.post(
      `${DEEPSEEK_API_URL}/v1/chat/completions`,
      {
        model: DEEPSEEK_MODEL,
        messages: messages,
        temperature: 0.7, // 降低溫度以獲得更一致的結果
        max_tokens: 3000, // 增加 token 限制以容納更詳細的劇本
        top_p: 0.95, // 添加 top_p 參數以控制創意度
        presence_penalty: 0.2, // 添加存在懲罰以減少重複
        frequency_penalty: 0.3 // 添加頻率懲罰以鼓勵多樣性
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        }
      }
    );

    if (!response.data || !response.data.choices || !response.data.choices[0]) {
      console.error('DeepSeek API 回應無效:', response.data);
      throw new Error('無法從 API 獲取有效的回應');
    }

    console.log('成功從 DeepSeek 獲取劇本');
    const scriptText = response.data.choices[0].message.content;

    // 解析生成的劇本文本
    const scriptData = parseScriptText(scriptText, storyData.title, storyData.description, storyData.imageCount);

    console.log('劇本解析完成，共有場景:', scriptData.scenes.length);
    return scriptData;
  } catch (error) {
    console.error('生成故事劇本時出錯:', error);
    throw error;
  }
};

// 解析劇本文本為結構化數據
function parseScriptText(scriptText, title, description, imageCount) {
  try {
    console.log('開始解析劇本文本');

    // 基本結構
    const scriptData = {
      title: title,
      description: description,
      overview: '',
      scenes: []
    };

    // 嘗試提取故事概述
    const overviewMatch = scriptText.match(/故事概述[：:]\s*([\s\S]*?)(?=場景|分場景|第[一二三四五六七八九十\d]+場景|場景描述)/i);
    if (overviewMatch && overviewMatch[1]) {
      scriptData.overview = overviewMatch[1].trim();
      console.log('成功提取故事概述');
    } else {
      // 嘗試其他可能的概述格式
      const altOverviewMatch = scriptText.match(/^([\s\S]*?)(?=場景|分場景|第[一二三四五六七八九十\d]+場景|場景\s*\d+)/i);
      if (altOverviewMatch && altOverviewMatch[1] && !altOverviewMatch[1].includes('場景') && altOverviewMatch[1].length < 1000) {
        scriptData.overview = altOverviewMatch[1].trim();
        console.log('使用替代方法提取故事概述');
      }
    }

    // 提取場景 - 使用多種可能的場景標記方式
    const scenePatterns = [
      // 標準場景標記
      /(?:場景\s*(\d+)|第[一二三四五六七八九十\d]+場景)[：:]\s*([\s\S]*?)(?=(?:場景\s*\d+|第[一二三四五六七八九十\d]+場景)[：:]|$)/gi,
      // 場景描述標記
      /場景描述[：:]\s*([\s\S]*?)(?=角色動作[：:]|對白[：:]|場景氛圍[：:]|視覺風格[：:]|(?:場景\s*\d+|第[一二三四五六七八九十\d]+場景)[：:]|$)/gi,
      // 數字+點+場景
      /\d+[\.\、]\s*場景[：:]\s*([\s\S]*?)(?=\d+[\.\、]\s*場景[：:]|$)/gi
    ];

    // 嘗試每種場景提取模式
    for (const pattern of scenePatterns) {
      let sceneMatch;
      let matchFound = false;

      while ((sceneMatch = pattern.exec(scriptText)) !== null && scriptData.scenes.length < imageCount) {
        matchFound = true;
        // 根據不同的模式提取場景內容
        const sceneContent = sceneMatch[sceneMatch.length - 1].trim();

        // 提取場景描述和對白
        let sceneDescription = sceneContent;
        let dialogue = '';

        // 嘗試提取對白
        const dialogueMatch = sceneContent.match(/對白[：:]\s*([\s\S]*?)(?=場景氛圍|視覺風格|角色動作|$)/i);
        if (dialogueMatch && dialogueMatch[1]) {
          dialogue = dialogueMatch[1].trim();
          // 從描述中移除對白部分
          sceneDescription = sceneDescription.replace(dialogueMatch[0], '');
        }

        // 嘗試提取更結構化的場景描述
        const structuredMatch = sceneContent.match(/場景描述[：:]\s*([\s\S]*?)(?=角色動作[：:]|對白[：:]|場景氛圍[：:]|視覺風格[：:]|$)/i);
        if (structuredMatch && structuredMatch[1]) {
          sceneDescription = structuredMatch[1].trim();
        }

        scriptData.scenes.push({
          description: sceneDescription.trim(),
          dialogue: dialogue
        });
      }

      // 如果找到匹配，跳出循環
      if (matchFound) {
        console.log(`使用模式 ${pattern} 成功提取場景`);
        break;
      }
    }

    // 如果沒有成功提取場景，嘗試按段落分割
    if (scriptData.scenes.length === 0) {
      console.log('使用段落分割方法提取場景');
      // 移除概述部分
      let contentWithoutOverview = scriptText;
      if (scriptData.overview) {
        contentWithoutOverview = scriptText.replace(scriptData.overview, '').trim();
      }

      // 按段落分割
      const paragraphs = contentWithoutOverview.split(/\n\s*\n/).filter(p => p.trim().length > 0);

      // 嘗試識別場景段落
      for (let i = 0; i < paragraphs.length && scriptData.scenes.length < imageCount; i++) {
        const paragraph = paragraphs[i].trim();

        // 跳過可能的概述或標題
        if (i === 0 && (paragraph.includes('概述') || paragraph.length < 50)) {
          continue;
        }

        // 提取對白
        let sceneDescription = paragraph;
        let dialogue = '';

        const dialogueMatch = paragraph.match(/"([^"]+)"|「([^」]+)」|『([^』]+)』|'([^']+)'/);
        if (dialogueMatch) {
          dialogue = dialogueMatch[0];
        }

        scriptData.scenes.push({
          description: sceneDescription,
          dialogue: dialogue
        });
      }
    }

    console.log(`解析完成，提取到 ${scriptData.scenes.length} 個場景`);

    // 確保有足夠的場景
    while (scriptData.scenes.length < imageCount) {
      const sceneIndex = scriptData.scenes.length + 1;
      console.log(`添加缺失的場景 ${sceneIndex}`);
      scriptData.scenes.push({
        description: `場景 ${sceneIndex}: 故事繼續發展`,
        dialogue: ''
      });
    }

    // 如果場景過多，只保留需要的數量
    if (scriptData.scenes.length > imageCount) {
      console.log(`場景過多，從 ${scriptData.scenes.length} 減少到 ${imageCount}`);
      scriptData.scenes = scriptData.scenes.slice(0, imageCount);
    }

    // 確保每個場景的描述都足夠詳細且不包含元數據標記
    scriptData.scenes = scriptData.scenes.map((scene, index) => {
      // 檢查描述是否過短或包含元數據標記（如"場景4: 故事編輯發展"）
      if (scene.description.length < 30 ||
          scene.description.match(/場景\s*\d+\s*:\s*故事.*發展/) ||
          scene.description.match(/場景\s*\d+\s*,\s*根據故事情節展開/)) {

        console.log(`場景 ${index + 1} 描述不適合，需要重新生成`);

        // 根據故事標題和前面場景的內容生成更有意義的描述
        let improvedDescription;

        if (index === 0) {
          // 第一個場景
          improvedDescription = `場景 ${index + 1}：故事開始，介紹主要角色和環境背景，建立故事的基本設定和氛圍。`;
        } else if (index === scriptData.scenes.length - 1) {
          // 最後一個場景
          improvedDescription = `場景 ${index + 1}：故事高潮與結局，角色面臨最終挑戰或解決問題，呈現故事的結論和情感高潮。`;
        } else if (index < scriptData.scenes.length / 2) {
          // 前半部分場景
          improvedDescription = `場景 ${index + 1}：故事發展階段，角色遇到挑戰或衝突，情節開始變得複雜，推動故事向前發展。`;
        } else {
          // 後半部分場景
          improvedDescription = `場景 ${index + 1}：故事轉折點，角色面臨重要抉擇或關鍵時刻，情節緊張度上升，為結局做準備。`;
        }

        return {
          ...scene,
          description: improvedDescription
        };
      }
      return scene;
    });

    return scriptData;
  } catch (error) {
    console.error('解析劇本文本時出錯:', error);
    console.error('錯誤詳情:', error.message);
    console.error('原始劇本文本:', scriptText.substring(0, 200) + '...');

    // 返回基本結構
    return {
      title: title,
      description: description,
      overview: '無法解析故事概述，請檢查生成的劇本格式',
      scenes: Array(imageCount).fill(0).map((_, i) => ({
        description: `場景 ${i + 1}: 根據故事 "${title}" 的情節發展，呈現相應的場景和角色互動`,
        dialogue: ''
      }))
    };
  }
}

// 生成故事圖像
export const generateStoryImages = async (sceneData) => {
  try {
    console.log('開始生成場景圖像:', sceneData);

    // 檢查場景描述是否有效
    let sceneDescription = sceneData.scene.description;
    const sceneIndex = sceneData.previousImages ? sceneData.previousImages.length : 0;

    // 檢測無效的場景描述（如"場景4: 故事編輯發展"）
    if (sceneDescription.match(/場景\s*\d+\s*:\s*故事.*發展/) ||
        sceneDescription.length < 30 ||
        sceneDescription.match(/場景\s*\d+\s*,\s*根據故事情節展開/)) {

      console.log(`檢測到無效的場景描述，重新生成場景 ${sceneIndex + 1} 的描述`);

      // 根據場景位置生成更有意義的描述
      if (sceneIndex === 0) {
        sceneDescription = `故事開始，介紹主要角色和環境背景，建立故事的基本設定和氛圍。`;
      } else if (sceneData.previousImages && sceneIndex === sceneData.previousImages.length - 1) {
        sceneDescription = `故事高潮與結局，角色面臨最終挑戰或解決問題，呈現故事的結論和情感高潮。`;
      } else if (sceneData.previousImages && sceneIndex < sceneData.previousImages.length / 2) {
        sceneDescription = `故事發展階段，角色遇到挑戰或衝突，情節開始變得複雜，推動故事向前發展。`;
      } else {
        sceneDescription = `故事轉折點，角色面臨重要抉擇或關鍵時刻，情節緊張度上升，為結局做準備。`;
      }
    }

    // 構建提示詞
    let prompt = `場景描述: ${sceneDescription}`;

    // 添加對白信息
    if (sceneData.scene.dialogue && sceneData.scene.dialogue.trim()) {
      prompt += `\n對白: "${sceneData.scene.dialogue}"`;
    }

    // 添加角色信息
    if (sceneData.characters && sceneData.characters.length > 0) {
      prompt += '\n\n角色:';
      sceneData.characters.forEach(char => {
        prompt += `\n- ${char.name}: ${char.description}`;
      });
    }

    // 添加一致性提示
    if (sceneData.previousImages && sceneData.previousImages.length > 0) {
      prompt += '\n\n請確保角色外觀與之前場景保持一致。角色的臉部特徵、服裝和整體風格應該與前面場景中的表現一致。';
      prompt += '\n請避免場景之間的風格突變，保持視覺連貫性。';
    }

    // 添加參考圖片
    let referenceImageUrl = null;

    // 如果有角色圖片，使用第一個角色的圖片作為參考
    if (sceneData.characters && sceneData.characters.length > 0) {
      referenceImageUrl = sceneData.characters[0].imageUrl;
    }

    // 如果有之前的圖像，也可以考慮使用最近的一張作為參考
    // 但這裡我們優先使用角色圖片，以確保角色一致性

    // 使用 OpenAI API 生成圖像
    const imageUrl = await generateImageWithOpenAI(prompt, referenceImageUrl);

    // 更新場景描述（如果之前被修改過）
    const updatedScene = {
      ...sceneData.scene,
      description: sceneDescription
    };

    return {
      imageUrl: imageUrl,
      prompt: prompt,
      scene: updatedScene
    };
  } catch (error) {
    console.error('生成場景圖像時出錯:', error);
    throw error;
  }
};

// 保存角色設定到 Supabase
export const saveCharacter = async (characterData) => {
  try {
    console.log('開始保存角色設定到 Supabase:', characterData);

    // 檢查必要的字段
    if (!characterData.name) {
      console.error('角色缺少名稱');
      throw new Error('角色缺少名稱');
    }

    if (!characterData.imageUrl) {
      console.error('角色缺少圖像URL');
      throw new Error('角色缺少圖像URL');
    }

    if (!characterData.externalTraits || !characterData.internalTraits || !characterData.biography) {
      console.error('角色缺少完整設定');
      throw new Error('角色缺少完整設定');
    }

    // 確保角色表存在
    console.log('確保角色表存在...');
    const tableExists = await ensureCharacterTableExists();

    if (!tableExists) {
      console.error('無法確保角色表存在，將使用本地存儲');
      throw new Error('無法確保角色表存在');
    }

    console.log('角色表確認存在，準備插入數據');

    // 準備要插入的數據
    const insertData = {
      id: characterData.id || crypto.randomUUID(),
      name: characterData.name,
      image_url: characterData.imageUrl,
      style_id: characterData.styleId || '',
      style_name: characterData.styleName || '',
      external_traits: characterData.externalTraits,
      internal_traits: characterData.internalTraits,
      biography: characterData.biography,
      created_at: new Date().toISOString()
    };

    console.log('準備插入的數據:', insertData);

    // 使用 Supabase 存儲 - 先嘗試 insert
    console.log('嘗試使用 insert 插入數據...');
    const { data: insertData1, error: insertError1 } = await supabase
      .from('characters')
      .insert([insertData]);

    if (insertError1) {
      console.error('Insert 插入錯誤:', insertError1);
      console.log('錯誤代碼:', insertError1.code);
      console.log('錯誤詳情:', insertError1.message, insertError1.details);

      // 如果是主鍵衝突，嘗試使用 upsert
      if (insertError1.code === '23505') { // 主鍵衝突
        console.log('主鍵衝突，嘗試使用 upsert...');
        const { data: upsertData, error: upsertError } = await supabase
          .from('characters')
          .upsert([insertData], { onConflict: 'id' });

        if (upsertError) {
          console.error('Upsert 操作錯誤:', upsertError);
          throw upsertError;
        }

        console.log('Upsert 操作成功:', upsertData);
        return { id: insertData.id, ...characterData };
      }

      // 如果是表不存在的錯誤，嘗試再次創建表
      if (insertError1.code === '42P01') {
        console.log('表不存在，再次嘗試創建表...');
        await ensureCharacterTableExists();

        // 重新嘗試插入
        console.log('重新嘗試插入數據...');
        const { data: retryData, error: retryError } = await supabase
          .from('characters')
          .insert([insertData]);

        if (retryError) {
          console.error('重新嘗試插入失敗:', retryError);
          throw retryError;
        }

        console.log('重新嘗試插入成功:', retryData);
        return { id: insertData.id, ...characterData };
      }

      // 其他錯誤
      throw insertError1;
    }

    console.log('Supabase 保存成功:', insertData1);
    return { id: insertData.id, ...characterData };
  } catch (error) {
    console.error('Error saving character to Supabase:', error);

    // 失敗時回退到本地存儲
    try {
      console.log('回退到本地存儲');
      const existingCharacters = JSON.parse(localStorage.getItem('characters') || '[]');
      const newCharacter = {
        id: characterData.id || Date.now().toString(),
        name: characterData.name,
        imageUrl: characterData.imageUrl,
        styleId: characterData.styleId || '',
        styleName: characterData.styleName || '',
        externalTraits: characterData.externalTraits,
        internalTraits: characterData.internalTraits,
        biography: characterData.biography,
        date: new Date().toISOString()
      };
      const updatedCharacters = [...existingCharacters, newCharacter];
      localStorage.setItem('characters', JSON.stringify(updatedCharacters));
      console.log('本地存儲成功');

      // 顯示提示，讓用戶知道數據已保存到本地
      alert('由於數據庫連接問題，角色已保存到本地存儲。請注意，這些數據可能不會在不同設備間同步。');

      return newCharacter;
    } catch (localError) {
      console.error('Error saving to local storage:', localError);
      throw localError;
    }
  }
};

// 獲取角色列表
export const getCharacters = async () => {
  try {
    console.log('嘗試從 Supabase 獲取角色列表...');

    // 首先確保表存在
    console.log('確保角色表存在...');
    const tableExists = await ensureCharacterTableExists();

    if (!tableExists) {
      console.log('無法確保角色表存在，將使用本地存儲');
      throw new Error('無法確保角色表存在');
    }

    // 嘗試從 Supabase 獲取
    console.log('嘗試從 Supabase 獲取數據...');
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('從 Supabase 獲取角色列表失敗:', error);
      console.log('錯誤代碼:', error.code);
      console.log('錯誤詳情:', error.message, error.details);

      // 檢查是否是表不存在的錯誤
      if (error.code === '42P01') {
        console.log('表不存在，再次嘗試創建表...');
        const recreateSuccess = await ensureCharacterTableExists();

        if (!recreateSuccess) {
          console.error('再次創建表失敗，將使用本地存儲');
          throw new Error('無法創建角色表');
        }

        // 重新嘗試獲取
        console.log('重新嘗試獲取角色列表...');
        const { data: retryData, error: retryError } = await supabase
          .from('characters')
          .select('*')
          .order('created_at', { ascending: false });

        if (retryError) {
          console.error('重新嘗試獲取角色列表失敗:', retryError);
          throw retryError;
        }

        console.log('重新嘗試獲取角色列表成功:', retryData);

        // 將 Supabase 數據格式轉換為應用格式
        return (retryData || []).map(item => ({
          id: item.id,
          name: item.name,
          imageUrl: item.image_url,
          styleId: item.style_id || '',
          styleName: item.style_name || '',
          externalTraits: item.external_traits,
          internalTraits: item.internal_traits,
          biography: item.biography,
          date: item.created_at
        }));
      }

      // 其他錯誤，拋出異常
      throw error;
    }

    console.log('從 Supabase 獲取角色列表成功:', data);

    // 將 Supabase 數據格式轉換為應用格式
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      imageUrl: item.image_url,
      styleId: item.style_id || '',
      styleName: item.style_name || '',
      externalTraits: item.external_traits,
      internalTraits: item.internal_traits,
      biography: item.biography,
      date: item.created_at
    }));
  } catch (supabaseError) {
    console.error('Error fetching from Supabase:', supabaseError);

    // 失敗時回退到本地存儲
    try {
      console.log('回退到本地存儲獲取角色列表');
      const localCharacters = JSON.parse(localStorage.getItem('characters') || '[]');
      console.log('從本地存儲獲取角色列表成功:', localCharacters);

      // 如果是首次使用，顯示提示
      if (localCharacters.length > 0) {
        console.log('顯示本地存儲數據提示');
      }

      return localCharacters;
    } catch (localError) {
      console.error('Error reading from local storage:', localError);
      return [];
    }
  }
};

// 確保角色表存在
async function ensureCharacterTableExists() {
  try {
    console.log('確保角色表存在...');

    // 檢查 characters 表
    const { error: charactersError } = await supabase
      .from('characters')
      .select('count')
      .limit(1);

    if (charactersError) {
      console.log('檢查 characters 表時出錯:', charactersError);
      console.log('錯誤代碼:', charactersError.code);
      console.log('錯誤詳情:', charactersError.message, charactersError.details);

      if (charactersError.code === '42P01') {
        console.log('characters 表不存在，嘗試創建...');

        try {
          // 方法1：使用 RPC 創建表
          console.log('使用方法1 (RPC) 創建 characters 表...');
          const { error: createError } = await supabase.rpc('execute_sql', {
            sql: `
              -- 確保UUID擴展可用
              CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

              -- 創建角色資料表
              CREATE TABLE IF NOT EXISTS public.characters (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                image_url TEXT NOT NULL,
                style_id VARCHAR(50),
                style_name VARCHAR(100),
                external_traits TEXT NOT NULL,  -- 角色外部特質 (100字)
                internal_traits TEXT NOT NULL,  -- 角色內部特質 (100字)
                biography TEXT NOT NULL,        -- 角色人物傳記 (600字)
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
              );

              -- 添加索引以提高查詢效能
              CREATE INDEX IF NOT EXISTS idx_characters_name ON public.characters(name);
              CREATE INDEX IF NOT EXISTS idx_characters_created_at ON public.characters(created_at);

              -- 啟用行級安全性
              ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

              -- 創建允許匿名訪問的策略
              DROP POLICY IF EXISTS "Allow anonymous access" ON public.characters;
              CREATE POLICY "Allow anonymous access" ON public.characters
                FOR ALL
                TO anon
                USING (true)
                WITH CHECK (true);
            `
          });

          if (createError) {
            console.error('方法1創建 characters 表失敗:', createError);

            // 方法2：使用 fetch 直接調用 API
            console.log('使用方法2 (fetch) 創建 characters 表...');
            const response = await fetch('https://qzdiyunmopvjktzqywkx.supabase.co/rest/v1/rpc/execute_sql', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6ZGl5dW5tb3B2amt0enF5d2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4NDExMzMsImV4cCI6MjA2MTQxNzEzM30.unnQGExrfHsOmlwgI6lvHD55vjruH5jvz8Y9kuBDjPM',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6ZGl5dW5tb3B2amt0enF5d2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4NDExMzMsImV4cCI6MjA2MTQxNzEzM30.unnQGExrfHsOmlwgI6lvHD55vjruH5jvz8Y9kuBDjPM'
              },
              body: JSON.stringify({
                sql: `
                  -- 確保UUID擴展可用
                  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

                  -- 創建角色資料表
                  CREATE TABLE IF NOT EXISTS public.characters (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    name VARCHAR(255) NOT NULL,
                    image_url TEXT NOT NULL,
                    style_id VARCHAR(50),
                    style_name VARCHAR(100),
                    external_traits TEXT NOT NULL,
                    internal_traits TEXT NOT NULL,
                    biography TEXT NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
                  );

                  -- 添加索引以提高查詢效能
                  CREATE INDEX IF NOT EXISTS idx_characters_name ON public.characters(name);
                  CREATE INDEX IF NOT EXISTS idx_characters_created_at ON public.characters(created_at);

                  -- 啟用行級安全性
                  ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

                  -- 創建允許匿名訪問的策略
                  DROP POLICY IF EXISTS "Allow anonymous access" ON public.characters;
                  CREATE POLICY "Allow anonymous access" ON public.characters
                    FOR ALL
                    TO anon
                    USING (true)
                    WITH CHECK (true);
                `
              })
            });

            if (!response.ok) {
              const responseText = await response.text();
              console.error('方法2創建 characters 表失敗:', responseText);
              throw new Error(`方法2創建表失敗: ${responseText}`);
            } else {
              console.log('方法2創建 characters 表成功');
            }
          } else {
            console.log('方法1創建 characters 表成功');
          }
        } catch (createTableError) {
          console.error('創建 characters 表時出錯:', createTableError);
          throw createTableError;
        }

        // 驗證表是否創建成功
        try {
          console.log('驗證 characters 表是否創建成功...');
          const { data, error } = await supabase
            .from('characters')
            .select('count')
            .limit(1);

          if (error) {
            console.error('驗證 characters 表失敗:', error);
            throw error;
          }
          console.log('驗證 characters 表成功:', data);
        } catch (verifyError) {
          console.error('驗證 characters 表時出錯:', verifyError);
        }
      } else {
        // 其他錯誤
        throw charactersError;
      }
    } else {
      console.log('characters 表已存在');
    }

    return true;
  } catch (error) {
    console.error('確保角色表存在時出錯:', error);
    return false;
  }
}

// 保存故事到 Supabase
export const saveStory = async (storyData) => {
  try {
    console.log('開始保存故事到 Supabase:', storyData);

    // 檢查必要的字段
    if (!storyData.title) {
      throw new Error('故事缺少標題');
    }

    if (!storyData.script || !storyData.images || storyData.images.length === 0) {
      throw new Error('故事缺少劇本或圖像');
    }

    // 創建故事表（如果不存在）
    await ensureStoryTablesExist();

    // 準備故事數據
    const storyId = crypto.randomUUID();
    const storyInsertData = {
      id: storyId,
      title: storyData.title,
      description: storyData.description,
      overview: storyData.script.overview,
      character_count: storyData.characters.length,
      scene_count: storyData.images.length,
      created_at: new Date().toISOString()
    };

    // 插入故事數據
    const { error: storyError } = await supabase
      .from('stories')
      .insert([storyInsertData]);

    if (storyError) {
      console.error('保存故事數據時出錯:', storyError);
      throw storyError;
    }

    // 保存角色數據
    const characterPromises = storyData.characters.map(async (character, index) => {
      const characterInsertData = {
        id: crypto.randomUUID(),
        story_id: storyId,
        name: character.name,
        description: character.description,
        image_url: character.imageUrl,
        order_index: index
      };

      const { error } = await supabase
        .from('story_characters')
        .insert([characterInsertData]);

      if (error) {
        console.error('保存角色數據時出錯:', error);
        throw error;
      }
    });

    // 保存場景和圖像數據
    const scenePromises = storyData.images.map(async (image, index) => {
      const sceneInsertData = {
        id: crypto.randomUUID(),
        story_id: storyId,
        description: image.scene.description,
        dialogue: image.scene.dialogue || '',
        image_url: image.imageUrl,
        order_index: index,
        generation_time: image.generationTime || null,
        prompt: image.prompt || null
      };

      const { error } = await supabase
        .from('story_scenes')
        .insert([sceneInsertData]);

      if (error) {
        console.error('保存場景數據時出錯:', error);
        throw error;
      }
    });

    // 等待所有保存操作完成
    await Promise.all([...characterPromises, ...scenePromises]);

    // 同時保存為一般案例，以便在案例頁面顯示
    const caseData = {
      title: storyData.title,
      prompt: `連續圖像故事: ${storyData.title}\n${storyData.description}`,
      imageUrl: storyData.images[0].imageUrl, // 使用第一張圖作為封面
      name: storyData.title,
      saveAsCase: true,
      saveAsPrompt: false,
      timestamp: new Date().toISOString()
    };

    await saveCase(caseData);

    return { id: storyId };
  } catch (error) {
    console.error('保存故事時出錯:', error);

    // 失敗時回退到本地存儲
    try {
      console.log('回退到本地存儲');
      const existingStories = JSON.parse(localStorage.getItem('stories') || '[]');
      const newStory = {
        id: Date.now().toString(),
        title: storyData.title,
        description: storyData.description,
        characters: storyData.characters,
        script: storyData.script,
        images: storyData.images,
        timestamp: new Date().toISOString()
      };
      const updatedStories = [...existingStories, newStory];
      localStorage.setItem('stories', JSON.stringify(updatedStories));
      console.log('本地存儲成功');
      return { id: newStory.id };
    } catch (localError) {
      console.error('本地存儲失敗:', localError);
      throw localError;
    }
  }
};

// 確保故事相關的表存在
async function ensureStoryTablesExist() {
  try {
    console.log('確保故事相關的表存在...');

    // 檢查 stories 表
    const { error: storiesError } = await supabase
      .from('stories')
      .select('count')
      .limit(1);

    if (storiesError && storiesError.code === '42P01') {
      console.log('stories 表不存在，嘗試創建...');

      // 創建 stories 表
      const { error: createStoriesError } = await supabase.rpc('execute_sql', {
        sql: `
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

          CREATE TABLE IF NOT EXISTS public.stories (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title TEXT NOT NULL,
            description TEXT,
            overview TEXT,
            character_count INTEGER DEFAULT 0,
            scene_count INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );

          ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

          DROP POLICY IF EXISTS "Allow anonymous access" ON public.stories;
          CREATE POLICY "Allow anonymous access" ON public.stories
            FOR ALL
            TO anon
            USING (true)
            WITH CHECK (true);
        `
      });

      if (createStoriesError) {
        console.error('創建 stories 表失敗:', createStoriesError);
        throw createStoriesError;
      }
    }

    // 檢查 story_characters 表
    const { error: charactersError } = await supabase
      .from('story_characters')
      .select('count')
      .limit(1);

    if (charactersError && charactersError.code === '42P01') {
      console.log('story_characters 表不存在，嘗試創建...');

      // 創建 story_characters 表
      const { error: createCharactersError } = await supabase.rpc('execute_sql', {
        sql: `
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

          CREATE TABLE IF NOT EXISTS public.story_characters (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            image_url TEXT,
            order_index INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );

          ALTER TABLE public.story_characters ENABLE ROW LEVEL SECURITY;

          DROP POLICY IF EXISTS "Allow anonymous access" ON public.story_characters;
          CREATE POLICY "Allow anonymous access" ON public.story_characters
            FOR ALL
            TO anon
            USING (true)
            WITH CHECK (true);
        `
      });

      if (createCharactersError) {
        console.error('創建 story_characters 表失敗:', createCharactersError);
        throw createCharactersError;
      }
    }

    // 檢查 story_scenes 表
    const { error: scenesError } = await supabase
      .from('story_scenes')
      .select('count')
      .limit(1);

    if (scenesError && scenesError.code === '42P01') {
      console.log('story_scenes 表不存在，嘗試創建...');

      // 創建 story_scenes 表
      const { error: createScenesError } = await supabase.rpc('execute_sql', {
        sql: `
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

          CREATE TABLE IF NOT EXISTS public.story_scenes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
            description TEXT,
            dialogue TEXT,
            image_url TEXT NOT NULL,
            order_index INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );

          ALTER TABLE public.story_scenes ENABLE ROW LEVEL SECURITY;

          DROP POLICY IF EXISTS "Allow anonymous access" ON public.story_scenes;
          CREATE POLICY "Allow anonymous access" ON public.story_scenes
            FOR ALL
            TO anon
            USING (true)
            WITH CHECK (true);
        `
      });

      if (createScenesError) {
        console.error('創建 story_scenes 表失敗:', createScenesError);
        throw createScenesError;
      }
    }

    console.log('故事相關的表檢查/創建完成');
    return true;
  } catch (error) {
    console.error('確保故事相關的表存在時出錯:', error);
    return false;
  }
}
