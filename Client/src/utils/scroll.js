export const scrollToId = (id, offset = 80, delay = 0) => {
  const performScroll = () => {
    const element = document.getElementById(id);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top + (window.scrollY || window.pageYOffset);
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      return true;
    }
    return false;
  };

  if (delay > 0) {
    setTimeout(performScroll, delay);
    return;
  }

  // Attempt immediately. 
  if (performScroll()) {
    // If successful, do a second adjustment after 800ms to correct for lazy-loading/GSAP layout shifts
    setTimeout(performScroll, 800);
  } else {
    // If it fails (e.g., element is not in DOM yet), retry with interval
    let attempts = 0;
    const interval = setInterval(() => {
      const success = performScroll();
      attempts++;
      if (success) {
        clearInterval(interval);
        // Correct position again after initial smooth scroll finishes
        setTimeout(performScroll, 800);
      } else if (attempts >= 30) {
        clearInterval(interval);
      }
    }, 100);
  }
};
