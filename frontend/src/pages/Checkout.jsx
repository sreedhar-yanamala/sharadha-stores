import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, CreditCard, ShoppingBag, Plus, Trash2, ShieldCheck, LogIn, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import CancelOrderModal from '../components/CancelOrderModal';
import { API_BASE } from '../config/api';

export default function Checkout() {
  const {
    user, token, appReady, backendUp,
    sessionStatus, isSessionLoading,
    addAddress, deleteAddress, updateProfile,
    retryBackendCheck,
  } = useAuth();
  const { cartItems, subtotal, discountAmount, tax, shippingCost, total, clearCart } = useCart();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  // Wizard state
  const [step, setStep] = useState(1); // 1: Address, 2: Payment, 3: Review

  // Address states
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [selectedAddressData, setSelectedAddressData] = useState(null); // full address object
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newPostal, setNewPostal] = useState('');
  const [newCountry, setNewCountry] = useState('India');

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');

  // Submit / save loading states
  const [placingOrder, setPlacingOrder] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [showCancelCheckout, setShowCancelCheckout] = useState(false);

  // Prevent false redirect to /shop when cart is emptied on successful order
  const orderSucceededRef = useRef(false);

  // Auto-redirect timer ref for local-only + backend-up scenario
  const autoRedirectTimerRef = useRef(null);

  // ── Session verification: ensures JWT is valid before allowing checkout ──
  const [sessionVerified, setSessionVerified] = useState(false);
  const [sessionVerifying, setSessionVerifying] = useState(false);

  // Set default address ID when user loads (only if none selected yet)
  useEffect(() => {
    if (user && user.addresses && user.addresses.length > 0 && !selectedAddressId) {
      const defAddr = user.addresses.find(addr => addr.isDefault) || user.addresses[0];
      if (defAddr._id) {
        setSelectedAddressId(String(defAddr._id));
        setSelectedAddressData(defAddr);
      }
    }
  }, [user]);

  // Guard: wait for appReady before checking auth state
  // This prevents false redirects during the async session-restore phase
  useEffect(() => {
    if (!appReady) return; // Still initialising — do nothing

    if (!user) {
      // Save current URL so we can return after login
      navigate('/login?redirect=/checkout');
      return;
    }
    if (cartItems.length === 0 && !orderSucceededRef.current) {
      showToast('Your cart is empty. Cannot checkout.', 'warning');
      navigate('/shop');
    }
  }, [appReady, user, cartItems, navigate]);

  // Auto-redirect when backend comes back up but user only has a local session
  // Immediately redirect to login so they can get a real JWT
  useEffect(() => {
    if (sessionStatus === 'local-only' && backendUp === true) {
      clearTimeout(autoRedirectTimerRef.current);
      // Clear stale local session before redirecting
      localStorage.removeItem('sharadha_token');
      localStorage.removeItem('sharadha_user');
      autoRedirectTimerRef.current = setTimeout(() => {
        navigate('/login?redirect=/checkout');
      }, 1500);
    }
    return () => clearTimeout(autoRedirectTimerRef.current);
  }, [sessionStatus, backendUp, navigate]);

  // ── JWT pre-validation: confirm token is accepted by backend before checkout ─
  useEffect(() => {
    if (!appReady || !user) return;
    // Local / offline token — handled by the local-only useEffect above
    if (!token || token === 'local') return;

    let cancelled = false;
    setSessionVerifying(true);
    console.log('[Checkout] 🔍 Verifying session token with backend...');

    fetch(`${API_BASE}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async res => {
        if (cancelled) return;
        if (res.ok) {
          console.log('[Checkout] ✅ Session token valid — checkout unlocked');
          setSessionVerified(true);
        } else if (res.status === 401) {
          console.warn('[Checkout] ⚠️ Token rejected (401) — clearing session and redirecting to login');
          localStorage.removeItem('sharadha_token');
          localStorage.removeItem('sharadha_user');
          showToast('Your session has expired. Please sign in again.', 'warning');
          navigate('/login?redirect=/checkout');
        } else {
          // Server error (5xx) — allow proceed; handlePlaceOrder will report failures
          console.warn('[Checkout] Backend returned', res.status, '— allowing checkout');
          setSessionVerified(true);
        }
      })
      .catch(err => {
        if (!cancelled) {
          // Network error: can't reach backend to validate
          // Allow the user to see checkout; handlePlaceOrder will surface the real error
          console.warn('[Checkout] Token validation network error:', err.message, '— proceeding anyway');
          setSessionVerified(true);
        }
      })
      .finally(() => {
        if (!cancelled) setSessionVerifying(false);
      });

    return () => { cancelled = true; };
  }, [appReady, user, token, navigate, showToast]);

  // ── Loading screen while session is initialising or verifying ─────────────
  if (!appReady || isSessionLoading || sessionVerifying) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
        <div style={{
          width: '48px', height: '48px',
          border: '4px solid var(--border)',
          borderTopColor: 'var(--secondary)',
          borderRadius: '50%',
          margin: '0 auto 1.5rem auto',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
          {isSessionLoading
            ? 'Reconnecting to server…'
            : sessionVerifying
            ? 'Verifying your session…'
            : 'Checking your session…'}
        </p>
      </div>
    );
  }

  // Guard renders null until the above useEffect can redirect
  if (!user || (cartItems.length === 0 && !orderSucceededRef.current)) return null;

  const handleAddAddressSubmit = async (e) => {
    e.preventDefault();
    // Field validation
    if (!newStreet.trim()) { showToast('Street / Area Address is required.', 'warning'); return; }
    if (!newCity.trim())   { showToast('City is required.', 'warning'); return; }
    if (!newState.trim())  { showToast('State is required.', 'warning'); return; }
    if (!newPostal.trim()) { showToast('Postal / Pincode is required.', 'warning'); return; }

    setSavingAddress(true);
    const addressData = {
      street: newStreet.trim(),
      city: newCity.trim(),
      state: newState.trim(),
      postalCode: newPostal.trim(),
      country: newCountry,
      isDefault: !user.addresses || user.addresses.length === 0
    };

    try {
      const res = await addAddress(addressData);
      if (res.success) {
        showToast('Address saved successfully! ✅', 'success');

        // Build the full address object we just saved
        const savedAddress = {
          ...addressData,
          _id: res.newAddressId || `local_${Date.now()}`,
        };
        let idToSelect = String(savedAddress._id);

        // If backend is live, re-fetch profile to get real DB-assigned address IDs
        if (token && token !== 'local') {
          try {
            const profileRes = await fetch(`${API_BASE}/api/auth/profile`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (profileRes.ok) {
              const freshUser = await profileRes.json();
              await updateProfile({ addresses: freshUser.addresses });
              const addrs = freshUser.addresses || [];
              if (addrs.length > 0) {
                const lastAddr = addrs[addrs.length - 1];
                idToSelect = String(lastAddr._id);
                savedAddress._id = lastAddr._id;
              }
            }
          } catch (_) { /* ignore, use local id */ }
        }

        // Reset form
        setShowAddAddress(false);
        setNewStreet('');
        setNewCity('');
        setNewState('');
        setNewPostal('');

        // Store BOTH the id AND the full address object in state
        setSelectedAddressId(idToSelect);
        setSelectedAddressData({ ...addressData, _id: idToSelect });

        // Auto-advance to Step 2
        setTimeout(() => setStep(2), 400);
      } else {
        showToast('Failed to save address. Please try again.', 'error');
      }
    } catch (err) {
      showToast('An error occurred while saving address.', 'error');
    } finally {
      setSavingAddress(false);
    }
  };

  // Get the currently selected address object — use direct state first, then user context fallback
  const selectedAddress = selectedAddressData ||
    user?.addresses?.find(a => String(a._id) === String(selectedAddressId)) ||
    null;

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      showToast('Please select a shipping address first.', 'warning');
      setStep(1);
      return;
    }

    // Resolve which token to use for the order request
    let activeToken = token;

    console.log('[Checkout] Auth state →', { user: user?.name, token: token?.slice(0, 20) + '...' });

    // If we have a 'local' token, check if backend is now reachable and try to
    // silently get a fresh JWT (user may have logged in while backend was down)
    if (!activeToken || activeToken === 'local') {
      console.log('[Checkout] Token is local — checking if backend is reachable...');
      try {
        const storedRealToken = localStorage.getItem('sharadha_token');
        if (storedRealToken && storedRealToken !== 'local') {
          // We have a real token in storage that wasn't loaded into context yet
          const profileRes = await fetch(`${API_BASE}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${storedRealToken}` }
          });
          if (profileRes.ok) {
            activeToken = storedRealToken;
            console.log('[Checkout] Recovered real JWT from localStorage.');
          }
        }

        if (!activeToken || activeToken === 'local') {
          // Backend is up but we have no real JWT — clear stale session and redirect to login
          localStorage.removeItem('sharadha_token');
          localStorage.removeItem('sharadha_user');
          showToast(
            'Your session has expired. Please sign in again to place your order.',
            'error'
          );
          setTimeout(() => navigate('/login?redirect=/checkout'), 1200);
          return;
        }
      } catch {
        showToast(
          'Unable to connect to the server. Please make sure the Flask backend is running.',
          'error'
        );
        return;
      }
    }

    setPlacingOrder(true);

    // Sanitize cart items before sending
    const orderItems = cartItems.map(item => ({
      title:    String(item.title || ''),
      quantity: parseInt(item.quantity, 10) || 1,
      images:   Array.isArray(item.images) ? item.images : [],
      price:    parseFloat(item.price) || 0,
      product:  item.product ?? null
    }));

    const orderData = {
      orderItems,
      shippingAddress: {
        street:     selectedAddress.street    || '',
        city:       selectedAddress.city      || '',
        state:      selectedAddress.state     || '',
        postalCode: selectedAddress.postalCode || '',
        country:    selectedAddress.country   || 'India'
      },
      paymentMethod,
      itemsPrice:    parseFloat((subtotal - discountAmount).toFixed(2)),
      taxPrice:      parseFloat(tax.toFixed(2)),
      shippingPrice: parseFloat(shippingCost.toFixed(2)),
      totalPrice:    parseFloat(total.toFixed(2))
    };

    console.log('[Checkout] Placing order →', { itemCount: orderItems.length, total: orderData.totalPrice });

    try {
      const response = await fetch(`${API_BASE}/api/orders/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`
        },
        body: JSON.stringify(orderData)
      });

      let data;
      try {
        data = await response.json();
      } catch (_) {
        data = { message: `Server returned status ${response.status}.` };
      }

      console.log('[Checkout] Order API response:', response.status, data);

      if (response.status === 401) {
        // JWT expired mid-session — clear stale session and redirect to login
        console.warn('[Checkout] ⚠️ 401 from order API — session expired, clearing and redirecting');
        localStorage.removeItem('sharadha_token');
        localStorage.removeItem('sharadha_user');
        showToast('Your session expired. Redirecting to sign in…', 'warning');
        setTimeout(() => navigate('/login?redirect=/checkout'), 1500);
        return;
      }

      if (response.ok) {
        orderSucceededRef.current = true;  // prevent cart-empty guard from firing
        // Navigate FIRST, then clear cart — avoids race where cart-empty guard redirects to /shop
        navigate(`/order-success/${data._id}`, { state: { order: data, customerName: user?.name } });
        setTimeout(() => clearCart(), 300);
        showToast('Order placed successfully! Thank you. 🎉', 'success');
      } else {
        const msg = data?.message || `Order could not be placed. Please try again.`;
        showToast(msg, 'error');
      }
    } catch (error) {
      console.error('[Checkout] Network error placing order:', error);
      showToast(
        'Unable to connect to the server. Please check your internet connection and try again.',
        'error'
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <>
    <div className="container" style={{ paddingBottom: '5rem' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '2rem 0' }}>Secure Checkout</h1>

      {/* ── Session / connectivity banners ───────────────────────────────── */}

      {/* 1. Checking connection (backend status unknown) */}
      {sessionStatus === 'local-only' && backendUp === null && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.9rem 1.25rem', borderRadius: 'var(--radius)',
          background: 'rgba(59,130,246,0.08)', border: '1.5px solid rgba(59,130,246,0.3)',
          marginBottom: '1.5rem',
        }}>
          <span style={{ fontSize: '1.3rem' }}>🔄</span>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
            <strong>Checking your session…</strong> Please wait a moment.
          </p>
        </div>
      )}

      {/* 2. Offline mode (backend confirmed down) */}
      {sessionStatus === 'local-only' && backendUp === false && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap',
          padding: '1.1rem 1.25rem', borderRadius: 'var(--radius)',
          background: 'rgba(234,179,8,0.08)', border: '1.5px solid rgba(234,179,8,0.35)',
          marginBottom: '1.5rem',
        }}>
          <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>📡</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, marginBottom: '0.3rem', fontSize: '0.95rem' }}>
              Backend Server Not Running
            </p>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              The backend server is not reachable. To start it, open a terminal in the
              {' '}<strong>flask-backend</strong> folder and run:{' '}
              <code style={{ background: 'rgba(0,0,0,0.15)', padding: '1px 5px', borderRadius: '3px', fontFamily: 'monospace' }}>py app.py</code>
              <br />Your cart items are saved locally and will be ready once the server starts.
            </p>
          </div>
          <button
            onClick={() => retryBackendCheck().then(() => window.location.reload())}
            style={{
              padding: '0.5rem 1rem', borderRadius: 'var(--radius)',
              border: '1px solid rgba(234,179,8,0.5)', background: 'transparent',
              color: 'var(--text-muted)', fontSize: '0.82rem', cursor: 'pointer',
              flexShrink: 0, whiteSpace: 'nowrap',
            }}
          >
            🔄 Retry Connection
          </button>
        </div>
      )}

      {/* 3. Backend is up but user only has a local session — must sign in */}
      {sessionStatus === 'local-only' && backendUp === true && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap',
          padding: '1.1rem 1.25rem', borderRadius: 'var(--radius)',
          background: 'rgba(239,68,68,0.07)', border: '1.5px solid rgba(239,68,68,0.3)',
          marginBottom: '1.5rem',
        }}>
          <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>🔐</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, marginBottom: '0.35rem', fontSize: '0.95rem' }}>
              Please Sign In to Continue
            </p>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              The server is now online. Sign in with your account to place your order.
              Your cart items will be kept. Redirecting in a few seconds…
            </p>
          </div>
          <button
            onClick={() => {
              clearTimeout(autoRedirectTimerRef.current);
              navigate('/login?redirect=/checkout');
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.6rem 1.2rem', borderRadius: 'var(--radius)',
              background: 'var(--secondary)', color: '#fff',
              fontWeight: 700, fontSize: '0.88rem', border: 'none',
              cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
            }}
          >
            <LogIn size={15} /> Sign In Now
          </button>
        </div>
      )}

      {/* Stepper indicators */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '1.5rem',
        marginBottom: '3rem',
        flexWrap: 'wrap'
      }}>
        {/* Step 1 indicator */}
        <button
          onClick={() => setStep(1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: step >= 1 ? 'var(--secondary)' : 'var(--text-muted)',
            fontWeight: step === 1 ? 700 : 500
          }}
        >
          <span style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: step >= 1 ? 'var(--secondary)' : 'var(--border)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.85rem'
          }}>1</span>
          Shipping Address
        </button>
        
        <span style={{ width: '40px', height: '1px', background: 'var(--border)' }}></span>

        {/* Step 2 indicator */}
        <button
          onClick={() => selectedAddressId && sessionVerified && setStep(2)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: step >= 2 ? 'var(--secondary)' : 'var(--text-muted)',
            fontWeight: step === 2 ? 700 : 500
          }}
          disabled={!selectedAddressId || !sessionVerified}
        >
          <span style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: step >= 2 ? 'var(--secondary)' : 'var(--border)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.85rem'
          }}>2</span>
          Payment Method
        </button>
        
        <span style={{ width: '40px', height: '1px', background: 'var(--border)' }}></span>

        {/* Step 3 indicator */}
        <button
          onClick={() => selectedAddressId && sessionVerified && setStep(3)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: step >= 3 ? 'var(--secondary)' : 'var(--text-muted)',
            fontWeight: step === 3 ? 700 : 500
          }}
          disabled={!selectedAddressId || !sessionVerified}
        >
          <span style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: step >= 3 ? 'var(--secondary)' : 'var(--border)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.85rem'
          }}>3</span>
          Review & Place
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
        
        {/* Left Column - Form content */}
        <div style={{ flex: '2 1 600px' }}>
          
          {/* STEP 1: ADDRESS MANAGEMENT */}
          {step === 1 && (
            <div className="card-glass" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={20} style={{ color: 'var(--secondary)' }} /> Choose Delivery Address
              </h3>

              {user.addresses && user.addresses.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  {user.addresses.map((addr) => {
                    const addrId = String(addr._id);
                    const isSelected = String(selectedAddressId) === addrId;
                    return (
                      <div
                        key={addrId}
                        onClick={() => {
                          setSelectedAddressId(addrId);
                          setSelectedAddressData(addr);
                        }}
                        style={{
                          padding: '1.25rem',
                          borderRadius: 'var(--radius)',
                          border: isSelected ? '2px solid var(--secondary)' : '1px solid var(--border)',
                          background: isSelected ? 'rgba(46, 125, 50, 0.06)' : 'var(--card)',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {isSelected && (
                          <span style={{
                            position: 'absolute', top: '10px', left: '10px',
                            width: '18px', height: '18px', borderRadius: '50%',
                            background: 'var(--secondary)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff'
                          }}>✓</span>
                        )}
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', paddingLeft: isSelected ? '24px' : '0' }}>
                          {addr.isDefault && <span className="badge badge-secondary" style={{ marginRight: '0.5rem', padding: '0.1rem 0.3rem' }}>Default</span>}
                          Address
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                          {addr.street},<br />
                          {addr.city}, {addr.state} - {addr.postalCode}<br />
                          {addr.country}
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteAddress(addrId); }}
                          style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--text-muted)' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem 0' }}>
                  No addresses saved yet. Please add a shipping address below.
                </div>
              )}

              {/* Add Address Form toggle button */}
              {!showAddAddress ? (
                <button
                  onClick={() => setShowAddAddress(true)}
                  className="btn btn-outline btn-sm"
                  style={{ alignSelf: 'flex-start', display: 'flex', gap: '0.25rem' }}
                >
                  <Plus size={16} /> Add New Address
                </button>
              ) : (
                <form onSubmit={handleAddAddressSubmit} style={{
                  padding: '1.25rem',
                  border: '1px dashed var(--border)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--background)'
                }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>Add Address Detail</h4>
                  <div className="form-group">
                    <label className="form-label">Street / Area Address</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Flat 402, Gandhi Street"
                      value={newStreet}
                      onChange={(e) => setNewStreet(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">City</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Chennai"
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">State</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Tamil Nadu"
                        value={newState}
                        onChange={(e) => setNewState(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Postal / Pincode</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="600004"
                        value={newPostal}
                        onChange={(e) => setNewPostal(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Country</label>
                      <input
                        type="text"
                        className="form-input"
                        value={newCountry}
                        disabled
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', alignItems: 'center' }}>
                    <button
                      type="submit"
                      className="btn btn-secondary btn-sm"
                      disabled={savingAddress}
                      style={{ minWidth: '120px' }}
                    >
                      {savingAddress ? 'Saving...' : '✓ Save Address'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddAddress(false)}
                      className="btn btn-outline btn-sm"
                      disabled={savingAddress}
                    >
                      Cancel
                    </button>
                    {savingAddress && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Saving to your account...</span>
                    )}
                  </div>
                </form>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                {sessionStatus === 'local-only' && backendUp === true ? (
                  <button
                    onClick={() => {
                      clearTimeout(autoRedirectTimerRef.current);
                      localStorage.removeItem('sharadha_token');
                      localStorage.removeItem('sharadha_user');
                      navigate('/login?redirect=/checkout');
                    }}
                    className="btn btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    🔐 Sign In to Continue
                  </button>
                ) : (
                  <button
                    onClick={() => sessionVerified && setStep(2)}
                    className="btn btn-secondary"
                    disabled={!selectedAddressId || !sessionVerified}
                    style={{
                      opacity: (selectedAddressId && sessionVerified) ? 1 : 0.45,
                      cursor: (selectedAddressId && sessionVerified) ? 'pointer' : 'not-allowed',
                      transition: 'opacity 0.2s'
                    }}
                  >
                    {!selectedAddressId
                      ? 'Select an Address to Continue'
                      : !sessionVerified
                      ? 'Verifying session…'
                      : 'Continue to Payment →'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: PAYMENT METHOD */}
          {step === 2 && (
            <div className="card-glass" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={20} style={{ color: 'var(--secondary)' }} /> Select Payment Method
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* UPI Selector */}
                <label style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius)',
                  border: paymentMethod === 'UPI' ? '2px solid var(--secondary)' : '1px solid var(--border)',
                  background: paymentMethod === 'UPI' ? 'rgba(46, 125, 50, 0.03)' : 'var(--card)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem'
                }}>
                  <input
                    type="radio"
                    name="payment"
                    value="UPI"
                    checked={paymentMethod === 'UPI'}
                    onChange={() => setPaymentMethod('UPI')}
                    style={{ marginTop: '4px' }}
                  />
                  <div style={{ flexGrow: 1 }}>
                    <span style={{ fontWeight: 600, display: 'block' }}>UPI (GPay / PhonePe / Paytm)</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Scan QR or type UPI ID for mock prompt validation</span>
                    {paymentMethod === 'UPI' && (
                      <div className="form-group" style={{ marginTop: '1rem', marginBottom: 0 }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="ramesh@okhdfcbank"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          style={{ height: '36px', fontSize: '0.85rem' }}
                        />
                      </div>
                    )}
                  </div>
                </label>

                {/* Card Selector */}
                <label style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius)',
                  border: paymentMethod === 'Card' ? '2px solid var(--secondary)' : '1px solid var(--border)',
                  background: paymentMethod === 'Card' ? 'rgba(46, 125, 50, 0.03)' : 'var(--card)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem'
                }}>
                  <input
                    type="radio"
                    name="payment"
                    value="Card"
                    checked={paymentMethod === 'Card'}
                    onChange={() => setPaymentMethod('Card')}
                    style={{ marginTop: '4px' }}
                  />
                  <div style={{ flexGrow: 1 }}>
                    <span style={{ fontWeight: 600, display: 'block' }}>Credit / Debit Card</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Visa, MasterCard, RuPay cards supported</span>
                    {paymentMethod === 'Card' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Card Number (4111 2222 3333 4444)"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          style={{ height: '36px', fontSize: '0.85rem' }}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.05rem' }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            style={{ height: '36px', fontSize: '0.85rem' }}
                          />
                          <input
                            type="password"
                            className="form-input"
                            placeholder="CVV"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            style={{ height: '36px', fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </label>

                {/* COD Selector */}
                <label style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius)',
                  border: paymentMethod === 'COD' ? '2px solid var(--secondary)' : '1px solid var(--border)',
                  background: paymentMethod === 'COD' ? 'rgba(46, 125, 50, 0.03)' : 'var(--card)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem'
                }}>
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    style={{ marginTop: '4px' }}
                  />
                  <div>
                    <span style={{ fontWeight: 600, display: 'block' }}>Cash On Delivery (COD)</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pay cash/UPI at the time of delivery</span>
                  </div>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setStep(1)} className="btn btn-outline">
                  Back
                </button>
                <button type="button" onClick={() => setStep(3)} className="btn btn-secondary">
                  Proceed to Review
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW SUMMARY */}
          {step === 3 && (
            <div className="card-glass" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Review Order Items</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {cartItems.map((item) => (
                  <div key={item.product} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid var(--border)'
                  }}>
                    <img src={item.images[0]} alt="" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                    <div style={{ flexGrow: 1 }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.title}</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rs. {item.price} x {item.quantity}</span>
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Rs. {item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Delivery Details Recap */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>Delivery Address</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {selectedAddress
                      ? `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.postalCode}`
                      : 'No address selected'}
                  </p>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>Payment Choice</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : `${paymentMethod} (Mock Verified)`}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <button type="button" onClick={() => setStep(2)} className="btn btn-outline">
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCancelCheckout(true)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.55rem 1.1rem', borderRadius: 'var(--radius)',
                      border: '1.5px solid #ef4444', color: '#ef4444',
                      background: 'transparent', fontWeight: 600, fontSize: '0.88rem',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    ✕ Cancel Order
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="btn btn-secondary btn-gradient"
                  style={{
                    gap: '0.5rem', minWidth: '200px',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    height: '48px', fontSize: '1rem', fontWeight: 700,
                    opacity: placingOrder ? 0.85 : 1,
                    pointerEvents: placingOrder ? 'none' : 'auto',
                    cursor: placingOrder ? 'not-allowed' : 'pointer',
                    transition: 'opacity 0.2s',
                  }}
                >
                  {placingOrder ? (
                    <>
                      <span style={{
                        width: '18px', height: '18px',
                        border: '2.5px solid rgba(255,255,255,0.35)',
                        borderTopColor: '#fff', borderRadius: '50%',
                        animation: 'spin 0.7s linear infinite',
                        display: 'inline-block', flexShrink: 0,
                      }} />
                      Processing your order…
                    </>
                  ) : (
                    <>✓ Place Order</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Billing summaries */}
        <div style={{ flex: '1 1 300px' }} className="card-glass">
          <div style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingBag size={18} /> Cart Detail
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                <span>Rs. {subtotal}</span>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981' }}>
                  <span>Discount:</span>
                  <span>- Rs. {discountAmount}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>GST Tax (5%):</span>
                <span>Rs. {tax}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Shipping Cost:</span>
                <span>{shippingCost === 0 ? <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>FREE</span> : `Rs. ${shippingCost}`}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.5rem' }}>
              <span>Total Payable:</span>
              <span style={{ color: 'var(--secondary)' }}>Rs. {total}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <ShieldCheck size={16} style={{ color: 'var(--secondary)' }} /> Secured connection. Authentic handmade foods.
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Cancel Checkout Modal */}
    <CancelOrderModal
      isOpen={showCancelCheckout}
      title="Cancel Checkout?"
      message="Are you sure you want to cancel this order? All checkout details will be removed and you'll be redirected to your cart."
      confirmLabel="Yes, Cancel Order"
      onClose={() => setShowCancelCheckout(false)}
      onConfirm={async () => {
        setShowCancelCheckout(false);
        clearCart();
        showToast('Order cancelled successfully.', 'success');
        navigate('/cart');
      }}
    />
    </>
  );
}
