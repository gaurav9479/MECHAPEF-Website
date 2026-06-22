import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { assets } from "../../assets/assets";
import { FaArrowRight, FaUsers } from "react-icons/fa";

import RedStrips from '../RedInclinedStrips/RedInclinedStrips';
import './CinematicHero.css';

// Import the styles so the inner components render beautifully
import '../Hero/Hero.css';
import '../About/About.css';

const CinematicHero = () => {
  const containerRef = useRef(null);

  // Using "end end" means progress goes from 0 to 1 as you scroll from top to bottom of the wrapper
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // --- SCROLL 1: Scene 1 & BG1 Exit (0.0 to 0.15) ---
  const scene1TextX = useTransform(scrollYProgress, [0, 0.15], [0, -1000]);
  const scene1ImgX = useTransform(scrollYProgress, [0, 0.15], [0, 1000]);
  const scene1Opacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const bg1Opacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const bg1Display = useTransform(scrollYProgress, (val) => val >= 0.15 ? "none" : "block");
  const scene1PointerEvents = useTransform(scrollYProgress, (val) => val >= 0.15 ? "none" : "auto");

  // --- SCROLL 2: Left Strips Enter (0.15 to 0.25) & Exit (0.85 to 0.95) ---
  const bg2Opacity = useTransform(scrollYProgress, [0.15, 0.25, 0.85, 0.95], [0, 1, 1, 0]);
  const bg2X = useTransform(scrollYProgress, [0.15, 0.25, 0.85, 0.95], [-200, 0, 0, -200]); 
  
  // --- SCROLL 3: Drone Enters ON the strips (0.25 to 0.35) & Exits (0.75 to 0.85) ---
  const droneOpacity = useTransform(scrollYProgress, [0.25, 0.35, 0.75, 0.85], [0, 1, 1, 0]);
  const droneY = useTransform(scrollYProgress, [0.25, 0.35, 0.75, 0.85], [-800, 0, 0, 800]); 
  const droneX = useTransform(scrollYProgress, [0.25, 0.35, 0.75, 0.85], [373, 0, 0, -373]);

  // --- SCROLL 4: Cards Enter from Directions (0.35 to 0.45) & Exit (0.65 to 0.75) ---
  const text2Opacity = useTransform(scrollYProgress, [0.35, 0.45, 0.65, 0.75], [0, 1, 1, 0]);
  
  // Card 1: 45+ (Top)
  const card1X = useTransform(scrollYProgress, [0.35, 0.45, 0.65, 0.75], [0, 0, 0, 0]);
  const card1Y = useTransform(scrollYProgress, [0.35, 0.45, 0.65, 0.75], [-500, 0, 0, -500]);
  
  // Card 2: 5+ (Right)
  const card2X = useTransform(scrollYProgress, [0.35, 0.45, 0.65, 0.75], [500, 0, 0, 500]);
  const card2Y = useTransform(scrollYProgress, [0.35, 0.45, 0.65, 0.75], [0, 0, 0, 0]);
  
  // Card 3: 1000+ (Left)
  const card3X = useTransform(scrollYProgress, [0.35, 0.45, 0.65, 0.75], [-500, 0, 0, -500]);
  const card3Y = useTransform(scrollYProgress, [0.35, 0.45, 0.65, 0.75], [0, 0, 0, 0]);
  
  // Card 4: 50+ (Bottom)
  const card4X = useTransform(scrollYProgress, [0.35, 0.45, 0.65, 0.75], [0, 0, 0, 0]);
  const card4Y = useTransform(scrollYProgress, [0.35, 0.45, 0.65, 0.75], [500, 0, 0, 500]);
  const scene2PointerEvents = useTransform(scrollYProgress, (val) => val < 0.35 ? "none" : "auto");

  return (
    <div ref={containerRef} className="cinematic-wrapper">
      <div className="cinematic-camera">
        
        {/* BACKGROUND 1 (Right Strips) */}
        <motion.div 
          className="cinematic-bg-layer"
          style={{ opacity: bg1Opacity, display: bg1Display }}
        >
          <RedStrips index={0} shiftX="-10%" />
          <div className="fade-right"></div>
        </motion.div>

        {/* BACKGROUND 2 (Left Strips - mathematically shifted to the left) */}
        <motion.div 
          className="cinematic-bg-layer"
          style={{ opacity: bg2Opacity, x: bg2X }}
        >
          <RedStrips index={0} shiftX="55%" />
          <div className="fade-left"></div>
        </motion.div>

        {/* SCENE 1 (The Hero Content) */}
        <motion.div 
          className="cinematic-scene"
          style={{ opacity: scene1Opacity, pointerEvents: scene1PointerEvents }}
        >
          <motion.div className="cinematic-left" style={{ x: scene1TextX }}>
            <div className="hero-left">
              <div className="hero-badge">
                <span className="dot"></span> EST. 2021 &bull; MNNIT ALLAHABAD
              </div>

              <h2>MECHANICAL</h2>
              <h2>COMMUNITY OF MNNIT</h2>
              <h1>MECHAPEF</h1>

              <p>
                The Official Club of Mechanical and Production<br />
                & Industrial Engineering at MNNIT Allahabad
              </p>

              <div className="hero-features">
                <span>&bull; INSPIRING GROWTH</span>
                <span>&bull; INNOVATION</span>
                <span>&bull; TOGETHERNESS</span>
              </div>

              <div className="hero-buttons">
                <button className="primary-btn">
                  EXPLORE EVENTS <FaArrowRight />
                </button>
                <button className="secondary-btn">
                  MEET THE TEAM <FaUsers />
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div className="cinematic-right" style={{ x: scene1ImgX }}>
             <img src={assets.heroBot} className="hero-bot" alt="MechaPEF Bot" />
          </motion.div>
        </motion.div>

        {/* SCENE 2 (The About Content) */}
        <motion.div 
          className="cinematic-scene"
          style={{ pointerEvents: scene2PointerEvents }}
        >
          {/* DRONE & DASHBOARD TITLE (NOW ON LEFT) */}
          <motion.div 
            className="cinematic-left drone-container" 
            style={{ x: droneX, y: droneY, opacity: droneOpacity }}
          >
             <img src={assets.drone} className="drone" alt="Autonomous Drone" />
             <h2 className="drone-dashboard-text">Dashboard</h2>
          </motion.div>

          {/* CARDS GRID (NOW ON RIGHT) */}
          <motion.div 
            className="cinematic-right"
            style={{ opacity: text2Opacity }}
          >
            <div className="dashboard-grid">
              
              <div className="dash-col col-left">
                <motion.div 
                  className="dash-card card-tall"
                  style={{ x: card1X, y: card1Y }}
                >
                  <h3 className="dash-num">45+</h3>
                  <h4 className="dash-title">Projects Completed</h4>
                  <p className="dash-sub text-red">collaborative and individuals</p>
                </motion.div>
                <motion.div 
                  className="dash-card card-wide"
                  style={{ x: card3X, y: card3Y }}
                >
                  <h3 className="dash-num">1000+</h3>
                  <h4 className="dash-title">Students Impacted</h4>
                  <p className="dash-sub">and growing with every semester</p>
                </motion.div>
              </div>

              <div className="dash-col col-right">
                <motion.div 
                  className="dash-card card-wide"
                  style={{ x: card2X, y: card2Y }}
                >
                  <h3 className="dash-num">5+</h3>
                  <h4 className="dash-title">Years of Legacy</h4>
                  <p className="dash-sub">of knowledge and mentorship programmes</p>
                </motion.div>
                <motion.div 
                  className="dash-card card-tall"
                  style={{ x: card4X, y: card4Y }}
                >
                  <h3 className="dash-num">50+</h3>
                  <h4 className="dash-title">Events Conducted</h4>
                  <p className="dash-sub">workshops, competitions and more</p>
                </motion.div>
              </div>

            </div>
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
};

export default CinematicHero;
