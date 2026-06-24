import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './PastSponsors.css';

const PastSponsors = () => {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/sponsors')
      .then(res => {
        const data = res.data.data?.sponsors || res.data.data || [];
        const past = data.filter(s => s.isPastSponsor);
        past.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        setSponsors(past);
      })
      .catch(err => console.error("Failed to load past sponsors", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <section className="past-sponsors-home-section">
      <div className="past-sponsors-container">
        <div className="section-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '3rem', fontWeight: '800', margin: 0, textTransform: 'uppercase', letterSpacing: '2px', color: '#ff1f01' }}>Our Past Sponsors</h2>
          <p style={{ color: '#888', marginTop: '10px' }}>Partners who have supported us in our journey.</p>
        </div>
        
        <div className="past-sponsors-marquee">
          {sponsors.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#555', padding: '40px', width: '100%' }}>
              No past sponsors marked yet. Check "Mark as Past Sponsor" in the admin panel.
            </div>
          ) : (
            <div className="marquee-content">
              {sponsors.map(sponsor => (
                <div 
                  key={sponsor._id} 
                  className="past-sponsor-logo-box"
                  onClick={() => sponsor.websiteURL ? window.open(sponsor.websiteURL, '_blank') : navigate('/sponsors')}
                  title={sponsor.companyName}
                >
                  <img src={sponsor.logoURL} alt={sponsor.companyName} />
                </div>
              ))}
              {/* Duplicate for seamless infinite scroll */}
              {sponsors.map(sponsor => (
                <div 
                  key={`${sponsor._id}-dup`} 
                  className="past-sponsor-logo-box"
                  onClick={() => sponsor.websiteURL ? window.open(sponsor.websiteURL, '_blank') : navigate('/sponsors')}
                  title={sponsor.companyName}
                >
                  <img src={sponsor.logoURL} alt={sponsor.companyName} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PastSponsors;
