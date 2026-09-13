import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './LearningLogos.css';

gsap.registerPlugin(ScrollTrigger);

const learningSkills = [
  { id: 'sw', label: 'SolidWorks', icon: '⚙️', desc: '3D CAD modeling, mechanical design assembly, and industrial drafting.', teeth: 24, r: 44, R: 52, angle: 0, d: 133, meshTweak: 0 },
  { id: 'ac', label: 'AutoCAD', icon: '🔧', desc: 'Precision 2D engineering blueprinting, schematic drafting, and layouts.', teeth: 18, r: 33, R: 40, angle: 60, d: 122, meshTweak: 0 },
  { id: 'as', label: 'ANSYS', icon: '🔩', desc: 'Finite element structural stress mapping, thermal loads, and CFD dynamics.', teeth: 30, r: 55, R: 64, angle: 120, d: 144, meshTweak: 0 },
  { id: 'ar', label: 'Arduino', icon: '🤖', desc: 'Sensory feedback control, actuator programming, and embedded robotics.', teeth: 16, r: 30, R: 37, angle: 180, d: 118, meshTweak: 0 },
  { id: 'ml', label: 'MATLAB', icon: '🖥️', desc: 'Numerical matrix processing design, control loops, and feedback algorithms.', teeth: 12, r: 22, R: 28, angle: 240, d: 111, meshTweak: 15 },
  { id: 'ev', label: 'EV Design', icon: '🚗', desc: 'Automotive battery packs mapping, electric drivetrains, and motor controllers.', teeth: 20, r: 37, R: 44, angle: 300, d: 126, meshTweak: 9 }
];

const Gear = ({ teeth, r, R, stroke = '#ff1f01', fill = 'url(#gearGrad)' }) => {
  const toothPoints = Array.from({ length: teeth }).map((_, i) => {
    const a0 = (i / teeth) * Math.PI * 2;
    const a1 = a0 + (0.42 / teeth) * Math.PI * 2;
    const a2 = a0 + (0.58 / teeth) * Math.PI * 2;
    const a3 = a0 + (1.0 / teeth) * Math.PI * 2;
    const pt = (ang, rad) => `${rad * Math.cos(ang)},${rad * Math.sin(ang)}`;
    return `${pt(a0, r)} ${pt(a1, R)} ${pt(a2, R)} ${pt(a3, r)}`;
  }).join(' ');

  const innerR = r - 8;
  const bossR = innerR * 0.4;

  return (
    <>
      {/* Outer gear shape */}
      <polygon 
        points={toothPoints}
        fill={fill} 
        stroke={stroke} 
        strokeWidth="1.2"
        filter="url(#glow)"
      />
      {/* Pitch circle accent */}
      <circle cx="0" cy="0" r={r} fill="none" stroke={stroke} strokeWidth="0.8" opacity="0.3" strokeDasharray="3 2" />
      {/* Center structural hole */}
      <circle cx="0" cy="0" r={innerR} fill="#030303" stroke={stroke} strokeWidth="1.2" />
      {/* Inner spoke circle */}
      <circle cx="0" cy="0" r={bossR} fill="rgba(255, 31, 1, 0.2)" stroke={stroke} strokeWidth="0.8" />
      {/* Spoke paths */}
      {Array.from({ length: 4 }).map((_, i) => (
        <line 
          key={i} 
          x1={0} y1={0} 
          x2={(innerR - 1) * Math.cos(i * Math.PI / 2)} 
          y2={(innerR - 1) * Math.sin(i * Math.PI / 2)} 
          stroke={stroke} 
          strokeWidth="1" 
          opacity="0.5" 
        />
      ))}
    </>
  );
};

