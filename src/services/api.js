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
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || 'sk-9cvqokIx2yRvi1wJ02Off8vGWQqkEbNPSuZuM1ZYB8Lbbski';
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

    console.log('Sending image generation request to OpenAI API...');
    console.log('API URL:', apiUrl);
    console.log('Model:', OPENAI_MODEL);

    // 準備訊息內容
    const messages = [
      {
        role: 'system',
        content: '你是一個專業的圖像生成助手，根據用戶的描述生成高品質圖像。請只回傳一張圖片。'
      }
    ];

    // 如果有參考圖片，則添加到訊息中
    if (referenceImageUrl) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: `請根據以下描述生成一張圖像：\n\n${prompt}` },
          { type: 'image_url', image_url: { url: referenceImageUrl } }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: `請根據以下描述生成一張圖像：\n\n${prompt}`
      });
    }

    const requestBody = {
      model: OPENAI_MODEL,
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000
    };

    console.log('Request Body:', JSON.stringify(requestBody));

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

    console.log('Image generation response received:', JSON.stringify(response.data));

    // 處理不同的響應格式
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const messageContent = response.data.choices[0].message.content;

      // 處理字符串格式的響應
      if (typeof messageContent === 'string') {
        // 從文本中嘗試提取 URL
        const urlMatch = messageContent.match(/(https?:\/\/[^\s]+)/g);
        if (urlMatch && urlMatch.length > 0) {
          return urlMatch[0];
        }
      }
      // 處理數組格式的響應
      else if (Array.isArray(messageContent)) {
        const imageItem = messageContent.find(item => item.type === 'image_url');
        if (imageItem && imageItem.image_url && imageItem.image_url.url) {
          return imageItem.image_url.url;
        }
      }
    }

    // 如果無法從標準格式中獲取 URL，嘗試從整個響應中查找
    const responseStr = JSON.stringify(response.data);
    const urlMatch = responseStr.match(/"url":"(https?:\/\/[^"]+)"/);
    if (urlMatch && urlMatch.length > 1) {
      return urlMatch[1];
    }

    // 如果仍然找不到 URL，則拋出錯誤
    throw new Error('無法從 API 響應中提取圖像 URL');
  } catch (error) {
    console.error('Error generating image with OpenAI:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data));
    }
    throw error;
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
