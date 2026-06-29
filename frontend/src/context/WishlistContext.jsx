import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNotification } from './NotificationContext';
import { API_BASE } from '../config/api';

const WishlistContext = createContext();
export const useWishlist = () => useContext(WishlistContext);

const WISHLIST_API = `${API_BASE}/api/wishlist`;

// ── Helpers ───────────────────────────────────────────────────────────────
function getToken() {
  try { return localStorage.getItem('sharadha_token'); } catch { return null; }
}
function getLocalWishlist() {
  try { return JSON.parse(localStorage.getItem('wishlistItems') || '[]'); } catch { return []; }
}
function saveLocalWishlist(items) {
  try { localStorage.setItem('wishlistItems', JSON.stringify(items)); } catch {}
}

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState(getLocalWishlist);
  const { showToast } = useNotification();

  // ── Persist to localStorage ALWAYS ───────────────────────────────────────
  useEffect(() => {
    saveLocalWishlist(wishlistItems);
  }, [wishlistItems]);

  // ─────────────────────────────────────────────────────────────────────────
  const addToWishlist = useCallback((product) => {
    if (wishlistItems.some(x => (x._id || x.id) === (product._id || product.id))) {
      showToast(`${product.title} is already in your wishlist.`, 'info');
      return;
    }
    setWishlistItems(prev => [...prev, product]);
    showToast(`${product.title} added to wishlist!`, 'success');
  }, [wishlistItems, showToast]);

  // ─────────────────────────────────────────────────────────────────────────
  const removeFromWishlist = useCallback((id) => {
    setWishlistItems(prev => prev.filter(x => (x._id || x.id) !== id));
    showToast('Removed from wishlist.', 'info');
  }, [showToast]);

  // ─────────────────────────────────────────────────────────────────────────
  const isInWishlist = useCallback((id) => {
    return wishlistItems.some(x => (x._id || x.id) === id);
  }, [wishlistItems]);

  return (
    <WishlistContext.Provider value={{ wishlistItems, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};
