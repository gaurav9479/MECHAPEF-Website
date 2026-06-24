import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaArrowRight } from 'react-icons/fa';
import api from '../../services/api';
import PremiumSponsorPanel from './PremiumSponsorPanel';
import HeroTicker from '../HeroTicker/HeroTicker';
// import ICEngine3D from './ICEngine3D'; // User requested to remove from slider but keep the file
import './LiveEventsSlider.css';

const LiveEventsSlider = () => {
  const [slides, setSlides] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/announcements')
      .then(res => {
        const items = res.data.data?.announcements || res.data.data || [];
        // Filter for active announcements that have a banner URL OR are marked as an Event
        const banners = items.filter(n => n.isActive && (n.bannerURL || n.targetType === 'Event'));
        // Sort by display order
        banners.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        setSlides(banners);
      })
      .catch(err => console.error("Failed to load banners", err))
      .finally(() => setLoading(false));
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
            style={slide.bannerURL ? { backgroundImage: `url(${slide.bannerURL})` } : {}}
          >
            
            <div className="slide-overlay">
              <div className="slide-content-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '20px' }}>
                <div className="slide-content" style={{ flex: 1 }}>
                  <h2>{slide.title}</h2>
                  <p>{slide.description}</p>
                  {slide.targetLink && (
                    <button 
                      className="explore-btn" 
                      onClick={() => handleExplore(slide.targetLink)}
                    >
                      EVENT <FaArrowRight style={{marginLeft: '10px'}} />
                    </button>
                  )}
                </div>
                
                {/* Removed PremiumSponsorPanel from inside the slide */}
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

      <HeroTicker />

      {/* Render the Active Event's Sponsors below the Ticker */}
      {slides[currentIdx]?.targetType === 'Event' && slides[currentIdx]?.eventSponsors?.length > 0 && (
        <div className="active-event-sponsors-section" style={{ padding: '20px 20px', backgroundColor: '#050505', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', overflow: 'hidden' }}>
          <h3 style={{ color: '#ff1f01', fontSize: '1.2rem', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '2px' }}>Event Endorsed Sponsors</h3>
          
          <div className="event-sponsors-horizontal-scroll" style={{ 
            display: 'flex', 
            gap: '20px', 
            overflowX: 'auto', 
            paddingBottom: '20px', 
            width: '100%', 
            maxWidth: '1200px',
            scrollSnapType: 'x mandatory',
            justifyContent: slides[currentIdx].eventSponsors.length < 4 ? 'center' : 'flex-start'
          }}>
            {slides[currentIdx].eventSponsors.map((sp, idx) => (
              <div key={idx} style={{ flex: '0 0 auto', scrollSnapAlign: 'center' }}>
                <PremiumSponsorPanel sponsor={sp} />
              </div>
            ))}
          </div>
        </div>
      )}

    </section>
  );
};

export default LiveEventsSlider;
