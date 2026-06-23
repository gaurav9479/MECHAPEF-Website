import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaUsers, FaBullhorn, FaHandshake, FaHome, FaSignOutAlt, FaCog, FaImages } from 'react-icons/fa';
import api from '../../services/api';
import './AdminDashboard.css';
const PRIORITIES = ['Low', 'Medium', 'High'];
const TARGET_TYPES = ['None', 'Event', 'External', 'Internal'];
const emptyForm = {
  title: '', description: '', priority: 'Medium',
  targetType: 'None', targetLink: '',
  startDate: '', endDate: '', isActive: true, displayOrder: 0
};
const AdminAnnouncements = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/login'); };
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  const fetchItems = async () => {
    try {
      const res = await api.get('/announcements');
      setItems(res.data.data?.announcements || res.data.data || []);
    } catch { showToast('Failed to load announcements', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchItems(); }, []);
  const openCreate = () => { setEditingItem(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      title: item.title, description: item.description, priority: item.priority,
      targetType: item.targetType || 'None', targetLink: item.targetLink || '',
      startDate: item.startDate?.slice(0, 10) || '',
      endDate: item.endDate?.slice(0, 10) || '',
      isActive: item.isActive, displayOrder: item.displayOrder || 0
    });
    setShowModal(true);
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      showToast('Announcement deleted');
      fetchItems();
    } catch { showToast('Failed to delete', 'error'); }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingItem) {
        await api.put(`/announcements/${editingItem._id}`, form);
        showToast('Announcement updated!');
      } else {
        await api.post('/announcements', form);
        showToast('Announcement created!');
      }
      setShowModal(false);
      fetchItems();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving', 'error');
    } finally { setSubmitting(false); }
  };
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const priorityColor = { High: '#ff4444', Medium: '#ffaa00', Low: '#00c864' };
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-form-page">
        <div className="admin-form-topbar">
          <h1>Announcements</h1>
          <button className="btn-primary" onClick={openCreate}><FaPlus /> Add Announcement</button>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Title</th><th>Priority</th><th>Target</th><th>Active</th><th>Start</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#555', padding: '30px' }}>Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#555', padding: '30px' }}>No announcements yet.</td></tr>
              ) : items.map(item => (
                <tr key={item._id}>
                  <td style={{ fontWeight: 600, color: '#fff', maxWidth: '250px' }}>{item.title}</td>
                  <td><span style={{ color: priorityColor[item.priority], fontWeight: 600 }}>{item.priority}</span></td>
                  <td><span className="tag">{item.targetType}</span></td>
                  <td>{item.isActive ? <span style={{ color: '#00c864' }}>Live</span> : <span style={{ color: '#555' }}>Off</span>}</td>
                  <td>{item.startDate ? new Date(item.startDate).toLocaleDateString() : '—'}</td>
                  <td style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => openEdit(item)}><FaEdit /></button>
                    <button className="btn-danger" onClick={() => handleDelete(item._id)}><FaTrash /></button>
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
            <h2>{editingItem ? 'Edit Announcement' : 'New Announcement'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group full">
                  <label>Title *</label>
                  <input value={form.title} onChange={e => f('title', e.target.value)} required placeholder="Announcement title" />
                </div>
                <div className="form-group full">
                  <label>Description *</label>
                  <textarea value={form.description} onChange={e => f('description', e.target.value)} required placeholder="Details..." />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={form.priority} onChange={e => f('priority', e.target.value)}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Target Type</label>
                  <select value={form.targetType} onChange={e => f('targetType', e.target.value)}>
                    {TARGET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                {form.targetType !== 'None' && (
                  <div className="form-group full">
                    <label>Target Link / ID</label>
                    <input value={form.targetLink} onChange={e => f('targetLink', e.target.value)} placeholder="https://... or event ID" />
                  </div>
                )}
                <div className="form-group">
                  <label>Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => f('startDate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input type="date" value={form.endDate} onChange={e => f('endDate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Display Order</label>
                  <input type="number" value={form.displayOrder} onChange={e => f('displayOrder', Number(e.target.value))} />
                </div>
                <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.isActive} onChange={e => f('isActive', e.target.checked)} style={{ width: 'auto' }} />
                    Active / Live
                  </label>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingItem ? 'Update' : 'Create'}
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
export default AdminAnnouncements;