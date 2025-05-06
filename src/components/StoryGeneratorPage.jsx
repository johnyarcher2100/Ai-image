import React from 'react';
import StoryGenerator from './StoryGenerator';
import '../styles/StoryGeneratorPage.css';

const StoryGeneratorPage = ({ onBack }) => {
  return (
    <div className="story-generator-page">
      <div className="story-page-header">
        <button className="back-button" onClick={onBack}>
          <i className="fas fa-arrow-left"></i> 返回主頁
        </button>
        <h1 className="page-title">連續圖像生成</h1>
      </div>
      <div className="story-page-content">
        <StoryGenerator />
      </div>
    </div>
  );
};

export default StoryGeneratorPage;
