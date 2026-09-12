import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import {
  FaArrowLeft, FaSave, FaTrash, FaPlus, FaTrophy,
  FaVoteYea, FaPlay, FaStop, FaRedo, FaListOl, FaChartPie, FaCheckCircle
} from 'react-icons/fa';
import { eventService } from '../../services/services';
import CropperInput from '../../components/CropperInput/CropperInput';
import './AdminDashboard.css';

const CATEGORIES = ['Mechapef-Event', 'Departmental'];
const BRANCHES = [
  'Biotechnology',
  'Chemical Engineering',
  'Civil Engineering',
  'Computer Science and Engineering',
  'Electronics and Communication Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Electronics and Computational Mechanics',
  'Materials Engineering',
  'Production and Industrial Engineering'
];

const emptyForm = {
  title: '', description: '', descriptionBlocks: [{ type: 'paragraph', text: '' }], category: 'Mechapef-Event',
  startTime: '', endTime: '', venue: '', registrationStartDate: '', registrationDeadline: '',
  maxTeamSize: 1, registrationMode: 'Standard', registrationFee: 0, featured: false, isTBD: false,
  rules: '', prizes: '',
  customFormFields: [], eligibleBranches: [...BRANCHES], eligibleYears: [1, 2, 3, 4, 5],
  ticketStages: ['Stage 1: Gate Entry', 'Stage 2: Kit / Food Collection'],
  enableQRScanning: true,
  attendanceMethod: 'qr',
  bannerURL: '',
  liveInteractive: {
    enabled: false,
    currentType: 'quiz',
    activeQuestionId: '',
    isAcceptingSubmissions: false,
    questions: []
  }
};

