import gsap from 'gsap';
import ScrollToPlugin from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

export const scrollToId = (id, offset = 80, delay = 0) => {
  const performScroll = () => {
    const element = document.getElementById(id);
    if (element) {
      // Calculate true offset based on element position
      const elementPosition = element.getBoundingClientRect().top + (window.scrollY || window.pageYOffset);
      const offsetPosition = elementPosition - offset;

      gsap.to(window, {
        duration: 1.2,
        scrollTo: { y: offsetPosition, autoKill: false },
        ease: "power3.inOut"
      });
      return true;
    }
    return false;
  };

  if (delay > 0) {
    setTimeout(performScroll, delay);
    return;
  }

  if (performScroll()) {
    // Fire a correction after 800ms just in case GSAP stopped short
    setTimeout(performScroll, 800);
  } else {
    let attempts = 0;
    const interval = setInterval(() => {
      const success = performScroll();
      attempts++;
      if (success) {
        clearInterval(interval);
        setTimeout(performScroll, 800);
      } else if (attempts >= 30) {
        clearInterval(interval);
      }
    }, 100);
  }
};
