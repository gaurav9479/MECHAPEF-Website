import Navbar from "../components/Navbar/Navbar";
import CinematicHero from "../components/CinematicHero/CinematicHero";
import ScrollStory from "../components/ScrollStory/ScrollStory";
import Stats from "../components/Stats/Stats";
import Domains from "../components/Domains/Domains";
import Join from "../components/Join/Join";
import Footer from "../components/Footer/Footer";

const STORY_STAGES = [
  {
    background: "radial-gradient(ellipse at 70% 40%, #3a0000 0%, #0a0000 60%, #050505 100%)",
    label: "Stage 01 — What We Do",
    items: [
      { id: "s1-1", label: "Robotics",    x: -320, y: -160 },
      { id: "s1-2", label: "Drone Tech",  x:  320, y: -160 },
      { id: "s1-3", label: "CAD Design",  x: -320, y:  160 },
      { id: "s1-4", label: "AI & ML",     x:  320, y:  160 },
    ],
  },
  {
    background: "radial-gradient(ellipse at 30% 60%, #1a0a00 0%, #050505 60%, #000 100%)",
    label: "Stage 02 — How We Grow",
    items: [
      { id: "s2-1", label: "Workshops",    x: -280, y: -200 },
      { id: "s2-2", label: "Mentorship",   x:  280, y: -200 },
      { id: "s2-3", label: "Competitions", x:    0, y:  220 },
    ],
  },
  {
    background: "radial-gradient(ellipse at 50% 30%, #00001a 0%, #050505 60%, #000 100%)",
    label: "Stage 03 — Our Impact",
    items: [
      { id: "s3-1", label: "1000+\nStudents", x: -350, y:    0 },
      { id: "s3-2", label: "50+\nEvents",     x:    0, y: -220 },
      { id: "s3-3", label: "45+\nProjects",   x:  350, y:    0 },
      { id: "s3-4", label: "5+\nYears",       x:    0, y:  220 },
    ],
  },
  {
    background: "radial-gradient(ellipse at 60% 50%, #0d0005 0%, #050505 60%, #000 100%)",
    label: "Stage 04 — Join the Tribe",
    items: [
      { id: "s4-1", label: "Apply Now",   x: -260, y: -180 },
      { id: "s4-2", label: "Collaborate", x:  260, y: -180 },
      { id: "s4-3", label: "Innovate",    x: -260, y:  180 },
      { id: "s4-4", label: "Lead",        x:  260, y:  180 },
    ],
  },
];

const Home = () => {
  return (
    <>
      <Navbar />
      <CinematicHero />
      <ScrollStory stages={STORY_STAGES} />
      <Stats />
      <Domains />
      <Join />
      <Footer />
    </>
  );
};

export default Home;