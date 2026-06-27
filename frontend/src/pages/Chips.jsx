import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart, Heart, Search, Star, ShieldCheck,
  Leaf, Flame, Package, Truck, X, ArrowRight, Award
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { API_BASE } from '../config/api';

/* ─── SEO meta helper ─── */
function SEOMeta() {
  React.useEffect(() => {
    document.title = 'Chips | Sharadha Stores — Homemade Traditional Crispy Chips';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute('content', 'Buy authentic homemade Chips — Potato Chips, Banana Chips, Tapioca Chips, Jackfruit Chips and more from Sharadha Stores. No preservatives. Fresh and crispy. Pan India delivery.');
    }
  }, []);
  return null;
}

const SORT_OPTIONS = [
  { value: 'popular',   label: 'Most Popular' },
  { value: 'priceLow',  label: 'Price: Low to High' },
  { value: 'priceHigh', label: 'Price: High to Low' },
  { value: 'rating',    label: 'Top Rated' },
  { value: 'newest',    label: 'Newest First' },
];

const FEATURES = [
  { icon: <ShieldCheck size={26} />, title: 'Homemade Quality',    desc: 'Every chip batch hand-sliced and fried in our home kitchen.' },
  { icon: <Leaf size={26} />,        title: 'No Preservatives',    desc: 'Pure ingredients — no artificial colours, flavours or chemicals.' },
  { icon: <Flame size={26} />,       title: 'Traditional Recipe',  desc: 'Ancestral family recipes passed down through generations.' },
  { icon: <Package size={26} />,     title: 'Airtight Packed',     desc: 'Sealed in food-grade airtight packs to lock in freshness.' },
  { icon: <Truck size={26} />,       title: 'Delivered Fresh',     desc: 'Dispatched within 24 hours of your order, pan India.' },
];

