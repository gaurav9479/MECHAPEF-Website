import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaCog } from 'react-icons/fa';
import api from '../../services/api';
import { apiGetCached } from '../../utils/apiCache';
import './OurTeam.css';

import { getOptimizedImageUrl } from '../../utils/imageOptimizer';

/* ─── Single card with glitch hover ─────────────────────────── */
const TeamCard = ({ data, num, index, fallbackRole, isFinalYear, specialSponsor }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' });

  return (
    <motion.div
      ref={ref}
      className={`team-card ${isFinalYear ? 'final-year-card' : ''}`}
      style={{ position: 'relative' }}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      {/* Special Sponsor Logo Badge in Top Right */}
      {specialSponsor?.logoURL && specialSponsor?.showTeamCardsLogo !== false && (
        <div 
          className="team-card-sponsor-badge"
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 15,
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(8px)',
            padding: '4px 8px',
            borderRadius: '20px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(0, 0, 0, 0.08)'
          }}
        >
          <img 
            src={getOptimizedImageUrl(specialSponsor.logoURL)} 
            alt={specialSponsor.name} 
            style={{ height: '20px', maxWidth: '65px', objectFit: 'contain' }} 
          />
        </div>
      )}

      {/* Corner accents */}
      <span className="corner-accent corner-tr" />
      <span className="corner-accent corner-bl" />

      <div className="card-img-placeholder">
        {data?.url ? (
          <img
            src={getOptimizedImageUrl(data.url)}
            alt={data.name || `Member ${num}`}
            className="card-img"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="placeholder-text">Image {num}</span>
        )}
      </div>

      <div className="card-info">
        <h4 className="card-name">{data?.name || `Name ${num}`}</h4>
        <p>{data?.regNo || fallbackRole}</p>
      </div>
    </motion.div>
  );
};

/* ─── Layer row with framer-motion reveal ───────────────────── */
const TeamLayer = ({ title, sectionPrefix, imagesMap, specialSponsor }) => {
  const cards = Object.keys(imagesMap)
    .filter(k => k.startsWith(sectionPrefix + '_') && imagesMap[k].url)
    .sort((a, b) => {
      const defaultOrderA = parseInt(a.replace(sectionPrefix + '_', ''));
      const defaultOrderB = parseInt(b.replace(sectionPrefix + '_', ''));
      const orderA = imagesMap[a].order || defaultOrderA;
      const orderB = imagesMap[b].order || defaultOrderB;
      if (orderA !== orderB) return orderA - orderB;
      
      return defaultOrderA - defaultOrderB;
    });
    
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -80px 0px' });

  const fallbackMap = {
    team_fy: 'Junior Member',
    team_sy: 'Core Member',
    team_ty: 'Senior Member',
    team_al: 'Notable Alumni',
  };
  const fallbackRole = fallbackMap[sectionPrefix] || 'Member';

  return (
    <div className="team-layer">
      {/* Layer title with framer reveal */}
      <motion.h3
        ref={ref}
        className="layer-title"
        initial={{ opacity: 0, x: -30 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        <FaCog className="layer-icon" />
        {title}
      </motion.h3>

      <div className="layer-scroll-wrapper">
        <div className="layer-track">
          {cards.map((k, idx) => {
            const num = parseInt(k.replace(sectionPrefix + '_', ''));
            const data = imagesMap[k];
            return (
              <TeamCard
                key={k}
                data={data}
                num={num}
                index={idx}
                fallbackRole={fallbackRole}
                isFinalYear={sectionPrefix === 'team_ty' || sectionPrefix === 'team_al'}
                specialSponsor={specialSponsor}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ─── Main Section ──────────────────────────────────────────── */
const OurTeam = () => {
  const navigate = useNavigate();
  const [imagesMap, setImagesMap] = useState({});
  const [specialSponsor, setSpecialSponsor] = useState(null);
  const sectionRef = useRef(null);

  /* Spotlight mouse tracking */
  const handleMouseMove = (e) => {
    const el = sectionRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  /* API fetch - cached logic */
  const fetchSectionImages = () => {
    apiGetCached('/upload/sections?device=desktop', (data) => {
      const imgMap = {};
      if (data.data?.images) {
        data.data.images.forEach(img => {
          imgMap[img.sectionKey] = {
            url: img.imageURL,
            name: img.name,
            regNo: img.regNo,
            order: img.order,
          };
        });
      }
      setImagesMap(imgMap);
    }, { cacheDuration: 0 }).catch(error => {
      console.error('Failed to load section images:', error);
    });

    apiGetCached('/special-sponsor/active', (data) => {
      if (data?.data) setSpecialSponsor(data.data);
    }).catch(() => {});
  };

  useEffect(() => {
    fetchSectionImages();
  }, []);

  return (
    <section
      id="our-team"
      className="our-team-section"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
    >
      {/* Section Header */}
      <div className="team-header">
        <span className="team-ghost-text" aria-hidden="true">TEAM</span>
        <motion.h1
          className="team-heading"
          initial={{ opacity: 0, y: -40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}
        >
          OUR TEAM
          {specialSponsor?.logoURL && specialSponsor?.showTeamTitleCoBranding !== false && (
            <span className="team-heading-cobrand" style={{ display: 'inline-flex', alignItems: 'center', gap: '14px', marginLeft: '4px' }}>
              <span 
                style={{ 
                  color: specialSponsor?.brandColor || '#ff1f01', 
                  fontWeight: '900', 
                  fontSize: 'clamp(1.8rem, 5vw, 3rem)', 
                  fontFamily: 'sans-serif', 
                  lineHeight: 1,
                  textShadow: '0 0 20px rgba(255, 31, 1, 0.5)'
                }}
              >
                ×
              </span>
              <img 
                src={getOptimizedImageUrl(specialSponsor.logoURL)} 
                alt={specialSponsor.name} 
                style={{ 
                  height: 'clamp(36px, 5.5vw, 56px)', 
                  maxWidth: 'clamp(120px, 16vw, 190px)', 
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))'
                }} 
              />
            </span>
          )}
        </motion.h1>
        <motion.p
          className="team-subtitle"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          The engineers who build what others can only imagine
        </motion.p>
      </div>

      {/* Scroll Container */}
      <div className="team-scroll-container">
        {/* Homepage only renders Final Year Seniors */}
        <TeamLayer title="Final Year Seniors" sectionPrefix="team_ty" imagesMap={imagesMap} specialSponsor={specialSponsor} />
      </div>

      {/* Meet the Entire Team Button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px', paddingBottom: '20px' }}>
        <button
          onClick={() => navigate('/team')}
          className="meet-team-btn"
          style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #121212 0%, #1c1c1c 100%)',
            color: '#fff',
            border: '1px solid #ff1f01',
            borderRadius: '4px',
            padding: '12px 28px',
            fontSize: '1rem',
            fontFamily: 'Orbitron, sans-serif',
            cursor: 'pointer',
            overflow: 'hidden',
            boxShadow: '0 0 15px rgba(255, 31, 1, 0.2)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 25px rgba(255, 31, 1, 0.5)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.background = '#ff1f01';
            e.currentTarget.style.color = '#000';
            e.currentTarget.style.fontWeight = 'bold';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 31, 1, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.background = 'linear-gradient(135deg, #121212 0%, #1c1c1c 100%)';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.fontWeight = 'normal';
          }}
        >
          <span>Meet the Entire Team</span>
          <span style={{ fontSize: '1.2rem' }}>→</span>
        </button>
      </div>
    </section>
  );
};

export default OurTeam;
