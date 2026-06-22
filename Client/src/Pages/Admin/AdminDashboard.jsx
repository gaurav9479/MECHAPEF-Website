import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaCalendarAlt, FaUsers, FaBullhorn, FaHandshake, FaCog, FaSignOutAlt, FaHome } from 'react-icons/fa';
import api from '../../services/api';
import './AdminDashboard.css';
const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/login'); };
  const [stats, setStats] = useState({ events: 0, team: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  useEffect(() => {
    api.get('/events').then(res => {
      const events = res.data.data?.events || [];
      setRecentEvents(events.slice(0, 5));
      setStats(s => ({ ...s, events: res.data.data?.pagination?.totalCount || events.length }));
    }).catch(() => {});
  }, []);
  const adminLinks = [
    { to: '/admin/events', icon: <FaCalendarAlt />, label: 'Manage Events', desc: 'Create, edit & delete events' },
    { to: '/admin/team', icon: <FaUsers />, label: 'Manage Team', desc: 'Add & update team members' },
    { to: '/admin/announcements', icon: <FaBullhorn />, label: 'Announcements', desc: 'Post & manage announcements' },
    { to: '/admin/sponsors', icon: <FaHandshake />, label: 'Sponsors', desc: 'Manage sponsor listings' },
  ];
  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <FaCog className="sidebar-logo-icon" />
          <div>
            <div className="sidebar-logo-main">Mecha<span>PEF</span></div>
            <div className="sidebar-logo-sub">Admin Portal</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <Link to="/admin" className="sidebar-link active"><FaCalendarAlt /> Dashboard</Link>
          <Link to="/admin/events" className="sidebar-link"><FaCalendarAlt /> Events</Link>
          <Link to="/admin/team" className="sidebar-link"><FaUsers /> Team</Link>
          <Link to="/admin/announcements" className="sidebar-link"><FaBullhorn /> Announcements</Link>
          <Link to="/admin/sponsors" className="sidebar-link"><FaHandshake /> Sponsors</Link>
          <Link to="/admin/management" className="sidebar-link"><FaCog /> Management</Link>
        </nav>
        <div className="sidebar-bottom">
          <Link to="/" className="sidebar-link"><FaHome /> View Site</Link>
          <button onClick={handleLogout} className="sidebar-logout"><FaSignOutAlt /> Logout</button>
        </div>
      </aside>
      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-header">
          <h1>Dashboard</h1>
          <p>Welcome to MechaPEF Admin Panel</p>
        </div>
        {/* Stat Cards */}
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
              <div className="stat-num">—</div>
              <div className="stat-label">Team Members</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <FaBullhorn className="stat-icon" />
            <div>
              <div className="stat-num">—</div>
              <div className="stat-label">Announcements</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <FaHandshake className="stat-icon" />
            <div>
              <div className="stat-num">—</div>
              <div className="stat-label">Sponsors</div>
            </div>
          </div>
        </div>
        {/* Quick Links */}
        <div className="admin-section-title">Quick Actions</div>
        <div className="admin-quick-grid">
          {adminLinks.map(link => (
            <Link to={link.to} key={link.to} className="admin-quick-card">
              <div className="quick-icon">{link.icon}</div>
              <div>
                <div className="quick-label">{link.label}</div>
                <div className="quick-desc">{link.desc}</div>
              </div>
            </Link>
          ))}
        </div>
        {/* Recent Events */}
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
      </main>
    </div>
  );
};
export default AdminDashboard;