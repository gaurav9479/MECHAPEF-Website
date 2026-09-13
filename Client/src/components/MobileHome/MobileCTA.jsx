import React from 'react';
import { motion } from 'framer-motion';
import { FaArrowRight, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import { GearSVG } from './MobileShared';
import { fadeUp } from './MobileAnimVariants';

const MobileCTA = ({ navigate }) => {
  return (
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
          whileTap={{ scale: 0.96 }} onClick={() => navigate('/login')}>
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
  );
};

export default MobileCTA;
