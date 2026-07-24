import React, { useEffect, useLayoutEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import HeroIntro from "../components/CinematicHero/HeroIntro";
import AboutWheel from "../components/CinematicHero/AboutWheel";
import LearningLogos from "../components/LearningLogos/LearningLogos";
import PastEventsStack from "../components/PastEventsStack/PastEventsStack";
import LiveEventsSlider from "../components/LiveEventsSlider/LiveEventsSlider";
import OurDepartment from "../components/OurDepartment/OurDepartment";
import OurTeam from "../components/OurTeam/OurTeam";
import PastSponsors from "../components/PastSponsors/PastSponsors";
import JoinUsBot from "../components/CinematicHero/JoinUsBot";
import Footer from "../components/Footer/Footer";
import MobileHome from "../components/MobileHome/MobileHome";
import BackgroundGears from "../components/BackgroundGears/BackgroundGears";
import { apiGetCached } from "../utils/apiCache";

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Prefetch team images immediately when the site loads so they are instantly visible on scroll
    apiGetCached('/upload/sections', (data) => {
      if (data?.data?.images) {
        data.data.images.forEach(img => {
          if (img.imageURL) {
            const prefetchImg = new Image();
            prefetchImg.src = img.imageURL;
          }
        });
      }
    });
  }, []);

  useLayoutEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    // Check both hash (for backward compatibility) and router state
    const hash = window.location.hash;
    const targetId = location.state?.scrollTo || (hash ? hash.replace('#', '') : null);

    if (!targetId) {
      window.scrollTo(0, 0);
    } else {
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          if (targetId === 'about-us' && window.innerWidth > 768) {
            import('gsap').then(gsap => {
              const elTop = el.getBoundingClientRect().top + window.scrollY;
              const targetY = elTop + window.innerHeight * 5.5 * 0.28;
              gsap.default.to(window, { duration: 0.9, scrollTo: { y: targetY, autoKill: false }, ease: "power2.out" });
            });
          } else {
            el.scrollIntoView({ behavior: 'smooth' });
          }
          
          // Clean up the URL/state so it doesn't trigger again on reload
          if (hash) {
            window.history.replaceState(null, '', window.location.pathname);
          } else if (location.state?.scrollTo) {
            navigate(location.pathname, { replace: true, state: {} });
          }
        }
      }, 500); // Wait for components to render
    }
  }, [location]);

  return (
    <>
      <Navbar />

      <BackgroundGears />

      {/* ── Desktop layout (hidden on mobile via CSS) ── */}
      <div className="desktop-only">
        
        <div id="home"><HeroIntro /></div>
        <div id="about-us"><AboutWheel /></div>
        <div id="learning"><LearningLogos /></div>
        <div id="past-events"><PastEventsStack /></div>
        <div id="live-events"><LiveEventsSlider /></div>
        <div id="our-department"><OurDepartment /></div>
        <div id="our-team"><OurTeam /></div>
        <div id="sponsors"><PastSponsors /></div>
        <div id="join"><JoinUsBot /></div>
        
        <Footer />
      </div>

      {/* ── Mobile layout (hidden on desktop via CSS) ── */}
      <MobileHome />
    </>
  );
};

export default Home;