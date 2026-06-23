import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { assets } from "../../assets/assets";
import { FaArrowRight, FaUsers, FaCalendarAlt, FaTrophy, FaEnvelope, FaInstagram, FaLinkedinIn, FaFacebookF, FaTwitter } from "react-icons/fa";
import wheelImg from "../../assets/wheel.png";

import RedStrips from '../RedInclinedStrips/RedInclinedStrips';
import './CinematicHero.css';

// Import the styles so the inner components render beautifully
import '../Hero/Hero.css';
import '../About/About.css';
import api from '../../services/api';
import EditableImage from '../EditableImage/EditableImage';
import { Link } from 'react-router-dom';

const CinematicHero = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  
  const [imagesMap, setImagesMap] = useState({});

  const fetchSectionImages = async () => {
    try {
      const res = await api.get('/upload/sections');
      const imgMap = {};
      if (res.data.data?.images) {
        res.data.data.images.forEach(img => {
          imgMap[img.sectionKey] = img.imageURL;
        });
      }
      setImagesMap(imgMap);
    } catch (error) {
      console.error("Failed to load section images:", error);
    }
  };

  useEffect(() => {
    fetchSectionImages();
  }, []);

  // Using "end end" means progress goes from 0 to 1 as you scroll from top to bottom of the 1200vh wrapper
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // ================= SCROLL MATH FOR 2500vh =================
  // Scene 1-3 take exact physical height as original (0 to 855vh)
  // Gap from 855vh to 900vh
  // Scene 4 Appears: 900vh to 1300vh (4 scrolls)
  // Scene 4 Hold: 1300vh to 1400vh (1 scroll)\n  // Scene 4 Disappears: 1400vh to 2500vh (3 scrolls)
  
  // --- SCENE 1: Hero Bot (0.00 to 0.05625) ---
  const scene1TextX = useTransform(scrollYProgress, [0/2500, 90/2500], ["0vw", "-100vw"]);
  const scene1ImgX = useTransform(scrollYProgress, [0/2500, 90/2500], ["0vw", "100vw"]);
  const scene1Opacity = useTransform(scrollYProgress, [0/2500, 90/2500], [1, 0]);
  const bg1Opacity = useTransform(scrollYProgress, [0/2500, 90/2500], [1, 0]);
  const bg1Display = useTransform(scrollYProgress, (val) => val >= 90/2500 ? "none" : "block");
  const scene1PointerEvents = useTransform(scrollYProgress, (val) => val >= 90/2500 ? "none" : "auto");

  // --- SCENE 2: Drone Dashboard (0.05625 to 0.3375) ---
  // Left Strips Enter (0.05625 to 0.084375) & Exit (0.309375 to 0.3375)
  const bg2Opacity = useTransform(scrollYProgress, [90/2500, 135/2500, 495/2500, 540/2500], [0, 1, 1, 0]);
  const bg2X = useTransform(scrollYProgress, [90/2500, 135/2500, 495/2500, 540/2500], ["-20vw", "0vw", "0vw", "-20vw"]); 
  
  // Drone Enters (0.084375 to 0.1125) & Exits (0.28125 to 0.309375)
  const droneOpacity = useTransform(scrollYProgress, [135/2500, 180/2500, 450/2500, 495/2500], [0, 1, 1, 0]);
  const droneY = useTransform(scrollYProgress, [135/2500, 180/2500, 450/2500, 495/2500], ["-100vh", "0vh", "0vh", "100vh"]); 
  const droneX = useTransform(scrollYProgress, [135/2500, 180/2500, 450/2500, 495/2500], ["50vw", "0vw", "0vw", "-50vw"]);

  // Cards Enter (0.1125 to 0.140625) & Exit (0.253125 to 0.28125)
  const text2Opacity = useTransform(scrollYProgress, [180/2500, 225/2500, 405/2500, 450/2500], [0, 1, 1, 0]);
  
  // Card 1 (45+): Enters from Top (90° -> Y=-500), Exits to Left (180° -> X=-500)
  const card1Y = useTransform(scrollYProgress, [180/2500, 225/2500, 405/2500, 450/2500], ["-50vh", "0vh", "0vh", "0vh"]);
  const card1X = useTransform(scrollYProgress, [180/2500, 225/2500, 405/2500, 450/2500], ["0vw", "0vw", "0vw", "-50vw"]);

  // Card 3 (1000+): Enters from Left (180° -> X=-500), Exits to Bottom (270° -> Y=500)
  const card3X = useTransform(scrollYProgress, [180/2500, 225/2500, 405/2500, 450/2500], ["-50vw", "0vw", "0vw", "0vw"]);
  const card3Y = useTransform(scrollYProgress, [180/2500, 225/2500, 405/2500, 450/2500], ["0vh", "0vh", "0vh", "50vh"]);

  // Card 2 (5+ Years): Enters from Right (0° -> X=500), Exits to Top (90° -> Y=-500)
  const card2X = useTransform(scrollYProgress, [180/2500, 225/2500, 405/2500, 450/2500], ["50vw", "0vw", "0vw", "0vw"]);
  const card2Y = useTransform(scrollYProgress, [180/2500, 225/2500, 405/2500, 450/2500], ["0vh", "0vh", "0vh", "-50vh"]);

  // Card 4 (50+ Events): Enters from Bottom (270° -> Y=500), Exits to Right (0° -> X=500)
  const card4Y = useTransform(scrollYProgress, [180/2500, 225/2500, 405/2500, 450/2500], ["50vh", "0vh", "0vh", "0vh"]);
  const card4X = useTransform(scrollYProgress, [180/2500, 225/2500, 405/2500, 450/2500], ["0vw", "0vw", "0vw", "50vw"]);

  const scene2PointerEvents = useTransform(scrollYProgress, (val) => (val >= 180/2500 && val <= 405/2500) ? "auto" : "none");

  // --- SCENE 3: Spirit of Mechanical Engineering (0.3375 to 0.5625) ---
  // Right Strips Enter (0.3375 to 0.365625) & Exit (0.478125 to 0.534375)
  const bg3Opacity = useTransform(scrollYProgress, [540/2500, 585/2500, 765/2500, 855/2500], [0, 1, 1, 0]);
  const bg3Y = useTransform(scrollYProgress, [540/2500, 585/2500], ["100vh", "0vh"]);
  const bg3X = useTransform(scrollYProgress, [540/2500, 585/2500], ["50vw", "0vw"]);

  // Wheel Enters (0.365625 to 0.39375) & Exits (0.478125 to 0.534375)
  const wheelOpacity = useTransform(scrollYProgress, [585/2500, 630/2500, 855/2500, 900/2500], [0, 1, 1, 0]);
  const wheelX = useTransform(scrollYProgress, [585/2500, 630/2500, 765/2500, 855/2500], ["-80vw", "0vw", "0vw", "50vw"]);
  const wheelY = useTransform(scrollYProgress, [585/2500, 630/2500, 765/2500, 855/2500], ["-50vh", "0vh", "0vh", "20vh"]);
  const wheelScale = useTransform(scrollYProgress, [585/2500, 630/2500, 765/2500, 855/2500], [0.05, 1, 1, 4]);

  // Spirit Content Enters (0.39375 to 0.421875) & Exits (0.478125 to 0.534375)
  const spiritContentOpacity = useTransform(scrollYProgress, [630/2500, 675/2500, 765/2500, 855/2500], [0, 1, 1, 0]);
  
  // "Celebrating the Spirit of"
  const title1X = useTransform(scrollYProgress, [630/2500, 657/2500, 675/2500, 765/2500, 855/2500], ["-100vw", "5vw", "0vw", "0vw", "-100vw"]);
  // "Mechanical Engineering"
  const title2X = useTransform(scrollYProgress, [630/2500, 675/2500, 765/2500, 855/2500], ["100vw", "0vw", "0vw", "100vw"]);
  // Subtitle & Desc
  const descY = useTransform(scrollYProgress, [630/2500, 675/2500, 765/2500, 855/2500], ["10vh", "0vh", "0vh", "10vh"]);

  // Cards
  const s3Card1Y = useTransform(scrollYProgress, [630/2500, 657/2500, 765/2500, 855/2500], ["20vh", "0vh", "0vh", "20vh"]);
  const s3Card1Op = useTransform(scrollYProgress, [630/2500, 657/2500, 765/2500, 855/2500], [0, 1, 1, 0]);
  
  const s3Card2Y = useTransform(scrollYProgress, [639/2500, 666/2500, 765/2500, 855/2500], ["20vh", "0vh", "0vh", "20vh"]);
  const s3Card2Op = useTransform(scrollYProgress, [639/2500, 666/2500, 765/2500, 855/2500], [0, 1, 1, 0]);
  
  const s3Card3Y = useTransform(scrollYProgress, [648/2500, 675/2500, 765/2500, 855/2500], ["20vh", "0vh", "0vh", "20vh"]);
  const s3Card3Op = useTransform(scrollYProgress, [648/2500, 675/2500, 765/2500, 855/2500], [0, 1, 1, 0]);

  // Radiating lines fade in with content but fade out between 0.478125 and 0.534375
  const linesOpacity = useTransform(scrollYProgress, [630/2500, 675/2500, 765/2500, 855/2500], [0, 1, 1, 0]);

  const scene3PointerEvents = useTransform(scrollYProgress, (val) => (val >= 630/2500 && val <= 855/2500) ? "auto" : "none");

  // --- SCENE 4: Our Department (0.5625 to 1.00) ---
  // Notice the gap from 0.534375 to 0.5625 (pure black scroll delay)
  // Appears over [0.5625, 0.8125] (400vh)
  // Disappears over [0.8125, 1.0] (300vh) with staggered exit and massive fly-off distances!
  const scene4Opacity = useTransform(scrollYProgress, [900/2500, 960/2500, 1636/2500, 1700/2500], [0, 1, 1, 0]);
  const scene4PointerEvents = useTransform(scrollYProgress, (val) => val >= 900/2500 && val <= 1800/2500 ? "auto" : "none");

  // Scene 4 Background (Opposite Side Strips)
  const bg4Opacity = useTransform(scrollYProgress, [900/2500, 960/2500, 1636/2500, 1700/2500], [0, 1, 1, 0]);
  const bg4X = useTransform(scrollYProgress, [900/2500, 960/2500, 1636/2500, 1700/2500], ["-100vw", "0vw", "0vw", "-100vw"]);

  // Text & Button
  const deptTextOp = useTransform(scrollYProgress, [928/2500, 1008/2500, 1620/2500, 1684/2500], [0, 1, 1, 0]);
  const deptTextX = useTransform(scrollYProgress, [928/2500, 1008/2500, 1620/2500, 1684/2500], ["100vw", "0vw", "0vw", "100vw"]);

  // Big Image 1
  const img1Op = useTransform(scrollYProgress, [976/2500, 1056/2500, 1588/2500, 1652/2500], [0, 1, 1, 0]);
  const img1Y = useTransform(scrollYProgress, [976/2500, 1056/2500, 1588/2500, 1652/2500], ["100vh", "0vh", "0vh", "100vh"]);

  // Stacked Images
  const img2Op = useTransform(scrollYProgress, [1024/2500, 1104/2500, 1556/2500, 1620/2500], [0, 1, 1, 0]);
  const img2Y = useTransform(scrollYProgress, [1024/2500, 1104/2500, 1556/2500, 1620/2500], ["-100vh", "0vh", "0vh", "-100vh"]);
  const img3Op = useTransform(scrollYProgress, [1072/2500, 1152/2500, 1524/2500, 1588/2500], [0, 1, 1, 0]);
  const img3Y = useTransform(scrollYProgress, [1072/2500, 1152/2500, 1524/2500, 1588/2500], ["100vh", "0vh", "0vh", "100vh"]);

  // Bottom Row
  const img4Op = useTransform(scrollYProgress, [1120/2500, 1200/2500, 1492/2500, 1556/2500], [0, 1, 1, 0]);
  const img4Y = useTransform(scrollYProgress, [1120/2500, 1200/2500, 1492/2500, 1556/2500], ["100vh", "0vh", "0vh", "100vh"]);
  
  const img5Op = useTransform(scrollYProgress, [1152/2500, 1232/2500, 1460/2500, 1524/2500], [0, 1, 1, 0]);
  const img5Y = useTransform(scrollYProgress, [1152/2500, 1232/2500, 1460/2500, 1524/2500], ["100vh", "0vh", "0vh", "100vh"]);
  
  const img6Op = useTransform(scrollYProgress, [1184/2500, 1264/2500, 1428/2500, 1492/2500], [0, 1, 1, 0]);
  const img6Y = useTransform(scrollYProgress, [1184/2500, 1264/2500, 1428/2500, 1492/2500], ["100vh", "0vh", "0vh", "100vh"]);
  
  const img7Op = useTransform(scrollYProgress, [1216/2500, 1300/2500, 1400/2500, 1460/2500], [0, 1, 1, 0]);
  const img7Y = useTransform(scrollYProgress, [1216/2500, 1300/2500, 1400/2500, 1460/2500], ["100vh", "0vh", "0vh", "100vh"]);

  // --- SCENE 5: Join Us (1800vh to 2500vh) ---
  const scene5PointerEvents = useTransform(scrollYProgress, (val) => (val >= 1800/2500 && val <= 2450/2500) ? "auto" : "none");
  const scene5Opacity = useTransform(scrollYProgress, [1800/2500, 1850/2500, 2450/2500, 2500/2500], [0, 1, 1, 0]);
  
  // Background strips & bot appear TOGETHER over 300vh, hold 200vh, disperse 200vh
  const bg5X = useTransform(scrollYProgress, [1800/2500, 2100/2500, 2300/2500, 2500/2500], ["-10vw", "0vw", "0vw", "10vw"]);
  const bg5Opacity = useTransform(scrollYProgress, [1800/2500, 2100/2500, 2300/2500, 2500/2500], [0, 1, 1, 0]);

  // Bot slides in from LEFT and disperses to LEFT
  const botX = useTransform(scrollYProgress, [1800/2500, 2100/2500, 2300/2500, 2500/2500], ["-100vw", "0vw", "0vw", "-100vw"]);
  const botOpacity = useTransform(scrollYProgress, [1800/2500, 2100/2500, 2300/2500, 2500/2500], [0, 1, 1, 0]);

  // Content lines slide in from RIGHT line by line
  const s5Line1X = useTransform(scrollYProgress, [1800/2500, 1950/2500, 2300/2500, 2400/2500], ["100vw", "0vw", "0vw", "100vw"]);
  const s5Line1Op = useTransform(scrollYProgress, [1800/2500, 1950/2500, 2300/2500, 2400/2500], [0, 1, 1, 0]);

  const s5Line2X = useTransform(scrollYProgress, [1850/2500, 2000/2500, 2333/2500, 2433/2500], ["100vw", "0vw", "0vw", "100vw"]);
  const s5Line2Op = useTransform(scrollYProgress, [1850/2500, 2000/2500, 2333/2500, 2433/2500], [0, 1, 1, 0]);

  const s5Line3X = useTransform(scrollYProgress, [1900/2500, 2050/2500, 2366/2500, 2466/2500], ["100vw", "0vw", "0vw", "100vw"]);
  const s5Line3Op = useTransform(scrollYProgress, [1900/2500, 2050/2500, 2366/2500, 2466/2500], [0, 1, 1, 0]);

  const s5Line4X = useTransform(scrollYProgress, [1950/2500, 2100/2500, 2400/2500, 2500/2500], ["100vw", "0vw", "0vw", "100vw"]);
  const s5Line4Op = useTransform(scrollYProgress, [1950/2500, 2100/2500, 2400/2500, 2500/2500], [0, 1, 1, 0]);

  return (
    <div ref={containerRef} className="cinematic-wrapper" style={{ height: "2500vh" }}>
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
                  style={{ y: card1Y, x: card1X }}
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
                  style={{ y: card4Y, x: card4X }}
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

          <motion.svg 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, mixBlendMode: 'screen', opacity: linesOpacity, pointerEvents: 'none' }}
          >
            <line x1="0%" y1="0%" x2="80%" y2="23.5%" stroke="rgba(255, 0, 0, 0.5)" strokeWidth="1" />
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
            <motion.div className="gallery-item img-1" style={{ opacity: img1Op, y: img1Y }}>
              <EditableImage sectionKey="dept_1" label="Image 1" currentImage={imagesMap['dept_1']} onUploadSuccess={fetchSectionImages}>
                Image 1
              </EditableImage>
            </motion.div>
            <motion.div className="gallery-item img-2" style={{ opacity: img2Op, y: img2Y }}>
              <EditableImage sectionKey="dept_2" label="Image 2" currentImage={imagesMap['dept_2']} onUploadSuccess={fetchSectionImages}>
                Image 2
              </EditableImage>
            </motion.div>
            <motion.div className="gallery-item img-3" style={{ opacity: img3Op, y: img3Y }}>
              <EditableImage sectionKey="dept_3" label="Image 3" currentImage={imagesMap['dept_3']} onUploadSuccess={fetchSectionImages}>
                Image 3
              </EditableImage>
            </motion.div>
            
            <motion.div className="dept-content" style={{ opacity: deptTextOp, x: deptTextX }}>
              <h2 className="dept-title">
                Our <br />
                <span>Department</span>
              </h2>
              <p className="dept-desc">
                MechaPEF continues to bridge knowledge, ideas, and people – fostering a culture of innovation and belonging within the department.
              </p>
              <Link to="/gallery" className="gallery-btn" style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>
                View Gallery -{'>'}
              </Link>
            </motion.div>

            {/* Row 3 */}
            <motion.div className="gallery-item img-4" style={{ opacity: img4Op, y: img4Y }}>
              <EditableImage sectionKey="dept_4" label="Image 4" currentImage={imagesMap['dept_4']} onUploadSuccess={fetchSectionImages}>
                Image 4
              </EditableImage>
            </motion.div>
            <motion.div className="gallery-item img-5" style={{ opacity: img5Op, y: img5Y }}>
              <EditableImage sectionKey="dept_5" label="Image 5" currentImage={imagesMap['dept_5']} onUploadSuccess={fetchSectionImages}>
                Image 5
              </EditableImage>
            </motion.div>
            <motion.div className="gallery-item img-6" style={{ opacity: img6Op, y: img6Y }}>
              <EditableImage sectionKey="dept_6" label="Image 6" currentImage={imagesMap['dept_6']} onUploadSuccess={fetchSectionImages}>
                Image 6
              </EditableImage>
            </motion.div>
            <motion.div className="gallery-item img-7" style={{ opacity: img7Op, y: img7Y }}>
              <EditableImage sectionKey="dept_7" label="Image 7" currentImage={imagesMap['dept_7']} onUploadSuccess={fetchSectionImages}>
                Image 7
              </EditableImage>
            </motion.div>
          </div>
        </motion.div>

        {/* ================= SCENE 5: JOIN US ================= */}
        <motion.div 
          className="scene-container scene-5-light" 
          style={{ opacity: scene5Opacity, pointerEvents: scene5PointerEvents }}
        >
          {/* Background Strips at 155 degrees */}
          <motion.div className="s5-bg-strips" style={{ x: bg5X, opacity: bg5Opacity }}>
            <div className="s5-strip s5-strip-1"></div>
            <div className="s5-strip s5-strip-2"></div>
            <div className="s5-strip s5-strip-3"></div>
          </motion.div>

          <div className="s5-layout">
            <motion.div className="s5-bot-container" style={{ x: botX, opacity: botOpacity }}>
              <img src={assets.joinBot} alt="Join Us Bot" className="s5-bot" />
            </motion.div>

            <div className="s5-content">
              <motion.h4 className="s5-subtitle" style={{ x: s5Line1X, opacity: s5Line1Op }}>JOIN THE MOVEMENT</motion.h4>
              <motion.h1 className="s5-title" style={{ x: s5Line2X, opacity: s5Line2Op }}>
                Ready to Be a Part<br />of <span className="s5-highlight">MechaPEF?</span>
              </motion.h1>
              <motion.p className="s5-desc" style={{ x: s5Line3X, opacity: s5Line3Op }}>
                Connect with 1000+ students, attend exclusive events, and shape the future of mechanical engineering.
              </motion.p>
              
              <motion.div className="s5-buttons" style={{ x: s5Line4X, opacity: s5Line4Op }}>
                <button className="btn-contact-us" onClick={() => navigate('/register')}>JOIN NOW &rarr;</button>
                <button className="btn-learn-more">LEARN MORE</button>
              </motion.div>

              <motion.div className="s5-social-grid" style={{ x: s5Line4X, opacity: s5Line4Op }}>
                <div className="social-icon"><FaEnvelope /></div>
                <div className="social-icon"><FaInstagram /></div>
                <div className="social-icon"><FaLinkedinIn /></div>
                <div className="social-icon"><FaFacebookF /></div>
                <div className="social-icon"><FaTwitter /></div>
              </motion.div>
            </div>
          </div>
        </motion.div>
        
      </div>
    </div>
  );
};

export default CinematicHero;
