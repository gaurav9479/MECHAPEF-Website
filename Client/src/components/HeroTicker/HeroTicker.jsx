import React from 'react';
// Removed FaGlobe to use native text symbols
import './HeroTicker.css';

const HeroTicker = () => {
  return (
    <div className="hero-ticker-container">
      {/* Black Marquee - Slightly rotated */}
      <div className="ticker-band black-band">
        <div className="ticker-track">
          {[...Array(10)].map((_, i) => (
            <React.Fragment key={`black-${i}`}>
              <span className="ticker-text">MECHAPEF</span>
              <span className="ticker-icon">✦</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Red Marquee - Intersecting diagonally */}
      <div className="ticker-band red-band">
        <div className="ticker-track reverse">
          {[...Array(10)].map((_, i) => (
            <React.Fragment key={`red-${i}`}>
              <span className="ticker-text">SPONSORS</span>
              <span className="ticker-icon">✦</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroTicker;
