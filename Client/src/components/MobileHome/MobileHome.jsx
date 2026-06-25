import React, { useState, useEffect, useRef, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
import {
  FaArrowRight, FaUsers, FaCalendarAlt, FaTrophy,
  FaHandshake, FaBolt, FaInstagram, FaLinkedinIn,
  FaChevronLeft, FaChevronRight, FaWrench, FaCogs, FaCog
} from 'react-icons/fa';
import api from '../../services/api';
import HeroTicker from '../HeroTicker/HeroTicker';
import PastSponsors from '../PastSponsors/PastSponsors';
import './MobileHome.css';

/* ══════════════════════════════════════════════════
   GSAP Gear — stable uid via useId hook
   ══════════════════════════════════════════════════ */
const GearSVG = ({ size = 80, speed = 10, reverse = false, opacity = 1, startRotation = 0, style = {}, onScroll = false }) => {
  const gRef   = useRef(null);
  const baseId = useId().replace(/:/g, '');          // stable, unique, colon-free
  const uid    = `g${baseId}`;

  const teeth = 14;
  const R = 42, r = 34, innerR = 22, bossR = 10, holeR = 5;

  const toothPoints = Array.from({ length: teeth }).map((_, i) => {
    const a0 = (i / teeth) * Math.PI * 2;
    const a1 = a0 + (0.4 / teeth) * Math.PI * 2;
    const a2 = a0 + (0.6 / teeth) * Math.PI * 2;
    const a3 = a0 + (1.0 / teeth) * Math.PI * 2;
    const pt = (ang, rad) => `${50 + rad * Math.cos(ang)},${50 + rad * Math.sin(ang)}`;
    return `${pt(a0, r)} ${pt(a1, R)} ${pt(a2, R)} ${pt(a3, r)}`;
  }).join(' ');

  useEffect(() => {
    if (!gRef.current) return;
    
    let anim;
    if (onScroll) {
      anim = gsap.to(gRef.current, {
        rotation: reverse ? -1800 : 1800, // Very fast rotation
        transformOrigin: '50% 50%',
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.1, // sensitive and fast
        }
      });
    } else {
      anim = gsap.to(gRef.current, {
        rotation: reverse ? -360 : 360,
        transformOrigin: '50% 50%',          
        duration: speed,
        repeat: -1,
        ease: 'none',
      });
    }
    return () => {
      if (anim) anim.kill();
    };
  }, [speed, reverse, onScroll]);

  return (
    <svg
      ref={gRef}
      width={size} height={size} viewBox="0 0 100 100"
      style={{ opacity, display: 'block', flexShrink: 0, ...style }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={`${uid}bg`} cx="40%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#4a0000" />
          <stop offset="50%"  stopColor="#1a0000" />
          <stop offset="100%" stopColor="#050000" />
        </radialGradient>
        <radialGradient id={`${uid}bs`} cx="35%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#ff4422" />
          <stop offset="100%" stopColor="#aa1100" />
        </radialGradient>
        <filter id={`${uid}gw`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Group everything inside and apply the static offset rotation for meshing */}
      <g transform={`rotate(${startRotation} 50 50)`}>
        {/* Gear body */}
        <polygon points={toothPoints}
          fill={`url(#${uid}bg)`} stroke="#ff1f01" strokeWidth="1.2"
          filter={`url(#${uid}gw)`} />

        {/* Dashed inner ring */}
        <circle cx="50" cy="50" r={innerR + 4}
          fill="none" stroke="#ff1f01" strokeWidth="0.8" opacity="0.5" strokeDasharray="3 2" />

        {/* Inner fill */}
        <circle cx="50" cy="50" r={innerR}
          fill="#0a0000" stroke="#ff1f01" strokeWidth="1.2" />

        {/* Spokes */}
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={i}
            x1={50 + (innerR + 1) * Math.cos(i * Math.PI / 3)}
            y1={50 + (innerR + 1) * Math.sin(i * Math.PI / 3)}
            x2={50 + (innerR - 5) * Math.cos(i * Math.PI / 3)}
            y2={50 + (innerR - 5) * Math.sin(i * Math.PI / 3)}
            stroke="#ff1f01" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
        ))}

        {/* Boss hub */}
        <circle cx="50" cy="50" r={bossR}
          fill={`url(#${uid}bs)`} stroke="#ff3311" strokeWidth="1" />

        {/* Center hole */}
        <circle cx="50" cy="50" r={holeR}
          fill="#050505" stroke="#ff1f01" strokeWidth="0.8" />

        {/* Highlight glint */}
        <ellipse cx="44" cy="44" rx="4" ry="2.5"
          fill="rgba(255,80,30,0.25)" transform="rotate(-30,44,44)" />
      </g>
    </svg>
  );
};

