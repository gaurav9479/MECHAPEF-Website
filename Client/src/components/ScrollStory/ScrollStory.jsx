import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import RedStrips from "../RedInclinedStrips/RedInclinedStrips";
import "./ScrollStory.css";
import wheelImg from "../../assets/wheel.png";
import { FaCalendarAlt, FaUsers, FaTrophy } from "react-icons/fa";

const ScrollStory = () => {
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const stripsOpacity = useTransform(scrollYProgress, [0.0, 0.10], [0, 1]);
  const stripsY = useTransform(scrollYProgress, [0.0, 0.15], [1000, 0]);
  const stripsX = useTransform(scrollYProgress, [0.0, 0.15], [466, 0]); // 1000 * tan(25) = ~466


  const wheelOpacity = useTransform(scrollYProgress, [0.05, 0.15], [0, 1]);
  const wheelX = useTransform(scrollYProgress, [0.05, 0.20], [-1500, 0]);
  const wheelY = useTransform(scrollYProgress, [0.05, 0.20], [-800, 0]);
  const wheelScale = useTransform(scrollYProgress, [0.05, 0.20], [0.2, 1]);

  const contentOpacity = useTransform(scrollYProgress, [0.15, 0.25], [0, 1]);
  const contentX = useTransform(scrollYProgress, [0.15, 0.30], [-500, 0]);
  const pointerEvents = useTransform(scrollYProgress, (val) => val > 0.25 ? "auto" : "none");

  return (
    <div ref={containerRef} className="scroll-story-wrapper">
      <div className="scroll-story-camera">
        

        <motion.div 
          className="spirit-bg-layer"
          style={{ x: stripsX, y: stripsY, opacity: stripsOpacity }}
        >
          <RedStrips index={0} shiftX="-20%" />
        </motion.div>


        <motion.div 
          className="spirit-scene"
          style={{ pointerEvents }}
        >

          <motion.div 
            className="spirit-bg-rays"
            style={{ opacity: contentOpacity }}
          ></motion.div>

          <div className="spirit-content">
            
            <motion.div 
              className="spirit-left"
              style={{ x: contentX, opacity: contentOpacity }}
            >
              <div className="spirit-header">
                <p className="spirit-subtitle">WHAT WE STAND FOR</p>
                <h2 className="spirit-title">
                  Celebrating the Spirit of <br/>
                  <span className="text-red">Mechanical Engineering</span>
                </h2>
                <p className="spirit-desc">
                  MechaPEF continues to bridge knowledge, ideas, and people – fostering a culture of innovation and belonging within the department.
                </p>
              </div>

              <div className="spirit-cards-container">
                <div className="spirit-card">
                  <div className="card-icon"><FaCalendarAlt /></div>
                  <h3>Workshops <br/>& Meets</h3>
                  <p>From professional development to alumni interactions, we create opportunities for learning and growth.</p>
                </div>

                <div className="spirit-card">
                  <div className="card-icon"><FaUsers /></div>
                  <h3>Collaborative <br/>Community</h3>
                  <p>A vibrant network united by curiosity, teamwork, and the spirit of mechanical engineering.</p>
                </div>

                <div className="spirit-card">
                  <div className="card-icon"><FaTrophy /></div>
                  <h3>Legacy of <br/>Learning</h3>
                  <p>Continuing a tradition of knowledge sharing, mentorship, and departmental unity across batches.</p>
                </div>
              </div>
            </motion.div>

            <div className="spirit-right">
              <motion.div 
                className="wheel-glow"
                style={{ opacity: wheelOpacity }}
              ></motion.div>

              <motion.img 
                src={wheelImg} 
                alt="Mechanical Wheel" 
                className="spirit-wheel"
                style={{ x: wheelX, y: wheelY, scale: wheelScale, opacity: wheelOpacity }}
              />
            </div>
            
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default ScrollStory;
