import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, User, Sun, Moon, Search, Menu, X, LogOut, ChevronDown, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getLocalProducts, searchProducts, highlightText } from '../data/products';

export default function Navbar({ onCartOpen }) {
  const { user, logout } = useAuth();
  const { itemsCount } = useCart();
  const { wishlistItems } = useWishlist();
  
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false); // mobile search toggle

  // Search state
  const [keyword, setKeyword] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const navigate = useNavigate();
  const suggestionRef = useRef(null);
  const searchInputRef = useRef(null);

  // Apply theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Click outside suggestions closer
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get search suggestions — live, smart, synonym-aware (300ms debounce)
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const q = keyword.trim();
      if (q.length > 1) {
        try {
          const all = getLocalProducts();
          const results = searchProducts(all, q);
          setSuggestions(results.slice(0, 6));
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [keyword]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = keyword.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
      setKeyword('');
      setShowSuggestions(false);
      setSearchOpen(false);
    }
  };

  const handleSuggestionClick = (prodId) => {
    setKeyword('');
    setShowSuggestions(false);
    setSearchOpen(false);
    navigate(`/product/${prodId}`);
  };

  const handleViewAll = () => {
    const q = keyword.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
      setKeyword('');
      setShowSuggestions(false);
      setSearchOpen(false);
    }
  };

  const handleClearSearch = () => {
    setKeyword('');
    setSuggestions([]);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const toggleMobileSearch = () => {
    setSearchOpen(prev => {
      if (!prev) setTimeout(() => searchInputRef.current?.focus(), 50);
      return !prev;
    });
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navbar scrolled" style={{ position: 'fixed', top: 0, width: '100%', zIndex: 1000 }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.4rem', color: '#2E7D32' }}>
          <img src="/images/logo.png" alt="Sharadha Stores Logo" style={{ height: '45px', width: 'auto', objectFit: 'contain' }} />
          Sharadha Stores
        </Link>

        {/* Search Bar — desktop: always visible; mobile: toggle */}
        <div
          ref={suggestionRef}
          className="nav-search-container"
          style={{ position: 'relative', margin: '0 1rem' }}
        >
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', width: '100%', position: 'relative', alignItems: 'center' }}>
            {/* Search Icon prefix */}
            <Search size={16} style={{
              position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 1,
            }} />
            <input
              ref={searchInputRef}
              id="navbar-search-input"
              type="text"
              placeholder="Search products, categories…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="form-input"
              style={{
                paddingLeft: '2.4rem',
                paddingRight: keyword ? '5.5rem' : '2.8rem',
                borderRadius: '2rem',
                height: '40px',
                fontSize: '0.875rem',
                width: '100%',
              }}
              onFocus={() => keyword.trim().length > 1 && setShowSuggestions(true)}
              autoComplete="off"
            />
            {/* Clear button */}
            {keyword && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear search"
                style={{
                  position: 'absolute', right: '46px', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', background: 'none', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', zIndex: 1,
                }}
              >
                <X size={15} />
              </button>
            )}
            {/* Submit */}
            <button
              type="submit"
              aria-label="Search"
              style={{
                position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
                background: 'var(--secondary)', color: '#FFFFFF',
                border: 'none', borderRadius: '2rem',
                width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', zIndex: 1,
                flexShrink: 0,
              }}
            >
              <Search size={15} />
            </button>
          </form>

          {/* Smart Search Suggestions Dropdown */}
          {showSuggestions && (
            <div style={{
              position: 'absolute',
              top: '48px',
              left: 0,
              right: 0,
              background: 'var(--card)',
              border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-xl)',
              zIndex: 1200,
              overflow: 'hidden',
              animation: 'scaleIn 0.18s ease forwards',
              transformOrigin: 'top center',
            }}>
              {suggestions.length === 0 ? (
                <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  No products match &ldquo;<strong>{keyword}</strong>&rdquo;
                </div>
              ) : (
                <>
                  <div style={{ padding: '0.5rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-light)', background: 'var(--background)' }}>
                    {suggestions.length} Result{suggestions.length !== 1 ? 's' : ''} for &ldquo;{keyword}&rdquo;
                  </div>

                  {suggestions.map((prod) => {
                    const activePrice = prod.discountPrice > 0 ? prod.discountPrice : prod.price;
                    return (
                      <div
                        key={prod._id}
                        onClick={() => handleSuggestionClick(prod._id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.85rem',
                          padding: '0.7rem 1rem', cursor: 'pointer',
                          borderBottom: '1px solid var(--border-light)', transition: 'background 0.15s',
                        }}
                        className="suggestion-item"
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--background-alt)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <img
                          src={prod.images?.[0] || ''}
                          alt={prod.title}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          style={{ width: '44px', height: '44px', objectFit: 'contain', borderRadius: '8px', flexShrink: 0, border: '1px solid var(--border-light)', background: '#fff' }}
                        />
                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                          <div
                            style={{ fontWeight: 500, fontSize: '0.88rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                            dangerouslySetInnerHTML={{ __html: highlightText(prod.title, keyword) }}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                            <span style={{ fontSize: '0.73rem', background: 'rgba(37,99,235,0.1)', color: 'var(--secondary)', padding: '0.1rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
                              {prod.category}
                            </span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>Rs. {activePrice}</span>
                            {prod.discountPrice > 0 && (
                              <span style={{ fontSize: '0.72rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>Rs. {prod.price}</span>
                            )}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--primary)', flexShrink: 0 }}>{'★'.repeat(Math.round(prod.rating ?? 0))}</span>
                      </div>
                    );
                  })}

                  {/* View All Results footer */}
                  <button
                    onClick={handleViewAll}
                    style={{
                      width: '100%', padding: '0.75rem 1rem',
                      background: 'var(--background)', borderTop: '1px solid var(--border)',
                      color: 'var(--secondary)', fontWeight: 600, fontSize: '0.85rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '0.4rem', cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--background-alt)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--background)'}
                  >
                    <Search size={14} /> View all {suggestions.length} results for &ldquo;{keyword}&rdquo;
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Desktop Links & Actions */}
        <div style={{ display: 'none', alignItems: 'center', gap: '1.5rem' }} className="nav-desktop-actions">
          <Link to="/" style={{ fontWeight: 500, color: 'var(--text)' }}>Home</Link>
          <Link to="/shop" style={{ fontWeight: 500, color: 'var(--text)' }}>Shop</Link>
          <Link to="/subscriptions" style={{ fontWeight: 500, color: 'var(--text)' }}>Subscriptions</Link>
          <Link to="/support" style={{ fontWeight: 500, color: 'var(--text)' }}>Support</Link>

          <div style={{ height: '20px', width: '1px', background: 'var(--border)' }}></div>

          {/* Theme Toggle */}
          <button onClick={toggleTheme} style={{ color: 'var(--text)', display: 'flex', alignItems: 'center' }}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Wishlist Link */}
          <Link to="/wishlist" style={{ color: 'var(--text)', display: 'flex', alignItems: 'center', position: 'relative' }}>
            <Heart size={20} />
            {wishlistItems.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: 'var(--primary)',
                color: '#FFFFFF',
                fontSize: '0.7rem',
                fontWeight: 700,
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {wishlistItems.length}
              </span>
            )}
          </Link>

          {/* Cart Icon */}
          <button onClick={onCartOpen} style={{ color: 'var(--text)', display: 'flex', alignItems: 'center', position: 'relative' }}>
            <ShoppingBag size={20} />
            {itemsCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: 'var(--secondary)',
                color: '#FFFFFF',
                fontSize: '0.7rem',
                fontWeight: 700,
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {itemsCount}
              </span>
            )}
          </button>

          {/* User Section */}
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text)', fontWeight: 500 }}
              >
                <User size={18} />
                <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</span>
                <ChevronDown size={14} />
              </button>

              {userDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '30px',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow-lg)',
                  width: '180px',
                  zIndex: 1000,
                  padding: '0.5rem 0',
                }}>

                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setUserDropdownOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', color: 'var(--text)', fontSize: '0.9rem' }}
                    >
                      <LayoutDashboard size={16} /> Admin Panel
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', color: 'var(--text)', fontSize: '0.9rem' }}
                  >
                    <User size={16} /> Profile
                  </Link>
                  <button
                    onClick={() => { logout(); setUserDropdownOpen(false); }}
                    style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', color: 'var(--primary)', fontSize: '0.9rem', textAlign: 'left' }}
                  >
                    <LogOut size={16} /> Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm" style={{ padding: '0.4rem 1.2rem', borderRadius: '1.5rem' }}>
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile Toggle Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} className="nav-mobile-toggle">
          {/* Theme Toggle (Mobile) */}
          <button onClick={toggleTheme} style={{ color: 'var(--text)' }}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Search Toggle (Mobile) */}
          <button
            onClick={toggleMobileSearch}
            style={{ color: searchOpen ? 'var(--primary)' : 'var(--text)', display: 'flex', alignItems: 'center' }}
            aria-label="Toggle search"
            className="nav-mobile-search-toggle"
          >
            {searchOpen ? <X size={20} /> : <Search size={20} />}
          </button>

          {/* Cart Toggle (Mobile) */}
          <button onClick={onCartOpen} style={{ color: 'var(--text)', position: 'relative' }}>
            <ShoppingBag size={20} />
            {itemsCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: 'var(--secondary)',
                color: '#FFFFFF',
                fontSize: '0.65rem',
                fontWeight: 700,
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {itemsCount}
              </span>
            )}
          </button>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ color: 'var(--text)' }}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '70px',
          left: 0,
          width: '100%',
          background: 'var(--card)',
          borderBottom: '1px solid var(--border)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          zIndex: 999
        }} className="fade-in">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', width: '100%', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search sweets, pickles, combos..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="form-input"
              style={{ paddingRight: '2.5rem', borderRadius: '2rem', height: '40px', width: '100%' }}
            />
            <button type="submit" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Search size={18} />
            </button>
          </form>

          <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.1rem', fontWeight: 500 }}>Home</Link>
          <Link to="/shop" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.1rem', fontWeight: 500 }}>Shop</Link>
          <Link to="/subscriptions" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.1rem', fontWeight: 500 }}>Subscriptions</Link>
          <Link to="/support" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.1rem', fontWeight: 500 }}>Support</Link>
          <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.1rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Wishlist <span style={{ color: 'var(--primary)' }}>({wishlistItems.length})</span>
          </Link>

          <div style={{ height: '1px', background: 'var(--border)' }}></div>

          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Hello, {user.name}</div>
              {user.role === 'admin' && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LayoutDashboard size={18} /> Admin Dashboard
                </Link>
              )}
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1rem' }}>My Profile</Link>
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                style={{ fontSize: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', textAlign: 'left' }}
              >
                <LogOut size={18} /> Log Out
              </button>
            </div>
          ) : (
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary" style={{ width: '100%' }}>
              Sign In
            </Link>
          )}
        </div>
      )}

      {/* Inline styles helper to override responsive visibility */}
      <style>{`
        /* Desktop: search is always shown, side-by-side with nav actions */
        @media(min-width: 769px) {
          .nav-search-container {
            display: block !important;
            width: 340px !important;
          }
          .nav-desktop-actions { display: flex !important; }
          .nav-mobile-toggle { display: none !important; }
          .nav-mobile-search-toggle { display: none !important; }
        }
        /* Mobile: search hidden by default, shown when toggled */
        @media(max-width: 768px) {
          .nav-search-container {
            display: ${searchOpen ? 'block' : 'none'} !important;
            position: absolute !important;
            top: 100% !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0.6rem 1rem !important;
            background: var(--card) !important;
            border-bottom: 1px solid var(--border) !important;
            box-shadow: var(--shadow) !important;
            z-index: 999 !important;
          }
        }
        .product-card__img-wrap {
          display: block;
          position: relative;
          overflow: hidden;
          background: #ffffff;
          aspect-ratio: 4 / 3;
        }
        .product-card__img-wrap img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: transform 0.35s ease;
        }
        .product-card__img-wrap:hover img { transform: scale(1.06); }
        .product-card__body { padding: 1rem; display: flex; flex-direction: column; flex-grow: 1; }
        .product-card__category { font-size: 0.72rem; text-transform: uppercase; color: var(--secondary); font-weight: 700; letter-spacing: 0.5px; margin-bottom: 0.3rem; display: block; }
        .product-card__title { font-size: 0.95rem; font-weight: 600; color: var(--text); margin-bottom: 0.5rem; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; text-decoration: none; }
        .product-card__footer { margin-top: auto; display: flex; justify-content: space-between; align-items: center; }
        .product-card__price { font-size: 1.05rem; font-weight: 700; color: var(--text); }
        .product-card__price-old { font-size: 0.82rem; text-decoration: line-through; color: var(--text-muted); }
      `}</style>
    </nav>
  );
}
