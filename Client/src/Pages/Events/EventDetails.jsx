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
import TeamDetailView from './TeamDetailView';
import { formatEventDate, formatEventDateTime } from '../../utils/datetime';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTeamDetail, setShowTeamDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [userRegistration, setUserRegistration] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [imgError, setImgError] = useState(false);



  const [regType, setRegType] = useState('Solo'); // 'Solo' | 'Team' | 'JoinTeam'
  const [teamName, setTeamName] = useState('');
  const [customData, setCustomData] = useState({});
  const [fileUploading, setFileUploading] = useState({});


  const [joinTeamRegNo, setJoinTeamRegNo] = useState('');
  const [searchTeamStatus, setSearchTeamStatus] = useState(null); // { type: 'loading'|'error'|'success', msg, team }
  const [submittingJoinReq, setSubmittingJoinReq] = useState(false);

  const [draftRegistration, setDraftRegistration] = useState(null);
  const [showDraftDashboard, setShowDraftDashboard] = useState(false);
  const [respondingTo, setRespondingTo] = useState(null);
  const [endorseRegNo, setEndorseRegNo] = useState('');
  const [addingMember, setAddingMember] = useState(false);

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


  useEffect(() => {
    if (!user) return;
    const checkRegistration = async () => {
      try {
        const res = await api.get(`/events/${id}/my-registration`);
        if (res.status === 200 && res.data.data?.isRegistered !== false) {
          setUserRegistration(res.data.data || false);
        } else {
          setUserRegistration(false);
        }
      } catch (err) {
        setUserRegistration(false);
      }
    };
    checkRegistration();


    if (sessionStorage.getItem('auto_open_reg') === 'true') {
      sessionStorage.removeItem('auto_open_reg');
      if (event?.registrationMode === 'JoinRequests') {
        setRegType('Team');
      } else if (event?.maxTeamSize > 1) {
        setRegType('Team');
      } else {
        setRegType('Solo');
      }
      setShowModal(true);
    }
  }, [id, user, event]);


  useEffect(() => {
    if (!user || !event || event.registrationMode !== 'JoinRequests') return;
    const fetchJoinStatus = async () => {
      try {
        const res = await api.get(`/events/${id}/my-join-status`);
        if (res.status === 200 && res.data.data?.role !== 'none') {
          setMyJoinStatus(res.data.data);

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

  useEffect(() => {
    if (myJoinStatus?.registration?.registrationStatus === 'Confirmed') {
      setShowTeamDetail(true);
    }
  }, [myJoinStatus]);


  const handleRegisterClick = () => {
    if (!user) {
      showToast('Please login to register', 'error');
      sessionStorage.setItem('redirect_after_login', window.location.pathname + window.location.search);
      sessionStorage.setItem('auto_open_reg', 'true');
      setTimeout(() => navigate('/login', { state: { from: { pathname: window.location.pathname, search: window.location.search } } }), 1200);
      return;
    }
    if (event?.registrationMode === 'JoinRequests') {
      setRegType('Team');
    } else if (event?.maxTeamSize > 1) {
      setRegType('Team');
    } else {
      setRegType('Solo');
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

    setFileUploading(prev => ({ ...prev, [fieldName]: true }));
    try {
      const res = await api.post('/upload/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      handleCustomFieldChange(fieldName, {
        url: res.data.data.url,
        fileId: res.data.data.fileId
      });
      showToast('File uploaded successfully!');
    } catch (err) {
      showToast('File upload failed', 'error');
    } finally {
      setFileUploading(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const submitRegistration = async (e) => {
    e.preventDefault();

    // Validate team name for team registrations
    if (regType === 'Team' && !teamName.trim()) {
      showToast('Please enter a team name', 'error');
      return;
    }

    // Validate required custom form fields
    if (event.customFormFields?.length > 0) {
      for (const field of event.customFormFields) {
        if (field.isRequired) {
          const val = customData[field.fieldName];
          const isEmpty = val === undefined || val === null || val === '' ||
            (typeof val === 'object' && !val?.url);
          if (isEmpty) {
            showToast(`"${field.fieldName}" is required`, 'error');
            return;
          }
        }
      }
    }

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

  if (loading) return <div className="loading-page"><Navbar /><div className="loading-text">Loading...</div></div>;
  if (!event) return <div className="loading-page"><Navbar /><div className="loading-text">Event not found</div></div>;

  const refreshJoinStatus = async () => {
    if (!user || !event || event.registrationMode !== 'JoinRequests') return;
    try {
      const res = await api.get(`/events/${id}/my-join-status`, {
        validateStatus: (status) => status < 500
      });
      if (res.status === 200) {
        setMyJoinStatus(res.data.data);
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
      await refreshJoinStatus();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create draft team', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFetchOpenTeams = async (regNoOverride) => {
    const regNo = regNoOverride !== undefined ? regNoOverride : joinTeamRegNo;
    setSearchTeamStatus({ type: 'loading' });
    try {
      const params = regNo && regNo.trim() ? { regNo: regNo.trim() } : {};
      const res = await api.get(`/events/${id}/teams`, { params, bypassCache: true });
      const teams = res.data?.data || [];
      if (teams.length === 0) {
        setSearchTeamStatus({
          type: 'error',
          msg: regNo && regNo.trim()
            ? 'No open team found with that Reg No. Make sure the leader has created a Draft team.'
            : 'No open teams created yet for this event. Be the first to create one!'
        });
      } else {
        setSearchTeamStatus({ type: 'success', teams });
      }
    } catch (err) {
      setSearchTeamStatus({ type: 'error', msg: err.response?.data?.message || 'Failed to fetch teams' });
    }
  };

  const handleSendJoinRequest = async (teamRegId) => {
    setSubmittingJoinReq(true);
    try {
      await api.post(`/registrations/${teamRegId}/send-join-request`);
      showToast('Join request sent! Wait for the leader to accept.', 'success');
      setSearchTeamStatus(null);
      setJoinTeamRegNo('');
      setShowModal(false);
      await refreshJoinStatus();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send join request', 'error');
    } finally {
      setSubmittingJoinReq(false);
    }
  };

  const handleLoadDraftDashboard = async () => {
    try {
      const res = await api.get(`/events/${id}/my-team-registration`, { bypassCache: true });
      const reg = res.data?.data;
      setDraftRegistration(reg);
      if (reg?.customData) {
        setCustomData(reg.customData);
      }
      setShowDraftDashboard(true);
    } catch (err) {
      showToast('Could not load your team dashboard', 'error');
    }
  };

  const handleAddMemberByRegNo = async (regNoToAdd) => {
    const regNo = regNoToAdd || endorseRegNo;
    if (!regNo || regNo.trim().length !== 8) {
      return showToast('Enter a valid 8-digit Registration Number', 'error');
    }
    setAddingMember(true);
    try {
      const res = await api.post(`/registrations/${draftRegistration._id}/add-member`, {
        collegeRegNo: regNo.trim()
      });
      showToast(res.data?.message || 'Member added to your team!', 'success');
      setEndorseRegNo('');
      await handleLoadDraftDashboard();
      await refreshJoinStatus();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add member', 'error');
    } finally {
      setAddingMember(false);
    }
  };

  const handleLeaveTeam = async (teamRegId) => {
    const targetId = teamRegId || myJoinStatus?.registration?._id || myJoinStatus?.requests?.[0]?.teamId;
    if (!targetId) return;
    if (!window.confirm('Are you sure you want to leave / withdraw request from this team?')) return;
    try {
      const res = await api.post(`/registrations/${targetId}/leave`);
      showToast(res.data?.message || 'Left team successfully', 'success');
      await refreshJoinStatus();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to leave team', 'error');
    }
  };

  const handleRemoveTeamMember = async (memberUserId) => {
    if (!draftRegistration) return;
    if (!window.confirm('Remove this member from your team?')) return;
    try {
      const res = await api.post(`/registrations/${draftRegistration._id}/remove-member`, { memberUserId });
      showToast(res.data?.message || 'Member removed', 'success');
      await handleLoadDraftDashboard();
      await refreshJoinStatus();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove member', 'error');
    }
  };

  const handleDeleteDraftTeam = async () => {
    if (!draftRegistration) return;
    if (!window.confirm('Are you sure you want to delete/disband your team? All members and pending requests will be removed.')) return;
    setSubmitting(true);
    try {
      await api.delete(`/registrations/${draftRegistration._id}/draft`);
      showToast('Team deleted. You can now create a new team or join another team.', 'success');
      setShowDraftDashboard(false);
      setDraftRegistration(null);
      await refreshJoinStatus();
      setRegType('Team');
      setShowModal(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete team', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespondJoinRequest = async (requesterId, action) => {
    if (!draftRegistration) return;
    setRespondingTo(requesterId);
    try {
      await api.post(`/registrations/${draftRegistration._id}/respond-join`, { requesterId, action });
      showToast(`Join request ${action}ed!`, 'success');
      await handleLoadDraftDashboard();
      await refreshJoinStatus();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to respond', 'error');
    } finally {
      setRespondingTo(null);
    }
  };

  const handleRespondInvitation = async (teamRegId, action) => {
    setRespondingTo(teamRegId);
    try {
      const res = await api.post(`/registrations/${teamRegId}/respond-invitation`, { action });
      showToast(res.data?.message || (action === 'Accept' ? 'Invitation accepted!' : 'Invitation declined.'), 'success');
      await refreshJoinStatus();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to respond to invitation', 'error');
    } finally {
      setRespondingTo(null);
    }
  };


  const handleSaveDraftChanges = async () => {
    if (!draftRegistration) return;
    setSubmitting(true);
    try {
      await api.patch(`/registrations/${draftRegistration._id}/draft-data`, { customData });
      showToast('Draft changes saved successfully!', 'success');
      setShowDraftDashboard(false);
      await refreshJoinStatus();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save changes', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalizeRegistration = async () => {
    if (!draftRegistration) return;

    if (event.customFormFields?.length > 0) {
      const requiredMissing = event.customFormFields.find(f => f.isRequired && !customData[f.fieldName]);
      if (requiredMissing) {
        showToast(`Please fill the required field: ${requiredMissing.fieldName}`, 'error');
        return;
      }
    }

    const confirmMessage =
      "⚠️ PERMANENT FINALIZATION NOTICE:\n\n" +
      "Are you sure you want to finalize your team registration now?\n\n" +
      "• Once finalized, your team roster will be PERMANENTLY LOCKED.\n" +
      "• NO changes, member additions, or removals will be allowed after this.\n" +
      "• Official registration tickets will be generated.\n\n" +
      "Do you want to proceed and permanently finalize now?";

    if (!window.confirm(confirmMessage)) return;

    setSubmitting(true);
    try {
      await api.post(`/registrations/${draftRegistration._id}/finalize`, { customData });
      showToast('🎉 Registration finalized! Your team is officially registered and locked.', 'success');
      setShowDraftDashboard(false);
      setDraftRegistration(null);
      setUserRegistration({ registrationStatus: 'Confirmed' });
      setShowTeamDetail(true);
      await refreshJoinStatus();
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
            {event.bannerURL && !imgError ? (
              <img
                src={event.bannerURL}
                alt={event.title}
                className="event-poster-image"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="event-poster-placeholder">
                <h2>{event.title ? event.title.substring(0, 2).toUpperCase() : 'EV'}</h2>
              </div>
            )}
          </div>


          <div className="event-info-container">
            <div className="event-header">
              <div className="event-category-tag">{event.category}</div>
              <h1>{event.title}</h1>
              <div className="event-meta-pills">
                <span className="meta-pill">📍 {event.isTBD && event.venue.toLowerCase() === 'tbd' ? 'To Be Decided' : event.venue}</span>
                <span className="meta-pill">📅 {event.isTBD ? 'To Be Decided' : formatEventDateTime(event.startTime)}</span>
              </div>
            </div>

            <div className="event-main">
              <h3>About the Event</h3>
              {event.descriptionBlocks?.length > 0 ? (
                <div className="event-description">
                  {event.descriptionBlocks.map((block, index) => (
                    block.type === 'heading'
                      ? <h4 key={index} style={{ color: '#ff1f01', margin: '22px 0 8px', fontSize: '1.15rem' }}>{block.text}</h4>
                      : <p key={index} style={{ margin: '0 0 14px', color: '#fff' }}>{block.text}</p>
                  ))}
                </div>
              ) : (
                <p className="event-description">{event.description}</p>
              )}

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
                      ? event.eligibleYears.map((y, i) => <span key={i} className="cute-tag">{y === 5 ? 'Alumni' : `${y}${['st', 'nd', 'rd', 'th'][Math.min(y - 1, 3)]} Year`}</span>)
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
                  <h3 style={{ color: '#ff1f01', marginBottom: '15px' }}>Prizes & Rewards</h3>
                  <p style={{ fontSize: '1.1rem', color: '#e5e7eb', background: '#111', padding: '15px', borderLeft: '4px solid #ff1f01', borderRadius: '4px', whiteSpace: 'pre-line' }}>
                    {event.prizes}
                  </p>
                </div>
              )}

              {event.highlights && event.highlights.length > 0 && (
                <div className="event-highlights-section" style={{ marginTop: '35px', background: 'rgba(17, 17, 17, 0.85)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255, 31, 1, 0.25)', backdropFilter: 'blur(10px)' }}>
                  <h3 style={{ color: '#ff1f01', fontSize: '1.3rem', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <span>📊</span> Highlights of Event
                  </h3>
                  <div className="highlights-list" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                    {event.highlights.map((highlight, idx) => (
                      <div key={idx} className="highlight-item" style={{ background: '#0a0a0a', padding: '18px 20px', borderRadius: '10px', border: '1px solid #222' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', gap: '12px' }}>
                          <h4 style={{ color: '#f3f4f6', fontSize: '1.05rem', margin: 0, fontWeight: '600', lineHeight: 1.4 }}>
                            {idx + 1}. {highlight.question}
                          </h4>
                          <span style={{ fontSize: '0.78rem', color: '#9ca3af', background: '#1f1f1f', padding: '4px 10px', borderRadius: '20px', border: '1px solid #333', whiteSpace: 'nowrap' }}>
                            🗳️ {highlight.totalVotes || 0} Votes
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {highlight.options?.map((opt, optIdx) => {
                            const isWinner = highlight.majorityOption && highlight.majorityOption === opt.label && (opt.votes > 0 || opt.percentage > 0);
                            return (
                              <div key={optIdx} style={{ position: 'relative', background: '#161616', borderRadius: '8px', overflow: 'hidden', border: isWinner ? '1px solid rgba(255, 31, 1, 0.4)' : '1px solid #262626' }}>
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    bottom: 0,
                                    width: `${opt.percentage || 0}%`,
                                    background: isWinner ? 'linear-gradient(90deg, rgba(255, 31, 1, 0.45) 0%, rgba(255, 31, 1, 0.15) 100%)' : 'rgba(255, 255, 255, 0.05)',
                                    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                                    zIndex: 0
                                  }}
                                />
                                <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', fontSize: '0.92rem' }}>
                                  <span style={{ color: isWinner ? '#ffffff' : '#d1d5db', fontWeight: isWinner ? '600' : '400', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {opt.label}
                                    {isWinner && (
                                      <span style={{ background: '#ff1f01', color: '#fff', fontSize: '0.7rem', padding: '2px 7px', borderRadius: '4px', fontWeight: 'bold' }}>
                                        Majority Choice
                                      </span>
                                    )}
                                  </span>
                                  <span style={{ color: isWinner ? '#ff4d36' : '#9ca3af', fontWeight: '700', fontSize: '0.9rem', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                                    {opt.percentage || 0}% <span style={{ color: '#6b7280', fontSize: '0.8rem', fontWeight: 'normal' }}>({opt.votes || 0})</span>
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>


            {!event.isTBD && (
              <>
                <div className="event-card-info">
                  {event.registrationStartDate && (
                    <p><strong>Starts:</strong> {formatEventDateTime(event.registrationStartDate)}</p>
                  )}
                  <p><strong>Deadline:</strong> {formatEventDateTime(event.registrationDeadline)}</p>
                  <p><strong>Fee:</strong> {event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free'}</p>
                  <p><strong>Team Size:</strong> {event.minTeamSize && event.minTeamSize > 1 ? `${event.minTeamSize}–${event.maxTeamSize} members` : `Up to ${event.maxTeamSize} members`}</p>
                  <p><strong>Mode:</strong> {event.registrationMode === 'JoinRequests' ? <span style={{ color: '#00c864', fontWeight: 'bold' }}>Type 2 (Join Requests)</span> : 'Type 1 (Standard)'}</p>

                  {(() => {
                    const isNotStarted = event.registrationStartDate && new Date() < new Date(event.registrationStartDate);
                    const isClosed = new Date() > new Date(event.registrationDeadline);
                    const isFinalized = myJoinStatus?.registration?.registrationStatus === 'Confirmed';
                    const hasDraft = myJoinStatus?.role === 'leader' && !isFinalized;
                    const isRequester = myJoinStatus?.role === 'requester';
                    const isMember = myJoinStatus?.role === 'member';
                    const isDisabled = !!userRegistration || isFinalized || isClosed || event.isTBD || isNotStarted || hasDraft || isRequester || isMember;
                    return (
                      <>
                        <button
                          className="primary-btn register-btn"
                          onClick={hasDraft ? handleLoadDraftDashboard : handleRegisterClick}
                          disabled={isDisabled}
                        >
                          {userRegistration
                            ? userRegistration.attended
                              ? 'Attended'
                              : 'Registered'
                            : hasDraft
                              ? 'View My Team Dashboard'
                              : isMember
                                ? 'Team Member'
                                : isRequester
                                  ? 'Join Request Pending'
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
                          <div className="registration-countdown" style={{ marginTop: '15px', textAlign: 'center', color: '#ff1f01', fontWeight: 'bold', background: 'rgba(255, 31, 1, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 31, 1, 0.2)' }}>
                            Closes in: {timeLeft}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {showTeamDetail && myJoinStatus?.registration?.registrationStatus === 'Confirmed' && (
                  <TeamDetailView registration={myJoinStatus.registration} event={event} />
                )}

                {/* ── TYPE 2: Join Activity Panel ────────────────── */}
                {event.registrationMode === 'JoinRequests' && user && myJoinStatus && (
                  <div style={{ marginTop: '20px', borderTop: '1px solid #222', paddingTop: '16px' }}>

                    {/* LEADER: show incoming requests summary */}
                    {myJoinStatus.role === 'leader' && myJoinStatus.registration && myJoinStatus.registration.registrationStatus !== 'Confirmed' && (
                      <div style={{ background: 'rgba(0,200,100,0.07)', border: '1px solid rgba(0,200,100,0.2)', borderRadius: '10px', padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <h4 style={{ color: '#00c864', margin: 0, fontSize: '0.95rem' }}>Your Draft Team: <span style={{ color: '#fff' }}>{myJoinStatus.registration.teamName}</span></h4>
                          <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={handleLoadDraftDashboard}>Manage &rarr;</button>
                        </div>
                        <p style={{ color: '#aaa', fontSize: '0.82rem', margin: '4px 0' }}>
                          Members: <strong style={{ color: '#fff' }}>{(myJoinStatus.registration.teamMembers?.filter(m => m.status === 'Confirmed').length || 0) + 1}</strong> / {event.maxTeamSize}
                        </p>
                        {(() => {
                          const pending = myJoinStatus.registration.joinRequests?.filter(r => r.status === 'Pending') || [];
                          return pending.length > 0 ? (
                            <div style={{ marginTop: '10px' }}>
                              <p style={{ color: '#ffaa00', fontSize: '0.82rem', marginBottom: '6px' }}>{pending.length} pending join request{pending.length > 1 ? 's' : ''}:</p>
                              {pending.map((r, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', borderRadius: '6px', padding: '6px 10px', marginBottom: '5px' }}>
                                  <span style={{ fontSize: '0.82rem' }}><strong>{r.name}</strong> <span style={{ color: '#666' }}>{r.collegeRegNo}</span></span>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                      style={{ padding: '3px 10px', background: '#00c864', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                                      disabled={respondingTo === r.userId}
                                      onClick={() => handleRespondJoinRequest(r.userId, 'Accept')}
                                    >Accept</button>
                                    <button
                                      style={{ padding: '3px 10px', background: '#ff3333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                                      disabled={respondingTo === r.userId}
                                      onClick={() => handleRespondJoinRequest(r.userId, 'Reject')}
                                    >Reject</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ color: '#555', fontSize: '0.82rem', marginTop: '6px' }}>No pending join requests yet. Share your Reg No: <strong style={{ color: '#00c864' }}>{user?.collegeRegNo}</strong></p>
                          );
                        })()}
                      </div>
                    )}


                    {myJoinStatus.role === 'member' && myJoinStatus.registration && myJoinStatus.registration.registrationStatus !== 'Confirmed' && (
                      <div style={{ background: 'rgba(0,200,100,0.07)', border: '1px solid rgba(0,200,100,0.2)', borderRadius: '10px', padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <h4 style={{ color: '#00c864', margin: 0, fontSize: '0.95rem' }}>You're in a Team!</h4>
                          {myJoinStatus.registration.registrationStatus === 'Draft' && (
                            <button
                              className="btn-danger"
                              style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(255,51,51,0.2)', border: '1px solid #ff3333' }}
                              onClick={() => handleLeaveTeam(myJoinStatus.registration._id)}
                            >
                              Leave Team
                            </button>
                          )}
                        </div>
                        <p style={{ color: '#aaa', fontSize: '0.82rem', margin: '4px 0' }}>Team: <strong style={{ color: '#fff' }}>{myJoinStatus.registration.teamName}</strong></p>
                        <p style={{ color: '#aaa', fontSize: '0.82rem', margin: '4px 0' }}>Leader: <strong style={{ color: '#fff' }}>{myJoinStatus.registration.registeredBy?.name}</strong> ({myJoinStatus.registration.registeredBy?.collegeRegNo})</p>
                        <p style={{ color: '#aaa', fontSize: '0.82rem', margin: '4px 0' }}>
                          Status: <strong style={{ color: myJoinStatus.registration.registrationStatus === 'Confirmed' ? '#00c864' : '#ffaa00' }}>
                            {myJoinStatus.registration.registrationStatus === 'Confirmed' ? 'Registration Finalized' : 'Draft — Waiting for leader to finalize'}
                          </strong>
                        </p>
                      </div>
                    )}


                    {myJoinStatus.role === 'requester' && myJoinStatus.requests?.length > 0 && (
                      <div style={{ background: 'rgba(255,170,0,0.07)', border: '1px solid rgba(255,170,0,0.25)', borderRadius: '10px', padding: '14px' }}>
                        <h4 style={{ color: '#ffaa00', margin: '0 0 10px', fontSize: '0.95rem' }}>Your Join Request{myJoinStatus.requests.length > 1 ? 's' : ''}</h4>
                        {myJoinStatus.requests.map((req, i) => (
                          <div key={i} style={{ background: '#111', borderRadius: '8px', padding: '10px 12px', marginBottom: i < myJoinStatus.requests.length - 1 ? '8px' : 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <p style={{ margin: '0 0 3px', fontWeight: 'bold', fontSize: '0.9rem' }}>{req.teamName}</p>
                                <p style={{ margin: 0, color: '#aaa', fontSize: '0.8rem' }}>Leader: {req.leaderName} · {req.currentSize}/{event.maxTeamSize} members</p>
                              </div>
                              <span style={{
                                padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold',
                                background: req.requestStatus === 'Pending' ? 'rgba(255,170,0,0.15)' : req.requestStatus === 'Accepted' ? 'rgba(0,200,100,0.15)' : 'rgba(255,51,51,0.15)',
                                color: req.requestStatus === 'Pending' ? '#ffaa00' : req.requestStatus === 'Accepted' ? '#00c864' : '#ff3333'
                              }}>
                                {req.requestStatus === 'Pending' ? 'Pending' : req.requestStatus === 'Accepted' ? 'Accepted' : 'Rejected'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* INVITEE: leader sent an invitation to this user */}
                    {myJoinStatus.role === 'invitee' && myJoinStatus.invitations?.length > 0 && (
                      <div style={{ background: 'rgba(0,180,255,0.07)', border: '1px solid rgba(0,180,255,0.3)', borderRadius: '10px', padding: '14px' }}>
                        <h4 style={{ color: '#00b4ff', margin: '0 0 10px', fontSize: '0.95rem' }}>📬 You've Been Invited to Join a Team!</h4>
                        {myJoinStatus.invitations.map((inv, i) => (
                          <div key={i} style={{ background: '#0d1a22', borderRadius: '8px', padding: '12px 14px', marginBottom: i < myJoinStatus.invitations.length - 1 ? '10px' : 0, border: '1px solid #1a3040' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                              <div>
                                <p style={{ margin: '0 0 3px', fontWeight: 'bold', fontSize: '0.92rem', color: '#fff' }}>{inv.teamName}</p>
                                <p style={{ margin: 0, color: '#aaa', fontSize: '0.8rem' }}>
                                  Leader: <strong style={{ color: '#00b4ff' }}>{inv.leaderName}</strong> ({inv.leaderRegNo}) · {inv.currentSize}/{event.maxTeamSize} members
                                </p>
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  style={{ padding: '6px 16px', background: '#00c864', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 'bold' }}
                                  disabled={respondingTo === inv.teamId}
                                  onClick={() => handleRespondInvitation(inv.teamId, 'Accept')}
                                >
                                  {respondingTo === inv.teamId ? '...' : '✓ Accept'}
                                </button>
                                <button
                                  style={{ padding: '6px 16px', background: 'rgba(255,51,51,0.15)', color: '#ff5555', border: '1px solid #ff3333', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem' }}
                                  disabled={respondingTo === inv.teamId}
                                  onClick={() => handleRespondInvitation(inv.teamId, 'Reject')}
                                >
                                  {respondingTo === inv.teamId ? '...' : '✕ Decline'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>


      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className={`modal-box reg-modal ${((event.customFormFields && event.customFormFields.length > 0) || event.maxTeamSize > 1) ? 'reg-modal-wide' : ''}`} onClick={e => e.stopPropagation()}>
            <h2>Register for {event.title}</h2>


            {event.registrationMode === 'JoinRequests' ? (
              <>
                {/* Left: user info */}
                <div className="reg-form-layout reg-form-horizontal">
                  <div className="reg-form-left">
                    <div className="reg-user-info">
                      <h4>Your Details</h4>
                      <p><strong>Name:</strong> {user?.name}</p>
                      <p><strong>Reg No:</strong> {user?.collegeRegNo || <span style={{ color: '#ff4444' }}>Not set</span>}</p>
                      <p><strong>Branch:</strong> {user?.branch || <span style={{ color: '#ff4444' }}>Not set</span>}</p>
                    </div>
                  </div>


                  <div className="reg-form-right">
                    <div className="form-group" style={{ marginTop: '0px' }}>
                      <label>I want to</label>
                      <select value={regType} onChange={e => {
                        const val = e.target.value;
                        setRegType(val);
                        setSearchTeamStatus(null);
                        if (val === 'JoinTeam') {
                          handleFetchOpenTeams('');
                        }
                      }}>
                        <option value="Team">Create a Team (I'm the Leader)</option>
                        <option value="JoinTeam">Join an Existing Team</option>
                      </select>
                    </div>


                    {regType === 'Team' && (
                      <>
                        <div className="form-group">
                          <label>Team Name *</label>
                          <input required value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Enter team name" />
                        </div>
                        <p style={{ fontSize: '0.82rem', color: '#aaa', marginTop: '8px', lineHeight: '1.5' }}>
                          You'll create a Draft team. Other participants can search your <strong>Reg No ({user?.collegeRegNo || '—'})</strong> or find your team listed here to send a join request.
                        </p>
                      </>
                    )}


                    {regType === 'JoinTeam' && (
                      <>
                        <div className="form-group" style={{ marginTop: '0px' }}>
                          <label>
                            Search Leader's Reg No
                            <span style={{ color: '#aaa', fontWeight: 'normal', fontSize: '0.8rem', marginLeft: '8px' }}>
                              (Filter by 8 digits)
                            </span>
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              value={joinTeamRegNo}
                              maxLength={8}
                              inputMode="numeric"
                              onChange={e => {
                                const val = e.target.value.replace(/\D/g, '');
                                setJoinTeamRegNo(val);
                                // Only trigger API search if empty (to reset list) or if user enters full 8 digits
                                if (val.length === 0 || val.length === 8) {
                                  handleFetchOpenTeams(val);
                                }
                              }}
                              placeholder="Type 8-digit Reg No or view list below"
                              style={{ paddingRight: '36px' }}
                            />
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
                          <p style={{ color: '#ff4444', fontSize: '0.85rem', marginTop: '8px' }}>{searchTeamStatus.msg}</p>
                        )}
                        {searchTeamStatus?.type === 'success' && searchTeamStatus.teams && (
                          <div style={{ marginTop: '12px', maxHeight: '220px', overflowY: 'auto' }}>
                            <p style={{ color: '#00c864', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '8px' }}>
                              Open Teams Looking for Members ({searchTeamStatus.teams.length})
                            </p>
                            {searchTeamStatus.teams.map((t, idx) => (
                              <div key={idx} style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '10px 12px', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <div>
                                    <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{t.teamName}</strong>
                                    <p style={{ color: '#aaa', fontSize: '0.8rem', margin: '2px 0 0' }}>
                                      Leader: <strong style={{ color: '#fff' }}>{t.leaderName}</strong> ({t.leaderRegNo})
                                    </p>
                                    <p style={{ color: '#888', fontSize: '0.75rem', margin: '2px 0 0' }}>
                                      Members: {t.currentSize} / {t.maxSize} · Slots Left: <strong style={{ color: '#00c864' }}>{t.slotsLeft}</strong>
                                    </p>
                                  </div>
                                  {t.hasPendingRequestFromUser ? (
                                    <span style={{ color: '#ffaa00', fontSize: '0.75rem', background: 'rgba(255,170,0,0.15)', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                                      Requested
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      className="btn-primary"
                                      onClick={() => handleSendJoinRequest(t._id)}
                                      disabled={submittingJoinReq}
                                      style={{ padding: '6px 12px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                                    >
                                      {submittingJoinReq ? 'Sending...' : 'Request to Join'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="modal-actions" style={{ marginTop: '20px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  {regType === 'Team' && (
                    <button type="button" className="btn-primary" disabled={submitting} onClick={handleCreateDraftTeam}>
                      {submitting ? 'Creating...' : 'Create Draft Team'}
                    </button>
                  )}
                </div>
              </>
            ) : (

              <form onSubmit={submitRegistration}>
                <div className={`reg-form-layout ${((event.customFormFields && event.customFormFields.length > 0) || event.maxTeamSize > 1) ? 'reg-form-horizontal' : 'reg-form-vertical'}`}>
                  <div className="reg-form-left">
                    <div className="reg-user-info">
                      <h4>Your Details</h4>
                      <p><strong>Name:</strong> {user?.name}</p>
                      <p><strong>Email:</strong> {user?.email}</p>
                      <p><strong>Reg No:</strong> {user?.collegeRegNo || <span style={{ color: '#ff4444' }}>Not set</span>}</p>
                      <p><strong>Phone:</strong> {user?.phoneNumber || <span style={{ color: '#ff4444' }}>Not set</span>}</p>
                      <p><strong>Branch:</strong> {user?.branch || <span style={{ color: '#ff4444' }}>Not set</span>}</p>
                      <p><strong>Year:</strong> {user?.yearOfStudy ? `${user.yearOfStudy} Year` : <span style={{ color: '#ff4444' }}>Not set</span>}</p>
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
                        <div className="form-group" style={{ marginTop: '0px' }}>
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
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'normal' }}>
                                  <input type="checkbox" required={field.isRequired} checked={customData[field.fieldName] || false} onChange={e => handleCustomFieldChange(field.fieldName, e.target.checked)} style={{ width: 'auto' }} />
                                  Yes / I agree
                                </label>
                              )}
                              {field.fieldType === 'file' && (
                                <div>
                                  <input type="file" required={field.isRequired && !customData[field.fieldName]} onChange={e => handleFileUpload(e, field.fieldName)} accept="image/*,.pdf" />
                                  {fileUploading[field.fieldName] && <span style={{ color: '#ffaa00', fontSize: '0.8rem' }}>Uploading...</span>}
                                  {customData[field.fieldName]?.url && !fileUploading[field.fieldName] && (
                                    <span style={{ color: '#00c864', fontSize: '0.8rem', marginLeft: '10px' }}>✓ File uploaded</span>
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

                <div className="modal-actions" style={{ marginTop: '30px' }}>
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


      {showDraftDashboard && draftRegistration && (
        <div className="modal-overlay" onClick={() => setShowDraftDashboard(false)}>
          <div className="modal-box reg-modal reg-modal-extra-wide" onClick={e => e.stopPropagation()}>
            <h2>{draftRegistration.teamName} — Team Dashboard</h2>
            <p style={{ color: '#aaa', marginBottom: '20px', fontSize: '0.9rem' }}>
              Share your Reg No <strong style={{ color: '#00c864' }}>({user?.collegeRegNo})</strong> with others so they can find and join your team.
            </p>


            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#ff1f01', borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '10px' }}>
                Team Members ({draftRegistration.teamMembers?.filter(m => m.status === 'Confirmed').length + 1} / {event.maxTeamSize})
              </h4>
              <p><strong>{user?.name}</strong> <span style={{ color: '#ffaa00', fontSize: '0.8rem' }}>Leader (You)</span></p>
              {draftRegistration.teamMembers?.filter(m => m.status === 'Confirmed').map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', background: '#111', padding: '6px 10px', borderRadius: '6px', border: '1px solid #222' }}>
                  <span>
                    <strong>{m.name}</strong> <span style={{ color: '#aaa', fontSize: '0.8rem' }}>{m.collegeRegNo}</span>
                    <span style={{ color: '#00c864', marginLeft: '10px', fontSize: '0.8rem' }}>Confirmed</span>
                  </span>
                  <button
                    type="button"
                    style={{ padding: '3px 8px', background: 'rgba(255,51,51,0.2)', color: '#ff4444', border: '1px solid #ff4444', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                    onClick={() => handleRemoveTeamMember(m.userId)}
                  >
                    Remove
                  </button>
                </div>
              ))}


              {(draftRegistration.teamMembers?.filter(m => m.status === 'Confirmed').length + 1) < event.maxTeamSize && (
                <div style={{ marginTop: '15px', background: '#111', border: '1px dashed #444', borderRadius: '8px', padding: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#00c864', marginBottom: '8px' }}>
                    Endorse & Add Teammate directly by Reg No:
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        value={endorseRegNo}
                        maxLength={8}
                        inputMode="numeric"
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          setEndorseRegNo(val);
                          if (val.length === 8) {
                            handleAddMemberByRegNo(val);
                          }
                        }}
                        placeholder="Enter 8-digit Reg No (e.g. 20249013)"
                        style={{ paddingRight: '36px', fontSize: '0.85rem' }}
                      />
                      <span style={{
                        position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                        fontSize: '0.75rem', color: endorseRegNo.length === 8 ? '#00c864' : '#555',
                        pointerEvents: 'none'
                      }}>
                        {addingMember ? 'Processing...' : `${endorseRegNo.length}/8`}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={addingMember || endorseRegNo.length !== 8}
                      onClick={() => handleAddMemberByRegNo()}
                      style={{ padding: '8px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                    >
                      {addingMember ? 'Adding...' : '+ Add Member'}
                    </button>
                  </div>
                  <small style={{ color: '#888', fontSize: '0.75rem', marginTop: '6px', display: 'block' }}>
                    Sends an invitation to the user — they must accept to join your team.
                  </small>
                </div>
              )}
            </div>


            <div style={{ marginBottom: '20px', background: '#0a0a0a', border: '1px solid #222', borderRadius: '10px', padding: '14px' }}>
              <h4 style={{ color: '#ffaa00', borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '10px', marginTop: 0 }}>
                Incoming Join Requests ({draftRegistration.joinRequests?.filter(r => r.status === 'Pending').length || 0})
              </h4>
              {draftRegistration.joinRequests?.filter(r => r.status === 'Pending').length > 0 ? (
                draftRegistration.joinRequests.filter(r => r.status === 'Pending').map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#161616', borderRadius: '8px', padding: '10px 14px', marginBottom: '8px', border: '1px solid #333' }}>
                    <div>
                      <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{r.name}</strong>
                      <span style={{ color: '#00ccff', fontSize: '0.85rem', marginLeft: '10px', fontWeight: 'bold' }}>{r.collegeRegNo}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn-primary"
                        style={{ padding: '6px 14px', background: '#00c864', color: '#000', fontSize: '0.8rem', fontWeight: 'bold' }}
                        disabled={respondingTo === r.userId}
                        onClick={() => handleRespondJoinRequest(r.userId, 'Accept')}
                      >
                        Accept
                      </button>
                      <button
                        className="btn-danger"
                        style={{ padding: '6px 14px', fontSize: '0.8rem', background: '#ff3333', color: '#fff' }}
                        disabled={respondingTo === r.userId}
                        onClick={() => handleRespondJoinRequest(r.userId, 'Reject')}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#666', fontSize: '0.85rem', margin: 0 }}>
                  No pending join requests right now. Teammates can search your Reg No <strong style={{ color: '#00c864' }}>{user?.collegeRegNo}</strong> or you can add them directly above.
                </p>
              )}
            </div>

            {/* Invitations Sent by leader */}
            {draftRegistration.invitations?.length > 0 && (
              <div style={{ marginBottom: '20px', background: '#0a0a0a', border: '1px solid #1a3040', borderRadius: '10px', padding: '14px' }}>
                <h4 style={{ color: '#00b4ff', borderBottom: '1px solid #1a3040', paddingBottom: '8px', marginBottom: '10px', marginTop: 0 }}>
                  📤 Invitations Sent ({draftRegistration.invitations.filter(inv => inv.status === 'Pending').length} pending)
                </h4>
                {draftRegistration.invitations.map((inv, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0d1a22', borderRadius: '8px', padding: '10px 14px', marginBottom: '8px', border: '1px solid #1a3040' }}>
                    <div>
                      <strong style={{ color: '#fff', fontSize: '0.92rem' }}>{inv.name}</strong>
                      <span style={{ color: '#00b4ff', fontSize: '0.82rem', marginLeft: '10px' }}>{inv.collegeRegNo}</span>
                    </div>
                    <span style={{
                      padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold',
                      background: inv.status === 'Pending' ? 'rgba(255,170,0,0.15)' : inv.status === 'Accepted' ? 'rgba(0,200,100,0.15)' : 'rgba(255,51,51,0.15)',
                      color: inv.status === 'Pending' ? '#ffaa00' : inv.status === 'Accepted' ? '#00c864' : '#ff5555'
                    }}>
                      {inv.status === 'Pending' ? '⏳ Awaiting Response' : inv.status === 'Accepted' ? '✓ Accepted' : '✕ Declined'}
                    </span>
                  </div>
                ))}
              </div>
            )}


            {event.customFormFields?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: '#ff1f01', borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '10px' }}>Additional Information Required</h4>
                {event.customFormFields.map((field, idx) => (
                  <div className="form-group" key={idx}>
                    <label>{field.fieldName} {field.isRequired && '*'}</label>
                    {field.fieldType === 'text' && <input type="text" value={customData[field.fieldName] || ''} onChange={e => handleCustomFieldChange(field.fieldName, e.target.value)} required={field.isRequired} />}
                    {field.fieldType === 'textarea' && <textarea value={customData[field.fieldName] || ''} onChange={e => handleCustomFieldChange(field.fieldName, e.target.value)} required={field.isRequired} />}
                  </div>
                ))}
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <button
                type="button"
                className="btn-danger"
                style={{ background: 'rgba(255,51,51,0.15)', color: '#ff4444', border: '1px solid #ff4444', padding: '8px 14px', fontSize: '0.82rem' }}
                onClick={handleDeleteDraftTeam}
                disabled={submitting}
              >
                Disband Team
              </button>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleSaveDraftChanges}
                  disabled={submitting}
                  style={{ padding: '9px 18px', fontSize: '0.85rem' }}
                >
                  {submitting ? 'Saving...' : '💾 Save Changes'}
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  disabled={
                    submitting ||
                    (draftRegistration.teamMembers?.filter(m => m.status === 'Confirmed').length + 1) < (event.minTeamSize || 1) ||
                    (draftRegistration.teamMembers?.filter(m => m.status === 'Confirmed').length + 1) > event.maxTeamSize
                  }
                  onClick={handleFinalizeRegistration}
                  title={
                    (draftRegistration.teamMembers?.filter(m => m.status === 'Confirmed').length + 1) < (event.minTeamSize || 1)
                      ? `Team must have at least ${event.minTeamSize || 1} members to finalize`
                      : `Finalize Team Registration (No changes allowed after this)`
                  }
                  style={{ minWidth: '180px', padding: '9px 20px', fontSize: '0.85rem', fontWeight: 'bold' }}
                >
                  {submitting ? 'Finalizing...' : '🚀 Finalize Registration'}
                </button>
              </div>
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
