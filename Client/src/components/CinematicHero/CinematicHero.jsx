import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { assets } from "../../assets/assets";
import { FaArrowRight, FaUsers, FaCalendarAlt, FaTrophy } from "react-icons/fa";
import wheelImg from "../../assets/wheel.png";

import RedStrips from '../RedInclinedStrips/RedInclinedStrips';
import './CinematicHero.css';

// Import the styles so the inner components render beautifully
import '../Hero/Hero.css';
import '../About/About.css';

const CinematicHero = () => {
  const containerRef = useRef(null);

  // Using "end end" means progress goes from 0 to 1 as you scroll from top to bottom of the 900vh wrapper
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // ================= SCROLL MATH FOR 900vh =================
  // Each 0.05 is 45vh. Each 0.10 is 90vh.
  
  // --- SCENE 1: Hero Bot (0.00 to 0.10) ---
  const scene1TextX = useTransform(scrollYProgress, [0, 0.10], [0, -1000]);
  const scene1ImgX = useTransform(scrollYProgress, [0, 0.10], [0, 1000]);
  const scene1Opacity = useTransform(scrollYProgress, [0, 0.10], [1, 0]);
  const bg1Opacity = useTransform(scrollYProgress, [0, 0.10], [1, 0]);
  const bg1Display = useTransform(scrollYProgress, (val) => val >= 0.10 ? "none" : "block");
  const scene1PointerEvents = useTransform(scrollYProgress, (val) => val >= 0.10 ? "none" : "auto");

  // --- SCENE 2: Drone Dashboard (0.10 to 0.60) ---
  // Left Strips Enter (0.10 to 0.15) & Exit (0.55 to 0.60)
  const bg2Opacity = useTransform(scrollYProgress, [0.10, 0.15, 0.55, 0.60], [0, 1, 1, 0]);
  const bg2X = useTransform(scrollYProgress, [0.10, 0.15, 0.55, 0.60], [-200, 0, 0, -200]); 
  
  // Drone Enters (0.15 to 0.20) & Exits (0.50 to 0.55)
  const droneOpacity = useTransform(scrollYProgress, [0.15, 0.20, 0.50, 0.55], [0, 1, 1, 0]);
  const droneY = useTransform(scrollYProgress, [0.15, 0.20, 0.50, 0.55], [-800, 0, 0, 800]); 
  const droneX = useTransform(scrollYProgress, [0.15, 0.20, 0.50, 0.55], [373, 0, 0, -373]);

  // Cards Enter (0.20 to 0.25) & Exit (0.45 to 0.50)
  const text2Opacity = useTransform(scrollYProgress, [0.20, 0.25, 0.45, 0.50], [0, 1, 1, 0]);
  const card1Y = useTransform(scrollYProgress, [0.20, 0.25, 0.45, 0.50], [-500, 0, 0, -500]); // Top
  const card2X = useTransform(scrollYProgress, [0.20, 0.25, 0.45, 0.50], [500, 0, 0, 500]); // Right
  const card3X = useTransform(scrollYProgress, [0.20, 0.25, 0.45, 0.50], [-500, 0, 0, -500]); // Left
  const card4Y = useTransform(scrollYProgress, [0.20, 0.25, 0.45, 0.50], [500, 0, 0, 500]); // Bottom
  const scene2PointerEvents = useTransform(scrollYProgress, (val) => (val >= 0.20 && val <= 0.45) ? "auto" : "none");

  // --- SCENE 3: Spirit of Mechanical Engineering (0.60 to 1.00) ---
  // Right Strips Enter (0.60 to 0.65)
  const bg3Opacity = useTransform(scrollYProgress, [0.60, 0.65], [0, 1]);
  const bg3Y = useTransform(scrollYProgress, [0.60, 0.65], [1000, 0]);
  const bg3X = useTransform(scrollYProgress, [0.60, 0.65], [466, 0]); // From bottom right along -25deg slope

  // Wheel Enters (0.65 to 0.70) & Exits (0.85 to 0.95) towards Right (forward)
  // Keep opacity 1 until the very end so the exit movement is clearly visible
  const wheelOpacity = useTransform(scrollYProgress, [0.65, 0.70, 0.95, 1.0], [0, 1, 1, 0]);
  const wheelX = useTransform(scrollYProgress, [0.65, 0.70, 0.85, 0.95], ["-80vw", "0vw", "0vw", "50vw"]);
  const wheelY = useTransform(scrollYProgress, [0.65, 0.70, 0.85, 0.95], ["-50vh", "0vh", "0vh", "20vh"]);
  const wheelScale = useTransform(scrollYProgress, [0.65, 0.70, 0.85, 0.95], [0.05, 1, 1, 4]);

  // Spirit Content Enters (0.70 to 0.75) & Exits (0.85 to 0.95)
  const spiritContentOpacity = useTransform(scrollYProgress, [0.70, 0.75, 0.85, 0.95], [0, 1, 1, 0]);
  
  // "Celebrating the Spirit of" -> Enters from left, exits to left
  const title1X = useTransform(scrollYProgress, [0.70, 0.73, 0.75, 0.85, 0.95], [-800, 30, 0, 0, -800]);
  // "Mechanical Engineering" -> Enters from right, exits to right
  const title2X = useTransform(scrollYProgress, [0.70, 0.75, 0.85, 0.95], [800, 0, 0, 800]);
  // Subtitle & Desc -> fade/slide up, then slide back down
  const descY = useTransform(scrollYProgress, [0.70, 0.75, 0.85, 0.95], [100, 0, 0, 100]);

  // Cards from bottom, staggered entry, synchronous exit to bottom
  const s3Card1Y = useTransform(scrollYProgress, [0.70, 0.73, 0.85, 0.95], [200, 0, 0, 200]);
  const s3Card1Op = useTransform(scrollYProgress, [0.70, 0.73, 0.85, 0.95], [0, 1, 1, 0]);
  
  const s3Card2Y = useTransform(scrollYProgress, [0.71, 0.74, 0.85, 0.95], [200, 0, 0, 200]);
  const s3Card2Op = useTransform(scrollYProgress, [0.71, 0.74, 0.85, 0.95], [0, 1, 1, 0]);
  
  const s3Card3Y = useTransform(scrollYProgress, [0.72, 0.75, 0.85, 0.95], [200, 0, 0, 200]);
  const s3Card3Op = useTransform(scrollYProgress, [0.72, 0.75, 0.85, 0.95], [0, 1, 1, 0]);

  // Radiating lines fade in with content but fade out between 0.85 and 0.95
  const linesOpacity = useTransform(scrollYProgress, [0.70, 0.75, 0.85, 0.95], [0, 1, 1, 0]);

  const scene3PointerEvents = useTransform(scrollYProgress, (val) => val >= 0.70 ? "auto" : "none");

  return (
    <div ref={containerRef} className="cinematic-wrapper" style={{ height: "900vh" }}>
      <div className="cinematic-camera">
        
        {/* ================= SCENE 1 BACKGROUND ================= */}
        <motion.div 
          className="cinematic-bg-layer"
          style={{ opacity: bg1Opacity, display: bg1Display }}
        >
          <RedStrips index={0} shiftX="-10%" />
          <div className="fade-right"></div>
        </motion.div>

        {/* ================= SCENE 2 BACKGROUND ================= */}
        <motion.div 
          className="cinematic-bg-layer"
          style={{ opacity: bg2Opacity, x: bg2X }}
        >
          <RedStrips index={0} shiftX="45%" />
          <div className="fade-left"></div>
        </motion.div>

        {/* ================= SCENE 3 BACKGROUND ================= */}
        <motion.div 
          className="cinematic-bg-layer"
          style={{ opacity: bg3Opacity, x: bg3X, y: bg3Y }}
        >
          <RedStrips index={0} shiftX="-20%" />
          {/* Background Rays */}
          <motion.div 
            className="spirit-bg-rays"
            style={{ opacity: spiritContentOpacity }}
          ></motion.div>
        </motion.div>


        {/* ================= SCENE 1 CONTENT ================= */}
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

              <div className="hero-buttons">
                <button className="primary-btn">
                  EXPLORE MORE <FaArrowRight />
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

        {/* ================= SCENE 2 CONTENT ================= */}
        <motion.div 
          className="cinematic-scene"
          style={{ pointerEvents: scene2PointerEvents }}
        >
          <motion.div 
            className="cinematic-left drone-container" 
            style={{ x: droneX, y: droneY, opacity: droneOpacity }}
          >
             <img src={assets.drone} className="drone" alt="Autonomous Drone" />
             <h2 className="drone-dashboard-text">Dashboard</h2>
          </motion.div>

          <motion.div 
            className="cinematic-right"
            style={{ opacity: text2Opacity }}
          >
            <div className="dashboard-grid">
              
              <div className="dash-col col-left">
                <motion.div 
                  className="dash-card card-tall"
                  style={{ y: card1Y }}
                >
                  <h3 className="dash-num">45+</h3>
                  <h4 className="dash-title">Projects Completed</h4>
                  <p className="dash-sub text-red">collaborative and individuals</p>
                </motion.div>
                <motion.div 
                  className="dash-card card-wide"
                  style={{ x: card3X }}
                >
                  <h3 className="dash-num">1000+</h3>
                  <h4 className="dash-title">Students Impacted</h4>
                  <p className="dash-sub">and growing with every semester</p>
                </motion.div>
              </div>
              
              <div className="dash-col col-right">
                <motion.div 
                  className="dash-card card-wide"
                  style={{ x: card2X }}
                >
                  <h3 className="dash-num">5+</h3>
                  <h4 className="dash-title">Years of Legacy</h4>
                  <p className="dash-sub">of knowledge and mentorship programmes</p>
                </motion.div>
                <motion.div 
                  className="dash-card card-tall"
                  style={{ y: card4Y }}
                >
                  <h3 className="dash-num">50+</h3>
                  <h4 className="dash-title">Events Conducted</h4>
                  <p className="dash-sub text-red">workshops, competitions and more</p>
                </motion.div>
              </div>

            </div>
          </motion.div>
        </motion.div>

        {/* ================= SCENE 3 CONTENT ================= */}
        <motion.div 
          className="cinematic-scene"
          style={{ pointerEvents: scene3PointerEvents }}
        >
          {/* Radiating Perspective Lines indicating Wheel size/speed */}
          <motion.svg 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, mixBlendMode: 'screen', opacity: linesOpacity, pointerEvents: 'none' }}
          >
            <line x1="0%" y1="0%" x2="80%" y2="20%" stroke="rgba(255, 0, 0, 0.5)" strokeWidth="1" />
            <line x1="0%" y1="0%" x2="90%" y2="40%" stroke="rgba(255, 0, 0, 0.8)" strokeWidth="2" />
            <line x1="0%" y1="0%" x2="85%" y2="60%" stroke="rgba(255, 0, 0, 0.5)" strokeWidth="1.5" />
            <line x1="0%" y1="0%" x2="70%" y2="80%" stroke="rgba(255, 0, 0, 0.3)" strokeWidth="1" />
            <line x1="0%" y1="0%" x2="50%" y2="100%" stroke="rgba(255, 0, 0, 0.2)" strokeWidth="0.5" />
          </motion.svg>

          <div className="spirit-content">
            <div className="spirit-left">
              <div className="spirit-header">
                <motion.p className="spirit-subtitle" style={{ y: descY, opacity: spiritContentOpacity }}>
                  WHAT WE STAND FOR
                </motion.p>
                <h2 className="spirit-title">
                  <motion.div style={{ x: title1X, opacity: spiritContentOpacity }}>Celebrating the Spirit of</motion.div>
                  <motion.div style={{ x: title2X, opacity: spiritContentOpacity }} className="text-red">Mechanical Engineering</motion.div>
                </h2>
                <motion.p className="spirit-desc" style={{ y: descY, opacity: spiritContentOpacity }}>
                  MechaPEF continues to bridge knowledge, ideas, and people – fostering a culture of innovation and belonging within the department.
                </motion.p>
              </div>

              <div className="spirit-cards-container">
                <motion.div className="spirit-card" style={{ y: s3Card1Y, opacity: s3Card1Op }}>
                  <div className="card-icon"><FaCalendarAlt /></div>
                  <h3>Workshops <br/>& Meets</h3>
                  <p>From professional development to alumni interactions, we create opportunities for learning and growth.</p>
                </motion.div>

                <motion.div className="spirit-card" style={{ y: s3Card2Y, opacity: s3Card2Op }}>
                  <div className="card-icon"><FaUsers /></div>
                  <h3>Collaborative <br/>Community</h3>
                  <p>A vibrant network united by curiosity, teamwork, and the spirit of mechanical engineering.</p>
                </motion.div>

                <motion.div className="spirit-card" style={{ y: s3Card3Y, opacity: s3Card3Op }}>
                  <div className="card-icon"><FaTrophy /></div>
                  <h3>Legacy of <br/>Learning</h3>
                  <p>Continuing a tradition of knowledge sharing, mentorship, and departmental unity across batches.</p>
                </motion.div>
              </div>
            </div>

            <div className="spirit-right">
              <motion.div 
                className="wheel-glow"
                style={{ opacity: wheelOpacity }}
              ></motion.div>

              <motion.div 
                style={{ 
                  x: wheelX, 
                  y: wheelY, 
                  scale: wheelScale, 
                  opacity: wheelOpacity,
                  width: '100%', 
                  display: 'flex', 
                  justifyContent: 'center' 
                }}
              >
                <img 
                  src={wheelImg} 
                  alt="Mechanical Wheel" 
                  className="spirit-wheel"
                  style={{ transform: 'scaleX(-1)' }}
                />
              </motion.div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default CinematicHero;
