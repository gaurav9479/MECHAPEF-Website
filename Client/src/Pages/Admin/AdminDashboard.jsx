import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaCalendarAlt, FaUsers, FaBullhorn, FaHandshake, FaCog, FaImages, FaSignOutAlt, FaHome } from 'react-icons/fa';
import api from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import './AdminDashboard.css';

import { Navigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { logout, user, hasRole } = useAuth();

  if (user?.role === 'endorsed-volunteer') {
    return <Navigate to="/admin/scanner" replace />;
  }

  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/login'); };
  const location = useLocation();
  const [stats, setStats] = useState({ events: 0, users: 0, announcements: 0, sponsors: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (location.state?.error) {
      setToast({ msg: location.state.error, type: 'error' });

      window.history.replaceState({}, document.title);
      setTimeout(() => setToast(null), 4000);
    }
  }, [location]);
  useEffect(() => {
    api.get('/events').then(res => {
      const events = res.data.data?.events || [];
      setRecentEvents(events.slice(0, 5));
      setStats(s => ({ ...s, events: res.data.data?.pagination?.totalCount || events.length }));
    }).catch(() => {});

    api.get('/auth/users').then(res => {
      setStats(s => ({ ...s, users: res.data.data?.pagination?.totalCount || 0 }));
    }).catch(() => {});

    api.get('/announcements').then(res => {
      const count = res.data.data?.announcements?.length || 0;
      setStats(s => ({ ...s, announcements: count }));
    }).catch(() => {});

    api.get('/sponsors').then(res => {
      const count = res.data.data?.sponsors?.length || 0;
      setStats(s => ({ ...s, sponsors: count }));
    }).catch(() => {});
  }, []);
  const handleNav = (e, path) => {
    if (window.innerWidth <= 768) {
      e.preventDefault();
      window.location.href = path;
    }
  };

  const adminLinks = [
    { to: '/admin/events', icon: <FaCalendarAlt />, label: 'Manage Events', desc: 'Create, edit & delete events' },
    { to: '/admin/past-events', icon: <FaCalendarAlt />, label: 'Past Events', desc: 'Manage past events & photos' },
    { to: '/admin/team', icon: <FaUsers />, label: 'Manage Team', desc: 'Add & update team members' },
    { to: '/admin/announcements', icon: <FaBullhorn />, label: 'Announcements', desc: 'Post & manage announcements' },
    { to: '/admin/sponsors', icon: <FaHandshake />, label: 'Sponsors', desc: 'Manage sponsor listings' },
  ];
  return (
    <div className="admin-layout">

      <AdminSidebar />

      <main className="admin-main">
        <div className="admin-header">
          <h1>Dashboard</h1>
          <p>Welcome to MechaPEF Admin Panel</p>
        </div>

        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <FaCalendarAlt className="stat-icon" />
            <div>
              <div className="stat-num">{stats.events}</div>
              <div className="stat-label">Total Events</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <FaUsers className="stat-icon" />
            <div>
              <div className="stat-num">{stats.users || 0}</div>
              <div className="stat-label">Total Users</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <FaBullhorn className="stat-icon" />
            <div>
              <div className="stat-num">{stats.announcements}</div>
              <div className="stat-label">Announcements</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <FaHandshake className="stat-icon" />
            <div>
              <div className="stat-num">{stats.sponsors}</div>
              <div className="stat-label">Sponsors</div>
            </div>
          </div>
        </div>

        <div className="admin-section-title">Quick Actions</div>
        <div className="admin-quick-grid">
          {adminLinks.map(link => (
            <Link to={link.to} key={link.to} className="admin-quick-card" onClick={(e) => handleNav(e, link.to)}>
              <div className="quick-icon">{link.icon}</div>
              <div>
                <div className="quick-label">{link.label}</div>
                <div className="quick-desc">{link.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="admin-section-title">Recent Events</div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Title</th><th>Category</th><th>Start Time</th><th>Venue</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {recentEvents.length === 0 ? (
                <tr><td colSpan="5" style={{textAlign:'center', color:'#555'}}>No events found</td></tr>
              ) : recentEvents.map(ev => (
                <tr key={ev._id}>
                  <td>{ev.title}</td>
                  <td><span className="tag">{ev.category}</span></td>
                  <td>{new Date(ev.startTime).toLocaleDateString()}</td>
                  <td>{ev.venue}</td>
                  <td><Link to={`/admin/events`} className="table-action-btn">Manage</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>


        <div className="admin-section-title" style={{ marginTop: '40px' }}>Design Guidelines</div>
        <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333', marginBottom: '40px' }}>
          <p style={{ color: '#aaa', marginBottom: '15px' }}>
            To ensure the website looks clean and professional, please ask the design team to export images with these exact dimensions (or equivalent aspect ratios):
          </p>
          <ul style={{ color: '#fff', lineHeight: '1.8', paddingLeft: '20px' }}>
            <li><strong style={{ color: '#ff1f01' }}>Home Slider / Event Banners:</strong> 1920x500px <span style={{ color: '#888' }}>(Ultrawide Landscape)</span></li>
            <li><strong style={{ color: '#ff1f01' }}>Sponsor Logos:</strong> 400x200px or 1:1 / 2:1 <span style={{ color: '#888' }}>(Transparent PNG required)</span></li>
            <li><strong style={{ color: '#ff1f01' }}>Gallery Images:</strong> 1920x1080px or 4:3 <span style={{ color: '#888' }}>(High quality JPG)</span></li>
            <li><strong style={{ color: '#ff1f01' }}>Team Members:</strong> 500x500px <span style={{ color: '#888' }}>(Square Portrait)</span></li>
          </ul>
        </div>
      </main>

      {toast && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
};
export default AdminDashboard;