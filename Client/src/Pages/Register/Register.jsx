import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaLock, FaEnvelope, FaIdCard, FaPhone, FaGraduationCap, FaArrowLeft } from 'react-icons/fa';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Register.css';

// ADD: official Microsoft / Office 365 Education signup — where an MNNIT student
// activates their college email account (required before "Sign up with Microsoft" works)
const MS_ACCOUNT_ACTIVATION_URL = 'https://share.google/A2V29y45hFCHFZYe9';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // If we want to auto-login after register, or we can just navigate to login
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    collegeRegNo: '',
    password: '',
    confirmPassword: '',
    yearOfStudy: '1',
    branch: '',
    branch: '',
    phoneNumber: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const validateMnnitEmail = (email) => {
    return /^[a-z]+\.[0-9]+@mnnit\.ac\.in$/.test(email.toLowerCase());
  };

  const handleMicrosoftLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const { authService } = await import('../../services/services');
      const res = await authService.getMicrosoftUrl();
      if (res.data.data.code_verifier) {
          sessionStorage.setItem('ms_pkce_verifier', res.data.data.code_verifier);
      }
      window.location.href = res.data.data.url;
    } catch (err) {
      console.error('Failed to get Microsoft login URL:', err);
      setError('Failed to initiate Microsoft registration');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!validateMnnitEmail(form.email)) {
      setError("Please use a valid MNNIT email (e.g. firstname.20249000@mnnit.ac.in)");
      return;
    }

    const regnoFromEmail = form.email.toLowerCase().split('.')[1]?.split('@')[0];
    if (regnoFromEmail !== form.collegeRegNo.toLowerCase()) {
      setError("Wrong credential");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        collegeRegNo: form.collegeRegNo,
        yearOfStudy: Number(form.yearOfStudy),
        branch: form.branch,
        phoneNumber: form.phoneNumber
      });

      setSuccess(true);
      
      setTimeout(() => {
        navigate('/login');
      }, 4000);

    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ color: '#00c864', fontSize: '4rem', marginBottom: '20px' }}>✓</div>
          <h2 style={{ color: '#fff', marginBottom: '15px' }}>Registration Successful!</h2>
          <p style={{ color: '#aaa', marginBottom: '30px', lineHeight: '1.6' }}>
            Your account has been created successfully. You can now login.
          </p>

          {/* ADD */}
          <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '20px' }}>
            Facing a problem? Activate your email here —{' '}
            <a href={MS_ACCOUNT_ACTIVATION_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#0078d4' }}>
              visit this link
            </a>
          </p>

          <p style={{ color: '#555', fontSize: '0.9rem' }}>Redirecting to login...</p>
          <Link to="/login" className="auth-btn" style={{ display: 'inline-block', marginTop: '20px', textDecoration: 'none' }}>Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* Background elements */}
      <div className="auth-bg-circle auth-circle-1" />
      <div className="auth-bg-circle auth-circle-2" />

      <div className="auth-container register-container">
        <Link to="/" className="auth-back"><FaArrowLeft /> Back to Home</Link>
        
        <div className="auth-header">
          <div className="auth-logo">Mecha<span>PEF</span></div>
          <h2>Join the Community</h2>
          <p>MNNIT Students Only</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="auth-input-group">
              <FaUser className="auth-icon" />
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="auth-input-group">
              <FaIdCard className="auth-icon" />
              <input
                type="text"
                name="collegeRegNo"
                placeholder="Registration No (e.g. 20249000)"
                value={form.collegeRegNo}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="auth-input-group">
            <FaEnvelope className="auth-icon" />
            <input
              type="email"
              name="email"
              placeholder="MNNIT Email (firstname.regno@mnnit.ac.in)"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="auth-input-group">
              <FaLock className="auth-icon" />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
                minLength="8"
              />
            </div>
            
            <div className="auth-input-group">
              <FaLock className="auth-icon" />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>



          <div className="form-row">
            <div className="auth-input-group">
              <FaGraduationCap className="auth-icon" />
              <select name="yearOfStudy" value={form.yearOfStudy} onChange={handleChange} required>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
            
            <div className="auth-input-group">
              <FaUser className="auth-icon" />
              <input
                type="text"
                name="branch"
                placeholder="Branch"
                value={form.branch}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="auth-input-group">
            <FaPhone className="auth-icon" />
            <input
              type="tel"
              name="phoneNumber"
              placeholder="Phone Number (Optional)"
              value={form.phoneNumber}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
          
          <div className="login-divider" style={{ margin: '20px 0', textAlign: 'center', color: '#888' }}>
            <span>OR</span>
          </div>

          <button type="button" className="auth-btn" style={{ background: '#0078d4', borderColor: '#0078d4' }} onClick={handleMicrosoftLogin} disabled={loading}>
            Sign up with Microsoft
          </button>

          {/* ADD */}
          <p style={{ margin: '12px 0 0 0', textAlign: 'center', fontSize: '0.82rem', color: '#888', lineHeight: '1.5' }}>
            If you are facing a problem, activate your email through this —{' '}
            <a
              href={MS_ACCOUNT_ACTIVATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#0078d4', fontWeight: 'bold', textDecoration: 'underline' }}
            >
              visit here
            </a>
          </p>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
