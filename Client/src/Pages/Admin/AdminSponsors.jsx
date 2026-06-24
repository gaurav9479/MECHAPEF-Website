import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaUsers, FaBullhorn, FaHandshake, FaHome, FaSignOutAlt, FaCog, FaImages } from 'react-icons/fa';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import api from '../../services/api';
import { sponsorConfigService } from '../../services/services';
import './AdminDashboard.css';

const TIER_COLOR = { Title: '#ff0000', Gold: '#FFD700', Silver: '#C0C0C0', Bronze: '#CD7F32' };
const currentYear = () => {
  const now = new Date();
  const y = now.getFullYear();
  return `${y}-${String(y + 1).slice(-2)}`;
};
const emptyForm = {
  companyName: '', tier: 'Gold', logoURL: '', websiteURL: '',
  description: '', contactPerson: '', contactEmail: '',
  academicYear: currentYear(), sponsorshipAmount: 0, displayOrder: 0, isActive: true, isPastSponsor: false
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
  const [uploading, setUploading] = useState(false);
  const [config, setConfig] = useState({ tiers: [], deliverables: [] });
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configForm, setConfigForm] = useState({ tiers: [], deliverables: [] });
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
  const fetchConfig = async () => {
    try {
      const res = await sponsorConfigService.getConfig();
      setConfig(res.data.data);
    } catch { showToast('Failed to load config', 'error'); }
  };
  useEffect(() => { fetchSponsors(); fetchConfig(); }, []);
  const openCreate = () => { setEditingSponsor(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (s) => {
    setEditingSponsor(s);
    setForm({
      companyName: s.companyName, tier: s.tier, logoURL: s.logoURL || '',
      websiteURL: s.websiteURL || '', description: s.description || '',
      contactPerson: s.contactPerson || '', contactEmail: s.contactEmail || '',
      academicYear: s.academicYear, sponsorshipAmount: s.sponsorshipAmount || 0,
      displayOrder: s.displayOrder || 0, isActive: s.isActive, isPastSponsor: s.isPastSponsor || false
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    
    setUploading(true);
    try {
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm(p => ({ ...p, logoURL: res.data.data.url }));
      showToast('Logo uploaded successfully!');
    } catch (err) {
      showToast('Failed to upload logo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const openConfig = () => {
    setConfigForm(JSON.parse(JSON.stringify(config)));
    setShowConfigModal(true);
  };

  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await sponsorConfigService.updateConfig(configForm);
      showToast('Settings saved!');
      setShowConfigModal(false);
      fetchConfig();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving settings', 'error');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-form-page">
        <div className="admin-form-topbar">
          <h1>Sponsors</h1>
          <div>
            <button className="btn-secondary" onClick={openConfig} style={{ marginRight: '10px' }}><FaCog /> Manage Settings</button>
            <button className="btn-primary" onClick={openCreate}><FaPlus /> Add Sponsor</button>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Company</th><th>Tier</th><th>Past Sponsor?</th><th>Academic Year</th><th>Amount</th><th>Active</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#555', padding: '30px' }}>Loading...</td></tr>
              ) : sponsors.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#555', padding: '30px' }}>No sponsors yet.</td></tr>
              ) : sponsors.map(s => (
                <tr key={s._id}>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{s.companyName}</td>
                  <td><span style={{ color: TIER_COLOR[s.tier] || '#fff', fontWeight: 700 }}>{s.tier}</span></td>
                  <td>{s.isPastSponsor ? <span style={{ color: '#ff1f01' }}>Yes</span> : <span style={{ color: '#888' }}>No</span>}</td>
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
                    {config.tiers.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div className="form-group full">
                  <label>Sponsor Logo *</label>
                  <input type="file" accept="image/*" onChange={handleFileUpload} />
                  {uploading && <small style={{ color: '#ffaa00' }}>Uploading...</small>}
                  {form.logoURL && !uploading && (
                    <div style={{ marginTop: '10px' }}>
                      <img src={form.logoURL} alt="Logo Preview" style={{ maxWidth: '100%', height: '80px', objectFit: 'contain', backgroundColor: '#fff', padding: '5px', borderRadius: '4px' }} />
                      <button type="button" className="btn-danger" style={{ display: 'block', marginTop: '5px', padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => f('logoURL', '')}>Remove Image</button>
                    </div>
                  )}
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
                <div className="form-group" style={{ justifyContent: 'flex-end', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.isPastSponsor} onChange={e => f('isPastSponsor', e.target.checked)} style={{ width: 'auto' }} />
                    Mark as Past Sponsor
                  </label>
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

      {showConfigModal && (
        <div className="modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <h2>Manage Sponsor Settings</h2>
            <form onSubmit={handleConfigSubmit}>
              <div className="config-sections" style={{ display: 'flex', gap: '20px', flexDirection: 'column', maxHeight: '60vh', overflowY: 'auto' }}>
                
                {/* Tiers */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ color: '#ff1f01', fontSize: '1.2rem' }}>Sponsor Tiers</h3>
                    <button type="button" className="btn-secondary" onClick={() => {
                      const newTiers = [...configForm.tiers, { name: 'New Tier', icon: 'FaMedal', description: '', order: configForm.tiers.length + 1 }];
                      setConfigForm({...configForm, tiers: newTiers});
                    }} style={{ padding: '4px 8px', fontSize: '0.8rem' }}><FaPlus /> Add Tier</button>
                  </div>
                  {configForm.tiers.map((tier, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <input value={tier.name} onChange={e => {
                        const newTiers = [...configForm.tiers]; newTiers[idx].name = e.target.value; setConfigForm({...configForm, tiers: newTiers});
                      }} placeholder="Tier Name" style={{ flex: 1, background: '#111', color: '#fff', padding: '8px', border: '1px solid #333' }} />
                      
                      <input value={tier.icon} onChange={e => {
                        const newTiers = [...configForm.tiers]; newTiers[idx].icon = e.target.value; setConfigForm({...configForm, tiers: newTiers});
                      }} placeholder="Icon (e.g. FaMedal)" style={{ flex: 1, background: '#111', color: '#fff', padding: '8px', border: '1px solid #333' }} />

                      <input value={tier.description} onChange={e => {
                        const newTiers = [...configForm.tiers]; newTiers[idx].description = e.target.value; setConfigForm({...configForm, tiers: newTiers});
                      }} placeholder="Description" style={{ flex: 2, background: '#111', color: '#fff', padding: '8px', border: '1px solid #333' }} />
                      
                      <button type="button" onClick={() => {
                        const newTiers = configForm.tiers.filter((_, i) => i !== idx); setConfigForm({...configForm, tiers: newTiers});
                      }} style={{ background: 'transparent', color: '#ff4444', border: 'none', cursor: 'pointer' }}><FaTrash /></button>
                    </div>
                  ))}
                </div>

                {/* Deliverables */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ color: '#ff1f01', fontSize: '1.2rem' }}>Deliverables</h3>
                    <button type="button" className="btn-secondary" onClick={() => {
                      const newDelivs = [...configForm.deliverables, { title: 'New Benefit', icon: 'FaBullhorn', description: '', order: configForm.deliverables.length + 1 }];
                      setConfigForm({...configForm, deliverables: newDelivs});
                    }} style={{ padding: '4px 8px', fontSize: '0.8rem' }}><FaPlus /> Add Benefit</button>
                  </div>
                  {configForm.deliverables.map((deliv, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <input value={deliv.title} onChange={e => {
                        const newDelivs = [...configForm.deliverables]; newDelivs[idx].title = e.target.value; setConfigForm({...configForm, deliverables: newDelivs});
                      }} placeholder="Title" style={{ flex: 1, background: '#111', color: '#fff', padding: '8px', border: '1px solid #333' }} />
                      
                      <input value={deliv.icon} onChange={e => {
                        const newDelivs = [...configForm.deliverables]; newDelivs[idx].icon = e.target.value; setConfigForm({...configForm, deliverables: newDelivs});
                      }} placeholder="Icon" style={{ flex: 1, background: '#111', color: '#fff', padding: '8px', border: '1px solid #333' }} />

                      <input value={deliv.description} onChange={e => {
                        const newDelivs = [...configForm.deliverables]; newDelivs[idx].description = e.target.value; setConfigForm({...configForm, deliverables: newDelivs});
                      }} placeholder="Description" style={{ flex: 2, background: '#111', color: '#fff', padding: '8px', border: '1px solid #333' }} />
                      
                      <button type="button" onClick={() => {
                        const newDelivs = configForm.deliverables.filter((_, i) => i !== idx); setConfigForm({...configForm, deliverables: newDelivs});
                      }} style={{ background: 'transparent', color: '#ff4444', border: 'none', cursor: 'pointer' }}><FaTrash /></button>
                    </div>
                  ))}
                </div>

              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowConfigModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Settings'}
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