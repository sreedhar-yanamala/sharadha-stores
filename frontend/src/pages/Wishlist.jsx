import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingCart, Heart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

export default function Wishlist() {
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <div style={{ margin: '1.5rem 0', display: 'flex', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        <Link to="/">Home</Link> &gt; <span>Wishlist</span>
      </div>

      <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1.5rem' }}>My Wishlist</h1>

      {wishlistItems.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }} className="card-glass">
          <Heart size={48} style={{ color: 'var(--primary)' }} />
          <h3>Your Wishlist is Empty</h3>
          <p>Explore our delicious traditional sweets and snacks and save your favorites here!</p>
          <Link to="/shop" className="btn btn-secondary">Go to Shop</Link>
        </div>
      ) : (
        <div className="product-grid">
          {wishlistItems.map((product) => {
            const hasDiscount = product.discountPrice > 0;
            const activePrice = hasDiscount ? product.discountPrice : product.price;

            return (
              <div key={product._id} className="card-glass" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%', position: 'relative' }}>
                {/* Remove button */}
                <button
                  onClick={() => removeFromWishlist(product._id)}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'var(--card)',
                    color: 'var(--primary)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)',
                    zIndex: 10
                  }}
                  title="Remove from Wishlist"
                >
                  <Trash2 size={16} />
                </button>

                {/* Product Image */}
                <Link to={`/product/${product._id}`} style={{ position: 'relative', overflow: 'hidden' }}>
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', transition: 'transform 0.5s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
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
                      borderRadius: '4px'
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
          })}
        </div>
      )}
    </div>
  );
}
