import { useState, useEffect, useRef } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaGripVertical, FaImage, FaCrop } from 'react-icons/fa';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import api from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import './AdminManagement.css'; 
import '../../components/CropperInput/CropperInput.css'; // Import cute modal styles

const PastEventsManager = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  // Form State
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', date: '', description: '', imageURL: '', imagekitFileId: '' });
  
  // Cropper State
  const [showCropper, setShowCropper] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const cropperRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/past-events');
      setEvents(res.data.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error fetching events', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/past-events/${editingId}`, formData);
        showToast('Event updated successfully');
      } else {
        await api.post('/past-events', formData);
        showToast('Event created successfully');
      }
      setEditingId(null);
      setFormData({ title: '', date: '', description: '', imageURL: '', imagekitFileId: '' });
      fetchEvents();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save event', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this past event?')) return;
    try {
      await api.delete(`/past-events/${id}`);
      showToast('Event deleted');
      fetchEvents();
    } catch (err) {
      showToast('Failed to delete event', 'error');
    }
  };

  const moveUp = async (index) => {
    if (index === 0) return;
    const newEvents = [...events];
    const temp = newEvents[index];
    newEvents[index] = newEvents[index - 1];
    newEvents[index - 1] = temp;
    setEvents(newEvents);
    updateOrder(newEvents);
  };

  const moveDown = async (index) => {
    if (index === events.length - 1) return;
    const newEvents = [...events];
    const temp = newEvents[index];
    newEvents[index] = newEvents[index + 1];
    newEvents[index + 1] = temp;
    setEvents(newEvents);
    updateOrder(newEvents);
  };

  const updateOrder = async (orderedList) => {
    try {
      const orderedIds = orderedList.map(e => e._id);
      await api.put('/past-events/order', { orderedIds });
      showToast('Order updated');
    } catch (err) {
      showToast('Failed to update order', 'error');
      fetchEvents();
    }
  };

  // Image Upload Handlers
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) return showToast('File too large (Max 5MB)', 'error');
      const reader = new FileReader();
      reader.onload = () => { setImageSrc(reader.result); setShowCropper(true); };
      reader.readAsDataURL(file);
      e.target.value = ''; 
    }
  };

  const handleCrop = async () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;
    
    setUploading(true);
    try {
      const canvas = cropper.getCroppedCanvas({ maxWidth: 1920, maxHeight: 1440 });
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
      const formDataUpload = new FormData();
      formDataUpload.append('image', blob, 'pastevent.jpg');
      formDataUpload.append('folder', 'mechapif/past_events');

      const res = await api.post('/upload/image', formDataUpload, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFormData({ ...formData, imageURL: res.data.data.url, imagekitFileId: res.data.data.fileId });
      setShowCropper(false);
      setImageSrc(null);
    } catch (err) {
      showToast('Image upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <h1>Past Events Manager</h1>
          <p>Manage the dynamic stack of past events shown on the homepage.</p>
        </div>

        {/* Form Section */}
        <div className="admin-form-card" style={{ marginBottom: '40px', background: '#111', padding: '20px', borderRadius: '12px' }}>
          <h2>{editingId ? 'Edit Event' : 'Add New Event'}</h2>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
            <input type="text" placeholder="Title (e.g., RoboWars 2023)" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ padding: '10px', background: '#222', border: '1px solid #333', color: '#fff' }} />
            <input type="text" placeholder="Date (e.g., Nov 15, 2023)" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} style={{ padding: '10px', background: '#222', border: '1px solid #333', color: '#fff' }} />
            <textarea placeholder="Description" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ padding: '10px', background: '#222', border: '1px solid #333', color: '#fff', minHeight: '80px' }} />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {formData.imageURL && <img src={formData.imageURL} alt="Preview" style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '8px' }} />}
              <label style={{ cursor: 'pointer', background: '#ff1f01', padding: '10px 15px', borderRadius: '5px', color: '#fff' }}>
                <FaImage style={{ marginRight: '8px' }} /> Upload Photo
                <input type="file" accept="image/*" hidden onChange={handleFileChange} />
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" style={{ padding: '10px 20px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Save Event</button>
              {editingId && <button type="button" onClick={() => { setEditingId(null); setFormData({ title: '', date: '', description: '', imageURL: '', imagekitFileId: '' }); }} style={{ padding: '10px 20px', background: '#444', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>}
            </div>
          </form>
        </div>

        {/* List Section */}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Order</th><th>Image</th><th>Title & Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="4">Loading...</td></tr> : events.map((ev, i) => (
                <tr key={ev._id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <button onClick={() => moveUp(i)} disabled={i===0} style={{ padding: '2px', cursor: i===0?'not-allowed':'pointer' }}>▲</button>
                      <button onClick={() => moveDown(i)} disabled={i===events.length-1} style={{ padding: '2px', cursor: i===events.length-1?'not-allowed':'pointer' }}>▼</button>
                    </div>
                  </td>
                  <td><img src={ev.imageURL} alt={ev.title} style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} /></td>
                  <td><strong>{ev.title}</strong><br/><small style={{ color: '#aaa' }}>{ev.date}</small></td>
                  <td>
                    <button onClick={() => { setEditingId(ev._id); setFormData(ev); }} style={{ marginRight: '10px', color: '#007bff', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => handleDelete(ev._id)} style={{ color: '#dc3545', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Cropper Modal */}
      {showCropper && (
        <div className="cropper-modal-overlay">
          <div className="cropper-modal">
            <div className="cropper-modal-header">
              <h3><FaCrop style={{marginRight: '8px'}}/> Crop Image (4:3)</h3>
              <button className="close-modal-btn" onClick={() => { setShowCropper(false); setImageSrc(null); }}>
                <FaTimes />
              </button>
            </div>
            <div className="cropper-modal-body">
              <Cropper src={imageSrc} style={{ height: '350px', width: '100%' }} aspectRatio={4 / 3} guides={true} ref={cropperRef} viewMode={1} autoCropArea={1} background={false} responsive={true} zoomable={false} />
            </div>
            <div className="cropper-modal-footer">
              <button className="btn-secondary" onClick={() => { setShowCropper(false); setImageSrc(null); }}>Cancel</button>
              <button className="btn-primary" onClick={handleCrop} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Crop & Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`admin-toast ${toast.type}`} style={{ position: 'fixed', bottom: '20px', right: '20px', background: toast.type==='error'?'#dc3545':'#28a745', color: '#fff', padding: '15px 25px', borderRadius: '5px', zIndex: 10000 }}>{toast.msg}</div>}
    </div>
  );
};

export default PastEventsManager;
