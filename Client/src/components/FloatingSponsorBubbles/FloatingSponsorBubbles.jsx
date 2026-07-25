import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import './FloatingSponsorBubbles.css';

const Bubble = ({ logoURL, tagline, index, sectionId }) => {
  const [showTagline, setShowTagline] = useState(false);

  // Randomize initial positions and animation paths for variety
  const isLeft = index % 2 === 0;
  const initialX = isLeft ? '5vw' : '85vw';
  const yOffset = isLeft ? '20%' : '60%';
  
  return (
    <motion.div
      className="sponsor-bubble-wrapper"
      style={{
        left: initialX,
        top: yOffset,
      }}
      animate={{
        y: ['-20px', '20px', '-20px'],
        x: ['-10px', '10px', '-10px'],
      }}
      transition={{
        duration: 4 + (index % 3),
        repeat: Infinity,
        ease: 'easeInOut'
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
  const [sections, setSections] = useState([]);

  useEffect(() => {
    // Find all sections in the Home page to attach bubbles to
    const checkSections = () => {
      const sectionEls = document.querySelectorAll('.desktop-only > div[id]');
      if (sectionEls.length > 0 && sections.length === 0) {
        setSections(Array.from(sectionEls));
      }
    };
    
    checkSections();
    // Re-check after a short delay to ensure rendering is complete
    const timeout = setTimeout(checkSections, 1000);
    return () => clearTimeout(timeout);
  }, [sections]);

  if (!config || !config.showFloatingBubbles || !config.logoURL) return null;

  return (
    <>
      {sections.map((section, sectionIndex) => {
        // Ensure the section has position relative so absolute bubbles stay within it
        if (getComputedStyle(section).position === 'static') {
          section.style.position = 'relative';
        }
        
        // Render 2 bubbles per section using React Portal
        return createPortal(
          <>
            <Bubble logoURL={config.logoURL} tagline={config.tagline} index={sectionIndex * 2} sectionId={section.id} />
            <Bubble logoURL={config.logoURL} tagline={config.tagline} index={sectionIndex * 2 + 1} sectionId={section.id} />
          </>,
          section
        );
      })}
    </>
  );
};

export default FloatingSponsorBubbles;
