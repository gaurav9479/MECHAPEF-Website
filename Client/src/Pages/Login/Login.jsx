import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/services';
import { FaCog } from 'react-icons/fa';
import './Login.css';

const Login = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handledMicrosoftCallback = useRef(false);

  const { microsoftLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (window.location.hostname === '127.0.0.1' && window.location.port === '5173') {
      window.location.replace(`http://localhost:5173${window.location.pathname}${window.location.search}`);
    }
  }, []);

  // Handle Microsoft OAuth Callback
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const oauthError = params.get('error_description') || params.get('error');

    if (oauthError && !handledMicrosoftCallback.current) {
      handledMicrosoftCallback.current = true;
      setError(oauthError);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code && !handledMicrosoftCallback.current) {
      handledMicrosoftCallback.current = true;
      setLoading(true);
      const verifier = sessionStorage.getItem('ms_pkce_verifier');
      microsoftLogin(code, verifier)
        .then(() => {
          sessionStorage.removeItem('ms_pkce_verifier'); // Clean up
          sessionStorage.removeItem('ms_client_id');
          sessionStorage.removeItem('ms_tenant_id');
          sessionStorage.removeItem('ms_redirect_uri');
          sessionStorage.removeItem('ms_scope');
          sessionStorage.setItem('ms_auth_redirect', 'true');
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
  }, [location.search, microsoftLogin, navigate, from]);

  const handleMicrosoftLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await authService.getMicrosoftUrl();
      if (res.data.data.code_verifier) {
          sessionStorage.setItem('ms_pkce_verifier', res.data.data.code_verifier);
      }
      if (res.data.data.clientId) {
          sessionStorage.setItem('ms_client_id', res.data.data.clientId);
      }
      if (res.data.data.tenantId) {
          sessionStorage.setItem('ms_tenant_id', res.data.data.tenantId);
      }
      if (res.data.data.redirectUri) {
          sessionStorage.setItem('ms_redirect_uri', res.data.data.redirectUri);
      }
      if (res.data.data.scope) {
          sessionStorage.setItem('ms_scope', res.data.data.scope);
      }
      window.location.href = res.data.data.url;
    } catch (err) {
      console.error('Failed to get Microsoft login URL:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to initiate Microsoft login'
      );
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
        <p className="login-subtitle">Sign in with your MNNIT Microsoft account</p>

        {error && <div className="login-error">{error}</div>}

        <div className="login-form">
          <button type="button" className="ms-login-submit" onClick={handleMicrosoftLogin} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign in with Microsoft'}
          </button>
        </div>

        <button className="back-home-btn" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
};

export default Login;
