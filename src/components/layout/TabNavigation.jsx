import { useNavigate, useLocation } from "react-router-dom";
import { TAB_ROUTES } from "../../router";
import { sans } from "../../constants";

export default function TabNavigation({ tabs, activeTab, onTabChange }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (tabId) => {
    const path = TAB_ROUTES[tabId];
    if (path && location.pathname !== path) {
      navigate(path);
    }
    onTabChange(tabId);
  };

  return (
    <div
      className="tab-bar"
      style={{
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border)",
        padding: "0 20px",
        display: "flex",
        flexWrap: "nowrap",
        gap: 0,
        overflowX: "auto",
        overflowY: "hidden",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        position: "relative",
        maskImage: "linear-gradient(90deg, transparent 0, #000 20px, #000 calc(100% - 30px), transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent 0, #000 20px, #000 calc(100% - 30px), transparent)",
      }}
    >
      {tabs.map((tb) => (
        <button
          key={tb.id}
          onClick={() => handleClick(tb.id)}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === tb.id ? "2px solid #3B82F6" : "2px solid transparent",
            padding: "9px 14px",
            color: activeTab === tb.id ? "var(--text-primary)" : "var(--text-dim)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontFamily: sans,
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          <tb.Icon size={13} />
          {tb.label}
          {tb.badge > 0 && (
            <span
              style={{
                background: "#EF4444",
                color: "#fff",
                borderRadius: 8,
                padding: "0 5px",
                fontSize: 11,
                fontWeight: 800,
                minWidth: 14,
                textAlign: "center",
              }}
            >
              {tb.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
