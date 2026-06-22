import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import {
  FaCalendarAlt, FaUsers, FaBullhorn, FaHandshake,
  FaHome, FaSignOutAlt, FaCog, FaCheckCircle, FaTimesCircle,
  FaImage, FaUpload, FaEdit, FaCrop, FaSearch
} from 'react-icons/fa';
import api from '../../services/api';
import '../Admin/AdminDashboard.css';
import './AdminManagement.css';
// All section keys that can have their images changed
const SECTION_KEYS = [
  { key: 'dept_1', label: 'Dept Image 1 (Big Left)', aspectRatio: 690/520 },
  { key: 'dept_2', label: 'Dept Image 2 (Stacked Top)', aspectRatio: 216/250 },
  { key: 'dept_3', label: 'Dept Image 3 (Stacked Bottom)', aspectRatio: 216/250 },
  { key: 'dept_4', label: 'Dept Image 4 (Bottom Row 1)', aspectRatio: 335/220 },
  { key: 'dept_5', label: 'Dept Image 5 (Bottom Row 2)', aspectRatio: 335/220 },
  { key: 'dept_6', label: 'Dept Image 6 (Bottom Row 3)', aspectRatio: 335/220 },
  { key: 'dept_7', label: 'Dept Image 7 (Bottom Row 4)', aspectRatio: 335/220 },
  { key: 'hero_bot', label: 'Hero Bot Image', aspectRatio: NaN },
  { key: 'join_bot', label: 'Join Us Bot Image', aspectRatio: NaN },
  { key: 'team_fy_1', label: 'Team First Year 1', aspectRatio: 1 },
  { key: 'team_fy_2', label: 'Team First Year 2', aspectRatio: 1 },
  { key: 'team_fy_3', label: 'Team First Year 3', aspectRatio: 1 },
  { key: 'team_fy_4', label: 'Team First Year 4', aspectRatio: 1 },
  { key: 'team_sy_1', label: 'Team Second Year 1', aspectRatio: 1 },
  { key: 'team_sy_2', label: 'Team Second Year 2', aspectRatio: 1 },
  { key: 'team_sy_3', label: 'Team Second Year 3', aspectRatio: 1 },
  { key: 'team_sy_4', label: 'Team Second Year 4', aspectRatio: 1 },
  { key: 'team_ty_1', label: 'Team Third Year 1', aspectRatio: 1 },
  { key: 'team_ty_2', label: 'Team Third Year 2', aspectRatio: 1 },
  { key: 'team_ty_3', label: 'Team Third Year 3', aspectRatio: 1 },
  { key: 'team_ty_4', label: 'Team Third Year 4', aspectRatio: 1 },
];
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
  const [noticeForm, setNoticeForm] = useState({ title: '', description: '', priority: 'Medium', isActive: true });
  const [noticeSubmitting, setNoticeSubmitting] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  // ── Image Manager Tab State ──
  const [sectionImages, setSectionImages] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('Our Department');
  const [selectedSection, setSelectedSection] = useState(SECTION_KEYS[0].key);
  const [cropSrc, setCropSrc] = useState(null);
  const [cropping, setCropping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const cropperRef = useRef(null);
  const fileInputRef = useRef(null);
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
        // Un-verify: just update isVerified to false via a generic update
        await api.put(`/auth/users/${userId}/verify`, { isVerified: false });
        showToast('User unverified');
      } else {
        await api.put(`/auth/users/${userId}/verify`);
        showToast('User verified ✓');
      }
      fetchUsers();
    } catch { showToast('Failed to update', 'error'); }
    finally { setVerifyingId(null); }
  };
  const filteredUsers = users.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.collegeRegNo?.toLowerCase().includes(search.toLowerCase())
  );
  // ── Fetch Notices ────────────────────────────────────────────────────────
  const fetchNotices = async () => {
    const res = await api.get('/announcements');
    setNotices(res.data.data?.announcements || []);
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
      setNoticeForm({ title: '', description: '', priority: 'Medium', isActive: true });
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
    setNoticeForm({ title: n.title, description: n.description, priority: n.priority, isActive: n.isActive });
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
  const onFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
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
      const section = SECTION_KEYS.find(s => s.key === selectedSection);
      await api.post('/upload/sections', {
        sectionKey: selectedSection,
        label: section?.label,
        imageURL: url,
        imagekitFileId: fileId,
      });
      showToast('Image uploaded & saved!');
      setCropping(false);
      setCropSrc(null);
      fetchSectionImages();
    } catch (err) {
      showToast(err.response?.data?.message || 'Upload failed', 'error');
    } finally { setUploading(false); }
  };
  const currentSectionLabel = SECTION_KEYS.find(s => s.key === selectedSection)?.label;
  // ── Sidebar (shared) ─────────────────────────────────────────────────────
  const Sidebar = () => (
    <aside className="admin-sidebar">
      <div className="sidebar-logo">
        <FaCog className="sidebar-logo-icon" />
        <div>
          <div className="sidebar-logo-main">Mecha<span>PEF</span></div>
          <div className="sidebar-logo-sub">Admin Portal</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        <Link to="/admin" className="sidebar-link"><FaCalendarAlt /> Dashboard</Link>
        <Link to="/admin/events" className="sidebar-link"><FaCalendarAlt /> Events</Link>
        <Link to="/admin/team" className="sidebar-link"><FaUsers /> Team</Link>
        <Link to="/admin/announcements" className="sidebar-link"><FaBullhorn /> Announcements</Link>
        <Link to="/admin/sponsors" className="sidebar-link"><FaHandshake /> Sponsors</Link>
        <Link to="/admin/management" className="sidebar-link active"><FaCog /> Management</Link>
      </nav>
      <div className="sidebar-bottom">
        <Link to="/" className="sidebar-link"><FaHome /> View Site</Link>
      </div>
    </aside>
  );
  return (
    <div className="admin-layout">
      <Sidebar />
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
                <option value="SuperAdmin">SuperAdmin</option>
                <option value="EventHead">EventHead</option>
                <option value="PRTeam">PRTeam</option>
                <option value="Alumni">Alumni</option>
                <option value="GeneralUser">GeneralUser</option>
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
                      <td><span className="tag">{u.role}</span></td>
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
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                    <button type="button" className="btn-secondary" onClick={() => { setEditingNotice(null); setNoticeForm({ title: '', description: '', priority: 'Medium', isActive: true }); }}>
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
                    const filtered = SECTION_KEYS.filter(s => newCat === 'Our Team' ? s.key.startsWith('team_') : !s.key.startsWith('team_'));
                    setSelectedSection(filtered[0]?.key);
                  }}
                >
                  <option value="Our Department">Our Department</option>
                  <option value="Our Team">Our Team</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <h3>2. Select Image Space</h3>
                <select 
                  className="section-dropdown"
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                >
                  {SECTION_KEYS.filter(s => selectedCategory === 'Our Team' ? s.key.startsWith('team_') : !s.key.startsWith('team_')).map(s => (
                    <option key={s.key} value={s.key}>
                      {s.label} {sectionImages[s.key] ? ' (✓ Image set)' : ' (No image)'}
                    </option>
                  ))}
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
                <div className="current-img-preview">
                  <div className="current-img-label">Current Image</div>
                  <img 
                    src={sectionImages[selectedSection].imageURL} 
                    alt="current" 
                    style={{ 
                      aspectRatio: SECTION_KEYS.find(s => s.key === selectedSection)?.aspectRatio || 'auto',
                      objectFit: 'cover'
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
                    aspectRatio: SECTION_KEYS.find(s => s.key === selectedSection)?.aspectRatio || 'auto',
                    maxHeight: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FaUpload className="upload-zone-icon" />
                  <p>Click to select image for <strong>{currentSectionLabel}</strong></p>
                  <p className="upload-zone-sub">JPG, PNG, WebP — will be cropped before upload</p>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileSelect} />
                </div>
              )}
              {/* Cropper */}
              {cropping && cropSrc && (
                <div className="cropper-area">
                  <div className="cropper-label">
                    <FaCrop /> Crop the image — then click Upload
                  </div>
                  <Cropper
                    ref={cropperRef}
                    src={cropSrc}
                    style={{ maxHeight: '50vh', width: '100%' }}
                    aspectRatio={SECTION_KEYS.find(s => s.key === selectedSection)?.aspectRatio ?? NaN}
                    guides={true}
                    viewMode={1}
                    autoCropArea={1}
                    background={false}
                    responsive={true}
                    checkOrientation={false}
                    cropBoxResizable={false}
                    dragMode="move"
                  />
                  <div className="cropper-actions">
                    <button
                      className="btn-primary"
                      disabled={uploading}
                      onClick={uploadCropped}
                    >
                      {uploading ? 'Uploading...' : <><FaUpload /> Upload Cropped Image</>}
                    </button>
                    <button className="btn-secondary" onClick={() => { setCropping(false); setCropSrc(null); }}>
                      Cancel
                    </button>
                  </div>
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