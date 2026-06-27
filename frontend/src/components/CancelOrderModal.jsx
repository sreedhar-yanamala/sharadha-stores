import React, { useState } from 'react';
import { XCircle, AlertTriangle, Loader2 } from 'lucide-react';

const CANCEL_REASONS = [
  'Ordered by mistake',
  'Found a better price',
  'Want to change delivery address',
  'Want to change product(s)',
  'Delivery time too long',
  'Payment issue',
  'Other',
];

/**
 * CancelOrderModal
 * Props:
 *   isOpen        {boolean}  – controls visibility
 *   orderId       {string|number} – order ID shown in heading
 *   onConfirm     {(reason: string) => Promise<void>} – called on confirmation
 *   onClose       {() => void} – called on dismiss
 *   title         {string}   – optional custom title
 *   message       {string}   – optional custom body message
 *   confirmLabel  {string}   – optional custom confirm button label
 */
export default function CancelOrderModal({
  isOpen,
  orderId,
  onConfirm,
  onClose,
  title = 'Cancel Order?',
  message,
  confirmLabel = 'Yes, Cancel Order',
}) {
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(reason);
    } finally {
      setLoading(false);
      setReason(CANCEL_REASONS[0]);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setReason(CANCEL_REASONS[0]);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
          animation: 'fadeIn 0.15s ease',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'slideUp 0.2s ease',
      }}>
        <div className="card-glass" style={{
          width: '100%', maxWidth: '440px',
          padding: '2rem', borderRadius: 'var(--radius-lg)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        }}>
          {/* Icon */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={26} color="#ef4444" />
            </div>
          </div>

          {/* Title */}
          <h3 style={{
            textAlign: 'center', fontSize: '1.25rem', fontWeight: 700,
            marginBottom: '0.5rem',
          }}>
            {title}
            {orderId && (
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.9rem' }}>
                {' '}#{String(orderId).slice(-6)}
              </span>
            )}
          </h3>

          {/* Message */}
          <p style={{
            textAlign: 'center', color: 'var(--text-muted)',
            fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.5rem',
          }}>
            {message || 'Are you sure you want to cancel this order? This action cannot be undone and stock will be restored.'}
          </p>

          {/* Reason Dropdown */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
              Reason for cancellation
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              disabled={loading}
              className="form-input"
              style={{ width: '100%' }}
            >
              {CANCEL_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {/* Cancel / Dismiss */}
            <button
              onClick={handleClose}
              disabled={loading}
              className="btn btn-outline"
              style={{ flex: 1, height: '44px', opacity: loading ? 0.5 : 1 }}
            >
              No, Continue
            </button>

            {/* Confirm */}
            <button
              onClick={handleConfirm}
              disabled={loading}
              style={{
                flex: 1, height: '44px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                borderRadius: 'var(--radius)', border: 'none',
                background: loading ? 'rgba(239,68,68,0.7)' : '#ef4444',
                color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {loading ? (
                <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Cancelling…</>
              ) : (
                <><XCircle size={16} /> {confirmLabel}</>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
}
