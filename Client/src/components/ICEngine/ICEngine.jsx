import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import './ICEngine.css';

/**
 * IC Engine Component — True Kinematic Simulation via GSAP
 *
 * 4-stroke cycle (2 revolutions per cycle):
 *  0°-180°   Intake   (Piston goes down, Intake valve open)
 *  180°-360° Compress (Piston goes up, Valves closed)
 *  360°-540° Power    (Spark at 360°, Piston goes down, Valves closed)
 *  540°-720° Exhaust  (Piston goes up, Exhaust valve open, Smoke)
 */
const ICEngine = ({ width = 340, running = true, rpm = 5 }) => {
  const pistonRef      = useRef(null);
  const connRodRef     = useRef(null);
  const crankRef       = useRef(null);
  const flywheelRef    = useRef(null);
  const intakeRef      = useRef(null);
  const exhaustRef     = useRef(null);
  const sparkRef       = useRef(null);
  const smokeRef       = useRef(null);
  const tlRef          = useRef(null);

  /* A 4-stroke cycle takes 2 full crank revolutions. */
  const cycleTime      = (60 / rpm) * 2;

  useEffect(() => {
    if (!running) { tlRef.current?.pause(); return; }

    const proxy = { angle: 0 };
    const R = 30;   // Crank radius
    const L = 100;  // Connecting rod length
    const Cx = 170; // Crank center X
    const Cy = 250; // Crank center Y
    const WyTDC = Cy - R - L; // Wrist pin Y at Top Dead Center (120)

    const tl = gsap.timeline({ repeat: -1 });
    tlRef.current = tl;

    // 1) Continuous Kinematic Math Animation
    tl.to(proxy, {
      angle: 720,
      duration: cycleTime,
      ease: 'none',
      onUpdate: () => {
        const theta = proxy.angle * (Math.PI / 180);
        
        // Crank pin coordinates
        const Px = Cx + R * Math.sin(theta);
        const Py = Cy - R * Math.cos(theta);
        
        // Wrist pin Y coordinate (constrained to vertical motion at X=Cx)
        const Wy = Py - Math.sqrt(L * L - Math.pow(Px - Cx, 2));

        // Update Crank and Flywheel
        gsap.set(crankRef.current, { rotation: proxy.angle });
        gsap.set(flywheelRef.current, { rotation: proxy.angle });

        // Update Piston (absolute Y relative to SVG due to existing transform)
        gsap.set(pistonRef.current, { y: Wy });

        // Update Connecting Rod (Angle and Y)
        const phi = Math.asin((Px - Cx) / L);
        const phiDeg = phi * (180 / Math.PI);
        
        gsap.set(connRodRef.current, { 
          y: Wy,
          rotation: -phiDeg // SVG clockwise is positive; negative swings bottom to the right
        });
      }
    }, 0);

    // 2) Valve & Combustion Timings
    const c = cycleTime;

    // Intake valve opens during 0°-180° (0 to 0.25 of cycle)
    tl.to(intakeRef.current, { y: 14, duration: c * 0.08, ease: 'power1.inOut' }, 0)
      .to(intakeRef.current, { y: 0,  duration: c * 0.08, ease: 'power1.inOut' }, c * 0.17);

    // Spark flash at 360° (0.5 of cycle)
    tl.to(sparkRef.current, { opacity: 1, scale: 1.6, duration: 0.04, transformOrigin: '50% 50%' }, c * 0.5)
      .to(sparkRef.current, { opacity: 0, scale: 1,   duration: 0.08 }, c * 0.54);

    // Exhaust valve opens during 540°-720° (0.75 to 1.0 of cycle)
    tl.to(exhaustRef.current, { y: 14, duration: c * 0.08, ease: 'power1.inOut' }, c * 0.75)
      .to(exhaustRef.current, { y: 0,  duration: c * 0.08, ease: 'power1.inOut' }, c * 0.92);

    // Smoke effect during Exhaust
    tl.to(smokeRef.current, { opacity: 0.8, y: -20, scale: 1.5, duration: c * 0.12 }, c * 0.75)
      .to(smokeRef.current, { opacity: 0,   y: -35, scale: 2,   duration: c * 0.13 }, c * 0.87);

    return () => tl.kill();
  }, [running, cycleTime]);

  const h = 420;

  return (
    <div className="ice-wrapper" style={{ width }}>
      <svg
        width={width} height={h}
        viewBox={`0 0 ${width} ${h}`}
        xmlns="http://www.w3.org/2000/svg"
        className="ice-svg"
      >
        <defs>
          <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#1a0000" />
            <stop offset="40%"  stopColor="#3a0000" />
            <stop offset="70%"  stopColor="#220000" />
            <stop offset="100%" stopColor="#0d0000" />
          </linearGradient>
          <linearGradient id="pistonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#2a0000" />
            <stop offset="50%"  stopColor="#4a0808" />
            <stop offset="100%" stopColor="#1a0000" />
          </linearGradient>
          <radialGradient id="flyGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#3a0000" />
            <stop offset="100%" stopColor="#0a0000" />
          </radialGradient>
          <radialGradient id="sparkGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#fff8b0" stopOpacity="1" />
            <stop offset="50%"  stopColor="#ff6600" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ff1f01" stopOpacity="0" />
          </radialGradient>
          <filter id="engineGlow">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="redGlow">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* ══ BACKGROUND ══ */}
        <rect width={width} height={h} fill="#050505" rx="12" />

        {/* ══ CYLINDER HEAD ══ */}
        <rect x="100" y="55" width="140" height="30" rx="4"
          fill="url(#metalGrad)" stroke="#ff1f01" strokeWidth="1.5" />
        {[112, 228].map((x, i) => (
          <g key={i}>
            <rect x={x - 8} y="46" width="16" height="10" rx="3"
              fill="#1a0000" stroke="#ff1f01" strokeWidth="1" />
            <circle cx={x} cy="51" r="3" fill="#050505" stroke="#ff1f01" strokeWidth="0.8" />
          </g>
        ))}

        {/* ══ SPARK PLUG ══ */}
        <rect x="162" y="36" width="16" height="22" rx="4"
          fill="#2a0000" stroke="#ff3311" strokeWidth="1.2" />
        <rect x="167" y="30" width="6" height="10" rx="2"
          fill="#111" stroke="#ff1f01" strokeWidth="1" />
        <circle ref={sparkRef} cx="170" cy="65" r="16"
          fill="url(#sparkGrad)" opacity="0" />

        {/* ══ VALVES ══ */}
        <g>
          <rect x="104" y="56" width="10" height="20" rx="2"
            fill="#0a0000" stroke="#ff1f01" strokeWidth="0.8" />
          <g ref={intakeRef}>
            <rect x="107" y="57" width="4" height="22" rx="1.5" fill="#ff1f01" opacity="0.9" />
            <path d="M103 79 L115 79 L112 83 L106 83 Z" fill="#ff1f01" />
          </g>
          <text x="92" y="53" fontSize="8" fill="#ff1f01" opacity="0.6" fontFamily="monospace">IN</text>
        </g>
        <g>
          <rect x="226" y="56" width="10" height="20" rx="2"
            fill="#0a0000" stroke="#ff1f01" strokeWidth="0.8" />
          <g ref={exhaustRef}>
            <rect x="229" y="57" width="4" height="22" rx="1.5" fill="#ff4400" opacity="0.9" />
            <path d="M225 79 L237 79 L234 83 L228 83 Z" fill="#ff4400" />
          </g>
          <text x="238" y="53" fontSize="8" fill="#ff4400" opacity="0.6" fontFamily="monospace">EX</text>
        </g>

        {/* ══ CYLINDER WALLS ══ */}
        <rect x="100" y="85" width="18" height="150" fill="url(#metalGrad)" stroke="#ff1f01" strokeWidth="1.2" />
        <rect x="222" y="85" width="18" height="150" fill="url(#metalGrad)" stroke="#ff1f01" strokeWidth="1.2" />
        {[100, 120, 140, 160, 180, 200, 220].map((y, i) => (
          <line key={i} x1="100" y1={y} x2="118" y2={y} stroke="#ff1f01" strokeWidth="0.4" opacity="0.3" />
        ))}
        {[100, 120, 140, 160, 180, 200, 220].map((y, i) => (
          <line key={i} x1="222" y1={y} x2="240" y2={y} stroke="#ff1f01" strokeWidth="0.4" opacity="0.3" />
        ))}

        {/* ══ ENGINE BLOCK (bottom) ══ */}
        <rect x="88" y="235" width="164" height="16" rx="4"
          fill="url(#metalGrad)" stroke="#ff1f01" strokeWidth="1.5" />
        <rect x="82" y="250" width="176" height="60" rx="6"
          fill="url(#metalGrad)" stroke="#ff1f01" strokeWidth="1.5" />
        {[95, 170, 245].map((x, i) => (
          <circle key={i} cx={x} cy="295" r="4" fill="#050505" stroke="#ff1f01" strokeWidth="1" />
        ))}
        <path d="M88 310 Q170 330 252 310 L252 305 Q170 320 88 305 Z"
          fill="#0d0000" stroke="#ff1f01" strokeWidth="1" />

        {/* ══ KINEMATIC PARTS ══ */}

        {/* Piston Group (Local 0,0 is Wrist Pin at (170, 120)) */}
        <g ref={pistonRef} transform="translate(170, 120)">
          {/* Piston body */}
          <rect x="-52" y="-33" width="104" height="48" rx="4"
            fill="url(#pistonGrad)" stroke="#ff1f01" strokeWidth="1.5" filter="url(#engineGlow)" />
          {/* Piston rings */}
          {[-25, -18, -11].map((y, i) => (
            <rect key={i} x="-51" y={y} width="102" height="3" rx="1"
              fill="none" stroke="#ff3311" strokeWidth="1.2" opacity="0.7" />
          ))}
          {/* Skirt */}
          <rect x="-42" y="14" width="84" height="16" rx="2"
            fill="#1a0000" stroke="#ff1f01" strokeWidth="1" opacity="0.8" />
          {/* Wrist pin */}
          <circle cx="0" cy="0" r="6" fill="#050505" stroke="#ff1f01" strokeWidth="1.2" />
          <circle cx="0" cy="0" r="2.5" fill="#ff1f01" />
          <line x1="-30" y1="-9" x2="30" y2="-9" stroke="#ff1f01" strokeWidth="0.6" opacity="0.4" />
        </g>

        {/* Connecting Rod Group (Local 0,0 is Wrist Pin at (170, 120)) */}
        <g ref={connRodRef} transform="translate(170, 120)">
          <circle cx="0" cy="0" r="120" fill="rgba(0,0,0,0.01)" /> {/* Forces bounding box center to 0,0 */}
          <rect x="-7" y="0" width="14" height="100" rx="5"
            fill="url(#metalGrad)" stroke="#ff1f01" strokeWidth="1.2" />
          {/* Big End (Crank side) */}
          <ellipse cx="0" cy="100" rx="14" ry="10"
            fill="#1a0000" stroke="#ff1f01" strokeWidth="1.5" />
          <circle cx="0" cy="100" r="5" fill="#050505" stroke="#ff3311" strokeWidth="1" />
        </g>

        {/* Crankshaft Group (Local 0,0 is Crank Center at (170, 250)) */}
        <g ref={crankRef} transform="translate(170, 250)">
          <circle cx="0" cy="0" r="60" fill="rgba(0,0,0,0.01)" /> {/* Forces bounding box center to 0,0 */}
          <circle cx="0" cy="0" r="22" fill="#0d0000" stroke="#ff1f01" strokeWidth="2" />
          {/* Crank Pin (TDC is up, so Y=-30) */}
          <circle cx="0" cy="-30" r="8" fill="#ff1f01" opacity="0.9" filter="url(#redGlow)" />
          {/* Counterweight */}
          <path d="M-22 20 Q0 35 22 20 L15 10 Q0 18 -15 10 Z"
            fill="#2a0000" stroke="#ff1f01" strokeWidth="1" />
          <circle cx="0" cy="0" r="5" fill="#050505" stroke="#ff1f01" strokeWidth="1" />
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={i}
              x1={14 * Math.cos(i * Math.PI / 3)} y1={14 * Math.sin(i * Math.PI / 3)}
              x2={19 * Math.cos(i * Math.PI / 3)} y2={19 * Math.sin(i * Math.PI / 3)}
              stroke="#ff1f01" strokeWidth="1.5" opacity="0.5" />
          ))}
        </g>

        {/* ══ SHAFT to Flywheel ══ */}
        <rect x="192" y="246" width="40" height="8" rx="4"
          fill="#1a0000" stroke="#ff1f01" strokeWidth="1" />

        {/* ══ FLYWHEEL (Local 0,0 is (280, 250)) ══ */}
        <g ref={flywheelRef} transform="translate(280, 250)">
          <circle cx="0" cy="0" r="60" fill="rgba(0,0,0,0.01)" /> {/* Forces bounding box center to 0,0 */}
          <circle cx="0" cy="0" r="48" fill="url(#flyGrad)" stroke="#ff1f01" strokeWidth="2" />
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={i}
              x1={16 * Math.cos(i * Math.PI / 4)} y1={16 * Math.sin(i * Math.PI / 4)}
              x2={44 * Math.cos(i * Math.PI / 4)} y2={44 * Math.sin(i * Math.PI / 4)}
              stroke="#ff1f01" strokeWidth="2.5" opacity="0.7" />
          ))}
          <circle cx="0" cy="0" r="42" fill="none" stroke="#ff1f01" strokeWidth="1" opacity="0.4" strokeDasharray="8 4" />
          <circle cx="0" cy="0" r="16" fill="#0a0000" stroke="#ff1f01" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="7" fill="#ff1f01" opacity="0.9" />
          <circle cx="0" cy="0" r="3" fill="#050505" />
        </g>

        {/* ══ PIPES & EXHAUST ══ */}
        <rect x="56" y="62" width="48" height="12" rx="5"
          fill="url(#metalGrad)" stroke="#ff1f01" strokeWidth="1.2" />
        <rect x="46" y="56" width="14" height="22" rx="4"
          fill="#0d0000" stroke="#ff1f01" strokeWidth="1" />
        <text x="52" y="76" fontSize="7" fill="#ff1f01" opacity="0.5" fontFamily="monospace">AIR+FUEL</text>

        <rect x="236" y="62" width="52" height="12" rx="5"
          fill="url(#metalGrad)" stroke="#ff4400" strokeWidth="1.2" />
        <circle ref={smokeRef} cx="298" cy="62" r="7"
          fill="#ff4400" opacity="0" filter="url(#redGlow)" />

        {/* ══ TEXT LABELS ══ */}
        <text x="170" y="20" fontSize="11" fill="#ff1f01" textAnchor="middle"
          fontFamily="'Orbitron', monospace" fontWeight="700" letterSpacing="2" opacity="0.9">
          IC ENGINE — 4 STROKE
        </text>
        <text x="170" y="390" fontSize="9" fill="#ff1f01" textAnchor="middle"
          fontFamily="monospace" opacity="0.5">
          {rpm} RPM
        </text>
        <text x="18" y="130" fontSize="7" fill="#ff1f01" opacity="0.4"
          fontFamily="monospace" transform="rotate(-90,18,130)">CYLINDER</text>

      </svg>

      <div className="ice-strokes">
        {['INTAKE', 'COMPRESS', 'POWER', 'EXHAUST'].map((s, i) => (
          <div key={i} className="ice-stroke-pill">{s}</div>
        ))}
      </div>
    </div>
  );
};

export default ICEngine;
