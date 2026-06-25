import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import './TriplePulley.css';

/**
 * Triple Pulley System — GSAP Kinematic Animation
 * Mechanical Advantage = 3.
 * Movable block is supported by 3 rope segments.
 * If movable block lifts by dy, the pull rope must move by 3*dy.
 */
const TriplePulley = ({ width = 340, running = true, speed = 2 }) => {
  const pulley1Ref = useRef(null); // Top Left
  const pulley2Ref = useRef(null); // Top Right
  const pulley3Ref = useRef(null); // Bottom Movable
  const weightRef  = useRef(null); // Movable block + weight
  const ropePathRef= useRef(null); // Main rope
  const pullEndRef = useRef(null); // Pull handle
  const tlRef      = useRef(null);

  useEffect(() => {
    if (!running) { tlRef.current?.pause(); return; }

    const proxy = { y: 220 }; // Movable block initial Y
    const minY = 90;          // Highest point
    const maxY = 220;         // Lowest point
    const dy = maxY - minY;   // Total travel = 130

    // Pulley Radii
    const R = 15;
    const C = 2 * Math.PI * R; // Circumference = 94.24

    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    tlRef.current = tl;

    // We animate proxy.y from 220 down to 90 (moving up)
    tl.to(proxy, {
      y: minY,
      duration: speed,
      ease: "power2.inOut",
      onUpdate: () => {
        const Y = proxy.y;
        
        // When block moves up by (maxY - Y), rope pulled is 3 * (maxY - Y)
        const ropePulled = 3 * (maxY - Y);
        const pullY = maxY + ropePulled * 0.8; // scaled pull just to fit in view nicely
        
        // Update Weight Group Translation
        gsap.set(weightRef.current, { y: Y - maxY });
        
        // Update Pull Handle
        gsap.set(pullEndRef.current, { y: pullY - maxY });

        // Update Pulleys Rotation based on strict string constraint kinematics
        // When block moves up by x = (maxY - Y):
        // P1 (Top Left) sees x amount of rope pass over it. Rotates CLOCKWISE.
        // P3 (Movable) sees 2x amount of rope pass UNDER it. Rotates COUNTER-CLOCKWISE.
        // P2 (Top Right) sees 3x amount of rope pass over it. Rotates CLOCKWISE.
        
        const angle1 =  (1 * (maxY - Y) / C) * 360; // 1x CW
        const angle3 = -(2 * (maxY - Y) / C) * 360; // 2x CCW
        const angle2 =  (3 * (maxY - Y) / C) * 360; // 3x CW

        gsap.set(pulley3Ref.current, { rotation: angle3, transformOrigin: "50% 50%" });
        gsap.set(pulley2Ref.current, { rotation: angle2, transformOrigin: "50% 50%" });
        gsap.set(pulley1Ref.current, { rotation: angle1, transformOrigin: "50% 50%" });

        // Draw Dynamic Rope
        // Top Left P1 Center: (130, 50). Tangents: x=115, x=145
        // Bottom P3 Center: (160, Y). Tangents: x=145, x=175
        // Top Right P2 Center: (190, 50). Tangents: x=175, x=205
        
        // Anchor at bottom block left side (115, Y - 15)
        // Up to P1 (115, 50)
        // Arc over P1 to (145, 50)
        // Down to P3 (145, Y)
        // Arc under P3 to (175, Y)
        // Up to P2 (175, 50)
        // Arc over P2 to (205, 50)
        // Down to pull handle (205, pullY)

        const path = `
          M 115 ${Y - 5}
          L 115 50
          A ${R} ${R} 0 0 1 145 50
          L 145 ${Y}
          A ${R} ${R} 0 0 0 175 ${Y}
          L 175 50
          A ${R} ${R} 0 0 1 205 50
          L 205 ${pullY}
        `;
        ropePathRef.current.setAttribute("d", path);
      }
    });

    return () => tl.kill();
  }, [running, speed]);

  const h = 420;

  return (
    <div className="tp-wrapper" style={{ width }}>
      <svg
        width={width} height={h}
        viewBox={`0 0 ${width} ${h}`}
        xmlns="http://www.w3.org/2000/svg"
        className="tp-svg"
      >
        <defs>
          <linearGradient id="tp-metal" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#222" />
            <stop offset="50%" stopColor="#555" />
            <stop offset="100%" stopColor="#111" />
          </linearGradient>
          <radialGradient id="tp-pulley" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff4422" />
            <stop offset="100%" stopColor="#880000" />
          </radialGradient>
          <filter id="tp-glow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* BACKGROUND */}
        <rect width={width} height={h} fill="#050505" rx="12" />

        {/* CEILING SUPPORT */}
        <rect x="80" y="20" width="160" height="15" rx="3" fill="url(#tp-metal)" stroke="#ff1f01" strokeWidth="1" />
        <line x1="80" y1="35" x2="240" y2="35" stroke="#ff1f01" strokeWidth="2" opacity="0.5" />
        {[100, 160, 220].map((x, i) => (
          <circle key={i} cx={x} cy="27" r="3" fill="#000" stroke="#ff1f01" strokeWidth="0.8" />
        ))}

        {/* CEILING MOUNTS FOR PULLEYS */}
        {/* Mount for P1 (130, 50) */}
        <path d="M 125 35 L 125 50 L 135 50 L 135 35 Z" fill="#111" stroke="#ff1f01" strokeWidth="1.5" />
        {/* Mount for P2 (190, 50) */}
        <path d="M 185 35 L 185 50 L 195 50 L 195 35 Z" fill="#111" stroke="#ff1f01" strokeWidth="1.5" />

        {/* DYNAMIC ROPE */}
        <path ref={ropePathRef} fill="none" stroke="#ccc" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 3" />

        {/* TOP LEFT PULLEY (P1) */}
        <g ref={pulley1Ref} transform="translate(130, 50)">
          <circle cx="0" cy="0" r="30" fill="rgba(0,0,0,0.01)" /> {/* Forces BBox for all browsers */}
          <circle cx="0" cy="0" r="15" fill="url(#tp-pulley)" stroke="#ff1f01" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="4" fill="#050505" stroke="#ff1f01" strokeWidth="1" />
          {/* Pulley spokes */}
          {Array.from({ length: 4 }).map((_, i) => (
            <line key={i} x1="-15" y1="0" x2="15" y2="0" stroke="#111" strokeWidth="2" transform={`rotate(${i * 45})`} />
          ))}
        </g>

        {/* TOP RIGHT PULLEY (P2) */}
        <g ref={pulley2Ref} transform="translate(190, 50)">
          <circle cx="0" cy="0" r="30" fill="rgba(0,0,0,0.01)" />
          <circle cx="0" cy="0" r="15" fill="url(#tp-pulley)" stroke="#ff1f01" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="4" fill="#050505" stroke="#ff1f01" strokeWidth="1" />
          {Array.from({ length: 4 }).map((_, i) => (
            <line key={i} x1="-15" y1="0" x2="15" y2="0" stroke="#111" strokeWidth="2" transform={`rotate(${i * 45})`} />
          ))}
        </g>

        {/* MOVABLE BLOCK & WEIGHT GROUP */}
        <g ref={weightRef} transform="translate(0, 0)">
          {/* Horizontal Support Rod for Movable System */}
          <rect x="105" y="190" width="65" height="10" rx="3" fill="url(#tp-metal)" stroke="#ff1f01" strokeWidth="1" />
          {[115, 145, 160].map((x, i) => (
            <circle key={i} cx={x} cy="195" r="2.5" fill="#000" stroke="#ff1f01" strokeWidth="0.8" />
          ))}

          {/* Left Mount for Rope Anchor */}
          <path d="M 112 200 L 112 215 L 118 215 L 118 200 Z" fill="#111" stroke="#ff1f01" strokeWidth="1" />
          {/* Rope Anchor point */}
          <circle cx="115" cy="215" r="4" fill="#ccc" />

          {/* Right Mount for Pulley Axle */}
          <path d="M 155 200 L 155 220 L 165 220 L 165 200 Z" fill="#111" stroke="#ff1f01" strokeWidth="1" />
          
          {/* Bottom Pulley (P3) (Center at 160, 220) */}
          <g ref={pulley3Ref} transform="translate(160, 220)">
            <circle cx="0" cy="0" r="30" fill="rgba(0,0,0,0.01)" />
            <circle cx="0" cy="0" r="15" fill="url(#tp-pulley)" stroke="#ff1f01" strokeWidth="1.5" filter="url(#tp-glow)" />
            <circle cx="0" cy="0" r="4" fill="#050505" stroke="#ff1f01" strokeWidth="1" />
            {Array.from({ length: 4 }).map((_, i) => (
              <line key={i} x1="-15" y1="0" x2="15" y2="0" stroke="#111" strokeWidth="2" transform={`rotate(${i * 45})`} />
            ))}
          </g>

          {/* Pulley Axle Mount Point */}
          <circle cx="160" cy="220" r="3" fill="#ff1f01" />

          {/* Load Hook hanging from the balanced center of mass (x=145) */}
          <path d="M 145 200 L 145 250 Q 145 260 135 260" fill="none" stroke="#ff1f01" strokeWidth="3" />
          <circle cx="145" cy="200" r="3" fill="#ff1f01" />

          {/* Heavy Weight (Centered at x=145) */}
          <rect x="110" y="260" width="70" height="60" rx="4" fill="#111" stroke="#ff1f01" strokeWidth="2" />
          <text x="145" y="295" fontSize="18" fill="#ff1f01" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
            100kg
          </text>
        </g>

        {/* PULL HANDLE */}
        <g ref={pullEndRef} transform="translate(0, 0)">
          <path d="M 190 220 L 220 220 L 215 230 L 195 230 Z" fill="#ff1f01" />
          <rect x="202" y="230" width="6" height="20" fill="#ff1f01" />
        </g>

        {/* UI LABELS */}
        <text x="170" y="15" fontSize="10" fill="#ff1f01" textAnchor="middle" fontFamily="'Orbitron', monospace" letterSpacing="1" opacity="0.8">
          TRIPLE PULLEY SYSTEM (M.A = 3)
        </text>
        
        <text x="50" y="200" fontSize="8" fill="#ff1f01" fontFamily="monospace" opacity="0.6">
          W = mg
        </text>
        <line x1="60" y1="210" x2="60" y2="240" stroke="#ff1f01" strokeWidth="1" opacity="0.6" markerEnd="url(#tp-arrow)" />

        <text x="240" y="200" fontSize="8" fill="#ff1f01" fontFamily="monospace" opacity="0.6">
          E = W/3
        </text>
        <line x1="230" y1="210" x2="230" y2="240" stroke="#ff1f01" strokeWidth="1" opacity="0.6" markerEnd="url(#tp-arrow)" />

        <defs>
          <marker id="tp-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#ff1f01" opacity="0.6" />
          </marker>
        </defs>

      </svg>
    </div>
  );
};

export default TriplePulley;
