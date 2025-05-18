import React, { useState, useRef } from 'react';
import '../styles/MultiImageUploader.css';

const MultiImageUploader = ({ onImagesChange }) => {
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // 處理文件選擇
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addNewImages(selectedFiles);
  };

  // 處理拖放
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    );

    addNewImages(droppedFiles);
  };

  // 添加新圖片
  const addNewImages = (newFiles) => {
    // 過濾出圖片文件
    const imageFiles = newFiles.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      alert('請選擇圖片文件');
      return;
    }

    // 創建新的圖片對象數組
    const newImages = imageFiles.map(file => {
      // 使用 FileReader 讀取圖片為 Data URL
      const reader = new FileReader();
      const imageObj = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        file: file,
        preview: null, // 先設為 null，等 FileReader 讀取完成後再設置
        name: file.name,
        size: file.size,
        type: file.type,
        loaded: false // 標記圖片是否已加載完成
      };

      reader.onload = (e) => {
        // 當 FileReader 讀取完成時，更新圖片的 preview
        imageObj.preview = e.target.result;
        imageObj.loaded = true;

        // 更新狀態
        setImages(prevImages => {
          const updatedImages = prevImages.map(img =>
            img.id === imageObj.id ? imageObj : img
          );

          // 通知父組件
          onImagesChange(updatedImages);
          return updatedImages;
        });
      };

      // 開始讀取文件
      reader.readAsDataURL(file);

      // 同時也設置一個 URL 對象作為臨時預覽
      // 但標記為未加載完成，等待 FileReader 完成
      imageObj.preview = URL.createObjectURL(file);

      // 預加載圖片，確保圖片可用
      const img = new Image();
      img.onload = () => {
        // 圖片已預加載，但仍等待 FileReader 完成
        console.log(`圖片 ${file.name} 預加載完成`);
      }
      img.src = imageObj.preview;

      return imageObj;
    });

    // 更新狀態
    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);

    // 通知父組件
    onImagesChange(updatedImages);
  };

  // 刪除圖片
  const handleRemoveImage = (id) => {
    const updatedImages = images.filter(image => image.id !== id);
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  // 觸發文件選擇
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="multi-image-uploader">
      <div className="uploader-header">
        <h2>上傳多張圖片</h2>
        <p>選擇多張圖片，將以相同風格進行生成</p>
      </div>

      <div
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onClick={triggerFileInput}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          multiple
          style={{ display: 'none' }}
        />
        <div className="upload-icon">
          <i className="fas fa-cloud-upload-alt"></i>
        </div>
        <div className="upload-text">
          <p>點擊上傳或拖放圖片至此處</p>
          <span>支持多張圖片同時上傳</span>
        </div>
      </div>

      {images.length > 0 && (
        <div className="image-preview-container">
          <div className="preview-header">
            <h3>已上傳圖片 ({images.length})</h3>
            <button
              className="clear-all-button"
              onClick={() => {
                setImages([]);
                onImagesChange([]);
              }}
            >
              清除全部
            </button>
          </div>
          <div className="image-previews">
            {images.map(image => (
              <div key={image.id} className="image-preview-item">
                <img src={image.preview} alt={image.name} />
                <div className="image-info">
                  <span className="image-name">{image.name.length > 15 ? image.name.substring(0, 15) + '...' : image.name}</span>
                  <span className="image-size">{(image.size / 1024).toFixed(1)} KB</span>
                </div>
                <button
                  className="remove-image-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(image.id);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiImageUploader;
