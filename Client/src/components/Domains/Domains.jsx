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

      <h2>Domains</h2>

      <div className="domain-grid">

        {
          domains.map((item,index)=>(
            <div
              className="domain-card"
              key={index}
            >
              {item}
            </div>
          ))
        }

      </div>

    </section>
  );
};

export default Domains; 