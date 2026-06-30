import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Navbar from '../../components/Navbar/Navbar';
import TicketModal from './TicketModal';
import { FaTicketAlt } from 'react-icons/fa';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    branch: '',
    yearOfStudy: '',
    phoneNumber: '',
    githubURL: '',
    linkedinURL: '',
    otherLinks: ''
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [registrations, setRegistrations] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const displayRole = (user?.role || '')
    .replace(/-/g, ' ')
    .replace(/generaluser/i, 'general user')
    .toUpperCase();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        branch: user.branch || '',
        yearOfStudy: user.yearOfStudy || '',
        phoneNumber: user.phoneNumber || '',
        githubURL: user.githubURL || '',
        linkedinURL: user.linkedinURL || '',
        otherLinks: user.otherLinks || ''
      });
      fetchRegistrations();
    }
  }, [user]);

  const fetchRegistrations = async () => {
    try {
      const res = await api.get('/registrations/my-registrations');
      setRegistrations(res.data.data.registrations || []);
    } catch (err) {
      console.error('Failed to fetch registrations:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch('/auth/profile', formData);
      setToast({ msg: 'Profile updated successfully!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
      // Wait a moment and maybe reload to fetch fresh user context if needed,
      // but the auth context gets updated on reload anyway.
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      setToast({ msg: error.response?.data?.message || 'Failed to update profile', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="profile-page-container">
        <div className="profile-banner">
          <h2>Complete Your Profile!</h2>
          <p>Add your GitHub, LinkedIn, and other portfolio links to stand out.</p>
        </div>

        <div className="profile-content">
          <div className="profile-main-section">
            <div className="profile-header">
            {user?.profileImage ? (
              <img src={user.profileImage} alt="Profile" className="profile-img-large" />
            ) : (
              <div className="profile-img-placeholder">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="profile-header-info">
              <h1>{user?.name}</h1>
              <p className="profile-role">{displayRole}</p>
              <p className="profile-email">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Branch</label>
              <input type="text" name="branch" value={formData.branch} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Year of Study</label>
              <input type="number" name="yearOfStudy" min="1" max="5" value={formData.yearOfStudy} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
            </div>

            <div className="form-section-title">Professional Links</div>
            
            <div className="form-group">
              <label>GitHub URL</label>
              <input type="url" name="githubURL" placeholder="https://github.com/yourusername" value={formData.githubURL} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>LinkedIn URL</label>
              <input type="url" name="linkedinURL" placeholder="https://linkedin.com/in/yourusername" value={formData.linkedinURL} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Other Links (Portfolio, Twitter, etc.)</label>
              <input type="text" name="otherLinks" placeholder="https://yourportfolio.com" value={formData.otherLinks} onChange={handleChange} />
            </div>

            <button type="submit" className="primary-btn submit-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
          </div>

          <div className="profile-sidebar">
          <div className="registrations-card">
            <h3>My Event Tickets</h3>
            {registrations.length === 0 ? (
              <p className="no-data">You haven't registered for any events yet.</p>
            ) : (
              <div className="registrations-list">
                {registrations.map(reg => (
                  <div key={reg._id} className="registration-item">
                    <div className="reg-info">
                      <h4>{reg.eventId?.title}</h4>
                      <span className={`reg-status ${reg.attendanceMarked ? 'attended' : 'upcoming'}`}>
                        {reg.attendanceMarked ? 'Attended' : 'Registered'}
                      </span>
                    </div>
                    <button 
                      className="btn-secondary ticket-btn"
                      onClick={() => setSelectedTicket(reg)}
                    >
                      <FaTicketAlt /> View Ticket
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
      
      {selectedTicket && (
        <TicketModal 
          registration={selectedTicket} 
          onClose={() => setSelectedTicket(null)} 
        />
      )}

      {toast && (
        <div className={`profile-toast ${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </>
  );
};

export default Profile;
