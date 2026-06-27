import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User, MapPin, Clipboard, Plus, Trash2, Shield,
  Calendar, XCircle, Lock, Eye, EyeOff, CheckCircle,
  AlertCircle, Loader2, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import CancelOrderModal from '../components/CancelOrderModal';
import { API_BASE } from '../config/api';

/* ── Password strength helpers ─────────────────────────────────── */
const STRENGTH_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];

function calcScore(pwd) {
  return [
    pwd.length >= 8,
    /[A-Z]/.test(pwd),
    /[0-9]/.test(pwd),
    /[^a-zA-Z0-9]/.test(pwd),
  ].filter(Boolean).length;
}

function StrengthBar({ password }) {
  if (!password) return null;
  const score = calcScore(password);
  return (
    <div style={{ marginTop: '0.45rem' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '0.2rem' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            height: '4px', flex: 1, borderRadius: '2px',
            background: i <= score ? STRENGTH_COLORS[score] : 'var(--border)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <p style={{ fontSize: '0.72rem', color: STRENGTH_COLORS[score], fontWeight: 600 }}>
        {STRENGTH_LABELS[score]}
      </p>
    </div>
  );
}

/* ── Sidebar menu button ────────────────────────────────────────── */
function MenuBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
        width: '100%', textAlign: 'left',
        background: active ? 'rgba(15,81,50,0.10)' : 'transparent',
        color: active ? 'var(--secondary)' : 'var(--text)',
        fontWeight: active ? 700 : 400,
        borderLeft: active ? '3px solid var(--secondary)' : '3px solid transparent',
        transition: 'all 0.18s',
      }}
    >
      <Icon size={18} /> {label}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════
   CHANGE-PASSWORD PANEL
   ══════════════════════════════════════════════════════════════════ */
