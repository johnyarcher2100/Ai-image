import React from 'react';
import MultiImageGenerator from './MultiImageGenerator';
import '../styles/MultiImageGeneratorPage.css';

const MultiImageGeneratorPage = ({ onBack }) => {
  return (
    <div className="multi-image-generator-page">
      <div className="multi-image-page-header">
        <button className="back-button" onClick={onBack}>
          <i className="fas fa-arrow-left"></i> 返回主頁
        </button>
        <h1 className="page-title">多圖同時生成</h1>
      </div>
      <div className="multi-image-page-content">
        <MultiImageGenerator />
      </div>
    </div>
  );
};

export default MultiImageGeneratorPage;
