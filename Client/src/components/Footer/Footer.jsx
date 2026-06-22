import { motion } from "framer-motion";
import "./Footer.css";

const Footer = () => {
  return (
    <motion.footer 
      className="footer"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.8 }}
      transition={{ duration: 0.5 }}
    >
      © 2026 MECHAPEF
    </motion.footer>
  );
};

export default Footer;