/* ══════════════════════════════════════════════════
   Heading Flat Gear (FaCog) for on-scroll rotation
   ══════════════════════════════════════════════════ */
const HeadingGearIcon = ({ size = 28, opacity = 0.9, style = {} }) => {
  const gRef = useRef(null);

  useEffect(() => {
    if (!gRef.current) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? scrollY / maxScroll : 0;
      
      const targetRotation = 36000 * progress; // Super fast
      gsap.to(gRef.current, { rotation: targetRotation, duration: 0.1, ease: 'none', transformOrigin: '50% 50%' });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // initialize

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={gRef} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity, ...style }}>
      <FaCog style={{ fontSize: size, color: '#ff1f01' }} />
    </div>
  );
};


/* ══════════════════════════════════════════════════
   Framer Motion scroll-reveal wrapper
   ══════════════════════════════════════════════════ */
const Reveal = ({ children, delay = 0, direction = 'up', className = '' }) => {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: direction === 'up' ? 36 : 0 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════
   GSAP count-up
   ══════════════════════════════════════════════════ */
const CountUp = ({ end, suffix = '' }) => {
  const [n, setN] = useState(0);
  const ref       = useRef(null);
  const done      = useRef(false);

  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: end, duration: 1.5, ease: 'power2.out',
          onUpdate() { setN(Math.floor(obj.val)); },
          onComplete() { setN(end); },
        });
      }
    }, { threshold: 0.5 });
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, [end]);

  return <span ref={ref}>{n}{suffix}</span>;
};

/* ── shared animation variants ── */
const stagger  = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const fadeUp   = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

