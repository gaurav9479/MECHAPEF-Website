import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import { FaShoePrints, FaSpinner, FaHistory } from 'react-icons/fa';
import './AdminDashboard.css'; // Reusing standard admin styles

const AdminFootprints = () => {
  const [footprints, setFootprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFootprints();
  }, []);

  const fetchFootprints = async () => {
    try {
      setLoading(true);
      const res = await api.get('/footprints');
      setFootprints(res.data.data.footprints || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch footprints');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'CREATE': return <span style={{ color: '#10b981', fontWeight: 'bold' }}>CREATE</span>;
      case 'UPDATE': return <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>UPDATE</span>;
      case 'DELETE': return <span style={{ color: '#ef4444', fontWeight: 'bold' }}>DELETE</span>;
      case 'MAIL_SENT': return <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>MAIL</span>;
      default: return <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{action}</span>;
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1><FaShoePrints /> Digital Footprints</h1>
            <p>Audit log of admin actions (Logs vanish after 1 week)</p>
          </div>
          <button 
            onClick={fetchFootprints} 
            disabled={loading}
            className="action-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FaHistory className={loading ? 'spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh Logs'}
          </button>
        </div>

        {error && <div className="admin-alert error">{error}</div>}

        <div className="admin-section">
          {loading ? (
            <div className="admin-loading"><FaSpinner className="spin" /> Loading footprints...</div>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Admin Name</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {footprints.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                        <FaHistory style={{ fontSize: '2rem', color: '#555', marginBottom: '1rem' }} />
                        <div>No recent admin actions found.</div>
                      </td>
                    </tr>
                  ) : (
                    footprints.map(log => (
                      <tr key={log._id}>
                        <td style={{ whiteSpace: 'nowrap', color: '#9ca3af' }}>
                          {new Date(log.createdAt).toLocaleString('en-IN')}
                        </td>
                        <td style={{ fontWeight: '500', color: '#e5e7eb' }}>{log.userName}</td>
                        <td>{getActionBadge(log.action)}</td>
                        <td style={{ color: '#9ca3af' }}>{log.resource}</td>
                        <td>{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminFootprints;
