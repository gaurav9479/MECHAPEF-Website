import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaCog, FaUserShield, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { animate } from "framer-motion";
import "./Navbar.css";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleAuthBtn = async () => {
    if (user) {
      // If logged in, go to admin
      navigate('/admin');
    } else {
      navigate('/login');
    }
  };

  const handleLogout = async (e) => {
    e.stopPropagation();
    await logout();
    navigate('/');
  };

  const scrollToSection = (vhMultiplier) => {
    const targetY = window.innerHeight * vhMultiplier;
    animate(window.scrollY, targetY, {
      duration: 1.2, // Snappier duration, removes the sluggish delay
      ease: "easeOut",
      onUpdate: (latest) => window.scrollTo(0, latest)
    });
  };

  const scrollToElement = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const targetY = el.getBoundingClientRect().top + window.scrollY;
      animate(window.scrollY, targetY, {
        duration: 1.2,
        ease: "easeOut",
        onUpdate: (latest) => window.scrollTo(0, latest)
      });
    }
  };

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
        <li className="active" style={{cursor: 'pointer'}} onClick={() => scrollToSection(0)}>Home</li>
        <li style={{cursor: 'pointer'}} onClick={() => scrollToSection(3.15)}>About</li>
        <li style={{cursor: 'pointer'}} onClick={() => scrollToSection(7.2)}>Events</li>
        <li style={{cursor: 'pointer'}} onClick={() => scrollToSection(13.5)}>Gallery</li>
        <li style={{cursor: 'pointer'}} onClick={() => scrollToElement('our-team')}>Our Team</li>
        <li style={{cursor: 'pointer'}} onClick={() => scrollToElement('notices')}>Notice Board</li>
      </ul>

      <button className="contact-btn" onClick={handleAuthBtn}>
        {user ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaUserShield /> Admin
            <span
              onClick={handleLogout}
              style={{ marginLeft: '6px', fontSize: '0.75rem', opacity: 0.7, cursor: 'pointer' }}
              title="Logout"
            >
              <FaSignOutAlt />
            </span>
          </span>
        ) : 'Login'}
      </button>
    </nav>
    </>
  );
};

export default Navbar;