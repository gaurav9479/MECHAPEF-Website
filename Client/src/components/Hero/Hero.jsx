import { motion } from "framer-motion";
import { assets } from "../../assets/assets";
import "./Hero.css";

const Hero = () => {
  return (
    <section className="hero">

      <motion.div
        className="hero-left"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
      >
        <h1>MECHAPEF</h1>
        <p>
          Engineering Beyond Limits
        </p>

        <button>
          Explore
        </button>
      </motion.div>

      <motion.img
        src={assets.heroBot}
        className="hero-bot"
        initial={{ x: 200 }}
        animate={{ x: 0 }}
      />
    </section>
  );
};

export default Hero;