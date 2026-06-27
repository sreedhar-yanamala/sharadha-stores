import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle, Package, MapPin, CreditCard,
  Calendar, ArrowRight, Truck, ShoppingBag,
  ClipboardList, ShoppingCart, Star,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { API_BASE } from '../config/api';

/* ── Payment label map ── */
const PAYMENT_LABELS = {
  COD:        'Cash on Delivery (COD)',
  UPI:        'UPI Payment (GPay / PhonePe / Paytm)',
  Card:       'Credit / Debit Card',
  CreditCard: 'Credit Card',
  DebitCard:  'Debit Card',
  NetBanking: 'Net Banking',
};

/* ── Status badge colours ── */
const STATUS_COLORS = {
  Confirmed:  { bg: 'rgba(34,197,94,0.12)',  color: '#15803d', dot: '#22c55e' },
  Processing: { bg: 'rgba(59,130,246,0.12)', color: '#1d4ed8', dot: '#3b82f6' },
  Packed:     { bg: 'rgba(99,102,241,0.12)', color: '#4f46e5', dot: '#6366f1' },
  Shipped:    { bg: 'rgba(245,158,11,0.12)', color: '#b45309', dot: '#f59e0b' },
  Delivered:  { bg: 'rgba(34,197,94,0.12)',  color: '#15803d', dot: '#22c55e' },
  Cancelled:  { bg: 'rgba(239,68,68,0.12)',  color: '#b91c1c', dot: '#ef4444' },
};

/* ── Small animated check pill ── */
function StatusPill({ status }) {
  const s = STATUS_COLORS[status] || { bg: 'var(--border)', color: 'var(--text-muted)', dot: 'var(--text-muted)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
      padding: '0.35rem 1rem', borderRadius: '2rem',
      background: s.bg, color: s.color, fontWeight: 700, fontSize: '0.85rem',
    }}>
      <span style={{
        width: '8px', height: '8px', borderRadius: '50%',
        background: s.dot, animation: 'pulse-dot 1.8s infinite',
        flexShrink: 0,
      }} />
      {status}
    </span>
  );
}

