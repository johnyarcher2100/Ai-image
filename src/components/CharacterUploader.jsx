import { useState, useRef } from 'react';
import WebcamCapture from './WebcamCapture';
import ImageUrlInput from './ImageUrlInput';
import ImageUploadMenu from './ImageUploadMenu';
import '../styles/CharacterUploader.css';

const CharacterUploader = ({ onAddCharacter, characters, onRemoveCharacter }) => {
  const [characterName, setCharacterName] = useState('');
  const [characterDescription, setCharacterDescription] = useState('');
  const [characterImage, setCharacterImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

  // 新增狀態
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  // 處理圖片上傳
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 檢查文件類型
    if (!file.type.match('image.*')) {
      alert('請上傳圖片文件');
      return;
    }

    // 創建預覽URL
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result);
      setCharacterImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // 添加角色
  const handleAddCharacter = () => {
    if (!characterName || !characterDescription || !characterImage) {
      alert('請填寫角色名稱、描述並上傳角色圖片');
      return;
    }

    const newCharacter = {
      id: Date.now().toString(),
      name: characterName,
      description: characterDescription,
      imageUrl: characterImage
    };

    onAddCharacter(newCharacter);

    // 重置表單
    setCharacterName('');
    setCharacterDescription('');
    setCharacterImage(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 處理圖片上傳選項選擇
  const handleUploadOptionSelect = (option) => {
    setShowUploadMenu(false);

    switch (option) {
      case 'file':
        // 觸發文件選擇器點擊
        fileInputRef.current.click();
        break;
      case 'camera':
        setShowWebcam(true);
        break;
      case 'url':
        setShowUrlInput(true);
        break;
      default:
        break;
    }
  };

  // 處理拍照
  const handleCapture = (imageSrc) => {
    setPreviewUrl(imageSrc);
    setCharacterImage(imageSrc);
    setShowWebcam(false);
  };

  // 處理 URL 圖片
  const handleUrlImage = (url) => {
    setPreviewUrl(url);
    setCharacterImage(url);
    setShowUrlInput(false);
  };

  // 觸發文件選擇
  const triggerFileInput = () => {
    setShowUploadMenu(true);
  };

  return (
    <div className="character-uploader">
      <div className="character-form">
        <div className="form-group">
          <label>角色名稱</label>
          <input
            type="text"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            placeholder="輸入角色名稱"
          />
        </div>

        <div className="form-group">
          <label>角色描述</label>
          <textarea
            value={characterDescription}
            onChange={(e) => setCharacterDescription(e.target.value)}
            placeholder="描述角色的外貌、性格、背景等..."
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>角色圖片</label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <div className="image-upload-area" onClick={triggerFileInput}>
            {previewUrl ? (
              <img src={previewUrl} alt="角色預覽" className="image-preview" />
            ) : (
              <div className="upload-placeholder">
                <span>點擊上傳圖片</span>
                <small>支持本地上傳、拍照或網路圖片</small>
              </div>
            )}
          </div>
          {showUploadMenu && (
            <ImageUploadMenu
              onSelectOption={handleUploadOptionSelect}
              onClose={() => setShowUploadMenu(false)}
            />
          )}
        </div>

        <button
          className="add-character-button"
          onClick={handleAddCharacter}
          disabled={!characterName || !characterDescription || !characterImage}
        >
          添加角色
        </button>
      </div>

      <div className="characters-list">
        <h3>已添加角色 ({characters.length})</h3>
        {characters.length === 0 ? (
          <div className="no-characters">尚未添加角色</div>
        ) : (
          <div className="character-cards">
            {characters.map((character, index) => (
              <div key={character.id} className="character-card">
                <div className="character-image">
                  <img src={character.imageUrl} alt={character.name} />
                </div>
                <div className="character-info">
                  <h4>{character.name}</h4>
                  <p>{character.description}</p>
                </div>
                <button
                  className="remove-character-button"
                  onClick={() => onRemoveCharacter(index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 拍照組件 */}
      {showWebcam && (
        <WebcamCapture
          onCapture={handleCapture}
          onClose={() => setShowWebcam(false)}
        />
      )}

      {/* URL 輸入組件 */}
      {showUrlInput && (
        <ImageUrlInput
          onSubmit={handleUrlImage}
          onClose={() => setShowUrlInput(false)}
        />
      )}
    </div>
  );
};

export default CharacterUploader;
