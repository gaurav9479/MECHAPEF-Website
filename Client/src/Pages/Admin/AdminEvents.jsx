import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import { FaPlus, FaEdit, FaTrash, FaUsers, FaCheckCircle, FaBolt } from 'react-icons/fa';
import api from '../../services/api';
import { eventService } from '../../services/services';
import './AdminDashboard.css';

const AdminEvents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

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

  const fetchEvents = async () => {
    try {
      const res = await eventService.getAll({ limit: 50 });
      setEvents(res.data.data?.events || []);
    } catch { showToast('Failed to load events', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchEvents(); }, []);

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

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-form-page">
        <div className="admin-form-topbar">
          <div>
            <h1>Events</h1>
            <p style={{ margin: '4px 0 0 0', color: '#888', fontSize: '0.85rem' }}>
              Manage technical & cultural events, registration pipelines, live quiz/voting engines, and check-in stages.
            </p>
          </div>
          <Link to="/admin/events/new" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <FaPlus /> Add Event
          </Link>
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
                    {ev.registrationMode === 'JoinRequests' ? (
                      <span className="tag" style={{ marginLeft: '8px', backgroundColor: 'rgba(0, 200, 100, 0.15)', color: '#00c864', border: '1px solid rgba(0, 200, 100, 0.3)' }}>
                        Type 2: Join Requests
                      </span>
                    ) : (
                      <span className="tag" style={{ marginLeft: '8px', backgroundColor: '#1a1a24', color: '#888', border: '1px solid #333' }}>
                        Type 1: Standard
                      </span>
                    )}
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
                      <Link to={`/admin/events/${ev._id}/registrations`} className="btn-primary" title="View Registrations" style={{ padding: '6px 10px' }}>
                        <FaUsers />
                      </Link>
                      <Link to={`/admin/events/${ev._id}/edit`} className="btn-secondary" title="Edit Event Page & Live Settings" style={{ padding: '6px 10px' }}>
                        <FaEdit />
                      </Link>

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

      {toast && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
};

export default AdminEvents;