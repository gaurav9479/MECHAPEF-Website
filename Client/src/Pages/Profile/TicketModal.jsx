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
        <div className="ticket-card">
          <div className="ticket-header">
            <h3><FaTicketAlt /> Entry Ticket</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="status-badge active">Verified</span>
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: '#fff',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >
                <FaTimes />
              </button>
            </div>
          </div>
          
          <div className="ticket-body">
            <div className="event-info">
              <span className="category-tag">{event.category}</span>
              <h2>{event.title}</h2>
              <div className="event-details">
                <p><FaCalendarAlt /> {event.startTime ? new Date(event.startTime).toLocaleDateString() : 'TBA'}</p>
                <p><FaMapMarkerAlt /> {event.venue}</p>
              </div>
            </div>

            <div className="qr-section">
              <div className="qr-wrapper">
                <QRCodeSVG value={qrData} size={180} level="H" includeMargin={true} />
              </div>
              <p className="scan-instruction">Show this QR code at the entry desk</p>
            </div>
            
            <div className="participant-info">
              <div className="info-row">
                <span>Name:</span>
                <strong>{registration.registeredBy?.name || registration.teamName || 'Participant'}</strong>
              </div>
              <div className="info-row">
                <span>Registration ID:</span>
                <strong className="mono-text">{registration._id.slice(-6).toUpperCase()}</strong>
              </div>
              <div className="info-row">
                <span>Type:</span>
                <strong>{registration.registrationType}</strong>
              </div>
            </div>
          </div>
          
          <div className="ticket-footer">
            <p>MECHAPEF FESTIVAL</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketModal;
