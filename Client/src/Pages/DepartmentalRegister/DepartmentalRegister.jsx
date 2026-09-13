import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../services/api';

const DepartmentalRegister = () => {
  const [form, setForm] = useState({ name: '', phoneNumber: '', collegeRegNo: '', collegeEmail: '' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const eventId = new URLSearchParams(window.location.search).get('eventId');

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await api.post('/departmental-registrations', { ...form, eventId });
      setResult(res.data.data);
    } catch (err) { setError(err.response?.data?.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  const download = () => {
    const svg = document.querySelector('#departmental-qr');
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `${form.collegeRegNo}-departmental-qr.svg`; link.click(); URL.revokeObjectURL(url);
  };

  return <main style={{ minHeight: '100vh', background: '#080808', color: '#fff', padding: '48px 20px', fontFamily: 'Arial, sans-serif' }}>
    <div style={{ maxWidth: 520, margin: '0 auto', background: '#151515', border: '1px solid #333', padding: 28, borderRadius: 12 }}>
      <h1 style={{ color: '#ff1f01', marginTop: 0 }}>Departmental Registration</h1>
      {!result ? <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        {[["name", "Full Name"], ["phoneNumber", "Phone Number"], ["collegeRegNo", "Registration Number (20269 / 20247 / 20246 / 20257 / 20256...)"], ["collegeEmail", "College Email (name.REGNO@mnnit.ac.in)"]].map(([key, label]) => <label key={key} style={{ display: 'grid', gap: 6 }}><span>{label}</span><input required value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={{ padding: 12, borderRadius: 6, border: '1px solid #555', background: '#222', color: '#fff' }} /></label>)}
        {error && <p style={{ color: '#ff4444' }}>{error}</p>}
        <button disabled={loading || !eventId} style={{ padding: 13, background: '#ff1f01', color: '#fff', border: 0, borderRadius: 6, fontWeight: 700 }}>{loading ? 'Creating...' : 'Generate QR'}</button>
        {!eventId && <small style={{ color: '#ffaa00' }}>Open this page from the endorsed event link.</small>}
      </form> : <div style={{ textAlign: 'center' }}><p>Registration successful for <strong>{result.registration.name}</strong>.</p><div style={{ background: '#fff', display: 'inline-block', padding: 16 }}><QRCodeSVG id="departmental-qr" value={JSON.stringify({ type: 'departmental-registration', token: result.qrToken })} size={240} /></div><br /><button onClick={download} style={{ marginTop: 20, padding: 12, background: '#ff1f01', color: '#fff', border: 0, borderRadius: 6 }}>Download QR</button></div>}
    </div>
  </main>;
};
export default DepartmentalRegister;
