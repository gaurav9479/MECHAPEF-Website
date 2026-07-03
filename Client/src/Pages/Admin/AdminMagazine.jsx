import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import api from '../../services/api';
import './AdminDashboard.css';
import { FaPlus, FaTrash } from 'react-icons/fa';
import CropperInput from '../../components/CropperInput/CropperInput';

const AdminMagazine = () => {
  const [toast, setToast] = useState(null);
  
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [form, setForm] = useState({
    title: '', volumeNumber: '', issueNumber: '', publishDate: '', coverImageURL: '', shortDescription: '', status: 'Draft',
    heroStory: { heading: '', subHeading: '', description: '', imageURL: '' },
    inDepthAnalysis: { heading: '', author: '', description: '', imageURL: '' },
    featuredStories: [],
    newsCards: [],
    sidebarArticles: [],
    opinionColumns: [],
    mixedArticles: [],
    advertisement: { bannerImageURL: '', redirectLink: '', isEnabled: false },
    categories: [],
    seo: { pageTitle: '', metaDescription: '', keywords: '' }
  });

  useEffect(() => {
    fetchMagazine();
  }, []);

  const fetchMagazine = async () => {
    try {
      const res = await api.get('/magazine');
      if (res.data.data?.magazine) {
        const m = res.data.data.magazine;
        setForm({
          ...m,
          heroStory: m.heroStory || { heading: '', subHeading: '', description: '', imageURL: '' },
          inDepthAnalysis: m.inDepthAnalysis || { heading: '', author: '', description: '', imageURL: '' },
          featuredStories: m.featuredStories || [],
          newsCards: m.newsCards || [],
          sidebarArticles: m.sidebarArticles || [],
          opinionColumns: m.opinionColumns || [],
          mixedArticles: m.mixedArticles || [],
          advertisement: m.advertisement || { bannerImageURL: '', redirectLink: '', isEnabled: false },
          seo: m.seo || { pageTitle: '', metaDescription: '', keywords: '' },
          categories: m.categories || []
        });
      }
    } catch (err) {
      showToast('Failed to load magazine data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/magazine', form);
      showToast('Magazine updated successfully!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e, path, index = null) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return showToast('Image size should be less than 2MB', 'error');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'magazine');

    setUploading(true);
    try {
      const res = await api.post('/upload/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data.data.url;

      if (path === 'featuredStories') {
        const newArr = [...form.featuredStories];
        newArr[index] = { ...newArr[index], imageURL: url };
        setForm({ ...form, featuredStories: newArr });
      } else if (path === 'mixedArticles') {
        const newArr = [...form.mixedArticles];
        newArr[index] = { ...newArr[index], imageURL: url };
        setForm({ ...form, mixedArticles: newArr });
      } else if (path === 'newsCards') {
        const newArr = [...form.newsCards];
        newArr[index] = { ...newArr[index], imageURL: url };
        setForm({ ...form, newsCards: newArr });
      } else if (path.startsWith('heroStory.')) {
        setForm({ ...form, heroStory: { ...form.heroStory, imageURL: url } });
      } else if (path.startsWith('inDepthAnalysis.')) {
        setForm({ ...form, inDepthAnalysis: { ...form.inDepthAnalysis, imageURL: url } });
      } else if (path.startsWith('advertisement.')) {
        setForm({ ...form, advertisement: { ...form.advertisement, bannerImageURL: url } });
      } else {
        setForm({ ...form, [path]: url });
      }
      showToast('Image uploaded!');
    } catch (err) {
      showToast('Image upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const updateArrayItem = (arrayName, index, field, value) => {
    const newArr = [...form[arrayName]];
    newArr[index] = { ...newArr[index], [field]: value };
    setForm({ ...form, [arrayName]: newArr });
  };

  const addArrayItem = (arrayName, defaultObj) => {
    setForm({ ...form, [arrayName]: [...form[arrayName], defaultObj] });
  };

  const removeArrayItem = (arrayName, index) => {
    const newArr = [...form[arrayName]];
    newArr.splice(index, 1);
    setForm({ ...form, [arrayName]: newArr });
  };

  if (loading) return <div className="admin-layout"><AdminSidebar /><main className="admin-form-page"><h2>Loading...</h2></main></div>;

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-form-page">
        <div className="admin-form-topbar">
          <h1>Manage Magazine (Newspaper Edition)</h1>
        </div>
        
        <form onSubmit={handleSave} className="admin-form-container">
          
          {/* MAGAZINE INFO */}
          <h3>Magazine Information</h3>
          <div className="admin-form-grid">
            <div className="form-group">
              <label>Magazine Title</label>
              <input value={form.title || ''} onChange={e => setForm({...form, title: e.target.value})} maxLength={80} required />
            </div>
            <div className="form-group">
              <label>Volume Number</label>
              <input value={form.volumeNumber || ''} onChange={e => setForm({...form, volumeNumber: e.target.value})} placeholder="e.g. Vol. 1" />
            </div>
            <div className="form-group">
              <label>Issue Number</label>
              <input value={form.issueNumber || ''} onChange={e => setForm({...form, issueNumber: e.target.value})} placeholder="e.g. Issue 1" />
            </div>
            <div className="form-group">
              <label>Publish Date</label>
              <input type="date" value={form.publishDate || ''} onChange={e => setForm({...form, publishDate: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </select>
            </div>
            <div className="form-group full">
              <label>Short Description (Max 250)</label>
              <textarea value={form.shortDescription || ''} onChange={e => setForm({...form, shortDescription: e.target.value})} maxLength={250} rows={2}></textarea>
              <small>{(form.shortDescription || '').length}/250 chars</small>
            </div>
          </div>

          <hr style={{margin: '30px 0', borderColor: '#333'}} />
          
          {/* HERO STORY */}
          <h3>Hero Story (Main Front Page)</h3>
          <div className="admin-form-grid">
            <div className="form-group full">
              <label>Hero Image</label>
              <CropperInput
                initialImage={form.heroStory.imageURL}
                aspect={16/9}
                onSave={(url) => setForm({ ...form, heroStory: { ...form.heroStory, imageURL: url } })}
                label="Upload Hero Image (16:9)"
              />
            </div>
            <div className="form-group full">
              <label>Heading (Max 80 chars)</label>
              <input value={form.heroStory.heading || ''} onChange={e => setForm({...form, heroStory: {...form.heroStory, heading: e.target.value}})} maxLength={80} />
              <small>{(form.heroStory.heading || '').length}/80 chars</small>
            </div>
            <div className="form-group full">
              <label>Sub Heading (Max 150 chars)</label>
              <input value={form.heroStory.subHeading || ''} onChange={e => setForm({...form, heroStory: {...form.heroStory, subHeading: e.target.value}})} maxLength={150} />
              <small>{(form.heroStory.subHeading || '').length}/150 chars</small>
            </div>
            <div className="form-group full">
              <label>Description (Max 500 chars)</label>
              <textarea value={form.heroStory.description || ''} onChange={e => setForm({...form, heroStory: {...form.heroStory, description: e.target.value}})} maxLength={500} rows={5}></textarea>
              <small>{(form.heroStory.description || '').length}/500 chars</small>
            </div>
          </div>

          <hr style={{margin: '30px 0', borderColor: '#333'}} />

          {/* FEATURED STORIES */}
          <h3>Featured Stories</h3>
          <div className="admin-array-list">
            {form.featuredStories.map((item, i) => (
              <div key={i} className="admin-array-item" style={{ border: '1px solid #333', padding: '15px', marginBottom: '15px', borderRadius: '8px', position: 'relative' }}>
                <button type="button" onClick={() => removeArrayItem('featuredStories', i)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'red', color: '#fff', border: 'none', padding: '5px 10px', cursor: 'pointer' }}><FaTrash /></button>
                <div className="form-group">
                  <label>Category</label>
                  <input value={item.category || ''} onChange={e => updateArrayItem('featuredStories', i, 'category', e.target.value)} placeholder="e.g. Technology" />
                </div>
                <div className="form-group">
                  <label>Date (e.g. July 2, 2026)</label>
                  <input value={item.date || ''} onChange={e => updateArrayItem('featuredStories', i, 'date', e.target.value)} maxLength={20} />
                </div>
                <div className="form-group">
                  <label>Layout Type</label>
                  <select value={item.layoutType || 'top-down'} onChange={e => updateArrayItem('featuredStories', i, 'layoutType', e.target.value)}>
                    <option value="top-down">Top Down (Image above text)</option>
                    <option value="left-right">Left Right (Image beside text)</option>
                  </select>
                </div>
                <div className="form-group full">
                  <label>Image</label>
                  <CropperInput
                    initialImage={item.imageURL}
                    aspect={4/3}
                    onSave={(url) => updateArrayItem('featuredStories', i, 'imageURL', url)}
                    label="Upload Image (4:3)"
                  />
                </div>
                <div className="form-group full">
                  <label>Heading (Max 70 chars)</label>
                  <input value={item.heading || ''} onChange={e => updateArrayItem('featuredStories', i, 'heading', e.target.value)} maxLength={70} />
                  <small>{(item.heading || '').length}/70 chars</small>
                </div>
                <div className="form-group full">
                  <label>Short Description (Max 250 chars)</label>
                  <textarea value={item.shortDescription || ''} onChange={e => updateArrayItem('featuredStories', i, 'shortDescription', e.target.value)} maxLength={250} rows={3}></textarea>
                  <small>{(item.shortDescription || '').length}/250 chars</small>
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="btn-secondary" onClick={() => addArrayItem('featuredStories', { category: '', date: '', layoutType: 'top-down', heading: '', shortDescription: '', imageURL: '' })}><FaPlus /> Add Featured Story</button>

          <hr style={{margin: '30px 0', borderColor: '#333'}} />

          {/* NEWS CARDS */}
          <h3>News Cards</h3>
          <div className="admin-array-list" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
            {form.newsCards.map((item, i) => (
              <div key={i} style={{ border: '1px solid #333', padding: '15px', borderRadius: '8px', position: 'relative' }}>
                <button type="button" onClick={() => removeArrayItem('newsCards', i)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'red', color: '#fff', border: 'none', padding: '5px', cursor: 'pointer' }}><FaTrash /></button>
                <div className="form-group">
                  <label>Category</label>
                  <input value={item.category || ''} onChange={e => updateArrayItem('newsCards', i, 'category', e.target.value)} />
                </div>
                <div className="form-group full">
                  <label>Heading (Max 60 chars)</label>
                  <input value={item.heading || ''} onChange={e => updateArrayItem('newsCards', i, 'heading', e.target.value)} maxLength={60} />
                  <small>{(item.heading || '').length}/60 chars</small>
                </div>
                <div className="form-group full">
                  <label>Image</label>
                  <CropperInput
                    initialImage={item.imageURL}
                    aspect={1}
                    onSave={(url) => updateArrayItem('newsCards', i, 'imageURL', url)}
                    label="Upload Image (1:1)"
                  />
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="btn-secondary" onClick={() => addArrayItem('newsCards', { category: '', heading: '', imageURL: '' })}><FaPlus /> Add News Card</button>

          <hr style={{margin: '30px 0', borderColor: '#333'}} />

          {/* SIDEBAR ARTICLES */}
          <h3>Sidebar Articles</h3>
          <div className="admin-array-list">
            {form.sidebarArticles.map((item, i) => (
              <div key={i} style={{ border: '1px solid #333', padding: '15px', marginBottom: '15px', borderRadius: '8px', position: 'relative' }}>
                <button type="button" onClick={() => removeArrayItem('sidebarArticles', i)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'red', color: '#fff', border: 'none', padding: '5px', cursor: 'pointer' }}><FaTrash /></button>
                <div className="form-group full">
                  <label>Heading (Max 60 chars)</label>
                  <input value={item.heading || ''} onChange={e => updateArrayItem('sidebarArticles', i, 'heading', e.target.value)} maxLength={60} />
                  <small>{(item.heading || '').length}/60 chars</small>
                </div>
                <div className="form-group full">
                  <label>Description (Max 150 chars)</label>
                  <textarea value={item.smallDescription || ''} onChange={e => updateArrayItem('sidebarArticles', i, 'smallDescription', e.target.value)} maxLength={150} rows={2}></textarea>
                  <small>{(item.smallDescription || '').length}/150 chars</small>
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="btn-secondary" onClick={() => addArrayItem('sidebarArticles', { heading: '', smallDescription: '' })}><FaPlus /> Add Sidebar Article</button>

          <hr style={{margin: '30px 0', borderColor: '#333'}} />

          {/* IN-DEPTH ANALYSIS */}
          <h3>In-Depth Analysis (Full Width Layout)</h3>
          <div className="admin-form-grid">
            <div className="form-group full">
              <label>Analysis Image</label>
              <CropperInput
                initialImage={form.inDepthAnalysis.imageURL}
                aspect={16/9}
                onSave={(url) => setForm({ ...form, inDepthAnalysis: { ...form.inDepthAnalysis, imageURL: url } })}
                label="Upload Image (16:9)"
              />
            </div>
            <div className="form-group full">
              <label>Heading (Max 100 chars)</label>
              <input value={form.inDepthAnalysis.heading || ''} onChange={e => setForm({...form, inDepthAnalysis: {...form.inDepthAnalysis, heading: e.target.value}})} maxLength={100} />
              <small>{(form.inDepthAnalysis.heading || '').length}/100 chars</small>
            </div>
            <div className="form-group">
              <label>Author (Max 40 chars)</label>
              <input value={form.inDepthAnalysis.author || ''} onChange={e => setForm({...form, inDepthAnalysis: {...form.inDepthAnalysis, author: e.target.value}})} maxLength={40} />
              <small>{(form.inDepthAnalysis.author || '').length}/40 chars</small>
            </div>
            <div className="form-group full">
              <label>Description (Max 800 chars)</label>
              <textarea value={form.inDepthAnalysis.description || ''} onChange={e => setForm({...form, inDepthAnalysis: {...form.inDepthAnalysis, description: e.target.value}})} maxLength={800} rows={5}></textarea>
              <small>{(form.inDepthAnalysis.description || '').length}/800 chars</small>
            </div>
          </div>

          <hr style={{margin: '30px 0', borderColor: '#333'}} />

          {/* OPINION COLUMNS */}
          <h3>Opinion Columns (Bottom Grid)</h3>
          <div className="admin-array-list">
            {form.opinionColumns.map((item, i) => (
              <div key={`opinion-${i}`} style={{ border: '1px solid #333', padding: '15px', marginBottom: '15px', borderRadius: '8px', position: 'relative' }}>
                <button type="button" onClick={() => removeArrayItem('opinionColumns', i)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'red', color: '#fff', border: 'none', padding: '5px', cursor: 'pointer' }}><FaTrash /></button>
                <div className="form-group">
                  <label>Author (Max 40 chars)</label>
                  <input value={item.author || ''} onChange={e => updateArrayItem('opinionColumns', i, 'author', e.target.value)} maxLength={40} />
                </div>
                <div className="form-group full">
                  <label>Heading (Max 60 chars)</label>
                  <input value={item.heading || ''} onChange={e => updateArrayItem('opinionColumns', i, 'heading', e.target.value)} maxLength={60} />
                  <small>{(item.heading || '').length}/60 chars</small>
                </div>
                <div className="form-group full">
                  <label>Content (Max 300 chars)</label>
                  <textarea value={item.content || ''} onChange={e => updateArrayItem('opinionColumns', i, 'content', e.target.value)} maxLength={300} rows={3}></textarea>
                  <small>{(item.content || '').length}/300 chars</small>
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="btn-secondary" onClick={() => addArrayItem('opinionColumns', { author: '', heading: '', content: '' })}><FaPlus /> Add Opinion Column</button>

          <hr style={{margin: '30px 0', borderColor: '#333'}} />

          {/* MIXED ARTICLES (LONG FEED) */}
          <h3>The Long Feed (Mixed Articles)</h3>
          <div className="admin-array-list">
            {form.mixedArticles.map((item, i) => (
              <div key={`mixed-${i}`} style={{ border: '1px solid #333', padding: '15px', marginBottom: '15px', borderRadius: '8px', position: 'relative' }}>
                <button type="button" onClick={() => removeArrayItem('mixedArticles', i)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'red', color: '#fff', border: 'none', padding: '5px', cursor: 'pointer' }}><FaTrash /></button>
                <div className="form-group">
                  <label>Category</label>
                  <input value={item.category || ''} onChange={e => updateArrayItem('mixedArticles', i, 'category', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Date (Max 20 chars)</label>
                  <input value={item.date || ''} onChange={e => updateArrayItem('mixedArticles', i, 'date', e.target.value)} maxLength={20} />
                </div>
                <div className="form-group">
                  <label>Layout Type</label>
                  <select value={item.layoutType || 'top-down'} onChange={e => updateArrayItem('mixedArticles', i, 'layoutType', e.target.value)}>
                    <option value="top-down">Top Down (Image above text)</option>
                    <option value="left-right">Left Right (Image beside text)</option>
                  </select>
                </div>
                <div className="form-group full">
                  <label>Image</label>
                  <CropperInput
                    initialImage={item.imageURL}
                    aspect={4/3}
                    onSave={(url) => updateArrayItem('mixedArticles', i, 'imageURL', url)}
                    label="Upload Image (4:3)"
                  />
                </div>
                <div className="form-group full">
                  <label>Heading (Max 100 chars)</label>
                  <input value={item.heading || ''} onChange={e => updateArrayItem('mixedArticles', i, 'heading', e.target.value)} maxLength={100} />
                  <small>{(item.heading || '').length}/100 chars</small>
                </div>
                <div className="form-group full">
                  <label>Description (Max 500 chars)</label>
                  <textarea value={item.description || ''} onChange={e => updateArrayItem('mixedArticles', i, 'description', e.target.value)} maxLength={500} rows={4}></textarea>
                  <small>{(item.description || '').length}/500 chars</small>
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="btn-secondary" onClick={() => addArrayItem('mixedArticles', { category: '', date: '', layoutType: 'top-down', heading: '', description: '', imageURL: '' })}><FaPlus /> Add Mixed Article</button>

          <hr style={{margin: '30px 0', borderColor: '#333'}} />

          {/* ADVERTISEMENT */}
          <h3>Advertisement / Banner Section</h3>
          <div className="admin-form-grid">
            <div className="form-group">
              <label>Enable Banner?</label>
              <select value={form.advertisement.isEnabled ? 'true' : 'false'} onChange={e => setForm({...form, advertisement: {...form.advertisement, isEnabled: e.target.value === 'true'}})}>
                <option value="false">Disabled</option>
                <option value="true">Enabled</option>
              </select>
            </div>
            <div className="form-group full">
              <label>Banner Image</label>
              <CropperInput
                initialImage={form.advertisement.bannerImageURL}
                aspect={4/1}
                onSave={(url) => setForm({ ...form, advertisement: { ...form.advertisement, bannerImageURL: url } })}
                label="Upload Banner (4:1)"
              />
            </div>
            <div className="form-group full">
              <label>Redirect Link</label>
              <input value={form.advertisement.redirectLink || ''} onChange={e => setForm({...form, advertisement: {...form.advertisement, redirectLink: e.target.value}})} placeholder="https://" />
            </div>
          </div>

          <hr style={{margin: '30px 0', borderColor: '#333'}} />

          {/* SEO FIELDS */}
          <h3>SEO Fields</h3>
          <div className="admin-form-grid">
            <div className="form-group full">
              <label>Page Title</label>
              <input value={form.seo.pageTitle || ''} onChange={e => setForm({...form, seo: {...form.seo, pageTitle: e.target.value}})} />
            </div>
            <div className="form-group full">
              <label>Meta Description</label>
              <textarea value={form.seo.metaDescription || ''} onChange={e => setForm({...form, seo: {...form.seo, metaDescription: e.target.value}})} rows={2}></textarea>
            </div>
            <div className="form-group full">
              <label>Keywords (Comma separated)</label>
              <input value={form.seo.keywords || ''} onChange={e => setForm({...form, seo: {...form.seo, keywords: e.target.value}})} />
            </div>
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="primary-btn" disabled={saving || uploading}>
              {saving ? 'Saving...' : 'Save Magazine Settings'}
            </button>
          </div>
        </form>

        {toast && (
          <div className={`toast ${toast.type}`}>
            {toast.msg}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminMagazine;
