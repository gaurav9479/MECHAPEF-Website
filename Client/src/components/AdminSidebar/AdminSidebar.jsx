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
  FaShoePrints
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './AdminSidebar.css';

const AdminSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, hasRole } = useAuth();

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
    await logout();
    navigate('/');
  };

  const closeSidebar = () => {
    setIsOpen(false);
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
          <Link to="/admin" className={`sidebar-link ${location.pathname === '/admin' ? 'active' : ''}`}>
            <FaCog /> Dashboard
          </Link>
          
          {(hasRole('super-admin') || hasRole('content-lead') || hasRole('media-lead')) && (
            <Link to="/admin/messages" className={`sidebar-link ${location.pathname === '/admin/messages' ? 'active' : ''}`}>
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

          {(hasRole('super-admin') || hasRole('content-lead')) && (
            <>
              <Link to="/admin/events" className={`sidebar-link ${location.pathname === '/admin/events' ? 'active' : ''}`}>
                <FaCalendarAlt /> Live Events
              </Link>
              <Link to="/admin/past-events" className={`sidebar-link ${location.pathname === '/admin/past-events' ? 'active' : ''}`}>
                <FaCalendarAlt /> Past Events
              </Link>
              <Link to="/admin/team" className={`sidebar-link ${location.pathname === '/admin/team' ? 'active' : ''}`}>
                <FaUsers /> Team
              </Link>
              <Link to="/admin/announcements" className={`sidebar-link ${location.pathname === '/admin/announcements' ? 'active' : ''}`}>
                <FaBullhorn /> Announcements
              </Link>
              <Link to="/admin/management" className={`sidebar-link ${location.pathname === '/admin/management' ? 'active' : ''}`}>
                <FaCog /> Management
              </Link>
              <Link to="/admin/scanner" className={`sidebar-link ${location.pathname === '/admin/scanner' ? 'active' : ''}`}>
                <FaQrcode /> Scan Tickets
              </Link>
            </>
          )}

          {(hasRole('super-admin') || hasRole('media-lead')) && (
            <>
              <Link to="/admin/sponsors" className={`sidebar-link ${location.pathname === '/admin/sponsors' ? 'active' : ''}`}>
                <FaHandshake /> Sponsors
              </Link>
              <Link to="/admin/special-sponsor" className={`sidebar-link ${location.pathname === '/admin/special-sponsor' ? 'active' : ''}`}>
                <FaHandshake /> Special Sponsor
              </Link>
              <Link to="/admin/magazine" className={`sidebar-link ${location.pathname === '/admin/magazine' ? 'active' : ''}`}>
                <FaBook /> Magazine
              </Link>
              <Link to="/admin/gallery" className={`sidebar-link ${location.pathname === '/admin/gallery' ? 'active' : ''}`}>
                <FaImages /> Gallery
              </Link>
            </>
          )}

          {hasRole('super-admin') && (
            <>
              <Link to="/admin/mail" className={`sidebar-link ${location.pathname === '/admin/mail' ? 'active' : ''}`}>
                <FaEnvelope /> Mail
              </Link>
              <Link to="/admin/footprints" className={`sidebar-link ${location.pathname === '/admin/footprints' ? 'active' : ''}`}>
                <FaShoePrints /> Footprints
              </Link>
            </>
          )}
        </nav>
        <div className="sidebar-bottom">
          <Link to="/" className="sidebar-link"><FaHome /> View Site</Link>
          <button onClick={handleLogout} className="sidebar-logout"><FaSignOutAlt /> Logout</button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
