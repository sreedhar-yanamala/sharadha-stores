import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Search, ShoppingCart, Heart, X,
  ChevronLeft, ChevronRight, ArrowUpDown, PackageSearch,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

/* ── Constants ──────────────────────────────────────────────────── */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const PAGE_SIZE = 9;

const CATEGORIES = [
  { slug: '',              label: 'All Products',  emoji: '🏪' },
  { slug: 'Chips',         label: 'Chips',         emoji: '🥔' },
  { slug: 'Appalams',      label: 'Appalams',      emoji: '🫓' },
  { slug: 'Sweets',        label: 'Sweets',        emoji: '🍬' },
  { slug: 'Snacks',        label: 'Snacks',        emoji: '🍿' },
  { slug: 'Pickles',       label: 'Pickles',       emoji: '🥒' },
  { slug: 'Spice Powders', label: 'Spice Powders', emoji: '🌶️' },
];

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest First' },
  { value: 'priceAsc',   label: 'Price: Low → High' },
  { value: 'priceDesc',  label: 'Price: High → Low' },
  { value: 'ratingDesc', label: 'Top Rated' },
];

/* Convert URL slug → API category string */
function slugToCategory(slug) {
  if (!slug || slug === 'all') return '';
  const found = CATEGORIES.find(
    c => c.slug.toLowerCase() === decodeURIComponent(slug || '').toLowerCase()
  );
  return found ? found.slug : decodeURIComponent(slug || '');
}

