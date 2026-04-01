import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  LogIn,
  Globe,
  Lock,
  Mail,
  Sun,
  Moon,
  UserPlus,
  User,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const sans = "'Outfit', 'Segoe UI', system-ui, sans-serif";

const LANG = {
  vi: {
    title: "RtR Control Tower",
    sub: "Real-time Robotics \u2022 Qu\u1EA3n l\u00FD D\u1EF1 \u00E1n Drone",
    email: "Email",
    password: "M\u1EADt kh\u1EA9u",
    confirmPassword: "X\u00E1c nh\u1EADn m\u1EADt kh\u1EA9u",
    fullName: "H\u1ECD v\u00E0 t\u00EAn",
    login: "\u0110\u0103ng nh\u1EADp",
    register: "\u0110\u0103ng k\u00FD",
    loginTab: "\u0110\u0103ng nh\u1EADp",
    registerTab: "T\u1EA1o t\u00E0i kho\u1EA3n",
    invalidCredentials: "Email ho\u1EB7c m\u1EADt kh\u1EA9u kh\u00F4ng \u0111\u00FAng",
    passwordMismatch: "M\u1EADt kh\u1EA9u kh\u00F4ng kh\u1EDBp",
    passwordTooShort: "M\u1EADt kh\u1EA9u t\u1ED1i thi\u1EC3u 6 k\u00FD t\u1EF1",
    nameRequired: "Vui l\u00F2ng nh\u1EADp h\u1ECD t\u00EAn",
    noConnection: "Kh\u00F4ng k\u1EBFt n\u1ED1i \u0111\u01B0\u1EE3c server. Vui l\u00F2ng th\u1EED l\u1EA1i sau.",
    registerSuccess: "T\u1EA1o t\u00E0i kho\u1EA3n th\u00E0nh c\u00F4ng!",
    checkEmail: "Vui l\u00F2ng ki\u1EC3m tra email \u0111\u1EC3 x\u00E1c nh\u1EADn t\u00E0i kho\u1EA3n.",
    backToLogin: "Quay l\u1EA1i \u0111\u0103ng nh\u1EADp",
    footer: "Real-time Robotics \u00A9 2026",
  },
  en: {
    title: "RtR Control Tower",
    sub: "Real-time Robotics \u2022 Drone Program Management",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    fullName: "Full Name",
    login: "Sign In",
    register: "Sign Up",
    loginTab: "Sign In",
    registerTab: "Create Account",
    invalidCredentials: "Invalid email or password",
    passwordMismatch: "Passwords do not match",
    passwordTooShort: "Password must be at least 6 characters",
    nameRequired: "Please enter your name",
    noConnection: "Cannot connect to server. Please try again later.",
    registerSuccess: "Account created successfully!",
    checkEmail: "Please check your email to confirm your account.",
    backToLogin: "Back to sign in",
    footer: "Real-time Robotics \u00A9 2026",
  },
};

