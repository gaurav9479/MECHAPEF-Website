import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import api from '../../services/api';
import './AdminDashboard.css';

const AdminMagazine = () => {
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: 'Latest Magazine',
    pdfUrl: '',
    status: 'Published'
  });

  useEffect(() => {
    fetchMagazine();
  }, []);

  const fetchMagazine = async () => {
    try {
      const res = await api.get('/magazine');
      if (res.data.data?.magazine) {
        setForm(res.data.data.magazine);
      }
    } catch (err) {
      showToast('Failed to load magazine data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/magazine', form);
      showToast('Magazine updated successfully!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      return showToast('Please upload a valid PDF file', 'error');
    }

    if (file.size > 20 * 1024 * 1024) {
      return showToast('File size should be less than 20MB', 'error');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'magazine_pdfs');

    setUploading(true);
    try {
      const res = await api.post('/upload/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data.data.url;
      setForm({ ...form, pdfUrl: url });
      showToast('PDF uploaded successfully!');
    } catch (err) {
      console.error(err);
      showToast('PDF upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePdf = async () => {
    if (!window.confirm("Are you sure you want to remove the PDF? This will unpublish the magazine immediately.")) return;

    setUploading(true);
    try {
      const updatedForm = { ...form, pdfUrl: null };
      await api.put('/magazine', updatedForm);
      setForm(updatedForm);
      showToast('PDF removed successfully!');
    } catch (err) {
      showToast('Failed to remove PDF', 'error');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="admin-layout"><AdminSidebar /><main className="admin-form-page"><h2>Loading...</h2></main></div>;

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-form-page">
        <div className="admin-form-topbar">
          <h1>Manage Magazine (PDF Edition)</h1>
        </div>

        <form onSubmit={handleSave} className="admin-form-container">
          <h3>Magazine Information</h3>
          <div className="admin-form-grid">
            <div className="form-group">
              <label>Magazine Title</label>
              <input
                value={form.title || ''}
                onChange={e => setForm({ ...form, title: e.target.value })}
                maxLength={80}
                required
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </select>
            </div>
          </div>

          <hr style={{ margin: '30px 0', borderColor: '#333' }} />

          <h3>Upload PDF</h3>
          <div className="admin-form-grid">
            <div className="form-group full">
              <label>Select PDF File</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={handlePdfUpload}
                disabled={uploading}
              />
              {uploading && <p style={{ color: '#ffc107', marginTop: '10px' }}>Uploading PDF, please wait...</p>}
            </div>

            {form.pdfUrl && (
              <div className="form-group full">
                <label>Current PDF URL</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="text" value={form.pdfUrl} readOnly style={{ flex: 1 }} />
                  <a href={form.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '10px 15px', textDecoration: 'none' }}>
                    View PDF
                  </a>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '10px 15px', background: '#dc3545', color: '#fff', border: 'none' }}
                    onClick={handleRemovePdf}
                  >
                    Remove PDF
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="admin-form-actions" style={{ marginTop: '30px' }}>
            <button type="submit" className="primary-btn" disabled={saving || uploading}>
              {saving ? 'Saving...' : 'Save Magazine Settings'}
            </button>
          </div>
        </form>

        {toast && (
          <div className={`toast ${toast.type}`}>
            {toast.msg}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminMagazine;

