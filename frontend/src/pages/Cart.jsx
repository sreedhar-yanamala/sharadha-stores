import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingCart, Percent, Tag, X } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const {
    cartItems,
    coupon,
    discountRate,
    discountAmount,
    shippingCost,
    tax,
    subtotal,
    total,
    updateQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon,
    clearCart
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const navigate = useNavigate();

  const handleCouponSubmit = (e) => {
    e.preventDefault();
    if (couponInput.trim()) {
      const success = applyCoupon(couponInput);
      if (success) setCouponInput('');
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <div style={{ margin: '1.5rem 0', display: 'flex', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        <Link to="/">Home</Link> &gt; <span>Shopping Cart</span>
      </div>

      <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '2.5rem' }}>Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }} className="card-glass">
          <span style={{ fontSize: '4rem' }}>🛒</span>
          <h2>Your Cart is Empty</h2>
          <p>Explore our delicious range of traditional homemade food products!</p>
          <Link to="/shop" className="btn btn-secondary">Shop Now</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
          
          {/* Left: Cart Items List */}
          <div style={{ flex: '2 1 600px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card-glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {cartItems.map((item) => (
                <div key={item.product} style={{
                  display: 'flex',
                  gap: '1.25rem',
                  paddingBottom: '1.5rem',
                  borderBottom: '1px solid var(--border)',
                  flexWrap: 'wrap',
                  alignItems: 'center'
                }}>
                  {/* Image */}
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: 'var(--radius)' }}
                  />

                  {/* Title & info */}
                  <div style={{ flex: '2 1 200px' }}>
                    <Link to={`/product/${item.product}`}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.25rem' }}>{item.title}</h3>
                    </Link>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Category: {item.category}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Shelf Life: {item.shelfLife}</span>
                  </div>

                  {/* Pricing */}
                  <div style={{ flex: '1 1 100px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Price</span>
                    <span style={{ fontWeight: 600 }}>Rs. {item.price}</span>
                  </div>

                  {/* Quantity Actions */}
                  <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Quantity</span>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      border: '1px solid var(--border)',
                      borderRadius: '2rem',
                      overflow: 'hidden',
                      background: 'var(--background)'
                    }}>
                      <button
                        onClick={() => updateQuantity(item.product, item.quantity - 1)}
                        style={{ padding: '0.3rem 0.8rem', color: 'var(--text-muted)' }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, minWidth: '24px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product, item.quantity + 1)}
                        style={{ padding: '0.3rem 0.8rem', color: 'var(--text-muted)' }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Total price for item */}
                  <div style={{ flex: '1 1 100px', textAlign: 'right' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Total</span>
                    <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>Rs. {item.price * item.quantity}</span>
                  </div>

                  {/* Delete trigger */}
                  <button
                    onClick={() => removeFromCart(item.product)}
                    style={{ color: 'var(--primary)', padding: '0.5rem' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              {/* Bottom toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
                <Link to="/shop" style={{ color: 'var(--primary)', fontWeight: 500 }}>
                  &larr; Continue Shopping
                </Link>
                <button
                  onClick={clearCart}
                  style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Trash2 size={16} /> Clear Cart
                </button>
              </div>
            </div>
          </div>

          {/* Right: Order Billing Summary */}
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Promo Code Input Card */}
            <div className="card-glass" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Tag size={18} style={{ color: 'var(--primary)' }} /> Have a Promo Code?
              </h3>
              
              {coupon ? (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(46, 125, 50, 0.08)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius)',
                  border: '1px solid rgba(46, 125, 50, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)', fontWeight: 600 }}>
                    <Percent size={16} />
                    <span>{coupon} ({discountRate * 100}% Off)</span>
                  </div>
                  <button onClick={removeCoupon} style={{ color: 'var(--text-muted)' }}>
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCouponSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="WELCOME10, FESTIVAL15"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="form-input"
                    style={{ textTransform: 'uppercase', height: '40px', fontSize: '0.85rem' }}
                  />
                  <button type="submit" className="btn btn-secondary btn-sm" style={{ borderRadius: 'var(--radius)' }}>
                    Apply
                  </button>
                </form>
              )}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>
                Try WELCOME10 for 10% off or FESTIVAL15 for 15% off!
              </span>
            </div>

            {/* Calculations Card */}
            <div className="card-glass" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Order Summary</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                  <span>Rs. {subtotal}</span>
                </div>
                {discountRate > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981' }}>
                    <span>Promo Discount:</span>
                    <span>- Rs. {discountAmount}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>GST Tax (5%):</span>
                  <span>Rs. {tax}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Shipping Charge:</span>
                  <span>{shippingCost === 0 ? <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>FREE</span> : `Rs. ${shippingCost}`}</span>
                </div>
                {shippingCost > 0 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', display: 'block' }}>
                    Free shipping for orders over Rs. 500!
                  </span>
                )}
              </div>

              <div style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.2rem',
                fontWeight: 700
              }}>
                <span>Total:</span>
                <span style={{ color: 'var(--secondary)' }}>Rs. {total}</span>
              </div>

              <Link to="/checkout" className="btn btn-secondary btn-gradient" style={{ width: '100%', gap: '0.5rem', height: '46px' }}>
                Proceed to Checkout <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
