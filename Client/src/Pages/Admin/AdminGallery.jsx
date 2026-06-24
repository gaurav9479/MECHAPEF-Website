import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import { FaCalendarAlt, FaUsers, FaBullhorn, FaHandshake, FaCog, FaImages, FaSignOutAlt, FaHome, FaPlus, FaEdit, FaTrash, FaImage, FaUpload } from 'react-icons/fa';
import api from '../../services/api';
import './AdminDashboard.css';

const AdminGallery = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/login'); };

  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, msg: '', type: '' });

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: '' }), 3000);
  };


  const [showModal, setShowModal] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', coverImageURL: '', isActive: true });
  const [submitting, setSubmitting] = useState(false);


  const [manageImagesAlbum, setManageImagesAlbum] = useState(null);
  const [albumImages, setAlbumImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => { fetchAlbums(); }, []);

  const fetchAlbums = async () => {
    try {
      const res = await api.get('/gallery?all=true');
      setAlbums(res.data.data.albums);
    } catch (err) {
      showToast('Failed to fetch albums', 'error');
    } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditingAlbum(null);
    setForm({ title: '', description: '', coverImageURL: '', isActive: true });
    setShowModal(true);
  };

  const openEdit = (album) => {
    setEditingAlbum(album);
    setForm({ title: album.title, description: album.description || '', coverImageURL: album.coverImageURL || '', isActive: album.isActive });
    setShowModal(true);
  };

  const deleteAlbum = async (id) => {
    if (!window.confirm('Delete this album completely?')) return;
    try {
      await api.delete(`/gallery/${id}`);
      showToast('Album deleted');
      fetchAlbums();
    } catch (err) {
      showToast('Error deleting album', 'error');
    }
  };

  const saveAlbum = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingAlbum) {
        await api.put(`/gallery/${editingAlbum._id}`, form);
        showToast('Album updated');
      } else {
        await api.post('/gallery', form);
        showToast('Album created');
      }
      setShowModal(false);
      fetchAlbums();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving album', 'error');
    } finally { setSubmitting(false); }
  };

  const openManageImages = async (album) => {
    setManageImagesAlbum(album);

    try {
      const res = await api.get(`/gallery/${album._id}`);
      setAlbumImages(res.data.data.album.images || []);
    } catch {
      showToast('Error fetching album images', 'error');
    }
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImages(true);

    try {
      const uploadedImages = [];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('image', files[i]);
        const uploadRes = await api.post('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
        uploadedImages.push({
          imageURL: uploadRes.data.data.url,
          imagekitFileId: uploadRes.data.data.fileId
        });
      }

      await api.post(`/gallery/${manageImagesAlbum._id}/images`, { images: uploadedImages });
      showToast(`${uploadedImages.length} images added successfully`);
      

      const res = await api.get(`/gallery/${manageImagesAlbum._id}`);
      setAlbumImages(res.data.data.album.images || []);
      fetchAlbums(); 
    } catch (err) {
      showToast('Error uploading images', 'error');
    } finally {
      setUploadingImages(false);
      e.target.value = ''; // reset file input
    }
  };

  const removeImage = async (imageId) => {
    if (!window.confirm('Remove this image?')) return;
    try {
      await api.delete(`/gallery/${manageImagesAlbum._id}/images/${imageId}`);
      setAlbumImages(prev => prev.filter(img => img._id !== imageId));
      showToast('Image removed');
      fetchAlbums();
    } catch {
      showToast('Error removing image', 'error');
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
      setForm({ ...form, coverImageURL: res.data.data.url });
      showToast('Cover uploaded successfully');
    } catch {
      showToast('Failed to upload cover', 'error');
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="admin-form-page">
        <div className="admin-form-topbar">
          <h1>Manage Gallery Albums</h1>
          <button className="btn-primary" onClick={openCreate}><FaPlus /> Create Album</button>
        </div>

        {toast.show && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}

        {loading ? <p>Loading albums...</p> : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Cover</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Images</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {albums.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center' }}>No albums created.</td></tr>
                ) : albums.map(alb => (
                  <tr key={alb._id}>
                    <td>
                      {alb.coverImageURL ? (
                        <img src={alb.coverImageURL} alt="cover" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                      ) : (
                        <div style={{ width: '60px', height: '40px', background: '#333', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}><FaImage /></div>
                      )}
                    </td>
                    <td>{alb.title}</td>
                    <td>
                      <span className={`status-badge ${alb.isActive ? 'status-live' : 'status-off'}`}>
                        {alb.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td>{alb.images?.length || 0} items</td>
                    <td style={{ display: 'flex', gap: '10px' }}>
                      <button className="btn-secondary" style={{ padding: '6px 10px' }} onClick={() => openManageImages(alb)}>Manage Images</button>
                      <button className="table-action-btn" onClick={() => openEdit(alb)}><FaEdit /></button>
                      <button className="table-action-btn" style={{ color: '#ff4444' }} onClick={() => deleteAlbum(alb._id)}><FaTrash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* CREATE / EDIT ALBUM MODAL */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '500px' }}>
            <div className="admin-modal-header">
              <h2>{editingAlbum ? 'Edit Album' : 'Create Album'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={saveAlbum} className="admin-form">
              <div className="form-group">
                <label>Album Title</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows="3"></textarea>
              </div>
              <div className="form-group">
                <label>Cover Image</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {form.coverImageURL && <img src={form.coverImageURL} alt="cover" style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />}
                  <input type="file" accept="image/*" id="coverUpload" style={{ display: 'none' }} onChange={handleCoverUpload} />
                  <label htmlFor="coverUpload" className="btn-secondary" style={{ cursor: 'pointer', padding: '8px 12px', display: 'inline-block' }}>Upload Cover</label>
                </div>
              </div>
              <div className="form-checkbox">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                <label htmlFor="isActive">Album is visible to public</label>
              </div>
              <div className="admin-form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Album'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE IMAGES MODAL */}
      {manageImagesAlbum && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '800px', width: '90%' }}>
            <div className="admin-modal-header">
              <h2>Manage Images: {manageImagesAlbum.title}</h2>
              <button className="close-btn" onClick={() => setManageImagesAlbum(null)}>&times;</button>
            </div>
            <div className="admin-modal-body" style={{ padding: '20px' }}>
              <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p>Upload new images to this album. You can select multiple images at once.</p>
                <input type="file" multiple accept="image/*" id="multiUpload" style={{ display: 'none' }} onChange={handleImageUpload} disabled={uploadingImages} />
                <label htmlFor="multiUpload" className="btn-primary" style={{ cursor: uploadingImages ? 'not-allowed' : 'pointer', padding: '10px 15px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <FaUpload /> {uploadingImages ? 'Uploading...' : 'Upload Images'}
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
                {albumImages.map(img => (
                  <div key={img._id} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333' }}>
                    <img src={img.imageURL} alt="gallery" style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }} />
                    <button 
                      onClick={() => removeImage(img._id)}
                      style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(255,0,0,0.8)', color: '#fff', border: 'none', borderRadius: '50%', width: '25px', height: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))}
                {albumImages.length === 0 && <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#666' }}>No images in this album yet.</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGallery;
