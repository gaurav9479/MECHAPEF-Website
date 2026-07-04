import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaUsers, FaCalendarAlt, FaTrophy } from "react-icons/fa";
import wheelImg from "../../assets/wheel.png";
import RedStrips from '../RedInclinedStrips/RedInclinedStrips';
import EditableImage from '../EditableImage/EditableImage';
import api from '../../services/api';
import '../CinematicHero/CinematicHero.css';

const SpiritOfMech = () => {
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

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Original scroll ranged from 540 to 1700 (distance = 1160). Height = 1260vh.
  const R = (val) => (val - 540) / 1160;

  // --- SCENE 3: Spirit of Mechanical Engineering ---
  const bg3Opacity = useTransform(scrollYProgress, [R(540), R(560), R(765), R(855)], [1, 1, 1, 1]);
  const bg3Y = useTransform(scrollYProgress, [R(540), R(560)], ["100vh", "0vh"]);
  const bg3X = useTransform(scrollYProgress, [R(540), R(560)], ["50vw", "0vw"]);

  const wheelOpacity = useTransform(scrollYProgress, [R(545), R(575), R(855), R(900)], [0, 1, 1, 0]);
  const wheelX = useTransform(scrollYProgress, [R(545), R(575), R(765), R(855)], ["-80vw", "0vw", "0vw", "50vw"]);
  const wheelY = useTransform(scrollYProgress, [R(545), R(575), R(765), R(855)], ["-50vh", "0vh", "0vh", "20vh"]);
  const wheelScale = useTransform(scrollYProgress, [R(545), R(575), R(765), R(855)], [0.05, 1, 1, 4]);

  const spiritContentOpacity = useTransform(scrollYProgress, [R(560), R(600), R(765), R(855)], [0, 1, 1, 0]);
  
  const title1X = useTransform(scrollYProgress, [R(560), R(580), R(600), R(765), R(855)], ["-100vw", "5vw", "0vw", "0vw", "-100vw"]);
  const title2X = useTransform(scrollYProgress, [R(560), R(600), R(765), R(855)], ["100vw", "0vw", "0vw", "100vw"]);
  const descY = useTransform(scrollYProgress, [R(560), R(600), R(765), R(855)], ["10vh", "0vh", "0vh", "10vh"]);

  const s3Card1Y = useTransform(scrollYProgress, [R(560), R(590), R(765), R(855)], ["20vh", "0vh", "0vh", "20vh"]);
  const s3Card1Op = useTransform(scrollYProgress, [R(560), R(590), R(765), R(855)], [0, 1, 1, 0]);
  
  const s3Card2Y = useTransform(scrollYProgress, [R(569), R(596), R(765), R(855)], ["20vh", "0vh", "0vh", "20vh"]);
  const s3Card2Op = useTransform(scrollYProgress, [R(569), R(596), R(765), R(855)], [0, 1, 1, 0]);
  
  const s3Card3Y = useTransform(scrollYProgress, [R(578), R(605), R(765), R(855)], ["20vh", "0vh", "0vh", "20vh"]);
  const s3Card3Op = useTransform(scrollYProgress, [R(578), R(605), R(765), R(855)], [0, 1, 1, 0]);

  const linesOpacity = useTransform(scrollYProgress, [R(560), R(600), R(765), R(855)], [0, 1, 1, 0]);
  const scene3PointerEvents = useTransform(scrollYProgress, (val) => (val >= R(560) && val <= R(855)) ? "auto" : "none");

  return (
    <div ref={containerRef} className="cinematic-wrapper" style={{ height: "900vh" }}>
      <div className="cinematic-camera">

        {/* ================= SCENE 3 BACKGROUND ================= */}
        <motion.div className="cinematic-bg-layer" style={{ opacity: bg3Opacity, x: bg3X, y: bg3Y }}>
          <RedStrips index={0} shiftX="-20%" />
          <motion.div className="spirit-bg-rays" style={{ opacity: spiritContentOpacity }}></motion.div>
        </motion.div>

        {/* ================= SCENE 3 CONTENT ================= */}
        <motion.div className="cinematic-scene" style={{ pointerEvents: scene3PointerEvents }}>
          <motion.svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, mixBlendMode: 'screen', opacity: linesOpacity, pointerEvents: 'none' }}>
            <line x1="0%" y1="0%" x2="80%" y2="23.5%" stroke="rgba(255, 0, 0, 0.5)" strokeWidth="1" />
            <line x1="0%" y1="0%" x2="90%" y2="40%" stroke="rgba(255, 0, 0, 0.8)" strokeWidth="2" />
            <line x1="0%" y1="0%" x2="85%" y2="60%" stroke="rgba(255, 0, 0, 0.5)" strokeWidth="1.5" />
            <line x1="0%" y1="0%" x2="70%" y2="80%" stroke="rgba(255, 0, 0, 0.3)" strokeWidth="1" />
            <line x1="0%" y1="0%" x2="50%" y2="100%" stroke="rgba(255, 0, 0, 0.2)" strokeWidth="0.5" />
          </motion.svg>

          <div className="spirit-content">
            <div className="spirit-left">
              <div className="spirit-header">
                <motion.p className="spirit-subtitle" style={{ y: descY, opacity: spiritContentOpacity }}>WHAT WE STAND FOR</motion.p>
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
              <motion.div className="wheel-glow" style={{ opacity: wheelOpacity }}></motion.div>
              <motion.div style={{ x: wheelX, y: wheelY, scale: wheelScale, opacity: wheelOpacity, width: '100%', display: 'flex', justifyContent: 'center' }}>
                <img src={wheelImg} alt="Mechanical Wheel" className="spirit-wheel" style={{ transform: 'scaleX(-1)' }} />
              </motion.div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default SpiritOfMech;
