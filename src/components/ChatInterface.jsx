import { useState, useEffect, useRef } from 'react';
import { sendMessageToDeepseek } from '../services/api';
import WebcamCapture from './WebcamCapture';
import ImageUrlInput from './ImageUrlInput';
import ImageUploadMenu from './ImageUploadMenu';
import '../styles/ChatInterface.css';

const ChatInterface = ({ onImageGeneration, onSaveCase, externalPrompt, setExternalPrompt }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [conversationCount, setConversationCount] = useState(0);
  const [showGenerateButton, setShowGenerateButton] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // 圖片上傳相關狀態
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  // 初始歡迎訊息
  useEffect(() => {
    const welcomeMessage = {
      sender: 'bot',
      text: '嗨！我是你的靈感圖像助手 🎨\n只要簡單聊聊你的想法，我就能幫你生成一張專屬的 AI 圖像。\n你只需要用自然的語言告訴我你的想法，比如場景、氛圍、角色、風格等等～\n開始描述後，你隨時可以繼續補充細節或直接點擊生成圖像按鈕！',
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
  }, []);

  // 自動滾動到最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 監控對話次數，用戶第一次發送消息後就顯示生成按鈕
  useEffect(() => {
    if (conversationCount >= 1 && !showGenerateButton) {
      setShowGenerateButton(true);
      // 不再添加額外的提示訊息，讓用戶可以自由決定何時生成圖像
    }
  }, [conversationCount, showGenerateButton]);

  // 監聽外部提示詞的變化，並將其設置到輸入框中
  useEffect(() => {
    if (externalPrompt && externalPrompt.trim() !== '') {
      setInput(externalPrompt);
      // 聚焦到輸入框，方便用戶直接編輯
      textareaRef.current?.focus();
      // 清空外部提示詞，避免重複設置
      if (setExternalPrompt) {
        setExternalPrompt('');
      }
    }
  }, [externalPrompt, setExternalPrompt]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // 添加用戶訊息
    const userMessage = {
      sender: 'user',
      text: input,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 發送訊息到 Deepseek API
      const response = await sendMessageToDeepseek(input, messages);

      // 添加機器人回覆
      const botMessage = {
        sender: 'bot',
        text: response,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, botMessage]);
      setConversationCount(prev => prev + 1);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        sender: 'bot',
        text: '抱歉，發生了一些錯誤。請稍後再試。',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 處理圖片上傳選項選擇
  const handleUploadOptionSelect = (option) => {
    setShowUploadMenu(false);

    switch (option) {
      case 'file':
        // 觸發文件選擇器點擊
        document.getElementById('image-upload').click();
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
        addImageToChat(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 處理拍照
  const handleCapture = (imageSrc) => {
    addImageToChat(imageSrc);
    setShowWebcam(false);
  };

  // 處理 URL 圖片
  const handleUrlImage = (url) => {
    addImageToChat(url);
    setShowUrlInput(false);
  };

  // 添加圖片到聊天
  const addImageToChat = (imageSrc) => {
    setImageUrl(imageSrc);
    const imageMessage = {
      sender: 'user',
      text: '上傳了一張圖片',
      image: imageSrc,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, imageMessage]);
  };

  const handleGenerateImage = () => {
    // 收集對話內容作為生成圖像的提示
    const conversationHistory = messages
      .filter(msg => msg.sender === 'user' || (msg.sender === 'bot' && !msg.text.includes('嗨！我是你的靈感圖像助手')))
      .map(msg => `${msg.sender === 'user' ? '用戶' : '助手'}: ${msg.text}`)
      .join('\n');

    // 調用父組件的圖像生成函數
    onImageGeneration(conversationHistory, imageUrl);

    // 添加生成中的訊息
    const generatingMessage = {
      sender: 'bot',
      text: '正在生成你的圖像，請稍候...',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, generatingMessage]);
  };

  return (
    <div className="chat-container">
      <div className="messages-container">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
          >
            {message.image && (
              <img src={message.image} alt="Uploaded" className="uploaded-image" />
            )}
            <div className="message-text">{message.text}</div>
          </div>
        ))}
        {isLoading && (
          <div className="message bot-message">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <input
          type="file"
          id="image-upload"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
        <div className="upload-button-container">
          <button
            className="upload-button"
            onClick={() => setShowUploadMenu(!showUploadMenu)}
            title="上傳圖片"
          >
            📷
          </button>
          {showUploadMenu && (
            <ImageUploadMenu
              onSelectOption={handleUploadOptionSelect}
              onClose={() => setShowUploadMenu(false)}
            />
          )}
        </div>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="輸入你的想法..."
          onKeyDown={(e) => {
            // 按下 Ctrl+Enter 發送訊息
            if (e.key === 'Enter' && e.ctrlKey) {
              handleSendMessage();
            }
          }}
          rows="6"
        />

        <button onClick={handleSendMessage} disabled={isLoading}>
          發送
        </button>

        {showGenerateButton && (
          <button
            className="generate-button"
            onClick={handleGenerateImage}
            title="點擊生成圖像，你也可以繼續聊天補充更多細節"
          >
            立即生成圖像 ✨
          </button>
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
    </div>
  );
};

export default ChatInterface;
