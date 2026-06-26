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

  // --- SCENE 4: Our Department ---
  const scene4Opacity = useTransform(scrollYProgress, [R(900), R(960), R(1636), R(1700)], [0, 1, 1, 0]);
  const scene4PointerEvents = useTransform(scrollYProgress, (val) => val >= R(900) && val <= R(1700) ? "auto" : "none");

  const bg4Opacity = useTransform(scrollYProgress, [R(900), R(960), R(1636), R(1700)], [0, 1, 1, 0]);
  const bg4X = useTransform(scrollYProgress, [R(900), R(960), R(1636), R(1700)], ["-100vw", "0vw", "0vw", "-100vw"]);

  const deptTextOp = useTransform(scrollYProgress, [R(928), R(1008), R(1620), R(1684)], [0, 1, 1, 0]);
  const deptTextX = useTransform(scrollYProgress, [R(928), R(1008), R(1620), R(1684)], ["100vw", "0vw", "0vw", "100vw"]);

  const img1Op = useTransform(scrollYProgress, [R(976), R(1056), R(1588), R(1652)], [0, 1, 1, 0]);
  const img1Y = useTransform(scrollYProgress, [R(976), R(1056), R(1588), R(1652)], ["100vh", "0vh", "0vh", "100vh"]);

  const img2Op = useTransform(scrollYProgress, [R(1024), R(1104), R(1556), R(1620)], [0, 1, 1, 0]);
  const img2Y = useTransform(scrollYProgress, [R(1024), R(1104), R(1556), R(1620)], ["-100vh", "0vh", "0vh", "-100vh"]);
  const img3Op = useTransform(scrollYProgress, [R(1072), R(1152), R(1524), R(1588)], [0, 1, 1, 0]);
  const img3Y = useTransform(scrollYProgress, [R(1072), R(1152), R(1524), R(1588)], ["100vh", "0vh", "0vh", "100vh"]);

  const img4Op = useTransform(scrollYProgress, [R(1120), R(1200), R(1492), R(1556)], [0, 1, 1, 0]);
  const img4Y = useTransform(scrollYProgress, [R(1120), R(1200), R(1492), R(1556)], ["100vh", "0vh", "0vh", "100vh"]);
  
  const img5Op = useTransform(scrollYProgress, [R(1152), R(1232), R(1460), R(1524)], [0, 1, 1, 0]);
  const img5Y = useTransform(scrollYProgress, [R(1152), R(1232), R(1460), R(1524)], ["100vh", "0vh", "0vh", "100vh"]);
  
  const img6Op = useTransform(scrollYProgress, [R(1184), R(1264), R(1428), R(1492)], [0, 1, 1, 0]);
  const img6Y = useTransform(scrollYProgress, [R(1184), R(1264), R(1428), R(1492)], ["100vh", "0vh", "0vh", "100vh"]);
  
  const img7Op = useTransform(scrollYProgress, [R(1216), R(1300), R(1400), R(1460)], [0, 1, 1, 0]);
  const img7Y = useTransform(scrollYProgress, [R(1216), R(1300), R(1400), R(1460)], ["100vh", "0vh", "0vh", "100vh"]);

  return (
    <div ref={containerRef} className="cinematic-wrapper" style={{ height: "1260vh" }}>
      <div className="cinematic-camera">

        {/* ================= SCENE 3 BACKGROUND ================= */}
        <motion.div className="cinematic-bg-layer" style={{ opacity: bg3Opacity, x: bg3X, y: bg3Y }}>
          <RedStrips index={0} shiftX="-20%" />
          <motion.div className="spirit-bg-rays" style={{ opacity: spiritContentOpacity }}></motion.div>
        </motion.div>

        {/* ================= SCENE 4 BACKGROUND ================= */}
        <motion.div className="cinematic-bg-layer" style={{ opacity: bg4Opacity, x: bg4X }}>
          <RedStrips index={0} shiftX="60%" />
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

        {/* ================= SCENE 4 CONTENT ================= */}
        <motion.div className="cinematic-scene department-scene" style={{ pointerEvents: scene4PointerEvents, opacity: scene4Opacity }}>
          <div className="dept-container">
            <motion.div className="gallery-item img-1" style={{ opacity: img1Op, y: img1Y }}>
              <EditableImage sectionKey="dept_1" label="Image 1" currentImage={imagesMap['dept_1']} onUploadSuccess={fetchSectionImages}>Image 1</EditableImage>
            </motion.div>
            <motion.div className="gallery-item img-2" style={{ opacity: img2Op, y: img2Y }}>
              <EditableImage sectionKey="dept_2" label="Image 2" currentImage={imagesMap['dept_2']} onUploadSuccess={fetchSectionImages}>Image 2</EditableImage>
            </motion.div>
            <motion.div className="gallery-item img-3" style={{ opacity: img3Op, y: img3Y }}>
              <EditableImage sectionKey="dept_3" label="Image 3" currentImage={imagesMap['dept_3']} onUploadSuccess={fetchSectionImages}>Image 3</EditableImage>
            </motion.div>
            
            <motion.div className="dept-content" style={{ opacity: deptTextOp, x: deptTextX }}>
              <h2 className="dept-title">Our <br /><span>Department</span></h2>
              <p className="dept-desc">MechaPEF continues to bridge knowledge, ideas, and people – fostering a culture of innovation and belonging within the department.</p>
              <Link to="/gallery" className="gallery-btn" style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>
                View Gallery -{'>'}
              </Link>
            </motion.div>

            <motion.div className="gallery-item img-4" style={{ opacity: img4Op, y: img4Y }}>
              <EditableImage sectionKey="dept_4" label="Image 4" currentImage={imagesMap['dept_4']} onUploadSuccess={fetchSectionImages}>Image 4</EditableImage>
            </motion.div>
            <motion.div className="gallery-item img-5" style={{ opacity: img5Op, y: img5Y }}>
              <EditableImage sectionKey="dept_5" label="Image 5" currentImage={imagesMap['dept_5']} onUploadSuccess={fetchSectionImages}>Image 5</EditableImage>
            </motion.div>
            <motion.div className="gallery-item img-6" style={{ opacity: img6Op, y: img6Y }}>
              <EditableImage sectionKey="dept_6" label="Image 6" currentImage={imagesMap['dept_6']} onUploadSuccess={fetchSectionImages}>Image 6</EditableImage>
            </motion.div>
            <motion.div className="gallery-item img-7" style={{ opacity: img7Op, y: img7Y }}>
              <EditableImage sectionKey="dept_7" label="Image 7" currentImage={imagesMap['dept_7']} onUploadSuccess={fetchSectionImages}>Image 7</EditableImage>
            </motion.div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default SpiritOfMech;
