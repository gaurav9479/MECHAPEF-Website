import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaExternalLinkAlt, FaCog, FaWrench, FaClipboardList } from 'react-icons/fa';
import api from '../../services/api';
import './HangingNoticeBoard.css';

/* ── Typewriter hook ── */
const useTypewriter = (text, speed = 28, start = false) => {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    if (!start) { setDisplayed(''); return; }
    setDisplayed('');
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, start]);
  return displayed;
};

/* ── Single notice row with typewriter + decode ── */
const NoticeRow = ({ notice, index, onNavigate }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [decoding, setDecoding] = useState(true);
  const [decoded, setDecoded] = useState('');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#$@!%&*';

  const typed = useTypewriter(notice.title, 25, visible && !decoding);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let frame = 0;
    const totalFrames = 14;
    const id = setInterval(() => {
      frame++;
      if (frame >= totalFrames) { clearInterval(id); setDecoding(false); return; }
      setDecoded(notice.title.split('').map((ch, i) => (i < frame * 2 ? ch : chars[Math.floor(Math.random() * chars.length)])).join(''));
    }, 45);
    return () => clearInterval(id);
  }, [visible]);

  return (
    <motion.div
      ref={ref}
      className={`hnb-notice-row ${notice.targetLink ? 'hnb-clickable' : ''}`}
      initial={{ opacity: 0, x: -24 }}
      animate={visible ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.12 }}
      onClick={() => notice.targetLink && onNavigate(notice.targetLink)}
    >
      {/* Left: index number */}
      <div className="hnb-row-idx">{String(index + 1).padStart(2, '0')}</div>

      {/* Status dot */}
      <div className={`hnb-status-dot ${notice.isActive ? 'active' : ''}`} />

      {/* Main text - decode then typewriter */}
      <div className="hnb-row-content">
        <div className="hnb-row-title">
          {decoding ? decoded : typed}
          <span className="hnb-cursor">█</span>
        </div>
        <div className="hnb-row-meta">
          <span>{notice.targetType || 'GENERAL'}</span>
          <span>·</span>
          <span>{new Date(notice.createdAt || notice.startDate || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Right: action */}
      {notice.targetLink && (
        <div className="hnb-row-action">
          <FaExternalLinkAlt />
        </div>
      )}
    </motion.div>
  );
};

/* ── Main Component ── */
const HangingNoticeBoard = ({ onClose }) => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bootLine, setBootLine] = useState(0);
  const navigate = useNavigate();

  const BOOT_LINES = [
    '> RELEASING HYDRAULIC LOCKS...',
    '> ALIGNING GEARS...',
    '> UNROLLING NOTICE FEED...',
    '> MECHANICAL SYSTEM READY.',
  ];

  const handleNoticeClick = (link) => {
    if (!link) return;
    onClose();
    if (link.startsWith('http')) window.open(link, '_blank');
    else if (link.startsWith('/')) navigate(link);
    else navigate(`/events/${link}`);
  };

  useEffect(() => {
    api.get('/announcements')
      .then(res => {
        const active = (res.data.data?.announcements || []).filter(n => n.isActive);
        setNotices(active);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      setBootLine(i);
      if (i >= BOOT_LINES.length) clearInterval(id);
    }, 380);
    return () => clearInterval(id);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        className="hnb-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          className="hnb-terminal"
          initial={{ scale: 0.88, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        >
          {/* ── Terminal Header Bar ── */}
          <div className="hnb-header-bar">
            <div className="hnb-header-left">
              <FaClipboardList className="hnb-header-icon" />
              <span className="hnb-header-title">MECHAPEF <span>NOTICE BOARD</span></span>
            </div>
            <div className="hnb-header-right">
              <div className="hnb-wifi"><FaCog className="spin-cog" /></div>
              <div className="hnb-chip"><FaWrench /></div>
              <button className="hnb-close-btn" onClick={onClose}><FaTimes /></button>
            </div>
          </div>

          {/* ── Mechanical overlay ── */}
          <div className="hnb-metal-texture" aria-hidden="true" />
          <div className="hnb-caution-stripe top" aria-hidden="true" />

          {/* ── Boot Sequence ── */}
          <div className="hnb-boot-seq">
            {BOOT_LINES.slice(0, bootLine).map((line, i) => (
              <div key={i} className="hnb-boot-line">{line}</div>
            ))}
          </div>

          {/* ── Title ── */}
          <div className="hnb-section-title">
            <span className="hnb-title-bracket">[</span>
            NOTICE FEED
            <span className="hnb-title-bracket">]</span>
            <span className="hnb-title-count">
              {loading ? '---' : String(notices.length).padStart(3, '0')} ACTIVE
            </span>
          </div>

          {/* ── Notices ── */}
          <div className="hnb-notices-list">
            {loading ? (
              <div className="hnb-loading-state">
                <div className="hnb-spinner" />
                <span>FETCHING ENCRYPTED DATA...</span>
              </div>
            ) : notices.length === 0 ? (
              <div className="hnb-empty">NO ACTIVE NOTICES FOUND IN DATABASE.</div>
            ) : (
              notices.map((n, i) => (
                <NoticeRow key={n._id} notice={n} index={i} onNavigate={handleNoticeClick} />
              ))
            )}
          </div>

          {/* ── Footer Status Bar ── */}
          <div className="hnb-footer-bar">
            <div className="hnb-caution-stripe bottom" aria-hidden="true" />
            <span className="hnb-status-tag active">● ONLINE</span>
            <span>SYSTEM: MANUAL</span>
            <span>GEAR: 4</span>
            <span className="hnb-blink-text">LIVE</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default HangingNoticeBoard;
