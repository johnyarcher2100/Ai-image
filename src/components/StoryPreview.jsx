import { useState } from 'react';
import '../styles/StoryPreview.css';

const StoryPreview = ({ title, description, script, images, characters }) => {
  const [viewMode, setViewMode] = useState('gallery'); // 'gallery' or 'slideshow'
  const [currentSlide, setCurrentSlide] = useState(0);

  // 切換到下一張幻燈片
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // 切換到上一張幻燈片
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  // 下載所有圖片為ZIP
  const downloadAllImages = () => {
    alert('此功能尚未實現：下載所有圖片為ZIP文件');
    // 實際實現需要使用JSZip等庫來創建ZIP文件
  };

  // 下載當前圖片
  const downloadCurrentImage = () => {
    if (images.length === 0 || !images[currentSlide]) return;

    const link = document.createElement('a');
    link.href = images[currentSlide].imageUrl;
    link.download = `${title}_場景${currentSlide + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="story-preview">
      <div className="story-header">
        <h2>{title}</h2>
        <p className="story-description">{description}</p>
      </div>

      <div className="view-controls">
        <button
          className={`view-button ${viewMode === 'gallery' ? 'active' : ''}`}
          onClick={() => setViewMode('gallery')}
        >
          畫廊模式
        </button>
        <button
          className={`view-button ${viewMode === 'slideshow' ? 'active' : ''}`}
          onClick={() => setViewMode('slideshow')}
        >
          幻燈片模式
        </button>
      </div>

      {/* 畫廊模式 */}
      {viewMode === 'gallery' && (
        <div className="gallery-view">
          <div className="gallery-grid">
            {images.map((image, index) => (
              <div key={index} className="gallery-item">
                <img src={image.imageUrl} alt={`場景 ${index + 1}`} />
                <div className="gallery-caption">
                  <div className="scene-number">場景 {index + 1}</div>
                  <p>{image.scene.description}</p>
                  {image.scene.dialogue && (
                    <p className="dialogue">「{image.scene.dialogue}」</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="gallery-actions">
            <button className="download-button" onClick={downloadAllImages}>
              下載所有圖片
            </button>
          </div>
        </div>
      )}

      {/* 幻燈片模式 */}
      {viewMode === 'slideshow' && (
        <div className="slideshow-view">
          <div className="slideshow-container">
            <button className="slide-nav prev" onClick={prevSlide}>
              &#10094;
            </button>
            
            {images.length > 0 && (
              <div className="slide">
                <img
                  src={images[currentSlide].imageUrl}
                  alt={`場景 ${currentSlide + 1}`}
                />
                <div className="slide-info">
                  <div className="slide-number">
                    場景 {currentSlide + 1} / {images.length}
                  </div>
                  <p className="slide-description">
                    {images[currentSlide].scene.description}
                  </p>
                  {images[currentSlide].scene.dialogue && (
                    <p className="slide-dialogue">
                      「{images[currentSlide].scene.dialogue}」
                    </p>
                  )}
                </div>
              </div>
            )}
            
            <button className="slide-nav next" onClick={nextSlide}>
              &#10095;
            </button>
          </div>
          
          <div className="slideshow-actions">
            <button className="download-button" onClick={downloadCurrentImage}>
              下載當前圖片
            </button>
          </div>
        </div>
      )}

      <div className="story-details">
        <div className="characters-section">
          <h3>故事角色</h3>
          <div className="character-list">
            {characters.map((character) => (
              <div key={character.id} className="character-item">
                <img
                  src={character.imageUrl}
                  alt={character.name}
                  className="character-thumbnail"
                />
                <div className="character-details">
                  <h4>{character.name}</h4>
                  <p>{character.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="script-section">
          <h3>完整劇本</h3>
          <div className="script-content">
            {script.scenes.map((scene, index) => (
              <div key={index} className="script-scene">
                <h4>場景 {index + 1}</h4>
                <p>{scene.description}</p>
                {scene.dialogue && <p className="script-dialogue">「{scene.dialogue}」</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryPreview;
