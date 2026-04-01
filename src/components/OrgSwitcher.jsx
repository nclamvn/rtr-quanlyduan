import { useState, useEffect, useRef } from "react";
import { Building2, ChevronDown, Plus, Check, Users, Settings } from "lucide-react";
import { useOrgStore } from "../stores/orgStore";
import { fetchUserOrgs } from "../services/orgService";
import { getConnectionStatus } from "../lib/supabase";
import { mono, sans } from "../constants";

export default function OrgSwitcher({ userId, lang }) {
  const { currentOrgId, orgs, setCurrentOrg, setOrgs } = useOrgStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (getConnectionStatus() !== "online" || !userId) return;
    fetchUserOrgs(userId).then((data) => {
      setOrgs(data);
      if (!currentOrgId && data.length > 0) {
        setCurrentOrg(data[0].id);
      }
    });
  }, [userId]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const currentOrg = orgs.find((o) => o.id === currentOrgId);

  if (orgs.length === 0) return null;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 6,
          border: "1px solid var(--border)",
          background: "var(--bg-input)",
          color: "var(--text-primary)",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
          fontFamily: sans,
        }}
      >
        {currentOrg?.logo_url ? (
          <img src={currentOrg.logo_url} alt="" style={{ width: 18, height: 18, borderRadius: 3 }} />
        ) : (
          <Building2 size={14} color="var(--text-dim)" />
        )}
        <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {currentOrg?.name || (lang === "vi" ? "Chọn tổ chức" : "Select org")}
        </span>
        <ChevronDown size={12} color="var(--text-faint)" />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            minWidth: 220,
            background: "var(--bg-modal)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              borderBottom: "1px solid var(--border)",
              fontSize: 11,
              color: "var(--text-faint)",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            {lang === "vi" ? "Tổ chức" : "Organizations"}
          </div>
          {orgs.map((org) => (
            <button
              key={org.id}
              onClick={() => {
                setCurrentOrg(org.id);
                setOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "8px 12px",
                border: "none",
                background: org.id === currentOrgId ? "var(--hover-bg)" : "transparent",
                cursor: "pointer",
                color: "var(--text-primary)",
                fontSize: 13,
                fontFamily: sans,
                textAlign: "left",
              }}
            >
              <Building2 size={14} color={org.id === currentOrgId ? "#3B82F6" : "var(--text-faint)"} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{org.name}</div>
                <div style={{ fontSize: 10, color: "var(--text-faint)", fontFamily: mono }}>
                  {org.slug} • {org.memberRole}
                </div>
              </div>
              {org.id === currentOrgId && <Check size={14} color="#3B82F6" />}
            </button>
          ))}
          <div style={{ borderTop: "1px solid var(--border)", padding: 4 }}>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                width: "100%",
                padding: "6px 12px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "var(--text-dim)",
                fontSize: 12,
                fontFamily: sans,
              }}
            >
              <Plus size={12} /> {lang === "vi" ? "Tạo tổ chức mới" : "Create new organization"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
