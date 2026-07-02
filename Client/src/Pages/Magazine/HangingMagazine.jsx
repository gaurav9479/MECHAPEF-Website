import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import magazineScrollImg from '../../assets/mehapefscroll.png';

const HangingMagazine = () => {
  const [status, setStatus] = useState('hanging'); // 'hanging', 'detached', 'falling', 'fullscreen'
  const navigate = useNavigate();

  const handleClick = () => {
    if (status !== 'hanging') return;
    
    // Step 1: Stop swinging & settle (detached state)
    setStatus('detached');
    
    // Step 2 & 3: Fall and expand after a tiny delay
    setTimeout(() => {
      setStatus('falling');
      
      // Step 4 & 5: Fullscreen & route change
      setTimeout(() => {
        setStatus('fullscreen');
        setTimeout(() => {
            navigate('/magazine');
            // reset state after navigation in case they go back
            setTimeout(() => setStatus('hanging'), 500);
        }, 400); // Wait for fullscreen whiteout
      }, 1200); // Fall duration
    }, 400); // Settle duration
  };

  return (
    <div className="relative pointer-events-none flex justify-center hidden lg:flex" style={{ width: '80px', height: '0', zIndex: 999 }}>

      {/* Magazine Container */}
      <AnimatePresence>
        {status !== 'fullscreen' && (
          <motion.div
            key="magazine"
            className="absolute z-20 cursor-pointer pointer-events-auto"
            initial={false}
            animate={
              status === 'hanging' ? {
                rotate: [-1.5, 1.5],
                y: -35, // Moved up to touch the ceiling
                x: "-50%",
                scale: 1
              } : status === 'detached' ? {
                rotate: 0,
                y: -35,
                x: "-50%",
                scale: 1.1
              } : {
                // Falling state
                y: [-35, 1200], // Fall straight down
                x: "-50%",
                scale: [1.1, 4], 
                rotate: [0, 0], // No rotation, fall straight
                opacity: [1, 1, 0]
              }
            }
            transition={
              status === 'hanging' ? {
                rotate: {
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: 2,
                  ease: "easeInOut"
                },
                duration: 0.5
              } : status === 'detached' ? {
                duration: 0.4,
                ease: "easeOut"
              } : {
                // Falling transition
                duration: 1.2,
                ease: "circIn" // Gravity-like easing
              }
            }
            whileHover={status === 'hanging' ? { scale: 1.1 } : {}}
            onClick={handleClick}
            style={{ transformOrigin: "top center", left: '50%' }}
          >
             <img 
                src={magazineScrollImg} 
                alt="MechaPEF Magazine" 
                className="object-contain pointer-events-none drop-shadow-lg"
                style={{ width: '80px' }}
             />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Transition Overlay */}
      <AnimatePresence>
        {status === 'fullscreen' && (
           <motion.div 
             key="overlay"
             initial={{ y: "-100%" }}
             animate={{ y: 0 }}
             exit={{ opacity: 0 }}
             transition={{ duration: 0.6, ease: "easeOut" }}
             className="fixed inset-0 bg-[#f5f4ef] pointer-events-auto z-[9999]"
           />
        )}
      </AnimatePresence>
    </div>
  );
};

export default HangingMagazine;
