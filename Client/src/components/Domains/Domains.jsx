import { motion } from "framer-motion";
import "./Domains.css";

const Domains = () => {

  const domains = [
    "Robotics",
    "CAD",
    "Drone Tech",
    "AI",
    "Web Development",
    "CP"
  ];

  return (
    <section className="domains">

      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5 }}
      >
        Domains
      </motion.h2>

      <div className="domain-grid">

        {
          domains.map((item,index)=>(
            <motion.div
              className="domain-card"
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              {item}
            </motion.div>
          ))
        }

      </div>

    </section>
  );
};

export default Domains; 