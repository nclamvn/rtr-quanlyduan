import { createContext, useContext, useState, useEffect, useCallback } from "react";

// Demo users database
const DEMO_USERS = [
  {
    id: "usr-001",
    email: "quynh@rtr.vn",
    password: "demo123",
    name: "Qu\u1EF3nh Anh",
    role: "admin",
    avatar: "QA",
    projects: ["PRJ-001", "PRJ-002"],
  },
  {
    id: "usr-002",
    email: "tuan@rtr.vn",
    password: "demo123",
    name: "Minh Tu\u1EA5n",
    role: "pm",
    avatar: "MT",
    projects: ["PRJ-001"],
  },
  {
    id: "usr-003",
    email: "anh@rtr.vn",
    password: "demo123",
    name: "\u0110\u1EE9c Anh",
    role: "engineer",
    avatar: "\u0110A",
    projects: ["PRJ-001"],
  },
  {
    id: "usr-004",
    email: "huong@rtr.vn",
    password: "demo123",
    name: "L\u00EA H\u01B0\u01A1ng",
    role: "viewer",
    avatar: "LH",
    projects: ["PRJ-001", "PRJ-002"],
  },
];

const STORAGE_KEY = "rtr_auth_user";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate against known users
        const found = DEMO_USERS.find((u) => u.id === parsed.id);
        if (found) {
          setUser(found);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((email, password) => {
    const found = DEMO_USERS.find(
      (u) => u.email === email && u.password === password
    );
    if (found) {
      setUser(found);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
      return { success: true, user: found };
    }
    return { success: false, error: "invalid_credentials" };
  }, []);

  const quickLogin = useCallback((userId) => {
    const found = DEMO_USERS.find((u) => u.id === userId);
    if (found) {
      setUser(found);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
      return { success: true, user: found };
    }
    return { success: false };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const switchUser = useCallback((userId) => {
    const found = DEMO_USERS.find((u) => u.id === userId);
    if (found) {
      setUser(found);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        quickLogin,
        logout,
        switchUser,
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
