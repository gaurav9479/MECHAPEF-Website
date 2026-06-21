import { assets } from "../../assets/assets";
import "./Join.css";

const Join = () => {
  return (
    <section className="join">

      <img
        src={assets.joinBot}
        className="join-bot"
      />

      <div>
        <h1>
          Ready To Join
          MechaPEF?
        </h1>

        <button>
          Apply Now
        </button>
      </div>

    </section>
  );
};

export default Join;