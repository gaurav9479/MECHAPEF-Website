import Navbar from "../components/Navbar/Navbar";
import CinematicHero from "../components/CinematicHero/CinematicHero";
import LiveEventsSlider from "../components/LiveEventsSlider/LiveEventsSlider";

import PastSponsors from "../components/PastSponsors/PastSponsors";
import OurTeam from "../components/OurTeam/OurTeam";
import Stats from "../components/Stats/Stats";
import Domains from "../components/Domains/Domains";
import Join from "../components/Join/Join";
import Footer from "../components/Footer/Footer";




const Home = () => {
  return (
    <>
      <Navbar />
      

      <CinematicHero />
      <LiveEventsSlider />
      <OurTeam />

      {/* <Stats /> */}
      {/* <Domains /> */}
      {/* <Join /> */}
      <PastSponsors />
      <Footer />
    </>
  );
};

export default Home;