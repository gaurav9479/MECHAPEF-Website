import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { assets } from "../../assets/assets";
import "./Join.css";

const Join = () => {
  const navigate = useNavigate();

  return (
    <section className="join">

      <motion.img
        src={assets.joinBot}
        className="join-bot"
        initial={{ opacity: 0, x: -100 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />

      <motion.div
        initial={{ opacity: 0, x: 100 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
      >
        <h1>
          Ready To Join<br />
          MechaPEF?
        </h1>

        <button onClick={() => navigate('/register')}>
          Apply Now
        </button>
      </motion.div>

    </section>
  );
};

export default Join;