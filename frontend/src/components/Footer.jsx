import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--card)',
      borderTop: '1px solid var(--border)',
      padding: '4rem 0 2rem 0',
      color: 'var(--text)',
      transition: 'var(--transition)'
    }}>
      <div className="container" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '2.5rem',
        marginBottom: '3rem'
      }}>
        {/* About Section */}
        <div>
          <h3 style={{ color: 'var(--primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.3rem' }}>
            <span>🌱</span> Sharadha Stores
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.7' }}>
            Bringing authentic, pure, and traditional homemade sweets, snacks, pickles, and freshly ground spice powders straight from grandma's kitchen to your doorstep.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="#" style={{ color: 'var(--text-muted)' }} className="social-icon" aria-label="Facebook">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="#" style={{ color: 'var(--text-muted)' }} className="social-icon" aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
            <a href="#" style={{ color: 'var(--text-muted)' }} className="social-icon" aria-label="Twitter">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: 600 }}>Quick Links</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <li><Link to="/shop" style={{ color: 'var(--text-muted)' }}>Shop Products</Link></li>
            <li><Link to="/subscriptions" style={{ color: 'var(--text-muted)' }}>Subscription Plans</Link></li>
            <li><Link to="/support" style={{ color: 'var(--text-muted)' }}>FAQs & Help Center</Link></li>
            <li><Link to="/wishlist" style={{ color: 'var(--text-muted)' }}>My Wishlist</Link></li>
          </ul>
        </div>

        {/* Category Links */}
        <div>
          <h4 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: 600 }}>Categories</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <li><Link to="/chips" style={{ color: 'var(--text-muted)' }}>🥔 Chips</Link></li>
            <li><Link to="/appalams" style={{ color: 'var(--text-muted)' }}>🫓 Appalams</Link></li>
            <li><Link to="/shop?category=Sweets" style={{ color: 'var(--text-muted)' }}>🍬 Sweets</Link></li>
            <li><Link to="/shop?category=Snacks" style={{ color: 'var(--text-muted)' }}>🍿 Snacks</Link></li>
            <li><Link to="/shop?category=Pickles" style={{ color: 'var(--text-muted)' }}>🥒 Pickles</Link></li>
            <li><Link to="/shop?category=Spice Powders" style={{ color: 'var(--text-muted)' }}>🌶️ Spice Powders</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: 600 }}>Contact Us</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <MapPin size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span>12 Main Kitchen Lane, Mylapore, Chennai - 600004</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Phone size={18} style={{ color: 'var(--primary)' }} />
              <span>+91 98765 43210</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Mail size={18} style={{ color: 'var(--primary)' }} />
              <span>support@sharadhastores.com</span>
            </li>
          </ul>
        </div>

      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingGap: '1.5rem', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <div className="container">
          &copy; {new Date().getFullYear()} Sharadha Stores. All rights reserved. Handcrafted with love.
        </div>
      </div>
    </footer>
  );
}
