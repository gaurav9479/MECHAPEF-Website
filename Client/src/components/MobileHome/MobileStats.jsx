import React from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaUsers, FaCalendarAlt, FaBolt } from 'react-icons/fa';
import { CountUp } from './MobileShared';
import { stagger, fadeUp } from './MobileAnimVariants';

const MobileStats = () => {
  return (
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
  );
};

export default MobileStats;
