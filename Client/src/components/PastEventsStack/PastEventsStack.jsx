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
              invalidateOnRefresh: true
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
            end: () => "+=" + (cards.length * 150) + "%",
            pin: true,
            scrub: 1.5,
            pinSpacing: true,
            invalidateOnRefresh: true
          }
        });

        gsap.set(cards, { 
          y: window.innerHeight, 
          opacity: 0, 
          scale: 0.8,
          rotation: (i) => i % 2 === 0 ? -4 : 4
        });

        // Add an initial blank scroll delay
        tl.to({}, { duration: 0.5 });

        // Animate the first card in with a delay
        tl.fromTo(cards[0], 
          { y: window.innerHeight, opacity: 0, scale: 0.8 },
          { y: 0, opacity: 1, scale: 1, rotation: 0, duration: 1.2, ease: 'power3.out' }, 
          0.5
        );

        cards.forEach((card, index) => {
          if (index === 0) return;
          
          const startTime = 0.5 + (index * 0.85); // Overlap for smoother continuous flow
          tl.fromTo(card, 
            { y: window.innerHeight, opacity: 0, scale: 0.8 },
            { y: 0, opacity: 1, scale: 1, rotation: 0, duration: 1.2, ease: 'power3.out' }, 
            startTime
          );
          
          for(let j = 0; j < index; j++) {
             const diff = index - j;
             tl.to(cards[j], { scale: 1 - (diff * 0.05), y: -25 * diff, rotation: j % 2 === 0 ? -4 : 4, duration: 1.2, ease: 'power3.out' }, startTime);
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
                <div className="pe-skeleton-content">
                   <div className="pe-skeleton-img shimmer"></div>
                   <div className="pe-skeleton-body">
                      <div className="pe-skeleton-date shimmer"></div>
                      <div className="pe-skeleton-title shimmer"></div>
                      <div className="pe-skeleton-desc shimmer"></div>
                      <div className="pe-skeleton-desc shimmer short"></div>
                   </div>
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
