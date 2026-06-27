import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingCart, Heart, ShieldCheck, Sparkles, Award, Truck, Star, Check, Mail, Info } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getProducts } from '../data/products';

export default function Home() {
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();
  const navigate = useNavigate();

  // Carousel slider state
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      title: 'Experience the Future of Innovation',
      subtitle: 'Fusing ancestral culinary wisdom with state-of-the-art kitchen science for authentic sweets.',
      image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=90&w=1600&auto=format&fit=crop',
      link: '/shop?category=Sweets'
    },
    {
      title: 'Solutions Designed for Success',
      subtitle: 'Hand-crafted snacks engineered for premium taste, freshness, and maximum crunch.',
      image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?q=90&w=1600&auto=format&fit=crop',
      link: '/shop?category=Snacks'
    },
    {
      title: 'Traditional Taste, Redefined',
      subtitle: 'Premium cured pickles packed in modern, protective, and convenient glass jars.',
      image: 'https://www.shutterstock.com/image-photo/assortment-autumn-canning-checkered-chutney-260nw-2702060671.jpg',
      link: '/shop?category=Pickles'
    }
  ];

  // Fetch products
  const [bestSellers, setBestSellers] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);

  const trendingProducts = [
    {
      _id: '2',
      title: 'Homemade Glazed Donuts',
      category: 'Sweets',
      price: 200,
      discountPrice: 0,
      rating: 4.5,
      numReviews: 8,
      stock: 40,
      images: ['https://images.unsplash.com/photo-1551024601-bec78aea704b?q=90&w=800&auto=format&fit=crop']
    },
    {
      _id: '3',
      title: 'Handmade Crispy Potato Samosas',
      category: 'Snacks',
      price: 120,
      discountPrice: 110,
      rating: 4.9,
      numReviews: 24,
      stock: 80,
      images: ['https://images.unsplash.com/photo-1626132647523-66f5bf380027?q=90&w=800&auto=format&fit=crop']
    },
    {
      _id: '6',
      title: 'Aged Pickled Mixed Vegetables',
      category: 'Pickles',
      price: 150,
      discountPrice: 0,
      rating: 4.4,
      numReviews: 9,
      stock: 35,
      images: ['https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=90&w=800&auto=format&fit=crop']
    },
    {
      _id: '7',
      title: "Grandma's Sambar Powder",
      category: 'Spice Powders',
      price: 140,
      discountPrice: 125,
      rating: 4.8,
      numReviews: 18,
      stock: 70,
      images: ['https://images.unsplash.com/photo-1532336414038-cf19250c5757?q=90&w=800&auto=format&fit=crop']
    }
  ];

  useEffect(() => {
    // Slider auto-rotate
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const bsData = getProducts({ isBestSeller: true, pageSize: 6 });
        const cbData = getProducts({ isCombo: true, pageSize: 4 });

        setBestSellers(bsData.products || []);
        setCombos(cbData.products || []);
      } catch (error) {
        console.error('Error fetching home products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const handleWishlistToggle = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInWishlist(product._id)) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product);
    }
  };

  const renderProductCard = (product) => {
    const isAdded = isInWishlist(product._id);
    const hasDiscount = product.discountPrice > 0;
    const activePrice = hasDiscount ? product.discountPrice : product.price;

    return (
      <div key={product._id} className="card-glass" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%', position: 'relative' }}>
        {/* Wishlist toggle */}
        <button
          onClick={(e) => handleWishlistToggle(e, product)}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'var(--card)',
            color: isAdded ? 'var(--primary)' : 'var(--text-muted)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
            zIndex: 10
          }}
        >
          <Heart size={16} fill={isAdded ? 'var(--primary)' : 'none'} />
        </button>

        {/* Product Image */}
        <Link to={`/product/${product._id}`} className="product-img-wrap" style={{ height: '220px', display: 'block', textDecoration: 'none' }}>
          <img
            src={product.images[0]}
            alt={product.title}
            style={{ width: '100%', height: '100%' }}
          />
          {hasDiscount && (
            <span style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              background: 'var(--primary)',
              color: '#FFFFFF',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              zIndex: 2,
            }}>
              SAVE {Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
            </span>
          )}
        </Link>

        {/* Body details */}
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>
            {product.category}
          </span>
          <Link to={`/product/${product._id}`}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem', height: '2.4rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {product.title}
            </h4>
          </Link>

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div className="stars-container" style={{ fontSize: '0.85rem' }}>
              {'★'.repeat(Math.round(product.rating))}
              {'☆'.repeat(5 - Math.round(product.rating))}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({product.numReviews})</span>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {hasDiscount ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>Rs. {product.discountPrice}</span>
                  <span style={{ fontSize: '0.85rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>Rs. {product.price}</span>
                </div>
              ) : (
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>Rs. {product.price}</span>
              )}
            </div>

            <button
              onClick={() => addToCart(product, 1)}
              disabled={product.stock === 0}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.4rem 0.8rem', borderRadius: '2rem' }}
            >
              <ShoppingCart size={14} /> Add
            </button>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="fade-in" style={{ backgroundColor: 'var(--background)', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
         {/* ══ HERO SECTION — Logo Centrepiece ══ */}
      <section style={{
        position: 'relative',
        minHeight: '640px',
        background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 45%, #1B5E20 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: '#FFFFFF',
        padding: '5rem 1.5rem 4rem',
        marginBottom: '4rem',
        overflow: 'hidden',
      }}>

        {/* Background decorative rings */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `
            radial-gradient(circle at 50% 50%, rgba(212,175,55,0.10) 0%, transparent 65%),
            radial-gradient(circle at 20% 80%, rgba(27,94,32,0.5) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(27,94,32,0.5) 0%, transparent 50%)
          `,
        }} />

        {/* Animated floating orbs */}
        {[
          { size: 320, top: '-80px', left: '-80px', opacity: 0.05 },
          { size: 200, bottom: '-60px', right: '-40px', opacity: 0.06 },
          { size: 120, top: '40%', right: '8%', opacity: 0.08 },
        ].map((orb, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: orb.size, height: orb.size,
            borderRadius: '50%',
            background: '#D4AF37',
            filter: 'blur(60px)',
            opacity: orb.opacity,
            top: orb.top, left: orb.left,
            right: orb.right, bottom: orb.bottom,
            pointerEvents: 'none',
          }} />
        ))}

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '860px' }} className="slide-up">

          {/* ── LOGO CENTREPIECE ── */}
          <div style={{
            display: 'flex', justifyContent: 'center',
            alignItems: 'center', marginBottom: '2.5rem',
            position: 'relative',
          }}>

            {/* Outer pulsing halo ring */}
            <div style={{
              position: 'absolute',
              width: '230px', height: '230px',
              borderRadius: '50%',
              border: '2px solid rgba(212,175,55,0.40)',
              animation: 'heroPulse 3s ease-in-out infinite',
            }} />
            {/* Middle ring */}
            <div style={{
              position: 'absolute',
              width: '200px', height: '200px',
              borderRadius: '50%',
              border: '1.5px solid rgba(212,175,55,0.60)',
              animation: 'heroPulse 3s ease-in-out infinite 0.6s',
            }} />

            {/* Logo container with glowing border */}
            <div style={{
              width: '168px', height: '168px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #F1F8E9 100%)',
              border: '4px solid #D4AF37',
              boxShadow: `
                0 0 0 8px rgba(212,175,55,0.22),
                0 0 40px rgba(212,175,55,0.50),
                0 20px 60px rgba(0,0,0,0.4)
              `,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
              flexShrink: 0,
            }}>
              <img
                src="/images/logo.png"
                alt="Sharadha Stores"
                style={{
                  width: '155px', height: '155px',
                  objectFit: 'contain',
                  borderRadius: '50%',
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextSibling.style.display = 'flex';
                }}
              />
              {/* Text fallback */}
              <div style={{
                display: 'none',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                width: '100%', height: '100%',
                fontFamily: 'var(--font-heading)',
                textAlign: 'center',
              }}>
                <span style={{ fontSize: '0.65rem', letterSpacing: '2px', color: '#2E7D32', fontWeight: 700 }}>🌿 SHARADHA</span>
                <span style={{ fontSize: '1.2rem', color: '#1B5E20', fontWeight: 700, lineHeight: 1 }}>STORES</span>
                <span style={{ fontSize: '0.5rem', letterSpacing: '1.5px', color: '#D4AF37', marginTop: '2px' }}>HOMEMADE · AUTHENTIC</span>
              </div>
            </div>
          </div>

          {/* Brand tagline */}
          <span style={{
            fontSize: '0.8rem', letterSpacing: '4px',
            textTransform: 'uppercase',
            color: '#D4AF37', fontWeight: 700,
            display: 'block', marginBottom: '1rem',
          }}>
            SHARADHA STORES · EST. TRADITION
          </span>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2.4rem, 5vw, 4.2rem)',
            fontWeight: 700,
            marginBottom: '1.25rem',
            lineHeight: 1.1,
            textShadow: '0 2px 16px rgba(0,0,0,0.25)',
            color: '#FFFFFF',
          }}>
            Taste the Tradition of Home
          </h1>

          <p style={{
            fontSize: '1.1rem', lineHeight: 1.75,
            marginBottom: '2.25rem', opacity: 0.88,
            fontWeight: 300, maxWidth: '600px', margin: '0 auto 2.25rem',
          }}>
            Handcrafted sweets, snacks, pickles &amp; spice blends — made from authentic family recipes passed down through generations.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}>
            <Link to="/shop" style={{
              background: 'linear-gradient(135deg, #D4AF37, #B8960C)',
              color: '#1F2937', fontWeight: 700,
              padding: '0.95rem 2.25rem',
              borderRadius: '2rem',
              border: '2px solid #D4AF37',
              fontSize: '1rem',
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: '0 8px 28px rgba(212,175,55,0.50)',
              transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
              textDecoration: 'none',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(212,175,55,0.65)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 8px 28px rgba(212,175,55,0.50)'; }}>
              Shop Collection <ArrowRight size={18} />
            </Link>
            <a href="#our-story" style={{
              color: '#FFFFFF',
              border: '2px solid rgba(255,255,255,0.50)',
              fontWeight: 500,
              padding: '0.95rem 2.25rem',
              borderRadius: '2rem',
              fontSize: '1rem',
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
              textDecoration: 'none',
              background: 'transparent',
            }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.15)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.8)'; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='rgba(255,255,255,0.50)'; e.currentTarget.style.transform='none'; }}>
              Our Story
            </a>
          </div>

          {/* Trust badges */}
          <div style={{
            display: 'flex', justifyContent: 'center',
            gap: '1.5rem', flexWrap: 'wrap',
            fontSize: '0.85rem', opacity: 0.92,
            borderTop: '1px solid rgba(212,175,55,0.20)',
            paddingTop: '1.5rem',
          }}>
            {['🌿 Homemade Craftsmanship', '🚫 No Preservatives', '✨ Freshly Prepared', '🚚 Pan India Delivery'].map((badge) => (
              <span key={badge} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Inline animation keyframes */}
        <style>{`
          @keyframes heroPulse {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.07); opacity: 0.2; }
          }
        `}</style>
      </section>


      {/* Customer Favorites / Bestsellers */}
      <section style={{ marginBottom: '5rem', padding: '4rem 0', background: 'rgba(46,125,50,0.04)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{ fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 700 }}>POPULAR COLLECTION</span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.8rem', fontWeight: 500, marginTop: '0.5rem', color: 'var(--primary)' }}>Customer Favorites</h2>
            <div style={{ width: '60px', height: '3px', background: 'linear-gradient(90deg, var(--accent-dark), var(--accent), var(--accent-light))', margin: '1rem auto', borderRadius: '2px' }}></div>
          </div>

          {loading ? (
            <div className="product-grid">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="card-glass" style={{ padding: '1.5rem', height: '340px', background: 'var(--card)' }}>
                  <div className="skeleton skeleton-image" style={{ height: '180px', marginBottom: '1rem' }}></div>
                  <div className="skeleton skeleton-title"></div>
                  <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
                </div>
              ))}
            </div>
          ) : bestSellers.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No best-sellers available.</div>
          ) : (
            <div className="product-grid">
              {bestSellers.map(renderProductCard)}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Sharadha Stores */}
      <section style={{ marginBottom: '5rem' }}>
        <div className="container" style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <span style={{ fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 700 }}>OUR VALUES</span>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.8rem', fontWeight: 500, marginTop: '0.5rem', color: 'var(--primary)' }}>Pure Ingredients, Honest Flavor</h2>
          <div style={{ width: '60px', height: '3px', background: 'linear-gradient(90deg, var(--accent-dark), var(--accent), var(--accent-light))', margin: '1rem auto', borderRadius: '2px' }}></div>
        </div>

        <div className="container" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '2rem'
        }}>
          {[
            { title: 'Homemade Recipes', desc: 'Our recipes come directly from traditional family kitchens, slow-cooked in small batches.', icon: <ShieldCheck size={36} /> },
            { title: 'Fresh Ingredients', desc: 'Only premium quality cold-pressed oils, handpicked spices, and natural sea salt are used.', icon: <Sparkles size={36} /> },
            { title: 'No Artificial Preservatives', desc: 'Pure homemade taste without compromise. Cured naturally under solar heat.', icon: <Award size={36} /> },
            { title: 'Delivered Fresh', desc: 'Packed carefully in robust, food-grade materials and delivered fresh directly to your doorstep.', icon: <Truck size={36} /> }
          ].map((val, i) => (
            <div key={i} className="card-glass" style={{
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              transition: 'transform 0.4s'
            }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-6px)'}
               onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
              <div style={{ color: 'var(--primary)', marginBottom: '1.25rem', display: 'flex', justifyContent: 'center' }}>{val.icon}</div>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.75rem' }}>{val.title}</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>{val.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Our Story / Heritage Section */}
      <section id="our-story" style={{ marginBottom: '5rem' }}>
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', gap: '4rem', alignItems: 'center' }}>
          <div style={{ flex: '1 1 450px' }}>
            <img
              src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=90&w=800&auto=format&fit=crop"
              alt="Sharadha Stores Kitchen Heritage"
              style={{ width: '100%', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', objectFit: 'cover', aspectRatio: '16/10' }}
            />
          </div>
          <div style={{ flex: '1 1 450px' }}>
            <span style={{ fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 700 }}>OUR HERITAGE</span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', fontWeight: 500, marginTop: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>A Legacy of Homemade Excellence</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.8', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              For generations, SHARADHA STORES has preserved the authentic flavors of Indian homes. Every product is crafted with care, tradition, and premium ingredients to bring homemade goodness to your table.
            </p>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.8', fontSize: '0.95rem', marginBottom: '2rem' }}>
              Our milling and slow-cooking practices protect raw nutrient levels and capture genuine spice oils. We never compromise on salt, spices, or cold-pressed sesame extracts.
            </p>
            <Link to="/shop" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
              color: '#FFFFFF',
              fontWeight: 600,
              padding: '0.85rem 2rem',
              borderRadius: '2rem',
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(46,125,50,0.38)',
              transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(46,125,50,0.55)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 4px 16px rgba(46,125,50,0.38)'; }}>
              Read Our Story
            </Link>
          </div>
        </div>
      </section>

      {/* Premium Product Spotlight Showcase (Dark Background) */}
      <section style={{
        marginBottom: '5rem',
        padding: '5rem 0',
        background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 40%, #388E3C 100%)',
        color: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-150px',
          right: '-150px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(212,175,55,0.10)',
          filter: 'blur(80px)'
        }}></div>

        <div className="container" style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <span style={{ fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#D4AF37', fontWeight: 700 }}>SPOTLIGHT COLLECTIONS</span>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', fontWeight: 500, marginTop: '0.5rem', color: '#FFFDF8' }}>Crafted Food Highlights</h2>
          <div style={{ width: '60px', height: '3px', background: 'linear-gradient(90deg, #B8960C, #D4AF37, #F0D060)', margin: '1rem auto', borderRadius: '2px' }}></div>
        </div>

        <div className="container" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2.5rem'
        }}>
          {[
            { title: 'Aged Homemade Pickles', image: 'images/mango-pickle-public.jpg', tag: 'Aged in Jars', desc: 'Naturally preserved using generation-old curing techniques and hand-milled chili masalas.', link: '/shop?category=Pickles' },
            { title: 'Pure Ghee Royal Sweets', image: 'images/mysore-pak.png', tag: 'Melts in Mouth', desc: 'Crafted with premium chickpea flour and high-clarity country ghee cooked to delicate caramel stages.', link: '/shop?category=Sweets' },
            { title: 'Crispy Homemade Chips', image: 'images/murukku.png', tag: '🥔 Golden Crunch', desc: 'Hand-fried potato, banana & jackfruit chips using traditional family recipes — no preservatives, delivered crispy.', link: '/chips' }
          ].map((spot, idx) => (
            <div key={idx} style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(212,175,55,0.25)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              backdropFilter: 'blur(8px)',
              transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-6px)'; e.currentTarget.style.boxShadow='0 28px 56px rgba(0,0,0,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 20px 40px rgba(0,0,0,0.25)'; }}>
              <div style={{ height: '240px', overflow: 'hidden', position: 'relative' }}>
                <img src={spot.image} alt={spot.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} />
                <span style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  background: 'linear-gradient(135deg, #D4AF37, #B8960C)',
                  color: '#1F2937',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '4px',
                  letterSpacing: '1px'
                }}>{spot.tag}</span>
              </div>
              <div style={{ padding: '2rem', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', color: '#FFFFFF' }}>{spot.title}</h4>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', lineHeight: '1.6', marginBottom: '1.5rem' }}>{spot.desc}</p>
                <Link to={spot.link} style={{ marginTop: 'auto', color: '#D4AF37', fontSize: '0.9rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  Explore Collection <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quick Category Access ── */}
      <section style={{ marginBottom: '5rem' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span style={{ fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 700 }}>SHOP BY CATEGORY</span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.4rem', fontWeight: 500, marginTop: '0.5rem', color: 'var(--primary)' }}>Find Your Favorites</h2>
            <div style={{ width: '60px', height: '3px', background: 'linear-gradient(90deg, var(--accent-dark), var(--accent), var(--accent-light))', margin: '1rem auto', borderRadius: '2px' }}></div>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1.25rem',
          }}>
            {[
              { label: '🥔 Chips', link: '/chips', bg: 'linear-gradient(135deg,#2E7D32,#4CAF50)', desc: 'Homemade crispy chips' },
              { label: '🫓 Appalams', link: '/appalams', bg: 'linear-gradient(135deg,#1B5E20,#388E3C)', desc: 'Sun-dried papads' },
              { label: '🍬 Sweets', link: '/shop?category=Sweets', bg: 'linear-gradient(135deg,#B8960C,#D4AF37)', desc: 'Pure ghee sweets' },
              { label: '🍿 Snacks', link: '/shop?category=Snacks', bg: 'linear-gradient(135deg,#256427,#2E7D32)', desc: 'Crispy savories' },
              { label: '🥒 Pickles', link: '/shop?category=Pickles', bg: 'linear-gradient(135deg,#4CAF50,#81C784)', desc: 'Traditional pickles' },
              { label: '🌶️ Spices', link: '/shop?category=Spice Powders', bg: 'linear-gradient(135deg,#D4AF37,#F0D060)', desc: 'Ground spice blends' },
            ].map((cat) => (
              <Link
                key={cat.label}
                to={cat.link}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '1.75rem 1rem', borderRadius: 'var(--radius-lg)',
                  background: cat.bg, color: cat.label.includes('Sweets') || cat.label.includes('Spices') ? '#1F2937' : '#FFFFFF',
                  textDecoration: 'none',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                  transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease',
                  gap: '0.4rem',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-5px)'; e.currentTarget.style.boxShadow='0 14px 32px rgba(0,0,0,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,0.15)'; }}
              >
                <span style={{ fontSize: '1.6rem' }}>{cat.label.split(' ')[0]}</span>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '0.25rem' }}>{cat.label.split(' ').slice(1).join(' ')}</span>
                <span style={{ fontSize: '0.72rem', opacity: 0.82 }}>{cat.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section style={{ marginBottom: '5rem' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <span style={{ fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 700 }}>TESTIMONIALS</span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.8rem', fontWeight: 500, marginTop: '0.5rem', color: 'var(--primary)' }}>What Our Customers Say</h2>
            <div style={{ width: '60px', height: '3px', background: 'linear-gradient(90deg, var(--accent-dark), var(--accent), var(--accent-light))', margin: '1rem auto', borderRadius: '2px' }}></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {[
              { name: 'Rajesh Subramanian', city: 'Chennai', review: 'The Ghee Mysore Pak actually melts in the mouth! Excellent ghee and it felt very fresh. The taste reminds me of my grandmother\'s cooking.', rating: 5 },
              { name: 'Kavitha Rao', city: 'Bangalore', review: 'Best homemade pickles I\'ve ever ordered online. Perfectly balanced, tanginess and spices are spot on. Packaging was leakproof.', rating: 5 },
              { name: 'Vijay Anand', city: 'Hyderabad', review: 'Premium quality and excellent packaging. The samosas and sev remain fresh for weeks. Absolutely authentic flavor.', rating: 5 }
            ].map((rev, i) => (
              <div key={i} className="card-glass" style={{
                padding: '2.5rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                background: 'var(--card)'
              }}>
                <div style={{ display: 'flex', gap: '2px', color: '#D4AF37', marginBottom: '1.25rem' }}>
                  {[...Array(rev.rating)].map((_, idx) => (
                    <Star key={idx} size={18} fill="#D4AF37" stroke="none" />
                  ))}
                </div>
                <p style={{
                  fontStyle: 'italic',
                  fontSize: '1rem',
                  color: 'var(--text)',
                  flexGrow: 1,
                  marginBottom: '1.5rem',
                  lineHeight: '1.7',
                  fontWeight: 300
                }}>
                  "{rev.review}"
                </p>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary)' }}>{rev.name}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{rev.city}</span>
                  </div>
                  <span style={{ fontSize: '1.5rem', color: 'rgba(212,175,55,0.55)', fontFamily: 'serif' }}>”</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


    </div>
  );
}
