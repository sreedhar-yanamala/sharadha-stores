import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

const DEFAULT_DURATION = 4000; // 4 seconds

export const NotificationProvider = ({ children }) => {
  // Only ONE toast visible at a time
  const [toast, setToast]   = useState(null);
  const [exiting, setExiting] = useState(false);

  const dismissTimerRef = useRef(null);
  const exitTimerRef    = useRef(null);

  /** Trigger the exit animation, then remove the toast */
  const dismiss = useCallback(() => {
    clearTimeout(dismissTimerRef.current);
    clearTimeout(exitTimerRef.current);
    setExiting(true);
    exitTimerRef.current = setTimeout(() => {
      setToast(null);
      setExiting(false);
    }, 280); // must match toastSlideOut animation duration
  }, []);

  /**
   * Show a toast notification.
   * @param {string} message  - text to display (never truncated)
   * @param {'success'|'error'|'warning'|'info'} type
   * @param {number} duration - ms before auto-dismiss (default 4000)
   */
  const showToast = useCallback((message, type = 'info', duration = DEFAULT_DURATION) => {
    // Cancel any pending dismiss for the old toast
    clearTimeout(dismissTimerRef.current);
    clearTimeout(exitTimerRef.current);
    setExiting(false);

    // Mount the new toast immediately
    setToast({ id: Date.now(), message, type, duration });

    // Auto-dismiss after `duration` ms
    dismissTimerRef.current = setTimeout(dismiss, duration);
  }, [dismiss]);

  const getIcon = (type) => {
    switch (type) {
      case 'success':  return <CheckCircle  size={19} />;
      case 'error':    return <AlertCircle  size={19} />;
      case 'warning':  return <AlertTriangle size={19} />;
      case 'info':
      default:         return <Info size={19} />;
    }
  };

  return (
    <NotificationContext.Provider value={{ showToast }}>
      {children}

      {/*
        Single-toast container — fixed top-right.
        CSS for .toast-container and .toast-message is in index.css.
      */}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toast && (
          <div
            key={toast.id}
            className={`toast-message toast-${toast.type}${exiting ? ' toast-exit' : ' toast-enter'}`}
            role="alert"
            style={{ '--toast-duration': `${toast.duration ?? DEFAULT_DURATION}ms` }}
          >
            {getIcon(toast.type)}

            {/* Full message — word-break in CSS prevents overflow */}
            <span style={{ flexGrow: 1, minWidth: 0 }}>{toast.message}</span>

            <button
              onClick={dismiss}
              className="toast-close-btn"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </NotificationContext.Provider>
  );
};
