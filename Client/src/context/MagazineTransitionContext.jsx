import React, { createContext, useContext, useState, useEffect } from 'react';

const MagazineTransitionContext = createContext();

export const useMagazineTransition = () => {
  return useContext(MagazineTransitionContext);
};

export const MagazineTransitionProvider = ({ children }) => {
  // 'idle' | 'pullingDown' | 'rollingUp'
  const [transitionState, setTransitionState] = useState('idle');
  const [targetRoute, setTargetRoute] = useState(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const triggerExit = (route) => {
    if (!isDesktop) return false;
    setTargetRoute(route);
    setTransitionState('rollingUp');
    return true; // Indicates transition was triggered
  };

  return (
    <MagazineTransitionContext.Provider value={{
      transitionState,
      setTransitionState,
      targetRoute,
      setTargetRoute,
      isDesktop,
      triggerExit
    }}>
      {children}
    </MagazineTransitionContext.Provider>
  );
};
