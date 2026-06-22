import Navbar from "../components/Navbar/Navbar";
import CinematicHero from "../components/CinematicHero/CinematicHero";
import OurTeam from "../components/OurTeam/OurTeam";
import NoticeBoard from "../components/NoticeBoard/NoticeBoard";
import Stats from "../components/Stats/Stats";
import Domains from "../components/Domains/Domains";
import Join from "../components/Join/Join";
import Footer from "../components/Footer/Footer";



const Home = () => {
  return (
    <>
      <Navbar />
      <CinematicHero />
      <OurTeam />
      {/* <Stats /> */}
      {/* <Domains /> */}
      {/* <Join /> */}
      <NoticeBoard />
      <Footer />
    </>
  );
};

export default Home;