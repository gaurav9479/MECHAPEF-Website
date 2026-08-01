import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaCog, 
  FaCalendarAlt, 
  FaUsers, 
  FaBullhorn, 
  FaHandshake, 
  FaImages, 
  FaHome, 
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaQrcode,
  FaBook,
  FaEnvelope,
  FaShoePrints,
  FaServer,
  FaCube
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './AdminSidebar.css';

const AdminSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, hasRole, isRole, user } = useAuth();

  const fetchUnseenCount = async () => {
    try {
      const res = await api.get('/contact/unseen-count');
      setUnseenCount(res.data?.data?.unseenCount || 0);
    } catch (e) {
      // Ignore background errors
    }
  };

  useEffect(() => {
    fetchUnseenCount();
    const interval = setInterval(fetchUnseenCount, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async (e) => {
    e.preventDefault();
    setIsOpen(false);
    await logout();
    navigate('/');
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  const handleNav = (e, path) => {
    if (window.innerWidth <= 768) {
      e.preventDefault();
      window.location.href = path;
    } else {
      setIsOpen(false);
    }
  };

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Add a class to body to hide global gradients while in admin mode
  useEffect(() => {
    document.body.classList.add('admin-mode');
    return () => {
      document.body.classList.remove('admin-mode');
    };
  }, []);

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button 
        className="admin-mobile-toggle" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Admin Sidebar"
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Backdrop for mobile */}
      <div 
        className={`admin-sidebar-backdrop ${isOpen ? 'active' : ''}`}
        onClick={closeSidebar}
      ></div>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <FaCog className="sidebar-logo-icon" />
          <div>
            <div className="sidebar-logo-main">Mecha<span>PEF</span></div>
            <div className="sidebar-logo-sub">Admin Portal</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {user?.role === 'endorsed-volunteer' ? (
            <Link to="/admin/scanner" className={`sidebar-link ${location.pathname === '/admin/scanner' ? 'active' : ''}`} onClick={(e) => handleNav(e, '/admin/scanner')}>
              <FaQrcode /> Scan Tickets
            </Link>
          ) : (
            <>
              <Link to="/admin" className={`sidebar-link ${location.pathname === '/admin' ? 'active' : ''}`} onClick={(e) => handleNav(e, '/admin')}>
                <FaCog /> Dashboard
              </Link>
              
              {isRole('super-admin', 'event-lead', 'media-lead') && (
                <Link to="/admin/messages" className={`sidebar-link ${location.pathname === '/admin/messages' ? 'active' : ''}`} onClick={(e) => handleNav(e, '/admin/messages')}>
                  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                    <FaEnvelope />
                    {unseenCount > 0 && (
                      <span 
                        title={`${unseenCount} unseen message(s)`}
                        style={{ 
                          position: 'absolute', 
                          top: '-4px', 
                          right: '-4px', 
                          width: '9px', 
                          height: '9px', 
                          borderRadius: '50%', 
                          backgroundColor: '#ffcc00', 
                          boxShadow: '0 0 8px #ffcc00',
                          border: '1px solid #000'
                        }} 
                      />
                    )}
                  </div>
                  Messages
                </Link>
              )}

              {isRole('super-admin', 'event-lead', 'media-lead') && (
                <>
                  <Link to="/admin/events" className={`sidebar-link ${location.pathname === '/admin/events' ? 'active' : ''}`} onClick={(e) => handleNav(e, '/admin/events')}>
                    <FaCalendarAlt /> Live Events
                  </Link>
                  <Link to="/admin/past-events" className={`sidebar-link ${location.pathname === '/admin/past-events' ? 'active' : ''}`} onClick={(e) => handleNav(e, '/admin/past-events')}>
                    <FaCalendarAlt /> Past Events
                  </Link>
                  <Link to="/admin/team" className={`sidebar-link ${location.pathname === '/admin/team' ? 'active' : ''}`} onClick={(e) => handleNav(e, '/admin/team')}>
                    <FaUsers /> Team
                  </Link>
                </>
              )}

              {isRole('super-admin', 'event-lead', 'media-lead') && (
                <Link to="/admin/announcements" className={`sidebar-link ${location.pathname === '/admin/announcements' ? 'active' : ''}`} onClick={(e) => handleNav(e, '/admin/announcements')}>
                  <FaBullhorn /> Announcements
                </Link>
              )}

              {isRole('super-admin', 'media-lead') && (
                <>
                  <Link to="/admin/management" className={`sidebar-link ${location.pathname === '/admin/management' ? 'active' : ''}`} onClick={(e) => handleNav(e, '/admin/management')}>
                    <FaCog /> Management
                  </Link>
                  <Link to="/admin/projects" className={`sidebar-link ${location.pathname === '/admin/projects' ? 'active' : ''}`} onClick={(e) => handleNav(e, '/admin/projects')}>
                    <FaCube /> 3D Projects
                  </Link>
                </>
              )}

              {isRole('super-admin', 'event-lead', 'media-lead') && (
                <Link to="/admin/scanner" className={`sidebar-link ${location.pathname === '/admin/scanner' ? 'active' : ''}`} onClick={(e) => handleNav(e, '/admin/scanner')}>
                  <FaQrcode /> Scan Tickets
                </Link>
              )}
            </>
          )}

          {isRole('super-admin', 'event-lead', 'media-lead') && (
            <>
              <Link to="/admin/sponsors" className={`sidebar-link ${location.pathname === '/admin/sponsors' ? 'active' : ''}`} onClick={(e) => handleNav(e, '/admin/sponsors')}>
                <FaHandshake /> Sponsors
              </Link>
              <Link to="/admin/special-sponsor" className={`sidebar-link ${location.pathname === '/admin/special-sponsor' ? 'active' : ''}`} onClick={(e) => handleNav(e, '/admin/special-sponsor')}>
                <FaHandshake /> Special Sponsor
              </Link>
              <Link to="/admin/magazine" className={`sidebar-link ${location.pathname === '/admin/magazine' ? 'active' : ''}`} onClick={(e) => handleNav(e, '/admin/magazine')}>
                <FaBook /> Magazine
              </Link>
            </>
          )}

          {isRole('super-admin', 'media-lead') && (
            <Link to="/admin/gallery" className={`sidebar-link ${location.pathname === '/admin/gallery' ? 'active' : ''}`} onClick={(e) => handleNav(e, '/admin/gallery')}>
              <FaImages /> Gallery
            </Link>
          )}

          {hasRole('super-admin') && (
            <>
              <Link to="/admin/mail" className={`sidebar-link ${location.pathname === '/admin/mail' ? 'active' : ''}`} onClick={(e) => handleNav(e, '/admin/mail')}>
                <FaEnvelope /> Mail
              </Link>
              <Link to="/admin/footprints" className={`sidebar-link ${location.pathname === '/admin/footprints' ? 'active' : ''}`} onClick={(e) => handleNav(e, '/admin/footprints')}>
                <FaShoePrints /> Footprints
              </Link>
              <Link to="/admin/redis" className={`sidebar-link ${location.pathname === '/admin/redis' || location.pathname === '/redis' ? 'active' : ''}`} onClick={(e) => handleNav(e, '/admin/redis')}>
                <FaServer /> Redis
              </Link>
            </>
          )}
        </nav>
        <div className="sidebar-bottom">
          <Link to="/" className="sidebar-link" onClick={(e) => handleNav(e, '/')}><FaHome /> View Site</Link>
          <button onClick={handleLogout} className="sidebar-logout"><FaSignOutAlt /> Logout</button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
