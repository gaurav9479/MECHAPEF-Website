import React from 'react';
import { motion } from 'framer-motion';
import { FaHandshake } from 'react-icons/fa';
import { HeadingGearIcon, Reveal } from './MobileShared';
import { stagger, fadeUp } from './MobileAnimVariants';
import PastSponsors from '../PastSponsors/PastSponsors';

const MobileSponsors = ({ sponsors, navigate }) => {
  return (
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
  );
};

export default MobileSponsors;
