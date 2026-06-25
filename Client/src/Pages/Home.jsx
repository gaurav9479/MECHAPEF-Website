import Navbar from "../components/Navbar/Navbar";
import CinematicHero from "../components/CinematicHero/CinematicHero";
import PastEventsStack from "../components/PastEventsStack/PastEventsStack";
import LiveEventsSlider from "../components/LiveEventsSlider/LiveEventsSlider";
import PastSponsors from "../components/PastSponsors/PastSponsors";
import OurTeam from "../components/OurTeam/OurTeam";
import Footer from "../components/Footer/Footer";
import MobileHome from "../components/MobileHome/MobileHome";
import BackgroundGears from "../components/BackgroundGears/BackgroundGears";

const Home = () => {
  return (
    <>
      <Navbar />

      <BackgroundGears />

      {/* ── Desktop layout (hidden on mobile via CSS) ── */}
      <div className="desktop-only">
        <CinematicHero />
        <PastEventsStack />
        <LiveEventsSlider />
        <OurTeam />
        <PastSponsors />
      </div>

      {/* ── Mobile layout (hidden on desktop via CSS) ── */}
      <MobileHome />

      <Footer />
    </>
  );
};

export default Home;