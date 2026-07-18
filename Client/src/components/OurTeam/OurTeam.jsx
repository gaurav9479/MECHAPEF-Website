import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FaCog } from 'react-icons/fa';
import api from '../../services/api';
import { apiGetCached } from '../../utils/apiCache';
import './OurTeam.css';

/* ─── Single card with glitch hover ─────────────────────────── */
const TeamCard = ({ data, num, index, fallbackRole }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' });

  return (
    <motion.div
      ref={ref}
      className="team-card"
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      {/* Corner accents */}
      <span className="corner-accent corner-tr" />
      <span className="corner-accent corner-bl" />

      {/* SCANNED badge */}
      <span className="scanned-badge">SCANNED</span>

      <div className="card-img-placeholder">
        {data?.url ? (
          <>
            <img
              src={data.url}
              alt={data.name || `Member ${num}`}
              className="card-img"
            />
            {/* Glitch overlay clone */}
            <img
              src={data.url}
              alt=""
              aria-hidden="true"
              className="card-img card-img-glitch"
            />
          </>
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
const TeamLayer = ({ title, sectionPrefix, imagesMap }) => {
  const cards = Array.from({ length: 10 }, (_, i) => i + 1);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -80px 0px' });

  const fallbackMap = {
    team_fy: 'Junior Member',
    team_sy: 'Core Member',
    team_ty: 'Senior Member',
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

      <div className="layer-track">
        {cards.map((num, idx) => {
          const data = imagesMap[`${sectionPrefix}_${num}`];
          return (
            <TeamCard
              key={`${sectionPrefix}-${num}`}
              data={data}
              num={num}
              index={idx}
              fallbackRole={fallbackRole}
            />
          );
        })}
      </div>
    </div>
  );
};

/* ─── Main Section ──────────────────────────────────────────── */
const OurTeam = () => {
  const [imagesMap, setImagesMap] = useState({});
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
    apiGetCached('/upload/sections', (data) => {
      const imgMap = {};
      if (data.data?.images) {
        data.data.images.forEach(img => {
          imgMap[img.sectionKey] = {
            url: img.imageURL,
            name: img.name,
            regNo: img.regNo,
          };
        });
      }
      setImagesMap(imgMap);
    }).catch(error => {
      console.error('Failed to load section images:', error);
    });
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
        >
          OUR TEAM
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
        <TeamLayer title="Final Year Seniors" sectionPrefix="team_ty" imagesMap={imagesMap} />
        <TeamLayer title="Pre-final Year"     sectionPrefix="team_sy" imagesMap={imagesMap} />
        <TeamLayer title="Second Year"        sectionPrefix="team_fy" imagesMap={imagesMap} />
      </div>
    </section>
  );
};

export default OurTeam;
