import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaCog,
  FaUserShield,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaUserCircle,
  FaQrcode,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import HangingNoticeBoard from "../HangingNoticeBoard/HangingNoticeBoard";
import { useMagazineTransition } from "../../context/MagazineTransitionContext";
import { scrollToId } from "../../utils/scroll";
import gsap from "gsap";
import ScrollToPlugin from "gsap/ScrollToPlugin";
gsap.registerPlugin(ScrollToPlugin);
import MagneticButton from "../MagneticButton/MagneticButton";
import { apiGetCached } from "../../utils/apiCache";
import "./Navbar.css";

const TopNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout, hasRole, loading } = useAuth();
  const { transitionState, setTransitionState, triggerExit } = useMagazineTransition();

  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showNotices, setShowNotices] = useState(false);
  const [hasUnreadNotice, setHasUnreadNotice] = useState(false);
  const [specialSponsor, setSpecialSponsor] = useState(null);

  useEffect(() => {
    apiGetCached('/announcements', (data) => {
      const items = data.data?.announcements || data.data || [];
      const active = items.filter(n => n.isActive);
      const seenNotices = JSON.parse(localStorage.getItem('seen_notices') || '[]');
      const hasUnread = active.some(n => !seenNotices.includes(n._id));
      setHasUnreadNotice(hasUnread);
    }).catch(() => {});

    // Fetch active special sponsor for Co-Branding & Brand Font Takeover
    apiGetCached('/special-sponsor/active', (data) => {
      const sp = data.data;
      if (sp) {
        setSpecialSponsor(sp);
        
        // Inject Custom Brand Font & Accent Color if takeover enabled
        if (sp.applyBrandFont) {
          if (sp.customFontUrl) {
            const fontLinkId = 'special-sponsor-font-link';
            if (!document.getElementById(fontLinkId)) {
              const link = document.createElement('link');
              link.id = fontLinkId;
              link.rel = 'stylesheet';
              link.href = sp.customFontUrl;
              document.head.appendChild(link);
            }
          }
          if (sp.customFontFamily) {
            document.documentElement.style.setProperty('--special-brand-font', sp.customFontFamily);
          }
          if (sp.brandColor) {
            document.documentElement.style.setProperty('--special-brand-color', sp.brandColor);
          }
        }
      }
    }).catch(() => {});
  }, [showNotices]);

  const desktopRef = useRef(null);
  const mobileRef = useRef(null);

  const handleNavClick = (targetRoute, callback) => {
    if (location.pathname === '/magazine' && transitionState === 'idle') {
      const intercepted = triggerExit(targetRoute);
      if (intercepted) {
        setMenuOpen(false);
        if (callback) callback();
        else navigate(targetRoute);

        setTimeout(() => {
          setTransitionState('idle');
        }, 1200);
        return;
      }
    }

    setMenuOpen(false);
    if (callback) callback();
    else navigate(targetRoute);
  };

  useEffect(() => {
    const close = (e) => {
      if (
        desktopRef.current?.contains(e.target) ||
        mobileRef.current?.contains(e.target)
      ) {
        return;
      }
      setAvatarMenuOpen(false);
    };

    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);

    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;

      setIsScrolled(y > vh * 0.8);

      let index = 0;
      const teamEl = document.getElementById("our-team");
      const teamTop = teamEl ? teamEl.getBoundingClientRect().top : Infinity;
      const sponsorsEl = document.querySelector(".past-sponsors-home-section");
      const sponsorsTop = sponsorsEl ? sponsorsEl.getBoundingClientRect().top : Infinity;

      if (sponsorsTop <= vh * 0.5) {
        index = 4; // Sponsors
      } else if (teamTop <= vh * 0.5) {
        index = 5; // Our Team
      } else if (y < vh * 1.5) {
        index = 0; // Home
      } else if (y < vh * 5.5) {
        index = 1; // About
      } else if (y < vh * 10.5) {
        index = 2; // Events
      } else {
        index = 3; // Gallery
      }

      setActiveIndex(index);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAuth = () => {
    if (!user) {
      handleNavClick("/login");
      return;
    }
    if (hasRole("content-lead") || hasRole("media-lead") || hasRole("super-admin")) {
      handleNavClick("/admin");
    }
  };

  const handleLogout = () => {
    setAvatarMenuOpen(false);
    setMenuOpen(false);
    logout();
    navigate("/");
  };

  const goProfile = () => {
    setAvatarMenuOpen(false);
    setMenuOpen(false);
    navigate("/profile");
  };

  const goAdmin = () => {
    setAvatarMenuOpen(false);
    setMenuOpen(false);
    navigate("/admin");
  };

  const goScanner = () => {
    setAvatarMenuOpen(false);
    setMenuOpen(false);
    navigate("/admin/scanner");
  };

  const toggleAvatar = (e) => {
    e.stopPropagation();
    setAvatarMenuOpen((prev) => !prev);
  };

  const scrollToSection = (vhMultiplier, id) => {
    handleNavClick("/", () => {
      const mobile = window.innerWidth <= 768;
      if (location.pathname !== "/") {
        navigate("/");
      }

      let attempts = 0;
      const checkAndScroll = setInterval(() => {
        if (mobile && id) {
          const el = document.getElementById(id);
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
            clearInterval(checkAndScroll);
          }
        } else {
          window.scrollTo({
            top: vhMultiplier * window.innerHeight,
            behavior: "smooth",
          });
          clearInterval(checkAndScroll);
        }
        attempts++;
        if (attempts > 20) clearInterval(checkAndScroll);
      }, 250);
    });
  };

  const scrollToElement = (id) => {
    handleNavClick("/", () => {
      if (location.pathname !== "/") {
        navigate("/", { state: { scrollTo: id } });
      } else {
        const el = document.getElementById(id);
        if (el) {
          if (id === "about-us" && window.innerWidth > 768) {
            const elTop = el.getBoundingClientRect().top + window.scrollY;
            const targetY = elTop + window.innerHeight * 5.5 * 0.28;
            gsap.to(window, { duration: 0.9, scrollTo: { y: targetY, autoKill: false }, ease: "power2.out" });
          } else {
            el.scrollIntoView({ behavior: "smooth" });
          }
        }
      }
    });
  };

  return (
    <>
      <div className="navbar-hover-zone"></div>

      <nav className={`navbar ${isScrolled ? "navbar-hidden" : "navbar-visible"}`}>
        <div className="logo" onClick={() => handleNavClick("/")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
          <FaCog className="logo-icon" />
          <div className="logo-text">
            <div className="logo-main">Mecha<span>PEF</span></div>
            <div className="logo-sub">MNNIT</div>
          </div>

          {specialSponsor?.logoURL && specialSponsor?.showCoBrandingLogo !== false && (
            <div className="cobranding-sponsor" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginLeft: '10px', borderLeft: '2px solid rgba(255, 255, 255, 0.2)', paddingLeft: '14px', height: '42px' }}>
              <span style={{ color: specialSponsor?.brandColor || '#ff1f01', fontWeight: '900', fontSize: '1.4rem', fontFamily: 'sans-serif', lineHeight: 1 }}>×</span>
              <img 
                src={specialSponsor.logoURL} 
                alt={specialSponsor.name} 
                style={{ height: '42px', maxWidth: '160px', objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.25))' }} 
              />
            </div>
          )}
        </div>

        <div className="mobile-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FaTimes /> : <FaBars />}
        </div>

        <ul className={menuOpen ? "nav-links open" : "nav-links"}>
          <li className={(location.pathname === "/" && activeIndex === 0) ? "active" : ""} onClick={() => scrollToSection(0)}>
            {(location.pathname === "/" && activeIndex === 0) && (
              <motion.div className="nav-sliding-pill" layoutId="navPillTop" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
            )}
            <span>Home</span>
          </li>

          <li className={(location.pathname === "/" && activeIndex === 1) ? "active" : ""} onClick={() => scrollToElement(window.innerWidth <= 768 ? "mobile-about" : "about-us")}>
            {(location.pathname === "/" && activeIndex === 1) && (
              <motion.div className="nav-sliding-pill" layoutId="navPillTop" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
            )}
            <span>About</span>
          </li>

          <li className={(location.pathname.startsWith("/events") || (location.pathname === "/" && activeIndex === 2)) ? "active" : ""} onClick={() => handleNavClick("/events")}>
            {(location.pathname.startsWith("/events") || (location.pathname === "/" && activeIndex === 2)) && (
              <motion.div className="nav-sliding-pill" layoutId="navPillTop" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
            )}
            <span>Events</span>
          </li>

          <li className={(location.pathname.startsWith("/gallery") || (location.pathname === "/" && activeIndex === 3)) ? "active" : ""} onClick={() => handleNavClick("/gallery")}>
            {(location.pathname.startsWith("/gallery") || (location.pathname === "/" && activeIndex === 3)) && (
              <motion.div className="nav-sliding-pill" layoutId="navPillTop" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
            )}
            <span>Gallery</span>
          </li>

          <li className={(location.pathname.startsWith("/sponsors") || (location.pathname === "/" && activeIndex === 4)) ? "active" : ""} onClick={() => handleNavClick("/sponsors")}>
            {(location.pathname.startsWith("/sponsors") || (location.pathname === "/" && activeIndex === 4)) && (
              <motion.div className="nav-sliding-pill" layoutId="navPillTop" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
            )}
            <span>Sponsors</span>
          </li>

          <li className={(location.pathname === "/" && activeIndex === 5) ? "active" : ""} onClick={() => scrollToElement(window.innerWidth <= 768 ? "mh-team" : "our-team")}>
            {(location.pathname === "/" && activeIndex === 5) && (
              <motion.div className="nav-sliding-pill" layoutId="navPillTop" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
            )}
            <span>Our Team</span>
          </li>

          <li onClick={() => { setMenuOpen(false); setShowNotices(true); }}>
            <span style={{ position: 'relative', display: 'inline-block' }}>
              Notice Board
              {hasUnreadNotice && (
                <span style={{
                  position: 'absolute',
                  top: '0px',
                  right: '-14px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ffff00',
                  boxShadow: '0 0 5px #ffff00',
                  display: 'inline-block'
                }} title="New Notice" />
              )}
            </span>
          </li>

          <li className="mobile-only-btn">
            {!user ? (
              <MagneticButton className="contact-btn" onClick={handleAuth}>Login</MagneticButton>
            ) : (
              <div className="nav-avatar-container" ref={mobileRef}>
                <div className={`nav-avatar ${user.isVerified ? "verified-avatar" : ""}`} onClick={toggleAvatar}>
                  {user.profileImage ? <img src={user.profileImage} alt="profile" /> : <FaUserCircle />}
                </div>
                {avatarMenuOpen && (
                  <div className="avatar-dropdown" onClick={(e) => e.stopPropagation()}>
                    <div className="dropdown-user-info">
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </div>
                    <div className="dropdown-divider"></div>
                    <button onClick={goProfile}><FaUserCircle />My Profile</button>
                    {user?.role === 'volunteer' && (
                      <button onClick={goScanner} style={{ color: '#00e5ff', fontWeight: 'bold' }}><FaQrcode />Ticket Scanner</button>
                    )}
                    {(hasRole("content-lead") || hasRole("media-lead") || hasRole("super-admin")) && (
                      <button onClick={goAdmin}><FaUserShield />Admin Portal</button>
                    )}
                    <button className="logout-btn" onClick={handleLogout}><FaSignOutAlt />Logout</button>
                  </div>
                )}
              </div>
            )}
          </li>
        </ul>

        <div className="desktop-only-btn">
          {!user ? (
            <MagneticButton className="contact-btn" onClick={handleAuth}>Login</MagneticButton>
          ) : (
            <div className="nav-avatar-container" ref={desktopRef}>
              <div className={`nav-avatar ${user.isVerified ? "verified-avatar" : ""}`} onClick={toggleAvatar}>
                {user.profileImage ? <img src={user.profileImage} alt="profile" /> : <FaUserCircle />}
              </div>
              {avatarMenuOpen && (
                <div className="avatar-dropdown" onClick={(e) => e.stopPropagation()}>
                  <div className="dropdown-user-info">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button onClick={goProfile}><FaUserCircle />My Profile</button>
                  {user?.role === 'volunteer' && (
                    <button onClick={goScanner} style={{ color: '#00e5ff', fontWeight: 'bold' }}><FaQrcode />Ticket Scanner</button>
                  )}
                  {(hasRole("content-lead") || hasRole("media-lead") || hasRole("super-admin")) && (
                    <button onClick={goAdmin}><FaUserShield />Admin Portal</button>
                  )}
                  <button className="logout-btn" onClick={handleLogout}><FaSignOutAlt />Logout</button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {showNotices && <HangingNoticeBoard onClose={() => setShowNotices(false)} />}
    </>
  );
};

export default TopNavbar;
