import React, { useEffect, useState } from 'react';
import { apiGetCached } from '../../utils/apiCache';
import './HeroTicker.css';

const HeroTicker = ({ hasSponsors = true }) => {
  const [specialSponsor, setSpecialSponsor] = useState(null);

  useEffect(() => {
    // Fetch active special sponsor details
    apiGetCached('/special-sponsor/active', (data) => {
      if (data?.data) {
        setSpecialSponsor(data.data);
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="hero-ticker-container">
      {/* Black Marquee - Slightly rotated */}
      <div className="ticker-band black-band">
        <div className="ticker-track">
          {[...Array(30)].map((_, i) => (
            <React.Fragment key={`black-${i}`}>
              <span className="ticker-text">MECHAPEF</span>
              {specialSponsor?.logoURL && (
                <>
                  <span className="ticker-cross" style={{ color: specialSponsor.brandColor || '#ff1f01', fontWeight: '900', fontSize: '1.2rem', margin: '0 5px' }}>×</span>
                  <img 
                    src={specialSponsor.logoURL} 
                    alt={specialSponsor.name} 
                    className="ticker-sponsor-logo" 
                    style={{ height: '24px', maxWidth: '100px', objectFit: 'contain', verticalAlign: 'middle', filter: 'brightness(0) invert(1)', margin: '0 10px' }} 
                  />
                </>
              )}
              <span className="ticker-icon">✦</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Red Marquee - Intersecting diagonally (Takes brand color of special sponsor if active) */}
      <div 
        className="ticker-band red-band"
        style={specialSponsor?.brandColor ? {
          backgroundColor: specialSponsor.brandColor,
          borderColor: 'rgba(255, 255, 255, 0.2)'
        } : {}}
      >
        <div className="ticker-track reverse">
          {[...Array(30)].map((_, i) => (
            <React.Fragment key={`red-${i}`}>
              {specialSponsor?.logoURL ? (
                <>
                  <span className="ticker-text">{specialSponsor.name}</span>
                  <img 
                    src={specialSponsor.logoURL} 
                    alt={specialSponsor.name} 
                    className="ticker-sponsor-logo" 
                    style={{ height: '24px', maxWidth: '100px', objectFit: 'contain', verticalAlign: 'middle', filter: 'brightness(0) invert(1)', margin: '0 10px' }} 
                  />
                </>
              ) : (
                <span className="ticker-text">{hasSponsors ? 'SPONSORS' : 'MECHAPEF'}</span>
              )}
              <span className="ticker-icon">✦</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroTicker;
