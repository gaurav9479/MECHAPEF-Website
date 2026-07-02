import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMagazineTransition } from '../../context/MagazineTransitionContext';
// Assuming mechapefscroll.png is in assets, we'll use the one the user uploaded earlier, or the default path if they put it there.
import magazineScrollImg from '../../assets/mehapefscroll.png';

const HangingMagazine = () => {
  const { transitionState, setTransitionState, targetRoute, isDesktop } = useMagazineTransition();
  const location = useLocation();
  const navigate = useNavigate();

  // Only render on desktop, and only on home or magazine route
  const isVisibleRoute = location.pathname === '/' || location.pathname === '/magazine';
  if (!isDesktop || !isVisibleRoute) return null;

  const handleClick = () => {
    // Only allow pulling down if we are on the Home page and idle
    if (location.pathname !== '/' || transitionState !== 'idle') return;
    
    // Navigate instantly and let the Magazine page handle the drop-down animation
    navigate('/magazine');
  };

  return (
    <div className="fixed top-0 pointer-events-none flex justify-center z-[10000] hidden lg:flex" style={{ width: '80px', height: '0', right: '15%' }}>
      
      <AnimatePresence>
          <motion.div
            key="hanging-scroll"
            className="absolute z-20 cursor-pointer pointer-events-auto"
            initial={false}
            animate={{
              rotate: [-1.5, 1.5],
              y: transitionState === 'rollingUp' ? -150 : -35,
              x: "-50%",
              scale: 1
            }}
            transition={{
              rotate: { repeat: Infinity, repeatType: "reverse", duration: 2, ease: "easeInOut" },
              y: { duration: 1, ease: "easeOut" }
            }}
            whileHover={location.pathname === '/' && transitionState === 'idle' ? { scale: 1.1 } : {}}
            onClick={handleClick}
            style={{ transformOrigin: "top center", left: '50%' }}
          >
             <img 
                src={magazineScrollImg} 
                alt="MechaPEF Magazine" 
                className="object-contain pointer-events-none drop-shadow-lg"
                style={{ width: '80px' }}
                onError={(e) => { e.target.src = '/mechapefscroll.png'; }} // fallback
             />
          </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default HangingMagazine;
