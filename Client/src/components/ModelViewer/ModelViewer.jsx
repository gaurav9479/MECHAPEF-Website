import React, { useState } from 'react';
import './ModelViewer.css';

const ModelViewer = ({ src, alt = '3D Model', autoRotate = true, cameraControls = true, shadowIntensity = 1 }) => {
  const [loading, setLoading] = useState(true);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
  };

  return (
    <div className="model-viewer-container">
      {loading && (
        <div className="model-viewer-loader">
          <div className="spinner"></div>
          <p>Loading 3D Model...</p>
        </div>
      )}
      
      {/* 
        Using standard HTML elements since model-viewer is a web component registered globally.
        We must ignore React's warnings about non-standard attributes if any, or just use lowercase.
      */}
      <model-viewer
        src={src}
        alt={alt}
        auto-rotate={autoRotate ? 'true' : undefined}
        camera-controls={cameraControls ? 'true' : undefined}
        shadow-intensity={shadowIntensity}
        exposure="1"
        environment-image="neutral"
        onLoad={handleLoad}
        onError={handleError}
        style={{ width: '100%', height: '100%', outline: 'none' }}
      >
      </model-viewer>
    </div>
  );
};

export default ModelViewer;
