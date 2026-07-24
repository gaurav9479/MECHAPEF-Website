import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import {
  FaCalendarAlt, FaUsers, FaBullhorn, FaHandshake,
  FaHome, FaSignOutAlt, FaCog, FaImages, FaCheckCircle, FaTimesCircle,
  FaImage, FaUpload, FaEdit, FaCrop, FaSearch, FaTrash
} from 'react-icons/fa';
import api from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import '../Admin/AdminDashboard.css';
import './AdminManagement.css';
import '../../components/CropperInput/CropperInput.css';

const BASE_SECTION_KEYS = [
  { key: 'dept_1', label: 'Dept Image 1', aspectRatio: 1/1.25 },
  { key: 'dept_2', label: 'Dept Image 2', aspectRatio: 1/1.25 },
  { key: 'dept_3', label: 'Dept Image 3', aspectRatio: 1/1.25 },
  { key: 'dept_4', label: 'Dept Image 4', aspectRatio: 1/1.25 },
  { key: 'dept_5', label: 'Dept Image 5', aspectRatio: 1/1.25 },
  { key: 'dept_6', label: 'Dept Image 6', aspectRatio: 1/1.25 },
  { key: 'dept_7', label: 'Dept Image 7', aspectRatio: 1/1.25 },
  { key: 'dept_8', label: 'Dept Image 8', aspectRatio: 1/1.25 },
  { key: 'domain_1', label: 'Domain 1 (Automobile/SAE)', aspectRatio: NaN },
  { key: 'domain_2', label: 'Domain 2 (Robotics)', aspectRatio: NaN },
  { key: 'domain_3', label: 'Domain 3 (Design & CAD)', aspectRatio: NaN },
  { key: 'domain_4', label: 'Domain 4 (Manufacturing)', aspectRatio: NaN },
  { key: 'hero_bot', label: 'Hero Bot Image', aspectRatio: NaN },
  { key: 'join_bot', label: 'Join Us Bot Image', aspectRatio: NaN }
];

