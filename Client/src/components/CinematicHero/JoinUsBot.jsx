import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { assets } from "../../assets/assets";
import { FaEnvelope, FaInstagram, FaLinkedinIn, FaFacebookF, FaTwitter, FaYoutube } from "react-icons/fa";
import { scrollToId } from "../../utils/scroll";
import MagneticButton from "../MagneticButton/MagneticButton";
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
  const bg5Opacity = useTransform(scrollYProgress, [0, 0.2, 1], [1, 1, 1]);

  const botX = useTransform(scrollYProgress, [0, 0.5, 1], ["-50vw", "0vw", "0vw"]);
  const botY = useTransform(scrollYProgress, [0, 0.5, 1], ["50vh", "0vh", "0vh"]);
  const botScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.5, 1, 1]);
  const botRotate = useTransform(scrollYProgress, [0, 0.5, 1], [-20, 0, 0]);
  const botOpacity = useTransform(scrollYProgress, [0, 0.4, 1], [0, 1, 1]);

  const s5Line1Y = useTransform(scrollYProgress, [0, 0.3, 1], ["-50vh", "0vh", "0vh"]);
  const s5Line1Op = useTransform(scrollYProgress, [0, 0.3, 1], [0, 1, 1]);

  const s5Line2X = useTransform(scrollYProgress, [0.1, 0.4, 1], ["50vw", "0vw", "0vw"]);
  const s5Line2Scale = useTransform(scrollYProgress, [0.1, 0.4, 1], [1.5, 1, 1]);
  const s5Line2Op = useTransform(scrollYProgress, [0.1, 0.4, 1], [0, 1, 1]);

  const s5Line3Y = useTransform(scrollYProgress, [0.2, 0.5, 1], ["50vh", "0vh", "0vh"]);
  const s5Line3Op = useTransform(scrollYProgress, [0.2, 0.5, 1], [0, 1, 1]);

  const s5Line4Y = useTransform(scrollYProgress, [0.3, 0.6, 1], ["50vh", "0vh", "0vh"]);
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
            <motion.div className="s5-bot-container" style={{ x: botX, y: botY, scale: botScale, rotate: botRotate, opacity: botOpacity, transformOrigin: "bottom left" }}>
              <img src={assets.joinBot} alt="Join Us Bot" className="s5-bot" />
            </motion.div>

            <div className="s5-content">
              <motion.h4 className="s5-subtitle" style={{ y: s5Line1Y, opacity: s5Line1Op }}>JOIN THE MOVEMENT</motion.h4>
              <motion.h1 className="s5-title" style={{ x: s5Line2X, scale: s5Line2Scale, opacity: s5Line2Op, transformOrigin: "right center" }}>
                Ready to Be a Part<br />of <span className="s5-highlight">MechaPEF?</span>
              </motion.h1>
              <motion.p className="s5-desc" style={{ y: s5Line3Y, opacity: s5Line3Op }}>
                Connect with 1000+ students, attend exclusive events, and shape the future of mechanical engineering.
              </motion.p>
              
              <motion.div className="s5-buttons" style={{ y: s5Line4Y, opacity: s5Line4Op }}>
                <div className="ch-join-actions">
                  <MagneticButton className="btn-contact-us" onClick={() => navigate('/login')}>JOIN NOW &rarr;</MagneticButton>
                  <MagneticButton className="btn-learn-more" onClick={() => scrollToId('about-us')}>LEARN MORE</MagneticButton>
                </div>
              </motion.div>

              <motion.div className="s5-social-grid" style={{ y: s5Line4Y, opacity: s5Line4Op }}>
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
