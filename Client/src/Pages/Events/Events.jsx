import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FaCalendarAlt, FaMapMarkerAlt, FaCogs } from 'react-icons/fa';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { eventService } from '../../services/services';
import './Events.css';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 60%", "end 80%"]
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchEvents = async () => {
      try {
        const res = await eventService.getAll({ limit: 50 });
        setEvents(res.data.data.events);
      } catch (err) {
        console.error('Failed to fetch events');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const now = Date.now();

  return (
    <>
      <Navbar />
      <div className="events-page-wrapper">
        
        {/* ── Header ── */}
        <div className="events-header">
          <div className="events-ghost">EVENTS</div>
          <motion.h1 
            className="events-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Events & Competitions
          </motion.h1>
          <motion.p 
            className="events-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="typewriter">Join the best engineering events, workshops, and challenges.</span>
          </motion.p>
        </div>
        
        {/* ── Timeline ── */}
        <div className="events-container" ref={containerRef}>
          {loading ? (
            <div className="loading-text">Scanning databanks...</div>
          ) : events.length === 0 ? (
            <div className="loading-text">No active transmissions found.</div>
          ) : (
            <div className="timeline-wrapper">
              
              {/* Power Cable */}
              <div className="timeline-track">
                <motion.div className="timeline-glow-line" style={{ height: lineHeight }}>
                  <div className="timeline-orb" />
                </motion.div>
              </div>
              
              <div className="timeline-events">
                {events.map((ev, index) => {
                  const isPast = new Date(ev.startTime).getTime() < now;
                  const isEven = index % 2 === 0;
                  
                  return (
                    <motion.div 
                      key={ev._id} 
                      className={`timeline-row ${isEven ? 'row-left' : 'row-right'} ${isPast ? 'is-past' : 'is-upcoming'}`}
                      initial={{ opacity: 0, x: isEven ? -60 : 60, filter: "blur(10px)" }}
                      whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                      viewport={{ once: true, margin: "-15%" }}
                      transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
                    >
                      {/* Node on the line */}
                      <div className="timeline-node-container">
                        <div className="timeline-node">
                          {isPast ? <FaCogs className="node-icon spin-slow" /> : <div className="node-pulse" />}
                        </div>
                      </div>
                      
                      {/* Card Content */}
                      <div className="timeline-card">
                        <div className="card-glitch-layer"></div>
                        <div className="timeline-card-content">
                          <div className="card-top-bar">
                            <span className="event-category">{ev.category}</span>
                            <span className="event-status">{isPast ? 'ARCHIVED' : 'LIVE'}</span>
                          </div>
                          
                          <h2>{ev.title}</h2>
                          
                          <div className="event-meta">
                            <p><FaCalendarAlt /> {new Date(ev.startTime).toLocaleDateString('en-IN', {
                              weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                            })}</p>
                            <p><FaMapMarkerAlt /> {ev.venue}</p>
                          </div>
                          
                          <p className="event-desc">{ev.description?.substring(0, 110)}...</p>
                          
                          <Link to={`/events/${ev._id}`} className="event-cta-btn">
                            {isPast ? 'VIEW ARCHIVE' : 'REGISTER NOW'}
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Events;
