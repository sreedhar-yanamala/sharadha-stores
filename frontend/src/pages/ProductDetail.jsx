import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Plus, Minus, Star, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getProductById, getSimilarProducts, getFrequentlyBoughtTogether, getLocalProducts } from '../data/products';
import { API_BASE } from '../config/api';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, addBundleToCart } = useCart();
  const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Zoom state (hover)
  const [zoomStyle, setZoomStyle] = useState({});

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Recommendations state
  const [similarProducts, setSimilarProducts] = useState([]);
  const [boughtTogether, setBoughtTogether] = useState([]);
  const [simLoading, setSimLoading] = useState(false);
  const [simAddedId, setSimAddedId] = useState(null);
  const scrollRef = useRef(null);

  // Review state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // ─── ALL HOOKS MUST BE ABOVE ANY CONDITIONAL RETURNS ───

  // Fetch product on id change
  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      setSimLoading(true);
      try {
        let data = null;

        // 1. Try to fetch product from the backend API first
        try {
          const res = await fetch(`${API_BASE}/api/products/${id}`);
          if (res.ok) {
            data = await res.json();
            console.log('[ProductDetail] Loaded product from API:', data);
          } else {
            console.warn('[ProductDetail] API returned status:', res.status);
          }
        } catch (apiErr) {
          console.warn('[ProductDetail] Failed to fetch product from API:', apiErr);
        }

        // 2. Fallback to local static data if API did not return the product
        if (!data) {
          data = getProductById(id);
        }

        if (data) {
          setProduct(data);
          setActiveImage((data.images && data.images[0]) || '');
          setQuantity(1);

          // ── Fetch similar products from API by category ──
          try {
            const res = await fetch(
              `${API_BASE}/api/products?category=${encodeURIComponent(data.category)}&pageSize=20`
            );
            if (res.ok) {
              const apiData = await res.json();
              const apiProducts = (apiData.products || apiData || []).filter(
                p => String(p._id) !== String(id)
              );
              if (apiProducts.length > 0) {
                setSimilarProducts(apiProducts.slice(0, 8));
                setSimLoading(false);
                setBoughtTogether(getFrequentlyBoughtTogether(id) || []);
                return;
              }
            }
          } catch { /* fall through to local */ }

          // ── Fallback: local similar products ──
          const localSimilar = getSimilarProducts(id) || [];
          if (localSimilar.length > 0) {
            setSimilarProducts(localSimilar.slice(0, 8));
          } else {
            // ── Final fallback: popular products from same category ──
            const all = getLocalProducts();
            const popular = all
              .filter(p => p.category === data.category && String(p._id) !== String(id))
              .sort((a, b) => (b.rating || 0) - (a.rating || 0))
              .slice(0, 8);
            setSimilarProducts(
              popular.length > 0
                ? popular
                : all.filter(p => String(p._id) !== String(id)).slice(0, 8)
            );
          }
          setBoughtTogether(getFrequentlyBoughtTogether(id) || []);
        } else {
          showToast('Product not found.', 'error');
          navigate('/shop');
        }
      } catch (err) {
        console.error('[ProductDetail] fetchProductData error:', err);
        showToast('Error loading product.', 'error');
      } finally {
        setLoading(false);
        setSimLoading(false);
      }
    };
    fetchProductData();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lightbox helpers — defined unconditionally (hooks rule)
  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    document.body.style.overflow = '';
  }, []);

  const openLightbox = useCallback((index) => {
    setLightboxIndex(index >= 0 ? index : 0);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const lightboxPrev = useCallback((e) => {
    e.stopPropagation();
    setLightboxIndex((i) =>
      product ? (i - 1 + product.images.length) % product.images.length : 0
    );
  }, [product]);

  const lightboxNext = useCallback((e) => {
    e.stopPropagation();
    setLightboxIndex((i) =>
      product ? (i + 1) % product.images.length : 0
    );
  }, [product]);

  // Keyboard navigation for lightbox — unconditional hook
  useEffect(() => {
    if (!lightboxOpen || !product) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft')
        setLightboxIndex((i) => (i - 1 + product.images.length) % product.images.length);
      if (e.key === 'ArrowRight')
        setLightboxIndex((i) => (i + 1) % product.images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, closeLightbox, product]);

  // Cleanup body overflow on unmount
  useEffect(() => {
    return () => { document.body.style.overflow = ''; };
  }, []);

  // ─── CONDITIONAL RETURNS (after all hooks) ───

  if (loading) {
    return (
      <div className="container" style={{ padding: '3rem 0' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem' }}>
          <div style={{ flex: '1 1 400px' }}>
            <div className="skeleton skeleton-image" style={{ height: '400px', borderRadius: 'var(--radius)' }}></div>
          </div>
          <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-text" style={{ width: '40%' }}></div>
            <div className="skeleton skeleton-text" style={{ height: '100px' }}></div>
            <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  // ─── SAFE DERIVED VALUES (after null check) ───
  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : ['/images/placeholder.png'];
  const reviews = Array.isArray(product.reviews) ? product.reviews : [];
  const ingredients = Array.isArray(product.ingredients) ? product.ingredients : [];
  const hasDiscount = (product.discountPrice ?? 0) > 0;
  const activePrice = hasDiscount ? product.discountPrice : product.price;
  const bundleTotal = activePrice +
    boughtTogether.reduce((acc, item) =>
      acc + ((item.discountPrice ?? 0) > 0 ? item.discountPrice : item.price), 0);
  const safeRating = typeof product.rating === 'number' ? product.rating : 0;

  // ─── EVENT HANDLERS ───
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({ transform: 'scale(2.2)', transformOrigin: `${x}% ${y}%` });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ transform: 'scale(1)', transition: 'transform 0.25s ease' });
  };

  const handleWishlistToggle = () => {
    if (isInWishlist(product._id)) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product);
    }
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate('/checkout');
  };

  const handleAddBundle = () => {
    addBundleToCart(product, boughtTogether);
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      showToast('Please type a review comment.', 'warning');
      return;
    }
    setSubmittingReview(true);
    try {
      const newReview = {
        _id: `r_${Date.now()}`,
        name: user ? user.name : 'Anonymous',
        rating,
        comment,
        createdAt: new Date().toISOString(),
      };
      setProduct((prev) => {
        if (!prev) return null;
        const updatedReviews = [newReview, ...(prev.reviews || [])];
        const totalRating = updatedReviews.reduce((acc, r) => acc + r.rating, 0);
        return {
          ...prev,
          reviews: updatedReviews,
          rating: totalRating / updatedReviews.length,
          numReviews: updatedReviews.length,
        };
      });
      showToast('Review submitted successfully!', 'success');
      setComment('');
    } catch (err) {
      console.error('[ProductDetail] handleReviewSubmit error:', err);
      showToast('Error sending review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const FALLBACK_IMG = 'https://via.placeholder.com/600x600?text=No+Image';

  // ─── RENDER ───
  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      {/* Breadcrumb */}
      <div style={{ margin: '1.5rem 0', display: 'flex', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
        <Link to="/">Home</Link> &gt; <Link to="/shop">Shop</Link> &gt; <span>{product.title}</span>
      </div>

      {/* Main product view */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', marginBottom: '4rem' }}>

        {/* Left Column: Image Viewer */}
        <div style={{ flex: '1 1 420px', minWidth: '300px' }}>

          {/* Main Hero Image */}
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 'var(--radius-lg)',
              border: '1.5px solid var(--border)',
              cursor: 'zoom-in',
              aspectRatio: '1 / 1',
              background: '#ffffff',
              boxShadow: 'var(--shadow)',
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={() => {
              const idx = images.indexOf(activeImage);
              openLightbox(idx >= 0 ? idx : 0);
            }}
            title="View product image"
          >
            <img
              src={activeImage || images[0]}
              alt={product.title}
              loading="eager"
              onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'center',
                display: 'block',
                userSelect: 'none',
                ...zoomStyle,
              }}
            />

          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  style={{
                    width: '68px', height: '68px',
                    borderRadius: 'var(--radius-sm)',
                    border: activeImage === img ? '2.5px solid var(--primary)' : '1.5px solid var(--border)',
                    overflow: 'hidden',
                    background: '#fff', padding: 0, cursor: 'pointer', flexShrink: 0,
                    boxShadow: activeImage === img ? 'var(--shadow-gold)' : 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  aria-label={`View image ${i + 1}`}
                >
                  <img
                    src={img} alt=""
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/100x100?text=?'; }}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* LIGHTBOX MODAL */}
        {lightboxOpen && (
          <div
            onClick={closeLightbox}
            style={{
              position: 'fixed', inset: 0, zIndex: 99999,
              background: 'rgba(0,0,0,0.93)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
              animation: 'fadeIn 0.18s ease',
            }}
          >
            <button onClick={closeLightbox} aria-label="Close lightbox" style={{
              position: 'absolute', top: '1.25rem', right: '1.5rem',
              background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.25)',
              color: '#fff', borderRadius: '50%', width: '42px', height: '42px',
              fontSize: '1.3rem', cursor: 'pointer', zIndex: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>

            {images.length > 1 && (
              <button onClick={lightboxPrev} aria-label="Previous image" style={{
                position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.25)',
                color: '#fff', borderRadius: '50%', width: '48px', height: '48px',
                fontSize: '1.6rem', cursor: 'pointer', zIndex: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>&#8249;</button>
            )}

            <img
              src={images[lightboxIndex] || FALLBACK_IMG}
              alt={product.title}
              onClick={(e) => e.stopPropagation()}
              onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
              style={{
                maxWidth: '88vw', maxHeight: '86vh',
                objectFit: 'contain',
                borderRadius: 'var(--radius)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.75)',
                display: 'block', userSelect: 'none',
              }}
            />

            {images.length > 1 && (
              <button onClick={lightboxNext} aria-label="Next image" style={{
                position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.25)',
                color: '#fff', borderRadius: '50%', width: '48px', height: '48px',
                fontSize: '1.6rem', cursor: 'pointer', zIndex: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>&#8250;</button>
            )}

            {images.length > 1 && (
              <div style={{ position: 'absolute', bottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                {images.map((_, i) => (
                  <button key={i}
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                    style={{
                      width: i === lightboxIndex ? '22px' : '8px', height: '8px',
                      borderRadius: '999px', padding: 0, border: 'none', cursor: 'pointer',
                      background: i === lightboxIndex ? 'var(--primary)' : 'rgba(255,255,255,0.35)',
                      transition: 'all 0.25s ease',
                    }}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
            )}

            <div style={{
              position: 'absolute', top: '1.25rem', left: '50%', transform: 'translateX(-50%)',
              color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem', fontWeight: 500,
              background: 'rgba(0,0,0,0.35)', padding: '0.2rem 0.8rem',
              borderRadius: '999px', backdropFilter: 'blur(4px)',
            }}>
              {lightboxIndex + 1} / {images.length}
            </div>
          </div>
        )}

        {/* Right Column: Spec details */}
        <div style={{ flex: '1 1 420px', display: 'flex', flexDirection: 'column' }}>
          {/* Category & wishlist */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--secondary)', fontWeight: 700 }}>
              {product.category}
            </span>
            <button
              onClick={handleWishlistToggle}
              className="btn btn-outline btn-sm"
              style={{ borderRadius: '2rem', display: 'flex', gap: '0.25rem', padding: '0.4rem 0.8rem' }}
            >
              <Heart size={14} fill={isInWishlist(product._id) ? '#E11D48' : 'none'} style={{ color: isInWishlist(product._id) ? '#E11D48' : 'var(--text-muted)' }} />
              Wishlist
            </button>
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text)' }}>
            {product.title}
          </h1>

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div className="stars-container" style={{ fontSize: '1.1rem' }}>
              {'★'.repeat(Math.round(safeRating))}
              {'☆'.repeat(5 - Math.round(safeRating))}
            </div>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {safeRating.toFixed(1)} Rating • {product.numReviews ?? 0} Reviews
            </span>
          </div>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            {hasDiscount ? (
              <>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>Rs. {product.discountPrice}</span>
                <span style={{ fontSize: '1.25rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>Rs. {product.price}</span>
                <span className="badge badge-primary">SAVE Rs. {product.price - product.discountPrice}</span>
              </>
            ) : (
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text)' }}>Rs. {product.price}</span>
            )}
          </div>

          <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', lineHeight: '1.7', fontSize: '1rem' }}>
            {product.description}
          </p>

          {/* Key Properties Box */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem',
            padding: '1.25rem', background: 'var(--card)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: '2rem',
          }}>
            {product.shelfLife && (
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Shelf Life</span>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>⏰ {product.shelfLife}</span>
              </div>
            )}
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Food Product</span>
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>🍃 100% Vegetarian</span>
            </div>
            {ingredients.length > 0 && (
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Key Ingredients</span>
                <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{ingredients.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Buy Action Box */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <span style={{ fontWeight: 500, color: 'var(--text)' }}>Quantity:</span>
              <div style={{
                display: 'flex', alignItems: 'center',
                border: '1px solid var(--border)', borderRadius: '2rem',
                overflow: 'hidden', background: 'var(--card)',
              }}>
                <button onClick={() => setQuantity(prev => Math.max(1, prev - 1))} style={{ padding: '0.5rem 1rem', color: 'var(--text-muted)' }}>
                  <Minus size={14} />
                </button>
                <span style={{ fontSize: '1.05rem', fontWeight: 600, minWidth: '30px', textAlign: 'center' }}>{quantity}</span>
                <button onClick={() => setQuantity(prev => prev + 1)} style={{ padding: '0.5rem 1rem', color: 'var(--text-muted)' }}>
                  <Plus size={14} />
                </button>
              </div>
              {(product.stock ?? 0) <= 10 && (product.stock ?? 0) > 0 && (
                <span style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                  Only {product.stock} items left!
                </span>
              )}
              {(product.stock ?? 0) === 0 && (
                <span style={{ color: 'red', fontSize: '0.85rem', fontWeight: 600 }}>Out of Stock</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => addToCart(product, quantity)}
                disabled={(product.stock ?? 0) === 0}
                className="btn btn-outline"
                style={{ flex: '1 1 180px' }}
              >
                <ShoppingCart size={18} /> Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={(product.stock ?? 0) === 0}
                className="btn btn-secondary"
                style={{ flex: '1 1 180px' }}
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Bought Together */}
      {boughtTogether.length > 0 && (
        <section style={{ marginBottom: '4rem' }} className="card-glass">
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>🌟 Frequently Bought Together</h3>
          </div>
          <div style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', flexGrow: 1 }}>
              <div style={{ textAlign: 'center', maxWidth: '120px' }}>
                <img src={images[0]} alt="" onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }} style={{ width: '100px', height: '80px', objectFit: 'contain', borderRadius: 'var(--radius-sm)' }} />
                <div style={{ fontSize: '0.8rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.25rem' }}>{product.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>Rs. {activePrice}</div>
              </div>
              <span style={{ fontSize: '1.5rem', fontWeight: 300, color: 'var(--text-muted)' }}>+</span>
              {boughtTogether.map((item, idx) => (
                <React.Fragment key={item._id}>
                  <div style={{ textAlign: 'center', maxWidth: '120px' }}>
                    <img src={(item.images && item.images[0]) || FALLBACK_IMG} alt="" onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }} style={{ width: '100px', height: '80px', objectFit: 'contain', borderRadius: 'var(--radius-sm)' }} />
                    <div style={{ fontSize: '0.8rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.25rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                      Rs. {(item.discountPrice ?? 0) > 0 ? item.discountPrice : item.price}
                    </div>
                  </div>
                  {idx < boughtTogether.length - 1 && (
                    <span style={{ fontSize: '1.5rem', fontWeight: 300, color: 'var(--text-muted)' }}>+</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div style={{ padding: '1.25rem', borderLeft: '1px solid var(--border)', minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Bundle Price:</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--secondary)' }}>Rs. {bundleTotal}</div>
              </div>
              <button onClick={handleAddBundle} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                Add Bundle to Cart
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          YOU MAY ALSO LIKE — Similar Products Section
      ═══════════════════════════════════════════════════════ */}
      <section style={{ marginBottom: '4rem' }}>
        {/* Section header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '1.75rem',
          paddingBottom: '1rem', borderBottom: '2px solid var(--border-light)',
        }}>
          <div>
            <span style={{
              fontSize: '0.75rem', letterSpacing: '3px', textTransform: 'uppercase',
              color: 'var(--secondary)', fontWeight: 700, display: 'block', marginBottom: '0.3rem',
            }}>FROM THE SAME FAMILY</span>
            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.4rem, 3vw, 1.9rem)',
              fontWeight: 700,
              color: 'var(--text)',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <span style={{ color: '#F59E0B' }}>✨</span> You May Also Like
            </h2>
          </div>
          <Link
            to={`/shop?category=${encodeURIComponent(product.category)}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              fontSize: '0.85rem', fontWeight: 600, color: 'var(--secondary)',
              textDecoration: 'none', padding: '0.45rem 1rem',
              borderRadius: '2rem', border: '1.5px solid var(--secondary)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background='var(--secondary)'; e.currentTarget.style.color='#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--secondary)'; }}
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {/* Loading skeletons */}
        {simLoading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: '1.5rem',
          }}>
            {[1,2,3,4].map(n => (
              <div key={n} style={{
                background: 'var(--card)', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)', overflow: 'hidden',
              }}>
                <div className="skeleton" style={{ height: '180px' }} />
                <div style={{ padding: '1rem' }}>
                  <div className="skeleton skeleton-title" style={{ marginBottom: '0.5rem' }} />
                  <div className="skeleton skeleton-text" style={{ width: '55%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : similarProducts.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '2.5rem 1.5rem',
            background: 'var(--card)', borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border)', color: 'var(--text-muted)',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
            <p>No similar products found right now.</p>
            <Link to="/shop" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              marginTop: '1rem', padding: '0.55rem 1.25rem',
              background: 'var(--secondary)', color: '#fff',
              borderRadius: '2rem', fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem',
            }}>Browse All Products <ArrowRight size={14}/></Link>
          </div>
        ) : (
          <>
            {/* Scroll controls for mobile */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
                style={{
                  display: 'none', // shown via CSS media override below
                  position: 'absolute', left: '-14px', top: '50%', transform: 'translateY(-50%)',
                  zIndex: 5, width: '36px', height: '36px', borderRadius: '50%',
                  background: 'var(--card)', border: '1.5px solid var(--border)',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  boxShadow: 'var(--shadow)', color: 'var(--secondary)',
                }}
                id="sim-scroll-left"
                aria-label="Scroll left"
              ><ChevronLeft size={18}/></button>

              <div
                ref={scrollRef}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                  gap: '1.5rem',
                }}
              >
                {similarProducts.map((sim) => {
                  const simHasDiscount = (sim.discountPrice ?? 0) > 0;
                  const simPrice = simHasDiscount ? sim.discountPrice : sim.price;
                  const simOriginal = simHasDiscount ? sim.price : null;
                  const simRating = typeof sim.rating === 'number' ? sim.rating : 0;
                  const simInStock = (sim.stock ?? 1) > 0;
                  const simImage = (sim.images && sim.images[0]) || sim.image || FALLBACK_IMG;
                  const simJustAdded = simAddedId === sim._id;

                  return (
                    <div
                      key={sim._id}
                      style={{
                        display: 'flex', flexDirection: 'column',
                        background: 'var(--card)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-light)',
                        overflow: 'hidden',
                        position: 'relative',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'transform 0.32s cubic-bezier(0.16,1,0.3,1), box-shadow 0.32s ease, border-color 0.2s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-6px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                        e.currentTarget.style.borderColor = 'rgba(37,99,235,0.3)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                        e.currentTarget.style.borderColor = 'var(--border-light)';
                      }}
                    >
                      {/* Discount badge */}
                      {simHasDiscount && (
                        <span style={{
                          position: 'absolute', top: '10px', left: '10px', zIndex: 3,
                          background: '#F59E0B', color: '#1E40AF',
                          fontSize: '0.62rem', fontWeight: 700,
                          padding: '2px 7px', borderRadius: '3px', letterSpacing: '0.5px',
                        }}>
                          SAVE {Math.round(((sim.price - sim.discountPrice) / sim.price) * 100)}%
                        </span>
                      )}

                      {/* Product image */}
                      <Link
                        to={`/product/${sim._id}`}
                        className="product-img-wrap"
                        style={{ height: '185px', display: 'block', textDecoration: 'none', background: '#fff', flexShrink: 0 }}
                      >
                        <img
                          src={simImage}
                          alt={sim.title}
                          loading="lazy"
                          onError={e => { e.currentTarget.src = FALLBACK_IMG; }}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'transform 0.4s ease' }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        />
                      </Link>

                      {/* Card body */}
                      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                        {/* Category */}
                        <span style={{
                          fontSize: '0.68rem', textTransform: 'uppercase',
                          color: 'var(--secondary)', fontWeight: 700,
                          letterSpacing: '0.5px', marginBottom: '0.3rem',
                        }}>{sim.category}</span>

                        {/* Title */}
                        <Link to={`/product/${sim._id}`} style={{ textDecoration: 'none' }}>
                          <h4 style={{
                            fontSize: '0.92rem', fontWeight: 600, color: 'var(--text)',
                            marginBottom: '0.4rem', lineHeight: 1.35,
                            display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            minHeight: '2.5rem',
                            transition: 'color 0.18s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--secondary)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text)'}>
                            {sim.title}
                          </h4>
                        </Link>

                        {/* Rating stars */}
                        {simRating > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.65rem' }}>
                            <div style={{ display: 'flex', gap: '1px' }}>
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} size={11}
                                  fill={s <= Math.round(simRating) ? '#F59E0B' : 'none'}
                                  stroke={s <= Math.round(simRating) ? '#F59E0B' : 'var(--border)'}
                                />
                              ))}
                            </div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text)' }}>{simRating.toFixed(1)}</span>
                            {sim.numReviews > 0 && (
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>({sim.numReviews})</span>
                            )}
                          </div>
                        )}

                        {/* Price + Add to Cart */}
                        <div style={{
                          marginTop: 'auto', paddingTop: '0.7rem',
                          borderTop: '1px solid var(--border-light)',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                          <div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--secondary)', lineHeight: 1 }}>
                              ₹{simPrice}
                            </div>
                            {simOriginal && (
                              <div style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: 'var(--text-muted)', marginTop: '1px' }}>
                                ₹{simOriginal}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              addToCart(sim, 1);
                              setSimAddedId(sim._id);
                              setTimeout(() => setSimAddedId(null), 1800);
                            }}
                            disabled={!simInStock}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                              padding: '0.42rem 0.85rem', borderRadius: '2rem',
                              fontWeight: 700, fontSize: '0.78rem', border: 'none',
                              cursor: simInStock ? 'pointer' : 'not-allowed',
                              background: simJustAdded
                                ? '#16a34a'
                                : simInStock
                                ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                                : 'var(--border)',
                              color: simJustAdded ? '#fff' : simInStock ? '#1E40AF' : 'var(--text-muted)',
                              transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
                              boxShadow: simInStock && !simJustAdded ? '0 3px 10px rgba(245,158,11,0.4)' : 'none',
                            }}
                            onMouseEnter={e => {
                              if (simInStock && !simJustAdded) {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(245,158,11,0.55)';
                              }
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.transform = 'none';
                              e.currentTarget.style.boxShadow = simInStock && !simJustAdded ? '0 3px 10px rgba(245,158,11,0.4)' : 'none';
                            }}
                          >
                            {simJustAdded
                              ? <><Star size={12} fill="#fff" stroke="#fff"/> Added!</>
                              : simInStock
                              ? <><ShoppingCart size={12}/> Add</>
                              : 'Sold Out'
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
                style={{
                  display: 'none',
                  position: 'absolute', right: '-14px', top: '50%', transform: 'translateY(-50%)',
                  zIndex: 5, width: '36px', height: '36px', borderRadius: '50%',
                  background: 'var(--card)', border: '1.5px solid var(--border)',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  boxShadow: 'var(--shadow)', color: 'var(--secondary)',
                }}
                id="sim-scroll-right"
                aria-label="Scroll right"
              ><ChevronRight size={18}/></button>
            </div>

            {/* Bottom CTA */}
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Link
                to={`/shop?category=${encodeURIComponent(product.category)}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.7rem 1.75rem', borderRadius: '2rem',
                  background: 'linear-gradient(135deg, #2563EB, #1E40AF)',
                  color: '#fff', fontWeight: 600, fontSize: '0.9rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(37,99,235,0.35)',
                  transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(37,99,235,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 4px 16px rgba(37,99,235,0.35)'; }}
              >
                View All {product.category} Products <ArrowRight size={16}/>
              </Link>
            </div>
          </>
        )}
      </section>

      {/* Reviews & Ratings */}
      <section style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem' }}>
        <div style={{ flex: '2 1 400px' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem' }}>Customer Reviews ({reviews.length})</h3>
          {reviews.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center', background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              No reviews yet. Be the first to review this product!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {reviews.map((rev) => (
                <div key={rev._id} style={{ padding: '1.25rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{rev.name}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="stars-container" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    {'★'.repeat(Math.round(rev.rating ?? 0))}{'☆'.repeat(5 - Math.round(rev.rating ?? 0))}
                  </div>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text)', lineHeight: '1.6' }}>{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: '1 1 300px' }} className="card-glass">
          <div style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>Write a Customer Review</h3>
            {user ? (
              <form onSubmit={handleReviewSubmit}>
                <div className="form-group">
                  <label className="form-label">Rating</label>
                  <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="form-input" style={{ height: '38px', fontSize: '0.9rem' }}>
                    <option value={5}>5 - Excellent</option>
                    <option value={4}>4 - Very Good</option>
                    <option value={3}>3 - Average</option>
                    <option value={2}>2 - Poor</option>
                    <option value={1}>1 - Terrible</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Review Comment</label>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience about quality, taste, packing..."
                    className="form-input"
                    style={{ resize: 'none', fontSize: '0.9rem' }}
                    required
                  />
                </div>
                <button type="submit" disabled={submittingReview} className="btn btn-secondary" style={{ width: '100%' }}>
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Please sign in to submit a product review.
                </p>
                <Link to="/login" className="btn btn-outline btn-sm">Sign In</Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
