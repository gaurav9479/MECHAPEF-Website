import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaCog,
  FaUserShield,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaUserCircle,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import HangingNoticeBoard from "../HangingNoticeBoard/HangingNoticeBoard";
import { scrollToId } from "../../utils/scroll";
import "./Navbar.css";

const Navbar = ({ variant }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout, hasRole } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showNotices, setShowNotices] = useState(false);

  const desktopRef = useRef(null);
  const mobileRef = useRef(null);

  // -----------------------------
  // Close dropdown when clicked outside
  // -----------------------------
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

  // -----------------------------
  // Navbar Scroll
  // -----------------------------
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;

      setIsScrolled(y > vh * 0.8);

      let index = 0;

      if (y < vh * 1.5) index = 0;
      else if (y < vh * 5.5) index = 1;
      else if (y < vh * 10.5) index = 2;
      else if (y < vh * 14.5) index = 3;
      else index = 4;

      setActiveIndex(index);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // -----------------------------
  // Login Button
  // -----------------------------
  const handleAuth = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (hasRole("content-lead") ||hasRole("media-lead") ||hasRole("super-admin")) {
      navigate("/admin");
    }
  };

  // -----------------------------
  // Logout
  // -----------------------------
  const handleLogout = async () => {
    setAvatarMenuOpen(false);
    setMenuOpen(false);

    await logout();

    navigate("/");
  };

  // -----------------------------
  // Open Profile
  // -----------------------------
  const goProfile = () => {
    setAvatarMenuOpen(false);
    setMenuOpen(false);

    navigate("/profile");
  };

  // -----------------------------
  // Open Admin
  // -----------------------------
  const goAdmin = () => {
    setAvatarMenuOpen(false);
    setMenuOpen(false);

    navigate("/admin");
  };

  // -----------------------------
  // Toggle Avatar
  // -----------------------------
  const toggleAvatar = (e) => {
    e.stopPropagation();
    setAvatarMenuOpen((prev) => !prev);
  };

  // -----------------------------
  // Scroll Sections
  // -----------------------------
  const scrollToSection = (vhMultiplier, id) => {
    setMenuOpen(false);

    const mobile = window.innerWidth <= 768;

    if (location.pathname !== "/") {
      navigate("/");

      let attempts = 0;
      const checkAndScroll = setInterval(() => {
        if (mobile && id) {
          const el = document.getElementById(id);
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
            clearInterval(checkAndScroll);
          }
        } else {
          // If not mobile or no id, just scroll to vh (document body should be ready immediately)
          window.scrollTo({
            top: vhMultiplier * window.innerHeight,
            behavior: "smooth",
          });
          clearInterval(checkAndScroll);
        }
        attempts++;
        if (attempts > 10) clearInterval(checkAndScroll);
      }, 100);

      return;
    }

    if (mobile && id) {
      scrollToId(id, 80);
    } else {
      window.scrollTo({
        top: vhMultiplier * window.innerHeight,
        behavior: "smooth",
      });
    }
  };

  const scrollToElement = (id) => {
    setMenuOpen(false);
    
    // For "about-us", we need to scroll deeper into the section because the text fades in later
    let offset = window.innerWidth <= 768 ? 80 : 0;
    if (id === "about-us" && window.innerWidth > 768) {
      offset = -window.innerHeight * 1.5; // Scroll 1.5 viewport heights deeper so text is visible
    }

    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        scrollToId(id, offset);
      }, 500);
      return;
    }
    scrollToId(id, offset);
  };

  return (
    <>
      <div className="navbar-hover-zone"></div>

      <nav
        className={
          variant === "vertical" 
            ? "navbar-vertical" 
            : `navbar ${isScrolled ? "navbar-hidden" : "navbar-visible"}`
        }
      >
        {/* ---------------- Logo ---------------- */}

        <div
          className="logo"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          <FaCog className="logo-icon" />

          <div className="logo-text">
            <div className="logo-main">
              Mecha<span>PEF</span>
            </div>

            <div className="logo-sub">
              MNNIT
            </div>
          </div>
        </div>

        {/* ---------------- Mobile Toggle ---------------- */}

        <div
          className="mobile-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </div>

        {/* ---------------- Navigation ---------------- */}

        <ul className={menuOpen ? "nav-links open" : "nav-links"} style={variant === 'vertical' ? { flexDirection: 'column', alignItems: 'flex-start' } : {}}>
                    <li
            className={(location.pathname === "/" && activeIndex === 0) ? "active" : ""}
            onClick={() => scrollToSection(0)}
          >
            {(location.pathname === "/" && activeIndex === 0) && (
              <motion.div
                className="nav-sliding-pill"
                layoutId="navPill"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span>Home</span>
          </li>

          <li
            className={(location.pathname === "/" && activeIndex === 1) ? "active" : ""}
            onClick={() => scrollToElement(window.innerWidth <= 768 ? "mobile-about" : "about-us")}
          >
            {(location.pathname === "/" && activeIndex === 1) && (
              <motion.div
                className="nav-sliding-pill"
                layoutId="navPill"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span>About</span>
          </li>

          <li
            className={(location.pathname.startsWith("/events") || (location.pathname === "/" && activeIndex === 2)) ? "active" : ""}
            onClick={() => {
              setMenuOpen(false);
              navigate("/events");
            }}
          >
            {(location.pathname.startsWith("/events") || (location.pathname === "/" && activeIndex === 2)) && (
              <motion.div
                className="nav-sliding-pill"
                layoutId="navPill"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span>Events</span>
          </li>

          <li
            className={(location.pathname.startsWith("/gallery") || (location.pathname === "/" && activeIndex === 3)) ? "active" : ""}
            onClick={() => {
              setMenuOpen(false);
              navigate("/gallery");
            }}
          >
            {(location.pathname.startsWith("/gallery") || (location.pathname === "/" && activeIndex === 3)) && (
              <motion.div
                className="nav-sliding-pill"
                layoutId="navPill"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span>Gallery</span>
          </li>

          <li
            className={location.pathname === "/sponsors" ? "active" : ""}
            onClick={() => {
              setMenuOpen(false);
              navigate("/sponsors");
            }}
          >
            {location.pathname === "/sponsors" && (
              <motion.div
                className="nav-sliding-pill"
                layoutId="navPill"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span>Sponsors</span>
          </li>

          <li
            className={(location.pathname === "/" && activeIndex === 4) ? "active" : ""}
            onClick={() =>
              scrollToElement(
                window.innerWidth <= 768 ? "mh-team" : "our-team"
              )
            }
          >
            {(location.pathname === "/" && activeIndex === 4) && (
              <motion.div
                className="nav-sliding-pill"
                layoutId="navPill"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span>Our Team</span>
          </li>

          <li
            onClick={() => {
              setMenuOpen(false);
              setShowNotices(true);
            }}
          >
            <span>Notice Board</span>
          </li>

          {/* ================= MOBILE LOGIN / PROFILE ================= */}

          <li className="mobile-only-btn">
            {!user ? (
              <button
                className="contact-btn"
                onClick={handleAuth}
              >
                Login
              </button>
            ) : (
              <div
                className="nav-avatar-container"
                ref={mobileRef}
              >
                <div
                  className={`nav-avatar ${
                    user.isVerified ? "verified-avatar" : ""
                  }`}
                  onClick={toggleAvatar}
                >
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt="profile"
                    />
                  ) : (
                    <FaUserCircle />
                  )}
                </div>

                {avatarMenuOpen && (
                  <div
                    className="avatar-dropdown"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="dropdown-user-info">
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </div>

                    <div className="dropdown-divider"></div>

                    <button onClick={goProfile}>
                      <FaUserCircle />
                      My Profile
                    </button>

                    {(hasRole("content-lead") ||hasRole("media-lead") ||hasRole("super-admin")) && (
                      <button onClick={goAdmin}>
                        <FaUserShield />
                        Admin Portal
                      </button>
                    )}

                    <button
                      className="logout-btn"
                      onClick={handleLogout}
                    >
                      <FaSignOutAlt />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </li>

        </ul>

        {/* ================= DESKTOP PROFILE ================= */}

        <div className="desktop-only-btn">
          {!user ? (
            <button
              className="contact-btn"
              onClick={handleAuth}
            >
              Login
            </button>
          ) : (
            <div
              className="nav-avatar-container"
              ref={desktopRef}
            >
              <div
                className={`nav-avatar ${
                  user.isVerified ? "verified-avatar" : ""
                }`}
                onClick={toggleAvatar}
              >
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt="profile"
                  />
                ) : (
                  <FaUserCircle />
                )}
              </div>

              {avatarMenuOpen && (
                <div
                  className="avatar-dropdown"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="dropdown-user-info">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>

                  <div className="dropdown-divider"></div>

                  <button onClick={goProfile}>
                    <FaUserCircle />
                    My Profile
                  </button>

                  {(hasRole("content-lead") ||hasRole("media-lead") ||hasRole("super-admin")) && (
                    <button onClick={goAdmin}>
                      <FaUserShield />
                      Admin Portal
                    </button>
                  )}

                  <button
                    className="logout-btn"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </nav>

      {showNotices && (
        <HangingNoticeBoard
          onClose={() => setShowNotices(false)}
        />
      )}
    </>
  );
};

export default Navbar;