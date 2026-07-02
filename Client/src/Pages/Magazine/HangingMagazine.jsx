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

  // We only animate the Y axis based on transition state.
  // When idle on Home: y = -35 (just the hanging scroll)
  // When pulling down: y = 800 (pulls down the whole magazine)
  // When on Magazine: y = 0 or stays down (Magazine page will handle its own display, so we just hide this component or keep it there?)
  // Wait, if Magazine page is rendering the bookmark, then this global component can just render the bookmark!

  return (
    <div className="relative pointer-events-none flex justify-center z-[10000] hidden lg:flex" style={{ width: '80px', height: '0' }}>
      
      <AnimatePresence>
          <motion.div
            key="hanging-scroll"
            className="absolute z-20 cursor-pointer pointer-events-auto"
            initial={false}
            animate={
              transitionState === 'pullingDown' || transitionState === 'rollingUp'
              ? {
                  rotate: 0,
                  y: transitionState === 'pullingDown' ? 800 : -35,
                  x: "-50%",
                  scale: 1.1
              }
              : {
                  rotate: [-1.5, 1.5],
                  y: location.pathname === '/magazine' ? 800 : -35,
                  x: "-50%",
                  scale: 1
              }
            }
            transition={
              transitionState === 'pullingDown' || transitionState === 'rollingUp'
              ? { duration: 0.8, ease: "easeInOut" }
              : {
                  rotate: { repeat: Infinity, repeatType: "reverse", duration: 2, ease: "easeInOut" },
                  duration: 0.5
              }
            }
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