const getDynamicSectionKeys = (sectionImages, extraFy, extraSy, extraTy) => {
  let maxFy = 10, maxSy = 10, maxTy = 10;
  Object.keys(sectionImages).forEach(k => {
    if (k.startsWith('team_fy_')) maxFy = Math.max(maxFy, parseInt(k.replace('team_fy_', '')));
    if (k.startsWith('team_sy_')) maxSy = Math.max(maxSy, parseInt(k.replace('team_sy_', '')));
    if (k.startsWith('team_ty_')) maxTy = Math.max(maxTy, parseInt(k.replace('team_ty_', '')));
  });

  maxFy += extraFy;
  maxSy += extraSy;
  maxTy += extraTy;

  const dynamicKeys = [...BASE_SECTION_KEYS];
  for (let i = 1; i <= maxFy; i++) dynamicKeys.push({ key: `team_fy_${i}`, label: `Team Second Year ${i}`, aspectRatio: 1 });
  for (let i = 1; i <= maxSy; i++) dynamicKeys.push({ key: `team_sy_${i}`, label: `Team Pre-final Year ${i}`, aspectRatio: 1 });
  for (let i = 1; i <= maxTy; i++) dynamicKeys.push({ key: `team_ty_${i}`, label: `Team Final Year ${i}`, aspectRatio: 3/4 });
  
  return { dynamicKeys, counts: { fy: maxFy, sy: maxSy, ty: maxTy } };
};
const AdminManagement = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/login'); };
  const [activeTab, setActiveTab] = useState('users');
  // ── Users Tab State ──
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterVerified, setFilterVerified] = useState('');
  const [verifyingId, setVerifyingId] = useState(null);
  const [toast, setToast] = useState(null);
  // ── Notices Tab State ──
  const [notices, setNotices] = useState([]);
  const [noticeForm, setNoticeForm] = useState({ title: '', description: '', priority: 'Medium', targetType: 'None', isActive: true, eventSponsors: [] });
  const [noticeSubmitting, setNoticeSubmitting] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [allSponsors, setAllSponsors] = useState([]);
  // ── Image Manager Tab State ──
  const [sectionImages, setSectionImages] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('Our Department');
  const [selectedSection, setSelectedSection] = useState('hero_bot');
  const [extraFy, setExtraFy] = useState(0);
  const [extraSy, setExtraSy] = useState(0);
  const [extraTy, setExtraTy] = useState(0);

  const { dynamicKeys: dynamicSectionKeys, counts: slotCounts } = getDynamicSectionKeys(sectionImages, extraFy, extraSy, extraTy);
  const [cropSrc, setCropSrc] = useState(null);
  const [cropping, setCropping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);
  const fileInputRef = useRef(null);
  const cropperRef = useRef(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };
  // ── Fetch Users ──────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const params = {};
      if (filterRole) params.role = filterRole;
      if (filterVerified !== '') params.isVerified = filterVerified;
      const res = await api.get('/auth/users', { params });
      setUsers(res.data.data?.users || []);
    } catch { showToast('Failed to load users', 'error'); }
    finally { setUsersLoading(false); }
  }, [filterRole, filterVerified]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  const toggleVerify = async (userId, currentlyVerified) => {
    setVerifyingId(userId);
    try {
      if (currentlyVerified) {
        await api.patch(`/auth/users/${userId}/verify`, { isVerified: false });
        showToast('User verification revoked');
      } else {
        await api.patch(`/auth/users/${userId}/verify`, { isVerified: true });
        showToast('User verified successfully');
      }
      fetchUsers();
    } catch { showToast('Failed to update', 'error'); }
    finally { setVerifyingId(null); }
  };

  const updateRole = async (userId, newRole) => {
    try {
      await api.patch(`/auth/users/${userId}/role`, { role: newRole });
      showToast('User role updated successfully');
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update role', 'error');
    }
  };

  const filteredUsers = users.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.collegeRegNo?.toLowerCase().includes(search.toLowerCase())
  );
  // ── Fetch Notices ────────────────────────────────────────────────────────
  const fetchNotices = async () => {
    const [annRes, sponRes] = await Promise.all([
      api.get('/announcements'),
      api.get('/sponsors').catch(() => ({ data: { data: [] } }))
    ]);
    setNotices(annRes.data.data?.announcements || []);
    const sp = sponRes.data.data?.sponsors || sponRes.data.data || [];
    setAllSponsors(sp.filter(s => s.isActive !== false));
  };
  useEffect(() => { if (activeTab === 'notices') fetchNotices(); }, [activeTab]);
  const submitNotice = async (e) => {
    e.preventDefault();
    setNoticeSubmitting(true);
    try {
      if (editingNotice) {
        await api.put(`/announcements/${editingNotice._id}`, noticeForm);
        showToast('Notice updated!');
      } else {
        await api.post('/announcements', noticeForm);
        showToast('Notice posted!');
      }
      setNoticeForm({ title: '', description: '', priority: 'Medium', targetType: 'None', isActive: true, eventSponsors: [] });
      setEditingNotice(null);
      fetchNotices();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving', 'error');
    } finally { setNoticeSubmitting(false); }
  };
  const deleteNotice = async (id) => {
    if (!window.confirm('Delete this notice?')) return;
    await api.delete(`/announcements/${id}`);
    showToast('Notice deleted');
    fetchNotices();
  };
  const editNotice = (n) => {
    setEditingNotice(n);
    setNoticeForm({ title: n.title, description: n.description, priority: n.priority, targetType: n.targetType || 'None', isActive: n.isActive, eventSponsors: n.eventSponsors || [] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  // ── Fetch Section Images ──────────────────────────────────────────────────
  const fetchSectionImages = async () => {
    const res = await api.get('/upload/sections');
    const map = {};
    (res.data.data?.images || []).forEach(img => { map[img.sectionKey] = img; });
    setSectionImages(map);
  };
  useEffect(() => { if (activeTab === 'images') fetchSectionImages(); }, [activeTab]);

  const deleteImage = async () => {
    const currentSectionLabel = dynamicSectionKeys.find(s => s.key === selectedSection)?.label;
    if (!window.confirm(`Are you sure you want to delete the image for ${currentSectionLabel}?`)) return;
    setDeletingImage(true);
    try {
      await api.delete(`/upload/sections/${selectedSection}`);
      localStorage.removeItem('api_cache_/upload/sections');
      setSectionImages(prev => {
        const copy = { ...prev };
        delete copy[selectedSection];
        return copy;
      });
      showToast('Image deleted');
    } catch (err) {
      console.error(err);
      alert('Failed to delete image: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeletingImage(false);
    }
  };

  const onFileSelect = async (e) => {
    let file = e.target.files[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
      try {
        const { default: heic2any } = await import('heic2any');
        const convertedBlob = await heic2any({
          blob: file,
          toType: "image/jpeg",
        });
        const blobArray = Array.isArray(convertedBlob) ? convertedBlob : [convertedBlob];
        file = new File(blobArray, file.name.replace(/\.hei[cf]/i, '.jpg'), { type: "image/jpeg" });
      } catch (error) {
        console.error("HEIC conversion error:", error);
        showToast("Failed to convert HEIC/HEIF image", "error");
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = () => { setCropSrc(reader.result); setCropping(true); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };
  const uploadCropped = async () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;
    setUploading(true);
    try {
      // Get cropped canvas as blob
      const canvas = cropper.getCroppedCanvas({ maxWidth: 1920, maxHeight: 1080 });
      const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92));
      // Upload to backend → ImageKit
      const formData = new FormData();
      formData.append('image', blob, 'section_image.jpg');
      formData.append('folder', '/mechapef/sections');
      const uploadRes = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const { url, fileId } = uploadRes.data.data;
      // Save to SectionImage model
      const section = dynamicSectionKeys.find(s => s.key === selectedSection);
      await api.post('/upload/sections', {
        sectionKey: selectedSection,
        label: section?.label,
        imageURL: url,
        imagekitFileId: fileId,
      });
      localStorage.removeItem('api_cache_/upload/sections');
      showToast('Image uploaded & saved!');
      setCropping(false);
      setCropSrc(null);
      fetchSectionImages();
    } catch (err) {
      showToast(err.response?.data?.message || 'Upload failed', 'error');
    } finally { setUploading(false); }
  };
  const currentSectionLabel = dynamicSectionKeys.find(s => s.key === selectedSection)?.label;

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-form-page">
        <div className="admin-form-topbar">
          <h1>Management</h1>
          <div className="mgmt-tabs">
            <button className={`mgmt-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
              <FaUsers /> Members
            </button>
            <button className={`mgmt-tab ${activeTab === 'notices' ? 'active' : ''}`} onClick={() => setActiveTab('notices')}>
              <FaBullhorn /> Notices
            </button>
            <button className={`mgmt-tab ${activeTab === 'images' ? 'active' : ''}`} onClick={() => setActiveTab('images')}>
              <FaImage /> Image Manager
            </button>
          </div>
        </div>
        {/* ══════════════ USERS TAB ══════════════ */}
        {activeTab === 'users' && (
          <div>
            {/* Filters */}
            <div className="mgmt-filters">
              <div className="mgmt-search">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search name, email or reg no..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="mgmt-select">
                <option value="">All Roles</option>
                <option value="super-admin">Super Admin</option>
                <option value="content-lead">Content Lead</option>
                <option value="media-lead">Media Lead</option>
                <option value="member">Member</option>
                <option value="general-user">General User</option>
              </select>
              <select value={filterVerified} onChange={e => setFilterVerified(e.target.value)} className="mgmt-select">
                <option value="">All Status</option>
                <option value="true">Verified</option>
                <option value="false">Unverified</option>
              </select>
            </div>
            {/* Summary chips */}
            <div className="mgmt-chips">
              <span className="chip">Total: {filteredUsers.length}</span>
              <span className="chip chip-green">Verified: {filteredUsers.filter(u => u.isVerified).length}</span>
              <span className="chip chip-red">Pending: {filteredUsers.filter(u => !u.isVerified).length}</span>
            </div>
            {/* Users Table */}
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Reg No</th>
                    <th>Role</th>
                    <th>Requested</th>
                    <th>Year</th>
                    <th>Verified</th>
                    <th>Toggle</th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', color: '#555', padding: '30px' }}>Loading...</td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', color: '#555', padding: '30px' }}>No users found</td></tr>
                  ) : filteredUsers.map(u => (
                    <tr key={u._id}>
                      <td style={{ fontWeight: 600, color: '#fff' }}>{u.name}</td>
                      <td style={{ fontFamily: 'sans-serif', fontSize: '0.85rem' }}>{u.email}</td>
                      <td style={{ fontFamily: 'monospace', color: '#aaa' }}>{u.collegeRegNo || '—'}</td>
                      <td>
                        <select 
                          value={u.role} 
                          onChange={(e) => updateRole(u._id, e.target.value)}
                          style={{ padding: '4px', fontSize: '0.8rem', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          <option value="super-admin">Super Admin</option>
                          <option value="content-lead">Content Lead</option>
                          <option value="media-lead">Media Lead</option>
                          <option value="member">Member</option>
                          <option value="general-user">General User</option>
                        </select>
                      </td>
                      <td>
                        {u.requestedRole ? (
                          <span className="tag" style={{ border: '1px solid #ffaa00', color: '#ffaa00', background: 'transparent' }}>
                            {u.requestedRole}
                          </span>
                        ) : '—'}
                      </td>
                      <td>{u.yearOfStudy ? `Year ${u.yearOfStudy}` : '—'}</td>
                      <td>
                        {u.isVerified
                          ? <span style={{ color: '#00c864', display: 'flex', alignItems: 'center', gap: '5px' }}><FaCheckCircle /> Verified</span>
                          : <span style={{ color: '#ff4444', display: 'flex', alignItems: 'center', gap: '5px' }}><FaTimesCircle /> Pending</span>
                        }
                      </td>
                      <td>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={u.isVerified}
                            disabled={verifyingId === u._id}
                            onChange={() => toggleVerify(u._id, u.isVerified)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* ══════════════ NOTICES TAB ══════════════ */}
        {activeTab === 'notices' && (
          <div className="notices-layout">
            {/* Post / Edit Form */}
            <div className="notice-form-card">
              <h3>{editingNotice ? 'Edit Notice' : 'Post New Notice'}</h3>
              <form onSubmit={submitNotice}>
                <div className="form-group full">
                  <label>Title *</label>
                  <input
                    value={noticeForm.title}
                    onChange={e => setNoticeForm(p => ({ ...p, title: e.target.value }))}
                    required placeholder="Notice title..."
                  />
                </div>
                <div className="form-group full">
                  <label>Description *</label>
                  <textarea
                    rows={5}
                    value={noticeForm.description}
                    onChange={e => setNoticeForm(p => ({ ...p, description: e.target.value }))}
                    required placeholder="Notice content..."
                  />
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '10px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Select Sponsors (Multiple Allowed)</label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', border: '1px solid #333', padding: '10px', borderRadius: '8px', maxHeight: '150px', overflowY: 'auto', marginBottom: '15px' }}>
                        {allSponsors.map(s => {
                          const isSelected = noticeForm.eventSponsors?.some(sp => sp.name === s.companyName);
                          return (
                            <React.Fragment key={s._id}>
                              <input 
                                type="checkbox" 
                                id={`sponsor-checkbox-notice-${s._id}`}
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNoticeForm(p => ({
                                      ...p,
                                      eventSponsors: [...(p.eventSponsors || []), { name: s.companyName, logoURL: s.logoURL, type: 'Event Sponsor' }]
                                    }));
                                  } else {
                                    setNoticeForm(p => ({
                                      ...p,
                                      eventSponsors: (p.eventSponsors || []).filter(sp => sp.name !== s.companyName)
                                    }));
                                  }
                                }}
                                style={{ display: 'none' }}
                              />
                              <label htmlFor={`sponsor-checkbox-notice-${s._id}`} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: isSelected ? '#ff1f0122' : '#222', padding: '5px 10px', borderRadius: '20px', cursor: 'pointer', border: `1px solid ${isSelected ? '#ff1f01' : '#444'}`, margin: 0 }}>
                                <img src={s.logoURL} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                                <span style={{ fontSize: '0.85rem' }}>{s.companyName}</span>
                              </label>
                            </React.Fragment>
                          )
                        })}
                        {allSponsors.length === 0 && <span style={{ color: '#888' }}>No sponsors available. Add them in Sponsors panel first.</span>}
                      </div>
                    </div>
                  </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginTop: '16px' }}>
                  <div className="form-group">
                    <label>Priority</label>
                    <select value={noticeForm.priority} onChange={e => setNoticeForm(p => ({ ...p, priority: e.target.value }))}>
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#aaa', fontFamily: 'sans-serif', cursor: 'pointer', marginTop: '22px' }}>
                    <input type="checkbox" checked={noticeForm.isActive} onChange={e => setNoticeForm(p => ({ ...p, isActive: e.target.checked }))} style={{ width: 'auto' }} />
                    Publish Immediately
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button type="submit" className="btn-primary" disabled={noticeSubmitting}>
                    {noticeSubmitting ? 'Posting...' : editingNotice ? 'Update Notice' : 'Post Notice'}
                  </button>
                  {editingNotice && (
                    <button type="button" className="btn-secondary" onClick={() => { setEditingNotice(null); setNoticeForm({ title: '', description: '', priority: 'Medium', targetType: 'None', isActive: true, eventSponsors: [] }); }}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
            {/* Notices List */}
            <div className="notices-list">
              <h3>All Notices ({notices.length})</h3>
              {notices.length === 0 ? (
                <p style={{ color: '#555', fontFamily: 'sans-serif' }}>No notices posted yet.</p>
              ) : notices.map(n => (
                <div key={n._id} className="notice-card">
                  <div className="notice-card-header">
                    <span className={`priority-badge priority-${n.priority.toLowerCase()}`}>{n.priority}</span>
                    <span className={`status-badge ${n.isActive ? 'status-live' : 'status-off'}`}>{n.isActive ? 'Live' : 'Hidden'}</span>
                  </div>
                  <h4>{n.title}</h4>
                  <p>{n.description}</p>
                  <div className="notice-card-actions">
                    <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => editNotice(n)}><FaEdit /> Edit</button>
                    <button className="btn-danger" onClick={() => deleteNotice(n._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* ══════════════ IMAGE MANAGER TAB ══════════════ */}
        {activeTab === 'images' && (
          <div className="image-manager">
            <div className="image-manager-header" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <h3>1. Select Category</h3>
                <select 
                  className="section-dropdown"
                  value={selectedCategory}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    setSelectedCategory(newCat);
                    const filtered = dynamicSectionKeys.filter(s => {
                      if (newCat === 'Our Team (Second Year)') return s.key.startsWith('team_fy_');
                      if (newCat === 'Our Team (Pre-Final Year)') return s.key.startsWith('team_sy_');
                      if (newCat === 'Our Team (Final Year)') return s.key.startsWith('team_ty_');
                      return !s.key.startsWith('team_');
                    });
                    if (filtered.length > 0) setSelectedSection(filtered[0].key);
                  }}
                >
                  <option value="Our Department">Our Department</option>
                  <option value="Our Team (Second Year)">Our Team (Second Year)</option>
                  <option value="Our Team (Pre-Final Year)">Our Team (Pre-Final Year)</option>
                  <option value="Our Team (Final Year)">Our Team (Final Year)</option>
                </select>
                {selectedCategory.startsWith('Our Team') && (
                  <div style={{ display: 'flex', flexDirection: 'column', marginTop: '10px', gap: '5px' }}>
                    <div style={{ color: '#aaa', fontSize: '14px', marginBottom: '5px' }}>
                      Currently showing {selectedCategory === 'Our Team (Second Year)' ? slotCounts.fy : selectedCategory === 'Our Team (Pre-Final Year)' ? slotCounts.sy : slotCounts.ty} slots.
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '8px 12px', background: '#ff9800', color: '#000', border: 'none', flex: 1 }}
                        onClick={() => {
                          if (selectedCategory === 'Our Team (Second Year)') setExtraFy(p => p + 1);
                          else if (selectedCategory === 'Our Team (Pre-Final Year)') setExtraSy(p => p + 1);
                          else if (selectedCategory === 'Our Team (Final Year)') setExtraTy(p => p + 1);
                        }}
                      >
                        + 1 Slot
                      </button>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '8px 12px', background: '#444', color: '#fff', border: 'none', flex: 1 }}
                        onClick={() => {
                          if (selectedCategory === 'Our Team (Second Year)') setExtraFy(p => Math.max(0, p - 1));
                          else if (selectedCategory === 'Our Team (Pre-Final Year)') setExtraSy(p => Math.max(0, p - 1));
                          else if (selectedCategory === 'Our Team (Final Year)') setExtraTy(p => Math.max(0, p - 1));
                        }}
                      >
                        - 1 Slot
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h3>2. Select Image Space</h3>
                <select 
                  className="section-dropdown"
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                >
                  {dynamicSectionKeys.filter(s => {
                      if (selectedCategory === 'Our Team (Second Year)') return s.key.startsWith('team_fy_');
                      if (selectedCategory === 'Our Team (Pre-Final Year)') return s.key.startsWith('team_sy_');
                      if (selectedCategory === 'Our Team (Final Year)') return s.key.startsWith('team_ty_');
                      return !s.key.startsWith('team_');
                    })
                    .sort((a, b) => {
                      const getOrder = (key) => sectionImages[key]?.order || (key.startsWith('team_') ? parseInt(key.split('_').pop()) : 0);
                      return getOrder(a.key) - getOrder(b.key);
                    })
                    .map(s => {
                      const imgData = sectionImages[s.key];
                      const currentOrder = imgData?.order || (s.key.startsWith('team_') ? parseInt(s.key.split('_').pop()) : '');
                      const displayName = imgData?.name ? imgData.name : s.label;
                      return (
                        <option key={s.key} value={s.key}>
                          {s.key.startsWith('team_') ? `[#${currentOrder}] ` : ''}{displayName} {imgData?.imageURL ? ' (✓ Image)' : ' (No image)'}
                        </option>
                      )
                    })}
                </select>
              </div>
            </div>
            <div className="image-manager-right">
              <h3>
                <FaCrop style={{ marginRight: '8px' }} />
                {currentSectionLabel}
              </h3>
              {/* Current Image Preview */}
              {sectionImages[selectedSection]?.imageURL && (
                <div 
                  className="current-img-preview" 
                  style={{ 
                    position: 'relative',
                    maxWidth: (dynamicSectionKeys.find(s => s.key === selectedSection)?.aspectRatio <= 1) ? '240px' : '450px',
                    aspectRatio: dynamicSectionKeys.find(s => s.key === selectedSection)?.aspectRatio || 'auto',
                    marginBottom: '24px'
                  }}
                >
                  <div className="current-img-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Current Image</span>
                    <button 
                      onClick={deleteImage} 
                      disabled={deletingImage}
                      className="delete-img-btn"
                    >
                      <FaTrash style={{ marginRight: '6px' }} />
                      {deletingImage ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                  <img 
                    src={sectionImages[selectedSection].imageURL} 
                    alt="current" 
                    style={{ 
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                </div>
              )}
              {/* Upload New */}
              {!cropping && (
                <div 
                  className="upload-zone" 
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    maxWidth: (dynamicSectionKeys.find(s => s.key === selectedSection)?.aspectRatio <= 1) ? '240px' : '450px',
                    aspectRatio: dynamicSectionKeys.find(s => s.key === selectedSection)?.aspectRatio || 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: (dynamicSectionKeys.find(s => s.key === selectedSection)?.aspectRatio <= 1) ? '24px 12px' : '56px 36px'
                  }}
                >
                  <FaUpload className="upload-zone-icon" />
                  <p>Click to select image for <strong>{currentSectionLabel}</strong></p>
                  <p className="upload-zone-sub">JPG, PNG, WebP — will be cropped before upload</p>
                  <input ref={fileInputRef} type="file" accept="image/*,.heic,.heif" style={{ display: 'none' }} onChange={onFileSelect} />
                </div>
              )}
              {/* Cropper */}
              {cropping && cropSrc && createPortal(
                <div
                  className="cropper-modal-overlay"
                  onClick={() => { setCropping(false); setCropSrc(null); }}
                >
                  <div className="cropper-modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="cropper-modal-header">
                      <h3><FaCrop /> Crop Image</h3>
                      <button className="cropper-close-btn" onClick={() => { setCropping(false); setCropSrc(null); }}>
                        <FaTimesCircle />
                      </button>
                    </div>

                    <div className="cropper-modal-body">
                      <Cropper
                        ref={cropperRef}
                        src={cropSrc}
                        style={{ height: '400px', width: '100%' }}
                        aspectRatio={dynamicSectionKeys.find(s => s.key === selectedSection)?.aspectRatio ?? NaN}
                        guides={true}
                        viewMode={1}
                        autoCropArea={1}
                        background={false}
                        responsive={true}
                        checkOrientation={false}
                        cropBoxResizable={true}
                        zoomable={false}
                        dragMode="move"
                      />
                    </div>

                    <div className="cropper-modal-footer">
                      <button className="cropper-btn-cancel" onClick={() => { setCropping(false); setCropSrc(null); }}>
                        Cancel
                      </button>
                      <button className="cropper-btn-save" onClick={uploadCropped} disabled={uploading}>
                        {uploading ? 'Uploading...' : <><FaUpload /> Upload Cropped Image</>}
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
              )}
              
              {/* Extra Inputs for Team Details */}
              {selectedSection.startsWith('team_') && (
                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px', background: '#111', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
                  <h4 style={{ color: '#fff', margin: 0 }}>Team Member Details</h4>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#aaa' }}>Name</label>
                      <input 
                        type="text" 
                        value={sectionImages[selectedSection]?.name || ''} 
                        onChange={(e) => {
                          setSectionImages(p => ({
                            ...p,
                            [selectedSection]: { ...p[selectedSection], name: e.target.value }
                          }));
                        }}
                        style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                        placeholder="Enter name"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#aaa' }}>Registration Number / Role</label>
                      <input 
                        type="text" 
                        value={sectionImages[selectedSection]?.regNo || ''} 
                        onChange={(e) => {
                          setSectionImages(p => ({
                            ...p,
                            [selectedSection]: { ...p[selectedSection], regNo: e.target.value }
                          }));
                        }}
                        style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                        placeholder="Enter Reg No or Role"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#aaa' }}>Sequence (Order)</label>
                      <input 
                        type="number" 
                        value={sectionImages[selectedSection]?.order || (selectedSection.startsWith('team_') ? parseInt(selectedSection.split('_').pop()) : '')} 
                        onChange={(e) => {
                          setSectionImages(p => ({
                            ...p,
                            [selectedSection]: { ...p[selectedSection], order: e.target.value }
                          }));
                        }}
                        style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                        placeholder="e.g. 1"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      try {
                        const imgData = sectionImages[selectedSection];
                        const defaultOrder = selectedSection.startsWith('team_') ? parseInt(selectedSection.split('_').pop()) : 0;
                        await api.post('/upload/sections', {
                          sectionKey: selectedSection,
                          name: imgData?.name || '',
                          regNo: imgData?.regNo || '',
                          order: imgData?.order || defaultOrder
                        });
                        localStorage.removeItem('api_cache_/upload/sections');
                        fetchSectionImages();
                        showToast('Details saved and sequences swapped!');
                      } catch (error) {
                        showToast('Failed to save details', 'error');
                      }
                    }}
                    style={{ alignSelf: 'flex-start', background: '#007bff', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Save Details
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      {toast && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
};
export default AdminManagement;