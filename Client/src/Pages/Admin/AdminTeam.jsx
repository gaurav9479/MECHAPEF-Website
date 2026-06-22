import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaUsers, FaBullhorn, FaHandshake, FaHome, FaSignOutAlt, FaCog } from 'react-icons/fa';
import api from '../../services/api';
import './AdminDashboard.css';
const SUB_TEAMS = ['Core', 'WebDev', 'PR', 'Logistics', 'Graphics', 'GeneralUser'];
const emptyForm = {
  name: '', role: '', subTeam: 'Core', yearOfStudy: 2,
  linkedinURL: '', githubURL: '', email: '', bio: '', displayOrder: 0
};
const AdminTeam = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/login'); };
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterSubTeam, setFilterSubTeam] = useState('');
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  const fetchMembers = async () => {
    try {
      const res = await api.get('/team', { params: filterSubTeam ? { subTeam: filterSubTeam } : {} });
      setMembers(res.data.data?.members || res.data.data || []);
    } catch {
      showToast('Failed to load team members', 'error');
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchMembers(); }, [filterSubTeam]);
  const openCreate = () => { setEditingMember(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (m) => {
    setEditingMember(m);
    setForm({ name: m.name, role: m.role, subTeam: m.subTeam, yearOfStudy: m.yearOfStudy,
      linkedinURL: m.linkedinURL || '', githubURL: m.githubURL || '', email: m.email || '',
      bio: m.bio || '', displayOrder: m.displayOrder || 0 });
    setShowModal(true);
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Remove this team member?')) return;
    try {
      await api.delete(`/team/${id}`);
      showToast('Member removed');
      fetchMembers();
    } catch { showToast('Failed to delete', 'error'); }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingMember) {
        await api.put(`/team/${editingMember._id}`, form);
        showToast('Member updated!');
      } else {
        await api.post('/team', form);
        showToast('Member added!');
      }
      setShowModal(false);
      fetchMembers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving member', 'error');
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
          <Link to="/admin/events" className="sidebar-link"><FaCalendarAlt /> Events</Link>
          <Link to="/admin/team" className="sidebar-link active"><FaUsers /> Team</Link>
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
          <h1>Team Members</h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              value={filterSubTeam}
              onChange={e => setFilterSubTeam(e.target.value)}
              style={{ background: '#111', border: '1px solid #333', color: '#aaa', padding: '8px 14px', borderRadius: '8px', fontFamily: 'sans-serif' }}
            >
              <option value="">All Sub-teams</option>
              {SUB_TEAMS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn-primary" onClick={openCreate}><FaPlus /> Add Member</button>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Role</th><th>Sub-Team</th><th>Year</th><th>Active</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#555', padding: '30px' }}>Loading...</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#555', padding: '30px' }}>No members yet.</td></tr>
              ) : members.map(m => (
                <tr key={m._id}>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{m.name}</td>
                  <td>{m.role}</td>
                  <td><span className="tag">{m.subTeam}</span></td>
                  <td>{m.yearOfStudy ? `Year ${m.yearOfStudy}` : '—'}</td>
                  <td>{m.isActive ? <span style={{ color: '#00c864' }}>✓</span> : <span style={{ color: '#555' }}>✗</span>}</td>
                  <td style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => openEdit(m)}><FaEdit /></button>
                    <button className="btn-danger" onClick={() => handleDelete(m._id)}><FaTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2>{editingMember ? 'Edit Member' : 'Add Team Member'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Name *</label>
                  <input value={form.name} onChange={e => f('name', e.target.value)} required placeholder="Full name" />
                </div>
                <div className="form-group">
                  <label>Designation/Role *</label>
                  <input value={form.role} onChange={e => f('role', e.target.value)} required placeholder="e.g. President" />
                </div>
                <div className="form-group">
                  <label>Sub-Team *</label>
                  <select value={form.subTeam} onChange={e => f('subTeam', e.target.value)}>
                    {SUB_TEAMS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Year of Study</label>
                  <select value={form.yearOfStudy} onChange={e => f('yearOfStudy', Number(e.target.value))}>
                    {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="member@email.com" />
                </div>
                <div className="form-group">
                  <label>Display Order</label>
                  <input type="number" value={form.displayOrder} onChange={e => f('displayOrder', Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label>LinkedIn URL</label>
                  <input value={form.linkedinURL} onChange={e => f('linkedinURL', e.target.value)} placeholder="https://linkedin.com/in/..." />
                </div>
                <div className="form-group">
                  <label>GitHub URL</label>
                  <input value={form.githubURL} onChange={e => f('githubURL', e.target.value)} placeholder="https://github.com/..." />
                </div>
                <div className="form-group full">
                  <label>Bio</label>
                  <textarea value={form.bio} onChange={e => f('bio', e.target.value)} placeholder="Short bio..." />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingMember ? 'Update Member' : 'Add Member'}
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
export default AdminTeam;