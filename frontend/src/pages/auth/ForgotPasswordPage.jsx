import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import './auth.css';

// 3-step password reset:
//   Step 1 — enter email  → sends OTP
//   Step 2 — enter OTP    → verified client-side
//   Step 3 — new password → POST /reset-password → redirect to login

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step,        setStep]        = useState(1);
  const [email,       setEmail]       = useState('');
  const [code,        setCode]        = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [info,        setInfo]        = useState('');

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email.'); return; }
    setLoading(true);
    try {
      await api.post('/forgot-password', { email });
      setInfo(`A 6-digit code has been sent to ${email}.`);
      setStep(2);
    } catch (err) {
      if (err.response?.data?.error === 'google_account') {
        setError('This email uses Google Sign-In. Reset your password at myaccount.google.com.');
      } else {
        setError(err.response?.data?.error || 'Failed to send code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = (e) => {
    e.preventDefault();
    setError('');
    if (code.length !== 6) { setError('Enter the 6-digit code.'); return; }
    setStep(3);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!newPassword.trim()) { setError('Please enter a new password.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await api.post('/reset-password', { code, password: newPassword });
      navigate('/login', { state: { message: 'Password reset! Please sign in.' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired code. Start over.');
    } finally {
      setLoading(false);
    }
  };

  const stepSubtitle =
    step === 1 ? "Enter your email and we'll send a verification code." :
    step === 2 ? `Enter the 6-digit code sent to ${email}.` :
                 'Enter your new password below.';

  return (
    <div className="auth-page">
      <div className="auth-card fp-card">

        {/* Back button */}
        <button
          type="button"
          className="fp-back-btn"
          onClick={() => step > 1 ? setStep(step - 1) : navigate('/login')}
        >
          <i className="fas fa-arrow-left" />
          {step > 1 ? 'Back' : 'Back to Sign In'}
        </button>

        {/* Header */}
        <div className="fp-header">
          <div className="fp-icon">
            <i className="fas fa-lock" />
          </div>
          <h1 className="fp-title">Password Reset</h1>
          <p className="fp-subtitle">{stepSubtitle}</p>
        </div>

        {/* Step progress dots */}
        <div className="fp-steps">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`fp-dot ${s === step ? 'fp-dot-active' : s < step ? 'fp-dot-done' : ''}`}
            />
          ))}
        </div>

        {/* Feedback banners */}
        {info  && <div className="fp-banner fp-banner-info"><i className="fas fa-check-circle" /> {info}</div>}
        {error && <div className="fp-banner fp-banner-error"><i className="fas fa-exclamation-circle" /> {error}</div>}

        {/* Step 1 — Email */}
        {step === 1 && (
          <form className="auth-form" onSubmit={handleSendCode} noValidate>
            <div className="auth-input-group">
              <label htmlFor="fp-email">Email address</label>
              <div className="auth-input-wrap">
                <i className="fas fa-envelope field-icon" />
                <input
                  id="fp-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : 'Continue'}
            </button>
          </form>
        )}

        {/* Step 2 — OTP */}
        {step === 2 && (
          <form className="auth-form" onSubmit={handleVerifyCode} noValidate>
            <div className="auth-input-group">
              <label htmlFor="fp-code">Verification code</label>
              <div className="auth-input-wrap">
                <i className="fas fa-key field-icon" />
                <input
                  id="fp-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit code"
                  value={code}
                  className="fp-otp-input"
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              Verify Code
            </button>
            <p className="auth-legal">
              Didn't receive it?{' '}
              <a href="#resend" onClick={(e) => { e.preventDefault(); setStep(1); setInfo(''); }}>
                Resend code
              </a>
            </p>
          </form>
        )}

        {/* Step 3 — New password */}
        {step === 3 && (
          <form className="auth-form" onSubmit={handleResetPassword} noValidate>
            <div className="auth-input-group">
              <label htmlFor="fp-newpass">New password</label>
              <div className="auth-input-wrap">
                <i className="fas fa-lock field-icon" />
                <input
                  id="fp-newpass"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  autoComplete="new-password"
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  <i className={`fas ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : 'Reset Password'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