const LearningLogos = () => {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Trigger burst of sparks at client pointer coordinates
  const triggerSparks = (x, y) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const localX = x - rect.left;
    const localY = y - rect.top;
    
    for (let i = 0; i < 15; i++) {
      const spark = document.createElement('div');
      spark.className = 'hud-spark-particle';
      spark.style.left = `${localX}px`;
      spark.style.top = `${localY}px`;
      
      const angle = Math.random() * Math.PI * 2;
      const velocity = 35 + Math.random() * 45;
      const tx = Math.cos(angle) * velocity;
      const ty = Math.sin(angle) * velocity;
      const size = 3 + Math.random() * 4;
      
      spark.style.width = `${size}px`;
      spark.style.height = `${size}px`;
      
      container.appendChild(spark);
      
      gsap.to(spark, {
        x: tx,
        y: ty,
        opacity: 0,
        scale: 0,
        duration: 0.4 + Math.random() * 0.4,
        ease: 'power2.out',
        onComplete: () => spark.remove()
      });
    }
  };

  useEffect(() => {
    if (isMobile) return;

    let ctx;
    const timer = setTimeout(() => {
      ctx = gsap.context(() => {
        const svg = svgRef.current;
        if (!svg) return;

        // Gears
        const driverGear = svg.querySelector('#gear-driver');
        const centralCore = svg.querySelector('#central-core-gear');

        // HUD DOM elements
        const hudIdle = containerRef.current.querySelector('.hud-idle');
        const hudActive = containerRef.current.querySelector('.hud-skill-details');
        const hudIcon = containerRef.current.querySelector('.hud-icon-wrap');
        const hudTitle = containerRef.current.querySelector('.hud-skill-details h3');
        const hudDesc = containerRef.current.querySelector('.hud-skill-details p');
        const weldedCounter = containerRef.current.querySelector('.hud-welded-counter');

        // Driver gear teeth
        const teethDriver = 48;

        // Set up pinned ScrollTrigger timeline
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: () => '+=' + (learningSkills.length * 90) + '%',
            pin: true,
            scrub: 1,
            pinSpacing: true,
            invalidateOnRefresh: true,
          }
        });

        // Helper to calculate mathematically perfect gear mesh offset
        const getGearOffset = (angle, teethCount, tweak) => {
          const Td = 48; // Driver teeth
          const Ts = teethCount;
          // rot_s = (1 + Td/Ts)*theta + 180 + 180/Ts + tweak
          return (1 + Td / Ts) * angle + 180 + 180 / Ts + (tweak || 0);
        };

        tl.to(driverGear, { rotation: 1080, transformOrigin: "50% 50%", ease: 'none', duration: 1 }, 0);
        tl.to(centralCore, { rotation: 1080, transformOrigin: "50% 50%", ease: 'none', duration: 1 }, 0);

        learningSkills.forEach((skill) => {
          const satelliteGear = svg.querySelector(`#gear-${skill.id}`);
          const gearRatio = teethDriver / skill.teeth;
          const initialOffset = getGearOffset(skill.angle, skill.teeth, skill.meshTweak);
          const targetRotation = initialOffset - 1080 * gearRatio;
          
          tl.to(satelliteGear, { rotation: targetRotation, transformOrigin: "50% 50%", ease: 'none', duration: 1 }, 0);
        });

        const highlightSkill = (idx) => {
          const allGears = svg.querySelectorAll('.gear-node');
          allGears.forEach(g => g.classList.remove('gear-active'));

          if (idx === -1) {
            hudIdle.style.display = 'flex';
            hudActive.style.display = 'none';
            weldedCounter.textContent = 'SYSTEM INTEGRATION: 0/6';
          } else {
            const skill = learningSkills[idx];
            hudIdle.style.display = 'none';
            hudActive.style.display = 'block';
            hudIcon.textContent = skill.icon;
            hudTitle.textContent = skill.label;
            hudDesc.textContent = skill.desc;
            weldedCounter.textContent = `SYSTEM INTEGRATION: ${idx + 1}/6`;

            const activeGear = svg.querySelector(`#gear-${skill.id}`);
            if (activeGear) activeGear.classList.add('gear-active');
          }
        };

        tl.call(() => highlightSkill(-1), null, 0.08);
        tl.call(() => highlightSkill(0), null, 0.22);
        tl.call(() => highlightSkill(1), null, 0.38);
        tl.call(() => highlightSkill(2), null, 0.52);
        tl.call(() => highlightSkill(3), null, 0.68);
        tl.call(() => highlightSkill(4), null, 0.82);
        tl.call(() => highlightSkill(5), null, 0.95);

      }, containerRef);

      ScrollTrigger.refresh();
    }, 300);

    return () => {
      clearTimeout(timer);
      if (ctx) ctx.revert();
    };
  }, [isMobile]);

  const handleGearClick = (skill, e) => {
    triggerSparks(e.clientX, e.clientY);

    const hudIdle = containerRef.current.querySelector('.hud-idle');
    const hudActive = containerRef.current.querySelector('.hud-skill-details');
    const hudIcon = containerRef.current.querySelector('.hud-icon-wrap');
    const hudTitle = containerRef.current.querySelector('.hud-skill-details h3');
    const hudDesc = containerRef.current.querySelector('.hud-skill-details p');
    const weldedCounter = containerRef.current.querySelector('.hud-welded-counter');

    hudIdle.style.display = 'none';
    hudActive.style.display = 'block';
    hudIcon.textContent = skill.icon;
    hudTitle.textContent = skill.label;
    hudDesc.textContent = skill.desc;
    
    const svg = svgRef.current;
    if (svg) {
      svg.querySelectorAll('.gear-node').forEach(g => g.classList.remove('gear-active'));
      const activeGear = svg.querySelector(`#gear-${skill.id}`);
      if (activeGear) activeGear.classList.add('gear-active');
    }
  };

  const [mobileActiveSkill, setMobileActiveSkill] = useState(null);
  const [mobileAssembledIds, setMobileAssembledIds] = useState([]);

  const handleMobileActiveCard = (skill, e) => {
    triggerSparks(e.clientX, e.clientY);
    setMobileActiveSkill(skill);
    setMobileAssembledIds(prev => prev.includes(skill.id) ? prev : [...prev, skill.id]);
  };

  return (
    <section ref={containerRef} className="ll-section">
      <div className="ll-grid-bg"></div>
      
      <div className="ll-header">
        <span className="ll-sec-tag">POWER TRANSMISSION SIMULATOR</span>
        <h2 className="ll-title">What We Learn</h2>
        <p className="ll-subtitle">Engage gears to power up advanced engineering skills & technologies</p>
      </div>

      {!isMobile ? (

        <div className="ll-desktop-container">
          <div className="ll-blueprint-view">
            <svg 
              ref={svgRef} 
              className="ll-svg-workspace" 
              viewBox="0 0 640 440"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient id="gearGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#1a0a0a" />
                  <stop offset="100%" stopColor="#080303" />
                </radialGradient>
                <radialGradient id="driverGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#250505" />
                  <stop offset="100%" stopColor="#0a0000" />
                </radialGradient>
                <filter id="glow" x="-25%" y="-25%" width="150%" height="150%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Blueprint Layout Grid Lines */}
              <circle cx="320" cy="220" r="160" fill="none" stroke="rgba(255, 31, 1, 0.04)" strokeDasharray="5 5" />
              <line x1="320" y1="20" x2="320" y2="420" stroke="rgba(255, 31, 1, 0.03)" strokeDasharray="5 5" />
              <line x1="20" y1="220" x2="620" y2="220" stroke="rgba(255, 31, 1, 0.03)" strokeDasharray="5 5" />

              {/* Center Core Gears Wrapper */}
              <g id="central-core-gear" transform="translate(320, 220)">
                <circle cx="0" cy="0" r="40" fill="rgba(255,31,1,0.05)" stroke="#ff1f01" strokeWidth="1" strokeDasharray="6 3" />
                <path d="M-20,0 L20,0 M0,-20 L0,20" stroke="#ff1f01" strokeWidth="1" opacity="0.6" />
              </g>

              {/* MAIN DRIVER GEAR (Center) */}
              <g transform="translate(320, 220)">
                <g 
                  id="gear-driver" 
                  transform="rotate(0)"
                >
                  <Gear teeth={48} r={88} R={100} stroke="#ff1f01" fill="url(#driverGrad)" />
                  {/* Tech logo inside driver gear */}
                  <circle cx="0" cy="0" r="28" fill="#000" stroke="#ff1f01" strokeWidth="1.2" />
                  <text x="0" y="5" textAnchor="middle" fill="#ff1f01" fontSize="16" fontWeight="bold" filter="url(#glow)">society</text>
                </g>
              </g>

              {/* SATELLITE SKILL GEARS */}
              {learningSkills.map((sk) => {
                // Calculate position using target angles
                const rad = sk.angle * Math.PI / 180;
                const gx = 320 + sk.d * Math.cos(rad);
                const gy = 220 + sk.d * Math.sin(rad);

                return (
                  <g 
                    key={sk.id}
                    transform={`translate(${gx}, ${gy})`}
                    onClick={(e) => handleGearClick(sk, e)}
                  >
                    <g
                      id={`gear-${sk.id}`}
                      className="gear-node"
                      transform={`rotate(${((1 + 48 / sk.teeth) * sk.angle + 180 + 180 / sk.teeth + (sk.meshTweak || 0))})`}
                    >
                      <Gear teeth={sk.teeth} r={sk.r} R={sk.R} stroke="rgba(255,255,255,0.2)" />
                      {/* Gear HUD overlay */}
                      <circle cx="0" cy="0" r={sk.r - 1} className="gear-active-border" fill="none" stroke="#ff1f01" strokeWidth="1.5" opacity="0" filter="url(#glow)" />
                      
                      {/* Core socket connector */}
                      <circle cx="0" cy="0" r="16" fill="#030303" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                      <text 
                        x="0" y="5" 
                        textAnchor="middle" 
                        fontSize="13" 
                        fill="rgba(255,255,255,0.7)"
                        style={{ pointerEvents: 'none' }}
                      >
                        {sk.icon}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* HUD Status Panel */}
          <div className="ll-hud-panel">
            <div className="hud-header">
              <div className="hud-scanner-line"></div>
              <h4>GEARBOX HUD STATUS</h4>
              <span className="hud-laser-indicator">DRIVE ON</span>
            </div>

            <div className="hud-content">
              {/* Idle screen */}
              <div className="hud-idle" style={{ display: 'flex' }}>
                <div className="hud-logo-watermark">⚙️</div>
                <p>Scroll down or tap on any satellite gear to analyze its transmission data.</p>
                <p className="hud-hint">System ready. Waiting for input...</p>
              </div>

              {/* Active skill details */}
              <div className="hud-skill-details" style={{ display: 'none', width: '100%' }}>
                <div className="hud-icon-wrap">⚙️</div>
                <h3>Skill Name</h3>
                <div className="hud-divider"></div>
                <p>Description goes here...</p>
                <div className="hud-status">
                  <span className="blink-dot"></span> CONNECTION STATUS: SECURED
                </div>
              </div>
            </div>

            <div className="hud-footer">
              <div>MECH DYNAMICS v3.12</div>
              <div className="hud-welded-counter">SYSTEM INTEGRATION: 0/6</div>
            </div>
          </div>
        </div>
      ) : (

        <div className="ll-mobile-view">
          <div className="ll-mobile-grid">
            {learningSkills.map((sk) => {
              const isAssembled = mobileAssembledIds.includes(sk.id);
              const isActive = mobileActiveSkill?.id === sk.id;
              return (
                <div 
                  key={sk.id}
                  className={`ll-mobile-card ${isAssembled ? 'assembled' : ''} ${isActive ? 'active' : ''}`}
                  onClick={(e) => handleMobileActiveCard(sk, e)}
                >
                  <div className="m-card-top">
                    <span className="m-card-icon">{sk.icon}</span>
                    <span className="m-card-label">{sk.label}</span>
                    {isAssembled && <span className="m-card-check">✓</span>}
                  </div>
                  {isActive && (
                    <div className="m-card-desc">
                      <p>{sk.desc}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="ll-mobile-footer">
            <p>💡 Tap on any system to power-up & inspect it!</p>
          </div>
        </div>
      )}
    </section>
  );
};

export default LearningLogos;
