import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaEdit, FaTimes, FaCheck } from 'react-icons/fa';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './EditableImage.css';

const EditableImage = ({ 
  sectionKey, 
  label, 
  currentImage, 
  onUploadSuccess, 
  className, 
  style, 
  children 
}) => {
  const { user } = useAuth();
  const [hovered, setHovered] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [cropping, setCropping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dynamicRatio, setDynamicRatio] = useState(1);
  const cropperRef = useRef(null);
  const fileInputRef = useRef(null);
  const wrapperRef = useRef(null);

  // Editing is disabled on the frontend. Use Admin Portal -> Management -> Image Manager instead.
  const canEdit = false; 

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Calculate dynamic aspect ratio from wrapper element
    if (wrapperRef.current) {
      const { clientWidth, clientHeight } = wrapperRef.current;
      if (clientWidth && clientHeight) {
        setDynamicRatio(clientWidth / clientHeight);
      }
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result);
      setCropping(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUpload = async () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;
    
    setUploading(true);
    try {
      const canvas = cropper.getCroppedCanvas({ maxWidth: 1920, maxHeight: 1080 });
      const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92));

      const formData = new FormData();
      formData.append('image', blob, `${sectionKey}.jpg`);
      formData.append('folder', '/mechapef/sections');

      const uploadRes = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { url, fileId } = uploadRes.data.data;

      await api.post('/upload/sections', {
        sectionKey,
        label,
        imageURL: url,
        imagekitFileId: fileId,
      });

      setCropping(false);
      setCropSrc(null);
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      console.error("Upload failed", error);
      alert('Failed to upload image. Check console.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div 
      ref={wrapperRef}
      className={`editable-image-wrapper ${className || ''}`}
      style={{ ...style, position: 'relative', overflow: 'hidden' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* If currentImage exists, show it. Otherwise show children if provided. Otherwise show default fallback. */}
      {currentImage ? (
        <div 
          className="editable-bg-content"
          style={{ 
            background: `url(${currentImage}) center/cover no-repeat`,
            width: '100%',
            height: '100%',
            borderRadius: 'inherit'
          }}
        />
      ) : children ? (
        <div className="editable-children-wrapper" style={{ width: '100%', height: '100%', borderRadius: 'inherit' }}>
          {children}
        </div>
      ) : (
        <div 
          className="editable-bg-content"
          style={{ 
            background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
            width: '100%',
            height: '100%',
            borderRadius: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span style={{ color: '#555', fontFamily: 'sans-serif', fontSize: '1rem' }}>
            {label}
          </span>
        </div>
      )}

      {/* Edit Overlay */}
      {canEdit && hovered && !cropping && (
        <div className="editable-overlay">
          <button 
            className="editable-btn" 
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            title={`Edit ${label}`}
          >
            <FaEdit />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept="image/*" 
            onChange={handleFileChange} 
          />
        </div>
      )}

      {/* Fullscreen Cropper Modal via React Portal to escape Framer Motion transforms */}
      {cropping && cropSrc && createPortal(
        <div className="inline-cropper-modal" onClick={(e) => e.stopPropagation()}>
          <div className="inline-cropper-content">
            <div className="inline-cropper-header">
              <h3>Crop Image for {label}</h3>
              <button className="inline-cropper-close" onClick={() => setCropping(false)} disabled={uploading}>
                <FaTimes />
              </button>
            </div>
            <div className="inline-cropper-body">
              <Cropper
                src={cropSrc}
                style={{ height: 400, width: '100%' }}
                initialAspectRatio={dynamicRatio}
                aspectRatio={dynamicRatio}
                guides={true}
                ref={cropperRef}
                viewMode={1}
                background={false}
              />
            </div>
            <div className="inline-cropper-actions">
              <button className="btn-secondary" onClick={() => setCropping(false)} disabled={uploading}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleUpload} disabled={uploading}>
                {uploading ? 'Uploading...' : <><FaCheck style={{marginRight: '8px'}}/> Save & Upload</>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default EditableImage;
