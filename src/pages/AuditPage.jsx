import { useState } from "react";
import AuditTab from "../components/AuditTab";
import { useAuditLog } from "../contexts/AuditContext";
import { useAppStore } from "../stores/appStore";
import { LANG } from "../constants";

export default function AuditPage() {
  const audit = useAuditLog();
  const lang = useAppStore((s) => s.lang);
  const t = LANG[lang];
  const [auditFilter, setAuditFilter] = useState({ action: "ALL", user: "ALL" });

  return <AuditTab audit={audit} lang={lang} t={t} auditFilter={auditFilter} setAuditFilter={setAuditFilter} />;
}
