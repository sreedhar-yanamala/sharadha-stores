import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, RefreshCw, ShoppingCart, Plus, Minus, Trash2, Shield, Play, Pause, Trash } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getProducts } from '../data/products';
import { API_BASE } from '../config/api';

export default function Subscription() {
  const { user, token } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  // Mode: 'plans' (browse options), 'subscribe' (configure details), 'manage' (view existing)
  const [activeTab, setActiveTab] = useState('plans');
  const [selectedPlanType, setSelectedPlanType] = useState('Weekly');
  const [deliveryDay, setDeliveryDay] = useState('Tuesday');
  
  // Custom items list in subscription configure flow
  const [subItems, setSubItems] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submittingSub, setSubmittingSub] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  // Existing subscriptions lists
  const [mySubscriptions, setMySubscriptions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // Get available products locally
  useEffect(() => {
    if (activeTab === 'subscribe') {
      setLoadingProducts(true);
      try {
        const data = getProducts({ pageSize: 10 });
        setProductsList(data.products || []);
      } catch (error) {
        console.error('Error fetching subscription products:', error);
      } finally {
        setLoadingProducts(false);
      }
    }
  }, [activeTab]);

  // Fetch user subscriptions
  useEffect(() => {
    if (activeTab === 'manage' && token) {
      fetchMySubscriptions();
    }
  }, [activeTab, token]);

  const fetchMySubscriptions = async () => {
    setLoadingSubs(true);
    try {
      const response = await fetch(`${API_BASE}/api/subscriptions/mysubscriptions`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setMySubscriptions(data);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleStartSubscribeConfig = (planType) => {
    if (!user) {
      showToast('Please sign in to configure a subscription plan.', 'info');
      navigate('/login?redirect=/subscriptions');
      return;
    }
    setSelectedPlanType(planType);
    setSubItems([]);
    setActiveTab('subscribe');
  };

  const handleAddProductToSub = (product) => {
    const exists = subItems.find(item => item.product === product._id);
    const itemPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
    // Apply subscription plan percentage discount (Weekly: 10%, Monthly: 15%, Festive: 20%)
    const discountFactor = selectedPlanType === 'Weekly' ? 0.90 : selectedPlanType === 'Monthly' ? 0.85 : 0.80;
    const finalSubPrice = Math.round(itemPrice * discountFactor);

    if (exists) {
      setSubItems(prev => prev.map(item =>
        item.product === product._id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setSubItems(prev => [...prev, {
        product: product._id,
        title: product.title,
        quantity: 1,
        price: finalSubPrice
      }]);
    }
    showToast(`Added ${product.title} to subscription plan.`, 'success');
  };

  const handleRemoveProductFromSub = (prodId) => {
    setSubItems(prev => prev.filter(item => item.product !== prodId));
  };

  const updateSubQty = (prodId, qty) => {
    setSubItems(prev => prev.map(item =>
      item.product === prodId ? { ...item, quantity: Math.max(1, qty) } : item
    ));
  };

  const handleCreateSubscription = async (e) => {
    e.preventDefault();
    if (subItems.length === 0) {
      showToast('Please select at least one item for your subscription.', 'warning');
      return;
    }
    if (!token) {
      showToast('You must be signed in to create a subscription.', 'error');
      navigate('/login?redirect=/subscriptions');
      return;
    }
    setSubmittingSub(true);
    const payload = {
      planType: selectedPlanType,
      items: subItems,
      deliveryDay,
      paymentMethod
    };
    console.log('[Subscription] Sending payload:', JSON.stringify(payload, null, 2));
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
      const response = await fetch(`${API_BASE}/api/subscriptions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeout);
      const data = await response.json();
      console.log('[Subscription] Response:', response.status, data);
      
      if (response.ok) {
        showToast('Subscription activated successfully! 🎉', 'success');
        setSubItems([]);
        setActiveTab('manage');
      } else {
        // Show the specific backend error message
        const msg = data.message || `Server error (${response.status})`;
        showToast(msg, 'error');
      }
    } catch (error) {
      console.error('[Subscription] Network error:', error);
      if (error.name === 'AbortError') {
        showToast('Request timed out. The server took too long to respond.', 'error');
      } else if (error.message && error.message.includes('Failed to fetch')) {
        showToast('Cannot reach the server. Make sure the backend is running on port 5000.', 'error');
      } else {
        showToast(`Error: ${error.message || 'Unknown error occurred'}`, 'error');
      }
    } finally {
      setSubmittingSub(false);
    }
  };

  const handleUpdateStatus = async (subId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE}/api/subscriptions/${subId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        showToast(`Subscription ${newStatus === 'Active' ? 'resumed' : newStatus === 'Paused' ? 'paused' : 'cancelled'} successfully.`, 'success');
        fetchMySubscriptions();
      } else {
        showToast(data.message || `Failed to update subscription status.`, 'error');
      }
    } catch (error) {
      console.error('[Subscription] Status update error:', error);
      showToast('Cannot reach the server. Check backend connection.', 'error');
    }
  };

  const subTotalCost = subItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '80vh', fontFamily: 'var(--font-body)', paddingBottom: '4rem' }}>
      <div className="container">
        {/* Page Header */}
        <div style={{
          padding: '2.5rem 0 2rem',
          borderBottom: '1px solid var(--border)',
          marginBottom: '2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 700 }}>SUBSCRIPTION PLANS</span>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)', margin: '0.25rem 0 0.5rem' }}>Sharadha Subscriptions</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Fresh batch deliveries scheduled straight to your family kitchen</p>
          </div>

          {/* Tab triggers */}
          <div style={{ display: 'flex', border: '2px solid var(--primary)', borderRadius: '2rem', overflow: 'hidden' }}>
            <button
              onClick={() => setActiveTab('plans')}
              style={{
                borderRadius: 0,
                padding: '0.6rem 1.5rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                transition: 'all 0.2s',
                background: activeTab === 'plans' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'plans' ? '#FFFFFF' : 'var(--primary)',
              }}
            >
              Explore Plans
            </button>
            <button
              onClick={() => {
                if (!user) {
                  showToast('Please sign in to manage subscriptions.', 'info');
                  navigate('/login?redirect=/subscriptions');
                } else {
                  setActiveTab('manage');
                }
              }}
              style={{
                borderRadius: 0,
                padding: '0.6rem 1.5rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                transition: 'all 0.2s',
                background: activeTab === 'manage' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'manage' ? '#FFFFFF' : 'var(--primary)',
              }}
            >
              My Subscriptions
            </button>
          </div>
        </div>

      {/* PLAN TYPE 1: EXPLORE AVAILABLE PACKAGES */}
      {activeTab === 'plans' && (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '2rem', marginBottom: '2rem' }} className="fade-in">

          {/* Weekly Snack Plan */}
          <div style={{
            padding: '2rem',
            display: 'flex', flexDirection: 'column',
            borderRadius: 'var(--radius-lg)',
            border: '1.5px solid var(--border)',
            background: 'var(--card)',
            boxShadow: 'var(--shadow)',
            transition: 'transform 0.3s, box-shadow 0.3s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='var(--shadow-lg)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='var(--shadow)'; }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <span style={{ fontSize: '2rem' }}>🥨</span>
              <span style={{ background: 'rgba(46,125,50,0.12)', color: 'var(--primary)', fontWeight: 700, fontSize: '0.78rem', padding: '0.3rem 0.75rem', borderRadius: '2rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>SAVES 10%</span>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--primary)' }}>Weekly Snack Plan</h3>
            <div style={{ width: '40px', height: '3px', background: 'linear-gradient(90deg, var(--accent-dark), var(--accent))', borderRadius: '2px', marginBottom: '1rem' }}></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', flexGrow: 1, lineHeight: '1.7' }}>
              Fresh traditional snacks (crispy Murukkus, butter coils, mixture packs) shipped every week. Ideal for evening tea.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: 'var(--primary)', fontWeight: 700 }}>✓</span> Hand-pressed fresh batches</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: 'var(--primary)', fontWeight: 700 }}>✓</span> Delivered on your selected day</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: 'var(--primary)', fontWeight: 700 }}>✓</span> Toggle or pause anytime</li>
            </ul>
            <button onClick={() => handleStartSubscribeConfig('Weekly')}
              style={{
                background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
                color: '#FFFFFF', fontWeight: 700,
                padding: '0.85rem', borderRadius: '2rem', border: 'none',
                width: '100%', cursor: 'pointer', fontSize: '0.95rem',
                boxShadow: '0 4px 14px rgba(46,125,50,0.30)',
                transition: 'all 0.25s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 8px 20px rgba(46,125,50,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 4px 14px rgba(46,125,50,0.30)'; }}
            >
              Configure Weekly Plan
            </button>
          </div>

          {/* Monthly Pantry Plan */}
          <div style={{
            padding: '2rem',
            display: 'flex', flexDirection: 'column',
            borderRadius: 'var(--radius-lg)',
            border: '1.5px solid var(--border)',
            background: 'var(--card)',
            boxShadow: 'var(--shadow)',
            transition: 'transform 0.3s, box-shadow 0.3s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='var(--shadow-lg)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='var(--shadow)'; }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <span style={{ fontSize: '2rem' }}>🥒</span>
              <span style={{ background: 'rgba(212,175,55,0.15)', color: '#B8960C', fontWeight: 700, fontSize: '0.78rem', padding: '0.3rem 0.75rem', borderRadius: '2rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>SAVES 15%</span>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--primary)' }}>Monthly Pantry Plan</h3>
            <div style={{ width: '40px', height: '3px', background: 'linear-gradient(90deg, var(--accent-dark), var(--accent))', borderRadius: '2px', marginBottom: '1rem' }}></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', flexGrow: 1, lineHeight: '1.7' }}>
              Spicy Pickled Red Chilies, Aged Mixed Vegetables, and fresh spice powders (Sambar powder, Curry Leaf Gunpowder) every month.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: 'var(--primary)', fontWeight: 700 }}>✓</span> Milled and cured on demand</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: 'var(--primary)', fontWeight: 700 }}>✓</span> Flat 15% discount on products</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: 'var(--primary)', fontWeight: 700 }}>✓</span> Pause during travel dates</li>
            </ul>
            <button onClick={() => handleStartSubscribeConfig('Monthly')}
              style={{
                background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
                color: '#FFFFFF', fontWeight: 700,
                padding: '0.85rem', borderRadius: '2rem', border: 'none',
                width: '100%', cursor: 'pointer', fontSize: '0.95rem',
                boxShadow: '0 4px 14px rgba(46,125,50,0.30)',
                transition: 'all 0.25s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 8px 20px rgba(46,125,50,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 4px 14px rgba(46,125,50,0.30)'; }}
            >
              Configure Monthly Plan
            </button>
          </div>

          {/* Festival Combo Plan */}
          <div style={{
            padding: '2rem',
            display: 'flex', flexDirection: 'column',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid var(--accent)',
            background: 'linear-gradient(160deg, #FFFDF8 0%, #FFF8E1 100%)',
            boxShadow: '0 8px 28px rgba(212,175,55,0.20)',
            transition: 'transform 0.3s, box-shadow 0.3s',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 16px 40px rgba(212,175,55,0.30)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 8px 28px rgba(212,175,55,0.20)'; }}>
            {/* Gold corner accent */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderStyle: 'solid', borderWidth: '0 60px 60px 0', borderColor: `transparent var(--accent) transparent transparent` }}></div>
            <div style={{ position: 'absolute', top: '6px', right: '6px', fontSize: '0.6rem', color: '#1F2937', fontWeight: 800, transform: 'rotate(45deg)', zIndex: 1 }}>BEST</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <span style={{ fontSize: '2rem' }}>🎁</span>
              <span style={{ background: 'linear-gradient(135deg, #D4AF37, #B8960C)', color: '#1F2937', fontWeight: 700, fontSize: '0.78rem', padding: '0.3rem 0.75rem', borderRadius: '2rem', letterSpacing: '0.5px', textTransform: 'uppercase', boxShadow: '0 2px 8px rgba(212,175,55,0.40)' }}>SAVES 20%</span>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1B5E20' }}>Festival Combo Plan</h3>
            <div style={{ width: '40px', height: '3px', background: 'linear-gradient(90deg, #B8960C, #D4AF37, #F0D060)', borderRadius: '2px', marginBottom: '1rem' }}></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', flexGrow: 1, lineHeight: '1.7' }}>
              Holiday specialties (Mysore Pak, Adhirasam, special mixture bundles) scheduled for shipping prior to major festivals (Pongal, Diwali).
            </p>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: '#B8960C', fontWeight: 700 }}>✓</span> Shipped 3 days before festival</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: '#B8960C', fontWeight: 700 }}>✓</span> Special handmade gift boxes</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: '#B8960C', fontWeight: 700 }}>✓</span> Saves maximum 20% on prices</li>
            </ul>
            <button onClick={() => handleStartSubscribeConfig('Festival_Combo')}
              style={{
                background: 'linear-gradient(135deg, #D4AF37, #B8960C)',
                color: '#1F2937', fontWeight: 700,
                padding: '0.85rem', borderRadius: '2rem', border: 'none',
                width: '100%', cursor: 'pointer', fontSize: '0.95rem',
                boxShadow: '0 4px 16px rgba(212,175,55,0.45)',
                transition: 'all 0.25s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(212,175,55,0.60)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 4px 16px rgba(212,175,55,0.45)'; }}
            >
              Configure Festival Plan ✨
            </button>
          </div>
        </section>
      )}

      {/* PLAN TYPE 2: CONFIGURE SUBSCRIPTION FORM */}
      {activeTab === 'subscribe' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }} className="fade-in">
          {/* Left Panel: Pick items & frequencies */}
          <form onSubmit={handleCreateSubscription} style={{
            flex: '2 1 500px',
            background: 'var(--card)',
            borderRadius: 'var(--radius-lg)',
            border: '1.5px solid var(--border)',
            boxShadow: 'var(--shadow)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--border)',
              background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
              color: '#FFFFFF'
            }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>Configure {selectedPlanType} Subscription</h3>
              <p style={{ fontSize: '0.82rem', opacity: 0.85, margin: '0.25rem 0 0' }}>
                {selectedPlanType === 'Weekly' ? 'Saves 10% on every delivery' : selectedPlanType === 'Monthly' ? 'Saves 15% on every delivery' : 'Saves 20% on every delivery'}
              </p>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Delivery Day (Weekly Only) */}
              {selectedPlanType === 'Weekly' && (
                <div className="form-group">
                  <label className="form-label">Preferred Delivery Day</label>
                  <select
                    value={deliveryDay}
                    onChange={(e) => setDeliveryDay(e.target.value)}
                    className="form-input"
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>
              )}

              {/* Items Selected list */}
              <div>
                <span className="form-label">Items in Subscription</span>
                {subItems.length === 0 ? (
                  <div style={{ padding: '2rem', border: '2px dashed var(--border)', borderRadius: 'var(--radius)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', background: 'var(--background-alt)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛒</div>
                    No products added yet. Click 'Add' on the product list panel on the right.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {subItems.map(item => (
                      <div key={item.product} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.85rem 1rem',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--background-alt)'
                      }}>
                        <div style={{ flexGrow: 1 }}>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>{item.title}</h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>Rs. {item.price.toFixed(0)} per delivery</span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--primary)', borderRadius: '2rem', overflow: 'hidden' }}>
                            <button type="button" onClick={() => updateSubQty(item.product, item.quantity - 1)} style={{ padding: '0.25rem 0.6rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}><Minus size={12} /></button>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '20px', textAlign: 'center', color: 'var(--primary)' }}>{item.quantity}</span>
                            <button type="button" onClick={() => updateSubQty(item.product, item.quantity + 1)} style={{ padding: '0.25rem 0.6rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}><Plus size={12} /></button>
                          </div>
                          <button type="button" onClick={() => handleRemoveProductFromSub(item.product)} style={{ color: '#EF4444', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment selection */}
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="form-input">
                  <option value="UPI">UPI Auto-pay (Google Pay / PhonePe)</option>
                  <option value="Card">Saved Debit/Credit Card auto-charge</option>
                </select>
              </div>

              {/* Order Summary */}
              {subItems.length > 0 && (
                <div style={{ background: 'rgba(46,125,50,0.06)', borderRadius: 'var(--radius)', padding: '1rem', border: '1px solid rgba(46,125,50,0.20)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Subtotal per delivery</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Rs. {subTotalCost.toFixed(0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Plan discount applied</span>
                    <span style={{ fontWeight: 600, color: '#D4AF37' }}>
                      {selectedPlanType === 'Weekly' ? '10%' : selectedPlanType === 'Monthly' ? '15%' : '20%'} OFF
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setActiveTab('plans')} style={{
                  flex: 1, padding: '0.85rem', borderRadius: '2rem',
                  border: '2px solid var(--primary)', background: 'transparent',
                  color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem'
                }}>
                  ← Back
                </button>
                <button type="submit" disabled={submittingSub} style={{
                  flex: 2, padding: '0.85rem', borderRadius: '2rem', border: 'none',
                  background: submittingSub ? 'var(--text-muted)' : 'linear-gradient(135deg, #D4AF37, #B8960C)',
                  color: '#1F2937', fontWeight: 700, cursor: submittingSub ? 'not-allowed' : 'pointer',
                  fontSize: '0.95rem', boxShadow: '0 4px 16px rgba(212,175,55,0.38)',
                  transition: 'all 0.25s'
                }}>
                  {submittingSub ? '⏳ Setting up...' : `✅ Activate Plan — Rs. ${subTotalCost.toFixed(0)} / ${selectedPlanType === 'Weekly' ? 'Week' : 'Month'}`}
                </button>
              </div>
            </div>
          </form>

          {/* Right Panel: Browse products to add */}
          <div style={{
            flex: '1 1 300px',
            background: 'var(--card)',
            borderRadius: 'var(--radius-lg)',
            border: '1.5px solid var(--border)',
            boxShadow: 'var(--shadow)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--background-alt)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', margin: 0 }}>Add Homemade Products</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>Discounts applied automatically</p>
            </div>
            
            <div style={{ padding: '1.25rem', maxHeight: '500px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {loadingProducts ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2rem' }}>Loading catalogue...</div>
              ) : productsList.map(prod => (
                <div key={prod._id} style={{
                  display: 'flex', gap: '0.75rem', alignItems: 'center',
                  borderBottom: '1px solid var(--border)', paddingBottom: '0.85rem'
                }}>
                  <img src={prod.images[0]} alt="" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prod.title}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Rs. {prod.price}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddProductToSub(prod)}
                    style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: '1.5rem',
                      background: 'var(--primary)',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background='var(--secondary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='var(--primary)'; }}
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB TYPE 3: MY ACTIVE SUBSCRIPTIONS */}
      {activeTab === 'manage' && (
        <div className="fade-in">
          {loadingSubs ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>Loading subscription details...</div>
          ) : mySubscriptions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              color: 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              background: 'var(--card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow)'
            }}>
              <span style={{ fontSize: '3.5rem' }}>🗓️</span>
              <h3 style={{ color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>No Active Subscriptions</h3>
              <p style={{ maxWidth: '380px', lineHeight: '1.6' }}>Schedule your weekly snacks or monthly cooking spices to enjoy discounts automatically.</p>
              <button onClick={() => setActiveTab('plans')} style={{
                background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
                color: '#FFFFFF', fontWeight: 700,
                padding: '0.85rem 2rem', borderRadius: '2rem', border: 'none',
                cursor: 'pointer', fontSize: '0.95rem',
                boxShadow: '0 4px 14px rgba(46,125,50,0.30)'
              }}>Explore Plans</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {mySubscriptions.map(sub => (
                <div key={sub._id} style={{
                  background: 'var(--card)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1.5px solid var(--border)',
                  boxShadow: 'var(--shadow)',
                  overflow: 'hidden'
                }}>
                  {/* Status header bar */}
                  <div style={{
                    padding: '0.75rem 1.75rem',
                    background: sub.status === 'Active' ? 'linear-gradient(135deg, #2E7D32, #1B5E20)'
                              : sub.status === 'Paused' ? 'linear-gradient(135deg, #B8960C, #D4AF37)'
                              : '#6B7280',
                    color: sub.status === 'Paused' ? '#1F2937' : '#FFFFFF',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                      {sub.status === 'Active' ? '🟢' : sub.status === 'Paused' ? '⏸️' : '❌'} {sub.planType} Refill Plan
                    </span>
                    <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>Status: {sub.status}</span>
                  </div>

                  <div style={{ padding: '1.75rem' }}>
                    {/* Summary row */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1.5rem',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        📅 Next Delivery: <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                          {new Date(sub.nextDeliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} ({sub.deliveryDay || 'Monthly'})
                        </span>
                      </div>
                      
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>
                        Rs. {Number(sub.price).toFixed(0)} / delivery
                      </div>
                    </div>

                    {/* Items + actions */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                      <div style={{ flex: '2 1 400px' }}>
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Included Items:</h4>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {sub.items.map((item, i) => (
                            <li key={i} style={{
                              display: 'flex', justifyContent: 'space-between',
                              fontSize: '0.9rem', padding: '0.5rem 0',
                              borderBottom: '1px solid var(--border-light)'
                            }}>
                              <span style={{ color: 'var(--text)' }}>{item.title} <span style={{ color: 'var(--text-muted)' }}>×{item.quantity}</span></span>
                              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Rs. {Number(item.price).toFixed(0)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Manage action buttons */}
                      <div style={{
                        flex: '1 1 180px',
                        borderLeft: '1px solid var(--border)',
                        paddingLeft: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        justifyContent: 'center'
                      }}>
                        {sub.status === 'Active' ? (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(sub._id, 'Paused')}
                              style={{
                                width: '100%', padding: '0.7rem', borderRadius: '2rem',
                                border: '2px solid var(--accent)', background: 'transparent',
                                color: '#B8960C', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                              }}
                            >
                              <Pause size={14} /> Pause Schedule
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(sub._id, 'Cancelled')}
                              style={{
                                width: '100%', padding: '0.7rem', borderRadius: '2rem',
                                border: '2px solid #EF4444', background: 'transparent',
                                color: '#EF4444', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                              }}
                            >
                              <Trash size={14} /> Cancel Plan
                            </button>
                          </>
                        ) : sub.status === 'Paused' ? (
                          <button
                            onClick={() => handleUpdateStatus(sub._id, 'Active')}
                            style={{
                              width: '100%', padding: '0.7rem', borderRadius: '2rem',
                              border: 'none', background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
                              color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                              boxShadow: '0 4px 12px rgba(46,125,50,0.30)'
                            }}
                          >
                            <Play size={14} /> Resume Schedule
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center' }}>
                            This subscription has been cancelled.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
    </div>
  );
}
