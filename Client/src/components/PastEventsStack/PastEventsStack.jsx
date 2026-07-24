import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import api from '../../services/api';
import './PastEventsStack.css';

gsap.registerPlugin(ScrollTrigger);

const skeletonEvents = [
  { _id: 'sk1', isSkeleton: true },
  { _id: 'sk2', isSkeleton: true },
  { _id: 'sk3', isSkeleton: true }
];

const PastEventsStack = () => {
  const sectionRef = useRef(null);
  
  const getInitialEvents = () => {
    const cached = localStorage.getItem('mechapef_pastEventsCache');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return skeletonEvents;
      }
    }
    return skeletonEvents;
  };

  const [pastEvents, setPastEvents] = useState(getInitialEvents);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        let resData = null;
        if (window.pastEventsPromise) {
          resData = await window.pastEventsPromise;
          window.pastEventsPromise = null; 
        } else {
          const res = await api.get('/past-events');
          resData = res.data;
        }

        if (resData && resData.data && resData.data.length > 0) {
          setPastEvents(resData.data);
          localStorage.setItem('mechapef_pastEventsCache', JSON.stringify(resData.data));
        }
      } catch (err) {
        console.error("Failed to fetch past events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
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
              end: "+=200%",
              pin: true,
              scrub: 1,
              pinSpacing: true
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
            end: () => "+=" + (cards.length * 150) + "%", // Increased length per card
            pin: true,
            scrub: 1,
            pinSpacing: true
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
          { y: 0, opacity: 1, scale: 1, rotation: 0, duration: 1, ease: 'power2.out' }, 
          0.5
        );

        cards.forEach((card, index) => {
          if (index === 0) return;
          
          const startTime = 0.5 + index;
          tl.fromTo(card, 
            { y: window.innerHeight, opacity: 0, scale: 0.8 },
            { y: 0, opacity: 1, scale: 1, rotation: 0, duration: 1, ease: 'power2.out' }, 
            startTime
          );
          
          for(let j = 0; j < index; j++) {
             const diff = index - j;
             tl.to(cards[j], { scale: 1 - (diff * 0.05), y: -25 * diff, rotation: j % 2 === 0 ? -4 : 4, duration: 1, ease: 'power2.out' }, startTime);
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
                  <div className="pe-right">
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
