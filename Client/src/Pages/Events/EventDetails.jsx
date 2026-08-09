import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { FaGraduationCap } from 'react-icons/fa';
import { eventService } from '../../services/services';
import api from '../../services/api';
import { Helmet } from 'react-helmet-async';
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
  const [userRegistration, setUserRegistration] = useState(null); // null = not checked, false = not registered, object = registered
  const [timeLeft, setTimeLeft] = useState('');

  // Form State
  const [regType, setRegType] = useState('Solo'); // 'Solo' | 'Team' | 'JoinTeam'
  const [teamName, setTeamName] = useState('');
  const [customData, setCustomData] = useState({});
  const [fileUploading, setFileUploading] = useState({});

  // Type 2 (JoinRequests) specific state
  const [joinTeamRegNo, setJoinTeamRegNo] = useState('');
  const [searchTeamStatus, setSearchTeamStatus] = useState(null); // { type: 'loading'|'error'|'success', msg, team }
  const [submittingJoinReq, setSubmittingJoinReq] = useState(false);
  // For leader's team dashboard in Type 2 (shown after draft created)
  const [draftRegistration, setDraftRegistration] = useState(null);
  const [showDraftDashboard, setShowDraftDashboard] = useState(false);
  const [respondingTo, setRespondingTo] = useState(null);
  // Full join status — covers both sides (leader seeing incoming, member seeing outgoing)
  const [myJoinStatus, setMyJoinStatus] = useState(null); // null=loading, false=none, object=status

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!event || event.isTBD) return;
    
    const calculateTimeLeft = () => {
      const difference = new Date(event.registrationDeadline) - new Date();
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft('Closed');
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [event]);

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

  // Check if user is already registered for this event
  useEffect(() => {
    if (!user) return;
    const checkRegistration = async () => {
      try {
        const res = await api.get(`/events/${id}/my-registration`, {
          // Signal this is a polling/check call — 404 = not registered (expected)
          validateStatus: (status) => status < 500
        });
        if (res.status === 200) {
          setUserRegistration(res.data.data || false);
        } else {
          setUserRegistration(false);
        }
      } catch (err) {
        // Network error etc.
        setUserRegistration(false);
      }
    };
    checkRegistration();

    // Auto open registration modal if user was redirected back after login
    if (sessionStorage.getItem('auto_open_reg') === 'true') {
      sessionStorage.removeItem('auto_open_reg');
      setShowModal(true);
    }
  }, [id, user]);

  // Fetch JoinRequests event status (Type 2) — covers both leader and member side
  useEffect(() => {
    if (!user || !event || event.registrationMode !== 'JoinRequests') return;
    const fetchJoinStatus = async () => {
      try {
        const res = await api.get(`/events/${id}/my-join-status`, {
          validateStatus: (status) => status < 500
        });
        if (res.status === 200) {
          setMyJoinStatus(res.data.data);
          // If user is leader, pre-populate the draft registration for the dashboard
          if (res.data.data?.role === 'leader') {
            setDraftRegistration(res.data.data.registration);
          }
        } else {
          setMyJoinStatus(false);
        }
      } catch {
        setMyJoinStatus(false);
      }
    };
    fetchJoinStatus();
  }, [id, user, event]);


  const handleRegisterClick = () => {
    if (!user) {
      showToast('Please login to register', 'error');
      sessionStorage.setItem('redirect_after_login', window.location.pathname + window.location.search);
      sessionStorage.setItem('auto_open_reg', 'true');
      setTimeout(() => navigate('/login', { state: { from: { pathname: window.location.pathname, search: window.location.search } } }), 1200);
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

  // ── TYPE 2 helpers ───────────────────────────────────────────

  /** Leader creates a Draft team (Type 2 only) */
  const handleCreateDraftTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) return showToast('Team name is required', 'error');
    setSubmitting(true);
    try {
      const res = await api.post(`/events/${id}/register-draft`, { teamName });
      const reg = res.data?.data?.registration;
      setDraftRegistration(reg);
      setShowDraftDashboard(true);
      setShowModal(false);
      showToast('Draft team created! Manage it from this page.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create draft team', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  /** Member searches for a team by leader regNo (Type 2 only) */
  const handleSearchTeam = async (regNoOverride) => {
    const regNo = regNoOverride || joinTeamRegNo;
    if (!regNo.trim()) return;
    setSearchTeamStatus({ type: 'loading' });
    try {
      const res = await api.get(`/events/${id}/teams`, { params: { regNo: regNo.trim() }, bypassCache: true });
      const teams = res.data?.data || [];
      if (teams.length === 0) {
        setSearchTeamStatus({ type: 'error', msg: 'No open team found with that Reg No. Make sure the leader has created a Draft team.' });
      } else {
        setSearchTeamStatus({ type: 'success', team: teams[0] });
      }
    } catch (err) {
      setSearchTeamStatus({ type: 'error', msg: err.response?.data?.message || 'Search failed' });
    }
  };

  /** Member sends a join request to a found team */
  const handleSendJoinRequest = async (teamRegId) => {
    setSubmittingJoinReq(true);
    try {
      await api.post(`/registrations/${teamRegId}/send-join-request`);
      showToast('Join request sent! Wait for the leader to accept.', 'success');
      setSearchTeamStatus(null);
      setJoinTeamRegNo('');
      setShowModal(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send join request', 'error');
    } finally {
      setSubmittingJoinReq(false);
    }
  };

  /** Leader loads their draft registration dashboard */
  const handleLoadDraftDashboard = async () => {
    try {
      const res = await api.get(`/events/${id}/my-team-registration`, { bypassCache: true });
      setDraftRegistration(res.data?.data);
      setShowDraftDashboard(true);
    } catch (err) {
      showToast('Could not load your team dashboard', 'error');
    }
  };

  /** Leader responds to a join request */
  const handleRespondJoinRequest = async (requesterId, action) => {
    if (!draftRegistration) return;
    setRespondingTo(requesterId);
    try {
      await api.post(`/registrations/${draftRegistration._id}/respond-join`, { requesterId, action });
      showToast(`Join request ${action}ed!`, 'success');
      await handleLoadDraftDashboard(); // refresh
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to respond', 'error');
    } finally {
      setRespondingTo(null);
    }
  };

  /** Leader finalizes Draft → Confirmed */
  const handleFinalizeRegistration = async () => {
    if (!draftRegistration) return;
    setSubmitting(true);
    try {
      await api.post(`/registrations/${draftRegistration._id}/finalize`, { customData });
      showToast('🎉 Registration finalized! Your team is officially registered.', 'success');
      setShowDraftDashboard(false);
      setDraftRegistration(null);
      setUserRegistration({ registrationStatus: 'Confirmed' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to finalize', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{event.title} | MechaPEF MNNIT</title>
        <meta name="description" content={event.description.substring(0, 150) + (event.description.length > 150 ? '...' : '')} />
        <meta property="og:title" content={`${event.title} | MechaPEF MNNIT`} />
        <meta property="og:description" content={event.description.substring(0, 150) + (event.description.length > 150 ? '...' : '')} />
      </Helmet>
      <Navbar />
      <div className="event-details-wrapper">
        <div className="event-content-split">
          
          {/* Left Column: 1:1 Poster */}
          <div className="event-poster-container">
            {event.bannerURL ? (
              <img src={event.bannerURL} alt={event.title} className="event-poster-image" />
            ) : (
              <div className="event-poster-placeholder">
                <h2>{event.title.substring(0, 2).toUpperCase()}</h2>
              </div>
            )}
          </div>

          {/* Right Column: Info & Actions */}
          <div className="event-info-container">
            <div className="event-header">
              <div className="event-category-tag">{event.category}</div>
              <h1>{event.title}</h1>
              <div className="event-meta-pills">
                <span className="meta-pill">📍 {event.isTBD && event.venue.toLowerCase() === 'tbd' ? 'To Be Decided' : event.venue}</span>
                <span className="meta-pill">📅 {event.isTBD ? 'To Be Decided' : new Date(event.startTime).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="event-main">
              <h3>About the Event</h3>
              <p className="event-description">{event.description}</p>
              
              <div className="event-meta-item">
                <FaGraduationCap className="meta-icon" />
                <div className="meta-content">
                  <span className="meta-label">Eligible Branches</span>
                  <div className="tags-container">
                    {event.eligibleBranches?.length > 0 
                      ? event.eligibleBranches.map((b, i) => <span key={i} className="cute-tag">{b}</span>)
                      : <span className="cute-tag">All Branches</span>}
                  </div>
                </div>
              </div>

              <div className="event-meta-item">
                <FaGraduationCap className="meta-icon" />
                <div className="meta-content">
                  <span className="meta-label">Eligible Years</span>
                  <div className="tags-container">
                    {event.eligibleYears?.length > 0 
                      ? event.eligibleYears.map((y, i) => <span key={i} className="cute-tag">{y === 5 ? 'Alumni' : `${y}${['st','nd','rd','th'][Math.min(y-1, 3)]} Year`}</span>)
                      : <span className="cute-tag">All Years</span>}
                  </div>
                </div>
              </div>

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

            {/* Registration Card merged into Right Column */}
            {!event.isTBD && (
              <div className="event-card-info">
                 {event.registrationStartDate && (
                  <p><strong>Starts:</strong> {new Date(event.registrationStartDate).toLocaleString()}</p>
                )}
                <p><strong>Deadline:</strong> {new Date(event.registrationDeadline).toLocaleDateString()}</p>
                <p><strong>Fee:</strong> {event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free'}</p>
                <p><strong>Team Size:</strong> Up to {event.maxTeamSize} members</p>
                
                {(() => {
                  const isNotStarted = event.registrationStartDate && new Date() < new Date(event.registrationStartDate);
                  const isClosed = new Date() > new Date(event.registrationDeadline);
                  const hasDraft = myJoinStatus?.role === 'leader';
                  const isRequester = myJoinStatus?.role === 'requester';
                  const isMember = myJoinStatus?.role === 'member';
                  const isDisabled = !!userRegistration || isClosed || event.isTBD || isNotStarted || hasDraft || isRequester || isMember;
                  return (
                    <>
                      <button
                        className="primary-btn register-btn"
                        onClick={hasDraft ? handleLoadDraftDashboard : handleRegisterClick}
                        disabled={isDisabled && !hasDraft}
                      >
                        {userRegistration
                          ? userRegistration.attended
                            ? '✅ Attended'
                            : '✔ Registered'
                          : hasDraft
                          ? '🏆 View My Team Dashboard'
                          : isMember
                          ? '✔ Team Member'
                          : isRequester
                          ? '📨 Join Request Pending'
                          : isNotStarted
                          ? 'Registration Opens Soon'
                          : isClosed
                          ? 'Registration Closed'
                          : event.isTBD
                          ? 'Coming Soon'
                          : 'Register Now'
                        }
                      </button>
                      {timeLeft && timeLeft !== 'Closed' && !userRegistration && !isNotStarted && !hasDraft && !isRequester && !isMember && (
                        <div className="registration-countdown" style={{marginTop: '15px', textAlign: 'center', color: '#ff1f01', fontWeight: 'bold', background: 'rgba(255, 31, 1, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 31, 1, 0.2)'}}>
                          ⏳ Closes in: {timeLeft}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* ── TYPE 2: Join Activity Panel ────────────────── */}
              {event.registrationMode === 'JoinRequests' && user && myJoinStatus && (
                <div style={{marginTop: '20px', borderTop: '1px solid #222', paddingTop: '16px'}}>

                  {/* LEADER: show incoming requests summary */}
                  {myJoinStatus.role === 'leader' && myJoinStatus.registration && (
                    <div style={{background: 'rgba(0,200,100,0.07)', border: '1px solid rgba(0,200,100,0.2)', borderRadius: '10px', padding: '14px'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                        <h4 style={{color: '#00c864', margin: 0, fontSize: '0.95rem'}}>👑 Your Draft Team: <span style={{color: '#fff'}}>{myJoinStatus.registration.teamName}</span></h4>
                        <button className="btn-secondary" style={{padding: '4px 10px', fontSize: '0.75rem'}} onClick={handleLoadDraftDashboard}>Manage →</button>
                      </div>
                      <p style={{color: '#aaa', fontSize: '0.82rem', margin: '4px 0'}}>
                        Members: <strong style={{color: '#fff'}}>{(myJoinStatus.registration.teamMembers?.filter(m => m.status === 'Confirmed').length || 0) + 1}</strong> / {event.maxTeamSize}
                      </p>
                      {(() => {
                        const pending = myJoinStatus.registration.joinRequests?.filter(r => r.status === 'Pending') || [];
                        return pending.length > 0 ? (
                          <div style={{marginTop: '10px'}}>
                            <p style={{color: '#ffaa00', fontSize: '0.82rem', marginBottom: '6px'}}>⏳ {pending.length} pending join request{pending.length > 1 ? 's' : ''}:</p>
                            {pending.map((r, i) => (
                              <div key={i} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', borderRadius: '6px', padding: '6px 10px', marginBottom: '5px'}}>
                                <span style={{fontSize: '0.82rem'}}><strong>{r.name}</strong> <span style={{color: '#666'}}>{r.collegeRegNo}</span></span>
                                <div style={{display: 'flex', gap: '6px'}}>
                                  <button
                                    style={{padding: '3px 10px', background: '#00c864', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem'}}
                                    disabled={respondingTo === r.userId}
                                    onClick={() => handleRespondJoinRequest(r.userId, 'Accept')}
                                  >✓ Accept</button>
                                  <button
                                    style={{padding: '3px 10px', background: '#ff3333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem'}}
                                    disabled={respondingTo === r.userId}
                                    onClick={() => handleRespondJoinRequest(r.userId, 'Reject')}
                                  >✗ Reject</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{color: '#555', fontSize: '0.82rem', marginTop: '6px'}}>No pending join requests yet. Share your Reg No: <strong style={{color: '#00c864'}}>{user?.collegeRegNo}</strong></p>
                        );
                      })()}
                    </div>
                  )}

                  {/* CONFIRMED MEMBER: show which team they joined */}
                  {myJoinStatus.role === 'member' && myJoinStatus.registration && (
                    <div style={{background: 'rgba(0,200,100,0.07)', border: '1px solid rgba(0,200,100,0.2)', borderRadius: '10px', padding: '14px'}}>
                      <h4 style={{color: '#00c864', margin: '0 0 8px', fontSize: '0.95rem'}}>✅ You're in a Team!</h4>
                      <p style={{color: '#aaa', fontSize: '0.82rem', margin: '4px 0'}}>Team: <strong style={{color: '#fff'}}>{myJoinStatus.registration.teamName}</strong></p>
                      <p style={{color: '#aaa', fontSize: '0.82rem', margin: '4px 0'}}>Leader: <strong style={{color: '#fff'}}>{myJoinStatus.registration.registeredBy?.name}</strong> ({myJoinStatus.registration.registeredBy?.collegeRegNo})</p>
                      <p style={{color: '#aaa', fontSize: '0.82rem', margin: '4px 0'}}>
                        Status: <strong style={{color: myJoinStatus.registration.registrationStatus === 'Confirmed' ? '#00c864' : '#ffaa00'}}>
                          {myJoinStatus.registration.registrationStatus === 'Confirmed' ? '✅ Registration Finalized' : '⏳ Draft — Waiting for leader to finalize'}
                        </strong>
                      </p>
                    </div>
                  )}

                  {/* REQUESTER: show outgoing join requests */}
                  {myJoinStatus.role === 'requester' && myJoinStatus.requests?.length > 0 && (
                    <div style={{background: 'rgba(255,170,0,0.07)', border: '1px solid rgba(255,170,0,0.25)', borderRadius: '10px', padding: '14px'}}>
                      <h4 style={{color: '#ffaa00', margin: '0 0 10px', fontSize: '0.95rem'}}>📨 Your Join Request{myJoinStatus.requests.length > 1 ? 's' : ''}</h4>
                      {myJoinStatus.requests.map((req, i) => (
                        <div key={i} style={{background: '#111', borderRadius: '8px', padding: '10px 12px', marginBottom: i < myJoinStatus.requests.length - 1 ? '8px' : 0}}>
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <div>
                              <p style={{margin: '0 0 3px', fontWeight: 'bold', fontSize: '0.9rem'}}>{req.teamName}</p>
                              <p style={{margin: 0, color: '#aaa', fontSize: '0.8rem'}}>Leader: {req.leaderName} · {req.currentSize}/{event.maxTeamSize} members</p>
                            </div>
                            <span style={{
                              padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold',
                              background: req.requestStatus === 'Pending' ? 'rgba(255,170,0,0.15)' : req.requestStatus === 'Accepted' ? 'rgba(0,200,100,0.15)' : 'rgba(255,51,51,0.15)',
                              color: req.requestStatus === 'Pending' ? '#ffaa00' : req.requestStatus === 'Accepted' ? '#00c864' : '#ff3333'
                            }}>
                              {req.requestStatus === 'Pending' ? '⏳ Pending' : req.requestStatus === 'Accepted' ? '✅ Accepted' : '✗ Rejected'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>



      {/* Registration Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className={`modal-box reg-modal ${((event.customFormFields && event.customFormFields.length > 0) || event.maxTeamSize > 1) ? 'reg-modal-wide' : ''}`} onClick={e => e.stopPropagation()}>
            <h2>Register for {event.title}</h2>

            {/* ── TYPE 2 (JoinRequests) MODE ─────────────────────── */}
            {event.registrationMode === 'JoinRequests' ? (
              <>
                {/* Left: user info */}
                <div className="reg-form-layout reg-form-horizontal">
                  <div className="reg-form-left">
                    <div className="reg-user-info">
                      <h4>Your Details</h4>
                      <p><strong>Name:</strong> {user?.name}</p>
                      <p><strong>Reg No:</strong> {user?.collegeRegNo || <span style={{color:'#ff4444'}}>Not set</span>}</p>
                      <p><strong>Branch:</strong> {user?.branch || <span style={{color:'#ff4444'}}>Not set</span>}</p>
                    </div>
                  </div>

                  {/* Right: choose Create or Join */}
                  <div className="reg-form-right">
                    <div className="form-group" style={{marginTop: '0px'}}>
                      <label>I want to</label>
                      <select value={regType} onChange={e => { setRegType(e.target.value); setSearchTeamStatus(null); }}>
                        <option value="Team">🏆 Create a Team (I'm the Leader)</option>
                        <option value="JoinTeam">🔍 Join an Existing Team</option>
                      </select>
                    </div>

                    {/* Create draft team */}
                    {regType === 'Team' && (
                      <>
                        <div className="form-group">
                          <label>Team Name *</label>
                          <input required value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Enter team name" />
                        </div>
                        <p style={{fontSize: '0.82rem', color: '#aaa', marginTop: '8px', lineHeight: '1.5'}}>
                          You'll create a Draft team. Other participants can search your <strong>Reg No ({user?.collegeRegNo || '—'})</strong> to send a join request. You accept/reject, then finalize to complete registration.
                        </p>
                      </>
                    )}

                    {/* Join existing team */}
                    {regType === 'JoinTeam' && (
                      <>
                        <div className="form-group" style={{marginTop: '0px'}}>
                          <label>
                            Leader's Reg No
                            <span style={{color: '#aaa', fontWeight: 'normal', fontSize: '0.8rem', marginLeft: '8px'}}>
                              (auto-searches when 8 digits entered)
                            </span>
                          </label>
                          <div style={{position: 'relative'}}>
                            <input
                              value={joinTeamRegNo}
                              maxLength={8}
                              inputMode="numeric"
                              onChange={e => {
                                // Only allow digits
                                const val = e.target.value.replace(/\D/g, '');
                                setJoinTeamRegNo(val);
                                setSearchTeamStatus(null);
                                // Auto-search when exactly 8 digits
                                if (val.length === 8) {
                                  handleSearchTeam(val);
                                }
                              }}
                              placeholder="e.g. 20249013"
                              style={{paddingRight: '36px'}}
                            />
                            {/* Inline digit counter / spinner */}
                            <span style={{
                              position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                              fontSize: '0.75rem', color: joinTeamRegNo.length === 8 ? '#00c864' : '#555',
                              pointerEvents: 'none'
                            }}>
                              {searchTeamStatus?.type === 'loading' ? '⏳' : `${joinTeamRegNo.length}/8`}
                            </span>
                          </div>
                        </div>

                        {searchTeamStatus?.type === 'error' && (
                          <p style={{color: '#ff4444', fontSize: '0.85rem', marginTop: '8px'}}>❌ {searchTeamStatus.msg}</p>
                        )}
                        {searchTeamStatus?.type === 'success' && searchTeamStatus.team && (
                          <div style={{marginTop: '12px', background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '12px'}}>
                            <p style={{color: '#00c864', fontWeight: 'bold'}}>✅ Team Found!</p>
                            <p><strong>Team:</strong> {searchTeamStatus.team.teamName}</p>
                            <p><strong>Leader:</strong> {searchTeamStatus.team.leaderName}</p>
                            <p><strong>Members:</strong> {searchTeamStatus.team.currentSize} / {searchTeamStatus.team.maxSize}</p>
                            <p><strong>Slots Left:</strong> {searchTeamStatus.team.slotsLeft}</p>
                            {searchTeamStatus.team.hasPendingRequestFromUser ? (
                              <p style={{color: '#ffaa00', marginTop: '8px'}}>⏳ You already have a pending join request for this team.</p>
                            ) : (
                              <button type="button" className="btn-primary" onClick={() => handleSendJoinRequest(searchTeamStatus.team._id)} disabled={submittingJoinReq} style={{marginTop: '10px', width: '100%'}}>
                                {submittingJoinReq ? 'Sending...' : '📨 Send Join Request'}
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="modal-actions" style={{marginTop: '20px'}}>
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  {regType === 'Team' && (
                    <button type="button" className="btn-primary" disabled={submitting} onClick={handleCreateDraftTeam}>
                      {submitting ? 'Creating...' : '🚀 Create Draft Team'}
                    </button>
                  )}
                </div>
              </>
            ) : (
              /* ── STANDARD MODE ──────────────────────────────────── */
              <form onSubmit={submitRegistration}>
                <div className={`reg-form-layout ${((event.customFormFields && event.customFormFields.length > 0) || event.maxTeamSize > 1) ? 'reg-form-horizontal' : 'reg-form-vertical'}`}>
                  <div className="reg-form-left">
                    <div className="reg-user-info">
                      <h4>Your Details</h4>
                      <p><strong>Name:</strong> {user?.name}</p>
                      <p><strong>Email:</strong> {user?.email}</p>
                      <p><strong>Reg No:</strong> {user?.collegeRegNo || <span style={{color:'#ff4444'}}>Not set</span>}</p>
                      <p><strong>Phone:</strong> {user?.phoneNumber || <span style={{color:'#ff4444'}}>Not set</span>}</p>
                      <p><strong>Branch:</strong> {user?.branch || <span style={{color:'#ff4444'}}>Not set</span>}</p>
                      <p><strong>Year:</strong> {user?.yearOfStudy ? `${user.yearOfStudy} Year` : <span style={{color:'#ff4444'}}>Not set</span>}</p>
                      {(!user?.collegeRegNo || !user?.phoneNumber || !user?.branch || !user?.yearOfStudy) && (
                        <p style={{ fontSize: '0.8rem', color: '#ffaa00', marginTop: '6px' }}>
                          ⚠️ Missing info? <a href="/profile" style={{ color: '#00ccff', textDecoration: 'underline' }}>Update Profile</a>
                        </p>
                      )}
                      <p className="reg-auto-note">* These details will be automatically submitted with your registration.</p>
                    </div>
                  </div>

                  {((event.customFormFields && event.customFormFields.length > 0) || event.maxTeamSize > 1) && (
                    <div className="reg-form-right">
                      {event.maxTeamSize > 1 && (
                        <div className="form-group" style={{marginTop: '0px'}}>
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
                          <input required value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Enter team name" />
                        </div>
                      )}

                      {event.customFormFields && event.customFormFields.length > 0 && (
                        <div className="custom-fields-section">
                          <h4 style={{ color: '#ff1f01', marginBottom: '15px', marginTop: event.maxTeamSize > 1 ? '20px' : '0px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                            Additional Information Required
                          </h4>
                          {event.customFormFields.map((field, idx) => (
                            <div className="form-group" key={idx}>
                              <label>{field.fieldName} {field.isRequired && '*'}</label>
                              {field.fieldType === 'text' && (
                                <input type="text" required={field.isRequired} value={customData[field.fieldName] || ''} onChange={e => handleCustomFieldChange(field.fieldName, e.target.value)} />
                              )}
                              {field.fieldType === 'textarea' && (
                                <textarea required={field.isRequired} value={customData[field.fieldName] || ''} onChange={e => handleCustomFieldChange(field.fieldName, e.target.value)} />
                              )}
                              {field.fieldType === 'checkbox' && (
                                <label style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'normal'}}>
                                  <input type="checkbox" required={field.isRequired} checked={customData[field.fieldName] || false} onChange={e => handleCustomFieldChange(field.fieldName, e.target.checked)} style={{width: 'auto'}} />
                                  Yes / I agree
                                </label>
                              )}
                              {field.fieldType === 'file' && (
                                <div>
                                  <input type="file" required={field.isRequired && !customData[field.fieldName]} onChange={e => handleFileUpload(e, field.fieldName)} accept="image/*,.pdf" />
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
                    </div>
                  )}
                </div>

                <div className="modal-actions" style={{marginTop: '30px'}}>
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={submitting || Object.values(fileUploading).some(status => status)}>
                    {submitting ? 'Submitting...' : 'Submit Registration'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── TYPE 2: Draft Team Dashboard (shown after leader creates draft) ── */}
      {showDraftDashboard && draftRegistration && (
        <div className="modal-overlay" onClick={() => setShowDraftDashboard(false)}>
          <div className="modal-box reg-modal reg-modal-wide" onClick={e => e.stopPropagation()}>
            <h2>🏆 {draftRegistration.teamName} — Team Dashboard</h2>
            <p style={{color: '#aaa', marginBottom: '20px', fontSize: '0.9rem'}}>
              Share your Reg No <strong style={{color: '#00c864'}}>({user?.collegeRegNo})</strong> with others so they can find and join your team.
            </p>

            {/* Current members */}
            <div style={{marginBottom: '20px'}}>
              <h4 style={{color: '#ff1f01', borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '10px'}}>
                Team Members ({draftRegistration.teamMembers?.filter(m => m.status === 'Confirmed').length + 1} / {event.maxTeamSize})
              </h4>
              <p><strong>{user?.name}</strong> <span style={{color: '#ffaa00', fontSize: '0.8rem'}}>👑 Leader (You)</span></p>
              {draftRegistration.teamMembers?.filter(m => m.status === 'Confirmed').map((m, i) => (
                <p key={i} style={{marginTop: '6px'}}>
                  <strong>{m.name}</strong> <span style={{color: '#aaa', fontSize: '0.8rem'}}>{m.collegeRegNo}</span>
                  <span style={{color: '#00c864', marginLeft: '10px', fontSize: '0.8rem'}}>✓ Confirmed</span>
                </p>
              ))}
            </div>

            {/* Pending join requests */}
            {draftRegistration.joinRequests?.filter(r => r.status === 'Pending').length > 0 && (
              <div style={{marginBottom: '20px'}}>
                <h4 style={{color: '#ffaa00', borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '10px'}}>
                  ⏳ Pending Join Requests ({draftRegistration.joinRequests.filter(r => r.status === 'Pending').length})
                </h4>
                {draftRegistration.joinRequests.filter(r => r.status === 'Pending').map((r, i) => (
                  <div key={i} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#111', borderRadius: '8px', padding: '10px 14px', marginBottom: '8px', border: '1px solid #222'}}>
                    <div>
                      <strong>{r.name}</strong>
                      <span style={{color: '#aaa', fontSize: '0.8rem', marginLeft: '10px'}}>{r.collegeRegNo}</span>
                    </div>
                    <div style={{display: 'flex', gap: '8px'}}>
                      <button
                        className="btn-primary"
                        style={{padding: '6px 14px', background: '#00c864', color: '#000', fontSize: '0.8rem'}}
                        disabled={respondingTo === r.userId}
                        onClick={() => handleRespondJoinRequest(r.userId, 'Accept')}
                      >
                        ✓ Accept
                      </button>
                      <button
                        className="btn-danger"
                        style={{padding: '6px 14px', fontSize: '0.8rem'}}
                        disabled={respondingTo === r.userId}
                        onClick={() => handleRespondJoinRequest(r.userId, 'Reject')}
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Custom fields for finalization */}
            {event.customFormFields?.length > 0 && (
              <div style={{marginBottom: '20px'}}>
                <h4 style={{color: '#ff1f01', borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '10px'}}>Additional Information Required</h4>
                {event.customFormFields.map((field, idx) => (
                  <div className="form-group" key={idx}>
                    <label>{field.fieldName} {field.isRequired && '*'}</label>
                    {field.fieldType === 'text' && <input type="text" value={customData[field.fieldName] || ''} onChange={e => handleCustomFieldChange(field.fieldName, e.target.value)} required={field.isRequired} />}
                    {field.fieldType === 'textarea' && <textarea value={customData[field.fieldName] || ''} onChange={e => handleCustomFieldChange(field.fieldName, e.target.value)} required={field.isRequired} />}
                  </div>
                ))}
              </div>
            )}

            <div className="modal-actions" style={{marginTop: '20px'}}>
              <button type="button" className="btn-secondary" onClick={() => setShowDraftDashboard(false)}>Close</button>
              <button type="button" className="btn-secondary" onClick={handleLoadDraftDashboard}>🔄 Refresh</button>
              <button
                type="button"
                className="btn-primary"
                disabled={submitting || (draftRegistration.teamMembers?.filter(m => m.status === 'Confirmed').length + 1) < 2}
                onClick={handleFinalizeRegistration}
                title="You need at least 2 members (including yourself) to finalize"
              >
                {submitting ? 'Finalizing...' : '🎉 Finalize Registration'}
              </button>
            </div>
          </div>
        </div>
      )}


      {toast && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}
      <Footer />
    </>
  );
};

export default EventDetails;