/* ── Info card ── */
function InfoCard({ icon, title, children }) {
  return (
    <div className="card-glass" style={{ padding: '1.25rem' }}>
      <h3 style={{
        fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.9rem',
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        color: 'var(--secondary)',
      }}>
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function OrderConfirmation() {
  const { id } = useParams();
  const { token } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [confettiDone, setConfettiDone] = useState(false);

  /* ── Load order (from router state or API) ── */
  useEffect(() => {
    // Priority 1: use data passed directly from Checkout (no network needed)
    if (location.state?.order) {
      setOrder(location.state.order);
      setCustomerName(location.state.customerName || '');
      setLoading(false);
      return;
    }

    // Priority 2: fetch from API (user refreshed the page)
    // Don't redirect immediately — token may be briefly empty after clearCart
    if (!id) {
      navigate('/');
      return;
    }

    const storedToken = localStorage.getItem('sharadha_token');
    const activeToken = token && token !== 'local' ? token : storedToken;

    if (!activeToken || activeToken === 'local') {
      // No valid token at all — redirect to profile/home
      setLoading(false);
      navigate('/');
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        });
        if (res.ok) {
          setOrder(await res.json());
        } else {
          showToast('Could not load order details.', 'error');
          navigate('/profile');
        }
      } catch {
        showToast('Unable to reach the server.', 'error');
        navigate('/profile');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id, token, location.state]);

  /* ── Trigger confetti fade-out after 4 s ── */
  useEffect(() => {
    if (!loading && order) {
      const t = setTimeout(() => setConfettiDone(true), 4000);
      return () => clearTimeout(t);
    }
  }, [loading, order]);

  /* ── Loading spinner ── */
  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '48px', height: '48px',
          border: '4px solid var(--border)', borderTopColor: 'var(--secondary)',
          borderRadius: '50%', animation: 'spin 0.75s linear infinite',
        }} />
      </div>
    );
  }

  if (!order) return null;

  /* ── Derived values ── */
  const addr = order.shippingAddress || {};
  const statusStyle = STATUS_COLORS[order.orderStatus] || STATUS_COLORS.Confirmed;

  const orderYear = new Date(order.createdAt || Date.now()).getFullYear();
  const orderId   = String(order._id).padStart(6, '0').toUpperCase();
  const formattedOrderId = `SS-${orderYear}-${orderId}`;

  const orderDate = new Date(order.createdAt || Date.now());
  const estMin = new Date(orderDate); estMin.setDate(estMin.getDate() + 3);
  const estMax = new Date(orderDate); estMax.setDate(estMax.getDate() + 5);
  const fmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const payLabel = PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || 'N/A';

  return (
    <>
      {/* ── Injected keyframes ── */}
      <style>{`
        @keyframes pop-in {
          0%   { opacity:0; transform: scale(0.4); }
          70%  { transform: scale(1.1); }
          100% { opacity:1; transform: scale(1); }
        }
        @keyframes slide-up {
          from { opacity:0; transform: translateY(28px); }
          to   { opacity:1; transform: translateY(0); }
        }
        @keyframes pulse-dot {
          0%,100% { opacity:1; transform: scale(1); }
          50%      { opacity:0.5; transform: scale(1.4); }
        }
        @keyframes pulse-ring {
          0%,100% { box-shadow: 0 0 0 0   rgba(34,197,94,0.35); }
          50%     { box-shadow: 0 0 0 18px rgba(34,197,94,0); }
        }
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity:1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity:0; }
        }
        .order-action-btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.75rem 1.5rem; border-radius: 3rem;
          font-weight: 700; font-size: 0.9rem;
          transition: transform 0.18s, box-shadow 0.18s;
          text-decoration: none; cursor: pointer;
        }
        .order-action-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.12); }
        .order-item-row { transition: background 0.15s; border-radius: 8px; padding: 0.75rem; }
        .order-item-row:hover { background: rgba(15,81,50,0.04); }
      `}</style>

      {/* ── Confetti overlay ── */}
      {!confettiDone && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden',
        }}>
          {Array.from({ length: 40 }).map((_, i) => {
            const colors = ['#22c55e','#16a34a','#d4af37','#f59e0b','#10b981','#84cc16'];
            const color  = colors[i % colors.length];
            const left   = `${Math.random() * 100}%`;
            const delay  = `${(Math.random() * 2).toFixed(2)}s`;
            const dur    = `${(2.5 + Math.random() * 1.5).toFixed(2)}s`;
            const size   = `${6 + Math.random() * 8}px`;
            const shape  = i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0';
            return (
              <div key={i} style={{
                position: 'absolute', top: '-20px', left,
                width: size, height: size, background: color,
                borderRadius: shape, opacity: 0,
                animation: `confetti-fall ${dur} ${delay} ease-in forwards`,
              }} />
            );
          })}
        </div>
      )}

      <div className="container" style={{ paddingBottom: '6rem', maxWidth: '800px' }}>

        {/* ══ HERO BANNER ══ */}
        <div style={{
          textAlign: 'center',
          padding: '3.5rem 2rem 3rem',
          marginTop: '2rem',
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, rgba(34,197,94,0.07) 0%, rgba(46,125,50,0.04) 60%, rgba(212,175,55,0.05) 100%)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(34,197,94,0.18)',
          animation: 'slide-up 0.5s ease both',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background decorative circles */}
          <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'180px', height:'180px', borderRadius:'50%', background:'rgba(34,197,94,0.05)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:'-30px', left:'-30px', width:'130px', height:'130px', borderRadius:'50%', background:'rgba(212,175,55,0.06)', pointerEvents:'none' }} />

          {/* Animated success checkmark */}
          <div style={{
            width: '88px', height: '88px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.75rem',
            animation: 'pop-in 0.5s cubic-bezier(0.175,0.885,0.32,1.275) 0.1s both, pulse-ring 2.5s 0.7s infinite',
          }}>
            <CheckCircle size={44} color="#fff" strokeWidth={2.5} />
          </div>

          {/* Success heading */}
          <h1 style={{
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.6rem,4vw,2.2rem)',
            fontWeight: 800, color: 'var(--text)',
            marginBottom: '0.6rem',
            animation: 'slide-up 0.5s 0.25s both',
          }}>
            ✅ Order Placed Successfully!
          </h1>

          {/* Confirmation message */}
          <p style={{
            color: 'var(--text-muted)', fontSize: '0.95rem',
            lineHeight: 1.7, maxWidth: '520px', margin: '0 auto 1.5rem',
            animation: 'slide-up 0.5s 0.35s both',
          }}>
            Thank you for shopping with us{customerName ? `, ${customerName}` : ''}. Your order has been{' '}
            <strong style={{ color: 'var(--secondary)' }}>confirmed</strong> and is being processed.
            You will receive order updates via <strong>SMS / Email</strong>.
          </p>

          {/* Order ID + Total chips */}
          <div style={{
            display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap',
            animation: 'slide-up 0.5s 0.45s both',
          }}>
            {[
              { label: 'Order ID', value: `#${formattedOrderId}`, icon: '🧾' },
              { label: 'Total',    value: `₹${order.totalPrice?.toFixed(2)}`, icon: '💰' },
              { label: 'Status',   value: order.orderStatus, icon: '📦' },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1.25rem', borderRadius: '2rem',
                background: 'var(--card)', border: '1px solid var(--border)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}>
                <span>{icon}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}:</span>
                <strong style={{ fontSize: '0.92rem', color: 'var(--text)' }}>{value}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* ══ ESTIMATED DELIVERY BANNER ══ */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1rem',
          padding: '1.1rem 1.5rem', borderRadius: 'var(--radius)',
          background: 'linear-gradient(90deg, rgba(15,81,50,0.08), rgba(34,197,94,0.05))',
          border: '1.5px solid rgba(34,197,94,0.2)',
          marginBottom: '1.75rem',
          animation: 'slide-up 0.5s 0.55s both',
        }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'rgba(34,197,94,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Truck size={22} style={{ color: 'var(--secondary)' }} />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '0.15rem' }}>
              Estimated Delivery: 3–5 Business Days
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Expected between <strong>{fmt(estMin)}</strong> and <strong>{fmt(estMax)}</strong>
            </p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <StatusPill status={order.orderStatus || 'Confirmed'} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'slide-up 0.5s 0.65s both' }}>

          {/* ══ ORDERED ITEMS ══ */}
          <InfoCard icon={<ShoppingBag size={15} />} title="Ordered Items">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {(order.orderItems || []).map((item, i) => (
                <div key={i} className="order-item-row" style={{
                  display: 'flex', alignItems: 'center', gap: '0.9rem',
                  paddingBottom: i < order.orderItems.length - 1 ? '0.75rem' : 0,
                  borderBottom: i < order.orderItems.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  {item.images?.[0] ? (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0, border: '1px solid var(--border)' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Package size={22} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      Qty: {item.quantity} × ₹{parseFloat(item.price).toFixed(2)}
                    </p>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--secondary)', whiteSpace: 'nowrap' }}>
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </InfoCard>

          {/* ══ 3-COLUMN INFO GRID ══ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>

            {/* Bill Summary */}
            <InfoCard icon={<CreditCard size={15} />} title="Bill Summary">
              {[
                ['Subtotal',    `₹${order.itemsPrice?.toFixed(2)}`],
                ['Tax (GST 5%)', `₹${order.taxPrice?.toFixed(2)}`],
                ['Shipping',    order.shippingPrice === 0 ? '🎉 FREE' : `₹${order.shippingPrice?.toFixed(2)}`],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  <span>{label}</span><span>{val}</span>
                </div>
              ))}
              <div style={{
                display: 'flex', justifyContent: 'space-between', fontWeight: 800,
                fontSize: '1.05rem', marginTop: '0.6rem', paddingTop: '0.6rem',
                borderTop: '2px solid var(--border)',
              }}>
                <span>Total</span>
                <span style={{ color: 'var(--secondary)' }}>₹{order.totalPrice?.toFixed(2)}</span>
              </div>
              {/* Payment status badge */}
              <div style={{
                marginTop: '0.75rem', padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)', textAlign: 'center',
                background: order.isPaid ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)',
                border: `1px solid ${order.isPaid ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
                fontSize: '0.8rem', fontWeight: 600,
                color: order.isPaid ? '#15803d' : '#b45309',
              }}>
                {order.isPaid ? '✓ Paid' : '⏳ Pay on Delivery'}
              </div>
            </InfoCard>

            {/* Delivery Address */}
            <InfoCard icon={<MapPin size={15} />} title="Delivery Address">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '0.25rem' }}>
                  {customerName || 'Customer'}
                </strong>
                {addr.street}<br />
                {addr.city}, {addr.state}<br />
                {addr.postalCode} — {addr.country}
              </p>
            </InfoCard>

            {/* Payment & Delivery */}
            <InfoCard icon={<Package size={15} />} title="Payment & Delivery">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Method</p>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{payLabel}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Date</p>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Est. Delivery</p>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--secondary)' }}>
                    {fmt(estMin)} – {fmt(estMax)}
                  </p>
                </div>
              </div>
            </InfoCard>
          </div>

          {/* ══ CONFIRMATION MESSAGE BOX ══ */}
          <div style={{
            padding: '1.25rem 1.5rem',
            borderRadius: 'var(--radius)',
            background: 'linear-gradient(135deg, rgba(15,81,50,0.06), rgba(34,197,94,0.04))',
            border: '1px solid rgba(34,197,94,0.2)',
            display: 'flex', gap: '1rem', alignItems: 'flex-start',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'rgba(34,197,94,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Star size={18} style={{ color: 'var(--secondary)' }} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', marginBottom: '0.3rem' }}>
                Thank you for your purchase!
              </p>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                Your order has been received and is being processed. You will receive order updates via{' '}
                <strong>SMS / Email</strong>. For any queries, please contact our support team.
              </p>
            </div>
          </div>

          {/* ══ ORDER TIMELINE ══ */}
          {order.statusTimeline?.length > 0 && (
            <InfoCard icon={<Calendar size={15} />} title="Order Timeline">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {[...order.statusTimeline].reverse().map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: '10px', height: '10px', borderRadius: '50%',
                        background: i === 0 ? 'var(--secondary)' : 'var(--border)',
                        marginTop: '4px',
                      }} />
                      {i < order.statusTimeline.length - 1 && (
                        <div style={{ width: '2px', flex: 1, background: 'var(--border)', marginTop: '4px', minHeight: '20px' }} />
                      )}
                    </div>
                    <div style={{ flex: 1, paddingBottom: '0.5rem' }}>
                      <p style={{ fontWeight: 700, fontSize: '0.85rem', color: i === 0 ? 'var(--secondary)' : 'var(--text)' }}>{t.status}</p>
                      {t.description && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.description}</p>}
                      {t.timestamp && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          {new Date(t.timestamp).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </InfoCard>
          )}

          {/* ══ ACTION BUTTONS ══ */}
          <div style={{
            display: 'flex', gap: '0.85rem', justifyContent: 'center',
            flexWrap: 'wrap', paddingTop: '0.75rem',
          }}>
            {/* Track Order */}
            <Link
              to={`/order/${order._id}`}
              className="order-action-btn btn btn-secondary btn-gradient"
            >
              <Truck size={17} /> Track Order <ArrowRight size={14} />
            </Link>

            {/* View My Orders */}
            <Link
              to="/profile"
              className="order-action-btn"
              style={{
                background: 'var(--card)',
                border: '1.5px solid var(--secondary)',
                color: 'var(--secondary)',
              }}
            >
              <ClipboardList size={17} /> View My Orders
            </Link>

            {/* Continue Shopping */}
            <Link
              to="/shop"
              className="order-action-btn"
              style={{
                background: 'var(--card)',
                border: '1.5px solid var(--border)',
                color: 'var(--text-muted)',
              }}
            >
              <ShoppingCart size={17} /> Continue Shopping
            </Link>
          </div>

          {/* ── Order placed date footer ── */}
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <Calendar size={12} />
            Order placed on {new Date(order.createdAt).toLocaleString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    </>
  );
}
