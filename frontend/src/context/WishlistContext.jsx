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
  const [isLoggedIn,    setIsLoggedIn]    = useState(!!getToken());
  const { showToast } = useNotification();

  // ── Listen for auth state changes ────────────────────────────────────────
  useEffect(() => {
    const onStorage = () => setIsLoggedIn(!!getToken());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // ── On login: merge localStorage wishlist → server ───────────────────────
  useEffect(() => {
    if (!isLoggedIn) {
      saveLocalWishlist(wishlistItems);
      return;
    }
    _mergeAndFetchWishlist();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // ── Persist to localStorage when not logged in ───────────────────────────
  useEffect(() => {
    if (!isLoggedIn) saveLocalWishlist(wishlistItems);
  }, [wishlistItems, isLoggedIn]);

  const _mergeAndFetchWishlist = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const localItems = getLocalWishlist();
      if (localItems.length > 0) {
        await fetch(`${WISHLIST_API}/merge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ productIds: localItems.map(i => i._id) }),
        });
        localStorage.removeItem('wishlistItems');
      }
      const res  = await fetch(`${WISHLIST_API}/`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setWishlistItems(data.items || []);
    } catch (err) {
      console.error('[Wishlist] Merge failed:', err);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  const addToWishlist = useCallback((product) => {
    const token = getToken();

    if (token) {
      // Already in wishlist check (optimistic)
      if (wishlistItems.some(x => x._id === product._id)) {
        showToast(`${product.title} is already in your wishlist.`, 'info');
        return;
      }
      fetch(`${WISHLIST_API}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product._id }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.items) {
            setWishlistItems(data.items);
            showToast(`${product.title} added to wishlist!`, 'success');
          } else if (data.message?.includes('already')) {
            showToast(`${product.title} is already in your wishlist.`, 'info');
          } else {
            showToast(data.message || 'Failed to add to wishlist.', 'error');
          }
        })
        .catch(() => showToast('Failed to add to wishlist.', 'error'));
    } else {
      // Guest fallback
      if (wishlistItems.some(x => x._id === product._id)) {
        showToast(`${product.title} is already in your wishlist.`, 'info');
        return;
      }
      setWishlistItems(prev => [...prev, product]);
      showToast(`${product.title} added to wishlist!`, 'success');
    }
  }, [wishlistItems, showToast]);

  // ─────────────────────────────────────────────────────────────────────────
  const removeFromWishlist = useCallback((id) => {
    const token = getToken();

    if (token) {
      fetch(`${WISHLIST_API}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.items !== undefined) {
            setWishlistItems(data.items);
            showToast('Removed from wishlist.', 'info');
          } else {
            showToast(data.message || 'Failed to remove.', 'error');
          }
        })
        .catch(() => showToast('Failed to remove from wishlist.', 'error'));
    } else {
      setWishlistItems(prev => prev.filter(x => x._id !== id));
      showToast('Removed from wishlist.', 'info');
    }
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
