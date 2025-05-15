import React, { useState } from 'react';
import { stickerStyles } from '../data/stickerStyles';
import '../styles/StyleSelector.css';

const StyleSelector = ({ onStyleSelect }) => {
  const [selectedMainStyle, setSelectedMainStyle] = useState(null);
  const [selectedSubStyle, setSelectedSubStyle] = useState(null);
  
  // 處理主風格選擇
  const handleMainStyleSelect = (styleId) => {
    if (selectedMainStyle === styleId) {
      setSelectedMainStyle(null);
      setSelectedSubStyle(null);
      onStyleSelect(null);
    } else {
      setSelectedMainStyle(styleId);
      setSelectedSubStyle(null);
      onStyleSelect(null);
    }
  };
  
  // 處理子風格選擇
  const handleSubStyleSelect = (subStyle) => {
    if (selectedSubStyle && selectedSubStyle.id === subStyle.id) {
      setSelectedSubStyle(null);
      onStyleSelect(null);
    } else {
      setSelectedSubStyle(subStyle);
      onStyleSelect(subStyle);
    }
  };
  
  return (
    <div className="style-selector-container">
      <div className="main-styles">
        {stickerStyles.map(style => (
          <div 
            key={style.id}
            className={`main-style-item ${selectedMainStyle === style.id ? 'selected' : ''}`}
            onClick={() => handleMainStyleSelect(style.id)}
          >
            <div className="main-style-name">{style.name}</div>
            <div className="main-style-description">{style.description}</div>
          </div>
        ))}
      </div>
      
      {selectedMainStyle && (
        <div className="sub-styles">
          <h3>選擇子風格</h3>
          <div className="sub-styles-grid">
            {stickerStyles
              .find(style => style.id === selectedMainStyle)
              .subStyles.map(subStyle => (
                <div 
                  key={subStyle.id}
                  className={`sub-style-item ${selectedSubStyle && selectedSubStyle.id === subStyle.id ? 'selected' : ''}`}
                  onClick={() => handleSubStyleSelect(subStyle)}
                >
                  <div className="sub-style-name">{subStyle.name}</div>
                  <div className="sub-style-description">{subStyle.description}</div>
                  <div className="sub-style-examples">
                    <span>例如: </span>
                    {subStyle.examples.join(', ')}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}
      
      {selectedSubStyle && (
        <div className="selected-style-info">
          <h3>已選擇風格: {selectedSubStyle.name}</h3>
          <p className="style-prompt-hint">
            <strong>提示:</strong> {selectedSubStyle.promptHint}
          </p>
        </div>
      )}
    </div>
  );
};

export default StyleSelector;
