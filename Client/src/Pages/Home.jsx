import React, { useEffect, useLayoutEffect, useState } from "react";
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
import api from "../services/api";
import FloatingSponsorBubbles from "../components/FloatingSponsorBubbles/FloatingSponsorBubbles";

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [specialSponsorConfig, setSpecialSponsorConfig] = useState(null);
  const [loadStage, setLoadStage] = useState(1); 
  // 1: Render Hero & AboutUs. Start PastEvents fetch.
  // 2: PastEvents finished. Render OurDepartment & LiveEvents.
  // 3: Render OurTeam & rest of the page.

  useEffect(() => {
    // Fetch special sponsor config in the background without blocking the UI
    api.get('/special-sponsor/active').then(res => {
      if (res.data?.data) {
        const sp = res.data.data;
        setSpecialSponsorConfig(sp);
        
        // Apply custom font/brand styling if applicable
        if (sp.customFontUrl && sp.applyBrandFont) {
          const link = document.createElement('link');
          link.href = sp.customFontUrl;
          link.rel = 'stylesheet';
          document.head.appendChild(link);
          document.body.style.fontFamily = `'${sp.customFontFamily}', sans-serif`;
        }
      }
    }).catch(err => {
      console.log('No active special sponsor or error fetching');
    });
  }, []);

  useEffect(() => {
    if (loadStage === 2) {
      // Since OurDepartment has no API calls, immediately progress to stage 3 after a 100ms render frame
      const t = setTimeout(() => setLoadStage(3), 100);
      return () => clearTimeout(t);
    }
  }, [loadStage]);

  useEffect(() => {
    // 2. Prefetch team images in the background
    apiGetCached('/upload/sections?device=desktop', (data) => {
      if (data?.data?.images) {
        data.data.images.forEach(img => {
          if (img.imageURL) {
            // High priority network fetch
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = img.imageURL;
            document.head.appendChild(link);
            
            // Cache in memory
            const prefetchImg = new Image();
            prefetchImg.src = img.imageURL;
          }
        });
      }
    }, { cacheDuration: 0 });
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

      <FloatingSponsorBubbles config={specialSponsorConfig} />

      <BackgroundGears />

      {/* ── Desktop layout (hidden on mobile via CSS) ── */}
      <div className="desktop-only">
        <div id="home"><HeroIntro /></div>
        
        {/* Render rest of the sections progressively */}
        {loadStage >= 1 && (
          <>
            <div id="about-us"><AboutWheel /></div>
            {/* <div id="learning"><LearningLogos /></div> */}
            <div id="past-events">
              <PastEventsStack onLoaded={() => setLoadStage(2)} />
            </div>
          </>
        )}

        {loadStage >= 2 && (
          <>
            <div id="our-department"><OurDepartment /></div>
            <div id="live-events"><LiveEventsSlider /></div>
          </>
        )}

        {loadStage >= 3 && (
          <>
            <div id="our-team"><OurTeam /></div>
            <div id="sponsors"><PastSponsors /></div>
            <div id="join"><JoinUsBot /></div>
            <Footer />
          </>
        )}
      </div>

      {/* ── Mobile layout (hidden on desktop via CSS) ── */}
      <MobileHome />
    </>
  );
};

export default Home;