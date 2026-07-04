import React, { useState, useEffect } from 'react';
import './SectionIndicator.css';

const sections = [
  { id: 'home', title: 'HERO' },
  { id: 'about-us', title: 'ABOUT US' },
  { id: 'learning', title: 'LEARNING' },
  { id: 'past-events', title: 'PAST EVENTS' },
  { id: 'live-events', title: 'LIVE EVENTS' },
  { id: 'our-department', title: 'OUR DEPARTMENT' },
  { id: 'our-team', title: 'OUR TEAM' },
  { id: 'sponsors', title: 'SPONSORS' },
  { id: 'join', title: 'JOIN US' }
];

const SectionIndicator = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 2;
      
      let currentIdx = 0;
      for (let i = 0; i < sections.length; i++) {
        const el = document.getElementById(sections[i].id);
        if (el) {
          const top = el.offsetTop;
          const bottom = top + el.offsetHeight;
          if (scrollPosition >= top && scrollPosition <= bottom) {
            currentIdx = i;
            break;
          }
        }
      }
      
      // Handle case where we might be between sections or at the very bottom
      if (currentIdx === 0 && window.scrollY > window.innerHeight) {
        // Find the closest section above the fold
        for (let i = sections.length - 1; i >= 0; i--) {
          const el = document.getElementById(sections[i].id);
          if (el && el.offsetTop < scrollPosition) {
            currentIdx = i;
            break;
          }
        }
      }

      setActiveIndex(currentIdx);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Init
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activeSection = sections[activeIndex];
  const numString = (activeIndex + 1).toString().padStart(2, '0');

  return (
    <div className="global-section-indicator">
      <div className="indicator-content">
        <span className="indicator-number">{numString}</span>
        <span className="indicator-slash"> / </span>
        <span className="indicator-title">{activeSection.title}</span>
      </div>
    </div>
  );
};

export default SectionIndicator;
