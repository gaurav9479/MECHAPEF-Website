import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HeadingGearIcon, Reveal } from './MobileShared';
import './MobileDepartmentStack.css';

gsap.registerPlugin(ScrollTrigger);

const MobileDepartmentStack = ({ images }) => {
  const sectionRef = useRef(null);

  useEffect(() => {
    if (!images || images.length === 0) return;

    let ctx;
    const timer = setTimeout(() => {
      ctx = gsap.context(() => {
        const mobileCardsWrapper = sectionRef.current.querySelector('.mds-cards-wrapper');
        const cards = gsap.utils.toArray('.mds-card');
        
        if (cards.length === 0) return;

        gsap.set(mobileCardsWrapper, { y: window.innerHeight * 0.8 });
        
        gsap.set(cards, { 
          y: window.innerHeight, 
          opacity: 0, 
          scale: 0.8,
          rotation: (i) => i % 2 === 0 ? -4 : 4
        });

        const mobileTl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: () => "+=" + (cards.length * 100) + "%",
            pin: true,
            scrub: 1.5,
            pinSpacing: true,
            invalidateOnRefresh: true
          }
        });

        // Fade in and scale up the header smoothly as the section is pinned
        const mdsHeader = sectionRef.current.querySelector('.mds-header');
        mobileTl.fromTo(mdsHeader,
          { opacity: 0, scale: 0.7, y: 30 },
          { opacity: 0.8, scale: 1, y: 0, duration: 0.8, ease: "power2.out" },
          0
        );

        // Bring wrapper up slightly
        mobileTl.to(mobileCardsWrapper, {
          y: 0,
          duration: 0.8,
          ease: "none"
        }, 0.3);

        // Animate first card
        mobileTl.fromTo(cards[0], 
          { y: window.innerHeight, opacity: 0, scale: 0.8 },
          { y: 0, opacity: 1, scale: 1, rotation: 0, duration: 1.2, ease: 'power3.out' }, 
          0.7
        );

        cards.forEach((card, index) => {
          if (index === 0) return;
          
          const startTime = 0.7 + (index * 0.85); 
          mobileTl.fromTo(card, 
            { y: window.innerHeight, opacity: 0, scale: 0.8 },
            { y: 0, opacity: 1, scale: 1, rotation: 0, duration: 1.2, ease: 'power3.out' }, 
            startTime
          );
          
          for(let j = 0; j < index; j++) {
             const diff = index - j;
             mobileTl.to(cards[j], { 
                scale: 1 - (diff * 0.05), 
                y: -20 * diff, 
                rotation: j % 2 === 0 ? -4 : 4, 
                duration: 1.2, 
                ease: 'power3.out' 
             }, startTime);
          }
        });
        
        mobileTl.to({}, { duration: 0.5 }); // Buffer
      }, sectionRef);
      
      // Delay refresh slightly more to ensure it happens after PastEventsStack is done
      setTimeout(() => {
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
      }, 500);
    }, 400); // 400ms delay ensures PastEventsStack (100ms) creates its trigger first

    return () => {
      clearTimeout(timer);
      if (ctx) ctx.revert();
    };
  }, [images]);

  if (!images || images.length === 0) return null;

  return (
    <section ref={sectionRef} className="mds-section mh-section">
      <div className="mh-sec-hd mds-header" style={{ 
        position: 'absolute', 
        top: '45%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)', 
        zIndex: 0, 
        width: '100%',
        opacity: 0,
        pointerEvents: 'none'
      }}>
        <h2 className="mh-sec-title" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', color: '#ffffff', letterSpacing: '6px', textAlign: 'center', fontSize: '2.5rem' }}>
          <span>OUR</span>
          <span>DEPARTMENT</span>
        </h2>
      </div>

      <div className="mds-container" style={{ zIndex: 5 }}>
        <div className="mds-cards-wrapper">
          {images.map((imgUrl, index) => (
            <div 
              className="mds-card cyber-frame"
              key={index}
              style={{ zIndex: index + 1 }}
            >
              <div className="cyber-frame-inner">
                <img src={imgUrl} alt={`Department ${index + 1}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MobileDepartmentStack;
