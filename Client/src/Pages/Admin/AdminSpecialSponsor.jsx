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
    showCoBrandingLogo: true,
    showFloatingBubbles: true,
    showEventCardsLogo: true,
    showTeamTitleCoBranding: true,
    showTeamCardsLogo: true,
    includeInEmails: false,
    customFontUrl: '',
    customFontFamily: '',
    brandColor: '#ff1f01',
    applyBrandFont: false
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
          showCoBrandingLogo: res.data.data.showCoBrandingLogo ?? true,
          showFloatingBubbles: res.data.data.showFloatingBubbles ?? true,
          showEventCardsLogo: res.data.data.showEventCardsLogo ?? true,
          showTeamTitleCoBranding: res.data.data.showTeamTitleCoBranding ?? true,
          showTeamCardsLogo: res.data.data.showTeamCardsLogo ?? true,
          includeInEmails: res.data.data.includeInEmails ?? false,
          customFontUrl: res.data.data.customFontUrl || '',
          customFontFamily: res.data.data.customFontFamily || '',
          brandColor: res.data.data.brandColor || '#ff1f01',
          applyBrandFont: res.data.data.applyBrandFont ?? false
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
    if (!form.name) return showToast('Sponsor Name is required', 'error');
    if (!previewURL && !fileToUpload) return showToast('Logo is required', 'error');

    setSubmitting(true);
    try {
      let logoURL = previewURL;
      let logoFileId = sponsor?.logoFileId;

      if (fileToUpload) {
        const uploadFormData = new FormData();
        uploadFormData.append('image', fileToUpload);

        const uploadRes = await api.post('/upload/image', uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        logoURL = uploadRes.data.data.url;
        logoFileId = uploadRes.data.data.fileId;
      }

      await api.post('/special-sponsor', { ...form, logoURL, logoFileId });
      localStorage.removeItem('api_cache_/special-sponsor/active');
      showToast('Special sponsor saved successfully!');
      fetchConfig();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving sponsor', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Remove special sponsor configuration?')) return;
    try {
      await api.delete('/special-sponsor');
      localStorage.removeItem('api_cache_/special-sponsor/active');
      setSponsor(null);
      setForm({
        name: '', tagline: '',
        showFloatingBubbles: false, includeInEmails: false, showCoBrandingLogo: true,
        customFontUrl: '', customFontFamily: '', brandColor: '#ff1f01', applyBrandFont: false
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
          <h1>Special Sponsor Featuring & Brand Takeover</h1>
        </div>
        
        {loading ? (
          <div style={{ padding: '20px', color: '#888' }}>Loading config...</div>
        ) : (
          <div className="admin-form-card" style={{ maxWidth: '850px', margin: '20px auto', background: '#111', padding: '30px', borderRadius: '12px' }}>
            <p style={{ color: '#ccc', marginBottom: '30px', lineHeight: '1.6' }}>
              Configure a premium special sponsor takeover. Show co-branding in the navigation bar (<strong>MechaPEF × Brand</strong>), trigger dynamic floating bubbles, and apply custom brand fonts across the site headings!
            </p>
            
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                
                <div className="form-group full" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                  <label>Sponsor Logo (Background-less PNG) *</label>
                  <label style={{ 
                    width: '150px', height: '150px', border: '2px dashed #444', borderRadius: '12px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    background: '#1a1a1a', overflow: 'hidden', position: 'relative', padding: '10px'
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
                  <input value={form.name} onChange={e => f('name', e.target.value)} required placeholder="e.g. Coca-Cola" />
                </div>

                <div className="form-group">
                  <label>Tagline (Shows in Bubble Cloud)</label>
                  <input value={form.tagline} onChange={e => f('tagline', e.target.value)} placeholder="e.g. Refresh the World" />
                </div>

                {/* Co-Branding & Display Toggles */}
                <div className="form-group full" style={{ borderTop: '1px solid #333', paddingTop: '20px', marginTop: '10px' }}>
                  <h3 style={{ color: '#ff1f01', marginBottom: '15px' }}>Co-Branding & Display Placement Checkboxes</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#ddd', background: '#1a1a1a', padding: '12px 16px', borderRadius: '8px', border: '1px solid #333' }}>
                      <input type="checkbox" checked={form.showCoBrandingLogo} onChange={e => f('showCoBrandingLogo', e.target.checked)} style={{ width: 'auto', accentColor: '#ff1f01' }} />
                      Navbar Co-Branding (MechaPEF × Logo)
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#ddd', background: '#1a1a1a', padding: '12px 16px', borderRadius: '8px', border: '1px solid #333' }}>
                      <input type="checkbox" checked={form.showFloatingBubbles} onChange={e => f('showFloatingBubbles', e.target.checked)} style={{ width: 'auto', accentColor: '#ff1f01' }} />
                      Floating Screen Bubbles
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#ddd', background: '#1a1a1a', padding: '12px 16px', borderRadius: '8px', border: '1px solid #333' }}>
                      <input type="checkbox" checked={form.showEventCardsLogo} onChange={e => f('showEventCardsLogo', e.target.checked)} style={{ width: 'auto', accentColor: '#ff1f01' }} />
                      Event Cards Top-Right Logo (Past & Live Events)
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#ddd', background: '#1a1a1a', padding: '12px 16px', borderRadius: '8px', border: '1px solid #333' }}>
                      <input type="checkbox" checked={form.showTeamTitleCoBranding} onChange={e => f('showTeamTitleCoBranding', e.target.checked)} style={{ width: 'auto', accentColor: '#ff1f01' }} />
                      Our Team Heading Co-Branding (OUR TEAM × Logo)
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#ddd', background: '#1a1a1a', padding: '12px 16px', borderRadius: '8px', border: '1px solid #333' }}>
                      <input type="checkbox" checked={form.showTeamCardsLogo} onChange={e => f('showTeamCardsLogo', e.target.checked)} style={{ width: 'auto', accentColor: '#ff1f01' }} />
                      Our Team Member Photo Cards Top-Right Logo
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#ddd', background: '#1a1a1a', padding: '12px 16px', borderRadius: '8px', border: '1px solid #333' }}>
                      <input type="checkbox" checked={form.includeInEmails} onChange={e => f('includeInEmails', e.target.checked)} style={{ width: 'auto', accentColor: '#ff1f01' }} />
                      Include Logo in Registration Emails
                    </label>
                  </div>
                </div>

                {/* Brand Font & Color Takeover Section */}
                <div className="form-group full" style={{ borderTop: '1px solid #333', paddingTop: '20px', marginTop: '15px' }}>
                  <h3 style={{ color: '#ffcc00', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🎨 Brand Typography & Color Takeover
                  </h3>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#fff', fontWeight: 'bold', marginBottom: '15px' }}>
                    <input type="checkbox" checked={form.applyBrandFont} onChange={e => f('applyBrandFont', e.target.checked)} style={{ width: 'auto' }} />
                    Enable Brand Font & Color Takeover for Section Headings
                  </label>

                  {form.applyBrandFont && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', background: '#181818', padding: '20px', borderRadius: '10px', border: '1px solid #333' }}>
                      <div className="form-group">
                        <label>Custom Font CSS / Google Font URL</label>
                        <input 
                          value={form.customFontUrl} 
                          onChange={e => f('customFontUrl', e.target.value)} 
                          placeholder="e.g. https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap" 
                        />
                      </div>

                      <div className="form-group">
                        <label>Font Family Name</label>
                        <input 
                          value={form.customFontFamily} 
                          onChange={e => f('customFontFamily', e.target.value)} 
                          placeholder="e.g. 'Permanent Marker', cursive" 
                        />
                      </div>

                      <div className="form-group">
                        <label>Brand Accent Color</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <input 
                            type="color" 
                            value={form.brandColor} 
                            onChange={e => f('brandColor', e.target.value)}
                            style={{ width: '50px', height: '40px', padding: '0', cursor: 'pointer', border: 'none', background: 'transparent' }} 
                          />
                          <input 
                            type="text" 
                            value={form.brandColor} 
                            onChange={e => f('brandColor', e.target.value)}
                            placeholder="#ff1f01" 
                          />
                        </div>
                      </div>
                    </div>
                  )}
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
