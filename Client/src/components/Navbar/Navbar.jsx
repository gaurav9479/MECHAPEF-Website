import { useState, useEffect } from "react";
import { FaCog } from "react-icons/fa";
import "./Navbar.css";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Hide the navbar and switch to hover mode after scrolling past 80% of the first screen
      if (window.scrollY > window.innerHeight * 0.8) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div className="navbar-hover-zone"></div>
      <nav className={`navbar ${isScrolled ? 'navbar-hidden' : 'navbar-visible'}`}>
      <div className="logo">
        <FaCog className="logo-icon" />
        <div className="logo-text">
          <div className="logo-main">Mecha<span>PEF</span></div>
          <div className="logo-sub">MNNIT</div>
        </div>
      </div>

      <ul>
        <li className="active">Home</li>
        <li>About</li>
        <li>Events</li>
        <li>Gallery</li>
        <li>Our Team</li>
        <li>Our Sponsors</li>
      </ul>

      <button className="contact-btn">Contact Us</button>
    </nav>
    </>
  );
};

export default Navbar;