import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { FaTimes, FaCalendarAlt, FaMapMarkerAlt, FaTicketAlt } from 'react-icons/fa';
import './TicketModal.css';

const TicketModal = ({ registration, onClose }) => {
  if (!registration) return null;

  const event = registration.eventId;
  // If event is not populated properly, fallback
  if (!event) return null;

  const qrData = JSON.stringify({
    eventId: event._id,
    registrationId: registration._id,
  });

  return (
    <div className="ticket-modal-overlay" onClick={onClose}>
      <div className="ticket-modal-content" onClick={e => e.stopPropagation()}>
        <div className="cute-ticket">
          {/* Holographic glow border */}
          <div className="cute-ticket-glow"></div>
          
          <div className="cute-ticket-inner">
             {/* Left and right cutouts for authentic ticket feel */}
             <div className="cutout left"></div>
             <div className="cutout right"></div>

             <div className="cute-ticket-header">
                <h3><FaTicketAlt /> VIP PASS</h3>
                <button onClick={onClose} className="cute-close-btn"><FaTimes /></button>
             </div>

             <div className="cute-ticket-main">
                <span className="cute-tag">{event.category}</span>
                <h2>{event.title}</h2>
                <div className="cute-details">
                  <div className="cute-detail-item">
                    <FaCalendarAlt />
                    <span>{event.startTime ? new Date(event.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA'}</span>
                  </div>
                  <div className="cute-detail-item">
                    <FaMapMarkerAlt />
                    <span>{event.venue}</span>
                  </div>
                </div>
             </div>

             <div className="cute-divider"></div>

             <div className="cute-ticket-bottom">
                <div className="cute-qr">
                  <div className="qr-frame">
                    <QRCodeSVG value={qrData} size={110} level="H" includeMargin={false} fgColor="#000000" />
                  </div>
                  <span className="cute-scan-text">SCAN AT ENTRY</span>
                </div>
                
                <div className="cute-info">
                  <div className="cute-info-block">
                    <span className="info-label">PARTICIPANT</span>
                    <strong className="info-value" title={registration.registeredBy?.name || registration.teamName || 'Participant'}>
                      {registration.registeredBy?.name || registration.teamName || 'Participant'}
                    </strong>
                  </div>
                  <div className="cute-info-block">
                    <span className="info-label">TICKET ID</span>
                    <strong className="info-value mono">{registration._id.slice(-6).toUpperCase()}</strong>
                  </div>
                  <div className="cute-info-block">
                    <span className="info-label">TYPE</span>
                    <strong className="info-value">{registration.registrationType}</strong>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketModal;
