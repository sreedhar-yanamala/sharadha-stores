/**
 * CreateNewPassword.jsx
 * ─────────────────────────────────────────────────────────────────
 * Replaces the password form from ResetPassword.jsx.
 * This is a protected route: the user is already authenticated via
 * the magic link. It sets their new password using the 
 * force-change-password endpoint.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, ShieldCheck, ArrowRight, Mail } from 'lucide-react';
import { API_BASE } from '../config/api';
import { useNotification } from '../context/NotificationContext';

/* ── Shared design tokens ─────────────────────────────────────────── */
const PAGE_BG = {
  minHeight: '100vh', background: '#091E14', display: 'flex',
  alignItems: 'center', justifyContent: 'center', padding: '2rem 1.25rem',
  position: 'relative', overflow: 'hidden',
};

const CARD = {
  width: '100%', maxWidth: '480px', padding: '2.75rem 2.5rem',
  background: 'rgba(10, 32, 20, 0.85)',
  border: '1px solid rgba(34, 197, 94, 0.18)', borderRadius: '1.25rem',
  boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 8px 32px rgba(0,0,0,0.35)',
  backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
  position: 'relative', zIndex: 2,
  animation: 'cnpSlideUp 0.55s cubic-bezier(0.16,1,0.3,1) forwards',
};

const EMERALD_BTN = {
  width: '100%', height: '52px', borderRadius: '9999px',
  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
  color: '#ffffff', fontWeight: 700, fontSize: '0.97rem', border: 'none',
  cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', gap: '0.5rem',
  boxShadow: '0 4px 24px rgba(22,163,74,0.40)',
  transition: 'all 0.28s cubic-bezier(0.16,1,0.3,1)', textDecoration: 'none',
};

const ICON_ST = {
  position: 'absolute', left: '14px', top: '50%',
  transform: 'translateY(-50%)', color: '#4ade80', pointerEvents: 'none',
};

/* ── Password strength helpers ───────────────────────────────────── */
const STRENGTH_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];

function calcScore(pwd) {
  return [
    pwd.length >= 8, /[A-Z]/.test(pwd), /[0-9]/.test(pwd), /[^a-zA-Z0-9]/.test(pwd),
  ].filter(Boolean).length;
}

const REQUIREMENTS = [
  { label: 'At least 6 characters',     test: (p) => p.length >= 6 },
  { label: 'One uppercase letter (A–Z)', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a–z)', test: (p) => /[a-z]/.test(p) },
  { label: 'One number (0–9)',           test: (p) => /[0-9]/.test(p) },
  { label: 'One special character (!@#$…)', test: (p) => /[^a-zA-Z0-9]/.test(p) },
];

function StrengthBar({ password }) {
  if (!password) return null;
  const score = calcScore(password);
  return (
    <div style={{ marginTop: '0.45rem' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '0.25rem' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            height: '4px', flex: 1, borderRadius: '2px',
            background: i <= score ? STRENGTH_COLORS[score] : 'rgba(255,255,255,0.08)',
            transition: 'background 0.35s ease',
          }} />
        ))}
      </div>
      <p style={{
        fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.3px',
        color: STRENGTH_COLORS[score], transition: 'color 0.3s',
      }}>
        {STRENGTH_LABELS[score]}
      </p>
    </div>
  );
}

