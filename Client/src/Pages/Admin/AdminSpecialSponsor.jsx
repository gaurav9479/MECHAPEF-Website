import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import api from '../../services/api';
import { FaCloudUploadAlt, FaTrash, FaSave } from 'react-icons/fa';
import './AdminDashboard.css';

const AdminSpecialSponsor = () => {
  const [sponsor, setSponsor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    name: '',
    tagline: '',
    showFloatingBubbles: false,
    includeInEmails: false
  });
  const [previewURL, setPreviewURL] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchConfig = async () => {
    try {
      const res = await api.get('/special-sponsor/active');
      if (res.data.data) {
        setSponsor(res.data.data);
        setForm({
          name: res.data.data.name,
          tagline: res.data.data.tagline || '',
          showFloatingBubbles: res.data.data.showFloatingBubbles,
          includeInEmails: res.data.data.includeInEmails
        });
        setPreviewURL(res.data.data.logoURL);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        showToast('Failed to load config', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileToUpload(file);
      setPreviewURL(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let logoURL = sponsor?.logoURL;
      let logoFileId = sponsor?.logoFileId;

      if (fileToUpload) {
        const formData = new FormData();
        formData.append('file', fileToUpload);
        const res = await api.post('/upload/file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        logoURL = res.data.data.url;
        logoFileId = res.data.data.fileId;
      }

      if (!logoURL) {
        showToast('Logo is required', 'error');
        setSubmitting(false);
        return;
      }

      await api.post('/special-sponsor', { ...form, logoURL, logoFileId });
      showToast('Special Sponsor configuration updated!');
      fetchConfig();
      setFileToUpload(null);
    } catch (err) {
      showToast('Failed to update config', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete the active special sponsor?')) return;
    try {
      await api.delete('/special-sponsor');
      setSponsor(null);
      setForm({
        name: '', tagline: '',
        showFloatingBubbles: false, includeInEmails: false
      });
      setPreviewURL('');
      showToast('Special sponsor deleted');
    } catch (err) {
      showToast('Failed to delete', 'error');
    }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-form-page">
        <div className="admin-form-topbar">
          <h1>Special Sponsor Featuring</h1>
        </div>
        
        {loading ? (
          <div style={{ padding: '20px', color: '#888' }}>Loading config...</div>
        ) : (
          <div className="admin-form-card" style={{ maxWidth: '800px', margin: '20px auto', background: '#111', padding: '30px', borderRadius: '12px' }}>
            <p style={{ color: '#ccc', marginBottom: '30px' }}>
              Configure a premium special sponsor. This sponsor can have their logo floating on the website, override global website font sizes, and appear in HTML emails.
            </p>
            
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                
                <div className="form-group full" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                  <label>Sponsor Logo *</label>
                  <label style={{ 
                    width: '150px', height: '150px', border: '2px dashed #444', borderRadius: '50%', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    background: '#222', overflow: 'hidden', position: 'relative'
                  }}>
                    {previewURL ? (
                      <img src={previewURL} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <FaCloudUploadAlt size={40} color="#666" />
                    )}
                    <input type="file" accept="image/*" hidden onChange={handleFileChange} />
                  </label>
                </div>

                <div className="form-group">
                  <label>Sponsor Name *</label>
                  <input value={form.name} onChange={e => f('name', e.target.value)} required placeholder="e.g. Google" />
                </div>

                <div className="form-group">
                  <label>Tagline (Shows in Bubble Cloud)</label>
                  <input value={form.tagline} onChange={e => f('tagline', e.target.value)} placeholder="e.g. Empowering Innovation" />
                </div>

                <div className="form-group full" style={{ borderTop: '1px solid #333', paddingTop: '20px', marginTop: '10px' }}>
                  <h3 style={{ color: '#ff1f01', marginBottom: '15px' }}>Display Settings</h3>
                  
                  <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#ddd' }}>
                      <input type="checkbox" checked={form.showFloatingBubbles} onChange={e => f('showFloatingBubbles', e.target.checked)} style={{ width: 'auto' }} />
                      Show Floating Bubbles (Landing Page)
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#ddd' }}>
                      <input type="checkbox" checked={form.includeInEmails} onChange={e => f('includeInEmails', e.target.checked)} style={{ width: 'auto' }} />
                      Include Logo in Emails
                    </label>
                  </div>
                </div>
                
              </div>

              <div className="modal-actions" style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
                {sponsor ? (
                  <button type="button" className="btn-danger" onClick={handleDelete}><FaTrash /> Remove Sponsor</button>
                ) : <div />}
                
                <button type="submit" className="btn-primary" disabled={submitting}>
                  <FaSave style={{ marginRight: '8px' }} /> {submitting ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
      {toast && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
};

export default AdminSpecialSponsor;
