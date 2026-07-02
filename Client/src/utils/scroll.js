import gsap from 'gsap';
import ScrollToPlugin from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

export const scrollToId = (id, offset = 80, delay = 0, duration = 0.7) => {
  const performScroll = () => {
    const element = document.getElementById(id);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top + (window.scrollY || window.pageYOffset);
      const offsetPosition = elementPosition - offset;

      gsap.to(window, {
        duration: duration,
        scrollTo: { y: offsetPosition, autoKill: false },
        ease: "power2.out"
      });
      return true;
    }
    return false;
  };

  if (delay > 0) {
    setTimeout(performScroll, delay);
    return;
  }

  if (!performScroll()) {
    // Element not in DOM yet — retry every 100ms (max 30 times)
    let attempts = 0;
    const interval = setInterval(() => {
      if (performScroll() || ++attempts >= 30) {
        clearInterval(interval);
      }
    }, 100);
  }
};
