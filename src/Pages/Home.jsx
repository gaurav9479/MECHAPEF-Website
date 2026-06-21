import Navbar from "../components/Navbar/Navbar";
import Hero from "../components/Hero/Hero";
import About from "../components/About/About";
import Stats from "../components/Stats/Stats";
import Domains from "../components/Domains/Domains";
import Join from "../components/Join/Join";
import Footer from "../components/Footer/Footer";

const Home = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <About />
      <Stats />
      <Domains />
      <Join />
      <Footer />
    </>
  );
};

export default Home;