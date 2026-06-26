import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { assets } from "../../assets/assets";
import { FaEnvelope, FaInstagram, FaLinkedinIn, FaFacebookF, FaTwitter } from "react-icons/fa";
import '../CinematicHero/CinematicHero.css';

const JoinUsBot = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "end end"],
  });

  // Simplified mapping for 300vh height
  const scene5Opacity = useTransform(scrollYProgress, [0, 0.1, 1], [0, 1, 1]);
  const pointerEvents = useTransform(scrollYProgress, (val) => "auto");
  
  const bg5X = useTransform(scrollYProgress, [0, 0.5, 1], ["-10vw", "0vw", "0vw"]);
  const bg5Opacity = useTransform(scrollYProgress, [0, 0.2, 1], [0, 1, 1]);

  const botX = useTransform(scrollYProgress, [0, 0.5, 1], ["-100vw", "0vw", "0vw"]);
  const botOpacity = useTransform(scrollYProgress, [0, 0.4, 1], [0, 1, 1]);

  const s5Line1X = useTransform(scrollYProgress, [0, 0.3, 1], ["100vw", "0vw", "0vw"]);
  const s5Line1Op = useTransform(scrollYProgress, [0, 0.3, 1], [0, 1, 1]);

  const s5Line2X = useTransform(scrollYProgress, [0.1, 0.4, 1], ["100vw", "0vw", "0vw"]);
  const s5Line2Op = useTransform(scrollYProgress, [0.1, 0.4, 1], [0, 1, 1]);

  const s5Line3X = useTransform(scrollYProgress, [0.2, 0.5, 1], ["100vw", "0vw", "0vw"]);
  const s5Line3Op = useTransform(scrollYProgress, [0.2, 0.5, 1], [0, 1, 1]);

  const s5Line4X = useTransform(scrollYProgress, [0.3, 0.6, 1], ["100vw", "0vw", "0vw"]);
  const s5Line4Op = useTransform(scrollYProgress, [0.3, 0.6, 1], [0, 1, 1]);

  return (
    <div ref={containerRef} className="cinematic-wrapper" style={{ height: "300vh" }}>
      <div className="cinematic-camera">

        <motion.div 
          className="scene-container scene-5-light" 
          style={{ opacity: scene5Opacity, pointerEvents }}
        >
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

export default JoinUsBot;
