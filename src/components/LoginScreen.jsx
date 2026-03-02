import { useState, useEffect } from "react";
import {
  Eye, EyeOff, LogIn, Globe, Shield, UserCog, Wrench, EyeIcon,
  ChevronRight, Lock, Mail, Sun, Moon
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const sans = "'Outfit', 'Segoe UI', system-ui, sans-serif";
const mono = "'JetBrains Mono', 'Fira Code', monospace";

const ROLE_ICONS = { admin: Shield, pm: UserCog, engineer: Wrench, viewer: EyeIcon };
const ROLE_COLORS = { admin: "#EF4444", pm: "#3B82F6", engineer: "#F59E0B", viewer: "#6B7280" };

const LANG = {
  vi: {
    title: "RtR Control Tower",
    sub: "Real-time Robotics • Qu\u1EA3n l\u00FD D\u1EF1 \u00E1n Drone",
    email: "Email",
    password: "M\u1EADt kh\u1EA9u",
    login: "\u0110\u0103ng nh\u1EADp",
    or: "ho\u1EB7c",
    quickLogin: "\u0110\u0103ng nh\u1EADp nhanh (Demo)",
    invalidCredentials: "Email ho\u1EB7c m\u1EADt kh\u1EA9u kh\u00F4ng \u0111\u00FAng",
    footer: "Real-time Robotics \u00A9 2026",
    role: { admin: "Qu\u1EA3n tr\u1ECB", pm: "Qu\u1EA3n l\u00FD DA", engineer: "K\u1EF9 s\u01B0", viewer: "Xem" },
  },
  en: {
    title: "RtR Control Tower",
    sub: "Real-time Robotics • Drone Program Management",
    email: "Email",
    password: "Password",
    login: "Sign In",
    or: "or",
    quickLogin: "Quick Login (Demo)",
    invalidCredentials: "Invalid email or password",
    footer: "Real-time Robotics \u00A9 2026",
    role: { admin: "Admin", pm: "PM", engineer: "Engineer", viewer: "Viewer" },
  },
};

export default function LoginScreen({ onLogin, initialLang = "vi" }) {
  const { login, quickLogin, demoUsers } = useAuth();
  const [lang, setLang] = useState(initialLang);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('rtr-theme') || 'dark');

  const t = LANG[lang];

  // Fade-in animation
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('rtr-theme', theme); }, [theme]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        onLogin(result.user, lang);
      } else {
        setError(t.invalidCredentials);
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userId) => {
    setError("");
    setLoading(true);
    try {
      const result = await quickLogin(userId);
      if (result.success) {
        onLogin(result.user, lang);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: "var(--bg-input)",
    border: `1px solid ${error && shake ? "#EF4444" : "var(--border)"}`,
    borderRadius: 6,
    padding: "10px 12px 10px 36px",
    color: "var(--text-primary)",
    fontSize: 15,
    width: "100%",
    outline: "none",
    fontFamily: sans,
    transition: "border-color 0.2s",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--login-gradient)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: sans,
        padding: 20,
      }}
    >
      {/* Login Card */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "36px 32px 28px",
          width: "100%",
          maxWidth: 400,
          position: "relative",
          overflow: "hidden",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
          animation: shake ? "shake 0.5s ease-in-out" : "none",
        }}
      >
        {/* Top gradient bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: "linear-gradient(90deg, #1D4ED8, #7C3AED, #1D4ED8)",
          }}
        />

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              background: "linear-gradient(135deg, #1D4ED8, #7C3AED)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 900,
              color: "#fff",
              marginBottom: 12,
            }}
          >
            R
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            {t.title}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-faint)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2 }}>
            {t.sub}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <Mail size={14} color="var(--text-faint)" style={{ position: "absolute", left: 12, top: 12, zIndex: 1 }} />
            <input
              type="email"
              placeholder={t.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = "#3B82F6"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
            />
          </div>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <Lock size={14} color="var(--text-faint)" style={{ position: "absolute", left: 12, top: 12, zIndex: 1 }} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder={t.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = "#3B82F6"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: 8,
                top: 8,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                color: "var(--text-faint)",
              }}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div
              style={{
                background: "#EF444415",
                border: "1px solid #EF444430",
                borderRadius: 4,
                padding: "6px 10px",
                marginBottom: 12,
                fontSize: 14,
                color: "#FCA5A5",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Lock size={12} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #1D4ED8, #2563EB)",
              border: "none",
              borderRadius: 6,
              padding: "10px 0",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              fontFamily: sans,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "opacity 0.2s",
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => { if (!loading) e.target.style.opacity = 0.9; }}
            onMouseLeave={(e) => { if (!loading) e.target.style.opacity = 1; }}
          >
            <LogIn size={14} /> {loading ? "..." : t.login}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "20px 0 16px",
          }}
        >
          <div style={{ flex: 1, height: 1, background: "var(--hover-bg)" }} />
          <span style={{ fontSize: 13, color: "var(--text-faint)", textTransform: "lowercase" }}>{t.or}</span>
          <div style={{ flex: 1, height: 1, background: "var(--hover-bg)" }} />
        </div>

        {/* Quick Login */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-faint)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8,
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            {t.quickLogin}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {demoUsers.map((u) => {
              const RoleIcon = ROLE_ICONS[u.role];
              const color = ROLE_COLORS[u.role];
              return (
                <button
                  key={u.id}
                  onClick={() => handleQuickLogin(u.id)}
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: "8px 10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "border-color 0.2s, background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = color;
                    e.currentTarget.style.background = `${color}08`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.background = "var(--bg-input)";
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: `${color}15`,
                      border: `1px solid ${color}30`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <RoleIcon size={12} color={color} />
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4 }}>
                      {u.name}
                    </div>
                    <div style={{ fontSize: 11, color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {t.role[u.role]}
                    </div>
                  </div>
                  <ChevronRight size={12} color="var(--text-disabled)" style={{ marginLeft: "auto" }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Language + Theme toggle */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          <div
            style={{
              display: "inline-flex",
              border: "1px solid var(--border)",
              borderRadius: 4,
              overflow: "hidden",
              alignItems: "center",
            }}
          >
            <Globe size={11} style={{ margin: "0 6px", color: "var(--text-faint)" }} />
            {["vi", "en"].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                style={{
                  background: lang === l ? "var(--hover-bg)" : "transparent",
                  border: "none",
                  padding: "4px 10px",
                  color: lang === l ? "var(--text-primary)" : "var(--text-faint)",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  textTransform: "uppercase",
                }}
              >
                {l}
              </button>
            ))}
          </div>
          <button
            onClick={() => setTheme(th => th === 'dark' ? 'light' : 'dark')}
            style={{
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: 4,
              padding: "4px 8px",
              color: "var(--text-faint)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 20, fontSize: 13, color: "var(--border)" }}>{t.footer}</div>

      {/* Shake animation keyframes */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
