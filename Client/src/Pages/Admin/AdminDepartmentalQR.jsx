import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import { eventService } from '../../services/services';
import './AdminDashboard.css';

const AdminDepartmentalQR = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const endorse = async (eventId) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/departmental-registrations/${eventId}/endorse`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Endorsement failed');
    setMessage('Departmental QR registration endorsed successfully.');
    setEvents(prev => prev.map(event => event._id === eventId ? { ...event, departmentalRegistrationEnabled: true } : event));
  };

  const uploadList = async (eventId, file) => {
    const text = await file.text();
    const rows = text.trim().split(/\r?\n/).slice(1).map(row => row.split(',').map(value => value.trim()));
    const students = rows.filter(row => row.length >= 3).map(([name, collegeRegNo, branch]) => ({ name, collegeRegNo, branch }));
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/departmental-registrations/${eventId}/allowlist`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify({ students }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Allow-list upload failed');
    setMessage(`${data.data.count} students approved for ${eventId}`);
  };

  useEffect(() => {
    eventService.getAll({ limit: 100, includeArchived: true })
      .then(res => setEvents((res.data.data?.events || []).filter(e => e.registrationMode === 'DepartmentalQR')))
      .finally(() => setLoading(false));
  }, []);

  return <div className="admin-layout"><AdminSidebar /><main className="admin-form-page">
    <div className="admin-form-topbar"><h1>Departmental QR Registration</h1><Link className="btn-secondary" to="/admin/events">Manage Events</Link></div>
    <div className="admin-table-wrap" style={{ padding: 24 }}>
      <p style={{ color: '#aaa' }}>Only events using the Departmental QR Registration mode appear here.</p>
      {message && <p style={{ color: '#00c864' }}>{message}</p>}
      {loading ? <p>Loading...</p> : events.length === 0 ? <p style={{ color: '#888' }}>No Departmental QR events endorsed yet.</p> : events.map(event => <div key={event._id} style={{ border: '1px solid #333', padding: 18, marginTop: 12, borderRadius: 8, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}><div><strong>{event.title}</strong><div style={{ color: '#888', marginTop: 6 }}>{event.category} · {event.status} · {event.departmentalRegistrationEnabled ? 'Endorsed' : 'Not endorsed'}</div></div><div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>{!event.departmentalRegistrationEnabled && <button className="btn-primary" onClick={async () => { try { await endorse(event._id); } catch (err) { setMessage(err.message); } }}>Endorse Event</button>}{event.departmentalRegistrationEnabled && <><label className="btn-secondary" style={{ cursor: 'pointer' }}>Upload Student CSV<input type="file" accept=".csv,text/csv" hidden onChange={async e => { try { if (e.target.files[0]) await uploadList(event._id, e.target.files[0]); } catch (err) { setMessage(err.message); } }} /></label><a className="btn-primary" href={`/departmentalregister?eventId=${event._id}`} target="_blank" rel="noreferrer">Open Public Registration</a></>}</div></div>)}
    </div>
  </main></div>;
};
export default AdminDepartmentalQR;
