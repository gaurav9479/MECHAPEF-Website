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

  useEffect(() => {
    api.get('/special-sponsor/active').then(res => {
      if (res.data?.data) {
        const sp = res.data.data;
        setSpecialSponsorConfig(sp);
        
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
      const t = setTimeout(() => setLoadStage(3), 100);
      return () => clearTimeout(t);
    }
  }, [loadStage]);

  useEffect(() => {
    apiGetCached('/upload/sections?device=desktop', (data) => {
      if (data?.data?.images) {
        data.data.images.forEach(img => {
          if (img.imageURL) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = img.imageURL;
            document.head.appendChild(link);
            
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
        

        {loadStage >= 1 && (
          <>
            <div id="about-us"><AboutWheel /></div>
            
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


      <MobileHome />
    </>
  );
};

export default Home;