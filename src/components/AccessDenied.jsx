import { ShieldOff, ArrowLeft, Globe, LogOut } from "lucide-react";

const AUTH_URL = import.meta.env.VITE_AUTH_URL || "https://auth.rtrobotics.com";
const sans = "'Outfit', 'Segoe UI', system-ui, sans-serif";

export default function AccessDenied() {
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
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: "linear-gradient(90deg, #EF4444, #F97316, #EF4444)",
          }}
        />

        <ShieldOff size={40} color="#EF4444" style={{ marginBottom: 16 }} />

        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "var(--text-primary)",
            marginBottom: 8,
          }}
        >
          Truy cap bi tu choi
        </div>
        <div
          style={{
            fontSize: 14,
            color: "var(--text-dim)",
            marginBottom: 24,
            lineHeight: 1.6,
          }}
        >
          Tai khoan cua ban khong co quyen truy cap ung dung PM.
          <br />
          Vui long lien he quan tri vien de duoc cap quyen.
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button
            onClick={() => {
              window.location.href = AUTH_URL;
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: "var(--text-primary)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: sans,
            }}
          >
            <ArrowLeft size={14} /> Quay lai Portal
          </button>
          <button
            onClick={() => {
              fetch(`${AUTH_URL}/api/auth/logout`, {
                method: "POST",
                credentials: "include",
              }).finally(() => {
                window.location.href = `${AUTH_URL}/login`;
              });
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              background: "none",
              border: "1px solid #EF444440",
              borderRadius: 6,
              color: "#EF4444",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: sans,
            }}
          >
            <LogOut size={14} /> Dang xuat
          </button>
        </div>
      </div>
    </div>
  );
}
