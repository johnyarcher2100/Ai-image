import { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import '../styles/WebcamCapture.css';

const WebcamCapture = ({ onCapture, onClose }) => {
  const webcamRef = useRef(null);
  const [isCaptureEnabled, setCaptureEnabled] = useState(true);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  // 獲取可用的攝像頭設備
  const handleDevices = (mediaDevices) => {
    const videoDevices = mediaDevices.filter(({ kind }) => kind === "videoinput");
    setDevices(videoDevices);
    if (videoDevices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(videoDevices[0].deviceId);
    }
  };

  // 組件掛載時獲取設備列表
  useState(() => {
    navigator.mediaDevices.enumerateDevices().then(handleDevices);
  }, []);

  // 拍照
  const capture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        onCapture(imageSrc);
        setCaptureEnabled(false);
      }
    }
  };

  // 切換攝像頭
  const handleDeviceChange = (e) => {
    setSelectedDeviceId(e.target.value);
  };

  // 重新拍照
  const retake = () => {
    setCaptureEnabled(true);
  };

  return (
    <div className="webcam-container">
      <div className="webcam-header">
        <h3>拍照</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      {devices.length > 1 && (
        <div className="device-selector">
          <label>選擇攝像頭：</label>
          <select value={selectedDeviceId} onChange={handleDeviceChange}>
            {devices.map((device, index) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `攝像頭 ${index + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div className="webcam-wrapper">
        {isCaptureEnabled ? (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
              facingMode: "user"
            }}
            className="webcam"
          />
        ) : (
          <img 
            src={webcamRef.current?.getScreenshot()} 
            alt="Captured" 
            className="captured-image" 
          />
        )}
      </div>
      
      <div className="webcam-controls">
        {isCaptureEnabled ? (
          <button className="capture-button" onClick={capture}>
            拍照
          </button>
        ) : (
          <div className="after-capture-controls">
            <button className="retake-button" onClick={retake}>
              重新拍照
            </button>
            <button 
              className="use-photo-button" 
              onClick={() => onCapture(webcamRef.current?.getScreenshot())}
            >
              使用此照片
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebcamCapture;
