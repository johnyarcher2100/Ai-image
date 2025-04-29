import '../styles/ImageUploadMenu.css';

const ImageUploadMenu = ({ onSelectOption, onClose }) => {
  return (
    <div className="image-upload-menu">
      <div className="menu-item" onClick={() => onSelectOption('file')}>
        <div className="menu-icon">📁</div>
        <div className="menu-text">從檔案上傳</div>
      </div>
      
      <div className="menu-item" onClick={() => onSelectOption('camera')}>
        <div className="menu-icon">📷</div>
        <div className="menu-text">拍照</div>
      </div>
      
      <div className="menu-item" onClick={() => onSelectOption('url')}>
        <div className="menu-icon">🔗</div>
        <div className="menu-text">網路圖片連結</div>
      </div>
      
      <div className="menu-close" onClick={onClose}>
        取消
      </div>
    </div>
  );
};

export default ImageUploadMenu;
