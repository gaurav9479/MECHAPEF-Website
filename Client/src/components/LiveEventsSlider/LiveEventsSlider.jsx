import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaArrowRight } from 'react-icons/fa';
import api from '../../services/api';
import { apiGetCached } from '../../utils/apiCache';
import PremiumSponsorPanel from './PremiumSponsorPanel';
import HeroTicker from '../HeroTicker/HeroTicker';
// import ICEngine3D from './ICEngine3D'; // User requested to remove from slider but keep the file
import './LiveEventsSlider.css';

const LiveEventsSlider = () => {
  const [slides, setSlides] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [specialSponsor, setSpecialSponsor] = useState(null);

  useEffect(() => {
    apiGetCached('/special-sponsor/active', (res) => {
      if (res.data) setSpecialSponsor(res.data);
    }, { cacheDuration: 5 * 60 * 1000 }).catch(() => {});
  }, []);

  useEffect(() => {
    apiGetCached('/announcements', (data) => {
      const items = data.data?.announcements || data.data || [];
      // Filter for all active announcements
      const banners = items.filter(n => n.isActive);
      // Sort by display order
      banners.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setSlides(banners);
      setLoading(false);
    }, { cacheDuration: 2 * 60 * 1000 }).catch(err => {
      console.error("Failed to load banners", err);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % slides.length);
    }, 30000); // Changed to 30 seconds as requested
    return () => clearInterval(interval);
  }, [slides.length]);

  const handleNext = () => {
    setCurrentIdx(prev => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentIdx(prev => (prev - 1 + slides.length) % slides.length);
  };

  const handleExplore = (link) => {
    if (!link) return;
    if (link.startsWith('http')) {
      window.open(link, '_blank');
    } else if (link.startsWith('/')) {
      navigate(link);
    } else {
      // If it's just an ID, assume it's an event ID
      navigate(`/events/${link}`);
    }
  };

  if (loading) return null;
  
  if (slides.length === 0) {
    return (
      <section className="live-events-slider-wrapper">
        <div className="slider-container">
          <div className="slide active" style={{ backgroundColor: '#0a0a0a' }}>
            <div className="slide-overlay" style={{ justifyContent: 'center', textAlign: 'center', background: 'radial-gradient(circle, rgba(255,0,0,0.1) 0%, rgba(0,0,0,0.8) 100%)' }}>
              <div className="slide-content" style={{ transform: 'translateY(0)', opacity: 1, margin: '0 auto' }}>
                <h2>More Events Coming Soon</h2>
                <p>Stay tuned! We are brewing some exciting workshops and competitions for you.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="live-events-slider-wrapper">
      <div className="slider-container">
        {slides.map((slide, index) => (
          <div 
            key={slide._id} 
            className={`slide ${index === currentIdx ? 'active' : ''}`}
            style={slide.bannerURL ? { backgroundImage: `url(${slide.bannerURL})` } : { background: 'linear-gradient(135deg, #660a00 0%, #111111 100%)' }}
          >
            
            <div className="slide-overlay">
              {/* Ultra-Sexy Co-Branding Glass Badge Container */}
              <div className="slide-content-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '20px' }}>
                <div className="slide-content" style={{ flex: 1 }}>

                  {specialSponsor && specialSponsor.showAnnouncementSliderLogo !== false ? (
                    <div className="sexy-cobrand-hero-card">
                      <div className="cobrand-badge-top">
                        <span className="cobrand-dot" style={{ backgroundColor: specialSponsor.brandColor || '#ff1f01' }}></span>
                        <span className="cobrand-label">OFFICIAL CO-BRANDED EVENT</span>
                      </div>

                      <div className="slide-cobranding-header">
                        <h2 className="cobranded-slide-title">
                          {specialSponsor.sliderCustomName || slide.title}
                        </h2>
                        
                        <div className="cobrand-x-divider">
                          <span className="x-line"></span>
                          <span className="cobranding-cross" style={{ color: specialSponsor.brandColor || '#ff1f01' }}>×</span>
                          <span className="x-line"></span>
                        </div>

                        { (specialSponsor.sliderLogoURL || specialSponsor.logoURL) ? (
                          <div className="cobrand-logo-glow-wrapper">
                            <img 
                              src={specialSponsor.sliderLogoURL || specialSponsor.logoURL} 
                              alt={specialSponsor.name} 
                              className="cobranding-slide-logo"
                            />
                          </div>
                        ) : (
                          <span className="cobranding-brand-text" style={{ color: specialSponsor.brandColor || '#ff1f01' }}>
                            {specialSponsor.name}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <h2 className="standard-slide-title">{slide.title}</h2>
                  )}

                  <p className="slide-description">{slide.description}</p>

                  {slide.targetLink && (
                    <button 
                      className="explore-btn sexy-glow-btn" 
                      onClick={() => handleExplore(slide.targetLink)}
                    >
                      <span>EXPLORE EVENT</span>
                      <FaArrowRight className="btn-arrow-icon" style={{ marginLeft: '12px' }} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {slides.length > 1 && (
          <>
            <button className="slider-arrow prev" onClick={handlePrev}><FaChevronLeft /></button>
            <button className="slider-arrow next" onClick={handleNext}><FaChevronRight /></button>
            
            <div className="slider-dots">
              {slides.map((_, idx) => (
                <span 
                  key={idx} 
                  className={`dot ${idx === currentIdx ? 'active' : ''}`}
                  onClick={() => setCurrentIdx(idx)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <HeroTicker hasSponsors={slides[currentIdx]?.eventSponsors?.length > 0} />

      {/* Render the Active Event's Sponsors below the Ticker */}
      {slides[currentIdx]?.targetType === 'Event' && slides[currentIdx]?.eventSponsors?.length > 0 && (
        <div className="active-event-sponsors-section" style={{ padding: '20px 20px', backgroundColor: '#050505', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', overflow: 'hidden' }}>
          <h3 style={{ color: '#ff1f01', fontSize: '1.2rem', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '2px' }}>Event Endorsed Sponsors</h3>
          
          <div className="sponsors-chain-wrapper" style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div className="event-sponsors-horizontal-scroll" style={{ 
              display: 'flex', 
              gap: '20px', 
              overflowX: 'auto', 
              overflowY: 'hidden',
              padding: '5px 20px', 
              width: '100%', 
              maxWidth: '1200px',
              scrollSnapType: 'x mandatory',
              zIndex: 1,
            }}>
              <div style={{ margin: 'auto' }} />
              {slides[currentIdx].eventSponsors.map((sp, idx) => (
                <div key={idx} style={{ flex: '0 0 auto', scrollSnapAlign: 'center' }}>
                  <PremiumSponsorPanel sponsor={sp} />
                </div>
              ))}
              <div style={{ margin: 'auto' }} />
            </div>
          </div>
        </div>
      )}

    </section>
  );
};

export default LiveEventsSlider;
