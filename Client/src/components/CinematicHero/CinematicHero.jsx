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

  // Using "end end" means progress goes from 0 to 1 as you scroll from top to bottom of the 1200vh wrapper
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // ================= SCROLL MATH FOR 1700vh =================
  // Scene 1-3 take exact physical height as original (0 to 855vh)
  // Gap from 855vh to 900vh
  // Scene 4 Appears: 900vh to 1300vh (4 scrolls)
  // Scene 4 Hold: 1300vh to 1400vh (1 scroll)\n  // Scene 4 Disappears: 1400vh to 1700vh (3 scrolls)
  
  // --- SCENE 1: Hero Bot (0.00 to 0.05625) ---
  const scene1TextX = useTransform(scrollYProgress, [0/1700, 90/1700], [0, -1000]);
  const scene1ImgX = useTransform(scrollYProgress, [0/1700, 90/1700], [0, 1000]);
  const scene1Opacity = useTransform(scrollYProgress, [0/1700, 90/1700], [1, 0]);
  const bg1Opacity = useTransform(scrollYProgress, [0/1700, 90/1700], [1, 0]);
  const bg1Display = useTransform(scrollYProgress, (val) => val >= 90/1700 ? "none" : "block");
  const scene1PointerEvents = useTransform(scrollYProgress, (val) => val >= 90/1700 ? "none" : "auto");

  // --- SCENE 2: Drone Dashboard (0.05625 to 0.3375) ---
  // Left Strips Enter (0.05625 to 0.084375) & Exit (0.309375 to 0.3375)
  const bg2Opacity = useTransform(scrollYProgress, [90/1700, 135/1700, 495/1700, 540/1700], [0, 1, 1, 0]);
  const bg2X = useTransform(scrollYProgress, [90/1700, 135/1700, 495/1700, 540/1700], [-200, 0, 0, -200]); 
  
  // Drone Enters (0.084375 to 0.1125) & Exits (0.28125 to 0.309375)
  const droneOpacity = useTransform(scrollYProgress, [135/1700, 180/1700, 450/1700, 495/1700], [0, 1, 1, 0]);
  const droneY = useTransform(scrollYProgress, [135/1700, 180/1700, 450/1700, 495/1700], [-800, 0, 0, 800]); 
  const droneX = useTransform(scrollYProgress, [135/1700, 180/1700, 450/1700, 495/1700], [373, 0, 0, -373]);

  // Cards Enter (0.1125 to 0.140625) & Exit (0.253125 to 0.28125)
  const text2Opacity = useTransform(scrollYProgress, [180/1700, 225/1700, 405/1700, 450/1700], [0, 1, 1, 0]);
  const card1Y = useTransform(scrollYProgress, [180/1700, 225/1700, 405/1700, 450/1700], [-500, 0, 0, -500]); // Top
  const card2X = useTransform(scrollYProgress, [180/1700, 225/1700, 405/1700, 450/1700], [500, 0, 0, 500]); // Right
  const card3X = useTransform(scrollYProgress, [180/1700, 225/1700, 405/1700, 450/1700], [-500, 0, 0, -500]); // Left
  const card4Y = useTransform(scrollYProgress, [180/1700, 225/1700, 405/1700, 450/1700], [500, 0, 0, 500]); // Bottom
  const scene2PointerEvents = useTransform(scrollYProgress, (val) => (val >= 180/1700 && val <= 405/1700) ? "auto" : "none");

  // --- SCENE 3: Spirit of Mechanical Engineering (0.3375 to 0.5625) ---
  // Right Strips Enter (0.3375 to 0.365625) & Exit (0.478125 to 0.534375)
  const bg3Opacity = useTransform(scrollYProgress, [540/1700, 585/1700, 765/1700, 855/1700], [0, 1, 1, 0]);
  const bg3Y = useTransform(scrollYProgress, [540/1700, 585/1700], [1000, 0]);
  const bg3X = useTransform(scrollYProgress, [540/1700, 585/1700], [466, 0]);

  // Wheel Enters (0.365625 to 0.39375) & Exits (0.478125 to 0.534375)
  const wheelOpacity = useTransform(scrollYProgress, [585/1700, 630/1700, 855/1700, 900/1700], [0, 1, 1, 0]);
  const wheelX = useTransform(scrollYProgress, [585/1700, 630/1700, 765/1700, 855/1700], ["-80vw", "0vw", "0vw", "50vw"]);
  const wheelY = useTransform(scrollYProgress, [585/1700, 630/1700, 765/1700, 855/1700], ["-50vh", "0vh", "0vh", "20vh"]);
  const wheelScale = useTransform(scrollYProgress, [585/1700, 630/1700, 765/1700, 855/1700], [0.05, 1, 1, 4]);

  // Spirit Content Enters (0.39375 to 0.421875) & Exits (0.478125 to 0.534375)
  const spiritContentOpacity = useTransform(scrollYProgress, [630/1700, 675/1700, 765/1700, 855/1700], [0, 1, 1, 0]);
  
  // "Celebrating the Spirit of"
  const title1X = useTransform(scrollYProgress, [630/1700, 657/1700, 675/1700, 765/1700, 855/1700], [-800, 30, 0, 0, -800]);
  // "Mechanical Engineering"
  const title2X = useTransform(scrollYProgress, [630/1700, 675/1700, 765/1700, 855/1700], [800, 0, 0, 800]);
  // Subtitle & Desc
  const descY = useTransform(scrollYProgress, [630/1700, 675/1700, 765/1700, 855/1700], [100, 0, 0, 100]);

  // Cards
  const s3Card1Y = useTransform(scrollYProgress, [630/1700, 657/1700, 765/1700, 855/1700], [200, 0, 0, 200]);
  const s3Card1Op = useTransform(scrollYProgress, [630/1700, 657/1700, 765/1700, 855/1700], [0, 1, 1, 0]);
  
  const s3Card2Y = useTransform(scrollYProgress, [639/1700, 666/1700, 765/1700, 855/1700], [200, 0, 0, 200]);
  const s3Card2Op = useTransform(scrollYProgress, [639/1700, 666/1700, 765/1700, 855/1700], [0, 1, 1, 0]);
  
  const s3Card3Y = useTransform(scrollYProgress, [648/1700, 675/1700, 765/1700, 855/1700], [200, 0, 0, 200]);
  const s3Card3Op = useTransform(scrollYProgress, [648/1700, 675/1700, 765/1700, 855/1700], [0, 1, 1, 0]);

  // Radiating lines fade in with content but fade out between 0.478125 and 0.534375
  const linesOpacity = useTransform(scrollYProgress, [630/1700, 675/1700, 765/1700, 855/1700], [0, 1, 1, 0]);

  const scene3PointerEvents = useTransform(scrollYProgress, (val) => (val >= 630/1700 && val <= 855/1700) ? "auto" : "none");

  // --- SCENE 4: Our Department (0.5625 to 1.00) ---
  // Notice the gap from 0.534375 to 0.5625 (pure black scroll delay)
  // Appears over [0.5625, 0.8125] (400vh)
  // Disappears over [0.8125, 1.0] (300vh) with staggered exit and massive fly-off distances!
  const scene4Opacity = useTransform(scrollYProgress, [900/1700, 960/1700, 1636/1700, 1700/1700], [0, 1, 1, 0]);
  const scene4PointerEvents = useTransform(scrollYProgress, (val) => val >= 900/1700 && val <= 1.0 ? "auto" : "none");

  // Scene 4 Background (Opposite Side Strips)
  const bg4Opacity = useTransform(scrollYProgress, [900/1700, 960/1700, 1636/1700, 1700/1700], [0, 1, 1, 0]);
  const bg4X = useTransform(scrollYProgress, [900/1700, 960/1700, 1636/1700, 1700/1700], [-1000, 0, 0, -1000]);

  // Text & Button
  const deptTextOp = useTransform(scrollYProgress, [928/1700, 1008/1700, 1620/1700, 1684/1700], [0, 1, 1, 0]);
  const deptTextX = useTransform(scrollYProgress, [928/1700, 1008/1700, 1620/1700, 1684/1700], [1000, 0, 0, 1000]);

  // Big Image 1
  const img1Op = useTransform(scrollYProgress, [976/1700, 1056/1700, 1588/1700, 1652/1700], [0, 1, 1, 0]);
  const img1Y = useTransform(scrollYProgress, [976/1700, 1056/1700, 1588/1700, 1652/1700], [1000, 0, 0, 1000]);

  // Stacked Images
  const img2Op = useTransform(scrollYProgress, [1024/1700, 1104/1700, 1556/1700, 1620/1700], [0, 1, 1, 0]);
  const img2Y = useTransform(scrollYProgress, [1024/1700, 1104/1700, 1556/1700, 1620/1700], [-1000, 0, 0, -1000]);
  const img3Op = useTransform(scrollYProgress, [1072/1700, 1152/1700, 1524/1700, 1588/1700], [0, 1, 1, 0]);
  const img3Y = useTransform(scrollYProgress, [1072/1700, 1152/1700, 1524/1700, 1588/1700], [1000, 0, 0, 1000]);

  // Bottom Row
  const img4Op = useTransform(scrollYProgress, [1120/1700, 1200/1700, 1492/1700, 1556/1700], [0, 1, 1, 0]);
  const img4Y = useTransform(scrollYProgress, [1120/1700, 1200/1700, 1492/1700, 1556/1700], [1000, 0, 0, 1000]);
  
  const img5Op = useTransform(scrollYProgress, [1152/1700, 1232/1700, 1460/1700, 1524/1700], [0, 1, 1, 0]);
  const img5Y = useTransform(scrollYProgress, [1152/1700, 1232/1700, 1460/1700, 1524/1700], [1000, 0, 0, 1000]);
  
  const img6Op = useTransform(scrollYProgress, [1184/1700, 1264/1700, 1428/1700, 1492/1700], [0, 1, 1, 0]);
  const img6Y = useTransform(scrollYProgress, [1184/1700, 1264/1700, 1428/1700, 1492/1700], [1000, 0, 0, 1000]);
  
  const img7Op = useTransform(scrollYProgress, [1216/1700, 1300/1700, 1400/1700, 1460/1700], [0, 1, 1, 0]);
  const img7Y = useTransform(scrollYProgress, [1216/1700, 1300/1700, 1400/1700, 1460/1700], [1000, 0, 0, 1000]);

  return (
    <div ref={containerRef} className="cinematic-wrapper" style={{ height: "1700vh" }}>
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


        {/* ================= SCENE 4 BACKGROUND ================= */}
        <motion.div 
          className="cinematic-bg-layer"
          style={{ opacity: bg4Opacity, x: bg4X }}
        >
          {/* Shift 80% to move it to the far left side */}
          <RedStrips index={0} shiftX="60%" />
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

        {/* ================= SCENE 4 CONTENT (OUR DEPARTMENT) ================= */}
        <motion.div 
          className="cinematic-scene department-scene"
          style={{ pointerEvents: scene4PointerEvents, opacity: scene4Opacity }}
        >
          <div className="dept-container">
            {/* Row 1 & 2 */}
            <motion.div className="gallery-item img-1" style={{ opacity: img1Op, y: img1Y }}>Image 1</motion.div>
            <motion.div className="gallery-item img-2" style={{ opacity: img2Op, y: img2Y }}>Image 2</motion.div>
            <motion.div className="gallery-item img-3" style={{ opacity: img3Op, y: img3Y }}>Image 3</motion.div>
            
            <motion.div className="dept-content" style={{ opacity: deptTextOp, x: deptTextX }}>
              <h2 className="dept-title">
                Our <br />
                <span>Department</span>
              </h2>
              <p className="dept-desc">
                MechaPEF continues to bridge knowledge, ideas, and people – fostering a culture of innovation and belonging within the department.
              </p>
              <button className="gallery-btn">View Gallery -{'>'}</button>
            </motion.div>

            {/* Row 3 */}
            <motion.div className="gallery-item img-4" style={{ opacity: img4Op, y: img4Y }}>Image 4</motion.div>
            <motion.div className="gallery-item img-5" style={{ opacity: img5Op, y: img5Y }}>Image 5</motion.div>
            <motion.div className="gallery-item img-6" style={{ opacity: img6Op, y: img6Y }}>Image 6</motion.div>
            <motion.div className="gallery-item img-7" style={{ opacity: img7Op, y: img7Y }}>Image 7</motion.div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default CinematicHero;
