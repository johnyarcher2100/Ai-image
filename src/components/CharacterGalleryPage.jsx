import React from 'react';
import CharacterGallery from './CharacterGallery';
import '../styles/CharacterGalleryPage.css';

const CharacterGalleryPage = ({ onBack, onCreateCharacter }) => {
  return (
    <div className="character-gallery-page">
      <header className="gallery-header">
        <button className="back-button" onClick={onBack}>
          ← 返回主頁
        </button>
        <h1 className="page-title">人物角色庫</h1>
        <button className="create-character-button" onClick={onCreateCharacter}>
          創建新角色
        </button>
      </header>

      <main className="gallery-main">
        <CharacterGallery />
      </main>
    </div>
  );
};

export default CharacterGalleryPage;
