import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { FaQrcode, FaCheckCircle, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './AdminScanner.css';

const AdminScanner = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [availableStages, setAvailableStages] = useState(['Stage 1: Check-in']);
  const [selectedStage, setSelectedStage] = useState('Stage 1: Check-in');
  const [isEndorsed, setIsEndorsed] = useState(false);

  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const isProcessingRef = useRef(false);
  const lastScannedRef = useRef(null);
  const scannerRef = useRef(null);
  const selectedStageRef = useRef(selectedStage);

  useEffect(() => {
    selectedStageRef.current = selectedStage;
  }, [selectedStage]);

  useEffect(() => {
    api.get('/events').then(res => {
      const evList = res.data.data?.events || [];
      setEvents(evList);

      // Check if user is an endorsed Scanner Holder
      if (user?.assignedEvent) {
        const assignedEvId = typeof user.assignedEvent === 'object' ? user.assignedEvent._id : user.assignedEvent;
        const matchedEv = evList.find(e => e._id === assignedEvId);
        if (matchedEv) {
          setSelectedEventId(matchedEv._id);
          const stages = matchedEv.ticketStages && matchedEv.ticketStages.length > 0 ? matchedEv.ticketStages : ['Stage 1: Check-in'];
          setAvailableStages(stages);
          const targetStg = user.assignedStage || stages[0];
          setSelectedStage(targetStg);
          setIsEndorsed(true);
          return;
        }
      }

      if (evList.length > 0) {
        setSelectedEventId(evList[0]._id);
        const stages = evList[0].ticketStages && evList[0].ticketStages.length > 0 ? evList[0].ticketStages : ['Stage 1: Check-in'];
        setAvailableStages(stages);
        setSelectedStage(stages[0]);
      }
    }).catch(() => {});
  }, [user]);

  const handleEventChange = (eventId) => {
    setSelectedEventId(eventId);
    const ev = events.find(e => e._id === eventId);
    const stages = ev?.ticketStages && ev.ticketStages.length > 0 ? ev.ticketStages : ['Stage 1: Check-in'];
    setAvailableStages(stages);
    setSelectedStage(stages[0]);
  };

  const verifyAndMarkAttendance = async (eventId, regId) => {
    setLoading(true);
    setError(null);
    setScanResult(null);
    setCooldownActive(false);
    setStatusMessage('');

    try {
      const stageToVerify = selectedStageRef.current || 'Stage 1: Check-in';
      const res = await api.put(`/events/${eventId}/registrations/${regId}/attendance`, {
        attended: true,
        stageName: stageToVerify
      });
      const payload = res.data.data || {};
      const reg = payload.registration || payload;
      setScanResult(reg);
      setAlreadyMarked(!!payload.alreadyMarked);
      setCooldownActive(!!payload.cooldownActive);
      setStatusMessage(res.data.message || (payload.alreadyMarked ? `Already scanned for ${stageToVerify}` : `${stageToVerify} Verified!`));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify ticket.');
    } finally {
      setLoading(false);
      isProcessingRef.current = false;

      setTimeout(() => {
        setScanResult(null);
        setError(null);
        setCooldownActive(false);
        setStatusMessage('');
        lastScannedRef.current = null;
      }, 4000);
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

  const handleBackClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    try {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    } catch {
      // Ignore cleanup error
    }

    const target = user?.role === 'endorsed-volunteer' ? '/' : (user?.role === 'super-admin' || user?.role === 'content-lead' || user?.role === 'event-lead') ? '/admin' : '/';
    window.location.href = target;
  };

  return (
    <div className="admin-scanner-page">
      <div className="scanner-header">
        <button 
          className="scanner-back-btn" 
          type="button" 
          onClick={handleBackClick} 
          style={{ position: 'relative', zIndex: 9999, cursor: 'pointer', pointerEvents: 'auto' }}
        >
          <FaArrowLeft /> {user?.role === 'endorsed-volunteer' ? 'Back to Home' : 'Back to Admin'}
        </button>
        <h1><FaQrcode /> Ticket Scanner</h1>
        <p>Scan participant QR codes at entry & verification stations.</p>
      </div>

      <div className="scanner-container">
        {/* Stage Selection Bar */}
        <div style={{ background: '#111116', border: isEndorsed ? '1px solid #00e5ff' : '1px solid #22222a', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
          {isEndorsed && (
            <div style={{ background: 'rgba(0, 229, 255, 0.1)', border: '1px solid rgba(0, 229, 255, 0.3)', color: '#00e5ff', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔒 ENDORSED SCANNER STATION</span>
              <span>•</span>
              <span>Assigned specifically for your account</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1 1 250px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#ff1f01', fontWeight: 'bold', marginBottom: '6px' }}>Select Event:</label>
              <select 
                value={selectedEventId} 
                onChange={(e) => handleEventChange(e.target.value)}
                disabled={isEndorsed}
                style={{ width: '100%', padding: '10px 14px', background: '#1a1a20', color: '#fff', border: '1px solid #333', borderRadius: '8px', fontSize: '0.9rem', opacity: isEndorsed ? 0.8 : 1 }}
              >
                {events.map(ev => (
                  <option key={ev._id} value={ev._id}>{ev.title}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: '1 1 280px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#00e5ff', fontWeight: 'bold', marginBottom: '6px' }}>Active Scanning Station / Stage:</label>
              <select 
                value={selectedStage} 
                onChange={(e) => setSelectedStage(e.target.value)}
                disabled={isEndorsed}
                style={{ width: '100%', padding: '10px 14px', background: '#0d2d3a', color: '#00e5ff', border: '1px solid #00e5ff', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold', opacity: isEndorsed ? 0.8 : 1 }}
              >
                {availableStages.map((stg, i) => (
                  <option key={i} value={stg}>{stg}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="scanner-grid">
          <div id="reader" className="qr-reader-box"></div>

          <div className="scanner-status-panel">
            {loading ? (
              <div className="scanner-status-card loading-card">
                <div className="status-icon loading-icon"></div>
                <h2>VERIFYING STAGE...</h2>
                <p>{selectedStage}</p>
              </div>
            ) : scanResult ? (
              <div className={cooldownActive ? "scanner-status-card already-card" : alreadyMarked ? "scanner-status-card already-card" : "scanner-status-card success-card"}>
                <div className={cooldownActive || alreadyMarked ? "status-icon already-circle" : "status-icon verified-circle"}>
                  {cooldownActive || alreadyMarked ? <FaExclamationTriangle /> : <FaCheckCircle />}
                </div>
                <h2>{cooldownActive ? 'SCAN COOLDOWN ACTIVE' : alreadyMarked ? 'ALREADY SCANNED' : 'VERIFIED!'}</h2>
                <h3 style={{ color: cooldownActive ? '#ff9900' : alreadyMarked ? '#ffaa00' : '#00e5ff', margin: '8px 0', fontSize: '1rem' }}>
                  {selectedStage}
                </h3>
                <p style={{ fontWeight: 'bold', color: cooldownActive ? '#ffaa00' : '#fff', marginTop: '6px' }}>{statusMessage}</p>
                <p style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '4px' }}>Ticket: {scanResult._id?.slice(-6).toUpperCase()}</p>
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
                <span style={{ fontSize: '0.78rem', background: '#0d2d3a', color: '#00e5ff', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', marginBottom: '8px' }}>
                  Active Stage: {selectedStage}
                </span>
                <h2>Ready To Scan</h2>
                <p>Point camera at participant ticket QR code.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminScanner;
