import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import api from '../../services/api';
import './PastEventsStack.css';

gsap.registerPlugin(ScrollTrigger);

const PastEventsStack = () => {
  const sectionRef = useRef(null);
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/past-events')
      .then(res => {
        setPastEvents(res.data.data || []);
      })
      .catch(err => {
        console.error("Failed to fetch past events:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (loading || pastEvents.length === 0) return;

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

        // -- DESKTOP STACKING --
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: '+=200%',
            pin: true,
            scrub: 1,
            pinSpacing: true
          }
        });

        const cards = gsap.utils.toArray('.gsap-pe-card');

        gsap.set(cards, { 
          y: (i) => i === 0 ? 0 : 400, 
          opacity: (i) => i === 0 ? 1 : 0, 
          scale: (i) => i === 0 ? 1 : 0.8,
          rotate: (i) => i % 2 === 0 ? -4 : 4
        });

        cards.forEach((card, index) => {
          if (index === 0) return;
          
          tl.to(card, { y: 0, opacity: 1, scale: 1, duration: 1, ease: 'power2.out' }, index);
          
          for(let j = 0; j < index; j++) {
             const diff = index - j;
             tl.to(cards[j], { scale: 1 - (diff * 0.05), y: 0, duration: 1, ease: 'power2.out' }, index);
          }
        });
        
        // Wait for a brief moment after stacking is complete
        tl.to({}, { duration: 0.5 }); 
        
        // Shift all cards DOWN together to exit
        tl.to(cards, { y: "150vh", duration: 1.5, ease: "power2.in" });
      }, sectionRef);
      
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (ctx) ctx.revert();
      
      // Force kill any remaining ScrollTriggers created by this component
      ScrollTrigger.getAll().forEach(t => {
        if (t.vars.trigger === sectionRef.current) {
          t.kill(true); 
        }
      });
    };
  }, [loading, pastEvents]);

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
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
              className="pe-stack-card gsap-pe-card"
              key={event._id}
              style={{ zIndex: index + 1 }} // Ensure sequential stacking
            >
              <div className="pe-left">
                <img src={event.imageURL} alt={event.title} />
              </div>
              <div className="pe-right">
                <div className="pe-date">{event.date}</div>
                <h3>{event.title}</h3>
                <p>{event.description}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default PastEventsStack;
