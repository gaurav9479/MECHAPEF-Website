import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import { FaEnvelope, FaTrash, FaCheckCircle, FaEye, FaSearch, FaEnvelopeOpen } from 'react-icons/fa';
import api from '../../services/api';
import './AdminDashboard.css';

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unseenCount, setUnseenCount] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'unread', 'read'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const isReadParam = filterStatus === 'unread' ? 'false' : filterStatus === 'read' ? 'true' : undefined;
      const res = await api.get('/contact/messages', {
        params: { limit: 100, isRead: isReadParam }
      });

      setMessages(res.data.data?.messages || []);
      setUnseenCount(res.data.data?.unseenCount || 0);
    } catch (err) {
      showToast('Failed to load messages', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [filterStatus]);

  const handleOpenDetails = async (msg) => {
    setSelectedMessage(msg);
    setShowModal(true);


    if (!msg.isRead) {
      try {
        const res = await api.patch(`/contact/messages/${msg._id}/read`, { isRead: true });
        setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, isRead: true } : m));
        setUnseenCount(res.data.data?.unseenCount || Math.max(0, unseenCount - 1));
      } catch (err) {
        console.error('Failed to mark message read', err);
      }
    }
  };

  const handleToggleRead = async (msg, e) => {
    e?.stopPropagation();
    try {
      const newStatus = !msg.isRead;
      const res = await api.patch(`/contact/messages/${msg._id}/read`, { isRead: newStatus });
      setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, isRead: newStatus } : m));
      setUnseenCount(res.data.data?.unseenCount || 0);
      showToast(`Marked as ${newStatus ? 'read' : 'unread'}`);
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      const res = await api.delete(`/contact/messages/${id}`);
      setMessages(prev => prev.filter(m => m._id !== id));
      setUnseenCount(res.data.data?.unseenCount || 0);
      if (selectedMessage?._id === id) setShowModal(false);
      showToast('Message deleted');
    } catch (err) {
      showToast('Failed to delete message', 'error');
    }
  };

  const filteredMessages = messages.filter(msg => {
    const q = searchQuery.toLowerCase();
    return (
      msg.name?.toLowerCase().includes(q) ||
      msg.email?.toLowerCase().includes(q) ||
      msg.message?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="admin-layout">
      <AdminSidebar />
      
      <main className="admin-main">
        <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0, fontSize: '1.8rem' }}>
              <FaEnvelope style={{ color: '#ff1f01' }} /> Get In Touch Messages
              {unseenCount > 0 && (
                <span style={{ 
                  backgroundColor: '#ffcc00', 
                  color: '#000', 
                  fontSize: '0.8rem', 
                  fontWeight: 'bold', 
                  padding: '3px 10px', 
                  borderRadius: '12px',
                  boxShadow: '0 0 10px rgba(255, 204, 0, 0.4)' 
                }}>
                  {unseenCount} Unseen
                </span>
              )}
            </h1>
            <p style={{ color: '#888', marginTop: '6px', fontSize: '0.9rem' }}>Website contact form submissions & user enquiries</p>
          </div>

          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div className="admin-search-box" style={{ position: 'relative' }}>
              <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
              <input 
                type="text" 
                placeholder="Search messages..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '35px', background: '#111', color: '#fff', border: '1px solid #333', borderRadius: '8px', padding: '10px 14px 10px 38px', fontSize: '0.9rem' }}
              />
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
          <button 
            className={`btn-secondary ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
            style={{ backgroundColor: filterStatus === 'all' ? '#ff1f01' : '#222', color: '#fff', border: 'none' }}
          >
            All Messages
          </button>
          <button 
            className={`btn-secondary ${filterStatus === 'unread' ? 'active' : ''}`}
            onClick={() => setFilterStatus('unread')}
            style={{ backgroundColor: filterStatus === 'unread' ? '#ffcc00' : '#222', color: filterStatus === 'unread' ? '#000' : '#fff', border: 'none', fontWeight: 'bold' }}
          >
            🟡 Unseen {unseenCount > 0 && `(${unseenCount})`}
          </button>
          <button 
            className={`btn-secondary ${filterStatus === 'read' ? 'active' : ''}`}
            onClick={() => setFilterStatus('read')}
            style={{ backgroundColor: filterStatus === 'read' ? '#00c864' : '#222', color: '#fff', border: 'none' }}
          >
            🟢 Read
          </button>
        </div>

        {/* Messages Table */}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Sender Name</th>
                <th>Email</th>
                <th>Message Preview</th>
                <th>Received Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#555', padding: '30px' }}>Loading messages...</td></tr>
              ) : filteredMessages.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#555', padding: '30px' }}>No messages found.</td></tr>
              ) : filteredMessages.map(msg => (
                <tr 
                  key={msg._id} 
                  onClick={() => handleOpenDetails(msg)}
                  style={{ 
                    cursor: 'pointer',
                    backgroundColor: !msg.isRead ? 'rgba(255, 204, 0, 0.05)' : 'transparent',
                    fontWeight: !msg.isRead ? 'bold' : 'normal' 
                  }}
                >
                  <td>
                    {!msg.isRead ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#ffcc00', fontSize: '0.85rem' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ffcc00', boxShadow: '0 0 8px #ffcc00' }} />
                        Unseen
                      </span>
                    ) : (
                      <span style={{ color: '#00c864', fontSize: '0.85rem' }}>
                        <FaCheckCircle style={{ marginRight: '4px' }} /> Read
                      </span>
                    )}
                  </td>
                  <td style={{ color: '#fff' }}>{msg.name}</td>
                  <td style={{ color: '#aaa' }}>{msg.email}</td>
                  <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#ddd' }}>
                    {msg.message}
                  </td>
                  <td style={{ color: '#888', fontSize: '0.85rem' }}>
                    {new Date(msg.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        onClick={() => handleOpenDetails(msg)}
                        title="View Full Message"
                      >
                        <FaEye /> View
                      </button>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '6px 10px', fontSize: '0.8rem', backgroundColor: msg.isRead ? '#333' : '#ffcc00', color: msg.isRead ? '#fff' : '#000' }}
                        onClick={(e) => handleToggleRead(msg, e)}
                        title={msg.isRead ? 'Mark as Unread' : 'Mark as Read'}
                      >
                        {msg.isRead ? <FaEnvelope /> : <FaEnvelopeOpen />}
                      </button>
                      <button 
                        className="btn-danger" 
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        onClick={(e) => handleDelete(msg._id, e)}
                        title="Delete Message"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Message View Modal */}
      {showModal && selectedMessage && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaEnvelope style={{ color: '#ff1f01' }} /> Message Details
              </h2>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Close</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ backgroundColor: '#111', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
                <p style={{ margin: '0 0 8px 0' }}><strong>Sender Name:</strong> {selectedMessage.name}</p>
                <p style={{ margin: '0 0 8px 0' }}><strong>Email:</strong> <a href={`mailto:${selectedMessage.email}`} style={{ color: '#00ccff' }}>{selectedMessage.email}</a></p>
                <p style={{ margin: 0 }}><strong>Date Received:</strong> {new Date(selectedMessage.createdAt).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'medium' })}</p>
              </div>

              <div style={{ backgroundColor: '#151515', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
                <h4 style={{ color: '#ff1f01', marginTop: 0, marginBottom: '10px' }}>Message Body:</h4>
                <p style={{ color: '#eee', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '1rem', margin: 0 }}>
                  {selectedMessage.message}
                </p>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '25px', display: 'flex', justifyContent: 'space-between' }}>
              <button 
                className="btn-danger" 
                onClick={(e) => handleDelete(selectedMessage._id, e)}
              >
                <FaTrash style={{ marginRight: '6px' }} /> Delete Message
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <a 
                  href={`mailto:${selectedMessage.email}?subject=Reply to your inquiry - MechaPEF`}
                  className="btn-primary"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <FaEnvelope /> Reply via Email
                </a>
                <button 
                  className="btn-secondary"
                  onClick={(e) => handleToggleRead(selectedMessage, e)}
                >
                  {selectedMessage.isRead ? 'Mark as Unread' : 'Mark as Read'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
};

export default AdminMessages;
