import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { apiGetCached } from '../../utils/apiCache';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';
import './PastSponsors.css';

const PastSponsors = ({ showCurrentSponsors = true }) => {
  const [currentSponsors, setCurrentSponsors] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    apiGetCached('/sponsors', (data) => {
      const all = data.data?.sponsors || data.data || [];
      const current = all.filter(s => !s.isPastSponsor);
      const past = all.filter(s => s.isPastSponsor);
      current.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      past.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setCurrentSponsors(current);
      setSponsors(past);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load sponsors", err);
      setLoading(false);
    });
  }, []);

  if (loading) return null;

  return (
    <section className="past-sponsors-home-section">
      <div className="past-sponsors-container">
        {/* Render Current Sponsors ONLY if enabled and currentSponsors exist */}
        {showCurrentSponsors && currentSponsors.length > 0 && (
          <div style={{ marginBottom: '60px', width: '100%', textAlign: 'center' }}>
            <span style={{ color: '#ff1f01', fontSize: '0.9rem', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 'bold' }}>CURRENT YEAR</span>
            <h2 style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', fontWeight: '800', margin: '10px 0 30px', textTransform: 'uppercase', letterSpacing: '2px', color: '#fff' }}>
              OUR SPONSORS ⚙
            </h2>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '25px', 
              justifyContent: 'center', 
              maxWidth: '1100px', 
              margin: '0 auto', 
              padding: '10px' 
            }}>
              {currentSponsors.map(sponsor => (
                <div 
                  key={sponsor._id}
                  className="past-sponsor-logo-box"
                  style={{ background: '#ffffff', borderRadius: '12px', border: '2px solid #ff1f01', padding: '15px 25px', minWidth: '160px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
                  onClick={() => sponsor.websiteURL ? window.open(sponsor.websiteURL, '_blank') : navigate('/sponsors')}
                  title={sponsor.companyName}
                >
                  {sponsor.logoURL && !sponsor.logoURL.includes('placeholder.com') ? (
                    <img
                      src={getOptimizedImageUrl(sponsor.logoURL)}
                      alt={sponsor.companyName}
                      loading="lazy"
                      decoding="async"
                      style={{ maxHeight: '60px', maxWidth: '140px', objectFit: 'contain' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <span style={{ color: '#111', fontWeight: 'bold' }}>{sponsor.companyName}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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
                                src={getOptimizedImageUrl(sponsor.logoURL)}
                                alt={sponsor.type || 'Sponsor'}
                                loading="lazy"
                                decoding="async"
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
