import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Mail, Lock, User, ArrowRight,
  Eye, EyeOff, Loader2,
  CheckCircle, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

/* ── Regex ── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ── Inline field error ── */
function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p style={{
      fontSize: '0.76rem', color: '#dc2626', marginTop: '0.35rem',
      display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 500,
    }}>
      <AlertCircle size={12} style={{ flexShrink: 0 }} /> {msg}
    </p>
  );
}

/* ── Password strength bar ── */
function PasswordStrength({ password }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '0.2rem' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            height: '3px', flex: 1, borderRadius: '2px',
            background: i <= score ? colors[score] : 'var(--border)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      {score > 0 && (
        <p style={{ fontSize: '0.7rem', color: colors[score] }}>{labels[score]}</p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   AUTH PAGE  —  Email & Password only
   ══════════════════════════════════════════════════════════════ */
export default function Auth() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';

  /* ── Tabs: 'login' | 'register' ── */
  const [mode, setMode] = useState(initialMode);

  /* ── Form fields ── */
  const [name, setName]                     = useState('');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPwd, setConfirmPwd]         = useState('');
  const [showPwd, setShowPwd]               = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  /* ── Shared UI state ── */
  const [submitting, setSubmitting]      = useState(false);
  const [fieldErrors, setFieldErrors]    = useState({});
  const [inlineError, setInlineError]    = useState('');
  const [registerSuccess, setRegSuccess] = useState('');

  const { login, register, user } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  /* Redirect if already logged in */
  useEffect(() => {
    if (user) navigate(searchParams.get('redirect') || '/', { replace: true });
  }, [user, navigate, searchParams]);

  /* Switch mode — reset all state */
  const switchMode = (m) => {
    setMode(m);
    setFieldErrors({});
    setInlineError('');
    setSubmitting(false);
    setRegSuccess('');
  };

  /* ── Validation ── */
  const validate = () => {
    const errs = {};
    if (mode === 'register' && !name.trim())
      errs.name = 'Full name is required.';
    if (!email.trim())
      errs.email = 'Email address is required.';
    else if (!EMAIL_RE.test(email.trim()))
      errs.email = 'Please enter a valid email address.';
    if (!password)
      errs.password = 'Password is required.';
    else if (password.length < 6)
      errs.password = 'Password must be at least 6 characters.';
    if (mode === 'register') {
      if (!confirmPwd)
        errs.confirmPwd = 'Please confirm your password.';
      else if (password !== confirmPwd)
        errs.confirmPwd = 'Passwords do not match.';
    }
    return errs;
  };

  /* ── Form submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setSubmitting(true);

    try {
      if (mode === 'login') {
        setInlineError('');
        const oldToken = localStorage.getItem('sharadha_token');
        if (oldToken === 'local') {
          localStorage.removeItem('sharadha_token');
          localStorage.removeItem('sharadha_user');
        }
        await login(email, password);

      } else if (mode === 'register') {
        const res = await register(name, email, password);
        if (res.success) {
          setRegSuccess(
            `Welcome to Sharadha Stores, ${name}! 🎉 A welcome email has been sent to ${email}.`
          );
          setTimeout(() => navigate(searchParams.get('redirect') || '/', { replace: true }), 2500);
        }
      }
    } catch (err) {
      console.error('[Auth] Unexpected error:', err);
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Shared input wrapper styles ── */
  const wrap   = { position: 'relative' };
  const iconSt = {
    position: 'absolute', left: '13px', top: '50%',
    transform: 'translateY(-50%)', color: 'var(--text-muted)',
    pointerEvents: 'none',
  };

  return (
    <div
      className="auth-page-wrapper fade-in"
      style={{ background: 'radial-gradient(ellipse at 20% 30%, rgba(212,175,55,0.07) 0%, rgba(15,81,50,0.05) 70%)' }}
    >
      <div className="auth-card card-glass">

        {/* ── Brand mark ── */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--secondary), var(--secondary-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 0.75rem',
            boxShadow: '0 4px 16px rgba(15,81,50,0.25)',
          }}>
            <span style={{ fontSize: '1.5rem' }}>🌿</span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.35rem', fontFamily: 'var(--font-heading)' }}>
            {mode === 'login'    && 'Sign In'}
            {mode === 'register' && 'Create Account'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.5 }}>
            {mode === 'login'    && 'Welcome back to Sharadha Stores'}
            {mode === 'register' && 'Join us for authentic homemade goodness'}
          </p>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

          {/* Full Name (register only) */}
          {mode === 'register' && (
            <div>
              <label className="form-label">Full Name</label>
              <div style={wrap}>
                <User size={15} style={iconSt} />
                <input
                  id="auth-name" type="text"
                  value={name} placeholder="Ramesh Kumar"
                  onChange={e => { setName(e.target.value); setFieldErrors(p => ({ ...p, name: '' })); }}
                  className={`form-input${fieldErrors.name ? ' input-error' : ''}`}
                  style={{ paddingLeft: '2.5rem' }}
                  autoComplete="name"
                />
              </div>
              <FieldError msg={fieldErrors.name} />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="form-label">Email Address</label>
            <div style={wrap}>
              <Mail size={15} style={iconSt} />
              <input
                id="auth-email" type="email"
                value={email} placeholder="you@example.com"
                onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: '' })); }}
                className={`form-input${fieldErrors.email ? ' input-error' : ''}`}
                style={{ paddingLeft: '2.5rem' }}
                autoComplete={mode === 'login' ? 'email' : 'username'}
              />
            </div>
            <FieldError msg={fieldErrors.email} />
          </div>

          {/* Password */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
              {mode === 'login' && (
                <Link
                  to="/create-new-password"
                  style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '3px' }}
                >
                  Forgot Password?
                </Link>
              )}
            </div>
            <div style={wrap}>
              <Lock size={15} style={iconSt} />
              <input
                id="auth-password"
                type={showPwd ? 'text' : 'password'}
                value={password} placeholder="••••••••"
                onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })); }}
                className={`form-input${fieldErrors.password ? ' input-error' : ''}`}
                style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', padding: 0, background: 'none', border: 'none', cursor: 'pointer' }}
                aria-label="Toggle password visibility">
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <FieldError msg={fieldErrors.password} />
            {mode === 'register' && password && <PasswordStrength password={password} />}
          </div>

          {/* Confirm Password (register only) */}
          {mode === 'register' && (
            <div>
              <label className="form-label">Confirm Password</label>
              <div style={wrap}>
                <Lock size={15} style={iconSt} />
                <input
                  id="auth-confirm-password"
                  type={showConfirmPwd ? 'text' : 'password'}
                  value={confirmPwd} placeholder="••••••••"
                  onChange={e => { setConfirmPwd(e.target.value); setFieldErrors(p => ({ ...p, confirmPwd: '' })); }}
                  className={`form-input${fieldErrors.confirmPwd ? ' input-error' : ''}`}
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowConfirmPwd(v => !v)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', padding: 0, background: 'none', border: 'none', cursor: 'pointer' }}
                  aria-label="Toggle confirm password visibility">
                  {showConfirmPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <FieldError msg={fieldErrors.confirmPwd} />
            </div>
          )}

          {/* Registration success banner */}
          {registerSuccess && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
              padding: '0.9rem 1rem', borderRadius: 'var(--radius)',
              background: 'linear-gradient(135deg, rgba(232,130,26,0.10), rgba(16,185,129,0.08))',
              border: '1px solid rgba(232,130,26,0.35)',
              animation: 'fadeIn 0.4s ease',
            }}>
              <CheckCircle size={16} style={{ color: '#E8821A', flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '0.84rem', color: '#7c3c0a', lineHeight: 1.5, fontWeight: 500 }}>
                {registerSuccess}
              </p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            id="auth-submit-btn"
            disabled={submitting}
            className="btn btn-secondary"
            style={{
              width: '100%', height: '50px', marginTop: '0.5rem',
              fontSize: '0.97rem', fontWeight: 600, letterSpacing: '0.3px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              opacity: submitting ? 0.78 : 1,
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={17} style={{ animation: 'spin 0.8s linear infinite' }} />
                {mode === 'login'    && 'Signing In…'}
                {mode === 'register' && 'Creating Account…'}
              </>
            ) : (
              <>
                {mode === 'login'    && 'Sign In'}
                {mode === 'register' && 'Sign Up'}
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* Inline error */}
          {inlineError && (
            <div style={{
              marginTop: '0.85rem', padding: '0.85rem 1rem',
              borderRadius: 'var(--radius)',
              background: 'rgba(220,38,38,0.06)',
              border: '1px solid rgba(220,38,38,0.2)',
              display: 'flex', flexDirection: 'column', gap: '0.6rem',
            }}>
              <p style={{ fontSize: '0.82rem', color: '#b91c1c', lineHeight: 1.5 }}>
                <AlertCircle size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                {inlineError}
              </p>
            </div>
          )}
        </form>

        {/* ── Mode toggle footer ── */}
        <div style={{
          marginTop: '1.75rem', paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-light)',
          textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)',
        }}>
          {mode === 'login' && (
            <p>
              Don&apos;t have an account?{' '}
              <button onClick={() => switchMode('register')}
                style={{ color: 'var(--primary)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                Sign Up
              </button>
            </p>
          )}
          {mode === 'register' && (
            <p>
              Already have an account?{' '}
              <button onClick={() => switchMode('login')}
                style={{ color: 'var(--primary)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
