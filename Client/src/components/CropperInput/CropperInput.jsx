import React, { useState, useRef } from 'react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import api from '../../services/api';
import './CropperInput.css';
import { FaUpload, FaCrop, FaTimes, FaSpinner } from 'react-icons/fa';

const CropperInput = ({ initialImage, aspect, onSave, label = "Upload Image" }) => {
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
    if (files.length === 0) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSrc(reader.result);
    };
    reader.readAsDataURL(files[0]);
    // clear input so same file can be selected again
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
        formData.append('folder', 'magazine'); // Default folder for now
        
        const res = await api.post('/upload', formData, {
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

      {/* Cropper Modal */}
      {src && (
        <div className="cropper-modal-overlay">
          <div className="cropper-modal">
            <div className="cropper-modal-header">
              <h3><FaCrop /> Crop Image</h3>
              <button type="button" className="close-modal-btn" onClick={cancelCrop}>
                <FaTimes />
              </button>
            </div>
            
            <div className="cropper-modal-body">
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
            
            <div className="cropper-modal-footer">
              <button type="button" className="btn-secondary" onClick={cancelCrop} disabled={uploading}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={cropAndUpload} disabled={uploading}>
                {uploading ? <><FaSpinner className="spin" /> Uploading...</> : 'Crop & Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CropperInput;