function RequirementsList({ password }) {
  if (!password) return null;
  return (
    <div style={{
      marginTop: '0.6rem', background: 'rgba(0,0,0,0.20)',
      border: '1px solid rgba(34,197,94,0.12)', borderRadius: '0.65rem',
      padding: '0.65rem 0.9rem',
    }}>
      {REQUIREMENTS.map((req) => {
        const ok = req.test(password);
        return (
          <div key={req.label} style={{
            display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.2rem 0',
          }}>
            {ok
              ? <CheckCircle size={12} style={{ color: '#4ade80', flexShrink: 0 }} />
              : <AlertCircle size={12} style={{ color: '#6b9f80', flexShrink: 0 }} />}
            <span style={{ fontSize: '0.76rem', color: ok ? '#86efac' : '#6b9f80', transition: 'color 0.25s' }}>
              {req.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MatchIndicator({ password, confirmPwd }) {
  if (!confirmPwd) return null;
  const matches = password === confirmPwd && confirmPwd.length > 0;
  return (
    <p style={{
      fontSize: '0.76rem', marginTop: '0.35rem', fontWeight: 600,
      display: 'flex', alignItems: 'center', gap: '0.3rem',
      color: matches ? '#4ade80' : '#f87171', transition: 'color 0.25s',
    }}>
      {matches ? <><CheckCircle size={13} /> Passwords match</> : <><AlertCircle size={13} /> Passwords do not match</>}
    </p>
  );
}

export default function CreateNewPassword() {
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const validatePassword = (pwd) => {
    if (!pwd || pwd.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email address is required.');
      return;
    }

    const pwdError = validatePassword(password);
    if (pwdError) { setError(pwdError); return; }
    if (password !== confirmPwd) { setError('Passwords do not match.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/direct-reset-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        showToast('Your password has been changed successfully.', 'success');
        
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.message || 'Failed to update password. Please try again.');
      }
    } catch {
      setError('Unable to reach the server. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const allRequirementsMet = password && password.length >= 6;

  return (
    <>
      <style>{`
        @keyframes cnpSlideUp { from { opacity: 0; transform: translateY(32px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes cnpOrbFloat { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-18px) scale(1.04); } }
        @keyframes cnpSpin { to { transform: rotate(360deg); } }
        @keyframes cnpPulseRing { 0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.45); } 70% { box-shadow: 0 0 0 14px rgba(34,197,94,0); } 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); } }
        #cnp-submit-btn:hover:not(:disabled) { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%) !important; transform: translateY(-2px); box-shadow: 0 8px 32px rgba(34,197,94,0.5) !important; }
        #cnp-submit-btn:active:not(:disabled) { transform: translateY(0); }
        .cnp-input { width: 100%; padding: 0.82rem 2.75rem; border-radius: 0.75rem; border: 1.5px solid rgba(34,197,94,0.22); background: rgba(0,0,0,0.30); color: #f0fdf4; font-size: 0.95rem; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        .cnp-input::placeholder { color: #4b7a5e; }
        .cnp-input:focus { border-color: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,0.18); }
        .cnp-input.match { border-color: #22c55e !important; box-shadow: 0 0 0 3px rgba(34,197,94,0.14) !important; }
        .cnp-input.no-match { border-color: #ef4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.12) !important; }
        .cnp-eye-btn { position: absolute; right: 13px; top: 50%; transform: translateY(-50%); color: #4b7a5e; padding: 0; background: none; border: none; cursor: pointer; transition: color 0.2s; }
        .cnp-eye-btn:hover { color: #4ade80; }
      `}</style>

      <div style={PAGE_BG}>
        <div style={{ position: 'absolute', top: '-120px', right: '-100px', width: '420px', height: '420px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(22,163,74,0.13) 0%, transparent 70%)', animation: 'cnpOrbFloat 8s ease-in-out infinite', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(15,81,50,0.20) 0%, transparent 70%)', animation: 'cnpOrbFloat 11s ease-in-out infinite reverse', zIndex: 0 }} />

        <div style={CARD}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #15803d, #166534)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 0 0 8px rgba(22,163,74,0.12), 0 8px 24px rgba(22,163,74,0.30)', animation: 'cnpPulseRing 2.8s cubic-bezier(0.36,0.07,0.19,0.97) infinite' }}>
              <span style={{ fontSize: '1.75rem', lineHeight: 1 }}>🌿</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f0fdf4', marginBottom: '0.4rem', fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: '-0.3px' }}>
              {success ? 'Password Updated!' : 'Create New Password'}
            </h1>
            <p style={{ color: '#6b9f80', fontSize: '0.855rem', lineHeight: 1.6 }}>
              {success
                ? 'Your password has been changed successfully. Redirecting...'
                : 'Create a new password for your account.'}
            </p>
          </div>

          {success && (
            <div style={{ textAlign: 'center', padding: '1.25rem', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '1rem' }}>
              <ShieldCheck size={52} color="#22c55e" style={{ margin: '0 auto 1rem' }} />
              <p style={{ fontWeight: 700, color: '#4ade80', fontSize: '1.05rem', marginBottom: '1.5rem' }}>
                Your password has been changed successfully.
              </p>
              <Link to="/login" style={EMERALD_BTN}>
                <ArrowRight size={16} /> Back to Login
              </Link>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#86efac', marginBottom: '0.5rem', letterSpacing: '0.2px' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={ICON_ST} />
                  <input id="cnp-email" type="email" value={email} placeholder="you@example.com" onChange={e => setEmail(e.target.value)} className="cnp-input" autoComplete="email" autoFocus />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#86efac', marginBottom: '0.5rem', letterSpacing: '0.2px' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={ICON_ST} />
                  <input id="cnp-new-password" type={showPwd ? 'text' : 'password'} value={password} placeholder="Min. 8 characters" onChange={e => setPassword(e.target.value)} className="cnp-input" autoComplete="new-password" />
                  <button type="button" className="cnp-eye-btn" onClick={() => setShowPwd(v => !v)}><EyeOff size={16} style={{ display: showPwd ? 'block' : 'none' }} /><Eye size={16} style={{ display: !showPwd ? 'block' : 'none' }} /></button>
                </div>
                <StrengthBar password={password} />
                <RequirementsList password={password} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#86efac', marginBottom: '0.5rem', letterSpacing: '0.2px' }}>Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={ICON_ST} />
                  <input id="cnp-confirm-password" type={showConfirm ? 'text' : 'password'} value={confirmPwd} placeholder="Re-enter password" onChange={e => setConfirmPwd(e.target.value)} className={`cnp-input ${confirmPwd ? (password === confirmPwd ? 'match' : 'no-match') : ''}`} autoComplete="new-password" />
                  <button type="button" className="cnp-eye-btn" onClick={() => setShowConfirm(v => !v)}><EyeOff size={16} style={{ display: showConfirm ? 'block' : 'none' }} /><Eye size={16} style={{ display: !showConfirm ? 'block' : 'none' }} /></button>
                </div>
                <MatchIndicator password={password} confirmPwd={confirmPwd} />
              </div>

              {error && (
                <div style={{ padding: '0.8rem 1rem', borderRadius: '0.75rem', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <AlertCircle size={15} style={{ color: '#f87171', flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ fontSize: '0.82rem', color: '#fca5a5', lineHeight: 1.5 }}>{error}</p>
                </div>
              )}

              <button 
                type="submit" 
                id="cnp-submit-btn" 
                disabled={submitting || !allRequirementsMet || !email || password !== confirmPwd} 
                style={{ 
                  ...EMERALD_BTN, 
                  marginTop: '0.25rem', 
                  background: (submitting || !allRequirementsMet || !email || password !== confirmPwd) 
                    ? 'rgba(34, 197, 94, 0.12)' 
                    : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  color: (submitting || !allRequirementsMet || !email || password !== confirmPwd) ? '#6b9f80' : '#ffffff',
                  border: (submitting || !allRequirementsMet || !email || password !== confirmPwd) ? '1px solid rgba(34, 197, 94, 0.2)' : 'none',
                  boxShadow: (submitting || !allRequirementsMet || !email || password !== confirmPwd) ? 'none' : '0 4px 24px rgba(22,163,74,0.40)',
                  cursor: (submitting || !allRequirementsMet || !email || password !== confirmPwd) ? 'not-allowed' : 'pointer' 
                }}
              >
                {submitting ? <><Loader2 size={18} style={{ animation: 'cnpSpin 0.8s linear infinite' }} /> Resetting…</> : <><ShieldCheck size={17} /> Reset Password</>}
              </button>
            </form>
          )}

        </div>
      </div>
    </>
  );
}
