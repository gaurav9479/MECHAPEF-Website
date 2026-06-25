import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
    if (code) {
      setLoading(true);
      microsoftLogin(code)
        .then(() => {
          // Clear URL and redirect
          window.history.replaceState({}, document.title, window.location.pathname);
          navigate(from, { replace: true });
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Microsoft login failed');
          window.history.replaceState({}, document.title, window.location.pathname);
          setLoading(false);
        });
    }
  }, [microsoftLogin, navigate, from]);

  const handleMicrosoftLogin = async () => {
    try {
      setLoading(true);
      const { authService } = await import('../../services/services');
      const res = await authService.getMicrosoftUrl();
      window.location.href = res.data.data.url;
    } catch (err) {
      setError('Failed to initiate Microsoft login');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);

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

        {error && <div key={Date.now()} className="login-error">{error}</div>}

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
