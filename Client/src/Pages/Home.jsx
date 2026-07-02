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
import HangingMagazine from "./Magazine/HangingMagazine";

const Home = () => {
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
        <HangingMagazine />
      </div>

      {/* ── Mobile layout (hidden on desktop via CSS) ── */}
      <MobileHome />
    </>
  );
};

export default Home;