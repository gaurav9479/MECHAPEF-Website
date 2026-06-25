import React from 'react';
import './PremiumSponsorPanel.css';

const PremiumSponsorPanel = ({ sponsor }) => {
  if (!sponsor || !sponsor.name) return null;

  return (
    <div className="premium-sponsor-panel-wrapper">
      <div className="premium-sponsor-panel">
        <div className="sponsor-glow-orb"></div>
        <div className="sponsor-glass-card">
          <div className="sponsor-type-badge">
            <span className="badge-dot"></span>
            {sponsor.type || 'Powered By'}
          </div>
          
          <div className="sponsor-logo-container">
            {sponsor.logoURL && !sponsor.logoURL.includes('placeholder.com') ? (
              <img src={sponsor.logoURL} alt={sponsor.name} className="sponsor-logo-img" />
            ) : (
              <span className="sponsor-text-fallback">{sponsor.name}</span>
            )}
          </div>
          
          <h3 className="sponsor-name-text">{sponsor.name}</h3>
          
          <div className="sponsor-tech-lines">
            <div className="tech-line"></div>
            <div className="tech-line short"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumSponsorPanel;
