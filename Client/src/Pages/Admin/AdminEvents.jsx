import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaUsers, FaBullhorn, FaHandshake, FaHome, FaSignOutAlt, FaCog } from 'react-icons/fa';
import { eventService } from '../../services/services';
import './AdminDashboard.css';
const CATEGORIES = ['MechapefEvent', 'Departmental'];
const emptyForm = {
  title: '', description: '', category: 'MechapefEvent',
  startTime: '', endTime: '', venue: '', registrationDeadline: '',
  maxTeamSize: 1, registrationFee: 0, featured: false, rules: '', prizes: ''
};
const AdminEvents = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/login'); };
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  const fetchEvents = async () => {
    try {
      const res = await eventService.getAll({ limit: 50 });
      setEvents(res.data.data?.events || []);
    } catch { showToast('Failed to load events', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchEvents(); }, []);
  const openCreate = () => {
    setEditingEvent(null);
    setForm(emptyForm);
    setShowModal(true);
  };
  const openEdit = (ev) => {
    setEditingEvent(ev);
    setForm({
      title: ev.title, description: ev.description,
      category: ev.category, venue: ev.venue,
      startTime: ev.startTime?.slice(0, 16),
      endTime: ev.endTime?.slice(0, 16),
      registrationDeadline: ev.registrationDeadline?.slice(0, 16),
      maxTeamSize: ev.maxTeamSize, registrationFee: ev.registrationFee,
      featured: ev.featured,
      rules: Array.isArray(ev.rules) ? ev.rules.join('\n') : '',
      prizes: ev.prizes || ''
    });
    setShowModal(true);
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await eventService.delete(id);
      showToast('Event deleted');
      fetchEvents();
    } catch { showToast('Failed to delete', 'error'); }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      ...form,
      rules: form.rules ? form.rules.split('\n').filter(Boolean) : [],
      maxTeamSize: Number(form.maxTeamSize),
      registrationFee: Number(form.registrationFee),
    };
    try {
      if (editingEvent) {
        await eventService.update(editingEvent._id, payload);
        showToast('Event updated!');
      } else {
        await eventService.create(payload);
        showToast('Event created!');
      }
      setShowModal(false);
      fetchEvents();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving event', 'error');
    } finally { setSubmitting(false); }
  };
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <FaCog className="sidebar-logo-icon" />
          <div>
            <div className="sidebar-logo-main">Mecha<span>PEF</span></div>
            <div className="sidebar-logo-sub">Admin Portal</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <Link to="/admin" className="sidebar-link"><FaCalendarAlt /> Dashboard</Link>
          <Link to="/admin/events" className="sidebar-link active"><FaCalendarAlt /> Events</Link>
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
      <main className="admin-form-page">
        <div className="admin-form-topbar">
          <h1>Events</h1>
          <button className="btn-primary" onClick={openCreate}><FaPlus /> Add Event</button>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Title</th><th>Category</th><th>Venue</th><th>Start</th><th>Featured</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{textAlign:'center', color:'#555', padding:'30px'}}>Loading...</td></tr>
              ) : events.length === 0 ? (
                <tr><td colSpan="6" style={{textAlign:'center', color:'#555', padding:'30px'}}>No events yet. Create one!</td></tr>
              ) : events.map(ev => (
                <tr key={ev._id}>
                  <td style={{fontWeight:600, color:'#fff'}}>{ev.title}</td>
                  <td><span className="tag">{ev.category}</span></td>
                  <td>{ev.venue}</td>
                  <td>{new Date(ev.startTime).toLocaleDateString()}</td>
                  <td>{ev.featured ? <span style={{color:'#00c864'}}>✓</span> : <span style={{color:'#555'}}>—</span>}</td>
                  <td style={{display:'flex', gap:'8px'}}>
                    <button className="btn-secondary" style={{padding:'6px 12px', fontSize:'0.8rem'}} onClick={() => openEdit(ev)}><FaEdit /></button>
                    <button className="btn-danger" onClick={() => handleDelete(ev._id)}><FaTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2>{editingEvent ? 'Edit Event' : 'Create Event'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group full">
                  <label>Title *</label>
                  <input value={form.title} onChange={e => f('title', e.target.value)} required placeholder="Event title" />
                </div>
                <div className="form-group full">
                  <label>Description *</label>
                  <textarea value={form.description} onChange={e => f('description', e.target.value)} required placeholder="Event description" />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select value={form.category} onChange={e => f('category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Venue *</label>
                  <input value={form.venue} onChange={e => f('venue', e.target.value)} required placeholder="Event venue" />
                </div>
                <div className="form-group">
                  <label>Start Time *</label>
                  <input type="datetime-local" value={form.startTime} onChange={e => f('startTime', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>End Time *</label>
                  <input type="datetime-local" value={form.endTime} onChange={e => f('endTime', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Registration Deadline *</label>
                  <input type="datetime-local" value={form.registrationDeadline} onChange={e => f('registrationDeadline', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Max Team Size</label>
                  <input type="number" min="1" value={form.maxTeamSize} onChange={e => f('maxTeamSize', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Registration Fee (₹)</label>
                  <input type="number" min="0" value={form.registrationFee} onChange={e => f('registrationFee', e.target.value)} />
                </div>
                <div className="form-group" style={{justifyContent:'flex-end'}}>
                  <label style={{display:'flex', alignItems:'center', gap:'10px', cursor:'pointer'}}>
                    <input type="checkbox" checked={form.featured} onChange={e => f('featured', e.target.checked)} style={{width:'auto'}} />
                    Featured Event
                  </label>
                </div>
                <div className="form-group full">
                  <label>Rules (one per line)</label>
                  <textarea value={form.rules} onChange={e => f('rules', e.target.value)} placeholder="Rule 1&#10;Rule 2" />
                </div>
                <div className="form-group full">
                  <label>Prizes</label>
                  <input value={form.prizes} onChange={e => f('prizes', e.target.value)} placeholder="1st: ₹5000, 2nd: ₹3000" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {toast && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
};
export default AdminEvents;