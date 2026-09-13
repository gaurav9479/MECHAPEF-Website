import { assets } from "../../assets/assets";

import RedStrips from "../RedInclinedStrips/RedInclinedStrips";
import "./About.css";

const About = () => {
  return (
    <section className="about">

      <RedStrips index={0} shiftX = "52%" />

      {/* We wrap your content in a div to easily control the z-index */}
      <div className="about-content">
        <div className="about-text">
          <h2>Autonomous Systems</h2>
          <p>
            Building drones, robots and intelligent machines.
          </p>
        </div>

        <img
          src={assets.drone}
          className="drone"
          alt="Autonomous Drone"
        />
      </div>
    </section>
  );
};

export default About;