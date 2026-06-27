import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNotification } from './NotificationContext';
import { API_BASE } from '../config/api';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

// Debounce delay for Add-to-Cart button (ms)
const DEBOUNCE_MS = 350;

const CART_API  = `${API_BASE}/api/cart`;
const COUPON_API = `${API_BASE}/api/coupons/validate`;

// ── Helpers ──────────────────────────────────────────────────────────────────
function getToken() {
  try { return localStorage.getItem('sharadha_token'); } catch { return null; }
}

function getLocalCart() {
  try { return JSON.parse(localStorage.getItem('cartItems') || '[]'); } catch { return []; }
}

function saveLocalCart(items) {
  try { localStorage.setItem('cartItems', JSON.stringify(items)); } catch {}
}

export const CartProvider = ({ children }) => {
  // cartItems shape: { product, title, images, price, stock, quantity, category, shelfLife }
  const [cartItems,     setCartItems]     = useState(getLocalCart);
  const [coupon,        setCoupon]        = useState('');
  const [discountRate,  setDiscountRate]  = useState(0);
  const [discountAmt,   setDiscountAmt]   = useState(0);   // server-computed discount
  const [isLoggedIn,    setIsLoggedIn]    = useState(!!getToken());
  const [syncing,       setSyncing]       = useState(false);
  const { showToast } = useNotification();
  const lastClickRef  = useRef({});

  // ── Listen for auth state changes (login / logout) ──────────────────────
  useEffect(() => {
    const onStorage = () => {
      const loggedIn = !!getToken();
      setIsLoggedIn(loggedIn);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // ── On login: merge localStorage cart → server, then fetch server cart ──
  useEffect(() => {
    if (!isLoggedIn) {
      // On logout: persist in-memory cart to localStorage for guest use
      saveLocalCart(cartItems);
      return;
    }
    _mergeAndFetchCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // ── Persist to localStorage whenever cartItems changes (guest fallback) ──
  useEffect(() => {
    if (!isLoggedIn) saveLocalCart(cartItems);
  }, [cartItems, isLoggedIn]);

  // ─────────────────────────────────────────────────────────────────────────
  const _mergeAndFetchCart = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setSyncing(true);
    try {
      const localItems = getLocalCart();

      // If there are guest items, merge them into the server cart first
      if (localItems.length > 0) {
        await fetch(`${CART_API}/merge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            items: localItems.map(i => ({ productId: i.product, quantity: i.quantity })),
          }),
        });
        localStorage.removeItem('cartItems'); // clear guest cart after merge
      }

      // Fetch authoritative server cart
      await _fetchServerCart(token);
    } catch (err) {
      console.error('[Cart] Merge failed:', err);
    } finally {
      setSyncing(false);
    }
  }, []);

  const _fetchServerCart = async (token) => {
    const res = await fetch(`${CART_API}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    const items = (data.items || []).map(i => ({
      product:   i.product,
      title:     i.title,
      images:    i.images || [],
      price:     i.price,
      stock:     i.stock,
      quantity:  i.quantity,
      category:  i.category,
      shelfLife: i.shelfLife,
      _cartItemId: i._id,  // server-side CartItem PK for updates/deletes
    }));
    setCartItems(items);
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  addToCart — debounced; syncs to server when logged in
  // ─────────────────────────────────────────────────────────────────────────
  const addToCart = useCallback((product, qty = 1, silent = false) => {
    const now  = Date.now();
    const last = lastClickRef.current[product._id] || 0;
    if (now - last < DEBOUNCE_MS) return;
    lastClickRef.current[product._id] = now;

    const token = getToken();

    if (token) {
      // ── Server-side path ──────────────────────────────────────────────
      fetch(`${CART_API}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product._id, quantity: qty }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.message && !data.items) {
            if (!silent) showToast(data.message, 'error');
            return;
          }
          const items = (data.items || []).map(i => ({
            product: i.product, title: i.title, images: i.images || [],
            price: i.price, stock: i.stock, quantity: i.quantity,
            category: i.category, shelfLife: i.shelfLife, _cartItemId: i._id,
          }));
          setCartItems(items);
          if (!silent) showToast(`${product.title} added to cart.`, 'success');
        })
        .catch(() => {
          if (!silent) showToast('Failed to add to cart. Please try again.', 'error');
        });
    } else {
      // ── Local-storage path (guest) ────────────────────────────────────
      setCartItems(prevItems => {
        const existItem = prevItems.find(x => x.product === product._id);
        const itemPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
        if (existItem) {
          const newQty = existItem.quantity + qty;
          if (newQty > product.stock) {
            if (!silent) showToast(`Only ${product.stock} items in stock.`, 'warning');
            return prevItems;
          }
          if (!silent) showToast('Quantity updated in cart.', 'success');
          return prevItems.map(x => x.product === product._id ? { ...x, quantity: newQty } : x);
        } else {
          if (qty > product.stock) {
            if (!silent) showToast(`Only ${product.stock} items in stock.`, 'warning');
            return prevItems;
          }
          if (!silent) showToast(`${product.title} added to cart.`, 'success');
          return [...prevItems, {
            product:   product._id,
            title:     product.title,
            images:    product.images,
            price:     itemPrice,
            stock:     product.stock,
            quantity:  qty,
            category:  product.category,
            shelfLife: product.shelfLife,
          }];
        }
      });
    }
  }, [showToast]);

  // ─────────────────────────────────────────────────────────────────────────
  const addBundleToCart = useCallback((mainProduct, companionItems = []) => {
    addToCart(mainProduct, 1, true);
    companionItems.forEach(item => addToCart(item, 1, true));
    showToast('Bundle items added to your cart!', 'success');
  }, [addToCart, showToast]);

  // ─────────────────────────────────────────────────────────────────────────
  const removeFromCart = useCallback((id) => {
    const token = getToken();
    const item  = cartItems.find(x => x.product === id);

    if (token && item?._cartItemId) {
      fetch(`${CART_API}/${item._cartItemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          const items = (data.items || []).map(i => ({
            product: i.product, title: i.title, images: i.images || [],
            price: i.price, stock: i.stock, quantity: i.quantity,
            category: i.category, shelfLife: i.shelfLife, _cartItemId: i._id,
          }));
          setCartItems(items);
          showToast('Item removed from cart.', 'info');
        })
        .catch(() => showToast('Failed to remove item.', 'error'));
    } else {
      setCartItems(prev => prev.filter(x => x.product !== id));
      showToast('Item removed from cart.', 'info');
    }
  }, [cartItems, showToast]);

  // ─────────────────────────────────────────────────────────────────────────
  const updateQuantity = useCallback((id, qty) => {
    const token = getToken();
    const item  = cartItems.find(x => x.product === id);

    if (!item) return;
    if (qty > item.stock) {
      showToast(`Only ${item.stock} items in stock.`, 'warning');
      return;
    }

    if (token && item._cartItemId) {
      fetch(`${CART_API}/${item._cartItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quantity: Math.max(1, qty) }),
      })
        .then(res => res.json())
        .then(data => {
          const items = (data.items || []).map(i => ({
            product: i.product, title: i.title, images: i.images || [],
            price: i.price, stock: i.stock, quantity: i.quantity,
            category: i.category, shelfLife: i.shelfLife, _cartItemId: i._id,
          }));
          setCartItems(items);
        })
        .catch(console.error);
    } else {
      setCartItems(prev => prev.map(x =>
        x.product === id ? { ...x, quantity: Math.max(1, qty) } : x
      ));
    }
  }, [cartItems, showToast]);

  // ─────────────────────────────────────────────────────────────────────────
  const clearCart = useCallback(() => {
    const token = getToken();
    setCartItems([]);
    setCoupon('');
    setDiscountRate(0);
    setDiscountAmt(0);
    if (token) {
      fetch(`${CART_API}/clear`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(console.error);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  //  applyCoupon — validates via API (falls back to hardcoded if offline)
  // ─────────────────────────────────────────────────────────────────────────
  const applyCoupon = useCallback(async (code) => {
    const cleanCode = code.toUpperCase().trim();
    try {
      const res  = await fetch(COUPON_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode, orderTotal: subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setCoupon(cleanCode);
        if (data.discountType === 'percentage') {
          setDiscountRate(data.discountValue / 100);
          setDiscountAmt(0);
        } else {
          setDiscountRate(0);
          setDiscountAmt(data.discountAmount);
        }
        showToast(data.message, 'success');
        return true;
      } else {
        showToast(data.message || 'Invalid coupon code.', 'error');
        return false;
      }
    } catch {
      showToast('Could not validate coupon. Please try again.', 'error');
      return false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showToast]);

  const removeCoupon = useCallback(() => {
    setCoupon('');
    setDiscountRate(0);
    setDiscountAmt(0);
    showToast('Coupon removed.', 'info');
  }, [showToast]);

  // ─────────────────────────────────────────────────────────────────────────
  //  Calculations
  // ─────────────────────────────────────────────────────────────────────────
  const itemsCount     = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal       = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Support both percentage-based and fixed discounts
  const discountAmount = discountAmt > 0 ? discountAmt : Math.round(subtotal * discountRate * 100) / 100;
  const taxRate        = 0.05;
  const tax            = Math.round((subtotal - discountAmount) * taxRate * 100) / 100;
  const shippingCost   = subtotal > 500 || subtotal === 0 ? 0 : 40;
  const total          = Math.round((subtotal - discountAmount + tax + shippingCost) * 100) / 100;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        coupon,
        discountRate,
        discountAmount,
        shippingCost,
        tax,
        subtotal,
        total,
        itemsCount,
        syncing,
        addToCart,
        addBundleToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
