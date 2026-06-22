import { motion } from "framer-motion";
import "./Stats.css";

const Stats = () => {

  const data = [
    ["100+","Members"],
    ["25+","Projects"],
    ["15+","Events"],
    ["5+","Years"]
  ];

  return (
    <section className="stats">

      {
        data.map((item,index)=>(
          <motion.div 
            className="card" 
            key={index}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: index * 0.15 }}
          >
            <h1>{item[0]}</h1>
            <p>{item[1]}</p>
          </motion.div>
        ))
      }

    </section>
  );
};

export default Stats;