import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaArrowRight } from 'react-icons/fa';
import api from '../../services/api';
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
        // Filter for active announcements that have a banner URL
        const banners = items.filter(n => n.isActive && n.bannerURL);
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
    }, 5000);
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
            style={{ backgroundImage: `url(${slide.bannerURL})` }}
          >
            <div className="slide-overlay">
              <div className="slide-content">
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
    </section>
  );
};

export default LiveEventsSlider;
