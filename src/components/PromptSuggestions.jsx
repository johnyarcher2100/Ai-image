import React, { useState, useEffect } from 'react';
import '../styles/PromptSuggestions.css';
import { generateTextPromptSuggestions } from '../services/api';

const PromptSuggestions = ({ styleInfo, onSelectPrompt }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState(null);

  // 當風格信息變化時，生成新的建議
  useEffect(() => {
    if (styleInfo) {
      fetchSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [styleInfo]);

  // 獲取文字參數建議
  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await generateTextPromptSuggestions(styleInfo);
      console.log('獲取到的文字參數建議:', result);
      setSuggestions(result);

      setLoading(false);
    } catch (err) {
      console.error('獲取文字參數建議失敗:', err);
      setError('無法獲取文字參數建議，請稍後再試');
      setLoading(false);
    }
  };

  // 處理建議選擇
  const handleSelectPrompt = (prompt) => {
    setSelectedPrompt(prompt);
    if (onSelectPrompt) {
      onSelectPrompt(prompt);
    }
  };

  // 重新生成建議
  const handleRegenerateSuggestions = () => {
    fetchSuggestions();
  };

  if (!styleInfo) {
    return null;
  }

  return (
    <div className="prompt-suggestions-container">
      <div className="suggestions-header">
        <h3>文字參數建議</h3>
        <button
          className="regenerate-button"
          onClick={handleRegenerateSuggestions}
          disabled={loading}
        >
          {loading ? '生成中...' : '重新生成'}
        </button>
      </div>

      {error && (
        <div className="suggestions-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="suggestions-loading">
          <div className="loading-spinner"></div>
          <p>正在生成文字參數建議...</p>
        </div>
      ) : (
        <div className="suggestions-grid">
          {Array.isArray(suggestions) && suggestions.length > 0 ? (
            suggestions.map((prompt, index) => (
              <div
                key={index}
                className={`suggestion-item ${selectedPrompt === prompt ? 'selected' : ''}`}
                onClick={() => handleSelectPrompt(prompt)}
              >
                <div className="suggestion-number">{index + 1}</div>
                <div className="suggestion-text">{prompt}</div>
                {selectedPrompt === prompt && (
                  <div className="selected-indicator">
                    <i className="fas fa-check"></i>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-suggestions">
              <p>選擇風格後將生成文字參數建議</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PromptSuggestions;
