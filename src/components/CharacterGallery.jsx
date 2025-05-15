import { useState, useEffect } from 'react';
import { getCharacters } from '../services/api';
import '../styles/CharacterGallery.css';

const CharacterGallery = () => {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [groupedCharacters, setGroupedCharacters] = useState({});
  const [activeStyleId, setActiveStyleId] = useState('all');

  // 風格選項 - 與 CharacterGenerator 中的保持一致
  const styleOptions = [
    { id: 'qing-dynasty', name: '清朝古裝風格', description: '寫實臉部，傳統清朝服飾與髮型' },
    { id: 'future-tech', name: '未來科技感上身', description: '寫實臉部，搭配未來科技風格的服裝與配件' },
    { id: 'pixar', name: '皮克斯工作室風格', description: '3D卡通風格，大眼睛，誇張表情' },
    { id: 'ghibli', name: '吉卜力風格', description: '溫暖細膩的手繪風格，自然柔和的色調' },
    { id: 'animal-crossing', name: '動物森友會風格', description: '可愛簡約的卡通風格，圓潤的造型' },
    { id: 'doraemon', name: '哆啦A夢風格', description: '簡約線條，明亮色彩，日式動畫風格' },
    { id: 'random', name: '隨機風格', description: '隨機組合種族/外貌/職業/髮型/配件/個性等元素' }
  ];

  // 獲取角色數據
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        setLoading(true);
        const data = await getCharacters();
        setCharacters(data);

        // 按風格分組角色
        const grouped = groupCharactersByStyle(data);
        setGroupedCharacters(grouped);

        setLoading(false);
      } catch (err) {
        console.error('獲取角色數據時出錯:', err);
        setError('獲取角色數據時出錯，請稍後再試');
        setLoading(false);
      }
    };

    fetchCharacters();
  }, []);

  // 按風格分組角色
  const groupCharactersByStyle = (characterList) => {
    const grouped = { all: [] };

    // 初始化所有風格分組
    styleOptions.forEach(style => {
      grouped[style.id] = [];
    });

    // 將角色添加到相應的風格分組
    characterList.forEach(character => {
      // 添加到所有角色分組
      grouped.all.push(character);

      // 添加到特定風格分組
      if (character.styleId && grouped[character.styleId]) {
        grouped[character.styleId].push(character);
      } else {
        // 如果沒有風格ID或風格ID不存在，添加到"其他"分組
        if (!grouped.other) {
          grouped.other = [];
        }
        grouped.other.push(character);
      }
    });

    return grouped;
  };

  // 打開角色詳情
  const openCharacterDetail = (character) => {
    setSelectedCharacter(character);
  };

  // 關閉角色詳情
  const closeCharacterDetail = () => {
    setSelectedCharacter(null);
  };

  // 切換風格分類
  const handleStyleChange = (styleId) => {
    setActiveStyleId(styleId);
  };

  // 渲染風格選擇器
  const renderStyleSelector = () => {
    return (
      <div className="style-selector">
        <button
          className={`style-button ${activeStyleId === 'all' ? 'active' : ''}`}
          onClick={() => handleStyleChange('all')}
        >
          全部角色
        </button>

        {styleOptions.map(style => (
          <button
            key={style.id}
            className={`style-button ${activeStyleId === style.id ? 'active' : ''}`}
            onClick={() => handleStyleChange(style.id)}
          >
            {style.name}
          </button>
        ))}

        {groupedCharacters.other && groupedCharacters.other.length > 0 && (
          <button
            className={`style-button ${activeStyleId === 'other' ? 'active' : ''}`}
            onClick={() => handleStyleChange('other')}
          >
            其他風格
          </button>
        )}
      </div>
    );
  };

  // 渲染角色卡片
  const renderCharacterCards = () => {
    const charactersToShow = groupedCharacters[activeStyleId] || [];

    if (charactersToShow.length === 0) {
      return <div className="no-characters">此風格下暫無角色</div>;
    }

    return (
      <div className="character-cards">
        {charactersToShow.map(character => (
          <div
            key={character.id}
            className="character-card"
            onClick={() => openCharacterDetail(character)}
          >
            <div className="character-info">
              <h3 className="character-name">{character.name}</h3>
              <p className="character-style">{character.styleName}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 渲染角色詳情彈窗
  const renderCharacterDetail = () => {
    if (!selectedCharacter) return null;

    return (
      <div className="character-detail-overlay" onClick={closeCharacterDetail}>
        <div className="character-detail" onClick={e => e.stopPropagation()}>
          <button className="close-button" onClick={closeCharacterDetail}>×</button>

          <div className="character-detail-content">
            <div className="character-detail-image">
              <img
                src={selectedCharacter.imageUrl}
                alt={selectedCharacter.name}
              />
            </div>

            <div className="character-detail-info">
              <h2>{selectedCharacter.name}</h2>
              <p className="character-style-tag">{selectedCharacter.styleName}</p>

              <div className="character-traits">
                <div className="trait-section">
                  <h3>外部特質</h3>
                  <p>{selectedCharacter.externalTraits}</p>
                </div>

                <div className="trait-section">
                  <h3>內部特質</h3>
                  <p>{selectedCharacter.internalTraits}</p>
                </div>

                <div className="trait-section biography">
                  <h3>人物傳記</h3>
                  <p>{selectedCharacter.biography}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 主要渲染
  return (
    <div className="character-gallery-container">
      <h1 className="gallery-title">角色庫</h1>

      {loading ? (
        <div className="llm-working-indicator">
          <div className="llm-working-indicator-icon"></div>
          <div className="llm-working-indicator-text">北京影室創作坊的 deepseek-chat 大模型正在載入角色數據...</div>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          {renderStyleSelector()}
          {renderCharacterCards()}
          {renderCharacterDetail()}
        </>
      )}
    </div>
  );
};

export default CharacterGallery;
