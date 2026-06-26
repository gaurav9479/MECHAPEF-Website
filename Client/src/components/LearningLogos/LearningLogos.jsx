import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './LearningLogos.css';

gsap.registerPlugin(ScrollTrigger);

const learningItems = [
  { icon: '⚙️', label: 'SolidWorks' },
  { icon: '🖥️', label: 'MATLAB' },
  { icon: '🔧', label: 'AutoCAD' },
  { icon: '🤖', label: 'Arduino' },
  { icon: '🧠', label: 'AI / ML' },
  { icon: '🏭', label: '3D Printing' },
  { icon: '📐', label: 'CATIA' },
  { icon: '⚡', label: 'IoT' },
  { icon: '🔩', label: 'ANSYS' },
  { icon: '🚗', label: 'EV Design' },
];

const LearningLogos = () => {
  const sectionRef = useRef(null);
  const row1Ref = useRef(null);
  const row2Ref = useRef(null);

  useEffect(() => {
    let ctx;
    const timer = setTimeout(() => {
      ctx = gsap.context(() => {
        const row1 = row1Ref.current;
        const row2 = row2Ref.current;
        if (!row1 || !row2) return;

        // Set initial positions
        gsap.set(row1, { xPercent: 30 });
        gsap.set(row2, { xPercent: -30 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          }
        });

        // Row 1 moves LEFT
        tl.to(row1, { xPercent: -50, ease: 'none', duration: 1 }, 0);

        // Row 2 moves RIGHT
        tl.to(row2, { xPercent: 20, ease: 'none', duration: 1 }, 0);

      }, sectionRef);

      ScrollTrigger.refresh();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (ctx) ctx.revert();
    };
  }, []);

  // Split items into two rows
  const row1Items = learningItems.slice(0, 5);
  const row2Items = learningItems.slice(5, 10);

  return (
    <section ref={sectionRef} className="ll-section">
      <div className="ll-bg-text">LEARN</div>
      
      <div className="ll-header">
        <h2 className="ll-title">What We Learn</h2>
        <p className="ll-subtitle">Tools, technologies & skills that power our innovations</p>
      </div>

      <div className="ll-tracks">
        {/* Row 1 - moves left */}
        <div className="ll-row" ref={row1Ref}>
          {[...row1Items, ...row1Items, ...row1Items].map((item, i) => (
            <div className="ll-card" key={`r1-${i}`}>
              <span className="ll-card-icon">{item.icon}</span>
              <span className="ll-card-label">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Divider line */}
        <div className="ll-divider"></div>

        {/* Row 2 - moves right */}
        <div className="ll-row" ref={row2Ref}>
          {[...row2Items, ...row2Items, ...row2Items].map((item, i) => (
            <div className="ll-card" key={`r2-${i}`}>
              <span className="ll-card-icon">{item.icon}</span>
              <span className="ll-card-label">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LearningLogos;
