import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaExternalLinkAlt, FaCog, FaWrench, FaClipboardList, FaVoteYea } from 'react-icons/fa';
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
const NoticeRow = ({ notice, index, onNavigate, isSeen }) => {
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
      onClick={() => onNavigate()}
    >
      {/* Left: index number */}
      <div className="hnb-row-idx">{String(index + 1).padStart(2, '0')}</div>

      {/* Status dot */}
      <div className={`hnb-status-dot ${notice.isActive ? 'active' : ''}`} />

      {/* Main text - decode then typewriter */}
      <div className="hnb-row-content">
        <div className="hnb-row-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {decoding ? decoded : typed}
          <span className="hnb-cursor">█</span>
          {!isSeen && (
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#ffff00', display: 'inline-block',
              boxShadow: '0 0 5px #ffff00'
            }} title="New Notice" />
          )}
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
  const [liveQuestions, setLiveQuestions] = useState([]);
  const [selectedLive, setSelectedLive] = useState(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [liveResult, setLiveResult] = useState(null);
  const [liveError, setLiveError] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bootLine, setBootLine] = useState(0);
  const [seenNotices, setSeenNotices] = useState(() => JSON.parse(localStorage.getItem('seen_notices') || '[]'));
  const navigate = useNavigate();

  const BOOT_LINES = [
    '> RELEASING HYDRAULIC LOCKS...',
    '> ALIGNING GEARS...',
    '> UNROLLING NOTICE FEED...',
    '> MECHANICAL SYSTEM READY.',
  ];

  const handleNoticeClick = (notice) => {
    const link = notice.targetLink;
    if (!seenNotices.includes(notice._id)) {
      const updated = [...seenNotices, notice._id];
      setSeenNotices(updated);
      localStorage.setItem('seen_notices', JSON.stringify(updated));
    }
    if (!link) return;
    onClose();
    if (link.startsWith('http')) window.open(link, '_blank');
    else if (link.startsWith('/')) navigate(link);
    else navigate(`/events/${link}`);
  };

  useEffect(() => {
    const fetchFeed = () => api.get('/announcements')
      .then(res => {
        const active = (res.data.data?.announcements || []).filter(n => n.isActive);
        setNotices(active);
      })
      .catch(() => { })
      .finally(() => setLoading(false));

    fetchFeed();
    const activePollTimer = setInterval(() => {
      api.get('/events/live/active')
        .then(res => setLiveQuestions(res.data.questions || []))
        .catch(() => { });
    }, 3000);
    api.get('/events/live/active')
      .then(res => setLiveQuestions(res.data.questions || []))
      .catch(() => { });

    document.body.style.overflow = 'hidden';
    return () => {
      clearInterval(activePollTimer);
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    if (!selectedLive) return undefined;
    const updateTimer = () => {
      const end = new Date(selectedLive.questionStartTime).getTime() + (selectedLive.timeLimitSeconds || 30) * 1000;
      setRemainingSeconds(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [selectedLive]);

  useEffect(() => {
    if (!selectedLive || remainingSeconds > 0 || liveResult) return;
    api.get(`/events/${selectedLive.eventId}/live/results`, { params: { pollId: selectedLive.questionId } })
      .then(res => setLiveResult(res.data))
      .catch(err => setLiveError(err.response?.data?.message || 'Results are not available yet.'));
  }, [selectedLive, remainingSeconds, liveResult]);

  const openLiveQuestion = (question) => {
    navigate(`/live-poll/${question.eventId}/${question.questionId}`);
  };

  const submitLiveVote = async () => {
    if (!selectedLive || !selectedOption || remainingSeconds === 0) return;
    try {
      await api.post(`/events/${selectedLive.eventId}/live/vote`, {
        pollId: selectedLive.questionId,
        selectedOption
      });
      setLiveError('Vote recorded. Results will appear when the timer ends.');
    } catch (error) {
      setLiveError(error.response?.data?.message || 'Unable to submit vote.');
    }
  };

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
            ) : notices.length === 0 && liveQuestions.length === 0 ? (
              <div className="hnb-empty">NO ACTIVE NOTICES FOUND IN DATABASE.</div>
            ) : (
              <>
                {liveQuestions.slice(0, 1).map((question, i) => (
                  <motion.div
                    key={`${question.eventId}-${question.questionId}`}
                    className="hnb-notice-row hnb-clickable"
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => openLiveQuestion(question)}
                  >
                    <div className="hnb-row-idx">LIVE</div>
                    <div className="hnb-status-dot active" />
                    <div className="hnb-row-content">
                      <div className="hnb-row-title"><FaVoteYea /> {question.title}</div>
                      <div className="hnb-row-meta"><span>{question.eventTitle}</span><span>·</span><span>VOTE NOW</span></div>
                    </div>
                    <div className="hnb-row-action"><FaExternalLinkAlt /></div>
                  </motion.div>
                ))}
                {notices.map((n, i) => (
                  <NoticeRow key={n._id} notice={n} index={i} onNavigate={() => handleNoticeClick(n)} isSeen={seenNotices.includes(n._id)} />
                ))}
              </>
            )}
          </div>

          {selectedLive && (
            <div style={{ marginTop: '18px', padding: '18px', border: '1px solid #00c864', background: 'rgba(0, 200, 100, 0.08)' }}>
              <button className="hnb-close-btn" onClick={() => setSelectedLive(null)} style={{ float: 'right' }}><FaTimes /></button>
              <div style={{ color: '#00c864', fontWeight: 'bold', marginBottom: '8px' }}>LIVE POLL · {remainingSeconds > 0 ? `${remainingSeconds}s remaining` : 'VOTING CLOSED'}</div>
              <h3 style={{ color: '#fff', margin: '0 0 14px' }}>{selectedLive.title}</h3>
              {liveResult ? (
                <div>
                  {Object.entries(liveResult.breakdown || {}).map(([option, result]) => (
                    <div key={option} style={{ color: '#fff', display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                      <span>{selectedLive.options.find(item => item.key === option)?.text || option}</span><strong>{result.percentage}%</strong>
                    </div>
                  ))}
                  <div style={{ color: '#aaa', marginTop: '8px' }}>Total votes: {liveResult.totalVotes || 0}</div>
                </div>
              ) : (
                <>
                  {selectedLive.options.map(option => (
                    <label key={option.key} style={{ display: 'block', color: '#fff', margin: '8px 0' }}>
                      <input type="radio" name="live-option" value={option.key} checked={selectedOption === option.key} onChange={e => setSelectedOption(e.target.value)} disabled={remainingSeconds === 0} /> {option.text}
                    </label>
                  ))}
                  <button type="button" onClick={submitLiveVote} disabled={!selectedOption || remainingSeconds === 0} style={{ marginTop: '10px', padding: '8px 14px' }}>Submit Vote</button>
                  {liveError && <div style={{ color: remainingSeconds === 0 ? '#ffaa00' : '#fff', marginTop: '10px' }}>{liveError}</div>}
                </>
              )}
            </div>
          )}

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
