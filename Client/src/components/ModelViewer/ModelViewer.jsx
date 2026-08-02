import React, { useState, useEffect, useRef } from 'react';
import './ModelViewer.css';

const ModelViewer = ({ src, alt = '3D Model', autoRotate = true, cameraControls = true, shadowIntensity = 1 }) => {
  const [loading, setLoading] = useState(true);
  const viewerRef = useRef(null);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const handleLoad = () => {
      setLoading(false);
    };

    const handleError = () => {
      setLoading(false);
    };

    viewer.addEventListener('load', handleLoad);
    viewer.addEventListener('error', handleError);

    // Safety fallback: check if already loaded (e.g. from browser cache)
    if (viewer.loaded) {
      setLoading(false);
    }

    return () => {
      viewer.removeEventListener('load', handleLoad);
      viewer.removeEventListener('error', handleError);
    };
  }, [src]);

  return (
    <div className="model-viewer-container">
      {loading && (
        <div className="model-viewer-loader">
          <div className="spinner"></div>
          <p>Loading 3D Model...</p>
        </div>
      )}
      
      <model-viewer
        ref={viewerRef}
        src={src}
        alt={alt}
        auto-rotate={autoRotate ? 'true' : undefined}
        camera-controls={cameraControls ? 'true' : undefined}
        shadow-intensity={shadowIntensity}
        exposure="1"
        environment-image="neutral"
        style={{ width: '100%', height: '100%', outline: 'none' }}
      >
      </model-viewer>
    </div>
  );
};

export default ModelViewer;
