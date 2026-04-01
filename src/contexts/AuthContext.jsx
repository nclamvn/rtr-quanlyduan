import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase, withTimeout, getConnectionStatus, onConnectionStatusChange } from "../lib/supabase";

const STORAGE_KEY = "rtr_auth_user";
const AUTH_URL = import.meta.env.VITE_AUTH_URL;
const USE_GATEWAY = !!AUTH_URL;

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

// ── Map Gateway JWT roles → PM app roles ──
// Gateway: super_admin(99), admin(30), manager(20), staff(10), viewer(0)
// PM:      admin, pm, engineer, viewer
function mapGatewayToPmRole(gatewayUser) {
  const pmPerms = gatewayUser.permissions?.pm || [];
  if (pmPerms.length === 0) return null; // no PM access
  if (gatewayUser.role_level >= 99) return "admin";
  if (pmPerms.includes("admin")) return "pm";
  if (pmPerms.includes("write")) return "engineer";
  return "viewer";
}

function buildAvatarInitials(name) {
  return (name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Restore from localStorage immediately for fast startup
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.id && parsed.id !== "guest") return parsed;
      }
    } catch {
      /* ignore */
    }
    return GUEST_USER;
  });
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [connStatus, setConnStatus] = useState(getConnectionStatus);

  // Track connection status changes
  useEffect(() => {
    return onConnectionStatusChange(setConnStatus);
  }, []);

  const online = connStatus === "online";

  // ─── Fetch profile from profiles table ───
  const fetchProfile = useCallback(async (userId) => {
    if (!supabase) return null;
    try {
      const { data, error: err } = await withTimeout(
        supabase.from("profiles").select("*").eq("id", userId).single(),
        5000,
      );
      if (err) return null;
      return data;
    } catch {
      return null;
    }
  }, []);

  // ─── Fetch profile by email (for Gateway → Supabase bridge) ───
  const fetchProfileByEmail = useCallback(async (email) => {
    if (!supabase) return null;
    try {
      const { data, error: err } = await withTimeout(
        supabase.from("profiles").select("*").eq("email", email).single(),
        5000,
      );
      if (err) return null;
      return data;
    } catch {
      return null;
    }
  }, []);

  // ─── Build user object from Supabase profile ───
  const buildUserFromProfile = useCallback(
    (prof) => ({
      id: prof.id,
      email: prof.email,
      name: prof.full_name,
      role: prof.role || "viewer",
      avatar: prof.avatar_initials,
      department: prof.department,
      projects: [],
    }),
    [],
  );

  // ═══════════════════════════════════════════════
  // GATEWAY AUTH FLOW
  // ═══════════════════════════════════════════════
  const initGatewayAuth = useCallback(async () => {
    try {
      // Step 1: Verify Gateway cookie
      const res = await fetch(`${AUTH_URL}/api/auth/verify`, {
        credentials: "include",
      });

      if (!res.ok) {
        // No valid Gateway session → redirect to login
        window.location.href = `${AUTH_URL}/login?redirect=${encodeURIComponent(window.location.href)}`;
        return;
      }

      const gatewayUser = await res.json();

      // Step 2: Check PM permissions
      const pmRole = mapGatewayToPmRole(gatewayUser);
      if (!pmRole) {
        setAccessDenied(true);
        setIsLoading(false);
        return;
      }

      // Step 3: Build user object from Gateway data
      const userObj = {
        id: gatewayUser.sub,
        email: gatewayUser.email,
        name: gatewayUser.name,
        role: pmRole,
        avatar: buildAvatarInitials(gatewayUser.name),
        department: gatewayUser.dept || "",
        emp_code: gatewayUser.emp_code,
        projects: [],
      };

      // Step 4: Bridge Supabase session for RLS
      if (supabase) {
        let bridged = false;

        // 4a: Check existing Supabase session
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session && session.user.email === gatewayUser.email) {
            // Existing session matches Gateway user — use it
            const prof = await fetchProfile(session.user.id);
            if (prof) {
              userObj.id = prof.id; // Use Supabase UUID for RLS consistency
              userObj.avatar = prof.avatar_initials || userObj.avatar;
              setProfile(prof);
            }
            bridged = true;
          }
        } catch {
          /* session check failed, try bridge */
        }

        // 4b: No matching session → try Edge Function bridge
        if (!bridged) {
          try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            if (supabaseUrl && anonKey) {
              const bridgeRes = await fetch(`${supabaseUrl}/functions/v1/gateway-session`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${anonKey}`,
                },
                credentials: "include", // sends Gateway cookie
              });

              if (bridgeRes.ok) {
                const { access_token, refresh_token } = await bridgeRes.json();
                await supabase.auth.setSession({ access_token, refresh_token });
                const {
                  data: { session: newSession },
                } = await supabase.auth.getSession();
                if (newSession) {
                  userObj.id = newSession.user.id;
                  const prof = await fetchProfile(newSession.user.id);
                  if (prof) {
                    userObj.avatar = prof.avatar_initials || userObj.avatar;
                    setProfile(prof);
                  }
                }
                bridged = true;
              }
            }
          } catch {
            /* Edge Function not available */
          }
        }

        // 4c: Still no bridge → try profile lookup by email (read-only mode)
        if (!bridged) {
          const prof = await fetchProfileByEmail(gatewayUser.email);
          if (prof) {
            userObj.id = prof.id;
            userObj.avatar = prof.avatar_initials || userObj.avatar;
            setProfile(prof);
          }
          console.warn("[Auth] Supabase session bridge unavailable. Data writes may fail due to RLS.");
        }
      }

      setUser(userObj);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userObj));
      setIsLoading(false);
    } catch {
      // Network error → redirect to Gateway login
      window.location.href = `${AUTH_URL}/login?redirect=${encodeURIComponent(window.location.href)}`;
    }
  }, [fetchProfile, fetchProfileByEmail]);

  // ═══════════════════════════════════════════════
  // SUPABASE-ONLY AUTH FLOW (dev fallback)
  // ═══════════════════════════════════════════════
  const initSupabaseAuth = useCallback(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let settled = false;
    const settle = () => {
      if (!settled) {
        settled = true;
        setIsLoading(false);
      }
    };
    const timeout = setTimeout(settle, 3000);

    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
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
          } catch {
            /* use stored user from localStorage */
          }
        } else {
          // No active session but have cached user — try to refresh profile
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
          } catch {
            /* keep cached user */
          }
        }
        settle();
      })
      .catch(() => {
        clearTimeout(timeout);
        settle();
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const prof = await fetchProfile(session.user.id);
        if (prof) {
          setProfile(prof);
          const userObj = buildUserFromProfile(prof);
          setUser(userObj);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(userObj));
        }
      } else if (_event === "SIGNED_OUT") {
        setUser(GUEST_USER);
        setProfile(null);
        localStorage.removeItem(STORAGE_KEY);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, buildUserFromProfile]);

  // ─── Initialize auth based on mode ───
  // Auth init is inherently async and must setState when complete.
  useEffect(() => {
    if (USE_GATEWAY) {
      initGatewayAuth();
    } else {
      const cleanup = initSupabaseAuth();
      return cleanup;
    }
  }, [initGatewayAuth, initSupabaseAuth]);

  // ─── Login (dev fallback only — Gateway mode redirects instead) ───
  const login = useCallback(
    async (email, password) => {
      if (USE_GATEWAY) {
        // Gateway mode: should not reach here, redirect instead
        window.location.href = `${AUTH_URL}/login?redirect=${encodeURIComponent(window.location.href)}`;
        return { success: false, error: "redirect" };
      }

      setError(null);

      // Offline bypass
      if (!online) {
        const offlineUser = {
          id: "offline-" + email.split("@")[0],
          email,
          name: email
            .split("@")[0]
            .replace(/[._]/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase()),
          role: "admin",
          avatar: email[0].toUpperCase(),
          department: "",
          projects: [],
        };
        setUser(offlineUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(offlineUser));
        return { success: true, user: offlineUser };
      }

      try {
        const { data, error: authError } = await withTimeout(supabase.auth.signInWithPassword({ email, password }));
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
        const meta = data.user.user_metadata || {};
        const userObj = {
          id: data.user.id,
          email: data.user.email,
          name: meta.full_name || email.split("@")[0],
          role: "viewer",
          avatar: (meta.full_name || email[0])
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
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
    },
    [online, fetchProfile, buildUserFromProfile],
  );

  // ─── Register (dev fallback only) ───
  const register = useCallback(
    async (email, password, fullName) => {
      if (USE_GATEWAY) {
        // Gateway mode: registration handled by Gateway
        window.location.href = `${AUTH_URL}/register`;
        return { success: false, error: "redirect" };
      }

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
          }),
        );

        if (authError) {
          setError(authError.message);
          return { success: false, error: authError.message };
        }

        if (data.user && !data.session) {
          return { success: true, needsConfirmation: true };
        }

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
            avatar: fullName
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase(),
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
    },
    [online, fetchProfile, buildUserFromProfile],
  );

  // ─── Logout ───
  const logout = useCallback(async () => {
    // Sign out of Supabase session
    if (online && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        /* ignore */
      }
    }
    setUser(GUEST_USER);
    setProfile(null);
    localStorage.removeItem(STORAGE_KEY);

    if (USE_GATEWAY) {
      // Redirect to Gateway logout
      fetch(`${AUTH_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      }).finally(() => {
        window.location.href = `${AUTH_URL}/login`;
      });
    }
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
        accessDenied,
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
