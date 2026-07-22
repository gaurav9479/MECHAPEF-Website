import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { assets } from "../../assets/assets";
import { FaArrowRight, FaUsers } from "react-icons/fa";
import { scrollToId } from "../../utils/scroll";
import RedStrips from '../RedInclinedStrips/RedInclinedStrips';
import MagneticButton from "../MagneticButton/MagneticButton";
import '../CinematicHero/CinematicHero.css';
import '../Hero/Hero.css';

const HeroIntro = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Disperse animations as it scrolls up normally
  const h1Y = useTransform(scrollYProgress, [0, 0.75], ["0vh", "15vh"]);
  const h1Scale = useTransform(scrollYProgress, [0, 0.75], [1, 1.5]);
  const h1Opacity = useTransform(scrollYProgress, [0.3, 0.75], [1, 0]);

  const h2X = useTransform(scrollYProgress, [0, 0.75], ["0vw", "-20vw"]);
  const h2Opacity = useTransform(scrollYProgress, [0.2, 0.75], [1, 0]);

  const pX = useTransform(scrollYProgress, [0, 0.75], ["0vw", "20vw"]);
  const pOpacity = useTransform(scrollYProgress, [0.2, 0.75], [1, 0]);

  const badgeY = useTransform(scrollYProgress, [0, 0.75], ["0vh", "-10vh"]);
  const badgeOpacity = useTransform(scrollYProgress, [0.1, 0.75], [1, 0]);

  const btnY = useTransform(scrollYProgress, [0, 0.75], ["0vh", "10vh"]);
  const btnOpacity = useTransform(scrollYProgress, [0.2, 0.75], [1, 0]);

  const botScale = useTransform(scrollYProgress, [0, 0.75], [1, 1.5]);
  const botRotate = useTransform(scrollYProgress, [0, 0.75], [0, -10]);
  const botX = useTransform(scrollYProgress, [0, 0.75], ["0vw", "15vw"]);
  const botOpacity = useTransform(scrollYProgress, [0.3, 0.75], [1, 0]);
  
  // Background stays red
  const bgOpacity = useTransform(scrollYProgress, [0, 1], [1, 1]); 
  
  // Entire scene fades by 75%
  const sceneOpacity = useTransform(scrollYProgress, [0.6, 0.75], [1, 0]);
  const pointerEvents = useTransform(scrollYProgress, (val) => val >= 0.75 ? "none" : "auto");

  return (
    <div ref={containerRef} className="cinematic-wrapper" style={{ height: "100vh" }}>
      <div className="cinematic-camera" style={{ position: "relative" }}>
        
        <motion.div className="cinematic-bg-layer" style={{ opacity: bgOpacity }}>
          <RedStrips index={0} shiftX="-10%" />
          <div className="fade-right"></div>
        </motion.div>

        <motion.div className="cinematic-scene" style={{ opacity: sceneOpacity, pointerEvents }}>
          <div className="cinematic-left">
            <div className="hero-left">
              <motion.div className="hero-badge" style={{ y: badgeY, opacity: badgeOpacity }}>
                <span className="dot"></span> EST. 2021 &bull; MNNIT ALLAHABAD
              </motion.div>

              <motion.div style={{ x: h2X, opacity: h2Opacity }}>
                <h2>MECHANICAL</h2>
                <h2>COMMUNITY OF MNNIT</h2>
              </motion.div>

              <motion.h1 style={{ y: h1Y, scale: h1Scale, opacity: h1Opacity, transformOrigin: "left center" }}>MECHAPEF</motion.h1>

              <motion.p style={{ x: pX, opacity: pOpacity }}>
                The Official Club of Mechanical and Production<br />
                & Industrial Engineering at MNNIT Allahabad
              </motion.p>

              <motion.div className="hero-buttons" style={{ y: btnY, opacity: btnOpacity }}>
                <MagneticButton className="primary-btn" onClick={() => navigate('/magazine')}>
                  Explore Magazine
                </MagneticButton>
                <MagneticButton className="secondary-btn" onClick={() => scrollToId('our-team')}>
                  Meet the Team
                </MagneticButton>
              </motion.div>
            </div>
          </div>

          <motion.div className="cinematic-right" style={{ x: botX, scale: botScale, rotate: botRotate, opacity: botOpacity, transformOrigin: "center center" }}>
             <img src={assets.heroBot} className="hero-bot" alt="MechaPEF Bot" />
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
};

export default HeroIntro;
