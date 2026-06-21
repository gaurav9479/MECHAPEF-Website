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
          <div className="card" key={index}>
            <h1>{item[0]}</h1>
            <p>{item[1]}</p>
          </div>
        ))
      }

    </section>
  );
};

export default Stats;