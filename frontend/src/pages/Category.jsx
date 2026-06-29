import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { SlidersHorizontal, ShoppingCart, Heart, Search, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getLocalCategories, getProducts, getLocalProducts, getFuzzyFallbackProducts } from '../data/products';

export default function Category() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();

  // Load criteria from URL
  const urlCategory = searchParams.get('category') || '';
  const urlSearch = searchParams.get('search') || '';

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [searchQuery, setSearchQuery] = useState(urlSearch);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const debounceRef = useRef(null);
  const searchInputRef = useRef(null);

  // Data states
  const [products, setProducts] = useState([]);
  const [fallback, setFallback] = useState(null); // { products, reason, correction }
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Keep states in sync when URL changes
  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || '');
    setSearchQuery(searchParams.get('search') || '');
    setPage(1);
  }, [searchParams]);

  // Fetch categories locally
  useEffect(() => {
    setCategories(getLocalCategories());
  }, []);

  // Fetch products locally
  useEffect(() => {
    const fetchProducts = () => {
      setLoading(true);
      try {
        const data = getProducts({
          page,
          pageSize: 6,
          category: selectedCategory,
          keyword: searchQuery,
          minPrice,
          maxPrice,
          sort: sortOption
        });
        const found = data.products || [];
        setProducts(found);
        setTotalPages(data.pages || 1);

        // If nothing found and there's a keyword, get smart fallback
        if (found.length === 0 && searchQuery.trim()) {
          const all = getLocalProducts();
          const fb = getFuzzyFallbackProducts(all, searchQuery);
          setFallback(fb);
        } else {
          setFallback(null);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory, searchQuery, minPrice, maxPrice, sortOption, page]);

  const handleCategorySelect = (catName) => {
    // Dedicated pages for API-driven categories
    if (catName === 'Chips')    { navigate('/products/Chips');    return; }
    if (catName === 'Appalams') { navigate('/products/Appalams'); return; }

    setSelectedCategory(catName);
    setPage(1);

    // Update URL
    const params = new Object();
    if (catName) params.category = catName;
    if (searchQuery) params.search = searchQuery;
    setSearchParams(params);
  };

  const handleSearchChange = useCallback((e) => {
    const val = e.target.value;
    setSearchQuery(val); // update input immediately (controlled)
    setPage(1);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // Update URL after 300ms pause in typing
      const params = {};
      if (selectedCategory) params.category = selectedCategory;
      if (val.trim()) params.search = val.trim();
      setSearchParams(params);
    }, 300);
  }, [selectedCategory, setSearchParams]);

  const handleWishlistToggle = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInWishlist(product._id)) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product);
    }
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSortOption('newest');
    setSearchQuery('');
    setSearchParams({});
    setPage(1);
  };

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <div style={{ margin: '1.5rem 0', display: 'flex', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        <Link to="/">Home</Link> &gt; <span>Shop</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
        {/* Left Sidebar Filter Panel */}
        <aside style={{ flex: '1 1 260px', minWidth: '260px' }} className="card-glass">
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <SlidersHorizontal size={18} /> Filters
            </h3>
            <button onClick={clearFilters} style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 600, transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color='var(--secondary-hover)'}
              onMouseLeave={e => e.currentTarget.style.color='var(--secondary)'}>
              Reset All
            </button>
          </div>


          {/* Categories select list */}
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
            <span className="form-label">Categories</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={() => handleCategorySelect('')}
                style={{
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  fontWeight: selectedCategory === '' ? 700 : 400,
                  color: selectedCategory === '' ? 'var(--secondary)' : 'var(--text)',
                  borderLeft: selectedCategory === '' ? '3px solid var(--secondary)' : '3px solid transparent',
                  paddingLeft: '0.5rem',
                  transition: 'all 0.18s',
                }}
              >
                All Products
              </button>
              {categories.map((cat) => {
                const isDedicatedPage = cat.name === 'Chips' || cat.name === 'Appalams';
                return (
                  <button
                    key={cat._id}
                    onClick={() => handleCategorySelect(cat.name)}
                    style={{
                      textAlign: 'left',
                      fontSize: '0.9rem',
                      fontWeight: selectedCategory === cat.name ? 700 : 400,
                      color: selectedCategory === cat.name ? 'var(--secondary)' : 'var(--text)',
                      borderLeft: selectedCategory === cat.name ? '3px solid var(--secondary)' : '3px solid transparent',
                      paddingLeft: '0.5rem',
                      transition: 'all 0.18s',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--secondary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = selectedCategory === cat.name ? 'var(--secondary)' : 'var(--text)'; }}
                  >
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Filter */}
          <div style={{ padding: '1.25rem' }}>
            <span className="form-label">Price Range (Rs.)</span>

            {/* Min / Max text inputs — no spinner arrows */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{
                  position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)',
                  fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, pointerEvents: 'none'
                }}>₹</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setMinPrice(val);
                    setPage(1);
                  }}
                  className="form-input"
                  style={{
                    paddingLeft: '1.4rem', height: '36px', fontSize: '0.85rem',
                    MozAppearance: 'textfield',
                  }}
                />
              </div>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>–</span>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{
                  position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)',
                  fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, pointerEvents: 'none'
                }}>₹</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setMaxPrice(val);
                    setPage(1);
                  }}
                  className="form-input"
                  style={{
                    paddingLeft: '1.4rem', height: '36px', fontSize: '0.85rem',
                    MozAppearance: 'textfield',
                  }}
                />
              </div>
            </div>

            {/* Quick preset buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {[
                { label: 'Under ₹150', min: '', max: '150' },
                { label: '₹150–₹250', min: '150', max: '250' },
                { label: '₹250–₹500', min: '250', max: '500' },
                { label: 'Over ₹500', min: '500', max: '' },
              ].map(({ label, min, max }) => {
                const active = minPrice === min && maxPrice === max;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => { setMinPrice(min); setMaxPrice(max); setPage(1); }}
                    style={{
                      fontSize: '0.7rem', fontWeight: 500,
                      padding: '0.25rem 0.55rem', borderRadius: '2rem',
                      border: `1px solid ${active ? 'var(--secondary)' : 'var(--border)'}`,
                      background: active ? 'var(--secondary)' : 'transparent',
                      color: active ? '#fff' : 'var(--text-muted)',
                      cursor: 'pointer', transition: 'all 0.18s',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Right Product Grid */}
        <main style={{ flex: '3 1 600px' }}>
          {/* Grid control bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {searchQuery.trim() ? (
                <span>
                  Showing <strong style={{ color: 'var(--secondary)' }}>{products.length}</strong>
                  {' '}result{products.length !== 1 ? 's' : ''} for{' '}
                  <strong style={{ color: 'var(--secondary)' }}>&ldquo;{searchQuery.trim()}&rdquo;</strong>
                </span>
              ) : (
                <span>Showing <strong>{products.length}</strong> products</span>
              )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Sort by:</span>
              <select
                value={sortOption}
                onChange={(e) => { setSortOption(e.target.value); setPage(1); }}
                style={{
                  padding: '0.4rem 1.5rem 0.4rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                  color: 'var(--text)',
                  fontSize: '0.85rem'
                }}
              >
                <option value="newest">Newest First</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
                <option value="ratingDesc">Customer Rating</option>
              </select>
            </div>
          </div>

          {/* Product grid list */}
          {loading ? (
            <div className="product-grid">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="card-glass" style={{ padding: '1rem', height: '320px' }}>
                  <div className="skeleton skeleton-image" style={{ height: '160px', marginBottom: '1rem' }}></div>
                  <div className="skeleton skeleton-title"></div>
                  <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div>
              <div style={{
                textAlign: 'center', padding: '3rem 1.5rem',
                color: 'var(--text-muted)', display: 'flex',
                flexDirection: 'column', alignItems: 'center', gap: '1rem',
                marginBottom: '2rem',
              }} className="card-glass">
                <span style={{ fontSize: '3rem' }}>🌾</span>
                <h3>No Products Found</h3>
                <p style={{ maxWidth: '340px', fontSize: '0.9rem' }}>
                  {searchQuery
                    ? <>We couldn&apos;t find &ldquo;<strong>{searchQuery}</strong>&rdquo;. Try a different keyword or browse below.</>  
                    : 'No products match your current filters. Try adjusting your selection.'}
                </p>
                <button onClick={clearFilters} className="btn btn-secondary btn-sm">Clear All Filters</button>
              </div>

              {/* Smart fallback grid */}
              {fallback && fallback.products.length > 0 && (
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '1rem' }}>
                    {fallback.reason === 'correction' && `Showing results for "${fallback.correction}" instead:`}
                    {fallback.reason === 'category'   && `Showing products from ${fallback.correction}:`}
                    {fallback.reason === 'popular'    && 'Here are some popular products you may like:'}
                  </p>
                  <div className="product-grid">
                    {fallback.products.slice(0, 6).map((product) => {
                      const isAdded = isInWishlist(product._id);
                      const hasDiscount = product.discountPrice > 0;
                      const activePrice = hasDiscount ? product.discountPrice : product.price;
                      return (
                        <div key={product._id} className="card-glass" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%', position: 'relative' }}>
                          <Link to={`/product/${product._id}`} className="product-img-wrap" style={{ height: '190px', display: 'block', textDecoration: 'none' }}>
                            <img src={product.images[0]} alt={product.title} style={{ width: '100%', height: '100%' }} />
                          </Link>
                          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>{product.category}</span>
                            <Link to={`/product/${product._id}`}>
                              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem', height: '2.4rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{product.title}</h4>
                            </Link>
                            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>Rs. {activePrice}</span>
                              <button onClick={() => addToCart(product, 1)} disabled={product.stock === 0} className="btn btn-secondary btn-sm" style={{ padding: '0.4rem 0.8rem', borderRadius: '2rem' }}>
                                <ShoppingCart size={14} /> Add
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="product-grid">
                {products.map((product) => {
                  const isAdded = isInWishlist(product._id);
                  const hasDiscount = product.discountPrice > 0;
                  const activePrice = hasDiscount ? product.discountPrice : product.price;

                  return (
                    <div key={product._id} style={{
                      display: 'flex', flexDirection: 'column', overflow: 'hidden',
                      height: '100%', position: 'relative',
                      background: 'var(--card)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'transform 0.32s cubic-bezier(0.16,1,0.3,1), box-shadow 0.32s ease, border-color 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-5px)'; e.currentTarget.style.boxShadow='var(--shadow-lg)'; e.currentTarget.style.borderColor='rgba(37,99,235,0.25)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='var(--shadow-sm)'; e.currentTarget.style.borderColor='var(--border-light)'; }}>

                      {/* Wishlist toggle */}
                      <button
                        onClick={(e) => handleWishlistToggle(e, product)}
                        style={{
                          position: 'absolute', top: '12px', right: '12px',
                          background: 'rgba(255,255,255,0.92)',
                          color: isAdded ? '#E11D48' : 'var(--text-muted)',
                          borderRadius: '50%', width: '34px', height: '34px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.12)', zIndex: 10,
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          border: '1px solid var(--border-light)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform='scale(1.12)'}
                        onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                      >
                        <Heart size={16} fill={isAdded ? '#E11D48' : 'none'} />
                      </button>

                      {/* Product Image */}
                      <Link to={`/product/${product._id}`} className="product-img-wrap" style={{ height: '210px', display: 'block', textDecoration: 'none' }}>
                        <img src={product.images[0]} alt={product.title} style={{ width: '100%', height: '100%' }} />
                        {hasDiscount && (
                          <span style={{
                            position: 'absolute', bottom: '8px', left: '8px',
                            background: '#F59E0B', color: '#1E40AF',
                            fontSize: '0.72rem', fontWeight: 700,
                            padding: '0.2rem 0.55rem', borderRadius: '4px', zIndex: 2,
                          }}>
                            SAVE {Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                          </span>
                        )}
                      </Link>

                      {/* Body details */}
                      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--secondary)', fontWeight: 700, marginBottom: '0.25rem', letterSpacing: '0.5px' }}>
                          {product.category}
                        </span>
                        <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
                          <h4 style={{ fontSize: '0.97rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem', height: '2.8rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.4', transition: 'color 0.18s' }}
                            onMouseEnter={e => e.currentTarget.style.color='var(--secondary)'}
                            onMouseLeave={e => e.currentTarget.style.color='var(--text)'}>
                            {product.title}
                          </h4>
                        </Link>

                        {/* Rating */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                          <div className="stars-container" style={{ fontSize: '0.82rem', color: '#F59E0B' }}>
                            {'★'.repeat(Math.round(product.rating))}
                            <span style={{ color: 'var(--border)' }}>{'☆'.repeat(5 - Math.round(product.rating))}</span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({product.numReviews})</span>
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                          <div>
                            {hasDiscount ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--secondary)' }}>₹{product.discountPrice}</span>
                                <span style={{ fontSize: '0.78rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>₹{product.price}</span>
                              </div>
                            ) : (
                              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--secondary)' }}>₹{product.price}</span>
                            )}
                          </div>

                          <button
                            onClick={() => addToCart(product, 1)}
                            disabled={product.stock === 0}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                              padding: '0.45rem 1rem', borderRadius: '2rem',
                              background: product.stock === 0 ? 'var(--border)' : 'linear-gradient(135deg, #F59E0B, #D97706)',
                              color: product.stock === 0 ? 'var(--text-muted)' : '#1E40AF',
                              fontWeight: 700, fontSize: '0.82rem',
                              border: 'none', cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                              boxShadow: product.stock === 0 ? 'none' : '0 3px 10px rgba(245,158,11,0.35)',
                              transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
                            }}
                            onMouseEnter={e => { if (product.stock > 0) { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 6px 16px rgba(245,158,11,0.5)'; }}}
                            onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow=product.stock===0?'none':'0 3px 10px rgba(245,158,11,0.35)'; }}
                          >
                            <ShoppingCart size={14} /> {product.stock === 0 ? 'Out of Stock' : 'Add'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '3rem' }}>
                  <button
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    className="btn btn-outline btn-sm"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`btn btn-sm ${page === p ? 'btn-secondary' : 'btn-outline'}`}
                      style={{ minWidth: '36px' }}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={page === totalPages}
                    className="btn btn-outline btn-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
