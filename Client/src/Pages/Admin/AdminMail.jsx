import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import { FaEnvelope, FaPaperPlane, FaSpinner } from 'react-icons/fa';
import './AdminDashboard.css';

const AdminMail = () => {
  const [targetRole, setTargetRole] = useState('all');
  const [endorsementType, setEndorsementType] = useState('custom');
  const [endorsementId, setEndorsementId] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [customLink, setCustomLink] = useState('');
  const [selectedFailedIds, setSelectedFailedIds] = useState([]);
  const [customEmails, setCustomEmails] = useState([]);
  const [scheduleType, setScheduleType] = useState('smart_batch');
  const [csvFileName, setCsvFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [fetchingData, setFetchingData] = useState(false);
  const [mailStats, setMailStats] = useState({ stats: { pending: 0, processing: 0, failed: 0 }, recentLogs: [] });

  const fetchMailStats = async () => {
    try {
      const res = await api.get('/mail/stats');
      if (res.data?.data) {
        setMailStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load mail stats');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setFetchingData(true);
      try {
        const [annRes, evtRes] = await Promise.all([
          api.get('/announcements'),
          api.get('/events')
        ]);
        setAnnouncements(annRes.data.data.announcements || []);
        setEvents(evtRes.data.data.events || []);
      } catch (error) {
        showToast('Failed to load events and announcements', 'error');
      } finally {
        setFetchingData(false);
      }
    };
    fetchData();
    fetchMailStats();
  }, []);

  const handleSendMail = async (e) => {
    e.preventDefault();
    
    if (endorsementType === 'custom' && (!customSubject || !customBody)) {
      showToast('Please enter a subject and body for the custom email.', 'error');
      return;
    }

    if (targetRole === 'custom_csv' && customEmails.length === 0) {
      showToast('Please upload a valid CSV file containing emails.', 'error');
      return;
    }

    if (endorsementType !== 'custom' && !endorsementId) {
      showToast('Please select an item to endorse.', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        targetRole,
        endorsementType: endorsementType === 'custom' ? null : endorsementType,
        endorsementId: endorsementType === 'custom' ? null : endorsementId,
        customSubject,
        customBody,
        customLink,
        customEmails,
        scheduleType
      };
      
      const res = await api.post('/mail/send', payload);
      showToast(`Email dispatch started! Targeted users: ${res.data.data.targeted}`);
      
      // Reset form on success
      setCustomSubject('');
      setCustomBody('');
      setCustomLink('');
      setEndorsementId('');
      setCustomEmails([]);
      setCsvFileName('');

      // Refresh dispatch stats & logs
      fetchMailStats();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to send email', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCsvFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const emails = text.split(/[\n,;]+/)
          .map(e => e.trim().replace(/^["']|["']$/g, ''))
          .filter(e => e && e.includes('@'));
        const uniqueEmails = [...new Set(emails)];
        setCustomEmails(uniqueEmails);
        if (uniqueEmails.length === 0) {
          showToast('No valid emails found in the CSV file.', 'error');
        } else {
          showToast(`Found ${uniqueEmails.length} valid email(s) in CSV.`, 'success');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleToggleSelectFailed = (id) => {
    setSelectedFailedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllFailed = () => {
    if (!mailStats.failedEmails) return;
    if (selectedFailedIds.length === mailStats.failedEmails.length) {
      setSelectedFailedIds([]);
    } else {
      setSelectedFailedIds(mailStats.failedEmails.map(f => f.id));
    }
  };

  const handleRetryFailed = async (ids = null) => {
    try {
      const payload = ids ? { ids: Array.isArray(ids) ? ids : [ids] } : (selectedFailedIds.length > 0 ? { ids: selectedFailedIds } : {});
      const res = await api.post('/mail/retry-failed', payload);
      showToast(res.data.message || 'Retry initiated!');
      setSelectedFailedIds([]);
      fetchMailStats();
    } catch (err) {
      showToast('Failed to trigger retry', 'error');
    }
  };

  const handleDeleteFailed = async (ids = null, all = false) => {
    try {
      let payload = {};
      if (all) {
        payload = { all: true };
      } else if (ids) {
        payload = { ids: Array.isArray(ids) ? ids : [ids] };
      } else {
        if (selectedFailedIds.length === 0) {
          showToast('Please select items to delete', 'error');
          return;
        }
        payload = { ids: selectedFailedIds };
      }

      const res = await api.post('/mail/delete-failed', payload);
      showToast(res.data.message || 'Deleted successfully!');
      setSelectedFailedIds([]);
      fetchMailStats();
    } catch (err) {
      showToast('Failed to delete logs', 'error');
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      
      <main className="admin-main">
        <div className="admin-header">
          <h1><FaEnvelope /> Mail Dispatch & Notification Portal</h1>
          <p>Send announcement updates, event endorsements, and custom emails directly to community members.</p>
        </div>

        {/* Live Mail Status Counters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', padding: '16px 20px', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px' }}>Pending Queue</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>{mailStats.stats?.pending || 0}</div>
          </div>

          <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', padding: '16px 20px', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px' }}>Sending / In-Flight</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3b82f6', marginTop: '4px' }}>{mailStats.stats?.processing || 0}</div>
          </div>

          <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', padding: '16px 20px', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px' }}>Failed Attempts</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>{mailStats.stats?.failed || 0}</div>
          </div>
        </div>

        <div className="admin-section card-style">
          <form onSubmit={handleSendMail} className="mail-form">
            
            <div className="form-group">
              <label>Target Audience</label>
              <select 
                value={targetRole} 
                onChange={(e) => setTargetRole(e.target.value)}
                className="form-control"
              >
                <option value="all">All Registered Users</option>
                <option value="super-admin">Super Admins Only</option>
                <option value="event-lead">Event Leads Only</option>
                <option value="media-lead">Media Leads Only</option>
                <option value="member">Members Only</option>
                <option value="custom_csv">Custom (Upload CSV)</option>
              </select>
            </div>

            {targetRole === 'custom_csv' && (
              <div className="form-group">
                <label>Upload CSV File containing emails</label>
                <input 
                  type="file" 
                  accept=".csv, .txt" 
                  onChange={handleCsvUpload} 
                  className="form-control"
                />
                {csvFileName && <small style={{ color: '#ff1f01', marginTop: '4px', display: 'block' }}>Loaded: {csvFileName} ({customEmails.length} email(s))</small>}
              </div>
            )}

            <div className="form-group">
              <label>Delivery Schedule</label>
              <div style={{ background: '#1c1c20', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 16px', color: '#ff1f01', fontSize: '0.9rem', fontWeight: 600 }}>
              🛡️ Smart Rate-Limited Batch Enforced (1 email per minute)
              </div>
            </div>

            <div className="form-group">
              <label>Mail Mode / Content Type</label>
              <select 
                value={endorsementType} 
                onChange={(e) => setEndorsementType(e.target.value)}
                className="form-control"
              >
                <option value="custom">Custom Email Message</option>
                <option value="announcement">Endorse Existing Announcement</option>
                <option value="event">Endorse Active Event</option>
              </select>
            </div>

            {endorsementType !== 'custom' && (
              <>
                <div className="form-group">
                  <label>Select {endorsementType === 'announcement' ? 'Announcement' : 'Event'} to Endorse</label>
                  <select 
                    value={endorsementId} 
                    onChange={(e) => setEndorsementId(e.target.value)}
                    className="form-control"
                  >
                    <option value="">-- Select Item --</option>
                    {endorsementType === 'announcement' ? (
                      announcements.map(a => (
                        <option key={a._id} value={a._id}>{a.title}</option>
                      ))
                    ) : (
                      events.map(e => (
                        <option key={e._id} value={e._id}>{e.title}</option>
                      ))
                    )}
                  </select>
                </div>

                {endorsementType === 'event' && (
                  <div className="form-group">
                    <label>Registration / Custom Link (Vercel Link, etc. - Optional)</label>
                    <input 
                      type="text" 
                      value={customLink} 
                      onChange={(e) => setCustomLink(e.target.value)}
                      className="form-control"
                      placeholder="e.g. https://your-project.vercel.app/register"
                    />
                  </div>
                )}
              </>
            )}

            {endorsementType === 'custom' && (
              <>
                <div className="form-group">
                  <label>Subject</label>
                  <input 
                    type="text" 
                    value={customSubject} 
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="form-control"
                    placeholder="Enter email subject"
                  />
                </div>
                <div className="form-group">
                  <label>Body</label>
                  <textarea 
                    value={customBody} 
                    onChange={(e) => setCustomBody(e.target.value)}
                    className="form-control"
                    placeholder="Enter email message body"
                    rows="6"
                  ></textarea>
                </div>
              </>
            )}

            <button type="submit" className="admin-btn primary" disabled={loading}>
              {loading ? <><FaSpinner className="spin" /> Sending...</> : <><FaPaperPlane /> Send Email</>}
            </button>
            
          </form>
        </div>

        {/* Failed Emails Breakdown Section */}
        {mailStats.failedEmails && mailStats.failedEmails.length > 0 && (
          <div className="admin-section card-style" style={{ marginTop: '28px', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ fontSize: '1.2rem', margin: 0, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⚠️ Failed Email Deliveries ({mailStats.failedEmails.length})
              </h2>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {selectedFailedIds.length > 0 && (
                  <>
                    <button 
                      onClick={() => handleRetryFailed(selectedFailedIds)}
                      style={{ background: '#3b82f6', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                    >
                      🔄 Retry Selected ({selectedFailedIds.length})
                    </button>
                    <button 
                      onClick={() => handleDeleteFailed(selectedFailedIds)}
                      style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                    >
                      🗑️ Delete Selected ({selectedFailedIds.length})
                    </button>
                  </>
                )}

                <button 
                  onClick={() => handleRetryFailed(null)}
                  style={{ background: '#22c55e', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  🔄 Retry All
                </button>
                <button 
                  onClick={() => handleDeleteFailed(null, true)}
                  style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#f87171', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  🗑️ Clear All Failed
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#888' }}>
                    <th style={{ padding: '10px', width: '38px', textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={mailStats.failedEmails.length > 0 && selectedFailedIds.length === mailStats.failedEmails.length}
                        onChange={handleToggleSelectAllFailed}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th style={{ padding: '10px' }}>Recipient Email</th>
                    <th style={{ padding: '10px' }}>Subject</th>
                    <th style={{ padding: '10px' }}>Failure Reason / Error Log</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Attempts</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Time</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mailStats.failedEmails.map((failed) => (
                    <tr 
                      key={failed.id} 
                      style={{ 
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        background: selectedFailedIds.includes(failed.id) ? 'rgba(239, 68, 68, 0.1)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedFailedIds.includes(failed.id)}
                          onChange={() => handleToggleSelectFailed(failed.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '10px', color: '#fff', fontWeight: 600 }}>{failed.to}</td>
                      <td style={{ padding: '10px', color: '#ccc' }}>{failed.subject}</td>
                      <td style={{ padding: '10px', color: '#ef4444', fontFamily: 'monospace', fontSize: '0.8rem', maxWidth: '300px', wordBreak: 'break-word' }}>{failed.error}</td>
                      <td style={{ padding: '10px', textAlign: 'center', color: '#f59e0b' }}>{failed.attempts}</td>
                      <td style={{ padding: '10px', color: '#888', textAlign: 'center', fontSize: '0.78rem' }}>
                        {new Date(failed.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => handleRetryFailed(failed.id)}
                          title="Retry this email"
                          style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#60a5fa', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', marginRight: '6px' }}
                        >
                          🔄 Retry
                        </button>
                        <button
                          onClick={() => handleDeleteFailed(failed.id)}
                          title="Delete this log"
                          style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#f87171', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Dispatch Footprint Logs Section */}
        <div className="admin-section card-style" style={{ marginTop: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📜 Recent Mail Dispatch Logs
            </h2>
            <button onClick={fetchMailStats} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#ccc', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
              Refresh Logs
            </button>
          </div>

          {mailStats.recentLogs && mailStats.recentLogs.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#888' }}>
                    <th style={{ padding: '10px' }}>Sender</th>
                    <th style={{ padding: '10px' }}>Dispatch Details</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {mailStats.recentLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 10px', color: '#ff3318', fontWeight: 600 }}>{log.userName}</td>
                      <td style={{ padding: '12px 10px', color: '#ddd' }}>{log.details}</td>
                      <td style={{ padding: '12px 10px', color: '#888', textAlign: 'right', fontSize: '0.8rem' }}>
                        {new Date(log.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ color: '#888', padding: '16px 0', fontSize: '0.9rem' }}>No recent mail dispatches logged.</div>
          )}
        </div>

      </main>
      
      {toast && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
};

export default AdminMail;
