import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMagazineTransition } from '../../context/MagazineTransitionContext';
import hookImg from '../../assets/mehapefscroll.png';
import Magazine from './Magazine';

const MagazineContainer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { transitionState, setTransitionState, isDesktop } = useMagazineTransition();

  const isMagazineRoute = location.pathname.startsWith('/magazine');
  const isOpen = isMagazineRoute || transitionState === 'pullingDown';
  const isRollingUp = transitionState === 'rollingUp';

  if (!isDesktop) {
      // Mobile behavior: Magazine is just rendered normally without the shutter
      if (isMagazineRoute) return <Magazine />;
      return null;
  }

  const handleHookClick = () => {
    if (transitionState !== 'idle') return;
    
    if (isMagazineRoute) {
      // Roll the shutter UP and return to Home page
      setTransitionState('rollingUp');
      
      // Navigate instantly so the background route changes to Home
      navigate('/');

      setTimeout(() => {
        setTransitionState('idle');
      }, 1000);
    } else {
      // Drop the shutter DOWN
      setTransitionState('pullingDown');
      
      setTimeout(() => {
        navigate('/magazine');
        
        setTimeout(() => {
          setTransitionState('idle');
        }, 50);
      }, 1000);
    }
  };

  const isDown = transitionState === 'pullingDown' || (isOpen && transitionState !== 'rollingUp');

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: 0, zIndex: 10000 }}>
      <style>{`
        .magazine-shutter::-webkit-scrollbar {
          display: none;
        }
        .magazine-shutter {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {/* The Fixed Hook */}
      <motion.div 
        onClick={handleHookClick}
        style={{ 
          position: 'absolute', 
          top: 0, 
          right: '15%', 
          zIndex: 50, 
          cursor: 'pointer', 
          display: 'flex', 
          justifyContent: 'center', 
          width: '80px',
          transformOrigin: 'top center'
        }}
      >
        <motion.img 
          src={hookImg} 
          alt="Magazine Hook" 
          style={{ 
            width: '100%', 
            objectFit: 'contain', 
            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))',
            transformOrigin: 'top center'
          }}
          animate={{ rotate: [-3, 2, -3] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
          onError={(e) => { e.target.src = '/mechapefscroll.png'; }}
        />
      </motion.div>

      {/* The Rolling Shutter (Magazine) */}
      <AnimatePresence>
        {(isOpen || isRollingUp) && (
          <motion.div
            className="magazine-shutter"
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
              backgroundColor: '#f5f4ef',
              zIndex: 40
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
