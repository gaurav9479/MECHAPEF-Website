import React from 'react';
import { motion } from 'framer-motion';
import { FaCogs, FaCalendarAlt, FaUsers, FaTrophy } from 'react-icons/fa';
import { HeadingGearIcon, Reveal } from './MobileShared';
import { stagger, fadeUp } from './MobileAnimVariants';

const MobileAbout = () => {
  return (
    <>
      {/* ══════ ABOUT US (WHAT WE STUDY) ══════ */}
      <motion.section 
        id="mobile-about"
        className="mh-section"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5 }}
      >
        <div className="mh-sec-hd">
          <span className="mh-tag">ABOUT US</span>
          <h2 className="mh-sec-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            WHAT IS MECHAPEF?
            <HeadingGearIcon size={26} />
          </h2>
        </div>
        <div className="mh-about-card" style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 31, 1, 0.15)', marginTop: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.05, pointerEvents: 'none', color: '#fff' }}>
             <FaCogs size={100} />
          </div>
          <p style={{ color: '#a0a0a0', fontSize: '15px', lineHeight: '1.6', marginBottom: '16px' }}>
            We are the official Mechanical and Mechatronics club of MNNIT Allahabad.
          </p>
          <p style={{ color: '#ffffff', fontSize: '16px', lineHeight: '1.6', fontWeight: '500', borderLeft: '3px solid #ff1f01', paddingLeft: '12px' }}>
            We don't just study engineering theory—we actually build machines, innovate, and leave a legacy.
          </p>
        </div>
      </motion.section>

      {/* ══════ WHAT WE STAND FOR (Spirit) ══════ */}
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
    </>
  );
};

export default MobileAbout;
