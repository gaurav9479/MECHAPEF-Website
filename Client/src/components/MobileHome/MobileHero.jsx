import React from 'react';
import { motion } from 'framer-motion';
import { FaArrowRight, FaUsers } from 'react-icons/fa';
import { GearSVG } from './MobileShared';
import { fadeUp } from './MobileAnimVariants';

const MobileHero = ({ navigate }) => {
  return (
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
  );
};

export default MobileHero;
