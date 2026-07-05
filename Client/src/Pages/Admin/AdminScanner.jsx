import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { FaQrcode, FaCheckCircle, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';
import api from '../../services/api';
import './AdminScanner.css';

const AdminScanner = () => {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Use refs to keep track of state inside the scanner callback
  const isProcessingRef = useRef(false);
  const lastScannedRef = useRef(null);

  useEffect(() => {
    // Force clear any leftover DOM from Strict Mode double-mounts
    const readerElement = document.getElementById("reader");
    if (readerElement) {
      readerElement.innerHTML = '';
    }

    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    const onScanSuccess = async (decodedText, decodedResult) => {
      if (isProcessingRef.current || decodedText === lastScannedRef.current) return;
      
      isProcessingRef.current = true;
      lastScannedRef.current = decodedText;
      
      try {
        const data = JSON.parse(decodedText);
        if (!data.eventId || !data.registrationId) {
          throw new Error("Invalid QR Code format.");
        }
        await verifyAndMarkAttendance(data.eventId, data.registrationId);
      } catch (err) {
        setError("Invalid QR Code. Not a valid Mechapef Ticket.");
        setScanResult(null);
        isProcessingRef.current = false;
        
        setTimeout(() => { lastScannedRef.current = null; }, 3000);
      }
    };

    scanner.render(onScanSuccess, () => {});

    return () => {
      try {
        scanner.clear().catch(() => {});
      } catch (e) {}
    };
  }, []);

  const verifyAndMarkAttendance = async (eventId, regId) => {
    setLoading(true);
    setError(null);
    setScanResult(null);

    try {
      const res = await api.put(`/events/${eventId}/registrations/${regId}/attendance`, { attended: true });
      setScanResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify ticket.');
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
      
      // Automatically clear result and allow scanning same code again after 2.5 seconds
      setTimeout(() => {
        setScanResult(null);
        setError(null);
        lastScannedRef.current = null;
      }, 2500);
    }
  };

  return (
    <div className="admin-scanner-page">
      <div className="scanner-header">
        <button className="scanner-back-btn" onClick={() => navigate('/admin')}>
          <FaArrowLeft /> Back to Admin
        </button>
        <h1><FaQrcode /> Ticket Scanner</h1>
        <p>Scan participant QR codes at the entry gate.</p>
      </div>

      <div className="scanner-container">
        <div id="reader" className="qr-reader-box"></div>
        
        {loading && (
          <div className="scanner-overlay loading-overlay">
            <div className="overlay-content">
              <div className="scanner-spinner"></div>
              <h2>VERIFYING...</h2>
            </div>
          </div>
        )}

        {scanResult && (
          <div className="scanner-overlay success-overlay">
            <div className="overlay-content">
              <FaCheckCircle className="overlay-icon" />
              <h2>VERIFIED</h2>
              <p>ID: {scanResult._id.slice(-6).toUpperCase()}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="scanner-overlay error-overlay">
            <div className="overlay-content">
              <FaExclamationTriangle className="overlay-icon" />
              <h2>ERROR</h2>
              <p>{error}</p>
            </div>
          </div>
        )}
      </div>

      <div className="scanner-results">
        <p style={{ color: '#888', textAlign: 'center' }}>Ready to scan next ticket...</p>
      </div>
    </div>
  );
};

export default AdminScanner;
