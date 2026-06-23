import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import api from '../../services/api';
import './AdminDashboard.css';

const AdminTeam = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchMembers = async () => {
    try {
      const res = await api.get('/team');
      setMembers(res.data.data?.members || []);
    } catch {
      setToast({ msg: 'Failed to load team members', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchMembers(); 
  }, []);

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-form-page">
        <div className="admin-form-topbar">
          <h1>Team Members Overview</h1>
        </div>
        
        <div style={{ marginBottom: '20px', padding: '15px', background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#aaa', lineHeight: '1.5' }}>
          <strong>Note:</strong> This page automatically displays all verified platform users who hold an active team role (e.g., EventHead, PRTeam). 
          To add or remove team members, simply change their role in the <a href="/admin/management" style={{ color: '#00c864', textDecoration: 'none' }}>Management Portal</a>.
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Profile</th>
                <th>Name</th>
                <th>Email</th>
                <th>Reg No.</th>
                <th>Role</th>
                <th>Year</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#555', padding: '30px' }}>Loading...</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#555', padding: '30px' }}>No active team members found.</td></tr>
              ) : members.map(m => (
                <tr key={m._id}>
                  <td>
                    {m.profileImage ? (
                      <img src={m.profileImage} alt={m.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>?</div>
                    )}
                  </td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{m.name}</td>
                  <td style={{ fontFamily: 'sans-serif', fontSize: '0.85rem' }}>{m.email}</td>
                  <td style={{ fontFamily: 'monospace', color: '#aaa' }}>{m.collegeRegNo || '—'}</td>
                  <td><span className="tag" style={{ border: '1px solid #00c864', color: '#00c864', background: 'transparent' }}>{m.role}</span></td>
                  <td>{m.yearOfStudy ? `Year ${m.yearOfStudy}` : '—'}</td>
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
export default AdminTeam;