/* ════════════════════════════════════════════════════════════════ */
const MobileHome = () => {
  const navigate = useNavigate();

  const [slides, setSlides]             = useState([]);
  const [slideIdx, setSlideIdx]         = useState(0);
  const [sponsors, setSponsors]         = useState([]);
  const [pastSponsors, setPastSponsors] = useState([]);
  const [team, setTeam]                 = useState({ fy: [], sy: [], ty: [] });
  const [activeTab, setActiveTab]       = useState('fy');
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    api.get('/announcements').then(res => {
      const items   = res.data.data?.announcements || res.data.data || [];
      const banners = items.filter(n => n.isActive && (n.bannerURL || n.targetType === 'Event'));
      banners.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setSlides(banners);
    }).catch(() => {});

    api.get('/sponsors').then(res => {
      const all = res.data.data?.sponsors || res.data.data || [];
      setSponsors(all.filter(s => !s.isPastSponsor && s.isActive));
      setPastSponsors(all.filter(s => s.isPastSponsor));
    }).catch(() => {});

    api.get('/upload/sections').then(res => {
      const map = {};
      (res.data.data?.images || []).forEach(img => { map[img.sectionKey] = img; });
      const mk = (prefix, label) =>
        Array.from({ length: 10 }, (_, i) =>
          map[`${prefix}_${i + 1}`] || { name: `Member ${i + 1}`, regNo: label });
      setTeam({
        fy: mk('team_fy', 'Senior Member'),
        sy: mk('team_sy', 'Pre-final Member'),
        ty: mk('team_ty', 'Sophomore'),
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setSlideIdx(p => (p + 1) % slides.length), 30000);
    return () => clearInterval(t);
  }, [slides.length]);

  const goSlide      = dir => setSlideIdx(p => (p + dir + slides.length) % slides.length);
  const handleExplore = link => {
    if (!link) return;
    if (link.startsWith('http')) window.open(link, '_blank');
    else navigate(link.startsWith('/') ? link : `/events/${link}`);
  };

  const tabDefs = [
    { key: 'fy', label: 'Final Year' },
    { key: 'sy', label: 'Pre-Final'  },
    { key: 'ty', label: '2nd Year'   },
  ];

  if (loading) return null;

  const currentSlide = slides[slideIdx];

  return (
    <div className="mh-root">

      {/* ══════ HERO ══════ */}
      <section className="mh-hero">
        <div className="mh-hero-bg-gears">
          <GearSVG size={200} speed={16} opacity={0.08} />
          <GearSVG size={110} speed={10} reverse opacity={0.06} />
          <GearSVG size={65}  speed={6}  opacity={0.05} />
        </div>
        <div className="mh-hero-glow" />

        <div className="mh-hero-body">
          <motion.div className="mh-badge"
            initial={{ opacity: 0, scale: 0.85, y: -10 }}
            animate={{ opacity: 1,  scale: 1,    y: 0   }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}>
            <span className="mh-dot" /> EST. 2021 &bull; MNNIT ALLAHABAD
          </motion.div>

          <motion.h2 className="mh-hero-sub"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0   }}
            transition={{ delay: 0.15, duration: 0.5 }}>
            MECHANICAL COMMUNITY OF MNNIT
          </motion.h2>

          <motion.h1 className="mh-hero-title"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0  }}
            transition={{ delay: 0.25, duration: 0.8, type: 'spring', stiffness: 120 }}>
            MECHA<span>PEF</span>
          </motion.h1>

          <motion.p className="mh-hero-desc"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0  }}
            transition={{ delay: 0.4, duration: 0.6 }}>
            The Official Club of Mechanical &amp; Production &amp; Industrial Engineering at MNNIT Allahabad
          </motion.p>

          <motion.div className="mh-hero-btns"
            initial="hidden" animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.15, delayChildren: 0.55 } } }}>
            <motion.button className="mh-btn-primary" variants={fadeUp}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/events')}>
              EXPLORE EVENTS <FaArrowRight />
            </motion.button>
            <motion.button className="mh-btn-secondary" variants={fadeUp}
              whileTap={{ scale: 0.96 }}
              onClick={() => document.getElementById('mh-team')?.scrollIntoView({ behavior: 'smooth' })}>
              MEET THE TEAM <FaUsers />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ══════ STATS ══════ */}
      <motion.div className="mh-stats-strip"
        initial="hidden" whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        variants={stagger}>
        {[
          { icon: <FaTrophy />,      end: 50,   suf: '+', label: 'Events'   },
          { icon: <FaUsers />,       end: 1000, suf: '+', label: 'Students' },
          { icon: <FaCalendarAlt />, end: 5,    suf: '+', label: 'Years'    },
          { icon: <FaBolt />,        end: 45,   suf: '+', label: 'Projects' },
        ].map((s, i) => (
          <motion.div key={i} className="mh-stat" variants={fadeUp}>
            <div className="mh-stat-icon">{s.icon}</div>
            <div className="mh-stat-num"><CountUp end={s.end} suffix={s.suf} /></div>
            <div className="mh-stat-lbl">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* ══════ EVENTS ══════ */}
      <section className="mh-section">
        <Reveal>
          <div className="mh-sec-hd">
            <span className="mh-tag">LIVE EVENTS</span>
            <h2 className="mh-sec-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
              UPCOMING EVENTS
              <HeadingGearIcon size={26} />
            </h2>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          {slides.length === 0 ? (
            <div className="mh-no-event">
              <FaCalendarAlt style={{ fontSize: '2rem', color: '#ff1f01', marginBottom: 10 }} />
              <p>More Events Coming Soon</p>
              <small>Stay tuned! We are brewing exciting workshops &amp; competitions.</small>
            </div>
          ) : (
            <div className="mh-slider">
              {/* All slides in DOM, CSS controls opacity */}
              {slides.map((slide, idx) => (
                <div
                  key={slide._id}
                  className={`mh-slide ${idx === slideIdx ? 'active' : ''}`}
                  style={slide.bannerURL ? { backgroundImage: `url(${slide.bannerURL})` } : {}}
                >
                  <div className="mh-slide-overlay">
                    <span className="mh-slide-tag">{slide.targetType || 'Announcement'}</span>
                    <h3 className="mh-slide-title">{slide.title}</h3>
                    <p className="mh-slide-desc">{slide.description}</p>
                    {slide.targetLink && (
                      <button className="mh-slide-btn" onClick={() => handleExplore(slide.targetLink)}>
                        EXPLORE <FaArrowRight />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {slides.length > 1 && (
                <>
                  <button className="mh-arrow mh-arrow-l" onClick={() => goSlide(-1)}><FaChevronLeft /></button>
                  <button className="mh-arrow mh-arrow-r" onClick={() => goSlide(1)}><FaChevronRight /></button>
                  <div className="mh-dots">
                    {slides.map((_, i) => (
                      <span key={i}
                        className={`mh-dot-btn ${i === slideIdx ? 'active' : ''}`}
                        onClick={() => setSlideIdx(i)} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </Reveal>
      </section>

      {/* ══════ TICKER RIBBON DIVIDER ══════ */}
      <HeroTicker />

      {/* ══════ SPONSORS ══════ */}
      <section className="mh-section mh-sponsors">
        <Reveal>
          <div className="mh-sec-hd">
            <span className="mh-tag">CURRENT YEAR</span>
            <h2 className="mh-sec-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
              OUR SPONSORS
              <HeadingGearIcon size={26} />
            </h2>
          </div>
        </Reveal>

        <motion.div className="mh-sponsor-grid"
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={stagger}>
          {sponsors.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <motion.div key={i} className="mh-sponsor-box mh-sponsor-ph" variants={fadeUp}>
                  <FaHandshake style={{ color: '#333', fontSize: '1.5rem' }} />
                </motion.div>
              ))
            : sponsors.map(sp => (
                <motion.div key={sp._id} className="mh-sponsor-box" variants={fadeUp}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sp.websiteURL && window.open(sp.websiteURL, '_blank')}>
                  {sp.logoURL && !sp.logoURL.includes('placeholder.com')
                    ? <img src={sp.logoURL} alt={sp.companyName}
                        onError={e => { e.target.style.display = 'none'; }} />
                    : <span className="mh-sponsor-name-text">{sp.companyName}</span>
                  }
                </motion.div>
              ))
          }
        </motion.div>

        <PastSponsors />

        <Reveal delay={0.2}>
          <motion.button className="mh-outline-btn" whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/sponsors')}>
            VIEW ALL SPONSORS
          </motion.button>
        </Reveal>
      </section>

      {/* ══════ ABOUT ══════ */}
      <section className="mh-section mh-about">
        <Reveal>
          <div className="mh-sec-hd">
            <span className="mh-tag">WHAT WE STAND FOR</span>
            <h2 className="mh-sec-title">
              Spirit of<br />
              <span style={{ color: '#ff1f01' }}>
                Mechanical Engineering
                <HeadingGearIcon size={30} style={{ verticalAlign: 'middle', marginLeft: '10px', marginTop: '-4px' }} />
              </span>
            </h2>
          </div>
          <p className="mh-about-desc">
            MechaPEF continues to bridge knowledge, ideas, and people — fostering a culture of innovation
            and belonging within the Mechanical Engineering department.
          </p>
        </Reveal>

        <motion.div className="mh-spirit-cards"
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={stagger}>
          {[
            { icon: <FaCalendarAlt />, title: 'Workshops & Meets',      desc: 'From professional development to alumni interactions, we create opportunities for growth.' },
            { icon: <FaUsers />,       title: 'Collaborative Community', desc: 'A vibrant network united by curiosity, teamwork, and the spirit of mechanical engineering.' },
            { icon: <FaTrophy />,      title: 'Legacy of Learning',      desc: 'A tradition of knowledge sharing, mentorship, and departmental unity across batches.' },
          ].map((c, i) => (
            <motion.div key={i} className="mh-spirit-card" variants={fadeUp}
              whileTap={{ scale: 0.98 }}>
              <div className="mh-spirit-icon">{c.icon}</div>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>


      {/* ══════ OUR TEAM ══════ */}
      <section className="mh-section mh-team" id="mh-team">
        <Reveal>
          <div className="mh-sec-hd">
            <span className="mh-tag">THE PEOPLE</span>
            <h2 className="mh-sec-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
              OUR TEAM
              <HeadingGearIcon size={26} />
            </h2>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mh-tabs">
            {tabDefs.map(t => (
              <button key={t.key}
                className={`mh-tab ${activeTab === t.key ? 'active' : ''}`}
                onClick={() => setActiveTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>
        </Reveal>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} className="mh-team-track"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0   }}
            exit={{    opacity: 0, x: -30  }}
            transition={{ duration: 0.3 }}>
            {(team[activeTab] || []).map((m, i) => (
              <div key={i} className="mh-team-card">
                <div className="mh-team-img">
                  {m.imageURL
                    ? <img src={m.imageURL} alt={m.name} />
                    : <div className="mh-team-ph">
                        <GearSVG size={38} speed={12 + (i % 6)} reverse={i % 2 === 0} />
                      </div>
                  }
                </div>
                <div className="mh-team-info">
                  <h4>{m.name || `Member ${i + 1}`}</h4>
                  <p>{m.regNo}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* ══════ JOIN US CTA ══════ */}
      <section className="mh-cta">
        <div className="mh-cta-bg">
          <GearSVG size={140} speed={18} opacity={0.07} />
          <GearSVG size={70}  speed={10} reverse opacity={0.05} />
        </div>

        <motion.div className="mh-cta-content"
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.14 } } }}>

          <motion.span className="mh-tag" variants={fadeUp}>JOIN THE MOVEMENT</motion.span>
          <motion.h2 className="mh-cta-title" variants={fadeUp}>
            Ready to Be a Part of <span>MechaPEF?</span>
          </motion.h2>
          <motion.p className="mh-cta-desc" variants={fadeUp}>
            Connect with 1000+ students, attend exclusive events, and shape the future of mechanical engineering.
          </motion.p>

          <motion.button className="mh-btn-primary mh-btn-full" variants={fadeUp}
            whileTap={{ scale: 0.96 }} onClick={() => navigate('/register')}>
            JOIN NOW <FaArrowRight />
          </motion.button>

          <motion.button className="mh-btn-secondary mh-btn-full"
            style={{ marginTop: 12 }} variants={fadeUp}
            whileTap={{ scale: 0.96 }} onClick={() => navigate('/events')}>
            EXPLORE EVENTS
          </motion.button>

          <motion.div className="mh-social" variants={fadeUp}>
            <motion.a className="mh-social-btn" href="https://instagram.com"
              target="_blank" rel="noreferrer" whileTap={{ scale: 0.9 }}>
              <FaInstagram />
            </motion.a>
            <motion.a className="mh-social-btn" href="https://linkedin.com"
              target="_blank" rel="noreferrer" whileTap={{ scale: 0.9 }}>
              <FaLinkedinIn />
            </motion.a>
          </motion.div>
        </motion.div>
      </section>

    </div>
  );
};

export default MobileHome;
