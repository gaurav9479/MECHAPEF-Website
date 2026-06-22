import React from 'react';
import './OurTeam.css';

const OurTeam = () => {
  // Generate 10 placeholder cards for each layer
  const cards = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <section className="our-team-section">
      <h1 className="team-heading">OUR TEAM</h1>
      
      {/* 
        This wrapper is the main horizontal scroller. 
        It allows the user to swipe/scroll horizontally 
        to reveal the 10 cards across all 3 layers simultaneously. 
      */}
      <div className="team-scroll-container">
        
        {/* Layer 1: Final Year Seniors */}
        <div className="team-layer">
          <h3 className="layer-title">Final Year Seniors</h3>
          <div className="layer-track">
            {cards.map(num => (
              <div key={`fy-${num}`} className="team-card">
                <div className="card-img-placeholder">
                  <span className="placeholder-text">Image {num}</span>
                </div>
                <div className="card-info">
                  <h4>Name {num}</h4>
                  <p>Senior Member</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Layer 2: Pre-final Year */}
        <div className="team-layer">
          <h3 className="layer-title">Pre-final Year</h3>
          <div className="layer-track">
            {cards.map(num => (
              <div key={`pf-${num}`} className="team-card">
                <div className="card-img-placeholder">
                  <span className="placeholder-text">Image {num}</span>
                </div>
                <div className="card-info">
                  <h4>Name {num}</h4>
                  <p>Core Member</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Layer 3: Second Year */}
        <div className="team-layer">
          <h3 className="layer-title">Second Year</h3>
          <div className="layer-track">
            {cards.map(num => (
              <div key={`sy-${num}`} className="team-card">
                <div className="card-img-placeholder">
                  <span className="placeholder-text">Image {num}</span>
                </div>
                <div className="card-info">
                  <h4>Name {num}</h4>
                  <p>Junior Member</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default OurTeam;
