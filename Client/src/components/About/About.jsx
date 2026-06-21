import { assets } from "../../assets/assets";
import "./About.css";

const About = () => {
  return (
    <section className="about">

      <div className="about-text">
        <h2>Autonomous Systems</h2>

        <p>
          Building drones, robots and
          intelligent machines.
        </p>
      </div>

      <img
        src={assets.drone}
        className="drone"
      />
    </section>
  );
};

export default About;