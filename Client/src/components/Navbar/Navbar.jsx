import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaCog, FaUserShield, FaSignOutAlt, FaBars, FaTimes, FaUserCircle } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import HangingNoticeBoard from "../HangingNoticeBoard/HangingNoticeBoard";
import "./Navbar.css";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const [activeIndex, setActiveIndex] = useState(0);
  const [showNotices, setShowNotices] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAuthBtn = async () => {
    if (user) {
      if (hasRole('EventHead')) {
        navigate('/admin');
      }
    } else {
      navigate('/login');
    }
  };

  const handleLogout = async (e) => {
    e.stopPropagation();
    await logout();
    navigate('/');
  };

  const scrollToSection = (vhMultiplier, id) => {
    setMenuOpen(false);
    const isMobile = window.innerWidth <= 768;
    if (window.location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        if (isMobile && id) {
          const el = document.getElementById(id);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({
            top: vhMultiplier * window.innerHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    } else {
      if (isMobile && id) {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({
          top: vhMultiplier * window.innerHeight,
          behavior: 'smooth'
        });
      }
    }
  };

  const scrollToElement = (id) => {
    setMenuOpen(false);
    if (window.location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;

      if (y > vh * 0.8) setIsScrolled(true);
      else setIsScrolled(false);

      // Determine active section
      let newActiveIndex = 0;
      if (y < vh * 1.5) newActiveIndex = 0;
      else if (y < vh * 5.5) newActiveIndex = 1;
      else if (y < vh * 10.5) newActiveIndex = 2;
      else if (y < vh * 14.5) newActiveIndex = 3;
      else newActiveIndex = 4;

      setActiveIndex(newActiveIndex);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Removed manual pillStyle effect
  return (
    <>
      <div className="navbar-hover-zone"></div>
      <nav className={`navbar ${isScrolled ? 'navbar-hidden' : 'navbar-visible'}`}>
      <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <FaCog className="logo-icon" />
        <div className="logo-text">
          <div className="logo-main">Mecha<span>PEF</span></div>
          <div className="logo-sub">MNNIT</div>
        </div>
      </div>

      <div className="mobile-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <FaTimes /> : <FaBars />}
      </div>

      <ul className={menuOpen ? "nav-links open" : "nav-links"}>
        <li className={activeIndex === 0 ? "active" : ""} onClick={() => scrollToSection(0)}>
          {activeIndex === 0 && <motion.div className="nav-sliding-pill" layoutId="navPill" transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
          <span style={{ position: 'relative', zIndex: 2 }}>Home</span>
        </li>
        <li className={activeIndex === 1 ? "active" : ""} onClick={() => scrollToSection(3.15, 'mobile-about')}>
          {activeIndex === 1 && <motion.div className="nav-sliding-pill" layoutId="navPill" transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
          <span style={{ position: 'relative', zIndex: 2 }}>About</span>
        </li>
        <li className={activeIndex === 2 ? "active" : ""} onClick={() => { setMenuOpen(false); navigate('/events'); }}>
          {activeIndex === 2 && <motion.div className="nav-sliding-pill" layoutId="navPill" transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
          <span style={{ position: 'relative', zIndex: 2 }}>Events</span>
        </li>
        <li className={activeIndex === 3 ? "active" : ""} onClick={() => { setMenuOpen(false); navigate('/gallery'); }}>
          {activeIndex === 3 && <motion.div className="nav-sliding-pill" layoutId="navPill" transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
          <span style={{ position: 'relative', zIndex: 2 }}>Gallery</span>
        </li>
        <li className={window.location.pathname === '/sponsors' ? "active" : ""} onClick={() => { setMenuOpen(false); navigate('/sponsors'); }}>
          {window.location.pathname === '/sponsors' && <motion.div className="nav-sliding-pill" layoutId="navPill" transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
          <span style={{ position: 'relative', zIndex: 2 }}>Sponsors</span>
        </li>
        <li className={activeIndex === 4 ? "active" : ""} onClick={() => scrollToElement(window.innerWidth <= 768 ? 'mh-team' : 'our-team')}>
          {activeIndex === 4 && <motion.div className="nav-sliding-pill" layoutId="navPill" transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
          <span style={{ position: 'relative', zIndex: 2 }}>Our Team</span>
        </li>
        <li style={{cursor: 'pointer'}} onClick={() => { setMenuOpen(false); setShowNotices(true); }}>
          <span style={{ position: 'relative', zIndex: 2 }}>Notice Board</span>
        </li>
        <li className="mobile-only-btn">
          {user ? (
            <div className="nav-avatar-container" ref={dropdownRef}>
              <div className={`nav-avatar ${user.isVerified ? 'verified-avatar' : ''}`} onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}>
                {user.profileImage ? <img src={user.profileImage} alt="profile" /> : <FaUserCircle />}
              </div>
              {avatarMenuOpen && (
                <div className="avatar-dropdown">
                  <div className="dropdown-user-info">
                    <strong>{user.name || 'User'}</strong>
                    <span>{user.email}</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button onClick={() => { setAvatarMenuOpen(false); setMenuOpen(false); navigate('/profile'); }}>
                    <FaUserCircle /> My Profile
                  </button>
                  {hasRole('EventHead') && (
                    <button onClick={() => { setAvatarMenuOpen(false); setMenuOpen(false); navigate('/admin'); }}>
                      <FaUserShield /> Admin Portal
                    </button>
                  )}
                  <button onClick={(e) => { setAvatarMenuOpen(false); handleLogout(e); }} className="logout-btn">
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="contact-btn" onClick={handleAuthBtn}>Login</button>
          )}
        </li>
      </ul>

      <div className="desktop-only-btn">
        {user ? (
          <div className="nav-avatar-container" ref={dropdownRef}>
            <div className={`nav-avatar ${user.isVerified ? 'verified-avatar' : ''}`} onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}>
              {user.profileImage ? <img src={user.profileImage} alt="profile" /> : <FaUserCircle />}
            </div>
            {avatarMenuOpen && (
              <div className="avatar-dropdown">
                <div className="dropdown-user-info">
                  <strong>{user.name || 'User'}</strong>
                  <span>{user.email}</span>
                </div>
                <div className="dropdown-divider"></div>
                <button onClick={() => { setAvatarMenuOpen(false); navigate('/profile'); }}>
                  <FaUserCircle /> My Profile
                </button>
                {hasRole('EventHead') && (
                  <button onClick={() => { setAvatarMenuOpen(false); navigate('/admin'); }}>
                    <FaUserShield /> Admin Portal
                  </button>
                )}
                <button onClick={(e) => { setAvatarMenuOpen(false); handleLogout(e); }} className="logout-btn">
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="contact-btn" onClick={handleAuthBtn}>Login</button>
        )}
      </div>
      </nav>
      {showNotices && <HangingNoticeBoard onClose={() => setShowNotices(false)} />}
    </>
  );
};

export default Navbar;
