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
  const scannerRef = useRef(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    const onScanSuccess = async (decodedText, decodedResult) => {
      // Prevent scanning if currently processing or if scanning the exact same code immediately
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
        
        // Reset lastScanned after 3 seconds so they can try again if they want
        setTimeout(() => { lastScannedRef.current = null; }, 3000);
      }
    };

    const onScanFailure = (err) => {
      // Ignore frequent scan failures
    };

    scannerRef.current.render(onScanSuccess, onScanFailure);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
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
      
      // Automatically clear result and allow scanning same code again after 4 seconds
      setTimeout(() => {
        setScanResult(null);
        setError(null);
        lastScannedRef.current = null;
        setError(null);
      }, 5000);
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
      </div>

      <div className="scanner-results">
        {loading && <div className="scanner-loading">Verifying ticket...</div>}
        
        {scanResult && (
          <div className="result-card success">
            <FaCheckCircle className="result-icon" />
            <h3>Attendance Marked!</h3>
            <div className="result-details">
              <p><strong>Registration ID:</strong> {scanResult._id.slice(-6).toUpperCase()}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="result-card error">
            <FaExclamationTriangle className="result-icon" />
            <h3>Scan Error</h3>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminScanner;
