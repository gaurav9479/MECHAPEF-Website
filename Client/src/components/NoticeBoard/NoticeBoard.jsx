import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBullhorn, FaArrowRight } from 'react-icons/fa';
import api from '../../services/api';
import './NoticeBoard.css';

const PRIORITY_COLOR = { High: '#ff3333', Medium: '#ffaa00', Low: '#00c864' };

const NoticeBoard = () => {
  const [notices, setNotices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [seenNotices, setSeenNotices] = useState(() => JSON.parse(localStorage.getItem('seen_notices') || '[]'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/announcements')
      .then(res => {
        const active = (res.data.data?.announcements || []).filter(n => n.isActive);
        setNotices(active);
        if (active.length > 0) {
          setSelected(active[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="noticeboard-section" id="notices">
      {/* Background strips */}
      <div className="nb-bg-strip nb-strip-1" />
      <div className="nb-bg-strip nb-strip-2" />

      <div className="nb-inner">
        {/* Heading */}
        <motion.div
          className="nb-heading"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <FaBullhorn className="nb-heading-icon" />
          <div>
            <div className="nb-heading-sub">OFFICIAL COMMUNICATIONS</div>
            <h2 className="nb-heading-title">Notice Board</h2>
          </div>
        </motion.div>

        {loading ? (
          <div className="nb-loading">Loading notices...</div>
        ) : notices.length === 0 ? (
          <div className="nb-loading" style={{ color: '#aaa' }}>No active notices at the moment. Check back later!</div>
        ) : (
          <div className="nb-layout">
            {/* Notice List */}
            <motion.div
              className="nb-list"
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              {notices.map((n, i) => (
                <motion.div
                  key={n._id}
                  className={`nb-list-item ${selected?._id === n._id ? 'active' : ''}`}
                  onClick={() => {
                    setSelected(n);
                    if (!seenNotices.includes(n._id)) {
                      const updated = [...seenNotices, n._id];
                      setSeenNotices(updated);
                      localStorage.setItem('seen_notices', JSON.stringify(updated));
                    }
                  }}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                >
                  <span
                    className="nb-priority-dot"
                    style={{ background: PRIORITY_COLOR[n.priority] }}
                  />
                  <div>
                    <div className="nb-item-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {n.title}
                      {!seenNotices.includes(n._id) && (
                        <span style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: '#ffff00', display: 'inline-block',
                          boxShadow: '0 0 5px #ffff00'
                        }} title="New" />
                      )}
                    </div>
                    <div className="nb-item-date">
                      {new Date(n.createdAt || n.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <FaArrowRight className="nb-item-arrow" />
                </motion.div>
              ))}
            </motion.div>

            {/* Notice Detail */}
            {selected && (
              <motion.div
                key={selected._id}
                className="nb-detail"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="nb-detail-meta">
                  <span
                    className="nb-priority-pill"
                    style={{
                      background: `${PRIORITY_COLOR[selected.priority]}22`,
                      color: PRIORITY_COLOR[selected.priority],
                      border: `1px solid ${PRIORITY_COLOR[selected.priority]}44`
                    }}
                  >
                    {selected.priority} Priority
                  </span>
                  <span className="nb-detail-date">
                    {new Date(selected.createdAt || selected.startDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <h3 className="nb-detail-title">{selected.title}</h3>
                <p className="nb-detail-body">{selected.description}</p>
                {selected.targetLink && (
                  <a href={selected.targetLink} className="nb-detail-link" target="_blank" rel="noreferrer">
                    View More <FaArrowRight />
                  </a>
                )}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default NoticeBoard;
