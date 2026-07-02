import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FaProjectDiagram, FaUserGraduate, FaHistory, FaCalendarCheck } from "react-icons/fa";
import RedStrips from '../RedInclinedStrips/RedInclinedStrips';
import '../CinematicHero/CinematicHero.css';
import '../About/About.css';

const AboutWheel = () => {
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const bgOpacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [1, 1, 1, 1]);
  const bgX = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], ["-20vw", "0vw", "0vw", "-20vw"]); 

  // Sexy Text Transitions
  const titlePart1X = useTransform(scrollYProgress, [0.1, 0.25, 0.75, 0.9], ["-50vw", "0vw", "0vw", "-50vw"]);
  const titlePart1Op = useTransform(scrollYProgress, [0.1, 0.25, 0.75, 0.9], [0, 1, 1, 0]);

  const titlePart2Y = useTransform(scrollYProgress, [0.15, 0.3, 0.7, 0.85], ["-50vh", "0vh", "0vh", "50vh"]);
  const titlePart2Scale = useTransform(scrollYProgress, [0.15, 0.3, 0.7, 0.85], [3, 1, 1, 0]);
  const titlePart2Op = useTransform(scrollYProgress, [0.15, 0.3, 0.7, 0.85], [0, 1, 1, 0]);

  const titlePart3X = useTransform(scrollYProgress, [0.2, 0.35, 0.65, 0.8], ["50vw", "0vw", "0vw", "50vw"]);
  const titlePart3Rotate = useTransform(scrollYProgress, [0.2, 0.35, 0.65, 0.8], [180, 0, 0, -180]);
  const titlePart3Op = useTransform(scrollYProgress, [0.2, 0.35, 0.65, 0.8], [0, 1, 1, 0]);

  const pY = useTransform(scrollYProgress, [0.25, 0.4, 0.6, 0.75], ["50vh", "0vh", "0vh", "50vh"]);
  const pOp = useTransform(scrollYProgress, [0.25, 0.4, 0.6, 0.75], [0, 1, 1, 0]);

  const textOpacity = useTransform(scrollYProgress, [0.2, 0.3, 0.7, 0.8], [0, 1, 1, 0]);
  
  const card1Y = useTransform(scrollYProgress, [0.2, 0.3, 0.7, 0.8], ["-50vh", "0vh", "0vh", "0vh"]);
  const card1X = useTransform(scrollYProgress, [0.2, 0.3, 0.7, 0.8], ["0vw", "0vw", "0vw", "-50vw"]);

  const card2X = useTransform(scrollYProgress, [0.2, 0.3, 0.7, 0.8], ["50vw", "0vw", "0vw", "0vw"]);
  const card2Y = useTransform(scrollYProgress, [0.2, 0.3, 0.7, 0.8], ["0vh", "0vh", "0vh", "-50vh"]);

  const card3X = useTransform(scrollYProgress, [0.2, 0.3, 0.7, 0.8], ["-50vw", "0vw", "0vw", "0vw"]);
  const card3Y = useTransform(scrollYProgress, [0.2, 0.3, 0.7, 0.8], ["0vh", "0vh", "0vh", "50vh"]);

  const card4Y = useTransform(scrollYProgress, [0.2, 0.3, 0.7, 0.8], ["50vh", "0vh", "0vh", "0vh"]);
  const card4X = useTransform(scrollYProgress, [0.2, 0.3, 0.7, 0.8], ["0vw", "0vw", "0vw", "50vw"]);

  const pointerEvents = useTransform(scrollYProgress, (val) => (val >= 0.2 && val <= 0.8) ? "auto" : "none");

  return (
    <div id="about-us" ref={containerRef} className="cinematic-wrapper" style={{ height: "550vh" }}>
      <div className="cinematic-camera">
        
        <motion.div className="cinematic-bg-layer" style={{ opacity: bgOpacity, x: bgX }}>
          <RedStrips index={0} shiftX="45%" />
          <div className="fade-left"></div>
        </motion.div>

        <motion.div className="cinematic-scene" style={{ pointerEvents }}>
          <motion.div className="cinematic-left about-us-container">
             <h2 className="about-us-title" style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
               <motion.span style={{ x: titlePart1X, opacity: titlePart1Op, display: "inline-block" }}>What is</motion.span>
               <motion.span className="highlight-text" style={{ y: titlePart2Y, scale: titlePart2Scale, opacity: titlePart2Op, display: "inline-block" }}>MechaPEF</motion.span>
               <motion.span style={{ x: titlePart3X, rotate: titlePart3Rotate, opacity: titlePart3Op, display: "inline-block" }}>?</motion.span>
             </h2>
             <motion.p className="about-us-mission" style={{ y: pY, opacity: pOp }}>
               We are the official Mechanical and Mechatronics club of MNNIT Allahabad. 
               We don't just study engineering theory—we actually build machines, innovate, and leave a legacy.
             </motion.p>
          </motion.div>

          <motion.div className="cinematic-right" style={{ opacity: textOpacity }}>
            <div className="dashboard-grid">
              
              <div className="dash-col col-left">
                <motion.div className="dash-card card-tall dash-card-glow" style={{ y: card1Y, x: card1X }}>
                  <div className="dash-icon-bg"><FaProjectDiagram /></div>
                  <h3 className="dash-num">45+</h3>
                  <h4 className="dash-title">Projects Completed</h4>
                  <p className="dash-sub text-red">collaborative and individuals</p>
                </motion.div>
                <motion.div className="dash-card card-wide dash-card-glow" style={{ x: card3X, y: card3Y }}>
                  <div className="dash-icon-bg"><FaUserGraduate /></div>
                  <h3 className="dash-num">1000+</h3>
                  <h4 className="dash-title">Students Impacted</h4>
                  <p className="dash-sub">and growing with every semester</p>
                </motion.div>
              </div>
              
              <div className="dash-col col-right">
                <motion.div className="dash-card card-wide dash-card-glow" style={{ x: card2X, y: card2Y }}>
                  <div className="dash-icon-bg"><FaHistory /></div>
                  <h3 className="dash-num">5+</h3>
                  <h4 className="dash-title">Years of Legacy</h4>
                  <p className="dash-sub">of knowledge and mentorship programmes</p>
                </motion.div>
                <motion.div className="dash-card card-tall dash-card-glow" style={{ y: card4Y, x: card4X }}>
                  <div className="dash-icon-bg"><FaCalendarCheck /></div>
                  <h3 className="dash-num">50+</h3>
                  <h4 className="dash-title">Events Conducted</h4>
                  <p className="dash-sub text-red">workshops, competitions and more</p>
                </motion.div>
              </div>

            </div>
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
};

export default AboutWheel;
