import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { eventService } from '../../services/services';
import api from '../../services/api';
import './EventDetails.css';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Form State
  const [regType, setRegType] = useState('Solo');
  const [teamName, setTeamName] = useState('');
  const [customData, setCustomData] = useState({});
  const [fileUploading, setFileUploading] = useState({});

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchEvent = async () => {
      try {
        const res = await eventService.getById(id);
        setEvent(res.data.data.event);
        
        // Initialize customData state based on customFormFields
        const initialData = {};
        if (res.data.data.event.customFormFields) {
          res.data.data.event.customFormFields.forEach(field => {
            initialData[field.fieldName] = field.fieldType === 'checkbox' ? false : '';
          });
        }
        setCustomData(initialData);
      } catch (err) {
        showToast('Failed to load event details', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleRegisterClick = () => {
    if (!user) {
      showToast('Please login to register', 'error');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    setShowModal(true);
  };

  const handleCustomFieldChange = (fieldName, value) => {
    setCustomData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    setFileUploading(prev => ({...prev, [fieldName]: true}));
    try {
      const res = await api.post('/upload/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Store both url and fileId so we can delete the file later
      handleCustomFieldChange(fieldName, {
        url: res.data.data.url,
        fileId: res.data.data.fileId
      });
      showToast('File uploaded successfully!');
    } catch (err) {
      showToast('File upload failed', 'error');
    } finally {
      setFileUploading(prev => ({...prev, [fieldName]: false}));
    }
  };

  const submitRegistration = async (e) => {
    e.preventDefault();
    if (Object.values(fileUploading).some(status => status)) {
      showToast('Please wait for all files to finish uploading', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        registrationType: regType,
        customData
      };
      if (regType === 'Team') {
        payload.teamName = teamName;
        // Simplified team registration assuming individual login for now or 
        // passing current user as the only member if teamMemberIds is required
        payload.teamMemberIds = [user._id]; 
      }

      const res = await eventService.register(id, payload);
      
      if (res.status === 202) {
        showToast(res.data?.message || 'Registration queued. Please check your Profile after 10 mins.', 'success');
      } else {
        showToast('Successfully registered! View your ticket in your Profile.', 'success');
      }
      
      setShowModal(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-page"><Navbar/><div className="loading-text">Loading...</div></div>;
  if (!event) return <div className="loading-page"><Navbar/><div className="loading-text">Event not found</div></div>;

  return (
    <>
      <Navbar />
      <div className="event-details-wrapper">
        <div className="event-header">
          <div className="event-category-tag">{event.category}</div>
          <h1>{event.title}</h1>
          <p className="event-meta">
            📍 {event.venue} &nbsp; | &nbsp; 📅 {new Date(event.startTime).toLocaleDateString()}
          </p>
        </div>

        <div className="event-content">
          <div className="event-main">
            <h3>About the Event</h3>
            <p className="event-description">{event.description}</p>
            
            {event.rules && event.rules.length > 0 && (
              <div className="event-rules">
                <h3>Rules & Guidelines</h3>
                <ul>
                  {event.rules.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}

            {event.prizes && (
              <div className="event-prizes" style={{ marginTop: '30px' }}>
                <h3 style={{ color: '#ff1f01', marginBottom: '15px' }}>🏆 Prizes & Rewards</h3>
                <p style={{ fontSize: '1.1rem', color: '#e5e7eb', background: '#111', padding: '15px', borderLeft: '4px solid #ff1f01', borderRadius: '4px', whiteSpace: 'pre-line' }}>
                  {event.prizes}
                </p>
              </div>
            )}
          </div>
          
          <div className="event-sidebar">
            <div className="event-card-info">
              <h3>Registration</h3>
              <p><strong>Deadline:</strong> {new Date(event.registrationDeadline).toLocaleDateString()}</p>
              <p><strong>Fee:</strong> {event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free'}</p>
              <p><strong>Team Size:</strong> Up to {event.maxTeamSize} members</p>
              
              <button 
                className="primary-btn register-btn" 
                onClick={handleRegisterClick}
                disabled={new Date() > new Date(event.registrationDeadline)}
              >
                {new Date() > new Date(event.registrationDeadline) ? 'Registration Closed' : 'Register Now'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box reg-modal" onClick={e => e.stopPropagation()}>
            <h2>Register for {event.title}</h2>
            <form onSubmit={submitRegistration}>
              
              <div className="reg-user-info">
                <h4>Your Details</h4>
                <p><strong>Name:</strong> {user?.name}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Reg No:</strong> {user?.collegeRegNo || 'N/A'}</p>
                <p style={{fontSize: '0.8rem', color: '#888', marginTop: '5px'}}>* These details will be automatically submitted with your registration.</p>
              </div>

              {event.maxTeamSize > 1 && (
                <div className="form-group" style={{marginTop: '20px'}}>
                  <label>Registration Type</label>
                  <select value={regType} onChange={e => setRegType(e.target.value)}>
                    <option value="Solo">Solo</option>
                    <option value="Team">Team</option>
                  </select>
                </div>
              )}

              {regType === 'Team' && (
                <div className="form-group">
                  <label>Team Name *</label>
                  <input 
                    required 
                    value={teamName} 
                    onChange={e => setTeamName(e.target.value)} 
                    placeholder="Enter team name"
                  />
                </div>
              )}

              {event.customFormFields && event.customFormFields.length > 0 && (
                <div className="custom-fields-section">
                  <h4 style={{ color: '#ff1f01', marginBottom: '15px', marginTop: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                    Additional Information Required
                  </h4>
                  {event.customFormFields.map((field, idx) => (
                    <div className="form-group" key={idx}>
                      <label>{field.fieldName} {field.isRequired && '*'}</label>
                      
                      {field.fieldType === 'text' && (
                        <input 
                          type="text" 
                          required={field.isRequired}
                          value={customData[field.fieldName] || ''}
                          onChange={e => handleCustomFieldChange(field.fieldName, e.target.value)}
                        />
                      )}

                      {field.fieldType === 'textarea' && (
                        <textarea 
                          required={field.isRequired}
                          value={customData[field.fieldName] || ''}
                          onChange={e => handleCustomFieldChange(field.fieldName, e.target.value)}
                        />
                      )}

                      {field.fieldType === 'checkbox' && (
                        <label style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'normal'}}>
                          <input 
                            type="checkbox" 
                            required={field.isRequired}
                            checked={customData[field.fieldName] || false}
                            onChange={e => handleCustomFieldChange(field.fieldName, e.target.checked)}
                            style={{width: 'auto'}}
                          />
                          Yes / I agree
                        </label>
                      )}

                      {field.fieldType === 'file' && (
                        <div>
                          <input 
                            type="file" 
                            required={field.isRequired && !customData[field.fieldName]}
                            onChange={e => handleFileUpload(e, field.fieldName)}
                            accept="image/*,.pdf"
                          />
                          {fileUploading[field.fieldName] && <span style={{color: '#ffaa00', fontSize: '0.8rem'}}>Uploading...</span>}
                          {customData[field.fieldName]?.url && !fileUploading[field.fieldName] && (
                            <span style={{color: '#00c864', fontSize: '0.8rem', marginLeft: '10px'}}>✓ File uploaded</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="modal-actions" style={{marginTop: '30px'}}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting || Object.values(fileUploading).some(status => status)}>
                  {submitting ? 'Submitting...' : 'Submit Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}
      <Footer />
    </>
  );
};

export default EventDetails;
