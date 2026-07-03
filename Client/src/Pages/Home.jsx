import React, { useEffect } from "react";
import Navbar from "../components/Navbar/Navbar";
import HeroIntro from "../components/CinematicHero/HeroIntro";
import AboutWheel from "../components/CinematicHero/AboutWheel";
import LearningLogos from "../components/LearningLogos/LearningLogos";
import PastEventsStack from "../components/PastEventsStack/PastEventsStack";
import LiveEventsSlider from "../components/LiveEventsSlider/LiveEventsSlider";
import SpiritOfMech from "../components/CinematicHero/SpiritOfMech";
import OurTeam from "../components/OurTeam/OurTeam";
import PastSponsors from "../components/PastSponsors/PastSponsors";
import JoinUsBot from "../components/CinematicHero/JoinUsBot";
import Footer from "../components/Footer/Footer";
import MobileHome from "../components/MobileHome/MobileHome";
import BackgroundGears from "../components/BackgroundGears/BackgroundGears";


const Home = () => {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const id = hash.replace('#', '');
        const el = document.getElementById(id);
        if (el) {
          if (id === 'about-us' && window.innerWidth > 768) {
            import('gsap').then(gsap => {
              const elTop = el.getBoundingClientRect().top + window.scrollY;
              const targetY = elTop + window.innerHeight * 5.5 * 0.28;
              gsap.default.to(window, { duration: 0.9, scrollTo: { y: targetY, autoKill: false }, ease: "power2.out" });
            });
          } else {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }, 500); // Wait for components to render
    }
  }, []);

  return (
    <>
      <Navbar />

      <BackgroundGears />

      {/* ── Desktop layout (hidden on mobile via CSS) ── */}
      <div className="desktop-only">
        <HeroIntro />
        <AboutWheel />
        <LearningLogos />
        <PastEventsStack />
        <LiveEventsSlider />
        <SpiritOfMech />
        <OurTeam />
        <PastSponsors />
        <JoinUsBot />
        <Footer />
      </div>

      {/* ── Mobile layout (hidden on desktop via CSS) ── */}
      <MobileHome />
    </>
  );
};

export default Home;