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

  const bgOpacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);
  const bgX = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], ["-20vw", "0vw", "0vw", "-20vw"]); 

  const droneOpacity = useTransform(scrollYProgress, [0.1, 0.2, 0.8, 0.9], [0, 1, 1, 0]);
  const droneY = useTransform(scrollYProgress, [0.1, 0.2, 0.8, 0.9], ["-100vh", "0vh", "0vh", "100vh"]); 
  const droneX = useTransform(scrollYProgress, [0.1, 0.2, 0.8, 0.9], ["50vw", "0vw", "0vw", "-50vw"]);

  const textOpacity = useTransform(scrollYProgress, [0.2, 0.3, 0.7, 0.8], [0, 1, 1, 0]);
  
  const card1X = useTransform(scrollYProgress, [0.2, 0.3, 0.7, 0.8], ["-50vw", "0vw", "0vw", "0vw"]);
  const card1Y = useTransform(scrollYProgress, [0.2, 0.3, 0.7, 0.8], ["0vh", "0vh", "0vh", "-50vh"]);

  const card3Y = useTransform(scrollYProgress, [0.2, 0.3, 0.7, 0.8], ["50vh", "0vh", "0vh", "0vh"]);
  const card3X = useTransform(scrollYProgress, [0.2, 0.3, 0.7, 0.8], ["0vw", "0vw", "0vw", "-50vw"]);

  const card2X = useTransform(scrollYProgress, [0.2, 0.3, 0.7, 0.8], ["50vw", "0vw", "0vw", "0vw"]);
  const card2Y = useTransform(scrollYProgress, [0.2, 0.3, 0.7, 0.8], ["0vh", "0vh", "0vh", "-50vh"]);

  const card4Y = useTransform(scrollYProgress, [0.2, 0.3, 0.7, 0.8], ["50vh", "0vh", "0vh", "0vh"]);
  const card4X = useTransform(scrollYProgress, [0.2, 0.3, 0.7, 0.8], ["0vw", "0vw", "0vw", "50vw"]);

  const pointerEvents = useTransform(scrollYProgress, (val) => (val >= 0.2 && val <= 0.8) ? "auto" : "none");

  return (
    <div ref={containerRef} className="cinematic-wrapper" style={{ height: "550vh" }}>
      <div className="cinematic-camera">
        
        <motion.div className="cinematic-bg-layer" style={{ opacity: bgOpacity, x: bgX }}>
          <RedStrips index={0} shiftX="45%" />
          <div className="fade-left"></div>
        </motion.div>

        <motion.div className="cinematic-scene" style={{ pointerEvents }}>
          <motion.div className="cinematic-left about-us-container" style={{ x: droneX, y: droneY, opacity: droneOpacity }}>
             <h2 className="about-us-title">What is <span className="highlight-text">MechaPEF</span> ?</h2>
             <p className="about-us-mission">
               We are the official Mechanical and Mechatronics club of MNNIT Allahabad. 
               We don't just study engineering theory—we actually build machines, innovate, and leave a legacy.
             </p>
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
