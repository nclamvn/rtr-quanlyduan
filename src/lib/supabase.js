import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const DEBUG = import.meta.env.DEV;

if (!supabaseUrl || !supabaseAnonKey) {
  if (DEBUG) console.warn('Supabase credentials missing. Running in offline/mock mode.');
}

// Clear stale Supabase auth session from localStorage to prevent
// the client from trying to refresh a token against an unreachable server.
// Our AuthContext manages its own user persistence separately.
if (supabaseUrl) {
  try {
    const ref = supabaseUrl.match(/\/\/([^.]+)\./)?.[1];
    if (ref) localStorage.removeItem(`sb-${ref}-auth-token`);
  } catch { /* ignore */ }
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false, // We enable after warm-up confirms server is reachable
        persistSession: false,   // We manage session persistence ourselves via AuthContext
        detectSessionInUrl: false,
        // Bypass navigator.locks which deadlocks in some browser/dev environments
        lock: async (_name, _acquireTimeout, fn) => await fn(),
      },
    })
  : null;

// ── Connection status management ──────────────────────────────────────
// isSupabaseConnected() reflects ACTUAL reachability, not just env vars
let _warmUpPromise = null;
let _connectionStatus = supabase ? 'connecting' : 'offline'; // 'connecting' | 'online' | 'offline'
let _statusListeners = [];

export function getConnectionStatus() {
  return _connectionStatus;
}

/** Returns true only when we have confirmed the server is reachable */
export const isSupabaseConnected = () => _connectionStatus === 'online';

export function onConnectionStatusChange(fn) {
  _statusListeners.push(fn);
  return () => { _statusListeners = _statusListeners.filter(l => l !== fn); };
}

function _setStatus(status) {
  _connectionStatus = status;
  _statusListeners.forEach(fn => fn(status));
}

// Timeout wrapper — if Supabase is paused/unreachable, reject after 15s
const TIMEOUT_MS = 15000;
export function withTimeout(promise, ms = TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase timeout')), ms)),
  ]);
}

// ── Warm-up ping with retry ──────────────────────────────────────────
// Supabase free-tier cold start can take 10-30s. We ping once on app load
// with retries, and all data hooks await this shared promise.

export function warmUpSupabase() {
  if (!supabase) {
    _setStatus('offline');
    return Promise.resolve(false);
  }
  if (_warmUpPromise) return _warmUpPromise;

  _warmUpPromise = (async () => {
    const MAX_RETRIES = 2;
    const PING_TIMEOUT = 8000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        _setStatus('connecting');
        if (DEBUG) console.log(`[Supabase] Connection attempt ${attempt}/${MAX_RETRIES}...`);
        const { data, error } = await withTimeout(
          supabase.from('projects').select('id').limit(1),
          PING_TIMEOUT
        );
        if (!error && data) {
          _setStatus('online');
          // Enable token refresh now that we know the server is reachable
          supabase.auth.startAutoRefresh();
          if (DEBUG) console.log(`[Supabase] Connected on attempt ${attempt}`);
          return true;
        }
        if (DEBUG) console.warn(`[Supabase] Attempt ${attempt} returned error:`, error?.message);
      } catch (e) {
        if (DEBUG) console.warn(`[Supabase] Attempt ${attempt} failed:`, e.message);
      }
    }

    _setStatus('offline');
    // Stop any pending auth refresh attempts
    supabase.auth.stopAutoRefresh();
    if (DEBUG) console.warn('[Supabase] All attempts failed — running offline');
    return false;
  })();

  return _warmUpPromise;
}

// Allow re-triggering warm-up (for Retry button)
export function resetWarmUp() {
  _warmUpPromise = null;
  _setStatus('connecting');
  return warmUpSupabase();
}
