import React, { useRef, useEffect, useId, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import gsap from 'gsap';
import { FaCog } from 'react-icons/fa';

/* ══════════════════════════════════════════════════
   GSAP Gear — stable uid via useId hook
   ══════════════════════════════════════════════════ */
export const GearSVG = ({ size = 80, speed = 10, reverse = false, opacity = 1, startRotation = 0, style = {}, onScroll = false }) => {
  const gRef   = useRef(null);
  const baseId = useId().replace(/:/g, '');          // stable, unique, colon-free
  const uid    = `g${baseId}`;

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
    
    let anim;
    if (onScroll) {
      anim = gsap.to(gRef.current, {
        rotation: reverse ? -1800 : 1800, // Very fast rotation
        transformOrigin: '50% 50%',
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.1, // sensitive and fast
        }
      });
    } else {
      anim = gsap.to(gRef.current, {
        rotation: reverse ? -360 : 360,
        transformOrigin: '50% 50%',          
        duration: speed,
        repeat: -1,
        ease: 'none',
      });
    }
    return () => {
      if (anim) anim.kill();
    };
  }, [speed, reverse, onScroll]);

  return (
    <svg
      ref={gRef}
      width={size} height={size} viewBox="0 0 100 100"
      style={{ opacity, display: 'block', flexShrink: 0, ...style }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={`${uid}bg`} cx="40%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#4a0000" />
          <stop offset="50%"  stopColor="#1a0000" />
          <stop offset="100%" stopColor="#050000" />
        </radialGradient>
        <radialGradient id={`${uid}bs`} cx="35%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#ff4422" />
          <stop offset="100%" stopColor="#aa1100" />
        </radialGradient>
        <filter id={`${uid}gw`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Group everything inside and apply the static offset rotation for meshing */}
      <g transform={`rotate(${startRotation} 50 50)`}>
        {/* Gear body */}
        <polygon points={toothPoints}
          fill={`url(#${uid}bg)`} stroke="#ff1f01" strokeWidth="1.2"
          filter={`url(#${uid}gw)`} />

        {/* Dashed inner ring */}
        <circle cx="50" cy="50" r={innerR + 4}
          fill="none" stroke="#ff1f01" strokeWidth="0.8" opacity="0.5" strokeDasharray="3 2" />

        {/* Inner fill */}
        <circle cx="50" cy="50" r={innerR}
          fill="#0a0000" stroke="#ff1f01" strokeWidth="1.2" />

        {/* Spokes */}
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={i}
            x1={50 + (innerR + 1) * Math.cos(i * Math.PI / 3)}
            y1={50 + (innerR + 1) * Math.sin(i * Math.PI / 3)}
            x2={50 + (innerR - 5) * Math.cos(i * Math.PI / 3)}
            y2={50 + (innerR - 5) * Math.sin(i * Math.PI / 3)}
            stroke="#ff1f01" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
        ))}

        {/* Boss hub */}
        <circle cx="50" cy="50" r={bossR}
          fill={`url(#${uid}bs)`} stroke="#ff3311" strokeWidth="1" />

        {/* Center hole */}
        <circle cx="50" cy="50" r={holeR}
          fill="#050505" stroke="#ff1f01" strokeWidth="0.8" />

        {/* Highlight glint */}
        <ellipse cx="44" cy="44" rx="4" ry="2.5"
          fill="rgba(255,80,30,0.25)" transform="rotate(-30,44,44)" />
      </g>
    </svg>
  );
};

/* ══════════════════════════════════════════════════
   Heading Flat Gear (FaCog) for on-scroll rotation
   ══════════════════════════════════════════════════ */
export const HeadingGearIcon = ({ size = 28, opacity = 0.9, style = {} }) => {
  const gRef = useRef(null);

  useEffect(() => {
    if (!gRef.current) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? scrollY / maxScroll : 0;
      
      const targetRotation = 36000 * progress; // Super fast
      gsap.to(gRef.current, { rotation: targetRotation, duration: 0.1, ease: 'none', transformOrigin: '50% 50%' });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // initialize

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={gRef} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity, ...style }}>
      <FaCog style={{ fontSize: size, color: '#ff1f01' }} />
    </div>
  );
};


/* ══════════════════════════════════════════════════
   Framer Motion scroll-reveal wrapper
   ══════════════════════════════════════════════════ */
export const Reveal = ({ children, delay = 0, direction = 'up', className = '' }) => {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: direction === 'up' ? 36 : 0 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════
   CountUp helper
   ══════════════════════════════════════════════════ */
export const CountUp = ({ end, suffix = '' }) => {
  const [n, setN] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const ob = new IntersectionObserver(([ent]) => {
      if (ent.isIntersecting) {
        ob.disconnect();
        let obj = { val: 0 };
        gsap.to(obj, {
          val: end,
          duration: 2,
          ease: 'power3.out',
          onUpdate() { setN(Math.floor(obj.val)); },
          onComplete() { setN(end); },
        });
      }
    }, { threshold: 0.5 });
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, [end]);

  return <span ref={ref}>{n}{suffix}</span>;
};


