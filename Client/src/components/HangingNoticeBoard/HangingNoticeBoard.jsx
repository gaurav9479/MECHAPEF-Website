import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaExternalLinkAlt } from 'react-icons/fa';
import api from '../../services/api';
import './HangingNoticeBoard.css';

const HangingNoticeBoard = ({ onClose }) => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleNoticeClick = (link) => {
    if (!link) return;
    onClose(); // Close the board
    if (link.startsWith('http')) {
      window.open(link, '_blank');
    } else if (link.startsWith('/')) {
      navigate(link);
    } else {
      // Treat as event ID
      navigate(`/events/${link}`);
    }
  };

  useEffect(() => {
    // Add Google Font for Chalk style if not already present
    if (!document.getElementById('chalk-font')) {
      const link = document.createElement('link');
      link.id = 'chalk-font';
      link.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    api.get('/announcements')
      .then(res => {
        const active = (res.data.data?.announcements || []).filter(n => n.isActive);
        setNotices(active);
      })
      .catch(err => console.error("Failed to fetch notices", err))
      .finally(() => setLoading(false));
      
    // Prevent body scroll when board is open
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  return (
    <div className="chalkboard-overlay">
      <div className="chalkboard-close-area" onClick={onClose}></div>
      <div className="chalkboard-container">
        {/* Rope/Chains */}
        <div className="chalkboard-ropes">
          <div className="rope left-rope"></div>
          <div className="rope right-rope"></div>
        </div>
        
        {/* Board */}
        <div className="chalkboard">
          <button className="chalkboard-close" onClick={onClose}><FaTimes /></button>
          <div className="chalkboard-wood-frame">
            <div className="chalkboard-inner">
              <h2 className="chalk-title">Notice Board</h2>
              <div className="chalk-divider"></div>
              
              <div className="chalk-notices">
                {loading ? (
                  <p className="chalk-loading">Loading notices...</p>
                ) : notices.length === 0 ? (
                  <p className="chalk-empty">No active notices.</p>
                ) : (
                  notices.map((n, i) => (
                    <div 
                      key={n._id} 
                      className={`chalk-item ${n.targetLink ? 'clickable' : ''}`} 
                      style={{ animationDelay: `${i * 0.15 + 0.5}s`, cursor: n.targetLink ? 'pointer' : 'default' }}
                      onClick={() => handleNoticeClick(n.targetLink)}
                    >
                      <div className="chalk-item-date">
                        {new Date(n.createdAt || n.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="chalk-item-text">
                        {n.title}
                        {n.targetLink && <FaExternalLinkAlt style={{ fontSize: '1rem', marginLeft: '10px', opacity: 0.7 }} />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HangingNoticeBoard;
