import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/services';
import { FaCog, FaEye, FaEyeSlash } from 'react-icons/fa';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, microsoftLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  // Handle Microsoft OAuth Callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code && !loading) {
      setLoading(true);
      const verifier = sessionStorage.getItem('ms_pkce_verifier');
      microsoftLogin(code, verifier)
        .then(() => {
          sessionStorage.removeItem('ms_pkce_verifier'); // Clean up
          // Clear URL and redirect
          window.history.replaceState({}, document.title, window.location.pathname);
          navigate(from, { replace: true });
        })
        .catch((err) => {
          console.error('Microsoft login failed:', err);
          setError(err.response?.data?.message || 'Microsoft login failed');
          window.history.replaceState({}, document.title, window.location.pathname);
          setLoading(false);
        });
    }
  }, [microsoftLogin, navigate, from, loading]);

  const handleMicrosoftLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await authService.getMicrosoftUrl();
      if (res.data.data.code_verifier) {
          sessionStorage.setItem('ms_pkce_verifier', res.data.data.code_verifier);
      }
      window.location.href = res.data.data.url;
    } catch (err) {
      console.error('Failed to get Microsoft login URL:', err);
      setError('Failed to initiate Microsoft login');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);

      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-bg-strip login-strip-1"></div>
      <div className="login-bg-strip login-strip-2"></div>

      <div className="login-card">

        <div className="login-logo">
          <FaCog className="login-logo-icon" />
          <div>
            <div className="login-logo-main">Mecha<span>PEF</span></div>
            <div className="login-logo-sub">Admin Portal</div>
          </div>
        </div>

        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Sign in to manage MechaPEF</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required={!window.location.search.includes('code')}
            />
          </div>

          <div className="login-field">
            <label>Password</label>
            <div className="password-wrapper">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!window.location.search.includes('code')}
              />
              <button type="button" className="show-pass-btn" onClick={() => setShowPass(!showPass)}>
                {showPass ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="login-form-meta">
            <Link to="/forgot-password" className="forgot-password-link">Forgot Password?</Link>
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading && !window.location.search.includes('code') ? 'Signing In...' : 'Sign In →'}
          </button>
          
          <div className="login-divider">
            <span>OR</span>
          </div>

          <button type="button" className="ms-login-submit" onClick={handleMicrosoftLogin} disabled={loading}>
            {loading && window.location.search.includes('code') ? 'Authenticating...' : 'Sign in with Microsoft'}
          </button>
        </form>

        <button className="back-home-btn" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
};

export default Login;
