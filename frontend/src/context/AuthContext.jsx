import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNotification } from './NotificationContext';
import { API_BASE } from '../config/api';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

/* ── Configuration ──────────────────────────────────────────────── */
const API_URL          = `${API_BASE}/api/auth`;
const HEALTH_URL       = `${API_BASE}/api/health`;
const REQUEST_TIMEOUT  = 10000; // 10 s
const HEARTBEAT_MS     = 60_000; // 60 s — keep-alive interval
const TOKEN_WARN_HOURS = 24;    // warn user N hours before JWT expiry

/* ── Local-storage keys ─────────────────────────────────────── */
const LS_TOKEN   = 'sharadha_token';
const LS_USER    = 'sharadha_user';
const LS_USERS   = 'sharadha_local_users';  // for offline-only accounts

/* ── Helpers ────────────────────────────────────────────────── */
function isOffline() {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

/** Decode a JWT payload without verifying the signature (client-side only) */
function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

/** Returns the number of seconds until JWT expiry (negative = already expired) */
function tokenSecondsLeft(token) {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return -1;
  return payload.exp - Math.floor(Date.now() / 1000);
}

/** Fetch with a hard timeout via AbortController */
async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT) {
  const ctrl = new AbortController();
  const id   = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

function getFriendlyError(status, serverMsg = '') {
  const msg = serverMsg.toLowerCase();
  if (status === 401 || msg.includes('invalid') || msg.includes('password') || msg.includes('incorrect'))
    return 'Invalid email or password. Please try again.';
  if (status === 404 || msg.includes('not found') || msg.includes('no user'))
    return 'No account found with this email address.';
  if (msg.includes('already exists') || msg.includes('duplicate') || status === 409)
    return 'An account with this email already exists. Try signing in instead.';
  if (status >= 500)
    return 'Server error. Please try again in a moment.';
  return serverMsg || 'Something went wrong. Please try again.';
}

/* ── Simple local-user store (works without backend) ─────────── */
function getLocalUsers() {
  try { return JSON.parse(localStorage.getItem(LS_USERS) || '[]'); } catch { return []; }
}
function saveLocalUsers(users) {
  localStorage.setItem(LS_USERS, JSON.stringify(users));
}
/** Very basic password hashing — not cryptographic, just obfuscation for local demo */
function hashLocal(pw) {
  let hash = 0;
  for (let i = 0; i < pw.length; i++) {
    hash = ((hash << 5) - hash) + pw.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

/* ══════════════════════════════════════════════════════════════
   PROVIDER
   ══════════════════════════════════════════════════════════════ */
export const AuthProvider = ({ children }) => {
  const [user, setUser]               = useState(null);
  const [token, setToken]             = useState('');
  const [appReady, setAppReady]       = useState(false);
  const [backendUp, setBackendUp]     = useState(null); // null = unknown, true, false
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [isOnline, setIsOnline]       = useState(false); // user's online status in DB

  const heartbeatRef = useRef(null); // interval handle

  const { showToast } = useNotification();

  /* ── Internal: persist session ── defined first so callbacks can reference it */
  const setSession = useCallback((userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem(LS_TOKEN, authToken);
    localStorage.setItem(LS_USER, JSON.stringify(userData));
    // Sync isOnline from server response if present
    if (userData.isOnline !== undefined) setIsOnline(userData.isOnline);
  }, []);

  /* ── Heartbeat: POST /heartbeat every 60 s while authenticated ── */
  const startHeartbeat = useCallback((authToken) => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    heartbeatRef.current = setInterval(async () => {
      if (!authToken || authToken === 'local' || isOffline()) return;
      try {
        const res = await fetchWithTimeout(`${API_URL}/heartbeat`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        }, 5000);
        if (res.ok) {
          const data = await res.json();
          setIsOnline(data.isOnline ?? true);
        } else if (res.status === 401) {
          // Token rejected — clear session
          clearInterval(heartbeatRef.current);
          localStorage.removeItem(LS_TOKEN);
          localStorage.removeItem(LS_USER);
          setUser(null);
          setToken('');
          setIsOnline(false);
          showToast('Your session has expired. Please sign in again.', 'warning');
        }
      } catch {
        // Network hiccup — silently skip this beat
      }
    }, HEARTBEAT_MS);
  }, [showToast]);

  const stopHeartbeat = useCallback(() => {
    clearInterval(heartbeatRef.current);
    heartbeatRef.current = null;
  }, []);

  /* ── Token expiry guard ── warns user before JWT expires ── */
  const checkTokenExpiry = useCallback((authToken) => {
    if (!authToken || authToken === 'local') return;
    const secondsLeft = tokenSecondsLeft(authToken);
    if (secondsLeft <= 0) {
      // Already expired — clear immediately
      localStorage.removeItem(LS_TOKEN);
      localStorage.removeItem(LS_USER);
      setUser(null);
      setToken('');
      setIsOnline(false);
      showToast('Your session has expired. Please sign in again.', 'warning');
    } else if (secondsLeft < TOKEN_WARN_HOURS * 3600) {
      const hoursLeft = Math.floor(secondsLeft / 3600);
      showToast(
        `Your session expires in ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}. Save your work and re-login soon.`,
        'warning',
        8000
      );
    }
  }, [showToast]);

  /* ── Check backend health ── runs immediately, every 15 s, and on demand */
  useEffect(() => {
    let cancelled = false;
    // Track whether we already attempted auto-migration this session
    let migrationAttempted = false;

    const checkHealth = async () => {
      try {
        const res = await fetchWithTimeout(HEALTH_URL, {}, 5000);
        if (!cancelled) {
          const isUp = res.ok;
          setBackendUp(isUp);

          if (isUp) {
            console.log('[Auth] ✅ Backend reachable at', HEALTH_URL);
            const storedToken = localStorage.getItem(LS_TOKEN);

            if (storedToken && storedToken !== 'local') {
              // ── Real JWT: validate and refresh user data ──
              setIsSessionLoading(true);
              fetchWithTimeout(`${API_URL}/profile`, {
                headers: { Authorization: `Bearer ${storedToken}` },
              }, 5000)
                .then(r => r.ok ? r.json() : Promise.reject(r.status))
                .then(freshUser => {
                  if (!cancelled) {
                    setUser(freshUser);
                    setToken(storedToken);
                    setIsOnline(freshUser.isOnline ?? true);
                    localStorage.setItem(LS_USER, JSON.stringify(freshUser));
                    console.log('[Auth] 🔄 Session validated for:', freshUser.name);
                  }
                })
                .catch(status => {
                  if (!cancelled && status === 401) {
                    localStorage.removeItem(LS_TOKEN);
                    localStorage.removeItem(LS_USER);
                    setUser(null);
                    setToken('');
                    setIsOnline(false);
                    console.warn('[Auth] Stored JWT rejected (401) — cleared session');
                  }
                })
                .finally(() => { if (!cancelled) setIsSessionLoading(false); });

            } else if (storedToken === 'local' && !migrationAttempted) {
              // ── Local-only session: try silent account migration ──
              migrationAttempted = true;
              const storedUser = localStorage.getItem(LS_USER);
              if (!storedUser) return;
              let localUser;
              try { localUser = JSON.parse(storedUser); } catch { return; }
              if (!localUser?.email) return;

              console.log('[Auth] 🔄 Backend online — attempting silent migration for:', localUser.email);

              // Try to register the local account on the backend
              fetchWithTimeout(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // We don't store the real password, so send a placeholder.
                // The backend will reject if they already have an account,
                // in which case we clear the stale session so they must sign in.
                body: JSON.stringify({
                  name: localUser.name,
                  email: localUser.email,
                  password: '__offline_placeholder__',
                }),
              }, 6000)
                .then(async r => {
                  const data = await r.json();
                  if (r.ok && data.token) {
                    // Migration succeeded — upgrade to real JWT session!
                    if (!cancelled) {
                      setSession(data, data.token);
                      setIsOnline(true);
                      console.log('[Auth] ✅ Offline account migrated online:', data.name);
                    }
                  } else {
                    // Account already exists on server or other error.
                    // Clear the stale local session so the user is treated as a
                    // guest — protected pages (like Checkout) will redirect to login.
                    if (!cancelled) {
                      console.log('[Auth] Account exists on server — clearing local session and asking to sign in');
                      localStorage.removeItem(LS_TOKEN);
                      localStorage.removeItem(LS_USER);
                      setUser(null);
                      setToken('');
                      setIsOnline(false);
                      setTimeout(() => {
                        if (!cancelled) {
                          showToast(
                            '🌐 Server is online! Please sign in with your password to continue.',
                            'info',
                            6000
                          );
                        }
                      }, 500);
                    }
                  }
                })
                .catch(err => {
                  console.warn('[Auth] Auto-migration network error:', err.message);
                  // Reset flag so we try again on the next health check cycle
                  migrationAttempted = false;
                });
            }
          } else {
            console.warn('[Auth] ⚠️ Health check returned', res.status);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[Auth] ⚠️ Backend unreachable:', err.message);
          setBackendUp(false);
        }
      }
    };

    checkHealth();                                    // immediate on mount
    const interval = setInterval(checkHealth, 15000); // every 15 s

    return () => { cancelled = true; clearInterval(interval); };
  }, [setSession, showToast]);

  /** Manually trigger a backend health recheck (used by login page "Retry" button) */
  const retryBackendCheck = useCallback(async () => {
    setBackendUp(null); // show "checking…" while we test
    try {
      const res = await fetchWithTimeout(HEALTH_URL, {}, 5000);
      setBackendUp(res.ok);
      return res.ok;
    } catch {
      setBackendUp(false);
      return false;
    }
  }, []);

  /**
   * Validate current JWT against the backend.
   * Returns { valid: true } on success.
   * Returns { valid: false, reason: 'expired'|'no-token'|'network-error' } on failure.
   * Side-effects: updates user from server when valid; clears stale session on 401.
   */
  const validateSession = useCallback(async () => {
    const savedToken = localStorage.getItem(LS_TOKEN);
    if (!savedToken || savedToken === 'local') {
      return { valid: false, reason: 'no-token' };
    }
    try {
      const res = await fetchWithTimeout(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      }, 5000);

      if (res.ok) {
        const freshUser = await res.json();
        setUser(freshUser);
        setToken(savedToken);
        localStorage.setItem(LS_USER, JSON.stringify(freshUser));
        console.log('[Auth] validateSession ✅ Token valid for:', freshUser.name);
        return { valid: true };
      }

      if (res.status === 401) {
        console.warn('[Auth] validateSession ⚠️ Token rejected (401) — clearing session');
        localStorage.removeItem(LS_TOKEN);
        localStorage.removeItem(LS_USER);
        setUser(null);
        setToken('');
        setIsOnline(false);
        return { valid: false, reason: 'expired' };
      }

      return { valid: false, reason: 'server-error' };
    } catch (err) {
      console.warn('[Auth] validateSession network error:', err.message);
      return { valid: false, reason: 'network-error' };
    }
  }, []);

  /* ── Restore session on mount ── */
  useEffect(() => {
    const storedToken = localStorage.getItem(LS_TOKEN);
    const storedUser  = localStorage.getItem(LS_USER);

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        // Immediately use whatever token we have (real JWT or 'local')
        setToken(storedToken || 'local');
        console.log('[Auth] Session restored for:', parsed.name, '(local cache)');

        // If we have a REAL JWT, validate it with backend in background
        // and upgrade the session (updates addresses, name, etc.)
        if (storedToken && storedToken !== 'local') {
          fetchWithTimeout(`${API_URL}/profile`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          }, 5000)
            .then(res => res.ok ? res.json() : Promise.reject(res.status))
            .then(freshUser => {
              setUser(freshUser);
              localStorage.setItem(LS_USER, JSON.stringify(freshUser));
              console.log('[Auth] Token validated + user refreshed from server:', freshUser.name);
            })
            .catch(status => {
              // Token expired or invalid — clear session if 401
              if (status === 401) {
                console.warn('[Auth] Stored JWT rejected (401) — clearing session');
                localStorage.removeItem(LS_TOKEN);
                localStorage.removeItem(LS_USER);
                setUser(null);
                setToken('');
              }
            })
            .finally(() => setAppReady(true));
          return; // setAppReady will be called in finally above
        }

        setAppReady(true);
        return;
      } catch { /* fall through */ }
    }

    // No cached user — try to validate stored token with backend
    if (storedToken && storedToken !== 'local') {
      fetchWithTimeout(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      }, 5000)
        .then(res => res.ok ? res.json() : Promise.reject(res.status))
        .then(data => {
          setUser(data);
          setToken(storedToken);
          localStorage.setItem(LS_USER, JSON.stringify(data));
          console.log('[Auth] Session restored from server for:', data.name);
        })
        .catch(() => {
          localStorage.removeItem(LS_TOKEN);
          localStorage.removeItem(LS_USER);
        })
        .finally(() => setAppReady(true));
    } else {
      setAppReady(true);
    }
  }, []);

  /* ── Persist user to localStorage whenever it changes ── */
  useEffect(() => {
    if (user) localStorage.setItem(LS_USER, JSON.stringify(user));
    else       localStorage.removeItem(LS_USER);
  }, [user]);

  /* ── Start / stop heartbeat when authenticated token changes ── */
  useEffect(() => {
    const currentToken = token;
    if (currentToken && currentToken !== 'local') {
      checkTokenExpiry(currentToken);
      startHeartbeat(currentToken);
    } else {
      stopHeartbeat();
      if (!currentToken) setIsOnline(false);
    }
    return () => stopHeartbeat();
  }, [token, startHeartbeat, stopHeartbeat, checkTokenExpiry]);

  /* ── Mark offline when tab / browser closes (sendBeacon is fire-and-forget) ── */
  useEffect(() => {
    const handleUnload = () => {
      const savedToken = localStorage.getItem(LS_TOKEN);
      if (savedToken && savedToken !== 'local') {
        // sendBeacon survives tab close; fetch does not
        navigator.sendBeacon(
          `${API_URL}/logout`,
          new Blob(
            [JSON.stringify({})],
            { type: 'application/json' }
          )
        );
        // Note: Authorization header cannot be set with sendBeacon.
        // The backend /logout endpoint should also accept the token from
        // the request body as fallback, or use a cookie-based session.
        // For now the beacon fires as a best-effort; the heartbeat timeout
        // (backend-side, ~5 min) will mark the user offline anyway.
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  /* ── Network recovery: re-validate token when browser comes back online ── */
  useEffect(() => {
    const handleOnline = async () => {
      console.log('[Auth] Network came back online — re-validating session…');
      const savedToken = localStorage.getItem(LS_TOKEN);
      if (!savedToken || savedToken === 'local') return;
      try {
        const res = await fetchWithTimeout(`${API_URL}/profile`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        }, 5000);
        if (res.ok) {
          const freshUser = await res.json();
          setUser(freshUser);
          setToken(savedToken);
          setIsOnline(freshUser.isOnline ?? true);
          localStorage.setItem(LS_USER, JSON.stringify(freshUser));
          startHeartbeat(savedToken);
          console.log('[Auth] Session re-validated after network recovery:', freshUser.name);
        } else if (res.status === 401) {
          localStorage.removeItem(LS_TOKEN);
          localStorage.removeItem(LS_USER);
          setUser(null);
          setToken('');
          setIsOnline(false);
          showToast('Session expired while offline. Please sign in again.', 'warning');
        }
      } catch {
        console.warn('[Auth] Network recovery re-validation failed — will retry on next heartbeat');
      }
    };
    const handleOffline = () => {
      console.log('[Auth] Network went offline — pausing heartbeat');
      stopHeartbeat();
    };
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [startHeartbeat, stopHeartbeat, showToast]);

  /* ════════════════════════════════════════════════════════════
     LOGIN
     ════════════════════════════════════════════════════════════ */
  const login = useCallback(async (email, password) => {
    const emailNorm = email.trim().toLowerCase();
    console.log('[Auth] Login attempt →', { email: emailNorm, backendUp });

    /* ── Always refresh health status before attempting login ── */
    let isBackendLive = backendUp;
    if (backendUp !== true) {
      try {
        const res = await fetchWithTimeout(HEALTH_URL, {}, 4000);
        isBackendLive = res.ok;
        setBackendUp(res.ok);
        console.log('[Auth] Pre-login health check:', res.ok ? 'online' : 'offline');
      } catch {
        isBackendLive = false;
        setBackendUp(false);
      }
    }

    /* ── Try backend first ── */
    if (isBackendLive && !isOffline()) {
      try {
        const response = await fetchWithTimeout(`${API_URL}/login`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email: emailNorm, password }),
        });

        let data;
        try   { data = await response.json(); }
        catch { throw new Error('Non-JSON response from server'); }

        console.log('[Auth] Server login response:', response.status, data);

        if (response.ok) {
          if (!data.token) {
            showToast('Login error: no token received.', 'error');
            return { success: false };
          }
          setSession(data, data.token);
          setBackendUp(true);
          showToast(`Welcome back, ${data.name}! 🎉`, 'success');
          return { success: true };
        }

        // 401 / 400 from server — check if user has an offline account that needs migration
        setBackendUp(true);
        if (response.status === 401 || response.status === 400) {
          const localUsers = getLocalUsers();
          const localMatch = localUsers.find(
            u => u.email === emailNorm && u.passwordHash === hashLocal(password)
          );
          console.log('[Auth] 401 from backend. Local account match found:', !!localMatch);

          if (localMatch) {
            // Attempt to migrate the offline account to the backend
            console.log('[Auth] Attempting offline→backend migration for:', emailNorm);
            try {
              const migrateRes = await fetchWithTimeout(`${API_URL}/register`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ name: localMatch.name, email: emailNorm, password }),
              });
              const migrateData = await migrateRes.json();
              console.log('[Auth] Migration register response:', migrateRes.status, migrateData);

              if (migrateRes.ok && migrateData.token) {
                setSession(migrateData, migrateData.token);
                setBackendUp(true);
                showToast(`Welcome back, ${migrateData.name}! Your offline account has been synced. 🎉`, 'success');
                return { success: true, migrated: true };
              }
              // If email already exists in DB (different password), fall through to error
            } catch (migrateErr) {
              console.warn('[Auth] Migration attempt failed:', migrateErr.message);
            }
          }
        }

        const msg = getFriendlyError(response.status, data?.message || '');
        showToast(msg, 'error');
        return { success: false, message: msg };

      } catch (err) {
        console.warn('[Auth] Backend login failed, falling back to local auth:', err.message);
        setBackendUp(false);
        // fall through to local auth
      }
    }

    /* ── Local auth fallback ── */
    const users = getLocalUsers();
    console.log('[Auth] Local auth — users in store:', users.length, '| looking for:', emailNorm);

    const found = users.find(u => u.email === emailNorm);

    if (!found) {
      // No local account yet — auto-register on first login (so any email just works)
      console.log('[Auth] No local account — auto-creating for:', emailNorm);
      const nameFromEmail = emailNorm.split('@')[0]
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());

      const newUser = {
        _id:          `local_${Date.now()}`,
        name:         nameFromEmail,
        email:        emailNorm,
        role:         'customer',
        passwordHash: hashLocal(password),
        createdAt:    new Date().toISOString(),
      };
      users.push(newUser);
      saveLocalUsers(users);

      const { passwordHash, ...safeUser } = newUser;
      const localUser = { ...safeUser, isLocalOnly: true };
      setSession(localUser, 'local');
      showToast(
        isBackendLive
          ? `Welcome, ${nameFromEmail}! 🌿 (Offline save — sign in to sync)` 
          : `Saved locally, ${nameFromEmail}. 🌿 Server unreachable — working offline.`,
        'info'
      );
      return { success: true, autoRegistered: true };
    }

    if (found.passwordHash !== hashLocal(password)) {
      console.log('[Auth] Local auth — wrong password for:', emailNorm);
      showToast('Incorrect password. Please try again.', 'error');
      return { success: false, reason: 'wrong_password' };
    }

    const localUser = {
      _id: found._id, name: found.name,
      email: found.email, role: found.role,
      isLocalOnly: true,
    };
    setSession(localUser, 'local');
    console.log('[Auth] Local login success:', localUser.name);
    showToast(
      `Welcome back, ${found.name}! 🌿 You're in offline mode.`,
      'info'
    );
    return { success: true };
  }, [backendUp, showToast]);

  /* ════════════════════════════════════════════════════════════
     REGISTER
     ════════════════════════════════════════════════════════════ */
  const register = useCallback(async (name, email, password) => {
    const emailNorm = email.trim().toLowerCase();
    console.log('[Auth] Register attempt →', { email: emailNorm, backendUp });

    /* ── Try backend first ── */
    if (backendUp !== false && !isOffline()) {
      try {
        const response = await fetchWithTimeout(`${API_URL}/register`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ name: name.trim(), email: emailNorm, password }),
        });

        let data;
        try   { data = await response.json(); }
        catch { throw new Error('Non-JSON response from server'); }

        console.log('[Auth] Server register response:', response.status, data);

        if (response.ok) {
          if (!data.token) {
            showToast('Registration error: no token received.', 'error');
            return { success: false };
          }
          setSession(data, data.token);
          setBackendUp(true);
          showToast(`Account created! Welcome, ${data.name}. 🎊`, 'success');
          return { success: true };
        }

        setBackendUp(true);
        const msg = getFriendlyError(response.status, data?.message || '');
        showToast(msg, 'error');
        return { success: false, message: msg };

      } catch (err) {
        console.warn('[Auth] Backend register failed, falling back to local:', err.message);
        setBackendUp(false);
        // fall through to local
      }
    }

    /* ── Local register fallback ── */
    const users = getLocalUsers();
    if (users.find(u => u.email === emailNorm)) {
      showToast('An account with this email already exists.', 'error');
      return { success: false };
    }

    const newUser = {
      _id:          `local_${Date.now()}`,
      name:         name.trim(),
      email:        emailNorm,
      role:         'customer',
      passwordHash: hashLocal(password),
      createdAt:    new Date().toISOString(),
    };
    users.push(newUser);
    saveLocalUsers(users);

    const { passwordHash, ...safeUser } = newUser;
    const localUser = { ...safeUser, isLocalOnly: true };
    setSession(localUser, 'local');
    showToast(`Account created! Welcome, ${newUser.name}. 🌿 (offline mode)`, 'success');
    return { success: true };
  }, [backendUp, setSession, showToast]);

  /* ── Logout ── */
  const logout = useCallback(async () => {
    const savedToken = localStorage.getItem(LS_TOKEN);
    // Tell the backend to mark the user offline (best-effort, non-blocking)
    if (savedToken && savedToken !== 'local') {
      fetchWithTimeout(`${API_URL}/logout`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${savedToken}` },
      }, 4000).catch(() => {}); // fire-and-forget
    }
    stopHeartbeat();
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_USER);
    setUser(null);
    setToken('');
    setIsOnline(false);
    showToast('Logged out successfully.', 'info');
  }, [showToast, stopHeartbeat]);

  /* ── Update profile ── */
  const updateProfile = useCallback(async (updatedData, { silent = false } = {}) => {
    const storedToken = localStorage.getItem(LS_TOKEN);
    if (!storedToken || storedToken === 'local') {
      // local-only update
      if (!user) return { success: false };
      const updated = { ...user, ...updatedData };
      setUser(updated);
      if (!silent) showToast('Profile updated.', 'success');
      return { success: true };
    }
    try {
      const response = await fetchWithTimeout(`${API_URL}/profile`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${storedToken}` },
        body:    JSON.stringify(updatedData),
      });
      const data = await response.json();
      if (response.ok) {
        setSession(data, storedToken);
        if (!silent) showToast('Profile updated successfully!', 'success');
        return { success: true };
      }
      showToast(data.message || 'Failed to update profile.', 'error');
      return { success: false };
    } catch {
      showToast('Network error while updating profile.', 'error');
      return { success: false };
    }
  }, [user, showToast, setSession]);

  /* ── Address helpers ── */
  const addAddress = useCallback(async (newAddress) => {
    if (!user) return { success: false };
    const current   = user.addresses || [];
    const isDefault = newAddress.isDefault || current.length === 0;
    // Assign a temporary local _id so address selectors can match by _id immediately
    const formatted = { _id: `local_addr_${Date.now()}`, ...newAddress, isDefault };
    const updated   = isDefault
      ? [...current.map(a => ({ ...a, isDefault: false })), formatted]
      : [...current, formatted];
    const result = await updateProfile({ addresses: updated }, { silent: true });
    // Return the newly created address's _id so callers can auto-select it
    if (result.success) {
      return { ...result, newAddressId: formatted._id };
    }
    return result;
  }, [user, updateProfile]);

  const deleteAddress = useCallback(async (addressId) => {
    if (!user) return { success: false };
    let updated = (user.addresses || []).filter(a => String(a._id) !== String(addressId));
    if (updated.length > 0 && !updated.some(a => a.isDefault)) updated[0].isDefault = true;
    const result = await updateProfile({ addresses: updated }, { silent: true });
    if (result.success) showToast('Address removed.', 'info');
    return result;
  }, [user, updateProfile]);

  /* ── Computed session status ── */
  const sessionStatus = !appReady
    ? 'loading'
    : !user
      ? 'guest'
      : (token && token !== 'local')
        ? 'authenticated'
        : 'local-only';

  return (
    <AuthContext.Provider value={{
      user, token, appReady, backendUp,
      loading: !appReady,   // legacy alias
      sessionStatus,        // 'loading' | 'authenticated' | 'local-only' | 'guest'
      isSessionLoading,     // true while silently re-validating token in background
      isOnline,             // user's online status (mirrored from DB)
      login, register, logout, updateProfile, addAddress, deleteAddress,
      retryBackendCheck, validateSession, setSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
