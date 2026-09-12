import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import './Magazine.css';

const Magazine = () => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    const fetchMagazine = async () => {
      try {
        const res = await api.get('/magazine');
        if (res.data?.data?.magazine?.pdfUrl) {
          setPdfUrl(res.data.data.magazine.pdfUrl);
        }
      } catch (error) {
        console.error("Failed to fetch magazine PDF", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMagazine();
  }, []);

  return (
    <div className="magazine-container">

      {(loading || (pdfUrl && !iframeLoaded)) && (
        <div className="magazine-loading">
          <div className="spinner"></div>
          <p>Loading Magazine...</p>
        </div>
      )}
      
      {!loading && pdfUrl ? (
        <iframe 
          src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
          title="MechaPEF Magazine"
          className="magazine-iframe"
          frameBorder="0"
          onLoad={() => setIframeLoaded(true)}
          style={{ opacity: iframeLoaded ? 1 : 0, transition: 'opacity 0.3s ease-in' }}
        ></iframe>
      ) : !loading && !pdfUrl ? (
        <div className="magazine-empty">
          <h2>Magazine Coming Soon!</h2>
          <p>The latest edition hasn't been published yet. Please check back later.</p>
        </div>
      ) : null}
    </div>
  );
};

export default Magazine;
