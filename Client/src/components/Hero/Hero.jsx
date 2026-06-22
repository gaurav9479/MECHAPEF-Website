import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { assets } from "../../assets/assets";
import { FaArrowRight, FaUsers } from "react-icons/fa";
import RedStrips from "../RedInclinedStrips/RedInclinedStrips"; 
import "./Hero.css";

const Hero = () => {
  const containerRef = useRef(null);

  const { scrollYProgress, scrollY } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const textX = useTransform(scrollYProgress, [0, 1], [0, -800]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const imgX = useTransform(scrollYProgress, [0, 1], [0, 800]);
  const imgOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  // Fades from 1 to 0 instantly (between 0px and 50px of scrolling)
  const fastFadeOpacity = useTransform(scrollY, [0, 100], [1, 0]);

  return (
    <div ref={containerRef} className="hero-scroll-wrapper">
      <section className="hero">
        
        <RedStrips index={0} />
        
        <motion.div
          className="hero-left"
          style={{ x: textX, opacity: textOpacity }}
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
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

          <div className="hero-features">
            <span>&bull; INSPIRING GROWTH</span>
            <span>&bull; INNOVATION</span>
            <span>&bull; TOGETHERNESS</span>
          </div>

          <div className="hero-buttons">
            <button className="primary-btn">
              EXPLORE EVENTS <FaArrowRight />
            </button>
            <button className="secondary-btn">
              MEET THE TEAM <FaUsers />
            </button>
          </div>
        </motion.div>

        <motion.img
          src={assets.heroBot}
          className="hero-bot"
          style={{ x: imgX, opacity: imgOpacity, originX: 0.50, originY: 0.50 }}
          initial={{ x: 200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        />
      </section>
    </div>
  );
};

export default Hero;