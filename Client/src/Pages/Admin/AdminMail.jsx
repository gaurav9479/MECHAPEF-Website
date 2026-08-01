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
  const [customEmails, setCustomEmails] = useState([]);
  const [scheduleType, setScheduleType] = useState('immediate');
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
        customEmails,
        scheduleType
      };
      
      const res = await api.post('/mail/send', payload);
      showToast(`Email dispatch started! Targeted users: ${res.data.data.targeted}`);
      
      // Reset form on success
      setCustomSubject('');
      setCustomBody('');
      setEndorsementId('');
      setCustomEmails([]);
      setCsvFileName('');
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
        // Split by newline or comma and extract emails
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

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <h1><FaEnvelope /> Mail Portal</h1>
          <p>Send emails to specific user groups or endorse announcements/events</p>
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
                <label>Upload CSV File (Emails)</label>
                <input 
                  type="file" 
                  accept=".csv,.txt"
                  onChange={handleCsvUpload}
                  className="form-control"
                />
                {csvFileName && <small style={{color: '#ff1f01', marginTop: '5px', display: 'block'}}>Loaded {customEmails.length} email(s) from {csvFileName}</small>}
              </div>
            )}

            <div className="form-group">
              <label>Email Type</label>
              <select 
                value={endorsementType} 
                onChange={(e) => {
                  setEndorsementType(e.target.value);
                  setEndorsementId('');
                }}
                className="form-control"
              >
                <option value="custom">Custom Email</option>
                <option value="announcement">Endorse an Announcement (Notice)</option>
                <option value="event">Endorse an Event</option>
              </select>
            </div>

            <div className="form-group">
              <label>Scheduling Strategy</label>
              <select 
                value={scheduleType} 
                onChange={(e) => setScheduleType(e.target.value)}
                className="form-control"
              >
                <option value="immediate">Send Immediately</option>
                <option value="smart_batch">Smart Batch (100 mails/hour)</option>
              </select>
            </div>

            {endorsementType !== 'custom' && (
              <div className="form-group">
                <label>Select {endorsementType === 'event' ? 'Event' : 'Announcement'}</label>
                <select 
                  value={endorsementId} 
                  onChange={(e) => setEndorsementId(e.target.value)}
                  className="form-control"
                  disabled={fetchingData}
                >
                  <option value="">-- Select --</option>
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
                {fetchingData && <small>Loading data...</small>}
              </div>
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
      </main>
      
      {toast && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
};

export default AdminMail;
