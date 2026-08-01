import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { FaPlus, FaEdit, FaTrash, FaCube } from 'react-icons/fa';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import api from '../../services/api';
import './AdminDashboard.css'; // Re-use standard admin styles

const AdminProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Form State
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    modelUrl: '/models/example.glb',
    credits: '',
    isActive: true
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects');
      setProjects(res.data.data?.projects || []);
    } catch (err) {
      showToast('Failed to fetch projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openModal = (project = null) => {
    if (project) {
      setEditingId(project._id);
      setFormData({
        title: project.title,
        description: project.description,
        modelUrl: project.modelUrl,
        credits: project.credits,
        isActive: project.isActive
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        description: '',
        modelUrl: '/models/your_model.glb',
        credits: '',
        isActive: true
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/projects/${editingId}`, formData);
        showToast('Project updated successfully');
      } else {
        await api.post('/projects', formData);
        showToast('Project created successfully');
      }
      closeModal();
      fetchProjects();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving project', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.delete(`/projects/${id}`);
      showToast('Project deleted successfully');
      fetchProjects();
    } catch (err) {
      showToast('Error deleting project', 'error');
    }
  };

  return (
    <div className="admin-layout">
      <Helmet>
        <title>Manage 3D Projects | Admin Portal</title>
      </Helmet>
      <AdminSidebar />
      
      <main className="admin-main">
        {toast && (
          <div className={`toast-notification ${toast.type}`}>
            {toast.msg}
          </div>
        )}
        
        <div className="admin-header">
          <h1><FaCube style={{ marginRight: '15px' }} /> 3D Projects Showcase</h1>
          <button className="primary-btn" onClick={() => openModal()}>
            <FaPlus /> Add New Project
          </button>
        </div>

        <div className="admin-content-section" style={{ marginTop: '20px' }}>
          <p style={{ color: '#aaa', marginBottom: '20px' }}>
            To link a 3D model, make sure the <code>.glb</code> file is manually placed in the <code>Client/public/models</code> folder. Then type the exact path here (e.g. <code>/models/engine.glb</code>).
          </p>
          
          {loading ? (
            <div className="admin-loading">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="admin-empty">No projects found. Add one to showcase your 3D models.</div>
          ) : (
            <div className="grid-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {projects.map((project) => (
                <div key={project._id} style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333', position: 'relative' }}>
                  {!project.isActive && <span style={{ position: 'absolute', top: 10, right: 10, background: '#ff1f01', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>INACTIVE</span>}
                  <h3 style={{ color: '#fff', marginBottom: '10px' }}>{project.title}</h3>
                  <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '10px' }}><strong>Path:</strong> {project.modelUrl}</p>
                  <p style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '15px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{project.description}</p>
                  <p style={{ color: '#666', fontSize: '0.8rem', fontStyle: 'italic', marginBottom: '20px' }}>{project.credits}</p>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-secondary" style={{ flex: 1, padding: '8px' }} onClick={() => openModal(project)}>
                      <FaEdit /> Edit
                    </button>
                    <button className="btn-secondary" style={{ flex: 1, padding: '8px', color: '#ff3333', borderColor: '#ff3333' }} onClick={() => handleDelete(project._id)}>
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
              <h2>{editingId ? 'Edit Project' : 'Add New Project'}</h2>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="form-group">
                  <label>Project Title *</label>
                  <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required className="form-input" placeholder="e.g. V8 Engine Design" />
                </div>
                
                <div className="form-group">
                  <label>Model URL Path *</label>
                  <input type="text" value={formData.modelUrl} onChange={e => setFormData({...formData, modelUrl: e.target.value})} required className="form-input" placeholder="/models/engine.glb" />
                  <small style={{ color: '#666', marginTop: '5px' }}>Must point to a .glb file in the public folder</small>
                </div>

                <div className="form-group">
                  <label>Credits / Footer Details</label>
                  <input type="text" value={formData.credits} onChange={e => setFormData({...formData, credits: e.target.value})} className="form-input" placeholder="e.g. Designed by Gaurav | ANSYS Simulation" />
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required className="form-input" rows="4" placeholder="Explain the project..." />
                </div>

                <div className="form-group checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                  <input type="checkbox" id="proj-active" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                  <label htmlFor="proj-active">Show on public Projects page</label>
                </div>

                <div className="modal-actions" style={{ marginTop: '20px' }}>
                  <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="primary-btn">{editingId ? 'Save Changes' : 'Create Project'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminProjects;