const formatLocal = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const AdminEventEditor = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') === 'live' ? 'live' : 'details');
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [liveResults, setLiveResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedResultQuestion, setSelectedResultQuestion] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (isEditing) {
      const fetchEvent = async () => {
        try {
          const res = await eventService.getById(id);
          const ev = res.data.data?.event || res.data.data;
          if (!ev) throw new Error('Event not found');

          setForm({
            title: ev.title || '',
            description: ev.description || '',
            descriptionBlocks: ev.descriptionBlocks?.length
              ? ev.descriptionBlocks
              : [{ type: 'paragraph', text: ev.description || '' }],
            category: ev.category || 'Mechapef-Event',
            venue: ev.venue || '',
            startTime: formatLocal(ev.startTime),
            endTime: formatLocal(ev.endTime),
            registrationStartDate: formatLocal(ev.registrationStartDate),
            registrationDeadline: formatLocal(ev.registrationDeadline),
            maxTeamSize: ev.maxTeamSize || 1,
            registrationMode: ev.registrationMode || 'Standard',
            registrationFee: ev.registrationFee || 0,
            featured: ev.featured || false,
            isTBD: ev.isTBD || false,
            rules: Array.isArray(ev.rules) ? ev.rules.join('\n') : (ev.rules || ''),
            prizes: ev.prizes || '',
            customFormFields: ev.customFormFields || [],
            eligibleBranches: ev.eligibleBranches && ev.eligibleBranches.length > 0 ? ev.eligibleBranches : [...BRANCHES],
            eligibleYears: ev.eligibleYears && ev.eligibleYears.length > 0 ? ev.eligibleYears : [1, 2, 3, 4, 5],
            ticketStages: ev.ticketStages && ev.ticketStages.length > 0 ? ev.ticketStages : ['Stage 1: Gate Entry', 'Stage 2: Kit / Food Collection'],
            enableQRScanning: ev.enableQRScanning !== undefined ? ev.enableQRScanning : true,
            attendanceMethod: ev.attendanceMethod || (ev.enableQRScanning === false ? 'id-card' : 'qr'),
            bannerURL: ev.bannerURL || '',
            liveInteractive: {
              enabled: ev.liveInteractive?.enabled || false,
              currentType: ev.liveInteractive?.currentType || 'quiz',
              activeQuestionId: ev.liveInteractive?.activeQuestionId || '',
              isAcceptingSubmissions: ev.liveInteractive?.isAcceptingSubmissions || false,
              questions: ev.liveInteractive?.questions || []
            }
          });
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to load event', 'error');
        } finally {
          setLoading(false);
        }
      };
      fetchEvent();
    } else {
      const draft = localStorage.getItem('mechapef_adminEventFormDraft');
      if (draft) {
        try {
          setForm(JSON.parse(draft));
        } catch (e) {
          setForm(emptyForm);
        }
      }
      setLoading(false);
    }
  }, [id, isEditing]);

  useEffect(() => {
    if (!isEditing && form.title) {
      const timer = setTimeout(() => {
        localStorage.setItem('mechapef_adminEventFormDraft', JSON.stringify(form));
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [form, isEditing]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!form.eligibleBranches || form.eligibleBranches.length === 0) {
      showToast('At least one eligible branch must be selected', 'error');
      return;
    }
    if (!form.eligibleYears || form.eligibleYears.length === 0) {
      showToast('At least one eligible year must be selected', 'error');
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      venue: form.isTBD && !form.venue ? 'TBD' : form.venue,
      startTime: form.isTBD && !form.startTime ? '2099-12-31T00:00' : form.startTime,
      endTime: form.isTBD && !form.endTime ? '2099-12-31T23:59' : form.endTime,
      registrationStartDate: form.isTBD && !form.registrationStartDate ? '2099-12-01T00:00' : (form.registrationStartDate || undefined),
      registrationDeadline: form.isTBD && !form.registrationDeadline ? '2099-12-30T23:59' : form.registrationDeadline,
      rules: form.rules ? (typeof form.rules === 'string' ? form.rules.split('\n').filter(Boolean) : form.rules) : [],
      description: (form.descriptionBlocks || []).map(block => block.text).filter(Boolean).join('\n\n'),
      maxTeamSize: Number(form.maxTeamSize),
      registrationMode: Number(form.maxTeamSize) > 1 ? form.registrationMode : 'Standard',
      registrationFee: Number(form.registrationFee),
      enableQRScanning: form.attendanceMethod === 'qr',
    };

    try {
      if (isEditing) {
        await eventService.update(id, payload);
        showToast('Event updated successfully');
      } else {
        const res = await eventService.create(payload);
        const newId = res.data.data?.event?._id || res.data.data?._id;
        localStorage.removeItem('mechapef_adminEventFormDraft');
        showToast('Event created successfully');
        if (newId) {
          navigate(`/admin/events/${newId}/edit`);
          return;
        }
      }
      navigate('/admin/events');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save event', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addCustomField = () => {
    f('customFormFields', [
      ...form.customFormFields,
      { fieldName: '', fieldType: 'text', isRequired: false }
    ]);
  };

  const removeCustomField = (index) => {
    f('customFormFields', form.customFormFields.filter((_, i) => i !== index));
  };

  const addDescriptionBlock = (type) => {
    f('descriptionBlocks', [...(form.descriptionBlocks || []), { type, text: '' }]);
  };

  const updateDescriptionBlock = (index, text) => {
    const blocks = [...(form.descriptionBlocks || [])];
    blocks[index] = { ...blocks[index], text };
    f('descriptionBlocks', blocks);
  };

  const removeDescriptionBlock = (index) => {
    const blocks = (form.descriptionBlocks || []).filter((_, blockIndex) => blockIndex !== index);
    f('descriptionBlocks', blocks.length ? blocks : [{ type: 'paragraph', text: '' }]);
  };

  const updateCustomField = (index, key, value) => {
    const updated = [...form.customFormFields];
    updated[index][key] = value;
    f('customFormFields', updated);
  };

  const addTicketStage = () => {
    const current = form.ticketStages || [];
    f('ticketStages', [...current, `Stage ${current.length + 1}: Check-in`]);
  };

  const updateTicketStage = (index, value) => {
    const current = [...(form.ticketStages || [])];
    current[index] = value;
    f('ticketStages', current);
  };

  const removeTicketStage = (index) => {
    f('ticketStages', (form.ticketStages || []).filter((_, i) => i !== index));
  };

  const setStagePreset = (count) => {
    if (count === 1) f('ticketStages', ['Stage 1: Main Gate Entry']);
    if (count === 2) f('ticketStages', ['Stage 1: Main Gate Entry', 'Stage 2: Kit / Food Collection']);
    if (count === 3) f('ticketStages', ['Stage 1: Main Gate Entry', 'Stage 2: Food & Refreshment', 'Stage 3: Certificate / Stage Entry']);
  };

  const addQuestion = () => {
    const currentQuestions = form.liveInteractive?.questions || [];
    const nextNum = currentQuestions.length + 1;
    const defaultType = form.liveInteractive?.currentType || 'quiz';
    const newQ = {
      id: `q_${Date.now().toString(36)}`,
      title: `Question ${nextNum}`,
      pollType: defaultType,
      options: [
        { key: 'option_A', text: 'Option A' },
        { key: 'option_B', text: 'Option B' }
      ],
      correctOption: defaultType === 'quiz' ? 'option_A' : '',
      timeLimitSeconds: 30,
      points: 1000
    };
    f('liveInteractive', {
      ...form.liveInteractive,
      questions: [...currentQuestions, newQ]
    });
  };

  const updateQuestion = (index, key, value) => {
    const questions = [...(form.liveInteractive?.questions || [])];
    questions[index] = { ...questions[index], [key]: value };
    f('liveInteractive', { ...form.liveInteractive, questions });
  };

  const updateQuestionOption = (qIdx, optIdx, text) => {
    const questions = [...(form.liveInteractive?.questions || [])];
    const opts = [...questions[qIdx].options];
    opts[optIdx] = { ...opts[optIdx], text };
    questions[qIdx] = { ...questions[qIdx], options: opts };
    f('liveInteractive', { ...form.liveInteractive, questions });
  };

  const addQuestionOption = (qIdx) => {
    const questions = [...(form.liveInteractive?.questions || [])];
    const question = { ...questions[qIdx] };
    const nextIndex = question.options.length;
    const nextKey = `option_${String.fromCharCode(65 + nextIndex)}_${Date.now().toString(36)}`;
    question.options = [...question.options, { key: nextKey, text: `Option ${String.fromCharCode(65 + nextIndex)}` }];
    questions[qIdx] = question;
    f('liveInteractive', { ...form.liveInteractive, questions });
  };

  const removeQuestionOption = (qIdx, optIdx) => {
    const questions = [...(form.liveInteractive?.questions || [])];
    const question = { ...questions[qIdx] };
    if (question.options.length <= 2) return;
    const removedKey = question.options[optIdx].key;
    question.options = question.options.filter((_, index) => index !== optIdx);
    if (question.correctOption === removedKey) question.correctOption = question.options[0]?.key || '';
    questions[qIdx] = question;
    f('liveInteractive', { ...form.liveInteractive, questions });
  };

  const removeQuestion = (index) => {
    const questions = (form.liveInteractive?.questions || []).filter((_, i) => i !== index);
    f('liveInteractive', { ...form.liveInteractive, questions });
  };

  const handleBroadcast = async (qId) => {
    if (!isEditing) {
      showToast('Please save the event first before broadcasting', 'error');
      return;
    }
    try {
      // Persist the current poll editor state before trying to broadcast it.
      await eventService.update(id, {
        liveInteractive: {
          ...form.liveInteractive,
          enabled: Boolean(qId),
          activeQuestionId: qId || null,
          isAcceptingSubmissions: Boolean(qId)
        }
      });
      await eventService.broadcastQuestion(id, { questionId: qId, isAcceptingSubmissions: true });
      f('liveInteractive', {
        ...form.liveInteractive,
        activeQuestionId: qId,
        isAcceptingSubmissions: true
      });
      showToast(qId ? `Question broadcasted live!` : 'Broadcast closed');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to broadcast', 'error');
    }
  };

  const handleToggleLiveMode = async () => {
    const isEnabled = Boolean(form.liveInteractive?.enabled);
    if (isEnabled) {
      try {
        await eventService.broadcastQuestion(id, { questionId: '', isAcceptingSubmissions: false });
        f('liveInteractive', {
          ...form.liveInteractive,
          enabled: false,
          activeQuestionId: '',
          isAcceptingSubmissions: false
        });
        showToast('Live mode disabled');
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to disable live mode', 'error');
      }
      return;
    }

    const firstQuestion = form.liveInteractive?.questions?.[0];
    if (!firstQuestion) {
      const defaultType = form.liveInteractive?.currentType || 'voting';
      const newQuestion = {
        id: `q_${Date.now().toString(36)}`,
        title: 'New Live Question',
        pollType: defaultType,
        options: [
          { key: 'option_A', text: 'Option A' },
          { key: 'option_B', text: 'Option B' }
        ],
        correctOption: defaultType === 'quiz' ? 'option_A' : '',
        timeLimitSeconds: 30,
        points: 1000
      };
      f('liveInteractive', {
        ...form.liveInteractive,
        enabled: true,
        questions: [newQuestion]
      });
      showToast('Question editor opened. Fill the question and click Broadcast Live.');
      return;
    }

    if (!isEditing) {
      showToast('Save the event first, then enable live mode', 'error');
      return;
    }

    await handleBroadcast(firstQuestion.id);
  };

  const handleToggleSubmissions = async (isOpen) => {
    if (!isEditing) return;
    try {
      await eventService.toggleLiveSubmissions(id, { isAcceptingSubmissions: isOpen });
      f('liveInteractive', {
        ...form.liveInteractive,
        isAcceptingSubmissions: isOpen
      });
      showToast(isOpen ? 'Submissions opened' : 'Submissions closed');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update submissions status', 'error');
    }
  };

  const handleResetRedis = async (qId = null) => {
    if (!isEditing) return;
    const msg = qId
      ? 'Reset live Redis submission & score data for this question?'
      : '⚠️ Reset ALL live Redis quiz & voting leaderboard data for this entire event?';
    if (!window.confirm(msg)) return;

    try {
      await eventService.resetLiveSession(id, { questionId: qId });
      showToast('Redis live data reset successfully');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reset Redis data', 'error');
    }
  };

  const viewResults = async (q) => {
    if (!isEditing) return;
    setSelectedResultQuestion(q);
    setLoadingResults(true);
    setShowResultsModal(true);
    try {
      const res = await eventService.getLiveResults(id, {
        pollType: q.pollType,
        questionId: q.id,
        isFinal: 'true'
      });
      setLiveResults(res.data.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load results', 'error');
    } finally {
      setLoadingResults(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <main className="admin-form-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <p style={{ color: '#aaa', fontSize: '1.2rem' }}>Loading event details...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-form-page" style={{ paddingBottom: '60px' }}>
        {/* Top Control Header */}
        <div className="admin-form-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link to="/admin/events" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px' }}>
              <FaArrowLeft /> Back to Events
            </Link>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.6rem' }}>
                {isEditing ? `Edit Event: ${form.title || 'Untitled'}` : 'Create New Event'}
              </h1>
              <p style={{ margin: '4px 0 0 0', color: '#888', fontSize: '0.85rem' }}>
                Full-page configuration for live events, registration rules, ticket stages, and real-time interactive engine.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={saving}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontSize: '1rem', fontWeight: 'bold' }}
          >
            <FaSave /> {saving ? 'Saving...' : isEditing ? 'Update Event' : 'Publish Event'}
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #333', paddingBottom: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
          {[
            { id: 'details', label: '📋 Event Details' },
            { id: 'schedule', label: '⏰ Schedule & Teams' },
            { id: 'eligibility', label: '🎯 Eligibility & Fields' },
            { id: 'stages', label: '🎫 Stages & Scanner' },
            { id: 'live', label: '⚡ Live Interactive Hub' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: activeTab === tab.id ? '1px solid #ff1f01' : '1px solid #282830',
                background: activeTab === tab.id ? '#ff1f0122' : '#141418',
                color: activeTab === tab.id ? '#ff1f01' : '#ccc',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.92rem'
              }}
            >
              {tab.label}
              {tab.id === 'live' && form.liveInteractive?.enabled && (
                <span style={{ marginLeft: '8px', background: '#00c864', color: '#000', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>ON</span>
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="admin-form-grid" style={{ background: '#121216', padding: '28px', borderRadius: '12px', border: '1px solid #282830' }}>
              <div className="form-group full" style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '1rem', color: '#ff1f01', fontWeight: 'bold' }}>Event Poster (1:1 Aspect Ratio Recommended)</label>
                <CropperInput
                  initialImage={form.bannerURL}
                  aspect={1}
                  folder="events"
                  onSave={(url) => {
                    f('bannerURL', url);
                    showToast('Poster cropped and uploaded successfully');
                  }}
                  label="Upload & Crop Poster"
                />
                {form.bannerURL && (
                  <button type="button" onClick={() => f('bannerURL', '')} className="btn-danger" style={{ marginTop: '10px', padding: '8px 14px' }}>
                    <FaTrash style={{ marginRight: '6px' }} /> Remove Poster
                  </button>
                )}
              </div>

              <div className="form-group full">
                <label>Event Title *</label>
                <input value={form.title} onChange={e => f('title', e.target.value)} required placeholder="e.g. CADathon, Robowars, Quiz Blitz" />
              </div>

              <div className="form-group full">
                <label>Event Description *</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <button type="button" className="btn-secondary" onClick={() => addDescriptionBlock('heading')} style={{ padding: '7px 12px' }}>
                    + Add Heading Tile
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => addDescriptionBlock('paragraph')} style={{ padding: '7px 12px' }}>
                    + Add Paragraph Tile
                  </button>
                </div>
                {(form.descriptionBlocks || []).map((block, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '10px' }}>
                    {block.type === 'heading' ? (
                      <input
                        value={block.text}
                        onChange={e => updateDescriptionBlock(index, e.target.value)}
                        placeholder="Section heading"
                        required={index === 0}
                        style={{ flex: 1, background: '#101014', color: '#ff1f01', fontWeight: 'bold', fontSize: '1.05rem' }}
                      />
                    ) : (
                      <textarea
                        rows={3}
                        value={block.text}
                        onChange={e => updateDescriptionBlock(index, e.target.value)}
                        placeholder="Write the event description paragraph..."
                        required={index === 0}
                        style={{ flex: 1, background: '#101014', color: '#fff', resize: 'vertical' }}
                      />
                    )}
                    <button type="button" className="btn-danger" onClick={() => removeDescriptionBlock(index)} style={{ padding: '8px 12px' }}>
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select value={form.category} onChange={e => f('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Venue {!form.isTBD && '*'}</label>
                <input value={form.venue} onChange={e => f('venue', e.target.value)} required={!form.isTBD} disabled={form.isTBD} placeholder={form.isTBD ? 'TBD' : 'e.g. MP Hall / Computer Center'} />
              </div>

              <div className="form-group" style={{ display: 'flex', gap: '20px', alignItems: 'center', marginTop: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#fff' }}>
                  <input type="checkbox" checked={form.featured} onChange={e => f('featured', e.target.checked)} />
                  Featured Event on Homepage
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#ffaa00' }}>
                  <input type="checkbox" checked={form.isTBD} onChange={e => f('isTBD', e.target.checked)} />
                  TBD (To Be Decided Timings/Venue)
                </label>
              </div>

              <div className="form-group full" style={{ marginTop: '10px' }}>
                <label>Rules & Instructions (One per line)</label>
                <textarea rows={4} value={form.rules} onChange={e => f('rules', e.target.value)} placeholder="Rule 1: Teams must bring valid college ID&#10;Rule 2: No electronic devices during round 1" />
              </div>

              <div className="form-group full">
                <label>Prizes & Rewards</label>
                <input value={form.prizes} onChange={e => f('prizes', e.target.value)} placeholder="1st Prize: ₹10,000 | 2nd Prize: ₹5,000 + Goodies" />
              </div>
            </div>
          )}

          {/* TAB 2: SCHEDULE & TEAMS */}
          {activeTab === 'schedule' && (
            <div className="admin-form-grid" style={{ background: '#121216', padding: '28px', borderRadius: '12px', border: '1px solid #282830' }}>
              <div className="form-group">
                <label>Event Start Time {!form.isTBD && '*'}</label>
                <input type="datetime-local" value={form.startTime} onChange={e => f('startTime', e.target.value)} required={!form.isTBD} disabled={form.isTBD} />
              </div>

              <div className="form-group">
                <label>Event End Time {!form.isTBD && '*'}</label>
                <input type="datetime-local" value={form.endTime} onChange={e => f('endTime', e.target.value)} required={!form.isTBD} disabled={form.isTBD} />
              </div>

              <div className="form-group">
                <label>Registration Start Date</label>
                <input type="datetime-local" value={form.registrationStartDate} onChange={e => f('registrationStartDate', e.target.value)} disabled={form.isTBD} placeholder="Immediate if left empty" />
              </div>

              <div className="form-group">
                <label>Registration Deadline {!form.isTBD && '*'}</label>
                <input type="datetime-local" value={form.registrationDeadline} onChange={e => f('registrationDeadline', e.target.value)} required={!form.isTBD} disabled={form.isTBD} />
              </div>

              <div className="form-group">
                <label>Max Team Size (1 for Solo)</label>
                <input type="number" min="1" max="10" value={form.maxTeamSize} onChange={e => f('maxTeamSize', e.target.value)} />
              </div>

              <div className="form-group">
                <label>Registration Fee (₹)</label>
                <input type="number" min="0" value={form.registrationFee} onChange={e => f('registrationFee', e.target.value)} />
              </div>

              {Number(form.maxTeamSize) > 1 && (
                <div className="form-group full" style={{ background: '#1b1b22', padding: '16px', borderRadius: '8px', border: '1px solid #333' }}>
                  <label style={{ color: '#ff1f01', fontWeight: 'bold' }}>Team Registration Mode</label>
                  <select value={form.registrationMode} onChange={e => f('registrationMode', e.target.value)} style={{ marginTop: '8px' }}>
                    <option value="Standard">Standard – Leader registers all members at once</option>
                    <option value="JoinRequests">Type 2 – Leader creates Draft, members search & request to join</option>
                  </select>
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: '#aaa' }}>
                    {form.registrationMode === 'JoinRequests'
                      ? 'Team members will search for their leader using College Reg No and send a join request. Leader accepts/rejects before finalizing.'
                      : 'The team leader must supply details of all teammates at the time of form submission.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ELIGIBILITY & FIELDS */}
          {activeTab === 'eligibility' && (
            <div style={{ background: '#121216', padding: '28px', borderRadius: '12px', border: '1px solid #282830' }}>
              {/* Eligible Branches */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontSize: '1rem', color: '#ff1f01', fontWeight: 'bold' }}>Eligible Branches *</label>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      if (form.eligibleBranches.length === BRANCHES.length) f('eligibleBranches', []);
                      else f('eligibleBranches', [...BRANCHES]);
                    }}
                    style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                  >
                    {form.eligibleBranches.length === BRANCHES.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px', backgroundColor: '#181820', padding: '16px', borderRadius: '8px' }}>
                  {BRANCHES.map(branch => {
                    const isChecked = form.eligibleBranches.includes(branch);
                    return (
                      <label key={branch} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.88rem', color: '#ddd' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) f('eligibleBranches', form.eligibleBranches.filter(b => b !== branch));
                            else f('eligibleBranches', [...form.eligibleBranches, branch]);
                          }}
                        />
                        <span>{branch}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Eligible Years */}
              <div style={{ marginBottom: '28px', borderTop: '1px solid #282830', paddingTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontSize: '1rem', color: '#ff1f01', fontWeight: 'bold' }}>Eligible Years *</label>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      if (form.eligibleYears.length === 5) f('eligibleYears', []);
                      else f('eligibleYears', [1, 2, 3, 4, 5]);
                    }}
                    style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                  >
                    {form.eligibleYears.length === 5 ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', backgroundColor: '#181820', padding: '16px', borderRadius: '8px' }}>
                  {[
                    { val: 1, label: '1st Year' },
                    { val: 2, label: '2nd Year' },
                    { val: 3, label: '3rd Year' },
                    { val: 4, label: '4th Year' },
                    { val: 5, label: 'Alumni / 5th' }
                  ].map(y => {
                    const isChecked = form.eligibleYears.includes(y.val);
                    return (
                      <label key={y.val} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', color: '#ddd' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) f('eligibleYears', form.eligibleYears.filter(item => item !== y.val));
                            else f('eligibleYears', [...form.eligibleYears, y.val]);
                          }}
                        />
                        <span>{y.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Custom Form Fields Builder */}
              <div style={{ borderTop: '1px solid #282830', paddingTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>Custom Registration Form Fields</h3>
                    <p style={{ margin: '4px 0 0 0', color: '#888', fontSize: '0.8rem' }}>Default fields (Name, Email, Reg No, Branch) are automatically collected.</p>
                  </div>
                  <button type="button" className="btn-secondary" onClick={addCustomField} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                    <FaPlus style={{ marginRight: '6px' }} /> Add Field
                  </button>
                </div>
                {form.customFormFields.map((field, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center', backgroundColor: '#181820', padding: '12px', borderRadius: '8px' }}>
                    <input
                      value={field.fieldName}
                      onChange={e => updateCustomField(idx, 'fieldName', e.target.value)}
                      placeholder="Field Name (e.g. GitHub Repository, Problem Statement Choice)"
                      required
                      style={{ flex: 2, background: '#101014' }}
                    />
                    <select
                      value={field.fieldType}
                      onChange={e => updateCustomField(idx, 'fieldType', e.target.value)}
                      style={{ flex: 1, background: '#101014' }}
                    >
                      <option value="text">Text (Short)</option>
                      <option value="textarea">Textarea (Long)</option>
                      <option value="checkbox">Checkbox (Yes/No)</option>
                      <option value="file">File Upload (Image/PDF)</option>
                    </select>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', whiteSpace: 'nowrap', color: '#ccc' }}>
                      <input
                        type="checkbox"
                        checked={field.isRequired}
                        onChange={e => updateCustomField(idx, 'isRequired', e.target.checked)}
                      /> Req
                    </label>
                    <button type="button" className="btn-danger" onClick={() => removeCustomField(idx)} style={{ padding: '8px 12px' }}>
                      <FaTrash />
                    </button>
                  </div>
                ))}
                {form.customFormFields.length === 0 && (
                  <p style={{ color: '#666', fontStyle: 'italic', margin: 0 }}>No custom fields added yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: STAGES & SCANNER */}
          {activeTab === 'stages' && (
            <div style={{ background: '#121216', padding: '28px', borderRadius: '12px', border: '1px solid #282830' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#ff1f01', fontSize: '1.15rem' }}>Ticket Verification Check-in Stations</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#888' }}>
                    Configure verification checkpoints for volunteer scanning (Gate Entry, Kit / Food collection, Certification desk).
                  </p>
                </div>
                <button type="button" className="btn-secondary" onClick={addTicketStage} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                  <FaPlus style={{ marginRight: '6px' }} /> Add Stage
                </button>
              </div>

              {/* Stage Presets */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.82rem', color: '#aaa' }}>Quick Presets:</span>
                <button type="button" onClick={() => setStagePreset(1)} className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.78rem' }}>1-Stage (Gate)</button>
                <button type="button" onClick={() => setStagePreset(2)} className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.78rem', borderColor: '#ff1f01', color: '#ff1f01' }}>2-Stage (Gate + Kit)</button>
                <button type="button" onClick={() => setStagePreset(3)} className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.78rem', borderColor: '#00e5ff', color: '#00e5ff' }}>3-Stage (Gate + Food + Cert)</button>
              </div>

              {(form.ticketStages || []).map((stage, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '12px', marginBottom: '10px', alignItems: 'center', backgroundColor: '#181820', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.9rem', color: '#ff1f01', fontWeight: 'bold', width: '80px', flexShrink: 0 }}>
                    Stage {idx + 1}:
                  </span>
                  <input
                    value={stage}
                    onChange={e => updateTicketStage(idx, e.target.value)}
                    placeholder={`Stage ${idx + 1} Name (e.g. Stage 1: Main Gate Check-in)`}
                    required
                    style={{ flex: 1, background: '#101014', color: '#fff' }}
                  />
                  {(form.ticketStages || []).length > 1 && (
                    <button type="button" className="btn-danger" onClick={() => removeTicketStage(idx)} style={{ padding: '8px 12px' }}>
                      <FaTrash />
                    </button>
                  )}
                </div>
              ))}

              <div style={{ marginTop: '28px', borderTop: '1px solid #282830', paddingTop: '20px' }}>
                <label style={{ display: 'block', color: '#fff', fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '8px' }}>
                  Scanner Attendance Verification Mode
                </label>
                <select
                  value={form.attendanceMethod || 'qr'}
                  onChange={e => f('attendanceMethod', e.target.value)}
                  style={{ width: '100%', maxWidth: '450px', background: '#fff' }}
                >
                  <option value="qr">QR Code (Ticket pass generated per registration)</option>
                  <option value="id-card">ID Card Barcode (Participant college ID scan)</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 5: LIVE INTERACTIVE HUB (QUIZ & VOTING) */}
          {activeTab === 'live' && (
            <div style={{ background: '#121216', padding: '28px', borderRadius: '12px', border: '1px solid #282830' }}>
              {/* Header Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #282830', paddingBottom: '20px', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#ff1f01', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    ⚡ Real-Time Live Interactive Engine
                  </h3>
                  <p style={{ margin: '6px 0 0 0', color: '#aaa', fontSize: '0.9rem', maxWidth: '680px' }}>
                    Broadcast questions live to attendees during seminars and contests. Uses Vercel Serverless + Redis atomic hashes and sorted sets for millisecond speed/accuracy leaderboards and instant voting calculations.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: form.liveInteractive?.enabled ? '#00c864' : '#666', fontWeight: 'bold' }}>
                    {form.liveInteractive?.enabled ? 'LIVE MODULE ACTIVE' : 'LIVE MODULE DISABLED'}
                  </span>
                  <button
                    type="button"
                    className={form.liveInteractive?.enabled ? 'btn-danger' : 'btn-primary'}
                    onClick={handleToggleLiveMode}
                    style={{ padding: '8px 18px' }}
                  >
                    {form.liveInteractive?.enabled ? 'Disable Live Mode' : 'Enable Live Mode'}
                  </button>
                </div>
              </div>

              {form.liveInteractive?.enabled && (
                <div>
                  {/* Default Type Selector */}
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px', background: '#181820', padding: '16px', borderRadius: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: '#fff' }}>Default Mode:</span>
                    <button
                      type="button"
                      onClick={() => f('liveInteractive', { ...form.liveInteractive, currentType: 'quiz' })}
                      style={{
                        padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', border: 'none',
                        background: form.liveInteractive?.currentType === 'quiz' ? '#ff1f01' : '#282830',
                        color: form.liveInteractive?.currentType === 'quiz' ? '#fff' : '#aaa',
                        fontWeight: 'bold'
                      }}
                    >
                      <FaTrophy style={{ marginRight: '6px' }} /> Type 1: Quiz (Speed + Accuracy Score)
                    </button>
                    <button
                      type="button"
                      onClick={() => f('liveInteractive', { ...form.liveInteractive, currentType: 'voting' })}
                      style={{
                        padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', border: 'none',
                        background: form.liveInteractive?.currentType === 'voting' ? '#00c864' : '#282830',
                        color: form.liveInteractive?.currentType === 'voting' ? '#000' : '#aaa',
                        fontWeight: 'bold'
                      }}
                    >
                      <FaVoteYea style={{ marginRight: '6px' }} /> Type 2: Live Voting (Instant %)
                    </button>

                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleResetRedis(null)}
                        className="btn-secondary"
                        style={{ marginLeft: 'auto', color: '#ff4444', borderColor: '#ff4444', fontSize: '0.8rem' }}
                      >
                        <FaRedo style={{ marginRight: '6px' }} /> Reset All Redis Live Data
                      </button>
                    )}
                  </div>

                  {/* Question Bank Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>
                      Questions & Polls ({(form.liveInteractive?.questions || []).length})
                    </h4>
                    <button type="button" className="btn-primary" onClick={addQuestion} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                      <FaPlus style={{ marginRight: '6px' }} /> Add Question / Poll
                    </button>
                  </div>

                  {/* Question Cards */}
                  {(form.liveInteractive?.questions || []).map((q, qIdx) => {
                    const isBroadcasted = form.liveInteractive?.activeQuestionId === q.id;
                    return (
                      <div
                        key={q.id}
                        style={{
                          background: isBroadcasted ? 'rgba(255, 31, 1, 0.08)' : '#181820',
                          border: isBroadcasted ? '2px solid #ff1f01' : '1px solid #282830',
                          borderRadius: '10px',
                          padding: '20px',
                          marginBottom: '20px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontWeight: 'bold', color: '#ff1f01', fontSize: '1rem' }}>#{qIdx + 1}</span>
                            <span style={{ background: q.pollType === 'quiz' ? '#ff1f0133' : '#00c86433', color: q.pollType === 'quiz' ? '#ff1f01' : '#00c864', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                              {q.pollType === 'quiz' ? 'QUIZ MODE' : 'VOTING MODE'}
                            </span>
                            {isBroadcasted && (
                              <span style={{ background: '#00c864', color: '#000', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', animation: 'pulse 1.5s infinite' }}>
                                🔴 LIVE NOW
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {isEditing && (
                              <>
                                {isBroadcasted ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSubmissions(!form.liveInteractive?.isAcceptingSubmissions)}
                                      className="btn-secondary"
                                      style={{ padding: '6px 12px', fontSize: '0.8rem', color: form.liveInteractive?.isAcceptingSubmissions ? '#ffaa00' : '#00c864' }}
                                    >
                                      {form.liveInteractive?.isAcceptingSubmissions ? <><FaStop style={{ marginRight: '4px' }} /> Close Window</> : <><FaPlay style={{ marginRight: '4px' }} /> Open Window</>}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleBroadcast('')}
                                      className="btn-danger"
                                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                    >
                                      Stop Broadcast
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleBroadcast(q.id)}
                                    className="btn-primary"
                                    style={{ padding: '6px 14px', fontSize: '0.8rem', background: '#00c864', color: '#000', fontWeight: 'bold' }}
                                  >
                                    <FaPlay style={{ marginRight: '6px' }} /> Broadcast Live
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => viewResults(q)}
                                  className="btn-secondary"
                                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                >
                                  {q.pollType === 'quiz' ? <FaListOl style={{ marginRight: '6px' }} /> : <FaChartPie style={{ marginRight: '6px' }} />}
                                  Live Results
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleResetRedis(q.id)}
                                  className="btn-secondary"
                                  title="Reset Redis responses for this question"
                                  style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#ff4444' }}
                                >
                                  <FaRedo />
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              className="btn-danger"
                              onClick={() => removeQuestion(qIdx)}
                              style={{ padding: '6px 10px' }}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>

                        {/* Title & Type */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontSize: '0.82rem', color: '#aaa', marginBottom: '4px', display: 'block' }}>Question Title / Prompt</label>
                            <textarea
                              value={q.title}
                              onChange={e => updateQuestion(qIdx, 'title', e.target.value)}
                              placeholder="e.g. Which engine cycle is used in diesel vehicles?"
                              maxLength={500}
                              required
                              rows={5}
                              style={{ background: '#101014', color: '#fff', minHeight: '140px', resize: 'vertical' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.82rem', color: '#aaa', marginBottom: '4px', display: 'block' }}>Question Mode</label>
                            <select
                              value={q.pollType}
                              onChange={e => updateQuestion(qIdx, 'pollType', e.target.value)}
                              style={{ background: '#101014', color: '#fff' }}
                            >
                              <option value="quiz">Type 1: Quiz (Leaderboard)</option>
                              <option value="voting">Type 2: Voting Poll (%)</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: '0.82rem', color: '#aaa', marginBottom: '4px', display: 'block' }}>Time Limit (Sec)</label>
                            <input
                              type="number"
                              min="5"
                              max="300"
                              value={q.timeLimitSeconds || 30}
                              onChange={e => updateQuestion(qIdx, 'timeLimitSeconds', Number(e.target.value))}
                              style={{ background: '#101014', color: '#fff' }}
                            />
                          </div>
                        </div>

                        {/* Options */}
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ fontSize: '0.82rem', color: '#aaa', marginBottom: '8px', display: 'block' }}>
                            Choices & Correct Answer Key
                          </label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                            {q.options.map((opt, optIdx) => {
                              const isCorrect = q.pollType === 'quiz' && q.correctOption === opt.key;
                              return (
                                <div
                                  key={opt.key}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: isCorrect ? 'rgba(0, 200, 100, 0.1)' : '#101014',
                                    border: isCorrect ? '1px solid #00c864' : '1px solid #333',
                                    padding: '8px 12px',
                                    borderRadius: '6px'
                                  }}
                                >
                                  {q.pollType === 'quiz' && (
                                    <input
                                      type="radio"
                                      name={`correct_${q.id}`}
                                      checked={isCorrect}
                                      onChange={() => updateQuestion(qIdx, 'correctOption', opt.key)}
                                      title="Mark as correct answer"
                                      style={{ cursor: 'pointer' }}
                                    />
                                  )}
                                  <span style={{ fontSize: '0.8rem', color: '#ff1f01', fontWeight: 'bold' }}>
                                    {String.fromCharCode(65 + optIdx)}:
                                  </span>
                                  <input
                                    value={opt.text}
                                    onChange={e => updateQuestionOption(qIdx, optIdx, e.target.value)}
                                    placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                    required
                                    style={{ background: 'transparent', border: 'none', padding: '4px', flex: 1, color: '#fff' }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeQuestionOption(qIdx, optIdx)}
                                    disabled={q.options.length <= 2}
                                    title={q.options.length <= 2 ? 'A poll needs at least two options' : 'Remove option'}
                                    style={{ background: 'transparent', border: 'none', color: q.options.length <= 2 ? '#555' : '#ff4444', cursor: q.options.length <= 2 ? 'not-allowed' : 'pointer', fontSize: '1rem' }}
                                  >
                                    x
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                          <button
                            type="button"
                            onClick={() => addQuestionOption(qIdx)}
                            className="btn-secondary"
                            style={{ marginTop: '10px', padding: '6px 12px', fontSize: '0.8rem' }}
                          >
                            + Add Option
                          </button>
                          {q.pollType === 'quiz' && (
                            <small style={{ color: '#00c864', marginTop: '6px', display: 'block' }}>
                              ✓ Radio button marks the correct answer key. Correct option is kept hidden server-side until evaluated.
                            </small>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {(form.liveInteractive?.questions || []).length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', background: '#181820', borderRadius: '8px', color: '#888' }}>
                      No questions or polls added yet. Click <strong>"+ Add Question / Poll"</strong> above to configure questions for this event.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bottom Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', marginTop: '30px' }}>
            <Link to="/admin/events" className="btn-secondary" style={{ padding: '10px 20px' }}>
              Cancel
            </Link>
            <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '10px 28px', fontSize: '1rem', fontWeight: 'bold' }}>
              {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>

        {/* Live Results & Leaderboard Modal */}
        {showResultsModal && (
          <div className="modal-overlay" onClick={() => setShowResultsModal(false)}>
            <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', width: '90%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '1.3rem' }}>
                  Live Results: {selectedResultQuestion?.title}
                </h2>
                <button type="button" className="btn-secondary" onClick={() => viewResults(selectedResultQuestion)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                  <FaRedo /> Refresh
                </button>
              </div>

              {loadingResults ? (
                <p style={{ textAlign: 'center', color: '#aaa', padding: '30px' }}>Fetching real-time Redis results...</p>
              ) : selectedResultQuestion?.pollType === 'voting' ? (
                <div>
                  <div style={{ background: '#181820', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.9rem', color: '#aaa' }}>Total Votes Cast:</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#00c864' }}>{liveResults?.totalVotes || 0}</div>
                  </div>
                  {(liveResults?.breakdown || []).map(b => (
                    <div key={b.option} style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                        <span>{selectedResultQuestion.options?.find(o => o.key === b.option)?.text || b.option}</span>
                        <span style={{ fontWeight: 'bold', color: '#ff1f01' }}>{b.percentage}% ({b.votes} votes)</span>
                      </div>
                      <div style={{ height: '10px', background: '#222', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${b.percentage}%`, background: '#ff1f01', transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <h3 style={{ color: '#ff1f01', fontSize: '1rem', marginBottom: '10px' }}>
                    Top 10 Fast & Accurate Leaderboard (Speed + Accuracy Points)
                  </h3>
                  <div className="admin-table-wrap" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Participant</th>
                          <th>Reg No / Branch</th>
                          <th>Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(liveResults?.questionLeaderboard || liveResults?.overallLeaderboard || []).length === 0 ? (
                          <tr><td colSpan="4" style={{ textAlign: 'center', color: '#777', padding: '20px' }}>No submissions yet</td></tr>
                        ) : (
                          (liveResults?.questionLeaderboard || liveResults?.overallLeaderboard || []).map(entry => (
                            <tr key={entry.userId}>
                              <td style={{ fontWeight: 'bold', color: entry.rank <= 3 ? '#ffaa00' : '#fff' }}>#{entry.rank}</td>
                              <td>{entry.userName}</td>
                              <td style={{ color: '#aaa', fontSize: '0.85rem' }}>{entry.collegeRegNo || entry.branch || '—'}</td>
                              <td style={{ fontWeight: 'bold', color: '#00c864' }}>{entry.score} pts</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowResultsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {toast && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}
      </main>
    </div>
  );
};

export default AdminEventEditor;