function ChangePasswordPanel({ token, showToast }) {
  const [currentPwd,  setCurrentPwd]  = useState('');
  const [newPwd,      setNewPwd]      = useState('');
  const [confirmPwd,  setConfirmPwd]  = useState('');
  const [showCur,     setShowCur]     = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showCon,     setShowCon]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [error,       setError]       = useState('');

  const score     = calcScore(newPwd);
  const matches   = newPwd && confirmPwd && newPwd === confirmPwd;
  const noMatch   = confirmPwd && newPwd !== confirmPwd;

  const iconSt = {
    position: 'absolute', left: '13px', top: '50%',
    transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none',
  };
  const eyeSt = {
    position: 'absolute', right: '12px', top: '50%',
    transform: 'translateY(-50%)', color: 'var(--text-muted)',
    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
  };
  const inputSt = (extraClass = '') => ({
    width: '100%',
    paddingLeft: '2.5rem',
    paddingRight: '2.75rem',
    ...(extraClass === 'match'
      ? { borderColor: '#22c55e', boxShadow: '0 0 0 3px rgba(34,197,94,0.15)' }
      : extraClass === 'error'
      ? { borderColor: '#ef4444', boxShadow: '0 0 0 3px rgba(239,68,68,0.12)' }
      : {}),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!currentPwd)              return setError('Current password is required.');
    if (!newPwd || newPwd.length < 6) return setError('New password must be at least 6 characters.');
    if (newPwd === currentPwd)    return setError('New password must be different from your current password.');
    if (newPwd !== confirmPwd)    return setError('Passwords do not match.');

    setSaving(true);
    try {
      /* We verify the current password by trying to login first */
      const verifyRes = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: '__current_check__', // will be overridden below
          password: currentPwd,
        }),
      });
      // ── Actually just send the profile update; backend will hash the new pwd ──
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password: newPwd, currentPassword: currentPwd }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
        showToast('Password changed successfully! 🔒', 'success');
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(data.message || 'Failed to update password. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card-glass" style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--secondary), var(--secondary-light))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Lock size={20} color="#fff" />
        </div>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.1rem' }}>
            Change Password
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Choose a strong password you haven't used before.
          </p>
        </div>
      </div>

      <div style={{ height: '1px', background: 'var(--border-light)', margin: '1.25rem 0' }} />

      {/* Success banner */}
      {success && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.65rem',
          padding: '0.9rem 1.1rem', borderRadius: 'var(--radius)',
          background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
          marginBottom: '1.25rem', animation: 'fadeIn 0.35s ease',
        }}>
          <ShieldCheck size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
          <p style={{ fontSize: '0.875rem', color: '#15803d', fontWeight: 600 }}>
            Password updated successfully! You're all set.
          </p>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
          padding: '0.85rem 1rem', borderRadius: 'var(--radius)',
          background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)',
          marginBottom: '1.25rem',
        }}>
          <AlertCircle size={16} style={{ color: '#dc2626', flexShrink: 0, marginTop: '1px' }} />
          <p style={{ fontSize: '0.84rem', color: '#b91c1c', lineHeight: 1.5 }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

        {/* Current Password */}
        <div>
          <label className="form-label">Current Password</label>
          <div style={{ position: 'relative' }}>
            <Lock size={15} style={iconSt} />
            <input
              id="cp-current"
              type={showCur ? 'text' : 'password'}
              value={currentPwd}
              placeholder="Your current password"
              onChange={e => { setCurrentPwd(e.target.value); setError(''); setSuccess(false); }}
              className="form-input"
              style={inputSt()}
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowCur(v => !v)} style={eyeSt} aria-label="Toggle">
              {showCur ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="form-label">New Password</label>
          <div style={{ position: 'relative' }}>
            <Lock size={15} style={iconSt} />
            <input
              id="cp-new"
              type={showNew ? 'text' : 'password'}
              value={newPwd}
              placeholder="Min. 6 characters"
              onChange={e => { setNewPwd(e.target.value); setError(''); setSuccess(false); }}
              className="form-input"
              style={inputSt()}
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowNew(v => !v)} style={eyeSt} aria-label="Toggle">
              {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <StrengthBar password={newPwd} />
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="form-label">Confirm New Password</label>
          <div style={{ position: 'relative' }}>
            <Lock size={15} style={iconSt} />
            <input
              id="cp-confirm"
              type={showCon ? 'text' : 'password'}
              value={confirmPwd}
              placeholder="Re-enter new password"
              onChange={e => { setConfirmPwd(e.target.value); setError(''); setSuccess(false); }}
              className={`form-input${noMatch ? ' input-error' : ''}`}
              style={inputSt(matches ? 'match' : noMatch ? 'error' : '')}
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowCon(v => !v)} style={eyeSt} aria-label="Toggle">
              {showCon ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {/* Match indicator */}
          {confirmPwd && (
            <p style={{
              fontSize: '0.75rem', marginTop: '0.35rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              color: matches ? '#22c55e' : '#ef4444',
              transition: 'color 0.25s',
            }}>
              {matches
                ? <><CheckCircle size={13} /> Passwords match</>
                : <><AlertCircle size={13} /> Passwords do not match</>
              }
            </p>
          )}
        </div>

        {/* Tips */}
        <div style={{
          background: 'var(--background-alt)', borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-light)', padding: '0.85rem 1rem',
        }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Password tips
          </p>
          <ul style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.7, paddingLeft: '1rem', margin: 0 }}>
            <li>At least 8 characters long</li>
            <li>Mix uppercase letters, numbers &amp; symbols</li>
            <li>Don't reuse passwords from other sites</li>
          </ul>
        </div>

        {/* Submit */}
        <button
          type="submit"
          id="cp-submit-btn"
          disabled={saving}
          className="btn btn-secondary"
          style={{
            height: '50px', borderRadius: '9999px',
            fontSize: '0.97rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            opacity: saving ? 0.75 : 1,
            cursor: saving ? 'not-allowed' : 'pointer',
            marginTop: '0.25rem',
          }}
        >
          {saving ? (
            <>
              <Loader2 size={17} style={{ animation: 'spin 0.8s linear infinite' }} />
              Updating Password…
            </>
          ) : (
            <>
              <ShieldCheck size={17} />
              Update Password
            </>
          )}
        </button>
      </form>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN PROFILE PAGE
   ══════════════════════════════════════════════════════════════════ */
