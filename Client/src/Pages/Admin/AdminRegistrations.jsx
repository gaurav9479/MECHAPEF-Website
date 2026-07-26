import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import { eventService } from '../../services/services';
import api from '../../services/api';
import './AdminDashboard.css';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaDownload, FaEye } from 'react-icons/fa';

const AdminRegistrations = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedReg, setSelectedReg] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [evRes, regRes] = await Promise.all([
        eventService.getById(eventId),
        api.get(`/events/${eventId}/registrations`)
      ]);
      setEvent(evRes.data.data.event);
      setRegistrations(regRes.data.data.registrations);
    } catch (err) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const handleVerify = async (regId, currentStatus) => {
    try {
      await api.patch(`/registrations/${regId}/verify`, { isVerified: !currentStatus });
      showToast(`Registration ${!currentStatus ? 'verified' : 'unverified'}!`);
      setRegistrations(prev => prev.map(r => r._id === regId ? { ...r, isVerified: !currentStatus } : r));
    } catch (err) {
      showToast('Failed to verify', 'error');
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get(`/events/${eventId}/registrations/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${event?.title?.replace(/\\s+/g, '_')}_Registrations.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showToast('Failed to export CSV', 'error');
    }
  };

  const openDetails = (reg) => {
    setSelectedReg(reg);
    setShowModal(true);
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-form-page">
        <div className="admin-form-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Link to="/admin/events" style={{ color: '#ff1f01', textDecoration: 'none', fontSize: '1.2rem' }}>
              <FaArrowLeft />
            </Link>
            <h1>{event?.title ? `${event.title} - Registrations` : 'Registrations'}</h1>
          </div>
          <button className="btn-primary" onClick={handleExport}>
            <FaDownload /> Export CSV
          </button>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Reg No</th>
                <th>Branch</th>
                <th>Year</th>
                <th>Email</th>
                <th>Type</th>
                <th>Verified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', color: '#555', padding: '30px' }}>Loading...</td></tr>
              ) : registrations.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', color: '#555', padding: '30px' }}>No registrations yet.</td></tr>
              ) : registrations.map(reg => {
                const name = reg.registeredBy?.name;
                return (
                  <tr key={reg._id}>
                    <td style={{ fontWeight: 600, color: '#fff' }}>
                      {name ? name : <span style={{ color: '#ff4444' }}>Not Registered</span>}
                    </td>
                    <td>{reg.registeredBy?.collegeRegNo || '-'}</td>
                    <td>{reg.registeredBy?.branch || '-'}</td>
                    <td>{reg.registeredBy?.yearOfStudy ? `${reg.registeredBy.yearOfStudy} Yr` : '-'}</td>
                    <td>{reg.registeredBy?.email || '-'}</td>
                    <td><span className="tag">{reg.registrationType}</span></td>
                    <td>
                      {reg.isVerified ?
                        <span style={{ color: '#00c864', display: 'flex', alignItems: 'center', gap: '5px' }}><FaCheckCircle /> Yes</span> :
                        <span style={{ color: '#ff4444', display: 'flex', alignItems: 'center', gap: '5px' }}><FaTimesCircle /> No</span>
                      }
                    </td>
                    <td style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => openDetails(reg)}>
                        <FaEye /> Details
                      </button>
                      <button
                        className={reg.isVerified ? 'btn-danger' : 'btn-primary'}
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={() => handleVerify(reg._id, reg.isVerified)}
                      >
                        {reg.isVerified ? 'Unverify' : 'Verify'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* Details Modal */}
      {showModal && selectedReg && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2>Registration Details</h2>
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ backgroundColor: '#111', padding: '15px', borderRadius: '8px' }}>
                <h4 style={{ color: '#ff1f01', marginBottom: '10px' }}>User Info</h4>
                <p><strong>Name:</strong> {selectedReg.registeredBy?.name}</p>
                <p><strong>Email:</strong> {selectedReg.registeredBy?.email}</p>
                <p><strong>Reg No:</strong> {selectedReg.registeredBy?.collegeRegNo}</p>
                <p><strong>Phone:</strong> {selectedReg.registeredBy?.phoneNumber}</p>
                <p><strong>Branch:</strong> {selectedReg.registeredBy?.branch}</p>
                <p><strong>Year:</strong> {selectedReg.registeredBy?.yearOfStudy}</p>
              </div>

              {selectedReg.registrationType === 'Team' && (
                <div style={{ backgroundColor: '#111', padding: '15px', borderRadius: '8px' }}>
                  <h4 style={{ color: '#ff1f01', marginBottom: '10px' }}>Team Info</h4>
                  <p><strong>Team Name:</strong> {selectedReg.teamName}</p>
                  <p><strong>Members:</strong> {selectedReg.teamMembers?.map(m => m.name).join(', ')}</p>
                </div>
              )}

              <div style={{ backgroundColor: '#111', padding: '15px', borderRadius: '8px' }}>
                <h4 style={{ color: '#ff1f01', marginBottom: '10px' }}>Custom Form Data</h4>
                {selectedReg.customData && Object.keys(selectedReg.customData).length > 0 ? (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {Object.entries(selectedReg.customData).map(([key, value]) => {
                      const url = typeof value === 'object' && value !== null ? value.url : value;
                      const isImage = typeof url === 'string' && url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                      const isPdf = typeof url === 'string' && url.match(/\.pdf$/i);

                      return (
                        <div key={key} style={{ marginBottom: '15px' }}>
                          <strong style={{ color: '#aaa' }}>{key}:</strong>
                          <div style={{ marginTop: '5px' }}>
                            {url === '[File Deleted for Privacy]' ? (
                              <span style={{ color: '#ffaa00', fontStyle: 'italic' }}>[File Deleted for Privacy]</span>
                            ) : isImage ? (
                              <a href={url} target="_blank" rel="noopener noreferrer">
                                <img src={url} alt={key} style={{ maxWidth: '200px', borderRadius: '8px', border: '1px solid #333' }} />
                              </a>
                            ) : isPdf ? (
                              <a href={url} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ display: 'inline-flex', padding: '5px 10px', textDecoration: 'none' }}>
                                View PDF Document
                              </a>
                            ) : (
                              <span style={{ marginLeft: '10px', color: '#fff', wordBreak: 'break-all' }}>{typeof value === 'object' ? JSON.stringify(value) : value?.toString() || 'N/A'}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: '#888' }}>No custom data provided.</p>
                )}
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
};

export default AdminRegistrations;
