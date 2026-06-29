import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search, ShoppingCart, Heart, X,
  TrendingUp, Sparkles, Star, Award, Clock,
  AlertCircle, CheckCircle, ArrowRight,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import {
  getLocalProducts,
  getLocalCategories,
  searchProducts,
  highlightText,
  getFuzzyFallbackProducts,
  getSpellingSuggestion,
} from '../data/products';

/* ── Tiny helpers ── */
const CAT_EMOJI = { Sweets: '🍬', Snacks: '🍿', Pickles: '🥒', 'Spice Powders': '🌶️', Chips: '🥔', Appalams: '🫓' };
const DEDICATED_ROUTES = { Chips: '/chips', Appalams: '/appalams' };

function Highlight({ text, query }) {
  if (!query || !query.trim()) return <span>{text}</span>;
  return <span dangerouslySetInnerHTML={{ __html: highlightText(text, query) }} />;
}

/* ── Compact product card used throughout ── */
function ProductCard({ product, query = '', showHighlight = false, onWishlist, inWishlist, onAddToCart }) {
  const hasDiscount = product.discountPrice > 0;
  const activePrice = hasDiscount ? product.discountPrice : product.price;

  return (
    <div className="product-card" style={{ position: 'relative' }}>
      {/* Wishlist */}
      <button
        onClick={(e) => { e.preventDefault(); onWishlist(product); }}
        style={{
          position: 'absolute', top: '10px', right: '10px',
          background: 'rgba(255,255,255,0.92)', borderRadius: '50%',
          width: '32px', height: '32px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-sm)', zIndex: 5,
          color: inWishlist ? '#E11D48' : 'var(--text-muted)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          border: 'none', cursor: 'pointer',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        aria-label="Toggle wishlist"
      >
        <Heart size={14} fill={inWishlist ? '#E11D48' : 'none'} />
      </button>

      {/* Discount badge */}
      {hasDiscount && (
        <span style={{
          position: 'absolute', top: '10px', left: '10px',
          background: 'var(--primary)', color: 'var(--secondary)',
          fontSize: '0.68rem', fontWeight: 800,
          padding: '0.15rem 0.45rem', borderRadius: '4px', zIndex: 5,
        }}>
          {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
        </span>
      )}

      {/* Image */}
      <Link to={`/product/${product._id}`} className="product-card__img-wrap">
        <img src={product.images[0]} alt={product.title} />
      </Link>

      <div className="product-card__body">
        <span className="product-card__category">{product.category}</span>

        <Link to={`/product/${product._id}`}>
          <h3 className="product-card__title">
            {showHighlight ? <Highlight text={product.title} query={query} /> : product.title}
          </h3>
        </Link>

        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
          <span style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>
            {'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({product.numReviews})</span>
        </div>

        {/* Description snippet */}
        {showHighlight && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.6rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            <Highlight text={product.description} query={query} />
          </p>
        )}

        <div className="product-card__footer">
          <div>
            <span className="product-card__price">Rs. {activePrice}</span>
            {hasDiscount && (
              <span className="product-card__price-old" style={{ marginLeft: '0.4rem' }}>Rs. {product.price}</span>
            )}
          </div>
          <button
            onClick={() => onAddToCart(product)}
            disabled={product.stock === 0}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.38rem 0.8rem', borderRadius: '2rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <ShoppingCart size={12} />
            {product.stock === 0 ? 'Out of Stock' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Section header ── */
function SectionHead({ icon: Icon, label, sub }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
        <Icon size={18} style={{ color: 'var(--primary)' }} />
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}>{label}</h2>
      </div>
      {sub && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '1.65rem' }}>{sub}</p>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════ */
export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const urlQuery = searchParams.get('q') || '';

  const [inputValue, setInputValue] = useState(urlQuery);
  const [query, setQuery]           = useState(urlQuery);
  const [loading, setLoading]       = useState(false);

  /* Search results */
  const [exactResults, setExactResults]   = useState([]);
  const [fallback, setFallback]           = useState(null); // { products, reason, correction }
  const [spelling, setSpelling]           = useState(null); // { corrected, distance }

  /* Static data */
  const [allProducts, setAllProducts]   = useState([]);
  const [categories, setCategories]     = useState([]);
  const [bestSellers, setBestSellers]   = useState([]);
  const [featured, setFeatured]         = useState([]);
  const [recentlyAdded, setRecentlyAdded] = useState([]);

  const debounceRef = useRef(null);

  /* Load static data once */
  useEffect(() => {
    const all = getLocalProducts();
    setAllProducts(all);
    setCategories(getLocalCategories());
    setBestSellers(all.filter(p => p.isBestSeller).slice(0, 4));
    setFeatured(all.filter(p => p.isFeatured).slice(0, 4));
    // "Recently added" = highest _id products (newest in our seed data)
    setRecentlyAdded([...all].sort((a, b) => parseInt(b._id) - parseInt(a._id)).slice(0, 4));
  }, []);

  /* Run search whenever query changes */
  useEffect(() => {
    if (!query.trim()) {
      setExactResults([]);
      setFallback(null);
      setSpelling(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const t = setTimeout(() => {
      const found = searchProducts(allProducts, query);

      if (found.length > 0) {
        setExactResults(found);
        setFallback(null);
        setSpelling(null);
      } else {
        setExactResults([]);
        // Get spelling suggestion for display (even when fallback finds something)
        const sp = getSpellingSuggestion(query);
        setSpelling(sp);
        // Get fallback products
        const fb = getFuzzyFallbackProducts(allProducts, query);
        setFallback(fb);
      }

      setLoading(false);
    }, 150);

    return () => clearTimeout(t);
  }, [query, allProducts]);

  /* Sync URL → state when user navigates back */
  useEffect(() => {
    const q = searchParams.get('q') || '';
    if (q !== query) {
      setInputValue(q);
      setQuery(q);
    }
  }, [searchParams]);

  /* Handlers */
  const handleInputChange = useCallback((e) => {
    const val = e.target.value;
    setInputValue(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQuery(val);
      setSearchParams(val.trim() ? { q: val.trim() } : {}, { replace: true });
    }, 220);
  }, [setSearchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = inputValue.trim();
    if (q) { setQuery(q); setSearchParams({ q }, { replace: true }); }
  };

  const clearSearch = () => {
    setInputValue(''); setQuery('');
    setSearchParams({}, { replace: true });
  };

  const applyQuery = (q) => {
    setInputValue(q); setQuery(q);
    setSearchParams({ q }, { replace: true });
  };

  const toggleWishlist = (product) => {
    if (isInWishlist(product._id)) removeFromWishlist(product._id);
    else addToWishlist(product);
  };

  /* Display flags */
  const hasQuery   = !!query.trim();
  const hasExact   = exactResults.length > 0;
  const hasFallback = fallback && fallback.products.length > 0;

  /* Category counts for result bar */
  const catCounts = {};
  exactResults.forEach(p => { catCounts[p.category] = (catCounts[p.category] || 0) + 1; });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', paddingBottom: '6rem' }}>

      {/* ══ Hero Search Header ══ */}
      <div style={{
        background: 'linear-gradient(135deg, var(--secondary) 0%, #0B3D24 100%)',
        padding: '2.75rem 1.5rem 2.25rem',
        textAlign: 'center',
      }}>
        <p style={{ color: 'var(--primary)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Sharadha Stores Search
        </p>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
          color: '#FFF8E7', marginBottom: '1.6rem', fontWeight: 500,
        }}>
          {hasQuery
            ? <>{hasExact ? 'Results for ' : 'Showing results for '}<em style={{ color: 'var(--primary)' }}>&ldquo;{query}&rdquo;</em></>
            : 'Find Homemade Goodness'}
        </h1>

        {/* Search bar */}
        <form onSubmit={handleSubmit} style={{ maxWidth: '640px', margin: '0 auto', position: 'relative' }}>
          <Search size={17} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 2, pointerEvents: 'none' }} />
          <input
            id="search-main-input"
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Try: sweets, ghee, pickle, sambar powder…"
            autoFocus
            style={{
              width: '100%', padding: '0.95rem 3.5rem 0.95rem 2.8rem',
              borderRadius: '3rem', border: '2px solid rgba(212,175,55,0.3)',
              background: 'rgba(255,248,231,0.97)', color: 'var(--text)',
              fontSize: '0.97rem', fontFamily: 'var(--font-body)', outline: 'none',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)', transition: 'border-color 0.2s',
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'}
          />
          {inputValue && (
            <button type="button" onClick={clearSearch}
              style={{ position: 'absolute', right: '60px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 2, background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={15} />
            </button>
          )}
          <button type="submit" style={{
            position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)',
            background: 'var(--primary)', color: 'var(--secondary)',
            border: 'none', borderRadius: '2rem', padding: '0.52rem 1.1rem',
            fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', zIndex: 2,
          }}>
            Search
          </button>
        </form>

        {/* Quick chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.45rem', marginTop: '1.15rem' }}>
          {['Sweets', 'Snacks', 'Pickles', 'Spice Powders', 'Ghee', 'Homemade'].map(chip => (
            <button key={chip} onClick={() => applyQuery(chip)} style={{
              padding: '0.28rem 0.85rem', borderRadius: '2rem',
              border: '1.5px solid rgba(212,175,55,0.4)',
              background: query.toLowerCase() === chip.toLowerCase() ? 'var(--primary)' : 'rgba(255,248,231,0.1)',
              color: query.toLowerCase() === chip.toLowerCase() ? 'var(--secondary)' : '#FFF8E7',
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s',
            }}>
              {chip}
            </button>
          ))}
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2.5rem' }}>

        {/* ── Loading skeletons ── */}
        {loading && (
          <div className="product-grid">
            {[1,2,3,4,5,6].map(n => (
              <div key={n} style={{ background: 'var(--card)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                <div className="skeleton" style={{ height: '180px', borderRadius: 0 }} />
                <div style={{ padding: '1rem' }}>
                  <div className="skeleton skeleton-title" />
                  <div className="skeleton skeleton-text" style={{ width: '55%' }} />
                  <div className="skeleton skeleton-text" style={{ width: '35%' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            CASE 1: EXACT RESULTS FOUND
            ══════════════════════════════════════════════════ */}
        {!loading && hasExact && (
          <>
            {/* Result count bar */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <CheckCircle size={16} style={{ color: '#16a34a' }} />
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                {exactResults.length} product{exactResults.length !== 1 ? 's' : ''} found
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                for &ldquo;<span style={{ color: 'var(--secondary)', fontWeight: 600 }}>{query}</span>&rdquo;
              </span>
              {Object.entries(catCounts).map(([cat, count]) => (
                <span key={cat} style={{
                  padding: '0.18rem 0.6rem',
                  background: 'rgba(15,81,50,0.1)', color: 'var(--secondary)',
                  borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 600,
                }}>
                  {cat} ({count})
                </span>
              ))}
            </div>

            {/* Results grid */}
            <div className="product-grid" style={{ marginBottom: '4rem' }}>
              {exactResults.map(p => (
                <ProductCard
                  key={p._id} product={p} query={query} showHighlight
                  onWishlist={toggleWishlist}
                  inWishlist={isInWishlist(p._id)}
                  onAddToCart={prod => addToCart(prod, 1)}
                />
              ))}
            </div>

            {/* Best Sellers section (always show below results) */}
            {bestSellers.length > 0 && (
              <section style={{ marginBottom: '3.5rem' }}>
                <SectionHead icon={Award} label="Best Sellers" sub="Our most-loved products, hand-picked by customers." />
                <div className="product-grid">
                  {bestSellers.map(p => (
                    <ProductCard key={p._id} product={p}
                      onWishlist={toggleWishlist} inWishlist={isInWishlist(p._id)}
                      onAddToCart={prod => addToCart(prod, 1)} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════
            CASE 2: NO EXACT MATCH — smart fallback
            ══════════════════════════════════════════════════ */}
        {!loading && hasQuery && !hasExact && (
          <div>
            {/* ── Alert banner ── */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '1rem',
              background: 'var(--card)', border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem',
              marginBottom: '2rem',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <AlertCircle size={22} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flexGrow: 1 }}>
                <p style={{ fontWeight: 600, fontSize: '0.97rem', marginBottom: '0.3rem' }}>
                  We couldn&apos;t find an exact match for &ldquo;<span style={{ color: 'var(--secondary)' }}>{query}</span>&rdquo;
                </p>

                {/* Spelling suggestion */}
                {spelling && (
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    Did you mean &nbsp;
                    <button
                      onClick={() => applyQuery(spelling.corrected)}
                      style={{
                        color: 'var(--secondary)', fontWeight: 700, textDecoration: 'underline',
                        background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.88rem',
                        textDecorationStyle: 'dotted',
                      }}
                    >
                      &ldquo;{spelling.corrected}&rdquo;
                    </button>
                    ?
                  </p>
                )}

                {/* Reason-specific message */}
                {fallback?.reason === 'correction' && !spelling && (
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    Showing results for &ldquo;<span style={{ fontWeight: 600 }}>{fallback.correction}</span>&rdquo; instead.
                  </p>
                )}
                {fallback?.reason === 'category' && (
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    Showing all products from the <span style={{ fontWeight: 600 }}>{fallback.correction}</span> category.
                  </p>
                )}
                {fallback?.reason === 'popular' && (
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    Here are some popular products you may like.
                  </p>
                )}
              </div>

              {/* Quick suggestion pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'flex-end', flexShrink: 0 }}>
                {['Sweets', 'Snacks', 'Pickles', 'Ghee'].map(s => (
                  <button key={s} onClick={() => applyQuery(s)}
                    className="btn btn-outline btn-sm"
                    style={{ borderRadius: '2rem', fontSize: '0.78rem', padding: '0.25rem 0.65rem' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Did You Mean correction banner (prominent) ── */}
            {spelling && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(15,81,50,0.06))',
                border: '1.5px solid rgba(212,175,55,0.3)',
                borderRadius: 'var(--radius-lg)', padding: '1rem 1.5rem',
                marginBottom: '2rem',
                display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: '1.4rem' }}>🔍</span>
                <div>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Did you mean: </span>
                  <button
                    onClick={() => applyQuery(spelling.corrected)}
                    style={{
                      fontSize: '1rem', fontWeight: 700, color: 'var(--secondary)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      textDecoration: 'underline', textDecorationStyle: 'dotted',
                    }}
                  >
                    &ldquo;{spelling.corrected}&rdquo;
                  </button>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                    (auto-corrected from &ldquo;{query}&rdquo;)
                  </span>
                </div>
                <button
                  onClick={() => applyQuery(spelling.corrected)}
                  className="btn btn-secondary btn-sm"
                  style={{ marginLeft: 'auto', borderRadius: '2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  Search &ldquo;{spelling.corrected}&rdquo; <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* ── Fallback product grid ── */}
            {hasFallback && (
              <section style={{ marginBottom: '3.5rem' }}>
                <SectionHead
                  icon={fallback.reason === 'popular' ? TrendingUp : Sparkles}
                  label={
                    fallback.reason === 'correction'
                      ? `Results for "${fallback.correction}"`
                      : fallback.reason === 'category'
                      ? `Products from ${fallback.correction}`
                      : 'Popular Products You May Like'
                  }
                  sub={
                    fallback.reason === 'correction'
                      ? `Try one of these related products instead.`
                      : fallback.reason === 'category'
                      ? `Showing all products from the ${fallback.correction} category.`
                      : 'No exact matches found. Here are some popular products you may like.'
                  }
                />
                <div className="product-grid">
                  {fallback.products.map(p => (
                    <ProductCard
                      key={p._id} product={p}
                      query={fallback.reason === 'correction' ? fallback.correction : ''}
                      showHighlight={fallback.reason === 'correction'}
                      onWishlist={toggleWishlist} inWishlist={isInWishlist(p._id)}
                      onAddToCart={prod => addToCart(prod, 1)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── Best Sellers ── */}
            {bestSellers.length > 0 && (
              <section style={{ marginBottom: '3.5rem' }}>
                <SectionHead icon={Award} label="Best Sellers"
                  sub="Our most loved products, trusted by thousands of customers." />
                <div className="product-grid">
                  {bestSellers.map(p => (
                    <ProductCard key={p._id} product={p}
                      onWishlist={toggleWishlist} inWishlist={isInWishlist(p._id)}
                      onAddToCart={prod => addToCart(prod, 1)} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Featured ── */}
            {featured.length > 0 && (
              <section style={{ marginBottom: '3.5rem' }}>
                <SectionHead icon={Star} label="Featured Products"
                  sub="Handpicked homemade specialities from our kitchen." />
                <div className="product-grid">
                  {featured.map(p => (
                    <ProductCard key={p._id} product={p}
                      onWishlist={toggleWishlist} inWishlist={isInWishlist(p._id)}
                      onAddToCart={prod => addToCart(prod, 1)} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Recently Added ── */}
            {recentlyAdded.length > 0 && (
              <section style={{ marginBottom: '3.5rem' }}>
                <SectionHead icon={Clock} label="Recently Added"
                  sub="Fresh arrivals — just added to our store." />
                <div className="product-grid">
                  {recentlyAdded.map(p => (
                    <ProductCard key={p._id} product={p}
                      onWishlist={toggleWishlist} inWishlist={isInWishlist(p._id)}
                      onAddToCart={prod => addToCart(prod, 1)} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Category tiles ── */}
            <section>
              <SectionHead icon={Sparkles} label="Browse by Category"
                sub="Explore our full range of homemade products." />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {categories.map(cat => (
                  <Link
                    key={cat._id}
                    to={DEDICATED_ROUTES[cat.name] || `/shop?category=${encodeURIComponent(cat.name)}`}
                    className="card-glass"
                    style={{
                      padding: '1.25rem 1.75rem', borderRadius: 'var(--radius-lg)',
                      textAlign: 'center', minWidth: '150px', flex: '1 1 150px',
                      transition: 'var(--transition)', textDecoration: 'none',
                    }}
                  >
                    <div style={{ fontSize: '2.2rem', marginBottom: '0.45rem' }}>
                      {CAT_EMOJI[cat.name] || '🏪'}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '0.2rem' }}>{cat.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cat.description.split('.')[0]}</div>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            CASE 3: NO QUERY — landing / browse state
            ══════════════════════════════════════════════════ */}
        {!loading && !hasQuery && (
          <div>
            {/* Trending */}
            {bestSellers.length > 0 && (
              <section style={{ marginBottom: '3.5rem' }}>
                <SectionHead icon={TrendingUp} label="Trending Now"
                  sub="What customers are loving this week." />
                <div className="product-grid">
                  {bestSellers.map(p => (
                    <ProductCard key={p._id} product={p}
                      onWishlist={toggleWishlist} inWishlist={isInWishlist(p._id)}
                      onAddToCart={prod => addToCart(prod, 1)} />
                  ))}
                </div>
              </section>
            )}

            {/* Featured */}
            {featured.length > 0 && (
              <section style={{ marginBottom: '3.5rem' }}>
                <SectionHead icon={Star} label="Featured Products"
                  sub="Handpicked homemade specialities from our kitchen." />
                <div className="product-grid">
                  {featured.map(p => (
                    <ProductCard key={p._id} product={p}
                      onWishlist={toggleWishlist} inWishlist={isInWishlist(p._id)}
                      onAddToCart={prod => addToCart(prod, 1)} />
                  ))}
                </div>
              </section>
            )}

            {/* Recently Added */}
            {recentlyAdded.length > 0 && (
              <section style={{ marginBottom: '3.5rem' }}>
                <SectionHead icon={Clock} label="Recently Added"
                  sub="Fresh arrivals to our homemade store." />
                <div className="product-grid">
                  {recentlyAdded.map(p => (
                    <ProductCard key={p._id} product={p}
                      onWishlist={toggleWishlist} inWishlist={isInWishlist(p._id)}
                      onAddToCart={prod => addToCart(prod, 1)} />
                  ))}
                </div>
              </section>
            )}

            {/* Category tiles */}
            <section>
              <SectionHead icon={Sparkles} label="Shop by Category" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {categories.map(cat => (
                  <Link
                    key={cat._id}
                    to={DEDICATED_ROUTES[cat.name] || `/shop?category=${encodeURIComponent(cat.name)}`}
                    className="card-glass"
                    style={{
                      padding: '1.5rem 2rem', borderRadius: 'var(--radius-lg)',
                      textAlign: 'center', minWidth: '160px', flex: '1 1 160px',
                      transition: 'var(--transition)', textDecoration: 'none',
                    }}
                  >
                    <div style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>
                      {CAT_EMOJI[cat.name] || '🏪'}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: '0.25rem' }}>{cat.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{cat.description.split('.')[0]}</div>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Highlight mark styles */}
      <style>{`
        mark {
          background: rgba(212,175,55,0.32);
          color: var(--secondary);
          font-weight: 700;
          border-radius: 2px;
          padding: 0 2px;
        }
        .dark-theme mark {
          background: rgba(212,175,55,0.22);
          color: var(--primary-light);
        }
      `}</style>
    </div>
  );
}
