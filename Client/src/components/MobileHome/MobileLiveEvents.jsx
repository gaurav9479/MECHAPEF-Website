import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaArrowRight, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { HeadingGearIcon, Reveal } from './MobileShared';

const MobileLiveEvents = ({ slides, navigate }) => {
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setSlideIdx(p => (p + 1) % slides.length), 30000);
    return () => clearInterval(t);
  }, [slides.length]);

  const goSlide = dir => setSlideIdx(p => (p + dir + slides.length) % slides.length);
  const handleExplore = link => {
    if (!link) return;
    if (link.startsWith('http')) window.open(link, '_blank');
    else navigate(link.startsWith('/') ? link : `/events/${link}`);
  };

  return (
    <section className="mh-section">
      <Reveal>
        <div className="mh-sec-hd">
          <span className="mh-tag">LIVE EVENTS</span>
          <h2 className="mh-sec-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            UPCOMING EVENTS
            <HeadingGearIcon size={26} />
          </h2>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        {slides.length === 0 ? (
          <div className="mh-no-event">
            <FaCalendarAlt style={{ fontSize: '2rem', color: '#ff1f01', marginBottom: 10 }} />
            <p>More Events Coming Soon</p>
            <small>Stay tuned! We are brewing exciting workshops &amp; competitions.</small>
          </div>
        ) : (
          <div className="mh-slider">
            {/* All slides in DOM, CSS controls opacity */}
            {slides.map((slide, idx) => (
              <div
                key={slide._id}
                className={`mh-slide ${idx === slideIdx ? 'active' : ''}`}
                style={slide.bannerURL ? { backgroundImage: `url(${slide.bannerURL})` } : { background: 'linear-gradient(135deg, #660a00 0%, #111111 100%)' }}
              >
                <div className="mh-slide-overlay">
                  <span className="mh-slide-tag">{slide.targetType || 'Announcement'}</span>
                  <h3 className="mh-slide-title">{slide.title}</h3>
                  <p className="mh-slide-desc">{slide.description}</p>
                  {slide.targetLink && (
                    <button className="mh-slide-btn" onClick={() => handleExplore(slide.targetLink)}>
                      EXPLORE <FaArrowRight />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {slides.length > 1 && (
              <>
                <button className="mh-arrow mh-arrow-l" onClick={() => goSlide(-1)}><FaChevronLeft /></button>
                <button className="mh-arrow mh-arrow-r" onClick={() => goSlide(1)}><FaChevronRight /></button>
                <div className="mh-dots">
                  {slides.map((_, i) => (
                    <span key={i}
                      className={`mh-dot-btn ${i === slideIdx ? 'active' : ''}`}
                      onClick={() => setSlideIdx(i)} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </Reveal>
    </section>
  );
};

export default MobileLiveEvents;
