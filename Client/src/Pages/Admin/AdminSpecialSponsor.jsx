import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import api from '../../services/api';
import { FaCloudUploadAlt, FaTrash, FaSave, FaCrop, FaTimesCircle, FaUpload } from 'react-icons/fa';
import '../../components/CropperInput/CropperInput.css';
import './AdminDashboard.css';

const AdminSpecialSponsor = () => {
  const [sponsor, setSponsor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    name: '',
    tagline: '',
    showCoBrandingLogo: true,
    showFloatingBubbles: true,
    showEventCardsLogo: true,
    showTeamTitleCoBranding: true,
    showTeamCardsLogo: true,
    includeInEmails: false,
    customFontUrl: '',
    customFontFamily: '',
    brandColor: '#ff1f01',
    applyBrandFont: false
  });
  const [previewURL, setPreviewURL] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [customLogosToUpload, setCustomLogosToUpload] = useState({});

  // Cropper state
  const [cropperTarget, setCropperTarget] = useState(null); // 'main' or placement key
  const [cropSrc, setCropSrc] = useState(null);
  const cropperRef = useRef(null);

  const openCropperForFile = (targetKey, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropperTarget(targetKey);
      setCropSrc(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      openCropperForFile('main', file);
    }
    e.target.value = '';
  };

  const handleCustomLogoFile = (placementKey, file) => {
    if (file) {
      openCropperForFile(placementKey, file);
    }
  };

  const applyCrop = () => {
    if (typeof cropperRef.current?.cropper !== 'undefined' && cropperTarget) {
      const cropper = cropperRef.current.cropper;
      const canvas = cropper.getCroppedCanvas({
        maxWidth: 1200,
        maxHeight: 1200,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const croppedFile = new File([blob], `${cropperTarget}_cropped_${Date.now()}.png`, { type: 'image/png' });
        const croppedUrl = URL.createObjectURL(blob);

        if (cropperTarget === 'main') {
          setFileToUpload(croppedFile);
          setPreviewURL(croppedUrl);
        } else {
          setCustomLogosToUpload(prev => ({ ...prev, [cropperTarget]: croppedFile }));
          setForm(prev => ({ ...prev, [`${cropperTarget}LogoURL`]: croppedUrl }));
        }

        setCropSrc(null);
        setCropperTarget(null);
      }, 'image/png');
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchConfig = async () => {
    try {
      const res = await api.get('/special-sponsor/active');
      if (res.data.data) {
        setSponsor(res.data.data);
        setForm({
          name: res.data.data.name,
          tagline: res.data.data.tagline || '',
          showCoBrandingLogo: res.data.data.showCoBrandingLogo ?? true,
          showFloatingBubbles: res.data.data.showFloatingBubbles ?? true,
          showEventCardsLogo: res.data.data.showEventCardsLogo ?? true,
          showTeamTitleCoBranding: res.data.data.showTeamTitleCoBranding ?? true,
          showTeamCardsLogo: res.data.data.showTeamCardsLogo ?? true,
          includeInEmails: res.data.data.includeInEmails ?? false,
          navbarLogoURL: res.data.data.navbarLogoURL || '',
          navbarCustomName: res.data.data.navbarCustomName || '',
          navbarCustomTagline: res.data.data.navbarCustomTagline || '',

          bubbleLogoURL: res.data.data.bubbleLogoURL || '',
          bubbleCustomName: res.data.data.bubbleCustomName || '',
          bubbleCustomTagline: res.data.data.bubbleCustomTagline || '',

          eventCardsLogoURL: res.data.data.eventCardsLogoURL || '',
          eventCardsCustomName: res.data.data.eventCardsCustomName || '',
          eventCardsCustomTagline: res.data.data.eventCardsCustomTagline || '',

          teamTitleLogoURL: res.data.data.teamTitleLogoURL || '',
          teamTitleCustomName: res.data.data.teamTitleCustomName || '',
          teamTitleCustomTagline: res.data.data.teamTitleCustomTagline || '',

          teamCardsLogoURL: res.data.data.teamCardsLogoURL || '',
          teamCardsCustomName: res.data.data.teamCardsCustomName || '',
          teamCardsCustomTagline: res.data.data.teamCardsCustomTagline || '',

          emailLogoURL: res.data.data.emailLogoURL || '',
          emailCustomName: res.data.data.emailCustomName || '',
          emailCustomTagline: res.data.data.emailCustomTagline || '',

          sliderLogoURL: res.data.data.sliderLogoURL || '',
          sliderCustomName: res.data.data.sliderCustomName || '',
          sliderCustomTagline: res.data.data.sliderCustomTagline || '',

          showAnnouncementSliderLogo: res.data.data.showAnnouncementSliderLogo ?? true,
          customFontUrl: res.data.data.customFontUrl || '',
          customFontFamily: res.data.data.customFontFamily || '',
          brandColor: res.data.data.brandColor || '#ff1f01',
          applyBrandFont: res.data.data.applyBrandFont ?? false
        });
        setPreviewURL(res.data.data.logoURL);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        showToast('Failed to load config', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Upload image helper
      const uploadImageFile = async (file) => {
        const uploadFormData = new FormData();
        uploadFormData.append('image', file);
        const res = await api.post('/upload/image', uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data.data.url;
      };

      let logoURL = previewURL || '';
      let logoFileId = sponsor?.logoFileId || '';

      let navbarLogoURL = form.navbarLogoURL;
      let bubbleLogoURL = form.bubbleLogoURL;
      let eventCardsLogoURL = form.eventCardsLogoURL;
      let teamTitleLogoURL = form.teamTitleLogoURL;
      let teamCardsLogoURL = form.teamCardsLogoURL;
      let emailLogoURL = form.emailLogoURL;
      let sliderLogoURL = form.sliderLogoURL;

      if (customLogosToUpload.navbar) navbarLogoURL = await uploadImageFile(customLogosToUpload.navbar);
      if (customLogosToUpload.bubble) bubbleLogoURL = await uploadImageFile(customLogosToUpload.bubble);
      if (customLogosToUpload.eventCards) eventCardsLogoURL = await uploadImageFile(customLogosToUpload.eventCards);
      if (customLogosToUpload.teamTitle) teamTitleLogoURL = await uploadImageFile(customLogosToUpload.teamTitle);
      if (customLogosToUpload.teamCards) teamCardsLogoURL = await uploadImageFile(customLogosToUpload.teamCards);
      if (customLogosToUpload.email) emailLogoURL = await uploadImageFile(customLogosToUpload.email);
      if (customLogosToUpload.slider) sliderLogoURL = await uploadImageFile(customLogosToUpload.slider);

      await api.post('/special-sponsor', {
        ...form,
        logoURL,
        logoFileId,
        navbarLogoURL,
        bubbleLogoURL,
        eventCardsLogoURL,
        teamTitleLogoURL,
        teamCardsLogoURL,
        emailLogoURL,
        sliderLogoURL
      });
      localStorage.removeItem('api_cache_/special-sponsor/active');
      showToast('Special sponsor saved successfully!');
      fetchConfig();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving sponsor', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Remove special sponsor configuration?')) return;
    try {
      await api.delete('/special-sponsor');
      localStorage.removeItem('api_cache_/special-sponsor/active');
      setSponsor(null);
      setForm({
        name: '', tagline: '',
        showFloatingBubbles: false, includeInEmails: false, showCoBrandingLogo: true,
        customFontUrl: '', customFontFamily: '', brandColor: '#ff1f01', applyBrandFont: false
      });
      setPreviewURL('');
      showToast('Special sponsor deleted');
    } catch (err) {
      showToast('Failed to delete', 'error');
    }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-form-page">
        <div className="admin-form-topbar">
          <h1>Special Sponsor Featuring & Brand Takeover</h1>
        </div>
        
        {loading ? (
          <div style={{ padding: '20px', color: '#888' }}>Loading config...</div>
        ) : (
          <div className="admin-form-card" style={{ maxWidth: '850px', margin: '20px auto', background: '#111', padding: '30px', borderRadius: '12px' }}>
            <p style={{ color: '#ccc', marginBottom: '30px', lineHeight: '1.6' }}>
              Configure a premium special sponsor takeover. Show co-branding in the navigation bar (<strong>MechaPEF × Brand</strong>), trigger dynamic floating bubbles, and apply custom brand fonts across the site headings!
            </p>
            
            <form onSubmit={handleSubmit}>
              <div className="form-grid">

                {/* Co-Branding & Display Toggles with Custom Logo Overrides */}
                <div className="form-group full" style={{ borderTop: '1px solid #333', paddingTop: '20px', marginTop: '10px' }}>
                  <h3 style={{ color: '#ff1f01', marginBottom: '8px' }}>Co-Branding Placement & Location-Specific Custom Logos</h3>
                  <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '20px', lineHeight: '1.4' }}>
                    Upload distinct custom logos for specific website placements. If no custom logo is uploaded for a placement, it automatically defaults to the Main Primary Logo above.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* Navbar */}
                    <div style={{ background: '#1a1a1a', padding: '14px', borderRadius: '8px', border: '1px solid #333' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#ddd', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        <input type="checkbox" checked={form.showCoBrandingLogo} onChange={e => f('showCoBrandingLogo', e.target.checked)} style={{ width: 'auto', accentColor: '#ff1f01' }} />
                        Navbar Co-Branding (MechaPEF × Logo)
                      </label>
                      {form.showCoBrandingLogo && (
                        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #282828', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.78rem', color: '#aaa' }}>Logo:</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {form.navbarLogoURL ? (
                                <img src={form.navbarLogoURL} alt="Navbar Logo" style={{ height: '26px', maxWidth: '60px', objectFit: 'contain', background: '#000', padding: '2px', borderRadius: '4px' }} />
                              ) : (
                                <span style={{ fontSize: '0.72rem', color: '#888' }}>Not set</span>
                              )}
                              <label className="btn-secondary" style={{ padding: '2px 7px', fontSize: '0.7rem', cursor: 'pointer', background: '#252525' }}>
                                Change
                                <input type="file" accept="image/*" hidden onChange={e => handleCustomLogoFile('navbar', e.target.files[0])} />
                              </label>
                            </div>
                          </div>
                          <input style={{ fontSize: '0.8rem', padding: '6px' }} value={form.navbarCustomName || ''} onChange={e => f('navbarCustomName', e.target.value)} placeholder="Custom Name (Optional override)" />
                          <input style={{ fontSize: '0.8rem', padding: '6px' }} value={form.navbarCustomTagline || ''} onChange={e => f('navbarCustomTagline', e.target.value)} placeholder="Custom Tagline (Optional override)" />
                        </div>
                      )}
                    </div>

                    {/* Floating Screen Bubbles */}
                    <div style={{ background: '#1a1a1a', padding: '14px', borderRadius: '8px', border: '1px solid #333' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#ddd', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        <input type="checkbox" checked={form.showFloatingBubbles} onChange={e => f('showFloatingBubbles', e.target.checked)} style={{ width: 'auto', accentColor: '#ff1f01' }} />
                        Floating Screen Bubbles
                      </label>
                      {form.showFloatingBubbles && (
                        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #282828', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.78rem', color: '#aaa' }}>Logo:</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {form.bubbleLogoURL ? (
                                <img src={form.bubbleLogoURL} alt="Bubble Logo" style={{ height: '26px', maxWidth: '60px', objectFit: 'contain', background: '#000', padding: '2px', borderRadius: '4px' }} />
                              ) : (
                                <span style={{ fontSize: '0.72rem', color: '#888' }}>Not set</span>
                              )}
                              <label className="btn-secondary" style={{ padding: '2px 7px', fontSize: '0.7rem', cursor: 'pointer', background: '#252525' }}>
                                Change
                                <input type="file" accept="image/*" hidden onChange={e => handleCustomLogoFile('bubble', e.target.files[0])} />
                              </label>
                            </div>
                          </div>
                          <input style={{ fontSize: '0.8rem', padding: '6px' }} value={form.bubbleCustomName || ''} onChange={e => f('bubbleCustomName', e.target.value)} placeholder="Custom Name (Optional override)" />
                          <input style={{ fontSize: '0.8rem', padding: '6px' }} value={form.bubbleCustomTagline || ''} onChange={e => f('bubbleCustomTagline', e.target.value)} placeholder="Custom Tagline (Optional override)" />
                        </div>
                      )}
                    </div>

                    {/* Event Cards Top-Right Logo */}
                    <div style={{ background: '#1a1a1a', padding: '14px', borderRadius: '8px', border: '1px solid #333' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#ddd', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        <input type="checkbox" checked={form.showEventCardsLogo} onChange={e => f('showEventCardsLogo', e.target.checked)} style={{ width: 'auto', accentColor: '#ff1f01' }} />
                        Event Cards Top-Right Logo
                      </label>
                      {form.showEventCardsLogo && (
                        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #282828', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.78rem', color: '#aaa' }}>Logo:</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {form.eventCardsLogoURL ? (
                                <img src={form.eventCardsLogoURL} alt="Event Cards Logo" style={{ height: '26px', maxWidth: '60px', objectFit: 'contain', background: '#000', padding: '2px', borderRadius: '4px' }} />
                              ) : (
                                <span style={{ fontSize: '0.72rem', color: '#888' }}>Not set</span>
                              )}
                              <label className="btn-secondary" style={{ padding: '2px 7px', fontSize: '0.7rem', cursor: 'pointer', background: '#252525' }}>
                                Change
                                <input type="file" accept="image/*" hidden onChange={e => handleCustomLogoFile('eventCards', e.target.files[0])} />
                              </label>
                            </div>
                          </div>
                          <input style={{ fontSize: '0.8rem', padding: '6px' }} value={form.eventCardsCustomName || ''} onChange={e => f('eventCardsCustomName', e.target.value)} placeholder="Custom Name (Optional override)" />
                          <input style={{ fontSize: '0.8rem', padding: '6px' }} value={form.eventCardsCustomTagline || ''} onChange={e => f('eventCardsCustomTagline', e.target.value)} placeholder="Custom Tagline (Optional override)" />
                        </div>
                      )}
                    </div>

                    {/* Our Team Heading Co-Branding */}
                    <div style={{ background: '#1a1a1a', padding: '14px', borderRadius: '8px', border: '1px solid #333' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#ddd', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        <input type="checkbox" checked={form.showTeamTitleCoBranding} onChange={e => f('showTeamTitleCoBranding', e.target.checked)} style={{ width: 'auto', accentColor: '#ff1f01' }} />
                        Our Team Heading Co-Branding
                      </label>
                      {form.showTeamTitleCoBranding && (
                        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #282828', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.78rem', color: '#aaa' }}>Logo:</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {form.teamTitleLogoURL ? (
                                <img src={form.teamTitleLogoURL} alt="Team Heading Logo" style={{ height: '26px', maxWidth: '60px', objectFit: 'contain', background: '#000', padding: '2px', borderRadius: '4px' }} />
                              ) : (
                                <span style={{ fontSize: '0.72rem', color: '#888' }}>Not set</span>
                              )}
                              <label className="btn-secondary" style={{ padding: '2px 7px', fontSize: '0.7rem', cursor: 'pointer', background: '#252525' }}>
                                Change
                                <input type="file" accept="image/*" hidden onChange={e => handleCustomLogoFile('teamTitle', e.target.files[0])} />
                              </label>
                            </div>
                          </div>
                          <input style={{ fontSize: '0.8rem', padding: '6px' }} value={form.teamTitleCustomName || ''} onChange={e => f('teamTitleCustomName', e.target.value)} placeholder="Custom Name (Optional override)" />
                          <input style={{ fontSize: '0.8rem', padding: '6px' }} value={form.teamTitleCustomTagline || ''} onChange={e => f('teamTitleCustomTagline', e.target.value)} placeholder="Custom Tagline (Optional override)" />
                        </div>
                      )}
                    </div>

                    {/* Team Member Cards Logo */}
                    <div style={{ background: '#1a1a1a', padding: '14px', borderRadius: '8px', border: '1px solid #333' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#ddd', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        <input type="checkbox" checked={form.showTeamCardsLogo} onChange={e => f('showTeamCardsLogo', e.target.checked)} style={{ width: 'auto', accentColor: '#ff1f01' }} />
                        Team Member Photo Cards Logo
                      </label>
                      {form.showTeamCardsLogo && (
                        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #282828', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.78rem', color: '#aaa' }}>Logo:</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {form.teamCardsLogoURL ? (
                                <img src={form.teamCardsLogoURL} alt="Team Cards Logo" style={{ height: '26px', maxWidth: '60px', objectFit: 'contain', background: '#000', padding: '2px', borderRadius: '4px' }} />
                              ) : (
                                <span style={{ fontSize: '0.72rem', color: '#888' }}>Not set</span>
                              )}
                              <label className="btn-secondary" style={{ padding: '2px 7px', fontSize: '0.7rem', cursor: 'pointer', background: '#252525' }}>
                                Change
                                <input type="file" accept="image/*" hidden onChange={e => handleCustomLogoFile('teamCards', e.target.files[0])} />
                              </label>
                            </div>
                          </div>
                          <input style={{ fontSize: '0.8rem', padding: '6px' }} value={form.teamCardsCustomName || ''} onChange={e => f('teamCardsCustomName', e.target.value)} placeholder="Custom Name (Optional override)" />
                          <input style={{ fontSize: '0.8rem', padding: '6px' }} value={form.teamCardsCustomTagline || ''} onChange={e => f('teamCardsCustomTagline', e.target.value)} placeholder="Custom Tagline (Optional override)" />
                        </div>
                      )}
                    </div>

                    {/* Registration Emails */}
                    <div style={{ background: '#1a1a1a', padding: '14px', borderRadius: '8px', border: '1px solid #333' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#ddd', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        <input type="checkbox" checked={form.includeInEmails} onChange={e => f('includeInEmails', e.target.checked)} style={{ width: 'auto', accentColor: '#ff1f01' }} />
                        Include Logo in Registration Emails
                      </label>
                      {form.includeInEmails && (
                        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #282828', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.78rem', color: '#aaa' }}>Logo:</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {form.emailLogoURL ? (
                                <img src={form.emailLogoURL} alt="Email Logo" style={{ height: '26px', maxWidth: '60px', objectFit: 'contain', background: '#000', padding: '2px', borderRadius: '4px' }} />
                              ) : (
                                <span style={{ fontSize: '0.72rem', color: '#888' }}>Not set</span>
                              )}
                              <label className="btn-secondary" style={{ padding: '2px 7px', fontSize: '0.7rem', cursor: 'pointer', background: '#252525' }}>
                                Change
                                <input type="file" accept="image/*" hidden onChange={e => handleCustomLogoFile('email', e.target.files[0])} />
                              </label>
                            </div>
                          </div>
                          <input style={{ fontSize: '0.8rem', padding: '6px' }} value={form.emailCustomName || ''} onChange={e => f('emailCustomName', e.target.value)} placeholder="Custom Name (Optional override)" />
                          <input style={{ fontSize: '0.8rem', padding: '6px' }} value={form.emailCustomTagline || ''} onChange={e => f('emailCustomTagline', e.target.value)} placeholder="Custom Tagline (Optional override)" />
                        </div>
                      )}
                    </div>

                    {/* Announcement Banner Slider */}
                    <div style={{ background: '#1a1a1a', padding: '14px', borderRadius: '8px', border: '1px solid #333' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#ddd', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        <input type="checkbox" checked={form.showAnnouncementSliderLogo} onChange={e => f('showAnnouncementSliderLogo', e.target.checked)} style={{ width: 'auto', accentColor: '#ff1f01' }} />
                        Home Announcement Slider Co-Branding
                      </label>
                      {form.showAnnouncementSliderLogo && (
                        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #282828', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.78rem', color: '#aaa' }}>Logo:</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {form.sliderLogoURL ? (
                                <img src={form.sliderLogoURL} alt="Slider Logo" style={{ height: '26px', maxWidth: '60px', objectFit: 'contain', background: '#000', padding: '2px', borderRadius: '4px' }} />
                              ) : (
                                <span style={{ fontSize: '0.72rem', color: '#888' }}>Not set</span>
                              )}
                              <label className="btn-secondary" style={{ padding: '2px 7px', fontSize: '0.7rem', cursor: 'pointer', background: '#252525' }}>
                                Change
                                <input type="file" accept="image/*" hidden onChange={e => handleCustomLogoFile('slider', e.target.files[0])} />
                              </label>
                            </div>
                          </div>
                          <input style={{ fontSize: '0.8rem', padding: '6px' }} value={form.sliderCustomName || ''} onChange={e => f('sliderCustomName', e.target.value)} placeholder="Custom Name (Optional override)" />
                          <input style={{ fontSize: '0.8rem', padding: '6px' }} value={form.sliderCustomTagline || ''} onChange={e => f('sliderCustomTagline', e.target.value)} placeholder="Custom Tagline (Optional override)" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Brand Font & Color Takeover Section */}
                <div className="form-group full" style={{ borderTop: '1px solid #333', paddingTop: '20px', marginTop: '15px' }}>
                  <h3 style={{ color: '#ffcc00', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🎨 Brand Typography & Color Takeover
                  </h3>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#fff', fontWeight: 'bold', marginBottom: '15px' }}>
                    <input type="checkbox" checked={form.applyBrandFont} onChange={e => f('applyBrandFont', e.target.checked)} style={{ width: 'auto' }} />
                    Enable Brand Font & Color Takeover for Section Headings
                  </label>

                  {form.applyBrandFont && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', background: '#181818', padding: '20px', borderRadius: '10px', border: '1px solid #333' }}>
                      <div className="form-group">
                        <label>Custom Font CSS / Google Font URL</label>
                        <input 
                          value={form.customFontUrl} 
                          onChange={e => f('customFontUrl', e.target.value)} 
                          placeholder="e.g. https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap" 
                        />
                      </div>

                      <div className="form-group">
                        <label>Font Family Name</label>
                        <input 
                          value={form.customFontFamily} 
                          onChange={e => f('customFontFamily', e.target.value)} 
                          placeholder="e.g. 'Permanent Marker', cursive" 
                        />
                      </div>

                      <div className="form-group">
                        <label>Brand Accent Color</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <input 
                            type="color" 
                            value={form.brandColor} 
                            onChange={e => f('brandColor', e.target.value)}
                            style={{ width: '50px', height: '40px', padding: '0', cursor: 'pointer', border: 'none', background: 'transparent' }} 
                          />
                          <input 
                            type="text" 
                            value={form.brandColor} 
                            onChange={e => f('brandColor', e.target.value)}
                            placeholder="#ff1f01" 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
              </div>

              <div className="modal-actions" style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
                {sponsor ? (
                  <button type="button" className="btn-danger" onClick={handleDelete}><FaTrash /> Remove Sponsor</button>
                ) : <div />}
                
                <button type="submit" className="btn-primary" disabled={submitting}>
                  <FaSave style={{ marginRight: '8px' }} /> {submitting ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
      {toast && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}

      {/* Cropper Modal via Portal */}
      {cropSrc && createPortal(
        <div
          className="cropper-modal-overlay"
          onClick={() => { setCropSrc(null); setCropperTarget(null); }}
        >
          <div className="cropper-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="cropper-modal-header">
              <h3><FaCrop /> Crop Sponsor Logo ({cropperTarget === 'main' ? 'Main Primary Logo' : cropperTarget})</h3>
              <button className="cropper-close-btn" onClick={() => { setCropSrc(null); setCropperTarget(null); }}>
                <FaTimesCircle />
              </button>
            </div>

            <div className="cropper-modal-body">
              <Cropper
                ref={cropperRef}
                src={cropSrc}
                style={{ height: '380px', width: '100%' }}
                aspectRatio={NaN}
                guides={true}
                viewMode={1}
                autoCropArea={0.9}
                background={false}
                responsive={true}
                checkOrientation={false}
                cropBoxResizable={true}
                zoomable={true}
                dragMode="move"
              />
            </div>

            <div className="cropper-modal-footer">
              <button className="cropper-btn-cancel" onClick={() => { setCropSrc(null); setCropperTarget(null); }}>
                Cancel
              </button>
              <button className="cropper-btn-save" onClick={applyCrop}>
                <FaUpload /> Crop & Use Logo
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminSpecialSponsor;
