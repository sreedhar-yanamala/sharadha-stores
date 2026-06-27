import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { useAuth } from './context/AuthContext';

// Always-present components (small, needed immediately)
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy-load all pages — prevents one broken page from crashing everything
const Home          = lazy(() => import('./pages/Home'));
const Category      = lazy(() => import('./pages/Category'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart          = lazy(() => import('./pages/Cart'));
const Checkout      = lazy(() => import('./pages/Checkout'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const Subscription  = lazy(() => import('./pages/Subscription'));
const Support       = lazy(() => import('./pages/Support'));
const Auth          = lazy(() => import('./pages/Auth'));
const AdminDashboard    = lazy(() => import('./pages/AdminDashboard'));
const Profile           = lazy(() => import('./pages/Profile'));
const Wishlist          = lazy(() => import('./pages/Wishlist'));
const SearchResults     = lazy(() => import('./pages/SearchResults'));
const Appalams          = lazy(() => import('./pages/Appalams'));
const Chips             = lazy(() => import('./pages/Chips'));
const Products          = lazy(() => import('./pages/Products'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const CreateNewPassword = lazy(() => import('./pages/CreateNewPassword'));
import './App.css';

/* ══════════════════════════════════════════════════════════════
   ERROR BOUNDARY — catches render crashes, shows friendly UI
   ══════════════════════════════════════════════════════════════ */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Render crash:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--background)', padding: '2rem', textAlign: 'center',
      }}>
        <div style={{
          maxWidth: '480px', padding: '2.5rem',
          background: 'var(--card)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: 'var(--text)', marginBottom: '0.75rem' }}>
            Something Went Wrong
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            The page encountered an unexpected error. This is usually caused by a
            temporary issue — please try refreshing.
          </p>
          {this.state.error && (
            <details style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <summary style={{ fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '0.5rem' }}>
                Technical details
              </summary>
              <pre style={{
                fontSize: '0.72rem', background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.15)', borderRadius: '6px',
                padding: '0.75rem', overflowX: 'auto', color: '#b91c1c',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {String(this.state.error)}
              </pre>
            </details>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-secondary"
              style={{ borderRadius: '2rem', padding: '0.65rem 1.5rem' }}
            >
              🔄 Reload Page
            </button>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
              className="btn btn-outline"
              style={{ borderRadius: '2rem', padding: '0.65rem 1.5rem' }}
            >
              🏠 Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }
}

/* ── Page loading skeleton (shown while lazy chunks load) ── */
function PageLoader() {
  return (
    <div style={{
      minHeight: '60vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '1.25rem',
    }}>
      <div style={{
        width: '44px', height: '44px',
        border: '4px solid var(--border)',
        borderTopColor: 'var(--primary)',
        borderRadius: '50%',
        animation: 'spin 0.75s linear infinite',
      }} />
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading…</p>
    </div>
  );
}

/* ── App-ready gate: show full-screen spinner until auth is initialized ── */
function AppReadyGate({ children }) {
  const { appReady } = useAuth();

  if (!appReady) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'var(--background)', gap: '1.25rem',
      }}>
        <div style={{
          width: '52px', height: '52px',
          border: '4px solid var(--border)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.75s linear infinite',
        }} />
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--secondary)', marginBottom: '0.25rem' }}>
            🌿 Sharadha Stores
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading your experience…</p>
        </div>
      </div>
    );
  }

  return children;
}

/* ── Main app content ── */
function AppContent() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Standalone full-page auth routes (no navbar/footer) ── */}
        <Route path="/create-new-password"   element={<CreateNewPassword />} />

        {/* ── All other routes use the standard layout ── */}
        <Route path="*" element={
          <div className="app-container">
            <Navbar onCartOpen={() => setCartOpen(true)} />
            <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

            <main className="main-content">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public */}
                  <Route path="/"            element={<Home />} />
                  <Route path="/shop"        element={<Category />} />
                  <Route path="/products"          element={<Products />} />
                  <Route path="/products/:category" element={<Products />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart"        element={<Cart />} />
                  <Route path="/login"       element={<Auth />} />
                  <Route path="/register"    element={<Auth />} />
                  <Route path="/wishlist"    element={<Wishlist />} />
                  <Route path="/search"      element={<SearchResults />} />
                  <Route path="/appalams"    element={<Appalams />} />
                  <Route path="/chips"       element={<Chips />} />

                  {/* Protected customer */}
                  <Route path="/profile"            element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/checkout"           element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                  <Route path="/order/:id"          element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
                  <Route path="/order-success/:id"  element={<OrderConfirmation />} />
                  <Route path="/subscriptions"      element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
                  <Route path="/support"            element={<ProtectedRoute><Support /></ProtectedRoute>} />

                  {/* Protected admin */}
                  <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />

                  {/* Catch-all */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </main>

            <Footer />
          </div>
        } />
      </Routes>
    </Suspense>
  );
}

/* ── Root export ── */
export default function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Router>
                {/* Wait for auth to initialize before showing any page */}
                <AppReadyGate>
                  <ErrorBoundary>
                    <AppContent />
                  </ErrorBoundary>
                </AppReadyGate>
              </Router>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}
