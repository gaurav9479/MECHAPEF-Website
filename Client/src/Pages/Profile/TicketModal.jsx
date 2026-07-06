import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { FaTimes, FaCalendarAlt, FaMapMarkerAlt, FaTicketAlt } from 'react-icons/fa';
import './TicketModal.css';

const TicketModal = ({ registration, onClose }) => {
  const [qrZoom, setQrZoom] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setQrZoom(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
        <div className="boarding-pass">

          <div className="bp-main">
            <div className="bp-header">
              <span className="bp-airline"><FaTicketAlt /> MECHAPEF </span>
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
                    <FaCalendarAlt /> {event.startTime ? new Date(event.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA'}
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
              <div className="qr-frame qr-clickable" onClick={() => setQrZoom(true)}>
                <QRCodeSVG value={qrData} size={100} level="H" includeMargin={false} fgColor="#000000" />
              </div>
            </div>

            {qrZoom && (
              <div className="qr-lightbox" onClick={() => setQrZoom(false)}>
                <div className="qr-lightbox-content" onClick={e => e.stopPropagation()}>
                  <QRCodeSVG value={qrData} size={280} level="H" includeMargin={false} fgColor="#000000" />
                </div>
              </div>
            )}

            <div className="bp-stub-bottom">
              <span className="bp-scan-text">SCAN AT GATE</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TicketModal;
