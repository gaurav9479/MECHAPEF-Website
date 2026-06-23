import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaUsers, FaBullhorn, FaHandshake, FaHome, FaSignOutAlt, FaCog, FaImages } from 'react-icons/fa';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import api from '../../services/api';
import './AdminDashboard.css';
const TIERS = ['Title', 'Gold', 'Silver', 'Bronze'];
const TIER_COLOR = { Title: '#ff0000', Gold: '#FFD700', Silver: '#C0C0C0', Bronze: '#CD7F32' };
const currentYear = () => {
  const now = new Date();
  const y = now.getFullYear();
  return `${y}-${String(y + 1).slice(-2)}`;
};
const emptyForm = {
  companyName: '', tier: 'Gold', logoURL: '', websiteURL: '',
  description: '', contactPerson: '', contactEmail: '',
  academicYear: currentYear(), sponsorshipAmount: 0, displayOrder: 0, isActive: true
};
const AdminSponsors = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/login'); };
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  const fetchSponsors = async () => {
    try {
      const res = await api.get('/sponsors');
      setSponsors(res.data.data?.sponsors || res.data.data || []);
    } catch { showToast('Failed to load sponsors', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchSponsors(); }, []);
  const openCreate = () => { setEditingSponsor(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (s) => {
    setEditingSponsor(s);
    setForm({
      companyName: s.companyName, tier: s.tier, logoURL: s.logoURL || '',
      websiteURL: s.websiteURL || '', description: s.description || '',
      contactPerson: s.contactPerson || '', contactEmail: s.contactEmail || '',
      academicYear: s.academicYear, sponsorshipAmount: s.sponsorshipAmount || 0,
      displayOrder: s.displayOrder || 0, isActive: s.isActive
    });
    setShowModal(true);
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Remove this sponsor?')) return;
    try {
      await api.delete(`/sponsors/${id}`);
      showToast('Sponsor removed');
      fetchSponsors();
    } catch { showToast('Failed to delete', 'error'); }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingSponsor) {
        await api.put(`/sponsors/${editingSponsor._id}`, form);
        showToast('Sponsor updated!');
      } else {
        await api.post('/sponsors', form);
        showToast('Sponsor added!');
      }
      setShowModal(false);
      fetchSponsors();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving', 'error');
    } finally { setSubmitting(false); }
  };
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-form-page">
        <div className="admin-form-topbar">
          <h1>Sponsors</h1>
          <button className="btn-primary" onClick={openCreate}><FaPlus /> Add Sponsor</button>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Company</th><th>Tier</th><th>Academic Year</th><th>Amount</th><th>Active</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#555', padding: '30px' }}>Loading...</td></tr>
              ) : sponsors.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#555', padding: '30px' }}>No sponsors yet.</td></tr>
              ) : sponsors.map(s => (
                <tr key={s._id}>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{s.companyName}</td>
                  <td><span style={{ color: TIER_COLOR[s.tier], fontWeight: 700 }}>{s.tier}</span></td>
                  <td>{s.academicYear}</td>
                  <td>{s.sponsorshipAmount ? `₹${s.sponsorshipAmount.toLocaleString()}` : '—'}</td>
                  <td>{s.isActive ? <span style={{ color: '#00c864' }}>✓</span> : <span style={{ color: '#555' }}>✗</span>}</td>
                  <td style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => openEdit(s)}><FaEdit /></button>
                    <button className="btn-danger" onClick={() => handleDelete(s._id)}><FaTrash /></button>
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
            <h2>{editingSponsor ? 'Edit Sponsor' : 'Add Sponsor'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Company Name *</label>
                  <input value={form.companyName} onChange={e => f('companyName', e.target.value)} required placeholder="Company name" />
                </div>
                <div className="form-group">
                  <label>Tier *</label>
                  <select value={form.tier} onChange={e => f('tier', e.target.value)}>
                    {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group full">
                  <label>Logo URL *</label>
                  <input value={form.logoURL} onChange={e => f('logoURL', e.target.value)} required placeholder="https://imagekit.io/..." />
                </div>
                <div className="form-group full">
                  <label>Website URL</label>
                  <input value={form.websiteURL} onChange={e => f('websiteURL', e.target.value)} placeholder="https://company.com" />
                </div>
                <div className="form-group full">
                  <label>Description</label>
                  <textarea value={form.description} onChange={e => f('description', e.target.value)} placeholder="About this sponsor..." />
                </div>
                <div className="form-group">
                  <label>Contact Person</label>
                  <input value={form.contactPerson} onChange={e => f('contactPerson', e.target.value)} placeholder="Name" />
                </div>
                <div className="form-group">
                  <label>Contact Email</label>
                  <input type="email" value={form.contactEmail} onChange={e => f('contactEmail', e.target.value)} placeholder="contact@company.com" />
                </div>
                <div className="form-group">
                  <label>Academic Year *</label>
                  <input value={form.academicYear} onChange={e => f('academicYear', e.target.value)} required placeholder="2025-26" />
                </div>
                <div className="form-group">
                  <label>Sponsorship Amount (₹)</label>
                  <input type="number" min="0" value={form.sponsorshipAmount} onChange={e => f('sponsorshipAmount', Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label>Display Order</label>
                  <input type="number" value={form.displayOrder} onChange={e => f('displayOrder', Number(e.target.value))} />
                </div>
                <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.isActive} onChange={e => f('isActive', e.target.checked)} style={{ width: 'auto' }} />
                    Active
                  </label>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingSponsor ? 'Update' : 'Add Sponsor'}
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
export default AdminSponsors;