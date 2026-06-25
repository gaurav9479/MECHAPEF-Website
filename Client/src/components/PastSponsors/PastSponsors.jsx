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
          <h2 style={{ fontSize: 'clamp(2rem, 8vw, 3rem)', fontWeight: '800', margin: 0, textTransform: 'uppercase', letterSpacing: '2px', color: '#ff1f01' }}>Our Past Sponsors</h2>
          <p style={{ color: '#888', marginTop: '10px' }}>Partners who have supported us in our journey.</p>
        </div>
        
        <div className="past-sponsors-content" style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '300px', paddingBottom: '60px' }}>
          {sponsors.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#555', padding: '40px', width: '100%' }}>
              No past sponsors marked yet. Check "Mark as Past Sponsor" in the admin panel.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '60px', width: '100%', zIndex: 1, padding: '20px 0' }}>
              {(() => {
                const grouped = {};
                sponsors.forEach(sp => {
                  const type = sp.type || 'Past Sponsors';
                  if (!grouped[type]) grouped[type] = [];
                  grouped[type].push(sp);
                });
                
                const sortedTypes = Object.keys(grouped).sort((a, b) => {
                  if (a.toLowerCase().includes('alpha')) return -1;
                  if (b.toLowerCase().includes('alpha')) return 1;
                  if (a.toLowerCase().includes('beta')) return -1;
                  if (b.toLowerCase().includes('beta')) return 1;
                  if (a.toLowerCase().includes('gamma')) return -1;
                  if (b.toLowerCase().includes('gamma')) return 1;
                  return a.localeCompare(b);
                });
                
                return sortedTypes.map((type) => (
                  <div key={type} className="past-tier-wrapper" style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '25px' }}>
                    <h3 style={{ color: '#fff', fontSize: '1.2rem', margin: 0, letterSpacing: '1px' }}>
                      {type.replace(/sponsors?/i, '').trim()} <span style={{ color: '#fff' }}>Sponsors</span>
                    </h3>

                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap',
                      gap: '30px', 
                      width: '100%', 
                      maxWidth: '1000px',
                      justifyContent: 'center',
                      zIndex: 1,
                      padding: '10px 20px'
                    }}>
                      {grouped[type].map((sponsor) => (
                        <div 
                          key={sponsor._id} 
                          className="past-sponsor-logo-box"
                          onClick={() => sponsor.websiteURL ? window.open(sponsor.websiteURL, '_blank') : navigate('/sponsors')}
                          title={sponsor.type || 'Sponsor'}
                        >
                          {sponsor.logoURL && !sponsor.logoURL.includes('placeholder.com') ? (
                            <>
                              <img
                                src={sponsor.logoURL}
                                alt={sponsor.type || 'Sponsor'}
                                onError={e => {
                                  e.target.style.display = 'none';
                                  const fb = e.target.parentNode.querySelector('.logo-fallback');
                                  if (fb) fb.style.display = 'flex';
                                }}
                              />
                              <span className="logo-fallback" style={{ display: 'none', color: '#333', fontWeight: 'bold', fontSize: '0.75rem', textAlign: 'center', alignItems: 'center', justifyContent: 'center' }}>
                                {sponsor.type || sponsor.companyName || 'Sponsor'}
                              </span>
                            </>
                          ) : (
                            <span style={{ color: '#333', fontWeight: 'bold' }}>{sponsor.type || sponsor.companyName || 'Sponsor'}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PastSponsors;
