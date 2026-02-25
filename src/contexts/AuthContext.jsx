import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConnected } from "../lib/supabase";

// ═══ FALLBACK: Mock users cho offline mode ═══
const DEMO_USERS = [
  { id: "usr-001", email: "quynh@rtr.vn", password: "demo123", name: "Quỳnh Anh", role: "admin", avatar: "QA", department: "AI", projects: ["PRJ-001", "PRJ-002"] },
  { id: "usr-002", email: "tuan@rtr.vn", password: "demo123", name: "Minh Tuấn", role: "pm", avatar: "MT", department: "R&D", projects: ["PRJ-001"] },
  { id: "usr-003", email: "anh@rtr.vn", password: "demo123", name: "Đức Anh", role: "engineer", avatar: "ĐA", department: "R&D", projects: ["PRJ-001"] },
  { id: "usr-004", email: "huong@rtr.vn", password: "demo123", name: "Lê Hương", role: "viewer", avatar: "LH", department: "QC", projects: ["PRJ-001", "PRJ-002"] },
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

    // Online mode — Supabase session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const prof = await fetchProfile(session.user.id);
        if (prof) {
          setProfile(prof);
          setUser(buildUserFromProfile(prof));
        }
      }
      setIsLoading(false);
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

    // Online Supabase login
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      return { success: false, error: authError.message };
    }

    const prof = await fetchProfile(data.user.id);
    if (prof) {
      setProfile(prof);
      const userObj = buildUserFromProfile(prof);
      setUser(userObj);
      return { success: true, user: userObj };
    }
    return { success: false, error: "Profile not found" };
  }, [fetchProfile, buildUserObj, buildUserFromProfile]);

  // ─── Quick Login (offline/demo only) ───
  const quickLogin = useCallback((userId) => {
    const found = DEMO_USERS.find((u) => u.id === userId);
    if (found) {
      const userObj = buildUserObj(found);
      setUser(userObj);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
      return { success: true, user: userObj };
    }
    return { success: false };
  }, [buildUserObj]);

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
