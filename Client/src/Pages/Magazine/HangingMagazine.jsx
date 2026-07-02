import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import magazineScrollImg from '../../assets/magazine_scroll.png';

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
    <div className="flex justify-center pt-0 min-h-screen relative overflow-hidden" style={{ zIndex: 10 }}>
      {/* The Ropes (Always hanging) */}
      <div className="absolute top-0 left-1/2 -translate-x-[25px] w-[2px] h-[120px] bg-[#5c4a3d] shadow-sm z-0 opacity-80"></div>
      <div className="absolute top-0 left-1/2 translate-x-[25px] w-[2px] h-[120px] bg-[#5c4a3d] shadow-sm z-0 opacity-80"></div>

      {/* Magazine Container */}
      <AnimatePresence>
        {status !== 'fullscreen' && (
          <motion.div
            className="absolute z-20 cursor-pointer"
            initial={false}
            animate={
              status === 'hanging' ? {
                rotate: [-1.5, 1.5],
                y: 110, // Hanging from ropes
                x: "-50%",
                scale: 1,
                filter: "drop-shadow(0px 10px 15px rgba(0,0,0,0.3)) brightness(1)"
              } : status === 'detached' ? {
                rotate: 0,
                y: 110,
                x: "-50%",
                scale: 1.05,
                filter: "drop-shadow(0px 20px 25px rgba(0,0,0,0.4)) brightness(1.05)"
              } : {
                // Falling state
                y: [110, window.innerHeight * 0.8], // Fall down
                x: "-50%",
                scale: [1.05, 4], // Enlarge massively
                rotate: [0, 2], // Slight rotation before fullscreen
                opacity: [1, 1, 0],
                filter: "drop-shadow(0px 30px 40px rgba(0,0,0,0.5))"
              }
            }
            transition={
              status === 'hanging' ? {
                rotate: {
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: 2.5,
                  ease: "easeInOut"
                },
                default: { duration: 0.5 }
              } : status === 'detached' ? {
                duration: 0.4,
                ease: "easeOut"
              } : {
                // Falling transition
                duration: 1.2,
                ease: "circIn" // Gravity-like easing
              }
            }
            whileHover={status === 'hanging' ? { 
                scale: 1.03,
                filter: "drop-shadow(0px 15px 20px rgba(0,0,0,0.35)) brightness(1.02)"
            } : {}}
            onClick={handleClick}
            style={{ transformOrigin: "top center", left: '50%' }}
          >
             <img 
                src={magazineScrollImg} 
                alt="MechaPEF Magazine Issue 1" 
                className="w-[180px] object-contain pointer-events-none" 
             />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Transition Overlay */}
      <AnimatePresence>
        {status === 'fullscreen' && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             transition={{ duration: 0.3 }}
             className="fixed inset-0 bg-[#f8f5f0] z-[9999]"
           />
        )}
      </AnimatePresence>
    </div>
  );
};

export default HangingMagazine;
