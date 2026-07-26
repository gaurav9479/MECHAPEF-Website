import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './FloatingSponsorBubbles.css';

const ScreenFixedBubble = ({ logoURL, tagline, side }) => {
  const [showTagline, setShowTagline] = useState(false);
  const isLeft = side === 'left';

  const posStyle = isLeft 
    ? { left: '24px', bottom: '80px' } 
    : { right: '24px', top: '200px' };

  return (
    <motion.div
      className="sponsor-bubble-wrapper"
      style={posStyle}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: ['-14px', '14px', '-14px'],
        x: ['-7px', '7px', '-7px'],
      }}
      transition={{
        opacity: { duration: 0.4 },
        scale: { duration: 0.4 },
        y: { duration: isLeft ? 5 : 4.2, repeat: Infinity, ease: 'easeInOut' },
        x: { duration: isLeft ? 4.2 : 5, repeat: Infinity, ease: 'easeInOut' }
      }}
    >
          <div className="sponsor-bubble-core" onClick={() => setShowTagline(!showTagline)}>
            <img src={logoURL} alt="Special Sponsor" />
          </div>

          <AnimatePresence>
            {showTagline && tagline && (
              <motion.div 
                className={`sponsor-bubble-tooltip ${isLeft ? 'tooltip-right' : 'tooltip-left'}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                {tagline}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
  );
};

const FloatingSponsorBubbles = ({ config }) => {
  if (!config || !config.showFloatingBubbles || !config.logoURL) return null;

  return (
    <>
      <ScreenFixedBubble logoURL={config.logoURL} tagline={config.tagline} side="left" />
      <ScreenFixedBubble logoURL={config.logoURL} tagline={config.tagline} side="right" />
    </>
  );
};

export default FloatingSponsorBubbles;
