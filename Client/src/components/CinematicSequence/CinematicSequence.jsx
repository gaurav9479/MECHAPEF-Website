import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import RedStrips from '../RedInclinedStrips/RedInclinedStrips';
import './CinematicSequence.css';

const CinematicScene = ({ index, section, scrollYProgress, totalSections }) => {
  // Determine alternating origins
  const isLeft = index % 2 !== 0; // 0 = right, 1 = left, 2 = right, etc.
  
  // Mathematical bounds mapping
  // Each section gets exactly 1.0 "progress units" from scrollYProgress?
  // No, scrollYProgress goes from 0 to 1 over the ENTIRE wrapper.
  // We divide the 0 to 1 space into chunks.
  // Chunk size for 1 segment (e.g. fade out) = 1 / (totalSections * 2 - 1).
  // Wait, easier: let's map it based on fixed viewport distances, assuming 200vh per transition.

  
  const totalChunks = (totalSections - 1) * 2; 
  // For 2 sections: 2 chunks (0->0.5 fade out 1, 0.5->1 fade in 2).
  // For 3 sections: 4 chunks (0->0.25 out1, 0.25->0.5 in2, 0.5->0.75 out2, 0.75->1 in3)
  
  // Calculate enter and exit progress thresholds
  const enterStart = index === 0 ? 0 : (index * 2 - 1) / totalChunks;
  const enterEnd   = index === 0 ? 0 : (index * 2) / totalChunks;
  
  const exitStart  = index === totalSections - 1 ? 1 : (index * 2) / totalChunks;
  const exitEnd    = index === totalSections - 1 ? 1 : (index * 2 + 1) / totalChunks;

  // Opacity Map
  const opacity = useTransform(
    scrollYProgress,
    [enterStart, enterEnd, exitStart, exitEnd],
    [index === 0 ? 1 : 0, 1, 1, 0]
  );

  // Position Map (Text)
  // Text starts at alternating sides.
  // If isLeft is true (Left strip), text is on the RIGHT. So it enters from RIGHT (positive X).
  const textStartX = isLeft ? 1000 : -1000;
  const textX = useTransform(
    scrollYProgress,
    [enterStart, enterEnd, exitStart, exitEnd],
    [index === 0 ? 0 : textStartX, 0, 0, textStartX]
  );

  // Position Map (Image)
  // If isLeft is true (Left strip), image is on the LEFT. So it enters from LEFT (negative X).
  const imgStartX = isLeft ? -1000 : 1000;
  const imgX = useTransform(
    scrollYProgress,
    [enterStart, enterEnd, exitStart, exitEnd],
    [index === 0 ? 0 : imgStartX, 0, 0, imgStartX]
  );

  // Pointer Events Map
  // Only active when fully entered and not yet exited.
  const pointerEvents = useTransform(
    scrollYProgress,
    (val) => (val >= enterEnd && val <= exitStart) ? "auto" : "none"
  );

  return (
    <>
      {/* The Red Strips Background Layer */}
      <motion.div 
        className="cinematic-bg-layer"
        style={{ opacity }}
      >
        <RedStrips 
          index={0} 
          shiftX={isLeft ? "-10%" : "-20%"} 
          origin={isLeft ? "left" : "right"} 
        />
      </motion.div>

      {/* The Content Layer */}
      <motion.div 
        className="cinematic-scene"
        style={{ opacity, pointerEvents }}
      >
        {isLeft ? (
          <>
            <motion.div className="cinematic-left" style={{ x: imgX }}>
               {section.imgNode}
            </motion.div>
            <motion.div className="cinematic-right" style={{ x: textX, textAlign: "right" }}>
               {section.textNode}
            </motion.div>
          </>
        ) : (
          <>
            <motion.div className="cinematic-left" style={{ x: textX }}>
               {section.textNode}
            </motion.div>
            <motion.div className="cinematic-right" style={{ x: imgX }}>
               {section.imgNode}
            </motion.div>
          </>
        )}
      </motion.div>
    </>
  );
};

const CinematicSequence = ({ sections }) => {
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Calculate total height based on number of sections
  // 1 section = 100vh. 2 sections = 500vh (400vh scrollable).
  // N sections = ((N - 1) * 400 + 100) vh
  const wrapperHeight = `${(sections.length - 1) * 400 + 100}vh`;

  return (
    <div ref={containerRef} className="cinematic-wrapper" style={{ height: wrapperHeight }}>
      <div className="cinematic-camera">
        {sections.map((section, index) => (
          <CinematicScene 
            key={index}
            index={index}
            section={section}
            scrollYProgress={scrollYProgress}
            totalSections={sections.length}
          />
        ))}
      </div>
    </div>
  );
};

export default CinematicSequence;
