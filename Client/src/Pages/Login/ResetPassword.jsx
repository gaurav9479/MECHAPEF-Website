import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaCog, FaEye, FaEyeSlash } from 'react-icons/fa';
import { authService } from '../../services/services';
import './Login.css';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.resetPassword(token, password);
      setSuccess(res.data?.message || 'Password reset successful. You can now sign in.');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset password. Please request a new link.');
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
            <div className="login-logo-sub">Password Reset</div>
          </div>
        </div>

        <h1 className="login-title">Set New Password</h1>
        <p className="login-subtitle">Choose a secure password for your account.</p>

        {error && <div className="login-error">{error}</div>}
        {success && <div className="login-success">{success}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label>New Password</label>
            <div className="password-wrapper">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
              <button type="button" className="show-pass-btn" onClick={() => setShowPass(!showPass)}>
                {showPass ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="login-field">
            <label>Confirm Password</label>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>

          <button type="submit" className="login-submit" disabled={loading || Boolean(success)}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <button className="back-home-btn" onClick={() => navigate('/login')}>
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default ResetPassword;
