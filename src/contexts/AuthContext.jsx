import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConnected, withTimeout } from "../lib/supabase";

// ═══ FALLBACK: Demo users cho offline mode ═══
// Passwords are non-secret demo-only credentials (do NOT match any real Supabase accounts)
const DEMO_USERS = [
  { id: "usr-001", email: "admin@demo.rtr.local", password: "demo", name: "Quỳnh Anh", role: "admin", avatar: "QA", department: "AI", projects: ["PRJ-001", "PRJ-002"] },
  { id: "usr-002", email: "pm@demo.rtr.local", password: "demo", name: "Minh Tuấn", role: "pm", avatar: "MT", department: "R&D", projects: ["PRJ-001"] },
  { id: "usr-003", email: "engineer@demo.rtr.local", password: "demo", name: "Đức Anh", role: "engineer", avatar: "ĐA", department: "R&D", projects: ["PRJ-001"] },
  { id: "usr-004", email: "viewer@demo.rtr.local", password: "demo", name: "Lê Hương", role: "viewer", avatar: "LH", department: "QC", projects: ["PRJ-001", "PRJ-002"] },
];

const STORAGE_KEY = "rtr_auth_user";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── Fetch profile from profiles table ───
  const fetchProfile = useCallback(async (userId) => {
    if (!supabase) return null;
    const { data, error: err } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (err) {
      console.error("Profile fetch error:", err);
      return null;
    }
    return data;
  }, []);

  // ─── Normalize user object (same shape for online/offline) ───
  const buildUserObj = useCallback((demoUser) => ({
    id: demoUser.id,
    email: demoUser.email,
    name: demoUser.name,
    role: demoUser.role,
    avatar: demoUser.avatar,
    department: demoUser.department,
    projects: demoUser.projects || [],
  }), []);

  const buildUserFromProfile = useCallback((prof) => ({
    id: prof.id,
    email: prof.email,
    name: prof.full_name,
    role: prof.role,
    avatar: prof.avatar_initials,
    department: prof.department,
    projects: [],
  }), []);

  // ─── Initialize: Check existing session ───
  useEffect(() => {
    if (!isSupabaseConnected()) {
      // Offline mode — check localStorage for demo user
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const found = DEMO_USERS.find((u) => u.id === parsed.id);
          if (found) {
            setUser(buildUserObj(found));
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
      setIsLoading(false);
      return;
    }

    // Online mode — Supabase session (with timeout fallback)
    let settled = false;
    const settle = () => { if (!settled) { settled = true; setIsLoading(false); } };
    const timeout = setTimeout(() => {
      console.warn("Supabase getSession timed out — falling back to offline mode");
      settle();
    }, 15000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout);
      if (session?.user) {
        try {
          const prof = await fetchProfile(session.user.id);
          if (prof) {
            setProfile(prof);
            setUser(buildUserFromProfile(prof));
          }
        } catch (err) {
          console.warn("Profile fetch failed:", err);
        }
      }
      settle();
    }).catch((err) => {
      clearTimeout(timeout);
      console.error("Supabase getSession failed:", err);
      settle();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const prof = await fetchProfile(session.user.id);
          if (prof) {
            setProfile(prof);
            setUser(buildUserFromProfile(prof));
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile, buildUserObj, buildUserFromProfile]);

  // ─── Login ───
  const login = useCallback(async (email, password) => {
    setError(null);

    if (!isSupabaseConnected()) {
      // Offline demo login
      const found = DEMO_USERS.find((u) => u.email === email && u.password === password);
      if (found) {
        const userObj = buildUserObj(found);
        setUser(userObj);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
        return { success: true, user: userObj };
      }
      return { success: false, error: "invalid_credentials" };
    }

    // Online Supabase login (with timeout → offline fallback)
    try {
      const { data, error: authError } = await withTimeout(supabase.auth.signInWithPassword({ email, password }));
      if (authError) {
        setError(authError.message);
        return { success: false, error: authError.message };
      }
      const prof = await withTimeout(fetchProfile(data.user.id));
      if (prof) {
        setProfile(prof);
        const userObj = buildUserFromProfile(prof);
        setUser(userObj);
        return { success: true, user: userObj };
      }
      return { success: false, error: "Profile not found" };
    } catch (err) {
      console.warn("Login Supabase timeout, trying offline:", err.message);
      // Fall through to offline demo login
      const found = DEMO_USERS.find((u) => u.email === email && u.password === password);
      if (found) {
        const userObj = buildUserObj(found);
        setUser(userObj);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
        return { success: true, user: userObj };
      }
      return { success: false, error: "invalid_credentials" };
    }
  }, [fetchProfile, buildUserObj, buildUserFromProfile]);

  // ─── Quick Login (tries Supabase first, falls back to offline) ───
  const quickLogin = useCallback(async (userId) => {
    const found = DEMO_USERS.find((u) => u.id === userId);
    if (!found) return { success: false };

    if (isSupabaseConnected()) {
      try {
        const { data, error: authError } = await withTimeout(supabase.auth.signInWithPassword({
          email: found.email,
          password: found.password,
        }));
        if (!authError && data?.user) {
          const prof = await withTimeout(fetchProfile(data.user.id));
          if (prof) {
            setProfile(prof);
            const userObj = buildUserFromProfile(prof);
            setUser(userObj);
            return { success: true, user: userObj };
          }
        }
      } catch (err) {
        console.warn("Quick login Supabase timeout, falling back to offline:", err.message);
      }
    }

    // Offline fallback
    const userObj = buildUserObj(found);
    setUser(userObj);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
    return { success: true, user: userObj };
  }, [buildUserObj, buildUserFromProfile, fetchProfile]);

  // ─── Switch User (admin, offline only) ───
  const switchUser = useCallback((userId) => {
    const found = DEMO_USERS.find((u) => u.id === userId);
    if (found) {
      const userObj = buildUserObj(found);
      setUser(userObj);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
    }
  }, [buildUserObj]);

  // ─── Logout ───
  const logout = useCallback(async () => {
    if (isSupabaseConnected()) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("rtr_audit_log");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        quickLogin,
        logout,
        switchUser,
        isOnline: isSupabaseConnected(),
        demoUsers: DEMO_USERS,
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

export { DEMO_USERS };
