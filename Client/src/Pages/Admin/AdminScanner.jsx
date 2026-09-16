import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { FaQrcode, FaCheckCircle, FaExclamationTriangle, FaArrowLeft, FaTimesCircle } from 'react-icons/fa';
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
  const [attendanceMethod, setAttendanceMethod] = useState('qr');

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
  const feedbackTimerRef = useRef(null);

  useEffect(() => {
    selectedStageRef.current = selectedStage;
  }, [selectedStage]);

  const clearScanFeedback = () => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = null;
    setScanResult(null);
    setError(null);
    setAlreadyMarked(false);
    setCooldownActive(false);
    setStatusMessage('');
    lastScannedRef.current = null;
    isProcessingRef.current = false;
  };

  const showScanFeedback = ({ registration = null, message = '', already = false, cooldown = false, errorMessage = '' }) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setScanResult(registration);
    setError(errorMessage || null);
    setAlreadyMarked(already);
    setCooldownActive(cooldown);
    setStatusMessage(message || errorMessage);
    feedbackTimerRef.current = setTimeout(clearScanFeedback, 2000);
  };

  useEffect(() => () => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
  }, []);

  useEffect(() => {
    api.get('/events').then(res => {
      const evList = res.data.data?.events || [];
      setEvents(evList);


      if (user?.assignedEvent) {
        const assignedEvId = typeof user.assignedEvent === 'object' ? user.assignedEvent._id : user.assignedEvent;
        const matchedEv = evList.find(e => e._id === assignedEvId);
        if (matchedEv) {
          setSelectedEventId(matchedEv._id);
          const stages = matchedEv.attendanceMethod === 'none' ? [] : (matchedEv.ticketStages && matchedEv.ticketStages.length > 0 ? matchedEv.ticketStages : ['Stage 1: Check-in']);
          setAvailableStages(stages);
          const targetStg = user.assignedStage || stages[0];
          setSelectedStage(targetStg);
          setIsEndorsed(true);
          setAttendanceMethod(matchedEv.attendanceMethod || (matchedEv.enableQRScanning === false ? 'id-card' : 'qr'));
          return;
        }
      }

      if (evList.length > 0) {
        setSelectedEventId(evList[0]._id);
        const stages = evList[0].attendanceMethod === 'none' ? [] : (evList[0].ticketStages && evList[0].ticketStages.length > 0 ? evList[0].ticketStages : ['Stage 1: Check-in']);
        setAvailableStages(stages);
        setSelectedStage(stages[0]);
        setAttendanceMethod(evList[0].attendanceMethod || (evList[0].enableQRScanning === false ? 'id-card' : 'qr'));
      }
    }).catch(() => { });
  }, [user]);

  const handleEventChange = (eventId) => {
    setSelectedEventId(eventId);
    const ev = events.find(e => e._id === eventId);
    const stages = ev?.attendanceMethod === 'none' ? [] : (ev?.ticketStages && ev.ticketStages.length > 0 ? ev.ticketStages : ['Stage 1: Check-in']);
    setAvailableStages(stages);
    setSelectedStage(stages[0]);
    setAttendanceMethod(ev?.attendanceMethod || (ev?.enableQRScanning === false ? 'id-card' : 'qr'));
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
      showScanFeedback({
        registration: reg,
        already: !!payload.alreadyMarked,
        cooldown: !!payload.cooldownActive,
        message: res.data.message || (payload.alreadyMarked ? `Already scanned for ${stageToVerify}` : `${stageToVerify} Verified!`)
      });
    } catch (err) {
      showScanFeedback({ errorMessage: err.response?.data?.message || 'Failed to verify ticket.' });
    } finally {
      setLoading(false);
    }
  };

  const verifyBarcodeAttendance = async (collegeRegNo) => {
    const stageToVerify = selectedStageRef.current || 'Stage 1: Check-in';
    const res = await api.put(
      `/events/${selectedEventId}/registrations/by-college-reg-no/${encodeURIComponent(collegeRegNo)}/attendance`,
      { attended: true, stageName: stageToVerify }
    );
    const payload = res.data.data || {};
    const reg = payload.registration || payload;
    showScanFeedback({
      registration: reg,
      already: !!payload.alreadyMarked,
      cooldown: !!payload.cooldownActive,
      message: res.data.message || (payload.alreadyMarked ? `Already scanned for ${stageToVerify}` : `${stageToVerify} Verified!`)
    });
  };

  const verifyDepartmentalQr = async (token) => {
    setLoading(true); setError(null); setScanResult(null); setCooldownActive(false); setStatusMessage('');
    try {
      const res = await api.post('/departmental-registrations/scan', { token });
      const payload = res.data.data || {};
      showScanFeedback({
        registration: { _id: payload.registration?.collegeRegNo, ...payload.registration },
        message: res.data.message || 'Departmental registration verified'
      });
    } catch (err) {
      showScanFeedback({ errorMessage: err.response?.data?.message || 'Invalid departmental QR' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedEventId) return undefined;

    const readerElement = document.getElementById('reader');
    if (readerElement) {
      readerElement.innerHTML = '';
    }

    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => { });
      scannerRef.current = null;
    }

    if (attendanceMethod === 'none') return undefined;

    const scanner = new Html5QrcodeScanner(
      'reader',
      {
        fps: 10,
        qrbox: { width: 280, height: 180 },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E
        ]
      },
      false
    );
    scannerRef.current = scanner;

    const onScanSuccess = async (decodedText) => {
      if (isProcessingRef.current || decodedText === lastScannedRef.current) return;

      isProcessingRef.current = true;
      lastScannedRef.current = decodedText;

      try {
        const scannedValue = decodedText.trim();
        let data;

        try {
          data = JSON.parse(scannedValue);
        } catch {
          data = null;
        }

        if (data?.type === 'departmental-registration' && data?.token) {
          await verifyDepartmentalQr(data.token);
        } else if (data?.eventId && data?.registrationId) {
          await verifyAndMarkAttendance(data.eventId, data.registrationId);
        } else if (attendanceMethod === 'id-card' && scannedValue) {
          await verifyBarcodeAttendance(scannedValue);
        } else {
          throw new Error('Invalid ticket barcode.');
        }
      } catch (err) {
        setLoading(false);
        showScanFeedback({ errorMessage: err.response?.data?.message || `Invalid ${attendanceMethod === 'id-card' ? 'ID card barcode' : 'QR ticket'}.` });
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
  }, [attendanceMethod, selectedEventId]);

  const handleBackClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    try {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => { });
        scannerRef.current = null;
      }
    } catch {

    }

    const target = user?.role === 'endorsed-volunteer' ? '/' : (user?.role === 'super-admin' || user?.role === 'event-lead' || user?.role === 'media-lead') ? '/admin' : '/';
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
        <p>{attendanceMethod === 'none' ? 'This event is configured for registration only.' : `Scan participant ${attendanceMethod === 'id-card' ? 'ID card barcodes' : 'QR codes'} at entry & verification stations.`}</p>
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
                disabled={isEndorsed || attendanceMethod === 'none'}
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
          {selectedEventId && attendanceMethod !== 'none' ? (
            <div id="reader" className="qr-reader-box"></div>
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              minHeight: '280px', background: '#1a1010', border: '2px dashed #ff1f01',
              borderRadius: '16px', padding: '32px', textAlign: 'center', gap: '16px'
            }}>
              <span style={{ fontSize: '3rem' }}>🚫</span>
              <h2 style={{ color: '#ff1f01', margin: 0, fontSize: '1.3rem' }}>Scanner Unavailable</h2>
              <p style={{ color: '#aaa', margin: 0, fontSize: '0.9rem', maxWidth: '280px' }}>
                {attendanceMethod === 'none'
                  ? 'This event has no scanning stages. Registrations do not require gate verification.'
                  : `Select an event to start the ${attendanceMethod === 'id-card' ? 'ID card barcode' : 'QR code'} scanner.`}
              </p>
            </div>
          )}
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
                <p>Point camera at a participant {attendanceMethod === 'id-card' ? 'ID card barcode' : 'ticket QR code'}.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {(scanResult || error) && !loading && (() => {
        const isAlreadyScanned = cooldownActive || alreadyMarked;
        const feedbackKind = error ? 'error' : (isAlreadyScanned ? 'already' : 'success');
        const heading = error ? 'INVALID SCAN' : (isAlreadyScanned ? 'ALREADY SCANNED' : 'VALID ENTRY');
        const feedbackMessage = error || statusMessage || (isAlreadyScanned ? 'This ticket has already been used for this stage.' : 'Attendance marked successfully.');
        const participantName = scanResult?.name || scanResult?.registeredBy?.name;

        return (
          <div className={`scanner-overlay ${feedbackKind}-overlay`} role="status" aria-live="assertive">
            <div className="overlay-content">
              <div className="overlay-icon">
                {feedbackKind === 'success' ? <FaCheckCircle /> : feedbackKind === 'already' ? <FaExclamationTriangle /> : <FaTimesCircle />}
              </div>
              <h2>{heading}</h2>
              <p>{feedbackMessage}</p>
              {participantName && <p className="overlay-person">{participantName}</p>}
              <button type="button" className="scan-again-button" onClick={clearScanFeedback}>Scan Again</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default AdminScanner;
