import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaUsers, FaBullhorn, FaHandshake, FaHome, FaSignOutAlt, FaCog, FaImages, FaCheckCircle } from 'react-icons/fa';
import api from '../../services/api';
import { eventService } from '../../services/services';
import './AdminDashboard.css';
const CATEGORIES = ['MechapefEvent', 'Departmental'];
const BRANCHES = [
  'Biotechnology',
  'Chemical Engineering',
  'Civil Engineering',
  'Computer Science and Engineering',
  'Electronics and Communication Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Electronics and Computational Mechanics',
  'Materials Engineering'
];
const emptyForm = {
  title: '', description: '', category: 'MechapefEvent',
  startTime: '', endTime: '', venue: '', registrationDeadline: '',
  maxTeamSize: 1, registrationFee: 0, featured: false, isTBD: false, rules: '', prizes: '',
  customFormFields: [], eligibleBranches: [], eligibleYears: []
};
const AdminEvents = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/login'); };
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  const fetchEvents = async () => {
    try {
      const res = await eventService.getAll({ limit: 50 });
      setEvents(res.data.data?.events || []);
    } catch { showToast('Failed to load events', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchEvents(); }, []);

  useEffect(() => {
    // Only cache if we are creating an event (not editing) and the modal is open
    if (!editingEvent && showModal) {
      const timer = setTimeout(() => {
        localStorage.setItem('mechapef_adminEventFormDraft', JSON.stringify(form));
      }, 500); // 500ms debounce to prevent lag on keystrokes/clicks
      return () => clearTimeout(timer);
    }
  }, [form, editingEvent, showModal]);

  const openCreate = () => {
    setEditingEvent(null);
    const draft = localStorage.getItem('mechapef_adminEventFormDraft');
    if (draft) {
      try {
        setForm(JSON.parse(draft));
      } catch (e) {
        setForm(emptyForm);
      }
    } else {
      setForm(emptyForm);
    }
    setShowModal(true);
  };
  const openEdit = (ev) => {
    setEditingEvent(ev);
    setForm({
      title: ev.title, description: ev.description,
      category: ev.category, venue: ev.venue,
      startTime: ev.startTime?.slice(0, 16),
      endTime: ev.endTime?.slice(0, 16),
      registrationDeadline: ev.registrationDeadline?.slice(0, 16),
      maxTeamSize: ev.maxTeamSize, registrationFee: ev.registrationFee,
      featured: ev.featured, isTBD: ev.isTBD || false,
      rules: Array.isArray(ev.rules) ? ev.rules.join('\n') : '',
      prizes: ev.prizes || '',
      customFormFields: ev.customFormFields || [],
      eligibleBranches: ev.eligibleBranches || [],
      eligibleYears: ev.eligibleYears || []
    });
    setShowModal(true);
  };
  const handleDelete = async (id) => {
    if (!window.confirm('WARNING: Are you sure you want to permanently delete this event? All associated registrations and data will be permanently wiped out!')) return;
    try {
      await eventService.delete(id);
      showToast('Event deleted');
      fetchEvents();
    } catch { showToast('Failed to delete', 'error'); }
  };

  const handleEndEvent = async (id) => {
    if (!window.confirm('Are you sure you want to end this event? Its history will be saved, but photo data will be scheduled for auto-deletion in 4 days.')) return;
    try {
      await api.patch(`/events/${id}/end`);
      showToast('Event marked as ended');
      fetchEvents();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to end event', 'error');
    }
  };

  const handleWipeData = async (id) => {
    if (!window.confirm('⚠️ Are you sure? This will permanently delete all files and custom form inputs submitted for this event to save storage. This action CANNOT be undone!')) return;
    try {
      const res = await eventService.wipeData(id);
      showToast(`Wiped successfully. ${res.data.data.deletedFilesCount} files removed from ImageKit.`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to wipe data', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.eligibleBranches || form.eligibleBranches.length === 0) {
      showToast('At least one eligible branch must be selected', 'error');
      setSubmitting(false);
      return;
    }
    if (!form.eligibleYears || form.eligibleYears.length === 0) {
      showToast('At least one eligible year must be selected', 'error');
      setSubmitting(false);
      return;
    }
    setSubmitting(true);
    const payload = {
      ...form,
      venue: form.isTBD && !form.venue ? 'TBD' : form.venue,
      startTime: form.isTBD && !form.startTime ? '2099-12-31T00:00' : form.startTime,
      endTime: form.isTBD && !form.endTime ? '2099-12-31T23:59' : form.endTime,
      registrationDeadline: form.isTBD && !form.registrationDeadline ? '2099-12-30T23:59' : form.registrationDeadline,
      rules: form.rules ? form.rules.split('\n').filter(Boolean) : [],
      maxTeamSize: Number(form.maxTeamSize),
      registrationFee: Number(form.registrationFee),
    };
    try {
      if (editingEvent) {
        await eventService.update(editingEvent._id, payload);
        showToast('Event updated!');
      } else {
        await eventService.create(payload);
        showToast('Event created!');
        localStorage.removeItem('mechapef_adminEventFormDraft');
        setForm(emptyForm);
      }
      setShowModal(false);
      fetchEvents();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving event', 'error');
    } finally { setSubmitting(false); }
  };
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addCustomField = () => {
    setForm(p => ({
      ...p,
      customFormFields: [...p.customFormFields, { fieldName: '', fieldType: 'text', isRequired: false }]
    }));
  };

  const removeCustomField = (index) => {
    setForm(p => ({
      ...p,
      customFormFields: p.customFormFields.filter((_, i) => i !== index)
    }));
  };

  const updateCustomField = (index, key, value) => {
    setForm(p => {
      const updatedFields = [...p.customFormFields];
      updatedFields[index][key] = value;
      return { ...p, customFormFields: updatedFields };
    });
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-form-page">
        <div className="admin-form-topbar">
          <h1>Events</h1>
          <button className="btn-primary" onClick={openCreate}><FaPlus /> Add Event</button>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Title</th><th>Start</th><th>Venue</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{textAlign:'center', color:'#555', padding:'30px'}}>Loading...</td></tr>
              ) : events.length === 0 ? (
                <tr><td colSpan="5" style={{textAlign:'center', color:'#555', padding:'30px'}}>No events yet. Create one!</td></tr>
              ) : events.map(ev => (
                <tr key={ev._id}>
                  <td>
                    <strong style={{color:'#fff'}}>{ev.title}</strong>
                    {ev.featured && <span className="tag" style={{marginLeft:'8px', backgroundColor:'#222'}}>Featured</span>}
                  </td>
                  <td>{ev.isTBD ? 'TBD' : new Date(ev.startTime).toLocaleDateString()}</td>
                  <td>{ev.isTBD && ev.venue === 'TBD' ? 'TBD' : ev.venue}</td>
                  <td>
                    <span className={`tag ${ev.status?.toLowerCase() === 'ended' ? 'bg-danger' : 'bg-success'}`}>
                      {ev.status || 'Upcoming'}
                    </span>
                  </td>
                  <td style={{display:'flex', gap:'8px'}}>
                    {ev.status !== 'Ended' && (
                      <button className="btn-secondary" title="End Event" onClick={() => handleEndEvent(ev._id)} style={{padding:'6px 10px'}}>
                        <FaCheckCircle style={{color: '#ffaa00'}} />
                      </button>
                    )}
                    {ev.status === 'Ended' && (
                      <button className="btn-danger" title="Wipe Form Data & Files" onClick={() => handleWipeData(ev._id)} style={{padding:'6px 10px'}}>
                        🧹
                      </button>
                    )}
                    <Link to={`/admin/events/${ev._id}/registrations`} className="btn-primary" style={{padding:'6px 10px'}}><FaUsers /></Link>
                    <button className="btn-secondary" style={{padding:'6px 10px'}} onClick={() => openEdit(ev)}><FaEdit /></button>
                    <button className="btn-danger" style={{padding:'6px 10px'}} onClick={() => handleDelete(ev._id)}><FaTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2>{editingEvent ? 'Edit Event' : 'Create Event'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group full">
                  <label>Title *</label>
                  <input value={form.title} onChange={e => f('title', e.target.value)} required placeholder="Event title" />
                </div>
                <div className="form-group full">
                  <label>Description *</label>
                  <textarea value={form.description} onChange={e => f('description', e.target.value)} required placeholder="Event description" />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select value={form.category} onChange={e => f('category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Venue {!form.isTBD && '*'}</label>
                  <input value={form.venue} onChange={e => f('venue', e.target.value)} required={!form.isTBD} disabled={form.isTBD} placeholder={form.isTBD ? "TBD" : "Event venue"} />
                </div>
                <div className="form-group">
                  <label>Start Time {!form.isTBD && '*'}</label>
                  <input type="datetime-local" value={form.startTime} onChange={e => f('startTime', e.target.value)} required={!form.isTBD} disabled={form.isTBD} />
                </div>
                <div className="form-group">
                  <label>End Time {!form.isTBD && '*'}</label>
                  <input type="datetime-local" value={form.endTime} onChange={e => f('endTime', e.target.value)} required={!form.isTBD} disabled={form.isTBD} />
                </div>
                <div className="form-group">
                  <label>Registration Deadline {!form.isTBD && '*'}</label>
                  <input type="datetime-local" value={form.registrationDeadline} onChange={e => f('registrationDeadline', e.target.value)} required={!form.isTBD} disabled={form.isTBD} />
                </div>
                <div className="form-group">
                  <label>Max Team Size</label>
                  <input type="number" min="1" value={form.maxTeamSize} onChange={e => f('maxTeamSize', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Registration Fee (₹)</label>
                  <input type="number" min="0" value={form.registrationFee} onChange={e => f('registrationFee', e.target.value)} />
                </div>
                <div className="form-group" style={{justifyContent:'flex-end'}}>
                  <label style={{display:'flex', alignItems:'center', gap:'10px', cursor:'pointer'}}>
                    <input type="checkbox" checked={form.featured} onChange={e => f('featured', e.target.checked)} />
                    Featured Event
                  </label>
                  <label style={{display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', marginLeft:'20px'}}>
                    <input type="checkbox" checked={form.isTBD} onChange={e => f('isTBD', e.target.checked)} />
                    TBD (To Be Decided)
                  </label>
                </div>
                <div className="form-group full">
                  <label>Rules (one per line)</label>
                  <textarea value={form.rules} onChange={e => f('rules', e.target.value)} placeholder="Rule 1&#10;Rule 2" />
                </div>
                <div className="form-group full">
                  <label>Prizes</label>
                  <input value={form.prizes} onChange={e => f('prizes', e.target.value)} placeholder="1st: ₹5000, 2nd: ₹3000" />
                </div>

                {/* Eligible Branches Selection */}
                <div className="form-group full" style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.9rem', color: '#ff1f01', fontWeight: 'bold' }}>Eligible Branches *</label>
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      onClick={() => {
                        if (form.eligibleBranches.length === BRANCHES.length) {
                          f('eligibleBranches', []);
                        } else {
                          f('eligibleBranches', [...BRANCHES]);
                        }
                      }}
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    >
                      {form.eligibleBranches.length === BRANCHES.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px', backgroundColor: '#111', padding: '15px', borderRadius: '8px' }}>
                    {BRANCHES.map(branch => {
                      const isChecked = form.eligibleBranches.includes(branch);
                      return (
                        <label key={branch} style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '0.85rem', color: '#ccc' }}>
                          <span style={{ width: '28px', flexShrink: 0, display: 'flex', alignItems: 'center', height: '20px' }}>
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={() => {
                                if (isChecked) {
                                  f('eligibleBranches', form.eligibleBranches.filter(b => b !== branch));
                                } else {
                                  f('eligibleBranches', [...form.eligibleBranches, branch]);
                                }
                              }}
                            />
                          </span>
                          <span style={{ lineHeight: '20px' }}>{branch}</span>
                        </label>
                      );
                    })}
                  </div>
                  <span style={{ 
                    color: '#ff4444', 
                    fontSize: '0.75rem', 
                    marginTop: '5px', 
                    display: 'block',
                    visibility: form.eligibleBranches.length === 0 ? 'visible' : 'hidden',
                    height: '14px'
                  }}>
                    * At least one branch must be selected
                  </span>
                </div>

                {/* Eligible Years Selection */}
                <div className="form-group full" style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.9rem', color: '#ff1f01', fontWeight: 'bold' }}>Eligible Years *</label>
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      onClick={() => {
                        if (form.eligibleYears.length === 5) {
                          f('eligibleYears', []);
                        } else {
                          f('eligibleYears', [1, 2, 3, 4, 5]);
                        }
                      }}
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    >
                      {form.eligibleYears.length === 5 ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', backgroundColor: '#111', padding: '15px', borderRadius: '8px' }}>
                    {[
                      { val: 1, label: '1st Year' },
                      { val: 2, label: '2nd Year' },
                      { val: 3, label: '3rd Year' },
                      { val: 4, label: '4th Year' },
                      { val: 5, label: 'Alumni / 5th' }
                    ].map(yearObj => {
                      const isChecked = form.eligibleYears.includes(yearObj.val);
                      return (
                        <label key={yearObj.val} style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '0.85rem', color: '#ccc' }}>
                          <span style={{ width: '28px', flexShrink: 0, display: 'flex', alignItems: 'center', height: '20px' }}>
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={() => {
                                if (isChecked) {
                                  f('eligibleYears', form.eligibleYears.filter(y => y !== yearObj.val));
                                } else {
                                  f('eligibleYears', [...form.eligibleYears, yearObj.val]);
                                }
                              }}
                            />
                          </span>
                          <span style={{ lineHeight: '20px' }}>{yearObj.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  <span style={{ 
                    color: '#ff4444', 
                    fontSize: '0.75rem', 
                    marginTop: '5px', 
                    display: 'block',
                    visibility: form.eligibleYears.length === 0 ? 'visible' : 'hidden',
                    height: '14px'
                  }}>
                    * At least one year must be selected
                  </span>
                </div>

                <div className="form-group full" style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3>Custom Registration Form Fields</h3>
                    <button type="button" className="btn-secondary" onClick={addCustomField} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                      <FaPlus /> Add Field
                    </button>
                  </div>
                  {form.customFormFields.map((field, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center', backgroundColor: '#111', padding: '10px', borderRadius: '8px' }}>
                      <input 
                        value={field.fieldName} 
                        onChange={e => updateCustomField(idx, 'fieldName', e.target.value)} 
                        placeholder="Field Name (e.g. GitHub Link)" 
                        required 
                        style={{ flex: 2 }}
                      />
                      <select 
                        value={field.fieldType} 
                        onChange={e => updateCustomField(idx, 'fieldType', e.target.value)}
                        style={{ flex: 1 }}
                      >
                        <option value="text">Text (Short)</option>
                        <option value="textarea">Textarea (Long)</option>
                        <option value="checkbox">Checkbox (Yes/No)</option>
                        <option value="file">File Upload (Image/PDF)</option>
                      </select>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        <input 
                          type="checkbox" 
                          checked={field.isRequired} 
                          onChange={e => updateCustomField(idx, 'isRequired', e.target.checked)} 
                        /> Req
                      </label>
                      <button type="button" className="btn-danger" onClick={() => removeCustomField(idx)} style={{ padding: '8px' }}>
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                  {form.customFormFields.length === 0 && <p style={{ color: '#888', fontSize: '0.9rem' }}>No custom fields added. Default fields (Name, Email, Reg No) are always included.</p>}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
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
export default AdminEvents;