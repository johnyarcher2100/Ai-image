import { useState, useEffect } from 'react';
import { checkApiStatus } from '../services/api';
import '../styles/ModelStatus.css';

const ModelStatus = () => {
  const [deepseekStatus, setDeepseekStatus] = useState('unknown');
  const [openaiStatus, setOpenaiStatus] = useState('unknown');
  const [supabaseStatus, setSupabaseStatus] = useState('unknown');
  const [lastChecked, setLastChecked] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  // 檢查 API 狀態
  useEffect(() => {
    const checkStatus = async () => {
      setIsChecking(true);
      try {
        // 使用 api.js 中的 checkApiStatus 函數
        const statuses = await checkApiStatus();
        
        setDeepseekStatus(statuses.deepseek || 'unknown');
        setOpenaiStatus(statuses.openai || 'unknown');
        setSupabaseStatus(statuses.supabase || 'unknown');
        setLastChecked(new Date());
      } catch (error) {
        console.error('Error checking API status:', error);
        // 保持當前狀態，而不是將所有服務設為在線
        setLastChecked(new Date());
      } finally {
        setIsChecking(false);
      }
    };

    // 初始檢查
    checkStatus();

    // 每 30 秒檢查一次
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // 手動重新檢查
  const handleRefresh = () => {
    if (!isChecking) {
      const checkStatus = async () => {
        setIsChecking(true);
        try {
          const statuses = await checkApiStatus();
          setDeepseekStatus(statuses.deepseek || 'unknown');
          setOpenaiStatus(statuses.openai || 'unknown');
          setSupabaseStatus(statuses.supabase || 'unknown');
          setLastChecked(new Date());
        } catch (error) {
          console.error('Error checking API status:', error);
        } finally {
          setIsChecking(false);
        }
      };
      
      checkStatus();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
      case 'active':
        return '#4CAF50'; // 綠色
      case 'busy':
        return '#FFC107'; // 黃色
      case 'offline':
      case 'inactive':
        return '#F44336'; // 紅色
      default:
        return '#9E9E9E'; // 灰色
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online':
      case 'active':
        return '在線';
      case 'busy':
        return '忙碌中';
      case 'offline':
      case 'inactive':
        return '離線';
      default:
        return '未知';
    }
  };

  return (
    <div className="model-status">
      <div className="status-container">
        <div className="status-title">API 服務狀態</div>
        
        <div className="status-items">
          <div className="status-item">
            <span className="status-dot" style={{ backgroundColor: getStatusColor(openaiStatus) }}></span>
            <span className="model-name">圖像</span>
          </div>
          
          <div className="status-item">
            <span className="status-dot" style={{ backgroundColor: getStatusColor(deepseekStatus) }}></span>
            <span className="model-name">文字</span>
          </div>
          
          <div className="status-item">
            <span className="status-dot" style={{ backgroundColor: getStatusColor(supabaseStatus) }}></span>
            <span className="model-name">數據庫</span>
          </div>
          
          <button 
            className="refresh-button" 
            onClick={handleRefresh}
            disabled={isChecking}
            title="重新檢查 API 狀態"
          >
            {isChecking ? '檢查中' : '重新檢查'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelStatus;
