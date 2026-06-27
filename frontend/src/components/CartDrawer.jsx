import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartDrawer({ isOpen, onClose }) {
  const { cartItems, updateQuantity, removeFromCart, subtotal, total, itemsCount } = useCart();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleCheckoutClick = () => {
    onClose();
    navigate('/checkout');
  };

  const handleViewCartClick = () => {
    onClose();
    navigate('/cart');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      zIndex: 1100,
      display: 'flex',
      justifyContent: 'flex-end'
    }} onClick={onClose} className="fade-in">
      {/* Drawer Panel */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        height: '100%',
        background: 'var(--card)',
        boxShadow: 'var(--shadow-xl)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '1.25rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
            <ShoppingBag size={20} /> Your Cart ({itemsCount})
          </h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={24} />
          </button>
        </div>

        {/* Cart Items List */}
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1rem' }}>
          {cartItems.length === 0 ? (
            <div style={{
              height: '80%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'var(--text-muted)',
              gap: '1rem'
            }}>
              <span style={{ fontSize: '3rem' }}>🛒</span>
              <p style={{ fontWeight: 500 }}>Your cart is empty</p>
              <button onClick={onClose} className="btn btn-primary btn-sm">Shop Now</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cartItems.map((item) => (
                <div key={item.product} style={{
                  display: 'flex',
                  gap: '1rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid var(--border)'
                }}>
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                  />
                  <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.25rem' }}>{item.title}</h4>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Rs. {item.price} each</div>
                    </div>
                    
                    {/* Quantity Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        border: '1px solid var(--border)',
                        borderRadius: '2rem',
                        overflow: 'hidden'
                      }}>
                        <button
                          onClick={() => updateQuantity(item.product, item.quantity - 1)}
                          style={{ padding: '0.25rem 0.6rem', color: 'var(--text-muted)' }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product, item.quantity + 1)}
                          style={{ padding: '0.25rem 0.6rem', color: 'var(--text-muted)' }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button onClick={() => removeFromCart(item.product)} style={{ color: 'var(--primary)' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)' }}>
                    Rs. {item.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Summary (Sticky at bottom) */}
        {cartItems.length > 0 && (
          <div style={{
            padding: '1.25rem',
            borderTop: '1px solid var(--border)',
            background: 'var(--background)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
              <span>Subtotal:</span>
              <span>Rs. {subtotal}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: 700 }}>
              <span>Estimated Total:</span>
              <span style={{ color: 'var(--secondary)' }}>Rs. {total}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button onClick={handleCheckoutClick} className="btn btn-secondary" style={{ width: '100%' }}>
                Checkout Now
              </button>
              <button onClick={handleViewCartClick} className="btn btn-outline" style={{ width: '100%' }}>
                View Full Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
