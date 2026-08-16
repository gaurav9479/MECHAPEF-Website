import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import api from '../../services/api';
import { apiGetCached } from '../../utils/apiCache';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';
import './PastEventsStack.css';

gsap.registerPlugin(ScrollTrigger);

const skeletonEvents = [
  { _id: 'sk1', isSkeleton: true },
  { _id: 'sk2', isSkeleton: true },
  { _id: 'sk3', isSkeleton: true }
];

const PastEventsStack = ({ onLoaded }) => {
  const sectionRef = useRef(null);
  
  const [pastEvents, setPastEvents] = useState(skeletonEvents);
  const [loading, setLoading] = useState(true);
  const [specialSponsor, setSpecialSponsor] = useState(null);

  useEffect(() => {
    const fetchEvents = () => {
      apiGetCached('/past-events', (data) => {
        const eventsList = data.data?.events || data.data || [];
        if (eventsList.length > 0) {
          setPastEvents(eventsList);
        }
        setLoading(false);
        if (onLoaded) onLoaded();
      }).catch(err => {
        console.error("Failed to fetch past events:", err);
        setLoading(false);
        if (onLoaded) onLoaded();
      });
    };
    fetchEvents();

    // Fetch Special Sponsor for card top-right branding
    apiGetCached('/special-sponsor/active', (data) => {
      if (data?.data) setSpecialSponsor(data.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (pastEvents.length === 0) return;

    let ctx;
    const timer = setTimeout(() => {
      ctx = gsap.context(() => {
        
        // -- MOBILE GSAP PINNING --
        if (window.innerWidth <= 768) {
          const mobileCardsWrapper = sectionRef.current.querySelector('.pe-gsap-cards-wrapper');
          gsap.set(mobileCardsWrapper, { y: window.innerHeight });

          const mobileTl = gsap.timeline({
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top top",
              end: () => "+=" + (pastEvents.length * 100) + "%",
              pin: true,
              scrub: 1.5,
              pinSpacing: true,
              invalidateOnRefresh: true,
              anticipatePin: 1
            }
          });

          mobileTl.to(mobileCardsWrapper, {
            y: () => (window.innerHeight / 2) - mobileCardsWrapper.offsetHeight,
            ease: "none"
          });
          return;
        }

        const cards = gsap.utils.toArray('.gsap-pe-card');

        // -- DESKTOP STACKING --
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: () => "+=" + ((cards.length * 150) + 120) + "%",
            pin: true,
            pinType: 'fixed',
            scrub: 1.5,
            pinSpacing: true,
            invalidateOnRefresh: true,
            anticipatePin: 1
          }
        });

        gsap.set(cards, { 
          y: window.innerHeight, 
          opacity: 0, 
          scale: 0.8,
          rotation: (i) => i % 2 === 0 ? -4 : 4,
          pointerEvents: 'none'
        });

        const initialBuffer = 0.8;
        const cardDuration = 1.2;
        const settleDelay = 0.4;

        // Add an initial blank scroll delay
        tl.to({}, { duration: initialBuffer });

        // Animate the first card in
        tl.fromTo(cards[0], 
          { y: window.innerHeight, opacity: 0, scale: 0.8, pointerEvents: 'none' },
          { y: 0, opacity: 1, scale: 1, rotation: 0, duration: cardDuration, ease: 'power3.out', pointerEvents: 'auto' }, 
          initialBuffer
        );

        cards.forEach((card, index) => {
          if (index === 0) return;
          
          // Calculate start time so this card only enters after the previous card has fully settled + settleDelay
          const startTime = initialBuffer + cardDuration + settleDelay + (index - 1) * (cardDuration + settleDelay);
          
          tl.fromTo(card, 
            { y: window.innerHeight, opacity: 0, scale: 0.8, pointerEvents: 'none' },
            { y: 0, opacity: 1, scale: 1, rotation: 0, duration: cardDuration, ease: 'power3.out', pointerEvents: 'auto' }, 
            startTime
          );
          
          for(let j = 0; j < index; j++) {
             const diff = index - j;
             tl.to(cards[j], { scale: 1 - (diff * 0.05), y: -25 * diff, rotation: j % 2 === 0 ? -4 : 4, duration: cardDuration, ease: 'power3.out' }, startTime);
          }
        });
        
        tl.to({}, { duration: 0.5 }); // Buffer
      }, sectionRef);
      
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (ctx) ctx.revert();
    };
  }, [loading, pastEvents]);

  if (pastEvents.length === 0) return null;

  return (
    <section ref={sectionRef} className="pe-gsap-section">
      
      {/* Mobile Background Text (Sticky) */}
      <div className="pe-mobile-bg-wrapper">
        <div className="pe-mobile-bg-text">
          <div className="bg-word w-1">HOW'S</div>
          <div className="bg-word w-2">THE</div>
          <div className="bg-word w-3">LEGACY</div>
          <div className="bg-word w-4">SO FAR</div>
        </div>
        <div className="pe-mobile-vertical-text">
          <span>I</span><span>N</span><span>N</span><span>O</span><span>V</span><span>A</span><span>T</span><span>E</span><br/><br/>
          <span>B</span><span>U</span><span>I</span><span>L</span><span>D</span>
        </div>
      </div>

      <div className="pe-gsap-container">
        
        <div className="pe-header desktop-only-header">
          <h2 className="section-title">PAST EVENTS</h2>
          <p className="section-subtitle">Glimpses of our successful past endeavors and legacy.</p>
        </div>

        <div className="pe-gsap-cards-wrapper">
          {pastEvents.map((event, index) => (
            <div 
              className={`pe-stack-card gsap-pe-card ${event.isSkeleton ? 'pe-shimmer-skeleton' : ''}`}
              key={event._id}
              style={{ zIndex: index + 1 }}
            >
              {event.isSkeleton ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0d', color: '#ff1f01', padding: '20px', boxSizing: 'border-box', textAlign: 'center', minHeight: '300px' }}>
                  <style>{`
                    @keyframes spin-gear {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                    @keyframes text-pulse {
                      0%, 100% { opacity: 0.6; filter: drop-shadow(0 0 2px rgba(255,31,1,0.3)); }
                      50% { opacity: 1; filter: drop-shadow(0 0 10px rgba(255,31,1,0.8)); }
                    }
                  `}</style>
                  <div style={{ animation: 'spin-gear 6s linear infinite', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>
                    <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#ff1f01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </div>
                  <h3 style={{
                    fontFamily: 'Orbitron, sans-serif',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    letterSpacing: '2.5px',
                    margin: '0 0 8px 0',
                    color: '#ff1f01',
                    animation: 'text-pulse 2s infinite ease-in-out',
                    textTransform: 'uppercase'
                  }}>
                    LET THE IC ENGINE START...
                  </h3>
                  <p style={{
                    fontFamily: 'Orbitron, sans-serif',
                    fontSize: '0.75rem',
                    color: '#666',
                    letterSpacing: '1px',
                    margin: 0,
                    textTransform: 'uppercase'
                  }}>
                    Legacy loading in progress
                  </p>
                </div>
              ) : (
                <>
                  <div className="pe-left">
                    <img src={window.innerWidth <= 768 && event.mobileImageURL ? event.mobileImageURL : event.imageURL} alt={event.title} />
                  </div>
                  <div className="pe-right" style={{ position: 'relative' }}>
                    {specialSponsor?.logoURL && specialSponsor?.showEventCardsLogo !== false && (
                      <div 
                        className="card-special-sponsor-badge" 
                        style={{ 
                          position: 'absolute', 
                          top: '16px', 
                          right: '20px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          background: 'rgba(255, 255, 255, 0.95)', 
                          backdropFilter: 'blur(8px)', 
                          padding: '6px 12px', 
                          borderRadius: '24px', 
                          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          zIndex: 10
                        }}
                      >
                        <img 
                          src={getOptimizedImageUrl(specialSponsor.logoURL)} 
                          alt={specialSponsor.name} 
                          style={{ height: '28px', maxWidth: '100px', objectFit: 'contain' }} 
                        />
                      </div>
                    )}
                    <div className="pe-date">{event.date}</div>
                    <h3>{event.title}</h3>
                    <div style={{ display: 'block', overflow: 'hidden' }}>
                      <p className="pe-desc-truncate">{event.description}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default PastEventsStack;
