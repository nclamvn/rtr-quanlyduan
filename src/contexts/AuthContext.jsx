import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConnected, withTimeout, getConnectionStatus, onConnectionStatusChange } from "../lib/supabase";

const STORAGE_KEY = "rtr_auth_user";
const AuthContext = createContext(null);

// Guest user — default when not logged in
const GUEST_USER = {
  id: "guest",
  email: "",
  name: "Guest",
  role: "guest",
  avatar: "G",
  department: "",
  projects: [],
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Restore from localStorage immediately for fast startup
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.id && parsed.id !== "guest") return parsed;
      }
    } catch { /* ignore */ }
    return GUEST_USER;
  });
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connStatus, setConnStatus] = useState(getConnectionStatus);

  // Track connection status changes
  useEffect(() => {
    return onConnectionStatusChange(setConnStatus);
  }, []);

  const online = connStatus === 'online';

  // ─── Fetch profile from profiles table ───
  const fetchProfile = useCallback(async (userId) => {
    if (!supabase) return null;
    try {
      const { data, error: err } = await withTimeout(
        supabase.from("profiles").select("*").eq("id", userId).single(),
        5000
      );
      if (err) return null;
      return data;
    } catch {
      return null;
    }
  }, []);

  // ─── Build user object from Supabase profile ───
  const buildUserFromProfile = useCallback((prof) => ({
    id: prof.id,
    email: prof.email,
    name: prof.full_name,
    role: prof.role || "viewer",
    avatar: prof.avatar_initials,
    department: prof.department,
    projects: [],
  }), []);

  // ─── Initialize: Try Supabase session if client exists ───
  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let settled = false;
    const settle = () => { if (!settled) { settled = true; setIsLoading(false); } };
    // Fast timeout — don't block app for auth
    const timeout = setTimeout(settle, 3000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout);
      if (session?.user) {
        try {
          const prof = await fetchProfile(session.user.id);
          if (prof) {
            setProfile(prof);
            const userObj = buildUserFromProfile(prof);
            setUser(userObj);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userObj));
          }
        } catch { /* use stored user from localStorage */ }
      } else {
        // No active session but have cached user — try to refresh profile from DB
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const cached = JSON.parse(stored);
            if (cached.id && cached.id !== "guest") {
              const prof = await fetchProfile(cached.id);
              if (prof) {
                const userObj = buildUserFromProfile(prof);
                setUser(userObj);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(userObj));
              }
            }
          }
        } catch { /* keep cached user */ }
      }
      settle();
    }).catch(() => {
      clearTimeout(timeout);
      settle();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const prof = await fetchProfile(session.user.id);
          if (prof) {
            setProfile(prof);
            const userObj = buildUserFromProfile(prof);
            setUser(userObj);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userObj));
          }
        } else if (_event === 'SIGNED_OUT') {
          setUser(GUEST_USER);
          setProfile(null);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile, buildUserFromProfile]);

  // ─── Register ───
  const register = useCallback(async (email, password, fullName) => {
    setError(null);

    if (!online) {
      return { success: false, error: "no_connection" };
    }

    try {
      const { data, error: authError } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        })
      );

      if (authError) {
        setError(authError.message);
        return { success: false, error: authError.message };
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        return { success: true, needsConfirmation: true };
      }

      // Auto-login after registration
      if (data.user && data.session) {
        const prof = await fetchProfile(data.user.id);
        if (prof) {
          setProfile(prof);
          const userObj = buildUserFromProfile(prof);
          setUser(userObj);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(userObj));
          return { success: true, user: userObj };
        }
        const userObj = {
          id: data.user.id,
          email: data.user.email,
          name: fullName,
          role: "viewer",
          avatar: fullName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
          department: "",
          projects: [],
        };
        setUser(userObj);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userObj));
        return { success: true, user: userObj };
      }

      return { success: false, error: "Unknown error" };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [online, fetchProfile, buildUserFromProfile]);

  // ─── Login ───
  const login = useCallback(async (email, password) => {
    setError(null);

    if (!online) {
      return { success: false, error: "no_connection" };
    }

    try {
      const { data, error: authError } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password })
      );
      if (authError) {
        setError(authError.message);
        return { success: false, error: authError.message };
      }
      const prof = await fetchProfile(data.user.id);
      if (prof) {
        setProfile(prof);
        const userObj = buildUserFromProfile(prof);
        setUser(userObj);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userObj));
        return { success: true, user: userObj };
      }
      // Profile not in table yet — use auth metadata
      const meta = data.user.user_metadata || {};
      const userObj = {
        id: data.user.id,
        email: data.user.email,
        name: meta.full_name || email.split("@")[0],
        role: "viewer",
        avatar: (meta.full_name || email[0]).split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
        department: "",
        projects: [],
      };
      setUser(userObj);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userObj));
      return { success: true, user: userObj };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [online, fetchProfile, buildUserFromProfile]);

  // ─── Logout ───
  const logout = useCallback(async () => {
    if (online && supabase) {
      try { await supabase.auth.signOut(); } catch { /* ignore */ }
    }
    setUser(GUEST_USER);
    setProfile(null);
    localStorage.removeItem(STORAGE_KEY);
  }, [online]);

  const isGuest = user.role === "guest";
  const isAuthenticated = !isGuest;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated,
        isGuest,
        isLoading,
        error,
        login,
        register,
        logout,
        isOnline: online,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
