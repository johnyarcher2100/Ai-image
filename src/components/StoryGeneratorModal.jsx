import React, { useState, useEffect, useRef } from 'react';
import StoryGenerator from './StoryGenerator';
import '../styles/StoryGeneratorModal.css';

const StoryGeneratorModal = ({ isOpen, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 80 });
  const modalRef = useRef(null);
  const dragRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });

  // 處理拖動開始
  const handleDragStart = (e) => {
    if (e.target !== dragRef.current && !dragRef.current.contains(e.target)) return;

    isDraggingRef.current = true;
    dragStartPosRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };

    // 防止文本選擇
    e.preventDefault();
  };

  // 處理拖動中
  const handleDrag = (e) => {
    if (!isDraggingRef.current) return;

    const newX = e.clientX - dragStartPosRef.current.x;
    const newY = e.clientY - dragStartPosRef.current.y;

    // 確保不會拖出視窗
    const maxX = window.innerWidth - (modalRef.current?.offsetWidth || 400);
    const maxY = window.innerHeight - 50;

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  // 處理拖動結束
  const handleDragEnd = () => {
    isDraggingRef.current = false;
  };

  // 添加全局事件監聽器
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleDragEnd);

      return () => {
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isOpen, position]);

  // 切換最小化狀態
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`story-generator-modal ${isMinimized ? 'minimized' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? '200px' : '400px',
        height: isMinimized ? '40px' : '80vh'
      }}
      ref={modalRef}
    >
      <div
        className="modal-header"
        ref={dragRef}
        onMouseDown={handleDragStart}
      >
        <div className="modal-title">
          <i className="fas fa-images"></i> 連續圖像生成
        </div>
        <div className="modal-controls">
          <button className="minimize-button" onClick={toggleMinimize} title={isMinimized ? "展開" : "最小化"}>
            <i className={`fas ${isMinimized ? 'fa-expand-alt' : 'fa-compress-alt'}`}></i>
          </button>
          <button className="close-button" onClick={onClose} title="關閉">
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="modal-content">
          <StoryGenerator />
        </div>
      )}
    </div>
  );
};

export default StoryGeneratorModal;
