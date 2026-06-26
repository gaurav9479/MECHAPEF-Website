import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { assets } from "../../assets/assets";
import { FaArrowRight, FaUsers } from "react-icons/fa";
import RedStrips from '../RedInclinedStrips/RedInclinedStrips';
import '../CinematicHero/CinematicHero.css';
import '../Hero/Hero.css';

const HeroIntro = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const textX = useTransform(scrollYProgress, [0, 1], ["0vw", "-100vw"]);
  const imgX = useTransform(scrollYProgress, [0, 1], ["0vw", "100vw"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const pointerEvents = useTransform(scrollYProgress, (val) => val >= 0.9 ? "none" : "auto");

  return (
    <div ref={containerRef} className="cinematic-wrapper" style={{ height: "200vh" }}>
      <div className="cinematic-camera">
        
        <motion.div className="cinematic-bg-layer" style={{ opacity }}>
          <RedStrips index={0} shiftX="-10%" />
          <div className="fade-right"></div>
        </motion.div>

        <motion.div className="cinematic-scene" style={{ opacity, pointerEvents }}>
          <motion.div className="cinematic-left" style={{ x: textX }}>
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
                <button className="primary-btn" onClick={() => navigate('/events')}>
                  EXPLORE MORE <FaArrowRight />
                </button>
                <button className="secondary-btn" onClick={() => document.getElementById('mh-team')?.scrollIntoView({ behavior: 'smooth' })}>
                  MEET THE TEAM <FaUsers />
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div className="cinematic-right" style={{ x: imgX }}>
             <img src={assets.heroBot} className="hero-bot" alt="MechaPEF Bot" />
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
};

export default HeroIntro;
