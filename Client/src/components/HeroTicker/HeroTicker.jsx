import React from 'react';
// Removed FaGlobe to use native text symbols
import './HeroTicker.css';

const HeroTicker = ({ hasSponsors = true }) => {
  return (
    <div className="hero-ticker-container">
      {/* Black Marquee - Slightly rotated */}
      <div className="ticker-band black-band">
        <div className="ticker-track">
          {[...Array(30)].map((_, i) => (
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
          {[...Array(30)].map((_, i) => (
            <React.Fragment key={`red-${i}`}>
              <span className="ticker-text">{hasSponsors ? 'SPONSORS' : 'MECHAPEF'}</span>
              <span className="ticker-icon">✦</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroTicker;