/* ── Skeleton card ───────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--card)', borderRadius: 'var(--radius-lg)',
      overflow: 'hidden', border: '1px solid var(--border-light)',
    }}>
      <div className="skeleton" style={{ height: '200px', borderRadius: 0 }} />
      <div style={{ padding: '1rem' }}>
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text" style={{ width: '60%' }} />
        <div className="skeleton skeleton-text" style={{ width: '40%' }} />
      </div>
    </div>
  );
}

/* ── Product Card ────────────────────────────────────────────────── */
function ProductCard({ product, onAddToCart, onWishlist, inWishlist }) {
  const hasDiscount = product.discountPrice > 0 && product.discountPrice < product.price;
  const activePrice = hasDiscount ? product.discountPrice : product.price;
  const discount = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;
  const img = (product.images && product.images[0]) || '/images/placeholder.jpg';
  const pid = product._id || product.id;

  return (
    <div className="product-card" style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* Wishlist */}
      <button
        onClick={e => { e.preventDefault(); onWishlist(product); }}
        style={{
          position: 'absolute', top: 10, right: 10, zIndex: 5,
          background: 'rgba(255,255,255,0.92)', borderRadius: '50%',
          width: 32, height: 32, display: 'flex', alignItems: 'center',
          justifyContent: 'center', border: 'none', cursor: 'pointer',
          boxShadow: 'var(--shadow-sm)',
          color: inWishlist ? 'var(--primary)' : 'var(--text-muted)',
          transition: 'transform 0.18s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        aria-label="Toggle wishlist"
      >
        <Heart size={14} fill={inWishlist ? 'var(--primary)' : 'none'} />
      </button>

      {/* Discount badge */}
      {hasDiscount && (
        <span style={{
          position: 'absolute', top: 10, left: 10, zIndex: 5,
          background: 'var(--primary)', color: 'var(--secondary)',
          fontSize: '0.68rem', fontWeight: 800,
          padding: '0.15rem 0.45rem', borderRadius: 4,
        }}>
          {discount}% OFF
        </span>
      )}

      <Link to={`/product/${pid}`} className="product-card__img-wrap">
        <img src={img} alt={product.title || product.name} />
      </Link>

      <div className="product-card__body" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <span className="product-card__category">{product.category}</span>
        <Link to={`/product/${pid}`}>
          <h3 className="product-card__title">{product.title || product.name}</h3>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
          <span style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>
            {'★'.repeat(Math.round(product.rating || 0))}
            {'☆'.repeat(5 - Math.round(product.rating || 0))}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            ({product.numReviews || product.num_reviews || 0})
          </span>
        </div>

        <div className="product-card__footer" style={{ marginTop: 'auto' }}>
          <div>
            <span className="product-card__price">₹{activePrice}</span>
            {hasDiscount && (
              <span className="product-card__price-old" style={{ marginLeft: '0.4rem' }}>
                ₹{product.price}
              </span>
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

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════════════ */
export default function Products() {
  const { category: categoryParam } = useParams();
  const navigate  = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const activeCategory = slugToCategory(categoryParam);
  const activeCatInfo  = CATEGORIES.find(c => c.slug === activeCategory) || CATEGORIES[0];

  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [sort,       setSort]       = useState('newest');
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);
  const debounceRef = useRef(null);

  /* SEO title */
  useEffect(() => {
    document.title = activeCategory
      ? `${activeCatInfo.label} | Sharadha Stores`
      : 'All Products | Sharadha Stores';
  }, [activeCategory, activeCatInfo.label]);

  /* Helper: filter and paginate local products */
  const getLocalFiltered = async (cat, kw, s, pg) => {
    const { getLocalProducts } = await import('../data/products');
    const all = getLocalProducts();
    console.log('[Products] Local data | total:', all.length);
    const filtered = all.filter(p => {
      const matchCat = !cat || (p.category || '').toLowerCase() === cat.toLowerCase();
      const matchKw  = !kw.trim() || (p.title || p.name || '').toLowerCase().includes(kw.trim().toLowerCase());
      return matchCat && matchKw;
    });
    console.log('[Products] Local data | category', JSON.stringify(cat), '→', filtered.length, 'products');
    const sorted = [...filtered].sort((a, b) => {
      if (s === 'priceAsc')   return a.price - b.price;
      if (s === 'priceDesc')  return b.price - a.price;
      if (s === 'ratingDesc') return (b.rating || 0) - (a.rating || 0);
      return (b._id || '').localeCompare(a._id || '');
    });
    const start = (pg - 1) * PAGE_SIZE;
    return {
      products: sorted.slice(start, start + PAGE_SIZE),
      total: sorted.length,
      pages: Math.max(1, Math.ceil(sorted.length / PAGE_SIZE)),
    };
  };

  /* Fetch from API — if API returns 0 results, fall back to local data */
  const fetchProducts = useCallback(async (cat, kw, s, pg) => {
    setLoading(true);
    console.log('[Products] Fetching | category:', JSON.stringify(cat), '| keyword:', kw, '| sort:', s, '| page:', pg);
    try {
      const params = new URLSearchParams({ pageSize: PAGE_SIZE, page: pg, sort: s });
      if (cat)       params.set('category', cat);
      if (kw.trim()) params.set('keyword',  kw.trim());

      const url = `${API_BASE}/api/products?${params}`;
      console.log('[Products] API URL:', url);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const apiProducts = data.products || [];
      console.log('[Products] API response | total:', data.total, '| returned:', apiProducts.length);

      if (apiProducts.length > 0) {
        // API has real products — use them
        console.log('[Products] Using API products. First category:', apiProducts[0].category);
        setProducts(apiProducts);
        setTotalPages(data.pages || 1);
        setTotal(data.total || 0);
      } else {
        // API returned 0 — use local data as fallback
        console.warn('[Products] API returned 0 products for category', JSON.stringify(cat), '— using local fallback');
        const local = await getLocalFiltered(cat, kw, s, pg);
        setProducts(local.products);
        setTotalPages(local.pages);
        setTotal(local.total);
      }
    } catch (err) {
      console.warn('[Products] API failed:', err.message, '— using local fallback');
      try {
        const local = await getLocalFiltered(cat, kw, s, pg);
        setProducts(local.products);
        setTotalPages(local.pages);
        setTotal(local.total);
      } catch (fallbackErr) {
        console.error('[Products] Local fallback also failed:', fallbackErr);
        setProducts([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /* Re-fetch when category or sort changes — reset to page 1 */
  useEffect(() => {
    setPage(1);
    setSearch('');
    fetchProducts(activeCategory, '', sort, 1);
  }, [activeCategory, sort, fetchProducts]);

  /* Re-fetch on page change */
  useEffect(() => {
    fetchProducts(activeCategory, search, sort, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  /* Debounced search */
  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchProducts(activeCategory, val, sort, 1);
    }, 320);
  };

  /* Navigate to a category — updates URL */
  const selectCategory = (slug) => {
    setPage(1);
    if (!slug) navigate('/products');
    else       navigate(`/products/${encodeURIComponent(slug)}`);
  };

  const toggleWishlist = (product) => {
    const id = product._id || product.id;
    if (isInWishlist(id)) removeFromWishlist(id);
    else addToWishlist(product);
  };

  /* ── RENDER ─────────────────────────────────────────────────── */
  return (
    <>
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>

        {/* ── Category filter pills ── */}
        <nav
          aria-label="Category filter"
          style={{
            display: 'flex', gap: '0.6rem', overflowX: 'auto',
            paddingBottom: '0.5rem', marginBottom: '1.75rem',
            scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
          }}
        >
          {CATEGORIES.map(cat => {
            const isActive = cat.slug === activeCategory;
            return (
              <button
                key={cat.slug || 'all'}
                id={`cat-filter-${cat.slug || 'all'}`}
                onClick={() => selectCategory(cat.slug)}
                aria-pressed={isActive}
                style={{
                  flexShrink: 0,
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.48rem 1.1rem', borderRadius: '2rem',
                  border: `2px solid ${isActive ? 'var(--secondary)' : 'var(--border)'}`,
                  background: isActive ? 'var(--secondary)' : 'var(--card)',
                  color: isActive ? '#FFF8E7' : 'var(--text)',
                  fontWeight: isActive ? 700 : 500, fontSize: '0.87rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                  boxShadow: isActive ? '0 4px 14px rgba(15,81,50,0.28)' : 'none',
                  transform: isActive ? 'translateY(-1px)' : 'none',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = 'var(--secondary)'; e.currentTarget.style.color = 'var(--secondary)'; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; } }}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ── Toolbar ── */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '0.75rem',
          alignItems: 'center', marginBottom: '1.75rem',
        }}>
          {/* Search input */}
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <Search size={15} style={{
              position: 'absolute', left: 12, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none',
            }} />
            <input
              id="products-search"
              type="text"
              placeholder={activeCategory ? `Search in ${activeCatInfo.label}…` : 'Search all products…'}
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              style={{
                width: '100%', paddingLeft: '2.2rem',
                paddingRight: search ? '2.2rem' : '0.9rem',
                paddingTop: '0.52rem', paddingBottom: '0.52rem',
                border: '1.5px solid var(--border)', borderRadius: '2rem',
                background: 'var(--card)', color: 'var(--text)',
                fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--secondary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            {search && (
              <button
                onClick={() => handleSearchChange('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              ><X size={14} /></button>
            )}
          </div>

          {/* Sort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowUpDown size={14} style={{ color: 'var(--text-muted)' }} />
            <select
              id="products-sort"
              value={sort}
              onChange={e => setSort(e.target.value)}
              style={{
                padding: '0.52rem 0.8rem', borderRadius: '2rem',
                border: '1.5px solid var(--border)',
                background: 'var(--card)', color: 'var(--text)',
                fontSize: '0.85rem', cursor: 'pointer', outline: 'none',
              }}
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Count */}
          {!loading && (
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {total} product{total !== 1 ? 's' : ''} found
            </span>
          )}
        </div>

        {/* ── Grid / Empty / Skeleton ── */}
        {loading ? (
          <div className="product-grid">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '5rem 2rem',
            background: 'var(--card)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
          }}>
            <PackageSearch size={56} style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', opacity: 0.45 }} />
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.7rem', color: 'var(--text)', marginBottom: '0.75rem' }}>
              No products available in this category.
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: 400, margin: '0 auto 1.75rem' }}>
              {search
                ? `No results for "${search}". Try a different keyword.`
                : `We currently have no products listed under ${activeCatInfo.label}. Check back soon!`}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {search && (
                <button onClick={() => handleSearchChange('')} className="btn btn-outline" style={{ borderRadius: '2rem' }}>
                  Clear Search
                </button>
              )}
              <button onClick={() => selectCategory('')} className="btn btn-secondary" style={{ borderRadius: '2rem' }}>
                Browse All Products
              </button>
            </div>
          </div>
        ) : (
          <div className="product-grid">
            {products.map(p => (
              <ProductCard
                key={p._id || p.id}
                product={p}
                onAddToCart={prod => addToCart(prod, 1)}
                onWishlist={toggleWishlist}
                inWishlist={isInWishlist(p._id || p.id)}
              />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.5rem', marginTop: '3rem', flexWrap: 'wrap',
          }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-outline btn-sm"
              style={{ borderRadius: '2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <ChevronLeft size={14} /> Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
              .reduce((acc, n, idx, arr) => {
                if (idx > 0 && n - arr[idx - 1] > 1) acc.push('…');
                acc.push(n);
                return acc;
              }, [])
              .map((n, i) =>
                n === '…'
                  ? <span key={`e${i}`} style={{ color: 'var(--text-muted)', padding: '0 0.25rem' }}>…</span>
                  : (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        border: `1.5px solid ${page === n ? 'var(--secondary)' : 'var(--border)'}`,
                        background: page === n ? 'var(--secondary)' : 'var(--card)',
                        color: page === n ? '#FFF8E7' : 'var(--text)',
                        fontWeight: page === n ? 700 : 400,
                        fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.18s',
                      }}
                    >{n}</button>
                  )
              )}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn btn-outline btn-sm"
              style={{ borderRadius: '2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
