import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaCog, FaUserShield, FaSignOutAlt, FaBars, FaTimes, FaUserCircle } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { animate } from "framer-motion";
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
  const navRefs = useRef([]);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });

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

  const scrollToSection = (vhMultiplier) => {
    setMenuOpen(false);
    if (window.location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        window.scrollTo({
          top: vhMultiplier * window.innerHeight,
          behavior: 'smooth'
        });
      }, 100);
    } else {
      window.scrollTo({
        top: vhMultiplier * window.innerHeight,
        behavior: 'smooth'
      });
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

  useEffect(() => {
    // Update pill position
    const activeEl = navRefs.current[activeIndex];
    if (activeEl) {
      setPillStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        opacity: 1
      });
    }
  }, [activeIndex, menuOpen]);

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
        <div className="nav-sliding-pill" style={pillStyle}></div>
        <li ref={el => navRefs.current[0] = el} className={activeIndex === 0 ? "active" : ""} onClick={() => scrollToSection(0)}>Home</li>
        <li ref={el => navRefs.current[1] = el} className={activeIndex === 1 ? "active" : ""} onClick={() => scrollToSection(3.15)}>About</li>
        <li ref={el => navRefs.current[2] = el} className={activeIndex === 2 ? "active" : ""} onClick={() => { setMenuOpen(false); navigate('/events'); }}>Events</li>
        <li ref={el => navRefs.current[3] = el} className={activeIndex === 3 ? "active" : ""} onClick={() => { setMenuOpen(false); navigate('/gallery'); }}>Gallery</li>
        <li onClick={() => { setMenuOpen(false); navigate('/sponsors'); }}>Sponsors</li>
        <li ref={el => navRefs.current[4] = el} className={activeIndex === 4 ? "active" : ""} onClick={() => scrollToElement('our-team')}>Our Team</li>
        <li style={{cursor: 'pointer'}} onClick={() => { setMenuOpen(false); setShowNotices(true); }}>Notice Board</li>
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
