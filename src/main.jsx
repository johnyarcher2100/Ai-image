import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App, { DebugApp } from './App.jsx'

// 定義調試模式標誌
const debugMode = false;

try {
  console.log('嘗試渲染應用...');
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('無法找到 root 元素!');
    document.body.innerHTML = '<div style="color: red; padding: 20px;">錯誤: 找不到 root 元素</div>';
  } else {
    const root = createRoot(rootElement);
    
    // 在調試模式下渲染簡化版本的 App
    if (debugMode) {
      console.log('以調試模式渲染');
      root.render(
        <StrictMode>
          <DebugApp />
        </StrictMode>
      );
    } else {
      console.log('以正常模式渲染');
      root.render(
        <StrictMode>
          <App />
        </StrictMode>
      );
    }
    console.log('渲染調用完成');
  }
} catch (error) {
  console.error('渲染過程中發生錯誤:', error);
  // 嘗試直接寫入錯誤信息到頁面
  const errorDiv = document.createElement('div');
  errorDiv.style.color = 'red';
  errorDiv.style.padding = '20px';
  errorDiv.style.fontFamily = 'monospace';
  errorDiv.innerHTML = `<h2>渲染錯誤</h2><p>${error.message}</p>`;
  document.body.appendChild(errorDiv);
}
