import React from 'react';
import { motion } from 'framer-motion';
import { FaHandshake } from 'react-icons/fa';
import { HeadingGearIcon, Reveal } from './MobileShared';
import { stagger, fadeUp } from './MobileAnimVariants';
import PastSponsors from '../PastSponsors/PastSponsors';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';

const MobileSponsors = ({ sponsors = [], navigate }) => {
  const currentSponsors = sponsors.filter(sp => !sp.isPastSponsor);

  return (
    <section className="mh-section mh-sponsors">
      {currentSponsors.length > 0 && (
        <>
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
            {currentSponsors.map(sp => (
              <motion.div key={sp._id} className="mh-sponsor-box" variants={fadeUp}
                whileTap={{ scale: 0.95 }}
                onClick={() => sp.websiteURL && window.open(sp.websiteURL, '_blank')}>
                {sp.logoURL && !sp.logoURL.includes('placeholder.com')
                  ? <img src={getOptimizedImageUrl(sp.logoURL)} alt={sp.companyName} loading="lazy" decoding="async"
                      onError={e => { e.target.style.display = 'none'; }} />
                  : <span className="mh-sponsor-name-text">{sp.companyName}</span>
                }
              </motion.div>
            ))}
          </motion.div>
        </>
      )}

      <PastSponsors showCurrentSponsors={false} />

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