export default function LoginScreen({ onLogin, initialLang = "vi" }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register" | "success"
  const [lang, setLang] = useState(initialLang);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("rtr-theme") || "dark");

  const t = LANG[lang];

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("rtr-theme", theme);
  }, [theme]);

  const triggerError = (msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        onLogin(result.user, lang);
      } else {
        triggerError(result.error === "no_connection" ? t.noConnection : t.invalidCredentials);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      triggerError(t.nameRequired);
      return;
    }
    if (password.length < 6) {
      triggerError(t.passwordTooShort);
      return;
    }
    if (password !== confirmPassword) {
      triggerError(t.passwordMismatch);
      return;
    }

    setLoading(true);
    try {
      const result = await register(email, password, fullName.trim());
      if (result.success) {
        if (result.needsConfirmation) {
          setMode("success");
        } else {
          onLogin(result.user, lang);
        }
      } else {
        triggerError(result.error === "no_connection" ? t.noConnection : result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError("");
    setPassword("");
    setConfirmPassword("");
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
          <div
            style={{
              fontSize: 13,
              color: "var(--text-faint)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginTop: 2,
            }}
          >
            {t.sub}
          </div>
        </div>

        {/* Success state */}
        {mode === "success" && (
          <div style={{ textAlign: "center", padding: "10px 0 20px" }}>
            <CheckCircle2 size={40} color="#10B981" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
              {t.registerSuccess}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 16, lineHeight: 1.5 }}>
              {t.checkEmail}
            </div>
            <button
              onClick={() => switchMode("login")}
              style={{
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "8px 16px",
                color: "var(--text-primary)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: sans,
              }}
            >
              <ArrowLeft size={14} /> {t.backToLogin}
            </button>
          </div>
        )}

        {/* Login / Register tabs */}
        {mode !== "success" && (
          <>
            <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
              <button
                onClick={() => switchMode("login")}
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  borderBottom: mode === "login" ? "2px solid #3B82F6" : "2px solid transparent",
                  padding: "8px 0",
                  color: mode === "login" ? "var(--text-primary)" : "var(--text-dim)",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: sans,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <LogIn size={14} /> {t.loginTab}
              </button>
              <button
                onClick={() => switchMode("register")}
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  borderBottom: mode === "register" ? "2px solid #7C3AED" : "2px solid transparent",
                  padding: "8px 0",
                  color: mode === "register" ? "var(--text-primary)" : "var(--text-dim)",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: sans,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <UserPlus size={14} /> {t.registerTab}
              </button>
            </div>

            <form onSubmit={mode === "login" ? handleLogin : handleRegister}>
              {/* Full Name (register only) */}
              {mode === "register" && (
                <div style={{ position: "relative", marginBottom: 12 }}>
                  <User
                    size={14}
                    color="var(--text-faint)"
                    style={{ position: "absolute", left: 12, top: 12, zIndex: 1 }}
                  />
                  <input
                    type="text"
                    placeholder={t.fullName}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#7C3AED";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "var(--border)";
                    }}
                    required
                  />
                </div>
              )}

              {/* Email */}
              <div style={{ position: "relative", marginBottom: 12 }}>
                <Mail
                  size={14}
                  color="var(--text-faint)"
                  style={{ position: "absolute", left: 12, top: 12, zIndex: 1 }}
                />
                <input
                  type="email"
                  placeholder={t.email}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = mode === "login" ? "#3B82F6" : "#7C3AED";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border)";
                  }}
                  required
                />
              </div>

              {/* Password */}
              <div style={{ position: "relative", marginBottom: 12 }}>
                <Lock
                  size={14}
                  color="var(--text-faint)"
                  style={{ position: "absolute", left: 12, top: 12, zIndex: 1 }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={t.password}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = mode === "login" ? "#3B82F6" : "#7C3AED";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border)";
                  }}
                  required
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

              {/* Confirm Password (register only) */}
              {mode === "register" && (
                <div style={{ position: "relative", marginBottom: 12 }}>
                  <Lock
                    size={14}
                    color="var(--text-faint)"
                    style={{ position: "absolute", left: 12, top: 12, zIndex: 1 }}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={t.confirmPassword}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#7C3AED";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "var(--border)";
                    }}
                    required
                  />
                </div>
              )}

              {/* Error */}
              {error && (
                <div
                  style={{
                    background: "#EF444415",
                    border: "1px solid #EF444430",
                    borderRadius: 4,
                    padding: "6px 10px",
                    marginBottom: 12,
                    fontSize: 13,
                    color: "#FCA5A5",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Lock size={12} /> {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  background:
                    mode === "login"
                      ? "linear-gradient(135deg, #1D4ED8, #2563EB)"
                      : "linear-gradient(135deg, #6D28D9, #7C3AED)",
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
                onMouseEnter={(e) => {
                  if (!loading) e.target.style.opacity = 0.9;
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.target.style.opacity = 1;
                }}
              >
                {mode === "login" ? <LogIn size={14} /> : <UserPlus size={14} />}
                {loading ? "..." : mode === "login" ? t.login : t.register}
              </button>
            </form>
          </>
        )}

        <div style={{ marginBottom: 20 }} />

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
            onClick={() => setTheme((th) => (th === "dark" ? "light" : "dark"))}
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
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 20, fontSize: 13, color: "var(--border)" }}>{t.footer}</div>

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