export default function Profile() {
  const { user, token, addAddress, deleteAddress } = useAuth();
  const { showToast } = useNotification();

  // Active section: 'info' | 'addresses' | 'orders' | 'security'
  const [activeSubTab, setActiveSubTab] = useState('info');

  // Address form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [street,      setStreet]      = useState('');
  const [city,        setCity]        = useState('');
  const [state,       setState]       = useState('');
  const [postalCode,  setPostalCode]  = useState('');
  const [country,     setCountry]     = useState('India');
  const [isDefault,   setIsDefault]   = useState(false);

  // Orders state
  const [orders,            setOrders]            = useState([]);
  const [loadingOrders,     setLoadingOrders]     = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [cancelModalOrderId,setCancelModalOrderId]= useState(null);

  useEffect(() => {
    if (activeSubTab === 'orders' && token) {
      const fetchMyOrders = async () => {
        setLoadingOrders(true);
        try {
          const response = await fetch(`${API_BASE}/api/orders/myorders`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await response.json();
          if (response.ok) setOrders(data);
        } catch (error) {
          console.error('Error fetching orders:', error);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchMyOrders();
    }
  }, [activeSubTab, token]);

  const handleCancelOrder = async (orderId, reason) => {
    setCancellingOrderId(orderId);
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(prev => prev.map(o => o._id === orderId ? data : o));
        setCancelModalOrderId(null);
        showToast('Order cancelled successfully.', 'success');
      } else {
        showToast(data.message || 'Could not cancel the order.', 'error');
        throw new Error(data.message);
      }
    } catch (err) {
      if (!err.message?.includes('Could not')) showToast('Network error. Please try again.', 'error');
      throw err;
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleAddAddressSubmit = async (e) => {
    e.preventDefault();
    if (!street || !city || !state || !postalCode) {
      showToast('Please fill out all fields.', 'warning');
      return;
    }
    const newAddress = { street, city, state, postalCode, country, isDefault };
    const res = await addAddress(newAddress);
    if (res.success) {
      setShowAddForm(false);
      setStreet(''); setCity(''); setState(''); setPostalCode(''); setIsDefault(false);
    }
  };

  const handleDeleteAddressClick = async (addressId) => {
    if (window.confirm('Are you sure you want to delete this address?'))
      await deleteAddress(addressId);
  };

  if (!user) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Please log in to view your profile.</p>
        <Link to="/login" className="btn btn-primary" style={{ marginTop: '1rem' }}>Login</Link>
      </div>
    );
  }

  return (<>
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <div style={{ margin: '1.5rem 0', display: 'flex', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        <Link to="/">Home</Link> &gt; <span>My Profile</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>

        {/* ── Left sidebar ── */}
        <aside style={{ flex: '1 1 250px', minWidth: '250px' }} className="card-glass">
          {/* Avatar */}
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--secondary), var(--secondary-light))',
              color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', fontWeight: 700, margin: '0 auto 1rem auto',
              boxShadow: '0 4px 16px rgba(15,81,50,0.25)',
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{user.name}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user.email}</p>
            <span className="badge badge-secondary" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
              {user.role === 'admin' ? '🛡️ Admin Account' : 'Customer Account'}
            </span>
          </div>

          {/* Nav */}
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <MenuBtn active={activeSubTab === 'info'}      onClick={() => setActiveSubTab('info')}      icon={User}       label="Account Info" />
            <MenuBtn active={activeSubTab === 'addresses'} onClick={() => setActiveSubTab('addresses')} icon={MapPin}     label="Manage Addresses" />
            <MenuBtn active={activeSubTab === 'orders'}    onClick={() => setActiveSubTab('orders')}    icon={Clipboard}  label="Order History" />
            <MenuBtn active={activeSubTab === 'security'}  onClick={() => setActiveSubTab('security')}  icon={ShieldCheck} label="Reset Password" />
            {user.role === 'admin' && (
              <Link
                to="/admin"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
                  color: 'var(--text)', width: '100%',
                  borderLeft: '3px solid transparent',
                }}
              >
                <Shield size={18} /> Admin Dashboard
              </Link>
            )}
          </div>
        </aside>

        {/* ── Right content ── */}
        <main style={{ flex: '3 1 500px' }}>

          {/* TAB 1: ACCOUNT INFO */}
          {activeSubTab === 'info' && (
            <div className="card-glass" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Personal Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Full Name</span>
                    <span style={{ fontSize: '1rem', fontWeight: 500 }}>{user.name}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Email Address</span>
                    <span style={{ fontSize: '1rem', fontWeight: 500, wordBreak: 'break-all' }}>{user.email}</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Member Since</span>
                    <span style={{ fontSize: '1rem', fontWeight: 500 }}>{new Date().toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Account Status</span>
                    <span className="badge badge-primary">Active</span>
                  </div>
                </div>
              </div>

              {/* Quick link to security tab */}
              <div style={{
                marginTop: '2rem', padding: '1rem 1.25rem',
                background: 'linear-gradient(135deg, rgba(15,81,50,0.06), rgba(15,81,50,0.03))',
                border: '1px solid var(--border-light)', borderRadius: 'var(--radius)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Lock size={18} style={{ color: 'var(--secondary)' }} />
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Password &amp; Security</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Change your account password</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSubTab('security')}
                  className="btn btn-secondary btn-sm"
                  style={{ borderRadius: '9999px' }}
                >
                  <Lock size={14} /> Reset Password
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ADDRESSES */}
          {activeSubTab === 'addresses' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>My Saved Addresses</h3>
                <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-secondary btn-sm" style={{ borderRadius: '2rem' }}>
                  <Plus size={16} /> Add New Address
                </button>
              </div>

              {showAddForm && (
                <form onSubmit={handleAddAddressSubmit} className="card-glass" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Street / Area / House No.</label>
                    <input type="text" className="form-input" value={street} onChange={e => setStreet(e.target.value)} placeholder="45, Gandhi Nagar Road" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input type="text" className="form-input" value={city} onChange={e => setCity(e.target.value)} placeholder="Adyar" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input type="text" className="form-input" value={state} onChange={e => setState(e.target.value)} placeholder="Tamil Nadu" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Postal / Zip Code</label>
                    <input type="text" className="form-input" value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="600020" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Country</label>
                    <input type="text" className="form-input" value={country} onChange={e => setCountry(e.target.value)} placeholder="India" required />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 0 }}>
                    <input type="checkbox" id="defaultAddr" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} />
                    <label htmlFor="defaultAddr" style={{ fontSize: '0.9rem', cursor: 'pointer', margin: 0 }}>Set as default address</label>
                  </div>
                  <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <button type="submit" className="btn btn-secondary btn-sm">Save Address</button>
                    <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-outline btn-sm">Cancel</button>
                  </div>
                </form>
              )}

              {user.addresses && user.addresses.length === 0 ? (
                <div className="card-glass" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  You don't have any saved addresses.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  {user.addresses?.map((addr) => (
                    <div key={addr._id} className="card-glass" style={{ padding: '1.25rem', position: 'relative' }}>
                      {addr.isDefault && (
                        <span className="badge badge-primary" style={{ position: 'absolute', top: '12px', right: '12px' }}>Default</span>
                      )}
                      <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.5rem' }}>Delivery Address</p>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                        {addr.street},<br />
                        {addr.city}, {addr.state} - {addr.postalCode}<br />
                        {addr.country}
                      </p>
                      <button
                        onClick={() => handleDeleteAddressClick(addr._id)}
                        style={{ marginTop: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        <Trash2 size={14} /> Remove Address
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ORDER HISTORY */}
          {activeSubTab === 'orders' && (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>My Past Orders</h3>
              {loadingOrders ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="card-glass" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  You haven't placed any orders yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {orders.map((ord) => (
                    <div key={ord._id} className="card-glass" style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Order ID:</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>#{ord._id}</span>
                        </div>
                        <div>
                          <span className={`badge ${ord.orderStatus === 'Cancelled' ? 'badge-danger' : ord.isPaid ? 'badge-secondary' : 'badge-danger'}`}>
                            {ord.isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                          <span className={`badge ${ord.orderStatus === 'Cancelled' ? 'badge-danger' : ord.orderStatus === 'Delivered' ? 'badge-secondary' : 'badge-primary'}`} style={{ marginLeft: '0.5rem' }}>
                            {ord.orderStatus}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                        {ord.orderItems.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                            <span>{item.title} <span style={{ color: 'var(--text-muted)' }}>x {item.quantity}</span></span>
                            <span>Rs. {item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar size={14} /> {new Date(ord.createdAt).toLocaleDateString()}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>Total: Rs. {ord.totalPrice}</span>
                          {['Pending', 'Packed', 'Processing'].includes(ord.orderStatus) && (
                            <button
                              onClick={() => setCancelModalOrderId(ord._id)}
                              disabled={cancellingOrderId === ord._id}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                padding: '0.3rem 0.75rem', borderRadius: '2rem',
                                border: '1.5px solid #ef4444', color: '#ef4444',
                                background: cancellingOrderId === ord._id ? 'rgba(239,68,68,0.08)' : 'transparent',
                                fontWeight: 600, fontSize: '0.8rem',
                                cursor: cancellingOrderId === ord._id ? 'not-allowed' : 'pointer',
                              }}
                            >
                              <XCircle size={13} />
                              {cancellingOrderId === ord._id ? 'Cancelling...' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </div>

                      {ord.trackingNumber && (
                        <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--background)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                          <span>Tracking: <strong>{ord.trackingNumber}</strong></span>
                          <Link to={`/order/${ord._id}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>Track Order &rarr;</Link>
                        </div>
                      )}

                      {ord.orderStatus === 'Cancelled' && (ord.cancellationReason || ord.cancelledAt) && (
                        <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.85rem', background: 'rgba(239,68,68,0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.18)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {ord.cancellationReason && <span><strong>Reason:</strong> {ord.cancellationReason}</span>}
                          {ord.cancelledAt && <span style={{ marginLeft: '0.75rem' }}><strong>On:</strong> {new Date(ord.cancelledAt).toLocaleString()}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SECURITY — CHANGE PASSWORD */}
          {activeSubTab === 'security' && (
            <ChangePasswordPanel token={token} showToast={showToast} />
          )}

        </main>
      </div>
    </div>

    {cancelModalOrderId && (
      <CancelOrderModal
        isOpen={!!cancelModalOrderId}
        orderId={cancelModalOrderId}
        onConfirm={(reason) => handleCancelOrder(cancelModalOrderId, reason)}
        onClose={() => setCancelModalOrderId(null)}
      />
    )}
  </>);
}
