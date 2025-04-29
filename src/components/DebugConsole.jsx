import { useState, useEffect } from 'react';

// 自定義日誌收集器
const DebugConsole = () => {
  const [logs, setLogs] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // 儲存原始的 console 方法
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    };

    // 創建日誌收集函數
    const collectLog = (type, args) => {
      const timestamp = new Date().toISOString();
      const text = Array.from(args).map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      // 使用 setTimeout 來避免在渲染過程中更新狀態
      setTimeout(() => {
        setLogs(prevLogs => [
          ...prevLogs,
          { type, timestamp, text }
        ].slice(-100)); // 只保留最新的 100 條日誌
      }, 0);
    };

    // 重寫 console 方法
    console.log = function() {
      originalConsole.log.apply(console, arguments);
      collectLog('log', arguments);
    };

    console.error = function() {
      originalConsole.error.apply(console, arguments);
      collectLog('error', arguments);
    };

    console.warn = function() {
      originalConsole.warn.apply(console, arguments);
      collectLog('warn', arguments);
    };

    console.info = function() {
      originalConsole.info.apply(console, arguments);
      collectLog('info', arguments);
    };

    // 添加全局錯誤處理
    const handleGlobalError = (event) => {
      collectLog('error', [`全局錯誤: ${event.message} 在 ${event.filename} 行 ${event.lineno}`]);
    };

    window.addEventListener('error', handleGlobalError);

    // 清理函數
    return () => {
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.info = originalConsole.info;
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  // 根據日誌類型返回顏色
  const getLogColor = (type) => {
    switch (type) {
      case 'error': return '#F44336';
      case 'warn': return '#FFC107';
      case 'info': return '#2196F3';
      default: return '#333';
    }
  };

  // 清空日誌
  const clearLogs = () => {
    setLogs([]);
  };

  // 複製日誌到剪貼板
  const copyLogs = () => {
    const logText = logs.map(log => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.text}`).join('\n');
    navigator.clipboard.writeText(logText)
      .then(() => {
        alert('日誌已複製到剪貼板');
      })
      .catch(() => {
        alert('無法複製日誌');
      });
  };

  if (!expanded) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
          zIndex: 9999
        }}
        onClick={() => setExpanded(true)}
      >
        顯示調試控制台 ({logs.filter(log => log.type === 'error').length} 錯誤)
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        width: '80%',
        maxWidth: '600px',
        height: '300px',
        background: 'rgba(255,255,255,0.95)',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 0 10px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999
      }}
    >
      <div
        style={{
          padding: '8px',
          borderBottom: '1px solid #ccc',
          display: 'flex',
          justifyContent: 'space-between',
          background: '#f5f5f5'
        }}
      >
        <span>調試控制台</span>
        <div>
          <button
            onClick={clearLogs}
            style={{marginRight: '8px', padding: '2px 6px'}}
          >
            清空
          </button>
          <button
            onClick={copyLogs}
            style={{marginRight: '8px', padding: '2px 6px'}}
          >
            複製
          </button>
          <button
            onClick={() => setExpanded(false)}
            style={{padding: '2px 6px'}}
          >
            最小化
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}
      >
        {logs.length === 0 ? (
          <div style={{color: '#777', textAlign: 'center', marginTop: '20px'}}>
            尚無日誌記錄
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              style={{
                marginBottom: '4px',
                color: getLogColor(log.type),
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              <span style={{opacity: 0.7, fontSize: '10px'}}>
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>
              <span style={{marginLeft: '4px', fontWeight: log.type === 'error' ? 'bold' : 'normal'}}>
                {log.text}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DebugConsole;