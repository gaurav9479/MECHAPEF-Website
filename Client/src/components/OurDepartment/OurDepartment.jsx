import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { apiGetCached } from '../../utils/apiCache';
import EditableImage from '../EditableImage/EditableImage';
import './OurDepartment.css';

const OurDepartment = () => {
  const sectionRef = useRef(null);

  const [imagesMap, setImagesMap] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const fetchSectionImages = () => {
    apiGetCached('/upload/sections?device=desktop', (res) => {
      const imgMap = {};
      if (res.data?.images || res.data?.data?.images) {
        const images = res.data.images || res.data.data.images;
        images.forEach(img => {
          imgMap[img.sectionKey] = img.imageURL;
        });
      }
      setImagesMap(imgMap);
    }, { cacheDuration: 0 }).catch(error => {
      console.error("Failed to load section images:", error);
    });
  };

  useEffect(() => {
    fetchSectionImages();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Framer Motion Scroll Setup
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"]
  });

  // Apply a spring to create a smooth "scrub" effect (like GSAP scrub: 1)
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 20,
    mass: 1.2
  });

  // Parallax for the 3 columns (Start rising quickly after sticking, at 0.05)
  const y1 = useTransform(smoothProgress, [0.05, 0.80], ["100vh", "-100%"]);
  const y2 = useTransform(smoothProgress, [0.05, 0.80], ["120vh", "-120%"]);
  const y3 = useTransform(smoothProgress, [0.05, 0.80], ["110vh", "-110%"]);

  // Mobile Parallax (Single column)
  const mobileY = useTransform(smoothProgress, [0.05, 0.80], ["100vh", "-100%"]);

  // Footer arrives on the 7th scroll (0.75 to 0.875)
  const footerY = useTransform(smoothProgress, [0.75, 0.875], ["100vh", "0vh"]);
  const footerOpacity = useTransform(smoothProgress, [0.75, 0.80], [0, 1]);

  const imagesKeys = ['dept_1', 'dept_2', 'dept_3', 'dept_4', 'dept_5', 'dept_6', 'dept_7', 'dept_8'];

  return (
    <section ref={sectionRef} className="our-dept-gsap-wrapper our-dept-section" style={{ height: '800vh', position: 'relative' }}>
      
      {/* Sticky Container for Parallax & Footer */}
      <div className="our-dept-sticky-container">
        
        {/* Static Background Text (Now inside sticky container so it doesn't scroll away!) */}
        <div className="our-dept-bg-wrapper">
          <div className="our-dept-bg-text">
            <h2 className="typo-our">OUR</h2>
            <h2 className="typo-dept">DEPARTMENT</h2>
          </div>
        </div>
        
        {isMobile ? (
          <motion.div style={{ y: mobileY }} className="our-dept-mobile-col">
            {imagesKeys.map((key, index) => (
              <div key={index} className="dept-gallery-item">
                <EditableImage 
                  sectionKey={key}
                  currentImage={imagesMap[key]}
                  onUploadSuccess={fetchSectionImages}
                  label={`Image ${index + 1}`}
                />
              </div>
            ))}
          </motion.div>
        ) : (
          <div className="our-dept-gallery-grid">
            {/* Column 1 */}
            <motion.div style={{ y: y1 }} className="our-dept-col col-1">
              <div className="dept-gallery-item">
                <EditableImage sectionKey="dept_1" label="Image 1" currentImage={imagesMap['dept_1']} onUploadSuccess={fetchSectionImages} />
              </div>
              <div className="dept-gallery-item">
                <EditableImage sectionKey="dept_4" label="Image 4" currentImage={imagesMap['dept_4']} onUploadSuccess={fetchSectionImages} />
              </div>
            </motion.div>

            {/* Column 2 */}
            <motion.div style={{ y: y2 }} className="our-dept-col col-2">
              <div className="dept-gallery-item">
                <EditableImage sectionKey="dept_2" label="Image 2" currentImage={imagesMap['dept_2']} onUploadSuccess={fetchSectionImages} />
              </div>
              <div className="dept-gallery-item">
                <EditableImage sectionKey="dept_5" label="Image 5" currentImage={imagesMap['dept_5']} onUploadSuccess={fetchSectionImages} />
              </div>
              <div className="dept-gallery-item">
                <EditableImage sectionKey="dept_7" label="Image 7" currentImage={imagesMap['dept_7']} onUploadSuccess={fetchSectionImages} />
              </div>
            </motion.div>

            {/* Column 3 */}
            <motion.div style={{ y: y3 }} className="our-dept-col col-3">
              <div className="dept-gallery-item">
                <EditableImage sectionKey="dept_3" label="Image 3" currentImage={imagesMap['dept_3']} onUploadSuccess={fetchSectionImages} />
              </div>
              <div className="dept-gallery-item">
                <EditableImage sectionKey="dept_6" label="Image 6" currentImage={imagesMap['dept_6']} onUploadSuccess={fetchSectionImages} />
              </div>
              <div className="dept-gallery-item">
                <EditableImage sectionKey="dept_8" label="Image 8" currentImage={imagesMap['dept_8']} onUploadSuccess={fetchSectionImages} />
              </div>
            </motion.div>
          </div>
        )}

        {/* Footer Text that comes up in between OUR and DEPARTMENT */}
        <motion.div 
          style={{ y: footerY, x: "-50%", opacity: footerOpacity }} 
          className="our-dept-footer-quote"
        >
          <p>
            MechaPEF continues to bridge knowledge, ideas, and people – fostering a culture of innovation and belonging within the department.
          </p>
          <Link to="/gallery" className="dept-btn-red">
            View Gallery -{'>'}
          </Link>
        </motion.div>

      </div>
    </section>
  );
};

export default OurDepartment;
