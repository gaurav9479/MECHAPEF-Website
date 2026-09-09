import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaUsers, FaBullhorn, FaHandshake, FaHome, FaSignOutAlt, FaCog, FaImages, FaCheckCircle, FaLink } from 'react-icons/fa';
import api from '../../services/api';
import { eventService } from '../../services/services';
import CropperInput from '../../components/CropperInput/CropperInput';
import './AdminDashboard.css';
const CATEGORIES = ['Mechapef-Event', 'Departmental'];
const BRANCHES = [
  'Biotechnology',
  'Chemical Engineering',
  'Civil Engineering',
  'Computer Science and Engineering',
  'Electronics and Communication Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Electronics and Computational Mechanics',
  'Materials Engineering',
  'Production and Industrial Engineering'
];
const emptyForm = {
  title: '', description: '', category: 'Mechapef-Event',
  startTime: '', endTime: '', venue: '', registrationStartDate: '', registrationDeadline: '',
  maxTeamSize: 1, registrationMode: 'Standard', registrationFee: 0, featured: false, isTBD: false, rules: '', prizes: '',
  customFormFields: [], eligibleBranches: [], eligibleYears: [],
  ticketStages: ['Stage 1: Gate Entry', 'Stage 2: Kit / Food Collection'],
  enableQRScanning: true,
  attendanceMethod: 'qr',
  bannerURL: ''
};
const AdminEvents = () => {
  const { user, logout } = useAuth();
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

  const handleDelete = async (id) => {
    if (user?.role !== 'super-admin') {
      showToast('Only a Super Admin can initiate event deletion', 'error');
      return;
    }
    if (!window.confirm('⚠️ INITIATE MULTI-SIG DELETION: Are you sure you want to list this event for deletion? This will require approval from 2 additional SuperAdmins (3 total votes).')) return;
    try {
      const res = await api.delete(`/events/${id}`);
      showToast(res.data?.message || 'Event deletion initiated. Awaiting approval from 2 more SuperAdmins.');
      fetchEvents();
    } catch (err) { showToast(err.response?.data?.message || 'Failed to initiate deletion', 'error'); }
  };

  const handleApproveDelete = async (id) => {
    if (!window.confirm('✓ APPROVE EVENT DELETION: Are you sure you want to cast your SuperAdmin vote to approve deleting this event?')) return;
    try {
      const res = await api.post(`/events/${id}/approve-deletion`);
      const { isFullyApproved, csvData, csvFileName } = res.data?.data || {};

      if (isFullyApproved && csvData) {

        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', csvFileName || `FINAL_REGISTRATIONS_BACKUP_${id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('📥 Deletion Fully Approved! Final Registration Backup CSV automatically downloaded.');
      } else {
        showToast(res.data?.message || 'Deletion approval recorded!');
      }

      fetchEvents();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve deletion', 'error');
    }
  };

  const handleCancelDelete = async (id) => {
    if (!window.confirm('CANCEL DELETION REQUEST: Restore this event back to Active state?')) return;
    try {
      const res = await api.post(`/events/${id}/cancel-deletion`);
      showToast(res.data?.message || 'Deletion request cancelled. Event restored.');
      fetchEvents();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel deletion', 'error');
    }
  };

  const addTicketStage = () => {
    const current = form.ticketStages || [];
    f('ticketStages', [...current, `Stage ${current.length + 1}: Custom Check-in`]);
  };

  const updateTicketStage = (index, value) => {
    const current = [...(form.ticketStages || [])];
    current[index] = value;
    f('ticketStages', current);
  };

  const removeTicketStage = (index) => {
    const current = (form.ticketStages || []).filter((_, i) => i !== index);
    f('ticketStages', current);
  };

  const setStagePreset = (count) => {
    if (count === 1) {
      f('ticketStages', ['Stage 1: Main Gate Entry']);
    } else if (count === 2) {
      f('ticketStages', ['Stage 1: Main Gate Entry', 'Stage 2: Kit / Food Collection']);
    } else if (count === 3) {
      f('ticketStages', ['Stage 1: Main Gate Entry', 'Stage 2: Food & Refreshment', 'Stage 3: Certificate / Stage Entry']);
    }
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

    if (!editingEvent && showModal) {
      const timer = setTimeout(() => {
        localStorage.setItem('mechapef_adminEventFormDraft', JSON.stringify(form));
      }, 500);
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
  const formatLocal = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const openEdit = (ev) => {
    setEditingEvent(ev);
    setForm({
      title: ev.title, description: ev.description,
      category: ev.category, venue: ev.venue,
      startTime: formatLocal(ev.startTime),
      endTime: formatLocal(ev.endTime),
      registrationStartDate: formatLocal(ev.registrationStartDate),
      registrationDeadline: formatLocal(ev.registrationDeadline),
      maxTeamSize: ev.maxTeamSize,
      registrationMode: ev.registrationMode || 'Standard',
      registrationFee: ev.registrationFee,
      featured: ev.featured, isTBD: ev.isTBD || false,
      rules: Array.isArray(ev.rules) ? ev.rules.join('\n') : '',
      prizes: ev.prizes || '',
      customFormFields: ev.customFormFields || [],
      eligibleBranches: ev.eligibleBranches || [],
      eligibleYears: ev.eligibleYears || [],
      ticketStages: ev.ticketStages && ev.ticketStages.length > 0 ? ev.ticketStages : ['Stage 1: Gate Entry', 'Stage 2: Kit / Food Collection'],
      enableQRScanning: ev.enableQRScanning !== undefined ? ev.enableQRScanning : true,
      attendanceMethod: ev.attendanceMethod || (ev.enableQRScanning === false ? 'id-card' : 'qr')
    });
    setShowModal(true);
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
      registrationStartDate: form.isTBD && !form.registrationStartDate ? '2099-12-01T00:00' : (form.registrationStartDate || undefined),
      registrationDeadline: form.isTBD && !form.registrationDeadline ? '2099-12-30T23:59' : form.registrationDeadline,
      rules: form.rules ? (typeof form.rules === 'string' ? form.rules.split('\n').filter(Boolean) : form.rules) : [],
      maxTeamSize: Number(form.maxTeamSize),
      registrationMode: Number(form.maxTeamSize) > 1 ? form.registrationMode : 'Standard',
      registrationFee: Number(form.registrationFee),
      enableQRScanning: form.attendanceMethod === 'qr',
    };
    try {
      if (editingEvent) {
        await eventService.update(editingEvent._id, payload);
        showToast('Event updated successfully');
      } else {
        await eventService.create(payload);
        showToast('Event created successfully');
      }
      setShowModal(false);
      localStorage.removeItem('mechapef_adminEventFormDraft');
      fetchEvents();
    } catch (err) { showToast(err.response?.data?.message || 'Failed to save', 'error'); }
    finally { setSubmitting(false); }
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
                <tr><td colSpan="5" style={{ textAlign: 'center', color: '#555', padding: '30px' }}>Loading...</td></tr>
              ) : events.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: '#555', padding: '30px' }}>No events yet. Create one!</td></tr>
              ) : events.map(ev => (
                <tr key={ev._id} style={{ background: ev.deletionState?.status === 'APPROVED_RETENTION' ? 'rgba(255, 31, 1, 0.05)' : ev.deletionState?.status === 'PENDING_APPROVAL' ? 'rgba(255, 170, 0, 0.05)' : 'transparent' }}>
                  <td>
                    <strong style={{ color: '#fff' }}>{ev.title}</strong>
                    {ev.featured && <span className="tag" style={{ marginLeft: '8px', backgroundColor: '#222' }}>Featured</span>}
                  </td>
                  <td>{ev.isTBD ? 'TBD' : new Date(ev.startTime).toLocaleDateString()}</td>
                  <td>{ev.isTBD && ev.venue === 'TBD' ? 'TBD' : ev.venue}</td>
                  <td>
                    {ev.deletionState?.status === 'PENDING_APPROVAL' ? (
                      <span className="tag" style={{ background: 'rgba(255, 170, 0, 0.2)', color: '#ffaa00', border: '1px solid #ffaa00', whiteSpace: 'nowrap' }}>
                        ⚠️ DELETION PENDING ({ev.deletionState.approvals?.length || 1}/3 Votes)
                      </span>
                    ) : ev.deletionState?.status === 'APPROVED_RETENTION' ? (
                      <span className="tag" style={{ background: 'rgba(255, 31, 1, 0.2)', color: '#ff4444', border: '1px solid #ff4444', whiteSpace: 'nowrap' }}>
                        ⏳ VANISHES IN 7 DAYS ({ev.deletionState.vanishAt ? new Date(ev.deletionState.vanishAt).toLocaleDateString() : 'Queued'})
                      </span>
                    ) : (
                      <span className={`tag ${ev.status?.toLowerCase() === 'ended' ? 'bg-danger' : 'bg-success'}`} style={{ whiteSpace: 'nowrap' }}>
                        {ev.status || 'Upcoming'}
                      </span>
                    )}
                  </td>
                  <td style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>


                    {(ev.deletionState?.status === 'PENDING_APPROVAL' || ev.deletionState?.status === 'APPROVED_RETENTION') && user?.role === 'super-admin' && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {ev.deletionState?.status === 'PENDING_APPROVAL' && (
                          <>
                            {ev.deletionState.approvals?.some(a => (a.approvedBy?._id || a.approvedBy) === user?._id) ? (
                              <button
                                className="btn-primary"
                                disabled
                                style={{ padding: '4px 10px', fontSize: '0.78rem', background: '#333', color: '#888', fontWeight: 'bold', cursor: 'not-allowed', border: '1px solid #555' }}
                              >
                                ✓ Vote Cast
                              </button>
                            ) : (
                              <button
                                className="btn-primary"
                                title="Cast SuperAdmin Vote to Approve Deletion"
                                onClick={() => handleApproveDelete(ev._id)}
                                style={{ padding: '4px 10px', fontSize: '0.78rem', background: '#00c864', color: '#000', fontWeight: 'bold' }}
                              >
                                ✓ Approve Deletion
                              </button>
                            )}
                            <button
                              className="btn-secondary"
                              title="Cancel Deletion Request"
                              onClick={() => handleCancelDelete(ev._id)}
                              style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {ev.deletionState?.status === 'APPROVED_RETENTION' && (
                          <button
                            className="btn-secondary"
                            title="Restore Event before 7-day purge"
                            onClick={() => handleCancelDelete(ev._id)}
                            style={{ padding: '4px 10px', fontSize: '0.78rem', color: '#00e5ff', borderColor: '#00e5ff' }}
                          >
                            🔄 Restore Event
                          </button>
                        )}
                      </div>
                    )}


                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {ev.status !== 'Ended' && ev.deletionState?.status === 'ACTIVE' && (
                        <button className="btn-secondary" title="End Event" onClick={() => handleEndEvent(ev._id)} style={{ padding: '6px 10px' }}>
                          <FaCheckCircle style={{ color: '#ffaa00' }} />
                        </button>
                      )}
                      {ev.status === 'Ended' && ev.deletionState?.status === 'ACTIVE' && (
                        <button className="btn-danger" title="Wipe Form Data & Files" onClick={() => handleWipeData(ev._id)} style={{ padding: '6px 10px' }}>
                          🧹
                        </button>
                      )}
                      <Link to={`/admin/events/${ev._id}/registrations`} className="btn-primary" style={{ padding: '6px 10px' }}><FaUsers /></Link>
                      <button className="btn-secondary" style={{ padding: '6px 10px' }} onClick={() => openEdit(ev)}><FaEdit /></button>


                      {user?.role === 'super-admin' && ev.deletionState?.status === 'ACTIVE' && (
                        <button className="btn-secondary" title="Initiate Multi-Sig Deletion" onClick={() => handleDelete(ev._id)} style={{ padding: '6px 10px', color: '#ff1f01', borderColor: '#ff1f01' }}>
                          <FaTrash />
                        </button>
                      )}
                    </div>
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
              <div className="admin-form-grid">
                <div className="form-group full" style={{ marginBottom: '20px' }}>
                  <label>Event Poster (1:1 Aspect Ratio Recommended)</label>
                  <CropperInput
                    initialImage={form.bannerURL}
                    aspect={1}
                    folder="events"
                    onSave={(url) => {
                      f('bannerURL', url);
                      showToast('Poster cropped and uploaded successfully');
                    }}
                    label="Upload & Crop Poster"
                  />
                  {form.bannerURL && (
                    <button type="button" onClick={() => f('bannerURL', '')} className="btn-danger" style={{ marginTop: '10px', padding: '8px 12px' }}>Remove Poster</button>
                  )}
                </div>
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
                  <label>Registration Start Date</label>
                  <input type="datetime-local" value={form.registrationStartDate} onChange={e => f('registrationStartDate', e.target.value)} disabled={form.isTBD} placeholder="Immediate if left empty" />
                </div>
                <div className="form-group">
                  <label>Registration Deadline {!form.isTBD && '*'}</label>
                  <input type="datetime-local" value={form.registrationDeadline} onChange={e => f('registrationDeadline', e.target.value)} required={!form.isTBD} disabled={form.isTBD} />
                </div>
                <div className="form-group">
                  <label>Max Team Size</label>
                  <input type="number" min="1" value={form.maxTeamSize} onChange={e => f('maxTeamSize', e.target.value)} />
                </div>
                {Number(form.maxTeamSize) > 1 && (
                  <div className="form-group">
                    <label>Registration Mode</label>
                    <select value={form.registrationMode} onChange={e => f('registrationMode', e.target.value)}>
                      <option value="Standard">Standard – Leader registers all members</option>
                      <option value="JoinRequests">Type 2 – Members search & send join requests</option>
                    </select>
                    {form.registrationMode === 'JoinRequests' && (
                      <small style={{ color: '#ffaa00', marginTop: '5px', display: 'block' }}>
                        ⚠️ In Type 2 mode, the leader creates a Draft team. Others search by the leader's Reg No and send join requests. The leader accepts/rejects, then finalizes.
                      </small>
                    )}
                  </div>
                )}
                <div className="form-group">
                  <label>Registration Fee (₹)</label>
                  <input type="number" min="0" value={form.registrationFee} onChange={e => f('registrationFee', e.target.value)} />
                </div>
                <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.featured} onChange={e => f('featured', e.target.checked)} />
                    Featured Event
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginLeft: '20px' }}>
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

                {/* Ticket Verification Stages (Scanning Stations) */}
                <div className="form-group full" style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <h3 style={{ margin: 0, color: '#ff1f01' }}>Ticket Verification Stages (Scanning Stations)</h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#888' }}>
                        Define custom check-in stages (e.g. Stage 1: Main Gate, Stage 2: Food & Kit Collection).
                      </p>
                    </div>
                    <button type="button" className="btn-secondary" onClick={addTicketStage} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                      <FaPlus /> Add Stage
                    </button>
                  </div>

                  {/* Stage Presets */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78rem', color: '#aaa' }}>Quick Presets:</span>
                    <button type="button" onClick={() => setStagePreset(1)} style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>
                      1-Stage (Gate Entry)
                    </button>
                    <button type="button" onClick={() => setStagePreset(2)} style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#222', border: '1px solid #ff1f01', color: '#ff1f01', borderRadius: '4px', cursor: 'pointer' }}>
                      2-Stage (Gate + Food/Kit)
                    </button>
                    <button type="button" onClick={() => setStagePreset(3)} style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#222', border: '1px solid #00e5ff', color: '#00e5ff', borderRadius: '4px', cursor: 'pointer' }}>
                      3-Stage (Gate + Food + Certificate)
                    </button>
                  </div>

                  {(form.ticketStages || []).map((stage, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center', backgroundColor: '#111', padding: '10px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#ff1f01', fontWeight: 'bold', width: '70px', flexShrink: 0 }}>
                        Stage {idx + 1}:
                      </span>
                      <input
                        value={stage}
                        onChange={e => updateTicketStage(idx, e.target.value)}
                        placeholder={`Stage ${idx + 1} Name (e.g. Stage 1: Main Gate Check-in)`}
                        required
                        style={{ flex: 1, background: '#1c1c20', color: '#fff', border: '1px solid #333', borderRadius: '6px', padding: '8px 12px' }}
                      />
                      {(form.ticketStages || []).length > 1 && (
                        <button type="button" className="btn-danger" onClick={() => removeTicketStage(idx)} style={{ padding: '8px' }}>
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Attendance Method */}
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', color: '#ccc', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px' }}>
                  Attendance Method
                </label>
                <select
                  value={form.attendanceMethod || 'qr'}
                  onChange={e => f('attendanceMethod', e.target.value)}
                  style={{ width: '100%', maxWidth: '420px', padding: '10px 14px', background: '#1a1a20', color: '#fff', border: '1px solid #333', borderRadius: '8px', fontSize: '0.9rem' }}
                >
                  <option value="qr">QR Code</option>
                  <option value="id-card">ID Card Barcode</option>
                </select>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginTop: '6px' }}>
                  {form.attendanceMethod === 'id-card'
                    ? 'Use the scanner to read participant ID card barcodes, including IDs such as 20246 and 20247.'
                    : 'Use the scanner to read each participant ticket QR code.'}
                </span>
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