import React from 'react';
import StickerGenerator from './StickerGenerator';
import '../styles/StickerGeneratorPage.css';

const StickerGeneratorPage = ({ onBack }) => {
  return (
    <div className="sticker-generator-page">
      <div className="sticker-page-header">
        <button className="back-button" onClick={onBack}>
          <i className="fas fa-arrow-left"></i> 返回主頁
        </button>
        <h1 className="page-title">表情貼圖生成</h1>
      </div>
      <div className="sticker-page-content">
        <StickerGenerator />
      </div>
    </div>
  );
};

export default StickerGeneratorPage;
