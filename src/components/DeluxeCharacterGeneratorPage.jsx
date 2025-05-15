import React, { useState } from 'react';
import '../styles/DeluxeCharacterGeneratorPage.css';
import DeluxeCharacterGenerator from './DeluxeCharacterGenerator';

const DeluxeCharacterGeneratorPage = ({ onBack }) => {
  return (
    <div className="deluxe-character-generator-page">
      <div className="deluxe-page-header">
        <button className="back-button" onClick={onBack}>
          <i className="fas fa-arrow-left"></i> 返回
        </button>
        <h1 className="page-title">豪華角色貼圖生成</h1>
      </div>
      <div className="deluxe-page-content">
        <DeluxeCharacterGenerator />
      </div>
    </div>
  );
};

export default DeluxeCharacterGeneratorPage;
