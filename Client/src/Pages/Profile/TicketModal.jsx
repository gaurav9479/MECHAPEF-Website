import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { FaTimes, FaCalendarAlt, FaMapMarkerAlt, FaTicketAlt } from 'react-icons/fa';
import { formatEventDateTime } from '../../utils/datetime';
import './TicketModal.css';

const TicketModal = ({ registration, onClose }) => {
  const [qrZoom, setQrZoom] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setQrZoom(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!registration) return null;

  const event = registration.eventId;

  if (!event) return null;

  const qrData = JSON.stringify({
    eventId: event._id,
    registrationId: registration._id,
  });

  return (
    <div className="ticket-modal-overlay" onClick={onClose}>
      <div className="ticket-modal-content" onClick={e => e.stopPropagation()}>
        <div className="boarding-pass">

          <div className="bp-main">
            <div className="bp-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="bp-airline"><FaTicketAlt /> MECHAPEF </span>
                <span style={{ background: 'rgba(0, 229, 255, 0.15)', color: '#00e5ff', border: '1px solid rgba(0, 229, 255, 0.4)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e5ff', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
                  LIVE TICKET • {liveTime.toLocaleTimeString()}
                </span>
              </div>
              <button onClick={onClose} className="bp-close-btn"><FaTimes /></button>
            </div>

            <div className="bp-body">
              <div className="bp-row">
                <div className="bp-block">
                  <span className="bp-label">PASSENGER NAME</span>
                  <strong className="bp-value" title={registration.registeredBy?.name || registration.teamName || 'Participant'}>
                    {registration.registeredBy?.name || registration.teamName || 'Participant'}
                  </strong>
                </div>
                <div className="bp-block align-right">
                  <span className="bp-label">FLIGHT / EVENT</span>
                  <strong className="bp-value text-highlight">{event.category}</strong>
                </div>
              </div>

              <div className="bp-title-row">
                <h2>{event.title}</h2>
              </div>

              <div className="bp-row">
                <div className="bp-block">
                  <span className="bp-label">DATE & TIME</span>
                  <strong className="bp-value">
                    <FaCalendarAlt /> {event.startTime ? formatEventDateTime(event.startTime) : 'TBA'}
                  </strong>
                </div>
                <div className="bp-block">
                  <span className="bp-label">GATE / VENUE</span>
                  <strong className="bp-value"><FaMapMarkerAlt /> {event.venue}</strong>
                </div>
                <div className="bp-block align-right">
                  <span className="bp-label">TICKET TYPE</span>
                  <strong className="bp-value">{registration.registrationType}</strong>
                </div>
              </div>

              {/* Verification Stages Progress (Only if QR scan is enabled) */}
              {event.enableQRScanning !== false && (
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed rgba(255, 255, 255, 0.15)' }}>
                  <span className="bp-label" style={{ display: 'block', marginBottom: '8px', color: '#ff1f01' }}>TICKET VERIFICATION STAGES</span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {((event.ticketStages && event.ticketStages.length > 0) ? event.ticketStages : ['Stage 1: Check-in']).map((stageName, idx) => {
                      const completed = (registration.completedStages || []).find(
                        s => s.stageName?.toLowerCase() === stageName?.toLowerCase()
                      );
                      return (
                        <div 
                          key={idx} 
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: completed ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            border: completed ? '1px solid rgba(0, 229, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                            color: completed ? '#00e5ff' : '#888'
                          }}
                        >
                          <span>{completed ? '✓' : '⏳'}</span>
                          <span>{stageName}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bp-divider">
            <div className="bp-cutout top"></div>
            <div className="bp-cutout bottom"></div>
          </div>

          <div className="bp-stub">
            <div className="bp-stub-top">
              <span className="bp-label">BOARDING PASS</span>
              <strong className="bp-value mono">{registration._id.slice(-6).toUpperCase()}</strong>
            </div>

            <div className="bp-qr">
              {event.enableQRScanning !== false ? (
                <div className="qr-frame qr-clickable" onClick={() => setQrZoom(true)}>
                  <QRCodeSVG value={qrData} size={100} level="H" includeMargin={false} fgColor="#000000" />
                </div>
              ) : (
                <div style={{ 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                  width: '100px', height: '100px', background: 'rgba(0, 229, 255, 0.05)', 
                  border: '1.5px dashed rgba(0, 229, 255, 0.3)', borderRadius: '8px', color: '#00e5ff' 
                }}>
                  <span style={{ fontSize: '2rem' }}>✓</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '0.5px', marginTop: '2px' }}>CONFIRMED</span>
                </div>
              )}
            </div>

            {event.enableQRScanning !== false && qrZoom && (
              <div className="qr-lightbox" onClick={() => setQrZoom(false)}>
                <div className="qr-lightbox-content" onClick={e => e.stopPropagation()}>
                  <QRCodeSVG value={qrData} size={280} level="H" includeMargin={false} fgColor="#000000" />
                </div>
              </div>
            )}

            <div className="bp-stub-bottom">
              <span className="bp-scan-text">
                {event.enableQRScanning !== false ? 'SCAN AT GATE' : 'REGISTERED'}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TicketModal;
