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
  const [alreadyMarked, setAlreadyMarked] = useState(false);

  const isProcessingRef = useRef(false);
  const lastScannedRef = useRef(null);
  const scannerRef = useRef(null);

  const verifyAndMarkAttendance = async (eventId, regId) => {
    setLoading(true);
    setError(null);
    setScanResult(null);

    try {
      const res = await api.put(`/events/${eventId}/registrations/${regId}/attendance`, { attended: true });
      const payload = res.data.data || {};
      // prefer registration object if returned
      setScanResult(payload.registration || payload);
      setAlreadyMarked(!!payload.alreadyMarked);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify ticket.');
    } finally {
      setLoading(false);
      isProcessingRef.current = false;

      setTimeout(() => {
        setScanResult(null);
        setError(null);
        lastScannedRef.current = null;
      }, 1000);
    }
  };

  useEffect(() => {
    const readerElement = document.getElementById('reader');
    if (readerElement) {
      readerElement.innerHTML = '';
    }

    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => { });
      scannerRef.current = null;
    }

    const scanner = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );
    scannerRef.current = scanner;

    const onScanSuccess = async (decodedText) => {
      if (isProcessingRef.current || decodedText === lastScannedRef.current) return;

      isProcessingRef.current = true;
      lastScannedRef.current = decodedText;

      try {
        const data = JSON.parse(decodedText);
        if (!data.eventId || !data.registrationId) {
          throw new Error('Invalid QR Code format.');
        }
        await verifyAndMarkAttendance(data.eventId, data.registrationId);
      } catch (err) {
        setError('Invalid QR Code. Not a valid Mechapef Ticket.');
        setScanResult(null);
        isProcessingRef.current = false;

        setTimeout(() => { lastScannedRef.current = null; }, 3000);
      }
    };

    scanner.render(onScanSuccess, () => { });

    return () => {
      const reader = document.getElementById('reader');
      if (reader) {
        reader.innerHTML = '';
      }

      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => { });
        scannerRef.current = null;
      }
    };
  }, []);

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
        <div className="scanner-grid">
          <div id="reader" className="qr-reader-box"></div>

          <div className="scanner-status-panel">
            {loading ? (
              <div className="scanner-status-card loading-card">
                <div className="status-icon loading-icon"></div>
                <h2>VERIFYING...</h2>
                <p>Hold on while we validate the ticket.</p>
              </div>
            ) : scanResult ? (
              <div className={alreadyMarked ? "scanner-status-card already-card" : "scanner-status-card success-card"}>
                <div className={alreadyMarked ? "status-icon already-circle" : "status-icon verified-circle"}>
                  {alreadyMarked ? <FaExclamationTriangle /> : <FaCheckCircle />}
                </div>
                <h2>{alreadyMarked ? 'ALREADY SCANNED' : 'VERIFIED'}</h2>
                <p>Ticket ID: {scanResult._id?.slice(-6).toUpperCase()}</p>
                {scanResult.name && <p>{scanResult.name}</p>}
              </div>
            ) : error ? (
              <div className="scanner-status-card error-card">
                <div className="status-icon error-circle">
                  <FaExclamationTriangle />
                </div>
                <h2>ERROR</h2>
                <p>{error}</p>
              </div>
            ) : (
              <div className="scanner-status-card idle-card">
                <h2>Ready</h2>
                <p>Scan next ticket on the left.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminScanner;
