import React from 'react';
import CharacterGenerator from './CharacterGenerator';
import '../styles/CharacterGeneratorPage.css';

const CharacterGeneratorPage = ({ onBack, onViewGallery }) => {
  return (
    <div className="character-generator-page">
      <div className="character-page-header">
        <button className="back-button" onClick={onBack}>
          <i className="fas fa-arrow-left"></i> 返回主頁
        </button>
        <h1 className="page-title">人物主角生成</h1>
        <button className="view-gallery-button" onClick={onViewGallery}>
          查看角色庫
        </button>
      </div>
      <div className="character-page-content">
        <CharacterGenerator />
      </div>
    </div>
  );
};

export default CharacterGeneratorPage;
