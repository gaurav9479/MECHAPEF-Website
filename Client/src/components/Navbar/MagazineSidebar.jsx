import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaCog,
  FaUserShield,
  FaSignOutAlt,
  FaUserCircle,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import HangingNoticeBoard from "../HangingNoticeBoard/HangingNoticeBoard";
import { useMagazineTransition } from "../../context/MagazineTransitionContext";
import { apiGetCached } from "../../utils/apiCache";
import api from "../../services/api";
import "./Navbar.css";

const MagazineSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout, hasRole } = useAuth();
  const { transitionState, setTransitionState, triggerExit } = useMagazineTransition();

  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [showNotices, setShowNotices] = useState(false);
  const [hasUnreadNotice, setHasUnreadNotice] = useState(false);
  const [activeLivePoll, setActiveLivePoll] = useState(null);
  const desktopRef = useRef(null);

  useEffect(() => {
    apiGetCached('/announcements', (data) => {
      const items = data.data?.announcements || data.data || [];
      const active = items.filter(n => n.isActive);
      const seenNotices = JSON.parse(localStorage.getItem('seen_notices') || '[]');
      const hasUnread = active.some(n => !seenNotices.includes(n._id));
      setHasUnreadNotice(hasUnread);
    }).catch(() => {});
  }, [showNotices]);

  useEffect(() => {
    const fetchActivePoll = () => {
      api.get('/events/live/active')
        .then(res => setActiveLivePoll(res.data.questions?.[0] || null))
        .catch(() => setActiveLivePoll(null));
    };
    fetchActivePoll();
    const interval = setInterval(fetchActivePoll, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleNavClick = (targetRoute, callback) => {
    if (location.pathname === '/magazine' && transitionState === 'idle') {
      const intercepted = triggerExit(targetRoute);
      if (intercepted) {
        if (callback) callback();
        else navigate(targetRoute);

        setTimeout(() => {
           setTransitionState('idle');
        }, 1200);
        return; 
      }
    }
    
    if (callback) callback();
    else navigate(targetRoute);
  };

  useEffect(() => {
    const close = (e) => {
      if (desktopRef.current?.contains(e.target)) return;
      setAvatarMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, []);

  const handleAuth = () => {
    if (!user) {
      handleNavClick("/login");
      return;
    }
    if (hasRole("event-lead") || hasRole("media-lead") || hasRole("super-admin")) {
      handleNavClick("/admin");
    }
  };

  const handleLogout = async () => {
    setAvatarMenuOpen(false);
    await logout();
    navigate("/");
  };

  const goProfile = () => {
    setAvatarMenuOpen(false);
    navigate("/profile");
  };

  const goAdmin = () => {
    setAvatarMenuOpen(false);
    navigate("/admin");
  };

  const toggleAvatar = (e) => {
    e.stopPropagation();
    setAvatarMenuOpen((prev) => !prev);
  };

  const scrollToSection = (vhMultiplier, id) => {
    handleNavClick("/", () => {
      if (location.pathname !== "/") {
        navigate("/");
      }
      setTimeout(() => {
        window.scrollTo({
          top: vhMultiplier * window.innerHeight,
          behavior: "smooth",
        });
      }, 500);
    });
  };

  const scrollToElement = (id) => {
    handleNavClick("/", () => {
      if (location.pathname !== "/") {
        window.location.href = `/#${id}`;
      } else {
        const el = document.getElementById(id);
        if (el) {
          if (id === "about-us") {
            const elTop = el.getBoundingClientRect().top + window.scrollY;
            const targetY = elTop + window.innerHeight * 5.5 * 0.28;
            window.scrollTo({ top: targetY, behavior: "smooth" });
          } else {
            el.scrollIntoView({ behavior: "smooth" });
          }
        }
      }
    });
  };

  return (
    <>
      <nav className="navbar-vertical">
        <div className="logo" onClick={() => handleNavClick("/")} style={{ cursor: "pointer" }}>
          <FaCog className="logo-icon" />
          <div className="logo-text">
            <div className="logo-main">Mecha<span>PEF</span></div>
            <div className="logo-sub">MNNIT</div>
          </div>
        </div>

        <ul className="nav-links" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <li onClick={() => scrollToSection(0)}>
            <span>Home</span>
          </li>
          <li onClick={() => scrollToElement("about-us")}>
            <span>About</span>
          </li>
          <li onClick={() => handleNavClick("/events")}>
            <span>Events</span>
          </li>
          <li onClick={() => handleNavClick("/gallery")}>
            <span>Gallery</span>
          </li>
          <li onClick={() => handleNavClick("/sponsors")}>
            <span>Sponsors</span>
          </li>
          <li onClick={() => scrollToElement("our-team")}>
            <span>Our Team</span>
          </li>
          <li onClick={() => activeLivePoll
            ? navigate(`/live-poll/${activeLivePoll.eventId}/${activeLivePoll.questionId}`)
            : setShowNotices(true)}>
            <span style={{ position: 'relative', display: 'inline-block' }}>
              Notice Board
              {(hasUnreadNotice || activeLivePoll) && (
                <span style={{
                  position: 'absolute',
                  top: '0px',
                  right: '-14px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: activeLivePoll ? '#00c864' : '#ffff00',
                  boxShadow: activeLivePoll ? '0 0 5px #00c864' : '0 0 5px #ffff00',
                  display: 'inline-block'
                }} title="New Notice" />
              )}
            </span>
          </li>
        </ul>

        {/* Since vertical nav uses standard desktop profile button placement */}
        <div className="desktop-only-btn" style={{ display: 'block', marginTop: 'auto' }}>
          {!user ? (
            <button className="contact-btn" onClick={handleAuth}>Login</button>
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
                  {(hasRole("event-lead") || hasRole("media-lead") || hasRole("super-admin")) && (
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

export default MagazineSidebar;
