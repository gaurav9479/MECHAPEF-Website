import React, { useEffect, useRef, useId } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './BackgroundGears.css';

gsap.registerPlugin(ScrollTrigger);

const GearSVG = ({ size = 80, scrollMultiplier = 1, reverse = false, opacity = 1, startRotation = 0, style = {} }) => {
  const gRef = useRef(null);
  const baseId = useId().replace(/:/g, '');
  const uid = `g${baseId}`;

  const teeth = 14;
  const R = 42, r = 34, innerR = 22, bossR = 10, holeR = 5;

  const toothPoints = Array.from({ length: teeth }).map((_, i) => {
    const a0 = (i / teeth) * Math.PI * 2;
    const a1 = a0 + (0.4 / teeth) * Math.PI * 2;
    const a2 = a0 + (0.6 / teeth) * Math.PI * 2;
    const a3 = a0 + (1.0 / teeth) * Math.PI * 2;
    const pt = (ang, rad) => `${50 + rad * Math.cos(ang)},${50 + rad * Math.sin(ang)}`;
    return `${pt(a0, r)} ${pt(a1, R)} ${pt(a2, R)} ${pt(a3, r)}`;
  }).join(' ');

  useEffect(() => {
    if (!gRef.current) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? scrollY / maxScroll : 0;
      
      const targetRotation = (reverse ? -360 : 360) * scrollMultiplier * progress;
      gsap.to(gRef.current, { rotation: targetRotation, duration: 0.2, ease: 'power1.out', transformOrigin: '50% 50%' });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // initialize

    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollMultiplier, reverse]);

  return (
    <svg
      ref={gRef}
      width={size} height={size} viewBox="0 0 100 100"
      style={{ opacity, display: 'block', flexShrink: 0, ...style }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={`${uid}bg`} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#4a0000" />
          <stop offset="50%" stopColor="#1a0000" />
          <stop offset="100%" stopColor="#050000" />
        </radialGradient>
        <radialGradient id={`${uid}bs`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ff4422" />
          <stop offset="100%" stopColor="#aa1100" />
        </radialGradient>
        <filter id={`${uid}gw`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <g transform={`rotate(${startRotation} 50 50)`}>
        <polygon points={toothPoints}
          fill={`url(#${uid}bg)`} stroke="#ff1f01" strokeWidth="1.2"
          filter={`url(#${uid}gw)`} />
        <circle cx="50" cy="50" r={innerR + 4}
          fill="none" stroke="#ff1f01" strokeWidth="0.8" opacity="0.5" strokeDasharray="3 2" />
        <circle cx="50" cy="50" r={innerR}
          fill="#0a0000" stroke="#ff1f01" strokeWidth="1.2" />
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={i}
            x1={50 + (innerR + 1) * Math.cos(i * Math.PI / 3)}
            y1={50 + (innerR + 1) * Math.sin(i * Math.PI / 3)}
            x2={50 + (innerR - 5) * Math.cos(i * Math.PI / 3)}
            y2={50 + (innerR - 5) * Math.sin(i * Math.PI / 3)}
            stroke="#ff1f01" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
        ))}
        <circle cx="50" cy="50" r={bossR}
          fill={`url(#${uid}bs)`} stroke="#ff3311" strokeWidth="1" />
        <circle cx="50" cy="50" r={holeR}
          fill="#050505" stroke="#ff1f01" strokeWidth="0.8" />
      </g>
    </svg>
  );
};

const BackgroundGears = () => {
  return (
    <div className="bg-gears-container">
      {/* 
        To make them mesh, rotation speed must be inversely proportional to size.
        Let's pick sizes: 300, 450, 200.
        Base size multiplier let's use 300 as 1x speed.
        Speed for 450 = 300/450 = 0.666
        Speed for 200 = 300/200 = 1.5
      */}
      <div className="bg-gear-wrapper gear-1">
        <GearSVG size={300} scrollMultiplier={1} opacity={0.15} startRotation={0} />
      </div>
      <div className="bg-gear-wrapper gear-2">
        <GearSVG size={450} scrollMultiplier={0.666} reverse opacity={0.15} startRotation={12.85} />
      </div>
      <div className="bg-gear-wrapper gear-3">
        <GearSVG size={200} scrollMultiplier={1.5} opacity={0.15} startRotation={0} />
      </div>
    </div>
  );
};

export default BackgroundGears;
