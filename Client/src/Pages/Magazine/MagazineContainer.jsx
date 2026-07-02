import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMagazineTransition } from '../../context/MagazineTransitionContext';
import Magazine from './Magazine';
import hookImg from '../../assets/mehapefscroll.png';

const MagazineContainer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { transitionState, setTransitionState, isDesktop } = useMagazineTransition();

  const isMagazineRoute = location.pathname === '/magazine';
  const isOpen = isMagazineRoute || transitionState === 'pullingDown';
  const isRollingUp = transitionState === 'rollingUp';

  if (!isDesktop) {
      // Mobile behavior: Magazine is just rendered normally without the shutter
      return null;
  }

  const handleHookClick = () => {
    if (isMagazineRoute || transitionState !== 'idle') return;
    
    // Drop the shutter
    setTransitionState('pullingDown');
    
    setTimeout(() => {
      navigate('/magazine');
      setTransitionState('idle');
    }, 1000);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: 0, zIndex: 10000 }}>
      {/* The Fixed Hook */}
      <div 
        onClick={handleHookClick}
        style={{ 
          position: 'absolute', 
          top: 0, 
          right: '15%', 
          zIndex: 50, 
          cursor: 'pointer', 
          display: 'flex', 
          justifyContent: 'center', 
          width: '80px' 
        }}
      >
        <img 
          src={hookImg} 
          alt="Magazine Hook" 
          style={{ width: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}
          onError={(e) => { e.target.src = '/mechapefscroll.png'; }}
        />
      </div>

      {/* The Rolling Shutter (Magazine) */}
      <AnimatePresence>
        {(isOpen || isRollingUp) && (
          <motion.div
            initial={{ y: '-100vh' }}
            animate={{ y: isRollingUp ? '-100vh' : 0 }}
            exit={{ y: '-100vh' }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} // mechanical easeOut
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100vh',
              overflowY: 'auto',
              backgroundColor: '#f5f4ef'
            }}
          >
            <Magazine />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MagazineContainer;
