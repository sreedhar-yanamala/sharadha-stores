import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, Truck, CheckCircle, Clock, MapPin, CreditCard, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import CancelOrderModal from '../components/CancelOrderModal';

export default function OrderTracking() {
  const { id } = useParams();
  const { token } = useAuth();
  const { showToast } = useNotification();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/api/orders/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (response.ok) {
          setOrder(data);
        } else {
          showToast(data.message || 'Order not found.', 'error');
        }
      } catch (error) {
        console.error('Error fetching order for tracking:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchOrder();
  }, [id, token]);

  const handleCancelOrder = async (reason) => {
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${id}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (res.ok) {
        setOrder(data);
        setShowCancelModal(false);
        showToast('Order cancelled successfully. Stock has been restored.', 'success');
      } else {
        showToast(data.message || 'Could not cancel the order.', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
      throw new Error('cancel failed'); // keep modal open on network error
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '3rem 0', textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid var(--border)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          margin: '0 auto 1rem auto',
          animation: 'pulse 1.5s infinite ease-in-out'
        }}></div>
        <p style={{ color: 'var(--text-muted)' }}>Fetching order tracking status...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }} className="card-glass">
        <span style={{ fontSize: '3rem' }}>🚫</span>
        <h2>Order Tracking Error</h2>
        <p style={{ color: 'var(--text-muted)', margin: '1rem 0' }}>We couldn't load tracking details for order #{id}.</p>
        <Link to="/" className="btn btn-secondary">Go Home</Link>
      </div>
    );
  }

  const statuses = ['Pending', 'Packed', 'Shipped', 'Delivered'];
  const isCancelled = order.orderStatus === 'Cancelled';
  const currentStatusIndex = isCancelled ? -1 : statuses.indexOf(order.orderStatus);

  const getStatusIcon = (statusName, isActive) => {
    const color = isActive ? 'var(--secondary)' : 'var(--text-muted)';
    switch (statusName) {
      case 'Pending':   return <Clock size={20} style={{ color }} />;
      case 'Packed':    return <Package size={20} style={{ color }} />;
      case 'Shipped':   return <Truck size={20} style={{ color }} />;
      case 'Delivered': return <CheckCircle size={20} style={{ color }} />;
      default:          return <Clock size={20} style={{ color }} />;
    }
  };

  return (<>
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <div style={{ margin: '1.5rem 0', display: 'flex', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        <Link to="/">Home</Link> &gt; <span>Track Order</span>
      </div>

      <div className="card-glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '1.25rem',
          marginBottom: '2rem'
        }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Order ID</span>
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>#{order._id}</span>
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Placed Date</span>
            <span style={{ fontWeight: 600 }}>{new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Total Paid</span>
            <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>Rs. {order.totalPrice}</span>
          </div>
          <div>
            {isCancelled ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.3rem 0.75rem', borderRadius: '2rem',
                background: 'rgba(239,68,68,0.12)', color: '#ef4444',
                fontWeight: 600, fontSize: '0.85rem'
              }}>
                <XCircle size={14} /> Cancelled
              </span>
            ) : ['Pending', 'Packed', 'Processing'].includes(order.orderStatus) ? (
              <button
                onClick={() => setShowCancelModal(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.4rem 1rem', borderRadius: '2rem',
                  border: '1.5px solid #ef4444', color: '#ef4444',
                  background: 'transparent',
                  fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <XCircle size={14} /> Cancel Order
              </button>
            ) : (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.3rem 0.75rem', borderRadius: '2rem',
                background: 'rgba(46,125,50,0.1)', color: 'var(--secondary)',
                fontWeight: 600, fontSize: '0.85rem'
              }}>
                <CheckCircle size={14} /> {order.orderStatus}
              </span>
            )}
          </div>
        </div>

        {/* Status Stepper or Cancelled Banner */}
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Delivery Progress</h3>

        {isCancelled ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            padding: '1.25rem 1.5rem', borderRadius: 'var(--radius)',
            background: 'rgba(239,68,68,0.07)', border: '1.5px solid rgba(239,68,68,0.25)',
            marginBottom: '2rem'
          }}>
            <XCircle size={28} color="#ef4444" />
            <div>
              <p style={{ fontWeight: 700, color: '#ef4444', marginBottom: '0.2rem' }}>Order Cancelled</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                This order was cancelled. Stock has been restored. Contact support if you have questions.
              </p>
            </div>
          </div>
        ) : (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          padding: '0 2rem',
          marginBottom: '3rem',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          {/* Stepper background line */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '3rem',
            right: '3rem',
            height: '2px',
            background: 'var(--border)',
            zIndex: 1,
            display: 'none'
          }} className="stepper-line"></div>

          {statuses.map((statusName, index) => {
            const isCompleted = index <= currentStatusIndex;
            const isCurrent = index === currentStatusIndex;

            return (
              <div key={statusName} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                zIndex: 2,
                flex: '1 1 auto',
                minWidth: '80px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: isCompleted ? 'rgba(46, 125, 50, 0.15)' : 'var(--border)',
                  border: isCurrent ? '2px solid var(--secondary)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {getStatusIcon(statusName, isCompleted)}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{
                    fontSize: '0.9rem',
                    fontWeight: isCompleted ? 600 : 400,
                    color: isCompleted ? 'var(--text)' : 'var(--text-muted)',
                    display: 'block'
                  }}>
                    {statusName === 'Pending' ? 'Processing' : statusName}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        )}

        {/* Carrier Details */}
        {order.trackingNumber && (
          <div style={{
            background: 'rgba(46, 125, 50, 0.04)',
            border: '1px solid rgba(46, 125, 50, 0.15)',
            padding: '1rem 1.5rem',
            borderRadius: 'var(--radius)',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Carrier Agent</span>
              <span style={{ display: 'block', fontWeight: 600 }}>{order.carrier || 'Sharadha Delivery Partner'}</span>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tracking Code</span>
              <span style={{ display: 'block', fontWeight: 600, fontFamily: 'monospace' }}>{order.trackingNumber}</span>
            </div>
          </div>
        )}

        {/* Specs and Details Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          {/* Shipping Address */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={18} style={{ color: 'var(--secondary)' }} /> Shipping Address
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {order.shippingAddress.street},<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}<br />
              {order.shippingAddress.country}
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={18} style={{ color: 'var(--secondary)' }} /> Payment Details
            </h4>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Method: {order.paymentMethod}</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
              Status: {order.isPaid ? 'Paid' : 'Unpaid (COD)'}
            </span>
          </div>
        </div>
      </div>

      {/* List order items */}
      <div className="card-glass" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1.25rem' }}>Ordered Items</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {order.orderItems.map((item) => (
            <div key={item._id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid var(--border)'
            }}>
              <img src={item.images[0]} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
              <div style={{ flexGrow: 1 }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{item.title}</h4>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Rs. {item.price} each • Qty: {item.quantity}</span>
              </div>
              <span style={{ fontWeight: 700 }}>Rs. {item.price * item.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media(min-width: 600px) {
          .stepper-line { display: block !important; }
        }
      `}</style>
    </div>

    {/* Cancel Order Modal */}
    <CancelOrderModal
      isOpen={showCancelModal}
      orderId={order?._id}
      onConfirm={handleCancelOrder}
      onClose={() => setShowCancelModal(false)}
    />
  </>);
}
