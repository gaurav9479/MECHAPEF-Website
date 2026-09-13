import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import api from '../../services/api';
import './CropperInput.css';
import { FaUpload, FaCrop, FaTimes, FaSpinner } from 'react-icons/fa';

const CropperInput = ({ initialImage, aspect, onSave, label = "Upload Image", folder = 'magazine' }) => {
  const [src, setSrc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const cropperRef = useRef(null);
  const fileInputRef = useRef(null);

  const onChange = (e) => {
    e.preventDefault();
    let files;
    if (e.dataTransfer) {
      files = e.dataTransfer.files;
    } else if (e.target) {
      files = e.target.files;
    }
    if (!files || files.length === 0) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSrc(reader.result);
    };
    reader.readAsDataURL(files[0]);
    e.target.value = '';
  };

  const cancelCrop = () => {
    setSrc(null);
  };

  const cropAndUpload = async () => {
    if (typeof cropperRef.current?.cropper !== "undefined") {
      setUploading(true);
      try {
        const cropper = cropperRef.current.cropper;
        const canvas = cropper.getCroppedCanvas({
          maxWidth: 1920,
          maxHeight: 1080,
          fillColor: '#fff',
          imageSmoothingEnabled: true,
          imageSmoothingQuality: 'high',
        });

        const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92));
        const formData = new FormData();
        formData.append('file', blob, `cropped_${Date.now()}.jpg`);
        formData.append('folder', folder);

        const res = await api.post('/upload/file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const url = res.data.data.url;
        onSave(url);
        setSrc(null);
      } catch (error) {
        console.error("Upload failed", error);
        alert("Upload failed. Try again.");
      } finally {
        setUploading(false);
      }
    }
  };

  // Render modal via portal so it is ALWAYS at body level — perfectly centered
  const modal = src ? createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
      }}
      onClick={cancelCrop}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '660px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          animation: 'cropperPop 0.28s cubic-bezier(0.16,1,0.3,1) forwards',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0',
          background: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '1rem', color: '#111' }}>
            <FaCrop style={{ color: '#ff1f01' }} />
            Crop Image
          </div>
          <button
            type="button"
            onClick={cancelCrop}
            style={{
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#6b7280',
              fontSize: '0.85rem',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#ff1f01'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#6b7280'; }}
          >
            <FaTimes />
          </button>
        </div>

        {/* CROPPER */}
        <div style={{ background: '#f8f8f8', lineHeight: 0 }}>
          <Cropper
            ref={cropperRef}
            style={{ height: '360px', width: '100%' }}
            initialAspectRatio={aspect}
            aspectRatio={aspect}
            src={src}
            viewMode={1}
            minCropBoxHeight={10}
            minCropBoxWidth={10}
            background={false}
            responsive={true}
            autoCropArea={1}
            checkOrientation={false}
            guides={true}
            zoomable={false}
          />
        </div>

        {/* FOOTER */}
        <div style={{
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          background: '#fff',
          borderTop: '1px solid #f0f0f0',
        }}>
          <button
            type="button"
            onClick={cancelCrop}
            disabled={uploading}
            style={{
              padding: '9px 22px',
              background: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '50px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={cropAndUpload}
            disabled={uploading}
            style={{
              padding: '9px 26px',
              background: uploading ? '#aaa' : '#ff1f01',
              color: '#fff',
              border: 'none',
              borderRadius: '50px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: uploading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(255,31,1,0.35)',
            }}
          >
            {uploading ? <><FaSpinner style={{ animation: 'spin 0.8s linear infinite' }} /> Uploading...</> : 'Crop & Upload'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="cropper-input-container">
      {/* Current Image Preview */}
      {initialImage && (
        <div className="cropper-preview-container">
          <img src={initialImage} alt="Current" className="cropper-preview-img" />
        </div>
      )}

      {/* Upload Button */}
      <button
        type="button"
        className="cropper-upload-btn"
        onClick={() => fileInputRef.current.click()}
      >
        <FaUpload /> {label}
      </button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={onChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Portal Modal — renders at document.body, always perfectly centered */}
      {modal}
    </div>
  );
};

export default CropperInput;