export default function Chips() {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  /* ── Filter state ── */
  const [search,      setSearch]      = useState('');
  const [minPrice,    setMinPrice]    = useState('');
  const [maxPrice,    setMaxPrice]    = useState('');
  const [sortBy,      setSortBy]      = useState('popular');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [addedId,     setAddedId]     = useState(null);
  const [allChips,    setAllChips]    = useState([]);
  const [loading,     setLoading]     = useState(true);

  /* ── Fetch Chips products from backend or local ── */
  useEffect(() => {
    const fetchChips = async () => {
      setLoading(true);
      console.log('[Chips] Fetching from API:', `${API_BASE}/api/products?category=Chips&pageSize=100`);
      try {
        const res = await fetch(`${API_BASE}/api/products?category=Chips&pageSize=100`);
        if (res.ok) {
          const data = await res.json();
          console.log('[Chips] Raw API response:', data);
          const products = data.products || data || [];
          console.log('[Chips] Products from API:', products.length, products);
          setAllChips(products);
        } else {
          console.warn('[Chips] API returned non-OK status:', res.status);
          throw new Error('API failed');
        }
      } catch (err) {
        console.error('[Chips] API fetch error:', err);
        // Fallback: filter local data from localStorage
        try {
          const local = localStorage.getItem('sharadha_products_v25');
          const all = local ? JSON.parse(local) : [];
          const chips = all.filter(p => p.category?.trim().toLowerCase() === 'chips');
          console.log('[Chips] Fallback localStorage chips:', chips.length, chips);
          setAllChips(chips);
        } catch {
          setAllChips([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchChips();
  }, []);

  /* ── Apply filters ── */
  const filtered = useMemo(() => {
    let list = [...allChips];

    // Use case-insensitive matching to catch any casing discrepancies
    list = list.filter(
      p => p.category?.trim().toLowerCase() === 'chips'
    );

    console.log('[Chips] Selected Category: Chips');
    console.log('[Chips] Products from API:', allChips);
    console.log('[Chips] Filtered Products (after category match):', list);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }
    if (minPrice !== '') list = list.filter(p => (p.discountPrice || p.price) >= Number(minPrice));
    if (maxPrice !== '') list = list.filter(p => (p.discountPrice || p.price) <= Number(maxPrice));
    if (onlyInStock)      list = list.filter(p => p.stock > 0);

    switch (sortBy) {
      case 'priceLow':  list.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price)); break;
      case 'priceHigh': list.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price)); break;
      case 'rating':    list.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'newest':    list.sort((a, b) => String(b._id).localeCompare(String(a._id))); break;
      default:          list.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
    }
    return list;
  }, [allChips, search, minPrice, maxPrice, sortBy, onlyInStock]);

  /* ── Handlers ── */
  const handleCart = (product) => {
    addToCart(product, 1);
    setAddedId(product._id);
    setTimeout(() => setAddedId(null), 1800);
  };

  const handleWishlist = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    isInWishlist(product._id) ? removeFromWishlist(product._id) : addToWishlist(product);
  };

  const clearFilters = () => {
    setSearch(''); setMinPrice(''); setMaxPrice('');
    setSortBy('popular'); setOnlyInStock(false);
  };

  const hasFilters = search || minPrice || maxPrice || onlyInStock || sortBy !== 'popular';

  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) return product.images[0];
    if (product.image) return product.image;
    return '/images/murukku.png';
  };

  /* ───────────────────────────────────────────────────────────── */
  return (
    <>
      <SEOMeta />
      <div style={{ backgroundColor: 'var(--background)', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>

        {/* ══ HERO ══ */}
        <section style={{
          position: 'relative',
          minHeight: '480px',
          background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 40%, #2563EB 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', color: '#FFFFFF',
          padding: '5rem 1.5rem 4rem',
          overflow: 'hidden',
        }}>
          {/* Decorative blobs */}
          <div style={{ position:'absolute', inset:0, pointerEvents:'none',
            background:`radial-gradient(circle at 20% 80%, rgba(245,158,11,0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(245,158,11,0.07) 0%, transparent 50%)`
          }}/>

          {/* Floating circles */}
          {[{w:300,h:300,top:'-80px',right:'-80px',op:0.08},{w:160,h:160,bottom:'-40px',left:'-40px',op:0.1}].map((c,i)=>(
            <div key={i} style={{
              position:'absolute', width:c.w, height:c.h, borderRadius:'50%',
              border:'1.5px solid rgba(245,158,11,0.3)', top:c.top, right:c.right,
              bottom:c.bottom, left:c.left, opacity:c.op, pointerEvents:'none',
            }}/>
          ))}

          <div style={{ position:'relative', zIndex:2, maxWidth:'780px' }} className="slide-up">
            {/* Category pill */}
            <span style={{
              display:'inline-block', padding:'0.3rem 1.1rem',
              borderRadius:'2rem', border:'1px solid rgba(245,158,11,0.5)',
              background:'rgba(245,158,11,0.12)', fontSize:'0.75rem',
              letterSpacing:'3px', fontWeight:700, color:'#F59E0B',
              textTransform:'uppercase', marginBottom:'1.5rem',
            }}>🥔 Homemade Chips</span>

            <h1 style={{
              fontFamily:'var(--font-heading)',
              fontSize:'clamp(2.2rem,5vw,3.8rem)',
              fontWeight:700, lineHeight:1.1,
              marginBottom:'1.25rem', color:'#FFFFFF',
              textShadow:'0 2px 16px rgba(0,0,0,0.25)',
            }}>
              Traditional Homemade Chips
            </h1>

            <p style={{
              fontSize:'1.05rem', lineHeight:1.75, opacity:0.88,
              maxWidth:'580px', margin:'0 auto 2.25rem',
              fontWeight:300,
            }}>
              Crispy, authentic, handmade chips prepared using traditional family recipes — fried in fresh oil, no preservatives, delivered crispy to your doorstep.
            </p>

            <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap' }}>
              <a href="#products" style={{
                background:'#F59E0B', color:'#1E40AF', fontWeight:700,
                padding:'0.9rem 2rem', borderRadius:'2rem',
                border:'2px solid #F59E0B', fontSize:'0.95rem',
                display:'inline-flex', alignItems:'center', gap:'0.5rem',
                boxShadow:'0 8px 24px rgba(245,158,11,0.45)',
                textDecoration:'none', transition:'all 0.25s cubic-bezier(0.16,1,0.3,1)',
              }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 12px 32px rgba(245,158,11,0.6)';}}
              onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 8px 24px rgba(245,158,11,0.45)';}}>
                Shop Chips <ArrowRight size={17} />
              </a>
              <Link to="/shop" style={{
                color:'#FFFFFF', border:'2px solid rgba(255,255,255,0.4)',
                fontWeight:500, padding:'0.9rem 2rem', borderRadius:'2rem',
                fontSize:'0.95rem', textDecoration:'none', background:'transparent',
                display:'inline-flex', alignItems:'center', gap:'0.5rem',
                transition:'all 0.25s cubic-bezier(0.16,1,0.3,1)',
              }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.15)';e.currentTarget.style.borderColor='rgba(255,255,255,0.8)';e.currentTarget.style.transform='translateY(-2px)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='rgba(255,255,255,0.4)';e.currentTarget.style.transform='none';}}>
                Browse All Products
              </Link>
            </div>

            {/* Mini stats */}
            <div style={{
              display:'flex', justifyContent:'center', gap:'2.5rem', flexWrap:'wrap',
              marginTop:'3rem', paddingTop:'1.5rem',
              borderTop:'1px solid rgba(255,255,255,0.15)',
              fontSize:'0.85rem', opacity:0.85,
            }}>
              {[
                ['🥔', `${allChips.length || '10'}+ Varieties`, 'Available'],
                ['⭐', '4.7+', 'Avg Rating'],
                ['🚚', 'Pan India', 'Delivery'],
                ['🌿', '0%', 'Preservatives'],
              ].map(([icon, val, label]) => (
                <div key={label} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'1.25rem' }}>{icon}</div>
                  <div style={{ fontWeight:700, color:'#F59E0B', fontSize:'1rem' }}>{val}</div>
                  <div style={{ opacity:0.7, fontSize:'0.75rem' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FEATURES STRIP ══ */}
        <section style={{
          background:'var(--card)', borderTop:'1px solid var(--border)',
          borderBottom:'1px solid var(--border)', padding:'2.5rem 1rem',
        }}>
          <div className="container" style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',
            gap:'1.5rem',
          }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{
                display:'flex', alignItems:'flex-start', gap:'0.85rem',
                padding:'1rem',
              }}>
                <span style={{ color:'var(--secondary)', flexShrink:0, marginTop:'2px' }}>{f.icon}</span>
                <div>
                  <div style={{ fontWeight:600, fontSize:'0.9rem', color:'var(--text)', marginBottom:'0.25rem' }}>{f.title}</div>
                  <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', lineHeight:1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ PRODUCTS SECTION ══ */}
        <section id="products" style={{ padding:'4rem 0 5rem' }}>
          <div className="container">

            {/* Section header */}
            <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
              <span style={{ fontSize:'0.8rem', letterSpacing:'3px', textTransform:'uppercase', color:'var(--secondary)', fontWeight:700 }}>
                HANDCRAFTED SELECTION
              </span>
              <h2 style={{ fontFamily:'var(--font-heading)', fontSize:'2.4rem', fontWeight:700, color:'var(--secondary)', marginTop:'0.5rem' }}>
                Our Chips Collection
              </h2>
              <div style={{ width:'50px', height:'3px', background:'#F59E0B', margin:'0.75rem auto 0', borderRadius:'2px' }}/>
            </div>

            {/* ── FILTER BAR ── */}
            <div style={{
              display:'flex', flexWrap:'wrap', gap:'0.75rem',
              alignItems:'center', marginBottom:'2rem',
              padding:'1.25rem 1.5rem',
              background:'var(--card)', borderRadius:'var(--radius-lg)',
              border:'1px solid var(--border)',
              boxShadow:'var(--shadow-sm)',
            }}>
              {/* Search */}
              <div style={{ position:'relative', flex:'1 1 220px' }}>
                <Search size={15} style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
                <input
                  type="text" placeholder="Search chips..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft:'2rem', height:'38px', fontSize:'0.85rem' }}
                />
              </div>

              {/* Price range */}
              <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', flex:'0 0 auto' }}>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:'8px', top:'50%', transform:'translateY(-50%)', fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:600 }}>₹</span>
                  <input type="text" inputMode="numeric" placeholder="Min"
                    value={minPrice} onChange={e => setMinPrice(e.target.value.replace(/[^0-9]/g,''))}
                    className="form-input"
                    style={{ paddingLeft:'1.4rem', width:'75px', height:'38px', fontSize:'0.82rem' }}
                  />
                </div>
                <span style={{ color:'var(--text-muted)', fontSize:'0.9rem' }}>–</span>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:'8px', top:'50%', transform:'translateY(-50%)', fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:600 }}>₹</span>
                  <input type="text" inputMode="numeric" placeholder="Max"
                    value={maxPrice} onChange={e => setMaxPrice(e.target.value.replace(/[^0-9]/g,''))}
                    className="form-input"
                    style={{ paddingLeft:'1.4rem', width:'75px', height:'38px', fontSize:'0.82rem' }}
                  />
                </div>
              </div>

              {/* Sort */}
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="form-input"
                style={{ flex:'0 0 auto', height:'38px', fontSize:'0.85rem', paddingRight:'1.5rem' }}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              {/* In stock toggle */}
              <label style={{
                display:'flex', alignItems:'center', gap:'0.4rem',
                fontSize:'0.83rem', fontWeight:500, cursor:'pointer',
                flex:'0 0 auto', color:'var(--text)',
              }}>
                <input type="checkbox" checked={onlyInStock} onChange={e => setOnlyInStock(e.target.checked)}
                  style={{ width:'15px', height:'15px', accentColor:'var(--secondary)', cursor:'pointer' }}
                />
                In Stock Only
              </label>

              {/* Clear */}
              {hasFilters && (
                <button onClick={clearFilters} style={{
                  display:'flex', alignItems:'center', gap:'0.3rem',
                  fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:500,
                  padding:'0.3rem 0.6rem', borderRadius:'2rem',
                  border:'1px solid var(--border)', background:'transparent', cursor:'pointer',
                }}>
                  <X size={13}/> Clear
                </button>
              )}

              {/* Result count */}
              <span style={{ marginLeft:'auto', fontSize:'0.82rem', color:'var(--text-muted)', flex:'0 0 auto' }}>
                {filtered.length} product{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* ── PRODUCT GRID ── */}
            {loading ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(265px,1fr))', gap:'1.75rem' }}>
                {[1,2,3,4,5,6].map(n => (
                  <div key={n} style={{ background:'var(--card)', borderRadius:'var(--radius-lg)', overflow:'hidden', height:'380px', border:'1px solid var(--border)' }}>
                    <div className="skeleton" style={{ height:'210px', width:'100%' }}/>
                    <div style={{ padding:'1rem' }}>
                      <div className="skeleton skeleton-title" style={{ marginBottom:'0.5rem' }}/>
                      <div className="skeleton skeleton-text" style={{ width:'60%' }}/>
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{
                textAlign:'center', padding:'4rem 2rem',
                color:'var(--text-muted)', fontSize:'1rem',
                background:'var(--card)', borderRadius:'var(--radius-lg)',
                border:'1px solid var(--border)',
              }}>
                <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🔍</div>
                <h3 style={{ color:'var(--text)', marginBottom:'0.5rem' }}>
                  {allChips.length === 0 ? 'No Chips Products Found' : 'No chips match your filters'}
                </h3>
                <p style={{ maxWidth:'340px', margin:'0 auto 1.5rem', fontSize:'0.9rem' }}>
                  {allChips.length === 0
                    ? 'Chips products are loaded from our live store. Please ensure the backend server is running.'
                    : 'Try adjusting your search or filters.'}
                </p>
                {hasFilters && (
                  <button onClick={clearFilters} style={{
                    marginTop:'0.5rem', padding:'0.6rem 1.5rem',
                    borderRadius:'2rem', background:'var(--secondary)',
                    color:'#fff', border:'none', cursor:'pointer', fontWeight:600,
                  }}>Clear Filters</button>
                )}
                <Link to="/chips" style={{
                  display:'inline-flex', alignItems:'center', gap:'0.5rem',
                  marginTop:'1rem', padding:'0.6rem 1.5rem', borderRadius:'2rem',
                  background:'linear-gradient(135deg,#F59E0B,#D97706)', color:'#1E40AF',
                  fontWeight:700, textDecoration:'none',
                }}>
                  Browse All Chips <ArrowRight size={16}/>
                </Link>
              </div>
            ) : (
              <div style={{
                display:'grid',
                gridTemplateColumns:'repeat(auto-fill,minmax(265px,1fr))',
                gap:'1.75rem',
              }}>
                {filtered.map(product => {
                  const hasDiscount = product.discountPrice > 0;
                  const inWish     = isInWishlist(product._id);
                  const justAdded  = addedId === product._id;
                  const inStock    = product.stock > 0;
                  const lowStock   = product.stock > 0 && product.stock <= 10;

                  return (
                    <div key={product._id} style={{
                      display:'flex', flexDirection:'column',
                      background:'var(--card)', borderRadius:'var(--radius-lg)',
                      border:'1px solid var(--border-light)',
                      overflow:'hidden', position:'relative',
                      transition:'transform 0.32s cubic-bezier(0.16,1,0.3,1), box-shadow 0.32s ease, border-color 0.2s',
                      boxShadow:'var(--shadow-sm)',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-5px)'; e.currentTarget.style.boxShadow='var(--shadow-lg)'; e.currentTarget.style.borderColor='rgba(37,99,235,0.25)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='var(--shadow-sm)'; e.currentTarget.style.borderColor='var(--border-light)'; }}
                    >
                      {/* Badges */}
                      <div style={{ position:'absolute', top:'10px', left:'10px', display:'flex', flexDirection:'column', gap:'4px', zIndex:3 }}>
                        {product.isBestSeller && (
                          <span style={{ background:'#2563EB', color:'#fff', fontSize:'0.65rem', fontWeight:700, padding:'2px 7px', borderRadius:'3px', letterSpacing:'0.5px' }}>BESTSELLER</span>
                        )}
                        {hasDiscount && (
                          <span style={{ background:'#F59E0B', color:'#1E40AF', fontSize:'0.65rem', fontWeight:700, padding:'2px 7px', borderRadius:'3px' }}>
                            SAVE {Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                          </span>
                        )}
                        {lowStock && (
                          <span style={{ background:'#EF4444', color:'#fff', fontSize:'0.65rem', fontWeight:700, padding:'2px 7px', borderRadius:'3px' }}>LOW STOCK</span>
                        )}
                      </div>

                      {/* Wishlist */}
                      <button onClick={e => handleWishlist(e, product)} style={{
                        position:'absolute', top:'10px', right:'10px', zIndex:3,
                        width:'34px', height:'34px', borderRadius:'50%',
                        background:'rgba(255,255,255,0.92)', backdropFilter:'blur(4px)',
                        border:'1px solid var(--border-light)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        cursor:'pointer', transition:'transform 0.2s',
                        color: inWish ? '#EF4444' : 'var(--text-muted)',
                      }}
                        onMouseEnter={e => e.currentTarget.style.transform='scale(1.15)'}
                        onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                      >
                        <Heart size={16} fill={inWish ? '#EF4444' : 'none'} />
                      </button>

                      {/* Product image */}
                      <Link to={`/product/${product._id}`} className="product-img-wrap" style={{ height:'210px', display:'block', textDecoration:'none', flexShrink:0 }}>
                        <img
                          src={getProductImage(product)}
                          alt={product.title}
                          style={{ width:'100%', height:'100%' }}
                          onError={e => { e.currentTarget.src='/images/murukku.png'; }}
                        />
                      </Link>

                      {/* Card body */}
                      <div style={{ padding:'1.1rem', display:'flex', flexDirection:'column', flexGrow:1 }}>
                        {/* Category & weight */}
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.4rem' }}>
                          <span style={{ fontSize:'0.7rem', textTransform:'uppercase', color:'var(--secondary)', fontWeight:700, letterSpacing:'0.5px' }}>Chips</span>
                          {product.weight && (
                            <span style={{ fontSize:'0.68rem', color:'var(--text-muted)', background:'var(--background)', padding:'1px 6px', borderRadius:'2rem', border:'1px solid var(--border)' }}>
                              {product.weight}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <Link to={`/product/${product._id}`} style={{ textDecoration:'none' }}>
                          <h3 style={{
                            fontSize:'0.97rem', fontWeight:600, color:'var(--text)',
                            marginBottom:'0.4rem', lineHeight:1.35,
                            display:'-webkit-box', WebkitLineClamp:2,
                            WebkitBoxOrient:'vertical', overflow:'hidden',
                            transition:'color 0.18s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.color='var(--secondary)'}
                          onMouseLeave={e => e.currentTarget.style.color='var(--text)'}>
                            {product.title}
                          </h3>
                        </Link>

                        {/* Description */}
                        {product.description && (
                          <p style={{
                            fontSize:'0.78rem', color:'var(--text-muted)', lineHeight:1.5,
                            marginBottom:'0.75rem',
                            display:'-webkit-box', WebkitLineClamp:2,
                            WebkitBoxOrient:'vertical', overflow:'hidden',
                          }}>{product.description}</p>
                        )}

                        {/* Rating */}
                        {product.rating > 0 && (
                          <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', marginBottom:'0.75rem' }}>
                            <div style={{ display:'flex', gap:'1px' }}>
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} size={12}
                                  fill={s <= Math.round(product.rating) ? '#F59E0B' : 'none'}
                                  stroke={s <= Math.round(product.rating) ? '#F59E0B' : 'var(--border)'}
                                />
                              ))}
                            </div>
                            <span style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--text)' }}>{product.rating}</span>
                            {product.numReviews > 0 && (
                              <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>({product.numReviews})</span>
                            )}
                          </div>
                        )}

                        {/* Price + Cart */}
                        <div style={{ marginTop:'auto', paddingTop:'0.75rem', borderTop:'1px solid var(--border-light)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <div>
                            {hasDiscount ? (
                              <div style={{ display:'flex', flexDirection:'column', gap:'0.05rem' }}>
                                <span style={{ fontSize:'1.15rem', fontWeight:700, color:'var(--secondary)' }}>₹{product.discountPrice}</span>
                                <span style={{ fontSize:'0.78rem', textDecoration:'line-through', color:'var(--text-muted)' }}>₹{product.price}</span>
                              </div>
                            ) : (
                              <span style={{ fontSize:'1.15rem', fontWeight:700, color:'var(--secondary)' }}>₹{product.price}</span>
                            )}
                            <div style={{ fontSize:'0.68rem', color: inStock ? '#16a34a' : '#dc2626', fontWeight:600 }}>
                              {inStock ? (lowStock ? `Only ${product.stock} left` : '✓ In Stock') : '✗ Out of Stock'}
                            </div>
                          </div>

                          <button
                            onClick={() => handleCart(product)}
                            disabled={!inStock}
                            style={{
                              display:'inline-flex', alignItems:'center', gap:'0.35rem',
                              padding: justAdded ? '0.45rem 0.9rem' : '0.45rem 0.8rem',
                              borderRadius:'2rem', fontWeight:700, fontSize:'0.8rem',
                              cursor: inStock ? 'pointer' : 'not-allowed',
                              border:'none',
                              background: justAdded ? '#16a34a' : inStock ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'var(--border)',
                              color: justAdded ? '#fff' : inStock ? '#1E40AF' : 'var(--text-muted)',
                              transition:'all 0.22s cubic-bezier(0.16,1,0.3,1)',
                              boxShadow: inStock && !justAdded ? '0 3px 10px rgba(245,158,11,0.4)' : 'none',
                            }}
                            onMouseEnter={e=>{if(inStock&&!justAdded){e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 6px 16px rgba(245,158,11,0.55)';}}}
                            onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow=inStock&&!justAdded?'0 3px 10px rgba(245,158,11,0.4)':'none';}}
                          >
                            {justAdded ? (
                              <><Award size={14}/> Added!</>
                            ) : (
                              <><ShoppingCart size={14}/> {inStock ? 'Add' : 'Sold Out'}</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ══ WHY CHOOSE US BAND ══ */}
        <section style={{
          marginBottom:'4rem', padding:'4rem 0',
          background:'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 50%, #2563EB 100%)',
          color:'#FFFFFF',
        }}>
          <div className="container" style={{ textAlign:'center' }}>
            <span style={{ fontSize:'0.8rem', letterSpacing:'3px', textTransform:'uppercase', color:'#F59E0B', fontWeight:700 }}>OUR PROMISE</span>
            <h2 style={{ fontFamily:'var(--font-heading)', fontSize:'2.4rem', fontWeight:700, marginTop:'0.5rem', marginBottom:'2.5rem', color:'#FFFFFF' }}>
              Why Sharadha Chips Stand Apart
            </h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'2rem' }}>
              {[
                { icon:'🥔', title:'Premium Potatoes',    desc:'Only fresh, Grade-A potatoes and raw bananas sourced from local farms daily.' },
                { icon:'🫙', title:'Fresh Oil Every Batch', desc:'Each batch fried in fresh cold-pressed coconut or sunflower oil for pure taste.' },
                { icon:'🧂', title:'Rock Salt & Spices',   desc:'Seasoned with pure rock salt and hand-ground spice blends. No MSG.' },
                { icon:'📦', title:'Sealed Fresh',         desc:'Packed in airtight, food-grade pouches to lock in crispness for months.' },
              ].map(p => (
                <div key={p.title} style={{
                  padding:'2rem 1.25rem',
                  background:'rgba(255,255,255,0.07)',
                  borderRadius:'var(--radius-lg)',
                  border:'1px solid rgba(255,255,255,0.12)',
                  backdropFilter:'blur(8px)',
                  transition:'transform 0.3s ease',
                }}
                onMouseEnter={e=>e.currentTarget.style.transform='translateY(-4px)'}
                onMouseLeave={e=>e.currentTarget.style.transform='none'}>
                  <div style={{ fontSize:'2.2rem', marginBottom:'0.75rem' }}>{p.icon}</div>
                  <h4 style={{ fontFamily:'var(--font-heading)', fontSize:'1.2rem', fontWeight:700, color:'#F59E0B', marginBottom:'0.5rem' }}>{p.title}</h4>
                  <p style={{ fontSize:'0.82rem', color:'rgba(255,255,255,0.72)', lineHeight:1.6 }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ BREADCRUMB CTA ══ */}
        <section style={{ marginBottom:'4rem' }}>
          <div className="container" style={{
            display:'flex', flexWrap:'wrap', alignItems:'center',
            justifyContent:'space-between', gap:'1.5rem',
            padding:'2rem 2.5rem',
            background:'var(--card)', borderRadius:'var(--radius-lg)',
            border:'1px solid var(--border)',
            boxShadow:'var(--shadow-sm)',
          }}>
            <div>
              <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginBottom:'0.4rem' }}>
                <Link to="/" style={{ color:'var(--text-muted)' }}>Home</Link>
                {' › '}
                <Link to="/shop" style={{ color:'var(--text-muted)' }}>Shop</Link>
                {' › '}
                <span style={{ color:'var(--secondary)', fontWeight:600 }}>Chips</span>
              </div>
              <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'1.5rem', color:'var(--secondary)', fontWeight:700 }}>
                Explore More Categories
              </h3>
            </div>
            <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
              {[['Sweets','🍮'],['Snacks','🥨'],['Pickles','🫙'],['Appalams','🫓']].map(([name, emoji]) => (
                <Link key={name} to={name === 'Appalams' ? '/appalams' : `/shop?category=${name}`} style={{
                  display:'inline-flex', alignItems:'center', gap:'0.4rem',
                  padding:'0.5rem 1rem', borderRadius:'2rem', textDecoration:'none',
                  border:'1px solid var(--border)', background:'var(--background)',
                  fontSize:'0.82rem', fontWeight:500, color:'var(--text)',
                  transition:'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background='var(--secondary)'; e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='var(--secondary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='var(--background)'; e.currentTarget.style.color='var(--text)'; e.currentTarget.style.borderColor='var(--border)'; }}
                >
                  {emoji} {name}
                </Link>
              ))}
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
